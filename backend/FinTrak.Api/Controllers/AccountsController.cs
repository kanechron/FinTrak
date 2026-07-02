using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Api.DTOs;

namespace FinTrak.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class AccountsController(IAccountRepository repo, IMapper mapper) : ControllerBase
    {
        private readonly IAccountRepository _repo = repo;
        private readonly IMapper _mapper = mapper;

        [HttpGet("get-accounts")]
        public async Task<IActionResult> GetAccounts(CancellationToken cancellationToken)
        {
            var accounts = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            return Ok(_mapper.Map<List<AccountDto>>(accounts));
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
