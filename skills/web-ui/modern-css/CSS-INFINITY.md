# CSS infinity

Infinity recipes from Adam Argyle's [CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases) (2026-07-25), with numeric ranges, radius percentages and NaN behavior checked against the official pages linked below. Source code is retained verbatim. Other custom properties are in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md), and math functions are in [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md); scroll triggers and frozen view transitions are in [SCROLL-ANIMATIONS.md](SCROLL-ANIMATIONS.md#scroll-triggered-animation) and [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md#debugging).

## calc(infinity)

[nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases) (2026-07-25). The `<calc-keyword>` values (`infinity`, `-infinity`, `NaN`, `pi`, `e`) are Baseline widely available since December 2022; "an infinite value is clamped to the allowed range" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword)).

- **Basics:** "`infinity` and `-infinity` need to always be wrapped in `calc()`"; a dimension also needs a unit multiplier. It works in `clamp()`, `min()` and `max()` too.
  ```css
  div {
    border-radius: calc(infinity * 1px);
    z-index: calc(infinity);
  }
  ```
  For pills it replaces the old `1e9px`. app-ui's `--radius-full` is `calc(infinity * 1rem)`, "a pill at any height" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).
- **The post's observed maximum:** its counter demonstration reports `2147483647`, and it also applies infinity to `z-index`. CSS does not prescribe that number for every engine or property: supported numeric ranges and precision are implementation dependent, and infinite results are clamped for their context. The post and our old line called it "the browser's max int". [CSS Values: Numeric types](https://drafts.csswg.org/css-values-4/#numeric-types), [infinities](https://drafts.csswg.org/css-values-4/#calc-infinities)
  ```css
  .css-max-int {
    counter-reset: cssInt calc(infinity);

    &::after {
      content: counter(cssInt);
    }
  }
  ```
  Two views on using it for stacking: the post offers it to "beat `z-index: 999999999`"; anti-slop-ui says "Escalating to `z-index: 9999` only moves the fight" and sends floating layers to the top layer ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md), [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md)).
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
- **A radius that switches on:** keep the post's formula below, but interpret its sign correctly: a positive difference multiplied by infinity selects the upper clamp, and a negative difference selects the lower clamp. The post and our old line said an element smaller than `100vi` got `0` and a larger one got `20px`, reversing that subtraction. Also, `border-radius` percentages use border-box width for horizontal radii and height for vertical radii, so `100%` is not one universal inline-size comparison. [MDN calc keywords](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword), [border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius)
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
- **Equality needs the NaN rule:** zero multiplied by infinity is `NaN`; nested calculations propagate it, and a top-level calculation result censors it to zero. This also applies at the equality boundary of the radius and boolean recipes above; do not describe zero times infinity as ordinary zero arithmetic. [CSS Values: Infinities](https://drafts.csswg.org/css-values-4/#calc-infinities)
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
  Freezing view transitions for inspection is in [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md); the never-reverse scroll trigger is in [SCROLL-ANIMATIONS.md](SCROLL-ANIMATIONS.md#scroll-triggered-animation).
- **Doesn't work:** a backdrop from an infinite spread, `.backdrop { box-shadow: 0 0 0 calc(infinity * 1px) #0005; }`, carries the post's own warning, "This actually doesn't work!" ([Bramus explains why](https://front-end.social/@bramus/117043307620167329)).

## Prove it

- Infinity lengths carry a unit multiplier; no `z-index: calc(infinity)` stands in for the top layer. [MDN calc keywords](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword), [Popover and dialog](POPOVER-AND-DIALOG.md#use-them-and-the-top-layer)
- Check the radius formula with a positive, negative and zero difference for each radius axis; apply the NaN boundary rule above rather than assuming ordinary zero multiplication. [CSS Values: Infinities](https://drafts.csswg.org/css-values-4/#calc-infinities), [MDN border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius)
- Treat the source's observed numeric ceilings as implementation observations, not CSS-wide constants. [CSS Values: Numeric types](https://drafts.csswg.org/css-values-4/#numeric-types)
