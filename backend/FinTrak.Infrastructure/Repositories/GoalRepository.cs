using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.VisualBasic;
using FinTrak.Core.Exceptions;

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

    public async Task<Goal?> GetByIdAsync(Guid userId, Guid goalId, CancellationToken cancellationToken = default) =>
        await _db.Goals
            .Include(g => g.LinkedAccounts)
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId && g.DeletedAt == null, cancellationToken);

    public async Task<int> GetMaxPriorityAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Goals
            .Where(g => g.DeletedAt == null && g.UserId == userId)
            .Select(g => (int?)g.Priority)
            .MaxAsync(cancellationToken) ?? 0;

    public async Task UpdateGoalPrioritiesAsync(Guid userId, Guid goalId, int oldPriority, int newPriority, CancellationToken cancellationToken)
       {
        var low = Math.Min(oldPriority, newPriority);
        var high = Math.Max(oldPriority, newPriority);
        var diff = oldPriority - newPriority > 0 ? 1 : -1;

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var temp = await _db.Goals
            .Where(g => g.UserId == userId && g.DeletedAt == null && g.Id == goalId).FirstOrDefaultAsync(cancellationToken: cancellationToken) ?? throw new NotFoundException("Goal not found");

        temp.Priority *= -1;

        await _db.SaveChangesAsync(cancellationToken);

        await _db.Goals
        .Where(g => g.UserId == userId && g.DeletedAt == null && g.Priority >= low && g.Priority <= high && g.Id != goalId)
        .ExecuteUpdateAsync(s => s.SetProperty(g => g.Priority, g => g.Priority * -1), cancellationToken);

        await _db.Goals
        .Where(g => g.UserId == userId && g.DeletedAt == null && g.Priority <= -low && g.Priority >= -high && g.Id != goalId)
        .ExecuteUpdateAsync(s => s.SetProperty(g => g.Priority, g => (g.Priority*-1) + diff), cancellationToken);

        temp.Priority = newPriority;
        await _db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
       }

    public async Task AddAsync(Goal goal, CancellationToken cancellationToken = default)
    {
        _db.Goals.Add(goal);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
