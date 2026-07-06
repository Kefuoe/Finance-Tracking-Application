# FinanceTracker — Project Specification

> Personal budgeting / expense-tracking app. Dark-themed, ASP.NET Core 9 backend (Clean Architecture) + Angular 21 frontend (Angular Material). ZAR currency.
>
> **Status:** Working MVP with income + expenses + categories. **Authentication (JWT) is now fully implemented end-to-end.** Backend: register/login, password hashing, `[Authorize]`-protected transaction endpoints, old hardcoded `DemoUserId` removed. **Frontend auth is now built too** — `AuthService` (token + user in `localStorage`), an HTTP interceptor attaching `Authorization: Bearer`, a functional route guard, and login/register components — so the SPA authenticates and the protected `Income`/`Expenses` endpoints work. See §3.9.
> **Last updated:** 2026-07-06

---

## 1. Overview

| | |
|---|---|
| **Backend** | ASP.NET Core 9 Web API, Clean Architecture (Domain / Application / Infrastructure / API) |
| **Database** | SQL Server LocalDB (`(localdb)\MSSQLLocalDB`, DB `FinanceTrackerDb`), EF Core, code-first migrations |
| **Frontend** | Angular 21 (standalone components, signals, zoneless), Angular Material 3 (dark theme) |
| **Currency** | ZAR — displayed as `R` (`currency:'ZAR':'symbol-narrow'`) |
| **Auth** | **JWT bearer, end-to-end.** Backend: Identity `PasswordHasher`, custom int-keyed `User`, per-request user id from the token. Frontend: `AuthService` + `localStorage`, HTTP interceptor, route guard, login/register UI. |

### Runtime topology
- Backend: `http://localhost:5127` (run with `dotnet run --launch-profile http`)
- Frontend dev server: `http://localhost:4200` (`ng serve`)
- Cross-origin: CORS policy `AllowAngular` permits `http://localhost:4200`

---

## 2. Backend

### 2.1 Solution structure

```
src/
├── FinanceTracket.Domain/          (note: folder name is misspelled "Tracket"; namespace is FinanceTracker.Domain)
│   └── Entities/
│       ├── User.cs
│       ├── Category.cs
│       ├── CategoryType.cs         (enum)
│       └── Transaction.cs
├── FinanceTracker.Application/
│   ├── Auth/AuthDtos.cs            (RegisterRequest, LoginRequest, AuthResponse)
│   ├── Categories/CategoryDto.cs
│   ├── Common/
│   │   ├── IApplicationDbContext.cs
│   │   ├── ICurrentUserService.cs  (current user id abstraction)
│   │   └── ITokenService.cs        (JWT creation abstraction)
│   └── Transactions/TransactionDtos.cs
├── FinanceTracker.Infrastructure/
│   ├── Auth/
│   │   ├── JwtSettings.cs          (bound to the "Jwt" config section)
│   │   └── JwtTokenService.cs      (ITokenService impl — mints HS256 JWTs)
│   ├── Persistence/AppDbContext.cs
│   ├── DependencyInjection.cs
│   └── Migrations/
│       ├── 20260615144001_InitialCreate.*
│       └── 20260628102807_AddAuthAndRemoveDemoUser.*
└── FinanceTracker.API/
    ├── Controllers/
    │   ├── AuthController.cs        (register / login)
    │   ├── CategoriesController.cs  (list categories)
    │   ├── ExpensesController.cs    ([Authorize])
    │   └── IncomeController.cs      ([Authorize])
    ├── Services/CurrentUserService.cs   (ICurrentUserService impl — reads id from JWT claims)
    ├── Program.cs
    ├── appsettings.json / appsettings.Development.json
    └── Properties/launchSettings.json
```

> The default template leftovers `WeatherForecast.cs` / `WeatherForecastController.cs` still exist in the API project and are unused.

### 2.2 Domain entities

**User** — `Id`, `Name`, `Email`, `PasswordHash`, `CreatedDate`, `Transactions`. (Still a custom int-keyed entity — full ASP.NET Identity was **not** adopted; see §2.7.)

