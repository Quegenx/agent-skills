# 3D launch pages

[webdown-a, 3d-site] A product-launch microsite built around a sticky WebGL scene: full-viewport editorial storytelling, per-section 3D scenes, dense update content, precise navigation and robust fallbacks. It is a build skill with a plan file up front, not an audit. The source's own instruction: recreate the system (scene architecture, editorial hierarchy, asset pipeline, motion discipline, performance constraints), never a company's branding or protected content. Its three.js loader lines were checked against threejs.org and r3f.docs.pmnd.rs; corrections carry the URL.

**Contents:** [Where the owner's landing page differs](#where-the-owners-landing-page-differs) · [Two systems](#two-systems) · [Failure layers and state](#failure-layers-and-state) · [Content model](#content-model) · [Shell, navigation and layout](#shell-navigation-and-layout) · [Visual system](#visual-system) · [The scene contract](#the-scene-contract) · [Loaders](#loaders) · [Models and budgets](#models-and-budgets) · [Camera, light, particles, post](#camera-light-particles-post) · [Quality tiers](#quality-tiers) · [Asset pipeline](#asset-pipeline) · [The blueprint](#the-blueprint) · [Prove it](#prove-it)

## Where the owner's landing page differs

The owner's own marketing site is [landing-page-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md); on that site its rules stand. Where this source disagrees:

- Header: the source says "about 50-60px"; landing-page-ui has "header height about 5.1rem (4rem compact)" ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)).
- Mobile nav: the source uses "a full-height overlay with large section labels"; landing-page-ui: "**The menu grows out of the bar:** closed, the nav is the bar's height" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)).
- Buttons: the source says "compact rounded rectangles, about 4px radius unless the site design system says otherwise"; landing-page-ui has "**Pill buttons in three heights:** large 3rem" ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)).
- Hero: the source wants "a full-bleed scene or rich media background, not a split card layout"; landing-page-ui: "**The home hero sits in its own rounded card,**" ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md)).
- Cards: the source says "max 8px radius"; landing-page-ui has "2rem panels, 1.5rem cards" ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md)).
- Reduced motion: the source removes "orbiting, large translate, scroll-scrubbed animation, and shader-heavy transitions"; landing-page-ui keeps its reveal: "**The reveal runs the same under reduced motion:** the blur and fade play whatever the setting" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)). The source's list does not name blur-fade reveals, so both hold for a 3D scene.

## Two systems

Treat the site as two coordinated systems:

- **Content system:** release metadata, section taxonomy, navigation, search, update cards, CTAs, SEO.
- **Scene system:** sticky canvas, per-section scene components, compressed assets, camera and light presets, render quality, transitions, fallbacks.

"The content must remain usable if the scene system fails." For a new build the source prefers React with Vite or Remix-style routing, Tailwind or a tokenized CSS layer, Three.js with React Three Fiber, `GLTFLoader` + `DRACOLoader` + `KTX2Loader`, and a lightweight scene configuration object per section; "Use the existing project stack when one exists", and "Avoid hand-rolling core 3D asset loading or compression behavior when Three.js loaders already solve it." Load the scene code with a dynamic `import()` ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).

## Failure layers and state

