using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Category>> GetParentsAsync(CancellationToken cancellationToken = default);
    Task<List<Category>> GetDetailedAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Stages a new category. Does not save.</summary>
    void Add(Category category);
}
