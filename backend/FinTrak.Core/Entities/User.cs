namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents an authenticated user in the system.
    /// </summary>
    public class User
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>Display name pulled from the user's Google profile.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Email address from the user's Google account.</summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>Google subject identifier used to match the user on login.</summary>
        public string GoogleId { get; set; } = string.Empty;

        /// <summary>When the user account was first created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>When the user last authenticated.</summary>
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

        public DateTime? DeletedAt { get; set; } = null;
    }
}
