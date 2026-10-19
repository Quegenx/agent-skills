# Dark mode and gamut

Building the dark palette, picking one theme-switching mechanism, increased contrast per appearance, and keeping every color inside the gamut it renders in, with P3 as an enhancement. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged; numbers marked "computed" were checked with an sRGB, OKLab and Display P3 implementation (binary search for the maximum chroma). `light-dark()`, `color-scheme` and Adam Argyle's page and component strategies are in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#light-dark-and-color-scheme); the `color-gamut` and `prefers-contrast` queries are in [modern-css QUERIES-AND-PREFERENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/QUERIES-AND-PREFERENCES.md#color-scheme-and-contrast).

## A dark palette is not the light one reversed

[Jakub Krehel, better-colors] "Reversal is the starting point, not the output." Swap the semantic roles first, then tune the values:

```css
:root {
  --color-bg-page: var(--neutral-50);
  --color-text-primary: var(--neutral-950);
}

.dark {
  --color-bg-page: var(--neutral-950);
  --color-text-primary: var(--neutral-50);
}
```

Three things almost always need hand-tuning after the swap:

- **Vividness comes down.** "A color that reads as confident on white reads as neon on near-black. Dark appearances need the accent a step or two less vivid."
- **The dark end needs more separation.** "Steps distinguishable as pale backgrounds collapse into each other as dark surfaces."
- **Contrast does not survive the mirror.** APCA scores mirrored pairs differently (Lc +88.5 one way, -91.4 mirrored, computed), so recheck every pair in both appearances ([CONTRAST.md](CONTRAST.md#the-sign-of-lc)).

When the product ships a dark appearance, "every custom color needs a dark variant".

- **The other view** [Jakub Krehel, oklch-skill]: reverse the mapping (`:root { --color-bg: var(--color-50); --color-text: var(--color-950); } .dark { --color-bg: var(--color-950); --color-text: var(--color-50); }`), because "oklch's perceptual uniformity means equal L steps in both directions produce equally readable results"; its checklist says "Dark mode with hand-picked colors → Derive from light palette by reversing L mapping". No doc supports the readability claim, and APCA's asymmetry contradicts it; better-colors' checklist flags "Dark tokens equal to the light ramp in reverse step order" as the thing to fix.
- **Owner's design:** app-ui's dark mode is hand-built and violet-tinted, copied 1:1 from tor-app ([tokens.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/base/tokens.css)); it stays as designed.
- **Owner's design:** landing-page-ui keeps the brand button fill "the same brand color (it does not lighten)" in dark ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)), and app-ui's solid badge fills "hold one value in both themes" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)); the owner wins over "a step or two less vivid" there.

## Choosing the switching mechanism

[Jakub Krehel, better-colors] Use one mechanism throughout:

- **`prefers-color-scheme` alone** is correct with no theme toggle. "Nothing to persist, nothing to hydrate."
- **A `.dark` class** is required as soon as users can override the system setting. The media query then sets only the initial value.
- **`light-dark()`** collapses both values into one declaration. It needs `color-scheme: light dark` and reads that property rather than a class, "so a class-based toggle must set `color-scheme` too" (confirmed on [MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)).

```css
:root {
  color-scheme: light dark;
  --color-bg: light-dark(#ffffff, #172554);
}
```

"A media query setting some tokens and a class setting others gives a half-themed interface the moment a user overrides their system preference." The owner's landing head script sets the dark class, `data-theme` and `color-scheme` on `<html>` before paint ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md#theme-before-paint)).

## Increased contrast, per appearance

[Jakub Krehel, better-colors] "Users who enable increased contrast expect visibly stronger differentiation in each appearance":

```css
:root {
  --color-accent-solid: var(--blue-600);
}

@media (prefers-contrast: more) {
  :root { --color-accent-solid: var(--blue-900); }
}

@media (prefers-color-scheme: dark) {
  :root { --color-accent-solid: var(--blue-400); }
}

@media (prefers-color-scheme: dark) and (prefers-contrast: more) {
  :root { --color-accent-solid: var(--blue-200); }
}
```

"A single `prefers-contrast` block shared by both appearances darkens the color on a dark background too, lowering contrast there. The increased-contrast variant widens the gap to its background by at least `0.15` of OKLCH `L` over the default. Remeasure it, aiming for Lc 90 on body text. Widening the gap without remeasuring is not fixing it."

## Gamut

[Jakub Krehel, better-colors] "Every sRGB color exists in Display P3, but not the reverse. The extra room is only at high chroma and varies by hue. At OKLCH `L` `0.65`, green gains about `0.07` of chroma while blue gains about `0.015`" (computed 0.073 and 0.015).

- A color more vivid than its display can render gets gamut-mapped (better-colors adds "which in current browsers mostly means clipped"; not verified on MDN). "It flattens neighbouring steps into one rendered color, so the top of a ramp can lose its distinctions on an sRGB screen."
- "Generate ramps against sRGB unless the product is display-restricted, and add P3 as an enhancement."