**Category** — `Id`, `Name`, `Type` (`CategoryType`), `Transactions`.

**CategoryType** (enum) — `Income = 1`, `Expense = 2`.

**Transaction** — `Id`, `UserId`, `CategoryId`, `Amount` (decimal, precision 18,2), `Date`, `Description`, plus nav props `User?` and `Category?`.

### 2.3 Persistence

- `AppDbContext` implements `IApplicationDbContext` (DI registers the interface → concrete context, scoped).
- `Amount` configured with `HasPrecision(18, 2)`.
- **Unique index on `User.Email`** (`HasIndex(u => u.Email).IsUnique()`).
- **Seed data** (`OnModelCreating` → `HasData`):
  - Categories: `1 Salary (Income)`, `2 Food (Expense)`, `3 Transport (Expense)`, `4 Rent (Expense)`.
  - **The demo `User` (Id=1) seed has been removed** — users now come from registration.
  - No transactions are seeded — a fresh DB shows R0 until you add one.
- Connection string (Development): `Server=(localdb)\MSSQLLocalDB;Database=FinanceTrackerDb;Trusted_Connection=True;MultipleActiveResultSets=true`.
- **Migrations:** `InitialCreate` then `AddAuthAndRemoveDemoUser` (adds the unique email index and drops the seeded demo user). If a dev DB still has transactions tied to the old `UserId = 1`, drop & recreate the DB and register a fresh user.

### 2.4 Authentication (JWT + Identity password hasher)

**Approach:** lightweight — the existing custom int-keyed `User` is kept; only ASP.NET Identity's `PasswordHasher<User>` (PBKDF2) is borrowed for hashing. JWTs are minted manually. Full Identity (`UserManager`/`IdentityDbContext`/roles) was deliberately **not** adopted.

**Flow:** `register`/`login` verify credentials → `JwtTokenService` issues a signed JWT whose `sub` claim is the user id → the client sends `Authorization: Bearer <token>` → `JwtBearer` middleware validates and builds `HttpContext.User` → `[Authorize]` gates the transaction controllers → `CurrentUserService` reads the id back out per request (replacing the old `DemoUserId`).

**`AuthController` (`/api/auth`):**

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/auth/register` | `RegisterRequest(Name, Email, Password)` | `200 OK` + `AuthResponse(Token, Name, Email)`; `409 Conflict` if email exists |
| `POST` | `/api/auth/login` | `LoginRequest(Email, Password)` | `200 OK` + `AuthResponse`; `401 Unauthorized` on bad credentials |

- Email is normalized (`Trim().ToLowerInvariant()`); registration rejects duplicates.
- Login returns the **same** `"Invalid credentials"` for both unknown email and wrong password (no account enumeration).
- Passwords hashed/verified via `IPasswordHasher<User>`.

**Token (`JwtTokenService`):** HS256 over the configured key; claims `sub` (user id), `email`, `name`, `jti`; `iss`/`aud`/`exp` from config (default 60-min expiry).

**`CurrentUserService` (API):** reads `ClaimTypes.NameIdentifier` (the JWT handler maps `sub` → `NameIdentifier`), parses it to `int`, and throws `UnauthorizedAccessException` if absent. `ICurrentUserService.UserId` is typed `int?`.

**Config (`appsettings.json` → `Jwt`):** `Key`, `Issuer` (`FinanceTracker.API`), `Audience` (`FinanceTracker.Client`), `ExpiryMinutes` (60). ⚠️ The committed `Key` is still the placeholder `"REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS"` — replace with a real ≥32-char secret and move it out of source control (user-secrets / env var) before any real use.

**DI (`DependencyInjection.AddInfrastructure`):** binds `JwtSettings` to the `Jwt` section; registers `ITokenService → JwtTokenService` and `IPasswordHasher<User> → PasswordHasher<User>` (both scoped).

**Packages added:** `Microsoft.AspNetCore.Authentication.JwtBearer` (API), `Microsoft.Extensions.Identity.Core` + `System.IdentityModel.Tokens.Jwt` (Infrastructure).

### 2.5 API surface — transactions & categories

**`ExpensesController` (`/api/expenses`)** — `[Authorize]`, filters to `CategoryType.Expense`, scoped to the **current user** via `_currentUser.UserId`.

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/api/expenses` | — | `TransactionDto[]`, newest first |
| `GET` | `/api/expenses/{id}` | — | `TransactionDto` or `404` |
| `POST` | `/api/expenses` | `CreateTransactionRequest` | `201 Created` + `TransactionDto` (validates category exists and is an Expense; `400` otherwise) |

