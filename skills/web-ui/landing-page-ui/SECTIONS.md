# Pages and sections

## The page template

**Product page:** hero, story sections, questions (an expandable FAQ), closing call. **Home:** hero, one showcase per audience (each a rounded card inset from the page edges, one of them forced dark), a platform section, questions, closing call. **About:** hero, a separator straight after it, story sections without descriptions, values as a two-by-two grid of cards, proof as a flow panel on the alternate background, capabilities as two cards on gray, a separator, the closing panel. Pages are thin: they list blocks; the blocks own layout and motion. `main` is at least `100dvh` tall.

## Page header

Title and side content (a description) share one row aligned on `align-items: last baseline`, stacking under 48rem with a 1rem gap; bottom padding 4.5rem (1rem on phones); title 500 at leading 1.1.

## Hero

An eyebrow (a 28px logo with `alt=""` and `aria-hidden`, .75rem gap, the card-title role at 450), a two-line title (the second line in the accent, italic in Latin and upright in Hebrew), a description at about 39rem, the two app buttons (sign up solid, log in soft), and a product screen in a panel whose bottom fades out through an eased mask and tucks under the next section with a negative margin.

| Part | Desktop | Phones |
|---|---|---|
| Content top padding | 11.5rem | the compact token |
| Gaps | 1.25rem; heading group .75rem | |
| Actions | `pt-3`, a row | a column, each button at most 22.5rem wide |
| Screen width | `min(38.75rem, 72vw)` | `min(32.5rem, 100%)` |
| Panel top margin, visual top padding | 3rem, 1.75rem | 2.5rem, 1.25rem |
| Bottom tuck | -2rem | -.875rem |
| Section padding | bottom 5rem, sides 3rem | 3rem, 1.25rem |

**The mask eases out instead of cutting:** `linear-gradient(180deg, #000 0%, #000 72%, rgba(0,0,0,.98) 78%, rgba(0,0,0,.88) 84%, rgba(0,0,0,.62) 90%, rgba(0,0,0,.28) 96%, transparent 100%)`. The hero screen component always decodes `async` and takes `fetchPriority` as an option: the home hero passes `"high"`, while the product and about heroes leave it at the browser's default.

**The home hero sits in its own rounded card,** like the showcases: `xlarge` radius (`large` on phones), the product-kit gradient as its background, inset 1.5rem from the page sides (.5rem on phones) with 1.5rem below; its buttons are at most 18.75rem and full width on phones.

## Story blocks

All share one rounded surface (2rem panels, 1.5rem cards; padding 2rem, 1.5rem under 48rem), collapse to one column under 48rem, and scroll-reveal; each reveal wrapper is a flex container so a pair of cards stretches to one height.

- **Section header:** the two-tone heading and a description, centered.
- **Panel:** a product screen beside a title and text (`minmax(0, 1.2fr) minmax(17.5rem, .8fr)`, gap 2rem, 1.5rem on phones); can reverse sides by explicit column and row placement, so the screen stays first in the DOM; screens at most 26.25rem tall with a 1.5rem radius; a variant for gray backgrounds.
- **Card:** a screen above a title and text; used in pairs (gap 1.5rem). Screen height 20rem, `clamp(11.25rem, 85.714vw - 5.8929rem, 15rem)` under 48rem.
- **Options panel:** a screen (at most 28.75rem) and a centred wrap of pill options (`.75rem 1rem`, gap .75rem, the product-card fill): what it takes into account.
- **Flow panel:** a screen (at most 27.5rem) beside numbered steps (`minmax(0, 1.4fr) minmax(16.25rem, .6fr)`); each step a `2.5rem 1fr` grid, gap 1rem, steps 1.5rem apart, the number in a 2.5rem accent circle marked `aria-hidden`.
- **Closing panel:** a final screen with a title and text (`minmax(0, .8fr) minmax(17.5rem, 1.2fr)`), after a separator with `5rem 3.5rem` block margins (`3.5rem 2.5rem` on phones); screen 16rem, `clamp(11.25rem, 114.286vw - 11.6071rem, 16rem)` under 48rem.
- **Alternate sections** take the faintly tinted recessed-half background to break the rhythm (usually the options section).
- **Separators:** 1px, `w-[min(100%, 61.625rem)]` (or 67.625rem), at most 90% wide, in a primary or tertiary variant.

