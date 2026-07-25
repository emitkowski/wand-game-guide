# CODE_PATTERNS.md
_How this project specifically solves recurring problems_
_Claude-maintained — check for existing pattern before appending_
_Project-specific only — not general conventions_

## Structural patterns
- **Controllers stay thin.** Validation lives in Form Requests (`app/Http/Requests/`), business logic lives in single-purpose Action classes (`app/Actions/`), response shaping lives in API Resources (`app/Http/Resources/`). A controller method's job is to call these and return — see "Controller business logic lives in single-purpose Action classes" below.
- **API routes are versioned and namespaced by area.** `app/Http/Controllers/Api/V1/*` + `routes/api/v1.php`, nested resource routes (`/conversations/{conversation}/messages`) rather than flat ones. Web (Inertia) page controllers live at the `app/Http/Controllers/` root (e.g. `GameGuideController`, `Settings/ProfileController`) and are registered in `routes/web.php`/`routes/settings.php`, not versioned.
- **Feature flags gate at the route level.** `Laravel\Pennant\Middleware\EnsureFeaturesAreActive::using('flag-name')` in the route group definition, not an `if (Feature::active(...))` check scattered inside a controller — see `routes/api/v1.php`.
- **Real-time is a queued side effect of a write, not inline in the request.** A controller/action dispatches a Job (`app/Jobs/`), the Job dispatches a broadcast Event (`app/Events/` implementing `ShouldBroadcast`) — see `BroadcastMessageJob` → `MessageCreated`, mirroring the pre-existing `BroadcastPingJob` → `BroadcastPing` pattern. Never broadcast directly from a controller.
- **Frontend pages fetch their own data client-side rather than receiving it all as Inertia props**, when that data is already served by a real API endpoint the page needs to call repeatedly anyway (e.g. `game-guide/Chat.vue` fetching message history from the same `/api/v1/...` endpoint used for pagination, rather than the page controller embedding an initial page of messages as a prop). Keeps one code path for "initial load" and "load more" instead of two.

## Naming conventions
- Route names: `resource.action` (`profile.edit`, `game-guide.index`, `conversations.messages.store`) — dot-separated, resource first.
- Enums live under the owning model's namespace in a nested `Enums/` folder (`App\Models\Enums\SenderType`, not a top-level `App\Enums\`) — mirrors the existing `Models\Traits`/`Models\Mutators` nesting convention. Enum cases are `TitleCase` per `.claude/rules` PHP conventions (`SenderType::Player`, not `SenderType::PLAYER`).
- Structured log event names are dotted and namespaced by feature, lowercase (`game_guide.message_recorded`), not a free-text sentence — see Cross-cutting concerns below.
- Client-generated idempotency keys are named `client_message_id` (or `client_*_id` generally), always distinct from the server-assigned `id` — never reuse one field for both a client-local identity and the server's canonical one.

## Cross-cutting concerns

**Logging:** `Illuminate\Support\Facades\Log` with a dotted, namespaced event name as the message (`game_guide.message_recorded`, not a free-text sentence) and structured context array carrying correlation IDs (`conversation_id`, `user_id`, and whatever else identifies the request — `origin_platform`, `cache` hit/miss/bypass, etc.). Not `App\Facades\Logger` (dead scaffolding, see Anti-patterns). See `App\Actions\RecordConversationMessage` and `App\Http\Controllers\Api\V1\ConversationMessageController` for the pattern, and `App\Providers\AppServiceProvider::boot()` for listening to a package event (Pennant's `FeatureRetrieved`) to log something the app itself doesn't directly control.

## Anti-patterns — do not replicate
- `app/Utils/ApiResponse/` — a Fractal-based response formatter. Dead code: `league/fractal` isn't installed and its `ResponseServiceProvider` is never registered. Do not build new API responses on it; use standard `Illuminate\Http\Resources\Json\JsonResource` instead (see below).
- `App\Facades\Logger` / `app/Utils/Logger/*` (`MyLogger`, `CommandLoggerTrait`, `UtilLoggerTrait`) — dead scaffolding: 0% test coverage, zero call sites anywhere in `app/`. Use Laravel's standard `Illuminate\Support\Facades\Log` instead (see `App\Actions\RecordConversationMessage` and `App\Http\Controllers\Api\V1\ConversationMessageController` for the structured-logging pattern this app actually uses).

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
**Context:** Any endpoint listing a table that grows unbounded per-owner (chat messages, activity logs, etc.) where offset pagination would degrade with history depth, and where the common case is "show me the latest N, then let me scroll into history."
**Pattern:** Framework-native `->orderByDesc(<monotonic column>)->cursorPaginate($limit)` — **descending**, not ascending, so a request with no cursor returns the most recent N rows (see BUG-3 in docs/BUGS_ARCHIVE.md for what goes wrong with ascending order). Reverse only the resource collection's mapped `data` (`$resource->collection = $resource->collection->reverse()->values();`), never the paginator instance itself — Laravel computes `nextCursor()`/`previousCursor()` lazily from the paginator's own untouched items, so reversing just the output preserves correct cursor values while restoring ascending display order. `meta.next_cursor` becomes the "load older" token. The same cursor mechanism serves both "load older" and "sync what's new since I left" — no separate delta-sync endpoint or server-side per-client cursor state needed.
**Anti-pattern:** Offset/page-number pagination (`->paginate()`) on unbounded per-owner tables — becomes an O(n) scan the deeper a user's history gets. Also: ascending `orderBy()` with no cursor, which returns the *oldest* rows first (BUG-3).
**Example:** `ConversationMessageController::paginatedMessages()`, ordered on `messages.sequence_number` (see docs/SCHEMA.md, docs/chat-sync-spec.md §4.4).

### Cache the resolved JSON, not a hand-built envelope, for the "give me the default view" case
**Context:** An endpoint with one common, parameter-free request shape (e.g. "latest messages, no cursor, default limit") that's worth caching, alongside other parameterized requests that shouldn't be cached (custom cursor/limit).
**Pattern:** Only cache when the request matches the default shape exactly (`!$request->has('cursor') && !$request->has('limit')`), under one well-known key per owner (`conversation:{id}:recent`). Cache `$response->getData(true)` — the fully-resolved array Laravel already produced — via `Cache::remember()`, so a cache hit and a cache miss return byte-identical JSON with no separate envelope-building code to keep in sync. Invalidate with a plain `Cache::forget()` at the one write path that can change the result, right where that write already happens.
**Anti-pattern:** Keying the cache by every possible parameter combination (needs wildcard/tag-based invalidation for one write path) when the real traffic pattern only ever has one common shape worth caching.
**Example:** `ConversationMessageController::index()` (cache) / `RecordConversationMessage::record()` (invalidation).

### Per-owner monotonic ordering via a locked counter column
**Context:** Any table needing a strict, gapless-enough ordering scoped to one owner (not global) — e.g. messages within a conversation.
**Pattern:** A counter column on the owner row (e.g. `conversations.last_sequence_number`), incremented inside a transaction with `lockForUpdate()` on that one owner row, and the new value stamped onto the child row being created. Serializes writes only within that owner's scope, not globally.
**Anti-pattern:** DB identity/auto-increment columns as the ordering signal when the app also needs to run against a DB backend that doesn't support them the same way (e.g. this project's SQLite test DB vs Postgres in production) — the app-level counter behaves identically on both.
**Example:** `app/Actions/RecordConversationMessage.php`.

<!-- Review and remove obvious patterns when file exceeds 150 lines -->