### Max chroma depends on lightness and hue

[Jakub Krehel, oklch-skill] "The gamut boundary is irregular." At L 0.5 in sRGB (computed 0.292, 0.20, 0.085):

- Highest chroma: purple (H ≈ 285) at C ≈ 0.29
- Red-orange (H ≈ 0 to 30): C ≈ 0.20
- Lowest chroma: cyan (H ≈ 195) at C ≈ 0.09

"The peak hue shifts with lightness. At L=0.7 magenta peaks, at L=0.9 green peaks" (computed: H 330 at 0.314; H 130 at 0.242). The skill adds "Cyan consistently has the lowest max chroma", which is wrong at L 0.9: the lowest there is blue, H 270 at 0.048, against cyan's 0.154 (computed). Check the hue you have at the L you have. At L 0.623 the sRGB maximums are blue H 250 0.176, green H 145 0.196, red H 25 0.253 (computed).

### Gamut clamp

[Jakub Krehel, oklch-skill] "If a color's chroma exceeds the maximum for its L/H/space, it clips. The fix: reduce chroma while keeping L and H constant." The skill's clamped value, `oklch(0.7 0.22 150)`, is still outside sRGB, whose maximum at L 0.7, H 150 is 0.193 (computed); the value below is that maximum rounded down:

```css
/* Out of sRGB gamut */
oklch(0.7 0.35 150)

/* Clamped to max chroma */
oklch(0.7 0.192 150)
```

The same applies after a contrast fix: moving L toward either end at a fixed C can leave the gamut, so re-clamp C after moving L ([CONTRAST.md](CONTRAST.md#fix-a-failing-pair-only-on-request)).

### P3 as an enhancement

[Jakub Krehel, better-colors] Verified: `oklch(0.65 0.2 145)` is inside sRGB and `oklch(0.65 0.27 145)` is inside P3 and outside sRGB.

```css
.success {
  background: #11ad32; /* oklch(0.65 0.2 145), inside sRGB */
}

@media (color-gamut: p3) {
  .success {
    background: oklch(0.65 0.27 145);
  }
}
```

"Order matters. The sRGB value comes first, so an sRGB screen shows a color you chose rather than one the browser clipped. The P3 rule overrides only where it will render." Adam Argyle's cascade double declaration (`background: yellow; background: color(display-p3 1 1 0);`) is in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#wide-gamut-p3-with-an-srgb-fallback).

[Jakub Krehel, oklch-skill] The skill's version of this pattern uses `oklch(0.7 0.2 150)` as the sRGB value and `oklch(0.7 0.3 150)` as the P3 value; both are outside their gamut (maximums 0.193 sRGB and 0.269 P3, computed). In-gamut values, rounded down:

```css
/* sRGB fallback for all browsers */
.accent {
  color: oklch(0.7 0.192 150);
}

/* P3 enhancement for wider gamut displays */
@media (color-gamut: p3) {
  .accent {
    color: oklch(0.7 0.268 150);
  }
}
```

### A hex layer for browsers without oklch()

For browser matrices predating `oklch()`, the same layering works with `@supports` [Jakub Krehel, better-colors]:

```css
.accent {
  background: #3b82f6;
}

@supports (color: oklch(0 0 0)) {
  .accent {
    background: oklch(0.62 0.19 259);
  }
}
```

"Check the project's actual browser matrix before adding this. On a modern baseline it is dead weight." `oklch()` is Baseline widely available since May 2023 ([modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#lightness-lch-and-oklch-over-hsl)).

oklch-skill's version gives `#4ade80` as the hex fallback for `oklch(0.7 0.2 150)`, but `#4ade80` is `oklch(0.800 0.182 151.711)`, a different color (computed). The hex of the in-gamut `oklch(0.7 0.192 150)` is `#04be58` (computed; it round-trips to `oklch(0.701 0.192 149.954)`):

```css
.accent {
  color: #04be58;
}

@supports (color: oklch(0 0 0)) {
  .accent {
    color: oklch(0.7 0.192 150);
  }

  @media (color-gamut: p3) {
    .accent {
      color: oklch(0.7 0.268 150);
    }
  }
}
```

oklch-skill's "Display P3 covers ~50% more colors" and "96%+ global coverage" are not on MDN and are left out.

## Prove it

- Dark tokens are not the light ramp in reverse step order: the accent is less vivid in dark (unless the owner's design pins it), dark-end steps stay distinguishable, and every pair was remeasured in dark.
- One switching mechanism sets every color token; with a class toggle, the class also sets `color-scheme`.
- `prefers-contrast: more` has its own value per appearance, at least 0.15 L further from the background, remeasured.
- Every declared color's C is at or below the maximum for its L and H in sRGB, or in P3 inside `@media (color-gamut: p3)` after an sRGB declaration of the same property.
- Every hex fallback converts to the OKLCH value it stands in for.
