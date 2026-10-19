# Tokens

Units, the fluid scale and logical properties are in the `anti-slop-ui` skill's RESPONSIVE.md. This file is what sits on top of them.

## Color: one ink, many alphas

Keep the text color as an RGB triplet and derive everything neutral from it, so text, borders, tints, hover layers and scrollbars stay one family and dark mode flips one value:

```css
:root {
  --ink: 0 0 0;                                   /* dark mode: 255 255 255 */
  --foreground: rgb(var(--ink));                  /* solid; the quieter steps carry the alpha */
  --muted-foreground: rgb(var(--ink) / 0.5);
  --disabled-foreground: rgb(var(--ink) / 0.3);
  --border: rgb(var(--ink) / 0.08);               /* dark: 0.12 */
  --hover-layer: rgb(var(--ink) / 0.05);          /* dark: 0.08 */
  --press-layer: rgb(var(--ink) / 0.08);          /* dark: 0.12 */
  --radius-full: calc(infinity * 1rem);           /* a pill at any height */
}
```

- **Text at a few fixed strengths** (100, 50, 40, 30%), not a new gray per screen. Give headings their own `--heading` token so they can part from body text without a new gray.
- **Dark mode raises the alphas:** white at 5% on a dark surface reads weaker than black at 5% on white, so hover is 8%, press 12%, disabled fill 12% and border 12% (light: 5, 8, 5, 8). Borders and field edges may use a warm near-black (`rgb(32 29 29 / .08)`) instead of pure ink.
- **Status colors come as pairs:** a tinted fill and the text that reads on it, for light and dark. An alert's red text, `--destructive-on-tint`, mixes the red 85% with black in light (holds 5:1) and 75% with white in dark. The soft destructive button keeps the plain `--destructive` on its 10% tint, one red with the solid destructive button, chosen over the darker red's contrast. The solid badge fills (blue, gray, red under white text) hold one value in both themes.
- **A soft brand tint** (`--primary-soft`) marks the selected row and the active sidebar item: a light brand tint in light mode, the brand at 30% with a lighter brand text in dark.
- **Status by `data-status`,** one set of tones for the whole app (done, running, waiting, not confirmed), so a badge on an account and a badge on a task mean the same thing. Statuses that are not running (suggested, paused) stay muted and differ by glyph only; running takes the warning tone, done the green. A status built from several sources follows one precedence: the user's own local outcome first (needs verification, not confirmed), then the source's state, then derived states (needs answers), else "unknown".
- **Every remote image gets a 1px inner outline at 10%** (`outline: 1px solid rgb(0 0 0 / 0.1); outline-offset: -1px`; white at 10% in dark mode, never tinted), so a white photo on a white card still has an edge.
- **Opaque tints under sticky things:** where a sticky head covers what scrolls beneath it, mix the ink into the background instead of layering an alpha (`color-mix(in srgb, var(--foreground) 5%, var(--background))`): wells 5%, item hover 3%, selected 7%.

## Surfaces

- **Page, card, field.** A card is one step down the background ramp with no shadow; inside a card, fields switch to the page color (set `--field` on the card) so they still stand out. A component that reads `--field` gets the right one wherever it sits, including in a portal: read the trigger's computed `--field` when a floating panel opens.
- **The dark ramp leans toward the brand hue,** not neutral gray. For example page `#0a0911`, popover `#1c1c22`, card `#25252d`, muted `#27272b`.
- **A sidebar canvas can stay dark in both themes** (`#211d1d` light, `#101018` dark) with its own accent (white 10% and 8%) and muted text; components inside it read the sidebar tokens.
- **Shadows by job:** cards none; `--shadow-xs` `0 2px 4px rgb(0 0 0 / .08)` (dark .3) for a pill on a track; popovers `0 16px 32px rgb(0 0 0 / .075), 0 4px 10px rgb(0 0 0 / .04)` (dark .5 and .26); a dialog's edge is an inset ring at ink 4% (white 8% in dark). A switch's off track is ink 14% (28% in dark).
- **Radii and spacing roles:** base .75rem, input 1rem, card 1.25rem, buttons full; scale sm .5, xl 1, 2xl 1.5, 3xl 2rem. Spacing roles `ui-xs` .125rem and `ui-sm` .625rem are fixed; `ui-md`, `ui-lg` and `ui-xl` point at fluid steps.
- **A second button style for gray surfaces.** The secondary tint vanishes on a gray strip; a `surface` variant (the card color) keeps it visible there.
- **Radius and padding belong to the component, never the call site.** Padding sits on a card's inner sections, so a card with only a header is not padded twice.
- **Concentric radii:** an element inset in a rounded one gets the outer radius minus the inset (a 14px chip with 6px padding holds an 8px pill).
- **Button tokens:** height 2.5rem (large 3rem); text .9375rem / 1.3333 / 500; padding .375rem block, 1.125rem inline; icon gap .5rem; icon color transition `.2s cubic-bezier(.08, .52, .52, 1)`.

