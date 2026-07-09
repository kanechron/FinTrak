using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces;
using AutoMapper;
using FinTrak.Core.DTOs;
using FinTrak.Api.Validation;
using Going.Plaid.User;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class BillsController(IBillRepository repo, IBillDetectionService billDetectionService, IMapper mapper, BillValidator validator) : ControllerBase
    {
        private readonly IBillRepository _repo = repo;
        private readonly IBillDetectionService _billDetectionService = billDetectionService;
        private readonly IMapper _mapper = mapper;
        private readonly BillValidator _validator = validator;

        [HttpGet("get-bills")]
        public async Task<IActionResult> GetBills(CancellationToken cancellationToken)
        {
            var bills = await _repo.GetByUserIdAsync(GetUserId(), cancellationToken);
            return Ok(_mapper.Map<List<BillDto>>(bills));
        }

        [HttpPost("add-bill")]
        public async Task<IActionResult> AddBill([FromBody] Bill bill, CancellationToken cancellationToken)
        {
            var validation = await _validator.ValidateAsync(bill, cancellationToken);
            if (!validation.IsValid)
                return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });

            var newBill = new Bill
            {
                UserId = GetUserId(),
                Name = bill.Name,
                Amount = bill.Amount,
                CategoryId = bill.CategoryId,
                Frequency = bill.Frequency,
                DueDay = bill.DueDay,
                CustomDate = bill.CustomDate,
                LastPaidDate = bill.LastPaidDate,
                IsAutoPay = bill.IsAutoPay,
                Status = bill.Status
            };
            
            await _repo.AddAsync(newBill, cancellationToken);
            return Ok(new { message = "Bill added successfully.", billId = newBill.Id });
        }

        [HttpPatch("update-bill/{id}")]
        public async Task<IActionResult> UpdateBill(Guid id, [FromBody] Bill updatedBill, CancellationToken cancellationToken)
        {
            var existingBill = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingBill == null) return NotFound("Bill not found.");
            if (existingBill.UserId != GetUserId()) return Forbid();

            existingBill.Name = !string.IsNullOrEmpty(updatedBill.Name) ? updatedBill.Name : existingBill.Name;
            existingBill.Amount = updatedBill.Amount != 0 ? updatedBill.Amount : existingBill.Amount;
            existingBill.CategoryId = updatedBill.CategoryId != Guid.Empty ? updatedBill.CategoryId : existingBill.CategoryId;
            existingBill.Frequency = updatedBill.Frequency != 0 ? updatedBill.Frequency : existingBill.Frequency;
            existingBill.Status = updatedBill.Status != 0 ? updatedBill.Status : existingBill.Status;
            existingBill.DueDay = updatedBill.DueDay ?? existingBill.DueDay;
            existingBill.CustomDate = updatedBill.CustomDate ?? existingBill.CustomDate;
            existingBill.LastPaidDate = updatedBill.LastPaidDate ?? existingBill.LastPaidDate;
            existingBill.IsAutoPay = updatedBill.IsAutoPay;

            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Bill updated successfully." });
        }

        [HttpDelete("delete-bill/{id}")]
        public async Task<IActionResult> DeleteBill(Guid id, CancellationToken cancellationToken)
        {
            var existingBill = await _repo.GetByIdAsync(id, cancellationToken);
            if (existingBill == null) return NotFound("Bill not found.");
            if (existingBill.UserId != GetUserId()) return Forbid();

            existingBill.DeletedAt = DateTime.UtcNow;
            await _repo.SaveAsync(cancellationToken);
            return Ok(new { message = "Bill deleted successfully." });
        }

        [HttpGet("get-suggestions")]
        public async Task<IActionResult> GetSuggestions(CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var suggestions = await _billDetectionService.DetectAsync(userId, cancellationToken);
            return Ok(suggestions);
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
