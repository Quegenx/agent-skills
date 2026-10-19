# Director: how a motion designer thinks before animating

[measured corpus, original director.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, original director.md; seek-engine, SKILL.md#render] Source render commands using `--subframes` are historical. The current form is in [Render](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SKILL.md#render), using the `full` subcommand and `--sub`; no flag equivalence beyond the recorded translation is assumed.

Read [the shotlist router](SKILL.md) for measured composition, type, transitions, demos and endings; [the brief router](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/SKILL.md) for idea, brand and world decisions; and [the tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md#their-tools-in-this-skill-set) for current helper owners.

**Contents:** [0. Start here: PAGE, script cues, importance budget](#0-start-here-page-script-cues-importance-budget) · [1. The four beat roles](MEASURED-BEAT-ROLES.md#1-the-four-beat-roles) · [2. "What does this beat buy?"](#2-what-does-this-beat-buy) · [3. Film architecture](#3-film-architecture) · [4. Film-level SYSTEM decisions (made once, before any beat)](#4-film-level-system-decisions-made-once-before-any-beat) · [5. Continuity: the last frame of beat N is the first frame of beat N+1](#5-continuity-the-last-frame-of-beat-n-is-the-first-frame-of-beat-n1) · [6. Energy and attention curve](#6-energy-and-attention-curve) · [Prove it](#prove-it)

Read this before opening any editor or writing any code. A film is a short chain of beats. Each beat has a job, the jobs are ordered, and the seams between beats are planned before the beats are. The 53 reference moments (M913-M974) are the evidence; IDs in brackets point at them. Rules are written WHEN situation, DO decision with numbers, *because* what it buys the viewer. Numbers: frames at 30 fps with seconds in brackets (0.1 s = 3 f); positions as frame fractions (x right, y down); type as % of frame height H, widths as % of W. The source clips run at 24/25/29.97/30/60 fps; all numbers here are converted to 30 fps.

Where the reference films disagree, the section says so and names the condition that decides.

**Order of thinking.** The idea comes first ([video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md)), then the world and the time (sections 3a, 4), then the beats and seams (sections 1, 2, 5), then the measured numbers ([seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md), [MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md), [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md)). The 53 reference moments are a corpus of short SaaS moments, so every skeleton below is *one* film shape among several (section 3a). Judgment decides WHAT the film is; measured craft decides HOW each beat moves.

---

## 0. Start here: PAGE, script cues, importance budget

[measured corpus, original director.md]

Write these three things at the top of `STORYBOARD.md` before any beat. They take about fifteen lines and decide most of what follows.

**PAGE:** use the four-line [definition in ideation](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md#1-page-what-the-film-is-for), then write the script cues and importance budget below.

Lock decisions in this order: story, then frames, then style, then copy, then motion. A film styled before its story is a template.

**Script cues.** Read the script (or the claim list) once and mark every number, abstract noun, name and contrast word ("not", "instead", "before / after"). Each marked word gets a visual of its own: a number becomes a physical quantity, an abstract noun becomes an object ([video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) metaphor bank), a name becomes the real mark, a contrast becomes a before/after cut or a swap in place. Not every word goes on screen: the screen shows the one or two words that matter and the picture carries the rest. Test: mute the film and read the picture alone; does it tell the same story?

**Importance budget.** Give every beat (and every line inside it) an importance of 1, 2 or 3. The judgment source defines 1 as connective (fast, small, a cut or word swap), 2 as supporting, and 3 as the point (slower, larger, held to reading time plus 0.5-1 s, with its own sound). **At most 25% of beats are importance 3.** Importance 3 gets the scale, the camera move, the sound and the hardest work; importance 1 is small and quick. Animating every line as if it were important is the most common AI tell, because then nothing arrives. When two elements fight for attention, delete one before you restyle either. A line with a number: the number is the hero, at least 2x the line's scale.

---

## 1. The four beat roles

See [Measured beat roles](MEASURED-BEAT-ROLES.md) for this complete section. [measured corpus, original director.md]

## 2. "What does this beat buy?"

[measured corpus, original director.md]

**WHEN** about to design any beat **DO** write one sentence in the form *"Buys X: the viewer ..."* before touching layout, and keep it in the storyboard row **because** a beat with no purchase is decoration, and decoration is what makes a film read as a deck of animated slides. Test: delete the beat; if the viewer loses no belief, delete it for real. If the sentence needs the word "and", split the beat or drop one half.

A good sentence names a **viewer state change**, not an effect. Bad: "buys visual interest", "buys a smooth transition". Good: "buys the belief that ..." / "buys the moment where the viewer ...". The reference "why" lines, rewritten generically:

1. **Claim as speech (hook).** Buys reading attention: the viewer parses a claim as it is being assembled, so each landing is a stated fact, not an effect (M921, M930, M964, M967).
2. **Perceived labour (proof).** Buys trust: the viewer watches the machine do named, checkable steps one after another, which turns an instant result into something earned (M913).
3. **Thesis breath (proof between demos).** Buys a graphics-only pause that restates what was just shown and sets the mechanism for the next block (M914).
4. **Second, closer read of evidence (proof).** Buys credibility with zero new copy: magnification of something already accepted proves it is genuinely live (M917).
5. **Authority as a cascade (hook).** Buys the belief that one admin action reaches every item below it: shown as a wave, not stated (M933).
6. **Scale as a countable quantity (turn/proof).** Buys "everyone" or a large count as a lattice or ring the viewer has already counted, instead of a figure to trust (M934, M956).
7. **Safety as a ledger (proof).** Buys autonomy as a governed log: every change itemised with an undo attached (M940).
8. **Selection as a traceable state change (proof).** Buys no explanation of "what got picked": one continuous object carries the choice from the browse layer back into the form (M943).
9. **Arrival instead of a cut (proof).** Buys the product reveal as something that comes in: a carried object keeps identity across black and the scale-in stages dense UI before it is read (M944).
10. **Claim ends as a symbol (proof/turn).** Buys a sentence that dissolves into icons the viewer carries away as one object (M958).
11. **Action handed to the viewer (cta).** Buys the click as theirs: the button is lit, the cursor arrives, the film cuts before release (M959, M949).
12. **Craft as a receipt (hook).** Buys "engineered, not decorated" before any word: a two-frame drafting flash registers subliminally (M962).

**WHEN** two beats have the same sentence **DO** merge them or change one's purchase (escalate: a URL becomes a full brief, M919) **because** repetition without escalation reads as padding.

---

## 3. Film architecture

[measured corpus, original director.md]

The source films share one skeleton in different clothes: **claim in type, hard cut, the product performing the claim**, then one resolving brand close. Treat **claim -> cut -> proof -> cta as ONE film shape** (the one the corpus happens to contain), not as the structure of every film: section 3a lists the others, and the shape is chosen in [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) before any beat exists.

Observed patterns:

| Pattern | Shape | Evidence |
|---|---|---|
| Chapters | a claim in type (1.5-3.0 s, 45-90 f) then a product phase of equal or longer length; hard cut between. The chapter break is a ground change plus a carried object. **Never a number, index, label or counter on screen** ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md), Page chrome is never part of the film) | M953-M959 |
| Problem, turn, proof, close | promise, diagnosis, accumulation to a brand bumper, then two proofs | M936-M940 |
| Noun, proof, viewer action | name the thing, demonstrate it, hand over the prompt | M947-M949 |
| One data thread | the same trade carried through four clips; the proofs are different views of one object | M921-M924 |
| Ident then system | brand sting then one object demonstrating every parameter | M962-M963 |
| Act structure inside a clip | act one in smaller type, hard cut, act two bigger and in the accent | M967 |

**WHEN** building a film **DO** open on motion at frame 0 (a card already mid-open, a word already half-risen, a log already scrolling) and never open on a logo or an empty frame **because** the first beat should already be carrying momentum (M933, M938, M939).

**WHEN** the hook is type only (a claim, no product yet) **DO** let it run 2-3 s (60-90 f) **because** the voice finishes in about 1.6 s and a longer type-only hold is the emptiest stretch of the film (a test film's 2.8 s type-only hook worked; the stretch with one small word alone on screen was its emptiest). Hooks with product motion keep 3-6 s.

**WHEN** setting beat lengths **DO** keep every beat at 3-7 s (90-210 f) and add beats rather than stretching them for longer films **because** the corpus never holds a beat longer than 7.5 s; the hold lives at the end of a beat, not across it.

### 3a. Film shapes (choose one on purpose, in [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md))

Write the first idea you have, then find at least two more of *different kinds* from this table. Pick the one that could only be this brand and that you can make well. Cover the logo: if the film could advertise a competitor, it is not an idea yet.

| Shape | What the film is | Works when | Watch out |
|---|---|---|---|
| **Claim -> cut -> proof -> cta** | the corpus skeleton (sections 1-3): claim in type, product performs it, brand lands | the product has one operable action and a sentence that names it | the default; if it is the only shape you considered, you reached for it |
| **Held shot** | one continuous shot (a camera move over one scene) that slowly changes; no cuts | the product is a place or an object with a lot to see | needs a world ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)); one idea, no tour |
| **Joke with a character** | a small comic situation with a character, the product as the punchline | the brand voice is dry or playful and the joke is specific to its users | the product must still be literal and visible; no puns on the name |
| **UI documentary of one real task** | one real task from start to finish in the real UI, filmed by a camera | the product is operable and the task has stakes ([MEASURED-PRODUCT-DEMO.md](MEASURED-PRODUCT-DEMO.md), case section) | recipes are mechanics, not the film; no feature tour |
| **Typographic essay** | the words are the picture, set in the brand's own voice and type, acting out their meaning ([MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md) section 0) | the brand is a voice (editorial, tools for writers, finance with a point of view) | a big claim on an empty flat field is the failure mode; the words must do something |
| **Montage of real output** | many real outputs (the things the product makes) in a built rhythm | the product's output is beautiful or varied and real material exists | needs the real material from the capture; never invented thumbnails |
| **Stillness that breaks** | a calm held world, then one event breaks it, then it settles smaller | the brand promise is calm, and the product removes a disturbance | the held part is a designed breath (law 8), not an empty frame |
| **Transformation chain** | X becomes Y becomes Z becomes the logo | rarely: the product is itself a transformation and each link is true | **the most over-used shape.** A chain of "dot becomes the logo's dot" is a house style ([frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 0) |

Whichever shape wins, the beat table, handoffs, importance budget and honest look (sections 2, 5, 7) still apply. A shape with no cuts (held shot) has handoffs inside the shot: each change is caused by the last. **Know when to stop**: one ending; if the film already felt like the end, it is.

### Recommended skeletons

(Timings for the claim -> cut -> proof -> cta shape; other shapes borrow the lengths, not the roles.)

| Film | Frames @30 | Beats (length) | Proofs | Notes |
|---|---|---|---|---|
| **10 s** | 300 | hook 3.0 s (90 f) / proof 4.5 s (135 f) / cta 2.5 s (75 f, = 25 % of the film) | 1 | Evidence: M930-M932 (3.1 + 3.2 + 3.7), trimmed so the CTA stays within the 25 % gate. A two-proof 10 s film with no cta ends on the second action (M914 + M913). |
| **15 s** | 450 | hook 4.0 s (120) / proof 4.5 s (135) / proof 3.5 s (105) / cta 3.0 s (90) | 2 | Evidence: M921-M924 ran hook + three proofs at 4.1/4.9/3.3/3.2 s on one data thread and ended on the confirmation. Use three proofs only with a carried data thread. |
| **16-18 s** | 480-540 | hook 3.0 s (90 f; a type-only hook may be 2-3 s) / proof A 4.5-5.0 s (135-150 f) / proof B 4.5-5.0 s (135-150 f) / cta 2.5-3.5 s (75-105 f) | 2 | *Practice* (a test film at 16 s). One object per frame inside each proof (cut or camera-move between code and result, [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) R3.5). The cta is the lockup slam (~0.7 s) + one supporting line + a resolved hold of 0.6-1.4 s: at most 25 % of the film (4.0 s of 16, 4.5 s of 18). If you need more length, give a proof a third beat (a turn into the next feature), not a longer logo. Example at 16 s (480 f): hook 0-90, proof A 90-240, proof B 240-390, cta 390-480 (90 f = 19 %). |
| **20-30 s** | 600-900 | hook 4.5 s / turn 4.5 s / proof 5.0 s x2-3 / cta 4.5-5 s | 2-3 | Evidence: M925-M929 (hook 3.5, turn 4.3, proof 6.2, proof 4.1, cta 5.4 = 23.6 s); M936-M940 (27.7 s). |
| **45-60 s** | 1350-1800 | 2-3 chapters, each: (hook or turn) 4 s + 2 proofs of 5 s; chapter breaks are turns; one cta 5 s; total 10-12 beats | 4-6 | *Practice, not from the corpus*: the longest source film is about 31-35 s. Extrapolated by repeating the 20-30 s chapter and re-spending the accent, not by lengthening beats. |

**WHEN** deciding how many proofs **DO** use about one proof per 8-10 s of film, never zero, and no more than three in a row unless one object (a trade, a prompt, a card) runs through them **because** proofs make up about half the runtime of the corpus, but a run of unconnected demos reads as a feature list (M921-M924 works because one value is carried; *practice* for the 8-10 s ratio).

**WHEN** the film needs a problem **DO** spend it in the hook or a short hook-turn pair and let the brand arrive at the **turn**, near the middle of the energy curve **because** the brand name lands as the payoff of the problem act (M938, M965, M968).

---

## 4. Film-level SYSTEM decisions (made once, before any beat)

[measured corpus, original director.md]

Write these into the top of the storyboard. Each is one decision held for the whole film; mixing them is the strongest AI-made tell. Decisions 4 and 8 are about what each frame is *made of* ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)), and decision 6 is optional.

