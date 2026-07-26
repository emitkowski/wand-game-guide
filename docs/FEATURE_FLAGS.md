# FEATURE_FLAGS.md
_Feature flag registry — AI-maintained_
_Updated immediately when flags are added or removed_
_When starting a new feature: suggest adding a flag before implementing_

## Active flags
| Flag | Purpose | Added | Remove when |
|---|---|---|---|
| `chat-history-sync` | Gates the Game Guide chat history sync API (`/api/v1/conversations/{conversation}/messages`) for the phased rollout in docs/chat-sync-spec.md. Defined in `AppServiceProvider::boot()`, defaults active for local/dev. | 2026-07-24 | Once the phased rollout (docs/chat-sync-spec.md §8) reaches full GA and confidence is high |
| `game-guide-ai-replies` | Kill switch for Game Guide's AI-generated replies (`GenerateGameGuideReplyJob`, dispatched from `RecordConversationMessage::record()`), independent of `chat-history-sync` — lets the Anthropic-calling reply pipeline be disabled (cost incident, provider outage) without taking down message sync/history itself. Defined in `AppServiceProvider::boot()`, defaults active. | 2026-07-25 | No planned removal — this is a standing kill switch, not a rollout flag |

## Removed flags
| Flag | Removed | Reason |
|---|---|---|
