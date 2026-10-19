# Gradients and effects

CSS gradients as a drawing tool (double-position stops, transition hints, hard stops, hue interpolation routes), conic, radial and repeating recipes (a circular chart, a spinner, a diamond, a retro sun, noise, stripes, kaleidoscopes), mesh and noise backgrounds, animated gradient text, borders and box shadows, shapes and clipping (`shape()`, `shape-outside`, `corner-shape`, squircles, glitch), nested radii with `overflow-clip-margin`, `paint-order`, and the proposals for motion blur and long shadows. Source: Adam Argyle's nerdy.dev posts and notes, with current support from MDN and browser-compat-data (checked 2026-10-17). Code is copied from the posts. Many demos live only on CodePen, which the export could not fetch; those are described, not reconstructed. Colour spaces and `color-mix()` are in [COLOR.md](COLOR.md); SVG gradients, clip paths and masks are in [svg GRADIENTS-AND-PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/GRADIENTS-AND-PATTERNS.md) and [svg CLIP-AND-MASK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md); timing for anything that moves is in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md).

**Contents:** [Stops, hints and hard lines](#stops-hints-and-hard-lines) · [Interpolation routes](#interpolation-routes) · [Conic recipes](#conic-recipes) · [Radial and repeating recipes](#radial-and-repeating-recipes) · [Mesh and noise backgrounds](#mesh-and-noise-backgrounds) · [Animated gradient text](#animated-gradient-text) · [Borders, scrims and shadows](#borders-scrims-and-shadows) · [Shapes and clipping](#shapes-and-clipping) · [Nested radius with overflow-clip-margin](#nested-radius-with-overflow-clip-margin) · [paint-order on HTML text](#paint-order-on-html-text) · [Shake, glitch and motion blur](#shake-glitch-and-motion-blur) · [Prove it](#prove-it)

Support for the gradient functions themselves: `linear-gradient()` is Baseline widely available since 2018-01-29 (newly 2015-07-29; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient)); `conic-gradient()` since 2023-05-17 (newly 2020-11-17; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/conic-gradient)); CSS `mask` since 2026-06-07 (newly 2023-12-07; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask)).

## Stops, hints and hard lines

