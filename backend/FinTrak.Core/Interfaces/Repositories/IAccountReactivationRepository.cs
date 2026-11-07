using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface IAccountReactivationRepository
{
    Task<User?> ReactivateAccount(Guid userId, CancellationToken ct = default); 
}