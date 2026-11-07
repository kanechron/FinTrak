using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface ISettingRepository
{
    /// <summary>The user's active settings row, or null if none exists.</summary>
    Task<Setting?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    /// <summary>The user's settings row even if soft-deleted. UserId is unique, so a deleted row has to be restored rather than re-added.</summary>
    Task<Setting?> GetByUserIdIncludingDeletedAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Setting setting, CancellationToken cancellationToken = default);
    Task SaveAsync(CancellationToken cancellationToken = default);
}
