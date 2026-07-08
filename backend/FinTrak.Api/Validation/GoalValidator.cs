using FinTrak.Core.Entities;
using FluentValidation;

namespace FinTrak.Api.Validation;

public class GoalValidator : AbstractValidator<Goal>
{
    public GoalValidator()
    {
        RuleFor(g => g.Name)
            .NotEmpty().WithMessage("Goal name is required.")
            .MaximumLength(200).WithMessage("Goal name cannot exceed 200 characters.");

        RuleFor(g => g.TargetAmount)
            .NotNull().WithMessage("Target amount is required.")
            .GreaterThan(0).WithMessage("Target amount must be greater than zero.");

        RuleFor(g => g.TargetDate)
            .GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow)).WithMessage("Target date must be in the future.")
            .When(g => g.TargetDate.HasValue);
    }
}
