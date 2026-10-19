# [MEASURED-TRANSITIONS.md](MEASURED-TRANSITIONS.md): how beat A becomes beat B

[measured corpus, original transitions.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

See also: [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) (eases, whips, camera, shutter blur), [MEASURED-PRODUCT-DEMO.md](MEASURED-PRODUCT-DEMO.md) (cursor and UI beats that get cut), [MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md) (line replacement), [MEASURED-ENDINGS.md](MEASURED-ENDINGS.md) (endings), [MEASURED-DIRECTION.md](MEASURED-DIRECTION.md) (continuity and handoff planning; film shapes), [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md) (grounds are surfaces), [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) (Part 1b: when a fade or dissolve is right), [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) (section 0: a chapter break is never a label).

A catalogue of the ways 53 measured moments (IDs M913-M974) leave one beat and enter the next, with mechanics, numbers and the object that carries the eye. Nearly every join in the sample is a hard cut made invisible by something else: motion, a carried object, a wipe that crosses the cut, matched blur, or an effect that turns into the next scene. Scene-to-scene crossfades do not occur in this corpus; that is the default, not a law: a calm brand voice, a dissolve that *is* the meaning (privacy, forgetting) or a blur that copies a real focus pull may fade ([frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 1b has the conditions). Per-property durations and eases are in [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md); typography of the lines being swapped is in [MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md).

Conventions. Time as `s (f@30)`; 1 f = 0.033 s, 3 f = 0.10, 6 f = 0.20, 10 f = 0.33. Source fps differ, noted where it matters. Positions are normalised frame coordinates (x, y in 0-1), sizes % of H (height) or W (width). Rule format: **WHEN** situation -> **DO** decision -- *because* effect (IDs). Each catalogue entry lists *what*, *mechanics*, *use when*, *eye carried by*, *evidence*.

---

## 1. Anatomy of a cut

[measured corpus, original transitions.md]

Seen across the sample, in order:

1. **A accelerates into the cut** (last 3-8 f): an exit with growing step size, a shrink with biggest step on the final frame, blur/smear ramping, or an action peak. Steps seen: 0.033, 0.022, 0.031, 0.014, 0.024, 0.031, 0.034, 0.051 (M959); lockup 1.0 -> 0.835 accelerating (M938); roll to -76 deg with 22 px smear (M944); card 17 -> 111 px/f (M920).
2. **The cut itself**: one frame, zero fade. 96% of moments have hard visibility switches (median ~20 cut-frames per moment), 25% of exits are hard steps (MEAS).
3. **B's first frame is already moving or already built**: a card sliding 105 px in frame 1 (M914), a modal at 1.42x already zooming out (M918), a word half-risen (M938), a hero mid-open (M933), a layout pre-built then moved (M940).
4. **Optional 0-3 empty frames** where the vector continues: 3 empty gradient frames after a whip (M916), 2-3 empty ground frames after a slide-out (M919), 1-frame empty text gap (M936).
5. **B's entrance continues A's vector**: the new word drifts up-left after the up-left whip (M916); smear that ends A is the smear that starts B (M925 -> M926).

**R1.1** WHEN you plan a cut -> DO author it as a pair: spec A's last 6 frames and B's first 6 frames together (object, position within ~0.02, scale, colour, blur, ground, velocity), then draw both -- *because* in every handoff in the sample something concrete is identical across the cut (all films).
**R1.2** WHEN a clip ends -> DO end on a peak (peak velocity, maximum compression, still-shrinking lockup, half-faded field) -- *because* the next clip inherits momentum; settled endings exist only in M946 (3.66 s living hold) and M968 (0.67 s static lockup before its outro).

---

**Moved:** section 2 (the catalogue of transition types) is now in [transitions-catalogue.md](MEASURED-TRANSITION-CATALOGUE.md).

## 3. Choosing a transition

[measured corpus, original transitions.md]

### 3.1 Decision table (by what changes)

[measured corpus, original transitions.md]

| What changes between A and B | First choice | Alternatives | Numbers to start with |
|---|---|---|---|
| Nothing but state (same UI, new moment) | T1 hard cut on motion + T2 carried object | T18 one-frame ghost | cut at peak velocity; B starts mid-move |
| Ground (dark <-> light) | T3 effect becomes ground (bead -> disk, band, wash) | T15 cut hidden in a band; T5 4-f grey dip | bead x1.5-2.2 per 0.05 s, 17x; dip 30 -> 65 -> flat -> veil |
| Scale (different distance, same subject) | T14 scale cut + content jump in the same frame | T12 pull-back reveal with snap | 3.7x in 1 f; snap ratio 0.56-0.77 + 0.3-0.6 s tail |
| Subject (text -> UI, UI -> different UI) | T7 wipe that finishes in B (content-heavy) | T4 container replacement; T17 occlusion | feather 0.31-0.42, 0.56 s, painted in B's ground |
| Subject (text line -> text line) | T19 hard replacement | T8 clip-edge wipe | 1-f replace; clip sweep 5 f |
| Act (chapter, claim -> product, product -> claim) | T1 + T2 with one carried object (the chapter break is a ground change plus the carried object, never a number, index or label) | T15 ground flip; T16 glitch bridge | claim phase 1.5-3.0 s, product phase the same or longer |
| Brand -> product | T11 zoom-through into a logo detail | T12 pull-back reveal | x21.9 in 0.53 s, 3 blank frames, container zoom-out 0.62 s |
| Product -> brand/sign-off | T4 contraction + T16 glitch bridge + T1 | T14 scale cut to 3.5x slam | UI contracts to 0.53x, mark built in 7 f, name slams from 3.5x |
| Field/texture -> logo or number | T10 pixel dissolve with stepped coverage | T9 stair wipe | 90 -> 0% coverage in 0.33 s; 80 px steps |
| Words -> an icon that continues the sentence | T19 + gap-matching | T3 | gap equals badge width (M958) |
| Question -> answer/name | T8 two soft masks | T19 | erase front leads reveal by ~0.1 s |
| List/form -> result | T4 container replacement | T17 | 0.70 -> 0.64 W then full-size replace |
| Montage of styles | T20 strobe | - | 4 f plates, 2 f first plate |

### 3.2 Rules

[measured corpus, original transitions.md]

**R3.2.1 No crossfades between scenes.** WHEN you leave a scene -> DO hard-cut it, wipe it with a feathered mask in the next ground, or let an effect become the next scene; fade only a single object (one headline line 0.75 -> 0.18 over 4 f, the last phrase linearly over 10 f, a ghost behind a new hero) or a single identity swap on a shared centre (icon dissolve 8 f, M973; dial and rings 8 f, M936) -- *because* "no cross-fades anywhere" holds in M941-M944, M913-M920 and the rest of the sample; the only whole-scene overlap is ONE 50% frame (M943). A fade is allowed where the object is the same and its motion continues across it.
**R3.2.2 Cut cadence.** WHEN you set scene or shot lengths -> DO inside a beat cut every 0.3-2.3 s (0.33 s on a beat grid, 0.36 s for item swaps, 0.7-1.3 s for stinger beats, 1.5-2.5 s for claim and product phases), let chapter claims run 1.5-3.0 s with the product phase the same length or longer, shorten scenes toward the end and let the last scene linger (1.70 / 1.50 / 0.80 / 1.44 s, M929) -- *because* rhythm is built from the pace of cuts (M929, M947 beats 1.30/1.07/0.70/0.43 s, M962, M953-M959).
**R3.2.3 Beat grid.** WHEN the film is music-led -> DO cut on a constant interval (10 f = 0.333 s for four consecutive cuts), make each state complete at the cut (dashes full length, labels present) and let secondary detail echo 1-3 f later in two waves (even ticks +1 f, odd +2 f); ~11-f drum for list swaps; syncopated 4/2-f pattern for reels (M962, M955, M967, M948). WHEN voice-led -> DO land onsets on the spoken word and let the wipe or reveal start before the word (wipe leads the voice by 0.16 s, wordmark reveal completes 0.16 s before it is spoken) (M925, M927, M926, M939) -- *because* the viewer hears the cut as part of the line.
**R3.2.4 Both sides planned together.** WHEN you write a transition -> DO fill one row of a handoff table before animating: A's last frame (object, position, scale, colour, blur, velocity), B's first frame (the same fields), the carried element, the cut type and the frame on which it fires -- *because* the cut works only if A and B were drawn together (M921-M929, M930-M938, M939-M946, M947-M959).
**R3.2.5 Transitions belong to the brand's own shapes.** WHEN you pick or design a transition -> DO build it from a shape that already lives in the film: a wave of the logo's own mark (stair-notched white, M946), a cell grid in the brand colour (M965, M968, M937), a dot or ring that is the brand (five-dot ring, M926; dot, M962), a bead along the device rim (M922), a glitch rect only if the brand is glitchy (M932), a stripe band (M965) -- *because* a generic wipe or slide-in reads as a template; the film's own geometry reads as authored.
**R3.2.6 One grammar.** WHEN the film's motion language is crisp steps (no smear) -> DO use T1, T2, T4, T9, T10, T14, T19 and put content change inside whips (T13 crisp version); WHEN it is smear -> DO add T6 and the blur-matched whip -- *because* mixed grammars read as different authors (see [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R4.1).

---

## Slop tells for this topic

[measured corpus, original transitions.md]

| An AI default would | Do instead |
|---|---|
| Crossfade scene A to scene B for 0.5 s | Hard cut on motion; or feathered wipe in B's ground; or effect becomes B's ground (a fade only under the conditions in [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 1b) |
| Mark a chapter with a number, a title card or a corner label | A ground change plus a carried object; the viewer reads the break from the picture |
| Dissolve between cards or captions as the default join | A hard cut on a moving frame with a carried object (a dissolve that means something is the exception) |
| Cut when the last animation has settled | Cut at peak velocity or on an action peak; B opens mid-move |
| Fade to white (or black) to change the ground | Growing bead -> disk, a sweeping band, a 4-f grey dip, or a 0.5-0.7 s colour ramp timed to what leaves |
| Slide a generic wipe bar across | Wipe made of the film's own shape (stair wave, cell grid, ring, bead) |
| Zoom-tween into the next scene | One-frame scale cut + content jump in the same frame; or one-frame snap + tail |
| Fade the old headline out, fade a new one in | Hard replacement, backspace-style drop-outs without re-centring, or two soft masks with the erase front ahead |
| Dissolve a logo in over 20 f with opacity | Pixel/cell coverage 90 -> 0% over 0.33 s; or stems built over 7 f; or dive-through into a detail |
| Put a loading spinner between scenes | 1-f placeholder card/capsule, or the next container at full size in one step |
| Make each scene independent | Carry one object (caret, dot, card, headline, cursor spot, ground colour) and record it in a handoff table |
| Cut every 4 s on a pause | Cut every 0.3-2.3 s on a beat grid or on spoken words; last scene lingers |
| Add a glitch pass over the whole frame | Localized rectangles, <= 6 f, one hard cut inside, matched sizes of A's last and B's first object |
| Blur-cross-dissolve a zoom | Blur-matched cut: exit ends at 18 px, entrance starts at 80 px, resolves in ~8 f |

## Prove it

[measured corpus, original transitions.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
