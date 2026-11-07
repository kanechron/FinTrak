
namespace FinTrak.Core.Interfaces;

public interface IEventHandler<TEvent> where TEvent : IRuleTriggerEvent
{
    Task HandleAsync(TEvent evt, CancellationToken cancellationToken = default);
}