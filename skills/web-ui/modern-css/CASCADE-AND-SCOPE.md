# Cascade and scope

How styles find their elements and which one wins: cascade layers (named, nested, anonymous, and appended to later as "async overrides"), `@scope` with its donut and proximity, native nesting (BEM included), `:has()` and `:has(:not())`-style selectors, focus by demotion, `--_` private names, specificity, a study list of modern features, and the vocabulary for UI library layers (headless, boneless, skinless, lifeless). The source is Adam Argyle's nerdy.dev; each bullet carries its post and, where support matters, the post date. Current support comes from MDN and webstatus.dev, checked 2026-10-17.

**Contents:** [Cascade layers](#cascade-layers) · [Scope](#scope) · [Nesting](#nesting) · [Has and selectors](#has-and-selectors) · [Focus by demotion](#focus-by-demotion) · [Custom names](#custom-names) · [Specificity](#specificity) · [What to study next](#what-to-study-next) · [Headless, boneless, skinless, lifeless](#headless-boneless-skinless-lifeless) · [Prove it](#prove-it)

## Cascade layers

`@layer` is Baseline widely available since 2024-09-14 (newly available 2022-03-14) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer)).

- **Three layers for a whole site, sublayers per import.** [nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site) (2023-01-01): "Spoiler, it's layers all the way, and I looooved it."

  ```css
  @import "https://unpkg.com/open-props/normalize.min.css" layer(base.normalize);
  @import "https://unpkg.com/open-props/theme.light.switch.min.css" layer(base.theme);
  @import "https://unpkg.com/open-props/theme.dark.switch.min.css" layer(base.theme);
  @import "utilities.css" layer(base.utilities);
  @import "nojs.css" layer(base.nojs);

  @import "toast.css" layer(components.toast);
  @import "markdown.css" layer(components.markdown);
  @import "syntax-highlighting.css" layer(components.syntax);
  @import "neon.css" layer(components.p3);
  @import "quotes.css" layer(components.quote);

  @import-glob "../components/**/*.css" layer(components.fresh);
  @import-glob "../islands/**/*.css" layer(components.fresh);

  @layer base.normalize-overrides {…}
  @layer overrides {…}
  ```

  "**It's 3 layers**: base, components, overrides. Named sublayers for easier debugging and organization." "With that in place, I match a classname to a component name and that's pretty much it." `@import-glob` is not CSS; the same post lists the PostCSS plugin behind it (`postcss-import-ext-glob`).
