# Tells: what makes a film look cheap, templated or generated

One line each, with its fix. Search it during every review round (`grep -n -i 'glow' TELLS.md`), and start an issue with the ID it matches (`F4: the lockup fades out on EASE.out and loses 55% in one frame`), so fixes can be traced and repeat offenders counted. Numbers are defaults at 1920×1080 and 60 fps (f = a frame).

**The brand wins.** When the user supplies a brand (its colours, typeface, logo, footage, voice), the brand beats any entry about that element. Record each exception in `brief.md` so the critic doesn't flag it. The palette and type entries below are defaults for a look you invent, not laws: a paper-and-watercolour film, Claude's own orange or a serif wordmark the brand owns are all legitimate.

## A. Concept and story
- **A1 Feature tour.** Feature, feature, feature, logo; nothing to remember. **Fix:** problem → turn → promise; run the deletion test both ways (shotlist skill).
- **A2 Wrong first frame.** "Introducing…", a question, the logo or a blank frame. **Fix:** open inside the problem; felt by 1 s, stated by 2 s.
- **A3 Borrowed props.** Rocket, lightbulb, globe with arcs, up-and-right chart, floating phone, sparkle for AI, shield for security, gears, stopwatch, confetti. **Fix:** the ownership test; build every image from the product's own objects.
- **A4 A style posing as an idea.** "Bold, kinetic, minimal, 3D." **Fix:** write idea, device and grammar first; the style follows.
- **A5 Demo without a cause, or a rushed result.** UI moves because the timeline says so, or the result leaves 11 f after it lands. **Fix:** cause → action → result, the result held ≥ 36 f + 6 f per word.
- **A6 The device drops out.** It blinks out for a few frames at a cut, or changes size or colour across a seam. **Fix:** full opacity through every seam; hand it over on a shared prop.
- **A7 Frames that contradict the promise.** A strike-through over the tagline, overlapping tiles in an "everything fits" shot, success in the error colour. **Fix:** read every key frame literally, as a paused still.
- **A8 A dead or recycled end card.** It replays the mid-film reveal, sits static for 2.7 s, fades to black, or the last frame shows no brand. **Fix:** the device becomes the mark; a 1.5-2 s hold that builds 10-20%; the final frame is the poster.
- **A9 An oversimplified feature.** The film is just as true of a dumber product (an even split for an itemised one, a list for a ranking). **Fix:** the specificity test; show the non-obvious behaviour.
- **A10 An anonymous product.** A clever behaviour on floating cards that a stranger can't name. **Fix:** the feature's name once (a UI label, the one line or the end card) and enough real app chrome to read as software.
- **A11 An end card without the brief's fact.** The brief says "out now", a date or a URL, and the film ends on the name alone. **Fix:** that fact at the secondary size under the lockup, readable ≥ 1.7 s.

## B. Copy
- **B1 Landing-page grammar.** Eyebrow or kicker labels above a headline ("NEW FEATURE", "01 / SPEED"), stacked taglines, all-caps micro labels. **Fix:** delete them; hierarchy comes from size and order of appearance.
- **B2 Stock phrasing.** Seamless, unlock, supercharge, AI-powered, next-gen, "the future of", exclamation marks, rhetorical questions. **Fix:** callback copy from the film's own words; statements end in a period.
- **B3 A feature name as a headline.** "Smart Split." **Fix:** say what changes for the viewer in ≤ 5 words.
- **B4 Text wall.** Two statements readable at once; a list with blurred neighbours. **Fix:** one line at a time.
- **B5 Over budget.** More than 35 words per 30 s, more than 5 words per line, more than 2 lines per shot. **Fix:** cut adjectives first, then whole lines.
- **B6 Microcopy asked to carry meaning.** A 14-16 px toast readable for 6 f. **Fix:** ≥ 22 px on screen and held for its reading time, or treat it as texture that carries nothing.
- **B7 Proofing bugs.** "1 clashes", mixed brand casing, straight quotes, lorem, "John Doe", example domains, filler text (fake metrics, decorative mono captions, version strings). **Fix:** a plural helper and a string audit; every word counted, held and true on its paused frame.

