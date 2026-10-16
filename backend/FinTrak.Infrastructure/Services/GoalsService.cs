using FinTrak.Core.Entities;
using FinTrak.Core.Exceptions;
using FinTrak.Core.Interfaces;

namespace FinTrak.Infrastructure.Services;

public class GoalsService (IGoalRepository repo, IAccountRepository accounts): IGoalsService
{
    private readonly IGoalRepository _repo = repo;
    private readonly IAccountRepository _accounts = accounts;


    public async Task<List<Goal>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken) => await _repo.GetByUserIdAsync(userId, cancellationToken);

    public async Task AddAsync(Guid userId, Goal newGoal, CancellationToken cancellationToken) 
    {
        var goals = await _repo.GetByUserIdAsync(userId, cancellationToken);
        if(goals.Count >= 50) throw new BadRequestException("User has reached the limit of allowed goals");

        newGoal.Priority = await _repo.GetMaxPriorityAsync(userId, cancellationToken) + 1;
        await _repo.AddAsync(newGoal, cancellationToken);
    }

    public async Task UpdateGoalPrioritiesAsync(Guid userId, Guid goalId, int newPriority, CancellationToken cancellationToken)
    {
        var goal = await _repo.GetByIdAsync(userId, goalId, cancellationToken) ?? throw new NotFoundException("Goal not found");
        var oldPriority = goal.Priority;
        if(oldPriority == newPriority) throw new BadRequestException("New goal priority matches old goal priority");
        if(newPriority <= 0) throw new BadRequestException("New priority invalid");
        // Priorities are contiguous 1..max, so anything past the user's current max would leave a gap.
        if(newPriority > await _repo.GetMaxPriorityAsync(userId, cancellationToken)) throw new BadRequestException("New priority out of range");

        await _repo.UpdateGoalPrioritiesAsync(userId, goalId, oldPriority, newPriority, cancellationToken);
    }

    public async Task UpdateGoalAsync(Guid userId, Guid id, Goal goal, CancellationToken cancellationToken)
    {
        // Scoped to userId in the query, so another user's goal comes back null (404) rather than needing a separate ownership check.
        var existingGoal = await _repo.GetByIdAsync(userId, id, cancellationToken);
            if (existingGoal == null) throw new NotFoundException("Goal not found");

            var accountIds = goal.LinkedAccounts?.Select(a => a.Id).ToList() ?? [];
            var allAccounts = await _accounts.GetByUserIdAsync(userId, cancellationToken);
            var linkedAccounts = allAccounts.Where(a => accountIds.Contains(a.Id)).ToList();
            
            existingGoal.LinkedAccounts = linkedAccounts.Count > 0 ? linkedAccounts : existingGoal.LinkedAccounts;
            existingGoal.Name = string.IsNullOrWhiteSpace(goal.Name) ? existingGoal.Name : goal.Name;
            existingGoal.TargetAmount = goal.TargetAmount > 0 ? goal.TargetAmount : existingGoal.TargetAmount;
            existingGoal.CurrentAmount = goal.CurrentAmount >= 0 ? goal.CurrentAmount : existingGoal.CurrentAmount;
            existingGoal.TargetDate = goal.TargetDate ?? existingGoal.TargetDate;

        await _repo.SaveAsync(cancellationToken);
    }

    public async Task DeleteGoalAsync(Guid userId, Guid id, CancellationToken cancellationToken)
    {
        var existingGoal = await _repo.GetByIdAsync(userId, id, cancellationToken);
            if (existingGoal == null) throw new NotFoundException("Goal not found.");

            existingGoal.DeletedAt = DateTime.UtcNow;
            existingGoal.IsActive = false;
            await _repo.SaveAsync(cancellationToken);
    }
}