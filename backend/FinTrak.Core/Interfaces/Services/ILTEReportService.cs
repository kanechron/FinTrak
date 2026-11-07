using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces.Services;

public interface ILTEReportService
{
    Task<LTEForecastingResponseDto> GetLTEForecasting(Guid userId); 
}