using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Mappings;

public class AccountProfile : Profile
{
    public AccountProfile()
    {
        CreateMap<Account, AccountDto>()
            .ForMember(d => d.Name, opt => opt.MapFrom(a => a.OfficialName ?? a.Name))
            .ForMember(d => d.Type, opt => opt.MapFrom(a => a.Subtype ?? a.Type.ToString()))
            .ForMember(d => d.Last4, opt => opt.MapFrom(a => a.Mask))
            .ForMember(d => d.Balance, opt => opt.MapFrom(a => a.AvailableBalance ?? 0));
    }
}
