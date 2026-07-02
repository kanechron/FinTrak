using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IGoalRepository
{
    Task<List<Goal>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Goal?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> GetMaxPriorityAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Goal goal, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
