# Tokens and naming

The two token tiers, the roles a system needs, one naming grammar, using each token only in its role, and how color carries meaning and emphasis. Source: Jakub Krehel's better-colors, each section tagged. The owner's own token design ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md), [landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)) wins wherever it differs; each difference is one note below. Tailwind's `@theme` side is in [TAILWIND.md](TAILWIND.md).

## Two tiers

[Jakub Krehel, better-colors]

- **Primitives name a value.** They are the ramp, named by hue and step (`--blue-600`, `--neutral-200`). "A primitive describes what the color *is*, so it never changes meaning between themes and is never applied directly in a component."
- **Semantics name a job.** They point at a primitive and take the role's name (`--color-text-secondary`, `--color-border-subtle`). "Components only ever reference this tier."

```css
:root {
  /* Tier 1: primitives, named by hue and step. Never used directly. */
  --blue-600: #2563eb;
  --neutral-200: #e5e7eb;
  --neutral-700: #374151;

  /* Tier 2: semantics, named by role. This is what components use. */
  --color-accent-solid: var(--blue-600);
  --color-border: var(--neutral-200);
  --color-text-secondary: var(--neutral-700);
}
```

- "The tiering is what makes theming possible. Dark mode, a white-label theme and an increased-contrast variant all repoint the semantic tier, leaving the primitives and every component untouched." A codebase applying `--blue-600` in components "has no theming seam".
- **A component tier** (`--color-button-danger-bg`) only where a component genuinely and intentionally diverges. "One component token is a documented exception; twenty mean the semantic tier is missing roles."
- app-ui's checker already flags raw values and palette utilities in components (`rule/raw-value`, `rule/palette-use` in [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).

## The role inventory

[Jakub Krehel, better-colors] "A system is complete when every role below has a token. Build against this list rather than adding tokens as components demand them, or the palette ends up shaped like whichever screen came first."

| Group | Roles |
| --- | --- |
| Surfaces | page background, surface, raised (menus, popovers), sunken (inputs, wells), overlay scrim |
| Text | primary, secondary, disabled, inverse, on-accent |
| Borders | subtle, default, strong, focus ring, separator |
| Accent | subtle background, border, solid, solid hover, text |
| Status | per status shipped: subtle background, border, solid, text |

"Separator and border are separate roles even when they share a value today. A separator divides content; a border encloses a control. They diverge the first time someone restyles inputs."

## Naming grammar

[Jakub Krehel, better-colors] "Use one shape and never deviate. Neutral roles lead with the property, as `--color-{bg|text|border}-{variant}-{state}`. Accent and status roles lead with the role, as `--color-{accent|danger|…}-{subtle|border|solid|text}-{state}`."

```css
--color-bg-surface
--color-text-secondary
--color-border-strong
--color-accent-solid-hover
--color-danger-subtle
--color-accent-text
```

"Pick one word per concept and use only that word. Consistency matters more than the vocabulary. A reader who has seen `--color-text-primary` must be able to guess `--color-text-disabled` without looking":

| Concept | Pick one | Never mix in |
| --- | --- | --- |
| Foreground | `text` | `fg`, `foreground`, `content`, `ink` |
| Background | `bg` | `background`, `surface` as a synonym, `fill` |
| Edge | `border` | `stroke`, `outline`, `line` |
| Brand color | `accent` | `primary`, `brand`, `theme` used interchangeably |

- "Reserve `primary` for exactly one meaning. `--color-text-primary` for body text beside `--color-primary` for the brand is the most common naming collision there is." Use `accent` for the brand and let `primary` mean "the most prominent of its group".
- **Owner's design:** app-ui names its roles `--foreground`, `--muted-foreground`, `--primary`, `--primary-soft` and `--destructive` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)), and landing-page-ui uses accent for the brand with "foreground strong, primary, secondary, tertiary" for text ([landing-page-ui SYSTEM.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SYSTEM.md)); the owner's names win, and neither defines both `--primary` and `--text-primary`, so the collision rule still holds.

### Anti-patterns

