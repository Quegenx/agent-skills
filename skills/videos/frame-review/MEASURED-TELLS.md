# Slop: the master table

[measured corpus, original slop-table.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, captured-identity view; asset-prep, SKILL.md#working-inside-an-existing-product-repo] This source asks for real captured sender/time/content identity. The current repo instead requires clearly synthetic, demo-safe customer values and forbids personal, test-user or production information on screen. Preserve product geometry and approved copy; the [existing privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#working-inside-an-existing-product-repo) governs customer identity.

Originally split from [slop.md](MEASURED-REVIEW.md) to keep each file under the size cap. Part 1 (the master table, AI default against the pro decision)

## Part 1. Master table: AI default vs pro decision

[measured corpus, original slop-table.md]

### Page, template and house style: the 25 ranked patterns (N1-N25)

[measured corpus, original slop-table.md]

Ranked by how hard the user rejects each ("header, footer, text on left side... like slides" is the strongest dislike), then by how often it appears in the evidence (three rejected AI films, a v1 test film of this skill, and the earlier A/B tests). "Test" gives a contact-sheet check and a source/DOM check; `scripts/chrome_lint.mjs` computes the page-chrome and deck items (gate G5). The ranks 9, 22, 23 and 24 are merged into existing rows below (T2, M4, M5/G4, X1) with their tests.

| ID | Pattern (why AIs default to it) | Test | Pro alternative |
|---|---|---|---|
| N1 | **Corner chrome**: tracked-caps brand or film name, counter, timecode, BPM/FPS/resolution, corner brackets (renderer house style plus the urge to look designed) | Sheet: text under 0.04 H in the outer 14% band repeating on 3+ frames. Source: uppercase + positive tracking; class names like hud, kicker, eyebrow, header, footer, meta, counter, progress, bracket | Nothing. The frame is the claim, the product, the logo once ([shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) section 0) |
| N2 | **Chapter or scene counter**: "02 / SPEAK", "01 - THE WAIT", a progress hairline (decks have page numbers; a chapter row read literally as "numbered") | Sheet: digits + slash or dash + word. Source: text matching a number-separator-word shape, or "chapter/scene/act/step N" | The chapter is a ground change plus a carried object ([shotlist MEASURED-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TRANSITIONS.md) T1, T15), never a label |
| N3 | **Deck layout**: left-aligned headline with sub-line, kicker above headline, title top-left with content below (web and keynote priors) | Sheet: text block with ink-left x < 0.2 and a second smaller text under or over it. DOM: largest text, not centred, x0 < 0.2 | One centred line at y .52-.54, or a split phrase whose far half is an object ([shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) R1.1, R1.4) |
| N4 | **Flat swatch ground per scene** (cream, ink, lavender, green plateaus; "brand colours" read as hex, so a swatch is the safest fill) | Sheet: sample 9 points; under 6% luma range = flat. More than 3 distinct grounds in a film = deck. Source: scene roots with a plain background colour and no image or gradient child | A surface from the capture (plate, product screen, material, light) per act ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)); flat only for a flood or dive under 1 s |
| N5 | **Generic UI card as the proof** (white rounded card, three-circle toolbar, send arrow; tweet card; calendar; "Good morning" card; the cheapest signal of "a real product") | Sheet: rounded rectangle with 3 identical small icons; no brand-specific detail. Source: large radius + `.ico/.send/.card` names + invented strings | A magnified fragment of the *captured* UI with its real icon, sender, time, sentence, cropped by the frame edge ([video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) section 3; [shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) R5.1) |
| N6 | **Feature tour**: card + caption x N, equal beats, caption at the same y every time (completeness reflex) | Sheet: 3+ frames with the same layout at the same coordinates and different words | One proof, one object per frame; beats of unequal length that shorten then linger (Tm1 below) |
| N7 | **Stat slide / stat wall**: centred big number + small label; "12,000+"; "88%" (numbers signal credibility) | Sheet: a 22-33% H number with a smaller label under it, centred, on a flat ground. Source: a count-up followed by a label; thousands-separated numbers | The number is the claim only inside a physical beat (a counter tied to the control that causes it, M9); otherwise cut the number and show the thing |
| N8 | **Pinned element**: a pill, dock or caption at identical coordinates through 3+ shots ("recurring carrier" taken literally) | Sheet: the same small object at the same x,y in 3+ consecutive frames. Source: an element outside all scene roots with no camera or x/y tween | A carrier that moves, scales or changes role at every seam ([shotlist MEASURED-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TRANSITIONS.md) T1); if it must sit, it sits for one beat |
| N10 | **Technique showreel**: a new effect per beat, no motif (the model cannot judge quality, so it shows range) | Sheet: adjacent frames share nothing (colour, object, layout). Source: more than 4 unrelated canvas/SVG generators | One idea and only the effects it needs; a carried motif if the shape is a chain |
| N11 | **Premium pastiche**: near-black ground, ember/gold glow, vignette, lens flare ("keynote dark mode" averaged with luxury) | Sheet: radial brightness falloff to corners; warm halo behind the logo. Source: radial gradients, large soft shadows, large blurs | Flat shapes; a halo only at an event (K3); a ground that is the brand's real surface; light with a source ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)) |
| N12 | **Serif-italic accent word** inside a sans line ("in *your voice*", "*faster*"; a 2023 SaaS-reel habit) | Sheet: a caption with one italic serif word. Source: italic inside a sans element | One family; scale carries emphasis (T3, T9). A serif only if it is the brand's heading face, then used everywhere in that role ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) section 1) |
| N13 | **Tracked-caps tagline** ("MOTION DESIGNER", "A NEW MODEL FROM...") (looks editorial) | Sheet: wide-spaced small caps. Source as N1 | No tagline (E6, H5) |
| N14 | **End card = logo + tagline + CTA pill + URL** (landing-page CTA habit) | Sheet: the last frame has more than 2 text groups. Source: button/CTA + url strings in the last scene | The name on the voice or one hard slam, 0.6-1.4 s hold, mid-motion ([shotlist MEASURED-ENDINGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-ENDINGS.md) R2.0; E2-E6) |
| N15 | **Giant single word as a slide** ("WAITING", "Hope.", "EVERY FRAME") (the skill's own scale push plus no picture) | Sheet: one word over 0.3 H on a flat ground, no object. Source: font size >= 250 px, one text child | Spend scale once and give the word a surface or a physical cause ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) 3.3; [shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) R9.6) |
| N16 | **3D tilt / 3D chart / orbits** around a flat card ("depth" as a stand-in for craft) | Sheet: perspective-skewed card; red 3D bars. Source: perspective/rotateX/rotateY, a three.js import with no scene reason | A cropped, held-pose device (U11), a stepped 2D camera, or real 3D when the idea is physical ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)) |
| N17 | **Invented proof / placeholder UI when real assets exist** (a stock first name, a made-up email subject, "12,000+ creators"; no real material was gathered) | Source: compare strings in `index.html` with `brand/BRAND.md` copy; any person name, number or UI label not in BRAND.md or the brief is a flag | Captured copy and screens; invented items declared in NOTE.md |
| N18 | **Brand = hex + font only**: the capture's photos, signature graphic and real UI unused (the skill said look, not build) | Source: `brand/media/*` and `brand/screens/*` not referenced by `index.html` (a v1 test film used 0 of 9) | Build the ground and the proof from the capture ([video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) sections 1, 3) |
| N19 | **Name-literal idea** (a name that means fire gets an orange glow; a name that sounds like stars gets stars) (first-association ideation) | Review the one-sentence idea: is it the dictionary meaning of the name? | One true feature or user moment from the inventory ([video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) section 0.5; [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md)) |
| N20 | **Ghost decoratives**: giant words at 3-9% opacity, hairline rules, grid patterns, grain as "depth" (a renderer house style) | Sheet: faint large text or lines behind content. Source: opacity 0.03-0.09 on large text, 1 px rules, repeating gradients | None. Texture only as a surface from the capture, or hard squares born in place (M12) |
| N21 | **Label chips naming the scene** ("Messages", "Mail", "Editor") (looks informative) | Sheet: small text at x < 0.2, y < 0.14 on each UI shot | The UI shows which app it is (real icon, layout), no caption |
| N25 | **Metronome sound + self-certification**: a flat loop on a printed BPM; a README that says "VERIFIED"; a lint that says CLEAN on an empty film | Printed "BPM" in the picture; no NOTE.md; a "CLEAN" lint on a film with under 5% pixel change | One to three hand-synced hits and designed silence ([sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) section 6a); a mandatory NOTE.md that quotes the script numbers |

