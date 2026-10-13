# FinTrak — TODO

## Bugs / Stability
- [x] **Bill detection coverage** — revisit detection logic; some recurring bills not surfacing for users with less transaction history or irregular amounts
- [ ] **Only if FinTrak ever runs more than one copy of the backend: replace the per-PlaidItem SemaphoreSlim sync lock** — not needed today; FinTrak runs a single backend, where the lock works correctly. It prevents two overlapping syncs of the same PlaidItem (e.g. a double-clicked Sync button) from reading the same stale cursor and double-inserting transactions. The lock lives in one backend process's memory, so it can't see syncs running in a *different* process — a second backend replica, or sync moved into its own worker container. If that ever happens, replace it with a DB-level guard every process can see (Postgres advisory lock, or an atomic "claim" via conditional UPDATE on PlaidItems).
- [ ] **Revisit `NormalizeNameUtil`** — expect to keep extending/reworking this as new merchant name formats show up (bank descriptor quirks, new institutions, etc.); no backfill needed for the current data (a DB reset after the last fix re-synced everything through the corrected logic), but check `NormalizeNameUtil.cs` itself when this comes up again rather than assuming it's finished.
- [x] **Expand ErrorHandlingMiddleware with typed exceptions** — `ApiBaseController`'s `NotFoundError`/`ValidationError`/`ForbiddenError` helpers only work from inside a controller action. Code in `FinTrak.Infrastructure` (repositories/services) has no access to those helpers or to `IActionResult` at all, so a failure deep in business logic can currently only throw a plain `Exception`, which the middleware flattens into a generic 500 even when it's really a 404/400/403. Fix: define custom exception types (e.g. `NotFoundException`) that carry their intended status code, and have the middleware's catch block map recognized exception types to the right status/`ErrorResponseDto` instead of always returning 500.
- [x] **Goals has zero priority-uniqueness enforcement** — unlike Rules (`PriorityExistsAsync`), nothing stops two Goals from sharing the same `Priority` for a user; `GoalsController.UpdateGoal` just assigns whatever priority is sent, no check, no dedicated `GoalsService` either.
- [ ] **Full-list priority reindexing on every drag** — both Rules' and Goals' drag-and-drop reorder reassign sequential priorities to the *entire* list on every drag, not just the rows whose relative order actually changed; scales with total list size instead of the actual change.

## Design Improvements
Not bugs, nothing here is broken today. These restructure existing code so it's easier to extend.
- [ ] **Route all Plaid syncs through a dedicated sync channel** — today each sync trigger calls the sync logic directly. Instead, every trigger (manual Sync button, a future scheduled auto-sync configurable from Settings, Plaid webhooks, sync-after-linking) writes a "sync this PlaidItem" message to a `Channel`, and one `SyncBackgroundService` reads it and runs the sync, using the same pattern as the rules pipeline (scope per job, type-switch if more job types appear). Gains: one entry point and one place for sync logic; a single reader means two syncs of the same item never overlap; duplicate requests for an already-queued item can be skipped. Decide before building: (1) the manual Sync button currently waits for completion to show syncing/done/error, but with a channel the request returns immediately, so the UI needs job status (the existing `SyncQueue` entity could hold it for polling) or the request waits on its own job; (2) a single reader serializes every user's syncs, which is fine at current scale; adding parallel readers later means keeping a per-item guard (the existing semaphore);  
- [ ] **Settings per tab not implemented** — The user cannot change their settings and save. More Later. 
## Transactions
- [x] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [x] **CSV/Excel import** — complement existing export; useful for users migrating from other finance apps
- [x] **Bulk category assignment** — select multiple transactions and assign a category in one action
- [ ] **De-normalize merchant names** — normalized names are stored all-lowercase; convert to Title Case for display

## Bills
- [x] **Manual bill status bug** — manually created bills are auto-set to Pending; should default to Accepted
- [ ] **Add Bill modal category list** — shows all categories in one flat dropdown; split into parent/subcategory lists like the Transactions modal
- [x] **Bill history match logic** — the dropdown arrow on a bill shows matching transactions by category (getTransactionsByCategory); rework to match by the bill's NAME and AMOUNT instead
- [x] **Bill history quick-hide** — when the bill history dropdown is expanded, add a quick collapse button at the bottom of the transaction list so users don't have to scroll back up to the 3-dot menu to hide it
- [ ] **Bill period snapshots** — create a snapshot of every elapsed bill period, and add a section for viewing how each past bill period went

