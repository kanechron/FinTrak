using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FluentValidation;


namespace FinTrak.Api.Validation;

public class RuleValidator : AbstractValidator<Rule>
{
    private readonly Dictionary<TargetType, RuleFieldMapDto> _fieldmap;
    private readonly ICategoryRepository _cRepo;

    // RuleFor(...) calls go here directly — the primary constructor's class body
    // is the constructor body, no separate constructor needed.
    public RuleValidator(Dictionary<TargetType, RuleFieldMapDto> fieldmap, ICategoryRepository cRepo)
    {
        _fieldmap = fieldmap;
        _cRepo = cRepo;


        RuleFor(r => r.RuleName)
            .NotNull().WithMessage("Rule must have a name.")
            .MaximumLength(100).WithMessage("Rule name must be under 100 characters.");

        RuleFor(r => r.Conditions)
            .NotNull().WithMessage("Rule must have conditions")
            .NotEmpty().WithMessage("Rule must have conditions");

        RuleFor(r => r.Actions)
            .NotNull().WithMessage("Rule must have actions")
            .NotEmpty().WithMessage("Rule must have actions");

        RuleFor(r => r.Target)
            .NotNull().WithMessage("Target is required")
            .NotEmpty().WithMessage("Target must not be empty")
            .Must(target => target is null || _fieldmap.ContainsKey(target!.Value))
                .WithMessage("Target is not valid");

        RuleFor(r => r.Trigger)
            .NotNull().WithMessage("Trigger is required")
            .NotEmpty().WithMessage("Trigger must not be empty");

        RuleFor(r => r.Kind)
            .IsInEnum().WithMessage("Rule kind is not valid")
            .NotEqual(RuleKind.Undefined).WithMessage("Rule kind is required");

        // A rule is either an action rule or an exclusion rule — never both.
        RuleFor(r => r.Actions)
            .Must(actions => actions.All(a => a.ActionField == ActionField.Exclusion))
            .When(r => r.Kind == RuleKind.Exclusion && r.Actions is not null)
            .WithMessage("Exclusion rules can only contain exclusion actions");

        RuleFor(r => r.Actions)
            .Must(actions => actions.All(a => a.ActionField != ActionField.Exclusion))
            .When(r => r.Kind == RuleKind.Action && r.Actions is not null)
            .WithMessage("Exclusions must be their own rule, not mixed with other actions");

        //Check if ConditionOperator is in the ConditionField's fieldmap first
        RuleForEach(r => r.Conditions)
            .SetValidator(r => new ConditionValidator(_fieldmap, r.Target ?? TargetType.Undefined));

        RuleForEach(r => r.Actions)
            .SetValidator(r => new ActionValidator(_fieldmap, r.Target ?? TargetType.Undefined));
        
        // Each action field once — except Exclusion, which may appear several times as long as each flag appears once
        // (e.g. one rule excluding from both Budget and Reports).
        RuleFor(r => r.Actions)
            .Must(actions => actions
                .Select(a => a.ActionField == ActionField.Exclusion ? $"{a.ActionField}:{a.ActionValue}" : a.ActionField.ToString())
                .Distinct().Count() == actions.Count)
            .WithMessage("Each action type can only appear once, and each exclusion only once");

        RuleFor(r => r.Conditions)
            .Must(r => !HasConflictingEqualsConditions(r))
            .WithMessage("A field can't be checked twice with 'EQUALS' in the same group");
        
        // Exactly one named flag per exclusion action (e.g. "Budget"). Rejects "None", numeric strings,
        // and comma-combined values — Enum.IsDefined only accepts a single declared name.
        RuleForEach(r => r.Actions)
        .Where(a => a.ActionField == ActionField.Exclusion)
            .Must(a => Enum.IsDefined(typeof(Exclusion), a.ActionValue) && a.ActionValue != nameof(Exclusion.None))
            .WithMessage("This type of exclusion is not supported");

        RuleForEach(r => r.Actions)
        .Where(a => a.ActionField == ActionField.Category)
            .MustAsync(async (r, ct) => await _cRepo.ExistsAsync(Guid.Parse(r.ActionValue), ct))
            .WithMessage("This type of category is not supported");
    }

    private static bool HasConflictingEqualsConditions(List<Condition> conditions)
    {
        var newList = conditions.GroupBy(c => new { c.GroupId, c.ConditionField });
        foreach(var item in newList)
        {
            //item enumerates twice and that sort of behavior should typically be avoided, but Rules objects should usually be pretty small. 
            //If it ever matters, here's the alternative one-pass method. Replace the current 'if(item.Any...))' with the commented loop

            /*
            int count = 0;
            bool hasEquals = false;
            foreach (var c in item) {
                count++;
                if(c.ConditionOperator == Operator.EQUALS) hasEquals = true;
            }

            if(hasEquals && count > 1) return true;
            */
            if(item.Any(c => c.ConditionOperator == Operator.EQUALS) && item.Count() > 1) return true;
        }

        return false;
    }
}