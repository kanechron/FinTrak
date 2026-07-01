using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinTrak.Core.Entities;
using FinTrak.Core.Utilities;
using FinTrak.Infrastructure.BackgroundServices;
using static FinTrak.Infrastructure.BackgroundServices.TransactionNameMatchService;
using Anthropic.SDK;
using Anthropic.SDK.Constants;
using Anthropic.SDK.Messaging;
using System.Text.Json;
using FuzzySharp;
// using Anthropic.



namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;
        private readonly TransactionNameMatchService _tService;
        private readonly AnthropicClient _client;

        public TransactionsController(FinTrakDbContext db, TransactionNameMatchService tService, AnthropicClient client)
        {
            _db = db;
            _tService = tService;
            _client = client;
        }


        [HttpGet("get-transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int? offset, [FromQuery] int? limit)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var query = _db.Transactions
                .Where(t => t.DeletedAt == null && t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .Select(t => new
                {
                    id = t.Id,
                    accountId = t.AccountId,
                    date = t.Date!.Value.ToString("yyyy-MM-dd"),
                    merchant = t.MerchantName ?? t.MerchantNameRaw,
                    amount = t.Amount,
                    category = t.Category != null ? t.Category!.Name : "Uncategorized",
                    categoryDetailed = t.CategoryDetailed != null ? t.CategoryDetailed.Name : null,
                    categoryId = t.CategoryId,
                    categoryDetailedId = t.CategoryDetailedId,
                    pending = t.IsPending,
                });

                var transactions = (limit == null || limit == 0)
                    ? await query.ToListAsync()
                    : await query.Skip(offset ?? 0).Take(limit.Value).ToListAsync();

                return Ok(transactions);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve transactions.", detail = ex.Message });
            }
        }

        [HttpGet("get-transactions-by-category/{id}")]
        public async Task<IActionResult> GetTransactionsByCategory(Guid id)
        {
            try
            {
                var trans = await _db.Transactions
                .Where(t => t.DeletedAt == null && t.CategoryId == id)
                .OrderByDescending(t => t.Date)
                .Select(t => new
                {
                    id = t.Id,
                    accountId = t.AccountId,
                    date = t.Date!.Value.ToString("yyyy-MM-dd"),
                    merchant = t.MerchantName ?? t.MerchantNameRaw,
                    amount = t.Amount,
                    category = t.Category != null ? t.Category!.Name : "Uncategorized",
                    categoryDetailed = t.CategoryDetailed != null ? t.CategoryDetailed.Name : null,
                    categoryId = t.CategoryId,
                    categoryDetailedId = t.CategoryDetailedId,
                    pending = t.IsPending,

                })
                .ToListAsync();

                return Ok(trans);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve transactions with category {id}", detail = ex.Message });
            }
        }

        [HttpPost("add-transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] Transaction transaction)
        {
            try
            {
                if (transaction == null || transaction.Amount <= 0)
                {
                    return BadRequest(new { error = "Invalid Transaction data" });
                }
                var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());


                var newTrans = new Transaction
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    PlaidTransactionId = null,
                    Amount = transaction.Amount,
                    MerchantNameNormalized = transaction.MerchantName.NormalizeName(),
                    MerchantNameRaw = transaction.MerchantName,
                    MerchantName = transaction.MerchantName,
                    CategoryId = transaction.CategoryId,
                    CategoryDetailedId = transaction.CategoryDetailedId,
                    Description = transaction.Description,
                    IsPending = false,
                    IsManual = true,
                    DedupHash = transaction.DedupHash,
                    DedupStatus = transaction.DedupStatus,
                    CreatedAt = transaction.CreatedAt,
                    Date = transaction.Date
                };

                _db.Transactions.Add(newTrans);
                await _db.SaveChangesAsync();
                return Ok(new { message = "Transaction added successfully.", id = newTrans.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add transaction: ", detail = ex.Message });
            }
        }

        [HttpPatch("update-transaction/{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] Transaction update)
        {
            try
            {
                var existing = await _db.Transactions
                    .FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

                if (existing == null) return NotFound(new { error = "Transaction not found" });

                if (!string.IsNullOrWhiteSpace(update.MerchantName))
                    existing.MerchantName = update.MerchantName.NormalizeName();

                if (update.CategoryId.HasValue)
                    existing.CategoryId = update.CategoryId;

                existing.CategoryDetailedId = update.CategoryDetailedId;

                if (!string.IsNullOrWhiteSpace(update.Description))
                    existing.Description = update.Description;

                if (update.Amount.HasValue && update.Amount > 0)
                    existing.Amount = update.Amount;

                if (update.Date.HasValue)
                    existing.Date = update.Date;

                await _db.SaveChangesAsync();
                return Ok(new { message = "Transaction updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update transaction.", detail = ex.Message });
            }
        }


        [HttpPatch("apply-category-by-merchant")]
        public async Task<IActionResult> ApplyCategoryByMerchant([FromBody] ApplyCategoryRequest request)
        {
            try
            {
                var result = await _tService.TransactionMatchByName(request);


                return Ok(new { result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to apply category.", detail = ex.Message });
            }
        }

        [HttpDelete("delete-transaction/{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            try
            {
                var existing = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

                if (existing == null) return NotFound(new { error = "Could not find transaction {id}" });

                existing.DeletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(new { message = "Transaction deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete transaction.", detail = ex.Message });
            }

        }


        [HttpPost("import-pdf")]
        public async Task<IActionResult> ParsePDF([FromForm] IFormFile pdf)
        {
            if (pdf == null || pdf.Length == 0)
                return BadRequest(new { error = "No PDF file provided." });

            try
            {
                Console.WriteLine($"[PDF Import] Received file: {pdf.FileName}, size: {pdf.Length} bytes");
                var model = AnthropicModels.Claude45Haiku;
                var file = ConvertIFormFileToByteArray(pdf);
                Console.WriteLine($"[PDF Import] Converted to byte array: {file.Length} bytes");
                /*
                TODO:
                - Check PDF Requirements:
                    - Max request size of 32MB
                    - Max pages per request of 600 (100 for models with a 200k context window)
                    - Standard PDF (no passwords/encryption)
                */

                var allCategories = await _db.Categories.ToListAsync();
                var parentList = string.Join(", ", allCategories.Where(c => c.DetailId == null).Select(c => c.Name));
                var detailList = string.Join(", ", allCategories.Where(c => c.DetailId != null).Select(c => c.Name));


                var messageParams = new MessageParameters
                {
                    Model = model,
                    MaxTokens = 8192,
                    Messages = [
                        new Message
                        {
                            Role = RoleType.User,
                            Content = new List<ContentBase> {
                                new DocumentContent {
                                    Source = new DocumentSource {
                                        Type = SourceType.base64,
                                        MediaType = "application/pdf",
                                        Data = Convert.ToBase64String(file)
                                    }
                                },
                                new TextContent {Text = $"""
                                Extract all transactions from this bank statement and return them as a JSON array.
                                Each item must have these fields: date (YYYY-MM-DD), merchant (string), amount (decimal, positive for debits), category, categoryDetailed.
                                For category, use ONLY a value from this list of parent categories: {parentList}
                                For categoryDetailed, use ONLY a value from this list of subcategories: {detailList}
                                The categoryDetailed must be a subcategory that belongs to the chosen category.
                                Clean merchant names — remove store numbers, location codes, and state abbreviations (e.g. "Sheetz 0176 Knoxville MD" → "Sheetz", "McDonald's F2704 Catonsville MD" → "McDonald's").
                                Exclude zero-amount entries.
                                Return only the raw JSON array, no markdown formatting, no explanation.
                                """}
                            }
                        }
                    ]
                };

                Console.WriteLine("[PDF Import] Sending to Claude...");
                var response = await _client.Messages.GetClaudeMessageAsync(messageParams);
                var json = response.Content.OfType<TextContent>().First().Text.Trim();
                Console.WriteLine($"[PDF Import] Claude response length: {json.Length} chars");

                if (json.StartsWith("```"))
                {
                    var lines = json.Split('\n');
                    json = string.Join('\n', lines[1..^1]);
                }

                var imported = JsonSerializer.Deserialize<List<PdfTransaction>>(json, _jsonOptions);
                if (imported == null || imported.Count == 0)
                    return BadRequest(new { error = "No transactions found in PDF." });

                Console.WriteLine($"[PDF Import] Parsed {imported.Count} transactions from Claude response");

                var categoryCache = (await _db.Categories.ToListAsync()).ToDictionary(c => c.Name, c => c);
                var userId = GetUserId();

                foreach (var t in imported)
                {
                    Category? category = null;
                    if (!string.IsNullOrEmpty(t.Category))
                    {
                        if (!categoryCache.TryGetValue(t.Category, out category))
                        {
                            category = new Category { Id = Guid.NewGuid(), Name = t.Category, IsSystem = true };
                            _db.Categories.Add(category);
                            categoryCache[t.Category] = category;
                        }
                    }

                    Category? categoryDetailed = null;
                    if (!string.IsNullOrEmpty(t.CategoryDetailed))
                    {
                        if (!categoryCache.TryGetValue(t.CategoryDetailed, out categoryDetailed))
                        {
                            categoryDetailed = new Category { Id = Guid.NewGuid(), Name = t.CategoryDetailed, DetailId = category?.Id, IsSystem = true };
                            _db.Categories.Add(categoryDetailed);
                            categoryCache[t.CategoryDetailed] = categoryDetailed;
                        }
                    }

                    var normalizedName = t.Merchant.NormalizeName();
                    var parsedDate = DateOnly.Parse(t.Date);

                    // Exact amount within 3 days — skip immediately
                    var amountMatch = await _db.Transactions.AnyAsync(x =>
                        x.UserId == userId &&
                        x.Amount == t.Amount &&
                        x.Date >= parsedDate.AddDays(-3) &&
                        x.Date <= parsedDate.AddDays(3) &&
                        x.DeletedAt == null);

                    if (amountMatch)
                    {
                        Console.WriteLine($"[PDF Import] Skipping duplicate (amount match): {t.Merchant} on {t.Date} for ${t.Amount}");
                        continue;
                    }

                    // No amount match — check name similarity as a fallback
                    var nameMatches = await _db.Transactions
                        .Where(x => x.UserId == userId &&
                                    x.Date >= parsedDate.AddDays(-3) &&
                                    x.Date <= parsedDate.AddDays(3) &&
                                    x.DeletedAt == null)
                        .Select(x => x.MerchantName ?? x.MerchantNameNormalized ?? x.MerchantNameRaw)
                        .ToListAsync();

                    var nameDuplicate = false;
                    foreach (var name in nameMatches)
                    {
                        var ratio = Fuzz.Ratio(name ?? "", normalizedName);
                        var tokenScore = Fuzz.TokenSetRatio(name ?? "", normalizedName);
                        var score = Math.Max(ratio, tokenScore);
                        if (score >= 60)
                        {
                            Console.WriteLine($"[PDF Import] Skipping duplicate (name match {score}): '{t.Merchant}' vs '{name}' on {parsedDate} for ${t.Amount}");
                            nameDuplicate = true;
                            break;
                        }
                    }

                    if (nameDuplicate) continue;

                    _db.Transactions.Add(new Transaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = Guid.Empty,
                        Amount = t.Amount,
                        MerchantName = t.Merchant,
                        MerchantNameRaw = t.Merchant,
                        MerchantNameNormalized = normalizedName,
                        Date = parsedDate,
                        CategoryId = category?.Id,
                        CategoryDetailedId = categoryDetailed?.Id,
                        IsManual = true,
                        IsPending = false,
                        DedupStatus = DedupStatus.Accepted,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _db.SaveChangesAsync();
                Console.WriteLine($"[PDF Import] Done. Saved transactions to DB.");
                return Ok(new { imported = imported.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Could not parse PDF: " + ex.Message });
            }
        }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public byte[] ConvertIFormFileToByteArray(IFormFile file)
    {
        using var memoryStream = new MemoryStream();
        file.CopyTo(memoryStream);
        return memoryStream.ToArray();
    }

    }

    public record PdfTransaction(string Date, string Merchant, decimal Amount, string Category, string CategoryDetailed);

}