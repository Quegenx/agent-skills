# Component details that hold up

Small things a design system usually gets slightly wrong, and that show once the product grows: on a new background, in a new language, after a thousand presses. Motion for presses and switches is in the `ui-animation` skill's PATTERNS.md.

**Contents:** [Avatar groups](#avatar-groups) · [Stacking](#stacking-without-z-index-wars) · [Gradient scrims](#gradient-scrims-over-images) · [Pressed states](#pressed-states) · [Optical alignment](#optical-alignment) · [Nested corners](#nested-corners) · [Surfaces and image outlines](#surfaces-and-image-outlines) · [Spacing that groups](#spacing-that-groups) · [Scrollbars](#scrollbars) · [A review prompt](#a-review-prompt) · [Show the product in use](#show-the-product-in-use) · [Report pages](#report-and-evidence-page-layout) · [Design lint rules](#design-lint-rules)

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

- **A fixed-pixel edge instead of `99%`/`100%`:** Argyle's ring mask puts the opaque stop 1px past the transparent one ([modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#conic-recipes)).
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
  - **The other view:** "Need to beat `z-index: 999999999` or something?" Argyle offers `z-index: calc(infinity)`; the observed `2147483647` ceiling is not a universal CSS constant. The old line called it the maximum without that qualification; see the official numeric-range correction in [modern-css CSS-INFINITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CSS-INFINITY.md#calcinfinity). This is the source's stacking alternative ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25); it cannot escape the stacking context, as the toolbar case below shows.
- **What starts a stacking context without asking:** "Properties that silently create stacking contexts (trapping z-index): `opacity < 1`, any `transform`, `filter`, `will-change`, `position: sticky/fixed`, `mix-blend-mode`, `clip-path`, `isolation: isolate`" [responsive-craft]. MDN's list is longer: a `z-index` other than `auto` on an absolute or relative element or on a flex or grid item, `container-type: size` or `inline-size`, `scale`, `rotate`, `translate`, `backdrop-filter`, `perspective`, `mask`, `contain: layout` or `paint` (and `strict`, `content`), the top layer and its `::backdrop`, and properties animated in `@keyframes` with `animation-fill-mode: forwards`; `will-change` counts only for "any property that would create a stacking context on non-initial value" ([Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)).
- **A fixed element that stops being fixed:** "Any `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform` on an ancestor creates a new containing block for `position: fixed` children" [responsive-craft], so a fixed button positions against that ancestor, not the viewport. MDN's list adds `rotate`, `scale` and `translate`, "A `contain` value of `layout`, `paint`, `strict` or `content`", and "A `content-visibility` value of `auto`", and notes "browser inconsistencies with `perspective` and `filter` contributing to containing block formation" ([Layout and the containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block)).
- **The frame that clips must be the containing block:** "`overflow: hidden` only clips an absolutely positioned descendant when the clipping element is itself positioned" [flornkm, webgl-components]; the bug, the fix and the CSS 2.2 rule are in [webgl WIDGETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/WIDGETS.md#the-fallback-is-a-production-surface).
- **Why 9999 loses (Kiem's demo):** a toolbar at `position: absolute; z-index: 1`, the content card below it at `z-index: 2`, and the toolbar's open menu at `z-index: 9999`. The menu still renders under the card: the toolbar's `z-index: 1` makes it a stacking context the 9999 can't escape. His version with no z-index moves the toolbar after the content in the DOM while its menu is open (`children: l ? [f, d] : [d, f]`, content then toolbar), and back only once the menu's exit animation finishes (`AnimatePresence` `onExitComplete`).
- **Layers that must float (menus, popovers, toasts, dialogs)** go to the top layer: the `popover` attribute and `<dialog>` with `showModal()` render above everything with no z-index at all, or a portal to the end of `body`.
  - **A library toast stack is not in the top layer.** Sonner's toaster sits at `z-index: 999999999`, so a `<dialog>` opened with `showModal()` paints over it whatever the number, and the ask-sonner skill's fix for a toast behind a modal ("Move `<Toaster />` to the document root") doesn't help against it: top-layer elements render above the rest of the document ([MDN: top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)). The library itself is in the [sonner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md) skill.
  - **A component can put itself there** on connect, which retired VisBug's max-int layer tokens: [modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md#a-component-that-puts-itself-in-the-top-layer), with support, DevTools' `#top-layer` node, animating them in and out, and light dismiss with `closedby`.
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

Check contrast at the worst spot under the text ([color-system scripts/contrast.py](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/scripts/contrast.py)), not at the darkest part of the scrim.

**A caption scrim that follows the theme, no script:** Argyle's `light-dark()` with `border-image: fill` ([modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#borders-scrims-and-shadows)). It paints one translucent colour, not an eased ramp.

## Pressed states

- **Every pressable element has a pressed state,** not only hover. On touch there is no hover; the press is the only feedback.
- **Rank them:** rest, then hover, then pressed, each step stronger than the last (a darker tone, a smaller scale). A press that looks like the hover feels like nothing happened.
- **Match the brand:** a playful product can move (scale down slightly); a professional tool shifts tone instead. Either way it is subtle and fast, because some buttons are pressed hundreds of times a day.
- **Release slower than the press.** Kiem's tone-only press goes in over 90ms and back over 240ms (`[transition:background-color_240ms_ease-out] active:[transition:background-color_90ms_ease-out]`): rest `oklch(0.27 0 0)`, hover lighter at `oklch(0.31 0 0)`, pressed darker at `oklch(0.16 0 0)`.
- **One transition both ways, the other view:** Emil Kowalski's mobile-native presses with `transition: transform 100ms var(--ease-out), background 100ms` and "Keep press feedback at 100 to 160ms and `ease-out`" [Emil Kowalski, mobile-native]; Kiem releases slower than he presses. Both are in use.
- **Touch hygiene on pressables:** Kiem's demo button, switch and menu items carry `touch-manipulation select-none`; the button and switch add `[-webkit-tap-highlight-color:transparent]`.
  - **Why `touch-action: manipulation`:** WebKit: "single taps on an element with touch-action: manipulation are fast for all zoom scales", and it applies when "any of the element's ancestors" has it; without it, a device-width page gets fast taps only "when the user is at initial scale" ([WebKit: More Responsive Tapping on iOS](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)). mobile-native's version, "iOS Safari still delays on some elements", is vaguer.
  - **Safari needs the prefix:** `user-select: none; -webkit-user-select: none; /* Safari still needs the prefix */` plus `-webkit-touch-callout: none` on controls [Emil Kowalski, mobile-native]; MDN marks `user-select` Limited availability ([user-select](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/user-select)). Tailwind 4's `select-none` emits both ([utilities.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/utilities.ts)). "Never put `user-select: none` on `body`. Users copy addresses, error messages, and order numbers; that is content" [Emil Kowalski, mobile-native].
  - **Press on pointer-down:** "A web button that only changes on `click` responds when your finger *leaves*, which reads as lag even at 0ms. Style `:active`, and if you need JavaScript, listen to `pointerdown`, not `click`" [Emil Kowalski, mobile-native]. A disabled button doesn't press: `.button:active:not(:disabled)` [Craft].
- Test on a real phone: some mobile browsers show `:active` only when the element (or the page) has a touch listener (Kiem's demo button carries `onTouchStart: () => {}`). MDN's compat note: "By default, Safari on iOS does not use the `:active` state unless there is a `touchstart`" listener ([:active](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active)). Craft's one-liner for a plain page, "Frameworks like React already do": `button.addEventListener("touchstart", () => {}, { passive: true });` [Craft].

## Optical alignment

Geometry centres the box; the eye centres the weight.

- **Icon-side padding:** "Start the icon side at `2px` less padding than the text side, then judge by eye" (`padding-inline-start: 16px; padding-inline-end: 14px`, Tailwind `ps-4 pe-3.5`) [Jakub Krehel, better-ui]. app-ui does the same: "the icon side of a button gets about 2px less padding than the label side".
- **Play triangles:** "A triangle's geometric center sits left of its visual center, so shift it toward its point" [Jakub Krehel, better-ui]:
  ```css
  .play-button svg {
    transform: translateX(2px); /* physical on purpose: playback icons never mirror */
  }
  ```
  make-interfaces-feel-better writes `margin-left: 2px`. Craft's prose says the play icon "moves left" while its code shifts it right by 1px (`translateX(1px)`); the code agrees with the rule above. Media playback stays left to right in RTL ([modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md#icons-in-right-to-left)).
- **Asymmetric icons:** "Stars, arrows and carets carry uneven visual weight. Fix the `viewBox` or path in the SVG, so the component needs no extra offset. Where the asset cannot change, nudge its wrapper" (`<span className="translate-x-px">`) [Jakub Krehel, better-ui]. Craft moves the star and the download icon up a bit: "this is a per icon decision, not a global rule" [Craft].
- **The blur test:** "Add a heavy `filter: blur()` to it in the inspector, or squint at it, and the shape collapses into a soft blob of ink. The blob sits where the icon's visual weight is, not where its bounding box is, so if it lands off the center of the button the nudge you need is the distance back" [Craft].
- **Shape weight:** "when a circle or triangle is drawn inside the same box as a square, it appears smaller to the eye" [Craft].

## Nested corners

- **The formula:** `outerRadius = innerRadius + padding + borderWidth`; a card at 20px radius with 8px padding holds a 12px inner, and `rounded-2xl p-2` holds `rounded-lg`. "Past `24px` of padding, or where the padding is deliberately asymmetric, treat the layers as separate surfaces and keep each one's radius token" [Jakub Krehel, better-ui].
- **Clamp at zero:** "The inner radius cannot go below zero. If the inset is larger than the outer radius, use a square inner corner. In CSS, `max()` can handle that limit for you" [Craft]; fluid-functionalism writes it `inner = max(0, outer - inset - border)` [fluid-functionalism].
- **Tune by eye:** "Tune the result by eye when the inset changes around the component, the inner element does not reach the corner, or the surfaces use different corner shapes" [Craft].
- **Popups keep their radius:** in fluid-functionalism's pill mode, dropdowns and selects keep the smaller rounded radii, because "heavy pill bubbling distorts perceived padding at this scale and produces corner-shadow asymmetry" [fluid-functionalism].
- app-ui does it without the border term: "an element inset in a rounded one gets the outer radius minus the inset (a 14px chip with 6px padding holds an 8px pill)" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).

## Surfaces and image outlines

- **Shadows for elevation, borders for structure** [Jakub Krehel, better-ui]: a border that exists only for depth becomes layered transparent shadows; dividers, table cells, selected states and form inputs keep borders. The recipe, verbatim in its three blocks (the owner's units rule allows px for shadows). Light mode, "Three layers. The first acts as a 1px ring, the second adds lift and the third ambient depth":
  ```css
  :root {
    --shadow-border:
      0px 0px 0px 1px oklch(0 0 0 / 0.06),
      0px 1px 2px -1px oklch(0 0 0 / 0.06),
      0px 2px 4px 0px oklch(0 0 0 / 0.04);
    --shadow-border-hover:
      0px 0px 0px 1px oklch(0 0 0 / 0.08),
      0px 1px 2px -1px oklch(0 0 0 / 0.08),
      0px 2px 4px 0px oklch(0 0 0 / 0.06);
  }
  ```
  "Depth shadows vanish on dark backgrounds, so dark mode keeps one white ring":
  ```css
  /* Redefine under the project's dark selector */
  --shadow-border: 0 0 0 1px oklch(1 0 0 / 0.08);
  --shadow-border-hover: 0 0 0 1px oklch(1 0 0 / 0.13);
  ```
  Usage:
  ```css
  .card {
    border: 1px solid transparent; /* forced-colors mode drops box-shadow and paints this border */
    box-shadow: var(--shadow-border);
    transition-property: box-shadow;
    transition-duration: 150ms;
    transition-timing-function: ease-out;
  }

  .card:hover {
    box-shadow: var(--shadow-border-hover);
  }
  ```
  "The transparent border keeps the box the same size as the border it replaces." app-ui does otherwise: "**Shadows by job:** cards none", and better-ui itself counts a consistent no-shadow style as "a preference and not a finding".
- **Image outlines:** a 1px outline at 10%, black in light and white in dark, with `outline-offset: -1px` (app-ui's TOKENS.md has the same values). Why an outline: "A `border` sits between the padding and the margin, so it takes up space"; "Paint the line over the image, not around it" with a negative-offset outline or an inset `box-shadow` [Craft]. Strength: "Below about 5% the line disappears against the pale sky. Above about 20% it starts to look like a frame, and the eye reads it as a design element instead of a fix" [Craft]. "Avatars are where this matters most" [Craft]. Never tinted: never `outline-slate-*`, `outline-zinc-*`, `outline-neutral-*` or a palette near-black such as `#111827` [Jakub Krehel, better-ui], since "Tinted outlines pick up the surrounding surface color and read as dirt on the image edge" [Jakub Krehel, make-interfaces-feel-better].
  - **Logos, both ways:** better-ui says "Skip transparent artwork such as logos and illustrations"; fluid-functionalism's card logos do get the outline ("CardImage and CardMedia logos paint a 1px inset image outline over their outermost pixels") [fluid-functionalism].
- **Outline default, fill active:** where a set has both, "use them as a state pair, never interchangeably": outline for the default state in toolbars, rows and inline text; fill for "the active tab, a toggled bookmark or a liked heart". "An active tab swaps instantly" [Jakub Krehel, better-ui].

## Spacing that groups

better-layout's starting points, "only where the project has no spacing scale or density system; otherwise use its tokens" [Jakub Krehel, better-layout]. Its values are px; under the owner's units rule they port as rem (8px is .5rem, 12px .75rem, 16px 1rem, 24px 1.5rem).

- **Space first, lines last:** "Space groups first, background shapes second, separator lines last and only where space alone can't carry the structure." A separator stays a low-contrast hairline, never paired with "a large gap that already did the job".
- **2× between groups:** "The gap between groups is at least 2× the gap within one, so `8px` inside a group means `16px` or more between groups" (`.field-group { gap: 8px }`, `.form { gap: 24px }`).
- **Shared edges:** "Pick a small set of alignment edges and put everything on them. Use one project spacing step per level of nesting, where `16px` is a useful default." Its bad example puts three leading edges at 20, 14 and 24px.
- **Borderless controls need more room:** "start with `12px` between adjacent bordered or filled controls. Leave `24px` between the visible glyphs of borderless text and icon controls, counting each button's own padding." "Nothing marks where one borderless target ends and the next begins, so the space is the boundary." Hit areas never overlap.
- **Inset buttons from the edges:** full-width buttons stay inside the layout margins, "starting near `16px` inline on mobile" (`.action-bar { padding-inline: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }`), because "A button pressed against the viewport looks like system chrome and clips against curved corners and gesture zones." WebKit's view: "Safe area insets are not a replacement for margins", with `max()` so margin and inset don't stack ([WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)); better-layout's `calc()` adds them.
- app-ui decides its own: "Header 3.75rem over a divider" and "Footer: end-aligned pill buttons .5rem apart" ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md)).

## Scrollbars

fluid-functionalism keeps native scrolling on touch-primary devices and, elsewhere, nudges the thumb 2px off the container edge with a translate "but the track (and its 10px hit target) stays flush with the edge so edge-throws still land" [fluid-functionalism]. Its thumb rests 4px wide at 8%, grows to 6px and 12% on hover and 16% while dragging. The hairline a scroll fade can't draw lives on the parent's pseudo-elements, since "inside the scroller the fade's own mask would erase it at exactly the edge it marks". app-ui's bar is "a thumb at ink 18% (30% on hover) on no track".

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

What a linter can catch reliably goes in a linter, not in guidance (the decision tree is in skill-authoring's [skill-authoring WRITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/skill-authoring/WRITING.md)). Vercel's product-design lint rules, as examples: they "Prevent nested modals, which break focus management, keyboard navigation, and layering"; "Recommend radio buttons instead of a select for two or three static options, so every choice stays visible"; "Require accessible names for icon buttons and form controls, and reject custom focus rings that bypass shared focus tokens"; "Prevent `className` from overriding a design-system component's color, radius, or shadow while still allowing layout classes"; "Require `Modal.Body` so long content scrolls correctly and headers and footers can remain sticky"; "Replace raw shadows with theme-aware Material classes and reject borders that duplicate a Material's built-in treatment"; "Flag arbitrary spacing that falls off the 4px grid and suggest a standard utility when one exists." "Each rule explains why the pattern is a problem and suggests a concrete fix. Some rules autofix safe migrations, such as replacing deprecated Tailwind utility names." The owner's app has its own checker and decisions (a confirm opens over a sheet, no focus ring) in `app-ui`, which wins there.

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
