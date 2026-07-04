using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Mappings
{
    public class BillProfile : Profile
    {
        public BillProfile()
        {
            CreateMap<Bill, BillDto>()
                .ForMember(d => d.Category, opt => opt.MapFrom(b => b.Category != null ? b.Category.Name : null))
                .ForMember(d => d.NextDueDate, opt => opt.MapFrom(b => ComputeNextDueDate(b)))
                .ForMember(d => d.IsAutoDetected, opt => opt.MapFrom(_ => false));
        }

        private static DateOnly? ComputeNextDueDate(Bill b)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return b.Frequency switch
            {
                BillFrequency.Custom => b.CustomDate,
                BillFrequency.Monthly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 1),
                BillFrequency.Quarterly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 3),
                BillFrequency.Yearly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 12),
                BillFrequency.Weekly => b.LastPaidDate?.AddDays(7) ?? today,
                BillFrequency.BiWeekly => b.LastPaidDate?.AddDays(14) ?? today,
                _ => null
            };
        }

        private static DateOnly NextOccurrence(DateOnly today, int dueDay, int monthInterval)
        {
            var candidate = new DateOnly(today.Year, today.Month, Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month)));
            if (candidate < today)
            {
                var next = today.AddMonths(monthInterval);
                candidate = new DateOnly(next.Year, next.Month, Math.Min(dueDay, DateTime.DaysInMonth(next.Year, next.Month)));
            }
            return candidate;
        }
    }
}
