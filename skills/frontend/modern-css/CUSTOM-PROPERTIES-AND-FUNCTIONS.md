# Custom properties, tokens and CSS functions

Custom properties as a design-system interface: the ten kinds Adam Argyle names, typed properties with `@property`, tokens (Open Props, Open Props UI, Tailwind v4 `@theme`), the status of mixins, `@function` and `if()`, typed `attr()`, and the math that now runs inside CSS (`calc(infinity)`, `sibling-index()` and `sibling-count()`, trig, `progress()`), plus live properties written from JS. Source: Adam Argyle's nerdy.dev posts, each tagged; current support comes from MDN (checked 2026-10-17) and is stated once where a feature is introduced. Code is copied from the posts unless a fix is named next to it. Colour tokens and palettes live in [COLOR.md](COLOR.md); stagger timing lives in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md); style queries live in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md).

**Contents:** [Ten kinds of custom property](#ten-kinds-of-custom-property) · [Typed properties with @property](#typed-properties-with-property) · [The custom property bomb](#the-custom-property-bomb) · [Tokens from Open Props](#tokens-from-open-props) · [Your tokens in Tailwind v4](#your-tokens-in-tailwind-v4) · [Mixins and @apply](#mixins-and-apply) · [Custom functions and if()](#custom-functions-and-if) · [Typed attr()](#typed-attr) · [calc(infinity)](#calcinfinity) · [sibling-index() and sibling-count()](#sibling-index-and-sibling-count) · [Trig and physics](#trig-and-physics) · [Functions still coming](#functions-still-coming) · [Live properties from JS](#live-properties-from-js) · [Prove it](#prove-it)

## Ten kinds of custom property

All from [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories) (2023-01-26).

- **Tokens** are "generally just global values, named objectively, and used atomically". They name what are otherwise "magic numbers", are "generally static and aren't overwritten later", and in some systems are "seldom directly used": they feed house props. "Think of them as globals constants." [Open Props](https://open-props.style/) "is a good example of offering just tokens."
  ```css
  :root {
    --size-1: 1rem;
    --size-2: 1.25rem;
    --blue-1: hsl(200 50% 50%);
    --blue-2: hsl(200 50% 60%);
    --gray-0: hsl(none none 90%);
    --gray-1: hsl(none none 10%);
  }
  ```
- **House props** are "named for project reusability" and "often point to a global token".
  ```css
  :root {
    --brand: var(--blue-1);
    --card-padding: var(--size-1);
    --surface: var(--gray-10);

    @media (prefers-color-scheme: dark) {
      --surface: var(--gray-1);  
    }
  }
  ```
- **Adaptive props** ("dynamic house props; these will change"): usage "no longer needs to care about writing a media query". His pattern: two house props with obvious names set the adaptive one.
  ```css
  :root {
    /* 2 house props */
    --text-dark-mode: var(--gray-0);
    --text-light-mode: var(--gray-10);

    /* 1 adaptive prop: defaults to light static prop */
    --text: var(--text-light-mode);

    @media (prefers-color-scheme: dark) {
      /* adaptive prop set to dark static prop */
      --text: var(--text-dark-mode);
    }
  }
  ```
  ```css
  :root {
    --adaptive-padding: var(--size-1);

    @media (width >= 320px)  { --adaptive-padding: var(--size-2) }
    @media (width >= 720px)  { --adaptive-padding: var(--size-3) }
    @media (width >= 1024px) { --adaptive-padding: var(--size-4) }
  }

  /* Usage */
  .card {
    padding: var(--adaptive-padding);
  }
  ```
  app-ui instead keeps "the text color as an RGB triplet" so "dark mode flips one value" ([app-ui TOKENS.md](../app-ui/TOKENS.md)).
- **Adaptive without a media query:** Ahmad Shadeed's conditional radius, square when the card is full width, rounded otherwise, and the Open Props version:
  ```css
  .card {
     border-radius: max(0px, min(8px, calc((100vw - 4px - 100%) * 9999)));
  }
  ```
  ```css
  /* Open Props sets them up like this */
  :root {
    --radius-conditional-2: clamp(0px, calc(100vw - 100%) * 1e5, var(--radius-2));
  }

  /* then authors get to use them like this! */
  .card {
    border-radius: var(--radius-conditional-2);
  }
  ```
  The 2026 form uses `infinity` and `vi` or `cqi` ([calc(infinity)](#calcinfinity)); the `100cqi` variant compares with the container instead. How these `vw` tricks meet anti-slop-ui's `vw` rule is in [RESPONSIVE.md](../../anti-ai-slop/anti-slop-ui/RESPONSIVE.md).
- **Pseudo-private props** (Lea Verou's name): start the name with `--_` and don't register it on `:root`; it signals "the intent to keep them localized to that component". Vanilla Extract emits this pattern. "I've seen usage where they are treated as overwritable, and I've seen usage where they are not."
  ```css
  .card {
    --_foo: 10px;
  }
  ```
- **Partial props** are "parts of a full usable prop", like colour channels, and can be used in `calc()`:
  ```css
  :root {
    --brand: hsl(var(--h) var(--s) var(--l));
    --text: hsl(var(--h) 30% 5%);
    --surface: hsl(var(--h) 25% 99%);

    @media (prefers-color-scheme: dark) {
      --brand: hsl(var(--h) calc(var(--s) / 2) calc(var(--l) / 2));
      --text: hsl(var(--h) 10% 90%);
      --surface: hsl(var(--h) 20% 10%);
    }
  }
  ```
  Argyle's advice in a different post is to manipulate colour in LCH-type spaces, not HSL ([COLOR.md](COLOR.md#lightness-lch-and-oklch-over-hsl)).
- **Mixin props** (Miriam Suzanne): partial props placed on shorthands act like function parameters. A "required" parameter reset to `initial` keeps the whole value invalid until an element supplies it:
  ```css
  * {
    /* define the mixin with a required parameter */
    --stripes: linear-gradient(
      var(--stripes-angle),
      powderblue 20%, 
      pink 20% 40%, 
      white 40% 60%, 
      pink 60% 80%, 
      powderblue 80%
    );

    /* reset the required parameter on each element */
    --stripes-angle: initial;  
    
    /* apply the results everywhere */
    /* (will only display when a valid angle is given) */
    background-image: var(--stripes);
  }
  ```
  ```css
  .stripes {
    /* providing a valid angle causes the "mixin" to work */
    --stripes-angle: to bottom right;
  }
  ```
- **Swap props** "flip n' flop so other props can swap": a 0 or 1 multiplied into math (Ana Tudor's "DRY switching", Jhey's demos). This one "only transforms if `--active` is 1":
  ```css
  a:is(:hover, :focus) {
    --active: 1;
  }

  :is(svg, .char) {
    transform:
      rotate(calc((var(--active, 0) * var(--r, 0)) * 1deg))
      translate(
        calc((var(--active, 0) * var(--x, 0)) * 1%),
        calc((var(--active, 0) * var(--y, 0)) * 1%)
      );
  }
  ```
  Jane Ori's **space toggles**: `initial` is off, a single space ("space, get it, toggle") is on. The post's last comment says "red" though the snippet has no red; it is copied as written.
  ```css
  /* mixin scope */
  .hover-mixin {
    --_hover: initial;

    &:hover {
      --_hover: ; /* space, get it, toggle */
    }
  }

  /* usage */
  .button.hover-mixin {
    background-color: var(--_hover) green;
    /* when hover value is " " it's red */
  }
  ```
  Libraries built on it: css-media-vars (`width: var(--media-md) 60ch;`) and the PostCSS plugin `@csstools/postcss-conditional-values` (`color: csstools-if(--is-fancy green else red);`).
- **Style query props** are enums "for theming, state machines, you name it" (`@container style(--vibe: primary)`); see [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md). The post was written for Canary.
- **Meta-lang props** "make your own CSS API": a pass-through property.
  ```css
  * {
    padding: var(--gapadding);
    gap: var(--gapadding);
  }

  .card {
    --gapadding: 1rem;
  }
  ```
- **Typed props** via `@property` give "type safety" and "can be interpolated within their type": next section.

## Typed properties with @property

`@property` is Baseline 2024, newly available since July 2024 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property)). The 2023 post's "still awaiting cross browser interop ... Firefox is almost done" is out of date.

- **Why register** [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): "when building a system", limit what goes into variables. With `@property` a system given an invalid colour "remained functioning with the latest known valid color value". It "1. Formalizes CSS system interfaces 2. Protects CSS systems 3. Enables new animation powers 4. Can perform better when using `inherits: false`". Typed values animate because "the browser can infer the steps needed to interpolate".
  ```css
  @property --color-1 {
    syntax: "<color>";
    inherits: false;
    initial-value: rebeccapurple;
  }
  ```
  For the performance point the post links Bramus's measurements of registered and unregistered properties, [web.dev/blog/at-property-performance](https://web.dev/blog/at-property-performance) ([nerdy.dev: Benchmarking Custom Properties](https://nerdy.dev/benchmarking-custom-properties), 2024-10-02; the note itself has no numbers).
- **A wrong-typed value keeps the last good one, silently** [nerdy.dev: Type safe CSS design systems with @property](https://nerdy.dev/cant-break-this-design-system) (2023-09-01): "It doesn't crash the page, lock a thread, and unfortunately also won't tell you in any console". The post's last comment is unterminated (`*.`), which would swallow the closing brace; it is fixed to `*/` here (a comment ends with `*/`, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/Comments)).
  ```css
  @property --hue {
    syntax: '<angle>';
    initial-value: .5turn;
    inherits: false;
  }
  ```
  ```css
  .card {
    --hue: 90deg; /* ✅ */
    --hue: #f00;  /* ❌ */
    background: oklch(98% .01 var(--hue));

    /* background will always resolve 👍🏻 */
    /* --hue resolves 90deg */
  }
  ```
- **Which types `syntax` accepts.** The post lists nineteen CSS types as type primitives. MDN's `syntax` page lists fifteen supported names: `<angle>`, `<color>`, `<custom-ident>`, `<image>`, `<integer>`, `<length>`, `<length-percentage>`, `<number>`, `<percentage>`, `<resolution>`, `<string>`, `<time>`, `<transform-function>`, `<transform-list>`, `<url>` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property/syntax)). The post's `<hue>`, `<position>`, `<ratio>`, `<flex>`, `<frequency>` and `<dimension>` are not on it, so register a hue as `<angle>`, as the post itself does.
- **Two levels, adopted incrementally:** an untyped property can hold a typed one ("Sounds like Typescript and SCSS right?"); go "many levels deep, but not too deep".
  ```css
  .card {
    --_bg: oklch(98% .01 var(--hue));
    background: var(--_bg);

    @media (prefers-color-scheme: dark) {
      --_bg: oklch(15% .1 var(--hue));
    }
  }
  ```
- **A typed adaptive surface starter:** a typed brand hue that inherits, three `<color>` surfaces, and a theme switch with `:has()` in a layer. In the demo a text input writes to `--hue`, and typing garbage never breaks the colour system.
  ```css
  @property --hue {
    syntax: '<angle>';
    initial-value: 5rad;
    inherits: true;
  }
  ```
  ```css
  @property --surface {
    syntax: '<color>';
    initial-value: #333;
    inherits: true;
  }

  @property --surface-over {
    syntax: '<color>';
    initial-value: #444;
    inherits: true;
  }

  @property --surface-under {
    syntax: '<color>';
    initial-value: #222;
    inherits: true;
  }
  ```
  ```css
  @layer demo.theme {
    html:has(#light:checked) {
      color-scheme: light;
      --surface: oklch(90% .05 var(--hue));
      --surface-over: oklch(99% .02 var(--hue));
      --surface-under: oklch(85% .075 var(--hue));
    }
    
    html:has(#dark:checked) {
      color-scheme: dark;
      --surface: oklch(20% .1 var(--hue));
      --surface-over: oklch(30% .1 var(--hue));
      --surface-under: oklch(15% .1 var(--hue));
    }
  }
  ```
- **Animation:** a registered `--focal-size` is "enough to teach some browsers how to animate a gradient used into a mask" ([nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories), 2023-01-26; the 2023-09 post types it `<length-percentage>`). Registering to animate in `@keyframes` is in [svg STYLING.md](../svg/STYLING.md); gradient uses are in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md).
- anti-slop-ui registers its fluid tokens so they are "computed on `:root`" and on the page area ([RESPONSIVE.md](../../anti-ai-slop/anti-slop-ui/RESPONSIVE.md)).

## The custom property bomb

[nerdy.dev: Lol Bomb](https://nerdy.dev/lol-bomb) (2021-08-01): the billion laughs attack, "a type of DoS attack aimed at XML parsers", in custom properties. "CSS was a victim of this when custom properties were introduced." The spec's defence is in [css-variables, long variables](https://drafts.csswg.org/css-variables/#long-variables).

```css
:root {
  --ha1: lol;
  --ha2: var(--ha1) var(--ha1) var(--ha1);
  --ha3: var(--ha2) var(--ha2) var(--ha2);
  --ha4: var(--ha3) var(--ha3) var(--ha3);
  --ha5: var(--ha4) var(--ha4) var(--ha4);
  ...
}
```

## Tokens from Open Props

- **Open Props offers tokens and adaptive props:** `--surface-{1-4}` and `--text-{1,2}` adapt to light and dark in its normalize, so a card mixes adaptive props and static tokens with no media query [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories) (2023-01-26):
  ```css
  .card {
    background: var(--surface-2); /* adaptive prop */
    color: var(--text-1); /* adaptive prop */
    border-radius: var(--radius-conditional-2); /* adaptive prop */
    padding: var(--size-3); /* global token */
    box-shadow: var(--shadow-2); /* global token */
  }
  ```
  "Adaptive tokens are often setup by the 'back of the front' team, so the 'front of the front' folks can just use them." Its OKLCH palettes from one hue are in [COLOR.md](COLOR.md#oklch-palettes-from-one-hue).
- **Open Props UI components** keep private `--_` props inside zero-specificity `:where()` in a layer [nerdy.dev: Open Props UI](https://nerdy.dev/open-props-ui) (2025-01-15; excerpt as the post shows it):
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
  Layer ordering and later overrides into a layer are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md).
- **One token sheet for many web components:** VisBug's Shadow DOM components adopted Open Props "for the easings, shadows and gray palette. Since all the web components adopt the same stylesheet of variables, it was really easy to integrate." [nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update) (2024-04-28). `adoptedStyleSheets` is Baseline widely available since March 2023; one constructed `CSSStyleSheet` can be set on each `ShadowRoot.adoptedStyleSheets`, changing it updates every adopter, and a sheet from another document throws `NotAllowedError` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets)).
- **A time token:** `--atom: 0.15957s;` from Open Props durations; the note gives only the declaration [nerdy.dev: One Atom Of Time In CSS](https://nerdy.dev/one-atom-of-time-in-css) (2023-11-30).

## Your tokens in Tailwind v4

[nerdy.dev: BYO CSS tokens to Tailwind v4's new CSS centric config](https://nerdy.dev/BYO-CSS-tokens-to-tailwind-v4s-new-CSS-centric-config) (2024-03-18), written against the v4 alpha.

- **Setup:** `@import "tailwindcss";`, then your token file, then `@theme { }`. Reset a default namespace with `--<namespace>-*: initial;` (the post resets `--font-size-*`; the stable docs show `--color-*: initial;`, [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)); the rules "look like naming hooks": a property named into a namespace generates its utilities, so "hook into the naming while also supplying your own design tokens as values".
- **Font sizes, corrected for stable v4.** The post maps `--font-size-*`, the alpha name. The stable docs map font size utilities to `--text-*` ("`--text-` | Font size utilities like text-xl", [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)), so the post's block becomes:
  ```css
  @theme {
    --text-*: initial;
    --text-00: var(--font-size-00);
    --text-0: var(--font-size-0);
    --text-1: var(--font-size-1);
    --text-2: var(--font-size-2);
    --text-3: var(--font-size-3);
    --text-4: var(--font-size-4);
    --text-5: var(--font-size-5);
    --text-6: var(--font-size-6);
    --text-7: var(--font-size-7);
    --text-8: var(--font-size-8);
  }
  ```
  Usage stays `<h1 class="text-5">…</h1>`. The post's gradients (`--background-image-gradient-1: var(--gradient-1);` for `bg-gradient-1`) use a namespace the stable docs don't list: [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) has no `--background-image-*` row, and the [background-image page](https://tailwindcss.com/docs/background-image) reads a custom property with `bg-(image:<custom-property>)` instead.
- **Adaptive utilities:** one class, theme decided higher up. Instead of `bg-gray-2 dark:bg-gray-12`, write `bg-surface`: the `--color` hook builds the utilities and plain custom properties carry the light and dark values. "No noise about light or dark, that's configured higher up in the stack and templates don't need to deal with it."
  ```css
  @theme {
    --color-ink-1: var(--ink-1);
    --color-ink-2: var(--ink-2);
    --color-surface-1: var(--surface-1);
    --color-surface-2: var(--surface-2);
    --color-link: var(--link);
  }
  ```
  ```css
  :root {
    --ink-1: var(--gray-9);
    --ink-2: var(--gray-7);
    --surface-1: var(--gray-2);
    --surface-2: var(--gray-1);
    --link: var(--indigo-6);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --ink-1: var(--gray-1);
      --ink-2: var(--gray-5);
      --surface-1: var(--gray-11);
      --surface-2: var(--gray-10);
      --link: var(--indigo-4);
    }
  }
  ```
  app-ui uses "a class-based dark variant (`@custom-variant dark (&:is(.dark *))`), so the head script's class decides the theme", not a media query ([app-ui CHECKS.md](../app-ui/CHECKS.md)).

## Mixins and @apply

[nerdy.dev: CSS Mixins are ready for experimentation!](https://nerdy.dev/css-mixins-ready-for-experimentation) (2025-03-26): "I think of functions as returning a value and mixins as a way to apply a chunk of styles." The post's syntax:

```css
@mixin --box {
  aspect-ratio: 1;
  inline-size: 100px;
  block-size: 100px;
}
```

```css
.box {
  @apply --box;
}
```

Status now: MDN says "CSS mixins are not currently supported in any browser" and that `@mixin`, `@apply`, `@contents` and `@env` have no browser support ([MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins)). The post (2025-03) said they could be tried in Chrome Canary launched with `--enable-features=CSSMixins`. The [mixin props](#ten-kinds-of-custom-property) pattern above needs only custom properties.

## Custom functions and if()

`@function` and `if()` are both not Baseline, experimental, and Chromium only (Chrome and Edge 139 for `@function`, 137 for `if()`; [MDN @function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function), [MDN if()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if)); MDN's guide says "only CSS custom functions have browser support" of the two families.

- **Shape:** the name is a case-sensitive `<dashed-ident>`, and the `result` descriptor holds the returned value. MDN's example:
  ```css
  @function --double(--value) {
    result: calc(var(--value) * 2);
  }

  p {
    --base-spacing: 10px;
    padding: --double(var(--base-spacing)); /* 20px */
  }
  ```
- **A `--light-dark()` that works for any value** [nerdy.dev: A Rad Function To Be Excited About](https://nerdy.dev/a-rad-function-to-be-excited-about) (2025-10-01), quoting [Bramus](https://www.bram.us/2025/09/30/css-custom-light-dark/): "In 3 lines, a `--light-dark()` CSS function that works anywhere". As exported it has a space in `if (`, and MDN says "There must be no space between the `if` and the opening parenthesis (`(`). If there is, the whole declaration is invalid." Fixed:
  ```css
  @function --light-dark(--l, --d) {
    result: if(color-scheme(dark): var(--d); else: var(--l));
  }
  ```
  MDN's `if()` page documents only `style()`, `media()` and `supports()` tests and does not mention `color-scheme()`, so check Bramus's post before relying on that test. MDN's own scheme example tests the user preference, `media(prefers-color-scheme: dark)`, not the element's scheme. The built-in `light-dark()` covers colours and images ([COLOR.md](COLOR.md#light-dark-and-color-scheme)).

## Typed attr()

Base `attr()` is Baseline widely available, but "support for properties other than `content` is experimental" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/attr)). The posts call it "Advanced `attr()` in Chrome 133" ([nerdy.dev: Advanced Attr](https://nerdy.dev/advanced-attr), 2025-01-17) and "type-safe and more powerful", "a powerful bridge between HTML and CSS" ([nerdy.dev: 4 CSS Features Every Front-End Developer Should Know In 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026), 2026-01-07). Feature-detect it with `@supports (x: attr(x type(*))) { … }` or `CSS.supports("x: attr(x type(*))")` (MDN).

- **Colours, corrected.** The 2026 post writes `attr(data-bg color, black)`. MDN's grammar is `<attr-type> = type( <syntax> ) | raw-string | number | <attr-unit>`, and `color` is not a keyword there, so a colour is `type(<color>)`:
  ```html
  <div data-bg="white" data-fg="deeppink"></div>
  ```
  ```css
  .theme {
    background: attr(data-bg type(<color>), black);
    color: attr(data-fg type(<color>), white);
  }
  ```
  The wishlist post already used that form: `background: attr(data-bgcolor type(<color>), rebeccapurple);` ([nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17).
- **Numbers** (`number` is a listed keyword, so this is valid as written):
  ```html
  <div class="grid" data-columns="3">…</div>
  ```
  ```css
  .grid {
    --_columns: attr(data-columns number, 3);

    display: grid;
    grid-template-columns: repeat(var(--_columns), 1fr);
  }
  ```
- **Enums: CSS owns the allowed values.** "The `type()` function validates attribute values against allowed keywords. Invalid values fall back gracefully." `type()` on its own page is limited availability ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/type)).
  ```html
  <li scroll-snap="start"></li>
  <li scroll-snap="center"></li>
  <li scroll-snap="end"></li>
  <li scroll-snap="nothing"></li>
  ```
  ```css
  [scroll-snap] {
    scroll-snap-align: attr(scroll-snap type(start | center | end));
  }
  ```
- **Not a URL.** The wishlist's icon idea, `url("…" attr(data-icon type(<string>)))`, was a wish; MDN says "`<url>` is not allowed as an `attr()` type, for security reasons." Don't copy it.

## calc(infinity)

[nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases) (2026-07-25). The `<calc-keyword>` values (`infinity`, `-infinity`, `NaN`, `pi`, `e`) are Baseline widely available since December 2022; "an infinite value is clamped to the allowed range" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword)).

- **Basics:** "`infinity` and `-infinity` need to always be wrapped in `calc()`"; a dimension also needs a unit multiplier. It works in `clamp()`, `min()` and `max()` too.
  ```css
  div {
    border-radius: calc(infinity * 1px);
    z-index: calc(infinity);
  }
  ```
  For pills it replaces the old `1e9px`. app-ui's `--radius-full` is `calc(infinity * 1rem)`, "a pill at any height" ([app-ui TOKENS.md](../app-ui/TOKENS.md)).
- **The browser's max int:** `z-index: calc(infinity)` maxes out at `2147483647`, which a counter can show:
  ```css
  .css-max-int {
    counter-reset: cssInt calc(infinity);

    &::after {
      content: counter(cssInt);
    }
  }
  ```
  Two views on using it for stacking: the post offers it to "beat `z-index: 999999999`"; anti-slop-ui says "Escalating to `z-index: 9999` only moves the fight" and sends floating layers to the top layer ([DETAILS.md](../../anti-ai-slop/anti-slop-ui/DETAILS.md), [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md)).
- **No floor, no ceiling:**
  ```css
  div {
    inline-size: clamp(
      calc(-infinity * 1px), /* no floor */
      100%, 
      calc(infinity * 1px)   /* no ceiling */
    );
  }
  ```
- **A radius that switches on:** "If the elements inline-size is less than 100vi, the radius will be 0. If it's greater than 100vi, the radius will be 20px." Open Props ships a set.
  ```css
  .viewport-responsive-radius {
    border-radius: clamp(0px, (100vi - 100%) * infinity, 20px);
  }

  .container-responsive-radius {
    border-radius: clamp(0px, (100cqi - 100%) * infinity, 20px);
  }
  ```
- **Booleans:** "Clamp an arbitrary number down to exactly 0 or 1, then use it"; "One variable now can drive color, offset, opacity, gaps, whatever."
  ```css
  .flippy {
    --solo: clamp(0, (2 - sibling-count()) * infinity, 1);
    --crowded: clamp(0, (sibling-count() - 5) * infinity, 1);

    flex-grow: calc(1 - var(--solo));
    font-size: calc(1rem - var(--crowded) * 0.125rem);
  }
  ```
- **Perma-state:** an infinite duration "appears to be frozen"; on hover the duration drops to `.2s`, so the hovered state sticks for the page's life (the post's demo):
  ```css
    .perma-state-example {
      --size: min(3vi, 3ch);
      display: grid;
      grid: var(--size) var(--size) var(--size) / auto-flow var(--size);
      gap: 5px;

      > div {
        border: 2px solid var(--text-2);
        transition: background calc(infinity * 1s) ease;

        &:hover {
          background: var(--text-2);
          transition-duration: .2s;
        }
      }
    }
  ```
  Freezing view transitions for inspection is in [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md); the never-reverse scroll trigger is in [SCROLL.md](SCROLL.md).
- **Doesn't work:** a backdrop from an infinite spread, `.backdrop { box-shadow: 0 0 0 calc(infinity * 1px) #0005; }`, carries the post's own warning, "This actually doesn't work!" ([Bramus explains why](https://front-end.social/@bramus/117043307620167329)).

## sibling-index() and sibling-count()

Both are Baseline 2026, newly available since August 2026 ([MDN sibling-index()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index), [MDN sibling-count()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count)). `sibling-count()` returns an `<integer>`, so unlike `counter()` it works in math (MDN: `width: calc(100% / sibling-count())`). Argyle proposed the idea in 2019 (csswg-drafts issue 4559); it is specced as css-values-5 "tree counting" [nerdy.dev: Let the stagger experiments begin](https://nerdy.dev/sibling-index) (2025-03-11, then "try it in Canary today"; the 2026-01 post said "stable Chrome and Safari").

- **No more inline index variables.** Instead of `style="--sibling-index: 1"` on every child, read it "just in time instead of doing the work in the template or JS":
  ```css
  .parent > * {
    transition: opacity 0.3s ease;
    transition-delay: calc(sibling-index() * 100ms);
  }
  ```
  The 2026 post subtracts 1 "so the first element starts immediately": `transition-delay: calc((sibling-index() - 1) * 100ms);`. The 100ms per item is a demo value; ui-animation keeps a total stagger under about 500 ms and caps how many items animate ([ui-animation TIMING.md](../ui-animation/TIMING.md)). Entry staggers with `@starting-style` are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).
- **Stagger anything, not only time.** "Here the hue increments by 50 each element"; add "a `min()` or `clamp()` or trig functions" as needed.
  ```css
  .parent > * {
    --hue: calc(sibling-index() * 50);
    color: oklch(70% 70% var(--hue));
  }
  ```
- **Older posts use a hand-set variable** (`var(--sibling-index)`), such as the hover arc in [nerdy.dev: :hover > :not(:hover), sorry not sorry](https://nerdy.dev/hover-not-hover-sorry-not-sorry) (2025-01-06); its rewrite with `sibling-index()` and `abs()` support are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#focus-by-demotion).

## Trig and physics

- **A radio group on a circle** ([nerdy.dev: Cyclical keyboard UX with a radio group and CSS trig functions](https://nerdy.dev/cyclical-radio-group-with-trig-functions-and-grid), 2023-03-10): the post's code and its `sibling-index()` rewrite are in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#radio-and-checkbox-groups). `cos()` and `sin()` are Baseline widely available since March 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/cos)).
- **Physics in pure CSS** [nerdy.dev: CSS Physics](https://nerdy.dev/css-physics) (2024-05-31): "I transferred a JS physics function into CSS thanks to `sqrt()`, `exp()`, `sin()`, `cos()` and `@property`." "Change the properties and see a different animation"; the function body is only on [CodePen](https://codepen.io/argyleink/pen/KKLaNdd). `sqrt()` and `exp()` are Baseline widely available since December 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sqrt)).
  ```css
  :root {
    --mass: 1;
    --stiffness: 100;
    --damping: 5;
    --start-velocity: 0; 
  }
  ```

## Functions still coming

[nerdy.dev: CSS functions in the works](https://nerdy.dev/css-values-5-is-lookin-hot) (2024-08-26) lists the css-values-5 draft: `random()`, `random-item()`, `sibling-count()`, `sibling-index()`, `progress()`, `media-progress()`, `container-progress()`, `mix()`, `calc-mix()`, `cross-fade()`, `transform-mix()`, `first-valid()`, `toggle()`, `calc-size()`. Status on MDN now:

- `sibling-index()`, `sibling-count()`: Baseline 2026 (above).
- `progress()`: Baseline 2026, newly available since September 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/progress)). The posts give no code for it.
- `random()`: limited availability, Safari 26.2 only; `random(seed, min, max, step)` takes two to four comma-separated expressions, as in `random(0, 100)` or `random(0deg, 360deg)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/random)).
- `calc-size()`: limited availability, experimental ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size)).
- The rest were not checked; treat them as drafts, not rules.

## Live properties from JS

- **Prop For That** [nerdy.dev: Prop For That](https://nerdy.dev/prop-for-that) (2026-06-13): his library writes live custom properties onto any element that asks with `data-props-for`, for the "few lines of JS" people keep writing "to just write a custom property to a component". Every plugin loads only when needed; an imperative API exists too.
  ```js
  import 'prop-for-that/auto'
  // or import 'https://esm.sh/prop-for-that/auto'
  ```
  ```html
  <input type="range" data-props-for="range" min="0" max="100" value="40" />
  ```
  ```css
  input[type="range"] {
    background: linear-gradient(
      to right in oklab,
      var(--theme) calc(var(--live-value-pct) * 100%),
      var(--track) 0
    );
  }
  ```
  What it provides: pointer x/y in the window and local to an element; viewport and visual viewport sizes; element size and visibility; scrollbar sizes; input values and dirty, touched, pristine; select value, index and count; colours from an image, gradient or video; video progress; image loaded or broken plus natural size; clock time; FPS; online status; page focused or visible; scroll velocity; device tilt; geolocation; DPR, CPU cores and memory; navigation type. Chromium only: network status, battery, CPU pressure. With style queries: `<form data-props-for="form-state">` then `@container style(--live-all-valid: 1) { … }`. The post says "Style Queries being in all major browsers ... made this library much more viable" (2026-06).
- **Per frame from a mic** [nerdy.dev: Learn With Jason (live in studio)](https://nerdy.dev/jason-and-adam-do-portland) (2024-02-07): read the audio stream each `requestAnimationFrame` and write it to properties; written every frame, the property needs no `@property` transition.
  ```js
  html.style.setProperty("--frequency-low", low.value + "%");
  html.style.setProperty("--frequency-high", high.value + "%");
  ```

## Prove it

- Set a registered `<angle>` property to a colour in DevTools: the computed value stays at the last valid angle and the element still paints.
- Every `syntax` in a registration names a type from MDN's list of fifteen; none uses `<hue>`, `<ratio>` or `<position>`.
- `grep -n 'if ('` over the stylesheet finds no `if()` call with a space before the parenthesis.
- No typed `attr()` uses a bare `color` type or a `url` type; each colour reads `type(<color>)`, and the page reads correctly in a browser without typed `attr()` (the fallback value shows).
- Tailwind v4 `@theme` blocks use `--text-*` for font sizes; `text-5` renders the mapped size.
- `calc(infinity)` lengths carry a unit multiplier; no `z-index: calc(infinity)` stands in for the top layer.
- Elements that used hand-set `--sibling-index` variables now use `sibling-index()`, and a stagger's total stays within ui-animation's budget.
- Nothing ships on `@mixin` or `@apply`: no browser supports them.
