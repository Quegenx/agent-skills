# Dialogs, sheets, confirms, panels

## The backdrop and the dialog

- Backdrop: ink 50% with a 4px blur, fading over 500ms on the unroll curve; with `prefers-reduced-transparency`, a solid tint and no blur. Behind a dialog that morphs, it uses the morph's timing.
- Dialog: about 34rem wide, the page color (fields keep their gray), a layered shadow plus a 1px inset edge, a 3.75rem header over a divider with the title and a round close `×` (gray at rest, with a tooltip), a footer of end-aligned pill buttons. Ending is quicker than opening.
- Keep every overlay mounted and pass `open`; mounting it with `{open && <Dialog/>}` cuts its exit animation and breaks focus return.
- Closing with an unsaved form: the form stays while the dialog animates out and starts fresh once it has (key the form by an opening counter bumped on `onOpenChangeComplete(false)`), so the user never watches it empty itself.
- A dialog for a long form scrolls its body only (`max-block-size: calc(100dvh - 15rem)`, `overscroll-behavior: contain`), header and footer fixed; the submit button sits in the footer outside the form with `form="id"`.
- Initial focus on the field the user came to fill (the title), not the close button.

## Grow from the button that opened it

A dialog that opens something new (create, search, settings) grows out of the button just pressed and shrinks back into it:

- Capture the press on the document in the capture phase; if a dialog opens within about a second, that element is its source. A dialog opened from a menu item whose menu has already closed grows from the menu's trigger instead.
- Only a button with a single child element can be the source; with several children the counter-scale stretches its content, so fall back to a plain fade.
- The dialog has one wrapper inside it, so the content can be counter-scaled while the box grows.
- Closing: `transform-origin: 0 0`, translate and scale to the source's current rect, opacity held to about 60% of the way then faded; about 450ms on `cubic-bezier(.33, 1, .68, 1)`, held with `fill: forwards` until unmount. The content fades in the first third, so nobody sees it squash. The source fades back in from .85 over the last 40%, and stays inert for about 200ms after so the hover does not flash on as the backdrop leaves.
- A fresh animation instance per opening (a stale source element is the classic bug). Skip it under reduced motion. Confirmations keep a plain fade: they don't open anything new.
- A dialog that opens from a URL, with no button pressed, rises in from below as usual.
- A large dialog (a whole settings page) that pops on a short scale reads as a jolt; let it rise and settle on the unroll curve over 500ms (scale .94, 12px), and leave quicker.

## Fly out of where it sits

To enlarge something that lives in the page (an avatar into a viewer): the copy flies from the source along a curved arc (cubic Bézier with offset control points, mirrored in right-to-left), about 950ms ease-in-out, growing from the source's size with a slight lift partway. It returns along the same arc and swaps with the source in one frame, so only one is ever visible; the source lands with a small pop and tilt. The source is hidden while the copy is out. Controls on the copy (its close `×`) come in after it lands and vanish at once on close, so they don't fly back. A close button over a blurred backdrop needs a solid fill and a shadow; a gray one sinks into the blur.

## Sheets

From the side the reading direction puts them on (`side` from the page direction), sizes by name (default, wide about 36rem, table about 64rem). Entering: opacity, a full-width translate and a small blur over 400ms smooth-out; leaving 350ms. The body scrolls; header and footer stay; footer padding includes the safe area. `container-type: inline-size` on the content so what is inside responds to the sheet, not the screen. A sheet that edits a draft: nothing saves until Save, closing discards, the draft is keyed by the item id so each opened item starts fresh.

## Confirm in place, not in a dialog over a dialog

For destructive actions inside settings, rows and selection bars, the button asks:

- The soft red button's text morphs into the question ("Delete") and turns solid red while asking, then into the running label ("Deleting…").
- "Cancel" springs out of the button's side, growing real width from 0 so it pushes its neighbours aside instead of covering them: a spring with no bounce, about .35s (an overshooting width shoves the neighbours past and back), its label tucked 24px toward the button at .9 scale as it comes. The gap lives inside the growing width; `white-space: nowrap` and `flex-shrink: 0` (a narrow width wraps the label one letter per line); not clipped (a clipped pill shows square edges mid-grow).
- Focus lands on Cancel, the safe choice.
- What the action does opens beneath, in place of the item's description (two texts in one cell, crossfaded, see [STATES.md](STATES.md)), so the row never changes height.
- The caller owns which item is asking, so only one question is open at a time; closing the panel or bar that holds it resets it.
- Equal fixed columns for side-by-side items (`repeat(3, minmax(0, 1fr))`), so Cancel appearing never widens one column and rewraps the others.

