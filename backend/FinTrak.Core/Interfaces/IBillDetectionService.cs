namespace FinTrak.Core.Interfaces;

public interface IBillDetectionService
{
    Task<List<List<TransactionGroup>>> DetectAsync(CancellationToken cancellationToken = default);
}

public class TransactionGroup
{
    public string MerchantName { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<decimal?> Amounts { get; set; } = [];
    public List<DateOnly?> Dates { get; set; } = [];
    public string? Category { get; set; }
    public Guid? CategoryId { get; set; }
}