- The page must degrade in layers: 1. full WebGL scene; 2. static fallback image or video per section; 3. plain content layout with text and cards. "Any asset-loading error should affect only its scene, not the whole page."
- "Keep content readable without JavaScript. The hydrated experience can enhance search, transitions, and WebGL."
- "Do not make the WebGL canvas the only place where information exists." Each scene has textual content outside the canvas.
- Fallbacks "must be visually aligned with the full scene, not generic placeholders". The widget version of this rule: [WIDGETS.md](WIDGETS.md#the-fallback-is-a-production-surface).
- Keep state explicit: active section index, navigation theme, sidebar theme, search open state and query, render quality `high | medium | low`, reduced motion, WebGL availability, scene loading state. "Do not let visual state live only inside animation callbacks." Scroll-driven animation itself: [gsap SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/gsap/SKILL.md).

## Content model

Data-first: render the hero and every section from one array. The source's schema, verbatim:

```ts
type ReleaseSection = {
  id: string;
  navLabel: string;
  eyebrow?: string;
  title: string;
  summary: string;
  theme: "dark" | "light";
  scene?: SceneConfig;
  updates: ProductUpdate[];
};

type ProductUpdate = {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  media?: MediaAsset[];
  cta?: { label: string; href: string };
};
```

Choose the section taxonomy from the product (the source's list is one industry's). "If search backends are unavailable, implement local search over the update schema."

## Shell, navigation and layout

- A normal app shell, not an iframe, "unless the user specifically needs iframe embedding": a fixed or sticky `<header>` with release identity, release picker, search and primary CTA; an `<aside>` section nav on desktop, collapsible or hidden on mobile; `<main>` with the hero and release sections; a sticky full-viewport scene layer behind or beside the content; a static fallback media layer beneath the canvas.
- The release mark links back to top. The section sidebar uses ordered labels (numbered or roman numerals), active-state highlighting and theme-aware contrast; the active item "must be visible by color and position, not only animation". Nav and sidebar take the theme of the section under them (`theme: "dark" | "light"`).
- Search supports keyboard navigation, Escape to close, clear and reset, and empty states. Keyboard patterns: [web-accessibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md).
- Layout rhythm: hero at full viewport minus a hint of the next section; the scene canvas sticky at the top, full viewport, "pointer events only where needed"; major chapters `min-height: 100svh`, denser sections 60-80svh; an update grid of 1, 2 or 3 columns with stable card dimensions; editorial interludes of large display text, simple body copy and few controls. Full-width bands with constrained inner content; no nested card structures.
- The first viewport shows the release identity, immersive 3D or rich media, and a visible path into the next section: the release or product name, the category or launch idea, a one-sentence promise, a primary CTA or exploration path, and a cue that more sections follow. "No marketing-only hero. The first screen must be the actual product-launch experience."
- Each chapter pairs one strong title, a concise explainer, update cards or feature rows, optional media, and an optional scene state.

## Visual system

- Three type layers: a display serif or custom face for release identity and chapter titles; a grotesque sans for navigation, buttons, cards and copy; an optional script accent "for one or two brand moments only". Negative letter spacing only on large titles, never globally, and verify mobile fit.
- Palette method: a dark stage, a warm off-white paper surface, ink, a muted panel, a focus color, and "one sharp color per release chapter". "Avoid a page dominated by only purple, beige, dark blue, or brown/orange. Scene lighting can use saturated accent colors, but UI surfaces should remain legible." Build the actual values in [color-system SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md).
- Motion "to orient, not to decorate": nav items enter with a short staggered translate and opacity; section transitions crossfade or wipe between scene render targets; linework draws in once, then settles; hover is quick and reversible. Numbers for these: [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).
- Reduced mode removes "orbiting, large translate, scroll-scrubbed animation, and shader-heavy transitions while keeping content hierarchy." "Never make text hard to read because of camera drift."
- Accessibility: skip link, keyboard-operable search, menus and cards, Escape closes overlays, visible focus ring, sufficient contrast in both nav themes, "No motion-only navigation."

## The scene contract

Scene components take data. The source's type, with its fourth scene name (the analyzed company's product) renamed:

```ts
type SceneConfig = {
  id: string;
  component: "hero" | "product" | "abstract" | "assistant";
  camera?: CameraPreset;
  lights?: LightPreset[];
  assets?: SceneAsset[];
  particles?: ParticlePreset;
  environment?: string;
  fallbackImage: string;
};
```

Each scene must:

