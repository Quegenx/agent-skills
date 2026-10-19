# Animating SVG with CSS

Many SVG attributes are also CSS properties, so CSS transitions and keyframes animate them the same way as any other CSS property, "with a few quirks". Two mechanisms decide most outcomes: transforms on SVG elements are measured from the viewBox origin unless you set `transform-box: fill-box`, and CSS can only animate what is a CSS property (attributes like `points` or `viewBox` need [SMIL.md](SMIL.md) or a library). Which attributes are CSS properties, and how they cascade: [STYLING.md](STYLING.md). Durations, curves, springs and staggers: [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md). Path data for `d`: [PATHS.md](PATHS.md).

## The ways to animate SVG

- **SVG 2 lists five:** SVG animation elements (SMIL), CSS Animations, CSS Transitions, the SVG DOM (ideally with the HTML animation-frame APIs) and the Web Animations API. "SVG does not mandate support for any of these animation methods"; UAs that support them are expected to support them for SVG documents and fragments. JS options: [JS-AND-REACT.md](JS-AND-REACT.md).
- **CSS can't reach attributes that never became CSS properties:** `viewBox`, `points` on a polyline, `x1`/`y1`/`x2`/`y2` on a line, `offset` on a gradient stop, and every filter primitive attribute (`stdDeviation`, `baseFrequency`, `numOctaves`...). WAAPI can't either, because "it *is* the CSS engine" (Motion's docs).
- **In an image context declarative animation still runs.** SVG shown through `<img>`, CSS `background-image` or SVG `<image>` is processed in secure animated mode: SMIL plus CSS Transitions and Animations stay enabled, while script, external references and interactivity are disabled (external resources load only when inlined as `data:` URLs). `<iframe>`/`<object>`/`<embed>` don't have these restrictions.
- **SVG pulled in through `<use>` of an external document, or a paint-server cross-reference, is processed in secure static mode:** animations don't run inside that sub-resource.
- **Externally referenced SVGs limit animation.** The course: `<img>` and CSS `url()` cut bundle size and can be cached, but "you're more limited on animation options".

## Transforms: transform-origin and transform-box

Use the canonical [origin and reference-box rules](REUSE-AND-TRANSFORMS.md#transform-origin-and-transform-box), including CSS layout-box mapping, individual transforms, the explicit-origin and rotating-box examples, Motion's automatic `fill-box` behavior and opt-out, and the compatibility table.

## Transitions and keyframes

- **Transition a presentation property like any CSS property** (Motion's docs):

```css
circle {
  fill: #0f0;
  transition: fill 0.3s;
}
circle:hover {
  fill: #f00;
}
```

- **Chaining.** The course's Module 1 covers techniques for chaining animations (the outline doesn't say which); SMIL's syncbase chaining (`begin="first.end"`) is in [SMIL.md](SMIL.md#begin-and-end).
- **Animate custom properties after registering them with `@property`,** and pass values into `<use>` instances through custom properties: [STYLING.md](STYLING.md#css-custom-properties).

### Performance

- **Chromium 89 hardware-accelerates SVG animations by default** ("Chrome will join the likes of Firefox"), with no developer action. A spinner that repainted every frame in Chromium 88 showed no repaint in 89. The properties accelerated then were `opacity`, `filter` and `transform` (post last updated 2021-02-22).
- **Motion's cost model:** animating an SVG is broadly a paint. `transform`/`opacity` through CSS, WAAPI or Motion is GPU-accelerated, but through GSAP or plain JS it is "animated on the main thread". Path drawing and morphing still trigger paint, and paint cost scales with surface area, so animating `transform` is cheaper than `x`, `cx` or `r`. Animating `viewBox` repaints the contents.

## Line drawing with stroke-dasharray and stroke-dashoffset

- **How it works:** the shape needs a stroke, and strokes can be dashed. Make one dash longer than the whole stroke, offset it so the gap covers the shape, then animate `stroke-dashoffset` back to 0. Use `animation-fill-mode: forwards` (here `forwards` in the shorthand) so the end state stays.

```css
.path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: dash 5s linear forwards;
}
@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
```

- **Read the real length in JS** when you don't know it: `var length = path.getTotalLength();` (see [JS-AND-REACT.md](JS-AND-REACT.md#path-length-and-points)).
- **Or skip measuring with `pathLength`.** `pathLength` sets an author total length in user units; all distance computations are scaled by `pathLength / computed length`, and `stroke-dasharray` treats the path end as the `pathLength` value. It applies to `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`.

```html
<!-- compute everything like if the path length was 50 user units long -->
<path d="M 0,30 h100" pathLength="50" />
```

- **Motion's recommended pattern is `pathLength="1"`** and 0 to 1 progress units, with no DOM measurement. It warns that `getTotalLength()` "introduces a DOM measurement which... will lead to style thrashing" unless batched.

```html
<path pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" />
```

- **`pathLength` also evens out browsers.** Specs allow browsers to estimate path length with their own algorithm, so measured lengths may differ; `pathLength` lets the browser scale its calculations to match (a CSS-Tricks comment).
- **Closed paths can misbehave.** Browsers don't all interpret `stroke-dashoffset` the same way when the dash pattern is twice the length of a closed path. The alternative is to animate only `stroke-dasharray` from `0 1000` to `1000 0`:

```css
.path {
  stroke-dasharray: 0 1000;
  animation: dash 5s linear alternate infinite;
}
@keyframes dash {
  from { stroke-dasharray: 0 1000; }
  to { stroke-dasharray: 1000 0; }
}
```

- **`stroke-dasharray` values:** `none` (default) or a comma/space list of `<number>`/`<length>`/`<percentage>`. An odd count is repeated to make it even. Percentages refer to the normalized viewport diagonal. Negatives are invalid. It is inherited, so setting it on `<g>` works.
- **`stroke-dashoffset` direction:** positive values shift the pattern backwards, negative forwards. Percentages are against the viewport diagonal, "_not_ to the overall length of the stroke path". MDN marks the bare `<number>` value non-standard.
- **The CSS `path-length` property** wins over the attribute, but browser-compat-data shows it only in Chrome 149, not Firefox or Safari.

## Techniques from transitions.dev

[transitions.dev] (Jakubantalik/transitions.dev skills `transitions-dev` and `transitions-ui-generation`). Its license forbids republishing a substantial part of the collection, so these are described in our words with short credited fragments; the snippets themselves are at [transitions.dev](https://transitions.dev).

- **Draw a check with a transition, not keyframes.** Its checkbox transitions `stroke-dashoffset` instead of running a keyframe, so unchecking mid-draw reverses from where the stroke is. That is the interruptible rule in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).
- **Round a measured length up.** Where it measures the path, it sets the dash from `Math.ceil(path.getTotalLength())` and rounds up by 1px "to absorb sub-pixel float jitter": a dash shorter than the path pre-reveals the stroke before the draw starts. `pathLength="1"` above avoids the measurement.
- **Flip a chevron instead of morphing it.** Its accordion chevron turns over with `scaleY(-1)`, and `vector-effect: non-scaling-stroke` keeps the stroke width ([SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md)), rather than animating `d`. Its reason, that CSS `d` "is Chromium-only", is wrong: browser-compat-data lists Chrome 52 and Firefox 97, and only Safari parses `d` without effect ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d)), as [Animate d with path()](#animate-d-with-path) says. app-ui turns its chevron instead: "a down chevron turned 90deg while closed, 0 when open, over 200ms `cubic-bezier(.4, 0, .2, 1)`" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).
- **Blur along one axis.** Its spinning digit counter blurs the moving reels only vertically with an SVG `feGaussianBlur` given two values (`stdDeviation="0 Y"`, x then y), because CSS `blur()` takes one radius and smears sideways too; the blur decays to 0 as each reel settles. The primitive is in [FILTERS.md](FILTERS.md).
- **Dotted lines that flow while they draw.** `transitions-ui-generation` draws lines as dots: `stroke-linecap: round` with a zero-length dash and a gap (`0 gap`) puts a round dot every gap ([SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#stroke-dasharray) has the static form). To draw it in, it rebuilds the dash array each frame so exactly `floor(L * progress / gap) + 1` dots show along the length `L`, then ends with one long gap. Shifting `stroke-dashoffset` by a small negative amount each frame, modulo the gap, makes the dots travel along the line, and a separate head dot sits at `getPointAtLength()` of the last dot ([JS-AND-REACT.md](JS-AND-REACT.md#path-length-and-points)). Its gaps run 3.6 to 6.5 user units with a 2.1px dot.
- **Redrawing a page's icons in a scaled group.** The same skill re-strokes each inline icon inside a `<g transform="matrix(...)">` taken from `getScreenCTM()`, and divides the stroke width, gap and head radius by `sqrt(|det|)` of that matrix so they render at the same screen size whatever the icon's scale.
- Source claims not repeated here: that transforming an inline SVG makes Chromium rasterise it at 1x, and that `will-change` freezes an icon's raster at its start scale. MDN doesn't document either.

## Animate d with path()

- **`path()` takes an SVG path string.** It is used in `offset-path`, `clip-path` and the SVG `d` property. It must be one string (it can't be built from `var()`), and all lengths are implicitly px. MDN says `shape()` "offers more flexibility". An optional `<fill-rule>` first argument is allowed only in `clip-path`; it invalidates `offset-path`.
- **Both paths must match.** MDN: "the same number of data points"; Motion's docs: "the same order of path draw commands". For different shapes, Motion's docs suggest a path mixer such as Flubber.
- **Not in Safari.** CSS `d` works in Chrome 52+ and Firefox 97+; Safari parses it with no effect. Motion's docs agree: `d` morphing via CSS/WAAPI is "Not in Safari". SMIL can animate any attribute: [SMIL.md](SMIL.md).

```css
path {
  d: path(
    "M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z M90,5 L5,90"
  );
  transition: all 2s;
  fill: none;
  stroke: red;
  stroke-width: 3px;
}

svg:hover path {
  d: path(
    "M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z M5,5 L90,90"
  );
  stroke: black;
}
```

```css
#svg_css_ex1:hover path {
  d: path("M20,80 L50,20 L80,80");
}
```
```html
<svg id="svg_css_ex1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path fill="none" stroke="red" d="M20,20 L50,80 L80,20" />
</svg>
```

## Prove it

- **Origin:** rotate a shape away from the viewBox origin with no `transform-box`; it swings around the viewBox corner. Add `transform-box: fill-box; transform-origin: center;`; it spins in place.
- **Unanimatable:** a `transition` on a polyline's `points` or the root's `viewBox` does nothing; move it to SMIL.
- **Line drawing:** with `pathLength="1"`, `stroke-dasharray="1 1"` and `stroke-dashoffset` animated from 1 to 0, the stroke draws fully with no JS. Test closed paths in every target browser.
- **`d` morph:** the hover morph works in Chrome and Firefox and stays still in Safari; the two `path()` strings have the same commands in the same order.
- **Paint:** in Chromium 89+, a `transform`/`opacity` SVG animation shows no repaint each frame; path drawing and morphing still paint.
- **Image context:** the same SVG in `<img>` still runs its CSS and SMIL animation, and its scripts don't run.
- **Checks that undo:** a checkbox tick drawn with a `stroke-dashoffset` transition, unchecked halfway, retracts from where it was without jumping.
