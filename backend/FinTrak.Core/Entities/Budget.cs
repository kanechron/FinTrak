namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a spending limit for a category over a defined period.
    /// Actual spending is computed at query time from transactions — not stored here.
    /// </summary>
    public class Budget
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this budget belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>Display name for the budget, e.g. "Monthly Groceries".</summary>
        public string Name { get; set; } = string.Empty;

        ///<summary>The spending limit for this budget period.</summary>
        public decimal Amount { get; set; } = 0m;

        /// <summary>FK to the category this budget applies to. Null means it applies to all spending.</summary>
        public Guid? CategoryId { get; set; } = null;

        /// <summary>The period this budget resets on.</summary>
        public BudgetPeriod? Period { get; set; } = null;

        /// <summary>Navigation property for the associated category.</summary>
        public Category? Category { get; set; }

        /// <summary>When the budget was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>When the budget takes effect.</summary>
        public DateOnly StartDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        /// <summary>When the budget ends. Null for open-ended budgets.</summary>
        public DateOnly? EndDate { get; set; } = null;

        public string RecurringDate { get; set; } = string.Empty;

        /// <summary>Soft delete timestamp. Null means the budget is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;

        /// <summary>Whether the budget automatically renews each period.</summary>
        public bool IsRecurring { get; set; } = false;

        /// <summary>Whether the budget is currently active.</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>Reason the budget was deleted, if applicable.</summary>
        public string? DeletedReason { get; set; } = null;
    }

    /// <summary>
    /// The period over which a budget's spending limit applies.
    /// </summary>
    public enum BudgetPeriod
    {
        Weekly = 0,
        Monthly = 1,
        Yearly = 2,
        Custom = 3
    }
}
