
using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography.X509Certificates;
using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories;

public class ReportsRepository(FinTrakDbContext db) : IReportsRepository
{
    private readonly FinTrakDbContext _db = db;

    // Interim hardcoded exclusion until the rules engine (TODO.md) lets users manage
    // this themselves. These aren't spending categories, so they don't belong in a
    // spending-trend forecast at all.
    private static readonly string[] CategoryBlacklist = ["TRANSFER_IN", "TRANSFER_OUT", "INCOME"];

    public async Task<Dictionary<Guid, List<MonthlyDataPoint>>> GetDataPoints(Guid userId)
    {

        var rawMonthlySums = await _db.Transactions
        .Where(t =>
        t.UserId == userId &&
        t.DeletedAt == null &&
        t.CategoryId != null &&
        !CategoryBlacklist.Contains(t.Category!.Name) &&
        t.Date >= DateOnly.FromDateTime(new DateTime(DateTime.Now.Year - 1, DateTime.Now.Month, 1)) &&
        t.Date < DateOnly.FromDateTime(DateTime.Now.AddDays(1 - DateTime.Now.Day))
        )
        .GroupBy(x => new { x.CategoryId, x.Date!.Value.Year, x.Date!.Value.Month })
        .Select(g => new
        {
            CategoryId = g.Key.CategoryId!.Value,
            g.Key.Year,
            g.Key.Month,
            MonthlySum = g.Sum(x => x.Amount) ?? 0m
        })
        .ToListAsync();

        var result = rawMonthlySums
        .GroupBy(x => x.CategoryId)
        .ToDictionary(
            g => g.Key,
            g => g.Select(x => new MonthlyDataPoint(x.MonthlySum, new DateOnly(x.Year, x.Month, 1))).ToList());

        return result;
    }

    public async Task<Dictionary<Guid, MonthlyDataPoint>> GetRunningTransactionTotal(Guid userId)
    {
        var rawMonthlySums = await _db.Transactions
            .Where(t =>
                t.DeletedAt == null &&
                t.UserId == userId &&
                t.CategoryId != null &&
                t.Date >= DateOnly.FromDateTime(DateTime.Now.AddDays(1 - DateTime.Now.Day))
            )
            .GroupBy(x => new { x.CategoryId, x.Date!.Value.Year, x.Date!.Value.Month })
            .Select(g => new
            {
                CategoryId = g.Key.CategoryId!.Value,
                g.Key.Year,
                g.Key.Month,
                MonthlySum = g.Sum(x => x.Amount) ?? 0m
            })
            .ToListAsync();

        return rawMonthlySums.ToDictionary(
            x => x.CategoryId,
            x => new MonthlyDataPoint(x.MonthlySum, new DateOnly(x.Year, x.Month, 1)));
    }

    public async Task<List<CategorySpendingDto>> GetCategorySpending(Guid userId, DateOnly from, DateOnly to, Guid[]? categoryIds)
    {
        var transactionsQuery = _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Amount > 0
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.CategoryId != null
                && t.UserId == userId);

        if (categoryIds != null && categoryIds.Length > 0)
            transactionsQuery = transactionsQuery.Where(t => categoryIds.Contains(t.CategoryId!.Value));

