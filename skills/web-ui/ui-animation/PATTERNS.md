# Patterns

**More in their own files:** [hold to confirm, clip-path and blur reveals, the generation reveal](REVEALS.md) · [drag details and the release velocity](GESTURES.md) · [toasts and tooltips](TOASTS-AND-TOOLTIPS.md) · [one highlight per list, weight that changes, merged selection](HIGHLIGHTS-AND-SELECTION.md)

React with Motion (`motion/react`), and CSS where it's enough. Keep the transition presets from [TIMING.md](TIMING.md) in one module:

**Contents:** [Enter and exit](#enter-and-exit) · [Lists](#lists-that-stagger-reorder-and-remove) · [Shared elements](#shared-elements-a-thumbnail-becomes-the-detail) · [A card that opens a modal and owns the URL](CARD-TO-MODAL.md) · [Modals, sheets, popovers](#modals-sheets-popovers) · [Trays](#trays-a-flow-in-steps-over-the-current-screen) · [A button that grows into a panel](#a-button-that-grows-into-a-panel) · [Height and accordions](#height-and-accordions) · [Buttons](#buttons-presses-and-feedback) · [Feedback where it happened](#feedback-where-it-happened) · [Icons that turn into each other](#icons-that-turn-into-each-other) · [Numbers](#numbers) · [Live values and charts](#live-values-and-charts) · [Gestures](#gestures-drag-throw-snap) · [Scroll](#scroll-linked-motion) · [Galleries](#galleries-carousels-and-rings) · [Delight](#delight-where-flourish-goes) · [Tells](#tells-of-template-motion)

```tsx
// motion-presets.ts
import { stagger, type Transition } from "motion/react";

export const spring = {
  ui: { type: "spring", visualDuration: 0.25, bounce: 0.15 },
  enter: { type: "spring", visualDuration: 0.3, bounce: 0 },
  exit: { type: "spring", visualDuration: 0.15, bounce: 0 },
  shape: { type: "spring", visualDuration: 0.45, bounce: 0.2 },
} satisfies Record<string, Transition>;

export const ease = {
  out: [0.16, 1, 0.3, 1],
  exit: [0.55, 0.055, 0.675, 0.19],
  emphasized: [0.05, 0.7, 0.1, 1],
} as const;

export const listStagger = { delayChildren: stagger(0.04) } satisfies Transition;
```

## Enter and exit

Elements leaving the tree need `AnimatePresence` to play their exit; give each child a stable `key`.

```tsx
import { AnimatePresence, motion } from "motion/react";

export function Panel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: spring.enter }}
          exit={{ opacity: 0, y: 4, transition: spring.exit }}            // shorter and less travel than the entrance
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- `mode="wait"` when one view replaces another (a step in a wizard): the old leaves before the new arrives. Keep the exit short, or the user waits.
- `mode="popLayout"` when removing an item from a list whose neighbours should close the gap immediately; the parent needs a non-static `position` (for example `relative`).
- Entrances start close to the final state: 4-12 px of travel and opacity from 0, or scale from 0.96. A card flying in from 100 px reads as a template.
- **Never from `scale(0)`:** "Nothing in the real world appears from nothing." Start from `scale(0.9-0.97)` + `opacity: 0` [Emil Kowalski, animate].
  - The owner's site does otherwise on purpose: landing tiles "spring in from scale 0" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#decorative-motion)).
- **`initial={false}` only around a swap:** set it on an `AnimatePresence` that wraps a state swap, "Never set it around an intentional entrance such as a staggered hero" [Jakub Krehel, better-ui].
- **A target that flips instead of unmounting picks its transition from state:** `transition={isOpen ? spring.fast : spring.fast.exit}` (its own tokens) [fluid-functionalism].
- **Hand-rolled presence reads `safeToRemove` through a ref:** "AnimatePresence hands out a new one on every render while a child leaves, so depending on it would restart the close on every parent re-render" [fluid-functionalism].
- **Point to where it went.** When a result moves somewhere else, animate it there: in Family, after a transaction is confirmed "a spinner moves into the bottom navigation to indicate where the user can now find their pending transaction", and speeding one up moves the speed-up spinner onto the original pending tray.
- **Map the journey at the start:** Family's onboarding moves a stack of cards to show where the user is heading and how a different choice would lead somewhere else.

## Lists that stagger, reorder and remove

```tsx
<motion.ul initial="hidden" animate="shown" variants={{ shown: { transition: listStagger } }}>
  {items.slice(0, 12).map((item) => (                                        // stagger the first visible dozen; the rest just appear
    <motion.li key={item.id} layout
      variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0, transition: spring.enter } }}>
      {item.title}
    </motion.li>
  ))}
