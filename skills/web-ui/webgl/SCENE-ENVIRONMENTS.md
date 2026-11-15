# Landscapes, seasons, leaves and weather

Use this when a scene needs a coherent place around its subject: terrain/architecture, sky and lighting, seasonal materials and camera-aware leaves or weather. Share state and sample fields rather than allocating a new world for each combination. Source recipes are selected scene settings; measured device budgets and production design remain with their owners. [MengTo/Skills, threejs-landscape; threejs-towers; threejs-weather; 3d-four-seasons; 3d-sky-background; 3d-falling-leaves; falling-leaves]

## A landscape uses one height field

[MengTo/Skills, threejs-landscape, SKILL.md and demo/index.html]

- Match terrain sampling to projected detail. The source polar grid concentrates radial rings near the camera with `R0+(R1-R0)*pow(t,2.4)`; its 900 angular segments,52 rings and 2 to 700-unit span are one lens/framing recipe, not a prohibition on square terrain grids in other scenes.
- Check triangle winding before layering props; an inverted surface can disappear through back-face culling. Keep the analytic height function outside mesh construction so grass, stones, fog and other scatter sample the same surface.
- Domain-warp the selected broad noise field, then add ridge detail at an appropriate world/view scale. Use slope and moisture as terrain-color inputs; a low-frequency color variation can avoid hard bands. This is a procedural option, not proof tiled/scanned ground maps always fail.
- Instance ribbon grass with per-instance height, phase, tint and lean; shader bend/wind changes the visible field without CPU integration of every blade. Its GPU/overdraw cost still needs measurement. Camera-local grids snap to cell size instead of endlessly growing geometry.
- Give seasonal/snow grass recoloring its own shared shader uniforms. Changing material color cannot override a hard-coded multiplicative base/tip mix. Conservative bounds and matching shadow deformation follow the instancing contract below.
- Scatter embedded stones by slope rejection against the same height field and with stable varied sizes. The source flattened/translated icosphere is one shape recipe, not a substitute for actual terrain contact.

## Let sky, direct light and environment have distinct owners

[MengTo/Skills, 3d-sky-background; threejs-landscape]

The visible sky, reflection/ambient environment and direct shadow-casting sun are three responsibilities. Use a licensed panorama for selected cloud composition, procedural direction-based sky for changing sun, or a restrained hybrid. Keep the project's backend and Three.js version.

A direction shader or inward dome follows camera translation without rotating with the camera. A dome disables depth writes/fog and fits clipping range. Blend horizon/middle/zenith with compatible lower-hemisphere haze; share sun direction among disk/glow, direct light, reflection and ray pass. A broad halo and small disk remain distinct terms.

A full equirectangular image covers 360 degrees horizontally and 180 vertically. Record angular coverage for a partial landscape photo; mirroring a back hemisphere is a selected composition shortcut with repeat risk, not a full panorama. Check seam derivatives and zenith during a full orbit. Avoid importing another project's fitted inverse tone map: choose whether a photo follows scene tone mapping or a separate display-referred path, with color/output conversion once.

Start with a usable procedural gradient, then asynchronously load/blend the chosen image; failure leaves the gradient. Reuse a prefiltered environment and refresh only at meaningful changes, retaining/discarding targets by explicit ownership. Generating PMREM every frame is not the transition strategy. The source landscape's six stops on an 8 by 512 canvas are its tuning choice, not a universal stop count.

Night state includes horizon/zenith, fog/exposure, moon/stars and enough ambient light to read materials. Fade stars after darkening. Limit star sampling to the camera's reachable angular band when a narrow lens otherwise shows too few points. **Source correction:** manually multiplying `PointsMaterial.size` by DPR can double-apply renderer pixel ratio; inspect the actual material/renderer sizing path instead of adopting the landscape's unconditional multiplier. [Three.js points uniform implementation](https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgl/WebGLMaterials.js)

## Interpolate visible state, not old endpoints

[MengTo/Skills, 3d-four-seasons; threejs-landscape; threejs-weather]

Keep season, time of day and weather independent, then derive sun, fill, fog, ground, grass, sky and optional audio once. Four time states with four weather modifiers do not need 16 independently authored combinations.

Use season weights in order spring/summer/fall/winter; normalize `autumn` to `fall`. Weights are nonnegative and sum to one. The source retargets current weights with `a=1-exp(-1.4*clamp(dt,0,0.05))`, or a 1 immediate reduced-motion change. Resolve colors from authored bases and weights, avoiding cumulative tint.

