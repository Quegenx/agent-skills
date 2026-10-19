---
name: svg
description: "Draws, styles, animates and ships SVG for the web the way MDN and the W3C specs describe it: the root, viewBox and coordinates, shapes, text and paths, groups, symbols, use and transforms, presentation attributes and currentColor, gradients and patterns, clipping and masking, filters including goo and glass refraction, CSS, SMIL and JavaScript animation, morphing icons, embedding and sprites, accessibility, SVGO and SVGR, and sanitizing uploads. Use when writing or reviewing SVG markup, an icon system, an SVG animation or filter effect, SVG in React or Next.js, or handling user-supplied SVG."
---

# SVG

SVG is markup for images, and it has no layout algorithm: every element sits where its own coordinates put it, in a user coordinate system that the root's `viewBox`, `width`, `height` and `preserveAspectRatio` map onto the screen, and later elements paint over earlier ones. Most surprises come from that mapping (transforms measured from the viewBox origin, units that resolve against the bounding box), from the line between attributes and CSS properties (which decides what CSS can style and animate), and from how the SVG is embedded (inline is part of the page DOM; an image runs no scripts and loads nothing external). Durations, curves and springs for interface motion are in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md); SVG in code-made videos (glass, illustration, logos drawn from `t`) is in [seek-engine SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The root `<svg>`, `xmlns`, no layout, the coordinate system, `viewBox`, `width`/`height`, `preserveAspectRatio`, nested `svg`, painting order, a print sheet in millimeters and its PNG size | [BASICS.md](BASICS.md) |
| Basic shapes, text, `tspan`, `textPath`, multi-line text, fill and stroke, line caps and joins, dashes, `non-scaling-stroke`, `fill-rule`, `paint-order` | [SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md) |
| Path data: the 20 commands, Béziers, arcs, compaction, parse errors, animating `d`, `pathLength`, a smoothed-corner (squircle) path generator | [PATHS.md](PATHS.md) |
| `g`, `defs`, `symbol`, `use`, `href` vs `xlink:href`, the `transform` attribute and functions, `transform-origin` and `transform-box` | [REUSE-AND-TRANSFORMS.md](REUSE-AND-TRANSFORMS.md) |
| Presentation attributes and the cascade, geometry properties in CSS, `currentColor`, custom properties through `<use>` | [STYLING.md](STYLING.md) |
| Linear and radial gradients, stops, `spreadMethod`, gradient units, patterns | [GRADIENTS-AND-PATTERNS.md](GRADIENTS-AND-PATTERNS.md) |
| `clipPath`, `mask`, luminance vs alpha, units, CSS `clip-path`, `mask-image` and `mask-mode` on HTML | [CLIP-AND-MASK.md](CLIP-AND-MASK.md) |
| Filter regions, wiring primitives, every `fe*` primitive, `feColorMatrix`, worked shadows, the goo filter, glass refraction with `feDisplacementMap` and its Safari limits, CSS `filter: url()` | [FILTERS.md](FILTERS.md) |
| CSS transitions and keyframes on SVG, `transform-box: fill-box`, line drawing with dashes, techniques from transitions.dev (transitioned checks, chevron flips, one-axis blur, flowing dotted lines), morphing `d` with `path()`, acceleration | [CSS-ANIMATION.md](CSS-ANIMATION.md) |
| SMIL: `animate`, `set`, `animateTransform`, `animateMotion`, pacing, timing and chaining, JavaScript control, support and whether to use it | [SMIL.md](SMIL.md) |
| Namespace-aware DOM creation, WAAPI, `requestAnimationFrame`, path length and points, React and SVGR, Motion, Next.js setup, reduced motion and WCAG pause rules | [JS-AND-REACT.md](JS-AND-REACT.md) |
| Three-line icons that morph into any other: collapsed lines, rotation groups, the icon table, the transition algorithm, the starter prompt | [MORPHING-ICONS.md](MORPHING-ICONS.md) |
| Inline vs `<img>` vs CSS vs `<object>`, image-mode restrictions, namespaces, data URIs, sprites with `symbol` and `use`, fragment views, `currentColor` icons, icons beside text (stroke by weight, size, outline and fill), a static SVG favicon, `foreignObject`, markers | [EMBEDDING-AND-ICONS.md](EMBEDDING-AND-ICONS.md) |
| Informative vs decorative SVG, `role="img"`, `title` and `desc`, icon buttons, links, tooling that strips names | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| SVGO presets and risky plugins, SVGR's defaults, rendering cost, where scripts hide, serving headers, user uploads, DOMPurify | [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md) |

## The rules

1. **Give every reusable graphic a `viewBox`,** with positive width and height, and keep it through the build: check what your SVGO or SVGR config does with `removeViewBox` ([OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md#svgrs-defaults)).
2. **Choose the embedding by the job:** inline when page script or CSS must reach inside or animate it; an external image (`<img>`, CSS `url()`) when it is only displayed and cached, with `xmlns="http://www.w3.org/2000/svg"` on its root and nothing that needs script or external resources.
3. **Every SVG is informative or decorative.** Informative inline SVG gets `role="img"` and a name (`<title>` first, `aria-labelledby` or `aria-label`; `alt` on `<img>`); decorative SVG gets `aria-hidden="true"` and no name anywhere inside.
4. **Style with CSS and draw icons in `currentColor`.** Presentation attributes have specificity 0, so any CSS rule wins, and SVG 2 suggests style properties over presentation attributes; `fill="currentColor"` and `stroke="currentColor"` make an icon follow the text color.
5. **Transforms start at the viewBox origin.** To rotate or scale an element about its own center, set `transform-box: fill-box` with `transform-origin: center`, or give an explicit origin.
6. **Animate with the engine that can reach the value.** CSS and WAAPI only reach CSS properties, and `transform` and `opacity` through them run off the main thread; `viewBox`, `points`, line endpoints and filter attributes need SMIL or a library such as Motion. CSS `d` has no effect in Safari, and any morph needs the same structure on both ends. With reduced motion, tone animations down, and give anything autoplaying over five seconds a pause.
7. **Size the filter region to the effect** (pixels outside it are clipped) and keep blur off large elements that scroll or animate.
8. **Treat SVG you didn't write as active content:** sanitize it (DOMPurify with the `svg` profile), validate the file type yourself, and serve uploads with a CSP that blocks scripts and `Content-Disposition: attachment`.

## Prove it

Every reusable SVG scales to its container without clipping after SVGO or SVGR; every external one renders when opened directly; a screen reader announces each informative SVG once by its name and skips decorative ones; icons recolor when the parent's `color` changes; rotated parts spin in place; each animation runs in Chrome, Firefox and Safari and tones down under reduced motion; no filter edge is clipped; a test upload with `<script>`, `onload` and a `javascript:` link comes out clean; and every file's own Prove it checks pass for the parts you touched.
