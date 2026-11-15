# Shared perception and a soft fog overlay

Use this for obstacle-aware sight, hidden-enemy targeting or soft fog of war in an orthographic/isometric game. The source's proven renderer uses an orthographic camera and locally horizontal ground. Its ownership model extends farther than that reconstruction shortcut. [MengTo/Skills, implement-fog-of-war, SKILL.md; references/mechanics.md; references/validation.md]

## Gameplay owns visibility

[MengTo/Skills, implement-fog-of-war, references/mechanics.md, System contract and Obstacle and perception model]

Active obstacle proxies feed deterministic point-to-point perception for AI, attacks and targeting. The same geometry fills angular visible distances for the player's lookup texture. A shader visualizes this state; combat never infers truth from fog pixels.

Blockers have a stable footprint, vertical span and active state. Check both horizontal footprint and the sight segment's height; knee-high cover must not block an eye-level ray, and opened gates must stop blocking both perception and fog. Use the authoritative runtime collection rather than a disconnected copy.

The source circular-footprint recipe tests horizontal near/far roots against vertical bounds. **Source qualification:** that limited candidate check is not a complete general 3D closed-volume intersection: a sloped ray already within the footprint can enter through its top/bottom. Preserve the hub's full segment/footprint/vertical-span contract, including inside origins and almost-vertical rays, instead of claiming its root-only steps solve every geometry.

Return distance, within-range and clear-line-of-sight separately, with visible equal to the last two conditions together. This lets callers distinguish occlusion from range loss. Player and enemy ranges can differ, but walls still block both. Handle exact-range hits, zero-length queries, inactive gates and invalid negative range/padding explicitly through the chosen contract.

## One bounded lookup, one overlay

[MengTo/Skills, implement-fog-of-war, references/mechanics.md, Angular visibility lookup and Full-screen overlay]

- Allocate angular distances, byte pixels and texture once. Cast evenly spaced horizontal rays from player eye height, returning first blocker distance or player reveal radius. Normalize/quantize distances into a one-row red-channel data texture.
- Source texture uses linear filtering, horizontal repeat, vertical clamp and no mipmaps. Repeat joins the angle 0/full-turn seam; linear filtering alone does not remove every spoke. Upload only after changing pixels.
- One full-screen clip-space plane and transparent shader draw the overlay, with depth test/write and tone mapping disabled. This selected fog technique needs no second renderer, composer, render target or per-ray mesh.
- For its orthographic, locally horizontal ground, the source intersects near/far unprojected camera corners with player ground height and interpolates those world XZ corners. Do not apply that bilinear shortcut as a general perspective reconstruction or stretch it over sloped/multilevel terrain. Use the selected camera/surface/depth reconstruction when those assumptions fail.

Radial visibility is `1-smoothstep(clearRadius,visionRadius,distance)`. Wall visibility feathers around hit distance with `1-smoothstep(hit-edgeSoftness,hit+edgeSoftness,distance)`.

The source smooths five angular samples at offsets -2,-1,0,+1,+2 with weights 0.08/0.24/0.36/0.24/0.08. Angular step is the greater of one lookup texel and `angularSoftness/max(distance,2)/(2*TWO_PI)` for the selected formula. Its final composition is `maximumOpacity*max(radialFog,(1-obstacleVisibility)*obstacleDarkness)`. The old hard minimum of the two visibility fields made wall wedges as dark as the outer range and exposed spokes.

## Keep calibration local

[MengTo/Skills, implement-fog-of-war, references/mechanics.md, Proven calibration]

| Parameter | Selected source baseline |
|---|---|
| Player / enemy radius |14 /18 world units |
| Eye height / obstacle padding |1.18 /0.08 |
| Fully clear radius |11.25 |
| Edge / angular softness |1.35 /1.8 |
| Wall darkness / maximum opacity |0.32 /0.38 |
| Desktop / mobile rays |192 /128 |
| Allowed ray clamp |32 to 256 |
| Maximum stationary update interval |0.08 s |
| Movement update threshold |0.08 units |

These are source-scene settings, not fairness or performance guarantees. Preserve relationships: clear radius below reveal radius, mobile budget bounded, optional longer enemy range still occluded, and wall contribution gentler than outer-range fog. At this baseline, full wall contribution is 0.38 times 0.32 =0.1216 alpha, while the outer edge reaches 0.38.

Tune obstacle geometry/eye height and ranges before blur or darkness. Then tune clear radius, radial falloff, wall softness, angular smoothing and wall weight. Extra blur cannot fix wrong blockers.

## Presentation cannot freeze an unseen enemy

[MengTo/Skills, implement-fog-of-war, references/mechanics.md, Gameplay mechanics]

- Keep actor-root membership/lifecycle separate from player reveal. Hide relevant renderable descendants through presentation layers while preserving their original masks; include attached lights, sprites and telegraphs that otherwise leak position.
- Unrevealed enemies continue simulation according to game rules. Their acquisition/pursuit uses enemy range and shared sight; player selection, nearest-target search, lock-on, visible counts and attacks requiring exposed targets use player perception.
- Clear target lock as soon as range/occlusion invalidates it. Cache one sample per enemy within a simulation phase, then refresh after movement when downstream decisions need final positions.
- Keep broad lighting/atmosphere distinct from perception. The source's shadowless world-key choice is its visual profile, not a universal ban on game shadows; lighting cannot reveal a hidden enemy through an attached glow or telegraph.

## State and lifecycle

[MengTo/Skills, implement-fog-of-war, references/mechanics.md, Frame update and lifecycle]

Update player/camera uniforms every enabled frame even when CPU lookup is movement/time-throttled. Disable the overlay before any early menu/capture render branch so old fog cannot leak into another state.

The source enables fog only during active play, with menu/inventory/review closed and no stage transition. Keep the actual product's explicit state gate; review modes that intentionally disable fog cannot serve as normal-play visual proof. Atmospheric camera-distance fog is separate from player-centered fog of war.

Teardown removes/disposes owned overlay geometry, material and lookup texture. Expose compact diagnostics for enabled state, ray budget, player/enemy ranges, visible IDs and target distance/range/sight/return reason. Diagnostics support a rendered observation rather than replace it.

## Prove it

Using authorized verification, distinguish range and sight in exact-boundary, wall, gate, low-cover, inside-origin, vertical/sloped-ray and zero-length fixtures; repeated angular fills are deterministic. Verify radial/wall opacity and seam/spoke behavior, state gates, presentation-layer restoration, hidden simulation, lock invalidation and mobile budget. Walk near real blockers, move the camera, open gates and enter menus/transitions; no stale fog or hidden telegraph leaks. Report actual fixtures, browser/device evidence and measured moving-scene cost; source targeted commands or a green unit suite do not prove a live deployment. [MengTo/Skills, implement-fog-of-war, references/validation.md]
