using FinanceTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Application.Common
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Category> Categories { get; }
        DbSet<Transaction> Transactions { get; }
        DbSet<Budget> Budgets { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
