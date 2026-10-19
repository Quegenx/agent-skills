# Performance: smooth on a slow phone

At 60 Hz a frame is 16.7 ms and the browser keeps part of it: budget about 10 ms of your work per frame, less on 120 Hz screens, where the whole frame is 8.33 ms. "A layout recalculation on a complex page can take over 100ms. That isn't one missed frame, it's a dozen" [Emil Kowalski, animation-performance].

**Contents:** [Move only what the compositor can move](#move-only-what-the-compositor-can-move) · [What each property costs](#what-each-property-costs) · [Where it runs](#where-it-runs) · [Traps that use transform and still drop frames](#traps-that-use-transform-and-still-drop-frames) · [will-change](#will-change) · [React](#react-animate-without-re-rendering) · [Canvas and WebGL effects](#canvas-and-webgl-effects) · [Reduced motion](#reduced-motion) · [Bundle](#bundle) · [Measuring](#measuring)

## Move only what the compositor can move

- **`transform` and `opacity` (and usually `filter`) animate without layout or paint.** Animating `width`, `height`, `top`, `left`, `margin`, `padding` or `font-size` recalculates layout every frame, often for everything after the element. Move with `translate`, resize with `scale` (counter-scale content that must not stretch, or let Motion's `layout` do it), reveal with `clip-path` or `opacity` (a clip skips layout, but compositing it is browser-dependent: [below](#what-each-property-costs)). One measured case dropped half its frames animating `top`/`left` and about 1% with transforms.
  - **Layout properties, both ways:** Argyle animates layout on purpose in small components: a radio group's `grid-template-columns` on a `linear()` easing ([nerdy.dev: A Squishy Radio Group](https://nerdy.dev/a-squishy-radio-group), 2024-01-11), a `<details>` panel's `block-size` to `auto`, and a dialog's `width`, `height`, `left` and `top` grown from its trigger ([NATIVE-CSS.md](NATIVE-CSS.md)). The posts say nothing about cost; the line above measured it.
- **Compositor animations survive a busy main thread.** CSS transitions and animations and the Web Animations API on transform and opacity keep running during a long task; JavaScript that writes styles every frame stutters the moment the page does other work. The same holds for a gesture: a sheet whose swipe is native scrolling tracks it "off the main thread at the native display refresh rate without any JavaScript touch handling" (React Aria, [SHEETS.md](SHEETS.md)). Motion (14.2 and later) runs independent transforms (x, y, scale and rotate animated separately, started at different times or with springs) hardware accelerated through `animate` and `motion` components.
- **Independent transforms:** the CSS `translate`, `rotate` and `scale` properties animate separately from each other but not per axis; animating x and y on different timings in plain CSS needs composite animations, which compose in start order. A library that keeps each value separate avoids that. Individual transforms save remembering the order of transform functions, and "skew is not an independent transform value" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate)).
- **Keep the transform function list identical across keyframes** (`translate(...) rotate(...) scale(...)` everywhere). When the lists differ, the browser interpolates through matrices, and a turned card swings along an unexpected path.
- **A filter is cheap to move; regenerate its map only when the shape changes:** a glass lens slider shifts only the filter's region as it moves and keeps its displacement map, "so the motion holds a steady frame rate even on a phone. The map is regenerated only when the glass changes shape, never when it simply changes place." The filter itself is in [the `svg` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/SKILL.md).
- **`will-change`** has its own section: [below](#will-change).
- **Never `transition: all`:** "`all` animates whatever changes next, including layout properties nobody intended to animate" [Emil Kowalski, animation-performance]. Name the properties.

## What each property costs

The browser runs up to three steps per visual change: layout, paint, composite [Emil Kowalski, animation-performance]:

| Tier | Properties | Cost |
| --- | --- | --- |
| Composite only | `transform`, `opacity` | Cheapest. Browsers promote these to their own layer. |
| Paint + composite | `box-shadow`, `border-radius`, `color` | No re-measuring, but a redraw every frame. |
| Layout + paint + composite | `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width` | Most expensive. One growing element can move everything around it. |

- **The skill also puts `filter`, `clip-path` and `background-color` in the first tier** "in current Chrome/Firefox". motion.dev: "Other values like filter, background-color, clip-path and SVGs either have support or are gaining it in most browsers", and "Chrome is adding support for `background-color` and `clip-path` soon" ([motion.dev](https://motion.dev/docs/performance)). Only `transform` and `opacity` are reliable; test the rest.
- **Swap down a tier:** `width`/`height`/`padding` to `scale()`; `top`/`left`/`margin` to `translate()`; `display`/`visibility` swaps to `opacity`; `box-shadow` to `filter: drop-shadow(…)`: "An animated shadow looks harmless but repaints the element every frame" [Emil Kowalski, animation-performance].
  - `drop-shadow()` is not a like-for-like swap: it follows the element's alpha shape, not its box, and "the `inset` keyword and `spread` parameters are not allowed" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow)). An inset ring or a spread shadow stays a `box-shadow`. app-ui animates shadows on its controls (`--transition-control`, [app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens)).
- **Pick the one with no downside:** a `padding` animation on an absolutely positioned element with few children may cost nothing visible, "But a `padding` animation and a `scale()` animation look the same, and only one of them can't regress on a slower device" [Emil Kowalski, animation-performance].
- **Layout moves the wrong things:** "Animating a sidebar's `margin-left` pushes the content beside it on every frame; `translateX` doesn't. For a dashboard next to an opening sidebar, that's the whole page re-laid-out 60 times a second" [Emil Kowalski, animation-performance].
- **A rounded fill bar slides, it doesn't scale:** "The fill is a full-width pill slid in with `translateX`, never scaled: `scaleX` would squash its rounded end. The track clips it, so the leading edge is always a perfect half-circle" [fluid-functionalism].
- **Blur under 20px:** "`filter: blur()` gets expensive fast, especially in Safari. Keep animated blur under 20px; 2-5px is enough to soften a crossfade" [Emil Kowalski, animation-performance].
- **Live SVG noise repaints with the element:** "`feTurbulence` is generated per pixel and re-rendered whenever the element repaints"; across a full-screen hero that scrolls or animates "it can drop a page to a handful of frames per second on a phone". Use the live filter on small surfaces and a tiled image (a 200px data-URI tile) "anywhere the overlay is large or the page is expected to move" [Craft]. The grain recipe is in [the `modern-css` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SKILL.md).

## Where it runs

- **The driver decides the thread:** a `requestAnimationFrame` loop always runs on the main thread; the Web Animations API (`element.animate()`, Motion's `animate()`) and CSS transitions and keyframes "Can be hardware-accelerated". "'JS' and 'main thread' aren't synonyms: a JS library that hands off to WAAPI can be accelerated, a rAF loop can't" [Emil Kowalski, animation-performance].
  - GSAP updates on its ticker, on each "`requestAnimationFrame` event" ([gsap.com](https://gsap.com/docs/v3/GSAP/gsap.ticker)), so it is main-thread animation; its own rules are in [the `gsap` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/gsap/PERFORMANCE.md).
  - The skill also puts `motion/react` components on the main thread and says Motion's `x`/`y`/`scale` shorthands aren't accelerated; motion.dev says the opposite: "Independent transforms and `transform` are both hardware accelerated" ([motion.dev](https://motion.dev/docs/react-animation)). The Motion 14.2 line [above](#move-only-what-the-compositor-can-move) stands.
- **Watch motion that plays during heavy work:** page transitions, a tab indicator during navigation, anything beside fetching or hydration. "Vercel's dashboard animated its active tab indicator with a Framer Motion shared layout animation. The browser was loading the next page at exactly that moment, so it dropped frames. Moving it to a CSS animation fixed it" [Emil Kowalski, animation-performance].
- **The working split:** "CSS for simple motion and anything that plays while the page is busy; Framer Motion for complex, interruptible, gesture-driven motion" [Emil Kowalski, animation-performance].
- **Percentages are correct before they are fast:** Chrome "until very recently" didn't accelerate a percentage-based transform ([motion.dev](https://motion.dev/docs/performance)), but that is no reason to drop `translateY(100%)`: "Percentages are the right call for elements of unknown size … and correctness beats a best-effort optimization" [Emil Kowalski, animation-performance].

## Traps that use transform and still drop frames

- **A CSS variable on the parent:** "Vaul's drag got laggy once a drawer held more than ~20 items, with no re-renders involved. The drag distance was written to a CSS variable that `translateY()` read" [Emil Kowalski, animation-performance]:

```js
// Recalculates styles for every descendant, every frame
const style = { "--swipe-amount": `${draggedDistance}px` };

// Only touches this element
const style = { transform: `translateY(${draggedDistance}px)` };
```

  "CSS variables inherit, so changing one on a parent triggers style recalculation for every child. The more content, the slower each frame. Suspect this whenever a `transform` animation degrades as content grows." motion.dev adds the compositing side: "Animating a CSS variable isn't hardware accelerated, even when the variable is applied to `transform`" ([motion.dev](https://motion.dev/docs/performance)). app-ui's sliding highlight is placed by "CSS variables set by script" on the highlight itself, which has no content children ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#one-sliding-hover-highlight)).
- **Tailwind v4 changed what the transform utilities write:** `scale-*`, `rotate-*` and `translate-*` now set the individual `scale`, `rotate` and `translate` properties, so `transition-[opacity,transform]` no longer animates them ([tailwindcss.com](https://tailwindcss.com/docs/upgrade-guide)). "In Tailwind 4, `transition-transform` covers `transform, translate, scale, rotate`, and in Tailwind 3 only `transform`… Mixing transform and other properties takes the bracket syntax, as in `transition-[scale,opacity,filter]`" [Jakub Krehel, better-ui].
  - Bare `transition` is a list, not `all`: in v4 it covers colours, `opacity`, `box-shadow`, the transforms, `filter` and `backdrop-filter` among others, at 150ms on `cubic-bezier(0.4, 0, 0.2, 1)` ([tailwindcss.com](https://tailwindcss.com/docs/transition-property)).

## will-change

- **Only for a measured problem,** on elements about to animate, removed afterwards; every promoted layer costs memory, and promoting everything makes scrolling worse. MDN: "Use the `will-change` property as a last resort to try to deal with existing performance problems. Don't use it to anticipate performance problems", and it recommends switching it on and off from script rather than leaving it in a stylesheet ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)). Argyle's custom select sets `will-change: scale` as a compositor hint that "also fixes text shift bug" ([nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03).
- **The 1px shift it fixes:** "A browser can hand an animation from the CPU to the GPU mid-flight, and that hand-off can make the element shift by a pixel at the start or end." Add it "only once you see the shift or measured dropped frames"; "Put it on the element that animates, never on `*` or large containers"; for a large blurred or filtered element, "Promote it and keep the layer small" [Emil Kowalski, animation-performance].
- **Name the property, never `all`;** it is worth it for transforms, `opacity` and `filter`, "Rarely" for `clip-path` [Jakub Krehel, better-ui].
- **Side effects:** a `will-change` value that would create a stacking context or a containing block for fixed-position descendants creates them now ([W3C](https://www.w3.org/TR/css-will-change-1/)): "a fixed modal or tooltip inside it stops tracking the viewport" [Jakub Krehel, better-ui].

## React: animate without re-rendering

- A value that changes every frame lives in a motion value (`useMotionValue`, `useTransform`, `useSpring`, `useScroll`) or a ref that writes the style, never in state: state re-renders the component tree on every frame. The same goes for text: Liveline's value overlay "updates at 60fps through direct DOM manipulation, not React re-renders".
- Don't animate by toggling classes in a loop or reading layout (`getBoundingClientRect`, `offsetHeight`) inside an animation frame after writing styles: a read after a write forces layout. Read everything first, then write. That is layout thrashing: inside a loop, "layout runs dozens of times in a single frame" (kciter):

```js
// Reads and writes interleaved: forces a layout recalculation every iteration
for (const el of elements) {
  const width = el.offsetWidth; // read (needs layout)
  el.style.width = width + 10 + 'px'; // write (invalidates layout)
}

// Finish all the reads, then do the writes together
const widths = elements.map((el) => el.offsetWidth); // gather reads
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px'; // gather writes
});
```

- Look for state updates inside `requestAnimationFrame`, `pointermove`, `scroll` or drag handlers [Emil Kowalski, animation-performance].
- **Values that must agree come from the same frame:** drive two elements from progress values through `useTransform`, so both render from one frame; "A change listener in their place lagged by a frame and cut 24px off the banner" [fluid-functionalism].
- Hundreds of animated items: animate a container, or only the visible ones; virtualize the rest.
- **Dragging many items:** don't render an update every time the move event fires, and render only what changed (one developer's account of dragging 100,000 transformed rectangles; no numbers).

## Canvas and WebGL effects

Always-on effects drawn every frame (orbs, border beams, voice glows, avatars, metal and image effects), from the seven free Libraries.dev packages [Libraries.dev]. The general rules (one module-level loop, a 30fps cap for slow drift, pausing offscreen and in hidden tabs, a pixel-ratio cap chosen by shader cost, one context per page) are flornkm's, checked against MDN and Khronos, in [webgl WIDGETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/WIDGETS.md#frame-loop); building the widget itself is in [the `webgl` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/SKILL.md). What the packages do:

- **One loop for every instance:** pulse beams, voice glows, avatars and metal effects run one shared `requestAnimationFrame` loop for the page, and thinking orbs "share one clock, so they resume in phase". Physics bodies share one loop too ([PHYSICS.md](PHYSICS.md)).
- **Frame caps by effect:** pulse beams "near 30 fps", voice glow "about 60 fps" ("On a device that cannot hold 60 it drops to every other frame and probes full rate again every 4 s"), metal "composites at about 15 fps", image generation "capped at 10 fps".
- **Pause offscreen:** `IntersectionObserver` margins of 256 px (beams, voice) and 64 px (metal, image generation); an offscreen voice instance "unregisters from the loop and releases its analyser".
- **Done means no frames:** "inactive beams render no layers", `paused` "stops the loop entirely (no per-frame cost)", and with no active image card "the animation loop stops completely". The common mistake: "Leaving an orb mounted and animating after the work finishes. Unmount it or set `paused` when the step completes."
- **Pixel ratio:** orbs, avatars and the visible image canvas cap it at 2, the image shader's GL canvas at 1.25, and the voice glow's soft layers "render at half resolution and are scaled up". flornkm's rule against copying a cap from another project is in [webgl WIDGETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/WIDGETS.md#resolution-and-dpr).
- **One WebGL context:** the image effect keeps "One shared `THREE.WebGLRenderer` and one WebGL context for the whole page. Each card copies its frame into its own 2D canvas", and on context loss "the loop stops and resumes on restore"; metal runs on "One shared WebGL2 context".

## Reduced motion

- Respect `prefers-reduced-motion: reduce`: slides, zooms, parallax and large movements become 100-150 ms opacity cross-fades; colour and state changes stay; nothing becomes unreachable or invisible.
- In Motion, wrap the app in `<MotionConfig reducedMotion="user">`, which turns off transform and layout animations while keeping opacity and colour. The default is `"never"`, so the user's setting is ignored until you set it.
  - **Blur still runs there:** "Blur still runs there, so branch on `useReducedMotion()` where a recipe animates `filter`" [Jakub Krehel, better-ui]. motion.dev confirms other values keep animating, "opacity and background color" for example ([motion.dev](https://motion.dev/docs/react-motion-config)).
  - **Per value:** `const shouldReduceMotion = useReducedMotion(); const closedX = shouldReduceMotion ? 0 : "-100%";` ([motion.dev](https://motion.dev/docs/react-use-reduced-motion)).
  - **`MotionConfig` doesn't reach CSS:** a CSS `transition-[left,bottom]` is off the compositor and invisible to `MotionConfig`; gate such a property on `useReducedMotion()` and keep the fade [fluid-functionalism].
- In CSS: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms; transition-duration: 150ms; } }` is a blunt fallback; better, write the reduced version of each animation deliberately.
  - **Opt in instead of opting out:** Argyle puts transitions, animations and `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion user gets the end states with no movement at all ([nerdy.dev: Nintendo Switch Homescreen](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13; [Using @starting-style and transition-behavior](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20). The line above keeps a short fade instead; rule 8 in [SKILL.md](SKILL.md) says reduce, don't remove.
- **What to switch, what to keep:** turn off parallax and autoplay, start carousels paused, make smooth scrolling jump; keep spinners, hover colour, the focus ring and press feedback [Jakub Krehel, better-accessibility].
- Autoplaying motion that lasts more than five seconds (carousels, background video, looping animations) needs a pause control. A loop with no place for one, such as an animated tab icon, stops when the loading state ends, when the user reads the notification, or when the tab loses focus: "Even a subtle pulse drains battery on mobile."

## Bundle

Motion's `LazyMotion` with `domAnimation` and the `m` component starts at about 4.6 kB instead of the full `motion` component; load `domMax` (drag, layout) only where it's used. Heavy effects (3D galleries, Lottie, WebGL) load with a dynamic `import()` on the screen that needs them.

## Measuring

The Performance panel with 4x CPU slowdown: record the interaction and look at the animation frames for long tasks, Layout and Paint entries. The Rendering tab's "Paint flashing" and "Layer borders" show what repaints and what got its own layer. Interaction responsiveness is INP: an animation that starts late because a click handler did heavy work first is an INP problem, not an animation one; respond visually first, then do the work. INP and TBT are "essentially ways of expressing how long the main thread was blocked" (kciter).

- **A slow CPU is not a weak GPU:** profile on a real mid-range phone over remote debugging; "CPU throttling on a desktop models a slow CPU, not a weak GPU or a small memory budget". Use the Animations panel to slow the motion down, and mark each finding verified from code or needing a device recording [Emil Kowalski, animation-performance].
- **Headless Chromium ticks at 60 Hz by default,** so a lab rig is capped at 60 fps. Deterministic 120 Hz frame stepping in headless Chrome via DevTools begin-frame control gives exactly 240 frames for 240 begin-frames at 8.33 ms, so "did this frame fit the 120 Hz budget" becomes an exact read rather than a noisy one. Add a frame-rate readout computed in the page from animation-frame timestamps, step through the slow interaction frame by frame timing each one, and run the rig as a nightly job to catch regressions.
- **Price an effect in frame budget:** a word-by-word fade on streamed text costs a fifth of the frame budget; whether that is worth it is a taste call for a human, with before-and-after recordings.
- **Count style recalculations:** a single `:root:has()` selector added 24 ms to every DOM change. MDN warns the same way: avoid anchoring `:has()` on `body`, `:root` or `*`, and keep the inner selector tightly constrained ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)). Argyle's conditional snapping anchors `:has()` on `html`, that shape ([modern-css CASCADE-AND-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CASCADE-AND-SCOPE.md#has-and-selectors)); count recalculations before shipping it.
- **Sweep for CPU hitches** beyond the animation itself: highlighting a finished code block froze one page for about a second (the cause is in [the `agent-chat-ui` skill's STREAMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/STREAMING.md)).

## Prove it

Record each animation at 4x CPU slowdown and on a real mid-range phone: the animation frames show no Layout entries, and Paint only where the tier table expects it. Grow the content a drag moves past about 20 items: the drag stays as smooth (no inherited-variable trap). Run the animation while a route loads: it holds its frame rate. Toggle reduced motion: no transform, layout or blur animation remains, fades and press feedback do. With fifty ambient canvas or WebGL instances on the page, scrolling holds 60fps and a hidden tab's CPU sits near zero [flornkm, webgl-components].
