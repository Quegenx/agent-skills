# States

## Pending

- **The button says what it is doing, and its width moves smoothly.** The label morphs to the running label ("Save" to "Saving…", "Leave" to "Leaving…") with the morphing-text component, the button is disabled and `aria-busy`, and the cursor shows progress. A plain ternary that swaps the text snaps the width and everything beside it; that is the bug, not the words.
- **Words instead of spinners:** a shimmer over text that names the step ("Opening the page…", "Waiting for approval…"). Shimmer with a mask, not `background-clip: text` (which hides letters positioned by a morph), and keep the text's own color so it works on a primary button.
- **A form in flight disables its `fieldset`,** so every field and button waits together; the server's error comes first in the form, then the step's notices, then the fields.
- **Long jobs get a progress line and Stop,** only when the job can stop midway (loading many details, joining many groups); short ones don't.
- **Poll on a spaced schedule** (the next check a fixed time after the last answered, not a fixed interval) and stop the moment the step changes.
- **Pending writes flush before anything that leaves the page:** signing out, switching language, reloading. If a write fails, refuse to leave and say which change did not save.

## Optimistic, then honest

- **Show the change at once** (a pick in segmented tabs, a status set, a memory deleted); on failure put it back and say so where it happened.
- **A picked value shows until the stored one matches it,** then the stored one takes over (`if (picked === stored) setPicked(null)` during render), so a slow save never flickers back.
- **A lost reply is not a failure.** When the request may have gone through (a timeout, a reply about a different request), mark the outcome unknown, block sending it again for that item until its state is read, and tell the user it may have worked. Give every confirmed action a request id, and check that the reply carries it.
- **Errors from the server carry a code first** (`ACCOUNT_LIMIT: …`); the client maps codes to messages in the page's language and falls back to a generic one. Messages are always the app's own words in the app's language, never the third party's text in another language.
- A stream that fails stays closed and offers Reopen; don't let it reconnect silently in a loop.

## Nothing jumps

**Two texts that swap share one grid cell,** sized by the taller, and crossfade, so a description turning into a warning (or a hint into an error) never changes the height and nothing below moves:

```tsx
<div className="grid" aria-live="polite">
  <p className={cn("col-start-1 row-start-1 transition-opacity duration-300", asking && "opacity-0")} aria-hidden={asking}>{description}</p>
  <p className={cn("col-start-1 row-start-1 transition-opacity duration-300", !asking && "opacity-0")} aria-hidden={!asking}>{whatWillBeLost}</p>
</div>
```

**A closing panel keeps its last content.** A selection bar collapsing keeps the last count, not zero; a confirm note keeps its text while it folds; a dialog keeps the last section and the form as filled. Hold the shown value in state and update it only while open:

```tsx
const [shown, setShown] = useState(count);
if (open && shown !== count) setShown(count);       // during render; no effect, no flash
```

**Dependent fields enter and leave** with opacity, scale from .96 and a 4px blur on a short spring with no bounce, without `initial` animation on the first render, and the grid around them re-flows smoothly.

## Empty, loading, filtered, partial

- **Three different empties:** still loading ("Checking results…"); filtered to nothing ("No match for these filters", with Clear filters in soft red, or a reset link inside the sentence); truly empty ("No results", with the one next action: search again, which focuses and selects the search field, or a link to where items are made). A list that has never been synced says so, separate from one known to be empty.
- **Empty states sit on a card,** the icon in a tile (gray on the page, white inside a gray card), a title, one line on what to do, the action beneath.
- **Loading shows nothing when the route already loaded the data** and the cache is warm; only a cold cache reaches the component's loading branch. Navigation and the header never wait for page data: only the page content suspends.
- **Partial results say so:** "Some comments could not be read", "More on the source", "Showing the first 50".
- **Collapse repeats in histories:** back-to-back runs that failed or were skipped for the same reason become one entry with "×4".
- **A feature the plan doesn't include** shows an empty state with what it does and a link to the plans, and the server refuses it too.

## Where messages go

The error appears in the column, row, field or form it is about, with `role="alert"` for errors and `role="status"` for notices; page-level errors only for page-level failures. A load failure and a save failure have different titles. Toggle-style notices live in a disclosure panel so they open and close instead of popping. Read-only facts use `<output>` with `aria-live="polite"` when they update (counts, summaries, "Syncing…").

## Async copy

- Progress messages that can stop are detected by the message's text before its first value, so the check survives translation.
- A notice after an action says where it went: "We sent a link to <bdi>name@example.com</bdi>", and the button becomes "Send again".
- A notice from a redirect (an expired link) reads the flag from the URL and hides once the user acts.
