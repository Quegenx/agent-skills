# Fonts and text details

CSS for what a font file can do and for the small text details around it: synthesis, axes and OpenType features through their properties, optical sizes, small caps and super and subscripts, tabular against proportional figures, font smoothing, hanging punctuation, underlines, selection, the caret, the iOS input zoom, decorative text, fallback-font metrics, hyphenation limits, and list markers and counters. **This file is not from nerdy.dev**, unlike the rest of this skill. Its sources are third-party agent skills, tagged on each section: [Jakub Krehel, better-typography] (jakubkrehel/skills, `better-typography`), [Craft] (gustavo-fior/craft, the articles at [craft.gustavofior.com](https://craft.gustavofior.com)), [Emil Kowalski, mobile-native], [Vercel, web-interface-guidelines; writing-guidelines] and [css-modern-features] (rushenn/css-modern-features, MIT, `references/typography.md` and `references/components.md`). Support status is from MDN and browser-compat-data, checked 2026-10-18; where a source's claim is wrong or stale, the official form is given with its URL and the source's words are named. Units, `text-wrap`, `text-box` and the `GRAD` axis from nerdy.dev are in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md); gradient text and text stroke are in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md); type scale, measure and tracking as review rules are in [Type review](#type-review); responsive layout and units are in [RESPONSIVE.md](RESPONSIVE.md).

**Contents:** [Properties over raw tags](#properties-over-raw-tags) · [Synthesis](#synthesis) · [Axes, static and variable](#axes-static-and-variable) · [OpenType features](#opentype-features) · [Optical sizes](#optical-sizes) · [Small caps, superscripts and subscripts](#small-caps-superscripts-and-subscripts) · [Tabular and proportional figures](#tabular-and-proportional-figures) · [Font smoothing](#font-smoothing) · [Hanging punctuation](#hanging-punctuation) · [Underlines](#underlines) · [Selection](#selection) · [Placeholder and caret](#placeholder-and-caret) · [The iOS input zoom](#the-ios-input-zoom) · [Decorative text](#decorative-text) · [Fallback font metrics](#fallback-font-metrics) · [Hyphenation limits](#hyphenation-limits) · [List markers and counters](#list-markers-and-counters) · [Type review](#type-review) · [Typography review checks](#typography-review-checks) · [Prove it](#prove-it)

## Properties over raw tags

[Jakub Krehel, better-typography]

- "When a CSS property exists, use it. `font-weight: 650`, not `font-variation-settings: "wght" 650`. `font-variant-numeric: tabular-nums`, not `font-feature-settings: "tnum" 1`. Properties keep working when a non-variable fallback renders."
- "`font-variation-settings` silently does nothing on a non-variable fallback, where `font-weight` still picks the nearest face." Reserve raw tags "for custom axes like `"GRAD" 80` and features with no property, like `"ss01" 1`" (the `GRAD` recipe is in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#variable-fonts-grad-for-dark-mode-and-contrast)). Verbatim:

```css
/* Good: common axes use the properties */
.heading {
  font-weight: 650;
}

/* Good: custom axis with no property of its own */
.heading-grade {
  font-variation-settings: "GRAD" 80;
}

/* Bad: weight via raw tag breaks on fallback fonts */
.heading {
  font-variation-settings: "wght" 650;
}
```

## Synthesis

[Jakub Krehel, better-typography]

- "Browsers synthesize a weight or style the family doesn't ship, distorting the face. Load every face the design uses. Disable synthesis only after verifying the fallback stack, and only the unwanted mode."
- "`font-synthesis: none` disables weight, style, small-cap and position synthesis together. Scope it to an isolated treatment you have verified across the fallback stack":

```css
.brand-wordmark {
  font-synthesis: none;
}
```

- **The longhands, with status.** The source lists four longhands side by side; they don't ship equally. `font-synthesis-weight`, `font-synthesis-style` and `font-synthesis-small-caps` are Baseline widely available (since 2025-09-27). `font-synthesis-position` is experimental, not Baseline, Firefox 118 only ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis-position)).
- The source's review row: "`font-synthesis: none` on body or interface text" becomes "Remove it; set only the unwanted longhand after checking the fallback stack".

## Axes, static and variable

[Jakub Krehel, better-typography]

- "**Static font:** one weight and one style per file." "**Variable font:** a whole range in one file. Any value in it works, such as `font-weight: 589`." "A variable font is not automatically better. At one or two weights, static files can be smaller. At several weights, optical sizes or custom axes, a variable font usually wins."
- "A font supports only the axes its designer included":

| Axis | Tag | Controls |
|---|---|---|
| Weight | `wght` | Stroke thickness (like `font-weight`) |
| Optical size | `opsz` | Details and spacing tuned for the display size |
| Width | `wdth` | Glyph width |
| Slant | `slnt` | Slant angle |
| Custom | e.g. `GRAD` (Roboto Flex) | Whatever the designer built |

- "Inter's variable file exposes only `wght` and `opsz`." (Inter's axes were not checked against Inter's own docs.)

## OpenType features

[Jakub Krehel, better-typography]

- "Unlike axes, features work the same on static and variable fonts. A font ships only the features its designer included."

| Tag | Feature |
|---|---|
| `tnum` | Tabular numbers: every digit the same width |
| `zero` | Slashed zero: `0` distinct from `O` |
| `liga` | Ligatures: joins pairs like "fi" into one shape |
| `ss01`-`ss20` | Stylistic sets (numbered slots) |
| `cv01`-`cv99` | Character variants (numbered slots) |

- "Common features have a `font-variant-*` property, and `font-feature-settings` is for the rest":

```css
/* Good: common features use the properties */
.price {
  font-variant-numeric: tabular-nums;
}

.id {
  font-variant-numeric: slashed-zero;
}

/* Good: niche feature with no property of its own */
.logo {
  font-feature-settings: "ss01" 1;
}
```

- "What each slot does differs font to font, which is why they are numbered, not named. Check the font's docs. In Inter, `ss01` switches to open digits and `cv11` swaps in a single-story `a`." landing-page-ui's reset "sets the face's preferred `"cv11"` on everything and a display role that sets `"ss07"` replaces it", because font features don't merge ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)).

## Optical sizes

- "Leave `font-optical-sizing` at its default `auto`. Hard-code `"opsz"` only when the design deliberately decouples optical size from font size." [Jakub Krehel, better-typography]
- "Browsers turn this on automatically through `font-optical-sizing: auto`, so you usually get the right design for free." "Strokes that are sturdy at 14px look clumsy at 40px." [Craft] ([Optical Alignment](https://craft.gustavofior.com/optical-alignment))
- Status: `font-optical-sizing` is Baseline widely available (since 2022-09-24; Chrome 79, Firefox 62, Safari 13.1) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-optical-sizing)).
- **Separate cuts.** "Optical sizes predate variable fonts. Many families still ship them as separate `Text` and `Display` files instead of an `opsz` axis." "'Display' in a font's name does not make it a display font. SF Pro and Heldane ship a `Display` variant for large sizes and a `Text` variant for small ones. Use the variant matching the size you are setting." [Jakub Krehel, better-typography]

## Small caps, superscripts and subscripts

[Jakub Krehel, better-typography]

- "Enable real ones with `font-variant-caps`" for small capitals, and "proper glyphs with `font-variant-position`" for superscripts and subscripts. "Both require the font to include the glyphs."
- Status: `font-variant-caps` is Baseline widely available. `font-variant-position`: MDN's banner shows widely available with an asterisk, but the web-features feature is not Baseline: Chrome and Safari "do not implement font synthesis for missing superscript or subscript glyphs" (browser-compat-data notes), which is why the glyphs must be in the font ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-position)).

## Tabular and proportional figures

- "**Proportional figures** use the natural width of each shape: `1` is narrow, while `8` is wide. **Tabular figures** give every digit the same width." "Use proportional figures when numbers sit inside a sentence. They read more naturally." Use tabular "for clocks, counters, scores, prices, and live metrics" and numeric columns. [Craft] ([Tabular Numbers](https://craft.gustavofior.com/tabular-numbers), 2026-07-15)
- "The usual instinct here is to switch to a monospace font, but you don't need to. A mono font changes the whole voice of the interface." [Craft] app-ui does the other: "A count or detail at the row end in a muted .75rem monospace stack, so digits line up" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).
- "Right-align numeric columns as well." [Craft] app-ui's tables center cells by default ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).
- **Check the font has `tnum`:** "If `tabular-nums` makes no visible difference, drop the font file into [Wakamai Fondue](https://wakamaifondue.com) and check whether it lists `tnum` among its features." [Craft]
- "Apply `font-variant-numeric: tabular-nums` to timers, counters, prices and numeric table columns ... Leave figures in prose proportional." [Jakub Krehel, better-typography] Animated numbers are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md).

## Font smoothing

[Craft] ([Font Smoothing](https://craft.gustavofior.com/font-smoothing), 2026-10-14)

- "MacOS smooths text in browsers by **thickening the edges of every glyph**, a leftover from the days of subpixel rendering on low resolution screens. On dark backgrounds that extra thickness reads as bloom." `-webkit-font-smoothing: antialiased` "tells the browser to skip the thickening and use plain **grayscale antialiasing**, which renders the glyph at its true weight."
- "Windows renders with ClearType and ignores the property, Linux never had it, and iOS Safari does not do subpixel antialiasing at all." It shows mostly in dark mode: "every heading feels half a weight heavier than the design file." The perceptual side of the same effect (the irradiation illusion and `GRAD`) is in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#variable-fonts-grad-for-dark-mode-and-contrast).
- **Thin weights:** "At 300 the text comes out lighter than you meant, and at 200 the strokes start to fall apart." "If you set body text at 300 or below on dark surfaces, give it a look on a 1x display before turning this on everywhere. If you stick to 400 and up, like most products do, you are fine."
- **The other values:** `none` has "no real use for it in a product"; `subpixel-antialiased` "forces the default back on", the only way to exempt a region from a global `body` rule.
- Code from the article, with its comment fixed: the source writes `/_ ... _/`, which is not a CSS comment and invalidates the `.light-panel` rule after it. Changed: `/_ _/` to `/* */` ([MDN: Comments](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/Comments)), and the indentation restored.

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Opt a region back into the browser default. */
.light-panel {
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
}
```

- "Apply `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` once on the root, never per component. Tailwind's `antialiased` sets both." [Jakub Krehel, better-typography] app-ui sets both in its base typography ([../app-ui/reference/styles/base/typography.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/base/typography.css)).
- **Official status:** MDN `font-smooth` is non-standard, "It only works on macOS", and "We do not recommend using non-standard features in production" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-smooth)). Craft says "Since Firefox 128, Firefox on macOS treats the WebKit property as its own, so the `-moz-osx-font-smoothing` line is only there for older versions." That is not in browser-compat-data, which lists Firefox only as `-moz-osx-font-smoothing`, nor in MDN's [Firefox 128 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/128): keep the `-moz-osx-font-smoothing` line.

## Hanging punctuation

[Craft] ([Optical Alignment](https://craft.gustavofior.com/optical-alignment), 2026-07-15)

- "A quote that starts with a quotation mark looks indented, because the mark is mostly whitespace. Hanging it into the margin lines the first letter up with the text below." "Safari supports `hanging-punctuation: first`. Elsewhere a small negative `text-indent` gets the same result for a known opening character." Verbatim:

```css
blockquote {
  hanging-punctuation: first;
}

@supports not (hanging-punctuation: first) {
  blockquote {
    text-indent: -0.42em;
  }
}
```

- Status: Limited availability, Safari only (Safari 10; not Chrome or Firefox). browser-compat-data notes "The characters `U+0027` and `U+0022` are not supported by the `first` and `last` keywords" until Safari 26.5, so straight `'` and `"` did not hang before it; Craft's example opens with a curly quote ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/hanging-punctuation)).

## Underlines

[Jakub Krehel, better-typography]

- "From the font's own metrics":

```css
a {
  text-underline-position: from-font;
  text-decoration-thickness: from-font;
}
```

- "A dotted underline on an abbreviation": `abbr { text-decoration: underline dotted; }`.
- "Or tune manually":

```css
a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: var(--color-gray-1000);
  transition: text-decoration-color 200ms ease-out;
}

a:hover {
  text-decoration-color: var(--color-gray-1200);
}
```

- The review row: "`text-decoration-skip-ink: none`" becomes "Remove it; set `text-underline-offset` or `from-font` instead".
- Status: the `from-font` values ship in Chrome 87, Firefox 70 and 74, Safari 12.1, all Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-decoration-thickness)). landing-page-ui's content links use the same `from-font` thickness with a color transition over 200ms ([landing-page-ui CONTENT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/CONTENT-PAGES.md)).

## Selection

[Jakub Krehel, better-typography]

- "Keep text selectable by default. `::selection` can carry brand into the reading experience, as long as the selected combination stays legible." "`::target-text` styles the phrase a shared link scrolls to." "The Custom Highlight API styles ranges you pick yourself, like search matches, without extra markup."
- "`user-select: none` belongs on a draggable or gesture-driven surface where accidental selection interferes. Never across the interface and never because a button label can be highlighted." app-ui decides otherwise for its controls: "Labels ... are `user-select: none`" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)). mobile-native puts it on buttons, tabs, chips and drag handles ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#pressed-states)). [Emil Kowalski, mobile-native]
- **Status, and what the source leaves out:**
  - `::target-text` is Baseline newly available since 2024-12-11 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::target-text)).
  - The Custom Highlight API is Baseline newly available since 2026-03-24 (Firefox 149 full, 140 partial) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API)).
  - `::selection` is not Baseline, and browser-compat-data lists no Safari on iOS support, so a brand selection color does not show on iPhone ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::selection)).
  - `user-select` is not Baseline: Safari ships only `-webkit-user-select`, so a plain `user-select: none` does nothing there. Write both; Tailwind v4's `select-none` emits both ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/user-select)).

