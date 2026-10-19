# Craft

[isokit, references/craft.md] How a figure comes to read as a crafted object rather than a diagram. Every rule here came from a figure that was rejected or approved by a demanding reviewer.

## Contents
1. [What "crafted" means](#1-what-crafted-means)
2. [Anti-patterns](#2-anti-patterns)
3. [Parts vocabulary, with recipes](#3-parts-vocabulary-with-recipes)
4. [Tones](#4-tones)
5. [Painter's order](#5-painters-order)
6. [Camera and composition](#6-camera-and-composition)
7. [Themes](#7-themes)
8. [Round parts and pipes](craft-round-parts.md#8-round-parts-and-pipes)
9. [Exploded views](#9-exploded-views)
10. [Screens and things on faces](#10-screens-and-things-on-faces)
11. [Shaders](#11-shaders)

## 1. What "crafted" means

The approved figures share five qualities.

1. **A real object you could build.** The reader names it at a glance: a test rig, a dial indicator, a chest of drawers, a gantry plotter, a lock. It is invented for the subject, never traced from a reference.
2. **Many small, precise parts.** A good inline figure has 30-60 solids and 300-500 paths. A hero subject that really has more parts can carry far more: the desk computer has about 85 solids, and the Raptor about 270 solids in 478 depth-sorted items. Every part rests on another part, aligns to its neighbours and has a job. Density comes from structure (feet, rails, stops, bushings, knobs), not from texture.
3. **Volume.** Parts have real thickness, sides shaded in four tones, lighter tops, bevels that catch light, and a soft halo underneath.
4. **Calm.** Thin 0.6 px lines and a restrained palette. One lit accent tells the eye where to look. Motion is eased and slow enough to follow.
5. **Truth.** The readout shows live, correct numbers, and the motion follows the real model: springs with real stiffness, true sizes and thresholds.

## 2. Anti-patterns

Reviewers rejected each of these, so don't do them:

- **Abstract stacks.** Floating plates, slabs or tiles standing for "layers" are too abstract to read as anything. If you need layers, make them drawers, trays in a rack, plates on guide pillars, or cards in a holder.
- **One big plain slab.** A large surface with a few lines is too flat and bland. Break it into a base, a carriage and parts; add a groove, screws, a ruler and a label plate.
- **Blueprint furniture.** Leader lines, balloons with numbers, dimension arrows, hatching, dashed hidden edges and floating labels belong in the legend and caption, not the drawing.
- **Lines that stop in mid-air.** Guide fans, connectors that end short of a part, or a crease that stops before the silhouette corner. Every line must land on something.
- **Wireframes.** See-through boxes where the back edges show.
- **Colour everywhere.** Keep it monochrome unless colour is the subject: one lit accent plus true RGB only for colour channels. A fluid is not colour by default: oil in a sight glass, water in a tank and coolant in a pipe are tints of the figure's own inks, and the `--no-webgl` fallback draws the same tint the shader does. A blind-test bench painted its oil saturated orange in an otherwise grey figure, and its fallback oil was grey.
- **Text in the drawing.** Allow at most one tiny engraved label (`FaceText` on a face). Everything else goes in the card corners, legend or caption.
- **Copying a reference.** Take mood and finish from a reference, then invent the object.
- **Raw pointer jumps.** Parts that snap to the cursor. Ease everything.
- **Pipes through pipes.** On the first Raptor the owner zoomed in and found cables and lines passing through the main ducts and through each other, "which makes no sense". At 1× it looked fine. Every pipe and cable keeps clear of everything but its own connection, every crossing is drawn in true depth order, and `kit/audit.mjs` proves both (`craft-round-parts.md`, section 8, "Clearance and crossings").
- **Textures that stop.** On the same close-up, rows of bolt dots on the chamber stopped dead in the middle of the surface, and the bell and throat were shaded as a staircase of flat tone blocks. Both read as broken. The owner's words: if a texture has to end, "we'd rather fade them out at the end than an instant stop". Shade curved surfaces smoothly, and make a texture end on a real edge or fade out (`craft-round-parts.md`, section 8, "Shading and textures on curved surfaces").
- **Shaders that pop or are cut.** The first Raptor plume changed colour instantly between its phases, "as if cut out", and a glow ended in a straight line at the canvas edge. Every shader term rides an envelope and reaches zero before any bound (`webgl-craft-rules.md`, section 7).
- **Textures that stop, on flat faces too.** The same fault came back on a later figure's boxes, where no curved-surface rule reached it: a tank's weld seam inset 6 units from each rounded corner, a manifold face line inset 4, a row of faint ticks floating on a bare bedplate with no ruler under them, cooling ribs that stopped 2 units short of the seam arcs at both ends, and a hose braid drawn as a dashed stroke down the centreline that ended in two straight hard edges along the hose and broke at every chunk joint. A seam on a box runs edge to edge round the visible corners (`k.sideSeam`), ribs end on seams at the same `s` (`ribsOf(…, { seams: true })`), ticks hang from a ruler strip's edge, and a texture on a pipe comes from `tubePieces(…, { rings })`. `node scripts/lines.mjs page.html` fails every line end that touches nothing (`verify.md`, "Line ends").
- **Stand-in shapes.** To quiet the audit a builder recorded a 0.45-thick disc at the tip of each of five overlapping rod copies, and a sliver for a second rod that was drawn sunk into its cylinder head. The audit passed and said nothing about either rod, and the lit rod's outline was notched every 12 units while it moved. Record the true shape of what you draw; the audit's stand-in check fails an item whose recorded shapes cover less than 60% of its drawing. A rod that slides out of a gland is one rod (section 3, "Rod out of a gland").
- **Dark-theme glows pasted on white.** The owner made light the shipping theme for every site figure, and seven shader figures built on a dark plate had to be converted. Taking a dark glow and darkening it gave "red ink smoke" (the Raptor's light plume). It also gave flames drawn as outlines, sparks that looked like dirt, salmon-coloured cooling glass, grey fades and cavities that got heavier as the fire went out. On paper, light reads through saturation and a darker physical ground (section 7, and `webgl-light-theme.md`, section 8).
- **Fixing one close-up by eye.** Tuning a painter's key or nudging a waypoint until one screenshot looks right breaks another frame or another theme. The Raptor's hand-set keys looked right at 1× and had 323 depth-order problems. Measure (`craft-round-parts.md`, section 8, "Clearance and crossings"), then look.

## 3. Parts vocabulary, with recipes

`P` is the projection and `k` is the kit, as in `import * as k from "./iso-kit"`. Heights are in world units, with z up. Draw each recipe's solids in the order listed.

### Base plate on feet
```js
const PLATE = { x: -128, y: -64, w: 262, d: 128, r: 8 };
halo:  `<path class="iso-halo" d="${k.haloOf(PLATE, -17, 12, P)}"/>`
feet:  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
         k.cylinder(x, y, 7, -17, 1.6, P, 28)            // flange, tone lo
         k.cylinder(x, y, 5.4, -15.4, 3.4, P, 28)        // foot, tone mid
       }
slab:  k.slabOf(PLATE, -12, 12, P, 8, 1.6)                // tone mid, bevel 1.6
groove: k.planOutline(k.insetPlan(PLATE, 5), 0, P)         // line lo
screws: k.corners(PLATE, 10) → k.ring(x, y, 2.2, 0, P, 16) (line lo) + dots size .5
```
Sort feet with `byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))`.

### Ruler strip and label plate
```js
const strip = { x: -110, y: PLATE.y + PLATE.d - 15, w: 230, d: 7, r: 1 };
k.slabOf(strip, 0, 0.6, P, 3)                                   // tone lo, crease none
const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
t.minor → line lo, t.major → line mid
label plate: k.slabOf(plan, 0, 0.8, P, 4) + k.planOutline(k.insetPlan(plan, 1.6), 0.8, P) (faint)
             + three k.lineOnTop rule lines of different lengths (lo, { free: true }) + two screw dots
```
Ticks only live on a ruler strip or a dial face, rooted on its edge: `topTicks` grows each tick from `edge`, so put `edge` on (or within 1 unit of) the strip's edge, and `sideTicks` hangs them from `top`, so pass the face's top edge, not 2 units below it. A row of marks on a bare plate is a texture that floats at both ends. The label plate's rule lines stand for printed text, so they are the one place a line may stop on a bare face: pass `free: true` so the line check knows it was meant.

### Seams, welds and trim lines on a box
```js
const seam = k.sideSeam(TANK, 14, P, 6);                         // visible near half of the plan at z = 14, round the corners
k.solidSvg(k.slabOf(TANK, 6, 98, P, 6, 1.2), { tone: "mid", inner: k.lineSvg(seam, { tone: "faint" }) })
```
A seam, weld bead, band or lid line on a box wraps the visible corners and ends exactly on the vertical silhouette edges, like `sideArc` on a cylinder. Pass the slab's own `steps` so the seam follows the same facets, and pass it as `inner` so its ends sit under the outline. A line that belongs to one face only (a stiffener, a panel joint) runs the full face, edge to edge: `segment([x, y, z0], [x, y, z1])` with `z0` and `z1` the face's bottom and top, never `z0 + 3`. Slots and vents are closed outlines (a `planOutline` of a thin rounded plan, or the same in a face plane), so they have no ends at all. Never inset a line by a few units from its corners: at 4× it reads as a texture that stops.

### Rod out of a gland
A piston rod, a plunger or a slide whose visible length changes as it moves is one rod, built once at full length (visible plus stroke), with the part inside the gland clipped away:
```js
const ROD = G.rodOut(F, gland, tip, r, P, { stroke });           // F.a points out of the gland
svg = `<clipPath id="rod"><path data-hold d="${ROD.clip}"/></clipPath><g clip-path="url(#rod)">${k.solidSvg(ROD.paths, { lit: true })}</g>`
R.put({ ..., move: G.mul3(F.a, stroke), svg, shapes: [R.solid(A.slide(F, gland, tip, r, { name: "rod" }))] })
live: el.setAttribute("transform", `translate(${dx} ${dy})`); holdStill(el, [dx, dy])   // dx, dy: the item's screen offset this frame
```
`rodOut` returns the rod's paths from `gland − stroke` to `tip` and a clip that covers it from the gland face to `tip + stroke`. The clip path carries `data-hold`; whatever moves the item calls `holdStill(el, [dx, dy])` with the same screen offset, which moves the clip the other way, so the gland face stays put while the rod slides through it. The same helper retracts a rod into a gland (a load cylinder) when its item moves the other way. Draw a faint seal ring (`circleOf` at the gland face, radius `r + 0.4`) on the gland. Record it with `A.slide`, which the audit poses by stretching the rod from the gland face instead of translating it, so clearances, depth and solid checks see the true rod in every frame. Never fake the extension with overlapping copies: each copy's lit edge stops where the next one's fill starts, and the outline is notched every few units while it moves.

### Rails, end stops and a carriage
```js
rails:  for y of [-20, 15]: k.slabOf({ x: 2, y, w: 122, d: 5, r: 1 }, 0, 3, P, 3, 0.4)   // mid
stops:  k.slabOf({ x, y: -23, w: 5, d: 46, r: 1.2 }, 0, 7, P, 3, 0.5) + 2 screw dots on top
carriage (built at x = 0, moved with translateAlong):
        k.slabOf({ x: -28, y: -24, w: 56, d: 48, r: 3 }, 3, 5, P, 5, 0.6)
        bushings: small slabs at the four corners, taller than the plate, with screw dots
        rivets: a row of 0.4 dots along the front edge
        handle: a small neck slab plus a knurled cylinder on the front face
```

### Post, collar, clamp and thumb screw
```js
k.cylinder(px, py, 5, z0, 4, P, 28)              // collar
k.cylinder(px, py, 3.2, z0 + 4, h, P, 28)        // post, crease none
k.sideArc(px, py, 3.2, z, P, 16)                 // faint seam rings on the post
k.slabOf({ x: px - 7, y: py - 7, w: 14, d: 14, r: 2.5 }, zc, 12, P, 4, 0.6)   // clamp block
thumb screw: a 2.8 × 3 neck slab from the clamp face + k.cylinder(r 2.6, h 6) + k.knurl(..., 18)
```

### Knurled knob with a pointer
```js
k.cylinder(cx, cy, 6, z, 4, P, 32)                          // mid
k.knurl(cx, cy, 6, z, z + 4, 36, P)                         // line lo
k.lineOnTop([cx - 3, cy], [cx + 4.6, cy], z + 4, P)         // pointer, line hi
```

### Coil spring around a rod (split for painter's order)
```js
const c = k.coil(xFrom, xTo, [rodY, rodZ], 4.2, 6, "x", P);
c.back  → line lo, drawn BEFORE the rod
rod     → k.slabOf({ x, y: rodY - 2, w, d: 4, r: 1.8 }, rodZ - 2, 4, P, 3)
c.front → line mid, drawn AFTER the rod
```
Rebuild the coil each frame when it compresses, by changing `xFrom`/`xTo`. It is cheap.

### Dial gauge (face up)
```js
k.cylinder(x, y, R, z, 10, P, 64, 0.8)                       // puck, tone hi, crease lo
k.knurl(x, y, R, top - 3.4, top, 84, P, 0.3)                 // knurled bezel band, lo
k.sideArc(x, y, R, top - 3.4, P, 40)                         // band seam, faint
k.ring(x, y, R - 2.2, top, P, 64)                            // bezel ring, lo
const t = k.radialTicks(x, y, R - 3, 50, 5, top, [1.3, 2.8], P)   // minor lo, major mid
crown: two small slabs on the +x side; lug: a slab joining the arm
needle: k.lineOnTop(tail, tip, top + 0.2, P), tone lit, stroke-width 1.1, rebuilt per frame
hub: k.ring(x, y, 1.6, top, P, 16)
```

### Drawer with a pull and label holder
```js
case:   k.slabOf(casePlan, z, h, P, 4, 0.8)
front:  a thin slab on the near face; pull: two posts plus a bar (small slabs)
holder: an inset outline on the front with a card slab inside; rivets as 0.45 dots
open:   translate the drawer along its axis with translateAlong; its box (floor plus 3 walls)
        is drawn before the front, and its contents are engraved on the floor
```

### Turntable with degree ticks
```js
k.cylinder(cx, cy, R, z, 4, P, 72, 0.8)
k.radialTicks(cx, cy, R - 1, 72, 6, z + 4, [1.2, 2.6], P)
rotate: rebuild only what turns (or the object on top) at the new angle each frame
```

### Perforations, vents and a pulsing dot grid
```js
k.dotGrid(x, y, cols, rows, gap, zTop, P) → dotsSvg(points, { size: .45, tone: "lo" })
// add { pulse: true } for a slow pulsing grid on an "active" part
```

### Lamp, probe and finger
These are stacks of cylinders: housing, cap ring, collar, stem, pad. Seam rings come from `sideArc`, and the lock screw is a small slab plus a cylinder head on the side.

## 4. Tones

| Element | Tone |
|---|---|
| Base, feet, floors | `lo` |
| Structure: posts, rails, frame, carriage, case | `mid` |
| The subject: the thing being explained | `hi` |
| The part the reader should watch now | `lit` (one only) |
| Grooves, inset outlines, floor grid | `faint` |
| Minor ticks | `lo` |
| Major ticks | `mid` |
| Zero mark, pointer line | `hi` |
| Screws and rivets | dots `mid` at 0.4-0.55 |
| Crease (top/side join) | `faint` (default), `lo` on hi parts |

A `Solid` with `lit` gets a white edge and a lighter top. Use it for the moving subject, the plunger or a picked drawer.

## 5. Painter's order

- Draw the base first, then everything resting on it.
- Within a level, sort by `depthOf(centre, P)`, ascending: far before near.
- **Split wrapping parts.** For a spring or a frame around a carriage, draw the back half, then the inner part, then the front half. In the test rig: back frame bars → rods with the back coil halves → carriage → glass → front coil halves → front bars → dial.
- **Moving parts** are drawn at their slot in the order, inside a `<g transform>` that moves them. If a moving part can pass in front of and behind the same neighbour, split the neighbour or bound the motion so the order never changes.
- **Things standing on a stepped surface.** Order the steps so the taller ones are further back. A probe resting on a lower step then can't be hidden by a taller one in front of it.
- Vertical parts that pass through a horizontal one (a post through a clamp) are drawn in two segments, below and above, around the horizontal part.
- **A clip cut is an edge.** Where a clip ends one part against another (a cable-chain run entering its loop, a rod at a gland), make the clip's section flush with the joint plane, and draw a stroked edge along the cut that moves with the clip (`data-clip`). On the plasma cutter, a run's clip section reached past the joint. The run's top face and slot bars were drawn 26 units into the loop's hollow and ended on a vertical cut with no stroke, which is a line stopping in mid-air. Re-ordering the painter's keys wouldn't have fixed it: the loop link's end face really is behind the run.
- **Dense figures settle their keys from geometry.** Past a few dozen overlapping parts, hand-set biases fight each other. Give every item its true shape and let `kit/audit.mjs` measure which surface is nearer wherever two items overlap, then `orderKeys` raises each key just enough to satisfy every pair (`kit-audit.md`, section 12). What it can't satisfy is a pair that interlocks, which needs a split. The first Raptor's hand-set keys left 190 pairs drawn the wrong way round assembled and 133 apart; measured keys took both to zero.
- **Crossings sort per chunk.** A pipe or cable is drawn as `tubePieces` chunks, each its own item at its own depth, so one line can pass in front of one part and behind the next. Where two lines cross on screen, the chunk nearer the camera is drawn later; a crossing can only be ordered if neither chunk also runs behind the other somewhere else, so break long chunks at a crossing (`breaks`).

## 6. Camera and composition

- Default camera: azimuth 45°, elevation 30°. Rotate the azimuth (35-60°) so the face that carries the mechanism points at the viewer. The test rig uses 57° to show the long side. Raise the elevation to look into something open: the ripple tank uses 44° so the water surface and the paper under the tank both read.
- Fit with `fitProjection(boxCorners(...) ∪ tallest points, width, height, { pad: 24-34, azimuth })`. Typical viewBoxes are 600 × 340-380.
- The object fills about 55-65% of the card. Leave air around it, don't let it touch the corner labels, and keep sizes consistent across a set of figures.
- On phones (390 px), check it still reads. If parts get too small, scale the SVG up to about 110-118% inside a card with `overflow: hidden` and a negative margin, as `stretch.css` does in the test-rig example.

## 7. Themes

`ISO_CSS` defines tokens on `.iso`, with dark as the default and `.iso[data-theme="light"]` for light. Every fill and stroke reads a token, so a theme is just a token set. To tune one:

- **Paper** (`--anatomy-paper`) equals the card colour, so fills hide what is behind without showing as patches.
- **Shades.** Four steps from darkest (0, facing away from the light) to lightest (3). Keep them close: about 3% apart in luminance.
- **Lines.** In dark mode, `hi` is near-white and `faint` barely above the paper. Light mode inverts this.
- **Halo.** A blurred dark fill under the base: strong in dark mode, about 30% in light.

**Light ships.** Every figure on the isometrics site is light, and that includes its shaders. Design light first and keep dark working where that is cheap. What the seven shader conversions taught about the drawing:
- **Every colour is a token.** A colour typed into a figure's CSS or its shader is a theme bug waiting to happen. Give it a light value and a dark override (`.x { --x: … }`, then `.iso[data-theme="dark"] .x { --x: … }`). Where the shader needs the same colour, read it from the token (`webgl-light-theme.md`, section 8.3).
- **Cavities get their own token set.** The inside of a furnace mouth, a ladle, a vessel seen through a cutaway, a water column or a duct window is darker for a reason: soot, refractory, depth, shadow. Give its group a class that redefines `--anatomy-paper`, `--anatomy-face`, `--anatomy-top`, the four shades and the line tones to darker, warmer or bluer greys. Keep all the tones so it still has form, mix it toward the light's hue by a variable the live code writes, and set the tokens to `inherit` in dark. Glows then have a ground, without a black box.
- **Mind nested themes.** A dark plate can sit on a light page. A rule written `.iso:not([data-theme="dark"]) .x` also matches through the page around it. Order the dark rule after the light one, or key on the plate's own theme.
- **Opacity fades a pale colour to grey.** Anything that fades by opacity in light (a fallback glow, a lit accent) gets a saturated token, and its tints are multiply-blended so the lines under them stay visible.

**Moved:** section 8 (round parts and pipes) is now in [craft-round-parts.md](craft-round-parts.md).

## 9. Exploded views
An exploded view earns its place when the parts are the explanation (what feeds what, in what order):
- Choose the assemblies the real thing comes apart into (the Raptor has 11), not single solids.
- Move each assembly along its real disassembly direction, far enough that its silhouette clears its neighbours: down along the axis for stacked stages, out radially for side units.
- Every part keeps a home. Parts that bridge two assemblies (actuators, cables) go with the one they stay attached to, and when apart they still end on something of their own: a flange, a coupling nut at a quick-disconnect, a connector shell on a cable. Strut ends are ball studs on their hosts with the rod leaving with its assembly, and saddle pads stay on their hosts. Mark each end that comes off its mount when apart (`free: [true, false]`); the audit's `looseEnds` fails every other end that touches nothing of another owner in the apart state, and lists the free ones so each is a choice.
- Highlight and motion are separate. A sensor bolted to the chamber highlights with the plumbing but rides the chamber's spring (`ride`, emitted as `data-ride`). Moved with another assembly's vector on its own spring, it slides along its mount and sinks into it mid-flight.
- Choose explode vectors and the stagger so nothing passes through anything, in any frame: `references/motion.md` ("Order the stagger so nothing has to pass through") has the rules, and the audit replays every frame of the real springs, opening, closing and reversing halfway, and fails on any pass-through.
- List the assemblies in the legend as numbered buttons (`01 Gimbal and thrust puck`…) that select, the same as hovering does.
- Springs, staggering and per-frame depth re-sorting are in `references/motion.md`.

## 10. Screens and things on faces
A screen, a dial face or a display is drawn in the plane of the face it sits on (`examples/desk-computer/`):
- **The face plane.** `sideMatrix([0, y], 0, P, "left")` maps a group's local `(x, −z)` coordinates onto the vertical face at `y`. Draw everything on the screen (the glow, scanlines, a mark, `<text>` and a cursor) in those flat coordinates inside that `<g transform>`.
- **A recess.** Clip the screen to its rounded outline with a `clipPath` in the same plane, and draw the recess's inner sides as quads between the face and the face moved `depth` back. Shade the sides by facing (tops `iso-top`, sides by shade). Draw the outline `lo` on the face and `faint` at the back.
- **Motion on the face** is a transform in face coordinates. The CRT power-off scales the picture about the screen centre to a line, then to a dot, with a beam line and a fading dot.
- **Text the machine displays** (a typed line, a counter's digits) is part of the object, not a label, so the one-label rule doesn't apply. Keep it in the screen's own type and size, and fit it: the cap height is about 0.55 of the window's height and the widest string you will ever show (`8.88`, the longest unit) must fit its width with a margin of about a tenth of the height. Clip it to the window like any screen. A blind-test flow meter set 5.6 px digits in a 12.8 × 8 window, so the leading digit crossed the window's left border and the digit tops ran into the unit label.
- **Content seen through an opening** (a sight glass, a gauge window, a recess) sits behind the face, so draw the opening's inner walls between the face and the back plane, shaded by facing, and clip the content to the opening in the face plane as well as its own. A strip of bare face inside the opening reads as a hole drawn on the surface. For a shader behind an opening, `webgl.md`, section 5.

## 11. Shaders
Some subjects can't be drawn with lines: fire, exhaust, water, caustics, real lamp light, steam. These go in a WebGL layer *inside* the drawing, in world space and in the same camera, between a back SVG and a front SVG. `references/webgl.md` has the layer stack, the camera contract, the craft rules (in `webgl-craft-rules.md`) (nothing pops, no hard cut-offs, tonemap and dither, blending per theme) and how to verify them. Everything in this page still applies to the SVG around the effect. Its section 8, now in `webgl-light-theme.md`, covers the light theme, which ships: inks solved from the colour the paper should show, ink that grows with the light, a dark physical ground for every glow, recipes for hot metal, glass, sparks, flame, steam, plasma and Cherenkov light, and a no-WebGL fallback that matches the shader.

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
