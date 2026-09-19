using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Core.DTOs;

namespace FinTrak.Infrastructure.Services;

public class RulesService(IRulesRepository repo, Dictionary<TargetType, RuleFieldMapDto> fieldMap) : IRulesService
{
    private readonly IRulesRepository _repo = repo;
    private readonly Dictionary<TargetType, RuleFieldMapDto> _fieldMap = fieldMap;

    public Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _repo.GetByUserIdAsync(userId, cancellationToken);

    public Task<List<Rule>> GetRulesByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default) => _repo.GetByTargetAsync(userId, target);

    public Task<Rule?> GetRuleAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repo.GetByIdAsync(id, cancellationToken);

    public async Task CreateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new InvalidOperationException("Rule.Target is required.");

        if (await _repo.PriorityExistsAsync(rule.UserId, rule.Target.Value, rule.Priority, rule.Id, cancellationToken))
            throw new InvalidOperationException($"Priority {rule.Priority} is already in use for this target type.");

        await _repo.AddAsync(rule, cancellationToken);
    }

    public async Task UpdateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new InvalidOperationException("Rule.Target is required.");

        if (await _repo.PriorityExistsAsync(rule.UserId, rule.Target.Value, rule.Priority, rule.Id, cancellationToken))
            throw new InvalidOperationException($"Priority {rule.Priority} is already in use for this target type.");

        await _repo.SaveAsync(cancellationToken);
    }

    public async Task UpdateRulePriorities(Guid userId, List<RuleDto> rules, CancellationToken cancellationToken)
    {
        if (rules.Select(r => r.Priority).Distinct().Count() != rules.Count)
            throw new InvalidOperationException("Priorities in the reorder list must be unique.");

        var ids = rules.Select(r => r.Id).ToList();
        var existingRules = await _repo.GetRulesForBulkUpdateAsync(userId, ids, cancellationToken);
        var newList = rules.ToDictionary(kvp => kvp.Id, kvp => kvp.Priority);

        // Two-phase write: a straight reorder can require two rules to swap priorities,
        // which EF can't apply in any single order without an intermediate collision on
        // the (UserId, Target, Priority) unique index. First move everything to a
        // guaranteed-negative placeholder (never collides with a real priority, which is
        // always >= 0), save, then set the real values and save again.
        foreach (var rule in existingRules)
        {
            if (newList.TryGetValue(rule.Id, out int foundRule))
            {
                rule.Priority = -(foundRule + 1);
            }
        }
        await _repo.SaveAsync(cancellationToken);

        foreach (var rule in existingRules)
        {
            if (newList.TryGetValue(rule.Id, out int foundRule))
            {
                rule.Priority = foundRule;
            }
        }
        await _repo.SaveAsync(cancellationToken);
    }

    public Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default) =>
        _repo.DeleteAsync(rule, cancellationToken);

    public Dictionary<TargetType, RuleFieldMapDto> GetRuleFieldMapSync() => _fieldMap;
}
