using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Entities;
using static FinTrak.Core.Utilities.RecurringDateUtil;
using FinTrak.Api.DTOs;

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
                var now = DateOnly.FromDateTime(DateTime.UtcNow);
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var budgets = await _db.Budgets
                    .Where(b => b.DeletedAt == null && b.IsActive && b.UserId == userId)
                    .Include(b => b.Category)
                    .ToListAsync();

                // Batch-compute spending per category to avoid N+1
                var categoryIds = budgets.Where(b => b.CategoryId.HasValue).Select(b => b.CategoryId!.Value).Distinct().ToList();
                var spendingByCategory = await _db.Transactions
                    .Where(t => t.DeletedAt == null && t.Amount > 0 && t.UserId == userId && categoryIds.Contains(t.CategoryId!.Value))
                    .GroupBy(t => t.CategoryId!.Value)
                    .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => (decimal?)t.Amount) ?? 0m })
                    .ToDictionaryAsync(x => x.CategoryId, x => x.Total);

                var result = budgets.Select(b => new BudgetDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Category = b.Category?.Name ?? b.Name,
                    Spent = b.CategoryId.HasValue && spendingByCategory.TryGetValue(b.CategoryId.Value, out var s) ? s : 0m,
                    Amount = b.Amount,
                    StartDate = b.StartDate,
                    EndDate = b.EndDate,
                    IsRecurring = b.IsRecurring,
                    Period = b.Period?.ToString() ?? "Monthly",
                    RecurringDate = b.RecurringDate
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


                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var newBudget = new Budget
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = budget.Name,
                    Amount = budget.Amount,
                    Period = budget.Period,
                    StartDate = budget.StartDate,
                    CategoryId = budget.CategoryId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    IsRecurring = budget.IsRecurring,
                    RecurringDate = budget.RecurringDate,
                    
                    EndDate = budget.Period switch
                        {
                            BudgetPeriod.Custom => budget.EndDate,
                            BudgetPeriod.Weekly => GetRecurringDateWeek(budget.StartDate, budget.RecurringDate ?? string.Empty),
                            BudgetPeriod.Yearly => GetRecurringDateYear(budget.StartDate, budget.RecurringDate ?? string.Empty),
                            _ => GetRecurringDateMonth(budget.StartDate, budget.RecurringDate ?? string.Empty)
                        },


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
                existingBudget.EndDate = budget.Period switch
                {
                    BudgetPeriod.Custom => budget.EndDate,
                            BudgetPeriod.Weekly => GetRecurringDateWeek(budget.StartDate, budget.RecurringDate ?? string.Empty),
                            BudgetPeriod.Yearly => GetRecurringDateYear(budget.StartDate, budget.RecurringDate ?? string.Empty),
                            _ => GetRecurringDateMonth(budget.StartDate, budget.RecurringDate ?? string.Empty)
                };
                existingBudget.IsRecurring = budget.IsRecurring;
                existingBudget.RecurringDate = budget.RecurringDate ?? existingBudget.RecurringDate;
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


    }
}
