# WebGL: light theme and turning groups

[isokit, references/webgl-light-theme.md] Originally split from [webgl.md](webgl.md) to keep each file under the size cap. Sections 8 and 8b (the light theme, and shaders on a turning group)

## 8. Light theme

Light is the shipping theme. A page that is light gets shaders designed for paper, not dark-plate glows converted at the end. Seven figures on the isometrics site were built on a dark plate and then converted: a pool reactor, a foundry pour, an afterburner, a glory hole, a tokamak, a plasma cutter and a forge. Each conversion took three review rounds, and every rule in this section is one of their findings.

The Raptor's light plume (`inkOf` in `examples/raptor-engine/live.js`) shows what not to do. It multiplies every hue by a fixed dark red, `vec3(.62,.34,.3)`, and sets alpha to brightness, so the hottest gas comes out darkest and most opaque. Reviewers called it "red ink smoke". Don't copy it. The ripple tank's grey ink (`uPale`) is still a good model for light that isn't a glow: a tone curve `1 − uExpo.x/(1 + (e/uExpo.y)^uExpo.z)` takes the crests to near paper-white and the troughs to the kit's greys, and its water writes only the change from flat water.

### 8.1 Ink on paper
Over white, the canvas is normal-blended, premultiplied, and never `screen`, because screen over white is white. No pixel can be brighter than the paper, so light has to read through **saturation and local contrast**:
- **A glow is a saturated body, a pale near-white core and a coloured rim.** The pale core reads as hot only because the body around it is saturated and the ground around that is darker.
- **What the light falls on takes a tint** (multiply-like, with capped alpha). It doesn't get brighter.
- **The volume that holds the light is darker, for a physical reason:** soot, refractory, deep water or shadow (section 8.3). It is never a black box.

**Design the colour the paper should show, then solve for the ink.** Write a ramp from light energy to the colour the reader should see over white. Then invert normal compositing over white, which shows `rgb + (1 − a)`:
```glsl
vec4 inkFor(vec3 seen,float cover){
  vec3 absorbed=1.-seen;
  float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);
  return vec4(vec3(a)-absorbed,a);
}
```
Over white this composites to exactly `seen`.
- **Reactor.** `inkOf` does this with its `paperOf(e)` ramp, where `e = 1 − exp(−2.3·max(lin))`. The ramp runs white → `TINT (.85,.93,1)` → `BODY (.2,.46,.94)` (by e .12-.5) → `RIM (.2,.68,1)` (.4-.65) → `ICE (.9,.98,1)` (.6-.9).
- **Afterburner.** Its `paperOf` mixes white → body → a pale core, and then inverts the same way.
- **`cover` is an alpha floor at the hot end:** `WASH·smoothstep(.6,.9,e)` with WASH .52 in the reactor, and `COVER·smoothstep(.45,.92,m)` with COVER .94 in the afterburner. Without it, a near-white core has alpha near 0, so the SVG lines behind it show straight through and it reads as a hole, not as light.

The other figures use the form `vec4(colour·a, a)`: `colour` comes from a ramp and `a` from a saturating curve of energy. The tokamak's `glowInk` is an example. Both forms work; `inkFor` also guarantees the colour the reader sees.

**One ink per kind of light, composited in the shader.** Keep separate accumulators, give each its own ink, and stack them back to front with `vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}`:

| Term | Ink | Seen in |
|---|---|---|
| Emission, the hot thing itself | ramp body plus a pale core, alpha up to .96-.97 | plasma cutter `bodyInk`, forge `barInk`, tokamak `glowInk` |
| Light falling on a surface | hue pulled warm or cool, alpha capped at .5-.8 | foundry `castInk` and `tintInk`, tokamak `tintInk` (.5), plasma cutter `tintInk` (.75-.8) |
| Haze: steam, smoke, fume, breakdown gas | grey or lightly tinted, alpha `1 − exp(−density·k)` | plasma cutter `hazeInk`, tokamak `gasInk`, forge steam |
| Sparks and streaks | on top of everything | foundry and forge `sparks` |

The plasma cutter's `lightInkOf` is the clearest example: `over(arcCore, over(bodyInk(body), over(arc, over(fumeInk, over(steamInk, tintInk(tint))))))`. If you sum the energies first and ink the sum, everything gets one hue and the pale core is lost.

