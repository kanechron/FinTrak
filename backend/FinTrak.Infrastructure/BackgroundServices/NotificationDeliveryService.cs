using System.Threading.Channels;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinTrak.Infrastructure.BackgroundServices;

public class NotificationDeliveryService(IServiceScopeFactory scopeFactory, Channel<Notification> channel, ILogger<NotificationDeliveryService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly Channel<Notification> _channel = channel;
    private readonly ILogger<NotificationDeliveryService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while(!stoppingToken.IsCancellationRequested)
        {
            await foreach (var x in _channel.Reader.ReadAllAsync(stoppingToken))
            {
                await EmailSenderService.SendEmail(x);
            }
        }
    }
}
