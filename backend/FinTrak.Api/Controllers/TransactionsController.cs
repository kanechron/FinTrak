using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using FinTrak.Core.Entities;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using System.Text.RegularExpressions;
using FinTrak.Core.Utilities;
using FinTrak.Infrastructure.BackgroundServices;
using static FinTrak.Infrastructure.BackgroundServices.TransactionNameMatchService;


namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;
        private readonly TransactionNameMatchService _tService;

        public TransactionsController(FinTrakDbContext db, TransactionNameMatchService tService)
        {
            _db = db;
            _tService = tService;
        }


        [HttpGet("get-transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            try
            {
                var transactions = await _db.Transactions
                    .Where(t => t.DeletedAt == null)
                    .OrderByDescending(t => t.Date)
                    .Select(t => new
                        {
                            id = t.Id,
                            accountId = t.AccountId,
                            date = t.Date!.Value.ToString("yyyy-MM-dd"),
                            merchant = t.MerchantName ?? t.MerchantNameRaw,
                            amount = t.Amount,
                            category = t.Category != null ? t.Category!.Name : "Uncategorized",
                            categoryDetailed = t.CategoryDetailed,
                            categoryId = t.CategoryId,
                            pending = t.IsPending,
                            
                        })
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve transactions.", detail = ex.Message });
            }
        }

        [HttpGet("get-transactions-by-category/{id}")]
        public async Task<IActionResult> GetTransactionsByCategory(Guid id)
        {
            try
            {
                var trans = await _db.Transactions
                .Where(t => t.DeletedAt == null && t.CategoryId == id)
                .OrderByDescending(t => t.Date)
                .Select(t => new
                        {
                            id = t.Id,
                            accountId = t.AccountId,
                            date = t.Date!.Value.ToString("yyyy-MM-dd"),
                            merchant = t.MerchantName ?? t.MerchantNameRaw,
                            amount = t.Amount,
                            category = t.Category != null ? t.Category!.Name : "Uncategorized",
                            categoryDetailed = t.CategoryDetailed,
                            categoryId = t.CategoryId,
                            pending = t.IsPending,
                            
                        })
                .ToListAsync();

                return Ok(trans);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new {error = $"Failed to retrieve transactions with category {id}", detail = ex.Message });
            }
        }

        [HttpPost("add-transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] Transaction transaction)
        {
            try
            {
                if (transaction == null || transaction.Amount <= 0)
                {
                    return BadRequest(new { error = "Invalid Transaction data"});
                }
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
                    Category = transaction.Category,
                    CategoryDetailed = transaction.CategoryDetailed!,
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
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add transaction: ", detail = ex.Message});
            }
        }

        [HttpPatch("update-transaction/{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] Transaction update)
        {
            try
            {
                var existing = await _db.Transactions
                    .FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

                if (existing == null) return NotFound(new { error = "Transaction not found" });

                if (!string.IsNullOrWhiteSpace(update.MerchantName))
                    existing.MerchantName = update.MerchantName.NormalizeName();

                if (update.CategoryId.HasValue)
                    existing.CategoryId = update.CategoryId;

                if (!string.IsNullOrWhiteSpace(update.Description))
                    existing.Description = update.Description;

                if (update.Amount.HasValue && update.Amount > 0)
                    existing.Amount = update.Amount;

                if (update.Date.HasValue)
                    existing.Date = update.Date;

                await _db.SaveChangesAsync();
                return Ok(new { message = "Transaction updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update transaction.", detail = ex.Message });
            }
        }


        [HttpPatch("apply-category-by-merchant")]
        public async Task<IActionResult> ApplyCategoryByMerchant([FromBody] ApplyCategoryRequest request)
        {
            try
            {
                var result = await _tService.TransactionMatchByName(request);

                
                return Ok(new {result});
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to apply category.", detail = ex.Message });
            }
        }

        [HttpDelete("delete-transaction/{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            try
            {
            var existing = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

            if (existing == null) return NotFound(new { error = "Could not find transaction {id}" });

            existing.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new {message = "Transaction deleted successfully"});
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete transaction.", detail = ex.Message });
            }
            
        }

        
    }


}