**Finish.**
- Clamp `rgb ≤ a` after every sum: the afterburner showed a 1-LSB premultiply overflow.
- Dither the final premultiplied value, rgb and alpha both, gated by `smoothstep(0.,1.5/255.,a)` (the glass furnace's `paperOut`, the foundry's `dithered`).
- Keep the canvas edges at exactly 0.
- Tonemap energy before it reaches a ramp (`tonemap`, or `1 − exp(−k·e)`), never `clamp`.

### 8.2 Ink grows with light
In dark, more light only adds. On paper, more light means more ink, and a careless formula can add ink while the light falls or take ink away while it rises. These were the faults reviewers found most often:
- **Fade the finished ink once.** Scaling a premultiplied ink by `u` is an exact linear crossfade from bare paper to the full picture, monotonic in every pixel: the reactor's `ink*=uFirst`, the glass furnace's `paperOut(overInk(gas, ink)*uLit)`. The glory hole first faded each term before inking it (`*uLit` in `holeOf`, the port bore and the ball). The pale core arrived before its saturated body, then the ground darkened, so first light went pale and then dark. Build every light ink from unfaded tones (its `litOf()` returns 1 in light) and fade only the result.
- **Fade a glow by energy and alpha together.** If you fade only alpha, a pale core stays pale and the thinning glow turns milky grey: the tokamak's contact band did. If you fade only energy, the glow runs back down its ramp. The tokamak now scales energy down to a floor and alpha the rest of the way: `hot+=glowInk(c*level*(.3+.7*hold))*hold*(1.-hot.a)`. The band stays pink-mauve as it goes.
- **Take the hue at steady brightness.** As energy falls, the tonemap reddens and darkens the hue, and with alpha near its cap the ink rises: the afterburner's cavity got 55% heavier as the flame went out. The fix:
  - Divide the burn by the local lit strength before taking the hue (`burn/lit`, `lit = la.x·glowOf(la.y)/LIT_GLOW`).
  - Blend the hues by each part's share of the energy.
  - Tie alpha to energy: `cap·(1 − exp(−1.6·e/cap))`.
  - At low cover, warm the hue toward `EMBER` and scale alpha by `inkOf(hue)/inkOf(ember)`, so the ink stays the same.
  
  With that, the window's ink fell monotonically from 1894 to 155 on the cut.
- **Hand-offs are plain premultiplied mixes.** The afterburner's jet has two copies, dry blue and lit warm, crossfaded with `mix(blue, warm, lift)`. A `max(alpha)` cover there doubled the dry jet's ink. Also gate each copy so it can't pick up the other's terms: the dry shock disc leaked into the warm copy as a cream patch.
- **Envelopes that multiply can rise during a fade.** If a first-light envelope is still rising while the effect's own edge falls, the fade-out brightens: the tokamak did this when Home was pressed in its first half second. Freeze first-light growth while the effect is falling.
- **The handover from the SVG fallback is exact,** or the scene dips while the shader comes in (section 8.5).

### 8.3 A ground for the light
A glow on white with nothing around it reads as a stain. Give it the ground it really has:
- **Cavities in the SVG take a darker token set.** A group class redefines the kit tokens for everything inside it:
  - the afterburner's `.ab-inside`: paper `#4a453f`, shades `#3c3833` to `#544e47`, lines `#5e5952` to `#9b958b`;
  - the tokamak's `.tk-cavity`: `#66646e` to `#8b8992`;
  - the foundry's sooted bore tones (`--fd-bore-*-sooted`, a `color-mix` of `--anatomy-shade-0` with `--fd-soot-ink: #2f2a25`);
  - the glory hole's `--gf-void` and `--gf-bore`;
  - the reactor's water-column gradient (`--rx-water-top`, `-mid`, `-deep`, from `#edf2f4` to `#c9d7e0`).
  
  In dark the same tokens are set to `inherit`. All four shade tones stay, so the inside still has form and reads as refractory, soot or deep water rather than a hole.
