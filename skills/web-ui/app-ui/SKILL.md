---
name: app-ui
description: "Builds the UI of the product itself, the signed-in app (not its marketing site or its agent chat), so every control, menu, dialog, table and data view feels made by one hand. Tokens, buttons, fields, morphing menus, dialogs that grow from their trigger, in-place confirms, filters, tables, boards, pending and empty states, right-to-left, and a checker that keeps it that way. React with Motion and headless primitives, CSS first. Use when building or reviewing app screens, UI components or a design system."
---

# App UI

A design system is not a palette and a button. It is a few hundred small decisions (how a menu grows, what a button says while it waits, where an error appears, what stays on screen while a panel closes) made once and reused everywhere, so no screen has to invent them. The numbers here are tested ones; change one on purpose, in the token, never on one screen.

| The job | Read |
|---|---|
| Tokens: color, surfaces, type roles, the fluid scale, motion, focus, cursors, hit areas, direction, theme | [TOKENS.md](TOKENS.md) |
| Buttons, icons, text that morphs, fields and form layout, number inputs, search, checkboxes, switches, segmented tabs, tooltips, badges, avatars, formatting numbers, dates and user text | [CONTROLS.md](CONTROLS.md) |
| The app shell, menus and selects whose trigger becomes the menu, date ranges, the sidebar and its sliding highlight | [MENUS.md](MENUS.md) |
| Dialogs that grow from their button, sheets, in-place confirms, disclosure panels, step slides, settings | [OVERLAYS.md](OVERLAYS.md) |
| Sign-in, sign-up and recovery pages, the session guards, connecting an outside account in steps | [AUTH.md](AUTH.md) |
| Filters and chips, tables, selection bars, boards and lists, drag and drop, feeds and cards, media | [DATA-VIEWS.md](DATA-VIEWS.md) |
| Pending labels, optimistic changes, unknown outcomes, progress and stop, errors, empty and loading | [STATES.md](STATES.md) |
| A checker that blocks drift: the rules, the allowlist, the ratchet | [CHECKS.md](CHECKS.md) |
| The production source of every piece above, to copy as is | [reference/REFERENCE.md](reference/REFERENCE.md) |

Durations, curves and springs in general are in the `ui-animation` skill; how much decoration a product should have is in `anti-slop-ui`; the chat surface of an agent is `agent-chat-ui`; the marketing site is `landing-page-ui`. Those two own their own motion: the app's is calm and quick, the site's expressive, the agent's built around waiting.

To build it exactly, copy from reference/ rather than writing it from the description.

## The rules

1. **One component per job, and every screen uses it.** A copied class list or a call-site override of padding, radius, shadow or background forks the component; the next fix to it misses that screen. A screen that needs a new look gets a variant on the component.
2. **Name things by meaning.** Icons by what they do (`send`, `close`, `trash`), colors by job (`--foreground`, `--card`, `--destructive`), type by role (`type-headline`, `type-label-sm`). Swapping artwork or a theme is then one line.
3. **Layout never jumps.** A label that changes keeps its width moving smoothly (morphing text); two texts that swap share one grid cell sized by the taller; a closing selection bar, confirm or dialog keeps its last content until it is closed; a column that gains a button never widens. If something has to move, it animates.
4. **The thing the user touched is where the result appears.** A dialog grows out of the button that opened it and shrinks back into it; a menu is its trigger, grown; a confirm happens on the button itself; an error sits in the column or row it is about.
5. **Every state is designed:** rest, hover, pressed, focus, open, disabled, pending, failed, empty, loading, filtered-to-nothing, partial. Pending says what is happening in words; failed says what to do next; empty offers the one next action.
6. **Keyboard, screen reader and touch are the same product.** Real buttons and links, headless primitives for focus and dismissal, no focus ring anywhere (a recorded design decision, the browser default included: `:focus, :focus-visible { outline: none }` in the base layer) while focus still reveals what hover reveals, labels that name the thing (`Remove "Weekly report"`, not `Remove`), meaning never carried by color alone, hover-only reveals that also show on focus and on touch.
7. **Logical properties and both directions.** `inline-start` not `left`; arcs, sheets, step slides and the sidebar's chevrons follow the direction they are given; user text is isolated (`<bdi>`, `dir="auto"`). A few values are physical by design: a position measured with `getBoundingClientRect` is placed with `left: 0` plus `translate` (a sliding highlight), since `inset-inline-start` would misplace it in right-to-left; menu rows enter from `x: -8` in both directions; a list group's or settings accordion's chevron is a down chevron turned 90deg in both directions; the notification row's padding is a four-value shorthand.
8. **Motion is part of the component,** with its reduced-motion fallback in the same file, and finishes within 1s. Nothing animates on first render that the user didn't cause.

## Prove it

Open each component in both directions, both themes, at 320 px and on a touch device. Tab through it, open and close it with the keyboard, press Escape inside it while it sits in a dialog. Click twice fast during every animation. Switch on reduced motion. Throttle the network and watch every pending label, then fail the request. Run the checker ([CHECKS.md](CHECKS.md)) and read its blind-spot list: the rest is checked by eye.