## C. Type
- **C1 Generated-look faces.** A condensed display face for "impact", serif or italic reached for as instant "elegance" when nobody chose it. **Fix:** one family chosen for the brand's personality; emphasis from size, weight contrast or motion.
- **C2 An unchosen default, or a fallback.** A ubiquitous UI default picked by nobody, or a fallback face visible on any frame. **Fix:** choose the family on purpose and vendor it (`add-font.mjs`); wait for `document.fonts.ready`. The monoculture to question: Inter, Roboto, Open Sans, Lato, Nunito, Poppins, Outfit, Sora, Syne (the most overused "distinctive" display face), Playfair Display, Cormorant Garamond, Bodoni Moda, EB Garamond, Cinzel. A brand that owns one keeps it.
- **C3 Near-miss tokens.** Display weights 590, 600 and 620, or tracking −0.04, −0.05 and −0.06, across scenes. **Fix:** one token per role, reused everywhere.
- **C4 Flat scale.** Everything at 48-64 px. **Fix:** statements 88-128 px, emphasis 1.5-1.7× that, headline to secondary ≥ 2:1.
- **C5 Faux italics from 3D shear.** Roll applied inside a tilt leans all UI text. **Fix:** `perspective() rotateZ() rotateX()` so the roll stays rigid; total shear ≤ 7°.
- **C6 Glyph collisions.** Overshoot closes a word space ("Everythingfits"), a period hangs under the baseline, a cover leaks glyph tops. **Fix:** clamp springs at the lock; pad covers by 8 px.
- **C7 Blur-dissolve on every word.** Or readable text left blurred for more than 6 f. **Fix:** blur only on entry, cleared by 60% of the move; land sharp.
- **C8 Jittering numbers.** Counters whose width changes. **Fix:** tabular figures; digits roll 6-8 f each.
- **C9 Letter gimmicks.** Typewriter headlines, per-letter bounce, scramble effects, wide-tracked titles at rest. **Fix:** word-level reveals; per-letter motion only for the one hero word.
- **C11 Near-twin pairs.** Two geometric sans, two transitional serifs, two humanist sans on one frame: friction without hierarchy. **Fix:** one family, or cross a boundary (serif with sans, sans with mono), with weight contrast visible in motion (300 against 900, not 400 against 700).
- **C12 Light type on dark set like dark on light.** Light text on a dark ground reads heavier and tighter. **Fix:** body one step lighter (350 for 400), line height +0.05-0.1, display tracking +0.01 em.
- **C10 A reveal that misspells.** A sweep passes through another word, or a half-drawn glyph reads as another letter (the left half of an "n" is an "r"). **Fix:** reveal names by whole word or mask; check every intermediate frame.

