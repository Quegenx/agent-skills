# SVG from JavaScript and React

Script reaches SVG three ways: the Web Animations API (`element.animate()`, the CSS engine driven from JS), a `requestAnimationFrame` loop that writes attributes or styles each frame, and the geometry methods (`getTotalLength()`, `getPointAtLength()`) that measure paths. What decides most outcomes: Motion's docs say WAAPI can't animate attributes that never became CSS properties (`viewBox`, `points`), a rAF loop must compute progress from its timestamp, and inline SVG in React is JSX (SVGR can generate it) with camelCase attribute names. Autoplaying motion that lasts over five seconds alongside other content needs a way to pause it (WCAG 2.2.2). Property support: [STYLING.md](STYLING.md); CSS-only animation: [CSS-ANIMATION.md](CSS-ANIMATION.md); SMIL: [SMIL.md](SMIL.md); timing and easing: [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md); elements and paths: [BASICS.md](BASICS.md), [PATHS.md](PATHS.md).

## Create SVG elements

- **Create SVG elements with `createElementNS()`.** `document.createElement()` never creates SVG elements: `createElement("circle")` makes an unknown HTML element that renders nothing. Attributes are not namespaced (except legacy `xlink:href`), so plain `setAttribute()` works.

```js
const svgNS = "http://www.w3.org/2000/svg";
const circle = document.createElementNS(svgNS, "circle");
circle.setAttribute("cx", 50);
```

