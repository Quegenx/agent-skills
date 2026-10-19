# ScrollTrigger

ScrollTrigger ties a tween or timeline to the scroll position: it triggers, scrubs, pins and snaps. Source: GreenSock's official gsap-scrolltrigger skill (MIT) with the gsap-frameworks skill's ScrollTrigger cleanup notes, checked against https://gsap.com/docs/v3/Plugins/ScrollTrigger/. Where the skill disagrees with the docs, the docs' form is given and the change is named. Tweens and eases are in [CORE.md](CORE.md), timelines in [TIMELINES.md](TIMELINES.md), React cleanup in [REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md), scroll cost in [PERFORMANCE.md](PERFORMANCE.md), and ScrollTo, ScrollSmoother and Observer in [PLUGINS.md](PLUGINS.md).

**Contents:** [Which library drives scroll motion](#which-library-drives-scroll-motion) · [Register and attach](#register-and-attach) · [start and end](#start-and-end) · [Config](#config) · [Scrub](#scrub) · [Pinning](#pinning) · [Snap](#snap) · [Callbacks and standalone triggers](#callbacks-and-standalone-triggers) · [Timelines: one trigger on top](#timelines-one-trigger-on-top) · [Horizontal scroll (containerAnimation)](#horizontal-scroll-containeranimation) · [batch()](#batch) · [scrollerProxy() and smooth scrollers](#scrollerproxy-and-smooth-scrollers) · [Refresh and order](#refresh-and-order) · [Cleanup](#cleanup) · [Prove it](#prove-it)

## Which library drives scroll motion

- **The GSAP skill's default.** [GreenSock, gsap-scrolltrigger] "When the user asks for scroll-based animation or parallax without specifying a library, recommend GSAP and use ScrollTrigger."
- **This repo's default stays.** ui-animation works with "React with Motion, and CSS" and makes scroll-linked motion Motion's `useScroll` + `useTransform`, or CSS `animation-timeline: view()` ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion)). The owner's landing site does its scroll reveals with Motion, not ScrollTrigger ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#scroll-reveals)). Reach for ScrollTrigger when the project already runs GSAP or needs pinning, snapping or a scrubbed timeline.
- **Reveal once or replay.** ui-animation: "content appearing as it scrolls in takes 8-16 px and 300-500 ms once, not on every pass" ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion)). The GSAP skill's examples replay (`toggleActions: "play reverse play reverse"`, and the batch example's `onLeaveBack` reset), as do the owner's reveals ("again each time it re-enters"). For once, use `once: true` or the default toggleActions.

## Register and attach

[GreenSock, gsap-scrolltrigger]

- **Register once** before any use: `gsap.registerPlugin(ScrollTrigger);`
- **Basic trigger:**

```javascript
gsap.to(".box", {
  x: 500,
  duration: 1,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",   // when top of trigger hits center of viewport
    end: "bottom center",  // when the bottom of the trigger hits the center of the viewport
    toggleActions: "play reverse play reverse" // onEnter play, onLeave reverse, onEnterBack play, onLeaveBack reverse
  }
});
```

- **Shorthand:** `scrollTrigger: ".selector"` sets only `trigger`.

## start and end

[GreenSock, gsap-scrolltrigger]

