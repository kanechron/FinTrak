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
- [ ] **DTOs & mappers** — stop returning EF entities directly from controllers; add DTO layer with `From()` mappers per entity
- [ ] **Service layer** — extract business logic out of controllers into injectable services (start with PDF import, rules engine)
- [ ] **Input validation** — validate request bodies on DTOs before they reach business logic (FluentValidation or DataAnnotations)
- [ ] **Global error handling** — `UseExceptionHandler` middleware that maps exceptions to RFC 7807 Problem Details; no raw 500s with stack traces
- [ ] **Structured logging** — replace Console.WriteLines with Serilog `_logger.LogInformation(...)` with structured properties; sink to file or seq
- [ ] **Swagger / OpenAPI** — `AddSwaggerGen()` for auto-generated, self-documenting API docs
- [ ] **Cancellation tokens** — pass `CancellationToken` through controller actions down to EF queries


## Testing
- [ ] **Integration tests** — xUnit + `WebApplicationFactory`; cover PDF import dedup logic and Plaid sync at minimum
- [ ] **CI pipeline** — GitHub Actions workflow that builds and runs tests on every push to `main`

## Platform
- [ ] **Mobile web** — responsive/mobile-optimized version of the web app
- [ ] **Mobile app** — React Native app (iOS/Android)
