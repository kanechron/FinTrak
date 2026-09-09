namespace FinTrak.Core.Entities;

/// <summary>
/// A user-defined rule: when <see cref="Conditions"/> all match (evaluated per <see cref="Trigger"/>),
/// <see cref="Actions"/> are applied. Evaluated in <see cref="Priority"/> order; first full match wins.
/// </summary>
public class Rule
{
    public Guid Id { get; set; } = Guid.Empty;
    public Guid UserId { get; set; } = Guid.Empty;

    /// <summary>Evaluation order within the same (<see cref="UserId"/>, <see cref="Target"/>) group. Lower runs first. Unique per that group.</summary>
    public int Priority { get; set; } = 0;

    public required string RuleName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    /// <summary>
    /// Trigger for applying rule to all historical matches as well.
    /// </summary>
    public bool Recursive { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; } = null;

    /// <summary>What kind of entity this rule applies to. Required at save time; left nullable so an unset value is never mistaken for a real default.</summary>
    public required TargetType? Target { get; set; }

    /// <summary>When this rule is evaluated. Required at save time for the same reason as <see cref="Target"/>.</summary>
    public required TriggerType? Trigger { get; set; }

    /// <summary>All conditions are ANDed together — every one must match for the rule to fire.</summary>
    public required List<Condition> Conditions { get; set; }

    /// <summary>Actions applied when every condition matches.</summary>
    public required List<Action> Actions { get; set; }
}

/// <summary>What kind of entity a rule targets.</summary>
public enum TargetType
{
    Transaction = 0
}

/// <summary>When a rule is evaluated.</summary>
/// <list type="bullet">
///     <listheader><term>Value</term><description>Meaning</description></listheader>
///     <item><term>Always</term><description>Evaluate on every check, regardless of source.</description></item>
///     <item><term>OnSync</term><description>Evaluate only when a transaction is added/modified during Plaid sync.</description></item>
/// </list>
public enum TriggerType
{
    Always = 0,
    OnSync = 1,
}

/// <summary>One clause of a rule's match logic: does <see cref="ConditionField"/> satisfy <see cref="ConditionOperator"/> against <see cref="ConditionValue"/>.</summary>
public class Condition
{
    /// <summary>Represents the logical operator being used. Conditions sharing <see cref="GroupId"/> must all return true (AND operator). Conditions with differing <see cref="GroupId"/> will return when a condition returns true (OR operator).</summary>
    public required Guid GroupId { get; set; }

    /// <summary>The field being read off the target entity (e.g. MerchantName, Amount, TransactionDate). Determines how <see cref="ConditionValue"/> is parsed.</summary>
    public ConditionField ConditionField { get; set; }

    public Operator? ConditionOperator { get; set; } = null;

    /// <summary>Always stored as a string; parsed according to <see cref="ConditionField"/> at validation/evaluation time.</summary>
    public string ConditionValue { get; set; } = string.Empty;
    ///<summary>Represents logical inversion. When true, <see cref="ConditionOperator"/> is inverted</summary> 
    public bool Not { get; set; } = false;
}

public enum ConditionField
{
    MerchantName = 0,
    Amount = 1,
    TransactionDate = 2,
    DayOfMonth = 3,
    DayOfWeek = 4,
    Month = 5
}

/// <summary>Comparison used to evaluate a <see cref="Condition"/>.</summary>
public enum Operator
{
    GREATER_THAN = 0,
    LESS_THAN = 1,
    GREATER_THAN_OR_EQUAL = 2,
    LESS_THAN_OR_EQUAL = 3,
    EQUALS = 4,
    //NOTE TO SELF: CONTAINS is for string/substring matching, IN is gated by number of values being compared REGARDLESS of value type.
    CONTAINS = 5,
    IN = 6
}

/// <summary>One effect applied when a rule's conditions all match: <see cref="ActionType"/> <see cref="ActionField"/> to <see cref="ActionValue"/>.</summary>
public class Action
{
    /// <summary>The field being acted on (e.g. Category, BudgetExclusion). A different vocabulary than <see cref="Condition.ConditionField"/> — not every field is settable.</summary>
    public ActionField ActionField { get; set; }

    public required ActionType ActionType { get; set; }

    /// <summary>Always stored as a string; parsed according to <see cref="ActionField"/> at validation/evaluation time.</summary>
    public string ActionValue { get; set; } = string.Empty;
}

public enum ActionField
{
    Category = 0,
    MerchantName = 1,
    BudgetExclusion = 2,
    BillFlag = 3
}

/// <summary>Verb applied to an <see cref="Action.ActionField"/>.</summary>
public enum ActionType
{
    Set = 0,
    Exclude = 1, 
}
