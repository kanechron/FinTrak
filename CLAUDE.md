# FinTrak — Claude Context

## Project Overview

FinTrak is a personal finance tracker built for James's own use and as a portfolio project. The goal is something genuinely useful day-to-day that also demonstrates strong engineering skills. Currently in **active full-stack development** — backend endpoints live, React dashboard wired to real data, Plaid production connection working with NFCU. Deployed to production at **fintrak.org** via Docker + Cloudflare Tunnel.

## Tech Stack

- **Frontend:** React (web) + React Native (mobile, not yet started)
- **Backend:** C# with ASP.NET Core
- **Database:** PostgreSQL (Docker, both local dev and production)
- **Bank integration:** Plaid API — handles all bank connectivity, transaction pulls, pending transactions, and balances
- **AI/ML:** Rule-based normalization + FuzzySharp for merchant name matching, Claude Haiku API as fallback for low-confidence cases
- **Charting:** Recharts (must stay on v3+; v2 breaks with React 19)

## What's Been Set Up

- `docker-compose.yml` — PostgreSQL + pgAdmin + backend + frontend + cloudflared, all on an internal bridge network
- `.env` / `.env.example` — credentials managed via environment variables, `.env` is gitignored
- Git repo with `main`, `dev`, `feature/frontend-web`, and `feature/backend` branches
- ASP.NET Core backend scaffolded: `FinTrak.Api`, `FinTrak.Core`, `FinTrak.Infrastructure`
- NuGet packages installed: Npgsql EF Core, Google.Apis.Auth, Going.Plaid, FuzzySharp, Anthropic.SDK, Serilog.AspNetCore, dotenv.net, AutoMapper, FluentValidation.DependencyInjectionExtensions, Swashbuckle.AspNetCore

## Entity Classes

Located in `backend/FinTrak.Core/Entities/` — all complete:

- `User.cs` — Google ID, email, display name, timestamps
- `Category.cs` — Id, Name, IsSystem flag
- `Transaction.cs` — full transaction record with dedup fields, soft delete, Plaid + manual support
- `DedupStatus.cs` — enum: Accepted, Flagged, Discarded
- `RefreshToken.cs` — Google refresh tokens stored server-side, with revocation support
- `PlaidItem.cs` — one per linked bank institution, holds Plaid access token and sync cursor
- `Account.cs` — individual bank accounts under a PlaidItem
- `Budget.cs` — per-category spending limits with BudgetPeriod enum
- `Goal.cs` — named savings goals with target amount and optional deadline
- `Bill.cs` — recurring bills with BillFrequency enum (supports Custom date)
- `MerchantAlias.cs` — raw → normalized merchant name mappings for dedup pipeline
- `SyncQueue.cs` — Plaid sync job tracking
- `Invite.cs` — token-based user invites with expiry and used-by tracking

## Database

- `FinTrakDbContext.cs` in `FinTrak.Infrastructure/Persistance/`
- `FinTrakDbContextFactory.cs` — design-time factory for EF migrations, reads `.env`
- `InitialSchema` migration applied; `Invites` table added in subsequent migration
- Soft delete filters, unique indexes, and enum-as-string storage configured
- `Invites` table has soft-delete filter on `UsedAt == null` and index on `Token`

## Auth — Complete

Google OAuth 2.0 implemented in `FinTrak.Api/Controllers/AuthController.cs`:

- PKCE flow — `GET /auth/login` builds the Google auth URL, `GET /auth/callback` exchanges the code
- `prompt=select_account consent` forces Google to always return a refresh token
- Refresh + access token pair from Google; refresh tokens stored in PostgreSQL
- Auth cookie is HTTP-only, Secure, SameSite=Lax (never exposed to JS)
- `ALLOWED_EMAIL` env var — if set, that email bypasses the invite requirement on first login (owner bootstrap)
- Invite token flow — invite token stored in session before OAuth, consumed on callback to allow new user creation
- Silent refresh via `SilentRefreshMiddleware` — transparently renews expired auth cookies using stored refresh tokens
- `fintrak_uid` long-lived cookie stores the user GUID
- `POST /auth/logout` revokes all refresh tokens and clears both cookies
- All controllers extract `UserId` from `ClaimTypes.NameIdentifier` claim — never from request body

## Invite System

Implemented in `FinTrak.Api/Controllers/InviteController.cs`:

- `POST /invites/create` [Authorize] — creates an Invite record, returns `{ link }` pointing to the validate endpoint
- `GET /invites/{token}` [AllowAnonymous] — validates token (exists, unused, not expired), stores token in session, redirects to `/api/auth/login`
- After OAuth callback: if session has `invite_token`, new user is created and invite is marked used
- If no invite token and user doesn't exist (and not ALLOWED_EMAIL): 403 "Access denied: no invite"
- Invite links generated from Settings page; 2-day expiry by default

