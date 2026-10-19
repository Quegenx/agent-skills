# Select and form controls

Native form controls styled and animated with CSS: the customizable `<select>` (`appearance: base-select`, `::picker(select)`, `:open`, `<selectedcontent>`, `::checkmark`, `::picker-icon`) and its open and close transitions, a full "nice select" build, `field-sizing`, revealing a field once the one before it is valid, feeding form state and range values to CSS, a range input with a progress fill, radio and checkbox groups (including a squishy one and a cyclical one laid out with trig functions), and `accent-color`. Source: Adam Argyle's nerdy.dev posts, each tagged where used; support status was checked on MDN (page Baseline banner and browser-compat-data 8.1.6) on 2026-10-17. Code is copied verbatim from the posts unless a line says it was corrected.

**Contents:** [Customizable select](#customizable-select) · [A nice select, part by part](#a-nice-select-part-by-part) · [Fields that size to content](#fields-that-size-to-content) · [Reveal a field once the previous one is valid](#reveal-a-field-once-the-previous-one-is-valid) · [Form state and values into CSS](#form-state-and-values-into-css) · [Range input progress fill](#range-input-progress-fill) · [Radio and checkbox groups](#radio-and-checkbox-groups) · [accent-color](#accent-color) · [The on-screen keyboard](#the-on-screen-keyboard-inputmode-autocapitalize-enterkeyhint) · [Prove it](#prove-it)

## Customizable select

- **What it gives you** [nerdy.dev: Customize A Select](https://nerdy.dev/customize-a-select), 2025-03-24: "Finally render custom HTML inside an `<option>`", "Works without JS", "Easy to progressively enhance". And [nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03: `appearance: base-select` "unlocks full customization of native `<select>` elements while retaining browser controlled accessibility and keyboard navigation."
- **What MDN adds:** with `base-select` the picker renders in the top layer like a popover, can be anchor-positioned, does not render outside the browser pane or trigger the OS mobile pickers, and is no longer sized to the widest option ([MDN appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/appearance)).
- **Support (2026-10-17): not Baseline.** browser-compat-data: `appearance: base-select` Chrome 135, Firefox 149 behind a flag, Safari 27; `::picker(select)` and `<selectedcontent>` Chrome 135, Safari 27, no Firefox; `::checkmark` and `::picker-icon` Chrome 133, Safari 27, no Firefox ([MDN ::picker()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::picker)). `:open` is Baseline 2026, newly available since 2026-05-11 (Chrome 133, Firefox 136, Safari 26.5), [MDN :open](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:open). What the posts said: "Canary" plus "Enable web experiments" (2024-09-19); "Chrome only atm", the examples "just look like regular select elements in Firefox and Safari" (2026-02-03). Safari has shipped it since; in Firefox it still renders as a regular select.
- **The boilerplate** [nerdy.dev: Custom <select> boilerplate + transitions](https://nerdy.dev/custom-select-with-transitions-boilerplate), 2024-09-19. "The first step is to give the select and it's picker `appearance: base-select`, which signals that you intend to build up a select from a set of base styles. Then enable transitions on the `::picker` popover. Lastly, hook into the `:open` pseudo class and provide the enter and exit stage animations."

  ```css
  select {
    &, &::picker(select) {
      appearance: base-select;
    }
    
    &::picker(select) {
      transition: 
        display allow-discrete 1s, 
        opacity 1s, 
        overlay 1s allow-discrete
      ;
    }
    
    &:not(:open)::picker(select) {
      opacity: 0;
    }
    
    &:open::picker(select) {
      opacity: 1;
      
      @starting-style {
        opacity: 0;
      }
    }
  }
  ```

  Why each part: `overlay ... allow-discrete` is, per MDN, "Required to make sure that the removal of the element from the top layer is deferred until the animation has been completed" ([MDN transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior)); `@starting-style` gives the opening frame. `overlay` is Limited availability, Chrome 117 only ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overlay)); where the discrete transitions are missing, the picker closes without the fade. The display, overlay and `@starting-style` mechanics are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).
- **Timing:** the post's 1s picker against ui-animation's 150-220 ms for a dropdown is set out in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md).
- app-ui builds its menus as "a menu that is its trigger, grown" instead, where "A headless primitive owns focus, keyboard and dismissal" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).

## A nice select, part by part

[nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03 pushes the customizable select "to an extreme". "It's mostly CSS! A li'l JS sprinkle just to position the `::picker()` and the selected option together; the JS is nice to have, **CSS does the real work**." The post lists its parts; the demo code is not exported ([demo](https://codepen.io/editor/argyleink/pen/019c1f28-bbc2-7bac-ad4a-a7e41d3730f1)). Every bullet in this section is from that post unless it names MDN.

- **Enhance only on hover and fine pointers:** custom styling only under `@media (hover)` and `(pointer: fine)`; "I keep mobile with the native select."
- **Parts and states:** `::picker(select)` for the picker container, `::picker-icon` for the chevron, `::checkmark` for the selected option's indicator, `<selectedcontent>` ("Native element that mirrors selected option content in the button"), `:open` for the open picker, `:checked` on options.
- **Picker aligned to the chosen option:** the picker uses `anchor(start)` against the button; "some special JS sauce to write an inline CSS variable" (`--_select-anchor-offset`) lines the selected option up with the button text ("obviously this can't work at the viewport edges"); `transform-origin: 50% var(--_select-anchor-offset)` makes the scale animation grow from that option; `flip-block, flip-inline` fallbacks reposition it when it would overflow the viewport. The post asks "Maybe I should have used AIM?" Fallbacks and AIM are in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).
- **Motion:** `@starting-style` for the picker's entry; `display` and `overlay` with `allow-discrete`; `::picker-icon` "rotates 180° on open with spring easing" (Open Props `--ease-spring-3`); options "animate in from the bottom using `animation-timeline: view()`"; `:active` scales the button to `0.98`; on `:open` the select "scales up to `1.04`", "scaling back down on close with a soft bounce"; every animation and transition sits inside `@media (prefers-reduced-motion: no-preference)`. `animation-timeline` is Limited availability ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)).
- **Theme:** `color-scheme: light dark`, `light-dark()` for backgrounds, system colors `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `color-mix()` for translucent overlays and borders, chevron and checkmark as SVG data URIs "with variants for each color scheme" ("Pre-defined black/white SVGs avoid runtime color manipulation"), `@media (forced-colors: active)` adaptations, "even the sticky scroll state respects this!" The post calls forced colors "a really great way to debug spacing and skeletal aspects of the UI." Color functions are in [COLOR.md](COLOR.md).
- **Layout:** all spacing, sizes and timing as `--_select-*` custom properties; logical properties throughout (an Arabic demo checks RTL); `text-box: trim-both cap alphabetic` on group legends; options are flex with `gap` for icon plus text; the checkmark goes to the end with `order: 2` and `margin-inline-start: auto`; `text-overflow: ellipsis` in the button; `corner-shape: superellipse(1.25)` "(with fallback)"; `background-clip: padding-box` "prevents background bleeding under border".
- **Scrolling:** `container-type: scroll-state` with `@container scroll-state(stuck)` so sticky group legends change color when stuck; `scrollbar-width: thin` and `scrollbar-color` "with fade on hover-out"; `overscroll-behavior-block: contain` "prevents scroll chaining"; motion-safe `scroll-behavior: smooth`; JS adds a `.scrollable` class "when content exceeds max height". Scroll behavior is in [SCROLL.md](SCROLL.md); scrollbar styling is in [SCROLLBARS.md](SCROLLBARS.md).
- **Focus and options:** distinct `:focus` (subtle) and `:focus-visible` (prominent); `option[disabled]` styled with hover prevented; JS skips `[hidden]` options in its offset math.
- **Performance:** `will-change: scale` as a compositor hint that "also fixes text shift bug"; a `WeakMap` offset cache "Avoids expensive DOM measurements on every interaction", auto-garbage-collected; hardcoded layout constants avoid `getComputedStyle` forced reflows: "Tried dynamically computing these in a hidden instance, but couldn't get it as close as just "hardcoding / speficying them ahead of time" in a config". ui-animation keeps `will-change` for a measured problem ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)); the text shift is the problem it fixes here.
- **Item height, two views:** the post's `36px` rows that it says match "mobile guidelines", against anti-slop-ui's 44px tap targets, are set side by side in [anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md).
- **Variations shown:** a toggle with green, red and gray status dots; an avatar select; multi-line options (title plus description); grouped options in fieldsets with sticky legends; a label above the value; a flag emoji country picker by region.
- **Known limit, unresolved:** "I tried many variants of animation, trying to reduce some of the shift of the positioning, but never found something that worked across all the variants."
- **Support of the extras:** `corner-shape` is not Baseline and experimental ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape)); `light-dark()` is Baseline 2024, newly available since 2024-05-13 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)); scroll-state container queries are Limited availability and experimental (browser-compat-data `container-type: scroll-state`: Chrome 133 only; [MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries)).

## Fields that size to content

- anti-slop-ui already says "Textareas grow with `field-sizing: content`, no script" ([RESPONSIVE.md](RESPONSIVE.md)). The growth itself is instant.
- **Animate the growth** [nerdy.dev: Transitioning Field Sizing Content With CSS](https://nerdy.dev/transitioning-field-sizing-content-with-css), 2026-10-03: "Use anchor to track the size changes in a `textarea` (or whatever) and transition instead of instantly update." Demo code not exported ([demo](https://codepen.io/argyleink/pen/qErPZoR)); anchoring is in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).
- **Support:** `field-sizing` is Baseline 2026, newly available since 2026-06-16 (Chrome 123, Firefox 152, Safari 26.2), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing).

## Reveal a field once the previous one is valid

- [nerdy.dev: CSS interpolate-size to the rescue](https://nerdy.dev/interpolate-size), 2024-09-25: "the password field is hidden until a valid username is provided"; the post's code and MDN's notes on `interpolate-size` are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md#interpolate-size-and-calc-size).
- **Support:** `:user-valid` is Baseline widely available since 2026-05-02 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-valid)); `:has()` is widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)); `interpolate-size` is Limited availability and experimental, Chrome 129 only, values `allow-keywords` and `numeric-only` (the default) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size)). Without it the field still appears once the username is valid, without the height transition.
- anti-slop-ui lists `interpolate-size: allow-keywords` among features to use "Inside `@supports` only, where the page works without them" ([RESPONSIVE.md](RESPONSIVE.md)); the post sets it on `:root` with no guard.

## Form state and values into CSS

[nerdy.dev: Prop For That](https://nerdy.dev/prop-for-that), 2026-06-13: a JS library by the author ([site](https://prop-for-that.netlify.app/), npm `prop-for-that`) that writes live custom properties onto elements that ask with `data-props-for`. Among its live props: input values; input dirty, touched and pristine; select value, index and count. The library is in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md#live-properties-from-js); its form-validity example (`<form data-props-for="form-state">` with `@container style(--live-all-valid: 1)`) is in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md#live-properties-from-js).

- **Support:** the post (2026-06) says "Style Queries being in all major browsers". browser-compat-data: style queries for custom properties Chrome 111, Firefox 151, Safari 18; MDN's guide says custom properties are the only style feature supported in `style()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries)).