### Sound

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| S1 | A loop at one level on a fixed tempo for the whole film (N25) | Sections shaped around the edit; the arrangement changes at the turn; music pulled down 6-10 dB while the viewer reads | [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) 6a |
| S2 | A hit on every cut and every word | One to three hand-picked hits (the click, the name, the turn); wall-to-wall hits are a tell | [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) 6a, 7 |
| S3 | The first big sound on a bar line with no visible cause | Tie it to something visible (a click, a lift), or tie the silence to it; clear 8-15 dB before the biggest move | [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) 6a |
| S4 | Music fitted to an early cut, ending in digital silence | The score covers the whole cut; re-fit after any trim; the `look.py` audio audit shows no silent tail | [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) 6a, 8 |
| S5 | A swell over a real result | Consider no swell: the event is the climax; silence is a valid, decided choice for muted social | [sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) 6a |

### Type

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| T1 | Headline words fade in (opacity 0 -> 1) | Whole word lands on one frame, or enters from an offset (0.03-0.24 H low, or 16-32 px to the entry side) with 3-6 px blur clearing in 4-8 f; no opacity ramp | M921, M929, M958, M964, M967 |
| T2 | Headline typed letter by letter with a caret (N9). A narrative reason ("the film is about typing") is not an exception: a justified exception is still a fail | Words arrive whole, 2-5 f (0.07-0.17 s) apart on the speech rhythm; typing only for the product's own input field. Test: a caret in frames 0-2 on a headline; a typing call on a non-input element | M936, M937, M964, M967, M934 |
| T3 | Bold weight for emphasis | Weight 400-550 everywhere; bold only on a wordmark (<= 600) or one headline word; scale (4-33% H) and colour carry hierarchy | M930-M938, M962-M969, M913 |
| T4 | Title centred and held static | Phrase drifts continuously (about 7% W over 1.1 s), accelerates 2x in the last 2 f before a cut; resting position slightly off-centre (x 0.46-0.47) | M921, M947, M957 |
| T5 | Default tracking | -1.5% to -5% em at display sizes; numerals tight | M929, M930, M947, M967 |
| T6 | Re-centre surviving words when the line changes | Survivors stay put; drop leading words on single frames (1 f apart), add new words at the right | M914, M956 |
| T7 | Pure #000 text everywhere | Charcoal ink (#383837, #575756); pure black only on the hero figure or wordmark | M936-M938, M947 |
| T8 | Key word highlighted with underline, glow or a left-to-right swipe | Hard-cut selection box 4-5 f (one per word, one empty frame between), OR a hand-drawn loop on a 12 fps pose clock; never both | M930, M933 |
| T9 | A different font and colour for every beat | One family, the brand's own (a neo-grotesk only when it has none); a serif is the brand's heading voice everywhere in that role, or one deliberate second-voice line; never a lone serif-italic accent word (N12) | M913-M969 |
| T10 | Word changes identity by whole-word crossfade | Per-letter swap in ~5 f (each letter blurs and drops 0.03 H, then the new glyph rolls in) or a per-glyph flip with a fixed left anchor | M916, M973 |
| T11 | Words enter all from the same side at the same speed | Different mechanic per word inside one line (whole slide, scattered fragments, per-glyph streak), shrinking travel per word (24/18/13/13% H) | M930, M929 |
| T12 | Hero number gets a soft entrance | An arrival that decelerates from oversize (0.33 H, 0.91 W), slow shrink then accelerate with blur 0 -> 18 px; once per film, with a cause (N15) | M937, M947 |

