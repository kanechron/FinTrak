using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using FluentValidation;

namespace FinTrak.Api.Validation;

public class ActionValidator : AbstractValidator<FinTrak.Core.Entities.Action>
{
    public ActionValidator(Dictionary<TargetType, RuleFieldMapDto> fieldmap, TargetType target)
    {
        RuleFor(a => a.ActionField)
            .NotNull().WithMessage("Action must have a field.");

        RuleFor(a => a.ActionType)
            .NotNull().WithMessage("Action must have a type.");

        RuleFor(a => a.ActionValue)
            .NotNull().WithMessage("Action must have a value."); 

        RuleFor(a => a)
            .Must(a => fieldmap.TryGetValue(target, out var entry) &&
                       entry.Actions.TryGetValue(a.ActionField, out var types) &&
                       types.Contains(a.ActionType))
            .WithMessage("Action type is not valid for this field.");
    }
}
