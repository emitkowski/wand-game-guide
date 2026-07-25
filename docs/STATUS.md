# STATUS.md
_Last updated: 2026-07-25 by Claude_

## Current phase
**Chat history sync — spec, backend, and working UI built; all known bugs fixed; deployed pending commit**
Laravel 13 + Inertia/Vue3 starter kit foundation (Fortify auth, 2FA, Pennant feature flags, Reverb, Telescope) is complete — passkey login was removed and the site now goes straight to `/login` per developer direction. The Game Guide chat feature (job assignment — docs/chat-sync-spec.md) has a full vertical slice: `conversations`/`messages` tables, two API endpoints, a real authenticated chat UI (`resources/js/pages/game-guide/Chat.vue`) reachable from the dashboard, a Redis cache, structured logging, and a genuine client-side offline outbox (localStorage-persisted, auto-replays in order on reconnect). All three bugs found this session are now fixed and tested: BUG-1 (channel auth bypass), BUG-2 (CI ran a third DB engine nobody else uses), BUG-3 (history endpoint returned oldest messages first). Built and passing locally but **not yet committed** (Eric commits everything himself). Production at https://wand-game-guide.ericmitkowski.com currently only has the base app; everything above auto-deploys via GitHub Actions once committed and pushed to `main`. See remote.md for deployment details.

## Project health
_Claude verifies build/test status by running commands — never assumes from last session_
| Indicator | Status | Detail |
|---|---|---|
| Build | ✓ ok | Sail containers locally; production live at wand-game-guide.ericmitkowski.com (native, DO droplet) |
| Tests | ✓ passing | Backend: 72 passed (222 assertions), 3.37s. Frontend: 29 passed across 7 files, 2.94s |
| Coverage | 51.0% backend, 21.13% stmts frontend | Both below the 80% threshold — pre-existing gap overall; the chat-sync-owned files (`ConversationMessageController`, `RecordConversationMessage`, `Chat.vue`, etc.) are individually at or near 100%. See docs/TESTING_COVERAGE.md |
| Open bugs | 0 — all three found this session are fixed and tested | See docs/BUGS_ARCHIVE.md |
| Blocker | none | Everything is complete locally but uncommitted — Eric commits/pushes himself |

## Last meaningful progress
- 2026-07-24: Chat history sync tech spec + code scaffold built for a job assignment (docs/chat-sync-spec.md) — conversations/messages tables, idempotent ordered message sync, cursor pagination, Reverb broadcast, Pennant-gated rollout
- 2026-07-24: Deployed to production at https://wand-game-guide.ericmitkowski.com on the existing DO droplet, mirroring the northstar/theowladvisor pattern; GitHub Actions auto-deploy wired
- 2026-07-24: Built the Game Guide chat UI (history load, optimistic send, Reverb live updates, cursor-paginated "load older"), reachable from a new dashboard entry point; removed passkey sign-in entirely (all `@chisel-passkeys`-marked code) and made `/` redirect straight to `/login`; seeded a local test login (`test@wand.com` / `gameguidetest`)
- 2026-07-25: Closed the gap between the spec and the code — fixed BUG-3 (history endpoint returned oldest messages first, not most recent), added a working Redis cache for the default history fetch, added structured `game_guide.*` logging plus a Pennant flag-exposure listener, and replaced the UI's manual-retry-only send flow with a genuine localStorage-persisted offline outbox that auto-replays in order on reconnect
- 2026-07-25: Filled out the full MAP doc structure (ARCHITECTURE.md, CODE_PATTERNS.md, GLOSSARY.md, plus human-authored DESIGN/DOCKER/SETUP/COMPLIANCE.md drafted and approved)
- 2026-07-25: Fixed the two remaining open bugs — BUG-1 (channel auth always passed due to a UUID-to-int cast bug) and BUG-2 (CI tested against MySQL while local/production use SQLite/Postgres) — both now covered by `tests/Feature/BroadcastAuthorizationTest.php` and a simplified `deploy.yml` test job respectively

## What's next
_Project-level priorities — milestones and features, not individual session tasks_
1. Eric reviews and commits this work, then pushes to `main` — auto-deploys via the wired GitHub Actions pipeline
2. Hook up an actual AI to generate Game Guide's replies — currently in discussion, reusing an "AI personality" system from a sibling project (theowladvisor.com), ported as a single "gaming guide" personality
3. Design the wand/spell domain: models, schema, and migrations (the actual game-guide subject matter, distinct from the chat-sync assignment)
4. Add PHP static analysis tooling (none currently installed — no phpstan/larastan/pint in composer.json)
5. Close the coverage gap to the 80% threshold (51.0% backend / 21.13% frontend currently) — mostly pre-existing starter-kit surface (auth pages, settings pages) with no tests, not chat-sync-specific

## Metrics snapshot
_Trend is computed against the previous entry in docs/METRICS_HISTORY.md — that file is the leadership-facing history, this table is just the current snapshot._
| Metric | Value | Trend |
|---|---|---|
| Test count | 101 (72 backend + 29 frontend) | ↑ from 97 |
| Coverage | 51.0% backend / 21.13% stmts frontend | → unchanged (routes/ and CI config aren't in coverage scope) |
| Open bugs | 0 | ↓ from 2 (BUG-1, BUG-2 both fixed) |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |
