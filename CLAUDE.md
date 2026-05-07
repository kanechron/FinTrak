# FinTrak — Claude Context

## Project Overview

FinTrak is a personal finance tracker built for James's own use and as a portfolio project. The goal is something genuinely useful day-to-day that also demonstrates strong engineering skills. Currently in the **early development phase** — backend scaffolded, entity classes in progress.

## Tech Stack

- **Frontend:** React (web) + React Native (mobile)
- **Backend:** C# with ASP.NET Core
- **Database:** PostgreSQL (cloud) + SQLite (local offline)
- **Bank integration:** Plaid API — handles all bank connectivity, transaction pulls, pending transactions, and balances
- **AI/ML:** Rule-based normalization + FuzzySharp for merchant name matching, Claude Haiku API as fallback for low-confidence cases

## What's Been Set Up

- `docker-compose.yml` — PostgreSQL (port 5432) + pgAdmin (port 5050) running locally
- `.env` / `.env.example` — credentials managed via environment variables, `.env` is gitignored
- Both Docker containers are confirmed running
- Git repo with `main` and `dev` branches — all active work happens on `dev`
- ASP.NET Core backend scaffolded: `FinTrak.Api`, `FinTrak.Core`, `FinTrak.Infrastructure`
- NuGet packages installed: Npgsql EF Core, SQLite, Google Auth, Going.Plaid, FuzzySharp, Anthropic.SDK, Serilog

## Entity Classes (in progress)

Located in `backend/FinTrak.Core/Entities/`:

- `User.cs` — Google ID, email, display name, timestamps
- `Category.cs` — Id, Name, IsSystem flag
- `Transaction.cs` — full transaction record with dedup fields, soft delete, Plaid + manual support
- `DedupStatus.cs` — enum: Accepted, Flagged, Discarded

Still to create: `RefreshToken`, `PlaidItem`, `Account`, `Budget`, `Goal`, `Bill`, `MerchantAlias`, `SyncQueue`

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

## Auth Plan (brainstormed, not yet built)

Google OAuth 2.0:
- PKCE flow for secure code exchange
- Refresh + access token pair from Google
- Refresh tokens stored server-side in PostgreSQL only
- Access tokens in HTTP-only, Secure, SameSite cookies (never exposed to JS)
- Silent token refresh on expiry; graceful re-auth prompt if refresh token is revoked
- HTTPS enforced from the start

## Next Steps

- Finish remaining entity classes (RefreshToken, PlaidItem, Account, Budget, Goal, Bill, MerchantAlias, SyncQueue)
- Create `FinTrakDbContext.cs` and wire up EF Core
- Run `InitialSchema` migration and verify in pgAdmin
- Set up Google OAuth 2.0 (token receipt, validation, lifecycle, storage, deletion)
- Wire up Plaid integration

## Key Constraints

- Solo developer — scope decisions should favor things that can realistically ship
- Personal use only — no multi-tenancy concerns for MVP
- Mobile-first UX, but desktop parity is a goal
- No existing finance tracking habit — low friction is critical to actual adoption
