using FinanceTracker.Application.Common;
using FinanceTracker.Application.Dashboard;
using Microsoft.AspNetCore.Authorization;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IApplicationDbContext _db;
        private readonly ICurrentUserService _currentUser;

        public DashboardController(IApplicationDbContext db, ICurrentUserService currentUser)
        {
            _db = db;
            _currentUser = currentUser;
        }

        [HttpGet("summary")]
        public async Task<ActionResult> GetSummary(CancellationToken cancellationToken)
        {
            var userId = _currentUser.UserId;

            var totalIncome = await _db.Transactions
                .Where(t => t.UserId == userId && t.Category!.Type == CategoryType.Income)
                .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0m;

            var totalExpenses = await _db.Transactions
                .Where(t => t.UserId == userId && t.Category!.Type == CategoryType.Expense)
                .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0m;

            var summary = new DashboardSummaryDto(
                totalIncome,
                totalExpenses,
                totalIncome - totalExpenses);

            return Ok(summary);
        }
    }

}