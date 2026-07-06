# FinTrak — TODO

## Transactions
- [ ] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)
- [ ] **Separate categories** - all categories appear in the same dropdown under the Add Transaction modal
- [ ] **Dashboard payload limit** — Dashboard.tsx pulls all transactions; add a limit/offset so only the most recent N are fetched on load

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once

## Architecture
- [x] **Rate limiting** — fixed window on auth endpoints (`/auth/login`, `/auth/callback`) and write endpoints; ASP.NET Core built-in middleware
- [x] **Health checks** — `AddHealthChecks().AddNpgsql(...)` + `/health` endpoint for Docker container health monitoring
- [x] **Remove debug logging** — `Console.WriteLine` + `.LogTo` still in `Program.cs`; Serilog is now in place

## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [ ] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
