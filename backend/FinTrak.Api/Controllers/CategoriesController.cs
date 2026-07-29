using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;

namespace FinTrak.Api.Controllers
{
    public class CategoriesController(ICategoryRepository repo, IMapper mapper) : ApiBaseController
    {
        private readonly ICategoryRepository _repo = repo;
        private readonly IMapper _mapper = mapper;

        [HttpGet("get-categories")]
        public async Task<IActionResult> GetAllCategories(CancellationToken cancellationToken)
        {
            var categories = await _repo.GetAllAsync(cancellationToken);
            return Ok(_mapper.Map<List<CategoryDto>>(categories));
        }

        [HttpGet("get-categories-parents")]
        public async Task<IActionResult> GetParentsCategories(CancellationToken cancellationToken)
        {
            var categories = await _repo.GetParentsAsync(cancellationToken);
            return Ok(_mapper.Map<List<CategoryDto>>(categories));
        }
        
        [HttpGet("get-categories-detailed")]
        public async Task<IActionResult> GetDetailedCategories(CancellationToken cancellationToken)
        {
            var categories = await _repo.GetDetailedAsync(cancellationToken);
            return Ok(_mapper.Map<List<CategoryDto>>(categories));
        }
    }
}
