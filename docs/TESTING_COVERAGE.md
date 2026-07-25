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
| Backend | PHPUnit | 47.5% | 80% | ✗ below threshold | 2026-07-24 |
| Frontend | Vitest | 0% | [N]% | ○ no data | — |

_Remove rows that don't apply. Add rows for additional suites (e2e, contract, etc.)._

---

# Backend ([PHPUnit / Pest])

**Suite:** 64 tests passing, 0 failing (3.51s with coverage).
**Overall coverage:** 47.5% (PCOV, measured 2026-07-24).

> Re-run `./vendor/bin/sail artisan test --coverage --compact` and update the % column whenever a tracked file's coverage moves ≥2 points or crosses a 100% boundary.

## How to run

```bash
./vendor/bin/sail artisan test --compact              # run the suite
./vendor/bin/sail artisan test --coverage --compact    # per-file coverage report (files below 100% only)
```

---

## Area 1 — Chat history sync (docs/chat-sync-spec.md)

_All files below are at 100% per the 2026-07-24 coverage run — they don't appear in Collision's compact report, which only lists files under 100%._

| File | % | Status | Notes |
|---|---|---|---|
| `app/Actions/RecordConversationMessage.php` | 100% | `[covered]` | Idempotency, locked-counter ordering, broadcast dispatch — all exercised by `ConversationMessageTest` |
| `app/Http/Controllers/Api/V1/ConversationMessageController.php` | 100% | `[covered]` | |
| `app/Http/Requests/Api/V1/StoreMessageRequest.php` | 100% | `[covered]` | Authorization path covered by the cross-user rejection test |
| `app/Http/Requests/Api/V1/IndexMessagesRequest.php` | 100% | `[covered]` | |
| `app/Http/Resources/MessageResource.php` | 100% | `[covered]` | |
| `app/Models/Conversation.php`, `app/Models/Message.php` | 100% | `[covered]` | |
| `app/Events/MessageCreated.php`, `app/Jobs/BroadcastMessageJob.php` | 100% | `[covered]` | Exercised indirectly — `QUEUE_CONNECTION=sync` in tests runs the job inline on every real (non-idempotent-replay) message creation |
| `routes/channels.php` (`conversation.{id}` channel) | 0% | `[none]` | No test exercises broadcast channel authorization directly |

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

1. `routes/channels.php` conversation channel authorization has no direct test — add one asserting a non-owner is denied and the owner is allowed (would also guard against a regression of the kind logged as BUG-1 in docs/BUGS.md, which was found in the *other* channel definition in this same file).
2. `app/Utils/ApiResponse/*` is confirmed dead code (not registered, dependency not installed) — consider deleting rather than testing.
3. Overall app coverage (47.5%) is below this repo's 80% threshold (`.claude/rules/testing.md`) — pre-existing gap, not introduced by the chat-sync work, but worth a dedicated pass.

---

# Frontend ([Vitest / Jest])

**Suite:** [N] tests passing, 0 failing ([duration with coverage]).
**Overall coverage ([YYYY-MM-DD]):**

| Metric | % | Hits / Total |
|---|---|---|
| Statements | 0% | 0 / 0 |
| Branches | 0% | 0 / 0 |
| Functions | 0% | 0 / 0 |
| Lines | 0% | 0 / 0 |

## How to run

```bash
[run command]           # run the suite
[coverage command]      # full coverage report
```

## Coverage scope

_List what is explicitly included in `[vitest/jest].config.js → coverage.include` — only measured files appear in the % above._

- **Always in scope:** [e.g. composables, stores, utils] — target 100%
- **Selectively in scope:** [e.g. components with non-trivial logic] — target load-bearing behaviours
- **Out of scope:** [e.g. pages, layouts, app entry] — [reason]

---

## Area 1 — [e.g. Composables / pure logic]

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `[path/to/file.js]` | 0% | `[none]` | [brief note] |

## Area 2 — [e.g. Stores]

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `[path/to/file.js]` | 0% | `[none]` | [brief note] |

## Area 3 — [e.g. Components (selective)]

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `[path/to/file.vue]` | 0% | `[none]` | [brief note] |

---

## What's left to tackle (frontend)

1. [Highest-priority gap]
2. [Next gap]
3. [Out of scope today — revisit when X]

---

## Run history

| Date | Suite | Overall | Tests | Duration |
|---|---|---|---|---|
| 2026-07-24 | Backend (PHPUnit) | 47.5% | 64 passed | 3.51s |
