namespace FinTrak.Core.Exceptions;

/// <summary>The requested thing doesn't exist (or isn't visible to this user). Always a 404.</summary>
public class BadRequestException(string message, string? code = null) : AppException(400, message, code);
public class ActionForbiddenExceiption(string message, string? code = null) : AppException(403, message, code);
public class NotFoundException(string message, string? code = null) : AppException(404, message, code);
public class ConflictException(string message, string? code = null) : AppException(409, message, code);
public class PlaidRevocationException(string message, string? code = null) : AppException(502, message, code);



