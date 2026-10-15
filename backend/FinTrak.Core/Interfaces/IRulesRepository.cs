using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IRulesRepository
{
    Task<List<Rule>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Rule>> GetByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default);
    Task<Rule?> GetByIdAsync(Guid userId, Guid ruleId, CancellationToken cancellationToken = default);

    /// <summary>Highest priority among this user's rules for <paramref name="targetType"/>, or 0 if they have none — new rules get this + 1.</summary>
    Task<int> GetMaxPriorityAsync(Guid userId, TargetType targetType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Moves <paramref name="ruleId"/> from <paramref name="oldPriority"/> to <paramref name="newPriority"/> within the user's
    /// <paramref name="targetType"/> list, shifting only the rules in between. Runs in one transaction.
    /// </summary>
    Task UpdateRulePrioritiesAsync(Guid userId, TargetType targetType, Guid ruleId, int oldPriority, int newPriority, CancellationToken cancellationToken = default);

    Task AddAsync(Rule rule, CancellationToken cancellationToken = default);
    Task DeleteAsync(Rule rule, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