## Type by role

Utilities named for the job, distinct from color utilities, each a size, line height, weight and tracking:

| Role | Size / line height / weight |
|---|---|
| `type-display` | `clamp(1.75rem, 1.5rem + 1cqi, 2rem)` / 1.1875 / 700 |
| `type-headline-lg` | `clamp(1.25rem, 1.125rem + .75cqi, 1.5rem)` / 1.2083 / 700 |
| `type-headline-md` | `clamp(1.125rem, 1rem + .5cqi, 1.25rem)` / 1.2 / 600 (`type-panel-title`: the same at 700 in `--heading`) |
| `type-card-title` | 1.0625rem / 1.1765 / 600 |
| base, sm (`type-card-meta`), xs | .9375 / 1.3333, .8125 / 1.2308, .75 / 1.5 |
| `type-label-sm`, `type-label-xs` | .875 / 1.4286 / 500, .75 / 1.3333 / 500 |

- **Headlines scale with their container (`cqi`); body and control text stays fixed,** so the user's own zoom is what enlarges it (WCAG 1.4.4). Metrics (`type-metric`) add tabular numbers.
- **Wrapping:** `text-wrap: balance` on every role and on h1 to h4, `pretty` on `p`, `li`, `dd` and `figcaption`; `text-box: trim-both cap alphabetic` on h1 and h2 inside `@supports`. The body is `min-block-size: 100svh`, letter-spacing 0, antialiased.
- Load the scripts you ship as faces of one family stack (a Latin variable font and a Hebrew one per weight, `font-display: swap`), so each script picks its own face.

## Fluid scale

Register space and display tokens with `@property` as `<length>`, so each one computes where it is declared: on `:root` against the viewport (portaled overlays read that one) and again on the app's content element against the page area. Components then scale with the page, not their own box. The ramp runs from 22.5rem to 60rem; the floor is 75% for space (85% for steps of 14px and under) and 85% for type. Keep the formula for adding a step beside the tokens.

## Motion tokens

Pick the token by what the motion does, not the nearest number:

| Token | Value | Job |
|---|---|---|
| `--duration-micro` | 80ms | tooltip intent delay, tiny fades |
| `--duration-quick` | 150ms | hover, chips, modals and menus closing, text swaps, a tooltip appearing |
| `--duration-fast` | 250ms | menus and modals opening, icon swaps, tabs sliding, page slides |
| `--duration-medium` | 350ms | panels and toasts closing |
| `--duration-slow` | 400ms | panels opening, an input clearing |
| `--duration-very-slow` | 500ms | emphasis, a badge appearing, a text reveal, a success check |
| `--duration-stagger` | 40ms | between siblings entering |
| `--ease-smooth-out` | cubic-bezier(.22, 1, .36, 1) | open, close, resize, reposition |
| unroll | cubic-bezier(.32, .72, 0, 1) | backdrops and disclosure panels opening: written in the backdrop's rule and held in the panel's own `--disclosure-panel-open-easing`, not a global token |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) | chevrons, small state changes |
| `--ease-in-out`, `--ease-out`, `--ease-linear` | | icon and text swaps; tooltips; shimmer |
| `--ease-bounce` | cubic-bezier(.34, 1.36, .64, 1) | a badge popping open |
| `--ease-bounce-strong` | cubic-bezier(.34, 3.85, .64, 1) | a bouncy hover-out (an avatar returning) |
| `--ease-spring-pop`, `--duration-spring-pop` | `linear()` sampled from stiffness 260, damping 20 (8% overshoot), 600ms | popovers that pop open |
| `--duration-instant` | 0.01ms | what every duration becomes under reduced motion (not `none`, so `transitionend` still fires) |

