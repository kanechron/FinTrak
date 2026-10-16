namespace FinTrak.Core.Entities;

/// <summary>
/// A "receipt" recording that one source (e.g. a rule) excluded one transaction from one or more places.
/// <see cref="Transaction.Exclusions"/> is always the bitwise OR of <see cref="Flags"/> across every
/// receipt for that transaction — so removing a source means deleting its receipts and re-summarizing
/// only the transactions those receipts named, with no condition re-matching.
/// </summary>
public class TransactionExclusion
{
    /// <summary>Internal primary key.</summary>
    public Guid Id { get; set; } = Guid.Empty;

    /// <summary>The user who owns both the transaction and the source. Every query filters by this.</summary>
    public Guid UserId { get; set; } = Guid.Empty;

    /// <summary>The transaction this receipt excludes.</summary>
    public Guid TransactionId { get; set; } = Guid.Empty;

    /// <summary>Navigation property for the excluded transaction.</summary>
    public Transaction? Transaction { get; set; }

    /// <summary>What kind of thing created this receipt. Determines how <see cref="SourceId"/> is interpreted.</summary>
    public ExclusionSourceType SourceType { get; set; } = ExclusionSourceType.Undefined;

    /// <summary>
    /// Id of the specific source (e.g. the Rule's Id when <see cref="SourceType"/> is <see cref="ExclusionSourceType.Rule"/>).<br />
    /// Null for sources that aren't a stored entity, such as a future manual exclusion. <br /> Not a foreign key,
    /// since it can point at different tables depending on <see cref="SourceType"/>.
    /// </summary>
    public Guid? SourceId { get; set; } = null;

    /// <summary>The exclusion bits this source set on this transaction.</summary>
    public Exclusion Flags { get; set; } = Exclusion.None;

    /// <summary>When the receipt was written.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Where a <see cref="TransactionExclusion"/> receipt came from.</summary>
public enum ExclusionSourceType
{
    Undefined = 0,
    Rule = 1,
}
