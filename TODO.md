# FinTrak — TODO

## Bugs / Stability
- [ ] **Only if FinTrak ever runs more than one copy of the backend: replace the per-PlaidItem SemaphoreSlim sync lock** — not needed today; FinTrak runs a single backend, where the lock works correctly. It prevents two overlapping syncs of the same PlaidItem (e.g. a double-clicked Sync button) from reading the same stale cursor and double-inserting transactions. The lock lives in one backend process's memory, so it can't see syncs running in a *different* process, such as a second backend replica or sync moved into its own worker container. If that ever happens, replace it with a DB-level guard every process can see (Postgres advisory lock, or an atomic "claim" via conditional UPDATE on PlaidItems).
- [ ] **Revisit `NormalizeNameUtil`** — expect to keep extending/reworking this as new merchant name formats show up (bank descriptor quirks, new institutions, etc.); no backfill needed for the current data (a DB reset after the last fix re-synced everything through the corrected logic), but check `NormalizeNameUtil.cs` itself when this comes up again rather than assuming it's finished.

## Design Improvements
Not bugs, nothing here is broken today. These restructure existing code so it's easier to extend.
- [ ] **Route all Plaid syncs through a dedicated sync channel** — today each sync trigger calls the sync logic directly. Instead, every trigger (manual Sync button, scheduled auto-sync from Settings, Plaid webhooks, sync-after-linking) writes a "sync this PlaidItem" message to a `Channel`, and one `SyncBackgroundService` reads it and runs the sync, using the same pattern as the rules pipeline (scope per job, type-switch if more job types appear). Gains: one entry point and one place for sync logic; a single reader means two syncs of the same item never overlap; duplicate requests for an already-queued item can be skipped. Decide before building: (1) the manual Sync button currently waits for completion to show syncing/done/error, but with a channel the request returns immediately, so the UI needs job status (the existing `SyncQueue` entity could hold it for polling) or the request waits on its own job; (2) a single reader serializes every user's syncs, which is fine at current scale, and adding parallel readers later means keeping a per-item guard (the existing semaphore); (3) in-memory queued jobs are lost on restart, which is acceptable for auto-sync, or persist jobs in `SyncQueue`. Keep the SemaphoreSlim inside the sync method regardless. This does not replace the cross-process DB-level guard in the item above, since a channel is still single-process.

## Settings
Finish these before the mobile port; several also cover App Store requirements (see App Store Readiness).
- [ ] **Per-user settings architecture** — the foundation for everything below. Same idea as the Rules field map (JSON stored and loaded per-key), but per-user and DB-backed instead of a static file, so it must be `AddScoped` (not `AddSingleton` like the field map), loaded via the authenticated user's id, not shared across users. Includes making each Settings tab actually save.
- [ ] **Notifications** — split *what* the user wants from *where* it's delivered. Preferences are per user and identical on every platform (bill reminders, SAD "running hot" alerts, sync failures, weekly report). Delivery channels are per device/address: a Web Push subscription per browser (desktop browsers and installed iOS web apps support it via a service worker), a mobile push token per phone, email. The backend checks preferences once and sends to every registered channel. Push must be optional and must not include sensitive details (e.g. "A bill is due tomorrow", not the amount or payee).
- [ ] **Auto-sync frequency** — user-configurable scheduled sync; becomes another trigger for the sync channel above.
- [ ] **Automatic reports** — scheduled background job (same pattern as the rules pipeline); decide delivery (in-app, email, push).
- [ ] **Configurable inactivity timeout** — currently hardcoded to 30 minutes in `App.tsx`.
- [ ] **Transaction page size** — configurable limit for how many transactions load at once.
- [ ] **In-app account deletion** — reachable from Settings; deletes the user's data and revokes their Plaid items (`DeleteUserAccountService` exists, so verify it's wired up end to end).
- [ ] **Privacy policy link** — accessible from inside the app, not just the website.
- [ ] **AI consent for PDF import** — explicit confirmation before a statement is sent to Anthropic's Claude for extraction.

## App Store Readiness
Requirements from Apple's App Review Guidelines. Whether FinTrak gets a public listing is still undecided; TestFlight/personal distribution is the fallback.
- [ ] **Decide on public listing** — 5.1.1(xi) says apps in banking/financial services "should be submitted by a legal entity... and not by an individual developer". Options: submit as an individual and respond if flagged, form an LLC (check state fees/requirements first), or skip the public listing and distribute via TestFlight.
- [ ] **Sign in with Apple** — required by 4.8 because Google Sign-In is offered.
- [ ] **Privacy policy page** — hosted page linked in App Store Connect and in the app (5.1.1(i)); must name what's collected, every third party it's shared with (Plaid, Anthropic), and how retention/deletion works. Also fill out the App Store privacy label.
- [ ] **Reviewer demo account** — 2.1(a) requires working login credentials; reviewers can't link a real bank through production Plaid, so seed a demo user with realistic data.
- [ ] **Specific review notes** — 2.3(a) rejects generic descriptions; spell out Plaid linking, AI PDF import, and the rules engine.
- [ ] **Check third-party terms** — confirm Plaid's and Anthropic's terms allow FinTrak's use of them (5.2.2).
- [ ] **In-app disclaimer** — already in the README; still needed in the app itself (footer or onboarding): FinTrak is a personal project, not a financial advisory tool, and data shown is for informational purposes only.

