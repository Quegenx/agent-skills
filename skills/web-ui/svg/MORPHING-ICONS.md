# Morphing icons

A line-based icon set where any icon morphs into any other, from Benji Taylor's "Morphing icons with Claude" and the `MorphingIcon` component shipped on that page. One structural constraint makes it work: every icon is exactly three SVG `<line>`s, so every pair shares the same underlying structure. Icons that are the same shape at different angles rotate instead of morphing. The first attempt was an `AnimatePresence` wrapper that crossfades between SVGs: "Technically correct, but not what I had in mind. The icons fade out and fade in. There's no sense of *transformation*." The component tweens the line endpoints (`x1`, `y1`, `x2`, `y2`) with Motion; per Motion's docs these are attributes CSS can't animate ([CSS-ANIMATION.md](CSS-ANIMATION.md#the-ways-to-animate-svg)). Durations and curves in general: [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).

## Three lines per icon

- **Every icon uses exactly three `<line>`s.** In the author's words: "Every icon should use exactly three SVG lines. Icons that need fewer collapse the extras to invisible points. This means any icon can morph into any other, since they share the same underlying structure."
- **A collapsed line is a point at the center,** `{ x1: 7, y1: 7, x2: 7, y2: 7 }`, with `opacity: 0` so no dot shows. Detection is an exact match on all four coordinates, and each line animates `{ ...coords, opacity: isCollapsed ? 0 : 1 }`:

```js
const isCollapsed = (l) => l.x1 === 7 && l.y1 === 7 && l.x2 === 7 && l.y2 === 7;
```

