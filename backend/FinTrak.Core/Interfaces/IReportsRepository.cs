using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface IReportsRepository
{
    Task<Dictionary<Guid, List<LTEDataPoint>>> GetDataPoints(Guid userId);
}
    public readonly record struct LTEDataPoint(decimal MonthlySum, DateOnly Month);