using FinanceTracker.Application.Common;
using FinanceTracker.Application.Transactions;
using Microsoft.AspNetCore.Authorization;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace FinanceTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly IApplicationDbContext _db;
        private readonly ICurrentUserService _currentUser;

        public ExpensesController(IApplicationDbContext db, ICurrentUserService currentUser)
        {
            _db = db;
            _currentUser = currentUser;


        }

        //GET: api/expenses
        [HttpGet]
        public async Task<IActionResult> GetExpenses(CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;
            var items = await _db.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.Category!.Type == CategoryType.Expense)
                .OrderByDescending(t => t.Date)
                .Select(t => new TransactionDto(
                    t.Id,
                    t.Amount,
                    t.Date,
                    t.Description,
                    t.Category!.Name,
                    t.Category.Type.ToString()))
                .ToListAsync(cancellationToken);

            return Ok(items);
        }

        // GET: api/expenses/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetExpenseById(int id, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;
            var dto = await _db.Transactions
                .AsNoTracking()
                .Where(t => t.Id == id && t.UserId == userId && t.Category!.Type == CategoryType.Expense)
                .Select(t => new TransactionDto(
                    t.Id,
                    t.Amount,
                    t.Date,
                    t.Description,
                    t.Category!.Name,
                    t.Category.Type.ToString()))
                .FirstOrDefaultAsync(cancellationToken);

            if (dto == null) return NotFound();
            return Ok(dto);
        }

        // POST: api/expenses
        [HttpPost]
        public async Task<IActionResult> CreateExpense(CreateTransactionRequest request, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.Type == CategoryType.Expense, cancellationToken);

            if (category == null)
                return BadRequest(new { Error = "Category not found or is not an Expense category." });

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
                transaction.Id,
                transaction.Amount,
                transaction.Date,
                transaction.Description,
                category.Name,
                category.Type.ToString());

            return CreatedAtAction(nameof(GetExpenseById), new { id = transaction.Id }, dto);
        }

    }
}
