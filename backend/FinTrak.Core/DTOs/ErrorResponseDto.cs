
namespace FinTrak.Core.DTOs
{
    public class ErrorResponseDto
    {
        public string Message { get; set; } = "Resource not found";
        public string? Code { get; set; } = null;
        public Dictionary<string, List<string>>? Fields {get; set; } = null;
    }
}