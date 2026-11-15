# Retiming picture to a new narration

An optional workflow from [MengTo/Skills, html-reel/references/retime.md]: preserve an authored scratch timeline while matching a later voice take. [FOOTAGE-EDITS.md](FOOTAGE-EDITS.md) owns source/output clocks, speech cuts and caption preservation; this chapter adds the correspondence between two performances. Use the established renderer/editor rather than importing the source CLI or Fil-specific APIs.

## Build an explicit correspondence map

Keep scratch narration times and final narration times separate. Pair identifiable word occurrences or manually chosen cues as `(final time, scratch time, cue identity)`. Give repeated words distinct occurrence identities, and retain the transcript context needed to resolve them. Do not assume ASCII normalization can align every language. Validate that accepted pairs advance in both clocks; report ambiguous, unmatched, duplicate or reversed anchors instead of silently dropping them. [MengTo/Skills, html-reel/references/retime.md; scripts/timemap.py, anchor selection and normalization]

Use a monotone piecewise map from final time to scratch time. For an animation authored as a function of scratch time, evaluate that animation at the mapped time. Keep an inverse map for placing scratch events on the final clock. Mark interpolation separately from measured anchors, inspect the longest unanchored span and pin important scene boundaries locally so distant anchors do not disguise drift. Define behavior outside the covered anchor range before rendering. [MengTo/Skills, html-reel/references/retime.md, word anchors and inverse mapping]

## Treat recorded footage as segments

A recording cannot be evaluated at arbitrary scene time like a pure animation. Split it at meaningful layout or content changes, map each segment's endpoints to the final narration and calculate its speed from source span divided by final span. Choose an explicit hold, cut or replacement when a segment cannot support the required duration. Keep sound ownership separate so a picture-speed adjustment does not accidentally alter the final voice. [MengTo/Skills, html-reel/references/retime.md, footage segments; references/formula.md]

Snap absolute output endpoints to the delivery frame grid, then derive each segment's frame count from neighboring snapped endpoints. Independently rounding every duration can accumulate drift. Record the frame budget and compare the joined picture's actual duration against the intended final narration. Apply the existing speech-boundary and 30 ms cut-fade rules rather than adopting a different source's local fade duration. [MengTo/Skills, html-reel/scripts/frame-video.mjs and scripts/join-takes.py; source EDL raw-duration accumulation requires this qualification; FOOTAGE-EDITS.md]

## Move every dependent event

Retiming affects captions, chapters, highlights, effects, cursor actions and sound cues as well as picture. Map each from its declared original clock, then inspect actual ordering and boundaries in the final sequence. Preserve supplied wording and sidecars under [FOOTAGE-EDITS.md](FOOTAGE-EDITS.md#preserve-captions-and-supplied-layers). The source's renderer-specific caption hide/delete behavior is not a portable API contract. [MengTo/Skills, html-reel/references/retime.md and references/fil-editor.md]

Keep analysis, picture and final narration inputs identifiable. An equalized or denoised track's high-frequency attenuation does not prove a particular processing product was used or that the voice is clean; retain asset provenance and actual listening review. Use [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md) for cue placement and final mix checks. [MengTo/Skills, html-reel/scripts/verify-export.mjs, measured-band heuristic; existing sound-pass]

## Prove it

Report accepted anchors, missing/ambiguous cues, covered range, longest interpolated gap, segment speeds and final frame budget. Inspect repeated-word matches, every segment join, caption/chapter/effect placement and the first/final frame against the delivered voice. Measure actual duration and drift; listen across speech cuts. A valid map or successful encode alone does not prove picture follows the narration. State unavailable listening/visual review and every unrun check. [MengTo/Skills, html-reel/references/retime.md, final checks; references/judging.md]
