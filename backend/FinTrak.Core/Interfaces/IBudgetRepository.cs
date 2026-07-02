using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IBudgetRepository
{
    Task<List<Budget>> GetActiveByUserIdAsync(Guid userId);
    Task<Budget?> GetByIdAsync(Guid id);
    Task<Dictionary<Guid, decimal>> GetSpendingByCategoryAsync(Guid userId, List<Guid> categoryIds);
    Task AddAsync(Budget budget);
    Task SaveAsync();
}
