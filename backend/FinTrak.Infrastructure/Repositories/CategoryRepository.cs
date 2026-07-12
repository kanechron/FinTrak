using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class CategoryRepository(FinTrakDbContext db) : ICategoryRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Category>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.Categories.ToListAsync(cancellationToken);
    public async Task<List<Category>> GetParentsAsync(CancellationToken cancellationToken = default) =>
        await _db.Categories.Where(c => c.DetailId == null).ToListAsync(cancellationToken);
    public async Task<List<Category>> GetDetailedAsync(CancellationToken cancellationToken = default) =>
        await _db.Categories.Where(c => c.DetailId != null).ToListAsync(cancellationToken);
}
