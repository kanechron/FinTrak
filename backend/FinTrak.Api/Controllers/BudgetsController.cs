using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class BudgetsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public BudgetsController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet("get-budgets")]
        public async Task<IActionResult> GetBudgets()
        {
            try
            {
                var now = DateTime.UtcNow;
                var budgets = await _db.Budgets
                    .Where(b => b.DeletedAt == null && b.IsActive)
                    .Include(b => b.Category)
                    .ToListAsync();

                var result = budgets.Select(b =>
                {
                    var periodStart = DateOnly.FromDateTime(GetPeriodStart(b, now));

                    var spent = _db.Transactions
                        .Where(t =>
                            t.DeletedAt == null &&
                            !t.IsPending &&
                            t.Amount < 0 &&
                            t.Date >= periodStart &&
                            (b.CategoryId == null || t.CategoryId == b.CategoryId))
                        .Sum(t => (decimal?)t.Amount) ?? 0m;

                    // Plaid amounts are negative for debits — flip to positive for display
                    spent = Math.Abs(spent);

                    return new
                    {
                        id = b.Id,
                        category = b.Category?.Name ?? b.Name,
                        spent = spent,
                        limit = b.Amount,
                        period = b.Period?.ToString() ?? "Monthly"
                    };
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve budgets.", detail = ex.Message });
            }
        }

        private static DateTime GetPeriodStart(Budget budget, DateTime now) => budget.Period switch
        {
            BudgetPeriod.Weekly => now.AddDays(-(int)now.DayOfWeek),
            BudgetPeriod.Yearly => new DateTime(now.Year, 1, 1),
            BudgetPeriod.Custom => budget.StartDate,
            _ => new DateTime(now.Year, now.Month, 1) // Monthly default
        };
    }
}