## D. Colour and surface
- **D1 Generated gradients.** Indigo or violet → blue, rainbow multi-hue, mesh blobs, aurora washes, gradient text. **Fix:** one flat accent with a written meaning; stages are tonal fields in one hue.
- **D2 Neon on black.** A very bright, saturated accent glowing on an ink stage. **Fix:** lower the lightness or chroma; the accent is a signal, not a light source.
- **D3 Beige by default.** A cream ground with a terracotta accent because it "feels warm", not because the brand chose it. **Fix:** derive the stage from the brand's world; warm only when it is the brand's.
- **D4 Glass and glow.** Backdrop blur with a 10-20% white fill and a 1 px white border; glows, halos, bloom, outer glow on text. **Fix:** on paper one soft shadow (`0 28px 90px rgba(0,0,0,.16)`); on ink a luminance step plus a 1 px top hairline at 8-12% white.
- **D5 An accent without a meaning.** Used everywhere, for two opposite meanings, or two near-identical reds in the code. **Fix:** one token, one meaning, ≤ 8% of pixels, one flood per film.
- **D6 Filler decoration.** Particles, bokeh, starfields, code rain, ghost text at 3-8%, grain that changes per scene. **Fix:** every element names its job (reveal, route, validate, emphasise) or is cut; grain none, or global 1.5-2%.
- **D7 Muddy washes.** A white radial wash turns ink cards into grey buttons. **Fix:** ink stays ink; veil only where type sits.
- **D8 Pure black holes.** Full-frame `#000` that crushes under encoding. **Fix:** ink one step off black, lightly tinted toward the accent.
- **D9 House-style convergence.** The starter's look kept because it was there. **Fix:** three brand adjectives → family, stage, accent, shapes (video-brief skill).
- **D10 A default palette.** Framework blue (`#3B82F6` / `#2563EB`) on flat greys, pure black and white. **Fix:** derive stage, neutrals and accent from the world of the name and product; tint the greys.
- **D11 A colourless film.** A mid-film frame at thumbnail size shows no brand colour. **Fix:** the accent visibly marks the key beats; check a frame at 480 px.
- **D12 A mark that misreads.** At 64 px for half a second it reads as a minus, plus, emoticon, menu, padlock or play button. **Fix:** change the geometry (an asymmetric break usually fixes a symmetric symbol).
- **D13 Haze behind the hero.** Soft colour pools behind a product window or a line of type. **Fix:** a flat stage with one tonal step.
- **D14 The stock tech palette.** Cool grey paper, navy ink, teal or framework-blue accent: correct and anonymous. **Fix:** tint the stage from the brand's world.
- **D15 Stacked effects.** Bloom, chromatic aberration, grain, vignette, scanlines and shake all on by default. **Fix:** one or two, each explaining energy, impact, speed, damage or place.

## E. Layout and framing
- **E1 The SaaS layout.** Text left, UI card right on white, or everything centred and floating. **Fix:** the product full-bleed, type on an eye line or the lower third, one focal action per shot.
- **E2 Voids and edge bands.** 20% of the frame empty under the product, a dark window edge at the border. **Fix:** clamp the camera so the product covers the frame; overscan moving layers 5-8%.
- **E3 No margins.** Under 96 px at the sides or 64 px top and bottom at 1080p, or under 24 px of headroom at maximum punch. **Fix:** check the safe area on the punch frame.
- **E4 Crops that slice glyphs.** "aft", ":00", text cut by a card edge moving across it. **Fix:** crop on gutters; reveal text only after the edge has passed.
- **E5 Cropped social versions.** A 9:16 cut out of the 16:9 master. **Fix:** re-lay out from the same timeline.
- **E6 A lockup lost in a void.** The lockup spans under a quarter of the width. **Fix:** 28-45% of the frame width at its resolved size.
- **E7 A small card in empty space.** The product as a floating card whose type is unreadable on a phone. **Fix:** full-bleed, or push in until the working part fills the frame.
- **E8 An empty vertical frame.** A 9:16 frame laid out like a wide one, the bottom 40% bare. **Fix:** content's mass in the middle of the safe band; type 1.3-1.5× its 16:9 size.
- **E9 Lopsided grids and lost logos.** Unequal cards or gaps in a grid read as a mistake; a logo floating small in a big box looks wrong. **Fix:** equal sizes and gaps; logos fill their card, from the real files.

