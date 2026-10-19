# Kinetic type

Words in motion: how long a line must hold, how words arrive and leave, letters with mass, writing that builds itself, and where copy lives across a sequence. Every rule here stays a pure function of `t`.

## Reading time is arithmetic

- **The floor, per line:** use [the canonical reading floor](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md#the-loop) for the fully legible hold: the word rate, and an attributed film heuristic of 17 characters a second after a quarter second to find the line. The old wording called 17 the subtitle standard; Netflix distinguishes US-English delivered subtitles (up to 20 adult, 17 child) from English templates (17 adult, 15 child), so that is not a universal subtitle limit. [t3knobox/klik-anim-skill-creation, klik-anim/SKILL.md], [Netflix US English](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide), [Netflix templates](https://partnerhelp.netflixstudios.com/hc/en-us/articles/219375728-Timed-Text-Style-Guide-Subtitle-Templates). The smoke test samples DOM text with visibility thresholds; zero short reads does not prove full legibility or pictured/canvas text coverage. Reveal and exit frames don't count; a typed line counts from when typing starts, since people read along with the caret.
- **A line that must land on its own** (the hook, the claim, the end card) gets the comprehension target, `0.3 s × words + 1.5 s`.
- **Budget per line, never per scene:** a scene can pass on its total while one line gets 0.2 s and the next idles for 2.5 s.
- **Feasibility is day-one arithmetic:** add up every line's floor before the shot list and compare it with the length. A script that needs 22 s of reading in a 20 s film is known at the brief; found after the build, it costs a re-time of everything. Cut words, never reading time.
- **Text read while it moves** stays under `height_px × fps ÷ 1.5-2` px per second (a 48 px line at 30 fps: ~960 px/s); faster entrances are fine only if the hold after them carries the full reading time. While read, a line stays within ±15° of horizontal; between 15° and 45° the hold stretches by `× (1 + |angle| ÷ 90)` (×1.33 at 30°, ×1.5 at 45°); past 45° is for display moments only. Animated body text is at least 24 px tall.

## Reveals, with their numbers

| Reveal | How | Reads as | Watch |
|---|---|---|---|
| Masked rise, word by word | each word rises through its own `overflow: hidden` span, ~108% of its height, ~0.37 s `EASE.out`, a word per beat (or ~90 ms apart) | editorial, premium | the mask hugs the line with ~0.08 em padding or descenders clip |
| Letter cascade | each letter rises ~42 px with its fade, 1.5 frames apart (at 30 fps) ±1 seeded, ~0.3 s each | crafted | total = letters × stagger: budget it against the hold; never on lines over ~25 characters |
| Emphasis slam | one word, a heavy spring, squash on landing, 2-4 frames of shake, on a bar's kick | the verdict, the stat | one per scene at most |
| Word swap | the outgoing word leaves up as the incoming rises, inside one shared mask sized to the longest word in the set (an invisible copy of it holds the width) | lists, "X · Y · Z" | each word gets its own hold; the swap itself isn't reading time; a mask that resizes per word makes the rest of the line jump |
| Typing | an accelerating rhythm (~107 ms a character easing to ~47 ms, ±27 ms seeded) and a caret blinking on a ~0.27 s cycle | a terminal, a device | the hold counts from the first character; a scene device, not the film's system |
| Weight or width sweep | a variable font's `wght` or `wdth` axis driven from `t`, never a font swap mid-word | change in one word | |
| Scale punch on a key word | that word alone scales +6-10% with `hitPulse` on its beat; the rest of the line holds | emphasis | |
| Flap reveal | each character hinges down from 90° at its bottom edge, staggered across the word, showing seeded glyphs that reshuffle until it is nearly upright, then the real letter (an airport board, a decryption) | a name or code arriving | monospace so the cycling glyphs hold their width; one short word, once |
| Path type | the rail draws first (~0.45 s, dashed), the word rides it turned to the tangent, then the rail fades | a route, a journey | a path move is unreadable until the path is visible |

Not as a primary reveal: a bare opacity fade, per-letter twinkling, anything moving crisp text while it is read.

- **Line replace:** the old line exits up and out in ~60% of the new line's entrance time, gone before the new line occupies its space; better still, the next line enters from the departing line's own place or through the same mask.
- **The reveal-misspell check:** every frame of a partial reveal spells nothing or a real prefix of the word. A wipe through "Launch" may read "Lau"; a mask that clips letter tops can make "clear" read "dear". Check strips of every reveal at 4x zoom.
- **Kerned big type:** statements at 88-128 px with `letter-spacing` −0.01 to −0.03 em; a single-line statement never wraps in any format (scale it to fit).
- **Every word keeps its slot from the start.** A centred line that builds word by word is laid out whole on its first frame and each word is revealed in place (opacity, blur, a small rise), never added to the line, which would re-centre everything already standing on every word. A brand or partner name arrives with its logo inline, at about 0.8 of the text size.
- **Keep reading order and relationships:** letters may arrive playfully, but running copy assembles in reading order, and the letters of a line move as one system relative to each other, not as loose sprites. A small move can cue a bigger one (a signal before the event).

## Letters with mass

A letter moved by its baseline is a mass on a hinge. Real physics gives it three phases, and all three must show:

1. **Launch:** the base accelerates first, so the top lags: a brief lean backward against the direction of travel, in proportion to the acceleration, fading over ~2-3 frames once the acceleration ends.
2. **Cruise:** constant speed, no force, no lean. The travel profile is a trapezoid (ramp, cruise, hard stop); an eased arrival spends the momentum before the stop and leaves nothing to whip.
3. **Arrest:** the base stops dead and the top keeps going, so the angle starts at zero with its fastest swing and rings down: `angle = A * Math.exp(-a / 0.23) * Math.sin(16.5 * a)` (a in seconds since the stop; ~0.37 s period, 2-3 visible rocks). Scale the peak with the arrival speed (`A = min(24°, 2.3 * sqrt(speed))`) so every letter whips differently. Horizontal arrivals rock as a skew about the baseline; vertical ones settle as a stretch and squash.

Wrong models: jumping straight to the biggest angle and springing back (the angle has no reason to start at its maximum), and leaning the whole time it moves (that is acceleration, not cruising). When a travel hands off to a settle, the value must be equal on both sides of the handoff, or the frame between them jitters.

- **Face weight is mass.** A heavy grotesk moves with more inertia (slower start, heavier spring, more follow-through); a hairline serif is nimble. A light face slammed heavily, or a heavy face fluttering in, contradicts itself.
- **Let letters arrive along their own lanes** without crossing: the middle letters vertically, horizontal entries only at the ends of the word where nothing is parked in the way.

## Motion that means what the words mean

| The words are about | Motion | Timing |
|---|---|---|
| urgency | fast, direct paths | under 0.5 s |
| authority | slow, centred, still | long holds, over 3 s |
| play | bounce and overshoot | springy |
| precision (specs, data, a terminal) | constant speed on a grid, dead stops with no settle | quantised to frames and beats |
| chaos | erratic, several axes | seeded irregular timing |
| elegance | smooth curves, soft settles | 1-2 s eases |

Direction carries meaning (growth rises, decline falls, progress follows the reading direction); speed carries meaning (fast is urgency, slow is weight); rhythm carries meaning (staccato is precise or aggressive, legato organic or emotional). "Breaking through" on a gentle fade refutes itself. The words, the music's character and the motion point the same way.

**The precision exception.** Constant-speed motion is otherwise banned, except as a deliberate machine voice: a driven thing (a print head, a counter, a terminal) moves at constant speed and stops dead with zero overshoot, because the motor absorbs the momentum. It is all or nothing: linear travel that then bounces, or an eased move that stops dead, both read as mistakes. Distances and durations snap to the grid, one context per film, never in the same shot as letters with mass.

## Writing that builds itself

A hand-written word is constructed, not uncovered. If the letterform exists before the brush touches it and paint merely reveals it, it reads as a mask (the pen kit's `p.text` is such a reveal: fine for a label, not for a written signature). Real writing:

1. Each letter is its stroke skeleton in writing order (for script, one body stroke per letter, joined exit to entry so the pen never lifts inside a word); the i-dots and t-crosses come after the whole word.
2. Smooth the few skeleton points into a dense path (Catmull-Rom), and render the stroke as a ribbon whose width follows pressure: downstrokes thick, upstrokes and joins thin, tapered over the first and last ~30 px. A constant-width stroke is the flat-weight tell.
3. The pen travels at a constant speed in px per frame, the ribbon cut at the live tip with a round nib, sized so the word and its dots finish with the full hold left.
4. Proof it is construction: mid-frames show real partial letters (an n that is still one leg, an i still undotted).

The exit runs the same pen backwards in reverse writing order.

## A letter that becomes a shape

For a strip that walks across a word and becomes its final letter, use [WORD-FOLD.md](WORD-FOLD.md), the sourced CoAnimator kit and its glyph/ending guides. [word-fold, SKILL.md]

To morph letters into shapes (or other letters), make the font vector at build time (`opentype.js` reads the font file; flatten each glyph's curves to points), resample every contour to the same count (~96) by arc length, wind them all the same way and start each at its topmost point, so nothing twists. Targets (a circle, a star, another glyph) use the same form; the morph is a straight blend of the point lists, eased in and out over ~0.45 s. A counter (the hole in O, R, P) pairs with a near-zero ring at the target's centre (radius ~0.01, not 1, which leaves a visible dot), so it closes on the way out and reopens on the way back. Shapes assembling into a word read as order only if each fragment carries its own colour and they resolve to one on arrival; without that they read as debris.

## Exits in the device's own voice

An exit is the reveal run backwards or one step too far, never a transform on the whole scene: typed text backspaces at an accelerating repeat with the caret alive; a drawn stroke retraces; letters that darted in launch back out of their lanes (leaning, never ringing, since they never arrive); a flip turns one flip too far, to edge-on, from its last rest pose; a morphed letter shrinks to nothing about its own centre. Exits run ~60-70% of the entrance and overrun the cut by a few frames, painted on top of what follows.

## Where copy lives: five composition models

Pick one per passage and write it into the shot list; mixing them inside a passage reads as a broken system.

| Model | Copy | The frame | For |
|---|---|---|---|
| Fixed anchor | one slot, every line cycles through it | still | manifestos over footage, maximum negative space |
| Accretion | copy builds up on one big canvas and never leaves | travels across the canvas | dense editorial energy, a piece made as one artefact |
| Growing line | one line anchored at its start, extending | still | long quiet narration |
| World-space type | an object standing in a 3D scene | parallax reveals it | type as architecture |
| Annotation | hairline marks tracked to the picture | follows the picture | measuring a world rather than stating over it |

- **Fixed anchor:** anchor the baseline to a real line in the picture (a horizon, a table edge), not the frame's centre; type on the picture's line sits in the shot, type at 50% sits on it. Small, constant size (cap height ~10% of the image); emphasis by weight and colour, not size.
- **Accretion:** a reading pocket stays fixed in screen space while the canvas travels beneath it, so each new run is read at rest in the pocket; holds and moving-text limits are budgeted in the pocket. Each new run starts at the end of the last one on a new baseline at a new angle (30-45°), and the camera counter-rotates so the active run reads near level (which is also what saves the rotation tax). Neighbouring runs at different angles differ in colour, or the reading order is ambiguous where they meet. Older runs step down a size tier (÷1.618) when a new one arrives; the smallest tier is texture and carries no reading time (without that rule the reading-time sum fails by the third run). A fixed corner mark steadies the moving canvas. It is a fast device: a new composition roughly every 0.9 s; slow pacing turns it to sludge.
- **Growing line:** start-anchored (right-anchored in right-to-left languages), never re-centring as it grows; the hold counts from the completed sentence. Quiet copy small and low-contrast in empty space, emotional peaks in large type; a flip of the ground colour is the scene change.
- **World-space type:** scenery passes in front of the letters (no occlusion, no illusion); the type takes the picture's white, never pure white; far type sits in the same haze and depth of field as far scenery.
- **Annotation:** 1 px light lines at low opacity, counting and measuring things that are really there (steps, slabs, a calculation beside the person doing it); boxes crop the picture into panels; numbers pinned to objects and tracked with them. Annotation of nothing is decoration.

## Speed-read: the one licensed short read

Copy pushed below the reading floor on purpose, where not keeping up is the message (overload, speed, "you can't keep up"); never a way to fit a long script into a short film. Its grammar: ~0.16 s a word, every sentence end held 3-4.5 times as long (the long hold is the full stop and the only thing keeping it parseable), the base rate tightening across the passage (5, 4, 3 frames a word at 25 fps, bursting to 2). One passage per film, at least one anchor line given the full comprehension target, and never the call to action or the line that must land. Declare it in the shot list: the smoke test will count its words as short reads, and that is the one place those counts are expected.
