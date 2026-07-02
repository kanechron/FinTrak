using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class GoalRepository(FinTrakDbContext db) : IGoalRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Goal>> GetByUserIdAsync(Guid userId) =>
        await _db.Goals
            .Where(g => g.DeletedAt == null && g.UserId == userId)
            .Include(g => g.LinkedAccounts)
            .OrderBy(g => g.Priority)
            .ToListAsync();

    public async Task<Goal?> GetByIdAsync(Guid id) =>
        await _db.Goals
            .Include(g => g.LinkedAccounts)
            .FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null);

    public async Task<int> GetMaxPriorityAsync() =>
        await _db.Goals
            .Where(g => g.DeletedAt == null)
            .Select(g => (int?)g.Priority)
            .MaxAsync() ?? -1;

    public async Task AddAsync(Goal goal)
    {
        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();
    }

    public async Task SaveAsync() => await _db.SaveChangesAsync();
}