- **Import into a layer, then append to it from anywhere.** [nerdy.dev: Cascade Layer Async Overrides](https://nerdy.dev/cascade-layer-async-overrides) (2023-02-16): "This felt like a future of library customization":

  ```css
  /* <tool-tip> styles */
  @import "tool-tip.css" layer(components.tooltip);

  /* later, in some-new-context.css */
  @layer components.tooltip {
    .some-new-context tool-tip {
      --_bg: var(--surface-1);
      --_shadow-alpha: 15%;
    }
  }
  ```

  "Scope the import, then append tweaks into that scope from anywhere. Safe and sound."
- **Component base styles at zero specificity inside a layer.** [nerdy.dev: Open Props UI](https://nerdy.dev/open-props-ui) (2025-01-15) quotes the library's button:

  ```css
  @layer components.base {
    :where(.button) {
      --_bg-color: transparent;
      --_border-color: transparent;
      --_border-radius: var(--button-border-radius);
      --_font-size: initial;
      --_min-height: 2.375rem;
      --_text-color: var(--primary);

      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      align-items: center;
      …
    }
  }
  ```

  "It slots into your workflow, you don't need to slot into its." MDN: "`:where()` always has 0 specificity" (Baseline widely available since 2023-07-21, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:where)). The `--_` prefix marks component-private custom properties ([CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md)).
- **An anonymous layer for defaults that are easy to beat.** [nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20) wraps its global enter and exit styles in `@layer { … }`; the snippet and the post's reasons are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).
- **Not real: import-map paths in `@import`.** [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17) wishes for `@import "$design-system/open-props.min.css" layer(design.system);`. The `layer()` part is shipped (above); the `$design-system` import map is a wish only ([csswg-drafts #8297](https://github.com/w3c/csswg-drafts/issues/8297)).

## Scope

`@scope` is Baseline 2026, newly available since 2026-03-24 (Chrome 118, Firefox 146, Safari 26.4) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope)).

- **It scopes selectors, not styles.** [nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers) (2026-04-26): "CSS **selector** scoping, not *style* scoping; a common misconception." With it "we can simplify naming conventions or robobarf classnames just to avoid global cascade collisions." "The 'donut' feature is very special, it can limit styles from cascading into nested components by setting an end to the selector (a donut hole)." The post has no code for it; MDN's form is `@scope (scope root) to (scope limit) { /* … */ }` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope)).
- **Relative selectors inside the scope root.** [nerdy.dev: CSS @Scope In Chrome With Coverage By Bramus](https://nerdy.dev/css-@scope-in-chrome-with-coverage-by-bramus) (2023-10-05):

  ```css
  @scope (.Card) {
    > header,
    > footer {
      background: hsl(none none none / 20%);
    }
  }
  ```

  The note (2023-10) said "`@scope` is new in **Chrome 118**"; it is now in all three engines. The note does not explain the `none` channels.
- **A prelude-less `@scope` in an inline `<style>`.** The Switch homescreen post's embedded source scopes its embed rule this way (MDN: without a prelude, the ruleset "is automatically scoped to the `<style>` element's enclosing parent element"):

  ```css
  @scope {
    .codepen-embed {
      block-size: 450px;
    }
  }
  ```

- **Scope light and dark contexts.** [nerdy.dev: Page and Component Adaptive Light/Dark](https://nerdy.dev/page-and-component-light-dark-strategies) (2024-08-21), crediting Miriam Suzanne: "a primary use case for `@scope` is for scoping light and dark contexts." The post's `@scope (.dark)` and `@scope (.light)` CSS is in [COLOR.md](COLOR.md#page-and-component-light-and-dark). MDN: when two scopes conflict, scoping proximity applies the style "that has the smallest number of hops up the DOM tree hierarchy to the scope root", so the nearest `.dark` or `.light` wins.
- **Donut inertness, the same idea for interaction.** [nerdy.dev: Donut Inertness](https://nerdy.dev/donut-inertness) (2024-11-06) compares `interactivity: inert;` to `@scope`'s donut; the quote and status are in [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md#interactivity-inert).

## Nesting

CSS nesting and the `&` selector are Baseline widely available since 2026-06-11 (newly available 2023-12-11) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Nesting_selector)).

- **BEM modifiers as nested substring selectors.** [nerdy.dev: BEM with native CSS nesting](https://nerdy.dev/bem-in-css-after-all) (2024-06-21) relays Vladyslav Zubko's technique. Instead of a separate modifier rule:

  ```css
  .tag-list__tag {
    --background-color: var(--color-red-200);
    background-color: hsl(var(--background-color) / 30%);
  }

  .tag-list__tag--github {
    --background-color: var(--color-gray-100);
  }
  ```

  the modifier nests inside the element as an attribute substring match:

  ```css
  .tag-list__tag {
    --background-color: var(--color-red-200);
    background-color: hsl(var(--background-color) / 30%);

    &[class*='--github'] {
      --background-color: var(--color-gray-100);
    }
  }
  ```

  "If BEM is your passion, keep calm and substring on." The source keeps HSL channels in a variable (`hsl(var(--x) / 30%)`). Attribute substring selectors are Baseline widely available since 2018-01-29 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Attribute_selectors)).
- **Media queries nest too.** The posts put `@media` inside the rule it changes: an orientation flip ([QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#orientation)), custom media ("Great with nesting", [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#custom-media)), and motion guards around each transition.

## Has and selectors

`:has()` is Baseline widely available since 2026-06-19 (newly available 2023-12-19). MDN: `:has()` cannot nest inside another `:has()`, and broad anchors (`body`, `:root`, `*`) with unconstrained inner selectors can hurt performance ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)). The repo's measurement: one `:root:has()` selector added 24 ms to every DOM change ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).

- **Style what an element lacks with `:not(:has())`.** [nerdy.dev: CSS Has Not Combo](https://nerdy.dev/css-has-not-combo) (2022-11-30): "use `:has()` for when an element doesn't have some other element as a child, like a card without a heading":

  ```css
  .card {
    ...
    &:not(:has(h3)) {
      /* .card's without h3's */
    }
  }
  ```

- **Turn on scroll snapping only while something is focused.** [nerdy.dev: Conditional Snapping With Has](https://nerdy.dev/conditional-snapping-with-has) (2022-12-19): "On demand with `:has()`, when a certain item is focused.. **snap dat item into a nice position**."

  ```css
  html:has(.CertainItem:focus-visible) {
    scroll-snap-type: y mandatory;
    scroll-padding-block-start: 100px;
  }

  .CertainItem:focus-visible {
    scroll-snap-align: start;
  }
  ```

  This anchors `:has()` on the root, the pattern the 24 ms measurement above warns about. Scroll snapping itself is in [SCROLL.md](SCROLL.md).
- **Count and kind of children.** [nerdy.dev: Web elements know about the user, device, variables, layout and more](https://nerdy.dev/components-can-know) (2025-10-30) lists "how many items they contain" (quantity queries with `:has()`) and "what kind of items they contain" (`:has()`); the bento grid that combines this with `@container` is in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#container-size-queries).
- **A single picker from a radio group.** [nerdy.dev: A Squishy Radio Group](https://nerdy.dev/a-squishy-radio-group) (2024-01-11): "Combine them with `:has()`, animated `grid-template-columns` and `linear()` easing and you've got yourself a neat little single picker UX." Demo code not exported ([demo](https://codepen.io/argyleink/pen/ExMgWLe)). A second view: ui-animation says animating `width`, `height` and other layout properties "recalculates layout every frame" and to prefer `transform` and `opacity` ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)); a grid track is a layout property.
- **The UA rule for `[hidden]` is weak.** [nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20) writes `display: none !important` on `&[hidden]`: "The browser provides that automatically for the attribute, but it's specificity is weak. If elements have any custom display type set, none isn't applied and the effect is lost." The full exit rule is in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).

## Focus by demotion

[nerdy.dev: :hover > :not(:hover), sorry not sorry](https://nerdy.dev/hover-not-hover-sorry-not-sorry) (2025-01-06): "Very often we create focus by promotion: hover to create a glow, focus rings, or even just making text bold. I've found, that creating focus by pushing back, blurring or obfuscating the items not being shown interest, can significantly reduce visual and cognitive overload."

- **Fade every child except the hovered one**, only where hover exists ([QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#hover-and-pointer)):

  ```css
  @media (hover) {
    & > * {
      transition: opacity 0.3s var(--ease-3);
    }

    &:hover > *:not(:hover) {
      opacity: 0.25;
    }
  }
  ```

  The post adds: "There's also a variant by Temani Afif that uses `:has()`; it is a more consistent experience" (code only in his notebook, not exported).
- **Push the others back with a scale**, only when motion is allowed:

  ```css
  ul {
    @media (hover) and (prefers-reduced-motion: no-preference) {
      & > li {
        transform-origin: left center;
        transition: transform 1s var(--ease-spring-3), opacity 0.3s var(--ease-3);
      }

      &:hover > li:not(:hover) {
        opacity: 0.25;
        transform: scale(0.8);
      }
    }
  }
  ```

- **Fade and arc by distance from the hovered item.** "`:has()` can track the hovered target, then using custom properties like `sibling-index()` we can derive the distance from the hovered target and use that delta to change opacity and rotation." The post's code reads a hand-set `var(--sibling-index)`; the shipped feature is the function `sibling-index()` (no arguments, returns a 1-based `<integer>`; Baseline 2026, newly available since August 2026, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)). Corrected, with the two `var(--sibling-index)` reads replaced and nothing else changed:

  ```css
  ul {
    --arc: 5deg;

    @media (hover) and (prefers-reduced-motion: no-preference) {
      &:has(li:nth-child(1):hover) {--target: 1}
      &:has(li:nth-child(2):hover) {--target: 2}
      &:has(li:nth-child(3):hover) {--target: 3}
      &:has(li:nth-child(4):hover) {--target: 4}
      &:has(li:nth-child(5):hover) {--target: 5}
      &:has(li:nth-child(6):hover) {--target: 6}
      &:has(li:nth-child(7):hover) {--target: 7}
      &:has(li:nth-child(8):hover) {--target: 8}
      &:has(li:nth-child(9):hover) {--target: 9}

      & > li {
        transform-origin: -200% 50%;
        transition: transform 2s var(--ease-spring-5), opacity 0.3s var(--ease-3);
      }

      &:hover > li:not(:hover) {
        --distance-from-target: abs(sibling-index() - var(--target));
        --distance-multiplier: var(--distance-from-target) * 15%; /* change 15% */
        --gradual-fadeout: calc(100% - var(--distance-multiplier));
        opacity: var(--gradual-fadeout);

        --angle: calc((sibling-index() - var(--target)) * var(--arc));
        transform: rotateZ(var(--angle));
      }
    }
  }
  ```

  `abs()` is Baseline newly available since 2025-06-26 (Chrome 138 was last) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/abs)). Durations here (1s, 2s springs) are demo values; ui-animation's timing tables are in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md).

## Custom names

- **`--_` for private custom properties.** The async-overrides note and Open Props UI (above) both prefix component-internal properties with `--_`; the convention and its origin are in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md).

### Emoji in custom names

- **The problem:** many CSS features take author names, some dashed and some not, so the same word ends up unique only within a context. [nerdy.dev: An Emoji Naming Convention](https://nerdy.dev/css-emoji-convention) (2025-02-20)

```css
@keyframes foo {}
@property --foo {}

.element {
  --foo: bar;
  animation: foo linear both;
  view-timeline-name: --foo;
  view-transition-name: foo;
  anchor-name: --foo;
  container-name: foo;
}
```

- **An emoji prefix per kind of name** "to help delineate the intended use"; the post confirms it is valid CSS (CodePen vEYLwpv) and frames it as "Not an answer, but an answer?". Verbatim, with trailing whitespace removed:

```css
@keyframes 🔑-example {}
@property --﹫-example {}
@font-palette-values --🔡-example {}

:root {
  --﹫-example-typed: baz;
  --🔒-example-private: foo;
  --regular-var: bar;
}

::view-transition-group(.🏘️-example) {}
::view-transition-new(🏞️-example) {}

@layer 🥞-example {
  .🤓-example-class {
    container-name: 📦-example;
    view-transition-name: 🏞️-example;
    view-transition-class: 🏘️-example;
    view-timeline-name: --📽️-example;
    anchor-name: --⚓-example;
    font-palette: --🔡-example;
    animation: 🔑-example 1s;

    > p {
      @container 📦-example (inline-size < 20ch) {
        font-size: var(--﹫-example);
      }
    }
  }
}

@layer 🥞-example-utilities {
  .🔧-utility-class,
  .🧹-reset-class,
  .🔍-debug-class {
    …
  }

  .🗣️-sr-only {}

  .🍱-grid {}
}
```

- **"I think it's a good idea to `--` all your custom names, just to make it really clear they aren't internal CSS keywords."** Both forms are valid where a `<custom-ident>` is allowed: MDN `container-name` takes a case-sensitive `<custom-ident>`, dashed allowed, not `or`, `and`, `not` or `default`, never quoted ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-name)). Same post.
- app-ui names containers without dashes (`@container main (inline-size >= 48rem)` in [page-layout.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/layout/shell/page-layout.css)). anti-slop-code's emoji rule is listed under comments: "decorative banners and emoji" ([anti-slop-code SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md)).
- Naming layers is covered in [Cascade layers](#cascade-layers); anchors and view transitions are covered in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md) and [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md).

## Specificity

The specificity facts from the sections above, in one place:

- **`:where()` adds zero**, so a layered `:where(.button)` base loses to any class rule (MDN, [above](#cascade-layers)).
- **Inside `@scope`**, MDN: bare selectors and `&` behave as if `:where(:scope)` were prepended, so they add zero specificity; `:scope` itself adds 0-1-0. MDN also warns: "The specificity of `&` inside `@scope` blocks is handled differently according to the browser engine and release version" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope)).
- **Between conflicting scopes, proximity decides**: the root with the fewest hops up the tree wins (MDN, [above](#scope)).
- **An anonymous layer is weaker than unlayered styles** ([TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md)).
- **The UA `[hidden]` rule is weak** enough that any custom `display` beats it ([above](#has-and-selectors)).

## What to study next

- **One list of modern features.** [nerdy.dev: One List To Rule Them All](https://nerdy.dev/cascading-secret-sauce) (2025-09-10) answers "how do I find what to study to keep up?" and "what's new in CSS?" with links grouped as Selectors, Pseudo Elements, Language, @rules, Color, Functions, Properties, Values, Queries and Units, and no explanations or code. Not every entry ships in all browsers; check each on MDN before using it. One listed name, `scrollbar-size`, does not exist ([SCROLLBARS.md](SCROLLBARS.md)).

## Headless, boneless, skinless, lifeless

[nerdy.dev: Headless, boneless, skinless & lifeless UI](https://nerdy.dev/headless-boneless-and-skinless-ui) (2024-10-16) names the layers developers compose "so they can **compose the layers themselves**". "Folks don't say skinless, boneless or lifeless. I'm teasing these strategies"; only "headless" is common jargon.

- **Headless:** "Working components; BYO (bring your own) style." HeadlessUI, ArkUI, React Aria, Radix Primitives, BaseUI, Kobalte, BitsUI. "Headless doesn't quite match what you get IMO, since these totally have a brain, muscle and structure."
- **Boneless:** "Just styles; BYO bones and life." Bootstrap, Tailwind, Bulma, Open Props, Tachyons, Foundation, Materialize; their value "is a system, consistency, or premade combinations".
- **Skinless:** "Just the markup; BYO skin and life." Unstyled functioning components: ArkUI, React Aria, AriaKit.
- **Lifeless:** "Just the life; BYO bones and skin." TanStack describes its offerings as "typesafe hooks" that don't "render or supply any actual UI elements": TanStack, ZagJS, FloatingUI, Downshift, React Aria Hooks, MeltUI.
- **The platform now covers some of this.** The post closes with Nils: it "doesn't even cover how much JS work that HTML and CSS are covering: popover, anchor, dialog, view transitions, scroll driven animation and custom select" ([POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md), [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md), [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md), [SCROLL.md](SCROLL.md), [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md)). app-ui instead uses "headless primitives for focus and dismissal" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)).

## Prove it

- **Layer order:** import a library into `layer(components.tooltip)`, then add `@layer components.tooltip { .some-new-context tool-tip { --_bg: red; } }` in a later file; the tooltip in that context turns red without touching the library file.
- **Anonymous layer loses:** wrap a rule in `@layer { * { opacity: .5 } }` and add an unlayered `p { opacity: 1 }`; paragraphs render at full opacity, and DevTools lists the layered rule below.
- **Zero-specificity base:** `.button { --_bg-color: red }` overrides `@layer components.base { :where(.button) { --_bg-color: transparent } }` even when it comes first in the file.
- **Scope proximity:** nest `.light` inside `.dark` inside `.light`; with the two `@scope` rules, each section takes the scheme of its nearest root regardless of rule order.
- **`:not(:has())`:** a `.card` with an `h3` is unaffected; one without matches.
- **Demotion only with hover:** on a touch device the list never fades; with a mouse every item except the hovered one drops to 0.25 opacity.
- **Corrected arc:** in a browser with `sibling-index()` and `abs()`, hovering item 5 of 9 leaves item 5 upright and fades items 1 and 9 the most.
- **`[hidden]` with a custom display:** give an element `display: grid` and the `hidden` attribute; it stays visible until the `display: none !important` rule is added.
- **No long dashes:** a search of this file for the em dash (U+2014) and en dash (U+2013) finds nothing.
