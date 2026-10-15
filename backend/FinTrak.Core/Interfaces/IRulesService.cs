using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IRulesService
{
    Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Rule>> GetRulesByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default);
    Task<Rule?> GetRuleAsync(Guid userId, Guid ruleId, CancellationToken cancellationToken = default);

    /// <summary>Throws <see cref="InvalidOperationException"/> if Target is unset or the (UserId, Target, Priority) triple is already taken.</summary>
    Task CreateRuleAsync(Rule rule, CancellationToken cancellationToken = default);

    /// <summary>Throws <see cref="InvalidOperationException"/> if Target is unset or the (UserId, Target, Priority) triple is already taken by a different rule.</summary>
    Task UpdateRuleAsync(Rule rule, CancellationToken cancellationToken = default);

    /// <summary>Moves one rule to <paramref name="newPriority"/> within its target's list, shifting the rules in between (same approach as Goals).</summary>
    Task UpdateRulePriorityAsync(Guid userId, Guid ruleId, int newPriority, CancellationToken cancellationToken = default);

    Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default);

    Dictionary<TargetType, RuleFieldMapDto> GetRuleFieldMapSync();

    Task EvaluateTransactionRulesAsync(Guid userId, List<Guid> lookupList, TriggerType trigger, CancellationToken cancellationToken = default);
    Task ApplyRuleToTransactionHistory(Guid userId, CancellationToken cancellationToken);
    Task ApplyRuleOnDemand(Guid userId, Guid ruleId, CancellationToken cancellationToken);

}
