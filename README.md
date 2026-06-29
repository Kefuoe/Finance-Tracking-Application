# Finance Tracking Application

A personal budgeting / expense-tracking app with a dark-themed Angular frontend and an
ASP.NET Core (Clean Architecture) backend. Track income and expenses against categories,
with a dashboard showing income, expenses, and balance. Currency is ZAR (displayed as `R`).

> **Status:** Working MVP — income, expenses, and categories. Backend authentication (JWT)
> is fully implemented. **Frontend auth is not yet built**, so the SPA currently sends no
> token and the protected `Income` / `Expenses` endpoints return `401` until that work
> lands (see [Roadmap](#roadmap)).

---

## Tech stack

| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core 9 Web API, Clean Architecture (Domain / Application / Infrastructure / API) |
| **Database** | SQL Server LocalDB (`(localdb)\MSSQLLocalDB`, DB `FinanceTrackerDb`), EF Core, code-first migrations |
| **Frontend** | Angular 21 (standalone components, signals, zoneless), Angular Material 3 (dark theme) |
| **Auth** | JWT bearer (Identity `PasswordHasher` for hashing, manually minted HS256 tokens) — **backend only so far** |
| **Currency** | ZAR — displayed as `R` |

---

## Repository layout

```
.
├── src/                          # ASP.NET Core backend (solution: src/FinanceTracker.sln)
│   ├── FinanceTracket.Domain/        # Entities (User, Category, Transaction, CategoryType)
│   ├── FinanceTracker.Application/   # DTOs, interfaces (IApplicationDbContext, ITokenService, ...)
│   ├── FinanceTracker.Infrastructure/# EF Core DbContext, migrations, JWT token service, DI
│   └── FinanceTracker.API/           # Controllers, Program.cs, appsettings, launch profiles
├── client/                       # Angular 21 frontend
│   └── src/app/                      # shell, routes, services, feature components
├── spec.md                       # Detailed project specification
└── README.md
```

> Note: the Domain project folder is spelled `FinanceTracket.Domain` (typo) while the
> namespace is `FinanceTracker.Domain`.

---

## Prerequisites

- [.NET SDK 9](https://dotnet.microsoft.com/download)
- SQL Server LocalDB (ships with Visual Studio / the SQL Server Express LocalDB installer)
- [Node.js](https://nodejs.org/) (LTS) + npm 11
- Angular CLI 21 (`npm install -g @angular/cli`) — optional, you can use `npx ng`
- EF Core tools (for migrations): `dotnet tool install --global dotnet-ef`

---

## Getting started

### 1. Backend

```bash
cd src/FinanceTracker.API

# Apply migrations / create the LocalDB database
dotnet ef database update --project ../FinanceTracker.Infrastructure --startup-project .

# Run the API over plain HTTP (recommended for frontend dev)
dotnet run --launch-profile http        # http://localhost:5127
```

In development, Swagger is available at `http://localhost:5127/swagger`. Use the
**Authorize** button to paste a JWT obtained from `/api/auth/login`.

> The API uses `UseHttpsRedirection()` only outside Development — run dev over plain HTTP
> to avoid the 307 redirect that breaks browser CORS calls.

### 2. Frontend

```bash
cd client
npm install
ng serve                                 # http://localhost:4200
```

The dev environment (`environment.development.ts`) points the SPA at
`http://localhost:5127/api`, so no proxy is required. CORS policy `AllowAngular` permits
`http://localhost:4200`.

---

## Configuration & security

⚠️ **Replace the JWT secret before any real use.** `src/FinanceTracker.API/appsettings.json`
ships with a placeholder `Jwt:Key`
(`"REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS"`). Replace it with a real, random
secret of at least 32 characters and move it **out of source control** — use
[user-secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) or an
environment variable:

```bash
cd src/FinanceTracker.API
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "<a-long-random-secret-at-least-32-chars>"
```

The `Jwt` section also configures `Issuer` (`FinanceTracker.API`), `Audience`
(`FinanceTracker.Client`), and `ExpiryMinutes` (default 60).

---

## API overview

Base URL (dev): `http://localhost:5127/api`

### Auth — `/api/auth`
| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/register` | `{ name, email, password }` | `200` + `{ token, name, email }`; `409` if email exists |
| `POST` | `/login` | `{ email, password }` | `200` + `{ token, name, email }`; `401` on bad credentials |

### Expenses — `/api/expenses` *(requires `Authorization: Bearer <token>`)*
| Method | Route | Returns |
|---|---|---|
| `GET` | `/api/expenses` | `TransactionDto[]`, newest first |
| `GET` | `/api/expenses/{id}` | `TransactionDto` or `404` |
| `POST` | `/api/expenses` | `201` + `TransactionDto` (category must be an Expense) |

### Income — `/api/income` *(requires `Authorization: Bearer <token>`)*
Same shape as expenses, filtered to Income categories and scoped to the current user.

### Categories — `/api/categories` *(public)*
| Method | Route | Query | Returns |
|---|---|---|---|
| `GET` | `/api/categories` | `?type=Income` / `?type=Expense` (optional) | `CategoryDto[]` ordered by name |

Seeded categories: `Salary` (Income), `Food`, `Transport`, `Rent` (Expense).

---

## Authentication flow

1. `POST /api/auth/register` or `/login` verifies credentials (passwords hashed with
   Identity's PBKDF2 `PasswordHasher`).
2. `JwtTokenService` issues a signed HS256 JWT whose `sub` claim is the user id.
3. The client sends `Authorization: Bearer <token>`.
4. `JwtBearer` middleware validates the token and builds `HttpContext.User`; `[Authorize]`
   gates the transaction controllers.
5. `CurrentUserService` reads the user id from the token per request, scoping all
   transaction data to that user.

---

## Roadmap

1. **Frontend auth** (next task) — `AuthService` (store JWT in `localStorage`), an HTTP
   interceptor attaching `Authorization: Bearer`, a route guard, and login/register
   components. Unblocks every protected call.
2. **Edit & delete** — `PUT`/`DELETE` on `/api/expenses/{id}` and `/api/income/{id}` plus
   form load-by-id and per-row delete.
3. **Dashboard summary endpoint** — `GET /api/dashboard/summary` instead of computing
   totals client-side.
4. **Cleanup** — remove the dead `EXPENSE_CATEGORIES` array and duplicate `Category`
   interface in `client/src/app/models/transaction.ts`; remove unused `WeatherForecast*`
   template files from the API.
5. **Harden auth** — real `Jwt:Key` via user-secrets/env, client token expiry/refresh
   handling, and decide whether `/api/categories` should require auth.
6. *(Optional)* Graduate to full ASP.NET Identity if roles / lockout / 2FA / external
   logins are ever needed.

See [spec.md](spec.md) for the full specification, design decisions, and known gaps.
```