- **Format `"triggerPosition viewportPosition"`:** `"top top"`, `"center center"`, `"bottom 80%"`.
- **A number** is absolute: `500` means when the scroller (the viewport by default) has scrolled 500px from the top.
- **Relative values:** `"+=300"` (300px past start), `"+=100%"` (the scroller's height past start), `"max"` for the maximum scroll.
- **`clamp()` (v3.12+)** keeps them inside page bounds: `start: "clamp(top bottom)"`, `end: "clamp(bottom top)"`.
- **A function** returning a string or number also works; it receives the ScrollTrigger instance. Call `ScrollTrigger.refresh()` when layout changes.
- **Defaults** (verified against the docs): start `"top bottom"` (`"top top"` when `pin: true`), end `"bottom top"`. Use `endTrigger` when end belongs to another element.

## Config

[GreenSock, gsap-scrolltrigger] The full list is on https://gsap.com/docs/v3/Plugins/ScrollTrigger/.

| Property | Type | Description |
|----------|------|-------------|
| **trigger** | String \| Element | Element whose position defines where the ScrollTrigger starts. Required (or use shorthand). |
| **start** / **end** | String \| Number \| Function | See above. |
| **endTrigger** | String \| Element | Element used for **end** when different from trigger. |
| **scrub** | Boolean \| Number | `true` = direct; number = seconds for the playhead to "catch up". |
| **toggleActions** | String | Four actions in order: **onEnter**, **onLeave**, **onEnterBack**, **onLeaveBack**. Each: `"play"`, `"pause"`, `"resume"`, `"reset"`, `"restart"`, `"complete"`, `"reverse"`, `"none"`. Default `"play none none none"`. |
| **pin** | Boolean \| String \| Element | Pin an element while active. `true` = pin the trigger. |
| **pinSpacing** | Boolean \| String | Default `true`. `false` or `"margin"`. |
| **horizontal** | Boolean | `true` for horizontal scrolling. |
| **scroller** | String \| Element | Scroll container (default: viewport). |
| **markers** | Boolean \| Object | `true` for dev markers; or `{ startColor, endColor, fontSize, ... }`. Remove in production. |
| **once** | Boolean | If `true`, kills the ScrollTrigger after end is reached once (the animation keeps running). |
| **id** | String | Unique id for **ScrollTrigger.getById(id)**. |
| **refreshPriority** | Number | Higher refreshes first; see [Refresh and order](#refresh-and-order). |
| **toggleClass** | String \| Object | Add/remove a class when active. String = on trigger; or `{ targets: ".x", className: "active" }`. |
| **snap** | Number \| Array \| Function \| "labels" \| Object | See [Snap](#snap). |
| **containerAnimation** | Tween \| Timeline | For fake horizontal scroll; see below. |

- **`once: true`** also forces toggleActions to `"play none none none"` (docs).
- **Scrub or toggleActions, not both.** [GreenSock, gsap-scrolltrigger] Use scrub for scroll-linked progress or toggleActions for discrete play and reverse. The skill adds "If both exist, scrub wins"; the docs page has no note on combining them, so that part is unverified.

## Scrub

[GreenSock, gsap-scrolltrigger]

```javascript
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",
    end: "bottom center",
    scrub: true        // or number (smoothness delay in seconds), so 0.5 means it'd take 0.5 seconds to "catch up" to the current scroll position.
  }
});
```

- **`scrub: true`** links progress directly to the scrollbar; a number (e.g. `scrub: 1`) gives smooth lag. This is the GSAP route beside Motion's `useScroll` and CSS `animation-timeline: view()` in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion).
- **A numeric scrub is only catch-up time.** The docs call it "The amount of time (in seconds) that the playhead should take to 'catch up'"; nothing there says it reduces work during scroll (see [PERFORMANCE.md](PERFORMANCE.md)).

## Pinning

[GreenSock, gsap-scrolltrigger]

```javascript
scrollTrigger: {
  trigger: ".section",
  start: "top top",
  end: "+=1000",   // pin for 1000px scroll
  pin: true,
  scrub: 1
}
```

- **Animate the pinned element's children, never the pinned element.** Docs: animating it "will throw off the measurements".
- **pinSpacing** defaults to `true`: padding is added "to push other elements down so that when the pinned element gets unpinned, the following content catches up perfectly". `false` adds none; `"margin"` uses margin. Docs: "if the container is `display: flex`, `pinSpacing` is set to `false` by default".
- **A transform or `will-change` on an ancestor breaks pinning.** Docs: it "breaks `position: fixed` behavior (it's a browser thing, not ScrollTrigger)"; avoid them, or set `pinReparent: true` ("reparenting can be expensive"). And: "if you set the CSS property `will-change: transform`, browsers treat it just like having a transform applied". https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **Nested pinning is not supported** (docs). A trigger inside an element pinned by another ScrollTrigger takes `pinnedContainer`.

## Snap

[GreenSock, gsap-scrolltrigger]

- **Values:** a number (increments, e.g. `0.25`), an array of progress values, `"labels"` (timeline labels), a function, or an object `{ snapTo: 0.25, duration: 0.3, delay: 0.1, ease: "power1.inOut" }`.
- **Docs add:** the ease defaults to `"power3"`; delay defaults to half the scrub amount (0.1 if scrub isn't a number); snapping is directional by default since 3.8.0; there is `inertia: false`, plus onStart, onInterrupt and onComplete. https://gsap.com/docs/v3/Plugins/ScrollTrigger/

## Callbacks and standalone triggers

[GreenSock, gsap-scrolltrigger]

- **onEnter, onLeave, onEnterBack, onLeaveBack** fire when crossing start or end and receive the instance (`progress`, `direction`, `isActive`, `getVelocity()`).
- **onUpdate** fires when progress changes; **onToggle** when active flips; **onRefresh** after a recalculation; **onScrubComplete** when a numeric scrub finishes.
- **No animation:** `ScrollTrigger.create()` takes the same config; drive custom UI from callbacks:

```javascript
ScrollTrigger.create({
  trigger: "#id",
  start: "top top",
  end: "bottom 50%+=100px",
  onUpdate: (self) => console.log(self.progress.toFixed(3), self.direction)
});
```

## Timelines: one trigger on top

[GreenSock, gsap-scrolltrigger]

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "+=2000",
    scrub: 1,
    pin: true
  }
});
tl.to(".a", { x: 100 }).to(".b", { y: 50 }).to(".c", { opacity: 0 });
```

- **Put the ScrollTrigger on the timeline or a top-level tween.** Wrong: `gsap.timeline().to(".a", { scrollTrigger: {...} })`. Correct: `gsap.timeline({ scrollTrigger: {...} }).to(".a", { x: 100 })`.
- **The skill says "ScrollTriggers should only exist on top-level animations"; the docs don't forbid nesting.** Docs FAQ: nested ScrollTriggers in child tweens are technically possible "but it usually doesn't make sense", because a ScrollTrigger takes control of its animation's playhead; "It's typically best to either have one ScrollTrigger control the entire timeline or use independent tween, each with their own ScrollTrigger." https://gsap.com/docs/v3/Plugins/ScrollTrigger/

## Horizontal scroll (containerAnimation)

[GreenSock, gsap-scrolltrigger] Pin a section and, as the user scrolls vertically, move content inside it horizontally ("fake" horizontal scroll). Animate `x` or `xPercent` of a wrapper *inside* the pinned trigger, and give nested triggers `containerAnimation` so they watch that horizontal movement.

- **The horizontal tween must use `ease: "none"`.** Otherwise scroll position and horizontal position don't line up, "a very common mistake".
- **Caveats** (verbatim in the docs): pinning and snapping aren't available on containerAnimation-based ScrollTriggers; avoid animating the `trigger` element horizontally, or offset start and end by how far it moves.
- **The skill's code sample is broken; don't copy it.** It calls `Max.max` (a ReferenceError), gives `xPercent` a pixel value, computes `Math.max(0, window.innerWidth - el.offsetWidth)` (0 whenever the content is wider than the viewport, so nothing moves), has no `scrub` though its own steps say `pin: true, scrub: true`, and triggers on the moving element though its prose says the panel. The official sample from the GSAP 3.8 release notes (https://gsap.com/blog/3-8/), where `sections` is the array of panels:

```js
// keep a reference of the horizontal 'fake scrolling' animation so we can pass it around
let scrollTween = gsap.to('.container', {
	xPercent: -100 * (sections.length - 1),
	ease: 'none', // <-- IMPORTANT!
	scrollTrigger: {
		trigger: '.container',
		start: 'top top',
		end: '+=3000',
		pin: true,
		scrub: 0.5
	}
});

// now let's create an animation that triggers based on the horizontal fake-scroll:
gsap.to('.box', {
	y: -100,
	scrollTrigger: {
		trigger: '.box',
		start: 'left center',
		containerAnimation: scrollTween // <-- NEW!!
	}
});
```

## batch()

[GreenSock, gsap-scrolltrigger] Verified against https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch()/.

- **`ScrollTrigger.batch(triggers, vars)`** creates one ScrollTrigger per target and batches their callbacks within a short interval, so everything that entered at about the same time animates in one staggered go. "Good alternative to IntersectionObserver." Returns an Array of ScrollTrigger instances.
- **triggers:** selector text or an Array of elements. **vars:** standard config (start, end, once, callbacks). Don't pass `trigger` or animation options: `animation`, `invalidateOnRefresh`, `onSnapComplete`, `onScrubComplete`, `scrub`, `snap`, `toggleActions`.
- **Batched callbacks receive two arguments:** the Array of targets that fired within the interval, and the Array of their ScrollTrigger instances.
- **interval** (seconds) defaults to roughly one requestAnimationFrame; the batch is delivered when it elapses or when **batchMax** is reached. batchMax can be a function, re-run on refresh, for responsive layouts.

```javascript
ScrollTrigger.batch(".card", {
  interval: 0.1,
  batchMax: 4,
  onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, overwrite: true }),
  onLeaveBack: (batch) => gsap.set(batch, { opacity: 0, y: 50, overwrite: true })
});
```

## scrollerProxy() and smooth scrollers

[GreenSock, gsap-scrolltrigger]

- **`ScrollTrigger.scrollerProxy(scroller, vars)`** replaces how ScrollTrigger reads and writes a scroller's position, for a third-party smooth-scroll library. `scrollTop` and/or `scrollLeft` (at least one) act as setter with an argument and getter without one. Optional: `getBoundingClientRect`, `scrollWidth` / `scrollHeight`, `fixedMarkers: true` (when the scroller is translated and markers drift), and `pinType`: `"fixed"` if pins jitter (scroll on another thread), `"transform"` if pins don't stick.
- **Critical: notify ScrollTrigger on every scroll** with `ScrollTrigger.update`, or its calculations go stale.

```javascript
// Example: proxy body scroll to a third-party scroll instance
ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (arguments.length) scrollbar.scrollTop = value;
    return scrollbar.scrollTop;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  }
});
scrollbar.addListener(ScrollTrigger.update);
```

- **ScrollSmoother needs no proxy** ([PLUGINS.md](PLUGINS.md#scrollsmoother)).
- **Lenis, both ways.** The owner's site runs a smooth-scroll library at the root and no ScrollTrigger ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#smooth-scrolling)); its reference code mounts `ReactLenis` with `{ anchors: true, autoRaf: true, respectReducedMotion: true }`. Keep that. The GSAP skill's route for any third-party scroller is the proxy plus `ScrollTrigger.update` on its scroll, or ScrollSmoother instead. If ScrollTrigger is ever added beside Lenis, drive it from Lenis's scroll updates; the Lenis side of that wiring was not checked against Lenis's docs here.

## Refresh and order

- **Resize is automatic.** Docs: ScrollTrigger "waits until there's a 200ms gap in resize events" and refreshes. [GreenSock, gsap-scrolltrigger]
- **Call `ScrollTrigger.refresh()` yourself** after DOM, image, font or async-content changes that move trigger positions; in a component framework that means after the DOM updates (the framework's next tick, or after async content loads). [GreenSock, gsap-frameworks] The owner's smooth-scroll rule names the same moment: "After content changes height ... tell the library to resize" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#smooth-scrolling)); with ScrollTrigger, refresh there too.
- **Create triggers in page order** (top to bottom, or left to right), so a pin's added distance reaches the triggers below it.
- **refreshPriority: higher refreshes first.** The skill says the reverse in three places ("Lower = refreshed first ... first on page = lower number"). Docs: "A ScrollTrigger with `refreshPriority: 1` will get refreshed earlier than one with `refreshPriority: 0` (the default). You're welcome to use negative numbers too". So when triggers are created out of order, give the one highest on the page the highest number. The docs also say "it's VERY unlikely that you'd need to define a `refreshPriority` as long as you create your ScrollTriggers in the order they'd happen on the page". https://gsap.com/docs/v3/Plugins/ScrollTrigger/

## Cleanup

[GreenSock, gsap-scrolltrigger]

- **Kill triggers when their elements go away** (page changes in an SPA):

```javascript
ScrollTrigger.getAll().forEach(t => t.kill());
// or kill by the id assigned to the ScrollTrigger in its config object like {id: "my-id", ...}
ScrollTrigger.getById("my-id")?.kill();
```

- **ScrollTriggers made inside a `gsap.context()` are reverted with it** [GreenSock, gsap-frameworks]; in React use `useGSAP()` or a context reverted in the effect cleanup ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md)).
- **`markers: true` is for development only;** remove it before shipping.

## Prove it

- **Order:** create a pinned trigger after one further down the page; with markers on, the lower one's start sits too high. Create them in page order, or give the upper one the higher `refreshPriority`, and it lines up.
- **Horizontal:** with the 3.8 sample, scrolling the pinned section moves `.container` left across every panel, and `.box` animates when it reaches the viewport's center horizontally. Change the ease to `"power1.out"` and the nested trigger fires at the wrong place.
- **Pin:** add `will-change: transform` to an ancestor of a pinned element; the pin shifts with the scroll. Remove it and the pin holds.
- **Refresh:** load content above a trigger after setup; its markers are stale until `ScrollTrigger.refresh()` runs.
- **Cleanup:** after an SPA route change, `ScrollTrigger.getAll().length` is 0 for the old page.
