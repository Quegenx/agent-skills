# Layout

Flex and grid fixes that are easy to forget (intrinsic minimum sizes, shrinking, intrinsically responsive columns), grid and subgrid slots, stacking in one cell, a pointer to the circle layout with trig and `sibling-index()`, layering without `position: absolute`, balanced wrapping, centering, aspect ratios that follow orientation, and logical properties against physical ones. Source: Adam Argyle's nerdy.dev posts and notes (one bullet tagged [css-modern-features], rushenn/css-modern-features, MIT), with current support from MDN (checked 2026-10-17). Code is copied from the posts; where a post's code is outdated, the current form is given with the MDN link and the change is named. Units, fluid scales and container queries for whole layouts are in [RESPONSIVE.md](RESPONSIVE.md); container and style queries are in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md); anchoring one element to another is in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).

## Three unintuitive layout solutions

Adam's "least favorite, easy to forget, unintuitive CSS layout 'solutions'". `flex-shrink` and `min()` are Baseline widely available (since 2018-03-30 and 2023-01-28; [MDN flex-shrink](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/flex-shrink), [MDN min()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/min)). [nerdy.dev: 3 Unintuitive CSS Layout "Solutions"](https://nerdy.dev/3-unintuitive-layout-solutions) (2025-05-22)

- **Remove intrinsic minimum sizing.** "The minimum width of grid and flex children is `auto`. Setting it explicitly to `0` removes the intrinsic size, unlocking various things." Further reading named by the post: Chris Coyier's ["Preventing a Grid Blowout"](https://css-tricks.com/preventing-a-grid-blowout/).

```css
.example-1 {
  min-height: 0;
  min-width: 0;
}
```

- **Don't squish me.** In a flex row with one "pushy" child that takes most of the space, a sibling "goes oval at small viewports, even though a firm `height` and `width` are set". Stop it shrinking.

```css
.example-2 {
  flex-shrink: 0;
}
```

- **Intrinsically responsive grid columns.** `repeat(auto-fill, minmax(10rem, 1fr))` works until it is one column of 10rem boxes, which "can cause horizontal overflow in a parent container that's smaller than `10rem`". The fix: `min(10rem, 100%)` in place of `10rem`.

```css
.example-3 {
  grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr))
}
```

  The reason, quoted by the post from Evan Minto: "When the container is smaller than 10rem, the minimum value in our minmax() expression is set to the full width of the container, giving us a nice single-column view with no overflow. When the container is larger than 10rem, the minimum value is set to 10rem, so we get a responsive grid with equal tracks of at least 10rem each." anti-slop-ui's breakpoint-free grid is the same pattern with 15rem ([RESPONSIVE.md](RESPONSIVE.md)).

## Grid and subgrid

