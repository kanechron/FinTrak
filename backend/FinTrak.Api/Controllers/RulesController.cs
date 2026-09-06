
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;

namespace FinTrak.Api.Controllers
{
    public class RulesController(IRulesService rules) : ApiBaseController
    {
        private readonly IRulesService _rules = rules;

        [HttpGet("get-rules")]
        public async Task<IActionResult> GetRules()
        {
            var userId = GetUserId();
            return Ok(await _rules.GetRulesAsync(userId));
            
        }
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
            var rule = await _rules.GetRuleAsync(id, cancellationToken);
            if (rule == null) return NotFoundError("Rule not found.");
            if (rule.UserId != GetUserId()) return ForbiddenError();

            return Ok(rule);
        }

        [HttpPost("add-rule")]
        public async Task<IActionResult> AddRule([FromBody] Rule rule, CancellationToken cancellationToken)
        {
            var newRule = new Rule
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
                RuleName = rule.RuleName,
                Priority = rule.Priority,
                IsActive = rule.IsActive,
                Recursive = rule.Recursive,
                CreatedAt = DateTime.UtcNow,
                Target = rule.Target,
                Trigger = rule.Trigger,
                Conditions = rule.Conditions,
                Actions = rule.Actions
            };

            try
            {
                await _rules.CreateRuleAsync(newRule, cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return ValidationError(ex.Message);
            }

            return Ok(new { message = "Rule added successfully.", id = newRule.Id });
        }

        [HttpPatch("update-rule/{id}")]
        public async Task<IActionResult> UpdateRule(Guid id, [FromBody] Rule rule, CancellationToken cancellationToken)
        {
            var existingRule = await _rules.GetRuleAsync(id, cancellationToken);
            if (existingRule == null) return NotFoundError("Rule not found.");
            if (existingRule.UserId != GetUserId()) return ForbiddenError();

            existingRule.RuleName = rule.RuleName;
            existingRule.Priority = rule.Priority;
            existingRule.IsActive = rule.IsActive;
            existingRule.Recursive = rule.Recursive;
            existingRule.Target = rule.Target;
            existingRule.Trigger = rule.Trigger;
            existingRule.Conditions = rule.Conditions;
            existingRule.Actions = rule.Actions;

            try
            {
                await _rules.UpdateRuleAsync(existingRule, cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return ValidationError(ex.Message);
            }

            return Ok(new { message = "Rule updated successfully." });
        }

        [HttpDelete("delete-rule/{id}")]
        public async Task<IActionResult> DeleteRule(Guid id, CancellationToken cancellationToken)
        {
            var existingRule = await _rules.GetRuleAsync(id, cancellationToken);
            if (existingRule == null) return NotFoundError("Rule not found.");
            if (existingRule.UserId != GetUserId()) return ForbiddenError();

            await _rules.DeleteRuleAsync(existingRule, cancellationToken);
            return Ok(new { message = "Rule deleted successfully." });
        }
    }
}