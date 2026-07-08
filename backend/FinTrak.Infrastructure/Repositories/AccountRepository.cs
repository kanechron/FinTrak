using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories;

public class AccountRepository(FinTrakDbContext db) : IAccountRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Account>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Accounts
            .Where(a => a.DeletedAt == null && a.UserId == userId)
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);
}
