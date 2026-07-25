# SCHEMA.md
_Claude-maintained — update immediately when schema changes_
_Keep concise — summaries only, not a migration dump. Human reviews for accuracy._

## Tables
<!-- Multi-DB: use ## Tables — [DB Name] headings. Format per table:
### table_name
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
Indexes: [list]
Relationships: [list]
Business rules: [any rules baked into the schema]
-->

### conversations
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK -> users.id, cascade delete |
| title | string, nullable | unused by current endpoints |
| last_sequence_number | bigint | atomic ordering counter, see business rules |
| last_message_at | timestamp, nullable | |
Indexes: none beyond PK/FK
Relationships: belongsTo User, hasMany Message
Business rules: `last_sequence_number` only ever written by `App\Actions\RecordConversationMessage` via `forceFill()` — not in `$fillable`

### messages
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, external identity |
| conversation_id | uuid | FK -> conversations.id, cascade delete |
| sender_type | string (enum cast) | player \| assistant \| system |
| body | text | |
| origin_platform | string (enum cast) | desktop \| web \| overlay |
| client_message_id | uuid | idempotency key |
| client_created_at | timestamp, nullable | device clock, display hint only — never authoritative for ordering |
| sequence_number | bigint | authoritative order within a conversation |
Indexes: unique (conversation_id, client_message_id); unique (conversation_id, sequence_number)
Relationships: belongsTo Conversation
Business rules: append-only — no update path for `body`; see docs/chat-sync-spec.md for the full sync design

## Relationships
- `Conversation belongsTo User` (`user_id`), `User hasMany Conversation`
- `Message belongsTo Conversation` (`conversation_id`), `Conversation hasMany Message`

## Key business rules
- `messages` is treated as immutable/append-only — no update path exists for `body`. If retraction is added later, use a tombstone column rather than deleting/editing rows (see docs/chat-sync-spec.md §2, §9).
- `messages.sequence_number` and `conversations.last_sequence_number` must only ever be written by `App\Actions\RecordConversationMessage`, inside a transaction with `lockForUpdate()` on the conversation row. Both fields are deliberately absent from `Conversation::$fillable`; the action uses `forceFill()` to write them.
- `messages.client_message_id` is the idempotency key (unique per conversation) — client-retried sends must never produce duplicate rows.
- Redis cache key `conversation:{id}:recent` (default TTL 5 min) holds the resolved JSON for the no-cursor/default-limit history fetch. Any code path that creates a message for a conversation must call `Cache::forget("conversation:{$conversation->id}:recent")` — currently only `RecordConversationMessage` writes messages, and it already does this; a future write path (e.g. assistant-reply persistence, docs/chat-sync-spec.md §5) must do the same or the cache goes stale.

## Internal contracts
- None yet — `RecordConversationMessage` is currently only called from `ConversationMessageController`. A future internal path that persists assistant-generated replies should call the same action rather than writing to `messages` directly, to keep ordering/idempotency/broadcast behavior consistent (see docs/chat-sync-spec.md §5).

---