- **Composite tokens** for the common pairs: `--transition-background` (background 150ms standard), `--transition-popup` (opacity and scale 250ms smooth-out), `--transition-popup-instant` (100ms), `--transition-control` (background, border, color, shadow, opacity, scale and translate at 150ms standard).
- **Scales:** modal from .96, menu open from .97, menu close to .99, tooltip from .6 ([CONTROLS.md](CONTROLS.md)). **Blurs:** 2, 3 and 8 px. **Named distances:** micro .25rem (text swap), small .375rem (error shake), base .5rem, medium .75rem (text reveal), large 1.875rem (check badge).
- **Overshoot lives in named tokens** (`--ease-bounce`, `--ease-bounce-strong`, the sampled `--ease-spring-pop`) and in the switch's slide curve. The allowlist records the two cubic tokens by their literal in the motion-tokens file, so the checker reports an overshooting `cubic-bezier` written anywhere else ([CHECKS.md](CHECKS.md)).
- **App motion finishes within 1s.** Trim a looped illustration to fit (1.25s to .95s). The theme reveal (1.2s, once, on a deliberate switch that covers the page) is the stated exception.
- **Utilities:** `popup-fade-scale` (`[data-starting-style]` and `[data-ending-style]` at opacity 0, scale .96) for any headless popup; `round-dismiss-button` (ink 8% at rest, 14% on guarded hover); `interpolate-size: allow-keywords` on `:root` as an enhancement, so `height: auto` animates where supported.
- **Each animated component carries its own motion setup,** so it works wherever it mounts: `LazyMotion features={domAnimation} strict` (`domMax` where it uses `layout`: the morphing menu, the tag pills), `MotionConfig reducedMotion="user"`, and `AnimatePresence initial={false}` wherever a list must not animate on first render.

**Springs in CSS:** sample a spring (stiffness, damping, mass) into a `linear()` curve over its settle time, so a CSS transition (a chevron turning, a row pressing, a highlight sliding) moves on the same spring as the Motion components beside it. One spring family per job: rows press on one, the sidebar highlight slides on another, both named.

## Focus

No control shows a focus ring, outline or focus border, the browser default included: a standing decision recorded in the design doc, set once in the base layer (`:focus, :focus-visible { outline: none }`) and repeated on fields (`border: 0; outline: 0; box-shadow: none` on `:focus` and `:focus-visible`). Focus still reveals what hover reveals (a row's "more" button, a card's add button) and floats labels.

## Cursors, scrollbars, hit areas

- **Cursors in one base layer:** `pointer` for anything that acts (buttons, `[role=button|tab|option|menuitem]`, `summary`, `select`, `::file-selector-button`, checkbox, radio, range and color inputs, the label of a checkbox or switch); `not-allowed` when disabled, including the label of a disabled checkbox or switch field (a disabled choice row in a connect flow keeps `cursor: default`); `progress` for `[aria-busy=true]`, a button whose label shimmers (`:is(button, [role=button]):has(.shimmer-text)`) and every field and button of a form whose submit is busy (`form:has([aria-busy=true]) :is(input, button)`): working beats unavailable. Drag: `grab` on draggable items, `grabbing` on the drag overlay, `default` while dragging is off, plus `touch-action: manipulation`.
- **Thin scrollbars everywhere:** a thumb at ink 18% (30% on hover) on no track; the WebKit fallback is .5rem with a transparent border and `background-clip: padding-box` for inset. Keep it in the base layer so a carousel or tab row can hide its bar with `scrollbar-width: none`.
- **Hit area bigger than the drawing:** a `::before` that extends the control to 40px (44px on `pointer: coarse`), inset by `calc((100% - max(100%, var(--hit-area-min))) / 2)`, so a control already big enough gets nothing; where neighbours are close, extend height only.
- **Scrollbar side in right-to-left:** a scroller with `dir="ltr"` keeps its bar on the right edge, and its content sets `dir` back to the page's.

## Direction

- **Wrap the app in the headless library's direction provider,** so primitives follow right-to-left (arrow keys, placement).
- **Safe areas by direction:** `--safe-area-inline-start` and `-end` map to the right and left insets, swapped under `:dir(ltr)`, so padding against a notch mirrors.

## Breakpoints in script

A script that needs the phone layout (to swap the sidebar for a sheet) reads `matchMedia` in `rem`, the same query as the CSS, so both follow the user's font size together; on the server it reports desktop.

## Theme switching

Reveal the new theme as a circle growing from the page's top start corner (View Transitions, `clip-path: circle(0)` to `circle(150%)`, 1.2s `cubic-bezier(.25, .46, .45, .94)`, origin `0% 0%`, `100% 0%` in right-to-left). Light to dark puts the new snapshot on top and grows it (reveal); dark to light puts the old one on top and shrinks it (conceal). A head script applies the saved theme before first paint, so nothing flashes; follow the device while none is saved, and use one theme for the site, sign-in and app. In React read the saved theme with `useSyncExternalStore(subscribe, readStored, () => "system")`, so the server render and hydration agree. With reduced motion the swap is instant.
