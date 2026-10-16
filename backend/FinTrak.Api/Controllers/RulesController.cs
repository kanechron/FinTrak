
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Api.Validation;
using FinTrak.Core.DTOs;
using System.Threading.Channels;
using Going.Plaid.User;

namespace FinTrak.Api.Controllers
{
    public class RulesController(IRulesService rules, RuleValidator val, Channel<IRuleTriggerEvent> channel) : ApiBaseController
    {
        private readonly IRulesService _rules = rules;
        private readonly RuleValidator _val = val;
        private readonly Channel<IRuleTriggerEvent> _channel = channel;
        


        [HttpGet("get-rules")]
        public async Task<IActionResult> GetRules() => Ok(await _rules.GetRulesAsync(GetUserId()));

        [HttpGet("get-rules-by-target/{target}")]
        public async Task<IActionResult> GetRulesByTarget(string target)
        {
            var userId = GetUserId();
            if(target == null) return Ok(new { message = "No rules for this target"});
            return Ok(await _rules.GetRulesByTargetAsync(userId, target));
        }



        [HttpGet("get-rule/{id}")]
        public async Task<IActionResult> GetRule(Guid id, CancellationToken cancellationToken)
        {
            var rule = await _rules.GetRuleAsync(GetUserId(), id, cancellationToken);
            if (rule == null) return NotFoundError("Rule not found.");

            return Ok(rule);
        }

        [HttpGet("get-rule-field-map")]
        public IActionResult GetRuleFieldMap()
        {
            var fieldmap = _rules.GetRuleFieldMapSync();
            return Ok(fieldmap);
        }

        [HttpPost("add-rule")]
        public async Task<IActionResult> AddRule([FromBody] Rule rule, CancellationToken cancellationToken)
        {
            var newRule = new Rule
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
                RuleName = rule.RuleName,
                IsActive = rule.IsActive,
                Recursive = rule.Recursive,
                CreatedAt = DateTime.UtcNow,
                Target = rule.Target,
                Trigger = rule.Trigger,
                Conditions = rule.Conditions,
                Actions = rule.Actions,
                // Derived from the actions, never trusted from the client: any exclusion action makes it an
                // exclusion rule. Mixed rules still fail validation ("no mixing" rules in RuleValidator).
                // Null-safe because this runs before validation, which is what rejects a missing Actions list.
                Kind = rule.Actions?.Any(a => a.ActionField == ActionField.Exclusion) == true ? RuleKind.Exclusion : RuleKind.Action
            };

            // An exclusion applies to new transactions from every source, so its trigger is always Always.
            // It's also always active: exclusion rules can't be edited, so an inactive one could never be switched on.
            if (newRule.Kind == RuleKind.Exclusion)
            {
                newRule.Trigger = TriggerType.Always;
                newRule.IsActive = true;
            }

            var ruleVal = await _val.ValidateAsync(newRule, cancellationToken);
            if (!ruleVal.IsValid) return ValidationError(ruleVal.ToDictionary(), "Rule not valid.");

            // BadRequest/Conflict exceptions from the service are turned into responses by ErrorHandlingMiddleware.
            await _rules.CreateRuleAsync(newRule, cancellationToken);

            if(newRule.Recursive == true) _channel.Writer.TryWrite(new RecursiveRuleSavedEvent(UserId: GetUserId(), OccurredAt: DateTime.UtcNow));

            return Ok(new { message = "Rule added successfully.", id = newRule.Id });
        }

        [HttpPost("reorder-rules/{ruleId}")]
        public async Task<IActionResult> UpdateRulePriority(Guid ruleId, [FromBody] int newPriority, CancellationToken cancellationToken)
        {
            await _rules.UpdateRulePriorityAsync(GetUserId(), ruleId, newPriority, cancellationToken);
            return Ok(new { message = "Rules updated successfully." });
        }

        [HttpPost("run-rule/{id}")]
        public async Task<IActionResult> RuleOnDemand(Guid id, CancellationToken cancellationToken)
        {
            var existingRule = await _rules.GetRuleAsync(GetUserId(), id, cancellationToken);
            if (existingRule == null) return NotFoundError("Rule not found.");

            await _rules.ApplyRuleOnDemand(GetUserId(), id, cancellationToken);
            return Ok(new {message = "Rule ran successfully."});
        }

        [HttpPatch("update-rule/{id}")]
        public async Task<IActionResult> UpdateRule(Guid id, [FromBody] Rule rule, CancellationToken cancellationToken)
        {
            var existingRule = await _rules.GetRuleAsync(GetUserId(), id, cancellationToken);
            if (existingRule == null) return NotFoundError("Rule not found.");

            // Exclusion rules are delete-only: editing or deactivating one would leave its exclusions applied.
            if (existingRule.Kind == RuleKind.Exclusion)
                return ValidationError("Exclusion rules can't be edited. Delete it and create a new one instead.");

            // Kind is fixed at creation — validate the incoming rule against the STORED kind, so a request
            // can't claim a different kind to sneak exclusion actions into an action rule.
            rule.Kind = existingRule.Kind;

            var ruleVal = await _val.ValidateAsync(rule, cancellationToken);
            if(ruleVal.IsValid)
            {
            var wasRecursive = existingRule.Recursive;

            existingRule.RuleName = rule.RuleName;
            existingRule.IsActive = rule.IsActive;
            existingRule.Recursive = rule.Recursive;
            existingRule.Target = rule.Target;
            existingRule.Trigger = rule.Trigger;
            existingRule.Conditions = rule.Conditions;
            existingRule.Actions = rule.Actions;

            await _rules.UpdateRuleAsync(existingRule, cancellationToken);

            if(!wasRecursive && rule.Recursive) _channel.Writer.TryWrite(new RecursiveRuleSavedEvent(UserId: GetUserId(), OccurredAt: DateTime.UtcNow));

            return Ok(new { message = "Rule updated successfully." });
            }
            else return ValidationError(ruleVal.ToDictionary(), "Rule not valid.");
        }


        [HttpDelete("delete-rule/{id}")]
        public async Task<IActionResult> DeleteRule(Guid id, CancellationToken cancellationToken)
        {
            var existingRule = await _rules.GetRuleAsync(GetUserId(), id, cancellationToken);
            if (existingRule == null) return NotFoundError("Rule not found.");

            await _rules.DeleteRuleAsync(existingRule, cancellationToken);
            return Ok(new { message = "Rule deleted successfully." });
        }
    }
}