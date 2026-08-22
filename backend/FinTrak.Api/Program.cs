using FinTrak.Infrastructure.Persistance;
using FinTrak.Infrastructure.BackgroundServices;
using Serilog;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using FinTrak.Api.Middleware;
using Going.Plaid;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.BackgroundServices;
using Microsoft.AspNetCore.HttpOverrides;
using Anthropic.SDK;
using FinTrak.Infrastructure.Services;
using FinTrak.Infrastructure.Repositories;
using FinTrak.Core.Interfaces;
using FluentValidation;
using System.Threading.RateLimiting;
using System.Globalization;
using Microsoft.AspNetCore.RateLimiting;

// Load environment variables from .env before anything else.
// All configuration (DB, auth, Plaid, etc.) is sourced from environment variables,
// never hardcoded or committed to source control.
LoadEnv();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0
            }));

    options.AddPolicy("expensive", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("export", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.AddPolicy("report", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.RejectionStatusCode = 429;
});


// -------------------------------------------------------------------------
// Background services
//--------------------------------------------------------------------------
// Hosted services run in the background alongside the main web server. They are ideal for tasks that need to run periodically or continuously, such as cleaning up old records from the database.
builder.Services.AddHostedService<DbDeleteService>();  // custom service to permanently delete soft-deleted records after a retention period
builder.Services.AddHostedService<RecurringDateService>();
builder.Services.AddHostedService<BillsAutoDetectService>();


// -------------------------------------------------------------------------
// Services
// -------------------------------------------------------------------------

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddScoped<IPdfImportService, PdfImportService>();
builder.Services.AddScoped<ITransactionNameMatchService, TransactionNameMatchService>();
builder.Services.AddScoped<IBillDetectionService, BillDetectionService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IAccountManagementService, DeleteUserAccountService>();
builder.Services.AddScoped<ILTEReportService, LTEReportService>();
builder.Services.AddScoped<ISADReportService, SADReportService>();

builder.Services.AddSingleton<ISyncRaceControlService, SyncRaceControlService>();





// -------------------------------------------------------------------------
// Repositories
// -------------------------------------------------------------------------
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IBillRepository, BillRepository>();
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<IGoalRepository, GoalRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IAccountReactivationRepository, UserRepostory>();
builder.Services.AddScoped<IReportsRepository, ReportsRepository>();


// -------------------------------------------------------------------------
// Database
// -------------------------------------------------------------------------
// Build the Npgsql connection string from environment variables.
// POSTGRES_HOST and POSTGRES_PORT are optional — they default to localhost:5432
// for local development but can be overridden for cloud deployments.
var connectionString =
    $"Host={Env("POSTGRES_HOST", "localhost")};" +
    $"Port={Env("POSTGRES_PORT", "5432")};" +
    $"Database={Env("POSTGRES_DB")};" +
    $"Username={Env("POSTGRES_USER")};" +
    $"Password={Env("POSTGRES_PASSWORD")}";

builder.Services.AddHealthChecks().AddNpgSql(connectionString);

builder.Services.AddDbContext<FinTrakDbContext>(opt => opt.UseNpgsql(connectionString)
    
);

// -------------------------------------------------------------------------
// Plaid
// -------------------------------------------------------------------------
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Plaid:ClientId"] = Env("PLAID_CLIENT_ID"),
    ["Plaid:Secret"] = Env("PLAID_SECRET"),
    ["Plaid:Environment"] = Env("PLAID_ENVIRONMENT") switch
    {
        "sandbox" => "Sandbox",
        "development" => "Development",
        "production" => "Production",
        _ => throw new InvalidOperationException("Invalid PLAID_ENVIRONMENT value.")
    }
});

builder.Services.AddPlaid(builder.Configuration);


// ------------------------------------------------------------------------
// Claude API
// ------------------------------------------------------------------------
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Anthropic:ApiKey"] = Env("ANTHROPIC_API_KEY"),
    // ["Anthropic:AuthToken"] = Env("ANTHROPIC_AUTH_TOKEN"),
    ["Anthropic:BaseUrl"] = Env("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
});

builder.Services.AddSingleton(new AnthropicClient(builder.Configuration["Anthropic:ApiKey"]!));



