# ARCHITECTURE_HISTORY.md
_Append-only — never edit or delete. Claude writes immediately on decision._
_Current state: docs/ARCHITECTURE.md | Summarise superseded entries when approaching 200 lines_
_Reversals: add new entry "YYYY-MM-DD — Reversal of [original title]"_

## Decision format
### YYYY-MM-DD — [Decision title]
**Decision:** [What was decided, specific and unambiguous]
**Alternatives considered:** [What else was evaluated]
**Reasoning:** [Why this option was chosen]
**Consequences:** [What this constrains going forward]

---

### 2026-07-24 — Chat message ordering via per-conversation locked counter, not DB identity columns
**Decision:** `messages.sequence_number` (authoritative ordering within a conversation) is assigned in application code by incrementing `conversations.last_sequence_number` inside a transaction that takes `lockForUpdate()` on the conversation row — not via a Postgres identity/generated column or a global auto-increment.
**Alternatives considered:** Postgres identity column (`generatedAs()`) on `messages.sequence_number`; a global auto-increment `bigserial` id used directly as the ordering key; Snowflake/HLC-style distributed IDs.
**Reasoning:** This project's test suite runs against SQLite (`phpunit.xml`) while production runs Postgres (AGENTS.md stack line) — DB-native identity columns don't behave identically across both, so the app-level counter was chosen to work the same everywhere. The row lock only serializes writes within one conversation (never across conversations), so it isn't a global bottleneck at scale; a single conversation's write volume doesn't approach what one row lock can't handle. Distributed-ID schemes were rejected as solving a multi-writer-throughput problem this domain doesn't have.
**Consequences:** Any future write path that creates messages (e.g. an internal assistant-reply service) must go through `App\Actions\RecordConversationMessage` — or an equivalent that takes the same lock — rather than inserting into `messages` directly, or ordering guarantees break. See docs/chat-sync-spec.md §4.1 and docs/SCHEMA.md.

### 2026-07-24 — Chat messages are immutable/append-only, no edit or delete path
**Decision:** The `messages` table has no update path for `body` and no delete semantics in the API — messages are write-once. Retraction, if ever needed, should use a tombstone column, not destructive edits.
**Alternatives considered:** Mutable messages with last-write-wins conflict resolution on edits; soft-delete for retraction.
**Reasoning:** An append-only log removes the hardest class of multi-device sync problems (concurrent edit conflicts) entirely, since the only sync question left is ordering of new entries, not merging changes to existing ones. This trade directly shaped the whole sync design in docs/chat-sync-spec.md §4.2.
**Consequences:** A future edit/retraction feature is a schema addition (tombstone or versioning), not a redesign of the sync model — but it is out of scope today, and no code currently depends on messages being mutable.

---

<!-- Example entry (delete this when adding your first real entry):
### 2026-01-15 — Use PostgreSQL over MySQL
**Decision:** PostgreSQL with pgvector extension for all data storage
**Alternatives considered:** MySQL, SQLite for development
**Reasoning:** pgvector support for embeddings, superior JSON handling, better full-text search
**Consequences:** All queries must use PostgreSQL syntax. No MySQL-compatible abstractions.
-->
