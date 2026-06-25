using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using System.Security.Claims;

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

        [HttpGet("get-accounts")]
        public async Task<IActionResult> GetAccounts()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var accounts = await _db.Accounts
                    .Where(a => a.DeletedAt == null && a.UserId == userId)
                    .OrderBy(a => a.Name)
                    .Select(a => new
                    {
                        id = a.Id,
                        name = a.OfficialName ?? a.Name,
                        type = a.Subtype ?? a.Type.ToString(),
                        last4 = a.Mask,
                        balance = a.AvailableBalance ?? 0
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
