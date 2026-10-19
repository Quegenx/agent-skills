# Scroll animations

Scroll-driven timelines and ranges, edge-aware scroll fades, and scroll-triggered animation. Sources: Adam Argyle's nerdy.dev posts, Craft's Scroll Fades article, and [css-modern-features] (rushenn/css-modern-features), tagged where used. Existing source examples and named corrections are retained; support comes from MDN and browser-compat-data, checked October 2026. Scroller structure, snapping, events, pull-to-refresh and CSS carousels stay in [SCROLL.md](SCROLL.md); general motion choices and library routes are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion).

## Scroll-driven animation

Status: `animation-timeline` and `animation-range` are Limited availability, Chrome and Edge 115 and Safari 26, no Firefox ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-range)). In 2023 the site trialed "Scroll Linked Animations" behind `#experimental-web-platform-features` ([nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site), 2023-01-01); they shipped as scroll-driven animations. Bramus's [scroll-driven-animations.style](https://scroll-driven-animations.style/) is the learning site and tool set the posts send you to ([nerdy.dev: The CSS Podcast On Scroll Driven Animation](https://nerdy.dev/the-css-podcast-on-scroll-driven-animation), 2024-09-26).

- **Dim what you just scrolled past** ([nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13): "Leave a hint or peek of it, but dim it out. This reduced cognitive load and helps the eye maintain the alignment of the snapped game to the grid." `animation-range` clamps it to the exit; the whole effect sits behind the motion query and `@supports`:

```css
@keyframes leaving-scroller {
  to {
    opacity: .2;
  }
}
```

```css
.game {
  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: view(x)) {
      animation: leaving-scroller linear both;
      animation-timeline: view(x);
      animation-range: exit 50% exit 100%;
    }
  }
}
```

- **Name a timeline to share it** [css-modern-features, animation.md]: "Named timeline - share one scroll timeline across elements":

```css
.scroll-container {
  scroll-timeline-name: --gallery;
  scroll-timeline-axis: inline;
  overflow-x: scroll;
}

.gallery-item {
  animation: slide-in linear;
  animation-timeline: --gallery;
}
```

  Status: `scroll-timeline-name` and `scroll-timeline-axis` ship in Chrome 115 and Safari 26, Firefox in preview only (browser-compat-data), the Limited availability above. The source gave scroll-driven animation as "Chrome 115, Edge 115, Firefox 110, Safari 18 (partial)"; no Firefox release ships it.
- **A load animation and a scroll animation on one property** ([nerdy.dev: A keyframe combo trick](https://nerdy.dev/combining-onload-keyframes-with-scroll-driven-animation), 2024-11-07): assign both, list the scroll-driven one first ("a **lesser composite order**"), and give `animation-timeline` the same order. The post's `👈` after the timeline line is removed (it is not CSS; the timeline list follows the `animation` list in order, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)):

```css
h1 {
  animation: spin linear both, enter 5s ease;
  animation-timeline: scroll(), auto;
}
```

  Trick #2: the time-based one sets only `from`, the scroll-driven one only `to`, so "the slow playing scale-in page load TBA can run while the SDA can blend with it on scroll":

```css
@keyframes enter {
  from {
    scale: 0.01;
  }
}

@keyframes spin {
  to {
    scale: 0.01;
  }
}
```

  MDN's `animation-composition` page doesn't describe stacking order across animations, so the composite-order claim rests on the post. [Demo](https://codepen.io/argyleink/pen/QWeZYZg).
- **Demos whose code wasn't exported** (named here so you can open them): a scroll snap plus scroll-driven carousel that "in the mobile size it looks a lot like the iOS app switcher" ([nerdy.dev: Container Query Carousel With Scroll Driven Animation](https://nerdy.dev/container-query-carousel-with-scroll-driven-animation), 2024-08-18); a carousel where scroll-driven animation "changes hue/theme", "toggles next/prev" and "syncs dots", built with subgrid, `oklch()`, `@property` and `@layer` ([nerdy.dev: Scroll Driven Hue Changing Carousel](https://nerdy.dev/scroll-driven-hue-changing-carousel), 2023-08-16; it said "Canary with #experiments enabled", see the status above); grid images with "2 lines of CSS", "a courtesy media query" and "a keyframe" ([nerdy.dev: Subtle Scroll Driven Animation For Grid Images](https://nerdy.dev/subtle-scroll-driven-animation-for-grid-images), 2023-12-11); `view()` with `:nth-of-type(An + B)` and `@keyframes` ([nerdy.dev: Scroll To Bloom](https://nerdy.dev/scroll-to-bloom), 2025-09-20); a `<details>` table-of-contents scroll spy on the CSS Wrapped 2024 site, video only ([nerdy.dev: Pure CSS Scroll Spy Table Of Contents](https://nerdy.dev/pure-css-scroll-spy-table-of-contents), 2025-01-15); orbits with "billboarding, center of mass pivoting, and CSS trig functions" ([nerdy.dev: CSS Scroll Driven Gyro Trig Experiments](https://nerdy.dev/css-scroll-driven-gyro-trig-experiments), 2026-02-27).
- **Where it differs:** [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion) asks for scroll-in reveals of 8-16 px over 300-500 ms "once, not on every pass", and keeps parallax to a few percent. The effects here are scrubbed by scroll, so they replay on every pass by design (the dimmed game, the pull-to-refresh indicator).

### Edge-aware scroll fades

[Craft] ([Scroll Fades](https://craft.gustavofior.com/scroll-fades), 2026-10-14, following the shadcn/ui Scroll Fade utility). The fade is a `mask-image` gradient, not an overlay: "it works over any background, including images and gradients, and it never blocks clicks." A static two-ended mask "fades the first row when you are at the top ... At the bottom this is actively misleading", so the fade sizes are registered custom properties that a scroll-driven animation moves: "The top fade grows from `0` to its full size over the first `3rem` of scrolling, the bottom fade shrinks back to `0` over the last `3rem`." Horizontal chip or tab rows work the same way, "which also hints at the gesture". Verbatim:

```css
/* The fade sizes. Registered so they can animate. */
@property --fade-start {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

@property --fade-end {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

@keyframes fade-start {
  from {
    --fade-start: 0px;
  }
  to {
    --fade-start: 2.5rem;
  }
}

@keyframes fade-end {
  from {
    --fade-end: 2.5rem;
  }
  to {
    --fade-end: 0px;
  }
}

.scroll-fade-y,
.scroll-fade-x {
  mask-image: linear-gradient(
    var(--fade-direction),
    transparent,
    black var(--fade-start),
    black calc(100% - var(--fade-end)),
    transparent
  );
}

.scroll-fade-y {
  --fade-direction: to bottom;
}

.scroll-fade-x {
  --fade-direction: to right;
}

/* Let the scroll position drive both fades. */
@supports (animation-timeline: scroll()) {
  .scroll-fade-y,
  .scroll-fade-x {
    animation:
      fade-start 1ms linear both,
      fade-end 1ms linear both;
    animation-range:
      0 3rem,
      calc(100% - 3rem) 100%;
  }

  /* After the shorthand, which resets the timeline. */
  .scroll-fade-y {
    animation-timeline: scroll(self y);
  }

  .scroll-fade-x {
    animation-timeline: scroll(self x);
  }
}

/* No scroll timelines: fade both ends all the time. */
@supports not (animation-timeline: scroll()) {
  .scroll-fade-y,
  .scroll-fade-x {
    --fade-start: 2.5rem;
    --fade-end: 2.5rem;
  }
}
```

- **Declare `animation-timeline` after the shorthand,** which resets it (the MDN note is under [Pull to refresh](SCROLL.md#pull-to-refresh)).
- **The mask fades the scrollbar too:** "the mask applies to the whole scroll container, scrollbar included ... Either hide it, as above, or move the mask to an inner wrapper and let the outer element scroll." Craft hides it on chip rows ("a horizontal bar under a row of chips is just too much visual noise"); styling a visible one is in [SCROLLBARS.md](SCROLLBARS.md).
- Status: `mask-image` unprefixed ships in Chrome 120, Firefox 53, Safari 15.4, and `@property` in Chrome 85, Firefox 128, Safari 16.4 (browser-compat-data); `animation-timeline` has the Limited availability status above.
- **landing-page-ui drives its carousel fades from motion values** instead, asymmetric (3rem start, 6rem end) and flipped in right-to-left: "the fade appears quickly (80ms) when there is more to scroll on that side and disappears slowly (700ms) when the end is reached" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)).

## Scroll-triggered animation

[nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25: "Trigger a scroll driven transition in, and never transition out", by ending the trigger's activation range at infinity. The post's code:

```css
.nav-title {
  timeline-trigger-activation-range-end: calc(infinity * 1px);
}

.product-title {
  animation: slide-and-fade 150ms ease both;
  animation-trigger: play-forwards play-backwards;
}
```

The post's `animation-trigger` has no trigger name, which the current grammar requires: "the keyword `none` or a `<dashed-ident>` followed by one or two `<animation-action>` values", where the name comes from `timeline-trigger` on the tracked element ([MDN animation-trigger](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-trigger), [MDN timeline-trigger](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/timeline-trigger)). Corrected, with a name added and `view()` as the source (MDN's example source; the post's demo source isn't exported):

```css
.nav-title {
  timeline-trigger: --nav-title view();
  timeline-trigger-activation-range-end: calc(infinity * 1px);
}

.product-title {
  animation: slide-and-fade 150ms ease both;
  animation-trigger: --nav-title play-forwards play-backwards;
}
```

The longhand comes after the shorthand, which resets it. Status: scroll-triggered animations are experimental, Chrome and Edge 146 only. Actions per MDN: `none`, `play`, `play-forwards`, `play-backwards`, `play-once`, `pause`, `replay`, `reset`. The demo itself uses `scroll 100%`, "a specced way that feels closer to the intent", ending the range at the end of the scroll area; a scroll-driven version of the same navbar is there to compare ([triggered](https://codepen.io/argyleink/pen/BypVjyj), [scroll-driven](https://codepen.io/argyleink/pen/zxNaGVK)). `calc(infinity)` is in [CSS-INFINITY.md](CSS-INFINITY.md).

## Prove it

- **Scroll-driven:** in Firefox (no `animation-timeline`), the items stay fully opaque; in Chrome and Safari 26 they dim only while exiting, and `animation-timeline` is declared after `animation`.
- **Triggered:** with the corrected trigger, the title plays in once and stays when scrolling back up, in Chrome 146+.
- **Scroll fades:** at the top of a list only the bottom edge fades, at the end only the top; in a browser without `animation-timeline` both ends fade.
