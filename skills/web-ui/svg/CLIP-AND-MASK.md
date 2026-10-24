# Clipping and masking

Clipping and masking hide parts of an element using other shapes. A clip is all or nothing: the clip shape's geometry decides what shows, and its color and opacity are ignored. A mask allows soft edges: each pixel of the mask decides how visible the element is underneath. Most outcomes come down to two choices: luminance or alpha (an SVG `<mask>` defaults to luminance, where white shows and black hides; a CSS image or gradient mask defaults to alpha), and which units the clip or mask is drawn in (bounding box fractions or user space). Gradients used inside masks are in [GRADIENTS-AND-PATTERNS.md](GRADIENTS-AND-PATTERNS.md).

## Clip or mask

| | `<clipPath>` | `<mask>` |
|---|---|---|
| Edge | Hard, all or nothing; half-transparent effects are not possible | Soft, uses the transparency and gray values of the mask |
| What counts | Every shape inside, with its stroke and transform; color, opacity and such have no effect unless they make parts vanish completely | Luminance (default) or alpha of the mask content |
| Applied with | `clip-path="url(#id)"` attribute or CSS `clip-path` | `mask="url(#id)"` attribute, CSS `mask` or `mask-image` |
| Units attribute | `clipPathUnits`, default `userSpaceOnUse` | `maskUnits` (region), default `objectBoundingBox`; `maskContentUnits` (children), default `userSpaceOnUse` |
| Mask region | | `x`, `y` default `-10%`, `width`, `height` default `120%` |
| Pointer events | Not dispatched on clipped regions by default | |

## clipPath

- **The children are never painted themselves.** Every part of the target lying in a transparent area of the clip content is not rendered. Usually place the `clipPath` in `defs`.

```html
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="cut-off-bottom">
      <rect x="0" y="0" width="200" height="100" />
    </clipPath>
  </defs>
  <circle cx="100" cy="100" r="100" clip-path="url(#cut-off-bottom)" />
</svg>
```

- **`clipPathUnits` is its only attribute.** `userSpaceOnUse` (default) or `objectBoundingBox`, where the origin is the top left corner of the target's bounding box and its width and height each count as 1.
- **A clip is a custom viewport, not a geometry change.** The clipped element's bounding box stays the same as if it were not clipped.
- **Clicks stop at the clip edge.** A circle with `r=10` clipped to `r=5` gets no clicks outside `r=5`.
- **Animate the clip shape with CSS geometry properties,** in browsers that implemented the `r` geometry property:

```css
@keyframes openYourHeart { from { r: 0; } to { r: 60px; } }
#myClip circle { animation: openYourHeart 15s infinite; }
```
```html
<clipPath id="myClip"><circle cx="40" cy="35" r="35" /></clipPath>
<path id="heart" d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z" />
<use clip-path="url(#myClip)" href="#heart" fill="red" />
```

## mask

- **`<mask>` composites the current object into the background.** Reference it with the `mask` property or CSS `mask-image`.
- **Luminance (default): white shows, black hides.** The masked element's pixels use the luminance of the mask content as their alpha, so a black to white gradient fades the element in:

```html
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="Gradient">
      <stop offset="0" stop-color="black" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
    <mask id="Mask">
      <rect x="0" y="0" width="200" height="200" fill="url(#Gradient)" />
    </mask>
  </defs>
  <rect x="0" y="0" width="200" height="200" fill="green" />
  <rect x="0" y="0" width="200" height="200" fill="red" mask="url(#Mask)" />
</svg>
```

- **Punch a hole** with a white base and a black shape:

```html
<svg viewBox="-10 -10 120 120">
  <rect x="-10" y="-10" width="120" height="120" fill="blue" />
  <mask id="myMask" mask-type="luminance">
    <!-- Everything under a white pixel will be visible -->
    <rect x="0" y="0" width="100" height="100" fill="white" />
    <!-- Everything under a black pixel will be invisible -->
    <path d="M10,35 A20,20,0,0,1,50,35 A20,20,0,0,1,90,35 Q90,65,50,95 Q10,65,10,35 Z" fill="black" />
  </mask>
  <polygon points="-10,110 110,110 110,-10" fill="orange" />
  <!-- with this mask applied, we "punch" a heart shape hole into the circle -->
  <circle cx="50" cy="50" r="50" fill="purple" mask="url(#myMask)" />
</svg>
```

