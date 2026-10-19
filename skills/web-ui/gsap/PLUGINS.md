# GSAP plugins

Registering plugins, then the scroll, layout, input, text, easing, physics and development plugins. Source: GreenSock's official gsap-plugins skill (MIT), with the plugin roster and lazy loading from the gsap-frameworks skill, checked against the gsap.com plugin pages. Where the skill disagrees with the docs, the docs' form is given with its URL and the change is named. ScrollTrigger is in [SCROLLTRIGGER.md](SCROLLTRIGGER.md); DrawSVG, MorphSVG and MotionPath in [SVG-PLUGINS.md](SVG-PLUGINS.md); tweens and built-in eases in [CORE.md](CORE.md); timelines in [TIMELINES.md](TIMELINES.md); React registration and cleanup in [REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md); cost in [PERFORMANCE.md](PERFORMANCE.md).

**Contents:** [Licensing and install](#licensing-and-install) · [Registering plugins](#registering-plugins) · [ScrollToPlugin](#scrolltoplugin) · [ScrollSmoother](#scrollsmoother) · [Flip](#flip) · [Draggable](#draggable) · [InertiaPlugin](#inertiaplugin) · [Observer](#observer) · [SplitText](#splittext) · [ScrambleText](#scrambletext) · [CustomEase and the ease family](#customease-and-the-ease-family) · [Physics](#physics) · [GSDevTools](#gsdevtools) · [PixiPlugin](#pixiplugin) · [Prove it](#prove-it)

## Licensing and install

[GreenSock, gsap-plugins]

- **Every plugin is free, including for commercial use.** Club GSAP is no longer a paid tier, and no plugin needs a membership, license key or auth token, SplitText and MorphSVG included.
- **Install the public package:** `npm install gsap`, then import `gsap/SplitText`, `gsap/MorphSVGPlugin` and so on.
- **Never generate an `.npmrc` with a GreenSock token,** point at the private `npm.greensock.com` registry, or tell users to join Club GSAP. Docs: "all the plugins are now freely available on npm"; users of the old private registry should "install directly from npm"; this needs "GSAP version 3.13 or later". https://gsap.com/docs/v3/Installation/

## Registering plugins

[GreenSock, gsap-plugins]

```javascript
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(ScrollToPlugin, Flip, Draggable);
```

- **Register every plugin once, before its first use.** Docs: registering stops "build tools [dropping] them during tree shaking"; with `<script>` tags GSAP "will attempt to auto-register the plugins as long as the core has already loaded". https://gsap.com/docs/v3/Installation/
- **Register at app level, not in a component body that re-renders.** [GreenSock, gsap-frameworks] Doing it every render "doesn't hurt anything, it's just wasteful". useGSAP is itself a plugin and needs registering ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md)).
- **Lazy-load rarely used plugins** to cut the initial bundle. [GreenSock, gsap-frameworks] The skill's Nuxt composable keeps a typed key-to-loader map and registers what it loads. Excerpt, changed: the map is cut to two of its 24 entries (the `// ...` line is added), and `lazyLoadPlugin` is lifted out of the composable's default export and de-indented:

```typescript
// In order to dynamically load all the GSAP plugins
const pluginMap = {
  MorphSVGPlugin: () => import("gsap/MorphSVGPlugin"),
  SplitText: () => import("gsap/SplitText"),
  // ...one entry per plugin in the roster below
} as const;

type PluginMap = typeof pluginMap;
type Plugins = keyof PluginMap;

// Resolves the module type for a given key, then picks the named export matching the key
// this allows to have the type definitions for autocomplete in your code editor
type PluginModule<K extends Plugins> = Awaited<ReturnType<PluginMap[K]>>;
type PluginExport<K extends Plugins> = PluginModule<K>[K & keyof PluginModule<K>];

async function lazyLoadPlugin<K extends Plugins>(plugin: K): Promise<PluginExport<K>> {
  const loader = pluginMap[plugin];
  const m = await loader();
  const p = (m as any)[plugin];
  gsap.registerPlugin(p);
  return p;
}
```

  The skill's full file also declares `type Plugins = (typeof PLUGINS)[number]` from a `PLUGINS` name array, so `type Plugins` appears twice in one module (a TypeScript duplicate-identifier error) and the array goes unused; the excerpt above keeps only the map-based declaration. It also points to `examples/vue/` and `examples/nuxt/`, which are not shipped.
