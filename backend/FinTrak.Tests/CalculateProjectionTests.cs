using FinTrak.Core.Interfaces;
using static FinTrak.Core.Utilities.SpendingStatisticsUtil;

namespace FinTrak.Tests;

public class CalculateProjectionTests
{

    #region CalculateProjection Datasets
    // Flat spending — every month identical, so the regression should find slope = 0
    // and project the same value forward. Verifies CalculateProjection_ForProjection_FlatTrend.
    private readonly List<RegressionPoint> flatTrendPoints = Enumerable.Range(1, 12)
        .Select(x => new RegressionPoint(x, 500.00m))
        .ToList();

    // All points share the same X (zero variance in X) — the regression's denominator,
    // Σ(X - meanX)², is exactly 0 regardless of how many points or what their Y values are.
    // Verifies CalculateProjection_IdenticalXValues_ThrowsDivideByZero.
    private readonly List<RegressionPoint> identicalXPoints = new()
    {
        new(5, 100.00m),
        new(5, 200.00m),
        new(5, 300.00m),
    };

    /* A real, non-flat trend — reuses the same Groceries figures as CalculateDeviationTests' knownGoodPoints, converted to RegressionPoints. 
    Already hand-verified earlier in this project's planning: slope ≈ -7.33, intercept ≈ 657.85, projection for month 13 ≈ $562.51. */
    private readonly List<RegressionPoint> trendedPoints = new()
    {
        new(1, 633.70m),
        new(2, 537.74m),
        new(3, 461.77m),
        new(4, 608.76m),
        new(5, 939.84m),
        new(6, 781.22m),
        new(7, 579.41m),
        new(8, 565.65m),
        new(9, 560.16m),
        new(10, 617.25m),
        new(11, 605.58m),
        new(12, 431.07m),
    };
    #endregion

    #region CalculateProjection Tests
    [Fact]
    public void CalculateProjection_ForProjection_KnownGood()
    {
        var result = CalculateProjection(trendedPoints, trendedPoints.Count+1);

        Assert.Equal(562.51m, result, 2);
    }

    [Fact]
    public void CalculateProjection_ForProjection_FlatTrend()
    {
        var result = CalculateProjection(flatTrendPoints, flatTrendPoints.Count+1);

        Assert.Equal(500.00m, result, 2);
    }

    [Fact]
    public void CalculateProjection_IdenticalXValues_ThrowsDivideByZero()
    {
        Assert.Throws<DivideByZeroException>(() => CalculateProjection(identicalXPoints, identicalXPoints.Count+1));
    }
    #endregion

}
