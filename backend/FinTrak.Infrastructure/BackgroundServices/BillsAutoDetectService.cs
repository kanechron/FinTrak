using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FinTrak.Core.Interfaces;

namespace FinTrak.Infrastructure.BackgroundServices
{
    public class BillsAutoDetectService(IServiceScopeFactory scopeFactory) : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var detectionService = scope.ServiceProvider.GetRequiredService<IBillDetectionService>();
                await detectionService.DetectAsync(stoppingToken);

                await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
            }
        }

        
    }
}
