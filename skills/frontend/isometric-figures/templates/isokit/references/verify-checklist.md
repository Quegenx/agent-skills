# Verify: the review checklist and common faults

[isokit, references/verify-checklist.md] Originally split from [verify.md](verify.md) to keep each file under the size cap. The review checklist and the common faults and fixes

## The review checklist
**It is an object**
- [ ] At a glance it reads as one real, well-made thing, and you can name it.
- [ ] Its mechanism maps to the concept: what moves and what that means can be said in one sentence.
- [ ] It isn't a stack of abstract plates and isn't one plain slab.

**Parts and volume**
- [ ] 30-60 solids for an inline figure; a hero subject that really has more parts can go far past that (the Raptor has about 270). Every part rests on another and has a job.
- [ ] Sides shaded and tops lighter; bevels on the main slabs; a halo under the base and under lifted parts.
- [ ] Small details belong to parts: screws at the corners of plates, grooves, rulers, knurls, label plates.

**Lines**
- [ ] At 4×, every line ends on a face, another line or a terminal dot. Nothing stops in the air.
- [ ] No leader lines, balloons, dimension arrows or floating labels; at most one engraved label.
- [ ] Painter's order is right everywhere: nothing behind shows through, springs and frames are split.
- [ ] **Audit zero.** With pipes, cables or round parts in the figure, `node build.mjs --audit` ends `audit passed`: zero on every failing line, assembled, apart and in every frame of the replayed explode (opening, closing and reversing). No interlock was hidden with a key bias, and every excused pair (`allow`, `crowd`) has been looked at at 8×.
- [ ] No pipe or cable passes through another pipe, cable or solid, and every crossing is drawn in depth order: the nearer line on top, crossing on straights, well apart in depth.
- [ ] No line runs across the subject's face where it could run beside the structure; no bend pinches to a V on screen; no bend, end or clamp lands on another line's outline, assembled or apart.
- [ ] Every flange sits on its port (on a saddle pad if the port is curved); every collar, clamp, band, bellows and valve gaps the pipe it wraps; every valve and bellows sits on a straight; no route doubles back on screen; every end, apart too, ends on a flange, coupling, connector or terminal dot.
- [ ] **Junction close-ups.** Every junction area shot at 4× in both themes, assembled and apart (see "Close-ups"), and each PNG read.
- [ ] **No staircase.** Every curved surface is smooth-shaded at 4×: no stepped tone blocks, no scalloped terraces, no pale wedge, no band that ends on a straight cut, no kink at a band joint; waisted bodies follow their true outline; seams meet the outline without a nick.
- [ ] **Line ends zero.** `node scripts/lines.mjs` prints `line ends: 0` on both themes and in every resting pose; every `free` end is a rule line standing for text, a needle tail or a pointer tip.
- [ ] **Shapes are true.** No stand-in shapes: what is recorded is what is drawn, including rods that slide.
- [ ] **No abrupt texture ends.** Every row of ribs, bolt dots, rule lines or grooves ends on a real edge or fades out; none stops at full strength in the middle of a surface, flat faces included. Seams on boxes wrap their corners, rib rows end on their seams, ticks sit on a ruler strip, and a texture on a hose follows its cross-section and runs through every chunk joint. Pipe stripes run onto their end caps and show no hairline at any chunk joint, also on a strongly curved tapered tube (a volute).

**Tone and colour**
- [ ] Base `lo`, structure `mid`, subject `hi`, exactly one `lit` accent.
- [ ] Monochrome unless colour is the subject.

**Card and words**
- [ ] `Fig n` / title / hint / live readout are in the corners, with legend keys and a caption under the card.
- [ ] Every number is true and comes from the model. The readout changes as things move, and its words and numbers come from the same instant: a phase word from the model next to a number from a lagging gauge reads `relief 85 bar` before the valve has cracked.
- [ ] Text the machine displays fits its window at its widest string and is clipped to it.

**Motion and access**
- [ ] Eased, calm, no snapping; an idle tour; pauses on interaction.
- [ ] Stops offscreen; still under `--reduced`; no console errors (including React key warnings).
- [ ] Keyboard works, the focus ring shows, and `aria-valuetext` reads the state in words.

