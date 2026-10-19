# Queries and preferences

How a component asks about its surroundings and its user: container size queries (with the `container` shorthand, `calc()` in the condition and thresholds in `ch`), name-only container queries, style queries, media query range syntax, `@custom-media` (including feature flags), and the preference and device queries: reduced motion, reduced transparency, reduced data, color scheme and contrast, forced colors, hover and pointer, orientation, color gamut, scripting and display mode. The source is Adam Argyle's nerdy.dev; each bullet carries its post and, where support matters, the post date. Container queries in Tailwind come from [flornkm, prefer-container-queries] (flornkm/skills, MIT) checked against Tailwind's docs, and `scripting` and `display-mode` from [css-modern-features] (rushenn/css-modern-features, MIT, `references/components.md`). Current support comes from MDN and webstatus.dev, checked 2026-10-17. Scroll-state container queries (`stuck`, `snapped`, `scrollable`, `scrolled`) are in [SCROLL.md](SCROLL.md); the naming rules for containers and other custom names are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#emoji-in-custom-names).

**Contents:** [What a component can know](#what-a-component-can-know) · [Container size queries](#container-size-queries) · [Container queries in Tailwind v4](#container-queries-in-tailwind-v4) · [Name-only container queries](#name-only-container-queries) · [Style queries](#style-queries) · [Media query range syntax](#media-query-range-syntax) · [Custom media](#custom-media) · [Reduced motion](#reduced-motion) · [Reduced transparency](#reduced-transparency) · [Reduced data](#reduced-data) · [Color scheme and contrast](#color-scheme-and-contrast) · [Forced colors](#forced-colors) · [Hover and pointer](#hover-and-pointer) · [Orientation](#orientation) · [Color gamut](#color-gamut) · [Scripting and display mode](#scripting-and-display-mode) · [Prove it](#prove-it)

## What a component can know

[nerdy.dev: Web elements know about the user, device, variables, layout and more](https://nerdy.dev/components-can-know) (2025-10-30), after Miriam Suzanne's "containers know stuff": "Components/elements/containers *whatever*, can own all their presentation aspects for nearly any scenario now." His list of 25, grouped by where this skill covers each:

- **Queries in this file:** the user's preferences (dark/light, reduced motion, forced colors), device size, orientation and capabilities (color gamut, pointer), where it is in the app (container name queries), how much space it has (container size queries), the value of a variable (style queries), being printed (`@media print`).
- **Selectors, in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#has-and-selectors):** how many items it contains (quantity queries with `:has()`), what kind of items (`:has()`), `:hover`, `:focus`, `:active`, `:focus-within`, form validity (`:valid`), `:defined`, `:playing`.
- **Elsewhere in the skill:** what is in or out of view and whether it is scrolling ([SCROLL.md](SCROLL.md)); writing direction (logical properties, `direction`, `writing-mode`; [LAYOUT.md](LAYOUT.md)); position among siblings (`sibling-count()`, `sibling-index()`; [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md#sibling-index-and-sibling-count)); where other elements are, their size and distance (`position-anchor`, `anchor-size()`; [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md)); `color-scheme` and `light-dark()` ([COLOR.md](COLOR.md)); the design system's tokens; `counter()`.
- **From JavaScript only:** being in an iframe (`if (window.self !== window.top)`), which browser (`navigator.userAgent`, "or CSS selectors"). The source and our old line also claimed `this instanceof HTMLElement` detects being in a web component; `HTMLElement` represents HTML elements generally, so that test does not establish component membership. [MDN HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
- **Status of the newer items** (MDN): `:playing` is not Baseline (Limited availability: Firefox 150 and Safari 15.4, no Chrome; it matches audio or video that is playing, including while it buffers or stalls), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:playing).

## Container size queries

Container queries are Baseline widely available since 2025-08-14 (newly available 2023-02-14; webstatus `container-queries`), "some parts of this feature may have varying levels of support" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container)).

- **The `container` shorthand sets name and type together.** [nerdy.dev: My container query strategy](https://nerdy.dev/a-container-query-strategy) (2022-02-10). The post is a stub ("todo") with only this snippet and no rationale:

  ```html
  <contain-er style="container: layers-panel / inline-size;">
    <!-- <SomeComponent /> -->
  </contain-er>
  ```

- **Scrollers make good containers.** [nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation) (2025-06-13): "Since a scroller of often extrinsically sized, it won't suffer from the side effect that container queries can cause (where they collapse). This makes scroller and container queries a natural pair." The shorthand "lets me set the name and the type(s) in one spot":

  ```css
  .scroll--root {
    container: --homescreen / size;
  }

  .scroll--viewport {
    container: --homescreen-scroller / size scroll-state;
  }

  .scroll--content > li {
    /* children will use snapped scroll-state() */
    container-type: scroll-state;
  }
  ```

  MDN `container-type`: in the two-value form one value must be `scroll-state` and the other `inline-size` or `size`. `scroll-state` itself is Limited availability (Chrome only) and is covered in [SCROLL.md](SCROLL.md).
- **Write the threshold in the unit the content cares about.** [nerdy.dev: A CSS Container Query Pattern](https://nerdy.dev/a-css-container-query-pattern) (2023-10-10): "nice inline flex layout when there's room in it's `Column` container", and if not, "switch to a nice block layout and center the text". "I like the `ch` unit for this since I'm wanting to switch based on available reading length for the text." The exported note has no code.
- **`calc()` works inside the condition.** [nerdy.dev: A powerful container query](https://nerdy.dev/carousel-adaptive-anchor-positioning-with-calc-in-a-container-query) (2024-12-19): anchored outside the carousel, its scroll buttons have "potential for them to be off screen or out of bounds", so `@container (inline-size >= calc(100cqi - 120px))` moves them inside; the code and its support are in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md#carousel-buttons-that-move-inside-or-outside).
- **Container queries rescue layouts that media queries make hard.** [nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site) (2023-01-01), on its logical properties: "Turned out Media Queries made this hard though, and Container Queries saved the day." The promised follow-up post is not in the export.
- **Count-aware grids combine `:has()` and `@container`.** [nerdy.dev: Neue Bento Layouts With Grid Has And Container Queries](https://nerdy.dev/neue-bento-layouts-with-grid-has-and-container-queries) (2024-01-08): "A CSS bento-like grid that's aware of the number of children and aspect ratio available thanks to `:has()` and `@container`", with view transitions animating the changes. Demo code not exported ([demo](https://codepen.io/argyleink/pen/RwdRaVg)). The post does not discuss cost; the repo's own measurement is that one `:root:has()` selector added 24 ms to every DOM change ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).

### Container queries in Tailwind v4

[flornkm, prefer-container-queries] "Tailwind v4 ships container queries in core." "Mark the parent as a container, then use `@`-prefixed variants on its children":

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @md:gap-6">
    <img class="w-full @md:w-48" />
    <div class="@md:flex-1">...</div>
  </div>
</div>
```

- **"Two rules that trip people up":** "The `@container` class goes on the parent. The `@md:` variants go on descendants. An element cannot query its own size." And "Container variants respond to the nearest ancestor with `@container`. If styles are not applying, check which container you are actually querying." MDN's form of the second: container queries style elements "based on the size of the nearest ancestor with a containment context" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)).
- **The sizes** (minimum container width; the source's table matches [Tailwind's docs](https://tailwindcss.com/docs/responsive-design#container-queries)): `@3xs` 16rem, `@2xs` 18rem, `@xs` 20rem, `@sm` 24rem, `@md` 28rem, `@lg` 32rem, `@xl` 36rem, `@2xl` 42rem, `@3xl` 48rem, `@4xl` 56rem, `@5xl` 64rem, `@6xl` 72rem, `@7xl` 80rem.
- **Below, arbitrary and named:** "`@max-md:` styles below a container size"; "`@min-[475px]:` arbitrary values when the scale does not fit"; "`@container/sidebar` plus `@md/sidebar:flex-row` to name a container and query it from deeper in the tree, past other containers."
- **From Tailwind's docs** (not in the source): stack a range as `@sm:@max-md:flex-col`; `@container` makes an inline-size container, and `@container-size` (or `@container-size/{name}`) a size container "when you need to use container query length units that depend on the block size, like `cqb`"; custom sizes are theme variables, `@theme { --container-8xl: 96rem; }`; units go in arbitrary values such as `w-[50cqw]`.
- **Tailwind v3 is not the same syntax.** The source: "On Tailwind v3, the same syntax needs the `@tailwindcss/container-queries` plugin." The plugin's README gives sizes only "from `@xs` (`20rem`) to `@7xl` (`80rem`)" (no `@3xs` or `@2xs`), writes arbitrary values as `@[17.5rem]:`, documents no `@max-*` variants, and says "As of Tailwind CSS v4.0, container queries are supported in the framework by default and this plugin is no longer required" ([tailwindcss-container-queries](https://github.com/tailwindlabs/tailwindcss-container-queries)). On v3, write the plugin's own syntax; check the Tailwind version first, as the source says.
- **Porting `md:` classes and reviewing them** (`md` is 768px of viewport, `@md` is 448px of container; the review mistakes) is in [RESPONSIVE.md](RESPONSIVE.md). The source keeps viewport breakpoints for page-level layout, viewport-fixed or sticky bars and a "Global typography scale tied to screen size"; anti-slop-ui keeps one only for the shell, and a query that only stepped a size "becomes one `clamp()`" (same file).

## Name-only container queries

`@container` no longer needs a size condition. All three engines ship it: MDN browser-compat-data `container-type.name-only_queries` lists Chrome 148, Firefox 149, Safari 26.4 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container)). The post (2026-04-26) listed "Chrome 149" and "Firefox 148"; the compat data has those two the other way round.

- **Style by name alone.** [nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers) (2026-04-26): "You can now conditionally style elements just by name":

  ```css
  .sidebar {
    container-name: sidebar;
  }

  .card {
    display: grid;

    @container sidebar {
      grid-auto-flow: column;
    }
  }
  ```

- **A component knows which area of the app it is in.** [nerdy.dev: Web elements know about the user, device, variables, layout and more](https://nerdy.dev/components-can-know) (2025-10-30): "A component can easily know if it's in the sidenav, footer, article area, callout, whatever!" and "No more chasing down all the styles and variations that scatter across your application."

  ```css
  #some-singleton {
    container-name: --some-area;
  }

  .some-component {
    @container --some-area {
      /* component owned adaptability */
    }
  }
  ```

  MDN `container-name` (Baseline widely available since 2025-08-14, newly available 2023-02-14): a case-sensitive `<custom-ident>`; dashed idents are allowed; it must not be `or`, `and`, `not` or `default` and must not be quoted ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-name)). Whether to dash the name is a convention question, covered in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#emoji-in-custom-names).

## Style queries

Container style queries are Baseline newly available since 2026-05-19 (webstatus `container-style-queries`: Chrome since 2023-03, Safari since 2024-09, Firefox since 2026-05). MDN: "The only style feature currently supported is custom properties, with or without a value"; regular declarations inside `style()` are "not yet supported in any browser" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries)).

- **Custom properties as enums.** [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories) (2023-01-26), "style query props": "Could be used as enums for theming, state machines, you name it."

  ```css
  button {
    @container style(--vibe: primary) {
      --_bg: var(--indigo-5);
      --_border: var(--indigo-4);
    }
    
    @container style(--vibe: rad) {
      --_bg: var(--gradient-11);
      border: none;
    }
    
    @container style(--size: large) {
      font-size: var(--font-size-4);
    }
  }
  ```

  The post (2023-01) said to try it in Canary; it points to Manuel Matuzović on style queries working on computed custom property values and on `@property` helping them.
- **Nested light and dark contexts that change more than color.** [nerdy.dev: Page and Component Adaptive Light/Dark](https://nerdy.dev/page-and-component-light-dark-strategies) (2024-08-21): "if you want to adapt more than just color in these nested scenarios, then Style Queries and custom properties holding the `color-scheme` value can be used." The post's markup, CSS and the other two strategies are in [COLOR.md](COLOR.md#page-and-component-light-and-dark).
- **JS can feed style queries.** [nerdy.dev: Prop For That](https://nerdy.dev/prop-for-that) (2026-06-13) writes form state onto the form, so CSS can react with `@container style(--live-all-valid: 1)`; the source example is in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md#live-properties-from-js).

## Media query range syntax

Range syntax is Baseline widely available since 2025-09-27 (newly available 2023-03-27, when Safari 16.4 shipped it; webstatus `media-query-range-syntax`).

- **Compare with operators.** [nerdy.dev: Media Query Ranges](https://nerdy.dev/media-query-ranges) (2022-12-29): "I find this so much more readable."

  ```css
  @media (width <= 720px) {}
  ```

  The post (2022-12) said Safari had it only in Technology Preview, "aka plugin still required"; no plugin is needed now. MDN: "The range comparisons above are inclusive. To exclude the comparison value, use `<` and/or `>`", for example `@media (30em < width < 50em)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using)).
- **A second view on viewport queries.** anti-slop-ui keeps a viewport media query only for the app shell and uses media queries otherwise only for capabilities and preferences ([RESPONSIVE.md](RESPONSIVE.md)). The range syntax works the same either way.

## Custom media

`@custom-media` is Limited availability and experimental; MDN's data lists no browser that ships it by default ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@custom-media)). [nerdy.dev: Custom Media](https://nerdy.dev/custom-media) (2026-01-23) reported it "working behind a flag in Firefox Nightly"; browser-compat-data shows Firefox 148 behind a flag, no Chrome, no Safari. Until it ships, the route [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17) names is a build step: Open Props' named media queries, "showing how a PostCSS plugin can transform it at build time until the feature hits browsers"; the feature-flags post links the `postcss-custom-media` polyfill.

- **Name each query once.** [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17): "It sucks in CSS to be making up queries, or memorizing them, across components." Defining them:

  ```css
  @custom-media --OSdark       (prefers-color-scheme: dark);
  @custom-media --OSlight      (prefers-color-scheme: light);
  @custom-media --motionOK     (prefers-reduced-motion: no-preference);
  @custom-media --highContrast (prefers-contrast: more);

  @custom-media --portrait (orientation: portrait);

  @custom-media --md-only  (480px <= width < 768px);
  @custom-media --md-phone (--md-only) and (--portrait);
  /* etc */
  ```

  Using them:

  ```css
  .card {
    box-shadow: var(--shadow-3);

    @media (--OSdark) {
      box-shadow: none;
      border: 1px solid var(--gray-6);
    }

    @media (--motionOK) {
      transition: transform .5s var(--ease-spring-1);
    }
  }
  ```

  "Great with nesting. Vastly improves legibility. Removes risks of new media queries being invented." The post (2024-12) said the spec had "no movement"; the 2025-12 and 2026-01 posts report implementation work since. The Custom Media note: Open Props has "[~45 ready to go](https://github.com/argyleink/open-props/blob/main/src/props.media.css)".
- **`true` and `false` make feature flags.** [nerdy.dev: Custom Media Feature Flags](https://nerdy.dev/custom-media-feature-flags) (2025-12-06): "Imagine an edge worker that toggles `true` or `false` in a CSS file, and the rest of your styles can tap in and adapt", for A/B testing, unique user features, revealing debug elements, v2 layouts. An enabled flag, then a disabled one:

  ```css
  @custom-media --feature-flag true;
  ```

  ```css
  @custom-media --debug-flag false;
  ```

  ```css
  @media (--feature-flag) {
    body {
      …
    }
  }

  .component {
    @media (--debug-flag) {
      …
    }
  }
  ```

  "Use nesting, query from JavaScript, or both." MDN syntax: `@custom-media <extension-name> [<media-query-list> | true | false ];`, where with `true` "The @custom-media value always evaluates to true" and with `false` "The @custom-media value always evaluates to false". When several rules use the same name, "the rule that is in scope at the time a @media rule is evaluated is used. Earlier references are not retroactively updated", and the overriding behavior "is still under discussion" and may change.
- **Scope note.** `--md-only` is a viewport breakpoint; anti-slop-ui: "Only the shell keeps a viewport media query" ([RESPONSIVE.md](RESPONSIVE.md)).

## Reduced motion

`prefers-reduced-motion` is Baseline widely available since 2022-07-15 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)).

- **Put the transition inside `(prefers-reduced-motion: no-preference)`.** [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19), Open Props springs:

  ```css
  @import "https://unpkg.com/open-props/easings.min.css";

  .springy {
    @media (prefers-reduced-motion: no-preference) {
      transition: transform 1s var(--ease-spring-3);
    }
  }
  ```

  The same guard wraps the hover-demotion effects ([CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#focus-by-demotion)), the `<details>` and enter/exit transitions ([TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md)) and smooth `scroll-behavior` in the Switch homescreen post ([SCROLL.md](SCROLL.md)). As a named query: `@custom-media --motionOK (prefers-reduced-motion: no-preference);` (above).
- **A second view.** ui-animation: under `reduce`, "slides, zooms, parallax and large movements become 100-150 ms opacity cross-fades", and it calls a global `prefers-reduced-motion: reduce` override "a blunt fallback; better, write the reduced version of each animation deliberately" ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).

## Reduced transparency

`prefers-reduced-transparency` is Limited availability and experimental: MDN data lists Chrome and Edge 118 and later (Firefox 113 only behind a flag, no Safari); values `no-preference` and `reduce` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency)).

- **Treat it as a design opportunity.** [nerdy.dev: Prefers Reduced Transparency](https://nerdy.dev/prefers-reduced-transparency) (2025-06-10): "It's not a challenge to design for reduced transparency, **it's an opportunity**", with two demos, [a card with a caption](https://codepen.io/argyleink/full/YzBKBaR) and [adaptive frosted glass](https://codepen.io/argyleink/full/qBmJyvv) (demo code not exported). His earlier note [nerdy.dev: CSS Prefers Reduced Transparency](https://nerdy.dev/css-prefers-reduced-transparency) (2023-10-25) only links his developer.chrome.com article. MDN's example of the query:

  ```css
  .translucent {
    opacity: 0.4;
  }

  @media (prefers-reduced-transparency) {
    .translucent {
      opacity: 0.8;
    }
  }
  ```

## Reduced data

- **Proposal only; no browser supports it.** [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17): "User in data saver mode or a low power mode? Let CSS hook in and skip on stuff like media, saving loads!"

  ```css
  @media (prefers-reduced-data: reduce) {
    img, video {
      display: none;
    }
  }
  ```

  The post (2024-12) said it had "Been in Chrome Canary for a while as an experiment", that no other browser tried it, and that "some folks have raised privacy issues about it as being an added tracking vector or worst of all, attempting to identify save data users as low income." MDN now: "This feature is not supported by any user agent and its specifics are subject to change" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data)).

