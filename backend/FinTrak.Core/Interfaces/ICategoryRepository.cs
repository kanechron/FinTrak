using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Category>> GetParentsAsync(CancellationToken cancellationToken = default);
    Task<List<Category>> GetDetailedAsync(CancellationToken cancellationToken = default);
}
