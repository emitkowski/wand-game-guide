# BUGS_ARCHIVE.md
_Claude-maintained — fixed bugs move here from BUGS.md immediately once verified resolved_
_Append-only — never edit or delete entries_
_This file has merge=union in .gitattributes. BUG-N carries over from BUGS.md and is never
reused — see docs/BUGS.md for the numbering rule and the post-merge duplicate-ID procedure._
_Distinct from a coverage gap — see docs/BUGS.md for the bug-vs-coverage-gap distinction and for what the (Verified. / Agent-reported.) tag below means._

## Format
### BUG-[N] — YYYY-MM-DD — [Bug title] (Verified. / Agent-reported.)
**Was:** [What the bug was and where it occurred]
**Fix:** [What was done to resolve it]
**Commit/PR:** [Reference if known]

---

### BUG-3 — 2026-07-25 — Chat history endpoint returned oldest messages first, not most recent (Verified.)
**Was:** `ConversationMessageController::index()` queried `orderBy('sequence_number')->cursorPaginate()` (ascending). With no cursor, cursor pagination returns the *first* page — for a conversation longer than the page size, opening the chat would show the oldest messages in the conversation instead of the latest ones, which is wrong for a chat UI's "open and see recent context" case. Found via code review while building the Redis cache described in docs/chat-sync-spec.md §6, which needed to cache the correct "latest messages" query.
**Fix:** Switched the query to `orderByDesc('sequence_number')->cursorPaginate()` (most recent N with no cursor), then reversed only the resource collection's `data` array for ascending display order — verified against Laravel's pagination source that `nextCursor()`/`previousCursor()` are computed lazily from the paginator's own untouched item list, so reversing just the mapped output doesn't corrupt cursor correctness. `meta.next_cursor` is now the "load older" token (previously `prev_cursor`); `resources/js/pages/game-guide/Chat.vue` updated to match.
**Commit/PR:** Uncommitted at time of writing — see `app/Http/Controllers/Api/V1/ConversationMessageController.php`.

### BUG-1 — 2026-07-25 — Private user channel authorization always passed (Verified.)
**Was:** `routes/channels.php`'s `Broadcast::channel('App.Models.User.{id}', ...)` compared `(int) $user->id === (int) $id`. `User` uses `HasUuids`, so `id` is a UUID string; casting any UUID string to `int` yields `0` on both sides, meaning the check always evaluated true regardless of which user was asking — any authenticated user could subscribe to any other user's private channel.
**Fix:** Changed to a direct string comparison, `$user->id === $id`. Verified with `tests/Feature/BroadcastAuthorizationTest.php`, which also covers the `conversation.{id}` channel added alongside the chat-sync work. Confirming this test actually exercised the real callback (not just any 403) took real debugging: this project's tests default to `BROADCAST_CONNECTION=null` (phpunit.xml), whose `NullBroadcaster::auth()` always authorizes without ever invoking registered channel callbacks — the test switches to the `reverb` driver and re-`require`s `routes/channels.php` so registrations attach to that connection instead of the one resolved at boot. See docs/memory/laravel.md for the full writeup of that gotcha.
**Commit/PR:** Uncommitted at time of writing — see `routes/channels.php`, `tests/Feature/BroadcastAuthorizationTest.php`.

### BUG-2 — 2026-07-25 — deploy.yml CI test job ran against MySQL, a third database engine nobody else uses (Verified.)
**Was:** `.github/workflows/deploy.yml`'s `test` job spun up a MySQL service and set `DB_CONNECTION=mysql` as step-level env for both a "Run migrations" step and the "Run tests" step. `phpunit.xml`'s `<env name="DB_CONNECTION" value="sqlite"/>` has no `force="true"`, so a real shell-level env var (as CI sets) wins over it — meaning CI's test run genuinely executed against MySQL, while local/manual test runs use SQLite (`:memory:`, via `RefreshDatabase`) and production uses Postgres. Three different engines across three contexts.
**Fix:** Removed the MySQL service and the separate "Run migrations" step entirely (unnecessary with SQLite `:memory:` + `RefreshDatabase`, which migrates per test class). CI now runs `php artisan test --compact` with no DB-related env override, so it falls through to phpunit.xml's SQLite default — matching local/manual test runs exactly, and the fastest, cheapest option given production already accepts the SQLite-vs-Postgres gap for test speed (a deliberate, pre-existing tradeoff, not something this fix introduced). Also fixed the trigger branch (`master` → `main`) as part of the earlier deploy-wiring work in this same file.
**Commit/PR:** Uncommitted at time of writing — see `.github/workflows/deploy.yml`.
