# One-line illustrations

Use this optional SVG direction for a figure in energetic action, drawn through one continuous route with displaced flat color patches behind it. Keep the scene original and apply [shared craft](ILLUSTRATION-CRAFT.md), especially hands, joints and contact. Measurements assume a 480 by 360 drawing. [MengTo, illustration-one-line, SKILL.md]

## Palette and line record

[MengTo, illustration-one-line, SKILL.md Palette; Line and fill]

| Role | Value and use |
|---|---|
| Paper | `#ece7da`, square-cornered full-bleed rectangle. |
| Ink | `#1d1b1a`, figure, props, glyphs, speed marks, eye and small dots. |
| Coral | `#f2846e`, front face/hands, stripes and small accents; not trousers or an entire top. |
| Periwinkle | `#8790f4`, trousers, hair, screen/prop patches; not skin. |
| White | `#ffffff`, top, sleeves, shoes, cup/cloud/ground patches. |

Mask black/white are invisible control values only. Exclude other colors, gray, gradients, opacity, patch outlines and ink-filled masses larger than a 1.9-unit dot. The source reports paper 87 to 89%, ink about 2%, white patches 3%, periwinkle 2.3 to 3.7% and coral .8 to 2.8%; its composition discussion gives paper 86 to 89%. These are source density observations, not a promise about a new render.

| Stroke | Width |
|---|---|
| Figure and props | 2.3, round caps/joins. |
| Long motion path / clock hand | 2 to 2.1. |
| Code glyph | 1.8. |
| Coral top stripe | 1.9. |
| Colored code dash | 2.3. |

Use smooth cubic segments with one-decimal coordinates. The figure is one path; only eye, small hem/cuff, props and motion accents may use separate strokes. Each prop also follows its own connected route. A route-point tension of 1 is smooth, .4 to .6 makes an elbow/knee/collar corner, and 0 makes a sharp glyph corner.

Draw closed color patches first, then stripes/dashes, then ink. Offset patches 2 to 6 units so one side falls short and another spills beyond the line. Give each patch a distinct stable seed. Wobble amplitudes: face/hand .8 to 1.5, limbs 1.4 to 2.4, large shapes 2.2 to 3. Use 3 to 5 curved coral stripes per top, ending 2 to 4 before the contour, and 1 to 2 short sleeve stripes.

## Character and route construction

[MengTo, illustration-one-line, SKILL.md Characters; Techniques]

| Part | Source geometry |
|---|---|
| Figure | Height 190 to 240, about 53 to 67% of card height; head 41 to 48, roughly 1: 5. |
| Arm | Width 18 to 21 at shoulder, 8.6 to 9.5 at wrist. |
| Leg | Width 27 to 28 at hip, 12 to 13.5 at ankle. |
| Hand | Loop 19 to 27 long, local scale 1.1 to 1.3, coral patch offset 2 to 3. Include thumb notch/lobe or separate finger loops. |
| Shoe | Loop 30 to 35 long, local scale 1.25 to 1.3, white patch offset 3 to 4; one small heel loop is allowed. |
| Cursive loops | Two to four, radius 3 to 5, at ends or transitions such as heel, waist or hair. Avoid a loop in the middle of a leg. |

Route through throat/chin/lips/nose/brow, crown, hair, rounded rear skull and nape. Let the profile imply the mouth; add only a short closed-lid eye. An optional ear C-loop must remain legible at 8x. The coral face patch covers the front half only and shifts 1 to 2 toward the profile. A flat rear skull/ear combination can read as a helmet.

Use a periwinkle hair patch behind bun/ponytail/crop, or 4 to 5 trochoid curls of radius 3 to 3.5 without a patch. Torso, arms and belly remain segments of the same route; do not add a detached torso outline. Build each limb as two tapered sides connected around its hand/shoe. At a joint, remove a backward first point or shift the placed end shape 3 to 4 units rather than leaving a hook. Choose handedness and local mirror from the shared proof before routing fingers.

A gripping wrist should be 45 to 60 from its shoulder, with plausible segment lengths; the source's 48-unit target with upper 33/forearm 15 still produced an awkward fold. For a riding figure, show the near leg before the prop and mask hidden prop lines using the closed figure silhouette with width 5. A route can close at its heel for that purpose.

