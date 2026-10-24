# Measure a reference illustration's motion

Frame and edge measurement for a web or app illustration, from rossark-motion-skill's SKILL.md section 10 and tools/sheet.sh, track_edges.py and sample_colors.py. This supplements [live inspection](INSPECTION.md): inspect the implementation when available, then use a recording to measure what it actually does. No tools or media from that source are bundled here. [rossark-motion-skill, SKILL.md section 10; pixel-reverse-engineer, SKILL.md]

## Capture time and framing

[rossark-motion-skill, SKILL.md section 10; tools/sheet.sh; tools/track_edges.py]

- Record the reference's dimensions, duration and reported frame rate before measuring. Keep the reference recording separate from generated output.
- Crop to the subject and inspect a second or two at full frame rate. The source uses ten frames per contact-sheet row. A two-frames-per-second sheet is useful for poses, but does not establish blink timing, follow-through or moving holds.
- Preserve the timestamp and crop coordinate system with each observation. The source sheet tool accepts W:H:X:Y, while the edge tool accepts X:Y:W:H and converts that order for ffmpeg. Do not silently reuse one tool's argument order in the other.
- Distinguish the sample clock from source presentation timestamps. The edge tool resamples with ffmpeg's fps filter and reports sample-index/fps time. On variable-frame-rate media, that is not proof of the original frame's exact PTS.

## Measure the channels

[rossark-motion-skill, SKILL.md section 10; tools/track_edges.py]

- Track the subject's top edge at several columns to expose bob, squash and tilt. Track left and right edges on a row to expose widening, sway and lean. Record amplitude as a fraction of subject size and record the period.
- Select the actual subject colors. The supplied edge tool defaults to Euclidean RGB tolerance 40 and requires a run of at least six matching pixels for its column top edge. These are the tool's heuristics, not universal edge-detection thresholds.
- Its width field is right minus left. If a comparison needs inclusive raster-pixel count, this field is not that count. Keep the same definition in reference and candidate measurements.
- Do not treat a failed color match as a stationary subject. Record gaps and inspect the corresponding frames before drawing a conclusion about a motion channel.
- The tool decodes the selected clip into raw RGB24 frames in memory. Bound the clip to the motion being investigated rather than treating it as a constant-memory full-film analyzer.

## Record beats, parts and proportions

[rossark-motion-skill, SKILL.md section 10]

- Write each observed beat's start and end in milliseconds. Separate entry, hold, action, reaction and exit where the reference actually has those beats; do not add a missing scene stage.
- Inspect every relevant part: feet, hands, head, eyes, shadow, props and background. Record each part's pivot, position or angle over time, and whether it follows another part after a delay.
- Normalize proportions to one measured unit, such as head width: head share of total height, torso height/width, leg length, feet and shadow. A single scale factor cannot repair a different build.
- For an exact drawing study, the source enlarges the crop twofold and overlays a 100px grid before reading corners and curves. Keep the source pixel coordinates distinct from drawing units and output pixels.
- Put unresolved values in the existing [evidence tiers](INSPECTION.md#measured-derived-inferred). A measurement from compressed footage is evidence about that footage, not automatically the original asset or CSS value.

## Sample colors without upgrading the evidence

[rossark-motion-skill, SKILL.md section 10; tools/sample_colors.py; pixel-reverse-engineer, SKILL.md]

- Sample specified pixel positions at the recorded moment. For a lit or glowing state, sample that moment as well as the resting one, then record which state each value describes.
- The supplied sampler seeks and decodes one RGB frame, bounds-checks coordinates and reports hex RGB. It does not recover an original CSS token, account for every color-management transform or undo video compression.
- Prefer extractable implementation tokens when live source is available. Do not replace an owner's supplied exact color with a nearby video sample.

## Compare the same moments

[rossark-motion-skill, SKILL.md section 10]

- Render or capture the candidate at the same observed times, with matching framing. Stack it beside or below the reference and compare pose, amplitude and timing.
- Apply the same edge measurement to both and compare the recorded definitions and values. A contact sheet alone cannot prove that a subtle moving hold is absent.
- Check the loop seam, the frozen-loop frame and the final one-shot frame as well as the action's most dramatic pose. Report any part whose contact or transform drifts.
- For a recording shown in a device frame, measure against the device's visible screen. A prop entering from outside a stage can still be visibly inside that screen.

## Prove it

[rossark-motion-skill, SKILL.md sections 10 and 11; pixel-reverse-engineer, SKILL.md]

- The evidence record identifies source recording, time basis, crop, coordinate units, measured parts, amplitude/period and the timestamps used for comparison.
- Separate measured motion from guessed implementation. Report color-match gaps, compressed-pixel limits, resampling limits and unobserved device behavior.
- Preserve the target project's protected design decisions and the requested reconstruction scope. Rossark's blanket claim that exact copying is always fine for a private test is not a legal permission supplied by this workflow.