### Motion

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| M1 | One ease-out on everything | A curve per role: entrance `softLand` / `snapSettle` (60-72% of travel in the first 4-5 f, then a 0.4-0.6 s tail); exit `accelExit` over 6-13 f; counters stepped per frame (`softInOut` only for a number tied to a control); typing stepped; no-dead-frame drift `cruise` | M913, M914, M929, M920 |
| M2 | Bounce/overshoot on every pop | No overshoot except small late `popOver` leans ([seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R1.10) and one visible spring payoff per film (+4-6%) | M948, M973, M914 |
| M3 | Items fly in from off-screen to slots | Scale in place 0 -> 1.12 -> 1.0, one frame apart; or shrink to nothing in place in 3 f | M918 |
| M4 | Uniform 0.1 s stagger; the same small slide-in (24 px, 4-6 px blur, 40-80 ms stagger) on every text (N22; a house rule of "24 px travel, hold every line 1.2 s" is this slop). Test: every entry call with the same distance and equal gaps | Uneven gaps (3,2,2,2,2,2), origin-first on a convex front; a curve per role; entries from 0.03-0.24 H offsets (M1, T1) | M933, M934, M935 |
| M5 | Held frames are frozen; hold-and-swap (each text held 1.2 s+ then replaced; 7 s on one card) (N23) | No dead frame: one living thing on every held frame (drift 1.1-1.5 px/f, dot grid 0.02 W over 2.9 s, shimmer, scrubber creep); true holds only after a payoff, 0.5-1.0 s; a designed breath (0.6-1.5 s, stated reason) before a payoff is fine. Test: `still.txt` stretches over 0.6 s | M913, M916, M932, M936 |
| M6 | Motion blur on everything (or inconsistent) | One grammar per film: crisp-step OR smear along the travel vector on frames 0-1 only (3 -> 65 px) | M913/M914 vs M916-M920 |
| M7 | A group slides as one block | Each object is its own body with its own path, rotation, bounce (0.03 H); settle, then hold 0.8-1.0 s motionless | M938, M941 |
| M8 | Smooth in-between morph between states | One-frame hard switch into ~90% of the state, then a 3-10% ease-out settle over 7-14 f | M958, M947, M962 |
| M9 | Count-up tween to a round value | One value per frame, step sizes decaying toward ~0.07, skipped values, product fields end un-round | M954, M955, M958, M923 |
| M10 | Logo scales up from zero or fades in | Enters oversized and blurred and scales DOWN (0.28 -> 0.10 W, excess halving every 2 f); or built from parts; or held large and shrunk on an exponential ease | M968, M965, M932, M959 |
| M11 | Every motion plays at full speed | The last word or event slows down for emphasis (a glyph every 3 f; a 10 f gap before the stinger word) | M921, M966 |
| M12 | A background texture fades in | Flat hard squares born in place, never moving, delayed ~0.2 s after the headline lands | M964, M967 |
| M13 | Exits are the entrance reversed | Exits are new motion: faster, accelerating, overlapping the next entrance by ~2 f | M933, M938 |

### Camera

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| C1 | Smooth ease-out zoom | One-frame snap (ratio 0.56-0.77) plus a 9-18 f tail; a 2-frame push, an ~18 f hold, an accelerating pan that ends hard | M913, M914 |
| C2 | Zoom tween between type scales | Hard scale cut in ONE frame, paired with a content jump in the same frame | M949, M964 |
| C3 | Show the full UI window | Crop one object at 1.4-4.4x; window is the camera; reveal by pull-back | M913-M919 |
| C4 | Static camera on UI | Camera never settles; parallax 2-2.4x between layers; two-phase pans | M922, M966 |
| C5 | Heavy backdrop blur (20 px+) or fading it to grey | 4 px readable, 7-15 px for non-hero panels, capped ~11 px behind a headline, headline unblurred | M918, M942, M956 |
| C6 | Camera zoom applied to text and UI separately | One camera group; type is never zoomed on its own track | M913, M919, M953 |

### Transitions

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| X1 | Opacity crossfade between scenes; dissolve or blur-swap between captions or cards (N24). Test: any frame showing two texts or two cards blended; scene-level opacity tweens | Hard cut, mid-motion, with a matched object (conditions for a fade in Part 1b) | M914-M974 |
| X2 | White flash or black dip | A growing object (0.04 W bead -> disk), a 4-frame flat-grey dip carrying the action, or a feathered wipe (0.31-0.42 of the axis, 0.56-0.6 s) painted in the next ground | M922, M916, M939 |
| X3 | Next scene starts from rest | Next scene's first frame is already moving (105-280 px on frame 1; blurred; mid-zoom), travelling along the previous vector | M914, M918, M916 |
| X4 | Last frame has nothing to do with the next first frame | Carry one object, pose, string, ground or caret across (same position within ~0.03) | M921/M922, M948/M949, M957/M958 |
| X5 | Occluded objects fade out | The new object rises and occludes them (62% of the travel in 4 f) | M916 |
| X6 | Ground colour fades or flashes | One continuous colour track 0.5-0.7 s timed to the leaving object, or hard plateaus of 0.3-0.4 s with a 1-frame gap | M926, M944 |
| X7 | Wipe as a plain edge | Wipe in the next scene's ground with a feather; or motif-as-wipe (stair edge, pixel cells, a band) | M939, M946, M965 |
| X8 | Scene change on a random frame | Cut interval constant on a beat (10 f = 0.333 s four times) or cut on peak velocity | M962, M948, M959 |

### UI and cursor

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| U1 | OS cursor with hand and I-beam swaps | Custom cursor, one family per film; either arrow-only or pose-swap (1 frame), never mixed | M914, M919, M931, M935 |
| U2 | Cursor lands at final size with a gentle ease | 1.5-5x oversize, scale about the tip, ~60% in frame 1, 0.5-0.9 s creep | M953, M956, M959 |
| U3 | Straight, constant-speed path | Curved path with heading rotation; arcs dipping 0.23 H; 2-frame steps decaying x0.72 | M914, M943, M969 |
| U4 | Hover and click on arrival | Park 2-15 f, finish zoom first, then press | M914, M919, M931 |
| U5 | Click = ripple ring | Press 2 f to 0.71-0.9; target 0.63-0.81 one frame later; hard colour step; no ring | M930, M939, M953, M956 |
| U6 | Typing at constant speed, blinking caret | Authored cadence, pauses after spaces, solid caret while typing; rate chosen by viewer task (21-24 vs 84 chars/s) | M931, M935, M949, M962 |
| U7 | Toggle with a long ease and a glow | Two frames: knob, pale frame, colour | M933, M935 |
| U8 | Cascade is a timer-regular list | 2-3 f per item, uneven gaps, <= 0.6 s total | M933, M935 |
| U9 | Spinner and "Loading..." | Per-word blur-in status, two shimmer passes, wipe, a check drawn on | M919 |
| U10 | Cards slide in from the side | Newest card inserted at the top blank, then filled; older cards pushed in jumps with one 2-frame hold | M940 |
| U11 | Phone tilted 15 deg with a drop shadow | Cropped, six held poses with visible thickness, headline behind, sparkle in front; or stepped 2D camera jumps | M955, M957 |
| U12 | Cursor lives on the UI layer and is scaled with it | Own top layer, own scale (1.5x when UI is 2.33x) | M914, M943, M969 |

### Colour

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| K1 | Accent colour on many objects | One hue, one meaning ("machine acting" or "arriving"), plus at most one signal colour (green = done); never both on one object | M913, M914, M919, M933, M967 |
| K2 | Words permanently coloured | Arrival tint for 1-6 f (24 fps) or 0.28 s linear, settling to ink | M966, M967, M973, M974 |
| K3 | Glows, nebulae, particles, gradient cards; the same floor glow under every scene (reads as a template) | Flat shapes, soft bands inside hard-edged shapes, halo only at an event (peak 35 px @40%, decays ~0.3 s). Light with a physical source (one direction, falloff, contact shadow) belongs to the world ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)); a glow as wallpaper does not | M956, M954, M946 |
| K4 | Dark to light flip by fade | Growing object, hard cut at an act boundary, or a hard plateau sequence (white, teal, cyan, white at 0.3-0.4 s each) | M922, M944 |
| K5 | Every scene on the same ground, or a different flat swatch for every scene (N4) | A surface per act (plate, screen, material, lit gradient) that flips at act boundaries by a carried object or hard cut (dark bookends, light middle, or one world per act); surface greys stay neutral; flat colour only for a flood under 1 s | M930-M932, M953-M959 |
| K6 | Colour spread evenly through the film | Monochrome until the payoff; colour used once as an event (a single demo, a final word, one halo) | M963, M962 |

