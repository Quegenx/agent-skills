# Techniques

Recipes the shipped films used, each written to stay a pure function of time. Reach for one when the shot list calls for it; never add one because it looks cool.

## Camera

- **One camera.** A single transform on a world container, keyed `[t, zoom, x, y]`, zoom interpolated in log space (`lmix`). Never two camera moves at once.
- **Never reset at a handoff.** When content passes to the next scene, the next scene starts at the zoom the last one ended on. A camera that snaps back to 1.0 between scenes is the most visible seam there is.
- **Drift, don't hold.** Within a scene push slowly (1.0 → 1.04 is enough) so nothing freezes; never zoom in and then straight back out.
- **Zoom so the state fills the frame** (screen-studio style). The cursor and anything that must stay a fixed screen size scale inversely with the camera.
- **Lay the world out once** (a gallery, a page, a desktop) in world coordinates and fly the camera over it. Pull-backs, whip-ins and match cuts back are then exact, because they are the same coordinates.
- **The anchor camera.** Between moves the camera is never dead still. Layer small motions on top of the keyed camera, each a pure function of `t`: a *breath* (scale ±0.4% on a 4-6 s sine that divides the film or loop length), a *dip* (a 1-2% push that eases out and back over 0.6-0.9 s before a reveal), a *punch* (`hitPulse` on scale, +1-2%, on the payoff hit) and a *dolly* (`EASE.dolly`, 1.0 → 1.04 across a hold). One of these at a time, under the main move.
- **Push onto a control about its own centre.** Set the zoom origin exactly on the control being clicked: it becomes a fixed point of the scale, so the cursor and every hotspot computed for it stay on target through the whole push with no correction. Settle the push before the cursor arrives, hold it still through the click, release only after the state resolves; a camera moving during a click steals the click. Before choosing the scale, check every edge against the frame and any keep-out band: an edge at `e` grows to `e + (e − origin) · (scale − 1)`, so a card bottom at y 872 with the origin at y 395 can take 1.06 and no more under an 897 px line.
- **Never a bare zoom.** A move that is only scale (or only a sideways slide) reads machine-made; pair it with a little roll or a lateral drift, and let it settle into drift rather than stop dead (when the camera moves at all). No overshoot on the camera, and velocity continuous through every key.
- **The camera yields to the elements.** While elements perform a phrase, the camera parks; it moves in the gaps and carries the holds (the slow push on a held line). Duck camera drift fast (~0.1 s) when an element moves and release it slowly (~1 s). Camera accents may land with an element's hit, but the camera never rides the same axis the elements are using: if they move in the frame plane, the camera's motion lives in depth and roll. Drift stays anchored to the subject and never walks the focal element out of the inner ~8% of the frame.
- **Motivation leads.** The cause of a camera move is on screen ~0.35-0.45 s before the camera follows: the line appears, then the camera reacts.
- **Hold and glide** (for music-led motion graphics): the camera holds each section with breathing only, then makes one composed glide per musical section change, starting early enough to land on the new section's downbeat (~0.8 s into a loud section, ~1.7 s into a calm one), each landing pose different in zoom, height or roll. Scenes can sit side by side in one world so the glide is the scene change. Continuous reactive drift reads as camera shake, not design.
- **Drift keyed to the film's clock:** every always-on layer (breathing, drift, swell) is a function of the global `t`, never of a section index, or it jumps the frame the section changes.
- **Pan and tilt stay small on flat planes** (pan ≤ ~6°, tilt ≤ ~5°) or the planes turn edge-on; a big sweep across a scene is a truck (a translation, which gives parallax), not a pan. A zoom magnifies everything equally; a dolly changes how near and far relate.
- **Following a moving subject:** aim at where it will land, not where it is (its next stop, known in advance), look ~0.45 s ahead, and smooth the camera with a trailing average so it glides; cap the camera's speed so a burst of moves becomes one steady glide. A focal handoff blends to the new subject over ~1 s, and the old one stops moving while it happens.
- **Lead room.** A moving subject sits off-centre toward the edge it came from, so open space lies ahead of it.
- **A dolly zoom** (the vertigo shot) keeps the subject the same size while the background warps: move the camera from `d0` to `d` and set `fov = 2 * atan(tan(fov0 / 2) * d0 / d)`; ~2 s, eased both ways, once per film at most.
- **Parallax by depth.** Layers move at fixed ratios of the camera's pan: background 0.3-0.5×, midground 1×, foreground 1.2-1.6×. Two or three layers; more reads as a screensaver.
- **Powers of ten:** keep an on-screen scale ruler (1 m, 1 mm, 1 µm) updating with the zoom so the viewer always knows where they are. Start on a dot, open into windows, pull out until the whole desktop is a point, push back into another device. Log-space zoom keeps the speed even across scales.

