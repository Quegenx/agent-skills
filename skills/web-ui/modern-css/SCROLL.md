# Scroll

Scrollers, snapping, scroll events, `scroll-state()` queries and CSS carousels, from Adam Argyle's [nerdy.dev](https://nerdy.dev). Each fact is tagged with its post and date; each feature's status is from MDN (or MDN's browser-compat-data where MDN has no page), checked October 2026. Code is copied from the posts; where a line differs (an emoji pointer removed, a typo fixed, a stale syntax replaced) the text says so. Scroll-driven and scroll-triggered animation, including edge-aware fades, is in [SCROLL-ANIMATIONS.md](SCROLL-ANIMATIONS.md). Sticky positioning (why it fails, coordinated offsets, anchor offsets, stuck detection, two-axis tables) is in [STICKY.md](STICKY.md). Motion timing for scroll-linked effects and the Motion (`useScroll`) route are in [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#scroll-linked-motion); a sheet swiped away on native scroll is in [ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md#a-swipeable-sheet-on-native-scroll).

**Contents:** [Scroller structure and essentials](#scroller-structure-and-essentials) · [Snapping](#snapping) · [Pull to refresh](#pull-to-refresh) · [Scroll events](#scroll-events) · [scroll-state() queries](#scroll-state-queries) · [CSS carousels](#css-carousels) · [Prove it](#prove-it)

## Scroller structure and essentials

- **Three elements per scroller** "to help prevent headaches and gotchas across browsers" ([nerdy.dev: Nintendo Switch Homescreen recreated with CSS and a li'l bit of JS](https://nerdy.dev/nintendo-switch-homescreen-css-recreation), 2025-06-13): `.scroll--root` holds borders and spacing, `.scroll--viewport` has the `overflow`, containment and scrollbar styles, and `.scroll--content` is a wrapper "to aid in cross browser padding oddities or other impacts that an overflow container may apply to children".

```html
<section class="scroll--root">
  <div id="scroller" class="scroll--viewport">
    <ul class="scroll--content">
      /* your content */
    </ul>
  </div>
</section>
```

- **The four essentials** (same post): "use the `overflow` shorthand and set both axes to prevent surprises"; "`overscroll-behavior` should always match the scrolling axis"; "padding and `scroll-padding` should always match"; smooth `scroll-behavior` only if the user is OK with motion.

```css
.scroll--viewport {
  overflow: auto hidden;
  overscroll-behavior-x: contain;

  padding-inline: var(--size-8);
  scroll-padding-inline: var(--size-8);

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
}
```

  Status: `scroll-padding` Baseline widely available (since October 2023, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding)); `scroll-behavior` Baseline widely available (since September 2024, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-behavior)). MDN marks `overscroll-behavior` Limited availability ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior)); the `contain` value itself is in Chrome 63, Firefox 59 and Safari 16 (browser-compat-data `css.properties.overscroll-behavior.contain`). MDN on `contain`: "Prevents scrolling from continuing outside the scroll container. "Bounce" effects may still occur." Nice Select uses `overscroll-behavior-block: contain`, which "prevents scroll chaining" in its picker ([nerdy.dev: Nice Select](https://nerdy.dev/nice-select), 2026-02-03).
- **Where it differs:** the swipeable sheet in [ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md#a-swipeable-sheet-on-native-scroll) sets `overscroll-behavior: auto` on the sheet's inner content on purpose, because scroll chaining is its dismiss gesture.
- **Nested scrollers bounce everywhere now:** "Chrome 145 joins WebKit and Firefox in supporting **overscroll effects** on nested scrollers. No more bonk UX, get the same soft edge bounce as the main page has always had!" ([nerdy.dev: Overscroll Effects On Nested Scrollers In All Browsers](https://nerdy.dev/overscroll-effects-on-nested-scrollers-in-all-browsers), 2026-01-21).
- **Never stop overscroll with `touchmove` and `preventDefault()`.** [Emil Kowalski, mobile-native] "Never reach for a `touchmove` + `preventDefault()` listener for this - it blocks scrolling entirely and makes the listener non-passive, which costs frames." Use `overscroll-behavior`: "Use `none` on the root, `contain` on children."
- **`touch-action` names the axes the browser keeps.** [Emil Kowalski, mobile-native] A horizontal swipe on a carousel "is ambiguous to the browser", so tell it which axes the element owns; "The values name what the *browser* may still do." Verbatim:

```css
.carousel {
  touch-action: pan-y; /* the carousel handles horizontal; the browser keeps vertical */
}
.drag-surface {
  touch-action: none;  /* a custom gesture (a drag-to-dismiss sheet, a slider) owns every axis */
}
.vertical-sheet-handle {
  touch-action: pan-x; /* the sheet handles vertical drags; horizontal stays with the browser */
}
```

  "`none` means the element handles everything - use it only on elements that really do, or the user won't be able to scroll past them." For a native-scroll carousel, snapping (below) makes `touch-action` unnecessary: "the browser's own physics beat a hand-rolled spring". Status: `touch-action` is Baseline widely available (across browsers since September 2019), and `manipulation` is an alias for `pan-x pan-y pinch-zoom` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)).
- **A scroller is a natural container** (Switch post, 2025-06-13): the post's `container` setup for `.scroll--root`, `.scroll--viewport` and the snap items is in [QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md); the `scroll-state` type is Chrome only, below.

## Snapping

- **Snap to the layout grid** (Switch post, 2025-06-13): with `scroll-padding` already matching the inline padding, start-aligned snapping lines up with the grid. Status: `scroll-snap-type` Baseline widely available (since October 2024, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type)).

```css
.scroll--viewport {
  scroll-snap-type: x mandatory;
}

.scroll--content > li {
  scroll-snap-align: start;
}
```

  landing-page-ui's capability carousel uses proximity snap and its own buttons instead ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#carousel-of-capability-cards)).
- **`mandatory` or `proximity`** [responsive-craft, sticky-scroll-patterns.md]: "`mandatory` - always snaps. Can trap users if snap points are far apart. Only use when items fit the viewport." "`proximity` - snaps only when close to a snap point. Safer for variable-height content."
- **An elastic overscroll from snap alone** (same post): invisible `::before` and `::after` spacers have no `scroll-snap-align`, so under `x mandatory` "the scroller will never rest on these invisible overscroll spacers". The start spacer is `25cqi` ("a 25% overscroll vibe"); the end one is `90cqi`, "ensuring the last game can be snapped to the start".

```css
.scroll--content {
  display: flex;

  &::before,
  &::after {
    content: "";
    display: block;
    inline-size: 25cqi;
    flex-shrink: 0;
  }

  &::after {
    inline-size: 90cqi;
  }
}
```

- **Snap only while an item is focused** ([nerdy.dev: Conditional Snapping With Has](https://nerdy.dev/conditional-snapping-with-has), 2022-12-19): the `html:has(.CertainItem:focus-visible)` snippet and its root `:has()` cost are in [CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md).
- **HTML picks the snap alignment, CSS owns the allowed values** ([nerdy.dev: 4 CSS Features Every Front-End Developer Should Know In 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026), 2026-01-07): the `scroll-snap-align: attr(scroll-snap type(start | center | end))` snippet is in [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md#typed-attr). Typed `attr()` is Limited availability (browser-compat-data `css.types.attr.type_function`: Chrome 133, Firefox 155, Safari not yet).

- **Sticky plus snap:** a calendar prototype combines scroll snap, `position: sticky` headers, grid and `z-index: 1` ([nerdy.dev: Sticky Snapping Calendar](https://nerdy.dev/sticky-snapping-calendar), 2024-06-21; demo code not exported, [CodePen](https://codepen.io/argyleink/pen/PovOMYy)). "Sticky staggered offsets + gradients = neat transition", in a linear and a trig version ([nerdy.dev: Sticky Gradient Transitions](https://nerdy.dev/sticky-gradient-transitions), 2025-09-26; demo code not exported).
- **Diagonal scrolling with `scroll-axis-lock: none`** ([nerdy.dev: Scroll Axis Lock](https://nerdy.dev/css-scroll-axis-lock), 2026-08-10): scrollers lock a diagonal gesture into `x` or `y`, "Even on a touch device, where a diagonal gesture is so easy and natural". The post's remedy, with its trailing `👈` pointer removed (it is not CSS):

```css
.scroller {
  overflow: auto;
  overscroll-behavior: contain;
  scroll-axis-lock: none;
}
```

  Status: experimental, Chrome 153 only (browser-compat-data `css.properties.scroll-axis-lock`; MDN has no page yet); [spec](https://drafts.csswg.org/css-overflow-5/#scroll-axis-locking). Use cases from the post: swipe to dismiss, flings, maps or an infinite canvas, datagrids or tables, panning a zoomed image, 360 panoramas or 3D models, data-vis exploration, reusing scroll snap's "natural inertia, tensions, perf" and its "didnt swipe far enough" snap-back; it "can also mitigate `scrollTo` strangeness that might do `x` then `y`". The author saw performance regressions in his first two demos, [filed a bug](https://issues.chromium.org/u/1/issues/544635549), and "still felt it was a bit clumsy".

## Pull to refresh

[nerdy.dev: Pull to Refresh with Scroll Snap and Scroll Driven Animation](https://nerdy.dev/pull-to-refresh-prototype-with-scroll-snap-and-scroll-driven-animation), 2023-06-28. The author calls it "a prototype and isn't production ready". The markup is a `<header id="refresh">` indicator above `<main id="refresh-main">`:

```html
<header id="refresh">
  <svg>…</svg>
  <span>Pull to refresh</span>
</header>
<main id="refresh-main">
  <h1>…</h1>
  <p>…</p>
</main>
```

- **The root is the snap scroller,** with smooth behavior "so that programmatic scroll position assignment (like when the refresh task is complete and main is scrolled to) interpolates":

```css
html {
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}
```

- **Start on `<main>`:** as the only child with a snap alignment under `mandatory`, it is snapped on first render; `scroll-snap-stop: always` means "it's not 'toss to refresh'". Status: `scroll-snap-stop` Baseline widely available (since January 2025, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-stop)).

```css
main {
  /*  the only child with snap alignment is "scroll start"  */
  scroll-snap-align: start;

  /*  it's not "toss to refresh"  */
  scroll-snap-stop: always;
}
```

- **Add the indicator's snap point 2ms later,** on a `10px` pseudo-element, so taking the snap away from `<main>` takes "a very deliberate user gesture":

```css
#refresh::before {
  content: "";
  position: absolute;
  inset: 0;
  block-size: 10px;
  animation: delayed-snap-point 2ms forwards;
}

@keyframes delayed-snap-point {
  to { scroll-snap-align: start }
}
```

  The delay fakes the spec's `scroll-start`. MDN now documents `scroll-initial-target` (`none | nearest`) for elements that are "potential snap targets when their ancestor scroll container is first rendered"; the first `nearest` in tree order wins ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-initial-target)). Status: Limited availability, Chrome 133 only. MDN doesn't call it a rename of `scroll-start`.
- **Animate the indicator on its `exit` range:** pulled in from the top, it is technically leaving the viewport. Each element tunes its own range "since their own presence is so small". MDN: the `animation` shorthand resets `animation-timeline`, so declare the timeline after it, as here ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)). [Bramus's range tool](https://scroll-driven-animations.style/tools/view-timeline/ranges/).

```css
@keyframes rotate-in {
    to {
        transform: rotateZ(.5turn);
    }
}

@keyframes fade-out {
    to {
        opacity: 0;
    }
}
```

```css
#refresh > svg {
  animation: linear rotate-in;
  animation-timeline: view();
  animation-range: exit 0% exit 100%;
}

#refresh > span {
  animation: linear fade-out;
  animation-timeline: view();
  animation-range: exit -200% exit 100%;
}
```

- **Refresh on `scrollend`** when `scrollTop` is at the top, then scroll `<main>` back with `scrollIntoView()`; the "done!" text stays 500ms so the user sees it. The post imports his `scrollyfills` polyfill; `scrollend` is now Baseline 2025 (next section):

```js
import {scrollend} from 'https://cdn.jsdelivr.net/gh/argyleink/scrollyfills@latest/dist/scrollyfills.modern.js'

const ptr_scrollport = document.querySelector('html')
const ptr = document.querySelector('#refresh')
const main = document.querySelector('#refresh-main')

const determinePTR = event => {
  if (event.target.scrollTop <= 0) {
    // fetch()
    ptr.querySelector('span').textContent = 'refreshing...'
    ptr.setAttribute('loading-state', 'loading')
    
    // sim response
    setTimeout(() => {
      ptr.querySelector('span').textContent = 'done!'
      
      setTimeout(() => {
        ptr.removeAttribute('loading-state')
        main.scrollIntoView({ behavior: 'smooth' })

        // wait half a second so the user can see the done! message
        window.addEventListener('scrollend', e => {
          ptr.querySelector('span').textContent = 'Pull to refresh'
        }, {once: true})
      }, 500)
    }, 2000)
  }
}

window.addEventListener('scrollend', e => {
  determinePTR({target: ptr_scrollport})
})
```

  The post (2023-06) said "It's best in Chrome Canary until SDA has better support"; scroll-driven animation is still Limited availability (below). The ingredients are the swipeable sheet's: "combining scroll snapping, view timeline animations, overscroll-behavior, and dynamic viewport units" ([ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md#a-swipeable-sheet-on-native-scroll)).

## Scroll events

- **`scrollend` replaces scroll timeouts:** "Delete your timeout functions and shake off their bugs, here's the event you really need: `scrollend`" ([nerdy.dev: A Scrollend Event](https://nerdy.dev/a-scrollend-event), 2023-01-25; his polyfill is npm `scrollyfills`). Status: Baseline 2025, newly available since December 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event)). MDN: it fires when there are no pending scroll updates and the gesture has ended, not when the position didn't change; listen on `Document` for the page.
- **`scrollsnapchanging` and `scrollsnapchange`** ([nerdy.dev: Scroll Snap Events In Chrome 129](https://nerdy.dev/scroll-snap-events-in-chrome-129), 2024-08-14; [visualizer demo](https://codepen.io/argyleink/full/pomYMpB) not exported). The posts write them camelCase (`scrollSnapChange`); the event names are lowercase. The June 2024 note's "Try it in Canary" ([nerdy.dev: Preview ScrollSnapChange And ScrollSnapChanging Js Events](https://nerdy.dev/preview-scrollSnapChange-and-scrollSnapChanging-js-events), 2024-06-26) is superseded by the Chrome 129 ship. Status: Limited availability, experimental, Chrome and Edge 129 only ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchanging_event), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event)); the event is a `SnapEvent` with `snapTargetBlock`.
- **Sound on pending and committed snap changes** (Switch post, 2025-06-13): preload the sounds "so they can play instantly at first". `scrollsnapchanging` reports a changed pending snap target; a fast gesture need not emit an event for every passed candidate. `scrollsnapchange` reports the new selected target at the end of scrolling. The post and our old line promised a pop for each passing item; that is not the pending-target event's guarantee. [MDN scrollsnapchanging](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchanging_event), [scrollsnapchange](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event)

```js
const sounds = {
  snap: new Audio('https://assets.codepen.io/2585/snap.mp3'),
  pop: new Audio('https://assets.codepen.io/2585/pop.m4a'),
}
```

- **The source vibration guard checks the wrong object.** Its `navigator?.vibrate(50)` checks `navigator`, not whether `vibrate` exists, so an absent method still throws. Feature-detect the method before invoking it; the Vibration API also requires sticky user activation and has limited support. The post and our removed handler treated that expression as a safe optional vibration call. [MDN optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining), [Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate)

```js
scroller.onscrollsnapchange = event => {
  sounds.snap.play()
}
```

- **Tap to snap** (same post): scroll a clicked item to the snap position.

```js
scroller.onclick = event => {
  let target = event.target.closest('.game')

  if (target) {
    scroller.scrollTo({
      left: target.offsetLeft,
      behavior: 'smooth'
    })
  }
}
```

- **Audio needs a user activation** ([nerdy.dev: Snap On Snap](https://nerdy.dev/snap-on-snap), 2024-10-18): "you may need to click/tap before scrolling, for the browser to deem playing the audio as user activated."

```js
const snap = new Audio('snap.mp3')

scroller.onscrollsnapchange = () =>
  snap.play()
```

## scroll-state() queries

[nerdy.dev: 4 CSS Features Every Front-End Developer Should Know In 2026](https://nerdy.dev/4-css-features-every-front-end-developer-should-know-in-2026), 2026-01-07. The post presents them as shipped; they are Chrome only and experimental: `container-type: scroll-state` with `stuck`, `snapped` and `scrollable` from Chrome 133 and `scrolled` from Chrome 144, no Firefox or Safari (browser-compat-data; [MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries), which shows an `@supports not (container-type: scroll-state)` unsupported-browser message). The post treats them as progressive enhancement, "similar to scroll driven animations".

- **Setup:** "you need the element that's stuck, snapped, or scrollable to have `container-type: scroll-state`. Then, a child can query it with `@container scroll-state()`." "An element cannot query itself, but its pseudo elements can!"
- **stuck:** in other browsers, detect it with an `IntersectionObserver` sentinel ([STICKY.md](STICKY.md#detect-the-stuck-state)). "Use this to help users understand an element will now be overlaying their scroll content." MDN's form with a side is `@container sticky-heading scroll-state(stuck: top)`. Nice Select colors its sticky group headers when stuck, and "even the sticky scroll state respects" forced colors (Nice Select post, 2026-02-03).

```css
/* when .outer-navbar is stuck */
@container scroll-state(stuck) {
  .inner-navbar {
    box-shadow: var(--shadow-3);
  }
}
```

- **snapped:** "Great for highlighting the item, or demoting every other item."

```css
/* when <li> parent is snapped */
@container scroll-state(snapped) {
  .box {
    scale: 1.1;
  }
}

/* or not snapped! */
@container not scroll-state(snapped) {
  .box figcaption {
    translate: 0 100%;
  }
}
```

- **scrollable:** "know when content overflows its container, and in which direction(s)"; toggle hints and indicators or adjust padding. MDN's form with a direction is `scroll-state(scrollable: top)`. Nice Select also adds a `.scrollable` class from JS "when content exceeds max height" to adjust padding.

```css
@container scroll-state(scrollable) {
  .scroll-hint {
    opacity: 1;
  }
}
```

- **scrolled:** "for sticky headers or navbars that showy hidey based on scroll direction."

```css
@container scroll-state(scrolled: bottom) {
  translate: 0 -100%;
}
```

- **A snapped game, with titles shown by default** (Switch post, 2025-06-13): "By default I chose to always show the game titles, only applying the animation effect if the browser understands `scroll-state` queries." The snapped game's image gets "the pulsing blue focus outline" that "animates forever"; the title of a game that is not snapped slides down and fades, on transitions delayed .2s:

```css
@keyframes game-focus {
  from {
    outline-color: hsl(200 100% 50%);
  }
  to {
    outline-color: hsl(200 100% 80%);
  }
}
```

```css
.game {
  img {
    @container scroll-state(snapped: x) {
      outline: 5px solid blue;
      outline-offset: 5px;
      animation: game-focus .5s var(--ease-3) alternate infinite;
    }
  }

  figcaption {
    @media (prefers-reduced-motion: no-preference) {
      z-index: -1;
      transition:
        translate .5s var(--ease-spring-2) .2s,
        opacity .5s var(--ease-3) .2s;

      @container not scroll-state(snapped: x) {
        translate: 0 50px;
        opacity: 0;
      }
    }
  }
}
```

  Its outline animation sits outside the motion query; ui-animation's rule 8 is "Reduce, don't remove: with reduced motion, movement becomes short fades" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)).

## CSS carousels

[nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025), 2024-12-17: generated scroll buttons, scroll markers ("dots || tabs || squares || thumbnails"), page groups and "Out of scrollport inert"; "Browser provides the focus order!" The launch claims: "Incredible accessibility", "Works without JS", "Builds upon regular scrollers" ([nerdy.dev: CSS Carousel In Chrome 135](https://nerdy.dev/css-carousel-in-chrome-135), 2025-03-20). Status: `::scroll-button()`, `::scroll-marker`, `scroll-marker-group` and `:target-current` are Limited availability and experimental, Chrome and Edge 135 only ([MDN ::scroll-button()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::scroll-button), [MDN ::scroll-marker](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::scroll-marker), [MDN scroll-marker-group](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-marker-group), [MDN :target-current](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:target-current)). The post said "use Canary for now".

- **The scroller first.** The post closes the list with `<ul>`; fixed to `</ul>` here, the closing tag of [`<ul>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul):

```html
<ul class="carousel">
  <li>…</li>
  <li>…</li>
  …
</ul>
```

- **Buttons appear when you give them content.** MDN: they are generated only when `content` isn't `none`; its arguments include `left`, `right`, `up`, `down` and the logical `inline-start`, `inline-end`, `block-start`, `block-end`, and the spec's `next` and `prev` work in no browser. `'icon' / 'Next'` gives the icon font its accessible text (`content` alt text: Chrome 77, Firefox 128, Safari 17.4, browser-compat-data `css.properties.content.alt_text`).

```css
.carousel {
  overflow: auto;
  scroll-snap-type: x mandatory;

  /* gen a button by putting content into the new pseudo */
  &::scroll-button(right) {
    /* icon font with accessible fallback text */
    content: 'arrow_forward' / 'Next';
  }
  
  &::scroll-button(left) {
    content: 'arrow_back' / 'Previous';
  }
}
```

- **Place the buttons with anchor positioning:** the post's anchored buttons with inner and outer areas, and the container query that moves them inside, are in [ANCHOR-POSITIONING.md](ANCHOR-POSITIONING.md#carousel-buttons-that-move-inside-or-outside).
- **Markers** are generated the same way, as "scroll to" in-page elements, and `:target-current` styles the one whose item is snapped. MDN: `scroll-marker-group` takes `before | after | none` (default `none`), and `after` puts the group at the end of tab and layout order.

```css
.carousel {
  scroll-marker-group: after;

  & > .item::scroll-marker {
    content: ' ';
  }
}
```

```css
.carousel {
  scroll-marker-group: after;

  & > .item::scroll-marker {
    &:target-current {
      background: var(--accent);
    }
  }
}
```

- **Tools:** the [Carousel Configurator](https://chrome.dev/carousel-configurator/) to "directly see the relationship of a feature you want and the related CSS", and the [Carousel Gallery](https://chrome.dev/carousel/) (Chrome 135 post, 2025-03-20; [nerdy.dev: Carousels On Shoptalk](https://nerdy.dev/carousels-on-shoptalk), 2025-04-07).
- **Other carousels in this repo:** the JS carousels and rings in [ui-animation COLLECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/COLLECTIONS.md#galleries-carousels-and-rings), and landing-page-ui's capability carousel with its own buttons ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#carousel-of-capability-cards)). The CSS carousel above is the native route, Chrome only today.

## Prove it

- **Essentials:** the scroller uses a two-value `overflow`, its `overscroll-behavior` names the scrolling axis, its padding and `scroll-padding` are equal, and with reduced motion on, programmatic scrolls jump instead of gliding.
- **Chaining:** scroll a nested scroller to its end and keep going; with `contain` the page doesn't move, and in Chrome 145+, Firefox and Safari the scroller bounces.
- **Overscroll spacers:** fling past the first and last item; the scroller springs back and never rests on a spacer, and the last item can snap to the start.
- **Pull to refresh:** the page loads snapped to `<main>`; a short pull snaps back; a long pull rests on the indicator, `scrollend` fires once, and the page scrolls back after "done!".
- **Snap events:** in a supporting browser, tie feedback to changed pending targets and the committed target, without expecting an event for every passed item; without support the scroller still snaps. Vibration is method-detected and user-activated. [Scroll events](#scroll-events)
- **scroll-state:** in Chrome the stuck header gains its shadow and the snapped item its highlight; in Firefox and Safari every title still shows and nothing is hidden.
- **Carousel:** in Chrome 135+, Tab reaches the generated buttons and markers, the snapped item's marker matches `:target-current`, and screen readers announce "Next" and "Previous"; elsewhere it is a plain snapping scroller.
- **Touch axes:** no `touchmove` listener calls `preventDefault()`; on a phone the page still scrolls vertically past every `pan-y` carousel and every `touch-action: none` surface.
