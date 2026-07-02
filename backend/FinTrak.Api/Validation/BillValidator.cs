using FluentValidation;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Validation;

public class BillValidator : AbstractValidator<Bill>
{
    public BillValidator()
    {
        RuleFor(b => b.Name)
            .NotEmpty().WithMessage("Bill name is required.")
            .MaximumLength(200).WithMessage("Bill name cannot exceed 200 characters.");

        RuleFor(b => b.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(b => b.CustomDate)
            .NotNull().WithMessage("Custom date is required when frequency is Custom.")
            .When(b => b.Frequency == BillFrequency.Custom);

        RuleFor(b => b.DueDay)
            .NotNull().WithMessage("Due day is required for this frequency.")
            .InclusiveBetween(1, 31).WithMessage("Due day must be between 1 and 31.")
            .When(b => b.Frequency == BillFrequency.Monthly
                    || b.Frequency == BillFrequency.Quarterly
                    || b.Frequency == BillFrequency.Yearly);
    }
}