| Name | Problem | Instead |
| --- | --- | --- |
| `--color-blue-button` | Appearance at the semantic tier; lies the moment the brand changes | `--color-accent-solid` |
| `--color-sidebar-gray` | Named for where it was used first; the second usage makes it nonsense | `--color-bg-surface` |
| `--color-light-gray` | Lies in dark mode, where it is the dark one | `--neutral-200` as a primitive |
| `--color-text-2` | Numbered semantics carry no meaning; nobody can guess what `3` would be | `--color-text-secondary` |
| `--color-gray-hover` | Mixes a hue with a state and belongs to no tier | `--color-bg-surface-hover` |
| `--blue-600` used in a component | Skips the semantic tier and removes the theming seam | Point a semantic token at it |

## Use a token only in its role

[Jakub Krehel, better-colors] "Never borrow a token because its value is right today. A separator used as a text color works until borders get lighter, and then the text goes with them. If a role has no token, add the token."

```css
/* Bad: separator token repurposed as a text color because it looked right */
.caption { color: var(--color-border); }

/* Bad: text token repurposed as a background */
.tag { background: var(--color-text-secondary); }
```

A `border` or `separator` token inside `color:`, or a `text` token inside `background:`, is a finding: add a token for the missing role.

- **Alpha text tokens.** better-colors: "a color carrying alpha cannot be contrast-checked against a static background, because what it renders depends on what sits behind it. Use solid tokens for anything with text on it." Owner's design: app-ui's quieter text steps are alpha tokens (`rgb(var(--ink) / 0.5)`); they stay, measured as rendered ([CONTRAST.md](CONTRAST.md#what-to-check)).
- **Mixed tokens.** better-colors keeps `color-mix()` output out of the token layer ([FORMATS-AND-OKLCH.md](FORMATS-AND-OKLCH.md#derived-colors-resolve-at-render-time)). Owner's design: app-ui's opaque tints are `color-mix(in srgb, ...)` tokens; they stay.

## One color, one meaning

[Jakub Krehel, better-colors] Use a color for one purpose across the whole interface, treating anything within `15°` of OKLCH hue as the same color. "Users read a near-miss in hue as a slightly different shade, not as a different color."

```css
/* Bad: the accent means both "link" and "decorative heading" */
a { color: #3b82f6; }
.section-title { color: #4f8ef7; }

/* Good: interactive elements own the accent; headings stay neutral */
a { color: var(--color-accent-text); }
.section-title { color: var(--color-text-primary); }
```

- "The rule runs both ways. A color must not be *absent* where its meaning occurs. If the accent means interactive, an interactive element rendered neutral is just as misleading."
- "Never let color be the only carrier of meaning. Pair it with an icon or a label."

## Fill exactly one action per view

[Jakub Krehel, better-colors] "When filled color encodes primary emphasis, one primary action gets it and peers stay neutral. Put the color on the background, not the label. A filled button reads as primary across the room; accent-colored text on a neutral button reads as a link."

```html
<!-- Good: one filled primary action, neutral secondaries -->
<button class="bg-accent-solid text-text-on-accent">Save</button>
<button class="text-text-secondary">Cancel</button>

<!-- Bad: every action colored, so nothing is primary -->
<button class="bg-accent-solid text-text-on-accent">Save</button>
<button class="bg-accent-solid text-text-on-accent">Duplicate</button>
<button class="bg-accent-solid text-text-on-accent">Export</button>
```

- "Selected states may use the accent on the glyph and label. An active tab or a checked segment is state, not emphasis."
- "Keep an established hierarchy that already signals emphasis another way. Several colored backgrounds are fine when they encode distinct states or categories rather than competing as peers."

## Color across cultures

[Jakub Krehel, better-colors] "Where a color carries meaning in finance, status or alerts, verify the meaning holds in every locale you ship to. Chinese financial UIs show gains in red and losses in green, the reverse of English ones." Where the product ships to such markets, make gain and loss per-locale tokens rather than hardcoded values.

## Prove it

- No component file references a primitive (`var(--blue-600)`, `bg-blue-600`) or a color literal where a role token exists.
- Every role in the inventory that the product renders has a token, separator and border are separate, and component tokens are few and documented.
- Every semantic name follows one grammar and one word per concept; no name contains a hue, a component or a number, and `primary` means one thing.
- No `border`/`separator` token appears in `color:` and no `text` token in `background:`.
- Each hue means one thing across the interface, every meaning carried by color also has an icon or label, and each view has one filled primary action.
