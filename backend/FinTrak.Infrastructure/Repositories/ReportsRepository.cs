
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

    public async Task<Dictionary<Guid, List<LTEDataPoint>>> GetDataPoints(Guid userId)
    { 

            var insufficientCats = await _db.Transactions
            .Where(t =>
            t.UserId == userId &&
            t.DeletedAt == null &&
            t.CategoryId != null &&
            t.Date >= DateOnly.FromDateTime(new DateTime(DateTime.Now.Year-1, DateTime.Now.Month, 1 )) &&
            t.Date < DateOnly.FromDateTime(DateTime.Now.AddDays(1 - DateTime.Now.Day))
            )
            .GroupBy(x => new {x.CategoryId, x.Date!.Value.Year, x.Date!.Value.Month})
            .Select(g => new
            {
                CategoryId = g.Key.CategoryId!.Value,
                g.Key.Year,
                g.Key.Month,
                MonthlySum = g.Sum(x => x.Amount) ?? 0m
            })
            .ToListAsync();
             
            var result = insufficientCats
            .GroupBy(x => x.CategoryId)
            .ToDictionary(
                g => g.Key, 
                g => g.Select(x => new LTEDataPoint(x.MonthlySum, new DateOnly(x.Year, x.Month, 1))).ToList());

        return result;
    }


}