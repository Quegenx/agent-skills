# Menus, selects, sidebar, shell

## The app shell

- A sidebar canvas around one rounded content panel (about 24px radius, a 12px inset), content capped near 90rem; on phones the panel goes full width with only its top corners rounded. The brand at the top is a mark, not a row (no hover fill).
- **Shell sizes as variables:** `--sidebar-width: 17rem`, `--sidebar-width-icon: 4rem`, `--header-height: 4rem`. Search and the language overlay are mounted once, in the shell, not per page.
- **The document:** the marketing site and the app each have their own document and global stylesheet, and neither reaches the other. `viewport-fit=cover` (it pairs with the safe-area padding), a `color-scheme: light dark` meta and a `theme-color` meta, `suppressHydrationWarning` on `<html>` because head scripts change its attributes before hydration. Re-set `dir` and `lang` on every client navigation, since one can change the language. Page titles follow one "page · app" message.
- A skip link fixed at the start 1rem / top 1rem, translated -6rem until focused, and the main area `tabIndex={-1}` so it can take focus.
- **The header:** the sidebar trigger, the page's `h1` (or a control inside it, such as an editable title), then the page's actions 4px apart and the notifications bell at the end. At least 4rem tall, the title in the headline-lg role. Padding `max(.625rem, safe-area-top)` on the block side and `max(clamp(1rem, .75rem + 1.5cqi, 2.25rem), safe-area-inline)` on the inline sides.
- **Each page declares its header** (a title function called on render so it follows the language, an optional title component, its actions) in route static data, so the shell stays mounted between pages. Key the page-data provider by the user id, so state resets when the user changes.
- **The content:** padding `clamp(1rem, .75rem + 1.5cqi, 2.25rem)` with safe-area `max()` on the bottom and inline sides; page sections `clamp(1.5rem, 1.25rem + 1cqi, 2.25rem)` apart. Every page opens with one muted line, at base size under the header, on what it holds.
- Only the page content suspends while data loads (`<Suspense fallback={null}>` around it, not around the shell).
- **Loaders:** reads the page needs to paint its first frame (the first page of a list) are awaited; shared or secondary reads are warmed without blocking (the server render waits for them, the browser does not). Preload routes on intent (hover) with a preload stale time of 0, because the data layer decides freshness; restore scroll. The session user comes from the client cache, so navigating never waits on a session round trip; marketing pages never read the session. API URLs are never localized; app URLs carry the locale prefix. Report one "app-load" timing per page load, guarded by a `performance.mark` that survives client navigations and hot reloads.
- **Page transitions name only the content area,** so the sidebar and header stay put: the old content fades in 150ms, the new reveals from an 8px blur over about 800ms ease-out. Reduced motion: a fade.
  - Run them only between two different app pages: not for opening settings, switching items inside one page, the first load, the marketing site, or any move to or from sign-in.
  - Only that transition type names the content. `::view-transition-old(root) { display: none }` and `::view-transition-new(root) { animation: none }`, so everything outside the content swaps at once instead of crossfading. The group's duration is 0s (no geometry morph); old and new get `block-size: auto` and `mix-blend-mode: normal`.
- **A global shortcut** (`Cmd/Ctrl+K`) opens search from any page; the buttons that open it carry `aria-keyshortcuts`.
- **Language switch:** an overlay covers the page, pending edits flush, the page reloads in the other language, and the overlay lifts. A wordmark keeps `dir="ltr"` in both languages.
  - The cover: a fixed strip `100dvh` tall holding five brand-color columns (20vw each), each dropping from block-size 0 to 100%, a white wordmark on top (1.4rem / 650 / -0.02em), z-index 1100, `visibility: hidden` at rest.
  - A head script sets `html[data-locale-transition="reveal"]` before hydration, so the reloaded page paints already covered and then uncovers; without it the new page flashes before the overlay.
  - Each load saves the page's language to the server, so notifications written in the background use it; a failed save waits for the next load.
