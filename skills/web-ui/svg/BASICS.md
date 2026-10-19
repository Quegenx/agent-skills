# Basics

SVG is a markup language for images, as HTML is for documents: elements like `rect` and `circle` instead of `p` and `h1`. What decides most outcomes is that SVG has no layout algorithm. Every element sits where its own coordinates put it, in a user coordinate system that the root's `viewBox`, `width`, `height` and `preserveAspectRatio` map onto the screen, and later elements paint over earlier ones. Shapes and text are in [SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md), path data in [PATHS.md](PATHS.md), grouping and `transform` in [REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md), ways to put SVG on a page in [EMBEDDING-AND-ICONS.md](EMBEDDING-AND-ICONS.md).

**Contents:** [The format and the root](#the-format-and-the-root) · [xmlns](#xmlns) · [No layout algorithm](#no-layout-algorithm) · [The coordinate system](#the-coordinate-system) · [viewBox](#viewbox) · [width and height](#width-and-height) · [preserveAspectRatio](#preserveaspectratio) · [Nested svg](#nested-svg) · [Painting order](#painting-order) · [Prove it](#prove-it)

## The format and the root

- **Every SVG begins with a root `<svg>` element,** which works like HTML's `<html>`.

```svg
<svg>
  <!-- SVG code goes here -->
</svg>
```

- **`<svg>` is a container that defines a new coordinate system and viewport.** It is the outermost element of an SVG document, and can also embed an SVG fragment inside an SVG or HTML document.
- **`<svg>` creates new SVG content.** To embed an existing SVG document by URL use `<img>`, `<object>` or `<image>` (see [EMBEDDING-AND-ICONS.md](EMBEDDING-AND-ICONS.md)).
- **A fragment stands alone or inline.** An SVG document fragment can be a file of its own (an SVG document) or sit inline inside a parent HTML or XML document. `svg` elements can also appear in the middle of SVG content, which is how fragments embed in fragments and how a new SVG viewport is established.
- **Each element is a primitive shape.** Its appearance is controlled by attributes (`cx`, `cy`, `r` on `circle`).
- **Leave off the doctype.** DTD-based SVG validation leads to more problems than it solves, and identifying content by `DOCTYPE` is unreliable (DTDs are for validation, not identification).
- **`version` and `baseProfile` are deprecated in SVG 2,** as is `zoomAndPan` on `svg`. Before SVG 2 they identified the version for validation.

A standalone file:

```xml
<svg width="300" height="200"
     xmlns="http://www.w3.org/2000/svg">

  <rect width="100%" height="100%" fill="red" />

  <circle cx="150" cy="100" r="80" fill="green" />

  <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">SVG</text>

</svg>
```

The owner's course example, a monitor drawn with three shapes:

```svg
<svg viewBox="0 0 100 100">
<rect x="20" y="20" width="60" height="40" fill="none" stroke="currentColor" stroke-width="3" />
<rect x="40" y="60" width="20" height="20" fill="currentColor" />
<line x1="35" y1="80" x2="65" y2="80" stroke="currentColor" stroke-width="2" />
</svg>
```

## xmlns

- **The namespace is `http://www.w3.org/2000/svg`,** the same for SVG 2 as for earlier versions. It is just a string: it looks like a URI only for uniqueness and links nowhere.
- **Required on the outermost `svg` of SVG documents** and inside HTML documents with XML serialization. When SVG is parsed as XML the declaration must be present, otherwise user agents show the XML markup or report an error. SVG as an XML dialect must always bind namespaces correctly.
- **Not needed inline in HTML or on inner `svg`.** With the HTML syntax the parser supplies the namespace automatically; inlining works without it because SVG code is valid HTML.
- **In HTML, namespaces are implied:** HTML `http://www.w3.org/1999/xhtml`, SVG `http://www.w3.org/2000/svg`, MathML `http://www.w3.org/1998/Math/MathML`. Writing `<svg>` brings in the SVG namespace. XML namespace prefixes are not valid in HTML (prefixed `svg:svg` markup works only in `.xhtml`).
- **Inside `<foreignObject>`,** the XHTML namespace can be omitted in SVG embedded in HTML but is mandatory in an SVG document.
- **Needed when the SVG is referenced as an image** (`<img>` or CSS `url()`): mark it explicitly with `xmlns`.
- **Unprefixed vs prefixed.** An unprefixed `xmlns` on `svg` makes SVG the default namespace for every element in scope; a prefixed declaration (`xmlns:svg="..."`) means prefixing every element (`<svg:rect>`).
- **`xlink:href` needs its own declaration,** `xmlns:xlink="http://www.w3.org/1999/xlink"`, in XML; an unbound prefix is an XML error. See [REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md#href-vs-xlinkhref).
- **Creating and changing nodes from script:** use the namespace-aware element creation and the explicitly qualified attribute-method guidance in [JS-AND-REACT.md](JS-AND-REACT.md#create-svg-elements).

Inline in HTML, no `xmlns`:

```html
<html>
<svg viewBox="0 0 100 100">
 <circle cx="50" cy="50" r="50" fill="green">
</svg>
</html>
```

Referenced as an image file, with `xmlns`:

```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" />
</svg>
```

## No layout algorithm

- **Elements do not flow.** In HTML two `<p>` elements stack; two `<text>` elements in an SVG are drawn on top of each other. HTML's layout algorithm places each element relative to the others; in SVG it is completely up to you.

```svg
<svg fill="currentColor">
  <text>First text</text>
  <text>Another text</text>
</svg>
```

- **Move each element yourself,** for example with `y`:

```svg
<svg fill="currentColor">
  <text>First text</text>
  <text y="16">Another text</text>
</svg>
```

- **Text does not wrap either;** multi-line text is in [SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#multi-line-text).

## The coordinate system

- **Origin top left.** (0,0) is the top-left corner; x grows to the right, y grows downward (flipped from school graphing, the same as HTML positioning).
- **User units.** The unitless numbers in `x`, `y`, `width`, `height` are user units. When a viewport is first created one user unit equals one CSS pixel; `viewBox` changes that mapping. For the outermost `svg`, one unit of the initial coordinate system must equal one CSS px.
- **Two systems per viewport.** All content is drawn inside SVG viewports (distinct from the CSS "viewport"). Each one generates a viewport coordinate system and a user coordinate system, initially identical; `viewBox` transforms the user system relative to the viewport system, and children can change it further with `transform`.
- **Absolute units are converted.** `cm`, `mm`, `pt` resolve into the user coordinate system before rendering. CSS defines 1 inch = 96 px. `em` resolves against `font-size` (with `font-size="150"`, 1em = 150 user units).
- **A print sheet in millimeters.** [Jakub Krehel, technical-drawing] "Use one SVG user unit per millimeter of paper. A landscape A3 sheet starts with `width="420mm" height="297mm" viewBox="0 0 420 297"`." Every coordinate and stroke width is then paper millimeters. "For a print PNG, compute pixels as `millimeters / 25.4 * dpi`. At 300 dpi, landscape A3 rounds to 4961 by 3508 pixels" (420 / 25.4 * 300 = 4960.6, 297 / 25.4 * 300 = 3507.9). Margins, line weights and dimensions for such a sheet are in [technical-drawing sheet-and-svg.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/technical-drawing/sheet-and-svg.md).
- **Percentages:** x and width percentages resolve against the `viewBox` width (or the viewport width without a viewBox), y and height against the `viewBox` height, and any other length against the normalized diagonal `sqrt(width² + height²)/sqrt(2)`.
- **Path coordinates have no units.** Values in `d` are always in the user coordinate system.

## viewBox

- **What it is:** the position and size, in user space, of an SVG viewport. Value: four numbers `min-x min-y width height`, separated by whitespace and/or commas. The rectangle is mapped to the bounds of the SVG element's viewport (not the browser viewport).
- **Applies to** `<svg>`, `<symbol>`, `<marker>`, `<pattern>`, `<view>`. Default none; animatable.
- **Bad values:** a negative width or height is an error and the attribute is treated as not specified; a zero width or height disables rendering of the element.
- **It does not move its own element.** The `x`, `y`, `width`, `height` of the element carrying `viewBox` are in the coordinate system before the viewBox transform; the new system applies to its other attributes and its descendants.
- **With `transform` on the same element:** `transform` sets the first new coordinate system and `viewBox` a second one for descendants (the first post-multiplied by the second). On `svg`, `transform` applies as if the `svg` had a parent with that transform.
- **Always give a reusable graphic a `viewBox`.** A document likely to be referenced as a component of another document should carry one on its outermost `svg` so it scales to fit any viewport.
- **Scaling example:** a 200×200 CSS px viewport with `viewBox="0 0 100 100"` draws each user unit as 2×2 CSS px, so a 40×40 rect at (10,10) appears 80×80 px, 20 px from the edges.

```html
<svg width="200" height="200" viewBox="0 0 100 100">
  <rect x="10" y="10" width="40" height="40" fill="royalblue" />
</svg>
```

- **User-unit lengths change with the viewBox, percentage lengths do not.** The same content under three viewBox values: `r="4"` changes size, the 100% rect and 50% center look the same.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100%" height="100%" />
  <circle cx="50%" cy="50%" r="4" fill="white" />
</svg>
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100%" height="100%" />
  <circle cx="50%" cy="50%" r="4" fill="white" />
</svg>
<svg viewBox="-5 -5 10 10" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100%" height="100%" />
  <circle cx="50%" cy="50%" r="4" fill="white" />
</svg>
```

### The viewBox-to-viewport transform

The SVG 2 algorithm, step by step:

1. Let vb-x, vb-y, vb-width, vb-height be the viewBox values; e-x, e-y, e-width, e-height the element's position and size; align the `preserveAspectRatio` align value (or `xMidYMid`); meetOrSlice its value (or `meet`).
2. scale-x = e-width / vb-width; scale-y = e-height / vb-height.
3. If align is not `none`: with `meet`, set the larger of scale-x and scale-y to the smaller; with `slice`, set the smaller to the larger.
4. translate-x = e-x - (vb-x × scale-x); translate-y = e-y - (vb-y × scale-y).
5. If align contains `xMid`, add (e-width - vb-width × scale-x) / 2 to translate-x; `xMax`, add (e-width - vb-width × scale-x). If it contains `YMid`, add (e-height - vb-height × scale-y) / 2 to translate-y; `YMax`, add (e-height - vb-height × scale-y).
6. The result is `translate(translate-x, translate-y) scale(scale-x, scale-y)`.

Worked equivalents: a 300×200 viewport with `viewBox="0 0 1500 1000" preserveAspectRatio="none"` equals `<g transform="scale(0.2)">`; at 150×200 it equals `scale(0.1 0.2)`.

## width and height

- **Displayed size, not coordinate size.** On `<svg>`, `width` and `height` are the displayed size of the rectangular viewport, not of its coordinate system. Value `<length> | <percentage>`, default `auto`; animatable.
- **Outermost vs embedded.** On the outermost `svg` they give the intrinsic size of the fragment; on an embedded `svg`, the size of the region it is placed into. A computed `auto` is treated as `100%`.
- **Unitless means px** on the outermost `svg`.
- **CSS wins.** The initial viewport size comes from the outermost `svg`'s `width`/`height` unless CSS positioning properties on the referencing element (such as `object`) or on the outermost `svg` set it.
- **`x` and `y`** place an embedded `svg`'s region; they have no effect on the outermost `svg`.
- **Geometry properties.** Since SVG 2, `x`, `y`, `width`, `height` on `svg` can be set as CSS properties, and they accept CSS units such as `vmin`:

```html
<svg
  viewBox="0 0 400 400"
  xmlns="http://www.w3.org/2000/svg"
  height="60vmin"
  width="60vmin">
  <rect x="0" y="0" width="50%" height="50%" fill="tomato" opacity="0.75" />
  <rect x="25%" y="25%" width="50%" height="50%" fill="slategrey" opacity="0.75" />
  <rect x="50%" y="50%" width="50%" height="50%" fill="olive" opacity="0.75" />
  <rect x="0" y="0" width="100%" height="100%" stroke="cadetblue" stroke-width="0.5%" fill="none" />
</svg>
```

## preserveAspectRatio

- **Syntax:** `preserveAspectRatio="<align> [<meet or slice>]"`, default `xMidYMid meet`; animatable.
- **Applies to** `svg`, `symbol`, `image`, `feImage`, `marker`, `pattern`, `view`.
- **Needs a `viewBox`.** Without one it has no effect, except on `<image>`, where it fits the referenced image.

| Value | Effect |
|---|---|
| `none` | No uniform scaling: content stretches so its bounding box exactly matches the viewport. `meet`/`slice` is ignored. |
| `xMin*` | Align the viewBox `<min-x>` with the viewport's smallest X. |
| `xMid*` | Align the viewBox midpoint X with the viewport midpoint X. |
| `xMax*` | Align `<min-x>+<width>` with the viewport's maximum X. |
| `*YMin` | Align `<min-y>` with the viewport's smallest Y. |
| `*YMid` | Align the viewBox midpoint Y with the viewport midpoint Y. |
| `*YMax` | Align `<min-y>+<height>` with the viewport's maximum Y. |
| `meet` (default) | Keep the aspect ratio, the whole viewBox visible, scaled up as far as possible; part of the viewport may lie outside the viewBox. |
| `slice` | Keep the aspect ratio, cover the whole viewport, viewBox scaled down as far as possible; part of the viewBox is cut off. |

The nine align values are `xMinYMin`, `xMidYMin`, `xMaxYMin`, `xMinYMid`, `xMidYMid`, `xMaxYMid`, `xMinYMax`, `xMidYMax`, `xMaxYMax`; all of them force uniform scaling.

```html
<svg viewBox="-1 -1 202 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path
      id="smiley"
      d="M50,10 A40,40,1,1,1,50,90 A40,40,1,1,1,50,10 M30,40 Q36,35,42,40 M58,40 Q64,35,70,40 M30,60 Q50,75,70,60 Q50,75,30,60" />
  </defs>
  <rect x="0" y="0" width="60" height="30">
    <title>xMidYMid meet</title>
  </rect>
  <svg viewBox="0 0 100 100" width="60" height="30" preserveAspectRatio="xMidYMid meet" x="0" y="0">
    <use href="#smiley" />
  </svg>
  <!-- also xMinYMid meet at x="70", xMaxYMid meet at x="140" -->
</svg>
```

## Nested svg

- **A new viewport and new coordinate systems.** An `svg` inside SVG content creates a new SVG viewport plus new viewport and user coordinate systems, so percentages get a new meaning inside it. Use this to redefine percentage units or give a graphic a new reference rectangle to fit into.
- **Its bounds** come from its `x`, `y`, `width`, `height`; both new systems have their origin at (x, y), and one unit in them equals one unit of the current user system (before any `viewBox` on it).
- **What else makes a viewport:** only `svg` and a `symbol` instanced by `use`. `pattern` and `marker` do not (despite accepting `viewBox`), nor do `clipPath` or `mask`.
- **Clipped by default.** The user agent style sheet sets `overflow: hidden` on nested `svg` elements.
- **No `xmlns` needed** on inner `svg` elements.

```html
<svg
  viewBox="0 0 300 100"
  xmlns="http://www.w3.org/2000/svg"
  stroke="red"
  fill="grey">
  <circle cx="50" cy="50" r="40" />
  <circle cx="150" cy="50" r="4" />
  <svg viewBox="0 0 10 10" x="200" width="100">
    <circle cx="5" cy="5" r="4" />
  </svg>
</svg>
```

- **Same effect as a scale.** An inner `svg` with its own `viewBox`, `width` and `height` here equals wrapping the rect in `<g transform="scale(2)">`:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <svg width="100" height="100" viewBox="0 0 50 50">
    <rect width="50" height="50" />
  </svg>
</svg>
```

## Painting order

- **Painter's model.** Each paint operation covers an area, possibly hiding earlier paint; once painted, an object is background for the next.
- **Document order decides what is on top.** Later elements in the markup render atop earlier ones. To bring something forward, move it later in the markup.
- **Stacking contexts.** Elements are grouped into stacking contexts that paint as a unit and also decide which element receives pointer events; inside one, elements stack in document order, and a child stacking context is atomic. New ones are established by: the document element, an outermost `svg`, `foreignObject`, `image`, `marker`, `mask` element, `pattern`, `symbol`, `use`, an inner `svg` with `overflow` other than visible, `clip` other than auto, `clip-path` other than none, `opacity` other than 1, a `mask` property other than none, and `filter` other than none.
- **No `z-index`.** The 2015 SVG 2 Working Draft recorded a resolution to add Jonathan Watt's `z-index` proposal and had a section on `z-index` for SVG elements; the current SVG 2 rendering chapter has no `z-index` property and defines only document order plus stacking contexts. Confirm in the current spec before relying on `z-index`.
- **Inside one shape,** fill, stroke and markers paint in the order set by `paint-order` (default fill, stroke, markers); see [SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#paint-order).

## Prove it

- An SVG loaded through `<img>` or CSS `url()` carries `xmlns="http://www.w3.org/2000/svg"` on its root; an inline one renders without it.
- No doctype, no `version` or `baseProfile` on the root.
- Every reusable graphic has a `viewBox` with positive width and height.
- Resize the outer box: with the default `xMidYMid meet` the whole drawing stays visible and centered; with `slice` it covers and crops; with `none` it stretches.
- Elements meant to be on top come later in the markup; nothing depends on `z-index`.
- Two `text` elements meant as separate lines have different `y` values.
- A millimeter sheet has `width` and `height` in `mm` matching its `viewBox` numbers, and its PNG export measures `mm / 25.4 * dpi` pixels on each side.
