using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Interfaces;
using FinTrak.Core.Entities;
using FuzzySharp;
using FinTrak.Core.Utilities;
using System.Text.RegularExpressions;
using Microsoft.VisualBasic;

namespace FinTrak.Infrastructure.Services
{
    public class BillDetectionService : IBillDetectionService
    {
        private readonly FinTrakDbContext _db;

        public BillDetectionService(FinTrakDbContext db)
        {
            _db = db;
        }

        public async Task<List<List<TransactionGroup>>> DetectAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var transactions = await FetchTransactions(cancellationToken, userId);

            return transactions;
        }

        private async Task<List<List<TransactionGroup>>> FetchTransactions(CancellationToken ct, Guid userId)
        {
            if (ct.IsCancellationRequested)
                return [];

            var deleteBills = await _db.Bills
                .Where(b =>
                b.DeletedAt == null
                && b.UserId == userId
                && b.Status == BillStatus.Pending)
                .ToListAsync(ct);

            foreach (var bill in deleteBills)
            {
                bill.DeletedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            var name = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync(ct) ?? string.Empty;

            var transactionsInit = await _db.Transactions
            .Where(t =>
            t.DeletedAt == null &&
            t.UserId == userId &&
            t.IsPending == false &&
            t.Date >= DateOnly.FromDateTime(DateTime.Today.AddMonths(-6)) &&
            t.Date <= DateOnly.FromDateTime(DateTime.Today))
            .Select(t => new
            {
                t.MerchantNameNormalized,
                t.MerchantName,
                t.Amount,
                t.Date,
                t.CategoryId
            })
            .ToListAsync(ct);

            var transactions = transactionsInit.Select(t => new TransactionGroup
            {
                MerchantName = (t.MerchantNameNormalized ?? t.MerchantName).NormalizeForBillDetection(name),
                Amounts = new List<decimal?> { t.Amount },
                Dates = new List<DateOnly?> { t.Date },
                CategoryId = t.CategoryId
            });

            var groups = transactions
                .GroupBy(t => t.MerchantName)
                .Select(g => new TransactionGroup
                {
                    MerchantName = g.Key,
                    Amounts = g.Select(t => t.Amounts.First()).ToList(),
                    Dates = g.Select(t => t.Dates.First()).ToList(),
                    CategoryId = g.First().CategoryId
                })
                .ToList();

            var clusters = new List<List<TransactionGroup>>();

            foreach (var group in groups)
            {
                var found = false;
                foreach (var cluster in clusters)
                {
                    if (cluster.All(member => Fuzz.TokenSetRatio(group.MerchantName, member.MerchantName) >= 75))
                    {
                        cluster.Add(group);
                        found = true;
                        break;
                    }
                }
                if (!found) clusters.Add(new List<TransactionGroup> { group });
            }

            


            clusters = clusters.Where(c => c.Sum(g => g.Amounts.Count) >= 3).ToList();

            // Split each fuzzy cluster into amount-consistent sub-clusters.
            // This handles the case where one merchant name covers two different bills
            // (home vs auto insurance under the same payee name).
            var subClustered = new List<List<TransactionGroup>>();
            foreach (var cluster in clusters)
            {
                var subs = new List<List<TransactionGroup>>();
                foreach (var group in cluster)
                {
                    var groupBaseline = group.Amounts.Where(a => a.HasValue).Select(a => a!.Value).FirstOrDefault();
                    if (groupBaseline == 0) continue;

                    bool placed = false;
                    foreach (var sub in subs)
                    {
                        var subBaseline = sub.First().Amounts.Where(a => a.HasValue).Select(a => a!.Value).First();
                        if (Math.Abs(groupBaseline - subBaseline) / subBaseline <= 0.015m)
                        {
                            sub.Add(group);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) subs.Add(new List<TransactionGroup> { group });
                }
                subClustered.AddRange(subs);
            }
            clusters = subClustered.Where(c => c.Sum(g => g.Amounts.Count) >= 3).ToList();

            // select all List<TransactionGroup> lists where all TransactionGroup objects' date values are 28-32 days of eachother OR all fall on the same day of the month
            clusters = clusters
                .Where(parent =>
                {
                    var dates = parent.SelectMany(list => list.Dates).Where(d => d.HasValue).Select(d => d!.Value).ToList();
                    var arrA = new List<int?>();
                    foreach (var date in dates)
                    {
                        arrA.Add(date.Day);
                    }
                    var sameDay = arrA.Distinct().Count() == 1;

                    dates.Sort();
                    bool gapCheck = true;
                    for (int i = 0; i < dates.Count()-1; i++)
                    {
                        var dateA = dates[i]!.DayNumber;
                        var dateB = dates[i+1]!.DayNumber;
                        if((dateB-dateA) % 30 > 3 && (dateB-dateA) % 30 < 27 )
                        {
                            gapCheck = false;
                            break;
                        }
                    }
                    return sameDay || gapCheck;
                }).ToList();

            var existingBillNames = await _db.Bills
                .Where(b =>
                b.DeletedAt == null
                && b.UserId == userId
                && b.Status != BillStatus.Declined)
                .Select(b => new { b.Name, b.Amount })
                .ToListAsync(ct);

            var existingBills = existingBillNames.Select(n => new { Name = n.Name.NormalizeName(), n.Amount }).ToList();

            return clusters
                .Where(c =>
                {
                    var group = c.First();
                    var amount = group.Amounts.First();
                    return !existingBills.Any(e => Fuzz.TokenSetRatio(group.MerchantName, e.Name) >= 75 && e.Amount == amount);
                })
                .ToList();
        }
    }
}