## F. Motion and easing
- **F1 The default entrance.** Everything fades in, or rises 30 px with opacity. **Fix:** one reveal system per role, with physical entrances (a mask, a birth from a gap, a morph).
- **F2 Uniform timing.** Every move 0.4-0.5 s on one curve. **Fix:** duration grows with distance (`durFor`); the slowest move ≥ 3× the fastest; about 3 easing characters per film.
- **F3 Bounce everywhere.** Back-out, elastic, overshoot on every card. **Fix:** critical damping by default; 1-7% overshoot only on a true landing, at most 2 per film.
- **F4 Easing the wrong way.** Ease-in entrances, ease-out exits, an ease-out fade-out that pops 55% in one frame. **Fix:** entrances decay, exits accelerate; fades 10-14 f on `EASE.smooth`.
- **F5 Half-sine punches.** A pulse on a hard window: velocity clunks at both ends and a late peak. **Fix:** `hitPulse` for every punch and tick.
- **F6 Linear zooms and walls.** Scale lerped linearly; a camera that stops dead. **Fix:** `lmix` for scale; `EASE.rest` for moves that end at rest.
- **F7 Stall, then lurch.** Two moves ease to rest, then the next starts at speed. **Fix:** overlap consecutive moves by ~20 f, the second on a zero-slope curve. The smoke test's `stalls` counter catches the one-frame version.
- **F8 Everything moving at once.** Idle bobbing, pulsing badges, an ambient zoom on every scene. **Fix:** one hero motion plus ≤ 2 supporting ones; stillness after motion is a tool.
- **F9 Batch landings.** 6-7 objects hitting on the same frame. **Fix:** stagger 0-3 f within the group, the first on the beat.
- **F10 Shape snaps.** The aspect ratio flips in the last 1-2 frames because one ease drove size and position. **Fix:** shape settles 6 f before position; land with a contact squash.
- **F11 The same device everywhere.** One reveal, one transition or one camera move repeated unvaried from scene to scene. **Fix:** a ledger of devices; vary direction, size or period on every reuse, checked in frames.
- **F12 Motion that contradicts the words.** "Breaking through" on a gentle fade, calm copy on a panic snap. **Fix:** direction, speed and rhythm agree with the line and the music (`KINETIC-TYPE.md`).

## G. Transitions
- **G1 Crossfade by default.** Or two misregistered outlines double-exposed. **Fix:** morph the container or clip it; only one outline ever exists.
- **G2 Presets and repeats.** Glitch, RGB split, light leak, film burn, swirl, ripple, dreamy zoom, flash to white; the same iris three times. **Fix:** 6-8 motivated types, each ≤ 2 uses, plus one signature move used at the open, middle and close.
- **G3 A pop where a move was meant.** A lockup gone in 2 f. **Fix:** exit by reversing the entrance, or cut deliberately on the beat.
- **G4 Velocity mismatch at a cut.** **Fix:** the outgoing shot accelerates ×1.14 per frame over its last 10-24 f, the cut lands at peak velocity, the incoming shot decays ×0.92 per frame.
- **G5 Seam stutter and dips.** A duplicated frame at a seam (stop, hold, go), or a crossfade through black that dips ~25% in luminance. **Fix:** show the rest pose once; carry luminance flips on a moving shape.
- **G6 Exit, gap, entrance.** The old element leaves, the frame sits empty, the new one starts: two edits with a hole. Or a collapse that stops short and leaves a smudge, or a whole-scene slide as the exit. **Fix:** the outgoing converges to zero where the incoming grows from; elements exit in their own voice; something of the next scene on screen within ~2 frames of the cut.

## H. Camera
- **H1 Floating screenshots.** Tilted screenshot cards in a void, a device orbiting nothing. **Fix:** real 3D on real components, perspective 1800-2600 px, one camera axis per act.
- **H2 Locked-off shots.** Nothing changes for more than 1.5 s. **Fix:** a 2-3%/s push plus ~16 px of drift with parallax.
- **H3 Invisible drift.** 1 → 1.05 over 2 s on a logo reads as dead. **Fix:** keep a still logo hold short, or push 10-20% over a longer one.
- **H4 Strobing fast moves.** Unblurred motion above 20 px/f. **Fix:** render with sub-frames (`--sub 4`, 8 for whips), or give the page `speed(t, dt)` so each frame gets as many as its motion needs (up to 40).
- **H5 Moves too fast to blur.** An element crossing 150+ px in a frame: blur turns it into a smear with stepped copies. **Fix:** keep any element under ~60-80 px/f; redesign faster moves as a cut on the beat, a match cut or a mask wipe.

