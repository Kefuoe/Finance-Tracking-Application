using FinanceTracker.Application.Categories;
using FinanceTracker.Application.Common;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly IApplicationDbContext _db;

        public CategoriesController(IApplicationDbContext db) => _db = db;

        // GET: api/categories              -> all
        // GET: api/categories?type=Expense -> filtered

        [HttpGet]
        public async Task<IActionResult> GetCCategories([FromQuery] CategoryType? type, CancellationToken cancellationToken)
        {
            var query = _db.Categories.AsNoTracking();

            if (type is not null) {
                query = query.Where(c => c.Type == type);
            }

            var items = await query
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto(
                    c.Id,
                    c.Name,
                    c.Type.ToString()))
                .ToListAsync(cancellationToken);
            return Ok(items);
        }

    }
}
