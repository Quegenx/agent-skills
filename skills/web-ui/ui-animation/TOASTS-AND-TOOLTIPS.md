# Toasts and tooltips

Two small surfaces that appear often and must never feel slow. Sources: Emil Kowalski's `animate` and `emil-design-eng` skills and Sonner's own source (2.0.8), Base UI's tooltip docs, Craft, fluid-functionalism, and transitions.dev (described, not copied: its license forbids republishing the collection). The Sonner API itself is in [the `sonner` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md); timing tables are in [TIMING.md](TIMING.md).

## Toasts

- **Enter and leave by the same edge:** a toast "enters and exits from the same direction, making swipe-to-dismiss feel intuitive" [Emil Kowalski, emil-design-eng].
- **Place it by its own size:** `translateY(100%)`, as Sonner does ([PATTERNS.md](PATTERNS.md#modals-sheets-popovers)); percentages and acceleration are in [PERFORMANCE.md](PERFORMANCE.md#where-it-runs).
- **Transitions, not keyframes:** "Toasts are added rapidly. Keyframes restart from zero on interruption. Transitions retarget smoothly" [Emil Kowalski, emil-design-eng].
- **Entry with no JavaScript** is `@starting-style` ([NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit)); the older fallback is `useEffect(() => { setMounted(true); }, []);` with `<div data-mounted={mounted}>` [Emil Kowalski, animate].
- **Edge cases nobody sees:** "Pause toast timers when the tab is hidden. Fill gaps between stacked toasts with pseudo-elements to maintain hover state. Capture pointer events during drag" [Emil Kowalski, emil-design-eng].
- **A visible countdown pauses with the timer:** Sonner pauses the countdown on hover, on pointer interaction and in a hidden tab ([sonner source](https://github.com/emilkowalski/sonner)), so an animated border that shows the time left ([PATTERNS.md](PATTERNS.md#feedback-where-it-happened)) must pause too.
- **Sonner's provider constants** are owned by [Sizes and timing](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md#sizes-and-timing) and [Swipe](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md#swipe). Its source transitions omit a timing keyword, so they use CSS's default `ease` ([sonner source](https://github.com/emilkowalski/sonner), `src/styles.css` at 2.0.8). The flick rule in general: [GESTURES.md](GESTURES.md#let-a-flick-dismiss).
- **Timing, both ways:** Sonner "is slightly slower than typical UI animations and uses `ease` rather than `ease-out` to feel more elegant" [Emil Kowalski, emil-design-eng].
  - [TIMING.md](TIMING.md) gives a toast 250-350 ms in and 150-200 ms out on the `emphasized` curve.
  - app-ui's token description says "350ms | panels and toasts closing" for `--duration-medium` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens)); the app has no toast component and Sonner does not consume that token ([the source-qualified comparison](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md#where-other-skills-differ)). The old line said app-ui closes toasts on that token, implying an observed component. Keep the separate source timings.
- **A stack is trial and error:** in an entering or leaving stack "the opacity change has to work against the height change. There's no formula", so check it again the next day [Emil Kowalski, animate].
- **A stack in depth,** from transitions.dev's banner stack, described:
  - each older toast steps back by a fixed offset (12 px), shrinks a few percent (6% a step), dims and blurs a pixel or two; a fourth toast pushes the oldest out;
  - set the blur to an explicit `blur(0)` at rest rather than leaving `filter` unset (the source says `none` doesn't interpolate reliably; MDN's filter page says a `none` is replaced by default-valued functions and interpolated, so treat this as a browser workaround, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/filter));
  - release the entering state in the same task after a forced reflow, not in a `requestAnimationFrame` callback, which a throttled frame clock can skip;
  - spread the stack on hover from the pointer's position against the stack's box, not from `:hover`, because the gaps between toasts belong to no element.
- **One class, two clocks:** the resting rule carries the close duration and the open class carries the open duration, so adding and removing one class gives a slower entrance and a faster exit [transitions.dev].
- **Reduced motion, both ways:** Sonner's stylesheet sets `transition: none !important; animation: none !important` on toasts under `prefers-reduced-motion` ([sonner source](https://github.com/emilkowalski/sonner)); this skill's rule 8 keeps a short fade ([SKILL.md](SKILL.md#the-rules)).

## Tooltips

- **The first one waits, its neighbours open at once:** "Tooltips should delay before appearing to prevent accidental activation. But once one tooltip is open, hovering over adjacent tooltips should open them instantly with no animation" [Emil Kowalski, emil-design-eng]:

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Skip animation on subsequent tooltips */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

- **What Base UI provides** ([base-ui.com](https://base-ui.com/react/components/tooltip)): `data-instant` on the popup is "Present if animations should be instant", with the value `'delay'`, `'focus'` or `'dismiss'`; the trigger's `delay` defaults to 600 ms and `closeDelay` to 0; the provider's `timeout` defaults to 400 ms: "Another tooltip will open instantly if the previous tooltip is closed within this timeout." `--transform-origin` is set on the positioner and inherited by the popup.
- **How long the first one waits, three ways:**
  - "the first tooltip should wait, around 400ms to 700ms, and then its neighbors should appear at once" [Craft];
  - 200 ms, with an app-level provider giving a 300 ms skip-delay window; "a per-instance provider everywhere would defeat the grouping and re-wait the full delay between neighbors" [fluid-functionalism];
  - app-ui waits less: "**80ms intent delay, not the 600ms default:** long enough to ignore a cursor passing over, short enough to feel instant", and opens "on a spring from 60% scale" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#tooltips)). Neither wins.
- **Show slowly, hide at once:** put the appear delay on the showing rule only, so hiding is immediate [transitions.dev].
- **One bubble that travels:** transitions.dev keeps one tooltip per group and, when it is already open, slides and resizes it to the next trigger instead of closing and reopening; its geometry snaps while hidden. As shipped it hides when the pointer moves onto the bubble and has no Escape: WCAG 2.2 SC 1.4.13 (AA) needs content that is "dismissible" and "hoverable" ([w3.org](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)), and the APG tooltip pattern says "Escape: Dismisses the Tooltip" ([w3.org](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- **Follow the pointer along one axis** on a tall or wide trigger, where a centred tooltip would sit far from the pointer; the offset is a motion value, "so per-move updates skip React re-renders" [fluid-functionalism].
- **Durations, both ways:** 125 ms from `scale(0.97)` [Emil Kowalski, emil-design-eng]; a fast-tier entrance with a 4 px slide toward the trigger and a 0.06 s exit [fluid-functionalism]; 80-120 ms in [TIMING.md](TIMING.md#duration-by-element).

## Prove it

Fire several toasts in quick succession: each retargets, none restarts from zero, and the stack never jumps. Hover the gap between two stacked toasts: the stack stays spread. Switch tabs while a toast counts down: when you return, its time and its countdown resumed together. Swipe a toast the wrong way: it resists; flick it the right way: it goes. Hover across a toolbar: the first tooltip waits, the next ones appear with no delay and no animation. Move the pointer onto an open tooltip and press Escape: it stays while hovered and closes on Escape.
