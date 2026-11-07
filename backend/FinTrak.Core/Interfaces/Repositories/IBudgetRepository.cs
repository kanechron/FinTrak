using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IBudgetRepository
{
    Task<List<Budget>> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Budget?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, decimal>> GetSpendingPerBudgetAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Budget budget, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
