# Data views

## A results header

A title with the count in a badge (the count morphs), status lines beneath it (still collecting up to N, reached the end at N, the source's own total, more available), and the controls at the end: scope, sort, filters, columns. A source that caps its total ("50,001") reads as "more than 50,000". Results and their job status share one card: errors with a retry action on top, a progress line with Stop for jobs that can stop (a search shows its progress on its own button instead), then the items.

## Filters

- **A Filter button with the count of active filters** in a badge that springs in with the first filter (growing width from 0, scale from .6, no bounce) and out with the last; `aria-expanded`, `aria-controls`. The fields open beneath in a disclosure panel.
- **While the panel is closed, the active filters stay visible as chips,** each with its own `×` that clears that one filter, then "Clear all" in soft red. The `×` sits in a round tint that deepens when its chip is hovered.
- **Count what each option would keep** (facets): "Video 12", so nobody picks an option that empties the list. "None chosen" means all.
- **Count only what differs from a fresh form,** and a dependent option only while its parent is on (comment count only while comments are collected).
- **Table-driven number filters:** one list of `{ key, label, chip, empty }` builds the fields, the chips and the counts, so they never disagree; the empty field says what empty means ("No minimum", "No limit").
- **Presets** (ready-made filter sets) as small buttons that replace the narrowing filters; **saved filters** in a dropdown panel listing them (apply closes it, a gray `×` deletes, named in its label) with a form to save the current ones under a name.
- **The grid of filter fields** goes 3, 2, 1 columns by the form's own container width; a switch takes a full row.
- **Every change of filter or sort returns to page one;** background updates (details loading row by row) do not.
- **Persist the form and the view** (sort, visible columns, page size) with the page's state, so a refresh keeps them; drop saved choices that point at items no longer there.
- A sort menu that mixes sorts the server runs with sorts the client applies keeps their values apart with a prefix (`local:newest`), and offers only the sorts that apply to the current scope.

## Tables

- A scrolling frame with rounded corners (so the header fill never shows square corners), `th scope="col"`, `aria-sort` on the sorted header, tabular figures, `white-space: nowrap` where values must stay whole. Cells centered by default with per-column opt-in start alignment; the name column starts at the reading edge.
- **Sortable headers are buttons;** the hover fill extends about .6rem past the text with a negative margin; an unsorted column shows a faint arrow. Sorting returns to page one and the rows glide to their new places: record each row's `offsetTop` (layout-relative, so scrolling doesn't skew it), let the sort render, then animate each row from its old offset to zero. Only on a sort-key change: filtering and paging add and remove rows, they don't move them.
- **Select-all is indeterminate when some rows are selected** and disabled when there are none; each row's checkbox is labelled with the row's name.
- **The name cell opens the details** and loads them if missing; a row whose details failed shows the error inline and retries on the next click.
- Unknown values sort last. Unknown, none and not specified are three different texts.
- **Row actions sit side by side when the page is wide and stack when narrow** (a container query), so labelled buttons never push the table past its frame. A status button appears only when an item needs the user.
- On a gray card the table becomes a white panel; a selected row takes the primary tint; an expanded row keeps its hover tint.
- **Pagination** hidden for one page; previous and next icon buttons with tooltips, chevrons mirrored by direction; "Page 2 of 7" morphing; the page index clamped when rows shrink.
- With a table library that passes the same row and header objects across renders, a compiler that memoizes components (React Compiler) keeps stale output: opt the table files out (`"use no memo"`). Pass the actions to cells through the table's `meta`, fresh each render, and build column definitions once per variant; columns rebuilt with new callbacks remount every checkbox on each selection. Column labels as getters, so they follow a language change.
- **A table variant for picking** (selection controlled from outside, no row actions) inside a sheet, mounted only while open, with "n selected" and Done in the footer; outside, a summary ("4 of 12") with Choose or Change and a soft red Clear, and the first six chosen as pills that wrap whole names, then "and 6 more".

## Rows with actions

Account rows, memory rows, settings rows: a grid of avatar, text and actions. What an action will do opens beneath the text, so the row's first line never re-centres; the actions move under the text when the container is narrow. Rows have no fill at rest and a tint on hover, so the gray buttons in them stand out. One item busy at a time: every button in the row is disabled and the running one's label morphs ("Checking…"). The list reloads after each action, success or not. A count badge ("2 of 5") beside an Add button that is disabled when full or when the service behind it is down, with a notice saying which.

## Selection bars

Bulk actions beside the selection they act on, in a disclosure panel that opens with the first selected row: the count (morphing), Clear in soft red, then the actions. Each action counts only the rows it applies to ("Join 3", "Save 5") and is disabled when none do. While the bar collapses it keeps the last counts instead of showing zero. Deleting asks in place, the count morphing into what will be lost. Derive the selection from the current items, so deleted items drop out of it.

## Boards and lists of the same items

