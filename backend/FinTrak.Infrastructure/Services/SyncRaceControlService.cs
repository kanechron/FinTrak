
using System.Collections.Concurrent;
using FinTrak.Core.Interfaces;

namespace FinTrak.Infrastructure.Services
{
    
    public class SyncRaceControlService : ISyncRaceControlService
    {
        private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _cd = new();

        public async Task<IDisposable> AcquireAsync(Guid plaidItemId, CancellationToken ct)
        {
            
            var semaphore = _cd.GetOrAdd(plaidItemId, _ => new SemaphoreSlim(1, 1));
            await semaphore.WaitAsync(ct);
            return new Releaser(semaphore);
        }

        private readonly struct Releaser(SemaphoreSlim semaphore) : IDisposable
        {
            private readonly SemaphoreSlim _semaphore = semaphore;

            public void Dispose()
            {
                _semaphore.Release();
            }
        }

    }

    
}


