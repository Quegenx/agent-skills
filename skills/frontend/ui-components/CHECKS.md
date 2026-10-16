# Keeping it a system

## A checker in CI

A script that reads whole JSX tags (not lines, so a multi-line `<div onClick>` is still one tag) and CSS blocks, and fails the build on drift. Each rule has an id, a one-line why and a fix, printed with every finding (`--explain <id>`):

| Rule | Finds | Fix |
|---|---|---|
| `rule/raw-value` | hex, `rgb()`, `oklch()` outside a token definition line | a semantic token (the checker names the nearest one by color distance for the property's job) |
| `rule/palette-use` | `text-gray-500`, `bg-white` when the theme has a surface role | a role utility |
| `rule/arbitrary-value` | `p-[13px]`; token-only math and transition property lists pass | a scale step |
| `rule/token-parity` | a `var(--x)` nothing defines; a light color with no dark value | define it, or list it as shared |
| `trap/native-control` | `<button>`, `<input>` where the system has one | the component |
| `trap/button-div` | `onClick` on a `div` or an `<a>` with no `href` | a button, or a link when it navigates |
| `trap/link-as-button` | a link with a button's background and padding (block, flex and grid card links pass) | the button's link form |
| `trap/button-clone` | a non-button carrying the button's classes | the button |
| `trap/link-wraps-button` | a link around a button or the reverse | one element |
| `trap/label-unbound` | a label with no `htmlFor` and no control inside | bind it |
| `trap/overlay-conditional-render` | `{open && <Dialog>}` | keep it mounted, pass `open` |
| `trap/loading-label-swap` | a button label that is a plain ternary on a pending flag | morph the label, `aria-busy` ([STATES.md](STATES.md)) |
| `rule/component-override` | padding, radius, shadow or background set at the call site of a system component | a variant |
| `rule/stock-edit` | a vendored component file changed since its recorded hash | review it, record the new hash with a note |
| `trap/motion-transition-all` | `transition: all` | name the properties |
| `trap/motion-ease-in-enter` | an entrance eased in | ease out |
| `trap/motion-overshoot` | a `cubic-bezier` with a y outside 0 to 1 | a preset, unless it follows the hand |
| `trap/hover-unguarded` | a `:hover` that reveals content outside `@media (hover: hover)` | guard it and give touch another way |
| `trap/zoom-disabled`, `trap/viewport-height`, `trap/touch-autofocus`, `trap/touch-tap-highlight` | zoom locked, `100vh` on a shell, autofocus on a page field, tap highlight removed with no pressed style | the touch fixes |

Plus the team's own bans from config (`px` for layout, `vw` inside components, plain `vh`, physical properties; see `anti-slop-ui` RESPONSIVE.md), each with its reason in the team's words.

**Existing debt doesn't block new work:**

- An **allowlist keyed by file, rule and literal value** (`{"card.tsx": {"rule/raw-value": {"#166534": 2}}}`): swapping an allowed value for a new one fails, because the new literal has no entry. Entries can carry a `removeBy` date that warns once passed. A shrink command lowers counts to what is found now and never raises one; a prune command drops entries that match nothing.
- A **ratchet**: per-rule counts over the repo, failing only when a count rises.
- **Changed lines only** for pull requests (`--changed origin/main`), reported as annotations, with every finding in the job summary.
- A **self-test** on fixture files (named `*.fixture` so no compiler sees them), one failing and one passing case per rule.
- The run ends by printing what it **cannot** see: rendered contrast, focus order and what Escape does, layout at each width, overrides built at runtime, motion that can only be measured. Those are checked by eye ([SKILL.md](SKILL.md), Prove it).

## Copying a reference product's look

When a screen must match another product (an embedded preview, a familiar card), measure it instead of guessing: rendered styles and the loaded component source, recorded in source pixels at a 16px root and implemented in `rem`. Match the visible label's typography, not the wrapper's inherited size. Record states too (hover and pressed overlays, the fade-out time, disabled colors). Don't add animations the reference doesn't have. Keep the app's own chrome around it in the app's system, and raise unreadable text to 12px.

## One component, every caller

Before adding a component, search for one that does the job; extend it with a variant instead of a near copy. Register every file in the components folder (a registry entry or a vendored-file row with its hash), so nothing in it is undocumented. When a component changes behavior, update every caller in the same change.
