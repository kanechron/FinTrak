using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;

namespace FinTrak.Api.Controllers
{
    public class AccountsController(IAccountRepository repo, IMapper mapper) : ApiBaseController
    {
        private readonly IAccountRepository _repo = repo;
        private readonly IMapper _mapper = mapper;

        [HttpGet("get-accounts")]
        public async Task<IActionResult> GetAccounts(CancellationToken cancellationToken)
        {
            var accounts = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            return Ok(_mapper.Map<List<AccountDto>>(accounts));
        }
    }
}
