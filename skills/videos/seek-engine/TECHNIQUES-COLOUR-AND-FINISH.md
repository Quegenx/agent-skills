# Techniques: collections, loops, colour, finish and Chromium traps

Moved from [TECHNIQUES.md](TECHNIQUES.md) to keep each file under the size cap. Collections (arrangements and poses), loops, colour, finish and texture, and the Chromium traps table

## Collections: arrangements and poses

A gallery, a card fan, a carousel, a ring of screens or a helix of products is one function: each item's pose from its offset to the focus. Store the pose as separate numbers and blend them one by one; never interpolate transform matrices or composed `transform` strings, which take unpredictable paths when an item goes from a curve to flat.

```js
const lerp = (a, b, p) => a + (b - a) * p;
const lerpAngle = (a, b, p) => a + ((((b - a) % 360) + 540) % 360 - 180) * p;   // the short way round: 350 to 10 passes 0
const pose = (o = {}) => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, ...o });
const blendPose = (A, B, p) => ({
  x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), z: lerp(A.z, B.z, p),
  rx: lerpAngle(A.rx, B.rx, p), ry: lerpAngle(A.ry, B.ry, p), rz: lerpAngle(A.rz, B.rz, p),
  s: lerp(A.s, B.s, p), o: lerp(A.o, B.o, p),
});
const toTransform = (P) =>
  `translate3d(${P.x}px, ${P.y}px, ${P.z}px) rotateY(${P.ry}deg) rotateX(${P.rx}deg) rotateZ(${P.rz}deg) scale(${P.s})`;

// d = index - focus(t): fractional while the collection moves
const arrange = {
  list: (d) => pose({ x: d * 260 }),
  coverflow: (d) => {
    const near = clamp(d, -1, 1);                                  // the neighbours turn, the rest stack flat behind
    return pose({ x: near * 200 + (d - near) * 90, z: -Math.abs(near) * 180, ry: -near * 55 });
  },
  ring: (d, n, radius = 600) => {
    const a = (d / n) * 2 * Math.PI;
    return pose({ x: radius * Math.sin(a), z: radius * (Math.cos(a) - 1), ry: (a * 180) / Math.PI });
  },
};

// changing shape: both arrangements at the same d, blended by one eased progress
const itemPose = (i, t) => blendPose(arrange.coverflow(i - focus(t)), arrange.list(i - focus(t)), ease(progress(t)));
```

