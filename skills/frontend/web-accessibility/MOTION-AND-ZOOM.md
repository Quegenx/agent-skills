# Motion, timing, zoom and contrast

`prefers-reduced-motion`, autoplay and timed UI, content on hover or focus, zoom and reflow, and which contrast requirement applies. Source: [Jakub Krehel, better-accessibility, motion-and-zoom.md and SKILL.md], with 2.2.2, 2.3.3 and 2.2.1 restated from WCAG; animation recipes under reduced motion are in [ui-animation/PERFORMANCE.md](../ui-animation/PERFORMANCE.md#reduced-motion) and [modern-css/QUERIES-AND-PREFERENCES.md](../modern-css/QUERIES-AND-PREFERENCES.md#reduced-motion).

**Contents:** [prefers-reduced-motion](#prefers-reduced-motion) · [Which criterion motion falls under](#which-criterion-motion-falls-under) · [Autoplay and timed UI](#autoplay-and-timed-ui) · [Content on hover or focus](#content-on-hover-or-focus) · [Zoom and reflow](#zoom-and-reflow) · [Contrast](#contrast) · [Prove it](#prove-it)

## prefers-reduced-motion

[Jakub Krehel, better-accessibility]

Wrap animations in `@media (prefers-reduced-motion: no-preference)`, so users who asked for reduced motion get the static version without an override per animation.

```css
/* Good: motion is opt-in */
.card {
  /* static styles */
}
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 200ms ease-out;
  }
}
```

```tsx
// Tailwind: motion-safe / motion-reduce variants
<div className="motion-safe:transition-transform motion-safe:hover:-translate-y-1" />
```

### What to disable vs reduce

Reduced motion targets vestibular triggers, not feedback.

| Disable entirely | Replace | Keep |
| --- | --- | --- |
| Parallax scrolling | Slide/scale/zoom transitions: opacity crossfade | Loading spinners and progress |
| Autoplaying video, GIFs, looping decoration | Smooth scrolling: instant jump | Instant state changes (hover color, focus ring) |
| Spinning, large-scale movement across the screen | Auto-rotating carousels: start paused | Brief functional feedback (button press) |

- **Two views on what remains.** This skill's opt-in block leaves no transition at all under reduced motion, and its table keeps crossfades for slides. ui-animation's rule is "Reduce, don't remove: with reduced motion, movement becomes short fades" ([ui-animation/SKILL.md](../ui-animation/SKILL.md), rule 8). [feel] jumps a released body straight to its rest point while dragging still follows the finger. WCAG allows each, since the criterion is AAA (below); the existing ui-animation rule stays.
- **A state change carried by motion alone** fails when the animation does not run: leave a color, icon or label behind. [Jakub Krehel, better-interface]

## Which criterion motion falls under

[WCAG 2.2](https://www.w3.org/TR/WCAG22/), correcting [Jakub Krehel, better-accessibility] and [Jakub Krehel, better-interface].

| Motion | Criterion | Level |
| --- | --- | --- |
| Motion triggered by interaction (a hover lift, a page slide) | 2.3.3 Animation from Interactions: "Motion animation triggered by interaction can be disabled" ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)) | AAA |
| Moving, blinking or scrolling content that starts automatically, lasts more than five seconds and is presented in parallel with other content; auto-updating content that starts automatically and is presented in parallel, with no five-second condition | 2.2.2 Pause, Stop, Hide ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)) | A |

