namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Stores a Google OAuth refresh token server-side. One row per active session.
    /// </summary>
    public class RefreshToken
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this token belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>The Google refresh token string. Treat as a secret — never expose to the client.</summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>When the token expires. Defaults to 7 days from creation.</summary>
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);

        /// <summary>When the token was issued.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>When the token was revoked. Null means the token is still active.</summary>
        public DateTime? RevokedAt { get; set; } = null;

        /// <summary>Why the token was revoked, e.g. "logout" or "google_revoked".</summary>
        public string? RevokedReason { get; set; } = null;
    }
}
