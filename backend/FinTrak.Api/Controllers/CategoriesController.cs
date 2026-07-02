using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using FinTrak.Api.DTOs;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly FinTrakDbContext _db;
        private readonly IMapper _mapper;

        public CategoriesController(FinTrakDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("get-categories")]
        public IActionResult GetCategories()
        {
            try
            {
                var categories = _db.Categories.ToList();
                return Ok(_mapper.Map<List<CategoryDto>>(categories));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve categories.", detail = ex.Message });
            }
        }
    }
}
