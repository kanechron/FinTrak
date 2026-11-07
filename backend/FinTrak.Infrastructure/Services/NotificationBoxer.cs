using System.Threading.Channels;
using FinTrak.Core.Entities;
using FinTrak.Core.Exceptions;
using FinTrak.Core.Interfaces.Services;

namespace FinTrak.Infrastructure.Services;

public class NotificationBoxer(Channel<Notification> channel) : INotificationBoxer
{
    private readonly Channel<Notification> _channel = channel;
    public void AutoSyncBoxer(List<Guid> list, Guid userId)
    {
        if (userId == Guid.Empty) throw new BadRequestException("User ID is not valid");
        Notification notif = new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = NotificationType.AutoSyncCompleted,
            SourceReference = SourceReference.Sync,
            AttemptState = AttemptState.FirstPass,
            Title = "Auto-sync has completed",
            Description = "View your newly synced transactions",
            Trigger = "Auto sync",
            Link = "https://fintrak.org/transactions",
            NextOccurrance = DateTime.Now.AddDays(1)
        };

        //Push Notification to channel
        _channel.Writer.TryWrite(notif);
    }
}
