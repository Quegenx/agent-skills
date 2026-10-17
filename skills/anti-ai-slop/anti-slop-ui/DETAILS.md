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

- **A fixed-pixel edge instead of `99%`/`100%`:** Argyle's ring mask puts the opaque stop 1px past the transparent one ([GRADIENTS-AND-EFFECTS.md](../../frontend/modern-css/GRADIENTS-AND-EFFECTS.md#conic-recipes)).
- The initials sit in the uncut part, so they stay readable; check two-letter initials at the smallest size you ship.
- The cut position is physical (left to right). For right-to-left layouts, mirror the `at` position (`calc(-1 * var(--size) / 2 + var(--overlap))`), or set `direction` on the group and test both.
- One size and overlap per group, from tokens, so the maths stays true.
- **First avatar on top instead.** Florian Kiem's "Tips to improve your product" (floriankiem.com/writing/tips-to-improve-your-product) cuts each avatar except the first where the **previous** one sits, so the left one shows in front, DOM order stays left to right and no z-index is needed. His demo, a 64px SVG per avatar with a 25% overlap (`marginLeft: -16`), constants resolved:
  ```jsx
  <mask id={`${id}-body`}>
    <rect width="100%" height="100%" fill="black" />
    <circle cx={32} cy={32} r={32} fill="white" />
    <circle cx={-16} cy={32} r={35} fill="black" /> {/* previous avatar's centre; radius 32 plus a 3px gap */}
  </mask>
  <g mask={`url(#${id}-body)`}> {/* the fill circle and the initials */} </g>
  ```
- **A hairline ring that works on any background:** a 1px stroke in translucent ink, not the background colour (`stroke-black/20 dark:stroke-white/35`, circle `r` 31.5), masked out where the cut is (a white rect and a black circle at the previous centre, `r` 35.5). A second ring circle at the previous centre, `r` 35.5, clipped to the avatar (`clipPath` circle `r` 31.5), draws the edge of the bite, so every edge gets the hairline (Kiem's demo).
- **Optical or geometric centring.** On a cut avatar Kiem moves the initials from `x=32` to `x=36.75`: 4.75px on a 64px avatar with a 16px overlap, about 60% of the 8px a geometric shift would take. The CSS above shifts the geometric amount (half the overlap). Both are in use; judge it by eye at the smallest size.
- **Test it over a busy, moving backdrop:** Kiem's demo slides diagonal stripes behind the group, which proves the cut works off solid colours.

## Stacking without z-index wars

- **Order in the DOM first.** Among elements in the same stacking context, the later one paints on top. Most "it needs a z-index" cases are elements in the wrong order.
- **Contain instead of escalating.** `isolation: isolate` on a component starts a new stacking context, so its internal z-indexes can't fight the rest of the page. Escalating to `z-index: 9999` only moves the fight.
  - **The other view:** "Need to beat `z-index: 999999999` or something?" Argyle writes `z-index: calc(infinity)`, which maxes out at 2147483647 ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25). It wins the number, not the stacking context: the toolbar case below still loses.
- **Why 9999 loses (Kiem's demo):** a toolbar at `position: absolute; z-index: 1`, the content card below it at `z-index: 2`, and the toolbar's open menu at `z-index: 9999`. The menu still renders under the card: the toolbar's `z-index: 1` makes it a stacking context the 9999 can't escape. His version with no z-index moves the toolbar after the content in the DOM while its menu is open (`children: l ? [f, d] : [d, f]`, content then toolbar), and back only once the menu's exit animation finishes (`AnimatePresence` `onExitComplete`).
- **Layers that must float (menus, popovers, toasts, dialogs)** go to the top layer: the `popover` attribute and `<dialog>` with `showModal()` render above everything with no z-index at all, or a portal to the end of `body`.
  - **A component can put itself there** on connect, which retired VisBug's max-int layer tokens: [POPOVER-AND-DIALOG.md](../../frontend/modern-css/POPOVER-AND-DIALOG.md#a-component-that-puts-itself-in-the-top-layer), with support, DevTools' `#top-layer` node, animating them in and out, and light dismiss with `closedby`.
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

Kiem's demo eases the other axis: the alpha steps stay linear and the **stop positions** are eased, which leaves a near-solid band under the text (the first 23% holds 0.62 to 0.58), then a fall-off with a long tail. Black, 17 stops, max alpha 0.62, over the bottom 48% of a 3:2 card; `$c(n, 1)` is fully eased, `$c(n, 0)` linear. Verbatim from the page's bundle:

```js
var Wc=.62,Gc=16,Kc=16,qc=12,Jc=4,Yc=Array.from({length:17},(e,t)=>Wc*(1-t/Gc)),Xc=1.6,Zc=.2,
Qc=Yc.map((e,t)=>{if(t===0)return 0;let n=1-(1-t/Gc)**(1/Xc);return Zc+(1-Zc)*n});
function $c(e,t){let n=e/Gc;return n+(Qc[e]-n)*t}
function el(e){return`linear-gradient(to top, ${Yc.map((t,n)=>`rgb(0 0 0 / ${t.toFixed(4)}) ${($c(n,e)*100).toFixed(3)}%`).join(`, `)})`}
```

Check contrast at the worst spot under the text (`scripts/contrast.py`), not at the darkest part of the scrim.

**A caption scrim that follows the theme, no script:** Argyle's `light-dark()` with `border-image: fill` ([GRADIENTS-AND-EFFECTS.md](../../frontend/modern-css/GRADIENTS-AND-EFFECTS.md#borders-scrims-and-shadows)). It paints one translucent colour, not an eased ramp.

## Pressed states

- **Every pressable element has a pressed state,** not only hover. On touch there is no hover; the press is the only feedback.
- **Rank them:** rest, then hover, then pressed, each step stronger than the last (a darker tone, a smaller scale). A press that looks like the hover feels like nothing happened.
- **Match the brand:** a playful product can move (scale down slightly); a professional tool shifts tone instead. Either way it is subtle and fast, because some buttons are pressed hundreds of times a day.
- **Release slower than the press.** Kiem's tone-only press goes in over 90ms and back over 240ms (`[transition:background-color_240ms_ease-out] active:[transition:background-color_90ms_ease-out]`): rest `oklch(0.27 0 0)`, hover lighter at `oklch(0.31 0 0)`, pressed darker at `oklch(0.16 0 0)`.
- **Touch hygiene on pressables:** Kiem's demo button, switch and menu items carry `touch-manipulation select-none`; the button and switch add `[-webkit-tap-highlight-color:transparent]`.
- Test on a real phone: some mobile browsers show `:active` only when the element (or the page) has a touch listener (Kiem's demo button carries `onTouchStart: () => {}`).

## A review prompt

Kiem's cheat sheet, verbatim, to paste for an agent (the switch motion it checks is in the `ui-animation` skill's PATTERNS.md):

```md
Please check the UI details of our app:

Avatar groups

- Overlapping avatars are separated by clipping each one against its neighbour, not by a border
- Borders and outlines need the exact background colour, which breaks on gradients and images
- Keep initials readable inside the visible part of each avatar

Stacking

- Order elements in the DOM so that z-index is rarely needed
- Where z-index is unavoidable, leave a comment saying why
- Don't nest absolute positioning without a reason

Active states

- Every pressable element has a visible pressed state, not just hover
- Hover and press are ranked: the press is stronger than the hover
- Playful brands can move (scale down slightly), professional ones shift tone instead
- Users press these buttons hundreds of times a day, so keep it subtle and fast

Switches

- While held, stretch the thumb toward the side it will travel to
- Snap back quickly on release
- Match the weight of the motion to the brand

Gradients

- Ease gradients instead of using linear stops
- Use them over imagery so more of the image stays visible
- Eased gradients need less space to keep text readable
```

## Show the product in use

Software doesn't wear, it fills up: content is its patina. An empty or pristine screen looks unused, and unused reads as unproven. The marketing version of good software is always the used version. Florian Kiem's "Products that look better used" (floriankiem.com/writing/products-that-look-better-used): "Apple never shows an empty Messages app or empty activity rings, and Linear's landing page is full of half-done projects and open issues."

- **Screenshots, landing pages and demos show the product mid-use:** a list with a few half-done items, some unread, entries of uneven length, a project halfway through. Never an empty state, and never identical mock rows in perfect alignment (three "Task name" rows with the same length read as a design file, not a product).
- **Used, not neglected.** Use reads as evidence only up to a point; past it, wear reads "as neglect, not memories" (Kiem's dirty sneakers). A few overdue items and an unread badge say "lived in". Show the healthy middle.
- **Write the sample content for one believable person** doing the thing the product is for, so a visitor can picture their own use. Specific and slightly messy beats tidy and generic.
- **The honesty line:** sample content inside a product screenshot is illustration; claims are not (they follow "Real content or an honest placeholder" in [SKILL.md](SKILL.md)). Staged use still works: Aesop shows its tubes pressed, and "Even tho you can clearly see the imperfect version was rendered it still reminds me of myself using this product... Aesop is faking the evidence here, and it still works" (Kiem).
- **Design for accumulated use.** The most personal thing software can show is what the user has already done: a history, a streak, an activity heatmap, a progress ring, a year-in-review (Kiem names the GitHub contribution graph, Spotify Wrapped, Duolingo streaks and Strava heatmaps). Handed back, it becomes something to share: Wrapped "hands it back to you as something to share", and developers show the contribution graph off. A view that starts empty and gets better with every use gives people a reason to come back.


## Report and evidence page layout

Vercel's design.md, written for its formal report pages (reports, proposals, briefs, benchmarks, calculators); on a marketing site or in the app, `landing-page-ui` and `app-ui` decide.

- **Width by content.** On a 12-column desktop grid, "Reading prose normally occupies" 6 to 7 columns; "Tables, charts, calculators, diagrams, and major comparisons may use all 12." "Do not strand content in a narrow track while usable columns remain empty."
- **Unmistakable gutters:** "Wrapped headings, labels, and prose must not visually bridge from one column into the next."
- **Empty space is owned or it's a failure:** "Large empty rectangles caused by an underfilled split, orphaned third item, or delayed proof are layout failures. Reflow or rebalance them." "Do not force materially unequal findings into equal cells. Rank them, group them, or give the decisive finding more visual consequence so the geometry matches the argument."
- **Give every gap one owner.** "A published flow, stack, grid, or page-owned custom wrapper sets the gap; its children must not add competing default margins." "Do not repair one awkward transition with an arbitrary one-off margin; repair the grouping or spacing owner."
- **Readable prose:** "never use tiny gray copy to make density fit. Keep prose near" 60 to 68 "characters per line. Rewrite before shrinking."
- **Peers match:** "Equivalent peers always share role, size, weight, line-height, and numeric treatment; never resize one because its string is longer or its value is larger."

## Design lint rules

What a linter can catch reliably goes in a linter, not in guidance (the decision tree is in skill-authoring's [WRITING.md](../../ai-agents/skill-authoring/WRITING.md)). Vercel's product-design lint rules, as examples: they "Prevent nested modals, which break focus management, keyboard navigation, and layering"; "Recommend radio buttons instead of a select for two or three static options, so every choice stays visible"; "Require accessible names for icon buttons and form controls, and reject custom focus rings that bypass shared focus tokens"; "Prevent `className` from overriding a design-system component's color, radius, or shadow while still allowing layout classes"; "Require `Modal.Body` so long content scrolls correctly and headers and footers can remain sticky"; "Replace raw shadows with theme-aware Material classes and reject borders that duplicate a Material's built-in treatment"; "Flag arbitrary spacing that falls off the 4px grid and suggest a standard utility when one exists." "Each rule explains why the pattern is a problem and suggests a concrete fix. Some rules autofix safe migrations, such as replacing deprecated Tailwind utility names." The owner's app has its own checker and decisions (a confirm opens over a sheet, no focus ring) in `app-ui`, which wins there.

The radio rule, `prefer-radio-for-few-static-options.js` (the message's dash swapped for a colon):

```js
/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest Radio buttons when Select has 2-3 static options',
      category: 'Design System',
      recommended: true,
    },
    schema: [],
    messages: {
      preferRadio:
        'Select with {{ count }} static options. Consider using Radio buttons: they show all options at once without requiring a click to open.',
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (opening.name.type !== 'JSXIdentifier') return;
        if (opening.name.name !== 'Select') return;
        const hasDynamic = node.children.some(
          (child) =>
            child.type === 'JSXExpressionContainer' &&
            child.expression.type === 'CallExpression',
        );
        if (hasDynamic) return;
        const optionChildren = node.children.filter(
          (child) =>
            child.type === 'JSXElement' &&
            child.openingElement.name.type === 'JSXIdentifier' &&
            child.openingElement.name.name === 'option',
        );
        if (optionChildren.length < 2 || optionChildren.length > 3) return;
        context.report({
          node: opening,
          messageId: 'preferRadio',
          data: { count: String(optionChildren.length) },
        });
      },
    };
  },
};
```