On interruption, capture the currently visible interpolated result as the new start. If rendering eases a raw progress variable, snapshot the eased visible state, not raw progress or an old preset. The landscape demo differs from this intent, and the weather demo restarts from an old endpoint; neither proves jump-free interruption. Its written `key.color.copy(A).clone().lerp(B,t)` also lerps a clone rather than the live key color, so do not copy that expression.

Keep species/climate cues coherent: spring fresh foliage/blossom, summer dense greens, fall species-specific color/litter and winter bare deciduous branches with retained evergreens. These temperate cues are starting art direction, not a climate simulator. Use stable per-instance IDs for deterministic thinning, with matching cutouts/wind in shadow and depth passes.

Settled snow combines winter coverage with exposed upward-facing world geometric normals. Source mask is `winterWeight*smoothstep(0.3,0.85,worldNormal.y)*exposure`. Upward normal alone whitens sheltered interiors. A material overlay changes appearance without adding thickness; add selective close-up caps where silhouette matters. Falling intensity and accumulated snowpack are separate state.

## Leaves: face, edge, back and coupled slip

[MengTo/Skills, falling-leaves; 3d-falling-leaves]

- Begin with one recognizable leaf completing a tumble. Canvas width scales by `cos(spin)` while independent roll turns in the picture plane; choose paler/duller back sprite by the cosine's sign. A spin only within the plane reads as confetti.
- Couple lateral velocity to `sin(spin)*slip`, fastest at the cosine's edge-on moment. Independent lateral sine is a separate wind mechanism and does not implement this coupling. In 3D, with nonzero angular speed, the source closed form is angle `phase+omega*time`, side offset `-(slip/omega)*cos(angle)`; its derivative is the same slip velocity.
- Seed persistent position/scale/phases/tumble/roll/fall/slip/palette values per leaf or fall cycle. Shared wind can vary by response, using bounded simulation steps or a closed form, without integrating an entire hidden-tab gap.
- Use turning quads or lightly bent meshes for 3D; camera-facing points cannot rotate edge-on. Distinguish front/back lighting once, with subtle sun-linked transmission. Do not flip normals twice when the engine already handles double-sided lighting.
- A color atlas is sRGB; a packed mask/material atlas is data. Pad silhouettes and bleed edge color through transparent texels/mip levels to prevent dark rims and neighboring atlas bleed.
- Recycle ahead along horizontal view direction, retaining a safe prior/fallback direction near a vertical look. Preserve existing world positions as the camera moves; adjust boundaries rather than attaching all live leaves to the camera. Wrap/fade beyond central visible space so resets are hidden.
- Tighten volume before raising count. Capacity, active count and actually visible leaves differ; nearer large leaves require restraint. Exclude covered rooms with authored volumes/collision proxies because depth testing cannot prevent interior spawning.

Source canvas depth recipe:

| Layer | Scale | Fall | Opacity |
|---|---|---|---|
| Far |0.3 to 0.5 |slow |0.22 to 0.40 |
| Middle |0.5 to 0.85 |medium |0.46 to 0.78 |
| Near |1.05 to 1.9 |fast |0.50 to 0.82 |

The source count multiplier is `clamp(sqrt((W*H)/(1440*900)),0.5,1.3)` times authored count/layer share. **Source qualification:** this is square-root area scaling, not constant areal density. Its band-area density explanation assumes unchanged projection/visible fraction; halving a circular band's radius divides its area by four, but actual visible density still depends on camera/volume geometry. Keep foreground crossings sparse and actual text/controls readable.

