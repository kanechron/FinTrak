using FluentValidation;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Validation;

public class BudgetValidator : AbstractValidator<Budget>
{
    public BudgetValidator()
    {
        RuleFor(b => b.Name)
            .NotEmpty().WithMessage("Budget name is required.")
            .MaximumLength(200).WithMessage("Budget name cannot exceed 200 characters.");

        RuleFor(b => b.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(b => b.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(b => b.EndDate)
            .NotNull().WithMessage("End date is required for custom budgets.")
            .GreaterThan(b => b.StartDate).WithMessage("End date must be after start date.")
            .When(b => b.Period == BudgetPeriod.Custom);
    }
}
