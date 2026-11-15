# Interactive particle and shader effects

Mechanism recipes from [MengTo/Skills, build-interactive-particle-trail, build-wireframe-scan-reveal, paper-cinder-transition and fire-paper-loader]. Select an effect for an interaction or scene transition, then apply the existing [WIDGETS.md](WIDGETS.md) lifecycle, fallback, resolution and context rules. These recipes do not import the source demos or promise their reported frame times.

Resolve optional effect loading through [WIDGETS.md](WIDGETS.md#react-and-ssr). For a pointer-shader layer, keep pointer collection on an appropriate host when the visual canvas is pointer-transparent; do not assume an unverified SDK tracks global input. [MengTo/Skills, add-shader-cursor-trail/SKILL.md and assets/react/CursorTrailGate.tsx]

## Emit particles by traveled distance

Project the pointer's camera ray onto one stable interaction plane. A missed intersection, pointer leave/cancel or resumed session breaks the stroke: clear the previous hit so re-entry does not draw a bridge across the world. Three's ray-plane intersection can return null; a previous successful hit is not a new hit. [MengTo/Skills, build-interactive-particle-trail/SKILL.md, interaction plane; https://threejs.org/docs/pages/Ray.html]

Use a bounded ring pool with typed arrays for birth position, velocity, birth time and seed. Update respawned slots and evaluate age-driven motion/fade in the shader; avoid rebuilding geometry or integrating every particle on the CPU when the effect can be expressed from age. Mutating a Three buffer requires its update flag/ranges to match the changed components. Choose capacity, life and spacing in the scene's units; the source's pool sizes and timings are tuning examples. [MengTo/Skills, build-interactive-particle-trail/SKILL.md, fixed pool and shader age; https://threejs.org/docs/pages/BufferAttribute.html]

Carry unused distance from one segment into the next so births remain spaced along the actual path. A per-frame emission cap also needs an explicit excess-distance policy: discard a teleport's excess or reset the stroke instead of emitting an old backlog while the pointer is stationary. The source examples' evenly divided segment placement loses this residual; preserve the mechanism, correct that arithmetic. Let a focused control trigger the same pool without requiring a pointer gesture. [MengTo/Skills, build-interactive-particle-trail/SKILL.md; pointer-trail-emitter/demo/index.html, emission loop]

Pointer-driven orbit follows the same timing discipline: keep target influence separate from current influence, clamp the range and compute damping from actual elapsed time. Reset the time origin when starting a stopped loop, rather than every frame. [MengTo/Skills, add-mouse-driven-orbit/SKILL.md and demo/index.html; existing LAUNCH-SITES.md camera guidance]

## Ambient fields with a deliberate structure

For an ordered dither field, sample broad waves/noise on a coarse square-cell grid, apply a repeating Bayer threshold and quantize into a restrained palette. Keep the threshold pattern tied to cells; randomizing it every frame produces flicker instead of a drifting mass. Vignette or offset the bright region to leave quiet space behind content. This is a different visual from tiny film grain. The source's cell sizes, palette and DPR cap are local tuning; choose resolution from measured cost and keep a still composition for reduced motion. [MengTo/Skills, dither-background/SKILL.md, Canvas Recipe and Composition Notes]

A perspective-grid variant uses a ground plane viewed from above, distance-faded thin lines, slow cyclic forward travel, damped camera influence and sparse low-opacity dust. Keep it confined to the selected background treatment; it does not prescribe the page's layout or foreground. [MengTo/Skills, background-grid-webgl/SKILL.md, Visual target and Implementation guidance]

For a bounded section's atmosphere, scale density from container area with an explicit cap, leave content/control zones quiet and choose exit behavior: recycle, remove on exit, settle into a height-limited pile or render a deterministic still. Apply forces from elapsed time with bounded resumed deltas. Keep pointer tracking on the section, rather than installing listeners per particle, and pause decoration during a competing modal or critical task. Renderer/count examples in the source are selection heuristics, not measured thresholds; lifecycle stays in [WIDGETS.md](WIDGETS.md). Foliage geometry and seasonal world behavior live in [SCENE-ENVIRONMENTS.md](SCENE-ENVIRONMENTS.md). [MengTo/Skills, ambient-section-particles/SKILL.md, configuration, simulation and end modes]

## Reveal solid and wire views with one wavefront

Render a solid surface and its line cage from the same geometry, using the same world-space origin, distance and reveal clock. Give the two representations distinct bands of that shared wavefront so one can lead the other without drifting into an unrelated animation. Recompute the required reach after transforms/layout change, and remove/dispose the temporary cage after completion. [MengTo/Skills, build-wireframe-scan-reveal/SKILL.md]

Keep coordinate transforms consistent under nested and nonuniform scale. Do not copy the source's direct model-matrix normal transform for that case. Its descending `smoothstep` has the same defect corrected in [MATERIAL-STUDIES.md](MATERIAL-STUDIES.md#paper-one-field-torn-outline-and-thickness); use that ordered-edge form. Source scan radii and lag values belong to its scene scale. [MengTo/Skills, build-wireframe-scan-reveal/SKILL.md and demo/index.html; Khronos correction in MATERIAL-STUDIES.md]

## Composite a paper transition

Capture the outgoing scene once; keep the incoming scene live. Drive outgoing coverage, incoming coverage, char and luminous edge from one signed-distance field, rather than synchronizing several unrelated masks. Express edge thickness in displayed CSS pixels and account for local field slope so zoom/resolution changes do not arbitrarily thicken the edge. Bake expensive porous noise where practical, following the existing [fragment-cost guidance](WIDGETS.md#fragment-cost-times-area). [MengTo/Skills, paper-cinder-transition/SKILL.md, shared distance, snapshot, CSS-pixel edge and noise bake]

Restrict incoming scene rendering to the exposed area where that saves measured work. Keep full-resolution text separate from a reduced-resolution scene buffer, then restore scene resolution as the transition finishes. Name the policy for a second navigation request, such as retaining only the latest target. On resize or context restoration, explicitly recapture/restart or choose a still state; reallocating the frozen buffer silently loses the outgoing picture. Exact scale, settle delay and crossfade values in the source are local choices. [MengTo/Skills, paper-cinder-transition/SKILL.md and demo/index.html]

## Optional worker loader handoff

If a loader must remain responsive during measured main-thread construction, initialize its worker and OffscreenCanvas before that construction starts. Decide canvas ownership before requesting its context; transfer after a context exists is invalid. Convert window/worker timestamps through their time origins when sharing a clock. Keep a working still/DOM surface if worker setup, transfer or messaging fails, and terminate any prebooted worker that the selected branch will not use. [MengTo/Skills, fire-paper-loader/SKILL.md and demo/index.html; https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen; https://developer.mozilla.org/en-US/docs/Web/API/Performance/timeOrigin]

The source maps growth through a perceptual log-radius coordinate, then hands it to a spring while preserving position and velocity. Adopt that continuity goal only when this loader design calls for it. Its synchronous `readPixels` warmup and timings are case measurements, not proof that every later pipeline is ready. Use the project's worker/CSP conventions rather than copying an eval/Blob scaffold. [MengTo/Skills, fire-paper-loader/SKILL.md and demo/index.html]

## Prove it

Inspect slow and fast strokes, a missed plane, leave/re-entry, a teleport and keyboard triggering; no stale bridge or stationary backlog appears. Check dither cell structure and foreground legibility, atmosphere density after resize and each selected exit mode. Check the scan under nested/nonuniform transforms. Interrupt and resize a paper transition, then verify the chosen outgoing/incoming policy. Exercise worker failure and reduced motion. Measure fragment area and frame cost on the actual target, and verify idle/hidden work, context restoration and cleanup through [WIDGETS.md](WIDGETS.md#prove-it). Report unrun checks explicitly. [MengTo/Skills, each named source's verification guidance; corrected source limitations above]
