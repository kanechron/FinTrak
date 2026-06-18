namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Maps a raw merchant name from Plaid to a normalized display name.
    /// Built up over time by the deduplication pipeline.
    /// </summary>
    public class MerchantAlias
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>Raw merchant string as received from Plaid, e.g. "AMZN MKTP US*2X4K9".</summary>
        public string RawName { get; set; } = string.Empty;

        /// <summary>Normalized merchant name shown to the user, e.g. "Amazon".</summary>
        public string NormalizedName { get; set; } = string.Empty;

        /// <summary>How this alias was determined.</summary>
        public AliasSource Source { get; set; } = AliasSource.RuleBased;

        /// <summary>When this alias was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// How a merchant alias was determined by the deduplication pipeline.
    /// </summary>
    public enum AliasSource
    {
        /// <summary>Matched by a deterministic normalization rule.</summary>
        RuleBased = 0,

        /// <summary>Matched by FuzzySharp similarity scoring.</summary>
        FuzzySharp = 1,

        /// <summary>Matched by Claude Haiku as a fallback for low-confidence cases.</summary>
        Claude = 2
    }
}
