---
name: ui-animation
description: "Designs and builds website and app animations that feel deliberate and stay smooth: durations, curves and springs by element, staggers, enter and exit, layout and shared-element transitions, gestures, scroll-linked motion, collections, reduced motion. React with Motion, and CSS. Use when adding, tuning or reviewing animations or transitions in an interface."
---

# UI animation

The model knows what a card entrance is. It doesn't know this card should take 280 ms, the one behind it should start 60 ms later, and both must be interruptible mid-flight. Pick from the numbers; deviate on purpose, never by accident. Every animation answers one question: what changed, and where did it go?

| The job | Read |
|---|---|
| How long, which curve, which spring; staggers, overlaps, distance, direction | [TIMING.md](TIMING.md) |
| Enter and exit, layout and shared-element transitions, a card that opens a modal and owns the URL, lists, modals, trays, a button that grows into a panel, toasts, feedback at the tap, icons that rotate into each other, numbers, live charts, gestures, scroll, galleries and carousels, where delight goes | [PATTERNS.md](PATTERNS.md) |
| Per-frame math in your own loop: lerp and exponential approach, a spring by hand, physics, facing the direction of travel, sine waves, sawtooth loops, controlled randomness, piecewise segments | [MATH.md](MATH.md) |
| Smooth on a slow phone: which properties, GPU vs main thread, React re-renders, reduced motion, measuring | [PERFORMANCE.md](PERFORMANCE.md) |

Images and video loading, long lists and bundle splitting are in the `performance-and-caching` skill's BROWSER.md; how much motion a page should have at all is the MOTION dial in `anti-slop-ui`; how each app component (menus, dialogs, confirms, tables, boards) moves and behaves is in `app-ui`; a marketing site's hero, reveals and page transitions are in `landing-page-ui`; an agent chat's status line, streaming and cards are in `agent-chat-ui`; SVG technique (goo filters, displacement maps, line-based icon geometry) is in [the `svg` skill](../svg/SKILL.md).

**Code or a tool:** "The strength of animation written in code lies in real-time interaction", motion that responds to input and changes with state. A character walking and running, a hand-drawn morph, or an intro where dozens of layers interlock "just isn't realistic" in code alone: use After Effects exported with Lottie, Rive for interactive animation, or a pre-rendered video (kciter).

## The rules

1. **Motion explains a change.** Something appeared, left, moved, grew into a detail view, was confirmed or rejected. Motion with no change to explain (floating cards, everything fading up on scroll, idle bouncing) is decoration; cut it or keep it subliminal. Treat the app as having "unbreakable physical rules": know how and why a transition makes sense before adding it (Family). Family and Honk add motion past this line on purpose, for delight and play; that case, both ways, is in [PATTERNS.md](PATTERNS.md#delight-where-flourish-goes).
2. **Small and frequent is fast; big and rare is slower.** A toggle is 120-180 ms, a modal 300-400 ms, a page transition 400-600 ms. Anything a user triggers dozens of times a day stays near the bottom of its range, and nothing blocks input while it plays. Applied thoughtfully, motion can "enhance clarity and feel just as fast" as a static cut: "We fly instead of teleport" (Family).
3. **One motion language per product:** one curve for arrivals, one for exits, one spring family for things that feel physical, one stagger rhythm, one base duration that the others are multiples of. A screen that invents its own is a defect, not a style. One fluid transition doesn't make a fluid product; that takes "hundreds of small, deliberate decisions", and "Every interaction feeds into the next" (Family).
4. **Exits are faster than entrances** (about half to two thirds of the entrance), and leave through the nearest edge or back where they came from.
5. **Interruptible always.** A new target starts from the current position and velocity; never wait for an animation to finish before responding, never snap back to the start first.
6. **Things that move together move as one:** a group shifts in one direction, never crossing paths; one element is the focus of each change, everything else yields.
7. **Only transform and opacity move,** so it stays smooth while the page is busy ([PERFORMANCE.md](PERFORMANCE.md)).
8. **Reduce, don't remove:** with reduced motion, movement becomes short fades; feedback and state changes stay.

## Prove it

Record the interaction at 4x CPU slowdown: no dropped frames, no layout in the animation frames. Click twice fast and mid-animation: it retargets smoothly. Toggle reduced motion: no slides or zooms remain, every state change is still visible. Check every duration and curve against [TIMING.md](TIMING.md).

- **Remove the motion and compare side by side,** as Family did: without it, "the action's intent and outcome become much less clear", and the static version "feels like digital whiplash". Smoothness matters most where money is on the line: a glitchy animation in a banking app makes users question whether it "can execute my actions accurately".
- **Play every A-to-B pair** of states that morph into each other, with a dev tool that cycles chosen sequences; jank in specific pairs (arrow-right to arrow-down) is "the sort of thing you only notice by playing with it" (Benji Taylor).
- **Name the part:** break a "feels sluggish" note into the delay before it starts, the duration and the easing, and pause mid-transition to point at the in-between frame (Benji Taylor, "Annotating for agents").
- **Live data:** run it on hostile data, sharp reversals and irregular arrival included ([PATTERNS.md](PATTERNS.md#live-values-and-charts)).
- **Agents build for working, not feeling right:** a human watches the transitions and describes what feels off ("Play with the result, notice what's wrong, describe it, repeat"), and gives the agent the structural constraint, not the goal: "smooth transitions" produced a crossfade; "exactly three SVG lines" per icon produced the morph.
