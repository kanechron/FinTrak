namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a transaction category. Can be system-defined (shared across all users) or user-defined.
    /// </summary>
    public class Category
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; }

        /// <summary>Display name of the category, e.g. "Groceries" or "Rent".</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>True for built-in categories; false for categories created by the user.</summary>
        public bool IsSystem { get; set; } = true;

        // public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // public DateTime? DeletedAt { get; set; }

        // public bool IsActive { get; set; } = true;
    }
}
