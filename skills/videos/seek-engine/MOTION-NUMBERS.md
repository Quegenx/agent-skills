# Motion numbers

The model knows what a card entrance is. It does not know this card should take 280 ms and the one behind it should start 60 ms later. Choose from these tables; deviate on purpose, with a reason, never by accident.

## Duration by element class

| Element | Duration | Curve | Overshoot |
|---|---|---|---|
| tooltip | 80-120 ms | out | 5-15% |
| button, toggle | 120-180 ms | out | 5-10% |
| icon | 150-250 ms | out | 5-15% |
| card | 200-350 ms | standard | 3-5% |
| modal, sheet | 300-400 ms | emphasized | 0% |
| page or scene transition | 400-600 ms | standard | 0% |
| dramatic reveal | 600-1200 ms | emphasized | 0-3% |
| error shake | 300-400 ms | inOut | 0%, never a bounce |
| word reveal (mask rise) | ~800 ms | out | 0% |
| typing | ~35 ms per character | linear steps | caret blinks ~2.4 Hz when idle |

## Curves (the template's `EASE`)

A film uses about three of these characters, each with one job. Linear is for spinners, progress bars, drift, clocks and data only.

| Token | cubic-bezier | Job |
|---|---|---|
| out | 0.16, 1, 0.3, 1 | arrivals, reveals, word entrances (never a fade-out) |
| in | 0.7, 0, 0.84, 0 | implosions, hard snaps out |
| exit | 0.55, 0.055, 0.675, 0.19 | exits into a cut: accelerates to the cut frame |
| smooth | 0.65, 0, 0.35, 1 | fades (10-14 frames), drifts, holds |
| inOut | 0.87, 0, 0.13, 1 | whips, lockup slides, morphs |
| ui | 0.4, 0, 0.2, 1 | small UI changes: toggles, chips, rows |
| cam | 0.48, 0.1, 0, 0.9 | camera pushes: slow start, early peak, long settle |
| glide | 0.47, 0.2, 0.15, 1 | 150-350 px element moves with a soft landing |
| rest | 0.45, 0, 0.1, 1 | anything that must end at rest, or start after another move |
| contact | 0.55, 0, 0.9, 0.55 | accelerating into an impact: arrives with velocity, then `squash` |
| whip | 0.6, 0, 0.15, 1 | feature-to-feature whips |
| dolly | 0.35, 0, 0.65, 1 | a slow push through a hold |
| standard | 0.2, 0, 0, 1 | moves between two states |
| emphasized | 0.05, 0.7, 0.1, 1 | hero arrivals, modals |
| overshoot | 0.3, 0, 0, 1.25 | a value that lands (sparingly) |

Material's "emphasized" is a two-segment path, not one cubic-bezier: `emphasized` above approximates it, never claim it exact.

**Vertical rises tick.** Headless Chromium snaps a slow vertical text move to whole pixels, so the tail of an ease-out ticks a pixel every few frames. Finish the translate while it still travels about 1 px a frame: `arrive(p)` completes at 94% of the curve. Use it on the translate, not the opacity.

**Discrete state reads whole frames.** Typed characters, counters, labels and layout switches read `whole(t)`, so every motion-blur sub-frame of one output frame agrees (no doubled carets, no half-typed letters).

## Springs (the template's `SPR`, frequency Hz / damping ratio)

| Feel | f / z | For |
|---|---|---|
| ui | 3.2 / 0.86 | small controls, tiny overshoot |
| shape | 1.9 / 0.82 | a container morphing between states |
| enter | 3.6 / 1 | content arriving, no overshoot |
| exit | 8 / 1 | content leaving, faster than it came |
| cam | 1.1 / 1 | camera: smooth, almost invisible |
| cursor | 2.3 / 1 | pointer travel |
| lead / trail | 3.4 / 0.78 and 1.7 / 0.92 | the two edges of a stretching indicator |
| heavy | 1.2 / 1 | big type, 3D objects, logo lockups |

