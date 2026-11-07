using System.Net;
using System.Text.Json;
using FinTrak.Core.DTOs;
using FinTrak.Core.Exceptions;
using Microsoft.Extensions.Options;

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
            catch (AppException ex)
            {
                logger.LogWarning("{StatusCode} for {Method} {Path}: {Message}", ex.StatusCode, context.Request.Method, context.Request.Path, ex.Message);
                await WriteError(context, ex.StatusCode, ex.Message, ex.Code);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteError(context, (int)HttpStatusCode.InternalServerError, "An unexpected error occurred");
            }
        }

        private static async Task WriteError(HttpContext context, int status, string message, string? code = null)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";

            var body = new ErrorResponseDto() { Message = message, Code = code };
            await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonSerializerOptions.Web));
        }
    }
}