## I. UI depiction
- **I1 Generic or pictured UI.** Fake KPIs, up-and-right charts, random numbers, stock icons, a screenshot zoomed until soft. **Fix:** the product's own surfaces with named data from one module.
- **I2 Data that disagrees.** A date on the wrong weekday, stale labels after a move, a counter saying 7 over 12 items, the product replanning the past. **Fix:** derive every label from the data and assert it (seek-engine techniques).
- **I3 State that doesn't count.** A counter frozen during the action, then flipped in one frame. **Fix:** change on each visible event's landing frame, on whole frames (`whole(t)`).
- **I4 Z-order bugs.** A badge bitten by the next avatar, a lifted card drawn under a grounded one. **Fix:** paint sorted by z; badges get a 2 px ring in the background colour.
- **I5 Input no real app has.** A caret floating far from the text, a chip whose weight animates and reflows the line. **Fix:** padding grows with the reveal; weight stays constant.
- **I6 A robotic cursor.** Straight paths at constant speed, a parked cursor, a cursor on a product that acts alone. **Fix:** arc 15-25% of the path, ≤ 1 click per 30 f, no cursor once the product is autonomous.
- **I7 Story and data disagree.** The person who paid shown owing; a ratio that doesn't match the numbers beside it. **Fix:** assert the story's facts in the data.
- **I8 Text covered by a moving element.** A chip slides over a label the viewer is reading. **Fix:** route paths through gutters, or paint the text above the mover.
- **I9 UI that adds claims.** A widget or mock screen shows a button label, a clock time or a number nobody approved. **Fix:** placeholder text is plain grey lines; any UI word not in the brief's facts goes back to the user for approval.
- **I10 A rebuilt screen in the generic web style.** When a screen is rebuilt rather than captured: every item in its own rounded card, an icon in a tinted circle on every row, pills and big radii on controls that aren't capsules, a shadow under every surface, a purple or blue accent on headings, icons and buttons alike, a gradient primary button, tiny low-contrast grey metadata. **Fix:** rebuild from the product's own tokens and components; with none, group by spacing and dividers and keep a card only for an item that is selected, moved or opened in the film, scale the radius with the component's size, let neutrals and type weight carry the hierarchy (it should still read with colour and effects turned off), spend the accent only on the action, the selection and the status, and lift a surface only when it is an overlay or the thing being dragged.

## J. Sound (details in the sound-pass skill)
- **J1 Library sound on everything.** A whoosh on every cut, risers into everything. **Fix:** about 2 whooshes a film, on camera-scale moves; the music carries the cuts.
- **J2 Out of lock.** Audio leading picture by more than 45 ms, impacts on the settle instead of the contact, partial coverage of a sounded action. **Fix:** cues computed from the picture; impacts on the contact frame.
- **J3 Masked effects.** Effects buried under the music in their own band. **Fix:** ≥ +6 dB over the music in their band; duck the music briefly around key hits.
- **J5 The wrong ending.** Clicks at the end, an ending cut mid-note, the logo slam as the loudest moment. **Fix:** the ending subtracts; digital silence at the last sample.
- **J6 Typing rattle.** Bright clicks on every typed character fusing into a buzz. **Fix:** thin to ~12 keys/s, dark short keys, or one blip per word.
- **J8 A flat mix.** Loudness range under 5 LU on a film of 20 s or more. **Fix:** thin out before the turn, true silence before the drop.
- **J9 A soft hook.** The soundtrack fades in over the first bar. **Fix:** a sound with a visible cause on frame 0.

