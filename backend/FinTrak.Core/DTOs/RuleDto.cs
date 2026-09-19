using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;

namespace FinTrak.Core.DTOs;

public class RuleDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public int Priority { get; init; }
    public string RuleName { get; init; } = "";
    public bool IsActive { get; init; }
    public bool Recursive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }
    public TargetType? Target { get; init; }
    public TriggerType? Trigger { get; init; }
    public List<Condition> Conditions { get; init; } = [];
    public List<Action> Actions { get; init; } = [];
}

public class RuleFieldMapDto
{
    public required Dictionary<ConditionField, List<Operator>> Conditions { get; set; }
    public required Dictionary<ActionField, List<ActionType>> Actions { get; set; }
}