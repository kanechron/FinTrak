using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Entities;
using Anthropic.SDK;
using FinTrak.Core.Interfaces;
using System.Text.Json;
using Anthropic.SDK.Messaging;
using Anthropic.SDK.Constants;
using FuzzySharp;
using FinTrak.Core.Utilities;

namespace FinTrak.Infrastructure.Services
{
    public class PdfImportService : IPdfImportService
    {
        private readonly FinTrakDbContext _db;
        private readonly AnthropicClient _client;
        public PdfImportService(FinTrakDbContext db, AnthropicClient client)
        {
            _db = db;
            _client = client;

        }
        public async Task<int> ImportAsync(Stream pdf, Guid userId, CancellationToken cancellationToken = default)
        {
            if (pdf == null || pdf.Length == 0)
                return 0;

            var model = AnthropicModels.Claude45Haiku;
            var file = ReadStream(pdf);

            var allCategories = await _db.Categories.ToListAsync(cancellationToken);
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
                        Content = [
                            new DocumentContent {
                                Source = new DocumentSource {
                                    Type = SourceType.base64,
                                    MediaType = "application/pdf",
                                    Data = Convert.ToBase64String(file)
                                }
                            },
                            new TextContent {Text = $"""
                            Extract all transactions from this bank statement and return them as a JSON array.
                            Each item must have these fields: date (YYYY-MM-DD), merchant (string), amount (decimal, positive for debits/expenses, negative for credits/income), category, categoryDetailed.
                            For category, use ONLY a value from this list of parent categories: {parentList}
                            For categoryDetailed, use ONLY a value from this list of subcategories: {detailList}
                            The categoryDetailed must be a subcategory that belongs to the chosen category.
                            Clean merchant names — remove store numbers, location codes, and state abbreviations (e.g. "Sheetz 0176 Knoxville MD" → "Sheetz", "McDonald's F2704 Catonsville MD" → "McDonald's").
                            Exclude zero-amount entries.
                            Any transactions marked as income need to have a negative sign.
                            Return only the raw JSON array, no markdown formatting, no explanation.
                            """}
                        ]
                    }
                ]
            };

            var response = await _client.Messages.GetClaudeMessageAsync(messageParams, cancellationToken);
            var json = response.Content.OfType<TextContent>().First().Text.Trim();

            if (json.StartsWith("```"))
            {
                var lines = json.Split('\n');
                json = string.Join('\n', lines[1..^1]);
            }

            var imported = JsonSerializer.Deserialize<List<PdfTransaction>>(json, _jsonOptions);
            if (imported == null || imported.Count == 0)
                return 0;

            var categoryCache = (await _db.Categories.ToListAsync(cancellationToken)).ToDictionary(c => c.Name, c => c);

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

                var amountMatch = await _db.Transactions.AnyAsync(x =>
                    x.UserId == userId &&
                    x.Amount == t.Amount &&
                    x.Date >= parsedDate.AddDays(-3) &&
                    x.Date <= parsedDate.AddDays(3) &&
                    x.DeletedAt == null, cancellationToken);

                if (amountMatch) continue;

                var nameMatches = await _db.Transactions
                    .Where(x => x.UserId == userId &&
                                x.Date >= parsedDate.AddDays(-3) &&
                                x.Date <= parsedDate.AddDays(3) &&
                                x.DeletedAt == null)
                    .Select(x => x.MerchantName ?? x.MerchantNameNormalized ?? x.MerchantNameRaw)
                    .ToListAsync(cancellationToken);

                var nameDuplicate = false;
                foreach (var name in nameMatches)
                {
                    var score = Math.Max(Fuzz.Ratio(name ?? "", normalizedName), Fuzz.TokenSetRatio(name ?? "", normalizedName));
                    if (score >= 60) { nameDuplicate = true; break; }
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

            await _db.SaveChangesAsync(cancellationToken);
            return imported.Count;
        }

        private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        private static byte[] ReadStream(Stream stream)
        {
            using var memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);
            return memoryStream.ToArray();
        }

        
        public record PdfTransaction(string Date, string Merchant, decimal Amount, string Category, string CategoryDetailed);
    }
}