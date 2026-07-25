# COMPLIANCE.md
_Project-specific regulatory and compliance obligations — human-authored; Claude may propose edits, but never writes them without developer approval_
_Distinct from .claude/rules/security.md — that file covers generic secret hygiene; this file covers this project's actual regulatory obligations_
_Last updated: 2026-07-25_

## Applicable frameworks
None currently. This app doesn't process payments, health records, or data under a contractual compliance commitment (no SOC2/HIPAA/PCI-DSS obligation exists). It **is** live in production with real user accounts, so baseline privacy practice still applies even without a named framework requiring it.

## Data classification
| Data type | Classification | Handling requirement |
|---|---|---|
| Email address | PII | Stored plaintext (needed for login identity); never logged |
| Password | Sensitive credential | Bcrypt-hashed (`Hash::make`), never logged, never stored plaintext |
| Two-factor secret/recovery codes | Sensitive credential | Encrypted at rest (Laravel's `encrypted` cast via Fortify) |
| Game Guide chat message content | Potentially sensitive (user-generated) | Not currently classified as regulated data, but structured logs deliberately never include message `body` text — only IDs/metadata (see `App\Actions\RecordConversationMessage`'s log calls) |

## Retention and deletion
Account deletion (`Settings/ProfileController::destroy`) removes the user; `conversations`/`messages` cascade-delete via FK `cascadeOnDelete()` (docs/SCHEMA.md), so no orphaned chat data survives account deletion.

## Audit requirements
No formal audit-log requirement. Structured `game_guide.*` logs (docs/CODE_PATTERNS.md) provide operational traceability but are not a compliance audit trail.

## Access control requirements
Standard per-user ownership checks (a conversation's messages are only visible/postable by that conversation's owner — enforced in each Form Request's `authorize()`). No admin/support tooling exists yet that could access another user's data.

## Constraints on AI-assisted changes
- Never add message `body` content to a log line, metric, or external export without explicit sign-off — the current logging convention deliberately excludes it.
- Never add a new data export destination (analytics, third-party integration) without confirming with Eric first, even though no formal DPA requirement exists yet — this section should be revisited the moment one does (e.g. before adding real payment processing or an EU-specific privacy commitment).

---
