namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a financial transaction, sourced either from Plaid or entered manually.
    /// </summary>
    public class Transaction
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this transaction belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>The account this transaction was made on.</summary>
        public Guid AccountId { get; set; } = Guid.Empty;

        /// <summary>Plaid's identifier for this transaction. Empty for manual entries.</summary>
        public string? PlaidTransactionId { get; set; } = string.Empty;

        /// <summary>Transaction amount. Positive = debit (money out), negative = credit (money in).</summary>
        public decimal? Amount { get; set; } = 0m;

        /// <summary>Raw merchant name as provided by Plaid, before normalization.</summary>
        public string MerchantNameRaw { get; set; } = string.Empty;

        /// <summary>Normalized merchant name after the dedup pipeline has run.</summary>
        public string MerchantName { get; set; } = string.Empty;

        /// <summary>FK to the assigned category. Null until categorized.</summary>
        public Guid? CategoryId { get; set; } = null;

        /// <summary>Navigation property for the assigned category.</summary>
        public Category? Category { get; set; }

        /// <summary>Optional user-facing description or note.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>True if the transaction has not yet settled with the bank.</summary>
        public bool IsPending { get; set; } = false;

        /// <summary>True if the transaction was entered manually rather than pulled from Plaid.</summary>
        public bool IsManual { get; set; } = false;

        /// <summary>Hash used by the deduplication pipeline to detect duplicate transactions.</summary>
        public string DedupHash { get; set; } = string.Empty;

        /// <summary>Outcome of the deduplication pipeline for this transaction.</summary>
        public DedupStatus DedupStatus { get; set; } = DedupStatus.Accepted;

        /// <summary>When the transaction record was created in the database.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Soft delete timestamp. Null means the transaction is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;

        /// <summary>The date the transaction occurred, as reported by the bank.</summary>
        public DateOnly? Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    }
}
