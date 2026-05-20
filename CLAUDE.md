# FinTrak — Claude Context

## Project Overview

FinTrak is a personal finance tracker built for James's own use and as a portfolio project. The goal is something genuinely useful day-to-day that also demonstrates strong engineering skills. Currently in **active full-stack development** — backend endpoints live, React dashboard wired to real data, Plaid production connection working with NFCU.

## Tech Stack

- **Frontend:** React (web) + React Native (mobile)
- **Backend:** C# with ASP.NET Core
- **Database:** PostgreSQL (cloud) + SQLite (local offline)
- **Bank integration:** Plaid API — handles all bank connectivity, transaction pulls, pending transactions, and balances
- **AI/ML:** Rule-based normalization + FuzzySharp for merchant name matching, Claude Haiku API as fallback for low-confidence cases

## What's Been Set Up

- `docker-compose.yml` — PostgreSQL (port 5432) + pgAdmin (port 5050) running locally
- `.env` / `.env.example` — credentials managed via environment variables, `.env` is gitignored
- Both Docker containers confirmed running
- Git repo with `main`, `dev`, `feature/frontend-web`, and `feature/backend` branches
- ASP.NET Core backend scaffolded: `FinTrak.Api`, `FinTrak.Core`, `FinTrak.Infrastructure`
- NuGet packages installed: Npgsql EF Core, SQLite, Google.Apis.Auth, Going.Plaid, FuzzySharp, Anthropic.SDK, Serilog, dotenv.net

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

## Database

- `FinTrakDbContext.cs` in `FinTrak.Infrastructure/Persistance/`
- `FinTrakDbContextFactory.cs` — design-time factory for EF migrations, reads `.env`
- `InitialSchema` migration applied and verified in pgAdmin
- Soft delete filters, unique indexes, and enum-as-string storage configured

## Auth — Complete

Google OAuth 2.0 implemented in `FinTrak.Api/Controllers/AuthController.cs`:

- PKCE flow — `GET /auth/login` builds the Google auth URL, `GET /auth/callback` exchanges the code
- Refresh + access token pair from Google; refresh tokens stored in PostgreSQL
- Auth cookie is HTTP-only, Secure, SameSite=Lax (never exposed to JS)
- Email allowlist via `ALLOWED_EMAIL` env var — rejects unauthorized users before any DB writes
- Silent refresh via `SilentRefreshMiddleware` — transparently renews expired auth cookies using stored refresh tokens
- `fintrak_uid` long-lived cookie stores the user GUID to identify sessions after cookie expiry
- `POST /auth/logout` revokes all refresh tokens and clears both cookies

## API Setup

`Program.cs` wires up:
- DbContext with Npgsql connection string from `.env`
- Cookie authentication (1-hour expiry, sliding)
- Session (15-minute idle timeout, used only for PKCE code_verifier)
- Middleware order: HTTPS → Session → Authentication → SilentRefresh → Authorization → Controllers

## Core Features (priority order)

1. **Expense tracking** — automatic bank sync via Plaid, manual entry as fallback for cash
2. **Budget planning** — category budgets, visual progress bars, alerts at 80%
3. **Savings goals** — named goals, contribution tracking, milestone celebrations
4. **Bill reminders** — recurring bills, due-date notifications, payment history

## Transaction Logger Design

- Primary flow: Plaid pulls transactions automatically (including pending)
- Manual sync can be triggered at any time
- Manual entry exists as a fallback for cash or pre-settlement logging
- Deduplication pipeline: rule-based normalization → FuzzySharp → Claude Haiku fallback → hash check → insert or discard

## Plaid Integration — Complete

Implemented in `FinTrak.Api/Controllers/PlaidController.cs`:

- `POST /plaid/link-token` — creates a Plaid link token for the frontend Link widget
- `POST /plaid/exchange-token` — exchanges public token, creates PlaidItem + Accounts records
- `POST /plaid/sync` — cursor-based transaction sync (added/modified/removed)
- Running in **production** environment — NFCU OAuth approved and working

## Data API Endpoints — Complete

All endpoints require auth cookie (`[Authorize]`), routes use `[controller]/get-[controller]` pattern:

- `GET /accounts/get-accounts` — active accounts with balance, type, last4
- `GET /transactions/get-transactions` — all non-deleted transactions ordered by date descending
- `GET /budgets/get-budgets` — active budgets with `spent` computed for current period from transactions

## Frontend — Dashboard Wired to Real Data

React web app at `frontend/web/` using Vite + TypeScript + Tailwind CSS:

- `src/App.tsx` — auth-gated routing via React Router; checks auth on mount, redirects to `/login` if unauthenticated
- `src/pages/Login/Login.tsx` — Google OAuth redirect
- `src/pages/Dashboard/Dashboard.tsx` — fetches accounts, transactions, budgets in parallel via `Promise.all` on mount; passes real data to components
- `src/components/Navbar.tsx` — Sync button with Plaid Link flow: checks if accounts exist → if not, opens Plaid Link widget to connect bank → exchanges token → syncs; states: idle/connecting/syncing/done/error
- `src/components/BalanceCard.tsx` — total balance + per-account breakdown
- `src/components/ProgressWidget.tsx` — reusable progress bar widget (Spent This Month, Savings Goal, Joint Account)
- `src/components/RecentTransactions.tsx` — shows 10 most recent, expandable to all; Plaid sign convention flipped for display (positive = debit = red, negative = credit = green)
- `src/components/BudgetList.tsx` — per-category budget progress bars
- `src/components/ProgressBar.tsx` — color-coded bar (green <70%, yellow <90%, red ≥90%)
- `src/api/client.ts` — base fetch wrapper with cookie credentials
- `src/api/accounts.ts`, `transactions.ts`, `budgets.ts` — typed fetch functions with interfaces matching API response shape
- Vite proxy: `/api/*` → `https://localhost:7146`

## Known Issues / Environment

- Local Windows PostgreSQL 18 service conflicts with Docker on port 5432 — disable it with `Stop-Service postgresql-x64-18 -Force` if it starts up again
- Run backend: `dotnet run --project backend/FinTrak.Api --launch-profile https` from repo root
- Run frontend: `npm run dev` from `frontend/web/`

## Next Steps

- Build transaction deduplication pipeline
- Wire ProgressWidgets to real data (currently hardcoded values)
- Add dashboard refresh after sync completes
- Mobile app (React Native)

## Key Constraints

- Solo developer — scope decisions should favor things that can realistically ship
- Personal use only — no multi-tenancy concerns for MVP
- Mobile-first UX, but desktop parity is a goal
- No existing finance tracking habit — low friction is critical to actual adoption
