# Halftone line illustrations

Choose this optional direction for human scenes drawn in black lines and printed-looking dots on warm paper. Deliberately interrupted contours distinguish it from a closed-outline cartoon. Use [shared craft](ILLUSTRATION-CRAFT.md) for original composition, handedness and revisions. All values refer to a 480 by 360 drawing. [MengTo, illustration-halftone-line, SKILL.md]

## Two-ink contract

[MengTo, illustration-halftone-line, SKILL.md Palette; Line and fill]

Use only ink `#111111` and paper `#f4f1ea`. Apparent gray comes from ink dots, not gray fills, opacity or gradients. Paper also hides underlying objects and supplies 1.2 to 1.5 highlight/crease lines inside solid black. The source reports total ink coverage of 12 to 14%; use that as a reference-density observation rather than a computed requirement for a new scene.

| Mark | Width |
|---|---|
| Main contours, hands, furniture, shoes | 2, tuned within 1.9 to 2.1 |
| Screens, glass, plants, small props | 1.6 to 1.7 |
| Fingers, folds, cuffs, hems | 1.3 to 1.6 |
| Keys, nails, paper text marks | 1.1 to 1.3 |
| Curly accents, braces, rays | 2 to 2.3 |

Default to round joins/caps and no fill. Give each overlapping object a separate unoutlined paper silhouette, then dots, then its open contour. Leave 1 to 3 gaps of 4 to 14 units, particularly at corners/joins, and stop converging lines 2 to 6 units before contact. A shape's fill closure need not close its visible line.

Apply a single wobble filter to the artwork group: coarse displacement 2.3 plus fine edge displacement .8. Do not wobble paper or individual parts independently. Use stable per-card randomness.

## Dot geometry and tone

[MengTo, illustration-halftone-line, SKILL.md Techniques; scripts/halftone.mjs]

| Tone | Use |
|---|---|
| .19 | Light clothing, cushions, props and outer contact pool; dot radius about .6. |
| .36 to .38 | Shadow side, far limb, dotted hair and pool core; radius about .85. |
| .08 to .36 | Graded shading of rounded forms. |
| Solid ink | Three to five distributed masses: hair, foliage, bag, garment, device edge, sole or check. |

Keep pitch 2.58. A pitch below 2.2 or radius below .4 can merge visually into a gray wash at 1x. The source's .52 trousers produced blotchy dots; keep dotted shading at .38 or lighter and use a solid mass when darker emphasis is needed. The compiler's .92 maximum is an implementation clamp, not the style's recommended tone.

Nominal dot radius is `pitch*sqrt(tone/pi)`. The helper adds positional jitter 1 and radius jitter .5; when the calculated radius is below .4, it probabilistically keeps a dot using `(radius/.4)^2`, then gives a kept dot radius .4 to .46. Clip tests include center and four cardinal offsets 1 unit away. Supported tone functions include flat, linear, radial, additive radial, then multiplicative linear/noise terms; noise factor is `1 + amplitude*4*noise`, default scale 14. Its seeded lattice noise keeps rerenders stable.

The compiler samples cubic curves 12 times and understands M/L/H/V/C/S/Q/T/Z, not arcs. Approximate an ellipse with cubic segments using the source factor .5523 when working through that helper. Its older tile variant has a 60 by 60 paper-backed tile,scaled .86. It samples a pitch 3 grid and may add a second grid displaced by half a cell. The source parameters are:

| Tile | Main radius / radius jitter / position jitter / extra specks / half-cell dot radius |
|---|---|
| Light | .7 / .3 / 1 / 26 / none |
| Mid | .86 / .3 / .9 / 30 / .46 |
| Dark | 1 / .28 / .7 / 20 / .66 |

Extra specks have radius .35 to .65. A separate 4.8 by 4.8 tile places four .82-radius dots at x/y 1.2 and 3.6,also scaled .86. Prefer per-shape graded dots when that matches the target. Retain the final 2-unit line weight after scene scaling.

The coarse wobble noise uses frequency .052, two octaves, displacement 2.3; fine noise .8, one octave, displacement .8. These are drawing recipes, not permission to alter the surrounding page's text.

The original compiler evaluates JavaScript expressions and generator blocks using `eval`/`new Function`. It is executable authored input, not an SVG sanitizer. No compiler or helper is installed here; use reviewed local authoring code and the existing SVG security policy.

## People, hands and clothing

[MengTo, illustration-halftone-line, SKILL.md Characters]

