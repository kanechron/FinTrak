using System.Runtime.CompilerServices;
using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;
using static FinTrak.Core.Utilities.SpendingStatisticsUtil;

namespace FinTrak.Infrastructure.Services;

public class LTEReportService(IReportsRepository repts, ICategoryRepository cats) : ILTEReportService
{
    private readonly IReportsRepository _repts = repts;
    private readonly ICategoryRepository _cats = cats;

    public async Task<LTEForecastingResponseDto> GetLTEForecasting(Guid userId)
    {
        var categories = await _cats.GetAllAsync();
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
                var filledPoints = dict.OrderBy(x => x.Key).Select(x => new MonthlyDataPoint(x.Value, x.Key)).ToList();
                var regPoints = filledPoints.Select((p, i) => new RegressionPoint(i + 1, p.MonthlySum)).ToList();

                //Deviation for the most recent completed month comparison
                var recentMonthDeviation = CalculateDeviation(filledPoints, filledPoints.Count - 1);
                var firstProjection = CalculateProjection(regPoints, filledPoints.Count + 1);
                var returnProjection = new MonthlyDataPoint(firstProjection, filledPoints.Last().Month.AddMonths(1));

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


}