The order that works: the problem (panel), what it does (two cards), what it considers (options), how it flows (steps), more (two cards on gray).

## Showcase sections (home)

- **Cards** inset 1.5rem from the page sides (.5rem on phones) with 1.5rem between them, `xlarge` radius (`large` on phones); each sets its own top padding (7.5, 6.75 or 11.5rem; one wide-section token on phones), bottom 3.5rem (3.125rem), sides 3rem (compact on phones).
- **Header:** a badge, the title's letters (centred, leading 1.1), a description (at most 38.75rem, centred, `pretty`) and actions (gap 1rem, `pt-3`, stacked on phones with each button at most 18.75rem and full width). Entrances are in [MOTION.md](MOTION.md). Actions link to the site's own product pages, not the app: solid white and soft white on the dark showcase, solid accent and soft accent on a light one, a single soft accent on the platform section.
- **A framed product screen** with a fixed aspect ratio, fading from halfway (`linear-gradient(180deg, black 0%, black 50%, transparent 100%)`), radius 1.0625rem (the control radius on phones), padding `5rem` top and `4.5rem` bottom (3rem each on phones), the image `pointer-events: none` and `select-none`.
- **A subsection row:** the two-tone heading on one side and a "learn more" button on the other (gap 3rem, 1.875rem stacked on phones); its block at most 46rem with gap 1rem, its description 85% wide on phones.
- **Capability cards on dark:** the faintest brand-white fill, `large` radius, `2rem 1.5rem` padding, gap 2rem, at least 21.25rem tall (dropped under 64rem); a label in the accent at .8 opacity (450, leading 1.1), title, description, then feature tokens under a hairline top border with 2rem above them. Tokens are pills (`xlarge` radius, the faint brand-white fill, at least 1.625rem tall, .3125rem gap, `py-1 pe-2 ps-1`, `nowrap`, a round accent icon at 18px, stroke 1.6; a name can be forced left-to-right). Three columns, one under 64rem, where the gap grows from 1.5rem to 2.5rem.
- **The dark section's background** is two layered gradients (near-black at 85% over a diagonal from black into the brand color).
- **The platform section:** the brand lockup as its badge and the two-tone heading (not letters) as its title, over an `aria-hidden` wash (absolute at the bottom, 90% tall, `z-index: -1`) on the product-trust background; then link cards, a separator, a centred subheading and text, and a decorative dashboard screen (`aria-hidden`, fixed aspect, at most 38.75rem, `large` radius, lazy and async), the lower content 4.5rem apart.

## Carousel of capability cards

- **Track:** horizontal, proximity snap, no scrollbar, gap 1rem (1.4375rem between the controls and the track), `direction: inherit`, touch momentum scrolling, and 1px padding with `scroll-padding-inline-start: 1px` so card outlines aren't clipped by the overflow. Edge fades as in [MOTION.md](MOTION.md).
- **Controls above the track,** aligned to the end, .5rem apart: round glass previous and next buttons, 40px (44px on phones, a touch target), disabled at .5 opacity with the default cursor at the ends, hover fill only when enabled and under `(hover: hover)`, opacity and background over .2s. One 16px chevron (stroke 2), mirrored with `scaleX(-1)` for previous and nudged 1px optically, the classes swapped in right-to-left.
- **Scrolling:** scroll smoothly by one card's `offsetWidth` plus 24px, or 80% of the track width if no card is found, and let the proximity snap settle the card; take the sign from the track's computed `direction` and the mask flip from the language; read the position as `Math.abs(scrollLeft)`; "can scroll next" is `< max - 1` (a subpixel tolerance); recompute on scroll and with a `ResizeObserver`; expose the state as data attributes for the fades.
- **Cards** about 22.8125rem (`flex: 0 0 22.8125rem`, 82% on phones so the next peeks), at least 12.5625rem tall; each a link with `dir="auto"`, a frosted layer (`backdrop-filter: blur(.75rem)`), a 3rem icon tile on strong glass (a 28px duotone icon in the accent-text color), a name, a big figure (the section-heading role), a description, and the hover arrow absolute at top end 1rem (`z-index: 2`, the header padded 3rem at the end to make room).

