# Custom properties and tokens

Custom properties as a design-system interface: the ten kinds Adam Argyle names, typed properties with `@property`, tokens (Open Props, Open Props UI, Tailwind v4 `@theme`), and live properties written from JS. CSS functions, typed `attr()`, tree-counting and math are in [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md); infinity recipes are in [CSS-INFINITY.md](CSS-INFINITY.md). Source: Adam Argyle's nerdy.dev posts, each tagged, plus a few bullets tagged [css-modern-features] (rushenn/css-modern-features, MIT) and [Libraries.dev] (its free `libraries-dev` skill, MIT); current support comes from MDN (checked 2026-10-17) and is stated once where a feature is introduced. Code is copied from the posts unless a fix is named next to it. Colour tokens and palettes live in [COLOR.md](COLOR.md); stagger mechanics live in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md); style queries live in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md).

**Contents:** [Ten kinds of custom property](#ten-kinds-of-custom-property) · [Typed properties with @property](#typed-properties-with-property) · [The custom property bomb](#the-custom-property-bomb) · [Tokens from Open Props](#tokens-from-open-props) · [Your tokens in Tailwind v4](#your-tokens-in-tailwind-v4) · [Live properties from JS](#live-properties-from-js) · [Prove it](#prove-it)

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
  app-ui instead keeps "the text color as an RGB triplet" so "dark mode flips one value" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).
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
  The 2026 form uses `infinity` and `vi` or `cqi` ([CSS infinity](CSS-INFINITY.md)); the `100cqi` variant compares with the container instead. How these `vw` tricks meet anti-slop-ui's `vw` rule is in [RESPONSIVE.md](RESPONSIVE.md).
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

- **Why register** [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): "when building a system", limit what goes into variables. It "1. Formalizes CSS system interfaces 2. Protects CSS systems 3. Enables new animation powers 4. Can perform better when using `inherits: false`". Typed values animate because "the browser can infer the steps needed to interpolate".
  ```css
  @property --color-1 {
    syntax: "<color>";
    inherits: false;
    initial-value: rebeccapurple;
  }
  ```
  For the performance point the post links Bramus's measurements of registered and unregistered properties, [web.dev/blog/at-property-performance](https://web.dev/blog/at-property-performance) ([nerdy.dev: Benchmarking Custom Properties](https://nerdy.dev/benchmarking-custom-properties), 2024-10-02; the note itself has no numbers).
