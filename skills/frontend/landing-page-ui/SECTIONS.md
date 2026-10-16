# Pages and sections

## The page template

**Product page:** hero, story sections, questions (an expandable FAQ), closing call. **Home:** hero, one showcase per audience (each a rounded card inset from the page edges, one of them forced dark), a platform section, questions, closing call. Pages are thin: they list blocks; the blocks own layout and motion.

## Hero

An eyebrow (logo and label), a two-line title (the second line in the accent, italic in Latin and upright in Hebrew), a description at about 39rem, the two app buttons (sign up solid, log in soft; full width up to 22rem on phones), and a product screen in a panel whose bottom fades out through a mask (`linear-gradient(180deg, #000 72%, transparent)`) and tucks under the next section with a negative margin. The hero screen gets `fetchPriority="high"`; every other screen is `loading="lazy"` and `decoding="async"`.

## Story blocks

All share one rounded surface (2rem panels, 1.5rem cards), collapse to one column under 48rem, and scroll-reveal:

- **Section header:** the two-tone heading and a description, centered.
- **Panel:** a product screen beside a title and text; can reverse sides; a variant for gray backgrounds.
- **Card:** a screen above a title and text; used in pairs.
- **Options panel:** a screen and a wrap of pill options (what it takes into account).
- **Flow panel:** a screen beside numbered steps in accent circles (the steps of how it works).
- **Closing panel:** a final screen with a title and text, after a separator.
- **Alternate sections** take a faintly tinted background to break the rhythm (usually the options section).

The order that works: the problem (panel), what it does (two cards), what it considers (options), how it flows (steps), more (two cards on gray).

## Showcase sections (home)

Once the section is in view: its badge rises at .5s, the title's letters land, the description rises at 1s, the actions at 1.25s; then a framed product screen (fading out at the bottom), a subsection heading with its own button, and capability cards (label, title, description, feature tokens divided from the text by a line; three columns, one on tablets). The dark section's background is two layered gradients (near-black at 85% over a diagonal from black into the brand color).

## Carousel of capability cards

A horizontal track with proximity snap and no scrollbar; cards about 22.8rem (82% on phones, so the next peeks); round glass previous and next buttons, disabled at the ends; scroll by one card plus gap, with the sign flipped in right-to-left (read the position as `Math.abs(scrollLeft)`); recompute what can scroll on scroll and with a `ResizeObserver`; edge fades as in [MOTION.md](MOTION.md). Each card is a link with a frosted layer (`backdrop-filter: blur(.75rem)`), an icon tile, a name, a big figure, a description and the hover arrow.

## Link cards

A grid of `repeat(auto-fit, minmax(18.75rem, 1fr))` cards, each with an icon tile, the hover arrow, a title (`unicode-bidi: isolate`) and a description, each linking to a feature page. The 404 page uses a bento version (six columns, large cards span three and small span two, one column under 66rem).

## Plans

Three cards on the story-card surface, stretched to the row's height (the reveal wrapper is a flex container). The badge shares the name's row so every price lines up. The price shows as a big tabular figure and a muted period, with a screen-reader sentence ("99 shekels a month") in place of the visual pair. Features with tick icons under a divider; the recommended plan's button is solid, the others soft; a note about payment under the grid.

## Questions

- **Accordion row:** the question as a button inside a heading (level set by the page), the answer as a region labelled by it, `inert` when closed. The plus turns into a minus (the horizontal stroke turns half a turn while the vertical one turns and shrinks to nothing, on a soft spring); the panel's height opens on a springier one; the answer fades in 100ms after opening starts. One row open at a time. Schema.org question and answer microdata on the rows.
- **Expandable list:** the first five, then "Show 6 more" and "Show less". The list's height animates over 600ms to the bottom of the last visible row (measured), clipping and ignoring the pointer only while it moves; hidden rows are `display: none` and `inert` after. Collapsing closes an open row that will be hidden.
- **Layout:** heading beside the list, stacking under about 55rem of the section's own width (a container query); a "learn more" link with a circled arrow under it.
- **The same items feed the page's FAQ structured data** ([DISCOVERY.md](DISCOVERY.md)), and an answer that appears on several pages is written once.

## The closing call

A wide gradient panel: the app icon, the two-tone heading, a short line on what happens next (24 characters a line at most), the two app buttons, and a product screen at the end (absolute on desktop, below on phones). It rises 24px once in view.

## Support card

A panel with a heading, a description and a link with a circled arrow, beside a product screen (inset or full bleed); used before the closing call on the FAQ and help pages.

## The 404

The hero pattern with an animated character instead of a screen, a back-home button whose arrow points back in either direction, then suggestion cards to the pages people most likely wanted. No error code.

## Cookie banner

Appears after a one-second delay, rising 20px; a card at the bottom end on desktop, a bottom sheet with the safe area on phones; a sentence with a policy link, Accept (solid) and Deny (subtle); leaves with a quick fade and `scale(.94)`. It reads the choice through `useSyncExternalStore` over storage (a custom event in this tab, the `storage` event from others), and publishes its own height as a variable so the page can pad its bottom.
