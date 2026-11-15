# Ocean surfaces, underwater shafts and sky rays

Use the branch matching where light is sampled: an ocean surface above water, a world-space light field under water, or an occlusion-aware screen-space sky-ray pass. The source open-ocean and underwater modules target Three.js r169/r170 WebGL; their parameters and reported A/B results belong to supplied scenes. Keep the installed renderer/backend and the project's own Three.js instance. [MengTo/Skills, 3d-ultra-realistic-water; 3d-underwater-god-rays; 3d-sky-rays]

## Select the mechanism

[MengTo/Skills, 3d-ultra-realistic-water; 3d-underwater-god-rays; 3d-sky-rays; 3d-wood-lighting-scorecard]

| Selected scene | Mechanism |
|---|---|
| Open sea with moving camera, sun and horizon | Gerstner displacement with analytic per-pixel derivatives and per-wave footprint fading |
| Camera under water, shafts sliding against fish/world | Sample a shared swell field perpendicular to sun direction and integrate along view rays |
| Sun through roof/foliage gaps | Radial screen-space accumulation from a sky-visibility mask |
| Selected interior window study | Authored shaft planes in [MATERIAL-STUDIES.md](MATERIAL-STUDIES.md#wood-lighting-and-a-scoped-scorecard) |
| Mirror-flat water without a mesh | Selected full-screen analytic plane |
| Small reactive pool | Selected ping-pong height field |

The last two are source routing boundaries, not implementations supplied here. Screen-space sky rays are an approximation and do not implement the underwater world-volume sample field; the underwater source's broader claim that screen-space effects cannot show any parallax is not adopted.

## Ocean: one spectrum for displacement, light and buoyancy

[MengTo/Skills, 3d-ultra-realistic-water, SKILL.md; assets/ocean.mjs; references/ocean.md]

- Shade from analytic derivatives of the same Gerstner sum that displaces the mesh. Interpolated coarse vertex normals cannot retain the selected near-to-horizon glitter and foam detail.
- Fade each wave by its own projected footprint in both displacement and fragment shading. The source uses `1-smoothstep(0.18*L,0.5*L,footprint)`, vertex footprint 1.2 times ring spacing and pixel footprint twice the sum of horizontal-coordinate `fwidth`s.
- The source nonuniform grid is centered under the camera: `r=11.92*(exp(0.033*i)-1)`, spacing approximately `0.033*(r+12)`. Its 210 rings and 400 segments reach about 12.2 km; preserve the idea of projected detail allocation instead of imposing this mesh on every sea.
- Advance CPU wave phases before querying surface height. Then update floating objects, wake, reflection and the main render in that order. A separate buoyancy wave or mismatched time makes objects detach from visible crests.
- Horizontal displacement means querying height at a world position requires an inverse, not simply reading vertical displacement at that coordinate. The source uses four fixed-point iterations. Its convergence/tolerance is an approximate source solver, not a guarantee at every steepness.
- Its Q is a particular dimensionless horizontal-displacement parameter: source total 0.77 and sea-state cap 0.95 below 1. Keep the amplitude/steepness parameterization when checking this bound; do not generalize a bare sum-Q rule to differently parameterized Gerstner systems.
- Wrap phases on the CPU with its float64 time/offset calculation and rebase all world owners together. The source's phase-precision concern is reasoning, explicitly not an observed long-duration failure in its demo.

Source ocean recipe, not a portable budget:

| Layer | Selected parameters |
|---|---|
| Spectrum |8 waves; wavelength 78 down to 3.1 m, factor 0.63; amplitude 0.8 down to 0.02 m; heading offsets 0,+23,-17,+38,-31,+12,-49,+64 degrees; deep-water `omega=sqrt(g*k)` |
| Micro detail |512-square bake,48 integer-wave-vector sines with amplitude proportional to `abs(k)^-1.35`; scales 19 m and 7.3 m, second rotated 90 degrees; strength `0.4*exp(-d/500)+0.08` |
| Reflection |Schlick F0=0.02; source 256-square sky cube refreshed every 0.25 s, plus half-resolution planar reflection |
| Body |Linear deep color 0.006/0.03/0.048 and scatter 0.035/0.3/0.27; scatter follows sun-facing direction, crest height and slope |
| Glitter |Source lobes use powers 90,12 and 1400 with gains 1.2,0.06 and 40; bloom threshold 1.6/knee 0.8 |
| Wake |512-square half-float field over 380 m; arm offset `1.2+0.35*a`, about 19.3-degree opening; arm/stern/slick decay 115/170/260 m |
| Haze |`pow(1-exp(-d*2.8e-4),1.6)` into the sky's own direction-dependent horizon haze |

Foam uses the horizontal Jacobian from the analytic derivatives to shape crest coverage, then thresholds a Worley pattern into lace rather than filling a solid white slab. The source formula `smoothstep(0.6,0.28,J)` and several wake/distance ramps reverse GLSL edges; apply the [official ordered-edge correction](MATERIAL-STUDIES.md#paper-one-field-torn-outline-and-thickness).

The reflection vector's source `abs(R.y)+0.002` clamp prevents sampling its sparse lower sky cube; it is an artistic shortcut, not physical reflection law. Keep the sky cube's tiny sun disc out when a separate analytic specular term already draws the sun path. Planar reflection renders only its selected layer and restores all pre-existing renderer state, including clipping, clear color and shadow settings; the supplied module omits parts of that restoration and does not define every injected resource's ownership.

Floating-origin offsets for foam/detail use the same divisors as sampling. The source observed a jump when `/9` and `/3.3` sampling used `/11` and `/4.1` rebase offsets. Its 1200 m rebase shifts ship, wake, particles, camera and wave offsets together. Its `dt` ceiling 1/20 s and adaptive resolution thresholds are source tuning, not a device benchmark.

## Underwater: integrate a shared world field

[MengTo/Skills, 3d-underwater-god-rays, SKILL.md; assets/underwater-light.mjs; demo/src/ui.js]

- Use one normalized direction toward the sun and a basis perpendicular to it. Parallel world shafts converge in perspective and slide against the fish as the camera moves. The supplied basis degenerates when sun and world-up are parallel; choose a safe alternate reference axis for a generalized sun range.
- Shape swell into sparse peaks. A ridge web averaged through many samples can become uniform haze. Sample its caustic modulation inside the march rather than painting the web over the finished screen.
- Share the field among the march, surface underside and fish sun-key dapple. Bind uniforms once with their ownership/prerequisites explicit; do not duplicate uniform declarations when composing shader strings.
- Update time and camera world/inverse-projection state before the light pass; render that pass before water/fish and the final output transform. Buffer dimensions are physical drawing-buffer pixels, synchronized on resize.
- Use stable per-pixel jitter for stills. The source march begins away from the camera to suppress a large nearby wedge, normalizes by the weight sum and blends toward the sun glow to avoid a dark hole when looking straight along a shaft.

Selected underwater recipe, in its own world units and composition:

| Layer | Source parameters |
|---|---|
| Swell |4 directional sines; scale multipliers 1,1.23,0.87,1.41; drift 0.29/0.24/0.19/0.15 rad/s; domain warp 0.62; across-sun scale 1.3 |
| Focus |`pow(smoothstep(-0.05,1,swell),2)`, distance fade `exp(-0.012*distanceToSurface)` |
| Web |Swell at 2.6-times scale and 1.35-times speed; `pow(1-abs(s),5)`; light `focus*(0.45+0.9*web)` |
| March |26 steps, `t=4+50*f*f`; weight `exp(-0.06*t)*(0.08+f)`; normalized sum; stable interleaved-gradient jitter |
| Sun blend |`mix(total,0.16,pow(mu,28))` where mu is ray dot sun |
| Phase |`0.7+1.1*pow(mu,5)+0.9*pow(mu,40)` with the source below-horizon fade |
| Gain |Linear RGB0.16/0.40/0.47 times 3.6 in the composed page |
| Target |Half drawing-buffer size, half-float, single sampled; four-tap tent upsample at half texel |
| Surface |Plane y 12; two swell networks at 1.15/2.19 scales and 1.6/2.1 time; fog `exp(-0.028*d)`; ray bend 0.018 times ripple slope |
| Fish |Sun-key multiplier `0.62+1.5*shaftLight` |

Gain is judged in the actual composition. The source raw-canvas gain 2.2 became weak after page opacity 82 percent and CSS shade, so it used 3.6 and reduced an existing uniform corona/radial pass. Those numbers describe that page; inspect the actual overlay before copying a gain. Its sun-angle 21 through 44-degree sweep is a comparison setup, not a required position for every underwater light.

## Sky rays: inspect the mask, then the accumulation

[MengTo/Skills, 3d-sky-rays, SKILL.md and REFERENCES.md]

- Render linear HDR scene color and a sky-visibility mask: white open sky, black opaque occluders. Match foliage cutouts and deformation. A dedicated mask is the portable starting point.
- Reusing scene alpha is conditional on every preceding pass preserving its meaning. Glass, particles, canvas composition and AO can break sky 0/opaque 1; inspect the actual texture rather than assuming its channel is available.
- Project the shared sun direction, reject behind-camera sources and convert NDC to UV using the pipeline's orientation. A documented artistic sun/light offset has one owner.
- March from the pixel toward sun UV, sample sky visibility times brightness above an HDR threshold, cap energy and normalize decaying sample weights. Changing sample count must not silently change exposure.
- Reject samples outside the texture and fade when the sun moves far offscreen. Clamped edge samples create bright bands. Use aspect-correct radial falloff and let actual occluders provide most structure.
- Add the rays to linear scene color before final tone mapping and preserve alpha. Strongly attenuate the overlay on opaque foreground where needed to retain wood/stone contrast; this remains an artistic screen-space approximation.
- Start an experiment around 24 to 48 samples at half resolution, rather than treating the reference's 72 samples as a floor. Stable jitter is suitable for a still; animated jitter needs its own stability strategy. Skip zero-contribution work and resize/dispose targets through the canonical owner.

## Lifecycle and measurement

[MengTo/Skills, 3d-ultra-realistic-water; 3d-underwater-god-rays; 3d-sky-rays; existing webgl]

Keep a composed reduced-motion still with controls that repaint it; stop continuous hidden work and reset the frame clock on resume. Source ocean/underwater prose claims stronger loop suspension than parts of the actual demo UI implement. Preserve the existing [live lifecycle](WIDGETS.md#frame-loop), including live preference changes and teardown, instead of using those demos as proof of compliance.

Measure incremental pass cost on matched scenes. The supplied headless Apple/Metal timings and A/B grey-level statistics are author reports under specified load; differences smaller than run-to-run noise do not prove an effect is free on another device. Avoid synchronous GPU readback in the live render loop. Lower march resolution/steps or decorative detail only after checking the resulting view.

## Prove it

The ocean's far band resolves into haze/sheen without boiling, floating objects follow the rendered spectrum and rebasing does not jump foam/wake. Underwater shafts slide against world objects, converge coherently, dapple fish and avoid a camera wedge or sun hole. Sky rays follow roof/leaf gaps, fade when turned away and preserve foreground contrast. Check final composition, physical target sizes, narrow/wide views, still/live/hidden/resume and resource ownership; distinguish author A/B reports from actual performed checks. [MengTo/Skills, 3d-ultra-realistic-water; 3d-underwater-god-rays; 3d-sky-rays]
