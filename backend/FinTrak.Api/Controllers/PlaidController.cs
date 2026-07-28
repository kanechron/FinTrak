using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FinTrak.Api.Utilities;
using FinTrak.Infrastructure.Persistance;
using System.Security.Claims;
using Going.Plaid;
using Microsoft.EntityFrameworkCore;
using FinTrak.Core.Entities;
using System.Text.RegularExpressions;
using FinTrak.Core.Utilities;
using Microsoft.AspNetCore.RateLimiting;
using System.Text.Json.Serialization;
using FinTrak.Core.Interfaces;
using FinTrak.Infrastructure.Services;

namespace FinTrak.Api.Controllers
{
    /// <summary>
    /// Handles Plaid bank integration.
    ///
    /// Flow summary:
    ///   1. POST /plaid/link-token      â€” creates a Plaid link token for the frontend Link UI
    ///   2. POST /plaid/exchange-token  â€” exchanges the public token from Link for a permanent access token
    ///   3. POST /plaid/sync            â€” syncs transactions for all linked items
    /// </summary>
    [ApiController]
    [Route("plaid")]
    [Authorize]
    public class PlaidController(FinTrakDbContext db, ISyncRaceControlService sync) : ControllerBase
    {
        private readonly FinTrakDbContext _db = db;
        private readonly ISyncRaceControlService _sync = sync;


        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


        /// <summary>
        /// Creates a Plaid link token for the frontend Link UI.
        /// The frontend passes this token to Plaid's Link widget to initiate the bank connection flow.
        /// </summary>
        [HttpPost("link-token")]
        public async Task<IActionResult> CreateLinkToken([FromServices] PlaidClient plaid)
        {
            var response = await plaid.LinkTokenCreateAsync(new Going.Plaid.Link.LinkTokenCreateRequest
            {
                User = new Going.Plaid.Entity.LinkTokenCreateRequestUser
                {
                    ClientUserId = GetUserId().ToString()
                },
                ClientName = "FinTrak",
                Products = [Going.Plaid.Entity.Products.Transactions],
                Language = Going.Plaid.Entity.Language.English,
                CountryCodes = [Going.Plaid.Entity.CountryCode.Us],
                Webhook = "https://fintrak.org/api/plaid/webhook",
                Transactions = new Going.Plaid.Entity.LinkTokenTransactions {DaysRequested = 730}

            });

            if (response.Error != null)
                return StatusCode(500, response.Error.ErrorMessage);

            return Ok(new { link_token = response.LinkToken });
        }


        /// <summary>
        /// Exchanges a public token from Plaid Link for a permanent access token.
        /// Creates a PlaidItem record and fetches the user's accounts from that institution.
        /// </summary>
        [HttpPost("exchange-token")]
        public async Task<IActionResult> ExchangeToken(
            [FromBody] ExchangeTokenRequest request,
            [FromServices] PlaidClient plaid)
        {
            // Exchange the short-lived public token for a permanent access token
            var exchangeResponse = await plaid.ItemPublicTokenExchangeAsync(
                new Going.Plaid.Item.ItemPublicTokenExchangeRequest
                {
                    PublicToken = request.PublicToken
                });

            if (exchangeResponse.Error != null)
                return StatusCode(500, exchangeResponse.Error.ErrorMessage);

            // Fetch institution details so we can store a human-readable name
            var itemResponse = await plaid.ItemGetAsync(
                new Going.Plaid.Item.ItemGetRequest
                {
                    AccessToken = exchangeResponse.AccessToken
                });

            var institutionName = itemResponse.Item.InstitutionId ?? "Unknown Institution";
 
            // If this already exists, don't create a duplicate
            var existingItem = await _db.PlaidItems
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.PlaidItemId == exchangeResponse.ItemId);
            if (existingItem != null)
                return Ok(new { message = "Bank already connected." });

            // Create the PlaidItem record
            var plaidItem = new FinTrak.Core.Entities.PlaidItem
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
                PlaidItemId = exchangeResponse.ItemId,
                AccessToken = exchangeResponse.AccessToken,
                InstitutionId = itemResponse.Item.InstitutionId ?? string.Empty,
                InstitutionName = institutionName,
                Status = FinTrak.Core.Entities.PlaidItemStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            _db.PlaidItems.Add(plaidItem);

            // Fetch and store the accounts under this item
            var accountsResponse = await plaid.AccountsGetAsync(
                new Going.Plaid.Accounts.AccountsGetRequest
                {
                    AccessToken = exchangeResponse.AccessToken
                });

