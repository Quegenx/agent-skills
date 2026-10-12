# Shaders: per-pixel looks in WebGL

For looks that are a function of each pixel: noise fields and moving gradients, glows, lens and liquid distortion, tunnels and kaleidoscopes, signed-distance shapes that melt into each other, feedback trails, GPU particles by the hundred thousand, and post passes (aberration, vignette, grain) over a whole frame. Shapes, type and UI stay in the DOM and SVG; a 3D scene with models and lights is three.js (`templates/hero3d/`, `DEPTH-AND-FOOTAGE.md`); fire or light inside an isometric drawing is the isometric kit's `gl.mjs` (`ISOMETRIC.md`).

Write raw WebGL through **twgl.js** (`npm i twgl.js`): it only removes boilerplate (compiling programs and finding their locations, building buffers, setting uniforms by name, making framebuffers and textures), so the GLSL and the draw order stay yours. It also ships primitive builders (plane, cube, sphere, torus) and `m4` matrix maths, enough for simple 3D without three.js.

## Ready-made effects: the `shaders` package

When a stock effect fits, use it before writing GLSL: `npm i shaders` gives 200+ WebGPU effects as layers (mesh and flowing gradients, aurora, plasma, noise fields, god rays, glass and fluted glass, film grain, halftone, distortions, transitions, blurs), composed as a preset of components and children, or exported as a preset from its visual editor. For film, never mount its framework components (they run on the wall clock); use its offline renderer:

```js
import { createRendererFromJSON } from 'shaders/core'
const preset = { components: [{ type: 'MeshGradient', props: { /* from the brand tokens */ } }] }
let r, T = 0
async function fresh() { r?.dispose(); r = createRendererFromJSON(preset); await r.initialize(canvas); await r.renderFrame({ deltaSeconds: 0 }); T = 0 }
const ready = fresh()
window.seek = async (t) => { await ready; if (t < T) await fresh(); await r.renderFrame({ deltaSeconds: t - T }); T = t }
```

- `renderFrame({ deltaSeconds })` is frame-locked: every clock is the exact sum of the deltas passed, and from the first locked call the renderer ignores its own repaints (resize, pointer, asset loads). Seeking backwards rebuilds it and steps forward from 0.
- Simulation effects (ripples under a cursor, datamosh, voxels and other ping-pong passes) depend on the step sequence: step them one film frame at a time, never in one jump.
- Cursor effects have no pointer in a render: drive their position props from `t`, or choose another effect.
- **WebGPU needs the real GPU.** Headless Chromium has WebGPU only with `--enable-unsafe-webgpu` (`render.mjs` and `smoke.mjs` pass it), and in software it draws black; render and smoke with `--gpu`. Measured here: black without it; with it, a MeshGradient renders under DOM text at 1920×1080 with every smoke counter at 0, including nondeterministic.

## Setup

```bash
npm i twgl.js esbuild
node scripts/bundle.mjs src.html index.html     # after every edit: the page imports a module
```

```js
import * as twgl from 'twgl.js'
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false })
const quad = twgl.createBufferInfoFromArrays(gl, { position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] } })
const prog = twgl.createProgramInfo(gl, [vertexSource, fragmentSource])
function pass(program, target, uniforms) {             // target: a framebuffer info, or null for the canvas
  twgl.bindFramebufferInfo(gl, target)
  gl.useProgram(program.program)
  twgl.setBuffersAndAttributes(gl, program, quad)
  twgl.setUniforms(program, uniforms)
  twgl.drawBufferInfo(gl, quad)
}
window.seek = (t) => pass(prog, null, { t, res: [W, H] })
```

Offscreen targets come from `twgl.createFramebufferInfo(gl, attachments, w, h)`; a float target (`internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT`) needs `gl.getExtension('EXT_color_buffer_float')` first. Images become textures with `twgl.createTexture` (or `createTextures` with a callback): load every one before the first `seek`, or make `seek` async and await them (the renderer awaits it).

## The contract, for shaders

