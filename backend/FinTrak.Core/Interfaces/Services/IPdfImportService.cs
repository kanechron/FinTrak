namespace FinTrak.Core.Interfaces.Services;

public interface IPdfImportService
{
    Task<int> ImportAsync(Stream pdf, Guid userId, CancellationToken cancellationToken = default);
}

