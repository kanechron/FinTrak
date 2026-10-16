using FinTrak.Core.Entities;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;

namespace FinTrak.Infrastructure.Persistance
{
    /// <summary>
    /// Primary EF Core database context for FinTrak.
    /// Configures all entity sets, soft delete global query filters, unique indexes,
    /// and enum-as-string storage conventions.
    /// </summary>
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
        public DbSet<Invite> Invites => Set<Invite>();
        public DbSet<MerchantAlias> MerchantAliases => Set<MerchantAlias>();
        public DbSet<SyncQueue> SyncQueue => Set<SyncQueue>();
        public DbSet<Rule> Rules => Set<Rule>();
        public DbSet<TransactionExclusion> TransactionExclusions => Set<TransactionExclusion>();


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Soft delete filters — exclude deleted records from all queries by default
            modelBuilder.Entity<Transaction>().HasQueryFilter(t => t.DeletedAt == null);
            modelBuilder.Entity<Account>().HasQueryFilter(a => a.DeletedAt == null);
            modelBuilder.Entity<PlaidItem>().HasQueryFilter(p => p.DeletedAt == null);
            modelBuilder.Entity<Budget>().HasQueryFilter(b => b.DeletedAt == null);
            modelBuilder.Entity<Goal>()
            .HasQueryFilter(g => g.DeletedAt == null)
            .HasMany(g => g.LinkedAccounts)
            .WithMany(a => a.LinkedGoals)
            .UsingEntity(j => j.ToTable("GoalAccounts"))
            .HasIndex(g => new { g.UserId, g.Priority}).IsUnique()
            .HasFilter("\"DeletedAt\" IS NULL");
            modelBuilder.Entity<Bill>().HasQueryFilter(b => b.DeletedAt == null);
            modelBuilder.Entity<Invite>().HasQueryFilter(i => i.UsedAt == null);
            modelBuilder.Entity<User>().HasQueryFilter(u => u.DeletedAt == null);
            modelBuilder.Entity<Rule>().HasQueryFilter(r => r.DeletedAt == null);

            // Unique indexes
            modelBuilder.Entity<User>().HasIndex(u => u.GoogleId).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<PlaidItem>().HasIndex(p => p.PlaidItemId).IsUnique();
            modelBuilder.Entity<Account>().HasIndex(a => a.PlaidAccountId).IsUnique();
            modelBuilder.Entity<Transaction>().HasIndex(t => t.PlaidTransactionId);
            modelBuilder.Entity<Transaction>().HasIndex(t => t.DedupHash);
            modelBuilder.Entity<MerchantAlias>().HasIndex(m => m.RawName).IsUnique();
            modelBuilder.Entity<Invite>().HasIndex(i => i.Token);
            modelBuilder.Entity<Category>().HasIndex(i => i.DetailId);
            modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();
            modelBuilder.Entity<Rule>().HasIndex(r => new { r.UserId, r.Target, r.Priority}).IsUnique().HasFilter("\"DeletedAt\" IS NULL");
            // One receipt per source per transaction. Also serves "delete all receipts for this source" lookups.
            // (TransactionId gets its own index automatically as a foreign key, for "what else excludes this transaction?")
            modelBuilder.Entity<TransactionExclusion>().HasIndex(e => new { e.SourceType, e.SourceId, e.TransactionId }).IsUnique();

            // Relationships
            // Cascade so receipts disappear when DbDeleteService hard-deletes a transaction after its retention period.
            modelBuilder.Entity<TransactionExclusion>()
                .HasOne(e => e.Transaction)
                .WithMany()
                .HasForeignKey(e => e.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

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

            modelBuilder.Entity<Rule>()
                .Property(r => r.Target)
                .HasConversion<string>();
            
            modelBuilder.Entity<Rule>()
                .Property(r => r.Trigger)
                .HasConversion<string>();

            modelBuilder.Entity<Rule>()
                .Property(r => r.Kind)
                .HasConversion<string>();

            modelBuilder.Entity<TransactionExclusion>()
                .Property(e => e.SourceType)
                .HasConversion<string>();

            // Deliberately NOT stored as strings: TransactionExclusion.Flags and Transaction.Exclusions are
            // [Flags] enums that queries filter with bitwise checks (HasFlag / bit_or), which only work on integers.

            //JSON storage
            modelBuilder.Entity<Rule>()
                .OwnsMany(r => r.Conditions, c => c.ToJson());

            modelBuilder.Entity<Rule>()
                .OwnsMany(r => r.Actions, a => a.ToJson());
        }
    }
}
