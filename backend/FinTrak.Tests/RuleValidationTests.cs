using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using Action = FinTrak.Core.Entities.Action;
using Xunit;
using FinTrak.Infrastructure.Utilities;
using FinTrak.Api.Validation;
using System.ComponentModel.DataAnnotations;

namespace FinTrak.Tests;

public class RuleValidatorFixture
{
    public RuleValidator RuleVal { get; } = new RuleValidator(new RuleFieldMapDeserializer().ParseRuleFieldmap());
}

public class RuleValidationTests(RuleValidatorFixture val) : IClassFixture<RuleValidatorFixture>
{
    private readonly RuleValidatorFixture _val = val;

    #region Test Objects
    // ---------------------------------------------------------------------
    // Should PASS
    // ---------------------------------------------------------------------

    /// <summary>The Spotify example from the design discussion — the case that specifically
    /// proved the same-ActionType check needs to key on ActionField, not ActionType, since
    /// this rule legitimately has two Set actions on different fields.</summary>
    public static Rule ValidSpotifyRule() => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        RuleName = "Spotify normalization",
        Priority = 0,
        IsActive = true,
        Recursive = false,
        Target = TargetType.Transaction,
        Trigger = TriggerType.OnSync,
        Conditions =
        [
            new Condition
            {
                GroupId = Guid.NewGuid(),
                ConditionField = ConditionField.MerchantName,
                ConditionOperator = Operator.CONTAINS,
                ConditionValue = "spotify",
                Not = false
            }
        ],
        Actions =
        [
            new Action { ActionField = ActionField.MerchantName, ActionType = ActionType.Set, ActionValue = "Spotify" },
            new Action { ActionField = ActionField.Category, ActionType = ActionType.Set, ActionValue = Guid.NewGuid().ToString() }
        ]
    };

    /// <summary>Two ANDed conditions (same GroupId) plus two ORed groups (different GroupId) —
    /// the "Spotify AND Premium" OR "Spotify AND Music" example from the design discussion.</summary>
    public static Rule ValidMultiGroupRule()
    {
        var groupA = Guid.NewGuid();
        var groupB = Guid.NewGuid();

        return new Rule
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            RuleName = "Spotify variants",
            Priority = 1,
            IsActive = true,
            Recursive = false,
            Target = TargetType.Transaction,
            Trigger = TriggerType.OnSync,
            Conditions =
            [
                new Condition { GroupId = groupA, ConditionField = ConditionField.MerchantName, ConditionOperator = Operator.CONTAINS, ConditionValue = "Spotify" },
                new Condition { GroupId = groupA, ConditionField = ConditionField.MerchantName, ConditionOperator = Operator.CONTAINS, ConditionValue = "Premium" },
                new Condition { GroupId = groupB, ConditionField = ConditionField.MerchantName, ConditionOperator = Operator.CONTAINS, ConditionValue = "Spotify" },
                new Condition { GroupId = groupB, ConditionField = ConditionField.MerchantName, ConditionOperator = Operator.CONTAINS, ConditionValue = "Music" },
            ],
            Actions = [new Action { ActionField = ActionField.Category, ActionType = ActionType.Set, ActionValue = Guid.NewGuid().ToString() }]
        };
    }

    // ---------------------------------------------------------------------
    // Should FAIL
    // ---------------------------------------------------------------------

    /// <summary>Missing RuleName.</summary>
    public static Rule MissingRuleName()
    {
        var rule = ValidSpotifyRule();
        rule.RuleName = null!;
        return rule;
    }

    /// <summary>Empty Conditions list.</summary>
    public static Rule EmptyConditions()
    {
        var rule = ValidSpotifyRule();
        rule.Conditions = [];
        return rule;
    }

    /// <summary>Empty Actions list.</summary>
    public static Rule EmptyActions()
    {
        var rule = ValidSpotifyRule();
        rule.Actions = [];
        return rule;
    }

    /// <summary>Target is null.</summary>
    public static Rule MissingTarget()
    {
        var rule = ValidSpotifyRule();
        rule.Target = null;
        return rule;
    }

    /// <summary>Target has a value, but there's no entry for it in the field map — e.g. the
    /// validator gets constructed with an empty/mismatched map. TargetType only has Transaction
    /// today, so this can't be simulated with a second real enum value; use this rule with a
    /// separately-constructed empty Dictionary&lt;TargetType, RuleFieldMapDto&gt; (not FieldMap)
    /// when validating, rather than relying on the Target value itself to trigger the failure.</summary>
    public static Rule UnconfiguredTarget() => ValidSpotifyRule();

    /// <summary>Trigger is null.</summary>
    public static Rule MissingTrigger()
    {
        var rule = ValidSpotifyRule();
        rule.Trigger = null;
        return rule;
    }

    /// <summary>Condition has no operator.</summary>
    public static Rule ConditionMissingOperator()
    {
        var rule = ValidSpotifyRule();
        rule.Conditions[0].ConditionOperator = null;
        return rule;
    }

    /// <summary>GREATER_THAN isn't a valid operator for MerchantName per the field map.</summary>
    public static Rule ConditionInvalidFieldOperatorCombo()
    {
        var rule = ValidSpotifyRule();
        rule.Conditions[0].ConditionField = ConditionField.MerchantName;
        rule.Conditions[0].ConditionOperator = Operator.GREATER_THAN;
        return rule;
    }

    /// <summary>BudgetExclusion only allows Exclude, not Set, per the field map.</summary>
    public static Rule ActionInvalidFieldTypeCombo()
    {
        var rule = ValidSpotifyRule();
        rule.Actions[0].ActionField = ActionField.BudgetExclusion;
        rule.Actions[0].ActionType = ActionType.Set;
        return rule;
    }

    /// <summary>Two actions on the same ActionField (Category), contradicting each other —
    /// distinct from the ValidSpotifyRule case, which uses two *different* fields.</summary>
    public static Rule DuplicateActionField()
    {
        var rule = ValidSpotifyRule();
        rule.Actions =
        [
            new Action { ActionField = ActionField.Category, ActionType = ActionType.Set, ActionValue = Guid.NewGuid().ToString() },
            new Action { ActionField = ActionField.Category, ActionType = ActionType.Set, ActionValue = Guid.NewGuid().ToString() },
        ];
        return rule;
    }
    #endregion

    [Fact]
    public async Task RuleValidation_KnownGood()
    {
        var ruleA = ValidSpotifyRule();
        var resultA = await _val.RuleVal.ValidateAsync(ruleA);

        var ruleB = ValidMultiGroupRule();
        var resultB = await _val.RuleVal.ValidateAsync(ruleB);

        Assert.True(resultA.IsValid);
        Assert.True(resultB.IsValid);
    }

    // UnconfiguredTarget is excluded here — it needs a validator built with an empty field map
    // to actually demonstrate the failure; against the real one (Transaction configured), it's valid.
    public static IEnumerable<object[]> InvalidRules()
    {
        yield return [nameof(MissingRuleName), MissingRuleName()];
        yield return [nameof(EmptyConditions), EmptyConditions()];
        yield return [nameof(EmptyActions), EmptyActions()];
        yield return [nameof(MissingTarget), MissingTarget()];
        yield return [nameof(MissingTrigger), MissingTrigger()];
        yield return [nameof(ConditionMissingOperator), ConditionMissingOperator()];
        yield return [nameof(ConditionInvalidFieldOperatorCombo), ConditionInvalidFieldOperatorCombo()];
        yield return [nameof(ActionInvalidFieldTypeCombo), ActionInvalidFieldTypeCombo()];
        yield return [nameof(DuplicateActionField), DuplicateActionField()];
    }

    [Theory]
    [MemberData(nameof(InvalidRules))]
    public async Task RuleValidation_KnownBad(string caseName, Rule rule)
    {
        var result = await _val.RuleVal.ValidateAsync(rule);
        Assert.False(result.IsValid, $"{caseName} was expected to fail validation but passed.");
    }

    [Fact]
    public async Task RuleValidation_UnconfiguredTarget_FailsAgainstEmptyFieldMap()
    {
        var emptyMapValidator = new RuleValidator(new Dictionary<TargetType, RuleFieldMapDto>());
        var result = await emptyMapValidator.ValidateAsync(UnconfiguredTarget());
        Assert.False(result.IsValid);
    }
}
