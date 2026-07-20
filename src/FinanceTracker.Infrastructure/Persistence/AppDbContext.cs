
using FinanceTracker.Application.Common;
using FinanceTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Infrastructure.Persistence;

public class AppDbContext : DbContext, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;

    public DbSet<Category> Categories { get; set; } = null!;

    public DbSet<Transaction> Transactions { get; set; } = null!;

    public DbSet<Budget> Budgets { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Inline until/unless moved into a TransactionConfiguration class
        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Salary", Type = CategoryType.Income },
            new Category { Id = 2, Name = "Food", Type = CategoryType.Expense },
            new Category { Id = 3, Name = "Transport", Type = CategoryType.Expense },
            new Category { Id = 4, Name = "Rent", Type = CategoryType.Expense }
        );

        modelBuilder.Entity<Budget>()
        .Property(b => b.Amount)
        .HasPrecision(18, 2);

        modelBuilder.Entity<Budget>()
        .HasIndex(b => new { b.UserId, b.CategoryId, b.Year, b.Month })
        .IsUnique();

    }
}