- **Notifications:** the bell grows into a panel (the morphing dropdown with a backdrop) with a title, "Mark all as read" (kept mounted and disabled once everything is read, so keyboard focus on it isn't lost) and a gray close `×`. Each notification opens what it is about, marks itself read and closes the panel; unread ones carry a dot plus screen-reader text, bodies clamp to two lines, and the bell's count is `aria-hidden` while its label carries the number.
  - Panel 24rem wide, kept inside the screen. The list scrolls at `max-block-size: min(28rem, 60dvh)` with `overscroll-behavior: contain`. Rows are page-color cards on the gray panel, .375rem apart, hover `color-mix(in srgb, var(--background) 96%, var(--foreground))`, padded `.75rem .75rem .75rem space-6` (the four-value shorthand puts the wide side on the left, the dot's side in right-to-left).
  - The unread dot: .625rem, brand color, at the row's inline end, vertically centered. The time is a `<time dateTime>` with relative text at .75rem / 600, brand while unread and muted once read. A failure's title is destructive (`data-kind`). Title and body sit in `<bdi>`.
  - The empty state gets bottom padding equal to the head's height plus the gap, so it centers in the whole card, not under the head.
  - The count: 1.1875rem, destructive fill, .75rem / 700, offset -.25rem from the bell's corner. The same badge marks sidebar counts.
  - Data: the 30 newest plus an exact unread count from a separate query. Re-read every 60s while the tab is visible (a hidden tab skips its ticks) and when the tab regains focus. A failed read keeps what is shown. Loading is true only until the first answer, so the empty list never says "no notifications" before anything was read. Marking read is optimistic (no ids means all; unread drops by `Math.max(0, unread - marked)`; at most 200 ids per call; marks may run at once); a failure re-reads.
- **A not-found page inside the app** uses the app's own styles (a marketing site's stylesheet usually isn't loaded there), no error code, and one way back: the dashboard when signed in, sign-in or the home page when not. An illustration on it keeps to the app's 1s motion ceiling and stays still under reduced motion.
- **Signing out** asks in a dialog that grows out of its row; it flushes pending edits first and refuses to sign out when one didn't save; on success it clears the session, invalidates the router, navigates away, and only then resets client state, so no page reads the cleared state on the way out.

## A menu that is its trigger, grown

One surface morphs between the closed trigger's shape and the open menu: width, height, radius and shadow on one spring (stiffness about 380, damping 34, mass .8). Closed radius follows the trigger (16 for fields and chips, 8 for icons, 20 for round buttons); open, 20. The shadow goes from two transparent zero layers to `0 16px 32px rgba(0,0,0,.075), 0 4px 10px rgba(0,0,0,.04)`: the closed value has the open one's layer count, or it can't interpolate. The fill goes from the field color to the popover color in 200ms ease-out (chip and round start secondary, the round panel opens as a card, the icon surface is transparent until open). The same component serves selects, action menus, multi-select filters and custom panels (notifications, a date range), so every dropdown in the product opens the same way.

**Placement**

- Opens toward the reading end when it fits with an 8px edge, else aligns to the trigger's far edge. Opens upward inside a boundary (a scrolling table, a sheet) when the space above beats the space below; without one, only when the whole menu fits above. Max height is the space left minus 16px, never below 44px inside a boundary or 180px outside, and at most `min(100dvh - 24px, 44px × 5.5 + 16px + search)`.
- Width `min(max(panelWidth, triggerWidth), viewport - 32px)`: panels default to 220px, a single-choice filter 260px, the date range 824px. Read the viewport width from a `ResizeObserver` on `<html>`.
- The surface is portaled to the body and follows the trigger on scroll (event-driven `autoUpdate`, not a frame loop), positioned on opening so the first frame already sits on the trigger. Kept 16px inside the viewport; wide panels centered on the trigger. It switches to `position: fixed` only while escaping a scrollport, and its offset springs with its size.
- Set `dir` on the portaled surface explicitly: a body-level portal loses the page direction.
- Portal only after hydration (a `useSyncExternalStore` whose server snapshot is false), so server and client render the same tree.
- Stacking: the surface is `pointer-events: none` until open with the trigger above it (z-index 3) while closed; the anchor is `isolation: isolate` at z-index 60, above a dialog's 50, and so is the dropdown's backdrop.

**Measuring without glitches**

- Measure the trigger unscaled. A trigger mid-press is scaled; take its center from the screen and its size from layout, or the surface opens squashed.
- Size from a `ResizeObserver` border box, which is fractional. `offsetWidth` rounds down half a pixel and ellipsizes the label; `getBoundingClientRect` inside a dialog that is still growing returns a scaled fraction and the surface shows see-through edges.
- The closed surface is the trigger's size from the first frame. A size measured later that springs from a guess flashes a scrollbar.
- Estimate the open height before it is measured (rows times 44px up to 5.5 rows, plus padding, plus a search field).

**Contents**

- Show 5.5 rows; the half row says there is more. Rows are 40px minimum plus 2px block margins (the 44px of the estimate), 8px radius, padding 8px × 12px, a .75rem gap, 18px icons; muted until highlighted or checked, disabled at opacity .4. Key the body by an opening counter, so it remounts fresh on every open.
- Edge blur where the list scrolls: sticky 28px strips at the top and bottom with a 6px backdrop blur under a gradient mask, shown only once scrolled away from that end (a scroll-driven animation reaching full opacity by 8% at the top and fading from 92% at the bottom), so a list that does not scroll never shows them. Sticky offsets of -8px cancel the list padding (at 0 the last 8px show unblurred). Reduced motion: no strips.
- Rows fade in from `x: -8` over 150ms on `[.23, 1, .32, 1]`, 60ms plus 20ms per row (index capped at 4), and the closing list fades out toward `translateX(-8px)`: the same physical offset in both directions. One highlight (ink 5%) springs between rows (a shared layout element, 520 / 30 / .8), following both pointer and focus; with nothing hovered it rests on the selected row, and leaving the menu clears it.
- Multi-select rows carry the checkbox mark ([CONTROLS.md](CONTROLS.md)) and keep the menu open on a pick (`preventDefault` on select, and on Enter in its search); single choice closes. A count or detail at the row end in a muted .75rem monospace stack, so digits line up; destructive rows red with a soft red hover.
- More than about ten options: a sticky search field at the top (40px, 12px radius, ink 5% on the popover color, native cancel hidden, 52px reserved; the top edge strip then sits at 44px), focused a frame after the menu shows with `preventScroll` (focusing while the menu grows scrolls the page). A printable key (`key.length === 1`, no Meta, Ctrl or Alt) on a focused row goes to the field (stop propagation on `keydown` capture, before type-ahead jumps); matching is a trimmed, case-insensitive substring; Enter picks the first match; arrows, Escape and Tab still navigate; "No results" (12px padding, .875rem) when empty; cleared on every opening.
- Option names for countries and languages come from `Intl.DisplayNames` in the page language, falling back to the code; countries sort with `Intl.Collator`, languages keep a most-common-first order, "All" is pinned first, and the list is rebuilt on each call so it follows a language switch.

**Opening and closing**

- The trigger's `pointerdown` prevents default for the primary button without Ctrl (Ctrl-click is the macOS context menu), so focus does not jump before the menu takes it. Its label fades and shrinks to .8 as the menu opens.
- Closing, a copy of the trigger's label rides the shrinking surface over the trigger and fades back in (150ms, starting 120ms in), while the trigger's own label stays hidden, so the label is never doubled or missing. Reduced motion: no shrink, and the spring runs in 0.
- Exiting content fades and moves 8px in 150ms.
- An action that opens a dialog closes the menu at once: a menu shrinking back over the dialog's backdrop looks broken.
- Escape inside the menu stops propagation, so it does not also close the dialog the menu sits in.
- A headless primitive owns focus, keyboard and dismissal (`modal={false}`): a popover for a custom panel, a dropdown menu for options (a radio group inside for single choice). Force its positioning wrapper static inside the morphing surface so the two do not fight.
- An optional backdrop for panels that take the page's attention (notifications); none for selects.

**Appearances:** field (full width, 1rem sides like inputs, a chevron), chip (32px, keeps its label whole in a crowded toolbar), icon (28px, 4px padding, 8px radius, no fill until open and ink 5% on hover, label and chevron hidden), round (40px, squishy press, a gray card panel). Trigger padding .5rem .85rem, label gap .65rem. A select's face is the chosen value, in a `<bdi>` with ellipsis; its name ("Show posts from") is for screen readers only. A hint tooltip only on icon and round triggers, off while open.

**A custom panel** whose body mounts only while open reads its state at open time: "save to a collection" is an icon dropdown (300px) with a title and one switch per collection that adds or removes at once (names in `<bdi>`), a muted line when there are none, and an inline "new collection" field (trimmed, up to 60 characters, disabled while blank, cleared after) that creates it with the item already in it.

**A plain popup menu,** where a morph isn't wanted: card radius, .5rem padding, the popover shadow, opening from scale .97 over 250ms smooth-out and closing to .99 over 150ms, `display: none` only once the ending style finishes.

## Filter chips in a toolbar

A 32px pill with `+`, the label, a 1px × 1rem divider and what is chosen ("3 chosen", a pill up to 12rem at .75rem with ellipsis); `.375rem` gap, label-sm, ink 10% on hover and while open. The panel lists options with icon, checkbox and how many items each would keep; a "Clear" row once anything is chosen. A single-choice variant closes on pick; a field-appearance variant drops the `+` for a chevron. A chip's own `×` is 1.25rem (a .75rem glyph), ink 8% at rest and 14% while its chip is hovered, `margin-inline-end: -.375rem`. A "Reset" chip in soft red (destructive 10%, 16% on hover, an `×` at its inline start) appears only when any filter differs from the default; it is a plain `<button>` carrying the chip's class and `data-variant="reset"`.

- **The toolbar** is `role="toolbar"` with an `aria-label`. Filters wrap; the view controls (columns, sort, view tabs) stack under them and move beside them from a 42rem container, the view group reversing its row from 32rem. Board and list are icon-only segmented tabs, each with an `aria-label` and a tooltip.
- **A column-visibility menu** is a multi-select chip whose last visible option is disabled, so one column always stays; hide the chip below a 44rem container.

## Date range picker

Inside the same morphing surface: a presets column (126px; 36px buttons, 10px radius, ink 6% on hover and pressed, each `aria-pressed` when the range matches it) beside two month cards (326px, 15px padding, 16px radius, ink 2% fill, 12px cell spacing) that page one month at a time.

- Presets: today, yesterday, the last 7 days (today minus 6), the last 30 (today minus 29), this month, last month, this year, last year, and all (the first item's day to today). Picking one resets the typed chips (keyed by a revision) and moves focus to the range start.
- Days are 32px with an 8px radius, ink 6% on hover, disabled at .35. The range is a band at 25% of the brand color with solid ends, rounded on their outer side; the band runs between cells except across week edges and starts and ends at the middle of the end cells. Band and ends animate opacity and radius in 100ms.
- Typed dates as chips (112px, 10px radius, field fill; `dd/mm/yyyy`, numeric keyboard, `dir="ltr"`, `aria-invalid` and red text when invalid), committed on blur or Enter, restored on Escape; typing an end before the start swaps them. The parser takes one or two digit days and months and a four-digit year, and rejects dates that roll over (31/02).
- The range commits only on Apply; Apply is disabled while a chip is invalid (opacity .45, `not-allowed`), with the error announced. A count of days, both ends included, computed in UTC (`/ 86_400_000`, plus 1); Clear in soft red. Footer pills are 40px with 18px padding.
- Force the Gregorian calendar in the locale (`he-IL-u-ca-gregory`) where the default calendar differs, and set the week's first day explicitly. Limit the selectable days to what exists (the first item's day, or a fixed window such as the last 7 years, to today). "Today" is local and renews at midnight while the page stays open (a timeout to the next midnight). Stacks one month under the other below 850px.
- The trigger shows the range in `<bdi dir="ltr">`, the two dates joined by an en dash character.
- A calendar day (`YYYY-MM-DD`) is read and shown in UTC, so server and browser render the same day.

## Sidebar

- **Expanded (17rem), an icon rail (4rem), or a sheet on phones (18rem,** with a screen-reader title and description; its built-in close replaced by a `×` in its header, with a tooltip, shown on phones only). Every row click closes the phone sheet. `Cmd/Ctrl+B` toggles; state in `data-state`. The trigger is a ghost icon button with `aria-expanded` and `aria-controls`. Width transitions over 200ms. The toggle icon is a frame whose inner pane path morphs wider or narrower (.35s on `[.4, 0, .2, 1]`), mirrored in right-to-left. The sidebar's side follows the text direction.
- **Scope sidebar styles to the sidebar, not the shell:** the phone sheet is portaled outside the shell, so select `[data-slot][data-sidebar="sidebar"]`, and define the spring variables on `[data-sidebar]` and on any other surface that reuses its rows (a settings dialog's tabs).
- **The look:** padding `1.5rem .75rem`, sections 1.25rem apart, rows .25rem apart. Group labels 1.75rem tall, .875rem / 600 in the full foreground color; in the rail they fold away with a negative top margin of their height plus a fade (200ms smooth-out). Rows 44px (`.5rem .75rem` padding), .75rem radius, .9375rem / 500, muted text brightening to the foreground on hover (`color 150ms ease`), 1.25rem icons; the rail's icons 44px squares, with a tooltip on the inline-end side only while collapsed and never on phones. The active row takes the accent fill and the foreground color. The footer: a 1px top border and 1rem padding. The scrolling area hides its scrollbar.
- **The brand:** the logo on a white chip (2.25rem, .75rem radius, .125rem padding) that shrinks to 1.25rem in the rail, beside a two-line label (name 1rem / 600 / 1.25, workspace .8125rem muted) hidden in the rail. No fill even when the phone sheet focuses it on opening, and no focus ring, as everywhere ([TOKENS.md](TOKENS.md), Focus).
- **The account block:** a 2.25rem avatar button, the name (.9375rem / 600) and email (`<bdi>`, .8125rem muted) both ellipsized, a tooltip with the full address when it is cut short; hidden in the rail.
- **Collapsible rows** (a section of chats, a group of pages): the chevron (1rem, at the row's end) turns on a spring; the panel unrolls over 350ms `ease-in-out` both ways (grid rows 0fr to 1fr, opacity, a 1.25rem rise and a mask that reveals from the top, its edge a registered `@property` `<percentage>` animating 0% to 100%), content starting .5rem down with rows .5rem apart. The row opens itself on its own page; once the user toggles it, the user's choice wins (state `undefined` until toggled). In the icon rail the row navigates instead of expanding and its `aria-expanded` is `undefined`. `aria-expanded` and `aria-controls`; the panel is `inert` when closed.
  - The parent row is active only while its panel is closed; open, the current child carries the highlight.
  - The section's own rows ("new", "search") come first, then grouped lists (pinned, recent), each a `<section aria-label>` with a heading (`1rem .75rem .5rem` padding, sm / 600 muted).
  - The chevron points to the reading end: turned -90deg in right-to-left, and in left-to-right mirrored with `scale: -1 1` and turned +90deg (`:dir(ltr)`).
- **Springs, each sampled into `linear()`:**

  | Spring | Stiffness / damping / mass | Settles | Used for |
  |---|---|---|---|
  | layout | 360 / 32 / .6 | 500ms | the chevron |
  | row | 500 / 30 / .6 | 340ms | press (scale .96 on collapsible rows and links, .98 on menu buttons) |
  | tree | 500 / 40 / 1 | 410ms | the sliding highlight |

- **A new row grows in** (`@starting-style` from grid rows 0fr, zero margin, transparent, 20px lower) and pushes the others smoothly; put the gap in each row's top margin so it grows with the row.
- **Reduced motion:** row, chevron, panel and width transitions off, and the panel's `translate` removed.
- **Rows that select in-app state are buttons, not links.** A router marks every link to the current page `aria-current="page"`; ten chat rows linking to the same page all light up.
- **A row's "more" button** (2rem round, .375rem from the end, z-index 2, accent fill on hover and while open; the row reserves 2.5rem end padding for it) fades in over the quick duration and shows on hover, on focus, and while its own menu is open (`data-menu-open`), so it does not vanish under the open menu. Its name includes the row's ("Options · Weekly report").
- **Counts** at the row end (`margin-inline-start: auto`) in the bell's badge, hidden at 0 and capped as `99+`, the number alone in its span. In a sentence a capped number is written out ("More than 99"): a `+` beside a number in running right-to-left text lands on the wrong side.
- **A row gated by plan or permission** hides only once the answer is known to be no, never while loading (no flash). Treat a service's health the same way: assume it is running until known otherwise, so a "service down" notice never flashes.

## One sliding hover highlight

One element shared by every row, sliding to the hovered or focused row and fading out when the pointer leaves, instead of each row lighting its own background. Rows drop their own hover fill and sit above it (the container `isolation: isolate`, rows at z-index 1, the highlight .75rem radius).

- Position and size from CSS variables set by script, measured relative to the scrolling container plus its scroll offset; the slide runs on the tree spring sampled into `linear()`. Place it with physical `left: 0; top: 0` plus `translate`: `getBoundingClientRect` offsets are physical, and `inset-inline-start` would misplace it in right-to-left. This is the one sanctioned exception to logical properties.
- **Arriving from nowhere, appear in place** (only opacity animates), or it slides in from the corner. **Hiding keeps the last position;** resetting it makes it shrink toward the corner as it fades.
- It fades out over the selected row (`data-active` or `aria-current="page"`), which has its own highlight.
- Follow `pointermove` (ignore touch pointers) and `:focus-visible` focus; skip disabled rows; clear on `pointerleave` and blur. Unchanged bounds skip the update.
- Re-measure on `ResizeObserver` (the sidebar collapsing) and on `transitionend` (a section finishing its unroll moved the rows below); keep the latest measure function in a ref for the observer.
- Footer rows get their own instance. Reuse the same hook, with a different row selector, for vertical tabs such as a settings dialog's. On a light surface, override its color and radius in the same cascade layer as its base rule (the dark sidebar's white 10% would otherwise win and the highlight vanishes): take the selected tab's ink 6% and .5rem radius, so it fades into the selected tab.
