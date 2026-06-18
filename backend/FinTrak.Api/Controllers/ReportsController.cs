// using FinTrak.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace Fintrak.Api.Controllers
{
    
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public ReportsController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet("category-spending")]
        public async Task<IActionResult> GetCategorySpending([FromQuery] string? from, [FromQuery] string? to, [FromQuery] Guid[]? categoryIds)
        {
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);


            var transactionsQuery = _db.Transactions
                .Where(t => t.DeletedAt == null && !t.IsPending && t.Amount > 0 && t.Date != null && t.Date >= fromDate && t.Date <= toDate && t.CategoryId != null && t.CategoryDetailed != "TRANSFER_OUT_ACCOUNT_TRANSFER" && t.CategoryDetailed != "TRANSFER_IN_ACCOUNT_TRANSFER");

            if (categoryIds != null && categoryIds.Length > 0)
                {
                    transactionsQuery = transactionsQuery.Where(t => categoryIds.Contains(t.CategoryId!.Value));
                }


            var spending = await transactionsQuery.Include(t => t.Category)
                .Join(_db.Categories, t => t.CategoryId, c => c.Id, (t, c) => new { t.Amount, c.Name })
                .GroupBy(x => x.Name)
                .Select(g => new { name = g.Key, amount = g.Sum(x => x.Amount) })
                .OrderByDescending(g => g.amount)
                .ToListAsync();

            return Ok(spending);
        }

        [HttpGet("monthly-spending")]
        public async Task<IActionResult> GetMonthlySpending([FromQuery] string? from, [FromQuery] string? to)
        {
            
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var transactionsQuery = _db.Transactions
                .Where(t => t.DeletedAt == null && !t.IsPending && t.Amount > 0 && t.Date != null && t.Date >= fromDate && t.Date <= toDate && t.CategoryDetailed != "TRANSFER_OUT_ACCOUNT_TRANSFER" && t.CategoryDetailed != "TRANSFER_IN_ACCOUNT_TRANSFER" && t.CategoryDetailed != "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS");

            var spending = await transactionsQuery.Include(t => t.Category)
                .GroupBy(t => new { t.Date!.Value.Year, t.Date!.Value.Month })
                .Select(g => new { year = g.Key.Year, month = g.Key.Month, amount = g.Sum(t => t.Amount) })
                .OrderBy(g => g.year)
                .ThenBy(g => g.month)
                .ToListAsync();
            return Ok(spending);
        }

        

        [HttpGet("cash-flow")]
        public async Task<IActionResult> GetCashFlow([FromQuery] string? from, [FromQuery] string? to)
        {

            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var transactionsQuery = _db.Transactions
                .Where(t => t.DeletedAt == null && !t.IsPending && t.Date != null && t.Date >= fromDate && t.Date <= toDate);

            var result = await transactionsQuery
                .GroupBy(t => new { t.Date!.Value.Year, t.Date!.Value.Month })
                .Select(g => new {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    income = -g.Where(t => t.Amount < 0).Sum(t => t.Amount),
                    expenses = g.Where(t => t.Amount > 0).Sum(t => t.Amount),
                    net = -g.Where(t => t.Amount < 0).Sum(t => t.Amount) - g.Where(t => t.Amount > 0).Sum(t => t.Amount)
                })
                .OrderBy(g => g.year)
                .ThenBy(g => g.month)
                .ToListAsync();

            return Ok(result);
        }
    }

}