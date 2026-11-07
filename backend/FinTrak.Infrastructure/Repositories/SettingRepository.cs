using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces.Repositories;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class SettingRepository(FinTrakDbContext db) : ISettingRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<Setting?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Settings
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DeletedAt == null, cancellationToken);

    public async Task<Setting?> GetByUserIdIncludingDeletedAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Settings
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

    public async Task AddAsync(Setting setting, CancellationToken cancellationToken = default)
    {
        _db.Settings.Add(setting);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
