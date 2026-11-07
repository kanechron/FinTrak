using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface ITransactionRepository
{
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
    Task<List<Transaction>> GetByCategoryIdAsync(Guid userId, Guid categoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);
    Task<List<Transaction>> GetByDetailedCategoryIdAsync(Guid userId, Guid detailedCategoryId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<Transaction>> GetPaginatedTransactions(Guid userId, Guid? lastId, DateOnly? lastDate, DateOnly? from, DateOnly? to, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>Keyset-pages the user's non-deleted transactions in Id order, starting after <paramref name="lastId"/>. Used by RulesService to walk the full history in batches.</summary>
    Task<List<Transaction>> GetPaginatedTransactions(Guid userId, Guid lastId, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>Fetches the subset of <paramref name="ids"/> owned by <paramref name="userId"/>, in one query.</summary>
    Task<List<Transaction>> GetByIdsAsync(Guid userId, List<Guid> ids, CancellationToken cancellationToken = default);

    /// <summary>Fetches the user's transactions matching <paramref name="incomingTransactionIds"/> by Plaid ID, including soft-deleted ones.</summary>
    Task<List<Transaction>> GetIncomingTransactions(Guid userId, List<string?> incomingTransactionIds, CancellationToken cancellationToken = default);

    /// <summary>Fetches the user's non-deleted transactions matching <paramref name="plaidTransactionIds"/>, keyed by Plaid transaction ID.</summary>
    Task<Dictionary<string, Transaction>> GetByPlaidTransactionIdsAsync(Guid userId, IEnumerable<string?> plaidTransactionIds, CancellationToken cancellationToken = default);
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);

    /// <summary>Stages a new transaction. Does not save, unlike <see cref="AddAsync"/>.</summary>
    void Add(Transaction transaction);
    Task SaveAsync(CancellationToken cancellationToken = default);
    void ClearTracker();
}
