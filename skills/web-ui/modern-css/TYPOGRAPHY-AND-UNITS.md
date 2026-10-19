# Typography and units

Line-based and font-based units (`lh`, `rlh`, `cap`, `rcap`, `rch`, `rex`, `ric`), drop caps, rhythm that follows the writing mode, `text-wrap: balance` and its limits, `text-box` trimming, the variable-font `GRAD` axis for dark mode and contrast, `text-grow`, `text-emphasis-style`. Source: Adam Argyle's nerdy.dev posts and notes, with current support from MDN and web-features (checked 2026-10-17). Code is copied from the posts; where a post's code is wrong today, the corrected form is given with the MDN link and the change is named. Spacing by line and text measure for whole layouts are in [RESPONSIVE.md](RESPONSIVE.md); the source's custom naming convention is in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#emoji-in-custom-names); SVG text is in [svg SHAPES-AND-TEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/SHAPES-AND-TEXT.md).

## Line-height units: lh and rlh

- **`lh` is the element's computed `line-height` as a length** (MDN: "computed value of the line-height property ... converted to an absolute length", [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)). Support: Baseline widely available since 2026-05-21 (Chrome 109, Firefox 120, Safari 16.4; [web-features](https://web-platform-dx.github.io/web-features-explorer/features/lh/)). [nerdy.dev: Another rad use for the line-height unit](https://nerdy.dev/another-rad-use-for-the-line-height-unit)
- **Tag padding as a visual recipe.** The source's `calc(.5lh / 2)` is one quarter of computed line-height. CSS leading is line-height minus the sum of font ascent and descent, divided equally above and below; glyph ink can differ from those metrics. This recipe does not guarantee equal visible padding on all four sides. The [nerdy.dev post](https://nerdy.dev/another-rad-use-for-the-line-height-unit) and our old line called it half-leading and claimed even spacing. [CSS 2.2: Leading and half-leading](https://www.w3.org/TR/CSS22/visudet.html#leading), [MDN length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length). The post's shorter, uncommented form:

```css
.tag {
  line-height: 1.5;
  padding-inline: calc(.5lh / 2);
}
```

