# Isometric machines that explain an idea

For a film that explains how something works (an algorithm, a protocol, a system, a physical mechanism) by showing a made object whose moving parts do the idea. The canonical toolset is now in [isometric-figures](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/SKILL.md), under `skills/web-ui/isometric-figures/templates/isokit/`. Copy that whole subtree into the film as `isokit/`, preserving its inner layout and all module dependencies. Paths in the table below are relative to that subtree. [isokit, example imports; seek-engine, original ISOMETRIC.md]

| Path | What it is |
|---|---|
| `kit/iso-kit.mjs` | the core: camera, `fitProjection`, solids (`slabOf`, `cylinder`, `extrude`), parts (`knurl`, `coil`, `topTicks`, `radialTicks`, `sideSeam`), face planes (`sideMatrix`, `topMatrix`), SVG emitters and `ISO_CSS` |
| `kit/lathe.mjs`, `kit/tube.mjs` | round parts on any axis (smooth-shaded turned bodies, balls, saddles, ribs and bolt circles that fade) and pipes and cables cut into depth-sortable chunks |
| `kit/audit.mjs` | records each part's shape, measures depth over the configured sampled states, sets painter's keys and checks recorded geometry (`node build.mjs --audit`) |
| `kit/gl.mjs` | WebGL inside the drawing: the isometric camera in GLSL, `glLayer`, and the envelopes `burst` and `settle` |
| `kit/turn.mjs`, `kit/turn-build.mjs`, `kit/turn-audit.mjs` (and `turn-fixed.mjs`, `canvas-painter.mjs`) | the 3D mode: groups that turn, slide, hinge or break free, re-projected and re-shaded every frame, with an orbit audit |
| `scripts/inline-kit.mjs` | the kit, GL and 3D runtimes as source to inline into a page |
| `scripts/lines.mjs` | the line-end check on a built page (every line ends on a stroke, a dot or an outline) |
| `scripts/turn-check.mjs` | 3D checks in the browser: fidelity, order, pops, line ends at many angles, frame timing |
| `scripts/capture.mjs`, `scripts/drive.mjs` | screenshots and scripted sequences of the interactive page (the film uses `render.mjs` instead) |
| `references/` | the kit's manuals: `craft.md` (the look, parts recipes, tones, order, pipes, explodes, screens), `kit.md` (the API), `motion.md`, `webgl.md`, `3d.md`, `verify.md`, `walkthrough.md`. Read `craft.md` before designing, `kit.md` while building, `webgl.md` before any shader, `3d.md` before anything turns |
| `examples/` | eight source figures; the standalone builders use `node examples/<name>/build.mjs` (`--light` for the light theme, `--audit` where the builder implements it): `dial-indicator` (the smallest, ~300 lines), `desk-computer` (a screen in a face plane), `arcade-cabinet` (a cutaway Hero), `raptor-engine` (dense pipework, an explode, a WebGL plume), `ripple-tank` (water and caustics shaders), `turning-dial` (the 3D mode, with `film.js`), and the React source figures `test-rig` and `spot-plate`, whose original TS/React adapters are absent from this bundle |

