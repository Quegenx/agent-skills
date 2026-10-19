# Highlights and selection: one hover per list, weight that changes, merged selection

Three list behaviours from fluid-functionalism (mickadesign's React components on Motion): a single hover highlight that travels between rows, a label that grows bolder without pushing its neighbours, and checked rows that merge into one block. The owner's own sliding highlight is in app-ui ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#one-sliding-hover-highlight)); where the two differ it is said below.

## One hover highlight per list

- **The picking rule:** "an item the pointer is inside always wins; otherwise the item whose center is nearest does, so a cursor in a gap, in the container padding, or past the last row still lands. Ties keep the first item. Axes: `y` for lists, `x` for strips, `xy` for grids (Euclidean distance to centers)" [fluid-functionalism].
- **One element, moved by transform:** "a single absolutely positioned `bg-hover` element pinned to the container's padding corner, travelling on a transform (framer `x`/`y`) on `spring.fast`"; its width and height "only change when the target rect's size does" [fluid-functionalism].
- **A fresh entry fades in, it doesn't slide over:** a pointer session counter "increments on `onMouseEnter` and re-keys the highlight, so a fresh entry fades in at the nearest row instead of sliding over from wherever it was last"; `from` sets where it fades in (a dropdown's checked row, a nav's active route) [fluid-functionalism].
  - app-ui agrees on arriving in place and differs on `from`: "It fades out over the selected row (`data-active` or `aria-current="page"`), which has its own highlight" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#one-sliding-hover-highlight)).
- **What is lit is what a click hits:** a click in a gap, the padding or past the last row is sent as a real DOM `.click()` to the highlighted item's activator; clicks inside an item, on controls between rows and on disabled items are left alone, and `{maxDistance}` caps it (a card grid uses 16px) [fluid-functionalism].
- **Only click targets register:** "A row without `href`/`onClick` doesn't join - lighting it would promise a click with nowhere to land." Disabled rows stay registered but are skipped. "One list per group of alternatives": a divider between different kinds of rows means a new container [fluid-functionalism].
- **Gate it on measurement:** "an overlay mounted against a rect a later pass corrects animates from the wrong place to the right one, which reads as the highlight sliding in from another row." Measure in one rAF pass, retry up to 3 frames while a popup has no layout box, never publish zeroed rects, and "Never re-measure on `children` changes" [fluid-functionalism].
- **Reduced motion inside the component:** travel snaps and the 0.08s fade stays, "so an installed copy behaves correctly without the consumer wrapping their app in `MotionConfig`" [fluid-functionalism].
- **When not to:** "skip fluid hover when a wrong click would hurt, when only some items are clickable, when there is a lot of empty space around items, or when rows change place as you scroll" [fluid-functionalism].

## Weight that changes without reflow

"State changes (selected / checked / active / open) make text heavier; a heavier weight is wider; animating it on a bare text node reflows the layout. Reserve the width with an invisible copy at the heaviest weight while the visible copy animates `font-variation-settings`" [fluid-functionalism]:

```tsx
import { fontWeights } from "@/lib/font-weight";

<span className="inline-grid">
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{ fontVariationSettings: active ? fontWeights.semibold : fontWeights.normal }}
  >
    {label}
  </span>
  <span aria-hidden="true" className="col-start-1 row-start-1 invisible" style={{ fontVariationSettings: fontWeights.semibold }}>
    {label}
  </span>
</span>
```

- "The transition property list must include `font-variation-settings` (`transition-[color,font-variation-settings] duration-80`) - plain `transition-colors` snaps the weight." The pair is 400 to 550 [fluid-functionalism].
- **Bold for state, not for hover:** a card title bolds only when `selected`; "fluid hover previews via the highlight fill, not by bolding the label" [fluid-functionalism].
- **The cascade cost:** values set in `font-variation-settings` "will always override those set using the corresponding basic font properties … no matter where they appear in the cascade", and MDN calls it a low-level mechanism to use "only … when no basic properties exist" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variation-settings)). A later `font-weight` on the same text does nothing.
- The owner's app shares one grid cell between two texts the same way, sized by the taller ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)).

## Checked rows that merge into one block

- "Contiguous checked rows merge into one rounded selection block: indices group into runs with stable IDs (reused when any member overlaps the previous render) so framer morphs a growing/shrinking block instead of exit+re-enter" [fluid-functionalism].
- "Checking a row that bridges two runs plays a merge: both inner edges glide to the bridging row's midpoint, facing corners straightening to sharp, then swap to one block with no visible motion"; unchecking a middle row plays the reverse [fluid-functionalism].
- The edges ride a critically damped spring (0.16s) "so converging edges meet exactly instead of overshooting"; inner corners trail by 0.07s, staying rounded until the halves meet [fluid-functionalism].

## Prove it

Sweep the pointer down a list through the gaps: the highlight never blinks off and never slides in from a far row when the pointer re-enters. Click in a gap: the lit row activates. Toggle a selected label's weight: no neighbour moves by a pixel. Check rows 1 and 3, then row 2: the two blocks join into one without a jump.
