# Animated collections

The collection recipe from this skill's pattern catalogue: derive each item's pose from its offset to the focus. The generic drag, throw and snap recipe stays in [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap); interpolation math is in [MATH.md](MATH.md).

## Galleries, carousels and rings

[agent-skills, ui-animation/PATTERNS.md at d4888ce] A collection is one function: each item's pose from its offset to the focus (`index - focus`, fractional while it moves). Store poses as separate numbers (x, y, z, three rotations, scale, opacity) and blend value by value, angles the short way round; never blend transform matrices or strings, which swing along odd paths when an item goes from a curve to flat.

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

## Prove it

Use the existing [gesture checks](GESTURES.md#prove-it) and [motion review](SKILL.md#prove-it) for throws, interruption and state changes. The ordered poses, invisible wrap, decoded detail image and accessible DOM constraints above remain part of the collection recipe. [ui-animation, existing collection recipe]
