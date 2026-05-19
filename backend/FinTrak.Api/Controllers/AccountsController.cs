using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class AccountsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public AccountsController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccounts()
        {
            try
            {
                var accounts = await _db.Accounts
                    .Where(a => a.DeletedAt == null)
                    .OrderBy(a => a.Name)
                    .Select(a => new
                    {
                        id = a.Id,
                        name = a.OfficialName ?? a.Name,
                        type = a.Subtype ?? a.Type.ToString(),
                        last4 = a.Mask,
                        balance = a.CurrentBalance ?? 0
                    })
                    .ToListAsync();

                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve accounts.", detail = ex.Message });
            }
        }
    }
}
