using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface IReportsRepository
{
    Task<Dictionary<Guid, List<MonthlyDataPoint>>> GetDataPoints(Guid userId);
    Task<Dictionary<Guid, MonthlyDataPoint>> GetRunningTransactionTotal(Guid userId);
    Task<List<CategorySpendingDto>> GetCategorySpending(Guid userId, DateOnly from, DateOnly to, Guid[]? categoryIds);
    Task<List<CategoryDetailSpendingDto>> GetCategoryDetailSpending(Guid userId, Guid categoryId, DateOnly from, DateOnly to);
    Task<List<MonthlySpendingDto>> GetMonthlySpending(Guid userId, DateOnly from, DateOnly to);
    Task<List<TransactionDto>> GetMonthlyTransactions(Guid userId, DateOnly from, DateOnly to);
    Task<List<CashFlowDto>> GetCashFlow(Guid userId, DateOnly from, DateOnly to);
    Task<List<TransactionDto>> GetCashFlowTransactions(Guid userId, DateOnly from, DateOnly to);
}
    public readonly record struct MonthlyDataPoint(decimal MonthlySum, DateOnly Month);