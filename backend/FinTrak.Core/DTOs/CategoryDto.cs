namespace FinTrak.Core.DTOs
{
    public class CategoryDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public Guid? DetailId { get; init; }
    }
}