## Mobile App
- [ ] **Token-based auth for mobile** — the web app uses HTTP-only cookies, which don't carry over to a native app. Sign in through the system browser (PKCE), store tokens in secure storage, and have the API accept a bearer token alongside the cookie.
- [ ] **API compatibility policy** — older app versions will keep calling the API after updates ship, so decide on versioning or a backward-compatibility rule before the first release.
- [ ] **Production readiness** — confirm automated DB backups on the droplet, review at-rest protection for stored third-party credentials, remove the leftover debug logging in `Program.cs`, and deploy pending migrations (`GoalPriorityEnforcement`, `RulePriorityEnforcement`).
- [ ] **React Native app (iOS/Android)** — likely Expo. One codebase for both platforms; reuse the API layer and types. Charts must be rebuilt (Recharts doesn't run in React Native; evaluate Victory Native XL or react-native-gifted-charts) so prototype the LTE chart first, as it's the hardest. Plaid has an official React Native Link SDK. Hover tooltips become press interactions, and the Reports side panel becomes navigation or a bottom sheet.

## Rules
- [ ] **`IN` operator** — commented out in the `Operator` enum and `rules.ts`, removed from `rulefieldmap.json` until list-membership matching exists.
- [ ] **Manual-entry trigger** — waits on the add/edit `TransactionFormModal`, currently commented out in `Transactions.tsx`.
- [ ] **`BillFlag` action** — allowed by the field map but not handled in `SetAction` yet ("mark as a bill").

## Transactions
- [ ] **Re-enable add/edit transaction modal** — `TransactionFormModal` is commented out in `Transactions.tsx` ("edit temporarily disabled").
- [ ] **De-normalize merchant names** — normalized names are stored all-lowercase; convert to Title Case for display.

## Bills
- [ ] **Add Bill modal category list** — shows all categories in one flat dropdown; split into parent/subcategory lists like the Transactions modal.
- [ ] **Bill period snapshots** — create a snapshot of every elapsed bill period, and add a section for viewing how each past bill period went.

## Reports
- [ ] **Projected monthly outcome** — estimated income (detected from pay period frequency) minus confirmed bills; designed to give a directional picture of future financial health, not exact figures.
- [ ] **Category drift over time** — track month-over-month percentage share per category, not just raw totals, to surface shifts like "dining went from 12% to 22% of spend over 6 months" that flat totals hide.
- [ ] **Recurring-but-unflagged spend detection** — reuse `IBillDetectionService`'s trigram/frequency pattern logic against non-bill categories to surface recurring spend users haven't consciously tracked as a bill (subscriptions, weekly habits).
- [ ] **Income volatility / pay stability score** — for irregular income, a coefficient-of-variation-style metric on detected pay-period deposits; feeds a confidence band into the projected monthly outcome feature instead of a single point estimate.
- [ ] **Category correlation** — Pearson correlation across monthly category totals to surface categories that move together (e.g. dining spikes tracking with entertainment spikes); reuses the same monthly aggregation pipeline as the trend regression work.

## AI
- [ ] **AI budgeting assistant** — user inputs a goal (or pulls from existing Budget/Goal items) and Claude returns a personalized plan to reach it; consider what data to pass as context (spending history, bills, income estimate). Needs the same explicit third-party AI consent as PDF import.

## UX
- [ ] **Cross-page consistency pass** — square away visual and behavioral inconsistencies between pages; settle the design language before the mobile build.
- [ ] **Apply-on-submit filters** — Transactions/Reports filters currently re-fetch on every keystroke/toggle; require a button push to apply so filter changes don't hammer the server.
- [ ] **Error pages** — dedicated 404, 500, and auth-error pages/components.
- [ ] **UI redesign** — navigation overhaul and visual refresh; evaluate light mode or theme toggle.
- [ ] **Loading skeletons** — replace blank states during fetch with skeleton loaders.
- [ ] **Onboarding flow** — first-time users land on an empty dashboard with no guidance; short setup wizard (link bank, first sync, add a budget) to reduce drop-off.

## Docs
- [ ] **README: How to use** — walkthrough of core flows (sync, budgets, bills, goals, reports, rules) aimed at a new user.

## Testing
- [ ] **Exclusion receipt logic** — one receipt per apply, no duplicate on re-run, correct re-summarizing when two rules overlap, reversal on delete.
- [ ] **Rule `Kind` validation** — mixed kinds rejected, duplicate exclusion flag, invalid flag name, `Undefined` kind.

## Platform
- [ ] **Full data export** — let users export all their data as JSON for portability and backup.
