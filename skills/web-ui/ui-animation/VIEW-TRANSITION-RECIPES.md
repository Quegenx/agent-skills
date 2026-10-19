# View transition recipes

The CSS that React's `<ViewTransition>` class props name (fades, vertical and directional slides, shared and text morphs, scale, isolation, a sliding indicator), and where its durations, curves and reduced-motion block disagree with this skill and app-ui. Source: Vercel's `vercel-react-view-transitions` skill (MIT, version 1.0.0), `references/css-recipes.md` and `references/patterns.md`, checked against the [Next.js view transitions guide](https://nextjs.org/docs/app/guides/view-transitions) on 2026-10-18. The component, types, patterns, Next.js and the audit are in [REACT-VIEW-TRANSITIONS.md](REACT-VIEW-TRANSITIONS.md); the browser API underneath is in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md).

## CSS recipes

[Vercel, vercel-react-view-transitions] "Copy only what the app needs", always including reduced motion. The blocks below are the source's, unchanged. The durations and curves are the source's; how they meet this skill's numbers is in [the next section](#durations-curves-and-reduced-motion-both-ways).

```css
:root {
  --duration-exit: 150ms;
  --duration-enter: 210ms;
  --duration-move: 400ms;
}
```

```css
@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide {
  from { translate: var(--slide-offset); }
  to { translate: 0; }
}

@keyframes slide-y {
  from { transform: translateY(var(--slide-y-offset, 10px)); }
  to { transform: translateY(0); }
}
```

Fade, for `<ViewTransition enter="fade-in" exit="fade-out" />`:

```css
::view-transition-old(.fade-out) {
  animation: var(--duration-exit) ease-in fade reverse;
}
::view-transition-new(.fade-in) {
  animation: var(--duration-enter) ease-out var(--duration-exit) both fade;
}
```

Vertical, for a skeleton's `exit="slide-down"` and the content's `enter="slide-up"`:

```css
::view-transition-old(.slide-down) {
  animation:
    var(--duration-exit) ease-out both fade reverse,
    var(--duration-exit) ease-out both slide-y reverse;
}
::view-transition-new(.slide-up) {
  animation:
    var(--duration-enter) ease-in var(--duration-exit) both fade,
    var(--duration-move) ease-in both slide-y;
}
```

Directional, one class per direction (enter and exit maps both use `nav-forward` / `nav-back`):

```css
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation:
    var(--duration-exit) ease-in both fade reverse,
    var(--duration-move) ease-in-out both slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation:
    var(--duration-enter) ease-out var(--duration-exit) both fade,
    var(--duration-move) ease-in-out both slide;
}

::view-transition-old(.nav-back) {
  --slide-offset: 60px;
  animation:
    var(--duration-exit) ease-in both fade reverse,
    var(--duration-move) ease-in-out both slide reverse;
}
::view-transition-new(.nav-back) {
  --slide-offset: -60px;
  animation:
    var(--duration-enter) ease-out var(--duration-exit) both fade,
    var(--duration-move) ease-in-out both slide;
}
```

- **Separate classes per side** are the same four rules under `slide-from-right` (new, `60px`), `slide-to-left` (old, `-60px`), `slide-from-left` (new, `-60px`) and `slide-to-right` (old, `60px`).
- **Right to left:** the source hard-codes the offsets and has no right-to-left case; the Next guide's reason for the signs is left-to-right reading ("Moving left means progressing forward (like turning a page in a left-to-right language)"). This skill has new content enter from "left in right-to-left ones" ([TIMING.md](TIMING.md#direction-and-weight)), so under right to left the signs swap.
- **Why 60px:** "The 60px offset is enough to communicate direction without making the user track a fast-moving element across the screen" ([nextjs.org](https://nextjs.org/docs/app/guides/view-transitions)). The enter fade's `var(--duration-exit)` delay "means the new content waits for the old content to finish leaving before it becomes visible" (same guide).
- **Keep the shared `fade` opacity-only:** "If a specific morph needs softness, give that class its own blur keyframe so ordinary content reveals stay crisp." The Next guide's own `fade` adds `filter: blur(3px)`; this skill's rule is the source's ([TIMING.md](TIMING.md#direction-and-weight): "never put it on a plain fade").

Shared element, for `share="morph"`. The Next guide: "The blur hides pixel-level interpolation artifacts during the transition."

```css
::view-transition-group(.morph) {
  animation-duration: var(--duration-move);
}

::view-transition-image-pair(.morph) {
  animation-name: via-blur;
}

@keyframes via-blur {
  30% { filter: blur(3px); }
}
```

Text, for `share="text-morph"`: "Shared element transitions take raster snapshots. For text with significant size differences (e.g., `<h3>` → `<h1>`), the old snapshot gets scaled up, producing a visible ghost artifact."

```css
::view-transition-group(.text-morph) {
  animation-duration: var(--duration-move);
}
::view-transition-old(.text-morph) {
  display: none;
}
::view-transition-new(.text-morph) {
  animation: none;
  object-fit: none;
  object-position: left top;
}
```

Scale, for `<ViewTransition enter="scale-in" exit="scale-out" />`:

```css
::view-transition-old(.scale-out) {
  animation: var(--duration-exit) ease-in scale-down;
}
::view-transition-new(.scale-in) {
  animation: var(--duration-enter) ease-out var(--duration-exit) both scale-up;
}

@keyframes scale-down {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.85); opacity: 0; }
}
@keyframes scale-up {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

- app-ui keeps text at its own size another way, with `inline-size: auto; block-size: auto` on old and new ("keep own size: text never stretches", [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)). The scale recipe starts at 0.85, under the "about 0.9" floor in [TIMING.md](TIMING.md#direction-and-weight).

Clicks through the overlay. "The `::view-transition` overlay captures all pointer events. React shrinks it to zero when the root group doesn't animate, but in-flight animations still block clicks." It "only helps **unnamed** content: named participants are skipped by hit-testing for the transition's duration, no CSS override".

```css
::view-transition {
  pointer-events: none;
}
```

Live root. "`::view-transition-new(root)` is a **live** capture, so disabling the root animation keeps unnamed regions rendering"; "unnamed content swaps instantly, so regions that should fade need their own VT".

```css
::view-transition-old(root) {
  display: none;
}
::view-transition-new(root) {
  animation: none;
}
```

Persistent chrome, named `persistent-nav`. Tiers: "chrome at `100`, toasts/overlays that must beat everything at `200`."

```css
::view-transition-group(persistent-nav) {
  animation: none;
  z-index: 100;
}
```

With `backdrop-filter` on it, "hide the old snapshot to avoid flash":

```css
::view-transition-old(persistent-nav) {
  display: none;
}
::view-transition-new(persistent-nav) {
  animation: none;
}
```

A floating element (popover, menu, tooltip), named `popover`:

```css
::view-transition-group(popover) {
  animation: none;
  z-index: 100;
}
::view-transition-old(popover),
::view-transition-new(popover) {
  animation: none;
}
```

Sliding indicator, for `share="tab-underline"`: "Slide the group; disable old/new so the solid bar slides instead of cross-fading."

```css
::view-transition-group(.tab-underline) {
  animation-duration: 220ms;
  animation-timing-function: cubic-bezier(0.5, 0, 0.2, 1);
}
::view-transition-old(.tab-underline),
::view-transition-new(.tab-underline) {
  animation: none;
  height: 100%;
}
```

- **Live root:** it "removes the main reason to hand-name static chrome; keep names only for elements that must stack above animating groups". It pairs with enter-only reveals: `<ViewTransition enter="auto" default="none">` around the content and nothing on the skeleton, so "the skeleton snaps out live while the content fades in". app-ui uses the same two root rules for its page transitions ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).
- **An empty overlay:** app-ui adds `inline-size: 100vw !important; block-size: 100dvh !important` to `::view-transition`, because at 0 by 0 "the browser then paints none of the groups" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## Durations, curves and reduced motion, both ways

Each conflict below keeps this skill's rule; the source's view is recorded, and app-ui's lines stay as the owner wrote them.

- **Durations.** The source: "Direct toggle (expand/collapse) 100-200ms", "Route transition (slide) 150-250ms", "Suspense reveal (skeleton → content) 200-400ms", "Shared element morph 300-500ms", with the tokens above (exit 150, enter 210 after a 150 delay, move 400). [TIMING.md](TIMING.md#duration-by-element) has "page or route transition | 400-600 ms | standard". app-ui: "the old content fades in 150ms, the new reveals from an 8px blur over about 800ms ease-out" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)), and its item morph runs 600ms ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)). The source's 150ms exit matches app-ui's. Set `--duration-move` and `--duration-enter` from TIMING.md here.
- **Entrance curve.** The source's `slide-up` reveal enters on `ease-in` (fade and slide both), and the Next guide's matches. This skill eases arrivals out, and app-ui's checker flags "an entrance eased in" (`trap/motion-ease-in-enter`, [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)). It is one more data point in the open debate in [TIMING.md](TIMING.md#curves) ("Entrance curve, both ways"); the directional recipes fade in on `ease-out` and slide on `ease-in-out`.
- **Reduced motion.** The source zeroes every view transition:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

  The Next guide calls this the simplest approach and adds: "A more refined approach would preserve crossfades and opacity transitions while removing positional movement." That is this skill's rule 8, "Reduce, don't remove" ([SKILL.md](SKILL.md#the-rules)), and [PERFORMANCE.md](PERFORMANCE.md#reduced-motion)'s "100-150 ms opacity cross-fades": under reduced motion keep the opacity fades and remove the positional movement. app-ui does both: page transitions become "a fade" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)), and the board switch gets "no animation" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## Prove it

Each class a `<ViewTransition>` prop names has a matching rule here, and no rule is copied that the navigation map doesn't use. With `dir="rtl"` on `html`, `nav-forward` content enters from the left. With reduced motion on, only the fades play. Every duration and curve is checked against [TIMING.md](TIMING.md), and in app-ui against its own tokens; `grep -n 'ease-in'` over the copied recipes lists only exits and the recorded `slide-up` entrance.
