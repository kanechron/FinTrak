using FinTrak.Core.DTOs;
using FinTrak.Core.Interfaces;
using MiniExcelLibs;
using System.ComponentModel;
using System.Text;

namespace FinTrak.Infrastructure.Services
{

    public class ExportService : IExportService
    {

        // ---------------------------------------------------------------------
        // Export to CSV
        // ---------------------------------------------------------------------
        public byte[] ExportToCsv(List<CategorySpendingDto> data, string delimiter)
        {
            if (data.Count == 0) return null!;

            var props = TypeDescriptor.GetProperties(typeof(CategorySpendingDto))
            .Cast<PropertyDescriptor>()
            .ToList();

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(delimiter, props.Select(p => p.Name)));

            foreach (var item in data)
            {
                var values = props.Select(p =>
                {
                    var val = p.GetValue(item);
                    return val == null ? string.Empty : val.ToString();
                });
                sb.AppendLine(string.Join(delimiter, values));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
        public byte[] ExportToCsv(List<CategoryDetailSpendingDto> data, string delimiter)
        {
            if (data.Count == 0) return null!;

            var props = TypeDescriptor.GetProperties(typeof(CategorySpendingDto))
            .Cast<PropertyDescriptor>()
            .ToList();

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(delimiter, props.Select(p => p.Name)));

            foreach (var item in data)
            {
                var values = props.Select(p =>
                {
                    var val = p.GetValue(item);
                    return val == null ? string.Empty : val.ToString();
                });
                sb.AppendLine(string.Join(delimiter, values));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
        public byte[] ExportToCsv(List<MonthlySpendingDto> data, string delimiter)
        {
            if (data.Count == 0) return null!;

            var props = TypeDescriptor.GetProperties(typeof(CategorySpendingDto))
            .Cast<PropertyDescriptor>()
            .ToList();

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(delimiter, props.Select(p => p.Name)));

            foreach (var item in data)
            {
                var values = props.Select(p =>
                {
                    var val = p.GetValue(item);
                    return val == null ? string.Empty : val.ToString();
                });
                sb.AppendLine(string.Join(delimiter, values));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
        public byte[] ExportToCsv(List<CashFlowDto> data, string delimiter)
        {
            if (data.Count == 0) return null!;

            var props = TypeDescriptor.GetProperties(typeof(CategorySpendingDto))
            .Cast<PropertyDescriptor>()
            .ToList();

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(delimiter, props.Select(p => p.Name)));

            foreach (var item in data)
            {
                var values = props.Select(p =>
                {
                    var val = p.GetValue(item);
                    return val == null ? string.Empty : val.ToString();
                });
                sb.AppendLine(string.Join(delimiter, values));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        // ---------------------------------------------------------------------
        // Export to Excel Worksheet
        // ---------------------------------------------------------------------
        public byte[] ExportToXlsx(List<CategorySpendingDto> data, DateOnly fromDate, DateOnly toDate)
        {
            using var ms = new MemoryStream();
            ms.SaveAs(data, sheetName: $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}");
            return ms.ToArray();
        }
        public byte[] ExportToXlsx(List<CategoryDetailSpendingDto> data, DateOnly fromDate, DateOnly toDate)
        {
            using var ms = new MemoryStream();
            ms.SaveAs(data, sheetName: $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}");
            return ms.ToArray();
        }
        public byte[] ExportToXlsx(List<MonthlySpendingDto> data, DateOnly fromDate, DateOnly toDate)
        {
            using var ms = new MemoryStream();
            ms.SaveAs(data, sheetName: $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}");
            return ms.ToArray();
        }
        public byte[] ExportToXlsx(List<CashFlowDto> data, DateOnly fromDate, DateOnly toDate)
        {
            using var ms = new MemoryStream();
            ms.SaveAs(data, sheetName: $"{fromDate:yyyy-MM-dd}_{toDate:yyyy-MM-dd}");
            return ms.ToArray();
        }
    }
}