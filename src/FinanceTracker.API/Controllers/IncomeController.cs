using FinanceTracker.Application.Common;
using FinanceTracker.Application.Transactions;
using Microsoft.AspNetCore.Authorization;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IncomeController : ControllerBase
    {
        private readonly IApplicationDbContext _db;
        private readonly ICurrentUserService _currentUser;

        public IncomeController(IApplicationDbContext db, ICurrentUserService currentUser)
        { 
            _db = db;
            _currentUser = currentUser;

        }

        // GET: api/income
        [HttpGet]
        public async Task<IActionResult> GetIncome(CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var items = await _db.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.Category!.Type == CategoryType.Income)
                .OrderByDescending(t => t.Date)
                .Select(t => new TransactionDto(
                    t.Id, t.Amount, t.Date, t.Description,
                    t.Category!.Name, t.Category.Type.ToString()))
                .ToListAsync(cancellationToken);

            return Ok(items);
        }

        // GET: api/income/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIncomeById(int id, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;
            var dto = await _db.Transactions
                .AsNoTracking()
                .Where(t => t.Id == id && t.UserId == userId && t.Category!.Type == CategoryType.Income)
                .Select(t => new TransactionDto(
                    t.Id, t.Amount, t.Date, t.Description,
                    t.Category!.Name, t.Category.Type.ToString()))
                .FirstOrDefaultAsync(cancellationToken);

            if (dto == null) return NotFound();
            return Ok(dto);
        }

        // POST: api/income
        [HttpPost]
        public async Task<IActionResult> CreateIncome(CreateTransactionRequest request, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.Type == CategoryType.Income, cancellationToken);

            if (category == null)
                return BadRequest(new { Error = "Category not found or is not an Income category." });

            var transaction = new Transaction
            {
                UserId = (int)userId,
                CategoryId = request.CategoryId,
                Amount = request.Amount,
                Date = request.Date,
                Description = request.Description
            };

            _db.Transactions.Add(transaction);
            await _db.SaveChangesAsync(cancellationToken);

            var dto = new TransactionDto(
                transaction.Id, transaction.Amount, transaction.Date,
                transaction.Description, category.Name, category.Type.ToString());

            return CreatedAtAction(nameof(GetIncomeById), new { id = transaction.Id }, dto);
        }
    }
}
