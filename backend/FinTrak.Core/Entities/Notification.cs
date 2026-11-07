

namespace FinTrak.Core.Entities;

/// <summary>
/// One notification for one user, built and validated by the boxer and placed on the notifications channel.
/// The delivery loop reads it and sends it over each of its <see cref="DeliveryMethods"/>.
/// </summary>
public class Notification
{
    //Backend-facing properties

    /// <summary>Unique id for this notification.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>The user this notification is for.</summary>
    public Guid UserId { get; set; } = Guid.NewGuid();

    /// <summary>Which notification this is (e.g. auto-sync completed). Always a single type.</summary>
    public NotificationType Type { get; set; } = NotificationType.None;

    /// <summary>Every method this notification is sent over. Each method is sent, and retried, on its own.</summary>
    public DeliveryMethods DeliveryMethods { get; set; } = DeliveryMethods.None;

    /// <summary>
    /// What this notification is about, such as a transaction or a budget and period. Data notifications are sent
    /// once per piece of data, so this plus <see cref="Type"/> is how a duplicate is detected.
    /// </summary>
    public SourceReference SourceReference { get; set; } = SourceReference.None;

    /// <summary>Where this notification is in the send/retry cycle. Tells the delivery loop whether a failure gets one more try or is logged and dropped.</summary>
    public AttemptState AttemptState { get; set; } = AttemptState.None;

    //User-facing properties

    /// <summary>Short headline. The only text a push notification shows.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Full details. Shown by methods with room for it, such as email.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Plain-language description of what caused this notification.</summary>
    public string Trigger { get; set; } = string.Empty;

    /// <summary>Where opening the notification takes the user, such as the related budget or transaction.</summary>
    public string Link { get; set; } = string.Empty;

    //Both user-facing and backend-facing properties

    /// <summary>When this notification was created, in UTC. Shown to the user and used for ordering.</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Link that turns this notification off. Recurring notifications only.</summary>
    public string DisableLink { get; set; } = string.Empty;

    /// <summary>When a recurring notification is next due. Null for one-off notifications.</summary>
    public DateTime? NextOccurrance { get; set; } = null;
}

/// <summary>Where a notification is delivered. A notification can be sent over several methods at once.</summary>
[Flags]
public enum DeliveryMethods
{
    None = 0,
    /// <summary>The in-app notification bell. Parked.</summary>
    Inbox = 1,
    Email = 2,
    WebPush = 4,
    MobilePush = 8,
    /// <summary>In-app toast. Parked.</summary>
    Toast = 16,
}

/// <summary>Where a notification is in the send/retry cycle.</summary>
public enum AttemptState
{
    /// <summary>Not yet attempted.</summary>
    None = 0,
    /// <summary>Being sent for the first time. A failure here goes to the retry table.</summary>
    FirstPass = 1,
    /// <summary>Already retried once. Another failure is logged and dropped.</summary>
    Retry = 2,
    /// <summary>Failed validation and won't be sent.</summary>
    Invalid = 3
}

public enum SourceReference
{
    None = 0,
    Transactions = 1,
    Budgets = 2,
    Bills = 3,
    Goals = 4,
    Reports = 5,
    Sync = 6,
    Rules = 7,
    Settings = 8
}
