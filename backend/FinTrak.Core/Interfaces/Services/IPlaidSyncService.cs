
namespace FinTrak.Core.Interfaces.Services;

public interface IPlaidSyncService
{
    public Task<List<Guid>> SyncAsync(Guid userId, CancellationToken ct);
}