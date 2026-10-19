# View Transitions

View transitions inside a page (`document.startViewTransition()`) and across pages (`@view-transition`), naming, classes and types, text and composer morphs, 3D perspective, the swoop trick, freezing a transition to inspect it, and where view transitions fall short, from Adam Argyle's [nerdy.dev](https://nerdy.dev). Each fact is tagged with its post and date; each feature's status is from MDN, checked October 2026. Code is copied from the posts; the one snippet that doesn't run as written (the alias) is corrected below and says so. The motion rules for shared elements, and the Motion `layoutId` route, are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail). React's `<ViewTransition>` component, `addTransitionType` and Next.js `transitionTypes` are in [ui-animation REACT-VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/REACT-VIEW-TRANSITIONS.md).

**Contents:** [Same-document transitions](#same-document-transitions) · [Cross-document transitions](#cross-document-transitions) · [Names, classes and types](#names-classes-and-types) · [Text replace transitions](#text-replace-transitions) · [Morphs and other effects](#morphs-and-other-effects) · [The swoop](#the-swoop) · [Debugging](#debugging) · [Where view transitions fall short](#where-view-transitions-fall-short) · [Prove it](#prove-it)

## Same-document transitions

- **FLIP for free:** "In ~1 minute you can have FLIP-like animation on your page with View Transitions" ([nerdy.dev: Easy Flippin Transition](https://nerdy.dev/easy-flippin-transition), 2022-12-12). Status: `document.startViewTransition()` is Baseline 2025, newly available since October 2025 (Chrome 111, Firefox 144, Safari 18; [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)).

```js
document.startViewTransition(() => {
  // modify the dom
  // - hide stuff
  // - move stuff
  // - whatever!
})
```

  MDN: the callback runs once the API has snapshotted the page; when its promise fulfills, the transition begins in the next frame, and if it rejects, the transition is abandoned. The method also takes an options object, `startViewTransition({ update, types })`: `update` is the same callback, and `types` is "an array of strings representing the types applied to the view transition" for styling or logic per kind of transition (options parameter: Chrome 125, Firefox 147, Safari 18.2, browser-compat-data `api.Document.startViewTransition.options_parameter`).
- **Don't alias it unbound.** The joke note ([nerdy.dev: View Transition Alias](https://nerdy.dev/view-transition-alias), 2024-01-17) writes:

```js
document.startViewTransition
// too much to write

// makes alias: short for transition
const txn = document.startViewTransition

txn(async () => {
  // much better
})
```

  `txn` loses its `this` (`document`). MDN on `bind()`: "A common mistake for new JavaScript programmers is to extract a method from an object, then to later call that function and expect it to use the original object as its `this`"; "Creating a bound function from the function, using the original object, neatly solves this problem" ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)). Corrected, with `.bind(document)` as the only change:

```js
const txn = document.startViewTransition.bind(document)

txn(async () => {
  // much better
})
```

- **Content changes inside a control:** a GUI Challenge video shows "how view transitions can upgrade the experience of changing the `innerHTML` of a button by animating the change" ([nerdy.dev: Thinking On Ways To Solve Morphing Buttons](https://nerdy.dev/thinking-on-ways-to-solve-morphing-buttons), 2023-07-13; [demo](https://gui-challenges.web.app/morphing-button/dist/)).
- **A state the browser would set anyway:** for a view transition on `:checked`, today's JS calls `preventDefault()` then `startViewTransition()` "just to reapply the `:checked` state that it would have done naturally" ([nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17; [code](https://codepen.io/argyleink/pen/BaGrXmv) not exported).

## Cross-document transitions

- **Crossfade every page navigation:** "This is the easiest snippet to add to your site, with no downsides" ([nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025), 2025-01-19). Link clicks get the default crossfade; "If the browser doesn't support it, it continues as it always has". Status: `@view-transition` is Limited availability, Chrome and Edge 126 and Safari 18.2, no Firefox ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)).

```css
@view-transition {
  navigation: auto;
}
```

- **Then name what the pages share** (same post): "A great place to start enhancing this page transition experience is to identify elements commonly found across pages, and give them a `name`". Status: `view-transition-name` Baseline 2025, newly available since October 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)).

