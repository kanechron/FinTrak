using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FinTrak.Core.BackgroundServices
{
    public class BillsAutoDetectService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public BillsAutoDetectService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var detectionService = scope.ServiceProvider.GetRequiredService<FinTrak.Infrastructure.BackgroundServices.BillDetectionService>();
                await detectionService.DetectAsync(stoppingToken);

                await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
            }
        }
    }
}
