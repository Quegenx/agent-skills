# Performance: what GSAP should animate, quickTo, ScrollTrigger cost, cleanup

GreenSock's performance rules for GSAP: what to animate, how many tweens to create, and ScrollTrigger [GreenSock, gsap-performance]. The frame budget, the measuring method and the general property rules are in [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md); this file is the GSAP side of them.

## Prefer transform and opacity

[GreenSock, gsap-performance]

- Prefer **x**, **y**, **scale**, **rotation**, **opacity**. GSAP's `x` and `y` are translates by default; use them instead of `left` and `top` for movement.
- Avoid when possible **width**, **height**, **top**, **left**, **margin**, **padding**: they trigger layout and can cause jank. ui-animation's rule 7 says the same ("Only transform and opacity move", [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)).

**Compositor or main thread, both ways.** GreenSock: animating transform and opacity "keeps work on the compositor and avoids layout and most paint" [GreenSock, gsap-performance]. Motion's docs, quoted in the svg skill: through GSAP or plain JS, transform and opacity are "animated on the main thread" ([svg JS-AND-REACT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/JS-AND-REACT.md), [svg CSS-ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CSS-ANIMATION.md)). Both can be true (gsap-a findings, an interpretation): GSAP computes and writes each frame's value on the main thread, then the browser composites it, avoiding layout and most paint. ui-animation adds that "JavaScript that writes styles every frame stutters the moment the page does other work", while CSS and the Web Animations API on transform and opacity keep running ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#move-only-what-the-compositor-can-move)).

landing-page-ui animates the nav's `height` on purpose: "**The menu grows out of the bar:** closed, the nav is the bar's height (68px, 60px under 40rem) with `overflow: hidden`" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)). That is the owner's design against the rule above; it stays.

## will-change and force3D

- GreenSock: "Use **will-change** in CSS on elements that will animate. It hints the browser to promote the layer", and, under Do Not, never set **will-change** or **force3D** on every element "just in case" [GreenSock, gsap-performance].
- ui-animation: "**Only for a measured problem,** on elements about to animate, removed afterwards; every promoted layer costs memory" ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#will-change)). Keep ui-animation's rule.
- **Never on an ancestor of a pinned element:** it breaks ScrollTrigger pinning, which gsap-performance leaves out; the docs' wording is in [SCROLLTRIGGER.md](SCROLLTRIGGER.md#pinning).
- `force3D` defaults to `"auto"`: translate3d() while animating, and GSAP "will automatically switch back to 2D when the tween is done (if 3D isn't necessary) to free up more GPU memory" (https://gsap.com/docs/v3/GSAP/CorePlugins/CSS).

## Batch reads and writes

[GreenSock, gsap-performance] GSAP batches its own updates. When mixing it with direct DOM reads and writes or layout-dependent code, don't interleave reads and writes: do all reads first, then all writes (or let GSAP do the writes in one go). The layout-thrashing example is in [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#react-animate-without-re-rendering).

## Many elements

[GreenSock, gsap-performance]

- Use **stagger** instead of many separate tweens with manual delays when the animation is the same; it's more efficient.
- For long lists, virtualize or animate only the visible items; don't create hundreds of simultaneous tweens if it causes jank. Long lists in general are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#long-lists).
- **Reuse timelines;** never create a new timeline every frame.
- Don't create hundreds of overlapping tweens or ScrollTriggers without testing on low-end devices.

## Frequently updated values: gsap.quickTo()

[GreenSock, gsap-performance]

For a property updated often (a mouse follower's x and y), **gsap.quickTo()** reuses one tween instead of creating a new one on each update. It is the GSAP form of ui-animation's "A value that changes every frame lives in a motion value ... or a ref that writes the style, never in state" ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#react-animate-without-re-rendering)).

```javascript
let xTo = gsap.quickTo("#id", "x", { duration: 0.4, ease: "power3" }),
    yTo = gsap.quickTo("#id", "y", { duration: 0.4, ease: "power3" });

document.querySelector("#container").addEventListener("mousemove", (e) => {
  xTo(e.pageX);
  yTo(e.pageY);
});
```

## ScrollTrigger cost

The skill's three ScrollTrigger tips overstate the docs (checked against https://gsap.com/docs/v3/Plugins/ScrollTrigger/, gsap-a findings):

- **Pin only what's needed.** The skill says "pin: true promotes the pinned element"; the docs say only that pinning uses `position: fixed` because it "seemed to deliver better performance overall".
- **scrub.** The skill says a small numeric scrub "can reduce work during scroll"; in the docs a numeric scrub is only "The amount of time (in seconds) that the playhead should take to 'catch up'".
- **Don't call ScrollTrigger.refresh() on resize.** The skill says refresh "not on every resize; debounce"; ScrollTrigger already listens for resize and "waits until there's a 200ms gap in resize events". Call refresh yourself only for layout changes that are not resizes (content, images, fonts loading). Refresh order and the rest are in [SCROLLTRIGGER.md](SCROLLTRIGGER.md).

## Reduce simultaneous work

[GreenSock, gsap-performance]

- Pause or kill off-screen or inactive animations (when the user navigates away).
- Don't animate huge numbers of properties on many elements at once; simplify or sequence.
- Clean up: stray tweens and ScrollTriggers keep running and hurt performance and correctness ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md#kill-or-revert)).

## Prove it

Record the animation at 4x CPU slowdown, as ui-animation's Prove it says ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)): no layout in the animation frames unless the design animates a layout property on purpose, and no dropped frames. Then:

- Move the pointer across a quickTo follower for ten seconds: the tween count stays constant (no new tween per event).
- Test the busiest page with every tween and ScrollTrigger running on a low-end device.
- No `will-change` sits on an ancestor of a pinned element, and none is set on every element.
- No code calls `ScrollTrigger.refresh()` from a resize handler.
- After navigating away, no tween or ScrollTrigger from the old page is still running.
