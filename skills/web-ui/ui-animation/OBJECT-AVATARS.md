# Flat object characters with capsule eyes

Avatar supplies one optional character language: a recognizable flat object, two capsule eyes projected around a sphere and a body that follows its gaze. Use it when that language is selected, preserving supplied artwork and the broader [illustration acting method](ILLUSTRATION-ACTING.md). Its geometry, palette and idle motion are source choices, not universal requirements for characters or production UI. The source's face and contact-sheet helpers are not bundled. [avatar, SKILL.md, Study the reference; Draw the silhouette; Put the eyes on a sphere]

## Let the recognizable object carry the face

[avatar, SKILL.md, Study the reference; Draw the silhouette]

- With a named reference, inspect its footage and record eye geometry and timing without rounding measured values for convenience. Without a reference, distinguish chosen starting values from measurements.
- Choose the view whose outline identifies the object. Make its face-bearing mass large enough for the widest eye expression with calm fill around it, rather than attaching a new block or shrinking the eyes to fit.
- Size secondary parts by their complete outline, including enclosed holes. Keep them subordinate to the face-bearing mass.
- Retain only the steps and parts needed for recognition. Make joins clearly stepped or smoothly continuous; avoid tiny slivers, almost-aligned edges and accidental notches.
- Reserve holes for actual openings. The source's toy anatomy uses soft tips, rounded corners and no part thinner than an eye. Check the whole silhouette at the intended size and during a lean; satisfying geometric rules does not guarantee recognition.
- Keep body and eye colors theme-aware. The source's solid silhouette, saturated fill and absence of a mouth or nose are this recipe's style, not reasons to redraw an existing character.

## Project eyes and blend expressions

[avatar, SKILL.md, Put the eyes on a sphere; Make moods from eye shapes]

Place the capsule eyes on a sphere behind the face. Yaw, pitch and roll move them around it; their apparent width narrows toward the edge and they fade behind it. Clip them to the moving silhouette so a wide glance cannot escape the body. This is a different rig from flat pupil translation.

Represent moods as numeric parameters for eye width, height, tilt, spacing, openness and gaze offset. Blend the parameters rather than swapping whole face drawings. Avatar's idle, attentive, excited, happy, sleepy and asleep states are a starting set, with non-overshooting expression blends. Add secondary action specific to the object's construction.

## Let page events change the character's state

[avatar, SKILL.md, Give the whole body life; Wire the reactions; Run it from one loop]

Layer irregular glances and blinks with breathing, float and delayed body lean. The source calls for a never-still decorative character; the existing [motion gate](SKILL.md#before-you-build) still applies to product UI, and reduced motion holds this character still.

Use a small event-driven controller: attention on entry, response to the primary action, a press reaction, then sleepy and asleep states after inactivity. Clamp followed gaze to keep the eyes on the face and exclude touch from pointer following. Keep a special object move, such as a separately articulated part, rather than giving every silhouette identical acting.

Run one visible-only loop and render the resting eyes in the server output so the face does not appear only after hydration. Under reduced motion, render the resting pose without starting the loop. This source character is decorative and hidden from assistive technology; actual controls retain their own semantics. A capped live step and seeded random choices do not make a stateful simulation an arbitrary-time seek function. [avatar, SKILL.md, Run it from one loop; face.js]

## Prove it

[avatar, SKILL.md, Prove it on a contact sheet; sheet.js]

Inspect every expression, enter/hover/press/leave, the separate sleep interval, shipped size and both themes. Keep the tab visible and repeat sampling when hidden-tab or stalled-loop warnings make the sheet inconclusive. A contact sheet does not establish motion between samples, and synthetic pointer events do not establish real input behavior. Confirm clipping, clean joins, body follow-through, server rest and the reduced-motion still.
