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
        public required List<MonthlyDataPoint> DataPoints { get; init; }
        public required MonthlyDataPoint Projection { get; init; }
        public required string ProjectionConfidence { get; init; }
        public double PercentChange { get; init; }
        public decimal DollarChange { get; init; }
        public required string DeviationLabel { get; init; }
    }
    public class LTEInsufficientDataDto
    {
        public Guid CategoryId { get; init; }
    }

    public class SADReportResponseDto
    {
        public required List<SADCategoryDto> Categories { get; init; }
        public required List<SADInsufficientDataDto> InsufficientCategories { get; init; }
    }

    public class SADCategoryDto
    {
        public required string Category { get; init; }
        public required Guid CategoryId { get; init; }
        public required decimal RunningTotal { get; init; }
        public required decimal DollarChange { get; init; }
        public required double PercentChange { get; init; }
        // TODO: DeviationLabel is shared verbatim with LTEDataDto (same GetDeviationLabel output).
        // Revisit whether a naming scheme distinguishing the two contexts is worth it later.
        public required string DeviationLabel { get; init; }
    }

    public class SADInsufficientDataDto
    {
        public Guid CategoryId { get; init; }
    }
}
