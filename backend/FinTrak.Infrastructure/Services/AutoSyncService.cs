
using FinTrak.Core.Exceptions;
using FinTrak.Core.Interfaces.Services;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinTrak.Infrastructure.Services;

public class AutoSyncService(FinTrakDbContext db, IPlaidSyncService syncSvc, ILogger<AutoSyncService> logger, INotificationBoxer boxer)
{
    private readonly FinTrakDbContext _db = db;
    private readonly IPlaidSyncService _syncSvc = syncSvc;
    private readonly ILogger<AutoSyncService> _logger = logger;
    private readonly INotificationBoxer _boxer = boxer;
    public async Task AutoSyncUsers(CancellationToken ct)
    {
        List<Guid> subbedUsers = await _db.Settings.Where(s => s.AutoSync == true).Select(s => s.UserId).ToListAsync(ct);
        foreach(var user in subbedUsers)
        {
            var result = await _syncSvc.SyncAsync(user, ct);
            try
            {
                _boxer.AutoSyncBoxer(result, user);
            }
            catch(AppException ex)
            {
                _logger.LogError(ex, "temp");
            }
        }
    }
}