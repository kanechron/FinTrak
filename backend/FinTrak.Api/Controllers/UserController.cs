using System.Security.Claims;
using FinTrak.Api.Utilities;
using FinTrak.Core.Interfaces;
using Going.Plaid;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrak.Api.Controllers
{
    public class UserController(IAccountManagementService repo, IAccountReactivationRepository actv, ILogger<UserController> logger) : ApiBaseController
    {
        private readonly IAccountManagementService _repo = repo;
        private readonly IAccountReactivationRepository _actv = actv;
        private readonly ILogger _logger = logger;

        [HttpDelete("delete-account")]
        public async Task<IActionResult> DeleteAccount([FromServices] PlaidClient plaid)
        {
            var userId = GetUserId();

            var list = await _repo.GetAccessTokens(userId);

            foreach(var item in list)
            {
                await PlaidRevocation.RevokeItemAsync(plaid, item);
            };
            var result = await _repo.DeleteAccount(userId);
            
            if(result)
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                Response.Cookies.Delete("fintrak_uid");
            }
            else throw new InvalidOperationException("Account deletion did not complete.");

            return Ok();
        }

        [HttpDelete("deactivate-account")]
        public async Task<IActionResult> DeactivateAccount([FromServices] PlaidClient plaid)
        {
            var userId = GetUserId();

            var list = await _repo.GetAccessTokens(userId);

            foreach(var item in list)
            {
                await PlaidRevocation.RevokeItemAsync(plaid, item);
            };
            var result = await _repo.DeactivateAccount(userId);

            if(result)
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                Response.Cookies.Delete("fintrak_uid");
            }
            else throw new InvalidOperationException("Account deactivation did not complete.");

            return Ok();
        }

        [HttpPatch("reactivate-account")]
        [AllowAnonymous]
        public async Task<IActionResult> ReactivateAccount()
        {
            var reactivate = HttpContext.Session.GetString("reactivate_user_id");
            if (reactivate == null) return NotFound(new {error = "Session expired, please retry"});

            if(!Guid.TryParse(reactivate, out Guid result)) return BadRequest(new {error = "No valid reactivation found"});


            try
            {
            var verifiedResult = await _actv.ReactivateAccount(result);

            if (verifiedResult == null)
            {
                HttpContext.Session.Remove("reactivate_user_id");
                return BadRequest(new { error = "Reactivation failed. Please try again" });
            }


            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, verifiedResult!.Id.ToString()),
                new(ClaimTypes.Email, verifiedResult.Email),
                new(ClaimTypes.Name, verifiedResult.Name)
            };
            
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));

            Response.Cookies.Append("fintrak_uid", verifiedResult.Id.ToString(), new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(60)
            });

            HttpContext.Session.Remove("reactivate_user_id");

            return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Account reactivation failed");
                HttpContext.Session.Remove("reactivate_user_id");
                return BadRequest(new { error = "Reactivation failed. Please try again" });
            }

        }
    }
}