# Native CSS motion

The routes that need no animation library: top-layer enter and exit, `<details>` and `height: auto`, waiting for CSS transitions to end, a FLIP done in CSS, view transitions, scroll-driven animations and Web Animations keyframes. The source is Adam Argyle's nerdy.dev; platform support is routed to the MDN-backed modern-css guides. The full recipes live in the `modern-css` skill; this file keeps what bears on motion choices and where it disagrees with [TIMING.md](TIMING.md) and [PERFORMANCE.md](PERFORMANCE.md). The library routes (Motion, Base UI's `data-[starting-style]`) are in [PATTERNS.md](PATTERNS.md).

## Top-layer enter and exit

- For `@starting-style`, discrete `display`/`overlay` transitions and their matching durations, read the [top-layer recipes](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md) and [popover/dialog guide](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md). [Adam Argyle, nerdy.dev]
- Platform support and browser fallbacks have one owner: [modern-css TRANSITIONS-AND-STARTING-STYLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md). Its support table distinguishes starting styles from discrete display and overlay transitions. [MDN]
- **Interruptible transitions over keyframes:** "Interruptible transitions > keyframe animations." The whole enter and exit runs on transitions, so a user "can close it anytime they want and always see a smooth interface" ([nerdy.dev: Using @starting-style and transition-behavior](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20; [6 CSS Snippets 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19). Rule 5 in [SKILL.md](SKILL.md) asks the same of every animation.
- **The demo timings are not this skill's:** dialog 1s, popover 0.5s, a select picker 1s, a `*` crossfade 0.5s in and 0.4s out. [TIMING.md](TIMING.md#duration-by-element) gives 150-220 ms for a popover and 300-400 ms for a modal; the disagreement is written up there.
- **Opt in to motion, keep the start state outside:** Argyle wraps the `transition` in `@media (prefers-reduced-motion: no-preference)` and leaves `@starting-style` outside it, so with reduced motion the element jumps straight to its end state. [PERFORMANCE.md](PERFORMANCE.md#reduced-motion) has both views.
- The code (dialog, popover, `::backdrop`, `[hidden]` exits) is in [modern-css TRANSITIONS-AND-STARTING-STYLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md) and [modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md); the customizable select's picker is in [modern-css SELECT-AND-FORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SELECT-AND-FORMS.md).

## Details and height: auto

- A third route beside [grid rows and Motion's height:auto](PATTERNS.md#height-and-accordions) is the [native details-content recipe](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md). Its slot transition uses interpolate-size where supported. [Adam Argyle, nerdy.dev]
- Read the [details-content and interpolate-size support limits](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md) before choosing the native size transition. [MDN]
- The same opt-in reveals a password field once the username is valid, `.username:not(:has(:user-valid)) + .password` at `height: 0` transitioning to its natural height ([nerdy.dev: CSS interpolate-size to the rescue](https://nerdy.dev/interpolate-size), 2024-09-25). Both recipes are in [modern-css TRANSITIONS-AND-STARTING-STYLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md).

## Wait for CSS transitions before removing

The CSS counterpart of `AnimatePresence` holding an element until its exit ends is Argyle's [remove-a-node-after-its-exit recipe](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TRANSITIONS-AND-STARTING-STYLE.md#remove-a-node-after-its-exit). It owns `onTransitionsEnded(node)`, its getAnimations/finished contract and the call-after-state-change caveat. [Adam Argyle, nerdy.dev]

## FLIP in CSS: the anchor-interpolated morph

- **AIM** (anchor-interpolated morph) is an "interruptible contextual transition from where a user invoked it" built from CSS transitions only: "**First:** `anchor()`, `anchor-size()` & `@starting-style` **Last:** `interpolate-size: allow-keywords` & `auto`", and the transition does invert and play ([nerdy.dev: Anchor Interpolated Morph](https://nerdy.dev/anchor-interpolated-morphing), 2026-01-23). A dialog starts at the trigger's box and size, where "grow from the trigger" in [PATTERNS.md](PATTERNS.md#modals-sheets-popovers) scales the element from the anchor side; the post maps it to FLIP, the JavaScript version of which is in [PATTERNS.md](PATTERNS.md#lists-that-stagger-reorder-and-remove).
- Anchor support and the size-morph enhancement limits are in [modern-css ANCHOR-POSITIONING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/ANCHOR-POSITIONING.md). [MDN]
- **Layout properties, both ways:** AIM transitions `height`, `width`, `left` and `top`, which rule 7 and [PERFORMANCE.md](PERFORMANCE.md) keep out of animations.
- The recipe is in [modern-css ANCHOR-POSITIONING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/ANCHOR-POSITIONING.md).

## View transitions

- Browser support for startViewTransition, options/types, names and classes is in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md). Types "programmatically direct 'forward' or 'backward' contextual motion" ([nerdy.dev](https://nerdy.dev/CSS-recently-in-all-browsers), 2026-04-26).
- **Across documents with one rule:** `@view-transition { navigation: auto; }` crossfades page navigations, "the easiest snippet to add to your site, with no downsides" ([nerdy.dev: 6 CSS Snippets 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19). It is Limited (Chrome 126, Safari 18.2, no Firefox) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)).
- **Two different elements can morph:** the same `view-transition-name` on an `<a>` on one page and an `<h1>` on the next moves and resizes one into the other (same post). The chat composer to sent bubble morph within a page is in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#morphs-and-other-effects).
- **Not interruptible and straight-line:** view transitions "aren't interruptible. Also not as easy to integrate with dialog and popovers" ([Using @starting-style and transition-behavior](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20); they are "always a straight line" and "can't curve or swing to a new destination" ([Anchor Interpolated Morph](https://nerdy.dev/anchor-interpolated-morphing), 2026-01-23). A curve is possible only through a fragile trick on the browser's own keyframe names ([nerdy.dev: View Transitions can swoop‽](https://nerdy.dev/swoop-there-it-is), 2026-03-07); the trick and its limits are in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#the-swoop).
- **Freeze a transition to inspect it:** an infinite `animation-duration` keeps the `::view-transition` tree in the devtools DOM ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25); the snippet is in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#debugging).
- Text swaps, 3D perspective and the per-snapshot choreography are in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md).
- React's `<ViewTransition>`, `addTransitionType` and Next.js `transitionTypes` are in [REACT-VIEW-TRANSITIONS.md](REACT-VIEW-TRANSITIONS.md); their CSS is in [VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md).

## Scroll-driven animations

- Read [scroll-animation support and feature gating](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL-ANIMATIONS.md#scroll-driven-animation) before selecting a native scroll timeline. Argyle ships it inside `@media (prefers-reduced-motion: no-preference)` and `@supports (animation-timeline: view(x))`. [Adam Argyle, nerdy.dev]
- The animation-shorthand reset and timeline ordering rule are defined in [modern-css SCROLL-ANIMATIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL-ANIMATIONS.md#scroll-driven-animation). [MDN]
- **Clamp the range:** the dimmed just-passed item (`exit 50% exit 100%`) and pull-to-refresh's per-element `exit` ranges are in [modern-css SCROLL-ANIMATIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL-ANIMATIONS.md#scroll-driven-animation) and [its pull-to-refresh section](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL.md#pull-to-refresh); the pull-to-refresh post points to Bramus's [range visualiser](https://scroll-driven-animations.style/tools/view-timeline/ranges/) ([nerdy.dev: Pull to Refresh](https://nerdy.dev/pull-to-refresh-prototype-with-scroll-snap-and-scroll-driven-animation), 2023-06-28).
- **Load and scroll on one property:** the keyframe combo trick (one `animation` list, `animation-timeline: scroll(), auto;`) is in [modern-css SCROLL-ANIMATIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL-ANIMATIONS.md#scroll-driven-animation).

## Web Animations keyframes take offsets

`offset` (0 to 1) is the JS form of a `@keyframes` percentage ([nerdy.dev: Keyframe Offsets](https://nerdy.dev/keyframe-offsets), 2025-09-05; `Element.animate()` is Baseline widely available since March 2020, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)):

```js
circle.animate([
  { offset: 0,   transform: 'scale(0)', opacity: 1 },
  { offset: .10, transform: 'scale(1)', opacity: 1 },
  { offset: .75, opacity: 1 },
  { offset: 1,   opacity: 0 },
], {
  duration: 3000,
  easing: 'ease',
  iterations: Infinity,
})
```

## Focus by demotion on hover

Fade every child but the hovered one (`&:hover > *:not(:hover) { opacity: 0.25 }` inside `@media (hover)`, a 0.3s opacity transition), which "can significantly reduce visual and cognitive overload" ([nerdy.dev: :hover > :not(:hover), sorry not sorry](https://nerdy.dev/hover-not-hover-sorry-not-sorry), 2025-01-06). The code for all three variants is in [modern-css CASCADE-AND-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CASCADE-AND-SCOPE.md#focus-by-demotion).

- The post calls Temani Afif's `:has()` variant "a more consistent experience". The post's punchier variants scale the demoted items to 0.8 on a spring inside `@media (hover) and (prefers-reduced-motion: no-preference)`, or fade and arc each item by its distance from the hovered one; that one writes a hand-set `var(--sibling-index)`, which the shipped `sibling-index()` function now replaces (Baseline 2026, newly available since August 2026, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)).

## Prove it

- Open and close a popover and a dialog mid-transition in Chrome: each reverses from where it is; in Firefox the exit is instant and the element still closes.
- Turn on reduced motion: nothing slides or scales, and every opened element still appears.
- Call `onTransitionsEnded` before setting `hidden`: the array is empty and the node goes at once; after: it waits.
- Put `animation-timeline` before the `animation` shorthand: the scroll-driven animation stops following scroll.
