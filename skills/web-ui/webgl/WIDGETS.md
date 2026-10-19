# WebGL widgets in product UI

[flornkm, webgl-components] (MIT, notice in [scripts/LICENSE-webgl-components.txt](scripts/LICENSE-webgl-components.txt)) Small, always-on WebGL visuals (identity avatars, ambient orbs, glass and iridescent surfaces, animated textures) that ship inside a normal web app UI. "The failure modes are predictable, and nearly all of them come from treating the widget like a demo instead of like a component that renders fifty times in a list." Lines checked against the Khronos WebGL spec, MDN and react.dev carry the official form and its URL; lines the official pages do not state are marked as the source's claim.

**Contents:** [Live page vs video](#live-page-vs-video) · [One context, many instances](#one-context-many-instances) · [Frame loop](#frame-loop) · [Fragment cost times area](#fragment-cost-times-area) · [Real optics, not painted ones](#real-optics-not-painted-ones) · [Transparency](#transparency) · [Resolution and DPR](#resolution-and-dpr) · [Texture cache and GPU memory](#texture-cache-and-gpu-memory) · [Image sources](#image-sources) · [Context loss and restore](#context-loss-and-restore) · [Robustness](#robustness) · [The fallback is a production surface](#the-fallback-is-a-production-surface) · [React and SSR](#react-and-ssr) · [Accessibility and layout](#accessibility-and-layout) · [Identity and determinism](#identity-and-determinism) · [Verify without eyeballs](#verify-without-eyeballs) · [Prove it](#prove-it)

## Live page vs video

The repo's video skills draw WebGL too, under the opposite constraints. Both are right for their medium; never carry one side's rule into the other.

- **Software rasterizer.** Live page: refuse it with `failIfMajorPerformanceCaveat: true` and show the fallback ([Robustness](#robustness)). Video: seek-engine's renderer runs software WebGL on purpose (`render.mjs`: "default is software WebGL (SwiftShader)"). Separately, the live [isometric-figures](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/SKILL.md) verification scripts start headless Chrome with WebGL and SwiftShader permitted ([isokit verify.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/references/verify.md)).
- **Device pixel ratio cap.** Live page: "Do not copy a device-pixel-ratio cap from another project"; decide it from the shader's cost ([Resolution and DPR](#resolution-and-dpr)). The separate isokit figure contract states a fixed default, "Cap the device ratio at 1.5 (the `maxRatio` default)" ([isokit webgl.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/references/webgl.md)), for its source-specific ray-marched figures; seek-engine sizes a film's canvas to the stage in pixels ([seek-engine SHADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SHADERS.md)).
- **Clock and context loss.** Live page: one rAF loop gated by visibility, plus context-loss handling. Video: "Draw inside `seek(t)`, synchronously. Never in `requestAnimationFrame`" (SHADERS.md); a render never needs to restore a lost context.

## One context, many instances

- **Never create one WebGL context per component instance.** The source says browsers cap a document at roughly 8 to 16 live contexts, then silently evict the oldest, and a list of avatars hits that cap immediately. Neither MDN nor the Khronos spec gives a number or an evict-oldest policy; the spec only says user agents "use context lost and restored events to regulate power and memory consumption" (https://registry.khronos.org/webgl/specs/latest/1.0/). Measure the cap with [scripts/gpu-probe.html](scripts/gpu-probe.html).
- Keep **one module-level WebGL context** rendering offscreen, and give each component instance a cheap 2D canvas. Each frame: draw into the shared GL canvas, then blit the region into the instance's 2D canvas with `drawImage`.
- The GL drawing buffer is only valid until the browser composites, so draw and blit **within the same task**. Never across an await. Khronos 1.0 section 2.2 agrees: "after compositing the contents of the drawing buffer shall be cleared to their default values", and with `preserveDrawingBuffer: false`, reading it from a later task "can lead to undefined behavior".
- GL's origin is bottom-left and the 2D canvas' is top-left, so blit from `canvas.height - size`, not from `0`. The probe's section 3 checks it.
- Grow the shared canvas to fit the largest instance and never shrink it mid-session.
- **Group identical draws.** Instances agreeing on every visual input (source, tint, size, pointer state) paint identical pixels, so draw once and blit that result to all of their canvases. A list of same-styled items then costs one draw per frame instead of one per row.

## Frame loop

- One `requestAnimationFrame` loop for all instances, owned at module level. No per-instance loops.
- Gate every instance on an `IntersectionObserver` so offscreen instances never draw.
- Pause the loop entirely when `document.visibilityState !== "visible"`, and stop scheduling once nothing visible remains. MDN: "`requestAnimationFrame()` calls are paused in most browsers when running in background tabs or hidden `<iframe>`s" (https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), so for rAF the check is belt and braces; any timer- or worker-driven work needs it.
- **Cap the frame rate.** Slow ambient drift gains nothing above 30fps, and an uncapped loop pins a core for as long as the widgets are on screen, twice over on a 120Hz display where rAF fires at 120. MDN: the callback rate "will generally match the display refresh rate", and 120hz and 144hz "are also widely used".
- Ration expensive one-time work. Generating source textures should be budgeted to roughly one per frame with the remainder rescheduled, because a page that introduces a dozen variants at once will otherwise generate them all in a single frame and stall first paint.

## Fragment cost times area

- **Per-pixel cost scales with widget area, not instance count.** Budget the fragment shader like a hot loop. A blur kernel sampled per pixel per frame (13, 25, 121 taps) is where these widgets die. Aim for **one texture tap plus a couple of noise evaluations** per pixel.
- Move layered or expensive pattern generation into a **precomputed source texture**: render it once offscreen with the noise octaves, streaks and grain baked in, then have the per-frame pass merely sample it at a warped position. Motion comes from *where* you sample, not from recomputing the pattern. (seek-engine's film recipe for a moving gradient recomputes its fractal noise every frame: [seek-engine SHADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SHADERS.md).)
- If the drift perturbs UVs with noise, the GPU's derivative-based mip selection over-blurs, because perturbed derivatives look larger than the real sampling density. Apply a **negative mip bias** in `texture2D(..., bias)` to pull the detail back. This presents as "why is it suddenly blurry and washed out" and is easy to misdiagnose as a texture problem. (Source claim; the GLSL ES spec was not checked.)
- Mipmaps are mandatory once nothing blurs. A 1024px source minified into a 16 to 48px widget aliases badly. WebGL1 requires power-of-two textures for `generateMipmap`, so keep generated sources power-of-two and **resample arbitrary images onto a power-of-two canvas** before upload. MDN confirms: "WebGL1 can only use non power of 2 textures with filtering set to NEAREST or LINEAR and it cannot generate a mipmap for them. Their wrapping mode must also be set to CLAMP_TO_EDGE" (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL).
- MDN's best practices add (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): mipmaps cost "only 30% overhead" in memory; skip them for 2D resources that are never zoomed out (`TEXTURE_MIN_FILTER` set to `LINEAR`, or `texStorage` with one level in WebGL2); `generateMipmap` fails on formats that are not color-renderable, such as float textures without render-to-float.

## Real optics, not painted ones

Glass, chrome, iridescence and caustics are the usual reasons these widgets exist, and the instinct is to paint them: a gaussian for the highlight, a hand-authored violet-to-red ramp for the rainbow, a `smoothstep` ring for the edge. Painted optics need a new hand-tuned term for every angle and every background, and they stop being convincing the moment anything moves. Deriving them costs about the same per pixel and holds up on its own.

- **One normal buys everything.** On a disc, `N = normalize(vec3(p, sqrt(1 - r*r)))`. From it, Fresnel `0.04 + 0.96 * pow(1 - dot(N, V), 5.0)` and a reflection vector are two more lines, and **a Fresnel-weighted `env(reflect(-V, N))` already is the specular edge**: grazing angles drive the weight to 1 and the rim shows nothing but environment. A separate rim term added on top of this is a sign the reflection is not doing its job.
- **The environment can be a function, not a cubemap.** A direction-to-colour function with one soft key lobe, a vertical gradient and a floor bounce is a handful of `pow`s, needs no texture upload or GPU memory, and gives correct-looking reflections everywhere the widget curves.
- **Dispersion should be produced, not drawn.** Sample the interior at several wavelengths, each with its own index of refraction, and weight each by the colour the eye assigns it. A white emitter inside then comes out as a spectrum in the right order, and the spread automatically widens toward the rim where the glass is thick, which no hand-authored ramp does. Three taps (plain RGB) only fringe the two edges; a full spectrum needs the middle sampled too, so budget 8 to 16.
- Two things about a real optical setup that read as bugs but are not:
  - **A sphere disperses along its own radius.** A horizontal feature separates lengthwise and stays stubbornly white. Getting the spread perpendicular to the feature needs a wedge (a tilt added to the refracting normal), which is a prism, not a hack.
  - **Applying that wedge directly also displaces the image by its mean deviation**, throwing the feature off the edge of the widget. Position the image with the plain surface normal, compute the wedge's landing for a mid wavelength, and add only the *difference* per wavelength. Position and separation want separate controls, and usually separate depths: the ray depth that gives a good chromatic spread will bend the image into an arc if you also position with it.
- Physical does not mean unexaggerated. Real glass disperses far too little to see at widget scale, so the index spread is the one number worth pushing well past reality. Keep it as a named constant and say so, since every other number then follows from it.
- **The sharper the interior, the more wavelengths it needs.** Each wavelength draws its own copy of whatever is inside, so a soft feature hides a coarse sampling and a crisp one turns it into visible stripes: with three sharp ribbons at 14 taps you are drawing 42 separate lines, not a spectrum. Sharpening the interior and raising the tap count are the same change; doing only the first looks like a shader bug.
- **Hoist everything that does not vary per wavelength out of the loop.** Dispersion displaces the sample along one axis, so anything derived from the other one (wave centre lines, width tapers, length falloffs) is identical on every tap and can be computed once. That is what makes 28 taps cost about what 14 did, and it is the difference between "too expensive, use fewer" and "sample it properly".
- Cost check after hoisting: a wavelength tap is one `refract` and a few `exp`s; the whole loop is comparable to a 13-tap blur, and unlike the blur it scales with nothing but area. If it still needs trimming, drop taps before dropping resolution, but re-check for striping each time.

## Transparency

- **A widget that should sit over arbitrary page content must output what it *adds* plus what it *blocks*** (premultiplied `vec4(emitted, coverage)`) rather than a finished opaque image. The clear middle then lets the page through while only the reflective rim goes properly opaque.
- **Any environment constant secretly assumes a background.** A dark studio reflected onto a widget sitting on a white page draws a hard black ring around it, because at grazing angles the edge shows nothing else. Drive the ambient level from `prefers-color-scheme` and pass it as a uniform.
- **WebGL cannot read the pixels behind its own canvas.** True refraction of live page content is not available from the shader at all. The honest options are a DOM layer under the canvas carrying a `backdrop-filter`, or drawing the backdrop into the scene yourself. Say which one you did: a widget described as refracting the page when it is only reflecting a procedural environment will be found out the moment it moves over something patterned.
  - The source calls `blur()` in `backdrop-filter` "universally supported". MDN lists `backdrop-filter` as Baseline 2024, newly available since September 2024 (https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter), so older browsers lack it.
  - An SVG `feDisplacementMap` bends the backdrop properly but is not portable: "SVG `backdrop-filter` works in Chromium only (not Safari or Firefox)" ([svg FILTERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/FILTERS.md)). Live DOM first, WebGL only where there is none: [svg FILTERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/FILTERS.md#live-dom-first-webgl-where-there-is-none).

## Resolution and DPR

Do not copy a device-pixel-ratio cap from another project. The right cap is a function of how expensive your fragment shader is.

- An **expensive** shader (multi-tap blurs, many octaves per pixel) needs an aggressive cap, around 1.5, because fill cost scales with the square of the ratio.
- A **cheap** shader (one texture tap) should render at the display's real density. Capping below it is just an upscale that visibly softens the widget's edge, and it buys almost nothing back.

Optimizing the shader first is what earns the sharper rendering. Decide the cap after the shader is final, not before.

- MDN's best practices add (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): sizing the buffer as `canvas.width = width * devicePixelRatio` "will cause moire artifacts with non-integer values of devicePixelRatio, as is common with UI scaling on Windows, as well as zooming"; the page's fix is to pre-snap the canvas, with non-integer CSS `top`/`left`, to whole device pixels.
- Three.js has its own guidance for a full scene's buffer (resize it yourself, cap the pixel count): [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#resize-and-pixel-ratio).

## Texture cache and GPU memory

- Cache textures by a stable source key so many instances share one upload.
- **Bound the cache.** Each source texture is roughly a megapixel plus its mip chain, so an unbounded variant count grows GPU memory forever.
- Evict on a real signal, not just insertion order: skip any key currently in use by a mounted instance, delete the rest with `gl.deleteTexture` until back under the cap. Evicting a texture that is on screen just forces an immediate regeneration.

## Image sources

- Decode with `createImageBitmap`, falling back to `Image`, and `close()` the bitmap in a `finally` so early-return paths cannot leak decoded pixel memory. MDN: `createImageBitmap` returns a Promise and is Baseline widely available since September 2021; `ImageBitmap.close()` "disposes of all graphical resources associated with an ImageBitmap" (https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap, https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close). The source says it decodes off the main thread; MDN does not state that.
- Show a plausible placeholder such as a solid tint until the texture arrives, then repaint the listeners when it lands.
- If you crop the image to cover-fit, every derived measurement (luminance probes, palette extraction) must measure **the same cropped region you display**, otherwise your guarantees hold only for pixels nobody sees.

## Context loss and restore

The source: "Listen for `webglcontextlost`, call `preventDefault()`, tear down the loop, and flip every mounted instance to its DOM fallback. Context loss is routine under GPU resets and tab pressure, not exotic." Khronos supports "routine": "power events on mobile devices may cause the WebGL rendering context to be lost at any time". The source stops there; the spec's restore half (https://registry.khronos.org/webgl/specs/latest/1.0/, section 5.15.2):

- **`preventDefault()` means "I want restoration".** If the lost event is not cancelled, the restore steps abort. Call it only if you also handle restore.
- **`webglcontextrestored` fires after the drawing buffer is recreated**, and the app must reinitialize its resources: programs, buffers, textures. Extensions are not restored; get them again.
- So pick one: cancel the lost event and rebuild everything on `webglcontextrestored` (then flip instances back from the fallback), or leave it uncancelled and stay on the fallback.
- MDN's best practices: release a context you are done with eagerly with `WEBGL_lose_context.loseContext()`; "this is not necessary to do when navigating away from a page - don't add an unload event handler just for this purpose" (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). The probe releases its contexts that way.

## Robustness

- **Refuse software rasterization** with `failIfMajorPerformanceCaveat: true`. Where the GPU is blocklisted, a heavy source pass takes seconds and freezes the tab, and the flat fallback is strictly the better widget there. Khronos: context creation fails when performance would be dramatically lower than a native app, for example on a software rasterizer; the default is `false`. A film does the opposite: [Live page vs video](#live-page-vs-video).
- Guarantee output bounds in the shader itself. Clamp generated luminance to a mid band and apply tints with a luminosity-preserving blend, taking hue and saturation from the tint and luminosity from the source, so **no input can produce an all-black or blown-out widget**. Do not rely on curated inputs staying curated.

## The fallback is a production surface

`failIfMajorPerformanceCaveat: true` is the right call, but accept what it implies: the widget refuses to render on **every machine with hardware acceleration switched off** (a plain Chrome settings toggle, not an exotic state), plus blocklisted GPUs, remote-desktop sessions and lost contexts. Those users see only the fallback, and none of them are the machine you develop on, which is precisely how a broken fallback ships: nobody who could fix it ever renders it.

- **Always ship a non-WebGL fallback** that preserves the element's identity: same color, same seed-derived look, rendered with plain DOM and CSS. The widget is decoration, the fallback is the contract.
- **Make `fallback` part of the minimum API shape.** Take it as a prop next to `source`, and include it in every documented example, above all the first copy-paste snippet, because that is the one humans and agents lift. An example gallery where only a dedicated "fallback demo" passes one teaches everyone else to omit it.
- Match the fallback to the source kind. Generated source: a flat disc in the same tint (the color is the identity signal, so it still reads as the right entity). Image source: the same image with `object-cover`, which matches the shader's cover-fit crop. A window onto a larger image: position it absolutely against the frame and let the clip do the cropping.
- **The frame that clips the fallback must be its containing block.** `overflow: hidden` only clips an absolutely positioned descendant when the clipping element is itself positioned. A fallback that positions an oversized image against a static wrapper ignores the clip entirely and paints across the surrounding UI at full size. Put `position: relative` on the overflow-hidden frame, and treat its absence as a review blocker (P1 on [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md)'s scale): this exact bug ships invisibly because the branch never renders on a dev machine. CSS 2.2 section 11.1.1: clipping does not apply to descendants "whose containing block is the viewport or an ancestor of the element" (https://www.w3.org/TR/CSS22/visufx.html#overflow).
- **Make the branch reachable on a healthy GPU.** Ship a `forceFallback` prop and use it in the design-system or docs page with the hardest fallback shape supported (an image an order of magnitude larger than the widget, positioned off-center). A clipping regression then splatters a photo across the docs page where anyone sees it, instead of waiting for a customer report. If flipping to the fallback unmounts the canvas, the registration effect must depend on that flag so the stale instance is released, not leaked.
- Verify the docs demo actually exercises what it claims. Docs pipelines that intercept intrinsic elements (an MDX `img` override, for instance) can silently strip the `className` or `style` a fallback depends on, leaving a demo that renders plausibly while testing nothing.

## React and SSR

- **Under React Server Components, the component file needs `"use client"`.** This is an RSC boundary marker rather than a React-wide requirement, so check which world you are in. react.dev: "'use client' is for use with React Server Components"; "When a 'use client' module is imported from another client-rendered module, the directive has no effect"; it must be first in the file, in single or double quotes, not backticks (https://react.dev/reference/rsc/use-client). The source's framework list and failure mode are its own claims: it applies in the Next.js App Router and the other RSC setups (React Router's RSC mode, Waku, the Parcel and Vite RSC plugins), and is an inert directive in a plain SPA, the Next Pages Router, or Astro and Remix islands, where the only effect is a bundler warning about module-level directives. Where it does apply, omitting it often works in dev while the **production** server render fails with an opaque digest error. Verify with a real production build, not the dev server.
- **Any** server rendering, RSC or not, imports the module on the server. So no browser APIs (`window`, `document`, `matchMedia`) at module scope, only inside functions called after mount. This one bites in Astro, Remix, Gatsby and a Vite SSR build just as hard as in Next.
- Spread object props into primitives for effect dependencies. An inline `source={{...}}` object re-registers the instance on every render when the effect depends on object identity.
- Registration and teardown belong in one effect returning a cleanup. The imperative handle (pointer position, visibility) goes through refs rather than state, because pointer moves must not re-render React.
- Load the widget's code with a dynamic `import()` on the screen that needs it ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).

## Accessibility and layout

- **`prefers-reduced-motion` renders one still frame and never starts the loop.** Keep full visual fidelity, since reduced motion is not reduced appearance. Listen for the media-query change and repaint live. The WCAG side is in [web-accessibility MOTION-AND-ZOOM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md#prefers-reduced-motion).
- Decorative instances get `aria-hidden`, meaningful ones get `role="img"` with a label. Make it a prop that defaults to hidden.
- Wrap the component in `isolation: isolate` if it layers internally with z-index. Otherwise its internal stacking leaks into the page and the widget floats above sticky headers and navigation. MDN: `isolation: isolate` means "A new stacking context must be created"; Baseline widely available since January 2020 (https://developer.mozilla.org/en-US/docs/Web/CSS/isolation). Same rule in [anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md).
- Make canvases and any backing images non-interactive: no pointer events on purely visual layers, no drag, no text selection.

## Identity and determinism

- Derive per-entity variety from a **stable hash of the entity id** into a small curated table of crop windows, palettes or noise offsets. The same entity must look identical across sessions, surfaces and the WebGL-to-fallback boundary.
- Spread variants across the parameter space with a strong integer hash such as Knuth multiplicative, not sequential offsets, so neighbouring ids look clearly different.
- Never use `Math.random()` in the render path. Determinism is what makes the widget an identity mark rather than a screensaver.

## Verify without eyeballs

- Shader logic is plain math, so **port it to NumPy or PIL and assert on statistics**: mean luminance, percentile spread and local-gradient detail metrics per variant. This catches "all variants render near-black" or "contrast collapsed" without opening a browser.
- **Settle which branch a machine takes by measuring, not by reasoning from documentation.** [scripts/gpu-probe.html](scripts/gpu-probe.html) answers it directly: the strict-context result, whether WebGL exists at all, the live context cap and the blit orientation. Edit `CONTEXT_OPTIONS` at the top of the file to match your component's real options first, because the answer only transfers if the options match. Serve it and read the JSON:

```bash
python3 -m http.server 8000 --directory scripts
```

- What the probe runs, in order: (1) the strict context with your options, the branch decider; (2) a permissive context, `MAX_TEXTURE_SIZE`, and the unmasked vendor and renderer from `WEBGL_debug_renderer_info`, where a renderer matching `/swiftshader|llvmpipe|software|basic render/i` is a software rasterizer; (3) the blit orientation; (4) the context cap: request 40, count those not `isContextLost()`, release each with `WEBGL_lose_context.loseContext()`. The cap test is destructive, so it runs last. MDN on `WEBGL_debug_renderer_info`: it "might only be available to privileged contexts or not work at all. In Firefox, if `privacy.resistFingerprinting` is set to `true`, this extension is disabled" (https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info), which the probe reports as unknown, not as an error.
- **Test the no-GPU path for real**, not by assumption. Point a GPU-less Chrome at the probe, then at your own app; a throwaway `--user-data-dir` keeps it out of the normal profile:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --disable-gpu --user-data-dir=/tmp/nogpu-profile http://localhost:8000/gpu-probe.html
```

- Expect the probe to report `FALLBACK`, then confirm every widget in your app shows its fallback, correctly clipped and painting nothing outside its frame. The two no-GPU states differ: `--disable-gpu` removes WebGL entirely, while the GUI toggle (Settings, System, "Use graphics acceleration when available", off, then restart) usually leaves a software rasterizer that the strict context refuses anyway. Both land on the fallback branch, and the GUI toggle is the exact state the affected users are in. (Chrome's flags and settings were not checked against Chrome's docs.)

### Nonblank canvas proof

[webdown-a, 3d-site] "Verify canvas has nonblack/nontransparent pixels after load"; the rest of its 3D checks (framing on resize, a missing asset, reduced motion, disposal) are in [LAUNCH-SITES.md](LAUNCH-SITES.md#prove-it).

- **Read pixels in the same task as the draw, or from a screenshot.** Drawing-buffer lifetime is defined in [One context, many instances](#one-context-many-instances); later-task reads are not reliable proof of an empty render. The old test topic said they always read empty. [Khronos WebGL 1.0, section 2.2](https://registry.khronos.org/webgl/specs/latest/1.0/)

### Verification with WebGL disabled

Use the [fallback contract](#the-fallback-is-a-production-surface) during verification. [webdown-a, 3d-site; flornkm, webgl-components]

- **A stub that turns WebGL off** (this repo's `drive.mjs --no-webgl`, [isometric-figures templates/isokit/references/verify.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/isometric-figures/templates/isokit/references/verify.md)): every `getContext("webgl")` or `"webgl2"` returns `null`. Run it before the page's own scripts (an init script):

  ```javascript
  (()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...rest){if(/webgl/.test(String(kind)))return null;return get.call(this,kind,...rest)}})();
  ```

  Then check that the content still reads and each scene shows its fallback image or layout [webdown-a, 3d-site: "The content must remain usable if the scene system fails"].
- **A real browser with no GPU, and a `forceFallback` prop for a healthy one** [flornkm, webgl-components]: the Chrome command and the docs-page demo are in [webgl WIDGETS.md](#verify-without-eyeballs) ([the fallback](#the-fallback-is-a-production-surface)).

## Prove it

The source's browser checklist: a list of fifty instances scrolls at 60fps, tab-hidden CPU sits near zero, reduced motion shows a still frame, forced context loss flips to the fallback, `--disable-gpu` shows only fallbacks with nothing painting outside its frame, and a production build serves the page. From the sections above: if you restore, `webglcontextrestored` brings the shader back with its resources rebuilt; `forceFallback` on the docs page shows the hardest fallback shape clipped; the probe's JSON matches the branch you expect on each target machine.
