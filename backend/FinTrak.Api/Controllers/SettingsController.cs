using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FinTrak.Api.Controllers
{
    public class SettingsController(ILogger<SettingsController> logger, ISettingRepository repo) : ApiBaseController
    {
        private readonly ILogger<SettingsController> _logger = logger;
        private readonly ISettingRepository _repo = repo;

        [HttpGet("get-settings")]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var settings = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            if (settings == null) return NotFoundError("Settings not found.");

            return Ok(settings);
        }

        // Creates the user's settings row with defaults. A soft-deleted row is restored instead,
        // since UserId is unique and a second row can't be inserted.
        [HttpPost("add-settings")]
        public async Task<IActionResult> AddSettings(CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var existing = await _repo.GetByUserIdIncludingDeletedAsync(userId, cancellationToken);

            if (existing != null && existing.DeletedAt == null)
                return Conflict(new { error = "Settings already exist." });

            if (existing != null)
            {
                var defaults = new Setting();
                existing.DeletedAt = null;
                existing.CreatedAt = DateTime.UtcNow;
                existing.InactivityTimeout = defaults.InactivityTimeout;
                existing.TransactionPageSize = defaults.TransactionPageSize;
                existing.AutoSync = defaults.AutoSync;
                existing.AutomaticReports = defaults.AutomaticReports;
                existing.AutoReportsFrequency = defaults.AutoReportsFrequency;
                existing.AutoReportsMethod = defaults.AutoReportsMethod;
                existing.NotificationMethod = defaults.NotificationMethod;
                existing.NotificationType = defaults.NotificationType;

                await _repo.SaveAsync(cancellationToken);
                return Ok(new { message = "Settings restored successfully.", id = existing.Id });
            }

            var newSettings = new Setting
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _repo.AddAsync(newSettings, cancellationToken);
            return Ok(new { message = "Settings added successfully.", id = newSettings.Id });
        }

        [HttpPatch("update-settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] Setting settings, CancellationToken cancellationToken)
        {
            var existing = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            if (existing == null) return NotFoundError("Settings not found.");

            existing.InactivityTimeout = settings.InactivityTimeout > 0 ? settings.InactivityTimeout : existing.InactivityTimeout;
            existing.TransactionPageSize = settings.TransactionPageSize > 0 ? settings.TransactionPageSize : existing.TransactionPageSize;
            existing.AutoSync = settings.AutoSync;
            existing.AutomaticReports = settings.AutomaticReports;
            existing.AutoReportsFrequency = settings.AutoReportsFrequency;
            existing.AutoReportsMethod = settings.AutoReportsMethod;
            existing.NotificationMethod = settings.NotificationMethod;
            existing.NotificationType = settings.NotificationType;

            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Settings updated successfully." });
        }

        [HttpDelete("delete-settings")]
        public async Task<IActionResult> DeleteSettings(CancellationToken cancellationToken)
        {
            var existing = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            if (existing == null) return NotFoundError("Settings not found.");

            existing.DeletedAt = DateTime.UtcNow;
            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Settings deleted successfully." });
        }
    }
}
