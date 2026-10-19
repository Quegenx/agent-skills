# WebGL: craft rules

[isokit, references/webgl-craft-rules.md] Originally split from [webgl.md](webgl.md) to keep each file under the size cap. Section 7 (craft rules, each with the bug that taught it)

## 7. Craft rules, each with the bug that taught it

### Nothing pops
Every uniform moves along a smooth envelope in time, with an attack and a decay. Never set a value to 1 in a single frame.

- **One-shot events use `burst`.** The first ignition flash went from 0 to full in one frame and whited out the card. Now every event (flash, shock, ground ring, shutdown pop, card shake) uses the kit's `burst(age, rise, fall)` from `kit/gl.mjs`, a smoothstep attack then an exponential decay:
  ```js
  const flash = calm ? 0 : burst(sinceMain, 0.08, 0.13);
  ```
  with a 50-90 ms attack (zero slope at onset). An alpha function `t·e^(−t)` ties the decay to the rise and stays white too long. Keep whole-card flashes low too: a flash plus a CSS veil at 0.9 opacity whited out the whole card for six frames, so the veil is now `flash × 0.32`.
- **Phase changes are crossfades driven by the physical quantity.** A separate preburner term that died while the main plume grew read as an instant colour switch. Now colour, brightness, raggedness, tongue length and splash are all functions of chamber pressure, and pressure moves on a spring toward each phase's target.
- **Colour gets its own slow envelope.** Even when driven by pressure, the orange-to-violet change crossed its smoothstep window in about 0.23 s on a fast spring, and brightness dipped 33% and came back inside the 130 ms flash: a cut hidden by a flash. The fix:
  - Hue has its own critically damped envelope, the kit's `settle`: `settle(burn.hue, lit && burn.pc > 0.2 ? 1 : 0, dt, lit ? 0.32 : 0.5, calm)`, sent as `uHue`.
  - Brightness is a separate `uGlow`, computed in JS so it falls monotonically from 1.15 to 1.0 as hue rises.
  - The pressure spring is critically damped (stiffness 20, drag 2√20), so it doesn't overshoot to 318 bar.
- **Brightness during a fade-out only falls.** On shutdown the plume flared back up as an orange flame, because `mix(a, b, hue)` with `b < a` rose again as hue decayed. Now the glow level freezes when shutdown starts and is then scaled only by quantities that fall.
- **Recheck neighbours when you change a spring.** Once the pressure spring was made critically damped, the preburner tongue nearly vanished. That leg needed its own stiffer critical spring (stiffness 64).
- **One-shot flags belong to the event.** Re-igniting within 2 s of a shutdown lost the next shutdown pop, because the pop's clock was only reset after a quiet period. Now a per-burn `popped` flag decides it. Resetting the clock in `ignite()` would have cut off a pop that was still fading.
- **Changes travel through the medium.** When the ripple tank's frequency changes, the new wavelength doesn't re-lay the whole field at once. Each frame the page records the source's true phase, ω, k, damping per mm and 1/group speed, keeps 32 samples 50 ms apart, and uploads them as a 32 × 2 texture to both shaders. Each point finds its age `r / groupSpeed` with one fixed-point step on its own history's group speed, and reads k and damping from that age, so the new wavelength spreads outward from the dippers the way it really would.
- **Keep the phase continuous through a change.** The first version used `θ = k(age)·r − φ(t)`. During a sweep the term `r·dk/dt` made far crests race and alias, and damping the amplitude while the frequency moved (`calm`) blanked the pattern: mean paper brightness dipped 17%. Now `θ = kE·r − uPhase + Ψ(age)`, where `Ψ` is the phase the source gained since that sample beyond what its ω predicts (`lag` in `packHistory`). At a fixed point the crests then move only as fast as ω changes, so no amplitude damping is needed, and a small motion-blur term (`gMove`, how far crests move per frame) softens the caustics during fast changes.
- **First light fades in, and in light it only brightens.** The ripple lamp fades in over 0.9 s on first view (`smooth(0, 1, (lampClock − 0.15) / 0.9)`). In dark the SVG plain-water fill fades out on the same value through a CSS variable (`--rt-lamp`). In light the first version started from bare paper, so the troughs' ink made the tank go darker as the lamp came on, and the plain-water fill darkened it further. Now the water fill is hidden whenever WebGL runs, and the paper is drawn from the first frame (lamp 0) at its unlit grey (`off`) and mixed toward lit ink by `uLight`, so first light only brightens. For an emitter on paper the same rule reads the other way round: its ink only grows as the light comes in, and the scene never goes pale first or dips dark (section 8.2).

