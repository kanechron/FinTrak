
namespace FinTrak.Core.Interfaces.Events;

public interface IEventHandler<TEvent> where TEvent : IRuleTriggerEvent
{
    Task HandleAsync(TEvent evt, CancellationToken cancellationToken = default);
}