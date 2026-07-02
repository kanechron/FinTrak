using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class BudgetRepository(FinTrakDbContext db) : IBudgetRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Budget>> GetActiveByUserIdAsync(Guid userId) =>
        await _db.Budgets
            .Where(b => b.DeletedAt == null && b.IsActive && b.UserId == userId)
            .Include(b => b.Category)
            .ToListAsync();

    public async Task<Budget?> GetByIdAsync(Guid id) =>
        await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null);

    public async Task<Dictionary<Guid, decimal>> GetSpendingByCategoryAsync(Guid userId, List<Guid> categoryIds) =>
        await _db.Transactions
            .Where(t => t.DeletedAt == null && t.Amount > 0 && t.UserId == userId && categoryIds.Contains(t.CategoryId!.Value))
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => (decimal?)t.Amount) ?? 0m })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Total);

    public async Task AddAsync(Budget budget)
    {
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
    }

    public async Task SaveAsync() => await _db.SaveChangesAsync();
}
