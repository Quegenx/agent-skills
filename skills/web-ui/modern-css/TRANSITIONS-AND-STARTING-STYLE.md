# Transitions and @starting-style

Entry and exit effects written as CSS transitions: `@starting-style` for where an element enters from, `transition-behavior: allow-discrete` so `display` (and `content-visibility`) wait for the exit, `overlay` so a top-layer element stays rendered while it leaves, `[hidden]` as a shared exit state, `<details>` that open and close smoothly with `::details-content` and `interpolate-size`, `calc-size()`, staggered entries, and removing a node once its transitions finish with `getAnimations()`. The source is Adam Argyle's nerdy.dev; each section names its post and date. Support status comes from MDN (index data checked 2026-10-17) and webstatus.dev, stated once in [Support](#support). The ready-made dialog and popover kits are in [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md#starter-kits). Code is copied from the posts; the "👈" markers in the originals are dropped, a dash in one quoted sentence is replaced with a colon, and the one broken snippet is marked where it is fixed. Durations, curves and stagger rules in general are [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md)'s job; this file covers the CSS mechanics.

**Contents:** [Support](#support) · [Why top-layer elements are hard to animate](#why-top-layer-elements-are-hard-to-animate) · [@starting-style](#starting-style) · [transition-behavior: allow-discrete](#transition-behavior-allow-discrete) · [overlay](#overlay) · [Enter and exit stage for any element](#enter-and-exit-stage-for-any-element) · [Remove a node after its exit](#remove-a-node-after-its-exit) · [Opt in to motion](#opt-in-to-motion) · [details that open and close](#details-that-open-and-close) · [An exclusive accordion](#an-exclusive-accordion) · [interpolate-size and calc-size()](#interpolate-size-and-calc-size) · [Staggered entries](#staggered-entries) · [The same pattern elsewhere](#the-same-pattern-elsewhere) · [Where other skills differ](#where-other-skills-differ) · [Prove it](#prove-it)

## Support

Checked 2026-10-17. Where a post's claim has gone stale, the section says what the post said.

| Feature | Status | Source |
|---|---|---|
| `@starting-style` | Baseline 2024, newly available since August 2024 (Chrome 117, Firefox 129, Safari 17.5) | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) |
| `transition-behavior` | Baseline 2024 (web-features), newly available since 2024-08-06 (Chrome 117, Firefox 129, Safari 17.4). MDN's page banner shows Limited availability because Firefox can't transition `display` (or `content-visibility`); Chrome 117 and Safari 18 can. Expect a smooth `display` exit in Chrome and Safari only. | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior) |
| `overlay` | Limited availability, experimental: Chrome and Edge 117 only | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overlay) |
| `::details-content` | Baseline 2025, newly available since September 2025 (Chrome 131, Firefox 143, Safari 18.4) | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content) |
| `<details name>` (exclusive accordion) | Baseline 2024, newly available since 2024-09-03 (Chrome 120, Firefox 130, Safari 17.2) | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) |
| `interpolate-size` | Limited availability, experimental: Chrome and Edge 129 only | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size) |
| `calc-size()` | Limited availability, experimental: Chrome and Edge 129 only | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-size) |
| `Element.getAnimations()` | Baseline widely available (newly July 2020) | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) |
| `sibling-index()` | Baseline 2026, newly available since August 2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index) |
| `:popover-open`, `:modal`, `<dialog>`, `popover` | See [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md#support) | |

So on the top layer: the entry (`@starting-style`) works in all three engines; the exit of a dialog or popover is smooth only where `overlay` and a transitionable `display` exist (Chrome), and elsewhere the element leaves at once.

## Why top-layer elements are hard to animate

[nerdy.dev: Steal this popover code](https://nerdy.dev/steal-this-popover-starter-kit) (2024-03-15): "1. the browser toggles `display` 2. the elements enter and exit the top layer (aka: the DOM penthouse)". [nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20): "Dialog and popover both have display toggled via the browser." [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19) names the three answers: "there's a few new CSS properties, for the full *interruptible* CSS transition user experience: `transition-behavior`, the `@starting-style` rule, and `overlay`." Each is below.

## @starting-style

[nerdy.dev: Starting Style Everything](https://nerdy.dev/starting-style-everything) (2024-05-15): "Normally `@keyframes` would be used for this technique, but with `@starting-style` **we can transition**."

```css
* {
  transition: opacity .5s ease-in;
  @starting-style { opacity: 0 }
}
```

It triggers on:
- page load
- "inserted into the DOM"
- "going from display `none` to a visible display value"

From [nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20):
- "`@starting-style` is describing the **off stage starting place**." The resting place on stage is the element's normal style (by default `opacity: 1`).
- A property added to the starting style must also be added to the `transition` list, "so it interpolates":

```css
* {
  transition: 
    opacity .5s ease-in, 
    scale   .5s ease-in;

  @starting-style { 
    opacity: 0; 
    scale: 1.1; 
  }
}
```

- He starts the entry scaled up, "so it scales down into the resting place. Like it floated in from above", which keeps entry and exit (scaled down, below) distinguishable.

From MDN (`@starting-style` page above): it can be nested in a rule or written standalone. A standalone block and the "original rule" "have the same specificity. To ensure that starting styles get applied, include the `@starting-style` at-rule after the 'original rule'. If you specify the `@starting-style` at-rule before the 'original rule', the original styles will override the starting styles." The posts nest it as the last block of the rule.

## transition-behavior: allow-discrete

[nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20): "If you set `display: none` on an element, none of the transitions have time to run before the browser immediately removes it from the stage. Adding `transition-behavior` `allow-discrete` allows you to specify a duration of time that should pass before applying the `display: none` change."

- Give `display` the same duration as the visible transition ([nerdy.dev: Steal this popover code](https://nerdy.dev/steal-this-popover-starter-kit), 2024-03-15): `allow-discrete` "signals these properties toggle any new values **after** the duration has run".
- It can be a longhand (`transition-behavior: allow-discrete;`) or a keyword per property in the shorthand (`display 0.5s allow-discrete`); the posts use both.
- MDN (page above) on how the flip lands: discrete properties normally flip halfway, but to or from `display: none` (or `content-visibility: hidden`) "the browser will flip between the two values so that the transitioned content is shown for the entire animation duration": `none` to `block` flips at 0%, `block` to `none` at 100%.
- MDN's cross-browser habit: declare `transition` twice, first without `allow-discrete`, so browsers without `transition-behavior` still transition the other properties:

```css
.card {
  transition: all 0.25s;
  transition: all 0.25s allow-discrete;
}
```

- Exit stage needs `display: none` to happen: "The only catch is **you have to use `display: none` to kick something off stage.**" (2024-05-20 post.)

## overlay

From MDN (overlay page above): `overlay` "specifies whether an element appearing in the top layer (for example, a shown popover or modal `<dialog>` element) is actually rendered in the top layer". It "can only be set by the browser"; authors only add it to the transition list, which "causes its removal from the top layer to be deferred so it can be animated instead of disappearing immediately", and it needs `allow-discrete`. Without it, "in more complex cases ... the element [is] removed from the overlay too quickly". It is Chrome-only today (see [Support](#support)), so a transition list with it degrades to an instant exit elsewhere.

An excerpt of MDN's own example (its `html` font rule and backdrop rules left out), which also shows the standalone `@starting-style` placed after the rule it overrides (comments as on MDN):

```css
[popover]:popover-open {
  opacity: 1;
  transform: scaleX(1);
}

[popover] {
  font-size: 1.2rem;
  padding: 10px;

  /* Final state of the exit animation */
  opacity: 0;
  transform: scaleX(0);

  transition:
    opacity 0.7s,
    transform 0.7s,
    overlay 0.7s allow-discrete,
    display 0.7s allow-discrete;
  /* Equivalent to
  transition: all 0.7s allow-discrete; */
}

/* Needs to be included after the previous [popover]:popover-open
   rule to take effect, as the specificity is the same */
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scaleX(0);
  }
}
```

The posts' versions of this, with backdrops, are the [starter kits](POPOVER-AND-DIALOG.md#starter-kits).

## Enter and exit stage for any element

[nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects) (2024-05-20) builds "a purely **CSS transition** strategy for toggling `display: none` or first render" ([demo](https://codepen.io/argyleink/pen/qBGOamz)). "Interruptible transitions > keyframe animations." What it gives:
1. "Shared styles for showing/hiding elements with `display: none`"
2. "Custom entry and exit effects"
3. "Interruptible motion"
4. "Easy potential for staggering"

The final snippet:

```css
@layer {
  * {
    @media (prefers-reduced-motion: no-preference) {
      transition: 
        opacity .5s ease-in, 
        scale   .5s ease-in,
        display .5s ease-in;
      transition-behavior: allow-discrete;
    }

    @starting-style { 
      opacity: 0; 
      scale: 1.1; 
    }

    &[hidden],
    dialog:not(:modal), 
    &[popover]:not(:popover-open) { 
      opacity: 0;
      scale: .9;
      display: none !important; 
      transition-duration: .4s;
      transition-timing-function: ease-out;
    }
  }
}
```

How each part earns its place, from the post:
- **`[hidden]` is the exit state.** "I chose to lean into the browser provided attribute that sets `display: none`, the `[hidden]` attribute!" "So when any element has been given the `[hidden]` attribute, we describe the **off stage styles**."
- **`display: none !important`.** "The browser provides that automatically for the attribute, but it's specificity is weak. If elements have any custom display type set, none isn't applied and the effect is lost. This also means you could employ your own type of flag here."
- **Exits are quicker.** ".4s with an `ease-out` effect because I think it's nice when exit animations happen slightly faster than entry animations." Entry is .5s `ease-in`.
- **The dialog selector is modal-only.** The source uses `:modal` to mean visible, but an open modeless dialog also matches `dialog:not(:modal)` and would be hidden by this snippet. Use it only where dialogs open modally; see the [official modal/modeless distinction](POPOVER-AND-DIALOG.md#use-them-and-the-top-layer). The popover branch uses `:popover-open`.
- **The anonymous `@layer { }`** keeps a `*` rule "easy to override" and quiet in DevTools: "a demoted anonymous layer is weaker than unlayered styles or can be imported into another layer the author knows is a weaker layer", and "the layer drops the styles in the styles pane underneath the other styles". "You could def get away without this `@layer`." Layers in general are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md).
- **Scope it in real use.** "I also think it'd make sense to scope it to a class or something, there's probably some scenarios where the results aren't desirable for every element. But conceptually targetting everything sure is fun."
- **Why not view transitions:** "View transitions are a good option for some of what this solves, but they aren't interruptible. Also not as easy to integrate with dialog and popovers." See [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md).
- **Backdrops are not covered.** His update: "If you want to transition the `<dialog>` `::backdrop` you're going to need to add some styles. You may also need to transition `overlay`." The full dialog and popover version is the crossfade kit in [POPOVER-AND-DIALOG.md](POPOVER-AND-DIALOG.md#one-crossfade-for-every-dialog-and-popover).

## Remove a node after its exit

Same post. Once an element has transitioned to `display: none`, wait for every running transition before removing it:

```js
function onTransitionsEnded(node) {
  return Promise.allSettled(
    node.getAnimations().map(animation =>
      animation.finished))
}
```

```js
async () => {
  node.hidden = true
  await onTransitionsEnded(node)
  node.remove()
}
```

- Pitfall, from his second update: "I'd tried this in my testing and found the array to be empty. BUT, later found out that it's because none of the transitions are running. Once they're kicked off, `getAnimations()` returns each transition PLUS a `.finished` promise." Change the state (`node.hidden = true`) first, then call it.
- MDN (getAnimations page above): the returned array "includes CSS Animations, CSS Transitions, and Web Animations".

## Opt in to motion

The enter and exit post puts its transitions inside `@media (prefers-reduced-motion: no-preference)` and leaves `@starting-style` outside it ([nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20: "But, don't forget, **be mindful**, we're not just cross fading anymore"):

```css
* {
  @media (prefers-reduced-motion: no-preference) {
    transition: 
      opacity .5s ease-in, 
      scale   .5s ease-in;  
  }

  @starting-style { 
    opacity: 0; 
    scale: 1.1; 
  }
}
```

The `<details>` boilerplate below gates `interpolate-size` the same way. [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#reduced-motion) calls the opposite pattern, a global `prefers-reduced-motion: reduce` override, "a blunt fallback" and asks for a deliberate reduced version of each animation.

## details that open and close

[nerdy.dev: Open & Close Transitions with <details>](https://nerdy.dev/open-and-close-transitions-for-the-details-element) (2024-09-25) and [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19). The element "needs to transition to `height: auto` from `height: 0px` and a way to target the slotted content it internally uses": `interpolate-size` for the height and `::details-content` for the selector.

```html
<details>
  <summary>Show disclosed content</summary>
  <p>…</p>
</details>
```

The boilerplate:

```css
details {
  inline-size: 50ch;

  @media (prefers-reduced-motion: no-preference) {
    interpolate-size: allow-keywords;
  }

  &::details-content {
    opacity: 0;
    block-size: 0;
    overflow-y: clip;
    transition: content-visibility 1s allow-discrete, opacity 1s, block-size 1s;
  }

  &[open]::details-content {
    opacity: 1;
    block-size: auto;
  }
}
```

- "Take special note to `transition: content-visibility 1s allow-discrete`".
- "technically, we're not transitioning the `<details>` element, **we're transitioning the slotted content that goes inside it**."
- It "needs a `max-inline-size` (or placement inside a grid) to prevent the content from being as wide as the page"; the post uses `inline-size: 50ch`.
- What works where: the post (2024-09) said the effect "needs `transition-behavior`, `::details-content` and `interpolate-size` to work". Today `::details-content` is Baseline 2025, `interpolate-size` is Chromium only, and transitioning `content-visibility` is missing in Firefox (see [Support](#support)).
- 1s is the demo duration. More styled versions: [nerdy.dev: Nice Details](https://nerdy.dev/nice-details) (2025-04-25), "Beautiful `<details>` are possible ... Lots of fun micro interactions" ([demo](https://codepen.io/argyleink/pen/MYYpVjJ), code not exported), and the [accordion notebook](https://nerdy.dev/notebook/accordion.html).
- Next to [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#height-and-accordions), which animates grid rows `0fr` to `1fr` or uses Motion's `height: "auto"`, this is a third, native option for a `<details>`.

## An exclusive accordion

[nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19): a shared `name` on several `<details>` makes them close each other, "Very much like a radio group." Fixed snippet: the post's second element has `name="linked-disclosure>` with no closing quote, which breaks the markup; the quote is added here ([MDN `<details>` `name`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)).

```html
<details name="linked-disclosure">
  <summary>Show disclosed content</summary>
  <p>…</p>
</details>

<!-- name="linked-disclosure" connects these together -->

<details name="linked-disclosure">
  <summary>Show disclosed content</summary>
  <p>…</p>
</details>
```

## interpolate-size and calc-size()

[nerdy.dev: CSS interpolate-size to the rescue](https://nerdy.dev/interpolate-size) (2024-09-25): "Opt your whole site into transitioning keywords. This is definitely something that will quickly make it into CSS resets."

```css
:root {
  interpolate-size: allow-keywords;
}
```

His example hides a password field until the username is valid ("the designer wants to reduce visual noise during sign in"):

```css
.password {
  transition: 
    height .3s var(--ease-3),
    opacity .3s var(--ease-3);
}
```

```css
.username:not(:has(:user-valid)) + .password {
  height: 0;
  opacity: 0;
  overflow: clip;
}
```

"As soon as the username field is valid, `height: 0` will stop applying and the password field will transition to its natural `height: auto`." (The post does not define `--ease-3`. `:user-valid` is Baseline widely available since 2026-05-02, newly available since 2023-11-02, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-valid). Its support with `:has()` and the no-`interpolate-size` fallback are in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#reveal-a-field-once-the-previous-one-is-valid).)

From MDN (interpolate-size page above):
- Values: `allow-keywords` and `numeric-only`, the default, where "intrinsic size values cannot be interpolated". One end must be a `<length-percentage>`; it "does not enable animating between two intrinsic size values".
- It is inherited, so `:root` turns it on for the document and a container limits it to that subtree.
- Why it is opt-in: it "cannot be enabled by default across the web because many sites in the wild use stylesheets that assume intrinsic size values cannot be animated".
- `calc-size()` values can also be interpolated, and "including `calc-size()` in a property value automatically applies `interpolate-size: allow-keywords` to the selection", but MDN calls `interpolate-size` "the preferred solution for enabling intrinsic size animations in most cases". [nerdy.dev: CSS functions in the works](https://nerdy.dev/css-values-5-is-lookin-hot) (2024-08-26) lists `calc-size()` among the CSS Values 5 drafts with no example; it is still Chromium only.

The size morph from a trigger (anchor-interpolated morphing) combines `interpolate-size` with `@starting-style`; it lives in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).

## Staggered entries

- [nerdy.dev: 4 CSS Features Every Front-End Developer Should Know In 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026) (2026-01-07): "Stagger enter stage animations easily by combining with `@starting-style`!" "A nice trick is to subtract 1 so the **first element starts immediately**":

```css
li {
  transition: opacity .3s ease;
  transition-delay: calc((sibling-index() - 1) * 100ms);

  @starting-style {
    opacity: 0;
  }
}
```

  The post said `sibling-index()` was "available in stable Chrome and Safari"; it is Baseline 2026 now (see [Support](#support)). The function itself and `sibling-count()` are in [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md#sibling-index-and-sibling-count).
- An index variable does the same without `sibling-index()`. [nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation) (2025-06-13) introduces the games list from the right on load, "providing the hint that there's directionality in this games list, hinting at scroll":

```css
.scroll--content .game {
  @media (prefers-reduced-motion: no-preference) {
    transition: transform 1s var(--ease-spring-2);
    transition-delay: calc(var(--i) * .05s);

    @starting-style {
      transform: translateX(100vw) translateZ(calc(var(--i) * -1px));
    }
  }
}
```

- 100ms per item with no cap is the post's demo value; [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing) keeps a whole stagger "under about 500 ms", list items "30-60 ms apart", and caps how many items animate. Apply that cap when copying.

## The same pattern elsewhere

- **The customizable `<select>` picker** exits with `display` and `overlay` on `allow-discrete` and enters from `@starting-style` ([nerdy.dev: Custom <select> boilerplate + transitions](https://nerdy.dev/custom-select-with-transitions-boilerplate), 2024-09-19). The boilerplate is in [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md).
- **Anchor-interpolated morphing** uses `@starting-style` for "enter stage from" styles taken from the trigger's box: [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).

## Where other skills differ

- **Easing direction.** The post enters on `ease-in` and exits on `ease-out`. [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#curves) eases arrivals out and exits in (its `exit` curve "accelerates away"); the same page records kciter's view that an element that appeared with ease-in "should disappear with ease-out", which matches the post. Both agree the two directions need different curves.
- **Exit length.** The post's exit is .4s against a .5s entry. [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing) wants "Entrances run 30-50% longer than exits"; .5s over .4s is 25% longer.
- **Durations.** The posts' 0.5s and 1s are demo values; ui-animation's [Duration by element](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#duration-by-element) table is the recommendation.
- **Load-in motion.** The Switch load-in animates on first render; app-ui does not ("Nothing animates on first render that the user didn't cause", [app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)). That is the owner's rule for the product UI.
- **interpolate-size scope.** app-ui sets `interpolate-size: allow-keywords` on `:root` as an enhancement ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)), like the interpolate-size post; the `<details>` post sets it per element inside `prefers-reduced-motion: no-preference`. [modern-css RESPONSIVE.md](RESPONSIVE.md#enhancements-not-the-base) wants it "Inside `@supports` only".
- **Accordions.** The owner's landing pages build each accordion row as "the question as a button inside a heading" and "the answer as a region", opening "on springs", with "One row open at a time per list" ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#questions)), not `<details name>`.
- **Library route.** The owner's app animates headless popups with `data-[starting-style]` attributes ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#modals-sheets-popovers), [app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)); native `@starting-style` is the no-library equivalent.

## Prove it

- Every `@starting-style` property also appears in that element's `transition` list (`grep -n -A6 '@starting-style' src/**/*.css` and compare).
- Every standalone (unnested) `@starting-style` block comes after the rule it overrides in source order.
- Every `transition` that lists `display` or `content-visibility` has `allow-discrete` (per property or as `transition-behavior`), and every top-layer transition lists `overlay`.
- A `[hidden]` exit rule uses `display: none !important`; test it on an element with its own `display: flex` or `grid` and confirm it still hides.
- The shared `dialog:not(:modal)` exit is used only for modal dialogs; any modeless dialog opened with `show()` remains visible under its own styles. [Enter and exit stage](#enter-and-exit-stage-for-any-element)
- Toggle each element in Chrome, Firefox and Safari: entry animates everywhere, nothing is stuck visible or invisible, and an exit that is instant (Firefox, Safari for top-layer elements) still ends hidden.
- Code that removes a node after an exit sets the state before calling `getAnimations()`, and logs a non-empty array during the exit.
- With reduced motion turned on in the OS, elements still appear and disappear, without transitions.
- `<details name>` groups: opening one closes the others; every `name="` attribute has its closing quote.
- Staggers: the last item's delay stays within the cap in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing).
