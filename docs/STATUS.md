# STATUS.md
_Last updated: 2026-07-24 by Claude_

## Current phase
**Chat history sync scaffold — built, tested, deployed pending commit**
Laravel 13 + Inertia/Vue3 starter kit foundation (Fortify auth, 2FA, passkeys, Pennant feature flags, Reverb, Telescope) is complete. A take-home job assignment (Game Guide chat history sync — see docs/chat-sync-spec.md) added `conversations`/`messages` tables, two API endpoints, and full test coverage — built and passing locally but **not yet committed** (Eric commits everything himself per his workflow). The site is live in production at https://wand-game-guide.ericmitkowski.com with the base app; the chat-sync feature will auto-deploy via GitHub Actions once committed and pushed to `main`. See remote.md for full production deployment details.

## Project health
_Claude verifies build/test status by running commands — never assumes from last session_
| Indicator | Status | Detail |
|---|---|---|
| Build | ✓ ok | Sail containers locally; production live at wand-game-guide.ericmitkowski.com (native, DO droplet) |
| Tests | ✓ passing | Backend: 64 passed (192 assertions), 3.51s. Frontend: 21 passed across 7 files |
| Coverage | 47.5% backend | Below the 80% threshold — pre-existing gap, not introduced this session. See docs/TESTING_COVERAGE.md |
| Open bugs | 2 open, low/high severity | BUG-1 (channel auth bypass), BUG-2 (CI DB mismatch) — see docs/BUGS.md |
| Blocker | none | Chat-sync feature is complete locally but uncommitted — Eric commits/pushes himself |

## Last meaningful progress
- Initial commit: Laravel 13 starter kit scaffolded (Fortify, Inertia + Vue3, shadcn-vue/Reka UI components, Wayfinder, Pennant, Reverb, Telescope, Sail)
- MAP v1.0 docs (AGENTS.md, CLAUDE.md, docs/) initialized via map-ai-laravel
- Auth features (registration, 2FA, passkeys) installed and tested
- 2026-07-24: Chat history sync tech spec + code scaffold built for a job assignment (docs/chat-sync-spec.md) — conversations/messages tables, idempotent ordered message sync, cursor pagination, Reverb broadcast, Pennant-gated rollout, 6 new feature tests, all 64 backend tests passing
- 2026-07-24: Deployed to production at https://wand-game-guide.ericmitkowski.com on the existing DO droplet, mirroring the northstar/theowladvisor deployment pattern; GitHub Actions auto-deploy wired for future pushes to `main`

## What's next
_Project-level priorities — milestones and features, not individual session tasks_
1. Eric reviews and commits the chat-sync work, then pushes to `main` — auto-deploys via the now-wired GitHub Actions pipeline
2. Design the wand/spell domain: models, schema, and migrations (the actual game-guide subject matter, distinct from the chat-sync assignment)
3. Fix BUG-1 (channel auth) and BUG-2 (CI DB mismatch) from docs/BUGS.md
4. Add PHP static analysis tooling (none currently installed — no phpstan/larastan/pint in composer.json)
5. Close the coverage gap to the 80% threshold (currently 47.5%)

## Metrics snapshot
_Trend is computed against the previous entry in docs/METRICS_HISTORY.md — that file is the leadership-facing history, this table is just the current snapshot._
| Metric | Value | Trend |
|---|---|---|
| Test count | 79 (58 backend + 21 frontend) | — (first entry) |
| Coverage | unknown | — |
| Open bugs | 0 | — |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |
