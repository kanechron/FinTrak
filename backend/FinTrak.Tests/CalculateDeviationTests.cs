using FinTrak.Infrastructure.Services;
using FinTrak.Core.Interfaces;
using static FinTrak.Infrastructure.Services.LTEReportService;


namespace FinTrak.Tests;

public class CalculateDeviationTests
{
    private readonly List<LTEDataPoint> knownGoodPoints;
    private readonly List<LTEDataPoint> meanZeroPoints;
    private readonly List<LTEDataPoint> stdevZeroPoints;
    public CalculateDeviationTests()
    {
        #region CalculateDeviation Datasets
        /*
            CalculateDeviation(points, 11) should generate closely to :
                - Average of 626.46
                - stddev 129.75
                - DollarChange -195.39
                - PercentChange -31.2%
                - ZScore -1.51
        */
        knownGoodPoints = new List<LTEDataPoint>
            {
                new(633.70m, new DateOnly(2025, 6, 1)),
                new(537.74m, new DateOnly(2025, 7, 1)),
                new(461.77m, new DateOnly(2025, 8, 1)),
                new(608.76m, new DateOnly(2025, 9, 1)),
                new(939.84m, new DateOnly(2025, 10, 1)),
                new(781.22m, new DateOnly(2025, 11, 1)),
                new(579.41m, new DateOnly(2025, 12, 1)),
                new(565.65m, new DateOnly(2026, 1, 1)),
                new(560.16m, new DateOnly(2026, 2, 1)),
                new(617.25m, new DateOnly(2026, 3, 1)),
                new(605.58m, new DateOnly(2026, 4, 1)),
                new(431.07m, new DateOnly(2026, 5, 1)),
            };
        // "Others" (indices 0-10) sum to exactly 0 without being identical, so variance/stdev
        // stays nonzero — isolates the mean==0 guard from the stdev==0 guard, which realistic
        // (always non-negative) MonthlySum data could never do on its own.
        meanZeroPoints = new List<LTEDataPoint>
            {
                new(-200.00m, new DateOnly(2025, 6, 1)),
                new(200.00m, new DateOnly(2025, 7, 1)),
                new(-100.00m, new DateOnly(2025, 8, 1)),
                new(100.00m, new DateOnly(2025, 9, 1)),
                new(-50.00m, new DateOnly(2025, 10, 1)),
                new(50.00m, new DateOnly(2025, 11, 1)),
                new(0.00m, new DateOnly(2025, 12, 1)),
                new(0.00m, new DateOnly(2026, 1, 1)),
                new(0.00m, new DateOnly(2026, 2, 1)),
                new(0.00m, new DateOnly(2026, 3, 1)),
                new(0.00m, new DateOnly(2026, 4, 1)),
                new(500.00m, new DateOnly(2026, 5, 1)), // target, index 11
            };

        // "Others" (indices 0-10) are all identical, so mean is nonzero but variance/stdev is
        // exactly 0 — isolates the stdev==0 guard from the mean==0 guard.
        stdevZeroPoints = new List<LTEDataPoint>
            {
                new(500.00m, new DateOnly(2025, 6, 1)),
                new(500.00m, new DateOnly(2025, 7, 1)),
                new(500.00m, new DateOnly(2025, 8, 1)),
                new(500.00m, new DateOnly(2025, 9, 1)),
                new(500.00m, new DateOnly(2025, 10, 1)),
                new(500.00m, new DateOnly(2025, 11, 1)),
                new(500.00m, new DateOnly(2025, 12, 1)),
                new(500.00m, new DateOnly(2026, 1, 1)),
                new(500.00m, new DateOnly(2026, 2, 1)),
                new(500.00m, new DateOnly(2026, 3, 1)),
                new(500.00m, new DateOnly(2026, 4, 1)),
                new(700.00m, new DateOnly(2026, 5, 1)), // target, index 11
            };
            #endregion


    }

    #region CalculateDeviation Tests
    [Fact]
    public void CalculateDeviation_ForDeviation_KnownGood()
    {
        var result = CalculateDeviation(knownGoodPoints, 11);

        Assert.Equal(-195.39m, result.DollarChange, 2);
        Assert.Equal(-31.2, result.PercentChange, 1);
        Assert.Equal(-1.51, result.ZScore, 2);

    }

    [Fact]
    public void CalculateDeviation_ForDeviation_MeanZeroGuard()
    {
        var result = CalculateDeviation(meanZeroPoints, 11);

        Assert.Equal(0, result.PercentChange, 2);
    }

    [Fact]
    public void CalculateDeviation_ForDeviation_StdevZeroGuard()
    {
        var result = CalculateDeviation(stdevZeroPoints, 11);

        Assert.Equal(0, result.ZScore, 2);
    }


    [Theory]
    [InlineData(0, 25.66, 4.22, 0.18)]
    [InlineData(11, -195.39, -31.2, -1.51)]
    public void CalculateDeviation_ExcludesCorrectIndex(
        int index, decimal expectedDollarChange, double expectedPercent, double expectedZScore)
    {
        var result = CalculateDeviation(knownGoodPoints, index);

        Assert.Equal(expectedDollarChange, result.DollarChange, 2);
        Assert.Equal(expectedPercent, result.PercentChange, 1);
        Assert.Equal(expectedZScore, result.ZScore, 2);
    }

    [Theory]
    [InlineData(11, -195.39, -31.2, -1.51)]  // below average -  negative
    [InlineData(4, 359.63, 62.0, 3.91)]       // above average - positive
    public void CalculateDeviation_SignMatchesDirection(
        int index, decimal expectedDollarChange, double expectedPercent, double expectedZScore)
    {
        var result = CalculateDeviation(knownGoodPoints, index);

        Assert.Equal(expectedDollarChange, result.DollarChange, 2);
        Assert.Equal(expectedPercent, result.PercentChange, 1);
        Assert.Equal(expectedZScore, result.ZScore, 2);
    }





    #endregion
}