Springs for things that feel physical (UI, objects); eased tweens for type and camera-like moves. Stiffness/damping/mass and duration/bounce are different parameterisations of the same thing: don't mix them in one file. If everything overshoots, nothing feels precise: overshoot belongs to true landings, at most a couple per film.

**Matching a product built with Motion (framer-motion).** When the site's own components animate with Motion, map its spring parameters into the template's `spring(t, f, z)`: from `{ stiffness: k, damping: c, mass: m }`, `f = sqrt(k / m) / (2π)` Hz and `z = c / (2·sqrt(k·m))`; from `{ visualDuration: d, bounce: b }` with `b ≥ 0`, `f = 1 / (1.2·d)` Hz and `z = max(1 - b, 0.05)` (a negative bounce is overdamped and Motion also slows it, so measure that one). Its defaults: physics `k 100, c 10, m 1` is `f 1.59, z 0.5` (a visible wobble); `visualDuration 0.3, bounce 0.3` is `f 2.78, z 0.7`. Read the numbers from the product's code (`transition={{ type: "spring",... }}`), never guess them; Motion's springs also start with the element's current velocity when interrupted, which a sum of springs from rest approximates. The bundled helper uses the critically damped branch for every `z >= 1`; an overdamped source spring (`z > 1`) therefore needs measured matching rather than a claim of exact reproduction. The old line promised exact reproduction without that limit. [templates/index.html and templates/examples/explainer/index.html, spring; source Motion matching notes]

## Camera and handoffs

- Camera moves ease both ways and run slowest of anything on screen: 0.6-2.4 s, duration growing with distance.
- In-scene drift: 1.0 → 1.04 per scene. The next scene starts at the zoom the last one ended on.
- One camera move at a time; never zoom in and straight back out.
- Shots enter already moving (12-19% of the remaining distance per frame) and leave accelerating or on a blur ramp.

## Fades and floods

- No fade shorter than 0.3 s: a 0.05 s fade reads as an instant pop-in.
- A full-frame colour flood takes ~0.3-0.35 s and overscales past every corner.
- One designed stillness of 0.3-0.75 s before the payoff; a final frame held long enough to register (~1.5-2.5 s on an end card).

## Invariants

- The source gives two entrance/exit heuristics: entrances 30-50% longer than exits, and exits roughly half an entrance on content. Those ratios differ; keep the selected timing explicit rather than treating them as equivalents. The old line combined them in one parenthesis. [Original MOTION-NUMBERS.md, Phrase timing]
- Total stagger stays under 500 ms: words ~90 ms apart, list items 60-250 ms, dots ~60 ms; a dense grid 20-40 ms. With many items, stagger by distance from a focal point (each starts in proportion to its distance), which keeps the same feel at any count.
- The 1/3 rule, twice: no element travels more than about a third of the frame in one unbroken move without a stop or a change of scale or opacity (a long slide reads as "the template moved"); and with three or more elements, no more than about a third of them move at once while the rest hold.
- Distance scales duration: `durFor(px)` = 0.35 s + 1.35 ms per px (200 px ≈ 0.62 s, 600 px ≈ 1.16 s); camera moves `durFor(px, true)`, clamped to 0.6-2.4 s.
- Scale and zoom interpolate in log space (`lmix`), so a zoom feels even.
- A secondary move starts 55-75% into the move it follows, so both settle together without a stall-then-lurch.
- Content inside a morphing container enters after the morph starts (+80 ms) and leaves before the next morph (−120 ms): `swap()`.
- Overlap scenes: the next starts drawing before the last has fully left. A hard gap reads as loading.
- Derive, don't schedule: when several things depend on one value (a slider's position, a progress, an effort level), drive them from that value with a ramp (`band(x, a, b)`: a smoothstep of x between a and b) instead of giving each its own start time; a retime of the value retimes all of them.
- Velocity is information: derive trails, squash and blur from `value(t) − value(t − 1/fps)`, never fake them.
- Readable text moves at most ~3 px per frame while it is being read.
- Direction carries meaning: new content enters from the reading side's end (right or below in left-to-right languages, left in right-to-left ones), going back reverses the entrance, drilling deeper pushes in; things leave through the nearest edge.
- A number counts to its value on an ease-out with no overshoot (an overshooting quantity reads as imprecise), its caption arrives after the count lands, never while it moves, and the final value holds at least 0.5 s.

