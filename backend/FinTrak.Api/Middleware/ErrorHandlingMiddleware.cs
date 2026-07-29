using System.Net;
using System.Text.Json;

namespace FinTrak.Api.Middleware
{
    public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteError(context, HttpStatusCode.InternalServerError, "An unexpected error occurred");
            }
        }

        private static async Task WriteError(HttpContext context, HttpStatusCode status, string message, string? detail = null)
        {
            context.Response.StatusCode = (int)status;
            context.Response.ContentType = "application/json";

            var body = new { error = message, detail };
            await context.Response.WriteAsync(JsonSerializer.Serialize(body));
        }
    }
}
