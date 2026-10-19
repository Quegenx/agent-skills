# Palettes

What a color system is made of, which step does which job, and how to generate ramps that hold their hue, space their lightness and agree across hues. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged; numbers marked "computed" were checked with an OKLab, WCAG 2 and APCA implementation. Token names for the steps are in [TOKENS-AND-NAMING.md](TOKENS-AND-NAMING.md); the dark ramp is in [DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md); auditing an existing palette is in [AUDIT.md](AUDIT.md#inventory-an-existing-palette).

## A system is ramps, not colors

[Jakub Krehel, better-colors] "One neutral ramp, one accent ramp and only the status ramps the product actually renders. A `warning` ramp nothing imports is maintenance for zero pixels. A second accent hue earns its place only when two things must be distinguishable at a glance. Otherwise use more steps of the one accent ramp."

| Ramp | How many | Notes |
| --- | --- | --- |
| Neutral | 1 | Carries 80 to 90% of the interface: backgrounds, borders, body text |
| Accent | 1 | The brand hue. Interactive and selected states |
| Status | 0 to 4 | `danger`, `warning`, `success`, `info`. Add one only when the product shows that state |

## Every step has a job

[Jakub Krehel, better-colors] "A ramp is not a gradient to pick from by eye. Each step exists because a role needs it." Do not generate a step no role consumes.

| Role | Tailwind | Radix |
| --- | --- | --- |
| Page background | `50` | `1` |
| Subtle background | `50` | `2` |
| Component background | `100` | `3` |
| Component hover | `200` | `4` |
| Component active / selected | `200` | `5` |
| Subtle border, separator | `200` | `6` |
| Border, focus ring | `300` | `7` |
| Hovered border | `400` | `8` |
| Solid fill | `600`, measured per hue (below) | `9` |
| Solid fill hover | `700` | `10` |
| Low-contrast text | `700` | `11` |
| High-contrast text | `900` | `12` |

The Radix column matches the step use cases in [Radix's scale docs](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), which name them in their own words ("App background", "UI element background", "Solid backgrounds", "Hovered solid backgrounds" and so on).

- **Radix defines its 12 steps by role.** Step 9 is "the solid fill" in every ramp and appearance; the dark scale is a separate ramp reusing the same numbers, so `--accent-9` is the fill in both and component CSS never changes.
- **Tailwind defines its 11 steps by lightness.** `50` is light, `950` is dark, so the mapping holds in light mode and inverts in dark, with the page background at `950` and high-contrast text at `50`. Components either swap step numbers per appearance or read a semantic token that swaps once.
- "Match whichever the project uses. For a new system prefer Radix's model, because a role-defined step survives a theme change that a lightness-defined step does not. On Tailwind, keep `50` to `950` and put the role mapping in the semantic tier."
- "Where the table repeats a step, those roles render identically. A design that needs, say, component hover and subtle border to differ needs a 12-step ramp."

### The solid fill under white text: measure it

better-colors says "Solid fill sits on `600` because white text on most Tailwind `500` hues fails 4.5:1" and its checklist says "move the fill to `600`". The first half holds: white passes 4.5:1 on no Tailwind v3 `500` hue (indigo is the best at 4.47:1, computed). The fix does not hold for about half the palette. White on the v3 `600` step, computed:

| Fails 4.5:1 | Passes 4.5:1 |
| --- | --- |
| orange 3.56, amber 3.19, yellow 2.94, lime 3.09, green 3.30, emerald 3.77, teal 3.74, cyan 3.68, sky 4.10 | red 4.83, blue 5.17, indigo 6.29, violet 5.70, purple 5.38, fuchsia 4.71, pink 4.60, rose 4.70 |

Radix splits its scales the same way: "Scales designed for dark foreground text: sky, mint, lime, yellow, amber" ([Radix, Composing a palette](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette)). So measure the fill and its text for each hue ([CONTRAST.md](CONTRAST.md#pick-text-polarity-from-the-background)).

## Neutrals

[Jakub Krehel, better-colors]

- "A pure gray ramp is a perfectly good default. It sits under any accent hue without competing and never needs revisiting when the brand color changes."
- Tinting the neutral toward the accent is "a stylistic option, not a correction": OKLCH chroma `0.005` to `0.02` at the accent's hue. "Enough to measure, not enough to name."
- "Warm neutrals, hue toward orange, read approachable and editorial; cool ones, toward blue, read technical and precise. Whichever you pick, including none, hold it across the whole ramp." A warm gray border on a cool gray background is visible even when neither color is nameable alone.
- "Neutrals carry the most roles, so they need the most steps. Never generate fewer neutral steps than accent steps."
- Open Props' tinted grays from `--gray-hue` and `--gray-chroma` are in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#oklch-palettes-from-one-hue); app-ui's dark ramp "leans toward the brand hue" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).

## Status colors

[Jakub Krehel, better-colors] "Convention constrains status hues before taste does. Red reads as danger, amber as warning, green as success." Cultural exceptions are in [TOKENS-AND-NAMING.md](TOKENS-AND-NAMING.md#color-across-cultures).

- **Keep every status hue at least `15°` of OKLCH hue from the accent.** Anything within `15°` reads as the same color. "If the brand is red, danger cannot also be red. Where convention leaves nowhere to move, give the destructive action a distinct treatment, such as an outlined button with an icon, or it reads as the primary action."
- **Status ramps need fewer steps than the accent.** "Most render four roles: a background, a border, a solid fill and text." Generate the full ramp only where the product styles status components across the whole range.

## Start from the brand color

[Jakub Krehel, better-colors] Two decisions come before any ramp exists:

- **Which step does it occupy?** A brand color meant for buttons and links belongs on the solid-fill step, `600` in Tailwind and `9` in Radix, so the primary button renders the actual brand color.
- **Is it pinned or snapped?** "Pin a contractually fixed brand color. It stays exact, the ramp builds outward from it and that one step spaces slightly unevenly. Otherwise snap it onto the ramp so the spacing stays regular, which almost always looks better."
- "A brand color that fails contrast behind white text is still the brand color, just not the solid-fill step. Put it where it lands and use a darker step for interactive fills. Never quietly darken the brand." `#3b82f6` lands on `500` and fills use `600`, because white on `#3b82f6` measures 3.68:1 (computed); white on v3 blue-600 measures 5.17:1.

## What a correct ramp looks like

[Jakub Krehel, better-colors] Checkable against any output in any notation:

- **Lightness changes steadily, measured in OKLCH `L`.** HSL lightness is not perceptual, and evenly spaced HSL values bunch at one end.
- **Hue is constant end to end.** "A wandering hue reads as two colors blended and will not sit correctly against a neutral built on a different hue."
- **Vividness peaks in the middle and falls off at both ends.** "Holding full vividness into the extremes gives a `50` that glows and a `950` like ink spilled on the brand."
- **Steps are finer at the light end.** Keep `50` to `200` about `0.04` to `0.05` apart in OKLCH `L` and mid-ramp steps about `0.07` to `0.10`. Tailwind v3 blue measures 0.039, 0.050, 0.073, 0.095, 0.091 (computed). "Even spacing across the whole range leaves too few pale steps, so `100` is already too dark for a subtle surface."
- **No two adjacent steps are indistinguishable.** "Adjacent steps less than `0.03` apart in OKLCH `L` mean the ramp has more steps than decisions. Drop one."
- **Both ends stop short of pure black and white.** "A ramp that reaches them loses its identity exactly where the page background lives."

## Use a color library

[Jakub Krehel, better-colors] "Never compute these by hand or by eye. `culori`, `colorjs.io` and `chroma.js` all convert between notations, measure perceived lightness and interpolate perceptually." Read the brand color in whatever format it arrives, do the math in a perceptual space and emit the project's notation:

```js
import { formatHex, interpolate, samples } from 'culori'

// Perceptual interpolation, hex in and hex out.
const ramp = interpolate(['#eff6ff', '#3b82f6', '#172554'], 'oklab')
const steps = samples(11).map((t) => formatHex(ramp(t)))
```

The API matches [culori's docs](https://culorijs.org/api/): `interpolate(colors, mode = "rgb", overrides)`, and `samples(n)` gives n equally spaced values in [0, 1] with 0 and 1 at the ends. "This is a starting point. Linear sampling spaces lightness evenly within each segment, so check the output against the properties above and tighten `50` to `200` by hand." "For a ramp the interpolation space is not" a choice, "because sRGB interpolation produces muddy mid-steps."

For comparison, the Tailwind **v3** blue ramp, in hex, has the finer light end the generated one lacks:

```css
:root {
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-200: #bfdbfe;
  --blue-300: #93c5fd;
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
  --blue-800: #1e40af;
  --blue-900: #1e3a8a;
  --blue-950: #172554;
}
```

better-colors presents these as "Tailwind's blue ramp"; they are v3's values. Tailwind v4 defines its default palette in OKLCH, for example `--color-blue-500: oklch(62.3% 0.214 259.815)` ([tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)), with more chroma than v3's 0.188 and outside sRGB (computed). See [TAILWIND.md](TAILWIND.md#the-default-palette-is-oklch).

## Generate a ramp from L, chroma percentage and hue

[Jakub Krehel, oklch-skill] Given a base color with lightness (L), chroma percentage, and hue (H):

**Step 1, lightness bounds:**

```
delta = 0.4
minL = max(0.05, baseL - delta)
maxL = min(0.95, baseL + delta)
```

"Lightness is clamped to [0.05, 0.95] to avoid pure black/white which have zero chroma."

**Step 2, distribute lightness** evenly from maxL (lightest, label 50) to minL (darkest, label 950).

**Step 3, clamp chroma per step.** "Each lightness level has a different maximum chroma for a given hue and color space":

```
maxChroma = findMaxChroma(step[i].L, hue, colorSpace)
step[i].C = (chromaPercentage / 100) * maxChroma
```

"High-chroma base colors will have lower chroma at the lightest and darkest ends, this is correct and expected." The skill never defines `findMaxChroma`; the checks behind this file found each maximum by binary search on C against the gamut boundary. Adam Argyle's math versus optical palettes are in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#oklch-palettes-from-one-hue).

The skill says this step "ensures every step is within gamut", but its own example scale breaks it: steps 500, 600, 700 and 800 (C 0.188, 0.168, 0.138, 0.108 at H 250) are outside sRGB, whose maximums there are 0.176, 0.151, 0.126 and 0.102 (computed). The corrected scale is in [TAILWIND.md](TAILWIND.md#a-custom-scale-with-theme).

### Scale labels

[Jakub Krehel, oklch-skill]

| Size | Labels |
| --- | --- |
| 5 | 100, 300, 500, 700, 900 |
| 9 | 50, 100, 200, 300, 500, 700, 800, 900, 950 |
| 11 | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |

The skill says "9 steps is the standard default (matches Tailwind)". Tailwind's docs say "Every color in the default palette includes 11 steps, with 50 being the lightest, and 950 being the darkest" ([tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors)). The 5- and 9-step sets are the skill's own convention; the 9-step set drops `400` and `600`, which the role table above uses for the hovered border and the solid fill.

## Several hues at once

With an accent plus status ramps, "the ramps must agree step for step. `red-500` and `blue-500` should read as equally bright and vivid, or a red button looks heavier than a blue one at the same step." [Jakub Krehel, better-colors]

- **Match perceived lightness exactly.** "Same step, same brightness, across every hue."
- **Match vividness relatively, not absolutely.** Use the same chroma *percentage* of each hue's own maximum, not the same absolute C. "Yellows and cyans are the usual casualties, peaking much lower than reds and blues. Copy the numbers across and the warning color looks weak beside the danger one." [Jakub Krehel, better-colors] Adam Argyle's "Yellow does not generate well" is in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#lightness-lch-and-oklch-over-hsl).

[Jakub Krehel, oklch-skill] Each value is 80% of its hue's sRGB maximum at L 0.623 (0.176, 0.196, 0.253, computed):

```css
:root {
  /* Same L, same C% (80% of max) - different absolute C per hue */
  --blue-500: oklch(0.623 0.141 250);   /* 80% of max 0.176 */
  --green-500: oklch(0.623 0.157 145);  /* 80% of max 0.196 */
  --red-500: oklch(0.623 0.202 25);     /* 80% of max 0.253 */
}
```

## Prove it

- Every ramp step maps to a role in the table; no step exists that no role consumes, and no role has two steps.
- Converted to OKLCH, each ramp's H stays constant, C peaks mid-ramp, `50` to `200` sit 0.04 to 0.05 apart in L, mid steps 0.07 to 0.10, and no two adjacent steps are under 0.03 apart.
- Every step's C is at or below the sRGB maximum for its L and H (unless it sits in a P3 block).
- The solid-fill step and its text measure at least 4.5:1 (WCAG 2) for every hue that carries text.
- Status hues sit at least 15° of OKLCH hue from the accent, or the destructive action has its own treatment.
- Ramps of different hues share L per step and the same percentage of each hue's maximum chroma.
