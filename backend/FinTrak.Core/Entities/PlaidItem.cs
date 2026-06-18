namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a user's connection to a bank institution via Plaid.
    /// One PlaidItem per linked bank; each item can have multiple Accounts.
    /// </summary>
    public class PlaidItem
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user who linked this institution.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>Plaid's identifier for this item.</summary>
        public string PlaidItemId { get; set; } = string.Empty;

        /// <summary>Plaid access token used to make API calls for this institution. Treat as a secret — encrypt at rest.</summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>Plaid's identifier for the institution, e.g. "ins_3" for Chase.</summary>
        public string InstitutionId { get; set; } = string.Empty;

        /// <summary>Human-readable institution name, e.g. "Chase".</summary>
        public string InstitutionName { get; set; } = string.Empty;

        /// <summary>Cursor used by /transactions/sync to resume from the last sync position. Null means no sync has run yet.</summary>
        public string? TransactionCursor { get; set; } = null;

        /// <summary>When transactions were last successfully synced for this item.</summary>
        public DateTime? LastSyncedAt { get; set; } = null;

        /// <summary>When this item was linked.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Soft delete timestamp. Null means the item is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;

        /// <summary>Current health of this Plaid connection.</summary>
        public PlaidItemStatus Status { get; set; } = PlaidItemStatus.Active;

        /// <summary>Last Plaid error code if Status is Error or NeedsReauth, e.g. "ITEM_LOGIN_REQUIRED".</summary>
        public string? ErrorCode { get; set; } = null;
    }

    /// <summary>
    /// Health status of a Plaid item connection.
    /// </summary>
    public enum PlaidItemStatus
    {
        /// <summary>Connection is healthy and syncing normally.</summary>
        Active = 0,

        /// <summary>Plaid returned an error on the last sync attempt.</summary>
        Error = 1,

        /// <summary>User must re-authenticate through Plaid Link to restore the connection.</summary>
        NeedsReauth = 2
    }
}
