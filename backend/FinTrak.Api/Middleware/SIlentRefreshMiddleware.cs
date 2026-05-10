using System.Security.Claims;
using System.Text.Json;
using FinTrak.Infrastructure.Persistance;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Api.Middleware
{
    /// <summary>
    /// Intercepts unauthenticated requests and attempts a silent token refresh.
    ///
    /// When the auth cookie expires, the user's GUID is read from the long-lived
    /// fintrak_uid cookie. If a valid refresh token exists in the DB for that user,
    /// it is used to obtain a new access token from Google, and the auth cookie is
    /// re-issued transparently — no re-login required.
    ///
    /// If the refresh token is missing, expired, or revoked, the middleware does
    /// nothing and lets the request fall through unauthenticated.
    /// </summary>
    public class SilentRefreshMiddleware
    {
        private readonly RequestDelegate _next;

        public SilentRefreshMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, FinTrakDbContext db)
        {
            // Only attempt refresh if the user is not already authenticated.
            if (!context.User.Identity?.IsAuthenticated ?? true)
            {
                var uidCookie = context.Request.Cookies["fintrak_uid"];
                if (Guid.TryParse(uidCookie, out var userId))
                {
                    // Look up a valid, non-expired, non-revoked refresh token for this user.
                    var storedToken = await db.RefreshTokens
                        .Where(t => t.UserId == userId
                                 && t.RevokedAt == null
                                 && t.ExpiresAt > DateTime.UtcNow)
                        .OrderByDescending(t => t.CreatedAt)
                        .FirstOrDefaultAsync();

                    if (storedToken != null)
                    {
                        var newIdToken = await TryRefreshAsync(storedToken.Token);
                        if (newIdToken != null)
                        {
                            // Re-issue the auth cookie with fresh claims.
                            var claims = new List<Claim>
                            {
                                new(ClaimTypes.NameIdentifier, userId.ToString()),
                                new(ClaimTypes.Email, newIdToken.Email),
                                new(ClaimTypes.Name, newIdToken.Name)
                            };

                            await context.SignInAsync(
                                CookieAuthenticationDefaults.AuthenticationScheme,
                                new ClaimsPrincipal(new ClaimsIdentity(claims,
                                    CookieAuthenticationDefaults.AuthenticationScheme)));
                        }
                        else
                        {
                            // Refresh failed — token was revoked by Google. Mark it in the DB.
                            storedToken.RevokedAt = DateTime.UtcNow;
                            storedToken.RevokedReason = "google_revoked";
                            await db.SaveChangesAsync();
                        }
                    }
                }
            }

            await _next(context);
        }

        /// <summary>
        /// Calls Google's token endpoint with the stored refresh token.
        /// Returns the validated ID token payload on success, or null if the refresh fails.
        /// </summary>
        private static async Task<GoogleJsonWebSignature.Payload?> TryRefreshAsync(string refreshToken)
        {
            try
            {
                using var http = new HttpClient();
                var response = await http.PostAsync("https://oauth2.googleapis.com/token",
                    new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["client_id"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")!,
                        ["client_secret"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")!,
                        ["refresh_token"] = refreshToken,
                        ["grant_type"] = "refresh_token"
                    }));

                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                var idToken = json.GetProperty("id_token").GetString()!;
                return await GoogleJsonWebSignature.ValidateAsync(idToken);
            }
            catch
            {
                return null;
            }
        }
    }
}
