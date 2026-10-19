# Tailwind

Color scales and semantic tokens in Tailwind v4's `@theme`, what the default palette is (OKLCH, 11 steps), dark mode repointing and `inline`, what the opacity modifier compiles to, and migrating a hex theme. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged, corrected against [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme), [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) and Tailwind's source. Namespaces, `--color-*: initial;` and Adam Argyle's adaptive utilities are in [modern-css CUSTOM-PROPERTIES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/CUSTOM-PROPERTIES.md#your-tokens-in-tailwind-v4).

## The default palette is OKLCH

- "Tailwind CSS v4 defines its default palette in oklch. Custom themes should follow the same convention." [Jakub Krehel, oklch-skill] Every value on the docs page is `oklch(...)`, for example `--color-orange-500: oklch(70.5% 0.213 47.604)` and `--color-blue-500: oklch(62.3% 0.214 259.815)` ([tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)).
- **Hex Tailwind values are v3.** better-colors' "Tailwind's blue ramp" (`--blue-500: #3b82f6` and the rest, [PALETTES.md](PALETTES.md#use-a-color-library)) is the v3 palette. v4's blue-500 has chroma 0.214 against v3's 0.188 and sits outside sRGB, inside P3 (computed). Label hex Tailwind values as v3.
- **11 steps:** "Every color in the default palette includes 11 steps, with 50 being the lightest, and 950 being the darkest" ([tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors)). oklch-skill's "9 steps is the standard default (matches Tailwind)" is wrong.
- The white-text-on-`600` numbers in [PALETTES.md](PALETTES.md#the-solid-fill-under-white-text-measure-it) were computed on the v3 hex; v4's OKLCH values differ, so measure the version you ship.

## A custom scale with @theme

[Jakub Krehel, oklch-skill] "This gives you `bg-brand-500`, `text-brand-200`, etc. automatically." The skill's scale had 500 to 800 outside sRGB (C 0.188, 0.168, 0.138, 0.108); here those four steps are lowered to the sRGB maximum at their L and H 250, rounded down (computed). The other steps are the skill's values and are inside sRGB.

```css
@theme {
  --color-brand-50: oklch(0.971 0.012 250);
  --color-brand-100: oklch(0.932 0.028 250);
  --color-brand-200: oklch(0.882 0.048 250);
  --color-brand-300: oklch(0.812 0.078 250);
  --color-brand-400: oklch(0.722 0.148 250);
  --color-brand-500: oklch(0.623 0.176 250);
  --color-brand-600: oklch(0.535 0.151 250);
  --color-brand-700: oklch(0.445 0.125 250);
  --color-brand-800: oklch(0.362 0.102 250);
  --color-brand-900: oklch(0.289 0.078 250);
  --color-brand-950: oklch(0.215 0.048 250);
}
```

## Primitives and semantics in @theme

[Jakub Krehel, better-colors] "Tailwind v4 generates utilities from `@theme`, so names declared there become the API. Declare primitives and semantics in the same block; the `--color-*` namespace is what produces `bg-*`, `text-*` and `border-*`":

```css
@theme {
  /* Primitives */
  --color-blue-50: #eff6ff;
  --color-blue-600: #2563eb;
  --color-blue-900: #1e3a8a;

  /* Semantics: what templates should use */
  --color-accent-solid: var(--color-blue-600);
  --color-text-secondary: var(--color-neutral-700);
}
```

The primitives here are v3 hex values. "That yields `bg-accent-solid` and `text-text-secondary` alongside `bg-blue-600`. Tailwind prefixes every `--color-*` name with the utility, so a `text-` token doubles. Accept the doubling, or follow the convention the project already uses." "Templates use the semantic utilities, and a raw `bg-blue-600` in a component is the thing to flag."

- **Owner's design:** app-ui's checker flags the doubling (`rule/doubled-utility`: "`text-text-*`, `bg-bg-*`" → "the role's real name", [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)); in the owner's projects the checker wins.

## Dark mode and @theme inline

better-colors says: "Repoint semantics for dark mode in a `.dark` block outside `@theme`. Leave the block without `inline`, so utilities read the semantic variable at render time." Tailwind's docs say the opposite for theme variables that reference other variables: "use the `inline` option ... Without using `inline`, your utility classes might resolve to unexpected values" ([tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)).

- better-colors' advice works only because its `.dark` block redefines the semantic variables themselves.
- If dark mode repoints the primitives instead, a non-inline semantic token keeps the value resolved at `:root`. Either repoint the semantic variables in `.dark`, or declare the referencing tokens with `@theme inline`.
- app-ui's dark variant is class-based, `@custom-variant dark (&:is(.dark *))` ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).

## The opacity modifier compiles to color-mix()

oklch-skill says `bg-brand-500/50` "Compiles to: `oklch(0.623 0.188 250 / 0.5)`". It does not: Tailwind's source emits `color-mix(in oklab, ${value} ${alpha}, transparent)` (tailwindlabs/tailwindcss `packages/tailwindcss/src/utilities.ts`), and its tests show it under `@supports (color: color-mix(in lab, red, red))`. The docs say only that `/75` "sets the alpha channel of the color to 75%" ([tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors)). The docs' `--alpha()` function compiles the same way: `--alpha(var(--color-lime-300) / 50%)` becomes `color-mix(in oklab, var(--color-lime-300) 50%, transparent)` ([tailwindcss.com/docs/functions-and-directives](https://tailwindcss.com/docs/functions-and-directives)). `color-mix()` with `transparent` is in [modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#color-mix-and-its-space).

```html
<div class="bg-brand-500/50"></div>
<!-- Compiles to a color-mix(in oklab, ... 50%, transparent) value -->
```

"Opacity modifiers work on either tier, as in `bg-accent-solid/50`. But a color carrying alpha cannot be contrast-checked against a static background, because what it renders depends on what sits behind it. Use solid tokens for anything with text on it." [Jakub Krehel, better-colors] Measure the rendered result where alpha text stays ([CONTRAST.md](CONTRAST.md#what-to-check)).

## Migrating a hex theme

[Jakub Krehel, oklch-skill]

1. Convert all hex values in `@theme` to oklch
2. Replace any `theme()` references that used hex
3. Test dark mode, oklch values may look slightly different due to perceptual accuracy
4. Check for hardcoded hex in component code and convert those too

- Step 3: an exact conversion renders the same color; only rounding to 3 decimals changes it, and only slightly.
- This is a migration, so it runs only when asked or agreed ([FORMATS-AND-OKLCH.md](FORMATS-AND-OKLCH.md#converting)). Step 4's components should end up on role utilities, not converted literals ([TOKENS-AND-NAMING.md](TOKENS-AND-NAMING.md#two-tiers)).
- **Owner's design:** app-ui's tokens are hex ([tokens.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/base/tokens.css)); steps 1 and 4 do not apply there unless the owner asks.

## Prove it

- Hex Tailwind palette values in docs or code are labelled v3; v4 values are `oklch()` and scales have 11 steps.
- Every `@theme` scale step is inside sRGB at its L and H (or behind `@media (color-gamut: p3)`).
- Toggle dark mode on a page using a semantic utility: it changes, whether the `.dark` block repoints semantics or primitives (the latter needs `@theme inline`).
- In built CSS, an opacity modifier shows `color-mix(in oklab, ...)`; any text on it was measured as rendered.
- No component uses a primitive utility (`bg-blue-600`) where a role utility exists.
