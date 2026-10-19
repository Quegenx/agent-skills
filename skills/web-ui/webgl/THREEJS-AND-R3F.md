# Three.js and React Three Fiber audit

[React Doctor, improve-threejs] (Modified MIT, notice in [LICENSE-react-doctor.txt](LICENSE-react-doctor.txt)) Audits a Three.js or React Three Fiber (R3F) codebase and fixes what hurts most: work that runs every frame, GPU resources that never get disposed, scene-graph objects rebuilt on every render, and visual defects the user can see. Every API line was checked against threejs.org/docs, the three.js manual (https://github.com/mrdoob/three.js/tree/dev/manual/pages), r3f.docs.pmnd.rs and drei.docs.pmnd.rs; where the source was wrong or stale, the official form is written with its URL and one line on what the source said. Severity uses the repo's P0 to P3 scale ([code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md)): the source's HIGH, MEDIUM and LOW are written here as P1, P2 and P3, and a finding that blocks the primary task is P0 whatever the tier says.

## Severity follows the render loop

"Code inside `useFrame` or a `requestAnimationFrame` callback runs 60 times per second, so a minor inefficiency there outweighs a major one in a settings panel. Rank every finding by where it runs, not by the rule's default severity." The general web rule is the same: [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md) looks for state updates inside `requestAnimationFrame`, `pointermove`, `scroll` or drag handlers; in R3F that is `setState` inside `useFrame`.

## The audit workflow

1. **Recon.** Identify the stack before scanning: plain Three.js or R3F, which helper libraries are in use (drei, postprocessing, rapier), and where the render loop lives (`useFrame` hooks, `requestAnimationFrame`, the `<Canvas frameloop>` setting). Build a **hot-path map**: every `useFrame` body, every RAF callback, every pointer-move handler. These files get the strictest review in step 3.
2. **Scan.** The source runs React Doctor read-only (`npx react-doctor@latest --verbose`; `--scope changed` for a regression check) and, for a finding that maps to one of its rules, fetches the rule's recipe from `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md` instead of improvising.
3. **Triage by frame-loop leverage.** Re-rank the scanner's findings using the hot-path map, then hunt for the Three.js-specific problems the scanner cannot see ([P1](#p1-runs-every-frame-or-leaks-gpu-memory), [P2](#p2-per-render-or-per-interaction-waste), [P3](#p3-hygiene), [Checks the scanner always misses](#checks-the-scanner-always-misses)). Confirm every finding at its `file:line` before reporting it.
4. **Visual audit.** Every visual finding needs evidence: a screenshot, a frame capture or a reproduced observation, never a guess from reading source. With a dev server and browser, load the app, capture the first stable frame, then capture again after moving the camera and interacting. With no browser, check the code-level causes and label each finding as inferred from source. Apply the [rubric](#the-visual-rubric); a row fails only when the evidence shows the failure condition.
5. **Fix** in severity order: P1 performance findings and failed visual rows first.
6. **Validate.** Re-run the scan with `--scope changed` and confirm the score did not regress. Re-check every visual rubric row that failed, using the same viewpoint and interaction as the original evidence, and confirm it now passes. Then verify behavior: the scene renders, animations play, interactions respond. If browser dev tools are available, watch the memory profile while orbiting an idle scene: the source reads a rising heap during idle as a surviving disposal leak. For GPU-side objects the manual's tool is `renderer.info` ([Disposal](#disposal)).

## P1: runs every frame or leaks GPU memory

- **Allocation inside `useFrame`**: `new Vector3()`, `new Color()`, or fresh arrays passed to Three.js APIs each frame. Fix: hoist a scratch object to module scope or `useMemo`, then mutate it in place. R3F's pitfalls page marks `lerp(new THREE.Vector3(x, y, z), 0.1)` "Bad news for the GC": it "creates a new vector 60 times a second, which allocates memory and forces the GC to eventually kick in" (https://r3f.docs.pmnd.rs/advanced/pitfalls).
- **`setState` inside `useFrame`**: re-renders the React tree on every frame. Fix: mutate refs directly; reserve state for discrete changes like selection or visibility. The pitfalls page: "You might be tempted to setState inside `useFrame` but there is no reason to."
- **Missing disposal**: geometries, materials, textures or render targets created imperatively and never disposed. Fix: call `dispose()` in the cleanup function, or move the object into R3F's declarative tree so it owns the lifecycle. Details and limits: [Disposal](#disposal).
- **Object reconstruction in render**: geometry or material instances created in render without `useMemo` (the pitfalls page says to share materials and geometries with `useMemo`), or an `args` element whose identity changes each render, such as `args={[new THREE.Vector3()]}` or a fresh object built in render. The source also blamed "inline `args` arrays whose identity changes each render"; that is wrong. R3F rebuilds an instance only when the `args` length changes or an element differs by `!==` ("Reconstruct instance if args were changed", `packages/fiber/src/core/reconciler.tsx` in https://github.com/pmndrs/react-three-fiber), and the docs' own example is an inline `<sphereGeometry args={[1, 32]} />` (https://r3f.docs.pmnd.rs/api/objects).

## P2: per-render or per-interaction waste

- **Unstable scene-graph props**: inline `new THREE.Vector3()` or fresh material objects as props. Plain arrays like `position={[x, y, z]}` are fine; R3F handles them. The objects page: give an array for props that have `.set()`; linking an existing `THREE.Vector3()` "will end up copying the object in most cases", so a fresh vector is an allocation per render, not a link.
- **Missing instancing**: hundreds of identical meshes rendered individually instead of through `<Instances>` or `InstancedMesh`. drei's `Instances` is "A wrapper around THREE.InstancedMesh" with one draw call; declarative instances cost CPU, so for thousands (foliage) use `THREE.InstancedMesh` directly (https://drei.docs.pmnd.rs). R3F's budget: draw calls "no more than 1000 as the very maximum, and optimally a few hundred or less" (https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- **Wasted frames**: `frameloop="always"` (the Canvas default; the options are `always`, `demand`, `never`) on a scene that only changes on interaction. Fix: `frameloop="demand"` plus `invalidate()`. The scaling-performance page: "Calling `invalidate()` will not render immediately, it merely requests a new frame"; several calls do not mean several renders; "Drei's controls do this automatically".
- **Uncached asset loading**: textures and models loaded outside `useLoader`, `useTexture` or `useGLTF`, losing caching and Suspense integration. R3F: "Every resource that is loaded with useLoader is cached automatically!"

## P3: hygiene

Scanner findings on non-canvas UI code, missing `<Preload>`, oversized textures. drei's `Preload` "precompiles the scene using gl.compile"; by default only visible objects, `<Preload all />` for everything.

## Disposal

From the three.js manual's "How to dispose of Objects" (https://github.com/mrdoob/three.js/blob/dev/manual/pages/how-to-dispose-of-objects.html):

- GPU-side entities "are not released automatically". `BufferGeometry.dispose()` frees a geometry's buffers; a shader program is deleted only when every material using it is disposed (`Material.dispose()`); disposing a material does not dispose its textures (`Texture.dispose()`); `WebGLRenderTarget.dispose()` frees its framebuffers and renderbuffers; `Skeleton.dispose()` only when no other active skinned mesh shares the skeleton; controls and post-processing passes have `dispose()` too.
- "Does removing a mesh from the scene also dispose its geometry and material?" "No, you have to explicitly dispose the geometry and material via *dispose()*."
- An `ImageBitmap` texture source needs `ImageBitmap.close()` from the app; `Texture.dispose()` cannot do it.
- The manual: "it's not always necessary to dispose objects all the time"; its example is disposing the old scene when a game switches levels. Disposing something still in use is no runtime error; "The worst thing that can happen is performance drop for a single frame" (while shaders recompile). Controls and renderers are the exception: they "can not be used after `dispose()`".
- `renderer.info` counts the textures, geometries and shader programs stored on the GPU; watch it to find a leak. After a full cleanup it may still report some: "It is expected that `renderer.info.memory` will still report them", internal resources (`material.envMap`, `scene.background`, `scene.environment`) that are reused, not leaked.

In R3F (https://r3f.docs.pmnd.rs/api/objects): "React Three Fiber will attempt to free resources for you by calling `object.dispose()`, if present, on all unmounted objects." Opt out with `dispose={null}`, which holds for the whole subtree, when assets are cached or global. "Primitives will not dispose of the object they carry on unmount, you are responsible for disposing of it!" So the manual work is `<primitive>` objects and anything created outside JSX.

## The visual rubric

Copied from the source. Capture evidence first ([workflow step 4](#the-audit-workflow)).

| Area                   | Check                                                                  | Fail when                                                                                          |
| ---------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Render sanity          | The scene reaches a stable frame after load                            | Black canvas, WebGL context errors, or content that never appears                                  |
| Geometry               | Move the camera along seams, edges, and boundaries                     | Gaps, missing faces, visible backfaces, or two surfaces flickering at the same depth (z-fighting)  |
| Transparency and depth | Cross depth-order boundaries with overlapping or transmissive surfaces | Wrong sort order, halos, opaque surfaces that should transmit, or flicker at grazing angles        |
| Textures               | View mapped surfaces close, far, and at grazing angles                 | Missing textures, stretching, seams, moiré, shimmer, or washed-out colors from a wrong color space |
| Materials and lighting | Change light and view direction on lit surfaces                        | Surfaces that ignore light direction, or reflective metals with no environment to reflect          |
| Shadows                | Move casters, receivers, and the light through their range             | Acne, detached or floating shadows, flicker at rest, or shadows that outlive their caster          |
| Camera                 | Follow the primary subject through movement and transitions            | Subject leaves frame, camera clips into geometry, or foreground blocks the play area               |
| Scale and contact      | Compare object scale and resting contact against surroundings          | Objects float above, sink into, or intersect their support surface, or sit at implausible scale    |
| Image stability        | Pan the camera slowly at supported resolutions                         | Silhouettes, thin geometry, or highlights that crawl, sparkle, or ghost                            |
| Resize and DPR         | Change viewport size, zoom, and device pixel ratio                     | Distortion, blur, stretched output, or content leaving the viewport                                |

The same defects in a rendered film are in [frame-review TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/TELLS.md).

## Causes per rubric row

Check these first when a row fails.

- **Washed-out or too-dark colors.** The source names "`renderer.outputColorSpace` not set to `SRGBColorSpace`"; that is stale. `outputColorSpace` "Default is `SRGBColorSpace`" (https://threejs.org/docs/pages/WebGLRenderer.html) and R3F's Canvas sets it too (https://r3f.docs.pmnd.rs/api/canvas), so it is wrong only when someone set it to Linear or used R3F's `linear` prop. The texture half holds: `Texture.colorSpace` defaults to `NoColorSpace` (https://threejs.org/docs/pages/Texture.html). The color-management manual (https://github.com/mrdoob/three.js/blob/dev/manual/pages/color-management.html): color textures such as `.map` or `.emissiveMap` (PNG, JPEG) "must be annotated with texture.colorSpace = SRGBColorSpace"; OpenEXR `.envMap` or `.lightMap` use `LinearSRGBColorSpace`; non-color textures (`.normalMap`, `.roughnessMap`) keep `NoColorSpace`; "For best results, use glTF 2.0 (`GLTFLoader`)".
- **Z-fighting.** Coplanar geometry needing `polygonOffset` or a position nudge, or a near plane set far too small for the scene scale. `polygonOffset` defaults to `false` and is "useful ... for applying decals"; `polygonOffsetFactor` and `polygonOffsetUnits` default to `0` (https://threejs.org/docs/pages/Material.html).
- **Shadow acne or floating shadows.** `shadow.bias` and `shadow.normalBias` untuned, or a shadow camera frustum far larger than the scene. `bias` defaults to 0, "Very tiny adjustments here (in the order of `0.0001`)"; `normalBias` defaults to 0 and helps "reduce shadow acne especially in large scenes where light shines onto geometry at a shallow angle. The cost is that shadows may appear distorted"; `mapSize` defaults to (512, 512) and values "must be powers of two" (https://threejs.org/docs/pages/LightShadow.html).
- **Blurry or stretched canvas.** Renderer size not synced to the canvas CSS size, or a resize handler that forgets `camera.updateProjectionMatrix()`. The source also lists "`setPixelRatio` never called"; the manual contradicts that: see [Resize and pixel ratio](#resize-and-pixel-ratio).
- **Black metals.** `metalness: 1` with no `scene.environment` set. MeshStandardMaterial: "for best results you should always specify an environment map"; `metalness` defaults to 0 (https://threejs.org/docs/pages/MeshStandardMaterial.html).
- **Transparency sorting glitches.** Large transparent meshes needing `depthWrite: false`, manual `renderOrder`, or a split into smaller meshes. `renderOrder` defaults to 0, and "opaque and transparent objects remain sorted independently"; on a Group, descendants sort together (https://threejs.org/docs/pages/Object3D.html); `depthWrite` defaults to `true`. The transparency manual (https://github.com/mrdoob/three.js/blob/dev/manual/pages/transparency.html): three.js sorts objects, not triangles; for a convex shape draw it twice, `THREE.BackSide` then `THREE.FrontSide`; for cut-outs set `alphaTest` (its example uses 0.5).
- **Shimmer and crawl.** Missing texture anisotropy, antialiasing disabled, or thin geometry needing thicker forms. `anisotropy` defaults to 1, with the maximum from `renderer.capabilities.getMaxAnisotropy()` (Texture.html, WebGLRenderer.html); `antialias` defaults to `false` in plain three.js, while R3F's Canvas turns it on.

## Resize and pixel ratio

From the three.js manual's "Responsive Design" (https://github.com/mrdoob/three.js/blob/dev/manual/pages/responsive.html):

- Let CSS size the canvas (`width: 100%; height: 100%; display: block`), then match the drawing buffer to the displayed size and pass `false` so three.js does not set the CSS size. Set `camera.aspect = canvas.clientWidth / canvas.clientHeight` and call `camera.updateProjectionMatrix()` only when the size changed.
- `renderer.setPixelRatio(window.devicePixelRatio)` is "strongly NOT RECOMMENDED": the buffer then differs from the size you asked for, which matters for post-processing, `gl_FragCoord`, screenshots, GPU picking and drawing into a 2D canvas. Multiplying yourself is "objectively better".
- Leaving the buffer at 1x is "arguably the most common" choice: a 3x phone does 9x the work at full density, and "For any heavy three.js app that's probably what you want".
- With fractional OS scaling (150%), width times `devicePixelRatio` no longer equals the physical resolution; cap the pixel count. The manual's code, verbatim:

```js
function resizeRendererToDisplaySize(renderer, maxPixelCount=3840*2160) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  let width  = Math.floor( canvas.clientWidth  * pixelRatio );
  let height = Math.floor( canvas.clientHeight * pixelRatio );
  const pixelCount = width * height;
  const renderScale = pixelCount > maxPixelCount ? Math.sqrt(maxPixelCount / pixelCount) : 1;
  width = Math.floor(width * renderScale);
  height = Math.floor(height * renderScale);

  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
```

- In R3F, Canvas `dpr` defaults to `[1, 2]` (https://r3f.docs.pmnd.rs/api/canvas). To step it with measured performance, use drei's `PerformanceMonitor` ([From the R3F docs](#from-the-r3f-docs)).

## Checks the scanner always misses

Review these by hand on every audit:

- `dispose()` coverage for every imperatively created GPU resource
- Allocations and `setState` inside `useFrame` and RAF callbacks
- Event listeners and `ResizeObserver`s on the canvas or window without cleanup
- Raycasting against the full scene on every pointer move instead of a filtered target list (source claim, not checked against the docs)
- Shadows or postprocessing enabled globally when one part of the scene needs them
- Color space on every color texture (the renderer's default is already sRGB)

## From the R3F docs

Not in the source; from https://r3f.docs.pmnd.rs/advanced/pitfalls and https://r3f.docs.pmnd.rs/advanced/scaling-performance:

- Toggle `visible` rather than mounting and unmounting, which reinitialises buffers and recompiles materials.
- drei `<Detailed distances={[0, 10, 20]}>` for level of detail.
- `<PerformanceMonitor>` steps the DPR with `onIncline` and `onDecline` (the docs' sample starts at 1.5, drops to 1 and rises to 2) and `<Canvas dpr={dpr}>` applies it; `flipflops={3} onFallback={() => setDpr(1)}` sets a floor, and "After the fallback has been called PerformanceMonitor will shut down"; `usePerformanceMonitor` lets nested components such as effects respond on their own.
- `<Canvas performance={{ min: 0.5 }}>` with `regress()`: "Mere calls to `regress()` will not change or affect anything!"

## Prove it

Every P1 finding is confirmed at its `file:line` and fixed; every failed rubric row passes again from the same viewpoint and interaction as its evidence, and findings without a browser are labeled inferred from source; the scene renders, animations play and interactions respond; `renderer.info.memory` stays flat across repeated mount and unmount or scene switches (allowing the few internal resources the manual expects); an idle `frameloop="demand"` scene renders no frames until input; the drawing buffer matches the displayed size times the ratio you chose, capped, after a resize and a zoom; and the scan with `--scope changed` did not regress.
