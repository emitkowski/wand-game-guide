# wand-game-guide

In-game AI companion app — chat with "Game Guide," a general PC-game companion for tips, boss/enemy strategies, item and secret locations, and build/loadout advice (job sample project).

Laravel 13 + Inertia.js/Vue 3 (Fortify auth, 2FA, Pennant feature flags, Reverb, Sanctum), Postgres, Redis. Conversations sync across sessions/devices with cursor-paginated history and a client-side offline outbox; player messages get a real AI-generated reply from Anthropic's Claude API, delivered over a live WebSocket broadcast. See `docs/ARCHITECTURE.md` for the full system overview.

## What This Adds

On top of the Laravel/Inertia/Vue starter kit foundation (Fortify auth, 2FA, standard settings pages), this app adds one real feature: **Game Guide**, an in-app AI chat companion.

- **Dashboard entry point** — a "Game Guide" link on the authenticated dashboard opens the chat.
- **Chat page** (`/game-guide`) — a wide, elevated chat panel with a scrolling message list and composer, styled with the app's shadcn-vue/Tailwind design system.
- **Real AI replies** — every player message gets a genuine reply from Anthropic's Claude API (a single hardcoded "Game Guide" persona), with a "Game Guide is thinking..." indicator shown while the reply generates in the background.
- **Optimistic send** — a sent message appears instantly, before the server confirms it.
- **Live multi-device sync** — messages sent from one open tab/device appear in another in real time over a WebSocket broadcast, no reload needed.
- **Offline outbox** — messages composed while offline are queued locally and sent automatically, in order, once the connection returns.
- **Reconnect resync** — a client that was disconnected while another device sent messages catches up automatically on reconnect, not just its own queued sends.
- **Scrollback** — cursor-paginated "load older" history as you scroll up.

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
3. Log in with the seeded test account (see `docs/SETUP.md`), open **Game Guide** from the dashboard.
4. Send a message (e.g. "how do I beat the first boss in Elden Ring?"). It should appear instantly (optimistic render), then a "Game Guide is thinking" indicator shows while `GenerateGameGuideReplyJob` calls Anthropic in the background; the reply arrives via Reverb broadcast with no page reload.
5. **Offline outbox:** open dev tools, go offline, send a message (queues locally, shown as "queued"), go back online — it auto-flushes and sends in order.
6. **Multi-device sync:** open the same account in a second browser/tab — messages sent in one appear live in the other over the `conversation.{id}` broadcast channel. Take one tab offline (dev tools → Network → Offline) while a message is sent from the other, then bring it back online — it picks up the missed message automatically on reconnect, no manual reload.
7. **History sync:** reload the page — history reloads from the API (not local state), most recent messages first; scroll up to trigger "load older" via cursor pagination.
