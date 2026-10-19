# GSAP SVG plugins

DrawSVG for stroke drawing, MorphSVG for shape morphs, and MotionPath for moving along a path. Source: GreenSock's official gsap-plugins skill (MIT), checked against https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/ and https://gsap.com/docs/v3/Plugins/MotionPathPlugin/. Each is the library route over a technique the svg skill covers by hand: line drawing in [svg CSS-ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CSS-ANIMATION.md#line-drawing-with-stroke-dasharray-and-stroke-dashoffset), morphing in [svg MORPHING-ICONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/MORPHING-ICONS.md) and [svg CSS-ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CSS-ANIMATION.md#animate-d-with-path), motion along a path in [svg JS-AND-REACT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/JS-AND-REACT.md#web-animations-api). Registration is in [PLUGINS.md](PLUGINS.md#registering-plugins), tweens in [CORE.md](CORE.md), timelines in [TIMELINES.md](TIMELINES.md), cleanup in [REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md), cost in [PERFORMANCE.md](PERFORMANCE.md).

## DrawSVG

[GreenSock, gsap-plugins] Reveals or hides the stroke of `<path>`, `<line>`, `<polyline>`, `<polygon>`, `<rect>` and `<ellipse>` by animating `stroke-dashoffset` and `stroke-dasharray`, the same mechanism as the hand-written dash technique.

- **The value is the visible segment, not a from-to.** `"start end"` in percent or length: `"0% 100%"` is the full stroke, `"20% 80%"` only the middle. A single value means start is 0, so `"100%"` equals `"0% 100%"`. The tween runs from the element's **current** segment to the target one.
- **It needs a visible stroke:** set `stroke` and `stroke-width` in CSS or as attributes, or nothing draws.

```javascript
gsap.registerPlugin(DrawSVGPlugin);

// draw from nothing to full stroke
gsap.from("#path", { duration: 1, drawSVG: 0 });
// or explicit segment: from 0-0 to 0-100%
gsap.fromTo("#path", { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1 });
// stroke only in the middle (gaps at ends)
gsap.to("#path", { duration: 1, drawSVG: "20% 80%" });
```

- **Caveats:** stroke only, never fill. Prefer single-segment `<path>` elements; multi-segment paths can render oddly in some browsers (the svg skill notes closed paths misbehave with hand-written dashes too). The contents of `<use>` can't be changed. `DrawSVGPlugin.getLength(element)` and `DrawSVGPlugin.getPosition(element)` return the stroke length and current position.

## MorphSVG

[GreenSock, gsap-plugins] Morphs one shape into another by animating `d`. Options verified against https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/.

- **The two shapes don't need the same number of points.** MorphSVG converts to cubic beziers and adds points as needed. That drops the constraint the hand-built icon set depends on, "every icon is exactly three SVG `<line>`s, so every pair shares the same underlying structure" ([svg MORPHING-ICONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/MORPHING-ICONS.md)), and the CSS `path()` rule that both ends need the same commands.
- **Targets:** `<path>`, `<polyline>` and `<polygon>` directly. `MorphSVGPlugin.convertToPath("circle, rect, ellipse, line")` replaces the other primitives with `<path>` in the DOM.
- **The value:** a selector (`"#lightning"`), an element, raw path data, or a points string for polygon and polyline. The object form needs only `shape`.

```javascript
gsap.registerPlugin(MorphSVGPlugin);

// convert primitives to path first if needed:
MorphSVGPlugin.convertToPath("circle, rect, ellipse, line");

gsap.to("#diamond", { duration: 1, morphSVG: "#lightning", ease: "power2.inOut" });
// object form:
gsap.to("#diamond", {
  duration: 1,
  morphSVG: { shape: "#lightning", type: "rotational", shapeIndex: 2 }
});
```

