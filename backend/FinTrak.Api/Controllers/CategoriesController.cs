using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class CategoriesController(ICategoryRepository repo, IMapper mapper) : ControllerBase
    {
        private readonly ICategoryRepository _repo = repo;
        private readonly IMapper _mapper = mapper;

        [HttpGet("get-categories")]
        public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
        {
            var categories = await _repo.GetAllAsync(cancellationToken);
            return Ok(_mapper.Map<List<CategoryDto>>(categories));
        }
    }
}