**`IncomeController` (`/api/income`)** — identical shape to expenses, `[Authorize]`, filters to `CategoryType.Income`, scoped to the current user.

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/api/income` | — | `TransactionDto[]`, newest first |
| `GET` | `/api/income/{id}` | — | `TransactionDto` or `404` |
| `POST` | `/api/income` | `CreateTransactionRequest` | `201 Created` + `TransactionDto` (validates category is Income; `400` otherwise) |

**`CategoriesController` (`/api/categories`)** — returns seeded categories. **Currently not `[Authorize]`d (public).**

| Method | Route | Query | Returns |
|---|---|---|---|
| `GET` | `/api/categories` | `?type=Income` / `?type=Expense` (optional) | `CategoryDto[]` ordered by name |

**DTOs:**

```csharp
// Application/Transactions/TransactionDtos.cs
record CreateTransactionRequest(int CategoryId, decimal Amount, DateTime Date, string Description);
record TransactionDto(int Id, decimal Amount, DateTime Date, string Description,
                      string CategoryName, string CategoryType);

// Application/Categories/CategoryDto.cs
record CategoryDto(int Id, string Name, string Type);   // Type = "Income" | "Expense"

// Application/Auth/AuthDtos.cs
record RegisterRequest(string Name, string Email, string Password);
record LoginRequest(string Email, string Password);
record AuthResponse(string Token, string Name, string Email);
```

### 2.6 Program.cs / middleware

- Controllers, Swagger/OpenAPI (dev only) **with a `Bearer` security definition** (Swagger "Authorize" button for pasting a JWT), Infrastructure DI.
- **JWT bearer authentication** configured from the `Jwt` config section: validates issuer, audience, lifetime, and signing key; `ClockSkew` tightened to 30s.
- `AddAuthorization()`, `AddHttpContextAccessor()`, and `ICurrentUserService → CurrentUserService` registered.
- CORS policy `AllowAngular` → origin `http://localhost:4200`, any header/method.
- `UseHttpsRedirection()` is **only** applied in non-Development (production). Deliberate: in dev it caused HTTP 307 redirects (`5127`→`7001`) that broke browser CORS calls. Run dev over plain HTTP.
- **Pipeline order:** Swagger (dev) → `UseCors` → `UseAuthentication` → `UseAuthorization` → `MapControllers`. (`UseAuthentication` must precede `UseAuthorization`.)

### 2.7 Notes / decisions
- **Why not full ASP.NET Identity:** the schema uses an int-keyed `User` with int `Transaction.UserId` FKs and seeded data; full Identity defaults to GUID keys and ~7 extra tables for features not needed yet (roles, lockout, 2FA, external logins). The lightweight path (Identity `PasswordHasher` + manual JWT) keeps the schema intact and is the part worth learning. Can graduate later if roles are needed.

### 2.8 Launch profiles
- `http` → `http://localhost:5127` (the one to use for frontend dev).
- `https` → `https://localhost:7001;http://localhost:5127`.

---

## 3. Frontend

