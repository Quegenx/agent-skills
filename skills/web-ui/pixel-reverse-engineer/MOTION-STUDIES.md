# Editable studies of an interaction

Deconstruct adds an optional development study to [motion inspection](REFERENCE-MOTION.md): named states and events, editable property tracks and a rebuild consuming the same saved data. It does not lower this skill's requested fidelity or turn an edited preview into extracted source evidence. The source's viewer and runtime are not bundled. [deconstruct, SKILL.md, Name the states and events; Split each transition into tracks; Hand back the data]

## Separate original evidence from editable data

[deconstruct, SKILL.md, Capture the real motion; Split each transition into tracks; Build the viewer]

Capture the real implementation or recording first. Use the existing [reference motion method](REFERENCE-MOTION.md) for capture conditions, property evidence and unknowns. Keep the original record unchanged when experimenting with a reconstruction.

Represent rest states and their entry and exit events explicitly. Give each animated property its own track with from, to, delay, duration and easing. Preserve a declared spring's actual parameterization instead of flattening it into an estimated bezier. An unread value remains Not verified.

## Edit a shared model

[deconstruct, SKILL.md, Drive it from one clock; Build the viewer; Hand back the data]

- Compute the preview from one time value so pause, seek and replay address the same model. History-dependent CSS playback alone cannot reconstruct an arbitrary intermediate frame.
- Let editing change property values, segment delay and duration, and event times across affected tracks. Keep spring parameters distinct from a duration-based curve. A value-over-time graph makes overshoot visible.
- Keep an immutable original, undo and per-field revert so changes can be judged against what was loaded. Mark edits visibly instead of silently replacing source observations.
- Timeline zoom, pan, snapping, group edits and range loops are useful optional controls. Their presence does not establish correct timing or curve equivalence.
- Persist accepted edits into the actual shared data file. The preview and rebuild should import that one definition rather than independent copies. Clipboard success and a page-local edit are not evidence that the saved file changed.
- Gate the study page to development or remove it before release, retaining the data needed by the rebuild.

## Compare the same moments

[deconstruct, SKILL.md, Compare at slow speed; viewer.html; supplied helper source audit]

Compare reference and rebuild at matched times and framing, slowed where useful, then inspect normal playback. Onion skin and wipe views can expose drift; a matched endpoint alone cannot establish the transition. Keep the [capture and fit limits](REFERENCE-MOTION.md) with that comparison.

The supplied viewer uses its own spring and interpolation model, fixed 60 fps frame steps and video `currentTime` assignment without waiting for decoded presentation. These do not prove parity with the source library, recording cadence or displayed reference frame. Shadow DOM isolates styles, not untrusted executable content. Use trusted local study inputs and report these limits if using that viewer. [deconstruct, viewer.html; repository source inspection]

## Prove it

[deconstruct, SKILL.md, Hand back the data; Reporting]

Every state, event and property is accounted for or explicitly unknown. Edits can be compared with the original, saved data matches the preview, and the rebuild uses that same definition. Record which matched moments and live transitions were inspected, residual drift and any unverified curve or decoded-frame correspondence. Do not claim a source viewer or helper was run when it was not.