```css
.nav {
  view-transition-name: --nav;
}

.sidenav {
  view-transition-name: --sidenav;
}
```

- **Different elements can morph into each other:** "By giving an `<a>` and an `<h1>` the same `view-transition-name` on two different pages, the browser will move and resize the page 1 element to the location and size of the page 2 element, making it look like a morph."

```css
a, h1 {
  view-transition-name: --morphy;
}
```

  MDN: a name "must be unique for each rendered element taking part in the view transition. If two rendered elements have the same view-transition-name at the same time, the ViewTransition.ready Promise will reject and the transition will be skipped." The post gives the two elements the name "on two different pages".
- The post's further examples are [Bramus's](https://view-transitions.chrome.dev/), and its [full page animations starter](https://codepen.io/argyleink/project/editor/ZBnpqB).

## Names, classes and types

- **Classes and types for many elements at once** ([nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers), 2026-04-26): "With `view-transition-class` you can target massive collections of DOM nodes with a single animation rule, while JS View Transition Types let you programmatically direct 'forward' or 'backward' contextual motion" (the post's heading: "SPA-like routing animations"). Status: `view-transition-class` Baseline 2025, newly available since October 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-class)); MDN adds that a class need not be unique and each element still needs its own `view-transition-name`. Types are the `types` option above.
- **Many unique names without writing them:** MDN's `match-element` value "causes the browser to give each selected element a unique internal view-transition-name"; it works only for same-document transitions, since the generated names "are not transferrable across different elements or documents" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)). The swoop trick below can't use it.
- **Dashed or not:** `view-transition-name` accepts an undashed name (`view-transition-name: foo;`) where `anchor-name` and `view-timeline-name` need dashes ([nerdy.dev: An Emoji Naming Convention](https://nerdy.dev/css-emoji-convention), 2025-02-20); the 2025 snippets post dashes them anyway (`--nav`). Naming conventions are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#emoji-in-custom-names).

## Text replace transitions

[nerdy.dev: Text Replace Transitions](https://nerdy.dev/text-replace-transitions), 2023-01-10. The post (2023) ran it "in Canary (with this flag enabled)" and hoped other browsers would follow; same-document view transitions are now Baseline 2025 (above).

- **A letter cycle with a crossfade "for free":** every half second, snapshot, then set new text; the browser interpolates between the changes.

```js
setInterval(() => {
  document.startViewTransition(() => {
    h1.textContent = word[index++]
    if (index >= word.length) index = 0
  })
}, 500)
```

- **Opt the page out, name only the element that changes** ("as an optimization, tell the whole page to chill"):

```css
html {
  view-transition-name: none;
}
```

```css
h1 {
  /* be stable. fix that width. */
  inline-size: 1em;
  
  /* required for view-transitions  
     now it's not the whole page */
  contain: layout;
  
  /* yo browser; transition this! */
  view-transition-name: replace-effect;
}
```

  The "required" comment is from 2023; MDN's current `view-transition-name` page states no containment requirement.
- **Choreograph the old and new snapshots separately,** inside a motion query, with Open Props animations (`@import "https://unpkg.com/open-props/easings.min.css";` and `@import "https://unpkg.com/open-props/animations.min.css";`). The incoming snapshot gets `z-index: 1`, and "the fade-out animation is reversed so opacity doesn't need set to 0":

```css
@media (prefers-reduced-motion: no-preference) {
  html::view-transition-old(replace-effect) {
    animation: 
      var(--animation-fade-out),
      var(--animation-scale-down);
  }
}
```

```css
@media (prefers-reduced-motion: no-preference) {
  html::view-transition-new(replace-effect) {
    z-index: 1;
    animation: 
      var(--animation-fade-out) reverse,
      var(--animation-slide-in-up);
  }
}
```

  Status: `::view-transition-old()`, `::view-transition-new()` and `::view-transition-group()` are Baseline 2025, newly available since October 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-old), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-group)). app-ui's page transitions "name only the content area" and set "`::view-transition-old(root) { display: none }` and `::view-transition-new(root) { animation: none }`, so everything outside the content swaps at once instead of crossfading" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).

## Morphs and other effects

- **Composer to message bubble** ([nerdy.dev: LLM chat prototype](https://nerdy.dev/llm-chat-prototype), 2025-07-28): "On submit, the textarea is given a view transition name with a unique incrementing index, then view transition is called and the same name is given to the new message element that's appended into the chat container. This creates the morph effect since the old state is the textarea and the new state is the message bubble." [Code](https://codepen.io/editor/argyleink/pen/wBKWNwQ) not exported. agent-chat-ui's composer describes no send morph ([agent-chat-ui COMPOSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/COMPOSER.md)).
- **3D perspective**, either way ([nerdy.dev: View Transitions 3d Perspective](https://nerdy.dev/view-transitions-3d-perspective), 2025-02-27). Status: `::view-transition-image-pair()` Baseline 2025, newly available since October 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-image-pair)).

```css
::view-transition-image-pair(--foo) {
  perspective: 500px;
}
/* or */
::view-transition-new(--foo) {
  transform: perspective(500px);
}
```

- **Demos whose code wasn't exported:** a light and dark toggle revealed with a `clip-path` transition, "a progressively enhanced view transition" ([nerdy.dev: Light Dark View Transition With Clip Path](https://nerdy.dev/light-dark-view-transition-with-clip-path), 2024-09-16; [source](https://codepen.io/argyleink/pen/NWZZPLZ)), which app-ui also does: "Reveal the new theme as a circle growing from the page's top start corner", with View Transitions and `clip-path: circle(0)` to `circle(150%)` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#theme-switching)); a gallery's layout change on device rotation, animated with view transitions ([nerdy.dev: Smoothly Handling Device Rotation With View Transitions](https://nerdy.dev/smoothly-handling-device-rotation-with-view-transitions), 2024-03-19; [demo](https://codepen.io/argyleink/pen/dyLNgpX)); a bento grid whose interactive demo view transitions make "so much more compelling" ([nerdy.dev: Neue Bento Layouts With Grid Has And Container Queries](https://nerdy.dev/neue-bento-layouts-with-grid-has-and-container-queries), 2024-01-08).

## The swoop

[nerdy.dev: View Transitions can swoop‽](https://nerdy.dev/swoop-there-it-is), 2026-03-07. View transitions move in straight lines; this trick adds a curve, a blur or any other motion on top of the browser's own group animation.

- **The browser's keyframes have a predictable name.** For a static name it generates `-ua-view-transition-group-anim-<name>` (pause a transition in DevTools to see it). Add a comma and your own keyframes:

```css
#ball1 { 
  view-transition-name: view-transition-ball;
}
```

```css
@keyframes -ua-view-transition-group-anim-view-transition-ball {
  …
}
```

```css
::view-transition-group(view-transition-ball) {
  animation: 
    -ua-view-transition-group-anim-view-transition-ball 2s ease-in-out, 
/* 👉*/ swoop 2s ease-in-out;
}
```

- **Use individual transforms only,** "the THING THAT TOOK FOREVER TO FIND": changing `transform` fails, and adding `animation-composition` "fails harder (don't know why)". Status: `translate` Baseline widely available (since February 2025, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate)); `animation-composition` Baseline widely available (since January 2026, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-composition)).

```css
@keyframes swoop {
  50% {
/* ❌ */ transform: translateY(50px);
/* ✅ */ translate: 0 50px;
  }
}
```

  The same trick adds a blur (motion-blur view transitions, [code](https://codepen.io/argyleink/pen/VYKjPgx) not exported). A ball animated with custom keyframes and composition doesn't exactly match one animated by the view transition: "There's a perspective difference at play I don't fully understand."
- **The limits, as the post lists them:** no access to the values the browser calculates; static names only ("no `match-element` support"); "it breaks if the browsers name their keyframes something else or if I'm assigning names with JS"; no `animation-composition: add`; no separate easing or duration for x and y (the post wanted x `ease-out` and y `ease-in`, or a slight x delay). MDN documents no `-ua-view-transition-group-anim-*` names; it shows only the UA rule for `::view-transition-group(*)`.

## Debugging

- **Freeze every transition to inspect it** ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25): with an infinite duration, "The `::view-transition` tree stays in the devtools DOM, giving you an opportunity to inspect or tweak." `calc(infinity)` is in [CSS-INFINITY.md](CSS-INFINITY.md).

```css
::view-transition-group(*),
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: calc(infinity * 1s);
}
```

- **Scrub it in DevTools:** the Animations panel can freeze and inspect animations (same post), and scrubbing a full-page view transition there is "excellent for really inspecting and improving the little details" (2025 snippets post). Pausing a transition is also how the swoop post found the browser's keyframe names.

## Where view transitions fall short

- **Straight lines, not interruptible, JS:** a view transition "requires JS, is always a straight line and is not elegantly interruptible"; "View transitions can't curve or swing to a new destination" ([nerdy.dev: Anchor Interpolated Morph (AIM)](https://nerdy.dev/anchor-interpolated-morphing), 2026-01-23). The same post's slides morph content with "no JS view transitions" ([Astro Morphull](https://github.com/argyleink/morphull)). AIM, a CSS-transition morph from the trigger's box, is in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md).
- **Not for dialogs and popovers:** "View transitions are a good option for some of what this solves, but they aren't interruptible. Also not as easy to integrate with dialog and popovers" ([nerdy.dev: Using @starting-style and transition-behavior for enter and exit stage effects](https://nerdy.dev/using-starting-style-and-transition-behavior-for-enter-and-exit-stage-effects), 2024-05-20). The transition route is in [TRANSITIONS-AND-STARTING-STYLE.md](TRANSITIONS-AND-STARTING-STYLE.md).
- **Where it differs:** [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail) uses `document.startViewTransition(() => navigate(to))` with matching names as the no-library route across routes ("without support, the change simply happens"), while [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md) makes "Interruptible always" a rule. The posts here say view transitions are not interruptible and send overlays and in-place morphs to CSS transitions instead.
- **Wished for, not shipped** (Wishlist post, 2024-12-17): declarative triggers (`:checked`, `:open` or `[open]`, `:hover`, `:active`, `:disabled`, `[popovertarget]` clicks); scroll-driven view transitions, where scroll drives the progress between the two snapshots; gesture-driven transitions between two DOM states. For gestures today, "You essentially have to manually map a gesture to the progress of a paused view transition", "not for the feint of heart" ([Bramus's outline](https://front-end.social/@bramus/111800601352108818)).

## Prove it

- **Fallback:** in a browser without `@view-transition` (Firefox today), links still navigate normally; in one without `startViewTransition`, the DOM change still happens.
- **Unique names:** with two elements of the same `view-transition-name` rendered at once, `ViewTransition.ready` rejects and the transition is skipped; with unique names it resolves and the elements morph.
- **Alias:** calling the unbound `txn` fails to start a transition; the `.bind(document)` version runs it.
- **Text replace:** only the `h1` animates (the page doesn't crossfade), and with reduced motion on, the letters swap with no scale or slide.
- **Swoop:** the ball curves on the way across, and changing the custom keyframes to the `transform` shorthand breaks it, as the post says.
- **Freeze:** with the infinite-duration rule in place, the `::view-transition` pseudo-elements stay listed in DevTools Elements after the transition starts.