## Pages that already animate (CSS, WAAPI)

An existing page or component with CSS animations can still be rendered deterministically: pause every animation and set its time from `t` inside `seek`:

```js
window.seek = (t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000 } }
```

Seeking the animations survives a compositor that ignores a faked clock. Playwright's `page.clock` (install, pause, `runFor(1000 / fps)` per frame) is the alternative for timers, but it only steps forward, so it cannot render frames out of order.

## Drags and cursors

- A drag is direct manipulation: while the cursor is held, the value is computed from the cursor's position; on release it springs back from wherever it was.
- One cursor, homing on the live position of its target (measured each frame), because the camera keeps creeping during holds.
- The cursor stays a constant screen size while the camera zooms, and its press is a small scale-down on the click frame.

## Seams

| Seam | Recipe | Trap |
|---|---|---|
| Shared element | the outgoing object becomes the incoming one: a chart point becomes a receipt's corner, a button grows into the page carrying its label | measure positions at runtime (`getBoundingClientRect`) for match cuts; don't hand-place them |
| Colour flood | a circle of the next colour grows from the clicked point and overscales past the farthest corner in ~0.3-0.35 s, then contracts into the next scene's object | shorter reads as a flash; smaller leaves a corner unchanged for a frame |
| Mask rise | text rises out of a mask line | a soft wipe through a glyph reads as another letter: reveal whole words or step glyph edge to edge |
| Iris | n blades around a polygonal aperture; each blade is its two vertices, both edge extensions and the short arc between them | the long arc fills the frame |
| Whip | an accelerating move with blur along its direction, cut at the blur peak; the next shot enters already moving | starting the next shot from rest kills the energy |
| Blur cut | the frame blurs 1 → 7 px into the cut and the next shot arrives blurred and sharpens | heavy blur can erase a shape completely: if a frame looks empty, lower the blur |
| Collision | the incoming element knocks the outgoing one off the same axis: one driver on a slight overshoot moves both, the incoming from off-frame to its rest over the whole driver, the outgoing from rest to off-frame in the opposite direction over only the first ~40-50% of it, with a 15-25° kick sized to the hitter's weight | two separate tweens drift apart and the hit stops reading as the cause |
| Hard cut | only on a beat or a drop, both sides moving, declared in `cuts()` so the pop scan doesn't flag it | a cut on a still frame reads as a mistake; smoke's `dead seams` counter fails a declared cut with either side at rest |

Every shot enters already moving (exponential ease-out, 12-19% of the remaining distance per frame reads well) and leaves on an accelerating move or a blur ramp. Outgoing text is gone before incoming text occupies the same space.

