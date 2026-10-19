# Embedding SVG and icon systems

There are two ways to put an SVG on a page: inline it (the markup goes straight into the HTML, since SVG code is also valid HTML) or reference it externally (`<img>`, CSS `url()`, or a document embed such as `<object>`). The choice decides almost everything else: inline SVG is part of the page DOM, so page scripts and CSS reach inside it, but it adds DOM nodes (or JavaScript bundle size in React); an external SVG used as an image is cached and keeps the bundle small, but it may not load immediately, runs no scripts, loads no external resources and offers fewer animation options. A standalone file also needs `xmlns`. Accessible names for each method are in [ACCESSIBILITY.md](ACCESSIBILITY.md); styling through `<use>` is in [STYLING.md](STYLING.md).

**Contents:** [Embedding methods](#embedding-methods) · [Compared](#compared) · [Scripting and links per method](#scripting-and-links-per-method) · [xmlns and namespaces](#xmlns-and-namespaces) · [Data URIs](#data-uris) · [Sprites with symbol and use](#sprites-with-symbol-and-use) · [Fragment views](#fragment-views) · [Icon systems with currentColor](#icon-systems-with-currentcolor) · [Icons beside text](#icons-beside-text) · [foreignObject and image](#foreignobject-and-image) · [Markers](#markers) · [Prove it](#prove-it)

## Embedding methods

- **Inline:** paste the entire SVG into the HTML. This works because SVG code is also perfectly valid HTML.

```html
<div>
  <p>Here's an SVG:</p>
  <svg>
    <circle cx="50" cy="50" r="40" />
  </svg>
</div>
```

- **External, as an image:** load it like an image file with `<img>` or with `url()` in CSS.

```html
<div>
  <p>Here's an SVG:</p>
  <img src="circle.svg" />
</div>
```
```css
div {
  background-image: url(circle.svg);
}
```

- **External namespace requirement:** use the declaration and complete image-file example in [BASICS.md](BASICS.md#xmlns).

- **External, as a document:** `<iframe>`, `<object>` or `<embed>`.

```html
<object width="100" height="50" type="image/svg+xml" data="button.svg"></object>
```

- **Image contexts that accept SVG:** HTML `<img>`, CSS `background-image`, `list-style-image`, `content`, SVG `<image>`, SVG `<feImage>`, and Canvas `drawImage`.
- **The tradeoff:** inlining lets you manipulate the SVG with JavaScript just like regular HTML elements, but typically means more DOM nodes (or larger JavaScript bundles with a component library like React). Referencing externally cuts bundle size and lets the browser cache the SVG, but it may not load immediately and you're more limited on animation options.

## Compared

| Method | Page JS and CSS reach inside | SVG's own scripts | Links active | Cached as a file | Notes |
|---|---|---|---|---|---|
| Inline `<svg>` | Yes | Run as page scripts | Yes | No; adds DOM nodes or bundle size | Best screen reader support (see ACCESSIBILITY.md) |
| `<img src>` | No | Never run | No | Yes | No external resources except `data:` URLs; needs `xmlns`; fewer animation options |
| CSS `url()` (`background-image` and others) | No | Never run | No | Yes | Same image-mode restrictions |
| `<object>`, `<iframe>`, `<embed>` | Only through `contentDocument`, same-origin | Run | Yes; `target="_top"` to leave the frame | Not stated | A separate document with its own DOM |
| `<use href="file.svg#id">` | See sprites below | | | | Same-origin only |

### Image-mode restrictions

When SVG is used as an image (`<img>`, CSS backgrounds, SVG `<image>`), some browsers restrict it for security:

- **JavaScript is disabled.** Scripts never run and links can't be activated.
- **External resources (images, stylesheets) can't load,** though they can be used if inlined through `data:` URLs.
- **`:visited` styles aren't rendered,** and platform-native widget styling is disabled.

None of these apply when the SVG is viewed directly or embedded as a document with `<iframe>`, `<object>` or `<embed>`.

## Scripting and links per method

- **Inline SVG nodes are part of the HTML document;** page scripts query and modify them directly.
- **A standalone SVG with its own `<script>`** runs when opened directly or embedded with `<object>`, `<iframe>` or `<embed>`.
- **Script an embedded SVG document through `contentDocument`** (or `getSVGDocument()`, which returns null if it isn't an SVG document), after `load`. This works only same-origin; otherwise `contentDocument` is null. Across origins, `postMessage()` is the more robust choice and the only option.

```js
const frame = document.getElementById("chart");
frame.addEventListener("load", () => {
  const svgDocument = frame.contentDocument;
  const bar = svgDocument.getElementById("bar-1");
  bar.setAttribute("fill", "steelblue");
});
```

- **Links work only while the SVG is displayed as a document:** inline in HTML, or embedded with `<object>`, `<iframe>` or `<embed>`. Inside an `<object>` or `<iframe>` they load in that frame; add `target="_top"` to replace the whole page.
- **Escape scripts in standalone files.** A `.svg` is parsed as XML, where `<` or `&` in script text is read as markup: escape them or wrap the script in a `<![CDATA[ … ]]>` section.

## xmlns and namespaces

Namespace declarations, HTML versus XML parsing, prefix restrictions and the XHTML requirement inside `foreignObject` are defined once in [BASICS.md](BASICS.md#xmlns). Script-created nodes and the sources' differing attribute-method guidance are in [JS-AND-REACT.md](JS-AND-REACT.md#create-svg-elements); modern `href`, legacy XLink and their source disagreement are in [REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md#href-vs-xlinkhref).

## Data URIs

- **Syntax:** `data:[<media-type>][;base64],<data>`. Without a media type it defaults to `text/plain;charset=US-ASCII`, so give `image/svg+xml` (the SVG MIME type).
- **Percent-encode** reserved characters (RFC 3986), spaces, newlines and other non-printing characters. Textual data can be embedded as text; otherwise use base64.
- **Data URLs are unique opaque origins** in modern browsers.
- **Common mistakes:** forgetting the comma before the data; typos in `base64` or invalid parameters are ignored with no error.
- **Length limits:** Chromium and Firefox 512 MB, Safari (WebKit) 2048 MB (Firefox 97 raised 256 KB to 32 MB, Firefox 136 to 512 MB).
- **Top-level navigation to `data:` URLs is blocked** in all modern browsers.
- **An SVG used as an image can still use external resources** if they are inlined as `data:` URLs.
- **`<use href="data:...">` is deprecated for security reasons** (including through `set` or `setAttribute`); browsers that once allowed it have dropped it.
- **Quote URLs in CSS.** An unquoted `url()` can't contain the parentheses that `svgView()` needs.

## Sprites with symbol and use

The clone, symbol template, attributes, per-instance styling, source-context width/height disagreement and fragment-support limits are defined in [REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md#use), with the complete symbol example in [symbol](REUSE-AND-TRANSFORMS.md#symbol).

- **External sprite:** `<use href="icons.svg#search" />` is the basis of the SVG sprite pattern.

```html
<svg>
  <use href="../assets/my-svg.svg#my-fragment"></use>
</svg>
```

- **Deployment and styling:** use a same-origin sprite with a fragment identifier, and leave source attributes such as `fill` unset when each instance must choose them. See the canonical [origin and fragment qualifications](REUSE-AND-TRANSFORMS.md#use) and [custom-property styling](STYLING.md#css-custom-properties).

## Fragment views

- **One file, many images:** define `<view id="third" viewBox="200 0 100 100" />` and reference `<img src="shapes.svg#third">`. It also works in `<a href>`, `<iframe>` and CSS `url()`.
- **Without editing the file:** `shapes.svg#svgView(viewBox(200,0,100,100))`. Prefer a named `<view>` when you control the file.

## Icon systems with currentColor

- **Draw icons with `fill="currentColor"` and `stroke="currentColor"`** so they take the surrounding text color. `currentColor` is the element's `color` value, usable on properties that don't receive it by default. Details in [STYLING.md](STYLING.md#currentcolor).

```svg
<svg viewBox="0 0 100 100">
  <circle cx="45" cy="45" r="30" fill="none" stroke="currentColor" stroke-width="4" />
  <line x1="65" y1="65" x2="85" y2="85" stroke="currentColor" stroke-width="4" />
</svg>
```

- **The CSS `stop-color` property accepts `currentColor` too.**
- **With `<use>` sprites,** attributes not set on the referenced symbol content apply from the `<use>`, and CSS inheritance into the clone must be requested explicitly (see above).
- **Icon accessibility** (decorative `aria-hidden`, icon-only buttons) is in [ACCESSIBILITY.md](ACCESSIBILITY.md).
- **Icons that morph into each other** (three-line icons, rotation groups) are in [MORPHING-ICONS.md](MORPHING-ICONS.md).
- **A static SVG favicon:** favicon.im's animated-favicon article says "A good static SVG favicon already wins on file size, dark mode, and battery life", and gives no markup for it.

## Icons beside text

[Jakub Krehel, better-ui] (`icons.md`); [Jakub Krehel, make-interfaces-feel-better] (`icons.md`) gives the same table and rules. Both are design opinion from third-party skills, not a spec.

- **Stroke follows the weight of the text next to it:**

| Adjacent text | Rendered stroke width |
|---|---|
| Regular (400), 14-16px | `1.5px` |
| Medium or semibold (500-600) | `2px` |
| Bold (700), or an emphasized standalone icon | `2.5px` |

- **The widths are rendered pixels.** "A 24px-grid icon drawn at 16px scales its stroke by 16/24, so `stroke-width="2"` paints about `1.33px`." Keep the width with `vector-effect: non-scaling-stroke` on the shapes ([SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#vector-effect-non-scaling-stroke)) or the icon library's option. The source names Lucide's `absoluteStrokeWidth`; lucide-react now marks it `@deprecated Use nonScalingStroke instead.` (`packages/lucide-react/src/types.ts`), and its docs teach `nonScalingStroke`: "Setting `nonScalingStroke` to `true` will make the stroke width non-scaling" ([lucide.dev](https://lucide.dev/guide/react/basics/stroke-width)). The source's example with that prop changed:

```tsx
// Good: stroke tuned to the semibold label
<button className="flex items-center gap-2 font-semibold">
  <Plus size={16} strokeWidth={2} nonScalingStroke />
  New project
</button>
```

- **One library and one stroke per surface:** "Never mix icon libraries on one toolbar. Where the library has no stroke variants, keep its native stroke and use size or color for emphasis." make-interfaces-feel-better: "Use one stroke weight per icon set on a surface."
- app-ui keeps one stroke for every label weight: "One stroke set at 1.5px" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)), with button labels at 500, where the table would give 2px. That is the owner's design; the table is the general rule.
- **Size inline icons from the font:** "Size inline icons at `1em`-`1.25em` of the adjacent font size, so the pair scales together." make-interfaces-feel-better ties it to "the text's cap height". app-ui uses fixed sizes in that range: "a glyph beside a label is 1rem" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
- **Outline by default, fill for active,** "as a state pair, never interchangeably":

| Variant | Use for |
|---|---|
| Outline | Default state in toolbars, list rows and inline text |
| Fill | Selected or active state, such as the active tab, a toggled bookmark or a liked heart |

```tsx
// Good: variant communicates state
<TabIcon variant={isActive ? "solid" : "outline"} />

// Bad: filled everywhere, so the active tab has no state signal
<TabIcon variant="solid" />
```

  Cross-fade the swap "only where the change is infrequent, such as a bookmark or a like. An active tab swaps instantly." Icon swap timing is in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md).
- **Design at render size:** "Test every icon at the smallest size it renders, often `16px`." "Prefer a simplified glyph for small contexts over scaling down detailed artwork." "Where the set ships per-size grids such as `16`, `20` and `24`, use the grid that matches the render size. A 24px drawing scaled to 16px lands off the pixel grid and renders soft." "Always SVG, never raster."
- **Fix lopsided icons in the SVG.** For stars, arrows and carets with uneven visual weight, "The best fix is adjusting the SVG directly so no extra margin/padding is needed in the component code": adjust the `viewBox` or the path, and fall back to a 1px margin on a wrapper [Jakub Krehel, make-interfaces-feel-better] (`surfaces.md`).

## foreignObject and image

- **`<foreignObject>` holds elements from another XML namespace,** in browsers most likely (X)HTML. Attributes `x`, `y` (default `0`), `width`, `height` (default `auto`), all animatable; since SVG 2 they are geometry properties, also usable as CSS.

```html
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <style>
    div { color: white; font: 18px serif; height: 100%; overflow: auto; }
  </style>
  <polygon points="5,5 195,10 185,185 10,195" />
  <!-- Common use case: embed HTML text into SVG -->
  <foreignObject x="20" y="20" width="160" height="160">
    <div xmlns="http://www.w3.org/1999/xhtml">Lorem ipsum dolor sit amet ...</div>
  </foreignObject>
</svg>
```

- **Why it exists:** a conforming viewer ignores arbitrary foreign XML, so `foreignObject` is the container for it and carries SVG styling attributes (most of all `width` and `height`, the space it takes). Use it for longer texts, where HTML layout is more suitable than SVG `<text>`, or for MathML formulas.
- **The viewer must be able to process the content.** A standalone SVG viewer is unlikely to render HTML or MathML.
- **SVG effects apply:** clips, masks and filters work on its content.
- **`<image>` embeds raster and vector images;** the spec asks for at least PNG, JPEG and SVG support. The image becomes a normal SVG element, so clips, masks, filters and rotations apply.

## Markers

- **`<marker>` draws arrowheads or polymarkers** on a `path`, `line`, `polyline` or `polygon`. Attach it with `marker-start`, `marker-mid`, `marker-end`, or the CSS `marker` shorthand.

| Attribute | Values | Default |
|---|---|---|
| `markerWidth`, `markerHeight` | length | `3` |
| `markerUnits` | `userSpaceOnUse`, `strokeWidth` (one unit is the stroke width, so markers scale with the stroke) | `strokeWidth` |
| `orient` | `auto`, `auto-start-reverse`, `<angle>`, `<number>` | `0` |
| `refX` | `left`, `center`, `right`, coordinate | `0` |
| `refY` | `top`, `center`, `bottom`, coordinate | `0` |
| `preserveAspectRatio` | | `xMidYMid meet` |
| `viewBox` | | |

- **`orient="auto"`** points the marker's positive x-axis along the path direction. **`auto-start-reverse`** turns it 180° on `marker-start` only, so one definition gives arrowheads at both ends.

```html
<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- A marker to be used as an arrowhead -->
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>
  </defs>
  <line x1="10" y1="10" x2="90" y2="90" stroke="black" marker-end="url(#arrow)" />
  <path d="M 110 10 C 120 20, 130 20, 140 10 C 150 0, 160 0, 170 10 C 180 20, 190 20, 200 10"
        stroke="black" fill="none" marker-start="url(#arrow)" marker-mid="url(#arrow)" marker-end="url(#arrow)" />
</svg>
```

- **Polymarkers** (dots on a data line): a dot marker on `marker-start`, `marker-mid` and `marker-end`: `<marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle cx="5" cy="5" r="5" fill="red" /></marker>`.
- **`context-fill` and `context-stroke`** make the marker take the fill and stroke of the shape it's attached to:

```html
<marker id="circle" markerWidth="6" markerHeight="6" refX="3" refY="3" markerUnits="strokeWidth">
  <circle cx="3" cy="3" r="2" stroke="context-stroke" fill="context-fill" />
</marker>
<style> path { marker: url("#circle"); } </style>
```

## Prove it

- **External files open standalone:** every `.svg` used in `<img>` or CSS `url()` has `xmlns="http://www.w3.org/2000/svg"` on its root and renders when opened directly.
- **Method fits the job:** anything scripted or animated from page code is inline (or a same-origin `<object>`); anything only displayed and repeated across pages is an external image.
- **Image mode is respected:** an SVG used as `<img>` or a CSS background relies on no script, link or external resource except `data:` URLs.
- **Created nodes render:** script-built SVG uses `createElementNS("http://www.w3.org/2000/svg", ...)`, never `createElement`.
- **New markup uses `href`,** not `xlink:href`.
- **Sprites:** every `<use href="file.svg#id">` is same-origin, names a fragment, and the referenced shape leaves off any attribute (such as `fill`) that individual `<use>` instances need to set.
- **Data URIs:** each has `image/svg+xml`, a comma before the data, percent-encoded reserved characters or base64, and is quoted inside CSS `url()`.
- **Icons follow text color:** change `color` on an icon's parent and it recolors.
- **Markers:** a path with `marker-start` and `marker-end` using one `auto-start-reverse` marker shows arrowheads pointing outward at both ends.
- **Icons beside text:** at the smallest render size each icon is recognizable and crisp (its grid matches the size); its rendered stroke matches the label weight (or the product's one fixed stroke), with no deprecated `absoluteStrokeWidth`; active states use the filled variant and defaults the outline.
