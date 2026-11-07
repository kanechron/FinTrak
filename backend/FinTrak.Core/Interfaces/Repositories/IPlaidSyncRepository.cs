
using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces.Repositories;

public interface IPlaidSyncRepository
{
    Task<List<PlaidItem>?> GetPlaidItems(Guid userId, CancellationToken ct);
}