Use a real alert dialog when the action is serious and the context is a page (sign out, leave a group, delete an account): the subject named and isolated, what it means, Cancel and the destructive action. Build it on the plain dialog primitive with `role="alertdialog"` so Escape and an outside press still close it, and refuse closing in `onOpenChange` while the action runs. Snapshot the items being confirmed when it opens, so the dialog's text doesn't change as the list does while it animates closed.

## Disclosure panels

The shared open-and-close for filters panels, selection bars, warnings and comment threads:

```css
.disclosure-panel { display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-fast) var(--ease-smooth-out), visibility 0s var(--duration-fast); visibility: hidden; }
.disclosure-panel[data-open="true"] { grid-template-rows: 1fr; visibility: visible;
  transition: grid-template-rows 450ms var(--ease-unroll), visibility 0s; }
.disclosure-panel-inner { overflow: hidden; min-block-size: 0; }       /* padding goes inside this, never on the panel */
.disclosure-panel[data-open="true"] .disclosure-panel-inner > * {
  animation: disclosure-content-in 350ms var(--ease-smooth-out) 100ms both; }
@keyframes disclosure-content-in { from { opacity: 0; filter: blur(2px); } }
```

- Opens slowly (it unrolls), closes faster. Content fades in from a 2px blur a beat later and stays in place: sliding it in moves the last row under the edge.
- `inert` while closed; `visibility: hidden` after closing, so find-in-page, screen readers and tests don't see hidden text.
- Padding on the inner element only, or a strip shows while closed. A panel in a flex column cancels the parent's gap with a negative margin when closed and restores it inside.
- A panel holding form fields opens itself when the form is invalid (listen to `invalid` on the form).

## Step slides

Moving between steps (sign-in, sign-up and recovery in one card; sections of a settings dialog): the outgoing step leaves to one side while the incoming enters from the other, a full width, on a smooth spring with no bounce (about .5s), the fade finishing early (.3s). Forward enters from the reading end; going back (a tab above the current one, a previous step) reverses. Turning around mid-slide continues from where it is. The outgoing step is `inert` and `aria-hidden`. The card's height animates to the incoming step's height on the same spring (set an explicit pixel height on mount, then follow a `ResizeObserver`). Reduced motion: a fade. The frame around the steps (logo, card) is rendered once by the layout, so only the content moves.

## Sign-in and other multi-step flows

- **The frame renders once** (by the layout route), so moving between sign-in, sign-up and recovery slides only the card's content; links between them keep `?redirect=`. On first load each block rises out of an 8px blur and 12px over about .9s, the card 80ms after the logo.
- **A step per answer the other side asks for:** credentials, a choice of method, a code, waiting for approval elsewhere, or a live window for what only the user can do. Each stage shows its error at the top and offers Start over. Key the flow by the item, so each opening starts fresh, and close the drawer by itself once the goal state is reached (derive it: show the drawer only while the item is not yet connected).
- **Order choices practical first** (no code needed, then a message sent, then a code the user already has), unknown ones last in the source's order. Show them as rows with a title, a hint and a chevron, not a stack of identical gray buttons. Masked values (a phone, an email) are stripped of stray direction marks and isolated in `<bdi>` outside the sentence, so digits keep their order.
- **A live view of a remote screen** (frames streamed, the user's input sent back): queue input and send it in order, one at a time, dropping the rest if one fails; map a click to the remote page's pixels; ignore a keyboard press of the screen button (`event.detail === 0`); batch wheel scrolls over about 80ms; take typing through a visible text field focused within the tap itself, so phone keyboards and paste work, sending only special keys from `keydown`. `aria-busy` until the first frame.

## A settings dialog

All settings in one large dialog, sections as vertical tabs beside the open one, the section in the URL (`?settings=profile`) so any link can open it at a section and the back button closes it. The tabs use the sliding hover highlight; sections step-slide; on a phone the tabs become one scrolling row and the open tab scrolls into view (`block: "nearest", inline: "nearest"`). The last open section stays shown while the dialog closes. Each section: an intro line, a load or save failure where the user is editing, then the settings once loaded; changes save as they are typed, no Save button.
