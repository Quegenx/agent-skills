# Physics: bodies, fields, the hand, projection

Motion that comes from a physical model: a body with mass on a spring, force fields (magnets, friction, walls), a drag that pulls through a "hand" spring, and release decisions made from where the body would coast. The source is the `feel` skill and runtime, v0.2 ([diip3sh/feel](https://github.com/diip3sh/feel), MIT, copied with attribution; tagged [feel]). Its one rule is "Every motion comes from a physical model: mass, stiffness, damping and forces. No hand-picked durations." [feel]

**Both ways, with the rest of this skill:** [TIMING.md](TIMING.md) is a duration-and-curve system (a toggle 120-180 ms, a modal 300-400 ms, Motion springs written as `visualDuration` and `bounce`), and `app-ui` builds its product on duration and `cubic-bezier` tokens ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens)). feel bans both: "No `transition: … 300ms`, no `animation-duration`, no `cubic-bezier`, no `ease-out`, no `duration:` options, no timers that move things." [feel] Use this file for things a finger drags and throws, and when a feel is asked for in words; TIMING.md stays the default for state changes. Neither wins.

**Contents:** [Size the job](#size-the-job) · [The model](#the-model) · [Modal and physical numbers](#modal-and-physical-numbers) · [The solver: RK4 and the exact solution](#the-solver-rk4-and-the-exact-solution) · [Words to stiffness and damping](#words-to-stiffness-and-damping) · [Choose the model](#choose-the-model) · [Walls and rubber-banding](#walls-and-rubber-banding) · [Magnets, detents and friction](#magnets-detents-and-friction) · [The hand](#the-hand) · [Projection: decide on release](#projection-decide-on-release) · [Craft rules](#craft-rules) · [Reduced motion](#reduced-motion) · [Bake physics into WAAPI keyframes](#bake-physics-into-waapi-keyframes) · [Export to Motion and react-spring](#export-to-motion-and-react-spring) · [Four worked components](#four-worked-components) · [Prove it](#prove-it)

## Size the job

Tell the user which size it is before anything else. [feel]

- **Interaction:** one component, one body (toggle, button press, card lift, slider thumb). "20-45 minutes. Build it without asking."
- **Gesture system:** several bodies or a field (bottom sheet with stops, carousel with momentum, reorderable list). "1-3 hours. Say so, then build it."
- **Motion system:** a whole product's motion vocabulary. "Half a day or more. Don't start it. Propose the 3 interactions that matter most, and list what the full system would add."

## The model

Every body obeys one equation [feel, references/models.md]:

```
m·x″ = −k·(x − target) − c·v + Σ forces(x, v) + walls + hand
```

- Units are px (or degrees) and seconds. "Mass 1 is a normal UI element, and the hand spring is tuned for it." [feel]
- **Overshoot** is `exp(−ζπ/√(1−ζ²))` for ζ < 1. **Settle** is "the last moment the motion is outside a ±2% band: the time the eye stops seeing it move".
- **Decay rate** is ζω for ζ < 1, ω for ζ = 1, and ω(ζ − √(ζ²−1)) for ζ > 1. "That's why over-damped springs feel slow."
- **Mass is felt in interaction, frequency and damping in motion.** "Two toggles with the same frequency and damping but different mass look identical when tapped and feel different when dragged. If the feel is about weight, the demo must include a drag." [feel] That holds at fixed frequency and ζ. The Flutter view in [flutter-ui MOTION-AND-FEEDBACK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/ANIMATION.md#springs) ("`mass` | how heavy; heavier is slower to start and to stop") describes mass with stiffness and damping held fixed instead.
- **Rest:** a body is at rest under `restV` 4 units/s and within `restX` 0.25 units of where it rests; the settle band for a move is `max(0.02 · span, restX)`. [feel, runtime/feel.js]

## Modal and physical numbers

"Designers think in the second, the solver runs on the first" [feel, runtime/feel.js]: physical (mass m, stiffness k, damping c) and modal (mass m, natural frequency f in Hz, damping ratio ζ).

```js
function fromModal(o) {
  const mass = o.mass ?? 1;
  const w = TAU * o.freq;
  const stiffness = mass * w * w;
  return { mass, stiffness, damping: 2 * o.zeta * Math.sqrt(stiffness * mass) };
}

function modal(p) {
  const w = Math.sqrt(p.stiffness / p.mass);
  return { mass: p.mass, omega: w, freq: w / TAU, zeta: p.damping / (2 * Math.sqrt(p.stiffness * p.mass)) };
}
```

So k = m(2πf)², c = 2ζ√(km); back the other way, ω = √(k/m), ζ = c/(2√(km)). This is the conversion between parameterisations that [TIMING.md](TIMING.md#springs) says not to mix in one codebase.

**Reading the numbers** [feel, references/vocabulary.md]:

- **Frequency** is how quickly it wants to get there: "Under 1.5 Hz reads as weight or calm, 2-3 Hz as normal UI, and over 4 Hz as instant or mechanical."
- **ζ** is how it arrives: under 0.4 visibly bounces; 0.6-0.85 lands with a small thump; 1 arrives without overshoot; over 1 creeps in.
- **Mass** "only shows when something else pushes: a finger, a magnet, a wall. Same frequency and ζ with more mass means more lag behind the finger and a longer coast after a flick."

**Fluid Functionalism's three tiers as springs** [feel, runtime/rig.js]: "`duration` is the time a spring takes to settle within 0.1%, which a critically damped one reaches at ωt ≈ 9.2: fast (0.08 s) is 18 Hz, moderate (0.16 s) is 9 Hz, and slow (0.24 s, bounce 0.12) is 6 Hz at ζ 0.88."

## The solver: RK4 and the exact solution

**RK4 at 240 steps a second** [feel, runtime/feel.js]: `H = 1 / 240`; a frame's dt is split into `Math.ceil(dt / H)` equal substeps, and the shared loop clamps a frame to `1/30` s (`Math.min((t - last) / 1000, 1 / 30)`). Its error against the exact solution is "under 1e-4 px over a 100 px step", and the audit checks it for every word.

```js
step(dt) {
  const n = Math.max(1, Math.ceil(dt / H)), h = dt / n;
  for (let i = 0; i < n; i++) {
    // RK4
    const x = this.x, v = this.v, a = (X, V) => this.force(X, V) / this.mass;
    const k1x = v, k1v = a(x, v);
    const k2x = v + (h / 2) * k1v, k2v = a(x + (h / 2) * k1x, v + (h / 2) * k1v);
    const k3x = v + (h / 2) * k2v, k3v = a(x + (h / 2) * k2x, v + (h / 2) * k2v);
    const k4x = v + h * k3v, k4v = a(x + h * k3x, v + h * k3v);
    this.x = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    this.v = v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  this.clock += dt;
}
```

[MATH.md](MATH.md#a-spring-by-hand) steps a spring once per frame with no mass (`velocity += force * dt; current += velocity * dt;`) and says its sources give no frame-time correction; fixed substeps with a clamped dt are feel's answer to that.

**The exact solution**, all three regimes. Displacement u = x − target, starting at u0 with velocity v0; returns `t → [u, v]`. feel uses it "to draw the ghost curve, to measure overshoot and settle time, to export CSS linear(), and by the audit to check the solver" [feel, runtime/feel.js]:

```js
function response(p, u0, v0 = 0) {
  const { omega: w, zeta: z } = modal(p);
  if (Math.abs(z - 1) < 1e-6) {
    const A = u0, B = v0 + w * u0;
    return (t) => { const e = Math.exp(-w * t); return [e * (A + B * t), e * (B - w * (A + B * t))]; };
  }
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z), A = u0, B = (v0 + z * w * u0) / wd;
    return (t) => {
      const e = Math.exp(-z * w * t), c = Math.cos(wd * t), s = Math.sin(wd * t);
      return [e * (A * c + B * s), e * ((B * wd - z * w * A) * c - (A * wd + z * w * B) * s)];
    };
  }
  const q = Math.sqrt(z * z - 1), r1 = -w * (z - q), r2 = -w * (z + q);
  const C2 = (v0 - r1 * u0) / (r2 - r1), C1 = u0 - C2;
  return (t) => { const e1 = Math.exp(r1 * t), e2 = Math.exp(r2 * t); return [C1 * e1 + C2 * e2, C1 * r1 * e1 + C2 * r2 * e2]; };
}
```

A 2D spring is isotropic, so each axis follows this on its own.

## Words to stiffness and damping

**Write the feel as words, then one sentence per number** [feel]. If the user's word isn't in the table, "map it to the nearest ones and say which you used". For example:

- *frequency 1.35 Hz:* slow enough to read as weight;
- *ζ 0.74:* a 3% overshoot, the thump of something landing;
- *mass 3:* lags a fast drag by a few px and coasts 80 px per 1000 px/s.

Overshoot and settle are for a step from rest, the spring on its own [feel, references/vocabulary.md]:

| word | mass | frequency | ζ | overshoot | settles | physical |
|---|---|---|---|---|---|---|
| snappy | 1 | 3.4 Hz | 0.82 | 1.1% | 183 ms | k 456.4 · c 35.04 |
| crisp | 1 | 3.8 Hz | 0.92 | 0.1% | 206 ms | k 570.1 · c 43.93 |
| quick | 1 | 3.6 Hz | 0.95 | 0% | 233 ms | k 511.6 · c 42.98 |
| instant | 1 | 6 Hz | 1 | 0% | 155 ms | k 1421.2 · c 75.4 |
| precise | 1 | 4.5 Hz | 1 | 0% | 206 ms | k 799.4 · c 56.55 |
| stiff | 1 | 4.6 Hz | 0.9 | 0.2% | 163 ms | k 835.4 · c 52.02 |
| firm | 1 | 3.8 Hz | 0.95 | 0% | 220 ms | k 570.1 · c 45.36 |
| tight | 1 | 4.2 Hz | 0.85 | 0.6% | 159 ms | k 696.4 · c 44.86 |
| smooth | 1 | 1.8 Hz | 1 | 0% | 516 ms | k 127.9 · c 22.62 |
| soft | 1 | 1.4 Hz | 1 | 0% | 663 ms | k 77.4 · c 17.59 |
| gentle | 1 | 1.2 Hz | 1 | 0% | 774 ms | k 56.8 · c 15.08 |
| calm | 1 | 1.1 Hz | 1.1 | 0% | 1001 ms | k 47.8 · c 15.21 |
| lazy | 1 | 0.9 Hz | 1.2 | 0% | 1401 ms | k 32 · c 13.57 |
| bouncy | 1 | 2.4 Hz | 0.38 | 27.5% | 695 ms | k 227.4 · c 11.46 |
| playful | 1 | 2.6 Hz | 0.45 | 20.5% | 511 ms | k 266.9 · c 14.7 |
| springy | 1 | 2.8 Hz | 0.32 | 34.6% | 635 ms | k 309.5 · c 11.26 |
| wobbly | 1 | 1.8 Hz | 0.22 | 49.2% | 1500 ms | k 127.9 · c 4.98 |
| loose | 1 | 1.6 Hz | 0.3 | 37.2% | 1116 ms | k 101.1 · c 6.03 |
| elastic | 1 | 2.2 Hz | 0.28 | 40% | 999 ms | k 191.1 · c 7.74 |
| heavy | 3 | 1.35 Hz | 0.74 | 3.2% | 686 ms | k 215.8 · c 37.66 |
| weighty | 2.6 | 1.5 Hz | 0.78 | 2% | 382 ms | k 230.9 · c 38.23 |
| solid | 2 | 2.2 Hz | 0.88 | 0.3% | 325 ms | k 382.2 · c 48.66 |
| massive | 4.5 | 1.1 Hz | 0.8 | 1.5% | 543 ms | k 215 · c 49.76 |
| light | 0.45 | 3 Hz | 0.62 | 8.4% | 317 ms | k 159.9 · c 10.52 |
| airy | 0.35 | 2.2 Hz | 0.55 | 12.6% | 422 ms | k 66.9 · c 5.32 |
| feathery | 0.25 | 1.8 Hz | 0.6 | 9.5% | 525 ms | k 32 · c 3.39 |
| magnetic | - | - | - | - | - | adds magnets (strength 1) |
| sticky | - | - | - | - | - | adds friction (1) |
| resistant | - | - | - | - | - | adds friction (0.7), ζ 1 |
| clicky | 1 | 3.4 Hz | 0.8 | 1.5% | 176 ms | k 456.4 · c 34.18 · magnets 0.6 |
| tactile | - | - | - | - | - | adds magnets (strength 0.5) |

The table is copied as the source prints it; in the runtime's word list `clicky` sets no ζ, so it takes the neutral 0.8.

**How words blend** [feel, references/vocabulary.md]: frequency by geometric mean ("heavy snappy" sits at 2.14 Hz); ζ by plain mean; mass by product, capped at 8 (the runtime floors it at 0.15); magnets and friction take the strongest word. Amplifiers scale the next word's distance from neutral (mass 1, 2.2 Hz, ζ 0.8), frequency and mass on a log scale: `very` 1.6, `really` 1.5, `super` 1.8, `extra` 1.6, `slightly` 0.5, `a bit` 0.5, `somewhat` 0.6, `little` 0.5 [feel, runtime/feel.js]. "Unknown words are reported back, not guessed."

**Walls shorten the settle:** "A component with walls can settle sooner: the heavy toggle's wall at its target stops the 3.2% overshoot, so a tap there settles in about 390 ms, not 686 ms." [feel]

**"heavy", both ways:** TIMING.md's `heavy` preset is `{ type: "spring", visualDuration: 0.7, bounce: 0 }` (no overshoot) ([TIMING.md](TIMING.md#springs)); feel's `heavy` overshoots 3.2% and settles in 686 ms alone, about 390 ms with its walls. A toggle on feel's numbers also runs past TIMING.md's "button press, toggle, checkbox | 120-180 ms". `app-ui` does its switch this way instead: "The slide runs 300ms on `cubic-bezier(.175, .885, .32, 1.275)` (a sanctioned overshoot)" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#switch)). Neither wins; app-ui governs app-ui.

## Choose the model

[feel, SKILL.md]

- **Spring to a target** for anything with two or more discrete states chosen by the code (toggle, press, expand, tabs). `body.to(x)` changes the target; "The current velocity carries over, so retargeting mid-motion is seamless."
- **A field** (magnets, friction, walls) for anything the user throws (sheets, carousels, pickers). "A field has no target: the body ends up wherever the field holds it."
- **Walls** at the ends of travel, for rubber-banding.
- **A plane** (`Feel.Body2D`) for anything thrown in two directions at once (a picture-in-picture card, a floating panel). "Two 1D bodies can't do this, because which stop is nearest depends on both coordinates." Points are measured in a straight line, "so a diagonal throw goes to the corner it points at". One isotropic spring and damping, walls per axis, so travel is a rectangle.
- **An angle** (`Feel.Body` with `unit: "°"`) for knobs, dials and wheels; stiffness is per degree.
- **Limit:** "A body has a position or an angle, not both. A card that also tilts as it flies needs a second body for the tilt, driven by the first one's velocity."

**Build on a body:** one `styles(b)` returns `[[el, props], …]`: transform from position, anything else (fill, shadow, stretch) from position or speed, painted in `onFrame`. Bind input with `Feel.drag(el, body, { axis })`. "Keyboard reaches every state." [feel]

## Walls and rubber-banding

`min` and `max` put "stiff, well-damped springs at the ends of travel (8 Hz for a unit mass, ζ 0.9 on impact)" [feel, references/models.md]. A wall damps only while the body presses into it, "so it pushes back without holding on":

```js
function wall(x, v, min, max, body) {
  const kw = body.mass * (TAU * body.wallFreq) ** 2, cw = 2 * 0.9 * Math.sqrt(kw * body.mass);
  if (x < min) return -kw * (x - min) - (v < 0 ? cw * v : 0);
  if (x > max) return -kw * (x - max) - (v > 0 ? cw * v : 0);
  return 0;
}
```

- "Overshoot into an end is caught by the wall. That's the thump of a heavy toggle landing, and it's correct: the thumb can't leave its track."
- "Rubber-banding comes from the same walls. Dragging past an end pulls against the wall, so the body stretches only part of the way. No resistance curve is needed." Dragged past the end, "It rubber-bands about a third of the way, then springs back on release." [feel, references/verify.md]

**Rubber-banding, four ways:** feel uses a wall spring; [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap) a fixed factor (`dragElastic={0.12}`); the Flutter sheet `delta *= 1 / (1 + overshoot * _overdragResistance)` ([flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#spring-bottom-sheet)); animate-expo's `rubberband(overshoot, dimension, constant = 0.55)` ([REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#two-worklets-projection-and-rubber-banding)). Neither wins.

## Magnets, detents and friction

A field is a force that depends on position; a body in one has `target: null` [feel, references/models.md].

**Magnets:** each stop pulls with a weak, long-range spring (the reach) plus a strong one inside `clickRadius` (the click), blended with smoothstep. Defaults `reachFreq` 0.9, `clickFreq` 5.5, `clickRadius` 18 (24 for points in a plane). Strengths scale with `body.mass`, so the feel holds when mass changes [feel, runtime/feel.js]:

```js
const smooth = (e) => (e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e));
const f = (x, v, body) => {
  const d = nearest(x), u = x - d;
  const kFar = body.mass * (TAU * cfg.reachFreq) ** 2, kNear = body.mass * (TAU * cfg.clickFreq) ** 2;
  return -kFar * u - kNear * u * smooth(1 - Math.abs(u) / cfg.clickRadius);
};
```

- "Between two stops the far pulls meet in a ridge, so where a flick ends up depends only on momentum."
- The components map a word's magnet strength `s` to `reachFreq: 0.6 + 0.5 * s, clickFreq: 3 + 4 * s` (strength 0.6 when the words set none).
- **Detents:** "A click radius of a third of the gap between detents feels like a click without grabbing between them."
- **A wheel that turns forever** adds `period: 360`. "355° is then 5° from the stop at 0°, and `rest()` returns the copy of the stop nearest the body, unwrapped (360°, not 0°), so the angle never jumps."

**Friction:** `-level * body.mass * Math.tanh(v / 30)`, a constant deceleration (default `level` 900 px/s²; the components use `700 * friction`) smoothed near zero speed. "It makes things feel sticky or resistant, and it stops a coast sooner than damping alone." `friction2d` "opposes the direction of motion, not each axis on its own." **Gravity** is `g * body.mass`. [feel]

**A force of your own** is `(x, v, body) => force`, in px/s² times mass, with `.rest(x)` if it has resting points and `.kind` so the rig and export know what it is; in a plane, `(x, y, vx, vy, body) => [fx, fy]`. [feel, references/models.md]

## The hand

"A drag never sets x." [feel, references/models.md] `grab`, `move` and `release` attach a hand spring between the pointer and the body, "tuned at 6 Hz for a unit mass". While the hand holds the body, its target spring is off.

```js
// The hand is a spring tuned for a unit mass, so a heavier body lags the finger.
const kh = (TAU * this.handFreq) ** 2 * 1.0, ch = 2 * Math.sqrt(kh * this.mass);
F += kh * (this.hand.x - x) + ch * (this.hand.v - v);
```

- Because `kh` is not scaled by mass, a body of mass m follows the finger at 6/√m Hz. "A heavy body lags the finger. A light body tracks it almost perfectly."
- Pointer velocity is smoothed on each move: `this.hand.v = this.hand.v * 0.35 + vNew * 0.65`.
- "Release keeps the body's own velocity. It doesn't use a velocity estimated from the last two pointer events, so there are no fake flicks."
- **The 60 ms stale-velocity rule:** "A pointer that stopped more than 60 ms before letting go has no velocity left. This matches what the user's hand actually did."

```js
release() {
  if (!this.hand) return this;
  // A pointer that stopped before letting go has no velocity left.
  if (now() - this.hand.t > 60) this.hand.v = 0;
  ...
}
```

**Binding a drag** [feel, runtime/feel.js `drag()`]: primary button only (`e.button !== 0` returns) with `setPointerCapture`; a 4 px slop before a drag starts, measured on the drag's own axis, and a release under it is a tap (`onTap`); `pointercancel` ends like `pointerup`; `touch-action` is `pan-y` for an x drag, `pan-x` for y, `none` otherwise; `user-select: none`, because "A drag that starts on text would otherwise select it". For an angle drag, the pointer's angle around the centre is unwrapped (`d -= 360 * Math.round(d / 360)`), "so crossing ±180° is a small turn".

**Tap slop, three ways:** feel starts a drag at 4 px; Kiem's list rows count a tap "only if `Math.hypot(dx, dy) <= 12` px" ([PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap)); app-ui's boards use "a 5px activation distance (clicks still click)" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md#boards-and-lists-of-the-same-items)). Neither wins.

## Projection: decide on release

A decision on release (which side, which stop) "is made from where the body would coast, `x + v·m/c`, or by simulating forward. It is never made from a threshold in milliseconds." [feel]

```js
// How far it would coast on damping alone: x + v·m/c. A flick decides with this.
projected() { return this.x + (this.v * this.mass) / this.damping; }
```

- **Springs:** "A toggle switches if the projection crosses the middle. A heavy thumb coasts further, so a gentle flick is enough." Let go exactly halfway without moving, and "The spring picks a side from projection (velocity 0, so position decides), and it doesn't stall."
- **Fields:** the field decides by itself. For taps and keys, `kickTo(x)` gives the push that comes to rest at x. "With no field that is the coast formula (Δx·c/m). In a field, magnets pull back, so the push is found by simulating forward": search speeds from 40 up by ×1.18 to 40000 for the smallest that lands, then use ×1.15 of it if that still lands. "Still one impulse; never a timed slide."
- **The coast time is m/c.** For `heavy`, 3/37.66 = 0.080 s, "80 px per 1000 px/s". [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap) projects with a fixed `info.velocity.x * 0.2`, a 0.2 s coast; feel derives the multiplier from the body.

**Release rule, three ways:** feel uses projection only. The Flutter sheet uses a velocity threshold plus a position threshold: "a fling faster than 0.9 sheet heights per second down closes … otherwise it closes when it rests below half its height" ([flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#spring-bottom-sheet)). animate-expo projects with Apple's exponential-decay form and then compares against 40% of the sheet's height ([REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#two-worklets-projection-and-rubber-banding)). Neither wins.

## Craft rules

[feel, SKILL.md]

- **Name the model in one sentence before writing code.** "The thumb is a 3-unit mass on a 1.35 Hz spring with ζ 0.74; the track walls catch the overshoot."
- **A tap is a target change (springs) or an impulse (fields), never a timed slide. A drag sets a hand, not a position.**
- **Everything visual derives from state, not time.** "Fill from position, stretch from speed, shadow from height." Same idea as "Derive, don't schedule" in [TIMING.md](TIMING.md#staggers-and-sequencing).
- **Overshoot belongs to the thing, not the frame.** "If the track ends, a wall catches the thumb. Never let a spring draw a thumb outside its track."
- **Interruptible by construction.** "A grab mid-motion takes over from the current x and v. Never reset velocity on grab, and never queue animations."
- **If a library forces a duration (CSS), the duration is computed from the model, and the code comment says so.**
- **Two failure modes.** "**Tween in disguise.** The code uses a spring but snaps the target on a timer, or reads pointer velocity and throws it away on release. The motion looks springy and feels dead." "**Untuned physics.** It's a real spring, but the numbers were typed until it "looked fine". Physics with arbitrary numbers is just a fancier easing curve."
- **One loop:** all bodies share one `requestAnimationFrame` loop "that stops when everything has settled", and only real motion reports a settle: "waking a body that was already at rest is not a settle". [feel, runtime/feel.js]

## Reduced motion

"When `prefers-reduced-motion: reduce` is set, a released body jumps straight to where it would have rested: the target, or the stop its projection lands in. Dragging still follows the finger." [feel, references/models.md] The loop calls `settleNow()` while the query matches and listens for its `change` event.

**Both ways:** rule 8 in [SKILL.md](SKILL.md) says "Reduce, don't remove: with reduced motion, movement becomes short fades", and [PERFORMANCE.md](PERFORMANCE.md#reduced-motion) makes them 100-150 ms opacity cross-fades. feel jumps to rest with no fade, closer to Argyle's opt-in view recorded in the same section. Neither wins.

## Bake physics into WAAPI keyframes

`Feel.handoff(body, styles)` lets the browser play every free motion: "no JavaScript per frame, and transforms run off the main thread" [feel, runtime/feel.js]. It is a way to hand a release, velocity and all, to the compositor that [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move) says survives a busy main thread.

- When nobody holds the body, it simulates the whole future once at 240 Hz (spring, walls, fields and current velocity) up to an 8 s horizon, then "keeps the fewest samples whose straight lines stay within 0.2 units of the path", Ramer-Douglas-Peucker "measured at equal times, because that is how the browser interpolates keyframes".
- It plays them with `el.animate`, offset `t / duration`; "The duration is the settle time of that path, not a choice." On `finished` it snaps to rest, paints inline and cancels the animations.

```js
const anims = first.map(([el], j) => el.animate(
  frames.map((f, i) => ({ offset: b.keys[i].t / b.duration, ...f[j][1] })),
  { duration: ms, fill: "forwards" }, // ms is the settle time of the simulated path, not a choice
));
```

- **Interrupt without a jump:** a grab or a command reads `anim.currentTime`, interpolates the state from the dense 240 Hz path, paints it inline, then calls `cancel()`. Several commands in one event coalesce into one bake through `queueMicrotask`.
- **A drag runs in JavaScript.** "The hand is an input, so it can't be baked."
- **Custom properties** it animates (a fill, a level) need `@property` with a `<number>` syntax, "or the browser flips them halfway instead of interpolating"; the demo page registers `@property --fd-open { syntax: "<number>"; inherits: true; initial-value: 0; }`. Typed properties are in [modern-css CUSTOM-PROPERTIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CUSTOM-PROPERTIES.md#typed-properties-with-property).
- **Read back where a transform really is:** `new DOMMatrixReadOnly(getComputedStyle(el).transform).m41` (x) or `.m42` (y). For rotation, `atan2(m.b, m.a)` is unwrapped near the body's angle, because "rotate() reads back as a matrix, which only knows the angle mod 360".

**`linear()` replays a step from rest only.** "The CSS `linear()` export replays a step from rest. For a flick or a field in CSS, use `Feel.handoff`." The export samples the exact solution at 49 points over `T = settle × 1.15`: "runs 15% past that so the tail lands. Computed, not a choice." [feel, runtime/feel.js] That limits the `linear()` springs in [TIMING.md](TIMING.md#springs): a pre-generated curve can't carry release velocity.

## Export to Motion and react-spring

"Export if the target stack needs it", and when there is no equivalent, "Say so and ship `runtime/feel.js`." [feel] Write **Motion** (`motion/react`, motion.dev): feel's README, SKILL.md and rig tabs still say "Framer Motion", the library's old name.

- **A spring carries over exactly:** Motion `transition={{ type: "spring", mass, stiffness, damping }}`; react-spring `config: { mass, tension: k, friction: c }`. Motion lists spring `mass`, `stiffness`, `damping` and `velocity` ([motion.dev](https://motion.dev/docs/react-transitions)); react-spring's default config is `{ mass: 1, tension: 170, friction: 26 }` ([react-spring.dev](https://react-spring.dev/docs/advanced/config)).
- **A field to Motion's drag inertia, corrected.** Motion's inertia coasts `power × velocity`: its source sets `let amplitude = power * velocity; const ideal = origin + amplitude;` and decays with `-amplitude * Math.exp(-t / timeConstant)` ([motion-dom inertia.ts](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/inertia.ts)). feel exports `power: 1`, which coasts v px (1000 px for a 1000 px/s flick) where its model coasts `v·m/c`. The matching form is `power: m / c` (seconds) with `timeConstant: 1000 * m / c` (ms), plus `modifyTarget` picking the nearest stop. `bounceStiffness` and `bounceDamping` act only when the value crosses `min` or `max` ("If min or max is set, this affects the stiffness of the bounce spring", [motion.dev](https://motion.dev/docs/react-transitions)), so after `modifyTarget` the motion decays straight into the stop with no spring; feel's comment "then a spring into the nearest stop (the click)" does not hold. It stays an approximation of the field.
- **`timeConstant`'s default:** motion.dev's transitions page says `700`, while the inertia source defaults `timeConstant = 325`. Set it explicitly.
- **A plane to Motion:** inertia picks a target per axis, so it can't choose a 2D stop. Turn momentum off, project on drag end, and spring each axis with its release velocity. feel's `exportPlane` template, its `${…}` placeholders written as names [feel, runtime/feel.js]:

```js
drag
dragMomentum={false}
onDragEnd={(e, { velocity }) => {
  // where it would coast: p + v·m/c
  const at = { x: x.get() + velocity.x * coast, y: y.get() + velocity.y * coast };   // coast = m / c
  const stop = stops.reduce((a, s) => Math.hypot(s.x - at.x, s.y - at.y) < Math.hypot(a.x - at.x, a.y - at.y) ? s : a);
  const spring = { type: "spring", mass, stiffness: kNear, damping: cNear };
  animate(x, stop.x, { ...spring, velocity: velocity.x });
  animate(y, stop.y, { ...spring, velocity: velocity.y });
}}
/* Approximates the field: project the coast, then one spring into the nearest stop. Not the same force law. */
```

- **A detented knob has no Motion equivalent:** "Framer Motion has no rotational drag inertia, so a detented knob has no equivalent." Other targets get the force law as a comment. The SwiftUI and Compose exports are not covered here.

## Four worked components

[feel, components/*.js]

- **Heavy toggle** (a spring with walls): `<button class="ft-switch" role="switch" aria-checked="false"><span class="ft-thumb"></span></button>`; `onRelease: (b, projected) => set(projected > travel / 2)`; a tap toggles; Space and Enter toggle, ArrowRight sets on, ArrowLeft off. Stretch along the motion from speed, "a heavy thumb barely deforms": `1 + Math.min(0.22, Math.abs(b.v) / (2600 * Math.sqrt(b.mass)))`, and `1 / Math.sqrt(stretch)` across. The track fill comes from position through `--ft-fill`; the demo page mixes it as `color-mix(in oklab, #e2e1dd calc((1 - var(--ft-fill)) * 100%), #e8590c)`. [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback) stretches a switch on `:active` with fixed durations instead.
- **Magnetic drawer** (a field, no target): stops are translateY offsets `[0, 170, 330]`, smallest = most open; the handle is `[data-handle]`; ArrowUp and ArrowDown step, Space and Enter and a tap go to the next stop. It sets `--fd-open` (0 closed to 1 open) on the sheet and scrim; the demo scrim is `rgba(16, 16, 20, calc(var(--fd-open, 0) * 0.22))`. "A tap is a push, never a teleport or a timed slide." The native-scroll sheet is in [SHEETS.md](SHEETS.md).
- **Corner card** (a body in a plane, picture-in-picture): four corners clockwise from top-left, `clickRadius` 28, inset 12, `feel: "airy, slightly magnetic"`. Lift from speed: `lift = Math.min(1, b.speed / 3000)`, `scale(1 + 0.05 * lift)`, shadow `0 (4 + 16·lift)px (12 + 28·lift)px` at alpha `0.12 + 0.12·lift`. Arrows pick a corner; Space, Enter and a tap go to the next.
- **Rotary knob** (a body in degrees): `role="slider"`, `aria-valuemin` 0, `aria-valuemax` n − 1, `aria-valuenow` the index, `aria-valuetext` "i+1 of n"; Arrow keys ±1, Home and End. 11 detents over [-135°, 135°], `clickRadius` = gap / 3, ticks as `<i class="fk-tick" style="--a: …deg">`, level in `--fk-level`.
  - **The knob fails WCAG 2.5.7 as shipped.** SC 2.5.7 Dragging Movements (AA): "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging", and "achieving keyboard equivalence for a dragging operation does not automatically meet this success criterion" ([W3C Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)). The knob binds `Feel.drag(el, body, { axis: "angle" })` with no `onTap`, so a pointer can only drag it. Add a single-pointer path (tap a tick, or ± buttons), as in the W3C colour-wheel example: "click or tap another point on the wheel". The toggle, drawer and card pass: a tap toggles, steps or moves to the next corner.

## Prove it

**By hand, one line each on what you saw** [feel, references/verify.md]:

1. Tap: it overshoots by about the measured percentage, and the settle you read off the trace matches the one predicted (both ±2% of the move, walls included).
2. Slow drag: a heavy body lags by a few px, a light one sits under the finger.
3. Hard flick: it travels by momentum; a toggle switches even from a short throw.
4. Flick the wrong way: "A small backwards flick from the far side brings it back. Nothing is decided by where the finger was."
5. Let go exactly halfway, without moving: it picks a side and doesn't stall.
6. Grab mid-motion: no jump, in JavaScript and with the keyframe handoff.
7. Drag past the end: it rubber-bands about a third of the way.
8. "Measured on predicted": the measured line sits on the predicted path. "If they differ, something outside the model is moving the element (a CSS transition, a layout change, a second writer)."
9. Keyboard only reaches every state with the same physics. Reduced motion: released bodies jump to rest, dragging still tracks.
10. In a plane, a diagonal throw goes to the corner it points at; on a dial, the wall catches a turn past the end.
11. "The words still describe it": if you moved a dial far from the word's numbers, "change the words, not just the dial, and say why."

**Deterministic checks** feel's `scripts/audit.mjs` runs, worth copying for any physics code: RK4 stepped at 60 fps stays within 0.05 px of the exact solution over a 100 px step, for every word; energy (`½mv² + ½ku²`) never grows while untouched (passivity); every body settles within 4 s with no NaN; `kickTo` lands on every stop from every other (plane corners 12 of 12, detents one step either way, a wheel across its 360° seam); baked keyframes stay within 0.2 of the path, end exactly at rest and match the 1/60 s loop with drift under 1e-6, with fewer than a quarter as many keyframes as samples.

**Its no-durations scan is not a rule here.** The audit fails a file on any CSS duration, `cubic-bezier(` or `ease-in`/`ease-out`, a `duration:` option, `element.animate` with a duration, a timer that moves something, or `gsap.to(`-style tween calls, unless the line says `computed from`, `settle time of` or `not a choice` (or carries `/* chrome */` for a colour fade). That fails `app-ui`'s motion tokens ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens)) and the GSAP tweens in `landing-page-ui`; use it only on code built on this file's model.
