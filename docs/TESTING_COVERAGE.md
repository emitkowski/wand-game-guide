# TESTING_COVERAGE.md
_Updated by Claude after running the coverage command and reviewing results_
_Do not update without running the coverage command first — never estimate from memory_
_A `[none]`/`[partial]` row here is a coverage gap, not a confirmed bug — see docs/BUGS.md for the bug-vs-coverage-gap distinction and for actual known bugs (BUG-N)_

Legend: `[covered]` = dedicated test file, `[partial]` = some paths tested, `[none]` = no test.

---

## Coverage snapshot
_All suites at a glance — update after every coverage run_

| Suite | Tool | Overall | Threshold | Status | Last run |
|---|---|---|---|---|---|
| Backend | PHPUnit | 51.0% | 80% | ✗ below threshold | 2026-07-25 |
| Frontend | Vitest | see below | [N]% | see below | 2026-07-25 |

_Remove rows that don't apply. Add rows for additional suites (e2e, contract, etc.)._

---

# Backend ([PHPUnit / Pest])

**Suite:** 72 tests passing, 0 failing (3.37s with coverage).
**Overall coverage:** 51.0% (PCOV, measured 2026-07-25, unchanged by the BUG-1/BUG-2 fixes — `routes/` isn't in `<source>` scope, and the CI-only BUG-2 fix has no app-code coverage impact) — up from 47.5% earlier this session; the passkey-removal work incidentally brought `SecurityController`/`FortifyServiceProvider`/`Models/User` to 100% (fewer branches once the passkey code paths were deleted), and the pagination/cache/logging work added this session is fully covered.

> Re-run `./vendor/bin/sail artisan test --coverage --compact` and update the % column whenever a tracked file's coverage moves ≥2 points or crosses a 100% boundary.

## How to run

```bash
./vendor/bin/sail artisan test --compact              # run the suite
./vendor/bin/sail artisan test --coverage --compact    # per-file coverage report (files below 100% only)
```

---

## Area 1 — Chat history sync (docs/chat-sync-spec.md)

_All files below are at 100% per the 2026-07-25 coverage run — they don't appear in Collision's compact report, which only lists files under 100%._

| File | % | Status | Notes |
|---|---|---|---|
| `app/Actions/RecordConversationMessage.php` | 100% | `[covered]` | Idempotency, locked-counter ordering, cache invalidation, structured logging, broadcast dispatch — all exercised by `ConversationMessageTest` |
| `app/Http/Controllers/Api/V1/ConversationMessageController.php` | 100% | `[covered]` | Both the cacheable (no cursor/limit) and bypass paths exercised, including cache hit/miss |
| `app/Http/Controllers/GameGuideController.php` | 100% | `[covered]` | `GameGuideControllerTest` |
| `app/Http/Requests/Api/V1/StoreMessageRequest.php` | 100% | `[covered]` | Authorization path covered by the cross-user rejection test |
| `app/Http/Requests/Api/V1/IndexMessagesRequest.php` | 100% | `[covered]` | |
| `app/Http/Resources/MessageResource.php` | 100% | `[covered]` | |
| `app/Models/Conversation.php`, `app/Models/Message.php` | 100% | `[covered]` | |
| `app/Events/MessageCreated.php`, `app/Jobs/BroadcastMessageJob.php` | 100% | `[covered]` | Exercised indirectly — `QUEUE_CONNECTION=sync` in tests runs the job inline on every real (non-idempotent-replay) message creation |
| `app/Providers/AppServiceProvider.php` (Pennant `FeatureRetrieved` listener) | 100% | `[covered]` | Fires on every gated-route request in the existing test suite; not asserted on directly (no dedicated log-capture test) |
| `routes/channels.php` (`conversation.{id}`, `App.Models.User.{id}` channels) | not measured (routes/ excluded from `<source>`) | `[covered]` | `tests/Feature/BroadcastAuthorizationTest.php` — hits the real `/broadcasting/auth` route with a real `reverb` connection (BUG-1's fix, formerly untested) |

## Area 2 — Pre-existing app (not touched this session)

_Not re-audited in depth — see the 2026-07-24 coverage run output for the current low-coverage list. Flagging only what's directly relevant:_

| File | % | Status | Notes |
|---|---|---|---|
| `app/Utils/ApiResponse/*` | 0% | `[none]` | Dead code (see docs/CODE_PATTERNS.md anti-patterns) — not worth testing, candidate for removal |
| `app/Facades/Logger.php`, `app/Utils/Logger/*` | 0% | `[none]` | Pre-existing gap, unrelated to chat sync |
| `app/Jobs/BroadcastPingJob.php` | 50% | `[partial]` | Pre-existing gap, unrelated to chat sync |

_Add or remove area sections to match the project's actual code structure._

---

## What's left to tackle (backend)

1. `app/Utils/ApiResponse/*` and `app/Facades/Logger.php`/`app/Utils/Logger/*` are confirmed dead code (see docs/CODE_PATTERNS.md anti-patterns) — consider deleting rather than testing.
2. Overall app coverage (51.0%) is below this repo's 80% threshold (`.claude/rules/testing.md`) — improved this session but still a pre-existing gap overall, worth a dedicated pass.
3. No test directly asserts the `game_guide.*` log lines or the Pennant `FeatureRetrieved` listener's log output — behavior is exercised (100% line coverage) but the log *content* isn't asserted on. Low priority: these are observability hooks, not business logic.

---

# Frontend ([Vitest / Jest])

**Suite:** 29 tests passing, 0 failing (2.94s with coverage).
**Overall coverage (2026-07-25):**

| Metric | % | Hits / Total |
|---|---|---|
| Statements | 21.13% | 145 / 686 |
| Branches | 17.47% | 76 / 435 |
| Functions | 14.23% | 41 / 288 |
| Lines | 21.32% | 142 / 666 |

The overall figure is low because most of the pre-existing starter-kit surface (auth pages, settings pages, layouts, most `components/`) has zero test coverage — that predates this session and isn't chat-sync related. The one file this session actually owns, `pages/game-guide/Chat.vue`, is well covered (see Area 1).

## How to run

```bash
./vendor/bin/sail npm run test              # run the suite
./vendor/bin/sail npm run test:coverage     # full coverage report
```

## Coverage scope

No `coverage.include` allowlist is configured in `vitest.config.ts` — every `.vue`/`.ts` file under `resources/js` is measured, which is why the overall percentage is dragged down by untested starter-kit pages rather than reflecting chat-sync-specific gaps.

- **Always in scope:** all of `resources/js` (no include/exclude configured)
- **Notable exception:** nothing is explicitly excluded; the low overall % reflects untested pre-existing pages, not missing chat-sync coverage

---

## Area 1 — Game Guide chat (this session)

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `pages/game-guide/Chat.vue` | 80% | `[covered]` | 9 tests: initial load, Echo subscribe/unsubscribe, optimistic send + reconciliation, failed-send retry, broadcast de-dup, offline queueing, reload persistence, auto-flush on `online`, sequential ordered replay. Uncovered lines are `loadOlder()`'s scroll-position-preservation branch and one unreachable-in-tests edge of the retry path — see `Uncovered Line #s` in the raw report. |

## Area 2 — Pre-existing app (not touched this session)

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `components/BroadcastPing.vue` | 95% | `[covered]` | Pre-existing, unrelated to chat sync |
| `pages/Dashboard.vue` | not separately broken out by the coverage tool grouping above; exercised by `Dashboard.test.ts` | `[partial]` | Covers the BroadcastPing tile and the Game Guide link only |
| `pages/auth/*`, `pages/settings/*`, most of `components/`, all of `layouts/` | 0% | `[none]` | Pre-existing gap, not introduced or touched by chat-sync work |

_Add or remove area sections to match the project's actual code structure._

---

## What's left to tackle (frontend)

1. `pages/game-guide/Chat.vue`'s remaining uncovered branches: the `loadOlder()` scroll-position math, and one retry-path edge.
2. The entire pre-existing starter-kit frontend (auth pages, settings pages, layouts, most components) has no tests — large, pre-existing gap unrelated to this session's work.
---

## Run history

| Date | Suite | Overall | Tests | Duration |
|---|---|---|---|---|
| 2026-07-24 | Backend (PHPUnit) | 47.5% | 64 passed | 3.51s |
| 2026-07-25 | Backend (PHPUnit) | 51.0% | 68 passed | 3.29s |
| 2026-07-25 | Frontend (Vitest) | 21.13% stmts | 29 passed | 2.94s |
| 2026-07-25 | Backend (PHPUnit) | 51.0% | 72 passed | 3.37s |
