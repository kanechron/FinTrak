using System.Threading.Channels;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces.Events;
using FinTrak.Core.Interfaces.Repositories;
using FinTrak.Core.Interfaces.Services;
using FinTrak.Core.Utilities;
using Going.Plaid;

namespace FinTrak.Infrastructure.Services;

public class PlaidSyncService(PlaidClient plaid, IPlaidSyncRepository repo, ICategoryRepository cRepo, ISyncRaceControlService syncCtrl, ITransactionRepository tRepo, IAccountRepository aRepo, Channel<IRuleTriggerEvent> channel) : IPlaidSyncService
{
    private readonly PlaidClient _plaid = plaid;
    private readonly IPlaidSyncRepository _repo = repo;
    private readonly ICategoryRepository _cRepo = cRepo;
    private readonly ISyncRaceControlService _syncCtrl = syncCtrl;
    private readonly ITransactionRepository _tRepo = tRepo;
    private readonly IAccountRepository _aRepo = aRepo;
    private readonly Channel<IRuleTriggerEvent> _channel = channel;


    public async Task<List<Guid>> SyncAsync(Guid userId, CancellationToken ct)
    {
        var items = await _repo.GetPlaidItems(userId, ct);

            var categoryCache = (await _cRepo.GetAllAsync(ct))
                .GroupBy(c => c.Name)
                .ToDictionary(g => g.Key, g => g.First());

            var result = new List<Guid>();
            foreach (var item in items)
            {
                using var _ = await _syncCtrl.AcquireAsync(item.Id, ct);
                result.AddRange(await SyncItemAsync(item, _plaid, categoryCache, ct));
            }
            await _tRepo.SaveAsync(ct);
            return result;
    }

