using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinTrak.Core.Entities;
using FinTrak.Core.Utilities;
using FinTrak.Infrastructure.BackgroundServices;
using static FinTrak.Infrastructure.BackgroundServices.TransactionNameMatchService;
using AutoMapper;
using FinTrak.Api.DTOs;
using FinTrak.Core.Interfaces;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController(FinTrakDbContext db, TransactionNameMatchService tService, IMapper mapper, IPdfImportService pdfImportService) : ControllerBase
    {
        private readonly FinTrakDbContext _db = db;
        private readonly TransactionNameMatchService _tService = tService;
        private readonly IMapper _mapper = mapper;
        private readonly IPdfImportService _pdfImportService = pdfImportService;

        [HttpGet("get-transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int? offset, [FromQuery] int? limit)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var query = _db.Transactions
                .Where(t => t.DeletedAt == null && t.UserId == userId)
                .Include(t => t.Category)
                .Include(t => t.CategoryDetailed)
                .OrderByDescending(t => t.Date);

            var transactions = (limit == null || limit == 0)
                ? await query.ToListAsync()
                : await query.Skip(offset ?? 0).Take(limit.Value).ToListAsync();

            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpGet("get-transactions-by-category/{id}")]
        public async Task<IActionResult> GetTransactionsByCategory(Guid id)
        {
            var transactions = await _db.Transactions
                .Where(t => t.DeletedAt == null && t.CategoryId == id)
                .Include(t => t.Category)
                .Include(t => t.CategoryDetailed)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpPost("add-transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] Transaction transaction)
        {
            if (transaction == null || transaction.Amount <= 0)
                return BadRequest(new { error = "Invalid Transaction data" });

            var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

            var newTrans = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PlaidTransactionId = null,
                Amount = transaction.Amount,
                MerchantNameNormalized = transaction.MerchantName.NormalizeName(),
                MerchantNameRaw = transaction.MerchantName,
                MerchantName = transaction.MerchantName,
                CategoryId = transaction.CategoryId,
                CategoryDetailedId = transaction.CategoryDetailedId,
                Description = transaction.Description,
                IsPending = false,
                IsManual = true,
                DedupHash = transaction.DedupHash,
                DedupStatus = transaction.DedupStatus,
                CreatedAt = transaction.CreatedAt,
                Date = transaction.Date
            };

            _db.Transactions.Add(newTrans);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Transaction added successfully.", id = newTrans.Id });
        }

        [HttpPatch("update-transaction/{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] Transaction update)
        {
            var existing = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
            if (existing == null) return NotFound(new { error = "Transaction not found" });

            if (!string.IsNullOrWhiteSpace(update.MerchantName))
                existing.MerchantName = update.MerchantName.NormalizeName();

            if (update.CategoryId.HasValue)
                existing.CategoryId = update.CategoryId;

            existing.CategoryDetailedId = update.CategoryDetailedId;

            if (!string.IsNullOrWhiteSpace(update.Description))
                existing.Description = update.Description;

            if (update.Amount.HasValue && update.Amount > 0)
                existing.Amount = update.Amount;

            if (update.Date.HasValue)
                existing.Date = update.Date;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Transaction updated successfully." });
        }

        [HttpPatch("apply-category-by-merchant")]
        public async Task<IActionResult> ApplyCategoryByMerchant([FromBody] ApplyCategoryRequest request)
        {
            var result = await _tService.TransactionMatchByName(request);
            return Ok(new { result });
        }

        [HttpDelete("delete-transaction/{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var existing = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
            if (existing == null) return NotFound(new { error = "Could not find transaction {id}" });

            existing.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Transaction deleted successfully" });
        }

        [HttpPost("import-pdf")]
        public async Task<IActionResult> ParsePDF([FromForm] IFormFile pdf)
        {
            if (pdf == null || pdf.Length == 0) return BadRequest(new { error = "No PDF file provided." });

            var count = await _pdfImportService.ImportAsync(pdf.OpenReadStream(), GetUserId());
            return Ok(new { imported = count });
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    }

    
}
