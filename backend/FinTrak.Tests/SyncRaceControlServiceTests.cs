using FinTrak.Infrastructure.Services;

namespace FinTrak.Tests;

public class SyncRaceControlServiceTests
{
    //Marks a text xUnit should run. xUnit specific.
    [Fact]
    public async Task AcquireAsync_ForSameId_NeverAllowsConcurrentAccess()
    {
        var sut = new SyncRaceControlService();
        var itemId = Guid.NewGuid();

        var concurrentCount = 0;
        var maxObservedConcurrency = 0;
        var lockObject = new object();

        //Nested method for quick simulation
        async Task DoWork()
        {
            using var _ = await sut.AcquireAsync(itemId, CancellationToken.None);

            //allow one thread in at a time
            lock (lockObject)
            {
                concurrentCount++;
                maxObservedConcurrency = Math.Max(maxObservedConcurrency, concurrentCount);
            }

            await Task.Delay(50);

            lock (lockObject)
            {
                concurrentCount--;
            }
        }

        //Run simulated AcquireAsync calls back to back; the purpose of this test
        await Task.WhenAll(DoWork(), DoWork(), DoWork());

        Assert.Equal(1, maxObservedConcurrency);
    }
}
