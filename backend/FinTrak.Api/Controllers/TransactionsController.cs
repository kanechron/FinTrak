using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinTrak.Core.Entities;
using FinTrak.Core.Utilities;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Api.DTOs;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController(ITransactionRepository repo, IMapper mapper, IPdfImportService pdfImportService, ITransactionNameMatchService tService) : ControllerBase
    {
        private readonly ITransactionRepository _repo = repo;
        private readonly IMapper _mapper = mapper;
        private readonly IPdfImportService _pdfImportService = pdfImportService;
        private readonly ITransactionNameMatchService _tService = tService;

        [HttpGet("get-transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int? offset, [FromQuery] int? limit)
        {
            var transactions = await _repo.GetByUserIdAsync(GetUserId(), offset, limit);
            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpGet("get-transactions-by-category/{id}")]
        public async Task<IActionResult> GetTransactionsByCategory(Guid id)
        {
            var transactions = await _repo.GetByCategoryIdAsync(id);
            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpPost("add-transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] Transaction transaction)
        {
            if (transaction == null || transaction.Amount <= 0)
                return BadRequest(new { error = "Invalid Transaction data" });

            var newTrans = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
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

            await _repo.AddAsync(newTrans);
            return Ok(new { message = "Transaction added successfully.", id = newTrans.Id });
        }

        [HttpPatch("update-transaction/{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] Transaction update)
        {
            var existing = await _repo.GetByIdAsync(id);
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

            await _repo.SaveAsync();
            return Ok(new { message = "Transaction updated successfully." });
        }

        [HttpPatch("apply-category-by-merchant")]
        public async Task<IActionResult> ApplyCategoryByMerchant([FromBody] ApplyCategoryRequest request)
        {
            var result = await _tService.MatchByName(request);
            return Ok(new { result });
        }

        [HttpDelete("delete-transaction/{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing == null) return NotFound(new { error = "Could not find transaction {id}" });

            existing.DeletedAt = DateTime.UtcNow;
            await _repo.SaveAsync();
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
