using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;
using FinTrak.Core.Interfaces;
using FinTrak.Core.DTOs;
using FinTrak.Core.Utilities;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using FinTrak.Core.Exceptions;

namespace FinTrak.Infrastructure.Services;

public class RulesService(IRulesRepository repo, ITransactionRepository tRepo, ITransactionExclusionRepository eRepo, Dictionary<TargetType, RuleFieldMapDto> fieldMap) : IRulesService
{
    private readonly IRulesRepository _repo = repo;
    private readonly ITransactionRepository _tRepo = tRepo;
    private readonly ITransactionExclusionRepository _eRepo = eRepo;
    private readonly Dictionary<TargetType, RuleFieldMapDto> _fieldMap = fieldMap;

    public Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _repo.GetByUserIdAsync(userId, cancellationToken);

    public Task<List<Rule>> GetRulesByTargetAsync(Guid userId, string target, CancellationToken cancellationToken = default) => _repo.GetByTargetAsync(userId, target);

    public Task<Rule?> GetRuleAsync(Guid userId, Guid ruleId, CancellationToken cancellationToken = default) =>
        _repo.GetByIdAsync(userId, ruleId, cancellationToken);

    public async Task CreateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new BadRequestException("Rule does not have a Target");

        // Server-assigned, never trusted from the client: new rules go to the end of their target's list.
        // Reordering only happens through the reorder endpoint.
        rule.Priority = await _repo.GetMaxPriorityAsync(rule.UserId, rule.Target.Value, cancellationToken) + 1;

