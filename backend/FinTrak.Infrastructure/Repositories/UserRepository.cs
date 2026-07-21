

using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Repositories
{
    
    public class UserRepostory(FinTrakDbContext db) : IAccountReactivationRepository
    {
        private readonly FinTrakDbContext _db = db;
        public async Task<User?> ReactivateAccount(Guid userId, CancellationToken ct)
        {
            var user = await _db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null || user.DeletedAt == null) return null;

            var deactivatedAt = user.DeletedAt.Value;

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            await _db.Transactions.IgnoreQueryFilters()
                .Where(t => t.UserId == userId && t.DeletedAt != null && t.DeletedAt >= deactivatedAt)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.DeletedAt, (DateTime?)null), ct);

            await _db.Bills.IgnoreQueryFilters()
                .Where(b => b.UserId == userId && b.DeletedAt != null && b.DeletedAt >= deactivatedAt)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.DeletedAt, (DateTime?)null), ct);

            await _db.Budgets.IgnoreQueryFilters()
                .Where(b => b.UserId == userId && b.DeletedAt != null && b.DeletedAt >= deactivatedAt)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.DeletedAt, (DateTime?)null), ct);

            await _db.Goals.IgnoreQueryFilters()
                .Where(g => g.UserId == userId && g.DeletedAt != null && g.DeletedAt >= deactivatedAt)
                .ExecuteUpdateAsync(s => s.SetProperty(g => g.DeletedAt, (DateTime?)null), ct);

            // Accounts and PlaidItems are deliberately NOT restored here. DeactivateAccount
            // always revokes the Plaid access token on the way out (see PlaidRevocation),
            // and Plaid has no "un-revoke" operation — so a reactivated PlaidItem would look
            // connected in the DB while being permanently dead underneath. Leaving them
            // soft-deleted means the user lands with zero accounts and goes through the
            // normal Sync -> Plaid Link flow to reconnect fresh, instead of seeing a bank
            // connection that fails the moment they try to use it.

            await _db.Users
                .IgnoreQueryFilters()
                .Where(u => u.Id == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.DeletedAt, (DateTime?)null), ct);

            await tx.CommitAsync(ct);
            user.DeletedAt = null;

            return user;
        }
    }
}