### No hard spatial cut-offs
Every term reaches zero before any boundary: an `if`, a bounding shape, a plane, or the canvas edge. Use `if` only as an optimisation where the term is provably about zero.
- A bead term was cut off sharply at both ends of its range by an `if`. It now fades in and out with smoothstep.
- The plume had an `if` box, a `s < .01 continue` and a `step(ax, R0)` halo mask. All three showed as seams.
- A screen-space glow column ran from the nozzle to the bottom of the canvas. The last rows of the canvas still had alpha 11-19/255, so it ended in a straight horizontal line under the deck. It is now a world-space halo bounded by the ground, and the last 10 rows and columns read exactly 0.
- A wide `exp()` flash and the floor-coordinate steam were still visible at the canvas edges. Both now fall to zero inside the canvas.
- Cell noise looks only inside its own cell, so a feature whose offset plus radius plus soft tail reaches past the cell's half-width is clipped flat at the cell edge. Keep `offset + wobble + radius + tail` under half a cell, or test the 3 × 3 neighbouring cells. A blind-test bubble field let a centre sit 0.31 of a cell off-centre with a reach of 0.86 against a 0.85 half-cell.
- Radial noise that used `atan` had a seam along one angle. Use `noise3(vec3(dir, r·k − t))` of the direction vector instead.
- A CSS `radial-gradient` with percentage stops ended outside its element. Use `circle closest-side` so the gradient ends inside it.

### World space, in the camera
- The ignition shock was a 2D circle around the projected exit. Its lower arc ran over and under the deck and painted over both columns. It is now a real sphere: each pixel ray hits it at two roots, roots below the ground are hidden softly, each root is limb-weighted, and each one goes to the back or front canvas by the engine proxy.
- The floor splash was laid flat over the deluge ring, so the tube lost its volume. The ring is now a torus occluder, lit with `max(dot(n, toPlume), 0.)`.
- Haze behind the near column painted over its front face. Columns are now opaque boxes in the shader.

### Layering and blending
- In the dark theme, canvases that only emit light use `mix-blend-mode: screen` and write premultiplied colour with alpha = the largest channel. A canvas that also darkens what it covers stays normal-blended: the ripple tank's water tints the paper seen through it, which screen blending would silently drop. In the light theme every canvas is normal-blended, and its ink is solved from the colour the paper should show (section 8), not darkened from the dark-theme colour.
- A blurred orange rim drawn in normal blend over the white-hot core read as a dim brown collar under the nozzle lip, and drawn slightly off the lip it made a double arc. Glow outlines over a shader now go in their own overlay SVG (`.rp-glow`), screen-blended in dark, at the exact lip. In light nothing can add light, so a rim is part of the ink itself: a saturated band at the body's edge around a pale core (section 8.1).
- Steam that should pass in front of the bell was always behind it. It is now split across two canvases with the engine proxy (section 2).

### Tonemap and dither
- Use `tonemap()`, never `clamp`, so bright cores roll off instead of flattening.
- Without output dither, the large soft terms became 8-bit staircases (runs of 18-34 px per level), and screen blending made them worse. Dither after tonemap with about ±1 LSB of animated triangular noise, gated so empty pixels stay exactly 0 (the Raptor's `inkOf`):
  ```glsl
  col=tonemap(col,1.15);
  float m=max(col.r,max(col.g,col.b));
  float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uTime*.37)*57.)-1.)/255.;
  col=max(col+n*smoothstep(0.,1.5/255.,m),0.);
  ```
- Band-limit fine detail. The ripple tank fades out each wave whose projected wavelength drops below 2.5-5 device pixels (its `fine` term). Otherwise a 28 Hz pattern turns into moiré.

### Render only while it matters
- Cap the device ratio at 1.5 (the `maxRatio` default). Draw only while the effect is active: the Raptor clears both canvases and lets the loop stop once every envelope is below 1e-3. Stop offscreen with the same `IntersectionObserver` as the rest of the figure, and redraw on `resize`.
- An effect that never rests (bubbles in a returning flow, a pilot flame) keeps the shader drawing at idle, but not the rest of the figure: split the loop so the SVG work (depth sort, gauges, readout) runs only while something in it changes, and run the effect alone, at a reduced rate if it is slow. A blind-test bench kept its whole tick at 60 fps forever because one envelope settled at 0.54 instead of 0.
- Gate costly terms with uniform checks (`if(uSmoke<.0004&&uVent<.0004)return vec3(0.);`). These are the same for the whole draw, so they cost nothing when off.

### Reduced motion
Jump straight to a representative steady state (the Raptor jumps to main stage, and the ripple tank to its current f and d), freeze `uTime` (the Raptor uses 0.8), zero every event envelope (no flash, shock or shake), and redraw only when the JSON of the uniforms changes. The figure must still respond to input.

### Fallback
`glLayer` returns `null`, so guard every call. Mark the stage (`data-gl`) when WebGL runs so CSS can swap between the SVG fallback and the shader. Test by stubbing WebGL (section 9).

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