## Color scheme and contrast

`prefers-color-scheme` is Baseline widely available since 2022-07-15 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme)); `prefers-contrast` since 2024-11-30, with values `no-preference`, `more`, `less` and `custom` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-contrast)).

- **Answer the query once, high in the stack.** [nerdy.dev: BYO CSS tokens to Tailwind v4's new CSS centric config](https://nerdy.dev/BYO-CSS-tokens-to-tailwind-v4s-new-CSS-centric-config) (2024-03-18): after setting the surface and ink tokens inside one `@media (prefers-color-scheme: dark)` block, "no noise about light or dark, that's configured higher up in the stack and templates don't need to deal with it." The token code is in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md). app-ui instead uses "A class-based dark variant (`@custom-variant dark (&:is(.dark *))`), so the head script's class decides the theme" ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).
- **Combine scheme and contrast.** The irradiation post combines `(prefers-color-scheme: dark) and (prefers-contrast: more)` to set a font's `GRAD` axis; that recipe is in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md).
- **Increased contrast as color tokens,** set separately for light and dark, is in [color-system DARK-MODE-AND-GAMUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/DARK-MODE-AND-GAMUT.md#increased-contrast-per-appearance).
- **Sections with their own scheme:** the three strategies are in [COLOR.md](COLOR.md#page-and-component-light-and-dark).

## Forced colors

`forced-colors` is Baseline widely available since 2025-03-12 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors)).

- **Back every shadow and color cue with a transparent border.** [nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site) (2023-01-01): "Where there are shadows and colors to help distinguish UI elements, they're replaced with a transparent 1px border so that in `forced-colors-mode` there are visual affordances for distinguishing elements." [nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation) (2025-06-13): "**Transparent borders are your friend!**", with scrollbar colors integrated into the light, dark and forced colors themes ([SCROLLBARS.md](SCROLLBARS.md)).
- **Use forced colors to debug structure.** [nerdy.dev: Nice Select](https://nerdy.dev/nice-select) (2026-02-03): "Definitely check the support for light/dark forced colors too, a really great way to debug spacing and skeletal aspects of the UI." `@media (forced-colors: active)` "provides high-contrast mode adaptations (even the sticky scroll state respects this!)".

## Hover and pointer

The interaction media queries (`hover`, `any-hover`, `pointer`, `any-pointer`) are Baseline widely available since 2021-06-11. MDN's Baseline entry: "most smartphones match the `(hover: none) and (pointer: coarse)` media query" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover)).

- **Gate hover-only effects on `(hover)`.** [nerdy.dev: :hover > :not(:hover), sorry not sorry](https://nerdy.dev/hover-not-hover-sorry-not-sorry) (2025-01-06) wraps every demotion effect in `@media (hover)`, and the motion variants in `@media (hover) and (prefers-reduced-motion: no-preference)`. The code is in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#focus-by-demotion).
- **Enhance a whole control only for a fine pointer.** [nerdy.dev: Nice Select](https://nerdy.dev/nice-select) (2026-02-03): "Only enables custom styling for devices with hover and fine pointer" (`@media (hover)` and `(pointer: fine)`), and "I keep mobile with the native select." The select itself is in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md).
- **Hover hints on scrollbars** sit inside `@media (hover)` in the Switch homescreen's scrollbar styles ([SCROLLBARS.md](SCROLLBARS.md)).

## Orientation

`orientation` is part of the base media queries feature, Baseline widely available since 2018-01-29 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)).

- **Flip a ratio with the screen.** [nerdy.dev: Matching Aspects](https://nerdy.dev/matching-aspects) (2024-11-09), nesting the query inside the rule:

  ```css
  .card {
    aspect-ratio: 4/3;
    
    @media (orientation: portrait) {
      aspect-ratio: 3/4;
    }
  }
  ```

  Nesting is covered in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#nesting). As a named query: `@custom-media --portrait (orientation: portrait);` (above).
- **A second view.** anti-slop-ui allows media queries only for the shell, capabilities and preferences ([RESPONSIVE.md](RESPONSIVE.md)); that file calls the orientation flip "a viewport-shape query this line doesn't list". The post does not address that rule.

## Color gamut

`color-gamut` is Baseline widely available since 2025-08-14 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/color-gamut)).

- **A wider gamut is a capability like a wider viewport.** [nerdy.dev: Device Width Is Like Device Color Gamut](https://nerdy.dev/device-width-is-like-device-color-gamut) (2023-04-05): "Viewport widths n' color gamuts; **As each widen, adapt the UI.**" The note has no code. MDN's `color()` page detects the gamut with `@media (color-gamut: p3)`; P3 colors and their sRGB fallbacks are in [COLOR.md](COLOR.md).

## Scripting and display mode

[css-modern-features, components.md]

- **Show the no-JS version with `(scripting: none)`:** "Progressive enhancement, show fallback content when JS is unavailable", the media-query form of rule 3 in [SKILL.md](SKILL.md). Verbatim:

  ```css
  /* Default: JS-enhanced accordion (JS handles open/close) */
  .accordion-content { display: none; }

  /* No-JS: show all content */
  @media (scripting: none) {
    .accordion-content { display: block; }
    .accordion-toggle  { display: none; }
  }
  ```

  Status: Baseline widely available since 2026-06-07 (newly 2023-12-07; Chrome 120, Firefox 113, Safari 17; web-features `scripting`).
- **Style an installed web app with `(display-mode: standalone)`:** "Style PWA installs differently from browser tabs." Verbatim:

  ```css
  @media (display-mode: standalone) {
    .install-banner { display: none; } /* already installed */
    .navbar { padding-top: env(safe-area-inset-top); }
  }
  ```

  Status: not Baseline. web-features lists only Chrome 47 and Firefox for Android 116; browser-compat-data has the query itself from Chrome 42, Firefox 47 and Safari 13. The source rated it safe for most targets with "Chrome 45, Safari 13, Firefox 89". OneSignal's web setup reads the same query from JS with `matchMedia` ([onesignal SETUP-WEB.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SETUP-WEB.md)).

## Prove it

- **Name-only query:** give `.sidebar` `container-name: sidebar` and nest `@container sidebar { grid-auto-flow: column; }` in `.card`; a card inside the sidebar lays out in a row and one outside does not, in Chrome 148, Firefox 149 and Safari 26.4 or later.
- **`calc()` condition:** widen the carousel's container until `inline-size >= calc(100cqi - 120px)` holds; the scroll buttons switch from `var(--_outer)` to `var(--_inner)`.
- **Style query reads only custom properties:** `@container style(--vibe: primary)` matches on an element whose parent sets `--vibe: primary`; `@container style(color: red)` matches nothing in any browser.
- **Range syntax is inclusive:** `@media (width <= 720px)` applies at exactly 720px; `(width < 720px)` does not.
- **Custom media is not native yet:** an unprocessed `@media (--motionOK)` applies in no shipping browser; after `postcss-custom-media` it compiles to the underlying query.
- **Reduced motion:** turn on the OS setting; every snippet guarded with `(prefers-reduced-motion: no-preference)` stops transitioning, and anything that should still cross-fade has its own branch.
- **Forced colors:** emulate `forced-colors: active` in DevTools; every element that relied on a shadow or background to stand apart still shows an edge from its transparent border.
- **Pointer gate:** on a touch device the Nice Select keeps the native picker; with a mouse it enhances.
- **Tailwind container:** every `@md:` (or other `@` size) class has an `@container` ancestor and none sits on the element carrying `@container`; on v3 the classes use the plugin's `@[17.5rem]:` form.
- **No JS:** with JavaScript disabled, every accordion panel shows and its toggle is hidden.
- **Installed app:** opened from the home screen, the install banner is gone; in a browser tab it shows.
- **No long dashes:** a search of this file for the em dash (U+2014) and en dash (U+2013) finds nothing.
