# Line interior illustrations

Use this optional direction for a spacious room or terrace with slim people working on a clear task. A thin indigo contour and mostly white surfaces carry the picture; pale wall details and a few flat accents stay secondary. Follow [shared craft](ILLUSTRATION-CRAFT.md), with the 480 by 360 geometry below. [MengTo, illustration-line-interior, SKILL.md]

## Palette and coverage

[MengTo, illustration-line-interior, SKILL.md Palette; style.json]

| Material role | Colors |
|---|---|
| Indigo ink | `#3a2d66` |
| Wall line | `#cfc9e0` |
| White | `#ffffff` |
| Peach wood | `#f9c99a` |
| Mustard | `#f5c35a` |
| Orange | `#f6a85e` |
| Coral | `#ef5b5b` |
| Teal | `#3fa58a` |
| Sage / Leaf | `#8cc79b` / `#5fae7a` |
| Lavender | `#ab9ee6` |
| Purple | `#7f6cc4` |
| Denim | `#7f9fdc` |
| Brown | `#7b4b3a` |
| Skin | `#f3cdb0` `#e2a57c` `#b47852` `#7a4b33` |

The source reports about 85% white, 2% indigo and 4 to 7% accents, with 84 to 86% white across its examples; treat those as source observations. Keep large furniture white or peach, one accent per object and at most two clothing accents plus white per person. Different people use different skin tones. Separate large equal-hue accents so they do not merge. Exclude gradients, opacity, shadows, hatching, black/gray fills, colored backgrounds and pale wall-color fills.

## Contours and layers

[MengTo, illustration-line-interior, SKILL.md Line and fill]

| Element | Width or detail |
|---|---|
| Foreground | Indigo 1.4, round joins/caps, each shape filled white or its chosen accent. |
| Background | Pale wall line 1, unfilled; no foreground-color decor. |
| Interior detail | Width 1 for folds, veins, book bands, laces, ear/brow/nose/mouth, steam, x marks and hair arcs. |
| Finger / board / code | .9 finger separations; 1.2 diagram lines; 1.7 to 1.8 colored screen dashes; 2.2 short bullet strokes. |
| Folds | Two or three curves per garment, length 4 to 8; keep clear of neighboring contours. |
| Surface marks | Two to four 3-unit x marks on pots/boxes, never on clothes. |
| Tiny label | System monospace, weight 700, size 4.4 to 5.2, 2 to 5 letters, unoutlined, inside a small label patch. |
| Corners | Radius .6 to 1 on books/bricks; 1.5 to 2.5 on furniture/frames. |

Depth comes from filled-shape overlap, not shading. Draw far limbs before torso and foreground afterwards. End hidden shapes at least 3 units inside their covering shape; folds within 4 units of an edge or straps protruding 2 units can look accidental.

## Human proportions and arm targets

[MengTo, illustration-line-interior, SKILL.md Characters; Techniques]

| Part | Geometry |
|---|---|
| Standing body | Height 229 to 235, head 33 to 36, roughly 1: 7; shoulder width 30. Hip half-width 9.6 to 11 tapers to 5.6 to 5.8 at trouser hem. |
| Face | Three-quarter profile, nose/chin contour, rear ear; near eye radius 1.15, far 1, spacing 4.9; 1-unit brows, nostril tick and small mouth arc. No blush, pupils or open mouth. |
| Hair | Flat indigo with 1 to 4 purple shine arcs, or brown with orange arcs. Curls, bun, side part, crop, beard, glasses and earring can vary; draw back hair before torso. |
| Head tilt | Four to nine degrees toward attention. Positive screen rotation lowers a right-facing head and raises a left-facing head. |
| Torso | Neck and soft 30 to 34 wide shirt from the head center; crew tee or small V-neck with two 1-unit folds. Mirror relative shoulder/hip/waist anchors for left facing. |
| Sleeve | Source cap length 13, half-width 5.8, drawn after skin arm; stay below 6 half-width to avoid a padded shoulder. |
| Arm | Half-width 4.4 to 5 at shoulder, 4 to 4.4 at elbow, 3.2 to 3.4 at wrist. Upper segment 27 to 40, forearm 24 to 33; common solver lengths 35/30. Add 3-unit inner elbow crease. |
| Reach | Wrist 45 to 60 from shoulder; try both elbow orientations and favor a natural elbow below the shoulder-wrist line. A 33-unit target with 66-unit arm length produces an overfolded pose. |
| Hand | Local length 17 at scale 1.05 to 1.15, giving 18 to 20; three or four grouped rounded fingers, .9 separations, longer middle/shorter little finger. |
| Trouser and shoe | Rolled cuff 5.2, ankle 4 to 10. Sneaker 25 by 10.6, sole 3, two lace marks. End leg at the shoe's actual opening. |