## Placeholder and caret

[Jakub Krehel, better-typography]

- "`::placeholder` styles the hint in an empty field." "`caret-color` colors the blinking insertion bar. A fully custom caret is hard to build and rarely worth it." `caret-color` is Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/caret-color)).
- landing-page-ui builds the custom caret anyway: "A caret that glides" ([landing-page-ui CONTENT-PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/CONTENT-PAGES.md)).

## The iOS input zoom

[Jakub Krehel, better-typography; Emil Kowalski, mobile-native] The sources say iOS Safari zooms into inputs set under 16px; Apple's and WebKit's docs don't state the threshold, so treat it as observed platform behavior. mobile-native also reports that it does not zoom back out on blur. Never use `user-scalable=no` or `maximum-scale=1`; MDN notes that iOS10+ ignores these by default ([viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)). mobile-native sets `input, textarea, select { font-size: 16px; }` globally or only under `@media (pointer: coarse)`. Two better-typography fixes:

- "**Size up on mobile.** The input renders at `16px` on small screens and drops to the design size from the `sm` breakpoint up": `<input className="text-base sm:text-sm" type="email" />`.
- "**Scale the text down.** Keep `font-size` at `16px` so Safari never zooms, then render at the intended size with a transform. Widen the element by the inverse of the scale so it still fills its container once shrunk. Divide `line-height` by the same factor so the intended leading survives. `origin-left` pins the text to the start edge, `origin-right` under RTL." Verbatim:

```tsx
// 13px rendered from a 16px font-size: 13 / 16 = 0.8125
<div className="flex h-10 items-center overflow-hidden rounded-[10px] bg-gray-300 px-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500">
  <input
    className="h-full w-[calc(100%/0.8125)] shrink-0 origin-left rtl:origin-right scale-[0.8125] bg-transparent text-base leading-[calc(1.125/0.8125)] outline-none sm:w-full sm:scale-100 sm:text-[13px]"
    type="email"
  />
</div>
```

- "The transform shrinks the whole box, not only the glyphs, so let a wrapper draw the field's surface and keep the input transparent. A background, border or ring on the scaled element shrinks with the text and misses the intended hit area."
- app-ui switches on input capability, not width: "Inputs under 16px get 1rem on touch screens (iOS zooms otherwise); never disable zoom" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)), and it draws no focus ring ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#focus)), unlike the example's `focus-within:outline`.

## Decorative text

[Jakub Krehel, better-typography] "Build drop caps, gradient text, outlines and text shadows in CSS so the text stays selectable and searchable."

| Property | Effect (source) | Status |
|---|---|---|
| `::first-letter` | "Drop cap, widely supported" | The `lh` drop cap is in [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#drop-caps) |
| `::first-line` | "Styles only the first line" | |
| `initial-letter` | "Sizes the drop cap; Safari needs `-webkit-initial-letter`, no Firefox yet" | Not Baseline: Chrome 110 unprefixed, Safari prefixed (iOS "Does not support decimal values"), no Firefox ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/initial-letter)) |
| `background-clip: text` | "Clips a background or gradient to the letter shapes" | In [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md#animated-gradient-text) |
| `-webkit-text-stroke` | "Outlines the letters; works across modern browsers despite the prefix" | Baseline widely available since 2019-10-05 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-text-stroke)) |
| `text-shadow` | "Like `box-shadow` but follows the character shapes" | |

