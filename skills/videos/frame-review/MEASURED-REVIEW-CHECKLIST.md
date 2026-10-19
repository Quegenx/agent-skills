# Slop: frame-review checklist

[measured corpus, original slop-review.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, captured-identity view; asset-prep, SKILL.md#working-inside-an-existing-product-repo] This source asks for real captured sender/time/content identity. The current repo instead requires clearly synthetic, demo-safe customer values and forbids personal, test-user or production information on screen. Preserve product geometry and approved copy; the [existing privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#working-inside-an-existing-product-repo) governs customer identity.

Originally split from [slop.md](MEASURED-REVIEW.md) to keep each file under the size cap. Part 2 (the frame-review checklist and its gates)

## Part 2. Frame-review checklist: look honestly, then run the gates

[measured corpus, original slop-review.md]

### How to see (do this first, before any checklist)

[measured corpus, original slop-review.md]

A self-ticked checklist is exactly what once certified a black film, so Part 2 starts with plain looking, in this order:

1. **Is there actually a film in this file?** (G0.) Non-blank, the picture moves, the length is what you planned, audio is present if planned. The script prints the numbers; read them.
2. **Is there one frame worth a screenshot?** If you cannot point to it, the hero moment ([shotlist MEASURED-DIRECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-DIRECTION.md) section 4 item 9) is missing.
3. **Describe every sheet frame in one sentence.** For each frame of `look/sheet.jpg`: what is on screen, what is the hero, and would it pass as a slide or a web page? Write the sentences down (they go in NOTE.md). A frame you cannot describe in one sentence has no hero; a sentence that starts "a card on a flat colour" is a deck frame.
4. **Four looks at the same footage.**
   - *Thumbnail:* the sheet at thumbnail size. Can you read the claim? Does anything read at all?
   - *Cover:* cover the logo (is it another brand's film?), then cover the text (does each frame still show a picture?).
   - *Mid-change:* `mid.jpg` and `strips.jpg`, the frames two before every cut and mid-transition. Two half-states blended? A blank frame? A beat that settled before the cut?
   - *Real speed:* watch it once at speed (or step through a beat in real time). Reading time, the hold before the payoff, where the film breathes and where it drags.
5. **Fix in this order:** anything untrue or broken; the idea and what the viewer must understand; the connections between beats; hierarchy and scale; timing; surface and finish; sound polish. Do not tune easing curves while the idea is unclear.
6. **Never certify your own film as good.** NOTE.md lists what you checked and quotes the script numbers; it does not say "verified".

### 0. Gates G0-G5 (run first; each is a pass/fail, a FAIL is fixed, never JUSTIFIED away)

[measured corpus, original slop-review.md]

Each gate names what computes it: `look.py` prints G0, G2 and G3 in its GATES block (also `look/gates.json`; `--strict` exits 3 on any FAIL); `chrome_lint.mjs` prints G5; G1 and G4 have no script, so judge them on the sheet and stills and say so in NOTE.md; never estimate a number. Same table in SKILL.md and [seek-engine measured/README.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md#their-tools-in-this-skill-set) (flags there).

| Gate | Pass when | Computed by | Where to look / fix |
|---|---|---|---|
| **G0** Render exists | The file is non-blank, the picture moves, its length matches the plan, audio is present when planned (and the score covers the whole cut: no silent tail) | `look.py --expect S --expect-audio` (GATES block + audio audit) | If it fails there is no film to review: fix the render first |
| **G1** Proof readable | The one readable UI object has text >= 0.04 H and the fragment fills >= 0.55 W (or is deliberately cropped by the frame edge), lit and sitting in a world, magnified by the camera. A small card (~0.3 W, text ~0.03 H) floating in an empty ground FAILS unless it is a deliberate wide establishing shot under 1 s before a push-in | By eye on `look/sheet.jpg` and the stills, with your own numbers (measure the card width and the height of the smallest line you need); no script computes it | The proof beat's stills at thumbnail size: can you read the text? Fix: push in with the camera, crop to the frame edge, or cut the text. Never answer "it is brand-true to the capture" |
| **G2** No empty frame | Every frame has content; the only allowed blank is <= 3 frames inside a dive or zoom-through | `look.py` (empty-frame check) | `mid.jpg`, `strips.jpg`, stills at cut-3..cut+3 and after every dive: ~0.2 s of plain ground between a dive and the next scene FAILS. Fix: put the next scene's first object on screen before the dive ends; overlap entrance and exit by ~2 f |
| **G3** End card short | End hold (the picture unchanged at the end, lockup landed -> last frame) <= 1.4 s, i.e. a resolved hold of 0.6-1.4 s (under 0.6 s is a NOTE: it ends mid-motion, fine when intended); CTA beat <= 25 % of the film | `look.py` (G3 line: end hold against `--hold-warn 1.4`; final shot = last cut to end, as the CTA share) | Cut the hold; if the film is too short add a proof beat, never logo time. A slow contraction does not make a long hold acceptable |
| **G4** One hero per frame | Two panels in one frame only if one is >= 2x the other's area or the camera moves between them; otherwise one object per frame | By eye on the sheet (count the panels in every proof frame and compare areas); no script computes it | Cut or move the camera between the objects; shrink the second to a supporting texture |
| **G5** No page chrome | No corner or edge labels (C1), tracked-caps labels (C2), "0N /" counters (C3), timecodes/metadata (C4), header/footer bars (C6), kicker above a headline (C7), left-aligned headline block at x < 0.2 with right-side media (D1), progress bars (P1), letter-typed headlines (T1), vibe-coded UI cards (V1-V5); C5, V3 and V4 are warnings ([shotlist MEASURED-COMPOSITION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-COMPOSITION.md) section 0) | `chrome_lint.mjs <index.html>` (`GATE G5: FAIL` = exit 1; text inside UI surfaces is exempt from the chrome rules) | The report lists each hit with time and selector. Delete the element; never "justify" it. Also check the outer 12% band of every sheet frame by eye: the lint cannot see text baked into images or canvas |

Inputs for the rest of this part: (a) `look/sheet.jpg` (16 evenly spaced frames with timecodes; `--frames` for more), (b) `look/mid.jpg` (the frame 2 f before each detected cut, max 12) plus frame 0 and the last frame; for cut-1, cut and cut+1 render stills at the times in `look/cuts.txt` with `render.mjs --still`, (c) `look/still.txt` (stretches of at least `--freeze-min` s, default 0.6 s = 18 f, where the picture does not change), (d) the composition source for grep, (e) the `look.py` motion and audio notes. Thresholds are working tolerances taken from the numbers in the other files (practice where not cited), for 30 fps; scale by fps/30 otherwise.

### 0b. Notice-it checks on the picture (questions, not gates; answer each in a sentence)

[measured corpus, original slop-review.md]

| # | Question | Pass when | Where to look | Fix |
|---|---|---|---|---|
| W1 | Is it a slide? | With the text covered every frame still shows a picture; at most 3 flat grounds in the film; every shot over 1 s has a surface from the capture or a built world | Cover-the-text pass over `look/sheet.jpg` | Rebuild the shot from the brand's media or product screen, not a card on a swatch ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)) |
| W2 | Is the ground made of something? | Each act's ground names its source (capture file, material, lit surface) and has light or texture unless the brand is genuinely flat | Storyboard header vs the sheet | Add the surface; flat colour only for a flood or dive under 1 s |
| W3 | Does the proof have identity? | The UI shows a real icon, sender, time and sentence from the capture; no generic card, no invented names or numbers | Proof stills vs `brand/screens/` | Rebuild from the real screen ([video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) section 3) |
| W4 | Is the capture used? | Photos, screens and the signature graphic in `brand/media` and `brand/screens` appear in the film (all unused is a FAIL of the capture) | Grep `index.html` for the file names | Use them as grounds and proof |
| W5 | Could this be another brand's film? | Swap the logo and colours: the film stops working | One sentence in NOTE.md | Return to [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md); the idea came from the category |
| W6 | Where is the screenshot-worthy frame? | One frame is named, and it is the hardest-worked one | The hero moment in the storyboard vs the sheet | Spend the ambition there ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)) |
| W7 | Decided or reached for? | Each item of Part 0 is either absent or justified in one sentence for this brand | The twelve reaches | Remove what you cannot justify |
| W8 | Is emptiness doing a job? | Any frame that is mostly empty is a breath before a payoff or isolation after a matched cut, under ~1.5 s | Frames flagged by `look.py` | Fill the world or cut the stretch |
| W9 | Does the film breathe? | `look.py`'s motion note: mean luma motion near the human band (median 6.8, IQR 4.4-9.8); if above ~10, is there a breath anywhere? if below ~3, does the film exist? | `look.py` motion note | A question, not a gate: answer it in NOTE.md |

### A. Cuts and transitions

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| A1 | Any opacity crossfade between scenes? | No frame shows two scenes blended. Allowed: one 1-frame 50% double exposure per film; a 4-frame flat-grey dip that carries an action; a feathered wipe (>= 0.3 of the axis) in the next ground | Contact sheet, every cut-1 and cut frame; grep source for scene-level `opacity` tweens | Replace with a hard cut on a frame where something is moving; add a carried object (A4) |
| A2 | Does each cut land mid-motion? | At cut-2 vs cut-1, at least one major object moves >= 0.01 W (or scales >= 3%, or is blurred) | The pre-cut frames side by side | Shorten the hold before the cut; start the exit acceleration 4-6 f earlier; add a lean-out (drift 2x in the last 2 f) |
| A3 | Does the first frame after a cut already move? | Frame cut and cut+1 differ by >= 0.02 W of displacement or are blurred | First two frames after each cut | Start the next scene's object 60-100 px into its travel; blur on frame 0-1 only if the film uses smear |
| A4 | Does beat N's last frame share an object or pose with beat N+1's first? | At least one of: an object within 0.03 of the same position, the same ground colour, the same text string, the same cursor | Last frame of N next to first frame of N+1 | Carry a caret, headline, card, dot or colour across; or relocate N+1's layout to the end layout of N |
| A5 | Any white flash or black dip between scenes? | No frame is flat white/black unless it is the CTA slam or a deliberate 1-frame black before a build | Contact sheet; luminance of cut frames | Replace with a growing object, a wipe, or a plateau sequence |
| A6 | Dead air at a cut | <= 3 empty frames (M916 uses 3); 0 when the scenes are matched | Frames cut-3..cut+3 | Overlap the entrance with the exit by ~2 f |
| A7 | Ground changes by fade? | Ground colour changes by one continuous colour track timed to something leaving (0.5-0.7 s) or by a hard plateau | Contact sheet colour drift | Re-time the ramp to the leaving object, or step it |

### B. Motion and stillness

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| B1 | Any frame where nothing moves for > 0.6 s (18 f) outside a payoff hold or a designed breath? | The still-stretch report shows no run > 18 f except a designed breath (0.6-1.5 s, stated reason, before a payoff, with one living thing on it); payoff holds (readable list, number) <= 1.0 s (hero 1.2 s); the resolved end card <= 1.4 s (gate G3) and has something alive | Still-stretch report | Add drift (1.1-1.5 px/f along one axis), a slow shrink (0.82 per 0.6 s), a scrubber/caret/shimmer, a ground drift; or cut the hold |
| B2 | Overshoot used more than once? | At most one visible spring per film (about +4-6%), at the payoff; elsewhere only small late `popOver` leans ([seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) R1.10) | grep source for `back`, `elastic`, `spring`, `overshoot`; watch scale curves | Replace others with a plain ease-out; keep the best one |
| B3 | Does every entrance decelerate and every exit accelerate? | Entrances do 60-72% of travel in the first 4-5 f; exits speed up over 6-10 f | Three consecutive frames of one entrance and one exit | Swap ease curves per role (M1; [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) section 2.1); never reuse one global ease |
| B4 | Is the whole piece one easing family? | At least four distinct curve roles are present (entrance, exit, counter, drift, stepped) | grep the ease names | Re-assign per role; counters stepped per frame, typing stepped, drift `cruise` |
| B5 | Do all staggers use uniform gaps? | Gaps vary (e.g. 3,2,2,2,2,2) and the largest gap is before the key word | Onset list from the source | Hand-author the gap list; lengthen the gap before the stinger by 3-4 f |
| B6 | Blur/smear grammar consistent? | Either no smear anywhere or smear on entering/leaving frames 0-1 everywhere (not mixed by scene) | Contact sheet for blurred frames | Remove smear from the minority scenes or add it to all |
| B7 | More than one clock? | One step rate per moment (all stepped on 2s, or all smooth); drawn items may be 12 fps under a 24 fps camera by design | Consecutive-frame diff in drawn vs camera layers | Align the step rates |

### C. Type

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| C1 | Any bold weight outside the wordmark? | Computed weight <= 550 for body/headline; <= 650 on one headline word at most; wordmark <= 600 | grep `font-weight`; zoom on stroke thickness | Set to 400-550 and use scale/colour for hierarchy |
| C2 | Is headline type letter-typed (with any narrative reason)? | Headline words appear whole across consecutive frames; letters appear one at a time only inside the product's own input field. A justified exception is still a fail | 4-6 consecutive frames of each headline entrance | Replace with whole-word entrances 2-5 f apart; keep typing for the prompt field only |
| C3 | Any headline entrance by opacity fade alone? | Entrances use offset + blur clearing in 4-8 f, or a 1-frame hard cut | grep `opacity` on text; consecutive frames of one entrance | Add 0.03-0.24 H offset and 3-6 px blur; drop the opacity ramp |
| C4 | Is headline type 7% H or larger (UI prompt >= 4%, annotation >= 1.3%)? | Each headline >= 7% H (supporting phrase >= 5%); hero figures 22-29% H (thesis word 33%); UI text that must be read >= 4% H | Contact sheet at thumbnail size: can you read it? | Raise the size or crop the UI (ui-demo 1.1) |
| C5 | Word replacement re-centres? | Surviving words do not move when others leave | Frames around a phrase swap | Stop re-centring; vanish leading words 1 f apart |
| C6 | Is any word tracked at default 0? | Display tracking -1.5% to -5% em | grep `letter-spacing` | Tighten |
| C7 | Black text everywhere? | Charcoal for statements; pure black only on hero figure or wordmark | Colour sample on type | Re-ink |
| C8 | Does a key word do something? | The one or two words that matter act out their meaning ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) section 0.1) and the copy sounds like the brand, with none of the copy tells ([shotlist MEASURED-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/MEASURED-TYPOGRAPHY.md) section 0.3) | Read every line out loud; the sheet | Rewrite the line or give the word an action |

