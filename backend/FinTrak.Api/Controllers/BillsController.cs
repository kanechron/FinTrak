
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.BackgroundServices;
using AutoMapper;
using FinTrak.Api.DTOs;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class BillsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;
        private readonly BillDetectionService _billDetectionService;
        private readonly IMapper _mapper;

        public BillsController(FinTrakDbContext db, BillDetectionService billDetectionService, IMapper mapper)
        {
            _db = db;
            _billDetectionService = billDetectionService;
            _mapper = mapper;
        }

        [HttpGet("get-bills")]
        public async Task<IActionResult> GetBills()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var bills = await _db.Bills
                    .Where(b => b.DeletedAt == null && b.UserId == userId)
                    .Include(b => b.Category)
                    .ToListAsync();

                return Ok(_mapper.Map<List<BillDto>>(bills));
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving bills: " + ex.Message);
            }
        }

        [HttpPost("add-bill")]
        public async Task<IActionResult> AddBill([FromBody] Bill bill)
        {
            try
            {
                if (bill == null || string.IsNullOrEmpty(bill.Name) || bill.Amount <= 0)
                    return BadRequest("Invalid bill data. Name and positive amount are required.");

                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var newBill = new Bill
                {
                    UserId = userId,
                    Name = bill.Name,
                    Amount = bill.Amount,
                    CategoryId = bill.CategoryId,
                    Frequency = bill.Frequency,
                    DueDay = bill.DueDay,
                    CustomDate = bill.CustomDate,
                    LastPaidDate = bill.LastPaidDate,
                    IsAutoPay = bill.IsAutoPay
                };

                _db.Bills.Add(newBill);
                await _db.SaveChangesAsync();
                return Ok(new { message = "Bill added successfully.", billId = newBill.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while adding the bill: " + ex.Message);
            }
        }

        [HttpPatch("update-bill/{id}")]
        public async Task<IActionResult> UpdateBill(Guid id, [FromBody] Bill updatedBill)
        {
            try
            {
                var existingBill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id);
                if (existingBill == null || existingBill.DeletedAt != null)
                    return NotFound("Bill not found.");

                existingBill.Name = updatedBill.Name ?? existingBill.Name;
                existingBill.Amount = updatedBill.Amount != 0 ? updatedBill.Amount : existingBill.Amount;
                existingBill.CategoryId = updatedBill.CategoryId != Guid.Empty ? updatedBill.CategoryId : existingBill.CategoryId;
                existingBill.Frequency = updatedBill.Frequency != 0 ? updatedBill.Frequency : existingBill.Frequency;
                existingBill.DueDay = updatedBill.DueDay ?? existingBill.DueDay;
                existingBill.CustomDate = updatedBill.CustomDate ?? existingBill.CustomDate;
                existingBill.LastPaidDate = updatedBill.LastPaidDate ?? existingBill.LastPaidDate;
                existingBill.IsAutoPay = updatedBill.IsAutoPay;

                await _db.SaveChangesAsync();
                return Ok(new { message = "Bill updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while updating the bill: " + ex.Message);
            }
        }

        [HttpDelete("delete-bill/{id}")]
        public async Task<IActionResult> DeleteBill(Guid id)
        {
            try
            {
                var existingBill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id);
                if (existingBill == null || existingBill.DeletedAt != null)
                    return NotFound("Bill not found.");

                existingBill.DeletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return Ok(new { message = "Bill deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting the bill: " + ex.Message);
            }
        }

        [HttpGet("get-suggestions")]
        public async Task<IActionResult> GetSuggestions()
        {
            var suggestions = await _billDetectionService.DetectAsync(CancellationToken.None);
            return Ok(suggestions);
        }
    }
}
