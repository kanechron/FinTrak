using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces.Services;

public interface ISADReportService
{
    Task<SADReportResponseDto> GetSpendingAnomaliesAsync(Guid userId);
}