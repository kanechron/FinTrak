using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;

namespace FinTrak.Infrastructure.Repositories;

public class BillRepository(FinTrakDbContext db) : IBillRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Bill>> GetByUserIdAsync(Guid userId) =>
        await _db.Bills
            .Where(b => b.DeletedAt == null && b.UserId == userId)
            .Include(b => b.Category)
            .ToListAsync();

    public async Task<Bill?> GetByIdAsync(Guid id) =>
        await _db.Bills.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null);

    public async Task AddAsync(Bill bill)
    {
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();
    }

    public async Task SaveAsync() => await _db.SaveChangesAsync();
}
