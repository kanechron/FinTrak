using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces;

public interface ILTEReportService
{
    Task<LTEForecastingResponseDto> GetLTEForecasting(Guid userId); 
}