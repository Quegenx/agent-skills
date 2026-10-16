# Menus, selects, sidebar, shell

## The app shell

- A sidebar canvas around one rounded content panel (about 24px radius, a 12px inset), content capped near 90rem; on phones the panel goes full width with only its top corners rounded. The brand at the top is a mark, not a row (no hover fill).
- A skip link that slides in on focus, and the main area `tabIndex={-1}` so it can take focus.
- The header: the sidebar trigger, the page's `h1` (or a control inside it, such as an editable title), then the page's actions and the notifications bell at the end.
- Only the page content suspends while data loads (`<Suspense>` around it, not around the shell).
- **Page transitions name only the content area,** so the sidebar and header stay put: the old content fades in 150ms, the new reveals from an 8px blur over about 800ms ease-out. Reduced motion: a fade.
- **A global shortcut** (`Cmd/Ctrl+K`) opens search from any page; the buttons that open it carry `aria-keyshortcuts`.
- **Language switch:** an overlay covers the page, pending edits flush, the page reloads in the other language, and the overlay lifts. A wordmark keeps `dir="ltr"` in both languages.
- **Notifications:** the bell grows into a panel (the morphing dropdown with a backdrop) with a title, "Mark all as read" (kept mounted and disabled once everything is read, so keyboard focus on it isn't lost) and a gray close `×`. Each notification opens what it is about, marks itself read and closes the panel; unread ones carry a dot plus screen-reader text, bodies clamp to two lines, and the bell's count is `aria-hidden` while its label carries the number.
- **A not-found page inside the app** uses the app's own styles (a marketing site's stylesheet usually isn't loaded there), no error code, and one way back: the dashboard when signed in, sign-in or the home page when not.
- **Signing out** asks in a dialog that grows out of its row; it flushes pending edits first and refuses to sign out when one didn't save; on success it clears the session, invalidates the router, navigates away, and only then resets client state, so no page reads the cleared state on the way out.

## A menu that is its trigger, grown

One surface morphs between the closed trigger's shape and the open menu: width, height, radius and shadow on one spring (stiffness about 380, damping 34, mass .8). Closed radius follows the trigger (16 for fields and chips, 8 for icons, 20 for round buttons); open, 20; the shadow goes from none to a soft two-layer one. The same component serves selects, action menus, multi-select filters and custom panels (notifications, a date range), so every dropdown in the product opens the same way.

**Placement**

- Opens toward the reading end when it fits; opens upward when below does not fit and above fits better, measured inside a boundary (a scrolling table, a sheet), not only the viewport. Max height is the space left minus 16px.
- The surface is portaled to the body and follows the trigger on scroll (event-driven `autoUpdate`, not a frame loop), positioned on opening so the first frame already sits on the trigger. Kept 16px inside the viewport; wide panels centered on the trigger.
- Portal only after hydration (a `useSyncExternalStore` whose server snapshot is false), so server and client render the same tree.

**Measuring without glitches**

- Measure the trigger unscaled. A trigger mid-press is scaled; take its center from the screen and its size from layout, or the surface opens squashed.
- Size from a `ResizeObserver` border box, which is fractional. `offsetWidth` rounds down half a pixel and ellipsizes the label; `getBoundingClientRect` inside a dialog that is still growing returns a scaled fraction and the surface shows see-through edges.
- The closed surface is the trigger's size from the first frame. A size measured later that springs from a guess flashes a scrollbar.
- Estimate the open height before it is measured (rows times 44px up to 5.5 rows, plus padding, plus a search field).

**Contents**

- Show 5.5 rows; the half row says there is more.
- Edge blur where the list scrolls: sticky strips at the top and bottom with a 6px backdrop blur under a gradient mask, shown only once scrolled away from that end (a scroll-driven animation), so a list that does not scroll never shows them.
- Rows fade in from 8px toward the reading start over 150ms, 60ms plus 20ms per row (capped). One highlight springs between rows (a shared layout element), following both pointer and focus.
- Multi-select rows carry the checkbox mark ([CONTROLS.md](CONTROLS.md)); a count or detail at the row end in tabular figures; destructive rows red with a soft red hover.
- More than about ten options: a sticky search field at the top, focused a frame after the menu shows with `preventScroll` (focusing while the menu grows scrolls the page). Typing on a focused row goes to the field (stop propagation on `keydown` capture, before type-ahead jumps), Enter picks the first match, arrows, Escape and Tab still navigate, "No results" when empty, cleared on every opening.

**Opening and closing**

- The trigger's `pointerdown` prevents default for the primary button, so focus does not jump before the menu takes it. Its label fades and shrinks to .8 as the menu opens.
- Closing, a copy of the trigger's label rides the shrinking surface over the trigger and fades back in (150ms, starting 120ms in), while the trigger's own label stays hidden, so the label is never doubled or missing.
- Exiting content fades and moves 8px in 150ms.
- An action that opens a dialog closes the menu at once: a menu shrinking back over the dialog's backdrop looks broken.
- Escape inside the menu stops propagation, so it does not also close the dialog the menu sits in.
- A headless primitive owns focus, keyboard and dismissal (`modal={false}`); force its positioning wrapper static inside the morphing surface so the two do not fight.
- An optional backdrop for panels that take the page's attention (notifications); none for selects.

**Appearances:** field (full width, 1rem sides like inputs, a chevron), chip (32px, keeps its label whole in a crowded toolbar), icon (28px, no fill until open, tooltip while closed), round (40px, squishy press, a gray card panel).

## Filter chips in a toolbar

A 32px pill with `+`, the label, a divider and what is chosen ("3 chosen"); the panel lists options with icon, checkbox and how many items each would keep; a "Clear" row once anything is chosen. A single-choice variant closes on pick. A "Reset" chip in soft red appears only when any filter differs from the default.

## Date range picker

Inside the same morphing surface: a presets column (each `aria-pressed` when the range matches it) beside two months.

- The range is a band at 25% of the brand color with solid ends, rounded on their outer side; the band runs between cells except across week edges and starts and ends at the middle of the end cells.
- Typed dates as chips (`dd/mm/yyyy`, numeric keyboard, `dir="ltr"`, `aria-invalid`), committed on blur or Enter, restored on Escape; typing an end before the start swaps them.
- The range commits only on Apply; Apply is disabled while a chip is invalid, with the error announced. A count of days; Clear in soft red.
- Force the Gregorian calendar in the locale (`he-IL-u-ca-gregory`) where the default calendar differs, and set the week's first day explicitly. Limit the selectable days to what exists (the first item's day to today). Stacks one month under the other when narrow.
- A calendar day (`YYYY-MM-DD`) is read and shown in UTC, so server and browser render the same day.

