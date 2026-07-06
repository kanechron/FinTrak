using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IAccountRepository
{
    Task<List<Account>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
