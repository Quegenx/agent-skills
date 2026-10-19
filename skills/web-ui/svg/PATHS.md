# Paths

`<path>` is the generic shape element and the most powerful one in SVG: its `d` attribute can mold it into every other shape and everything in between. What decides most outcomes: `d` is a string of 20 single-letter commands where uppercase means absolute coordinates and lowercase means relative to the current point, a parse error silently cuts the path short at that command, and two `d` values only animate smoothly when they have the same command structure. Drawing a complex path by hand in an editor is not recommended, but knowing the commands lets you find and repair display problems. Basic shapes are in [SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md), path morphing in [CSS-ANIMATION.md](CSS-ANIMATION.md) and [SMIL.md](SMIL.md), path data compaction by tools in [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md).

**Contents:** [The path element](#the-path-element) · [The commands](#the-commands) · [MoveTo](#moveto-m-m) · [LineTo](#lineto-l-l-h-h-v-v) · [ClosePath](#closepath-z-z) · [Cubic Bézier](#cubic-bézier-c-c-s-s) · [Quadratic Bézier](#quadratic-bézier-q-q-t-t) · [Elliptical arcs](#elliptical-arcs-a-a) · [Syntax and compaction](#syntax-and-compaction) · [Errors](#errors) · [Animating d](#animating-d) · [Smoothed corners](#smoothed-corners-squircles-as-a-path) · [pathLength](#pathlength) · [Prove it](#prove-it)

## The path element

- **Attributes:** `d` (string, default `''`, animatable) and `pathLength`.
- **`d` is also a CSS property,** taking `path("...")` or `none`. Support: Chrome 52, Firefox 97, Safari not supported.
- **Empty means nothing.** `d: none` or an empty string disables rendering, and a `path` with no data does not count toward its ancestors' bounding box.
- **Coordinates are unitless,** always in the user coordinate system ([BASICS.md](BASICS.md#the-coordinate-system)).
- **Segments.** Every command other than moveto or closepath, explicit or implicit, defines one path segment.
- **Paths or polylines.** There is no real performance penalty or bonus for `polygon`/`polyline` versus `path`; `path` is preferred for curves, since a polyline needs many small straight lines to simulate a curve and doesn't scale well to larger sizes.

## The commands

Six command types, 20 commands. Commands are case-sensitive: uppercase takes absolute coordinates, lowercase takes coordinates relative to the current point at the start of the command.

| Type | Absolute | Relative | Parameters |
|---|---|---|---|
| MoveTo | `M` | `m` | `x y` |
| LineTo | `L` | `l` | `x y` |
| Horizontal line | `H` | `h` | `x` |
| Vertical line | `V` | `v` | `y` |
| Cubic Bézier | `C` | `c` | `x1 y1, x2 y2, x y` |
| Smooth cubic | `S` | `s` | `x2 y2, x y` |
| Quadratic Bézier | `Q` | `q` | `x1 y1, x y` |
| Smooth quadratic | `T` | `t` | `x y` |
| Elliptical arc | `A` | `a` | `rx ry x-axis-rotation large-arc-flag sweep-flag x y` |
| ClosePath | `Z` | `z` | none |

- **Negative arguments:** negative angles are anti-clockwise; absolute negative x/y are negative coordinates; relative negative x moves left and relative negative y moves up.
- **Extra values repeat the command.** Extra parameters after a command are implicit repeats of it (after `M`/`m`, see below).

The owner's course example, the commands of one icon: `M17 3` (Move to), `L20 6` (Line to), `L17 9` (Line to), `M19 6` (Move to), `H10.5` (Horizontal line to), `C7 6 4 9 4 12.5` (Curve to), `C4 16 7 19 10.5 19` (Curve to), `H18` (Horizontal line to).

## MoveTo: M, m

- **`M x y` / `m dx dy`** moves the pen without drawing. Path data must begin with a moveto; later movetos start new subpaths.
- **Extra pairs are lines.** Pairs after `M` are implicit absolute `L`; after `m`, implicit relative `l`. `M 10 10 90 10 90 90` equals `M 10 10 L 90 10 L 90 90`.
- **A leading `m` is absolute.** A relative `m` as the first command is treated as absolute; its later pairs are still relative.
- **A lone moveto draws nothing:** `M10 10` alone renders nothing.

## LineTo: L, l, H, h, V, v

- **`L x y` / `l dx dy`** draws a straight line; **`H x` / `h dx`** a horizontal one; **`V y` / `v dy`** a vertical one (one parameter each).

```html
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 H 90 V 90 H 10 L 10 10" />
</svg>
```

The same square, closed with `Z`, then written with relative commands:

```html
<path d="M 10 10 H 90 V 90 H 10 Z" fill="none" stroke="black" />
```

```html
<path d="M 10 10 h 80 v 80 h -80 Z" fill="none" stroke="black" />
```

## ClosePath: Z, z

- **Draws a straight line back to the first point of the current subpath.** `Z` and `z` are identical.
- **Close with `Z`, not a line to the start.** `Z` joins the last and first segments with `stroke-linejoin`; closing "manually" with a lineto to the start point caps both ends with `stroke-linecap` instead.
- **What follows `Z`:** a moveto starts the next subpath there; any other command starts the next subpath at the same initial point.

## Cubic Bézier: C, c, S, s

- **`C x1 y1, x2 y2, x y`:** (x1,y1) is the start control point, (x2,y2) the end control point, (x,y) the end point. The curve leaves toward the first control point and arrives along the direction of the second.
- **In `c`, all three pairs are relative to the current point** (the curve's start), not to each other.
- **`S x2 y2, x y`** is the smooth cubic. After a `C` or `S`, its first control point is the reflection of the previous end control point about the current point: `(newx1, newy1) = (2*curx - oldx2, 2*cury - oldy2)`. Otherwise the current point is the first control point.
- **Cubic gives more freedom than quadratic;** pick by how symmetrical the line is.

```html
<svg width="190" height="160" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80"
    stroke="black"
    fill="none" />
</svg>
```

## Quadratic Bézier: Q, q, T, t

- **`Q x1 y1, x y`:** one control point sets the slope at both the start and the end. In `q`, both pairs are relative to the previous point (`dx dy` is not relative to `dx1 dy1`).
- **`T x y`** is the smooth quadratic: it reflects the previous control point. It only works after `Q` or `T`; otherwise the control point is the current point and only lines are drawn.

```html
<svg width="190" height="160" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 80 Q 52.5 10, 95 80 T 180 80" stroke="black" fill="none" />
</svg>
```

Implicit repetition of `t`:

```html
<path fill="none" stroke="red" d="M 10,50 Q 25,25 40,50 t 30,0 30,0 30,0 30,0 30,0" />
```

## Elliptical arcs: A, a

- **`A rx ry x-axis-rotation large-arc-flag sweep-flag x y`** (or `a ... dx dy`). The ellipse center is computed for you; `x-axis-rotation` is the ellipse's rotation relative to the x-axis, in degrees.
- **Four candidate arcs.** For given radii there are generally two ellipses through the two points and two arcs on each; the two flags pick one.
- **`large-arc-flag`:** `1` picks one of the two arcs sweeping 180° or more, `0` one of the two sweeping 180° or less.
- **`sweep-flag`:** `1` draws in the positive-angle direction (the angle increases from the start point), `0` the negative-angle direction. MDN describes `1` as clockwise and `0` as counterclockwise.
- **Flags are single characters.** The grammar is `flag::= ("0" | "1")`, and the separator after a flag is optional (`flag comma_wsp? flag comma_wsp? coordinate_pair`).
- **Out-of-range values are corrected, not rejected** (user agents must apply this, which keeps animations through invalid values continuous): an endpoint equal to the current point omits the arc; `rx` or `ry` of 0 draws a straight line; negative radii use their absolute value; radii too small to reach the endpoint scale the ellipse up uniformly until there is exactly one solution.
- **Full circles are the one thing arcs struggle with:** a start point equal to the end point is undefined. Use two semicircle arcs, or just `circle`/`ellipse`.
- **Arcs suit pie charts,** one arc per slice.

All four flag combinations:

```html
<svg width="360" height="360" xmlns="http://www.w3.org/2000/svg">
  <path d="M 100 100 A 45 45, 0, 0, 0, 145 145 L 145 100 Z" fill="#00FF00A0" stroke="black" stroke-width="2" />
  <path d="M 250 100 A 45 45, 0, 1, 0, 295 145 L 295 100 Z" fill="#FF0000A0" stroke="black" stroke-width="2" />
  <path d="M 100 250 A 45 45, 0, 0, 1, 145 295 L 145 250 Z" fill="#FF00FFA0" stroke="black" stroke-width="2" />
  <path d="M 250 250 A 45 45, 0, 1, 1, 295 295 L 295 250 Z" fill="#0000FFA0" stroke="black" stroke-width="2" />
</svg>
```

A pie wedge:

```html
<path d="M300,200 h-150 a150,150 0 1,0 150,-150 z" fill="red" stroke="blue" stroke-width="5" />
```

## Syntax and compaction

- **Drop separators where unambiguous:** `M100 100L200 200`. A repeated command letter may be omitted: `M 100 200 L 200 100 -100 -200`.
- **Only `.` is a decimal point.** `13,000.56` is invalid; write `13000.56`.
- **Parsing is greedy:** `M 100-200` is 100, -200; `M 0.6.5` is 0.6, .5.
- **No trailing decimal points.** SVG 2 disallows `23.`; authors and tools must not write them, though user agents may accept them.
- **Newlines are allowed** and normalized to spaces.

## Errors

- **A grammar error truncates the path:** it renders up to, not including, the command with the first error.
- **A wrong parameter count** keeps the last correctly defined segment: `M 10,10 L 20,20,30` draws the line from (10,10) to (20,20).
- **Zero-length segments are valid;** with `round` or `square` caps they paint a dot or a square ([SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#stroke-linecap)).

## Animating d

- **Same structure or no tween.** Two `d` values interpolate smoothly only with the same number and types of commands in the same order; otherwise interpolation is discrete. Arc flags interpolate as fractions, and any non-zero value counts as 1.
- **CSS can swap `d`** with `path()` (no Safari support for the `d` property, see above):

```css
#svg_css_ex1:hover path {
  d: path(
    "M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z M5,5 L90,90"
  );
}
```

Transitions and keyframes are in [CSS-ANIMATION.md](CSS-ANIMATION.md); `<animate>` on `d` or `points` is in [SMIL.md](SMIL.md).

## Smoothed corners (squircles) as a path

[corner-smoothing] (gabrielobholz/corner-smoothing-skill, `references/implementation.md`). "CSS `border-radius` alone cannot express this shape": "Apple-like smoothing keeps the same radius but eases the transition between straight edges and the corner." The skill draws it as path data, usable in SVG, `clip-path: path()` and Canvas `Path2D`. In a CSS box, `corner-shape: squircle` is the native route where it ships ([modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#corner-shape-and-superellipse)); the path covers the other browsers, SVG icons, Canvas and shapes outside a CSS box. Verbatim generator:

```js
function appleCornerPath({ width, height, radius, smoothing = 60 }) {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const r = clamp(radius, 0, Math.min(w, h) / 2);
  const s = clamp(smoothing, 0, 100) / 100;

  if (!w || !h) return "";
  if (!r) return `M0 0H${w}V${h}H0Z`;

  if (s <= 0.001) {
    const c = r * 0.5522847498307936;
    return `M${r} 0H${w - r}C${w - r + c} 0 ${w} ${r - c} ${w} ${r}V${h - r}C${w} ${h - r + c} ${w - r + c} ${h} ${w - r} ${h}H${r}C${r - c} ${h} 0 ${h - r + c} 0 ${h - r}V${r}C0 ${r - c} ${r - c} 0 ${r} 0Z`;
  }

  const exponent = 2 + s * 3.35;
  const steps = 22;
  const points = [];

  const corner = (cx, cy, a0, a1) => {
    for (let i = 0; i <= steps; i += 1) {
      const a = a0 + (a1 - a0) * (i / steps);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = cx + r * Math.sign(cos) * Math.abs(cos) ** (2 / exponent);
      const y = cy + r * Math.sign(sin) * Math.abs(sin) ** (2 / exponent);
      points.push([+x.toFixed(3), +y.toFixed(3)]);
    }
  };

  points.push([r, 0], [w - r, 0]);
  corner(w - r, r, -Math.PI / 2, 0);
  points.push([w, h - r]);
  corner(w - r, h - r, 0, Math.PI / 2);
  points.push([r, h]);
  corner(r, h - r, Math.PI / 2, Math.PI);
  points.push([0, r]);
  corner(r, r, Math.PI, Math.PI * 1.5);

  const deduped = points.filter((point, index, all) => {
    if (index === 0) return true;
    const prev = all[index - 1];
    return point[0] !== prev[0] || point[1] !== prev[1];
  });

  return `M${deduped.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
}
```

- **Clamp the radius** "to `min(width, height) / 2`. This prevents self-intersecting paths when components become small or responsive." The function does it; keep it if you change the code.
- **Defaults:** "`smoothing: 0` gives a normal circular rounded rectangle" (the function then returns cubic Béziers with the circle constant `0.5522847498307936`); "`smoothing: 60` is the Apple/iOS-style default"; "`smoothing: 100` is the strongest smoothed/squircle-like treatment." "Increase `steps` for very large rendered shapes; 22 is enough for most UI components."
- **What it outputs** (measured by running the function, not stated by the source): each corner samples `|x/r|^n + |y/r|^n = 1` with `n = 2 + 3.35 * smoothing`, the superellipse family of CSS `superellipse()`, so smoothing 60 is close to `squircle`. The result is a polyline of straight `L` segments, 22 per corner, not curves.
- **Its point count changes with geometry:** 93 points at 300 by 300 with radius 52, 89 at radius 150 (the edge points coincide and are deduped), 91 at 300 by 100, and at smoothing 0 it switches to `C` commands. By [Same structure or no tween](#animating-d), a CSS or SMIL morph between two outputs jumps. The skill's rule "When animating smoothing, keep `width`, `height`, and `radius` stable and update only the generated path" works when script rewrites `d` every frame.
- **Usage, verbatim:**

```html
<svg width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
  <path id="card-shape" fill="#0081f2"></path>
</svg>

<script>
  document.querySelector("#card-shape").setAttribute(
    "d",
    appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 })
  );
</script>
```

```js
const d = appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 });
element.style.clipPath = `path("${d}")`;
```

```js
const d = appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 });
const path = new Path2D(d);
ctx.fill(path);
```

- **The clip-path caveat, corrected.** The source says to use `clip-path` "only when browser support is acceptable and the path dimensions match the element". Support is not the issue: `path()` is Baseline widely available, "available across browsers since July 2020". Scaling is: its lengths are pixels only, so regenerate the path whenever the element resizes ([CLIP-AND-MASK.md](CLIP-AND-MASK.md#css-clip-path-values)). `new Path2D(d)` takes "a string consisting of SVG path data", Baseline widely available since August 2016 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/Path2D)).
- **Don't change layout while smoothing changes:** "The smoothing path should affect only drawing/clipping. Do not change element width, height, padding, or layout metrics while animating smoothing."

## pathLength

- **Declares the path's total length in user units;** the browser scales every distance computation by `pathLength / (computed path length)`.
- **Affects** text on a path, motion animation and stroke operations: `stroke-dasharray` and `stroke-dashoffset` treat the path as running from 0 to `pathLength`.
- **Applies to** `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`; `<number>`, default none, animatable.
- **Values:** zero is valid and means an infinite scaling factor; negative is an error; no effect on percentage distance calculations.
- **What counts:** a moveto has zero length; only lineto, curveto and arcto contribute.
- **The CSS `path-length` property** (`none | <length> [0,∞]`) is in the SVG 2 TR, resolved by the CSS WG on 22 January 2020; MDN says the CSS property wins when both are given. Support: Chrome 149 behind a flag, Firefox and Safari no, experimental.

```html
<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
  <style>
    path {
      fill: none;
      stroke: black;
      stroke-width: 2;
      stroke-dasharray: 10;
    }
  </style>
  <!-- No pathLength, the real length of the path is used. In that case, 100 user units -->
  <path d="M 0,10 h100" />
  <!-- compute everything like if the path length was 90 user units long -->
  <path d="M 0,20 h100" pathLength="90" />
  <!-- compute everything like if the path length was 50 user units long -->
  <path d="M 0,30 h100" pathLength="50" />
  <!-- compute everything like if the path length was 30 user units long -->
  <path d="M 0,40 h100" pathLength="30" />
  <!-- compute everything like if the path length was 10 user units long -->
  <path d="M 0,50 h100" pathLength="10" />
</svg>
```

## Prove it

- Every `d` starts with `M` (or `m`) and renders to its last command; a path that stops early has a parse error at the first missing segment.
- No `d` contains thousands separators, trailing decimal points, or flags other than `0`/`1`.
- Closed outlines end in `Z`, so the corner shows the line join and not two caps.
- Full circles are drawn with `circle`/`ellipse` or two arcs, never one arc back to its own start.
- Two `d` values meant to morph have the same commands in the same order; check the tween is smooth, not a jump.
- With `pathLength="100"`, `stroke-dasharray="100"` and `stroke-dashoffset="100"` the stroke is hidden and offset `0` shows it whole.
- A generated squircle path has its radius clamped to `min(width, height) / 2`, renders without facets at its largest size, and any animated smoothing rewrites `d` from script rather than tweening two outputs.
