# Project Notes

Use this file to leave notes for Claude Code between sessions — current status, known issues, decisions in progress, or anything useful to know before starting work.

## Current Status

Live in production at **https://wand-game-guide.ericmitkowski.com** (deployed 2026-07-24) on the shared DO droplet (`root@64.23.173.119`, same box as `northstar.ericmitkowski.com` and `theowladvisor.com` — native nginx/php-fpm/postgres/redis/supervisor, no Docker).

Server-side layout (mirrors the other sites' pattern exactly):
- App: `/var/www/wand-game-guide.ericmitkowski.com` (git clone, deploys via `git pull origin main`)
- nginx vhost: `/etc/nginx/sites-available/wand-game-guide.ericmitkowski.com` — had to add `fastcgi_buffer_size 32k; fastcgi_buffers 4 32k;` to the PHP location block (default buffer was too small for Laravel's encrypted session + XSRF cookies, caused "upstream sent too big header" / 502s until fixed)
- php-fpm pool: `/etc/php/8.5/fpm/pool.d/wandgameguide.conf`, socket `php8.5-fpm-wandgameguide.sock`
- Postgres: database + role both named `wand_game_guide`
- Supervisor: `wandgameguide-worker` (queue:work) and `wandgameguide-reverb` (reverb:start --port=8082, proxied through nginx's `/app` location)
- GitHub Actions secrets set on `emitkowski/wand-game-guide` (DEPLOY_HOST/USER/SSH_KEY/PATH) — push to `main` auto-deploys via the existing `.github/workflows/deploy.yml`

**Important:** the chat-sync feature (conversations/messages, docs/chat-sync-spec.md) was built and tested locally in this same session but is **not yet committed** (Eric commits everything himself). The live site currently only has the base starter-kit app deployed. Once he commits and pushes to `main`, the Actions workflow will auto-deploy the chat-sync feature — no further server setup needed, the pipeline is already wired.

## Known Issues

- BUG-1 (docs/BUGS.md): `App.Models.User.{id}` private channel authorization always passes (UUID cast to int comparison bug) — pre-existing, unrelated to chat-sync, not yet fixed.
- BUG-2 (docs/BUGS.md): deploy.yml's CI test job runs against MySQL while the app uses Postgres everywhere else — low severity, not blocking.
- Production `.github/workflows/deploy.yml` doesn't reload php-fpm or restart the supervisor programs after a deploy — fine for code-only changes, but if a future change touches the php-fpm pool config or supervisor command lines, that reload step needs adding manually (or to the workflow).

## Recent Decisions

- 2026-07-24: Deployed to the existing DO droplet rather than Laravel Cloud, reusing the exact pattern already established for northstar/theowladvisor on that box, per Eric's direction.
