namespace FinTrak.Core.DTOs
{
    public class CategorySpendingDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public decimal? Amount { get; init; }
    }

    public class CategoryDetailSpendingDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public decimal? Amount { get; init; }
    }

    public class MonthlySpendingDto
    {
        public int Year { get; init; }
        public int Month { get; init; }
        public decimal? Amount { get; init; }
    }

    public class CashFlowDto
    {
        public int Year { get; init; }
        public int Month { get; init; }
        public decimal Income { get; init; }
        public decimal Expenses { get; init; }
        public decimal Net { get; init; }
    }
}
