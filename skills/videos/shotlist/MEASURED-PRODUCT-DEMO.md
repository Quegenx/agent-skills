# UI demo: showing a product working

[measured corpus, original ui-demo.md] Source-specific short SaaS-film observations and practice, retained with their M/N evidence IDs. Original/private clips were not remeasured here. Use the [corpus scope and current tool map](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/README.md); historical helper APIs and paths are not supplied merely because a recipe names them. These are film decisions, not changes to protected live-product designs. [Existing licence](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/LICENSE-motionmaxxing.txt). Modified: ownership links, source scope and documented corrections.

[measured corpus, captured-identity view; asset-prep, SKILL.md#working-inside-an-existing-product-repo] This source asks for real captured sender/time/content identity. The current repo instead requires clearly synthetic, demo-safe customer values and forbids personal, test-user or production information on screen. Preserve product geometry and approved copy; the [existing privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md#working-inside-an-existing-product-repo) governs customer identity.

See also: [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) (the case is part of the idea; film shapes), [video-brief MEASURED-JUDGMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-JUDGMENT.md) (show the consequence, not the claim), [video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) (real UI with identity; using the capture's screens), [video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md) (the world the UI sits in), [seek-engine measured/motion.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion.md) (eases, camera, press physics), [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) (UI framing, magnification, page chrome), [MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md) (typing cadence, counters, meaning on the word), [MEASURED-TRANSITIONS.md](MEASURED-TRANSITIONS.md) (cuts between UI scenes), [MEASURED-ENDINGS.md](MEASURED-ENDINGS.md) (click and typed-prompt endings), [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) (UI patterns U1-U12, N5).

A UI demo is not a screenshot with animation on it. It is a magnified fragment of a product, a persistent pointer, and a chain of cause and effect that the viewer can read in under a second per link. This file covers how to frame real UI, how the cursor behaves, how clicks and typing look, how lists and grids react, how agent work is shown, and five frame-timed recipes. All times are at 30 fps with seconds in brackets unless stated; positions are 0-1 of frame (x right, y down); sizes are % of frame height H or width W. Evidence is cited as moment IDs.

Reading order: section 0 decides *what* is demonstrated; sections 1-3 are the grammar everything else sits on; 4-11 are mechanics; 12 is the recipe book (mechanics, not a default film); 13 is the slop list.

---

## 0. The case: what the demo is about

[measured corpus, original ui-demo.md]

Everything below is how to make a UI beat *move* correctly. None of it says what the beat should *show*. That is decided here, first, and it is the main difference between a demo that proves a product and a feature tour.

**0.1 WHEN you demonstrate the product -> DO follow one specific case with stakes**, from its trigger to its result: one trade from question to the alert that fires; one lead from discovery to the message that lands in the team's channel; one shop built from one sentence; one late arrival turned into a sent apology. Not three features in a row. *Because* a single case with something at stake is a story the viewer follows, and a feature tour is a slide deck of cards.

**0.2 WHEN you fill the UI with content -> DO use real, specific, slightly odd, well-designed content**: the real sender, the real icon and app name, a time stamp, a sentence in the product's own voice, a real product the customer would actually sell or write (a shop for vintage postage stamps, a microgenre playlist). Take it from the capture's copy and screens first ([video-brief MEASURED-BRAND-SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md) section 3). "Project Alpha", "Your Brand Here", lorem ipsum, a stock name and a round-number stat prove the opposite: that nothing real was gathered. Any invented item you keep is declared in NOTE.md (never on screen as a disclaimer).

**0.3 WHEN the product "thinks", "loads" or "works" -> DO show it with an object from the customer's world, never an AI symbol.** A wok tossing ingredients for a food-ordering agent; the real agent log; a ring of user-dots around a shrinking figure. No orbs, sparkles, neural nets, glowing brains or scrambled-glyph "AI" text. Section 8 holds the mechanics of status and shimmer; this rule decides what the thing being worked on *is*.

**0.4 WHEN the copy names a capability -> DO let the viewer watch the consequence** (the price line crosses the threshold and a real notification fires; a cursor drags a misplaced word into place; a coin is scanned into a ghost of dots) rather than caption it. The strongest version has the product perform inside the sentence ([MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md) section 0.1). Put the proof first when there is a claim and a proof: run the flow, then say the line.

**0.5 Recipes are mechanics, not a default film.** Recipe A below (prompt, send, agent result) and its cousins are frame-timed templates for when the product genuinely *is* something you type into, drag into or toggle. A "prompt box + send arrow + cursor click" beat is already a cliche of 2025-26 AI-product films; as the default structure of every film it is a genre, not an idea. Choose the film shape in [video-brief MEASURED-IDEATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-IDEATION.md) ([MEASURED-DIRECTION.md](MEASURED-DIRECTION.md) section 3a) first; use a recipe only for a beat that shape calls for.

---

## 1. Framing real UI

[measured corpus, original ui-demo.md]

**1.1 WHEN the UI is the proof** (prompt, checklist, modal, button) -> **DO** crop to ONE object and magnify it: card at 0.76W x 0.44H (3.3x), prompt card 1.6x, tab rail 1.5x, dashboard 1.7x, modal 1.4x, send button 4.4x (2.3x if the cursor must stay in shot, 0.27W macro for a push-in). Keep the top and bottom ~28% of the frame empty. Text that must be read is >= 4% H (rows 5%, prompt 4-5%, tab labels 5-7%). -- *because* the viewer reads one thing at a time and the later pull-back becomes the beat that says "this was inside a real product". (M913, M914, M916, M917, M918, M919, M943, M956)
- **HARD GATE (G1).** The render must show the readable object with text >= 0.04 H and the fragment >= 0.55 W (or cropped by the frame edge), sitting in a world rather than on a void. Magnify with the camera, not by resizing the UI's type. A ~0.31 W code card with ~0.03 H text in a large empty ground fails; a wide establishing shot of that size is allowed only if it lasts < 1 s and a push-in to readable size follows immediately. Captured UI is tiny (12-14 px = 0.015 H): scale it up 2-3x with the camera or build it bigger, and when two objects are needed (code, then result) show ONE per frame and cut or move the camera between them ([MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) R3.5): do not put equal panels side by side.
- Where the films disagree: M939 and M913's editor use 9-14 px labels (1.3-1.9% H) on purpose. Condition: use texture-size text only when the claim is volume or "real product" and nothing in it must be read; then give it distinct silhouettes (one tall card of ~0.49H, a table, green chips) so the rhythm survives without words. If any line must be read, it is >= 4% H and everything else is texture.

**1.2 WHEN you reveal the product by pulling back** -> **DO** one-frame snap, then tail: scale ratio 0.56-0.77 in ONE frame (2.50 -> 1.41; 1.47 -> 1.14; a step to 2.46x mid-typing), then a `MEASURED.softLand` tail of 9-18 f (0.3-0.6 s). Precede the snap with a slow accelerating creep (3.31 -> 3.01 over ~12 f) and fade the surrounding UI up behind the card during that creep. Release the pull-back about 12 f (0.40 s) after the last completion beat (a task check; M913, Recipe D). After the snap a 2-frame push (1.06 -> 1.30), decaying to 1.37, then a ~0.6 s (18 f) hold with only a sub-pixel creep, then an accelerating pan that ends hard with no settle. -- *because* the jump has the punch of a cut and the tail lets the eye read; completion releasing the camera makes the product appear as the result of the work. (M913, M914, M923)

**1.3** Use [one camera group](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion-camera.md#61-one-group-not-many-tweens). This demo source also records a 0.70 W -> 0.78 W window over ~36 f and 2-2.4x parallax (tiles > diagram > orb), rather than separately scaling its bars (M913, M919, M953, M922, M966).

**1.4 WHEN a pan or whip is needed** -> **DO** two phases, not one ease. Pan (`MEASURED.softLand`): about 1.2 H/s at the start falling to 0.18 H/s over 2 s; no hold. Whip (`MEASURED.whip`, leaving half `MEASURED.accelExit`; [seek-engine measured/motion-camera.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion-camera.md) R6.4, R6.9): ~1.6 H/s plus 1.4 W/s at peak while shrinking 20%, decelerating after. Or, for a timeline, one shared track for sidebar, ruler and blocks at a peak ~0.1 W per frame, ~2.9 frame-widths of travel in 3.3 s, a fixed 0.03 W left gutter clipping everything. -- *because* two pushes and a clipped gutter look like a camera operator; one ease looks like a keyframe. (M922, M940, M966)

**1.5 WHEN a scene opens on UI** -> **DO** let it arrive built and already moving: the prompt card is mid-slide with 105 px gone on frame 1, the modal is at 1.42x already zooming out, the trace panel is complete and then drops 0.09H decelerating while a pale overlay clears in ~11 f. For a product shot, keep the carried element (header, brand) lit at frame 0 and lift the rest from near-black over 9-30 f with a screen-blend colour wash sweep, not opacity fades. -- *because* it says "the app was already running" and the first frame is not a blank. (M914, M918, M940, M922)

**1.6 WHEN the UI is a backdrop for other things** -> **DO** defocus by blur, not opacity: 4 px keeps copy readable (hold it; the cursor blurs with it), 7-15 px for non-hero panels, a cap of ~11 px when a headline sits over it (headline never blurred, UI also darkens ~0.1). Pull focus back to the destination form by animating blur 4 -> 0 px over ~14 f. -- *because* depth carried by blur still lets the backdrop prove the product. (M942, M943, M956, M918, M953)

**1.7 WHEN you draw the surface** -> **DO** flat, with the product's identity. No browser bar, URL, traffic lights, bezel or full-screen screenshot; but the real icon, name, sender, time and sentence stay, and the plane contrasts with its ground (a generic white card with three toolbar circles and a send arrow is vibe-coded UI, [frame-review MEASURED-REVIEW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md) N5). A floating card/modal/rail/dashboard plane on a dark or pale ground; neutral greys (#141414 panels, #171717 prompt, or #F8F8F8 fill), a 1-1.5 px hairline (#262627 on dark, #DCE1DE on pale), radius about 0.2 x the card height for prompt cards, no shadow or at most ~12% soft, a dot grid or very low-contrast gradient behind (grid pitch 0.06-0.11 W, dots 2-3 px) or, better, a real ground from the capture ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)). The grid pitch also proves zoom: pitch doubling = 2x. -- *because* chrome is the strongest "stock recording" tell and costs the frame. (M913-M919, M931, M932, M939)

**1.8 WHEN output cards appear** -> **DO** keep live content playing inside them (video, footage cover-fit and never stretched, wide -> portrait by cropping) and add a warm bloom (~20 px) or a neon flash that decays in ~10 f. -- *because* static thumbnails read as slides; moving ones read as outputs. (M917, M919, M920, M930)
- Disagreement on numbers: M917 shows view-count style metrics fully formed with no count-up (marketing output); M923/M955/M958 move numbers off a control (controlled value). Condition: output stats appear whole; values caused by a control animate ([MEASURED-DEMO-RECIPES.md](MEASURED-DEMO-RECIPES.md), section 11).

---

## 2. The cursor

[measured corpus, original ui-demo.md]

**2.1 WHEN you choose cursor art** -> **DO** design it per ground and keep one family per film: white arrow or hand with a 3-4 px dark outline on dark; black arrow with a 1 px white edge on pale; or a custom bevelled arrowhead in the film's accent. Size at rest 0.04-0.06 W (0.11 H if the film is cursor-led). Never an OS cursor, never an emoji, never an I-beam. -- *because* the cursor is a character in the film's identity. (M914, M918, M919, M930, M931, M932, M933, M953, M956, M959)
- Two valid grammars, pick one per film: (a) **arrow-only**: the cursor never changes shape, the UI carries all response (M914, M919, M939, M942, M969); (b) **pose film**: the cursor swaps art in one frame (arrow -> pointing hand 3-5 f before the click, M928 at 5 f, M931, M935; press pose = finger bend, height 0.06 -> 0.04 H, M930; pointing -> thumbs-up with an 8 px bounce and no scale, M935). Do not mix.

**2.2 WHEN the cursor enters** -> **DO** make it oversized and scale about its TIP: 1.5-2.2x (multi-cursor), 0.36 W rotated 55 deg (glossy 3D), up to 5x blurred 5 px and mostly off-frame, shrinking 5.1 -> 3.45 -> 3.0 -> 2.7 -> 2.45 -> ... -> 1.0 over ~26 f. In the first frame step it covers ~60% of its travel (a 79 px/frame = 0.06 W first step on a 1280 stage; in the oversize case 37% of x and 60% of y), then a long `MEASURED.snapSettle` tail; total travel 0.5-0.9 s, with 85% done in the first ~0.7 s and a 0.5 s creep. It shrinks 15-20% as it nears a close target. -- *because* it reads as thrown at the screen and the tip stays the anchor. (M953, M956, M959, M933, M939, M942)

**2.3 WHEN the cursor travels** -> **DO** curve it and rotate its heading with the travel (heading swinging -20 -> -195 deg over a ~0.7 s loop under the card; a 20 deg clockwise lean at peak speed; tip-anchored rotation toward the target). Arcs dip well below the start (0.23 H) on the way to a distant button at peak ~80 px/frame with a one-sided 20-25 px smear (only if the film uses smear). Straight lines are only for drags. In stepped films use 2-frame steps with each step ~0.72 of the previous and x converging faster than y so the path bends. -- *because* a straight constant-speed line is the mouse-macro tell. (M914, M919, M943, M969, M918)

**2.4 WHEN the cursor reaches a target** -> **DO** park, and size the park to what the viewer must find: 2 f (0.07 s) for an obvious button, 3-5 f (0.1-0.17 s) for a switch, 0.16-0.5 s (5-15 f) when the camera must zoom onto the target, 0.3 s hover before a pose swap. Finish any camera zoom BEFORE the press. Hover states act early: a hover rim (#73C8F2) about 0.4 s before a drop; a hover square behind a trigger 5 f BEFORE the hand lands, then popup opens 6-7 f after landing. -- *because* the park gives the eye time to find the target, and early hover states prove the UI is live. (M914, M919, M931, M933, M935, M939)

**2.5 WHEN several cursors exist** -> **DO** one job each, started on different frames, with an event about every 9 f (0.3 s): one presses and drags a card, one recolours a bar twice, one clicks a heading; give each a name pill (~0.06 W x 0.04 H) and let them jump (not interpolate) across a cut. -- *because* collaboration reads as simultaneous cause and effect, and each pointer can be followed. (M953)

**2.6 WHEN the cursor leaves** -> **DO** one of: accelerate off-frame (0.04-0.06 W per frame at peak, curved, tilting 10-45 deg, edge-cropped by f+3); the whole zoomed view slides away with it (smear 20 -> 140 px, 10 f, then 3 empty frames); shrink to nothing in place in ~9 f (0.29 s); or park blurred in a layer behind (4 px) until the next beat. -- *because* an exit by acceleration clears the frame without dead time. (M914, M918, M919, M939, M942, M943)

**2.7 WHEN you build the layers** -> **DO** put the cursor (and a dragged stack) on its OWN top layer outside the camera group, scaling by its own factor (1.5x when the UI zooms 2.33x; follows camera scale in M914). Exactly one instance at a time. It rides a shrinking button during a contract. -- *because* cursor continuity keeps the "real recording" illusion and its scale stays believable. (M914, M918, M943, M969)

**2.8 WHEN the cursor enters relative to typing** -> **DO** decide by its job. If it must focus the field, enter before typing (M914: in at 1.84, typing at 2.48 s source; it rides the zoom). If its job is only "send", enter ~0.4-0.7 s (12-21 f) before the last character lands (pointer appears at 3.20 s while typing ends 3.60 s, M969) or just after (M919). -- *because* a pointer waiting around for 2 s has nothing to do and breaks the pace.

---

## 3. The click

[measured corpus, original ui-demo.md]

**3.1 WHEN a click happens** -> **DO** cause then effect. Cursor press: 2 f down to 0.71-0.90 (0.81 -> 0.71), tip pushed down ~0.03 H, 3 f back to 1.0 (a 13% compression with the tip down is enough in a hero CTA; 0.75 over ~7 f for a slow one). Target reaction: 0-1 frame after the cursor minimum, to 0.63-0.81 (button 0.63 in M914; 0.76 M922; 0.80 M919/M928; 0.71 M956 held 2 f; 0.97 for a quiet close-up), the arrow glyph inside it lagging one frame. Reaction on the same frame the page responds (a card starts expanding on the press-minimum frame). -- *because* the tiny gap between cause and effect is what sells "real product". (M914, M919, M922, M928, M939, M943, M956, M959)

**3.2 WHEN the click needs weight** -> **DO** shape asymmetry on the target (the cursor itself is 2 f down, 3 f up, see 3.1): fast squeeze (`MEASURED.glide`), slower release (6 f down, 10 f up at 30 fps), hold the minimum for 2 f (M956), release without overshoot (`MEASURED.softLand`), OR a single small rebound to 1.05 over ~10 f (`MEASURED.popOver`). At most one rebound style per film. -- *because* an asymmetric curve feels like a spring-loaded button without cartoon bounce. (M922, M956, M914)

**3.3 WHEN the response is shown** -> **DO** put it in the UI, never in a graphic on the cursor: a hard colour step on the target (green -> coral, no tween), a tint plate at ~0.25 opacity peaking at the press frame, a bar dipping 15% and recovering in ~4 f, a sheen band (25-45 px) crossing the button in 7-16 f, a glow that peaks at 35 px blur @40% about 7 f after press and decays over ~0.3 s. Variant for a "sent" state without a press: cross-colour the button over ~8 f (disc black -> #969696 -> white while the arrow goes white -> same grey, invisible at the midpoint -> black), no scale. -- *because* the click is felt in the object, not announced by decoration. (M930, M931, M953, M956, M928, M974)

**3.4 WHEN a ring is tempting** -> **DO** use none. Ripple rings appear in exactly one film (M914: a ring born ON the press frame at 0.7x button radius, outer to 1.6x then 2.4x, transparent in ~14 f). Six other films explicitly forbid them. Use rings only if the film already speaks in thin accent rings elsewhere. -- *because* a ripple is the stock "click" icon; the target's squash already says it. (M914 vs M930, M931, M939, M942, M953, M956, M959)

**3.5 WHEN you end a CTA-style click** -> **DO** cut at maximum compression or before the release: the last 7 f accelerate (button 0.947 -> 0.74, biggest step on the final frame), one frame of label smear (0.44 W wide) at the press, then cut to the next scene at max velocity; or end 0.11 s (3 f) after the pointer arrives and never show the send. -- *because* the release never happens on screen, so the action transfers to the viewer. (M931, M959, M949, M943)

---

## 4. Typing prompts

[measured corpus, original ui-demo.md]

*Runtime:* `M.type` also types multi-line and syntax-highlighted code: give the host `<span class>` children and real line breaks and the caret follows the last glyph in 2D (runtime/README.md, Typing). Typed code must still be magnified to >= 0.04 H (hard gate in 1.1).

**4.1 WHEN text is typed in a UI** -> **DO** pick the rate by what the viewer must do with it:

| The viewer must... | Rate | Evidence |
|---|---|---|
| recognise "a person typed a command" | 2.8-3.4 chars/frame at 24-25 fps = 67.2-85 chars/s; 68 chars in ~0.8 s, per grapheme in bursts (3/3/4/3) | M914, M919 |
| read the content | 21-24 chars/s, bursty (22 chars in 0.93 s, pauses while something else moves) | M931 |
| see a short result land | burst ~84 chars/s (21 chars in 0.25 s), ~0.5 s stall, second burst | M935 |
| watch a human author a line | ~1 char per frame (30 chars/s) with irregular 1-frame holds, ~40-45 chars/s for 40 chars in ~1 s | M928, M942, M949, M974 |
| see a field fill fast | 2-3 chars/frame (~70 chars/s) | M956 |

[measured corpus, original ui-demo.md section 4.1] Arithmetic correction: the old conversion said ~82-85 chars/s. The stated independent bounds multiply to 2.8 x 24 = 67.2 and 3.4 x 25 = 85; the separate 68 chars in ~0.8 s observation is ~85 chars/s.

-- *because* too slow is boring and too regular reads as a script.

**4.2 WHEN you author the rhythm** -> **DO** write the cadence by hand: 1-frame letter bursts, 6-10 frame pauses after spaces (hold 10 f after the first word, 6 f after the second), skipped intermediate states ("Th" never shown, a two-letter word arriving as 2 letters at once, no lone letter before a pair), gaps of 0.02-0.07 s inside words, ~0.10 s before an ending letter, ~0.20 s before a space, a slower last word (a glyph every 3 f). Keep any deliberate typo. -- *because* metronomic one-character-per-frame typing is the clearest slop tell. (M949, M962, M966, M969)

**4.3 WHEN the caret appears** -> **DO** clear the placeholder, show a lone accent caret 1 f (0.04 s) before the first character, and keep it SOLID and non-blinking while typing and during result bursts. Blink only in a hold after typing, on its own clock (~0.25 s phases, independent of the typing clock; e.g. on 1.4 s, off 0.26 s, on 0.2 s). A big caret (0.008 W x 0.25 H, or a 0.06 W x 0.67 H bar that shrinks every step) may die in 1 frame instead of blinking. -- *because* the cadence tells who is typing; a blink during typing is a UI default. (M914, M919, M923, M935, M956, M968, M969)

**4.4 WHEN the line must stay framed** -> **DO** choose the anchor by text role: composed title text re-centres on every event and the carrier (dot, caret, emblem) follows its live right edge (dot +0.1 W across 18 chars, moving even on space steps); a field's text is left-anchored and the caret follows the last glyph; a numeric field grows LEFT around a stationary caret ($1, $19, $194 ... in gaps of 2-3 f). When erasing, wipe with a clip edge through the glyphs while the line slides (5 f, accelerating) or backspace one letter per step without re-centring survivors. -- *because* it reads as composing now rather than a pre-laid line being revealed. (M962, M969, M923, M968)

**4.5 WHEN the newest glyph needs life** -> **DO** show the leading 1-3 glyphs brighter or in the accent for 1 f then settle (fresh #F5E8FF -> accent, plus ~2 faint ghost glyphs at the leading edge; red for 1 f; violet -> ink over ~17 f). Wave typing: each glyph lives 14 f at 60 fps (~0.23 s), path +25 -> -24 -> 0 px (0.035 H), x slide from +15 px, colour accent -> ink; in a container wider than the frame (1.78 W) whose whole group pans (eased, fastest mid-typing) so controls arrive by pan, not by pop. -- *because* it marks the newest thing without a cursor or a wrap. (M914, M956, M974)

**4.6 WHEN the camera works during typing** -> **DO** step it: drift 1.6 -> 1.5x, then ONE-frame contraction ~0.77 mid-line so the whole input is visible, a fast `MEASURED.softLand` return to canonical, then regrow ~1.13x so the send button is big for the click. For a text-only beat, hard-cut the scale (x0.42, then x1.57 of large) on the same frame the copy jumps ahead (a phrase appears at once); never zoom-tween. -- *because* stepping scale converts overflow into a committed line and the eye reads one cut, not two events. (M914, M923, M949)

**4.7 WHEN the placeholder exists** -> **DO** show it grey, clipped by the frame edge or fading in as a whole string (0.15 -> 1.0 over ~6 f); clear it in one frame before the caret appears. Never type placeholder text. (M914, M948, M974)

---

## 5. Toggles, cascades, checklists

[measured corpus, original ui-demo.md]

**5.1 WHEN a switch flips** -> **DO** 2 frames: knob moves, one pale in-between frame (#CED9DC), full colour; no glow, no bounce, no ring. The flip starts ~1 f after contact, before the press bottoms out; the cursor recoils to 0.92 over 3-5 f and returns to 1.0 in ~10 f. -- *because* sparse cleanliness lets the cascade after it carry the drama. (M933, M935)

**5.2 WHEN one action propagates to a list** -> **DO** start the cascade ~5 f (0.17 s) after the master, 2-3 f per item with uneven gaps (3,2,2,2,2,2 or 3,3,2,2,2,4), 5-7 items, whole wave <= 0.6 s (17 f for 7 rows), each item its own 2-frame flip; or, when the pointer glides over without clicking, begin ~2 f after its peak speed and finish as it stops. -- *because* a wave short enough to hold in working memory reads as one gesture; slower reads as a loading list. (M933, M935)

**5.3 WHEN a wave crosses a 2D grid** -> **DO** origin-first on an orthogonal lattice (5-10 px jitter, never hex/random): the centre rows lead outer rows by 3-6 f (adjacent rows +0.25 s, outer +0.5 s at 24 fps), ~5 f (0.21 s) per column early so the front is convex; the wave's starts span ~1 s; each badge runs avatar -> arc -> ring (about 270 deg, closes, wiggles) -> fill -> slash -> solid disc -> check in ~1.5 s on a 12 fps pose clock while the camera runs 24 fps. -- *because* spreading becomes geometry, and posed items against a smooth camera give craft without noise. (M934)

**5.4 WHEN a checklist shows work** -> **DO** a three-state machine: pending = dashed ring + white text; active = rotating spinner (ring dim, arc bright, 34 px) + GREY text (#808086); done = check + white text. Swap the icon in ONE frame (no scale pop) while the row nudges 14-18 px right and returns over 6-8 f. Cadence ~0.9 s per row (26/26/29 f). Baton: the NEXT row dims and its spinner grows 16 -> 33 px 2-3 f BEFORE the previous check, text brightens ~2 f before its own check, so the list never idles. Rows enter bottom-to-top 2 f apart, whole, sliding ~37 px in ~10 f; each step is a concrete verb plus a number. -- *because* it shows labour in discrete, believable steps. (M913)

---

## 6. Drag and drop

[measured corpus, original ui-demo.md]

**6.1 WHEN a card is dragged into a field** -> **DO** a reaction stack, earliest first: target grows (box bottom 0.61 -> 0.69 H over ~14 f) and a hover rim (#73C8F2) appears ~0.4 s before the drop; the card rises (0.63 -> 0.37 H, `MEASURED.softLand`, ~11 f) with the hand pinned to its top edge, a 2-frame hold at the crest, tilts -8 deg over ~8 f then back to 0 by the drop; the drop is ONE frame (card 0.18 x 0.28 -> a 0.12 square attachment, radius 0.04 -> 0.02, hand -> arrow swap on the same frame, fill flash #DBEBF6); a soft patch slides off by ~7 f; a bottom tint fades by ~0.6 s; the ground cools ~4% across the drag. -- *because* one-frame snap with stacked feedback feels physical. (M931)

**6.2 WHEN a stack drags and drops into an uploader** -> **DO** stack and cursor on their own layer, hold still, fan contracts ~11 f, then travel together ~16 f with a slow start, peak speed mid-way (`MEASURED.softInOut`, no overshoot, smear 0.08 W along the travel, -30 deg). No press flash. The drop is cards shrinking to nothing about their own centres in 3 f each with 1-frame stagger and blur up to 10 px; they do not fly to slots; the cursor scales to nothing in place over ~9 f. The next beat (a tile cascade) starts in the same frame range. -- *because* disappearing in place makes the result appear to have been consumed by the target. (M918)

**6.3 WHEN items are collected into a folder** -> **DO** four items from four different edges on ~3 f staggers (one as a huge ~20 px-blurred foreground square), a grab that lifts 0.03 H with no halo, a curved drag while scaling 0.14 -> 0.09 W, the stack hidden by a glass folder lip, folder + cursor vanishing on ONE frame. Then the result may spring (+0.06 H overshoot, thumbnails on 2-frame staggers): this is the film's single overshoot. -- *because* overshoot saved for one payoff reads as reward. (M948)

**6.4 WHEN a card is dragged over another** -> **DO** press 0.72, drag slow-fast-slow with the card painted over its neighbour which slides the other way underneath. (M953)

---

**Moved:** sections 7 to 13 (cards and carousels, agent work, phones, dense scrolls, counters, the demo beat recipes and the slop tells) is now in [ui-demo-recipes.md](MEASURED-DEMO-RECIPES.md).

## Prove it

[measured corpus, original ui-demo.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
