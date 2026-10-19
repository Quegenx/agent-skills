# Styling SVG

Many SVG attributes, like `fill` and `stroke`, are also valid CSS properties, so SVG can be styled from a stylesheet and animated with CSS transitions and animations. One rule decides most outcomes: a presentation attribute has specificity `0` and comes first among author styles, so any CSS rule or `style` attribute that sets the same property wins over it. Some CSS features don't work with SVG, and some SVG features don't work with CSS. For the elements and coordinate system see [BASICS.md](BASICS.md); for `d` and path data see [PATHS.md](PATHS.md); for animating these properties see [CSS-ANIMATION.md](CSS-ANIMATION.md).

## Presentation attributes and the cascade

- **Presentation attributes are SVG attributes that can also be used as CSS properties** on SVG elements. Only elements in the SVG namespace support them; an attribute that happens to share a property name but isn't a presentation attribute must not affect the cascade.
- **They have specificity 0.** They contribute to the author level of the cascade, followed by all other author-level style sheets. CSS Transforms describes it as the user agent inserting a new author style sheet for presentation attributes, first in the author style sheet collection. Any author rule or `style` attribute overrides them.
- **The CSS property beats the attribute when both are set.** MDN states this for `fill` ("When both are specified, the CSS property takes priority"), `transform-origin` and `pathLength`/`path-length`.
- **No `!important` in an attribute.** Presentation attribute values are parsed as CSS values, not declarations; an `!important` inside one "will cause it to have an invalid value".
- **Most inherit, geometry does not.** Most presentation attributes inherit when used as CSS properties (`fill`, `stroke`). Geometry properties are the main exception: their CSS counterparts do not inherit.
- **Animating the attribute equals animating the property.** "Animation of presentation attributes is equivalent to animating the corresponding property."
- **Prefer CSS for styling.** SVG 2: "In the future, any new properties that apply to SVG content will not gain presentation attributes. Therefore, authors are suggested to use styling properties, either through inline 'style' properties or style sheets, rather than presentation attributes, for styling SVG content."

The spec example: the stylesheet's `translate(100px, 100px)` overrides the attribute's `translate(200 200)`, so the group moves 100px, not 200px.

```html
<svg xmlns="http://www.w3.org/2000/svg">
  <style>
    .container {
      transform: translate(100px, 100px);
    }
  </style>
  <g class="container" transform="translate(200 200)">
    <rect width="100" height="100" fill="blue" />
  </g>
</svg>
```

The course's first styling example, with `fill` set from CSS:

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

### Attribute name to property name

- **The attribute name is the property name in lower case.** The exceptions are for `transform`: `transform` on most elements, `patternTransform` on `<pattern>`, `gradientTransform` on `<linearGradient>`/`<radialGradient>`. All three map to the CSS `transform` property.
- **The `transform` attribute syntax differs from CSS** for backward compatibility. `translateX()`, `translateY()`, `scaleX()`, `scaleY()` and `skew()` are not supported in the `transform`/`patternTransform`/`gradientTransform` attributes. Attribute numbers map to CSS `px` for translate and to `deg` for rotate. The attribute only has the single-value form of rotate when mapped to CSS `rotate()`.
- **`fill` has two meanings.** On shapes and text it is a presentation attribute (a `<paint>`, default `black`, animatable). On `animate`/`animateMotion`/`animateTransform`/`set` it sets the animation's final state (`freeze` | `remove`, default `remove`); see [SMIL.md](SMIL.md).

### Which attributes are presentation attributes (SVG 2 table)

| Attribute | Elements |
|---|---|
| `cx`, `cy` | `circle`, `ellipse` |
| `height`, `width`, `x`, `y` | `foreignObject`, `image`, `rect`, `svg`, `symbol`, `use` |
| `r` | `circle` |
| `rx`, `ry` | `ellipse`, `rect` |
| `d` | `path` |
| `fill` | any SVG element except animation elements, which have their own `fill` attribute |
| `transform` | any SVG element except `pattern`, `linearGradient`, `radialGradient` (those use `patternTransform`/`gradientTransform`) |

On any SVG element: alignment-baseline, baseline-shift, clip-path, clip-rule, color, color-interpolation, color-interpolation-filters, cursor, direction, display, dominant-baseline, fill-opacity, fill-rule, filter, flood-color, flood-opacity, font-family, font-size, font-size-adjust, font-stretch, font-style, font-variant, font-weight, glyph-orientation-vertical, image-rendering, letter-spacing, lighting-color, marker-end, marker-mid, marker-start, mask, mask-type, opacity, overflow, paint-order, pointer-events, shape-rendering, stop-color, stop-opacity, stroke, stroke-dasharray, stroke-dashoffset, stroke-linecap, stroke-linejoin, stroke-miterlimit, stroke-opacity, stroke-width, text-anchor, text-decoration, text-overflow, text-rendering, transform-origin, unicode-bidi, vector-effect, visibility, white-space, word-spacing, writing-mode.

- **The lists differ between sources.** MDN's list also includes `clip`, `font-width`, `glyph-orientation-horizontal` and `pathLength`, which the SVG 2 table lacks; MDN omits `paint-order`, which SVG 2 lists. Check the current MDN reference and spec for an attribute on the edge.
- **Same name, not always a presentation attribute.** `x` on `<text>`/`<tspan>` is not a presentation attribute for the `x` property, and `r` on `<radialGradient>` is not one for the `r` property.

## Geometry properties in CSS

