# Filters

An SVG filter is a chain of primitives (`fe*` elements) inside a `<filter>` element; each primitive takes an input image, does one operation and passes its result on. The filter is never rendered itself: SVG elements use it through the `filter` attribute, and SVG or HTML elements through the CSS `filter` property. Three things decide most outcomes: the filter region (pixels outside it are clipped, so big blurs and shadows get cut off), how inputs are wired (`in`, `in2`, `result`), and the color space (`linearRGB` by default for primitives, `sRGB` for CSS filter functions). Masks and clips are in [CLIP-AND-MASK.md](CLIP-AND-MASK.md).

**Contents:** [The filter element](#the-filter-element) · [Wiring primitives](#wiring-primitives) · [color-interpolation-filters](#color-interpolation-filters) · [Primitives](#primitives) · [Worked examples](#worked-examples) · [Gooey: blur plus alpha threshold](#gooey-blur-plus-alpha-threshold) · [Glass: refraction with feDisplacementMap](#glass-refraction-with-fedisplacementmap) · [CSS filter and url()](#css-filter-and-url) · [Performance](#performance) · [Prove it](#prove-it)

## The filter element

- **Put the `<filter>` in `<defs>`** and fill it with primitives, basic operations that build on the previous ones. Apply it with `filter="url(#id)"`.
- **Attributes:** `x`, `y`, `width`, `height` (the filter region), `filterUnits`, `primitiveUnits`. `xlink:href` is deprecated.
- **The default region is `x`/`y` `-10%`, `width`/`height` `120%`,** because many effects such as `feGaussianBlur` extend beyond the element's bounds; the margin keeps them from being clipped.
- **Pixels outside the region are clipped.** For larger `stdDeviation` values, expand the region further:

```html
<filter x="-30%" y="-30%" width="160%" height="160%">
```

- **`filterUnits`** (system for the region's `x`, `y`, `width`, `height`): `objectBoundingBox` (default), fractions or percentages of the referencing element's bounding box; `userSpaceOnUse`, the referencing element's user coordinates.
- **`primitiveUnits`** (system for length values inside primitives and for primitive subregions): `userSpaceOnUse` (default) or `objectBoundingBox`, fractions of the referencing element's bounding box.
- **Build step by step.** Filters act like layers: apply and test the effect one primitive at a time.

## Wiring primitives

- **Every primitive takes** the subregion attributes `x`, `y`, `width`, `height` and a `result` name.
- **`in` values:** `SourceGraphic`, `SourceAlpha` (the same graphic, alpha channel only), `BackgroundImage`, `BackgroundAlpha`, `FillPaint`, `StrokePaint`, or a previous `result` name.
- **A missing `in`** means `SourceGraphic` on the first primitive and the previous primitive's result on later ones.
- **`result` names a primitive's output** for `in` (or `in2`) on a later primitive in the same filter. It is not an XML id and can only be referenced inside that filter. If a name repeats, a reference uses the closest preceding primitive with it.
- **`BackgroundImage` is not supported as a filter source in modern browsers.** Load the image inside the filter with `<feImage>` instead. Firefox (bug 455986) can't make `feImage` load fragments of the document (circles, rectangles, paths).

```html
<filter id="imageMultiply">
  <!-- This is a workaround. -->
  <feImage href="mdn_logo_only_color.png" x="10%" y="10%" width="80%" height="80%" />
  <feBlend in2="SourceGraphic" mode="multiply" />
</filter>
```

## color-interpolation-filters

- **Primitives work in `linearRGB` by default;** every other color interpolation (`color-interpolation`, initial `sRGB`) works in `sRGB`. Values: `auto`, `sRGB`, `linearRGB`. Animatable: discrete.
- **Set `color-interpolation-filters="sRGB"`** to make a primitive use sRGB. MDN's own HTML filter examples set it on `feConvolveMatrix` and `feColorMatrix`.
- **It has no effect** on `feOffset`, `feImage`, `feTile` and `feFlood`, nor on CSS filter functions, which operate in sRGB.
- **The CSS property wins** over the attribute.

## Primitives

| Primitive | Does | Key attributes and defaults |
|---|---|---|
| `feGaussianBlur` | Blurs; `stdDeviation` defines the bell curve | `stdDeviation` one value (both axes) or two (x then y), default `0`; `edgeMode` `duplicate`, `wrap`, `none`, default `none` |
| `feOffset` | Shifts the input image as a whole | `dx`, `dy` |
| `feColorMatrix` | Multiplies every pixel's `[R,G,B,A]` by a matrix | `type` `matrix`, `saturate`, `hueRotate`, `luminanceToAlpha`; `values` (see below) |
| `feComponentTransfer` | Remaps each channel (brightness, contrast, color balance, thresholding) | Children `feFuncR`, `feFuncG`, `feFuncB`, `feFuncA` with `type` `identity`, `table`, `discrete`, `linear`, `gamma` |
| `feComposite` | Porter-Duff combination of `in` and `in2` | `operator` `over` (default), `in`, `out`, `atop`, `xor`, `lighter`, `arithmetic` with `k1` to `k4` |
| `feBlend` | Combines two images with a blend mode | `in`, `in2`, `mode` (a CSS `<blend-mode>`, default `normal`) |
| `feMerge` | Applies effects concurrently instead of sequentially, stacking results | `<feMergeNode in="...">` children |
| `feFlood` | Fills the subregion with a color | `flood-color`, `flood-opacity` |
| `feDropShadow` | Drop shadow of the input; only inside a `filter` | `dx` `2`, `dy` `2`, `stdDeviation` `2`, `flood-color`, `flood-opacity` |
| `feTurbulence` | Perlin turbulence texture (clouds, marble) filling the subregion | `baseFrequency` default `0` (two values: horizontal, vertical), `numOctaves` integer default `1` (no negatives), `seed` `0`, `stitchTiles` `noStitch` (default) or `stitch`, `type` `fractalNoise` or `turbulence` |
| `feDisplacementMap` | Moves pixels of `in` by the values of `in2` | `scale` (in `primitiveUnits`), `xChannelSelector`, `yChannelSelector` `R`, `G`, `B`, `A`, default `A` |
| `feMorphology` | Thins (erode) or fattens (dilate) | `operator` `erode` (default) or `dilate`; `radius` one or two values, default `0` |
| `feDiffuseLighting` | Lights the image using its alpha as a bump map; opaque RGBA output | A light source child such as `<fePointLight x y z>` |
| `feSpecularLighting` | Phong specular light, viewer at infinity in z | A light source child |
| `feImage` | Loads an image into the filter | `href`, `x`, `y`, `width`, `height` |
| `feConvolveMatrix` | Not described further here | `edgeMode` default `duplicate` |
| `feTile` | Not described further here | |

### feColorMatrix

- **Formula:** `R' = r1*R + r2*G + r3*B + r4*A + r5`, and the same for G, B, A; results are clamped to 0 to 1. It is a 5x4 matrix (5x5 with a constant last row).
- **`values` by `type`:** `matrix` takes 20 numbers; `saturate` one number from 0 to 1; `hueRotate` one number in degrees; `luminanceToAlpha` none. Defaults resolve to the identity (identity matrix, saturate `1`, hueRotate `0`). Start manipulating from the identity:

```plain
     R G B A W
R' | 1 0 0 0 0 |
G' | 0 1 0 0 0 |
B' | 0 0 1 0 0 |
A' | 0 0 0 1 0 |
```

  Grayscale:

```html
<filter id="f2">
  <feColorMatrix values="0.3333 0.3333 0.3333 0 0
                         0.3333 0.3333 0.3333 0 0
                         0.3333 0.3333 0.3333 0 0
                         0      0      0      1 0" />
</filter>
```

### feComposite, feComponentTransfer and lighting

- **`over` is also used** when no operator or an unsupported one is given.
- **Arithmetic** computes `result = k1*i1*i2 + k2*i1 + k3*i2 + k4`; it is meant for combining `feDiffuseLighting` and `feSpecularLighting` output with texture data. Combine diffuse light with a texture through the multiply term, and specular light through the add term.
- **Several lights** are several light maps added together.
- **`feComponentTransfer`** works on non-premultiplied values; a missing channel function is the identity, and with duplicates the last one wins.
- **`feTurbulence` with `noStitch`** makes no attempt at smooth transitions at tile borders and can show clear discontinuities there; with `stitch` the user agent adjusts the base frequency so the subregion's width and height hold a whole number of tiles for the first octave.

### feDropShadow

```html
<filter id="shadow"><feDropShadow dx="0.2" dy="0.4" stdDeviation="0.2" /></filter>
<filter id="shadow2"><feDropShadow dx="0" dy="0" stdDeviation="0.5" flood-color="cyan" /></filter>
<filter id="shadow3"><feDropShadow dx="-0.8" dy="-0.8" stdDeviation="0" flood-color="pink" flood-opacity="0.5" /></filter>
```

### feDisplacementMap

- **Formula:** `P'(x,y) ← P(x + scale * (XC(x,y) - 0.5), y + scale * (YC(x,y) - 0.5))`.

```html
<svg width="200" height="200" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
  <filter id="displacementFilter">
    <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
    <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="50" xChannelSelector="R" yChannelSelector="G" />
  </filter>
  <circle cx="100" cy="100" r="100" filter="url(#displacementFilter)" />
</svg>
```

### feMorphology on HTML

```html
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
  <filter id="erode"><feMorphology operator="erode" radius="1" /></filter>
  <filter id="dilate"><feMorphology operator="dilate" radius="2" /></filter>
</svg>
```

Apply with CSS `filter: url("#erode")`.

## Worked examples

### Classic drop shadow

Blur `SourceAlpha`, offset the blur, then merge it under `SourceGraphic`. MDN's SVG filters guide, verbatim:

```html
<defs>
  <filter id="drop-shadow">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
    <feoffset in="blur" dx="4" dy="4" result="offsetBlur" />
    <feMerge>
      <feMergeNode in="offsetBlur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</defs>
```

- **Spell it `feOffset`.** The guide's snippet writes `feoffset` in lowercase; the element reference names it `feOffset`.

### Drop shadow plus specular lighting

MDN's filter tutorial adds a lit surface on top of the shadow:

```html
<svg width="250" viewBox="0 0 200 85" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="MyFilter" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="120">
      <!-- offsetBlur -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
      <feOffset in="blur" dx="4" dy="4" result="offsetBlur" />
      <!-- litPaint -->
      <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".75" specularExponent="20" lighting-color="#bbbbbb" result="specOut">
        <fePointLight x="-5000" y="-10000" z="20000" />
      </feSpecularLighting>
      <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
      <!-- merge offsetBlur + litPaint -->
      <feMerge>
        <feMergeNode in="offsetBlur" />
        <feMergeNode in="litPaint" />
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#MyFilter)"> ... </g>
</svg>
```

- **The first `feComposite`** masks `specOut` so it is no bigger than `SourceAlpha`. **The second** adds `specOut` on top of `SourceGraphic`. **`feMerge`** stacks the drop shadow and the lit graphic.

## Gooey: blur plus alpha threshold

The goo (blob) effect, from RNDR Realm's "Gooey Dropdown": a button that melts into its dropdown panel, built with "React, Motion and an SVG filter. No canvas, no WebGL", and shipped on the author's landing page. The panel's grow-from-the-trigger timing belongs to [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).

- **How it works:** "you blur everything, then crank up the alpha contrast so the blurry edges snap back to being sharp. Where two shapes are close enough, their blurred edges merge together before snapping back, and that's what creates the gooey blob effect."
- **The filter,** in a zero-size host `<svg>`:

```html
<svg style="position: absolute; width: 0; height: 0;">
 <defs>
 <filter id="gooey">
 <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
 <feColorMatrix
 in="blur"
 mode="matrix"
 values="1 0 0 0 0
 0 1 0 0 0
 0 0 1 0 0
 0 0 0 20 -10"
 result="gooey"
 />
 <feBlend in="SourceGraphic" in2="gooey" />
 </filter>
 </defs>
</svg>
```

  In JSX the demo writes the same values on one line, `values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"`, with the host as `<svg style={{ position: "absolute", width: 0, height: 0 }}>`.
- **The two knobs:** "`stdDeviation=\"10\"` controls how much blur, and the `20 -10` in the last row of the color matrix controls how aggressively the edges snap back. Higher values mean a sharper cutoff, lower values mean more goo."
- **Blur about the gap** [Libraries.dev, liquid-gooey] (Jakubantalik/Libraries.dev, its free `libraries-dev` skill, MIT): "neighbours bridge once `blur` is roughly as large as the gap between them. Items 8px apart barely bridge at `blur={5}` and merge cleanly at `blur={12}`." Its defaults are blur 6 and contrast 18, and "Expecting pieces 10px apart to merge at `blur={6}`" is listed as a mistake: "Raise `blur` or close the gap." The same skill names a second hand-rolled matrix, `feColorMatrix` with `0 0 0 18 -7` under `filter: url(#goo)`, beside the `20 -10` above.
- **The liquid is the surface** (same source): "The liquid below is the surface; item backgrounds should be transparent. An opaque round photo that covers its own liquid is fine." And "The filter region is the group's box plus padding. Size `<Liquid>` to contain the full travel of its items, like a menu reserving its open footprint." Pieces that travel outside the filtered parent's box are cut, as in [The filter element](#the-filter-element).
- **Keep the content sharp:** "The `feBlend` at the end composites the original sharp graphic back on top so the content inside (text, icons) doesn't look blurry."
- **Filter the parent of both shapes:** `<div style={{ filter: "url(#gooey)" }}>{/* button */}{/* dropdown */}</div>`. "Because the button and dropdown are both inside the same filtered container, the filter sees them as one shape and blends their edges together during the animation."
- **The shapes must overlap or nearly touch.** The panel starts at the button's `top-0` and is pushed down with `translate-y` "so they overlap vertically", because "the two shapes need to be close enough to blend into each other."
- **Compare with it off.** The demo toggles the wrapper's style, `style={gooey ? { filter: "url(#gooey)" } : undefined}`: "Try clicking the button with it off first, then turn it on."
- **Cost, two views:** MDN says blurring is computation heavy and to use it sparingly on elements that animate ([Performance](#performance)); the gooey dropdown runs the blur on a wrapper whose panel animates `width`, `height` and `borderRadius`, and gives no measurement.

## Glass: refraction with feDisplacementMap

Aave Design's "Building Glass for the Web" bends the live content itself, not a backdrop, with one SVG filter driven by a generated displacement map. It reports the result working in Chromium, Safari and Firefox, desktop and mobile, with "no flags to turn on and no fallbacks to maintain".

- **Why not `backdrop-filter`:** Aave's table of approaches: SVG `backdrop-filter` works in Chromium only (not Safari or Firefox); the HTML-in-Canvas API is Chromium behind a flag. The video skill's [seek-engine TECHNIQUES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/TECHNIQUES.md) says `backdrop-filter: url()` misreads displacement maps in Chromium and clones the scene behind each glass element instead. Both avoid building glass on `backdrop-filter: url()`; confirm current support in browser-compat data.
- **One primitive, two inputs:** `feDisplacementMap` takes the painted content and the map; for each content pixel it reads the matching map pixel and uses its color to decide which way to push. "Nothing is sampled from underneath the glass. The content's own pixels are the ones moving, which is why text under the lens stays selectable and links stay clickable." So the glass "can go on anything made of live DOM: text, images, cards, buttons, whole layouts", where the video skill filters a clone.
- **The map:** "a small PNG we build on the fly from the glass's shape and size". "Its red and green channels say how far each pixel bends horizontally and vertically, and everywhere outside the lens it sits at a neutral value that leaves those pixels alone, so only the region under the glass moves."
- **Finishing passes:** after displacement, "a faint color fringe along the edges and a specular highlight that keeps the glass legible, but the displacement is the heart of it."
- **The demo's knobs** (defaults; ranges not shown, and Depth, Curvature and Splay are not defined mathematically):

| Width | Height | BorderRadius | Scale | Depth | Curvature | Splay | Chroma | Blur | Glow | Edge Highlight | Specular Angle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 70 | 60 | 28 | 0.100 | 10 | 40 | 1.00 | 0.20 | 0.0 | 0.10 | 0.25 | 45 |

### Live DOM first, WebGL where there is none

- **The map is the portable part.** "On ordinary DOM it drives an SVG filter, and the content underneath stays selectable, scrollable, and clickable on the same compositor as the rest of the page. When there's no live DOM to bend, like a canvas-drawn QR code or a video Safari won't filter, the same map feeds a WebGL shader instead."
- **Canvas content:** hand the same map to a shader that refracts the canvas's own pixels:

```js
// No live DOM to filter, so the same displacement map drives a WebGL
// shader that bends the canvas-drawn code on tap.
const { map, scale, chromaAmount } = generateLensMap(lens);
qrCanvas.setDisplacement({ map, scale, chromaAmount });
```

- **A live `<video>` in Safari:** "A live `<video>` is the one surface Safari refuses to apply an SVG filter to. It composites the video on the GPU and never hands those pixels to the filter pipeline, a long-standing WebKit limitation." One WebGL renderer reads the playing video as a texture and draws every control's lens, each with its own map. "Moving footage is the hard case for legibility, so the controls lean on their highlight and rim light to stay crisp against whatever frame happens to be behind them."

```js
// Safari won't filter a live <video>, so every control's lens runs the
// same pipeline in WebGL, all reading from the one playing video.
const renderer = initRefraction(canvas, video);
renderer.setLenses([playButton, skipBack, skipForward, scrubBar]);
```

- **Give the lens a copy to bend** (`refractionTarget`) when it should not bend the controls behind it: the switch thumb refracts the track's fill as "a moving highlight that gives the switch a sense of depth and tactility"; the toggle group refracts a highlighted copy "so the selected option stays legible whichever label sits underneath". The slider uses "a gentler bend than the switch, a fraction of the refraction strength, since the fill underneath has to stay readable as a value rather than just register as a moving highlight." Native elements are back-synced with the custom component (the tag name did not survive extraction).

```jsx
<Glass
  lens={{ lensW: 90, lensH: 60, borderRadius: 30 }}
  x={progress} // lens acts as the thumb (0-1 across the track)
>
  <SwitchTrack />
</Glass>
```
```jsx
// Same refractionTarget trick, a softer bend, the handle drives the lens.
<Glass
  lens={{ lensW: 90, lensH: 60, borderRadius: 30 }}
  x={handlePosition}
  refractionTarget={<TrackFill progress={progress} />}
>
  <SliderTrack />
</Glass>
```
```jsx
// The glass is the selection indicator. It bends a highlighted copy of
// the options and springs to the one you pick.
<Glass
  lens={selectionLens}
  x={selectedOptionPosition}
  refractionTarget={<HighlightedOptions />}
>
  <ToggleGroup options={options} />
</Glass>
```

### Safari and frame budget

- **Safari SVG filter frozen, stale filter output:** "Safari caches SVG filter output by its filter ID. When we change the displacement map but keep the same ID, Safari keeps serving the old output and the glass freezes mid-motion." Give the filter a fresh ID on every update.
- **Safari's source-size ceiling:** Safari caps the size of the source graphic a filter can process; past it, it "breaks the effect into mismatched blocks or drops it entirely, both on desktop and mobile." The limit varies by browser version and platform (no number given), so keep the refracted DOM conservative in size and complexity.
- **Move the region, not the map.** As a slider handle moves, only the filter's region shifts and the map stays the same, "so the motion holds a steady frame rate even on a phone. The map is regenerated only when the glass changes shape, never when it simply changes place."
- **Compute a quarter of the map.** During a squish or resize the map is rebuilt every frame. A rounded-rect map has four-fold symmetry: compute the top-left quadrant and write each pixel into all four, negating X displacement across the vertical axis and Y across the horizontal one, "which is what keeps map generation inside the frame budget."
- **Size the highlight pass per engine.** The specular highlight is a separate pass that by default covers the whole filter region, so its cost scales with the area. Limiting it to the lens is cheaper, but on Chromium it flickers with sub-pixel artifacts along the lens edge; Safari doesn't show them, so read only a lens-sized region on Safari.

## CSS filter and url()

- **`filter` takes `none`, filter functions, and/or `url("filters.svg#filter-id")`** pointing at an SVG `<filter>`. Functions: `blur()`, `brightness()`, `contrast()`, `drop-shadow()`, `grayscale()`, `hue-rotate()`, `invert()`, `opacity()`, `saturate()`, `sepia()`.
- **Several functions apply in order,** and the same function can repeat. If any function's parameter is invalid, the function returns `none`.
- **`drop-shadow()` follows the contours of the image.** Its syntax is like `box-shadow` without `inset` and spread; filters after it apply to the shadow too.
- **On HTML, keep the filter in a zero-height `<svg>`** and reference it by id. This SVG blur does the same as `blur()`:

```html
<svg height="0"><defs>
  <filter id="wherearemyglasses" x="0" y="0"><feGaussianBlur in="SourceGraphic" stdDeviation="1" /></filter>
</defs></svg>
```
```css
.blur { filter: url("#wherearemyglasses"); }
```

- **External files must be same-origin,** and external references from CSS `filter` are supported less widely than the SVG `filter` attribute.

## Performance

- **Blurring is computation heavy;** use it sparingly, especially on elements that scroll or animate.
- **WebKit filters on the CPU** [Libraries.dev, liquid-gooey]: "WebKit rasterises SVG filters on the CPU. Blurred outer shadows are moved to CSS `drop-shadow()` on the svg (GPU). Keep groups small and few." Its voice glow goes further: the warp "is an SVG filter; on Safari/WebKit it is switched off automatically for hosts larger than about 60,000 px² (a phone screen)" [Libraries.dev, voice-glow]. These are the vendor's own engineering notes, not MDN's.
- **For layer and `will-change` guidance,** see [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md#rendering-performance).

## Prove it

- **Nothing is cut off:** a blur or shadow reaching past the element shows fully; if its edge is clipped, the filter region (`x`, `y`, `width`, `height`) is too small for the `stdDeviation` or offset.
- **Every `in` and `in2` names** `SourceGraphic`, `SourceAlpha`, `FillPaint`, `StrokePaint` or a `result` defined earlier in the same filter; nothing relies on `BackgroundImage`.
- **Colors match the design:** if a matrix or transfer looks too dark or washed out next to a CSS filter, compare with `color-interpolation-filters="sRGB"`.
- **Step through it:** remove primitives from the end one at a time and the intermediate results look as expected.
- **Scroll and animation:** no blur sits on a large element that scrolls or animates.
- **Goo blur:** pieces the design should merge sit no farther apart than about the blur value, and item backgrounds are transparent unless an opaque piece is meant to cover its own liquid.
- **Goo:** with the filter off the two shapes stay separate; with it on their edges merge as they meet, and the text and icons inside stay sharp.
- **Glass:** text under the lens can be selected and links under it clicked; in Safari the glass keeps moving while the map changes (a fresh filter ID per update) and doesn't break into blocks; over a live `<video>` in Safari the lens runs in WebGL.
