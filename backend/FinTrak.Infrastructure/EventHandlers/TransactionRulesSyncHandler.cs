using FinTrak.Core.Interfaces;
using FinTrak.Core.Entities;

namespace FinTrak.Infrastructure.EventHandlers;

/// <summary>
/// Evaluates Transaction-target rules (OnSync + Always) against newly added/modified
/// transactions. Currently only triggered by a completed Plaid sync (<see cref="SyncCompletedEvent"/>);
/// will extend to PDF import and manual entry once those have their own events.
/// </summary>
/// <remarks>
/// The end of the pipeline (<see cref="IRulesService.EvaluateTransactionRulesAsync"/> — matching + actions) is fixed;
/// every transaction event lands there, differing only in the ids and <see cref="TriggerType"/> it passes.
/// Adding a new event source never touches the evaluation logic, only this small amount of wiring:
/// <list type="number">
///     <item>An event record implementing <see cref="IRuleTriggerEvent"/> (e.g. <c>PdfImportedEvent</c>).</item>
///     <item>A handler like this one implementing <c>IEventHandler&lt;ThatEvent&gt;</c>, whose <c>HandleAsync</c> calls <c>EvaluateTransactionRulesAsync</c> with the matching trigger.</item>
///     <item>A DI registration in Program.cs: <c>AddScoped&lt;IEventHandler&lt;ThatEvent&gt;, ThatHandler&gt;()</c>.</item>
///     <item>A <c>case ThatEvent e:</c> in <c>RulesBackgroundService</c>'s switch.</item>
///     <item>A <c>Channel.Writer.TryWrite(...)</c> wherever the event happens.</item>
/// </list>
/// </remarks>
public class TransactionRulesSyncHandler(IRulesService rulesService) : IEventHandler<SyncCompletedEvent>, IEventHandler<RecursiveRuleSavedEvent>, IEventHandler<PDFImportEvent>
{
    private readonly IRulesService _rulesService = rulesService;

    public async Task HandleAsync(SyncCompletedEvent evt, CancellationToken cancellationToken = default)
    {
        await _rulesService.EvaluateTransactionRulesAsync(evt.UserId, evt.LookupItems, TriggerType.OnSync, cancellationToken);
    }   
    public async Task HandleAsync(RecursiveRuleSavedEvent evt, CancellationToken cancellationToken = default)
    {
        await _rulesService.ApplyRuleToTransactionHistory(evt.UserId, cancellationToken);
    }   
    public async Task HandleAsync(PDFImportEvent evt, CancellationToken cancellationToken = default)
    {
        await _rulesService.EvaluateTransactionRulesAsync(evt.UserId, evt.LookupItems, TriggerType.OnPDFImport, cancellationToken);
    }
}
