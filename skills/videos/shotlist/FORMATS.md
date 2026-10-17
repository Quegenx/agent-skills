# Formats

One recipe per kind of film: the structure in bars and shares, the budgets, the transitions by intent and the layouts per aspect. Match the request to the nearest row, then scale it. Numbers are proven defaults; deviate on purpose.

## Budgets scale with length, not ambition

| Format | Length | Beats | Words | Sound | Deliverables |
|---|---|---|---|---|---|
| Launch film | 20-45 s, 120 BPM | 8-10 per 30 s | 20-35, ≤ 5 a line | full score, ~5 effects per 10 s, a drop on the turn | 16:9 master + 9:16 + 1:1, poster frame |
| Teaser | 10-20 s | 4-6 | 6-10 | one rise, one hit | 16:9 + 9:16 |
| Feature video | 8-30 s | 4-7 | 8-15 | light, effects on discrete UI events | 16:9 + 1:1 |
| Feature loop | 4-15 s, whole bars, no tail | 3-5 | ≤ 8 | usually muted | MP4 + WebM, seamless |
| Logo sting | 3-8 s | 3-4 | the name only | one tuned hit, then a tail | with and without alpha |
| Walkthrough | 20-90 s | per chapter 3-5 | ≤ 6 a caption | bed plus UI clicks | 16:9, captions burned in |
| Vertical social | 10-30 s | dense: a change every ~0.7 s | ≤ 5 a screen | loud hook on frame 0 | 9:16, captions burned in |

A 15 s cut of a 30 s film halves the beats and the words; never compress the same film into half the time. Three features in five seconds read as none. Every format keeps one idea, one device, one accent meaning and one motion system.

The destination decides three things, written into `brief.md`: does it have to read muted (feeds and landing pages autoplay silent), does it loop, which aspects are owed.

## Structures by video type

Each row is a beat structure: the share of the runtime, the energy (0-1) and the intent of the transition out. Scale the shares to the length and the grid, then design freely: these are structures, not layouts.

| Type | Beats: share · energy · out |
|---|---|
| Product ad (20 s) | hook 15% · 0.5 · match or flash → problem 15% · 0.4 · push → reveal 20% · 0.8 · cut on the drop → features 30% · 0.7 · push or zoom → call to action 20% · 0.5 · resolve |
| Product demo (30 s) | context 12% · 0.4 · zoom into the UI → step 1 22% · 0.6 · push → step 2 22% · 0.7 · push → result 24% · 0.8 · cut → call to action 20% · 0.5 |
| UI promo (20 s) | hook 15% · 0.6 · zoom → flows 50% · 0.8 · push or shape → proof 15% · 0.7 · flash → call to action 20% · 0.5 |
| Explainer (45 s) | question 12% · 0.3 · shape → model 22% · 0.5 · zoom → steps 36% · 0.6 · push → example 15% · 0.5 · dissolve → takeaway 15% · 0.4 |
| Infographic (25 s) | title 14% · 0.4 · push → stat 20% · 0.6 · push → chart 28% · 0.7 · wipe → stat 20% · 0.6 · shape → conclusion 18% · 0.4 |
| Kinetic type (15 s) | open 20% · 0.6 · cut on beat → build 45% · 0.8 · cuts and whips on beats → peak 20% · 1.0 · flash → resolve 15% · 0.3 |
| Logo reveal (8 s) | build 35% · 0.4 · match → reveal 35% · 0.9 → hold 30% · 0.3 |
| Social short (15 s) | hook 15% · 0.9 · whip → payoff 25% · 0.8 · cut on beat → payoff 25% · 0.8 · whip → payoff 20% · 1.0 · flash → loop 15% · 0.6 · match cut to the start |
| Trailer (30 s) | cold open 15% · 0.2 → act one 20% · 0.4 · cut → act two 30% · 0.9 · cuts on beats → silence 7% · 0.1 → title 18% · 1.0 · cut → date 10% · 0.3 |
| Tech news (30 s) | hook 15% · 0.8 · flash → item 25% · 0.6 · push → item 25% · 0.7 · whip → why it matters 20% · 0.5 · cut → outro 15% · 0.3 |
| Documentary (40 s) | cold open 15% · 0.3 · dissolve → setting 20% · 0.4 → events 35% · 0.5 · wipe → impact 18% · 0.6 → close 12% · 0.3 |
| Music visualizer (30 s) | intro 15% · 0.3 → groove 45% · 0.7 · cuts on downbeats → peak 25% · 1.0 · flash on the drop → outro 15% · 0.3 |
| Lyric video (30 s) | title 10% · 0.3 → verse 40% · 0.5 · a cut per line → chorus 40% · 0.9 · flash on the downbeat → end 10% · 0.2 |

