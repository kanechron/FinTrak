using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories;

public class TransactionRepository(FinTrakDbContext db) : ITransactionRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, int? offset = null, int? limit = null, CancellationToken cancellationToken = default)
    {
        var query = _db.Transactions
            .Where(t => t.DeletedAt == null && t.UserId == userId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date);

        return (limit == null || limit == 0)
            ? await query.ToListAsync(cancellationToken)
            : await query.Skip(offset ?? 0).Take(limit.Value).ToListAsync(cancellationToken);
    }

    public async Task<List<Transaction>> GetByCategoryIdAsync(Guid categoryId, CancellationToken cancellationToken = default) =>
        await _db.Transactions
            .Where(t => t.DeletedAt == null && t.CategoryId == categoryId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date)
            .ToListAsync(cancellationToken);

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null, cancellationToken);

    public async Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