### 3.1 Stack
- Angular `^21.0.0`, Angular Material / CDK `^21.2.14`, `@angular/animations` `^21.0.0`, RxJS `7.8`, TypeScript `5.9`.
- Standalone components, **zoneless** change detection, signals, new control flow (`@if`/`@for`), lazy routes via `loadComponent`.
- Build/test: Angular CLI `^21`, Vitest for unit tests (service specs exist for transaction/income/category/auth).
- ⚠️ `@angular/animations` was recently added to `package.json`: `app.config.ts` uses `provideAnimationsAsync()` (which lazily imports `@angular/animations/browser`), but the package had been missing — `ng serve` tolerated the lazy import while `ng build` failed to resolve it. Now fixed.

### 3.2 Structure

```
client/src/
├── main.ts, index.html, styles.scss
├── environments/
│   ├── environment.ts              (prod-ish: apiBaseUrl '/api')
│   └── environment.development.ts  (apiBaseUrl 'http://localhost:5127/api')
└── app/
    ├── app.ts / app.html / app.scss     (shell: toolbar + router-outlet)
    ├── app.config.ts                    (providers)
    ├── app.routes.ts                    (routes)
    ├── models/
    │   ├── transaction.ts               (interfaces; legacy hardcoded categories)
    │   └── auth.ts                       (RegisterRequest, LoginRequest, AuthResponse, AuthUser)
    ├── services/
    │   ├── transaction.service.ts       (expenses — HTTP + signal store)
    │   ├── income.service.ts            (income — HTTP + signal store)
    │   ├── category.service.ts          (categories — fetch by type)
    │   └── auth.service.ts              (register/login, token+user signals, localStorage)
    ├── interceptors/
    │   └── auth-interceptor.ts          (attaches Authorization: Bearer)
    ├── guards/
    │   └── auth.guard.ts                 (functional CanActivateFn → redirect to /login)
    └── features/
        ├── dashboard/      (totals cards)
        ├── expense-list/   (mat-table)
        ├── expense-form/    (reactive form to add)
        ├── income-list/    (mat-table)
        ├── income-form/    (reactive form to add)
        ├── login/          (reactive form; email + password)
        └── register/       (reactive form; name + email + password)
```

### 3.3 App config (`app.config.ts`)
Providers: `provideBrowserGlobalErrorListeners`, `provideZonelessChangeDetection`, `provideRouter(routes)`, `provideHttpClient(withInterceptors([authInterceptor]))`, `provideAnimationsAsync`, `provideNativeDateAdapter`. The `authInterceptor` is now wired in (see §3.9).

### 3.4 Routing (`app.routes.ts`)
| Path | Component (lazy) | Guarded |
|---|---|---|
| `login` | `Login` | — (public) |
| `register` | `Register` | — (public) |
| `''` | `Dashboard` | `authGuard` |
| `expenses` | `ExpenseList` | `authGuard` |
| `expenses/:id` | `ExpenseForm` | `authGuard` |
| `income` | `IncomeList` | `authGuard` |
| `income/:id` | `IncomeForm` | `authGuard` |
| `**` | redirect → `''` | — |

> The "Add" links point to `/expenses/new` and `/income/new`, matched by the `:id` routes (`id = "new"`). The forms ignore the route param and always **create** — there is no edit/load-by-id flow wired up yet. All data routes are now guarded by `authGuard`; unauthenticated users are redirected to `/login` with a `returnUrl` query param.

### 3.5 Models (`models/transaction.ts`)
- `TransactionDto` and `CreateTransactionRequest` mirror the backend DTOs (dates as ISO strings).
- A `Category` interface (`id`, `name`, `type`) is used by the category service and forms.
- ⚠️ Cleanup debt: the file declares the `Category` interface twice and still contains a legacy hardcoded `EXPENSE_CATEGORIES` array. With `CategoryService` now in place, both forms fetch categories from the API, so `EXPENSE_CATEGORIES` is **dead code** and should be removed along with the duplicate interface.

