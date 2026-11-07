
namespace FinTrak.Core.Entities;

// TODO: Once the Settings table is final, add migrationBuilder.Sql() after CreateTable to INSERT ... SELECT one row per user from "Users".
// C# defaults (e.g. InactivityTimeout = 30) don't apply to raw SQL, so list every non-nullable column's value or use HasDefaultValue.
public class Setting
{
        public Guid Id { get; set; } = Guid.Empty;
        public Guid UserId { get; set; } = Guid.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; } = null;
        ///<summary>Length of time, in minutes, before user is automatically signed out.</summary>
        public int InactivityTimeout { get; set; } = 30;
        ///<summary>Number of Transactions available per grouping</summary>
        public int TransactionPageSize { get; set; } = 50;
        public bool AutoSync { get; set; } = false;
        /// <summary>
        /// Type(s) of reports to be automatically delivered to the user
        /// </summary>
        public AutoReports AutomaticReports { get; set; } = AutoReports.None;
        /// <summary>
        /// How often the user would like their report(s) delivery
        /// </summary>
        public AutoReportsFrequency AutoReportsFrequency { get; set; } = AutoReportsFrequency.None;
        /// <summary>
        /// Method of delivery for automatic reports
        /// </summary>
        public AutoReportsMethod AutoReportsMethod { get; set; } = AutoReportsMethod.None;
        public NotificationMethod NotificationMethod { get; set; } = NotificationMethod.None;
        public NotificationType NotificationType { get; set; } = NotificationType.None;
}

#region Reports

    [Flags]
    public enum AutoReports
    {
        None = 0,
        CategorySpending = 1,
        MonthlySpending = 2,
        BudgetPerformance = 4,
        IncomeExpenses = 8,
        PredictFuture = 16
        
    }
    
    [Flags]
    public enum AutoReportsMethod
    {
        None = 0,
        InApp = 1,
        Email = 2
    }

    public enum AutoReportsFrequency
    {
        None = 0,
        Weekly = 1,
        Monthly = 2,
    }
    #endregion

#region Notifications
/// <summary>
/// Which route(s) the notification will be sent on 
/// </summary>
[Flags]
public enum NotificationMethod
{
    None = 0,
    Inbox = 1,
    Email = 2,
    WebPush = 4,
    MobilePush = 8,
    Toast = 16,
}

// [Flags]
// public enum NotificationChannel
// {
//     None = 0,
// }

/// <summary>
/// The categories by which different notification triggers originate 
/// </summary>
// public enum NotificationSource
// {
//     None = 0,
//     SyncCompleted = 1,
//     SyncFailed = 2,
//     PDFImportCompleted = 3,
//     RuleMatched = 4,
//     NewLogin = 5
// }

/// <summary>
/// Allowed notification types; which notification(s) the user has opted in to.
/// </summary>
[Flags]
public enum NotificationType
{
    None = 0,
    SADRunningHot = 1,
    BudgetThresholdCrossed = 2,
    TransactionTooLarge = 4,
    NewRecurringBillDetected = 8,
    RecurringBillPaid = 16,
    AutoSyncCompleted = 32,
    SyncFailed = 64,
    PDFImportCompleted = 128,
    NewLogin = 256,
    GoalCompleted = 512,
}
#endregion