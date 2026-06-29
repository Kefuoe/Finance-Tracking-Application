using FinanceTracker.Application.Auth;
using FinanceTracker.Application.Common;
using FinanceTracker.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IApplicationDbContext _db;
        private readonly IPasswordHasher<User> _hasher;
        private readonly ITokenService _tokens;

        public AuthController(IApplicationDbContext db, IPasswordHasher<User> hasher, ITokenService tokens)
        {
            _db = db;
            _hasher = hasher;
            _tokens = tokens;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var exists = await _db.Users.AnyAsync(u => u.Email == email, cancellationToken);
            if (exists) 
                return Conflict(new { message = "Email already exists" });

            var user = new User
            {
                Name = request.Name,
                Email = email,
                CreatedDate = DateTime.UtcNow
            };
            // Hash AFTER the object exists (hasher can incorporate the user if needed).
            user.PasswordHash = _hasher.HashPassword(user, request.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync(cancellationToken);

            var token = _tokens.CreateToken(user);

            return Ok(new AuthResponse(token, user.Name, user.Email));
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
        {
            var email = request?.Email.Trim().ToLowerInvariant();

            var user = await _db.Users.FirstOrDefaultAsync(u  => u.Email == email, cancellationToken);

            if (user == null) return Unauthorized(new { Error = "Invalid credentials" });

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized(new { Error = "Invalid credentials" });

            var token = _tokens.CreateToken(user);

            return Ok(new AuthResponse(token, user.Name, user.Email));
        }


    }
}
