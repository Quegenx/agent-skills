# WebGL inside the drawing

[isokit, references/webgl.md] How to put a shader effect (fire, water, light, glow) inside an isometric figure so it reads as part of the same object, seen through the same camera. Two shipped examples do this: `examples/raptor-engine/` (a plume, shock, splash and steam under a rocket engine) and `examples/ripple-tank/` (caustics, shadows and a rippled water surface). Read their `live.js` next to this page. The Raptor light-theme branch is a preserved counterexample, not the paper-ink recipe: [Light theme](webgl-light-theme.md#8-light-theme) explicitly rejects its fixed dark multiplier. [isokit, references/webgl-light-theme.md]

The user loved the first shader figure, but noticed that the colour changed instantly between its phases, as if the effect had been cut. So the bar is: **nothing pops, nothing is cut, and everything sits in the drawing's perspective.** Every rule below came from a bug that broke that bar.

**Contents:** [Contents](#contents) · [1. When a shader earns its place](#1-when-a-shader-earns-its-place) · [2. The layer stack](#2-the-layer-stack) · [Worked case: the Raptor](#worked-case-the-raptor) · [Worked case: the ripple tank](#worked-case-the-ripple-tank) · [3. The camera contract](#3-the-camera-contract) · [4. Ray-marching in the iso camera](#4-ray-marching-in-the-iso-camera) · [5. Registering shader content to the SVG](#5-registering-shader-content-to-the-svg) · [6. API and a minimal page](#6-api-and-a-minimal-page) · [9. Verify](#9-verify) · [10. Performance](#10-performance) · [Prove it](#prove-it)

## Contents
1. [When a shader earns its place](#1-when-a-shader-earns-its-place)
2. [The layer stack](#2-the-layer-stack)
3. [The camera contract](#3-the-camera-contract)
4. [Ray-marching in the iso camera](#4-ray-marching-in-the-iso-camera)
5. [Registering shader content to the SVG](#5-registering-shader-content-to-the-svg)
6. [API and a minimal page](#6-api-and-a-minimal-page)
7. [Craft rules, each with the bug that taught it](webgl-craft-rules.md#7-craft-rules-each-with-the-bug-that-taught-it)
8. [Light theme (8b. Shaders on a turning group)](webgl-light-theme.md#8-light-theme)
9. [Verify](#9-verify)
10. [Performance](#10-performance)

## 1. When a shader earns its place

Use a shader for things lines can't draw: emitted light and glow, fire and exhaust, water surfaces, caustics, soft shadows from a real lamp, smoke and steam. These are continuous fields, and they're the subject or what the subject does.

Don't use one for:
- **Solids.** Parts, edges, ticks and screws stay SVG from the kit. The shader never draws a part that the SVG could draw.
- **Decoration.** Shimmer, background gradients, bloom on every edge, or noise added to make the figure look "rich". If you could delete the effect and the explanation still holds, delete it.
- **Something the SVG already shows well.** A glowing LED is a `lit` dot, not a shader.

The SVG must still read on its own. The Raptor without WebGL still shows the engine, with a rim light and a CSS deck glow. The ripple tank draws its crests and nodal lines as SVG lines (`patternOf` in `model.mjs`), clipped to the drawn outline of the tank's shadow on the paper, and hides them with `.rt-stage[data-gl] .rt-fallback { display: none }` once WebGL is running.

## 2. The layer stack

A shader can't be depth-tested against SVG, so you order layers instead. The basic stack is three layers in one `position: relative` stage, all with the same viewBox:

```
back SVG     what the effect covers        (k.figureSvg: role="img" and the label)
canvas       the effect                     (position:absolute; inset:0; pointer-events:none)
front SVG    what covers the effect        (aria-hidden)
```

For every part, ask one question: **is it ever covered by the effect, or does it cover the effect?** Parts that are covered go in the back SVG, and parts that cover go in the front SVG. If a part does both, you have three choices:

- **Split the art.** Cut the part into pieces and send each piece to the layer, and the slot in that layer, where it belongs. The ripple tank's motor cable is three groups of `tubePieces`: the run over the bridge goes in the front SVG before the bar, the run along the near rim goes in the front SVG after the near caps, and the run down the left leg to the control box goes in the middle SVG.
- **Model it in the shader.** If the part is a simple shape (box, cylinder, torus) and stays in the back SVG, give the shader that shape as an occluder. The Raptor's columns are opaque boxes (`columnNear`), so every air integral starts at `max(tGround, tColumn)`. The deluge ring is a torus inside `groundHit`, so the splash lights its inner side and leaves its outer side dark.
- **Split the effect.** When the effect passes in front of front-SVG parts, add a second canvas above the front SVG. An analytic proxy of the occluding part decides, for each sample, whether it goes to the back canvas (weight `1 − f`) or the front canvas (weight `f`). Each sample is drawn exactly once, so there is no seam. Make the proxy generous: outside the real silhouette both layers look the same.

### Worked case: the Raptor
```
back SVG    deck, feet, flame cone, deluge ring, columns, ladder, cable tray
canvas      .rp-plume: plume volume, shock (back half), flash, splash, ground ring, steam behind the engine
front SVG   every engine item (depth-sorted .it groups), pipes, harness, crosshead
glow SVG    .rp-glow: the two nozzle-lip rims, screen-blended so they can only add light
canvas      .rp-veil: steam and shock samples that lie in front of the engine
div         .rp-flash: a CSS radial gradient (closest-side) for the ignition flash
```
The engine proxy is `engineR(z)`, a radius function of the bell, chamber and pumps. `inFront(p, V)` says whether sample `p` lies between the engine and the viewer. `side(front, veil)` sends the sample to one canvas or the other.

### Worked case: the ripple tank
```
back SVG    base plate, feet, ruler, label plate, paper sheet with tape, lamp cable over the base edge, SVG fallback pattern
canvas      .rt-paper-gl: lamp light on the paper and base, caustics, shadows of the legs, post, bridge, motor, control box and foam beach, refraction
middle SVG  post, arm, lamp and its cables, control box, motor cable down the left leg in clips, legs with levelling screws,
            far rails, three corner posts, far glass, foam beach, plain-water fill
canvas      .rt-water-gl: window reflection and room-light glints, meniscus tilt at the walls, dipper contact rings,
            the water band behind the near glass, glass tint, the lamp's beam (dark only)
front SVG   far caps, motor cable over the bridge, far pillar and spring, bar, dippers, motor, near spring, near rails,
            glass bottom, water lines, near glass, near caps, motor cable on the rim, near corner post, near pillar, beam
```
Two canvases sit at two depths because there are two effects at two heights: light on the paper (under the legs), and the water surface (inside the tank). The control box stands on the base beside the tank, below the water canvas, so it lives in the middle SVG; the near corner post is painted after the caps it stands on.

CSS for the stack (adapted from `ripple.css`):
```css
.fx-stage { position: relative; touch-action: pan-y; }
.fx-stage > svg, .fx-stage > canvas { display: block; width: 100%; height: auto; }
.fx-stage > .fx-layer { position: absolute; inset: 0; height: 100% !important; pointer-events: none; }
.iso:not([data-theme="light"]) .fx-gl { mix-blend-mode: screen; }
```
Screen blending can only brighten. A canvas that must also darken what it covers (the ripple tank's water, which tints the paper seen through it) stays on normal premultiplied blending in dark too: only `.rt-paper-gl` is screen-blended.
If the front SVG must take hover (the Raptor's parts do), give it `pointer-events: none` and its items `pointer-events: visiblePainted`, so the canvas and empty areas never catch the pointer.

## 3. The camera contract

`kit/gl.mjs` prepends `GLSL_ISO` to your fragment. It declares the uniforms and functions that make the shader see the same camera as `iso()`:

| Name | What it is |
|---|---|
| `uCanvas` | Canvas size in device pixels. |
| `uView` | The viewBox size `[W, H]`. |
| `uOrigin`, `uK` | The projection origin and the screen units per world unit (`glCamera(P).k`, equal to `scaleOf(P)`). |
| `uCam` | `(sinA, cosA, sinE, cosE)` of the azimuth and elevation. |
| `uTime` | The time you pass to `draw`. |
| `viewOf(gl_FragCoord.xy)` | Device pixel to viewBox point (it flips y). |
| `project(vec3 p)` | World to viewBox, identical to the kit's `iso()`. |
| `towardViewer()` | The unit 3D view direction, `(cosA·cosE, sinA·cosE, sinE)`. Every `p + t·towardViewer()` lands on the same pixel. Not the same as the kit's JS `towardViewer(P)`, which returns the 2D floor direction. |
| `rayOf(vb)` | The world point under `vb` on the vertical plane through the origin that faces the camera, so `rayOf(vb) + t·towardViewer()` is the pixel's ray. |
| `pixelOf()` | World units per canvas pixel across the screen, `(uView.x / uCanvas.x) / uK`. |
| `lightDir()` | The kit's light, equal to `lightOf(P)`, so shader shading agrees with the SVG tones. |
| `onFloor(vb, z)` | The world point on the horizontal plane at height `z` under this pixel. |
| `onWallX(vb, x)`, `onWallY(vb, y)` | The world point on the vertical plane `x = const` or `y = const` under this pixel. |
| `hash12`, `hash13`, `noise2`, `noise3`, `fbm2`, `fbm3` | Hashes and value noise, plus 4-octave fbm. |
| `window(x, a, b, soft)` | 1 inside `[a + soft, b − soft]` and 0 outside `[a − soft, b + soft]`: a smoothstep `2·soft` wide centred on each bound, so it is 0.5 at `a` and `b`. |
| `tonemap(c, exposure)` | `1 − exp(−c·exposure)`. Use it instead of `clamp`. |

`onFloor` and the wall functions round-trip exactly with `iso()`: `project(onFloor(vb, z)) == vb`. That is what lets shader content register with SVG lines.

**Why world space.** The figure's perspective is the projection. If you draw an effect in screen space (an ellipse sized by eye, a glow column in pixels), it can't agree with the drawing. It floats above the floor, runs through the deck, or keeps the same shape when the camera changes. Build everything from world points and world sizes. Screen sizes come only from world units times `uK`.

Antialiasing in world units: `pixelOf()` is world units per device pixel across the screen. On the floor in the depth direction, divide it by `uCam.z` (sinE), and up a wall by `uCam.w` (cosE). Soften registered edges by about `0.7 * px`, so they come out one pixel soft: crisp like the SVG, but not aliased. Where refraction stretches the image, a fixed softness stair-steps; the ripple tank enables `GL_OES_standard_derivatives` and widens its shadow penumbra by `length(fwidth(q.xy)) / length(fwidth(rest))`, the shifted point's footprint over the unshifted one, which is exactly 1 at rest, with an `#ifdef GL_OES_standard_derivatives` fallback.

## 4. Ray-marching in the iso camera

The camera is orthographic with uniform scale: both rows of the projection are orthonormal. Three things follow.

- **Every pixel is a straight ray** `p(t) = p0 + t·V`, where `V = towardViewer()` and `p0` is any world point under the pixel. Take `p0 = onFloor(vb, h)`, or the kit's `rayOf(vb)`, the point on the vertical plane through the origin that faces the camera (the Raptor's ray state starts there: `S.g0 = rayOf(vb)`). Larger `t` is nearer the viewer.
- **Distances to points are screen distances.** Screen distance divided by `uK` is the exact perpendicular distance from the pixel's ray to a world point. A spherical flash, shock shell or glow ball can be computed from that distance and still be world-correct. The closest-approach parameter is `tc = dot(C − p0, V)`.
- **Visible fraction behind an occluder.** If the first opaque surface along the ray is at `tLow`, a Gaussian centred at `tc` with width `sigma` is visible by `1/(1 + exp(2.41·(tLow − tc)/sigma))` (the Raptor's `beyond`). That gives a soft cut, but a geometric one.

To march a volume:
1. **Find the first opaque hit** along the ray: the floor, plus any heightfield the SVG draws. The Raptor steps 28 times from above the flame cone's tip down to the deck and then bisects 7 times on a `ground(r)` heightfield built from the same numbers as the SVG lathe profile. Only the part of the ray in front of the hit (`t > tLow`) is air.
2. **Bound the march** with a simple shape (the Raptor uses a radius-132 cylinder from the ground hit up to the exit plane). Window every term to exactly zero before that bound, so the bound is only an optimisation.
3. **Sample with dither.** Use `t = ta + (i + hash12(gl_FragCoord.xy))·dt`, so 28 samples don't band.
4. **Normalise each term by its chord**, so the centre pixel gets the intended brightness whatever the step count. For a vertical-axis volume `r² = u² + (t·cosE)²`, so a Gaussian of radius `σ` integrates to `σ√π / cosE` along the ray: weight each sample by `dt·cosE/(σ·1.772)`.
5. **Expect a uniform cylinder to look softer.** Its projected profile is sqrt-shaped, so it loses the defined edge a flat drawing had. In dark, add a limb shell (the Raptor's orange shear layer at `0.9·Re`) to bring the edge back. In light the same shell inks an outline round a hollow flame, so there you weight the body toward the axis instead (`webgl-light-theme.md`, section 8.4).

Some terms don't need marching:
- A thin horizontal disc seen along the ray is an exact ellipse. The Raptor's Mach disks stay analytic: `u² + ((s0 − sc)/tanE)² < rm²`.
- A thin spherical shell integrated along a ray is limb-brightened: brightness is proportional to `rs·w / sqrt(rs² − d² + 2·rs·w)`. Square the normalised profile, or the inside reads as a milky bubble.

## 5. Registering shader content to the SVG

Anything that lies on a plane must line up exactly with that plane's SVG lines.
- **Same numbers.** Pass the SVG's plans and heights to the shader through `DATA` (the ripple tank passes `inside`, `outside`, `paper`, `base`, `round`, `z` and the plans of everything that casts a shadow), and hand them to `glLayer` once as `fixed` uniforms (its `FIXED`). Test against the same rounded rectangles with a signed-distance `sdRect`, so a lit paper corner ends on the drawn corner radius.
- **Same plane.** The ripple tank uses `onFloor(vb, uZ.x)` (the paper), `onFloor(vb, uZ.z)` (the water) and `onWallX(vb, uNear.x)` and `onWallY(vb, uNear.y)` (the two near glass walls) for the water band behind the glass. Never use screen offsets.
- **Seen through an opening, masked twice.** Content behind an opening in a nearer plane (a sight glass, a window, a recess, a gauge face under its bezel) is masked by its own plane (`onWallY(vb, back)`) and by the opening tested in the opening's plane (`onWallY(vb, face)`), the two soft masks multiplied together. Masked only in the back plane, a blind-test sight glass spilled its oil and glass about 0.4 px past the top rim onto the body face, and at the bottom the offset showed a strip of bare body inside the opening. Draw the recess's inner walls in the front SVG, shaded by facing (`craft.md`, section 10), so the offset between the two planes reads as wall, not as bare face.
- **Only the deviation moves.** If an effect displaces what you see (refraction through ripples), apply only the part that differs from the rest state. The ripple tank computes the sight line bent by the rippled surface and by flat water, and applies only the difference. At rest, the paper under the water lines up with the SVG paper. The shift is also faded to zero wherever the sight line to the paper passes within a few units of a leg (`legClear`), so refracted paper never slides out from behind a leg that the middle SVG draws over it.
- **Heightfields match the lathe.** The Raptor's `ground(r)` is the deck disc plus the flame-cone profile, with the same radii and heights as the `G.solidOf` profile in `build.mjs`. Flow behind the cone is hidden geometrically, and hard edges appear only where the SVG draws a real silhouette.

Check registration at 4× (section 9).

## 6. API and a minimal page

```js
import { GLSL_ISO, glCamera, glLayer, smooth, burst, settle } from "../../kit/gl.mjs";
import { kitScript, glScript } from "../../scripts/inline-kit.mjs";
```

| Function | What it does |
|---|---|
| `glCamera(P)` | `{ origin, k, cam }` for a kit projection. Works in Node and the browser. Put it in your page `DATA`. |
| `glLayer({ canvas, fragment, view, camera, uniforms = [], fixed = {}, extensions = [], maxRatio = 1.5, onError })` | Compiles `GLSL_ISO + fragment` on `canvas` with a premultiplied-alpha WebGL1 context. `view` is `[W, H]` of the viewBox, `camera` is `glCamera(P)` and `uniforms` lists the uniform names you send per frame. `fixed` is `{ name: value }` for uniforms set once at creation (geometry, theme constants). `extensions` lists GLSL extensions (`["GL_OES_standard_derivatives"]`); each one the context has is enabled and prepended as an `#extension` directive. Returns `{ gl, extensions, set(values), draw(values, time), clear() }`, where `extensions` lists the ones actually enabled, or `null` when WebGL is missing or the shader fails to compile (`onError`, which defaults to `console.error`, gets the log). |
| `set(values)` | Sets uniforms without drawing. |
| `draw(values, time)` | Resizes the canvas to its CSS box × `min(maxRatio, devicePixelRatio)`, sets the camera uniforms, sets `uTime = time`, sets each value in `values` and draws one full-screen triangle. |
| `clear()` | Clears to transparent, only if something was drawn. |
| `smooth(a, b, x)`, `burst(age, rise, fall)`, `settle(state, target, dt, seconds, calm)` | The JS envelopes every shader uniform should ride on (`webgl-craft-rules.md`, section 7, and `motion.md`). `settle` returns true while still moving. |
| `glScript()` | The plain-script dependency closure of `kit/gl.mjs`, for inlining into a standalone page after `kitScript()`. Live code on that page uses `glLayer`, `smooth`, `burst` and `settle` directly and must not declare its own. |

Uniform values and declared-type array dispatch are defined once in [Kit API](kit.md#13-the-webgl-layer-kitglmjs). The old line said every array longer than four used `uniform1fv`; `kit/gl.mjs` dispatches vector arrays to `uniform2fv`, `uniform3fv` or `uniform4fv`, matching WebGL's floating-point sequence setters. [isokit, kit/gl.mjs; official: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform]

For more data than a uniform array holds, use a texture: a `sampler2D` reads unit 0 by default, so create and update it on `layer.gl`. The ripple tank packs a 32 × 2 history into an RGBA8 texture, 16 bits per value (`PACK`, `put`, `unpack`), one texture per layer because each layer has its own context. [isokit, examples/ripple-tank/live.js]

Your fragment declares its own extra uniforms and a `main()` that writes **premultiplied** `gl_FragColor`. The canvas must cover exactly the same box as the SVGs, with the same aspect ratio, because `viewOf` assumes one uniform scale.

**Historical light-branch counterexample.** The minimal page below also uses a fixed dark ink multiplier. Keep it as the original source example; for a light figure use the [paper-ink rules](webgl-light-theme.md#81-ink-on-paper), which supersede that branch. No corrected shader is supplied here. [isokit, references/webgl-light-theme.md]

A minimal page: a hot plate glowing on top of a square deck. The plate registers with an SVG ring of radius 40 (`k.ring(0, 0, 40, 0, P, 72)`), and the glow stops at the deck's rounded edge, since there is nothing beyond it to light.

`build.mjs`:
```js
const P = k.fitProjection(points, W, H, { pad: 28, azimuth: 40 });
const DECK = { x: -90, y: -90, w: 180, d: 180, r: 8 };
const DATA = { W, H, camera: glCamera(P), plateR: 40, deck: [DECK.w / 2, DECK.r] };
const backSvg = k.figureSvg({ width: W, height: H, label: LABEL, body: back });
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg fx-layer" viewBox="0 0 ${W} ${H}" aria-hidden="true">${front.join("")}</svg>`;
const stage = `<div class="fx-stage" tabindex="0">${backSvg}<canvas class="fx-layer fx-gl" aria-hidden="true"></canvas>${frontSvg}</div>`;
const page = k.pageHtml({ title, theme, body: `<style>${CSS}</style>${k.plateHtml({ ...card, body: stage })}`, script: kitScript() + glScript() + LIVE.replace("__DATA__", JSON.stringify(DATA)) });
```

`live.js`:
```js
const D = __DATA__;
const stage = document.querySelector(".fx-stage");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const LIGHT = document.body.dataset.theme === "light" ? 1 : 0;
const FRAGMENT = `
uniform float uHeat;
uniform float uLight;
const float R=${D.plateR.toFixed(1)};
const vec2 DECK=vec2(${D.deck[0].toFixed(1)},${D.deck[1].toFixed(1)});
float deckDist(vec2 p){vec2 q=abs(p)-DECK.x+DECK.y;return length(max(q,0.))+min(max(q.x,q.y),0.)-DECK.y;}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=pixelOf()/uCam.z;
  vec3 p=onFloor(vb,0.);
  float r=length(p.xy);
  float disc=1.-smoothstep(R-.7*px,R+.7*px,r);
  float onDeck=1.-smoothstep(-.7*px,.7*px,deckDist(p.xy));
  float halo=exp(-pow(r/(R*1.6),2.))*onDeck;
  vec3 col=tonemap(vec3(1.,.42,.12)*(disc*.9+halo*.35)*uHeat,1.2);
  float a=max(col.r,max(col.g,col.b));
  vec4 dark=vec4(col,a);
  vec4 light=vec4(vec3(.62,.24,.08)*a*.8,a*.8);
  gl_FragColor=mix(dark,light,uLight);
}`;
const layer = glLayer({ canvas: stage.querySelector(".fx-gl"), fragment: FRAGMENT, view: [D.W, D.H], camera: D.camera, uniforms: ["uHeat"], fixed: { uLight: LIGHT } });
if (layer) stage.setAttribute("data-gl", "");
const heat = { x: 0, v: 0 };
let target = 1, clock = 0, last = 0, frame = 0, visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const moving = settle(heat, target, dt, 0.35, still.matches);
  if (layer) heat.x > 1e-3 ? layer.draw({ uHeat: heat.x }, still.matches ? 0.8 : clock) : layer.clear();
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
```
Without `uTime` animation this loop stops once the heat has settled. With an animated field (flicker, flow), keep running while the effect is above its activity threshold and visible, and stop otherwise.

**Moved:** section 7 (craft rules, each with the bug that taught it) is now in [webgl-craft-rules.md](webgl-craft-rules.md).

**Moved:** sections 8 and 8b (the light theme, and shaders on a turning group) is now in [webgl-light-theme.md](webgl-light-theme.md).

## 9. Verify

Use `scripts/drive.mjs` for anything that moves; `capture.mjs` also has WebGL now, so it is fine for still shots of a shader page. `references/verify.md` has the usage. On top of the normal checklist:

- **A contact sheet across every transition:** start, each phase change, steady state and stop. Real-time sheets on a heavy WebGL page are too sparse, because a headless capture takes 60-200 ms and blocks animation frames. Slow the page's clock first with `["slow", 0.05]` (20× slow motion for `requestAnimationFrame` and `performance.now`), take the sheet, then `["slow", 1]`. To catch something that starts on the first frame, such as a first-light fade-in, pass `--preload` a file containing `window.__driveSpeed=0.04` so the page runs slowly from its first frame. Wait for a phase with `["until", "document.querySelector('[data-readout]').textContent.includes('main stage')", 8000]` rather than a guessed `wait`. Hold any idle tour off before each sheet: its resume timer runs on the wall clock, not the slowed one, so it can take the targets back mid-sheet. A key press holds it for a few real seconds; for a long slowed sheet, stub the timer with `--preload` and wait for rest first (`verify.md`, "Slow mode doesn't slow timers").
- **Numbers, not just pictures.** `canvas.getContext("webgl")` returns the page's own context. In a `requestAnimationFrame` callback, read uniforms with `gl.getUniform(gl.getParameter(gl.CURRENT_PROGRAM), location)` and read the mean canvas RGB with `gl.readPixels`. Readback only works in the same task as the draw, because `preserveDrawingBuffer` is off: all-zero frames from a separate task are a test artefact. Log one row per frame across a whole run. Hue and mean luminance should each move monotonically through a phase change, apart from deliberate bursts.
- **Edges read 0.** Read back the last 10 rows and columns of the canvas during every phase. Anything above 0 is a cut that will show under screen blending.
- **In light, log ink, not brightness.** Per frame, log the ink a region lays on white, `1 − lum(rgb + 1 − a)`, with the hook in `verify.md` ("Light-theme shaders"). Do it for each region that matters (a cavity, the core, a fallback-only area) across first light, every phase change and the fade-out. Ink must follow the physical quantity: up as the light comes in, down as it goes, with no hump and no dip. Stated as numbers, the afterburner's cut window fell 1894 → 155, and its light-off rose 154 → 1959 and settled at 1914.
- **In light, probe colours along the physical ramp.** For something that heats or cools, read the centre and rim pixel at several temperatures. They must run dull red → orange → yellow → near-white, with the rim cooler than the centre and no salmon or grey stage. The glory hole's table runs from 255/179/99 centre and 252/114/25 rim at 930 °C, through 211/63/6 and 165/28/1 at about 620 °C, to clear glass by 465 °C. For a volume, read a cross-section of ink from edge to edge: it should peak on the axis.
- **In light, check the dark path too.** Every light change sits behind `uLight`, so the dark build's frames should match its baseline. Also render a dark plate inside a light page, with and without WebGL (the nested-theme trap, `webgl-light-theme.md`, section 8.5).
- **2× and 4× crops** of every place the effect meets the SVG: rims, lips, deck edges, wall bands, the paper corners, occluders, and every opening the effect is seen through (does it stop at the rim on all four sides, with the recess wall showing below?). Look for seams, hard edges, banding, a dark collar, a double line or a sudden colour switch. In light, also shoot 8-16× crops wherever ink meets a stroke (cut faces, rims, mouths, creases), and look for a pale gap between ink and line, ink painted over a line, or a stroke the ink cleared. Compare the same crop with the front SVG hidden and with the canvas hidden (set `style.display="none"` with an `eval`).
- **Fallback.** Run `drive.mjs` with `--no-webgl` (every `getContext("webgl")` returns `null`) and check that `data-gl` is absent and the SVG alone still reads, in both themes. In light, the fallback should show the same inks as the shader and the same dark ground, and every body the shader draws should be there. Film first light on a sheet with `--preload` slowing the page from its first frame: the handover from fallback to shader must not dip (`webgl-light-theme.md`, section 8.5).
- **Reduced motion** (`--reduced`): one still, representative frame.
- **Console clean.** A shader compile error arrives as `console.error` from `onError`.

## 10. Performance

- Cost is roughly pixels × samples. The Raptor runs 28 volume samples, each with four shock-cell terms, plus a 28-step ground search with 7 bisections, an 8-sample halo, a 10-sample splash curtain and 6 steam samples per canvas, at up to 1.5× device ratio. It runs in SwiftShader, but its frame time hasn't been measured on a real GPU. Measure in a real browser's Performance panel before shipping something heavier, and if it's too slow, cut samples first, then `maxRatio`.
- The ripple tank's paper shader evaluates the two-source field four times per pixel (once for the refraction shift and three times for the caustic's fixed-point inverse), each source costing six texture reads of its history instead of a 24-step uniform loop. It measured about 1 ms per draw on a laptop GPU; phone cost is unmeasured.
- Know which GPU you measured. Headless Chrome in `drive.mjs` and `capture.mjs` uses the real GPU when it can and SwiftShader otherwise; log `gl.getParameter(gl.RENDERER)` before trusting a frame time.
- Spend samples only where they matter. Bound the march (a cylinder or box), start at the ground hit, and gate whole terms on uniforms.
- Two canvases cost two full-screen passes. Clear the one that has nothing to show (the Raptor's veil is drawn only while steam, vapour or the shock is present).
- Don't animate `uTime` if nothing in the field needs it. The ripple tank passes `draw(values, 0)` and moves only the wave phase, so a reduced-motion frame is truly still.
- When idle, stop the loop. A shader page that stays at 60 fps with nothing happening is a bug.

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