        return await transactionsQuery
            .Join(_db.Categories, t => t.CategoryId, c => c.Id, (t, c) => new { t.Amount, c.Name, c.Id, t.CategoryDetailed })
            .Where(x => (!x.CategoryDetailed!.Name.StartsWith("TRANSFER_") || x.CategoryDetailed.Name.Contains("_FROM_APPS")) && !x.CategoryDetailed.Name.StartsWith("INCOME"))
            .GroupBy(x => new { x.Name, x.Id })
            .Select(g => new CategorySpendingDto { Id = g.Key.Id, Name = g.Key.Name, Amount = g.Sum(x => x.Amount) })
            .OrderByDescending(g => g.Amount)
            .ToListAsync();
    }

    public async Task<List<CategoryDetailSpendingDto>> GetCategoryDetailSpending(Guid userId, Guid categoryId, DateOnly from, DateOnly to)
    {
        return await _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Amount > 0
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.UserId == userId
                && t.CategoryId == categoryId
                && t.CategoryDetailedId != null)
            .Join(_db.Categories, t => t.CategoryDetailedId, c => c.Id, (t, c) => new { t.Amount, c.Name, c.Id, t.CategoryDetailed })
            .Where(x => (!x.CategoryDetailed!.Name.StartsWith("TRANSFER_") || x.CategoryDetailed.Name.Contains("_FROM_APPS")) && !x.CategoryDetailed.Name.StartsWith("INCOME"))
            .GroupBy(x => new { x.Name, x.Id })
            .Select(g => new CategoryDetailSpendingDto { Id = g.Key.Id, Name = g.Key.Name, Amount = g.Sum(x => x.Amount) })
            .OrderByDescending(g => g.Amount)
            .ToListAsync();
    }

    public async Task<List<MonthlySpendingDto>> GetMonthlySpending(Guid userId, DateOnly from, DateOnly to)
    {
        return await _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Amount > 0
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.UserId == userId)
            .GroupJoin(_db.Categories, t => t.CategoryDetailedId, c => c.Id, (t, cats) => new { t, cats })
            .SelectMany(x => x.cats.DefaultIfEmpty(), (x, c) => new { x.t.Date, x.t.Amount, DetailName = c == null ? null : c.Name })
            .Where(x => x.DetailName == null || (!(x.DetailName.StartsWith("TRANSFER") && !x.DetailName.Contains("_FROM_APPS")) && !x.DetailName.StartsWith("INCOME")))
            .GroupBy(x => new { x.Date!.Value.Year, x.Date!.Value.Month })
            .Select(g => new MonthlySpendingDto { Year = g.Key.Year, Month = g.Key.Month, Amount = g.Sum(x => x.Amount) })
            .OrderBy(g => g.Year)
            .ThenBy(g => g.Month)
            .ToListAsync();
    }

    public async Task<List<TransactionDto>> GetMonthlyTransactions(Guid userId, DateOnly from, DateOnly to)
    {
        return await _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Amount >= 0
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.UserId == userId
                && (t.CategoryDetailedId == null || !(t.CategoryDetailed!.Name.StartsWith("TRANSFER") && !t.CategoryDetailed!.Name.Contains("_FROM_APPS"))))
            .Include(i => i.Category)
            .Include(i => i.CategoryDetailed)
            .Select(g => new TransactionDto
            {
                Id = g.Id,
                Merchant = g.MerchantName,
                Amount = g.Amount,
                Date = g.Date.ToString()!,
                Category = g.Category!.Name,
                CategoryDetailed = g.CategoryDetailed != null ? g.CategoryDetailed.Name : null,
                Pending = g.IsPending
            })
            .ToListAsync();
    }

    public async Task<List<CashFlowDto>> GetCashFlow(Guid userId, DateOnly from, DateOnly to)
    {
        return await _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.UserId == userId)
            .GroupBy(t => new { t.Date!.Value.Year, t.Date!.Value.Month })
            .Select(g => new CashFlowDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Income = -(g.Where(t => t.Amount < 0).Sum(t => t.Amount) ?? 0m),
                Expenses = g.Where(t => t.Amount > 0).Sum(t => t.Amount) ?? 0m,
                Net = -(g.Where(t => t.Amount < 0).Sum(t => t.Amount) ?? 0m) - (g.Where(t => t.Amount > 0).Sum(t => t.Amount) ?? 0m)
            })
            .OrderBy(g => g.Year)
            .ThenBy(g => g.Month)
            .ToListAsync();
    }

    public async Task<List<TransactionDto>> GetCashFlowTransactions(Guid userId, DateOnly from, DateOnly to)
    {
        return await _db.Transactions
            .Where(
                t => t.DeletedAt == null
                && !t.IsPending
                && t.Date != null
                && t.Date >= from
                && t.Date <= to
                && t.UserId == userId)
            .Include(i => i.Category)
            .Include(i => i.CategoryDetailed)
            .Select(g => new TransactionDto
            {
                Id = g.Id,
                Merchant = g.MerchantName,
                Amount = g.Amount,
                Date = g.Date.ToString()!,
                Category = g.Category!.Name,
                CategoryDetailed = g.CategoryDetailed != null ? g.CategoryDetailed.Name : null,
                Pending = g.IsPending
            })
            .OrderByDescending(t => t.Amount)
            .ToListAsync();
    }
}
