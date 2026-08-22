
using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;
using static FinTrak.Core.Utilities.SpendingStatisticsUtil;

namespace FinTrak.Infrastructure.Services;

public class SADReportService(IReportsRepository repts, ICategoryRepository cats) : ISADReportService
{
    private readonly IReportsRepository _repts = repts;
    private readonly ICategoryRepository _cats = cats;
    public async Task<SADReportResponseDto> GetSpendingAnomaliesAsync(Guid userId)
    {
        var categories = await _cats.GetAllAsync();
        var categoryNames = categories.ToDictionary(c => c.Id, c => c.Name);


        var insufficientCats = new List<SADInsufficientDataDto>();
        var sadCategories = new List<SADCategoryDto>();

        var running = await _repts.GetRunningTransactionTotal(userId);
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
                
                if(running.TryGetValue(categoryId, out var existing))
                {
                    filledPoints.Add(existing);
                }
                else
                {
                    insufficientCats.Add(new SADInsufficientDataDto {CategoryId = categoryId});
                    continue;
                }

                //Deviation for the most recent completed month comparison
                var recentMonthDeviation = CalculateDeviation(filledPoints, filledPoints.Count-1);

                sadCategories.Add(new SADCategoryDto
                {
                    RunningTotal = existing.MonthlySum,
                    Category = categoryNames.GetValueOrDefault(categoryId, "Uncategorized"),
                    CategoryId = categoryId,
                    PercentChange = recentMonthDeviation.PercentChange,
                    DollarChange = recentMonthDeviation.DollarChange,
                    DeviationLabel = GetDeviationLabel(recentMonthDeviation.ZScore),
                });
            }
            else
            {
                insufficientCats.Add(new SADInsufficientDataDto {CategoryId = categoryId});
            }
        }

        return new SADReportResponseDto
        {
            Categories = sadCategories,
            InsufficientCategories = insufficientCats
        };
    }
}