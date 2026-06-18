
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinTrak.Infrastructure.Persistance;
using FinTrak.Core.Entities;
using FinTrak.Infrastructure.BackgroundServices;

namespace FinTrak.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class BillsController : ControllerBase
    {
        private readonly FinTrakDbContext _db;
        private readonly BillDetectionService _billDetectionService;

        public BillsController(FinTrakDbContext db, BillDetectionService billDetectionService)
        {
            _db = db;
            _billDetectionService = billDetectionService;
        }

        [HttpGet("get-bills")]
        public async Task<IActionResult> GetBills()
        {
            try
            {
                var bills = await _db.Bills
                    .Where(b => b.DeletedAt == null)
                    .Include(b => b.Category)
                    .ToListAsync();

                var result = bills.Select(b => new
                {
                    id = b.Id,
                    name = b.Name,
                    amount = b.Amount,
                    categoryId = b.CategoryId,
                    category = b.Category?.Name,
                    frequency = b.Frequency.ToString(),
                    dueDay = b.DueDay,
                    customDate = b.CustomDate,
                    lastPaidDate = b.LastPaidDate,
                    nextDueDate = ComputeNextDueDate(b),
                    isAutoPay = b.IsAutoPay,
                    isAutoDetected = false
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log the exception (not implemented here)
                return StatusCode(500, "An error occurred while retrieving bills: " + ex.Message);
            }
        }

        [HttpPost("add-bill")]
        public async Task<IActionResult> AddBill([FromBody] Bill bill)
        {
            try
            {
                if(bill == null || string.IsNullOrEmpty(bill.Name) || bill.Amount <= 0)
                {
                    return BadRequest("Invalid bill data. Name and positive amount are required.");
                }

                var newBill = new Bill
                {
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
                // Log the exception (not implemented here)
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
                {
                    return NotFound("Bill not found.");
                }

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
                // Log the exception (not implemented here)
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
                {
                    return NotFound("Bill not found.");
                }

                existingBill.DeletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return Ok(new { message = "Bill deleted successfully." });
            }
            catch (Exception ex)
            {
                // Log the exception (not implemented here)
                return StatusCode(500, "An error occurred while deleting the bill: " + ex.Message);
            }
        }

        [HttpGet("get-suggestions")]
        public async Task<IActionResult> GetSuggestions()
        {
            var suggestions = await _billDetectionService.DetectAsync(CancellationToken.None);
            return Ok(suggestions);
        }

        private static DateOnly? ComputeNextDueDate(Bill b)
        {
            
            

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return b.Frequency switch
            {
                BillFrequency.Custom => b.CustomDate,
                BillFrequency.Monthly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 1),
                BillFrequency.Quarterly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 3),
                BillFrequency.Yearly when b.DueDay.HasValue => NextOccurrence(today, b.DueDay.Value, 12),
                BillFrequency.Weekly => b.LastPaidDate?.AddDays(7) ?? today,
                BillFrequency.BiWeekly => b.LastPaidDate?.AddDays(14) ?? today,
                _ => null
            };
        }


        



        private static DateOnly NextOccurrence(DateOnly today, int dueDay, int monthInterval)
        {
            var candidate = new DateOnly(today.Year, today.Month, Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month)));
            if (candidate < today)
            {
                var next = today.AddMonths(monthInterval);
                candidate = new DateOnly(next.Year, next.Month, Math.Min(dueDay, DateTime.DaysInMonth(next.Year, next.Month)));
            }
            return candidate;
        }
    }
}