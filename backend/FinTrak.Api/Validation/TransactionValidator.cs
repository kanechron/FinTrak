using FinTrak.Core.Entities;
using FluentValidation;

namespace FinTrak.Api.Validation;

public class TransactionValidator : AbstractValidator<Transaction>
{
    public TransactionValidator()
    {
        RuleFor(t => t.Amount)
            .NotNull().WithMessage("Amount is required.")
            .NotEqual(0).WithMessage("Amount cannot be zero.");

        RuleFor(t => t.MerchantName)
            .NotEmpty().WithMessage("Merchant name is required.")
            .MaximumLength(200).WithMessage("Merchant name cannot exceed 200 characters.");

        RuleFor(t => t.Date)
            .NotNull().WithMessage("Date is required.");

        RuleFor(t => t.CategoryId)
            .NotNull().WithMessage("Category is required.");
    }
}