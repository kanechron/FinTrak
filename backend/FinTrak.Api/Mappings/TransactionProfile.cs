using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Mappings
{
    public class TransactionProfile : Profile
    {
        public TransactionProfile()
        {
            CreateMap<Transaction, TransactionDto>()
                .ForMember(d => d.Date, opt => opt.MapFrom(t => t.Date.HasValue ? t.Date.Value.ToString("yyyy-MM-dd") : ""))
                .ForMember(d => d.Merchant, opt => opt.MapFrom(t => t.MerchantName ?? t.MerchantNameRaw ?? ""))
                .ForMember(d => d.Category, opt => opt.MapFrom(t => t.Category != null ? t.Category.Name : "Uncategorized"))
                .ForMember(d => d.CategoryDetailed, opt => opt.MapFrom(t => t.CategoryDetailed != null ? t.CategoryDetailed.Name : null))
                .ForMember(d => d.Pending, opt => opt.MapFrom(t => t.IsPending));
        }
    }
}
