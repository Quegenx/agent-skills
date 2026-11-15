# Ink sketch illustrations

Choose this optional direction for a cartoon creature or animated object whose anatomy carries a product metaphor. Use variable brush polygons, slightly displaced marker fills, hatching and oversized expressive eyes on white. Follow [shared craft](ILLUSTRATION-CRAFT.md); all measurements assume 480 by 360 drawing units. [MengTo, illustration-ink-sketch, SKILL.md]

## Palette

[MengTo, illustration-ink-sketch, SKILL.md Palette; style.json]

| Material role | Colors |
|---|---|
| Card background | `#ffffff` (none drawn) |
| Ink | `#1d1a18` |
| Red | `#f0563d` / `#b8311f` / `#ff8a6a`, deep `#9a2414` |
| Yellow | `#ffc83d` / `#ef9a24` / `#fff1b0` |
| Green | `#5cb946` / `#2f8a38` / `#a6dc62` |
| Blue | `#66cdea` / `#2a8fbf`, drop `#bfe8f7` |
| Teal | `#2fb5a7` / `#167a71` / `#8fe3d6`, deep `#0f5c55` |
| Wood | `#eaa85c` / `#b8722f` / `#f8d6a0`, deep `#8a5320` |
| Blush | `#ff7f86` (op 0.5 to 0.75), ticks `#d9434f` or `#c8303f` |
| Eye shade | `#c9d6ea` |
| Paper | `#fffaf0`, fold `#d9d2c4` |
| Singles | mouth `#3b1f1a`, petal `#ff8fa0`, soil `#5b3b2c`, coffee `#6b4330`, soft shadow `#7f97ab` (op 0.22) |
| White | `#ffffff` |

Leave the background rectangle out; the embedding surface supplies white. Pick two subject color families, with green ground or wood furniture, and reserve a third family for a small prop. Avoid gradients. Transparency belongs to mottle, streaks, gloss and blush. Hatching carries large dark regions; solid ink should not exceed a pupil-sized mass.

## Brush and fill construction

[MengTo, illustration-ink-sketch, SKILL.md Line and fill; scripts/ink-kit.mjs]

Every visible line is a filled polygon with pressure, nib angle and taper, not an SVG stroke. The source examples contain no stroke attributes.

| Mark | Parameters at 480 wide |
|---|---|
| Main contour | Nominal width 4.6, clamped 1 to 4.4; pressure .4, wavelength 26, nib .3; down-right shadow boost .3 to .36; tapers 3 to 30. Split each shape into 3 to 6 marks with a lit upper-left gap and 2 to 14 overshoot. |
| Rim, mouth, bubble tail | Width 2.4 to 3.2, nib .45, pressure .4, frequency 8. |
| Crease, rib, wood mark | Width 1.1 to 1.8, opacity .55 to .85. |
| Hatch | Width 1 to 1.15, spacing 2 to 3.2, angle-48 to-58 degrees, or-130 when the lighting reverses. Jitter ends inside the boundary. |
| Stray hair | Two to five per contour mark, width .9 to 1.5, length 2.5 to 7, projecting from shadow side. |
| Margin fleck | Nine to eleven, size .8 to 1.7. |
| Color silhouette | Offset 2 to 3.6 from its contour; control-point jitter 1.2 to 1.6. Use different displacement directions per part. |
| Mottle | Dark member of color family at .36 to .5 over each fill. |
| Dark marker pass | One to three clipped marks, width 4 to 16, opacity .3 to .55, on shadow side. |
| Lit swipe | One or two white marks, width 2.4 to 6, opacity .85 to .95, on upper-left round surfaces. |

Two uniquely prefixed filters supply roughness and mottle. Whole-card roughness uses fractal-noise frequency .45 and displacement .7. Mottle uses frequencies .035/.06, three octaves, and alpha `2.6A - 1.25`.

The brush envelope is `smoothstep(s/t0)^.5 * smoothstep((L-s)/t1)^.7`; a nib factor `1-nib+nib*abs(sin(theta-penAngle))` changes the width with direction. Shadow direction and seeded pressure/noise modulate it further. Keep one random stream per stable mark key so modifying one item does not reroll the whole image. The source uses a keyed xmur/mulberry stream; equivalent deterministic authoring is sufficient.

Draw displaced color first, then mottle and clipped shade/gloss, then broken brush contours, hairs and small marks. Reusable source operations include sampled strokes, hatching, slipped fills, mottle, clipped tube shading, partial limb outlines, hands, grass, blush, sweat, code stickers, torn scraps and even-odd rings. No source toolkit or raw-string label API is bundled here.

