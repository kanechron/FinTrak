using System.Diagnostics;
using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;

namespace FinTrak.Core.Utilities;

/// <summary>
/// Resolves the values needed to evaluate a Rule's <see cref="Condition"/>s against a
/// target entity. Split out from RulesService since this will need an overload per
/// target entity (Transaction now, Budget/Bill later) as more Rule targets are added.
/// </summary>
public static class RuleUtil
{
    public static bool ResolveConditionFieldValue(Condition condition, Transaction transaction)
    {
        if (transaction.Amount is null) return false;
        if (transaction.Date is null) return false;

        // Pulled out once so each switch arm only shows what's unique to it.
        var amount = transaction.Amount.Value;
        var date = transaction.Date.Value;
        var value = condition.ConditionValue;
        var op = condition.ConditionOperator ?? Operator.UNDEFINED;

        var result = condition.ConditionField switch
        {
            // Case is handled inside the string Compare (OrdinalIgnoreCase for both EQUALS and CONTAINS).
            ConditionField.MerchantName => Compare(transaction.MerchantName, value, op),
            ConditionField.Amount => Compare(amount, decimal.Parse(value), op),
            ConditionField.TransactionDate => Compare(date, DateOnly.Parse(value), op),
            ConditionField.DayOfMonth => Compare(date.Day, int.Parse(value), op),
            ConditionField.DayOfWeek => Compare((int)date.DayOfWeek, (int)Enum.Parse<DayOfWeek>(value, ignoreCase: true), op),
            ConditionField.Month => Compare(date.Month, int.Parse(value), op),
            _ => throw new UnreachableException($"Unhandled ConditionField: {condition.ConditionField}")
        };

        return condition.Not ? !result : result;
    }



    private static bool Compare<T>(T left, T right, Operator op) where T : IComparable<T>
    {
        if (op == Operator.UNDEFINED) return false;

        var result = left.CompareTo(right);
        return op switch
        {
            Operator.EQUALS => result == 0,
            Operator.GREATER_THAN => result > 0,
            Operator.LESS_THAN => result < 0,
            Operator.GREATER_THAN_OR_EQUAL => result >= 0,
            Operator.LESS_THAN_OR_EQUAL => result <= 0,
            _ => throw new UnreachableException($"Operator {op} is not supported for {typeof(T).Name} comparisons.")
        };
    }

    private static bool Compare(string left, string right, Operator op)
    {
        if (op == Operator.UNDEFINED) return false;

        return op switch
        {
            Operator.EQUALS => string.Equals(left, right, StringComparison.OrdinalIgnoreCase),
            Operator.CONTAINS => left.Contains(right, StringComparison.OrdinalIgnoreCase),
            _ => throw new UnreachableException($"Operator {op} is not supported for String comparisons.")
        };
    }


    public static void SetAction(Action action, Transaction transaction)
    {
        switch (action.ActionField)
        {
            case ActionField.MerchantName:
                transaction.MerchantName = action.ActionValue.ToString();
                transaction.IsMerchantNameLocked = true;
                break;
            case ActionField.Category:
                transaction.CategoryId = Guid.Parse(action.ActionValue);
                transaction.IsCategoryLocked = true;
                break;
            default:
                throw new UnreachableException($"Action field {action.ActionField} has no Set handler.");
        }
    }
}