| Part | Construction |
|---|---|
| Proportion | Head including hair 40 to 44 high; standing height 230 to 250, about 5.5 to 6 heads or 65 to 70% of card height. Seated hair begins near y 70. |
| Face | Profile/near-profile, paper nose wedge and interrupted brow-nose-chin-jaw line; hide the rear under hair. Source local head spans roughly x-26 to 31, y-26 to 32. A negative head rotation lowers a left-facing face. |
| Features | Dot eye radius 1.8 to 1.9 or calm closed arc; brow 1.6 to 1.7, smile 1.7 to 1.8; C-shaped ear/inner curl 1.6. Profile glasses show one round lens with an ear arm. Exclude blush, pupils and lashes. |
| Hair | Solid ink with one 1.3 paper highlight, or .38 dots with two 1.3 strands. Break silhouette with bun, tail, curls or fringe; a smooth cap/straight hairline can read as a helmet. Buns are black circles, ponytails teardrops; a dotted beanie has paper ribbing. |
| Torso | Paper quadrilateral neck with 1 to 2 width-1.5 lines, sloping shoulders and softly curved body. Near body/sleeve light tone; far/shadow parts mid tone; black garments use paper creases. Ribbing 1.3 ticks. Two black legs need a 1.4 paper separation. |
| Hand | Wrist-to-tip about .8 head height. Fingers and thumb each have a paper silhouette, open 2-unit outer contour, 1.2 to 1.6 creases/nails and small intervening gaps; cross the wrist with a cuff line. |
| Foot | Paper sneaker upper, black sole, 1.3 to 1.6 lace marks. In the source shoe primitive at scale .6, the anchor is heel bottom and ankle is 8 units in facing direction and 14 up. Separate heels by at least 26; avoid overlapping more than the toes. |

A typing/resting hand follows local+x, with fingers bending toward+y, the index at-y and an optional adjacent thumb. Mirror for leftward fingers and recheck anatomical handedness. Construct pointing/gripping variations with a visible extended index or stacked curled loops and a separate thumb. Never substitute a filled mitten for that anatomy.

Give each arm a purpose and each body weight: lean over a table, brace behind the back, sit with a raised thigh or stand with hip offset. Source torso lean about-8 degrees is applied about the hip to torso/neck/head together; move the shoulder anchor with it before reconnecting the arm. Existing large-head animation proportions remain a separate style.

## Props, ground and layout

[MengTo, illustration-halftone-line, SKILL.md Decor and props; Composition]

Use one or two people around one meaningful furniture/device group, with the contact between hands and that object as the focus. Draw paper-filled line props: open-leg tables/stools/benches, devices with one black edge, 1.3 to 1.7 screen marks/cursor, toned mugs, black-band cups, black foliage with paper veins or a dark tote. Text is limited to code-like marks such as `</>`.

Put 2 to 4 accents in upper open paper: a three-loop 2.3 squiggle, thought rays 1.8 to 2, 2-unit braces, black check, three-dot chat bubble with radius 3.2 dots, or a lined document/image. Keep 10 units from heads, hands and other subjects. Avoid stars, hatching, drop shadows and decorative colored accents.

A local floor stroke 1.9 to 2 goes only beneath supported objects; do not span the whole card. Every foot/base gets a light .19 pool with ry 5.6 and a .36 core at 58% of its width, ry 3.4. Floor y 305 to 322. Start with a square-cornered full-bleed paper rectangle, then definitions/artwork. Ink bounds span 78 to 82% of width and 73 to 80% of height, with 37 to 55 unit margins; a small centering translation, about plus/minus 4 in the source, is sufficient. Spread the 3 to 5 solid masses across the scene.

## Prove it

[MengTo, illustration-halftone-line, SKILL.md Workflow; Failure modes; Verify]

- Brief the action, furniture/device and hands. Block skeletal proportions, floor and margins before details; layer floor/supports, furniture, far parts, near parts, hands, then upper accents.
- Check paper-fill/dots/open-contour order, deliberate gaps, stroke hierarchy, tone limits and two-color output. Compare 1x recognition and same-scale dot density; inspect 8x hands, face, feet and contacts through the shared craft workflow.
- Verify thumb/index proof, arm connections, heel separation, broken hair silhouette and local floor pools. Change authored source rather than manually patching generated dot output.
- Record rendered evidence and palette/namespace checks. No source critique score or unrun compiler command proves the new card passed.