- **A stop can take two positions,** a start and an end, so one colour spreads over more of the gradient line: "Stops can have 2 positions on the line, a start and end. Most people don't know this!" [nerdy.dev: The Making of gradient.style](https://nerdy.dev/the-making-of-gradient.style)
- **Between any two stops sits a transition hint,** "a value that indicates how the stop should transition to the next stop" (MDN calls it `<color-hint>`, the point where the transition reaches its midpoint; MDN's example `conic-gradient(red 40grad, 80grad, blue 360grad)` moves the midpoint to the 20% mark, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/conic-gradient)). Same post.
- **Hard stops with double positions:** the note writes the first position of every stop after the first as `0%`. MDN: "Subsequent color-stops of lower value will override the value of the previous color-stop creating a hard transition" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient)). [nerdy.dev: Gradient Stripes With Hard Stops Visualized](https://nerdy.dev/gradient-stripes-with-hard-stops-visualized)

```css
.classic-gradient {
  background-image: 
    linear-gradient(45deg, 
      white, 
      black 0% 20%, 
      white 0% 40%, 
      black 0% 60%, 
      white 0% 80%, 
      black 0% 100%
    )
  ;
}
```

- **Hard stops with hints instead:** "I think most people prefer to use double stop syntax for this, but I've really come to love transition hints." A bare `0%` hint between two stops "bottoms out" the fade, and each colour then only states where it ends (the retro sun below is built this way). [nerdy.dev: A conic gradient diamond and okLCH](https://nerdy.dev/conic-gradient-diamond), [nerdy.dev: Retro Wave Gradient](https://nerdy.dev/retro-wave-sun)
- **A stop position of `0` after a variable:** in `conic-gradient(deeppink, cyan var(--ng), #0000 0)` the post's comment reads "gradient up to --ng, transparent after --ng" (the lower-value rule quoted above). The same rule gives a hard-stop slider fill from a 0 to 1 custom property (see [SELECT-AND-FORMS.md](SELECT-AND-FORMS.md)). [nerdy.dev: Circular gradient stroke chart](https://nerdy.dev/gradient-outline-circular-chart)
- **Things worth learning, per the gradient.style launch:** "double position syntax, transition hints, wide gamut color picking, hue interpolation methods, linear angle keywords, radial size keywords". In 2023 "Firefox doesn't fully support all the features yet"; the interpolation parts are now in all three engines (next section). [nerdy.dev: A next-gen HDR CSS gradient builder](https://nerdy.dev/a-next-gen-css-gradient-builder) (2023-04-21)
- **[gradient.style](https://gradient.style/)** is Adam's spec-compliant gradient builder: out of beta and [open-sourced](https://github.com/argyleink/gradient-style) with multiple background layers since 2025-08, and it exports custom properties rather than classes since 2024-11. Its URL options show the levers: type, `space` (for example `lch`), `interpolation` (`shorter`), `radial_size` (`farthest-corner`), stops in `color(display-p3 ...)`. [nerdy.dev: Gradient.Style Is Out Of Beta](https://nerdy.dev/gradient.style-is-out-of-beta), [nerdy.dev: Gradient Tool Now Exporting Custom Properties](https://nerdy.dev/gradient-tool-now-exporting-custom-properties)
- **Radial size keywords:** a note animates multiple hard stops in a radial gradient sized `farthest-corner` while moving the `x` position from `0` to `-100`, then `y` (media only). [nerdy.dev: Farthest Corner Visualized](https://nerdy.dev/farthest-corner-visualized)

## Interpolation routes

- **Hue takes the shorter route by default;** `in <polar space> shorter | longer | increasing | decreasing hue` picks another one when the short route "stinks". Support: `<hue-interpolation-method>` is Baseline newly available since June 2024 (Chrome 111, Firefox 127, Safari 16.2), syntax unchanged since the post ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hue-interpolation-method)). The ColorJS demos are on CodePen only. [nerdy.dev: Gradient hue interpolation](https://nerdy.dev/gradients-going-the-shorter-longer-increasing-or-decreasing-route) (2022-12-29)

```css
.gradient-with-hue-interpolation-specified {
  background: linear-gradient(
    to right in hsl longer hue, 
    oklch(63% 0.3 317), 
    oklch(63% 0.2 255)
  );
}
```

- **A rainbow from one colour:** `longer hue` from red to red goes all the way round. [nerdy.dev: Easy Hsl Rainbow](https://nerdy.dev/easy-hsl-rainbow)

```css
.vibrant-rainbow {
  background: linear-gradient(
    to right 
    in hsl      /* vibrant gradient HSL colorspace */
    longer hue, /* hue-interpolation set to longer */
    red, red    /* now red to red goes all the way around */
  );
}
```

- **A rainbow shadow button** combines `hue longer` interpolation with a little `blur()` (demo code not exported, CodePen zxYWPxr). [nerdy.dev: Rainbow Shadow Button](https://nerdy.dev/rainbow-shadow-button)
- **Adding a colour space without breaking old browsers:** keep an empty custom property in the gradient and fill it with `in oklch` under `@supports`, or repeat the whole gradient with `in oklch`. The full snippet is under [Animated gradient text](#animated-gradient-text). Gradient colour-space interpolation ships in Chrome 111, Firefox 127, Safari 16.2 (BCD). [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025)

## Conic recipes

- **Circular gradient stroke chart:** a conic gradient visible up to an angle, then transparent, with a radial-gradient mask hiding the inside. Start from a square circle, then add both gradients. [nerdy.dev: Circular gradient stroke chart](https://nerdy.dev/gradient-outline-circular-chart) (2023-02-12)

```css
#pie {
  aspect-ratio: 1;
  inline-size: 50vmin;
  border-radius: 50%;
}
```

```css
#pie {
  --ng: 120deg; /* can be set via slider */
  --thickness: 3px;

  --_inner: calc(70% - var(--thickness));
  --_outer: calc(var(--_inner) + 1px); /* fixes aliasing */
  
  /* hides the inner part of the conic gradient/element */
  mask: radial-gradient(circle, #0000 var(--_inner), #000 var(--_outer));
  
  /* gradient up to --ng, transparent after --ng */
  background-image: conic-gradient(deeppink, cyan var(--ng), #0000 0);
}
```

- **Anti-aliasing a mask edge:** put the opaque stop 1px past the transparent one (`--_outer: calc(var(--_inner) + 1px)`) instead of at the same position. anti-slop-ui does the same job with a percentage gap, `#0000 99%, #000 100%` ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md)). Same post.
- **A spinner from the same chart:** one colour, transparency first, ending in white. [nerdy.dev: Conic gradient Android spinner](https://nerdy.dev/android-spinner-conic-gradient-animation) (2023-02-19)

```css
#spinner {
  background-image: conic-gradient(#0000 270deg, white 0);
}
```

- **"my favorite way to make an infinite rotation animation"** uses the individual `rotate` property (Baseline widely available since 2025-02-05, newly 2022-08-05; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/rotate)), here on a sharp Open Props ease-out matched to the Android spinner ("ease-out-1 is the most subtle ease out, while ease-out-5 is dramatic"). Same post.

```css
@keyframes rotate {
  to {
    rotate: 1turn;
  }
}
```

```css
@import "https://unpkg.com/open-props/easings.min.css";

#spinner {
  animation: rotate .8s var(--ease-out-4) infinite;
}
```

- The two views on spinner easing (ui-animation's `linear` rule against this ease-out) are in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md).
- **A diamond from two conic gradients:** two placed conic gradients show as two circles; the bottom one uses transparency to make the triangle, the top one needs `clip-path` to notch the corners, hard stops come from transition hints, and the colours are Open Props okLCH shades. The author admits "a few magic numbers" and that it "turned out a little tall". Demo code not exported (CodePen VwEKJjJ); the bottom half, decoded from its gradient.style link, is a conic in `oklab`, angle 327, centred, `oklch(70% 0.5 340)`, hint, `oklch(50% 0.5 340)`, hint, `oklch(40% 0.5 340)`, hint, `transparent`. [nerdy.dev: A conic gradient diamond and okLCH](https://nerdy.dev/conic-gradient-diamond)

## Radial and repeating recipes

- **Retro wave sun:** the mask is a set of hard lines from colour hints; "As the visible area increases from the bottom, the 7 lines of invisible area decreases" ("changes of ±1%"). [nerdy.dev: Retro Wave Gradient](https://nerdy.dev/retro-wave-sun)

```css
.retro-wave {
  background: var(--gradient-1);

  mask: linear-gradient(
    to top,
    #000 1%,     /* 1% visible */
    0%,          /* hard line */
    #0000 8%,    /* 7% masked */
    0%,
    #000 10%,    /* 2% visible */
    0%,
    #0000 16%,   /* 6% masked */
    0%,
    #000 19%,    /* 3% visible */
    0%,
    #0000 24%,   /* 5% masked */
    0%,
    #000 28%,    /* 4% visible */
    0%,
    #0000 32%,   /* 4% masked */
    0%,
    #000 37%,    /* 5% visible */
    0%,
    #0000 40%,   /* 3% masked */
    0%,
    #000 46%,    /* 6% visible */
    0%,
    #0000 48%,   /* 2% masked */
    0%,
    #000 55%,    /* 7% visible */
    0%,
    #0000 56%,   /* 1% invisible */
    0%,
    #000 57%     /* visible til end */
  );
}
```

- **An animated hard line by transitioning only the hint:** zero the stop positions and move the hint through a custom property. `--size` must be registered with `@property` to transition (the post introduces `@property` in an earlier demo whose code is not exported; see [CUSTOM-PROPERTIES.md](CUSTOM-PROPERTIES.md)). [nerdy.dev: Learn With Jason (live in studio)](https://nerdy.dev/jason-and-adam-do-portland)

```css
html {
  transition: --size 1s var(--ease-spring-4);
  background-image: radial-gradient(
    circle at center, 
    black 0, 
    var(--size), 
    white 0
  );
}
```

- **A ring mask from a repeating radial gradient,** written with hints and hard stops. [nerdy.dev: Make some hacky noise with CSS gradients](https://nerdy.dev/hacky-css-noise-with-repeating-gradients) (2024-01-22)

```css
.noise {
  --lines: 4px;
  
  mask: repeating-radial-gradient(
    circle at center,
    #000,
    var(--lines),
    #000,
    0, /* transition hints make code easier to manage */
    #0000,
    calc(var(--lines) * 2),
    #0000 0 /* trailing 0 is part of the hard stop logic */
  );
}
```

- **Sub-pixel rings turn into noise** (subpixel rounding): set `--lines: 0.0003px;`. Animate between two tiny values with a registered property; the knobs are "the delta in values", the "values themselves" and the "duration", and the post suggests also trying reasonable values (`10px` lines, `.5s`). `@property` is Baseline newly available since July 2024 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property)). Same post.

```css
@property --lines {
  syntax: "<length>";
  inherits: false;
  initial-value: 0.00010px;
}
```

```css
@keyframes liner {
  50% {
    --lines: 0.00012px;
  }
}
```

```css
@import "https://unpkg.com/open-props/durations.min.css";

.noise {
  animation: liner var(--hour) linear infinite;
}
```

- **Repeating gradient text:** "CSS can repeat a repeating gradient". The clipping to text is in the CodePen (ByBdYyJ, not exported); the clip itself is the `background-clip: text` pair under [Animated gradient text](#animated-gradient-text). [nerdy.dev: Repeating Linear Gradient Text](https://nerdy.dev/repeating-linear-gradient-text)

```css
background: repeating-linear-gradient(
  to bottom, 
  #000 0px var(--_stripe-size), 
  #fff var(--_stripe-size) var(--_stripe-gap)
);
```

- **Four swirling corner gradients:** a vibrant radial gradient in each corner, sized so their colour crossovers swirl; the animated version interpolates each gradient's position with `@property` (CodePen abPxjpZ and MWZMxNN, not exported). [nerdy.dev: Swirling Animated 4 Corner Radial Gradient With @Property](https://nerdy.dev/swirling-animated-4-corner-radial-gradient-with-@property)
- **Kaleidoscopes:** linear, radial and conic kaleidoscopes driven by `linear()` easings with varied durations across animated `@property` values, for "hopefully infinite combinations" (CodePen ZYEQZaz, MYWKdbe, ByazRwM, pvobKJm; not exported). `linear()` is Baseline widely available since 2026-06-11 (newly 2023-12-11; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear)). [nerdy.dev: CSS Kaleidoscopes](https://nerdy.dev/css-kaleidoscopes) (2025-02-22)
- **Sticky gradient transitions:** sticky staggered offsets plus gradients make a transition effect, in a linear version and a trig (curved) version (CodePen gbPPpoX, ogbbXZx; not exported). [nerdy.dev: Sticky Gradient Transitions](https://nerdy.dev/sticky-gradient-transitions)

## Mesh and noise backgrounds

- **A fake mesh gradient today:** stacked radial gradients that fade to transparent at 50%, from the post's own demo. [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17)

```css
  .gradient-mesh-example {
    inline-size: 100%;
    aspect-ratio: var(--ratio-widescreen);
    background-color:#99ffec;
    background-image:
      radial-gradient(at 28% 80%, hsl(302 77% 71%) 0px, #0000 50%),
      radial-gradient(at 22% 12%, hsl(260 78% 72%) 0px, #0000 50%),
      radial-gradient(at 78% 39%, hsl(146 66% 75%) 0px, #0000 50%),
      radial-gradient(at 44% 6%,  hsl(188 98% 65%) 0px, #0000 50%),
      radial-gradient(at 84% 87%, hsl(239 80% 69%) 0px, #0000 50%),
      radial-gradient(at 29% 21%, hsl(278 91% 69%) 0px, #0000 50%),
      radial-gradient(at 19% 49%, hsl(32 73% 79%)  0px, #0000 50%);
  }
```

- **Real mesh gradients are a proposal only:** `freeform-gradient()` (csswg-drafts #7648); no browser ships it. Same post.

```css
.mesh-gradient-proposal {
  background-image: freeform-gradient(hotpink 2% 2%, cyan 60% 40%, purple 90% 100%);
}
```

- **Noise:** the sub-pixel repeating gradient above is Adam's CSS-only noise.
- **Two views.** anti-slop-ui lists "Grids, dot patterns, blueprint lines, noise, blobs and mesh gradients stacked" as a template tell under decorative backgrounds ([anti-slop-ui PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PATTERNS.md)), while saying it "doesn't ban techniques. It rejects technique without a purpose" ([anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md)). Adam presents mesh and noise as techniques to enjoy and to want natively ("Who wouldn't want these delicious capabilities?").

## Animated gradient text

- **The full snippet:** theme-adaptive colours, typed `<color>` properties that animate inside the gradient, an interpolation space added by feature test, and both prefixed and unprefixed text clipping. [nerdy.dev: 6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025) (2025-01-19)

```css
@property --color-1 {
  syntax: "<color>";
  inherits: false;
  initial-value: #000;
}

@property --color-2 {
  syntax: "<color>";
  inherits: false;
  initial-value: #000;
}

@keyframes color-change {
  to {
    --color-1: var(--_color-1-to);
    --color-2: var(--_color-2-to);
  }
}

.gradient-text {
  --_space: ;

  /* light mode */
  --_color-1-from: yellow;
  --_color-1-to: orange;
  --_color-2-from: purple;
  --_color-2-to: hotpink;

  /* dark mode */
  @media (prefers-color-scheme: dark) {
    --_color-1-from: lime;
    --_color-1-to: cyan;
    --_color-2-from: cyan;
    --_color-2-to: deeppink;
  }

  --color-1: var(--_color-1-from);
  --color-2: var(--_color-2-from);

  animation: color-change 2s linear infinite alternate;

  background: linear-gradient(
    to right var(--_space),
    var(--color-1),
    var(--color-2)
  );

  /* old browser support */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* modern browser version */
  background-clip: text;
  color: transparent;

  @supports (background: linear-gradient(in oklch, #fff, #fff)) {
    --_space: in oklch;
  }
}
```

- **The steps behind it,** each from the post: keep the `-webkit-` pair "so older browsers continue to support the effect" and add the unprefixed pair after; start `--_space` empty and set `in oklch` under `@supports` (or repeat the gradient with `in oklch`); register the two colours as `<color>` so they animate "beyond spinning or moving gradient images around"; hold from and to colours in plain custom properties and swap them in the dark query. Support: `background-clip: text` is Baseline widely available (Chrome 120, Firefox 49, Safari 14 for the unprefixed value; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-clip)).
- **Copy pitfall in the post's intermediate step:** it writes `--color-1: lime --color-2: orange;` (a missing `;`) and, in prose, spells `--color-1` in `transition: --color-1 .3s ease` with an en dash instead of the two hyphens. Write `--color-1: lime; --color-2: orange;` and `transition: --color-1 .3s ease`. The final snippet above is correct.
- **The snippet's infinite animation has no reduced-motion gate.** Gate motion as [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md) describes.
- **Two views on whether to use it.** Adam himself: "Animated gradient text is like the poster child of AI right now" ([nerdy.dev: Animated Gradient Text](https://nerdy.dev/animated-gradient-text), 2024-12-20). anti-slop-ui lists "the default gradient" (blue to purple, blue to cyan, purple to pink) as a template tell ([anti-slop-ui PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PATTERNS.md)). For shimmering status text, app-ui uses a mask instead of `background-clip: text`, because the clip hides letters positioned by a morph ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md)).
- A gradient glowing text effect exists as a CodePen only (abXvVME, no description). [nerdy.dev: Gradient Glowing Text Effect](https://nerdy.dev/gradient-glowing-text-effect)

## Borders, scrims and shadows

- **A shine that runs along a rounded border:** paint a solid colour into `padding-box` and the shine gradient into `border-box`, then animate the background. "The trick is specifying which box on the node to paint into ... as the background is animated, the 130deg shine gradient is shown only over the border-box." The 45%/55% stops are "a neat little trick ... with color stop positions". The `@keyframes shine` body is not in the post. Its purpose: it "draws the eye from the placeholder text to the submit button". [nerdy.dev: LLM chat prototype](https://nerdy.dev/llm-chat-prototype) (2025-07-28)

```css
form {
  border: 2px solid #0000;
  border-radius: 20px;

  background: 
    linear-gradient(var(--bg) 0 0) padding-box, 
    linear-gradient(130deg, 
      var(--bg) 45%, 
      color-mix(in srgb, Canvas, CanvasText 15%), 
      var(--bg) 55%
    ) border-box;
  background-size: 300%;
  animation: shine 6s infinite ease-in-out;
}
```

- **`background-clip: padding-box` "prevents background bleeding under border"** (Nice Select). [nerdy.dev: Nice Select](https://nerdy.dev/nice-select)
- **A border that thins out as it fades:** a gradient `border-image` transparent at both ends (`--indigo-6` is an Open Props token). Support: `border-image` is Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image)). [nerdy.dev: Rad Border Image CSS One Liner](https://nerdy.dev/rad-border-image-css-one-liner)

```css
.effect {
  border-image: 
    linear-gradient(
      transparent, 
      var(--indigo-6), 
      transparent
    ) 
    1 / 4px /* slice n' size */
  ;
}
```

- **An adaptive caption scrim with no JS:** `border-image: fill` paints a translucent single-colour conic over the element, flipping with `light-dark()` (built on Temani Afif's border-image techniques). Automatic and forced colour-scheme selection follow the [corrected rule in COLOR.md](COLOR.md#light-dark-and-color-scheme); our old scrim line required `light dark` everywhere. MDN notes "some browsers don't render the border image if border-style is none or border-width is 0"; test the `fill 0` form in your targets. [nerdy.dev: Adaptive Scrim](https://nerdy.dev/adaptive-scrim) (2024-09-08), [MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)

```css
.card > figcaption {
  color: light-dark(#000, #fff);
  border-image: fill 0 conic-gradient(light-dark(#fff8, #0008) 0 0);
}
```

- anti-slop-ui's image scrims are eased gradients from a helper instead ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md)); this one is a flat translucent band.
- **An animated radial gradient box shadow** on a `<dialog>` or `[popover]` (CodePen abezozz, not exported). anti-slop-ui flags "Glow everywhere": "Glowing cards, buttons, icons, badges, borders and background together" ([anti-slop-ui PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/PATTERNS.md)). [nerdy.dev: Animated Radial Gradient Box Shadow Effect](https://nerdy.dev/animated-radial-gradient-box-shadow-effect)
- **A bouncy focus effect:** `box-shadow` transitioned on a `linear()` bounce easing (CodePen XWOOydB, not exported). app-ui: "No control shows a focus ring, outline or focus border" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#focus)). [nerdy.dev: Neat Bouncy Focus Effect With Linear And Box Shadow](https://nerdy.dev/neat-bouncy-focus-effect-with-linear-and-box-shadow)
- **Pitfall: an infinite `box-shadow` spread does not make a backdrop;** the post's warning is in [CSS-INFINITY.md](CSS-INFINITY.md). [nerdy.dev: CSS Infinity Use Cases](https://nerdy.dev/css-infinity-use-cases) (2026-07-25)

### Shadow as border tokens

[Jakub Krehel, make-interfaces-feel-better] The `--shadow-border` recipe (a three-layer light ring, a single white ring in dark mode, dividers, table cells and input outlines kept as borders) is in [anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#surfaces-and-image-outlines).

## Shapes and clipping

- **`shape()` draws clip paths in CSS units:** "Draw complex clipping paths using standard CSS syntax and dynamic units (like `rem` or `calc()`) instead of being locked into rigid SVG pixel coordinates." Support: Baseline newly available since 2026-02-24 (Chrome 135, Firefox 148, Safari 18.4; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/shape)). More in [svg CLIP-AND-MASK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md). [nerdy.dev: CSS Recently In All Browsers](https://nerdy.dev/CSS-recently-in-all-browsers) (2026-04-26)
- **`shape-outside` with `xywh()` and `rect()`** wraps text around exact geometry "without relying on images or clip-paths". The post listed Chrome 150 (soon), Safari 18, Firefox 149; browser-compat-data now says Chrome 149, Firefox 149, Safari 17.2. `shape-outside` itself is Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/shape-outside)). Same post.
- **Squircles:** `clip-path: shape()` now, "while we wait for `corner-shape: squircle`" (CodePen zxGyJgm; a [GUI by Zoran](https://codepen.io/ZoranJambor/pen/xbZxbaR)). Superellipsed pill shapes are another `corner-shape` demo (CodePen PwNEYPK). [nerdy.dev: Squircles](https://nerdy.dev/squircles) (2025-09-26), [nerdy.dev: Superellipsed Pill Shapes Are Cool](https://nerdy.dev/superellipsed-pill-shapes-are-cool). The "while we wait" line is stale for Chromium: browser-compat-data (fetched 2026-10-18) lists `corner-shape` with every keyword, `squircle` included, in Chrome 139, and Firefox and Safari only in preview. So `shape()` is the cross-browser squircle and `corner-shape: squircle` the Chromium progressive enhancement ([BCD](https://github.com/mdn/browser-compat-data/blob/main/css/properties/corner-shape.json)).
- **`corner-shape: superellipse(1.25)`** gives Nice Select its squircle corners "(with fallback)". MDN: `corner-shape` "sets the shape of an element's corners when using `border-radius`", so where it is unsupported the corners are the plain radius. Support: not Baseline, experimental, Chromium 139+; Firefox and Safari in preview only (BCD above) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape)). [nerdy.dev: Nice Select](https://nerdy.dev/nice-select) (2026-02-03)

### corner-shape and superellipse()

MDN's [corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape) and [superellipse()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse) pages, checked 2026-10-18. `corner-shape` "specifies the shape of a box's corners, within the area specified by its `border-radius`"; it takes 1 to 4 values, clockwise from top-left.

| Keyword | Equals |
|---|---|
| `square` | `superellipse(infinity)` |
| `squircle` | `superellipse(2)` |
| `round` (initial) | `superellipse(1)` |
| `bevel` | `superellipse(0)` |
| `scoop` | `superellipse(-1)` |
| `notch` | `superellipse(-infinity)` |

- **`superellipse(K)`** takes `<number> | infinity | -infinity`, "replacing the `2` exponent in each case with 2<sup>K</sup>" (2 to the power K): `0` is a straight line, `1` an ellipse, above `1` more square, and "values of `10` or more are virtually indistinguishable from a square"; negative values are concave, and "A negative or positive superellipse would appear symmetrical to a superellipse with its inverse value." The same shape can look different "if the box size or `border-radius` values differ."
- **The decorations follow the shape:** "Borders, outlines, shadows, and background effects applied to the container will follow the defined corner shape" (`background-color`, `background-image`, `border`, `outline`, `box-shadow`, `overflow`, `backdrop-filter`). A clip path cuts shadow and outline off instead, which is the reason to prefer `corner-shape` where it ships.
- **It needs a radius:** "If a `border-radius` is not applied to a container, or the `border-radius` resolves to `0`, `corner-shape` will have no effect." It also has no effect when `border-shape` is set.
- **It animates:** "Different `corner-shape` values can be smoothly animated between".
- **Detect the fallback** with `@supports not (corner-shape: scoop)`, as MDN's examples do; unsupported browsers draw the plain `border-radius`.
- **A designer's "60% smoothing" is close to `squircle`.** [corner-smoothing] The gabrielobholz corner-smoothing skill defaults to 60% ("Treat 60% as the Apple/iOS-style target"; the Figma and Apple parity is that skill's claim, not checked). Its generator draws the curve with exponent `n = 2 + 3.35 * smoothing`, so 60% gives n 4.01, and since MDN's exponent is 2<sup>K</sup>, K = log2(4.01), about 2.004, which is `squircle` (K 2); 0% gives n 2, K 1, `round`. The path generator for SVG, Canvas and `clip-path: path()` is in [svg PATHS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/PATHS.md#smoothed-corners-squircles-as-a-path).
- **A scaling clip-path hover,** "nice, n' simple". `clip-path` is Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path)), and `scale` since 2025-02-05 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scale)). [nerdy.dev: Scaley Mask Image Hover](https://nerdy.dev/scaley-mask-image-hover)

```css
img:hover {
  scale: 1.2;
  clip-path: inset(10% round 20px);
}
```

## Nested radius with overflow-clip-margin

- **The wobble:** a rounded child inside a rounded parent (a card with a button, a section with a footer) shows mismatched curves. The fix Oriol Brufau mentioned in CSSWG issue 7707: `overflow` on the `content-box` with `overflow-clip-margin`. [nerdy.dev: A use case for CSS overflow-clip-margin, nested border radii](https://nerdy.dev/perfect-nested-radius-with-overflow-clip-margin) (2023-03-07)

```css
.the-trick-tldr {
  overflow: clip;
  overflow-clip-margin: content-box;
}
```

- **Support:** the post said "No Safari; Firefox doesn't support the `content-box` value; ... Chrome only". MDN today: Limited availability, not Baseline; syntax `<visual-box> || <length>`, the visual box defaulting to `padding-box` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-clip-margin)). browser-compat-data now lists the `content-box` value in Chrome 104 and Firefox 148, not in Safari. The post's comparison demo (custom property and `overflow-clip-margin` solutions) is CodePen mdGMqOJ, not exported.
- app-ui computes the inner radius instead: "an element inset in a rounded one gets the outer radius minus the inset" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).

## paint-order on HTML text

- **"Here's a fun use case for CSS `paint-order`"** (CodePen MWoeoKV, not exported). On HTML text MDN pairs it with `-webkit-text-stroke-color` and `-webkit-text-stroke-width`; its example is `.stroke-behind { paint-order: stroke fill; }`, which paints the stroke first, under the fill. Support: Baseline widely available since 2026-09-22 (newly 2024-03-22; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/paint-order)). SVG text outlining is in [svg SHAPES-AND-TEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/SHAPES-AND-TEXT.md#paint-order). [nerdy.dev: CSS Paint Order](https://nerdy.dev/css-paint-order) (2024-04-26)

## Shake, glitch and motion blur

- **Screen shake on a web button:** "Screen shakes are so cool in video games... Web buttons can do that!" (CodePen xxepgOJ, not exported). For timing, ui-animation's error shake is 2 to 3 horizontal shakes over 300 to 400 ms with no bounce ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)). [nerdy.dev: A Screen Shake Web Animation](https://nerdy.dev/a-screen-shake-web-animation)
- **Glitch:** grungy `clip-path: polygon()` keyframes plus `transform` keyframes; the [demo](https://gui-challenges.web.app/glitch/dist/) includes a generator for grungy polygons. Video only, code not exported. [nerdy.dev: Thinking on GLITCH effects](https://nerdy.dev/thinking-on-ways-to-solve-glitch-effects)
- **Automatic motion blur** is an open CSSWG issue (#3837), not a feature. [nerdy.dev: CSS Motion Blur](https://nerdy.dev/css-motion-blur) (2024-06-29)
- **Manual motion blur is a proposal** (csswg-drafts #11134): `motion-blur`, with `linear()`, `radial()` and `progressive()` forms, possibly as `filter: linear-blur()` instead. No browser ships it. [nerdy.dev: CSS Wishlist 2025](https://nerdy.dev/css-wishlist-2025) (2024-12-17)

```css
.example {
  motion-blur: progressive(10px, to bottom);
}
```

- **A blur on a view transition today** comes from adding keyframes to the generated group animation; that trick and its limits are in [VIEW-TRANSITIONS.md](VIEW-TRANSITIONS.md). [nerdy.dev: View Transitions can swoop‽](https://nerdy.dev/swoop-there-it-is)
- **Long shadows** take "a lot of annoying repetition of text shadows" today; `text-shadow: stretch 1em 2em hotPink;` and Eric Meyer's `loooong` keyword are proposals only. Same wishlist post.

## Prove it

- **Hard stops:** zoom in on every hard line; a stop of `0` or a `0%` hint produces no visible fade band.
- **Chart mask:** at `--thickness: 3px` the ring's inner edge is smooth, not stair-stepped; removing the `+ 1px` makes it jagged.
- **Interpolation fallback:** in a browser without gradient interpolation the gradient still paints (the empty `--_space` keeps the declaration valid); with it, DevTools shows `in oklch` in the computed `background`.
- **Gradient text:** in every target browser the letters show the gradient (the clip applied; where it doesn't, the transparent fill leaves the text invisible); under `prefers-reduced-motion: reduce` nothing animates once you add the gate.
- **Noise:** the sub-pixel noise keeps 60fps in the Performance panel on the slowest target device before you ship it.
- **Mesh or noise background:** it is in the design direction, and the page has no other stacked decorative background (anti-slop-ui's tell).
- **`corner-shape` and `overflow-clip-margin`:** in Firefox or Safari the element still has acceptable rounded corners (fallback radius, or app-ui's computed inner radius).
- **`corner-shape` decorations:** in Chrome the element's `box-shadow`, `outline` and border follow the squircle (a clip would cut them); every element with `corner-shape` has a non-zero `border-radius`; the `@supports not (corner-shape: scoop)` branch was viewed in Firefox or Safari.
- **Adaptive scrim:** the caption scrim follows automatic or forced colour-scheme selection as described in [COLOR.md](COLOR.md#light-dark-and-color-scheme).
- **Proposals stay out of shipping code:** search for `freeform-gradient`, `motion-blur`, `text-grow` and `loooong`; none ship without a fallback.
- **No dashes:** a search of GRADIENTS-AND-EFFECTS.md for em and en dash characters finds none.