**Shaders (if the figure has one; `references/webgl.md`)**
- [ ] A contact sheet across every transition (start, each phase change, steady, stop), slowed with `["slow", 0.05]` (or `--preload` with `window.__driveSpeed=0.04` for an effect that starts on load) so every frame of each crossfade shows: no sudden colour switch, no one-frame flash, nothing cut out, and brightness never rises during a fade-out.
- [ ] 2× and 4× crops where the effect meets the SVG: no seams, hard edges, banding, dark collars or double lines; things on a plane register with that plane's lines.
- [ ] The canvas's outer rows and columns read alpha 0 in every phase.
- [ ] Without WebGL (`--no-webgl`) the SVG alone still reads; under reduced motion you get one still, representative frame; the loop stops when idle and offscreen.
- [ ] **Light theme** (`webgl-light-theme.md`, section 8; "Light-theme shaders" above):
  - Glows read through saturation, with a saturated body, a pale core and a coloured rim, never as dark or brown ink.
  - What the light falls on is tinted, and the cavity that holds the light is a darker physical ground.
  - Hot bodies run in blackbody order with no salmon stage.
  - Smoke and steam are light grey.
  - There are no halos in empty air.
  - Ink per frame follows the light monotonically through first light, every hand-off and the fade-out.
  - Ink stops at each stroke's inner edge at 8-16×.
  - The fallback shows the same inks and ground, and hands over to the shader without a dip.
  - Dark is unchanged, and a dark plate on a light page still works.

**Composition**
- [ ] Centred, filling about 55-65% of the card; it doesn't touch the corner labels.
- [ ] Still readable at 390 px with no sideways scroll, with a part selected and during a burn, not only at rest: the longest readout must not run under the controls.

