# Core: tweens, vars, transforms, eases, stagger, defaults, matchMedia

The core engine is one call shape: `gsap.method(targets, vars)` returns a Tween you can store and control. CSSPlugin ships in core, so DOM and SVG elements animate with no registration; everything else here is core too except CustomEase, which is a plugin. Sequencing several tweens is in [TIMELINES.md](TIMELINES.md); the helpers used inside vars (`random`, `distribute`, `snap`) are in [UTILS.md](UTILS.md). Durations, curves and stagger budgets for interface motion stay in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md); this file is the GSAP syntax for them.

**Contents:** [Tween methods](#tween-methods) · [Common vars](#common-vars) · [Transforms and CSS properties](#transforms-and-css-properties) · [Targets](#targets) · [Stagger](#stagger) · [Eases](#eases) · [Controlling a tween](#controlling-a-tween) · [Function-based and relative values](#function-based-and-relative-values) · [Defaults](#defaults) · [Responsive and reduced motion with gsap.matchMedia()](#responsive-and-reduced-motion-with-gsapmatchmedia) · [Prove it](#prove-it)

## Tween methods

[GreenSock, gsap-core]

- **`gsap.to(targets, vars)`**: animate from the current state to `vars`. Most common.
- **`gsap.from(targets, vars)`**: animate from `vars` to the current state (good for entrances).
- **`gsap.fromTo(targets, fromVars, toVars)`**: explicit start and end; no reading of current values.
- **`gsap.set(targets, vars)`**: apply immediately (duration 0).

Always use **property names in camelCase** in the vars object (`backgroundColor`, `marginTop`, `rotationX`, `scaleY`).

## Common vars

[GreenSock, gsap-core]; defaults checked against https://gsap.com/docs/v3/GSAP/Tween

- **duration**: seconds (default 0.5).
- **delay**: seconds before start.
- **ease**: string or function. Prefer built-in: `"power1.out"` (default), `"power3.inOut"`, `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`, `"none"`.
- **stagger**: a number (seconds between) like `0.1`, or an object: `{ amount: 0.3, from: "center" }`, `{ each: 0.1, from: "random" }`.
- **overwrite**: `false` (default), `true` (immediately kill all active tweens of the same targets), or `"auto"` (when the tween renders for the first time, only kill individual overlapping properties in other **active** tweens of the same targets). The Tween docs: with `false`, "no overwriting strategies will be employed" (https://gsap.com/docs/v3/GSAP/Tween). The interruption rule this serves is ui-animation's "Interruptible always" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)).
- **repeat**: a number, or `-1` for infinite. **yoyo**: with repeat, alternates direction.
- **onComplete**, **onStart**, **onUpdate**: callbacks, scoped to the Animation instance itself (Tween or Timeline).
- **immediateRender**: `true` by default for **from()** and **fromTo()**, so the start state is applied as soon as the tween is created (no flash of unstyled content; works well with staggered timelines). The Tween docs add that any tween with a ScrollTrigger also gets `true`. When **several from() or fromTo() tweens** target the same property of the same element, set **`immediateRender: false`** on the later ones, or the first tween's end state is overwritten before it runs and the second animation may not be visible.
- **from() uses the element's current state as the end state;** its initial values are applied immediately unless `immediateRender: false` is in the vars.

## Transforms and CSS properties

[GreenSock, gsap-core]

Prefer GSAP's **transform aliases** over the raw `transform` string: they apply in a consistent order (translation, scale, rotationX/Y, skew, rotation; order verified against the docs), are more performant, and work reliably across browsers.

| GSAP property | Equivalent CSS / note |
|---|---|
| `x`, `y`, `z` | translateX/Y/Z (default unit: px) |
| `xPercent`, `yPercent` | translateX/Y in %; use for percentage-based movement; work on SVG |
| `scale`, `scaleX`, `scaleY` | scale; `scale` sets both X and Y |
| `rotation` | rotate (default: deg; or `"1.25rad"`) |
| `rotationX`, `rotationY` | 3D rotate (rotationZ = rotation) |
| `skewX`, `skewY` | skew (deg or rad string) |
| `transformOrigin` | transform-origin (`"left top"`, `"50% 50%"`) |

In GSAP's source, CSSPlugin also aliases `rotate`, `rotateZ` and `rotationZ` to `rotation`, so `rotate:` works, though the docs only name `rotation` (gsap-a findings, src/CSSPlugin.js).

- **autoAlpha**: prefer it over `opacity` for fade in and out. At `0`, GSAP also sets `visibility: hidden` (better rendering and no pointer events); at any other value, `visibility: inherit`. It avoids invisible elements blocking clicks.
- **CSS variables** animate: `"--hue": 180`, `"--size": 100`.
- **svgOrigin** (SVG only): like `transformOrigin` but in the SVG's **global** coordinate space (`svgOrigin: "250 100"`), for several SVG elements that rotate or scale around one point. Only one of `svgOrigin` or `transformOrigin` can be used on an element; no percentages; units optional. CSS's own fix for the SVG origin, `transform-box: fill-box`, is in [svg CSS-ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CSS-ANIMATION.md).
- **Directional rotation**: append a suffix to a rotation string: **`_short`** (shortest path), **`_cw`** (clockwise), **`_ccw`** (counter-clockwise), on `rotation`, `rotationX` and `rotationY`. `rotation: "-170_short"` turns 20° clockwise instead of 340° counter-clockwise **when the element starts at 170°**, the start the docs example assumes and the skill leaves out; `rotationX: "+=30_cw"`.
- **clearProps**: a comma-separated list of property names (or `"all"` / `true`) to **remove** from the inline style when the tween completes, so a class or other CSS takes over. Clearing any transform property (`x`, `scale`, `rotation`) clears the **entire** transform.

```javascript
gsap.to(".box", { x: 100, rotation: "360_cw", duration: 1 });
gsap.to(".fade", { autoAlpha: 0, duration: 0.5, clearProps: "visibility" });
gsap.to(svgEl, { rotation: 90, svgOrigin: "100 100" });
```

Which properties to animate at all (transform and opacity, not `width`, `height`, `top`, `left`) is in [PERFORMANCE.md](PERFORMANCE.md).

## Targets

[GreenSock, gsap-core]

A CSS selector string, an element reference, an array or a NodeList. GSAP handles arrays; use stagger to offset them. In a component, scope selectors or use refs ([REACT-AND-LIFECYCLE.md](REACT-AND-LIFECYCLE.md#scope-every-selector)).

## Stagger

[GreenSock, gsap-core]

```javascript
gsap.to(".item", {
  y: -20,
  stagger: 0.1
});
```

The object form sets how each successive offset is applied across the targets array: `from: "random" | "start" | "center" | "end" | "edges" | (index)`, with `amount` or `each` as in the vars above. Grid staggers and values spread by position are `gsap.utils.distribute()` ([UTILS.md](UTILS.md#distributeconfig)). Learn more: https://gsap.com/resources/getting-started/Staggers. How long a stagger may run in total is in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md).

## Eases

[GreenSock, gsap-core]

Use string eases unless a custom curve is needed:

```javascript
ease: "power1.out"     // default feel
ease: "power3.inOut"
ease: "back.out(1.7)"  // overshoot
ease: "elastic.out(1, 0.3)"
ease: "none"           // linear
```

Built-in eases come as base (same as `.out`), `.in`, `.out` and `.inOut`; "power" is the strength of the curve (1 is more gradual, 4 is steepest):

```
base (out)        .in                .out               .inOut
"none"
"power1"          "power1.in"        "power1.out"       "power1.inOut"
"power2"          "power2.in"        "power2.out"       "power2.inOut"
"power3"          "power3.in"        "power3.out"       "power3.inOut"
"power4"          "power4.in"        "power4.out"       "power4.inOut"
"back"            "back.in"          "back.out"         "back.inOut"
"bounce"          "bounce.in"        "bounce.out"       "bounce.inOut"
"circ"            "circ.in"          "circ.out"         "circ.inOut"
"elastic"         "elastic.in"       "elastic.out"      "elastic.inOut"
"expo"            "expo.in"          "expo.out"         "expo.inOut"
"sine"            "sine.in"          "sine.out"         "sine.inOut"
```

**Use only documented ease names.** An unknown string is not an error: GSAP falls back to the default ease, so the tween still runs, on the wrong curve (GSAP 3.15 source, gsap-a and gsap-b findings).

### A CSS cubic-bezier curve needs CustomEase

Custom curves come from CustomEase, a plugin you register; a CSS-style `"cubic-bezier(...)"` string is never parsed, with or without it, so the tween falls back to the default ease (GSAP 3.15 source). Pass the four bare numbers instead: `CustomEase.create("name", ".17,.67,.83,.67")`. The measurement and EasePack are in [PLUGINS.md](PLUGINS.md#customease-and-the-ease-family).

landing-page-ui's header menu does this: it registers CustomEase and builds `CustomEase.create("site-header-menu", "0.23,1,0.32,1")` for the curve its table documents as "Nav height | .22s `cubic-bezier(.23, 1, .32, 1)`" ([site-header-menu-motion.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/header/bar/site-header-menu-motion.ts), [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)).

## Controlling a tween

[GreenSock, gsap-core]

Every tween method returns a **Tween**. Store it when you need to control playback:

```javascript
const tween = gsap.to(".box", { x: 100, duration: 1, repeat: 1, yoyo: true });
tween.pause();
tween.play();
tween.reverse();
tween.kill();
tween.progress(0.5);
tween.time(0.2);
tween.totalTime(1.5);
```

Prefer a timeline to chaining tweens with `delay` ([TIMELINES.md](TIMELINES.md)).

## Function-based and relative values

[GreenSock, gsap-core]

A function as a vars value is called **once for each target** the first time the tween renders, and its return value is the animation value:

```javascript
gsap.to(".item", {
  x: (i, target, targetsArray) => i * 50, // first item animates to 0, the second to 50, the third to 100, etc.
  stagger: 0.1
});
```

A `+=`, `-=`, `*=` or `/=` prefix makes a value **relative** to whatever it is when the tween first renders: `x: "-=20"` animates to 20px less, `"+=20"` adds 20, `"*=2"` doubles, `"/=2"` halves. Default units: x and y in px, rotation in deg.

landing-page-ui's title letters use both a function value and a util inside it: `rotate: () => gsap.utils.random(-8, 8)` ([animated-title-text.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/motion/animated-title-text.tsx)).

## Defaults

[GreenSock, gsap-core]

Set project-wide tween defaults once:

```javascript
gsap.defaults({ duration: 0.6, ease: "power2.out" });
```

The values to put there follow ui-animation's "One motion language per product" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)) and its numbers in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md). Per-timeline defaults are in [TIMELINES.md](TIMELINES.md#timeline-defaults).

## Responsive and reduced motion with gsap.matchMedia()

[GreenSock, gsap-core]; behaviour checked against https://gsap.com/docs/v3/GSAP/gsap.matchMedia/

**gsap.matchMedia()** (GSAP 3.11+) runs setup code only while a media query matches; when it stops matching, every animation and ScrollTrigger created in that run is **reverted automatically**. Use it for breakpoints and for **prefers-reduced-motion**.

- **Create:** `let mm = gsap.matchMedia();`
- **Add a query:** `mm.add("(min-width: 800px)", () => { gsap.to(...); return () => { /* optional custom cleanup */ }; });`
- **Revert all:** `mm.revert();` (on component unmount).
- **Scope (optional):** a third argument (element or ref) scopes selector text inside the handler: `mm.add("(min-width: 800px)", () => { ... }, containerRef);`

**Conditions syntax:** one object of named queries avoids duplicate code; the handler gets `context.conditions`, a boolean per condition:

```javascript
mm.add(
  {
    isDesktop: "(min-width: 800px)",
    isMobile: "(max-width: 799px)",
    reduceMotion: "(prefers-reduced-motion: reduce)"
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions;
    gsap.to(".box", {
      rotation: isDesktop ? 360 : 180,
      duration: reduceMotion ? 0 : 2  // skip animation when user prefers reduced motion
    });
    return () => { /* optional cleanup when no condition matches */ };
  }
);
```

- **Do not nest gsap.context() inside matchMedia:** matchMedia creates a context internally; use `mm.revert()` only.
- **`gsap.matchMediaRefresh()`** "Immediately reverts all active/matching MatchMedia objects and then runs any that currently match" (https://gsap.com/docs/v3/GSAP/gsap.matchMediaRefresh()), for a site's own reduced-motion toggle.

**How much to reduce, both ways.** GreenSock: respecting prefers-reduced-motion matters for users with vestibular disorders; "Use `duration: 0` or skip the animation" [GreenSock, gsap-core]. ui-animation: "**Reduce, don't remove:** with reduced motion, movement becomes short fades; feedback and state changes stay" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md)). Keep ui-animation's rule: use the `reduceMotion` condition to swap movement for a short fade, not to zero every tween. landing-page-ui agrees with ui-animation for its menu ("Nav height ... .15s" under reduced motion, [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)) and sets its title letters straight to visible.

landing-page-ui reads reduced motion differently from the GSAP skill: "Reduced motion is read through the library's hook everywhere except the title letters, which check the media query once on mount" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)). gsap.matchMedia() is the GSAP route that re-runs and reverts when the setting changes while the page is open.

## Prove it

- Every ease string is a name from the table or a registered CustomEase; no `"cubic-bezier("` string appears in GSAP vars.
- Stacked `from()` / `fromTo()` tweens on one property play every step visibly; the later ones carry `immediateRender: false`.
- Hover in and out fast, ten times, on anything with an enter and a leave tween: it retargets without fighting (`overwrite: "auto"` or one reused tween).
- Toggle reduced motion with the page open: matchMedia handlers re-run, and movement becomes short fades with every state change still visible.
- Faded-out elements built with `autoAlpha` take no clicks.