- **The ground takes the light's tint, live.** The same tokens `color-mix` toward the light's hue by a variable the loop writes: `--ab-flame` at 30% on faces and 55% on lines and back plates, `--tk-cold-mix` for the violet of breakdown. The SVG ground then warms with the flame even without WebGL.
- **The shader's ground equals the SVG's.** Where the shader paints an opaque cavity (the glory hole's `holeOf = overInk(emberInk(t,1.), vec4(SOOT,1.))`), read the token rather than retyping it. The foundry adds a probe path, sets its fill to each `var(--fd-…)`, reads `getComputedStyle(probe).fill` and passes the result as a `fixed` uniform (`paintOf` in its `mount.ts`).
- **Light around the source is a tint with a long tail.** The tokamak's vessel read grey at flat-top until a long-range wash (`skin*(.14*exp(-gap/(.22*U))+.17*exp(-gap/(.9*U)))`) tinted its walls magenta. Measured on the column: `#6e6c76` with the plasma off, `#786778` with the wash at .17, which reads as lit. At .1 it still read grey.
- **No bloom in empty air.** In light, a halo around a stream or sheet hanging in the air is a smudge on the paper (the foundry's stream and notch glows were). Drop halos in air in light. Keep the limb rim inside the body, and the tint on the surfaces the light reaches.
- **Light only lands where the source can see.** The reactor's surface light leaked onto a shield's cut face and coping until its seal test used the true top of the tank lip (`RIMZ`) rather than the deck. The plasma cutter lit the slat bay under the jet's lower end while the jet was visibly in the next bay; its `bayLight` now lights each bay by its share of the jet column, so the light crossfades from bay to bay as the jet moves.

### 8.4 Recipes by phenomenon
Hot bodies run dull red → orange → yellow → near-white, in that order and no other. Keep one stop table in the model, compile it to GLSL and use the same table for the fallback: the foundry's `INK_STOPS` (`inkRampGlsl`, and `glowInk` for the SVG), the forge's `STEEL_INK` (`steelInk`, `steelInkOf`).
- **Molten metal, forged steel, billets, kerfs.**
  - Index the table by brightness temperature, so a dim far wall and a bright pour read from the same table. The foundry's `brightOf` inverts Wien from the green channel.
  - The forge's stops: 560 °C `(.45,.09,.05)`, 680 `(.56,.07,.04)`, 780 `(.78,.10,.03)`, 950 `(.95,.38,.06)`, 1150 `(1,.78,.12)`, 1260 `(1,.93,.78)`.
  - Alpha opens at visible glow: `steelGlows` over 560-820 °C, or the foundry's `INK_FROM`/`INK_FULL` over 470-590 °C, crossfading from the metal's own ground tone.
  - The rim is cooler and darker (`steelInk(t − 140)`, the foundry's 150 K limb drop). A cream core appears only in the hottest centre (`steelPale` over 1050-1280 °C, at .8).
  - A dark skin sits under the glow and grows as the metal cools: the forge's `barInk` runs from oxide `(.28,.29,.32)` to skin `(.24,.22,.23)` with cover up to .86.
  - Reviewers' words for the foundry stream: "a cream core with an orange skin".
- **Glass gathers.**
  - Alpha is a luminance gate: `GLOW_SEEN` .008-.028, about 600-710 °C.
  - The colour is `pow(hue, mix(1.6,.8,warm))*mix(.62,1.,warm)`, which runs deep cherry → red → orange.
  - The pale core (`CORE_PALE (1,.88,.62)`) sits where the pixel's own emission is brightest (`cored`, luminance .14-.24), not at a fixed radius.
  - The cool skin (`SKIN_COOL (.3,.11,.07)`) only recedes.
  - The first version had a salmon stage. A red mixed toward white is salmon, and no temperature looks like that: go through orange and yellow before anything turns pale.
- **Sparks.**
  - A saturated head and a darker, cooler tail. The plasma cutter's `tailCooling` sets the tail at 0.62 of the head's temperature; the forge's tail ink is `(.42,.07,.02)`, alpha .75 capped at .8. Only the youngest third of a spark gets a pale core (`u < .35`).
  - Keep the streak at least about 1.25 device px wide (`max(.35+.6px, 1.25px)`), or diagonal streaks bead at 10-24×.
  - On white a spark is ink, so over a hotter emitter it must vanish. The foundry multiplies spark ink by `1 − cover·smoothstep(sparkT−60, sparkT+60, tb)`, against both the metal and the glowing bore.
  - A spark that passes behind a jet fades by depth: `cover*smoothstep(-.4,.4,tJet-tS)`.
- **Flame and exhaust.**
  - A saturated orange-yellow body with translucent edges, weighted toward the axis in light: `mix(1.,1.3-.6*smoothstep(0.,rf,r),uLight)`.
  - Cut the limb mantle (`mix(.8,.3,uLight)`). The limb shell that gives a dark plume its edge (section 4) draws an outline on paper and leaves the flame hollow.
  - Keep raggedness to the outer part, widen the hot axis, and put the pale core at the nozzle, fading out over .4-.9 of the length.
  - Check a cross-section. The afterburner's final flame reads `0 2 13 33 31 49 78 72 78 52 40 32 8` in ink from edge to edge.
  - The dry jet is a faint blue column. Shock diamonds are pale cream discs (`CREAM (1,.95,.86)`) with a warm rim and a soft edge (about .65 of the disc radius). Pushed stronger, a second diamond read as a knob or a washer, so it stays a faint lens.
- **Smoke and steam.**
  - Light grey, never with a dark glow ink laid over it. Edge `(.84,.87,.90)`, crown `(.97,.975,.98)`, and the underside `(.72,.76,.81)` by the cloud's own self-shadow; alpha `1 − exp(−density·k)`.
  - Near a hot source, warm the cloud toward pale amber (`mix(steelInk(T), CREAM, .5)`). The forge first laid glow ink over the cloud, and reviewers saw a salmon blob.
  - A quench puff is a `burst` that leaves the tub: it climbs from 4 to about 40 units above the water, slowing as it goes (`PUFF` in the forge's `shader.ts`), clears the rim within about 0.15 s, widens from 7 to 13, thins as it grows, and shares the column's height window, so it never cuts off.
- **Plasma (tokamak).**
  - Saturated magenta-violet: `inkBody(chroma)=pow(chroma,vec3(1.8))*vec3(.93,.86,.97)`.
  - Above m .55 the core goes pale, toward white with 8% of the chroma kept.
  - Alpha: `.97*smoothstep(.02,.42,m)*(1.-exp(-2.6*(m+2.*m*m)))`.
  - Breakdown gas is a violet haze, `(.52,.44,1)` to `(.74,.68,1)`, alpha at most .64. Seen through the cutaway, the vessel's interior uses the cavity token set.
- **Cherenkov (reactor).**
  - Vivid cyan-blue in a blue-tinted water column: the paper ramp in 8.1, over the SVG water gradient, with the hot end floored by `WASH` so the core covers the fuel lines behind it.
  - Compress the pulse above critical (`1.+.75*log(level)`), so a 1.5 GW pulse brightens the pool without flooding the card.
  - The glow on the hall wall uses a separate, weaker ink (`HALL_INK` .35).
- **Plasma arc (plasma cutter).**
  - A violet arc `vec3(.6,.34,1.)` with a pale core `vec3(.96,.95,1.)`.
  - Warm tint ink on the plate and water: `mix(vec3(1.,.5,.08),vec3(1.,.68,.3),…)`, alpha `.75*(1.-exp(-3.2*sqrt(m)))`.

### 8.5 The SVG and the fallback in light
- **Read the theme once.** Choose the theme at build time (`pageHtml({ theme })`, or `data-theme` on the React wrapper; on the isometrics site the figure's build returns `theme` and `LivePlate` wraps a dark plate in its own `.iso[data-theme="dark"]`). The live code reads it from the nearest `[data-theme]` (`root.closest("[data-theme]")?.getAttribute("data-theme") !== "dark"`) and passes `uLight` as `fixed`. Gate every light-only change on `uLight` (`mix(dark, light, uLight)`, or a branch on the uniform), so dark output stays as it was. Keep dark working if that is cheap.
- **No colour literals.** If a figure hard-codes dark colours in its CSS, convert them to tokens with dark overrides: `.x { --x: light }` then `.iso[data-theme="dark"] .x { --x: dark }`. Shader constants that must match a token come from a probe (8.3).
- **Nested themes.** `.iso:not([data-theme="dark"]) .x` also matches through the light page around a dark plate. That is how the reactor's dark fallback got multiplied into black. Put the dark rule after the light one, at equal specificity, or key on the plate's own theme: the forge uses `.iso-plate[data-plate="light"]`.
- **How the fallback blends.** Multiply its saturated tints, which darken and leave the lines under them visible. Normal-blend its pale cores, because multiply can't lighten: the reactor's no-WebGL core is a radial gradient from `#fff` at .85 to `#dcefff` at .3, blended normally.
  - Fallback colours come from the same ramp as the shader: the foundry's `glowLightCss`, and the glass furnace's `gatherInk`, which mirrors the shader's gather ink exactly.
  - Opacity on a pale token fades to grey, so give the fallback the saturated hue: the tokamak's fallback rings set `--anatomy-lit: #e0409c` and `--anatomy-hi: #f27ec0`.
- **Fallback shape changes crossfade.** The tokamak's no-WebGL plasma ring is 11 precomputed rings (`LIMITED_RINGS`). Neighbouring rings are crossfaded with linear weights that sum to 1, on the same eased radius the shader draws. With 6 rings a doubled outline showed mid-fade.
- **Nothing with gaps goes under a translucent ink.** Whatever the SVG draws shows through an ink that isn't fully opaque. The forge's heat band was a set of strokes with paper between them, and it printed grey streaks through the bar's 14% transparency. It is now a face filled with the heat gradient.
- **The handover from fallback to shader is exact.** At first light the canvas ink rises by `u` while the fallback under it goes. A linear `1 − u` on the fallback makes the middle of the fade paler than either end. For an exact linear crossfade, set the fallback's opacity to `(1 − u)/(1 − u·α)`, where α is the canvas ink's alpha where it matters: the glass furnace's `--gf-gather-fade`, with α the gather's centre stop. Its other fallbacks stay at full strength until the shader is nearly in: `clamp(0, calc(var(--gf-fallback, 1) * 12), 1)`.
- **Every body the shader draws has a fallback.** The foundry's tap stream had none, so it was missing without WebGL. It is now an SVG outline rebuilt each frame from the same history the shader reads.

### 8.6 Where the ink meets a line
The canvas lies over the back SVG's 0.6 px strokes. In light, a misregistered edge shows as a pale gap or a coloured line over the stroke, rather than as a dark seam.
- **Stop at the stroke's inner edge.** Ramp a face's ink to full under the stroke and end it at the stroke's inner edge, half the line weight in: 0.3 vb for the kit's 0.6 px lines. Measure the computed stroke width; the forge's reviewer guessed 1.1. Examples: the reactor's `cutFade=smoothstep(-SEAM-.5*px,-SEAM+.5*px,gap)` with `SEAM=.3`, and the forge's `strokeMeet`. Pad a tint by the same half stroke (the foundry's `ringLight`), so it never paints over the line and leaves no pale band inside it.
- **Don't clear the ink where nothing is stroked.** The forge's veil cleared at the crease two faces share, which the SVG doesn't stroke, and white seams showed along the bar. Draw such a crease in the ink instead: ×0.72, at least 0.8 canvas px wide (sharper came out dotted).
- **Supersample where neighbouring rays disagree.** The reactor traces four sub-pixel rays and takes 16 samples when their hit, depth, kind, normal or cut share differ (`apart`), so cut-face edges don't stair-step. At dpr 1 a canvas pixel is about as wide as the stroke, so one pixel of softness remains.
- **A body that enters from out of frame** may fade in from the canvas edge in screen space. The foundry's tap stream fades in over 11 vb, starting 10.5 device px below the canvas top, so the edge still reads 0 and the stream reads as coming from above.

### 8.7 What the reviewers saw, and the fix

| You see in light | Cause | Fix |
|---|---|---|
| A red-brown "ink smoke" plume | Hue × a dark multiplier, alpha set to brightness | A paper ramp: saturated body, pale core, alpha floor (8.1) |
| A flame drawn as an outline, hollow inside | The dark limb mantle | Weight the body toward the axis, cut the mantle (8.4) |
| First light goes pale, then dark | Terms faded one by one before inking | Fade the finished premultiplied ink once (8.2) |
| A glow fades out through milky grey | Alpha-only fade of a pale ink | Dim energy and alpha together (8.2) |
| A cavity gets darker as the fire goes out | Tonemap reddens the hue while alpha holds | Hue at steady brightness, alpha from energy, ember match (8.2) |
| A salmon stage as glass or steel cools | Red mixed toward white | A blackbody-ordered ramp, pale only past yellow, core where emission peaks (8.4) |
| Sparks look like dirt on the metal | Dark ink over a hotter emitter | Drown sparks over hotter bodies; saturated head, darker tail (8.4) |
| Spark streaks beaded at zoom | Tails too thin | At least about 1.25 px wide; thin the tail less (8.4) |
| A spark shows through the jet | No depth test against the jet | Fade it by depth behind the jet (8.4) |
| A halo stains the paper around a stream | Dark-theme bloom in empty air | No halos in air in light (8.3) |
| A salmon blob in the steam | Glow ink laid over the cloud | Tint the cloud toward pale amber (8.4) |
| The vessel reads grey with the plasma on | Tint falls off too fast | A long-range wash term (8.3) |
| A pale fringe or white seam along an edge | Ink stops short of the stroke, or clears an unstroked crease | End the ink at the stroke's inner edge; draw the crease in ink (8.6) |
| A cream patch in the jet | One copy picks up another copy's term | Gate each copy (8.2) |
| The dark plate's fallback is invisible | A `:not([data-theme="dark"])` rule matched through the light page | Order the dark rule last, or key on the plate (8.5) |
| A grey, washed-out fallback glow | Opacity on a pale token | Saturated tokens; multiply tints, normal pale cores (8.5) |
| Grey streaks through a hot face | SVG strokes with gaps under a translucent ink | Fill the face (8.5) |
| Light on a face the source can't see | A surface light without the true occluder | Use the same geometry the SVG draws (8.3) |

## 8b. Shaders on a turning group
In a 3D figure (`references/3d.md`) parts move as rigid groups, so a shader has to follow them.
- **Anchor to a part**: `controller.anchor(group, restPoint, restDir)` gives `{ world, screen, direction }` every frame. Pass them as uniforms. That is how an LED rides a flexing fingertip, a flame stays on a ruptured line's end and a spark source sits on a knuckle.
- **Anchor to a surface**: prepend `glslPose("Dial")` (or `GLSL_TURN` for one group) and pass `TURN.poseUniforms(controller, "dial", "uDial")`. Then `vec3 q = toDial(onFloor(vb, z))` is the surface point in the group's rest-world coordinates. Oil pooling on a turntable, a texture revealed by light and a scorch mark all turn with it.
- **World space stays world space.** Smoke, sparks after they leave the source and oil on the bench never touch a group transform. Emit at the anchor's world position, then integrate in world.
- **Occlusion by live parts.** A front canvas sits over a live layer. Mask its ink with the parts painted after the effect's own part: `TURN.cover(controller, [partName])` → `uCoverEdge`, `uCoverCount`, then `ink *= 1. - coverOf(vb, .7 * px)`. The masks are the exact convex silhouettes pushed out 0.3 vb, so ink stops at the occluder's stroke. Six polygons of ten edges each. Read `MAX_FRAGMENT_UNIFORM_VECTORS` and keep the SVG fallback below 128.
- **A back canvas between live layers** needs no masks: put the surface that receives light in its own live layer under the parts that cover it (the turning dial's face under the hand).
- Vector uniform arrays (`uniform vec3 uSpark[24]`) take a `Float32Array` through `draw`.
- **The SVG fallback on a moving part** is a `T.billboard({ part, at, normal, svg })`. Its markup is in viewBox px centred on the projected point, not in world units, so scale world sizes by `G.scaleOf(P)`: a glow sized for a lens of radius 1.1 is `<circle r="${(1.1 * G.scaleOf(P)).toFixed(2)}"/>`. Written as `r="1.1"`, it draws a pin-dot about a third of the lens's size. Check it with `--no-webgl` and a 4× zoom.

## Prove it

[isokit, references/verify.md; references/verify-checklist.md] Apply the [figure verification workflow](verify.md) to the parts used here. Preserve recorded-shape coverage, sampled states and quick/partial/skipped labels; a zero geometry audit still requires the line and visual checks.
