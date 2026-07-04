namespace FinTrak.Core.DTOs
{
    public class AccountDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public string Type { get; init; } = "";
        public string? Last4 { get; init; }
        public decimal Balance { get; init; }
    }
}