### Endings

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| E1 | Fade to black | Cut mid-motion; the last 0.2 s accelerates (contraction, pan); a visible, moving last frame | M913, M914, M929, M938, M944 |
| E2 | Logo fades up and sits 2-3 s | Built from parts, shrinks continuously, cut hard to the dark name that slams from 3.5x; a short hold (0.6-1.4 s) with something alive (sway +-1% W) | M929, M932, M946 |
| E3 | Tagline plus CTA plus logo in one lockup at once | CTA words focus in place (opacity 0.12 -> 1, blur 8 -> 0, 4 f each); lockup ~0.30 W x 0.20 H in 95% empty ground | M920 |
| E4 | End by showing the click resolve | Cut at max compression / before release; end 0.11 s after arrival | M931, M959, M949 |
| E5 | End on a settled hold | End mid-motion or on a one-frame new element (empty card, capsule, word) that the next shot inherits | M962, M966, M969, M957 |
| E6 | Tagline under logo | No tagline; the mark begins at 1.5-1.9x and settles over 2.5 s | M959 |

### Timing

[measured corpus, original slop-table.md]

| # | AI default | Pro decision | Evidence |
|---|---|---|---|
| Tm1 | Beats of equal length | Beats shorten then the last lingers (1.3 / 1.07 / 0.70 / 0.43 s then a 0.6 s title); scenes get shorter, the last one lingers | M947, M929 |
| Tm2 | Words land on a metronome | Onsets on spoken words; gaps 3-5 f accelerating or 5,5,3,3; a 4-word phrase assembled in 0.7 s then held 0.5 s (~1.2 s per ~20 characters) | M936, M964, M967, M929 |
| Tm3 | Mixed frame clocks (12, 24, 30 fps steps in one moment) | One clock per moment: 12 fps for drawn items under a 24 fps camera, or 2-frame holds across everything | M934, M947-M949, M967-M969 |
| Tm4 | Every hold the same length | Reading hold 0.5-1.2 s; payoff hold 0.8-1.0 s; single number 0.5-1.2 s; a designed breath 0.6-1.5 s before a payoff; nothing else holds | M939, M945, M946 |
| Tm5 | Silence after a click or send | 3 empty frames, then the next element sweeps in along the same vector | M916, M919 |

---

## Prove it

[measured corpus, original slop-table.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