- **Vertical rhythm with `rlh`** (the root element's line height); "Bonus: scales with the user's font size pref". Demo code not exported (CodePen RweXyRq). Support: `rlh` Baseline widely available since 2026-05-21 (web-features). [nerdy.dev: Vertical Rhythm With Rlh](https://nerdy.dev/vertical-rhythm-with-rlh)
- **Rhythm that follows the writing mode.** Flex and grid logical layouts plus logical properties make baseline grids work in ltr, rtl and vertical rtl: "CSS let's us authors be lazy and care less. Offering baked in, contextual, and adaptive directionalities via `inline` and `block`." Demo only (CodePen RweXyRq, YouTube Short). Logical properties themselves are in [LAYOUT.md](LAYOUT.md#logical-properties). [nerdy.dev: Can you feel the rhythm‽](https://nerdy.dev/css-logical-rhythm)

## Drop caps

- **Size the first letter in lines with `lh`, and keep an older unit first as a fallback.** "I get to set the font-size to the exact amount of text lines I want the drop cap to span ... since I placed it after a more stable unit, it'll only use this newer unit if the browser understands. Thanks Cascade." [nerdy.dev: New CSS Relative Units](https://nerdy.dev/new-relative-units-ric-rex-rlh-and-rch) (2023-01-06)
- **Corrected code.** The post writes `float: start;`, which is not a `float` value. MDN lists `none | left | right | inline-start | inline-end` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/float)); `inline-start` ships in Chrome 118, Firefox 55 and Safari 15 (BCD). Changed: `start` to `inline-start`.

```css
::first-letter {
  font-size: 7ex;
  font-size: 2lh;
  float: inline-start;
}
```

- **The three-line version, corrected twice.** The 2022 note writes `::first-of-type::first-letter` and `float: start`. `:first-of-type` is a pseudo-class and has to sit on an element, and `start` is invalid as above (MDN float page). Changed: `::first-of-type` to `p:first-of-type`, `start` to `inline-start`. [nerdy.dev: Lh Unit Is Rad For Dropcaps](https://nerdy.dev/lh-unit-is-rad-for-dropcaps) (2022-12-14; it linked `lh` as experimental, now Baseline widely as above)

```css
p:first-of-type::first-letter {
  line-height: 1;
  font-size: 3lh;
  float: inline-start;
}
```

## cap and the root-relative font units

- **`cap` sizes by capital-letter height:** `h1 { font-size: 5cap; }`; the post links [Capsize](https://seek-oss.github.io/capsize/) for readers "already using" a `cap` unit. The post (2023-01) said "Chrome doesn't support `cap` yet"; that is stale: `cap` is Baseline widely available (newly 2023-12-11, widely 2026-06-11, web-features). [nerdy.dev: New CSS Relative Units](https://nerdy.dev/new-relative-units-ric-rex-rlh-and-rch)

```css
h1 {
  font-size: 5cap;
}
```

- **Root-relative versions: `rcap`, `rch`, `rex`, `ric`, `rlh`.** They are the font-relative units measured on the root element ("Even more typographic precision"). In 2023 Adam only "asked about `rcap`"; it now exists. Support: `rcap`, `rch`, `rex` and `ric` are Baseline newly available since 2026-01-13 (Chrome 118 for `rcap`, 111 for the others; Firefox 147; Safari 17.2; [MDN `<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)). [nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers) (2026-04-26), [nerdy.dev: New CSS Relative Units](https://nerdy.dev/new-relative-units-ric-rex-rlh-and-rch)
- **`ic` is the advance of the "水" glyph** (the CJK water ideograph): size CJK measure and gaps in `ic` the way Latin measure uses `ch`. Baseline widely available (newly 2022-10-03, widely 2025-04-03; [MDN `<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)). No nerdy.dev source covers it; it is the owner's rule in anti-slop-ui ([RESPONSIVE.md](RESPONSIVE.md#units)).
- **"54 CSS length units"** was the count in January 2023 ("And I don't think we're done yet!"); the count was not re-checked. A quiz demo is on CodePen (oNxbNzy, not exported). [nerdy.dev: New CSS Relative Units](https://nerdy.dev/new-relative-units-ric-rex-rlh-and-rch)
- **Query by reading length in `ch`:** a container query pattern switches from an inline flex layout to a centered block layout "based on available reading length for the text", and Adam likes `ch` for it "since I'm wanting to switch based on available reading length for the text". The note has no code. Container queries are in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md). [nerdy.dev: A CSS Container Query Pattern](https://nerdy.dev/a-css-container-query-pattern)
- **A Blink layout-unit observation:** the note reports `33554432px` and links Chromium's `layout_unit.h` and Bramus on Mastodon. Our old line presented it as the maximum CSS length generally; supported numeric ranges and precision are implementation dependent, so do not apply it to every engine or property. [nerdy.dev: Max Value Of A CSS Length Layout Unit](https://nerdy.dev/max-value-of-a-css-length-layout-unit) (2026-08-05), [CSS Values: Numeric types](https://drafts.csswg.org/css-values-4/#numeric-types)

## text-wrap: balance

- **Balanced headings in one line.** The note's version targets `h1, h2, h3`. Support: `text-wrap` is Baseline widely available (newly 2024-03-05, widely 2026-09-05; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap)). The 2023 note said "only Chrome Canary atm"; that is stale. [nerdy.dev: Things CSS Could Still Use In 2023](https://nerdy.dev/things-css-could-still-use-in-2023), [nerdy.dev: CSS Text Wrap Balance](https://nerdy.dev/css-text-wrap-balance) (2023-04-03)

```css
h1, h2, h3 {
  text-wrap: balance;
}
```

- **Balance has a line limit.** MDN: `balance` "is only supported for blocks of text spanning a limited number of lines (six or less for Chromium and ten or less for Firefox)" (same MDN page). Longer text wraps normally.
- **Pitfall: the box does not shrink to the balanced lines.** "After text wraps, text balances, flex wraps, etc... there aren't any great ways to have the inline space of the container shrink to fit to the longest wrapped row." A balanced heading in a bordered or filled box keeps extra space at the inline end. Open since 2016 (csswg-drafts #191; [Kizu's write-up](https://kizu.dev/shrinkwrap-problem/)). [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17)
- The nerdy.dev sources give no rule for `text-wrap: pretty`; anti-slop-ui puts `pretty` on paragraphs, list items and captions ([RESPONSIVE.md](RESPONSIVE.md)). `pretty` is not Baseline: Chrome 117 and Safari 26, not Firefox (browser-compat-data `css.properties.text-wrap.pretty`); where it is unsupported text wraps normally. The Baseline banner above covers the property, not this value. The Text Wrap episode of The CSS Podcast (ep 84) covers the shorthand. [nerdy.dev: The CSS Podcast On Text Wrap](https://nerdy.dev/the-css-podcast-on-text-wrap)

## text-box: trim the font's inner spacing

- **The one-liner.** `text-box` "lets you slice half-leading right off a text box": web fonts "include whitespace above and below glyphs" for safe spacing, and this "trims spacing above cap height and below alphabetic baselines". Support: Baseline newly available since 2026-08-18 (Chrome 133, Firefox 154, Safari 18.2; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box)). `text-box` is the shorthand for [`text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim) and [`text-box-edge`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-edge). Firefox caveat: web-features still marks `text-box` not Baseline, because browser-compat-data says Firefox parses the `cap` and `alphabetic` edge values without rendering the trim ("only parsing and serialization"), so `@supports` passes there while nothing is trimmed. [nerdy.dev: 4 CSS Features Every Front-End Developer Should Know In 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026)

```css
h1 {
  text-box: trim-both cap alphabetic;
}
```

- **On body text and buttons too.** Adam's prediction applies it to `h1, p, button`: "This line of code is about to be in every single stylesheet. Centering in CSS is about to get even finer grained." In 2026 he still thinks "it'll become the default". His Nice Select trims legends with it for vertical alignment. An interactive notebook is at [nerdy.dev/notebook/text-box.html](https://nerdy.dev/notebook/text-box.html). [nerdy.dev: Text Box Ftw](https://nerdy.dev/text-box-ftw) (2024-08-28), [nerdy.dev: Nice Select](https://nerdy.dev/nice-select)

```css
h1, p, button {
  text-box: trim-both cap alphabetic;
}
```

- app-ui trims only h1 and h2, inside `@supports` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)), and anti-slop-ui puts it "on large headings" ([RESPONSIVE.md](RESPONSIVE.md)).

## Variable fonts: GRAD for dark mode and contrast

- **The irradiation illusion.** White text on black looks thicker than black text on white at the same weight. In dark mode a negative value on the variable font's `GRAD` (grade) axis keeps the perceived weight from changing when the theme flips. "It's subtle: Don't expect this to jump out at you, but you'll struggle to unsee once you see." [nerdy.dev: Using CSS to fix the irradiation illusion](https://nerdy.dev/adjust-perceived-typepace-weight-for-dark-mode-without-layout-shift) (2025-11-29)
- **`GRAD` changes perceived weight without changing glyph size; `font-weight` changes glyph size,** which causes layout shift. So a bold-on-hover link raises `GRAD` instead of `font-weight`. Demo code not exported (CodePen qEZdOPE). Same post.
- **Tie it to contrast preferences as well.** Verbatim:

```css
body {
  --GRAD: 0;
  font-variation-settings: "GRAD" var(--GRAD);
}

@media (prefers-contrast: more) { body { --GRAD: 700 } }
@media (prefers-contrast: less) { body { --GRAD: -50 } }

@media (prefers-color-scheme: dark)                              { body { --GRAD: -50 } }
@media (prefers-color-scheme: dark) and (prefers-contrast: more) { body { --GRAD: 150 } }
@media (prefers-color-scheme: dark) and (prefers-contrast: less) { body { --GRAD: -150 } }
```

- **It only works if the font has a `GRAD` axis:** "Time to check if your favorite font has a `GRAD` axis." The post calls this "a foot in the door" and suggests learning the relationship between grade and weight before tuning values. Support: `font-variation-settings` is Baseline widely available since 2021-03-05 (newly 2018-09-05; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variation-settings)); `prefers-contrast` is Baseline widely available since 2024-11-30 (newly 2022-05-31), values `no-preference`, `more`, `less`, `custom` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-contrast)). Same post.
- The dark-mode query here is `prefers-color-scheme`; in app-ui "A head script applies the saved theme before first paint" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#theme-switching)).

## text-grow: fit-width text (prototype)

- **"Fit width text in 1 line of CSS"**, with a prototype in Chrome Canary 145+ at the time (2025-12). On 2026-10-17 MDN has no page for `text-grow` (the URL returns 404). The note links the [explainer](https://github.com/explainers-by-googlers/css-fit-text/blob/main/README.md), [CSSWG issue 2528](https://github.com/w3c/csswg-drafts/issues/2528) and [prior art](https://kizu.dev/fit-to-width/). [nerdy.dev: CSS Text Grow](https://nerdy.dev/css-text-grow) (2025-12-05)

```css
h1 {
  text-grow: per-line scale;
}
```

## text-emphasis-style with a glyph

- **A string as the emphasis mark**, "a rad #CSS one-liner for your hot topics". Support: `text-emphasis-style` is Baseline widely available since 2024-09-03 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-emphasis-style)). [nerdy.dev: Text Emphasis Style](https://nerdy.dev/text-emphasis-style)

```css
@layer demo {
  h1 {
    text-emphasis-style: "🔥";
  }
}
```

## Prove it

- **No invalid drop-cap code:** search for `float: start` and `::first-of-type`; both must be gone (`float: inline-start`, `p:first-of-type`). In DevTools the `float` declaration is not struck through.
- **`lh` drop cap:** the first letter spans exactly the intended number of lines at two different `line-height` values, and a browser without `lh` falls back to the `ex` size (the `ex` line comes first).
- **Tag recipe:** confirm the inline padding computes to one quarter of line-height; inspect its appearance with the chosen font without assuming equal glyph-to-edge spacing. [Line-height units](#line-height-units-lh-and-rlh)
- **`rlh` rhythm:** raise the browser's default font size; the rhythm spacing grows with it.
- **Balance:** a heading of more than six lines in Chromium wraps normally (not balanced); a balanced heading inside a bordered box shows the leftover inline space, so don't rely on the box hugging the text.
- **`text-box`:** with and without the declaration, the space above the capitals and below the baseline changes; in a browser without it the element keeps its normal box.
- **GRAD:** the font in use lists a `GRAD` axis (check the font's axes in DevTools or the font's page); flipping the theme or hovering a link changes no element's width or height (no layout shift).
- **`text-grow`:** check MDN or the explainer for current status before using it outside a prototype.
- **No dashes:** a search of TYPOGRAPHY-AND-UNITS.md for em and en dash characters finds none.
