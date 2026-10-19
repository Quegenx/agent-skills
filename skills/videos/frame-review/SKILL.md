---
name: frame-review
description: "Reviews a code-made video with zero-count smoke checks, contact sheets and a rubric. Use after changing a video's visuals or timing, and before calling a video done."
---

# Frame review

You can't watch the film, but you can look at its frames, and you can measure it. A film is done when the **evidence** says it works, not when the encoder exits 0. Be a harsh motion director, not a proud author.

Copy `scripts/smoke.mjs` and `scripts/check_sync.py` from this skill's folder into the film's `scripts/`. The smoke test needs the film's `render.mjs` setup (Playwright); the sync check needs `uv` and ffmpeg.

## The loop

1. **Smoke: every counter reads 0.** `node scripts/smoke.mjs` (and `--format 9:16` etc. for each format). It seeks the whole film headless and counts runtime errors, readable text out of the frame or in the safe margin, text overlapping text, text clipped by its container for 0.3 s or more, broken text (NaN, undefined, [object...] printed on screen), short reads (a line on screen for less than max(0.5 s, 0.3 s per word, 0.25 s + characters ÷ 17)), stalls (motion that stops dead for a frame between two moves), a slow hook (nothing moves before 1 s, loops exempt), frames that change with seek history (nondeterminism), dead stretches with nothing changing, dead seams (a cut declared in `cuts()` where the outgoing shot has settled or the incoming one starts still), single-frame pops (a frame step over 3x its neighbours, scanned at full frame rate; designed cuts declared in `cuts()` are exempt) a loop seam that jumps, and low contrast (opaque text under 3:1 against the pixels behind it, or under 4.5:1 for small lines, held 0.3 s or more). The source reports deliberate broken-film checks; this maintenance round did not rerun them. DOM probes do not cover pictured/canvas text, and opacity thresholds do not prove full legibility. Fix every non-zero counter before looking at anything: the counters catch what the eye misses.
2. **Look.** Render, then open each image and actually look at it:
   - `node scripts/render.mjs beats`: the beat sheet, one settled frame per beat.
   - `node scripts/render.mjs sheet --every 0.5`: the shape of the whole piece.
   - `node scripts/render.mjs strip a b` around every fast move and every transition: each frame, for pops, ghosting, overlaps mid-swap and anything sliding instead of easing.
   - `node scripts/render.mjs sheet --every 1 --w 180`: the **phone test**. The X feed shows video about 360 px wide; if the key message doesn't read in these tiles, it doesn't read.
3. **Score** each 1-10, harshly: hook in the first 2 s · readability at phone size · motion quality (springs, no dead frames, nothing linear that starts or stops) · variety (something new every 2-4 s) · composition (one focal point per frame) · brand and asset accuracy · sound sync (once sound exists).
4. **Page chrome is a gate.** Run `node scripts/chrome_lint.mjs index.html` with the smoke test: it seeks the film and flags, by geometry and typography, the slide-deck tells (a brand name or label in a corner, tracked-caps labels, "02 / 05" counters, timecodes and specs, header or footer bars, a kicker over a headline, a held left headline beside media, a growing progress bar, a headline typed letter by letter, a vibe-coded card with a greeting or "label. value" and zinc greys). Text inside a real UI surface (a card-sized rounded fill, or `[data-ui]`) is exempt except the vibe-coded patterns; `[data-ui="captured"]` marks a faithful rebuild of a real screen. Fix by deleting the element. It reads the DOM, so text drawn in a `<canvas>`, WebGL, an image or a video passes unseen: check those on the stills. Tested: the example film passes; a copy with a corner label and a counter fails C1, C2 and C3.
   **When there are two versions to choose between,** `python3 scripts/blind_review.py review --round "v1 vs v2" a.mp4 b.mp4` writes one page that plays them side by side in random order, in sync, with frame stepping, each soundtrack alone, and a pick, a slop flag, a 1-10 score and notes per film; the user copies the verdict into `review-log.md`.
   **The distraction test.** After looking through the whole film (sheets, strips), write down the words on screen from memory before reading the brief. If you remember the motion but not the words, the motion is too loud for this film; judge it shot by shot.
   **Report only what you observe.** If a pass finds nothing wrong, say so and change nothing; an invented revision breaks what already passed.
   **Name the three worst problems**, each with a timestamp, the evidence (which sheet, which tile), the tell ID from [TELLS.md](TELLS.md) when one matches, and a local fix. Walk the whole tells catalogue once per round. Hunt specifically for: text overlapping during a swap; text moving while it should be read; anything inside the safe margin; an element sliding at constant speed; corner labels and frame borders; a centred title on a gradient; blurry scaled text; a dead beat; a colour passing through grey; two things competing for the eye; a stutter at the loop seam; frame 0 not composed.
