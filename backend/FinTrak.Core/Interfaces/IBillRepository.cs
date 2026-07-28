using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IBillRepository
{
    Task<List<Bill>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Bill?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Transaction>> GetBillHistoryAsync(Guid userId, Guid billId);
    Task AddAsync(Bill bill, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
