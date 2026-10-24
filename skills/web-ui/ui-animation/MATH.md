# Motion math: values you compute every frame

When a predefined curve can't keep up (a target that changes every frame, particles, a loop that resets), the animation is math you evaluate every frame. Most of this file is from kciter's "How to Design an Animation"; the chart numbers are Liveline's; the gesture handoff is Nathan Gitter's sample app.

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

An easing function takes a progress value between 0 and 1 and returns an adjusted one; the cubic Bézier is the most widely used way to express it. A cubic Bézier is recursive linear interpolation: interpolate P0 to P1, P1 to P2 and P2 to P3 at `t` (three points), then those three (two points), then those two (one point on the curve). How to read and shape a `cubic-bezier` is in [TIMING.md](TIMING.md#curves); the gallery blend in [COLLECTIONS.md](COLLECTIONS.md#galleries-carousels-and-rings) uses the same `lerp`.

## Exponential approach: chase a target that moves

For a target that changes partway or every frame (an element following the cursor):

```js
value += (target - value) * factor; // factor: 0~1
```

- Each frame moves the value in proportion to the remaining difference, so it approaches fast and then slows: the gap shrinks by `(1 - factor)` per frame, and a larger factor converges faster. It stays natural when the target changes: a sudden jump in the cursor turns it smoothly from where it is. It works for any value, not only position.
- **Counters and progress:** a dashboard counter "climbs quickly toward its target number and then slows down as it settles". A progress bar whose real value "jumps forward in chunks depending on network conditions" looks smooth and continuous when the displayed bar chases the real value this way.
- **Live charts:** Liveline lerps the line, the Y-axis range, the badge and the grid labels toward the new state at 8% per frame (`lerpSpeed`, default `0.08`), all on the same lerp, so the chart "feels like one thing breathing rather than a bunch of parts updating independently" ([LIVE-CHARTS.md](LIVE-CHARTS.md#live-values-and-charts)).
- **Per frame or per second:** [TIMING.md](TIMING.md#speed-limits) says durations stay the same on 120 Hz screens and to "never animate by frame counts". kciter applies the factor "every frame" and Liveline eases "8% per frame"; neither gives a frame-time correction. Both positions stand; neither wins.

## A spring by hand

Easing and the exponential approach converge on the target monotonically; a spring overshoots slightly and comes back, for the springy feedback of a pressed button or a dragged element bouncing back to where it belongs. A spring is damped harmonic oscillation: the restoring force is `-k × (current - target)` (k, the stiffness) and the damping force is `-c × velocity` (c, the damping coefficient).

```js
const force = -stiffness * (current - target) - damping * velocity;
velocity += force * dt;
current += velocity * dt;
```

Higher stiffness is "taut and quick to respond"; lower damping oscillates for longer (kciter's demo shows an underdamped spring at a damping ratio of 0.46). "A spring has no duration": easing has a fixed time, a spring keeps running until it converges. Motion's `visualDuration` is how [TIMING.md](TIMING.md#springs) gives a spring a place on the duration scale.

Flutter community view: FlutterPro's spring bottom sheet writes "SwiftUI's .smooth spring as plain numbers: critically damped, stiffness 4pi^2 / duration^2, at 300ms in and 200ms out" ([FlutterPro](https://flutterpro.design/details/smooth-draggable-bottom-sheets); [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#spring-bottom-sheet)).

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

## Gesture handoff: project, normalise, resist

When a drag ends, three numbers decide what happens next: where the throw would stop, how fast the settle spring starts, and how far past an edge the element follows. The code here is Nathan Gitter's sample app recreating WWDC18 *Designing Fluid Interfaces* ([nathangitter/fluid-interfaces](https://github.com/nathangitter/fluid-interfaces), "© 2018 Nathan Gitter", Apache-2.0), not Apple's: the talk describes the projection function but its transcript holds no code and no rubber-band formula ([WWDC18 803](https://developer.apple.com/videos/play/wwdc2018/803/)). [Emil Kowalski, apple-design] calls the projection "Apple's exact projection function (from the *Designing Fluid Interfaces* sample code)"; the sample it matches is Gitter's.

**Project where the throw comes to rest** (Pip.swift):

```swift
/// Distance traveled after decelerating to zero velocity at a constant rate.
private func project(initialVelocity: CGFloat, decelerationRate: CGFloat) -> CGFloat {
    return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate)
}
```

- The rates are `UIScrollView.DecelerationRate`: `normal = 0.998`, `fast = 0.99` (SwiftExtensions.swift). The PiP projects x and y separately with `.normal`, adds each to the current centre, snaps to the corner nearest the projected point, and only then animates.
- In JavaScript, as [Emil Kowalski, apple-design] writes it: `function project(initialVelocity /* px/s */, decelerationRate = 0.998) { return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate); }`.
- At 0.998 the coast is the velocity times 0.499 s; the carousel in [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap) coasts `info.velocity.x * 0.2`. Both stand. [feel] derives the coast from the body instead (`x + v·m/c`, in [PHYSICS.md](PHYSICS.md)).
- **Commit or reverse by direction:** [Emil Kowalski, apple-design] pairs "Decide reverse vs. commit" with "Use velocity **sign**, not position", at release. This is not in the talk transcript.

**Normalise the release velocity** for a spring that wants it relative to the remaining distance (Pip.swift):

```swift
/// Calculates the relative velocity needed for the initial velocity of the animation.
private func relativeVelocity(forVelocity velocity: CGFloat, from currentValue: CGFloat, to targetValue: CGFloat) -> CGFloat {
    guard currentValue - targetValue != 0 else { return 0 }
    return velocity / (targetValue - currentValue)
}
```

- The worked example from [Emil Kowalski, apple-design]: an element at `y=50` with its target at `y=150` (100 px to go) and the finger at 50 px/s gets `50 / 100 = 0.5`.
- Gitter hands it to UIKit as `UISpringTimingParameters(damping: 1, response: 0.4, initialVelocity: relativeInitialVelocity)`. Motion's `velocity` option is "The initial velocity of the spring", with no unit stated (only `restSpeed` is "in units per second"), and only a physics spring uses it: a spring given `duration` or `bounce` and no `stiffness`, `damping` or `mass` sets it to zero (`isTimeDefined`, [motion-dom spring.ts](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts)) ([TIMING.md](TIMING.md#springs)). [Emil Kowalski, apple-design] says Motion takes "absolute px/s velocity directly"; the docs don't state the unit.

**Rubber-band past the edge** (Rubberbanding.swift), the offset raised to a power while dragging, then a spring home on release:

```swift
        case .changed:
            var offset = touchPoint.y - originalTouchPoint.y
            offset = offset > 0 ? pow(offset, 0.7) : -pow(-offset, 0.7)
            rubberView.transform = CGAffineTransform(translationX: 0, y: offset)
        case .ended, .cancelled:
            let timingParameters = UISpringTimingParameters(damping: 0.6, response: 0.3)
```

- The other common formula, `rubberband(overshoot, dimension, constant = 0.55) { return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot)); }`, appears in [Emil Kowalski, apple-design] and [Emil Kowalski, animate-expo] with no source named; it is neither in the talk nor in Gitter's sample.
- Other ways to resist: Motion's `dragElastic` ([PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap)) and feel's walls ([PHYSICS.md](PHYSICS.md)).

Wiring the release velocity into a Motion spring is in [GESTURES.md](GESTURES.md#hand-the-release-velocity-to-a-physics-spring).

**Motion's own coast:** "Inertia animations decelerate a value based on its initial velocity, usually used to implement inertial scrolling" (`type: "inertia"`, [motion.dev: animate](https://motion.dev/docs/animate)). Its generator coasts `power` times the velocity (`let amplitude = power * velocity`, [motion-dom inertia.ts](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/inertia.ts)).

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

That example's "always" assumes nonnegative time and a positive period: JavaScript `%` is remainder and keeps the dividend's sign. Delayed illustration channels can sample negative time; use the normalized loop definition [below](#illustration-tracks-and-stable-variation) for those. The old comment did not state this limit. [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder; rossark-motion-skill, templates/react-native/motion.ts]

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

## Illustration tracks and stable variation

[rossark-motion-skill, templates/react-native/motion.ts; SKILL.md sections 2 and 5]

- **A stopped segment or a continuous pose chain:** the source's `track` reads `[time, value, optional 'out']` keys, easing each segment in/out or using its arrival key's out curve. Its `flow` reads time/value pose keys with monotone cubic interpolation and weighted harmonic-mean interior tangents. Endpoints, changes of slope sign and repeated-value holds get zero tangent; monotone interior keys can carry motion through without a stop. The source's statement that it passes through every pose does not mean nonzero speed through an extremum or hold.
- **Keep keys ordered:** the flow implementation divides value differences by adjacent time differences. Supply sorted, distinct key times; repeated values create holds, not repeated timestamps. A loop's final value matches its first. The illustration application is in [living illustrations](ILLUSTRATION-ACTING.md#acting-between-poses).
- **Phase uses a fraction of a cycle:** the source wave is sine of `(t / period + phase) * 2 * Math.PI`, giving values from -1 to 1. This is the same wave/phase technique [above](#waves-sin-and-phase), with time expressed against a period.
- **Normalize delayed loop time:** compute `p = (t / period + phase) % 1`, then use `p < 0 ? p + 1 : p`. This keeps the loop progress nonnegative when a delayed child samples time before zero. It corrects the nonnegative-time assumption in the earlier sawtooth example.
- **Envelope and beat window:** the source's bell is `Math.sin(Math.PI * Math.min(1, Math.max(0, p)))`, zero at either end and one at the middle. Its segment helper clamps before/after the beat and eases progress within it. Use a beat window for an accent that appears only during a named action.
- **Stable indexed variation:** the source derives `x` from `Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453` and returns `x - Math.floor(x)`. An item's index and salt reproduce its phase, speed or size across renders; do not call Math.random on every frame. Keep variation within the artwork's chosen range, using the existing [controlled-randomness guidance](#controlled-randomness).

## Prove it

Use the [gesture handoff checks](GESTURES.md#prove-it) for release behavior and the [physics verification](PHYSICS.md#prove-it) when using its solver. Keep the per-frame versus per-second source disagreement explicit when reviewing a moving target. [kciter; Liveline; Nathan Gitter; feel]
