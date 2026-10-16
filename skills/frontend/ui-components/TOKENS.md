# Tokens

Units, the fluid scale and logical properties are in the `anti-slop-ui` skill's RESPONSIVE.md. This file is what sits on top of them.

## Color: one ink, many alphas

Keep the text color as an RGB triplet and derive everything neutral from it, so text, borders, tints, hover layers and scrollbars stay one family and dark mode flips one value:

```css
:root {
  --ink: 0 0 0;                                   /* dark mode: 255 255 255 */
  --foreground: rgb(var(--ink) / 0.9);
  --muted-foreground: rgb(var(--ink) / 0.5);
  --disabled-foreground: rgb(var(--ink) / 0.3);
  --border: rgb(var(--ink) / 0.08);
  --hover-layer: rgb(var(--ink) / 0.05);
  --press-layer: rgb(var(--ink) / 0.08);
  --radius-full: calc(infinity * 1rem);           /* a pill at any height */
}
```

- **Text at a few fixed strengths** (100, 50, 40, 30%), not a new gray per screen.
- **Status colors come as pairs:** a tinted fill and the text that reads on it, for light and dark. Red text on a 10% red tint fails contrast at the plain red (about 3.9:1); mix the text darker for the tint until it holds 4.5:1 or more.
- **Status by `data-status`,** one set of tones for the whole app (done, running, waiting, not confirmed), so a badge on an account and a badge on a task mean the same thing.
- **Every remote image gets a 1px inner outline at ink 10%** (`outline: 1px solid rgb(0 0 0 / 0.1); outline-offset: -1px`, never tinted), so a white photo on a white card still has an edge.

## Surfaces

- **Page, card, field.** A card is one step down the background ramp with no shadow; inside a card, fields switch to the page color (set `--field` on the card) so they still stand out. A component that reads `--field` gets the right one wherever it sits, including in a portal: read the trigger's computed `--field` when a floating panel opens.
- **A second button style for gray surfaces.** The secondary tint vanishes on a gray strip; a `surface` variant (the card color) keeps it visible there.
- **Radius and padding belong to the component, never the call site.** Padding sits on a card's inner sections, so a card with only a header is not padded twice.
- **Concentric radii:** an element inset in a rounded one gets the outer radius minus the inset (a 14px chip with 6px padding holds an 8px pill).

## Type by role

Utilities named for the job (`type-display`, `type-headline-md`, `type-card-title`, `type-label-sm`, `type-card-meta`), distinct from color utilities, each a size, weight, line height and tracking. Metrics (`type-metric`) add tabular numbers. Load the scripts you ship as faces of one family stack (a Latin variable font and a Hebrew one per weight, `font-display: swap`), so each script picks its own face.

## Motion tokens

Pick the token by what the motion does, not the nearest number:

| Token | Value | Job |
|---|---|---|
| `--duration-micro` | 80ms | tooltip intent delay, tiny fades |
| `--duration-quick` | 150ms | hover, chips, exits of small things |
| `--duration-fast` | 250ms | menus opening, panels closing |
| `--duration-medium` | 350ms | morphs of small boxes, slides |
| `--duration-slow` | 400ms | sheets |
| `--duration-very-slow` | 500ms | backdrops, large dialogs |
| `--ease-smooth-out` | cubic-bezier(.22, 1, .36, 1) | open, close, resize, reposition |
| `--ease-unroll` | cubic-bezier(.32, .72, 0, 1) | drawers, backdrops, disclosure panels opening |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) | swaps, chevrons, small state changes |
| `--ease-pop` | cubic-bezier(.34, 1.36, .64, 1) | a badge or count landing |
| `--duration-instant` | 0.01ms | what every duration becomes under reduced motion |

Scales: modal from .96, menu open from .97, tooltip from .98, menu close to .99. Blurs: 2, 3 and 8 px. Distances from .25rem to about 2rem.

**Springs in CSS:** sample a spring (stiffness, damping, mass) into a `linear()` curve over its settle time, so a CSS transition (a chevron turning, a row pressing, a highlight sliding) moves on the same spring as the Motion components beside it. One spring family per job: rows press on one, the sidebar highlight slides on another, both named.

## Cursors, scrollbars, hit areas

- **Cursors in one base layer:** `pointer` for anything that acts (buttons, `[role=button|tab|option|menuitem]`, `summary`, `select`, the label of a checkbox or switch), `not-allowed` when disabled, and `progress` for `[aria-busy=true]` or a button whose label shimmers: working beats unavailable.
- **Thin scrollbars everywhere:** a thumb at ink 18% on no track, darker on hover; WebKit fallback with a transparent border and `background-clip: padding-box` for inset.
- **Hit area bigger than the drawing:** a `::before` that extends the control to 40px (44px on `pointer: coarse`), inset by half of what it lacks; where neighbours are close, extend height only.
- **Scrollbar side in right-to-left:** a scroller with `dir="ltr"` keeps its bar on the right edge, and its content sets `dir` back to the page's.

## Breakpoints in script

A script that needs the phone layout (to swap the sidebar for a sheet) reads `matchMedia` in `rem`, the same query as the CSS, so both follow the user's font size together; on the server it reports desktop.

## Theme switching

Reveal the new theme as a circle growing from the switch's corner (View Transitions, `clip-path: circle(0)` to `circle(150%)`, about 1.2s ease-out, mirrored in right-to-left); going back conceals the old one the same way. Read the saved theme or the device's, follow the device while none is saved, and use one theme for the site, sign-in and app. With reduced motion the swap is instant.
