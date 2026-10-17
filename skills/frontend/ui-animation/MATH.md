# Motion math: values you compute every frame

When a predefined curve can't keep up (a target that changes every frame, particles, a loop that resets), the animation is math you evaluate every frame. Most of this file is from kciter's "How to Design an Animation"; the chart numbers are Liveline's.

## Start from the graph

- **Every animation is a value changing according to some input,** and it can be drawn as a graph: "The shape of the graph determines the feel of the motion." A graph makes the motion reproducible and combinable. The core of the design is decomposition: break the motion into simple pieces, draw each one as a graph, then reassemble them.
- **First ask what the value depends on;** the answer fixes the horizontal axis:
  - **time-based:** `f(state, Δt) → nextState`, applied every frame;
  - **value-based:** the input is something other than time (scroll offset for parallax, mouse position, sensor data);
  - **event-based:** a trigger (hover, click, data loaded) starts a transition from the current value to the next; often a hybrid, where the event triggers it and the transition runs on time.

## Lerp, and a Bézier curve built from it

```js
function lerp(a, b, t) {
  return a + (b - a) * t;
}
```

An easing function takes a progress value between 0 and 1 and returns an adjusted one; the cubic Bézier is the most widely used way to express it. A cubic Bézier is recursive linear interpolation: interpolate P0 to P1, P1 to P2 and P2 to P3 at `t` (three points), then those three (two points), then those two (one point on the curve). How to read and shape a `cubic-bezier` is in [TIMING.md](TIMING.md#curves); the gallery blend in [PATTERNS.md](PATTERNS.md#galleries-carousels-and-rings) uses the same `lerp`.

## Exponential approach: chase a target that moves

For a target that changes partway or every frame (an element following the cursor):

```js
value += (target - value) * factor; // factor: 0~1
```

- Each frame moves the value in proportion to the remaining difference, so it approaches fast and then slows: the gap shrinks by `(1 - factor)` per frame, and a larger factor converges faster. It stays natural when the target changes: a sudden jump in the cursor turns it smoothly from where it is. It works for any value, not only position.
- **Counters and progress:** a dashboard counter "climbs quickly toward its target number and then slows down as it settles". A progress bar whose real value "jumps forward in chunks depending on network conditions" looks smooth and continuous when the displayed bar chases the real value this way.
- **Live charts:** Liveline lerps the line, the Y-axis range, the badge and the grid labels toward the new state at 8% per frame (`lerpSpeed`, default `0.08`), all on the same lerp, so the chart "feels like one thing breathing rather than a bunch of parts updating independently" ([PATTERNS.md](PATTERNS.md#live-values-and-charts)).
- **Per frame or per second:** [TIMING.md](TIMING.md#speed-limits) says durations stay the same on 120 Hz screens and to "never animate by frame counts". kciter applies the factor "every frame" and Liveline eases "8% per frame"; neither gives a frame-time correction. Both positions stand; neither wins.

## A spring by hand

Easing and the exponential approach converge on the target monotonically; a spring overshoots slightly and comes back, for the springy feedback of a pressed button or a dragged element bouncing back to where it belongs. A spring is damped harmonic oscillation: the restoring force is `-k × (current - target)` (k, the stiffness) and the damping force is `-c × velocity` (c, the damping coefficient).

```js
const force = -stiffness * (current - target) - damping * velocity;
velocity += force * dt;
current += velocity * dt;
```

Higher stiffness is "taut and quick to respond"; lower damping oscillates for longer (kciter's demo shows an underdamped spring at a damping ratio of 0.46). "A spring has no duration": easing has a fixed time, a spring keeps running until it converges. Motion's `visualDuration` is how [TIMING.md](TIMING.md#springs) gives a spring a place on the duration scale.

Flutter community view: FlutterPro's spring bottom sheet writes "SwiftUI's .smooth spring as plain numbers: critically damped, stiffness 4pi^2 / duration^2, at 300ms in and 200ms out" ([FlutterPro](https://flutterpro.design/details/smooth-draggable-bottom-sheets); [../../mobile/flutter-ux/NAVIGATION-AND-SHEETS.md](../../mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#spring-bottom-sheet)).

## Physics: forces, integrate, constrain

Three steps per frame: **compute forces** (gravity, springs, friction, user input); **integrate** (force gives acceleration, acceleration updates velocity, velocity updates position); **apply constraints** (collision, boundaries, joints).

```js
for (const obj of objects) {
  // Compute forces
  const gravity = { x: 0, y: 9.8 * obj.mass };
  const friction = { x: -obj.vx * drag, y: -obj.vy * drag };
  const fx = gravity.x + friction.x;
  const fy = gravity.y + friction.y;

  // Integrate
  obj.vx += (fx / obj.mass) * dt;
  obj.vy += (fy / obj.mass) * dt;
  obj.x += obj.vx * dt;
  obj.y += obj.vy * dt;

  // Apply constraints (floor collision)
  if (obj.y > floorY) {
    obj.y = floorY;
    obj.vy *= -restitution; // bounce scaled by restitution
  }
}
```

- "You only define the rules, and the motion takes care of itself": confetti from gravity, air resistance and rotation.
- **Physics fits when many objects interact or the outcome depends on user input.** It is less predictable (the result depends on initial conditions), so it is "often better suited to supporting effects and interactive elements than to a UI's core transitions".

## Split the graph into segments

Express complex motion as a piecewise function: split the graph into segments, design each one, stitch them together. A map pin that bounces a couple of times before it settles could come from physics, but "natural motion doesn't always make for good animation": segments let you deliberately lower the second bounce or soften the final landing.

## Face the direction of travel

`atan2(dy, dx)` returns the angle between two points in radians; pass the difference between the current and the target position:

```js
const dx = targetX - currentX;
const dy = targetY - currentY;
const angle = Math.atan2(dy, dx);
element.style.transform = `rotate(${angle}rad)`;
```

For an arrow that points where it moves, a character turning toward its destination, particles stretching along their spread. For a 3D tilt card, `atan2` gives the direction of the cursor and the distance from the center gives the strength of the tilt.

## Waves: sin and phase

```js
const y = amplitude * Math.sin(time * frequency);
```

Three parameters: amplitude (size), frequency (speed) and phase (start offset). A phase proportional to the index makes items move one after another:

```js
items.forEach((item, i) => {
  const y = amplitude * Math.sin(time * frequency + i * phaseOffset);
  item.style.transform = `translateY(${y}px)`;
});
```

Loading indicators, equalizer bars, ripples, and the typing indicator: "The three dots bouncing in turn are the same `sin` function with different phases."

- **Floating backgrounds:** kciter builds the landing-page floating effect this way (each element its own amplitude, frequency and phase, for a natural-looking background). [SKILL.md](SKILL.md) rule 1 calls floating cards decoration to cut or keep subliminal. The technique serves both; whether a floating background earns its place is the rule's call against the article's.

## Sawtooth: one way, then reset

```js
const p = (t % period) / period; // always 0~1, resets every period
```

It rises linearly from 0 to 1, then drops straight back to 0. Map `p` onto scale or opacity for a repeating "spread out and fade away":

```js
const scale = 1 + p * 0.8;   // grows from 1 → 1.8
const opacity = 1 - p;        // fades from 1 → 0
```

The pulse ring on a notification badge, pings, looping progress indicators. "With just these two, the smooth round trip of `sin` and the one-way reset of the sawtooth, you can express most periodic animation."

## Controlled randomness

Randomness removes the mechanical feel: "give particle speeds a ±20% variance, add a slight wobble to the angles, or shift the start times so they're slightly out of step". But "Random shouldn't mean truly random": pure randomness can lean everything to one side or produce extreme sizes.

| | Pure random | Controlled random |
|---|---|---|
| Speed | 0 ~ 5 | 2 ~ 3.5 |
| Size | 1 ~ 9 | 2.5 ~ 4 |
| Color | 0° ~ 360° | Base hue ± 20° |
| Distribution | Random | Even spacing + slight jitter |

Split the animation into what's intended (particles rising) and the "unintended elements that were put there on purpose" (small speed differences), and decide where the boundary between them sits.
