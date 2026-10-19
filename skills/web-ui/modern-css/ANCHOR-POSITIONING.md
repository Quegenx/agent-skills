# Anchor positioning

Anchor positioning tethers one element (a tooltip, a picker, a dialog, a carousel button) to another element's box, in CSS, without changing the DOM. This file covers naming an anchor (`anchor-name`), linking to it (`position-anchor`), placing against its edges (`anchor()`, `anchor-size()`), placing in its grid of areas (`position-area`), flipping when space runs out (`position-try-fallbacks`) and why flips stop working in small spaces, anchor-interpolated morphing (AIM, a CSS-only FLIP for overlays) and carousel scroll buttons that move inside or outside by available space. Source: Adam Argyle's nerdy.dev posts, each tagged where used (one bullet is tagged [css-modern-features], rushenn/css-modern-features, MIT); support status was checked on MDN (page Baseline banner and browser-compat-data 8.1.6) on 2026-10-17. Code is copied verbatim from the posts unless a line says it was corrected.

**Contents:** [Name an anchor and tether to it](#name-an-anchor-and-tether-to-it) · [Place it with position-area](#place-it-with-position-area) · [Flip when space runs out](#flip-when-space-runs-out) · [Why fallbacks fail in small spaces](#why-fallbacks-fail-in-small-spaces) · [Anchor-interpolated morphing (AIM)](#anchor-interpolated-morphing-aim) · [Carousel buttons that move inside or outside](#carousel-buttons-that-move-inside-or-outside) · [Other uses](#other-uses) · [Prove it](#prove-it)

## Name an anchor and tether to it

- **What it is for** [nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers), 2026-04-26: "Anchor positioning lets you natively tether components to target elements without adjusting DOM semantics or crowding the main thread." The post put it in the set that "just hit baseline between October 2025 - April 2026", with "sub features that aren't all supported, but the general featureset is ready."
- **Support (MDN, 2026-10-17):** `anchor-name`, `anchor()`, `anchor-size()`, `position-area`, `position-try-fallbacks`, `position-try` and `@position-try` are Baseline 2026, newly available since 2026-01-13 (Chrome 125 to 129, Firefox 147, Safari 26): [anchor-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name), [anchor()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/anchor), [anchor-size()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/anchor-size). `position-anchor` is Baseline 2026 since 2026-09-14 (Chrome 151, Firefox 151, Safari 27), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-anchor); browser-compat-data dates its `auto` value to Chrome 127, Firefox 147, Safari 26 and its `normal` value to Chrome 151, Firefox 151, Safari 27. The web-features group "Anchor positioning" as a whole is still not Baseline (some parts need Safari 27), which matches the post's "sub features that aren't all supported."
- **You need something to anchor to** [nerdy.dev: CSS Anchor API is lookin rad!](https://nerdy.dev/css-anchor-api-is-lookin-rad), 2022-12-20: "You need something to anchor to, just like you need a named container or a view-timeline." The post's code, verbatim:

  ```css
  .some-non-floating-element {
    anchor-name: --side;
  }
  ```

  ```css
  .tooltippy {
    position: absolute;
    top: anchor(--side bottom);
    /* top of this touches the bottom of that */
  }
  ```

  ```css
  .tooltippy {
    left: anchor(--side left);
    /* left of this touches the left of that */
  }
  ```

- **Explicit target lookup differs from the default anchor.** A name inside `anchor(--side bottom)` looks up that named target and remains valid without `position-anchor`. `position-anchor` can establish the default anchor, letting `anchor(bottom)` omit the name; this also matters for the default anchor's other positioning behavior. Our old correction wrongly rejected the source's explicitly named function as obsolete syntax, so its source examples above remain. [CSS Anchor Positioning: Anchor position functions](https://drafts.csswg.org/css-anchor-position-1/#anchor-pos), [target anchor element](https://drafts.csswg.org/css-anchor-position-1/#target-anchor-element)
- **One line exposes the box** [nerdy.dev: Anchor Interpolated Morph (AIM)](https://nerdy.dev/anchor-interpolated-morphing), 2026-01-23: `anchor-name` "enables any other element to observe the height, width, and position of this element." Its own list of what a component can know includes "where other elements are and their size" (`position-anchor`, `anchor-size()`) and "distance from other elements" (anchor) [nerdy.dev: Web elements know about the user, device, variables, layout and more](https://nerdy.dev/components-can-know), 2025-10-30.
- **Anchor names are dashed** [nerdy.dev: An Emoji Naming Convention](https://nerdy.dev/css-emoji-convention), 2025-02-20: "some CSS features require the dashed names while others do not"; its list writes `anchor-name: --foo;` beside an undashed `container-name: foo;`. The same post prefixes anchor names with an anchor emoji (`anchor-name: --⚓-example;`), and the AIM post uses `--⚓︎-morph`. The naming convention itself is in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#emoji-in-custom-names).
- **Layering without `position: absolute` math** [nerdy.dev: The Over Easy Mini Web Machine](https://nerdy.dev/the-over-easy-mini-web-machine), 2024-09-04: UI layering with `anchor()`, "no more complex `position: absolute`", keyword alignment ([anchor-tool.com](https://anchor-tool.com/)), "intrinsically sized based on content", and it "pairs radically with `popover` elements" (popovers are in [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md)). Video and CodePen demos only; demo code not exported.

## Place it with position-area

- **Areas instead of edges.** MDN: `position-area` places the element "on one or more tiles of an implicit 3x3 grid, where the anchoring element is the center cell" ([MDN position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)). Values can come from custom properties, as in the carousel code below (`position-area: var(--_outer);`, with values such as `inline-end center` and `center span-inline-start`) [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17. Support: Baseline 2026, newly available since 2026-01-13 (Chrome 129, Firefox 147, Safari 26), [MDN position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area).
- **Renamed property.** MDN: `position-area` "was originally named and supported in Chromium browsers as `inset-area`" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)). Write `position-area`; the nerdy.dev posts already do.
- **Popover pitfall (MDN).** When using `position-area` on a popover, reset `margin: 0; inset: auto;` ([MDN position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)).

## Flip when space runs out

- **Flip both axes** [nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03: the select picker uses `anchor(start)` against its button, and the anchor fallbacks `flip-block, flip-inline` "automatically repositions the anchor position if the picker would overflow the viewport." The post labels this `position-try` but links the longhand page. Both the shorthand and `position-try-fallbacks` accept fallback lists: the shorthand's optional order defaults to `normal` when omitted. Our old line and check wrongly required the longhand; use it when changing fallbacks while preserving an existing order. [MDN position-try](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-try)

  Support: Baseline 2026, newly available since 2026-01-13 (Chrome 128, Firefox 147, Safari 26), [MDN position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-try-fallbacks). MDN describes the try-tactic keywords `flip-block`, `flip-inline` and `flip-start`; its formal syntax and browser-compat-data also have `flip-x` and `flip-y` (Chrome 144, Firefox 147, Safari 26.2).
- **Pick the fallback with the most room** [css-modern-features, positioning.md]: `position-try-order` reorders the fallbacks by available space. Verbatim:

  ```css
  .tooltip {
    position-try-fallbacks: --flip-above, --flip-left;
    position-try-order: most-width; /* pick the position with most space */
  }
  ```

  `--flip-above` is an `@position-try` rule the source defines earlier; `--flip-left` it never shows. Status: Chrome 125, Safari 26, Firefox 148 (browser-compat-data `css.properties.position-try-order`); the source gives no version. MDN's values are `normal`, `most-width`, `most-height`, `most-block-size` and `most-inline-size` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-try-order)).
- The rest of that select (aligning the picker with the chosen option) is in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md).

## Why fallbacks fail in small spaces

[nerdy.dev: Why isn't my position-try-fallback working in small spaces?](https://nerdy.dev/why-isnt-my-position-try-fallback-working-in-small-spaces), 2024-10-12. The property in the title is singular; the real one is `position-try-fallbacks`.

- **Symptom:** above a viewport of about 1000px the anchored element did `flip-block`; on smaller viewports "it just stopped working", although "There was ample space around the anchors."
- **Cause:** a `center` cell, not the flip logic. The code that broke:

  ```css
  .floaty {
    position-area: top center;
  }
  ```

  The Chromium engineer's [reply](https://issues.chromium.org/issues/360921604#comment3): "So this is a danger of using the "center" position-area. The anchored element doesn't fit. E.g. its inline size is larger than the area. In this case we just bail and use the first. If you switch to position-area: top it works as expected."
- **Fix:** the spanning `top` area.

  ```css
  .floaty {
    position-area: top;
  }
  ```

  "**Fixed**. Width no longer effects anchor flip."
- **The rule:** when no position fits, the browser uses the first one, so a `center` cell narrower than the element blocks every flip. MDN's position-area page adds the mechanism: an element placed in a single top-center cell "won't allow its content to overflow", so its minimum width is `min-content` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)).

## Anchor-interpolated morphing (AIM)

[nerdy.dev: Anchor Interpolated Morph (AIM)](https://nerdy.dev/anchor-interpolated-morphing), 2026-01-23. "It's more natural when animations start near the trigger point." AIM combines `anchor()`, `anchor-size()`, `@starting-style` and `interpolate-size` into "an **interruptible** contextual transition from where a user invoked it", with CSS transitions only.

- **Why not a child anchored to its parent:** the post asks "What if they're not ancestors?", "What if one is in the top layer?" and "What if you want semantic HTML and a healthy accessibility OM?" AIM covers all three.
- **How it maps to FLIP** (Paul Lewis's First, Last, Invert, Play, which uses JS to measure before and after a DOM change): "**First:** `anchor()`, `anchor-size()` & `@starting-style` **Last:** `interpolate-size: allow-keywords` & `auto`", and `transition` handles invert and play. "Definitely not 100% like FLIP." The JS FLIP and Motion layout route are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md).
- **The `<dialog>` recipe, verbatim, in the post's five steps.** Step 1, name the element the dialog morphs from:

  ```css
  button {
    anchor-name: --⚓︎-morph; 
  }
  ```

  Step 2, link the dialog to that anchor:

  ```css
  dialog {
    position-anchor: --⚓︎-morph;

    /* adjust position as desired */
    left: anchor(left);
    top: anchor(top);
  }
  ```

  Step 3, allow transitions to `auto` width and height:

  ```css
  dialog {
    interpolate-size: allow-keywords;
  }
  ```

  Step 4, transition every property in the morph, gated on motion preference:

  ```css
  dialog {
    @media (prefers-reduced-motion: no-preference) {
      transition:
        display var(--_speed) allow-discrete,
        overlay var(--_speed) allow-discrete,
        height  var(--_speed) var(--ease-3),
        width   var(--_speed) var(--ease-3),
        left    var(--_speed) var(--ease-3),
        top     var(--_speed) var(--ease-3);
    }
  }
  ```

  Step 5, the "enter stage from" styles: start the open dialog on the anchor's box.

  ```css
  dialog {
    @starting-style {
      &[open] {
        left: anchor(left);
        top: anchor(top);
        right: anchor(right);
        bottom: anchor(bottom);
        width: anchor-size(width);
        height: anchor-size(height);
      }
    }
  }
  ```

  "`anchor-size()` for height and width, this combined with height and width `auto` and `interpolate-size: allow-keywords` will allow the dialog to transition to its natural size from the anchor." The exit state:

  ```css
  dialog {
    &:not([open]) {    
      left: anchor(left);
      top: anchor(top);
      right: anchor(right);
      bottom: anchor(bottom);
      width: anchor-size(width);
      height: anchor-size(height);
    }
  }
  ```

  The post does not define `--_speed` or `--ease-3`. It also "setup a mask system" so the dialog grows from the anchor's size "without distorting the dialog contents"; that mask code is not in the post ([demo](https://codepen.io/argyleink/pen/yyJaMaG), not exported).
- **Exit to anywhere:** "You could easily morph to a different element than the invoking element, `anchor()` doesnt care."
- **Uses the post lists:** dialogs, popovers, tooltips, page preview, fullscreen takeover, quick actions, disclosures, submenus, hovercards, and particles ("add some CSS `random()`").
- **The headline demo** is "a `popover=hint` + `interestfor`, no JS CSS transition" ([demo](https://codepen.io/argyleink/pen/PwzmJjj), demo code not exported).
- **Checklist, as the post gives it:** "1. Set the Anchor: `anchor-name` on the invoking element to create a spatial reference. 2. Set "Enter From" and "Exit To" styles with `anchor()`: Use `@starting-style` to declare the entry and exit properties relative to the anchor. 3. Transition." And "don't forget to gate the motion behind a `prefers-reduced-motion` media query."
- **Support of the parts (2026-10-17).** The position part is Baseline 2026 (above). `@starting-style` is Baseline 2024, newly available since 2024-08-06 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)). `interpolate-size` is Limited availability and experimental, Chrome 129 only ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size)), so elsewhere the size does not animate. `overlay` is Limited availability, Chrome 117 only, and "can only be set by the browser" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overlay)). `transition-behavior: allow-discrete` and the display and overlay transitions are covered in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md). `popover="hint"` and `interestfor` support and feature detection are in [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md#popoverhint-and-interestfor).
- **AIM versus view transitions.** The post's case against view transitions for this ("requires JS, is always a straight line and is not elegantly interruptible") is in [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md). ui-animation instead presents the View Transitions API as the no-library route across routes ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)).
- **Relation to "grow from the trigger".** ui-animation scales a popover from 0.96 to 1 with its `transform-origin` at the anchor side ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)); AIM starts from the trigger's actual box and size instead.
- app-ui grows a dialog "out of the button just pressed" with a script animation instead: "Switch the dialog's CSS fade and scale off while it morphs, or the CSS transition outranks the script animation" ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md)); its reference does it with Blendy ([../app-ui/reference/components/ui/feedback/dialog/dialog-morph.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/feedback/dialog/dialog-morph.ts)).

