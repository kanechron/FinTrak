using FinTrak.Infrastructure.Persistance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly FinTrakDbContext _db;

        public CategoriesController(FinTrakDbContext db)
        {
            _db = db;
        }

        [HttpGet("get-categories")]
        public IActionResult GetCategories()
        {
            try
            {
                var categories = _db.Categories
                    // .Where(c => c.DeletedAt == null)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        // isActive = c.IsActive,
                        // createdAt = c.CreatedAt,
                        // deletedAt = c.DeletedAt,
                        // isSystem = c.IsSystem
                    })
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve categories.", detail = ex.Message });
            }
        }

    }
}