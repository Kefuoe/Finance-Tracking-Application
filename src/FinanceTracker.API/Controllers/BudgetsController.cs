using FinanceTracker.Application.Budgets;
using FinanceTracker.Application.Common;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static FinanceTracker.Application.Budgets.BudgetDtos;

namespace FinanceTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetsController : ControllerBase
    {
        private readonly IApplicationDbContext _db;
        private readonly ICurrentUserService _currentUser;


        public BudgetsController(IApplicationDbContext db, ICurrentUserService currentUser)
        {
            _db = db;
            _currentUser = currentUser;
        }

        // GET: api/budgets?year=2026&month=7
        [HttpGet]
        public async Task<IActionResult> GetBudgets(
            [FromQuery] int year, [FromQuery] int month, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var budgets = await _db.Budgets
                .AsNoTracking()
                .Where(b => b.UserId == userId && b.Year == year && b.Month == month)
                .Select(b => new
                {
                    b.Id,
                    b.CategoryId,
                    CategoryName = b.Category!.Name,
                    b.Amount,
                    b.Year,
                    b.Month
                })
                .ToListAsync(cancellationToken);

            // ONE grouped query for spend across all categories this month — not one per budget (avoids N+1).
            var spendByCategory = await _db.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId
                    && t.Category!.Type == CategoryType.Expense
                    && t.Date.Year == year && t.Date.Month == month)
                .GroupBy(t => t.CategoryId)
                .Select(g => new { CategoryId = g.Key, Spent = g.Sum(t => t.Amount) })
                .ToListAsync(cancellationToken);

            var spendLookup = spendByCategory.ToDictionary(x => x.CategoryId, x => x.Spent);

            var result = budgets.Select(b =>
            {
                var spent = spendLookup.TryGetValue(b.CategoryId, out var s) ? s : 0m;
                return new BudgetDto(
                    b.Id, b.CategoryId, b.CategoryName, b.Amount,
                    b.Year, b.Month, spent, b.Amount - spent);
            }).ToList();

            return Ok(result);
        }

        // GET: api/budgets/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetBudgetById(int id, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var b = await _db.Budgets
                .AsNoTracking()
                .Where(x => x.Id == id && x.UserId == userId)
                .Select(x => new { x.Id, x.CategoryId, CategoryName = x.Category!.Name, x.Amount, x.Year, x.Month })
                .FirstOrDefaultAsync(cancellationToken);

            if (b == null) return NotFound();

            var spent = await _db.Transactions
                .Where(t => t.UserId == userId && t.CategoryId == b.CategoryId
                    && t.Date.Year == b.Year && t.Date.Month == b.Month)
                .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0m;

            return Ok(new BudgetDto(b.Id, b.CategoryId, b.CategoryName, b.Amount,
                b.Year, b.Month, spent, b.Amount - spent));
        }

        // POST: api/budgets
        [HttpPost]
        public async Task<IActionResult> CreateBudget(CreateBudgetRequest request, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            if (request.Month is < 1 or > 12)
                return BadRequest(new { Error = "Month must be between 1 and 12." });

            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.Type == CategoryType.Expense, cancellationToken);

            if (category == null)
                return BadRequest(new { Error = "Category not found or is not an Expense category." });

            var exists = await _db.Budgets.AnyAsync(b =>
                b.UserId == userId && b.CategoryId == request.CategoryId
                && b.Year == request.Year && b.Month == request.Month, cancellationToken);

            if (exists)
                return Conflict(new { Error = "A budget for this category and month already exists." });

            var budget = new Budget
            {
                UserId = (int)userId!,
                CategoryId = request.CategoryId,
                Amount = request.Amount,
                Year = request.Year,
                Month = request.Month
            };

            _db.Budgets.Add(budget);
            await _db.SaveChangesAsync(cancellationToken);

            var dto = new BudgetDto(budget.Id, budget.CategoryId, category.Name,
                budget.Amount, budget.Year, budget.Month, 0m, budget.Amount);

            return CreatedAtAction(nameof(GetBudgetById), new { id = budget.Id }, dto);
        }

        // PUT: api/budgets/{id}  — only the amount is editable
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateBudget(int id, CreateBudgetRequest request, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var budget = await _db.Budgets
                .Where(b => b.Id == id && b.UserId == userId)
                .FirstOrDefaultAsync(cancellationToken);

            if (budget == null) return NotFound();

            budget.Amount = request.Amount;
            await _db.SaveChangesAsync(cancellationToken);

            var spent = await _db.Transactions
                .Where(t => t.UserId == userId && t.CategoryId == budget.CategoryId
                    && t.Date.Year == budget.Year && t.Date.Month == budget.Month)
                .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0m;

            var name = await _db.Categories.Where(c => c.Id == budget.CategoryId)
                .Select(c => c.Name).FirstAsync(cancellationToken);

            return Ok(new BudgetDto(budget.Id, budget.CategoryId, name, budget.Amount,
                budget.Year, budget.Month, spent, budget.Amount - spent));
        }

        // DELETE: api/budgets/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteBudget(int id, CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var budget = await _db.Budgets
                .Where(b => b.Id == id && b.UserId == userId)
                .FirstOrDefaultAsync(cancellationToken);

            if (budget == null) return NotFound();

            _db.Budgets.Remove(budget);
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }


    }
}