- "If `-webkit-text-stroke` draws lines inside the letters, the font has overlapping contours. Variable fonts often keep them unmerged, so use the static cut for stroked text."

## Fallback font metrics

[css-modern-features, typography.md] `font-size-adjust` "Normalizes x-height across font fallbacks so text doesn't jump size while the web font loads." Verbatim:

```css
body {
  font-family: "Inter", system-ui, sans-serif;
  font-size-adjust: from-font; /* auto-reads the primary font's metrics */
}

/* Or manual value */
body {
  font-size-adjust: 0.52; /* x-height ratio */
}
```

- Status: `font-size-adjust` is Baseline newly available since 2024-07-25 (web-features; Chrome 127, Firefox 118, Safari 17); the `from-font` value ships in Chrome 127, Firefox 118 and Safari 17 (browser-compat-data), the floors the source gives.
- The source's checklist adds: "Use **`@font-face` `size-adjust`** to normalize font fallbacks" (SKILL.md; it gives no code). The `size-adjust` descriptor of `@font-face` ships in Chrome 92, Firefox 92 and Safari 17 (browser-compat-data `css.at-rules.font-face.size-adjust`).

## Hyphenation limits

[css-modern-features, typography.md] "Fine-grained control over hyphenation, prevent breaking very short words." Verbatim:

