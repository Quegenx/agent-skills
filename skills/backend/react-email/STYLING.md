# Styling

Email clients support a narrow, uneven slice of CSS: some strip `<style>` tags, some ignore `rem`, flexbox, grid, media queries and web fonts. React Email's `Tailwind` component bridges this by converting classes into inline styles at render time, which is why the rules below are about what can be inlined: utilities that resolve to one class lookup work; complex selectors, `hover:` and responsive or theme variants either don't inline or aren't reliable in clients. Without Tailwind, use inline `style` props.

**Contents:** [Tailwind or inline styles](#tailwind-or-inline-styles) · [How the Tailwind component works](#how-the-tailwind-component-works) · [What doesn't work](#what-doesnt-work) · [Required classes and borders](#required-classes-and-borders) · [Layout, typography and images](#layout-typography-and-images) · [Email design alternatives](#email-design-alternatives) · [Brand config](#brand-config) · [Dark mode](#dark-mode) · [Client support caveats](#client-support-caveats) · [Tailwind changes by version](#tailwind-changes-by-version) · [Prove it](#prove-it)

## Tailwind or inline styles

- **Two framings, sources disagree:** the vendor skill's components reference calls Tailwind "the recommended way to style React Email components"; its styling reference says use `Tailwind` if the project uses Tailwind CSS and inline styles otherwise. Follow the project.
- **Tailwind version:** the component uses `tailwindcss` 4.1.12 (per its docs page), and the compatibility checker supports Tailwind 4 only.
- **Wrap the email body content in `<Tailwind>`,** with `<Head />` inside it ([COMPONENTS.md](COMPONENTS.md#structure-rules)):
  ```tsx
  <Tailwind config={{ presets: [pixelBasedPreset], theme: { extend: { colors: { brand: "#007291" } } } }}>
  ```
- **Props:** `config?: TailwindConfig` (`Omit<Config, 'content'>`; optional, the defaults work well), `theme?: string`, `utility?: string`.
- **CSS-first config (Tailwind v4):** the `theme` and `utility` props take CSS strings (added in 6.2.0, 2026-05-21). They combine with `config`, empty strings are no-ops, and the base theme still loads. The preview, export and compatibility check understand Vite-style `?inline` and `?raw` CSS imports:
  ```tsx
  import themeCss from "./theme.css?inline";
  <Tailwind theme={themeCss}>
    <div className="bg-brand font-display">Custom themed content</div>
  </Tailwind>;
  ```
- **Always use `pixelBasedPreset`.** Tailwind's main unit is `rem`, which some email clients don't support; the preset bases styles on `16px` instead (for example `fontSize.base: ['16px', { lineHeight: '24px' }]`, `spacing.4: '16px'`). Import it from `react-email`.

## How the Tailwind component works

- **Classes become inline styles** automatically.
- **Media queries are extracted** to a `<style>` tag in `<head>` (they can't be inlined, so they're kept).
- **CSS variables are resolved,** and RGB color syntax is normalized for client compatibility.
- **Styles inline on elements, not components** (since 5.0). Before, passing `className` to a component also added an equivalent inlined `style` prop. If you merged utilities with the `style` prop, use tailwind-merge.
- **Context doesn't cross `<Tailwind>`:** a context provider inside `<Tailwind>` doesn't reach its children's `useContext`. Move the provider above `Tailwind`.

## What doesn't work

| Don't use | Why | Instead |
|---|---|---|
| `rem` units | Unsupported in some clients | `pixelBasedPreset` |
| Flexbox, grid | Not supported in email | `Row`/`Column`, or tables |
| `sm:`, `md:`, `lg:`, `xl:` | See below | Stacked, mobile-first layouts |
| `dark:`, `light:` | See [Dark mode](#dark-mode) | Explicit dark colors when asked |
| `hover:` | Not handled; support is poor | |
| `prose` (`@tailwindcss/typography`) | Not supported | |
| Classes resolving to complex selectors (more than a class lookup), such as `space-*` | Not inlined | |
| SVG and WEBP images | Poor client support | PNG or JPEG (GIF also displays everywhere) |

- **Media queries, sources disagree:** the styling reference says they "don't work"; the skill and components reference say avoid them for limited support, "not reliable across major clients"; the Tailwind component does extract them into `<head>`. When a user asks for media queries, tell them most email clients don't support them and suggest a different approach.

## Required classes and borders

| Element | Required class | Why |
|---|---|---|
| `Button` | `box-border` | Stops padding from overflowing the button width |
| `Hr`, any border | `border-solid` (or `border-dashed` and so on) | Email clients don't inherit the border type |
| Single-side border | `border-none` plus the side | Resets the other sides first |

```tsx
// Correct - specify border style
<div className="border-solid border border-gray-300" />

// Correct - single side border with reset
<div className="border-none border-l border-solid border-l-gray-300" />

// Incorrect - missing border style
<div className="border border-gray-300" />
```

## Layout, typography and images

- **Default layout classes:** `Body` `font-sans py-10 bg-gray-100`; `Container` (white, centered, left-aligned) `mx-auto bg-white p-6 rounded`.
- **Layout:** mobile-first, stacked; main container around 600px max-width; remove default spacing between list items; multi-column only with `Row`/`Column`.
- **Typography:** titles `text-2xl font-bold text-gray-900 mb-4`, paragraphs `text-base text-gray-700 mb-3`; larger margins for headings, smaller for body text.
- **Images:** content images `w-full h-auto`; small icons (24 to 48px) may use fixed dimensions; always absolute URLs. Include images only when the user asks for them, never distort user-provided images, and never create SVG images.
  ```tsx
  {/* Meaningful image: describe purpose and details */}
  <Img
    src="https://example.com/hero.png"
    alt="A team of engineers reviewing code on a laptop"
    className="w-full h-auto"
  />

  {/* Decorative image: always pass an empty alt string so screen readers skip it */}
  <Img
    src="https://example.com/divider.png"
    alt=""
    className="w-full"
  />
  ```
- **Custom fonts:** use `Font` with a web font URL and a fallback ([COMPONENTS.md](COMPONENTS.md#document-components)).

## Email design alternatives

- **Existing React Email default:** the [layout above](#layout-typography-and-images) uses a white centered container on gray. Keep this existing source rule unless the user selects the alternative. [existing React Email, STYLING.md, Layout typography and images]
- **PostHog source alternative:** the source below discourages the centered white card on gray and prescribes tone-led layout. This generic source disagreement remains explicit. [existing PostHog, EMAIL-TEMPLATES.md, Design guidelines]

React Email's authoring colors remain semantic classes from [Brand config](#brand-config); Tailwind converts styles for the rendered email. PostHog's literal-hex rule belongs to its exported design. The Liquid fallback clause below applies to [PostHog workflow templates](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EMAIL-TEMPLATES.md), while React Email uses [typed template props](SKILL.md#the-rules). [existing React Email, STYLING.md and SKILL.md], [existing PostHog, EMAIL-TEMPLATES.md]

[existing PostHog, EMAIL-TEMPLATES.md, Design guidelines]

- **Decide first:** purpose and audience (a transactional receipt, a product announcement, a win-back campaign and onboarding each warrant different energy); one tone, executed precisely (brutally minimal, editorial, luxury, playful, industrial; intentionality beats intensity); the real brand (pull colors, voice and logo from the sender's product or site, and mine a given URL for palette and typography); one memorable thing, not five.
- **Typography:** hierarchy through size, weight and color contrast, not font variety: one display treatment for the headline (large, tight line-height, heavy weight) with padding above and below; body 15 to 17px with 1.5 to 1.6 line-height; line length about 35em. Web-safe stacks with character: `Georgia, 'Times New Roman', serif` (editorial), `'Trebuchet MS', Tahoma, sans-serif` (friendly), `'Courier New', monospace` (technical). Choose to match the tone. Custom fonts via `<link>`/`@font-face` render in Apple Mail and only partially elsewhere; use them as enhancement with a fallback stack that still fits.
- **Color:** a dominant color, one sharp accent for the CTA, neutrals for text (evenly spread timid palettes read as template default); literal hex (no CSS variables), with a palette comment at the top. Body text contrast at least 4.5:1. Test on white and dark backgrounds: many clients force dark mode and invert naive black-on-white.
- **Layout:** asymmetry and overlap are mostly unavailable in table layout, so get interest from generous whitespace, full-bleed color sections and strong alignment. Vary the rhythm (a full-width color band header, padded white content, a tight dark footer), not a uniform 20px. One column; side-by-side cells rare, content-justified, and degrading acceptably when stacked. A bulletproof CTA is a padded `<td>` with `bgcolor`, border-radius and an inline-styled `<a>`. Solid `bgcolor` sections, a 4px accent top border and spacer rows are the reliable atmosphere tools; gradients, background images and shadows are enhancement only. Add a real text preheader (hidden with inline styles) written like ad copy, so the client doesn't scrape your header nav.
- **Avoid:** a centered white card on gray, a purple gradient header, Arial everywhere, three equal feature columns with stock icons, a pastel palette, "Hi {name}," as the only personalization. If the draft resembles that, restart from the tone decision; don't polish it.
- **Quality pass before saving:** every text-block element styled inline, consistent palette values, alt text on images; the squint test on the rendered preview (headline, key message, CTA); Liquid `| default:` fallbacks so no reader sees a blank; a plain-text version carrying the full message, not a stub.

## Brand config

- **Gather brand colors before building:** Primary (buttons, links, key accents); Secondary (borders, backgrounds, less prominent elements); Text (suggest `#1a1a1a` on light backgrounds); Text muted (captions, footers; suggest `#6b7280`); Background (email body; suggest `#f4f4f5`); Surface (container or card; typically `#ffffff`). The full intake questions are in [PATTERNS.md](PATTERNS.md#before-writing-a-template).
- **One shared config file,** `emails/tailwind.config.ts`, typed with `satisfies TailwindConfig` for IntelliSense:
  ```tsx
  // emails/tailwind.config.ts
  import { pixelBasedPreset, type TailwindConfig } from 'react-email';

  export default {
    presets: [pixelBasedPreset],
    theme: {
      extend: {
        colors: {
          brand: {
            primary: '#007bff',
            secondary: '#6c757d',
          },
        },
      },
    },
  } satisfies TailwindConfig;

  // For non-Tailwind brand assets (optional)
  export const brandAssets = {
    logo: {
      src: 'https://example.com/logo.png',
      alt: 'Company Name',
      width: 120,
    },
  };
  ```
  ```tsx
  import tailwindConfig, { brandAssets } from './tailwind.config';

  <Tailwind config={tailwindConfig}>
    <Body className="bg-gray-100 font-sans">
      <Container className="bg-white p-6">
        <Img src={brandAssets.logo.src} alt={brandAssets.logo.alt} width={brandAssets.logo.width} />
        <Button className="bg-brand-primary text-white">Action</Button>
      </Container>
    </Body>
  </Tailwind>
  ```
- **Never hardcode colors per template:** change the config, not the templates; use semantic names (`bg-brand-primary`, not `bg-[#007bff]`); keep text contrast at WCAG AA 4.5:1.
- **Make each template fit the request,** not generic. The styling reference also lists "Use keywords strategically" to increase engagement in the email body.

## Dark mode

- **Sources disagree on `dark:`:** the vendor skill says theme selectors (`dark:`, `light:`) are not supported in email clients, and its tests say to explain that and not use `dark:bg-gray-900`. The Tailwind component does emit `dark:` and other media-query variants into `<head>`: 6.9.1 (2026-07-23) fixed it dropping them with tailwindcss@4.3.3+. No React Email docs page covers authoring for dark mode. Confirm in the current docs before relying on `dark:`.
- **`color-scheme` isn't universal:** the caniemail data shipped in the preview UI marks `<meta name="color-scheme">` and `color-scheme` as unsupported on Gmail iOS.
- **When a dark design is requested,** use dark backgrounds: container black `#000`, background dark gray `#151516`:
  ```tsx
  <Body className="bg-[#151516]">
    <Container className="bg-black text-white">
  ```
- **Check it in the preview's dark mode switcher,** which emulates email client color inversion (5.0.0, Nov 7, 2025) and darkens the canvas. Fixes: forced `color-scheme: dark` in the preview (4.0.17); property access on null during inversion (Preview Server 5.2.0); `color-scheme` media queries sometimes not sanitized in `className` (Tailwind 1.2.1, Jul 11, 2025).

## Client support caveats

- **Test in Gmail, Outlook, Apple Mail and Yahoo Mail,** and on mobile. The preview's compatibility warnings default to `gmail`, `apple-mail`, `outlook`, `yahoo` ([SETUP.md](SETUP.md#the-preview-server-and-cli)).
- **Keep the email under 102KB:** Gmail clips larger emails.
- **Inline styles are the fallback:** some clients strip `<style>` tags.
- **Some clients strip `html` or `body`:** set `lang` and `dir` on both.
- **Web fonts aren't supported everywhere:** always configure `fallbackFontFamily`.
- **Look up a CSS feature** at https://www.caniemail.com before using it.

## Tailwind changes by version

- 6.11.2 (2026-10-14): default colors of shadows and rings inlined.
- 6.9.1 (2026-07-23): `dark:` and other media-query variants no longer dropped with tailwindcss@4.3.3+.
- 6.6.7 (2026-07-07): classes inlined on `Section`, `Column` and `Row`; `rgba(r g b / a)` converted to `rgb(r,g,b,a)`.
- 6.6.4: `rounded-*-full` `calc(infinity * 1px)` fix. 6.6.2: opacity modifiers such as `bg-blue-600/50` fixed.
- 6.4.0 (2026-05-26): unresolved `--tw-*` variables stripped so Tailwind media query utilities no longer break Gmail.
- 6.2.0 (2026-05-21): `theme` and `utility` CSS props.
- 6.0.7: media queries un-nested, `>=`/`<=` replaced with `min-width`/`max-width`.
- 5.0.0 (Nov 7, 2025): Tailwind 4 via `@react-email/tailwind@2.0.0`; styles no longer inlined on component props.

## Prove it

- Every `<Tailwind>` uses `pixelBasedPreset` (directly or through `emails/tailwind.config.ts`).
- No `flex`, `grid`, `sm:`/`md:`/`lg:`/`xl:`, `hover:`, `prose` or `space-*` classes in templates, and `dark:` only after the conflict above is checked.
- Every border class has a border style; single-side borders start with `border-none`; every `Button` has `box-border`.
- Templates use semantic brand classes, no `bg-[#...]` brand colors.
- Text contrast is at least 4.5:1, and the email reads correctly in the preview's dark mode switcher.
- The rendered HTML is under 102KB, and the compatibility warnings are clear for the clients you target.
- When the PostHog design alternative is selected, the rendered preview passes its inline-style, palette, alt-text, headline/message/CTA and complete plain-text checks; its Liquid fallback requirement remains scoped to PostHog templates. [existing PostHog, EMAIL-TEMPLATES.md, Design guidelines]
