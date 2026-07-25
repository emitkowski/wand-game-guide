# CODE_PATTERNS.md
_How this project specifically solves recurring problems_
_Claude-maintained — check for existing pattern before appending_
_Project-specific only — not general conventions_

## Structural patterns
[Where business logic lives, how features are structured, what layer does what.]

## Naming conventions
[Project-specific naming beyond language/framework standards.]

## Cross-cutting concerns
[Auth, logging, error handling — how this project does it specifically.]

## Anti-patterns — do not replicate
- `app/Utils/ApiResponse/` — a Fractal-based response formatter. Dead code: `league/fractal` isn't installed and its `ResponseServiceProvider` is never registered. Do not build new API responses on it; use standard `Illuminate\Http\Resources\Json\JsonResource` instead (see below).

---

<!-- Entry format:
### [Pattern name]
**Context:** [When this applies] | **Pattern:** [What to do] | **Anti-pattern:** [What NOT to do]
**Example:** [Brief code reference]
-->

### Controller business logic lives in single-purpose Action classes
**Context:** Any controller action that does more than validate + call something + format a response — i.e. has real business logic (DB writes, ordering/locking, dispatching side effects).
**Pattern:** Extract the logic into an invokable-style class under `app/Actions/` (not necessarily literal `__invoke`, a clearly-named public method is fine), so the controller stays thin and the logic is reusable from other callers (queue jobs, artisan commands, a future internal service). Mirrors the existing `app/Actions/Fortify/*` classes.
**Anti-pattern:** Business logic inline in the controller method.
**Example:** `app/Actions/RecordConversationMessage.php`, called from `app/Http/Controllers/Api/V1/ConversationMessageController.php`.

### API responses use JsonResource, not the legacy ApiResponse util
**Context:** Any new JSON API endpoint.
**Pattern:** `Illuminate\Http\Resources\Json\JsonResource` (single resource) / `::collection()` (collections, including paginators — Laravel auto-appends pagination `meta`/`links` when the underlying resource is a paginator instance).
**Anti-pattern:** `app/Utils/ApiResponse/` (see above) — do not use.
**Example:** `app/Http/Resources/MessageResource.php`.

### Cursor pagination for high-volume, append-only history
**Context:** Any endpoint listing a table that grows unbounded per-owner (chat messages, activity logs, etc.) where offset pagination would degrade with history depth.
**Pattern:** Framework-native `->orderBy(<monotonic column>)->cursorPaginate($limit)`, not a hand-rolled cursor. The same cursor mechanism can serve both "load older" and "sync what's new since I left" — no separate delta-sync endpoint or server-side per-client cursor state needed.
**Anti-pattern:** Offset/page-number pagination (`->paginate()`) on unbounded per-owner tables — becomes an O(n) scan the deeper a user's history gets.
**Example:** `ConversationMessageController::index()`, ordered on `messages.sequence_number` (see docs/SCHEMA.md, docs/chat-sync-spec.md §4.4).

### Per-owner monotonic ordering via a locked counter column
**Context:** Any table needing a strict, gapless-enough ordering scoped to one owner (not global) — e.g. messages within a conversation.
**Pattern:** A counter column on the owner row (e.g. `conversations.last_sequence_number`), incremented inside a transaction with `lockForUpdate()` on that one owner row, and the new value stamped onto the child row being created. Serializes writes only within that owner's scope, not globally.
**Anti-pattern:** DB identity/auto-increment columns as the ordering signal when the app also needs to run against a DB backend that doesn't support them the same way (e.g. this project's SQLite test DB vs Postgres in production) — the app-level counter behaves identically on both.
**Example:** `app/Actions/RecordConversationMessage.php`.

<!-- Review and remove obvious patterns when file exceeds 150 lines -->
