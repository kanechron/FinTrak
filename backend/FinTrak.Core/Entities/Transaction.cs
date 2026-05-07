namespace FinTrak.Core.Entities
{
    
    public class Transaction
    {
        public Guid Id { get; set; } = Guid.Empty;
        public Guid UserId { get; set; } = Guid.Empty;
        public Guid AccountId { get; set; } = Guid.Empty;
        public string PlaidTransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; } = 0m;
        public string MerchantNameRaw { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public Guid CategoryId { get; set; } = Guid.Empty;
        public Category? Category { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsPending { get; set; } = false;
        public bool IsManual { get; set; } = false;
        public string DedupHash { get; set; } = string.Empty;
        public string DedupStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; } = null;
        public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    }
}