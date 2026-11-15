# Grainy gouache illustrations

Use this optional SVG direction for one animal in a warm design or coding scene: shaded, outline-free forms, edge-weighted dark grain and cream details against hot pink. Follow [shared craft](ILLUSTRATION-CRAFT.md), with the animal proportions and material below. Measurements assume a 480 by 360 card. [MengTo, illustration-grainy-gouache, SKILL.md]

## Palette

[MengTo, illustration-grainy-gouache, SKILL.md Palette; style.json]

| Material role | Color or ramp |
|---|---|
| Card background | `#FF81BE` |
| Cream | `#FDD5A8` |
| Cream light | `#FFF3E2` |
| Pool shadow / core | `#B95A93` / `#A04A80` |
| Blush | `#FF7FB0` |
| Vermilion | `#FF4816` |
| Vermilion ramp | `#FF5A24` `#F2440F` `#F0420E` `#B02B08` `#9C2306` |
| Coral | `#FF6A3A` |
| Knit | `#EE430F`+`#C2320A`, dark `#D2360B`+`#A42807`, rib `#E03A0C`+`#A8290A` |
| Ochre / gold | `#E7A13A` / `#D88A1E` |
| Ochre ramp | `#E38C1E` `#C96E05` `#9E5004` |
| Wood top | `#F0A23C`→`#D98418`, edge `#F6B860`, contact `#7A3A04` @0.38 |
| Maroon ramp | `#8A220A` `#701001` `#4A0901`, deep `#5A0E02` `#3A0601` |
| End shade | `#1A0402` |
| Screen | `#8A2632`→`#621626`→`#3A0A14` |
| Near-black | `#191113` bezel, ramp `#3A2E31`→`#0D0809`, edge `#6A5A5F` |
| Face ink | `#0D0809` pupils/nose, `#120A0B` `#1A0E0F` lines, `#F7D6A6` eye ring |
| Cream fur | `#FFE6C4`→`#FCD9AE`→`#F0BF88` |
| Ivy | `#16592C` `#0F4A23` \| `#0C3F1D` `#082F15`, veins `#06150A` |
| Olive | `#7A7318` `#6A6416` \| `#524810` `#3C350C`, veins `#1C1804`; mug `#5E5712` |
| Olive accent | `#A8B030` code green, `#8A9416` editor dot, `#545C01` scarf |
| Oak | `#E08A1C` `#D47A0C` \| `#C96E05` `#A85A05`, veins `#3A1404` |
| Fur, amber | `#E59240`→`#CF7426`→`#A9531A`→`#7A3510`; limbs `#B85E1E`→`#5E280C`; paws `#6A3418`→`#32150A` |
| Fur, owl | `#F0962E`→`#DC7A14`→`#B85A08`→`#8A3E04`; wing `#7E2A06`→`#461402` |

Retain `#FF81BE` across the whole card even for night/rain scenes; put weather inside a window or screen. Large forms need several ramp stops. Avoid blue, teal, gray and purple outside the pool, and pure white outside the lamp cone. Use value changes rather than silhouette strokes. Stage warm fur against a dark plane; cream decoration must remain distinct from cream fur. No glow or rim-light treatment.

The fox-specific radial ramp is `#FF5A26` to `#FB4714` to `#D9380C` to `#9C2406`. Window-night colors are `#3A1424` to `#1C0910`; rain-pane colors are `#22090F` to `#4E1420`. Keep these darker planes inside the scene while the card stays pink.

## Paint and grain

[MengTo, illustration-grainy-gouache, SKILL.md Line and fill; Techniques; scripts/gouache.mjs]

