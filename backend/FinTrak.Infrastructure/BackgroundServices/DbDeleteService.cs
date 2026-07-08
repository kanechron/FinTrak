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
                await db.Goals
                    .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                await db.Budgets
                    .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);

                // await db.Bills
                //     .Where(g => g.DeletedAt != null && g.DeletedAt < cutoff)
                //     .ExecuteDeleteAsync(cancellationToken);


                await Task.Delay(TimeSpan.FromDays(1), cancellationToken);
            }

        }


    }
}