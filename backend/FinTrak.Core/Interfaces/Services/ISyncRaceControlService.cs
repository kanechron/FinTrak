namespace FinTrak.Core.Interfaces;

public interface ISyncRaceControlService
{
    
    Task<IDisposable> AcquireAsync(Guid plaidItemId, CancellationToken ct = default);
}

