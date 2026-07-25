# ARCHITECTURE.md
_Claude-maintained, human reviews for accuracy_
_Decision history: docs/ARCHITECTURE_HISTORY.md | Last updated: 2026-07-25_

## System overview
Laravel 13 backend with an Inertia.js + Vue 3 frontend (no separate SPA build/API split — Inertia renders Vue pages server-driven, styled with Tailwind + shadcn-vue). Fortify provides session-based auth (login/registration/2FA/password reset); Sanctum's stateful-SPA mode lets the same browser session authenticate JSON API calls with no separate token. The one real product feature today is "Game Guide" — a chat interface (`resources/js/pages/game-guide/Chat.vue`) backed by a `conversations`/`messages` API that syncs across sessions/devices (see docs/chat-sync-spec.md), broadcasting live updates over Reverb. Postgres is the datastore, Redis backs the cache/queue.

## Component inventory
| Component | Responsibility | Owns | Does not own |
|---|---|---|---|
| Auth (Fortify + Sanctum) | Login, registration, password reset, 2FA, session/API auth | Session cookies, `users` table auth fields, Sanctum's stateful-SPA middleware | Authorization beyond "is this the right authenticated user" — that's per-controller/Form-Request |
| Game Guide chat | Conversation/message persistence, ordering, idempotency, history sync | `conversations`/`messages` tables, `App\Actions\RecordConversationMessage` (the only writer), the two `Api\V1\ConversationMessageController` endpoints, `game-guide/Chat.vue` | AI reply generation — not built; see docs/chat-sync-spec.md §5 for the intended internal path |
| Broadcasting (Reverb) | Real-time push of new messages to already-open clients | WebSocket connections, `routes/channels.php` channel authorization | Message persistence — broadcast is dispatched as a queued side effect *after* a write, never a source of truth (docs/chat-sync-spec.md §4.5) |
| Settings | User profile editing, password changes | `Settings/ProfileController`, `Settings/SecurityController` | Auth itself (delegates to Fortify actions for password rules etc.) |
| Feature flags (Pennant) | Gating in-progress features, phased rollout | `features` table, flag definitions in `AppServiceProvider::boot()` | Authorization — a flag being active doesn't imply the requesting user owns the resource; ownership checks are separate (Form Request `authorize()`) |

## Data flow
Browser → `routes/web.php` (Inertia page render) or `routes/api/v1.php` (JSON) → middleware (`auth`/`auth:sanctum` + `verified` + Pennant's `EnsureFeaturesAreActive` where gated) → Form Request (validation + authorization) → Controller (thin — calls one Action, returns a Resource/Inertia response) → Action class (`app/Actions/`, the only place with real business logic) → Eloquent models → Postgres. For writes that need real-time fan-out: Action dispatches a queued Job → Job dispatches a `ShouldBroadcast` Event → Reverb → connected clients' `window.Echo` listeners.

## Integration points
| Service | Purpose | Direction |
|---|---|---|
| PostgreSQL | Primary datastore (production and local dev; tests run against SQLite — see docs/memory/laravel.md) | outbound |
| Redis | Cache (`conversation:{id}:recent`), default queue connection is `database` per `.env.example` (Redis is available but not the queue driver) | outbound |
| Laravel Reverb | Self-hosted WebSocket server for real-time broadcast | outbound (server pushes to connected clients) |
| Laravel Sanctum | Stateful SPA API auth (session-cookie-based, no separate bearer tokens for first-party frontend) | inbound |
| Laravel Pennant | Feature flag storage/resolution (DB-backed) | inbound (checked per-request) |

## Architectural boundaries
- All `messages` writes go through `App\Actions\RecordConversationMessage` — no other code path inserts into that table directly, or ordering/idempotency/cache-invalidation guarantees break (docs/SCHEMA.md).
- API controllers (`Api\V1\*`) never return Inertia responses; web/page controllers never return raw JSON resources. The two are cleanly separated by route file and controller namespace.
- Business logic does not live in controllers — see docs/CODE_PATTERNS.md's "Controller business logic lives in single-purpose Action classes."

## What is intentionally excluded
- AI reply generation for Game Guide — this app persists and syncs messages; nothing generates the assistant's replies yet (docs/chat-sync-spec.md §5, §9).
- Read replicas, table partitioning/sharding for `messages` at scale — described as a future migration path in docs/chat-sync-spec.md §6, not implemented; a single Postgres instance is correct for the current rollout phase.
- Full observability stack (metrics, distributed tracing) — structured logging exists (`game_guide.*` events), but no OpenTelemetry/metrics/alerting infrastructure (docs/chat-sync-spec.md §7, §9).

## Component docs
_Detailed subsystem docs — one file per component in docs/architecture/_
_Copy docs/architecture/architecture.example.md to get started_
| Component | File |
|---|---|
| _None yet_ | The component inventory above is currently sufficient; split out a dedicated file if Game Guide chat or auth grows complex enough to need one. |
