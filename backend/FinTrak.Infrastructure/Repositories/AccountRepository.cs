using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces.Repositories;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class AccountRepository(FinTrakDbContext db) : IAccountRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Account>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Accounts
            .Where(a => a.DeletedAt == null && a.UserId == userId)
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<string, Account>> GetByPlaidAccountIdsAsync(Guid userId, IEnumerable<string?> plaidAccountIds, CancellationToken cancellationToken = default) =>
        await _db.Accounts
            .Where(a => a.UserId == userId && plaidAccountIds.Contains(a.PlaidAccountId))
            .ToDictionaryAsync(a => a.PlaidAccountId, cancellationToken);

    public void Add(Account account) =>
        _db.Accounts.Add(account);
}
