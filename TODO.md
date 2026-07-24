# FinTrak — TODO

## Bugs / Stability
- [x] **Bill detection coverage** — revisit detection logic; some recurring bills not surfacing for users with less transaction history or irregular amounts


 
## Transactions
- [x] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [x] **Separate categories** — all categories appear in the same dropdown under the Add Transaction modal
- [ ] **Dashboard payload limit** — Dashboard.tsx pulls all transactions; add a limit/offset so only the most recent N are fetched on load
- [ ] **CSV/Excel import** — complement existing export; useful for users migrating from other finance apps
- [ ] **Bulk category assignment** — select multiple transactions and assign a category in one action
- [x] **Remove Categories column** — dashboard transactions table (RecentTransactions.tsx) shows a Categories column that shouldn't be there
- [ ] **De-normalize merchant names** — normalized names are stored all-lowercase; convert to Title Case for display

## Bills
- [ ] **Manual bill status bug** — manually created bills are auto-set to Pending; should default to Accepted
- [ ] **Add Bill modal category list** — shows all categories in one flat dropdown; split into parent/subcategory lists like the Transactions modal
- [ ] **Bill history match logic** — the dropdown arrow on a bill shows matching transactions by category (getTransactionsByCategory); rework to match by the bill's NAME and AMOUNT instead
- [ ] **Bill history quick-hide** — when the bill history dropdown is expanded, add a quick collapse button at the bottom of the transaction list so users don't have to scroll back up to the 3-dot menu to hide it

## Reports
- [x] **Clickable chart segments** — clicking a category slice or bar navigates to the transactions that make it up
- [ ] **Projected monthly outcome** — estimated income (detected from pay period frequency) minus confirmed bills; designed to give a directional picture of future financial health, not exact figures
- [ ] **Date range picker** — let users scope reports to a custom date range
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
