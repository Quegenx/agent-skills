# Word-fold quality check

Use this effect-specific checklist before timeline handoff. Generic review and deterministic rendering stay in [frame-review](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md) and the [seek contract](../../../SKILL.md#the-contract). These are acceptance requirements, not results established by importing the source. [word-fold, references/quality-check.md]

## Inspect the effect

[word-fold, references/quality-check.md and references/glyphs.md]

1. **Whole run:** capture about 12 frames across the duration. Check the walking strip for jumps, every letter revealed by the end, the final word centered, and nothing cut off during the zoom.
2. **Landing:** inspect the last step at 60 fps (`t + i/60`). Reject blobs, zigzags, chops and pops; the strip-made letter must match the weight and band of the white ones.
3. **Edges:** crop every final-frame letter at 3 to 5 times size. Look for bleed, stepped joins and antialiasing seams, using the [glyph criteria](glyphs.md#check-every-new-glyph).
4. **Spacing:** read the helper's final pair measurements, not just its iteration count. Its source target and measurement limitations are in [WORD-FOLD.md](../../../WORD-FOLD.md#helper-corrections-and-measurement-limits). Report residuals or failed segmentation. A one-letter word has no pair-spacing work.
5. **Determinism:** perform the canonical out-of-order seek comparison in [frame-review](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md#the-loop); record actual image equality for this SVG/clip-path effect. Its alphabet is paths, so DOM text probes cannot prove the letters read correctly.
6. **Sound:** inspect frames at the generated footstep clip times and check the visible contact. Keep the preset landing accent distinct from final-stroke completion. Clip starts alone do not establish audible synchronization; use [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md#check-sync) for exported sound.

## Prove it

[word-fold, references/quality-check.md; Quegenx/agent-skills, frame-review and sound-pass]

Record the inspected frames, spacing results, seek comparison and contact checks. Name anything not rendered, viewed or heard. A syntax pass, a written timeline or a successful screenshot operation does not establish visual quality, deterministic pixels or a passing sound check.
