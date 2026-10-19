# UI demo: more beats and the recipes

[measured corpus, original ui-demo-recipes.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, captured-identity view; asset-prep, SKILL.md#working-inside-an-existing-product-repo] This source asks for real captured sender/time/content identity. The current repo instead requires clearly synthetic, demo-safe customer values and forbids personal, test-user or production information on screen. Preserve product geometry and approved copy; the [existing privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#working-inside-an-existing-product-repo) governs customer identity.

Moved from [ui-demo.md](MEASURED-PRODUCT-DEMO.md) to keep each file under the size cap. Sections 7 to 13 (cards and carousels, agent work, phones, dense scrolls, counters, the demo beat recipes and the slop tells)

## 7. Cards, carousels, orbits, popups, selection

[measured corpus, original ui-demo-recipes.md]

**7.1 WHEN data cards stack in** -> **DO** one repeatable birth: a 1-frame pale slab with ~25-30 px horizontal blur that grows to 0.5 H over ~14 f (0.47 s) while darkening to the card colour; ~22 f (0.75 s) apart; each front card lasts ~0.8 s then retreats to a rear peek (left edge 0.50, 0.21 W). Give each card one live micro-proof (a gauge to 77% of the arc, only the last digit rolling in a masked slot, a waveform wiping L -> R). Labels sit above, not as tabs. -- *because* repetition becomes rhythm and the micro-proof says "live". (M927)

**7.2 WHEN a list receives a new item at the top** -> **DO** insert the newest as a blank tinted card, fill its text 2-4 f later (whole, one-frame pop), shove older cards in piecewise-linear jumps (the first ~105 px in ONE frame, one true 2-frame hold), add ~0.02 W lateral drift per card. Move DOWN if the previous clip scrolled UP. Exit with a bottom-up wash, then a hard cut. -- *because* jerky, hold-punctuated steps feel like events being processed. (M940)

**7.3 WHEN a row of cards must end on a choice** -> **DO** cards 0.26 W x 0.52 H, pitch 0.27 W; the hero shrinks into the first slot (~14 f); the row slides ~36 f (1.2 s) with peak ~85 px/frame and 25 px smear, `MEASURED.softInOut` and NO overshoot; the stop IS the selection (travel of 5 pitches, ~1.35 W; the chosen card ends near centre); it then grows 1.46x over ~23 f, slow start accelerating near the end with a 1-frame 6 px blur, ending mid-ease. -- *because* the stopping point is the answer, so no highlight is needed. (M942)

**7.4 WHEN a selection must reach the form** -> **DO** collapse the chosen card's SURFACE inward around the orb (10 f, box and radius animated) while its children keep size and are cropped by the shrinking rounded mask; shrink the siblings IN PLACE and fade over ~5 f (never slide them off); pull focus on the form by blur 4 -> 0 over ~14 f; fly the orb on a curved path down, left, up for ~24 f (diameter 0.22 W -> 0.036 W, 5 px blur at peak speed, no overshoot) into the form's slot; change the slot's label to the choice. -- *because* one continuous object makes the choice a traceable state change. (M942, M943)

**7.5 WHEN items gather around a mark (orbit)** -> **DO** nine or ten upright items (faces never rotate): nine at 40 deg spacing, or ten of irregular size (0.08 x 0.29 to 0.21 x 0.21, tall ones further out); enter by `MEASURED.softLand` convergence (radius 650-800 -> 330-450 px, smear halving every 0.1-0.2 s); radius collapse ~8 f while rotation decelerates 17 -> 10 -> 1 deg/frame; a swell (1.8x for ~4 f) travels AGAINST the orbit with gaps widening 0.07 -> 0.27 s; exit as a clockwise 2-3 f stagger on an expanding orbit; for a hook, fling 7x faster with the headline swelling 1 -> 1.3. A token ring on an ellipse (radii ~0.10 W x 0.15 H, upper tokens smaller) lights each token at its own slot 1-2 f apart. -- *because* irregularity and overlap look photographed, not generated; counter-motion keeps identity. (M941, M945, M956)

**7.6 WHEN you open with a card stack (rolodex)** -> **DO** (signature move, use rarely) two perspective stacks mirrored about the logo (3-5 sheets, outer wider, top photos inverted), on screen at frame 0; flip fast for 3 f, advance slowly ~1.5 s, then spin as one rigid unit (2 -> 4 -> 11 -> 29 -> 74 deg, scale 1 -> 2.0 over 0.7 s, blur to 10 px) and cut while still large. (M941)

**7.7 WHEN a menu or popup opens** -> **DO** height-wipe (0.29 -> 0.41 H in ~4 f), rows to full opacity 1-2 f apart top-down, a divider growing L -> R over ~0.67 s, hover square before the hand lands. Exit by sliding down with the camera and fading only the last 4 f. Never fade the whole panel in. -- *because* staged reveal reads as UI, a fade reads as a slide. (M935)

**7.8 WHEN a card must become a canvas** -> **DO** animate a zoom OUT, not in: the container grows while its header content shrinks (scale 1 -> 0.39, one width overshoot 0.63 -> 1.06 -> 0.82 W), children step in whole 1-2 f apart and are shrunk only by the zoom, and a thin connector draws last. -- *because* the viewer sees a camera, so the content feels spatial. (M939)

---

## 8. Agent work beats

[measured corpus, original ui-demo-recipes.md]

**8.1 WHEN the agent is "thinking"** -> **DO** status text per whole word: blur 12 px and opacity 0.1 -> sharp in 4-5 f, words back-to-back (3 words in 12-15 f), grey ink; then TWO shimmer passes: a masked brighter COPY of the text, band ~0.23 W, 13 f (0.42 s) each with a ~6 f gap, accent hue; no spinner, no dots, never per-character. -- *because* nothing types for the agent and it reads as inference. (M919, M920)

**8.2 WHEN you need an agent marker** -> **DO** one persistent mascot/character: sweep in from beyond the edge with ~25 px smear, decelerate hard, settle; scale with the camera; later drop straight down over ~15 f (slow start, ~100 px smear at burst) leaving a green check where it was; at the end shrink about its fixed centre (0.14 W -> 0.06 W over ~0.6 s), no translation. Never fly in from above, never bounce. -- *because* the viewer tracks the agent's position in the job. (M916, M917, M919, M920)

**8.3 WHEN you show a full agent step** -> **DO** this order: act (send) -> 3 empty frames -> marker arrives -> status words -> shimmer x2 -> the user's prompt returns as a right-aligned bubble (opacity 0.2 -> 1 in ~0.4 s, text NOT shrunk) -> L -> R wipe of the status (~5 f) + a check drawn on (~2-3 f) -> result status (smaller, 40 px vs 80 px as the camera pulls back) -> result cards at near full size 2 f apart with footage playing and a warm bloom -> layout scrolls up 0.04 H accelerating -> next status begins and stays unresolved at the cut. -- *because* every beat answers the previous one and the last never settles. (M919)

**8.4 WHEN colour is spent** -> **DO** one hue for "the machine is acting" (typing, scan, sweep, shimmer, halo) and a second signal (green) ONLY for "done"; never on the same object at once. (M913, M914, M916, M919, M920)

**8.5 WHEN you must show "a lot of work"** -> **DO** at least three items in progress at once, about 0.9 s per step, a concrete verb plus a number per row, completion releasing the camera (1.2). For logs: start fully populated and moving (frame 0), accelerate scroll (section 10), let new system events step in whole. -- *because* volume and specificity read as competence. (M913, M939)

---

## 9. Phone and device

[measured corpus, original ui-demo-recipes.md]

**9.1 WHEN a 3D phone is the hero** -> **DO** crop it (top corners off-frame, bottom ~0.97 H, screen ~0.39 W), start at yaw -54 / x-tilt 29 / roll 11 and reach -9 / 24 / 2 in SIX held poses inside 0.4 s (0.03, 0.07, 0.10, 0.20, 0.30, 0.40 s, each reached in 1 f and held 1-2) under ~1870 px perspective, scale 0.79 -> 0.95, visible side thickness 0.05 W -> 0.01 W early, then a mild drift. All screen UI is one perspective plane. Headline BEHIND the device, a large sparkle IN FRONT of its corner; no drop shadow. -- *because* held poses with thickness look photographed; a CSS tilt looks flat. (M955)

**9.2 WHEN you can't render 3D** -> **DO** fake depth with stepped 2D camera jumps (jumps at 4, 6, 7 f, held 2 f each, a gentle enlarge to ~1.8x, a dive in held steps 3, 2, 2, 7 f long) plus a separate parallax star layer drifting ~0.07 H per frame; or keep the phone flat and rim-lit (a 2-4 px accent edge) and move the camera: cut in at 0.9 W with the lower half out of frame, pan, whip, zoom. -- *because* the camera, not the object, supplies the 3D. (M957, M922)

**9.3 WHEN there is no pointer** -> **DO** an eye carrier: a shaded 0.04 W bead riding the device rim during the camera move, growing x1.5-2.2 per 3 f into the next scene, finally a disk 17x larger that becomes the new (white) ground. Light/dark flips come from a growing object, never an opacity flash. (M922)

**9.4 WHEN the window must "land" then give way to titles** -> **DO** open from a 0.10 W slit with top and bottom fixed and contents cropped, never stretched; hold, then +0.22 W in ONE frame; panel and gallery rise on two slightly different tracks (16 px smear); a logo disc docks 0.10 -> 0.04 W with 20 px smear at peak; then tip the window back over ~34 f (top 0.11 -> 0.46 H, sides splay, lower half off-frame) and drift ~4 px for 2 s as a plinth under the headline. End on an accelerating roll to -76 deg (22/18 px smear) with no settle. (M944)

**9.5 WHEN a phone or notification must be rebuilt** (the real UI cannot be captured) -> **DO** use `runtime/native-ui/` (`NativeUI.phone`, `lockScreen`, `notification`, `banner`, `list`, `tabBar`, `appScreen`; `NativeUI.arrive` for the roll-up and `NativeUI.macro` for the camera push that makes it readable; API in `runtime/README.md` "Phone UI", reference `examples/phone/index.html`); a physically rendered device is `M.hero3d` with `kind: 'phone'` (README "3D"). A real screenshot always wins over a rebuild. -- *because* true-proportion furniture with real identity (icon, sender, time, sentence) is what separates a phone UI from a mock-up.

---

## 10. Dense scrolls and logs

[measured corpus, original ui-demo-recipes.md]

**10.1 WHEN a long chat or log proves volume** -> **DO** start fully populated and already moving, one group y, no blur: ~6 px/frame early accelerating continuously to ~250 px/frame (0.35 H per frame) over ~55 f (1.84 s). The first 0.4 s moves only ~0.07 H. Let the viewport run EMPTY after the last block; do not fill it. Decelerate over ~9 f onto a short, large, readable list (8 lines at y 0.14-0.45) and hold it still 0.8 s (24 f). New system events step in whole, then ride the scroll. -- *because* speed and mass read as competence and the single legible landing is the payoff. (M939)

**10.2 WHEN content passes too fast to read** -> **DO** make blocks of distinct silhouette (table card, one tall red/green diff card ~0.49 H, green chips) at 9-14 px text; keep ONE landmark. -- *because* shapes keep rhythm when words can't. (M939)

**10.3 WHEN wiping between UI scenes** -> **DO** a feathered mask (0.31-0.42 of the axis, 0.56-0.6 s) painted in the NEXT scene's ground, start it 0.1-0.2 s before the voice line ends, enter the next hero (6 px blur) 0.1 s before the wipe completes, rotate directions R -> L, B -> T. Hard cut only when the incoming scene is empty or a single UI frame. (M939, M940)

---

## 11. Counters inside UI

[measured corpus, original ui-demo-recipes.md]

**11.1 WHEN a control moves numbers** -> **DO** drive several numbers off one handle, updating EVERY frame on `MEASURED.softInOut` with no overshoot ($60 -> $193 limit, 161 -> 493 amount, 69 -> 100%, profit $9.6k -> $32.1k in ~50 f at 60 fps, all in the same ~0.83 s as a 1.69x -> 1.0 zoom). -- *because* four numbers off one handle shows causality without text. (M923)

**11.2** Use the [counter/number definition](MEASURED-TYPE-DECISIONS.md#8-counters-and-numbers) for discrete decaying steps, hero versus product-data roles and the no-flash finale. This UI source additionally keeps scaling the whole card 0.43 -> 0.89 W through the last frame (M924); its edge-glyph defocus observation is recorded with M954 in that canonical chapter.

**11.4 WHEN a timecode or scrubber is on screen** -> **DO** let it creep sub-pixel (never tick), so a 0.6 s hold stays alive. (M913)

---

## 12. Demo beat recipes (30 fps frame timelines)

[measured corpus, original ui-demo-recipes.md]

Each is a mechanic, not a film; swap content and scale, and choose the film shape first (section 0.5). Frames are relative to the start of the recipe (f0). To preserve duration at 30 fps, multiply source frame counts at 24 fps by 1.25 and at 25 fps by 1.2; the earlier factors were reversed.

### Recipe A: prompt -> send -> agent result (~205 f, 6.8 s). Evidence M914, M919, M969. Use only when the product is typed into (section 0.5).

[measured corpus, original ui-demo-recipes.md]
1. f0: hard cut into the prompt card at 1.6x, already moving: 105 px gone on frame 1, 72% of the slide done by f5, tail to ~f15 (`MEASURED.snapSettle`). Placeholder grey, clipped at the edge.
2. f2-f16: cursor enters from bottom-right on a decelerating curve (first step ~0.06 W), heading rotating, parks on the field at f16.
3. f14: placeholder clears. f15: lone solid accent caret. f16-f40: type ~68 chars in ~24 f (~85 chars/s), per grapheme, leading glyph brighter with 1-2 ghosts.
4. f34: ONE-frame camera contraction x0.77, ease-out tail ~9 f. f40: typing ends, caret begins its own blink clock.
5. f40-f61: cursor loops BELOW the card (~21 f curved path, heading -20 -> -195 deg) to the send button; camera regrows to ~1.13x f55-f70; cursor parks f61-f75 (15 f).
6. f76-f81 press: f76 cursor 0.81; f77 cursor 0.71; f78 cursor 0.88 + button 0.86; f79 cursor 1.0 + button 0.80; f80 button 0.93; f81 button 1.0. (No ring. Optional: accent rings only if the film uses them, 14 f.)
7. f82-f87: hold 6 f. f88-f98: box + button + cursor slide left together, accelerating, smear 20 -> 140 px. f98-f101: 3 empty frames.
8. f102: marker sweeps in from the right (25 px smear), decelerates, settles by f115. f117-f132: status words blur in, 5 f each.
9. f132-f145 shimmer pass 1; f151-f164 shimmer pass 2. f165: the prompt returns as a right bubble (opacity 0.2 -> 1 by f177).
10. f170-f175: status wipes L -> R; green check draws f173-f176. f175-f190: marker drops straight down (burst ~f185, smear ~100 px).
11. f178-f190: the result status blurs in per word at half size. f191: first result card at near full size; f193 second; footage playing, 20 px warm bloom.
12. f195-f205: layout scrolls up 0.04 H accelerating. Cut here; next status starts unresolved.

### Recipe B: toggle -> cascade -> claim (~175 f, 5.8 s). Evidence M933, M935.

[measured corpus, original ui-demo-recipes.md]
1. f0: card already mid-open; rows fade in top-down 1 f apart (full by ~f10); divider grows from the centre.
2. f4-f30: glove enters lower right (0.96, 0.78): first step ~0.06 W, long `MEASURED.softLand`, tilt ~30 deg straightening, no smear, lands on the master switch (0.87, 0.26) at f30.
3. f30-f33: hover (3 f). f34-f40: press (tip down 0.03 H).
4. f35: master flips: f35 knob moves, f36 pale frame, f37 full blue. f42-f50: cursor recoil 0.92 and back to 1.0.
5. f44, f48, f51, f54, f57, f59, f61: seven rows flip (uneven gaps 4,3,3,3,2,2), each three frames knob -> pale -> colour. Cascade total 17 f, ~0.8 s after the click.
6. f70-f107: card slides and shrinks (scale 1 -> 0.6; 27% of travel in the first 14 f, 42% in the next 3-4 f, a ~21 f tail; keep ~0.2 W of its edge on screen). The cursor leaves in parallel, curving up-right, rotating 0 -> 45 deg, edge-cropped by f78, gone by f80.
7. f88-f92: claim line 1 fades 0.3 -> 1.0 in 4-5 f while gliding x 0.58 -> 0.29 over ~18 f and shrinking 0.078 -> 0.065 H. f99: line 2 starts and glides x 0.34 -> 0.29.
8. f103-f125: key-word loop emerges from under the card edge (9 held poses at 2-3 f), closes into a lopsided oval around the key words; hold ~0.7 s (f125-f146).
9. f130-f157: result badges grow 45 -> 100% over 8 f, glyph lagging 1 f, onsets 2 f apart down each column, second column offset ~8 f (a diagonal ripple). f165-f175: lines drift up 0.025 H, line 1 fades; end mid-fade on a hard cut.

### Recipe C: drag -> drop -> output cascade -> headline (~135 f, 4.5 s). Evidence M918, M931.

[measured corpus, original ui-demo-recipes.md]
1. f0-f10: stack and cursor held still on their own layer. f10-f21: fan contracts. f24-f40: stack + cursor travel together on a straight diagonal, slow start, peak speed f31, smear 0.08 W along -30 deg (shoulders f30, f33, gone by f37).
2. f46-f50: four cards each shrink to nothing about their own centres in 3-4 f, 1-2 f apart, blur to 10 px. f51-f60: cursor scales to nothing in place. f50-f56: a one-word status fades in; out f70-f75.
3. f50-f64: 13 tiles pop in place, ~1 per frame (5+5+3), each 0 -> 1.12 (by +8 f) -> 1.0 (by +13 f) with 3-4 px blur clearing by +10 f. No slide.
4. f79-f100: rack focus: UI blur 0.7 -> 5.5 -> 10 -> 11 px with ~0.1 darkening while the camera zooms out fast.
5. f81, f85, f88, f90: four headline words land (gaps 4,3,3 f), each with a 1-frame horizontal smear of 0.03-0.04 W, the whole line starting at 1.39x clipped at the left and shrinking to 1.0x by f96; headline NEVER blurred. Settles to 0.74 W by ~f135. Cut mid-zoom.

### Recipe D: checklist -> reveal (~165 f, 5.5 s). Evidence M913.

[measured corpus, original ui-demo-recipes.md]
1. f0: card at 3.3x on screen, top row already active. Rows 2 and 3 enter at f2 and f4, each sliding ~37 px in ~10 f; the card slides x 0.26 -> 0.12 with 70% of travel in 5 f.
2. f0: row 1 spinner running, text grey. f23-f28: row 2 dims and its spinner grows 16 -> 33 px. f24: row 1 text brightens. f26: row 1 check (one-frame swap, row nudges 15 px, returns by f34).
3. f49-f54: same overlap for row 3. f53: row 2 check. f79: row 3 text brightens. f82: row 3 check (mid-move, see 5).
4. f76-f90: the editor fades up behind the card; camera starts to pull back, scale 3.31 -> 3.01 (slow then accelerating).
5. f94: ONE-frame snap: scale 2.50 -> 1.41 (44% in 1 f). f95-f112: decelerating settle to 1.0.
6. f102-f114: five chips pop L -> R 2 f apart, small -> full in 2 f, whole text. f104-f120: a cyan band scans down the portrait (forehead f108, mouth f111, chest f114) and merges into a permanent bottom wash.
7. f120-f122: 2-frame push-in 1.06 -> 1.30, decaying to 1.37 by f132. f132-f150: hold with only a sub-pixel scrubber creep (18 f). f150-f166: accelerating left pan, ends hard.

### Recipe E: select from carousel -> commit into a form (~270 f, 9 s; two clips). Evidence M942, M943.

[measured corpus, original ui-demo-recipes.md]
1. f0-f30: prompt card present, ~1 grapheme/f typing, no caret. f24-f60: card enlarges with ~1 deg rotateY and type 22 -> 28 px.
2. f25: cursor enters from (0.38, 0.94) with a 1-frame 20 px smear; asymptotic decay (85% in ~21 f), creeps to f61.
3. f65: target avatar compresses 48 -> 37 px (0.77), cursor dips; f66: release. The orb leaves the badge, grows to 0.25 x 0.47 W/H over 9 f (15 px blur at peak f70, sharp by f75). Background defocus 3 -> 4 px, cursor blurs with it.
4. f74-f88: a shell unfolds behind the fixed orb (rim -> blur blob -> card; radius circle -> 32 px). f90-f104: hero shrinks into the first card slot.
5. f90-f126: the row slides (peak ~85 px/f f100-f114, 25 px smear, `MEASURED.softInOut`, no overshoot); it stops on the chosen card near centre. f126-f149: chosen card grows 1.46x, ends mid-ease. [clip cut]
6. f0-f10 (clip 2): same frame: chosen card at full size, prompt blurred 4 px, cursor parked behind a sibling. f10-f20: card surface collapses around the orb (0.36 W x 0.74 H -> 0.15 W x 0.31 H), children cropped, text fades; siblings shrink in place f16-f24.
7. f20-f34: prompt blur 4 -> 0. f26-f50: orb flies down, left, up (lowest point ~f38 at y 0.73; diameter .22 W -> .036 W; 5 px blur peak ~f37), lands in the form slot; slot label changes to the choice. Hold docked ~f50-f81.
8. f54-f81: cursor sweep along an arc to y 0.87 (peak ~80 px/f f60-f61, 20-25 px one-sided smear, 20 deg lean).
9. f82: ONE frame at 50% double exposure; f83: 2.33x close-up, cursor scaled only 1.5x; cursor glides f83-f110 and parks.
10. f112-f116: violet shadow grows to ~22 px on the card's bottom and right. f113-f117: press: cursor 1.5x -> 1.32x, button 0.97, label greys. f117-f122: 5-frame burst (width x2.2, blur 3 -> 25 px). Cut mid-burst.

---

## 13. Slop tells for this topic

[measured corpus, original ui-demo-recipes.md]

| AI default | Pro decision |
|---|---|
| Demonstrate three features in a row, each in its own card | One specific case with stakes, from trigger to result (0.1) |
| Fill the UI with "Project Alpha", lorem ipsum, a stock name, "Good morning" and a status dot | The real sender, icon, time and sentence from the capture; specific, slightly odd, well-designed content (0.2, [video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) section 3) |
| Show the product thinking as an orb, sparkles, a neural net or scrambled glyphs | An object from the customer's world, or the real log (0.3) |
| Caption the capability in type over a thumbnail | Show the consequence: the line crosses, the alert fires (0.4) |
| Make every film "prompt box + send arrow + cursor click" | A recipe only when the product is typed into; otherwise another shape (0.5, [MEASURED-DIRECTION.md](MEASURED-DIRECTION.md) section 3a) |
| Leave a small card (0.3 W) in an empty ground as the proof, or show code and result as two equal panels | The [canonical G1 readability gate](MEASURED-PRODUCT-DEMO.md#1-framing-real-ui), in a world |
| Show the whole app window with a title bar and traffic lights | Crop one object at 1.4-4.4x and reveal the product by pull-back (1.1, 1.2) |
| Smooth ease-out zoom into the UI | One-frame snap 0.56-0.77 plus a 9-18 f tail; 2-frame push, 18 f hold, hard-ending pan (1.2) |
| Different cameras on each card | One camera group; background fixed (1.3) |
| Cursor is the OS arrow, switches to a hand and an I-beam | Custom, one family per film; pose swaps only in a declared pose film (2.1) |
| Cursor lands at final size with a gentle ease | 1.5-5x oversize, scale about the tip, ~60% in frame 1, 0.5-0.9 s creep (2.2) |
| Straight line path at constant speed | Curve with heading rotation, arc dips, 2-frame decay steps (2.3) |
| Click and hover at the moment of arrival | Park 2-15 f, finish the camera zoom first, then press (2.4) |
| Click shows a ripple ring | Press 0.71-0.9, target 0.63-0.81 one frame later, colour step (3.1-3.4) |
| Release animation is shown | Cut at max compression / before release (3.5) |
| Typing at one speed with a blinking caret | Authored rhythm, solid caret while typing, rate matched to the viewer's task (4.1-4.3) |
| Placeholder text typed in | Placeholder clears in a frame, lone caret appears first (4.7) |
| Toggle tweens with a long ease and glow | 2 f: knob, pale frame, colour (5.1) |
| Cascade at a uniform 0.1 s stagger | Uneven 2-3 f gaps, convex wave, origin first (5.2, 5.3) |
| Checklist ticks all at once with a bouncy check | Three-state machine, one-frame icon swap, baton overlap, ~0.9 s per row (5.4) |
| Dragged card flies to its slot | Target reacts early; the drop is one frame; cards vanish in place (6.1, 6.2) |
| "Loading..." spinner | Per-word blur-in status, two shimmer passes, wipe to a check (8.1, 8.3) |
| Mascot floats in from above and bounces | One marker, sweeps in from the side, drops straight down, never bounces (8.2) |
| Phone tilted 15 deg with a drop shadow | Cropped, six held poses with visible thickness, headline behind (9.1) |
| Chat scrolls at constant speed with motion blur | Accelerates 6 -> 250 px/frame, no blur, empty viewport, 0.8 s landing hold (10.1) |
| Counts every number up linearly with a round end | One value per frame, decaying steps, skips, un-round product values (11.2) |
| Static thumbnails in "output" cards | Live footage inside, warm bloom, static stats (1.8) |
| Backdrop UI blurred to mush at 20 px | 4 px (readable) or 7-15 px (non-hero), cap 11 px behind a headline (1.6) |

## Prove it

[measured corpus, original ui-demo-recipes.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
