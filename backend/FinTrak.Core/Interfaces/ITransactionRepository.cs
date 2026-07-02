using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface ITransactionRepository
{
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, int? offset = null, int? limit = null);
    Task<List<Transaction>> GetByCategoryIdAsync(Guid categoryId);
    Task<Transaction?> GetByIdAsync(Guid id);
    Task AddAsync(Transaction transaction);
    Task SaveAsync();
}