- **A zero-length line with a round cap is a dot** ([SHAPES-AND-TEXT.md](SHAPES-AND-TEXT.md#stroke-linecap)). "more" is three zero-length lines: `{3.5,7,3.5,7}`, `{7,7.01,7,7.01}`, `{10.5,7,10.5,7}`. The middle dot sits at y 7.01, so the exact-match collapse test doesn't match it and it keeps `opacity: 1` (the code has no comment on why 7.01).
- **How shapes map onto three lines:** menu is three horizontal bars; plus is vertical plus horizontal with the third line collapsed; cross is plus rotated 45°; check uses two lines for its legs and collapses the third; play is three lines forming a triangle, each sharing endpoints with the others. Play to pause: one line collapses while the other two separate into parallel bars (pause's collapsed line is index 1, play's bottom diagonal).
- **Lines are keyed by index** (0, 1, 2), so line i of one icon always morphs into line i of the next. Which line sits in which slot decides the intermediate shapes.
- **The canvas:** `viewBox="0 0 14 14"`, center (7, 7), `stroke="currentColor"`, `strokeWidth="1.5"`, `strokeLinecap="round"`, `fill="none"`, `overflow: visible`, `display: block`. Size is a prop (default 14); the demos render at 16, 20, 24, 28, 32 and 48.

## The icon table

Group, three lines as x1, y1, x2, y2, and rotation, as shipped:

```js
const arrowLines   = [{x1:3,y1:7,x2:11,y2:7},{x1:7,y1:3,x2:11,y2:7},{x1:7,y1:11,x2:11,y2:7}];
const chevronLines = [{x1:7,y1:7,x2:7,y2:7},{x1:5,y1:3,x2:9,y2:7},{x1:5,y1:11,x2:9,y2:7}];
const plusLines    = [{x1:7,y1:3,x2:7,y2:11},{x1:3,y1:7,x2:11,y2:7},{x1:7,y1:7,x2:7,y2:7}];
const icons = {
  "arrow-right":{group:"arrow",lines:arrowLines,rotation:0},
  "arrow-down":{group:"arrow",lines:arrowLines,rotation:90},
  "arrow-left":{group:"arrow",lines:arrowLines,rotation:180},
  "arrow-up":{group:"arrow",lines:arrowLines,rotation:270},
  "chevron-right":{group:"chevron",lines:chevronLines,rotation:0},
  "chevron-down":{group:"chevron",lines:chevronLines,rotation:90},
  "chevron-left":{group:"chevron",lines:chevronLines,rotation:180},
  "chevron-up":{group:"chevron",lines:chevronLines,rotation:270},
  plus:{group:"plus-cross",lines:plusLines,rotation:0},
  cross:{group:"plus-cross",lines:plusLines,rotation:45},
  check:{group:"check",lines:[{x1:2.5,y1:7,x2:5.5,y2:10.5},{x1:5.5,y1:10.5,x2:11.5,y2:4},{x1:7,y1:7,x2:7,y2:7}],rotation:0},
  minus:{group:"minus",lines:[{x1:7,y1:7,x2:7,y2:7},{x1:3,y1:7,x2:11,y2:7},{x1:7,y1:7,x2:7,y2:7}],rotation:0},
  play:{group:"play",lines:[{x1:4,y1:3,x2:4,y2:11},{x1:4,y1:11,x2:11,y2:7},{x1:4,y1:3,x2:11,y2:7}],rotation:0},
  pause:{group:"pause",lines:[{x1:4.5,y1:3.5,x2:4.5,y2:10.5},{x1:7,y1:7,x2:7,y2:7},{x1:9.5,y1:3.5,x2:9.5,y2:10.5}],rotation:0},
  menu:{group:"menu",lines:[{x1:2.5,y1:4,x2:11.5,y2:4},{x1:2.5,y1:7,x2:11.5,y2:7},{x1:2.5,y1:10,x2:11.5,y2:10}],rotation:0},
  download:{group:"download",lines:[{x1:3.5,y1:11,x2:10.5,y2:11},{x1:10,y1:6,x2:7,y2:9},{x1:4,y1:6,x2:7,y2:9}],rotation:0},
  upload:{group:"upload",lines:[{x1:3.5,y1:11,x2:10.5,y2:11},{x1:4,y1:8,x2:7,y2:5},{x1:10,y1:8,x2:7,y2:5}],rotation:0},
  external:{group:"external",lines:[{x1:4,y1:10,x2:10,y2:4},{x1:5.5,y1:4,x2:10,y2:4},{x1:10,y1:4,x2:10,y2:8.5}],rotation:0},
  more:{group:"more",lines:[{x1:3.5,y1:7,x2:3.5,y2:7},{x1:7,y1:7.01,x2:7,y2:7.01},{x1:10.5,y1:7,x2:10.5,y2:7}],rotation:0},
  asterisk:{group:"asterisk",lines:[{x1:7,y1:2.5,x2:7,y2:11.5},{x1:3,y1:4.5,x2:11,y2:9.5},{x1:3,y1:9.5,x2:11,y2:4.5}],rotation:0},
  equals:{group:"bars",lines:[{x1:3,y1:9,x2:11,y2:9},{x1:7,y1:7,x2:7,y2:7},{x1:3,y1:5,x2:11,y2:5}],rotation:0},
};
icons.arrow = icons["arrow-right"];
```

The article counts "Twenty-one icons": the table's 21 entries, plus the `arrow` alias.

## Rotating twins

- **Rotation groups:** icons that are the same shape at different angles share coordinates and differ only by a rotation, so moving between them rotates the whole icon instead of morphing coordinates. Arrows: four directions, 90° apart. Chevrons: the arrow without its shaft, 90° apart. Plus and cross: the same perpendicular lines, 45° apart.
- **Why:** morphing arrow-right to arrow-down coordinates "looked janky… the lines bend and warp. When you rotate, it just works." The author adds: "This is the sort of thing you only notice by playing with it."

## Cross-group morphs and the transition

- **Between groups,** the line endpoints interpolate through coordinate space, tweened by Motion.
- **The algorithm** (the shipped logic, names de-minified):

```js
const rotateLines = (lines, deg) => {            // bake a rotation about (7,7) into the coordinates
  if (deg === 0) return lines;
  const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  const rot = (x, y) => ({ x: 7 + (x - 7) * c - (y - 7) * s, y: 7 + (x - 7) * s + (y - 7) * c });
  return lines.map(l => { const a = rot(l.x1, l.y1), b = rot(l.x2, l.y2); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; });
};
// in the component: prevIcon = useRef(null), rotationRef = useRef(0)
if (prev && prev.group === next.group) {
  let delta = next.rotation - prev.rotation;
  if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;   // shortest way round
  rotate = rotationRef.current + delta;                                   // accumulate, never unwind
  lines = next.lines;                                                     // shared base coordinates
} else {
  rotate = 360 * Math.round(rotationRef.current / 360);                   // settle on the nearest whole turn
  lines = rotateLines(next.lines, next.rotation);                         // rotation baked into the endpoints
}
rotationRef.current = rotate; prevIcon.current = name;
// <motion.svg initial={false} animate={{ rotate }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
//   {lines.map((l, i) => <motion.line key={i} initial={false} animate={{ ...l, opacity: isCollapsed(l) ? 0 : 1 }}
//                          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} />)}
```

- **Within a group** the `<svg>` rotates and the lines keep the group's base coordinates. **Across groups** the svg's rotation settles on the nearest multiple of 360 (visually upright) while the lines morph to coordinates with the target's rotation already baked in, so a rotated arrow can morph into a check without spinning back through its accumulated angle.
- **Timing:** morph and rotation both run `duration: 0.3` on `ease: [0.32, 0.72, 0, 1]`, a tween, not a spring. ui-animation's [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) gives an icon swap 150 to 250 ms.
- **Nothing animates on first render:** `initial={false}` on the svg and on every line. An `animate={false}` prop renders a plain static `<svg>` with `transform: rotate(<rotation>deg)` and no Motion.
- **The architecture in one line:** "three lines per icon, rotation groups for same-shape icons, coordinate morphing for everything else."
- **Limits:** "With hundreds of possible icon pairs, not every transition takes the ideal path. Some morphs have slightly awkward intermediate states, and some rotations overshoot. Nothing that couldn't be fixed with more iteration."

## The starter prompt

The constraint, not the goal, is what the author gave Claude ("Smooth transitions" alone produced the crossfade). Verbatim:

> Build an icon component where any icon can smoothly morph into any other. Every icon should use exactly three SVG lines. Icons that need fewer lines collapse the extras to invisible center points. For icons that are the same shape at different rotations (like arrows), use rotation instead of coordinate morphing. Don't make mistakes plz!

Then: "From there, it's iteration. Play with the result, notice what's wrong, describe it, repeat." The author found Claude "couldn't tell when something looked wrong" and "optimised for *working* rather than *feeling right*", so the transitions had to be watched and what felt off described.

## Prove it

- **Every icon has exactly three lines;** collapsed lines sit at (7, 7) and show no dot, and the three dots of "more" all show.
- **Rotating twins rotate:** arrow-right to arrow-down turns the whole icon, with no lines bending or warping.
- **No unwinding:** after several arrow turns, a morph to check ends upright without spinning back through the accumulated angle.
- **First render is still:** the icon appears in place with no animation on mount.
- **Every pair is played:** a dev sequencer (click icons to add or remove them from a sequence, click the preview to cycle through it) plays the transitions, and the awkward pairs are found by watching them, not from the code.
