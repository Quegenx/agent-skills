# The site's own system

## Separate from the app

- **Its own stylesheet:** the CSS framework's theme and utilities only, scanning the site's folder only, with the site's own reset layer instead of the framework's preflight. The app's classes stay in the app's stylesheet.
- **Its own document chrome:** the root layout applies the site's `<html>` and `<body>` classes, theme and language scripts, analytics, smooth scrolling, header, footer and cookie banner on site pages only.
- **Plain links into the app** (sign up, log in), localized, so the visitor lands on a fresh app document instead of the app rendering inside the site's styles. Record which button and which page sent them.
- **A skip link and its target:** the header's first focusable element is a "skip to content" link parked at `top: -100%` that moves to `top: .5rem` (start .5rem, z 1000, a `0 0 0 2px` focus-color ring) on `:focus-visible`. It targets `<main id="main-content" tabIndex={-1}>`, which is `isolate relative z-1` so it stacks above the fixed footer, and `min-w-0` so a wide track never widens the page.
- **Sections are tagged, not restyled per page:** data attributes for alternate background, full width, product and forced dark, and stable anchor ids so header and footer links can point at them.

## Tokens

- **Named by job, both themes in one place:** accent (with a soft 10% and a soft-hover 18%) plus separate accent-text and accent-heading roles, canvas, panel, elevated, recessed and recessed-half, menu, product card, glass levels (subtle, muted, strong, hover; white at .2 to .85 on light, .03 to .1 on dark), a brand-white scale for dark sections (faintest, faint, subtle, hover, muted), borders subtle and translucent, button fills and the text on each (on brand, on ink, on white), foreground strong, primary, secondary, tertiary and ink at .4 to .7, control hover `color-mix(in srgb, ink 4.5%, transparent)`, control subtle and selected, success, error, overlay dim and scrim, three shadow strengths, scrollbar thumb.
- **Dark is designed, not inverted:**

| Token | Light | Dark |
|---|---|---|
| Accent | the brand color | lighter, so it keeps its contrast |
| Brand button fill | the brand color | the same brand color (it does not lighten) |
| Ink button | ink; hover equals rest | white, text `#1b1b1c`, hover `#b8b6b8` |
| Success | green, ink text | the same |
| Error | `#b93800` | `#f24900` |
| Overlay scrim | white at .9 | canvas at .92 |
| Shadow color | ambient | canvas at .38, .5, .62 |
| Hero wash | `canvas, canvas, transparent` | `transparent 0 640px, canvas 832px` (flipped) |
| Product-kit gradient | white at 20% to accent at .4 | canvas at 20% to elevated |
| Card shadow | `0 0 0 1px` subtle plus `0 1px 2px` | an inset 1px white ring at .1 |

- **A section can force dark:** the same token block applies under `html[data-theme="dark"]` and under a `.site-dark-theme` class, so one product section can be dark inside a light page.
- **Gradients and whole shadows live outside the color namespace** as their own variables (the hero wash, the product-kit card gradient, a product-trust wash behind the platform section, a hairline card shadow).
- **Theme-swapped assets:** variables that show the light or dark version of an image, invert a monochrome logo in dark, and blend product screenshots with `multiply` on light (so their white background disappears into the panel). Headings and subsections laid over gradient backgrounds take `mix-blend-mode: var(--theme-product-blend-mode)` for the same reason.
- **Radius scale:** .25, .5, .75 (control), 1, 1.5 (large), 2rem (xlarge) and pill 6.1875rem. A large card steps down to the next radius on phones. Scrollbar .375rem wide, thumb radius 6.25rem.
- **Shadows by role:**

| Surface | Shadow |
|---|---|
| Raised outline | `0 1px 2px` ambient |
| Floating menu, select | `0 8px 24px` raised plus a `0 0 0 1px` subtle ring |
| Header menu nav | `0 12px 40px` ambient |
| Cookie banner | `0 8px 20px` ambient plus the subtle ring |
| Search panel | `0 2px 18px` ambient plus the subtle ring |
| Image preview | `0 24px 80px` |

