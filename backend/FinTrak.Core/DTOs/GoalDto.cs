namespace FinTrak.Core.DTOs
{
    public class GoalDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public decimal? TargetAmount { get; init; }
        public DateOnly? TargetDate { get; init; }
        public bool IsCompleted { get; init; }
        public bool IsActive { get; init; }
        public decimal CurrentAmount { get; init; }
        public int Priority { get; init; }
        public List<LinkedAccountDto> LinkedAccounts { get; init; } = [];
    }

    public class LinkedAccountDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = "";
        public string? Mask { get; init; }
    }
}
