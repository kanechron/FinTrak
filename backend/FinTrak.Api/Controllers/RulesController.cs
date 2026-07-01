
using Microsoft.AspNetCore.Mvc;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RulesController : ControllerBase
    {
        


        [HttpPost("add-rule")]
        public async Task<IActionResult> AddRule()
        {
            try
            {
                return null;
            }
            catch(Exception ex)
            {
                return StatusCode(500, new {message="Cannot create rule: " + ex.Message});
            }
        }
    }
}