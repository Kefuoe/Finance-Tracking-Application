# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal finance tracker: an **Angular 21 SPA** (`client/`) talking to an **ASP.NET Core 9 Web API** (`src/`, Clean Architecture) over `http://localhost:5127/api`. Tracks income and expenses against categories, per authenticated user. Currency is ZAR, displayed as `R`.

## Commands

### Backend (`src/`)
Run all `dotnet` commands from `src/FinanceTracker.API` (it's the startup project).

```bash
dotnet run --launch-profile http     # http://localhost:5127 + Swagger at /swagger
dotnet build                          # from src/ builds the whole solution (FinanceTracker.sln)

# EF Core migrations (Infrastructure holds the migrations, API is the startup project)
dotnet ef database update  --project ../FinanceTracker.Infrastructure --startup-project .
dotnet ef migrations add <Name> --project ../FinanceTracker.Infrastructure --startup-project .
```

Always run the API over the **`http`** profile in dev. `UseHttpsRedirection()` is only enabled outside Development (`Program.cs`); the `https` profile's 307 redirect breaks browser CORS calls from the SPA.

### Frontend (`client/`)
```bash
npm install
ng serve            # http://localhost:4200
ng build
ng test             # Vitest (not Karma/Jasmine) — jsdom environment
ng test --include src/app/services/auth.service.spec.ts   # single spec
```

There is no lint script configured. Prettier config lives in `client/package.json` (100 col, single quotes, `angular` parser for `.html`).

## Architecture

### Backend — Clean Architecture, 4 projects
Dependency direction is Domain ← Application ← Infrastructure ← API. Never make an inner layer reference an outer one.

- **`FinanceTracket.Domain`** (note the folder typo; namespace is correctly `FinanceTracker.Domain`) — POCO entities only: `User`, `Category`, `Transaction`, `CategoryType` enum (Income/Expense). No dependencies.
- **`FinanceTracker.Application`** — DTOs (records, e.g. `TransactionDto`, `AuthDtos`) and interfaces the API/Infrastructure implement: `IApplicationDbContext`, `ICurrentUserService`, `ITokenService`.
- **`FinanceTracker.Infrastructure`** — `AppDbContext` (implements `IApplicationDbContext`), EF migrations, `JwtTokenService`, and `DependencyInjection.AddInfrastructure()` which wires DbContext + auth services. This one extension method is the single place backend services get registered.
- **`FinanceTracker.API`** — controllers, `Program.cs`, `CurrentUserService` (reads user id from JWT claims via `IHttpContextAccessor`).

Controllers depend on **`IApplicationDbContext`** (not the concrete `AppDbContext`) and query EF directly with LINQ, projecting straight into DTOs — there is no repository or service layer between controller and DbContext. Follow this pattern when adding endpoints.

**User scoping is manual and mandatory.** Every transaction query filters by `t.UserId == _currentUser.UserId`. `ICurrentUserService.UserId` throws `UnauthorizedAccessException` if there's no authenticated user. When adding any transaction endpoint, always scope by the current user — there is no global query filter doing it for you.

**Income vs Expense share one `Transaction` table**, distinguished only by their `Category.Type`. `ExpensesController` and `IncomeController` are near-identical, each filtering `Category.Type == Expense`/`Income` and validating that a submitted `CategoryId` matches the right type. Changes to one usually need mirroring in the other.

### Auth flow
JWT bearer, hand-rolled (not full ASP.NET Identity). Passwords hashed with Identity's `PasswordHasher<User>` (PBKDF2); tokens minted HS256 by `JwtTokenService` with the user id as the `sub` claim. `[Authorize]` gates the transaction controllers; `/api/categories` is public. JWT settings (`Key`, `Issuer`, `Audience`, `ExpiryMinutes`) come from the `Jwt` config section.

`appsettings.json` ships a **placeholder `Jwt:Key`** — for real use, set it via user-secrets (`dotnet user-secrets set "Jwt:Key" "<32+ chars>"`), not in source. Connection string (`appsettings.Development.json`) points at LocalDB `FinanceTrackerDb`.

### Frontend — Angular 21, zoneless + signals
- **Standalone components only** (no NgModules). Bootstrap config is `app.config.ts`; routes are lazy `loadComponent` entries in `app.routes.ts`.
- **Zoneless change detection** (`provideZonelessChangeDetection`). State is held in **signals** — see `AuthService` (`token`, `user`, `isAuthenticated` computed signals backed by `localStorage`). Prefer signals over RxJS `BehaviorSubject` for component/service state.
- **Auth is client-side wired:** `authInterceptor` (functional, registered in `app.config.ts`) attaches `Authorization: Bearer <token>` from `AuthService`; `authGuard` protects routes. Token/user persist in `localStorage` (`ft_token`, `ft_user`).
- Feature components live in `client/src/app/features/<name>/` as 4-file sets (`.ts/.html/.scss/.spec.ts`). Services in `services/`, models in `models/`, using Angular Material 3 (dark theme).
- API base URL comes from `environment.development.ts` (`http://localhost:5127/api`) — no dev proxy. Backend CORS policy `AllowAngular` only allows `http://localhost:4200`.

## Notes
- `spec.md` has the full specification and design rationale; `README.md` is partly stale (it predates the now-merged frontend auth, edit/delete, and dashboard-summary work).
- Dead code to be aware of: `WeatherForecast*` scaffolding in the API, and a duplicate `Category` interface / unused `EXPENSE_CATEGORIES` in `client/src/app/models/transaction.ts`.
