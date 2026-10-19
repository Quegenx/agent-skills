# 3D: audit, checks, performance and limits

[isokit, references/3d-checks.md] Originally split from [3d.md](3d.md) to keep each file under the size cap. Sections 13 to 16 (the orbit audit, browser checks, performance and known limits)

## 13. The orbit audit

`node build.mjs --audit` runs the kit audit, then `TA.orbitOrExit(T, R, P, options)`, which prints one line per check and ends `turn audit passed` or `turn audit failed: n problems` (exit 1). Only a full run ends `turn audit passed`: a run with `only` ends `turn audit partial: no problems in what ran (n lines skipped by only)`, and a quick one `turn audit quick: no problems in what ran (quick run, undersampled: the full run is the proof)`.

Options: `sweep: { at(x), from, to, frame }` (the turn), `clips: [{ name, at(t), from, to, frame }]` (gestures, the break-apart: every frame at 60 fps), `poses` (extra states), `crowd: [[route, part]…]` (pairs exempt from `crowding`, after you have looked), `cover`, `fittings: [[route, from, to]]` (stretches inside a fitting, exempt from `endon`), `quick` (≈ 10× fewer states, for iteration), `only: ["order", "rigid", "swept", "posed", "routes", "coverage", "continuity", "depth"]` (an unknown name throws), `log`. The example takes `--quick`, `--only=a,b` and `--verbose`. `only` runs these lines: `order` → `unseparated`, `cycles`, `forced`, `swaps`; `routes` → `folds`, `self`, `crowding`, `endon`; `depth` → `depth`, `layers`; the others their own line. `separation` always runs. A line that did not run prints `skipped`.

**Time and how to iterate.** The orbit audit is slow, and its time grows with parts × states. Measured on a 28-part desk fan (one turn, one hinge, one clip): `--quick` 85 s, full 17 minutes. The example scene takes several minutes; budget about 30-40 s per part for a full run. That is past a 10-minute shell timeout, so:
1. Iterate with `--quick --only=…` on the lines you are fixing.
2. `--quick` alone before the final run. It undersamples: it checked 100 halving candidates against 800 in the full run and missed 20 `continuity` failures the full run found.
3. The final full run in the background (`node build.mjs --audit > audit.txt 2>&1 &`), read when it ends. Only that run's `turn audit passed` counts.

| Line | Fails on | Fix |
|---|---|---|
| `separation` | A same-group pair with no plane (margin < −0.08) | Split, a flat, or a flush contact |
| `unseparated` | A cross-group pair interpenetrating while their hulls overlap; a framed plane that a state breaks | Fix the contact or the motion; add the motion to `poses()`. `turn-check --passes` names the pair |
| `cycles` | A cycle among overlapping parts in some state; prints the parts, the state range and the split plane (the cycle edge with the largest margin) | `T.split` that part on that plane |
| `forced` | The runtime had to force a pick | As cycles. `turn-check --passes` names the parts. anatomy-reveal's alternative counts a lone forced pick that looks right at full size as harmless; here it fails |
| `swaps` | Two overlapping parts swap order while overlapping more than 0.25 px² (0.5 px² for a pair built flush, margin under 0.05: at the instant their contact plane is edge-on, the true overlap is a line, and the drawn curves leave a sliver about 0.1 px wide) | Look first: `drive.mjs page.html '[["orbit", "swap.png", θ−0.3, θ+0.2, 0.1, null, 6, [x, y, w, h]]]'` (θ from the line; the region round the pair in CSS px of the plate, at scale 6). Something that appears or vanishes in one step is a drawing bug, not an order bug. Engines before 2026-10-06 drew a round with one `"dome"` end shorter than its radius with a wedge behind its flat end, which vanished when that end went edge-on: copy the current `turn.mjs`. A clean swap with sane order on both sides (`__isoTurn.order`) is a wrong plane: report it with the part pair and θ |
| `layers` | A static item on the wrong side of a live part (ray-cast) | Move it or split it (section 11) |
| `rigid` | Kit clearances, terminals, supports, solid clearances at rest | As in the kit audit. `support loose` on every part of a hinged group: nothing in it touches the parent (the knuckle disc, section 5). `terminal … from X`: the route starts at a port's face, not the mount (the `T.tube` row, section 4). `clearance … × stand.bench`: a bench cable without `touch` (section 11) |
| `swept` | A static shape inside a turn group's swept envelope | Move it out of the cylinder |
| `posed` | Shapes of different groups (and moving live × static) passing through each other in any sampled state | The motion or the geometry |
| `folds`, `self`, `endon` | Live routes at every angle and posed state | Section 5 (bend radius with the pitch range, section 8) |
| `crowding` | A live route's end or bend lands on the outline of a slender solid (a rod, post, stem) at some angle | A line parallel to a turning rod crosses the rod's outline at some angle whatever its offset, so you can't design it out. Look at the angles it names (`["turn", θ]` and a 4× shot), and if it reads as two separate parts, list the pair in `crowd: [["cable.a", "yaw.stem"]]`, or route the line inside the rod. A line that is not parallel: approach across the rod |
| `coverage` | A part's recorded shape covers < 60% of its drawing | Record the true shape |
| `depth` | The ray-cast oracle disagrees with the engine order | Report it |
| `continuity` | Per 0.05°: tone step > 1/16 band, a birth > 2 px², a dot α step > 0.01, a faded α step > 1/32 + 0.005, outline motion over 1.5·ω·Δθ + 0.05 px; and the halving test | A detail that stops: fade it. A part whose outline or face boundary jumps in one step: find the angle with an orbit sheet at 0.1°; on a plain kit primitive it is an engine bug, report it with the part and θ. `--quick` undersamples: only the full run counts |