Plan the whole route before detail. One running topology begins at ground/heel, travels up the trailing-leg front through crotch, around leading leg/shoe to belly, around far arm/fist to shoulder/neck/profile/hair/nape, around near arm/hand to armpit/back/waist/seat, then down trailing-leg rear through heel/sole/toe to the other ground end. A rider topology can go heel/calf/thigh/seat/back, raised arm/hand, head, near arm/hand, belly, thigh/shin/shoe and back to heel. These describe contour connectivity; do not reuse the source pose coordinates.

Choose a diagonal action with a readable weight shift: leap, sprint or single-leg balance. The source running lean is 11 degrees. Rotate upper-body points about hips before constructing the final route. Leave more room in the direction of travel.

## Color patches and masks

[MengTo, illustration-one-line, SKILL.md Techniques; scripts/oneline.mjs]

| Patch | Offset / wobble |
|---|---|
| Chest | (-4, -3), amplitude 2.4 to 2.6. |
| Sleeve | Centerline blob width multiplier .95 to 1.05; offset plus/minus 2 to 3 horizontally, -3 vertically; amplitude 1.4 to 1.6. |
| Trousers | Width multiplier 1; offset(5, 3); amplitude 2.2 to 2.4. |
| Face | Source local polygon runs approximately(6, -12), (16, -8), (22, 2), (19, 13), (9, 15), (5, 2); offset(2, -1); amplitude 1.1 to 1.5. |
| Hair | (-3, -2), amplitude 1.2 to 1.6. |
| Hand | Five to six-point blob; offset 2 to 3 on each axis; amplitude .8 to 1.2. |
| Shoe | Local extent roughly x-7 to 22, y-3 to 11; offset(3 to 4, 2 to 3); amplitude 1.2. |
| Prop | Offset(3 to 5, plus/minus 3), amplitude 1 to 1.8. |

Hidden line segments use a mask of the front silhouette, black with an extra 2 to 10-unit stroke to create separation. For a path threading multiple objects, the source uses 9 to 10 around each occluder. Map line, patch, accent, mask and dot through the same scene transform; otherwise their registration/occlusion diverges.

The source wobble combines three seeded sine components with weights .55, .30, .15 and amplitude .8 to 3. Its authoring helper exposes curve/tube/blob/wobble/placement/reversal/rotation, local hand/shoe/head shapes and separate patch/accent/ink/definition/debug layers. No helper is installed here. Keep patch IDs distinct from line IDs, for example with a color suffix; remove debug route numbers before delivery.

## Props, ground and framing

[MengTo, illustration-one-line, SKILL.md Decor and props; Composition]

Use 1 to 3 action-related props, each with one connected ink route and one offset patch: code device, braces, cup, stopwatch, bug or loading-ring sun. Three speed strokes can trail behind, length 26 to 52, spacing 13 to 16, or one looping squiggle can connect the action. Code uses 1.8 glyphs and 2.3 coral/periwinkle dash rows; avoid prose, UI panels, confetti, stars, box frames, shadows and horizon lines.

For a planted foot, draw a 90 to 110-wide squiggle 1.1 units below the actual lowest sole, with a white/periwinkle patch. An airborne figure needs no ground. Include the final route endpoint when measuring minima/bounds: the source sampling helper omits it and can misplace the support.

Art bounds are about 245 to 377 wide and 240 to 284 high, with 30 to 40 margin and top at least 36. Keep 12 to 17 patches and 15 to 40 ink paths overall. A large prop's patch covers 60 to 75% of its shape and offsets 4 to 6; keep its figure at least 190 high. Source scene maps use 1.05 to 1.1 scale about a center plus translation; when mirroring x about 240, leave code glyphs in unmirrored card space.

## Prove it

[MengTo, illustration-one-line, SKILL.md Workflow; Failure modes; Verify]

- Brief one action and 1 to 3 identifying props; plan hip, shoulders, head and 4 to 5 point limb centerlines. Trace the complete route and each hand's orientation before color.
- Check 1x subject recognition, one-path continuity, stroke hierarchy, patch displacement and sparse paper share. The source's weak sprint example had an undersized skull, unclear planted shoe and generic subject cue; do not treat shipped examples as an unquestioned quality bar.
- Inspect 8x hands, head, shoe joints, planted sole and every crossing; use temporary red/blue tip markers of radius 2.2 through the exact placement transform for thumb proof. Remove them afterwards.
- Confirm masks hide back lines, no patch is exactly registered, wobble stays within .8 to 3, IDs are unique and debug output is absent. Record actual renders, local corrections and remaining limits.
