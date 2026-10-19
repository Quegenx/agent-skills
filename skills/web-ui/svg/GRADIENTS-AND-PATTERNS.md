# Gradients and patterns

Gradients and patterns are paint servers: defined once (with an `id`, usually in `<defs>`) and painted onto shapes through `fill` or `stroke` with `url(#id)`, which makes them reusable. Most surprises come from the units attribute: by default a gradient or pattern tile is sized to the bounding box of the shape it paints (`objectBoundingBox`, 0 to 1), while pattern content is drawn in user space, so a shape that changes size or isn't square changes what you see. For the coordinate system itself, see [BASICS.md](BASICS.md); for the cascade between attributes and CSS, see [STYLING.md](STYLING.md).

## Gradients: how they work

- **Two types, defined apart from use.** `<linearGradient>` and `<radialGradient>`. Every gradient **must** have an `id` so other elements can reference it. Put the definition in a `<defs>` element or an `<svg>` element.
- **Colors come from `<stop>` children.** A `<stop>` is always a child of a `linearGradient` or `radialGradient`. Give each an `offset` (position) and a `stop-color`, and optionally `stop-opacity` (`<stop offset="100%" stop-color="yellow" stop-opacity="0.5"/>`). All three can be attributes or CSS (`stop-color` and `stop-opacity` are CSS properties).
- **Offsets always increase** from `0%` (or `0`) to `100%` (or `1`). With duplicate offsets, the stop furthest down the XML tree wins.
- **Apply with `url()`** on `fill` or `stroke`: CSS `fill: url("#Gradient1");` or the attribute `fill="url(#Gradient2)"`.
- **SVG gradients are not CSS gradients.** CSS `radial-gradient()` applies only to HTML elements; an SVG gradient applies only to SVG elements.

### Linear

- **The gradient runs along the line from (`x1`,`y1`) to (`x2`,`y2`).** It defaults to horizontal (`x1` `0%`, `x2` `100%`, `y1` `0%`, `y2` `0%`). `x1="0" x2="0" y1="0" y2="1"` makes it vertical.

```html
<svg width="120" height="240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="Gradient1">
      <stop class="stop1" offset="0%" />
      <stop class="stop2" offset="50%" />
      <stop class="stop3" offset="100%" />
    </linearGradient>
    <linearGradient id="Gradient2" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="red" />
      <stop offset="50%" stop-color="black" stop-opacity="0" />
      <stop offset="100%" stop-color="blue" />
    </linearGradient>
  </defs>
  <style>
    #rect1 { fill: url("#Gradient1"); }
    .stop1 { stop-color: red; }
    .stop2 { stop-color: black; stop-opacity: 0; }
    .stop3 { stop-color: blue; }
  </style>
  <rect id="rect1" x="10" y="10" rx="15" ry="15" width="100" height="100" />
  <rect x="10" y="120" rx="15" ry="15" width="100" height="100" fill="url(#Gradient2)" />
</svg>
```

### Radial

- **`cx`, `cy`, `r` define the end circle; `fx`, `fy` the focal point** (where its middle is). With no focal point it sits at the center. A focal point moved outside the circle can't render correctly, so the spot is assumed to be within the edge of the circle. `fr` is the focal radius.

```html
<radialGradient id="Gradient" cx="0.5" cy="0.5" r="0.5" fx="0.25" fy="0.25">
  <stop offset="0%" stop-color="red" />
  <stop offset="100%" stop-color="blue" />
</radialGradient>
<radialGradient id="GradientReflect" cx="0.5" cy="0.5" r="0.4" fx="0.75" fy="0.75" spreadMethod="reflect">
  <stop offset="0%" stop-color="red" />
  <stop offset="100%" stop-color="blue" />
</radialGradient>
```

### Reuse stops with `href`

- **`href` on a gradient inherits its attributes and stops** from another gradient, so you don't recreate stops. `xlink:href` is deprecated.

```html
<linearGradient id="Gradient1">
  <stop id="stop1" offset="0%" />
  <stop id="stop2" offset="50%" />
  <stop id="stop3" offset="100%" />
</linearGradient>
<linearGradient id="Gradient2" x1="0" x2="0" y1="0" y2="1" href="#Gradient1" />
```

### spreadMethod

| Value | Past the last offset |
|---|---|
| `pad` (default) | The final offset color fills the rest |
| `reflect` | Continues reflected in reverse, 100% back to 0% and up again |
| `repeat` | Jumps back to the beginning and runs again |

### gradientUnits and gradientTransform

- **`objectBoundingBox` (default)** scales the gradient to the painted object, so coordinates are 0 to 1 and percentages are relative to its bounding box.
- **`userSpaceOnUse`** takes absolute units in the user coordinate system of the element referencing the gradient; you must know where the object is and place the gradient there. Percentages are relative to the current SVG viewport.

