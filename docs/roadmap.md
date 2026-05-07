# FinTrak — Application Roadmap

## Context

No application code exists yet. Docker (PostgreSQL + pgAdmin) is running, CLAUDE.md documents the full plan, and the repo has `main`/`dev` branches. This roadmap defines what to build, in what order, and why that order matters. Everything is sequenced by dependency — nothing is built before the thing it depends on exists.

---

## Phase 0 — Pre-Coding Preparation

**Do these before writing any application code.**

### 0.1 — Repo Structure

Adopt a monorepo layout. Delete the root-level `package.json` and `node_modules` — they don't belong at the root.

```
FinTrak/
  backend/        ← ASP.NET Core solution
  frontend/
    web/          ← React + Vite
    mobile/       ← React Native + Expo
  docs/
  docker-compose.yml
  CLAUDE.md / README.md
```

### 0.2 — Tooling to Verify

- .NET SDK 9 (`dotnet --version`)
- Node.js 22 LTS
- EF Core CLI (`dotnet tool install --global dotnet-ef`)
- Expo CLI (use `npx expo`, not global install)

### 0.3 — Expand `.env.example`

Add all secrets before writing any backend code so nothing ever gets hardcoded:

- `POSTGRES_CONNECTION_STRING`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox`
- `ANTHROPIC_API_KEY`
- `CORS_ORIGINS`

### 0.4 — API Contract Sketch (`docs/api.md`)

Write the core routes before touching any controller. Forces data model clarity early.
Key routes: `/auth/*`, `/transactions`, `/plaid/*`, `/budgets`, `/goals`, `/bills`

---

## Phase 1 — Data Models

Design all entities before writing any migration. Add them in dependency order across separate migrations (not one giant migration).

| Migration | Tables |
|---|---|
| `InitialSchema` | Users, RefreshTokens, Categories (seed system categories) |
| `AddPlaid` | PlaidItems, Accounts |
| `AddTransactions` | Transactions, MerchantAliases |
| `AddBudgets` | Budgets |
| `AddGoalsAndBills` | Goals, Bills |
| `AddSyncQueue` | SyncQueue |

**Key design decisions:**

- `Transactions.amount` — always positive; credits are negative amounts (no separate `type` field)
- `Transactions.dedup_hash` — SHA-256 of `(amount + date + normalized_merchant)`
- `RefreshTokens` stores a hash of the token, never plaintext
- `PlaidItems.access_token` — encrypted at rest (AES-256, key from env)
- SQLite (mobile offline) gets: Transactions, Accounts, Categories, MerchantAliases, Goals, SyncQueue — **not** auth tokens or Plaid credentials

---

## Phase 2 — Backend Build Order

### Scaffold

```
backend/
  FinTrak.Api           ← controllers, middleware, Program.cs
  FinTrak.Core          ← entities, interfaces, DTOs (no external dependencies)
  FinTrak.Infrastructure ← EF Core, Plaid client, Haiku client, services
```

Key NuGet packages (install at scaffold time):
`Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.AspNetCore.Authentication.Google`, `Going.Plaid`, `FuzzySharp`, `Anthropic.SDK`, `Serilog.AspNetCore`

### Build Sequence

**1. EF Core + Migrations** — define entities in `FinTrak.Core/Entities/`, map in `FinTrakDbContext.cs`, run `InitialSchema` migration, verify in pgAdmin.

**2. Google OAuth** *(must come before any feature work)*

- `GET /auth/google` → redirect to Google
- `GET /auth/google/callback` → exchange code (PKCE), upsert User, store refresh token hash, issue HTTP-only cookie
- `POST /auth/refresh` → validate DB token, issue new cookie
- `DELETE /auth/logout` → revoke token row, clear cookie
- Verify full round-trip before moving on

**3. Plaid Integration**

- `POST /plaid/link-token` → create Link token for frontend
- `POST /plaid/exchange` → store access token (encrypted) in PlaidItems
- `POST /plaid/sync` → call Plaid `/transactions/sync` with cursor, hand results to dedup pipeline
- `POST /plaid/webhook` → receive Plaid push, trigger background sync (`IHostedService`)
- Use **sandbox mode from day one** — never mock Plaid responses

**4. Deduplication Pipeline** (`TransactionNormalizationService` in Infrastructure)

```
NormalizeRaw → CheckAliasCache → FuzzyMatch (≥85 score) → HaikuFallback → HashCheck → Insert or Discard
```

- Haiku wrapped behind `IMerchantNormalizer` interface (mockable in tests)
- On Haiku timeout/failure: insert with `dedup_status = 'flagged'`, don't block sync
- Cache results in `MerchantAliases` so Haiku is only called for truly new merchants
- Haiku model: `claude-haiku-4-5`, single-line prompt, no system prompt

**5. Transactions CRUD** — paged list (cursor-based), manual entry runs through dedup pipeline, soft deletes only

**6. Budgets** — `spent` is computed on read (join to Transactions), 80% threshold returned as field in DTO

**7. Goals** — user manually updates `current_amount` for MVP; auto-linking is v1.5

**8. Bills** — `is_due_soon` computed on read (due within 7 days)

---

## Phase 3 — Frontend Build Order

**Do not start frontend until backend auth + transactions endpoints are working.**

### Web (React + Vite + TypeScript)

```
cd frontend/web/
npm create vite@latest . -- --template react-ts
```

Install: `react-router-dom`, `@tanstack/react-query`, `axios`, `recharts`, `tailwindcss`

Build order:

1. **Auth shell** — Google redirect, callback page, Axios 401 interceptor (silent refresh), protected route wrapper
2. **Dashboard shell** — layout only (sidebar, nav, header) — no data yet
3. **Transactions** — list, filters, manual add form
4. **Budgets** — progress bars, 80% highlight
5. **Goals** — goal cards with progress
6. **Bills** — sorted by due date, due-soon indicator

### Mobile (React Native + Expo)

Start after web app is functional — it's a second client for the same backend.

```
cd frontend/mobile/
npx create-expo-app fintrak --template blank-typescript
```

- Use `expo-router` for navigation
- Auth: `expo-web-browser` for OAuth flow + `expo-secure-store` for session token
- Backend issues a short-lived session token for mobile (detected via `X-Client: mobile` header) alongside the cookie flow for web
- Offline SQLite via `expo-sqlite`; sync via `expo-background-fetch`

---

## Phase 4 — Offline Sync

**Build after all features work online.**

- React Native writes to local SQLite first, then adds to `SyncQueue`
- Background task drains queue when online
- Conflict resolution: last-write-wins for most fields; server is authoritative on `dedup_hash` uniqueness
- Web does not need offline support for MVP — show a banner instead

---

## Key Sequencing Rules

1. **Auth before features** — every endpoint requires knowing who the user is
2. **Migrations before queries** — apply EF Core migrations before any controller reads the DB
3. **Plaid sandbox from day one** — real response shapes from the start
4. **Web before mobile** — web validates the API design; mobile benefits from lessons learned
5. **Online before offline** — solid features first, resilience second
6. **Dedup pipeline is infrastructure** — must exist before Plaid sync ships

---

## Milestones

| Milestone | Scope |
|---|---|
| **MVP** (~8 weeks) | Auth, Plaid sync (sandbox), dedup pipeline, transactions, budgets — web only |
| **v1.0** (~4 weeks) | Goals, bills, React Native app, cloud PostgreSQL (Railway/Fly.io) |
| **v1.5** (~4 weeks) | Offline sync, push notifications, charts, CSV export |

---

## Critical Files (first to create)

- `backend/FinTrak.Core/Entities/User.cs` — define this first
- `backend/FinTrak.Infrastructure/Persistence/FinTrakDbContext.cs` — EF Core context
- `backend/FinTrak.Api/Program.cs` — app bootstrap, all middleware registration
- `backend/FinTrak.Infrastructure/Services/TransactionNormalizationService.cs` — dedup pipeline
- `docs/api.md` — API contract sketch (write before any controller)
