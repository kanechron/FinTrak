namespace FinTrak.Core.Entities
{
    /// <summary>
    /// Represents a recurring bill or expense with a defined payment schedule.
    /// </summary>
    public class Bill
    {
        /// <summary>Internal primary key.</summary>
        public Guid Id { get; set; } = Guid.Empty;

        /// <summary>The user this bill belongs to.</summary>
        public Guid UserId { get; set; } = Guid.Empty;

        /// <summary>Display name for the bill, e.g. "Netflix" or "Rent".</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Expected payment amount.</summary>
        public decimal Amount { get; set; } = 0m;

        /// <summary>FK to the category this bill falls under.</summary>
        public Guid? CategoryId { get; set; } = null;

        /// <summary>Navigation property for the associated category.</summary>
        public Category? Category { get; set; }

        /// <summary>How often this bill recurs.</summary>
        public BillFrequency Frequency { get; set; } = BillFrequency.Monthly;

        public BillStatus Status {get; set;}

        /// <summary>Day of the month the bill is due. Used when Frequency is Monthly, Quarterly, or Yearly.</summary>
        public int? DueDay { get; set; } = null;

        /// <summary>Specific calendar date the bill is due. Only used when Frequency is Custom.</summary>
        public DateOnly? CustomDate { get; set; } = null;

        /// <summary>When the bill was last paid.</summary>
        public DateOnly? LastPaidDate { get; set; } = null;

        /// <summary>Whether this bill is paid automatically. Suppresses due-date reminders when true.</summary>
        public bool IsAutoPay { get; set; } = false;

        /// <summary>When this bill record was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Soft delete timestamp. Null means the bill is active.</summary>
        public DateTime? DeletedAt { get; set; } = null;
    }

    /// <summary>
    /// How often a bill recurs.
    /// </summary>
    public enum BillFrequency
    {
        /// <summary>Due every week.</summary>
        Weekly = 0,

        /// <summary>Due every two weeks.</summary>
        BiWeekly = 1,

        /// <summary>Due once a month. Use DueDay to specify which day.</summary>
        Monthly = 2,

        /// <summary>Due every three months. Use DueDay to specify which day.</summary>
        Quarterly = 3,

        /// <summary>Due once a year. Use DueDay to specify which day.</summary>
        Yearly = 4,

        /// <summary>Due on a specific calendar date. Use CustomDate to specify.</summary>
        Custom = 5
    }

    public enum BillStatus
    {
        Pending = 0,
        Accepted = 1,
        Declined = 2
    }
}
