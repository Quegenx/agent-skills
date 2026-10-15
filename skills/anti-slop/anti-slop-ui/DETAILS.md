# Component details that hold up

Small things a design system usually gets slightly wrong, and that show once the product grows: on a new background, in a new language, after a thousand presses. Motion for presses and switches is in the `ui-animation` skill's PATTERNS.md.

## Avatar groups

Separate overlapping avatars by **cutting each one where its neighbour overlaps**, not by a border. A border or ring only works when it is exactly the background colour, so it breaks the moment the group sits on a gradient, an image or a different surface; a cut-out lets whatever is behind show through the gap.

```css
.avatar-group { display: flex; }
.avatar {
  --size: 40px; --overlap: 12px; --gap: 3px;          /* gap: the visible space around the cut */
  inline-size: var(--size); block-size: var(--size);
  border-radius: 50%;
  display: grid; place-items: center; box-sizing: border-box;
}
.avatar + .avatar { margin-inline-start: calc(-1 * var(--overlap)); }
.avatar:not(:last-child) {
  /* a hole the size of the next avatar plus the gap, centred where the next one sits */
  mask: radial-gradient(circle calc(var(--size) / 2 + var(--gap))
        at calc(100% + var(--size) / 2 - var(--overlap)) 50%, #0000 99%, #000 100%);
  padding-inline-end: var(--overlap);                  /* centre the initials in the visible part */
}
```

- The initials sit in the uncut part, so they stay readable; check two-letter initials at the smallest size you ship.
- The cut position is physical (left to right). For right-to-left layouts, mirror the `at` position (`calc(-1 * var(--size) / 2 + var(--overlap))`), or set `direction` on the group and test both.
- One size and overlap per group, from tokens, so the maths stays true.

## Stacking without z-index wars

- **Order in the DOM first.** Among elements in the same stacking context, the later one paints on top. Most "it needs a z-index" cases are elements in the wrong order.
- **Contain instead of escalating.** `isolation: isolate` on a component starts a new stacking context, so its internal z-indexes can't fight the rest of the page. Escalating to `z-index: 9999` only moves the fight.
- **Layers that must float (menus, popovers, toasts, dialogs)** go to the top layer: the `popover` attribute and `<dialog>` with `showModal()` render above everything with no z-index at all, or a portal to the end of `body`.
- **When a z-index is unavoidable,** take it from a short named scale (`--z-dropdown`, `--z-sticky`, `--z-modal`), and leave a comment at the use saying why, so the next person or agent doesn't add another layer on top.
- Don't nest absolutely positioned elements without a reason; each layer of `position: absolute` is a coordinate system someone has to reason about.

## Gradient scrims over images

A linear fade from colour to transparent has a visible hard edge where it starts, so it needs more height to read well and covers more of the image. **Ease the gradient**: many stops whose opacity follows an ease curve. It reads smoother, keeps text readable in less height, and lets more of the image's own light through.

```ts
/** CSS for a scrim whose opacity follows an ease-in-out curve instead of a straight line. */
export function easedScrim(direction = "to top", rgb = "0 0 0", maxAlpha = 0.75, steps = 12): string {
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const stops = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return `rgb(${rgb} / ${(maxAlpha * (1 - easeInOut(t))).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
  });
  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}
```

Check contrast at the worst spot under the text (`scripts/contrast.py`), not at the darkest part of the scrim.

## Pressed states

- **Every pressable element has a pressed state,** not only hover. On touch there is no hover; the press is the only feedback.
- **Rank them:** rest, then hover, then pressed, each step stronger than the last (a darker tone, a smaller scale). A press that looks like the hover feels like nothing happened.
- **Match the brand:** a playful product can move (scale down slightly); a professional tool shifts tone instead. Either way it is subtle and fast, because some buttons are pressed hundreds of times a day.
- Test on a real phone: some mobile browsers show `:active` only when the element (or the page) has a touch listener.
