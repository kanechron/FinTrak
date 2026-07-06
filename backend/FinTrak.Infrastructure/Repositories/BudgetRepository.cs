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

    public async Task<Dictionary<Guid, decimal>> GetSpendingPerBudgetAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Budgets
            .Where(b => b.UserId == userId && b.DeletedAt == null && b.IsActive && b.CategoryId != null)
            .Select(b => new
            {
                b.Id,
                Spent = _db.Transactions
                    .Where(t =>
                        t.DeletedAt == null &&
                        t.Amount > 0 &&
                        t.UserId == userId &&
                        t.CategoryId == b.CategoryId &&
                        t.Date >= b.StartDate &&
                        (b.EndDate == null || t.Date <= b.EndDate))
                    .Sum(t => (decimal?)t.Amount) ?? 0m
            })
            .ToDictionaryAsync(x => x.Id, x => x.Spent, cancellationToken);

    public async Task AddAsync(Budget budget, CancellationToken cancellationToken = default)
    {
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
