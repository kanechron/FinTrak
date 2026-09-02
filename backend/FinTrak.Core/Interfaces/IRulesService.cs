using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IRulesService
{
    Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Rule?> GetRuleAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Throws <see cref="InvalidOperationException"/> if Target is unset or the (UserId, Target, Priority) triple is already taken.</summary>
    Task CreateRuleAsync(Rule rule, CancellationToken cancellationToken = default);

    Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default);
}
