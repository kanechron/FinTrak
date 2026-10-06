

using System.Threading.Channels;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.EventHandlers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinTrak.Infrastructure.BackgroundServices;

public class RulesBackgroundService(IServiceScopeFactory scopeFactory, Channel<IRuleTriggerEvent> channel, ILogger<RulesBackgroundService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly Channel<IRuleTriggerEvent> _channel = channel;
    private readonly ILogger<RulesBackgroundService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach(var evt in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            using var scope = _scopeFactory.CreateScope();
            try
            {
                switch (evt)
                {
                    case SyncCompletedEvent e:
                        var SyncEventHandler = scope.ServiceProvider.GetRequiredService<IEventHandler<SyncCompletedEvent>>();
                        await SyncEventHandler.HandleAsync(e, stoppingToken);
                        break;
                    case RecursiveRuleSavedEvent e:
                        var RecursiveEventHandler = scope.ServiceProvider.GetRequiredService<IEventHandler<RecursiveRuleSavedEvent>>();
                        await RecursiveEventHandler.HandleAsync(e, stoppingToken);
                        break;
                    case PDFImportEvent e:
                        var PDFImportEventHandler = scope.ServiceProvider.GetRequiredService<IEventHandler<PDFImportEvent>>();
                        await PDFImportEventHandler.HandleAsync(e, stoppingToken);
                        break;

                    default:
                        _logger.LogWarning("No handler registered for rule trigger event {EventType}", evt.GetType().Name);
                        break;

                }  
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) {}
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to handle rule trigger event {EventType}", evt.GetType().Name);
            }
        }
    }
}

