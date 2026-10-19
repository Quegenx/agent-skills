# Popover and dialog

Native overlays: `<dialog>` and the `popover` attribute, the top layer for modal dialogs and shown popovers, opening and closing them from HTML with invoker commands (`commandfor`, `command`), light dismiss with `closedby`, `popover="hint"` with `interestfor`, `interactivity: inert`, `CloseWatcher`, and copy-ready transition starter kits. The source is Adam Argyle's nerdy.dev; each section names its post and date. Support status comes from MDN (index data checked 2026-10-17) and webstatus.dev, stated once per feature with its URL. The mechanics behind the transitions (`@starting-style`, `allow-discrete`, `overlay`) are explained in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md); positioning an overlay against its trigger is in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md). Code is copied from the posts as written, including their `closedBy` casing (see [Invoker commands](#invoker-commands-commandfor-and-command)).

**Contents:** [Use them, and the top layer](#use-them-and-the-top-layer) · [Support](#support) · [A dialog](#a-dialog) · [A popover](#a-popover) · [Invoker commands](#invoker-commands-commandfor-and-command) · [Light dismiss with closedby](#light-dismiss-with-closedby) · [A component that puts itself in the top layer](#a-component-that-puts-itself-in-the-top-layer) · [popover="hint" and interestfor](#popoverhint-and-interestfor) · [interactivity: inert](#interactivity-inert) · [CloseWatcher](#closewatcher) · [Starter kits](#starter-kits) · [Dialog patterns](#dialog-patterns) · [Where other skills differ](#where-other-skills-differ) · [Prove it](#prove-it)

## Use them, and the top layer

- [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): "knowing your way around a `<dialog>` and a `[popover]` are table stakes. Otherwise, everyone else will be on top of you, and your wack `z-index` attempts will be defeated with a puny value of `1`." They are "common UI elements, with no JavaScript to download, and accessibility built in. **Use em**" (he links Hidde de Vries on the differences: [hidde.blog](https://hidde.blog/dialog-modal-popover-differences/)).
- A shown popover and a modal dialog opened with `showModal()` render in the top layer; `show()` opens a modeless dialog outside it. The post and our old line said both render there whenever shown. Top-layer boxes are laid out as if siblings of the root; the DOM element is not cloned. [MDN show()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/show), [showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal), [CSS Positioned Layout: Top layer](https://drafts.csswg.org/css-position-4/#top-layer). The floating-layer rule is already in [anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#stacking-without-z-index-wars).
- Why they are hard to animate (the browser toggles `display`, and they enter and leave the top layer) and the fix are in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md#why-top-layer-elements-are-hard-to-animate).
- Debugging: in Chrome DevTools the `#top-layer` node in the Elements panel is invented, so you can find these elements: "`#top-layer` is artificially created in the Elements panel, we just made it up because we felt we needed somewhere to find these mysterious elements that were on top of the page." ([nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update), 2024-04-28)
- There is no `:top-layer` selector. [nerdy.dev: Anchor Interpolated Morph (AIM)](https://nerdy.dev/anchor-interpolated-morphing) (2026-01-23) and [nerdy.dev: The CSS Podcast On Animating Popover And Dialog](https://nerdy.dev/the-css-podcast-on-animating-popover-and-dialog) (2024-06-13) write `:top-layer` but link the MDN glossary entry "[Top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)", a term, not a pseudo-class. Do not write it in a stylesheet.

## Support

Checked 2026-10-17. [nerdy.dev: Season 5 Of The CSS Podcast Has Begun](https://nerdy.dev/season-5-of-the-css-podcast-has-begun) (2024-06-06) said "Popover and dialog are both Baseline now"; that still holds:

| Feature | Status | Source |
|---|---|---|
| `<dialog>` | Baseline widely available (newly 2022-03-14, widely 2024-09-14) | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) |
| `:modal` | Baseline widely available (widely 2025-03-02) | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal) |
| `popover` attribute | Baseline 2024, newly available since April 2024, "some parts ... varying levels of support"; values `auto`, `hint`, `manual` | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover) |
| Popover API (the attribute plus `showPopover()`, `hidePopover()`, `togglePopover()`, `beforetoggle` and `toggle`) | Baseline 2025, newly available since January 2025, "Some parts of this feature may have varying levels of support". MDN's API overview page and its `popover` attribute page give different years (checked 2026-10-18); quote the page for the part you use | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) |
| `:popover-open` | Baseline 2024, newly available since April 2024 (Chrome 114, Firefox 125, Safari 17) | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:popover-open) |
| `commandfor` / `command` (invoker commands) | Baseline 2025, newly available since December 2025 (Chrome 135, Firefox 144, Safari 26.2) | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/commandForElement) |
| `closedby` | Limited availability: Chrome 134, Firefox 141, not Safari | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/closedBy) |
| `popover="hint"` | Limited availability: webstatus lists Chrome, Edge and Firefox, not Safari | [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/features/popover-hint/) |
| `interestfor` (interest invokers) | Limited availability: webstatus lists Chrome and Edge only | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using_interest_invokers) |
| `interactivity: inert` | Limited availability, experimental: Chrome 135 only | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interactivity) |
| `CloseWatcher` | Limited availability: Chrome 126, Firefox 149, not Safari | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher) |
| `inert` attribute | Baseline widely available (newly 2023-04-11, widely 2025-10-11) | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) |

