using FinTrak.Core.Entities;

namespace FinTrak.Core.DTOs
{
    public class BillDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public string DisplayName { get; init; } = "";
        public decimal Amount { get; init; }
        public Guid? CategoryId { get; init; }
        public string? Category { get; init; }
        public BillFrequency Frequency { get; init; }
        public BillStatus Status {get; init;}
        public int? DueDay { get; init; }
        public DateOnly? CustomDate { get; init; }
        public DateOnly? LastPaidDate { get; init; }
        public DateOnly? NextDueDate { get; init; }
        public bool IsAutoPay { get; init; }
        public bool IsAutoDetected { get; init; }
    }
}
