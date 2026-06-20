# FinTrak — TODO

## Auth & Account
- [ ] **Account menu** — clicking the avatar (top-right) opens a dropdown with logout, settings, switch account
- [ ] **Open registration** — remove `ALLOWED_EMAIL` allowlist so any Google account can sign up
- [ ] **Auth improvements** — better error handling (session expiration, token refresh failures, etc.), security hardening across the auth flow
- [ ] **Sign-in UI** — make the login page more user-friendly

## Dashboard
- [ ] **"View All" transactions button** — transactions currently expand and change style when clicked; fix the behavior and styling

## Transactions
- [ ] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Pagination** — only load ~30 transactions at a time from the DB (limit configurable in settings)

## Bills
- [ ] **Related transactions** — currently filters by category only; add merchant name matching so only relevant transactions appear under each bill

## Reports
- [ ] **Category & Account filters** — wire up the existing placeholder filter buttons
- [ ] **Export** — export reports as PDF, Excel, or CSV
- [ ] **Import** — import a report (bank statement, CSV, etc.) and use AI (Claude) to categorize transactions automatically

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once (ties into pagination above)

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
- [ ] **Server deployment** — host the app on a server (backend + frontend + DB)