**The vector across a cut**:
- **Same axis, same direction, matched speed, mid-motion on both sides.** The exit is the first half of one curve and the entry its second half (an ease-in exit and the matching ease-out entry over the same distance and time), so the speed at the cut is equal. Travel about 12% of the frame, not off-screen; the outgoing side finishes fading about a quarter of the way through its move and the incoming side appears at about 0.35 opacity already mid-path, with the last fade dying right at the cut so no frame is empty. Paint the stage opaque, or a frame where both sides are partly transparent flashes the page colour.
- **One current.** Pick one direction for ordinary scene changes (for left-to-right reading, leftward) and keep it. The other directions are reserved and mean something when spent: upward for a conclusion rising above what came before, a push forward for going deeper into the same thought, a pull back for an arrival, a burst outward for leaving a world. Consecutive cuts in opposite directions read as a mistake; a change of direction needs a visible cause (a click, an impact) or a chapter boundary.
- **On the Z axis the direction is the sign of the scale change.** A shrinking exit answered by a grow-from-small entry is a mirror, the most common violation, because grow-from-small is the default entrance; the incoming scene's own intro animations inside the first half second count too. Continuing a push, the incoming framing must be equal or tighter than the outgoing one (a common landmark measured on both sides), or the push rubber-bands back out. Push through text: exit 1 to 1.2 with a blur to ~10 px, swap at the blur peak, enter 0.75 to 1; pull back: exit 1 to 0.8, enter 1.25 to 1. Peak blur is ~10 px for words (more smears letterforms into a glitch) and 18-20 px for a full-frame surface.
- **Pushing into a photo promises the payoff is inside it.** Either the subject lifts off its background and carries the next beat, or the image holds near full frame while labels and arrows draw on it. A push into a photo that then cuts to something unrelated is a transition pretending to be a technique; if neither payoff fits, don't enter the photo.

## Blur and smear

- Round blur: CSS `filter: blur()`, only while something moves fast or is mostly invisible; text lands sharp.
- Directional smear: an SVG `feGaussianBlur` with separate x and y `stdDeviation`, oriented to the motion.
- Zoom smear on a word or logo: 20-30 scaled, faded copies behind it.
- True motion blur comes from the renderer's sub-frames (`--sub 4`, 8 for fast moves); fake blur is for stylised smears only.

## Glass, goo, frosting

- **Liquid glass:** each glass element holds its own clone of the scene behind it, filtered through an SVG `feImage` displacement map (a rounded-rect distance field) with three `feDisplacementMap`s at slightly different scales for chromatic edges, then a top sheen, a bright rim and a soft lift shadow. `backdrop-filter: url()` misreads displacement maps in Chromium: clone the scene instead.
- **Cheap glass:** blur a copy of the scene ~14 px for the body, draw a lightly blurred copy magnified ~1.06× in a 12 px band along the edge, then milk, sheen, rim and shadow. Glass vanishes on plain white: put a slow aura or a blurred wash of the content behind it.
- **Frosted letters:** a blurred, lightened copy of the image behind, clipped to the glyphs.
- **Goo:** blur plus an alpha threshold, then composite the sharp source on top so the inside stays crisp.

## Type

