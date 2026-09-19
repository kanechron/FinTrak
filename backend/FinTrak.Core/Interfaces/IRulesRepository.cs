using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IRulesRepository
{
    Task<List<Rule>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Rule>> GetByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default);
    Task<Rule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Fetches the subset of <paramref name="ruleIds"/> owned by <paramref name="userId"/>, tracked by the context, ready for in-place mutation and a single <see cref="SaveAsync"/>.</summary>
    Task<List<Rule>> GetRulesForBulkUpdateAsync(Guid userId, List<Guid> ruleIds, CancellationToken cancellationToken = default);

    /// <summary>Checks for an existing rule at the same (UserId, TargetType, Priority). Pass the rule's own Id via <paramref name="excludeRuleId"/> when updating, so it doesn't collide with itself.</summary>
    Task<bool> PriorityExistsAsync(Guid userId, TargetType targetType, int priority, Guid? excludeRuleId = null, CancellationToken cancellationToken = default);

    Task AddAsync(Rule rule, CancellationToken cancellationToken = default);
    Task DeleteAsync(Rule rule, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
