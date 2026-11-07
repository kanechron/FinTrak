namespace FinTrak.Core.Interfaces.Services;

public interface ISyncRaceControlService
{
    
    Task<IDisposable> AcquireAsync(Guid plaidItemId, CancellationToken ct = default);
}

