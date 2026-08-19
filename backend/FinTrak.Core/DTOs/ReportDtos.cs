using FinTrak.Core.Interfaces;

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


    public class LTEForecastingResponseDto
    {
        public required List<LTEDataDto> Categories { get; init; }
        public required List<LTEInsufficientDataDto> InsufficientCategories { get; init; }
    }
    public class LTEDataDto
    {
        public required string Category { get; init; }
        public Guid CategoryId { get; init; }
        public required List<LTEDataPoint> DataPoints { get; init; }
        public required LTEDataPoint Projection { get; init; }
        public required string ProjectionConfidence { get; init; }
        public double PercentChange { get; init; }
        public decimal DollarChange { get; init; }
        public required string DeviationLabel { get; init; }
    }
    public class LTEInsufficientDataDto
    {
        public Guid CategoryId { get; init; }
    }
}
