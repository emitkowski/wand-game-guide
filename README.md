# wand-game-guide

In-game AI companion app — chat with "Game Guide," a general PC-game companion for tips, boss/enemy strategies, item and secret locations, and build/loadout advice (job sample project).

Laravel 13 + Inertia.js/Vue 3 (Fortify auth, 2FA, Pennant feature flags, Reverb, Sanctum), Postgres, Redis. Conversations sync across sessions/devices with cursor-paginated history and a client-side offline outbox; player messages get a real AI-generated reply from Anthropic's Claude API, delivered over a live WebSocket broadcast. See `docs/chat-sync-spec.md` for the sync design and `docs/ARCHITECTURE.md` for the full system overview.

## Prerequisites
- Docker
- Node.js & npm
- mkcert (for the local HTTPS cert)
- Shared dev-local infra running (`cd ~/code/dev-local && ./dev.sh start` — nginx-proxy, postgres, redis, mailpit)

## Getting Started

```bash
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run build     # or `npm run dev` for HMR
```

Seeds a test account: `test@wand.com` / `gameguidetest`. Full setup detail (env vars, troubleshooting common failures): `docs/SETUP.md`.

## Common Commands

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan test --compact              # backend tests
./vendor/bin/sail npm run test                        # frontend tests
./vendor/bin/sail npm run lint:check                  # frontend lint
./vendor/bin/sail npm run types:check                 # frontend type check
./vendor/bin/sail npm run dev                         # HMR dev server
```

## Testing Game Guide

**Automated:**

```bash
./vendor/bin/sail artisan test --compact --filter=GameGuide       # chat controller/page
./vendor/bin/sail artisan test --compact --filter=ConversationMessage  # sync: ordering, idempotency, pagination, caching
./vendor/bin/sail artisan test --compact --filter=AnthropicService     # AI reply generation (Anthropic API mocked via Http::fake — no live calls)
./vendor/bin/sail npm run test -- Chat                            # frontend: optimistic send, offline outbox, live updates
```

**Manually, end-to-end:**

1. Set `ANTHROPIC_API_KEY` in `.env` (needed for real AI replies — without it, messages still sync but Game Guide never responds).
2. Bring up the full stack, including the queue worker and Reverb (both run as separate Sail services already defined in `docker-compose.yml` — `sail up -d` starts them along with everything else):
   ```bash
   ./vendor/bin/sail up -d
   ```
3. Log in as `test@wand.com` / `gameguidetest`, open **Game Guide** from the dashboard.
4. Send a message (e.g. "how do I beat the first boss in Elden Ring?"). It should appear instantly (optimistic render), then a "Game Guide is thinking" indicator shows while `GenerateGameGuideReplyJob` calls Anthropic in the background; the reply arrives via Reverb broadcast with no page reload.
5. **Offline outbox:** open dev tools, go offline, send a message (queues locally, shown as "queued"), go back online — it auto-flushes and sends in order.
6. **Multi-device sync:** open the same account in a second browser/tab — messages sent in one appear live in the other over the `conversation.{id}` broadcast channel.
7. **History sync:** reload the page — history reloads from the API (not local state), most recent messages first; scroll up to trigger "load older" via cursor pagination.

Both `chat-history-sync` and `game-guide-ai-replies` are Pennant flags, default-active for local dev (`AppServiceProvider::boot()`) — see `docs/FEATURE_FLAGS.md` to disable either without touching code.
