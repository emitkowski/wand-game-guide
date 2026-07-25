# BUGS.md
_Known bugs — updated by Claude on discovery or after test failures_
_Claude writes immediately on discovery — do not wait for session end_
_Fixed and verified bugs move to docs/BUGS_ARCHIVE.md immediately — one at a time, never batched_
_Each open bug is locked in as a skipped test citing its BUG-N; the test flips from skipped to passing when the fix lands (see the Test/Covered by fields below)_
_Distinct from a coverage gap (docs/TESTING_COVERAGE.md `[none]`/`[partial]` rows): a BUG-N is a confirmed defect with known-wrong behaviour, a coverage gap is just untested code that may or may not be correct_

<!-- Severity: blocking=no further work | high=no workaround | medium=workaround exists | low=minor -->
<!-- Verification tag: append (Verified.) if a human or a passing test confirmed the bug and its fix, or (Agent-reported.) if only Claude observed it — carry the tag forward into docs/BUGS_ARCHIVE.md -->
<!-- Merge conflicts: this file has merge=union in .gitattributes, so concurrent additions from
     different branches combine automatically instead of producing conflict markers. That does
     NOT catch two branches independently assigning the same BUG-N. After merging, scan the
     combined file (and docs/BUGS_ARCHIVE.md) for duplicate BUG-N headers — keep whichever entry
     comes first, renumber the other to the next free number, and fix any references to the old
     number in this file, docs/BUGS_ARCHIVE.md, and docs/qa/*.md. If numbering ever needs a clean
     reset instead of a per-entry rename, append a dated "### Numbering note — YYYY-MM-DD" entry
     under Open bugs stating the next unused number explicitly, so future scans don't have to
     recount from history. -->

## Open bugs
<!-- BUG-N: if a dated "### Numbering note" entry exists below, use the number it states as the next available and skip the recount; otherwise scan BOTH this file and docs/BUGS_ARCHIVE.md for the highest existing number and increment by 1 — numbers are permanent, never reused -->
<!-- Format:
### BUG-[N] — [Short title] (Verified. / Agent-reported.)
- **Discovered:** YYYY-MM-DD via [test failure / code review / runtime]
- **Affects:** [file or module]
- **Severity:** [blocking / high / medium / low]
- **Description:** [What is wrong]
- **Blocking:** [What this prevents, or NONE]
- **Status:** open / investigating
- **Test:** [name of the skipped test locking this in, or NONE if not yet written]
-->

### BUG-1 — Private user channel authorization always passes (Agent-reported.)
- **Discovered:** 2026-07-24 via code review (while adding a new private channel in routes/channels.php for chat sync)
- **Affects:** routes/channels.php — `Broadcast::channel('App.Models.User.{id}', ...)`
- **Severity:** high
- **Description:** The callback compares `(int) $user->id === (int) $id`. `User` uses `HasUuids`, so `id` is a UUID string; casting any UUID string to `int` yields `0` on both sides, so the check always evaluates true regardless of which user is asking. Any authenticated user can subscribe to any other user's private channel.
- **Blocking:** Private per-user broadcast channels (e.g. anything listening on `App.Models.User.{id}`) leak to any authenticated user, not just the owner. NONE of this project's current features appear to broadcast on that channel yet (only `BroadcastPing` uses its own `broadcast-ping.{userId}` channel), so no confirmed data leak today — but the check itself is broken and will silently fail to protect the first feature that uses it.
- **Status:** open
- **Test:** NONE

### BUG-2 — deploy.yml CI test job runs against MySQL, app uses Postgres everywhere else (Agent-reported.)
- **Discovered:** 2026-07-24 via code review (while wiring up production deployment)
- **Affects:** .github/workflows/deploy.yml — `test` job's `services.mysql` + `DB_CONNECTION: mysql` env
- **Severity:** low
- **Description:** Local dev (compose.yaml), production (this session's server setup), and this project's own `.env.example`/AGENTS.md all use Postgres. Only the CI test job in this leftover "replica template" workflow spins up MySQL instead. Also fixed the trigger branch in this same file from `master` to `main` (this repo's actual default branch) as part of this session's deploy work — that part was a real blocker, not just a mismatch.
- **Blocking:** Not currently blocking (standard Eloquent migrations run fine on either engine), but CI isn't testing against the same database engine as production, so a Postgres-specific issue could pass CI and still break in production.
- **Status:** open
- **Test:** NONE

## Fixed bugs
<!-- Move here when resolved, then to docs/BUGS_ARCHIVE.md as soon as the fix is verified — do not let this section accumulate -->
<!-- Format:
### BUG-[N] — [Short title] ✓ (Verified. / Agent-reported.)
- **Fixed:** YYYY-MM-DD
- **Fix:** [What was done]
- **Covered by:** [test name or file — the skipped test that now passes]
-->
