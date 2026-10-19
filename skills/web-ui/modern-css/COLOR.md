# Color

Modern CSS colour: why LCH and OKLCH beat HSL for manipulation, OKLCH palettes from one hue, `color-mix()` and the space it mixes in, relative colour syntax with OKLCH's real channel ranges, `alpha()`, `contrast-color()`, `light-dark()` with page and component light/dark strategies, system and accent colours, P3 with an sRGB fallback, APCA contrast and forced colours. Source: Adam Argyle's nerdy.dev posts, each tagged; current support comes from MDN (checked 2026-10-17) and is stated once where a feature is introduced. Code is copied from the posts unless a fix is named next to it. Gradient interpolation spaces and hue routes are in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md); colour tokens as custom properties are in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md); building and auditing a whole colour system (ramps, roles, token names, WCAG and APCA levels, gamut clamping) is in [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md).

**Contents:** [Lightness: LCH and OKLCH over HSL](#lightness-lch-and-oklch-over-hsl) · [OKLCH palettes from one hue](#oklch-palettes-from-one-hue) · [color-mix() and its space](#color-mix-and-its-space) · [Relative colour syntax](#relative-colour-syntax) · [alpha()](#alpha) · [contrast-color()](#contrast-color) · [light-dark() and color-scheme](#light-dark-and-color-scheme) · [Page and component light and dark](#page-and-component-light-and-dark) · [System and accent colours](#system-and-accent-colours) · [Wide gamut: P3 with an sRGB fallback](#wide-gamut-p3-with-an-srgb-fallback) · [Contrast scores: APCA and L*](#contrast-scores-apca-and-l) · [Forced colours](#forced-colours) · [Prove it](#prove-it)

## Lightness: LCH and OKLCH over HSL

`lch()` and `oklch()` are Baseline widely available, across browsers since May 2023 ([MDN oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch)). The posts' "Try in Canary or Safari TP with color web experiments on" (2022) and "You'll need a browser with oklch() support" (2023) are out of date.

- **HSL lightness is not perceived lightness** [nerdy.dev: LCH Luminance vs HSL Lightness](https://nerdy.dev/lch-luminance-vs-hsl-lightness) (2022-12-02): "50% lightness in HSL is almost never 50% as humans see it; it's just 50% lightness in that color space. 50% lightness in LCH is built around human lightness perception." HSL 50% yellow "is perceptually 97% lightness", "and it will totally bite you when you go to measure color contrast". LCH at 50% may look muted, but "it's a middle of the road color". The rule: "LCH type color spaces should be your colorspace for manipulation."
- **Two views on deriving variants:** ui-animation quotes a chart source that converts any colour to HSL and derives every variant from it ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)); this post says derive in LCH-type spaces.
- **OKLCH hues are not HSL hues** [nerdy.dev: Open Props okLCH beta](https://nerdy.dev/open-props-oklch-palettes-beta) (2023-03-31): "`oklch` has a slightly different hue angle setup than the others, so you can't just straight transfer from `hsl` or `hwb`". Open Props ships named hues for that reason (`--hue-pink`, `--hue-indigo`).
- **OKLCH pitfalls** (same post): "Yellow does not generate well"; it's "def funky under `10%` lightness"; "if chroma is high and lightness is `100%`, it might not be white like you'd think."
- **Chroma takes a percentage** [nerdy.dev: Percentage Chroma](https://nerdy.dev/percentage-chroma) (2023-11-27):
  ```css
  .percentage-chroma {
    color: lch(50% 50% 200);
    color: oklch(50% 50% 200);
  }
  ```
  In `oklch()`, chroma "0% is 0 and 100% is the number 0.4" (MDN). In `lch()`, 100% chroma is 150 ([MDN lch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lch)).

## OKLCH palettes from one hue

[nerdy.dev: Open Props okLCH beta](https://nerdy.dev/open-props-oklch-palettes-beta) (2023-03-31), a beta at the time.

- **One hue in, a palette out:** set a hue "with a nice named prop or any angle", get `--color-0` (lightest) to `--color-15` (darkest) plus `--color-bright`, "the high vibrancy palette puncher color". "There's no huge download to just prototype."
  ```css
  @import "https://unpkg.com/open-props/colors-oklch.min.css";
  ```
  ```css
  * {
    --color-hue: 2rad;
  }
  ```
  ```css
  .dark-card {
    background: var(--color-15);
    color: var(--color-1);
    border-color: var(--color-14);
    border-top-color: var(--color-bright);
    box-shadow: var(--shadow-3);
  }
  ```
- **Tinted grays from two props:** the Open Props normalize has "4 surface colors and 2 text colors that are based on the current gray palette", so changing the gray's hue and chroma retints a whole design. The post writes hues unitless (`270`) and with `deg`.
  ```css
  @import "https://unpkg.com/open-props/gray-oklch.min.css";
  ```
  ```css
  .gray-cool { 
    --gray-hue: 270; 
    --gray-chroma: .02;
  }
  ```
  ```css
  .gray-warm { 
    --gray-hue: 50; 
    --gray-chroma: .01;
  }
  ```
- **A stepped OKLCH palette with a bit of hue rotate** is the subject of [nerdy.dev: Oklch Stepped Palette With A Bit Of A Hue Rotate](https://nerdy.dev/oklch-stepped-palette-with-a-bit-of-a-hue-rotate) (2023-09-20); the code is only on CodePen. His framing of the choice: "Math color palettes = letter spacing / Optical color palettes = kerning" [nerdy.dev: Color Palettes And Typography](https://nerdy.dev/color-palettes-and-typography) (2023-02-08).
- app-ui's checker flags raw `oklch()` "outside a token definition line in a token source file" ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).

## color-mix() and its space

`color-mix()` is Baseline widely available, across browsers since May 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix)). The post's "we'll very likely see it cross browser by summer" (2023-03) came true.

- **Fade an opaque colour by mixing with `transparent`** [nerdy.dev: Use color-mix() to give opacity to opaque colors](https://nerdy.dev/use-color-mix-to-make-an-opaque-color-transparent) (2023-03-09), for "hover effects, edge highlights, shadows, etc.": "we mixed a `75%` transparent hueless color with a fully opaque `red`, the result is a `red` at `25%` opacity."
  ```css
  .make-transparent {
    background: color-mix(
      in oklab, 
      red, 
      transparent 75%
    );
  }
  ```
  ```css
  .make-more-transparent {
    background: color-mix(
      in srgb, 
      rgb(255 0 0 / 10%), 
      transparent 50%)
    ;
  }
  ```
  "Result is `rgb(255 0 0 / 5%)`."
- **The space matters, in his words:** "I chose `oklab` very specifically here, it gave me the mix I expected. Other color spaces did not." His own second example mixes `in srgb` and gets the exact expected result. app-ui's reference code fades brand colours `in srgb` (`color-mix(in srgb, var(--primary) 25%, transparent)` in [date-range-picker.module.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/forms/date-range/date-range-picker.module.css)).
- **The space is optional now:** it defaults to `oklab`, so `color-mix(red, blue)` equals `color-mix(in oklab, red, blue)` (MDN). The post always names it.
- **Scheme-aware mixes:** a `color-mix(in srgb, Canvas, CanvasText 15%)` stop reads in both themes [nerdy.dev: LLM chat prototype](https://nerdy.dev/llm-chat-prototype) (2025-07-28), and a scrollbar thumb mixes `light-dark()` with `#0000 50%` ([SCROLLBARS.md](SCROLLBARS.md)).

## Relative colour syntax

Relative colour is Baseline newly available since 2024-09-16 (web-features); MDN's compat data has `rgb()` and `oklch()` relative syntax from Chrome 122, Firefox 128, Safari 18 and `hsl()` from Chrome 125 ([MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Using_relative_colors)). Safari 16.4 to 17.6 shipped an older draft (MDN compat data), so hue math there needs `deg` ([MDN Relative colors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors)).

- **Set or scale alpha, "the better way"** [nerdy.dev: Use color-mix() to give opacity to opaque colors](https://nerdy.dev/use-color-mix-to-make-an-opaque-color-transparent) (2023-03-09; then a draft, "Can't wait for it"):
  ```css
  .make-transparent {
    background: rgb(from red r g b / 25%);
  }
  ```
  ```css
  .squash-transparency {
    background: rgb(from rgb(255 0 0 / 10%) r g b / 5%);
  }
  ```
- **Relative RGB alpha is named `alpha`.** Channel math uses `alpha` for the origin's opacity. The post and our removed halving example used `a` in `calc(a / 2)`, which is not that channel name. [MDN rgb()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/rgb)
- **Lighten, desaturate, fade, grayscale** [nerdy.dev: How To Use CSS Relative Colors Syntax On The Latest GUI Challenge](https://nerdy.dev/how-to-use-css-relative-colors-syntax-on-the-latest-gui-challenge) (2023-10-05). The post's first line, `oklch(from hotpink calc(l - 20) c h)`, is wrong for today's syntax: in `oklch()` lightness 0% is 0 and 100% is 1 ([MDN oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch)), so `l - 20` lands far below 0 (MDN's compat data notes Chrome 119 to 121 wrongly resolved `l` to 0 to 100, the scale `l - 20` assumes). Darken by 20% of the range with `0.2`:
  ```css
  oklch(from hotpink calc(l - 0.2) c h)
  hsl(from hotpink h calc(s / 2) l)
  hsl(from hotpink h s l / 50%)
  hsl(from hotpink h none l)
  ```
  The same reason makes `calc(l + 20%)` "an invalid color": channels resolve to numbers (MDN guide).
- **Feature-test it:** the post uses `@supports (background: hsl(from red h s l))`; MDN's shape is `@supports (color: hsl(from white h s l))`, the simplest declaration that uses the syntax, with a keyword because custom properties can't be used inside the test ([MDN Relative colors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors)).

## alpha()

[nerdy.dev: Relative Alpha](https://nerdy.dev/relative-alpha) (2026-05-27; then "Would use", linking the css-color-5 draft). `alpha()` is Baseline newly available since 2026-09-14, syntax `alpha(from <color> / <alpha-value>)`, where the keyword `alpha` is the origin colour's alpha ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/alpha)).

```css
button {
  border-color: alpha(from hotpink / calc(alpha * .25));
}
```

## contrast-color()

`contrast-color(<color>)` takes one colour and returns `white` or `black`, whichever contrasts more (`white` on a tie). Browsers may use different algorithms, and mid-tone backgrounds often contrast poorly with both. Baseline newly available since April 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color)).

[nerdy.dev: A color-contrast() strategy for complimentary translucent backgrounds](https://nerdy.dev/color-from-color-contrast-result) (2023-02-07) maximises text contrast on any background: pick the text colour that contrasts with the background, pick the colour that contrasts with that text, and use it at 40% behind the text. "If the text color is white, it's supportive background should be translucent black." The background lives in a custom property "so we can share it with other functions"; the generic `hsl(0 0% 0% / 40%)` is the fallback without relative colour. The post used the draft `color-contrast(var(--bg) vs black, white)`, which no longer exists; MDN documents only the one-argument `contrast-color()`. Rewritten for it:

```css
@layer demo {
  section {
    --bg: hsl(var(--hue) 50% 50%);
  }
  
  h1 {
    --text: contrast-color(var(--bg));
    color: var(--text);
    background: hsl(0 0% 0% / 40%);
  }
  
  @supports (background: hsl(from red h s l)) {
    h1 {
      background: oklch(from contrast-color(var(--text)) l c h / 40%);
    }
  }
}
```

## light-dark() and color-scheme

`light-dark()` is Baseline 2024, newly available since May 2024. `color-scheme: light dark` enables selection by the user's preference; an explicit `color-scheme: light` or `dark` selects that scheme's branch. Our old line required `light dark` everywhere, contradicting the source's forced-scheme examples below. MDN documents colour and image forms; check image support separately from the colour form's Baseline status. [MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark). `color-scheme` is Baseline widely available since January 2022 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)). Both are signals a component can read about its context [nerdy.dev: Web elements know about the user, device, variables, layout and more](https://nerdy.dev/components-can-know) (2025-10-30).

- **Adaptive scrim** [nerdy.dev: Adaptive Scrim](https://nerdy.dev/adaptive-scrim) (2024-09-08): a caption band that flips with `light-dark()`; the code and MDN's `border-image` caveat are in [GRADIENTS-AND-EFFECTS.md](GRADIENTS-AND-EFFECTS.md#borders-scrims-and-shadows).
- **Tint native widgets:** `accent-color: light-dark(deeppink, yellow)` and its support are in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#accent-color).
- **Icons per scheme:** Nice Select ships its chevron and checkmark as SVG data URIs "with variants for each color scheme"; "Pre-defined black/white SVGs avoid runtime color manipulation." [nerdy.dev: Nice Select](https://nerdy.dev/nice-select) (2026-02-03).
- A custom `--light-dark()` that works beyond colours is in [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md#custom-functions-and-if).

## Page and component light and dark

[nerdy.dev: Page and Component Adaptive Light/Dark](https://nerdy.dev/page-and-component-light-dark-strategies) (2024-08-21): "Sometimes you need light and dark elements, sections or components." The post called the second and third strategies "Future"; `@scope` is now Baseline 2026, newly available since March 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)), and style queries support custom properties only ([MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries)).

- **Colour only: `color-scheme` plus `light-dark()`.** "Minimal and effective", the HTML stays clean, but it "is only for color values".
  ```html
  <section class="dark">
    <h1>Dark</h1>
    
    <section class="light">
      <h1>Light</h1>
      
      <section class="dark">
        <h1>Dark</h1>
      </section>
    </section>
  </section>
  ```
  ```css
  .dark  { color-scheme: dark }
  .light { color-scheme: light }

  section {
    background: light-dark(#ddd, #222);
    color: light-dark(#222, #ddd);
  }
  ```
- **Any style per context: `@scope`** (Miriam Suzanne's use case; the explainer covers the "nearest-ancestor proximity problem"). Same HTML. "We don't get to query or do anything 'just in time', but we are able to change colors and any styles we want within a light or dark context." Proximity and `:scope` specificity are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md).
  ```css
  @scope (.dark) {
    :scope {
      color-scheme: dark;
      background: #222;
      color: #ddd;
      border: 5px dashed cyan;
    }
  }

  @scope (.light) {
    :scope {
      color-scheme: light;
      background: #ddd;
      color: #222;
      border: 5px solid hotpink;
    }
  }
  ```
- **Conditional logic per context: style queries.** A custom property holds the scheme; "a style query can only query a parent", so each context needs a wrapper with `.dark` or `.light`, which makes the HTML "decently less approachable and manageable".
  ```html
  <div class="dark">
    <section>
      <h1>Dark</h1>
      <div class="light">
        <section>
          <h1>Light</h1>
          <div class="dark">
            <section>
              <h1>Dark</h1>
            </section>
          </div>
        </section>
      </div>
    </section>
  </div>
  ```
  ```css
  .dark, .light {
    color-scheme: var(--color-scheme);
  }

  .dark  { --color-scheme: dark }
  .light { --color-scheme: light }

  section {
    background: light-dark(#ddd, #222);
    color: light-dark(#222, #ddd);
    
    @container style(--color-scheme: light) {
      border: 10px solid pink;
    }
    
    @container style(--color-scheme: dark) {
      border: 5px dashed cyan;
    }
  }
  ```
- **Choosing:** colour only, `light-dark()`; any style, `@scope`; logic per context, style queries with wrappers.
- **Whole-page dark:** these posts switch on `prefers-color-scheme` or `color-scheme`. landing-page-ui's head script "sets the dark class, `data-theme` and `color-scheme` on `<html>` before anything paints" ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)); in app-ui "the head script's class decides the theme" ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).

## System and accent colours

- **System colours adapt with the scheme** [nerdy.dev: Nice Select](https://nerdy.dev/nice-select) (2026-02-03): `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, with `color-scheme: light dark` enabling the adaptation and `light-dark()` for values that differ per scheme.
- **`AccentColor` and `AccentColorText`** don't follow the author's `accent-color` (MDN: some browsers return a fixed value); the post's wish and MDN's note are in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#accent-color).

## Wide gamut: P3 with an sRGB fallback

- **Declare twice; the cascade keeps the one the browser understands** (from the VisBug logo's inline CSS) [nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update) (2024-04-28). The same pattern pairs `magenta` with `color(display-p3 1 0 1)` and `cyan` with `color(display-p3 0 1 1)`.
  ```css
  visbug-body {
    background: yellow;
    background: color(display-p3 1 1 0);
    border-radius: 100% 25% 100% 0% / 100% 0% 100% 0%;
  }
  ```
  `color()` is Baseline widely available since May 2023, and `@media (color-gamut: p3)` detects the gamut ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color)).
- **Gamut is a capability like width:** "Viewport widths n' color gamuts; As each widen, adapt the UI." [nerdy.dev: Device Width Is Like Device Color Gamut](https://nerdy.dev/device-width-is-like-device-color-gamut) (2023-04-05). Capability and preference queries are in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md).

## Contrast scores: APCA and L*

[nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update) (2024-04-28): VisBug shows APCA and L* (lightness difference) scores, computed with ColorJS, next to each other. "Fun to find moments where they disagree too." ColorJS does colour conversion and contrast, and "can do everything [TinyColor] can, plus more." This is a library, not a platform feature.

## Forced colours

The feature status, transparent-border technique and structural-debug use are defined in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#forced-colors). [nerdy.dev: New Year, New Site](https://nerdy.dev/new-year-new-site), [Nintendo Switch homescreen](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), [Nice Select](https://nerdy.dev/nice-select)

## Prove it

- Colour variants (hover, borders, tints) derive in `oklch`, `oklab` or `lch`, not `hsl`, unless a quoted source says otherwise.
- No relative `oklch(from ...)` subtracts whole numbers from `l`: lightness math stays within 0 to 1 (`calc(l - 0.2)`).
- Relative RGB opacity math uses the `alpha` channel, not `a`. [Relative colour syntax](#relative-colour-syntax)
- No `color-contrast(... vs ...)` remains; contrast picks use one-argument `contrast-color()` and keep a static fallback.
- Check automatic selection under `color-scheme: light dark` and forced selection under `light` or `dark`; a forced section follows its own scheme rather than the OS toggle. Check image support separately. [light-dark() and color-scheme](#light-dark-and-color-scheme)
- Each `color(display-p3 ...)` follows an sRGB declaration of the same property.
- Turn on forced colours (DevTools rendering panel): every control and card still shows an edge where it relied on a shadow or fill.
- No component reads `AccentColor` expecting the author's `accent-color`.
