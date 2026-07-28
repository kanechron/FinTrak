# FinTrak — TODO

## Bugs / Stability
- [x] **Bill detection coverage** — revisit detection logic; some recurring bills not surfacing for users with less transaction history or irregular amounts
- [ ] **Retire the per-PlaidItem SemaphoreSlim sync lock** — added to fix a race condition where overlapping sync triggers (manual click + webhook, or two rapid manual clicks) for the same PlaidItem could both read the same stale cursor and double-insert transactions. This lock only coordinates within a single process/container. It silently stops working the moment sync is triggered from outside the main backend process — e.g. a scheduled auto-sync moved to its own worker/container, a queue consumer, or horizontal scaling to multiple backend replicas. If any of that happens, replace it with a DB-level mechanism (Postgres advisory lock, or an atomic claim via conditional UPDATE on PlaidItems) that's visible across processes.
- [ ] **Backfill stale MerchantNameNormalized values** — fixed the sync bug where newly-inserted transactions computed this from the raw, noisy `Name` (bank ACH descriptor) instead of preferring the cleaned-up `MerchantName`, but existing rows synced before the fix still have the noisy value. Needs a one-time backfill (`MerchantNameNormalized = NormalizeName(MerchantName ?? MerchantNameRaw)`) for all historical transactions, or they'll keep failing fuzzy/trigram matches (bill history, bulk categorize-by-merchant) until each one happens to get touched by a future Modified sync event.


 
## Transactions
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [ ] **Dashboard payload limit** — Dashboard.tsx pulls all transactions; add a limit/offset so only the most recent N are fetched on load
- [ ] **CSV/Excel import** — complement existing export; useful for users migrating from other finance apps
- [ ] **Bulk category assignment** — select multiple transactions and assign a category in one action
- [ ] **De-normalize merchant names** — normalized names are stored all-lowercase; convert to Title Case for display

## Bills
- [x] **Manual bill status bug** — manually created bills are auto-set to Pending; should default to Accepted
- [ ] **Add Bill modal category list** — shows all categories in one flat dropdown; split into parent/subcategory lists like the Transactions modal
- [x] **Bill history match logic** — the dropdown arrow on a bill shows matching transactions by category (getTransactionsByCategory); rework to match by the bill's NAME and AMOUNT instead
- [x] **Bill history quick-hide** — when the bill history dropdown is expanded, add a quick collapse button at the bottom of the transaction list so users don't have to scroll back up to the 3-dot menu to hide it

## Reports
- [ ] **Projected monthly outcome** — estimated income (detected from pay period frequency) minus confirmed bills; designed to give a directional picture of future financial health, not exact figures
- [x] **Date range picker** — let users scope reports to a custom date range
- [ ] **Net worth snapshot** — account balances (assets) minus outstanding bills (liabilities)

## AI
- [ ] **AI budgeting assistant** — user inputs a goal (or pulls from existing Budget/Goal items) and Claude returns a personalized plan to reach it; consider what data to pass as context (spending history, bills, income estimate)

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once

## UX
- [ ] **Apply-on-submit filters** — Transactions/Reports filters currently re-fetch on every keystroke/toggle; require a button push to apply so filter changes don't hammer the server
- [ ] **Error pages** — dedicated 404, 500, and auth-error pages/components
- [ ] **UI redesign** — navigation overhaul and visual refresh; evaluate light mode or theme toggle
- [ ] **Loading skeletons** — replace blank states during fetch with skeleton loaders
- [ ] **Toast notifications** — user feedback when sync completes, bill accepted, budget saved, etc.; most actions are currently silent
- [ ] **Onboarding flow** — first-time users land on an empty dashboard with no guidance; short setup wizard (link bank → first sync → add a budget) to reduce drop-off
- [ ] **Webpage title and favicon** — browser tab still shows the Vite default; set a proper `<title>` and favicon

## Docs
- [ ] **README: How to use** — walkthrough of core flows (sync, budgets, bills, goals, reports) aimed at a new user
- [ ] **Disclaimer (app UI)** — added to README; still needed in the app itself (footer or onboarding screen): FinTrak is a personal project, not a financial advisory tool; data shown is for informational purposes only and should not be taken as financial advice

## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [x] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`
- [ ] **Frontend lint cleanup** — ~23 pre-existing ESLint errors across Reports.tsx, Transactions.tsx, Welcome.tsx (unused vars, `react-hooks/set-state-in-effect`, `react-hooks/static-components`); lint currently runs in CI as non-blocking (`continue-on-error`) until this is cleared, then it should become a hard gate
- [x] **Run Prettier across the frontend** — `npm run format`/`format:check` scripts added and the codebase reformatted; format check is now a hard gate in CI

## Platform
- [x] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
- [ ] **Push notifications** — bill due date reminders; pairs with mobile app
- [ ] **Full data export** — let users export all their data as JSON for portability and backup