## Backend Architecture

The backend follows a strict layered architecture. Controllers must never reference `FinTrakDbContext` directly.

**Layers:**
- `FinTrak.Core` — entities, interfaces, DTOs, utilities. No EF or infrastructure dependencies.
- `FinTrak.Infrastructure` — EF implementations: repositories (`Repositories/`), services (`Services/`), background services (`BackgroundServices/`), migrations, DbContext.
- `FinTrak.Api` — controllers, validators, mappings, DTOs, `Program.cs`.

**Interfaces** (all in `FinTrak.Core/Interfaces/`):
- `ITransactionRepository`, `IBudgetRepository`, `IBillRepository`, `IGoalRepository`, `IAccountRepository`, `ICategoryRepository` — all repository interfaces; implementations in `FinTrak.Infrastructure/Repositories/`
- `IPdfImportService` — PDF bank statement import via Claude Haiku
- `ITransactionNameMatchService` — trigram-based bulk category assignment by merchant name; `ApplyCategoryRequest` record defined alongside the interface
- `IBillDetectionService` — recurring bill pattern detection; `TransactionGroup` class defined alongside the interface (it's part of the return type contract)

**Validators** (all in `FinTrak.Api/Validation/`):
- `TransactionValidator`, `BillValidator`, `BudgetValidator`, `GoalValidator` — `AbstractValidator<T>` per entity
- Registered via `AddValidatorsFromAssemblyContaining<Program>()` — no per-validator registration needed
- Injected as concrete types into controllers (e.g. `TransactionValidator tValidator`), not as `IValidator<T>`
- Called with `await _validator.ValidateAsync(entity, cancellationToken)` before any DB writes

**Mappings** (all in `FinTrak.Api/Mappings/`):
- `AutoMapperProfile.cs` — Transaction, Budget, Bill, Goal, Category entity → DTO mappings
- `AccountProfile.cs` — Account entity → AccountDto (OfficialName fallback, Subtype as Type, Mask as Last4, AvailableBalance fallback)

**Logging:**
- Serilog registered as host logging provider via `builder.Host.UseSerilog(...)`
- Config in `appsettings.json` under `"Serilog"` key — Console sink, Information default, Warning for Microsoft/System namespaces
- All `ILogger<T>` injections route through Serilog automatically

**Swagger:**
- Swashbuckle registered via `AddSwaggerGen()` / `UseSwagger()` / `UseSwaggerUI()` in Development
- `Microsoft.AspNetCore.OpenApi` is NOT installed — it conflicts with Swashbuckle due to `Microsoft.OpenApi` version mismatch (2.x vs 1.x)
- `IFormFile` endpoints must use a wrapper model class with `[Consumes("multipart/form-data")]`; direct `IFormFile` parameters cause `SwaggerGeneratorException`

**CancellationToken:**
- All repository interface methods declare `CancellationToken cancellationToken = default`
- All controller actions declare `CancellationToken cancellationToken` — ASP.NET Core binds it from the request lifetime automatically
- Passed through to all EF `async` calls

## API Setup

`Program.cs` wires up:
- ForwardedHeaders middleware (required for HTTPS detection behind nginx/Cloudflare proxy)
- DbContext with Npgsql connection string from `.env`
- Serilog as host logging provider
- Cookie authentication (1-hour expiry, sliding)
- Session (15-minute idle timeout, used for PKCE `code_verifier` and `invite_token`)
- FluentValidation via `AddValidatorsFromAssemblyContaining<Program>()`
- All 6 repositories registered as `AddScoped<IInterface, Implementation>()`
- All services: `IPdfImportService`, `ITransactionNameMatchService`, `IBillDetectionService`
- AutoMapper with `AccountProfile` + `AutoMapperProfile`
- Swagger in Development only
- `UseHttpsRedirection` only in Development (production is behind nginx which handles TLS)
- `LoadEnv` skips keys already set in the environment (so Docker env vars take precedence over `.env`)
- Middleware order: ForwardedHeaders → HTTPS (dev only) → Session → Authentication → SilentRefresh → Authorization → Controllers

## Data API Endpoints — Complete

All endpoints require auth cookie (`[Authorize]`) and filter by the authenticated user's ID:

- `GET /accounts/get-accounts` — active accounts with balance, type, last4
- `GET /transactions/get-transactions` — all non-deleted transactions ordered by date descending
- `GET /budgets/get-budgets` — active budgets with `spent` computed for current period from transactions
- `GET /bills/get-bills` — active recurring bills
- `GET /goals/get-goals` — savings goals with progress
- `GET /categories/get-categories` — all categories
- `GET /reports/*` — spending reports and chart data

Write endpoints (`POST /budgets/add-budget`, `POST /bills/add-bill`, etc.) also set `UserId` from claims.

## Plaid Integration — Complete

Implemented in `FinTrak.Api/Controllers/PlaidController.cs`:

- `POST /plaid/link-token` — creates a Plaid link token for the frontend Link widget
- `POST /plaid/exchange-token` — idempotent: checks for existing PlaidItem/Account by Plaid ID before inserting
- `POST /plaid/sync` — cursor-based transaction sync (added/modified/removed), refreshes account balances
- Running in **production** environment — NFCU OAuth approved and working

## Frontend — Full Dashboard

React web app at `frontend/web/` using Vite + TypeScript + Tailwind CSS:

**Pages:**
- `src/pages/Login/Login.tsx` — Google OAuth redirect via `/api/auth/login`
- `src/pages/Dashboard/Dashboard.tsx` — accounts, transactions, budgets fetched in parallel on mount
- `src/pages/Transactions/Transactions.tsx` — full transaction list with manual entry
- `src/pages/Budgets/Budgets.tsx` — budget management
- `src/pages/Goals/Goals.tsx` — savings goals with drag-and-drop ordering
- `src/pages/Bills/Bills.tsx` — recurring bills management
- `src/pages/Reports/Reports.tsx` — spending charts (Recharts)
- `src/pages/Settings/Settings.tsx` — invite link generator (Generate + Copy)

**Key components:**
- `src/components/layout/Navbar.tsx` — Sync button with Plaid Link flow; states: idle/connecting/syncing/done/error
- `src/hooks/InactivityLogoutHook.tsx` — `<Timer timer={seconds} />` component; mounted in App.tsx with 1800s (30 min); uses `useRef` to avoid re-renders
- `src/api/client.ts` — base fetch wrapper with cookie credentials and `/api` prefix
- `src/api/invites.ts` — `createInvite()` → POST `/invites/create` → returns link string

**Infrastructure:**
- `src/App.tsx` — auth-gated routing; `<Timer timer={1800} />` mounted inside authenticated routes
- Vite proxy: `/api/*` → `https://localhost:7146` (local dev only)
- Plaid sign convention flipped for display: positive amount = debit = red, negative = credit = green

## Production Deployment

- Docker Compose: postgres + pgadmin + backend + frontend + cloudflared on internal bridge network
- nginx inside the `frontend` container serves the React build and reverse-proxies `/api/*` → `http://backend:8080/` (strips `/api` prefix)
- Cloudflare Tunnel (cloudflared container) exposes the frontend at fintrak.org — no open ports on the host
- `GOOGLE_REDIRECT_URI` is hardcoded to `https://fintrak.org/api/auth/callback` in docker-compose.yml
- `FRONTEND_URL` is hardcoded to `https://fintrak.org` in docker-compose.yml
- pgAdmin accessible at `localhost:5050` (port bound to host for local DB management)
- postgres accessible at `localhost:5432` for EF migrations during local dev

## Local Dev

- Run backend: `dotnet run --project backend/FinTrak.Api --launch-profile https` from repo root
- Run frontend: `npm run dev` from `frontend/web/`
- Local Windows PostgreSQL 18 service conflicts with Docker on port 5432 — disable with `Stop-Service postgresql-x64-18 -Force` if needed
- Run just the DB: `docker compose up postgres pgadmin -d`
- For EF migrations: DB must be running; run from `backend/FinTrak.Infrastructure/`

## Known Issues / Environment

- `ALLOWED_EMAIL` is set in `.env` and passed through docker-compose.yml — acts as owner bypass if DB is wiped and no users exist
- docker-compose.yml has a commented-out duplicate `# ALLOWED_EMAIL:` line above the active one — ignore it
- Debug logging (`Console.WriteLine` + `.LogTo`) still present in `Program.cs` — should be removed; Serilog now handles all structured logging

## Next Steps

- Remove debug logging (`Console.WriteLine` + `.LogTo`) from `Program.cs` — Serilog is now in place
- Build transaction deduplication pipeline
- Wire ProgressWidgets on Dashboard to real data (currently hardcoded)
- Add dashboard refresh after sync completes
- Add integration tests — xUnit + `WebApplicationFactory`; cover PDF import dedup and Plaid sync at minimum
- Add CI pipeline — GitHub Actions on push to `main`
- Make inactivity timeout configurable in Settings
- Mobile app (React Native)

## Key Constraints

- Solo developer — scope decisions should favor things that can realistically ship
- Personal use only — no multi-tenancy concerns for MVP
- Mobile-first UX, but desktop parity is a goal
- No existing finance tracking habit — low friction is critical to actual adoption
