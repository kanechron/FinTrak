using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinTrak.Core.Entities;
using FinTrak.Core.Utilities;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Api.Validation;
using Microsoft.AspNetCore.RateLimiting;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController(ITransactionRepository repo, IMapper mapper, IPdfImportService pdfImportService, ITransactionNameMatchService tService, TransactionValidator tValidator) : ControllerBase
    {
        private readonly ITransactionRepository _repo = repo;
        private readonly IMapper _mapper = mapper;
        private readonly IPdfImportService _pdfImportService = pdfImportService;
        private readonly ITransactionNameMatchService _tService = tService;
        private readonly TransactionValidator _tValidator = tValidator;

        [HttpGet("get-transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] string? from, [FromQuery] string? to, CancellationToken cancellationToken)
        {
            var fromDate = DateOnly.TryParse(from, out var f) ? f : DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1));
            var toDate = DateOnly.TryParse(to, out var t) ? t : DateOnly.FromDateTime(DateTime.UtcNow);

            var transactions = await _repo.GetByUserIdAsync(GetUserId(), fromDate, toDate, cancellationToken);
            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpGet("get-transactions-by-category/{id}")]
        public async Task<IActionResult> GetTransactionsByCategory(Guid id, CancellationToken cancellationToken)
        {
            var transactions = await _repo.GetByCategoryIdAsync(id, cancellationToken);
            return Ok(_mapper.Map<List<TransactionDto>>(transactions));
        }

        [HttpPost("add-transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] Transaction transaction, CancellationToken cancellationToken)
        {
            var validationResult = await _tValidator.ValidateAsync(transaction, cancellationToken);
            if (!validationResult.IsValid)
                return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });

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

            await _repo.AddAsync(newTrans, cancellationToken);
            return Ok(new { message = "Transaction added successfully.", id = newTrans.Id });
        }

        [HttpPatch("update-transaction/{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] Transaction update, CancellationToken cancellationToken)
        {
            var existing = await _repo.GetByIdAsync(id, cancellationToken);
            if (existing == null) return NotFound(new { error = "Transaction not found" });
            if (existing.UserId != GetUserId()) return Forbid();

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

            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Transaction updated successfully." });
        }

        [HttpPatch("apply-category-by-merchant")]
        public async Task<IActionResult> ApplyCategoryByMerchant([FromBody] ApplyCategoryRequest request, CancellationToken cancellationToken)
        {
            var result = await _tService.MatchByName(request, cancellationToken);
            return Ok(new { result });
        }

        [HttpDelete("delete-transaction/{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id, CancellationToken cancellationToken)
        {
            var existing = await _repo.GetByIdAsync(id, cancellationToken);
            if (existing == null) return NotFound(new { error = "Could not find transaction {id}" });
            if (existing.UserId != GetUserId()) return Forbid();

            existing.DeletedAt = DateTime.UtcNow;
            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Transaction deleted successfully" });
        }

        [HttpPost("import-pdf")]
        [Consumes("multipart/form-data")]
        [EnableRateLimiting("expensive")]
        public async Task<IActionResult> ParsePDF([FromForm] PdfUploadRequest request, CancellationToken cancellationToken)
        {
            if (request.pdf == null || request.pdf.Length == 0) return BadRequest(new { error = "No PDF file provided." });

            var count = await _pdfImportService.ImportAsync(request.pdf.OpenReadStream(), GetUserId(), cancellationToken);
            return Ok(new { imported = count });
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    public class PdfUploadRequest
    {
        public IFormFile pdf { get; set; } = null!;
    }
}
