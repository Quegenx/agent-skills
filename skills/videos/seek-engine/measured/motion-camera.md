# Motion: camera, physical bodies and slop tells

[measured corpus, original motion-camera.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

Originally split from [motion.md](motion.md) to keep each file under the size cap. Sections 6 and 7 (camera, physical bodies, pulses and springs) and the slop tells

## 6. Camera

[measured corpus, original motion-camera.md]

### 6.1 One group, not many tweens

[measured corpus, original motion-camera.md]

**R6.1** WHEN you simulate screen use -> DO put the entire UI (card, panels, chips, scrubber, video) in ONE camera group and move that single transform; dot grids/backgrounds stay screen-fixed; cursor, mascot and drag stack live on their own top layer outside the camera and scale with camera scale; screen-fixed headlines are not parented to it; text is never zoomed separately -- *because* one transform reads as a lens, many tweens read as animation (M913, M914, M917, M918, M919, M953, M958).
**R6.2** WHEN you reframe -> DO prove the scale with a fixed texture: a dot grid pitch doubling, the cursor growing, a hairline thickening -- *because* a 2x zoom must read as 2x and not 3x (M931, M914).

### 6.2 The one-frame snap and its tail

[measured corpus, original motion-camera.md]

| Move | Numbers | IDs |
|---|---|---|
| Reveal snap | scale 2.50 -> 1.41 in 1 f (ratio 0.56), y -832 -> -226; then 0.56 s decelerating settle to 1.0; strongest frame of the moment | M913 |
| Reframe snap | 1.469 -> 1.137 in 1 f (ratio 0.77), fast ease-out to canonical by 0.32 s, regrow to ~1.13x over 0.36 s | M914 |
| Stepped zoom mid-typing | 1.0 -> 2.46x in ONE frame; peripherals step to 0.65-1 px blur and 0.4-0.5 opacity in the same frame | M923 |
| Push burst | 1.064 -> 1.299 over 2 f (-82 -> -389 px), decays to 1.368 by 0.4 s, 0.6 s hold with under 1 px creep | M913 |
| Hard scale cut | 0.037 W -> 0.136 W (3.7x) in one frame, background keeps its own scale | M964 |
| Hard scale cut + content jump | scale x0.42 and a multi-word tail appears in the SAME frame, then x3.86 | M949 |
| Discontinuous camera jump | button 0.04 W -> 0.27 W after an ease-in push, then pushes on to 0.31 W | M956 |
| 50% double-exposed frame, then 2.33x close-up | no zoom tween | M943 |

**R6.3** WHEN the camera should reveal or reframe -> DO one-frame snap (ratio 0.56-0.77) followed by a 0.3-0.6 s decelerating tail (`softLand`, 9-18 f); never one global ease-out zoom; sometimes fire the snap on a trigger (the last checklist tick releases the pull-back 0.40 s later, M913) -- *because* the jump has the punch of a cut, the tail lets the frame be read (M913, M914, M923).

### 6.3 Pans and parallax

[measured corpus, original motion-camera.md]

**R6.4 Two pushes.** WHEN a pan crosses the scene -> DO build it as two pushes with different accelerations, never one ease: push 1 fast at frame 0 (x 1.09 -> 0.87 in 0.25 s, -> 0.78 at 0.79 s), slow drift 0.78 -> 0.74 to 1.08 s, push 2 accelerating to a peak 0.025 W/f at 1.54-1.63 s, settling by 2.08 s; or fast/slow/fast/slow zoom speeds that never hold (M918) -- *because* a single ease reads as a keyframe, two pushes read as an operator (M966, M918, M917 exponential decay tau 0.36 s).
**R6.5 Parallax.** WHEN layers pan -> DO run them on separate tracks at **2-2.4x** speed ratios (tiles > diagram > orb: diagram peaks 0.05-0.06 W/f vs orb 0.025), stagger the exits (text clipped at 1.54 s, grid at 1.92 s), and let some layers not scale at all (tile field keeps its own scale during a 3.7x cut; the unit label travels 4x less than the timer) -- *because* depth comes from speed difference (M966, M964, M957 stars ~0.07 H/f, M936).
**R6.6 One shared track.** WHEN you pan a wide timeline or list -> DO run every part (sidebar, ruler, blocks) on one track, peak ~126 px/f, ~2.9 frame widths, long tail, no zoom, clipped by a fixed left gutter of 0.03 W -- *because* a rigid track reads as camera, growing bars read as charts (M940).
**R6.7 Accelerating scroll.** WHEN a long log scrolls past as proof of volume -> DO accelerate from ~6 px/f to ~250 px/f (0.35 H per frame) over ~1.8 s, no blur, let the viewport run empty at the end, decelerate over 9 f onto one readable block and hold it 0.8 s (M939).
**R6.8 Slow-in, fast-middle, long-tail.** WHEN a card/panel carries the camera settle -> DO 27% of travel in the first 0.46 s, 42% in 3 f, the last 25% over a 0.7 s tail with scale 1 -> 0.6, no overshoot, leaving 0.20 W of the edge on screen (M933); for a lateral card swap 0.5 -> 0.19 -> 0.12 W with 84% by 4 f (M913).

### 6.4 Whips

[measured corpus, original motion-camera.md]

MEAS (207 whip-sized moves, <= 14 f and >= 300 px or >= 0.25 scale, in 37 moments): median **8 f**, 68% decelerate (entry whips 79% ease-out), 24% accelerate (mostly exits), peak speed at t = 0.25; 159 are entries, 32 exits. Peak per-frame displacement ~13% W (M934: 12.9% W/f at its peak; 27% of travel over 10 f of ease-in, then 31% in 2 f and 49% in 4 f, then a 15-f tail).

**R6.9** WHEN the camera whips between regions -> DO give it 3-5 f of travel around the peak (entry: `whip`, 7-8 f; departing half: `accelExit`), with the cut landing at peak speed and the new content starting along the same vector -- *because* motion continues in the viewer's head across the cut (M934, M931, M916, M919).
**R6.10 Blur-matched.** WHEN the film uses smear -> DO ramp blur and smear on the last 3 f of the old view (text 8-20 px, ~100 px smear, up to 140 px), cut with a one-frame discontinuity into a view that is already blurred (button as a smeared pill, 2x scale swap) and resolve over ~8 f; in a crisp film do not blur, change the content during the whip (panel, logo and link lines exit with the pan) (M931, M937, M934).
**R6.11 Content in the whip.** WHEN a whip exits one thing and enters another -> DO have an anchor ride the pan (cursor, bead, card), size constant (a pan is not a zoom: badge size constant, M934) -- *because* the eye needs a carrier through a fast move (M922, M934).

### 6.5 Push and pull multipliers (MEAS)

[measured corpus, original motion-camera.md]

| Group | n | Multiplier p25 / **median** / p75 / p90 | Duration median | Ease |
|---|---|---|---|---|
| all pushes | 256 | 1.19 / **1.46** / 2.0 / 4.0 | 10 f (p25-75 6-22) | 48% out, 31% in |
| all pulls | 280 | 1.15 / **1.32** / 1.72 / 3.7 | 13 f | 50% out, 31% in |
| camera-wrapper pushes | 21 | 1.17 / **1.63** / 2.0 / 4.3 | 18 f | 52% out, 24% in |
| camera-wrapper pulls | 21 | 1.15 / **1.82** / 3.3 / 4.4 | 17 f | **62% in**, 29% out |

By length: punch <= 6 f -> 1.26x median; short 7-18 f -> 1.39x; medium 19-45 f -> 1.52x; long drift 46+ f -> 2.4x (p75 5.6x). 84% of moments contain a >= 1.5x scale move; the largest per moment has median 4x (includes scale-ins from small).

**R6.12** WHEN you size a camera move -> DO read the multiplier off the duration: 1.25x for a 6-f punch, 1.4x for 12-18 f, 1.5x for 20-45 f, 2.4x only for slow drifts; for a reveal pull go 1.8x with an ease-in; the per-moment hero scale move is ~4x -- *because* these are the measured pairings (MEAS).

### 6.6 Dive zoom, constant octave rate

[measured corpus, original motion-camera.md]

**R6.13** WHEN the camera dives from a brand into the product -> DO scale from frame 0 with no hold at a constant octave rate: 1, 1.02, 1.15, 1.46, 2.28, 4.52, 8.98, 14.67, 21.9 at 0/.067/.133/.2/.267/.333/.4/.467/.533 s, i.e. x1.5-2 per 2 f@30 (per 4 f@60), accelerating 0.4 s then decelerating to ~1.1 s; implement by interpolating log(scale) (`scale = exp(lerp(0, ln 21.9, e))`); translate toward a feature of the logo (the underscore) not the centre so it exits the frame edge; let that feature become a near-full-frame mass, fade it in place in 3 f, show 3 blank frames, then zoom a container OUT to rest (0.05/0.98 -> 0.25/0.78 over 0.62 s, stroke 10 -> 4 px) -- *because* the logo is felt to contain the product (M974). Use vector or oversampled sources; a 22x raster zoom softens.

### 6.7 Camera micro-drift

[measured corpus, original motion-camera.md]

**R6.14** WHEN the camera appears to hold -> DO choose a drift from the measured examples: grid drift 0.02 W per 2.9 s, scrubber 0.9 px/f, slow right drift 0.027 W/s, slow shrink 1.0 -> 0.82 per 0.6 s, badge growth 120 -> 208 px over 3 s (M934), title row -0.01 W per 0.44 s; where the camera must be still, move something else (M913, M914, M923, M934, M936, M964). These examples are not a universal minimum speed; frame size and fps determine pixel travel per frame.
**R6.15** WHEN the camera ends a moment -> DO end it still accelerating with no settle (pan ends hard at 0.39 -> 0.31 W, M913; accelerating roll to -76 deg with 22 px smear, M944; accelerating card up to the last frame, M924).

---

## 7. Physical bodies, pulses and springs

[measured corpus, original motion-camera.md]

**R7.1 Bodies.** WHEN several shapes leave or arrive as "physical" -> DO simulate each as its own body (own path, rotation, one small bounce 0.03 H, slight rotation overshoot -95 -> -90 deg), bring at least one in late (0.60 s) so the choreography is not uniform, settle the pile by 1.8-2.2 s and HOLD 0.8-1.0 s motionless as the weight beat, then bring the next idea; shapes pass behind words without covering ink -- *because* a group translation reads as a slide, individual bodies read as consequence (M938).
**R7.2 Pulses.** WHEN something is pressed -> DO an asymmetric press/release: fast squeeze (cursor 2 f to 0.71-0.9; button to 0.76-0.80 over 11-13 f@60 = 0.2 s), slower release (19 f@60 = 0.32 s, or a +5% rebound, 1.055), the target reacts 0-1 f after the cursor (button 0.63-0.80, arrow 0.75, avatar 0.77, card 0.97), the 391 raw pop-and-return pulses in MEAS run median 23 f total (0.77 s). Compression reference: arrow/avatar 71-77%, button 97% (close-up) to 63-80%, cursor close-up 88%, cursor body 0.81-0.92. Brightening of the target (#4C4DF5 -> #7FA7F5) beats a ripple ring. NEVER a ripple ring or white flash as the default (M914, M919, M922, M931, M953, M956, M959, M939-M946).
**R7.3 Springs.** WHEN you add overshoot -> DO keep leans to R1.10 and spend the visible spring once per film (R1.11). popOver for the lean, bounceHard (peak 1.48 at 0.62, 22 f) only for a ty drop or scale pop in a film that is otherwise ease-out (MEAS 1.5% of moves; M948, M957, M973).
**R7.4 Anticipation.** WHEN a move needs wind-up -> DO use a 3-f drift opposite to travel (+196 -> +234 px before sliding left), or a 0.1 s still before a press (hand stops 0.10 s, violet shadow grows 0.1 s before the burst) -- *because* wind-up makes the next move read as intended; only 5% of moves carry it, so use it on the key one (M929, M930, M943).
**R7.5 Stepped-then-smooth objects.** WHEN a hand-posed thing meets smooth motion -> DO keep it on its own clock (R5.1) and let a physical bit (tail, loop, ring) exit as new motion (M933, M934).

---

## Slop tells for this topic

[measured corpus, original motion-camera.md]

| An AI default would | Do instead |
|---|---|
| Use one ease (`power2.out`, 0.6 s) on every tween | Pick per role from the 12 eases: softLand 12 f, glide 10 f, cruise 6 f fades, accelExit 13 f exits; CTA moves 6 f |
| Fade every element in with opacity 0 -> 1 over 0.5 s | Move it: offset/scale/blur decaying over 12 f, opacity only as a 4-6 f helper; hard-cut 16% of entries |
| Ease-out everything including exits | Landing 58% out; leaving 37% in; scale and blur exits accelerate; exit across the frame ends at peak speed |
| Bounce every pop (back.out(1.7)) | Overshoot on < 9% of moves, late lean (popOver), once per film as a payoff spring; CTA/proof ~5% |
| Constant stagger (0.1 s for all) | 1-3 f uneven gaps overlapping at ~0.5 of the move; CTA 8 f |
| Grow a logo from scale 0 and fade | Start 1.4-5x and scale DOWN, with excess halving every 2 f; `snapSettle` 18-30 f |
| Smooth global zoom-in | One-frame snap 0.56-0.77x + 0.3-0.6 s tail; two-push pans; hard scale cut; constant-octave dive |
| Blur everything the same 20 px or smear on some beats and not others | One blur grammar per film: per-element smear on frame 1 of fast moves decaying over 3 f, OR crisp steps, OR render-time shutter blur (R4.8); backdrop blur capped ~11 px |
| Hold a settled frame for 1-2 s | No dead frame: one living thing (a measured drift, a creep, a sweep, moving light) on every hold; a designed breath of 0.6-1.5 s only before a payoff; only the payoff holds still, < 1 s |
| Drive every film toward "motion on 99% of frames" and constant energy | That figure is for 3-7 s moments; human whole films run a mean motion median 6.8 (IQR 4.4-9.8) and breathe; use the band as a question, not a dial |
| Start big on every logo, word and cursor in every film | Arrival decelerates from oversize, once; spend scale once and let the ending get smaller (R3.6b) |
| Press with ripple ring and glow | 2-6 f squeeze to 0.75, target reacts 0-1 f later, brightens, slower release; no ring |
| Mix 24, 30 and 12 fps motion in one beat | One clock per moment; on-twos quantised to even frames; drawn things at 12 fps on a smooth world |
| Move every part with its own tween | One camera group; cursor on its own layer; text never zoomed alone |
| Treat a whip as a fast ease | 8-f whip, peak speed at t 0.25, cut at peak, blur-matched both sides (or content changes inside it in a crisp film) |

## Prove it

[measured corpus, original motion-camera.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
