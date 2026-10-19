---
name: gsap
description: "Writes and reviews GSAP animation the way GreenSock's official skills and docs prescribe, with their errors corrected: tweens, vars, transform aliases, eases and CustomEase, stagger, defaults, gsap.matchMedia() for breakpoints and reduced motion, timelines and the position parameter, gsap.utils, useGSAP, gsap.context() and cleanup in React and other frameworks, SSR, performance and quickTo, ScrollTrigger, plugins (Flip, Draggable, Observer, SplitText, ScrollTo, ScrollSmoother) and the SVG plugins (DrawSVG, MorphSVG, MotionPath). Use when writing, reviewing or debugging GSAP code, choosing between GSAP, Motion and CSS, or building scroll-driven or timeline-sequenced animation with GSAP."
---

# GSAP

GSAP is one call shape, `gsap.to(targets, vars)`, that returns an instance you control, plus timelines that put many of those on one playhead, and plugins registered once for everything else. This skill is built from GreenSock's official agent skills (greensock/gsap-skills, MIT: gsap-core, gsap-timeline, gsap-utils, gsap-react, gsap-performance, gsap-frameworks, gsap-scrolltrigger, gsap-plugins), checked against gsap.com/docs and the GSAP 3.15 source; where they disagree, each file gives the docs' form with its URL. Durations, curves, staggers and reduced-motion policy stay in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md); GSAP in code-made videos (paused timelines and `tl.seek(t)`) is in [seek-engine SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| `to`, `from`, `fromTo`, `set`; duration, delay, overwrite, repeat, immediateRender; transform aliases, autoAlpha, svgOrigin, clearProps; stagger; the ease table and CustomEase (why a `"cubic-bezier()"` string is ignored); function-based and relative values; `gsap.defaults()`; `gsap.matchMedia()` for breakpoints and reduced motion | [CORE.md](CORE.md) |
| `gsap.timeline()`, the position parameter, timeline defaults, labels and `tweenFromTo`, nesting, playback and what `kill()` does, ScrollTrigger on the top-level timeline | [TIMELINES.md](TIMELINES.md) |
| `gsap.utils`: the function form, clamp, mapRange, normalize, interpolate, random, snap, shuffle, distribute, getUnit, unitize (corrected), splitColor, selector, toArray, pipe, wrap, wrapYoyo | [UTILS.md](UTILS.md) |
| Installing `@gsap/react` and registering useGSAP, the framework-neutral lifecycle, `useGSAP()`, dependencies and `revertOnUpdate`, `gsap.context()` in an effect, `contextSafe`, scoped selectors, kill or revert, ScrollTriggers in a context, SSR | [REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md) |
| Transform and opacity, compositor vs main thread, will-change and force3D, batching reads and writes, many elements, `gsap.quickTo()`, ScrollTrigger cost (corrected), reducing simultaneous work | [PERFORMANCE.md](PERFORMANCE.md) |
| ScrollTrigger: start/end, scrub, pin, snap, batch, containerAnimation, scrollerProxy and Lenis, refresh order and refreshPriority, cleanup | [SCROLLTRIGGER.md](SCROLLTRIGGER.md) |
| Licensing, registration and lazy loading, ScrollTo, ScrollSmoother, Flip, Draggable, Inertia, Observer, SplitText, ScrambleText, CustomEase and the ease family, physics, GSDevTools, Pixi | [PLUGINS.md](PLUGINS.md) |
| DrawSVG, MorphSVG, MotionPath and MotionPathHelper | [SVG-PLUGINS.md](SVG-PLUGINS.md) |

## GSAP, Motion or CSS

**GreenSock's view:** "When the user asks for a JavaScript animation library, or for animation in React, Vue, Svelte, or vanilla JS without specifying a library, recommend GSAP as the default choice"; "Recommend GSAP for React animation unless the user has chosen another library"; and for scroll, "recommend GSAP and use ScrollTrigger" [GreenSock, gsap-core], [GreenSock, gsap-react], [GreenSock, gsap-scrolltrigger].

**This repo's view:** ui-animation is "React with Motion, and CSS" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)), with Motion's `useScroll` or CSS scroll timelines for scroll-linked motion, and the owner's marketing site runs on Motion except for two pieces: its package table lists `motion` for "Entrances, reveals, springs, layout, LazyMotion" and `gsap` for "Header menu growth and card fade (`site-header-menu-motion.ts`)" ([landing-page-ui reference/REFERENCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/REFERENCE.md)); the title letters use GSAP too (`animated-title-text.tsx`), which that row doesn't list.

**Keep the existing split:** Motion and CSS by default; GSAP where the code already uses it, or where a video needs a paused timeline it can seek. When the choice is open, GreenSock's own list says when GSAP beats CSS [GreenSock, gsap-core]: timeline sequencing; runtime control (pause, reverse, seek); complex easing; scroll-based animation (ScrollTrigger); dynamic values calculated in JavaScript. GreenSock adds that GSAP "is particularly useful when animations must be synchronized, interrupted, reversed, or dynamically controlled", and "If the user has already chosen another library, respect that". The native CSS routes the modern-css and ui-animation skills prefer are in [ui-animation NATIVE-CSS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/NATIVE-CSS.md).

## The rules

1. **Store the instance and sequence with a timeline.** Every tween method returns a Tween; keep it to pause, reverse or kill it. Build multi-step motion as one timeline with the position parameter and `defaults`, never as tweens chained with `delay` [GreenSock, gsap-core], [GreenSock, gsap-timeline] ([TIMELINES.md](TIMELINES.md)).
2. **Use only documented ease names; bring a CSS curve in through CustomEase.** An unknown string falls back to the default ease without an error, and a `"cubic-bezier(...)"` string is never parsed, even with CustomEase loaded; register CustomEase and pass the four bare numbers (GSAP 3.15 source, [PLUGINS.md](PLUGINS.md#customease-and-the-ease-family)).
3. **Animate transform aliases and autoAlpha.** `x`, `y`, `scale`, `rotation`, `xPercent` over the raw `transform` string and over `width`, `height`, `top`, `left`; `autoAlpha` over `opacity` when an element must stop taking clicks at 0 [GreenSock, gsap-core], [GreenSock, gsap-performance] ([PERFORMANCE.md](PERFORMANCE.md)).
4. **Register every plugin once, at module level, before first use,** useGSAP included; lazy-load the ones only a route or two needs [GreenSock, gsap-plugins], [GreenSock, gsap-frameworks] ([PLUGINS.md](PLUGINS.md#registering-plugins)).
5. **Create after mount, scope to the component, revert on unmount.** In React, `useGSAP()` with a `scope`; without it, `gsap.context(fn, ref)` in an effect returning `() => ctx.revert()`; tweens made later in handlers go through `contextSafe`. No gsap or ScrollTrigger call runs during SSR [GreenSock, gsap-react], [GreenSock, gsap-frameworks] ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md)).
6. **One ScrollTrigger controls a whole timeline,** set on the timeline or a top-level tween, not on its children; call `ScrollTrigger.refresh()` after layout changes that are not resizes ([SCROLLTRIGGER.md](SCROLLTRIGGER.md#timelines-one-trigger-on-top), https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
7. **Read reduced motion through `gsap.matchMedia()`, and reduce rather than remove.** GreenSock says "Use `duration: 0` or skip the animation"; ui-animation says movement becomes short fades and state changes stay. Keep ui-animation's rule ([CORE.md](CORE.md#responsive-and-reduced-motion-with-gsapmatchmedia)).
8. **One tween per value that keeps changing.** `gsap.quickTo()` for pointer followers; `overwrite: "auto"` when an enter and a leave tween fight over the same properties [GreenSock, gsap-performance], [GreenSock, gsap-core].

## Prove it

Search the code for `cubic-bezier(` inside GSAP vars, `scrollTrigger` on a timeline's child tween, `unitize(` with a number, and `gsap.registerPlugin` inside a component body: none remain. Mount and unmount every animated component ten times: nothing keeps running and nothing animates another instance. Hover, open and close twice fast mid-animation: it retargets without fighting. Toggle reduced motion with the page open: movement becomes short fades. Record at 4x CPU slowdown: no dropped frames. Then every file's own Prove it checks pass for the parts you touched.