## Sidebar

- **Expanded, an icon rail, or a sheet on phones** (with a screen-reader title and description). `Cmd/Ctrl+B` toggles; state in `data-state`. Rows are 44px; the rail's icons 44px squares; a tooltip on rail icons only while collapsed. Width transitions over 200ms. The toggle icon is a frame whose inner pane path morphs wider or narrower, mirrored in right-to-left. The sidebar's side follows the text direction.
- **Collapsible rows** (a section of chats, a group of pages): the chevron turns on a spring, the panel unrolls (grid rows 0fr to 1fr plus fade, a 20px rise and a mask that reveals from the top), and the row opens itself on its own page; once the user toggles it, the user's choice wins (state `undefined` until toggled). In the icon rail, the row navigates instead of expanding. `aria-expanded` and `aria-controls`; the panel is `inert` when closed.
- **A new row grows in** (`@starting-style` from grid rows 0fr, zero margin, transparent, 20px lower) and pushes the others smoothly; put the gap in each row's top margin so it grows with the row.
- **Rows that select in-app state are buttons, not links.** A router marks every link to the current page `aria-current="page"`; ten chat rows linking to the same page all light up.
- **A row's "more" button** shows on hover, on focus, and while its own menu is open (`data-menu-open`), so it does not vanish under the open menu.
- **Counts** at the row end, `99+`. A row gated by plan or permission hides only once the answer is known to be no, never while loading (no flash).

## One sliding hover highlight

One element shared by every row, sliding to the hovered or focused row and fading out when the pointer leaves, instead of each row lighting its own background. Rows drop their own hover fill and sit above it.

- Position and size from CSS variables set by script, measured relative to the scrolling container plus its scroll offset; the slide runs on a spring sampled into `linear()`.
- **Arriving from nowhere, appear in place** (only opacity animates), or it slides in from the corner. **Hiding keeps the last position;** resetting it makes it shrink toward the corner as it fades.
- It fades out over the selected row, which has its own highlight.
- Follow `pointermove` (ignore touch pointers) and `:focus-visible` focus; skip disabled rows; clear on `pointerleave` and blur.
- Re-measure on `ResizeObserver` (the sidebar collapsing) and on `transitionend` (a section finishing its unroll moved the rows below).
- Footer rows get their own instance. Reuse the same hook, with a different row selector, for vertical tabs such as a settings dialog's.