- **The roster** (gsap-frameworks): CSSRulePlugin, CustomBounce, CustomEase, CustomWiggle, Draggable, DrawSVGPlugin, EaselPlugin, EasePack, Flip, GSDevTools, InertiaPlugin, MorphSVGPlugin, MotionPathHelper, MotionPathPlugin, Observer, Physics2DPlugin, PhysicsPropsPlugin, PixiPlugin, ScrambleTextPlugin, ScrollSmoother, ScrollToPlugin, ScrollTrigger, SplitText, TextPlugin.
- **Revert plugin instances** (`split.revert()`) when components unmount or elements are removed.

## ScrollToPlugin

[GreenSock, gsap-plugins] Animates the scroll position of the window or a scrollable element, without ScrollTrigger.

```javascript
gsap.registerPlugin(ScrollToPlugin);

gsap.to(window, { duration: 1, scrollTo: { y: 500 } });
gsap.to(window, { duration: 1, scrollTo: { y: "#section", offsetY: 50 } });
gsap.to(scrollContainer, { duration: 1, scrollTo: { x: "max" } });
```

| Option | Description |
|--------|-------------|
| `x`, `y` | A number, a selector or element to scroll to, or `"max"` |
| `offsetX`, `offsetY` | Offset in pixels from the target position |
| `autoKill` | Stops the tween if the user scrolls |
| `onAutoKill` | Called when autoKill stops it |

The skill's table lists an `element` option "for scroll-into-view"; the docs have none. Pass the selector or element as `x` or `y`. https://gsap.com/docs/v3/Plugins/ScrollToPlugin/

## ScrollSmoother

[GreenSock, gsap-plugins]

- **GSAP's smooth-scroll wrapper.** It needs ScrollTrigger (register it after ScrollTrigger) and this DOM, with `position: fixed` elements outside the wrapper:

```html
<body>
	<div id="smooth-wrapper">
		<div id="smooth-content">
			<!--- ALL YOUR CONTENT HERE --->
		</div>
	</div>
	<!-- position: fixed elements can go outside --->
</body>
```

