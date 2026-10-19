# Reveals: clip-path, blur and the generation reveal

Ways to show something appearing or changing without moving it: a clip that uncovers it, a blur that bridges two states, and the reveal for UI an AI just produced. Sources: Emil Kowalski's `animate` and `emil-design-eng` skills, transitions.dev (its `transitions-ui-generation` and `transitions-polish` skills, described in our words with short credited fragments, because its license forbids republishing a substantial part of the collection), and motion.dev for what the browser accelerates.

## How an inset clip reveals

"`clip-path: inset(top right bottom left)` defines a rectangular clipping region. Each value 'eats' into the element from that side" [Emil Kowalski, emil-design-eng]:

```css
/* Fully hidden from right */
.hidden {
  clip-path: inset(0 100% 0 0);
}

/* Fully visible */
.visible {
  clip-path: inset(0 0 0 0);
}
```

- **What it costs:** a clip changes no layout, but don't call it composited. motion.dev lists `clip-path` as browser-dependent: "Chrome is adding support for `background-color` and `clip-path` soon" ([motion.dev](https://motion.dev/docs/performance)). The skill calls its WAAPI clip and its comparison slider "Hardware-accelerated" and "fully hardware-accelerated"; the official page doesn't support that. The property tiers are in [PERFORMANCE.md](PERFORMANCE.md#what-each-property-costs).

## Hold to confirm

For a destructive action "where a plain click is too easy to fire by accident" [Emil Kowalski, animate]:

```css
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out); /* release: snappy */
}

.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;             /* press: slow and deliberate */
}

.button:active {
  transform: scale(0.97);
}
```

- "`linear` is correct here - the fill is a progress indicator, and progress shouldn't ease" [Emil Kowalski, animate].
- **Slow where the user decides, fast where the system answers:** "Slow on the deliberate phase (a hold-to-confirm press: 2s linear), snappy on the system response (release: 200ms ease-out)" [Emil Kowalski, animate]. For a plain tap the other rule holds: Kiem presses in faster than he releases ([PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback)). One is a hold, the other a tap.

## Tabs whose colours change together

"Duplicate the tab list. Style the copy as the active state - different background, different text color. Clip the copy so only the active tab shows, and animate the clip on change" [Emil Kowalski, animate]:

```css
.tabs-active-copy {
  clip-path: inset(0 60% 0 20%); /* driven by the active tab's position */
  transition: clip-path 250ms var(--ease-in-out);
}
```

- "The text and background change together, in perfect sync, because they're one element being revealed rather than two colors being interpolated" [Emil Kowalski, animate].
- app-ui's segmented tabs slide a pill instead: "A white pill on a tinted track springs to the chosen tab and stretches with its speed" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#segmented-tabs)).

## An image revealed on scroll

"Marketing surfaces only. Don't do this to functional UI a user visits daily" [Emil Kowalski, animate]:

```css
.reveal {
  clip-path: inset(0 0 100% 0);
  transition: clip-path 600ms var(--ease-in-out);
}

.reveal[data-visible] {
  clip-path: inset(0 0 0 0);
}
```

- "Trigger with `IntersectionObserver`, or Motion's `useInView` with `{ once: true, margin: "-100px" }`. Fire it once - re-animating on every scroll-by is an interface fighting its reader" [Emil Kowalski, animate]. motion.dev documents `margin` in CSS margin format, as in "0px -20px 0px 100px" ([motion.dev](https://motion.dev/docs/react-use-in-view)).
- [PATTERNS.md](PATTERNS.md#scroll-linked-motion) reveals by 8-16 px of travel over 300-500 ms; this one by a clip over 600 ms. Both play once.

## A before-and-after slider

"Overlay two images. Clip the top one with `clip-path: inset(0 50% 0 0)`. Adjust the right inset value based on drag position. No extra DOM elements needed" [Emil Kowalski, emil-design-eng]. Drag handling is in [GESTURES.md](GESTURES.md).

## Blur bridges a crossfade

"When a crossfade between two states feels off despite trying different easings and durations, add subtle `filter: blur(2px)` during the transition." "Without blur, you see two distinct objects during a crossfade - the old state and the new state overlapping… Blur bridges the visual gap by blending the two states together" [Emil Kowalski, emil-design-eng]:

```css
.button-content {
  transition: filter 200ms ease, opacity 200ms ease;
}

.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

- Keep animated blur under 20px [Emil Kowalski, emil-design-eng]; the cost is in [PERFORMANCE.md](PERFORMANCE.md#what-each-property-costs).
- **Blur softens a swap or a slide, not a plain fade:** blur is the "pre" state that settles to 0, and it doesn't belong on a plain fade or a colour or theme change [transitions.dev].
- Motion's `reducedMotion="user"` keeps filter animations running, so a blurred swap needs its own reduced-motion branch ([PERFORMANCE.md](PERFORMANCE.md#reduced-motion)).

## AI output that builds itself in

transitions.dev's generation reveal plays over UI an AI feature just returned: a dotted wireframe traces the component, then the real UI wipes in behind a scan line. Described here, not copied; the runtime is theirs.

- **When:** an AI feature returns UI (a generated component, a chart, a summary card, a draft): play it once when the result arrives. Several results at once: one each, about 260 ms apart. Never on small inline UI (under about 120 px: a badge, one button) or on UI that appears often (route changes, list rows): "a generation animation is a moment, not a loading state" [transitions.dev].
- **Not a loading state:** show a skeleton while the data loads and play the reveal over the real UI when it arrives; never gate interaction on it [transitions.dev].
- **Its timeline, as fractions of one duration** (2400 ms by default, kept between 1600 and 3600 ms: shorter leaves the parts phase too brief to read, longer starts to "feel like waiting"): a dot field ripples from the centre (0-0.30) while a probe line sweeps; guides run along the four edges (0.04-0.30); the outline draws from top centre in two halves (0.10-0.42); the parts trace in document order (0.28-0.74); the real UI reveals behind a scan line (0.74 to just past 1); the wireframe cleans up (0.84-1.04). Change only the duration and every phase scales with it [transitions.dev].
- **The reveal itself:** the element stays at opacity 0 until its turn, then fades in while a top-to-bottom `inset()` clip uncovers it and a 3 px blur sharpens to 0. The clip is padded 80 px past the element's sides so its own shadow stays inside, and runs past the bottom edge so the shadow below comes in with it; afterwards the element's own inline `opacity`, `clip-path`, `filter` and `transition` are restored [transitions.dev].
- **Grey for the working layer:** the drawing stays monochrome, grey dots standing for "the agent's working layer", and colour arrives only with the real UI [transitions.dev].
- **Decoration only where there is room:** the optional side text samples `document.elementFromPoint` on a small grid over each candidate area and uses it only where every hit is the page or the element's own containers, falling back from side panels to a strip below, to a single step line, to nothing, so it degrades on narrow screens and dense layouts [transitions.dev].
- **Wiring:** run it after render at final size, after `await document.fonts.ready` (and images that size the layout); not on `display: none` content (in tabs or accordions, run it after opening); don't animate the element yourself or scroll an `overflow: hidden` parent during the run [transitions.dev]. `document.fonts.ready` "resolves once the document has completed loading fonts, layout operations are completed" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready)).
- **Reduced motion:** no drawing; the element fades in over 200 ms ease-out [transitions.dev].
- **Not the owner's apps:** app-ui motion "finishes within 1s. Nothing animates on first render that the user didn't cause" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)). This reveal is for products that choose it.

## Prove it

Hold a hold-to-confirm button and let go halfway: the fill snaps back fast; hold it through: the action fires exactly when the fill completes. Switch tabs on the clipped tab list: text and background change in the same frame. Scroll a revealed image out and back in: it doesn't replay. Record a blurred crossfade in Safari at 4x CPU slowdown: no dropped frames. For the generation reveal: run it on a component with web fonts on a cold load (the outline matches the final text), on a narrow screen (the side text falls away), and with reduced motion on (a 200 ms fade, nothing drawn).
