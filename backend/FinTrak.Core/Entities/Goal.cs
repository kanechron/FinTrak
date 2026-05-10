namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a named savings goal with a target amount and optional deadline.
    /// </summary>
    public class Goal
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this goal belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>Display name for the goal, e.g. "Emergency Fund" or "New Laptop".</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>The total amount the user wants to save.</summary>
        public decimal TargetAmount { get; set; } = 0m;

        /// <summary>How much has been saved toward the goal so far.</summary>
        public decimal CurrentAmount { get; set; } = 0m;

        /// <summary>When the goal was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>When the goal was marked complete. Null means it is still in progress.</summary>
        public DateTime? CompletedAt { get; set; } = null;

        /// <summary>The date the user wants to reach the goal by. Null means no deadline.</summary>
        public DateOnly? TargetDate { get; set; } = null;

        /// <summary>Soft delete timestamp. Null means the goal is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;
    }
}