```html
<radialGradient id="Gradient" cx="60" cy="60" r="50" fx="35" fy="35" gradientUnits="userSpaceOnUse"></radialGradient>
```

- **Non-square bounding boxes distort `objectBoundingBox` gradients.** The gradient normal can stop being perpendicular to the gradient vector in user space (it stays perpendicular only if the vector is parallel to a box axis), and radial rings render as ellipses.
- **`gradientTransform`** adds a transformation from the gradient coordinate system onto the target, for example skewing. It is post-multiplied (inserted to the right of) any earlier transforms, including the implicit bounding-box-to-user-space one.

```html
<radialGradient id="gradient2" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="100" fx="100" fy="100"
  gradientTransform="skewX(20) translate(185, 0)">
  <stop offset="0%" stop-color="darkblue" />
  <stop offset="50%" stop-color="skyblue" />
  <stop offset="100%" stop-color="darkblue" />
</radialGradient>
```

### Attribute reference

| Element | Attribute | Default |
|---|---|---|
| `linearGradient` | `x1`, `y1`, `y2` | `0%` |
| `linearGradient` | `x2` | `100%` |
| both | `gradientUnits` | `objectBoundingBox` |
| both | `gradientTransform` | identity |
| both | `spreadMethod` | `pad` |
| both | `href` | none |
| `radialGradient` | `cx`, `cy`, `r` | `50%` |
| `radialGradient` | `fr` | `0%` |
| `radialGradient` | `fx`, `fy` | same as `cx`, `cy` |
| `stop` | `offset` | `0` |
| `stop` | `stop-color` | `black` |
| `stop` | `stop-opacity` | `1` |

- **Everything here is animatable,** including `offset`, `stop-color` and `stop-opacity`.
- **The CSS `stop-color` property overrides the attribute,** accepts any `<color>` including `currentColor`, and applies only to `<stop>` elements nested in an `<svg>`, not to other SVG, HTML or pseudo-elements.

## Patterns

- **`<pattern>` tiles a graphic** at repeated x and y intervals to cover an area. Put it in `<defs>`; inside, use any basic shapes styled with anything, gradients and opacity included.
- **`width`/`height` set how far the pattern goes before repeating;** `x`/`y` offset the start point.
- **Two unit systems, opposite defaults.** `patternUnits` (the tile's x, y, width, height) defaults to `objectBoundingBox`, where 1 is the full width or height of the filled object. `patternContentUnits` (the shapes inside) defaults to `userSpaceOnUse`. So by default the tile and its content live in different coordinate systems.

```html
<pattern id="Pattern" x="0" y="0" width=".25" height=".25">
```

  On a 200x200 rect that tile is 50x50, and the content is drawn for a 50x50 box; anything drawn outside it isn't shown.
- **With the defaults, resizing the object scales the tile but not the content,** leaving large empty areas between the shapes. Set `patternContentUnits="objectBoundingBox"` to make the content scale with the object.
- **For a fixed-size tile that repeats regardless of the object's shape** (what you'd normally think of as a pattern), put both in user space:

```xml
<pattern id="Pattern" x="10" y="10" width="50" height="50" patternUnits="userSpaceOnUse">
  <rect x="0" y="0" width="50" height="50" fill="skyblue"/>
  <rect x="0" y="0" width="25" height="25" fill="url(#Gradient2)"/>
  <circle cx="25" cy="25" r="20" fill="url(#Gradient1)" fill-opacity="0.5"/>
</pattern>
```

| `pattern` attribute | Default |
|---|---|
| `x`, `y`, `width`, `height` | `0` |
| `patternUnits` | `objectBoundingBox` |
| `patternContentUnits` | `userSpaceOnUse` |
| `patternTransform` | identity |
| `preserveAspectRatio` | `xMidYMid meet` |
| `viewBox` | none |
| `href` | none (`xlink:href` deprecated) |

All pattern attributes are animatable.

## Prove it

- **Every gradient has an `id`** and every `url(#id)` that uses it matches one.
- **Stop offsets increase** from 0 to 1 (or 0% to 100%) with no accidental duplicates.
- **Non-square shapes:** a gradient painted on a wide rect with the default `objectBoundingBox` looks the way you intended: radial rings stay circles and the gradient normal stays perpendicular, or you have chosen `userSpaceOnUse`.
- **Resize test for patterns:** change the filled shape's width and height; with `patternUnits="userSpaceOnUse"` the tile size stays fixed, and with the defaults there are no large empty areas between the shapes (or `patternContentUnits="objectBoundingBox"` is set).
- **CSS overrides attributes:** a `stop-color` set in CSS wins over the `stop-color` attribute on the same stop.
