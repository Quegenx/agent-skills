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

## Curves

Use about three, each with one job. `linear` only for progress bars, spinners and continuous drift.

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
- Don't mix parameterisations in one codebase (stiffness and damping in one file, duration and bounce in the next); pick one and keep the presets in one module.
- Springs keep their velocity when interrupted; that's why a dragged or retargeted element should be a spring, not a tween.

## Staggers and sequencing

- **Total stagger under about 500 ms,** whatever the count: list items 30-60 ms apart (a dense grid 20-40 ms), words about 90 ms. With many items, stagger by distance from a focal point (the clicked card, the top left) so the feel stays the same at any count, and cap how many items animate at all (the first visible 8-12; the rest just appear).
- **Entrances run 30-50% longer than exits.**
- **Distance scales duration:** about 350 ms plus 1.35 ms per pixel travelled (200 px is about 620 ms), clamped to the element's range. A long slide at a short duration reads as a jump; a short nudge at a long one reads as lag.
- **A follow-up move starts 55-75% into the move before it,** so both settle together instead of stop-then-lurch.
- **One element, two moves** (slides in, then lifts): start the second stage about 60% through the first, so the speed never reaches zero at the corner; under about 25% overlap the corner reads as a stop, over about 50% the two moves merge into one diagonal.
- **Content inside a morphing container** appears about 80 ms after the morph starts and disappears about 120 ms before the next one.
- **Overlap transitions:** the next view starts arriving before the last has fully left; a gap reads as loading.
- **Derive, don't schedule:** when several things depend on one value (a slider, a scroll position, upload progress), drive them all from that value instead of giving each its own timer.

## Direction and weight

- New content enters from the reading direction's end (right or below in left-to-right layouts, left in right-to-left ones); going back reverses the entrance; drilling into detail scales up from the item; things leave through the nearest edge.
- The focus of a change enters first and leaves last; supporting elements follow 50-150 ms later with less travel.
- Small controls snap; large panels settle; nothing travels more than about a third of the viewport in one unbroken move.
- A number counts to its value on an ease-out with no overshoot, its label settles after the count lands, and the final value holds.

## Speed limits

- Text being read moves at most a few pixels per frame; it lands sharp, never still drifting.
- Nothing flashes full-screen in under 300 ms.
- On 120 Hz screens, durations stay the same (time, not frames): never animate by frame counts.