Choose hand behavior explicitly: typing, palm-down; cup, thumb over rim; wrapped object, thumb hidden; marker fist; point; or relaxed rest. The source hand contour stores its thumb on local-y; flip local y when the handedness proof requires the other edge. Draw the hand as a fill plus an open outline without the wrist-closing edge, then finger lines and thumb, so no dark wedge separates wrist and palm.

Place a fingertip on its intended object first, derive the wrist by inverse hand placement, and solve shoulder-elbow-wrist from there. For a lean, rotate torso, neck, head and accessories 4 to 9 degrees around the hip, and rotate shoulder anchors with them; solve arms in card space so contacts remain fixed. Keep the far forearm/hand visible behind the torso or object. A raised rear heel uses a 22 to 28 degree shoe rotation with toe contact; mirroring reverses rotation and shoe-opening orientation.

The source elbow helper clamps only maximum reach. If adapting it, validate positive finite lengths and distance between the segment-length difference and sum, and handle a coincident target before normalizing. Its line-intersection routines likewise assume nondegenerate geometry. These are helper limitations, not reasons to discard a correctly targeted two-segment arm. The source path mirror reverses arc rotation and sweep; placement compensates stroke widths under scale.

## Room and composition

[MengTo, illustration-line-interior, SKILL.md Decor and props; Composition]

Use the host's white background, or a square-cornered full-bleed white rectangle when needed. Draw the floor at y 308: central x 56 to 424, short dashes x 40 to 50 and 430 to 440. All feet, pots, legs and casters meet that line; leave y 308 to 360 empty.

Fit content x 33 to 445, with y 25 minimum except top-hung lamp cords. A tall plant occupies roughly x 33 to 121, the main prop/action x 115 to 335, and a secondary group x 330 to 445; mirror that arrangement when useful. Standing figures are about 235 high and 94 to 190 wide. Keep 10 to 14 foreground objects, including leaves, with open intervals between groups.

| Group | Source vocabulary |
|---|---|
| Pale interior | Two to three brick clusters of 3 to 5 bricks, 14 by 6, row spacing 7; one or two hanging dome/cone lamps; one nailed poster with a simple mark. |
| Pale exterior alternative | Two to three clouds, two to three birds, skyline and railing. |
| Central object | Ladder shelf 98 by 203, wheeled board 160 by 256, or 260 wide hammock, with a newly composed action. |
| Side plant | Width 60 to 68, height 150 to 185; lance/fig/snake leaves, 1.4 stems, alternating sage/green. White marked pot, peach banded pot or orange pot. |
| Small props | Two to four: mug with two 1-unit steam paths, banded/labeled books, duck, notes, monitor. Screen uses 4 to 6 rows of 1.8 accent dashes and coral/mustard/teal window dots radius .9. Diagrams use 1.2 boxes/arrows with selected coral/teal boxes. |

Keep background decor at least 8 units clear of the head. Exclude floating icons, speech balloons, confetti, stars, rugs, object shadows and more than two stray floor items beside the central prop. An action such as taking a book or drawing on a board should identify the subject; mere proximity to furniture is insufficient.

## Prove it

[MengTo, illustration-line-interior, SKILL.md Workflow; Failure modes; Verify]

- Specify action, main object, pose, skin/hair and clothing accents; plan floor and side groups before authoring detail. Preserve shoulder/elbow/wrist coordinates for geometric inspection.
- Inspect 1x subject clarity, standing 1: 7 proportion, thin contour hierarchy, white-space density and quiet background. Compare a same-scale sheet and 8x hands, face, feet and supports through shared craft.
- Confirm each hand's 18 to 20 length, thumb side, open wrist and varied finger bands; both arms connect through visible elbows and land on their actual targets.
- Check every floor contact, empty lower band, limited accents, no clothing x marks and unique IDs. Record actual renders and revisions rather than adopting source anecdotal scores as proof.
