# Game Guide Chat History Sync — Tech Spec

_Author: Eric Mitkowski | Status: Draft for review | Companion code: see "Code scaffold" below_

## 1. Problem

Players talk to Game Guide (an in-app AI assistant) from three surfaces — desktop app, web app, and in-game overlay. A conversation started on one surface should be readable and continuable from any other, including after a device was offline for a while. At 40M+ players, the design has to hold up under high write concurrency across many independent conversations, not just be correct for one user.

This doc covers the backend: data model, API surface, sync strategy, caching/performance, observability, and a phased rollout plan. It intentionally does **not** cover the AI generation pipeline itself (how Game Guide produces a reply) — only how messages, once produced, are stored and kept in sync.

## 2. Data model

Two tables. Both use UUID primary keys (this codebase's convention for new tables), with a secondary bigint column on `messages` used purely for ordering — not the primary key, just an internal cursor.

```
conversations
  id                    uuid, pk
  user_id               uuid, fk -> users.id, cascade delete
  title                 string, nullable
  last_sequence_number  bigint, default 0   -- the ordering counter, see §4.1
  last_message_at       timestamp, nullable
  created_at / updated_at

messages
  id                  uuid, pk               -- external identity
  conversation_id     uuid, fk -> conversations.id, cascade delete
  sender_type         enum: player | assistant | system
  body                text
  origin_platform     enum: desktop | web | overlay
  client_message_id   uuid                    -- idempotency key, see §4.2
  client_created_at   timestamp, nullable     -- device clock, display hint only
  sequence_number     bigint                  -- authoritative order, see §4.1
  created_at / updated_at

  unique (conversation_id, client_message_id)
  unique (conversation_id, sequence_number)
```

Messages are treated as an **immutable, append-only log** — no in-place edits or deletes in this design. That single choice removes most of the hard conflict-resolution problems a mutable chat log would otherwise have (see §4.2). If retraction is ever needed, the recommended extension is a `retracted_at` tombstone column rather than destructive edits, so the log stays append-only.

`sender_type` includes `assistant`/`system` because the same table stores the AI's replies too — a player's client reads one interleaved log regardless of who said what. This endpoint set only ever *writes* `player` messages; assistant replies are written through a separate internal path (an AI-worker service, not shown here) that reuses the same ordering/idempotency logic (see §5).

## 3. API surface

Two endpoints, both `auth:sanctum` + gated behind a Pennant feature flag (`chat-history-sync`) tied to the rollout plan in §7:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/conversations/{conversation}/messages` | Record a player message. Idempotent on `client_message_id`. |
| `GET` | `/api/v1/conversations/{conversation}/messages` | Cursor-paginated history. Also the reconnect/delta-sync fetch. |

That second endpoint doing double duty (history scroll-back *and* "what's new since I left") is deliberate — see §4.4. A conversation-list endpoint (`GET /conversations`) and an assistant-reply write path would exist in a full build but are out of scope for this scaffold.

Both `POST` and `GET` authorize via each request's `authorize()` — the conversation must belong to the authenticated user. The write endpoint is additionally rate-limited (`throttle:60,1`) since it's the one path an abusive or buggy client could hammer.

## 4. Sync strategy

### 4.1 Ordering

`conversations.last_sequence_number` is a per-conversation monotonic counter. Assigning the next value happens inside a DB transaction that takes a row lock on the conversation (`lockForUpdate()`), increments, and stamps the new message with that value.

This only serializes writes **within one conversation** — never across conversations — so it isn't a global bottleneck; one player's chat isn't going to have thousands of concurrent writers fighting over that lock. Alternatives considered and rejected for this scope:

- **DB identity/sequence column** — doesn't translate cleanly to the SQLite database this project's test suite runs against, only to Postgres in production; the app-level counter behaves identically on both.
- **Snowflake/HLC-style distributed IDs** — solves a problem this doesn't have (a single conversation needing multi-writer throughput beyond what one row lock can serialize). Worth revisiting only if a conversation type emerges with genuinely concurrent multi-writer semantics.

### 4.2 Conflict resolution

Because messages are immutable and append-only, there's no "whose edit wins" problem. The only real conflict case is **two devices producing a message for the same conversation while both were briefly offline** (e.g., a player typed something on the overlay, then also sent something from the web app before either had synced). Resolution: whichever request reaches the server first gets the next `sequence_number`; both messages are kept — no data is ever dropped. `client_created_at` is preserved so the UI could show "sent while offline at 3:41pm" if it wants to explain an apparent out-of-order arrival, but the server's `sequence_number` is what actually determines display order. This sidesteps CRDT/vector-clock machinery that a true collaborative-editing problem would need but a chat log doesn't.

### 4.3 Offline edits (client-side outbox)

The client is responsible for the offline queue, not the server:

1. Player composes a message while offline. Client generates a `client_message_id` (UUID) and renders it optimistically.
2. Message goes into a local outbox (persisted client-side — SQLite/IndexedDB/whatever the platform has).
3. On reconnect, the client replays queued messages **in order**, one `POST` per message, against the same idempotent endpoint.
4. If a request had actually succeeded but the client never saw the response (connection dropped mid-round-trip), the replay is safe — the server recognizes the `client_message_id` and returns the already-created message (`200`) instead of a duplicate (`201` is reserved for genuinely new messages). The client swaps its optimistic local record for the server-confirmed one (real `id`, canonical `sequence_number`).

No separate batch-sync endpoint exists or is needed — "flushing the offline queue" is just repeated calls to the one write endpoint, which is why two endpoints are sufficient for the entire sync loop.

### 4.4 Pagination

`GET .../messages` uses Laravel's native cursor pagination (`orderBy('sequence_number')->cursorPaginate()`), not offset pagination — it's O(1) regardless of how deep the history goes, which matters once players have months of conversation history. The cursor is opaque to the client; it just stores whatever cursor it was handed and passes it back.

The same mechanism serves two different needs with the same endpoint:
- **Scrolling into older history** — pass the oldest-seen cursor going backward.
- **Syncing what's new since last time** — a device that was offline (or just closed) stores the last cursor it saw locally and requests forward from there on reconnect.

No server-side per-device cursor state is required — each device just remembers its own last-seen position, which also means adding a new client platform costs nothing on the backend.

### 4.5 Real-time complement

New messages also broadcast over Reverb on a private per-conversation channel (`conversation.{id}`), dispatched from a queued job so it never blocks the API response. Already-online devices for the same player get the new message pushed instantly; the REST/cursor endpoints remain the source of truth and the reconciliation path for anything that was offline when the broadcast happened. Broadcast is a latency optimization on top of the sync guarantee, not a replacement for it — a device that missed the broadcast (app was closed) still catches up correctly via §4.4 on next open.

## 5. Assistant-authored messages (not built here, but shaped for it)

The write endpoint only ever creates `sender_type: player` messages — a client can't spoof an assistant reply through this path. Assistant replies would be persisted by an internal service (the AI pipeline) calling the same underlying logic — in this scaffold, that logic is factored into one reusable class, `RecordConversationMessage`, specifically so a future internal caller shares the exact same ordering/idempotency/broadcast behavior instead of a second, possibly-inconsistent implementation.

## 6. Caching and performance

- **Hot recent-window cache.** Redis-cached last ~50 messages per conversation, keyed by `conversation:{id}:recent`, invalidated/updated on write. Covers the overwhelmingly common case (opening a chat, seeing recent context) without hitting Postgres.
- **Read replicas.** History reads (`GET`) can go to a replica; writes (`POST`) go to primary. The row lock in §4.1 only ever touches primary.
- **Partitioning at scale.** `messages` is the highest-growth table by far. Before it becomes a problem: range-partition by `created_at` (age out cold partitions to cheaper storage) and/or hash-partition by `conversation_id`. If growth outpaces what partitioned Postgres comfortably handles, the append-only, single-writer-per-partition-key shape of this table maps cleanly onto a purpose-built log/wide-column store (e.g., Cassandra/ScyllaDB/DynamoDB) as a later migration — the data model here was chosen so that move wouldn't require redesigning the ordering or idempotency semantics, just relocating them.
- **Rate limiting.** `throttle:60,1` on the write endpoint bounds both abusive clients and buggy retry loops.
- **Queue-based broadcast.** Keeps broadcast fan-out latency off the request/response path entirely (§4.5).

## 7. Observability

- **Structured logs** correlated by `conversation_id`, `user_id` (player), and `origin_platform`/device — any support/abuse investigation should be able to reconstruct one player's cross-device timeline from logs alone.
- **Metrics:** write-endpoint latency (p50/p95/p99), broadcast fan-out lag (message `created_at` → client receipt), idempotent-replay rate (how often clients are retrying — a proxy for connectivity quality by platform), queue depth for the broadcast job, error rate segmented by `origin_platform` (the overlay is the most resource-constrained surface and the most likely to regress first).
- **Tracing:** end-to-end (API → DB → queue → broadcast) via OpenTelemetry, so a slow sync can be attributed to a specific hop instead of guessed at.
- **Feature-flag telemetry:** Pennant emits `FeatureRetrieved`/`FeatureResolved` events for the `chat-history-sync` flag — wire these to rollout dashboards so ramp decisions in §8 are based on real exposure data, not guesses.
- **Alerting:** SLO-based, on sync latency and write success rate, with per-platform breakdowns so a regression on one client doesn't get averaged away by the other two.

## 8. Phased rollout to 40M+ players

Reuses this app's actual feature-flag mechanism (Laravel Pennant) rather than a hypothetical one — `chat-history-sync` is defined today (`AppServiceProvider::boot()`) as always-active for local/dev; the real rollout dials it down and ramps it back up:

1. **Dogfood.** Internal accounts only, flag active for an internal-only scope.
2. **Opt-in beta.** Small (~0.1%) cohort, single platform first (web — least resource-constrained, easiest to roll back), single region. Watch the observability dashboards in §7 before touching the dial again.
3. **Platform-by-platform, %-ramp expansion.** Add desktop, then the overlay last (most performance-sensitive, highest blast radius if something's wrong). Within each platform, ramp 1% → 5% → 25% → 50% → 100%, gated by the flag's percentage/lottery resolution, with automatic rollback (flip the flag off) if error rate or sync-latency SLOs are breached during a ramp step.
4. **Full GA.** Flag stays in place briefly as a kill switch, then gets removed once confidence is high (per this repo's `docs/FEATURE_FLAGS.md` process).

Load testing and capacity planning (particularly for the `messages` table's write path and the row-lock contention model in §4.1) happens before each ramp step that meaningfully increases write volume, not just once up front.

## 9. What this scaffold deliberately doesn't solve

Being upfront about the gap between this scaffold and a true 40M-player system:
- No message editing/retraction (append-only was a deliberate simplification, see §2).
- No conversation-list endpoint, no assistant-reply write path (§5) — both are straightforward extensions of what's here, not architecturally new.
- Partitioning/sharding (§6) is a plan, not implemented — the single-Postgres scaffold is right for phase 1-2 of the rollout, not for 40M concurrent players on day one.

## Code scaffold

Implemented in this repo (`wand-game-guide`), reusing its real stack (Laravel 13, Postgres, Redis, Sanctum, Reverb, Pennant) rather than a standalone snippet:

- Migrations: `database/migrations/*_create_conversations_table.php`, `*_create_messages_table.php`
- Models: `app/Models/Conversation.php`, `app/Models/Message.php`, enums in `app/Models/Enums/`
- Business logic: `app/Actions/RecordConversationMessage.php` (§4.1, §4.2, §4.3 all live here)
- HTTP layer: `app/Http/Controllers/Api/V1/ConversationMessageController.php`, `app/Http/Requests/Api/V1/*`, `app/Http/Resources/MessageResource.php`
- Real-time: `app/Events/MessageCreated.php`, `app/Jobs/BroadcastMessageJob.php`, `routes/channels.php`
- Routes: `routes/api/v1.php`
- Tests: `tests/Feature/Api/ConversationMessageTest.php` — covers idempotent replay, strict ordering, cross-user authorization rejection, and cursor pagination
