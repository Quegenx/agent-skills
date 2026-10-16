# The site's own system

## Separate from the app

- **Its own stylesheet:** the CSS framework's theme and utilities only, scanning the site's folder only, with the site's own reset layer instead of the framework's preflight. The app's classes stay in the app's stylesheet.
- **Its own document chrome:** the root layout applies the site's `<html>` and `<body>` classes, theme and language scripts, analytics, smooth scrolling, header, footer and cookie banner on site pages only.
- **Plain links into the app** (sign up, log in), localized, so the visitor lands on a fresh app document instead of the app rendering inside the site's styles. Record which button and which page sent them.

## Tokens

- **Named by job, both themes in one place:** accent (with a soft 10% and a soft-hover 18%), canvas, panel, recessed, menu, product card, glass levels (white at .2 to .85 on light, .03 to .1 on dark), borders subtle and translucent, button fills and the text on each (on brand, on ink, on white), foreground primary, secondary, tertiary and ink at .4 to .7, overlay dim and scrim, three shadow strengths, scrollbar thumb.
- **The dark accent is lighter** than the light one, so it keeps its contrast on dark.
- **A section can force dark:** the same token block applies under `html[data-theme="dark"]` and under a `.site-dark-theme` class, so one product section can be dark inside a light page.
- **Gradients and whole shadows live outside the color namespace** as their own variables (a hero wash, a card gradient that fades into a brand tint, a hairline card shadow).
- **Theme-swapped assets:** variables that show the light or dark version of an image, invert a monochrome logo in dark, and blend product screenshots with `multiply` on light (so their white background disappears into the panel).
- **Layout tokens:** content max width (about 67.6rem), header height (about 5.1rem, 4rem compact), page-header top padding (11.5rem, 7rem on phones), page inline padding `clamp(1.25rem, 4vw, 3rem)`, section block padding `clamp(3rem, 8vw, 6.25rem)`, control heights 3, 2.6 and 2rem, an anchor scroll offset (7rem) used by every `scroll-margin`.

## Reset and document

`box-sizing`, the font's preferred stylistic set, `overscroll-behavior-y: none`, `scrollbar-gutter: stable` (and keep the reserved gutter when a modal library locks scrolling, or the page jumps sideways), `scroll-padding-top` under the fixed header, `text-size-adjust: 100%`, antialiasing. Scrollbar thumbs show only while their scroller is hovered. Body bottom padding includes the cookie banner's height (a variable the banner sets), so the last thing on the page is never covered.

## Type

Roles, each with a Latin and a Hebrew face in one stack (`rtl:` picks the Hebrew font): display large `clamp(3rem, 2rem + 2.8vw, 6rem)` at -0.05em, display `clamp(2.25rem, 1.5rem + 2.25vw, 4.5rem)` at -0.04em, heading 2 `clamp(2rem, 1.5rem + 1.25vw, 4rem)`, page and section headings at fixed rem steps, lede `clamp(1.125rem, 1rem + .25vw, 2.25rem)` at 42rem measure, card title, body, label, caption, legal, a tabular role. Medium weights (450) carry most text. **Negative tracking is for Latin only:** every role resets tracking to normal in right-to-left. Headings balance, paragraphs `pretty`.

## Merging classes

When styles are passed as layers (base, size, caller, tone), a later layer that sets a property must replace every earlier value of it at every breakpoint and state. The usual merge only replaces the same variant, so an earlier `max-md:pt-5` outlives a later `pt-2`. Merge by property across variants (strip variants, compare what each utility sets), cache the pair results, and teach the merger the site's own spacing and radius names.

## Buttons and press

- Pill buttons in three heights; tones solid ink (the main action), soft accent (the second), solid accent, solid white and soft white (on dark sections). Color transitions 150ms only with motion allowed; hover colors only under `(hover: hover)`; disabled at .6 opacity.
- **One press style for everything pressable** (buttons, links, `[role=button]`, inputs of type button), injected once: hover scale 1.012 (hover-capable devices only), pressed `scaleX(1.07) scaleY(.91)` in 70ms, transform back over 120ms, colors over 140ms; disabled excluded; reduced motion keeps colors and drops the transform.
- Focus is a 2px outline in the focus color, offset 2px, on every control.

## Theme before paint

A tiny inline script in the head reads the saved theme (or the device's), sets the dark class, `data-theme` and `color-scheme` on `<html>` before anything paints, so a dark visitor never sees a light flash. In the page, a store with listeners (for `useSyncExternalStore`, server snapshot light) applies changes, follows the device while nothing is saved, and tolerates storage errors. Switching reveals the new theme in a circle from the switch through a view transition (with the circle's origin set as a data attribute on the root and removed when it finishes); "follow the device" removes the saved value. The switch icon is a sun that morphs into a moon: a clip path slides a bite in, the disc grows, the rays rotate away and shrink, all in .3s; its label says what pressing does.

## Language before paint

The language switch links to the same page in the other language (a real link with the fragment removed), and also runs a page-covering transition: it sets a session flag before the switch, and the head script reads the flag on the next document and marks `<html>` so the covering layer is visible from the first frame of the new page, then reveals it (see [MOTION.md](MOTION.md)). Language names are written in their own language, with small drawn flags in a rounded, outlined frame.
