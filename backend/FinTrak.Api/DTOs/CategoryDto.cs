namespace FinTrak.Api.DTOs
{
    public class CategoryDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public Guid? DetailId { get; init; }
    }
}