| Treatment | Source parameters |
|---|---|
| Round form gradient | Radial center .42 to .46 / .30 to .34, radius .72 to .78; light stop 0, mid .5, shade .82, edge1. |
| Slab / cylinder | Slab light at top, dark at bottom. Cylinder horizontal stops: dark 0, mid .22, highlight .45, mid .75, darkest 1. |
| Dark details | Veins .6 to .7; stems .9; whiskers .75 to .8 in `#1A0E0F` or `#3A1A0C`; mouth/lid 1.05 to 1.3 in `#120A0B`; finger crease .7 in `#1A0A04`; feathers .9 to 1.1. Round caps; avoid pure black. |
| Cream details | Steam 1.15 to 1.35, burst 1.3, scarf braces 1.1, rain 1 at .22 to .5 opacity, ear-fur ticks 1.1. |
| Screen code | Width 2.2 to 2.6, rows 7 to 8.4 apart, 2 to 3 colored segments per row. |
| Depth overlays | Box-end darkening .4 to .5; cylinder-foot `#5A0E02` from 0 to .5; crown `#7A3510` at .3; torso radial shade `#5A0E02` from 0 to .55; sleeve dark maroon .55 at outer edge to `#FF8A50` at .12 to .22 inside. |
| Sleeve shadow | `#4A0901`, blur 2.4, offset 3.5, opacity .85, clipped inside torso. |
| Fabric patterns | User-space knit 7 by 6; rib 3.2 by 10; Fair-Isle 12 by 11; scarf 22 by 19; feather chevron 8 by 7. |

Keep base gradient and shade overlays inside the same clip, then grain the group. Draw face marks, whiskers, veins, code and cream decoration afterwards so they stay sharp. Big light planes use the lighter grain variant.

The edge mask is `2*alpha - 1.8*blur(alpha,3.2)`. A second term increases texture on dark fills; the resulting dark specks multiply onto the shape and remain clipped to its alpha. Fractal-noise base frequency is 2.1. Adjust density 1 to 1.08 rather than changing that frequency. The helper's default density is 1.08, k1=1.9, k3=.15; light-plane grain uses 1, 1.75, .06. Its luminance weighting is `1.82 - .66R - 1.3G - .24B`, with the weighted contribution `1.9*w*dw + .15*dw` before alpha clipping. These describe the source implementation, not a universal filter formula.

For the ground pool, layer `#B95A93` with an .8-opacity `#A04A80` core through displaced, mottled alpha. The chalk filter uses noise 1.4/two octaves, blur 1.6, displacement 6; coarse noise .22/.5 with three octaves; speck noise 1.5/two octaves and alpha `3.2R - 1.25`; soft blur 2.4. A lamp uses a .5 white cone through speck, not a radial glow.

Tapered limbs follow a smooth centerline with variable widths and rounded ends. The source tube samples 14 steps per segment, interpolates widths smoothly, offsets along normals and uses seven-point caps; omit a cap where the tube enters a sleeve. Its definitions also cover prefixed leaf/star/burst/drop symbols, color ramps and fabric patterns; no helper is installed by this topic.

## Animal anatomy and expression

[MengTo, illustration-grainy-gouache, SKILL.md Characters]

Use one animal. This direction's source contains no humans; choose another drawing direction when a person is required. Fox, otter, owl, rabbit, hedgehog, cub, raccoon, cat or badger can carry a new scene.

| Part | Dimensions and construction |
|---|---|
| Body proportion | Head 84 to 92 wide and at least torso width; head height .8 to 1 times shoulder-to-seat height. Head top to seat 110 to 150; add 30 to 40 for floor-reaching legs. Short limbs and no visible neck; chin overlaps shoulders 8 to 10. |
| Head | Smooth shaded silhouette, clipped darker crown, cream muzzle with its darker duplicate 1.6 lower at .55. Dark inner ears `#C2300A` or `#5A2408`; clip dark fox ear tips. Tilt head 5 to 9 degrees toward its attention. |
| Eyes | Cream ring `#F7D6A6`, radius 10 to 12; dark pupil .81 r, offset .22 r toward gaze. Centers 29 to 37 apart. Four-point cream star on upper gaze side, source scale .52 to .78; opposite lower dot radius 1.35 to 1.6. The helper uses star unit .052 r and dot .135 r. Sleepy eyes add a fur-colored lid, 1.3 lid line and outer flick. |
| Nose / mouth | Rounded inverted triangle 10 to 17 wide,`#0D0809`, shine `#6A5A5C`; 1.05 w-shaped mouth. Otter muzzle dots `#7A4A30`, radius .9. |
| Whisker / blush | Two whiskers per side, length 28 to 75, width .75 to .8. Blush `#FF7FB0` at .6, ellipse radii 4.4 to 6.6 by 2.6 to 3.4 under outer eye. |