- render without needing page content state except section index and config
- expose a camera
- dispose geometry, materials and textures on unmount. In R3F, JSX objects are disposed for you on unmount; `<primitive>` objects and anything created outside JSX are yours ([THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#disposal))
- handle missing assets without throwing outside the scene boundary
- be visually meaningful within 1-2 seconds

The pattern the source observed: per-section scene components (hero, product, abstract) with shared camera, light, particle and effects components, and one sticky canvas renderer that crossfades between the active sections' render targets, with GPU and FPS detection, a quality downgrade, and static fallback images when WebGL is missing. One renderer for the whole page is also the widget rule: [WIDGETS.md](WIDGETS.md#one-context-many-instances).

## Loaders

Use loaders, not ad hoc fetch parsing. "Cache loaders and textures. Do not create a new loader for every render frame."

- `GLTFLoader` for `.glb` and `.gltf`.
- `DRACOLoader` for compressed geometry. Point it at a local or public decoder path, a CDN only when network use is allowed. threejs.org: `setDecoderPath(path)` is current and `setDecoderConfig` is deprecated; "It is recommended to create one DRACOLoader instance and reuse it to avoid loading and creating multiple decoder instances"; the loader picks JS or WASM by itself (https://threejs.org/docs/pages/DRACOLoader.html).
- `KTX2Loader` for compressed textures: bundle the Basis transcoder or use a stable CDN path. `detectSupport(renderer)` "Must be called before loading a texture"; the docs' sample is `loader.setTranscoderPath( 'examples/jsm/libs/basis/' ); loader.detectSupport( renderer );`. `detectSupportAsync` is deprecated. The loader has `.dispose()` and `.setWorkerLimit()` (https://threejs.org/docs/pages/KTX2Loader.html).
- Environment maps: `HDRLoader` or a KTX2 PMREM texture. The source names `RGBELoader`, which is stale: three.js renamed it `HDRLoader` in r180 (migration guide, "179 → 180", https://github.com/mrdoob/three.js/wiki/Migration-Guide). `import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'`, "A loader for the RGBE HDR texture format" (https://threejs.org/docs/pages/HDRLoader.html).

## Models and budgets

- One hero model or a small set of grouped assets. Keep real product surfaces inspectable; "avoid over-dark, blurred, or purely atmospheric presentation". Origin-centred models at real-world scale. Name the important nodes for camera targets and animation hooks. "Bake static details into textures; keep geometry for silhouette and interaction."
- Budgets: hero GLB 1-5 MB compressed when possible; supporting GLB under 2 MB each; textures 1024-2048px for most assets; KTX2/Basis for GPU textures; Draco for dense static meshes; "Avoid hundreds of separate draw calls." R3F's own ceiling is in [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#p2-per-render-or-per-interaction-waste).

## Camera, light, particles, post

- **Camera:** named presets (hero front three-quarter, product closeup, orbit debug, section transition target). Pointer gaze: interpolate the pointer's influence, clamp pan and tilt, disable or reduce it on touch and under reduced motion. GSAP's `quickTo` is one way to interpolate a pointer follower ([gsap PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/gsap/PERFORMANCE.md#frequently-updated-values-gsapquickto)).
- **Lighting:** environment lighting as the base; point or area lights only for emphasis. Common setup: a PMREM environment, a key light, a rim or accent light, an optional low-intensity fill. "Avoid high-intensity colored lights that hide material detail"; keep coloured accent lights controllable per scene. Metals need that environment: [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#causes-per-rubric-row).
- **Procedural elements:** particles (energy fields, dust, sparks, data points), instanced meshes for repeated small objects, shader planes for texture and linework. Keep uniforms explicit and easy to tune: time, opacity, color, size, speed, turbulence, count. Stop or simplify them under reduced motion and low quality.
- **Post-processing:** render targets for the current and next scene, a crossfade shader, an overlay shader, optional bloom, an optional inverted, edge or Sobel effect. "Post processing must never be required for legibility. Disable bloom or heavy effects on low quality."

## Quality tiers

Detect WebGL support, device pixel ratio, viewport size, reduced motion, and measured FPS after initial load.

| Tier | Source rule |
|---|---|
| high | 60fps target, DPR capped at 2, full post-processing |
| medium | DPR capped by viewport budget, moderate particles |
| low | 30fps target, no bloom, fewer particles, fallback media acceptable |

"If FPS stays below target, downgrade once and keep the page stable." In R3F the official form is drei's `PerformanceMonitor`, whose `onFallback` fires once and then "PerformanceMonitor will shut down" (https://r3f.docs.pmnd.rs/advanced/scaling-performance; details in [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#from-the-r3f-docs)). How to choose the cap itself: [WIDGETS.md](WIDGETS.md#resolution-and-dpr) and [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#resize-and-pixel-ratio).

## Asset pipeline

Write an asset manifest before coding. The source's type, verbatim:

```ts
type AssetManifestItem = {
  id: string;
  type: "model" | "texture" | "image" | "video" | "font" | "icon" | "json";
  src: string;
  fallback?: string;
  budgetKb?: number;
  owner?: string;
};
```

Keep remote URLs replaceable; for production prefer local or public assets the project controls unless the user wants CDN-hosted ones.

- **Models:** `.glb` for complete packages, Draco for dense geometry, KTX2 textures where feasible, named animation clips when motion is needed.
- **glTF export checklist:** units and scale are correct; the pivot or origin supports the intended camera motion; meshes and important empties are named; materials are PBR-friendly; hidden helper geometry is removed; animations are trimmed to useful ranges.
- **Textures:** KTX2/Basis for GPU delivery; JPG, WebP or AVIF for fallback rasters (the repo's browser guide standardizes on WebP: [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#images-and-video)); PNG "only for alpha or pixel-accurate UI assets"; SVG for simple icons and linework. "A beautiful scene with late-loading 8K textures is a failed site."
- **Environment maps:** PMREM-ready; 1K for the web; intensity adjustable per scene; a neutral studio unless the scene needs a place; "Do not use the environment as the only background if fallback imagery matters."
- **Images and video:** desktop and mobile crops, the subject inspectable, poster images for videos, lazy loading below the fold; an Open Graph image, favicon and touch icon.
- **Fonts:** only the weights used (display 1, sans 1-2, accent 1), `font-display: swap`, and "Confirm text remains acceptable before custom fonts load."
- **Per-scene fallbacks:** a static fallback image, an optional lightweight video fallback, and textual content outside the canvas.

## The blueprint

Fill this before coding (the source's template, with its industry-specific update categories left as a blank list):

```md
# Site Blueprint

## Release

- Name:
- Tagline:
- Audience:
- Primary CTA:
- Secondary CTA:

## Visual Direction

- Stage/background:
- Paper/light surface:
- Accent colors:
- Typefaces:
- Motion personality:

## Sections

| ID | Nav label | Title | Theme | Scene | Updates |
| --- | --- | --- | --- | --- | --- |
| hero |  |  | dark | hero |  |

## Scene Assets

| ID | Type | Source | Fallback | Budget |
| --- | --- | --- | --- | --- |

## Update Categories

- 

## Fallback Strategy

- WebGL unavailable:
- Reduced motion:
- Low FPS:
- Missing model:

## Verification Targets

- Desktop:
- Mobile:
- Canvas:
- Accessibility:
```

Build order from the source's checklist: app shell (header, mobile nav, aside nav, main sections); content schema; hero and sections rendered from data; local search or filter over the update data; sticky scene layer with fallbacks; per-section scene config; GLTF, Draco and KTX2 loading if 3D assets exist; reduced-motion and low-quality modes; SEO, meta and social image tags.

## Prove it

- **UI and canvas:** use the [responsive checks](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/RESPONSIVE-CHECKS.md) and [nonblank-canvas proof](WIDGETS.md#nonblank-canvas-proof). The source's four-size list is unavailable in this copy; do not treat the separate responsive-craft list as that source list. [webdown-a, 3d-site; local source-coverage review]
- **3D:** the model or fallback is visible and framed in desktop and mobile screenshots; the DPR cap works; resize keeps the camera framing; reduced motion disables heavy movement; low quality cuts particles and post-processing; a missing asset breaks only its scene; when scenes mount dynamically, geometries, materials and textures are disposed on unmount (`renderer.info.memory` stays flat, [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#disposal)); no large uncompressed textures ship.
- **No WebGL:** the fallback layers render with WebGL removed (the stub and `--disable-gpu` in [WebGL verification](WIDGETS.md#verification-with-webgl-disabled)), and the content is readable with JavaScript off.
- **Completion:** run the project's lint, build and tests; start a dev server if the app needs one; capture desktop and mobile screenshots; report the exact files changed and the checks run.