**1. One clock.** *Pick a frame rhythm and keep every layer on it.*

| Clock | Use when | Evidence |
|---|---|---|
| Smooth (24-30 fps interpolation), stepped only for counters and glitches | product explainer, UI-heavy, premium feel | M913, M939-M940, M964-M966 |
| On twos (every pose held 2 frames, 15 fps look) | indie/technical, hand-posed or typographic sets | M947-M949, M967-M969, M945 |
| Split: drawn/posed items on 12 fps, camera and type on 24 fps | one film wants both mechanical and hand-drawn | M933-M934 |
| 60 fps smooth | brand morphs and extreme zooms where smear would show | M921-M924, M973-M974 |

Mixed step rates inside one moment read as a bug, not a style (M962-M974).

**2. One motion grammar.** *Smear/blur on fast moves, crisp hard steps, or camera shutter blur: one of the three per film, never mixed.* Smear film: directional smear along the travel vector for 1-6 f (3 to 65 px) on every fast move (M916-M920, M926, M929, M931, M937). Crisp film: flat vector, no motion blur, camera snaps in one frame then a 0.3-0.6 s tail (M913, M914, M921, M934, M939, M962-M969). Smear film IDs and the implementation are in [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R4.1, R4.2. Condition that decides: a hand-made, fast, energetic film wants smear; a dense UI film that must stay legible wants crisp steps. The third option is **shutter blur**: render with `scripts/render.mjs --shutter 180 --subframes 8` so every moving thing gets real motion blur from the camera model (smooth, continuous films only; it replaces per-element smear, [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R4.8, and is wrong for a stepped on-twos film).

**3. One type family and a role scale.** Follow the brand's own type (the face its site loads, in `brand/fonts/`); when the brand has none, a neo-grotesk at weights 400-550 (600 on the wordmark, 650 on one word) is the measured default (the corpus is all Inter-class). Sentence case, tracking -1.5 to -5% em at display sizes. Bold only on a wordmark or one numeral. Scale is the hierarchy, not weight (M921-M974; the full table with weights and tracking is [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) section 4):

| Role | em % of H |
|---|---|
| Annotation / unreadable UI texture | 1.3-1.9 |
| Menu, UI card text, UI prompt | 2.2-5 |
| Supporting phrase | 5-7 |
| Headline / statement line | 7-11 (9 typical) |
| Act-two / emphasis word | 16 (after 11 in act one) |
| Hero figure | 22-29 (opening thesis word 33) |
| Wordmark | 9-14 (ink 0.22-0.38 W) |

If the brand's own heading face is a serif, it is the film's voice in that role everywhere (a serif used only as one accent word in a sans line is a 2023 reel habit, [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) N12). A serif against a sans UI as a deliberate second voice is acceptable for one emotional line per film (M933-M935).

**4. Ground strategy: a surface per act, not a swatch per scene.** A ground is made of something (a plate from the capture, a product screen, a material, a light with a source, a gradient that is the brand's own) and is lit and textured unless the brand is genuinely flat. A flat single-colour ground per scene is a slop pattern (a deck of swatches: [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) N4); a flat colour is allowed for a flood or a dive under about 1 s. Between acts the measured grammar still holds: light to dark to light (M921-M924, hard cut or growing object between), dark bookends around a light middle (M930-M932), light world / claim colour / near-black sign-off (M925-M929). The ground only changes at a hard cut or by a growing object; never by a flash or crossfade (M922 bead to disc, M924 sweeping band). Where a ground must change inside a scene, ramp one straight colour track over 0.5-0.7 s (15-21 f) timed to what leaves (M926). Light is as premium as dark: pick the ground the brand's own surface is, not the one that feels expensive.

**5. One accent, one meaning.** Greys plus one hue spent only where that meaning is true. Meanings seen:

| Accent meaning | Evidence |
|---|---|
| "the AI is acting" (typing, scan, sweep, shimmer, halo) | M913, M914, M916-M920 |
| "this is arriving" (new word tints, decays to ink in 6 f to 0.3 s) | M966, M967, M973, M974 |
| "ON" (switches) with a second hue for "result/authorised" | M933-M935 |
| "the argument noun" | M936-M938 |
| "event marker" (drag, drop, one word) | M930-M932 |
| "done" in green, separate from the acting hue | M916-M920 |
| "gain" in green, semantic only | M921-M924 |

Never two meanings in one hue; never the accent on more than one element per scene (M930-M938).

**6. A recurring carrier object (optional).** One object that survives cuts: a dot (M962-M963), a disc (M942-M944), a card (M930-M931), a caret (M948-M949), a headline string (M918-M919), a five-dot ring (M926-M927), a mascot that marks the agent's position in the job (M916-M920), a bead (M922). Choose it at the system stage if the film shape is a chain of handoffs, so every seam has something to carry. It must move, scale or change role at every seam (never pinned at the same coordinates across shots: [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) N8). **House-style warning:** a small dot that becomes the logo's dot, full stop or "o", and a lockup built from the carrier's motif, are the signature of one over-used generation of films ([frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 0). Use them only when the idea is exactly that; otherwise the logo arrives by cause (a click, a result, a camera move), not by default.

**7. Cursor art.** One designed cursor per film, vector, never the OS arrow: custom arrowhead (M914), white glove on dark / black arrow on pale, switched by ground (M930-M933), paper-plane (M959), glossy 3D arrow (M956), flat arrow with name pill (M953). Decide hand vs arrow once: hand-swap-before-click suits playful hand-posed films (M928, M930, M931); a single persistent arrow, never a hand, suits product-demo films (M914, M942, M969).

**8. The world per act (ground, light, depth, texture, sound).** For each act (not each beat) write five words about what the frame is made of. This is the decision most AI films skip, and it is where "a small card on a void" comes from. Details and the hero-moment toolbox (real 3D, a generated surface plate, a physical sim, a dense composition) are in [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md).

| Act | Ground (a surface from the capture or a made one) | Light (one source, direction, falloff) | Depth (what is near / far, what is defocused) | Texture (grain, paper, glass, none on purpose) | Sound (bed, silence, the first big hit) |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

Restraint means one focal point *inside* a built world, not an empty world: every frame is ground + light + depth/texture with one hero. A frame is empty only when the emptiness does a job (a breath before a payoff, isolation after a matched cut, about 1.5 s at most).

**9. The hero moment.** Name the one frame someone would screenshot and send to a friend, and the beat it lives in (the strongest frame of the energy curve, section 6). It gets the hardest work in the film. If you cannot name it, the film has no centre; go back to [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md).

---

## 5. Continuity: the last frame of beat N is the first frame of beat N+1

[measured corpus, original director.md]

**WHEN** two beats meet **DO** plan the seam as its own task: pick the carried element, write its state at the last frame of A (position, size, velocity, blur, ground colour, text), and make frame 0 of B equal that state **because** the cut then disappears and separately-made beats read as one take (M921-M922, M923-M924, M925-M926, M939-M940, M942-M943, M945-M946, M957-M958).

Seven devices, in order of strength:

| Device | How | Evidence |
|---|---|---|
| Carried object | same object at same screen position; heavy blur on both sides if the rest changes | M930 to M931 card; M944 disc; M948 to M949 caret |
| Same pose and velocity | B opens on the pose A was still easing toward, drifting the same way | M939 to M940 card (0.43 to 0.42 of H); M942 to M943 |
| Same layout geometry | identical lattice or column positions, only content changes | M933 to M934; M934 to M935 (columns 0.18/0.39/0.62/0.83) |
| Transition starts in A, finishes in B | a wipe, smear or colour ramp that began in A completes in the first 2-3 frames of B | M925 to M926 smear; M930 to M931 white wipe |
| Blur-matched cut | exit ends at 18 px blur, entrance starts at 80 px | M937 |
| Running voice-over | one sentence across cuts, so on-screen text carries only the next fragment | M936-M938, M939 |
| Effect becomes environment | a burst's colour becomes the next scene's ground | M943 to M944 |

### Handoff planning step (do this for every seam)

1. Name the carried element and the device from the table.
2. Write the **exit state of A** at its last 1-3 frames: x,y, size (% H), velocity (px/frame or %/frame), blur px, ground hex, on-screen text.
3. Write the **entry state of B**: frame 0 equals step 2 for the carried element; at least one other object is already moving at frame 0 and keeps moving.
4. If A and B differ in ground, say which growing object or band makes the flip (not a flash).
5. Cut at maximum velocity or just before a hold, never after a settle (M948 mid-swell, M959 on the biggest shrink step, M954 after a stepped scan fade).
6. If a voice line spans the seam, mark the word that falls on the cut.

**WHEN** a chapter or act changes **DO** make the break a ground change plus a carried object ([MEASURED-TRANSITIONS.md](MEASURED-TRANSITIONS.md) T1 + T15), never a title, number or label **because** a numbered chapter is page furniture ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md), Page chrome is never part of the film). If the logo is the last frame it should arrive by cause, not by default (optional carrier, section 4 item 6).

**WHEN** a beat must end **DO** end it mid-motion (a line still sliding, a lockup still contracting, a cursor still arriving) **because** the next beat inherits the momentum and the cut becomes a beat, not a pause (M913, M914, M916, M920, M929, M932, M936, M944). The exception is a brand close with a living hold: lingering 0.6-1.4 s (gate G3) with something alive (flame sway of +/-1% W, a sweep every 0.7 s) (M920, M946). Calm endings are also valid for calm brands (about 22 of 51 human films end quietly): the condition table is in [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) Part 1b.

---

## 6. Energy and attention curve

[measured corpus, original director.md]

Plan the curve as a line over the whole film, then place one peak.

**WHEN** designing the curve **DO** put the single strongest frame at about 60-75% of the way through the film, the brand slam or the biggest push, and make everything before it rise: beats shorten, entrances travel less, cadences tighten (M947 beats 1.3, 1.07, 0.70, 0.43 s; M929 scenes 1.7, 1.5, 0.8, 1.44 s; M936 word gaps 5,5,3,3 f) **because** acceleration reads as arrival.

**WHEN** a held frame is needed **DO** hold only after the payoff, for the length of the read: a list 0.8 s (24 f) (M939), a number 0.47 s (14 f) (M945), a lockup 0.67 s (20 f) (M968, M969), a pile of shapes 0.8-1.0 s (M938), one measured outlier, a 3.7 s brand hold with a living mark (M946; it is not licence to pass the 1.4 s end-hold gate). Everywhere else keep micro-drift: 1-2 px/frame line drift, 0.4% shrink steps, counters ticking, dot-grid drift 0.02 W over 3 s (M913, M914, M929, M955, M966) **because** a perfectly static frame reads as a slide. The rule is **no dead frame**, not constant motion: a held frame keeps one living thing on it, and a *designed breath* (0.6-1.5 s, with a reason you can state, before a payoff) is wanted. The 99%-of-frames figure in [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) was measured on 3-7 s moments; it is not a target for a whole film.

**WHEN** placing the strongest frame inside a beat **DO** use these positions from the corpus: hook at the first full assembled line or the cut into the product (M921, M930 at 71%); turn at the brand pop (M926 at 30%, M968 at the mosaic); proof at the cause-effect frame (M913 snap at 57%, M919 click at 42%, M924 cut at 57%, M922 disc flip at 85%); cta at the sign-off slam (M929 at 74%, M932 at 68%) or the cut before release (M959 at 34% of the beat, then a 3 s lingering icon) **because** a beat needs one frame the eye is waiting for.

**WHEN** spending scale **DO** spend it once: one or two moments per film where something is bigger than the frame, and everything else small (most type under a quarter of the frame height); the ending usually gets *smaller* than the climax **because** scale is intonation, and a film shouted at one volume has no emphasis (law 7 is about how big things arrive, decelerating; it is not a recipe for a giant cropped first word).

**WHEN** spending overshoot **DO** allow at most one visible springy payoff in the whole film, a few percent to 12% on one object (M948 dock 0.06 H; M914 button 1.055; M918 tiles 1.12; M973 badge 4%; M963 bullet 4.7%), and decelerate everything else with no overshoot beyond the small late `popOver` leans of [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R1.10 **because** bounce spent everywhere is bounce spent nowhere. Most films use none or exactly one.

**WHEN** the film nears the end **DO** make the final beat the *shortest transition and the longest lingering object*: scenes get shorter, then the closing lockup lingers (M929 4.0 s of scenes then a 1.4 s wordmark; your end hold stays within 0.6-1.4 s, gate G3) **because** the sign-off then feels thrown at the viewer and then left with them.

---

**Moved:** section 7 (the storyboard worksheet) and the slop tells is now in [director-worksheet.md](MEASURED-STORYBOARD.md).

## Prove it

[measured corpus, original director.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
