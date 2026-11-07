using Going.Plaid;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories;

public class PlaidSyncRepository(FinTrakDbContext db) : IPlaidSyncRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<PlaidItem>?> GetPlaidItems(Guid userId, CancellationToken ct) => await _db.PlaidItems
                .Where(p => p.UserId == userId).ToListAsync(ct);
}