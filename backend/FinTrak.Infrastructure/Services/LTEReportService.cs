using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;

namespace FinTrak.Infrastructure.Services;

public class LTEReportService(IReportsRepository repts, ICategoryRepository categoryRepo) : ILTEReportService
{
    private readonly IReportsRepository _repts = repts;
    private readonly ICategoryRepository _categoryRepo = categoryRepo;

    public async Task<LTEForecastingResponseDto> GetLTEForecasting(Guid userId)
    {
        var categories = await _categoryRepo.GetAllAsync();
        var categoryNames = categories.ToDictionary(c => c.Id, c => c.Name);

        var insufficientCats = new List<LTEInsufficientDataDto>();
        var lteCategories = new List<LTEDataDto>();

        var datapoints = await _repts.GetDataPoints(userId);
        foreach (var (categoryId, points) in datapoints)
        {
            if (points.Count >= 6)
            {
                var dict = points.ToDictionary(kvp => kvp.Month, kvp => kvp.MonthlySum);
                var windowStart = DateOnly.FromDateTime(new DateTime(DateTime.Now.Year - 1, DateTime.Now.Month, 1));
                for (int i = 0; i < 12; i++)
                {
                    if (!dict.Keys.Contains(windowStart))
                    {
                        dict.Add(windowStart, 0m);
                    }
                    windowStart = windowStart.AddMonths(1);
                }
                var filledPoints = dict.OrderBy(x => x.Key).Select(x => new LTEDataPoint(x.Value, x.Key)).ToList();
                var regPoints = filledPoints.Select((p, i) => new RegressionPoint(i + 1, p.MonthlySum)).ToList();

                //Deviation for the most recent completed month comparison
                var recentMonthDeviation = CalculateDeviation(filledPoints, filledPoints.Count - 1);
                var firstProjection = CalculateProjection(regPoints, filledPoints.Count + 1);
                var returnProjection = new LTEDataPoint(firstProjection, filledPoints.Last().Month.AddMonths(1));

                //Scan every month for candidates that significantly influence the projection (Cook's Distance stand-in)
                var flaggedCandidates = new List<(DateOnly Month, decimal ShiftPercent)>();
                for (int i = 0; i < filledPoints.Count; i++)
                {
                    var item = CalculateDeviation(filledPoints, i);
                    if (item.ZScore >= 2.0)
                    {
                        var compareProjection = CalculateProjection(regPoints.Where(rp => rp.X != i + 1).ToList(), filledPoints.Count + 1);
                        var shiftPercent = Math.Abs(firstProjection - compareProjection) / firstProjection * 100;
                        if (shiftPercent >= 10m)
                        {
                            flaggedCandidates.Add((filledPoints[i].Month, shiftPercent));
                        }
                    }
                }

                //
                var projectionConfidence = flaggedCandidates.Count == 0
                    ? "This projection reflects a consistent trend."
                    : $"This projection was significantly influenced by {flaggedCandidates.MaxBy(c => c.ShiftPercent).Month:MMMM yyyy}.";

                lteCategories.Add(new LTEDataDto
                {
                    Category = categoryNames.GetValueOrDefault(categoryId, "Uncategorized"),
                    CategoryId = categoryId,
                    DataPoints = filledPoints,
                    Projection = returnProjection,
                    ProjectionConfidence = projectionConfidence,
                    PercentChange = recentMonthDeviation.PercentChange,
                    DollarChange = recentMonthDeviation.DollarChange,
                    DeviationLabel = GetDeviationLabel(recentMonthDeviation.ZScore)
                });
            }
            else
            {
                insufficientCats.Add(new LTEInsufficientDataDto() { CategoryId = categoryId });
            }
        }

        return new LTEForecastingResponseDto
        {
            Categories = lteCategories,
            InsufficientCategories = insufficientCats
        };
    }

    /// <summary>
    /// Generates a label representing the volatility of the Z-Score
    /// </summary>
    /// <param name="zScore"></param>
    /// <returns>string</returns>
    private static string GetDeviationLabel(double zScore) => zScore switch
    {
        >= 2.0 => "Unusually high compared to your typical spending",
        <= -2.0 => "Unusually low compared to your typical spending",
        >= 1.0 => "Higher than your typical spending",
        <= -1.0 => "Lower than your typical spending",
        _ => "Typical for this category"
    };

    /// <summary>
    /// Calculates the deviation metrics for a series of Data Points
    /// </summary>
    /// <param name="filledPoints"></param>
    /// <param name="x"></param>
    /// <returns>Deviation fields: dollarChange, pctChange, zScore</returns>
    private Deviation CalculateDeviation(List<LTEDataPoint> filledPoints, int x)
    {
        var target = filledPoints[x].MonthlySum;
        var others = filledPoints.Where((p, i) => i != x);

        var mean = others.Average(p => p.MonthlySum);
        var sumOfSquares = others.Sum(p => (p.MonthlySum - mean) * (p.MonthlySum - mean));
        var variance = sumOfSquares / (filledPoints.Count - 2);
        var stdev = Math.Sqrt((double)variance);

        var dollarChange = target - mean;
        var pctChange = mean != 0 ? (double)(dollarChange / mean) * 100 : 0;
        var zScore = stdev != 0 ? (double)dollarChange / stdev : 0;

        return new Deviation(dollarChange, pctChange, zScore);
    }

    /// <summary>
    /// Calculate the projected outcome of next month's sum for a given series of datapoints
    /// </summary>
    /// <param name="points"></param>
    /// <param name="xNext"></param>
    /// <returns>Decimal value representing </returns>
    private decimal CalculateProjection(List<RegressionPoint> points, int xNext)
    {
        decimal meanY = points.Average(p => p.Y);
        decimal meanX = points.Sum(p => (decimal)p.X) / points.Count;
        var numerator = points.Sum(p => (p.X - meanX) * (p.Y - meanY));
        var denominator = points.Sum(p => (p.X - meanX) * (p.X - meanX));
        var LTESlope = numerator / denominator;
        var LTEIntercept = meanY - LTESlope * meanX;
        var result = LTESlope * xNext + LTEIntercept;
        return result;
    }

    /// <summary>
    /// A permanent position tag for a datapoint. Retains its chronological position to survive removal from a list.
    /// </summary>
    /// <param name="X"></param>
    /// <param name="Y"></param>
    private readonly record struct RegressionPoint(int X, decimal Y);

    /// <summary>
    /// The deviation data for a list of datapoints
    /// </summary>
    /// <param name="DollarChange"></param>
    /// <param name="PercentChange"></param>
    /// <param name="ZScore"></param>
    private readonly record struct Deviation(decimal DollarChange, double PercentChange, double ZScore);

}