### 3.6 Services
- **`TransactionService`** (expenses) — base `${apiBaseUrl}/Expenses`; signals `expenses`, `loading`, `error`; `loadExpenses()`, `getById(id)`, `create(req)` (prepends created item).
- **`IncomeService`** — base `${apiBaseUrl}/Income`; signals `income`, `loading`, `error`; `loadIncome()`, `getById(id)`, `create(req)` (prepends created item). Same shape as `TransactionService`.
- **`CategoryService`** — base `${apiBaseUrl}/categories`; `getExpenseCategories()` (`?type=Expense`) and `getIncomeCategories()` (`?type=Income`), each returning `Promise<Category[]>`.
- **`AuthService`** — base `${apiBaseUrl}/auth`; `register(req)` / `login(req)` POST and persist the result; signals `token` and `user` (both seeded from `localStorage` so a refresh stays logged in) plus a `isAuthenticated` computed; `logout()` clears storage and signals. See §3.9.

### 3.7 Components

**Shell (`app`)** — Material toolbar with brand. When authenticated: Dashboard / Expenses / **Income** nav links, the signed-in user's name, and a **Log out** button (clears the session and routes to `/login`). When unauthenticated: **Log in** / **Register** links only. Toggled reactively via `AuthService.isAuthenticated()`.

**Dashboard** — loads both expenses and income on init; computed `totalExpenses`, **`totalIncome` (now real, summed from `IncomeService`)**, `balance = income − expenses`. Material cards + links.

**ExpenseList** — loads expenses on init; `mat-table` columns `['date','description','category','amount']`; loading / error / empty states; "Add expense" button.

**IncomeList** — mirror of ExpenseList for income (same columns and states), backed by `IncomeService`.

**ExpenseForm** — reactive form (`FormBuilder.nonNullable.group`): `categoryId` (required), `amount` (required, min 0.01), `date` (Material datepicker, required), `description` (required, max 250). **Category options now come from `CategoryService.getExpenseCategories()`** (no longer hardcoded). On submit: validates (`markAllAsTouched()` now correctly **called** — the old missing-`()` bug is fixed), converts date to ISO, calls `svc.create(...)`, navigates to `/expenses`.

**IncomeForm** — mirror of ExpenseForm; categories from `CategoryService.getIncomeCategories()`; navigates to `/income` on success.

