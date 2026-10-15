# Patterns

React with Motion (`motion/react`), and CSS where it's enough. Keep the transition presets from [TIMING.md](TIMING.md) in one module:

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

## Shared elements: a thumbnail becomes the detail

```tsx
<motion.img layoutId={`photo-${id}`} src={thumb} />           // in the grid
<motion.img layoutId={`photo-${id}`} src={full} />            // in the open view: Motion animates between the two boxes
```

- One `layoutId` per thing, present in one place at a time; wrap the views in `LayoutGroup` when they live in separate components that re-render independently.
- Text inside a growing container distorts while it scales; give the text its own `layout="position"`, or fade it in after the box arrives.
- **Across routes,** the View Transitions API does the same with no library: `document.startViewTransition(() => navigate(to))`, with matching `view-transition-name` on the two elements. Frameworks expose it (TanStack Router's `viewTransition` option, React's `<ViewTransition>`); without support, the change simply happens.
- Close to where it came from: the detail returns to the item's current position (it may have scrolled), not to a stale one.

## Modals, sheets, popovers

- **Grow from the trigger:** a popover scales from 0.96 to 1 with its `transform-origin` at the anchor side; a modal fades its backdrop (200 ms) and lifts the panel 8-16 px with `emphasized`; a sheet slides in from its edge with the `enter` spring and closes faster.
- **Focus moves with it:** into the dialog when it opens, back to the trigger when it closes; motion never delays focus or input.
- **Dismiss mid-animation:** Escape or a backdrop click during the entrance reverses from where it is.

## Height and accordions

Animating `height` runs layout every frame; fine for a small accordion, costly for a big panel. Two cheaper options:

```css
/* CSS: animate grid rows from 0fr to 1fr, no measuring */
.accordion { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms var(--ease-out); }
.accordion[data-open="true"] { grid-template-rows: 1fr; }
.accordion > div { overflow: hidden; }
```

Or in Motion, `animate={{ height: open ? "auto" : 0 }}` for small content, and `layout` on the surrounding blocks so what's below moves with transforms.

## Buttons, presses and feedback

- Press: `whileTap={{ scale: 0.97 }}` with the `ui` spring; hover: a colour or shadow change, not a jump in size.
- **Feedback is instant, results can follow:** the press responds in the same frame. Data should already be there (prefetched on hover, cached from the last visit); when it isn't, a skeleton that matches the final layout, so nothing shifts when content arrives, never a spinner. For an action, update optimistically; a progress indicator appears only after about 300 ms (a fast response never flashes one) and only when the outcome can't be shown in advance. Loading states as a whole are in the `performance-and-caching` skill's BROWSER.md.
- Success lands once (a check that draws in 200-300 ms), errors shake horizontally 2-3 times over 300-400 ms with no bounce, and the message stays.

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

`tabular-nums` keeps the width steady while digits change. Digit-by-digit rolling counters exist as paid components (Motion+ `AnimateNumber`) and free ones (NumberFlow).

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
    animate(x, clamp(snapped, -maxOffset, 0), spring.shape); // the spring starts with the release velocity
  }}
  style={{ x }}
/>
```

Snap to where the throw was heading (position plus velocity), not to the nearest slide from the release point, or a flick lands back where it started. Keep keyboard and buttons working for the same moves.

## Scroll-linked motion

- **Driven by scroll, not triggered by it:** `const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })`, then `useTransform(scrollYProgress, [0, 1], [40, -40])` into `style`; no re-renders, and it scrubs both ways. In CSS, `animation-timeline: view()` does the same on the compositor where supported.
- **Reveal once, quietly:** content appearing as it scrolls in takes 8-16 px and 300-500 ms once, not on every pass, and never hides content a fast scroller or a search crawler needs.
- Parallax stays small (a few percent of the scroll distance) and turns off with reduced motion.

## Galleries, carousels and rings

A collection is one function: each item's pose from its offset to the focus (`index - focus`, fractional while it moves). Store poses as separate numbers (x, y, z, three rotations, scale, opacity) and blend value by value, angles the short way round; never blend transform matrices or strings, which swing along odd paths when an item goes from a curve to flat.

```ts
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpAngle = (a: number, b: number, p: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * p;
type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; o: number };
const pose = (o: Partial<Pose> = {}): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, ...o });
const blend = (A: Pose, B: Pose, p: number): Pose => ({
  x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), z: lerp(A.z, B.z, p),
  rx: lerpAngle(A.rx, B.rx, p), ry: lerpAngle(A.ry, B.ry, p), rz: lerpAngle(A.rz, B.rz, p),
  s: lerp(A.s, B.s, p), o: lerp(A.o, B.o, p),
});
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const layouts = {
  row: (d: number) => pose({ x: d * 260 }),
  coverflow: (d: number) => {
    const near = clamp(d, -1, 1);                                       // neighbours turn, the rest stack flat behind
    return pose({ x: near * 200 + (d - near) * 90, z: -Math.abs(near) * 180, ry: -near * 55 });
  },
};
```

- **Change layout from wherever the items are:** evaluate both layouts at the item's current offset and blend with one eased progress; it can start mid-drag.
- **No crossing paths:** keep every layout ordered along the offset, and a change of shape moves the group in one direction.
- **Endless with a dozen items:** wrap the offset into a window around the focus, `((((i - focus) % n) + n + n / 2) % n) - n / 2`, and fade items to zero over the last unit before the edge, so the one that jumps sides is invisible.
- **Lean into speed:** tilt each item by the collection's velocity (`clamp(v * 14, -40, 40)` degrees), so a throw leans and settles.
- **Opening one item:** blend its pose toward the flat detail box, rotations finishing in the first half and the item lifting toward the viewer early, so it untwists clear of its neighbours; load the full-size image on press, swap it in after it decodes.
- Drive the poses with motion values (`useMotionValue` for focus, `useTransform` per item), not React state; keep items real `img` and `li` elements with alt text and keyboard focus.

## Tells of template motion

Everything fading up on scroll; a uniform 0.5 s ease on every element; the same entrance for a toast, a modal and a page; bouncy springs on serious content; staggers that make the last item wait over a second; a spinner on every action; hover states that move layout. Each is a missing decision about what changed.