Use one instanced pool, reusable scratch objects or seeded shader attributes. CPU instance matrices need refreshed bounds; shader displacement needs conservative bounds beyond the base CPU geometry. Blended instances are not individually sorted. Alpha-test/depth-write cutouts can help selected crisp foliage, but custom shaders must implement rejection and shadows must match alpha/wind. Alpha-to-coverage requires the actual MSAA target, as detailed in [MATERIAL-STUDIES.md](MATERIAL-STUDIES.md#paper-one-field-torn-outline-and-thickness). [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)

Source claims that leaf updates are free, all alpha-tested leaves lose early-Z, or red must always zero its green/blue channels are not portable laws. Profile update/overdraw and view the actual color through the selected tone mapper. Reuse the pool across seasons instead of allocating a leaf system per state.

## Weather reuses pools and independent controllers

[MengTo/Skills, threejs-weather, SKILL.md and demo/index.html]

- Place a bounded weather volume in the visible camera region before increasing count. The source narrow/deep 17 by 50 by 40-unit volume sits 46 units ahead; choose dimensions for the actual lens. Moving an object does not inherently require disabling culling: maintain valid bounds for its actual CPU/shader movement.
- Allocate the maximum rain/snow pool once and vary active draw range. When using `Float32BufferAttribute`, mutate the retained attribute's actual array; the source constructor path creates its own typed-array copy. Set the appropriate update flag after mutation. [Three.js BufferAttribute source](https://github.com/mrdoob/three.js/blob/dev/src/core/BufferAttribute.js)
- Storm modifies rain instead of adding a competing system. Source rain/storm draws 60/100 percent, speed 1/1.42, sun 30/14 percent and fog-far multipliers 0.52/0.38; slant grows with speed squared. These are selected weather recipes.
- Lightning owns a dedicated light, not the time-of-day sun. Multiple exponential pulses model a leader/returns, with strike direction changing. The source pulse decay 0.085 s, light gain 3.2 and low DOM overlay below text are tuning choices; respect the product's existing motion/flash accessibility policy.
- Thunder follows the strike with an explicit delayed cue and canceled/owned scheduling. The source's near/far proxy delay 0.32 to 3.02 s and gain 0.30 to 0.90 are artistic distance cues, not calibrated propagation from metres. Its demo only comments the thunder action; it does not prove working audio.
- Snow blizzard is a slow calm/build/blow/ease envelope; source durations 12/6/15/8 s. Reset to calm on leaving/re-entering the snow state so entry does not jump into an old whiteout.
- Track accumulation separately: source snowpack approaches a target with `dt/24` while growing and `dt/13` while melting. Its shader base/tip recolor has an explicit snow uniform; changing an unrelated material color cannot reach it.
- Gate expensive slow relighting by a chosen tolerance and verify visibility. Source 0.006 threshold is a heuristic, not proof all viewers/devices see no change.
- Wet dielectrics can lower roughness; **official correction:** adding metalness to wet wood/stone, as the weather source suggests, is not a general physically based wetness model. Nonmetal materials use metalness 0. Its translucent puddle circles are not actual planar reflections. [Three.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)
- Weather audio gets a separate gain bus and optional blizzard layer over the base. The source equal-power overlap weights head by `sin(t*pi/2)` and tail by `cos(t*pi/2)`, then removes overlap, shortening loop period. It is a seam-making technique, not proof generated audio can never loop naturally; listen to the actual result. Browser playback/teardown stays in [web-audio](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-audio/SKILL.md).

## Architecture: repeated builders and a real section cap

[MengTo/Skills, threejs-towers, SKILL.md and demo/index.html]

Use shared geometry builders for face, box, prism/polygon prism, plan sweep, lathe, ring/arc, fan and tube where a selected architecture uses repeated parameterized parts. Batch compatible geometry by material, with correct normals, winding and physical UV scale. Source 11 to 18 draw calls and FPS comparisons are scene reports, not a transferable threshold.

The selected roof profile separates slope sag, corner flare/lift and truncation behind upper walls. Clamp the fractional-power domain when tiles extend beyond an eave; negative bases with noninteger powers produce invalid values. Size door/pediment details from the actual face width. Sweep a reusable non-square outline and close setback ledges; otherwise buildings expose open shelves and emissive interiors leak through missing surfaces.

Construction reveals use one world clipping plane shared by structural materials, with `clipShadows` when clipped geometry must not cast a completed-building shadow. Add a cross-section cap matching the current footprint, including polygon side count where sections change. A square cap does not close an octagonal drum. Scaffolding intentionally ignores the clipping plane and leads the finished work; its per-stage growth and captions derive from the same seekable stage timeline. The source 4 to 5-second total is a selected pacing, not a universal duration. [Three.js Material](https://threejs.org/docs/pages/Material.html)

## Prove it

Match terrain and scatter contact, full-orbit sky seams and sun/reflection/haze direction. Capture seasons from one camera and interrupt their transitions repeatedly without visible jumps or cumulative tint. Watch one leaf through face/edge/back/fall/reset, move sideways/turn/look vertically/enter a room and resume after hiding. Verify rain stays visible, snow re-enters calm and accumulates separately, strike/audio timing and actual puddle representation are stated truthfully. Scrub every construction stage/cap and switch styles without resource growth. Live preference, hidden/offscreen, resize and teardown follow the existing canonical owner; report checks actually performed. [MengTo/Skills, threejs-landscape; threejs-weather; threejs-towers; 3d-four-seasons; 3d-sky-background; 3d-falling-leaves; falling-leaves]
