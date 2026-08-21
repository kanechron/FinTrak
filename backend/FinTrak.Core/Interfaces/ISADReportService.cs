using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface ISADReportService
{
    Task<SADReportResponseDto> GetSpendingAnomalies(Guid userId);
}