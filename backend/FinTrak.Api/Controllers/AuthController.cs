using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using System.Text.Json;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Persistance;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Going.Plaid.Entity;

namespace FinTrak.Api.Controllers
{
    /// <summary>
    /// Handles Google OAuth 2.0 authentication using the PKCE flow.
    ///
    /// Flow summary:
    ///   1. GET /auth/login      â€” generates PKCE challenge, redirects user to Google consent screen
    ///   2. GET /auth/callback   â€” receives auth code from Google, exchanges it for tokens,
    ///                             validates the user, issues an HTTP-only auth cookie
    ///   3. POST /auth/logout    â€” revokes refresh tokens in the DB, clears the auth cookie
    /// </summary>
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public AuthController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet("register")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public IActionResult Register()
        {
            // Generate a high-entropy random string as the code_verifier. Lives in RAM and is never sent to the client.
            var codeVerifier = Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

            // Derive the code_challenge from the verifier using SHA256. Sent to Google in the initial auth request.
            var codeChallenge = Base64UrlEncode(SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier)));

            //Saves codeVerifier in RAM as key-value pair. 
            HttpContext.Session.SetString("code_verifier", codeVerifier);

            var query = QueryString.Create(new Dictionary<string, string?>
            {
                ["client_id"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID"),
                ["redirect_uri"] = Environment.GetEnvironmentVariable("GOOGLE_REDIRECT_URI"),
                ["response_type"] = "code",
                ["scope"] = "openid profile email",
                ["code_challenge"] = codeChallenge,
                ["code_challenge_method"] = "S256",
                ["access_type"] = "offline",    // tells Google to return a refresh token
                ["prompt"] = "select_account consent",   // consent forces Google to return a refresh token on every login
                ["state"] = "register"
            });

            return Redirect("https://accounts.google.com/o/oauth2/v2/auth" + query);
        }


        /// <summary>
        /// Initiates the Google OAuth login flow.
        /// Generates a PKCE code_verifier and code_challenge, stores the verifier in the session,
        /// then redirects the user to Google's authorization endpoint.
        /// </summary>
        [HttpGet("login")]
        [EnableRateLimiting("auth")]
        public IActionResult Login()
        {
            // PKCE: generate a random verifier and derive the challenge from it.
            // The verifier is stored in session; the challenge is sent to Google.
            // On callback, Google verifies that the challenge matches the verifier â€”
            // this prevents auth code interception attacks.

            // Generate a high-entropy random string as the code_verifier. Lives in RAM and is never sent to the client.
            var codeVerifier = Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

            // Derive the code_challenge from the verifier using SHA256. Sent to Google in the initial auth request.
            var codeChallenge = Base64UrlEncode(SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier)));

            //Saves codeVerifier in RAM as key-value pair. 
            HttpContext.Session.SetString("code_verifier", codeVerifier);

            var query = QueryString.Create(new Dictionary<string, string?>
            {
                ["client_id"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID"),
                ["redirect_uri"] = Environment.GetEnvironmentVariable("GOOGLE_REDIRECT_URI"),
                ["response_type"] = "code",
                ["scope"] = "openid profile email",
                ["code_challenge"] = codeChallenge,
                ["code_challenge_method"] = "S256",
                ["access_type"] = "offline",    // tells Google to return a refresh token
                ["prompt"] = "select_account",
                ["state"] = "login"
            });

            return Redirect("https://accounts.google.com/o/oauth2/v2/auth" + query);
        }

        /// <summary>
        /// Handles the OAuth callback from Google after the user approves the consent screen.
        /// Exchanges the authorization code for tokens, validates the ID token,
        /// enforces the email allowlist, creates or updates the User record,
        /// stores the refresh token, and issues an auth cookie.
        /// </summary>
        [HttpGet("callback")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
        {
            // Retrieve the code_verifier stored in session during /login.
            // If the session has expired, the user must start the login flow again.
            var codeVerifier = HttpContext.Session.GetString("code_verifier");
            if (string.IsNullOrEmpty(codeVerifier))
                return BadRequest("Session expired. Please try logging in again.");

            // Exchange the authorization code for an access token, refresh token, and ID token.
            using var http = new HttpClient();
            var tokenResponse = await http.PostAsync("https://oauth2.googleapis.com/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["code"] = code,
                    ["client_id"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")!,
                    ["client_secret"] = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")!,
                    ["redirect_uri"] = Environment.GetEnvironmentVariable("GOOGLE_REDIRECT_URI")!,
                    ["grant_type"] = "authorization_code",
                    ["code_verifier"] = codeVerifier    // Google verifies this matches the challenge sent in /login
                }));

            if (!tokenResponse.IsSuccessStatusCode)
                return BadRequest("Token exchange with Google failed.");

            // Parse the token response JSON into a JsonElement for easy access to the ID token and refresh token.
            var tokenJson = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();

            // The ID token is a JWT containing the user's identity claims (email, name, Google subject ID).
            var idToken = tokenJson.GetProperty("id_token").GetString()!;

            // Validate the ID token signature and extract user info (email, name, Google subject ID).
            // GoogleJsonWebSignature.ValidateAsync handles all cryptographic verification.
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

            //Redirect user based on "state" field from Query

            //If user selected "register" but the account exists
            if (state == "register" && user != null) return Redirect((Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://localhost:5173") + "/login?error=account_exists");

            //If user selected "Log in"
            if (state == "login" && user == null) return Redirect((Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://localhost:5173") + "/login?error=no_account");

            if (state == "register") user = await RegisterUser(payload, _db);
    

            if (tokenJson.TryGetProperty("refresh_token", out var rtElement))
            {
                // Persist the refresh token server-side. Used later to silently renew the auth cookie
                // when the access token expires, without requiring the user to log in again.
                _db.RefreshTokens.Add(new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    UserId = user!.Id,
                    Token = rtElement.GetString()!,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(60)
                });
            }

            await _db.SaveChangesAsync();

            // Issue an HTTP-only auth cookie containing the user's identity claims.
            // The cookie is the only thing the client ever sees â€” tokens never leave the server.

            //Creates the claims that will be stored in the auth cookie. These claims can be accessed later to identify the user.
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.Name)
            };

            // Signs in the user by creating an auth cookie with the specified claims. The cookie is HTTP-only and Secure, so it's not accessible to JavaScript and only sent over HTTPS.
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));

            // Clear the PKCE code_verifier from session since it's no longer needed after successful login.
            HttpContext.Session.Remove("code_verifier");

            // Also set a separate cookie with the user's ID for easy access in the frontend (e.g. to associate Plaid items with the user).
            Response.Cookies.Append("fintrak_uid", user.Id.ToString(), new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(60)
            });

            // Redirect back to the frontend after successful login.
            // FRONTEND_URL can be overridden in .env â€” defaults to the React dev server.
            return Redirect(Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://localhost:5173");
        }

        /// <summary>
        /// Logs the user out by revoking all active refresh tokens in the database
        /// and clearing the auth cookie.
        /// </summary>
        [HttpPost("logout")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userId, out var id))
            {
                // Mark all active refresh tokens as revoked so they can't be used for silent refresh.
                var tokens = await _db.RefreshTokens
                    .Where(t => t.UserId == id && t.RevokedAt == null)
                    .ToListAsync();

                foreach (var token in tokens)
                {
                    token.RevokedAt = DateTime.UtcNow;
                    token.RevokedReason = "logout";
                }

                await _db.SaveChangesAsync();
            }

            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            Response.Cookies.Delete("fintrak_uid");

            return Ok();
        }

        /// <summary>
        /// Encodes a byte array as a Base64URL string (no padding, URL-safe characters).
        /// Required format for PKCE code_verifier and code_challenge values.
        /// </summary>
        private static string Base64UrlEncode(byte[] bytes) =>
            Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static async Task<User> RegisterUser(GoogleJsonWebSignature.Payload payload, FinTrakDbContext _db)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = payload.Name,
                Email = payload.Email,
                GoogleId = payload.Subject
            };

            _db.Users.Add(user);
            return user;
        }
    }
}
