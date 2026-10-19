# Type: numbers, morphs, reading time and the decision table

[measured corpus, original type-numbers-and-decisions.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

Originally split from [type.md](MEASURED-TYPOGRAPHY.md) to keep each file under the size cap. Sections 8 to 12 (counters and numbers, identity and name morphs, reading time, no dead frame while holding, the decision table) and the slop tells

## 8. Counters and numbers

[measured corpus, original type-numbers-and-decisions.md]

**R8.1** WHEN a hero number "arrives" -> DO roll one value per frame with step sizes decaying to the end, 15-23 steps in 0.5-0.9 s, never an eased tween of the digits:
- M954: 16 values in 0.5 s, steps .75 .81 .85 1.78 1.84 .90 .88 .85 1.56 .69 .61 .95 .32 .20 .07 -> lands $100.00; edge glyphs ($ and last 0) stay ~12 px blurred while centre digits sharpen; pull back .91 -> .63 W in 0.20 s.
- M958: 2.71 -> 522.14 over 0.93 s in 23 events (3.8, 6.0, 8.8, 12.6, 18, 26, 40, 65, 94, then decaying 77, 33, 49, 23, 16, 13, 8 ... .45).
- M936: 29:08, 29:17, 29:25, 29:34, 29:42, 29:51, 30:00 in 7 f (+8.6 s per step, reads as time-lapse); size grows 0.12 -> 0.22 H over 0.4 s while colour/blur resolve (#E4E4E4 + 5 px blur -> #5C sharp -> #000 one beat after landing); hold 1.24 s; label fades up 0.2 s after it lands. 1 -> 5 counter: 1 f per digit (40 ms), size +12%/f, last digit reaches size one beat later.
-- *because* uneven decaying steps look measured; the last 3 frames barely move so the value lands instead of stopping (M936, M954, M958).
**R8.2** WHEN you need a step-based value -> DO skip values and hold 1-3 f per value (M955: 2, 3, 4, 6, 7, 8, 9, 10%, 5% skipped; ticks +1/+2 every 1-3 f for the token counter) -- *because* smooth tweens look like presets.
**R8.3** WHEN a counter or progress ring is the finale -> DO decelerate (3.1 pts/f -> 0.5 pts/f), park on 99 for 5 f (0.083 s at 60 fps), land 100 without flash, keep scaling the card through the last frame (M924) -- *because* the last 1% becomes suspense.
**R8.4** WHEN you choose how a number lands -> DO decide by role: **hero claim** ends on a round value (100.00, 10%, 30:00); **product data** ends on a specific un-round value (522.14, 119, 112/500, $194.67) -- *because* round reads as a claim, un-round reads as real (M954, M955, M958, M923, M936).
**R8.5** WHEN a number is proof texture, not the claim -> DO show it complete at onset, no count-up (view counts, metrics: M917, M919) -- *because* counting calls attention to a number nobody is asked to read.
**R8.6** WHEN a number is too large to count -> DO resolve the final value left to right through 12-15 px squares and ASCII glyphs (final value from frame 0, size 96 -> 176 px, crisp in 0.70 s), hold ~0.47 s, dissolve from both ends toward the middle in 0.33 s (M945) -- *because* it shows magnitude without a ticking counter.
**R8.7** WHEN two quantities are compared -> DO render them at the same height (hero numerals 0.22 H), keep the sentences at 6.5-8% H, reserve pure black for the figure, and leave the second figure cropped and moving (6 slides left at -11, -12, -19, -30 px/f while the unit enters at -70, -62, -54 px/f) -- *because* equal weight reads as fair; motion at the edge implies more (M936).
**R8.8** WHEN several numbers change off one control -> DO move all of them every frame on `MEASURED.softInOut` (M923: four numbers over 50 f@60 off one handle, no overshoot) -- *because* viewers read cause and effect without text.
**R8.9** WHEN a number is the hero -> DO grow and sharpen while it counts; hold solid 0.5-1.24 s depending on whether it is one number or a figure with a label -- *because* growth sells impact and the hold makes it a fact (M936, M945).

## 9. Identity and name morphs

[measured corpus, original type-numbers-and-decisions.md]

**R9.1** WHEN one name must become another -> DO flip per glyph left to right at 2-2.4 f@60 (0.033-0.04 s) per glyph, keeping a fixed left anchor so the eye never travels: the outgoing glyph squashes up to a hairline at y .49 in 0.05 s, the incoming grows from a hairline at y .54 to full in 0.10-0.13 s, two thin strokes at different heights visible mid-swap; outgoing glyphs shift black -> #594390, incoming start dark violet and brighten to #7454D9 -> ink (M973).
**R9.2** WHEN a second flip follows -> DO add an anticipation spread (slots fan right +26% over 0.19 s, `MEASURED.softLand`) before it; the outgoing word squashes away in place at the expanded positions (0.83-1.02 s), no slide, no fade; the new word's glyphs arrive violet and darken L->R (M973) -- *because* the viewer sees both names from one lockup.
**R9.3** WHEN a word changes identity inside a line -> DO swap per letter (3.42/3.46/3.54/3.63 s), each blurring and dropping 0.03 H for 2 f, the new glyph arriving with the roll -- *because* the mechanism is visible, so the morph feels built (M916).
**R9.4** WHEN a question becomes a name -> DO run two independent soft masks (erase front L->R ahead of reveal front, mint 25-45 px leading edge, ~0.1 s empty gap), the wordmark revealed in place, the mark sliding back over the text as the name's tail (M926). Never crossfade.
**R9.5** WHEN a ring of letters becomes a title -> DO scramble, hard-switch to exactly the glyph count, start two glyphs at +-90 deg and unwind over 0.30 s on `MEASURED.softLand`, no elastic (M947).

## 10. Reading time

[measured corpus, original type-numbers-and-decisions.md]

[measured corpus, original type.md R10; video-brief, COPY.md#budget] The source timing table and 0.45 s/0.2 s-per-word preference below are measured-source views. Current production uses the [house reading floor](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/COPY.md#budget), which remains in force when the recipe is shorter. These are not interchangeable smoke-check guarantees.

Observed holds (fully assembled to departure) and total life:

| Words / chars | Assembly s | Full hold s | Life s | IDs |
|---|---|---|---|---|
| 3 w / 18 | 0.22 | 0.92 | 1.13 | M921 |
| 4 w / 15 | 0.36 | 0.48 | 0.84 | M914 phrase 1 |
| 3 w / 16 | 0.32 | 0.60 | 0.92 | M914 phrase 2 |
| 4 w / 19 | 0.70 | 0.50 | 1.70 (incl. 0.5 s wind-up) | M929 |
| 5 w / 26 | 0.30 | 1.00 | 1.34 | M920 phrase 1 |
| 4 w / 20 | 0.29 | 0.83 | ~1.1 (+0.42 s fade) | M920 phrase 2 |
| 3 w / 14 | 0.71 | 0.42-0.71 | 1.42 | M964 |
| 2 w / 14 | 0.44 | 1.00 | 1.44 | M938 |
| 3 w / 20 | 0.83 | 1.00 | 1.9 | M941 |
| 5 w / ~28 | 0.64 | ~0.45 | ~1.1 | M936 |
| 6 w, 2 lines | 0.75 | 1.66 | 2.4 | M934 |
| 8 w, 2 lines | n/a | ~2.0 | n/a | M933 |
| single number | 0.70 | 0.47-1.24 | n/a | M945, M936 |
| list of 8 lines | n/a | 0.8 | n/a | M939 |

**R10.1** WHEN you set a hold -> DO use: floor **0.45 s** after the line is complete (only with voice carrying it), comfortable **0.2 s per word** for 2-5 words (3 words 0.6-0.9, 4 words 0.8, 5 words 1.0), **1.7-2.0 s** for 6-8 words on two lines (about 0.25 s per word), single number **0.5-1.2 s** -- *because* viewers read along as words arrive, so total life per phrase runs about 0.25-0.35 s per word (derived from the table).
**R10.2** WHEN several phrases follow -> DO shorten scenes then let the last linger (phrase A 1.7 s, phrase B 1.5 s, icon 0.8 s, wordmark 1.44 s: M929); the second phrase may hold only 0.17 s if the same sentence continues (M929 phrase B).
**R10.3** WHEN the copy is texture (UI text 9-14 px) -> DO give it no reading time -- *because* no one is asked to read it (M913, M939).

## 11. No dead frame while holding

[measured corpus, original type-numbers-and-decisions.md]

**R11.0** WHEN a line holds -> DO make sure one thing on the frame is alive (the line's own drift, a caret, a counter, a camera creep, light moving on the ground); a *designed breath* of 0.6-1.5 s with a reason you can state (a beat before the payoff word) is wanted and may rest more quietly -- *because* the rule is "no dead frame", not constant motion ([MEASURED-DIRECTION.md](MEASURED-DIRECTION.md) section 6).

**R11.1** WHEN a held line has no new event -> DO keep it moving along one axis or scale:
- lateral drift: -88 px = 6.9% W over 1.1 s (M921), 0.01 W per 0.44 s (M914), ~0.02 W over a 1 s hold (M920), 1.1-1.5 px/f@24 (M920);
- shrink: -9% in 0.63 s (M953), 0.55 -> 0.53 W in 1 s (M947), 5-10% per second as a default;
- big word: slow shrink 18% in 0.6 s, then accelerate (M937);
- vertical creep: 0.02 H over a 1.24 s hold (M936); parallax drift 0.07 W/s on a ground (M964);
- last frames before a cut: accelerate 2-5x (7 -> 14 px/f in the last 2 f, M921; 13.7 -> 95 px/f over the last 8 f, M929)
-- *because* a locked line reads as a slide, and the lean-out makes the cut feel pulled.
**R11.2** WHEN the end of a phrase is a hold -> DO keep something alive under it: counters ticking (M955 token counter 69 -> 119 across 1.87 s), a mascot blink, a rotating dial at ~14 deg/s (M936), a tile drift, an orbiting rim highlight -- *because* the headline can stay static while the scene lives.
**R11.3** WHEN a true static hold is allowed -> DO restrict it to the moment after a payoff lands (0.67 s on a name lockup M968; headline 0.67 s with a solid caret M969), never mid-phrase.

## 12. Decision table: if the line is X, use mechanic Y

[measured corpus, original type-numbers-and-decisions.md]

| If the line is... | Use | Timing | IDs |
|---|---|---|---|
| The first word of the film / the thesis noun | start oversized, shrink (3.3) | 33% H, .91 W, 0.30 s to land, then slow shrink | M937, M947 |
| A spoken hook sentence, 3-6 words | pop whole + x-decay (3.2), re-centred | 0.07-0.20 s gaps, accelerate | M920, M936, M964 |
| A calm 3-5 word headline | rise (3.1) | 0.12-0.27 s gaps, offsets shrink | M929, M938, M941 |
| A technical/fintech statement | hard step (3.6) with drifting phrase and busy background | 0.10-0.12 s gaps | M921 |
| A status/log line of an agent | blur-resolve per word (3.4) + shimmer (3.8) | 4 f per word | M919 |
| CTA words | blur-resolve in place (3.4) | 0.17 s per word | M920 |
| A second phrase meant as a reply | change axis: first rises, second slides in from the right with 3 f anticipation | peak 3.2% W/f | M929 |
| A claim with one key noun | accent colour or loop/box (6) | box 4-5 f; loop 0.75 s | M930, M933, M936 |
| A prompt in a UI | typing (7): content 14-30 cps, long/result 70-85 cps | caret 0.04 s early | M914, M919, M949 |
| A very long prompt in a wider-than-frame box | wave typing (3.7) + pan | ~45 cps | M974 |
| A hero number | per-frame decaying steps (8.1), growth + sharpen | 0.5-0.9 s, hold 1.24 s | M936, M954 |
| A huge number (1,000,000) | pixel/ASCII resolve L->R (8.6) | 0.70 s, hold 0.47 s | M945 |
| A name that changes | per-glyph flip with fixed anchor (9) | 0.033-0.04 s per glyph | M973 |
| A word that differs inside a line | per-glyph or scattered fragments (3.5) | ~1 glyph/f | M930, M927 |
| A two-act headline | squeeze old act (scale .98 -> .91 -> .74 -> .30 over 4 steps, +-1 px strip jitter 0.4 s), hard cut, new bigger words from 0.73 scale in accent | gaps 4 then 6 f | M967 |
| A line that must leave | exit faster than entry (5), overlap 2 f | 3-4 f per word | M938 |
| A list tied to voice | whole word + icon, 3 f slide 12 px, onset on the spoken word | 0.7-1.0 s apart | M925 |

---

## Slop tells for type

[measured corpus, original type-numbers-and-decisions.md]

| An AI default would | A designer does |
|---|---|
| Fade every word in (opacity 0 -> 1), then fade out | Hard step, rise with a 5 f head and long tail, or blur-resolve; exit by motion |
| Type the headline letter by letter with a blinking caret (and justify it as "the film is about typing") | Whole words in speech rhythm; letters appear one at a time only in the product's own input field, with authored bursts and pauses after spaces (section 0.4) |
| Set the word and nothing more | Act out the meaning on the one or two words that matter: slice, widen, tighten, leave all but one (section 0.1) |
| Write launch copy: "Not just X. It's Y.", one-word triplets, "Meet X", "seamless", "the future of" | Write the way the brand speaks, then cut half; a sentence with a full stop and one aside; the feature introduced where the user meets it (section 0.3) |
| Centre one line after another on flat grounds, each held | Centred lines only when paced to speech with a fixed position and a second visual voice moving; otherwise a split phrase or a line the product performs inside |
| A giant cropped word as the opening of every film | One arrival from oversize, once, with a cause; scale spent once and the ending smaller |
| Tracked small caps for brand names, kickers and taglines | Sentence case at role size; no labels ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) section 0) |
| Constant 0.1 s per word | Gaps follow speech: 5,5,3,3 f; 10 f before the stinger; slower last word |
| Centre every line and hold it still | Lean/drift 1-2%/s, accelerate before the cut, something alive under it |
| Bounce/overshoot every pop | No overshoot; 80-90% in the first 8-10 f |
| Bold for emphasis | Size, one accent word, a second face, or one device (box/loop/reticle) |
| New accent colour per line | One accent, 0.13-0.28 s on arrival, decays to ink |
| Smooth count-up to a round number | Per-frame decaying steps, skipped values, round hero vs un-round data, growth + sharpen |
| Ease digits between values | Discrete frames; ease the cadence, not the digit |
| Crossfade one name to another | Per-glyph flip with hairline squash and fixed anchor, or two soft masks |
| Hold every phrase 2 s regardless | 0.45 s floor, 0.2 s per word, 1.7-2 s only for 6-8 words |
| Re-centre survivors after a delete | Survivors stay put; new words append (backspace-retype metaphor) |
| Mix smear on some lines and hard steps on others | One grammar per film, one clock per film |
| Leave typos as style | Proof the copy |

## Prove it

[measured corpus, original type-numbers-and-decisions.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
