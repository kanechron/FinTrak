using FinTrak.Core.Entities;

namespace FinTrak.Api.DTOs
{
    public class BudgetDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public string Category { get; init; } = "";
        public decimal Spent { get; init; }
        public decimal Amount { get; init; }
        public DateOnly StartDate { get; init; }
        public DateOnly? EndDate { get; init; }
        public bool IsRecurring { get; init; }
        public string Period { get; init; } = "Monthly";
        public string? RecurringDate { get; init; }
    }
}
