using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class BudgetRepository(FinTrakDbContext db) : IBudgetRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Budget>> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Budgets
            .Where(b => b.DeletedAt == null && b.IsActive && b.UserId == userId)
            .Include(b => b.Category)
            .ToListAsync(cancellationToken);

    public async Task<Budget?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, cancellationToken);

    public async Task<Dictionary<Guid, decimal>> GetSpendingByCategoryAsync(Guid userId, List<Guid> categoryIds, CancellationToken cancellationToken = default) =>
        await _db.Transactions
            .Where(t => t.DeletedAt == null && t.Amount > 0 && t.UserId == userId && categoryIds.Contains(t.CategoryId!.Value))
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => (decimal?)t.Amount) ?? 0m })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Total, cancellationToken);

    public async Task AddAsync(Budget budget, CancellationToken cancellationToken = default)
    {
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
