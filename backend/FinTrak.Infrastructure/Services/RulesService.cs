using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;
using FinTrak.Core.Interfaces;
using FinTrak.Core.DTOs;
using FinTrak.Core.Utilities;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinTrak.Infrastructure.Services;

public class RulesService(IRulesRepository repo, ITransactionRepository tRepo, Dictionary<TargetType, RuleFieldMapDto> fieldMap) : IRulesService
{
    private readonly IRulesRepository _repo = repo;
    private readonly ITransactionRepository _tRepo = tRepo;
    private readonly Dictionary<TargetType, RuleFieldMapDto> _fieldMap = fieldMap;

    public Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _repo.GetByUserIdAsync(userId, cancellationToken);

    public Task<List<Rule>> GetRulesByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default) => _repo.GetByTargetAsync(userId, target);

    public Task<Rule?> GetRuleAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repo.GetByIdAsync(id, cancellationToken);

    public async Task CreateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new InvalidOperationException("Rule.Target is required.");

        if (await _repo.PriorityExistsAsync(rule.UserId, rule.Target.Value, rule.Priority, rule.Id, cancellationToken))
            throw new InvalidOperationException($"Priority {rule.Priority} is already in use for this target type.");

        await _repo.AddAsync(rule, cancellationToken);
    }

    public async Task UpdateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new InvalidOperationException("Rule.Target is required.");

        if (await _repo.PriorityExistsAsync(rule.UserId, rule.Target.Value, rule.Priority, rule.Id, cancellationToken))
            throw new InvalidOperationException($"Priority {rule.Priority} is already in use for this target type.");

        await _repo.SaveAsync(cancellationToken);
    }

    public async Task UpdateRulePriorities(Guid userId, List<RuleDto> rules, CancellationToken cancellationToken)
    {
        if (rules.Select(r => r.Priority).Distinct().Count() != rules.Count)
            throw new InvalidOperationException("Priorities in the reorder list must be unique.");

        var ids = rules.Select(r => r.Id).ToList();
        var existingRules = await _repo.GetRulesForBulkUpdateAsync(userId, ids, cancellationToken);
        var newList = rules.ToDictionary(kvp => kvp.Id, kvp => kvp.Priority);

        // Two-phase write: a straight reorder can require two rules to swap priorities,
        // which EF can't apply in any single order without an intermediate collision on
        // the (UserId, Target, Priority) unique index. First move everything to a
        // guaranteed-negative placeholder (never collides with a real priority, which is
        // always >= 0), save, then set the real values and save again.
        foreach (var rule in existingRules)
        {
            if (newList.TryGetValue(rule.Id, out int foundRule))
            {
                rule.Priority = -(foundRule + 1);
            }
        }
        await _repo.SaveAsync(cancellationToken);

        foreach (var rule in existingRules)
        {
            if (newList.TryGetValue(rule.Id, out int foundRule))
            {
                rule.Priority = foundRule;
            }
        }
        await _repo.SaveAsync(cancellationToken);
    }

    public Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default) =>
        _repo.DeleteAsync(rule, cancellationToken);

    public Dictionary<TargetType, RuleFieldMapDto> GetRuleFieldMapSync() => _fieldMap;


    public async Task EvaluateTransactionRulesAsync(Guid userId, List<Guid> lookupItems, TriggerType trigger, CancellationToken cancellationToken = default)
    {
        var transactions = await _tRepo.GetByIdsAsync(userId, lookupItems, cancellationToken);
        var rules = await GetRulesByTargetAsync(userId, TargetType.Transaction.ToString());
        rules = rules.Where(r => r.Trigger == trigger && r.IsActive).ToList();
        rules = rules.OrderBy(r => r.Priority).ToList();
        foreach(var transaction in transactions)
        {
            foreach(var rule in rules)
            {
                if(ConditionsMatch(rule.Conditions, transaction))
                {
                    ApplyActions(rule.Actions, transaction);
                }
            }
        }
        await _tRepo.SaveAsync(cancellationToken); 
    }

    public static bool ConditionsMatch(List<Condition> conditions, Transaction transaction)
    {
        return conditions.GroupBy(c => c.GroupId)
                 .Any(group => group.All(c => RuleUtil.ResolveConditionFieldValue(c, transaction)));
    }

    public void ApplyActions(List<Action> actions, Transaction transaction)
    {
        foreach(var action in actions)
        {
            switch (action.ActionType)
            {
                case ActionType.Set:
                    RuleUtil.SetAction(action, transaction);
                    break;
                // Exclusions parked 2026-10-01 — see RuleUtil.ExcludeAction.
                // case ActionType.Exclude:
                //     RuleUtil.ExcludeAction(action, transaction);
                //     break;
                default:
                    throw new ValidationException($"Invalid action type {action.ActionType}. Please select valid type");
            }
        }
    }

    public async Task ApplyRuleToTransactionHistory(Guid userId, CancellationToken cancellationToken)
    {
        var lastId = Guid.Empty;
        var rules = await GetRulesByTargetAsync(userId, TargetType.Transaction.ToString());
        rules = rules.Where(r => r.Recursive == true && r.DeletedAt == null && r.IsActive).OrderBy(r => r.Priority).ToList();
        while(true)
        {
            var transactions = await _tRepo.GetPaginatedTransactions(userId, lastId, pageSize: 50, cancellationToken);
            foreach(var transaction in transactions)
            {
                foreach(var rule in rules)
                {
                    if(ConditionsMatch(rule.Conditions, transaction))
                    {
                        ApplyActions(rule.Actions, transaction);
                    }
                }
            }
            await _tRepo.SaveAsync(cancellationToken); 
            _tRepo.ClearTracker();
            if(transactions.Count < 50) break;
            lastId = transactions[^1].Id;
        }
    }

    public async Task ApplyRuleOnDemand(Guid userId, Guid ruleId, CancellationToken cancellationToken)
    {
        var lastId = Guid.Empty;
        var rule = await GetRuleAsync(ruleId, cancellationToken);
        if(rule == null) throw new Exception();
        while(true)
        {
            var transactions = await _tRepo.GetPaginatedTransactions(userId, lastId, pageSize: 50, cancellationToken);
            foreach(var transaction in transactions)
            {
                if(ConditionsMatch(rule.Conditions, transaction))
                {
                    ApplyActions(rule.Actions, transaction);
                }
            }
            await _tRepo.SaveAsync(cancellationToken); 
            _tRepo.ClearTracker();
            if(transactions.Count < 50) break;
            lastId = transactions[^1].Id;
        }
    }
}
