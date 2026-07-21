using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FinTrak.Infrastructure.BackgroundServices
{
    public class DbDeleteService : BackgroundService
    {

        //Inject IServiceScopeFactory to 
        private readonly IServiceScopeFactory _scopeFactory;

        public DbDeleteService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }


        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<FinTrakDbContext>();

                var cutoff = DateTime.UtcNow.AddDays(-60);

                var accountService = scope.ServiceProvider.GetRequiredService<IAccountManagementService>();

                // Users deactivated past the retention window get fully deleted, cascading
                // through everything else DeleteAccount already handles (Transactions, Bills,
                // Budgets, Goals, RefreshTokens, Invites, PlaidItems).
                var expiredUserIds = await db.Users
                    .IgnoreQueryFilters()
                    .Where(u => u.DeletedAt != null && u.DeletedAt < cutoff)
                    .Select(u => u.Id)
                    .ToListAsync(cancellationToken);

                foreach (var userId in expiredUserIds)
                {
                    await accountService.DeleteAccount(userId, cancellationToken);
                }

                await db.Goals
                    .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                await db.Budgets
                    .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                await db.Accounts
                    .Where(a => a.DeletedAt != null && a.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                await db.PlaidItems
                    .Where(p => p.DeletedAt != null && p.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                await db.Transactions
                    .Where(t => t.DeletedAt != null && t.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                // await db.Bills
                //     .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                //     .ExecuteDeleteAsync(cancellationToken);


                await Task.Delay(TimeSpan.FromDays(1), cancellationToken);
            }

        }

        
    }
}