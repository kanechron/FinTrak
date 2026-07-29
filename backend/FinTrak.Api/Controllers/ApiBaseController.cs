using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.DTOs;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public abstract class ApiBaseController : ControllerBase
    {
        protected Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        
        protected IActionResult NotFoundError(string? message = null, string? code = null)
        {
            var dto = new ErrorResponseDto();
            dto.Message = message ?? dto.Message;
            dto.Code = code;
            return NotFound(dto);
        }

        protected IActionResult ForbiddenError(string message = "You do not have permission to perform this action.", string? code = null)
        {
            var dto = new ErrorResponseDto { Message = message, Code = code };
            return StatusCode(403, dto);
        }

        protected IActionResult ValidationError(Dictionary<string, List<string>> fields, string message, string? code = null)
        {
            var dto = new ErrorResponseDto { Message = message, Code = code, Fields = fields };
            return BadRequest(dto);
        }

        // Accepts FluentValidation's ValidationResult.ToDictionary() output directly, so callers
        // don't have to convert string[] to List<string> themselves before calling this.
        protected IActionResult ValidationError(IDictionary<string, string[]> fields, string message, string? code = null)
        {
            var converted = fields.ToDictionary(f => f.Key, f => f.Value.ToList());
            return ValidationError(converted, message, code);
        }

        // Single-field shortcut for a targeted check that isn't a full FluentValidation run.
        protected IActionResult ValidationError(string field, string message, string? code = null)
        {
            var fields = new Dictionary<string, List<string>> { [field] = [message] };
            return ValidationError(fields, message, code);
        }

        // No specific field — for a validation failure tied to a cross-field rule rather than one property.
        protected IActionResult ValidationError(string message, string? code = null)
        {
            var dto = new ErrorResponseDto { Message = message, Code = code };
            return BadRequest(dto);
        }

        protected IActionResult ServerError(string message = "An unexpected error occurred.", string? code = null)
        {
            var dto = new ErrorResponseDto { Message = message, Code = code };
            return StatusCode(500, dto);
        }
    }
}