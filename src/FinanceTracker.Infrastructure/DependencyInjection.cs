using FinanceTracker.Application.Common;
using FinanceTracker.Domain.Entities;
using FinanceTracker.Infrastructure.Auth;
using FinanceTracker.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;          // PasswordHasher<T>
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceTracker.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
        {
            // Configure DbContext with SQL Server
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(config.GetConnectionString("DefaultConnection")));
            // Register repositories
            services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

            //auth wiring//
            services.Configure<JwtSettings>(config.GetSection("Jwt"));
            services.AddScoped<ITokenService, JwtTokenService>();
            services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

            return services;
        }
    }
}