// -------------------------------------------------------------------------
// AutoMapper
// -------------------------------------------------------------------------
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<FinTrak.Api.Mappings.TransactionProfile>();
    cfg.AddProfile<FinTrak.Api.Mappings.BillProfile>();
    cfg.AddProfile<FinTrak.Api.Mappings.GoalProfile>();
    cfg.AddProfile<FinTrak.Api.Mappings.CategoryProfile>();
    cfg.AddProfile<FinTrak.Api.Mappings.AccountProfile>();
});



// -------------------------------------------------------------------------
// Authentication
// -------------------------------------------------------------------------
// Cookie-based authentication. The auth cookie is HTTP-only and Secure so it
// is never accessible to JavaScript and is only sent over HTTPS.
// Google OAuth is handled manually in AuthController using the PKCE flow —
// tokens never leave the server; only the cookie is sent to the client.
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.ExpireTimeSpan = TimeSpan.FromHours(1);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// -------------------------------------------------------------------------
// Session
// -------------------------------------------------------------------------
// Session is used during the OAuth login flow to temporarily store the PKCE
// code_verifier between the /auth/login redirect and the /auth/callback.
// It is not used as a general-purpose session store.
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.IdleTimeout = TimeSpan.FromMinutes(15);  // session only needs to survive the login round-trip
});

// -------------------------------------------------------------------------
// API infrastructure
// -------------------------------------------------------------------------
builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(options =>
    {
        // Override the default model validation error response to return a 400 with a JSON body instead of a 422 with an HTML body.
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value!.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            var result = new
            {
                error = "Invalid request data.",
                details = errors
            };

            return new BadRequestObjectResult(result);
        };
    });
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FinTrak API", Version = "v1" });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// -------------------------------------------------------------------------
// Middleware pipeline
// -------------------------------------------------------------------------
// Order matters here — each middleware runs in the order it is registered.



if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "FinTrak API v1"));
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

// Serve static files from wwwroot (e.g. test-plaid.html).
app.UseStaticFiles();

// Session must come before Authentication so the session cookie is available
// when the auth middleware runs (needed for PKCE code_verifier lookup).
app.UseSession();

app.UseRateLimiter();

app.UseAuthentication();


app.UseMiddleware<ErrorHandlingMiddleware>();  // custom middleware to catch unhandled exceptions and return JSON error responses instead of crashing the server
app.UseMiddleware<SilentRefreshMiddleware>();  // custom middleware to transparently renew auth cookies using refresh tokens

app.UseAuthorization();
app.MapControllers();

app.MapHealthChecks("/health").AllowAnonymous().DisableRateLimiting();

app.Run();

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/// <summary>
/// Walks up the directory tree from the current working directory to find
/// and load a .env file, setting each key-value pair as an environment variable.
/// Handles inline # comments and quoted values.
/// </summary>
static void LoadEnv()
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir != null)
    {
        var path = Path.Combine(dir.FullName, ".env");
        if (File.Exists(path))
        {

            foreach (var line in File.ReadAllLines(path))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;

                var sep = trimmed.IndexOf('=');
                if (sep < 0) continue;

                var key = trimmed[..sep].Trim();
                var rawValue = trimmed[(sep + 1)..].Trim();

                // Quoted values preserve everything inside the quotes.
                // Unquoted values treat # as an inline comment delimiter (matches Docker Compose behaviour).
                var value = rawValue.StartsWith('"') || rawValue.StartsWith('\'')
                    ? rawValue.Trim('"').Trim('\'')
                    : rawValue.IndexOf('#') >= 0
                        ? rawValue[..rawValue.IndexOf('#')].TrimEnd()
                        : rawValue;

                if (System.Environment.GetEnvironmentVariable(key) == null)
                    System.Environment.SetEnvironmentVariable(key, value);
            }
            return;
        }
        dir = dir.Parent;
    }
}

/// <summary>
/// Reads a required environment variable. Throws if the variable is not set
/// and no fallback is provided, so misconfiguration is caught at startup.
/// </summary>
static string Env(string key, string? fallback = null) =>
    System.Environment.GetEnvironmentVariable(key)
    ?? fallback
    ?? throw new InvalidOperationException($"Required environment variable '{key}' is not set.");