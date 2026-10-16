# Dialogs, sheets, confirms, panels

## The backdrop and the dialog

- **Backdrop:** pure black at 50% (`rgb(0 0 0 / .5)`) in both themes, not ink (ink turns white in dark mode), with a 4px blur, z-index 50, fading over 500ms on the unroll curve (`cubic-bezier(.32, .72, 0, 1)`); with `prefers-reduced-transparency`, a solid tint and no blur; reduced motion uses the 0.01ms duration token. Behind a dialog that morphs, it uses the morph's timing.
- **Dialog:** `min(34.25rem, 100vi - 2rem)` wide, card radius, the page color (fields keep their gray), shadow `0 24px 48px rgb(33 29 29 / .16), 0 2px 6px rgb(33 29 29 / .06)` plus a 1px inset edge.
  - Header 3.75rem over a divider, the title padded `space-4` at the start and `space-15` at the end (room for the close).
  - Close: a 2.25rem round `×` (secondary fill, gray at rest, a 1.25rem glyph, a tooltip) at block-start `space-3`, inline-end `space-4`.
  - Footer: end-aligned pill buttons .5rem apart, padding `space-6` / `space-4` / `space-4`.
  - Ending is quicker than opening: 150ms.
- Keep every overlay mounted and pass `open`; mounting it with `{open && <Dialog/>}` cuts its exit animation and breaks focus return.
- Closing with an unsaved form: the form stays while the dialog animates out and starts fresh once it has (key the form by an opening counter bumped on `onOpenChangeComplete(false)`), so the user never watches it empty itself.
- A dialog for a long form scrolls its body only (`max-block-size: calc(100dvh - 15rem)`, `overscroll-behavior: contain`), header and footer fixed; the submit button sits in the footer outside the form with `form="id"`.
- Initial focus on the field the user came to fill (the title), not the close button.
- **A create dialog asks only for the essentials;** everything else is edited on the item afterwards. Its defaults come from the user's settings, and Create stays disabled until they load. Cancel is the gray secondary button. Creating from a column presets that column's status; the preset is kept while the dialog closes, and the form is keyed by the opening counter plus the preset.

## Grow from the button that opened it

A dialog that opens something new (create, search, settings) grows out of the button just pressed and shrinks back into it:

