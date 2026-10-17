# Units and responsive layout

Layout reads its content and its container, not the screen. These rules keep desktop exact while everything narrower scales smoothly, keep text resizable (WCAG 1.4.4), and make right-to-left work by default. The owner's rules sort CSS into three tiers: production (everything down to Direction), [enhancements](#enhancements-not-the-base), and [features not to build a system on](#dont-build-a-system-on-them).

## Units

| Unit | For | Never for |
|---|---|---|
| `rem` | font sizes, small spacing (10px and below), control and icon sizes, radii | |
| `clamp(min-rem, rem + cqi, max-rem)` | a smooth scale; keep a `rem` term in the middle | a value with no `rem` part (breaks text resize) |
| `cqi`, `cqmin` | the fluid part inside a component; `cqmin` for squares (with `aspect-ratio: 1`). `cqmin` is the smaller of `cqi` and `cqb`, so it means the short side only in a `container-type: size` container; in an `inline-size` container `cqb` falls back to the nearest size container or the small viewport unit ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)) | |
| container queries | a component's composition: a direction flip, a part shown or hidden, columns that re-span; a threshold in `ch` when it switches on reading length ([nerdy.dev](https://nerdy.dev/a-css-container-query-pattern), 2023-10-10) | continuous scaling (use `clamp()`) |
| `%`, `fr`, `minmax()`, `auto-fill` | grids with no breakpoints: `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))` | |
| `min()`, `max()` | caps beside `clamp()`: `inline-size: min(100%, 42.5rem)` | |
| `ch` | text measure: `inline-size: min(100%, 65ch)`; for a measure that also tracks its column, `inline-size: min(100%, clamp(45ch, 50%, 65ch))` (the owner's rule; in `clamp()` the minimum wins over the maximum, so without the outer `min()` the 45ch floor overflows a narrow column: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp)) | |
| `lh`, `cap`, `ic`, `rlh` | spacing by line (a textarea starting at `4lh`), aligning an icon to capitals, drop caps, tag padding and vertical rhythm in lines; `ic` for measure in CJK text (the owner's rule; [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#cap-and-the-root-relative-font-units)) | |
| `dvh`, `svh` | mobile heights: `svh` when nothing may jump, `dvh` to follow the address bar (it does not adjust when the keyboard opens) | `vh` |
| `env(safe-area-inset-*)` | anything fixed to a screen edge (notch, Dynamic Island, home indicator) | |
| `px` | only thin borders (hairlines, outlines) and shadows (the owner's rule); kept exceptions: blur and values measured at runtime | spacing, type, sizes |
| `vw`, `vi`, `vb` | only what truly belongs to the whole screen (the owner's rule); `vi` and `vb` are the logical `vw` and `vh`, viewport units like them, not logical properties ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)) | anything inside a component (always `cqi`, `cqb`) |

- **Why `min(100%, ...)` in the grid row** (Evan Minto's reason, via Argyle): [LAYOUT.md](../../frontend/modern-css/LAYOUT.md#three-unintuitive-layout-solutions). Drop caps, half-leading tag padding, `rlh` rhythm and the units' support: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#line-height-units-lh-and-rlh).
- **`vw` on purpose, both ways:** two radius tricks compare a card with the viewport, so they need `vw` or `vi` by design: `border-radius: max(0px, min(8px, calc((100vw - 4px - 100%) * 9999)))` squares the corners when the card is full width (Ahmad Shadeed, via [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories), 2023-01-26), and `clamp(0px, (100vi - 100%) * infinity, 20px)` does it with `infinity`, with a `100cqi` version for a container ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25). The check below fails the `vw` one.

## A fluid scale that keeps desktop exact

- **Every fluid token's maximum is today's measured desktop size,** so the change only shrinks narrower layouts. Ramp between two page widths (say 22.5rem and 60rem).
- **The formula for a step:** max = px / 16; min = max × ratio (0.75 for space, 0.85 for display type); slope = 100 × (max − min) / (wide − narrow) in `cqi`; intercept = min − (max − min) × narrow / (wide − narrow) in `rem`.
- **Register tokens as typed custom properties** (`@property --space-4 { syntax: "<length>" }`) computed on `:root` (for overlays portaled to the body) and on the page area, so components scale with the page, not with their own small containers. A component that should scale with itself uses `cqi` directly. Registering also makes a token type-safe, and `inherits: false` can perform better: [CUSTOM-PROPERTIES-AND-FUNCTIONS.md](../../frontend/modern-css/CUSTOM-PROPERTIES-AND-FUNCTIONS.md#typed-properties-with-property).
- **A modular scale can be written in CSS** (the owner's rule): `calc(1rem * pow(var(--ratio), 2))`. `pow()` is Baseline widely available since 2026-06-07 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/pow)), so it belongs here, not among the enhancements. Keep each step's maximum at the measured desktop size.
- **Name space steps after the framework's step numbers** (`--space-4` is the fluid twin of `p-4`), so the fluid version of every spacing class is obvious.
- **Body and control text stay fixed `rem`;** only display sizes (20px and up) are fluid, and never below 85%.
- **Porting a viewport breakpoint to a container query,** subtract what sits beside the container (a 16rem sidebar, the page padding) and say so in a comment. A query that only stepped a size becomes one `clamp()` ramping over the same widths.
- Only the shell keeps a viewport media query, matching the width the script uses to swap the sidebar for a sheet. Media queries otherwise only for capabilities and preferences (`hover`, `pointer: coarse`, `prefers-reduced-motion`). Argyle counts colour gamut among them: "Viewport widths n' color gamuts; **As each widen, adapt the UI**" ([nerdy.dev: Device Width Is Like Device Color Gamut](https://nerdy.dev/device-width-is-like-device-color-gamut), 2023-04-05). He also flips a card's `aspect-ratio` from 4/3 to 3/4 under `@media (orientation: portrait)` ([nerdy.dev: Matching Aspects](https://nerdy.dev/matching-aspects), 2024-11-09), a viewport-shape query this line doesn't list.

## Text and content

- Headings `text-wrap: balance`; paragraphs, list items and captions `pretty`. Balance's line limit, and the box that doesn't shrink to the balanced lines: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#text-wrap-balance).
- `text-box: trim-both cap alphabetic` on large headings to drop the font's inner padding (a deliberate, small shift; older browsers keep the normal box). Argyle puts it on `h1, p, button` too; that and support: [TYPOGRAPHY-AND-UNITS.md](../../frontend/modern-css/TYPOGRAPHY-AND-UNITS.md#text-box-trim-the-fonts-inner-spacing).
- Textareas and text inputs grow with `field-sizing: content`, no script. Support and animating the growth: [SELECT-AND-FORMS.md](../../frontend/modern-css/SELECT-AND-FORMS.md#fields-that-size-to-content).
- `:has()` for a parent that changes with what it holds, and `:not(:has())` for one that lacks it ([CASCADE-AND-SCOPE.md](../../frontend/modern-css/CASCADE-AND-SCOPE.md#has-and-selectors)); `aspect-ratio` for media.

## Direction

Write logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, `block-size`). In a right-to-left app a physical `left` or `right` is a bug, except: centring with `left: 50%` and a translate, code blocks (they read left to right), and parts measured in physical pixels at runtime. Don't mirror numeric dates and times either: in Arabic and Hebrew numbers are written left to right, so React Aria dropped `display: flex` on its date segments for normal flow and lets the Unicode Bidirectional Algorithm order them ("Improving Internationalization Support in Our Date and Time Components"). Script media queries use `rem` like the CSS.

- **Vertical writing modes, transforms that stay physical, and asking a model for logical properties:** [LAYOUT.md](../../frontend/modern-css/LAYOUT.md#logical-properties) and [Physical against logical](../../frontend/modern-css/LAYOUT.md#physical-against-logical).

## Enhancements, not the base

The owner's rule: inside `@supports` only, where the page works without them.

- `progress()` maps a value to 0 to 1 (clamped unless `no-clamp`): Baseline 2026, newly available since September 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/progress)).
- Typed arithmetic: `calc(100cqi / 1px)` gives a unitless number (MDN: "`100vw / 1px` is valid and results in a unitless value", [`calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc), [Using typed arithmetic](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Using_typed_arithmetic)). Chrome 140, Safari 26 and Firefox 158 (since 2026-10-13) ship it per browser-compat-data; MDN shows no Baseline label yet.
- `sibling-index()` and `sibling-count()` for staggers and counts: Baseline 2026, newly available since August 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)).
- `interpolate-size: allow-keywords` (animating to `height: auto`): Chromium only (Chrome and Edge 129), not Baseline, experimental ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size)); elsewhere the size changes instantly.

`@supports` still covers the browsers older than these releases.

## Don't build a system on them

The owner's rule: features one engine ships alone.

- `if()` and `@function`: Chromium only (Chrome and Edge 137 and 139), not Baseline, experimental ([MDN `if()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if), [MDN `@function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function)); [CUSTOM-PROPERTIES-AND-FUNCTIONS.md](../../frontend/modern-css/CUSTOM-PROPERTIES-AND-FUNCTIONS.md#custom-functions-and-if).
- `@container scroll-state()`: Chrome and Edge 133 only, not Baseline ([SCROLL.md](../../frontend/modern-css/SCROLL.md#scroll-state-queries)).
- `display: grid-lanes` (the shipped name for masonry): experimental, Safari 26.4 only ([MDN `display`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display), [Grid lanes guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Grid_lanes); [LAYOUT.md](../../frontend/modern-css/LAYOUT.md#grid-and-subgrid)).
- `random()`: Safari 26.2 only, not Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/random)); niche decoration, not responsiveness.

## Enforce what a script can see

A check that fails the build on: 3px or more on spacing, size, type, radius or translate; any `vw`, `vi` or `vb` outside a rule marked as belonging to the whole screen (the owner's rule above); plain `vh`; physical properties. Older findings go in an allowlist file that only shrinks.
