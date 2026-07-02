using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class GoalRepository(FinTrakDbContext db) : IGoalRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Goal>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Goals
            .Where(g => g.DeletedAt == null && g.UserId == userId)
            .Include(g => g.LinkedAccounts)
            .OrderBy(g => g.Priority)
            .ToListAsync(cancellationToken);

    public async Task<Goal?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Goals
            .Include(g => g.LinkedAccounts)
            .FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null, cancellationToken);

    public async Task<int> GetMaxPriorityAsync(CancellationToken cancellationToken = default) =>
        await _db.Goals
            .Where(g => g.DeletedAt == null)
            .Select(g => (int?)g.Priority)
            .MaxAsync(cancellationToken) ?? -1;

    public async Task AddAsync(Goal goal, CancellationToken cancellationToken = default)
    {
        _db.Goals.Add(goal);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
