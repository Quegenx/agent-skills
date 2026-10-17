# Accessible SVG

Every SVG on a page is either informative (it needs a text alternative) or decorative (it should be removed from the accessibility tree). The mechanism differs by embedding: an `<img>` gets its name from `alt`, while inline SVG does not support `alt` and is named with `role="img"` plus `<title>`, `aria-labelledby` or `aria-label`. `role="img"` makes screen readers treat the whole SVG as one image and read its label instead of every child node. Inline display has the best support. Embedding choices are in [EMBEDDING-AND-ICONS.md](EMBEDDING-AND-ICONS.md).

## Informative SVG

### In an img

- **Use `alt`,** and add `role="img"` so assistive technologies recognize the element as an image:

```html
<img src="XXX.svg" role="img" alt="replacement text">
```

- **Don't point `aria-labelledby` at hidden text** on an `<img>`. `aria-label` on an `<img>` is a second choice, because it violates the first rule of ARIA.

### Inline

- **`role="img"` on the outer `<svg>` plus a label** makes it a single entity: browsers make all descendants of an `img` role presentational, and screen readers describe it using the label.

```html
<svg role="img" aria-label="Description of your SVG image">
  <!-- contents of the SVG image -->
</svg>
```

- **`<title>` is the short text alternative.** It is not rendered and may show as a tooltip. Make it the first child after the `<svg>` opening tag (for SVG 1.1 backward compatibility, `<title>` should be the first child of its parent).
- **`<desc>` is the long description,** also not rendered. If `aria-describedby` is used, it takes precedence over `<desc>`.
- **Put both ids in `aria-labelledby`.** MDN references title and desc together in `aria-labelledby` because it has better assistive technology support than `aria-describedby`; Orange also says to avoid `aria-describedby` for the description and recommends `aria-labelledby="alt-text description"`.

```html
<svg viewBox="0 0 100 125" role="img" aria-labelledby="svgTitle svgDescription">
  <title id="svgTitle">Manual</title>
  <desc id="svgDescription">A nondescript twelve page booklet opened to the middle page</desc>
  ...
</svg>
```

- **Prefer a visible label when one exists.** MDN's `<title>` reference recommends `aria-labelledby` pointing at visible text rather than the `<title>` element.
- **The two Orange patterns for inline:**

```html
<!-- informative inline -->
<svg role="img">
  <title>replacement text</title>
  ...
</svg>
<svg role="img" aria-labelledby="alt-text">
  <title id="alt-text">replacement text</title>
  ...
</svg>
```

- **Hide `<use>` clones inside an informative SVG:**

```html
<!-- use clones inside an informative svg -->
<svg role="img">
  <title>replacement text</title>
    <use href="some-id" fill="blue" x="5" y="5" aria-hidden="true" />
</svg>
```

- **`<symbol>` adds structure and semantics,** which promotes accessibility.

## Decorative SVG

- **`aria-hidden="true"` removes the element and its children** from the accessibility tree; purely decorative icons and images are its listed use.

```html
<!-- decorative -->
<img src="XXX.svg" alt="" aria-hidden="true" />
<svg aria-hidden="true">…</svg>
```

- **Give a decorative inline SVG no accessible name:** neither the `<svg>` nor any child may carry `title`, `desc`, `aria-*` or anything else that names it.
- **Never put `aria-hidden="true"` on a focusable element** or on an ancestor of one.

## Icons in buttons

```html
<!-- icon in a button with visible text -->
<button>
  <svg aria-hidden="true"><!--...--></svg>
  Visible text
</button>
<!-- icon-only button -->
<button aria-label="Search">
  <svg aria-hidden="true"><!--...--></svg>
</button>
<button>
  <svg aria-hidden="true"><!--...--></svg>
  <span class="visually-hidden">Search</span>
</button>
```

- **The name belongs to the button,** through visible text, `aria-label`, or visually hidden text; the SVG itself is hidden.
- **`focusable="false"` is no longer needed.** A 2019 post used `<button aria-label="Search"><svg focusable="false" aria-hidden="true">...</svg></button>` so Internet Explorer wouldn't let Tab move into the SVG. Orange (current) says it was historically required for Internet Explorer and pre-Chromium Edge and is no longer necessary in current browsers.

## Links inside SVG

- **SVG `<a>` has no default link appearance.** Style hover and focus yourself.
- **Name a shape link** with a `<title>` inside the `<a>`.
- **Show focus with `fill`,** as MDN does, because `outline` may not render on SVG elements.

## Tooling that strips accessibility

- **SVGO v4 (2025-06-21) no longer runs `removeTitle` by default,** to preserve accessibility; `removeDesc` in the default preset removes only an empty `<desc>` or one that seems to hold only editor attribution. Before enabling `removeTitle`, check [OPTIMIZING-AND-SECURITY.md](OPTIMIZING-AND-SECURITY.md#optimizing-with-svgo).

## Prove it

- **Every SVG is classified:** informative ones have a name (`alt`, `<title>`, `aria-labelledby` or `aria-label`); decorative ones have `aria-hidden="true"` (and `alt=""` on `<img>`) and no naming attribute anywhere inside.
- **Inline informative SVG** has `role="img"` on the root and, if `<title>` is used, it is the first child.
- **Screen reader pass:** an informative inline SVG is announced once, as an image with its label, not as a series of child nodes. Test on the screen reader and browser combinations your users most commonly use.
- **Icon buttons** announce their name from the button, and the icon is not announced separately.
- **No focus traps:** Tab never lands inside a decorative SVG, and no focusable element sits inside an `aria-hidden` subtree.
- **SVG links** show a visible focus state (for example a `fill` change) when tabbed to, and are announced with their `<title>`.
- **Optimized files keep their names:** after SVGO, informative SVGs still contain their `<title>` and non-empty `<desc>`.
