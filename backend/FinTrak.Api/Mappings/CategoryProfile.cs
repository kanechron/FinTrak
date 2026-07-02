using AutoMapper;
using FinTrak.Api.DTOs;
using FinTrak.Core.Entities;

namespace FinTrak.Api.Mappings
{
    public class CategoryProfile : Profile
    {
        public CategoryProfile()
        {
            CreateMap<Category, CategoryDto>();
        }
    }
}
