---
name: color-system
description: "Builds and audits a product's color system: notation and OKLCH, converting colors without side effects, ramps and the role each step plays (Tailwind and Radix), neutrals, status and brand colors, generating ramps by chroma percentage, primitive and semantic tokens with one naming grammar, WCAG 2 and APCA contrast with APCA's own levels and sign, fixing a pair through lightness, dark palettes, theme switching and increased contrast, gamut limits, clamping and P3, Tailwind v4's OKLCH palette, @theme inline and opacity modifiers, and a P0 to P3 color audit. Use when creating a palette or color tokens, naming or theming colors, adding dark mode, checking or fixing contrast, converting to oklch, checking gamut or P3, or reviewing a project's colors."
---

# Color system

A color system is a few ramps, each step doing one job, named by role and measured as rendered. Sources: Jakub Krehel's better-colors and oklch-skill, each fact tagged, checked against W3C, APCA, Radix, culori, MDN and Tailwind's docs and source; where a source was wrong (white text on `600`, v3 hex sold as Tailwind's palette, `@theme` without `inline`, APCA's sign, Lc 60 for body text, 9 steps, five out-of-gamut example values, a hex fallback that is another color, cyan always lowest, the opacity modifier's output), the file gives the official form and says what the source said. Numbers marked "computed" were checked with an OKLab, Display P3, WCAG 2 and APCA implementation. The CSS features themselves (`oklch()`, `color-mix()`, relative color, `light-dark()`, `contrast-color()`, P3 declarations) and Adam Argyle's recipes are in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md). The owner's own token design in [app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md) and [landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md) wins wherever it differs; each difference is a one-line note in the topic file.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choosing a notation, why OKLCH, channels and formatting, HSL hue drift, converting and bulk conversion, `color-mix()` and relative color in tokens, gradient interpolation spaces | [FORMATS-AND-OKLCH.md](FORMATS-AND-OKLCH.md) |
| Which ramps a system needs, the role of every step (Tailwind and Radix), white text on the solid fill, neutrals, status hues, the brand color, a correct ramp, culori, the chroma-percentage algorithm, scale labels, several hues at once | [PALETTES.md](PALETTES.md) |
| Measuring the rendered pair, WCAG 2 and APCA thresholds, Lc's sign, fixing a pair through lightness, the lightness gap, text polarity, translucent and computed colors | [CONTRAST.md](CONTRAST.md) |
| Compute WCAG 2 contrast between hex colors with unrounded pass/fail checks | [scripts/contrast.py](scripts/contrast.py) |
| Primitive and semantic tiers, the role inventory, naming grammar and anti-patterns, tokens only in their role, one color one meaning, one filled action, culture | [TOKENS-AND-NAMING.md](TOKENS-AND-NAMING.md) |
| The dark palette, the switching mechanism, increased contrast per appearance, gamut, max chroma by L and H, the clamp, P3 as an enhancement, hex fallbacks | [DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md) |
| Tailwind v4's OKLCH palette and 11 steps, a scale in `@theme`, semantic tokens and the doubled utility, `.dark` and `@theme inline`, the opacity modifier, migrating a hex theme | [TAILWIND.md](TAILWIND.md) |
| Audit stance, palette inventory, the before-you-finish scan, P0 to P3 severity, verification tiers, the report table and verdict | [AUDIT.md](AUDIT.md) |

## The rules

1. **Match the project's notation.** A consistent hex system beats hex with `oklch()` scattered through it; use `oklch()` by default only for a new system, and convert only on request or in an agreed migration [Jakub Krehel, better-colors] ([FORMATS-AND-OKLCH.md](FORMATS-AND-OKLCH.md#converting)).
2. **A system is one neutral ramp, one accent ramp and only the status ramps the product renders,** and every step exists because a role consumes it [Jakub Krehel, better-colors] ([PALETTES.md](PALETTES.md#every-step-has-a-job)).
3. **Hold the hue, peak chroma mid-ramp, step finer at the light end,** and keep every step inside sRGB at its L and H; across hues, match L and the same percentage of each hue's maximum chroma [Jakub Krehel, better-colors; Jakub Krehel, oklch-skill] ([PALETTES.md](PALETTES.md#what-a-correct-ramp-looks-like)).
4. **Measure white text on every solid fill.** It fails 4.5:1 on every Tailwind v3 `500` hue and on nine `600` hues; the light hues take dark text (computed; [Radix](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette)) ([PALETTES.md](PALETTES.md#the-solid-fill-under-white-text-measure-it)).
5. **Components use semantic tokens only,** named by role in one grammar, each used only in its role [Jakub Krehel, better-colors] ([TOKENS-AND-NAMING.md](TOKENS-AND-NAMING.md#two-tiers)).
6. **Measure against the background actually rendered,** report WCAG 2 and add APCA (Lc 75 for body text, Lc 30 the floor; positive Lc is dark on light), and never report a value you did not measure ([APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html)) ([CONTRAST.md](CONTRAST.md#apca-thresholds)).
7. **Fix a failing pair only when asked, through lightness,** holding the hue, re-clamping chroma into the gamut, then remeasure [Jakub Krehel, better-colors] ([CONTRAST.md](CONTRAST.md#fix-a-failing-pair-only-on-request)).
8. **Dark is designed, not reversed:** swap roles, lower the accent's chroma, separate the dark end, use one switching mechanism and give increased contrast its own value per appearance [Jakub Krehel, better-colors] ([DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#a-dark-palette-is-not-the-light-one-reversed)).
9. **Declare the sRGB value first and P3 inside `@media (color-gamut: p3)`;** any fallback must be the same color [Jakub Krehel, better-colors] ([DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#p3-as-an-enhancement)).
10. **In Tailwind v4, the palette is OKLCH with 11 steps, a semantic token referencing a repointed variable needs `@theme inline`, and `/50` compiles to `color-mix(in oklab, ...)`** ([tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)) ([TAILWIND.md](TAILWIND.md#dark-mode-and-theme-inline)).
11. **An audit reports, it does not repaint:** inventory first, one P0 to P3 row per root cause with every location, `Block` on any P0 or P1 [Jakub Krehel, better-colors] ([AUDIT.md](AUDIT.md#report)).

## Prove it

Every color in component code resolves through a semantic token; every ramp step has a role, a constant hue and a chroma inside sRGB at its L and H (or sits behind a P3 query after its sRGB value); every text pair, measured against its rendered background in light and dark, meets its WCAG 2 ratio unrounded and its APCA level with the correct sign; dark mode uses one switching mechanism and its own tuned values; every hex fallback converts to the color it stands in for; the audit report has a P0 to P3 row per root cause and lists what was `Not verified`; and every topic file's own Prove it checks pass for the parts you touched.