| Option | Description |
|--------|-------------|
| **shape** | _(Required.)_ Target shape: selector, element, or raw path string. |
| **type** | `"linear"` (default) or `"rotational"`, which interpolates angle and length and can avoid mid-morph kinks. |
| **map** | How segments are matched: `"size"` (default), `"position"` or `"complexity"` (the fastest). If none line up, split into several paths and morph each. |
| **shapeIndex** | Which start point maps to the end's first point, to stop a shape crossing over or inverting. Default `"auto"`. A number for single-segment paths, an **array** for multi-segment (`[5, 1, -8]`); a negative value reverses that segment. `"log"` prints the computed value once to paste back in. Closed paths only. `findShapeIndex(start, end)` is a separate interactive utility. |
| **smooth** | (v3.14+) Adds smoothing points: a number (`80`), `"auto"`, or `{ points: 40 \| "auto", redraw, persist }`, with redraw and persist both defaulting to `true`. `redraw: false` keeps the original anchors; `persist: false` removes the added points when the tween ends. |
| **curveMode** | Boolean (v3.14+). Interpolates handle angle and length instead of raw x and y to avoid kinks on curves; it can look worse when anchors are close together. |
| **origin** | Rotation origin for `type: "rotational"`: `"50% 50%"` (default), or `"20% 60%, 35% 90%"` for different start and end origins. |
| **precision** | Decimal places in the output path; default `2`. |
| **precompile** | Precomputed path strings (`"log"` once, copy from the console). `<path>` only. It removes startup cost only; it does not fix jank during the tween (simplify the SVG instead). |
| **render** | `function(rawPath, target)` on each update, e.g. to draw on canvas. A RawPath is an array of segments, each alternating x,y cubic bezier coordinates. |
| **updateTarget** | Default `true`; set `false` with a canvas-only `render` so the `<path>` isn't touched. `MorphSVGPlugin.defaultUpdateTarget` sets the default. |

- **Utilities:** `MorphSVGPlugin.rawPathToString(rawPath)` and `stringToRawPath(d)` convert between strings and raw arrays. The plugin stores the original `d` on the target, so tweening back to the same element works.

## MotionPath

[GreenSock, gsap-plugins] Moves an element along an SVG path. The hand-written route is WAAPI on `offsetDistance` ([svg JS-AND-REACT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/JS-AND-REACT.md#web-animations-api)).

```javascript
gsap.registerPlugin(MotionPathPlugin);

gsap.to(".dot", {
  duration: 2,
  motionPath: { path: "#path", align: "#path", alignOrigin: [0.5, 0.5] }
});
```

| Option | Description |
|--------|-------------|
| `path` | SVG path element, selector, or path data string (or an array of points) |
| `align` | Path element or selector to align the target to |
| `alignOrigin` | `[x, y]` origin in 0 to 1 |
| `autoRotate` | Rotates the element to follow the path's direction |
| `curviness` | Default `1`; applies only to an array of points; `0` gives straight lines |

The skill gives `alignOrigin` a default of `[0.5, 0.5]` and curviness a range of "0-2" as general "path smoothing"; the docs state neither. They give curviness default 1, applied only to point arrays (0 makes straight lines, 2 "much more curvy"), and no alignOrigin default, so set `alignOrigin` explicitly as the sample does. https://gsap.com/docs/v3/Plugins/MotionPathPlugin/

- **MotionPathHelper** edits a motion path in the browser for development. Load and register both `MotionPathPlugin` and `MotionPathHelper`. The [official helper reference](https://gsap.com/docs/v3/Plugins/MotionPathHelper) accepts a Tween that already has a motion path, or a target/selector plus an optional vars object whose `path` holds the path. After editing, its COPY MOTION PATH button copies the path data to use in the tween or SVG. The documented instance method is `kill()`; the static `MotionPathHelper.editPath(path, config)` makes an SVG path editable.

The source and old block registered `MotionPathHelperPlugin`, used `create(target, path, vars)`, and recommended `helper.path` or `helper.getProgress()`; those forms are not established by the [official helper reference](https://gsap.com/docs/v3/Plugins/MotionPathHelper). [GreenSock, gsap-plugins]

## Prove it

- **DrawSVG:** with no `stroke` set, `drawSVG` shows nothing; add `stroke` and `stroke-width` and `gsap.from("#path", { drawSVG: 0 })` draws it. `gsap.to("#path", { drawSVG: "20% 80%" })` leaves gaps at both ends.
- **MorphSVG:** morph a 4-point diamond into a many-point lightning bolt with no point matching; it morphs. If it twists, `shapeIndex: "log"` prints a value that, pasted back, removes the twist.
- **MotionPath:** with `align` and `alignOrigin: [0.5, 0.5]`, the dot's center rides the path; with `autoRotate`, it turns with the curve.
- **Dev tools:** the production bundle contains no MotionPathHelper or GSDevTools.
