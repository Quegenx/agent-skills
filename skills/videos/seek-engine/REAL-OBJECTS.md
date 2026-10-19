# Real objects: a product rebuilt from its own dimensions

For an exploded view, a teardown or dissection drawing, an anatomy figure, or a product reveal of a physical object the user names or shows: a phone, a kettle, a shoe, a chair, a guitar, a watch, a perfume bottle, even a fruit. It is the second mode of [ISOMETRIC.md](ISOMETRIC.md). There the object is invented to explain an idea; here the object is the subject, so "invent the object" becomes "rebuild the real one, part by part, from its real dimensions", and its real finishes carry the colour ("colour only when colour is the subject": here it is). Every other rule there (drawing rules, painter's order, into `seek(t)`, the 3D mode in `templates/isokit/references/3d.md`) still holds.

The object is never a stock 3D model or a traced picture. Every panel, screw, dial, glass element and board is its own convex solid in the kit's 3D mode, so the same model turns through any angle, comes apart and drives the whole film.

The method and the tables below come from the anatomy-reveal skill by Ann Nguyen (MIT, licence in [LICENSE-anatomy-reveal.txt](LICENSE-anatomy-reveal.txt)). Where its film rules differ from ours, ours stay and its choice is noted as "anatomy-reveal's alternative".

## Facts first: from a photo or a name to a spec

The figure and the film are only as good as the facts behind them. Spend the first part of the job here and write the result down before any geometry.

**A. The user shows a photo.**
1. **Read the picture, region by region.** Outline and proportions (measure ratios in pixels), every visible part and how it meets its neighbours, materials (anodised, painted, polished, rubber, fabric, glass), colours, surface decoration, text and markings, and controls, ports, seams and screws.
2. **Several images** (front, side, back) show the depth and the hidden faces. Record what no image shows; obtain documentation or another view, omit it, or explicitly label it illustrative. Anatomy-reveal's source alternative infers hidden construction; our [evidence record](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/technical-drawing/SKILL.md#1-read-the-object-and-the-reference-separately) keeps unsupported internals out of factual geometry. [annnguyentt/anatomy-reveal-skill, SKILL.md; existing technical-drawing evidence policy]
3. **Identify it if you can.** If it is a known product (even a customised one), look up its real dimensions and internals as in case B. The photo then decides finish and decoration; the research decides size and structure.
4. **Otherwise, scale from a known feature.** A USB-C port is 8.4 mm wide, a portafilter basket 58 mm across, a camera lens mount about 60 mm across, a phone about 72 mm wide. State the assumption.
5. **Nothing from the photo is used as imagery.** No tracing, no texture, no embedded bitmap, no sampled pixels: every shape, colour and ornament is rebuilt as geometry (ISOMETRIC.md: "A reference image gives the finish and the mood, never the object").

**B. The user only names it.**
1. **Pin down the exact object.** Expand the name to model, generation and variant. If it is ambiguous, choose the most common one and say so.
2. **Collect the numbers:** overall width, height and depth; the main sub-dimensions (a lens's diameter and length, a cup's outline, a screen's diagonal and bezel, a strap's width); the counts of buttons, dials, ports, screws and vents. Manufacturer spec sheets are best, then reviews with measurements, then teardowns. The web-research skill covers the search itself.
3. **Collect the behaviour:** what turns, slides, opens, folds, detaches, lights up. One or two of these become the film's feature beat.
4. **Collect the inside:** teardowns list the boards, chips, batteries, drivers, sensors and how the shell comes apart. That order becomes the explode order.
5. **No web access:** use the supplied evidence, request missing dimensions, omit unsupported parts or label an illustrative assumption. Anatomy-reveal's source alternative says to use what you know and mark estimates; do not turn remembered dimensions into verified facts. [annnguyentt/anatomy-reveal-skill, SKILL.md; existing technical-drawing evidence policy]

**The spec.** A few lines before any code, in this shape (anatomy-reveal's worked example):

```
Object: dual-boiler espresso machine with a built-in conical burr grinder (brushed steel)
Size: 380 × 415 × 470 mm with the hopper; control head 94 mm deep; group head 80 mm across
Materials: brushed steel shell, chrome knobs and trim, smoked glass hopper, rubber grips, glass tank
Moves: portafilter twists 30° to unlock and drops; gauge needle rises; knobs turn
Inside: coffee boiler, steam boiler, vibration pump, solenoid valve, grinder motor, control board
Parts (≈80): shell 7 · cheeks 2 · head, badge, gauge ×3, knobs ×3 (skirt, body), buttons ×5 · group, portafilter ×7
  · tray, grille, glass ×5, wand ×5 · hopper ×7 · tools ×5 · tank ×2 · boilers ×6, pump ×3, valve ×3, motor ×2, board ×7
Film features: hopper and gauge in macro (needle rises), steam knob turns, portafilter unlocks and back
```

Show the spec to the user when it rests on guesses: a wrong size or a missing button is cheap to fix now and expensive later. It is the "truth first" model of ISOMETRIC.md for a product.

**Markings.** Label parts generically by default (SoC, crown, battery). A maker's logo appears only when the user asks for it, and then from the real file through asset-prep, never redrawn by hand. Anatomy-reveal's alternative: no supplied image at all in the figure, so a requested logo is redrawn as face-plane geometry.

## How it comes apart

Ask what the object is made of and how it would come apart on a bench. That order is the explode.

| Kind | What comes apart | What moves in the feature beat |
|---|---|---|
| Electronics (phones, cameras, speakers, consoles) | Shell panels, screen stack, boards, battery, buttons, screws | A door, a card, a dial, a button, a stand |
| Kitchenware (kettle, teapot, mixer, coffee maker) | Body, lid, handle, spout, base, element, gaskets; for an espresso machine: hopper, top, control head, side panels, boilers, pump, grinder motor | The lid lifts, a switch flips, a jug slides off its base |
| Footwear and bags | Outsole, midsole, insole, upper panels, tongue, laces, eyelets, zips | Laces loosen, a strap opens, a zip pull runs |
| Furniture (chair, lamp, table, shelf) | Legs, rails, seat, back, joints, fittings, shade, bulb | A lamp arm folds, a drawer slides, a seat tilts |
| Instruments (guitar, trumpet, keyboard) | Body, neck, frets, pickups, bridge, tuners; tubes, valves, slides | A tuner turns, a valve presses, a key goes down |
| Tools (drill, wrench, scissors, knife) | Housing halves, motor, gears, chuck, battery, blades, pivot | The chuck turns, the blades open, the trigger moves |
| Toys and figures | Shell halves, limbs on pins, joints, mechanism | A limb swings, wheels turn |
| Vehicles (bike, scooter, car, plane) | Frame or body, wheels, suspension, drivetrain, seat, controls | Wheels turn, a door or the steering moves |
| Jewellery and watches | Case, bezel, crystal, dial, hands, movement, crown, strap or links | The crown turns, the bezel clicks, the clasp opens |
| Packaging (bottle, perfume, can, box) | Cap, pump, collar, body, label band, insert | The cap twists off, the box lid lifts |
| Natural things (fruit, flower, shell, seed) | Layers from the outside in: skin, flesh, core, seeds; petals, sepals, stamens | It splits along its natural seams, petals open |

For something without an inside (a solid ornament, a coin), the anatomy is its layers of manufacture: base form, inlays, plating, engraving, stand.

**The feature beat.** Pick the one movement a person does with the object most: open, twist, press, fold, pour, lace, wind. Build it as a `hinge`, `turn` or `slide` group. Objects with no moving part can use the explode as their feature, or a slow orbit of a detail.

## Shapes from convex parts

The 3D mode draws convex parts only (3d.md section 5). Everything else is built from them:

| Shape | Build it as |
|---|---|
| Box, panel, slab | `prismX/Y/Z` of a rounded polygon. Clip a big outline with half-planes to get a rim round an opening. |
| Cylinder, disc, cone, button, dial | `round` on any axis; `details.ribs` for knurls, `seams` for bands. |
| Turned body (bottle, vase, kettle, lens, bell) | A stack of `round` frustums with `r: [r0, r1]` (one per profile segment, flush), or `T.lathe` for one convex smooth body. Make 8-14 bands so the outline reads as a curve. |
| Sphere, dome, bulb, fruit | `T.ball`, with a flat where it sits on something. A lens cap is a large sphere cut by one flat. |
| Arch, ring, handle, frame tube | A chain of wedge prisms sharing their joint planes. A torus is wedges round a circle. |
| Bent tube, cable, spout, strap | `T.tube` along a route with gentle bends, or a chain of short rounds joined by small balls at the bends. |
| Organic, sculpted forms (shoe upper, grip, saddle, body panel) | Several convex pieces that meet flush, each a stretch of the surface: think of the seams a maker would cut. Rounded corners hide the facets. |
| Soft goods (fabric, cushions, laces) | Thick convex slabs with generous rounding, plus texture planes (knit hatching, stitching dashes). Laces are chains of thin rounds. |
| Thin flat things (labels, paper, film, leaves, petals) | Prisms 0.3-1 mm thick, or a plane drawn on a host part. |
| Text, logos, dials, screens, ornament | `T.plane` SVG on the face. Ornament can also have raised convex pieces. |
| Holes, grilles, vents, throats | A solid face with a dark drawing on it. |

- **Hollow shells.** Anything that must come out cannot sit inside a solid. Build housings as dishes: a face plate, a rim in pieces round an opening, and a closing plate. The inner parts then sit in the cavity with clearance.
- **Parts meet flush or with a gap, never sunk in.** A button on a base starts at the base's top.
- **Parallel neighbours keep about 1.5 mm of gap:** GJK samples round parts as polygons.

**Scale.**
- **Small objects** (a ring, an earbud): build them at real size. The scene radius sets the fit, and macros zoom to 8x without losing line quality.
- **Large objects** (a car, a piano, a building): build at real size in millimetres, but group detail at the scale the film shows. Use a few hundred parts at most. Spend the detail on the two or three regions the macro shots visit, and keep the rest as clean large parts.
- **Sets or pairs** (earbuds in a case, a pair of shoes): one root group holding both, each its own sub-assembly.

**Size it before building.** Anatomy-reveal sizes a product as a "Hero": 100-150 parts, about 2-4 hours for the object and about 1 hour for the film (its espresso machine has 82 parts, builds in about 1 s and draws in 5-10 ms a frame). Rounds cost about three prisms each and a ball with flats about nine: weigh the figure against 3d-checks.md section 15 and measure it. Tell the user the size, then build, with the object rendering early and deepened from there.

## Building it in the 3D mode

Build it the kit's way (a Node `build.mjs` that writes the page, with the audit and the 3D build) and drive it with a film script, as [the canonical turning-dial example](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/examples/turning-dial/build.mjs) does (ISOMETRIC.md, "Two ways to build the page").

**Frame and units.**
- **World units are real millimetres.**
- **The local frame is right-handed:** x is the object's right (as worn, held or faced); y is its front, the face that points at the viewer at yaw 0; z is up. Check that x × y = z: a left-handed frame mirrors every view.
- **The root group** is `T.group("root", { free: { origin } })`, with its origin at the object's visual centre so tumbles turn about the middle.
- **The scene fits a sphere** of radius about 0.8 × the object's largest dimension: fit the projection to that sphere's bounding box (`k.fitProjection(k.boxCorners(box, -radius, radius), W, H, { pad, azimuth: 45, elevation: 30 })` in anatomy-reveal, with `box = { x: -radius, y: -radius, w: 2 * radius, d: 2 * radius, r: 0 }`).

**Tumble and explode.** One free root turned by `orient(yaw, pitch, roll)`, one `slide` group per assembly, and one value, `apart` (0 to 1), driving them all through `explodeValues()`, a closed-form staggered smoothstep, so any frame seeks with no state: the code, the travel numbers and the `poses()` that prove it are in 3d.md section 7, "The whole object". Pass `basis: A.cameraBasis(P)` and the `explode` list in the page's `DATA`; inside `seek(t)`, `controller.set({ root: { R: orient(yaw, pitch, roll) }, ...explodeValues(DATA.explode, apart), ...features })`, every value a function of `t`. Yaw turns about the screen vertical (0 = the front faces the viewer, 90 = its right does), pitch is positive seen from above, roll is about the view axis.

**Coming apart cleanly.**
- **Along any exit direction, the part in front leads.** If A sits in front of B along the direction they both move, A starts earlier (a smaller `delay`) and travels further.
- **Moving toward the centre:** parts that move toward the middle (two cushions facing each other) need their parent to move out first, or they meet.
- **Sideways exits:** a part leaving sideways must clear its neighbour's swept volume. A door's hinge sweeps a slab beside it, so whatever slides out through that door sits outside that slab.
- **Read the explode at the film's own angle:** a long object fans out along its axis; a column needs most of the travel along z, with the view pitched 20-30°.
- **Prove it** with the orbit audit (3d-checks.md section 13) and the quick pass check, `turn-check --passes`, over the explode from five views (front, back, top, below, side; anatomy-reveal uses yaw/pitch -35/15, 0/5, 140/20, 90/-20, -20/70) and over the finished film (`--passes --film`; 3d-checks.md section 14). Fix every `unseparated` with timing or geometry, and every `forced` as a cycle (anatomy-reveal's alternative, a lone forced pick counted as harmless, is noted in 3d-checks.md section 13).

**Markings and decoration.**
- **Text, ticks, screens, grilles, engraving and inlay** are `T.plane({ part, o, u, v, svg, normal })`. `u` is the drawing's right and `v` its down, **seen from outside the face**. Always pass `normal`. The kit sets the font on `.iso-face-text`, so a face font goes in `style="font-family:…"`.
- **Engraving, filigree, print, patterns:** redraw them as geometry: smooth SVG paths in the plane of the face, plus a few raised convex pieces for relief. Build scrolls from spirals, tapered ribbons and leaves as convex lenses, and test raised pieces against each other in the face plane so they never overlap. Each raised piece sits in an assembly so it can lift off.
- **Fine textures** (knit, stipple, knurl) are thin `iso-line` paths in a plane. Ribs and knurls on rounds use `details.ribs`.

**Anchors and features.** `anchors` are named local points the camera centres on: `body`, each face, each control, each feature. Add one for every shot. `features` is a list of extra group values (a swivel at several angles, a crown turned, a cushion off) that go into `poses()`, so the order is proved in those states too. Map each feature's channel onto its groups in `follow`, as the turning dial's `lift` drives its finger hinges.

## The look

- **Paper.** Warm white paper in the kit's light theme: dark ink outlines over four-tone fills. Anatomy-reveal's recipe: a base of `#f1ece2`; fine grain and long fibres from SVG `feTurbulence` tiles; a slow mottling; a soft lighter patch where the object is, following it (`[x, y, r]` as fractions of the frame); a faint warm vignette. Build it under our rules: turbulence rects with an explicit `fill` (TECHNIQUES.md, procedural paper), the patch and the vignette as baked PNGs from `scripts/gradient.py --radial`, moved per frame, never CSS gradients (SKILL.md, Looks). Anatomy-reveal's alternative: CSS `radial-gradient` for the patch and the vignette.
- **Materials** are the product's real finishes, one per region: the ramps, their uses (`glass`, `smoke`, `pcb`, `knit`, `porcelain` and the rest), a new colour and a one-film recolour are in 3d.md section 6. Colour inside a face drawing that must not change with the theme goes straight in its `style` (gold `#d8b25a`, polished chrome `#e4e3ea`).
- **Outlines, line weight and detail** follow ISOMETRIC.md ("Tone hierarchy", "Two looks", and line weight under "Into seek(t)"): big soft parts in many segments take `mid` or `faint` outlines, and every region a shot visits gets real detail (screw heads, knurls, numerals, stitching, mesh weave, engraving), each piece on a real part, never noise.

## The reveal film

One sentence: the object tumbles in, the camera whips to macro shots of its details, one feature works, it explodes into its parts and snaps back together for a hero shot. Anatomy-reveal's espresso machine on a 10 s base:

| t (s) | Beat | What it shows |
|---|---|---|
| 0.00-1.62 | **Tumble in** | The object seen from behind and a little above, rolled about -30°. It turns about 180° in yaw into a three-quarter front view while its roll rights itself, filling about 60% of the width. Slow start, fastest mid-way, settling. |
| 1.62-1.72 | Breath | A tiny drift. |
| 1.72-1.96 | **Whip 1** | Onto the richest detail at 4-8x (the bean hopper). |
| 1.96-2.76 | **Macro slide** | A slow slide across that detail. |
| 2.76-3.00 | **Whip 2** | To a second detail: a gauge, a control, a logo plate. |
| 3.00-4.00 | **Hold** | That detail large, slightly rolled, a slow push in. Something on it moves (the gauge needle rises to brew pressure). |
| 4.00-4.24 | **Whip 3** | To a control on another face (the steam knob on the side). |
| 4.24-4.92 | **Hold** | The control turns. |
| 4.92-5.16 | **Whip 4** | To the feature. |
| 5.16-6.40 | **Feature** | Something real happens and comes back: the portafilter twists to unlock, drops out of the group head, and locks in again. |
| 6.40-6.85 | **Pull out** | Back to the whole object, three-quarter from above. |
| 6.93-7.33 | **Explode** | It comes apart fast (ease-out). |
| 7.33-8.25 | **Hold** | Apart, drifting: a slow yaw of 10-15° and a slight zoom out. |
| 8.25-8.90 | **Implode** | Back together while turning to face the viewer. A feature can settle into its hero pose. |
| 8.90-10.00 | **Hero** | Front, a slight three-quarter, about 75% of the width. A slow push that eases out to stillness. |

Adapt the details and the feature to the object; keep the rhythm: whips of about 0.24 s, holds of 0.6-1 s that keep drifting, stillness only at the end. Below about 3 s the holds get too short to read. Above about 12 s a single object turn feels slow, so add beats rather than stretch: a second macro pass, a cross-section hold, a second feature, a longer explode hold with a slow orbit.

**Where our film rules differ** (ours stay):
- **Frame rate and blur.** We render at 60 fps with our centred shutter (SKILL.md, Render). Give the film page `speed(t, dt)` so `render.mjs full` sizes each frame's blur (a hold 1 sub-frame, a whip up to 40): for this film it is the largest on-screen travel of the object's bounding-box corners and anchors (ignoring any off screen at both ends), every sliding assembly and the feature travel. Anatomy-reveal's alternative: 30 fps over a 360° shutter. Its render takes about 2 minutes per second of film: run long renders in the background.
- **Cuts.** A whip may end in a cut at its blur peak (MOTION-NUMBERS.md; measured/motion.md R6.9). Anatomy-reveal's alternative: one continuous take, every change of subject a whip.
- **Formats.** Each format is its own composition with its own camera path (SKILL.md, Formats). Anatomy-reveal's alternative: keys written once for 9:16 and reused, wide shots (zoom under about 2.6) zoomed out by `min(1, width / 540, height / 760)`, macros (over about 4.6) kept, blended in between. 4:5 (1080 × 1350) is one of our formats too, composed on its own.
- **Length.** A shorter or longer cut changes the beats, never compresses the same film (shotlist/FORMATS.md). Anatomy-reveal's alternative: whips keep their length and every other segment stretches or compresses by one factor, 10 s at 9:16 by default. The old 3-60 s range overstated the lower end: the source's 0.96 s of preserved whips plus its minimum 0.35 scale on the other 9.04 s gives a minimum 4.124 s. [annnguyentt/anatomy-reveal-skill, lib/timeline.mjs; arithmetic correction]
- **Sound.** A film ships with sound (make-video, Deliver). Anatomy-reveal's alternative: silent, cut to a track only when the user supplies one.
- **The plate.** No figure number, title, pointer hint or corner labels in the film frame (ISOMETRIC.md, "The film frame"). Anatomy-reveal's alternative: those corners in a small mono font, per beat.

**Keyframes.** The film is a pure function of time, so each channel keeps its own keys:
- **A channel that first moves mid-film needs a value at t = 0**, or its first value holds from the start.
- **Yaw stays continuous:** write 464 rather than 104 when the short way round passes 360.
- **Zoom:** 1 = the scene's fit, interpolated in log space; macros are 5-8.
- **Focus** is an anchor name (or a local point), interpolated in the object's own coordinates and projected with the current rotation, so a close-up stays on its subject while the object turns. Camera moves stay 2D (ISOMETRIC.md): the zoom and the focus scale and translate the drawing, and the strokes don't scale.
- **The curve into each key by role:** whips, pull-outs and the implode, the explode and settles, the tumble's start and end, drifting holds. Take each from MOTION-NUMBERS.md (its `whip` curve is for whips).

**Framing.** Never guess an angle: render candidate poses as stills, pick by eye, then write the winner into the keys. Check every beat with stills at its moments (`render.mjs sheet --at …`) for the share of the frame width the object fills, its position, nothing important cut off by the frame, the feature visible, and the explode readable at its angle. Check every delivered format the same way.

**Deliver** with make-video's gates, and say what was not verified. The figure page itself (drag, turn, take apart) is a separate deliverable (make-video, "Not a video").
