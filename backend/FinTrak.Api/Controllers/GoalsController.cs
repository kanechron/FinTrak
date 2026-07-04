using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Api.Validation;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class GoalsController(IGoalRepository repo, IAccountRepository accountRepo, IMapper mapper, GoalValidator validator) : ControllerBase
    {
        private readonly IGoalRepository _repo = repo;
        private readonly IAccountRepository _accountRepo = accountRepo;
        private readonly IMapper _mapper = mapper;
        private readonly GoalValidator _validator = validator;

        [HttpGet("get-goals")]
        public async Task<IActionResult> GetGoals(CancellationToken cancellationToken)
        {
            var goals = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            return Ok(_mapper.Map<List<GoalDto>>(goals));
        }

        [HttpPost("add-goal")]
        public async Task<IActionResult> AddGoal([FromBody] Goal goal, CancellationToken cancellationToken)
        {
            var validation = await _validator.ValidateAsync(goal, cancellationToken);
            if (!validation.IsValid)
                return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });

            var accountIds = goal.LinkedAccounts?.Select(a => a.Id).ToList() ?? [];
            var allAccounts = await _accountRepo.GetByUserIdAsync(GetUserId(), cancellationToken);
            var linkedAccounts = allAccounts.Where(a => accountIds.Contains(a.Id)).ToList();

            var newGoal = new Goal
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
                Name = goal.Name,
                TargetAmount = goal.TargetAmount,
                CurrentAmount = 0m,
                CreatedAt = DateTime.UtcNow,
                TargetDate = goal.TargetDate,
                LinkedAccounts = linkedAccounts,
                Priority = await _repo.GetMaxPriorityAsync(cancellationToken) + 1
            };

            await _repo.AddAsync(newGoal, cancellationToken);
            return Ok(new { message = "Goal added successfully.", id = newGoal.Id });
        }

        [HttpPatch("update-goal/{id}")]
        public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] Goal goal, CancellationToken cancellationToken)
        {
            var existingGoal = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingGoal == null) return NotFound(new { message = "Goal not found." });

            var accountIds = goal.LinkedAccounts?.Select(a => a.Id).ToList() ?? [];
            var allAccounts = await _accountRepo.GetByUserIdAsync(GetUserId(), cancellationToken);
            var linkedAccounts = allAccounts.Where(a => accountIds.Contains(a.Id)).ToList();
            existingGoal.LinkedAccounts = linkedAccounts.Count > 0 ? linkedAccounts : existingGoal.LinkedAccounts;

            existingGoal.Name = string.IsNullOrWhiteSpace(goal.Name) ? existingGoal.Name : goal.Name;
            existingGoal.TargetAmount = goal.TargetAmount > 0 ? goal.TargetAmount : existingGoal.TargetAmount;
            existingGoal.CurrentAmount = goal.CurrentAmount >= 0 ? goal.CurrentAmount : existingGoal.CurrentAmount;
            existingGoal.TargetDate = goal.TargetDate ?? existingGoal.TargetDate;
            existingGoal.Priority = goal.Priority >= 0 ? goal.Priority : existingGoal.Priority;

            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Goal updated successfully." });
        }

        [HttpDelete("delete-goal/{id}")]
        public async Task<IActionResult> DeleteGoal(Guid id, CancellationToken cancellationToken)
        {
            var existingGoal = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingGoal == null) return NotFound(new { message = "Goal not found." });

            existingGoal.DeletedAt = DateTime.UtcNow;
            existingGoal.IsActive = false;
            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Goal deleted successfully." });
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
