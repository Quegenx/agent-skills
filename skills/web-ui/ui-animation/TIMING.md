# Timing: durations, curves, springs

## Should it animate at all

Ask this before any number below. [Emil Kowalski, animate] gates on frequency first:

| How often | Decision |
|---|---|
| 100+ times a day (keyboard shortcuts, command palette toggle) | "**No animation. Ever.** Stop here." |
| Tens of times a day (hover effects, list navigation) | "Near-imperceptible only, fast and subtle, or nothing" |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare or first-time (onboarding, success, celebration) | "The delight budget lives here" |

- [Emil Kowalski, animate] "**Keyboard-initiated actions are a disqualifier, not a judgment call.** Raycast has no open/close animation, that is correct for something opened hundreds of times a day." A request that fails the gate: "say so plainly and don't write the animation. Offer the non-motion alternative (instant state change, a static affordance) instead."
- [Craft] draws the line by use, not device: "The line to draw is by frequency and intent, not by input device. A modal that opens once a session can animate. A panel you flip forty times a day should not." A sidebar toggled by shortcut serves "your fastest user ... a 250ms slide is like a speeding ticket." On hover: "The more often something happens, the less animation it can afford", and "Instant is the correct default for hover."
- [Jakub Krehel, better-ui] Keystrokes, row hovers and tab switches get instant feedback or at most 150 ms on `opacity` or `background-color` (its `.row:hover` rule: `transition: background-color 100ms ease-out;`); tab icon swaps and hover-revealed row actions don't animate.
- [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion): "In apps, generally avoid adding motion to UI interactions that occur frequently".
- **Both ways:** [SKILL.md](SKILL.md) rule 2 keeps a dozens-a-day action near the bottom of its range; these sources cut it to nothing. The rule stands; the gate is the stricter reading for keyboard-driven and constant actions. app-ui animates a shortcut toggle: "`Cmd/Ctrl+B` toggles ... Width transitions over 200ms" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).

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

**Shorter ceilings, both ways:**

