

namespace FinTrak.Core.Exceptions;

public abstract class AppException(int statusCode, string message, string? code = null) : Exception(message)
{
    public int StatusCode {get;} = statusCode;
    public string? Code { get; } = code;
}