- **Change shape from wherever the items are.** Both shapes are evaluated at the item's current offset, so a shape change can start mid-scroll or mid-way through another change and nothing jumps. Chained changes blend the pose of the previous blend, not the previous shape's rest pose.
- **The group moves as one.** Keep every arrangement ordered along the offset (an item further along is further along in x or angle), and a change of shape never makes paths cross: the collection turns, spreads or gathers in one direction. Items flying past each other read as chaos, not as one state becoming another.
- **An endless strip from a dozen items:** wrap the offset into a half-open window, `d = ((((i - focus) % n) + n + n / 2) % n) - n / 2`, and fade opacity to zero over the last unit before the edge (`clamp((n / 2 - Math.abs(d)) / 1, 0, 1)`), so the item that jumps from one end to the other is invisible when it jumps.
- **Speed shapes the items.** The collection's velocity is a function of time too: `v = (focus(t) - focus(t - 1 / fps)) * fps`, in items per second. Tilt each item by `clamp(v * 14, -40, 40)` degrees, or offset it in a ripple by its index; it leans into a fast throw and straightens as the throw settles. Clamp it, or a fast scroll folds the items edge-on.
- **From the curve into a flat detail view:** blend the item's pose toward a flat target pose (every rotation 0, the detail box's position and scale). Let the rotations finish in the first half of the move and lift the item toward the camera early (z up, then over), so it untwists clear of its neighbours instead of slicing through them. Closing runs the same blend backwards to the item's current slot pose, which may have moved.
- **The sharp version arrives after the move.** For a detail view, swap the thumbnail for the full-resolution image only after it has decoded (`await img.decode()` during setup, never during a frame), and crossfade it over the thumbnail: no flash and no layout jump.
- **Enter and exit as part of the shape:** a new item enters at the offset where it belongs (fading or growing from its slot, or sliding along the curve), not from the centre of the screen.

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
- **Grain** is fresh every 2 frames, 0.05-0.15 opacity in overlay (lower on dark scenes: it lifts blacks), over everything, last. Raw SVG turbulence is coloured confetti, mid-grey mush and a noisy alpha: desaturate it, push its contrast and force its alpha to 1, or it is invisible. Grain is expensive to encode, and a fresh pattern every frame is the worst case: hold it at ~12 Hz as this recipe's creative/compression choice. The old line said real film grain does this; Kodak describes independent grain patterns in each frame. [Kodak, Capturing Information on Film](https://www.kodak.com/content/products-brochures/Film/Capturing-Information-on-Film.pdf), [Kodak grain description](https://patents.google.com/patent/US7092016B2/en). `render.mjs --grain` does this (luma only, held at 12 Hz, `-tune film`); on the example film per-frame grain encoded at 105 MB and the held grain at 36 MB, against 0.45 MB with none, so plan the CRF or bitrate for it.
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
| Grouping values on an element: `opacity` below 1 or `filter` other than `none` | that element's used `transform-style` becomes `flat`, even if `preserve-3d` was specified | preserve the film source's per-plane blur/fade treatment; inspect the actual 3D context boundary before applying an effect to a wrapper. The old rows said both "any ancestor" and "fade a wrapper", without defining that boundary. [MDN transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style); [original TECHNIQUES-COLOUR-AND-FINISH.md, Chromium traps] |
| a declared font nothing has used yet | frame 0 paints in a fallback face (`document.fonts.ready` doesn't load unused faces) | the renderer and smoke test load every declared face before frame 0 and fail on one that won't load |
| `will-change` on a scaled layer | text rasterizes blurry under the camera | remove it |
| `will-change` with an animated `filter: blur()` | nondeterministic ghost frames | remove it |
| fractional `left/top` plus a transform | jitter: snaps to whole pixels | all translation in one `transform` |
| `getBoundingClientRect` on an element under a scaled or rotated camera | an underline or connector fitted to a word comes out the wrong size, only in some shots, depending on when fonts finished loading | measure with layout metrics (`offsetLeft`, `offsetTop`, `offsetWidth`, `offsetHeight`), which ignore ancestor transforms; use client rects only for screen-space positions |
| an angled `linear-gradient` light sweep on a tall box | a hard diagonal seam instead of a soft bar: the stops land at different heights on the two edges | keep the gradient axis at 90° and skew the element (`skewX(-14deg)`), oversized (`top: -24%; height: 148%`) so the skewed corners never enter the frame |
| a `gap` or `margin` in `em` on a flex row of big words | near-zero gaps: `em` resolves against the container's own font size (often 16 px), not the 150 px type inside it | set the gap in px, or put the font size on the container |
| slow vertical text rise | a 1 px tick every few frames in the tail | `arrive()` |
| `backdrop-filter: url(#displace)` | displacement misread | clone the scene behind the glass |
| `visibility: visible` child of a hidden parent | the child shows through | `inherit` |
| text measured before fonts load | wrong widths, overlaps in the first frames | measure after `document.fonts.ready` |
| CSS gradient between close colours | banding rings | `gradient.py` |
| huge `blur()` radius on a big layer | a frame takes seconds, or blanks | blur a downscaled copy, or lower the radius |
| `mix-blend-mode` over a transparent root | a different blend than the preview | give `body` an opaque background |
| canvas sized in CSS pixels only | soft edges at `--scale 2` | size the backing store by `devicePixelRatio` |
