using Microsoft.AspNetCore.Mvc;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class GoalsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public GoalsController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet("get-goals")]
        public async Task<IActionResult> GetGoals()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var goals = await _db.Goals
                    .Where(g => g.DeletedAt == null && g.UserId == userId)
                    .Include(g => g.LinkedAccounts) // Include linked accounts to calculate current amount
                    .OrderBy(g => g.Priority) // Order by user-defined priority
                    .ToListAsync();

                var result = goals.Select(g => new
                {
                    id = g.Id,
                    name = g.Name,
                    targetAmount = g.TargetAmount,
                    targetDate = g.TargetDate,
                    isCompleted = g.CompletedAt != null,
                    isActive = g.IsActive,
                    currentAmount = 0, // Sum of available balances from linked accounts
                    priority = g.Priority,
                    linkedAccounts = g.LinkedAccounts.Select(a => new
                    {
                        id = a.Id,
                        name = a.OfficialName ?? a.Name,
                        mask = a.Mask
                    }).ToList()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving goals.", error = ex.Message });
            }
        }

        [HttpPost("add-goal")]
        public async Task<IActionResult> AddGoal([FromBody] Goal goal)
        {
            try
            {
                if (goal == null || string.IsNullOrWhiteSpace(goal.Name) || goal.TargetAmount <= 0)
                {
                    return BadRequest(new { message = "Invalid goal data. Name and TargetAmount are required." });
                }

                var accountIds = goal.LinkedAccounts?.Select(a => a.Id).ToList() ?? new();
                var linkedAccounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToListAsync();

                var maxPriority = await _db.Goals
                .Where(g => g.DeletedAt == null)
                .Select(g => (int?)g.Priority)
                .MaxAsync() ?? -1;

        



                var newGoal = new Goal
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),
                    Name = goal.Name,
                    TargetAmount = goal.TargetAmount,
                    CurrentAmount = 0m,
                    CreatedAt = DateTime.UtcNow,
                    TargetDate = goal.TargetDate,
                    LinkedAccounts = linkedAccounts,
                    Priority = maxPriority + 1 // Set priority to be one greater than the current max
                };

                _db.Goals.Add(newGoal);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Goal added successfully.", id = newGoal.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to parse goal data.", error = ex.Message });
            }
        }

        [HttpPatch("update-goal/{id}")]
        public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] Goal goal)
        {
            try
            {
                var existingGoal = await _db.Goals
                .Include(g => g.LinkedAccounts) // Include linked accounts to update them if needed
                .FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null);
                if (existingGoal == null)
                {
                    return NotFound(new { message = "Goal not found." });
                }

                var accountIds = goal.LinkedAccounts?.Select(a => a.Id).ToList() ?? new();
                var linkedAccounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToListAsync();
                existingGoal.LinkedAccounts = linkedAccounts.Count > 0 ? linkedAccounts : existingGoal.LinkedAccounts;
                
                existingGoal.Name = string.IsNullOrWhiteSpace(goal.Name) ? existingGoal.Name : goal.Name;
                existingGoal.TargetAmount = goal.TargetAmount > 0 ? goal.TargetAmount : existingGoal.TargetAmount;
                existingGoal.CurrentAmount = goal.CurrentAmount >= 0 ? goal.CurrentAmount : existingGoal.CurrentAmount;
                existingGoal.TargetDate = goal.TargetDate ?? existingGoal.TargetDate;
                existingGoal.Priority = goal.Priority >= 0 ? goal.Priority : existingGoal.Priority;

                await _db.SaveChangesAsync();
                return Ok(new { message = "Goal updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the goal.", error = ex.Message });
            }  
        }

        [HttpDelete("delete-goal/{id}")]
        public async Task<IActionResult> DeleteGoal(Guid id)
        {
            try
            {
                var existingGoal = await _db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null);
                if (existingGoal == null)
                {
                    return NotFound(new { message = "Goal not found." });
                }
                existingGoal.DeletedAt = DateTime.UtcNow;
                existingGoal.IsActive = false;

                await _db.SaveChangesAsync();
                return Ok(new { message = "Goal deleted successfully." });
            }

            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the goal.", error = ex.Message });
            }
        }

    }
}