A launch film (the house format) follows the arc in [CONCEPT.md](CONCEPT.md); its 30 s act template on a 2 s bar:

| Bars | Time | Beat | What happens | Sound |
|---|---|---|---|---|
| 1-3 | 0-6 s | hook → problem | frame 0 moving with the device on screen; the problem felt by 1 s and stated by 2 s, then piling up; it ends gathered into the device | the motif alone, then the intro; true silence before bar 4 |
| 4-5 | 6-10 s | turn | drop 1 on the bar 4 downbeat: the device meets the mark (≤ 1.5 s, or visibly building), then the mark opens into the product | drop 1 |
| 6-9 | 10-18 s | proof 1 | one capability as cause → action → result; the human input first, the product acts after it; drop 2 on bar 8 as the product takes over | a rise into drop 2 |
| 10-12 | 18-24 s | proof 2 | one line per bar, each paying off earlier copy | whips peak on the kick |
| 13-15 | 24-30 s | promise | pull back to show scale; the device becomes the mark for the last time | breakdown, then the resolving chord on the promise word |
| 16 + 60 f | 30-33 s | lockup | name, URL readable ≥ 1.7 s, the bookend, a tail | the motif bookends; tail to zero |

**Feature video** (16 s at 120 BPM): bars 1-2 inside the product, the "before" with the pain visible; bar 3 the cause, one human input, the only cursor moment; bars 4-6 the product acts (layout changes as FLIP inserts over 18-24 frames, counters counting per event, the camera anchored on the working region); bar 7 the result holds with the one line naming the value in the viewer's words; bar 8 + tail a small lockup.

**Feature loop.** A whole number of bars, no tail. The first 2 s already show the product with the cause under way (a quiet setup beat is not a hook). Build a cycle, never enter → hold → exit: a **conveyor** (items flow through and the last arrives where the first started), a **relay** (the device carries the result out one side and re-enters with a new input on the other) or a **state round-trip** (A → the product acts → B, and B becomes the next A). Springs rest before the seam; text is fully resolved or fully gone at the seam; frame 0 names the product (a loop has no end card). One peak per bar, with real calm (30-70 frames) between, or it tires by the third pass.

**Product reveal** (a real physical object, 10 s): tumble in from behind to a three-quarter view at about 60% of the width (0-1.6 s); whips of about 0.24 s to two or three macro details at 4-8x, each held 0.6-1 s with something on it moving; the one feature working and coming back (about 1.2 s); a pull out; the explode (0.4 s, ease-out), held apart while it drifts 10-15° in yaw; the implode while it turns to face the viewer; the hero at about 75% of the width, easing to stillness. Above about 12 s add beats (a second macro pass, a cross-section hold, a second feature, a longer explode hold) rather than stretch. The full beat table and how to build the object: seek-engine's `REAL-OBJECTS.md`.