A gripping paw connects forearm widths 12 to 9.5 through rib cuff 17 to 15.5 to a 9-by 15 palm. Put three finger tubes 4.6 to 4.2 wide and 5.8 to 6.8 long across the object, spacing 4.7, then a 5.6 to 4 thumb from the other side and .7 creases. Apply the shared handedness proof. A resting dark paw is about 19 wide; a perching foot wraps three 4.6 to 3.8 toes around the bar and ends each in a 1.3 dark claw. Use fur or dark-paw ramps so a paw remains visible against a cream prop.

Knit torso/sleeves can use separate dark/light patterns with rib neck, cuffs and hem. Fair-Isle borders are 1.3 ochre; scarf fringe 7 to 8; beanie cream pompom radius 8.6 with `#FFF0DC` highlight. Model folds through shading rather than outline marks.

On a ledge, overlap hips 4 to 6 onto its top. Let 19 to 13 legs drop before its face into outward-turned 8 to 20 degree feet, with four toe ellipses `#3E1A0A`, radii 2.35 by 3.3. A 17 to 4.6 tail can curl behind. On a low seat, keep the lap within hip width, indicate two knees, and drop broad 30 to 25 shins before the seat to floor contacts `#7A3A04`. Oversized lap silhouettes and thin inset shins can read as a skirt.

## Scene vocabulary and layout

[MengTo, illustration-grainy-gouache, SKILL.md Decor and props; Composition]

| Element | Recipe |
|---|---|
| Margin accents | Two 8-ray cream bursts, scale .75 to .9, one rotated 12 to 14 degrees; 6 to 7 four-point stars, scale .55 to .95; 18 to 21 dots, radius 1 to 1.4. Keep 8 units clear of the scene. |
| Leaves | Seven or eight ivy/oak/olive leaves, scale .55 to 1.4, in 2 to 3 loose groups beyond x 80/400, plus at most one high stray. Split each leaf into lighter/darker halves at its vein and grain it. |
| Scene bounds | Width 330 to 360, height 250 to 290, center within 10 of x 240. Pool bottom y 310 to 330, extending 10 to 20 beyond furniture each side. |
| Focus and supports | Face y 100 to 190 before a dark screen/pane/frame. No floor rule: pool establishes ground. Desk/sill contacts `#7A3A04` at .38, ellipse ry 1.7 to 2; edge highlight `#F6B860` width .9. |
| Layering | Background, margin accents, leaves, scene. Center or modestly scale the scene group only; leave margin artwork unchanged. Source examples use y-20/y+10 or 1.07 scale around(240, 178). |

Use 3 to 5 props serving the action. Choices include a laptop with radius 4 to 8 dark bezel, maroon code screen and three editor dots radius 1.5 to 1.9; a black-stand monitor with only tiny 7-unit monospace time text; a shaded cylinder mug with 2 to 3 cream steam paths; book stacks with 1.6 gilt rules and .9 dotted marks every 7; arched/round windows containing weather; ochre/maroon furniture; a speck-lit black lamp; a pot with five olive leaves and ivy; or folded notes. Keep medium density and visible pink around the group. Exclude UI-kit panels, logos and unrelated icons; this is an authored illustration, not a product-interface claim.

## Prove it

[MengTo, illustration-grainy-gouache, SKILL.md Workflow; Failure modes; Verify]

- Brief the subject, one action, animal, dark head backdrop and every paw's task. Block furniture, pool and silhouette before gradients; then add shading, patterns, face, paws and props, with leaves/decor last.
- Inspect 1x recognition and source-scale proportions; compare the whole-card sheet and 8x face, paw, foot and support crops. Confirm aligned gaze, visible finger/thumb construction, hip overlap and reachable contacts.
- Check hot-pink coverage, outline-free large forms, edge/dark-plane grain and crisp small details. Uniform full-card noise, opaque paw blobs, glows, more than 8 leaves and cream-on-cream contacts are defects in this direction.
- Verify palette, namespace references and allowed detail widths; record the actual renders and revisions. Report source scores as anecdotes only, not evidence that the target card passed.