    private async Task<List<Guid>> SyncItemAsync(PlaidItem item, PlaidClient plaid, Dictionary<string, Category> categoryCache, CancellationToken ct)
        {
            var cursor = item.TransactionCursor;
            var hasMore = true;
            var userId = item.UserId;

            List<Guid> transactionReturnObj = [];
            while (hasMore)
            {
                var response = await plaid.TransactionsSyncAsync(
                    new Going.Plaid.Transactions.TransactionsSyncRequest
                    {
                        AccessToken = item.AccessToken,
                        Cursor = cursor,
                        Options = new() { DaysRequested = 730 }
                    });

                if (response.Error != null)
                {
                    item.Status = FinTrak.Core.Entities.PlaidItemStatus.Error;
                    item.ErrorCode = response.Error.ErrorCode.ToString();
                    break;
                }


                var incomingTransactionIds = response.Added.Select(t => t.TransactionId).ToList();
                var existingTransactionsList = await _tRepo.GetIncomingTransactions(userId, incomingTransactionIds, ct);

                var existingTransactions = existingTransactionsList
                    .GroupBy(t => t.PlaidTransactionId!)
                    .ToDictionary(g => g.Key, g => g.First());


                var incomingAccountIds = response.Added.Select(t => t.AccountId).ToList();
                var accounts = await _aRepo.GetByPlaidAccountIdsAsync(userId, incomingAccountIds, ct);


                (Category? category, Category? categoryDetailed) ResolveCategories(string? name, Going.Plaid.Entity.PersonalFinanceCategory? personalFinanceCategory)
                {
                    var categoryName = name?.ToLower().Contains("deposit") == true
                        ? "INCOME"
                        : personalFinanceCategory?.Primary ?? string.Empty;
                    var detailedCategoryName = name?.ToLower().Contains("deposit") == true
                        ? string.Empty
                        : personalFinanceCategory?.Detailed ?? string.Empty;

                    Category? category = null;
                    if (!string.IsNullOrEmpty(categoryName))
                    {
                        if (!categoryCache.TryGetValue(categoryName, out category))
                        {
                            category = new Category { Id = Guid.NewGuid(), Name = categoryName, IsSystem = true };
                            _cRepo.Add(category);
                            categoryCache[categoryName] = category;
                        }
                    }

                    Category? categoryDetailed = null;
                    if (!string.IsNullOrEmpty(detailedCategoryName))
                    {
                        if (!categoryCache.TryGetValue(detailedCategoryName, out categoryDetailed))
                        {
                            categoryDetailed = new Category { Id = Guid.NewGuid(), Name = detailedCategoryName, DetailId = category?.Id, IsSystem = true };
                            _cRepo.Add(categoryDetailed);
                            categoryCache[detailedCategoryName] = categoryDetailed;
                        }
                    }

                    return (category, categoryDetailed);
                }

                // FinTrak Transaction.Ids (not Plaid's TransactionIds) touched on this page — handed to the rules engine after save.
                List<Guid> transactionList = [];

                // Handle added transactions
                foreach (var t in response.Added)
                {

                    existingTransactions.TryGetValue(t.TransactionId!, out var existing);

                    accounts.TryGetValue(t.AccountId!, out var account);

#pragma warning disable CS0612 // Type or member is obsolete
                    var (category, categoryDetailed) = ResolveCategories(t.Name, t.PersonalFinanceCategory);
#pragma warning restore CS0612 // Type or member is obsolete

                    if (existing != null)
                    {
#pragma warning disable CS0612 // Type or member is obsolete
                        existing.MerchantNameRaw = t.Name ?? string.Empty;
#pragma warning restore CS0612 // Type or member is obsolete
#pragma warning disable CS0612 // Type or member is obsolete

                        if (!existing.IsMerchantNameLocked)
                        {
                            existing.MerchantName = t.MerchantName ?? t.Name ?? string.Empty;
#pragma warning restore CS0612 // Type or member is obsolete
#pragma warning disable CS0612 // Type or member is obsolete
                            existing.MerchantNameNormalized = (t.MerchantName ?? t.Name ?? string.Empty).NormalizeName();
                        }
#pragma warning restore CS0612 // Type or member is obsolete
                        if (!existing.IsCategoryLocked)
                        {
                            existing.CategoryId = category?.Id;
                            existing.CategoryDetailedId = categoryDetailed?.Id;
                        }

                        transactionList.Add(existing.Id);
                    }
                    else
                    {
                        var newId = Guid.NewGuid();
                        transactionList.Add(newId);

#pragma warning disable CS0612 // Type or member is obsolete
                        _tRepo.Add(new FinTrak.Core.Entities.Transaction
                        {
                            Id = newId,
                            UserId = userId,
                            AccountId = account?.Id ?? Guid.Empty,
                            PlaidTransactionId = t.TransactionId,
                            Amount = t.Amount,
                            MerchantNameNormalized = (t.MerchantName ?? t.Name ?? string.Empty).NormalizeName(),
                            MerchantNameRaw = t.Name ?? string.Empty,
                            MerchantName = t.MerchantName ?? t.Name ?? string.Empty,
                            Date = t.AuthorizedDate ?? t.Date,
                            IsPending = t.Pending!.Value,
                            IsManual = false,
                            DedupStatus = FinTrak.Core.Entities.DedupStatus.Accepted,
                            CreatedAt = DateTime.UtcNow,
                            CategoryId = category?.Id,
                            CategoryDetailedId = categoryDetailed?.Id

                        });
#pragma warning restore CS0612 // Type or member is obsolete
                    }
                }


                var modifiedIds = response.Modified.Select(t => t.TransactionId).ToList();
                var existingModified = await _tRepo.GetByPlaidTransactionIdsAsync(userId, modifiedIds, ct);


                // Handle modified transactions
                foreach (var t in response.Modified)
                {
                    existingModified.TryGetValue(t.TransactionId!, out var existing);

                    if (existing == null) continue;

#pragma warning disable CS0612 // Type or member is obsolete
                    var (category, categoryDetailed) = ResolveCategories(t.Name, t.PersonalFinanceCategory);
#pragma warning restore CS0612 // Type or member is obsolete

                    existing.Amount = t.Amount;
                    existing.IsPending = t.Pending!.Value;

                    if (!existing.IsMerchantNameLocked)
                    {
#pragma warning disable CS0612 // Type or member is obsolete
                        existing.MerchantName = t.MerchantName ?? t.Name ?? string.Empty;
                        existing.MerchantNameNormalized = (t.MerchantName ?? t.Name ?? string.Empty).NormalizeName();
#pragma warning restore CS0612 // Type or member is obsolete
                    }

                    if (!existing.IsCategoryLocked)
                    {
                        existing.CategoryId = category?.Id;
                        existing.CategoryDetailedId = categoryDetailed?.Id;
                    }

                    transactionList.Add(existing.Id);
                }


                var removedIds = response.Removed.Select(t => t.TransactionId).ToList();
                var existingRemoved = await _tRepo.GetByPlaidTransactionIdsAsync(userId, removedIds, ct);

                // Handle removed transactions
                foreach (var t in response.Removed)
                {
                    existingRemoved.TryGetValue(t.TransactionId!, out var existing);

                    if (existing != null)
                        existing.DeletedAt = DateTime.UtcNow;
                }

                await _tRepo.SaveAsync(ct);

                //`transactionList` needs to be returned to the listener for the background service
                _channel.Writer.TryWrite(new SyncCompletedEvent(userId, transactionList, DateTime.UtcNow));
                transactionReturnObj.AddRange(transactionList);
                cursor = response.NextCursor;
                hasMore = response.HasMore;
            }

            item.TransactionCursor = cursor;
            item.LastSyncedAt = DateTime.UtcNow;

            // Refresh account balances
            var balanceResponse = await plaid.AccountsGetAsync(
                new Going.Plaid.Accounts.AccountsGetRequest
                {
                    AccessToken = item.AccessToken
                });




            // Handle accounts and balances
            if (balanceResponse.Error == null)
            {
                var balanceAccountIds = balanceResponse.Accounts.Select(a => a.AccountId).ToList();
                var existingBalanceAccounts = await _aRepo.GetByPlaidAccountIdsAsync(userId, balanceAccountIds, ct);

                foreach (var a in balanceResponse.Accounts)
                {
                    existingBalanceAccounts.TryGetValue(a.AccountId, out var account);

                    if (account == null)
                    {
                        _aRepo.Add(new FinTrak.Core.Entities.Account
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            PlaidItemId = item.Id,
                            PlaidAccountId = a.AccountId,
                            Name = a.Name,
                            OfficialName = a.OfficialName,
                            Mask = a.Mask ?? string.Empty,
                            Type = a.Type switch
                            {
                                Going.Plaid.Entity.AccountType.Depository => Core.Entities.AccountType.Depository,
                                Going.Plaid.Entity.AccountType.Credit => FinTrak.Core.Entities.AccountType.Credit,
                                Going.Plaid.Entity.AccountType.Loan => FinTrak.Core.Entities.AccountType.Loan,
                                Going.Plaid.Entity.AccountType.Investment => FinTrak.Core.Entities.AccountType.Investment,
                                _ => FinTrak.Core.Entities.AccountType.Depository
                            },
                            Subtype = a.Subtype?.ToString(),
                            CurrentBalance = (decimal?)a.Balances.Current,
                            AvailableBalance = (decimal?)a.Balances.Available,
                            BalanceLastUpdated = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        account.CurrentBalance = (decimal?)a.Balances.Current;
                        account.AvailableBalance = (decimal?)a.Balances.Available;
                        account.BalanceLastUpdated = DateTime.UtcNow;
                    }
                }
            }
            return transactionReturnObj;
        }
}