# Presses and drags: the details

The base recipe (drag, throw, snap to where the throw was heading) is in [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap); physics bodies, fields and projection are in [PHYSICS.md](PHYSICS.md). This file holds what separates a good press and a good drag from a bad one, from Emil Kowalski's `animate` and `emil-design-eng` skills, Apple's WWDC18 "Designing Fluid Interfaces", Craft, Jakub Krehel's `better-ui`, fluid-functionalism and transitions.dev (described, not copied: its license forbids republishing the collection).

## Presses

- **Highlight on touch down, commit on touch up:** "the button should highlight immediately when I touch down on it… we shouldn't confirm the tap until my touch goes up" ([WWDC18](https://developer.apple.com/videos/play/wwdc2018/803/)). The same-frame rule is in [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback).
- **Press scale, more voices** beside the 0.97 and Kiem's 0.94 in PATTERNS.md. Neither wins:
  - "I like `0.98` or `0.97` for the scale. Below `0.95` it starts to look like an effect", over 100-150 ms: "Longer than that and the button lags behind your finger" [Craft].
  - "Larger surfaces should shrink less. A full-width card at `0.97` moves several pixels at the edges" [Craft].
  - `0.96` over `150ms` `ease-out`, never below it [Jakub Krehel, better-ui].
  - `scale(0.97)` over `160ms ease-out`, "Keep it subtle (0.95-0.98)" [Emil Kowalski, emil-design-eng].
  - app-ui squishes instead: "pressed `scale(1.07, .91)` in 70ms, back over 120ms ease-out" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#buttons)).
- **Transition `transform` only, and a disabled button doesn't press:** "Transition `transform` only, not `all`, so the press timing does not leak into hover colors." "A disabled button should not press" [Craft]:

```css
.button {
  transition: transform 100ms ease-out;
  -webkit-tap-highlight-color: transparent;
}
.button:active:not(:disabled) {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

- **A press without scale:** "the surface layer sits 1px inside the button (inset-px) and a same-color 1px box-shadow spread fills it back to full bounds; pressing collapses the spread so the surface shrinks exactly 1px per side at any width - a scale would warp (2% of a 400px button is 8px sideways but under 1px vertically)" [fluid-functionalism].
- **A quick tap shows the whole press:** on a touch or pen `pointerdown`, add a pressed class and keep it until at least the press duration has passed after `pointerup` or `pointercancel`, so a tap shorter than the press animation still shows it in full; mouse presses use `:active` as usual [transitions.dev].

## Grab and hold on

- **Pointer capture once the drag starts:** "This ensures dragging continues even if the pointer leaves the element bounds" [Emil Kowalski, emil-design-eng]. `setPointerCapture(pointerId)` is Baseline widely available since July 2020; capture ends on `releasePointerCapture()` or `pointerup` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)).
- **Keep the grab offset:** "never use the center of the image as the dragging point"; keep a history of positions and times for the release velocity: "We use the history of the touch" ([WWDC18](https://developer.apple.com/videos/play/wwdc2018/803/)).
- **Ignore the second finger:** "Ignore additional touch points after the initial drag begins. Without this, switching fingers mid-drag causes the element to jump to the new position" [Emil Kowalski, emil-design-eng]:

```js
function onPress() {
  if (isDragging) return;
  // Start drag...
}
```

- **Feedback through the whole drag, not at its end:** "avoid methods that are only detected at the end of the gesture, like UISwipeGestureRecognizer" ([WWDC18](https://developer.apple.com/videos/play/wwdc2018/803/)).
- **How far before it's a drag, four ways:** Apple's hysteresis "is usually 10 points in iOS" ([WWDC18](https://developer.apple.com/videos/play/wwdc2018/803/)); Kiem's rows count a tap up to 12 px ([PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap)); feel starts a drag at 4 px ([PHYSICS.md](PHYSICS.md)); app-ui's boards use "a 5px activation distance (clicks still click)" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md#boards-and-lists-of-the-same-items)). Neither wins.
- **Set the transform on the dragged element itself,** not through a CSS variable on its parent: "Driving it through a CSS variable on the parent recalcs styles for every child" [Emil Kowalski, animate]. The cost is in [PERFORMANCE.md](PERFORMANCE.md#traps-that-use-transform-and-still-drop-frames).

## Let a flick dismiss

"Don't require dragging past a threshold. Calculate velocity: `Math.abs(dragDistance) / elapsedTime`. If velocity exceeds ~0.11, dismiss regardless of distance. A quick flick should be enough" [Emil Kowalski, emil-design-eng]. The time is in milliseconds, so 0.11 is px per ms, about 110 px/s:

```js
// Dismiss on a flick, not just on distance
const timeTaken = Date.now() - dragStartTime.current;
const velocity = Math.abs(swipeAmount) / timeTaken;

if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
  dismiss();
}
```

- Sonner ships the same rule with `SWIPE_THRESHOLD` at 45 px ([TOASTS-AND-TOOLTIPS.md](TOASTS-AND-TOOLTIPS.md#toasts)).
- **Damping past the edge, friction instead of a wall:** "The more they drag, the less the element moves. Things in real life don't suddenly stop; they slow down first" [Emil Kowalski, emil-design-eng]. Motion's `dragElastic` does it ([PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap)); other rubber bands are compared in [PHYSICS.md](PHYSICS.md).

## Hand the release velocity to a physics spring

In Motion, "Physics-based spring animations are set via `stiffness`, `damping` and `mass`, and these incorporate the velocity of any existing gestures or animations for natural feedback." "Duration-based spring animations are set via a `duration` and `bounce`. These don't incorporate velocity but are easier to understand." The `velocity` option defaults to the "Current value velocity" ([motion.dev](https://motion.dev/docs/animate)).

- The settle after a throw therefore names stiffness and damping, and can pass the gesture's velocity: the carousel in [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap) does.

- The `animate` skill settles a drag on `{ type: "spring", duration: 0.5, bounce: 0.2 }` "so an interrupted drag keeps its velocity" [Emil Kowalski, animate]; by motion.dev that duration form does not take the velocity.
- The `visualDuration` presets in [TIMING.md](TIMING.md) are duration-based too: keep them for things nobody throws.
- `type: "inertia"` "decelerate[s] a value based on its initial velocity, usually used to implement inertial scrolling" ([motion.dev](https://motion.dev/docs/animate)).

## Follow the pointer through a spring

"Tying visual changes directly to mouse position feels artificial because it lacks motion"; spring it, and only where it's decorative: "If this were a functional graph in a banking app, no animation would be better" [Emil Kowalski, emil-design-eng].

- The skill's code passes a number that changes every render to `useSpring` and imports from `framer-motion`. motion.dev documents `import { useSpring } from "motion/react"` with a number or a source motion value, which it "springs toward" ([motion.dev](https://motion.dev/docs/react-use-spring)): `useSpring(mouseX, { stiffness: 100, damping: 10 })`, where `mouseX` is a motion value.

## A card that tilts toward the pointer

From transitions.dev's card tilt, described:

- Track the pointer on a flat outer wrapper, not on the card that rotates, or the hit area turns with the card and hover flickers at its edges.
- Tilt with `perspective()` and `rotateX`/`rotateY` capped at about 14°; the source calls 10-16° "a subtle, tasteful tilt". Follow quickly while the pointer moves (400 ms) and return slowly when it leaves (1000 ms).
- For touch it captures the pointer on `pointerdown` and sets `touch-action: none` on the outer wrapper, so a drag tilts the card instead of scrolling the page.

## A switch thumb you can drag

fluid-functionalism's switch: the thumb is draggable with pointer capture and a 2px dead zone; release past the midpoint toggles, otherwise it springs back; a `didDrag` flag swallows the click that follows a drag; the hover shape applies only for `pointerType === "mouse"`, so touch never sticks in it; it mounts at duration 0. The held-switch stretch is in [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback).

## Prove it

On a real phone: tap a button faster than its press animation and see the whole press; press a disabled button and see nothing move. Drag a sheet past the element's edge and off the screen edge: it keeps following. Put a second finger down mid-drag: nothing jumps. Flick a short distance fast: it dismisses; drag slowly past the threshold: it dismisses; drag slowly short of it: it springs back. Throw a carousel and watch the release: the settle continues the throw's speed instead of starting from rest.
