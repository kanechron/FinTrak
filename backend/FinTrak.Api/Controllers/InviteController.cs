using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class InvitesController(FinTrakDbContext db) : ControllerBase
    {
        private readonly FinTrakDbContext _db = db;

        [HttpPost("create")]
        public async Task<IActionResult> CreateInvite()
        {
            try
            {
                var newInvite = new Invite
                {
                    Token = Guid.NewGuid(),
                };

                _db.Invites.Add(newInvite);
                await _db.SaveChangesAsync();

                var baseUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://localhost:5173";

                return Ok(new { link = $"{baseUrl}/api/invites/{newInvite.Token}" });
            }
            catch (Exception ex)
            {

                return StatusCode(500, new
                {
                    message = "Could not create invite link: " + ex.Message
                });
            }
        }

        [HttpGet("{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateToken(Guid token)
        {
            try
            {
                var invite = await _db.Invites.FirstOrDefaultAsync(i => i.Token == token);

                if (invite == null)
                    return NotFound("Invite not found.");
                if (invite.UsedAt != null)
                    return BadRequest("Invite has already been used.");
                if (invite.ExpiresAt < DateTime.UtcNow)
                    return BadRequest("Invite has expired.");

                HttpContext.Session.SetString("invite_token", token.ToString());
                return Redirect("/api/auth/login");

            }
            catch (Exception ex)
            {

                return StatusCode(500, new
                {
                    message = "Could not validate token: " + ex.Message
                });
            }
        }
    }
}
