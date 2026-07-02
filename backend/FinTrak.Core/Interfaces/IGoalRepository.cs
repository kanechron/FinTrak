using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IGoalRepository
{
    Task<List<Goal>> GetByUserIdAsync(Guid userId);
    Task<Goal?> GetByIdAsync(Guid id);
    Task<int> GetMaxPriorityAsync();
    Task AddAsync(Goal goal);
    Task SaveAsync();
}