- **Invalid registered values use inheritance or the initial value.** Registration syntax is checked at computed-value time; an invalid value behaves as `unset`, so an inherited registration uses the inherited value and a non-inherited registration uses its initial value. It does not recover an earlier cascaded declaration. [CSS Properties and Values API](https://www.w3.org/TR/css-properties-values-api-1/#computed-value-time), [CSS Variables](https://www.w3.org/TR/css-variables-1/#invalid-variables)
  The 2023 [nerdy.dev post](https://nerdy.dev/cant-break-this-design-system), the 2025 snippets post and our old line said "last known good value"; the removed example wrongly claimed `90deg` survived a later colour assignment and also had an unterminated comment in the source. This source registration instead has `.5turn` as its non-inherited initial value:
  ```css
  @property --hue {
    syntax: '<angle>';
    initial-value: .5turn;
    inherits: false;
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
- **Animation:** a registered `--focal-size` is "enough to teach some browsers how to animate a gradient used into a mask" ([nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories), 2023-01-26; the 2023-09 post types it `<length-percentage>`). Registering to animate in `@keyframes` is in [svg STYLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/STYLING.md); gradient uses are in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md).
- **Register from JS when the initial value is computed at runtime** [css-modern-features, houdini.md]: "Use `@property` in CSS when possible; use `CSS.registerProperty()` when the initial value is dynamic or computed at runtime." Its floors are Chrome 78, Firefox 128 and Safari 16.4 (browser-compat-data `api.CSS.registerProperty_static`), the source's numbers; `@property` itself is Chrome 85. Verbatim:
  ```js
  CSS.registerProperty({
    name: '--theme-hue',
    syntax: '<number>',
    inherits: true,
    initialValue: '260',
  });
  ```
- **Rotating border beams** [Libraries.dev, border-beam]: its rotate types "animate registered CSS custom properties (`@property`)", and without it "Older browsers step instead of interpolating." "Paint cost comes from masks, conic/radial gradients and blur filters redrawn every frame. Keep a handful of live beams per screen." The source puts `@property` at "Safari 15.4+"; it is Safari 16.4 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property)). The rounded shine border is in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md#borders-scrims-and-shadows).
- anti-slop-ui registers its fluid tokens so they are "computed on `:root`" and on the page area ([RESPONSIVE.md](RESPONSIVE.md)).

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
- **Open Props UI components** keep private `--_` props in a layered zero-specificity base; the complete source example and cascade mechanics are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#cascade-layers). [nerdy.dev: Open Props UI](https://nerdy.dev/open-props-ui) (2025-01-15)
- **One token sheet for many web components:** VisBug's Shadow DOM components adopted Open Props "for the easings, shadows and gray palette. Since all the web components adopt the same stylesheet of variables, it was really easy to integrate." [nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update) (2024-04-28). `adoptedStyleSheets` is Baseline widely available since March 2023; one constructed `CSSStyleSheet` can be set on each `ShadowRoot.adoptedStyleSheets`, changing it updates every adopter, and a sheet from another document throws `NotAllowedError` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets)).
- **A time token:** `--atom: 0.15957s;` from Open Props durations; the note gives only the declaration [nerdy.dev: One Atom Of Time In CSS](https://nerdy.dev/one-atom-of-time-in-css) (2023-11-30).

## Your tokens in Tailwind v4

[nerdy.dev: BYO CSS tokens to Tailwind v4's new CSS centric config](https://nerdy.dev/BYO-CSS-tokens-to-tailwind-v4s-new-CSS-centric-config) (2024-03-18), written against the v4 alpha.

- **Setup:** `@import "tailwindcss";`, then your token file, then `@theme { }`. Reset a default namespace with `--<namespace>-*: initial;` (the post resets `--font-size-*`; the stable docs show `--color-*: initial;`, [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)); the rules "look like naming hooks": a property named into a namespace generates its utilities, so "hook into the naming while also supplying your own design tokens as values".
- **Aliases to other variables:** use `@theme inline` when defining theme values that reference another variable, so generated utilities use the referenced value directly. Ordinary aliases resolve where the theme variable is defined, which can differ from where a utility is used. The alpha post and our old font-size and adaptive-utility examples used ordinary `@theme` aliases without this scope qualification. The excerpts below retain that source wrapper for comparison; apply the documented `@theme inline` form when adopting these aliasing recipes. Ordinary aliases can still work where their referenced values resolve in the same scope; see [the scope qualification](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/TAILWIND.md#dark-mode-and-theme-inline). [Tailwind: Referencing other variables](https://tailwindcss.com/docs/theme#referencing-other-variables)
- **Font-size namespace, corrected for stable v4; alias wrapper retained from the alpha.** The post maps `--font-size-*`, the alpha name. The stable docs map font size utilities to `--text-*` ("`--text-` | Font size utilities like text-xl", [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)). The existing namespace correction is retained below, but use `@theme inline` for its aliases as documented above:
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
- **Adaptive utilities:** one class, theme decided higher up. Instead of `bg-gray-2 dark:bg-gray-12`, write `bg-surface`: the `--color` hook builds the utilities and plain custom properties carry the light and dark values. "No noise about light or dark, that's configured higher up in the stack and templates don't need to deal with it." The following source-alpha excerpt also retains ordinary `@theme`; use the official `@theme inline` aliasing form above when adopting it.
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
  app-ui uses "a class-based dark variant (`@custom-variant dark (&:is(.dark *))`), so the head script's class decides the theme", not a media query ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).

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

- Set a registered `<angle>` property to a colour in DevTools: check the inherited or initial fallback described in [Typed properties](#typed-properties-with-property), rather than expecting an earlier declaration to survive.
- Every `syntax` in a registration names a type from MDN's list of fifteen; none uses `<hue>`, `<ratio>` or `<position>`.
- Tailwind v4 font-size mappings use `--text-*`; aliases to other variables follow the [`@theme inline` caveat](#your-tokens-in-tailwind-v4), including when the referenced variable changes in a descendant.
- `CSS.registerProperty()` appears only where an initial value is computed at runtime; the rest are `@property` rules.