- **It needs no `scrollerProxy`**; any other smooth scroller does ([SCROLLTRIGGER.md](SCROLLTRIGGER.md#scrollerproxy-and-smooth-scrollers)).
- **The owner uses Lenis instead.** landing-page-ui puts "A smooth-scroll library at the root" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#smooth-scrolling)), mounted as `ReactLenis`. Keep it; ScrollSmoother is the GSAP-native alternative, and ScrollTrigger beside Lenis follows the proxy rule in SCROLLTRIGGER.md.

## Flip

[GreenSock, gsap-plugins] Animates between two layout states (lists, grids, expanded and collapsed): record, change the DOM, play from the old state.

```javascript
gsap.registerPlugin(Flip);

const state = Flip.getState(".item");
// change DOM (reorder, add/remove, change classes)
Flip.from(state, { duration: 0.5, ease: "power2.inOut" });
```

- **A third route beside Motion.** ui-animation animates reordering with Motion's `layout`, and "Without Motion, the same thing is FLIP (First, Last, Invert, Play)" hand-rolled ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#lists-that-stagger-reorder-and-remove)). Flip is GSAP's own API for that technique.
- **Options, as the docs give them** (the skill gets three of four wrong; https://gsap.com/docs/v3/Plugins/Flip/):

| Option | What it does |
|--------|-------------|
| `absolute` | Which targets get `position: absolute` during the flip. It "removes the elements from document flow, so things below can collapse". |
| `nested` | `true` does extra calculations so a parent's and a child's movements don't compound. The skill said "only the first level of children is measured". |
| `scale` | `true` scales instead of the default width and height change; "typically better performance". Opt-in: the skill said "default `true`". |
| `simple` | `true` skips the rotation, scale and skew calculations, which is faster. The skill said "only position/scale are animated". |
| `duration`, `ease` | Standard tween options |

## Draggable

[GreenSock, gsap-plugins] Drag, spin or throw with mouse and touch: sliders, cards, reorderable lists.

```javascript
gsap.registerPlugin(Draggable, InertiaPlugin);

Draggable.create(".box", { type: "x,y", bounds: "#container", inertia: true });
Draggable.create(".knob", { type: "rotation" });
```

Options as the docs give them (https://gsap.com/docs/v3/Plugins/Draggable/):

| Option | Description |
|--------|-------------|
| `type` | Default `"x,y"`. Also `"x"`, `"y"`, `"top"`, `"left"`, `"top,left"`, `"rotation"`. The skill also lists `"scroll"`; that value was not confirmed on the docs page as fetched. |
| `bounds` | Element, selector, `{ minX, maxX, minY, maxY }`, `{ top, left, width, height }` or `{ minRotation, maxRotation }` |
| `inertia` | `true` for throw and momentum; needs InertiaPlugin, without which momentum is disabled |
| `edgeResistance` | 0 to 1; resistance when dragging past bounds |
| `cursor` | CSS cursor; defaults to `move` |
| `onDragStart`, `onDrag`, `onDragEnd` | Drag callbacks |
| `onThrowUpdate`, `onThrowComplete` | After release only, while inertia runs |

The owner's preview drag uses Motion with "elastic .22, no momentum" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#image-preview)); ui-animation's drag and throw rules are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#gestures-drag-throw-snap).

## InertiaPlugin

[GreenSock, gsap-plugins]

- **With Draggable** it gives momentum after release (`inertia: true`, both plugins registered).
- **On its own** it tracks the velocity of any property of any object, then glides to a stop:

```javascript
InertiaPlugin.track(".box", "x");
```

```javascript
gsap.to(obj, { inertia: { x: "auto" } });
```

## Observer

[GreenSock, gsap-plugins] Normalizes wheel, touch and pointer input, for swipe, direction or gesture logic that isn't tied to scroll position the way ScrollTrigger is.

```javascript
gsap.registerPlugin(Observer);

Observer.create({
  target: "#area",
  onUp: () => {},
  onDown: () => {},
  onLeft: () => {},
  onRight: () => {},
  tolerance: 10
});
```

- **`type` defaults to `"wheel,touch,pointer"`**; values are `wheel`, `touch`, `scroll` and `pointer`. The skill said the default is `"touch,pointer"`. https://gsap.com/docs/v3/Plugins/Observer/
- **onUp means the deltas decrease** (docs). `wheelSpeed: -1` inverts only the wheel.
- **`tolerance`** is the distance before a direction fires. The skill's "default 10" is not stated on the docs page (unverified).

## SplitText

[GreenSock, gsap-plugins] Splits text into chars, words and/or lines, each in its own element, for per-unit animation. `SplitText.create(target, vars)` (selector, element or array) returns an instance with `chars`, `words`, `lines`, and `masks` when `mask` is set. Restore with `revert()`, or let `gsap.context()` or `useGSAP()` revert it; it also works with `matchMedia()`.

```javascript
gsap.registerPlugin(SplitText);

const split = SplitText.create(".heading", { type: "words, chars" });
gsap.from(split.chars, { opacity: 0, y: 20, stagger: 0.03, duration: 0.4 });
// later: split.revert() or let gsap.context() cleanup revert
```

- **Build the animation inside `onSplit()` and return it when `autoSplit` is on.** `autoSplit: true` reverts and re-splits after fonts load and when the width changes (with lines split); returning the tween lets SplitText revert it and carry its progress over (v3.13.0+):

```javascript
SplitText.create(".split", {
  type: "lines",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.lines, { y: 100, opacity: 0, stagger: 0.05, duration: 0.5 });
  }
});
```

  Docs: onSplit, autoSplit, deepSlice, mask, propIndex and the object form of wordDelimiter need 3.13.0+. https://gsap.com/docs/v3/Plugins/SplitText/

| Option | Description |
|--------|-------------|
| **type** | `"chars"`, `"words"`, `"lines"`, comma-separated. Default `"chars,words,lines"`. Split only what you animate. |
| **charsClass**, **wordsClass**, **linesClass** | Class on each piece. Append `"++"` for incremented classes (`linesClass: "line++"` gives `line1`, `line2`). |
| **aria** | `"auto"` (default): `aria-label` on the split element, `aria-hidden` on the pieces. `"hidden"` hides everything; `"none"` leaves aria alone. Docs: "Nested links are not preserved with auto", so use `"none"` plus a screen-reader duplicate when links or semantics must stay reachable. |
| **mask** | `"lines"`, `"words"` or `"chars"`: one clipping wrapper per unit, on the `masks` array (or class `-mask`). One type only. |
| **tag** | Wrapper tag, default `"div"`. A `span` may not render rotation or scale in some browsers. |
| **deepSlice** | Default `true`: nested elements (`<strong>`) spanning lines are subdivided so lines don't stretch. Lines only. |
| **ignore** | Selector or elements left unsplit (`ignore: "sup"`). |
| **smartWrap** | Chars-only splits wrap each word in a `white-space: nowrap` span to avoid mid-word breaks. Ignored when words or lines are split. Default `false`. |
| **wordDelimiter** | String (default `" "`), RegExp, or `{ delimiter: RegExp, replaceWith: string }`. |
| **prepareText(text, parent)** | Returns modified text before splitting, e.g. break markers for languages without spaces. |
| **propIndex** | `true` adds an index variable on each piece (`--word: 1`, `--char: 2`). |
| **reduceWhiteSpace** | Default `true`. From v3.13.0 it also honors line breaks and can insert `<br>` for `<pre>`. |
| **onRevert** | Called when the instance reverts. |

- **The mask's clipping property is unsettled.** The skill says the wrapper gets `overflow: clip`. The official page says `visibility: clip` in the mask description and `overflow: clip` in its config example. Inspect the generated wrapper in your version rather than relying on either. https://gsap.com/docs/v3/Plugins/SplitText/
- **Tips** (all verified on the docs page): don't split chars only without words or lines unless `smartWrap` is on. Split after `document.fonts.ready`, or use `autoSplit` with `onSplit()`. Use `font-kerning: none; text-rendering: optimizeSpeed;` to avoid a kerning shift when splitting chars. SplitText doesn't support SVG `<text>`.
- **`text-wrap: balance`, both ways.** The skill and docs: "Avoid `text-wrap: balance`; it can interfere with splitting." modern-css gives "Balanced headings in one line" and balance's own limits ([modern-css TYPOGRAPHY-AND-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/TYPOGRAPHY-AND-UNITS.md#text-wrap-balance)). app-ui sets "`text-wrap: balance` on every role and on h1 to h4" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)), and the owner's hero splits its title with its own `Intl.Segmenter` splitter at render time, not SplitText ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-hero-assembles-once)). Whether the SplitText caveat reaches a React-rendered split is not settled by the sources.
- **The aria pattern matches the owner's.** landing-page-ui: "The animated letters are `aria-hidden`; the full title ... sits beside them as screen-reader text", the same shape as `aria: "none"` plus a duplicate.

## ScrambleText

[GreenSock, gsap-plugins] Reveals or swaps text with a scramble.

```javascript
gsap.registerPlugin(ScrambleTextPlugin);

gsap.to(".text", {
  duration: 1,
  scrambleText: { text: "New message", chars: "01", revealDelay: 0.5 }
});
```

## CustomEase and the ease family

[GreenSock, gsap-plugins]

- **CustomEase is a plugin; register it.**

```javascript
gsap.registerPlugin(CustomEase);
const ease = CustomEase.create("name", ".17,.67,.83,.67");
gsap.to(".el", { x: 100, ease: ease, duration: 1 });
```

- **Only the bare-number form parses; a CSS `cubic-bezier()` string does not.** Measured in GSAP 3.15.0 source (`_configEaseFromString`, `_parseEase`, `_customEaseExp = /^[\d.\-M][\d.\-,\s]/`): `gsap.parseEase("cubic-bezier(0.23, 1, 0.32, 1)")` returns `undefined` and the tween silently falls back to the default `power1.out`, with or without CustomEase. With CustomEase registered, `"0.23,1,0.32,1"` works (progress 0.5 gives 0.9659 against 0.7500 for the cubic-bezier string and for `power1.out`). The CustomEase docs don't say the wrapped form works. To carry a CSS curve over, strip the wrapper: `CustomEase.create("site", "0.23,1,0.32,1")`.
- **The owner's header menu was fixed in the reference with CustomEase.** It used to pass `ease: "cubic-bezier(0.23, 1, 0.32, 1)"`, which per the measurement above ran on `power1.out`; it now registers CustomEase and passes `CustomEase.create("site-header-menu", "0.23,1,0.32,1")`, the curve landing-page-ui documents as "Nav height | .22s `cubic-bezier(.23, 1, .32, 1)`" ([site-header-menu-motion.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/header/bar/site-header-menu-motion.ts), [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)).
- **EasePack** adds named eases such as SlowMo, RoughEase and ExpoScaleEase. **CustomWiggle** is a wiggle or shake ease (several oscillations); **CustomBounce** a bounce ease with configurable strength. Register each and use the names in tweens.

## Physics

[GreenSock, gsap-plugins] Hand-written physics for the same jobs is in [ui-animation MATH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md).

```javascript
gsap.registerPlugin(Physics2DPlugin);

gsap.to(".ball", {
  duration: 2,
  physics2D: {
    velocity: 250,
    angle: 80,
    gravity: 500
  }
});
```

```javascript
gsap.registerPlugin(PhysicsPropsPlugin);

gsap.to(".obj", {
  duration: 2,
  physicsProps: {
    x: { velocity: 100, end: 300 },
    y: { velocity: -50, acceleration: 200 }
  }
});
```

## GSDevTools

[GreenSock, gsap-plugins] A UI for scrubbing and debugging timelines. Development only; never ship it or other development-only plugins.

```javascript
gsap.registerPlugin(GSDevTools);
GSDevTools.create({ animation: tl });
```

## PixiPlugin

[GreenSock, gsap-plugins] Animates PixiJS display objects.

```javascript
gsap.registerPlugin(PixiPlugin);

const sprite = new PIXI.Sprite(texture);
gsap.to(sprite, { pixi: { x: 200, y: 100, scale: 1.5 }, duration: 1 });
```

## Prove it

- **Registration:** remove a plugin from `registerPlugin` in a production build; its tweens stop working. Put it back and they run.
- **Ease string:** in a tween at progress 0.5, `ease: "cubic-bezier(0.23, 1, 0.32, 1)"` reads 0.75 (the `power1.out` value); `CustomEase.create("site", "0.23,1,0.32,1")` reads about 0.966.
- **Flip:** after `Flip.from(state)`, items glide to their new places; with `absolute: true` the content below collapses during the flip.
- **Observer:** a wheel turn over the target fires onUp or onDown with no `type` set (wheel is in the default).
- **SplitText:** with `autoSplit` and the animation returned from `onSplit()`, resize the window mid-animation; the lines re-split and the animation continues from its progress. A screen reader reads the whole heading once.
- **No token:** the project has no `.npmrc` GreenSock entry, and `npm install gsap` resolves every plugin import.