            var incomingAccountIds = accountsResponse.Accounts.Select(a => a.AccountId).ToList();
            var existingAccounts = await _db.Accounts
            .IgnoreQueryFilters()
            .Where(acc => incomingAccountIds.Contains(acc.PlaidAccountId))
            .ToDictionaryAsync(acc => acc.PlaidAccountId);

            foreach (var a in accountsResponse.Accounts)
            {
                existingAccounts.TryGetValue(a.AccountId, out var existingAccount);
                if (existingAccount != null) continue;

                _db.Accounts.Add(new Account
                {
                    Id = Guid.NewGuid(),
                    UserId = GetUserId(),
                    PlaidItemId = plaidItem.Id,
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

            await _db.SaveChangesAsync();

            return Ok(new { item_id = plaidItem.Id });
        }
        public record ExchangeTokenRequest(string PublicToken);


        /// <summary>
        /// Syncs transactions for all of the user's linked Plaid items.
        /// Uses Plaid's cursor-based sync â€” only fetches changes since the last sync.
        /// </summary>
        [HttpPost("sync")]
        [EnableRateLimiting("expensive")]
        public async Task<IActionResult> Sync([FromServices] PlaidClient plaid, CancellationToken ct)
        {
            
            var userId = GetUserId();
            var items = await _db.PlaidItems
                .Where(p => p.UserId == userId)
                .ToListAsync(ct);

            var categoryCache = (await _db.Categories.ToListAsync())
                .GroupBy(c => c.Name)
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var item in items)
            {
                using var _ = await _sync.AcquireAsync(item.Id, ct);
                await SyncItemAsync(item, plaid, categoryCache, ct);
            }

            await _db.SaveChangesAsync(ct);

            return Ok();
        }

        private async Task SyncItemAsync(PlaidItem item, PlaidClient plaid, Dictionary<string, Category> categoryCache, CancellationToken ct)
        {
            var cursor = item.TransactionCursor;
            var hasMore = true;
            var userId = item.UserId;

            

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
                var existingTransactionsList = await _db.Transactions
                .IgnoreQueryFilters()
                .Where(trans => trans.UserId == userId && incomingTransactionIds.Contains(trans.PlaidTransactionId))
                .ToListAsync(ct);

            var existingTransactions = existingTransactionsList
                .GroupBy(t => t.PlaidTransactionId!)
                .ToDictionary(g => g.Key, g => g.First());


                var incomingAccountIds = response.Added.Select(t => t.AccountId).ToList();
                var accounts = await _db.Accounts
                    .Where(a => a.UserId == userId && incomingAccountIds.Contains(a.PlaidAccountId))
                    .ToDictionaryAsync(a => a.PlaidAccountId, ct);


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
                            _db.Categories.Add(category);
                            categoryCache[categoryName] = category;
                        }
                    }

                    Category? categoryDetailed = null;
                    if (!string.IsNullOrEmpty(detailedCategoryName))
                    {
                        if (!categoryCache.TryGetValue(detailedCategoryName, out categoryDetailed))
                        {
                            categoryDetailed = new Category { Id = Guid.NewGuid(), Name = detailedCategoryName, DetailId = category?.Id, IsSystem = true };
                            _db.Categories.Add(categoryDetailed);
                            categoryCache[detailedCategoryName] = categoryDetailed;
                        }
                    }

                    return (category, categoryDetailed);
                }

