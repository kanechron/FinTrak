namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a user in the system.
    /// The User entity contains information about the user, such as their name, email, and Google ID for authentication purposes. It also tracks when the user was created and when they were last seen in the system.
    /// 
    /// Properties:
    /// - <strong>Id</strong>: A unique identifier for the user (GUID).
    /// - <strong>Name</strong>: The name of the user.
    /// - <strong>Email</strong>: The email address of the user.
    /// - <strong>GoogleId</strong>: The Google ID associated with the user for authentication.
    /// - <strong>CreatedAt</strong>: The date and time when the user was created in the system.
    /// - <strong>LastSeenAt</strong>: The date and time when the user was last seen in the system.
    /// <
    /// </summary>
    public class User
    {
        public Guid Id { get; set; } = Guid.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string GoogleId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    }
}