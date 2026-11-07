namespace FinTrak.Core.Interfaces;

public interface ITransactionNameMatchService
{
    Task<int> MatchByName(ApplyCategoryRequest request, CancellationToken cancellationToken = default);
}

public record ApplyCategoryRequest(string MerchantName, Guid? CategoryId);