**Login** — reactive form (`FormBuilder.nonNullable.group`): `email` (required, email), `password` (required); `loading`/`error` signals. On submit calls `AuthService.login(...)`, then navigates to the `returnUrl` query param (or `/`). A failed login shows a generic "Invalid email or password." (matching the backend's non-enumerating `401`). Link to `/register`.

**Register** — mirror of Login plus a `name` field (required, max 100) and `password` (required, min 6 — client-side UX only; the backend enforces no policy yet). On submit calls `AuthService.register(...)` then navigates to `/`. Catches `409 Conflict` → "That email is already registered."; other errors → generic message. Link to `/login`.

### 3.8 Theming (`styles.scss`)
- Material 3 dark theme via `mat.theme(...)` — `theme-type: dark`, primary `$azure-palette`, tertiary `$cyan-palette`, Roboto, density 0.
- App background `#0d0d0d`, text `#f5f5f5`.
- Helper classes: `.page` (max-width 960px centered), `.cards-row` (responsive grid), `.amount-income` (green `#4ade80`), `.amount-expense` (red `#f87171`), `.spacer`.

### 3.9 Auth — implemented (frontend)

The client-side auth is now built, so the SPA authenticates against the `[Authorize]`d backend instead of getting `401`s.

- **`models/auth.ts`** — `RegisterRequest`, `LoginRequest`, `AuthResponse` (mirror the backend DTOs) and `AuthUser` (`{ name, email }`, the subset kept on the client).
- **`AuthService`** — `register`/`login` POST to `/api/auth` and store the `AuthResponse`; keeps `token` and `user` in `localStorage` (keys `ft_token`, `ft_user`) and in signals seeded from storage on startup (survives refresh); `isAuthenticated` computed; `logout()` clears both.
- **`authInterceptor`** (`interceptors/auth-interceptor.ts`) — functional `HttpInterceptorFn`; clones outgoing requests to add `Authorization: Bearer <token>` when a token exists (public `/categories` and the login/register calls pass through untouched). Wired via `withInterceptors([authInterceptor])` in `app.config.ts`.
- **`authGuard`** (`guards/auth.guard.ts`) — functional `CanActivateFn`; allows navigation when `isAuthenticated()`, otherwise returns a `UrlTree` redirecting to `/login` with a `returnUrl` query param. Applied to all data routes (§3.4).
- **`Login` / `Register` components** — Material reactive forms with validation, loading/error state, and `409` handling on register (§3.7).

**Not yet done (see §5 / §6):** no client-side token-expiry / refresh handling (an expired token yields `401`s with no auto-logout), and the interceptor does not yet catch `401` to log the user out automatically.

---

## 4. How to run

```bash
# Backend (from repo root)
cd src/FinanceTracker.API
dotnet run --launch-profile http        # http://localhost:5127

# Frontend (from repo root)
cd client
npm install
ng serve                                 # http://localhost:4200
```

The dev environment file points the frontend at `http://localhost:5127/api`, so no proxy is required.

> Before running for real, set a proper `Jwt:Key` (see §2.4). In the browser, register or log in via the SPA — the token is stored and attached automatically. To exercise the protected endpoints directly, `POST /api/auth/register`, copy the returned token, and use Swagger's "Authorize" button or a `Bearer` header in curl/Postman.

---

## 5. Known gaps / limitations

- **No client-side token expiry / refresh handling.** Frontend auth is built (§3.9), but an expired 60-min token just yields `401`s — the interceptor does not catch `401` to auto-logout, and there is no refresh-token flow.
- **Placeholder JWT secret committed.** `Jwt:Key` in `appsettings.json` is the literal placeholder string and lives in source control — replace and relocate to secrets/env before any real use.
- **`/api/categories` is public** (no `[Authorize]`). Fine for shared seed data, but worth a conscious decision.
- **No edit/delete.** The `:id` routes resolve to the create forms and ignore the id; there is no `PUT`/`DELETE` endpoint or per-row delete.
- **No dashboard summary endpoint.** Totals are computed client-side by loading full lists; there is no server-side `GET /api/dashboard/summary`.
- **Frontend cleanup debt** (`models/transaction.ts`): duplicate `Category` interface declaration and an unused, now-stale hardcoded `EXPENSE_CATEGORIES` array.
- **`ICurrentUserService.UserId` typed `int?`** but the implementation never returns null (it throws), and controllers cast `(int)userId` — mildly inconsistent; could be `int`.
- **Prod environment** (`environment.ts`) uses relative `apiBaseUrl: '/api'` with no proxy/host configured — only the dev config is wired for real use.
- Unused `WeatherForecast*` template files remain in the API project.

---

## 6. Roadmap (next steps)

1. ~~**Frontend auth**~~ — ✅ **Done** (2026-07-06). `AuthService` (register/login → JWT + user in `localStorage`), an HTTP interceptor attaching `Authorization: Bearer <token>`, a functional route guard redirecting to `/login`, and login/register components. See §3.9.
2. **Edit & delete** — `PUT`/`DELETE` on `/api/expenses/{id}` and `/api/income/{id}` + form load-by-id and per-row delete actions. *(Now the immediate task.)*
3. **Dashboard summary endpoint** — e.g. `GET /api/dashboard/summary` returning income/expense/balance server-side instead of loading full lists client-side.
4. **Frontend cleanup** — remove `EXPENSE_CATEGORIES` and the duplicate `Category` interface; remove unused `WeatherForecast*` files from the API.
5. **Harden auth** — real `Jwt:Key` via user-secrets/env, add client-side token expiry/refresh handling (e.g. catch `401` in the interceptor → auto-logout), and decide whether `/api/categories` should require auth.
6. **(Optional) Graduate to full ASP.NET Identity** if roles/lockout/2FA/external logins are ever needed (see §2.7).
```