using FinTrak.Core.Entities;
using Microsoft.VisualBasic;

namespace FinTrak.Core.Interfaces;

public interface IGoalRepository
{
    Task<List<Goal>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Goal?> GetByIdAsync(Guid userId, Guid goalId, CancellationToken cancellationToken = default);
    Task<int> GetMaxPriorityAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Goal goal, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
    Task UpdateGoalPrioritiesAsync(Guid userId, Guid goalId, int oldPriority, int newPriority, CancellationToken cancellationToken);
}
