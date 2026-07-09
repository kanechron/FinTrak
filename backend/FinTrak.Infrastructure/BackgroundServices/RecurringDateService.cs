using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using static FinTrak.Core.Utilities.RecurringDateUtil;



namespace FinTrak.Infrastructure.BackgroundServices
{

    public class RecurringDateService(IServiceScopeFactory scopeFactory) : BackgroundService
    {

        //Inject IServiceScopeFactory to 
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {

                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<FinTrakDbContext>();

                var budgetsToUpdate = await db.Budgets
                .Where(b => b.IsRecurring && b.IsActive && b.DeletedAt == null && b.RecurringDate != null && b.EndDate <= DateOnly.FromDateTime(DateTime.UtcNow))
                .ToListAsync(cancellationToken);

                foreach (var budget in budgetsToUpdate)
                {

                    switch (budget.Period?.ToString().ToLower())
                    {
                        case "weekly":
                            budget.StartDate = budget.EndDate.Value.AddDays(1); // Start the new period the day after the previous end date
                            budget.EndDate = GetRecurringDateWeek(budget.StartDate, budget.RecurringDate);
                            break;
                        case "monthly":
                            budget.StartDate = budget.EndDate.Value.AddDays(1); // Start the new period the day after the previous end date
                            budget.EndDate = GetRecurringDateMonth(budget.StartDate, budget.RecurringDate);
                            break;
                        case "yearly":
                            budget.StartDate = budget.EndDate.Value.AddDays(1);
                            budget.EndDate = GetRecurringDateYear(budget.StartDate, budget.RecurringDate);
                            break;

                    }

                }
                await db.SaveChangesAsync(cancellationToken);

                await Task.Delay(TimeSpan.FromDays(1), cancellationToken);

            }

        }
    }
}