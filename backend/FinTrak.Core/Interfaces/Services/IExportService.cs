using FinTrak.Core.DTOs;

namespace FinTrak.Core.Interfaces
{
    public interface IExportService
    {
        byte[] ExportToCsv(List<CategorySpendingDto> data, string delimiter = ",");
        byte[] ExportToCsv(List<CategoryDetailSpendingDto> data, string delimiter = ",");
        byte[] ExportToCsv(List<MonthlySpendingDto> data, string delimiter = ",");
        byte[] ExportToCsv(List<CashFlowDto> data, string delimiter = ",");

        byte[] ExportToXlsx(List<CategorySpendingDto> data, DateOnly fromDate, DateOnly toDate);
        byte[] ExportToXlsx(List<CategoryDetailSpendingDto> data, DateOnly fromDate, DateOnly toDate);
        byte[] ExportToXlsx(List<MonthlySpendingDto> data, DateOnly fromDate, DateOnly toDate);
        byte[] ExportToXlsx(List<CashFlowDto> data, DateOnly fromDate, DateOnly toDate);
    }
}