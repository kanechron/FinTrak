# FinTrak — TODO

## Transactions
- [ ] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [ ] **Separate categories** - all categories appear in the same dropdown
- [ ] **Dashboard payload limit** — Dashboard.tsx pulls all transactions; add a limit/offset so only the most recent N are fetched on load

## Bills
- [x] **Permanent decline** — automatic bill detection should permanently decline bills that have been historically declined, not re-surface them
- [x] **Permanent acceptance** — automatically accept bills that have been historically accepted, not re-prompt each time

## Auth
- [x] **Session state sync** — frontend doesn't detect when the user is logged out server-side; add a polling interval or auth check that redirects to login when the session expires or logout occurs

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once

## Architecture
- [ ] **Rate limiting** — fixed window on auth endpoints (`/auth/login`, `/auth/callback`) and write endpoints; ASP.NET Core built-in middleware
- [ ] **Health checks** — `AddHealthChecks().AddNpgsql(...)` + `/health` endpoint for Docker container health monitoring
- [ ] **Remove debug logging** — `Console.WriteLine` + `.LogTo` still in `Program.cs`; Serilog is now in place

## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [ ] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
