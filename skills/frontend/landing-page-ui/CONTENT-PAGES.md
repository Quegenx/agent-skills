# Pages with function

## Contact form

- **Fields:** a fill with an inset 2px focus ring (`box-shadow`, 200ms), a small accent dot after each required label, `autoComplete` per field, spellcheck off for email. Email inputs have no selection API, so render them as `type="text" inputMode="email"` when a feature needs the caret position.
- **Errors under the field, absolutely positioned** (end-aligned, no layout shift), fading and rising 4px, keyed by their text, `role="alert"`, linked with `aria-describedby`. Validate on submit; after the first submit, validate as the user types.
- **A clear button** inside text inputs: a small round tinted `×` that fades in from a 4px blur once there is text, clears and keeps focus in the field.
- **Cmd/Ctrl+Enter submits** from the message field.
- **Idempotent sends:** the form carries its own id (a fresh UUID after each success); the server validates with the same limits as the database's checks and upserts ignoring duplicates, so a double click or a retry lands on one row and still reports success. Fields are disabled and dimmed while sending and after success; typing again resets the success state.
- **Success** as in [MOTION.md](MOTION.md) (fields vanish, the button turns green, a success card unfolds), with the status repeated in a visually hidden `aria-live` output.

## A caret that glides

For the site's showcase fields: hide the native caret (`caret-color: transparent`) and draw a 2px accent bar that springs to the caret's position (stiffness 500, damping 30). Measure the text before the caret in a hidden span that copies the field's font, font features, variation settings and letter spacing (a mirror element with the same box for textareas, with a marker span at the caret), position from the right edge in right-to-left, and keep it inside the padding. Jump instead of spring when the caret was hidden (first focus). Hide it while a range is selected (the browser draws the range), on blur, when disabled, and when it scrolls out of the box. Re-place on `selectionchange`, on fonts loading (`document.fonts`), on resize, and a frame after wheel or touch scrolling; one pending animation frame at a time. Reduced motion: a spring so stiff it is instant.

## Help center

- **Header** with the animated title and a word-by-word description; a search card with a big outlined button that shows a `⌘K` tag (whose tint deepens with the button's hover), and the same shortcut opens the search anywhere on the page.
- **Topic cards** in two columns (icon that tilts toward the pointer, title, one-line description that wraps on phones, an arrow that fades in); common questions; a card for asking a person; the closing call.
- **Topic page:** its questions as accordions, topped up with questions from other topics to at least six so a small topic never looks empty; the question named in the URL hash opens on arrival (read through `useSyncExternalStore` on `hashchange`), and a click takes over from there.
- **Data:** topics (slug, title, description, meta description, icon, questions) and questions (id, title, answer, bullets, a link to the anchor on its topic page), all from translated messages.

## Help search (a command palette)

- Portaled after hydration; a scrim that fades in 200ms and closes on press; the panel rises from `scale(.9)` and 1.25rem. Closing fades out and unmounts on the opacity `transitionend` (with a timer fallback). While open, body scrolling is locked and wheel and touch moves on the scrim are prevented; the input takes focus a frame after opening; the smooth-scroll library is told to leave the panel alone.
- Results in two groups (questions, then guides) with headings, filtered by the title, the answer and its bullets. The results are real links (Tab reaches them); in the input, arrows move a highlight that wraps around, hover moves it too, Enter opens it, Escape closes. The highlighted row shows an "Enter" hint.
- A preview pane beside the list on desktop: the result's kind and category tag, its title as a link, its answer and bullets, with a fade at the bottom where it scrolls.

## Blog

- **Index:** the hero, the newest post as a featured card (image at about half the width, "Featured" and category labels, a large title), then recent posts with a category select and numbered pagination (four a page; changing the category resets to page one; paging scrolls back to the list's top).
- **Recent card:** an image frame (lazy), title, a two-line clamp of the excerpt, a category chip; rows on desktop, stacked on phones.
- **Category select:** a split trigger (label half and arrow half, each rounded on its outer side), a popover that scales in from its trigger origin in 100ms.
- **Pagination:** a pill panel with round previous and next buttons (mirrored in right-to-left, faded when disabled) and page numbers with `aria-current="page"`.
- **Post:** a back link, the title with its computed accent part, author, date and category, then a grid of an on-this-page rail and the article: the hero image (high fetch priority, opens in the image preview), a separator, and blocks.
- **Article model:** blocks (paragraph, heading with id and level, list, quote, image with size and caption, table with a label) of rich inline pieces (text, strong, emphasis, code, internal or external link, line break). Render each block with its own reveal; headings report when they are in view for the rail; images open in the preview; tables scroll sideways inside a ring.
- **Data:** published articles per language, decoded by a schema at the boundary, images joined by translation group, an article without its cover image left out; a missing slug is a real not-found.

## Legal documents

One component for every document: title (animated), the updated date, an intro, sections (id, title, paragraphs, optional points) beside an on-this-page rail. Article measure about 42rem with a 1.65 line height. Email addresses in the text become `mailto:` links (with a bounded pattern so matching stays linear). Section reveals follow the hydration rule in [MOTION.md](MOTION.md).

## On-this-page rail

A sticky list under the header (hidden on phones) with a start border; the active item at full opacity and the rest at 50%, a 2px indicator that springs between items (a shared layout id), `aria-current="location"`. The active section is the one whose top crosses into the upper half of the viewport (`margin: -100px 0 -50% 0`, 30% visible). Headings get `scroll-margin-block-start` equal to the anchor offset.
