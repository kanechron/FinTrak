using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IBillRepository
{
    Task<List<Bill>> GetByUserIdAsync(Guid userId);
    Task<Bill?> GetByIdAsync(Guid id);
    Task AddAsync(Bill bill);
    Task SaveAsync();
}
