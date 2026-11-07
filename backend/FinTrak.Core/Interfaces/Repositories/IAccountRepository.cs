using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface IAccountRepository
{
    Task<List<Account>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Fetches the user's accounts matching <paramref name="plaidAccountIds"/>, keyed by Plaid account ID.</summary>
    Task<Dictionary<string, Account>> GetByPlaidAccountIdsAsync(Guid userId, IEnumerable<string?> plaidAccountIds, CancellationToken cancellationToken = default);

    /// <summary>Stages a new account. Does not save.</summary>
    void Add(Account account);
}
