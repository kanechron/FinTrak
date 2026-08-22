using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Interfaces;
using Microsoft.AspNetCore.RateLimiting;

namespace FinTrak.Api.Controllers
{
    [EnableRateLimiting("report")]
    public class ReportsController : ApiBaseController
    {
        private readonly IReportsRepository _repo;
        private readonly IExportService _exportService;
        private readonly ILTEReportService _lte;

        public ReportsController(FinTrakDbContext db, IExportService exportService, ILTEReportService lte)
        {
            _repo = repo;
            _exportService = exportService;
            _lte = lte;
        }

        [HttpGet("category-spending")]
        public async Task<IActionResult> GetCategorySpending([FromQuery] string? from, [FromQuery] string? to, [FromQuery] Guid[]? categoryIds, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var spending = await _repo.GetCategorySpending(userId, fromDate, toDate, categoryIds);

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
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

            var spending = await _repo.GetCategoryDetailSpending(userId, categoryId, fromDate, toDate);

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
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

            var spending = await _repo.GetMonthlySpending(userId, fromDate, toDate);

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(spending), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(spending, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
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
            var result = await _repo.GetMonthlyTransactions(userId, fromDate, toDate);

            return Ok(result);
        }

        [HttpGet("cash-flow")]
        public async Task<IActionResult> GetCashFlow([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? format)
        {
            var userId = GetUserId();
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var result = await _repo.GetCashFlow(userId, fromDate, toDate);

            if (format != null)
            {
                return format switch
                {
                    "csv" => File(_exportService.ExportToCsv(result), "text/csv", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.csv"),
                    "xlsx" => File(_exportService.ExportToXlsx(result, fromDate, toDate), "application/vnd.openxlmformats-officedocument.spreadsheetml.sheet", $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}.xlsx"),
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

            var result = await _repo.GetCashFlowTransactions(userId, fromDate, toDate);

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
            var result = await _sad.GetSpendingAnomaliesAsync(userId);

            return Ok(result);
        }

        [HttpGet("lte-forecasting")]
        public async Task<IActionResult> GetLTEForecasting()
        {
            var userId = GetUserId();
            var result = await _lte.GetLTEForecasting(userId);

            return Ok(result);
        }
    }
}
