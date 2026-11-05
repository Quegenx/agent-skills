# Inspecting supplied media

Use before transforming existing footage. These checks come from [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill), `scripts/_common/probe.py`, `scripts/color.py` and `references/gotchas.md`, with FFmpeg's official forms taking precedence over source generalizations.

## Record what the edit must preserve

- Record stored dimensions and rotation-adjusted display dimensions separately; a portrait display does not establish the stored frame's shape. Inventory audio/subtitle/data streams, channel layouts, language tags and the track actually selected for the edit. An audio stream's presence alone does not prove the requested track survived. [kajisho5/ffmpeg-skill, scripts/_common/probe.py; tests/test_picture.py]
- Do not assume automatic selection means the first track: FFmpeg normally chooses the highest-resolution video and audio with the most channels, with the lowest index breaking a tie; data and attachment streams require explicit mapping. Preserve or explicitly report omitted tracks. [https://ffmpeg.org/ffmpeg.html#Automatic-stream-selection]
- An aspect-ratio crop and a caller-specified pixel rectangle are different jobs. FFmpeg crop defaults `exact` to 0, allowing subsampled width/height/x/y to round down; use the documented exact behavior when the promised coordinates require it. Source `crop.py` promises literal offsets but emits no `exact=1`, so its promise is not an exact-offset guarantee. [https://ffmpeg.org/ffmpeg-all.html#crop; kajisho5/ffmpeg-skill, scripts/crop.py]
- Record stream start offsets and individual stream lengths, alongside container duration. A file duration alone can hide shorter picture, longer sound or an initial gap. Final evidence belongs to [decoded-delivery checks](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md#evidence-limits). [kajisho5/ffmpeg-skill, scripts/_common/emit.py; tests/test_editing.py]
- Keep unknown capability distinct from missing capability. A filter or hardware encoder listed in a build does not establish that the current fonts, GPU or driver can complete this job. Preserve actual requested, used and fallback paths rather than reporting a successful retry that was never measured. [kajisho5/ffmpeg-skill, scripts/_contract.py; tests/test_accel.py; references/ci-platform-pitfalls.md]

## Color descriptions and transformations

- Record primaries, transfer, matrix and range separately. The source distinguishes PQ/HLG/Dolby Vision from BT.2020 SDR; BT.2020 primaries alone are not its HDR classification. Its BT.2020 SDR conversion uses gamut conversion rather than the PQ tone-map path. Do not infer camera Log encoding from a flat, low-saturation sample alone: the source's Log detector is a heuristic. [kajisho5/ffmpeg-skill, scripts/_common/probe.py; scripts/color.py; references/gotchas.md]
- Retagging and conversion are different operations. Official `setparams` changes properties used by filters/encoders without changing input image values. Select a conversion from the observed source properties and intended delivery, then inspect decoded output. The old supplied-footage table prescribed H.264 limited-range conversion generically for phone clips; source properties and the renderer contract decide the required conversion. [https://ffmpeg.org/ffmpeg-all.html#setparams; kajisho5/ffmpeg-skill, scripts/color.py]
- FFmpeg's CPU `tonemap` expects single-precision floating-point data in linear light; linearize before it and convert its output to the intended usable format. A color tag alone does not perform that transformation. Source toolkit help calls retagging a no-reencode operation, but its fallback can re-encode: report the path actually used. [https://ffmpeg.org/ffmpeg-all.html#tonemap; kajisho5/ffmpeg-skill, scripts/color.py]

## Keep evidence within its measured scope

- Nominal/average frame-rate disagreement is suspicion, and packet timestamps sampled in windows establish only those windows. Record the sampling scope instead of claiming whole-file constant cadence. [kajisho5/ffmpeg-skill, scripts/_common/probe.py; scripts/cut.py; tests/test_cut_copy.py]
- Distinguish full content hashes from partial head/tail fingerprints and size/mtime checks. Bind the edit to the source actually inspected, but do not call a partial fingerprint whole-file content authentication. [kajisho5/ffmpeg-skill, scripts/_common/probe.py; scripts/batch.py]
- Keep platform size, duration, loudness and caption-safe presets labeled as local policies until checked against current official guidance for the actual upload route. A passing preset check is not evidence of platform acceptance. [kajisho5/ffmpeg-skill, scripts/_platforms.py; scripts/check.py; https://support.tiktok.com/en/using-tiktok/creating-videos/creator-tools-on-tiktok]

## Prove it

The source and selected streams are identified; stored/displayed geometry, stream spans and color properties are recorded; metadata relabeling is distinguished from image conversion; missing measurements, sampling limits and actual fallbacks are explicit. Inspect the [decoded delivery](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md) after the edit. [kajisho5/ffmpeg-skill, scripts/_common/probe.py; scripts/_common/emit.py; tests/test_analysis.py]