## One motion language

Write the film's motion language before animating and audit every shot against it: one easing family (one curve for arrivals, one for exits; a third has to justify itself), one base unit that every duration is a multiple of (micro half of it, hero twice it), one transition family between shots, one stagger rhythm, an intensity budget (largest travel, scale range, overshoot in percent) and a hold rule. A shot that breaks it is a direction defect, not a taste call. One wow moment per piece; the hero gets the slowest, most eased move, support yields, texture stays subliminal.

## Every frame has one boss

- **One primary per frame, at most one secondary,** everything else ambient. The eye's pull order is motion, then size, then contrast, then saturation or glow, then position: a small moving thing beats a big still one, which is why ambient life stays tiny. Peak contrast, saturation, the sharpest edges and the glow belong to the focal element; colour weight runs about 60/30/10 (ground, secondary, accent).
- **Rank holds in time too:** the boss enters first and leaves last; support follows 0.3-0.5 s later with less travel (boss 40-60 px, support 20-30 px, ambient 10-15 px) and shorter holds. A tertiary element making the biggest move has stolen the boss's budget.
- **Type sizes on one ratio**, at most three levels a frame: the golden ratio (×1.618) for display-led frames, ×1.25-1.414 when a frame is dense. Two sizes close but different read as a mistake: make them equal or a full step apart. Line height ~1.6 for reading text, 0.95-1.1 for stacked display lines; never the default.
- **The squint test:** shrink a frame to a thumbnail; the boss still wins and the reading order survives.
- **Space:** the optical centre sits at 45-48% of the height, above the mathematical one; one corner-radius system for the whole film (all sharp, all ~12-16 px at 1080p, or all pills, or a stated rule followed without exception); equal gaps read as a group, a bigger gap starts a new thought; an element either respects the margin or bleeds off decisively, never grazes the edge.

## The eye has one path

Draw each scene's gaze path as one stroke: where the last scene left the eye, the chain of focal events, where the next scene picks it up. New things enter where the eye already is or from their own source; successive focal events chain along a line or an arc, never ping-pong between far corners (carry the eye with a travel or a connector instead). At every cut, know where the eye is: the next shot puts its first attractor there (the cut disappears), or moves it on purpose as a jolt on a bar's downbeat, with motion directions agreeing across the cut unless the jolt is the point.

## No device twice unvaried

Keep a ledger of every device in play (each reveal, transition, camera move and supporting element) and check it before reuse. Used twice it is a motif, used everywhere a tic: direction, size and period differ between uses. A full-frame black and white inversion runs at most twice back to back, and by the second it is already showing the next scene. Passing different parameters is not variation unless it reaches the picture: compare frames, not code.

## Boundaries carry the eye

The failure is exit, empty frame, entrance: two edits with a hole between them, between scenes or between lines inside one. The outgoing element converges to a point (or covers the frame) and the incoming grows from that same place; the convergence goes all the way to zero (a collapse that stops at 28% leaves a smudge behind the next line). Exits are done by the elements, in each device's own voice, never by sliding or scaling the whole scene's container (unless the container is the world, a floor giving way). Something of the incoming scene is on screen within ~2 frames of every cut, so staggered entrances never leave a scene's first half-second empty. A transition's shape can stay on as the next scene's anchor.

## The sound's shape is the move's shape

