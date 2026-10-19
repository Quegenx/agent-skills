# CSS functions

Custom functions and mixins, typed `attr()`, tree-counting functions, trigonometric and stepped math, and the remaining draft functions. Sources: Adam Argyle's nerdy.dev posts and [css-modern-features] (rushenn/css-modern-features), tagged in each section. Existing source examples and official corrections are retained; browser support was checked 2026-10-17 as stated beside each feature. Custom-property systems, registration and live JS properties are in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md), and infinity recipes are in [CSS-INFINITY.md](CSS-INFINITY.md).

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

Status now: MDN says "CSS mixins are not currently supported in any browser" and that `@mixin`, `@apply`, `@contents` and `@env` have no browser support ([MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins)). The post (2025-03) said they could be tried in Chrome Canary launched with `--enable-features=CSSMixins`. The [mixin props](CUSTOM-PROPERTIES.md#ten-kinds-of-custom-property) pattern needs only custom properties.

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

## sibling-index() and sibling-count()

Both are Baseline 2026, newly available since August 2026 ([MDN sibling-index()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index), [MDN sibling-count()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count)). `sibling-count()` returns an `<integer>`, so unlike `counter()` it works in math (MDN: `width: calc(100% / sibling-count())`). Argyle proposed the idea in 2019 (csswg-drafts issue 4559); it is specced as css-values-5 "tree counting" [nerdy.dev: Let the stagger experiments begin](https://nerdy.dev/sibling-index) (2025-03-11, then "try it in Canary today"; the 2026-01 post said "stable Chrome and Safari").

- **No more inline index variables.** Instead of `style="--sibling-index: 1"` on every child, read it "just in time instead of doing the work in the template or JS":
  ```css
  .parent > * {
    transition: opacity 0.3s ease;
    transition-delay: calc(sibling-index() * 100ms);
  }
  ```
  The 2026 post subtracts 1 "so the first element starts immediately": `transition-delay: calc((sibling-index() - 1) * 100ms);`. The 100ms per item is a demo value; ui-animation keeps a total stagger under about 500 ms and caps how many items animate ([ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md)). Entry staggers with `@starting-style` are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).
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

## Stepped values

[css-modern-features, layout.md] "Snap values to a grid, compute remainders, and handle signs, all in CSS." Verbatim, with the dashes in the heading comments dropped:

```css
/* round(value, step): snap to grid */
.card {
  width: round(var(--container-width), 8px); /* snap to 8px grid */
}

/* Round to nearest, up, or down */
.font { font-size: round(nearest, 1.7rem, 0.25rem); }
.box  { width: round(up, 33.3%, 1px); }

/* mod(): CSS remainder (sign matches divisor) */
.stripe:nth-child(n) {
  background: oklch(calc(0.9 - mod(var(--i, 0), 3) * 0.1) 0 0);
}

/* abs(): always positive */
.offset { translate: abs(var(--x)) 0; }

/* sign(): returns -1, 0, or 1 */
.arrow {
  rotate: calc(sign(var(--delta)) * 45deg);
}
```

Status (web-features): `round()`, `mod()` and `rem()` are Baseline newly available since 2024-05-17 (Chrome 125, Firefox 118, Safari 17.2); `abs()` and `sign()` since 2025-06-26 (Chrome 138). The source gave all five as "Chrome 125, Safari 15.4, Firefox 118".

## Functions still coming

[nerdy.dev: CSS functions in the works](https://nerdy.dev/css-values-5-is-lookin-hot) (2024-08-26) lists the css-values-5 draft: `random()`, `random-item()`, `sibling-count()`, `sibling-index()`, `progress()`, `media-progress()`, `container-progress()`, `mix()`, `calc-mix()`, `cross-fade()`, `transform-mix()`, `first-valid()`, `toggle()`, `calc-size()`. Status on MDN now:

- `sibling-index()`, `sibling-count()`: Baseline 2026 (above).
- `progress()`: Baseline 2026, newly available since September 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/progress)). The posts give no code for it.
- `random()`: limited availability, Safari 26.2 only; `random(seed, min, max, step)` takes two to four comma-separated expressions, as in `random(0, 100)` or `random(0deg, 360deg)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/random)).
- `calc-size()`: limited availability, experimental ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size)).
- The rest were not checked; treat them as drafts, not rules.

## Prove it

- `grep -n 'if ('` over the stylesheet finds no `if()` call with a space before the parenthesis.
- No typed `attr()` uses a bare `color` type or a `url` type; each colour reads `type(<color>)`, and the page reads correctly in a browser without typed `attr()` (the fallback value shows).
- Elements that used hand-set `--sibling-index` variables now use `sibling-index()`, and a stagger's total stays within ui-animation's budget.
- Nothing ships on `@mixin` or `@apply`: no browser supports them.
- An `abs()` or `sign()` rule has a fallback for browsers before Chrome 138.
