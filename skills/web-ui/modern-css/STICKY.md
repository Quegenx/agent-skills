# Sticky

How `position: sticky` works and fails, offsets shared by several sticky bars, anchor links that clear a sticky header, detecting the stuck state, and a table with a sticky header row and first column. Split out of [SCROLL.md](SCROLL.md), which holds scrollers, snapping and the Chrome-only `scroll-state(stuck)` query. Source: [responsive-craft] (kylezantos/responsive-craft, `references/sticky-scroll-patterns.md`, MIT). `position: sticky` is Baseline widely available (since 2022-03-19, web-features `sticky-positioning`; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)). The source's code uses physical properties and `px`; it is ported here to logical properties and `rem`, the owner's units rule in [RESPONSIVE.md](RESPONSIVE.md), and each snippet names what changed.

**Contents:** [align-self: start in flex and grid](#align-self-start-in-flex-and-grid) · [When sticky does nothing](#when-sticky-does-nothing) · [Several sticky bars](#several-sticky-bars) · [Anchor links under a sticky header](#anchor-links-under-a-sticky-header) · [Detect the stuck state](#detect-the-stuck-state) · [Sticky header row and first column](#sticky-header-row-and-first-column) · [Prove it](#prove-it)

## align-self: start in flex and grid

- "This is the single most missed sticky detail. In flex and grid containers, children stretch to fill their row by default. A sidebar that stretches to full height is already as tall as the content, sticky has no room to "stick" because the element never scrolls past the viewport." Changed: `top` to `inset-block-start`.

```css
/* Without this, sticky sidebar silently fails in flex/grid */
.sidebar {
  position: sticky;
  inset-block-start: var(--header-height);
  align-self: start;  /* required */
}
```

## When sticky does nothing

Check in this order ("`position: sticky` fails silently"):

1. **Overflow on an ancestor:** "Any parent with `overflow: hidden`, `overflow: scroll`, or `overflow: auto` intercepts sticky. Use `overflow: clip` instead if you need visual clipping without creating a scroll container." MDN adds `overlay` to the list: "Note that a sticky element "sticks" to its nearest ancestor that has a "scrolling mechanism" (created when overflow is hidden, scroll, auto, or overlay), even if that ancestor isn't the nearest actually scrolling ancestor" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)). `overflow: clip` is Baseline widely available since 2025-03-12 (web-features `overflow-clip`).
2. **No room to move:** the source says "The parent must have height so there's room for the element to stick within." MDN's wording is about the containing block, not a set height: the element is "stuck" "until meeting the opposite edge of its containing block", so a parent no taller than the element leaves no travel.
3. **No inset:** "`top`, `bottom`, `left`, or `right` must be set to a non-`auto` value." MDN: "At least one inset property (top, inset-block-start, right, inset-inline-end, etc.) needs to be set to a non-auto value for the axis on which the element needs to be made sticky."
4. **As tall as its container:** "Happens in flex/grid without `align-self: start`."
5. **Stacking context traps:** "`transform`, `filter`, `opacity < 1`, `will-change`, `isolation: isolate` on an ancestor creates a new stacking context. Sticky still works, but z-index is trapped within that context." MDN: sticky "always creates a new stacking context" itself.
6. **`transform` and `fixed`:** "Not sticky, but often confused with it. Any `transform` on an ancestor makes `fixed` children position relative to that ancestor, not the viewport." The full list of ancestor properties that do this (MDN's, with `filter`, `contain`, `content-visibility` and more) is in [anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#stacking-without-z-index-wars).

## Several sticky bars

- **Coordinate the offsets with custom properties,** so the offsets "auto-update": "change one variable, everything adjusts". Where the subnav becomes a dropdown, the source sets `--subnav-height: 0px` ("subnav is a dropdown on mobile"). Changed: `60px` and `40px` to `3.75rem` and `2.5rem`, `top` to `inset-block-start`, `height` to `block-size`.

```css
:root {
  --header-height: 3.75rem;
  --subnav-height: 2.5rem;
}

.site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: 100;
  block-size: var(--header-height);
}

.subnav {
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: 90;
  block-size: var(--subnav-height);
}

.table-header {
  position: sticky;
  inset-block-start: calc(var(--header-height) + var(--subnav-height));
  z-index: 80;
}
```

## Anchor links under a sticky header

- [css-modern-features, components.md] "Offset scroll-to-anchor positions, essential when a sticky header covers anchor targets." The source writes `html { scroll-padding-top: var(--header-height); }` or, per element, `.section { scroll-margin-top: calc(var(--header-height) + 1rem); }`; in logical form:

```css
html { scroll-padding-block-start: var(--header-height); }

.section {
  scroll-margin-block-start: calc(var(--header-height) + 1rem);
}
```

  Which one [responsive-craft]: "**Use `scroll-padding`** when all anchors are in the same container with a consistent offset. **Use `scroll-margin`** when different elements need different offsets." Status: both logical longhands ship in Chrome 69, Firefox 68, Safari 15 (browser-compat-data). anti-slop-ui's check is the same rule: "Sticky header with no `scroll-padding-block-start` | Set it to the header height" ([RESPONSIVE.md](RESPONSIVE.md)); app-ui puts "`scroll-margin-block-start` on rows' controls so keyboard focus clears the sticky head" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## Detect the stuck state

- **Use a sentinel.** "CSS has no `:stuck` pseudo-class. Use a zero-height sentinel element." The native `scroll-state(stuck)` query is Chrome only ([SCROLL.md](SCROLL.md#scroll-state-queries)), so elsewhere this observer is the route; `IntersectionObserver` is Baseline widely available (since 2021-09-25, web-features). Changed in the CSS: `height` to `block-size`, `top: 0; left: 0; right: 0` to `inset-block-start: 0; inset-inline: 0`.

```html
<div class="sticky-sentinel" aria-hidden="true"></div>
<header class="site-header">...</header>
```

```css
.sticky-sentinel {
  position: absolute;
  block-size: 1px;
  inset-block-start: 0;
  inset-inline: 0;
  pointer-events: none;
}
```

```javascript
const sentinel = document.querySelector('.sticky-sentinel');
const header = document.querySelector('.site-header');

const observer = new IntersectionObserver(
  ([entry]) => {
    header.classList.toggle('is-stuck', !entry.isIntersecting);
  },
  { threshold: 0 }
);
observer.observe(sentinel);
```

```css
.site-header.is-stuck {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}
```

  "Always `observer.disconnect()` in component cleanup." landing-page-ui does the same for its floating nav: "Detect scrolling with a 4px marker (absolute, 1px wide, `visibility: hidden`, `aria-hidden`, prepended to the body) and an `IntersectionObserver`, not a scroll listener" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)).

## Sticky header row and first column

- "The **sticky corner cell z-index** is almost always forgotten. Without it, the header or column covers the corner when scrolling both directions." "Always wrap in `role="region"` with `aria-label` and `tabindex="0"` for keyboard scrolling." Changed: `overflow-x: auto; overflow-y: auto` to the `overflow` shorthand, `max-height: 400px` to `max-block-size: 25rem`, `top` and `left` to `inset-block-start` and `inset-inline-start`.

```css
.table-wrapper {
  overflow: auto;
  max-block-size: 25rem;
}

thead th {
  position: sticky;
  inset-block-start: 0;
  background: white;
  z-index: 20;
}

.col-sticky {
  position: sticky;
  inset-inline-start: 0;
  background: white;
  z-index: 10;
}

/* The corner cell, highest z-index */
thead th.col-sticky {
  z-index: 30;
}
```

  app-ui's table is its own design: "A scrolling frame with rounded corners (so the header fill never shows square corners)", where "The section and the `<table>` carry an `aria-label` from the view's title" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## Prove it

- **align-self:** a sidebar in a grid or flex row with `align-self: start` sticks while the content scrolls; without it, it doesn't.
- **Overflow:** no ancestor between the sticky element and its scroller has `overflow: hidden`, `scroll`, `auto` or `overlay`; clipping uses `overflow: clip`.
- **Anchors:** a link to a section lands with the heading below the sticky header, not under it.
- **Stuck:** the header gains `is-stuck` once it sticks and loses it at the top; the observer is disconnected when the component unmounts.
- **Two-axis table:** scrolled both ways, the corner cell stays above the header row and the first column, and the wrapper takes keyboard focus and scrolls with the arrow keys.
- **No dashes:** a search of STICKY.md for em and en dash characters finds none.
