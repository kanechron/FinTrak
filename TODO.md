# FinTrak — TODO

## Bugs / Stability
- [ ] **Bill detection — NormalizeName noise stripping** — NFCU prefixes many transactions with "ach transaction", "pos debit visa check card 1744", trailing reference numbers, etc.; strip these in `NormalizeName()` so "ach transaction erie ins group eriexpspay 7135227986 ach debit" collapses to "erie ins group" before grouping; this is the root fix for Erie Insurance and similar bills not clustering correctly
- [ ] **Bill detection — count threshold** — with only 90 days of history a monthly bill appears ~2-3 times; consider lowering minimum from 3 to 2 or making it dynamic based on the date range pulled
- [ ] **Remove `[Auto Bill]` console logs** from `BillDetectionService.cs` once detection is working correctly
- [ ] **Remove Welcome.tsx console logs** added during Plaid first-sync debugging

 
## Transactions
- [ ] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [ ] **Separate categories** — all categories appear in the same dropdown under the Add Transaction modal
- [ ] **Dashboard payload limit** — Dashboard.tsx pulls all transactions; add a limit/offset so only the most recent N are fetched on load
- [ ] **CSV/Excel import** — complement existing export; useful for users migrating from other finance apps
- [ ] **Bulk category assignment** — select multiple transactions and assign a category in one action

## Reports
- [ ] **Clickable chart segments** — clicking a category slice or bar navigates to the transactions that make it up
- [ ] **Projected monthly outcome** — estimated income (detected from pay period frequency) minus confirmed bills; designed to give a directional picture of future financial health, not exact figures
- [ ] **Date range picker** — let users scope reports to a custom date range
- [ ] **Net worth snapshot** — account balances (assets) minus outstanding bills (liabilities)

## AI
- [ ] **AI budgeting assistant** — user inputs a goal (or pulls from existing Budget/Goal items) and Claude returns a personalized plan to reach it; consider what data to pass as context (spending history, bills, income estimate)

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once

## UX
- [ ] **Error pages** — dedicated 404, 500, and auth-error pages/components
- [ ] **UI redesign** — navigation overhaul and visual refresh; evaluate light mode or theme toggle
- [ ] **Loading skeletons** — replace blank states during fetch with skeleton loaders
- [ ] **Toast notifications** — user feedback when sync completes, bill accepted, budget saved, etc.; most actions are currently silent
- [ ] **Onboarding flow** — first-time users land on an empty dashboard with no guidance; short setup wizard (link bank → first sync → add a budget) to reduce drop-off

## Docs
- [ ] **README: How to use** — walkthrough of core flows (sync, budgets, bills, goals, reports) aimed at a new user
- [ ] **Disclaimer** — add to README and the app UI (footer or onboarding screen): FinTrak is a personal project, not a financial advisory tool; data shown is for informational purposes only and should not be taken as financial advice

## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [ ] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
- [ ] **Push notifications** — bill due date reminders; pairs with mobile app
- [ ] **Full data export** — let users export all their data as JSON for portability and backup
