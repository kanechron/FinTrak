using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

/// <summary>
/// Marker for anything that can pass through the rule-trigger channel. Concrete events
/// (e.g. a "sync completed" event) implement this so the channel/dispatcher can carry
/// and route many different event types through one pipe, keyed off each event's
/// concrete runtime type.
/// </summary>
public interface IRuleTriggerEvent
{
}
public record SyncCompletedEvent(Guid UserId, List<Guid> LookupItems, DateTime OccurredAt) : IRuleTriggerEvent;

public record RecursiveRuleSavedEvent(Guid UserId, DateTime OccurredAt) : IRuleTriggerEvent;

public record PDFImportEvent(Guid UserId, List<Guid> LookupItems, DateTime OccurredAt) : IRuleTriggerEvent;