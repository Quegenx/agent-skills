# Kit API

[isokit, references/kit.md] The bundled core is `kit/iso-kit.mjs`. The original source described a matching `kit/iso-kit.ts`, but that TypeScript file and `kit/react/draw.tsx` and `kit/react/live.tsx` are not bundled here; React examples below require those original adapters before they can run. [isokit, references/kit.md; bundled file inventory] World coordinates are `[x, y, z]`, with x and y on the floor and z up, in units of about 1 px. Screen coordinates are `[sx, sy]` in the SVG viewBox. Paths come back as SVG `d` strings, rounded to 0.1.

## Contents
1. [Types](#1-types)
2. [Camera](#2-camera)
3. [Solids](#3-solids)
4. [Lines on faces](#4-lines-on-faces)
5. [Parts library](#5-parts-library)
6. [Moving things](#6-moving-things)
7. [SVG strings (framework-free)](#7-svg-strings-framework-free)
8. [Card and page](#8-card-and-page)
9. [React components](#9-react-components)
10. [Round parts on any axis (`kit/lathe.mjs`)](kit-lathe-and-tube.md)
11. [Pipes, tubes and cables (`kit/tube.mjs`)](kit-lathe-and-tube.md)
12. [The audit (`kit/audit.mjs`)](kit-audit.md)
13. [The WebGL layer (`kit/gl.mjs`)](#13-the-webgl-layer-kitglmjs)
14. [Tools](#14-tools)
15. [Turning groups (`kit/turn.mjs`, `turn-build.mjs`, `turn-audit.mjs`)](#15-turning-groups-kitturnmjs-turn-buildmjs-turn-auditmjs)

## 1. Types
```ts
type Flat = [number, number];            // screen point
type Point3 = [number, number, number];  // world point
type Plane = [number, number];           // floor point (x, y)
interface Plan { x: number; y: number; w: number; d: number; r: number }   // rounded rectangle on the floor
interface Projection { origin: Flat; scale: number; azimuth?: number; elevation?: number }
interface SolidPaths { fill; outline; crease; top; shades: string[4]; bevel?; seamless? }
type Tone = "hi" | "mid" | "lo" | "faint";
type LineTone = Tone | "lit" | "red" | "green" | "blue";
```

## 2. Camera
| Function | What it does |
|---|---|
| `fitProjection(points: Point3[], width, height, { pad = 24, headroom = 0, azimuth = 45, elevation = 30 })` | A projection that centres and fits these points in the viewBox. Pass every extreme point, such as `boxCorners(plan, z0, z1)` and the tallest tip. |
| `iso(point, P)` | World to screen. |
| `depthOf(point, P)` | Larger means nearer the viewer. Sort ascending to paint back to front. |
| `towardViewer(P)` | The floor direction pointing at the viewer, `[cos a, sin a]`. Faces whose normal points this way are visible. |
| `screenRise(h, P)` | How many screen px a height of `h` covers. |
| `cameraOf(P)` | The raw sines and cosines. |

## 3. Solids
All solids are prisms: a floor outline extruded straight up.

| Function | What it does |
|---|---|
| `slabOf(plan, z, h, P, steps = 8, bevel = 0)` | A rounded box. `steps` is the points per corner (2-4 for small parts, 8-10 for large rounded ones). `bevel` (0.3-1.6) adds a highlight line inset on the top along the visible edges, running into the silhouette corners. |
| `cylinder(cx, cy, r, z, h, P, steps = 32, bevel = 0)` | A round post, puck, foot, knob or pad. Use 16-20 steps for small ones and 56-72 for big discs. |
| `extrude(ring: Plane[], z, h, P, { convex = true, bevel })` | Any floor outline. For concave outlines pass `convex: false` (the fill becomes faces rather than a hull). |
| `ringOf(plan, steps)` | A rounded-rectangle outline as points. |
| `roundedPlan(plan, steps)` | The same thing. |
| `circleRing(cx, cy, r, steps)` | A circle outline as points. |
| `insetPlan(plan, by)` | Shrinks a plan (use a negative `by` to grow it). Keeps the radius sensible. |
| `corners(plan, inset)` | Four floor points inset from the corners, for feet and screws. |
| `boxCorners(plan, z0, z1)` | The eight corners, for `fitProjection`. |
| `haloOf(plan, z, h, P)` | A fill path for a soft shadow: `<path class="iso-halo" d=…>`. |

What a `SolidPaths` contains:
- `fill`: paper-coloured, it hides whatever is behind.
- `shades[0..3]`: visible sides, bucketed by how they face the light.
- `top`: the top face, lighter.
- `crease`: where top meets the visible sides.
- `bevel`: optional.
- `outline`: the silhouette.

`solidSvg` and `<Solid>` paint them in that order.

## 4. Lines on faces
| Function | What it draws |
|---|---|
| `onTop(points: Plane[], z, P, closed?)` | A polyline on a horizontal face. |
| `lineOnTop(a, b, z, P)` | One segment on a horizontal face. |
| `planOutline(plan, z, P, steps)` | A rounded-rectangle outline on a face, used for grooves and inlays (`insetPlan`). |
| `ring(cx, cy, r, z, P, steps)` | A circle on a face, used for screw rings, bezels and seats. |
| `segment(a, b, P)` | Any 3D segment. |
| `rise(at, z0, z1, P)` | A vertical segment. |
| `pointsAt(points, P)` | Projects a list of points, for screw and rivet dots. |
| `dotGrid(x, y, cols, rows, gap, z, P)` | Projected perforations. |
| `topMatrix(at, z, P, along = "x")` | A transform that lays text flat on a top face, for `faceTextSvg`/`FaceText`. |
| `sideMatrix(at, z, P, "left" \| "right")` | The same, on a vertical face. |

## 5. Parts library
| Function | Returns |
|---|---|
| `knurl(cx, cy, r, z0, z1, count, P, inset = 0.4)` | Vertical lines on the visible half of a cylinder. |
| `sideArc(cx, cy, r, z, P, steps)` | The visible front half of a horizontal circle on a cylinder side: seams and bands. |
| `sideSeam(plan, z, P, steps = 8)` | The same for a box: the visible near half of the rounded plan at height `z`, wrapping its corners and ending exactly on the slab's vertical silhouette edges. Pass the slab's own `steps`, and draw it as the slab's `inner`. It is the way to draw a weld bead, a band, a lid seam or a trim line on a box: never a `segment` inset from the corners. |
| `ringSeam(ring, z, P)` | `sideSeam` for any floor outline (the ring you gave `extrude`). |
| `sideRing(center: Point3, r, "x" \| "y", P)` | A circle on a vertical face: bores, rod ends, lenses. |
| `coil(from, to, [cy, cz], r, turns, "x" \| "y", P)` | `{ back, front }` spring halves, so you can paint back → rod → front. |
| `topTicks(from, to, step, every, edge, z, [minor, major], P, axis)` | `{ minor, major }` ruler ticks on a top face, growing from the line `edge` in +y (or +x). |
| `sideTicks(from, to, step, every, face, top, [minor, major], P, axis)` | Ticks hanging down a vertical face. |
| `radialTicks(cx, cy, r, count, every, z, [minor, major], P, from = 0, span = 2π)` | Dial and turntable ticks. Angle 0 points to −y, increasing clockwise as seen from above. |

## 6. Moving things
| Function | What it does |
|---|---|
| `translateAlong(P, [dx, dy, dz])` | A `"translate(x y)"` string that moves a pre-built group by a world offset. Use it for carriages, drawers, plungers and lifts. |
| `holdStill(element, [dx, dy])` | Gives every `[data-hold]` element inside `element` the opposite translate, so a clip stays where it is while the group it sits in moves by `[dx, dy]` screen units. Call it with the same offset whenever you move an item that holds a `G.rodOut` clip. |
| `axisVector(P, [1, 0, 0])` | The screen vector of one world unit. Use it to turn pointer movement into world movement. |

Rotations about z can't be done with a screen transform: rebuild the rotating paths for each frame or step. That is cheap for a needle, a pointer or a small part.

## 7. SVG strings (framework-free)
| Function | Notes |
|---|---|
| `solidSvg(paths, { tone = "hi", crease = "faint", halo, lit, flat, className, inner })` | When `paths.seamless` is set (smooth lathe shading, `sphereOf`), the group gets `data-seamless` and `ISO_CSS` strokes each tone region in its own colour, 0.4 wide, so the many abutting tone sheets show no hairline seams. `inner` is extra line markup placed just before the outline (`iso-edge`), for seams, weld lines and band lines that must sit under the silhouette stroke; the React `Solid` takes it as a prop. |
| `lineSvg(d, { tone = "lo", dotted, dashed, flow, className, free })` | `flow` animates dashes; use it for things moving along a path. `free: true` (or `"start"`, `"end"`) writes `data-free`, telling `scripts/lines.mjs` that an end is meant to stop on a bare face: rule lines that stand for printed text, a needle's tail, a pointer's tip. Every other line end must land on something. |
| `dotsSvg(points, { size = 0.5, tone = "mid", pulse })` | A point may carry a third value, its opacity (`[x, y, 0.4]`), which is how `dotsOf(..., { fade })` fades a bolt circle out instead of stopping it. |
| `fadedSvg(list, style)` | Draws a set of lines that each carry an opacity, `[{ d, alpha }]` or `[d, alpha]`, as returned by `ribsOf(..., { fade })`. Lines are grouped by opacity in steps of 0.05, each group in one `<g opacity>`, and lines under 0.02 are dropped. Use it for any texture whose members fade one by one toward a limb: ribs, fins, knurls, rule lines. |
| `fadeLineSvg(points, { fade = [start, end], tone = "lo", className, stops = 6 })` | One line (screen points) that fades out over its first `start` and last `end` px instead of stopping (each ramp carries `data-free` on its faded end, so the line check passes it). Each ramp is stroked with a `userSpaceOnUse` linear gradient along its own chord (a smoothstep in `stops` steps, the colour taken from `var(--anatomy-<tone>)`, so both themes work), and the middle is a plain `lineSvg`, so there are no overlapping caps, beads or seams. Use it for a texture line that ends in the middle of a face: a groove that runs out, a weld line that stops short of a corner, a rule on a curved plate. Keep a ramp shorter than a quarter turn of the line, since a linear gradient follows the chord. Gradient ids are a hash of the path, so the same line drawn twice shares one. |
| `wireSvg(from, to, { via = [], tone = "lo", dotted, dashed, flow, ends: "both" \| "from" \| "to" \| "none", size = 1.2 })` | A connector with terminal dots. |
| `faceTextSvg(transform, text, { size = 3, tone = "mid", anchor })` | |
| `groupSvg(children, { class, transform, "data-part": … })` | |
| `figureSvg({ width, height, label, body, standalone: false \| "dark" \| "light", className })` | The `<svg>`. `label` is the accessible description: say what the object is and what it shows. `className` is added to its class, which helps when you stack it under a canvas (`rt-back`, `rp-back`). |

## 8. Card and page
| Function | Notes |
|---|---|
| `plateHtml({ fig, title, hint, readout, keys: [{ mark, label }], caption, body })` | The card. `mark` is one of `raised`, `flat`, `lit`, `edge`, `dim`, `dotted`, `dashed`, `red`, `green`, `blue`. The readout element carries `data-readout`, so live code writes to it. |
| `pageHtml({ title, theme = "dark", body, script, width = 650 })` | A standalone document with `ISO_CSS` inlined. |
| `kitScript()` | From `scripts/inline-kit.mjs`. Prepend it to `script` so the page can call kit functions such as `lineOnTop` and `translateAlong` while animating. |
| `glScript()` | From `scripts/inline-kit.mjs`. The source of `kit/gl.mjs` (`GLSL_ISO`, `glCamera`, `glLayer`, `smooth`, `burst`, `settle`), to inline after `kitScript()` on a page with a shader: `script: kitScript() + glScript() + live`. It doesn't depend on the kit, so a page whose live code calls no kit function can inline it alone (the Raptor uses `glScript() + LIVE`). Everything is one module script, so live code must not redeclare `smooth`, `burst` or `settle`: a second `const smooth` is a SyntaxError that kills the page. |
| `turnScript()` | From `scripts/inline-kit.mjs`. The 3D runtime (`TURN`, `TURN_CSS`) and its dependency closure with module syntax removed, for a page with live parts: `script: turnScript() + glScript() + live`. Its internals are prefixed `t3`/`T3_`, so it inlines beside the kit and the WebGL layer. |
| `ISO_CSS` | Canonical styles; `kit/iso.css` is the generated standalone mirror, refreshed by `writeIsoStylesheet()` from `scripts/inline-kit.mjs`. |

Keep the whole copied kit and scripts dependency tree: the inliner removes module syntax after concatenating local dependencies, so stripping exports from one entry file is no longer sufficient. [isokit, scripts/inline-kit.mjs]

## 9. React components

[isokit, references/kit.md; examples/test-rig and examples/spot-plate] This is the original adapter contract, not a list of shipped files: `kit/react/draw.tsx`, `kit/react/live.tsx` and `kit/iso-kit.ts` are absent. Supply the original source dependencies before using the React examples; do not infer API parity from the standalone JavaScript kit. Global React and Next.js behavior belongs in [react](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md).

The source describes `kit/react/draw.tsx` as server-safe:

- `<Solid paths tone crease halo lit flat className inner />` (`inner` is line markup placed under the outline, as for `solidSvg`)
- `<Line d tone dotted dashed flow free />`
- `<Wire from to via tone dotted dashed flow ends size />`
- `<Dots points size tone pulse />` (a point may carry opacity as `[x, y, alpha]`, as for `dotsSvg`)
- `<FaceText transform size tone anchor>text</FaceText>`
- `<IsoFigure width height label>` …svg children… `</IsoFigure>`
- `<Plate fig title hint readout keys caption>` …figure… `</Plate>`

The source describes `kit/react/live.tsx` as `"use client"`:

- `useReadout()` returns `{ anchor, say }`. Put `anchor` on your root element; `say(text)` writes the card's readout.
- `useLoop(tick: (dt, calm) => keepGoing, running)` runs a frame loop while `running` and while `tick` returns true. It returns `kick()` to restart it.
- `follow(current, target, dt, seconds, calm)` is exponential easing.
- `spring(state, target, dt, stiffness, damping, calm)` is a sub-stepped spring. It returns true when settled.
- `useEased(target, seconds)` returns an eased number as React state. Fine for small figures.
- `useInView(ref)`, `useStillness()`, `asksForStillness()`.
- `Stage` is the wrapper `IsoFigure` uses. It adds `data-inview` for CSS animations.

**Moved:** sections 10 and 11 (round parts on any axis with `kit/lathe.mjs`, pipes, tubes and cables with `kit/tube.mjs`) is now in [kit-lathe-and-tube.md](kit-lathe-and-tube.md).

**Moved:** section 12 (the audit, `kit/audit.mjs`) is now in [kit-audit.md](kit-audit.md).

## 13. The WebGL layer (`kit/gl.mjs`)
| Export | What it is |
|---|---|
| `GLSL_ISO` | The GLSL prelude that `glLayer` prepends. It holds the camera uniforms (`uCanvas`, `uView`, `uOrigin`, `uK`, `uCam`, `uTime`) and the functions `viewOf`, `project`, `towardViewer`, `rayOf`, `pixelOf`, `lightDir`, `onFloor`, `onWallX`, `onWallY`, `hash12`, `hash13`, `noise2`, `noise3`, `fbm2`, `fbm3`, `window` and `tonemap`. Don't redefine any of them in your fragment: GLSL rejects a second `rayOf`. |
| `rayOf(vb)` (GLSL) | The world point under viewBox point `vb` on the vertical plane through the origin that faces the camera. `rayOf(vb) + t·towardViewer()` is that pixel's whole ray; larger `t` is nearer the viewer. |
| `pixelOf()` (GLSL) | World units per canvas pixel, `(uView.x / uCanvas.x) / uK`. Divide by `uCam.z` for the floor's depth direction, or by `uCam.w` up a wall. |
| `glCamera(P)` | `{ origin, k, cam }` for a projection. Works in Node, so put it in the page `DATA`. |
| `glLayer({ canvas, fragment, view, camera, uniforms = [], fixed = {}, extensions = [], maxRatio = 1.5, onError })` | Returns `{ gl, extensions, set(values), draw(values, time), clear() }`, or `null` without WebGL or on a compile error. `uniforms` names the uniforms you will send per frame. `fixed` is `{ name: value }`, set once at creation, for everything that never changes (plans, heights, theme constants). `extensions` lists GLSL extensions such as `"GL_OES_standard_derivatives"`; each one the context supports is enabled and prepended as `#extension … : enable`, and the returned `extensions` lists those that were. |
| `set(values)` | Sets uniforms without drawing, for a value that changes rarely. |
| `draw(values, time)` | Fits the canvas, sets the camera uniforms and `uTime`, then `values`, and draws. |
| `clear()` | Clears to transparent, only if something was drawn. |
| `smooth(a, b, x)` | Smoothstep in JS. |
| `burst(age, rise, fall)` | An event envelope: a smoothstep attack over `rise` seconds, then exponential decay with time constant `fall`. 0 for `age ≤ 0`. |
| `settle(state, target, dt, seconds, calm = false)` | A critically damped spring on `state = { x, v }` with time constant `seconds`, four sub-steps. Snaps to the target once both error and velocity are below 1e-4. Returns true while still moving. `calm` jumps straight to the target. |

| `GLSL_TURN` | Opt-in GLSL for 3D figures, prepended by the figure to its fragment: `uGroupX/Y/Z/T`, `toGroup(p)` (world → the group's rest-world coordinates), `toWorld(g)`, `dirToGroup(d)`, `dirToWorld(d)`, and the cover masks `uCoverEdge[60]`, `uCoverCount[6]`, `coverOf(vb, soft)` (1 inside a part painted after the effect). It defines `toWorld`: don't prepend it to a fragment that declares its own. The chunk uses 70 uniform vectors. |
| `glslPose(Name, prefix = "uName")` | The same four functions for any group: `toName`, `fromName`, `dirToName`, `dirFromName` over `prefixX/Y/Z/T`, so one shader follows several groups. Feed it `TURN.poseUniforms(controller, group, prefix)`. |

A value for `fixed`, `set` or `draw` can be a number (float), an array of length 2-4 (`vec2`-`vec4`), or an array or `Float32Array` longer than 4, which goes to the uniform array of the declared type: `uniform3fv` for `uniform vec3 name[N]` (cover edges, spark positions), `uniform2fv`/`uniform4fv` likewise, and `uniform1fv` for `uniform float name[N]`. There are no ints, matrices or samplers through these calls; a `sampler2D` defaults to texture unit 0, so bind a texture with `layer.gl` (the ripple tank's history texture). Names that aren't in `uniforms` or `fixed`, and uniforms the compiler optimised away, are skipped.

`smooth`, `burst` and `settle` are plain JS: import them from `kit/gl.mjs` in a module, or get them for free on a page that inlines `glScript()`. `references/webgl.md` has the full contract, a minimal page and the craft rules.

## 14. Tools
| Script | Use it for |
|---|---|
| `scripts/capture.mjs` | One-shot screenshots: desktop, phone, hover, keys, timed shots, 4× zooms, reduced motion, console check. Chrome starts with WebGL on (SwiftShader allowed), so shaders show. `--times` delays are measured from the first shot; `--key` sends the same key codes as `drive.mjs` (`7` is `Digit7`, `Comma` sends `,`). |
| `scripts/drive.mjs` | Scripted sessions in headless Chrome with WebGL on: scroll, move, click, key, slow, until, eval, shots and contact sheets. `--no-webgl` checks the SVG fallback and `--preload file.js` runs a script before the page's own. Use it for shader transitions and anything with a sequence. See `references/verify.md`. |
| `scripts/lines.mjs` | The line-end check: every texture line in the card must end on a stroke, a dot or an outline, or under a later fill. `--out` rings the failures; exits 1 on any. The same check is the `["lines"]` action of `drive.mjs`. See `references/verify.md`, "Line ends". |
| `scripts/inline-kit.mjs` | `kitScript()`, `glScript()` and `turnScript()` return dependency-ordered plain-script closures. `fixedScript()` includes the fixed runtime and canvas painter. `latheScript()` supplies the `G` namespace after `kitScript()`. `glSharedScript()` remains an alias of `glScript()`; the duplicate `gl-shared.mjs` is removed. `writeIsoStylesheet()` refreshes the generated CSS mirror. |
| `scripts/drive.mjs` `["turn", value, group?]` | 3D figures: sets the first turn group (or `group`, or a values object) through `window.__isoTurn` and waits two frames. |
| `scripts/drive.mjs` `["orbit", out.png, from, to, step, sel?, scale?, [x,y,w,h]?, columns?]` | 3D figures: a contact sheet across angles, each frame labelled θ°. 15° over a full turn; 0.1° across an order change; 1° across a fold-prone bend. |
| `scripts/turn-check.mjs` | 3D figures. `build.mjs --fidelity` (Node: prisms, rounds, lathes and tubes against the kit builders at P′(θ)); `page.html --order` (needs a `--verify` build), `--pops`, `--lines`, `--perf`, `--passes` (pass-throughs and forced picks named by the runtime's debug collectors, over `--states` or a film's `seek(t)` with `--film`), `--states file.json`, `--part name`, `--out dir`. Every check runs its planted control first; `--passes` instead fails when `stats()` counts what the collectors missed. `references/3d-checks.md`, section 14. |
| `scripts/turn-bench.mjs` | 3D figures: `emit` and `order` CPU time in Node over 360 angles, per part kind (median of 7). |

## 15. Turning groups (`kit/turn.mjs`, `turn-build.mjs`, `turn-audit.mjs`)
The optional 3D mode. `references/3d.md` is the guide; this is the reference.
```js
import { turning, separate, gjk } from "../../kit/turn-build.mjs";
import { TURN, TURN_CSS } from "../../kit/turn.mjs";
import * as TA from "../../kit/turn-audit.mjs";
```

### `turning(P, { recorder, scale = 1 })` → `T`
| Member | What it does |
|---|---|
| `T.group(name, { parent?, turn: { pivot } \| slide: { direction, travel } \| hinge: { point, axis, range } \| free: { origin } })` | A rigid group. Values: degrees (turn, hinge), world units (slide), `{ R \| q \| axis+angle, t, world? }` or `null` (free). |
| `T.layer(name)`, `T.stack(names)` | Live layers and the full back-to-front stack of live and static layer names. |
| `T.prism`, `T.round`, `T.lathe`, `T.ball`, `T.tube`, `T.fixed`, `T.plane`, `T.billboard`, `T.split` | Parts, in world coordinates at rest. Common options `{ name, group, layer, tone, crease, lit, material, owner, details }`. Signatures in `3d.md`, section 4. |
| `T.build({ statics, poses, verify, strict })` | `{ svg, data, css, report, layerSvg(name, { width, height }), verify, planesByName }`. |
| `T.parts`, `T.groups`, `T.layers`, `T.routes`, `T.data`, `T.built` | The scene, for the audit and the checks. |

`details`: `seams`, `ribs: { s0, s1, count, phase, twist, fade, seams, tone }`, `bolts: [{ s, r, count, phase, size, tone, fade }]`, `dots: [{ at, normal, size, tone }]`, `rings: [{ at, normal, r, tone }]`, `rules: [{ points, tone, free }]`, `bevel`. Each constructor takes its own subset in its own frame (a ball's `s` runs along its first flat's normal; a prism takes dots, seams and bevel only): the table in `3d.md`, section 4. Materials: `gold`, `chrome`, `steel`, `gunmetal`, `rubber`, `brass`, `copper`, and from anatomy-reveal `glass`, `pcb`, `sensor`, `signal`, `coffee`, `bean`, `milk`, `smoke`, `porcelain`, `lavender`, `knit` (`3d.md`, section 6).

`separate(A, B, hints)` and `gjk(A, B, warm)` return `{ n, d, margin }` for two point sets (the build's plane solver).

### `TURN` (runtime)
| Member | What it does |
|---|---|
| `TURN.mount(stage, data, { onHold, onFrame, follow })` | The controller: `set(values \| θ, { detail })`, `render()`, `angleAt(x, y, z, group)`, `values`, `pose(name)`, `detach(name)`, `anchor(group, restPoint, restDir?)`, `cover(names, options)`, `order(layer)`, `orderIndex(layer)`, `events()`, `stats()`, `frames()`, `cams()`, `scene()`, `destroy()`. Installs `window.__isoTurn`. |
| `TURN.cover(controller, names \| [names…], { polygons = 6, edges = 10, pad = 0.3, layers })` | `{ uCoverEdge, uCoverCount, dropped, parts }` for `coverOf`. |
| `TURN.poseUniforms(controller, group, prefix = "uGroup")` | Four `vec3` for `GLSL_TURN` or `glslPose`. |
| `TURN.anchor(scene, cams, group, point, dir)`, `TURN.floorOf(scene, group, R)` | Anchors outside a controller; the lowest z of a group under a rotation. |
| `TURN.rotation(axis, deg)`, `TURN.quat(q)`, `TURN.compose(A, B)` | Rotations as `[9]`, for free poses. |
| `TURN.materials`, `TURN.materialCss()`, `TURN.css()`, `TURN_CSS` | Material names; the CSS. |
| `globalThis.__t3unsep = []`, `globalThis.__t3forced = []` | Optional debug collectors `t3Order` fills while set: `[nameA, nameB, margin]` per pair passing through another, and the global index of each forced pick (`scene().runs[i].name`). Unset, nothing changes. From anatomy-reveal (`kit/LICENSE-anatomy-reveal.txt`). |
| `TURN.camera`, `TURN.poses`, `TURN.cams`, `TURN.prepare`, `TURN.emit`, `TURN.order`, `TURN.frame`, `TURN.gjk`, `TURN.disjoint`, `TURN.q`, `TURN.levels` | The pipeline, for tools: cameras per group, a prepared scene, one part's frame, a layer's order. |

### Orbit audit (`kit/turn-audit.mjs`)
| Export | What it does |
|---|---|
| `orbitOrExit(T, R, P, { flag = "--audit", argv, sweep, clips, poses, crowd, cover, fittings, quick, only, log })` | Runs `orbit` when the flag is present, prints the report, sets exit code 1 on any failure. Ends `turn audit passed` only for a full run; with `only` it ends `turn audit partial`, with `quick` `turn audit quick` (`3d-checks.md`, section 13). |
| `orbit(T, R, P, options)`, `orbitReport(result)`, `orbitFailures(result)` | The checks, the text, the count. `result.skipped` lists the lines `only` left out (printed `skipped`); `result.quick` is set for a quick run. |
| `posed(shape, pose)`, `eventsOf(T, layer)` | A recorded shape moved by a group pose; a layer's edge-on angles. |

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