## Reports
- [ ] **Projected monthly outcome** — estimated income (detected from pay period frequency) minus confirmed bills; designed to give a directional picture of future financial health, not exact figures
- [x] **Date range picker** — let users scope reports to a custom date range

- [x] **Linear Trend Extrapolation** — per-category spending forecast on the Reports page (trailing 12-month window, OLS regression, leave-one-out outlier confidence check); see CLAUDE.md's "LTE Forecasting" section for the full design
- [x] **Spending anomaly detection** — Dashboard widget comparing each category's current-month running total against its trailing-12-month average via LTE's existing `CalculateDeviation`; scoped to category-level rather than per-merchant/transaction (merchant-name matching is unreliable) — see CLAUDE.md's "SAD (Spending Anomaly Detection)" section
- [ ] **Category drift over time** — track month-over-month percentage share per category, not just raw totals, to surface shifts like "dining went from 12% to 22% of spend over 6 months" that flat totals hide
- [ ] **Recurring-but-unflagged spend detection** — reuse `IBillDetectionService`'s trigram/frequency pattern logic against non-bill categories to surface recurring spend users haven't consciously tracked as a bill (subscriptions, weekly habits)
- [ ] **Income volatility / pay stability score** — for irregular income, a coefficient-of-variation-style metric on detected pay-period deposits; feeds a confidence band into the projected monthly outcome feature instead of a single point estimate
- [ ] **Category correlation** — Pearson correlation across monthly category totals to surface categories that move together (e.g. dining spikes tracking with entertainment spikes); reuses the same monthly aggregation pipeline as the trend regression work

## AI
- [ ] **AI budgeting assistant** — user inputs a goal (or pulls from existing Budget/Goal items) and Claude returns a personalized plan to reach it; consider what data to pass as context (spending history, bills, income estimate)

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once
- [ ] **Customizable user settings architecture** — same idea as the Rules field map (JSON stored and loaded per-key), but per-user and DB-backed instead of a static file, so it must be `AddScoped` (not `AddSingleton` like the field map) — one instance per request, loaded via the authenticated user's id (`GetUserId()`/`IHttpContextAccessor`), not shared across users. Consider a secondary ownership check on top of that as a safety net.

## UX
- [ ] **Apply-on-submit filters** — Transactions/Reports filters currently re-fetch on every keystroke/toggle; require a button push to apply so filter changes don't hammer the server
- [ ] **Error pages** — dedicated 404, 500, and auth-error pages/components
- [ ] **UI redesign** — navigation overhaul and visual refresh; evaluate light mode or theme toggle
- [ ] **Loading skeletons** — replace blank states during fetch with skeleton loaders
- [x] **Toast notifications** — user feedback when sync completes, bill accepted, budget saved, etc.; most actions are currently silent
- [ ] **Onboarding flow** — first-time users land on an empty dashboard with no guidance; short setup wizard (link bank → first sync → add a budget) to reduce drop-off
- [x] **Webpage title and favicon** — browser tab still shows the Vite default; set a proper `<title>` and favicon

## Docs
- [ ] **README: How to use** — walkthrough of core flows (sync, budgets, bills, goals, reports) aimed at a new user
- [ ] **Disclaimer (app UI)** — added to README; still needed in the app itself (footer or onboarding screen): FinTrak is a personal project, not a financial advisory tool; data shown is for informational purposes only and should not be taken as financial advice

## Testing
- [x] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [x] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`
- [x] **Frontend lint cleanup** — ~23 pre-existing ESLint errors across Reports.tsx, Transactions.tsx, Welcome.tsx (unused vars, `react-hooks/set-state-in-effect`, `react-hooks/static-components`); lint currently runs in CI as non-blocking (`continue-on-error`) until this is cleared, then it should become a hard gate
- [x] **Run Prettier across the frontend** — `npm run format`/`format:check` scripts added and the codebase reformatted; format check is now a hard gate in CI

## Platform
- [x] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
- [ ] **Push notifications** — bill due date reminders; pairs with mobile app
- [ ] **Full data export** — let users export all their data as JSON for portability and backup
