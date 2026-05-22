using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public TransactionsController(FinTrakDbContext db)
        {
            _db = db;
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
                            date = t.Date.ToString("yyyy-MM-dd"),
                            merchant = t.MerchantName ?? t.MerchantNameRaw,
                            amount = t.Amount,
                            category = t.Category != null ? t.Category.Name : "Uncategorized",
                            categoryId = t.CategoryId,
                            pending = t.IsPending
                        })
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve transactions.", detail = ex.Message });
            }
        }

        
    }
}