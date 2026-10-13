
using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IGoalsService
{
    Task AddAsync(Guid userId, Goal newGoal, CancellationToken cancellationToken);
    Task DeleteGoalAsync(Guid userId, Guid id, CancellationToken cancellationToken);
    Task<List<Goal>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task UpdateGoalAsync(Guid userId, Guid id, Goal goal, CancellationToken cancellationToken);
    Task UpdateGoalPrioritiesAsync(Guid userId, Guid goalId, int newPriority, CancellationToken cancellationToken);
}