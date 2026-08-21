using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface IReportsRepository
{
    Task<Dictionary<Guid, List<MonthlyDataPoint>>> GetDataPoints(Guid userId);
    Task<Dictionary<Guid, MonthlyDataPoint>> GetRunningTransactionTotal(Guid userId);
}
    public readonly record struct MonthlyDataPoint(decimal MonthlySum, DateOnly Month);