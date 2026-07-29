using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using static FinTrak.Core.Utilities.RecurringDateUtil;
using FinTrak.Core.DTOs;
using FinTrak.Api.Validation;

namespace FinTrak.Api.Controllers
{
    public class BudgetsController(IBudgetRepository repo, BudgetValidator validator) : ApiBaseController
    {
        private readonly IBudgetRepository _repo = repo;
        private readonly BudgetValidator _validator = validator;

        [HttpGet("get-budgets")]
        public async Task<IActionResult> GetBudgets(CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var budgets = await _repo.GetActiveByUserIdAsync(userId, cancellationToken);

            var spendingPerBudget = await _repo.GetSpendingPerBudgetAsync(userId, cancellationToken);

            var result = budgets.Select(b => new BudgetDto
            {
                Id = b.Id,
                Name = b.Name,
                Category = b.Category?.Name ?? b.Name,
                Spent = spendingPerBudget.TryGetValue(b.Id, out var s) ? s : 0m,
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
        public async Task<IActionResult> AddBudget([FromBody] Budget budget, CancellationToken cancellationToken)
        {
            var validation = await _validator.ValidateAsync(budget, cancellationToken);
            if (!validation.IsValid)
                return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });

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

            await _repo.AddAsync(newBudget, cancellationToken);
            return Ok(new { message = "Budget added successfully.", id = newBudget.Id });
        }

        [HttpPatch("update-budget/{id}")]
        public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] Budget budget, CancellationToken cancellationToken)
        {
            var existingBudget = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingBudget == null) return NotFound(new { error = "Budget not found." });
            if (existingBudget.UserId != GetUserId()) return Forbid();

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

            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Budget updated successfully." });
        }

        [HttpDelete("delete-budget/{id}")]
        public async Task<IActionResult> DeleteBudget(Guid id, CancellationToken cancellationToken)
        {
            var existingBudget = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingBudget == null) return NotFound(new { error = "Budget not found." });
            if (existingBudget.UserId != GetUserId()) return Forbid();

            existingBudget.DeletedAt = DateTime.UtcNow;
            existingBudget.IsActive = false;
            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Budget deleted successfully." });
        }
    }
}
