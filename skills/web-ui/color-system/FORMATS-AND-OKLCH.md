# Formats and OKLCH

Which notation to write colors in, what OKLCH's channels mean, how to convert without side effects, and how a gradient's interpolation space changes its look. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged. The browser-feature side of `oklch()`, `color-mix()`, relative color and `light-dark()` (support, syntax, Adam Argyle's recipes) is in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md); gamut and P3 are in [DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#gamut).

## Choosing a notation

[Jakub Krehel, better-colors] Every other rule in this skill is stated perceptually and holds whatever notation you write.

| Notation | Good for | Weakness |
| --- | --- | --- |
| Hex | Universal support, compact, what design tools hand you | Opaque. No channel is readable or editable by hand |
| `rgb()` | Same reach as hex, readable alpha | Channels do not correspond to anything a designer thinks about |
| `hsl()` | Channels look like design controls | Its lightness is not perceptual and its hue drifts; a ramp built by varying lightness bunches at one end and shifts hue |
| `oklch()` | Perceptually uniform lightness, stable hue, predictable ramps | Baseline 2023, so very old browser matrices need a fallback |

- **Match whatever the project already uses.** "Notation is not a defect: a project on hex is not doing it wrong." "A consistent hex system beats hex with `oklch()` scattered through it." [Jakub Krehel, better-colors]
- **For a genuinely new color system, `oklch()` is the best default.** "Even lightness steps stay even, and a fixed hue stays fixed." Everywhere else, a color library produces the same ramp in the project's own notation ([PALETTES.md](PALETTES.md#use-a-color-library)). [Jakub Krehel, better-colors]
- **oklch-skill goes further:** its checklist row is "Hex/rgb/hsl color in new code → Convert to `oklch()`". better-colors keeps the project's notation. [Jakub Krehel, oklch-skill]
- **Owner's design:** app-ui writes its tokens in hex (`--background: #ffffff;`, `--primary: #0866ff;` in [tokens.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/base/tokens.css)) and its checker accepts "hex, `rgb()`, `hsl()`, `oklch()`" on token definition lines ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)); the owner's notation wins there.

## Why OKLCH

[Jakub Krehel, oklch-skill] "OKLCH is a perceptually uniform color space where the numbers actually mean what you think they mean." Explore values on the author's tool, [oklch.fyi](https://oklch.fyi).

- **Perceptual uniformity.** "Equal L steps = equal brightness. `oklch(0.5 ...)` is visually mid. HSL's `lightness: 50%` varies wildly by hue." `hsl(60, 100%, 50%)` (yellow) and `hsl(240, 100%, 50%)` (blue) "have the same HSL lightness but wildly different perceived brightness."
- **Stable hue.** "HSL blue shifts toward purple as lightness changes. OKLCH hue stays constant across the full lightness range."
- **Independent chroma.** "Chroma is an absolute measure of colorfulness that doesn't depend on lightness. HSL saturation does."
- **Finite gamut.** "Not every oklch value maps to a displayable sRGB color. High-chroma values at certain hues will clip." The limits are in [DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#max-chroma-depends-on-lightness-and-hue).

## Syntax and channels

[Jakub Krehel, oklch-skill]

```
oklch(L C H)
oklch(L C H / alpha)
```

| Channel | Range | Description |
| --- | --- | --- |
| L (Lightness) | 0 to 1 | 0 = black, 1 = white. Perceptually uniform. |
| C (Chroma) | 0 to ~0.4 | Colorfulness. 0 = gray. Max depends on L and H. |
| H (Hue) | 0 to 360 | Hue angle in degrees. |
| alpha | 0 to 1 | Optional transparency. Slash syntax. |

```css
oklch(0.637 0.237 25.331)
oklch(0.8 0.05 200 / 0.5)
```

- **Formatting:** "L and C use 3 decimal places, H uses up to 3. Drop trailing zeros. Format `-0` as `0`."
- **Alpha uses the forward slash, never a comma. Omit alpha when it's 1.** `rgba(0, 0, 0, 0.1)` becomes `oklch(0 0 0 / 0.1)`.
- **Perceived lightness throughout this skill means OKLCH `L`, from `0` to `1`.** [Jakub Krehel, better-colors]

## Hue drift in HSL ramps

[Jakub Krehel, oklch-skill] `hsl(240, 80%, 20%)` and `hsl(240, 80%, 90%)` "are not the same perceptual hue. The light variant shifts ~18° toward purple." To detect it in an existing HSL palette:

1. Convert each step to oklch
2. Compare the H values across steps
3. If the hue spread is greater than 10°, the palette has visible drift

```css
/* HSL blue ramp - hue shifts toward purple */
hsl(240, 80%, 20%)  →  oklch H ≈ 269
hsl(240, 80%, 50%)  →  oklch H ≈ 267
hsl(240, 80%, 90%)  →  oklch H ≈ 285  /* shifted 18° */
```

The three H values are correct (computed 269.3, 266.7, 285.2). The 10° threshold is the skill's own; it cites no source.

- **ui-animation's chart source derives every variant from HSL** ([ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md)): "`color` takes any CSS colour, converted to HSL, and every variant (line, fill gradient, glow, badge, grid labels) is derived from it." better-colors' checklist says "`hsl(` ramp values that differ only in lightness → Rebuild in OKLCH with a constant hue". That file already records "Neither wins"; keep it that way.

## Converting

[Jakub Krehel, better-colors] Convert when the user asks, when an agreed migration is in scope or when the project is standardizing on a notation and this value is the straggler. "Never convert an isolated value in a project that deliberately uses something else and never because this skill happened to load."

When conversion is in scope, change the values and nothing else:

- Leave CSS keywords alone: `currentColor`, `inherit`, `transparent`, `initial`, `unset`.
- Leave gradient functions alone. Convert the color stops inside them; do not touch the interpolation method.
- Leave colors in third-party configs that expect a specific format (oklch-skill: "Colors in third-party library configs that expect hex input").
- Preserve comments and formatting.

Input formats [Jakub Krehel, oklch-skill]:

| Format | Examples |
| --- | --- |
| Hex (3/6/8-digit) | `#f00`, `#ff0000`, `#ff000080` |
| `rgb()` / `rgba()` | `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)` |
| `hsl()` / `hsla()` | `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)` |

Conversion examples [Jakub Krehel, oklch-skill], each value checked by computation:

```css
/* Before */
color: #3b82f6;
background: #1e293b;
border-color: #e2e8f0;

/* After */
color: oklch(0.623 0.188 259.815);
background: oklch(0.279 0.037 260.031);
border-color: oklch(0.929 0.013 255.508);
```

```css
/* Before */
color: rgb(59, 130, 246);
border: 1px solid rgba(0, 0, 0, 0.1);

/* After */
color: oklch(0.623 0.188 259.815);
border: 1px solid oklch(0 0 0 / 0.1);
```

**Bulk conversion** [Jakub Krehel, oklch-skill], when converting an entire file:

1. Replace all hex colors with their oklch equivalents
2. Replace all `rgb()`, `rgba()`, `hsl()`, `hsla()` function calls
3. Leave gradient functions unchanged, only convert the color stops within them
4. Leave `currentColor`, `inherit`, `transparent`, and CSS keywords as-is
5. Preserve comments and formatting

"Bulk conversion is a migration, not cleanup. It shifts every rendered color by a rounding margin and touches files nobody asked about, so it has to be the task rather than a side effect." [Jakub Krehel, better-colors]

## Derived colors resolve at render time

[Jakub Krehel, better-colors]

- **`color-mix()`** derives one color from another, as in `color-mix(in oklab, var(--color-accent-solid) 15%, white)` for a tinted background. "Useful for states, but keep generated values out of the token layer, since a mixed color cannot be inspected in a design tool."
- **Relative color syntax** adjusts one channel: `oklch(from var(--color-accent-solid) calc(l - 0.1) c h)` darkens the accent by hand. "Powerful and easy to overuse, since a token defined by three chained derivations is unreadable."
- **`light-dark()`** puts both appearances in one declaration ([DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#choosing-the-switching-mechanism)).
- "All three resolve at render time. Compute the resolved value with a color library, or measure the rendered result, before reporting contrast."
- **Owner's design:** app-ui keeps opaque tints as `color-mix()` tokens (`color-mix(in srgb, var(--foreground) 5%, var(--background))`, [app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)) and mixes `in srgb`; the owner's tokens win there.

## Gradient interpolation spaces

[Jakub Krehel, better-colors] "The interpolation space is a look, not a correctness setting." Default to `in oklab`, and reach for `in oklch` when a two-hue gradient goes gray in the middle. Hue routes and `@supports` for `in oklch` are in [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#interpolation-routes).

```css
/* sRGB: the default and the classic. Midpoint darkens and mutes. */
background: linear-gradient(#3b82f6, #ec4899);

/* oklab: even brightness across the transition. The best default. */
background: linear-gradient(in oklab, #3b82f6, #ec4899);

/* oklch: travels around the hue wheel, staying vivid throughout. */
background: linear-gradient(in oklch, #3b82f6, #ec4899);
```

- `oklab` and sRGB are **rectangular**, interpolating in a straight line; `oklch` is **polar**, interpolating the hue angle, "so it arcs around the wheel through every hue between the stops." "A blue-to-pink gradient routes through purple, which is either the look or a surprise."
- **The gray dead zone is a rectangular-space problem.** Two hues on opposite sides of the wheel pass near gray in a straight line. "Either switch to a polar space, which routes around the axis, or add a third stop between the two and keep the space you have."
- **Direction** in a polar space:
  ```css
  /* The short way round, usually what you want */
  background: linear-gradient(in oklch shorter hue, #3b82f6, #ec4899);

  /* The long way, sweeps most of the spectrum */
  background: linear-gradient(in oklch longer hue, #3b82f6, #ec4899);
  ```
- **Banding shows up on large areas.** A low-contrast gradient across a hero "steps visibly on 8-bit displays. Widen the contrast, shrink the area or overlay a subtle noise texture."
- **Keep text off gradients where you can.** "Contrast varies continuously across one", so measure the worst region rather than the average, or put a scrim behind it.
- **A ramp is not a gradient:** for a ramp the interpolation space is not a choice, "because sRGB interpolation produces muddy mid-steps" ([PALETTES.md](PALETTES.md#use-a-color-library)).

## Prove it

- No value was converted outside an asked-for or agreed migration; keywords, interpolation methods, third-party configs and comments are untouched.
- Every converted value round-trips: convert it back with a color library and it matches the original to the rounding margin.
- Alpha uses the slash and is omitted at 1; L and C carry at most 3 decimals.
- An HSL ramp's steps, converted to OKLCH, stay within the hue spread you report.
- No token is defined by a chain of derivations ("three chained derivations is unreadable"), and every derived color you reported contrast for was resolved or measured as rendered.