Open the closest example before starting, in the copied subtree. Build scripts write pages beside themselves; generate those pages in the film workspace, not in the skill folder. The [source prerequisite limits](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/references/kit.md#9-react-components) distinguish the incomplete React examples from the standalone builders. [isokit, example builders and file inventory]

**A real product instead of an invented machine** (an exploded view, a teardown, an anatomy figure or a reveal film of an object the user names or shows): [REAL-OBJECTS.md](REAL-OBJECTS.md). It replaces "invent the object" with "rebuild the real one from its real dimensions": the photo-or-name research, the spec, how each kind of object comes apart, and the product-reveal shot sequence. Every other rule here still applies.

## Ready-made figures

About 50 finished figures already exist as an npm package, `anatomy-figures` (MIT): a turbofan ground run, a watch movement, seasons, a tokamak, a power station, a forge, a glass furnace, and software ideas as machines (hash map, bloom filter, LRU cache, B-tree, binary search, mutex, message queue, rate limiter, TCP handshake, DNS, git merge, merge sort, debounce, gradient descent, sampling temperature, flex-grow, box model). Each is a React component (`import Turbofan from "anatomy-figures/turbofan"`) or a custom element (`anatomy-figures/element/<name>`, then `define()`), themed with `theme` (dark, light, paper, blueprint, sepia) and `--anatomy-*` tokens. When the idea has a figure, start from it instead of drawing a new one.

They are live: each runs its own `requestAnimationFrame` loop, an idle tour and `performance.now()`. To film one, replace the page's clock before it loads (an init script that swaps `requestAnimationFrame`, `performance.now`, `Date.now` and the timers for a virtual clock), and in `seek(t)` step that clock forward one film frame at a time, running the queued frame callbacks at each step. Seeking backwards removes the element, resets the clock to 0, mounts a new one and steps forward again. Drive what a viewer would do (the thrust lever, a key press) by dispatching the same pointer and key events at fixed times. Not yet run here.

## The object is the explanation

Don't draw boxes, arrows and labels. Invent a real, well-made thing whose working *is* the concept, and say in one sentence what moves and what that motion means. Some mappings that work:

| Idea | Object | What moves |
|---|---|---|
| a message queue | a marble run | two hoppers feed one lane; marbles wait behind an escapement until a timer drum takes one |
| an LRU cache | a bookcase with four places | the most recently used book sits at the left; a new one pushes the oldest off the end |
| a bloom filter | a fruit machine | three reels are the three hashes; it pays out only when all three of a word's flags are already up |
| a mutex | a water tank, two pumps and a key | without the key both controllers read the same level and overfill; with it only the key holder reads and runs |
| a TCP handshake | a mail ropeway between two stations | SYN, SYN-ACK, ACK canisters ride the rope; each station's semaphore shows its state |
| sampling temperature | a roulette wheel | pockets as wide as each token's probability; a thermostat knob moves the frets |
| debounce and throttle | a music-box recorder | each click is a pin; two dashpots set their own pins, so you read when each function ran |
| a hash map with collisions | a post-office sorting desk | a coder prints each letter's bucket, the hash mod 8, and files it on top of what is already there |

Two failures, both common: **too abstract** (floating plates, slabs and labelled boxes that read as nothing) and **too flat** (one slab with a few lines, no volume, nothing to find). The cure for both is a recognisable machine built from many small parts that each do something. A reference image gives the finish and the mood, never the object.

## Plan before geometry

1. **Truth first.** Collect the real numbers and behaviour and write them as one small pure model. The motion, the on-screen readout and the narration all read from it, so they can never disagree. A phase word and the number beside it come from the same instant of the same source ("end of stroke" from the model and "85 bar" from a needle lagging behind it is a contradiction on screen).
2. **Invent the object** and write its one sentence.
3. **List the parts, at least 40,** grouped: base (plate, feet, groove, corner screws, label plate, ruler strip), structure (posts, rails, frame, end stops), mechanism (carriage, bushings, springs, plunger, needle), controls (knurled knob, thumb screw, crown) and the subject, the one lit part. Every part sits on another part and has a job. Density comes from structure, not texture.
4. **Plan the world** in units of roughly a millimetre: x and y on the floor, z up (right-handed: x × y = z, or every view is mirrored), plans as rounded rectangles `{ x, y, w, d, r }` and circles. Camera: azimuth 45° (35-60° to show a long side), elevation 30° (higher, about 44°, to look into something open). Fit with `fitProjection(points, W, H, { pad, azimuth })` so the object fills 55-65% of the frame.

Budget honestly: figures built with it take 30-90 minutes for a 40-80 part figure and hours for a dense one. A film shot needs the same care at the moment it is watched, so a 20 s explainer usually carries one machine, not five.

## Drawing rules

- **One camera, no perspective.** Parallel edges stay parallel; that is what makes it read as a drawing of a made thing.
- **Solids, painted back to front.** Every part is filled with the paper colour and drawn in depth order, so the near part hides the far one. No see-through edges, no dashed hidden lines.
- **Four tones by facing plus a lighter top.** The kit's `extrude` assigns them; keep it for anything with height.
- **Tone hierarchy:** base and feet `lo`, structure `mid`, the subject `hi`, grooves `faint`, big soft parts drawn in many segments (a long panel) `mid` or `faint` so they don't read as a cage of edges, minor ticks `lo`, major ticks `mid`, the zero mark `hi`, screws as small dots. **Exactly one part is `lit`:** the one the viewer should watch now. In a film the lit part may change between beats, never two at once (frame-review's one-hero rule).
- **Lines resolve.** Every line ends on a face, another line or a dot: no leader lines, balloons, dimension arrows or labels in the air. A texture (ribs, bolt circles, seams, ticks) ends on a real edge or fades out, never stops mid-surface; ticks hang from a ruler strip's edge; a seam on a box wraps its visible corners (`sideSeam`).
- **No words in the drawing.** Titles, captions and the readout sit around it in the DOM (where smoke can read them). Text the machine itself displays (a counter, a typed line) lives in the plane of its face (`sideMatrix`, `topMatrix`) and fits its window at the widest string it will ever show.
- **Colour only when colour is the subject** (RGB channels, a red error state). A fluid is a tint of the figure's own inks.
- **Two looks.** At 1x it reads as one machine; zoomed 4x every region still has something true to find. A bare face or an empty corner is unfinished. Spend that detail (screw heads, knurls, numerals, stitching, mesh weave, engraving) where the shots go, each piece on a real part.

