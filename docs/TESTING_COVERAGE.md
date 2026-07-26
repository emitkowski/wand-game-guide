# TESTING_COVERAGE.md
_Updated by Claude after running the coverage command and reviewing results_
_Do not update without running the coverage command first — never estimate from memory_
_A `[none]`/`[partial]` row here is a coverage gap, not a confirmed bug — see docs/BUGS.md for the bug-vs-coverage-gap distinction and for actual known bugs (BUG-N)_

Legend: `[covered]` = dedicated test file, `[partial]` = some paths tested, `[none]` = no test.

---

## Coverage snapshot
_All suites at a glance — update after every coverage run_

| Suite | Tool | Overall | Threshold | Status | Last run |
|---|---|---|---|---|---|
| Backend | PHPUnit | 100.0% | 80% | ✓ above threshold | 2026-07-26 |
| Frontend | Vitest | 90.83% stmts | 80% | ✓ above threshold | 2026-07-25 |

_Remove rows that don't apply. Add rows for additional suites (e2e, contract, etc.)._

---

# Backend ([PHPUnit / Pest])

**Suite:** 86 tests passing, 0 failing (3.90s with coverage). Up from 85 after BUG-4's fix un-skipped its lock-in test (`GenerateGameGuideReplyTest::test_reply_generation_never_sends_a_trailing_assistant_turn_to_claude`), which now passes for real — see docs/BUGS_ARCHIVE.md's 2026-07-26 entry. Same-day fix for BUG-5 (phpunit.xml's `LOG_CHANNEL=null`/`BROADCAST_CONNECTION=null` were silently coerced to PHP `null` by Laravel's `env()` helper, causing every run to hit Laravel's log emergency-fallback invisibly) didn't change the test count, but eliminated ~22 silent lines written to `storage/logs/laravel.log` on every single run.
**Overall coverage:** 100.0% (PCOV, measured 2026-07-25) — up from 57.9% the same session. The jump wasn't from writing more tests against existing code; it was from deleting ~10 files of confirmed-dead scaffolding (`app/Utils/ApiResponse/*`, `app/Facades/Logger.php`, `app/Utils/Logger/*`, `app/Providers/LoggerServiceProvider.php`, `app/Models/Traits/Activable.php`, `app/functions.php`, `app/Console/Commands/CommandAbstract.php` + its only subclass `Utility/Test.php`) that had zero call sites anywhere in the app and was dragging the denominator down — see docs/ARCHITECTURE_HISTORY.md's 2026-07-25 entry. The one genuine remaining gap (`app/Jobs/BroadcastPingJob.php`, previously 50%) got a real new test (`tests/Unit/Jobs/BroadcastPingJobTest.php`) asserting `handle()` actually dispatches the `BroadcastPing` event — the existing `BroadcastPingTest` only ever asserted the job was *queued* (`Queue::fake()`), never that its `handle()` method does the right thing.

> Re-run `./vendor/bin/sail artisan test --coverage --compact` and update the % column whenever a tracked file's coverage moves ≥2 points or crosses a 100% boundary.

## How to run

```bash
./vendor/bin/sail artisan test --compact              # run the suite
./vendor/bin/sail artisan test --coverage --compact    # per-file coverage report (files below 100% only)
```

---

## Area 1 — Chat history sync (docs/chat-sync-spec.md)

_All files below are at 100% — they don't appear in Collision's compact report, which only lists files under 100%._

| File | % | Status | Notes |
|---|---|---|---|
| `app/Actions/RecordConversationMessage.php` | 100% | `[covered]` | Idempotency, locked-counter ordering, cache invalidation, structured logging, broadcast dispatch — all exercised by `ConversationMessageTest` |
| `app/Http/Controllers/Api/V1/ConversationMessageController.php` | 100% | `[covered]` | Both the cacheable (no cursor/limit) and bypass paths exercised, including cache hit/miss |
| `app/Http/Controllers/GameGuideController.php` | 100% | `[covered]` | `GameGuideControllerTest` |
| `app/Http/Requests/Api/V1/StoreMessageRequest.php` | 100% | `[covered]` | Authorization path covered by the cross-user rejection test |
| `app/Http/Requests/Api/V1/IndexMessagesRequest.php` | 100% | `[covered]` | |
| `app/Http/Resources/MessageResource.php` | 100% | `[covered]` | |
| `app/Models/Conversation.php`, `app/Models/Message.php` | 100% | `[covered]` | |
| `app/Events/MessageCreated.php`, `app/Jobs/BroadcastMessageJob.php` | 100% | `[covered]` | Exercised indirectly — `QUEUE_CONNECTION=sync` in tests runs the job inline on every real (non-idempotent-replay) message creation |
| `app/Providers/AppServiceProvider.php` (Pennant `FeatureRetrieved` listener) | 100% | `[covered]` | Fires on every gated-route request in the existing test suite; not asserted on directly (no dedicated log-capture test) |
| `routes/channels.php` (`conversation.{id}`, `App.Models.User.{id}` channels) | not measured (routes/ excluded from `<source>`) | `[covered]` | `tests/Feature/BroadcastAuthorizationTest.php` — hits the real `/broadcasting/auth` route with a real `reverb` connection (BUG-1's fix, formerly untested) |

## Area 2 — Game Guide AI replies

_All files below are at 100%._

| File | % | Status | Notes |
|---|---|---|---|
| `app/Services/AnthropicService.php` | 100% | `[covered]` | `AnthropicServiceTest` — success response parsing, prompt-caching payload shape, 429/failed-response error paths, missing-API-key constructor error. Uses `Http::fake()`, never calls the real API. |
| `app/Actions/GenerateGameGuideReply.php` | 100% | `[covered]` | `GenerateGameGuideReplyTest` — persists the assistant reply via `RecordConversationMessage::recordAssistantReply()`, thread-history assembly (only `player`/`assistant` messages included, `system` excluded, correct role mapping). `AnthropicService` is bound to a Mockery double in the container so no real API call happens. |
| `app/Jobs/GenerateGameGuideReplyJob.php` | 100% | `[covered]` | `GenerateGameGuideReplyJobTest` — delegates to the action; failure path logs and rethrows so the queue's normal failed-job handling applies. |
| `app/Actions/RecordConversationMessage.php` (`recordAssistantReply()`, shared `createLocked()`) | 100% | `[covered]` | Extended `ConversationMessageTest`/new `GenerateGameGuideReplyTest` — same locked-counter/cache-invalidation/broadcast path as player messages. |
| `app/Providers/AppServiceProvider.php` (`game-guide-ai-replies` flag dispatch gate) | 100% | `[covered]` | `GameGuideReplyDispatchTest` — asserts the reply job is dispatched on a new player message, not on idempotent replay, and not when the flag is inactive. |

_Every real message-posting test in the suite would otherwise trigger this pipeline for real (`QUEUE_CONNECTION=sync`) — see the 2026-07-25 entry in docs/memory/testing.md for how `Tests\TestCase` prevents that without disabling `BroadcastMessageJob`'s existing inline-execution coverage._

## Area 3 — Everything else

Nothing left in this area — the pre-existing gaps that used to live here (`app/Utils/ApiResponse/*`, `app/Facades/Logger.php`/`app/Utils/Logger/*`, `app/Jobs/BroadcastPingJob.php`) are either deleted (confirmed dead, zero call sites — see the summary above) or now fully tested. Auth/Fortify (`tests/Feature/Auth/*`) and Settings (`tests/Feature/Settings/*`) were already well-covered by the starter kit and remain so.

---

## What's left to tackle (backend)

Nothing outstanding. Overall coverage is 100%. The only soft gap: no test directly asserts the *content* of `game_guide.*` log lines or the Pennant `FeatureRetrieved` listener's log output — behavior is exercised (100% line coverage) but the log content isn't asserted on. Low priority: these are observability hooks, not business logic.

---

# Frontend ([Vitest / Jest])

**Suite:** 219 tests passing across 50 files, 0 failing (~17s with coverage).
**Overall coverage (2026-07-25, after the "full testing" pass):**

| Metric | % | Hits / Total |
|---|---|---|
| Statements | 90.83% | 644 / 709 |
| Branches | 85.23% | 381 / 447 |
| Functions | 89.69% | 261 / 291 |
| Lines | 90.85% | 626 / 689 |

Up from 23.69% stmts earlier the same day — 43 new test files were added covering every previously-untested page, component, layout, and composable in `resources/js` (auth pages, settings pages, the two-factor auth flow, the whole shared app shell/nav, all layouts). See "How this was structured" below for the approach.

## How to run

```bash
./vendor/bin/sail npm run test              # run the suite
./vendor/bin/sail npm run test:coverage     # full coverage report
```

## Coverage scope

`vitest.config.ts`'s `coverage.exclude` list: `app.ts`, `bootstrap.ts`, `components/ui/**` (generated shadcn-vue primitives), `actions/**` + `routes/**` + `wayfinder/**` (generated Wayfinder code), `test-support/**` (this project's own test helpers, added 2026-07-25 — not application code). Everything else under `resources/js` counts.

## How this was structured

- **Auth pages** (`pages/auth/*.vue`) and **settings pages** (`pages/settings/*.vue`) are almost entirely built on Inertia's `<Form v-bind="action.form()" v-slot="{ errors, processing }">` component, which makes a live network request on submit — untestable directly in jsdom. `resources/js/test-support/formStub.ts` provides a reusable fake `Form` bound to a mutable, per-test-controllable `{ errors, processing }` state via `vi.hoisted()`. See docs/CODE_PATTERNS.md's "Testing pages built on Inertia's `<Form>` component" for the exact wiring pattern.
- **The two-factor auth flow** (`ManageTwoFactor.vue`, `TwoFactorSetupModal.vue`, `TwoFactorRecoveryCodes.vue`, `useTwoFactorAuth.ts`) needed care because `useTwoFactorAuth`'s state is a **module-level singleton**, not per-component-instance — components that consume it are tested by mocking the composable entirely (real `ref()`s from `vi.hoisted()`, reset in `beforeEach`) rather than exercising the shared real state. See the 2026-07-25 entries in docs/memory/testing.md.
- **Shared shell/nav components** (`AppSidebar.vue`, `NavMain.vue`, `NavUser.vue`, `NavFooter.vue`, `AppSidebarHeader.vue`) call `useSidebar()` internally (via shadcn-vue's `SidebarMenuButton`), which throws outside a real `SidebarProvider` — their tests mount a small host component that wraps them in one, rather than trying to stub reka-ui's injection context.
- **Two jsdom API gaps** were hit and fixed once, centrally, in `resources/js/test-setup.ts`: `Element.prototype.scrollIntoView` and `ResizeObserver` (needed by the OTP input used on the two-factor pages). See docs/CODE_PATTERNS.md.
- Work was split three ways to parallelize: layouts + composables + structural shell components, nav/menu components, and (directly) the auth/settings pages plus the two-factor auth component tree — the latter kept together because of the singleton-composable coupling above.

## Area 1 — Game Guide chat

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `pages/game-guide/Chat.vue` | 83.73% | `[covered]` | 14 tests: initial load, Echo subscribe/unsubscribe, optimistic send + reconciliation, failed-send retry, broadcast de-dup, offline queueing, reload persistence, auto-flush on `online`, sequential ordered replay, plus 5 for the "Game Guide is thinking" indicator. Uncovered lines are `loadOlder()`'s scroll-position-preservation branch and one unreachable-in-tests edge of the retry path — pre-existing, low-priority gap, not touched in the 2026-07-25 full-testing pass. |

## Area 2 — Auth, settings, and the two-factor auth flow (2026-07-25)

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `pages/auth/Login.vue`, `Register.vue`, `ForgotPassword.vue`, `ConfirmPassword.vue`, `VerifyEmail.vue` | 100% | `[covered]` | Field rendering, validation-error display, processing/disabled state, outbound links |
| `pages/auth/ResetPassword.vue` | 84.61% | `[covered]` | Same coverage as above; two lines uncovered relate to a `Form` prop (`transform`) never exercised by the stub |
| `pages/auth/TwoFactorChallenge.vue` | 92.85% | `[covered]` | Authentication-code ↔ recovery-code toggle, per-step validation errors |
| `pages/settings/Profile.vue`, `Security.vue`, `Appearance.vue` | 100% | `[covered]` | Pre-filled fields, validation errors, processing state, conditional email-verification notice, child-section composition (`DeleteUser`, `ManageTwoFactor`, `AppearanceTabs` stubbed to keep each page's test focused on its own logic) |
| `components/DeleteUser.vue` | 85.71% | `[covered]` | Dialog open → confirmation content → validation error → processing state. Two lines uncovered: the `@error` focus-management callback (needs a real Form error event, which the stub doesn't emit) and the Cancel button's inline handler |
| `components/ManageTwoFactor.vue` | 85.71% | `[covered]` | All three states (off/continue-setup/on), "Continue setup" click reopens the modal. Two lines uncovered: the enable-Form's `@success` handler and one template line |
| `components/TwoFactorSetupModal.vue` | 89.55% | `[covered]` | Fetch-on-open (and not-if-already-loaded), all three title/description states, Continue with/without confirmation required, error state, reset-on-close. Uncovered: the copy-to-clipboard button branch and the confirm-step Form submission internals (not exercised by the lightweight Form stub used here) |
| `components/TwoFactorRecoveryCodes.vue` | 100% | `[covered]` | Fetch-on-mount, re-fetch-on-toggle-if-empty, reveal/hide (CSS-class-based, not `v-if` — see component source), error state |
| `composables/useTwoFactorAuth.ts` | 95.34% | `[covered]` | Two lines uncovered in a catch block |

## Area 3 — Shared app shell, layouts, and remaining components (2026-07-25)

| File | % Stmts | Status | Notes |
|---|---|---|---|
| All 8 files under `layouts/**` | 100% | `[covered]` | Thin re-export layouts tested for prop/slot forwarding; composition layouts (`AppSidebarLayout`, `AppHeaderLayout`, `AuthCardLayout`, etc.) tested for variant/breadcrumb/slot wiring with child components stubbed |
| `composables/useCurrentUrl.ts` | 100% | `[covered]` | |
| `components/AlertError.vue`, `AppContent.vue`, `AppLogo.vue`, `AppLogoIcon.vue`, `AppShell.vue`, `AppSidebar.vue`, `AppSidebarHeader.vue` | 100% | `[covered]` | |
| `components/Breadcrumbs.vue`, `Heading.vue`, `InputError.vue`, `TextLink.vue`, `UserInfo.vue`, `AppearanceTabs.vue`, `NavFooter.vue`, `NavMain.vue`, `UserMenuContent.vue` | 100% | `[covered]` | |
| `components/NavUser.vue` | 100% stmts | `[covered]` | One branch (of a nested ternary controlling dropdown positioning) uncovered — cosmetic, not behavioral |
| `components/PasswordInput.vue` | 87.5% | `[covered]` | One line uncovered: the `defineExpose`'d `focus()` method, called only by `DeleteUser.vue`'s `@error` handler (see above) |
| `components/AppHeader.vue` | 85.71% | `[covered]` | Not currently wired into any live page (the app uses the sidebar layout) — still tested since it's real, compiling, in-repo code, not dead code |

## Area 4 — Pre-existing, unrelated to any session so far

| File | % Stmts | Status | Notes |
|---|---|---|---|
| `components/BroadcastPing.vue` | 95% | `[covered]` | Pre-existing |
| `composables/useAppearance.ts` | 63.04% | `[partial]` | Pre-existing partial coverage, not touched in the 2026-07-25 pass |
| `composables/useInitials.ts` | 90% | `[covered]` | Pre-existing, one line uncovered |

---

## What's left to tackle (frontend)

1. `pages/game-guide/Chat.vue`'s remaining uncovered branches: the `loadOlder()` scroll-position math, and one retry-path edge — pre-existing, unrelated to the 2026-07-25 full-testing pass.
2. A handful of small, cosmetic/edge-case branches noted in Area 2/3 above (a Form prop never exercised, a clipboard-copy button, a nested ternary branch, an exposed-but-rarely-called `focus()` method) — deliberately not chased further; closing them would mean testing framework plumbing (Inertia's real `Form` internals) rather than this app's own logic.
3. `composables/useAppearance.ts` — pre-existing partial coverage, not part of the 2026-07-25 scope.

---

## Run history

| Date | Suite | Overall | Tests | Duration |
|---|---|---|---|---|
| 2026-07-24 | Backend (PHPUnit) | 47.5% | 64 passed | 3.51s |
| 2026-07-25 | Backend (PHPUnit) | 51.0% | 68 passed | 3.29s |
| 2026-07-25 | Frontend (Vitest) | 21.13% stmts | 29 passed | 2.94s |
| 2026-07-25 | Backend (PHPUnit) | 51.0% | 72 passed | 3.37s |
| 2026-07-25 | Backend (PHPUnit) | 57.9% | 84 passed | 3.75s |
| 2026-07-25 | Frontend (Vitest) | 23.69% stmts | 34 passed | 2.27s |
| 2026-07-25 | Backend (PHPUnit) | 100.0% | 85 passed | 3.70s |
| 2026-07-25 | Frontend (Vitest) | 90.83% stmts | 219 passed | ~17s |
| 2026-07-26 | Backend (PHPUnit) | 100.0% | 86 passed | 3.72s |
| 2026-07-26 | Backend (PHPUnit) | 100.0% | 86 passed | 3.90s (post BUG-5 fix) |
| 2026-07-26 | Backend (PHPUnit) | 100.0% | 86 passed | 3.95s (post telemetry/error channel split) |
