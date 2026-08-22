using FinTrak.Core.Interfaces;

namespace FinTrak.Core.Utilities;

public static class SpendingStatisticsUtil
{
    /// <summary>
    /// Generates a label representing the volatility of the Z-Score
    /// </summary>
    /// <param name="zScore"></param>
    /// <returns>string</returns>
    public static string GetDeviationLabel(double zScore) => zScore switch
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
    public static Deviation CalculateDeviation(List<MonthlyDataPoint> filledPoints, int x)
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
    public static decimal CalculateProjection(List<RegressionPoint> points, int xNext)
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
    public readonly record struct RegressionPoint(int X, decimal Y);

    /// <summary>
    /// The deviation data for a list of datapoints
    /// </summary>
    /// <param name="DollarChange"></param>
    /// <param name="PercentChange"></param>
    /// <param name="ZScore"></param>
    public readonly record struct Deviation(decimal DollarChange, double PercentChange, double ZScore);
}