**Logo sting.** Bar 1: gather, frame 0 moving, one primitive of the mark building tension (a pull back before the push). Bar 2 downbeat: the primitives accelerate into contact on `EASE.contact`, `squash`, one tuned hit on the contact frame (the accent's one flood, if any). Beats 2-3: the wordmark reveals from behind the mark's live edge (the clip follows the moving mark), locking without overshoot. Then the hold builds: a 10-20% push on `EASE.dolly` and one +1.5% `hitPulse`, the tail to digital zero.

**Walkthrough chapter.** Establish (½-1 bar, wide, the chapter caption in the lower third) → push to the feature on `EASE.cam`, `durFor(px, true)` → cause (½-1 bar: the cursor on a curved path over 36-48 frames, one press, or typing ~30 characters a second) → action and result (1-2 bars, held 36 frames + 6 per word) → hand-off (¼-½ bar, a whip or pull-back to the next anchor). Open cold on the end result for 2-4 s.

**Launch checks.** A stranger knows what is launching by second 4; the call to action holds at least 3 s; build the first 10 s in two or three styles, pick one, and only then build the rest.

**Promo for a piece of writing** (an edition, an article, 15 s): the hook as a question, big, 0-3 s; three proof frames from the piece, ~2.5 s each with a 3-5 word label and a slow push; the name and where to read it, held still, 11-15 s.

**Supplied footage that can't be re-laid out** (a 16:9 recording for a 9:16 feed): scale it to the full width, place it in the middle of the safe band over a dark ground, and put a two-line hook above it; never crop the middle out of it.

**Logo rules.** One technique per mark (draw on, build on in pieces, or morph), the reveal 0.8-2.5 s (simple icons near 1 s, wordmarks near 2.5 s). The final mark is never distorted: scale uniformly, fade, translate, mask; no skew or non-uniform scale except a squash under 0.2 s that returns exactly to 1. Keep a clear space of about the mark's cap height free of particles and wipes. The symbol leads and the wordmark follows, landing in the exact locked lockup; the settle (scale 1.04 to 1.00 over ~0.15 s) lands on the sound logo's peak, and the settled mark holds at least 0.4 s. A line mark drawn with SVG `pathLength="1"` needs one dash value whatever its length. For an intro or outro used in other edits, render the alpha version with `render.mjs full --alpha` (ProRes 4444) and deliver the sound as its own file.

**Other requests.** A trailer: hook → turn → lockup, 15-20 s, 6-10 words. An intro or outro for other videos: a sting, 3-5 s, the outro reversing the intro, with an alpha version. Kinetic type: the launch structure with the words as the device, a statement per bar. A promo with footage: the feature structure, the footage as the product surface, its grade wins. A cut-down of a finished film: re-laid-out from the same timeline, trimmed on bar lines.

**Long form (8-15 minutes)**: the first frame matches the thumbnail's promise; the hook and the stakes are complete by 0:30; chapters of 2-4 minutes; a first real payoff before 2:00, where early curiosity runs out, with an open question raised in the first minute and answered later; a minor change of picture every 20-30 s (a cutaway, a graphic, a sound) and a major one every 60-90 s (a new visual mode, a music shift, a burst of quick cuts), plus a re-hook line at each chapter turn; narration around 150-160 words a minute with a continuous bed well under it; the call to action and end cards in the last 20 s.

## Transitions by intent

Pick a seam from what the cut has to do, never at random, and save the most dramatic one for the payoff.

| Intent | Seams that serve it |
|---|---|
| continue (same idea, next step) | match cut, push, shared element, a cut on the beat |
| reveal | iris or radial from the clicked point, mask in the product's shape, colour flood, push through an element |
| impact | a cut on the drop, flash (one frame, once), whip ending at its blur peak |
| escalate | accelerating cut lengths (a bar, a beat, half, quarter), whips, scale jumps |
| transform | morph, container becomes product, the device changes role |
| calm | blur cut, dissolve over at least 0.3 s, a slow dolly through |
| end | the device becomes the mark; a hold that builds |

Use 6-8 seam types in a film, none more than twice, and one signature move at the open, the middle and the close.

## The variation rule

Neighbouring scenes differ in at least two of: composition (centre, left, right, grid), scale (macro or wide), density (one element or many), camera (still, push, pan, orbit), typography (size, weight, case), seam type, colour (inversion, flood), pace. Shot lengths vary (short, short, long) rather than equal slides. Never scene → fade → scene → fade.

## Layouts per aspect

16:9, 9:16 and 1:1 are different compositions of one story, never crops.

| Aspect | Size | Keep text and the key action inside | Type minimums |
|---|---|---|---|
| 16:9 | 1920×1080 | 96 px at the sides, 64 px top and bottom | statement 88-128 px, UI ≥ 22 px |
| 9:16 feed | 1080×1920 | top 270 (14%), right 120, bottom 420 (22%), left 64 | statement 110-140 px, secondary ≥ 60 px, UI ≥ 32 px |
| 9:16 strict (long captions, paid posts) | 1080×1920 | top 288, right 192, bottom 672 (35%), left 64 | as above |
| 1:1 | 1080×1080 | 64 px on every side | statement ≥ 72 px, secondary ≥ 44 px, UI ≥ 28 px |
| 4:5 | 1080×1350 | 64 px at the sides, 96 px top and bottom | statement ≥ 80 px, secondary ≥ 48 px, UI ≥ 30 px |

**The vertical column** (1080×1920, top to bottom): 0-270 header zone, the stage only, nothing to read; 300-580 one statement on two lines at 110-140 px; 620-1380 the product, 896 px wide or bleeding off both sides, the action (the tap, the landing, the count) near y 900-1100; 1390-1490 the result it produces (≥ 48 px); 1500-1920 the caption zone, where the feed's own UI sits. Feeds cover the bottom ~20% and right ~12%. Captions are burned in, because autoplay is muted.

Composition: one focal point per frame, on a rule-of-thirds power point (W/3, 2W/3, H/3, 2H/3) unless the shot wants symmetry and stillness; rank everything else by size, then contrast, then colour, then position; leave negative space around the focal point. 16:9 uses its width (side by side, parallax pans, lower thirds); 1:1 and 4:5 stack and centre, avoiding wide side-by-side layouts.
