using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class TransactionRepository(FinTrakDbContext db) : ITransactionRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default)
    {
        IQueryable<Transaction> query = _db.Transactions
            .Where(t => t.DeletedAt == null && t.UserId == userId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date);

        if (fromDate.HasValue) query = query.Where(t => t.Date >= fromDate);
        if (toDate.HasValue) query = query.Where(t => t.Date <= toDate);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<Transaction>> GetByCategoryIdAsync(Guid userId, Guid categoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        IQueryable<Transaction> query = _db.Transactions
            .Where(t => t.DeletedAt == null && t.UserId == userId && t.CategoryId == categoryId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date);
 
        if (from.HasValue) query = query.Where(t => t.Date >= from);
        if (to.HasValue) query = query.Where(t => t.Date <= to);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<Transaction>> GetByDetailedCategoryIdAsync(Guid userId, Guid detailedCategoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        IQueryable<Transaction> query = _db.Transactions
            .Where(t => t.DeletedAt == null && t.UserId == userId && t.CategoryDetailedId == detailedCategoryId)
            .Include(t => t.Category)
            .Include(t => t.CategoryDetailed)
            .OrderByDescending(t => t.Date);

        if (from.HasValue) query = query.Where(t => t.Date >= from);
        if (to.HasValue) query = query.Where(t => t.Date <= to);
        return await query.ToListAsync(cancellationToken);
    }

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