        await _repo.AddAsync(rule, cancellationToken);
    }

    public async Task UpdateRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Target is null)
            throw new BadRequestException("Rule does not have a Target");

        // Priority isn't editable here (only via the reorder endpoint), so there's no collision to check.
        await _repo.SaveAsync(cancellationToken);
    }

    public async Task UpdateRulePriorityAsync(Guid userId, Guid ruleId, int newPriority, CancellationToken cancellationToken = default)
    {
        var rule = await _repo.GetByIdAsync(userId, ruleId, cancellationToken) ?? throw new NotFoundException("Rule not found");
        var target = rule.Target ?? throw new BadRequestException("Rule does not have a Target");
        var oldPriority = rule.Priority;

        if (oldPriority == newPriority) throw new BadRequestException("New rule priority matches old rule priority");
        if (newPriority <= 0) throw new BadRequestException("New priority invalid");
        // Priorities are contiguous within a target's list, so anything past the current max would leave a gap.
        if (newPriority > await _repo.GetMaxPriorityAsync(userId, target, cancellationToken)) throw new BadRequestException("New priority out of range");

        await _repo.UpdateRulePrioritiesAsync(userId, target, ruleId, oldPriority, newPriority, cancellationToken);
    }

    /// <summary>
    /// Soft-deletes a rule. If it has exclusion actions, its exclusions are reversed FIRST (while the rule still
    /// exists), so a failure during reversal leaves the rule in place rather than orphaning its exclusions.
    /// </summary>
    public async Task DeleteRuleAsync(Rule rule, CancellationToken cancellationToken = default)
    {
        if (rule.Kind == RuleKind.Exclusion)
            await RemoveRuleExclusionsAsync(rule.UserId, rule.Id, cancellationToken);

        await _repo.DeleteAsync(rule, cancellationToken);
    }

    public Dictionary<TargetType, RuleFieldMapDto> GetRuleFieldMapSync() => _fieldMap;


    public async Task EvaluateTransactionRulesAsync(Guid userId, List<Guid> lookupItems, TriggerType trigger, CancellationToken cancellationToken = default)
    {
        var transactions = await _tRepo.GetByIdsAsync(userId, lookupItems, cancellationToken);
        var rules = await GetRulesByTargetAsync(userId, TargetType.Transaction.ToString());
        // Always rules run on every trigger, alongside the rules for this specific trigger.
        rules = rules.Where(r => (r.Trigger == trigger || r.Trigger == TriggerType.Always) && r.IsActive).ToList();
        rules = rules.OrderBy(r => r.Priority).ToList();

        await ApplyRulesToBatchAsync(userId, rules, transactions, cancellationToken);
        await _tRepo.SaveAsync(cancellationToken);
    }

    /// <summary>
    /// The shared core of every evaluation path (trigger events, recursive history pass, on-demand run):
    /// for each transaction, runs each rule in order; matching rules apply their Set actions and, for exclusion
    /// actions, OR the rule's flags onto the transaction and stage a <see cref="TransactionExclusion"/> receipt.
    /// Doesn't save — the caller saves once per batch so receipts and transaction changes land together.
    /// </summary>
    private async Task ApplyRulesToBatchAsync(Guid userId, List<Rule> rules, List<Transaction> transactions, CancellationToken cancellationToken)
    {
        if (transactions.Count == 0 || rules.Count == 0) return;

        // Computed once per batch, not once per transaction.
        var masks = rules.ToDictionary(r => r.Id, GetExclusionMask);

        // For each exclusion rule, which of this batch's transactions it already has a receipt for —
        // so re-applying the same rule (e.g. a sync after a recursive pass) doesn't violate the unique index.
        var transactionIds = transactions.Select(t => t.Id).ToList();
        var receipted = new Dictionary<Guid, HashSet<Guid>>();
        foreach (var rule in rules.Where(r => masks[r.Id] != Exclusion.None))
        {
            receipted[rule.Id] = await _eRepo.GetReceiptedTransactionIdsAsync(userId, ExclusionSourceType.Rule, rule.Id, transactionIds, cancellationToken);
        }

        foreach (var transaction in transactions)
        {
            foreach (var rule in rules)
            {
                if (!ConditionsMatch(rule.Conditions, transaction)) continue;

                ApplyActions(rule.Actions, transaction);

                var mask = masks[rule.Id];
                if (mask == Exclusion.None) continue;

                transaction.Exclusions |= mask;

                if (receipted[rule.Id].Add(transaction.Id))
                {
                    _eRepo.Add(new TransactionExclusion
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        TransactionId = transaction.Id,
                        SourceType = ExclusionSourceType.Rule,
                        SourceId = rule.Id,
                        Flags = mask,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
    }

    /// <summary>Every exclusion bit this rule's actions set, combined into one value. <see cref="Exclusion.None"/> if it has no exclusion actions.</summary>
    private static Exclusion GetExclusionMask(Rule rule)
    {
        var mask = Exclusion.None;
        foreach (var action in rule.Actions.Where(a => a.ActionField == ActionField.Exclusion))
        {
            mask |= Enum.Parse<Exclusion>(action.ActionValue);
        }
        return mask;
    }

    /// <summary>
    /// Reverses one rule's exclusions using its receipts — no condition re-matching. Affected transactions are
    /// re-summarized from their OTHER receipts, so a flag another source still wants stays on. Flags are updated
    /// before the receipts are deleted, so a failure partway leaves receipts in place and the call can be retried.
    /// </summary>
    private async Task RemoveRuleExclusionsAsync(Guid userId, Guid ruleId, CancellationToken cancellationToken)
    {
        var receipts = await _eRepo.GetBySourceAsync(userId, ExclusionSourceType.Rule, ruleId, cancellationToken);
        if (receipts.Count == 0) return;

        var affectedIds = receipts.Select(r => r.TransactionId).Distinct().ToList();

        // Chunked so a rule that touched a huge history doesn't load it all at once.
        foreach (var chunk in affectedIds.Chunk(500))
        {
            var chunkIds = chunk.ToList();

            var keep = (await _eRepo.GetByTransactionIdsAsync(userId, chunkIds, cancellationToken))
                .Where(e => !(e.SourceType == ExclusionSourceType.Rule && e.SourceId == ruleId))
                .GroupBy(e => e.TransactionId)
                .ToDictionary(g => g.Key, g => g.Aggregate(Exclusion.None, (acc, e) => acc | e.Flags));

            var transactions = await _tRepo.GetByIdsAsync(userId, chunkIds, cancellationToken);
            foreach (var transaction in transactions)
            {
                transaction.Exclusions = keep.GetValueOrDefault(transaction.Id, Exclusion.None);
            }

            // No ClearTracker here: the caller's Rule entity is tracked by this same context and still needs saving.
            await _tRepo.SaveAsync(cancellationToken);
        }

        await _eRepo.DeleteBySourceAsync(userId, ExclusionSourceType.Rule, ruleId, cancellationToken);
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
                // Exclusion actions are applied by ApplyRulesToBatchAsync, which also writes the receipt.
                case ActionType.Exclude when action.ActionField == ActionField.Exclusion:
                    break;
                default:
                    throw new UnreachableException($"Action type {action.ActionType} has no handler.");
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
            await ApplyRulesToBatchAsync(userId, rules, transactions, cancellationToken);
            await _tRepo.SaveAsync(cancellationToken);
            _tRepo.ClearTracker();
            if(transactions.Count < 50) break;
            lastId = transactions[^1].Id;
        }
    }

    public async Task ApplyRuleOnDemand(Guid userId, Guid ruleId, CancellationToken cancellationToken)
    {
        var lastId = Guid.Empty;
        var rule = await GetRuleAsync(userId, ruleId, cancellationToken);
        if(rule == null) throw new NotFoundException("Rule was not found or does not exist.");
        while(true)
        {
            var transactions = await _tRepo.GetPaginatedTransactions(userId, lastId, pageSize: 50, cancellationToken);
            await ApplyRulesToBatchAsync(userId, [rule], transactions, cancellationToken);
            await _tRepo.SaveAsync(cancellationToken);
            _tRepo.ClearTracker();
            if(transactions.Count < 50) break;
            lastId = transactions[^1].Id;
        }
    }
}
