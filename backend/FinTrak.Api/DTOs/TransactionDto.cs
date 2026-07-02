namespace FinTrak.Api.DTOs
{
    public class TransactionDto
    {
        public Guid Id { get; init; }
        public Guid AccountId { get; init; }
        public string Date { get; init; } = "";
        public string Merchant { get; init; } = "";
        public decimal? Amount { get; init; }
        public string Category { get; init; } = "Uncategorized";
        public string? CategoryDetailed { get; init; }
        public Guid? CategoryId { get; init; }
        public Guid? CategoryDetailedId { get; init; }
        public bool Pending { get; init; }
    }
}
