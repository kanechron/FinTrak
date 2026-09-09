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

    public Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default) =>
        _repo.DeleteAsync(rule, cancellationToken);

    public Dictionary<TargetType, RuleFieldMapDto> GetRuleFieldMapSync() => _fieldMap;
}
