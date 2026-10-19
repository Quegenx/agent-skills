# Director: storyboard worksheet and slop tells

[measured corpus, original director-worksheet.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

Originally split from [director.md](MEASURED-DIRECTION.md) to keep each file under the size cap. Section 7 (the storyboard worksheet) and the slop tells

## 7. Storyboard worksheet (fill before writing code)

[measured corpus, original director-worksheet.md]

Fill the header once, then one row per beat. A row left blank is a decision not yet made.

**Film header**

| Field | Decision |
|---|---|
| PAGE (problem / audience / goal / emotion) | |
| The one true thing | |
| Film shape and the two shapes rejected (and why) | |
| Length (frames @30 / s) | |
| Clock | smooth / on twos / split / 60 |
| Motion grammar | smear / crisp / shutter |
| Type family + weights + role scale (% H) | |
| World per act: ground (surface and its source file), light, depth, texture, sound (section 4 item 8) | |
| Importance budget (beats at importance 3, max 25%) | |
| Accent hex and its ONE meaning | |
| Second signal colour (if any) and meaning | |
| Carrier object | |
| Cursor art | |
| Hero moment: the screenshot-worthy frame (frame no., beat) and how it is made | |
| Overshoot spent on | |

**Beats**

| # | Role | Importance (1-3) | Buys: the viewer ... | Picture with the text covered | On-screen copy | VO line | What moves | Enters how | Exits how | Transition into next | Carried object (if any) | Frames (start-end, len) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | hook | | | | | | | | | | | 0-120 (120) |
| 2 | proof | | | | | | | | | | | 120-255 (135) |
| 3 | proof | | | | | | | | | | | 255-360 (105) |
| 4 | cta | | | | | | | | | | | 360-450 (90) |

"Picture with the text covered" is what you would see with the words removed. "A flat colour", "a card on a flat colour" and "a block of text" are rejected answers: the beat has no picture yet.

Example of a filled row (generic): `2 | proof | 2 | Buys the belief that typing is enough: the viewer watches one real sentence typed and sent | a lit prompt field with a caret, cropped by the frame edge, over the product's real photographic ground | (prompt, 40 chars) | "Just type what you want." | prompt box, cursor, send button | card cut in at 1.6x already moving 105 px/frame | cursor accelerates off bottom right; card rises | hard cut mid-motion; new beat opens on empty card, same border and radius | the empty prompt card | 120-255 (135)`.

Checks after filling:
1. Beat lengths sum to the target; every length is between 90 and 210 f (a type-only hook may be 60-90 f; a cta that ends on the action itself may run 2-3 s). **Hard gate: the cta beat is <= 25 % of the film and its resolved end hold is 0.6-1.4 s** ([MEASURED-ENDINGS.md](MEASURED-ENDINGS.md) R2.0); if the sum is short, add a proof beat, never logo time.
2. Every row has a Buys sentence without "and".
3. Every seam has a carried object and a state at both ends (section 5).
4. Each beat introduces one new thing; the accent appears on at most one element per scene.
4b. **Hard gate (proof beats): each proof names its readable object, one per frame, at >= 0.55 W with text >= 0.04 H, and sitting in a world** ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) R5.1b, R3.5; [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)): magnify with the camera, not by resizing the UI. If a proof needs two objects (code, then result), write them as two shots or one camera move, not two panels.
5. The strongest frame sits at 60-75% of the film; the last beat lingers; no beat ends on a settle unless the lockup is alive.
6. VO lines are one running sentence across seams where possible; copy on screen carries the next fragment only (see [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md)).
7. **Chrome audit.** List every on-screen text that is not the claim, the product's own UI words, or the logo. Delete the list ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md), Page chrome is never part of the film; `scripts/chrome_lint.mjs`, gate G5).
8. **Picture audit.** For each beat, write what the frame shows with the text covered. If the answer is a flat colour, a card on a flat colour, or a block of text, redesign the beat.
9. **Carrier audit** (only if the film has a carrier): its position, scale or role differs at every seam.
10. **Decided or reached for?** For the film shape, the ground, the type, the ending, the sound and the transitions, say in one sentence why this brand and this idea chose it. Anything you cannot justify is a default ([frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 0).
11. **Could this be another brand's film?** Swap the logo and colours. If the film still works unchanged for a competitor, the idea came from the category ([video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md), cover-the-logo).
12. **Importance budget:** at most 25% of beats are importance 3; the hero moment is one of them.

---

## Slop tells for this topic

[measured corpus, original director-worksheet.md]

| An AI default would | The designer does |
|---|---|
| Open on a logo, a title card or an empty frame, then animate in | Open on a scene already in motion (card mid-open, word half-risen, log scrolling) (M933, M938, M939) |
| Build five beats of equal length and equal energy | Shorten beats toward the peak, hold only after payoffs, one strongest frame at 60-75% |
| Decide each beat in isolation and crossfade the seams | Plan the seam first: carried object, same pose and velocity, cut mid-motion |
| Give every beat the same easing, the same accent, the same cursor behaviour | One clock, one grammar, one accent with one meaning, one cursor art, held across the film |
| Describe a beat by effects ("zoom, glow, fade") | Describe it by what it buys: "the viewer ..." |
| Stretch beats to fill a longer film | Add beats and chapters; beats stay 3-7 s |
| Put the product in on frame 1 in full browser chrome | Claim in type, hard cut, product performing the claim in a cropped fragment |
| Bounce every pop and add glow everywhere | One overshoot payoff in the whole film; flat colour elsewhere |
| End on a settled logo that fades out | End mid-motion, or on a lockup that stays alive; no fade-to-black as the default |
| Treat the accent colour as decoration across the frame | Accent has one meaning and appears on at most one element per scene |
| Number the chapters, label the acts, put the film title in a corner | A chapter is a ground change plus a carried object; the frame holds the claim, the product and the logo once |
| Pick claim -> cut -> proof -> cta because it is the skeleton in the file | Write the first idea, find two of other kinds (section 3a), cover the logo, choose |
| One flat swatch ground per act | A surface per act: ground + light + depth + texture, written down per act (section 4 item 8) |
| Treat every beat as important and animate every line | Importance budget: at most 25% of beats at importance 3 |
| Make the logo the dot that grows out of a carrier, every time | The logo arrives by cause; a carrier is optional and must travel |
| Hold a frame for "reading time" with nothing alive | A designed breath (0.6-1.5 s, reason stated) before a payoff; one living thing on any held frame |

## Prove it

[measured corpus, original director-worksheet.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
