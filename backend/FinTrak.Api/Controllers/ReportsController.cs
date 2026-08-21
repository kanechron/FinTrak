using Microsoft.AspNetCore.Mvc;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;
using Microsoft.AspNetCore.RateLimiting;

namespace FinTrak.Api.Controllers
{
    [EnableRateLimiting("report")]
    public class ReportsController : ApiBaseController
    {
        private readonly FinTrakDbContext _db;
        private readonly IExportService _exportService;
        private readonly ILTEReportService _lte;
        private readonly ISADReportService _sad;

        public ReportsController(FinTrakDbContext db, IExportService exportService, ILTEReportService lte, ISADReportService sad)
        {
            _db = db;
            _exportService = exportService;
            _lte = lte;
            _sad = sad;
        }

        [HttpGet("category-spending")]
        public async Task<IActionResult> GetCategorySpending([FromQuery] string? from, [FromQuery] string? to, [FromQuery] Guid[]? categoryIds, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var transactionsQuery = _db.Transactions
                .Where(
                    t => t.DeletedAt == null 
                    && !t.IsPending 
                    && t.Amount > 0
                    && t.Date != null 
                    && t.Date >= fromDate
                    && t.Date <= toDate
                    && t.CategoryId != null 
                    && t.UserId == userId);

            if (categoryIds != null && categoryIds.Length > 0)
                transactionsQuery = transactionsQuery.Where(t => categoryIds.Contains(t.CategoryId!.Value));

            var spending = await transactionsQuery
                .Join(_db.Categories, t => t.CategoryId, c => c.Id, (t, c) => new { t.Amount, c.Name, c.Id, t.CategoryDetailed })
                .Where(x => (!x.CategoryDetailed!.Name.StartsWith("TRANSFER_") || x.CategoryDetailed.Name.Contains("_FROM_APPS")) && !x.CategoryDetailed.Name.StartsWith("INCOME"))
                .GroupBy(x => new { x.Name, x.Id })
                .Select(g => new CategorySpendingDto { Id = g.Key.Id, Name = g.Key.Name, Amount = g.Sum(x => x.Amount) })
                .OrderByDescending(g => g.Amount)
                .ToListAsync();

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending!), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending!, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
                    _ => BadRequest(new {error = "Unsupported format."})
                };
            }

            return Ok(spending);
        }

        [HttpGet("category-detail-spending")]
        public async Task<IActionResult> GetCategoryDetailSpending([FromQuery] Guid categoryId, [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var spending = await _db.Transactions
                .Where(
                    t => t.DeletedAt == null 
                    && !t.IsPending 
                    && t.Amount > 0
                    && t.Date != null 
                    && t.Date >= fromDate 
                    && t.Date <= toDate
                    && t.UserId == userId
                    && t.CategoryId == categoryId
                    && t.CategoryDetailedId != null)
                .Join(_db.Categories, t => t.CategoryDetailedId, c => c.Id, (t, c) => new { t.Amount, c.Name, c.Id, t.CategoryDetailed })
                .Where(x => (!x.CategoryDetailed!.Name.StartsWith("TRANSFER_") || x.CategoryDetailed.Name.Contains("_FROM_APPS")) && !x.CategoryDetailed.Name.StartsWith("INCOME"))
                .GroupBy(x => new { x.Name, x.Id })
                .Select(g => new CategoryDetailSpendingDto { Id = g.Key.Id, Name = g.Key.Name, Amount = g.Sum(x => x.Amount) })
                .OrderByDescending(g => g.Amount)
                .ToListAsync();

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending!), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending!, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
                    _ => BadRequest(new {error = "Unsupported format."})
                };
            }

            return Ok(spending);
        }

        [HttpGet("monthly-spending")]
        public async Task<IActionResult> GetMonthlySpending([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var spending = await _db.Transactions
                .Where(
                    t => t.DeletedAt == null
                    && !t.IsPending
                    && t.Amount > 0
                    && t.Date != null
                    && t.Date >= fromDate
                    && t.Date <= toDate
                    && t.UserId == userId)
                .GroupJoin(_db.Categories, t => t.CategoryDetailedId, c => c.Id, (t, cats) => new { t, cats })
                .SelectMany(x => x.cats.DefaultIfEmpty(), (x, c) => new { x.t.Date, x.t.Amount, DetailName = c == null ? null : c.Name })
                .Where(x => x.DetailName == null || (!(x.DetailName.StartsWith("TRANSFER") && !x.DetailName.Contains("_FROM_APPS")) && !x.DetailName.StartsWith("INCOME")))
                .GroupBy(x => new { x.Date!.Value.Year, x.Date!.Value.Month })
                .Select(g => new MonthlySpendingDto { Year = g.Key.Year, Month = g.Key.Month, Amount = g.Sum(x => x.Amount) })
                .OrderBy(g => g.Year)
                .ThenBy(g => g.Month)
                .ToListAsync();

                if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending!), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending!, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
                    _ => BadRequest(new {error = "Unsupported format."})
                };
            }

            return Ok(spending);
        }

        [HttpGet("monthly-transactions")]
        public async Task<IActionResult> GetMonthlyTransactions([FromQuery] string? from, [FromQuery] string? to)
        {
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var userId = GetUserId();
            var result = await _db.Transactions
            .Where(
                    t => t.DeletedAt == null
                    && !t.IsPending
                    && t.Amount >= 0
                    && t.Date != null
                    && t.Date >= fromDate
                    && t.Date <= toDate
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

            return Ok(result);
        }

        [HttpGet("cash-flow")]
        public async Task<IActionResult> GetCashFlow([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var result = await _db.Transactions
                .Where(
                    t => t.DeletedAt == null
                    && !t.IsPending
                    && t.Date != null
                    && t.Date >= fromDate
                    && t.Date <= toDate
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

                if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(result!), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(result!, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
                    _ => BadRequest(new {error = "Unsupported format."})
                };
            }

            return Ok(result);
        }

        [HttpGet("cash-flow-transactions")]
        public async Task<IActionResult> GetCashFlowTransactions([FromQuery] string? from,[FromQuery] string? to)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var result = await _db.Transactions
            .Where(
                    t => t.DeletedAt == null
                    && !t.IsPending
                    && t.Date != null
                    && t.Date >= fromDate
                    && t.Date <= toDate
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

            return Ok(result);
        }

        [HttpGet("lte-report")]
        public async Task<IActionResult> GetLTEForecasting()
        {
            var userId = GetUserId();
            var result = await _lte.GetLTEForecasting(userId);

            return Ok(result);
        }

        [HttpGet("sad-report")]
        public async Task<IActionResult> GetSADReport()
        {
            var userId = GetUserId();
            var result = await _sad.GetSpendingAnomalies(userId);

            return Ok(result);
        }
    }
}
