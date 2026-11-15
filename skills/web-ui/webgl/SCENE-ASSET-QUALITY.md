# Projected geometry, texel density and render resolution

Use this when a scene needs sharper geometry/material detail, stable LODs, high-resolution textures or explicit retina controls. Keep source study budgets separate from measured device limits. Generic color-space, loaders, disposal and drawing-buffer policy remain in [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md) and [LAUNCH-SITES.md](LAUNCH-SITES.md). [MengTo/Skills, 3d-high-poly-models; 3d-high-resolution-textures; 3d-retina-resolution]

## Put detail where it reaches the screen

[MengTo/Skills, 3d-high-poly-models, SKILL.md and REFERENCES.md]

- Separate silhouette/form detail from surface microdetail. Model edges and forms visible at the intended camera; use material maps for detail that does not need geometry, collision or changing silhouette.
- Set physical units, pivots, bevels and smoothing/UV seams deliberately. A scan or a high triangle count does not establish proportion, scale or a good runtime export.
- Swept branches need a stable frame, taper, buried joins and root flare where the selected form calls for them. More radial segments alone do not fix an obvious child-branch seam.
- Preserve an immutable master and a validated runtime GLB. Check loaded bounds, dimensions, origin and materials. Compression reduces delivery bytes; it does not replace geometric simplification.
- Choose LOD by projected size with hysteresis, and partition repeated detail spatially rather than making one uncullable global instance batch. Keep pick/collision proxies independent of the high-detail view.
- Count unique mesh triangles separately from drawn instance triangles and extra shadow/reflection passes. A low unique count can still render costly work many times.
- Prepare the opening/hero assets first, defer distant detail and spread procedural work, decoder jobs, uploads and variant preparation across bounded stages. Profile the full frame on target hardware.

## Estimate texture density from the selected view

[MengTo/Skills, 3d-high-resolution-textures, SKILL.md and REFERENCES.md]

- Use physical display pixels, visible UV fraction and physical scale. The source example showing half a texture tile across 1200 pixels motivates about 2400 pixels for the full tile; it does not make every material a 2400-square asset.
- Align shared-map transforms and normal-map convention. AO/roughness/normal masks are data, color/emissive images are color; reuse the canonical [color-space rules](THREEJS-AND-R3F.md#causes-per-rubric-row).
- **Current UV form:** `Texture.channel` selects 0 for `uv`,1 for `uv1`,2 for `uv2` and 3 for `uv3`. Select the actual AO UV attribute for the installed version; do not copy a legacy unconditional `uv2` rule. [Three.js Texture](https://threejs.org/docs/pages/Texture.html)
- Match mipmaps and atlas padding/color bleed to minification; preserve alpha coverage and check grazing views. Bound anisotropy by renderer capabilities and measured benefit rather than always requesting a source's maximum.
- For weather-driven wetness and the source's metalness correction, use [SCENE-ENVIRONMENTS.md](SCENE-ENVIRONMENTS.md#weather-reuses-pools-and-independent-controllers).
- Cache identity includes asset plus sampling and color-space choices. A file reused with incompatible settings is not the same texture contract. Keep ownership explicit when multiple views/contexts share decoded sources but allocate distinct GPU textures.
- Download bytes, decoded CPU pixels and GPU texture storage are separate budgets. The source 4096-square RGBA8 texture with a full mip chain is about 85.3 MiB from `4096*4096*4*4/3/1048576`, an estimate rather than a driver allocation measurement. WebP file compression does not provide the same GPU storage reduction as KTX2/Basis.
- Prepare opening textures separately from near-view promotion. A WebGL asset's loading priority is not a DOM image `loading` attribute. Spread large procedural bakes rather than blocking first interaction with one enormous canvas operation.

## Make resolution controls tell the truth

[MengTo/Skills, 3d-retina-resolution, SKILL.md and REFERENCES.md; existing webgl, THREEJS-AND-R3F.md]

| Control meaning | Effective relation |
|---|---|
| Fixed 200 percent |Two physical buffer pixels per CSS pixel in each dimension |
| Source automatic cap 2 |Minimum of native DPR and 2 |
| Twice native density |Two times native DPR; native DPR2 therefore gives DPR4 and 16 times CSS pixel area |

State which meaning the interface uses. Increasing render resolution cannot replace missing texture detail or a low-resolution shadow map.

The source demonstrates `setPixelRatio` paths. Existing repo policy keeps explicit drawing-buffer sizing and a pixel-count cap, following the Three.js responsive manual; retain that policy rather than multiplying both requested dimensions and renderer DPR. [THREEJS-AND-R3F.md](THREEJS-AND-R3F.md#resize-and-pixel-ratio)

Synchronize renderer, composer, camera and custom targets using their actual physical dimensions. Shader resolution uniforms describe the texture being sampled, which may be reduced-resolution; pointer normalization uses the CSS canvas rect, while GPU readback/picking uses its target's physical coordinates.

Coalesce ResizeObserver work, avoid allocating a zero-sized hidden target and retry when it reappears. DPR can change while CSS width/height remain fixed. Check actual limits and full pass allocation before applying a requested tier, then dispose replaced owned targets.

Fixed quality and adaptive quality are separate promises. An adaptive mode can use measured thresholds and hysteresis; a fixed 200 percent control cannot silently mean a lower density while still displaying the original claim. Reduce expensive post targets before reducing a specifically requested main resolution when that ordering fits the selected quality contract. Under reduced motion, an on-demand still keeps the chosen sharpness.

## Prove it

Inspect intended near/far/grazing views and silhouette, export units/bounds/pivots and runtime materials. Report unique and drawn work, projected LOD transitions and actual texture/GPU budgets. Change CSS size, DPR/zoom, quality and hidden/reappearing layout; all physical targets, pointer/readback coordinates and camera projection remain coherent without double scaling. Check full-density stills and actual target hardware separately from source budget estimates. [MengTo/Skills, 3d-high-poly-models; 3d-high-resolution-textures; 3d-retina-resolution]
