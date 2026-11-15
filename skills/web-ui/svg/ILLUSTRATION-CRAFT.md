# Shared static illustration craft

Use this workflow for the six optional SVG illustration directions. Their numbers describe a 480 by 360 drawing; they do not redefine the project's interface, icon family, brand or motion system. Follow [SVG security](OPTIMIZING-AND-SECURITY.md), [accessible embedding](ACCESSIBILITY.md) and the selected style's material and anatomy constraints. [MengTo, illustration-framed-panel/references/craft.md; integration scope]

## Drawing contract

[MengTo, illustration-framed-panel/references/craft.md, The card file]

- Author one SVG with the SVG namespace and viewBox 0 0 480 360. Express styling through presentation attributes. For this card format, exclude style/class/script/image/foreignObject and external href/url resources. That restriction makes the asset portable; a regex check for those strings is not a sanitizer.
- Give each card a short unique prefix and apply it to every definition and reference: gradients, patterns, filters, clips and masks. Inline instances also need distinct IDs; follow the existing SVG owner for reproducible server/client IDs.
- When the selected style uses a background, cover the whole coordinate rectangle without rounding it. Let the embedding container supply the corner radius.
- Use system sans or monospace when the scene requires a little text. Branding and wordmarks retain the project's existing policy; this recipe does not authorize redrawing them. Keep the words subordinate to the picture.
- Repeated hatches, dots, brush outlines, grass and bricks may use a small seeded generator. Place the main character and object deliberately. Stable seeds let a local correction stay local.

## Original scene and composition

[MengTo, illustration-framed-panel/references/craft.md, Originality and Composition]

Write the subject and its single visible action before drawing. Choose props that identify it at 480 pixels wide. Plan a new pose, object grouping and spatial arrangement; changing colors while retaining a reference's scene is insufficient. Compare the finished composition with every consulted reference and recompose recognizable borrowings.

Keep one focal group, balanced open margins and the selected style's density. Neither empty quadrants nor added decoration should weaken that focus. A visual joke or subject cue must work at 1x without a caption supplying the missing meaning.

## Hand construction and orientation

[MengTo, illustration-framed-panel/references/craft.md, Hands]

Build the connection from cuff through tapered forearm and narrow wrist into palm, fingers and thumb. Let finger lengths differ: middle longest, little shortest and lower; group them instead of making an evenly spaced rake. A hand about chin-to-brow length is a starting point, subject to the selected style's proportions. Use the style's own contour, tone or continuous-line vocabulary for finger separation.

For each hand, record anatomical left/right, visible palm/back and wrist-to-finger direction. Trace the arm to its shoulder and use overlap to resolve the near side. In the source profile convention a right-facing figure usually presents its right side, and a viewer-facing figure's right hand appears at the viewer's left; do not infer handedness from screen position alone.

| Anatomical hand | Visible surface | Thumb when fingers point up | Rotation from finger direction |
|---|---|---|---|
| Right | Back | Left |90 degrees counterclockwise |
| Right | Palm | Right |90 degrees clockwise |
| Left | Back | Right |90 degrees clockwise |
| Left | Palm | Left |90 degrees counterclockwise |

For an edge-on hand use a 3D orientation: x right, y up, z toward viewer. With finger direction f, palm direction p and thumb direction t, the source uses t=f cross p for the right hand and t=p cross f for the left. A right palm-down hand pointing right hides its thumb on the far side; the corresponding left hand presents its thumb. The index is beside the thumb; the little finger occupies the opposite edge.

| Action | Observable construction |
|---|---|
| Grip | Fingers and thumb close from opposite faces of the object; overlap alternates around the grip. Two hands need separate fists and a visible interval. For a bat/handle grip, thumbs point toward the working end. |
| Type or rest | Palm lies flat or arches over the surface, fingertips meet it and thumb placement remains legible. |
| Point | Index extends; curled remaining fingers show knuckles and thumb closes over the middle finger. |
| Wave | Fingers separate modestly and thumb opens about 45 degrees. |

Make a temporary proof with red thumb and blue index, rerender that hand at 8x and compare it with the written orientation. For a one-line hand use colored tip markers through the same placement transform. Remove proof artwork afterwards.

## Weight, connections and contact

[MengTo, illustration-framed-panel/references/craft.md, Pose and contact]

- Give the action a support leg, lean, knee bend, twist or opposing pull. A seated figure needs hips and cushion geometry that carry its weight; on a soft seat the hips can sink below the knees and compress the cushion.
- Every supported item meets its actual support: soles on floor, cup on table, body on seat. Deliberately floating accents stay clear of the subject. Resolve almost-touching contours by separating or overlapping them clearly.
- Trace every hand through elbow to shoulder. Taper legs toward the ankle and connect each shin at the shoe collar above the heel. With a flat foot, the source limits shin lean to about 20 degrees from vertical; a further tucked leg needs a downward toe. Keep both shin lengths plausible.
- Check furniture reach against the complete body. A ring 35 pixels below a seat cannot automatically support a foot when the knees project 70 pixels forward. Move the foot to the floor when the geometry does not reach.
- Include a neck unless a selected stylization deliberately omits it. Static 1: 7 or 1: 5 proportions are alternatives to the existing motion owner's large-head character recipe; preserve each within its own style.

## Render, inspect and revise

[MengTo, illustration-framed-panel/references/craft.md, The loop]

1. Render the whole SVG at 2x using an installed, reviewed renderer. Use a bounded headless render when appropriate; this topic does not install the source scripts or require a visible browser.
2. Compare a same-scale contact sheet against the selected style, checking material, line hierarchy, palette, density and margin balance.
3. Rerender vector crops at 8x for hands, faces, feet, contacts and crossings; inspect hands at 3x or greater. Upscaling a small raster does not reveal the same geometry.
4. Inspect the 1x image for immediate subject recognition.
5. Record specific defects, change the affected drawing, rerender and compare before/after regions. Continue until the agreed criteria pass; no fixed number of rounds guarantees quality.
6. Check structure, namespaces, local references and palette. Treat deliberate extra tints explicitly. Structural lint and a clean console do not establish visual quality or safe handling of arbitrary SVG.

## Optional critique rubric

[MengTo, illustration-framed-panel/references/craft.md, Scoring and When someone else judges]

The source assigns 0, 1 or 2 points each for style fidelity, character drawing, pose/physicality, composition and subject clarity/craft, with 8/10 as its working target. Use that only when a numeric critique is useful and the user has agreed to the target. Explain the observable defect behind every lost point.

Two fresh judges can expose different defects; the source takes the lower score. Give each judge the correct subject. For comparing versions, show the pair in randomized order to one judge rather than treating separate absolute scores as calibrated measurements. The reported 1.5 point repeat variation and roughly 1 point inter-judge drift are source anecdotes, not statistical error bounds. Send focused corrections to the same illustrator, and restore a previously better region without discarding unrelated improvements.

## Prove it

[MengTo, illustration-framed-panel/references/craft.md; integration validation]

- Keep the declared style, original scene brief, 1x image, 2x whole-card render, 8x contact/hand crops and same-scale comparison sheet.
- Verify the thumb/index proof, contact geometry, palette and per-card ID references; remove temporary labels and debug marks.
- Report the renderer, images actually inspected and corrections made. Source anecdotes, unrun commands and structural checks alone do not prove the delivered drawing passed.
