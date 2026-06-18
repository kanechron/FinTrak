using FinTrak.Infrastructure.Persistance;
using FinTrak.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using FinTrak.Api.Middleware;
using Going.Plaid;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.BackgroundServices;

// Load environment variables from .env before anything else.
// All configuration (DB, auth, Plaid, etc.) is sourced from environment variables,
// never hardcoded or committed to source control.
LoadEnv();

var builder = WebApplication.CreateBuilder(args);


// -------------------------------------------------------------------------
// Background services
//--------------------------------------------------------------------------
// Hosted services run in the background alongside the main web server. They are ideal for tasks that need to run periodically or continuously, such as cleaning up old records from the database.
builder.Services.AddHostedService<DbDeleteService>();
builder.Services.AddHostedService<RecurringDateService>();  // custom service to permanently delete soft-deleted records after a retention period
builder.Services.AddScoped<BillDetectionService>();
builder.Services.AddHostedService<BillsAutoDetectService>();
builder.Services.AddScoped<TransactionNameMatchService>();




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


builder.Services.AddDbContext<FinTrakDbContext>(opt => opt.UseNpgsql(connectionString)
// .LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information)
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
    options.SlidingExpiration = true;   // resets the 1-hour window on each request
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
builder.Services.AddOpenApi();

var app = builder.Build();

// -------------------------------------------------------------------------
// Middleware pipeline
// -------------------------------------------------------------------------
// Order matters here — each middleware runs in the order it is registered.

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

// Serve static files from wwwroot (e.g. test-plaid.html).
app.UseStaticFiles();

// Session must come before Authentication so the session cookie is available
// when the auth middleware runs (needed for PKCE code_verifier lookup).
app.UseSession();

app.UseAuthentication();


app.UseMiddleware<ErrorHandlingMiddleware>();  // custom middleware to catch unhandled exceptions and return JSON error responses instead of crashing the server
app.UseMiddleware<SilentRefreshMiddleware>();  // custom middleware to transparently renew auth cookies using refresh tokens

app.UseAuthorization();
app.MapControllers();

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