</motion.ul>
```

`layout` on each item animates reordering and the gap left by a removal through transforms, so the neighbours glide instead of jumping. Keys must be stable IDs, never array indexes, or items animate into each other's places.

Without Motion, the same thing is FLIP (First, Last, Invert, Play): one layout change, the whole movement on transform. "Vue's `TransitionGroup` and Framer Motion's layout animations are FLIP under the hood"; a list reordered with a `top` transition stutters under main-thread load where FLIP stays smooth (kciter):

```js
const first = el.getBoundingClientRect(); // First: where it is now

list.prepend(el); // the one and only layout change

const last = el.getBoundingClientRect(); // Last: where it ended up
const dx = first.left - last.left;
const dy = first.top - last.top;

// Invert: make it look like it's back at the old position → Play: release it
el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
  duration: 300,
  easing: 'ease-in-out',
});
```

## Shared elements: a thumbnail becomes the detail

```tsx
<motion.img layoutId={`photo-${id}`} src={thumb} />           // in the grid
<motion.img layoutId={`photo-${id}`} src={full} />            // in the open view: Motion animates between the two boxes
```

- One `layoutId` per thing, present in one place at a time; wrap the views in `LayoutGroup` when they live in separate components that re-render independently.
- Text inside a growing container distorts while it scales; give the text its own `layout="position"`, or fade it in after the box arrives.
- **Across routes,** the View Transitions API does the same with no library: `document.startViewTransition(() => navigate(to))`, with matching `view-transition-name` on the two elements. Frameworks expose it (TanStack Router's `viewTransition` option, React's `<ViewTransition>`); without support, the change simply happens. Support, cross-document, limits and debugging: [NATIVE-CSS.md](NATIVE-CSS.md#view-transitions). React's component, types and Next.js `transitionTypes`: [REACT-VIEW-TRANSITIONS.md](REACT-VIEW-TRANSITIONS.md).
- Close to where it came from: the detail returns to the item's current position (it may have scrolled), not to a stale one.
- **What persists, travels.** "If a component occupies a space and will persist in the next phase of the user's journey, it should remain consistent": it moves into the next screen and never "unnecessarily duplicates itself during an animation" (Family's wallet cards).
- **High-stakes values travel.** In Family's send flow the amount moves visibly from the entry screen to the confirm screen, so users get "confidence that the amount entered is indeed the amount being sent".

## Modals, sheets, popovers

- **Grow from the trigger:** a popover scales from 0.96 to 1 with its `transform-origin` at the anchor side; a modal fades its backdrop (200 ms) and lifts the panel 8-16 px with `emphasized`; a sheet slides in from its edge with the `enter` spring and closes faster.
- **Modals keep a centred origin:** "Modals should keep `transform-origin: center` because they are not anchored to a specific trigger" [Emil Kowalski, emil-design-eng].
  - app-ui does otherwise: "A dialog that opens something new (create, search, settings) grows out of the button just pressed and shrinks back into it" ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md#grow-from-the-button-that-opened-it)).
- **Offsets in percent for edge-anchored surfaces:** `translateY(100%)` moves an element by its own height; "This is how Sonner positions toasts and how Vaul hides the drawer" [Emil Kowalski, emil-design-eng]. Toasts and tooltips have their own file: [TOASTS-AND-TOOLTIPS.md](TOASTS-AND-TOOLTIPS.md).
- **Focus moves with it:** into the dialog when it opens, back to the trigger when it closes; motion never delays focus or input.
- **Dismiss mid-animation:** Escape or a backdrop click during the entrance reverses from where it is.
- **Build it as a pipeline:** kciter's notification is three pieces: the background dims (opacity 0 to 0.5, 200 ms), the card slides up into place (300 ms, ease-out), the content fades in (opacity 0 to 1, 200 ms). Each can be tuned alone ([TIMING.md](TIMING.md#composing-a-sequence)).
- **A popup in CSS alone:** the Base UI select popup on Florian Kiem's "Tips to improve your product" page is `origin-[var(--transform-origin)] transition-all duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0`, the origin taken from the anchor. Native `@starting-style`, `allow-discrete` and `overlay`: [NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit).
  - Name the properties instead of `transition-all` ([PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move)).
- **A sheet swiped away on native scroll** (scroll snap and view timelines, no JavaScript touch handling) is in [SHEETS.md](SHEETS.md).
- **Flutter sheets** (the spring sheet, swipe down at the top to close, the iOS 26 sheet) are in [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#pick-the-sheet).

## Trays: a flow in steps over the current screen

Family's "dynamic tray system" (inspired by Craft): components "that can effortlessly expand, contract, and adapt in response to a user's actions", a condensed version of the app "with a specific set of constraints and capabilities". A tray opens from a button, icon or notification, stands alone over any content or emerges from within a component.

- **Each next tray has a different height,** which "makes the progression or change unmistakably clear"; sometimes that means rewriting content or tweaking the design so the transition shows.
- **A title and an icon on every tray:** the icon dismisses the first tray and goes back on the ones after it.
- **One thing per tray:** a single piece of content (educational text explaining a feature) or a primary action.
- **The tray takes the flow's theme:** "within a dark-themed flow, trays adopt a darker colour scheme."
- **Tray or full screen:** trays for transient actions that don't need to stay on screen, "especially helpful for confirmation steps and warnings"; a longer flow can start in a tray and transition to full screen.
- **It keeps context:** "Unlike full screen transitions that can displace users from where they just were, trays overlay content directly onto the current interface"; a swap approval "unfolds from the swap interface itself".
- **Compact lowers the commitment:** "The compact nature of trays signals to users that each task is approachable."
- **Reveal gradually:** the fundamentals stay at hand and "everything else would appear as it became most relevant".
- **The motion:** "trays morphing into full screen views, buttons gliding across trays, buttons morphing into trays and back again".

Family is an iOS app; the `app-ui` skill's web dialogs and side sheets are in [app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md).

## A button that grows into a panel

The RNDR Realm gooey dropdown: the panel "starts as a small circle, the same size and position as the button, and then expands into the full panel", sliding down first and then opening up. The exit equals the initial state, and on the way out the size shrinks first and the move follows.

```tsx
initial={{ width: 52, height: 52, borderRadius: 26, y: 0, x: "-50%" }}
animate={{ width: 340, height: 310, borderRadius: 24, y: 70, x: "-50%" }}
transition={{
 y: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
 width: { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
 height: { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
 borderRadius: { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
}}
exit={{ width: 52, height: 52, borderRadius: 26, y: 0, x: "-50%",
  transition: {
    y: { duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
    width: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    borderRadius: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  } }}
```

- **Stagger the properties:** "That stagger is what gives it that organic feel where it slides down and then opens up ... If you animate all the properties at the same time it feels stiff." The `app-ui` skill's morphing menu ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)) does the opposite: width, height, radius and shadow on one spring.
- **Content waits for the shape:** `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` with `transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}`, out with `opacity: 0, transition: { duration: 0.15, ease: "easeIn" }`; rows rise after it with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.25, delay: 0.2 + i * 0.05, ease: [0.4, 0, 0.2, 1] }}`.
- **Layout properties, both ways:** the article animates `width`, `height` and `borderRadius` directly and says nothing about cost; rule 7 and [PERFORMANCE.md](PERFORMANCE.md) move only transform and opacity and resize with `scale` or Motion's `layout`. Its timing also runs past this skill's dropdown row and exit rule ([TIMING.md](TIMING.md)).
- **The goo:** the button and the panel overlap inside one wrapper with an SVG filter that blends their edges while the shape changes. The filter is in [the `svg` skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/SKILL.md).

## Height and accordions

Animating `height` runs layout every frame; fine for a small accordion, costly for a big panel. Two cheaper options (a native `<details>` route is in [NATIVE-CSS.md](NATIVE-CSS.md#details-and-height-auto)):

```css
/* CSS: animate grid rows from 0fr to 1fr, no measuring */
.accordion { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms var(--ease-out); }
.accordion[data-open="true"] { grid-template-rows: 1fr; }
.accordion > div { overflow: hidden; }
```

Or in Motion, `animate={{ height: open ? "auto" : 0 }}` for small content, and `layout` on the surrounding blocks so what's below moves with transforms.

- **Not to `"auto"` under a scaled ancestor:** "framer measures 'auto' visually, so under a scaled ancestor the open would overshoot to scale× the real height and snap back"; animate to a self-measured `offsetHeight` [fluid-functionalism] (the author's measurement, not in Motion's docs).
  - app-ui measures differently: "Size from a `ResizeObserver` border box, which is fractional. `offsetWidth` rounds down half a pixel and ellipsizes the label" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#a-menu-that-is-its-trigger-grown)).
- **Never stack two measured-height collapses:** "a wrapper animating to a ResizeObserver-measured height springs only when it itself toggles and snaps (`{duration: 0}`) when a child's collapse changed the measurement"; before that guard "the sub-menu landed in 218ms while its group wrapper took 326ms, diverging ~80px mid-flight" [fluid-functionalism].
- **Opacity runs ahead of height** (0.06s in, 0.04s out) "so the body dissolves rather than being sliced by the clip edge"; a growing item opens its height first and fades its content in 0.08s later: "space opens first, then content appears" [fluid-functionalism].

## Buttons, presses and feedback

- Press: `whileTap={{ scale: 0.97 }}` with the `ui` spring; hover: a colour or shadow change, not a jump in size. **Every pressable element has a pressed state, and it is stronger than the hover** (rest, hover, press, each a step further). Playful brands move (a slight scale); professional tools shift tone. Keep it subtle and under 100 ms in: some buttons are pressed hundreds of times a day. Component details beyond motion are in the `anti-slop-ui` skill's DETAILS.md. A like button's heart "shrinks for an instant and then springs back"; the overshoot "gives the press a tactile sense of feedback" (kciter). The RNDR Realm dropdown trigger also grows on hover (`whileHover={{ scale: 1.03 }}`); this line keeps hover to colour or shadow.
- **Press in faster than release.** Kiem's demos press in quicker than they let go: a tone-only press goes darker in 90ms and back over 240ms (`[transition:background-color_240ms_ease-out]`, `active:[transition:background-color_90ms_ease-out]`), a playful one scales in over 240ms and back over 420ms. With reduced motion the press keeps its colour change and drops the scale (`motion-reduce:[transition:background-color_180ms_ease-out] motion-reduce:active:scale-100`).
- **Playful press, both ways:** Kiem's playful press goes to `active:scale-[0.94]` over 240ms on a `linear()` spring that overshoots about 16%; the line above says 0.97 and under 100 ms in, and [TIMING.md](TIMING.md#duration-by-element) gives a press 120-180 ms and 5-10% overshoot. Neither wins.
  - Flutter community view: FlutterPro presses to scale 0.96 on `CupertinoMotion.smooth()` from the `motor` package, the same spring in and out, with no faster press-in ([FlutterPro](https://flutterpro.design/details/pressable-spring)). See ../../mobile/flutter-ux/MOTION-AND-FEEDBACK.md.

```
[--press-spring:linear(0,0.09,0.298,0.547,0.779,0.963,1.085,1.148,1.163,1.145,1.11,1.069,1.032,1.003,0.985,0.975,0.974,0.977,0.983,0.989,1)]
playful: [transition:background-color_180ms_ease-out,scale_420ms_var(--press-spring)]
         active:[transition:background-color_180ms_ease-out,scale_240ms_var(--press-spring)]
         active:scale-[0.94]
```
- **More press voices, the disabled rule, a press without scale, a tap that shows the whole press:** [GESTURES.md](GESTURES.md#presses). Hold to confirm: [REVEALS.md](REVEALS.md#hold-to-confirm).
- **Stretch a switch while it is held.** Fast-moving things look longer, so a thumb that widens toward the side it will travel to while pressed, then snaps across and back to round on release, feels physical. The stretch's size and speed set the character: a small quick stretch feels light, a longer one with a slower travel feels heavy. Match it to the brand.

```css
.switch { --w: 44px; --h: 24px; --pad: 2px; --knob: calc(var(--h) - 2 * var(--pad)); --stretch: 6px;
  position: relative; inline-size: var(--w); block-size: var(--h); border-radius: 999px; }
.switch .thumb { position: absolute; inset-block-start: var(--pad); inset-inline-start: var(--pad);
  inline-size: var(--knob); block-size: var(--knob); border-radius: 999px;
  transition: inline-size 120ms ease-out, translate 180ms cubic-bezier(0.16, 1, 0.3, 1); }
.switch:active .thumb { inline-size: calc(var(--knob) + var(--stretch)); }           /* off: grows toward the right */
.switch[aria-checked="true"] .thumb { translate: calc(var(--w) - var(--knob) - 2 * var(--pad)) 0; }
.switch[aria-checked="true"]:active .thumb {                                         /* on: stays pinned right, grows left */
  translate: calc(var(--w) - var(--knob) - var(--stretch) - 2 * var(--pad)) 0; }
```

  Use a real `<button role="switch" aria-checked>`, so it works with Space and Enter, With reduced motion, keep the stretch (it is feedback) and make the travel instant.
- **Kiem's switch, for numbers:** a 72×32 track with a 40px pill thumb placed by `left` and `right` (`left-[29px] right-[3px]` on, `left-[3px] right-[29px]` off), so stretching moves one edge. Travel is `transition-[left,right] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]`; while held, `group-active:duration-[160ms] group-active:ease-out` moves the far edge 9px toward the travel side (`group-active:left-[20px]` on, `group-active:right-[20px]` off); the track colour is `transition-colors duration-200 ease-out`. With reduced motion, `motion-reduce:transition-none` on track and thumb makes the stretch instant too, where the line above animates it. `left` and `right` are layout properties, which [PERFORMANCE.md](PERFORMANCE.md) keeps out of animations.
- **Feedback is instant, results can follow:** the press responds in the same frame. Data should already be there (prefetched on hover, cached from the last visit); when it isn't, a skeleton that matches the final layout, so nothing shifts when content arrives, never a spinner. For an action, update optimistically; a progress indicator appears only after about 300 ms (a fast response never flashes one) and only when the outcome can't be shown in advance. Loading states as a whole are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#loading-states).
- Success lands once (a check that draws in 200-300 ms), errors shake horizontally 2-3 times over 300-400 ms with no bounce, and the message stays.

## Feedback where it happened

From Honk, a real-time chat app (Benji Taylor's "Honkish"); no durations given.

- **Put the reaction at the point of input:** a double tap on a friend's bubble put a heart exactly where you tapped, with a faint animated circle and a haptic both users felt at the same moment, "pinpoint[ing] precisely what you were reacting to and when".
- **Share positions as relative coordinates** ("10% X, 20% Y") so placement holds across screen sizes.
- **A self-dismissing notification shows its time left:** an animated border visibly counts down how long it stays.
- **Show progress on the control that resolves it:** as you typed, a small trash can filled, shook when the bubble was full and emptied when cleared.

## Icons that turn into each other

- **Same shape at another angle: rotate, don't morph.** Arrows (four directions, 90° apart), chevrons, and plus and cross (45° apart) share coordinates and differ only by a rotation. Morphing arrow-right into arrow-down "looked janky… the lines bend and warp. When you rotate, it just works." (Benji Taylor, "Morphing icons with Claude").
- The three-line icon geometry, rotation groups and complete transition algorithm have one owner: [svg MORPHING-ICONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/MORPHING-ICONS.md#cross-group-morphs-and-the-transition). [Benji Taylor, Morphing icons with Claude]
- **Which icons animate, both ways:** animate "Infrequent state swaps such as play to pause, like to liked or copy to copied", not "Hover-revealed actions in list rows" or "Tab and navigation icon swaps" [Jakub Krehel, better-ui].
  - The same author's other skill animates "Icons that appear on hover (action buttons)" [Jakub Krehel, make-interfaces-feel-better].
- **Not every pair takes the ideal path:** "Some morphs have slightly awkward intermediate states, and some rotations overshoot." Play the pairs ([SKILL.md](SKILL.md#prove-it)).
- **Pair an icon morph with the view transition:** in Family's multi-step flow a chevron, "something that would typically be static", morphs while the view moves, which "clarifies the navigation action taken".

## Numbers

A changing number rolls to its value on an ease-out without overshoot, and the label settles after it lands. With Motion's free API:

```tsx
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

export function Count({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: ease.out });   // retargets from wherever it is
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</motion.span>;
}
```

`tabular-nums` keeps the width steady while digits change. Digit-by-digit rolling counters exist as paid components (Motion+ `AnimateNumber`) and free ones (NumberFlow). A counter or progress bar that chases a value arriving in chunks is in [MATH.md](MATH.md#exponential-approach-chase-a-target-that-moves).

- **A label that marks a step in commitment morphs:** Family's "Continue" becomes "Confirm" through the shared "Con", because an instant change "could leave the user unaware of the significant step they're about to take". The text-morph component is in the `app-ui` skill's [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md).

## Live values and charts

See [live values and charts](LIVE-CHARTS.md) for the complete recipe.

## Gestures: drag, throw, snap

```tsx
const x = useMotionValue(0);                                  // slideWidth, maxOffset: from the measured track

<motion.div
  drag="x"
  dragConstraints={{ left: -maxOffset, right: 0 }}
  dragElastic={0.12}                                          // resistance past the edge instead of a hard stop
  onDragEnd={(_, info) => {
    const projected = x.get() + info.velocity.x * 0.2;        // where the throw would carry it
    const snapped = Math.round(projected / slideWidth) * slideWidth;
    animate(x, clamp(snapped, -maxOffset, 0),
      { type: "spring", stiffness: 300, damping: 30, velocity: info.velocity.x }); // physics spring: keeps the throw
  }}
  style={{ x }}
/>
```

Snap to where the throw was heading (position plus velocity), not to the nearest slide from the release point, or a flick lands back where it started. Keep keyboard and buttons working for the same moves.

- **Corrected: the settle is a physics spring.** This snippet used `spring.shape`, a duration-based spring, and by motion.dev duration-based springs don't take the throw's velocity ([motion.dev](https://motion.dev/docs/animate); quoted in [GESTURES.md](GESTURES.md#hand-the-release-velocity-to-a-physics-spring)). The 300/30 values are Craft's sheet spring.
- Pointer capture, the second finger, the 0.11 px/ms flick, hysteresis and the release spring in full: [GESTURES.md](GESTURES.md).

- **A scroll that starts on a row doesn't toggle it:** Kiem's list-row toggles record the pointer position on `pointerdown` (primary pointer only), count the click as a tap only if `Math.hypot(dx, dy) <= 12` px at `pointerup`, cancel on `pointercancel`, and in `onClick` ignore non-taps but always accept keyboard clicks (`e.detail === 0`):

```js
onClick:e=>{let t=i.current;i.current=!1,!(e.detail!==0&&!t)&&n()}
```

## Scroll-linked motion

- **Driven by scroll, not triggered by it:** `const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })`, then `useTransform(scrollYProgress, [0, 1], [40, -40])` into `style`; no re-renders, and it scrubs both ways. In CSS, `animation-timeline: view()` does the same on the compositor where supported; inside a clipped scroller, `view-timeline-inset` moves where the timeline starts (the swipeable sheet's `0 100dvh` in [SHEETS.md](SHEETS.md)).
- **Reveal once, quietly:** content appearing as it scrolls in takes 8-16 px and 300-500 ms once, not on every pass, and never hides content a fast scroller or a search crawler needs.
- Parallax stays small (a few percent of the scroll distance) and turns off with reduced motion.

## Galleries, carousels and rings

See [galleries, carousels and rings](COLLECTIONS.md) for the complete recipe.

## Delight: where flourish goes

Family's delight-impact curve: "the potential for delight increases as the frequency of feature usage decreases", and "the 'specialness of a moment' generally decreases with repeated encounters". "Mastering delight is mastering selective emphasis": where, when and how intensely.

- **Rare, significant moments get marked:** creating a new wallet gets "an interactive animation that marks the occasion"; confetti briefly fills the screen after a successful backup, rewarding "an essential security task".
- **Easter eggs go where a feature is used just enough** to be "enjoyable rather than annoying", hidden in plain sight: a tap on the QR code sends "a gentle ripple", a swipe turns its dots into sequins.
- **Frequent flows get small touches only,** "efficient and enjoyable, without being overbearing": the commas shift place as an amount is typed; an easter egg appears when it exceeds the balance.
- **Delight can carry information:** stealth mode's "gentle shimmer effect" says the hidden values "continue to update discreetly in the background".
- **A first-use empty state can point:** Family's in-app browser greets users with an animated arrow toward creating a new tab.
- **Completion can be physical and heard:** deleted tokens "visually tumble into a skeuomorphic trash can", and finishing plays a sound. Honk's team often designed a feature first, then had the sound designer "compose audio to precisely match the timing of each interaction".
- **Both ways on decoration:** [SKILL.md](SKILL.md) rule 1 calls motion with no change to explain decoration, to cut or keep subliminal. Family adds motion whose purpose is surprise, placed by frequency; Honk went further: "Not everything needed a purpose. Sometimes, the fun was in just seeing what would happen", and its own footnote records that some saw the playful interactions "as a waste of time, while others loved them. Both takes are valid."

## Tells of template motion

Everything fading up on scroll; a uniform 0.5 s ease on every element; the same entrance for a toast, a modal and a page; bouncy springs on serious content; staggers that make the last item wait over a second; a spinner on every action; hover states that move layout; an icon change done as a crossfade of two SVGs when the shapes could transform ("There's no sense of transformation"); particles with machine-perfect speeds and angles ([MATH.md](MATH.md#controlled-randomness)). Each is a missing decision about what changed.

## Prove it

Use the [shared motion review](SKILL.md#prove-it), then the dedicated checks for [gestures](GESTURES.md#prove-it), [reveals](REVEALS.md#prove-it), [toasts and tooltips](TOASTS-AND-TOOLTIPS.md#prove-it), [live charts](LIVE-CHARTS.md#prove-it) or [collections](COLLECTIONS.md#prove-it) when that pattern is involved. [ui-animation, existing pattern and review sources]