## Link cards

A grid of `repeat(auto-fit, minmax(18.75rem, 1fr))` cards, each with an icon tile, the hover arrow, a title (`unicode-bidi: isolate`) and a description, each linking to a feature page. On the panel fill with `background-clip: padding-box`, `large` radius, padding 2rem, gap 1.5rem; the icon tile 3rem at the control radius on the primary background (28px duotone accent glyph, .5rem from the top); title 450 at leading 1.35, start-aligned; description leading 1.4.

## Plans

Three cards on the story-card surface, one column under 64rem, gap 1.5rem, stretched to the row's height (the reveal wrapper is a flex container); padding 2rem (1.5rem on phones), gap 1.5rem, start-aligned. Each card is an `<article aria-labelledby>` pointing at the plan name's `<h2 id>`, with an audience line under the name. The badge (pill, accent-soft fill, accent text, `.25rem .75rem`) shares the name's row so every price lines up. The price shows as a big tabular figure with the currency symbol before it on the baseline (gap .5rem, leading 1) and a muted period, with a screen-reader sentence ("99 shekels a month") in place of the visual pair. The feature list grows to fill the card so every button lines up at the bottom: a translucent top border, 1.5rem above, items .75rem apart with 20px accent ticks. Full-width buttons, the recommended plan's solid and the others soft, each sign-up tracked; a note about payment 2rem under the grid. No product screen.

## Questions

- **Accordion row:** the question as a button inside a heading (level set by the page), in the callout role, `pt-6 pb-3.5 px-4` (`pt-5 pb-3` on phones) with a subtle bottom border; the answer as a region labelled by it, `calc(100% - 3.75rem)` wide so it never runs under the icon, `inert` when closed. A row counts as open only when it is also visible. The plus turns into a minus and the panel opens on springs ([MOTION.md](MOTION.md)). One row open at a time per list. A color variant runs through an `--accordion-accent` variable.
- **Microdata on the answer panel:** the panel is `itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer"`; the row itself carries no microdata. The questions reach search engines through the page's FAQ structured data in the head ([DISCOVERY.md](DISCOVERY.md)).
- **Expandable list:** the first five, then a pluralised "Show N more" and "Show less" (a button in the callout role, `aria-expanded`, at least 2.5rem tall, 1rem radius, pulled back 1rem at the start). Hidden rows are `inert` at once and `display: none` after the height animation ([MOTION.md](MOTION.md)). Collapsing closes an open row that will be hidden. A list of five or fewer shows no toggle.
- **Layout:** heading (at least 11.125rem, leading 1.35, 1.2 on phones) beside a list column of 39.375rem pushed to the end with `ms-auto`, stacking to full width under about 55rem of the section's own width (a container query), gap 4.5rem (2rem stacked). The list is pulled out by `-mt-4 -mx-4` so the row text lines up with the heading. A "learn more" link with a circled arrow 2rem under it. Every row scroll-reveals.
- **Page mode:** rows with no side padding, the first with `pt-2`, each with the anchor scroll margin.
- **The same items feed the page's FAQ structured data** ([DISCOVERY.md](DISCOVERY.md)), and an answer that appears on several pages is written once.

## The closing call

A wide gradient panel: the app icon (3rem, .75rem radius), the two-tone heading, a short line on what happens next (24 characters a line at most), the two app buttons, and a product screen at the end (absolute on desktop, below on phones; `aria-hidden` when it has no alt text). Its rise is in [MOTION.md](MOTION.md).

