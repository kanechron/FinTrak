using System.Diagnostics;
using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;
using FinTrak.Core.Utilities;

namespace FinTrak.Tests;

public class RuleUtilTests
{
    #region Test Objects
    // ---------------------------------------------------------------------
    // Should MATCH a "MerchantName CONTAINS spotify" condition
    // ---------------------------------------------------------------------

    /// <summary>A fully populated Spotify charge. Merchant name is lowercase because
    /// <c>ResolveConditionFieldValue</c> lowercases the condition value, not the transaction's
    /// merchant name. Date is a Tuesday, mid-month, so day/month conditions have room either side.</summary>
    public static Transaction MatchingTransaction() => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        AccountId = Guid.NewGuid(),
        Amount = 10.99m,
        MerchantName = "spotify usa",
        MerchantNameRaw = "SPOTIFY USA",
        MerchantNameNormalized = "spotify usa",
        Date = new DateOnly(2026, 9, 15),
        IsPending = false,
        IsManual = false
    };

    // ---------------------------------------------------------------------
    // Should NOT MATCH a "MerchantName CONTAINS spotify" condition
    // ---------------------------------------------------------------------

    /// <summary>A fully populated non-Spotify charge — different merchant, higher amount,
    /// and a weekend date, so it fails merchant, amount, and day-of-week conditions that
    /// <see cref="MatchingTransaction"/> passes.</summary>
    public static Transaction NonMatchingTransaction() => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        AccountId = Guid.NewGuid(),
        Amount = 15.49m,
        MerchantName = "netflix",
        MerchantNameRaw = "NETFLIX.COM",
        MerchantNameNormalized = "netflix",
        Date = new DateOnly(2026, 9, 20),
        IsPending = false,
        IsManual = false
    };

    // ---------------------------------------------------------------------
    // Conditions
    // ---------------------------------------------------------------------

    /// <summary>"MerchantName CONTAINS spotify" — true for <see cref="MatchingTransaction"/>,
    /// false for <see cref="NonMatchingTransaction"/>.</summary>
    public static Condition MerchantContainsSpotify() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "spotify",
        Not = false
    };

    /// <summary>CONTAINS ignores case on both sides: "SPOTIFY" matches "spotify usa".</summary>
    public static Condition MerchantContainsUppercase() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "SPOTIFY",
        Not = false
    };

    // ---------------------------------------------------------------------
    // Conditions that SHOULD match MatchingTransaction()
    // (every field arm, every comparison operator, Enum.Parse ignoreCase, and a Not flip)
    // ---------------------------------------------------------------------

    /// <summary>Amount: 10.99 is less than 50.</summary>
    public static Condition AmountLessThanFifty() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Amount,
        ConditionOperator = Operator.LESS_THAN,
        ConditionValue = "50",
        Not = false
    };

    /// <summary>Amount: 10.99 is greater than or equal to exactly 10.99 (boundary).</summary>
    public static Condition AmountGreaterThanOrEqualExact() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Amount,
        ConditionOperator = Operator.GREATER_THAN_OR_EQUAL,
        ConditionValue = "10.99",
        Not = false
    };

    /// <summary>Date: the transaction happened on exactly 2026-09-15.</summary>
    public static Condition TransactionDateEqualsSept15() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.TransactionDate,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "2026-09-15",
        Not = false
    };

    /// <summary>Day of month: the 15th is after the 10th.</summary>
    public static Condition DayOfMonthGreaterThanTen() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfMonth,
        ConditionOperator = Operator.GREATER_THAN,
        ConditionValue = "10",
        Not = false
    };

    /// <summary>Day of month: the 15th is less than or equal to exactly 15 (boundary).</summary>
    public static Condition DayOfMonthLessThanOrEqualFifteen() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfMonth,
        ConditionOperator = Operator.LESS_THAN_OR_EQUAL,
        ConditionValue = "15",
        Not = false
    };

    /// <summary>Day of week: 2026-09-15 is a Tuesday.</summary>
    public static Condition DayOfWeekIsTuesday() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfWeek,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "Tuesday",
        Not = false
    };

    /// <summary>Day of week, lowercase input: confirms <c>Enum.Parse(..., ignoreCase: true)</c>.</summary>
    public static Condition DayOfWeekIsTuesdayLowercase() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfWeek,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "tuesday",
        Not = false
    };

    /// <summary>Month: September is month 9.</summary>
    public static Condition MonthIsSeptember() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Month,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "9",
        Not = false
    };

    /// <summary>Not-inverted match: "contains netflix" is false for the Spotify charge,
    /// flipped by <c>Not = true</c> — so it returns true.</summary>
    public static Condition NotMerchantContainsNetflix() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "netflix",
        Not = true
    };

    // ---------------------------------------------------------------------
    // Conditions that should NOT match MatchingTransaction()
    // (one per field, plus a Not-inverted one)
    // ---------------------------------------------------------------------

    /// <summary>Merchant mismatch: "spotify usa" doesn't contain "netflix".</summary>
    public static Condition MerchantContainsNetflix() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "netflix",
        Not = false
    };

    /// <summary>Amount mismatch: 10.99 is not greater than 50.</summary>
    public static Condition AmountGreaterThanFifty() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Amount,
        ConditionOperator = Operator.GREATER_THAN,
        ConditionValue = "50",
        Not = false
    };

    /// <summary>Date mismatch: 2026-09-15 is not on 2026-01-01.</summary>
    public static Condition TransactionDateEqualsNewYear() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.TransactionDate,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "2026-01-01",
        Not = false
    };

    /// <summary>Day-of-month mismatch: the 15th is not before the 10th.</summary>
    public static Condition DayOfMonthLessThanTen() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfMonth,
        ConditionOperator = Operator.LESS_THAN,
        ConditionValue = "10",
        Not = false
    };

    /// <summary>Day-of-week mismatch: 2026-09-15 is a Tuesday, not a Saturday.</summary>
    public static Condition DayOfWeekIsSaturday() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.DayOfWeek,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "Saturday",
        Not = false
    };

    /// <summary>Month mismatch: September (9) is not January (1).</summary>
    public static Condition MonthIsJanuary() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Month,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "1",
        Not = false
    };

    /// <summary>Not-inverted mismatch: the same check as <see cref="MerchantContainsSpotify"/>,
    /// which matches, flipped by <c>Not = true</c> — so it returns false.</summary>
    public static Condition NotMerchantContainsSpotify() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "spotify",
        Not = true
    };

    /// <summary>Operator explicitly UNDEFINED: <c>Compare</c> returns false before comparing anything,
    /// even though "spotify usa" would otherwise CONTAIN "spotify".</summary>
    public static Condition UndefinedOperator() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.UNDEFINED,
        ConditionValue = "spotify",
        Not = false
    };

    /// <summary>Operator left null: <c>ResolveConditionFieldValue</c> falls back to UNDEFINED via
    /// <c>?? Operator.UNDEFINED</c>, so this also returns false.</summary>
    public static Condition NullOperator() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = null,
        ConditionValue = "spotify",
        Not = false
    };

    // ---------------------------------------------------------------------
    // Null-field transactions — hit the early `return false` before the switch
    // ---------------------------------------------------------------------

    /// <summary><see cref="MatchingTransaction"/> with no Amount.</summary>
    public static Transaction NullAmountTransaction()
    {
        var transaction = MatchingTransaction();
        transaction.Amount = null;
        return transaction;
    }

    /// <summary><see cref="MatchingTransaction"/> with no Date.</summary>
    public static Transaction NullDateTransaction()
    {
        var transaction = MatchingTransaction();
        transaction.Date = null;
        return transaction;
    }

    // ---------------------------------------------------------------------
    // Conditions that should THROW
    // ---------------------------------------------------------------------

    /// <summary>ConditionField.Undefined isn't handled by any switch arm, so it hits <c>_ => throw</c>.</summary>
    public static Condition UndefinedConditionField() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Undefined,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "anything",
        Not = false
    };

    /// <summary>CONTAINS on a decimal field: the generic <c>Compare&lt;T&gt;</c> only handles
    /// ordering operators, so CONTAINS falls through to its <c>_ => throw</c>.</summary>
    public static Condition AmountContains() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.Amount,
        ConditionOperator = Operator.CONTAINS,
        ConditionValue = "10",
        Not = false
    };

    /// <summary>EQUALS on the merchant name: "spotify usa" equals "spotify usa"
    /// (string <c>Compare</c> overload, case-insensitive).</summary>
    public static Condition MerchantNameEquals() => new()
    {
        GroupId = Guid.NewGuid(),
        ConditionField = ConditionField.MerchantName,
        ConditionOperator = Operator.EQUALS,
        ConditionValue = "spotify usa",
        Not = false
    };

    // ---------------------------------------------------------------------
    // Actions (SetAction)
    // ---------------------------------------------------------------------

    /// <summary>Fixed so the Category test can assert the exact id that was set.</summary>
    private static readonly Guid KnownCategoryId = Guid.Parse("3f2b8c1e-5d4a-4e7b-9c6f-1a2b3c4d5e6f");

    /// <summary>Should set MerchantName to "Spotify" and lock it.</summary>
    public static Action SetMerchantNameAction() => new()
    {
        ActionField = ActionField.MerchantName,
        ActionType = ActionType.Set,
        ActionValue = "Spotify"
    };

    /// <summary>Should set CategoryId to <see cref="KnownCategoryId"/> and lock it.</summary>
    public static Action SetCategoryAction() => new()
    {
        ActionField = ActionField.Category,
        ActionType = ActionType.Set,
        ActionValue = KnownCategoryId.ToString()
    };

    /// <summary>BillFlag has no case in SetAction, so it hits <c>default: throw new UnreachableException</c>.</summary>
    public static Action SetBillFlagAction() => new()
    {
        ActionField = ActionField.BillFlag,
        ActionType = ActionType.Set,
        ActionValue = "true"
    };

    /// <summary>Category with a value that isn't a Guid — <c>Guid.Parse</c> throws a FormatException.</summary>
    public static Action SetCategoryNonGuidAction() => new()
    {
        ActionField = ActionField.Category,
        ActionType = ActionType.Set,
        ActionValue = "groceries"
    };
    #endregion

    [Fact]
    public async Task RuleUtil_ResolveConditionValue_KnownGood()
    {
        var transaction = MatchingTransaction();
        var condition = MerchantContainsSpotify();

        var matching = RuleUtil.ResolveConditionFieldValue(condition, transaction);

        Assert.True(matching);
    }

    public static IEnumerable<object[]> ValidConditions()
    {
        yield return [nameof(MerchantContainsSpotify), MerchantContainsSpotify()];
        yield return [nameof(MerchantNameEquals), MerchantNameEquals()];
        yield return [nameof(MerchantContainsUppercase), MerchantContainsUppercase()];
        yield return [nameof(AmountLessThanFifty), AmountLessThanFifty()];
        yield return [nameof(AmountGreaterThanOrEqualExact), AmountGreaterThanOrEqualExact()];
        yield return [nameof(TransactionDateEqualsSept15), TransactionDateEqualsSept15()];
        yield return [nameof(DayOfMonthGreaterThanTen), DayOfMonthGreaterThanTen()];
        yield return [nameof(DayOfMonthLessThanOrEqualFifteen), DayOfMonthLessThanOrEqualFifteen()];
        yield return [nameof(DayOfWeekIsTuesday), DayOfWeekIsTuesday()];
        yield return [nameof(DayOfWeekIsTuesdayLowercase), DayOfWeekIsTuesdayLowercase()];
        yield return [nameof(MonthIsSeptember), MonthIsSeptember()];
        yield return [nameof(NotMerchantContainsNetflix), NotMerchantContainsNetflix()];
    }

    [Theory]
    [MemberData(nameof(ValidConditions))]
    public void RuleUtil_ResolveConditionValue_KnownGood_AllFields(string casename, Condition condition)
    {
        var transaction = MatchingTransaction();

        var matching = RuleUtil.ResolveConditionFieldValue(condition, transaction);
        Assert.True(matching, $"{casename} was expected to match but didn't");
    }

    public static IEnumerable<object[]> InvalidConditions()
    {
        yield return [nameof(MerchantContainsNetflix), MerchantContainsNetflix()];
        yield return [nameof(AmountGreaterThanFifty), AmountGreaterThanFifty()];
        yield return [nameof(TransactionDateEqualsNewYear), TransactionDateEqualsNewYear()];
        yield return [nameof(DayOfMonthLessThanTen), DayOfMonthLessThanTen()];
        yield return [nameof(DayOfWeekIsSaturday), DayOfWeekIsSaturday()];
        yield return [nameof(MonthIsJanuary), MonthIsJanuary()];
        yield return [nameof(NotMerchantContainsSpotify), NotMerchantContainsSpotify()];
        yield return [nameof(UndefinedOperator), UndefinedOperator()];
        yield return [nameof(NullOperator), NullOperator()];
    }

    [Theory]
    [MemberData(nameof(InvalidConditions))]
    public async Task RuleUtil_ResolveConditionValue_KnownBad(string casename, Condition condition)
    {
        var transaction = MatchingTransaction();

        var matching = RuleUtil.ResolveConditionFieldValue(condition, transaction);
        Assert.False(matching, $"{casename} was expected to fail but validation passed");
    }

    public static IEnumerable<object[]> NullFieldTransactions()
    {
        yield return [nameof(NullAmountTransaction), NullAmountTransaction()];
        yield return [nameof(NullDateTransaction), NullDateTransaction()];
    }

    /// <summary>Uses a condition that WOULD match (merchant contains spotify) to prove the
    /// null check short-circuits even when the condition doesn't read the null field.</summary>
    [Theory]
    [MemberData(nameof(NullFieldTransactions))]
    public void RuleUtil_ResolveConditionValue_NullField_ReturnsFalse(string casename, Transaction transaction)
    {
        var condition = MerchantContainsSpotify();

        var matching = RuleUtil.ResolveConditionFieldValue(condition, transaction);
        Assert.False(matching, $"{casename} was expected to return false but matched");
    }

    public static IEnumerable<object[]> ThrowingConditions()
    {
        yield return [nameof(UndefinedConditionField), UndefinedConditionField()];
        yield return [nameof(AmountContains), AmountContains()];
    }

    [Theory]
    [MemberData(nameof(ThrowingConditions))]
    public void RuleUtil_ResolveConditionValue_Throws(string casename, Condition condition)
    {
        var transaction = MatchingTransaction();

        var ex = Record.Exception(() => RuleUtil.ResolveConditionFieldValue(condition, transaction));
        Assert.True(ex is UnreachableException, $"{casename} was expected to throw UnreachableException but threw {ex?.GetType().Name ?? "nothing"}");
    }

    [Fact]
    public void RuleUtil_SetAction_MerchantName_SetsValueAndLocks()
    {
        var transaction = MatchingTransaction();

        RuleUtil.SetAction(SetMerchantNameAction(), transaction);

        Assert.Equal("Spotify", transaction.MerchantName);
        Assert.True(transaction.IsMerchantNameLocked);
    }

    [Fact]
    public void RuleUtil_SetAction_Category_SetsValueAndLocks()
    {
        var transaction = MatchingTransaction();

        RuleUtil.SetAction(SetCategoryAction(), transaction);

        Assert.Equal(KnownCategoryId, transaction.CategoryId);
        Assert.True(transaction.IsCategoryLocked);
    }

    public static IEnumerable<object[]> ThrowingActions()
    {
        yield return [nameof(SetBillFlagAction), SetBillFlagAction(), typeof(UnreachableException)];
        yield return [nameof(SetCategoryNonGuidAction), SetCategoryNonGuidAction(), typeof(FormatException)];
    }

    [Theory]
    [MemberData(nameof(ThrowingActions))]
    public void RuleUtil_SetAction_Throws(string casename, Action action, Type expectedException)
    {
        var transaction = MatchingTransaction();

        var ex = Record.Exception(() => RuleUtil.SetAction(action, transaction));
        Assert.True(ex?.GetType() == expectedException, $"{casename} was expected to throw {expectedException.Name} but threw {ex?.GetType().Name ?? "nothing"}");
    }
}