- **Z-index ladder:** main 1 (above the fixed footer), header, cookie banner, skip link and image preview 1000, language curtain 1100, search scrim 9999998, search dialog 9999999.
- **Layout:** outer content width 67.625rem, inner columns 61.625rem; header height about 5.1rem (4rem compact); page-header top padding 11.5rem (7rem on phones); section block padding 6.25rem (3rem under 48rem); section inline padding 3rem (1.25 to 1.5rem under 48rem); control heights 3, 2.625 and 2rem; an anchor scroll offset (7rem) used by every heading's `scroll-margin`, sections `scroll-margin-top` 5rem.
- **Breakpoints are desktop first** (`max-[…]` variants): 26rem narrowest, 32.5, 40, 48 (phone), 56.25 (support card), 61.25 (featured post), 64 (tablet), 68.75rem (footer).

## Reset and document

`box-sizing`; margin, padding and border 0 on every element; `appearance: none` on buttons and inputs, `cursor: auto` on text inputs; `b` and `strong` at 600; img and svg `inline-block` with `vertical-align: top`, picture and video `block` with `max-inline-size: 100%`. `html` at `min-height: 100%`, `color-scheme: light` by default, `overscroll-behavior-y: none`, `scrollbar-gutter: stable` (and keep the reserved gutter when a modal library locks scrolling, or the page jumps sideways), `scroll-padding-top: 6rem` under the fixed header, `text-size-adjust: 100%`. `body` with `overflow-y: scroll`, `overflow-x: hidden`, `backface-visibility: hidden`, `isolate`, transparent tap highlight, `text-rendering: optimizeLegibility`, antialiasing. Scrollbar thumbs show only while their scroller is hovered. **Font features don't merge:** the reset sets the face's preferred `"cv11"` on everything and a display role that sets `"ss07"` replaces it, so list both when a role needs both. Under 48rem, where the cookie banner is a bottom sheet, body bottom padding includes its height (a variable the banner sets and removes when it closes), so the last thing on the page is never covered; on desktop it is a corner card and needs none.

## Type

**Fonts:** each role has a Latin and a Hebrew face in one stack (`rtl:` picks the Hebrew stack): the Latin stack puts the Latin face first, the Hebrew stack the Hebrew face first, then system and Noto fallbacks. Self-host the faces as woff2 in every weight used (here 100 to 900) with `font-display: swap`.

| Role | Size | Tracking | Weight, leading |
|---|---|---|---|
| Display large | `clamp(3rem, 2rem + 2.8vw, 6rem)` | -0.05em | 600, 1.1 |
| Display | `clamp(2.25rem, 1.5rem + 2.25vw, 4.5rem)` | -0.04em | 600, 1.1 |
| Heading 2 | `clamp(2rem, 1.5rem + 1.25vw, 4rem)` | -0.03em | 500, 1.2 |
| Hero title on phones | `clamp(2.5rem, 11.429vw + .2143rem, 3rem)` | | |
| Display title | 3rem (2.25rem on phones) | | |
| Page heading | 2.5rem (2rem) | | 500, 1.1 |
| Content section title | 2.5rem, `clamp(1.75rem, 5.714vw + .6071rem, 2rem)` on phones | | |
| Section heading | 2rem (1.75rem) | | |
| Heading 3 | 1.5rem | -0.48px | |
| Lede | `clamp(1.125rem, 1rem + .25vw, 2.25rem)`, 42rem measure | | |
| Card title, callout, card label | 1.25, 1.125, 1rem | | 450 |
| Button | 1.0625rem | | 500 |
| Label, caption | .875, .75rem | | |
| Legal | .8125rem | | 1.36 |
| Tabular | | +0.14px | |

Fixed tracking is in px, from -0.16px to -1.44px. Medium weights (450) carry most text. **Negative tracking is for Latin only:** every role resets it to normal in right-to-left; the tabular role's slight positive tracking stays, since figures read the same in both scripts. Headings balance, paragraphs `pretty`, section descriptions at most 50rem.

## Merging classes

When styles are passed as layers (base, size, caller, tone), a later layer that sets a property must replace every earlier value of it at every breakpoint and state. The usual merge only replaces the same variant, so an earlier `max-md:pt-5` outlives a later `pt-2`. Merge by property across variants (strip variants, compare what each utility sets), cache the pair results, and teach the merger the site's own spacing and radius names. **Drop only on a symmetric match:** each utility must replace the other, so a shorthand after a longhand (`p` after `px`) never drops the longhand, which then wins as it does in the framework's rule order. Flatten nested arrays and accept style lists, so `condition && class` works.

## Buttons and press