- The source ranked "motion ignoring reduced motion" HIGH on sight while also saying AAA is never HIGH. Under WCAG, interaction motion that ignores `prefers-reduced-motion` is a 2.3.3 recommendation (P2 or P3 in [REVIEW.md](REVIEW.md#severity)); autoplaying motion over five seconds with no pause, stop or hide mechanism is a 2.2.2 failure.
- Honoring `prefers-reduced-motion` alone does not satisfy 2.2.2: a user who never set the preference still needs the mechanism. [Jakub Krehel, better-interface]
- transitions.dev says a missing reduced-motion block makes a component "fail accessibility audits"; an AA audit does not fail it, because 2.3.3 is AAA. [transitions.dev]

## Autoplay and timed UI

[Jakub Krehel, better-accessibility], corrected for 2.2.2 and 2.2.1.

- **A mechanism on anything that moves on its own** (2.2.2). WCAG requires "a mechanism for the user to pause, stop, or hide it"; for auto-updating content, the mechanism may instead let the user "control the frequency of the update" ([WCAG 2.2, 2.2.2](https://www.w3.org/TR/WCAG22/#pause-stop-hide)). A visible pause button is the usual mechanism and the one the source asked for, muted looping hero videos included; the criterion itself says mechanism, not visible control.
- **Explicit dismissal over timers.** Auto-dismissal suits low-stakes confirmations and nothing else. A toast carrying an action, an error or information the user may need stays until dismissed.
- **Pause on attention.** Where a toast must time out, give it at least 5 seconds, and pause the timer while it is hovered or focused. The 5 seconds is the source's heuristic, not a criterion. The criterion for a time limit is 2.2.1 Timing Adjustable (A): the user can turn the limit off, adjust it to at least ten times the default, or is warned and given at least 20 seconds to extend it; limits longer than 20 hours are exempt ([WCAG 2.2, 2.2.1](https://www.w3.org/TR/WCAG22/#timing-adjustable)).
- **Never put critical information only in a timed element.** A vanished toast with the only link to an undo action is data loss on a schedule.

## Content on hover or focus

[WCAG 2.2, 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) (AA). A tooltip or popover that appears on hover or focus must be:

- **Dismissible** "without moving pointer hover or keyboard focus", usually with Escape (the APG tooltip pattern: "Escape: Dismisses the Tooltip", [APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- **Hoverable:** "the pointer can be moved over the additional content without the additional content disappearing".

A tooltip that hides on the group's `pointerleave` while the bubble has `pointer-events: none`, with no Escape handler, fails both. [transitions.dev]

## Zoom and reflow

[Jakub Krehel, better-accessibility]

- **200% text resize** (1.4.4). All content and functionality survives text scaled to 200%. Text containers take `min-height`, not `height`.
- **Reflow at 320px** (1.4.10). At 400% zoom on a 1280px viewport, equivalent to a 320px one, the page must work with vertical scrolling alone. Genuinely 2D content is the exception: tables, maps and code blocks scroll inside their own container ([Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)). The criterion measures the viewport, so [Jakub Krehel, break]'s 320px container on a test page is a proxy for it, not the criterion itself.
- **Never lock zoom.** Never set `maximum-scale=1` or `user-scalable=no` in the viewport meta. MDN notes "iOS10+ ignores it by default", so it is not even an iOS input-zoom fix, and disabling zoom harms low-vision users ([MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)). [fluid-functionalism]

Write media queries in `rem` or `em` where the codebase allows. At a larger browser font size such a query switches to the narrow layout when the text needs it, and a `px` query does not.

## Contrast

[Jakub Krehel, better-accessibility], with px values from Understanding 1.4.3.

| Criterion | Applies to | Minimum |
| --- | --- | --- |
| 1.4.3 AA | Text | 4.5:1 |
| 1.4.3 AA | Large text: at least 18 point, or 14 point bold ("14pt and 18pt are equivalent to approximately 18.5px and 24px", [Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); the source's `24px` and `18.67px` are the same sizes) | 3:1 |
| 1.4.11 AA | UI component boundaries, states, focus indicators and meaningful graphics, "against adjacent color(s)" | 3:1 |
| 1.4.1 | Meaning, status or state | Never color alone: add an icon, text or an underline |

- Inactive (disabled) controls and logos are exempt ([SEMANTICS-AND-ARIA.md](SEMANTICS-AND-ARIA.md#disabled-states)).
- 1.4.11 covers "any visual information necessary to indicate state, such as whether a component is selected" ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). A selected segment marked only by a white 12% pill on a near-black bar measures about 1.45:1, and its active text against inactive text about 2.5:1, so no cue of the selected state reaches 3:1. [Emil Kowalski, prototype], measured in the findings
- Measure the rendered pair, never eyeball it: `python3 <anti-slop-ui>/scripts/contrast.py "#777777" "#ffffff"` ([anti-slop-ui](../../anti-ai-slop/anti-slop-ui/SKILL.md)). When it fails, report the pair and the criterion it misses, and leave the colors alone unless asked.

## Prove it

With reduced motion on, nothing slides, zooms or parallaxes and no state is lost; every autoplaying carousel, video or loop longer than five seconds can be paused, stopped or hidden; no action or error toast closes on its own, and a timed toast pauses while hovered or focused; every hover or focus tooltip closes on Escape and stays while the pointer moves onto it; at 200% text size and at 320 CSS px wide nothing clips or scrolls sideways outside tables, maps and code; `grep -rnE 'maximum-scale|user-scalable' src/ public/` is empty; and every text, state and focus pair passes its row of the contrast table.