### D. Colour

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| D1 | More than one accent meaning? | At most one hue for "arriving/machine acting" plus at most one signal (green = done); no object carries both | Contact sheet: list every non-neutral hue and its job | Collapse to one hue; re-assign or remove the rest |
| D2 | Do tints persist on text? | Arrival tints decay to ink within 1-6 f at 24 fps / 6 f at 30 / 0.28 s at 60 | Frames 6-10 after a word lands | Tween the tint to ink |
| D3 | Glows, particles, gradient cards, stock shadows? | None except a halo at an event (peak ~35 px blur, decays within 0.3 s) and a faint (<= 12%) card shadow | Contact sheet | Flatten; keep one halo per event |
| D4 | Does dark/light change by fade or flash? | Hard cut at an act boundary, a growing object, or hard plateaus | Cut frames | Replace |

### E. Camera, density, UI

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| E1 | UI shown full-window with chrome? | No title bar, URL, traffic lights or bezel; the largest UI object occupies <= 0.76 W (and the readable one >= 0.55 W, gate G1); text in it >= 4% H or deliberately texture | Contact sheet; grep for window chrome elements | Crop to one object at 1.4-4.4x; hide the chrome; reveal by pull-back |
| E2 | More than 3 elements competing for attention? | <= 3 focal groups per frame (type counts as one; UI card as one; cursor as one); the rest are texture/defocused | Every thumbnail: count focal groups | Defocus (4-11 px), stagger, or delete one |
| E3 | Camera moved as a single group? | UI parts never zoom independently | Source: how many transforms scale; frames during a zoom | Reparent everything to one camera group |
| E4 | Backdrop UI blur | Backdrop blur <= 11 px behind a headline; headline sharp | Frames during rack focus | Reduce blur; darken ~0.1 instead |
| E5 | Frame 0 populated? | Frame 0 already contains the hook object or is moving | Frame 0 | Start in motion; remove blank intros |
| E6 | Static camera? | The camera or UI plane drifts on every non-payoff frame | Still-stretch report | Add a slow 0.5-1.5% scale creep |