The halving test re-emits each candidate step at ½, ¼ and ⅛ of itself with exact coordinates, rasterises the frames at 4× (jittered samples on 8 sub-scanlines) and measures the pixels that change owner, weighted by tone. A smooth change halves with the step; a jump doesn't. A step is a discontinuity when it stays above 60% at each halving and is still ≥ 2 tone·px² at ⅛, measured at 4× and again at 16×: a step that fails at 4× fails only if it also fails at 16×. Measured on the page's rounded paths instead, every long edge keeps a floor of about its length × 0.01 px that never shrinks; that floor is what flagged large flat faces before the switch to exact coordinates. Every line has a planted fault that fails it (`3d/engine/plants.mjs` in the build session: a sunk pad, a pinwheel of three tilted sticks, a vertical-plane fibre bend, a tube at 30°, a stopped rib row).

## 14. Browser checks

```sh
node examples/turning-dial/build.mjs --light --verify           # writes turning-dial-verify-light.html
node scripts/turn-check.mjs examples/turning-dial/build.mjs --fidelity
node scripts/turn-check.mjs page-verify.html --order --step 1
node scripts/turn-check.mjs page-verify.html --order --states clip.json
node scripts/turn-check.mjs page.html --pops --no-webgl --step 1 --out shots/pops
node scripts/turn-check.mjs page.html --lines                    # and the dark page
node scripts/turn-check.mjs page.html --passes --states explode.json
node scripts/turn-check.mjs page-film.html --passes --film --fps 60
node scripts/turn-check.mjs page.html --perf --width 1440
node scripts/turn-check.mjs page.html --perf --width 390 --throttle 4
node scripts/turn-bench.mjs examples/turning-dial/build.mjs
node scripts/drive.mjs page.html '[["turn", 37], ["shot", "a.png"], ["orbit", "orbit.png", 0, 345, 15]]'
```
- `--fidelity` (Node): prisms against `k.extrude`/`G.prismOf` (outline, top and faces each ≤ 0.06 px), rounds and lathes against `G.lathe(…, smooth)` (outline ≤ 0.05 px against the kit drawn at 10×, bands ≤ 0.5 px; the line also prints the outline against the kit's own paths, which round to 0.1 px, so 0.08-0.13 px there is expected and not judged), tubes against `tubePieces` (0.05 px), at P′(θ). Control: one prism drawn 2° off must fail.
- `--order`: the recorded shapes in a WebGL z-buffer against the DOM painter's fills, 2×; a live pair with 4+ interior pixels fails. Control: each live layer reversed must give ≥ 1000 px. Static × live mismatches are listed (static recorded shapes are often stand-ins, such as a slab for a plate with a window). `--part name` prints a part's footprint in both images. `--step` sweeps the **first turn group only**, with every other group at rest: a hinge, a slide or a clip needs `--states`.
- `--pops`: first difference (θ → θ + 0.02°, two erosions) and second difference (0.1°, |2b − a − c| > 56, or > 6 on flat pixels, one erosion; a core of 6 px fails). Control: the largest part hidden for one frame. `--out dir` saves the first core's frames. With `--states`, consecutive entries are treated as neighbouring frames and only the first difference runs, so the list must be **one continuous path in steps of about 0.02°**: 529 unrelated yaw × tilt poses gave 404 false failures; a tilt sweep of 1201 states at 0.02° gave 0.
- `--passes`: the runtime's own pass check, beside the orbit audit (which stays the proof). It arms the debug collectors (section 4) and visits every state through the controller, or with `--film` calls `window.seek(n / fps)` over `window.timeline().duration` (60 steps a second by default). It prints each pair that passes through another with its worst margin and where (`A × B  margin −x at state n`), each step with forced picks and their parts, and fails on either. It also fails when `stats()` counts forced or unseparated but the collectors stay empty: the page inlines a kit from before the collectors, so rebuild it. It needs no `--verify` build. An explode path for it is `Array.from({ length: 201 }, (_, i) => ({ root: { R }, ...explodeValues(explode, i / 200) }))` at one view (section 7). From anatomy-reveal's `scan-apart.mjs` and `motion/scan.mjs`, ported to this script's CDP driver.
- `--states file.json`: a list of value objects instead of angles. Write them from the build module, which exports `follow` and the clip functions:
  ```js
  import { writeFileSync } from "node:fs";
  import { follow, nodAt } from "./build.mjs";
  const at = (t) => follow({ yaw: 20 + 30 * t, tilt: nodAt(t) });
  writeFileSync("clip.json", JSON.stringify(Array.from({ length: 241 }, (_, i) => at(i / 60))));
  writeFileSync("tilt-path.json", JSON.stringify(Array.from({ length: 1201 }, (_, i) => follow({ yaw: 30, tilt: -12 + i * 0.02 }))));
  ```
  `clip.json` (every 60 fps frame of the clip) is for `--order`; `tilt-path.json` (one hinge swept at 0.02°) is for `--pops`. Run `--pops` on one path per hinge, at a turn angle where the hinge's parts overlap the most.

## 15. Performance

Measured by `turn-bench` (Node CPU) and `turn-check --perf` (browser, 240 frames at 1.1°).

**What a part costs.** `turn-bench` prints the Node time per part by kind. In prism units (one live prism, about 0.03-0.04 ms per frame on the build machine):

| Kind | Cost | Kind | Cost |
|---|---|---|---|
| `fixed` (vertical rounds, plain balls) | 0.5 | `round` | 2.5-4 |
| `prism` | 1 | `ball` with flats | 8-10 |
| tube chunk | 2-3 | `lathe` | about 25 |

A figure's weight is the sum. A **small figure** weighs up to about 50 (a few dozen parts, mostly prisms and fixed pictures); a **dense** one up to about 230. The desk fan (28 parts: 6 prisms, 7 fixed, 5 tube chunks, 8 rounds, 2 balls with flats) weighs about 65, and measured 1.6-1.9 ms of Node CPU per frame and a 6.0 ms browser task at 1440, so it is over the small-figure line, mostly because of its two balls. The turning dial (88 parts, 42 rounds, one lathe) weighs about 225 and measures 6.4-7.2 ms. A ball with flats is the right part for a domed end with a rim landing on it (section 5), but it costs as much as nine prisms; a plain ball or a vertical round is a fixed picture and nearly free. Times vary by machine and load: compare kinds within one run, and measure your own figure.

| Measure | Budget for a small figure (weight ≤ 50) | Budget for a dense figure (weight ≤ 230) |
|---|---|---|
| Node CPU per frame | ≤ 2 ms | ≤ 7 ms |
| Browser main-thread task at 1440, DPR 2 | ≤ 6 ms | ≤ 13 ms (60 fps) |
| Main thread at 390, DPR 3, 4× CPU | ≤ 16 ms | ≤ 33 ms (30 fps) |
| `data.turn` JSON | | ≤ 250 KB |

Levers, in order:
1. `fixed` for every vertical-axis turned part and every plain sphere (automatic).
2. Planes for every set of lines or text on a face; upright prism tops are one matrix.
3. Small parts sample by device pixels: rings, caps and domes of a part under 30 px round take 12-16 samples, never the large-part minimums.
4. **Framed planes and the relative-pose cache** (automatic): cross-group pairs cost nothing while their groups keep their relative pose (a pure turntable turn), and pairs whose motion the build sampled are framed planes.
5. **Adaptive half rate** (the figure's loop): keep an exponential moving average of `controller.set(...)` time; above 14 ms render the live layers on alternate frames (time-based motion unchanged), below 9 ms every frame again (`stress.mjs`'s loop).
6. **Detail by speed** (opt-in): `controller.set(values, { detail })` with `detail = settle(1 − smoothstep(120, 240, |ω|°/s), 0.25 s)`: faded lines, ribs and dots scale and are skipped below 0.01. Outlines and tones are never reduced.

Authoring rules that keep a figure inside budget: about 150-250 live parts per moving group; small details as `details` (dots, rings, bolts) rather than parts; static clutter as static art; one live layer per independently moving region; tubes chunked at 6 with as few chunks as the bends allow. The measured numbers for the example and the stress scene are in the skill's build notes; a 380-part flexing hand on this machine is a 30 fps figure at 1440 with the half-rate lever, not a 60 fps one.

## 16. Known limits

- Vertical turn axes take the azimuth shortcut; other rotations compose matrices.
- Only convex parts. Concave bodies are convex pieces; ball flats replace rim-on-sphere joints.
- Live tubes obey the fold and end-on rules: there are no swept-tube silhouettes, so turns happen flat or in fittings, and no route spans two moving groups.
- No automatic splitting: a cycle is an audit failure with a suggested plane.
- Flat faces crossfade over ±0.035 of score (about 8° of turn).
- Lathes keep small residual steps where a band changes topology.
- Free groups pair at runtime with their whole layer; dozens of debris pieces cost GJK while they move.
- Phones: the budget aims at 30 fps, not 60, and only a figure inside it gets there. The 380-part stress scene (`examples/turning-dial/stress.mjs`) measured about 20 fps at 1440 and 13-15 fps at 390 with 4× CPU throttle, with the half-rate lever, on a heavily loaded machine. The fixed-camera backend has a canvas painter (`turn-fixed.mjs` with `canvas-painter.mjs`, included by `fixedScript()`); the general `turn.mjs` backend does not implement its `painter` option. The old line said there was no canvas painter. Keep the selected backend and its source closure together. [isokit, kit/turn-fixed.mjs; kit/canvas-painter.mjs; scripts/inline-kit.mjs]

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
