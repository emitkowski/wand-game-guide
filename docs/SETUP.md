# SETUP.md
_Local development setup — human-authored; Claude may propose edits, but never writes them without developer approval_
_Last updated: 2026-07-25_

## Prerequisites
| Tool | Version | Notes |
|---|---|---|
| Git | 2.x+ | https://git-scm.com |
| Claude Code | latest | This project follows the MAP v1.0 doc convention (see AGENTS.md) |
| Docker | latest | Runs all services via Sail |
| Node.js | 24.x | For host-side tooling; Vite itself runs inside the `vite` container |
| mkcert | latest | For the local HTTPS cert (`docker/certs/`) |

## Initial setup
```bash
# 1. Ensure the shared dev-local infra is running first
cd ~/code/dev-local && ./dev.sh start   # nginx-proxy, postgres, redis, mailpit

# 2. Clone and enter this project
git clone git@github.com:emitkowski/wand-game-guide.git
cd wand-game-guide

# 3. Environment
cp .env.example .env

# 4. Start services
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate

# 5. Database
./vendor/bin/sail artisan migrate --seed
# seeds two accounts: eric.mitkowski@gmail.com / secret, and test@wand.com / gameguidetest

# 6. Frontend
./vendor/bin/sail npm install
./vendor/bin/sail npm run build     # or `npm run dev` for HMR
```

## Environment configuration
| Variable | Required | Default | Notes |
|---|---|---|---|
| APP_DOMAIN | yes | wand-game-guide.test | Must resolve via the shared proxy's hosts entry |
| VITE_PORT | yes | 5180 | Must be unique across all projects sharing the dev-local proxy |
| REVERB_PORT | yes | 8085 | Same uniqueness requirement |
| DB_* | yes | — | Points at the shared `postgres-shared` container, not a per-project DB container |

## Verify setup
- `https://wand-game-guide.test` redirects to `/login` (not a 404/connection error)
- Log in with the seeded test account, land on the dashboard
- Click "Game Guide," send a message, see it appear
- `./vendor/bin/sail artisan test --compact` passes

## Common setup failures
| Symptom | Cause | Fix |
|---|---|---|
| Browser cert warning on wand-game-guide.test | mkcert cert missing/not trusted | Regenerate via dev-local's cert tooling |
| Domain doesn't resolve at all | Shared nginx-proxy not running | `cd ~/code/dev-local && ./dev.sh start` first |
| `install:features` command not found | Documented in AGENTS.md but doesn't exist in this installed version | Known gap — feature toggling (e.g. removing passkeys) is currently done by manually deleting `@chisel-*`-marked code, see docs/GLOSSARY.md |

## Development tools
No project-specific PhpStorm/Xdebug configuration beyond Sail's built-in Xdebug support (`SAIL_XDEBUG_MODE` env var).

## Ready to start
Setup is complete when all four "Verify setup" items pass.