## K. Pacing
- **K1 Weak hook.** 1-2 s of near-blank frame. **Fix:** frame 0 composed and moving; something visibly changes about every 0.5 s. The smoke test's `slow hook` counter catches it.
- **K2 Dead holds.** More than 48 f with no visible life. **Fix:** every hold builds; a designed freeze is ≤ 15 f and sits on a silence.
- **K3 Cramming.** 17 scenes in 32 s, or 3 features in 5 s. **Fix:** 8-10 story beats per 30 s and 1-2 capabilities.
- **K4 Flat energy.** A middle 10× calmer than the rest, or peaks with no calm between them. **Fix:** one motion peak per bar with 30-70 f of calm between; the first 6 s about 2× as dense as the middle.
- **K5 Off-grid timing.** Cuts and hits that ignore the music. **Fix:** a beat grid; section changes on downbeats, cuts on 8ths.
- **K6 Reads that are too short.** 13 words in 0.76 s, a URL static for 0.23 s. **Fix:** every line meets [the canonical reading floor](SKILL.md#the-loop), counted from when it is fully legible (a typed line from when typing starts); a line that must land on its own gets [the comprehension target](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/KINETIC-TYPE.md#reading-time-is-arithmetic); the smoke test's `short reads` counter catches the floor.

## L. Finishing
- **L1 Pops and ghost frames.** Single-frame pops, or stale frames from `will-change` on a layer with an animated blur. **Fix:** never promote a layer with blur animating inside it; the smoke test's pop and determinism counters catch both.
- **L2 Stepped blur ramps.** An animated CSS blur on a large layer jumps from sharp to soft in one frame. **Fix:** cross-fade a sharp copy and a constant-blur copy.
- **L3 Pixel-snap stairs.** Slow moves stepping in whole pixels (a fractional left/top plus a transform). **Fix:** all translation inside one transform.
- **L4 Hairline crawl.** Strokes under 1.5 px or gaps under 8 units crawling under scale. **Fix:** thicker strokes, wider gaps, fade hairlines at small scale.
- **L5 Banding.** A CSS gradient spanning fewer than ~30 code values shows rings. **Fix:** a dithered PNG from `gradient.py`.
- **L6 Bad motion blur.** Stamped copies of text, blur smeared across a cut, double carets. **Fix:** discrete state on whole frames (`whole(t)`); hard cuts declared in `cuts()` so blur never crosses them.
- **L7 Sloppy delivery.** Untagged colour, a late soundtrack, peaks over −1 dBTP after AAC. **Fix:** the renderer's BT.709 tags; `check_sync.py` on the delivered file.
- **L8 3D render defects.** Z-fighting (two surfaces flickering through each other), inverted normals (faces dark or missing), the wrong colour space (washed-out or muddy textures), texture seams, shadow acne (striped self-shadowing), transparent objects popping in front of or behind each other, a camera that shows the edge of the world. **Fix:** check the brightest, darkest and busiest frames in a strip; separate coplanar surfaces, fix the normals, set colour spaces as in DEPTH-AND-FOOTAGE.md, add shadow bias, set `renderOrder` on transparent layers, and frame the world's edges out.
  The usual code causes [React Doctor, improve-threejs], checked against threejs.org/docs: z-fighting is coplanar geometry needing `polygonOffset` (with `polygonOffsetFactor` and `polygonOffsetUnits`, all off or `0` by default) or a position nudge, or a near plane set far too small for the scene scale; acne is `shadow.bias` (tiny steps, "in the order of `0.0001`") or `shadow.normalBias` untuned, where `normalBias` helps "where light shines onto geometry at a shallow angle" at the cost that "shadows may appear distorted"; transparency glitches on large transparent meshes take `depthWrite: false` (default `true`), a manual `renderOrder` or a split into smaller meshes, and cut-outs take `alphaTest` (for example 0.5).
- **L9 3D frames that fail the rest of the rubric** [React Doctor, improve-threejs]. "A row fails only when the evidence shows the failure condition." Render sanity: "Black canvas, WebGL context errors, or content that never appears". Camera: "Subject leaves frame, camera clips into geometry, or foreground blocks the play area". Scale and contact: "Objects float above, sink into, or intersect their support surface, or sit at implausible scale". Image stability, on a slow pan: "Silhouettes, thin geometry, or highlights that crawl, sparkle, or ghost". Materials: "reflective metals with no environment to reflect". **Fix:** for metals, set `scene.environment` (MeshStandardMaterial: "for best results you should always specify an environment map", https://threejs.org/docs/pages/MeshStandardMaterial.html); for crawl, raise texture `anisotropy` (default 1, the maximum from `renderer.capabilities.getMaxAnisotropy()`), turn antialiasing on (`antialias` is `false` by default in plain three.js) and thicken thin forms (L4); for contact, rest the object on its support and add the contact shadow (DEPTH-AND-FOOTAGE.md).