- **Scripts use the namespace-aware DOM methods.** MDN's namespaces guide says to use `createElementNS`, `setAttributeNS`, `getAttributeNS` rather than `createElement`, `setAttribute`, with `null` for unprefixed attributes (`rect.getAttributeNS(null, "x")`). MDN's SVG scripting guide agrees on `createElementNS` but says attributes (except legacy `xlink:href`) are not namespaced, so plain `setAttribute()` suffices. The sources retain these different attribute-method recommendations; namespace declarations are in [BASICS.md](BASICS.md#xmlns).

## Inline versus external

- **Inline SVG can be scripted like HTML.** The course: inlining lets you manipulate the SVG with JavaScript like regular HTML, but means more DOM nodes, or "larger JavaScript bundles" in a component library like React. External references (`<img>`, CSS `url()`) cut bundle size and let the browser cache the file, but may not load immediately "and you're more limited on animation options".
- **In an image context JavaScript is disabled** and external resources can't load unless inlined as `data:` URLs; CSS and SMIL animation still run. `<iframe>`/`<object>`/`<embed>` don't have these restrictions.

## Web Animations API

- **`Element.animate(keyframes, options)`** creates an `Animation`, applies it and plays it. `options` is a duration in ms or an object of KeyframeEffect timing plus `id`, `rangeStart`, `rangeEnd` and `timeline`. `Element.getAnimations()` lists the animations on an element.
- **Sources disagree on attributes.** SVG 2 describes WAAPI as triggering "user-agent optimized animations of style properties and attributes". Motion's docs say WAAPI "can't animate attributes": `cx` works because it is a CSS property, `viewBox` does "nothing at all". Which names are CSS properties: [STYLING.md](STYLING.md#which-attributes-are-presentation-attributes-svg-2-table); confirm in the current browsers.

```js
// cx became a CSS property in SVG 2, so this works
circle.animate({ cx: ["0px", "50px"] }, 1000)
// viewBox never did, so this does nothing at all
svg.animate({ viewBox: ["0 0 100 100", "0 0 50 50"] }, 1000)
```

- **Line drawing:** `path.animate({ strokeDashoffset: [length, 0] }, 2000)` after measuring (below).
- **Motion along a path:** `ball.animate({ offsetDistance: [0, "100%"] }, { duration: 1500, iterations: 4, easing: "cubic-bezier(.667,0.01,.333,.99)", direction: "alternate" })`.
- **No native springs.** Motion's docs: neither CSS nor WAAPI has them; both rely on pre-generated `linear()` easing.
  - Generators for that curve, and why `linear()` suits transitions more than keyframes: [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) in ui-animation.
- **Off the main thread.** Motion's docs: `transform`/`opacity` through CSS, WAAPI or Motion is GPU-accelerated; through GSAP or plain JS it is "animated on the main thread".

## requestAnimationFrame

- **One callback per call, before the next repaint.** Call it again for each frame. It usually fires at the display refresh rate (60/75/120/144 Hz) and is paused in most browsers in background tabs and hidden iframes.
- **Compute progress from the timestamp argument,** "otherwise, the animation will run faster on high refresh-rate screens".
- **Set the zero time inside the first callback:** some browsers have a multi-frame delay before it.

```js
const element = document.getElementById("some-element-you-want-to-animate");
let start;

function step(timestamp) {
  if (start === undefined) {
    start = timestamp;
  }
  const elapsed = timestamp - start;

  // Math.min() is used here to make sure the element stops at exactly 200px
  const shift = Math.min(0.1 * elapsed, 200);
  element.style.transform = `translateX(${shift}px)`;
  if (shift < 200) {
    requestAnimationFrame(step);
  }
}

requestAnimationFrame(step);
```

## Path length and points

- **`SVGGeometryElement.getTotalLength()`** returns the UA-computed total path length in user units, as a float. **`getPointAtLength(distance)`** returns a `DOMPoint` at that distance along the path.
- **The length is in the path's own units,** so it doesn't change when the SVG is scaled. Browsers may estimate it differently; set `pathLength` to make them agree ([CSS-ANIMATION.md](CSS-ANIMATION.md#line-drawing-with-stroke-dasharray-and-stroke-dashoffset)).
- **Non-path shapes:** a CSS-Tricks reader couldn't get a length from non-path shapes and converted them to paths. MDN documents `getTotalLength` on `SVGGeometryElement`, not only on `<path>`; test the shapes you target.
- **Measuring is a DOM read.** Motion's docs warn that `getTotalLength()` "introduces a DOM measurement which... will lead to style thrashing" unless batched, and recommend `pathLength="1"` instead. The measured version, as they show it:

```js
const path = document.querySelector("path")
const length = path.getTotalLength()
path.style.strokeDasharray = length
path.style.strokeDashoffset = length
path.animate({ strokeDashoffset: [length, 0] }, 2000)
```

## React

- **Every built-in SVG element is a supported component,** including `<animate>`, `<animateMotion>`, `<animateTransform>`, `<mpath>`, `<set>`, `<discard>`, `<filter>`/`fe*`, `<clipPath>`, `<mask>`, `<symbol>`, `<use>`, `<foreignObject>` and `<style>`. SMIL elements and their `beginElement()`/`endElement()` methods: [SMIL.md](SMIL.md#control-from-javascript).
- **Props are camelCase,** like the DOM standard (e.g. `tabIndex`; SVGR turns `fill-rule` into `fillRule`). "You can convert existing SVG to JSX with an online converter."
- **Namespaced attributes drop the colon:** `xlink:href` to `xlinkHref`, `xml:lang` to `xmlLang`, `xml:space` to `xmlSpace`, `xmlns:xlink` to `xmlnsXlink`, plus `xlinkActuate`, `xlinkArcrole`, `xlinkRole`, `xlinkShow`, `xlinkTitle`, `xlinkType`, `xmlBase`.
- **`style` keys are camelCase.** A number gets `px` appended unless the property is unitless. React recommends `style` only for dynamic values and `className` otherwise.
- **Motion for React** (Motion's docs): `<motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />` draws a line; `<motion.svg viewBox="0 0 200 200" animate={{ viewBox: "-100 -100 300 300" }} />` animates viewBox, "something neither CSS or WAAPI can animate". The draw props `pathLength`, `pathSpacing` and `pathOffset` work on circle, ellipse, line, path, polygon, polyline and rect. Its transform-origin behavior is defined with the [canonical Motion qualification](REUSE-AND-TRANSFORMS.md#transform-origin-and-transform-box).

### SVGR

- **What it does:** turns an SVG into a React component. It optimizes with SVGO, converts SVG to HAST to a Babel JSX AST (renaming attributes and changing values), wraps the result in a component and formats it with Prettier. Integrations: CLI, webpack loader, Node API, rollup, parcel, Next.js.

```js
const SvgComponent = (props) => (
  <svg width="1em" height="1em" viewBox="0 0 48 1" {...props}>
    <path d="M0 0h48v1H0z" fill="currentColor" fillRule="evenodd" />
  </svg>
)
```

| Option | Default | Effect |
|---|---|---|
| `icon` | false | replaces width/height, using `1em` when no value is given |
| `dimensions` | true | keeps root width/height |
| `svgo` | true | implicitly enables SVGO's `prefixIds` to reduce id/class collisions |
| `svgoConfig` | | SVGO configuration |
| `ref` | | forwards a ref to the root svg |
| `memo` | | wraps in `React.memo` |
| `replaceAttrValues` | | e.g. `{ '#000': "{props.color}" }` or `--replace-attr-values #000={props.color}`; mainly "to change an icon color to 'currentColor' in order to inherit from text color" |
| `svgProps` | | e.g. `role: 'img'`; SVGs implicitly have `role="graphics-document"`, and once `role="img"` is set some screen readers announce `title`/`text`/`desc` |
| `titleProp`, `descProp` | | |
| `template`, `outDir` | | |
| `filenameCase` | `pascal` | |
| `ext` | `"js"` | |

- **Next.js:** install `@svgr/webpack`. Add a webpack rule `{ test: /\.svg$/, use: [{ loader: "@svgr/webpack", options: { icon: true } }] }` and a Turbopack rule `"*.svg": { loaders: ["@svgr/webpack"], as: "*.js" }`. Import `./star.svg` as a component, or `./star.svg?url` for `next/image`. For TypeScript, add an `svgr.d.ts` and list it first in tsconfig `include`:

```ts
declare module '*.svg' {
  import { FC, SVGProps } from 'react'
  const content: FC<SVGProps<SVGElement>>
  export default content
}

declare module '*.svg?url' {
  const content: any
  export default content
}
```

## Reduced motion and accessibility

- **`prefers-reduced-motion`:** `no-preference` | `reduce`. `@media (prefers-reduced-motion)` equals `(prefers-reduced-motion: reduce)`. Scaling or panning large objects can trigger vestibular disorders. MDN's pattern replaces the motion with a gentler animation (a dissolve) rather than removing it:

```css
.animation {
  animation: pulse 1s linear infinite both;
  background-color: purple;
}

/* Tone down the animation to avoid vestibular motion triggers. */
@media (prefers-reduced-motion: reduce) {
  .animation {
    animation: dissolve 4s linear infinite both;
    background-color: green;
    text-decoration: overline;
  }
}
```

- **Where users turn it on:** Windows 11 Settings > Accessibility > Visual Effects > Animation Effects; macOS up to 15 Accessibility > Display > Reduce motion; macOS 25 (Tahoe) onwards Accessibility > Motion > Reduce motion; iOS Settings > Accessibility > Motion; Android 9+ "Remove animations"; Firefox `ui.prefersReducedMotion` = 1.
- **Offer a pause.** Blinking and flashing can be problematic for ADHD; motion can trigger vestibular disorders, epilepsy, migraine and Scotopic sensitivity. "Consider providing a mechanism for pausing or disabling animation", and use the reduced-motion media query or the `Sec-CH-Prefers-Reduced-Motion` client hint. For SMIL the DOM pause is `SVGSVGElement.pauseAnimations()` ([SMIL.md](SMIL.md#control-from-javascript)).
- **WCAG 2.2.2 Pause, Stop, Hide (Level A):** moving, blinking or scrolling content that starts automatically, lasts more than five seconds and is shown alongside other content must have a way to pause, stop or hide it, unless the motion is essential. A preload animation can count as essential if interaction can't happen during it.
- **WCAG 2.3.3 Animation from Interactions (Level AAA):** "Motion animation triggered by interaction can be disabled, unless the animation is essential". Parallax scrolling is named as often non-essential.

## Prove it

- **WAAPI scope:** `circle.animate({ cx: [...] })` moves the circle; the same call on `viewBox` does nothing, so that animation is in SMIL or Motion.
- **rAF:** the animation takes the same time on a 60 Hz and a 120 Hz display (progress comes from the timestamp, zeroed in the first callback).
- **Measuring:** `getTotalLength()` is read once per path, not inside a per-frame loop, or the path uses `pathLength="1"`.
- **React:** no hyphenated or colon attribute names remain in JSX (`fillRule`, `xlinkHref`); SVGR output uses `currentColor` and recolors with the parent's `color`.
- **Next.js:** `import Star from './star.svg'` renders a component and `./star.svg?url` works in `next/image`, with no TypeScript error.
- **Reduced motion:** with the OS setting on, each SVG animation is replaced or toned down; any autoplaying animation over five seconds has a pause control that stops it.
