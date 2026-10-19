# Units and responsive layout

Layout reads its content and its container, not the screen. These rules keep desktop exact while everything narrower scales smoothly, keep text resizable (WCAG 1.4.4), and make right-to-left work by default. The owner's rules sort CSS into three tiers: production (everything down to Direction), [enhancements](#enhancements-not-the-base), and [features not to build a system on](#dont-build-a-system-on-them).

## Units

| Unit | For | Never for |
|---|---|---|
| `rem` | font sizes, small spacing (10px and below), control and icon sizes, radii | |
| `clamp(min-rem, rem + cqi, max-rem)` | a smooth scale; keep a `rem` term in the middle. For type, keep the maximum at most 2.5 times the minimum: "If the maximum font size is less than or equal to 2.5 times the minimum font size, then the text will always pass WCAG SC 1.4.4, at least on all modern browsers" (Maxwell Barvian, [Addressing Accessibility Concerns With Using Fluid Type](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/), 2023-11; his derivation assumes the widest ramp point is at most 5 times the narrowest). responsive-craft writes it as "If `max / min <= 2.5`, it passes WCAG SC 1.4.4" with no source; the rule is Barvian's, not WCAG's text [responsive-craft] | a value with no `rem` part (breaks text resize) |
| `cqi`, `cqmin` | the fluid part inside a component; `cqmin` for squares (with `aspect-ratio: 1`). `cqmin` is the smaller of `cqi` and `cqb`, so it means the short side only in a `container-type: size` container; in an `inline-size` container `cqb` falls back to the nearest size container or the small viewport unit ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)) | |
| container queries | a component's composition: a direction flip, a part shown or hidden, columns that re-span; a threshold in `ch` when it switches on reading length ([nerdy.dev](https://nerdy.dev/a-css-container-query-pattern), 2023-10-10) | continuous scaling (use `clamp()`) |
| `%`, `fr`, `minmax()`, `auto-fill` | grids with no breakpoints: `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))` | |
| `min()`, `max()` | caps beside `clamp()`: `inline-size: min(100%, 42.5rem)` | |
| `ch` | text measure: `inline-size: min(100%, 65ch)`; for a measure that also tracks its column, `inline-size: min(100%, clamp(45ch, 50%, 65ch))` (the owner's rule; in `clamp()` the minimum wins over the maximum, so without the outer `min()` the 45ch floor overflows a narrow column: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp)) | |
| `lh`, `cap`, `ic`, `rlh` | spacing by line (a textarea starting at `4lh`), aligning an icon to capitals, drop caps, tag padding and vertical rhythm in lines; `ic` for measure in CJK text (the owner's rule; [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#cap-and-the-root-relative-font-units)) | |
| `dvh`, `svh` | mobile heights: `svh` when nothing may jump, `dvh` to follow the address bar (it does not adjust when the keyboard opens). mobile-native's split: `height: 100dvh` for an app shell and drawers, `min-height: 100svh` for heroes, since `dvh` "causes layout shifts on marketing content mid-scroll"; "`lvh` is the old `vh`, you almost never want it" [Emil Kowalski, mobile-native] | `vh` |
| `env(safe-area-inset-*)` | anything fixed to a screen edge (notch, Dynamic Island, home indicator): "Fixed headers, bottom tab bars, toasts, and sheets". It needs `viewport-fit=cover` in the viewport meta: "Without the meta tag the `env()` values are all `0px`". Inside a `calc()`, give it a fallback: `env(safe-area-inset-bottom, 0px)` [Emil Kowalski, mobile-native]. Check landscape too: "Landscape orientation: notch moves to the side. `safe-area-inset-left/right` become significant. AI almost never handles landscape." [responsive-craft]; in a right-to-left layout those sides map as in [Direction](#direction) | |
| `px` | only thin borders (hairlines, outlines) and shadows (the owner's rule); kept exceptions: blur and values measured at runtime | spacing, type, sizes |
| `vw`, `vi`, `vb` | only what truly belongs to the whole screen (the owner's rule); `vi` and `vb` are the logical `vw` and `vh`, viewport units like them, not logical properties ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)) | anything inside a component (always `cqi`, `cqb`) |

- **Why `min(100%, ...)` in the grid row** (Evan Minto's reason, via Argyle): [LAYOUT.md](LAYOUT.md#three-unintuitive-layout-solutions). Drop caps, half-leading tag padding, `rlh` rhythm and the units' support: [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#line-height-units-lh-and-rlh).
- **`vw` on purpose, both ways:** two radius tricks compare a card with the viewport, so they need `vw` or `vi` by design: `border-radius: max(0px, min(8px, calc((100vw - 4px - 100%) * 9999)))` squares the corners when the card is full width (Ahmad Shadeed, via [nerdy.dev: 10 powerful ways to use CSS variables](https://nerdy.dev/custom-prop-categories), 2023-01-26), and `clamp(0px, (100vi - 100%) * infinity, 20px)` does it with `infinity`, with a `100cqi` version for a container ([nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases), 2026-07-25). The check below fails the `vw` one.

## A fluid scale that keeps desktop exact

- **Every fluid token's maximum is today's measured desktop size,** so the change only shrinks narrower layouts. Ramp between two page widths (say 22.5rem and 60rem).
- **The formula for a step:** max = px / 16; min = max × ratio (0.75 for space, 0.85 for display type); slope = 100 × (max − min) / (wide − narrow) in `cqi`; intercept = min − (max − min) × narrow / (wide − narrow) in `rem`.
- **Register tokens as typed custom properties** (`@property --space-4 { syntax: "<length>" }`) computed on `:root` (for overlays portaled to the body) and on the page area, so components scale with the page, not with their own small containers. A component that should scale with itself uses `cqi` directly. Registering also makes a token type-safe, and `inherits: false` can perform better: [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md#typed-properties-with-property).
- **A modular scale can be written in CSS** (the owner's rule): `calc(1rem * pow(var(--ratio), 2))`. `pow()` is Baseline widely available since 2026-06-07 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/pow)), so it belongs here, not among the enhancements. Keep each step's maximum at the measured desktop size.
- **Name space steps after the framework's step numbers** (`--space-4` is the fluid twin of `p-4`), so the fluid version of every spacing class is obvious.
- **Body and control text stay fixed `rem`;** only display sizes (20px and up) are fluid, and never below 85%.
- **Porting a viewport breakpoint to a container query,** subtract what sits beside the container (a 16rem sidebar, the page padding) and say so in a comment. A query that only stepped a size becomes one `clamp()` ramping over the same widths.
- **The same port in Tailwind** [flornkm, prefer-container-queries]: `@container` on the parent, `@md:` on descendants. "Do not map `md:` to `@md:` blindly; `md` is 768px of viewport, `@md` is 448px of container. Resize the container, not the window, to find the real breakpoint." "Test the component in its narrowest real context (sidebar, drawer, small grid cell), not just at mobile viewport widths", and in review: "If moving it to a different column breaks it, it is viewport-coupled." The syntax, the sizes, the nearest-ancestor rule and Tailwind v3's different plugin syntax are in [modern-css QUERIES-AND-PREFERENCES.md](QUERIES-AND-PREFERENCES.md#container-queries-in-tailwind-v4).
- Only the shell keeps a viewport media query, matching the width the script uses to swap the sidebar for a sheet. Media queries otherwise only for capabilities and preferences (`hover`, `pointer: coarse`, `prefers-reduced-motion`), because "Touch and mouse are not exclusive. iPads with trackpads, laptops with touchscreens, phones with a mouse. Write for both at once; gate by capability, not by device" [Emil Kowalski, mobile-native]. Argyle counts colour gamut among them: "Viewport widths n' color gamuts; **As each widen, adapt the UI**" ([nerdy.dev: Device Width Is Like Device Color Gamut](https://nerdy.dev/device-width-is-like-device-color-gamut), 2023-04-05). He also flips a card's `aspect-ratio` from 4/3 to 3/4 under `@media (orientation: portrait)` ([nerdy.dev: Matching Aspects](https://nerdy.dev/matching-aspects), 2024-11-09), a viewport-shape query this line doesn't list.

### Where other responsive skills differ

The order agrees: "Intrinsic CSS first (`auto-fit`, `flex-wrap`, `clamp()`) → container queries next (component-level) → media queries last (page-level only). If a simpler layer solves it, stop there" [responsive-craft]. The units don't. Each line below gives the source's view, then the owner's rule, and the owner's rule wins; responsive-craft's own forks and workflow are in [RESPONSIVE-FORKS.md](RESPONSIVE-FORKS.md).

- **Viewport layout:** responsive-craft says media queries handle "Page-level shifts: grid columns, nav transform, sidebar", and prefer-container-queries keeps viewport breakpoints for "The overall grid, whether the sidebar exists at all, header and navigation behavior" and "Global typography scale tied to screen size". The owner's rule: only the shell's sidebar-to-sheet swap keeps a viewport query, and type scales through one `clamp()`.
- **`vw` in fluid tokens:** responsive-craft builds its scale as `clamp(minSize, intercept + slope * 100vw, maxSize)` (`--step-0: clamp(1.00rem, 0.91rem + 0.43vw, 1.25rem)`), and css-modern-features writes `clamp(1.5rem, 4vw + 1rem, 3.5rem)` and `--space-s: clamp(0.75rem, 1.5vw, 1rem)`. The owner's rule: the same slope and intercept maths, with the slope in `cqi` and `vw` never inside a component. responsive-craft's own "never pure `vw`" contradicts its `clamp(1.5rem, 4vw, 3rem)` and `clamp(3rem, 8vw, 6rem)`, which fail the owner's `rem`-term rule too [responsive-craft; css-modern-features].
- **Fluid body text:** responsive-craft scales `--text-base: clamp(1rem, 0.91rem + 0.43vw, 1.25rem)` up from a fixed minimum. The owner's rule: body and control text stay fixed `rem`, and a fluid token's maximum is the measured desktop size [responsive-craft].
- **`px`:** responsive-craft writes `minmax(min(280px, 100%), 1fr)`, `--header-height: 60px` and `min-width: 768px` breakpoints, and css-modern-features `.container { width: clamp(320px, 90%, 1200px) }`. The owner's rule: `px` only for hairlines and shadows, `rem` in media queries and in the script's `matchMedia` [responsive-craft; css-modern-features].
- **`auto-fit` by default:** responsive-craft says "Most responsive grids want `auto-fit`. Use `auto-fill` only when items should maintain a fixed max width regardless of available space." The owner picks per case: `auto-fill` for the grid above and app-ui's field pairs ("the empty track stays, so an unpaired field takes half the row"), `auto-fit` for app-ui's short fields in pairs [responsive-craft].
- **Mobile-first only:** responsive-craft says "Always use `min-width` (mobile-first), not `max-width`" and its scan flags `max-width` queries as desktop-first. The owner's model keeps desktop exact and scales narrower layouts down, and landing-page-ui uses `max-md:` variants; don't port the flag [responsive-craft].
- **Viewport heights:** responsive-craft says "Use `svh` for ~90% of cases. Use `dvh` only for elements that must track the exact visible area (chat containers, modals)", writes `height: 100vh; /* fallback */ height: 100svh;`, and keeps `lvh` for "Backgrounds, decorative elements"; css-modern-features writes `max-height: 100lvh`. The owner's rule: `dvh` for an app shell and drawers, `svh` for heroes, never `vh`, and "`lvh` is the old `vh`" (MDN: "`vh` is equivalent to `lvh`", [length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)). No `vh` fallback either: this file's check and app-ui's `trap/viewport-height` both fail `100vh` even beside a `dvh` or `svh` value (the owner's rule) [responsive-craft; css-modern-features].
- **Physical sides:** responsive-craft calls logical properties "future-proofing" for left-to-right sites, and its drawer, sentinel and sticky column use `left: 0`. The owner's rule: a physical `left` or `right` is a bug in a right-to-left app [responsive-craft].

## Text and content

- Headings `text-wrap: balance`; paragraphs, list items and captions `pretty`. Balance's line limit, and the box that doesn't shrink to the balanced lines: [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#text-wrap-balance).
- `text-box: trim-both cap alphabetic` on large headings to drop the font's inner padding (a deliberate, small shift; older browsers keep the normal box). Argyle puts it on `h1, p, button` too; that and support: [TYPOGRAPHY-AND-UNITS.md](TYPOGRAPHY-AND-UNITS.md#text-box-trim-the-fonts-inner-spacing).
- Textareas and text inputs grow with `field-sizing: content`, no script. Support and animating the growth: [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md#fields-that-size-to-content).
- `:has()` for a parent that changes with what it holds, and `:not(:has())` for one that lacks it ([CASCADE-AND-SCOPE.md](CASCADE-AND-SCOPE.md#has-and-selectors)); `aspect-ratio` for media.
- **Room for translation:** "Translated strings grow, and short ones grow proportionally more, so a one-word button label is the riskiest thing on the screen. Size text containers with `max-width` and `min-height`, never a fixed width or height, and let rows wrap. Test with pseudo-localization and one long-string locale such as German" [Jakub Krehel, better-layout].

Type scale, measure, tracking and the source-qualified type review are in [FONTS-AND-TEXT-DETAILS.md](FONTS-AND-TEXT-DETAILS.md#type-review).

## Touch and browser chrome

Emil Kowalski's mobile-native removes "the tells that give it away" on a phone: the platform layer of viewport, touch, scroll, safe areas and browser chrome [Emil Kowalski, mobile-native]. Two failure modes, "and the first is worse": "Fixing what the desktop shows you. The bugs in this skill don't reproduce in Chrome's device emulation", and "Reaching for JavaScript when CSS or a meta tag does it. ... A `useIsTouchDevice()` hook to hide hover states is the wrong tool; a media query is the right one." "Every fix ships with the reason": "`user-select: none` on body text is a defect, on a button it's correct."

| Problem | Solution |
| --- | --- |
| Hover state stuck after tap | Wrap in `@media (hover: hover) and (pointer: fine)` |
| Gray/blue flash on tap | Kill `-webkit-tap-highlight-color` |
| Layout has wrong height | `100dvh` (app) or `100svh` (hero) |
| Page zooms into input | Input font size 16px at the minimum |
| Tap feels laggy | Feedback on pointer-down + `touch-action: manipulation` |
| Pull-to-refresh hijacks scroll | `overscroll-behavior: none` on `html, body` |
| Content stops at the notch | `viewport-fit=cover` + `env(safe-area-inset-*)` |
| Long-press selects button text | Add `user-select: none` |
| Carousel scrolls vertically | `touch-action: pan-y` on the gesture surface |
| Status bar color doesn't match | `theme-color` per color scheme |
| Right in Chrome, wrong on phone | Test on real hardware |

- **Hover:** "Both conditions matter. `(hover: hover)` means the primary input can hover. `(pointer: fine)` means it's precise, like a mouse." Tailwind 4's `hover:` compiles to `@media (hover: hover)` only, with no `(pointer: fine)`, and `@custom-variant hover (&:hover);` opts out ([Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide)). agent-chat-ui uses one condition: "Put every hover style inside `@media (hover: hover)`".
- **Tap highlight:** `html { -webkit-tap-highlight-color: transparent; }` once, then "make sure every tappable element has its own `:active` state, because you've just removed the only feedback the browser was giving."
- **Input zoom:** the observed threshold, the two source fixes, zoom-lock prohibition and owner capability-based exception are in [FONTS-AND-TEXT-DETAILS.md](FONTS-AND-TEXT-DETAILS.md#the-ios-input-zoom). [Emil Kowalski, mobile-native; Jakub Krehel, better-typography]
- **Overscroll:** `html, body { overscroll-behavior: none; }` in an app, `overscroll-behavior: contain` on inner scrollers; drop `none` from `html` "if the app is a scrolling document where pull-to-refresh is welcome". No `touchmove` + `preventDefault()` listener for this ([why](SCROLL.md#scroller-structure-and-essentials)). ui-animation's sheets keep `auto` on purpose, so scroll chaining is the dismiss gesture.
  - **The other view, gated by pointer:** "Page rubber-band suppression: `overscroll-behavior: none` on `<html>` inside `@media (pointer: fine)`; keep coarse-pointer page defaults for pull-to-refresh. Test hybrid touch devices: `pointer` describes the primary input" [Vercel, web-interface-guidelines]. mobile-native decides by app against document, Vercel by input. Vercel adds that `none` "also disables scroll chaining and native swipe navigation"; MDN's `none` "Prevents scrolling from continuing outside the scroll container and also prevents overscroll 'bounce' effects" and says nothing about swipe navigation ([overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior)).
- **Gesture axes:** which axes each `touch-action` value leaves to the browser, and when a native-scroll carousel needs none, are in [modern-css SCROLL.md](SCROLL.md#scroller-structure-and-essentials) [Emil Kowalski, mobile-native].
- **The keyboard:** mobile-native's baseline adds `interactive-widget=resizes-content` so "`100dvh` and bottom-pinned inputs react to it the way they do on iOS". The official form: by default "the virtual keyboard only resizes the visual viewport, which doesn't affect the layout of the page", and `resizes-content` opts into resizing the layout ([viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)); Chrome 108 moved Android to `resizes-visual`, "aligning its behavior with that of Safari" ([Chrome: viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior)). So `resizes-content` makes Android differ from iOS, not match it. better-layout's detection table also says `100dvh` keeps "the browser toolbar and keyboard" off the bottom; the keyboard half is wrong for the same reason. The cross-browser path is the visual-viewport padding in [anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md#3-absolute-no-purpose-excuses-these).
- **Status bar:** one `theme-color` per scheme (`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />`), matched "to the color at the very top of your page, the header background, not the brand color"; with a class-based theme switch, "update the tag from JavaScript on toggle". MDN marks `theme-color` Limited availability ([theme-color](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color)). Not verified: several write-ups report that Safari 26 ignores it for its toolbar tint and samples the page's own background instead; webkit.org doesn't say so, so check on a device before relying on either.
- **On a phone, not emulation:** "run the dev server on `0.0.0.0`, open it by the machine's LAN IP"; on iOS open Safari's Develop menu and pick the device, on Android `chrome://inspect`; "Test on a phone that's a few years old", "with the keyboard open", "in landscape once", and as an installed PWA, since "standalone mode changes viewport, safe areas, and status bar behavior". "The Xcode Simulator is a step up from emulation but still misses touch feel."
- **The report:** "What was wrong", "What changed" (file and declaration, one line each), "What needs a phone" (verified from code against needs hardware). "Don't pad this into a report. The code is the deliverable."

## Direction

Write logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, `block-size`). In a right-to-left app a physical `left` or `right` is a bug, except: centring with `left: 50%` and a translate, code blocks (they read left to right), and parts measured in physical pixels at runtime. Don't mirror numeric dates and times either: in Arabic and Hebrew numbers are written left to right, so React Aria dropped `display: flex` on its date segments for normal flow and lets the Unicode Bidirectional Algorithm order them ("Improving Internationalization Support in Our Date and Time Components"). Script media queries use `rem` like the CSS.

- **Vertical writing modes, transforms that stay physical, and asking a model for logical properties:** [LAYOUT.md](LAYOUT.md#logical-properties) and [Physical against logical](LAYOUT.md#physical-against-logical).
- **Two logical forms models miss:** `float: inline-start` for `float: left` and `border-start-start-radius` for `border-top-left-radius` [Jakub Krehel, better-layout]. "`translateX` or `background-position: left` on mirrored UI" needs "a `[dir="rtl"]` override; neither has a logical form". app-ui keeps some physical on purpose: "menu rows enter from `x: -8` in both directions", and "a position measured with `getBoundingClientRect` is placed with `left: 0` plus `translate`".
- **Progression mirrors, digits don't:** star ratings, step indicators and progress bars run from the leading edge, so stars fill from the right in right-to-left; "never reorder digits by hand" [Jakub Krehel, better-layout; better-typography].
- **Safe areas are physical:** better-layout pairs each physical side with its inset and adds a `[dir="rtl"]` override (`right: calc(16px + env(safe-area-inset-right))`). app-ui maps them to logical tokens instead: "`--safe-area-inline-start` and `-end` map to the right and left insets, swapped under `:dir(ltr)`, so padding against a notch mirrors."
- **Text direction by length:** "A paragraph of three or more lines aligns to its own script instead, so an English paragraph stays start-aligned LTR even inside an RTL interface"; a one- or two-line snippet follows the interface [Jakub Krehel, better-typography].
- **`:dir(rtl)` over `[dir="rtl"]`** where you write a direction override: MDN says `[dir=…]` selectors "ignore elements that lack it, even if they inherit a direction", while "`:dir()` will match the value calculated by the user agent", `dir="auto"` included; Baseline since December 2023 ([MDN `:dir()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:dir)). The quoted `[dir="rtl"]` lines here are their sources' wording.
- **Format, then isolate:** "Bidi isolation only stops a *correct* string from flipping; it does not produce the right string" [skills-il, hebrew-rtl-best-practices]. `Intl.NumberFormat('he-IL', {style:'currency', currency:'ILS'})` gives `‏1,234.00 ‏₪` (RLM marks, the shekel after the number), not the source's `₪1,234`, and `Intl.DateTimeFormat('he-IL')` gives `18.10.2026` with dots (Node 26), so a slashed date needs an explicit format. Wrap a known-direction value in `<span dir="ltr">`, not `<bdo>`: W3C keeps `bdo` for "special cases, mostly educational" ([inline bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/)).
- **Still physical** [skills-il, hebrew-rtl-best-practices; not checked against MDN]: `box-shadow`, `text-shadow`, `linear-gradient` angles and `transform-origin` stay fixed when direction flips; flip each with a `:dir(rtl)` override when its direction means something. `row-reverse` inside a right-to-left flex row double-flips back to left-to-right order. Sliders and carousels reverse their swipe, and a chart's x-axis reverses through the chart library's option, since SVG has no logical properties.
- **Free text:** `dir="auto"` or `unicode-bidi: plaintext` picks the direction per value [skills-il, hebrew-rtl-best-practices]. Its "`dir="auto"` on every input" conflicts with app-ui: WHATWG auto directionality falls back to `ltr` for an empty value and ignores the placeholder, so app-ui uses "the page's direction until a letter (`\p{L}`) is typed, then the text's own" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
- **Portalled UI** (menus, dialogs, toasts) inherits DOM direction from its actual target: React `createPortal` accepts an existing DOM node, which need not be `<body>`. React context still follows the React tree. The source and old line assumed every portal mounted on body. Check the actual container and the library's direction setting. [React createPortal](https://react.dev/reference/react-dom/createPortal); Radix's Direction Provider "Enables all primitives to inherit global reading direction" ([Radix](https://www.radix-ui.com/primitives/docs/utilities/direction-provider)).
- **Tailwind:** "The existing `start-*` and `end-*` utilities are still available, but they're now deprecated in favor of `inset-s-*` and `inset-e-*`" (Tailwind blog, 2026-05-08, under features shipped in v4.2; the source says v4.3). landing-page-ui's reference code still uses `start-0` and `end-0`.

### Icons in right-to-left

"Under `dir="rtl"`, flip icons whose meaning is tied to reading direction, and leave the rest alone" [Jakub Krehel, better-ui; make-interfaces-feel-better has the same table]:

| Flip | Don't flip |
| --- | --- |
| Back and forward arrows, navigation chevrons | Logos and brand marks |
| Text-block glyphs for alignment, lists and indent | Checkmarks |
| Speaker and volume waves | Physical objects such as clocks, cups and pencils |
| Directional glyphs such as "send" | Media playback, which stays LTR by convention |

```css
[dir="rtl"] .icon-directional {
  scale: -1 1;
}
```

Tailwind: `rtl:-scale-x-100`. "Use one mechanism per element. Two flips on one icon can compound back to unflipped." "Analyze composite icons part by part. A badge or slash overlay may keep its position while the base glyph flips." Prefer an icon set's own right-to-left variants (the source names Material Symbols) over flipping, "because a flipped icon can mis-render fine detail or embedded text" [skills-il, hebrew-rtl-best-practices; unverified]. app-ui turns some chevrons rather than mirroring them: "a list group's or settings accordion's chevron is a down chevron turned 90deg in both directions".

## Enhancements, not the base

The owner's rule: inside `@supports` only, where the page works without them.

- `progress()` maps a value to 0 to 1 (clamped unless `no-clamp`): Baseline 2026, newly available since September 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/progress)).
- Typed arithmetic: `calc(100cqi / 1px)` gives a unitless number (MDN: "`100vw / 1px` is valid and results in a unitless value", [`calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc), [Using typed arithmetic](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Using_typed_arithmetic)). Chrome 140, Safari 26 and Firefox 158 (since 2026-10-13) ship it per browser-compat-data; MDN shows no Baseline label yet.
- `sibling-index()` and `sibling-count()` for staggers and counts: Baseline 2026, newly available since August 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)).
- `interpolate-size: allow-keywords` (animating to `height: auto`): Chromium only (Chrome and Edge 129), not Baseline, experimental ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size)); elsewhere the size changes instantly.

`@supports` still covers the browsers older than these releases.

## Don't build a system on them

The owner's rule: features one engine ships alone.

- `if()` and `@function`: Chromium only (Chrome and Edge 137 and 139), not Baseline, experimental ([MDN `if()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if), [MDN `@function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function)); [CSS-FUNCTIONS.md](CSS-FUNCTIONS.md#custom-functions-and-if).
- `@container scroll-state()`: Chrome and Edge 133 only, not Baseline ([SCROLL.md](SCROLL.md#scroll-state-queries)).
- `display: grid-lanes` (the shipped name for masonry): experimental, Safari 26.4 only ([MDN `display`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display), [Grid lanes guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Grid_lanes); [LAYOUT.md](LAYOUT.md#grid-and-subgrid)).
- `random()`: Safari 26.2 only, not Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/random)); niche decoration, not responsiveness.

## Enforce what a script can see

A check that fails the build on: 3px or more on spacing, size, type, radius or translate; any `vw`, `vi` or `vb` outside a rule marked as belonging to the whole screen (the owner's rule above); plain `vh`; physical properties. Older findings go in an allowlist file that only shrinks.

More rows a script can see, each with the fix its source gives:

| Pattern | Fix | Source |
| --- | --- | --- |
| `container-type: inline-size`, or Tailwind's `@container` class (an inline-size container), on a flex item, inline-block or absolute element with no width | Give it a definite width; "size containment collapses a shrink-to-fit box to zero" (MDN: elements with size containment "will collapse" without a size, [container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type)) | better-layout |
| `@md:` (any `@<size>:` variant) with no `@container` ancestor | Add `@container` to the wrapper that owns the space; without it the variants "silently never apply" | flornkm, prefer-container-queries |
| `@container` and a `@md:` variant on the same element | "The element cannot query itself; move the variant to a child or the container class to the parent" | flornkm, prefer-container-queries |
| `md:flex-row` (any viewport variant) on a component rendered inside a sidebar or modal | A container variant; the viewport one "will stay stacked or break depending on the viewport, not its actual space" | flornkm, prefer-container-queries |
| `env(safe-area-inset-*)` with no `viewport-fit=cover` in the viewport meta | Add it, or the insets resolve to `0` | better-layout, mobile-native |
| Sticky header with no `scroll-padding-block-start` | Set it to the header height | better-layout |
| `float: left` on mirrored UI | `float: inline-start` | better-layout |
| `touchmove` listener calling `preventDefault()` to stop overscroll | `overscroll-behavior` | mobile-native |
| `user-select: none` on `body` or `html` | Only on controls | mobile-native |
| User-agent sniffing to detect touch | `(hover)` / `(pointer)` media queries | mobile-native |
| `user-scalable=no` or `maximum-scale=1` | 16px inputs, fixing the cause | mobile-native |

## Prove it

Use the [mechanical checks](#enforce-what-a-script-can-see), [container-size checks](#a-fluid-scale-that-keeps-desktop-exact), [real-phone checks](#touch-and-browser-chrome) and [responsive verification](RESPONSIVE-FORKS.md#prove-it) for the parts in scope. Keep the owner's documented exceptions above.
