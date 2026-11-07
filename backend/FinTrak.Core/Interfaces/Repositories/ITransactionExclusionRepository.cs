using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

/// <summary>
/// Reads and writes <see cref="TransactionExclusion"/> receipts. Every method is scoped to <c>userId</c>.
/// </summary>
public interface ITransactionExclusionRepository
{
    /// <summary>All receipts written by one source (e.g. one rule). Used on delete to find exactly which transactions it affected.</summary>
    Task<List<TransactionExclusion>> GetBySourceAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, CancellationToken cancellationToken = default);

    /// <summary>All receipts, from any source, for the given transactions. Used to re-summarize <see cref="Transaction.Exclusions"/> after a source's receipts are removed.</summary>
    Task<List<TransactionExclusion>> GetByTransactionIdsAsync(Guid userId, List<Guid> transactionIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// The subset of <paramref name="transactionIds"/> that this source already has a receipt for, so applying
    /// the same source twice (e.g. a sync after a recursive pass) doesn't hit the unique index.
    /// </summary>
    Task<HashSet<Guid>> GetReceiptedTransactionIdsAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, List<Guid> transactionIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stages a receipt without saving. Saved by the caller's next <c>SaveAsync</c> (on this or any repository
    /// sharing the request's DbContext), so the receipt and the transaction's <c>Exclusions |=</c> land in the same save.
    /// </summary>
    void Add(TransactionExclusion receipt);

    /// <summary>
    /// Deletes every receipt from one source immediately, in a single SQL statement (not part of a later SaveAsync).
    /// Returns the number of rows deleted.
    /// </summary>
    Task<int> DeleteBySourceAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, CancellationToken cancellationToken = default);

    Task SaveAsync(CancellationToken cancellationToken = default);
}