## Carousel buttons that move inside or outside

- **Anchor the generated buttons to the carousel** [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17: "These buttons are amazeballs with anchor positioning. Easily placed into nice areas, like how inner and outer are shown here. Browser provides the focus order!" Verbatim:

  ```css
  .carousel {
    overflow: auto;
    scroll-snap-type: x mandatory;
    anchor-name: --carousel;

    /* Scroll Buttons */
    &::scroll-button(right), 
    &::scroll-button(left) {
      position: fixed;
      position-anchor: --carousel;
    }

    &::scroll-button(right) {
      --_inner: center span-inline-start;
      --_outer: inline-end center;

      position-area: var(--_outer);
      content: 'arrow_forward' / 'Next';
    }
    
    &::scroll-button(left) {
      --_inner: center span-inline-end;
      --_outer: inline-start center;

      position-area: var(--_outer);
      content: 'arrow_back' / 'Previous';
    }
  }
  ```

- **Swap by available space with `calc()` in the container query** [nerdy.dev: A powerful container query](https://nerdy.dev/carousel-adaptive-anchor-positioning-with-calc-in-a-container-query), 2024-12-19. Outside buttons can end up off screen, so they move inside when the carousel is about as wide as its container. Verbatim:

  ```css
  .carousel {
    …
    
    &::scroll-button(right),
    &::scroll-button(left) {
      position-area: var(--_outer);
    }
    
    /* inner positioned arrows when carousel 
       is full width of viewport or container 
       note: 120px is both arrows plus their margins
    */
    @container (inline-size >= calc(100cqi - 120px)) {
      &::scroll-button(right),
      &::scroll-button(left) {
        position-area: var(--_inner);
      }
    }
  }
  ```

  "When the carousel (`inline-size`) is as wide (`>=`) as it's nearest container `100cqi` (which might be the viewport), then move the arrows safely inside." `calc(100cqi - 120px)` "is the size of the carousel's nearest container minus the combined size of the scroll buttons."
- **Support.** `::scroll-button()` is Limited availability and experimental, Chrome 135 only; MDN: buttons are generated only when `content` is not `none`, and the spec's `next` and `prev` arguments "are not currently supported in any browser" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::scroll-button)). The wishlist post (2024-12-17) said "use Canary for now". `@container` is Baseline widely available since 2025-08-14 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container)). The rest of the CSS carousel (markers, snapping) is in [SCROLL.md](SCROLL.md).

## Other uses

- **Animate a growing textarea** with anchoring: in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#fields-that-size-to-content).
- **Picker aligned to the chosen option** (Nice Select): anchor positioning plus a JS-written offset, in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md).

## Prove it

- **Anchor lookup:** a named `anchor()` resolves its explicit target; an unnamed call resolves the default anchor. Do not reject an explicit name merely because `position-anchor` is absent. [Name an anchor](#name-an-anchor-and-tether-to-it)
- **Names and shorthand:** replace obsolete `inset-area` with `position-area`; accept valid `position-try` fallback lists, and check whether resetting the order to `normal` is intended. [Flip when space runs out](#flip-when-space-runs-out)
- **Flip test:** narrow the viewport until the anchored element no longer fits above its anchor; it flips. If it stops flipping only at small widths, look for `center` in its `position-area` and switch to the spanning area (`top`).
- **Popover reset:** an anchored popover using `position-area` sits next to its anchor, not centered in the viewport (`margin: 0; inset: auto;`).
- **AIM:** open the dialog; it starts on the trigger's box and grows to its natural size in Chrome. Close it mid-animation; it reverses from where it is. With reduced motion on, it opens with no movement. In a browser without `interpolate-size` it still opens and closes, only without the size morph.
- **Carousel:** at a viewport wider than the carousel plus 120px the arrows sit outside; widen the carousel to the container's width and they move inside. Tab reaches both buttons.
