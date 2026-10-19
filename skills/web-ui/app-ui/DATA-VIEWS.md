# Data views

## Dashboards and page grids

- **Every page opens with one muted line** under the header on what it holds (`text-base`, muted).
- **Summary metrics:** four cards, 2 by 2, then 4 across from a 48rem container. Never 3 plus an orphan, which `auto-fill` would leave. Each card: an icon (1.125rem) leading the label on one line, the value in the metric type role and morphing, the note pinned to the foot (`margin-block-start: auto`) saying how many items it is based on. No data shows a dash (`\u2014`); a partial figure shows as `n / total`.
- **A preview card** of a longer list: a title with a count badge, a caption, a "See all" secondary small button in the card's action slot, then the first 5 rows built from the full table's own cells; an empty state when there are none.
- **Shared grids:**

| Grid | Value |
|---|---|
| Default | `repeat(auto-fill, minmax(min(100%, 12rem), 1fr))` |
| Field pairs | `auto-fill` at 18rem: the empty track stays, so an unpaired field takes half the row |
| Card feed | 21.25rem tracks, `24px 12px` gaps (row, column) |
| Readable text | `min(100%, 65ch)`, `overflow-wrap: anywhere`; empty-state text 45ch |
| Table frame | `overscroll-behavior-inline: contain` |

- Tabs inside a page are segmented tabs over a step slide: forward to the second list, back to the first.

## A results header

