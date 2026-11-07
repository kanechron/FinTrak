using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface ISADReportService
{
    Task<SADReportResponseDto> GetSpendingAnomaliesAsync(Guid userId);
}