using FinTrak.Core.Utilities;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Services;

public class TransactionNameMatchService : ITransactionNameMatchService
{
    private readonly FinTrakDbContext _db;

        public TransactionNameMatchService(FinTrakDbContext db)
        {
            _db = db;
        }

    public async Task<int> MatchByName(ApplyCategoryRequest request, CancellationToken cancellationToken)
        {
            const double threshold = 0.5;
            var normalized = request.MerchantName.NormalizeName();

            var updated = await _db.Transactions
                .Where(t => t.DeletedAt == null && EF.Functions.TrigramsSimilarity(t.MerchantNameNormalized!, normalized) > threshold)
                .ExecuteUpdateAsync(t => t.SetProperty(x => x.CategoryId, request.CategoryId), cancellationToken);
            return updated;  
        }
}

