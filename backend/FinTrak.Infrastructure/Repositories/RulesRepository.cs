using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.DTOs;

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

    public async Task<Rule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Rules.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<bool> PriorityExistsAsync(Guid userId, TargetType targetType, int priority, Guid? excludeRuleId = null, CancellationToken cancellationToken = default) =>
        await _db.Rules.AnyAsync(r =>
            r.UserId == userId &&
            r.Target == targetType &&
            r.Priority == priority &&
            r.Id != excludeRuleId, cancellationToken);

    public async Task<List<Rule>> GetRulesForBulkUpdateAsync(Guid userId, List<Guid> ruleIds, CancellationToken cancellationToken = default) =>
        await _db.Rules.Where(r => r.UserId == userId && ruleIds.Contains(r.Id)).ToListAsync(cancellationToken);

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