## Common faults and fixes
| You see | Fix |
|---|---|
| A part shows through something in front of it | It is painted too late. Move it earlier, or split the front part. |
| An ellipse shows across a post where it meets a face | A full `ring` drawn over a cylinder that continues shows its back half. Use `sideArc` (front half only), or let the cylinder's own outline make the edge. |
| A post looks pasted onto the block it passes through | Draw it in two segments, below and above, with the block painted between them. |
| A crease or bevel stops short of a corner | Use `bevel` on `slabOf`/`cylinder`. It already ends on the silhouette. Don't hand-draw edge lines. |
| Flat, dead sides | You passed `flat`, or the solid has height 0. Give it thickness. |
| Too sparse | Add structure, not texture: feet, rails with rulers and end stops, a label plate, screws, a knob, a second stage. |
| Too busy | Drop texture-like repeats and tone grooves down to `faint`; keep one lit accent. |
| The figure is tiny in the card | Fit with a smaller `pad`, or tighten the points passed to `fitProjection`. |
| It jumps when a tab regains focus | Clamp `dt` to 1/30 s. |
| Key warnings only on the big page | Key the roots of element props (the source's `react.md` is absent); see the [adapter prerequisites](kit.md#9-react-components). |
| A shader colour jumps at a phase change | Give colour its own slow envelope, and drive it from the physical quantity, not from a phase flag. See `webgl-craft-rules.md`, section 7. |
| A straight edge in the glow, often at the canvas border | A term isn't zero at a boundary. Window it to zero before every `if`, bound and canvas edge. |
| A glow runs through the floor or over a column | It is in screen space. Rebuild it in world space with the ray and the ground hit, and give simple parts to the shader as occluders. |
| A dark collar under a glowing rim | The rim is normal-blended over the shader. Move it to an overlay SVG with `mix-blend-mode: screen`. |
| Flat bands in soft glows | Add gated triangular dither after `tonemap`. |
| In light, a glow reads as dark red or brown smoke | It is the dark colour darkened, with alpha set to brightness. Solve the ink from a paper ramp with a saturated body, a pale core and an alpha floor (`webgl-light-theme.md`, section 8.1). |
| In light, first light goes pale and then dark, or a fade-out greys or gets heavier | Per-term fades, an alpha-only fade, or a hue that reddens at fixed alpha. Fade the finished ink once, dim energy and alpha together, and take the hue at steady brightness (`webgl-light-theme.md`, section 8.2). |
| In light, a pale fringe or white seam along an edge | The ink stops short of the stroke, or clears a crease nobody strokes. End it at the stroke's inner edge (0.3 vb) and draw the crease in ink (`webgl-light-theme.md`, section 8.6). |
| A dark plate's fallback vanishes on a light page | A `.iso:not([data-theme="dark"])` rule matched through the page. Put the dark rule last, or key on the plate's own theme (`webgl-light-theme.md`, section 8.5). |
| A pipe or cable looks pasted on or cuts through a part | Its pieces are in one layer. Depth-sort each `tubePieces` chunk by `mid`, and use shorter pieces where it weaves. If it really passes through the part, reroute it; `--audit` lists every case. |
| Cables or sense lines fan across the subject's face and over a main duct | They were routed point to point. Re-route along the structure: up beside a pipe, round the body in clamped lanes, round the side to a far port ([craft-round-parts.md](craft-round-parts.md#choosing-waypoints), "Choosing waypoints"). |
| Fixing one crossing's order breaks another, or the apart pose | Keys tuned by hand. Record shapes, let `A.settle` set the keys, and fix whatever it reports as interlocked in the geometry. |
| A collar, band or clamp hides the pipe's near side, or the pipe paints over the collar's face | The pipe runs through it as one chunk. Gap the pipe at the collar (`gaps`), so a piece ends on each face. |
| A ring on a body shows its back half over the body | The body is one long band under the ring. Split it at the ring. |
| A valve or bellows cuts into its pipe at the ends | It sits on a bend. Move it to a straight at least its own length plus both fillet cuts. |
| Stepped tone blocks on a bell, dome or cone | Facet shading. Mark the curved knots smooth (`[s, r, 1]`, shaded smoothly by default) or pass `smooth: true`; cut a body into bands with `G.bandsOf`. |
| Tone bands on a throat, cone or puck stall and lurch in scallops | A smoothed profile of hand-typed knots: its slope plateaus at each knot. Write the profile as an analytic `r(s)` and pass its derivative as `smooth: { slope }` (`wobble` lists them). |
| Hairline seams inside a smooth-shaded part | The tone sheets abut. Use the kit's `solidSvg` with `seamless` paths (smooth lathes and `sphereOf` set it) and `ISO_CSS`. |
| A row of ribs or bolt dots stops in the middle of a surface | A hard `least` cut-off. Use `fade: [lo, hi]` on `ribsOf` or `dotsOf`. |
| A pale wedge with straight edges on a smooth-shaded cone or bell | Bare fill between tone pieces: pieces of one tone wound in opposite directions cancel under the nonzero rule, or a band ended without tapering. The kit orients every tone polygon and tapers bands; if you build tone paths yourself, orient them. |
| A narrowing body looks like a straight cone with a pale strip | It was hulled. Let `lathe` pick `fill: "auto"` (or pass `"surface"`). |
| A hairline crosses a tube's shine or shade band | Body and stripe cut on the same line at a chunk joint. `tubePieces` runs the stripes past the body; keep that if you change it. |
| The outline is dashed where seams meet it | Seams drawn after the solid. Pass them as `inner`. |
| A pipe's stripes stop short of its end | An end without a cap. `tubePieces` caps every end by default; don't pass `caps: false` for an end that shows. |
| Parts slide along their mount while the figure comes apart | They move with one assembly's vector on another's spring. Give the item that assembly's `ride`. |
| A long turned body has a kinked outline at band joints | Build it with `G.bandsOf` and draw the sides once with its `sidesOf` (`kit-lathe-and-tube.md`, section 10). |
| A texture line stops in the middle of a face | End it on a real edge, or draw it with `fadeLineSvg(points, { fade })` so it ramps out. `scripts/lines.mjs` lists every one. |
| A seam on a box stops short of its corners | `k.sideSeam(plan, z, P, steps)` as `inner`. |
| A hose braid or corrugation with straight hard sides, or broken at chunk joints | `tubePieces(…, { rings: { pitch, twist, cross: true } })`. |
| A rod's outline notched while it slides | One rod from `G.rodOut`, clipped at the gland, recorded with `A.slide`; never overlapping copies. |
| LCD or counter digits cross the window | Fit the type to the window's height and widest string, and clip it. |
| Stray triangles of outline across a valve or bulge | An old kit joined a broken silhouette; the kit now falls back to the hull when a side's silhouette has gaps. Rebuild with the current `lathe.mjs`. |

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
