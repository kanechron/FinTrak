using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using FinTrak.Infrastructure.Services;

namespace FinTrak.Infrastructure.BackgroundServices;

public class AutoSyncTimer(IServiceScopeFactory scopeFactory) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        while(!cancellationToken.IsCancellationRequested)   
        {
            using var scope = _scopeFactory.CreateScope();
            var timer = scope.ServiceProvider.GetRequiredService<AutoSyncService>();
            await timer.AutoSyncUsers(cancellationToken);
            await Task.Delay(DateTime.UtcNow.Date.AddDays(1)-DateTime.UtcNow, cancellationToken);
        }
    }
}