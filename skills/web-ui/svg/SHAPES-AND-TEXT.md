# Shapes and text

The basic shapes (`rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`) and the text elements (`text`, `tspan`, `textPath`) are what you draw with, and fill and stroke are how they get painted. What decides most outcomes: each basic shape is mathematically a `path`, so everything a path takes applies to it; `fill` defaults to black and `stroke` to none, so an unstyled `line` is invisible and an unstyled `polyline` is filled; and text never wraps or flows by itself. Coordinates and `viewBox` are in [BASICS.md](BASICS.md), `path` and its `d` commands in [PATHS.md](PATHS.md), CSS styling in [STYLING.md](STYLING.md), gradient and pattern fills in [GRADIENTS-AND-PATTERNS.md](GRADIENTS-AND-PATTERNS.md).

**Contents:** [Basic shapes](#basic-shapes) · [rect](#rect) · [circle](#circle) · [ellipse](#ellipse) · [line](#line) · [polyline and polygon](#polyline-and-polygon) · [Text](#text) · [Positioning characters](#positioning-characters) · [Multi-line text](#multi-line-text) · [text-anchor](#text-anchor) · [dominant-baseline](#dominant-baseline) · [tspan](#tspan) · [textPath](#textpath) · [Fill and stroke](#fill-and-stroke) · [Stroke properties](#stroke-properties) · [fill-rule](#fill-rule) · [paint-order](#paint-order) · [Prove it](#prove-it)

## Basic shapes

- **The set:** `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`. Each is equivalent to a `path` that draws the same shape; all `path` properties apply; all can be stroked, filled and used as clip paths ([CLIP-AND-MASK.md](CLIP-AND-MASK.md)).
- **Attributes control appearance** (`cx`, `cy`, `r` on `circle`). Some, like `fill` and `stroke`, are also CSS properties.
- **Geometry as CSS.** Since SVG 2, `cx`/`cy`/`r` (circle), `cx`/`cy`/`rx`/`ry` (ellipse) and `x`/`y`/`width`/`height`/`rx`/`ry` (rect) are Geometry Properties settable from CSS. `x1`, `y1`, `x2`, `y2` (line) and `points` (polyline, polygon) can currently only be attributes.
- **All shapes take `pathLength`** (see [PATHS.md](PATHS.md#pathlength)).

Every shape in one drawing:

```xml
<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">

  <rect x="10" y="10" width="30" height="30" stroke="black" fill="none" stroke-width="5"/>
  <rect x="60" y="10" rx="10" ry="10" width="30" height="30" stroke="black" fill="none" stroke-width="5"/>

  <circle cx="25" cy="75" r="20" stroke="red" fill="none" stroke-width="5"/>
  <ellipse cx="75" cy="75" rx="20" ry="5" stroke="red" fill="none" stroke-width="5"/>

  <line x1="10" x2="50" y1="110" y2="150" stroke="orange" stroke-width="5"/>
  <polyline points="60 110 65 120 70 115 75 130 80 125 85 140 90 135 95 150 100 145"
      stroke="orange" fill="none" stroke-width="5"/>

  <polygon points="50 160 55 180 70 180 60 190 65 205 50 195 35 205 40 190 30 180 45 180"
      stroke="green" fill="none" stroke-width="5"/>

  <path d="M20,230 Q40,205 50,230 T90,230" fill="none" stroke="blue" stroke-width="5"/>
</svg>
```

The owner's course samples:

```svg
<svg viewBox="0 0 100 100">
  <rect fill="crimson" x="20" y="20" width="60" height="60" />
</svg>
<svg viewBox="0 0 100 100">
  <circle fill="darkorchid" stroke="currentColor" stroke-width="3" cx="50" cy="50" r="30" />
</svg>
<svg viewBox="0 0 100 100">
  <polygon fill="none" stroke="yellow" stroke-width="3" points="50 20, 20 80, 80 80" />
</svg>
```

A search icon from a circle and a line (course practice):

```svg
<svg viewBox="0 0 100 100">
<circle cx="45" cy="45" r="30" fill="none" stroke="currentColor" stroke-width="4" />
<line x1="65" y1="65" x2="85" y2="85" stroke="currentColor" stroke-width="4" />
</svg>
```

## rect

| Attribute | Value | Default |
|---|---|---|
| `x`, `y` | left and top edges | `0` |
| `width`, `height` | `auto` \| length \| percentage | `auto` |
| `rx` | `auto` \| length \| percentage | `auto` (takes `ry` if that is set) |
| `ry` | `auto` \| length \| percentage | `auto` (takes `rx` if that is set) |
| `pathLength` | number | none |

All animatable.

- **Bad sizes:** negative `width`/`height` is invalid and ignored; zero disables rendering. Negative `rx`/`ry` are invalid and ignored.
- **Square corners** come from zero for either radius or `auto` for both.
- **Used radii:** both `auto` gives 0. If only one is set, the other gets the same absolute value (`rx` percentages resolve against width, `ry` against height). Then clamp: `rx` at most half the width, `ry` at most half the height.
- **Corners are always symmetrical** along both axes; for uneven rounding use a `path`.
- **Two descriptions, one rendering:** the MDN tutorial says unset `rx`/`ry` default to `0`; SVG 2 models them as `auto` whose used value is 0 when both are `auto`.
- **A rect without rounded corners** can also be a `polygon`.

```html
<svg viewBox="0 0 220 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Regular rectangle -->
  <rect width="100" height="100" />
  <!-- Rounded corner rectangle -->
  <rect x="120" width="100" height="100" rx="15" />
</svg>
```

## circle

- **Attributes:** `cx`, `cy` (default `0`), `r` (default `0`), `pathLength`.
- **Radius:** negative is invalid and ignored; zero (or lower) disables rendering.
- **As a path** it is four elliptical arc segments, each a quarter circle.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" />
</svg>
```

## ellipse

- **Attributes:** `cx`, `cy` (default `0`), `rx`, `ry` (`auto` | length | percentage, default `auto`), `pathLength`.
- **Radii:** negative is invalid and ignored; zero for either, or `auto` for both, disables rendering.
- **One `auto` radius takes the other's value** (no clamping), giving a circle sized by a percentage of width or height. New in SVG 2: before, an unspecified `rx` or `ry` made the ellipse not render.
- **No tilt attribute:** rotate an ellipse with `transform` ([REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md#the-transform-attribute)).

```html
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="50" rx="100" ry="50" />
</svg>
```

## line

- **Attributes:** `x1`, `y1`, `x2`, `y2` (length | percentage | number, default `0`), `pathLength`.
- **Give it a stroke.** A line has no interior and is never filled; without a stroke color it is invisible.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="80" x2="100" y2="20" stroke="black" />
</svg>
```

## polyline and polygon

- **`points`:** a list of x,y pairs; numbers separated by spaces, commas, EOL or line feeds, extra whitespace allowed. `0, 0 1, 1 2, 2` is three points. Default `""`.
- **Open vs closed:** `polyline` leaves the last point unconnected; `polygon` connects it back to the first.
- **Odd coordinate count** is an error: the last odd coordinate is dropped and the rest renders.
- **Set `fill="none"` on a polyline you mean as a line.** It gets the default black fill, and filling closes open subpaths as if a closepath were added.
- **Prefer `path` for curves.** A polyline needs many short segments to fake a curve and doesn't scale well to larger sizes. There is no real performance penalty or bonus for `polygon`/`polyline` versus `path`.

```html
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Example of a polyline with the default fill -->
  <polyline points="0,100 50,25 50,75 100,0" />
  <!-- Example of the same polyline shape with stroke and no fill -->
  <polyline points="100,100 150,25 150,75 200,0" fill="none" stroke="black" />
</svg>
```

## Text

- **Only text inside `<text>` renders;** text elsewhere is not shown, and `display` won't show it.
- **`x` and `y`** set where the text appears; `text-anchor` sets which way it flows from that point; `dominant-baseline` sets vertical alignment.
- **Color with `fill`, not `color`.** `color` is for HTML. `stroke` outlines the text; both can reference gradients or patterns.
- **Text is a graphics element.** Gradients, patterns, clipping paths, masks, filters, transforms and painting apply to it as to shapes.
- **No wrapping by default** on `<text>` or `<tspan>`; wrapping needs the CSS `white-space` property.
- **`<text>` attributes:** `x`, `y` (list of length | percentage), `dx`, `dy` (list, default none), `rotate` (list of numbers), `lengthAdjust` (`spacing` | `spacingAndGlyphs`, default `spacing`), `textLength` (length | percentage). All animatable. MDN gives the `x`/`y` default as `0`; SVG 2 gives the initial value as `(none)`.
- **Font properties** work as attributes or CSS: `font-family`, `font-style`, `font-weight`, `font-variant`, `font-stretch`, `font-size`, `font-size-adjust`, `letter-spacing`, `word-spacing`, `text-decoration`.

```html
<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <style>
    .small {
      font: italic 13px sans-serif;
    }
    .heavy {
      font: bold 30px sans-serif;
    }
    /* Note that the color of the text is set with the    *
     * fill property, the color property is for HTML only */
    .Rrrrr {
      font: italic 40px serif;
      fill: red;
    }
  </style>
  <text x="20" y="35" class="small">My</text>
  <text x="40" y="35" class="heavy">cat</text>
  <text x="55" y="55" class="small">is</text>
  <text x="65" y="55" class="Rrrrr">Grumpy!</text>
</svg>
```

## Positioning characters

- **`x`/`y` lists.** A single value places the first character; a list of n values places the first n addressable characters; extra values do nothing; characters past the list continue from the previous glyph (or an ancestor's per-character value).
- **Not CSS.** In SVG 2, `x` and `y` on `text`/`tspan` are not presentation attributes and cannot be set from CSS.
- **`dx`/`dy`** shift the current text position relative to the previous glyph; a list applies incremental shifts to consecutive characters, piling up the offset.
- **`rotate`** takes a list, one angle per character; remaining characters use the last value.
- **Order of operations:** absolute repositioning (including the `text-anchor` adjustment) happens before relative repositioning (`dx`/`dy`) and rotation.
- **Auto-wrapped text ignores** `x`, `y`, `dx`, `dy`, `rotate`, except the initial position when `inline-size` sets the content area.
- **`textLength`** lets the engine adjust glyph positions when its measured length differs from the given one.
- **Per-glyph positioning only looks right if the intended font is available** to every viewer.

## Multi-line text

Pre-formatted text (the default) never breaks lines. Three ways to get several lines:

1. **One `text` with `white-space: pre` or `pre-line`,** line spacing via `line-height` (new in SVG 2).
2. **One `text` with `tspan` children,** each new line placed with `x`, `y`, `dx`, `dy`.
3. **One `text` per line.** Not recommended: it may prevent selecting text across lines.

`text-align`, `text-align-last`, `line-break`, `word-break`, `hyphens`, `word-wrap` and `overflow-wrap` do not apply to pre-formatted text.

## text-anchor

- **Values:** `start` (default) | `middle` | `end`. Animation is discrete; the CSS property beats the attribute.
- **Per text chunk.** The anchor point is the initial current text position: `x`/`y` on `text`, a `tspan`'s `x`/`y` on the chunk's first character, or the `textPath` start.
- **`start`** puts the start of the string at the point (left side for `ltr`, right for `rtl`, top for vertical); **`middle`** its midpoint (on a path, the text is laid out straight first, then mapped with the midpoint at the point); **`end`** its end.
- **Auto-wrapped text** other than `inline-size` wrapping uses `text-align` instead.

```html
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60,15 L60,110 M30,40 L90,40 M30,75 L90,75 M30,110 L90,110" stroke="grey" />
  <text text-anchor="start" x="60" y="40">A</text>
  <text text-anchor="middle" x="60" y="75">A</text>
  <text text-anchor="end" x="60" y="110">A</text>
  <circle cx="60" cy="40" r="3" fill="red" />
  <circle cx="60" cy="75" r="3" fill="red" />
  <circle cx="60" cy="110" r="3" fill="red" />
  <style>
    <![CDATA[
      text {
        font: bold 36px Verdana, Helvetica, Arial, sans-serif;
      }
      ]]>
  </style>
</svg>
```

## dominant-baseline

- **Values:** `auto` (default) | `text-bottom` | `alphabetic` | `ideographic` | `middle` | `central` | `mathematical` | `hanging` | `text-top`. Deprecated: `use-script`, `no-change`, `reset-size`. MDN also describes `text-after-edge` and `text-before-edge`. Animation is discrete; the CSS property beats the attribute.
- **`auto`** on `text` is `alphabetic` for horizontal `writing-mode` and `central` for vertical; on `tspan`/`textPath` it keeps the parent's baseline.
- **`central` vs `middle`:** `central` picks the font's baseline table in the priority `ideographic, alphabetic, hanging, mathematical`; `middle` in the priority `alphabetic, ideographic, hanging, mathematical`. Without a baseline table the browser may use heuristics.
- **Support:** `auto`, `alphabetic`, `central`, `hanging`, `ideographic`, `mathematical`, `middle` in Chrome 1, Firefox 1, Safari 4. `text-top` and `text-bottom` only in Firefox 149, experimental.

```html
<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M20,20 L180,20 M20,50 L180,50 M20,80 L180,80" stroke="grey" />
  <text dominant-baseline="auto" x="30" y="20">Auto</text>
  <text dominant-baseline="middle" x="30" y="50">Middle</text>
  <text dominant-baseline="hanging" x="30" y="80">Hanging</text>
</svg>
```

## tspan

- **A sub-portion of text,** typically to style one word differently. It must be a child of `text` or another `tspan`.
- **Attributes:** `x`, `y`, `dx`, `dy`, `rotate`, `lengthAdjust`, `textLength`.

```html
<svg width="350" height="60" xmlns="http://www.w3.org/2000/svg">
  <text>
    This is
    <tspan font-weight="bold" fill="red">bold and red</tspan>
  </text>
  <style>
    <![CDATA[
      text {
        dominant-baseline: hanging;
        font: 28px Verdana, Helvetica, Arial, sans-serif;
      }
    ]]>
  </style>
</svg>
```

## textPath

- **Text along a path.** `<textPath>` goes inside `<text>` and references a `path` with `href`. In SVG 2 it can also reference a basic shape, or take inline path data in the `path` attribute (when `path` is set, `href` has no effect).
- **Hide the guide path** by putting it in `<defs>`.

| Attribute | Values | Default |
|---|---|---|
| `href` | URL of the path or basic shape | none |
| `lengthAdjust` | `spacing` \| `spacingAndGlyphs` | `spacing` |
| `method` | `align` \| `stretch` | `align` |
| `path` | path data (experimental) | |
| `side` | `left` \| `right` (experimental) | `left` |
| `spacing` | `auto` \| `exact` | `exact` |
| `startOffset` | length \| percentage \| number | `0` |
| `textLength` | length \| percentage \| number | `auto` |

- **`startOffset` as a percentage** is a distance along the whole path (`0%` start, `100%` end). Negative and over-100% values are allowed; characters whose midpoints fall off the path are not rendered. Caveat: the spec notes Chrome and Safari do not handle offsets outside 0% to 100% (Chromium bug 476554).
- **`side="right"`** effectively reverses the path (text inside vs outside a closed shape).
- **`method="stretch"`** converts glyph outlines to paths and warps them; `align` uses rigid per-glyph transforms, which can break connections in cursive fonts.
- **Support:** `path` and `side` only in Firefox 61 (Chrome and Safari no, experimental); `method="stretch"` partial in Chrome, Firefox and Safari; unprefixed `href` Chrome 50, Firefox 2, Safari 12.1; `xlink:href` deprecated.

```html
<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
  <path id="my_path" d="M 20,20 C 80,60 100,40 120,20" fill="none" />
  <text>
    <textPath href="#my_path">A curve.</textPath>
  </text>
  <style>
    <![CDATA[
      text {
        dominant-baseline: hanging;
        font: 28px Verdana, Helvetica, Arial, sans-serif;
      }
    ]]>
  </style>
</svg>
```

## Fill and stroke

- **Defaults:** `fill` is `black`, `stroke` is `none`; both inherited; both apply to shapes and text content elements.
- **Separate opacities:** `fill-opacity` and `stroke-opacity`.
- **Colors** take CSS color syntax (`red`, `rgb(255 0 0)`, hex). The course examples use `currentColor` for fill and stroke (`stroke="currentColor"`).
- **Fill closes open subpaths** as if a closepath were added, so open `path` subpaths and `polyline` get filled.
- **Strokes are centered on the path.**
- **Dash patterns start where the element starts:** for `path`, the first point of the initial moveto.
- **Attribute or CSS.** For every presentation attribute below (`stroke-width`, `stroke-linecap`, `stroke-linejoin`, `stroke-miterlimit`, `stroke-dasharray`, `stroke-dashoffset`, `fill-rule`, `vector-effect`, `paint-order`) plus `text-anchor` and `dominant-baseline`, the CSS property wins when both are given. The MDN tutorial says geometry like `width`, `height` and path commands can't be set from CSS ("it's easiest just to test"); the newer MDN reference pages say `d`, `width` and `height` became CSS-settable in SVG 2. CSS can be inline (`style="stroke: black; fill: red;"`), in a `<style>` inside `<defs>`, or external through `<?xml-stylesheet type="text/css" href="style.css"?>`, and `:hover` works for rollovers; more in [STYLING.md](STYLING.md).
- **CSS works on shapes** (course example): `circle { fill: red; }` on

```svg
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="20" />
</svg>
```
```css
circle {
  fill: red;
}
```

## Stroke properties

### stroke-width

- **Value** `<length> | <percentage>` (SVG 2 also `<number>` in user units), default `1px`, animatable, inherited (so it can go on `g`).
- **A percentage** resolves against the normalized viewBox diagonal. Zero paints no stroke; negative is invalid.

```html
<svg viewBox="0 0 30 10" xmlns="http://www.w3.org/2000/svg">
  <!-- Default stroke width: 1 -->
  <circle cx="5" cy="5" r="3" stroke="green" />
  <!-- Stroke width as a number -->
  <circle cx="15" cy="5" r="3" stroke="green" stroke-width="3" />
  <!-- Stroke width as a percentage -->
  <circle cx="25" cy="5" r="3" stroke="green" stroke-width="2%" />
</svg>
```

### stroke-linecap

- **Values:** `butt` (default) | `round` | `square`; discrete animation. Applies to the ends of open subpaths and to zero-length subpaths, on `path`, `polyline`, `line`, `text`, `textPath`, `tspan`.
- **`butt`** stops at the endpoint; a zero-length subpath renders nothing. **`round`** adds a half circle of diameter equal to the stroke width; zero-length gives a dot. **`square`** extends by half the stroke width; zero-length gives a square of side equal to the stroke width.

```xml
<svg width="160" height="140" xmlns="http://www.w3.org/2000/svg">
  <line x1="40" x2="120" y1="20" y2="20" stroke="black" stroke-width="20" stroke-linecap="butt"/>
  <line x1="40" x2="120" y1="60" y2="60" stroke="black" stroke-width="20" stroke-linecap="square"/>
  <line x1="40" x2="120" y1="100" y2="100" stroke="black" stroke-width="20" stroke-linecap="round"/>
</svg>
```

### stroke-linejoin

- **Values:** SVG 2 defines `miter` | `round` | `bevel`, initial `miter`. MDN also lists `arcs` and `miter-clip` and notes they aren't widely supported yet; browser-compat data lists only `bevel`, `miter`, `round` (Chrome 1, Firefox 1.5, Safari 4). Confirm in current browser-compat data before using `arcs` or `miter-clip`. Discrete animation. Applies to `path`, `polygon`, `polyline`, `rect`, `text`, `textPath`, `tspan`.
- **`miter`** extends the outer edges to a sharp corner and falls back to `bevel` past `stroke-miterlimit`. **`round`** draws a circular sector at the join. **`bevel`** fills the triangle between the segments. **`miter-clip`** clips the miter at half the miterlimit times the stroke width from the intersection. **`arcs`** extends outer edges with arcs matching their curvature.

```xml
<svg width="160" height="280" xmlns="http://www.w3.org/2000/svg">
  <polyline points="40 60 80 20 120 60" stroke="black" stroke-width="20"
      stroke-linecap="butt" fill="none" stroke-linejoin="miter"/>
  <polyline points="40 140 80 100 120 140" stroke="black" stroke-width="20"
      stroke-linecap="round" fill="none" stroke-linejoin="round"/>
  <polyline points="40 220 80 180 120 220" stroke="black" stroke-width="20"
      stroke-linecap="square" fill="none" stroke-linejoin="bevel"/>
</svg>
```

### stroke-miterlimit

- **The ratio of miter length to `stroke-width`** past which a miter join becomes a bevel. `<number>`, default `4`.
- **Formula:** `stroke-miterlimit = miterLength / stroke-width = 1 / sin(θ/2)`. A limit of 1.414 bevels joins sharper than 90°, 4.0 sharper than about 29°, 10.0 sharper than about 11.5°.
- **Minimum:** MDN says it must be at least 1; SVG 2 only rejects negative values, notes that earlier specs called 0 to 1 an error but that was not well implemented, and that in practice any miter exceeds a limit between 0 and 1.

### stroke-dasharray

- **Value:** `none` (default) | comma and/or whitespace separated lengths or percentages (SVG 2 also numbers in user units). Animatable.
- **Dash, gap, dash, gap.** An odd count repeats to make it even: `5,3,2` is `5,3,2,5,3,2`.
- **Resets at each subpath.** Any negative value invalidates it; all zeros draws a solid line.
- **Interpolation:** discrete if either end is `none` or invalid; otherwise both lists repeat to equal length and each item interpolates (`20 40 10` to `40 20` becomes `20 40 10 20 40 10` vs `40 20 40 20 40 20`). Not additive.
- **Relative to `pathLength`** when one is set ([PATHS.md](PATHS.md#pathlength)); dash drawing animations are in [CSS-ANIMATION.md](CSS-ANIMATION.md).

```html
<svg viewBox="0 0 30 12" xmlns="http://www.w3.org/2000/svg">
  <style>
    line {
      stroke: black;
    }
  </style>
  <!-- No dashes nor gaps -->
  <line x1="0" y1="1" x2="30" y2="1" />
  <!-- Dashes and gaps of the same size -->
  <line x1="0" y1="3" x2="30" y2="3" stroke-dasharray="4" />
  <!-- Dashes and gaps of different sizes -->
  <line x1="0" y1="5" x2="30" y2="5" stroke-dasharray="4 1" />
  <!-- Dashes and gaps of various sizes with an odd number of values -->
  <line x1="0" y1="7" x2="30" y2="7" stroke-dasharray="4 1 2" />
  <!-- Dashes and gaps of various sizes with an even number of values -->
  <line x1="0" y1="9" x2="30" y2="9" stroke-dasharray="4 1 2 3" />
  <!-- Dashes starting with a gap -->
  <line x1="0" y1="11" x2="30" y2="11" stroke-dasharray="0 4 0" />
</svg>
```

### stroke-dashoffset

- **Offset into the dash pattern at the path start.** `<percentage> | <length>` (SVG 2 also `<number>`), default `0`, animatable.
- **Units:** usually user units, resolved against `pathLength`; a percentage resolves against the current viewport (SVG 2: the normalized diagonal).
- **Direction:** positive pulls the pattern start back, negative pushes it forward; a negative offset equals `s - (abs(stroke-dashoffset) mod s)`, where s is the sum of the dash array.
- **Easy math:** a `pathLength` very different from the real length makes dash values simple to compute (the spec's poker-chip example uses `pathLength="80"`).

```html
<svg viewBox="-3 0 33 10" xmlns="http://www.w3.org/2000/svg">
  <!-- No dash array -->
  <line x1="0" y1="1" x2="30" y2="1" stroke="black" />
  <!-- No dash offset -->
  <line x1="0" y1="3" x2="30" y2="3" stroke="black" stroke-dasharray="3 1" />
  <!-- The start of the dash array computation is pulled by 3 user units -->
  <line x1="0" y1="5" x2="30" y2="5" stroke="black" stroke-dasharray="3 1" stroke-dashoffset="3" />
  <!-- The start of the dash array computation is pushed by 3 user units -->
  <line x1="0" y1="7" x2="30" y2="7" stroke="black" stroke-dasharray="3 1" stroke-dashoffset="-3" />
  <!-- pulled by 1 user unit: same rendering as the previous example -->
  <line x1="0" y1="9" x2="30" y2="9" stroke="black" stroke-dasharray="3 1" stroke-dashoffset="1" />
  <path d="M0,5 h-3 M0,7 h3 M0,9 h-1" stroke="rgb(255 0 0 / 50%)" />
</svg>
```

### vector-effect: non-scaling-stroke

- **Values:** `none` (default) | `non-scaling-stroke` | `non-scaling-size` | `non-rotation` | `fixed-position`; discrete animation; applies to graphics elements and `use`; not inherited. Vector effects apply before filters, masks and clips.
- **`non-scaling-stroke`** keeps the stroke width independent of the element's transforms (including non-uniform scaling and shear) and of zoom. The outline is computed in the host coordinate space (the viewport coordinate system of the furthest ancestral SVG viewport) and transformed back. Use case: map roads that stay 2px wide while zooming.
- **Only `non-scaling-stroke` is implemented** (Chrome 6, Firefox 15, Safari 5.1). `non-scaling-size`, `non-rotation` and `fixed-position` have no implementations and are at risk of being dropped.

```html
<svg viewBox="0 0 500 240">
  <!-- normal -->
  <path
    d="M10,20 L40,100 L39,200 z"
    stroke="black"
    stroke-width="2px"
    fill="none"></path>
  <!-- scaled -->
  <path
    transform="translate(100,0) scale(4,1)"
    d="M10,20 L40,100 L39,200 z"
    stroke="black"
    stroke-width="2px"
    fill="none"></path>
  <!-- fixed-->
  <path
    vector-effect="non-scaling-stroke"
    transform="translate(300, 0) scale(4, 1)"
    d="M10,20 L40,100 L39,200 z"
    stroke="black"
    stroke-width="2px"
    fill="none"></path>
</svg>
```

## fill-rule

- **Values:** `nonzero` (default) | `evenodd`; discrete animation; inherited; applies to shapes and text content elements.
- **`nonzero`:** cast a ray from the point to infinity; add 1 for each segment crossing left to right, subtract 1 for right to left; zero means outside, anything else inside. MDN shows it on a self-intersecting star and on a square inside a square, drawn once in the same and once in the opposite direction.
- **`evenodd`:** count the crossings; odd is inside, even is outside. The center of a self-intersecting star has two segments between it and infinity, so it is outside and stays unfilled.
- **If a segment is tangent to or lies along the ray,** pick another ray.

```html
<svg viewBox="-10 -10 320 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Effect of nonzero fill rule on crossing path segments -->
  <polygon fill-rule="nonzero" stroke="red" points="50,0 21,90 98,35 2,35 79,90" />
  <!-- shape inside a shape, same direction (both clockwise) -->
  <path fill-rule="nonzero" stroke="red"
    d="M110,0  h90 v90 h-90 z
           M130,20 h50 v50 h-50 z" />
  <!-- shape inside a shape, opposite direction -->
  <path fill-rule="nonzero" stroke="red"
    d="M210,0  h90 v90 h-90 z
           M230,20 v50 h50 v-50 z" />
</svg>
```
## paint-order

- **Syntax:** `paint-order: normal | [ fill || stroke || markers ]`, default `normal` (fill, then stroke, then markers). Keywords left out are painted afterwards in default order, so `stroke` means `stroke fill markers`. Discrete animation.
- **Main use:** painting a text stroke below its fill without duplicating the `text` element.
- **Support:** property Chrome 123 (keyword values from Chrome 35), Firefox 60, Safari 11 (keywords Safari 8).
- **On HTML text:** [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#paint-order-on-html-text) in modern-css.

```html
<svg width="400" height="180" xmlns="http://www.w3.org/2000/svg">
  <polyline
    points="40 80 80 40 120 80"
    stroke-width="15"
    stroke="black"
    fill="coral"
    paint-order="fill" />
  <polyline
    points="40 140 80 100 120 140"
    stroke-width="15"
    stroke="black"
    fill="coral"
    paint-order="stroke" />
</svg>
```

## Prove it

- Every `line` has a stroke; every `polyline` meant as a line has `fill="none"`.
- No shape relies on a negative size or radius; zero-size shapes are intentional (they don't render).
- Text color is set with `fill`; nothing expects `color` to color SVG text.
- Multi-line text uses `white-space`, or `tspan`s with their own `x`/`y`, not one `text` per line.
- `stroke-linejoin` uses only `miter`, `round` or `bevel`.
- A hole in a filled shape shows with the chosen `fill-rule`: opposite winding under `nonzero`, any winding under `evenodd`.
- A scaled icon that must keep a constant stroke width has `vector-effect="non-scaling-stroke"`.
- Outlined text with `paint-order="stroke"` shows the full glyph fill on top of the stroke.