- **A board:** columns as gray wells holding white items with no shadows; sticky column heads opaque so items scroll under them; columns `minmax(14rem, 1fr)` but never wider than `100% - 2.5rem` on narrow screens, so the next column peeks in and says there is more. The column's add button appears on column hover (and always on touch and on focus), a shade deeper than the well so it reads as a button, deeper again on hover: one color, not two.
- **A list:** a group per status as one gray card holding its sticky head and white rows; the chevron turns, the rows fold. Row checkboxes appear on hover, focus or selection (always on touch). Container queries add the status at 28rem, labels at 36rem. `scroll-margin-block-start` on rows' controls so keyboard focus clears the sticky head.
- **Pickers on a card or row** (status, priority) stop `pointerdown`, `click` and `keydown` from reaching the card, which opens or drags; a pick saves at once and ignores the same value. Pressing a card's title stops `pointerdown` so it opens without starting a drag. Hovering or focusing prefetches what opening needs.
- **Drag and drop:** a pointer sensor with a 5px activation distance (clicks still click) and a keyboard sensor, localized screen-reader instructions; while dragging, render from a local copy of the order, save once on drop, restore on cancel; moving over another column inserts before the hovered item or at the end. The dragged item stays in place at half opacity while a dashed outline follows the pointer. Turn dragging off while the view is sorted or filtered (the order shown isn't the stored one) and say why. Give the sortable wrapper its drag attributes only when dragging is on: the library makes the wrapper a button with `aria-disabled`, which marks every control inside it disabled to screen readers.

**Switching between board and list:** each item's card flies to its row's place and shape and back, using React's `<ViewTransition>` with the same name in both views, turned on only for this switch's transition type (so navigation, filters and the theme reveal never animate the items):

```css
::view-transition-group(.item-morph) { animation-duration: 600ms;
  animation-timing-function: cubic-bezier(.45, 0, .2, 1);              /* even in and out: the glide is seen */
  animation-delay: calc(var(--wave, 0) * 24ms); }                      /* the top of each column leaves first */
::view-transition-image-pair(.item-morph) { isolation: isolate; overflow: clip; border-radius: .625rem; }
::view-transition-old(.item-morph), ::view-transition-new(.item-morph) {
  inset-block-start: 0; inset-inline-start: 0; inline-size: auto; block-size: auto;  /* keep own size: text never stretches */
  animation-duration: 600ms; animation-timing-function: linear; animation-fill-mode: both;
  mix-blend-mode: plus-lighter; }                                       /* old + new always add up to one opaque card */
::view-transition-old(.item-morph) { animation-name: morph-out; }      /* 1 until 20%, 0 from 70% */
::view-transition-new(.item-morph) { animation-name: morph-in; }       /* 0 until 20%, 1 from 70% */
::view-transition { inline-size: 100vw !important; block-size: 100vh !important; pointer-events: none; }
```

- Wave classes (`wave-1` to `wave-9`) on the group set `--wave` by the item's index in its column, capped.
- The last rule matters: when nothing outside the named items changes, React shrinks `::view-transition` to 0 by 0 and the browser then paints none of the groups, so the items vanish for the whole switch.
- Whole columns morph into their list group's card too, so the gray well glides instead of appearing.
- Store the chosen view only after the transition has rendered (storing it first swaps the view outside the transition). A second switch while one runs waits until it ends: starting a view transition skips the running one and the items jump mid-glide.
- Reduced motion: no animation.

## Feeds and cards

- Render the first 50 and reveal the next 50 locally before fetching another page; reset on filter change; `aria-busy` on the grid while loading; a "Load more" button that stays (its label morphing) while it loads.
- **A card's facts line** joins the parts it has with ` · `, and renders nothing when it has none. Each fact shows once known.
- **Long text is cut** after about 5 to 7 lines (or 280 characters) with "See more" and "See less" (`aria-expanded`); or the clamped text itself is the button that expands it.
- **Only actions that work from here.** A like that has to happen on the source links out; comments expand when they were collected and link out when not; share copies the link with a check swap and a "Copied" tooltip. A "more" menu holds open-on-source and copy-link.
- **Media degrade one step at a time:** a video (`preload="none"`, muted, `playsInline`, poster) falls back to its image when it fails to play; the image falls back to a "View on the source" note when it fails to load (remember which URL failed, so a new URL retries). A video poster is a button with a play glyph that swaps to an inline player in the same box. Never nest a link in a link (a poster that already links to the video). Content the source withholds shows a centered icon and the reason.
- **Several media scroll sideways** with snap points, hidden scrollbar, the next item peeking (85% wide), small previous and next buttons each the same distance from its edge in one strip that lets the pointer through, a step of item width plus gap, negative scroll in right-to-left.
- A reproduction of another product's card (an ad, a post as the source shows it) keeps the source's look inside the app's card, but raises any text under 12px to 12px.
- Expired media links in a cached result: re-read those items and swap each card to the fresh copy when it arrives.
- Comments as bubbles with the name inside, time and reactions below, replies indented; "More comments on the source" when the list is partial.