                // Handle added transactions
                foreach (var t in response.Added)
                {

                    existingTransactions.TryGetValue(t.TransactionId!, out var existing);

                    accounts.TryGetValue(t.AccountId!, out var account);

                    var (category, categoryDetailed) = ResolveCategories(t.Name, t.PersonalFinanceCategory);

                    if (existing != null)
                    {
                        existing.MerchantNameRaw = t.Name ?? string.Empty;
                        existing.MerchantName = t.MerchantName ?? t.Name ?? string.Empty;
                        existing.MerchantNameNormalized = (t.MerchantName ?? t.Name ?? string.Empty).NormalizeName();
                        existing.CategoryId = category?.Id;
                        existing.CategoryDetailedId = categoryDetailed?.Id;
                    }
                    else
                    {
                        _db.Transactions.Add(new FinTrak.Core.Entities.Transaction
                        {
                            Id = Guid.NewGuid(),
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
                    }
                }


                var modifiedIds = response.Modified.Select(t => t.TransactionId).ToList();
                var existingModified = await _db.Transactions
                    .Where(t => t.UserId == userId && modifiedIds.Contains(t.PlaidTransactionId))
                    .ToDictionaryAsync(t => t.PlaidTransactionId!);


                // Handle modified transactions
                foreach (var t in response.Modified)
                {
                    existingModified.TryGetValue(t.TransactionId!, out var existing);

                    if (existing == null) continue;

                    var (category, categoryDetailed) = ResolveCategories(t.Name, t.PersonalFinanceCategory);

                    existing.Amount = t.Amount;
                    existing.IsPending = t.Pending!.Value;
                    existing.MerchantName = t.MerchantName ?? t.Name ?? string.Empty;
                    existing.MerchantNameNormalized = (t.MerchantName ?? t.Name ?? string.Empty).NormalizeName();
                    existing.CategoryId = category?.Id;
                    existing.CategoryDetailedId = categoryDetailed?.Id;
                }


                var removedIds = response.Removed.Select(t => t.TransactionId).ToList();
                var existingRemoved = await _db.Transactions
                    .Where(t => t.UserId == userId && removedIds.Contains(t.PlaidTransactionId))
                    .ToDictionaryAsync(t => t.PlaidTransactionId!);

                // Handle removed transactions
                foreach (var t in response.Removed)
                {
                    existingRemoved.TryGetValue(t.TransactionId!, out var existing);

                    if (existing != null)
                        existing.DeletedAt = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync(ct);

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
                var existingBalanceAccounts = await _db.Accounts
                    .Where(a => a.UserId == userId && balanceAccountIds.Contains(a.PlaidAccountId))
                    .ToDictionaryAsync(a => a.PlaidAccountId);

                foreach (var a in balanceResponse.Accounts)
                {
                    existingBalanceAccounts.TryGetValue(a.AccountId, out var account);

                    if (account == null)
                    {
                        _db.Accounts.Add(new FinTrak.Core.Entities.Account
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
        }

        /// <summary>
        /// Lists the user's connected banks (Plaid items).
        /// </summary>
        [HttpGet("items")]
        public async Task<IActionResult> GetItems(CancellationToken ct)
        {
            var items = await _db.PlaidItems
                .Where(p => p.UserId == GetUserId())
                .Select(p => new { id = p.Id, institutionName = p.InstitutionName, status = p.Status.ToString() })
                .ToListAsync(ct);

            return Ok(items);
        }

        /// <summary>
        /// Unlinks a connected bank. Revokes the Plaid access token (tolerating an
        /// already-revoked item) and soft-deletes the PlaidItem and its Accounts.
        /// </summary>
        [HttpDelete("unlink/{plaidItemId}")]
        public async Task<IActionResult> UnlinkItem(Guid plaidItemId, [FromServices] PlaidClient plaid, CancellationToken ct)
        {
            var userId = GetUserId();
            var item = await _db.PlaidItems.FirstOrDefaultAsync(p => p.Id == plaidItemId && p.UserId == userId, ct);
            if (item == null) return NotFound(new { error = "Bank connection not found" });

            await PlaidRevocation.RevokeItemAsync(plaid, item.AccessToken);

            await _db.Accounts
                .Where(a => a.PlaidItemId == item.Id && a.DeletedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.DeletedAt, DateTime.UtcNow), ct);

            await _db.SyncQueue
                .Where(s => s.PlaidItemId == item.Id)
                .ExecuteDeleteAsync(ct);

            item.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok();
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook([FromBody] PlaidWebhookPayload payload, [FromServices] PlaidClient plaid, CancellationToken ct)
        {
            if (payload.WebhookType != "TRANSACTIONS") return Ok();
            if (payload.WebhookCode is not ("INITIAL_UPDATE" or "HISTORICAL_UPDATE" or "SYNC_UPDATES_AVAILABLE")) return Ok();

            var item = await _db.PlaidItems.FirstOrDefaultAsync(p => p.PlaidItemId == payload.ItemId, ct);
            if (item == null) return Ok();

            var categoryCache = (await _db.Categories.ToListAsync(ct))
                .ToDictionary(c => c.Name, c => c);
            using var _ = await _sync.AcquireAsync(item!.Id, ct);
            await SyncItemAsync(item!, plaid, categoryCache, ct);

            return Ok();
        }

        [HttpPost("update-webhook")]
        public async Task<IActionResult> UpdateWebhook([FromServices] PlaidClient plaid, CancellationToken ct)
        {
            var items = await _db.PlaidItems.Where(p => p.UserId == GetUserId()).ToListAsync(ct);
            
            foreach (var item in items)
            {
                await plaid.ItemWebhookUpdateAsync(new Going.Plaid.Item.ItemWebhookUpdateRequest
                {
                    AccessToken = item.AccessToken,
                    Webhook = "https://fintrak.org/api/plaid/webhook"
                });
            }
            
            return Ok();
        }


        public record PlaidWebhookPayload(
        [property: JsonPropertyName("webhook_type")] string WebhookType,
        [property: JsonPropertyName("webhook_code")] string WebhookCode,
        [property: JsonPropertyName("item_id")] string ItemId
        );

    }
}