| Width | Radius | Min height | Padding | Screen width (compact variant) |
|---|---|---|---|---|
| Desktop | 2rem | 32.5rem | 5rem | 27.5rem (23.75), inset 2.5rem from top, bottom and end |
| Up to 64rem | 2rem | 27.5rem | 3.5rem | 22.5rem (20), end 1.5rem |
| Up to 48rem | 1.5rem | none | `3rem 2rem 0` | 18rem (17), below the copy |
| Up to 32.5rem | 1.5rem | none | `2.5rem 1.5rem 0` | 16rem (15) |

The copy column is at most 30rem, centred under 48rem. Buttons don't wrap until 32.5rem, then go full width at most 20rem.

## Support card

A panel with a heading (500, leading 1.35), a description (leading 1.45) and a link with a circled arrow, beside a product screen (inset with .75rem padding, or full bleed; 15.625rem tall, 13.75rem when stacked, `object-contain`); used before the closing call on the FAQ and help pages. Grid `minmax(0, 1fr) 29.6875rem` with a 4.5rem column gap, stacking under 56.25rem with a 2.5rem row gap; padding 4.5rem, 2rem under 56.25rem and 1.5rem under 48rem.

## The 404

The hero pattern with a plain-text eyebrow and an animated character instead of a screen (`min(32.5rem, 100%)` wide in the tertiary text color), a solid ink back-home button whose arrow points back in either direction, then suggestion cards on the alternate background to the pages people most likely wanted, revealed as one block. No error code. `main` is `min-h-dvh` with `overflow: clip`. The cards form a bento (six columns, two large cards span three and three small span two, one column under 65.75rem, gap 2rem, 1.5rem collapsed): 1.5rem radius on the product-card fill, at least 9.375rem tall, padding 1.125rem at the block start and 1.5rem at the end, 1.75rem at the inline start and 1rem at the end, 24px icons at stroke 1.75, the title a `<p>` rather than a heading, external links with `target="_blank" rel="noopener noreferrer"`, and the transparent-at-rest focus outline.

## Footer

Under the page as in [MOTION.md](MOTION.md), on the same background token as the language curtain, `isolate`. Content at most `min(100%, 80rem)`; block padding 5rem (4rem from 40 to 48rem, 3rem under 40rem), inline 2rem, 1.5rem, 1rem. Grid `minmax(19rem, 1.7fr) minmax(0, 5fr)` (brand beside the links), one column under 68.75rem. Link groups are a five-column grid on desktop and CSS `columns` (3 on tablets, 2 on phones) with `break-inside: avoid`; group titles in the accent-text color, `nowrap`; links muted white turning white over 150ms, 20px icons at stroke 1.5. The last group is the legal pages. A centred legal line (leading 1.36) under a white-subtle top border, 2rem margin and padding, and under it, 1rem down and centred, a "Cookie settings" text button in the legal type, muted white turning white over 150ms, that reopens the cookie banner.

## Cookie banner

Appears after a one-second delay on a first visit and at once when reopened ([MOTION.md](MOTION.md)); a card at the bottom end on desktop (at most 27.75rem, padding 1.25rem, 2rem from the bottom and end, `large` radius), a bottom sheet on phones (at most 95vw, .5rem from the bottom, padding .75rem, buttons centred). The overlay is `pointer-events: none` with only the card `auto`, its bottom padding `max(.5rem, env(safe-area-inset-bottom))`. It is a `section` with an `aria-label` and `aria-live="polite"`: a sentence with a policy link (underline in the secondary border color turning primary on hover, color and decoration over 150ms, hover only under `(hover: hover)`, a 2px focus outline), Accept and Deny as the same solid ink button, equally prominent (c15t: "reject and accept at equal prominence"; before: Deny in the subtle border fill). The footer's "Cookie settings" button reopens it to change or withdraw the choice (GDPR Art. 7(3), in [DISCOVERY.md](DISCOVERY.md)). It reads the choice through `useSyncExternalStore` over storage (a named custom event in this tab, and the `storage` event from others filtered to the consent key), and publishes its own height as a variable so the page can pad its bottom, removing it when it closes.
