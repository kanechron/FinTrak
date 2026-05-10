using FinTrak.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrak.Infrastructure.Persistance
{
    public class FinTrakDbContext(DbContextOptions<FinTrakDbContext> options) : DbContext(options)
    {

        public DbSet<User> Users => Set<User>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<PlaidItem> PlaidItems => Set<PlaidItem>();
        public DbSet<Account> Accounts => Set<Account>();
        public DbSet<Budget> Budgets => Set<Budget>();
        public DbSet<Goal> Goals => Set<Goal>();
        public DbSet<Bill> Bills => Set<Bill>();
        public DbSet<MerchantAlias> MerchantAliases => Set<MerchantAlias>();
        public DbSet<SyncQueue> SyncQueue => Set<SyncQueue>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Soft delete filters — exclude deleted records from all queries by default
            modelBuilder.Entity<Transaction>().HasQueryFilter(t => t.DeletedAt == null);
            modelBuilder.Entity<Account>().HasQueryFilter(a => a.DeletedAt == null);
            modelBuilder.Entity<PlaidItem>().HasQueryFilter(p => p.DeletedAt == null);
            modelBuilder.Entity<Budget>().HasQueryFilter(b => b.DeletedAt == null);
            modelBuilder.Entity<Goal>().HasQueryFilter(g => g.DeletedAt == null);
            modelBuilder.Entity<Bill>().HasQueryFilter(b => b.DeletedAt == null);

            // Unique indexes
            modelBuilder.Entity<User>().HasIndex(u => u.GoogleId).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<PlaidItem>().HasIndex(p => p.PlaidItemId).IsUnique();
            modelBuilder.Entity<Account>().HasIndex(a => a.PlaidAccountId).IsUnique();
            modelBuilder.Entity<Transaction>().HasIndex(t => t.PlaidTransactionId);
            modelBuilder.Entity<Transaction>().HasIndex(t => t.DedupHash);
            modelBuilder.Entity<MerchantAlias>().HasIndex(m => m.RawName).IsUnique();

            // Enum storage — store as string for readability in the database
            modelBuilder.Entity<Transaction>()
                .Property(t => t.DedupStatus)
                .HasConversion<string>();

            modelBuilder.Entity<PlaidItem>()
                .Property(p => p.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Budget>()
                .Property(b => b.Period)
                .HasConversion<string>();

            modelBuilder.Entity<Bill>()
                .Property(b => b.Frequency)
                .HasConversion<string>();

            modelBuilder.Entity<MerchantAlias>()
                .Property(m => m.Source)
                .HasConversion<string>();

            modelBuilder.Entity<Account>()
                .Property(a => a.Type)
                .HasConversion<string>();

            modelBuilder.Entity<SyncQueue>()
                .Property(s => s.Status)
                .HasConversion<string>();
        }
    }
}
