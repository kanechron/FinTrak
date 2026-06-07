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
        public async Task<IActionResult> GetCategorySpending([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid[]? categoryIds)
        {
            from ??= DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            to ??= DateOnly.FromDateTime(DateTime.UtcNow);

            var transactionsQuery = _db.Transactions
                .Where(t => t.DeletedAt == null && !t.IsPending && t.Amount > 0 && t.Date >= from && t.Date <= to && t.CategoryId != null);

            if (categoryIds != null && categoryIds.Length > 0)
                {
                    transactionsQuery = transactionsQuery.Where(t => categoryIds.Contains(t.CategoryId!.Value));
                }


            var spending = await transactionsQuery
                .Join(_db.Categories, t => t.CategoryId, c => c.Id, (t, c) => new { t.Amount, c.Name })
                .GroupBy(x => x.Name)
                .Select(g => new { name = g.Key, amount = g.Sum(x => x.Amount) })
                .ToListAsync();

            return Ok(spending);
        }

        [HttpGet("monthly-spending")]
        public async Task<IActionResult> GetMonthlySpending([FromQuery] int year)
        {
            throw new NotImplementedException();
        }
        
        [HttpGet("budget-summary")]
        public async Task<IActionResult> GetBudgetSummary()
        {
            throw new NotImplementedException();
        }

        [HttpGet("cash-flow")]
        public async Task<IActionResult> GetCashFlow([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
        {
            throw new NotImplementedException();
        }
    }

}