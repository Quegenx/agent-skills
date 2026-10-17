# Timing: durations, curves, springs

## Duration by element

| Element | Duration | Curve | Overshoot |
|---|---|---|---|
| tooltip | 80-120 ms | out | 5-15% |
| button press, toggle, checkbox | 120-180 ms | out (or the `ui` spring) | 5-10% |
| icon swap | 150-250 ms | out | 5-15% |
| dropdown, popover | 150-220 ms | out | 0-3% |
| card, list item | 200-350 ms | standard | 3-5% |
| toast | 250-350 in, 150-200 out | emphasized in, exit out | 0% |
| modal, sheet, drawer | 300-400 ms | emphasized | 0% |
| page or route transition | 400-600 ms | standard | 0% |
| hero reveal (once per page) | 600-1200 ms | emphasized | 0-3% |
| error shake | 300-400 ms | inOut | 0%, never a bounce |
| skeleton shimmer | 0.6-1 s per pass | linear | reads as working hard; a slow, calm shimmer makes the wait feel longer |

Fades shorter than about 100 ms read as a pop; for a deliberate instant change, change it instantly and ease what follows.

Flutter community view (opinion), on page transitions: Flutter web and desktop apps get no page transition at all ([FlutterPro](https://flutterpro.design/details/web-page-transitions)), against the 400-600 ms row above; see ../../mobile/flutter-ux/NAVIGATION-AND-SHEETS.md.

**Some articles run longer on purpose.** The RNDR Realm gooey dropdown opens in about 700 ms (a 500 ms move, then a 600 ms resize from 100 ms in), against 150-220 ms here; Benji Taylor's morphing icons run 300 ms on `[0.32, 0.72, 0, 1]`, a curve not in the table below, against 150-250 ms for an icon swap. Florian Kiem's demos do too: his playful press scales to 0.94 in over 240 ms and out over 420 ms with about 16% overshoot, against 120-180 ms and 5-10% for a press ([PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback)); his sort menu opens in 50 ms (``{duration:.05,ease:`easeOut`}``, scale .98 to 1) and exits in 150 ms, against 150-220 ms for a dropdown and the pop below 100 ms. The table keeps frequent controls quick. Neither wins.

**Argyle's native CSS demos run long as well:** his dialog crossfade runs 1s and his popover 0.5s ([nerdy.dev: 6 CSS Snippets 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19), his customizable select's picker 1s ([nerdy.dev: Custom <select> boilerplate](https://nerdy.dev/custom-select-with-transitions-boilerplate), 2024-09-19), against 150-220 ms for a popover or dropdown and 300-400 ms for a modal. The posts state no duration rule ([NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit)).

**Shimmer, both ways:** Kiem's "The perfect app has no loading states" says to shorten placeholder animations "to under one second per cycle", since loading states "need to feel extremely fast". Its demos ease the shimmer in and out where the row above says `linear`: `--animate-skeleton-shimmer: skeleton-shimmer 1.6s ease-in-out infinite;` with `@keyframes skeleton-shimmer{0%{transform:translate(-100%)}to{transform:translate(100%)}}`, and its slider demo eases each sweep with `p=d<.5?2*d*d:1-(-2*d+2)**2/2`. That slider's "Fast" end is 0.45 s a pass, under the row's 0.6 s floor, and its static skeletons run 1.6 s, over its own one-second rule. The shimmer there is a band over a muted bar, not a moving `background-position`: a `::before` with a `transparent → white/70 → transparent` gradient moved by `transform`, `aria-hidden`, stopped with reduced motion (`motion-reduce:before:animate-none`). Neither wins.

**Frequency sets flourish, not only duration:** the rarer the feature, the more delight it can carry (Family's delight-impact curve, [PATTERNS.md](PATTERNS.md#delight-where-flourish-goes)).

## Curves

Use about three, each with one job. `linear` only for progress bars, spinners and continuous drift. Argyle's spinner that imitates Android's runs a sharp ease-out instead, `animation: rotate .8s var(--ease-out-4) infinite;` on `rotate: 1turn` keyframes ([nerdy.dev: Conic gradient Android spinner](https://nerdy.dev/android-spinner-conic-gradient-animation), 2023-02-19), to match the Android spinner. Neither wins.

| Token | cubic-bezier | Job |
|---|---|---|
| out | 0.16, 1, 0.3, 1 | arrivals and reveals; never a fade-out |
| exit | 0.55, 0.055, 0.675, 0.19 | leaving: accelerates away |
| ui | 0.4, 0, 0.2, 1 | small state changes: toggles, chips, rows |
| standard | 0.2, 0, 0, 1 | moving between two states |
| emphasized | 0.05, 0.7, 0.1, 1 | modals, sheets, hero arrivals (approximates Material's two-segment curve) |
| inOut | 0.87, 0, 0.13, 1 | morphs, shakes, deliberate slides |
| overshoot | 0.3, 0, 0, 1.25 | a value that lands; sparingly |

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-ui: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1);
  --dur-base: 200ms;                       /* micro = base / 2, hero = base x 2 */
}
```

- **Read a curve as a graph:** start (0,0) and end (1,1) are fixed, so only (x1,y1) and (x2,y2) move; the curve doesn't pass through them, each one pulls it toward itself. For a curve that "pops out quickly and then settles gently", give the first control point a large y value and put the second near (1, 1). Draw the shape first, then find the control points (kciter). The math is in [MATH.md](MATH.md).
- **Choose by purpose:** a curve fast at the start draws the eye quickly; one fast at the end lets something disappear quietly; `linear` rises at a constant speed and stops abruptly, which feels mechanical.
- **Entrance curve, both ways:** kciter treats an `ease-in` entrance as a valid "more relaxed and less noticeable" choice and says an element that appeared with ease-in "should disappear with ease-out". This table eases arrivals out and exits in. Both agree the two directions need different curves ("using the same easing graph for appearing and disappearing makes the motion feel awkward"); they disagree on which way round. Argyle sides with kciter: entry `.5s ease-in`, exit ".4s with an `ease-out` effect because I think it's nice when exit animations happen slightly faster than entry animations" ([nerdy.dev: Using @starting-style and transition-behavior](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20).

## Springs

Springs for things that feel physical (controls, cards, dragged objects); eased tweens for type and fades. In Motion, write springs as `visualDuration` and `bounce` (the time to visually reach the target, and how much it overshoots), so they sit in the same scale as the duration table:

| Feel | Motion transition | For |
|---|---|---|
| ui | `{ type: "spring", visualDuration: 0.25, bounce: 0.15 }` | buttons, toggles, small controls |
| enter | `{ type: "spring", visualDuration: 0.3, bounce: 0 }` | content arriving |
| exit | `{ type: "spring", visualDuration: 0.15, bounce: 0 }` | content leaving, faster than it came |
| shape | `{ type: "spring", visualDuration: 0.45, bounce: 0.2 }` | a container morphing, a layout change |
| heavy | `{ type: "spring", visualDuration: 0.7, bounce: 0 }` | large panels, big images |

- Motion's physics default (`stiffness: 100, damping: 10, mass: 1`) wobbles visibly; set a transition on purpose instead of inheriting it.
- If everything bounces, nothing feels precise: overshoot is for true landings (a toggle knob, a dropped card), a couple per screen at most. Errors, prices and numbers never bounce.
  - Flutter community view (opinion): entrances bounce on purpose, "that bounce is what makes users notice the entrance"; exits use a faster spring with no bounce ([FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)), against the `enter` preset's `bounce: 0`. See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
- **What the physics knobs do:** stiffness sets how tight the spring is ("Higher values make it snap faster"), damping how much it bounces ("Higher values reduce oscillation"). The RNDR Realm list-to-detail morph uses `{ type: "spring", stiffness: 250, damping: 30 }`. A physics spring has no duration: it runs until it converges, and `visualDuration` is Motion's way of giving it one (the force math is in [MATH.md](MATH.md#a-spring-by-hand)).
  - Flutter community view: FlutterPro's `SpringDescription` adds `mass`, how heavy (heavier is slower to start and to stop), and zero damping bounces forever: "never use this" ([FlutterPro](https://flutterpro.design/details/spring-physics)). See [../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md](../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md#springs).
- Don't mix parameterisations in one codebase (stiffness and damping in one file, duration and bounce in the next); pick one and keep the presets in one module.
- **A spring in CSS is a `linear()` curve:** "a series of linear lines to make 'curves'", made with a generator ([linear-easing-generator](https://linear-easing-generator.netlify.app), [easingwizard](https://easingwizard.com)). "Expect longer durations when using `linear()`. When things run long, it can be nice to make them seamlessly interruptible, making `linear()` a great fit for transitions and potentially troublesome as keyframes" ([nerdy.dev: 6 CSS Snippets 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19). `linear()` is Baseline widely available (newly available December 2023, widely June 2026) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear)). The post's Open Props spring is in [../modern-css/QUERIES-AND-PREFERENCES.md](../modern-css/QUERIES-AND-PREFERENCES.md#reduced-motion).
- Springs keep their velocity when interrupted; that's why a dragged or retargeted element should be a spring, not a tween.

## Staggers and sequencing

- **Total stagger under about 500 ms,** whatever the count: list items 30-60 ms apart (a dense grid 20-40 ms), words about 90 ms. With many items, stagger by distance from a focal point (the clicked card, the top left) so the feel stays the same at any count, and cap how many items animate at all (the first visible 8-12; the rest just appear).
  - Argyle's CSS staggers have no cap: `transition-delay: calc((sibling-index() - 1) * 100ms)` ("subtract 1 so the first element starts immediately", [nerdy.dev: 4 CSS Features 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026), 2026-01-07), so the tenth item waits 900 ms; his Switch homescreen uses `calc(var(--i) * .05s)` ([nerdy.dev: Nintendo Switch Homescreen](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13). `sibling-index()` is Baseline 2026, newly available since August 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)).
  - Flutter community view: ApparenceKit staggers list cards at `delayInMs: index * 150 + 50` with no cap, so the card at index 4 starts at 650 ms ([ApparenceKit](https://apparencekit.dev/flutter-tips/consistent-animations-flutter-app/)). See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
- **Entrances run 30-50% longer than exits.** The RNDR Realm gooey dropdown doesn't: its exit takes about 750 ms (the size shrinks over 500 ms, the move follows after 150 ms over 600 ms) against 700 ms in, with the stages reversed. Argyle's enter and exit runs .5s in and .4s out, 25% longer ([NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit)).
  - Flutter community view: Material's spec, as FlutterPro cites it, enters over 400 ms on a decelerate curve and exits over 200 ms on an accelerate curve, so the entrance runs twice as long ([FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)). See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
- **Distance scales duration:** about 350 ms plus 1.35 ms per pixel travelled (200 px is about 620 ms), clamped to the element's range. A long slide at a short duration reads as a jump; a short nudge at a long one reads as lag.
- **A follow-up move starts 55-75% into the move before it,** so both settle together instead of stop-then-lurch. kciter's "overlapping" placement starts B at A's 80% mark instead, later than this range, which "reduces the sense of a gap between pieces".
- **One element, two moves** (slides in, then lifts): start the second stage about 60% through the first, so the speed never reaches zero at the corner; under about 25% overlap the corner reads as a stop, over about 50% the two moves merge into one diagonal. A counter case: the RNDR Realm dropdown starts its resize 100 ms into a 500 ms move (20% through, a heavy overlap) and still reads to its author as "slides down and then opens up"; "If you animate all the properties at the same time it feels stiff".
- **Content inside a morphing container** appears about 80 ms after the morph starts and disappears about 120 ms before the next one. The RNDR Realm dropdown waits 150 ms (a 300 ms ease-out fade, "so it doesn't show up while the container is still a tiny circle"), fades out over 150 ms ease-in, and staggers its rows at 200 ms plus 50 ms each, behind the content fade.
- **Overlap transitions:** the next view starts arriving before the last has fully left; a gap reads as loading. Mutually exclusive indicators are the exception: Liveline's momentum arrows "fade out fully before the new direction fades in".
- **Derive, don't schedule:** when several things depend on one value (a slider, a scroll position, upload progress), drive them all from that value instead of giving each its own timer. Liveline's line, Y-axis range, badge and grid labels share one lerp, so the chart moves as one thing.

## Composing a sequence

- **Four placements** (kciter): sequential (B starts when A ends); overlapping (B starts before A ends); simultaneous (A and B start together on different properties); staggered (the same animation on several elements, offset in time). Built as separate pieces, each can be changed alone: "If the card rises too quickly, you fix just that piece."
- **Split properties into tracks:** when several properties change at once, give each "an independent track"; "the tracks don't need to know about each other". kciter's pricing card on select: border 150 ms ease-out, scale on a spring, details reveal 400 ms ease-out. In Motion, a `transition` object keyed by property does it, as in [the button-to-panel morph](PATTERNS.md#a-button-that-grows-into-a-panel).
- **State transitions for staged motion:** when one element passes through stages whose character changes completely, move on "when a condition is met" ("explode when velocity reaches 0", "remove when opacity reaches 0"), so the emphasis shifts from when to under what condition and the animation reads as a state machine. It fits physics and user interaction, where the outcome is hard to predict:

| State | What changes | Graph | Transition condition |
|---|---|---|---|
| Launch | height ↑ | acceleration (ease-in) | velocity = 0 → explode |
| Explode | particles split | instant switch | immediately → spread |
| Spread | radius ↑, speed ↓ | deceleration + gravity | time elapsed → fade |
| Fade | opacity ↓ | linear decrease | opacity = 0 → remove |

## Direction and weight

- New content enters from the reading direction's end (right or below in left-to-right layouts, left in right-to-left ones); going back reverses the entrance; drilling into detail scales up from the item; things leave through the nearest edge.
- The focus of a change enters first and leaves last; supporting elements follow 50-150 ms later with less travel.
- Small controls snap; large panels settle; nothing travels more than about a third of the viewport in one unbroken move.
- A number counts to its value on an ease-out with no overshoot, its label settles after the count lands, and the final value holds.

## Speed limits

- Text being read moves at most a few pixels per frame; it lands sharp, never still drifting.
- Nothing flashes full-screen in under 300 ms.
- On 120 Hz screens, durations stay the same (time, not frames): never animate by frame counts. Liveline (8% per frame) and kciter's exponential approach ease by a fixed fraction per frame instead; both positions are in [MATH.md](MATH.md#exponential-approach-chase-a-target-that-moves).
