namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Outcome of the deduplication pipeline for a transaction.
    /// </summary>
    public enum DedupStatus
    {
        /// <summary>Transaction was identified as a duplicate and discarded.</summary>
        Discarded = 0,

        /// <summary>Transaction is uncertain and has been flagged for manual review.</summary>
        Flagged = 1,

        /// <summary>Transaction passed deduplication and was accepted into the ledger.</summary>
        Accepted = 2
    }
}
