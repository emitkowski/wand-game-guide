# DOCKER.md
_Docker container reference — human-authored; Claude may propose edits, but never writes them without developer approval_
_Environment-specific gotchas go in docs/memory/environment.md_
_Last updated: 2026-07-25_

## Services
| Service | Image | Purpose |
|---|---|---|
| laravel.test | sail-8.5/app | Main app container (PHP-FPM equivalent for Sail) |
| reverb | sail-8.5/app | `php artisan reverb:start` — WebSocket server for real-time broadcast |
| queue | sail-8.5/app | `php artisan queue:listen` — processes queued jobs (broadcast dispatch, etc.) |
| vite | sail-8.5/app | `npm run dev` — HMR dev server |
| nginx-proxy, postgres, redis, mailpit | _(external, shared)_ | Managed by `~/code/dev-local`'s shared infra, not this project — started via dev-local's own `./dev.sh start`, not `sail up` |

## Port mappings
| Service | Host | Container |
|---|---|---|
| reverb | `${REVERB_PORT:-8085}` | same |
| vite | `${VITE_PORT:-5180}` | same |

## Volume mounts
| Service | Host path | Container path | Purpose |
|---|---|---|---|
| laravel.test | `.` | `/var/www/html` | App code |
| laravel.test | `/home/eric/code` | same | Lets the container see sibling dev-local projects |
| laravel.test | `/home/eric/.nvm` (ro) | same | Host Node version manager |
| laravel.test | `/home/eric/.claude` (ro) | same | Claude Code config — hardcoded to this machine's home directory, not portable to another dev's machine as-is |

## Environment variables
| Variable | Service | Purpose |
|---|---|---|
| WWWUSER / WWWGROUP | laravel.test | Host UID/GID, avoids file-permission mismatches on bind-mounted code |
| VIRTUAL_HOST / VIRTUAL_PORT | laravel.test | Auto-registers with the shared `nginx-proxy` container |
| REVERB_CLIENT_HOST | laravel.test, queue | Internal Docker network hostname (`reverb`) for the queue/app containers to reach the Reverb service |
| XDEBUG_MODE / XDEBUG_CONFIG | laravel.test | Off by default; `SAIL_XDEBUG_MODE` env var to enable |

## Service dependencies
`vite` depends on `laravel.test`. All services attach to the shared `postgres-shared`/`redis-shared`/`mailpit-shared`/`nginx-proxy` external networks — these must already be running (dev-local's shared services) before `sail up -d` will fully work.

## Common commands
```bash
./vendor/bin/sail up -d
./vendor/bin/sail down
./vendor/bin/sail artisan tinker
./vendor/bin/sail logs -f reverb
```

## Config notes
The `/home/eric/.claude` and `/home/eric/.nvm` bind mounts are personal-machine-specific (injected by this project's scaffolding for AI-assisted dev) — they'd need updating or removing to run this compose file on a different developer's machine.
