# Notifications — Design Notes

Working notes from the scoping session on 2026-10-21. Nothing here is built yet. This captures what was settled, what was parked, and what's still open, so the next session can pick up without re-deriving it.

## What counts as a notification

Anything the user didn't directly cause. If it comes out of a background service, it's a notification.

Notifications split into two kinds:

- **Action notifications** — the result of an action (sync failed, import finished). Skipped when *this* user triggered the action themselves, since the UI already showed them the result. Example: a manual sync failure isn't notified; an auto-sync failure is.
- **Data notifications** — something in the data (purchase over $500, budget crossed 80%, SAD running hot). Always sent, regardless of who triggered the sync that surfaced it. The user started the sync, not the purchase.

Refinements:

- The question is "did *this* user trigger it and already see the result," not "was it user-triggered at all." Invite accepted is triggered by someone else, so it's sent. New sign-in is always sent, for security.
- Data notifications are keyed to the data, not to the sync that found it (once per transaction, once per budget per period), so a manual sync and an auto-sync seeing the same data can't double-notify.
- **Rules with a Notify action** are data notifications, but only for *new* transactions (sync, import). "Apply to past transactions" (`RecursiveRuleSavedEvent`) and "Run rule" (`POST /rules/run-rule/{id}`) still apply Set actions but never notify. Replaying history isn't news.

## Triggers

Two triggers, nothing more:

1. **Event** — something happened in the app.
2. **Schedule** — the clock.

On-demand (e.g. a "send test notification" button) is a special case of each, not a third trigger. User actions and rule matches are app events.

The code should be triggers plus a handful of concrete notification types, each saying which trigger it listens to and owning its own check (same shape as the rules engine). No generic "notification kind" framework. "Threshold," "relative-date," and "absence" are user-facing descriptions at most; under the hood they're event or scheduled checks.

## Events in scope for the first pass

| Event | Exists today? | Notifications that hang off it |
|---|---|---|
| `SyncCompleted` | Yes (`SyncCompletedEvent`) | SAD running hot, budget threshold crossed, large transaction, new recurring bill detected, recurring bill paid, auto-sync completed |
| `SyncFailed` | No | Sync failed |
| `PDFImportCompleted` | Yes (`PDFImportEvent`) | Import finished / flagged duplicates |
| `RuleMatched` | No | User-defined rule notifications |
| `InviteAccepted` | No | Someone used your invite |
| Goal completed (source undecided) | No | Goal completed |
| `NewLogin` | No | New sign-in (optional) |

Events should carry who started them (e.g. `Initiator: User | System`) so action handlers can skip user-triggered results.

## Parked

All of these are also listed in `TODO.md` under Settings.

- **System broadcast** — sent to every user, not tied to one user's data (e.g. maintenance notices).
- **Plaid webhooks** — `ITEM_LOGIN_REQUIRED`, `PENDING_EXPIRATION`, `NEW_ACCOUNTS_AVAILABLE`. Needs a public endpoint, signature verification, and PlaidItem → user mapping. Once received, each is an ordinary event.
- **Notification bell and history** — ship these together. The bell is the in-app notification center. History is a table of the user's notifications that auto-deletes entries after a set time (14 days for now), and a "see all" option shows them, including anything new since the user last opened it. The first pass covers email and push.
- **Toast** — needs a way to reach an already-open browser.

## Delivery pipeline

```
                       ┌──────────────── Postgres: everything that's waiting ────────────────┐
                       │  Recurring schedules · Delayed one-shot notifications · Retries     │
                       └──────────────────────────────┬──────────────────────────────────────┘
                                                      │ background services pull what's due
                                                      ▼
Event producers ──────────────────────────────────▶ Boxer ──▶ Channel ──▶ Delivery loop
(sync, rules, auth)                              (build + validate)  (ready now)   │ filters (group, sort out)
                                                                                   │ send per method
                                                                                   ├── sent → done
                                                                                   └── failed → retry table (Postgres) ──retry checker──▶ back to Channel
```

