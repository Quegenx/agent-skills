# Timelines: sequencing, the position parameter, labels, nesting, playback

By default, tweens in a timeline are **appended** one after another; the position parameter places them at specific times or relative to other tweens. Prefer timelines to chaining tweens with `delay` [GreenSock, gsap-timeline]. Tween vars and eases are in [CORE.md](CORE.md); scroll-driven timelines are in [SCROLLTRIGGER.md](SCROLLTRIGGER.md). Which placements a sequence should use (sequential, overlapping, simultaneous, staggered) is in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#composing-a-sequence); this file gives their GSAP syntax.

## Creating a timeline

[GreenSock, gsap-timeline]

```javascript
const tl = gsap.timeline();
tl.to(".a", { x: 100, duration: 1 })
  .to(".b", { y: 50, duration: 0.5 })
  .to(".c", { opacity: 0, duration: 0.3 });
```

## Position parameter

[GreenSock, gsap-timeline]

Pass placement as a separate argument: third in `.to()` and `.from()`, fourth in `.fromTo()`. It is not a `position` property in tween vars. The default is `"+=0"`, the end of the whole timeline ([to](https://gsap.com/docs/v3/GSAP/Timeline/to%28%29), [fromTo](https://gsap.com/docs/v3/GSAP/Timeline/fromTo%28%29), [method implementations](https://github.com/greensock/GSAP/blob/master/src/gsap-core.js#L1486)).

Source corrections: the previous text allowed `position` in vars and called `">"` the default; placement uses the method argument, and `">"` means the most recently inserted animation's end, which can differ from the timeline's end.

- **Absolute**: `1`, start at 1 second.
- **Relative**: `"+=0.5"`, 0.5s after the end; `"-=0.2"`, 0.2s before the end.
- **Label**: `"labelName"`, at that label; `"labelName+=0.3"`, 0.3s after it.
- **Placement**: `"<"`, start when the most recently added animation starts; `">"`, start when it ends; `"<0.2"`, 0.2s after its start.

```javascript
tl.to(".a", { x: 100 }, 0);           // at 0
tl.to(".b", { y: 50 }, "+=0.5");      // 0.5s after last end
tl.to(".c", { opacity: 0 }, "<");     // same start as previous
tl.to(".d", { scale: 2 }, "<0.2");    // 0.2s after previous start
```

## Timeline defaults

[GreenSock, gsap-timeline]

Pass `defaults` into the timeline so every child tween inherits them:

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 }).to(".b", { y: 50 }); // both use 0.5s and power2.out
```

Leaving them out when many children share a duration or ease is a GreenSock "Do Not". A `defaults.ease` is still an ease string: a `"cubic-bezier(...)"` string there falls back to the default ease like anywhere else (gsap-a findings; [CORE.md](CORE.md#a-css-cubic-bezier-curve-needs-customease)).

## Constructor options

[GreenSock, gsap-timeline]

- **paused: true**: create paused; call `.play()` to start.
- **repeat**, **yoyo**: as on tweens; apply to the whole timeline.
- **onComplete**, **onStart**, **onUpdate**: timeline-level callbacks.
- **defaults**: vars merged into every child tween.

`duration` on the timeline constructor is not a tween duration: a timeline's duration is determined by its children.

## Labels

[GreenSock, gsap-timeline]

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.to(".b", { opacity: 0 }, "outro");
tl.play("outro");  // start from "outro"
tl.tweenFromTo("intro", "outro"); // pauses the timeline and returns a new Tween that animates the timeline's playhead from intro to outro with no ease.
```

## Nesting timelines

[GreenSock, gsap-timeline]

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
master.to(".c", { opacity: 0 }, "+=0.2");
```

## Controlling playback

[GreenSock, gsap-timeline]

- **tl.play()** / **tl.pause()**
- **tl.reverse()** / **tl.progress(1)** then **tl.reverse()**
- **tl.restart()**: from the start.
- **tl.time(2)**: seek to 2 seconds. **tl.progress(0.5)**: seek to 50%.
- **tl.kill()**: the skill adds "and (by default) its children"; the docs say only that it "Immediately kills the timeline and removes it from its parent timeline, stopping its animation" and, in the details, "releasing it for garbage collection", with nothing about children or about inline styles (https://gsap.com/docs/v3/GSAP/Timeline/kill()). To put inline styles back, revert a context instead ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md#kill-or-revert)).

landing-page-ui's header menu is a paused timeline driven by these calls plus two the skill doesn't list: `timeline.play(0)` to open, `timeScale(1.35)` and `reverse()` to close, and `eventCallback("onReverseComplete", ...)` to mark it closed only when the reverse completes ([site-header-menu-motion.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/header/bar/site-header-menu-motion.ts); "Close | the same timeline reversed at 1.35 times speed", [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)). In a code-made video, a paused timeline driven by `tl.seek(t)` is the contract: [seek-engine SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/SKILL.md).

## ScrollTrigger goes on the top-level timeline

[GreenSock, gsap-timeline] "Put ScrollTrigger on the timeline (or top-level tween), not on tweens inside a timeline." The docs are softer than the skill's "only on top-level" (nesting is possible "but it usually doesn't make sense"); the full rule and the docs' wording are in [SCROLLTRIGGER.md](SCROLLTRIGGER.md#timelines-one-trigger-on-top).

## Prove it

- No multi-step animation is built from tweens chained with `delay`; each sequence is one timeline with explicit positions or labels.
- Shared duration and ease sit in `defaults`, not repeated on every child.
- Open and close a timeline-driven element mid-animation, twice fast: it reverses from where it is, and its "closed" state is set only in `onReverseComplete`.
- No `scrollTrigger` sits on a child tween inside a timeline.
- After `kill()`, check the element's inline styles: if they must go, the code reverts a context rather than relying on `kill()`.
