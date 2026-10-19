# SMIL animation

SMIL is the "built-in" way of animating SVG: animation elements (`<animate>`, `<set>`, `<animateTransform>`, `<animateMotion>` with `<mpath>`) placed inside the element they change. Use it for the attributes CSS can't animate (`points`, `viewBox`, `x1`/`y1`/`x2`/`y2`, gradient stop `offset`, filter primitives such as `stdDeviation` and `baseFrequency`). Three things decide most outcomes: `attributeName` and the value attributes (`from`/`to`/`by` or `values`), the timing graph built from `begin`/`end` references, and `fill="freeze"` versus the default `remove`. CSS alternatives: [CSS-ANIMATION.md](CSS-ANIMATION.md). Durations and curves: [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md). Shapes and paths: [BASICS.md](BASICS.md), [PATHS.md](PATHS.md).

**Contents:** [What it can animate](#what-it-can-animate) · [Elements](#elements) · [Target and values](#target-and-values) · [Pacing](#pacing-calcmode-keytimes-keysplines-keypoints) · [Duration and repeat](#duration-repeat-fill-restart) · [begin and end](#begin-and-end) · [additive and accumulate](#additive-and-accumulate) · [Control from JavaScript](#control-from-javascript) · [Status and support](#status-and-support) · [Prove it](#prove-it)

## What it can animate

- **Numbers, transforms, colors and motion.** SMIL animates numeric attributes (`x`, `y`...), `transform` (translate, rotate...), color attributes, and motion along a path.
- **Any attribute,** including `viewBox`, polyline `points`, blur `stdDeviation` and `baseFrequency`, which "isn't true of CSS or Web Animations API" (Motion's docs).
- **One element per attribute.** To animate more attributes on the same element, add more `<animate>` elements.
- **It runs inside `<img>`.** SVG in an image context is processed in secure animated mode: SMIL and CSS animations run, scripts don't.

The course's Module 2 example, animating `points`, which has no CSS property:

```svg
<polyline points="10,50 30,70 50,30 70,50" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">
  <animate attributeName="points" to="10,50 30,30 50,70 70,50" dur="1s" />
</polyline>
```

### Animation attributes by group

| Group | Attributes |
|---|---|
| Target | `href` |
| Attribute target | `attributeType`, `attributeName` |
| Timing | `begin`, `dur`, `end`, `min`, `max`, `restart`, `repeatCount`, `repeatDur`, `fill` |
| Value | `calcMode`, `values`, `keyTimes`, `keySplines`, `from`, `to`, `by` |
| Addition | `additive`, `accumulate` |
| Events | `onbegin`, `onend`, `onrepeat` |

## Elements

- **`<animate>`** animates an attribute of an element over time. DOM interface `SVGAnimateElement`.

```html
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <rect width="10" height="10">
    <animate
      attributeName="rx"
      values="0;5;0"
      dur="10s"
      repeatCount="indefinite" />
  </rect>
</svg>
```

- **`<set>`** sets an attribute's value for a duration. It supports every attribute type, including strings and booleans that can't be interpolated; for attributes that can be interpolated, `<animate>` is usually preferred. It is non-additive, so `additive`/`accumulate` are ignored. `to` accepts `<anything>`. DOM interface `SVGSetElement`.

```html
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <style>
    rect {
      cursor: pointer;
    }
    .round {
      rx: 5px;
      fill: green;
    }
  </style>

  <rect id="me" width="10" height="10">
    <set attributeName="class" to="round" begin="me.click" dur="2s" />
  </rect>
</svg>
```

- **`<animateTransform>`** animates translation, scaling, rotation and/or skewing; it is needed because `transform` isn't a single number. Attributes `by`, `from`, `to`, `type`. The rotate value is `rotate(theta, x, y)`: `theta` in degrees, `x`, `y` the absolute center. MDN also animates the center itself (`from="0 60 60" to="360 100 60"`). DOM interface `SVGAnimateTransformElement`.

```html
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <polygon points="60,30 90,90 30,90">
    <animateTransform
      attributeName="transform"
      attributeType="XML"
      type="rotate"
      from="0 60 70"
      to="360 60 70"
      dur="10s"
      repeatCount="indefinite" />
  </polygon>
</svg>
```

- **`<animateMotion>`** moves an element along a motion path. It takes `keyPoints`, `path` (same syntax as `d`; a translation along x and y of the current user coordinate system) and `rotate`. Its default `calcMode` is `paced`. DOM interface `SVGAnimateMotionElement`. Motion's docs call it "the precursor to CSS's `offset-path`", which with `offset-distance` does "the same job for any element".

```html
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <path
    fill="none"
    stroke="lightgrey"
    d="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />

  <circle r="5" fill="red">
    <animateMotion
      dur="10s"
      repeatCount="indefinite"
      path="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />
  </circle>
</svg>
```

- **`<mpath>`** is a child of `<animateMotion>` that references an existing `<path>` as the motion path, instead of the `path` attribute. Use `href`; `xlink:href` is deprecated. DOM interface `SVGMPathElement`. Motion's docs: with `<mpath>`, "the curve you can see and the curve the circle follows are always in sync".

```html
<path id="path1" d="M100,250 C 100,50 400,50 400,250" fill="none" stroke="blue" stroke-width="7.06" />
<path d="M-25,-12.5 L25,-12.5 L 0,-87.5 z" fill="yellow" stroke="red" stroke-width="7.06">
  <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
    <mpath href="#path1" />
  </animateMotion>
</path>
```

- **`rotate` on `<animateMotion>`:** `auto` turns the element so its right-hand side faces the direction of motion; `auto-reverse` turns its left-hand side to face it; a number is a constant rotation in degrees; the default `0` keeps the original orientation.

```html
<path fill="green" d="M-5,-5 L10,0 -5,5 0,0 Z">
  <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
    <mpath href="#theMotionPath" />
  </animateMotion>
</path>
```
```html
<animateMotion
  path="M 250,80 H 50 Q 30,80 30,50 Q 30,20 50,20 H 250 Q 280,20,280,50 Q 280,80,250,80Z"
  dur="3s"
  repeatCount="indefinite"
  rotate="auto" />
```

## Target and values

| Attribute | Values | Notes |
|---|---|---|
| `attributeName` | `<name>`, no default | the CSS property or attribute of the target to change |
| `attributeType` | `CSS` \| `XML` \| `auto` (default) | `auto` looks for a matching CSS property name first, then the element's default XML namespace |
| `from` | value | start value; with `by` the change is relative; ignored if `values` is set |
| `to` | value | end value; on `<set>`, the value held for the duration; ignored if `values` is set |
| `by` | value | relative offset; ignored if `values` is set |
| `values` | semicolon-separated list | if present, `from`/`to`/`by` are ignored |

```html
<animate attributeName="width" fill="freeze" by="50" dur="3s" />
```

## Pacing: calcMode, keyTimes, keySplines, keyPoints

- **`calcMode`:** `discrete` | `linear` | `paced` | `spline`. Default `linear`, except `paced` for `animateMotion`. If the attribute can't interpolate linearly (e.g. strings), `calcMode` is ignored and discrete is used. `paced` gives an even pace, ignores `keyTimes`/`keySplines`, and works only for values with a notion of "distance".
- **`keyTimes`** (on animate, animateMotion, animateTransform): a semicolon list of 0 to 1 values, one per entry in `values` (the counts must match), non-decreasing. For linear and spline it must start at 0 and end at 1; for discrete it must start at 0. Ignored with `calcMode="paced"` or an indefinite duration. MDN's Safari note: values "should be separated with semicolon without space before".

```html
<animate attributeName="cx" dur="4s" repeatCount="indefinite"
  values="60; 110; 60; 10; 60" keyTimes="0; 0.25; 0.5; 0.75; 1" />
```

- **`keySplines`:** a semicolon list of `x1 y1 x2 y2` control points, all within 0 to 1, one fewer than `keyTimes`. Ignored unless `calcMode="spline"`. Any error (bad values, too many or too few) means "the animation will not occur".

```html
<animate attributeName="cx" dur="4s" calcMode="spline" repeatCount="indefinite"
  values="60; 110; 60; 10; 60" keyTimes="0; 0.25; 0.5; 0.75; 1"
  keySplines="0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1" />
```

- **`keyPoints`** (on `animateMotion`): a 0 to 1 progress along the path for each `keyTimes` entry, counts matching. A trailing semicolon is ignored.

```html
<animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;0.5;1" keyTimes="0;0.15;1" calcMode="linear">
  <mpath href="#motionPath" />
</animateMotion>
```

## Duration, repeat, fill, restart

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `dur` | `<clock-value>` \| `media` \| `indefinite` | `indefinite` | must be > 0; `h`/`m`/`s`/`ms` or `hh:mm:ss.iii`/`mm:ss.iii`; `media` is ignored on animation elements; no interpolation with an indefinite simple duration (can still suit `<set>`) |
| `repeatCount` | `<number>` \| `indefinite` | none | fractions allowed, must be > 0; `indefinite` repeats "until the document ends" |
| `repeatDur` | `<clock-value>` \| `indefinite` | | total time spent repeating |
| `fill` | `freeze` \| `remove` | `remove` | `freeze` keeps the last frame's state; `remove` keeps the first frame's state |
| `restart` | `always` \| `whenNotActive` \| `never` | `always` | `whenNotActive` ignores restarts during the active duration |

```html
<circle cx="250" cy="50" r="20">
  <animate attributeType="XML" attributeName="r" from="0" to="40" dur="5s" fill="freeze" />
</circle>
```

## begin and end

- **`begin`** (default `0s`) is a semicolon-separated list. Each item is one of:

| Kind | Syntax | Meaning |
|---|---|---|
| offset | clock-value | relative to the document start (usually `load`/`DOMContentLoaded`); negative values are valid |
| syncbase | `id.begin` / `id.end` + optional offset | relative to the begin or active end of another animation |
| event | `id.eventName` + optional offset | e.g. focus, blur, focusin, focusout, DOMActivate, auxclick, click, dblclick, mousedown, mouseenter, mouseleave, mousemove, mouseout, mouseover, mouseup, wheel, beforeinput, input, keydown, keyup, composition*, load, unload, abort, error, select, resize, scroll, beginEvent, endEvent, repeatEvent |
| repeat | `id.repeat(n)` + optional offset | on the nth repeat of another animation |
| accessKey | `accessKey(c)` | on a key press (inside an iframe, the frame needs a click first to receive key events) |
| wallclock | `wallclock(ISO-8601)` | at a real time |
| `indefinite` | | begins on `beginElement()` or a hyperlink targeting the element |

- **`end`** (no default) takes the same kinds and can cut the active duration short. With `indefinite`, the end comes from `endElement()`. Example: `end="endButton.click"` on an animation that repeats indefinitely.
- **Chain with syncbase, loop back with a list.** `begin="0s;third.end"` starts at load and again when the last step ends:

```html
<rect x="10" y="35" height="15" width="0">
  <animate attributeType="XML" attributeName="width" to="50" id="first" begin="0s;third.end" dur="4s" />
</rect>
<rect x="60" y="60" height="15" width="0">
  <animate attributeType="XML" attributeName="width" to="25" id="second" begin="first.end" dur="2s" />
</rect>
<rect x="85" y="85" height="15" width="0">
  <animate attributeType="XML" attributeName="width" to="25" id="third" begin="second.end" dur="2s" />
</rect>
```

- **Start on an event:**

```html
<rect x="10" y="35" height="15" width="0">
  <animate attributeType="XML" attributeName="width" from="0" to="100" begin="startButton.click" dur="8s" fill="freeze" />
</rect>
<rect id="startButton" cursor="pointer" x="19.5" y="62.5" rx="5" height="25" width="80" fill="#EFEFEF" stroke="black" stroke-width="1" />
```

- **Act on each repeat** with `<set>` and `id.repeat(n)`:

```html
<rect x="10" y="35" height="15" width="0">
  <animate attributeType="XML" attributeName="width" from="0" to="100" id="myLoop" begin="0s;myLoop.end" dur="4s" repeatCount="3" />
  <set attributeType="CSS" attributeName="fill" to="green" begin="myLoop.begin" />
  <set attributeType="CSS" attributeName="fill" to="gold" begin="myLoop.repeat(1)" />
  <set attributeType="CSS" attributeName="fill" to="red" begin="myLoop.repeat(2)" />
</rect>
```

## additive and accumulate

- **`additive`:** `replace` (default) | `sum`. `sum` adds to the underlying value and to lower-priority animations. Whether a `replace` animation actually replaces also depends on `by`/`to` (see SMIL's "How from, to and by attributes affect additive behavior").
- **`accumulate`:** `none` (default) | `sum`. With `sum`, each repeat iteration builds on the previous one's last value. Ignored if the value doesn't support addition, if the animation doesn't repeat, or if only `to` is given.

## Control from JavaScript

- **`SVGAnimationElement`** is the base interface of `SVGAnimateElement`, `SVGSetElement`, `SVGAnimateMotionElement`, `SVGAnimateTransformElement` (and `SVGAnimateColorElement`).
  - `beginElement()` (= `beginElementAt(0)`) and `endElement()` (= `endElementAt(0)`) create a begin or end instance time at the current time and add it to the instance-times list. They take no parameters and return nothing.
  - `beginElementAt(offset)`, `endElementAt(offset)`.
  - `getStartTime()` throws `INVALID_STATE_ERR` if there is no current interval; `getCurrentTime()`; `getSimpleDuration()` throws `NOT_SUPPORTED_ERR` if undefined.
  - `targetElement` is `null` if `href` points to an unknown element.
  - Events: `beginEvent`, `endEvent`, `repeatEvent` (fired on each repeat after the first iteration).

```js
const animationElement = document.querySelector("animate");
animationElement.beginElement();
console.log("Animation has started.");
```
```js
document.getElementById("restart").addEventListener("click", (evt) => {
  document.querySelectorAll("animate").forEach((element) => {
    element.beginElement();
  });
});
```

- **Pause a whole `<svg>` fragment** on `SVGSVGElement`: `pauseAnimations()` freezes its animation clock, `unpauseAnimations()` resumes where it stopped, `animationsPaused()` reports the state, `getCurrentTime()`/`setCurrentTime()` read and seek the clock. MDN's advice to consider a mechanism for pausing or disabling animation: [JS-AND-REACT.md](JS-AND-REACT.md#reduced-motion-and-accessibility).
- **In React,** `<animate>`, `<animateMotion>`, `<animateTransform>`, `<mpath>` and `<set>` are supported SVG components; React and SMIL together: [JS-AND-REACT.md](JS-AND-REACT.md#react). The course's Module 2 covers fitting SMIL into modern codebases.

## Status and support

| Element | Chrome | Firefox | Safari |
|---|---|---|---|
| `<animate>` | 2 | 4 | 3.1 |
| `<set>` | 2 | 4 | 3 |
| `<animateTransform>` | 2 | 4 | 3 |
| `<animateMotion>`, `<mpath>` | 19 | 4 | 6 |
| `href` without `xlink:` on animation elements | 50 | 51 | 12.1 |

- **Chrome proposed deprecation in 2015.** Philip Rogers posted "Intent to deprecate: SMIL" on blink-dev on 30 April 2015: "SMIL was never implemented in all major browsers which limited its use and spec development slowed after the last spec update in 2008. We would like to deprecate our SVG-specific SMIL implementation and double-down on support and tooling of integrated HTML & SVG animation models: CSS animations and Web animations." A later quote of the intent adds that "SMIL adds significant complexity to Blink" and "Internet Explorer does not support SMIL". Chrome then logged: "SVG's SMIL animations ('animate', 'set', etc.) are deprecated and will be removed. Please use CSS animations or Web animations instead." Developers objected that CSS couldn't animate SVG paths: "the existing support for SMIL should not be dropped before major browsers support CSS animation of SVG paths".
- **The deprecation was suspended toward the end of 2016** after developers showed cases with no replacement, "in a fashion that hints that SMIL deprecation is still being pursued" (one 2022 source). CSS-Tricks: the deprecation "never actually happened", and Chromium-based Edge supports SMIL. By 2022 the only non-supporting browsers were IE (retired) and Opera Mini. Motion's docs: "You'll read that SMIL is deprecated. It isn't."
- **SVG 2 keeps the animation elements:** it points to the SVG Animations spec for them and lists them first among the ways to animate SVG.

### Should you use it? Sources disagree

- **Against (Motion's docs):** SMIL is verbose, with one `<animate>` per attribute and duplicated timing. It "works exclusively via SVG attributes", so it "will stutter when the main thread is busy", while CSS, WAAPI and Motion run `opacity`/`transform` off-thread. "Given the lack of ongoing investment we don't recommend using SMIL."
- **For (Matt Visiwig, svgbackgrounds, 2026-07-29):** SMIL is still worth it for "Portability, file-size, and simplicity". (SVG 2: in an image context such as `<img>`, SMIL and CSS animations run and scripts don't.)
- **For (the course):** Module 2 teaches SMIL as the way to animate the attributes CSS can't reach.

## Prove it

- **Values:** every `keyTimes` list has as many entries as `values`, starts at 0 and (for linear/spline) ends at 1, with no space before each semicolon for Safari.
- **Splines:** with `calcMode="spline"`, `keySplines` has exactly one entry fewer than `keyTimes`; a wrong count means nothing animates.
- **End state:** an animation that should hold its last frame has `fill="freeze"`; without it the element snaps back.
- **Chains:** every `begin="id.end"` names an existing `id`; the loop restarts from `begin="0s;last.end"`.
- **Motion path:** with `<mpath href="#id">`, editing the visible path changes the motion too.
- **Image context:** the SVG animates when loaded through `<img>`.
- **Pause:** calling `pauseAnimations()` on the `<svg>` stops every SMIL animation in it, and `unpauseAnimations()` resumes.
