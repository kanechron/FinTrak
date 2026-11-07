namespace FinTrak.Core.Interfaces;

public interface IPdfImportService
{
    Task<int> ImportAsync(Stream pdf, Guid userId, CancellationToken cancellationToken = default);
}

