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
                            !t.IsPending.Value &&
                            t.Amount < 0 &&
                            t.Date >= periodStart &&
                            (b.CategoryId == null || t.CategoryId == b.CategoryId))
                        .Sum(t => (decimal?)t.Amount) ?? 0m;

                    // Plaid amounts are negative for debits — flip to positive for display
                    var spentAbs = Math.Abs(spent);

                    return new
                    {
                        id = b.Id,
                        name = b.Name,
                        category = b.Category?.Name ?? b.Name,
                        spent = spentAbs,
                        amount = b.Amount,
                        startDate = b.StartDate,
                        endDate = b.EndDate,
                        isRecurring = b.IsRecurring,
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

        [HttpPost("add-budget")]
        public async Task<IActionResult> AddBudget([FromBody] Budget budget)
        {
            try
            {
                if (budget == null || budget.Amount <= 0)
                {
                    return BadRequest(new { error = "Invalid budget data." });
                }

                var newBudget = new Budget
                {
                    Id = Guid.NewGuid(),
                    Name = budget.Name,
                    Amount = budget.Amount,
                    Period = budget.Period,
                    StartDate = DateTime.SpecifyKind(budget.StartDate, DateTimeKind.Utc),
                    CategoryId = budget.CategoryId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Budgets.Add(newBudget);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Budget added successfully.", id = newBudget.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add budget.", detail = ex.Message });
            }
        }

        [HttpPatch("update-budget/{id}")]
        public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] Budget budget)
        {
            try
            {
                var existingBudget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id);
                if (existingBudget == null)
                {
                    return NotFound(new { error = "Budget not found." });
                }

                existingBudget.Name = budget.Name ?? existingBudget.Name;
                existingBudget.Amount = budget.Amount > 0 ? budget.Amount : existingBudget.Amount;
                existingBudget.Period = budget.Period ?? existingBudget.Period;
                existingBudget.StartDate = budget.StartDate != default ? budget.StartDate : existingBudget.StartDate;
                existingBudget.CategoryId = budget.CategoryId ?? existingBudget.CategoryId;
                // No need to call _db.Budgets.Update() — EF tracks it automatically
                await _db.SaveChangesAsync();


                return Ok(new { message = "Budget updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update budget.", detail = ex.Message });
            }
        }

        [HttpDelete("delete-budget/{id}")]
        public async Task<IActionResult> DeleteBudget(Guid id)
        {
            try
            {
                var existingBudget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id);
                if (existingBudget == null)
                {
                    return NotFound(new { error = "Budget not found." });
                }

                existingBudget.DeletedAt = DateTime.UtcNow;
                existingBudget.IsActive = false;
                await _db.SaveChangesAsync();

                return Ok(new { message = "Budget deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete budget.", detail = ex.Message });
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
