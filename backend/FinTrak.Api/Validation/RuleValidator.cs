using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using FluentValidation;

namespace FinTrak.Api.Validation;

public class RuleValidator : AbstractValidator<Rule>
{
    private readonly Dictionary<TargetType, RuleFieldMapDto> _fieldmap;

    // RuleFor(...) calls go here directly — the primary constructor's class body
    // is the constructor body, no separate constructor needed.
    public RuleValidator(Dictionary<TargetType, RuleFieldMapDto> fieldmap)
    {
        _fieldmap = fieldmap;


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

        //Check if ConditionOperator is in the ConditionField's fieldmap first
        RuleForEach(r => r.Conditions)
            .SetValidator(r => new ConditionValidator(_fieldmap, r.Target ?? TargetType.Undefined));

        RuleForEach(r => r.Actions)
            .SetValidator(r => new ActionValidator(_fieldmap, r.Target ?? TargetType.Undefined));
        
        RuleFor(r => r.Actions)
            .Must(actions => actions.Select(a => a.ActionField).Distinct().Count() == actions.Count)
            .WithMessage("Each action type can only appear once.");

    }
}