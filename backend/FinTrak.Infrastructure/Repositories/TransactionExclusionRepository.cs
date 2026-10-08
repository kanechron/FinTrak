using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class TransactionExclusionRepository(FinTrakDbContext db) : ITransactionExclusionRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<TransactionExclusion>> GetBySourceAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, CancellationToken cancellationToken = default) =>
        await _db.TransactionExclusions
            .Where(e => e.UserId == userId && e.SourceType == sourceType && e.SourceId == sourceId)
            .ToListAsync(cancellationToken);

    public async Task<List<TransactionExclusion>> GetByTransactionIdsAsync(Guid userId, List<Guid> transactionIds, CancellationToken cancellationToken = default) =>
        await _db.TransactionExclusions
            .Where(e => e.UserId == userId && transactionIds.Contains(e.TransactionId))
            .ToListAsync(cancellationToken);

    public async Task<HashSet<Guid>> GetReceiptedTransactionIdsAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, List<Guid> transactionIds, CancellationToken cancellationToken = default) =>
        (await _db.TransactionExclusions
            .Where(e => e.UserId == userId
                && e.SourceType == sourceType
                && e.SourceId == sourceId
                && transactionIds.Contains(e.TransactionId))
            .Select(e => e.TransactionId)
            .ToListAsync(cancellationToken))
            .ToHashSet();

    public void Add(TransactionExclusion receipt) =>
        _db.TransactionExclusions.Add(receipt);

    public async Task<int> DeleteBySourceAsync(Guid userId, ExclusionSourceType sourceType, Guid? sourceId, CancellationToken cancellationToken = default) =>
        await _db.TransactionExclusions
            .Where(e => e.UserId == userId && e.SourceType == sourceType && e.SourceId == sourceId)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
