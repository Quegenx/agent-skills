# Units and responsive layout

Layout reads its content and its container, not the screen. These rules keep desktop exact while everything narrower scales smoothly, keep text resizable (WCAG 1.4.4), and make right-to-left work by default.

## Units

| Unit | For | Never for |
|---|---|---|
| `rem` | font sizes, small spacing (10px and below), control and icon sizes, radii | |
| `clamp(min-rem, rem + cqi, max-rem)` | a smooth scale; keep a `rem` term in the middle | a value with no `rem` part (breaks text resize) |
| `cqi`, `cqmin` | the fluid part inside a component; `cqmin` for squares (with `aspect-ratio: 1`) | |
| container queries | a component's composition: a direction flip, a part shown or hidden, columns that re-span; a threshold in `ch` when it switches on reading length ([nerdy.dev](https://nerdy.dev/a-css-container-query-pattern), 2023-10-10) | continuous scaling (use `clamp()`) |
| `%`, `fr`, `minmax()`, `auto-fill` | grids with no breakpoints: `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))` | |
| `min()`, `max()` | caps beside `clamp()`: `inline-size: min(100%, 42.5rem)` | |
| `ch` | text measure: `inline-size: min(100%, 65ch)` | |
| `lh`, `cap`, `rlh` | spacing by line (a textarea starting at `4lh`), aligning an icon to capitals, drop caps, tag padding and vertical rhythm in lines | |
| `dvh`, `svh` | mobile heights: `svh` when nothing may jump, `dvh` to follow the address bar (it does not adjust when the keyboard opens) | `vh` |
| `env(safe-area-inset-*)` | anything fixed to a screen edge | |
| `px` | hairlines, outlines, shadows, blur, and values measured at runtime | spacing, type, sizes |
| `vw` | only what belongs to the whole screen | anything inside a component (use `cqi`) |

- **Why `min(100%, ...)` in the grid row** (Evan Minto's reason, via Argyle): [LAYOUT.md](../../frontend/modern-css/LAYOUT.md#three-unintuitive-layout-solutions). Drop caps, half-leading tag padding, `rlh` rhythm and the units' support: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#line-height-units-lh-and-rlh).
- **`vw` on purpose, both ways:** two radius tricks compare a card with the viewport, so they need `vw` or `vi` by design: `border-radius: max(0px, min(8px, calc((100vw - 4px - 100%) * 9999)))` squares the corners when the card is full width (Ahmad Shadeed, via [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories), 2023-01-26), and `clamp(0px, (100vi - 100%) * infinity, 20px)` does it with `infinity`, with a `100cqi` version for a container ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25). The check below fails the `vw` one.

## A fluid scale that keeps desktop exact

- **Every fluid token's maximum is today's measured desktop size,** so the change only shrinks narrower layouts. Ramp between two page widths (say 22.5rem and 60rem).
- **The formula for a step:** max = px / 16; min = max × ratio (0.75 for space, 0.85 for display type); slope = 100 × (max − min) / (wide − narrow) in `cqi`; intercept = min − (max − min) × narrow / (wide − narrow) in `rem`.
- **Register tokens as typed custom properties** (`@property --space-4 { syntax: "<length>" }`) computed on `:root` (for overlays portaled to the body) and on the page area, so components scale with the page, not with their own small containers. A component that should scale with itself uses `cqi` directly. Registering also makes a token type-safe, and `inherits: false` can perform better: [CUSTOM-PROPERTIES-AND-FUNCTIONS.md](../../frontend/modern-css/CUSTOM-PROPERTIES-AND-FUNCTIONS.md#typed-properties-with-property).
- **Name space steps after the framework's step numbers** (`--space-4` is the fluid twin of `p-4`), so the fluid version of every spacing class is obvious.
- **Body and control text stay fixed `rem`;** only display sizes (20px and up) are fluid, and never below 85%.
- **Porting a viewport breakpoint to a container query,** subtract what sits beside the container (a 16rem sidebar, the page padding) and say so in a comment. A query that only stepped a size becomes one `clamp()` ramping over the same widths.
- Only the shell keeps a viewport media query, matching the width the script uses to swap the sidebar for a sheet. Media queries otherwise only for capabilities and preferences (`hover`, `pointer: coarse`, `prefers-reduced-motion`). Argyle counts colour gamut among them: "Viewport widths n' color gamuts; **As each widen, adapt the UI**" ([nerdy.dev: Device Width Is Like Device Color Gamut](https://nerdy.dev/device-width-is-like-device-color-gamut), 2023-04-05). He also flips a card's `aspect-ratio` from 4/3 to 3/4 under `@media (orientation: portrait)` ([nerdy.dev: Matching Aspects](https://nerdy.dev/matching-aspects), 2024-11-09), a viewport-shape query this line doesn't list.

## Text and content

- Headings `text-wrap: balance`; paragraphs, list items and captions `pretty`. Balance's line limit, and the box that doesn't shrink to the balanced lines: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#text-wrap-balance).
- `text-box: trim-both cap alphabetic` on large headings to drop the font's inner padding (a deliberate, small shift; older browsers keep the normal box). Argyle puts it on `h1, p, button` too; that and support: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#text-box-trim-the-fonts-inner-spacing).
- Textareas grow with `field-sizing: content`, no script. Support and animating the growth: [SELECT-AND-FORMS.md](../../frontend/modern-css/SELECT-AND-FORMS.md#fields-that-size-to-content).
- `:has()` for a parent that changes with what it holds, and `:not(:has())` for one that lacks it ([CASCADE-AND-SCOPE.md](../../frontend/modern-css/CASCADE-AND-SCOPE.md#has-and-selectors)); `aspect-ratio` for media.

## Direction

Write logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, `block-size`). In a right-to-left app a physical `left` or `right` is a bug, except: centring with `left: 50%` and a translate, code blocks (they read left to right), and parts measured in physical pixels at runtime. Don't mirror numeric dates and times either: in Arabic and Hebrew numbers are written left to right, so React Aria dropped `display: flex` on its date segments for normal flow and lets the Unicode Bidirectional Algorithm order them ("Improving Internationalization Support in Our Date and Time Components"). Script media queries use `rem` like the CSS.

- **Vertical writing modes, transforms that stay physical, and asking a model for logical properties:** [LAYOUT.md](../../frontend/modern-css/LAYOUT.md#logical-properties) and [Physical against logical](../../frontend/modern-css/LAYOUT.md#physical-against-logical).

## Enhancements, not the base

Inside `@supports` only, where the page works without them: `interpolate-size: allow-keywords` (animating to `height: auto`), `progress()`, `sibling-index()` for staggers, typed arithmetic. Don't build the system on features one engine ships alone. (`progress()` and `sibling-index()` are no longer one engine: MDN marks both Baseline 2026, newly available, [`sibling-index()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index) since August 2026 and [`progress()`](https://developer.mozilla.org/en-US/docs/Web/CSS/progress) since September 2026; `@supports` still covers older browsers.)

## Enforce what a script can see

A check that fails the build on: 3px or more on spacing, size, type, radius or translate; any `vw`; plain `vh`; physical properties. Older findings go in an allowlist file that only shrinks.