- **Draw inside `seek(t)`, synchronously.** Never in `requestAnimationFrame`, never on a timer. twgl's own examples animate from the rAF timestamp; a film passes the film's `t` as the time uniform instead.
- **Size the canvas to the stage in pixels** (`width="1920" height="1080"` on the element, the same in CSS). Don't use `twgl.resizeCanvasToDisplaySize`: it follows the CSS size times the device ratio, so the preview and the render get different buffers.
- **`preserveDrawingBuffer: true`.** Measured here, a frame drawn synchronously inside `seek` screenshots the same without it, but any draw that lands in a later task leaves the buffer cleared; it costs little at film sizes.
- **No unseeded randomness.** Noise is a hash of the coordinates, seeded by a constant or by `t`. The common `fract(sin(dot(p, k)) * 43758.5)` hash differs between GPUs at large inputs; for a film rendered on more than one machine, use an integer hash (WebGL2 has `uint` arithmetic).
- **Dither every gradient** by about ±0.5/255 from a seeded hash of `gl_FragCoord` and `t`, or the encode turns smooth ramps into bands.
- **`precision highp float`** in every fragment shader; long `t` values lose precision in `mediump` and patterns start to stutter after a few seconds.
- **One machine per film when the GPU renders** (`render.mjs --gpu`): GPU pixels can differ between machines; the default software path is the same everywhere but slower.

## State: feedback, trails and GPU particles

A feedback pass reads the last frame to make the next one (trails, smears, reaction-diffusion, fluid, particles stored in textures). That is state carried between frames, which the contract forbids, unless the simulation is replayed deterministically:

- Step it at a **fixed step** (one film frame, `1 / fps`) from `t = 0`, with every input (emitter position, forces) a function of the step's own time.
- **Cache the step reached.** A seek forward runs only the missing steps; a seek backwards clears the targets and replays from 0. Frame n is then identical whether it is reached in order, alone or after a later frame (the smoke test's `nondeterministic` counter checks exactly this).
- **Checkpoint long films**: copy the state textures every few seconds and replay from the nearest checkpoint, or a random seek near the end of a minute-long film replays thousands of steps.
- Motion-blur sub-frames (`render.mjs --sub`) fall between steps and see the same simulation state; the parts drawn from `t` blur, the simulated layer doesn't. Step at a multiple of the frame rate if the trail itself must blur.
- Keep simulation targets at half resolution where the look allows (a soft trail, a glow) and upsample in the final pass.

## Layering and colour

- The canvas sits under the DOM; readable text stays in the DOM above it, where smoke can read it. An effect that must pass over text is a second canvas above.
- Do the light maths (glows, additive sums) in linear values and convert to display values once at the end; tonemap a sum that can exceed 1 rather than letting it clip to white.
- An effect composited over a page with alpha uses premultiplied output and a matching blend; a full-frame background writes alpha 1.

## Recipes

- **Moving gradient:** fractal noise (4-5 octaves) sampled at `p + 2.4 * q`, where `q` is itself noise drifting slowly with `t` (domain warping); map the value through two or three brand colours, dither.
- **Tunnel:** polar coordinates around the centre; depth `= 1 / r`, angle `= atan(y, x)`; scroll a texture or pattern along depth with `t`. Clamp near `r = 0`.
- **Kaleidoscope:** fold the angle into one wedge (`a = abs(mod(a, wedge) - wedge / 2)`), then sample the source in the folded coordinates.
- **Melting shapes:** signed-distance circles and boxes combined with a smooth minimum, so two shapes run together as they approach; edge with `smoothstep` over about one pixel.
- **Trail:** last frame times 0.97, slightly zoomed or drifted, plus the emitter drawn on top (the replay rules above).
- **Post pass:** sample the frame three times with a small radial offset per channel for aberration, darken with a radial falloff for a vignette, add seeded grain last.

Tested here: twgl 7.0 from npm, bundled, a full-frame domain-warped gradient and a half-resolution feedback trail replayed from a fixed step, DOM text over the canvas, rendered at 1920×1080 through `render.mjs`: every smoke counter at 0, including nondeterministic, and screenshots identical with and without `preserveDrawingBuffer` when drawn inside `seek`.
