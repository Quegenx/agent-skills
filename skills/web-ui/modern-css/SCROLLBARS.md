# Scrollbars

Coloring and sizing scrollbars with `scrollbar-color` and `scrollbar-width`, the `::-webkit-scrollbar` fallback, and hover and focus hints, from Adam Argyle's [nerdy.dev](https://nerdy.dev). Each fact is tagged with its post and date; each feature's status is from MDN, checked October 2026. Code is copied from the posts. Split out of [SCROLL.md](SCROLL.md), which holds scroller structure, snapping and scroll-driven effects.

## Scrollbar styling

- **Colorize with a fallback, and hint on hover and focus** ([nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13): integrate the colors into the light, dark and forced-colors themes, and add "hover and focus 'hints and feedback'". "**Transparent borders are your friend!**" The post styles the `::-webkit-*` scrollbar pseudos and provides "a meaningful fallback with `scrollbar-color`", here inside `@supports (-moz-appearance:none)`:

```css
.scroll--viewport {
  &:is(:focus-visible, :focus-within) {
    outline-offset: -2px;
    outline: none;
  }

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #0000;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb,
      light-dark(
        var(--surface-4),
        var(--surface-2)
      ),
      #0000 50%
    );
    border-radius: 1e3px;
    border: 3px solid var(--surface-1);
  }

  &:is(:focus-visible, :focus-within)::-webkit-scrollbar-thumb {
    background: var(--link);
  }

  @media (hover) {
    &::-webkit-scrollbar-thumb:hover {
      background: light-dark(var(--surface-4), var(--surface-2));
    }

    &::-webkit-scrollbar {
      opacity: .5;
    }

    &::-webkit-scrollbar:hover {
      opacity: 1;
    }
  }

  @supports (-moz-appearance:none) {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-4) #0000;
    transition: scrollbar-color .3s ease;

    &:is(:focus-visible, :focus-within) {
      scrollbar-color: var(--link) #0000;
    }

    @media (hover) {
      scrollbar-color:
        color-mix(in srgb, var(--surface-4), #0000 50%)
        #0000;

      &:hover {
        scrollbar-color: var(--surface-4) #0000;
      }
    }
  }
}
```

  Status: `scrollbar-color` is Baseline 2025, newly available since December 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-color)); `scrollbar-width` (`auto | thin | none`) Baseline 2024, newly available since December 2024 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-width)). MDN: browsers "ignore the non-standard ::-webkit-scrollbar family of pseudo-elements on any element whose computed scrollbar-color value is anything other than auto", so a `scrollbar-color` outside the `@supports` branch would turn off the `::-webkit-scrollbar` rules above. `light-dark()` and `color-mix()` are in [COLOR.md](COLOR.md).
- **Thin, with a fade on hover-out:** Nice Select's list uses `scrollbar-width: thin` and `scrollbar-color` "with fade on hover-out" ([nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03; code not in the post).
- **There is no `scrollbar-size`:** the "scrollbar-color and scrollbar-size" slip in One List To Rule Them All is covered in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md); the property is `scrollbar-width`.
- app-ui sets thin scrollbars once in its base layer, a thumb at ink 18% on no track ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#cursors-scrollbars-hit-areas)).

## Prove it

- **Scrollbars:** in Chrome and Safari the WebKit thumb shows its inset border and turns the link color on keyboard focus; in Firefox the thin `scrollbar-color` thumb does the same; in forced colors the thumb stays visible.
- **No dashes:** a search of SCROLLBARS.md for em and en dash characters finds none.
