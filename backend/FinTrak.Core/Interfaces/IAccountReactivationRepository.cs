using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface IAccountReactivationRepository
{
    Task<User?> ReactivateAccount(Guid userId, CancellationToken ct = default); 
}