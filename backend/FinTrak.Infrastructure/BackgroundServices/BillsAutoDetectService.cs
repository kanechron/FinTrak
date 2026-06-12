using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore.Query;
using System.Threading.RateLimiting;

namespace FinTrak.Core.BackgroundServices
{
    public class BillsAutoDetectService : BackgroundService
    {
        public readonly IServiceScopeFactory _scopeFactory;

        public BillsAutoDetectService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            /*
                1. FetchTransactionGroups()
                → returns List<TransactionGroup> (grouped by MerchantName, 3+ occurrences, from DB)

                2. FilterByAmount(List<TransactionGroup>)
                → for each group, check if amounts are consistent
                → returns only groups where amounts match exactly (or mostly)

                3. FilterByCategory(List<TransactionGroup>)
                → drop anything in the blacklist
                → returns the filtered list

                4. CheckDatePattern(List<TransactionGroup>)
                → for each group, analyze the dates
                → returns same list but with a DatePatternConsistent flag or similar

                5. AssignConfidence(List<TransactionGroup>)
                → looks at amount consistency + category + date pattern
                → assigns Low / Medium / High to each group
                → returns List<BillSuggestion>

            */
            while(!stoppingToken.IsCancellationRequested)
            {
            
            await DetectAsync(stoppingToken);
            // var dateFilter = CheckDatePattern(categoryFilter);
            

            await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
            }   
        }

        public async Task<List<List<TransactionGroup>>> DetectAsync(CancellationToken stoppingToken)
        {
            var transactions = await FetchTransactions(stoppingToken);
            var amountFilter = FilterByAmount(transactions);
            var categoryFilter = FilterByCategory(amountFilter);
            return categoryFilter;
        }

        public async Task<List<List<TransactionGroup>>> FetchTransactions(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FinTrakDbContext>();

            var flat = await db.Transactions
                .Where(t => t.DeletedAt == null && t.IsPending == false && t.CategoryId != null)
                .OrderBy(t => t.Date)
                .GroupBy(t => t.MerchantName)
                .Where(g => g.Count() >= 3)
                .Select(g => new TransactionGroup
                {
                    MerchantName = g.Key,
                    Count = g.Count(),
                    Amounts = g.Select(t => t.Amount).ToList(),
                    Dates = g.Select(t => t.Date).OrderBy(d => d).ToList(),
                    Category = g.Select(t => t.CategoryDetailed != null ? t.CategoryDetailed : null).FirstOrDefault()
                })
                .ToListAsync(stoppingToken);

            return flat
            .GroupBy(g => g.MerchantName)
            .Select(g => g.ToList())
            .ToList();
                
            }
            catch (OperationCanceledException)
            {
                // Task was cancelled, return empty list or handle as needed
                return new List<List<TransactionGroup>>();
            }
            catch (Exception ex)
            {
                // Log the exception (not implemented here)
                Console.WriteLine("Error fetching transactions: " + ex.Message);
                return new List<List<TransactionGroup>>();
            }
            
        }

        
        public List<List<TransactionGroup>> FilterByAmount(List<List<TransactionGroup>> transGroups)
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
    
        public List<List<TransactionGroup>> FilterByCategory(List<List<TransactionGroup>> transGroups)
        {
            try
            {
                return transGroups.Where(bucket =>
                    bucket.All(g => g.Category == bucket.First().Category && !BlacklistedCategories.Contains(bucket.First().Category!))
                ).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error filtering by category: " + ex.Message);
                return new List<List<TransactionGroup>>();
            }
        }

        // public List<List<TransactionGroup>> CheckDatePattern(List<List<TransactionGroup>> transGroups)
        // {
        //     try
        //     {
        //       foreach(var bucket in transGroups)
        //         {
        //              var days = bucket.SelectMany(g => g.Dates)
        //             .Where(d => d.HasValue)
        //             .Select(d => d!.Value.Day)
        //             .ToList();

        //         double average = days.Average();
        //         bool consistentDay = days.All(d => Math.Abs(d - average) <= 3);


        //         }


        //     }
        //     catch (Exception ex)
        //     {
        //         Console.WriteLine("Error checking date patterns: " + ex.Message);
        //         return new List<List<TransactionGroup>>();
        //     }
        // }

        public static readonly HashSet<string> BlacklistedCategories = new (Enum.GetNames(typeof(BlacklistedCategories)));

        public class TransactionGroup
        {
            public string MerchantName { get; set; } = string.Empty;
            public int Count { get; set; }
            public List<decimal?> Amounts { get; set; } = new();
            public List<DateOnly?> Dates { get; set; } = new();
            public string? Category { get; set; }
        }

    }

    internal enum BlacklistedCategories
    {
        FOOD_AND_DRINK,
    ENTERTAINMENT,
    SHOPS,
    TRAVEL,
    RECREATION
    }
}