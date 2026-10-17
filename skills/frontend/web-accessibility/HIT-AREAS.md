# Hit areas

Target sizes, expanding hit areas without changing visual size, collision rules, decorative layers and drag alternatives. Source: [Jakub Krehel, better-accessibility, hit-areas.md], checked against [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

## Target sizes

[Jakub Krehel, better-accessibility]

| Standard | Minimum |
| --- | --- |
| WCAG 2.5.8 (AA) | 24×24 CSS px, with exceptions |
| WCAG 2.5.5 (AAA) | 44×44 CSS px |
| Apple HIG | 44×44pt |
| Material Design | 48×48dp |

Before reporting an undersized target, check the spacing, equivalent-control, inline, user-agent and essential exceptions.

Under the spacing exception, an undersized target passes when a 24px circle centered on its bounding box intersects no other target and no other undersized target's circle. In the simple case, 20px targets need a 4px gap.

Worked failure: carousel dots drawn as 6px dots in 18px round buttons that touch, 18px center to center, have intersecting 24px circles, so the row fails 2.5.8 unless an equivalent control (previous and next buttons) exists. [fluid-functionalism]

The visible element can stay small; the hit area is what must be big. Anything that looks clickable must be clickable across its whole visual extent.

Aim for 44×44px on touch and 40×40px on desktop where density permits. These are heuristics, not criteria: keep an established, usable density, and never report a target between 24px and 44px as a failure. anti-slop-ui's "tap targets about 44px" and e2e-testing's "tap targets 44x44 Apple, 48x48 Material" are the same heuristics; the AA floor is 24px.

## Expanding the hit area

[Jakub Krehel, better-accessibility]

Where the visible element is smaller, say a 20×20 checkbox, extend the hit area with a pseudo-element. Put it on a wrapping element or the `<button>`, never on the `<input>`, because form controls don't render `::before`/`::after` reliably.

### CSS example

```css
/* 20px checkbox with a 44px hit area, on the wrapper around the input */
.checkbox-control {
  position: relative;
  width: 20px;
  height: 20px;
}

.checkbox-control::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%; /* physical centering: direction-independent */
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
}
```

### Tailwind example

```tsx
<button
  aria-label="Mark done"
  className="relative size-5 after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2"
>
  <CheckIcon aria-hidden="true" />
</button>
```

### Layout alternative

Where the element can afford real box size, skip the pseudo-element and let the box be the target:

```css
.icon-button {
  min-width: 44px;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
}
```

## Collision rule

[Jakub Krehel, better-accessibility]

Where the extended hit area overlaps another interactive element, shrink the pseudo-element to the largest size that does not collide.

## Decorative layers

[Jakub Krehel, better-accessibility]

A decorative layer painted over interactive content absorbs every pointer event its box covers: a gradient scrim, a glow, a blurred sheen, a full-bleed `::after`. The control underneath looks live and does nothing, and no hit-area sizing fixes it.

Give each one `pointer-events: none` (Tailwind `pointer-events-none`) so events reach the control below. A layer that is an element rather than a pseudo-element also gets `aria-hidden="true"`:

```css
.card-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

Keep pointer events on any layer the user is meant to hit: a modal scrim that dismisses on click is a control, not decoration.

## Gestures and dragging

[Jakub Krehel, better-accessibility]

- Every drag needs a single-pointer alternative under 2.5.7 Dragging Movements (AA), such as move-up and move-down buttons on a sortable row, or a menu on a kanban card.
- A keyboard path is not that alternative. The criterion reads "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging", and Understanding 2.5.7 adds that "achieving keyboard equivalence for a dragging operation does not automatically meet this success criterion". Understanding 2.5.7's passing examples add an equivalent single-pointer option: "a color wheel where a color can be changed by dragging an indicator. In addition, text fields for the numerical input of color values", and a map that "has up/down/left/right buttons to move the view as well". [feel]'s rotary knob turns by drag or arrow keys only, so it fails; its toggle (a tap toggles) and drawer (a tap steps) pass.
- Every multipoint or path-based gesture, such as a pinch or a swipe, needs a single-pointer alternative under 2.5.1 Pointer Gestures.
- Set `touch-action: none` on a surface implementing its own pan, zoom or drag gestures, so the browser stops claiming them for scrolling and pinch-zoom. Scope it to that surface; at page level it removes scrolling.

## Prove it

Every target measures at least 24×24 CSS px in the browser's box model, or its 24px circle touches no other target or circle, or it meets a named exception; every visible control is clickable across its whole visible extent and no extended hit area overlaps a neighbour's; clicking through every glow, scrim or sheen reaches the control beneath unless the layer is meant to be hit; every drag, pinch and swipe can be done with single taps or clicks alone; and `touch-action: none` appears only on custom-gesture surfaces.
