---
name: "Wand Game Guide Design System"
colors:
  primary:
    value: var(--primary)
    on: var(--primary-foreground)
typography:
  body-md:
    fontFamily: "Instrument Sans"
rounded:
  md: 0.5rem
---

# DESIGN.md
_UI/frontend design conventions — human-authored; Claude may propose edits, but never writes them without developer approval_
_Last updated: 2026-07-25_

## Conflict resolution
If a component in code visibly contradicts this file (wrong color, wrong spacing, wrong font), this file wins by default — flag the discrepancy to the developer rather than silently matching the code. Exception: if the developer explicitly requests something that contradicts this file, follow the request and note the deviation as a proposed addition rather than silently overriding the file.

## Overview
shadcn-vue ("new-york-v4" style, neutral base color), CSS-variable-driven light/dark theming (toggled via `resources/js/composables/useAppearance.ts`). Deliberately standard shadcn/Tailwind semantic tokens throughout rather than a bespoke visual identity — light/dark and any future palette swap costs nothing as a result.

## Accessibility baseline
Reka UI (Radix-Vue-equivalent) primitives under the hood for every interactive `components/ui/*` element — keyboard navigation, focus rings (`focus-visible:ring-[3px]`), and ARIA semantics come from the library, not hand-rolled per component.

## Colors
Full token set lives in `resources/css/app.css` (CSS custom properties) — don't duplicate it here. Standard shadcn semantic roles only: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, plus a dedicated `sidebar-*` set for the app shell. Never hardcode a hex/rgb value in a component — always the semantic Tailwind class (`bg-primary`, `text-muted-foreground`, etc.), as done throughout `resources/js/pages/game-guide/Chat.vue` and `Dashboard.vue`.

## Typography
Single font family, "Instrument Sans," for everything — no separate heading font. Page titles: `text-lg font-semibold`. Secondary/description text: `text-sm text-muted-foreground`.

## Layout
Sidebar-based app shell (`layouts/app/AppSidebarLayout.vue`) for authenticated pages. Single-purpose focused pages (like the chat) constrain to a centered, narrow column (`mx-auto max-w-2xl`) rather than stretching full-width — deliberate for readability on a conversational UI.

## Elevation & Depth
Minimal — a single `shadow-sm` on the chat panel card is currently the only deliberate elevation in the app. No z-index scale defined yet (nothing currently stacks/overlaps beyond shadcn's own dialog/dropdown primitives, which manage their own layering).

## Shapes
Base radius 0.5rem (`--radius` in `resources/css/app.css`). Panels/cards: `rounded-xl`. Chat bubbles: `rounded-2xl` with one corner squared off (`rounded-br-sm` for the sender's side) for an iMessage-style tail. Pill-shaped inputs/icon buttons: `rounded-full` (the chat composer).

## Components
Generated shadcn-vue primitives live in `resources/js/components/ui/*` — don't hand-edit; regenerate via the shadcn-vue CLI if a primitive needs to change. Feature-specific composition (e.g. the whole chat view) lives directly in `pages/`, not as extracted reusable components, when nothing else reuses it (see docs/CODE_PATTERNS.md's structural patterns).

## Do's and Don'ts
**Do:** Reuse an existing `components/ui/*` primitive before reaching for a new one or a raw HTML element — see `resources/js/pages/game-guide/Chat.vue` for the one deliberate exception (a plain `<textarea>` for the composer, since no `ui/textarea` component exists yet in this project).
**Don't:** Introduce a new color outside the semantic token set, or a new font family, without discussing it first — this app has zero bespoke branding by design.

---