- Text that swaps inside a morphing shape needs its own mask and its own enter and exit timing.
- A wordmark that squeezes: move every letter toward the anchor by the same factor and narrow its drawn width (a variable font's `wdth` axis), so the letters stay touching.
- Typography can be architecture: give words structural roles (a lintel, a support, a platform) built from their real glyph paths, and transition unrelated words by occlusion or matched edges, never by interpolating arbitrary path points.
- Speech typography follows phrases, pauses and emphasis, not a dance beat; give it at least one 400 ms moment of absolute stillness.
- Captions typed word by word land on each word's measured time; full stops never appear on screen.
- Measure text only after fonts load. A long product name won't fit where a short one did: scale the whole lockup to its span instead of letting a part fall off-frame.
- Right-to-left scripts (Hebrew, Arabic): set `direction: rtl` on the text element and check every reveal runs in reading order.

## Product UI that tells the truth

- **One data module.** Every number, name, row and price the film shows comes from one object at the top of the scene (`const DATA = {...}`), with `console.assert`s that the parts agree: the totals add up, the chart's last point equals the headline number, the dates run forward, the counter's end value is the value the copy names. The smoke test fails on the page error an assert raises. **No hand-typed numbers:** every figure on screen and in the narration script is read from `DATA` (a slot), never typed into copy, so a changed figure changes everywhere at once; live or dated data shows its source and as-of date on the card.
- **Counters** roll over 0.6-1.2 s on `EASE.out`, read `whole(t)`, use tabular figures (`font-variant-numeric: tabular-nums`) so the digits don't jitter, and land on the frame their cause lands; a final lock gets one tick and a small `hitPulse`.
- **Cursor physics.** One cursor, travel on `SPR.cursor` along a slight arc (never a straight line, never linear), arriving 80-150 ms before the click; the press is a 0.92 scale-down for ~80 ms; it hovers before it acts. Once the product acts on its own, the cursor leaves.
- **Typing cadence.** ~35 ms a character with ±40% seeded jitter, a pause of 120-250 ms at word starts and 300-500 ms before the last word, characters from `whole(t)`, the caret solid while typing and blinking ~2.4 Hz only when idle. Pasted text appears whole.
- **FLIP for layout changes.** When a list reorders or a card grows, compute both layouts, then animate each element's transform from its first box to its last (`getBoundingClientRect` at load, never per frame): the layout is truthful and the motion stays a transform.
- **Grow a panel without resizing anything** (a dropdown opening, a task list gaining rows, a composer stretching as text wraps): lay the layout out at its final, expanded size, put the panel's body in a mask of that final height, and start both the body and everything below it shifted up by the body's height; one tween brings both down together, so the growing edge and the content it pushes stay in contact by construction. Collapse is the same tween back. Never tween `height`.
- **Scrub a chart that is already drawn.** One driver from 0 to 1 moves a tracking line, a marker and a tooltip; the marker's height is interpolated from the same data array that drew the line (a separately keyed marker floats off it), and the tooltip's text changes only when the nearest data point changes, in a fixed-width box with tabular figures.
- **Reskin the whole scene around one thing that never moves** (a composer cycling through four editor themes, a checkout through brand skins): each skin is a complete pre-styled layer holding everything that changes (ground, chrome, type, radii, icons, logos), and switching is a ~0.3 s crossfade between two whole layers; the anchor is drawn once, above every skin, and never moves.
- **A message bubble grows from its tail.** Sent bubbles scale from their bottom-right corner, received ones from their bottom-left (`transform-origin` on the corner the tail points from), with a small slide from their own side; never from the centre.
- **Real states only.** Loading, empty, error and success states look exactly like the product's own; a spinner shows only for as long as the product would spin. A button that shows a loading state keeps its width, as the product's own does.
- **Real components, on the film's clock.** When the film reuses the product's own components, any that run their own clock (a motion library, `requestAnimationFrame`, `setInterval`, CSS keyframes, a video, a shader) or load images asynchronously (an avatar that can paint empty on the sampled frame) get a twin: the same structure, classes and tokens, with the clock replaced by `t` and the image awaited (`img.decode()`) before the frame. Note in the twin which component it copies and why.
- **Dashed borders crawl while a box resizes**, because the dash pattern restarts from the corner each frame. Draw them as SVG strokes at a fixed dash pitch.
- **Only the product's own surfaces.** No card fill, outline, tint or shadow the product does not use; a colour that animates is a hex token, because `color-mix()` and CSS variables can't be interpolated.

## Code on screen
 Highlight the code once at load with a real highlighter (Shiki tokens, or the editor theme's own colours) and keep the tokens as data, so every frame draws the same spans; set it at video scale (22-28 px mono at 1920 wide), never a 13 px editor screenshot.

| Moment | Build it as |
|---|---|
| a diff hunk | the before and after lined up by a longest-common-subsequence match: removed lines collapse in red, added lines open in green, staggered |
| a rename, refactor or signature change | a morph: tokens shared by both versions glide to their new positions (FLIP), leaving tokens fade out, new ones fade in |
| new code | typed on per character with a caret, paced so it finishes inside the shot (a long snippet in a short shot never completes) |
| one changed line | a band sweeps that line and the rest dims |
| a long file | the camera scrolls to centre the line and dims the rest |
| failing to passing | the red line morphs to the green one, then the passing line is highlighted |

Code alone doesn't show what the change does. For any change with a visible behaviour, add a mechanism beat: retry and backoff as a request firing, failing, waiting longer each time, then succeeding; caching as two lanes racing, one to the database, one to the cache; concurrency as a serial lane splitting into parallel lanes; a race or ordering bug as the broken flow dropping items, then the fixed one; performance as two bars or timelines racing with the new one finishing first; a refactor as a tangled call graph untangling with the same inputs giving the same outputs; a new endpoint or state as data flowing down the new path, a state machine lighting step by step. Draw it, run it, let it settle.

## Small recipes and their traps

- **A tracking box** (object detection): derive the box from the target's position in the same frame, never tween it separately (a box that trails reads as a broken tracker); corner L-brackets, not a full border; size jittering a few percent off the tempo, as if re-fitting; a confidence figure flickering in a tight band (95-99) in mono.
- **Words lighting up as they are spoken:** one linear driver over the phrase computes every word's envelope from its timestamps (attack, sustain until the word ends, release to a rest level); the glow is a `text-shadow` so it hugs the glyphs; the brand word sustains 1.5-2× longer; hold at least 1 s after the last word.
- **A camera that follows typing:** the line sits still until the caret crosses a set fraction of the frame width, then the world shifts so the caret stays at that x; the two phases meet at the same position, so the hand-off is invisible. Measure the real glyph widths, never characters × font size.
- **Icons that come alive inside** (clock hands, fan blades, a pulsing dot, flowing dashes): rotate a part about an explicit interior point with the SVG `transform` attribute (`rotate(a cx cy)`); CSS `transform-origin` with `fill-box` is unreliable on thin lines and small shapes. Offset the parts' phases; small amplitudes; round line caps on dashed flows.
- **A slot-machine ticker:** a mask exactly one item tall over a stack of equal-height items; each step is its own spring with a slight overshoot, the steps overlap, and the stack's offset is the sum of the springs (a single tween to the end becomes a smooth scroll); move the same items, never swap their contents; tabular figures for numbers.
- **A glitch accent:** quantize time (offsets hold for a step, then jump; interpolated offsets read as wobble), every offset a hash of the step and the layer, scaled by one envelope that falls to exactly zero, then a hard reset; the clean copy stays on top and readable; the burst is short and the clean hold after it is the beat.
- **A gradient sweeping through text:** `background-clip: text` (with the `-webkit-` prefix and transparent colour) on a background wider than the text (`background-size: 300% 100%`; at 100% a position tween does nothing); the percentage axis runs backwards (`100%` to `0%` moves the light left to right); linear easing, so it reads as light; equal first and last stops for a seamless crawl.
- **Scatter and reassemble in depth:** each piece's scattered position comes from its index (golden-angle spread, stepped depth), placed before any tween so frame 0 shows the cloud, not the finished layout; `perspective` on the scene and `preserve-3d` on the stage and every piece, or the depth flattens; it resolves flat, rotations zero.

- **Circular reveals and floods that don't slide or peek.** A photo that opens out of an object (a knob, a pin, a sun) is drawn at its *final* position and size from the first frame, inside a circular clip centred on the exact point it is born from; only the clip's radius animates, out to the distance from that point to the photo's farthest corner. Move or scale the photo during the reveal and it jumps when the clip finishes. Grow a flood's radius as `R·sqrt(p)` so the covered area grows evenly (a linear radius looks still at first and rushes at the end), with the curve applied to `p`. The shape underneath must never show around the growing one: either the parent *is* the growing shape (one element whose geometry morphs), or it is hidden in the frame the reveal first covers its silhouette; check the corners on a strip, where rounded radii leak first. Text inside a growing card keeps its own timing (the template's `swap`), entering after the morph has started and leaving before the next one.

- **Paper confetti, closed form**. Only when a celebration is the story and an event on screen fires it: confetti as decoration is a borrowed prop (frame-review `TELLS.md` A3). The library steps each piece once per animation frame with `Math.random` and re-rolls a flicker value every tick, so it can't be filmed as it is; its model solves exactly. Per piece `i`, from a seeded `rng`: speed `v0` between 0.5 and 1.5 of the start velocity (45), launch angle within the spread (45° around the aim), wobble phase 0-10 and wobble speed 0.05-0.11 per tick, tilt 0.25-0.75π. At tick `n = (t - t0) * 60` (whole ticks through `whole(t)`, or fractional for smooth blur), with decay `d = 0.9`: travel `s = v0 * (1 - d^n) / (1 - d)`, so `x = x0 + cos(a) * s + drift * n` and `y = y0 + sin(a) * s + 3 * gravity * n`; wobble `w = w0 + speed * n`, tilt `= tilt0 + 0.1 * n`; opacity `1 - n / 200`. Draw each piece as a quad from `(x, y)` to its wobble point `(x + 10 cos w, y + 10 sin w)`, both offset by a factor times the tilt's cos and sin; make that factor a seeded hash of `(i, n)` in 2-3, never a fresh random. Its seven default colours are a stock rainbow: take the brand's two or three. Pieces scale with `scalar`; the burst reads at about 50-150 pieces, one burst, timed to the hit's sound.

## Loops

- **A loop is a cycle, not a clip.** Every periodic motion divides the loop length, the last state equals the first, and `track` keys wrap (the template does this when `FILM.loop` is set). The seam test in `smoke.mjs` compares the last frame with the first.
- **Frame 0 sits mid-hold**, never mid-morph: it is the thumbnail, and the seam hides inside a hold.
- **Stagger phases** of repeated elements (`hash(i)`) so they never all change on the seam frame.
- **Noise that loops:** sample the noise along a closed circle, `noise(x + R * cos(phase), y + R * sin(phase))` with `phase = 2π t / period`, so the field returns exactly to its start; a scrolling noise moves a whole number of cells per period. A background loop runs slowly (8-30 s periods) at low contrast, and text over it gets a scrim if the contrast drops.

## Colour

- **Colour-blind-safe series:** when a chart or diagram needs several distinguishable colours and the brand has no set of its own, Bang Wong's palette (Nature Methods, 2011) holds for the common colour-vision deficiencies: `#E69F00` orange, `#56B4E9` sky blue, `#009E73` bluish green, `#F0E442` yellow, `#0072B2` blue, `#D55E00` vermillion, `#CC79A7` reddish purple, with black.
- **Grading footage with people:** skin of every complexion sits on one narrow line on a vectorscope (between red and yellow, about 123°); a grade that pushes skin off it reads orange, green or grey at once, so check a frame with skin after every grade and keep saturation modest on people.
- **Mix in OKLab, not sRGB.** A spring or tween between two saturated colours through sRGB dips through a muddy grey; convert both ends to OKLab, interpolate there, convert back. For a flood between black and white, use the template's `#flood`.
- **Gradients band in 8 bits.** A CSS gradient between two close neutrals shows contour rings that no encoder can fix. Bake it: `uv run scripts/gradient.py --stops "#0B0C0E@0,#16181C@1" --linear 180 --out assets/bg.png` (OKLab, triangular dither, `--radial cx,cy,rx,ry` for a vignette, `--size 1080x1920` for vertical, `--preview` writes a ×12 contrast stretch where bands would show) and use the PNG as the stage.
- **A palette is one primary, one accent and two or three neutrals.** Contrast comes from lightness and chroma, not more hues. Tint the neutrals a hair toward the primary's hue (OKLCH chroma 0.005-0.02) so the frame feels like one kit; on a dark stage the accent gets high lightness (L 0.7-0.85) and moderate chroma (0.12-0.18), never maximum, which vibrates. Hues of equal visual weight share L and C in OKLCH and differ only in H.
- **Grade in order:** exposure and white balance, contrast, saturation and midtones, split-tone (shadows and highlights tinted separately, under ~0.15 strength), then one unifying tint or vignette; the same chain on every shot so the cuts match.
- **Judge colour in a browser, never QuickTime,** which applies its own gamma (~1.96) and shows files darker or lighter than the web will. To prove a render shifted colour, put a 50% grey patch (128) in a frame, render, and sample it back from the MP4: more than ~2-3 levels off means a transfer mismatch somewhere in the chain.
- **Several looks of one film.** `STYLES` holds named token sets (`paper`, `night`); every fill has its matching text colour (`onX`), so a restyle never strands text on its own colour. `?style=night` previews; `render.mjs full --style night` renders. Timing, layout and story never change between styles.

## Finish and texture

One finish per film, chosen with the look: clean and flat (deliberately: crisp vectors, disciplined shadows, grain at ~0.03); premium tech (glow, chromatic edges only at peaks, grain 0.04-0.06); paper and cut-out (paper fill, torn edge, hard shadow, boil on the heroes, grain); riso and print (one or two inks, halftone, misregistration, heavy grain); hand-drawn (rough strokes, boil on everything, grain); stop-motion (cut-out on twos with per-pose jitter); retro broadcast (scanlines, 1-2 px constant aberration, heavy grain). An untreated flat fill is a draft unless clean and flat was the choice.
- **Grain** is fresh every 2 frames, 0.05-0.15 opacity in overlay (lower on dark scenes: it lifts blacks), over everything, last. Raw SVG turbulence is coloured confetti, mid-grey mush and a noisy alpha: desaturate it, push its contrast and force its alpha to 1, or it is invisible. Grain is expensive to encode, and a fresh pattern every frame is the worst case: hold it at ~12 Hz, as real film grain does. `render.mjs --grain` does this (luma only, held at 12 Hz, `-tune film`); on the example film per-frame grain encoded at 105 MB and the held grain at 36 MB, against 0.45 MB with none, so plan the CRF or bitrate for it.
- **One clock for texture:** when a film boils, every textural layer (letter boil, grain, ambient colour fields) changes on the same held step (`Math.floor(t * fps / 3)`), and ambient motion is computed smooth and sampled on that step. Quantise the world, never the focal action.
- **Letters that boil:** long, gentle, single-octave waves (baseFrequency ~0.003 by 0.006, displacement ~6), four poses held 3 frames each and snapped, never interpolated or drifted (a drifting field crawls at the edges); give the filter region generous margins so ascenders don't clip. Never on a container whose children use 3D transforms.
- **Cut-out paper:** a rough edge (turbulence ~0.04 into a displacement of 4-10), a hard shadow 2-6 px with 0-1 px blur (a soft shadow breaks it), and a resting tilt of about ±1.2°, all seeded per element and held still.
- **Riso:** one or two mid-value inks, the top one 0.6-0.8 opacity in multiply (two dark inks multiply to sludge), a static seeded misregistration of 1-3 px, a halftone dot pattern, heavy grain.
- **Sticker:** the same art stacked behind itself with a thick white round-joined stroke (8-18 px), a hard 4 px shadow and a ±1° tilt; outline the word's shape, never each letter. **Long shadow:** ~24 copies offset one pixel each in one solid darker colour (low-alpha copies smear). **Light leak:** a large radial blob in screen blend on a slow sine, ≤ 0.25 opacity.
- **Procedural paper:** an SVG rect filtered with turbulence must have an explicit `fill`; a rect with no fill is black and multiplies the texture to mud.
- **Ordered-dither reveal** (a pixel brand, a retro or print look): a cell of `cell` px lights when `BAYER[row & 3][col & 3] < clamp((front - pos) / band)`, with `BAYER` the 4x4 matrix `[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]` scaled by `(v + 0.5) / 16`, `front = progress * (1 + band)`, `band` about 0.45 and `pos` the cell's 0-1 position along the sweep (up, down, left, right, or the distance from the centre for out and in). Paint the lit cells per frame into a canvas or a clip path at whole-pixel cells with `image-rendering: pixelated`; one density function gives a flood, a thinned band behind words and a calm wallpaper.
- **Treating supplied footage**: pick the smallest change that answers the request (a correction before a look, a look before an effect), and a period treatment (VHS, 8 mm, halftone print, CRT, ASCII) only when the story calls for that medium, never on UI, product shots, small text or footage whose colours must stay exact. Check consecutive frames for smeared faces, frozen noise, hard edge tears and blank borders. A whole-frame blur or pixelate does not hide one face, plate or address: that needs its own masked layer or a tracker. Don't run HDR or log footage through an SDR grade unconverted.
- **A flowing colour-field ground:** a light warm base, 5-7 large soft colour blobs (radius ~330-470 at 1080p) drifting slowly, hot grain over it, ink-coloured type with no glow; the grain and a letter boil fuse type and ground.

## Chromium traps

| Trap | What you see | Fix |
|---|---|---|
| a canvas read back with `getImageData` again and again | the same frame paints slightly differently after many reads | `getContext('2d', { willReadFrequently: true })` on any canvas you sample |
| `filter` or `opacity` below 1 on any ancestor of a `preserve-3d` space (a blur wrapper, a fading container, a sample-stacking motion-blur component) | the 3D space flattens; near and mid planes vanish | blur, fade or warp each plane on its own; nothing on the space or its parents |
| a declared font nothing has used yet | frame 0 paints in a fallback face (`document.fonts.ready` doesn't load unused faces) | the renderer and smoke test load every declared face before frame 0 and fail on one that won't load |
| `will-change` on a scaled layer | text rasterizes blurry under the camera | remove it |
| `will-change` with an animated `filter: blur()` | nondeterministic ghost frames | remove it |
| fractional `left/top` plus a transform | jitter: snaps to whole pixels | all translation in one `transform` |
| `getBoundingClientRect` on an element under a scaled or rotated camera | an underline or connector fitted to a word comes out the wrong size, only in some shots, depending on when fonts finished loading | measure with layout metrics (`offsetLeft`, `offsetTop`, `offsetWidth`, `offsetHeight`), which ignore ancestor transforms; use client rects only for screen-space positions |
| an angled `linear-gradient` light sweep on a tall box | a hard diagonal seam instead of a soft bar: the stops land at different heights on the two edges | keep the gradient axis at 90° and skew the element (`skewX(-14deg)`), oversized (`top: -24%; height: 148%`) so the skewed corners never enter the frame |
| a `gap` or `margin` in `em` on a flex row of big words | near-zero gaps: `em` resolves against the container's own font size (often 16 px), not the 150 px type inside it | set the gap in px, or put the font size on the container |
| slow vertical text rise | a 1 px tick every few frames in the tail | `arrive()` |
| `opacity`/`filter` on `preserve-3d` | the 3D flattens, both faces show | fade a wrapper |
| `backdrop-filter: url(#displace)` | displacement misread | clone the scene behind the glass |
| `visibility: visible` child of a hidden parent | the child shows through | `inherit` |
| text measured before fonts load | wrong widths, overlaps in the first frames | measure after `document.fonts.ready` |
| CSS gradient between close colours | banding rings | `gradient.py` |
| huge `blur()` radius on a big layer | a frame takes seconds, or blanks | blur a downscaled copy, or lower the radius |
| `mix-blend-mode` over a transparent root | a different blend than the preview | give `body` an opaque background |
| canvas sized in CSS pixels only | soft edges at `--scale 2` | size the backing store by `devicePixelRatio` |
