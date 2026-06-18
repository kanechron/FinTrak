using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.BackgroundServices
{
    public class BillDetectionService
    {
        private readonly FinTrakDbContext _db;

        public BillDetectionService(FinTrakDbContext db)
        {
            _db = db;
        }

        public async Task<List<List<TransactionGroup>>> DetectAsync(CancellationToken cancellationToken = default)
        {
            var transactions = await FetchTransactions(cancellationToken);
            var amountFilter = FilterByAmount(transactions);
            var categoryFilter = FilterByCategory(amountFilter);
            return categoryFilter;
        }

        private async Task<List<List<TransactionGroup>>> FetchTransactions(CancellationToken cancellationToken)
        {
            try
            {
                var existingBills = await _db.Bills
                .Where(b => b.DeletedAt == null)
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
                        Category = g.Select(t => t.CategoryDetailed).FirstOrDefault(),
                        CategoryId = g.Select(t => t.CategoryId).FirstOrDefault()
                    })
                    .ToListAsync(cancellationToken);

                return flat
                    .GroupBy(g => g.MerchantName)
                    .Select(g => g.ToList())
                    .ToList();
            }
            catch (OperationCanceledException)
            {
                return new List<List<TransactionGroup>>();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error fetching transactions: " + ex.Message);
                return new List<List<TransactionGroup>>();
            }
        }

        private static List<List<TransactionGroup>> FilterByAmount(List<List<TransactionGroup>> transGroups)
        {
            try
            {
                return transGroups.Where(bucket =>
                    bucket.SelectMany(g => g.Amounts)
                          .Distinct()
                          .Count() == 1
                ).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error filtering by amount: " + ex.Message);
                return new List<List<TransactionGroup>>();
            }
        }

        private static List<List<TransactionGroup>> FilterByCategory(List<List<TransactionGroup>> transGroups)
        {
            try
            {
                return transGroups.Where(bucket =>
                    bucket.First().Category != null &&
                    bucket.All(g => g.Category == bucket.First().Category) &&
                    !BlacklistedCategories.Contains(bucket.First().Category!)
                ).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error filtering by category: " + ex.Message);
                return new List<List<TransactionGroup>>();
            }
        }

        private static readonly HashSet<string> BlacklistedCategories = new(Enum.GetNames(typeof(BlacklistedCategory)));

        public class TransactionGroup
        {
            public string MerchantName { get; set; } = string.Empty;
            public int Count { get; set; }
            public List<decimal?> Amounts { get; set; } = new();
            public List<DateOnly?> Dates { get; set; } = new();
            public string? Category { get; set; }
            public Guid? CategoryId { get; set; }
        }
    }

    internal enum BlacklistedCategory
    {
        FOOD_AND_DRINK,
        ENTERTAINMENT,
        SHOPS,
        TRAVEL,
        RECREATION
    }
}