## Painter's order

- Base first, then everything resting on it; within a level sort by `depthOf(centre, P)`, far before near.
- **Split anything that wraps another part:** a coil around a rod is drawn back half, rod, front half (`coil` returns `back` and `front`); a frame around a carriage is drawn back bars, carriage, front bars.
- A moving part is drawn in the slot where it physically sits. If it passes both in front of and behind the same neighbour during the shot, split the neighbour or limit the move so the order never changes.
- A post through a clamp is two segments, below and above, around the clamp.
- Past a few dozen overlapping parts, hand-tuned order keys fight each other: the kit's `kit/audit.mjs` checks overlaps in the configured recorded shapes and sampled states. A zero audit is necessary, not sufficient; it cannot check unrecorded art or every possible continuous pose. The old line called this proof wherever items overlap. [isokit, references/verify.md; references/3d-checks.md] Use it from the copied `isokit/kit/audit.mjs` (`A.recorder`, `A.settle`, `A.auditOrExit`): record the true shape of everything you draw, never a stand-in that quiets the audit. Round parts come from `lathe.mjs`, pipes and cables from `tube.mjs` (`references/kit.md`, `references/craft-round-parts.md` section 8).

## Into seek(t)

Figures built the kit's way are live pages: a frame loop steps springs, the pointer sets targets, an idle tour plays. A film keeps the drawing and replaces the clock.

