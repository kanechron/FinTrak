using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Interfaces;
using FinTrak.Core.Entities;

namespace FinTrak.Infrastructure.Services
{
    public class BillDetectionService : IBillDetectionService
    {
        private readonly FinTrakDbContext _db;

        public BillDetectionService(FinTrakDbContext db)
        {
            _db = db;
        }

        public async Task<List<List<TransactionGroup>>> DetectAsync(CancellationToken cancellationToken = default)
        {
            var transactions = await FetchTransactions(cancellationToken);
            var filtered = await FilterExistingBills(transactions, cancellationToken);
            var amountFilter = FilterByAmount(filtered);
            return FilterByCategory(amountFilter);
        }

        private async Task<List<List<TransactionGroup>>> FetchTransactions(CancellationToken cancellationToken)
        {
            if (cancellationToken.IsCancellationRequested)
                return [];

            var existingBills = await _db.Bills
                .Where(b => 
                b.DeletedAt == null)
                .Select(b => b.Name)
                .ToListAsync(cancellationToken);

            var flat = await _db.Transactions
                .Where(t => t.DeletedAt == null
                    && !t.IsPending
                    && t.CategoryId != null
                    && t.MerchantName != null
                    && !existingBills.Contains(t.MerchantName))
                .OrderBy(t => t.Date)
                .GroupBy(t => t.MerchantName)
                .Where(g => g.Count() >= 3)
                .Select(g => new TransactionGroup
                {
                    MerchantName = g.Key!,
                    Count = g.Count(),
                    Amounts = g.Select(t => t.Amount).ToList(),
                    Dates = g.Select(t => t.Date).OrderBy(d => d).ToList(),
                    Category = g.Select(t => t.CategoryDetailed != null ? t.CategoryDetailed.Name : null).FirstOrDefault(),
                    CategoryId = g.Select(t => t.CategoryId).FirstOrDefault()
                })
                .ToListAsync(cancellationToken);

            return flat
                .GroupBy(g => g.MerchantName)
                .Select(g => g.ToList())
                .ToList();
        }


        private static List<List<TransactionGroup>> FilterByCategory(List<List<TransactionGroup>> transGroups) =>
            transGroups.Where(bucket =>
                bucket.First().Category != null &&
                bucket.All(g => g.Category == bucket.First().Category) &&
                !BlacklistedCategories.Contains(bucket.First().Category!)
            ).ToList();

        private async Task<List<List<TransactionGroup>>> FilterExistingBills(
        List<List<TransactionGroup>> groups, CancellationToken cancellationToken)
        {
            var existingBills = await _db.Bills
                .Where(b => b.DeletedAt == null &&
                    (b.Status == BillStatus.Accepted || b.Status == BillStatus.Declined))
                .Select(b => new { b.Name, b.Amount })
                .ToListAsync(cancellationToken);

            return groups.Where(bucket =>
            {
                var group = bucket.First();
                var groupAmount = group.Amounts.FirstOrDefault();
                return !existingBills.Any(e =>
                    e.Name == group.MerchantName &&
                    e.Amount == groupAmount);
            }).ToList();
        }


        private static List<List<TransactionGroup>> FilterByAmount(List<List<TransactionGroup>> transGroups) =>
            transGroups.Where(bucket =>
                bucket.SelectMany(g => g.Amounts)
                      .Distinct()
                      .Count() == 1
            ).ToList();


        private static readonly HashSet<string> BlacklistedCategories = [.. Enum.GetNames(typeof(BlacklistedCategory))];
    }

    file enum BlacklistedCategory
    {
        FOOD_AND_DRINK,
        ENTERTAINMENT,
        SHOPS,
        TRAVEL,
        RECREATION
    }
}
