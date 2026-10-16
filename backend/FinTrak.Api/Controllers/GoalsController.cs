using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Api.Validation;

namespace FinTrak.Api.Controllers
{
    public class GoalsController(IAccountRepository accountRepo, IMapper mapper, GoalValidator validator, IGoalsService goals) : ApiBaseController
    {
        private readonly IAccountRepository _accountRepo = accountRepo;
        private readonly IMapper _mapper = mapper;
        private readonly GoalValidator _validator = validator;
        private readonly IGoalsService _goals = goals;

        [HttpGet("get-goals")]
        public async Task<IActionResult> GetGoals(CancellationToken cancellationToken)
        {
            var goals = await _goals.GetByUserIdAsync(GetUserId(), cancellationToken);
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
                LinkedAccounts = linkedAccounts
            };


            await _goals.AddAsync(GetUserId(), newGoal, cancellationToken);
            return Ok(new { message = "Goal added successfully.", id = newGoal.Id });
        }

        [HttpPost("reorder-goals/{goalId}")]
        public async Task<IActionResult> UpdateGoalsPriority(Guid goalId, [FromBody] int newPriority, CancellationToken cancellationToken)
        {   
            await _goals.UpdateGoalPrioritiesAsync(GetUserId(), goalId, newPriority, cancellationToken);
            return Ok(new { message = "Goals updated successfully"});
        }

        [HttpPatch("update-goal/{id}")]
        public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] Goal goal, CancellationToken cancellationToken)
        {
            await _goals.UpdateGoalAsync(GetUserId(), id, goal, cancellationToken);
            return Ok(new { message = "Goal updated successfully." });
        }

        [HttpDelete("delete-goal/{id}")]
        public async Task<IActionResult> DeleteGoal(Guid id, CancellationToken cancellationToken)
        {
            await _goals.DeleteGoalAsync(GetUserId(), id, cancellationToken);
            return Ok(new { message = "Goal deleted successfully." });
        }
    }
}