## Range input progress fill

- **With no JS** [nerdy.dev: Custom range input progress fill](https://nerdy.dev/add-a-rad-gradient-progress-fill-to-a-range-input-with-no-JS), 2023-11-17: Roman Komarov showed "how CSS scroll driven animation could map the `input[type=range]` slider's thumb pseudo element position and use it to power a percentage in a gradient mask" ([explained on Roman's blog](https://blog.kizu.dev/input-range-thumb/)); Adam's fork repurposes that mapping "to power the fill of a range slider". The post (2023-11): "this may not have great support at the moment, and is quite a little web of CSS to setup… it's a very promising path forward for styling `input[type=range]` and **other components with moveable parts**." Demo code not exported ([demo](https://codepen.io/argyleink/pen/vYbpNVm)). Scroll-driven animation (`animation-timeline`) is still Limited availability: Chrome 115, Safari 26, Firefox only in preview ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)).
- **With a live custom property:** Prop For That's range example, a gradient "that fills up the slider" from `--live-value-pct` ([nerdy.dev: Prop For That](https://nerdy.dev/prop-for-that), 2026-06-13), is in [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md#live-properties-from-js).

## Radio and checkbox groups

- **Lean on the group** [nerdy.dev: Meaningful Ways To Use Radio And Checkbox Groups](https://nerdy.dev/meaningful-ways-to-use-radio-and-checkbox-groups), 2023-10-25: "Checkbox and radio groups have special powers with keyboard and screen reader interactions; leaning into them can lead to some rad UI": [picklists](https://codepen.io/argyleink/pen/KKJppLw) and [taglists](https://codepen.io/argyleink/pen/ZEwGRXg). Demo code not exported. The GUI Challenge on picklists: "leverage the **power of checkbox and radio groups** for beautiful and accessible picking UX" [nerdy.dev: Thinking On Ways To Style Checkbox And Radio Groups](https://nerdy.dev/thinking-on-ways-to-style-checkbox-and-radio-groups), 2023-11-21 (video and [demo](https://gui-challenges.web.app/picklists/dist/)).
- app-ui builds preset tag pickers as toggle pills with `aria-pressed` instead of a checkbox group ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
- **Switch group** [nerdy.dev: Thinking On Ways To Solve Switch Groups](https://nerdy.dev/thinking-on-ways-to-solve-switch-groups), 2023-03-09: "take a fieldset packed with a radio group, and turn it into a switch group that controls text alignment" (video; [demo](https://gui-challenges.web.app/switch-group/dist/), [source](https://github.com/argyleink/gui-challenges)).
- **Squishy radio group** [nerdy.dev: A Squishy Radio Group](https://nerdy.dev/a-squishy-radio-group), 2024-01-11: "Combine them with `:has()`, animated `grid-template-columns` and `linear()` easing and you've got yourself a neat little single picker UX." Demo code not exported ([demo](https://codepen.io/argyleink/pen/ExMgWLe)). `:has()` and `linear()` are Baseline widely available ([MDN :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has), [MDN linear()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear)). Two views on the cost: the post animates a grid track, a layout property; ui-animation says animating layout properties "recalculates layout every frame" and moves with `translate` and `scale` instead ([ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md)).
- **Cyclical radio group on a circle** [nerdy.dev: Cyclical keyboard UX with a radio group and CSS trig functions](https://nerdy.dev/cyclical-radio-group-with-trig-functions-and-grid), 2023-03-10. Arrow keys already cycle focus through a radio group; laying the radios on a circle makes the cycle visible ("I'm just inside a radio group usin arrow keys"). Stack every radio in one centered grid cell, then `translate` each by `cos()` and `sin()` of its angle. The post hand-wrote the index and count as custom properties ("I hand wrote the values"), standing in for its own CSSWG proposal for `sibling-count()` and `sibling-index()`. Verbatim:

  ```html
  <fieldset style="--sibling-count: 8">
    <input style="--sibling-index: 1" type="radio" name="cyclical-group" checked>
    <input style="--sibling-index: 2" type="radio" name="cyclical-group">
    <input style="--sibling-index: 3" type="radio" name="cyclical-group">
    <input style="--sibling-index: 4" type="radio" name="cyclical-group">
    <input style="--sibling-index: 5" type="radio" name="cyclical-group">
    <input style="--sibling-index: 6" type="radio" name="cyclical-group">
    <input style="--sibling-index: 7" type="radio" name="cyclical-group">
    <input style="--sibling-index: 8" type="radio" name="cyclical-group">
  </fieldset>
  ```

  ```css
  fieldset {
    /* divide circle by total children */
    --_offset: calc(360deg / var(--sibling-count));
    
    /* size also used for circle translateX and Y */
    --_circle-size: 25vmin;
    inline-size: var(--_circle-size);
    block-size: var(--_circle-size);
    
    /* 1x1 centered cell */
    --_cell-size: 10vmin;
    display: grid;
    place-content: center;
    grid: var(--_cell-size) / var(--_cell-size);
    
    /* stack them together in 1 cell */
    > * {
      grid-area: 1/1;
    }
  }
  ```

  ```css
  input {
    /* take child index * circle fraction offset */
    --_angle: calc(var(--sibling-index) * var(--_offset));
    
    /* cos() translateX, sin() translateY */
    translate: 
      calc(cos(var(--_angle)) * var(--_circle-size))
      calc(sin(var(--_angle)) * var(--_circle-size))
    ;
  }
  ```

- **The same with today's functions.** `sibling-index()` and `sibling-count()` now exist: Baseline 2026, newly available since 2026-08-18 (Chrome 138, Firefox 154, Safari 26.2), [MDN sibling-index()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index), [MDN sibling-count()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count). Each returns an integer for the element it is used on, so the count is read on the radio, not on the fieldset. Changed from the post: the inline `style` attributes and the fieldset's `--_offset` are gone, and the angle is computed on each input:

  ```css
  input {
    --_angle: calc(sibling-index() * (360deg / sibling-count()));

    translate:
      calc(cos(var(--_angle)) * var(--_circle-size))
      calc(sin(var(--_angle)) * var(--_circle-size))
    ;
  }
  ```

  Keep the post's `fieldset` rule minus its `--_offset` line. MDN: `sibling-index()` gives "the position of the current element in the DOM tree relative to all its sibling elements", so a `<legend>` inside the fieldset would shift the indices. The post (2023-03) needed "Canary with web experiements turns on" for nesting and trig; `cos()` and `sin()` are Baseline widely available ([MDN cos()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/cos)).

## accent-color

[nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17, section "AccentColor and AccentColorText".

- **Tint the system widgets:** `accent-color` "tints system widgets to match your brand", such as the radio button or checkbox selected state. With `light-dark()`, verbatim:

  ```css
  form {
    accent-color: light-dark(deeppink, yellow);
  }
  ```

- **Contrast is handled for you,** per the post: when the control is filled with the accent, "the checkbox color will automatically flip between white or black to provide a strongly contrasting checkmark over the `accent-color`" (citing [web.dev](https://web.dev/articles/accent-color#guaranteeing_contrast)). MDN says only that "Each user agent has an accent color, with variations to ensure legibility and contrast."
- **`AccentColor` and `AccentColorText` are not your accent.** The post wishes they reflected the author's `accent-color` (it was "flagged as a tracking vector"; csswg issues 5900 and 10372). MDN lists both system colors and warns that "some browsers return a fixed value for `AccentColor` and `AccentColorText` unless they are used in certain restricted circumstances" ([MDN system-color](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color)). Do not build on the post's wished-for code (`background: AccentColor; color: AccentColorText;` under `accent-color: light-dark(deeppink, yellow);`).
- **Support:** MDN shows `accent-color` as Limited availability (not Baseline); browser-compat-data lists Chrome 93, Firefox 92, Safari 26.2, and marks Chrome for Android partial: it "does not maintain minimum contrast for legibility of the control" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/accent-color)). `light-dark()` needs `color-scheme: light dark` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)). app-ui sets a native radio's `accent-color` to the brand ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).

## The on-screen keyboard: inputmode, autocapitalize, enterkeyhint

[Emil Kowalski, mobile-native] "While you're in the inputs, set the keyboard: `inputmode="numeric"` for codes, `inputmode="decimal"` for amounts, `type="email"` and `type="tel"` for their fields, `autocapitalize="none"` and `autocorrect="off"` on usernames and codes, `enterkeyhint="send"` / `"search"` / `"done"` so the return key says what it does." The nerdy.dev posts above don't cover these attributes; the values and status are from MDN, checked 2026-10-18.

| Attribute | What MDN says | Status |
|---|---|---|
| `inputmode` | `numeric`: "only requires the digits 0-9"; `decimal`: "the digits and decimal separator for the user's locale"; both "may or may not show a minus key" | Baseline widely available since December 2021 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)) |
| `enterkeyhint` | `enter`, `done`, `go`, `next`, `previous`, `search`, `send`; example labels "depends on user agent and user language" | Baseline widely available since November 2021 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)) |
| `autocapitalize` | `none` or `off`, `sentences` or `on`, `words`, `characters`; it "doesn't affect behavior when typing on a physical keyboard", and "has no effect on the `url`, `email`, or `password` `<input>` types" | Limited availability, not Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocapitalize)) |
| `autocorrect` | `on` (or empty) and `off`; the `<input>` types that don't support it (`password`, `email` and `url`) "always have the `off` state" | Baseline 2026, newly available since September 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocorrect)) |