The beat grid says when; the music map (beat-grid's `analyze_audio.py map`) says how. A sharp attack (under ~35 ms: kick, snare, pluck) gets a near-vertical burst, a stiff spring, a smear frame; a soft swell gets a long ramp with no overshoot. Staccato sound gets tight settles and short holds; sustained sound slow settles into idle life that follows its level; when the sound that motivated an element dies, the element's glow and drift decay with it. Bass-led moments carry mass (big moves, full-frame impacts, 2-3 px shake, heavy settles); bright, high-led moments light accents and glints; mid and vocal-led moments give the words the stage. The tier sets density: hero devices only in the loudest sections, holds and idle life in the quiet ones. Kicks drive the primary hits, the snare an echo ~3 frames later at no more than ~60% of the kick's size, the hats tiny life on every second one, never every hat.

## Rest is half the film

40-60% of the runtime is holds (no major event, idle life only), concentrated in the valleys of the energy arc, with the hero devices spent at its peaks. No frame is ever frozen, and most of the film is still at rest: constant events tire the eye and kill comprehension. `frame-review`'s `energy_arc.py` measures it on the render.

A hold is a reading pause, not a waiting one. Idle life (a breath, a drift, grain, a boil) keeps a held frame from freezing but never carries a stretch by itself: in a narrated or launch film, no more than about 3 s passes without a discrete event (a reveal landing, a swap, a highlight, a count, a camera move starting), and each stretch between entry and exit is owned by one route, named in the shot list: staged reveals paid off on the voice's words, a camera move with an intent (wide, travel, arrive), the product's own UI doing something (progress, a count, a highlight stepping), an animated sequence (a card filed, an item dragged), or a cursor whose click causes the next beat. The test: pause at any second; something meaningful is mid-flight, or the frame is a deliberate hold after a payoff. A scene that has finished entering with seconds left is a planning gap: add story, not wobble.

## One element, two moves: overlap the stages

When one element does two things in a row (slides in, then lifts to make room), starting the second on the frame the first lands puts a dead frame in the middle: the corner reads as a stop. Start the second stage when the first is about 61% through (a 39% overlap; 35-45% is the usable band: under ~25% the corner hardens back into a stop, over ~50% the two moves merge into one diagonal), each stage on a steep symmetric ease, `cubic-bezier(.857, 0, .143, 1)`, whose peak speed is about 7 times its average (a gentle ease-in-out overlapped this way is mush). It works between any two properties, in either order: position then scale, scale then rotation, position then tracking. Drive both stages from `t` (one wrapper per stage, each owning one property). The check is a number, not a feeling: sample the element's position every frame across the hand-off; the speed never reaches zero. The same offset works between elements: the next element's entry starts before the current one lands.

**Repositioning a composed group** (a list sliding to make room, a stack shifting) is slow, fast, slow, and no single ease does it: about 10% of the distance in the first 20% of the time on an ease-in, about 65% of the distance in the next 18% at constant speed (the burst, where new content can appear unnoticed), and the last 25% of the distance over the remaining 62% of the time on a strong ease-out. A tail shorter than three times the ramp smacks to a stop: lengthen its time, not its distance.

**A cascade arrives by weight:** each element starts within a frame or two of the previous one settling (a wave, not a queue), gaps shrink across the cascade, heavy anchor words travel further and longer (60-80 px over ~0.18 s) and punctuation snaps (30-48 px over ~0.11 s), all from one direction.

**Every element has a verb.** In the shot list, each element gets the verb it performs (slams, slides, draws, fills, assembles, types on, locks in, drifts), taken from the beat's idea, not from an energy level; an element whose verb you can't name isn't designed yet. A connector (a beam, a rail, a scan line, a drawn underline) names its start element, its end element and its job (revealing, routing, validating, emphasising), or it is decoration and goes.

## Settles and echoes in closed form

- **An inertial settle** after a landing is the arrival velocity fed into a decaying sine: `value + v * amp * Math.sin(2 * Math.PI * f * a) / Math.exp(decay * a)` with `a` the seconds since landing (amp ~0.08, f ~2.5 Hz, decay ~6). Pure in `t`, unlike an engine's carried bounce.
- **An echo** (a trail of copies, a cascade of followers) is the leader's own track read late: copy `i` draws `pos(t - 0.06 * i)` at falling opacity.
- **Jitter that stays put** per element: seed by the element's index (`hash(i)`) and sample a smooth noise of `t`, so each element differs and every render matches.

## Snap, then hold

A change that happens in 1-2 frames and then holds reads as intentional; the same change eased over half a second reads as a slideshow transition. Put the ease on the settle, not the change: pop-ins overshoot with a back ease (s 1.8-2.2) over 0.3-0.4 s, burst lines appear the frame after, and the moment holds. Storybook shots run 0.8-2.7 s; growth (a root, a vine) 0.7-2 s per segment with leaves popping as the tip passes. Repeated things never move in phase, and a looping element starts mid-cycle so frame 0 is not empty.

## Two clocks for hand-drawn films

Acting on twos (`exposure(t, [{ at: 0, on: 2 }])` in the template), fast flights, zooms and anything the camera tracks on ones, reads on a hold. The camera always reads the raw `t`, so it moves smoothly while the drawing steps.

## Weight and character

Small controls snap; large panels settle; the camera moves slowly enough to keep orientation; a headline arrives fast and then holds still long enough to read; a mascot may be playful, on purpose. Before a big move, a small move the other way (anticipation). Don't move every part at once: offset parts' timing (overlap and follow-through) and avoid twinning (two arms, two characters, two items on the same curve at the same moment).

## UI motion that ships in a product

For compositor cost, measured frame budgets and will-change, use [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#move-only-what-the-compositor-can-move); for product reduced motion use [the same owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#reduced-motion). [Original MOTION-NUMBERS.md, UI motion and reduced motion chapters]

## Hits, pulses and contact

`hitPulse(t, attack, tau)` is the one envelope for punches, ticks and beat pulses: a quarter-sine rise over `attack` (2 frames), then an exponential decay with time constant `tau` (5 frames). It peaks 2 frames after its cue, which reads as caused by the sound. A half-sine on a hard window clunks at both ends and peaks late.

| Use | Amplitude on the pulse |
|---|---|
| beat pulse on a held element | scale +2-3% |
| a counter or tick locking | scale +4-6% |
| the payoff hit | scale +8-12%, plus a 1-2 px camera punch |
| a logo landing | scale +3-5%; never a bounce |

**Hit-stop** on a heavy impact (a punch, a slam, a stomp in a pixel or fighting scene): freeze the whole action for 2-4 frames on the contact frame, then resume; pair it with the hit sound and a 1-2 px shake. Use it on the few biggest hits only.

`squash(t)` after an impact: +8% along the contact edge, −10% across it, anchored at the edge that hit, over about 4 frames.

## Measured norms of top launch films

Medians across films from 9 s teasers to 90 s features. The brief and the brand override them; drifting from them should be a decision.

| Norm | Value |
|---|---|
| Shot length | median 1.4-2.2 s; first 6 s about twice as dense as the middle; the shortest shots on the drop |
| Something changes on screen | every ~0.7 s (a cut, a reveal, a camera move or a state change); a frame with nothing changing for over ~1.2 s outside a designed hold reads as dead |
| Energy arc | first peak at 10-25% of the runtime, a lull around 65%, the last and biggest peak around 82% (75-90%), then a calm resolve |
| Text dwell | 0.3-0.55 s per word once settled; at 60 fps hold a line 36 frames plus 6 per word (a 5-word line ≈ 1.1 s) |
| Entry decay | a shot enters already moving, 12-19% of the remaining distance in its first frame, its speed falling ×0.92 per frame |
| Exit growth | an exit accelerates ~×1.14 per frame into the cut |
| Designed stillness | one 0.3-0.75 s pause before the payoff |
| End card | building for 1.5-2 s, then held 1.5-2.5 s |

## Speed limits

- Readable text moves at most ~3 px per frame while it is read; type lands sharp.
- A camera move never exceeds ~2.5% of the frame per frame outside a whip; a whip is cut at its blur peak.
- No element crosses more than ~40% of the frame in a single frame without motion blur (`--sub 8` for these).
- A full-frame flash or flood in under 0.3 s reads as a glitch.