The transition properties (`transition-behavior`, `overlay`, `@starting-style`) have their own table in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md#support).

## A dialog

[nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): "A `<dialog>` should be shown and hidden with buttons, one to show it can be in the page and one to close it should be inside the dialog."

```html
<button onclick="demo.showModal()">…</button>

<dialog id="demo">
  <header>
    <button title="Close" onclick="demo.close()">close</button>
  </header>
</dialog>
```

- "The `[open]` attribute is used to know when the dialog is open or closed."
- The post says light dismiss lets you skip the close button; see [closedby](#light-dismiss-with-closedby) for support and the fallback limitation before relying on outside clicks.
- With invoker commands the `onclick` handlers go away: [Invoker commands](#invoker-commands-commandfor-and-command).

## A popover

Same post: "a popover appears over everything else in the top layer. Light dismiss is the default, and keyboard / focus management is all done for you."

```html
<button popovertarget="pop">?</button>

<p id="pop" popover>An overlay with additional information.</p>
```

- "with a popover, the open state isn't an attribute, it's a css pseudo-class `:popover-open`."
- MDN's three values (popover page above): `auto` (light dismiss; closes other `auto` popovers unless nested; an empty value means `auto`), `hint` (does not close `auto` popovers; closes other non-ancestor hints), `manual` (no light dismiss; several can be open).

## Invoker commands: commandfor and command

[nerdy.dev: Have a dialog](https://nerdy.dev/have-a-dialog) (2024-11-14): a dialog "that can open and close without JS". The close button inside:

```html
<dialog id="dialog" closedBy="any">
  <p>Hi, I'm a dialog.</p>
  <button commandfor="dialog" command="close">
    Ok
  </button>
</dialog>
```

An open button:

```html
<button commandfor="dialog" command="show-modal">
  Open Dialog
</button>
```

- The post (2024-11) said invoker commands were "available in Canary" and that "eventually we'll be able to" write this. They are Baseline 2025 now (table above).
- `command` values, per [MDN's `<button>` page](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button): `show-modal`, `close`, `request-close` (fires a cancelable `cancel` event first), `show-popover`, `hide-popover`, `toggle-popover`, and custom values starting with `--`, which dispatch a `CommandEvent` on the target.
- The post writes `closedBy`; MDN spells the attribute `closedby` and the DOM property `closedBy`. Write `closedby` in HTML.

## Light dismiss with closedby

[nerdy.dev: closedBy=any](https://nerdy.dev/closedby-any) (2025-10-16): "a declarative way to add light-dismiss to a dialog":

```html
<dialog closedBy="any">
  <p>Hi, I'm a dialog.</p>
</dialog>
```

"And just like that, tapping or clicking outside the dialog will close it." He wrote it because "I haven't seen enough folks using it or talking about it."

- Values, per MDN (closedBy page above): `any` (light dismiss, a platform close action such as Esc, or a developer mechanism), `closerequest` (a platform action or a developer mechanism), `none` (only a developer mechanism). With the attribute absent or invalid, a dialog opened with `showModal()` behaves as `closerequest` and one opened any other way as `none`.
- **The source click fallback is not outside-only dismissal.** Its `dialog.nodeName === 'DIALOG'` test also matches clicks on the dialog's own padding. Native light dismiss checks pointer-down and pointer-up targets and dialog bounds. The post and our old recommendation treated that test as an equivalent fallback. Where `closedby` is unsupported, keep a close control and accept no outside-click dismissal unless an equivalent implementation has been verified. [HTML: Dialog light dismiss](https://html.spec.whatwg.org/multipage/interactive-elements.html#dialog-light-dismiss)

## A component that puts itself in the top layer

[nerdy.dev: VisBug v0.4.0 release notes](https://nerdy.dev/a-2024-visbug-update) (2024-04-28): VisBug's custom elements stopped fighting `z-index` with max-int tokens like these, which he no longer needs:

```css
:root {
  --layer-top: 2147483647;
  --layer-1: 2147483646;
  --layer-2: 2147483645;
  --layer-3: 2147483644;
  --layer-4: 2147483643;
  --layer-5: 2147483642;
}
```

Instead each element makes itself a manual popover and shows itself on connect:

```js
export class Handles extends HTMLElement {

  connectedCallback() {
    …
    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()
  }
}
```

"So each component adds itself to the top layer when it's added to the DOM." Firefox getting `popover` was the "feature reason to update VisBug".

## popover="hint" and interestfor

- [nerdy.dev: Anchor Interpolated Morph (AIM)](https://nerdy.dev/anchor-interpolated-morphing) (2026-01-23) opens with a "`popover=hint` + `interestfor`, no JS CSS transition" ([demo](https://codepen.io/argyleink/pen/PwzmJjj); the demo code is not exported). The morph itself is in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).
- Both are experimental-tier: `popover="hint"` is Limited availability and `interestfor` is Chrome and Edge only (table above). Feature-detect interest invokers the way MDN does: `Object.hasOwn(HTMLButtonElement.prototype, "interestForElement")`.
- The post gives no markup for either, so none is shown here.

## interactivity: inert

[nerdy.dev: Donut Inertness](https://nerdy.dev/donut-inertness) (2024-11-06): "Just as `@scope` brought selector donut scoping to CSS ..., so does `interactivity: inert;` bring **donut inertness**." ([CSSWG issue 10711](https://github.com/w3c/csswg-drafts/issues/10711), [demo](https://codepen.io/argyleink/pen/YzmJXvP), code not exported.)

- MDN: it "specifies whether an element and its descendant nodes are set to be inert". The post (2024-11) said to use "Canary with web experiments enabled"; it now ships in stable Chrome 135 without a flag, and only there (table above). Treat it as an enhancement; the HTML `inert` attribute is the Baseline route, and the cart pusher in [nerdy.dev: Have a dialog](https://nerdy.dev/have-a-dialog) pushes the page aside, "which kind of makes sense for showing what inert is doing".
- `@scope` itself is in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md).

## CloseWatcher

[nerdy.dev: The Closewatcher Api](https://nerdy.dev/the-closewatcher-api) (2024-08-21) is only a link to [Abdelrahman Awad's post](https://logaretm.com/blog/fix-your-annoying-popups-with-the-closewatcher-api/). What it does, from MDN (CloseWatcher page above): it "allows a custom UI component with open and close semantics to respond to device-specific close actions in the same way as a built-in component" (MDN's examples: "the Esc key", or "Android might use the back button"). `requestClose()` fires `cancel` and, unless that is prevented, `close`; `close()` fires `close` without `cancel`; `destroy()` stops listening. Limited availability, so `<dialog>` and `popover` remain the route that works everywhere.

## Starter kits

All of these use the ingredients explained in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md). Where `overlay` or a transitionable `display` is missing, the overlay still opens and closes, with an instant exit. The durations (0.5s, 1s) are the posts' demo values, not timing advice: see [Where other skills differ](#where-other-skills-differ).

### Popover with a fading backdrop, no JS

[nerdy.dev: Steal this popover code](https://nerdy.dev/steal-this-popover-starter-kit) (2024-03-15), "optimized for you to steal" ([demo](https://codepen.io/argyleink/pen/JjzqXee)):

```html
<button popovertarget="my-tooltip">?</button>
```

```html
<p id="my-tooltip" popover>tip</p>
```

```css
[popover] {
  &, &::backdrop {
    transition:
      display 0.5s allow-discrete,
      overlay 0.5s allow-discrete,
      opacity 0.5s;
    opacity: 0;
  }

  &::backdrop {
    background: black;
  }

  &:popover-open {
    opacity: 1;

    &::backdrop {
      opacity: 0.5;
    }
  }

  @starting-style {
    &:popover-open,
    &:popover-open::backdrop {
      opacity: 0;
    }
  }
}
```

How it reads, from the post:
1. Popovers and their backdrops sit at opacity `0` with a transition on opacity.
2. `display` and `overlay` get the opacity's duration and `allow-discrete` ([how allow-discrete works](TRANSITIONS-AND-STARTING-STYLE.md#transition-behavior-allow-discrete)): "Display and entering/exiting the top-layer will now only change after opacity has finished fading".
3. `:popover-open` sets opacity `1` and the backdrop to `0.5`.
4. `@starting-style` gives the entry its from-state: "This will then transition from the starting style, to the popover showing styles."
5. "JS: Nothing to see here."

### One crossfade for every dialog and popover

[nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): "Combining these can feel like an incantation, but that makes it great copy and paste" ([demo](https://codepen.io/argyleink/pen/zYbQBOm)):

```css
/* enable transitions, allow-discrete, define timing */
[popover], dialog, ::backdrop {
  transition: display 1s allow-discrete, overlay 1s allow-discrete, opacity 1s;
  opacity: 0;
}

/* ON STAGE */
:popover-open,
:popover-open::backdrop,
[open],
[open]::backdrop {
  opacity: 1;
}

/* OFF STAGE */
/* starting-style for pre-positioning (enter stage from here) */
@starting-style {
  :popover-open,
  :popover-open::backdrop,
  [open],
  [open]::backdrop {
    opacity: 0;
  }
}
```

"While this code is effective and terse, it's often not enough customization if you want to present and dismiss dialogs differently than you do popovers. Or make the entry animation different then the exit." The two kits below separate them.

### A dialog that enters from below and exits upward

Same post ([demo](https://codepen.io/argyleink/pen/OJeWWNZ)). Why each part is there, in his words:
1. "Two parts need animation: the `<dialog>` itself and its `::backdrop`."
2. "When a dialog is shown, `display: none` is changed to `display: block` and `transition-behavior` enables timing this change with our animation."
3. A modal dialog enters the top layer; `overlay` times its removal. The post called this "cloned into the top layer"; use the [top-layer correction](#use-them-and-the-top-layer).
4. "The `[open]` attribute is used to know when the dialog is open or closed. `@starting-style` is used during the first render as starting styles."

```css
dialog {
  /* Exit Stage To */
  transform: translateY(-20px);

  &, &::backdrop {
    transition:
      display 1s allow-discrete,
      overlay 1s allow-discrete,
      opacity 1s ease,
      transform 1s ease;

    /* Exit Stage To */
    opacity: 0;
  }

  /* On Stage */
  &[open] {
    opacity: 1;
    transform: translateY(0px);

    &::backdrop {
      opacity: 0.8;
    }
  }

  /* Enter Stage From */
  @starting-style {
    &[open],
    &[open]::backdrop {
      opacity: 0;
    }

    &[open] {
      transform: translateY(20px);
    }
  }
}
```

The exit goes to `-20px` and the entry comes from `+20px`, so open and close move in one direction. "It also demonstrates the interruptible nature of a CSS transition, so a user can close it anytime they want and always see a smooth interface."

### A popover that rises in

Same post ([demo](https://codepen.io/argyleink/pen/JjzqXee)):

```css
[popover] {
  &, &::backdrop {
    transition:
      display 0.5s allow-discrete,
      overlay 0.5s allow-discrete,
      opacity 0.5s,
      transform 0.5s;

    /* Exit Stage To */
    opacity: 0;
  }

  /* On Stage */
  &:popover-open {
    opacity: 1;

    &::backdrop {
      opacity: 0.5;
    }
  }

  /* Enter Stage From */
  @starting-style {
    &:popover-open,
    &:popover-open::backdrop {
      opacity: 0;
    }

    &:popover-open {
      transform: translateY(10px);
    }
  }
}
```

### Sharing the exit with everything else

The `*`-wide enter and exit transitions in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md#enter-and-exit-stage-for-any-element) hide dialogs and popovers through `dialog:not(:modal)` and `&[popover]:not(:popover-open)`. The dialog selector is for modal-only use; it also hides an open modeless dialog. That post's update (quoted there) says backdrops and `overlay` need more, and for "a less experimental snippet that does fully transition dialogs and popovers" points to the crossfade kit above ([demo](https://codepen.io/argyleink/pen/zYbQBOm)).

More: the [Dialog Starter notebook](https://nerdy.dev/notebook/dialog-starter.html), his [Dialog CodePen collection](https://codepen.io/collection/wkKogp), and the Pop n' Lock Dialog Mini Web Machine video, which covers "`<dialog>` basics", "`top-layer`, `transition-behavior` and `overlay` explained" and "how to transition a `<dialog>`" ([nerdy.dev: Pop N Lock Dialog Mini Web Machine](https://nerdy.dev/pop-n-lock-dialog-mini-web-machine), 2024-07-31).

## Dialog patterns

[nerdy.dev: Have a dialog](https://nerdy.dev/have-a-dialog) (2024-11-14) gives three dialogs that "use CSS transitions for interruptible user experience and Open Props for the values". The demos are CodePen only and their code is not exported, so only the ideas are here:
- **Push it real good:** "Scale back the page, dim the background to set the mood, and slide in the modal contents" ([demo](https://codepen.io/argyleink/pen/xxvaxag)).
- **Flyout panel:** "Classic fly out from the side, but is elegantly inset, and implements light-dismiss and an adaptive light/dark mouse visual over the `::backdrop`" ([demo](https://codepen.io/argyleink/pen/jOgxGmX)).
- **Cart page pusher:** "pushes the whole page out of the way (which kind of makes sense for showing what inert is doing), and reveals a sidenav that wants to have a good total at the bottom" ([demo](https://codepen.io/argyleink/pen/OJKGXRY)).

## Where other skills differ

- **The owner's app builds overlays on headless primitives, not native elements.** [app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md#the-backdrop-and-the-dialog) says "Keep every overlay mounted and pass `open`", and [app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md) has "A headless primitive owns focus, keyboard and dismissal". In app-ui "A dialog that opens something new (create, search, settings) grows out of the button just pressed" with a script animation ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md#grow-from-the-button-that-opened-it)), where AIM does it in CSS. Use app-ui for the owner's product; this file is the no-library route.
- **Timing.** The starter kits run 0.5s (popover) and 1s (dialog). [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#duration-by-element) gives "dropdown, popover | 150-220 ms" and "modal, sheet, drawer | 300-400 ms". The posts' values are demo pacing; ui-animation's are recommendations.
- **The library analogue:** [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#modals-sheets-popovers) shows a Base UI popup animated with `data-[starting-style]` and `data-[ending-style]` attributes; the kits above do the same with native `@starting-style` and `:popover-open` / `[open]`.

## Prove it

- `grep -n 'z-index: 2147483647\|z-index: 9999' -r src/`: a floating layer that needs one should be a `popover` or a modal `<dialog>` instead ([Use them](#use-them-and-the-top-layer)).
- With native light dismiss, outside clicks dismiss and clicks on the dialog's own padding do not; without support, the close control still works. Do not use the removed target-name test as an outside-only fallback. [Light dismiss](#light-dismiss-with-closedby)
- Every button with `commandfor` points at an existing `id`, and its `command` is one of `show-modal`, `close`, `request-close`, `show-popover`, `hide-popover`, `toggle-popover` or a `--custom` value.
- No stylesheet contains `:top-layer` (`grep -rn ':top-layer' src/` returns nothing).
- In DevTools, confirm modal dialogs and shown popovers appear under `#top-layer`; a modeless `show()` dialog remains outside it. [Top-layer distinction](#use-them-and-the-top-layer)
- Open and close each overlay in Chrome, Firefox and Safari: it must open and close everywhere; a smooth exit is expected only where `overlay` and a transitionable `display` exist (see [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md#support)).
- `interestfor`, `popover="hint"` and `interactivity: inert` sit behind a feature test or degrade to something usable when unsupported.
