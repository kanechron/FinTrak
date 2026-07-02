# FinTrak — TODO

## Transactions
- [ ] **Search & filter** — filter by name, category, amount, date, or any metric
- [ ] **Rules engine** — apply rules to transactions (e.g. always assign a category to a merchant)

## Bills
- [ ] **Permanent decline** — automatic bill detection should permanently decline bills that have been historically declined, not re-surface them
- [ ] **Permanent acceptance** — automatically accept bills that have been historically accepted, not re-prompt each time

## Reports
- [ ] **Monthly Spending Trend** — graph doesn't look right, investigate
- [ ] **Income vs Expenses** — graph doesn't look right, investigate
- [ ] **Export** — export reports as PDF, Excel, or CSV

## Settings
- [ ] **Transaction page size** — configurable limit for how many transactions load at once

## Architecture
- [x] **DTOs & mappers** — stop returning EF entities directly from controllers; add DTO layer with `From()` mappers per entity
- [x] **Service layer** — extract business logic out of controllers into injectable services (start with PDF import, rules engine)
- [x] **Repository pattern** — all DB queries extracted from controllers into typed repositories; controllers depend only on interfaces; FinTrakDbContext isolated to Infrastructure
- [x] **Interface layer** — IPdfImportService, ITransactionNameMatchService, IBillDetectionService, and all 6 repository interfaces defined in Core
- [ ] **Input validation** — validate request bodies on DTOs before they reach business logic (FluentValidation or DataAnnotations)
- [x] **Global error handling** — `UseExceptionHandler` middleware that maps exceptions to RFC 7807 Problem Details; no raw 500s with stack traces
- [x] **Structured logging** — Serilog registered as host logging provider; Console sink configured; all services/background services pick up ILogger<T> automatically
- [ ] **Swagger / OpenAPI** — `AddSwaggerGen()` for auto-generated, self-documenting API docs
- [ ] **Cancellation tokens** — pass `CancellationToken` through controller actions down to EF queries


## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [ ] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
