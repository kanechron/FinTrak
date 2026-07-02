using AutoMapper;
using FinTrak.Api.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Mappings
{
    public class GoalProfile : Profile
    {
        public GoalProfile()
        {
            CreateMap<Account, LinkedAccountDto>()
                .ForMember(d => d.Name, opt => opt.MapFrom(a => a.OfficialName ?? a.Name));

            CreateMap<Goal, GoalDto>()
                .ForMember(d => d.IsCompleted, opt => opt.MapFrom(g => g.CompletedAt != null));
        }
    }
}
