
using System.Linq;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Persistance;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

namespace FinTrak.Infrastructure.Services
{
    
    public class DeleteUserAccountService(FinTrakDbContext db) : IAccountManagementService
    {
        private readonly FinTrakDbContext _db = db;
        
        public async Task<List<string>> GetAccessTokens(Guid userId, CancellationToken ct) => 
            await _db.PlaidItems
            .Where(p => p.UserId == userId)
            .Select(p => p.AccessToken)
            .ToListAsync(ct);

        

        public async Task<bool> DeleteAccount(Guid userId, CancellationToken ct)
        {
            if (!await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Id == userId)) return false;
            
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            await _db.Transactions.Where(t => t.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.Bills.Where(b => b.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.Budgets.Where(b => b.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.Goals.Where(g => g.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.RefreshTokens.Where(r => r.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.Invites.Where(i => i.UsedByUserId == userId).ExecuteDeleteAsync(ct);
            await _db.Accounts.Where(a => a.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.SyncQueue.Where(s => s.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.PlaidItems.Where(p => p.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync(ct);

            await tx.CommitAsync(ct);
            return true;
        }

        public async Task<bool> DeactivateAccount(Guid userId, CancellationToken ct)
        {
            if (!await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Id == userId)) return false;

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            await _db.Transactions
            .Where(t => t.UserId == userId && t.DeletedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.DeletedAt, DateTime.UtcNow), ct);

            await _db.Bills.Where(b => b.UserId == userId && b.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.DeletedAt, DateTime.UtcNow), ct);
            await _db.Budgets.Where(b => b.UserId == userId && b.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.DeletedAt, DateTime.UtcNow), ct);
            await _db.Goals.Where(g => g.UserId == userId && g.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(g => g.DeletedAt, DateTime.UtcNow), ct);
            await _db.RefreshTokens.Where(r => r.UserId == userId && r.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.RevokedAt, DateTime.UtcNow)
                    .SetProperty(r => r.RevokedReason, "account_deactivated"), ct);
            await _db.Accounts.Where(a => a.UserId == userId && a.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.DeletedAt, DateTime.UtcNow), ct);
            await _db.SyncQueue.Where(s => s.UserId == userId).ExecuteDeleteAsync(ct);
            await _db.PlaidItems.Where(p => p.UserId == userId && p.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.DeletedAt, DateTime.UtcNow), ct);

            await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.DeletedAt, DateTime.UtcNow), ct);

            await tx.CommitAsync(ct);
            return true;
        }
    }
}