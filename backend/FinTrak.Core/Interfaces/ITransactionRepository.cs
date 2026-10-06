using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface ITransactionRepository
{
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
    Task<List<Transaction>> GetByCategoryIdAsync(Guid userId, Guid categoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);
    Task<List<Transaction>> GetByDetailedCategoryIdAsync(Guid userId, Guid detailedCategoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<Transaction>> GetPaginatedTransactions(Guid userId, Guid lastId, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>Fetches the subset of <paramref name="ids"/> owned by <paramref name="userId"/>, in one query.</summary>
    Task<List<Transaction>> GetByIdsAsync(Guid userId, List<Guid> ids, CancellationToken cancellationToken = default);
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
    void ClearTracker();
}