- **Anything waiting lives in the DB.** Recurring schedules, delayed one-shot notifications, and retries are all stored in Postgres, so nothing that's waiting is lost on a backend restart (including every Docker deploy).
- **Background services pull what's due** and hand it to the boxer. What happens to the DB row depends on the item:
  - **Recurring schedule** — stays; its next fire time is moved forward.
  - **Delayed one-shot notification or retry** — deleted once pulled.
- **The channel only holds what's ready now.** Items are in it for seconds. If the backend restarts at that exact moment, those few in-flight items are lost, which is an accepted trade-off.
- **The delivery loop** is the notification handler: a `BackgroundService` running an `await foreach` over the channel's `ReadAllAsync` (same pattern as `RulesBackgroundService`: DI scope per item, try/catch per item). It does no work beyond sending. Generating content (e.g. building a weekly report) happens before the item reaches the boxer.
- **No separate sorter or grouper stage.** The delivery loop runs items through a set of **filters**, all in the same file: if items can be grouped (e.g. several items for the same user, same method → one email), group them; if something can be sorted out, sort it out. Whatever the filters do, it all ends in the delivery loop sending the result.
  - **Grouping is mostly unneeded since the queues were consolidated.** The one known case: a single sync pulls in several transactions that each match a "notify me over $500" rule, which would send the user several pushes in a row. Note that the producer already has the whole batch in hand (the `SyncCompleted` handler sees every transaction from that sync), so it could hand the boxer one "3 large purchases" item instead of three. Grouping stays in the filters for now; this is the example to design against if it's ever needed.

### The boxer

Every notification passes through one **boxer** (builder/validator) on its way to the channel. The boxer receives the data, makes sure it's all there and valid, boxes it into the notification object, and places it in the channel.

- **Event notifications** go straight from the producer to the boxer.
- **Delayed and recurring items** are pulled from the DB by the daily/hourly checks, which hand them to the boxer when due. Nothing gets boxed while it's still waiting.
- **Retries** are already boxed and are handled by their own downstream retry checker (see Retry policy).

### Recurrence

- **Nothing in the pipeline repeats items.** The channel, boxer, and delivery loop don't know that a notification recurs every 24 hours, 7 days, or on whatever schedule the user picked.
- **Recurrence lives in a separate background service**, probably a `TimedEventBackgroundService`. It runs once a day, checks each recurring schedule ("this one is due Monday, today is Thursday"), does any work the notification needs, and hands it to the boxer when due.
- **Each recurring schedule stores a next fire time** (e.g. "Monday 8:00 AM"), not a countdown. When it's due, the service hands it off and calculates the following fire time. This stays correct even if a daily run is missed (e.g. the backend was down during a deploy), where a countdown would silently drift.

### Retry policy

Retries are **per delivery method**. If email succeeds and push fails, only push is retried. There's no need to resend something that already got through.

1. A few attempts in the delivery loop (around 5–10, not yet decided), spaced out rather than back to back, since a down provider is usually down for minutes.
2. Still failing → written to the **retry table** in Postgres, stamped with a time added. Retries wait there so they don't clog the channel while other notifications are being sent.
3. Once it's waited 10–15 minutes, a dedicated **retry checker** pulls it (deleting the row) and puts it straight back in the channel for one more attempt. It's already boxed, so it skips the boxer. The retry checker sits downstream of the delivery loop and is separate from the daily/hourly checks, which all happen before boxing (nothing gets boxed while it's still waiting).
4. Still failing → log everything available about the failure and drop it. The user just doesn't get that one.

## The notification object

Settled so far: two parts.

- **Message data** — what it says.
- **Handling data** — when it fires, which user it belongs to, and how it's delivered.

### First-pass filters

Validation only: "does this contain a valid userId," "does this contain a valid method," and similar checks.

### How often the DB is checked

- **The shortest interval a user can set for a notification is daily.** So the main background service checks the DB **once a day** and finds what's due today.
- **Time of day is handled separately** by a sub-service that runs **hourly**. The daily check hands it an object saying "this one is ready today, here's the time," and the hourly sub-service passes it to the boxer when that hour comes.

## Open questions

1. **Boxer validation vs. filter validation.** Both currently validate; decide whether they check different things or one of them is enough.
2. **The object's exact shape.**
