using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories;

public class BillRepository(FinTrakDbContext db) : IBillRepository
{
    private readonly FinTrakDbContext _db = db;

    public async Task<List<Bill>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _db.Bills
            .Where(b => b.DeletedAt == null && b.UserId == userId && b.Status != BillStatus.Declined)
            .Include(b => b.Category)
            .ToListAsync(cancellationToken);

    public async Task<Bill?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _db.Bills.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null && b.Status != BillStatus.Declined, cancellationToken);

    public async Task AddAsync(Bill bill, CancellationToken cancellationToken = default)
    {
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default) =>
        await _db.SaveChangesAsync(cancellationToken);
}
