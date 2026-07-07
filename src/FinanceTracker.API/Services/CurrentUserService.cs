using System.Security.Claims;
using FinanceTracker.Application.Common;
namespace FinanceTracker.API.Services
{
    //This service provides the current authenticated user's ID by reading it from the HTTP context (the JWT claims).
    public class CurrentUserService : ICurrentUserService
    {
        // safely extracts the logged-in user's ID from the JWT claims in the current HTTP request. 

        private readonly IHttpContextAccessor _accessor;

        public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

        public int? UserId
        {
            get
            {
                // "sub" is mapped to ClaimTypes.NameIdentifier by the JWT handler.
                // looks for the claim named NameIdentifier
                var value = _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                return int.TryParse(value, out var id)
                    ? id
                    : throw new UnauthorizedAccessException("No authenticated user.");

            }
        }

    }
}