- **Layout slots by name.** "Grid and Subgrid layout slots with named areas are rad"; "Placing things by name like search, tab bar, and home bar can be sweet." Demo code not exported (CodePen gOKXKYQ). The 2022 note said "experiment in Canary, Safari Tech Preview or Firefox"; that is stale: subgrid is Baseline widely available since 2026-03-15 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid)), and `grid-template-areas` since 2020-04-17 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-areas)). [nerdy.dev: Subgrid Named Area Slots](https://nerdy.dev/subgrid-named-area-slots) (2022-12-01)
- **Subgrid is a value of `grid-template-rows` or `grid-template-columns`;** The CSS Podcast episode 64 covers basics, use cases, tips and gotchas ([listen](https://thecsspodcast.libsyn.com/64-subgrid)). [nerdy.dev: CSS Podcast On Subgrid](https://nerdy.dev/css-podcast-on-subgrid)
- **Align card parts across a row with subgrid** [css-modern-features, layout.md]: "Align grid items across nested grid contexts." Each card spans the parent's three row tracks and takes them as its own, so titles, bodies and footers line up from card to card. Verbatim:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

/* Child participates in parent's tracks */
.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid; /* aligns title, body, footer across all cards */
}
```

  The source's floors (Chrome 117, Safari 16, Firefox 71) match browser-compat-data; subgrid's status is above.
- **Masonry is `display: grid-lanes`** (and `inline-grid-lanes`), the shipped name of the masonry proposal: experimental, Safari 26.4 only, no Chrome or Firefox ([MDN `display`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display), [Grid lanes guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Grid_lanes)). No nerdy.dev source covers it; anti-slop-ui lists it among [features not to build a system on](RESPONSIVE.md#dont-build-a-system-on-them).
- **Stack children in one cell** with `grid-area: 1/1`; Adam uses it to pile radios in a centered cell (the circle layout below) and to layer the parts of the VisBug logo. [nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update)

```css
visbug-logo {
  --size: clamp(20px, 50cqi, var(--size-content-1));
  inline-size: var(--size);
  aspect-ratio: 1;
  display: grid;

  & > * {
    grid-area: 1/1;
  }
}
```

- **A bento grid that knows its children:** "A CSS bento-like grid that's aware of the number of children and aspect ratio available thanks to `:has()` and `@container`", and view transitions made the interactive demo "so much more compelling". Demo code not exported (CodePen RwdRaVg). `:has()` is Baseline widely available since 2026-06-19 (newly 2023-12-19; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)). On its cost, ui-animation records "a single `:root:has()` selector added 24 ms to every DOM change" and MDN's warning about `:has()` anchored on `body`, `:root` or `*` ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)). [nerdy.dev: Neue Bento Layouts With Grid Has And Container Queries](https://nerdy.dev/neue-bento-layouts-with-grid-has-and-container-queries)

## A circle layout with trig and sibling-index()

- **Radios on a circle** (one-cell grid stack, `translate` by `cos()` and `sin()`, the post's hand-written index and the version with `sibling-index()` and `sibling-count()`) is defined in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#radio-and-checkbox-groups). [nerdy.dev: Cyclical keyboard UX with a radio group and CSS trig functions](https://nerdy.dev/cyclical-radio-group-with-trig-functions-and-grid) (2023-03-10)
- The post credits "individual transforms making `x` and `y` easy to set": `translate` takes both at once (Baseline widely available since 2025-02-05, newly 2022-08-05; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate)). Same post.

## Layering without position: absolute

- **The Pile:** an "element layering layout machine" that "replaces many use cases for `position: absolute`", "offers group or individual keyword alignment" and "can be intrinsically sized based on content". Video only ([Mini Web Machine episode 2](https://www.youtube.com/watch?v=6qpEOBkDr88)); the CSS was not exported. The layering in Adam's exported code is the one-cell grid stack above (VisBug logo). [nerdy.dev: The Pile Mini Web Machine](https://nerdy.dev/the-pile-mini-web-machine) (2024-05-09)
- **Over Easy:** anchor positioning for layering ("no more complex `position: absolute`", keyword alignment, intrinsically sized, pairs with `popover`). See [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md). [nerdy.dev: The Over Easy Mini Web Machine](https://nerdy.dev/the-over-easy-mini-web-machine)

## Balanced wrapping

- **Historical balanced-wrap proposal** (csswg-drafts #3070): wrap rows evenly instead of leaving one item alone on the last row; it "would also reduce scenarios where folks have to use empty elements". The 2024 post's demo fakes the balanced version with a grid that has 3 columns instead of 4. [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17)

```css
  .flex-balanced-demo {
    inline-size: 50%;
    display: grid;
    grid-template-rows: repeat(2, 1fr);
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;

    > div {
      aspect-ratio: 1;
      background: var(--surface-2);
    }
  }

  .balanced {
    grid-template-columns: repeat(3, 1fr);
  }
```

- **The newer `flex-wrap: balance` note** says it is headed to Chrome and shows that declaration on a flex container. MDN now includes `balance` in the grammar; check support for that value against the project's targets and retain ordinary wrapping where absent. The whole property's Baseline status does not establish support for this value. [nerdy.dev: Flex Wrap Balance](https://nerdy.dev/flex-wrap-balance), [MDN flex-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/flex-wrap)
- **The container keeps its width after wrapping** (the "shrink-wrap" problem, csswg-drafts #191); details in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#text-wrap-balance). [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025)

## Centering

- **"Turns out, there's A LOT of ways to center."** The CSS Podcast [episode 74](https://thecsspodcast.libsyn.com/74-how-do-i-center-a-div) covers them, and Temani Afif's [generator](https://css-generators.com/center) lists 100. [nerdy.dev: How Do I Center This Div](https://nerdy.dev/how-do-I-center-this-div), [nerdy.dev: 100 Ways To Center A Div](https://nerdy.dev/100-ways-to-center-a-div) (2026-07-21)
- **In Adam's code** a grid with `place-content: center` centers a one-cell track (the circle layout in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#radio-and-checkbox-groups)); `place-content` is Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/place-content)).
- **Finer centering with `text-box`:** "Centering in CSS is about to get even finer grained" ([TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#text-box-trim-the-fonts-inner-spacing)). A 2024 note teased "a whole next level of CSS centering" without saying what it was. [nerdy.dev: Text Box Ftw](https://nerdy.dev/text-box-ftw), [nerdy.dev: Next Level CSS Centering Headed Your Way](https://nerdy.dev/next-level-css-centering-headed-your-way) (2024-05-30)

## Aspect ratio that follows orientation

- **Flip the ratio in portrait** (`aspect-ratio: 4/3`, then `3/4` inside a nested `@media (orientation: portrait)`) is defined in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#orientation), with anti-slop-ui's view on viewport queries. [nerdy.dev: Matching Aspects](https://nerdy.dev/matching-aspects)

## Logical properties

- **"Logical Properties: Learn once, works everywhere."** Support: `margin-inline` is Baseline widely available since 2023-10-26 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-inline)); `writing-mode` since 2019-09-27 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/writing-mode)). [nerdy.dev: Hustle And Logical Flow](https://nerdy.dev/hustle-and-logical-flow)
- **Adam uses them everywhere:** nerdy.dev itself ("I used logical properties everywhere"), and Nice Select uses "`inline-size`, `block-size`, `inset-block-start`, `margin-inline`, `padding-block` for full RTL support", with an RTL example. On the site, "Media Queries made this hard though, and Container Queries saved the day." [nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site), [nerdy.dev: Nice Select](https://nerdy.dev/nice-select)
- **Rhythm follows too:** baseline grids work in vertical rtl as well as ltr and rtl ([TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#line-height-units-lh-and-rlh)). [nerdy.dev: Can you feel the rhythm‽](https://nerdy.dev/css-logical-rhythm)

## Physical against logical

- **"is it time to forget about physical properties like `margin-top` and `left`? Can't throw out the x/y transforms tho"**. [nerdy.dev: Is It Time To Throw Out Physical Properties](https://nerdy.dev/is-it-time-to-throw-out-physical-properties) (2024-01-07)
- anti-slop-ui's logical rule also keeps an exception for "centring with `left: 50%` and a translate" ([RESPONSIVE.md](RESPONSIVE.md)), and app-ui lists the values it keeps physical by design, such as a measured position placed with `left: 0` plus `translate` ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)).
- **Ask models for them.** "I prompt LLMs with logical properties." And: "Even prompting in logical properties, you have to ask for this kind of CSS. These should be CSS tablestakes output from LLMs, but it's not. And even when you ask for it, or provide documentation that spells it out, it's not guaranteed to work." [nerdy.dev: Prompt In Logical Properties](https://nerdy.dev/prompt-in-logical-properties) (2026-01-27), [nerdy.dev: Why AI Sucks At Front End](https://nerdy.dev/why-ai-sucks-at-front-end) (2026-04-12)

## Notes with no technique

- **"layouts are loops."** A one-line note (2022-12-10) with no example. [nerdy.dev: Layouts Are Loops](https://nerdy.dev/layouts-are-loops)
- **"4 layouts for the price of"** (2020-01-14): the note's text is truncated in the export and its media was not exported, so no technique can be taken from it. [nerdy.dev: 4 Layouts For The Price Of 1](https://nerdy.dev/4-layouts-for-the-price-of-1)

## Prove it

- **Min-size reset:** a grid or flex child holding a long unbroken string or a wide table overflows without `min-width: 0` and stays inside its track with it.
- **No squish:** shrink the viewport until the pushy sibling squeezes the fixed-size item; with `flex-shrink: 0` its width and height stay as set (a circle stays round).
- **Responsive columns:** put the grid in a parent narrower than the `min()` length (10rem); there is one column and no horizontal scrollbar.
- **Subgrid cards:** give one card a two-line title; the bodies and footers of every card in that row still start on the same lines.
- **Balanced wrapping:** verify support for the `balance` value itself; without it the flex container still wraps with the chosen fallback. [Balanced wrapping](#balanced-wrapping)
- **Logical properties:** set `dir="rtl"` and `writing-mode: vertical-rl` on a test page; spacing and alignment mirror or rotate with no physical property left except transforms and documented exceptions.
- **No dashes:** a search of LAYOUT.md for em and en dash characters finds none.
