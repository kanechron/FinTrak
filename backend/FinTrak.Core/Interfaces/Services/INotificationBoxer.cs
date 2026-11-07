namespace FinTrak.Core.Interfaces.Services;

public interface INotificationBoxer
{
    public void AutoSyncBoxer(List<Guid> transactions, Guid userId);
}