- **Pill buttons in three heights:** large 3rem (500, `px-6`), medium 2.625rem (`px-4`), small 2rem (the label role at 450). Four tones: solid ink, soft accent, solid accent and solid white. Soft white is not a tone: the dark showcase's secondary button adds its own soft-white class (the white-subtle fill, white-hover on hover under `(hover: hover)`). The tone class goes after the caller's class, so the tone always wins. A button is `type="button"` unless it submits. The button's own classes set a 150ms color transition with motion allowed and 0s otherwise, and the shared press style below replaces both with its 140ms; hover colors only under `(hover: hover)`; disabled at .6 opacity with `pointer-events: none` and `cursor: not-allowed`.
- **Which tone where:** sign up solid ink and log in soft accent in a product hero; solid white and soft white on a dark section; solid accent and soft accent on a light showcase; a lone secondary action soft accent; the recommended plan solid.
- **One press style for everything pressable** (every `button` and every `a[href]`, `[role=button]`, inputs of type button, submit and reset, and any element opted in with `[data-button-press]`), injected once: rest `translateZ(0)` from 50% 50%, hover scale 1.012 (hover-capable devices only), pressed `scaleX(1.07) scaleY(.91)` in 70ms, transform back over 120ms, colors over 140ms; disabled (`:disabled`, `[aria-disabled=true]`, `[data-disabled=true]`) excluded; reduced motion keeps the 140ms colors and drops the transform and any animation. **It is one unlayered `<style>` in the site chrome:** unlayered rules beat every layered utility, so its transitions are the ones every pressable element runs, whatever duration a button's own classes set.
- **The morphing submit adds its own press:** on top of the shared style it takes a motion-library `whileTap` of `scale(.96)` (dropped with reduced motion) and a motion-library hover fill that switches off once sent.
- **Focus is a 2px outline in the focus color**, transparent at rest so only its color changes on `:focus-visible` and nothing shifts. Offset 2px by default; 3px (.1875rem) on inline links and rail links; .25rem on the logo and post cards; 1px, in the accent, on the clear button; -2px (inset) on accordion rows, so the clipping panel can't cut it off. Contact fields show an inset 2px ring instead; the help search input is `outline-none`, and its caret is its focus cue.

## Brand lockup

The logo's size is a variable (1.75rem small, 2.25rem large); the wordmark is live, untranslated text at .62 times the logo size, weight 650, -0.02em. The lockup is `aria-hidden` because the link around it carries the name, and it is forced `dir="ltr"` wherever the mark must stay on the left in both languages.

## Theme before paint

A tiny inline script in the head reads the saved theme (or the device's), sets the dark class, `data-theme` and `color-scheme` on `<html>` before anything paints, so a dark visitor never sees a light flash. Set both the class and the attribute: the site's tokens key off `data-theme`, the app's tokens and the CSS framework's `dark:` variant key off the class. In the page, a store with listeners (for `useSyncExternalStore`, server snapshot light) applies changes, follows the device while nothing is saved, and tolerates storage errors; it writes storage before telling listeners, so a listener that reads the preference already gets the new one. Stored theme and consent values are checked against their allowed literals, and anything else counts as unset.

**Switching** reveals the new theme in a circle from the switch through a view transition, with the circle's origin as a data attribute on the root (a literal such as `circle-top-start`). A skipped transition rejects `finished`: catch it and remove the attribute in `finally`. "Follow the device" removes the saved value. The switch is a 2.5rem round button (padding .5rem, a 1.5rem icon, transitions 0s by default and 200ms ease-in-out only with motion allowed) with `aria-pressed` for dark and a label that says what pressing does. Its icon is a sun that morphs into a moon in .3s on ease-in-out: a clip path slides a bite in (x -12, y 10), the disc grows (radius 8 to 10), the rays rotate -100 degrees, shrink to .5 and fade.

## Language before paint

The language switch links to the same page in the other language (a real link with the fragment removed); a click calls `preventDefault` and runs a page-covering transition only when the language differs. It sets a session flag before the switch, and the head script reads the flag on the next document and marks `<html>` so the covering layer is visible from the first frame of the new page, then reveals it (see [MOTION.md](MOTION.md)). While covering, the layer takes `pointer-events: auto` so nothing underneath can be clicked. Head scripts run analytics, then the language transition, then the theme. Language names are written in their own language, with small drawn flags in a rounded, outlined frame; the current one carries `aria-current="true"` (not `page`).

**Translated lists are built per render:** a list of items with translated text is made inside a function called on each render (or stores the message functions themselves), never as a module-level array, which would freeze the first language.
