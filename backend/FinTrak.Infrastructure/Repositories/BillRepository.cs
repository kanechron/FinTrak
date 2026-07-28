using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Infrastructure.Services;
using FinTrak.Core.Utilities;

namespace FinTrak.Infrastructure.Repositories;

public class BillRepository(FinTrakDbContext db, ITransactionNameMatchService tMatch) : IBillRepository
{
    private readonly FinTrakDbContext _db = db;
    private readonly ITransactionNameMatchService _tMatch = tMatch;

    public async Task<List<Bill>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Bills
            .Where(b => b.DeletedAt == null && b.UserId == userId && b.Status != BillStatus.Declined)
            .Include(b => b.Category)
            .ToListAsync(cancellationToken);

    public async Task<Bill?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Bills.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null && b.Status != BillStatus.Declined, cancellationToken);
    
    public async Task<List<Transaction>> GetBillHistoryAsync(Guid userId, Guid billId)
    {
        var bill = await _db.Bills.Where(b => b.Id == billId && b.UserId == userId && b.Status != BillStatus.Declined).Select(b => new { b.Name, b.Amount, b.Category }).FirstOrDefaultAsync();
        var billName = bill! .Name;
        var billAmount = bill.Amount;
        if(bill == null || string.IsNullOrWhiteSpace(billName)) return new List<Transaction>();
        var billCategory = bill.Category;



        var tx = await _db.Transactions
        .Where(t => 
        t.DeletedAt == null &&
        t.UserId == userId &&
        t.Amount > 0 &&
        //Name and Amount
        (Math.Abs(billAmount - (t.Amount ?? 0m)) / billAmount <= 0.01m &&
        EF.Functions.TrigramsSimilarity(t.MerchantName.ToLower(), billName.NormalizeName()) > 0.5
        ||
        //Name, Amount, Category
        Math.Abs(billAmount - (t.Amount ?? 0m)) / billAmount <= 0.01m &&
        EF.Functions.TrigramsSimilarity(t.MerchantName.ToLower()!, billName.NormalizeName()) > 0.5 &&
        t.Category == billCategory
        ||
        //Amount, Category
        Math.Abs(billAmount - (t.Amount ?? 0m)) / billAmount <= 0.01m &&
        t.Category == billCategory
        ||
        //Change in bill amount(s)
        Math.Abs(billAmount - (t.Amount ?? 0m)) / billAmount <= 0.15m &&
        t.MerchantName.ToLower() == billName.NormalizeName())
        )
        .OrderByDescending(t => t.Date)
        .ToListAsync();

        return tx;
    }
    
    public async Task AddAsync(Bill bill, CancellationToken cancellationToken = default)
    {
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
