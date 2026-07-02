using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class TransactionRepository(FinTrakDbContext db) : ITransactionRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, int? offset = null, int? limit = null)
    {
        var query = _db.Transactions
            .Where(t => t.DeletedAt == null && t.UserId == userId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date);

        return (limit == null || limit == 0)
            ? await query.ToListAsync()
            : await query.Skip(offset ?? 0).Take(limit.Value).ToListAsync();
    }

    public async Task<List<Transaction>> GetByCategoryIdAsync(Guid categoryId) =>
        await _db.Transactions
            .Where(t => t.DeletedAt == null && t.CategoryId == categoryId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

    public async Task<Transaction?> GetByIdAsync(Guid id) =>
        await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

    public async Task AddAsync(Transaction transaction)
    {
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();
    }

    public async Task SaveAsync() => await _db.SaveChangesAsync();
}