- [Emil Kowalski, animate] press feedback 100-160 ms, tooltips and small popovers 125-200, dropdowns and selects 150-250, modals and drawers 200-500, marketing "Can be longer"; "**UI animations stay under 300ms.** A 180ms dropdown feels more responsive than a 400ms one." His own drawer recipe runs 500 ms (Vaul) and his toast 400 ms (Sonner).
- [transitions.dev] pairs each open with a shorter close: a dropdown or modal opening over 250 ms closes over 150 ms, a panel opening over 400 ms closes over 350 ms, and a toast closes over 350 ms. app-ui's tokens carry the same scale: `--duration-fast` 250ms for "menus and modals opening", `--duration-slow` 400ms for "panels opening" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).
- [fluid-functionalism] three spring tiers only: fast 0.08 s, bounce 0 (hover, focus rings, fades, tooltips, selection indicators), moderate 0.16 s, bounce 0 (indicators, switch thumbs, drawers), slow 0.24 s, bounce 0.12 (dialogs, side panels, stepped flows): "The bigger the thing that moves, the slower the spring." Exits are tweens with no bounce, one tier quicker (0.06, 0.12, 0.16 s), "so a dismissal reads crisp and final rather than replaying the entrance in reverse". That puts fades under this file's 100 ms pop line and a dropdown under the 150-220 ms row.
- [Craft] a sheet over 300 ms on `cubic-bezier(0.33, 1, 0.68, 1)` (easeOutCubic), or `{ type: "spring", stiffness: 300, damping: 30 }`; "A good ease-out transition is enough for most sheets, menus and sidebars."
- **Icon swap:** app-ui swaps "on a short spring with no bounce (about .3s)" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)), and [Jakub Krehel, better-ui] uses the same 0.3 s with bounce "always 0", against the table's 150-250 ms with 5-15% overshoot.
- **Tooltips:** the first wait, instant neighbours (`data-instant`) and durations from [Emil Kowalski], Base UI, [Craft], [fluid-functionalism] and app-ui are in [TOASTS-AND-TOOLTIPS.md](TOASTS-AND-TOOLTIPS.md#tooltips). [transitions.dev] a tooltip appears over 150 ms from scale 0.98 after an 80 ms intent delay and hides over 50 ms.
- **Spinners:** [Emil Kowalski, review-animations] "Faster spinners make load feel faster (same actual time)".

The table above stands. Neither wins.

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

- **Named curves from another source:** [Emil Kowalski, animate] "Built-in CSS easings are too weak. Use these": `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` ("strong ease-out for UI"), `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` ("strong ease-in-out for on-screen movement"), `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` ("iOS-like drawer curve (Ionic)"). The drawer curve is Vaul's, `TRANSITIONS = { DURATION: 0.5, EASE: [0.32, 0.72, 0, 1] }` ([vaul src/constants.ts](https://github.com/emilkowalski/vaul)), the same `[0.32, 0.72, 0, 1]` as Benji Taylor's icons above. The first two do the jobs of `out` and `inOut` here with other values; neither wins. app-ui calls the drawer curve "unroll" ("backdrops and disclosure panels opening") and its own ease-out is `--ease-smooth-out`, `cubic-bezier(.22, 1, .36, 1)` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).
- **Easing by situation:** [Emil Kowalski, animate] entering or exiting `ease-out`; moving or morphing on screen `ease-in-out`; "Hover / color change" `ease`; constant motion (marquee, progress) `linear`; default `ease-out`.
- **One name, two curves:** this file's `--ease-out` is `cubic-bezier(0.16, 1, 0.3, 1)`; transitions.dev's token scale, and app-ui's motion-tokens.css taken from it, write `--ease-out: ease-out; /* tooltip open / close */`. Check which one a codebase means before reusing the name.
- **Where a curve comes from, both ways:** [Emil Kowalski, animate] "Need a curve that isn't here? Take it from [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/). Don't hand-roll one." kciter draws the shape and then finds the points (next bullet).
- **Read a curve as a graph:** start (0,0) and end (1,1) are fixed, so only (x1,y1) and (x2,y2) move; the curve doesn't pass through them, each one pulls it toward itself. For a curve that "pops out quickly and then settles gently", give the first control point a large y value and put the second near (1, 1). Draw the shape first, then find the control points (kciter). The math is in [MATH.md](MATH.md).
- **Choose by purpose:** a curve fast at the start draws the eye quickly; one fast at the end lets something disappear quietly; `linear` rises at a constant speed and stops abruptly, which feels mechanical.
- **Entrance curve, both ways:** kciter treats an `ease-in` entrance as a valid "more relaxed and less noticeable" choice and says an element that appeared with ease-in "should disappear with ease-out". This table eases arrivals out and exits in. Both agree the two directions need different curves ("using the same easing graph for appearing and disappearing makes the motion feel awkward"); they disagree on which way round. Argyle sides with kciter: entry `.5s ease-in`, exit ".4s with an `ease-out` effect because I think it's nice when exit animations happen slightly faster than entry animations" ([nerdy.dev: Using @starting-style and transition-behavior](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20).
  - Others ease both directions out. [Emil Kowalski, animate]: "**Never `ease-in` on UI.** It starts slow, delaying the exact moment the user is watching. `ease-out` at 200ms *feels* faster than `ease-in` at 200ms." [Jakub Krehel, make-interfaces-feel-better]: "Use `ease-out` for both enter and exit transitions". [transitions.dev] lets most opens and closes share its one smooth ease-out, and app-ui's `--ease-smooth-out` covers "open, close, resize, reposition". [Emil Kowalski, animation-vocabulary]: ease-in is "Usually avoided; can feel sluggish." [Emil Kowalski, apple-design] mirrors instead ("use inverse cubic-bézier control points for the two directions"), which matches this table's out-and-in pair; that line is not in the WWDC18 transcript. app-ui's checker bans only "an entrance eased in" (`trap/motion-ease-in-enter`, [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)). The table stands; neither wins.

## Springs

Springs for things that feel physical (controls, cards, dragged objects); eased tweens for type and fades. In Motion, write springs as `visualDuration` and `bounce` (the time to visually reach the target, and how much it overshoots), so they sit in the same scale as the duration table. These are duration-based springs, and they start from rest: "Duration-based spring animations are set via a duration and bounce. These don't incorporate velocity but are easier to understand", while "Physics-based spring animations are set via stiffness, damping and mass, and these incorporate the velocity of any existing gestures or animations for natural feedback" ([motion.dev: animate](https://motion.dev/docs/animate)). The source zeroes even a `velocity` passed in: "Time-defined springs ignore inherited velocity. Velocity from interrupted animations causes massive oscillation on small-range animations" ([motion-dom spring.ts](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts)). A spring that must carry a drag's release velocity is written with `stiffness`, `damping` and `mass` ([MATH.md](MATH.md#gesture-handoff-project-normalise-resist)).

| Feel | Motion transition | For |
|---|---|---|
| ui | `{ type: "spring", visualDuration: 0.25, bounce: 0.15 }` | buttons, toggles, small controls |
| enter | `{ type: "spring", visualDuration: 0.3, bounce: 0 }` | content arriving |
| exit | `{ type: "spring", visualDuration: 0.15, bounce: 0 }` | content leaving, faster than it came |
| shape | `{ type: "spring", visualDuration: 0.45, bounce: 0.2 }` | a container morphing, a layout change |
| heavy | `{ type: "spring", visualDuration: 0.7, bounce: 0 }` | large panels, big images |

- Don't inherit Motion's physics default; set a transition on purpose. The docs list stiffness "Default: `1`", damping `10`, mass `1` ([motion.dev: React transitions](https://motion.dev/docs/react-transitions)); the source's `springDefaults` sets `stiffness: 100, damping: 10, mass: 1.0` ([motion-dom spring.ts](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts)), so the docs' `1` doesn't match the code. With the code's numbers the damping ratio is 10 / (2 × √(100 × 1)) = 0.5, a visible wobble. [Emil Kowalski, animate] offers `{ type: "spring", mass: 1, stiffness: 100, damping: 10 }` as "traditional physics, more control", and `{ type: "spring", duration: 0.5, bounce: 0.2 }` as "Apple-style, easier to reason about" (valid: `duration` "Can also be used for `"spring"` animations when `bounce` is also set", and `visualDuration` overrides it). Neither wins.
- If everything bounces, nothing feels precise: overshoot is for true landings (a toggle knob, a dropped card), a couple per screen at most. Errors, prices and numbers never bounce.
  - Flutter community view (opinion): entrances bounce on purpose, "that bounce is what makes users notice the entrance"; exits use a faster spring with no bounce ([FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)), against the `enter` preset's `bounce: 0`. See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
  - Apple ties bounce to the gesture instead: "if the gesture that's driving the motion itself has momentum, then you should reward that momentum with a little bit of overshoot". The Music app's Now Playing uses "100% damping" on a tap, and when swiped to dismiss, "there is momentum ... so we use 80% damping" ([WWDC18 Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/)). Apple's springs take a damping ratio and a response, not a duration. The values often quoted as Apple's (PiP damping 1, response 0.4; rotation 0.8, 0.4) are Nathan Gitter's recreation of the talk, `UISpringTimingParameters(damping: 1, response: 0.4, initialVelocity: ...)` in Pip.swift ([nathangitter/fluid-interfaces](https://github.com/nathangitter/fluid-interfaces), Apache-2.0), not Apple's. [Emil Kowalski, apple-design] maps them onto Motion's `bounce` and `duration`, which per the docs above drops the release velocity.
  - [Emil Kowalski, animate] "Keep bounce at 0.1-0.3, and avoid bounce in most UI, reserve it for drag-to-dismiss and playful interactions." [Jakub Krehel, better-ui] goes further: its checklist turns any `bounce:` other than 0 into 0, against the `ui` and `shape` presets here.
  - [transitions.dev] keeps overshoot for entrances only and never bounces a close, yet pops a number in on an overshoot curve, against "numbers never bounce" above. Neither wins.
  - [feel] "heavy" is mass 3 at 1.35 Hz with a damping ratio of 0.74, a 3.2% overshoot, against the `heavy` preset's `bounce: 0`; its word-to-number table and the conversion between parameterisations are in [PHYSICS.md](PHYSICS.md).
  - [fluid-functionalism] uses tweens, not springs, where the order of two motions matters: "a critically damped spring settles well before its nominal duration and would invert that order, and blur is a `filter` string a spring cannot drive."
- **What the physics knobs do:** stiffness sets how tight the spring is ("Higher values make it snap faster"), damping how much it bounces ("Higher values reduce oscillation"). The RNDR Realm list-to-detail morph uses `{ type: "spring", stiffness: 250, damping: 30 }`. A physics spring has no duration: it runs until it converges, and `visualDuration` is Motion's way of giving it one (the force math is in [MATH.md](MATH.md#a-spring-by-hand)).
  - Flutter community view: FlutterPro's `SpringDescription` adds `mass`, how heavy (heavier is slower to start and to stop), and zero damping bounces forever: "never use this" ([FlutterPro](https://flutterpro.design/details/spring-physics)). See [flutter-ui MOTION-AND-FEEDBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/ANIMATION.md#springs).
- Don't mix parameterisations in one codebase (stiffness and damping in one file, duration and bounce in the next); pick one and keep the presets in one module.
- **A spring in CSS is a `linear()` curve:** "a series of linear lines to make 'curves'", made with a generator ([linear-easing-generator](https://linear-easing-generator.netlify.app), [easingwizard](https://easingwizard.com)). "Expect longer durations when using `linear()`. When things run long, it can be nice to make them seamlessly interruptible, making `linear()` a great fit for transitions and potentially troublesome as keyframes" ([nerdy.dev: 6 CSS Snippets 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19). `linear()` is Baseline widely available (newly available December 2023, widely June 2026) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear)). The post's Open Props spring is in [modern-css QUERIES-AND-PREFERENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/QUERIES-AND-PREFERENCES.md#reduced-motion).
- Physics springs (`stiffness`, `damping`, `mass`) keep their velocity when interrupted; that's why a dragged or retargeted element should be one, not a tween or a `visualDuration` spring, which the docs say "don't incorporate velocity" (above). [Craft] narrows when a spring is worth it: Sonner and Vaul "both run on plain CSS transitions and never feel broken. A good ease-out transition is enough for most sheets, menus and sidebars. Reach for a spring when the motion comes from a gesture ... or when something gets flipped back and forth fast enough that the restart shows."

## Staggers and sequencing

- **Total stagger under about 500 ms,** whatever the count: list items 30-60 ms apart (a dense grid 20-40 ms), words about 90 ms. With many items, stagger by distance from a focal point (the clicked card, the top left) so the feel stays the same at any count, and cap how many items animate at all (the first visible 8-12; the rest just appear).
  - Argyle's CSS staggers have no cap: `transition-delay: calc((sibling-index() - 1) * 100ms)` ("subtract 1 so the first element starts immediately", [nerdy.dev: 4 CSS Features 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026), 2026-01-07), so the tenth item waits 900 ms; his Switch homescreen uses `calc(var(--i) * .05s)` ([nerdy.dev: Nintendo Switch Homescreen](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13). `sibling-index()` is Baseline 2026, newly available since August 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)).
  - Flutter community view: ApparenceKit staggers list cards at `delayInMs: index * 150 + 50` with no cap, so the card at index 4 starts at 650 ms ([ApparenceKit](https://apparencekit.dev/flutter-tips/consistent-animations-flutter-app/)). See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
  - [Emil Kowalski, animate] "Everything entering at once → 30-80ms stagger"; stagger is decorative and never blocks interaction. [transitions.dev] offsets 40 ms per item, up to 80 ms for a few large items, keeps the total (offset times count) under about 300 ms, and caps the count or shrinks the offset to get there. [Jakub Krehel, better-ui] staggers semantic chunks (title, description, actions) 100 ms apart and a short display headline's words 80 ms apart, never routine interactions. app-ui: `--duration-stagger` 40ms. The 500 ms total above stands.
- **Entrances run 30-50% longer than exits.** The RNDR Realm gooey dropdown doesn't: its exit takes about 750 ms (the size shrinks over 500 ms, the move follows after 150 ms over 600 ms) against 700 ms in, with the stages reversed. Argyle's enter and exit runs .5s in and .4s out, 25% longer ([NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit)).
  - Flutter community view: Material's spec, as FlutterPro cites it, enters over 400 ms on a decelerate curve and exits over 200 ms on an accelerate curve, so the entrance runs twice as long ([FlutterPro](https://flutterpro.design/details/enter-slow-exit-fast)). See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.
  - **Symmetric pairs:** [transitions.dev] keeps one duration and one curve both ways for a page sliding beside another, tabs sliding, an accordion and an icon swap (250 ms) and a text swap (150 ms), because they "read as a single reversible motion"; its panel closes over 350 of a 400 ms open. app-ui splits its disclosure panel instead: "Opens slowly (it unrolls), closes faster" ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md)).
  - **Exit lighter, not only faster:** [transitions.dev] the entrance carries the travel and the blur; the exit can drop or shrink both, so a close doesn't fling content across the screen.
  - **Hover out, the reverse case:** [transitions.dev] hover in is quick and direct (a short lift on its smooth ease-out); hover out can take longer and use its strongest bounce curve, the one place the out is more elaborate than the in. app-ui's buttons return faster: "back over 120ms ease-out" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
  - **Where the user is deciding:** [Emil Kowalski, animate] "Slow on the deliberate phase (a hold-to-confirm press: 2s linear), snappy on the system response (release: 200ms ease-out)." Kiem's tap presses run the other way, in faster than out ([PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback)).
- **Delays filter or sequence, nothing else** [transitions.dev]: a delay is for ignoring accidental triggers (a tooltip waits 80 ms so a passing cursor doesn't open it) or putting two things in order, never for padding a slow animation. If motion feels late, trim the duration before adding a delay. Never delay a close or a hover-out: dismissal must feel instant. app-ui's stated exception: "A tooltip whose trigger sits on something a view transition will cover needs a close delay as long as the transition" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
- **Distance scales duration:** about 350 ms plus 1.35 ms per pixel travelled (200 px is about 620 ms), clamped to the element's range. A long slide at a short duration reads as a jump; a short nudge at a long one reads as lag.
- **A follow-up move starts 55-75% into the move before it,** so both settle together instead of stop-then-lurch. kciter's "overlapping" placement starts B at A's 80% mark instead, later than this range, which "reduces the sense of a gap between pieces".
- **One element, two moves** (slides in, then lifts): start the second stage about 60% through the first, so the speed never reaches zero at the corner; under about 25% overlap the corner reads as a stop, over about 50% the two moves merge into one diagonal. A counter case: the RNDR Realm dropdown starts its resize 100 ms into a 500 ms move (20% through, a heavy overlap) and still reads to its author as "slides down and then opens up"; "If you animate all the properties at the same time it feels stiff".
- **Content inside a morphing container** appears about 80 ms after the morph starts and disappears about 120 ms before the next one. The RNDR Realm dropdown waits 150 ms (a 300 ms ease-out fade, "so it doesn't show up while the container is still a tiny circle"), fades out over 150 ms ease-in, and staggers its rows at 200 ms plus 50 ms each, behind the content fade. [fluid-functionalism] grows a list item in two phases, height first and the content fading in 0.08 s later: "space opens first, then content appears".
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
- **Travel and scale ceilings, tighter:** [transitions.dev] travel shrinks with frequency and grows with ceremony; a translate past about 40 px for anything but a full panel or drawer usually reads as sluggish. A starting scale below about 0.9 reads as a zoom and rarely fits UI chrome, and every scale settles to 1. [Emil Kowalski, animate] "**Never `scale(0)`.** Start from `scale(0.9-0.97)` + `opacity: 0`. Nothing in the real world appears from nothing." app-ui opens its tooltip "from .6" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).
- **Blur is a start state:** [transitions.dev] a blur settles to 0 and softens a swap or a slide; never put it on a plain fade or a colour or theme change.
- **Hint toward the end state:** intermediate frames point at the outcome, as Control Center modules "grow up and out towards your finger" ([WWDC18 Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/)).
- A number counts to its value on an ease-out with no overshoot, its label settles after the count lands, and the final value holds.

## Speed limits

- Text being read moves at most a few pixels per frame; it lands sharp, never still drifting.
- Nothing flashes full-screen in under 300 ms.
- On 120 Hz screens, durations stay the same (time, not frames): never animate by frame counts. Liveline (8% per frame) and kciter's exponential approach ease by a fixed fraction per frame instead; both positions are in [MATH.md](MATH.md#exponential-approach-chase-a-target-that-moves).

## Writing a motion brief

[video-brief, original SPEC-PATTERNS.md section 3] This is the captured numeric brief template. Its target/canvas choices are historical options, not a requirement to ship a product on a video engine. Apply this file's frequency gate, duration tables, recorded source alternatives and protected owner tokens. The old source directed every value to seek-engine's number sheet; shipped UI instead uses its UI owner here.

For motion that ships in a product, or any piece where the feel must be exact. Adjectives get the
default (300 ms, ease-in-out, a 20 px slide, a bounce on everything); numbers get exactly the numbers.

```
MOTION BRIEF
target        [seek-engine HTML | GSAP 3 | Remotion]
canvas        [1440 × 900, 60 fps]
beats         0.00  card group enters from +24px
              0.28  cards settled, title begins
              0.46  title settled, meta fades in
              0.60  rest state
duration      cards 280ms · title 220ms · meta 160ms
easing        cards cubic-bezier(0.05, 0.7, 0.1, 1) · title (0.2, 0, 0, 1) · meta (0, 0, 0, 1)
overshoot     0% (these carry information)
stagger       60ms between cards, total under 400ms
properties    transform and opacity only
reduced       cross-fade 120ms, no translation
```

Beats are a timeline, not a list: sequence relative to labels (`"<0.28"`), never as recomputed absolute
delays. Use the relevant UI owner values above.
Before the code, list each beat with start, duration, curve and overshoot in a table; the review checks
the render against that table.


## Prove it

Use the [shared motion review](SKILL.md#prove-it): check every duration and curve against the relevant table and recorded source disagreement, interrupt and reverse dynamic motion, and inspect the reduced-motion result. The owner's product tokens govern its protected designs. [ui-animation, existing timing and review sources]