```css
p {
  hyphens: auto;
  hyphenate-limit-chars: 8 4 3; /* min-word min-before min-after */
}
```

Status: Limited availability, Chrome 109 and Firefox 137, Safari only in preview (browser-compat-data `css.properties.hyphenate-limit-chars`). The source said "Chrome 109, Safari 17 (Firefox partial)".

## List markers and counters

[css-modern-features, components.md] "Style list bullets and numbers without replacing them with `::before` hacks." Verbatim:

```css
/* Style all markers */
li::marker {
  color: var(--color-brand);
  font-size: 0.75em;
}

/* Ordered list, style the number */
ol li::marker {
  color: oklch(0.6 0.2 260);
  font-weight: 700;
  content: counters(list-item, ".") ". ";
}

/* Custom content */
ul.checklist li::marker {
  content: "✓ ";
  color: oklch(0.6 0.2 145);
}
```

- Status: `::marker` is not Baseline. browser-compat-data has Chrome 86 and Firefox 68, and Safari only partial (since 11.1); web-features lists no Safari. The source said "Chrome 86, Safari 14.1, Firefox 68" and rated it safe for most targets, so check each marker style in Safari.
- **Counters** for "CSS-only numbered steps, progress indicators, section headings, no JS or manual numbering". Counters are Baseline widely available (since 2018-01-29, web-features `counters`). Verbatim:

