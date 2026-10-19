# Slop: the review file

[measured corpus, original slop.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, captured-identity view; asset-prep, SKILL.md#working-inside-an-existing-product-repo] This source asks for real captured sender/time/content identity. The current repo instead requires clearly synthetic, demo-safe customer values and forbids personal, test-user or production information on screen. Preserve product geometry and approved copy; the [existing privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#working-inside-an-existing-product-repo) governs customer identity.

See also: [video-brief MEASURED-JUDGMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-JUDGMENT.md) (what good is, with the conditions), [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) (finding the idea; cover-the-logo), [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md) (grounds, light, surfaces: the cure for flat swatches), [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md), [shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md), [shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) (section 0: page chrome), [shotlist MEASURED-PRODUCT-DEMO.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-PRODUCT-DEMO.md), [shotlist MEASURED-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TRANSITIONS.md), [shotlist MEASURED-ENDINGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-ENDINGS.md) (the numbers behind each fix); [shotlist MEASURED-DIRECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-DIRECTION.md) (what to change when a beat fails; the storyboard checks); [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) (section 6a: sound has an arc); [seek-engine measured/README.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md#their-tools-in-this-skill-set) (which script computes which gate).

Slop is not a style. It is what comes out when no decision was made. This file is used in three places:

- **Part 0 runs on your PLAN**, before you build: the twelve default reaches and the house style, as questions you ask of your own choices.
- **Part 1 is a lookup** of what an AI does by default against what a working motion designer decides instead, grouped by topic, plus **Part 1b**, the conditions under which each "tell" is actually right.
- **Part 2 runs on your RENDER**: an honest way of seeing, six gates (G0-G5) computed by scripts where possible, and a checklist. **Part 3** ranks the six fixes that matter most.

Times are at 30 fps with seconds in brackets; sizes are % of frame height H or width W; evidence is cited as moment IDs (M913...) or as N1-N25, the ranked page/template patterns of Part 1.

How to run it: build a draft, run the scripts (`render.mjs` writes `<out>.mp4.events.json`; `look.py` uses it for exact cut frames and prints G0, G2, G3, the audio audit and the motion note; `chrome_lint.mjs` computes G5), look at the sheet, work Part 2 top to bottom marking each item PASS / FAIL / JUSTIFIED (a justified fail names the film-level decision that allows it; gates are never justified), fix the three highest-impact FAILs in Part 3 order, re-render and re-check once more. The original source budgets two passes. [Current frame-review](SKILL.md#the-loop) requires at least three for a new film and one for a small fix. Keep the source budget scoped; if any required gate still fails when a budget ends, stop and report incomplete rather than certify a pass. Never certify your own film as good: the NOTE.md says what you looked at and quotes the numbers.

---

## Never ship

[measured corpus, original slop.md]

A film that contains any of these is not finished. Delete the element; do not justify it. (The original source says this list mirrors its upstream SKILL.md. That is a historical source relationship; current production follows this repo's [frame-review owner](SKILL.md), not an assumed identical local block.)

1. **Page chrome / HUD:** a brand or film name in a corner, tracked-caps labels, counters ("02 / SPEAK", "01 - THE WAIT"), timecodes, BPM/FPS/resolution text, progress bars, corner brackets, scene labels over a shot (N1, N2, N13, N21; gate G5; [shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) section 0).
2. **Deck layouts:** a held left-aligned headline block, a kicker above a headline, a title then content, header/body/footer, "headline left, device right" (N3).
3. **Generic web-component UI:** a rounded card with a status dot and "label - value", a "Good morning" card, three-circle toolbars with a send arrow, zinc greys, skeleton bars; invented names or numbers where the capture has real ones (N5, N17).
4. **The name's first association** as the idea (N19).
5. **Invented stats and proof**, stat walls, a stat slide (a centred big number over a small label), on-screen disclaimers (N7, N17).
6. **Slogan copy:** triplets of one-word sentences, "Not just X. It's Y.", "Unlock", "Meet X", "the future of" ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) section 0.3).
7. **The house style as a default:** a giant cropped word, texture in the letters, a colour flood or circle wipe between beats, a dot that becomes the logo, a lockup built from the motif, a transformation chain, a headline typed with a caret (N9, N12, N15; Part 0).
8. **Flat swatch grounds per scene, or a small card on a void** (a 0.3 W object for a 1 s read on empty ground) (N4, N5).
9. **A pinned object**: a pill or dock at the same coordinates through three or more shots (N8).
10. **A web-footer ending:** logo + tagline + button + URL, or an end card outside the [scoped end-hold gate](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-ENDINGS.md#2-universal-close-rules) (N14; gate G3).
11. **Self-certification:** no `NOTE.md`, gates claimed without script numbers, "justified" fails (N25).
12. **A film you did not look at.** A 15 s black render was once certified "VERIFIED / CLEAN".

Slide test (30 seconds, on `look/sheet.jpg`): cover all the text with your hand. If more than half the frames are "a flat colour with a card or a block on it", it is a deck. Fix the picture, not the type.

---

## Part 0. The default mind (run on the PLAN)

[measured corpus, original slop.md]

The root of every default below is the same: **no decision about what this one film is for.** None of them is banned. Each is fine *if you chose it for a reason you can say in one sentence about this brand*. What is not fine is arriving there by default. Run this on the storyboard before you write code ([shotlist MEASURED-STORYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-STORYBOARD.md) section 7, check 10), and again on the render.

### The twelve reaches

[measured corpus, original slop.md]

| # | The default reach | Notice it: ask |
|---|---|---|
| 1 | **Making a page instead of staging a picture.** Left headline + grey sub-line + phone on the right held while the words change; a centred title + subtitle; a heading over a chart for every beat; a row of icon tiles. The frame stays put and content is swapped into slots, so time becomes pagination. | Would this frame work as a slide or a website hero? Then it is a page. |
| 2 | **Showing everything.** Every feature from the brief gets a beat of equal weight; nothing is *the* thing. | What is the one true thing? Which features did I leave out on purpose? |
| 3 | **States instead of events.** Things fade or rise in and hold; the plan describes end states ("a phone showing the toggle"). | Does my plan say what *happens* (what moves, what it causes), or only what is shown? |
| 4 | **Premium pastiche.** Near-black ground, radial glow, a gold or coral spark, lens flare, one serif-italic word in a sans line, tracked small caps. Six of ten AI films sat on near-black; under a third of the designer films did and almost half were bright. | Is the ground dark because the brand is dark, or because dark feels expensive? |
| 5 | **Production metadata as decoration.** HUD corners, "BAR 1/8 - 120 BPM", "FILM 01", "01 / 04", version numbers, on-screen disclaimers. The look of a design tool mistaken for design. | Does the viewer need this text? (They do not need your storyboard.) |
| 6 | **Filling holes with invented proof.** Stat walls, counters to unsourced numbers, grey skeleton bars as UI, a redrawn logo, emoji as icons, vibe-coded cards. | Is anything on screen invented to look real (numbers, UI, users, songs, quotes)? Did I open `screens/` and `media/` first? |
| 7 | **The first association of the name.** A name that sounds like stars gets stars; "launch" gets a rocket; security gets a shield. | What was my first idea? Did I write it down and look past it ([video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md))? |
| 8 | **Effects standing in for quality.** A new technique every beat (morph, particle cube, ribbon, circular text, glitch, 3D bars, orbit rings): showing you *can*. | Is this effect here because the idea needs it, or to show effort? |
| 9 | **A script with illustrations.** Words first, a picture under each sentence. (The copy is often the best part of an AI film: keep the writer.) | Does the picture have its own job, or does it illustrate each noun? |
| 10 | **Sound as wallpaper.** A fixed-tempo loop at a flat level, an onset every half second for 15 s, no silence, no build, no hit on the turn; or silence by default. | Where is the first big sound or silence, and what visible event is it tied to ([sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) section 6a)? |
| 11 | **The ending as a web footer.** Logo + tagline + CTA pill + URL held for seconds, as conversion furniture rather than the last beat of the story. | Did the logo arrive by cause? Is the ending smaller than the climax? Is it 0.6-1.4 s? |
| 12 | **Minimalism as a hiding place.** A small UI element on a black void, a lone line, long holds, a logo alone for four seconds: it looks restrained, but nothing was risked, built or crafted. The user has rejected it directly ("it should have more stuff than this"). | Is more than a third of the film nearly still? Is any frame mostly empty ground with something small on it, and is that emptiness doing a job (a breath before a payoff) or is it undesigned? Where is the frame someone would screenshot? |

### The second-order default: the "designed" house style

[measured corpus, original slop.md]

Told "do not make slides, be bold", a model overcorrects into a different default that is just as recognisable:
- a giant word cropped off the frame edge, in every film;
- the repeated-word marquee band;
- texture, video or gradient filling the letters;
- a colour flood or circle wipe between every beat;
- a small dot or shape that becomes the logo's dot, "o" or full stop;
- a lockup built from the motif of the film (found in all of 21 generated directions);
- a text strip sandwiched between rows of texture;
- everything moving all the time, holds forbidden, giant type everywhere so giant means nothing;
- every film a chain of "X becomes Y becomes the logo" (18 of 22 idea lines).

Eight brands made this way read as one designer's reel in eight colourways. Each of these moves is legitimate when it *is* the idea for this brand. As proof of effort, it is the new slop. This skill's own defaults can feed it: law 7 (arrival from oversize), the carrier object and the built-from-parts logo ([shotlist MEASURED-DIRECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-DIRECTION.md) section 4, [shotlist MEASURED-ENDINGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-ENDINGS.md) C2/C3/C5) are *options*, not the house style.

### Notice-it questions (the plan check)

[measured corpus, original slop.md]

- Which of my choices did I *decide*, and which did I *reach for*? (For the film shape, ground, type, ending, sound, transitions: one sentence each.)
- With the logo and colours swapped, is this the same film I would make for a competitor? (Cover the logo.)
- What is the first idea I had? Did I look past it?
- Am I showing everything? What is the one thing?
- Is anything on screen invented to look real?
- Is the ground dark because the brand is dark, or because dark feels premium?
- Is this a transformation chain because that is the best film, or because it is the film I always make?
- Is it sparse because the idea wants silence, or because I did not build the world? Where is the frame someone would screenshot?
- With the text covered, does every beat still show a picture?

### Mechanical compliance

[measured corpus, original slop.md]

A checklist can be satisfied by a film that does not exist: a 15-second black render was once self-certified "VERIFIED / CLEAN", and a banned stat card renamed as a "slot-swap move" is still a stat card. So the gates below are computed on the render by scripts the agent does not edit, the numbers are quoted in NOTE.md, and everything else is a question you answer in plain words. A passing gate is a floor, not a verdict.

---

**Moved:** part 1 (the master table, AI default against the pro decision) is now in [slop-table.md](MEASURED-TELLS.md).

## Part 1b. Works when: the conditions behind the "tells"

[measured corpus, original slop.md]

Taste is conditional. Nearly everything above that generic AI films overuse was also used well somewhere, under a condition. The default is the left column's reading; the right column says when it is right ([video-brief MEASURED-JUDGMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-JUDGMENT.md) has the full argument). Where a row says "never", there is no condition.

| Usually a tell | Works when |
|---|---|
| Typewriter text with a caret | The product *is* something you type into and the typing is inside its own input field, or the caret becomes something (a divider, the logo's letter, the UI). Never a film headline ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) section 0.4), never as the reveal style of every line |
| Centred still end card | It follows sustained motion, echoes the opening, and the logo arrived by cause rather than by fade; held 0.6-1.4 s |
| Soft gradient / glow orb | It is the brand's own material, a named object with a job, or one light source that changes with the mood; never wallpaper under every scene |
| Serif in a sans film | It is the brand's own heading face (then use it everywhere in that role), or a deliberate second voice used rarely and large, or it quotes a partner's real typography; never a lone italic accent word |
| Dissolve / blur transition; "almost nothing fades" | The blur copies a real gesture (focus pull, scroll, whip) with a direction; the dissolve *is* the meaning (privacy, forgetting); the brand voice is calm and reassuring; a single object fades (one headline line, the last phrase). Never as the join between every scene |
| Hard colour flips | The colour change is the story beat and one element carries across the cut; the grounds are surfaces, not swatches (N4) |
| Slide grammar (centred line, flat field, cuts) | It is paced to a voice at speech rate, the type never moves position, and a second visual voice adds wit (a cursor, an object). Never as a page: no label, counter, sub-line or kicker |
| Mostly empty frame, tiny text | There is exactly one subject, something leads the eye (a cursor, a voice, eyes), the emptiness does a job (a breath before a payoff, isolation after a matched cut), it lasts under about 1.5 s, and it is not at phone size |
| A number counting up | The number is the real offer, its size is the point, and it is tied to the control that causes it ([shotlist MEASURED-TYPE-DECISIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPE-DECISIONS.md) section 8); a proof-texture number appears whole, with no count-up |
| Ending in motion (and "never a calm end") | Default for energetic brands. About 22 of 51 human films end calmly: a quiet brand, after sustained motion, with the mark already arrived |
| Template moves | Deliberate quotation (satire), where bland visuals against loaded copy is the joke |
| Low frame rate, no blur | Used consistently as a chosen texture (an on-twos film) |
| Monospace headline | It is doing a job (reads like a bill or a log) and gives way to the brand font when the product arrives |
| A giant cropped word or a giant first word | The idea wants that word to be huge, it arrives once with a cause (a camera pan across it, a surface), and scale is not spent again; not as an opening in every film |
| A dot that becomes the logo; a lockup built from the motif; a transformation chain | It *is* this brand's idea (its own mark really is that shape) and each link is true; otherwise the logo arrives by cause |
| A held frame ("no dead frame") | A designed breath of 0.6-1.5 s with a stated reason, immediately before a payoff or after a matched cut, with one living thing on it |
| A carrier object | The film shape is a chain of handoffs; it moves, scales or changes role at every seam |
| 3D / tilted flat UI | The idea is physical (an object that has mass, catches light, or that the brand makes), or a cropped held-pose device; never a tilted card as "depth" |
| Page chrome (labels, counters, timecodes, headers, footers, kickers) | **Never.** There is no condition (gate G5) |

---

**Moved:** part 2 (the frame-review checklist and its gates) is now in [slop-review.md](MEASURED-REVIEW-CHECKLIST.md).

## Part 3. The six fixes that matter most

[measured corpus, original slop.md]

The six gates (Part 2, section 0) come first: the render exists, the proof is big enough to read, no empty frame, end card 0.6-1.4 s and CTA <= 25 %, one object per frame, no page chrome. Then, ordered by judged impact on the feel (practice, not measured), do these in order.

**0. Remove the page.** No chrome, no counters, no left headline block, no kicker, no flat swatch as the picture, no pinned dock, no stat slide, no footer ending. This is what the user rejected hardest and it is not in the motion data; the corpus films have none of it (see Never ship). Run `scripts/chrome_lint.mjs` (gate G5), then look at the outer 12% of every sheet frame by eye.

**1. Replace every fade and crossfade with a hard cut on a moving frame, with a carried object, unless a Part 1b condition holds.** Every film in the study cuts hard (fades appear only on single objects: the last phrase to black, one line of a headline; calm brands and meaningful dissolves are the exceptions). Make the last frame of beat N and the first of beat N+1 share a position, a string, a ground, a caret or a card, and make both frames mid-motion (object displaced, scaled, or blurred). Check A1-A4. (M914-M974)

**2. Give each role its own curve, and stop overshooting.** One global ease is the loudest AI signature. Entrances do 60-72% of travel in the first 4-5 f then a 0.4-0.6 s tail; exits accelerate over 6-13 f (`accelExit`); counters step per frame; typing is stepped; drift is linear (`cruise`); one visible spring per film (+4-6%). Camera moves are a one-frame snap plus a tail, not one tween. Check B2-B4, E3. (M913, M914, M929, M920, M948)

**3. Kill every dead frame, and end in motion or on a designed stillness.** A hold is only allowed after a payoff and only 0.5-1.0 s (the resolved end card 0.6-1.4 s, gate G3), or as a designed breath of 0.6-1.5 s with a stated reason; everywhere else add drift, shrink, shimmer, scrubber creep. The film never fades to black by default: the last 0.2 s accelerates (or a calm brand settles by Part 1b) and the last frame is visible. Check B1, H2, H3, E6. (M913, M916, M932, M936, M944)

**4. Make type behave like a director set it.** Words arrive whole on the speech rhythm (3-5 f gaps, a longer gap before the stinger), from an offset with blur clearing, not by opacity and not letter by letter; the brand's own face at regular weight (400-550) with tight tracking; hierarchy by scale (7-11% H headlines, 22-29% H figures) not bold; the key word acts out its meaning; survivors never re-centre; highlights are hard-cut boxes or a hand-drawn loop. Check C1-C8, A5. (M921, M929, M930, M936, M964, M967)

**5. Spend colour and effects once, and show UI as a fragment with identity and a believable pointer.** One hue for "arriving/acting", one signal for "done", no glow as wallpaper; UI cropped to one object under one camera group, built from the capture's real screen, backdrop blur 4-11 px, a custom oversized cursor that parks then presses, the target squashes 0.63-0.81 one frame later, no ripple. Check D1-D3, E1-E2, F1-F7, W3. (M913, M914, M919, M931, M956, M959)

## Prove it

[measured corpus, original slop.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