- Capture the press with a `click` listener on the document in the capture phase, on the closest `button, [role=button], a[href]`; if a dialog opens within about a second, that element is its source. A dialog opened from a menu item whose menu has already closed grows from the menu's trigger instead, and that trigger must pass the same test.
- Only a source with a single child element qualifies (whitespace-only text nodes don't count); with several children the counter-scale stretches its content, so fall back to a plain fade.
- The dialog has one wrapper inside it, so the content can be counter-scaled while the box grows. Switch the dialog's CSS fade and scale off while it morphs, or the CSS transition outranks the script animation; opening, keep it hidden until the morph's first frame; closing, keep it visible.
- If the morph library matches elements by an unquoted attribute selector, strip the generated id to a plain CSS identifier (`useId` output has other characters). Start no new morph while one runs.
- Closing: start the shrink in `useLayoutEffect` on `open=false`, before the primitive checks the popup's running animations, so the unmount waits for it; if the popup or source is gone, skip straight to restoring the source. `transform-origin: 0 0`, translate and scale to the source's current rect, opacity held to about 60% of the way then faded; about 450ms on `cubic-bezier(.33, 1, .68, 1)`, held with `fill: forwards` until unmount. The content fades ease-out in the first third, so nobody sees it squash. The source fades back in from .85 over the last 40%, and that end state is held about 200ms before the animation is cancelled, so its hover does not flash on while the backdrop leaves; the button itself is never made inert.
- Write the shrink yourself where the library's own reverse fades the dialog out in about 75ms: against a button with no fill that shows nothing.
- A fresh animation instance per opening (a stale source element is the classic bug). Skip it under reduced motion. Confirmations keep a plain fade: they don't open anything new.
- A dialog that opens from a URL, with no button pressed, rises in from below as usual.
- A large dialog (a whole settings page) that pops on a short scale reads as a jolt; let it rise and settle (opacity 350ms smooth-out, scale and translate 500ms on the unroll curve, from scale .94 and .75rem lower), and leave quicker (250ms, 300ms, 300ms). When it grows from its button instead, turn its own rise off (`scale: 1; translate: 0`) and hold its exit opacity at 1, so the morph alone moves and fades it.

## Fly out of where it sits

To enlarge something that lives in the page (an avatar into a viewer): the copy flies from the source along a curved arc, about 950ms ease-in-out, growing from the source's size with a slight lift partway. It returns along the same arc and swaps with the source in one frame, so only one is ever visible; the source lands with a small pop and tilt. The source is hidden while the copy is out. Controls on the copy (its close `×`) come in after it lands and vanish at once on close, so they don't fly back. A close button over a blurred backdrop needs a solid fill and a shadow; a gray one sinks into the blur.

- The arc: a cubic Bézier with control points (-90, -100) and (70, -80) from the vertical midpoint, mirrored in right-to-left, eased in-out cubic sampled in 48 steps. The lift: +10% at 30% of the flight, back to size by the end.
- The landing pop: 1.15 at -3°, .95 at 3°, 1.05 at -1°, then rest, over 600ms ease-in-out.
- Reduced motion: nothing flies.

## Sheets

From the side the reading direction puts them on (`side` from the page direction), sizes by name (default three quarters of the screen up to 24rem, wide about 36rem, table about 64rem), a border on the inner edge. Entering: opacity, a full-width translate and a 2px blur over 400ms smooth-out; leaving 350ms, without the blur. The body scrolls (`min-block-size: 0; flex: 1; overflow-y: auto; overscroll-behavior: contain`); header and footer stay (gap .625rem, padding of the medium UI space; the title in the headline-lg role); the content is padded by all four safe areas within `max-block-size: 100dvh`. The close is a small gray secondary icon button 1rem from the top and the inline end. `container-type: inline-size` on the content so what is inside responds to the sheet, not the screen.

- **A sheet that edits a draft:** nothing saves until Save, closing discards, the draft is keyed by the item id so each opened item starts fresh. Use a client form `action`, so the page never navigates and controlled fields keep their values. Sections sit on gray cards, each a fieldset with a legend; the item's last failure is a destructive alert above the form. The footer in two rows: Save and Cancel sharing the width, then Duplicate (secondary; inserts the copy right after the original and closes) and Delete (soft red), which opens the confirm-delete alert dialog over the sheet, naming the item; confirming deletes it and closes the sheet.
- **A details sheet:** round only the corners on its free side, with logical corner properties. The header is a grid with the avatar spanning two rows beside the title (1.25rem / 1.2 / 700, `overflow-wrap: anywhere`, `text-wrap: pretty`) and the description (.8125rem / 1.2308), its end padded 4.5rem to clear the close; body padding and gap 1rem. Look the item up by id in the live list, so details that arrive load into the open sheet. The sheet is open while an item is selected (`open={Boolean(item)}`); closing clears the selected id, so the title falls back to the generic "details" text while the sheet slides out.

## Confirm in place

For destructive actions inside settings rows, a row or a panel's selection bar, the button asks:

- The soft red button's text morphs into the question ("Delete") and turns solid red while asking, then into the running label ("Deleting…").
- "Cancel" springs out of the button's side, growing real width from 0 so it pushes its neighbours aside instead of covering them: a spring with no bounce, about .35s (an overshooting width shoves the neighbours past and back), its label tucked 24px toward the button at .9 scale as it comes. The gap lives inside the growing width; `white-space: nowrap` and `flex-shrink: 0` (a narrow width wraps the label one letter per line); not clipped (a clipped pill shows square edges mid-grow). When the button sits at the row's end, Cancel opens on its start side.
- Focus lands on Cancel, the safe choice.
- What the action does opens beneath, in place of the item's description (two texts in one cell, crossfaded, see [STATES.md](STATES.md)), so the row never changes height. Name the item in `<bdi>` and add a sentence about its role when it matters (it is the primary one). In a row grid the note spans `grid-column: 2 / -1`, with .25rem above it, at text-sm and line height 1.4.
- The question stays open while the action runs and closes once it finishes.
- The caller owns which item is asking, so only one question is open at a time; closing the panel or bar that holds it resets it.
- Equal fixed columns for side-by-side items (`repeat(3, minmax(0, 1fr))`), so Cancel appearing never widens one column and rewraps the others.

Use a real alert dialog when the action is serious and the context is a page (sign out, leave a group, delete an account, remove a page's selected items): the subject named and isolated, what it means, Cancel (gray secondary) and the action (primary, or destructive for deletes and sign-out). One shared confirm-delete dialog (the subject in `<bdi>`, a line break, what deleting means, Cancel and Delete) also opens over a sheet (deleting the item it edits) and over the settings dialog (forgetting one memory from its trash button). Build it on the plain dialog primitive with `role="alertdialog"` so Escape and an outside press still close it, and refuse closing in `onOpenChange` while the action runs. Snapshot the items being confirmed when it opens, so the dialog's text doesn't change as the list does while it animates closed. A rename uses the same alert-dialog component: the title, a hint as its description, the name field with its morphing `n/max` count, growing from the menu's trigger, initial focus on the field.

- Separate title and description for one item and for many; the trigger gets an `aria-label` only for one item (many shows its count in its visible text). Say what is not affected ("membership untouched, can be saved again").
- Append notes about consequences only when they apply (a hidden group, an admin role). An option the server requires is shown on and disabled.
- When the action can only be finished on the source, the destructive button becomes a link that finishes it there.

## Disclosure panels

The shared open-and-close for filters panels, selection bars, warnings and comment threads:

```css
.disclosure-panel { --disclosure-panel-open-duration: 450ms;
  --disclosure-panel-open-easing: cubic-bezier(.32, .72, 0, 1);              /* the unroll curve */
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-fast) var(--ease-smooth-out); }
.disclosure-panel[data-open="true"] { grid-template-rows: 1fr;
  transition: grid-template-rows var(--disclosure-panel-open-duration) var(--disclosure-panel-open-easing); }
.disclosure-panel-inner { min-block-size: 0; overflow: hidden;              /* padding goes inside this, never on the panel */
  opacity: 0; filter: blur(var(--blur-small)); visibility: hidden;
  transition: opacity var(--duration-fast) var(--ease-smooth-out), filter var(--duration-fast) var(--ease-smooth-out),
    visibility 0s linear var(--duration-fast); }
.disclosure-panel[data-open="true"] .disclosure-panel-inner { opacity: 1; filter: blur(0); visibility: visible;
  transition: opacity 350ms var(--ease-smooth-out) 100ms, filter 350ms var(--ease-smooth-out) 100ms, visibility 0s; }
```

- Opens slowly (it unrolls), closes faster, the content fading and blurring out over 250ms smooth-out. Content fades in from a 2px blur a beat later and stays in place: sliding it in moves the last row under the edge.
- `inert` while closed; `visibility: hidden` after closing, so find-in-page, screen readers and tests don't see hidden text.
- Padding on the inner element only, or a strip shows while closed. A panel in a flex column cancels the parent's gap with a negative margin when closed and restores it inside.
- A panel holding form fields opens itself when the form is invalid (listen to `invalid` on the form).
- A simpler collapsible (a headless primitive that exposes its content height as a variable) animates `block-size` to that variable over 200ms ease-out.

## Step slides

Moving between steps (sign-in, sign-up and recovery in one card; sections of a settings dialog): the outgoing step leaves to one side while the incoming enters from the other, a full width, on a smooth spring with no bounce (about .5s), the fade finishing early (.3s). Forward enters from the reading end (the left on a right-to-left page) of the direction the caller passes as `dir`: the settings dialog passes the app's direction, the sign-in frame passes `rtl`, since its document is always right-to-left; going back (a tab above the current one, a previous step) reverses. Derive the direction during render, from one ordered list of the steps (an index comparison) or a depth per step. Turning around mid-slide continues from where it is. The outgoing step is `inert` and `aria-hidden`. The card's height animates to the incoming step's height on the same spring (set an explicit pixel height on mount, then follow a `ResizeObserver`), and the frame clips the slides (`overflow-x: hidden` on a scrolling panel, `overflow: clip` on a card) so they never cause a sideways scroll. Reduced motion: a fade. The frame around the steps (logo, card) is rendered once by the layout, so only the content moves.

The sign-in pages and multi-step connect flows are in [AUTH.md](AUTH.md).

## A settings dialog

All settings in one large dialog, sections as vertical tabs beside the open one, the section in the URL (`?settings=profile`) so any link can open it at a section and the back button closes it. The tabs use the sliding hover highlight; sections step-slide; on a phone the tabs become one scrolling row and the open tab scrolls into view (`block: "nearest", inline: "nearest"`). The last open section stays shown while the dialog closes. Each section: an intro line, a load or save failure where the user is editing, then the settings once loaded; changes save as they are typed, no Save button.

- **A fixed size,** so switching sections never resizes it: `inline-size: min(56rem, 100vi - 2rem)`, `block-size: min(40rem, 100dvh - 2rem)` (`100dvh - 2rem` below 40rem), `overflow: hidden`.
- **The tabs:** a `13rem minmax(0, 1fr)` grid; the list .125rem gap, `space-3` padding, a 1px inline-end border, scrolling on its own. Each tab 2.5rem tall, .5rem radius, .75rem inline padding, .625rem gap, .9375rem / 500 muted at rest and foreground on hover (guarded by `hover: hover`), `nowrap`, a 1.25rem icon that doesn't shrink; the selected tab (`aria-selected="true"`) ink 6% and foreground. On a phone the row hides its scrollbar and its divider moves to the block end. The tabs keep `orientation="vertical"` in both layouts.
- **The panel** that holds the sliding sections: `overflow-x: hidden`, `overflow-y: auto`, `overscroll-behavior: contain`; each section a flex column with `space-4` gap and padding.
- **One record per section** (label, icon, panel) and one ordered list that orders the tabs and decides the slide direction. Decode the section param with a schema: an unknown value reads as closed; open without a section falls back to the first.
- **History:** opening pushes an entry; switching sections or closing replaces it, so Back never reopens a closed dialog. With `?settings` set, the layout loader starts every section's reads, and the link preloads it on hover, so each tab opens with its data.
- **Loading and saving:** a section renders nothing until its settings load (no skeleton); the load error wins over a save error. An edit shows at once and saves 500ms after typing pauses, per field; edits before the load are ignored; a save error stays until a later save starts; a re-read replaces local edits; sign-out flushes pending saves and cancels the rest. Each change writes only its own field, so two tabs never overwrite each other.
- **Long groups of settings** are one accordion per item, all closed at first. The head is a gray card (.875rem radius, `.625rem space-3` padding, text-sm / 500) with a live summary ("3 of 20 today", muted, 400, `nowrap`) whose number morphs as the value steps. The .875rem chevron is a down chevron turned 90deg while closed and 0 when open, over 200ms `cubic-bezier(.4, 0, .2, 1)`, the same turn in both directions, with no transition under reduced motion. Fields inside: `.25rem space-3 space-3` padding, labels at text-sm.
- **Limits with a recommended value:** show it under each field, with one "Restore recommended" button for all. While any value is faster than recommended (a higher limit, a shorter gap), a warning sits in a disclosure panel above that button (always mounted, `inert` while closed, its bottom padding inside so it shares one gap with the button). Accept whole numbers in range only (`Number.isSafeInteger` plus bounds). A gap's unit follows its size: minutes for actions that change something, seconds for reads. A live usage figure is hidden while unknown (the service that counts it is down), never shown as 0, and re-read each time the section mounts.
- **Languages** are each named in their own language, the tab carrying `lang`; flags keep their 20 by 14 shape (`1.25rem × .875rem`, `clip-path: inset(0 round .25rem)`). Read the saved theme with `useSyncExternalStore` whose server snapshot is `"system"`, so server render and hydration agree, and pass reduced motion into the theme reveal.
- **The plan section:** the current plan as a title plus a status badge, who it is for, then features with a tick (primary) or a cross (muted, the line muted too), icons `aria-hidden`, a screen-reader suffix "(included)" or "(not included)"; usage against its limit. While payment isn't open, a note and a small secondary link to pricing stand in for billing. An admin may switch their own plan to preview it: optimistic, reset with an alert under the card on failure, always re-read after, the next pick clearing the failure.
- **Connected accounts:** at the limit, a muted line says so, with an upgrade hint only below the top plan. Add creates the record first, then opens the connect drawer on it ([AUTH.md](AUTH.md)); an unnamed record shows a fallback name ("New account") until it signs in.
