using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FinTrak.Core.Interfaces;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

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
                var db = scope.ServiceProvider.GetRequiredService<FinTrakDbContext>();
                var detectionService = scope.ServiceProvider.GetRequiredService<IBillDetectionService>();

                var userIds = await db.Users.Select(u => u.Id).ToListAsync(stoppingToken);

                foreach(var userId in userIds)
                {
                    var suggestions = await detectionService.DetectAsync(userId, stoppingToken);

                    var bills = suggestions.Select(bucket =>
                    {
                        var group = bucket.First();
                        return new Bill
                        {
                            UserId = userId,
                            Name = group.MerchantName,
                            Amount = group.Amounts.FirstOrDefault() ?? 0m,
                            Status = BillStatus.Pending
                        };
                    });
                    await db.Bills.AddRangeAsync(bills);
                }

                await db.SaveChangesAsync(stoppingToken);

                await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
            }
        }

    }
}
