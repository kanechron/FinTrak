namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Tracks a Plaid transaction sync job for a given item.
    /// </summary>
    public class SyncQueue
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this sync job belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>The Plaid item being synced.</summary>
        public Guid PlaidItemId { get; set; } = Guid.Empty;

        /// <summary>Navigation property for the associated Plaid item.</summary>
        public PlaidItem? PlaidItem { get; set; }

        /// <summary>Current state of the sync job.</summary>
        public SyncStatus Status { get; set; } = SyncStatus.Pending;

        /// <summary>Error detail if the sync job failed.</summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>When the sync job was queued.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>When the sync job began processing. Null if not yet started.</summary>
        public DateTime? StartedAt { get; set; } = null;

        /// <summary>When the sync job finished, regardless of outcome. Null if not yet complete.</summary>
        public DateTime? CompletedAt { get; set; } = null;
    }

    /// <summary>
    /// Processing state of a sync job.
    /// </summary>
    public enum SyncStatus
    {
        /// <summary>Job is queued and waiting to be processed.</summary>
        Pending = 0,

        /// <summary>Job is currently being processed.</summary>
        InProgress = 1,

        /// <summary>Job completed successfully.</summary>
        Complete = 2,

        /// <summary>Job failed. See ErrorMessage for details.</summary>
        Failed = 3
    }
}