- **A two-circle mask** (from the course's advanced module, which covers gradients, masks, SVG filters, and ways to animate SVGs when SMIL falls short):

```svg
<defs>
  <mask id="circle-mask">
    <circle cx="25" cy="25" r="15" />
    <circle cx="55" cy="55" r="15" />
  </mask>
</defs>
<rect mask="url(#circle-mask)" fill="gray" />
```

### Luminance and alpha

- **`mask-type="luminance"` (default):** the masked object's opacity depends on the opacity and lightness of the mask, computed as `((0.2125 * R) + (0.7154 * G) + (0.0721 * B)) * A`.
- **`mask-type="alpha"`:** the masked pixels match the opaqueness of the mask, regardless of the colors' luminance.
- **The CSS `mask-type` property wins** over the attribute when both are set. Animatable: discrete.

### Units

- **`maskUnits`** sets the system for the mask region (`x`, `y`, `width`, `height`). `objectBoundingBox` (default): fractions or percentages of the masked element's bounding box, as if the mask were bound to a `0 0 1 1` viewBox. `userSpaceOnUse`: the user coordinate system where the mask was created.
- **`maskContentUnits`** sets the system for the mask's children. `userSpaceOnUse` (default), or `objectBoundingBox` to size them relative to the masked element, for example `<circle fill="white" cx=".5" cy=".5" r=".35" />`.

| `mask` attribute | Default |
|---|---|
| `x`, `y` | `-10%` |
| `width`, `height` | `120%` |
| `mask-type` | `luminance` |
| `maskUnits` | `objectBoundingBox` |
| `maskContentUnits` | `userSpaceOnUse` |

All are animatable.

## Illustration lids and touching edges

[rossark-motion-skill, SKILL.md sections 4 and 8; templates/react-native/liveFace.tsx; demo/RevealScene.swift]

- Clip moving pupils to the eye white, but let the skin that closes over it cover the anti-aliased white edge. The React Native template's skin clip uses white width plus 2 and height plus 2 drawing units; its skin rectangles extend farther. This is a source-specific overscan recipe, not a two-pixel-per-side rule for every eye.
- Inspect coincident anti-aliased edges in motion. Rossark replaces a hair cap with a hole that meets its boundary with one outline around the face, avoiding the hairline it observed across the eyes. A seam is a rendered finding, not proof that every compound path or clip is defective.
- Check subpath winding when overlapping pieces unexpectedly cancel. The source fills its pieces separately rather than treating differently wound overlapping subpaths as a guaranteed union. Keep the intended fill rule explicit; do not change the drawing merely to match this recipe.
- Face layering and acting are defined in [living illustrations](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/ILLUSTRATION-ACTING.md#a-face-that-stays-part-of-the-drawing); the React Native component contract is in [React illustration](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-ILLUSTRATION.md#choreography-and-geometry).

## Opacity and hiding

- **`opacity` fades the whole element; `fill-opacity` and `stroke-opacity`** fade one paint. The stroke is painted on top of the fill, so a semi-transparent stroke shows the fill through its inner half.
- **`display: none`, `visibility` and `clip` apply to SVG.** The initial `display` of every SVG element is `inline`, which matters when you revert `display: none`.

## CSS clip-path and mask on HTML

- **Three CSS properties apply SVG effects to HTML: `mask`, `clip-path` and `filter`.** The SVG can be in the same document or an external file. References to external files must be same-origin with the referencing document, and external references from these CSS properties are supported less widely than the SVG attributes are. Filters are in [FILTERS.md](FILTERS.md).
- **Keep the definitions in a zero-height inline `<svg height="0">`** and reference them by id.

```html
<svg height="0">
  <mask id="mask-1">
    <linearGradient id="gradient-1" y2="1">
      <stop stop-color="white" offset="0" />
      <stop stop-opacity="0" offset="1" />
    </linearGradient>
    <circle cx="0.25" cy="0.25" r="0.25" id="circle" fill="white" />
    <rect x="0.5" y="0.2" width="300" height="100" fill="url(#gradient-1)" />
  </mask>
</svg>
```
```css
.target { mask: url("#mask-1"); }
```

- **Use `clipPathUnits="objectBoundingBox"`** so 0 to 1 coordinates fit any element. Clipping HTML clips the clickable areas of links too. Changes to the SVG apply live:

```html
<svg height="0">
  <clipPath id="clipping-path-1" clipPathUnits="objectBoundingBox">
    <circle cx="0.25" cy="0.25" r="0.25" id="circle" />
    <rect x="0.5" y="0.2" width="0.5" height="0.8" />
  </clipPath>
</svg>
```
```css
.target { clip-path: url("#clipping-path-1"); }
```
```js
const circle = document.getElementById("circle");
function toggleRadius() {
  circle.r.baseVal.value = 0.4 - circle.r.baseVal.value;
}
document.querySelector("button").addEventListener("click", toggleRadius);
```

- **An external file works when same-origin:** `.target { clip-path: url("resources.svg#c1"); }`.

### CSS clip-path values

| Kind | Values |
|---|---|
| None | `none` |
| `<clip-source>` | `url()` to an SVG `<clipPath>` |
| `<basic-shape>` | `inset()`, `circle()`, `ellipse()`, `polygon()`, `path()`, `rect()`, `shape()`, `xywh()` |
| `<geometry-box>` | `margin-box`, `border-box`, `padding-box`, `content-box`, `fill-box` (object bounding box), `stroke-box` (stroke bounding box), `view-box` (nearest SVG viewport) |

- **`path()` is pixels only.** MDN: "all the lengths in the path are implicitly defined in pixel (`px`) units; other units can't be used", so no `rem`, percentages or `var()`, and "The `shape()` function offers more flexibility". A `path()` clip fits one element size; regenerate it from script when the element resizes, or use `shape()` (in [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#shapes-and-clipping)). `path()` itself is Baseline widely available, "available across browsers since July 2020" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/path)). A generated squircle path is in [PATHS.md](PATHS.md#smoothed-corners-squircles-as-a-path).
- **A basic shape without a box uses `border-box`.** Combine them: `clip-path: padding-box circle(50px at 0 100px);`.
- **Any value other than `none` creates a new stacking context,** the same way `opacity` below 1 does.

### CSS mask-image and mask-mode

- **`mask-image`:** `none`, a `<mask-source>` (`url("masks.svg#mask1")` pointing at an SVG `<mask>`), or an `<image>` including gradients; comma-separate layers.
- **Only HTTP and HTTPS image sources are accepted** (CORS); a `file://` mask renders as transparent black. A mask that is empty, fails to download, is an unsupported format, doesn't exist or doesn't point to a mask image counts as transparent black and reveals nothing.
- **`mask-mode` (on the masked element):** `alpha`, `luminance` or `match-source` (default). With `match-source`, an SVG `<mask>` source uses its CSS `mask-type`, else its `mask-type` attribute, else `luminance`; an image or gradient source uses `alpha`.
- **Alpha always matters.** With `alpha` only the alpha channel counts (hue and lightness don't); with `luminance` the value is each color's luminance multiplied by its alpha. Solid `green` (`rgb(0% 50% 0% / 1)`) is 35.77% opaque as a luminance mask and 100% as an alpha mask.

## Prove it

- **Pick by edge:** hard cut-outs use `<clipPath>`; anything that fades or uses gray uses `<mask>`.
- **Luminance check:** in a luminance mask, white areas show the element and black areas hide it; if a colored mask looks too faint, compute its luminance (green is only 35.77%) or switch to `mask-type="alpha"`.
- **Mode on HTML:** a gradient or image used in CSS `mask-image` is read as alpha unless `mask-mode: luminance` is set; an SVG `<mask>` referenced from CSS follows its `mask-type`.
- **Units fit:** a clip or mask meant for elements of any size uses `objectBoundingBox` and 0 to 1 coordinates; resize the target and the shape follows.
- **Hit testing:** click just outside the clip on a clipped element (or clipped link) and nothing fires.
- **External references:** a `url("file.svg#id")` in CSS `clip-path` or `mask` comes from the same origin as the page, and a `mask-image` loads over HTTP or HTTPS, not `file://`.
- **`path()` clips follow the size:** resize an element clipped with `clip-path: path()`; the path is regenerated (or the clip uses `shape()`), so the shape never stays at the old pixel size.