- **Build the static art once** as SVG strings (base, structure, everything that never moves) and put it in the page before the first `seek`. Per frame, change only what moves: a moving group's `transform` (`translateAlong(P, [dx, dy, dz])`) and the paths of parts whose shape changes (a compressing `coil`, a turning needle from `lineOnTop`, a swelling slab). One solid costs well under a millisecond to rebuild.
- **Springs in closed form.** Their stepped spring integrator carries state between frames; use the template's `spring`/`track` (one closed-form spring per target change), or precompute the stepped model once at a fixed `dt` into an array indexed by time.
- **The idle tour becomes the shot list**, and pointer moves become targets on beats. The readout and the narration read the same model at the same `t`.
- **Never use `data-flow` or `data-pulse`.** They are CSS animations on their own clock. Drive `stroke-dashoffset` (a flow along a wire) and opacity (a pulsing grid) from `t`.
- **Line weight is in screen pixels** (`vector-effect: non-scaling-stroke`), and the kit's 0.6 px is for a 650 px card: set `--anatomy-weight` to about 1.2-1.6 px at 1080p. The value is in CSS px, so it multiplies with the device pixel ratio: anatomy-reveal's `.62px` on a 540×960 page rendered at DPR 2 is about 1.24 px at 1080×1920.
- **Camera moves stay 2D.** An isometric camera has no perspective, so a push-in or a pan is a scale and translate of the whole drawing (the template's `#world`), and it holds the line weight. Turning the object means re-projecting at a new azimuth every frame: rebuild the moving subject only, keep the rest static, and keep its painter's order valid at every angle.
- **Two ways to build the page.** For a film written in the seek-engine template, import the kit from a module (`import * as k from './isokit/kit/iso-kit.mjs'`) and bundle with `scripts/bundle.mjs`, like the 3D hero. For a figure built the kit's way (a Node `build.mjs` that writes the page, with the audit and the 3D build), keep its build and give it a film script in place of its `live.js`: `examples/turning-dial/film.js` is the pattern (`node build.mjs --film`).
- **3D in a film.** The 3D controller never runs a clock of its own: `TURN.mount(stage, DATA.turn, { follow, onFrame })` once, then `controller.set({ group: value, ... })` inside `seek(t)` with every value a function of `t`. Write each motion as a pure function of time (the turning dial's `tapAt` and `breakAt` already are). WebGL layers draw with `layer.draw(uniforms, t)` from the controller's `onFrame`, so the shader's clock is `t`. Their spring `settle()` steps state: use its closed form, `1 - (1 + t/s)·e^(-t/s)` for `settle(…, s)` from rest. Particles (sparks) fly ballistically from seeded starts, `p0 + v·age - ½g·age²`, never stepped.
- **The film frame.** Put a 1920×1080 `#stage` in the page, move the figure's plate into it scaled to fill the frame (vector art stays sharp), drop the card's frame and its corner labels (figure number, title, pointer hint: web furniture), keep the readout inside the title-safe area, and mark the drawing `data-drawn` so smoke treats engraved numerals hidden behind parts as occlusion, not overlap.
- **Themes are tokens.** `ISO_CSS` defines dark and `[data-theme="light"]`; map the film's `STYLES` onto the `--anatomy-*` tokens so a restyle needs no geometry change. Inject `ISO_CSS` once into a `<style>`.

## Exploded views

An explode earns its place when the parts are the explanation (what feeds what). Move the assemblies the real thing comes apart into, not single solids, each along its real direction (down along the axis for stacked stages, out radially for side units), far enough that its silhouette clears its neighbours. Stagger them so nothing passes through anything in any frame. Every part keeps a home: something bridging two assemblies goes with the one it stays fixed to, and its loose end still lands on a flange or connector of its own. A closed-form explode for the 3D mode, with travel numbers, is in [isokit 3d.md section 7](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/references/3d.md#7-free-groups-parts-that-break-off); the inward and sideways exit cases are in [REAL-OBJECTS.md](REAL-OBJECTS.md). A static, printable exploded, orthographic or section sheet (balloons, leaders, dimensions in paper millimetres) is the [technical-drawing](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/technical-drawing/SKILL.md) skill.

## Effects inside the drawing

Fire, water, glow and lamp light are a WebGL canvas between a back SVG (what the effect covers) and a front SVG (what covers it), built in world space with the same camera, so a flame sits inside the drawing. Every uniform rides an envelope with an attack and a decay, every term reaches zero before any bound or canvas edge, and a phase change is a crossfade driven by the physical quantity. On a light ground, solve for the ink the paper should show; a darkened dark-theme glow reads as dirty smoke. The shader time uniform is `t` (the template's WebGL rule).

## Check

- Stills at 1x and crops at 4x of every junction: the subject, its contacts, every place a texture ends.
- The readout against the picture at several moments: the number on screen and the part's position agree.
- `node build.mjs --audit` ends `audit passed` with every failing line at 0 when the figure has pipes, cables or round parts; `node isokit/scripts/lines.mjs page.html` prints `line ends: 0`.
- The smoke test as usual; the kit's geometry is deterministic, so `nondeterministic` must read 0.

Historical source results, not rerun during this structural maintenance: a carriage on rails against a coil, read by a dial gauge, built with the kit, bundled, rendered through `render.mjs` and smoked (0 runtime errors, pops and nondeterministic frames, the coil and needle rebuilt every frame, a wire's flow driven from `t`); the turning dial as a film (`--film`: 88 parts in 3D, a hinged finger, a pod breaking off, WebGL LED light and sparks) rendered at 1920×1080 with every smoke counter at 0, including nondeterministic with WebGL on; the dial-indicator, turning-dial and raptor-engine standalone examples built from the original subtree, the Raptor's audit passes (267 solids, 80 tubes) and the line check reads 0 floating ends. Not converted to film: the other examples' `live.js` (each runs on its own clock until given a film script like the dial's).