- So `autocapitalize` and `autocorrect` matter on `type="text"` fields such as usernames and codes; an email field ignores `autocapitalize` and is always `autocorrect` off.
- app-ui records the owner's own fields (one-time codes, URLs) in [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md); the agent composer's return key is in [agent-chat-ui COMPOSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/COMPOSER.md).

## Prove it

- **Fallback select:** open the page in Firefox (no `base-select`); every select still opens, picks and submits as a regular select.
- **Keyboard:** on a customized select, arrows move through options, Enter picks, Escape closes, and focus returns to the button.
- **Exit transition:** in Chrome, close the picker; it fades out instead of vanishing. Remove `overlay ... allow-discrete` and it vanishes at once.
- **Touch path:** on a coarse pointer the enhanced select is not applied (if it follows the post's `(hover)` and `(pointer: fine)` gate), and any custom option row meant for touch is about 44px tall.
- **Reduced motion:** with reduced motion on, nothing scales, rotates or slides; options and picker still appear.
- **Valid-then-reveal:** type an invalid username; the password field stays collapsed. Make it valid; the field appears (animated in Chrome, instant elsewhere).
- **Radio circle:** tab into the group and hold an arrow key; focus walks around the circle and wraps from the last radio to the first.
- **Accent:** toggle the OS between light and dark with `color-scheme: light dark` set; checked boxes switch between the two accent colors and the checkmark stays readable.
- **Keyboard attributes:** on a phone, an amount field opens a keypad with the decimal separator, a code field opens digits, and a username field starts lowercase with no autocorrect; the return key reads "Send", "Search" or "Done" where set.
