using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Utilities;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;


namespace FinTrak.Infrastructure.BackgroundServices
{
    public class TransactionNameMatchService
    {
        private readonly FinTrakDbContext _db;

        public TransactionNameMatchService(FinTrakDbContext db)
        {
            _db = db;
        }

        public async Task<int> TransactionMatchByName(ApplyCategoryRequest request)
        {
            const double threshold = 0.5;
            var normalized = request.MerchantName.NormalizeName();

            var updated = await _db.Transactions
                .Where(t => t.DeletedAt == null && EF.Functions.TrigramsSimilarity(t.MerchantNameNormalized!, normalized) > threshold)
                .ExecuteUpdateAsync(t => t.SetProperty(x => x.CategoryId, request.CategoryId));
            return updated;
            



             
        }

        public record ApplyCategoryRequest(string MerchantName, Guid? CategoryId);
    }
}