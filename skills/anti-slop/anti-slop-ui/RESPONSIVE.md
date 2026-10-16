# Units and responsive layout

Layout reads its content and its container, not the screen. These rules keep desktop exact while everything narrower scales smoothly, keep text resizable (WCAG 1.4.4), and make right-to-left work by default.

## Units

| Unit | For | Never for |
|---|---|---|
| `rem` | font sizes, small spacing (10px and below), control and icon sizes, radii | |
| `clamp(min-rem, rem + cqi, max-rem)` | a smooth scale; keep a `rem` term in the middle | a value with no `rem` part (breaks text resize) |
| `cqi`, `cqmin` | the fluid part inside a component; `cqmin` for squares (with `aspect-ratio: 1`) | |
| container queries | a component's composition: a direction flip, a part shown or hidden, columns that re-span | continuous scaling (use `clamp()`) |
| `%`, `fr`, `minmax()`, `auto-fill` | grids with no breakpoints: `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))` | |
| `min()`, `max()` | caps beside `clamp()`: `inline-size: min(100%, 42.5rem)` | |
| `ch` | text measure: `inline-size: min(100%, 65ch)` | |
| `lh`, `cap` | spacing by line (a textarea starting at `4lh`), aligning an icon to capitals | |
| `dvh`, `svh` | mobile heights: `svh` when nothing may jump, `dvh` to follow the address bar | `vh` |
| `env(safe-area-inset-*)` | anything fixed to a screen edge | |
| `px` | hairlines, outlines, shadows, blur, and values measured at runtime | spacing, type, sizes |
| `vw` | only what belongs to the whole screen | anything inside a component (use `cqi`) |

## A fluid scale that keeps desktop exact

- **Every fluid token's maximum is today's measured desktop size,** so the change only shrinks narrower layouts. Ramp between two page widths (say 22.5rem and 60rem).
- **The formula for a step:** max = px / 16; min = max × ratio (0.75 for space, 0.85 for display type); slope = 100 × (max − min) / (wide − narrow) in `cqi`; intercept = min − (max − min) × narrow / (wide − narrow) in `rem`.
- **Register tokens as typed custom properties** (`@property --space-4 { syntax: "<length>" }`) computed on `:root` (for overlays portaled to the body) and on the page area, so components scale with the page, not with their own small containers. A component that should scale with itself uses `cqi` directly.
- **Name space steps after the framework's step numbers** (`--space-4` is the fluid twin of `p-4`), so the fluid version of every spacing class is obvious.
- **Body and control text stay fixed `rem`;** only display sizes (20px and up) are fluid, and never below 85%.
- **Porting a viewport breakpoint to a container query,** subtract what sits beside the container (a 16rem sidebar, the page padding) and say so in a comment. A query that only stepped a size becomes one `clamp()` ramping over the same widths.
- Only the shell keeps a viewport media query, matching the width the script uses to swap the sidebar for a sheet. Media queries otherwise only for capabilities and preferences (`hover`, `pointer: coarse`, `prefers-reduced-motion`).

## Text and content

- Headings `text-wrap: balance`; paragraphs, list items and captions `pretty`.
- `text-box: trim-both cap alphabetic` on large headings to drop the font's inner padding (a deliberate, small shift; older browsers keep the normal box).
- Textareas grow with `field-sizing: content`, no script.
- `:has()` for a parent that changes with what it holds, `aspect-ratio` for media.

## Direction

Write logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, `block-size`). In a right-to-left app a physical `left` or `right` is a bug, except: centring with `left: 50%` and a translate, code blocks (they read left to right), and parts measured in physical pixels at runtime. Script media queries use `rem` like the CSS.

## Enhancements, not the base

Inside `@supports` only, where the page works without them: `interpolate-size: allow-keywords` (animating to `height: auto`), `progress()`, `sibling-index()` for staggers, typed arithmetic. Don't build the system on features one engine ships alone.

## Enforce what a script can see

A check that fails the build on: 3px or more on spacing, size, type, radius or translate; any `vw`; plain `vh`; physical properties. Older findings go in an allowlist file that only shrinks.
