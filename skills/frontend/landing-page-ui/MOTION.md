# Motion

One ease runs the site's reveals: `cubic-bezier(.19, 1, .22, 1)` (fast out of the gate, long settle), around .9s for text and .8s for panels.

**Lazy feature wrappers, in strict mode, sit where the motion is:** a page's `<main>` wrapper loads the smaller bundle once for the page; the header and the cookie banner, outside `<main>`, each wrap themselves; every scroll reveal and separator carries its own wrapper; the home page's hero, showcases and questions each wrap their own section. Layout ids and drag need the larger bundle, so the on-this-page rail, the blog post page and the legal page wrap in it (the rail indicator, the image preview's grow and drag). **Reduced motion** is read through the library's hook everywhere except the title letters, which check the media query once on mount.

## The hero assembles once

| Piece | Motion |
|---|---|
| Eyebrow (28px logo and product name) | rises 8px from .2s |
| Title | letters land (below) |
| Description | rises 12px from .7s |
| Actions | rise 8px from .9s |
| Product screen | no delay: clears from its 8px blur from the first frame, so the largest paint is never held back |

Each rise takes .937s on the site ease and sits inside a scroll reveal, so its blur replays when it re-enters view. The accent line is semibold. With reduced motion every delay and duration is 0.

**Title letters:** split each line into graphemes (`Intl.Segmenter`, so emoji and pointed letters stay whole), and first into direction runs, each in its own `<bdi dir>`, so a Hebrew title with an English word keeps its order. Hebrew or Arabic letters start a right-to-left run, any other letter or digit a left-to-right one; neutral characters join the current run, and neutrals trailing an opposite-direction run return to the base direction, so end punctuation lands on the correct side. A line is a list of segments (lead, highlight, trail, each with its own letter class, so an accent can sit mid-sentence; a segment can render as `sup`), and a second line starts with a break-before flag. Key repeated letters by occurrence, not by index. The animated letters are `aria-hidden`; the full title, lines joined with a space, sits beside them as screen-reader text hidden with `clip-path: inset(50%)`. Reduced motion: set every letter visible and stop.

| Letter phase | Values |
|---|---|
| Start | opacity 0, `scaleY(.72)`, 18px lower, a random tilt per letter in -8 to 8 degrees, origin bottom center |
| Land | `elastic.out(1, .62)`, .72s; each line its own tween in parallel, staggered over .48s from the start |
| Hover in (pointer enter on each letter, any pointer, motion setting not checked) | `scaleX(1.08) scaleY(.82)`, 6px down, .22s `back.out(2.8)` |
| Hover out | .42s `elastic.out(1, .48)` |

## Headings that rise word by word

A section heading is a statement with a muted part (`text` and the `muted` substring, which must exist in it; throw if not, so a translation that drops it fails loudly). The muted words take the faint ink role (.4); both tones are `inline-block relative`. Once the heading enters view (once), each word rises from `rotateX(-45deg)` and 50% of its height, .937s on the site ease, starting at .3s (.5s for a page header's description) plus 50ms per word, counting words across both parts. An option plays the words back to hidden when they leave view. **Words are the non-space runs** (`/\S+/gu`), keyed by text and position, with one plain space between them; the heading's parts are trimmed and joined by a single space where the source text had whitespace. For dynamic titles (blog `h2`s and post titles) compute the muted part as `min(max(1, ceil(n × .35)), max(1, n - 1))` of the last words: at least one, never all unless the heading is one word.

## Scroll reveals

Content clears from an 8px blur and transparency over .8s ease-out as it enters the viewport (30% visible), and again each time it re-enters: a section scrolled past and back still feels alive. Separators draw in the same way. Use 1% for items in a horizontal track, where little of each is visible at first, and 10% for the on-this-page rail and the pagination. A heading and its description each get their own reveal. **The reveal runs the same under reduced motion:** the blur and fade play whatever the setting. Legal documents are the one place that drops it: the reveal wrappers render on the server and stay through hydration, and only after hydration, when reduced motion is set, are they removed, so hydration never removes the server's wrappers.

## Smooth scrolling

A smooth-scroll library at the root (anchors handled, its own animation frame, reduced motion respected). Dialogs, menus and scrolling panels opt out with the library's prevent attribute, or their own scroll gets hijacked. **After content changes height** (a new page of posts): set the state, wait one animation frame, tell the library to resize, then jump to the section instantly (`force` and `immediate`), not smoothly; without the library fall back to `scrollIntoView({ behavior: "instant" })`, which honors the section's `scroll-margin-top`.

## The floating header

- **A rounded nav floating 2.5rem from the top** (1rem on phones), its max width springing from 75rem to about 69rem once the page has scrolled (stiffness 500, damping 25), its width moving over 300ms on `cubic-bezier(.23, 1, .32, 1)` alongside: `100% - 1.5rem` on phones (under 40rem) and `100% - 3rem` once scrolled, `100% - 4rem` from 40rem and `100% - 7rem` once scrolled up to 64rem. Detect scrolling with a 4px marker (absolute, 1px wide, `visibility: hidden`, `aria-hidden`, prepended to the body) and an `IntersectionObserver`, not a scroll listener.
- **The menu grows out of the bar:** closed, the nav is the bar's height (68px, 60px under 40rem) with `overflow: hidden`. Open height is, from 64rem, 68 + the tallest card's `scrollHeight` + 24px (300px if nothing measures); below 64rem, measure the card area by setting it `static`, visible and `height: auto` for a moment, restore its styles, and open to the bar + its `scrollHeight` + 16px.

| Menu timeline | Normal | Reduced motion |
|---|---|---|
| Nav height | .22s `cubic-bezier(.23, 1, .32, 1)` | .15s |
| Cards | fade up 8px over .18s, 30ms stagger, overlapping the growth by 80ms | .15s, no offset, no stagger, overlap .15s |
| Close | the same timeline reversed at 1.35 times speed | |

- **Timeline housekeeping:** mark the state closed only when the reverse completes. Rebuild the timeline when the page width changes (`documentElement.clientWidth` in a `ResizeObserver`; the cards wrap differently), never on height changes, and if it is open, set the new height and jump to the end. Open with the state flushed first, so the cards exist before the timeline runs. Close on Escape, on a press outside (capture phase), on choosing a link and on the logo link; choosing a language closes the menu first, then starts the curtain.
- **The card area** is `inert`, `invisible` and `pointer-events: none` while closed, `overflow-y: auto` with `overscroll-behavior: contain`, 4.25rem from the top (3.75rem on phones): a two-column grid below 64rem, a row aligned to the end from 64rem, gap .5rem (.75rem on desktop). One card per navigation section, each a list of white pill links (subtle border, min height 2.25rem, `.5rem .75rem`, white-hover fill over 200ms, 17px icons at stroke 1.8; the current page solid accent with `aria-current="page"`), plus a settings card with the language choice.
- **The hamburger:** a 2.75rem hit area, two 2px lines 1.875rem wide (1.5rem on phones) and .375rem apart that cross into an X (`translateY(±.25rem) rotate(±45deg)`) in 200ms.
- One list of navigation items (title, description, two icon styles, address) feeds both the header menu and the footer.
- Log in hides under 40rem (it is one tap away inside the app); on the narrowest phones the wordmark hides too and only the sign-up button stays, so the bar fits.

## The footer rises from under the page

The footer is fixed to the bottom behind the page and revealed as the page scrolls off it: a shell as tall as the footer's content (measured with a `ResizeObserver`, rounded up with `Math.ceil`) clips with `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)`, the fixed layer takes the same height at `bottom: 0`, and the content inside is sticky at `top: calc(100svh - height)`. A missing content element throws a distinctive error (`FOOTER_REVEAL_NOT_MOUNTED`). Its parts scroll-reveal as usual.

## Language switch: a curtain of columns

Five brand-colored columns (each 20vw by 100dvh, z 1100), animated with the Web Animations API and `fill: forwards` on `cubic-bezier(.33, 1, .68, 1)`:

| Phase | Timing |
|---|---|
| Cover | columns grow from 0 to full height one after another, 50ms apart, 500ms each; the logo fades in from 100ms over 350ms |
| Switch | at 700ms: pending work saves, the session flag is set, the language switches (a reload) |
| Reveal (new document) | the head script shows the columns from the first frame; the logo fades out from 350ms over 250ms; columns shrink from 400ms + 50ms × (4 - index), the reverse order; done at 1100ms |

The logo is forced left-to-right so the wordmark keeps its mark on the left in both languages. If the save before the switch throws, switch anyway (the columns already cover the page), and wrap every `sessionStorage` call in try/catch. Clear the flag when done. The app shares the same hook with its own overlay. Reduced motion: no animation, same sequence.

## Hover details

Each follows the hover rule in [SKILL.md](SKILL.md): the trigger for each is stated below.

- **Arrow in a circle on cards:** a 40px circle with a 1px translucent border that, on hover or focus, takes the accent fill, a 2px accent border and a white icon (colors over 180ms). Inside, the 20px arrow (stroke 1.75) flies out up and forward while a second copy flies in from the opposite corner (a 20px diagonal on a spring, bounce .35, .35s), then the track resets with a zero-duration jump on completion, even while still hovered. The whole circle mirrors in right-to-left. The flight starts on `mouseenter`; focus and hover both turn on the fill. Reduced motion skips the flight and keeps the fill.
- **Link with a circled arrow:** a 24px circle whose 20px tint (`color-mix(in srgb, currentColor 10%, transparent)`) scales to 1.2 while the arrow (stroke 1.5) nudges .09375rem forward (diagonally for external links; in right-to-left compose `scaleX(-1)` with the translate), both over 200ms ease, while a hovered state set by `pointerenter` and cleared by `pointerleave` is on.
- **Tilting icon:** on a topic card the 46px icon follows the pointer: position normalized to ±.5, times 6 for both offset and rotation, scale 1.1, on a lively spring (stiffness 400, damping 16, mass 1), all reset on leave, from `pointermove` on any pointer and whatever the motion setting. On plain `:hover` its color turns to the accent through a CSS variable and the card takes the elevated fill and a `0 1px 2px` shadow over .2s; on `pointerenter` a 40px arrow circle at top end 1rem fades in from a .25rem inline offset (in right-to-left rotated 180 degrees and offset the other way) over .2s; the arrow is hidden under 48rem.
- **Carousel card:** text goes from secondary to primary on a .15s ease-in tween (the name's color over 200ms); its arrow flies on mouse enter, and its fill follows mouse enter and leave and focus and blur.
- **Back link:** tertiary to primary over 200ms; its arrow nudges 2px backward on a stiff spring (stiffness 450, damping 24; +2px in right-to-left, -2px in left-to-right), none with reduced motion.
- **Post cards dim on hover instead of lifting:** .76 opacity for the featured card, .72 for recent ones, over 300ms with motion allowed (0s otherwise), fine pointers only.

## Decorative motion

- **A tile pattern behind a form:** groups of rounded squares (`transform-box: fill-box`, origin center) spring in from scale 0 (bounce .25, 1s, starting at .25s plus 50ms per group), then breathe in opacity (1, .33, 1 over 3s ease-in-out, half of them offset by 1.5s) forever. Each tile has a twin that fades in an accent tint under the pointer (200ms `cubic-bezier(.77, 0, .175, 1)`, pointer events only under `(hover: hover) and (pointer: fine)`). The art is drawn at 55.5 by 55.125rem, `rotate(-47deg) scale(1.5) skew(10deg, 15deg)`, centred behind the form (art z 1, form z 2). `aria-hidden`, stopped with reduced motion.
- **A character on the 404:** one drawing shared with the app. Its eyes run a keyframe track: `scaleY [1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1]` (three blinks) and `x [0,15,15,-15,-15,-15,0]`, 1.25s on `[.75, 0, .35, 1]`, after 1s, repeating every 4s. Three question marks (weight 850, accent, display-large size, `select-none`, placed 16% apart and alternating 0% and 6% from the top) bob and sway out of phase (±4px and ±4 degrees, 1.5s, reversing), with negative delays (rotation `.75 - .5 × index`, rise `-.5 × index`) so each starts mid-phase. Still with reduced motion.
- **Carousel edge fades:** a mask gradient on the track whose start and end strengths are CSS variables driven by motion values: the fade appears quickly (80ms) when there is more to scroll on that side and disappears slowly (700ms) when the end is reached. The fades are asymmetric, 3rem at the start and 6rem at the end (1rem and .75rem on phones). The first render already has "can scroll next" true and the end fade at 1, so the server render shows it. Flip the mask in right-to-left.
- **Feature tokens on a card** fade up 4px from a 4px blur once in view (viewport margin -40px): the group waits .1s, then 50ms apart, each .35s on `[.25, .1, .25, 1]`, a "+N more" token included. Under reduced motion they start visible.

## Section entrances

| Piece | Motion |
|---|---|
| Showcase badge | rises 8px over .35s at .5s once in view |
| Showcase description | rises 16px over .35s at 1s |
| Showcase actions | rise 8px over .2s at 1.25s |
| Closing panel | rises 24px over .8s on the site ease, in view with a -80px margin, once |
| Cookie banner | after 1s (at once when reopened from the footer), rises 20px over .5s on the site ease (opacity only over .2s with reduced motion); leaves with a fade and `scale(.94)` over .2s |

Showcase pieces use the library's default ease and layer on top of their scroll-blur reveal; the badge and description wait for the section to be in view (`once`), the actions play from mount, and reduced motion makes each duration 0.

## Questions

| Accordion part | Spring or timing |
|---|---|
| Plus to minus icon | stiffness 220, damping 20, mass .5: the horizontal stroke turns 180 degrees, the vertical one goes to `rotate(80deg) scale(0)` |
| Panel height | stiffness 280, damping 18, mass .2 |
| Answer fade | stiffness 200, damping 18, mass .5, .1s after opening starts (open only) |
| List height (show more, show less) | 600ms on the site ease, ended by a 600ms timer, the same under reduced motion; at rest duration 0 and `height: auto`, so a row opening inside it is never clipped |

The icon is a 52px SVG pulled in with negative block margins so it doesn't grow the row, with `backface-visibility: hidden` and `translateZ(0)` against jitter.

## On-this-page indicator

A 20px bar, centred on its item and offset -0.09375rem so it sits on the rail's start border, springs between items through a shared layout id (stiffness 400, damping 30; instant with reduced motion). Item opacity moves over 200ms on `cubic-bezier(.4, 0, .2, 1)`.

## Forms that celebrate

- **The contact form rises** from `scale(.95)` and 20px on a no-bounce spring (.7s) after .25s; duration 0 with reduced motion.
- **On success each field's text turns into particles and blows away:** draw the text into a half-scale canvas (at least 800px tall, 16px in from the start) with the field's exact font, alignment and wrapping (wrap a textarea by measuring and breaking at the last space or tab; centre each line at `(paddingTop + lineHeight × (i + .5)) / scale`; in right-to-left set the origin top right, `direction: rtl` and right alignment), and show the canvas with `filter: invert(1)`. Read its pixels into particles: **one particle per pixel whose red, green and blue are all non-zero**, in that pixel's color (the text is drawn in the field's own color). Sweep a threshold from the end toward the start 8px a frame; particles past it drift up to 1px at random on each axis and shrink by .05 times a random number a frame. Count each field's finish once (a set) and, when every field has reported, unfold the success card (height from 0 and top margin from -24px, .28s on the site ease). Reduced motion: clear at once.
- **The submit button:** its label morphs from Send to Sending to Sent (a text-morph library, 400ms on the site ease); fill and text animate from brand to success and white over .3s on `cubic-bezier(.22, 1, .36, 1)` (a matching 300ms CSS transition); a check slot grows to 18px wide with an 8px start margin over .15s while the check pops in from scale .6 and opacity 0 on a heavy spring (stiffness 800, damping 80, mass 4, rest delta .0001, after .1s) and leaves on the same spring. Its hover fill switches off once sent.
- **Field errors** fade over .2s ease-out in a presence group that pops their layout and skips the initial render.
- **The clear button** enters and leaves over .22s ease-in-out with a 4px blur (a .12s fade without blur under reduced motion), in a presence group that skips the initial render, so a pre-filled field doesn't animate it in.

## Image preview

- **The thumbnail and the dialog share a layout id,** so the image grows into the full view (.25s on `[.23, 1, .32, 1]`) and shrinks back. The portal mounts only once a client snapshot says it can (`useSyncExternalStore`, server snapshot false); the presence group skips the initial render.
- **While open:** every other child of the body is `inert` (save each child's previous value and the body's previous `overflow`, and restore them), scrolling is locked, focus goes to the close button and Tab stays on it, Escape and a press on the blurred backdrop close it, and focus returns to the thumbnail when the exit finishes. Reset the motion values on close.
- **Drag:** within ±90px, elastic .22, no momentum, scale 1.01 while dragging, tilting with the drag (`rotateX` maps y ±300 to ∓2.5 degrees, `rotateZ` maps x ±300 to ±2.5), springing back on release (bounce .2, .5s). Reduced motion disables drag. The close button's `pointerdown` stops propagation so it never starts a drag.
- **Sizes:** the portal at z 1000 with `overscroll-behavior: contain`, `pointer-events: none` (children `auto`) and the smooth-scroll library's prevent attribute; the dialog at most `min(68.75rem, 94vw)` by `calc(100dvh - 1.5rem)`, `touch-action: none`, a grab cursor, images `draggable={false}` and `select-none`; the close button a 32px disc in a 40px hit area at top end .75rem (background over 180ms), fading in from a 4px blur over .22s (.12s, no blur, with reduced motion).

## Lists that refilter

Changing a category or page: cards keep their identity (a layout id per post, dropped under reduced motion) in a presence group that pops leaving cards out of the layout, so the rest glide to new places. Each card also has its own scroll reveal.

| Part | Timing |
|---|---|
| Step | `min(34.28 / viewportHeight, .175)` |
| Entering card | waits `(floor(i / 2) + 1) × step × 1.5`, fades in over .3s ease-out (rows of two) |
| Leaving card | waits `(floor(i / 2) + 1) × step × .75`, fades out over .15s with `pointer-events: none` |
| Empty result | fades in from `scale(.96)` over .7s on the site ease |

Read the viewport height with a `ResizeObserver` on `<html>`, updating only above 920px of width (or on the first read), so a phone's toolbar resizing never retimes the stagger. Scroll back to the top of the list after paging, below the header (see smooth scrolling).