A title with the count in a badge (the count morphs), status lines beneath it (still collecting up to N, reached the end at N, the source's own total, more available), and the controls at the end: scope, sort, filters, columns. A source that caps its total ("50,001") reads as "more than 50,000", written out: a bare `+` beside a number lands on the wrong side in right-to-left text. Results and their job status share one card: errors with a retry action on top, a progress line with Stop for jobs that can stop (a search shows its progress on its own button instead), then the items.

- **The source's total arrives later** from a slower query sent after the items (run together, the two slow each other); only the search still on screen takes it, matched by its start time. No total means no count in the header.
- **Search submit is disabled until the query has non-space text** (trimmed, up to 200 characters). The form submits through a client `action`, so the browser runs its own validation and the page never navigates.
- **Recent and trending queries** sit as rows under the search: a muted label, then small secondary buttons with the query in `<bdi>`. An empty row is left out, the block renders nothing when both are empty or their read fails (no error). Picking one records it and runs it; recording is fire-and-forget and skips blank queries. All are disabled while a search runs.
- **A scope select** lists collections as "name (count)", their values prefixed (`folder:`) apart from the fixed scopes. While a collection is shown, a destructive-soft square `×` with a tooltip beside the select deletes it and falls back to the all-saved scope; deleting a collection leaves its items in place.
- **A "similar to" mode** (from a card's menu) switches scope, sorts by relevance and retitles the results "Similar to <name>", storing the name with the id for the title. A link-size button under the title exits it and resets the sort. Changing scope also exits it.

## Filters

- **A Filter button with the count of active filters** in a badge that springs in with the first filter (growing width from 0, scale from .6, no bounce) and out with the last; `aria-expanded`, `aria-controls`. The fields open beneath in a disclosure panel, which has its own Clear (destructive-soft, `w-fit`, disabled at zero) besides the chip row's "Clear all".
- **While the panel is closed, the active filters stay visible as chips,** each with its own `×` that clears that one filter, then "Clear all" in soft red. The `×` sits in a round tint that deepens when its chip is hovered. The chips sit in a `<fieldset>` with a screen-reader-only `<legend>`, each a secondary small button; the row of filter controls is `role="toolbar"` with an `aria-label`.
- **Count what each option would keep** (facets): "Video 12", so nobody picks an option that empties the list. "None chosen" means all. Facet counts are the scope's counts before the other result filters; a value no item has is missing, not shown as 0. Options come from the data with the source's own label for each value (a missing label falls back to the lowercased code), "none" sorted last. Type code-to-label maps exhaustively (`satisfies` over every code) and show an unknown code raw, never blank.
- **Items with no data for an active filter are kept and counted** ("12 have no country data"), so the view can say how many matches it can't judge.
- **Count only what differs from a fresh form,** and a dependent option only while its parent is on (comment count only while comments are collected). The always-visible text filter isn't counted (a whitespace-only query isn't active at all) but still enables Clear. A filter with several parts counts one per part with a choice. A search form's badge counts its own options plus the shared result filters.
- **Table-driven number filters:** one list of `{ key, label, chip, empty, min }` builds the fields, the chips and the counts, so they never disagree; the empty field says what empty means ("No minimum", "No limit"). Max `Number.MAX_SAFE_INTEGER`, min 0 by default, 1 for a per-item cap, 1 to 99 for a percentage. An invalid minimum matches nothing; unknown and approximate values never satisfy a minimum.
- **A number that tunes the display, not the results** (an estimate's assumed rate, 1 to 1000) restores its default when emptied: no chip, not counted, no "no limit" placeholder.
- **Yes/no filters are tri-state:** a single-choice "Any / Yes / No" stored as `null / true / false`; Any gives no chip and isn't counted. A switch can be a shortcut onto an enum filter ("Exclude saved" sets saved to `unsaved` or `all`).
- **An exclusion filter** ("Hide these authors") is a multi-select of everyone in scope with their item counts; its chip reads "3 hidden" and clears them all. Keep the authors already seen, so narrowing to one still lists the rest; a search across everyone starts the list over.
- **An option label can carry its meaning inline** as `name · hint`, with its own icon.
- **Card display options** ("Show title / description / button") are switches in a fieldset inside the panel. They set `data-hide-title` and the like on the card and hide with CSS, so nothing re-renders, and they reach cards inside carousels too.
- **Presets** (ready-made filter sets) as small secondary buttons in a fieldset with a screen-reader-only legend, wrapping at a .5rem gap, that replace the narrowing filters. **Saved filters** in a 340px dropdown panel, newest first, a muted line when empty (apply closes it, a gray `×` deletes, named in its label), with a form to save the current ones: the name trimmed, 1 to 60 characters, Save disabled while blank, cleared after saving. A saved entry stores the search form and the result filters; applying restores both and runs the search again.
- **"Clear filters" resets only the narrowing filters.** Sort, view, hidden columns, display options and display assumptions stay.
- **The grid of filter fields** goes 3, 2, 1 columns by the form's own container width (2 at `inline-size <= 44rem`, 1 at `<= 26rem`); a switch takes a full row. The controls row wraps at a .75rem gap.
- **Every change of filter or sort returns to page one;** background updates (details loading row by row) do not. A load-more list keeps how far it was loaded per filter combination for 5 minutes after it was last shown, so returning to a recent filter restores the depth; a new query starts at one page.
- **Controls that run the search again are disabled while it runs** (sort, author, the filters while results or details load); a sort that applies only in another scope shows the local default instead of a stale value.
- A sort menu that mixes sorts the server runs with sorts the client applies keeps their values apart with a prefix (`local:newest`), and offers only the sorts that apply to the current scope.
- **Local filtering and sorting:** text search trimmed and lowercased in the app's locale (`toLocaleLowerCase`), a substring over every field a person would search (name, description, places, labels); a date filter compares the day part with both ends included, `""` leaving an end open; titles sort with `localeCompare(…, appLocale)`, priorities by their order in the enum, and the sort is stable (`toSorted`), so ties keep the manual order. A default status view can be an inbox of several statuses ("Open" is new plus in progress).
- Persisting the form and the view: see [STATES.md](STATES.md).

## Tables

- A scrolling frame with rounded corners (so the header fill never shows square corners), `th scope="col"`, `aria-sort` on the sorted header, tabular figures, `white-space: nowrap` where values must stay whole. Cells centered by default with per-column opt-in start alignment; the name column starts at the reading edge. The section and the `<table>` carry an `aria-label` from the view's title.

| Part | Value |
|---|---|
| Frame | card radius, card fill |
| Header | 3.25rem, padding .5rem 1rem, weight 600, field fill, muted text |
| Cells | padding .75rem 1rem; checkbox column 3.5rem |
| Rows | 1px bottom border, none on the last row |
| Footer | top border, field fill, weight 500 |
| Empty state in the frame | at least 12rem tall |

- **Sortable headers are buttons;** the hover fill extends about .6rem past the text with a negative margin; an unsorted column shows a faint arrow, `aria-hidden` like the sorted one. Sorting returns to page one and the rows glide to their new places: record each row's `offsetTop` (layout-relative, so scrolling doesn't skew it), keyed by `data-row-id`, let the sort render, then animate each row from its old offset to zero over the fast duration token (250ms) on smooth-out. Only on a sort-key change: filtering and paging add and remove rows, they don't move them. None under reduced motion.
- **Key rows by a stable id** (`getRowId: row => row.id`), so selection follows the item across sort, page and filter. While loading, pass one module-level empty array, so the rows keep their identity.
- **Select-all covers the current page and says so** ("Select page"); it is indeterminate when some rows are selected and disabled when there are none; each row's checkbox is labelled with the row's name.
- **The name cell opens the details** and loads them if missing; a row whose details failed shows the error inline and retries on the next click. The name is capped (about 18rem), ellipsized, in `<bdi>`, with the full name in a tooltip.
- **Each value comes from the freshest non-empty copy** (the details' photo, else the list's), and sorting reads the same chain; an empty string counts as missing. An empty cell shows a dash (`\u2014`). Unknown values sort last. Unknown, none and not specified are three different texts.
- **Show only as many rows as the user asked for,** even when the source returned more. Secondary metric columns start hidden: one click away in the columns menu and in the details.
- **The columns menu** is a multi-select chip; the select and name columns can't be hidden, and the last visible column stays.
- **Row actions sit side by side when the page is wide and stack when narrow** (a container query), so labelled buttons never push the table past its frame; buttons in cells don't wrap and size to `max-content`. A status button appears only when an item needs the user. Once the action is done, a status badge takes the button's slot.
- On a gray card the table becomes a white panel; a selected row takes the primary tint; an expanded row keeps its hover tint.
- **Pagination** in a `<nav aria-label>`, hidden for one page; previous and next icon buttons with tooltips, chevrons mirrored by direction; "Page 2 of 7" morphing; the page index clamped when rows shrink. Page sizes 10, 20, 30, 50, 100, their labels getters so they follow the language.
- With a table library that passes the same row and header objects across renders, a compiler that memoizes components (React Compiler) keeps stale output: opt the table files out (`"use no memo"`). Pass the actions to cells through the table's `meta`, fresh each render, and build column definitions once per variant; columns rebuilt with new callbacks remount every checkbox on each selection. Column labels as getters, so they follow a language change.
- **A table variant for picking** (selection controlled from outside, no row actions, a press on the name toggles the row) inside a sheet, mounted only while open, with "n selected" and Done in the footer; outside, a summary ("4 of 12") with Choose or Change and a soft red Clear, and the first six chosen as pills that wrap whole names, then "and 6 more".

## Rows with actions

Account rows, memory rows, settings rows: a grid of avatar, text and actions. What an action will do opens beneath the text, so the row's first line never re-centres; the actions move under the text when the container is narrow. A count badge ("2 of 5") beside an Add button that is disabled when full or when the service behind it is down, with a notice saying which; at the limit a muted line says so, with an upgrade hint only below the top plan. Add creates the record first, then opens its connect flow on it.

- **Two kinds of row.** Action rows (accounts, sign-in methods) have no fill at rest and a hover tint (accent at 50%, under `@media (hover: hover)`, skipped on disabled rows), so the gray buttons in them stand out. Log rows (memories, history) are filled at rest (secondary, the radius token) with no hover tint.

| Row | Values |
|---|---|
| Action row | grid `auto minmax(0, 1fr) auto`, column gap space-3, radius .625rem, padding .625rem space-3; avatar 2.5rem round; name base size, 600, `overflow-wrap: anywhere`; badges and actions .375rem apart; rows .5rem apart. Below a 28rem container the actions move to `grid-column: 2 / -1`, end-aligned, .5rem above |
| Choice row | title base size, 600, line height 1.35; hint `text-sm` muted, 1.35; rows .125rem apart |
| Log row | padding .375rem block, `.625rem .375rem` inline (less on the side with the icon button); `text-sm`; time .75rem / 1.3333, relative, in `<time dateTime>` |

- **A missing photo** falls back to a head-and-shoulders silhouette (`fill: var(--card)` on muted text mixed 40% into the card).
- **An unnamed item has two fallback names:** one as a title ("New account"), one inside a sentence ("the account").
- **A status that needs explaining** ("Verifying") adds a muted hint line under the badges.
- **A confirm note** names the item in `<bdi>` and adds what its role changes ("It is your primary account"); it spans `grid-column: 2 / -1`, .25rem above, `text-sm`, line height 1.4. When the button sits at the row's end, Cancel opens on its start side.
- **Busy rows.** When the actions share one resource (one account's session, one worker), one item is busy at a time: every button in the row is disabled and the running one's label morphs ("Checking…"). When items are independent (deleting different kinds of data), keep pending and failed per item in a set, so several run at once and each failure clears when that item is tried again.
- **After an action,** read the list again whether it worked or not; a confirmed removal may instead drop the row at once and invalidate every other list that shows the item.
- **Side-by-side items** let their text grow, so every button lines up at its column's foot; on a phone they stack.

## Details sheets

- **The description says where the facts came from and when:** "Source · updated <date>". A Refresh button (its label morphing to "Refreshing…") appears once details exist; until then the body offers "Load details".
- **The header** is a grid: the avatar spanning two rows beside a title (1.25rem / 1.2 / 700, `overflow-wrap: anywhere`, `text-wrap: pretty`) and the description (.8125rem / 1.2308). Body padding and gap 1rem.
- **Facts are a `<dl>` grid,** each `<dd>` value in `<bdi>`: `dt` .8125rem muted, `dd` weight 500, gap 1rem.
- **A list of people** is titled with its count ("Admins · 3"). Without the list: "None" when the count is 0, "Unavailable" otherwise, plus "Partial list" when the source marks it incomplete.
- **The sheet looks its item up by id in the live list,** so details that load while it is open appear in it. It is open while an id is selected; closing clears the id, and the title reads the generic "details" text while the sheet slides out.
- **One failure at two depths:** a short line on the card (a `<p>` with the full error in its tooltip), the full alert at the top of the editor.

## Selection bars

Bulk actions beside the selection they act on, in a disclosure panel that opens with the first selected row: the count (morphing), Clear in soft red (small) beside it, then the actions pushed to the end. Each action counts only the rows it applies to ("Join 3", "Save 5") and is disabled when none do. While the bar collapses it keeps the last counts instead of showing zero. Deleting asks in place, the count morphing into what will be lost and turning muted, Cancel on the start side; removing many items from a page may instead use an alert dialog that snapshots them ([OVERLAYS.md](OVERLAYS.md)). Derive the selection from the current items, so deleted items drop out of it.

- **Bulk "set status" menus show no option checked,** since the selection is mixed.
- **A bulk action sends without review only the items that need nothing from the user** and leaves the rest for review.
- **A bulk action that starts a flow on another page** stores the selected ids, then navigates there.

## Boards and lists of the same items

- **A board:** columns as gray wells holding white items with no shadows; sticky column heads opaque so items scroll under them; columns `minmax(14rem, 1fr)` but never wider than `100% - 2.5rem` on narrow screens, so the next column peeks in and says there is more. The column's add button appears on column hover (and always on touch and on focus), a shade deeper than the well so it reads as a button, deeper again on hover: one color, not two. Mix the tints opaque (ink 5% into the background for the well, 3% item hover, 7% selected, 9% add-button hover), so a sticky head covers what scrolls under it.

| Part | Value |
|---|---|
| Board | `min-block-size: max(24rem, calc(100svh - 17rem))`, scrolls sideways |
| Column | top corners only at .875rem; scrolls on its own (`min-block-size: 0; overflow-y: auto`) |
| Column head | the count tabular, 12px, 500, muted, on the title's baseline; "+" and a "More" menu with Hide (disabled for the last visible column) |
| Add at the foot | after the items, full width, 2.25rem, radius .875rem, 600 |
| Item | radius .625rem, padding space-3, gap .5rem; title 14px / 500 / 1.2857, `text-align: start` |

- **An item card:** a head with the status picker and the title button; labels as tags, `aria-hidden` on the card; a short failure line (destructive, xs); a foot with the created date (12px, muted) and the priority picker.
- **A list:** a group per status as one gray card holding its sticky head and white rows; the chevron turns, the rows fold. Row checkboxes appear on hover, focus or selection (always on touch). Container queries add the status at 28rem, labels at 36rem. `scroll-margin-block-start` on rows' controls so keyboard focus clears the sticky head.

| Part | Value |
|---|---|
| Groups | .5rem apart, open at first; head sticky, `z-index: 10`, radius .875rem |
| Chevron | a down chevron turned 90deg while closed, 0 when open, over 200ms `cubic-bezier(.4, 0, .2, 1)`; the same turn in both directions; no transition under reduced motion |
| Rows | .25rem apart, radius .625rem, padding .625rem space-3; title ellipsized, labels on one line; an empty group drops its bottom padding |

- **The shown items run filter, then sort, then group;** grouping returns every column in a fixed order, empty ones included. Selection exists only in the list. Hidden columns hide a board column or a list group and are part of the view state.
- **Pickers on a card or row** (status, priority) stop `pointerdown`, `click` and `keydown` from reaching the card, which opens or drags; a pick saves at once and ignores the same value. They are 28px ghost buttons, radius .5rem, the accent fill on hover and while open, `margin-block: -.25rem` so the row doesn't grow; the `aria-label` names the current value ("Change status, currently Paused"). Pressing a card's title stops `pointerdown` so it opens without starting a drag; so does a row's checkbox. Hovering or focusing prefetches what opening needs.
- **Drag and drop:** a pointer sensor with a 5px activation distance (clicks still click) and a keyboard sensor, localized screen-reader instructions; `closestCorners` collision with a vertical list strategy, and each column also a droppable so an empty column takes drops. While dragging, render from a local copy of the order, save once on drop, restore on cancel; moving over another column inserts before the hovered item or at the end. The dragged item stays in place at half opacity (`z-index: 50`) while a dashed outline follows the pointer (2px dashed, radius .5rem, muted 10% fill). Cursors: `grab` on items, `grabbing` on the outline, `default` while dragging is off; `touch-action: manipulation`. Route the library's transform and transition through CSS custom properties, not inline styles, so the stylesheet's reduced-motion `transition: none` wins. Turn dragging off while the view is sorted or filtered (the order shown isn't the stored one) and say why; hiding columns doesn't turn it off. Give the sortable wrapper its drag attributes only when dragging is on: the library makes the wrapper a button with `aria-disabled`, which marks every control inside it disabled to screen readers.
- **Saving the order** sends every shown column's ids in order in one write, which also sets the status of an item dropped in another column; items in hidden columns follow in their stored order. A new item goes at the end; a duplicate goes right after its original, with the localized copy label cut to the title limit and its run history reset.

**Switching between board and list:** each item's card flies to its row's place and shape and back, using React's `<ViewTransition>` with the same name in both views, turned on only for this switch's transition type (so navigation, filters and the theme reveal never animate the items):

```css
::view-transition-group(.item-morph) { animation-duration: 600ms;
  animation-timing-function: cubic-bezier(.45, 0, .2, 1);              /* even in and out: the glide is seen */
  --morph-delay: calc(var(--wave, 0) * 24ms);                          /* the top of each column leaves first */
  animation-delay: var(--morph-delay); }
::view-transition-image-pair(.item-morph) { isolation: isolate; overflow: clip; border-radius: .625rem; }
::view-transition-old(.item-morph), ::view-transition-new(.item-morph) {
  inset-block-start: 0; inset-inline-start: 0; inline-size: auto; block-size: auto;  /* keep own size: text never stretches */
  animation-duration: 600ms; animation-timing-function: linear; animation-fill-mode: both;
  animation-delay: var(--morph-delay);                                  /* inherited from the group: the fade waits for the glide */
  mix-blend-mode: plus-lighter; }                                       /* old + new always add up to one opaque card */
::view-transition-old(.item-morph) { animation-name: morph-out; }      /* 1 until 20%, 0 from 70% */
::view-transition-new(.item-morph) { animation-name: morph-in; }       /* 0 until 20%, 1 from 70% */
::view-transition { inline-size: 100vw !important; /* whole screen */ block-size: 100dvh !important; pointer-events: none; }
```

- Wave classes (`wave-1` to `wave-9`) on the group set `--wave` by the item's index in its column, capped. The delay goes on the old and new images too: delayed on the group alone, a card crossfades before its glide starts.
- The last rule matters: when nothing outside the named items changes, React shrinks `::view-transition` to 0 by 0 and the browser then paints none of the groups, so the items vanish for the whole switch.
- Whole columns morph into their list group's card too, so the gray well glides instead of appearing.
- Store the chosen view only after the transition has rendered (storing it first swaps the view outside the transition). A second switch while one runs waits until it ends: starting a view transition skips the running one and the items jump mid-glide. One switch-length constant, 850ms (600ms plus nine 24ms steps, rounded up), feeds both that queue and the tooltip close delay.
- The view switch is icon-only segmented tabs, each with an `aria-label` and a tooltip.
- Reduced motion: no animation.

## Feeds and cards

- Render the first 50 and reveal the next 50 locally before fetching another page; reset on filter change; `aria-busy` on the grid while loading; a "Load more" button that stays (its label morphing) while it loads; a catalog's Load more keeps its plain label and is only disabled while the next page loads. Its promise resolves to the number of items added, so the caller can move focus or announce them.
- **Merge pages by item id** (a composite `${parentId}:${id}` when ids are unique only within a parent), so an item that moved to the next page while paging shows once. `hasMore` comes from the total (`items.length < total`) or from the last page.
- **Each card is an `<article>`** named for screen readers ("Post by <name>").
- **A card's facts line** joins the parts it has with ` · `, and renders nothing when it has none. Each fact shows once known. The separator is an `aria-hidden` span with `white-space: pre`, so its spaces survive inside flex. Icons that carry meaning (a platform, a public globe) get screen-reader text and a tooltip; an unknown one is left out rather than drawn blank.
- **Long text is cut** after about 5 to 7 lines (or 280 characters) with "See more" and "See less" (`aria-expanded`); or the clamped text itself is the button that expands it (reset it: `display: block`, full width, no border or background, `font: inherit`, `text-align: start`). Set `-webkit-line-clamp` and a matching `max-block-size` (7 lines, 7rem), and keep user text `white-space: pre-wrap` with `overflow-wrap: anywhere`, so long URLs wrap.
- **Only actions that work from here.** A like that has to happen on the source links out; comments expand when they were collected and link out when not; share copies the link with a check swap and a "Copied" tooltip, and a menu item that copies swaps its own label to "Copied" (2000ms; a refused clipboard reports nothing). A "more" menu holds open-on-source and copy-link. "Open" goes to the most specific target: the comment, else the post, else the item. Media with no link of its own links to its parent.
- **Links the item supplies** get `rel="nofollow noopener noreferrer"`, known ones `noopener noreferrer`; a menu action opens them with `window.open(url, "_blank", "noopener,noreferrer")`.
- **Save to a collection** from an icon menu (a 300px panel): one switch per collection that adds or removes at once, names in `<bdi>`, a muted line when there are none, and an inline form that creates a collection with the item already in it (trimmed, 1 to 60 characters, disabled while blank, cleared after). The panel body mounts only while open, so membership is read when it opens.
- **A grouped item** (several versions collapsed into one, collapsing on by default) shows the count in bold before the rest of the sentence, and its details button switches to the summary label.
- **Media degrade one step at a time:** a video (`preload="none"`, muted because the source gives no captions, `controls` to unmute, `playsInline`, poster) falls back to its image when it fails to play; the image falls back to a "View on the source" note when it fails to load (remember which URL failed, so a new URL retries). A purely decorative thumbnail that fails is simply removed. A video poster is a button with a play glyph that swaps to an inline player in the same box. Never nest a link in a link (a poster that already links to the video). Content the source withholds shows a centered icon and the reason.
- **Media boxes keep one height.** Pass the source's `width` and `height` to `<img>` and `<video>`; `alt` from the description, else the title, else `""`; a media link's `aria-label` names the action ("Watch the video on the source"). In a card grid, media sit in a fixed gray box (ink 5%) with `object-fit: contain`, centered, and the poster and the player share one block size, so pressing play changes nothing. Full-width media sit letterboxed on a dark backdrop (the foreground color), `object-fit: contain`, up to 42.5rem tall.
- **Several media scroll sideways** with snap points, hidden scrollbar, the next item peeking (85% wide), small previous and next buttons each the same distance from its edge in one strip that lets the pointer through, a step of item width plus gap (read a `"normal"` column gap as 0), negative scroll in right-to-left. Track gap .5rem; carousel images keep one aspect ratio with `object-fit: cover`.
- **A link preview:** the domain from `new URL(href).hostname` without `www.`, uppercase, muted, `direction: ltr`; the title on 2 lines, the description on one with ellipsis; the image up to 22.5rem tall, cover.
- **A text-only post on a colored background** centers its text over a 16rem minimum at `clamp(1.5rem, 1.375rem + .5cqi, 1.875rem)`, 700, line height 1.2; the colors arrive as CSS variables and an image as `url(${JSON.stringify(src)})`, escaped.
- **A matching excerpt** (the comment that made an item relevant) is a `<blockquote>` above the embedded card, its start stripe a `::before` (.1875rem, primary): a border would taper into the rounded corners. Items in a final status dim their head card to .7.
- **Card values:**

| Part | Value |
|---|---|
| Feed column | `max-inline-size: 42rem`; below a 34rem container the head wraps, the item stacks, the photo goes full width at 10rem, the actions become an end-aligned row |
| Info section | padding `16px 16px 0`, .5rem between children, then a divider with 16px margin; body .75rem / 1.3333, meta ink 85% |
| Status pill | 1.125rem tall, padding `1px .375rem`, 700, icon plus word, tone by `data-active` |
| Menu button | absolutely placed (`inset-inline-end: -.5rem`, `translate: 0 -50%`), so it overlaps the status row instead of making it taller |
| Author | 2rem circle, 1px border, page fill; an empty span keeps the circle without a photo; name ellipsized in a `min-inline-size: 0` column |
| Score | 2.75rem circle, .9375rem / 700; high from 90, medium from 80, else low |
| Thumbnail | 7rem by 5.25rem, cover, on the secondary fill; text beside it clamped to 4 lines |
| Grid media | images up to 10.9375rem tall; carousel cards 1px ink 10% border, .5rem radius, their footer stacked with a full-width button |
| Link footer | each line clamped to 2; the call-to-action pill up to 7.5rem, ellipsized, never shrinking |
| Withheld box | at least 12.5rem, padding space-6, ink 65% text, a 1.25rem destructive icon |
| Details link | a full-width secondary button link (`flex: 1`) |

- **Classify an item's content with the same function the card renders with,** so the kind filter and the card never disagree: withheld first, then several attachments (a carousel), then video, image, link (a URL plus a title or description), text, empty. An unknown type falls back to the most common kind. A compact row's one thumbnail falls back from the video poster to the image, the first attachment's image, the owner's photo, then none.
- **Authors:** their name, "Anonymous participant", or a generic "Author"; a link only when a profile exists, the name `inline-size: fit-content` so its underline spans only the name. The avatar falls back to the name's first character (`name?.slice(0, 1)`) or "?". People avatars are round, group or brand avatars take the button radius; 2.5rem in tables and posts, 3rem in a sheet header, 2rem on comments.
- A reproduction of another product's card (an ad, a post as the source shows it) keeps the source's look inside the app's card, but raises any text under 12px to 12px.
- **Expired media links in a cached result:** read the expiry from the signed URL and treat it as expired 10 minutes early, so it never expires while shown; an item is expired when any of its links is. Refresh in two stages: the shared cache first (another viewer may have refreshed it), then the source for the rest in batches of 30; swap each card to the fresh copy when it arrives, and keep the cached copy of one the source can't refresh.
- **Comments** as bubbles (radius 1.125rem, ink 5%, `justify-self: start`) with the name inside, time and reactions below (.75rem), replies indented 2.375rem; "More comments on the source" when the list is partial. The action bar is at least 2.75rem tall, its buttons 2.75rem by 2rem, radius .375rem, ink 5% hover under `(hover: hover)`; a toggle that is expanded takes the primary color. Counts beside icons hide at 0, while the `aria-label` always carries the count.
- **A feed of a running job** shows its live results as they arrive; "Show all" returns to everything saved, and the title morphs between the two. A filter over the run narrows it locally, without a request.

## Values in views

- **Resolve the locale when formatting, never at module load** (on the server one module serves both languages); keep one `Intl` formatter per locale, picked at render, never one per row.
- **Counts** with `toLocaleString(appLocale)`, exact for result counts; engagement counts compact (`notation: "compact"`, one fraction digit). A rounded value carries `≈` until the exact one loads; an unavailable one shows a dash (`\u2014`). Rates have their own one, many and at-least forms per day, week, month and year.
- **Money** with `style: "currency"` and no decimals; an estimate made from an assumed input shows as a range (±30%), while filters use the point value, and none when the input is missing.
- **Ranges** read "min to max" with an en dash between, or one value when both ends are equal; built from the parts that exist.
- **Ranks and scores:** a rank as a top percent (`Math.max(1, Math.ceil(position / total * 100))`, so first of 100 is the top 1%), "· up 3" only when it changed, a history (at most 8) as `#4 → #2` only with more than one entry. A 0 to 100 score shows its tone band in words beside the number.
- **Dates** in `<time dateTime={iso}>` with a short visible form (`{ month: "short", day: "numeric" }` on cards, `{ dateStyle: "medium", timeStyle: "medium" }` for a moment) and the full one (`{ dateStyle: "full", timeStyle: "long" }`) in a tooltip; `suppressHydrationWarning` where server and browser format differently. Format dates that belong to the source in the source's time zone. A running item reads "since <date>", an ended one shows its range; durations have "under an hour", "an hour" and "n hours" forms.
- **Relative times** with `Intl.RelativeTimeFormat` (`numeric: "auto"`, so "yesterday"), the largest whole unit, under a minute as "this minute".
- **"Days running" and expiry checks count from one shared now,** the time the server answered, so cards agree with each other: the source's own total when it gives one, else whole days from start to end (or now), never negative, none without a start.
- **Missing is `== null`, never falsy,** so a 0 price or count still shows.
- **A shown status follows one precedence:** the outcome of the user's own last action, then the source's state, then what the app derives (needs answers), then unknown; anything unmatched gets the unknown label. A value recorded before its field existed reads as unknown, not as a value.
- **User text with several lines:** `dir="auto"`, `white-space: pre-wrap`, `overflow-wrap: anywhere`, `text-wrap: pretty`.
- **A source** shows its localized name and its home page's favicon (1rem, radius .25rem, lazy, `referrerPolicy="no-referrer"`); an unknown source shows no badge rather than a broken one. Items without an id are keyed by their content and removed by reference.
