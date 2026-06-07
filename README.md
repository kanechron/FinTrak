# FinTrak

>**Status & License**  
![Status](https://img.shields.io/badge/Status-Alpha-orange?style=for-the-badge)  
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

>**Platform**  
![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

>**Tech Stack**  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)  
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)  
![Plaid](https://img.shields.io/badge/Plaid-00D64F?style=for-the-badge&logoColor=white)

## What is it?

FinTrak is a personal finance tracker built for real day-to-day use. It connects directly to your bank via Plaid, syncs transactions automatically, and gives you a clear picture of your spending, budgets, and savings goals — all in one dashboard.

## Features

- **Automatic bank sync** via Plaid — transactions, balances, and accounts stay current
- **Transaction tracking** — categorized automatically from Plaid's Personal Finance Category taxonomy
- **Budget management** — per-category or all-spending budgets with recurring support (weekly, monthly, yearly), live spending progress bars
- **Savings goals** — named goals linked to specific accounts, priority-based balance allocation, drag-and-drop reordering
- **Google OAuth** — secure login with HTTP-only cookie auth, silent token refresh, email allowlist

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | C# 13, ASP.NET Core 9, Entity Framework Core |
| Database | PostgreSQL (cloud), EF migrations |
| Auth | Google OAuth 2.0 (PKCE flow), cookie-based sessions |
| Bank data | Plaid API (production) |
| Drag & drop | @dnd-kit |

## Architecture Highlights

- **Cursor-based Plaid sync** — only fetches new/changed transactions since last sync, no redundant pulls
- **Soft deletes** — budgets and goals are flagged inactive rather than hard-deleted, with a background service for cleanup after a 60-day retention window
- **Recurring budget rollover** — a daily background service automatically advances start/end dates on recurring budgets when their period expires
- **Client-side goal allocation** — available balances are distributed across goals in priority order on the frontend, keeping the backend projection simple
- **Error handling middleware** — all unhandled exceptions return structured JSON; model binding errors surface field-level detail

## Running Locally

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- PostgreSQL (or Docker)
- Plaid developer account
- Google OAuth credentials

### Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your credentials
3. Start PostgreSQL (or run `docker-compose up -d`)
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

## Project Status

Alpha — core features are functional with real bank data. The following are planned for future development:

- Bill reminders
- Automatic recurring purchase/subscription detection
- Manual transaction entry
- Mobile app (React Native)
- Reporting and charts
- Transaction recategorization UI

