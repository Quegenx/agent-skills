# Cloth, paper and procedural timber

Use these branches for a selected material study that must hold in both overview and macro. They preserve how shared fields drive color, roughness, relief, transmission and edges; they do not prescribe the source workshop's palette, camera or dark-room art direction. The cloth and paper studies use Three.js r169 with WebGL `MeshPhysicalMaterial` patches; timber uses a shared periodic data field. [MengTo/Skills, 3d-cloth-material; 3d-paper-material; 3d-wood-material; 3d-wood-lighting-scorecard]

## Keep the renderer contract

[MengTo/Skills, 3d-cloth-material; 3d-paper-material; 3d-wood-material; existing webgl]

The canonical [color, disposal and renderer audit](THREEJS-AND-R3F.md) still applies. Material bakes are data, normally `NoColorSpace`; final tone mapping and output conversion happen once. `OutputPass` normally finishes a WebGL post chain; an sRGB-input pass such as FXAA follows it. [Three.js OutputPass](https://threejs.org/docs/pages/OutputPass.html)

`onBeforeCompile` and `customProgramCacheKey` belong to `WebGLRenderer`. A cache key identifies settings that change generated shader code so the engine can reuse or recompile as needed. The source's claim that a key alone prevents shader sharing problems or all recompilation is too broad; keep each material's uniform ownership and actual generated-code variants explicit. The callback is not copied/serialized as an ordinary material data property. [Three.js Material](https://threejs.org/docs/pages/Material.html)

For `scene.environment`, the scene's `environmentIntensity` controls that environment; an explicit material `envMap` is a different ownership path. Do not tune an intensity without identifying the selected path. The sources describe an r163+ distinction; preserve the installed version's actual behavior rather than treating source version statements as future API guarantees. [Three.js Scene](https://threejs.org/docs/pages/Scene.html), [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)

## Cloth: material coordinates survive folds

[MengTo/Skills, 3d-cloth-material, SKILL.md and demo.html]

- Integrate a cross-section's tangent angle: the source advances `x += ds*cos(alpha)` and `z += ds*sin(alpha)`, with UVs in rest metres `(s,v)`. Do not rebuild UVs from the moving surface. This is an analytic hanging-drape construction, not self-colliding cloth simulation; a colliding cape/flag needs a simulation/bake appropriate to that job.
- The source angle signal includes `a*(sin(theta)+0.16*sin(2*theta+0.8))`; its study keeps `abs(alpha)<1.45` radians and recommends `a*env*1.28<1.45` to avoid clamped flat plateaus. **Source error:** its heightfield arc-length statement uses `1+slope²` as length. For a smooth height graph, the arc element includes the square root, `ds=sqrt(1+(dz/dx)^2)*dx`; keep the source percentage-stretch claim unverified. [OpenStax Calculus Volume 2, Arc length](https://openstax.org/books/calculus-volume-2/pages/2-4-arc-length-of-a-curve-and-surface-area)
- Bake warp/weft interlacement, not an undirected noise normal: plain uses `(A+B)&1`, twill 2/1 `(A+B)%3<2`, and five-harness satin `(2*A+B)%5!=0` for warp-over. Tile thread count must be a multiple of the interlacement repeat to avoid a seam.
- The source thread width varies 0.80 to 0.97 with Gaussian slub up to 0.34. Twist adds `0.22*twist*sin(2*pi*(5*along+1.3*across))`, with twist 0.10 to 0.14 for linen/wool and 0 for silk. These are source bake parameters, not physical textile standards.
- Use separate warp/weft dyes, per-thread tone and cavity, plus slow blotch and warp-direction streaks. The source combines them as `mix(warpDye,weftDye,weftOnTop*shot)`, tone 0.86 to 1.14, cavity 0.5 to 1, and a variation contribution `var*((blot-0.5)*0.62+(streak-0.5)*0.22)`. Its silk shot is 1 and other stocks 0.
- Keep sheen color tied to the lightened dye rather than near-white. The source multiplies it by 0.62. Sheen and anisotropy features crossing zero may select shader variants; prewarm actual required variants rather than assuming a source's measured 200ms hitch is portable.
- Fold valleys need coherent direct shadows and indirect occlusion. The source vertex AO is `0.62+0.38*smoothstep(-0.075,0.035,zFold)`; its `normalBias0.012` and `bias-0.0004` belong to that scene's scale/light, not a replacement for the [shadow audit](THREEJS-AND-R3F.md#causes-per-rubric-row).

Source fabric recipes, for reconstructing this study rather than classifying every real fabric:

| Parameter | Linen | Silk | Wool |
|---|---|---|---|
| Interlacement / tile threads / pitch | plain /32 /1.6 mm | satin /40 /0.7 mm | twill /24 /2.6 mm |
| Normal strength times normalScale |2.6 times 1.15 |1.5 times 0.6 |2.9 times 1.45 |
| Roughness / sheen / sheen roughness |0.90 /0.55 /0.55 |0.36 /0.5 /0.28 |0.96 /1.0 /0.82 |
| Fold wavelength / maximum angle / wind gain |0.34 m /0.98 /1.0 |0.40 m /1.02 /1.9 |0.32 m /0.86 /0.55 |
| Free edge |3 cm raw fray |3.5 cm hem |5 cm hem |

For the periodic tile, the source sets texture repeat from `1/(threads*pitch)`. Its cloth is 2.0 by 1.95 m on a 160 by 120 grid. These densities are candidates to measure at the intended framing, not a floor for other garments.

### Cloth edges, stitches and transmitted light

[MengTo/Skills, 3d-cloth-material]

- Turn free edges under on a half circle: `P=edge+out*r*sin(phi)-N*r*(1-cos(phi))`, with `phi` from 0 to 0.94*pi. Study radii are 1.1 mm silk, 2.2 mm linen and 4.6 mm wool; its bottom return sits at `2*r+0.2mm` with flipped normals. Choose triangle winding consistently with the attribute normal.
- Stitch in rest metres. The source thread arch `4*x*(1-x)` occupies 74 percent of pitch; groove and pucker feed finite-difference normal detail faded with `fwidth`. It places a hem 3 cm up, sides 2.2 cm in and seam ridges at plus/minus 7 mm, puckering every four pitches. Geometry stitches can z-fight/alias; a flat painted stripe does not recover these normals.
- A raw edge removes weft and retains warp strands: `abs(fract(u/pitch)-0.5)<0.36`; each strand length varies as `F*(0.3+0.7*hash)`. A generic alpha fringe lacks the selected thread structure.
- Thin transmission follows gaps and stock. The study's angular term is `pow(max(0,-NdotL),1.15)`, gap `mix(1,0.42,height)`, and stock gains silk 1.05, linen 0.6 and wool 0.06. It uses dye tint multipliers 1.7/1.2/0.85 to avoid multiplying two excessively warm colors. This emissive approximation is a selected shader technique, not a general scattering model.
- Wear favors thread tops, hems and crests: the source begins with `clamp(aWear*(0.25+height)+(fbm-0.5)*0.3,0,1)`, adding 0.4 at hems and 0.3 at crests. Keep wear separate from a uniformly paler dye.

## Paper: one field, torn outline and thickness

[MengTo/Skills, 3d-paper-material, SKILL.md and demo.html]

- Bake once into packed data: R height, G formation, B fibre and A fleck. Source height is `0.5+fibre*0.34+(tooth-0.5)*0.1-fleck*0.2-crease*0.55`. Its half-float target uses no MSAA and mipmaps; its reported blocky-resolve incident is not a blanket ban on half-float multisampling.
- Domain-warp lattice coordinates by 0.014 unit and rotate by `(gnoise(q*2.1)-0.5)*1.5` radians; add a fainter 2.7-times-frequency fibre set capped at 0.55. Unwarped orthogonal ridges can read as scratched glass; the study found 1.9 radians too floral.
- Paint a separate packed mask: R thin inner tear strip, G silhouette/fray, B ink/bleed halo, A edge age. The source merges actual canvas pixel data into a `DataTexture`, with declared row orientation and alpha as data, rather than accidentally premultiplying independent channels through an ordinary color texture.
- Shape bow, crease, pin dimples and the selected cylindrical roll; stack three copies behind the front at one-third, two-thirds and full thickness along the normal. The isolated curl construction does not prove the combined bow/crease surface is globally length-preserving.
- Formation and fibres co-drive albedo, transmission and ink. The source transmission shape is `0.74+(0.5-form)*0.85+(0.5-lowfbm)*0.45-fibre*0.22-fleck*0.45`, scaled by stock, increased at thin strip and reduced by ink. It samples the selected scene behind the paper; that is separate from a full physical transmission solution.
- Use four independent tear lines, with partial-coverage fibres extending beyond the cut. Source torn-side amplitudes 60 to 100 versus cut-side 3 to 4, and fibres 0.3 to 0.7 px wide at 30 to 75 percent alpha, belong to its mask resolution.
- Guard ink wicking near actual ink: the source combines `smoothstep(0.62,0.85,halo+fibre*0.4+(0.5-form)*0.5)` with `smoothstep(0.03,0.16,halo)`. Without the guard, unrelated distant fibres darken. Fade edge toast out before the pulled fibres become brown-black.
- **Official correction:** paper bark flecks use descending `smoothstep(0.5,0.12,...)`; GLSL leaves reversed/equal edges undefined. Use an ordered-edge transition and invert its result for a falling ramp. The same source error appears in the water and wood-light shaders. [Khronos smoothstep](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml)

Paper recipes from this study, where 1 unit is 134.8 mm:

| Parameter | Washi | Cotton rag | Kraft |
|---|---|---|---|
| Fibre lattices A / B per unit |1.9 by 54 /44 by 2.3 |15 by 17 /16 by 14 |7 by 26 /26 by 7 |
| Fibre relief / bump height |0.55 /0.0017 |0.32 /0.0024 |0.8 /0.0034 |
| Tooth frequency / amplitude |230 /0.09 |430 /0.17 |300 /0.20 |
| Laid lines per unit / amplitude / chain |110 /0.28 /0 |150 /0.55 /0.5 |none |
| Thickness / transmission |0.0045 /1.0 |0.0085 /0.42 |0.011 /0.16 |
| Roughness / sheen |0.93 /0.4 |0.9 /0.25 |0.96 /0.10 |

The source base bake is 990 px/unit, about 7.3 px/mm; macro uses 1536 px across a 0.5-unit focus window, about 22.8 px/mm. Re-bake the visible focus window and blend at its edges instead of magnifying a low-density map or tiling a tiny paper image. Its source plane 168 by 240 and repeated layers are local geometry choices.

Partial fibres need a coverage strategy. The source uses alpha-to-coverage for the visible surface and a separate cutout depth material for shadows. **MSAA condition:** alpha-to-coverage requires a multisampled draw target; renderer `antialias:true` alone does not make every post target multisampled. `RenderTarget.samples` controls that target, and 0 disables it. `alphaMap` samples green for RGB/RGBA maps, not their alpha channel. [Three.js Material](https://threejs.org/docs/pages/Material.html), [RenderTarget source](https://github.com/mrdoob/three.js/blob/dev/src/core/RenderTarget.js), [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)

## Timber: shared grain drives all material channels

[MengTo/Skills, 3d-wood-material, SKILL.md and demo.html]

- Keep stock lighting, shadow and IBL behavior while patching albedo, roughness and derivative bump for the selected WebGL renderer. Source starting values are roughness at least 0.43, IOR 1.43 and specular intensity 0.72; its roughness factor clamps to 0.35 through 1.
- Bake a shared 1024-square periodic `NoColorSpace` field, period 64, three octaves weighted 0.60/0.27/0.13 plus a shifted copy. Repeated timber shares this field; stable per-board seeds and object-space offsets provide variety without separate textures.
- Declare the log axis. Along-axis fibres become open pores on cut faces; the source endgrain weight is `pow(abs(nDotAxis),6)`. Drift the pith, vary annual ring widths and off-axis distance to distinguish cathedral arcs from straighter quarter-sawn grain.
- Co-drive albedo, roughness and height from latewood, pores, fibres, medullary rays, checks, knots and tool marks. Fade each fine layer by the derivative footprint of its own coordinate, and fade bump earlier than color if relief aliases.
- The source layer gains are pores tone+0.25/roughness+0.19/height-0.42; fibres tone-0.16/height+0.09; rays pale-tone+0.26/roughness-0.075; checks height-0.20; knot core tone+0.44; tool height+0.045 times its control. These are coupled study parameters, not measured wood properties.
- Clamp the derivative bump gradient before steep steps invert a normal. The source clamps at 0.38 times the absolute determinant and uses bump gain times 0.020.
- Finish changes parameters rather than replacing the field: raw clearcoat 0; oil uses `pow(rgb,1.16)`, roughness times 0.88 and clearcoat 0.10/roughness 0.55; wax 0.22/0.38; the selected lacquer 0.42/0.40 with darkened end grain and rubbed-back arrises.
- Round the arris for a visible edge highlight. Source radius is minimum side times 0.055 with three to five segments, bounded by 0.24 of any side. Keep physical contact with the support rather than hiding a gap in a larger shadow bias.
- Ring frequency is per model unit. Source ring spacing is about 2 to 5 mm at its selected scale; copying a frequency between differently scaled scenes makes broad stripes. Keep per-board seeds stable when species/finish changes.

Selected workshop species recipes:

| Species | Roughness | Grain control | Ring frequency | Off-axis | Detail |
|---|---|---|---|---|---|
| keyaki |0.62 |1.5 |20 to 34 |0.75 |rays 0.35, bump 0.10 |
| sugi |0.58 |1.8 |8 to 30 |2.8 |tool 0.30 |
| hinoki |0.44 to 0.50 |2.2 |6 to 42 |1.6 |low-contrast close grain |
| kuri |0.55 |3.0 |5 to 22 |1.4 |rays 0.5, checks 0.10 |
| charred siding |0.97 |0.8 |9 |0.55 |rays 0, checks 0.30 |

The 1024-square field starts to soften at the source's macro density around 2500 to 4000 px/unit at grain 1. Increase field resolution or the chosen grain scale rather than rescaling the physical mesh. The source suggests 2048 for hero surfaces. Its statement that photo textures always fail is art direction; use photographed/scanned species when the brief needs them. One demo thickness label also conflicts with its geometry/scale; derive dimensions from the actual declared units.

## Wood lighting and a scoped scorecard

[MengTo/Skills, 3d-wood-lighting-scorecard, SKILL.md; demo.html; references/metrics.js; references/rubric.md; references/scorecard.mjs]

For this dark-room study, align the visible window, key direction, authored shaft planes and environment window reflection. A grey environment can hide selected roughness variation; a reflected window in the wrong direction creates an incoherent scene. This is one lighting brief, not proof wood only reads under one directional key.

The source uses a linear half-float target with 4 samples, one final tone/output pass, a key 2.0, fill 0.60, rim 0.72 and hemisphere 0.19. At shadow maps 4096/2048 it tunes normal bias 0.0045/0.0085 and bias -0.00025. Static shadows can stop updating only while relevant objects/lights remain static. All these values depend on scene units and selected framing.

Authored shafts add linear light before tone mapping. Fade at solid intersections and world height; clamp inputs before noninteger powers. If the output is alpha-composited, preserve destination alpha in additive passes; the source's blend recipe uses RGB source/destination One/One and alpha Zero/One. Its final dither is 0.003 peak-to-peak after sRGB encoding. Reversed-edge smoothsteps in its shader need the correction above.

The source scorecard freezes time/camera, captures at a fixed viewport/DPR, records a baseline and ablates each layer. Inspect a matched crop after every metric-driven change: its own examples raised a number while making wood look worse. A fresh visual review with the rubric can be useful, but source scores and a target 8 are not calibrated measures of realism. Its inverse-transfer display-luma metric is a proxy rather than true linear luminance, and unclamped/empty region handling must not be copied as a general image verifier. Frame cost with synchronous readback is not live frame pacing.

## Prove it

For the selected material, match overview and macro views, still and motion, silhouette/edge, front/back, raking light and transmission. Cloth UVs stay fixed in material coordinates; paper fibres, thickness and ink survive the chosen scale; timber grain follows the declared axis and its fine layers stop shimmering at distance. Color/data/output ownership and shader variants are explicit. Reduced motion keeps a composed still with working controls; hidden/resume, resize and teardown follow the existing live-page contract. Report source-reported timings and scores separately from checks actually performed. [MengTo/Skills, 3d-cloth-material; 3d-paper-material; 3d-wood-material; 3d-wood-lighting-scorecard; existing webgl]
