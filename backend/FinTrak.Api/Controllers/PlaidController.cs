using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FinTrak.Infrastructure.Persistance;
using System.Security.Claims;
using Going.Plaid;
using Microsoft.EntityFrameworkCore;


namespace FinTrak.Api.Controllers
{
    /// <summary>
    /// Handles Plaid bank integration.
    ///
    /// Flow summary:
    ///   1. POST /plaid/link-token      — creates a Plaid link token for the frontend Link UI
    ///   2. POST /plaid/exchange-token  — exchanges the public token from Link for a permanent access token
    ///   3. POST /plaid/sync            — syncs transactions for all linked items
    /// </summary>
    [ApiController]
    [Route("plaid")]
    [Authorize]
    public class PlaidController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public PlaidController(FinTrakDbContext db)
        {
            _db = db;
        }

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
        CountryCodes = [Going.Plaid.Entity.CountryCode.Us]
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

    foreach (var a in accountsResponse.Accounts)
    {
        _db.Accounts.Add(new FinTrak.Core.Entities.Account
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
/// Uses Plaid's cursor-based sync — only fetches changes since the last sync.
/// </summary>
[HttpPost("sync")]
public async Task<IActionResult> Sync([FromServices] PlaidClient plaid)
{
    var userId = GetUserId();
    var items = await _db.PlaidItems
        .Where(p => p.UserId == userId)
        .ToListAsync();

    foreach (var item in items)
    {
        var cursor = item.TransactionCursor;
        var hasMore = true;

        while (hasMore)
        {
            var response = await plaid.TransactionsSyncAsync(
                new Going.Plaid.Transactions.TransactionsSyncRequest
                {
                    AccessToken = item.AccessToken,
                    Cursor = cursor
                });

            if (response.Error != null)
            {
                item.Status = FinTrak.Core.Entities.PlaidItemStatus.Error;
                item.ErrorCode = response.Error.ErrorCode.ToString();
                break;
            }

            // Handle added transactions
            foreach (var t in response.Added)
            {
                var exists = await _db.Transactions
                    .AnyAsync(x => x.PlaidTransactionId == t.TransactionId);

                if (exists) continue;

                var account = await _db.Accounts
                    .FirstOrDefaultAsync(a => a.PlaidAccountId == t.AccountId);

                _db.Transactions.Add(new FinTrak.Core.Entities.Transaction
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountId = account?.Id ?? Guid.Empty,
                    PlaidTransactionId = t.TransactionId,
                    Amount = (decimal)t.Amount,
                    MerchantNameRaw = t.MerchantName ?? t.Name ?? string.Empty,
                    MerchantName = t.MerchantName ?? t.Name ?? string.Empty,
                    Date = (DateOnly)t.Date,
                    IsPending = (bool)t.Pending,
                    IsManual = false,
                    DedupStatus = FinTrak.Core.Entities.DedupStatus.Accepted,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Handle modified transactions
            foreach (var t in response.Modified)
            {
                var existing = await _db.Transactions
                    .FirstOrDefaultAsync(x => x.PlaidTransactionId == t.TransactionId);

                if (existing == null) continue;

                existing.Amount = (decimal)t.Amount;
                existing.IsPending = (bool)t.Pending;
                existing.MerchantName = t.MerchantName ?? t.Name ?? string.Empty;
            }

            // Handle removed transactions
            foreach (var t in response.Removed)
            {
                var existing = await _db.Transactions
                    .FirstOrDefaultAsync(x => x.PlaidTransactionId == t.TransactionId);

                if (existing != null)
                    existing.DeletedAt = DateTime.UtcNow;
            }

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

        if (balanceResponse.Error == null)
        {
            foreach (var a in balanceResponse.Accounts)
            {
                var account = await _db.Accounts
                    .FirstOrDefaultAsync(x => x.PlaidAccountId == a.AccountId);

                if (account == null) continue;

                account.CurrentBalance = (decimal?)a.Balances.Current;
                account.AvailableBalance = (decimal?)a.Balances.Available;
                account.BalanceLastUpdated = DateTime.UtcNow;
            }
        }
    }

    await _db.SaveChangesAsync();

    return Ok();
}


    }

    
}