- **Geometry properties set position and size of shapes.** In SVG 2 they are the subset `cx`, `cy`, `d`, `r`, `rx`, `ry`, `x`, `y`, `width`, `height`, and their CSS counterparts do not inherit.
- **Each works only on certain elements.** `r` sets the radius of a `<circle>` but has no effect on `<rect>`.
- **`cx`** sets the x center of a `<circle>` or `<ellipse>` nested in an `<svg>` (not `<radialGradient>`) and overrides the attribute. Values: `<length>` | `<percentage>`; percentages refer to the width of the current SVG viewport.

```css
circle:first-of-type {
  cx: 30px;
  fill: lightgreen;
  stroke: black;
}
```

- **`r`** works only on `<circle>` and overrides the attribute. Percentages refer to the normalized diagonal `sqrt(w²+h²)/sqrt(2)` of the SVG viewport. A `px` value is in user units: under `viewBox="0 0 200 100"` scaled to 300px wide, `r: 30px` renders as 45 CSS px.
- **`d`** defines the path drawn by `<path>` inside `<svg>` and overrides the attribute. Values: `none` | `path(<string>)`. Path data implicitly uses px units; an empty path is invalid. Animating it: [CSS-ANIMATION.md](CSS-ANIMATION.md#animate-d-with-path).

| CSS property | Chrome | Firefox | Safari |
|---|---|---|---|
| `cx` | 43 | 69 | 9 |
| `r` | 43 | 69 | 9 |
| `x` | 42 | 69 | 9 |
| `d` | 52 | 97 | not supported ("The property parses, but has no effect.") |
| `path-length` | 149 | no | no |

- **Sources disagree on when geometry properties shipped.** Motion's docs say `cx`, `cy`, `r`, `rx`, `ry`, `x`, `y`, `width` and `height` "landed across browsers between 2020 and 2024"; browser-compat-data gives Chrome 42 to 43, Firefox 69 and Safari 9 for `cx`/`r`/`x`. Both agree Safari doesn't support `d` as a style. Confirm in current browser-compat-data before relying on one.

## currentColor

- **`currentColor` is the element's `color` value.** It lets you use `color` on properties that don't receive it by default. As the value of `color` itself, it takes the inherited `color`.
- **`color` is a presentation attribute on any SVG element**, so `fill="currentColor"` and `stroke="currentColor"` make an icon follow the surrounding text color. Every course example draws this way:

```svg
<svg viewBox="0 0 100 100">
<rect x="20" y="20" width="60" height="40" fill="none" stroke="currentColor" stroke-width="3" />
<rect x="40" y="60" width="20" height="20" fill="currentColor" />
<line x1="35" y1="80" x2="65" y2="80" stroke="currentColor" stroke-width="2" />
</svg>
```

```css
.container {
  color: blue;
  border: 1px dashed currentColor;
}
.child {
  background: currentColor;
  height: 9px;
}
```

- **SVGR uses it too.** Its sample output uses `fill="currentColor"`, and its `replaceAttrValues` option exists mainly "to change an icon color to 'currentColor' in order to inherit from text color"; see [JS-AND-REACT.md](JS-AND-REACT.md#svgr).
- **`context-fill` / `context-stroke`** let a marker's content (or content referenced by `<use>`) take `fill`/`stroke` from the element using it.

## CSS custom properties

- **Custom properties reach inside `<use>`.** Content referenced by `<use>` is copied into a shadow DOM, so ordinary outside CSS can't style elements inside it, but custom properties cross that boundary. Read them with `var()` inside the symbol; non-inherited properties such as `fill` or `transform` need `var()` in their value. Include a fallback, e.g. `opacity: var(--eyelids-opacity, 1);`. Each `<use>` instance can carry its own values.

```css
use[data-outlaw="1"] { --eyelids-colour: #f7bea1; --eyelids-opacity: 1; }
use[data-outlaw="2"] { --eyelids-colour: #ba7e5e; --eyelids-opacity: 0; }

@keyframes tapping {
  0%, 60%, 100% { --foot-rotate: 0deg; }
  20% { --foot-rotate: -5deg; }
  40% { --foot-rotate: 2deg; }
}
use[data-outlaw="1"] { --foot-rotate: 0deg; animation: tapping 1s ease-in-out infinite; }
```

- **Register a property with `@property` to animate it in `@keyframes`** (typed `syntax`, `inherits`, `initial-value`):

```css
@property --progress {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 25%;
}
@keyframes progressAnimation {
  to {
    --progress: 100%;
  }
}
```

- **A registered property also guards a design system** (a wrong-typed value keeps the last valid one): [modern-css CUSTOM-PROPERTIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CUSTOM-PROPERTIES.md#typed-properties-with-property). Typed colours and hints animating inside a gradient: [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md); set every frame from JavaScript, it needs no transition: [Live properties from JS](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CUSTOM-PROPERTIES.md#live-properties-from-js).

- **Multiple `var()` fallbacks** "can be useful when working with Custom Elements and Shadow DOM".
- **`path()` can't be built from `var()` pieces.** The path must be a single string.

## Prove it

- **CSS wins:** put `fill="blue"` on a shape and `fill: red` in a stylesheet; the shape renders red. Add `!important` inside the attribute and the attribute becomes invalid.
- **Geometry in CSS:** set `cx: 30px` on a `<circle>` in CSS; it moves even with a different `cx` attribute. Set `r` on a `<rect>`; nothing changes.
- **`d` in Safari:** a CSS `d: path(...)` rule changes the path in Chrome 52+ and Firefox 97+, and has no effect in Safari.
- **currentColor:** change `color` on the parent of an icon drawn with `fill="currentColor"`; the icon recolors.
- **Through `<use>`:** two `<use>` instances with different custom property values render differently, and removing the value falls back to the `var()` fallback.
