---
name: ui-animation
description: "Designs and builds website and app animations that feel deliberate and stay smooth: durations, curves and springs by element, staggers, enter and exit, layout and shared-element transitions, gestures, scroll-linked motion, collections, reduced motion. React with Motion, and CSS. Use when adding, tuning or reviewing animations or transitions in an interface."
---

# UI animation

The model knows what a card entrance is. It doesn't know this card should take 280 ms, the one behind it should start 60 ms later, and both must be interruptible mid-flight. Pick from the numbers; deviate on purpose, never by accident. Every animation answers one question: what changed, and where did it go?

| The job | Read |
|---|---|
| How long, which curve, which spring; staggers, overlaps, distance, direction | [TIMING.md](TIMING.md) |
| Enter and exit, layout and shared-element transitions, lists, modals, toasts, numbers, gestures, scroll, galleries and carousels | [PATTERNS.md](PATTERNS.md) |
| Smooth on a slow phone: which properties, GPU vs main thread, React re-renders, reduced motion, measuring | [PERFORMANCE.md](PERFORMANCE.md) |

Images and video loading, long lists and bundle splitting are in the `performance-and-caching` skill's BROWSER.md; how much motion a page should have at all is the MOTION dial in `anti-slop-ui`; how each app component (menus, dialogs, confirms, tables, boards) moves and behaves is in `app-ui`; a marketing site's hero, reveals and page transitions are in `landing-page-ui`; an agent chat's status line, streaming and cards are in `agent-chat-ui`.

## The rules

1. **Motion explains a change.** Something appeared, left, moved, grew into a detail view, was confirmed or rejected. Motion with no change to explain (floating cards, everything fading up on scroll, idle bouncing) is decoration; cut it or keep it subliminal.
2. **Small and frequent is fast; big and rare is slower.** A toggle is 120-180 ms, a modal 300-400 ms, a page transition 400-600 ms. Anything a user triggers dozens of times a day stays near the bottom of its range, and nothing blocks input while it plays.
3. **One motion language per product:** one curve for arrivals, one for exits, one spring family for things that feel physical, one stagger rhythm, one base duration that the others are multiples of. A screen that invents its own is a defect, not a style.
4. **Exits are faster than entrances** (about half to two thirds of the entrance), and leave through the nearest edge or back where they came from.
5. **Interruptible always.** A new target starts from the current position and velocity; never wait for an animation to finish before responding, never snap back to the start first.
6. **Things that move together move as one:** a group shifts in one direction, never crossing paths; one element is the focus of each change, everything else yields.
7. **Only transform and opacity move,** so it stays smooth while the page is busy ([PERFORMANCE.md](PERFORMANCE.md)).
8. **Reduce, don't remove:** with reduced motion, movement becomes short fades; feedback and state changes stay.

## Prove it

Record the interaction at 4x CPU slowdown: no dropped frames, no layout in the animation frames. Click twice fast and mid-animation: it retargets smoothly. Toggle reduced motion: no slides or zooms remain, every state change is still visible. Check every duration and curve against [TIMING.md](TIMING.md).
