# Reuse and transforms

`g` groups elements so they share attributes and a transform, `defs` and `symbol` hold things that render only when referenced, and `use` stamps out copies by `href`. `transform` then moves, rotates, scales and skews any of them by giving the element a new coordinate system. What decides most outcomes: a `use` clone lives in a shadow tree that inherits from the `use` but is not reached by outer-document CSS, attributes already set on the source can't be overridden from the `use`, and a transform's origin is `0 0` of the user coordinate system (the viewBox), not the element's own center, unless you set `transform-box: fill-box`. Coordinates and nested `svg` are in [BASICS.md](BASICS.md), icon sprite systems in [EMBEDDING-AND-ICONS.md](EMBEDDING-AND-ICONS.md), CSS transforms and their animation in [STYLING.md](STYLING.md) and [CSS-ANIMATION.md](CSS-ANIMATION.md).

**Contents:** [g](#g) · [defs](#defs) · [symbol](#symbol) · [use](#use) · [href vs xlink:href](#href-vs-xlinkhref) · [The transform attribute](#the-transform-attribute) · [Transform functions](#transform-functions) · [Nesting and chaining](#nesting-and-chaining) · [transform-origin and transform-box](#transform-origin-and-transform-box) · [Prove it](#prove-it)

## g

- **Its only purpose is assigning properties to a set of elements.** A transform on a `g` applies to its children, and most presentation attributes are inherited by them.
- **Not inherited:** geometry properties (`cx`, `cy`, `r`, `rx`, `ry`, `d`, `x`, `y`, `width`, `height`) have no effect on `<g>` and don't pass to children; non-presentation attributes like `id` and `class` don't either.
- **Nests to any depth;** name groups with `id` for animation and reuse. A `g` can be referenced by `use`.

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Using g to inherit presentation attributes -->
  <g fill="white" stroke="green" stroke-width="5">
    <circle cx="40" cy="40" r="25" />
    <circle cx="60" cy="60" r="25" />
  </g>
</svg>
```

## defs

- **Nothing inside `<defs>` renders directly;** show it by referencing it (for example with `use`). Keeping such objects in `defs` aids understandability and accessibility.
- **One `defs` near the top.** Define referenced elements before the elements that use them, collected in a single `defs` near the top of the file.
- **`defs` can hold a `<style>` block** (the SVG stand-in for HTML's `<head>`).

```html
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <!-- Some graphical objects to use -->
  <defs>
    <circle id="myCircle" cx="0" cy="0" r="5" />
    <linearGradient id="myGradient" gradientTransform="rotate(90)">
      <stop offset="20%" stop-color="gold" />
      <stop offset="90%" stop-color="red" />
    </linearGradient>
  </defs>
  <!-- using my graphical objects -->
  <use x="5" y="5" href="#myCircle" fill="url('#myGradient')" />
</svg>
```

Gradients themselves are in [GRADIENTS-AND-PATTERNS.md](GRADIENTS-AND-PATTERNS.md).

## symbol

- **A template instantiated by `use`,** never rendered directly. It adds structure and semantics to graphics used several times, which helps accessibility ([ACCESSIBILITY.md](ACCESSIBILITY.md)).
- **Its own coordinate system.** When instanced it renders much like a nested `svg`, establishing a new viewport.

| Attribute | Values | Default |
|---|---|---|
| `width`, `height` | length \| percentage | `auto` |
| `x`, `y` | length \| percentage | `0` |
| `viewBox` | four numbers | none |
| `preserveAspectRatio` | see [BASICS.md](BASICS.md#preserveaspectratio) | `xMidYMid meet` |
| `refX` | length \| percentage \| `left` \| `center` \| `right` | none |
| `refY` | length \| percentage \| `top` \| `center` \| `bottom` | none |

- **Clipped by default.** The user agent style sheet sets `overflow: hidden` on `symbol`, so content outside its viewport is cut unless you override it.
- **Never shown directly.** The UA style sheet forces `display: none` on `symbol` with importance over any rule; the instance a `use` references is forced to `display: inline`. Some browsers refuse to show a `symbol` directly even if CSS says otherwise.

```html
<svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
  <!-- Our symbol in its own coordinate system -->
  <symbol id="myDot" width="10" height="10" viewBox="0 0 2 2">
    <circle cx="1" cy="1" r="1" />
  </symbol>
  <!-- A grid to materialize our symbol positioning -->
  <path
    d="M0,10 h80 M10,0 v20 M25,0 v20 M40,0 v20 M55,0 v20 M70,0 v20"
    fill="none"
    stroke="pink" />
  <!-- All instances of our symbol -->
  <use href="#myDot" x="5" y="5" opacity="1.0" />
  <use href="#myDot" x="20" y="5" opacity="0.8" />
  <use href="#myDot" x="35" y="5" opacity="0.6" />
  <use href="#myDot" x="50" y="5" opacity="0.4" />
  <use href="#myDot" x="65" y="5" opacity="0.2" />
</svg>
```

## use

- **A live deep clone.** `<use>` duplicates nodes from an SVG document elsewhere, as if deep-cloned into a non-exposed DOM (like a cloned `<template>`). The clones stay linked to the source and reflect DOM changes to the original. The SVG DOM contains only the `use` element, not the instance elements.
- **Attributes:** `href` (URL), `xlink:href` (deprecated; `href` wins if both are set), `x`, `y` (default `0`), `width`, `height`.
- **Geometry properties in SVG 2:** `x`, `y`, `width` and `height` can also be set as CSS properties. [MDN `<use>` reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use)
- **`x`/`y` are a final translate.** They append `translate(x,y)` after the other transforms on the `use` element itself, not only on the cloned content. That shifts `userSpaceOnUse` masks, clips and filters on the `use`. To avoid it, nest the `use` in a `g` and put the effect on the `g`.
- **`width`/`height` only matter for a viewport.** They take effect only when the referenced element is an `svg` or `symbol`, overriding its values; `auto` keeps the referenced element's values. `use` itself does not establish a viewport. Negative values are invalid and ignored; zero disables rendering where they apply.
- **Width/height source contexts, kept explicit:** the [MDN `<use>` reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use) lists their defaults as `0` and says they only affect a referenced `svg` or `symbol` with a `viewBox`. This topic's existing SVG 2 summary above instead says `auto` preserves the referenced values. These differently scoped source statements are retained; the current SVG 2 sizing rules have not been rechecked here to resolve the distinction.
- **The source wins.** Most attributes on `use` are ignored if the referenced element already sets them; only `x`, `y`, `width`, `height` and `href` still apply. Attributes the source leaves unset are applied from the `use`. So leave `fill`/`stroke` off the source to restyle each instance:

```html
<svg viewBox="0 0 30 10" xmlns="http://www.w3.org/2000/svg">
  <circle id="myCircle" cx="5" cy="5" r="4" />
  <use href="#myCircle" x="10" fill="blue" />
  <use href="#myCircle" x="20" fill="white" stroke="red" />
</svg>
```

- **Style scoping.** The shadow tree inherits styles from the host `use`, but outer-document style rules do not match elements inside it; stylesheets in the same document as the source do apply inside. CSS properties are not guaranteed to be inherited by the clones unless you request inheritance (patterns for this are in [STYLING.md](STYLING.md)).
- **Broken references render nothing.** A `use` with an unresolved or invalid reference is not rendered; referencing a non-SVG element or an ancestor (circular) is an error.
- **Rendering:** `use` always establishes a stacking context and forms a non-isolated group for blending.
- **External files:** `<use href="../assets/my-svg.svg#my-fragment"></use>`. Support: Chrome 22, Firefox 4, Safari 7.
- **Same origin only.** Browsers may apply the same-origin policy and refuse a cross-origin `href`, and there is no defined way to set a cross-origin policy for `use`; the spec does not allow cross-origin or data URL requests in `use`.
- **No data URIs.** Data URIs in `use href` are deprecated for security reasons (also via `set` or `setAttribute`): removed in Chrome 120 and Firefox 122, never removed in Safari. See [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md).
- **Whole-document references without a fragment** are new in SVG 2. MDN says modern implementations have been updated to allow them; browser-compat data lists only Chrome 137 (Firefox and Safari no, experimental). Keep the `#fragment` until support is confirmed in current data.
- **The linking guide's stricter view:** MDN's linking guide says whole-document references are not supported everywhere and to always name the element with a fragment identifier; the `<use>` reference describes modern whole-document support. Keep these source contexts explicit when choosing a sprite reference.

## href vs xlink:href

- **Use `href`.** It links to a resource by URL. Pre-SVG 2 specs used `xlink:href`, now deprecated. A conforming SVG generator must write `href` without a namespace and may also write `xlink:href` for backwards compatibility.
- **If both are present,** the unnamespaced `href` is used and `xlink:href` ignored.
- **Fallback for older browsers:** add `xlink:href` next to `href`:

```html
<use href="some-id" xlink:href="some-id" x="5" y="5" />
```

- **`xlink:href` needs `xmlns:xlink="http://www.w3.org/1999/xlink"`** declared in XML; an unbound prefix is an XML error.
- **Unprefixed `href` support:** on `use` Chrome 50, Firefox 1.5, Safari 12.1; on `textPath` Chrome 50, Firefox 2, Safari 12.1.
- **The sources disagree:** MDN's namespaces guide calls it a good idea to always include the XLink declaration in every document template, while MDN's `xlink:href` page and SVG 2 say `xlink:href` is deprecated and `href` should be used.
- **Animation elements:** with neither `href` nor `xlink:href`, the target is the immediate parent element ([SMIL.md](SMIL.md)).

## The transform attribute

- **A list of transform definitions** applied to the element and its children. Value `<transform-list>`, default none, animatable.
- **CSS wins.** The CSS `transform` property takes priority over the attribute, and the two have different syntax. Per spec, CSS transform functions should work in the attribute, but compatibility isn't guaranteed. User agents must support the `transform` property and presentation attribute as CSS Transforms 1 defines them.
- **On any element in SVG 2,** including the `<svg>` root. SVG 1.1 allowed it on only 16 elements: `a`, `circle`, `clipPath`, `defs`, `ellipse`, `foreignObject`, `g`, `image`, `line`, `path`, `polygon`, `polyline`, `rect`, `switch`, `text`, `use`. On the root: Chrome 137, Firefox 23, Safari not supported.
- **Gradients and patterns** have `gradientTransform` and `patternTransform`, which behave exactly like `transform`.

## Transform functions

| Function | Meaning |
|---|---|
| `matrix(a b c d e f)` | newX = a·oldX + c·oldY + e; newY = b·oldX + d·oldY + f. Every other transform can be written as this 2×3 matrix. |
| `translate(x [y])` | Move; `y` defaults to `0`. |
| `scale(x [y])` | Scale by ratios (0.5 shrinks by 50%); `y` defaults to `x`. |
| `rotate(a [x y])` | Rotate `a` degrees about the origin of the current user coordinate system, or about (x, y) when given. |
| `skewX(a)`, `skewY(a)` | Skew along the x or y axis by `a` degrees. |

```html
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="30" height="20" fill="green" />
  <rect x="10" y="10" width="30" height="20" fill="red" transform="matrix(3 1 -1 3 30 40)" />
</svg>
```

Here the red rect's top-left corner (10,10) lands at (50,80).

```html
<svg viewBox="-12 -2 34 14" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="10" height="10" />
  <!-- rotation is done around the point 0,0 -->
  <rect x="0" y="0" width="10" height="10" fill="red" transform="rotate(100)" />
  <!-- rotation is done around the point 10,10 -->
  <rect x="0" y="0" width="10" height="10" fill="green" transform="rotate(100, 10, 10)" />
</svg>
```

## Nesting and chaining

- **A transform creates a new coordinate system** inside the element: its units and its children's units are scaled, skewed or translated with it. `<g transform="scale(2)"><rect width="50" height="50" /></g>` renders a 100×100px rect.
- **Chain by listing,** separated by whitespace. `translate()` and `rotate()` are commonly combined: `transform="translate(30,40) rotate(45)"` on a 10×10 rect moves the square to (30,40) and rotates it by 45 degrees.
- **With `viewBox` on the same element,** `transform` applies first ([BASICS.md](BASICS.md#viewbox)).
- **Ellipses have no tilt attribute;** rotate them with `transform`.

```html
<svg viewBox="-40 0 150 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <g
    fill="grey"
    transform="rotate(-10 50 100)
               translate(-36 45.5)
               skewX(40)
               scale(1 0.5)">
    <path
      id="heart"
      d="M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z" />
  </g>
  <use href="#heart" fill="none" stroke="red" />
</svg>
```

## transform-origin and transform-box

- **`transform-origin` defaults to `0 0` on SVG elements.** Only the root `<svg>` and `<svg>` elements that are direct children of `foreignObject` get `50% 50%` "as in normal CSS". The spec: the initial value is `50% 50%`, but "For SVG elements without associated CSS layout box the initial used value is 0 0 as if the user agent style sheet contained `*:not(svg), *:not(foreignObject) > svg { transform-origin: 0 0; }`".
- **The reference box defaults to the viewBox.** `transform-box` is `content-box | border-box | fill-box | stroke-box | view-box`, initial `view-box`, not inherited, animated discretely. So transform-origin lengths, percentages and keywords are relative to the SVG's `viewBox` unless the element has a CSS layout box: `transform-origin="center"` puts the origin at the center of the viewBox, not of the element.

| `transform-box` | Reference box |
|---|---|
| `fill-box` | the object bounding box |
| `stroke-box` | the stroke bounding box |
| `view-box` | the nearest SVG viewport; with a `viewBox`, the box sits at the viewBox origin with the viewBox width and height |
| `content-box`, `border-box` | on SVG elements without a CSS layout box, used as `fill-box` and `stroke-box` |

  On elements with a CSS layout box, `fill-box` is used as `content-box`, and `stroke-box`/`view-box` as `border-box`.
- **`transform-box` affects** `transform`, the individual `translate`/`scale`/`rotate` properties, and `transform-origin`.
- **To spin an element around its own center, set `transform-box: fill-box`.** Without it, "the transform origin is the center of the SVG canvas, and so you get a very different effect."

- **Motion's docs call this the "transform origin gotcha":** an HTML element rotates around its own centre, an SVG element around the viewBox origin, "usually the top left corner". Its fix is `transform-box: fill-box; transform-origin: center;`. It says older libraries like GSAP normalise origin by measuring, which is no longer necessary, and Motion's own components apply `fill-box` automatically (opt out with `transformBox: "view-box"`).
- **Or give an explicit origin.** The course's Module 1 example sets the origin as lengths with the default `transform-box: view-box`, where lengths are relative to the SVG's `viewBox`:

```css
.lid {
  transform: rotate(30deg);
  transform-origin: 55px 30px;
}
```

```css
#box {
  transform-origin: 50% 50%; /* anything other than `0 0` to see the effect */
  transform-box: fill-box;
  animation: rotate-box 3s linear infinite;
}
@keyframes rotate-box {
  to {
    transform: rotate(360deg);
  }
}
```

- **As an attribute in markup** too: `transform="rotate(-90)" transform-origin="20 195"` on a `<text>`.

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `transform-box`, `fill-box`, `view-box` | 64 | 55 | 11 |
| `transform-box: border-box` | 118 | 55 | 11 |
| `transform-box: content-box`, `stroke-box` | 118 | 125 | 13.1 |
| CSS `transform-origin` on SVG elements | 19 | 43 | 6 |
| `transform-origin` attribute | 83 or earlier | 77 | 15.4 |

## Prove it

- Elements meant to render only by reference sit in `defs` or are `symbol`s, defined before their first use.
- Every `use` points at an `id` that exists; none uses a data URI or a cross-origin URL.
- Instances that need different colors reference a source with no `fill`/`stroke` of its own, and each `use` shows its own color.
- Effects with `userSpaceOnUse` on a moved `use` sit on a wrapping `g`, and line up with the instance.
- Markup writes `href`; `xlink:href` appears only as a fallback beside it, with `xmlns:xlink` declared in XML files.
- An element rotated "about its center" has `transform-box: fill-box` (or an explicit `transform-origin` in user units) and spins in place instead of swinging around the viewBox corner.
- No `transform` on the root `svg` where Safari matters.