5. **Snapshot, then repair.** Before an automated round changes anything, save the film (`git commit`, or copy `index.html` to `reviews/round-N/`), so a fix that makes the next score worse rolls back in one step. **Change numbers, not structure.** Durations, curves, positions, holds. Do not restructure, rename or re-architect the timeline to fix a duration; a repair that rewrites choreography breaks what already passed. Restructure only when the shot list itself changes.
6. **Re-render only the affected seconds** (`sheet --from a --to b`, `strip`), look again, and re-score. Repeat until every score is 8 or more and a full pass finds nothing new. At least three rounds on a new film; one round for a small fix.

Before the full render, probe 20 or more frames across the film (the sheet does this) and fix anything cluttered, overlapping or hard to read. Then render the animatic (`full --scale 0.5 --sub 1`) and fix pacing before any polish.

Measure, don't describe: for a moving element, are the gaps between successive positions in a strip even, widening or narrowing? That spacing is the curve. Which elements start on the same frame and shouldn't? Where does each reach rest, in ms? Does anything overshoot, and by what fraction of its travel?

## The quality bar

Reject your own result if it feels like a SaaS template, a PowerPoint animation, a website screen recording, a generic framework demo, a crypto ad, an AI promo template, five screenshots sliding around, or a wall of marketing copy. Every important frame should be good enough to use as a still advertisement. Three extraordinary moments beat ten mediocre feature animations: when a round can't lift a weak shot, cut it.

## The spine: review-log.md

Every round appends: the date, the scores, the three problems with timestamps, what changed, and which sheet shows the fix. The next session starts by reading it, so a long run never repeats an error it already fixed.

**When the same problem shows up twice, fix the harness, not the frame.** Add it to the film's banned list in `brief.md`, a rule in the project's `CLAUDE.md`/`AGENTS.md`, or a check in `smoke.mjs`. The banned list grows with every bad render; that is how the studio gets better.

## Maker and checker

The agent that built a shot is the worst judge of it. When the harness can run subagents, hand a fresh one the contact sheets, `brief.md` and the beat table (not the code, not your intentions) and ask for the three largest defects with timestamps. Judge only the rendered frames.

For a launch film or anything long, run the full round in [CRITICS.md](CRITICS.md): director, art/copy/UI and sound lenses returning one JSON shape, a verifier that tries to refute every P0 and P1 before anything is fixed, an 11-dimension rubric and a ship gate (every dimension at least 3, finish and sync at 5, mean at least 4.2, at most 5 rounds), and a design-off when one act stays weak for two rounds.

## Unattended runs: a goal with a stop rule

When the user wants the loop to run without them, wrap it in a goal a machine can check, with a turn limit and an abort rule for no progress. In Claude Code:

```
/goal node scripts/smoke.mjs exits 0 in every format and the latest review-log round scores 8+ on every axis.
Fix the worst failure each round, re-render only the affected seconds. Abort if a round fixes nothing. Stop after 6 rounds.
```

A goal evaluator checks the rules were met; it does not judge whether the film is good. Taste stays with the user at the gates.

## Read next

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Decoded output, sound, loop contracts and verification limits | [DELIVERY-CHECKS.md](DELIVERY-CHECKS.md) |
| Measured source review, lookup and ordered checklist | [MEASURED-REVIEW.md](MEASURED-REVIEW.md), [MEASURED-TELLS.md](MEASURED-TELLS.md), [MEASURED-REVIEW-CHECKLIST.md](MEASURED-REVIEW-CHECKLIST.md) |

The generic loop above requires three rounds for a new film; make-video has format-specific budgets, the launch critic has its own gate and cap, and the measured source has a two-pass budget. Keep those tagged profiles distinct. At any cap, report unresolved gates as incomplete. [Quegenx/agent-skills, make-video, frame-review and measured review at 48e92a7]

## Prove it

The chosen review profile is explicit, counters and sampled-coverage limits are recorded, source-specific conflicts are named, and the actual delivered file receives [the final checks](DELIVERY-CHECKS.md).
