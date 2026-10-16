# Motion

One ease runs the site's reveals: `cubic-bezier(.19, 1, .22, 1)` (fast out of the gate, long settle), around .9s for text and .8s for panels. Load the motion library's features once per page (a lazy feature bundle around `<main>`), not per component.

## The hero assembles once

In order, each on the site ease: the eyebrow (logo and product name) rises 8px at .2s; the title's letters land; the description rises 12px at .7s; the actions rise 8px at .9s; the product screen clears in last. With reduced motion every delay and duration is 0.

**Title letters:** split each line into graphemes (`Intl.Segmenter`, so emoji and pointed letters stay whole), and first into direction runs, each in its own `<bdi dir>`, so a Hebrew title with an English word keeps its order. Each letter starts at opacity 0, `scaleY(.72)`, 18px lower and a random tilt of up to 8 degrees, and lands on an elastic ease (`elastic.out(1, .62)`, .72s), the whole line staggered over about .48s from its start. Letters squash on hover (`scaleX 1.08, scaleY .82`, 6px down, a quick back-out) and spring back elastically. The animated letters are `aria-hidden`; the full title sits beside them as screen-reader text. Key repeated letters by occurrence, not by index. Reduced motion: set every letter visible and stop.

## Headings that rise word by word

A section heading is a statement with a muted part (`text` and the `muted` substring, which must exist in it; throw if not, so a translation that drops it fails loudly). Once the heading enters view (once), each word rises from 50% of its height with a 45-degree `rotateX`, .937s, starting at .3s plus 50ms per word, counting words across both parts. Whitespace between words is kept as typed. For dynamic titles (blog posts) compute the muted part: the last 35% of the words, at least one, never all.

## Scroll reveals

Content clears from an 8px blur and transparency over .8s ease-out as it enters the viewport (30% visible), and again each time it re-enters: a section scrolled past and back still feels alive. Separators draw in the same way. Use a smaller threshold (1%) for items in a horizontal track, where little of each is visible at first. On pages that must render identically on the server (legal documents), enable reveals only after hydration and only without reduced motion, so hydration never adds or removes wrappers.

## Smooth scrolling

A smooth-scroll library at the root (anchors handled, its own animation frame, reduced motion respected). Dialogs, menus and scrolling panels opt out with the library's prevent attribute, or their own scroll gets hijacked. After content changes height (a new page of posts), tell it to resize before scrolling to an anchor.

## The floating header

- A rounded nav floating 2.5rem from the top (1rem on phones), as wide as the page minus 4rem, its max width springing from 75rem to about 69rem once the page has scrolled (stiffness 500, damping 25). Detect scrolling with a 4px marker at the top of the body and an `IntersectionObserver`, not a scroll listener.
- **The menu grows out of the bar:** the nav's height animates from the bar's height to the tallest card plus padding in .22s on `cubic-bezier(.23, 1, .32, 1)`, and the cards fade up 8px with a 30ms stagger, overlapping the growth by 80ms. Closing plays the same timeline in reverse at 1.35 times speed. Rebuild the timeline when the page width changes (the cards wrap differently), never on height changes. Open with the state flushed first, so the cards exist before the timeline runs. Close on Escape, on a press outside (capture phase), and on choosing a link.
- **Cards, one per navigation section,** each a list of pill links with an icon (the current page solid accent with `aria-current="page"`), plus a settings card with the language choice. Two columns on phones, a row on desktop. The hamburger's two lines cross into an X in 200ms.
- One list of navigation items (title, description, two icon styles, address) feeds both the header menu and the footer.
- On the narrowest phones the wordmark hides and only the sign-up button stays, so the bar fits.

## The footer rises from under the page

The footer is fixed to the bottom behind the page and revealed as the page scrolls off it: a shell as tall as the footer's content (measured with a `ResizeObserver`) clips with `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)`, and the content inside is sticky at `top: calc(100svh - height)`. Its parts scroll-reveal as usual.

## Language switch: a curtain of columns

Five brand-colored columns, each a fifth of the width, grow from 0 to full height one after another (50ms apart, 500ms each, `cubic-bezier(.33, 1, .68, 1)`, with the Web Animations API and `fill: forwards`), the logo fading in over them. Once covered (about 700ms), pending work saves, a session flag is set, and the language switches (a reload). The new document's head script sees the flag and shows the covering columns from the first frame; then the logo fades first and the columns shrink back in reverse order starting at 400ms. Clear the flag when done. The app shares the same hook with its own overlay. Reduced motion: no animation, same sequence.

## Hover details

- **Arrow in a circle on cards:** an outlined 40px circle that fills with the accent on hover or focus; inside, the arrow flies out up and forward while a second copy flies in from the opposite corner (a 20px diagonal on a spring with bounce .35), then the track resets instantly. Mirrored in right-to-left.
- **Link with a circled arrow:** the circle's tint scales to 1.2 and the arrow nudges 1.5px forward (or forward and up for external links).
- **Tilting icon:** on a topic card the icon follows the pointer (offset and rotation of 6 times the pointer's normalized position, scale 1.1, a lively spring), its color turns to the accent through a CSS variable, and an arrow fades in from a small inline offset.
- **Back link:** its arrow nudges 2px backward on hover with a stiff spring.
- **Post cards dim to about .75 opacity on hover** (fine pointers only) instead of lifting.

## Decorative motion

- **A tile pattern behind a form:** groups of rounded squares spring in from scale 0 (bounce .25, 1s, groups 50ms apart), then breathe in opacity (1, .33, 1 over 3s, half of them offset by 1.5s) forever. Each tile has a twin that fades in an accent tint under the pointer (fine pointers only). `aria-hidden`, stopped with reduced motion.
- **A character on the 404:** eyes that blink and look side to side on a keyframe track every few seconds; three question marks bob and sway out of phase (±4px and ±4 degrees, 1.5s, reversing). Still with reduced motion.
- **Carousel edge fades:** a mask gradient on the track whose start and end strengths are CSS variables driven by motion values: the fade appears quickly (80ms) when there is more to scroll on that side and disappears slowly (700ms) when the end is reached. Flip the mask in right-to-left.
- **Feature tokens on a card** fade up 4px from a 4px blur once in view, 50ms apart.

## Forms that celebrate

- The contact form rises from `scale(.95)` and 20px on a no-bounce spring after a short delay.
- On success each field's text turns into particles and blows away: draw the text into a half-scale canvas with the field's exact font, alignment and wrapping, read its pixels into particles, then sweep a threshold from the end toward the start 8px a frame, particles past it drifting a pixel at random and shrinking; when every field reports done, the success card unfolds (height from 0 with a negative top margin) in .28s. Reduced motion: clear at once.
- The submit button's label morphs from Send to Sending to Sent, its color animates to the success green, and a check slot grows from 0 width while the check pops in on a heavy spring.

## Image preview

A thumbnail button and the preview dialog share a layout id, so the image grows into the full view (.25s) and shrinks back. While open: everything else in the body is `inert`, scrolling is locked, focus goes to the close button and Tab stays on it, Escape and a press on the blurred backdrop close it, and focus returns to the thumbnail when the exit finishes. The dialog can be dragged within ±90px with elastic edges, tilting up to 2.5 degrees with the drag, and springs back on release.

## Lists that refilter

Changing a category or page: cards keep their identity (a layout id per post) so they glide to new places, new cards fade in by row with a step that scales with the viewport height, leaving cards fade faster, and an empty result fades in from `scale(.96)`. Scroll back to the top of the list after paging, below the header.