```css
/* Step list */
.steps { counter-reset: step; }

.steps li {
  counter-increment: step;
}

.steps li::before {
  content: "Step " counter(step);
  display: block;
  font-weight: 700;
  color: var(--color-brand);
}

/* Nested counters: "1.1", "1.2", "2.1" */
ol {
  counter-reset: section;
  list-style: none;
}

ol li { counter-increment: section; }
ol li::before {
  content: counters(section, ".") " ";
}
```

  Two comments lost their dashes ("Ordered list, style the number", "Nested counters: ...").

## Type review

Jakub Krehel's better-typography, for reviewing how text renders [Jakub Krehel, better-typography]. Where the owner's apps set a value, `app-ui` and `landing-page-ui` decide; the lines below say where they differ.

- **Measured, not preferred:** "Unitless line-height, weight `400` or heavier below `18px`, a 60 to 75 character measure, `16px` inputs on iOS and `tabular-nums` on changing values are findings when missed." "Letter-spacing, pairing and scale ratios are heuristics. Report them only where they break the project's own scale. Never propose a new typeface, paid or free, unless the task asks for a type change."
- **Fonts and weights:** "Rarely use more than three fonts; marketing pages can carry more than apps." "A serif headline over a sans body reads as deliberate, two near-identical sans-serifs read as a mistake." "Weights `100` to `300` belong at `28px` and up, checked against the background even there."
- **Line-height by role:** "Display text `1.1`, headings `1.2` to `1.3`, body copy `1.5` to `1.6`." "Anything that wraps to three or more lines needs at least `1.4`, even in a height-constrained row." app-ui runs tighter: its base, small and extra-small text are ".9375 / 1.3333, .8125 / 1.2308, .75 / 1.5".
- **Tracking by size:** "Headings at `24px` and up take `-0.01em` to `-0.02em`. Uppercase labels at `14px` or smaller take `0.05em`. Body copy stays at `0`. Use `em` so tracking scales with the size." "`font-kerning: none` is never a fix." The owner's apps differ: app-ui sets `letter-spacing: 0` on `h1` to `h4`, and landing-page-ui says "Fixed tracking is in px, from -0.16px to -1.44px" and resets negative tracking in right-to-left ("Negative tracking is for Latin only").
- **Measure:** "`65ch` measures characters directly, one `ch` being the width of the `0`"; "At a `16px` body size the 60 to 75 character range lands roughly between `560px` and `680px`." Vercel's report pages keep "near" 60 to 68 ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#report-and-evidence-page-layout)).
- **Size floors:** "Start long-form body text at `16px`, the browser default." "UI text can go smaller. Start inputs and menus at `14px` and captions at `13px`, and rarely go below `12px`."
- **Headings descend:** "A heading is never smaller than body text unless it is a deliberate overline"; deep levels may share a size "as long as weight or letter-spacing keeps them distinct".
- **Case and alignment:** "Store text in natural case and set case with `text-transform`, so a redesign never means rewriting copy." "Keep interface text at `text-align: start`. `justify` belongs only in specific editorial layouts."
- **Figures:** check the [tabular and proportional figure rule](#tabular-and-proportional-figures), including numeric columns and prose. [Jakub Krehel, better-typography]
- **Wrapping:** better-typography calls `text-wrap: pretty` "Safe on any paragraph, long-form included", and make-interfaces-feel-better says to skip it on text of 10 or more lines. MDN: `pretty` "is intended for body copy" and "has a negative effect on performance, so it should be only used for longer blocks of text when the layout is more important than speed" ([text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap)); it is not Baseline ([TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#text-wrap-balance)).
- **Selection:** check [Selection](#selection) for the better-typography rule, Safari support and the recorded owner/mobile-native alternatives.
- **Punctuation:** the source says rendered strings use the ellipsis character for `...` and a real dash for `--` [Jakub Krehel, better-typography]. Before replacing the aside, ask whether it belongs at all. The owner's rule forbids em and en dashes at every length; use " - ", commas or "to" ([anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md#5-formatting)). The old line cited "none in short copy"; the source's real-dash view remains a disagreement, not permission under the owner rule.
- **Quotes and spaces that hold:** "Curly quotes `“` `”` not straight `"`" and "Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names" [Vercel, web-interface-guidelines]; writing-guidelines extends the curly rule to single quotes, "not straight `"` or `'`" [Vercel, writing-guidelines].
- **The severity** (mapped once in [anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md#6-delivery-report)): "`HIGH` makes text unreadable, truncates content with no way back to it or clips text at 320px width or 200% zoom"; `MEDIUM` "breaks the type system or the visual heading hierarchy"; `LOW` "is isolated polish". "Without a browser, check declared size and weight per heading level, descending within each semantic section. Check declared line-height, units and measure. Check truncation rules against realistic string lengths."

The patterns a script can find are in [Typography review checks](#typography-review-checks).

## Typography review checks

[Jakub Krehel, better-typography] The typography rows from the responsive review, with each source fix retained:

| Pattern | Fix | Source |
| --- | --- | --- |
| `line-height` in `px` or `rem` | A unitless value | better-typography |
| `letter-spacing` in `px` | The same value in `em` (landing-page-ui keeps px tracking by design) | better-typography |
| Weight `100` to `300` or `font-thin`, `font-light` on text under `18px` | `400` or heavier | better-typography |
| `text-wrap: balance` on a paragraph | `text-wrap: pretty` | better-typography |
| `text-align: justify` in application UI | `text-align: start` | better-typography |
| `-webkit-line-clamp` without `display: -webkit-box` | Add `display: -webkit-box` and `-webkit-box-orient: vertical` | better-typography |
| `text-decoration-skip-ink: none` | Remove it; set `text-underline-offset` or `from-font` instead | better-typography |
| `-webkit-font-smoothing` or `antialiased` inside a component | Move it to the root | better-typography |
| `user-select: none` or `select-none` on a layout root or text container | Remove it; keep it only on a drag or gesture surface | better-typography |

## Prove it

- **Raw tags:** a search for `font-variation-settings: "wght"`, `"opsz"` and `font-feature-settings: "tnum"` finds none; each is the property instead. With the variable font blocked, the fallback still renders the intended weight.
- **Synthesis:** `font-synthesis: none` appears only on scoped treatments, and no rule depends on `font-synthesis-position` outside Firefox.
- **Figures:** a running timer and a numeric column hold their width as digits change; numbers in sentences stay proportional; if `tabular-nums` changes nothing, the font was checked for `tnum`.
- **Smoothing:** on a Mac, dark-mode headings match the design weight, any 300-or-lighter body text was viewed on a 1x display, the opt-out rule uses a real `/* */` comment, and both smoothing lines are kept.
- **Hanging punctuation:** in Safari the opening quote hangs; in Chrome and Firefox the `text-indent` fallback lines the first letter up with the next line.
- **Selection:** text stays selectable outside drag surfaces; every `user-select: none` has its `-webkit-` twin; a brand `::selection` color is not relied on for iPhone users.
- **iOS input:** on an iPhone, focusing every input causes no zoom, and the scaled input fills its wrapper with the focus outline on the wrapper.
- **Stroked text:** no lines show inside the letters.
- **Fallback fonts:** with the web font blocked, the fallback's x-height matches closely enough that the text doesn't jump in size when the font arrives.
- **Hyphenation:** in Chrome or Firefox, no word shorter than eight letters breaks, and every break leaves at least four letters before and three after; Safari hyphenates without the limits.
- **Markers:** list markers keep their color, size and custom content in Chrome and Firefox, and still read correctly in Safari; nested counters print "1.1", "1.2", "2.1".
- **No dashes:** a search of FONTS-AND-TEXT-DETAILS.md for em and en dash characters finds none.
