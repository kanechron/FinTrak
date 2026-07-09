namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents an individual bank account under a Plaid-linked institution.
    /// One PlaidItem can have multiple Accounts (e.g. checking, savings, credit card).
    /// </summary>
    public class Account
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this account belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>The Plaid item (bank connection) this account belongs to.</summary>
        public Guid PlaidItemId { get; set; } = Guid.Empty;

        /// <summary>Navigation property for the parent Plaid item.</summary>
        public PlaidItem? PlaidItem { get; set; }

        /// <summary>Plaid's identifier for this account.</summary>
        public string PlaidAccountId { get; set; } = string.Empty;

        /// <summary>Account name as provided by the institution, e.g. "Chase Total Checking".</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Official account name from Plaid, if available. Often more verbose than Name.</summary>
        public string? OfficialName { get; set; } = null;

        /// <summary>Last 4 digits of the account number, used for display purposes.</summary>
        public string Mask { get; set; } = string.Empty;

        /// <summary>Broad account type as reported by Plaid.</summary>
        public AccountType Type { get; set; } = AccountType.Depository;

        /// <summary>Account subtype as reported by Plaid, e.g. "checking", "savings", "credit card".</summary>
        public string? Subtype { get; set; } = null;

        /// <summary>Current balance as of the last sync. May differ from available balance due to pending transactions.</summary>
        public decimal? CurrentBalance { get; set; } = null;

        /// <summary>Available balance as of the last sync.</summary>
        public decimal? AvailableBalance { get; set; } = null;

        /// <summary>When the balance figures were last updated from Plaid.</summary>
        public DateTime? BalanceLastUpdated { get; set; } = null;

        ///<summary>For linking Goals with Accounts.</summary>
        public List<Goal> LinkedGoals { get; set; } = [];

        /// <summary>When this account record was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Soft delete timestamp. Null means the account is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;
    }

    /// <summary>
    /// Broad account type as defined by Plaid.
    /// </summary>
    public enum AccountType
    {
        Depository = 0,
        Credit = 1,
        Loan = 2,
        Investment = 3
    }
}
