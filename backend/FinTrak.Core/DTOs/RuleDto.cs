using FinTrak.Core.Entities;

namespace FinTrak.Core.DTOs;

public class RuleFieldMapDto
{
    public required Dictionary<ConditionField, List<Operator>> Conditions { get; set; }
    public required Dictionary<ActionField, List<ActionType>> Actions { get; set; }
}