### F. Cursor and click

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| F1 | Cursor clicks with a ripple? | No ring or circle expanding from the cursor (unless the film's single declared ring grammar, <= 14 f); target squashes 0.63-0.81 one frame after the cursor minimum (0.71-0.9) | The 8 frames around each press | Delete the ring; add target squash, hard colour step, bar dip, or sheen |
| F2 | Cursor entry | Enters oversized (1.5-5x) and scales about the tip; ~60% of travel in frame 1; 0.5-0.9 s total | First 6 frames of each entry | Rebuild entry curve |
| F3 | Path straight or constant speed? | Path curves with a heading change; speed varies (asymptotic decay, 2-frame steps) | Overlay 5 frames of tip positions | Add a bezier, rotate heading, decay steps x0.72 |
| F4 | Arrival and press on the same frame? | A park of 2-15 f precedes the press; any camera zoom has finished | Frames before the press | Insert a park; finish the zoom |
| F5 | Cursor family inconsistent? | One cursor family; arrow-only or pose-swap, not both | Contact sheet | Pick one |
| F6 | Cursor on the UI layer? | Cursor on its own top layer; scale decoupled from the UI zoom | Source structure | Move layer |
| F7 | Typing metronomic or blinking caret while typing? | Pauses after spaces; skipped intermediate states; solid caret during typing; rate matched to the task (21-24 chars/s readable, ~85 chars/s burst) | 10 consecutive frames of typing; source for `setInterval`-like regular steps | Author the cadence by hand; make the caret solid |

### Cn. Counters and numbers

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| Cn1 | Count-up eased? | One value per frame, step sizes shrinking toward the end, values skipped, product fields end un-round, claims end round; no linear tween between integers | 8 consecutive frames of the number | Replace with a hand list of 15-23 values |
| Cn2 | Number static at the end? | Hold <= 1.2 s (single number 0.5-1.2 s) then the number dissolves/whips | Still-stretch report | Shorten or add edge-defocus |

### H. Logos and endings

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| H1 | Logo fades in or grows from zero? | First visible logo frame is full opacity and either >= 1.5x its rest size shrinking, or built from parts; no scale from 0, no opacity ramp | First 6 frames of the logo | Rebuild as shrink-in, stem build, or a hard cut to a slam |
| H2 | Ending fades to black? | Last frame has content, not black, and is still moving; the last 6 f accelerate | Last 10 frames; luminance trace | Remove the fade; add an accelerating contraction |
| H3 | Final hold frozen or long? | Anything held > 0.6 s has a living element; the resolved end hold is <= 1.4 s (gate G3) | Still-stretch report, `look.py` end hold | Cut the hold; add sway, shimmer, drift |
| H4 | Is the click shown resolving? | Film ends at maximum compression or before the release | Last 10 frames | Trim; cut at the biggest step |
| H5 | Tagline under the logo? | No tagline unless it is the sentence the film is about | Last frame | Remove |

### I. Rhythm

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| I1 | Equal beat lengths? | Beat lengths vary; the last one lingers | Contact sheet cut times | Shorten the middle; extend the last |
| I2 | Reading time too short? | A phrase of ~20 characters is on screen >= 1.2 s in total (assembly plus a hold of at least 0.45 s); a 2-word phrase >= 0.5 s | Frame counts between assembly and exit | Extend the hold or cut the copy |
| I3 | Too many events per second? | A new element every >= 0.3 s on average; a major event at most every ~0.8 s | Onset list | Remove events or space them |

### J. Sound

[measured corpus, original slop-review.md]

| # | Check | Pass when | Where to look | Fix |
|---|---|---|---|---|
| J1 | Does the score cover the whole cut? | `look.py` audio audit shows no silent tail; the music resolves on the last grid unit | Audio audit (integrated LUFS, true peak, silent tail, hit count) | Re-fit the score to the final length (`voice.py music-fit --duration`) |
| J2 | Is the first big sound or silence tied to something visible? | One named visible event (a click, a lift, the name) | Storyboard sound column vs the frame | Move the sound to the event, or the event to the sound |
| J3 | Is there a hit on every cut? | One to three hand-picked hits; sections shaped around the edit; the music pulled down while the viewer reads and cleared before the biggest move | Audio audit hit list vs the cuts | Remove hits; shape sections ([sound-pass MEASURED-SOUND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/MEASURED-SOUND-SYNC.md) section 6a) |

---

## Prove it

[measured corpus, original slop-review.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
