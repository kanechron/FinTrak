# FinTrak — Project Context

>**Status & License**  
![Status](https://img.shields.io/badge/Status-In_Development-yellow?style=for-the-badge)  
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

>**Platform**  
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)  
![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

>**Tech Stack**  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)  
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)  
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)  
![Plaid](https://img.shields.io/badge/Plaid-00D64F?style=for-the-badge&logoColor=white)  
![Claude Haiku](https://img.shields.io/badge/Claude_Haiku-CC785C?style=for-the-badge&logoColor=white)

## What is it?

A personal finance tracker called FinTrak. The goal is to build something genuinely useful day-to-day, and that also makes a strong resume project.

## Tech Stack

- Frontend: React (web) + React Native (mobile)
- Backend: C# with ASP.NET Core
- Database: PostgreSQL/SQL Server (cloud) + SQLite (local offline)
- Data sync: offline-first with background sync queue to cloud
- Bank integration: Plaid API (transaction pull, pending transactions, account balances)
- AI/ML: Rule-based normalization + FuzzySharp for merchant matching, Claude Haiku API as fallback

## Core Features (in priority order)

1. Expense tracking — automatic bank sync via Plaid, manual entry as fallback for cash
2. Budget planning — set category budgets, visual progress, alerts at 80%
3. Savings goals — named goals with target amounts, contribution tracking, progress bars
4. Bill reminders — recurring bills, due-date notifications, payment history

## Transaction Logger

The primary flow is automatic: Plaid pulls transactions from connected bank/card accounts, including pending items. Manual sync can be triggered at any time. Manual entry exists as a fallback (cash, pre-settlement logging).

### Deduplication Pipeline

Duplicate detection runs on every ingest — handles both Plaid-vs-Plaid and Plaid-vs-manual conflicts:

1. Normalize merchant name (rule-based regex strips store numbers, location codes, transaction IDs)
2. Fuzzy match against known merchant aliases (FuzzySharp)
3. If confidence is low, fall back to Claude Haiku for normalization
4. Hash `(amount + date + normalized_merchant)` and check DB
5. Exact hash match → discard; near-match or same-day same-amount → flag for user review

## Target Usage Pattern

Light — a weekly check-in habit (~5 minutes). The home screen should answer:

- How am I doing on spending this week?
- Am I on track with savings goals?
- Any bills coming up in the next 7–10 days?

## Key UX Principles

- Low friction: automatic sync means no manual logging required for most transactions
- Forgiving: no guilt-trip if a week is missed
- Celebrate wins: acknowledge hitting savings milestones or staying under budget

## User Pain Points Being Solved

- Overspending without realizing it (automatic sync + budget alerts + weekly visibility)
- Struggling to save consistently (savings treated as a committed expense)
- No clear picture of where money goes (monthly category breakdown / charts)

## Resume Value

- Offline-first architecture with sync conflict resolution
- Financial data pipeline via Plaid integration
- AI-assisted merchant normalization with rule-based + fuzzy + LLM fallback
- Idempotent transaction ingestion (deduplication via hashing)
- User auth + data security
- Cross-platform (mobile + desktop)
- Real personal usage → iterated based on actual needs

## Next Steps (suggested milestones)

- MVP: Plaid integration + expense logging + category budgets, local storage only
- v1.0: Savings goals + bill reminders, cloud accounts, basic sync
- v1.5: Reporting dashboard, notifications, CSV export

## README

A README.md is planned. Markdown reference gathered. Will include: heading/description, badges (shields.io), feature checklist, install/usage instructions, tech stack section.
