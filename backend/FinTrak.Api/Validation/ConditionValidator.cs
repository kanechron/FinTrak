using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using FluentValidation;
using Microsoft.IdentityModel.Tokens.Experimental;

namespace FinTrak.Api.Validation;

public class ConditionValidator : AbstractValidator<Condition>
{
    public ConditionValidator(Dictionary<TargetType, RuleFieldMapDto> fieldmap, TargetType target)
    {
        if(target != TargetType.Undefined) {
            RuleFor(c => c.GroupId)
                .NotNull().WithMessage("Condition must have a GroupId.");

            RuleFor(c => c.ConditionField)
                .NotNull().WithMessage("Condition must have a field.");

            RuleFor(c => c.ConditionOperator)
                .NotNull().WithMessage("Condition must have an operator.");

            RuleFor(c => c.ConditionValue)
                .NotNull().WithMessage("Condition must have a value.");
            
            RuleFor(c => c)
                .Must(c => fieldmap.TryGetValue(target, out var entry) &&
                    c.ConditionOperator is not null &&
                    entry.Conditions.TryGetValue(c.ConditionField, out var ops) &&
                    ops.Contains(c.ConditionOperator.Value))
                .WithMessage("Operator is not valid for this field"); 
        }
    }
}
