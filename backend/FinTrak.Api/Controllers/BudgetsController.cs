using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using static FinTrak.Core.Utilities.RecurringDateUtil;
using FinTrak.Api.DTOs;

namespace FinTrak.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class BudgetsController(IBudgetRepository repo) : ControllerBase
    {
        private readonly IBudgetRepository _repo = repo;

        [HttpGet("get-budgets")]
        public async Task<IActionResult> GetBudgets()
        {
            var userId = GetUserId();
            var budgets = await _repo.GetActiveByUserIdAsync(userId);

            var categoryIds = budgets.Where(b => b.CategoryId.HasValue).Select(b => b.CategoryId!.Value).Distinct().ToList();
            var spendingByCategory = await _repo.GetSpendingByCategoryAsync(userId, categoryIds);

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

        [HttpPost("add-budget")]
        public async Task<IActionResult> AddBudget([FromBody] Budget budget)
        {
            if (budget == null || budget.Amount <= 0)
                return BadRequest(new { error = "Invalid budget data." });

            var newBudget = new Budget
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
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

            await _repo.AddAsync(newBudget);
            return Ok(new { message = "Budget added successfully.", id = newBudget.Id });
        }

        [HttpPatch("update-budget/{id}")]
        public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] Budget budget)
        {
            var existingBudget = await _repo.GetByIdAsync(id);
            if (existingBudget == null) return NotFound(new { error = "Budget not found." });

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

            await _repo.SaveAsync();
            return Ok(new { message = "Budget updated successfully." });
        }

        [HttpDelete("delete-budget/{id}")]
        public async Task<IActionResult> DeleteBudget(Guid id)
        {
            var existingBudget = await _repo.GetByIdAsync(id);
            if (existingBudget == null) return NotFound(new { error = "Budget not found." });

            existingBudget.DeletedAt = DateTime.UtcNow;
            existingBudget.IsActive = false;
            await _repo.SaveAsync();
            return Ok(new { message = "Budget deleted successfully." });
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