An optional 26-wide infinity mark follows `x+13*cos(t)/(1+sin(t)^2)` and `y+13*sin(t)*cos(t)/(1+sin(t)^2)`, sampled every .07 radians through `2*pi+.35`; source width 3, tapers 3/5, nib .45, pressure .3, frequency 8. Apply the same brush rules instead of inserting a clean typeset glyph.

## Creature and face record

[MengTo, illustration-ink-sketch, SKILL.md Characters]

Use a critter or living object rather than a person. Make its body express the idea: loading through a shell, branching through tails, or a code-marked object. Build the silhouette as a variable-width tube or 12 to 24 point closed blob; source body/head widths 40/49 illustrate swelling toward the head. Overall subject width is 60 to 70% of the card.

| Part | Recipe |
|---|---|
| Eye | Radius 19 to 27.5, about 40 to 55 across or one-third to one-half head width. Let paired whites differ slightly and touch/overlap. Add lower-right `#c9d6ea` crescent, swelling rim, pupil radius .5 of eye offset 4 to 10 toward attention, and two unequal white highlights. |
| Grumpy lid | Body-colored lid height .34 to .38 of eye, tilt 17 degrees. |
| Face | Blush ellipse 8 by 4.6 with three red ticks. Smile is a curved mark with tiny end ticks; cheer a dark mouth/tongue; anger a white tooth shape with two divisions; pout a downward line/lower lip. |
| Hand | Palm plus three capsule fingers and thumb in limb color, open knuckles, crease and shadow streak. Source fingers 12 to 14.5 long at scale 1.25. Use the handedness proof. |
| Stalk/tail | Two outlined tube edges or one spiraled brush mark. Thin legs may be 2.4 to 3 brush marks ending in small filled ovals. |
| Small-mammal foot | Short 9 to 14 wide tube to a pink 5.4 by 3.2 oval and short ink underline. Far legs precede body; near legs follow it. Put hind leg behind hip and front leg ahead of shoulder for a running gesture. |

Emotion can use sweat, an anger symbol of four bowed brackets, tapered concentric motion arcs 2.4/1.8 or steam. Keep 25 units open around the face, and never terminate a limb at the mouth; a prop should not merge the nose, mouth and paws.

## Ground, props and framing

[MengTo, illustration-ink-sketch, SKILL.md Decor and props; Composition]

Choose a ragged grass bed or slightly elevated-view wooden desktop. Grass runs roughly x 52 to 428, top y 272 to 280, with bowed-up dry ends, blade flicks and one or two tall end tufts. A table can show grain and one hatched support. Put a width 1, spacing 3 to 3.2, opacity .85 to .9 hatched ellipse under every resting part and a darker contact mark at the body base.

Use 1 to 3 subject props: code sticker, brush-lettered bubble, torn code note, steaming mug, hatched blue progress strip, commit dots, burst or flower. Brush lettering uses 2.4 to 2.6 width and 12 to 17 height; avoid fonts. Keep marks 4 units inside torn paper. Signs need a grounded stake; only bubbles, thrown scraps and expressive marks float.

Fit art within x 36 to 444, y 40 to 340, with only dry ground ends reaching x 36. Center the subject low, about 60% of card height, and put its eyes in the upper half. A spare upper corner can take one bubble/scrap/mark. A round/tall subject may use 50% width with one grounded side prop.

Define supports in card coordinates before mapping into scaled groups. Around pivot B0 at scale S, the inverse point is `B0 + (worldPoint-B0)/S`. Draw mark widths divided by S so they remain correct after scaling. Source subject scale 1.12 around its ground pivot requires width compensation 1/1.12, then restoration outside that group; a whole-card y-8 shift is its margin-balancing example. Preserve actual contact and line weight instead of copying that shift blindly.

## Prove it

[MengTo, illustration-ink-sketch, SKILL.md Workflow; Failure modes; Verify]

- Specify subject, body metaphor, expression, silhouette, eye positions and support before detail. Block ground, color body and eyes; verify 1x recognition and placement.
- Add shade, hatching, broken contours, face, props, lettering and flecks in that order. Compare a same-scale sheet and 6 to 8x vector crops of eyes, hands, contacts and lettering.
- Check 1 to 4.4 brush variation, gaps/overshoot, 2 to 3.6 fill slip, each fill's mottle, round-form gloss, hatched dark regions, two eye highlights and directional pupils. Uniform SVG strokes, sealed loops or exact color registration violate this direction.
- Verify stable keys, unique filter IDs, scale compensation, ground contacts and palette. Record actual renders and fixes; source reproduction/demo-size claims and old critique scores do not prove target quality.
