# FinTrak

**Live:** [fintrak.org](https://fintrak.org)

>**Status & License**  
![Status](https://img.shields.io/badge/Status-Alpha-orange?style=for-the-badge)  
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)  
![CI](https://github.com/kanechron/FinTrak/actions/workflows/ci.yml/badge.svg)

>**Platform**  
![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

>**Tech Stack**  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)  
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)  
![Plaid](https://img.shields.io/badge/Plaid-00D64F?style=for-the-badge&logoColor=white)

## What is it?

With the economy so volatile it's difficult to reliably track money, but it's even more difficult to be honest with your spending. FinTrak was built to help make that easier. It connects directly to your bank via Plaid, syncs transactions automatically, and gives you a clear picture of your spending, budgets, bills, and savings goals all in one place.

It was also built out of a desire to own the stack entirely. Most finance apps send your data to third-party servers without full transparency. With FinTrak, your financial data stays on infrastructure you control. Beyond the personal use case, it's been an exercise in real-world app deployment and backend architecture; designed to be something worth maintaining, not just a demo.

> **Disclaimer:** FinTrak is a personal project, not a financial advisory tool. Data shown is for informational purposes only and should not be taken as financial advice.

## Features

- **Automatic bank sync** via Plaid — transactions, balances, and accounts stay current with cursor-based incremental sync
- **Transaction tracking** — auto-categorized from Plaid's Personal Finance Category taxonomy; manual entry supported
- **Budget management** — per-category budgets with recurring periods (weekly, monthly, yearly), live spending progress, automatic period rollover
- **Savings goals** — named goals with target amounts, priority-based balance allocation, drag-and-drop reordering
- **Bills tracking** — recurring bill management with auto-detection from transaction history; permanent accept/decline per suggestion
- **Spending reports** — category breakdown, monthly trends, and cash flow charts with CSV/Excel export
- **PDF bank statement import** — upload a PDF and Claude Haiku extracts and imports transactions automatically
- **Google OAuth** — PKCE flow, HTTP-only cookie auth, silent token refresh
- **Inactivity logout** — automatic session timeout after 30 minutes of inactivity
- **Mobile-responsive UI** — full mobile web experience across every page, with touch-friendly navigation, bottom-sheet modals, and inline-expanding filters

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts |
| Backend | C# 13, ASP.NET Core 9, Entity Framework Core |
| Database | PostgreSQL, EF migrations |
| Auth | Google OAuth 2.0 (PKCE flow), HTTP-only cookie sessions |
| Bank data | Plaid API (production) |
| AI/ML | Claude Haiku (PDF bank statement import) |
| Export | MiniExcel (CSV + XLSX) |
| Logging | Serilog |
| Drag & drop | @dnd-kit |

## Architecture Highlights

- **Layered architecture** — `FinTrak.Core` (entities, interfaces, DTOs), `FinTrak.Infrastructure` (EF repositories, services, background services), `FinTrak.Api` (controllers, validators, mappings); controllers never reference DbContext directly
- **Cursor-based Plaid sync** — only fetches new/changed transactions since last sync, no redundant API calls
- **Soft deletes with retention** — records are flagged inactive rather than hard-deleted; a background service permanently removes them after a 60-day retention window
- **Recurring budget rollover** — a daily background service automatically advances start/end dates on recurring budgets when their period expires
- **Bill auto-detection** — background service scans transaction history for recurring merchant/amount patterns and surfaces them as suggestions; accepted/declined status persists to suppress re-detection
- **Per-IP rate limiting** — partitioned fixed-window limiters via ASP.NET Core middleware; global baseline (100 req/min) with tighter named policies on auth (20/5min), expensive operations (10/min), and exports (20/min)
- **Health checks** — `/health` endpoint backed by a live Npgsql probe; wired to Docker Compose `healthcheck` for container self-healing
- **Silent refresh middleware** — transparently renews expired auth cookies using stored refresh tokens, no user interaction required
- **Error handling middleware** — all unhandled exceptions return structured JSON; model binding errors surface field-level detail
- **Per-item sync locking** — a keyed semaphore prevents overlapping sync triggers (manual sync + webhook, or rapid repeat syncs) for the same bank connection from racing and double-inserting transactions
- **CI pipeline** — GitHub Actions builds and runs the test suite on every push and pull request against `main`

## Running Locally

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- PostgreSQL (or Docker)
- Plaid developer account
- Google OAuth credentials
- Anthropic API key (for PDF import)

### Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your credentials
3. Start PostgreSQL (or run `docker compose up postgres -d`)
4. Apply database migrations:
   ```
   dotnet ef database update --project backend/FinTrak.Infrastructure --startup-project backend/FinTrak.Api
   ```
5. Start the backend:
   ```
   dotnet run --project backend/FinTrak.Api --launch-profile https
   ```
6. Start the frontend:
   ```
   cd frontend/web && npm install && npm run dev
   ```
7. Open `https://localhost:5173`

### Running Tests

```
dotnet test backend/FinTrak.Tests/FinTrak.Tests.csproj
```

### Docker (production-style)

```
docker compose up --build
```

The full stack (Postgres, backend, frontend, Cloudflare Tunnel) runs on an internal bridge network. The frontend nginx container reverse-proxies `/api/*` to the backend.

## Project Status

Alpha — core features are functional with real bank data (NFCU production connection active).

The ultimate purpose of FinTrak is on-the-go financial awareness. The next major additions planned are:

- **iOS app** — React Native port for the App Store
- **Configurable settings** — per-user preferences (transaction page size, inactivity timeout, etc.)
- **In-app email** — share reports, graphs, and exports directly from the app
- **Rules engine** — automatically categorize transactions by merchant name
- **Integration tests** — xUnit + WebApplicationFactory, covering PDF import and Plaid sync end-to-end

---

Built by [kanechron](https://github.com/kanechron)
