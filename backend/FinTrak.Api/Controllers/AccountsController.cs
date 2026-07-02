using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using System.Security.Claims;
using FinTrak.Api.DTOs;

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
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var accounts = await _db.Accounts
                .Where(a => a.DeletedAt == null && a.UserId == userId)
                .OrderBy(a => a.Name)
                .Select(a => new AccountDto
                {
                    Id = a.Id,
                    Name = a.OfficialName ?? a.Name,
                    Type = a.Subtype ?? a.Type.ToString(),
                    Last4 = a.Mask,
                    Balance = a.AvailableBalance ?? 0
                })
                .ToListAsync();

            return Ok(accounts);
        }
    }
}
