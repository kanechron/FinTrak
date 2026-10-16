using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.DTOs;
using FinTrak.Core.Exceptions;

namespace FinTrak.Infrastructure.Repositories;

public class RulesRepository(FinTrakDbContext db) : IRulesRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Rule>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Rules
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Priority)
            .ToListAsync(cancellationToken);

    public async Task<List<Rule>> GetByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default) =>
        await _db.Rules
            .Where(r => 
            r.UserId == userId &&
            r.Target.ToString() == target)
            .OrderBy(r => r.Priority)
            .ToListAsync(cancellationToken);

    public async Task<Rule?> GetByIdAsync(Guid userId, Guid ruleId, CancellationToken cancellationToken = default) =>
        await _db.Rules.FirstOrDefaultAsync(r => r.Id == ruleId && r.UserId == userId, cancellationToken);

    public async Task<int> GetMaxPriorityAsync(Guid userId, TargetType targetType, CancellationToken cancellationToken = default) =>
        await _db.Rules
            .Where(r => r.UserId == userId && r.Target == targetType)
            .Select(r => (int?)r.Priority)
            .MaxAsync(cancellationToken) ?? 0;

    public async Task UpdateRulePrioritiesAsync(Guid userId, TargetType targetType, Guid ruleId, int oldPriority, int newPriority, CancellationToken cancellationToken = default)
    {
        var low = Math.Min(oldPriority, newPriority);
        var high = Math.Max(oldPriority, newPriority);
        var diff = oldPriority - newPriority > 0 ? 1 : -1;

        // Same steps as GoalRepository.UpdateGoalPrioritiesAsync, scoped by Target as well (the unique index is per
        // UserId + Target). Placeholders are -(p + 1) rather than -p so priority 0 still gets a distinct negative,
        // which keeps this safe even before Rules are renumbered to start at 1.
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        var moved = await _db.Rules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.UserId == userId && r.Target == targetType && r.DeletedAt == null, cancellationToken)
            ?? throw new NotFoundException("Rule not found");

        // 1. Move the dragged rule out of the way so its old slot is free.
        moved.Priority = -(moved.Priority + 1);
        await _db.SaveChangesAsync(cancellationToken);

        // 2. Range (excluding the moved rule) → placeholders.
        await _db.Rules
            .Where(r => r.UserId == userId && r.Target == targetType && r.DeletedAt == null
                && r.Priority >= low && r.Priority <= high && r.Id != ruleId)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Priority, r => -(r.Priority + 1)), cancellationToken);

        // 3. Placeholders → original value shifted by one. Bounds are the placeholder range, so only this move's rows match.
        await _db.Rules
            .Where(r => r.UserId == userId && r.Target == targetType && r.DeletedAt == null
                && r.Priority <= -(low + 1) && r.Priority >= -(high + 1) && r.Id != ruleId)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Priority, r => -r.Priority - 1 + diff), cancellationToken);

        // 4. Dragged rule lands in its new slot.
        moved.Priority = newPriority;
        await _db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }



    public async Task AddAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        _db.Rules.Add(rule);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        rule.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
