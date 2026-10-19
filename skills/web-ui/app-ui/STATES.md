# States

## Pending

- **The button says what it is doing, and its width moves smoothly.** The label morphs to the running label ("Save" to "Saving…", "Leave" to "Leaving…") with the morphing-text component, the button is disabled and `aria-busy`, and the cursor shows progress. A plain ternary that swaps the text snaps the width and everything beside it, so the ternary sits inside the morphing-text component (`<MorphText>{loading ? "Loading…" : "Load more"}</MorphText>`). A toggle's running label follows its direction ("Saving…" or "Removing…").
- **Words instead of spinners:** a shimmer over text that names the step ("Opening the page…", "Waiting for approval…"). Shimmer with a mask, not `background-clip: text` (which hides letters positioned by a morph), and keep the text's own color so it works on a primary button. The mask is black at `50% - spread`, 35% alpha at 50%, black at `50% + spread` (spread 2px per character), `mask-size: 250% 100%`, its position moving 100% to 0% in `0.9s linear infinite` (under a second a pass, so waiting feels fast), on an `inline-block`. A muted tone exists. Under reduced motion the band rests off the text.
- **A form in flight disables its `fieldset`,** so every field and button waits together; the server's error comes first in the form, then the step's notices, then the fields. Own pending with a transition (`useTransition`), so it clears however the action ends.
- **Prepare, then confirm.** When the question depends on the server (what leaving will change), the row's action first fetches it: the row is busy meanwhile, and a failure goes to the page alert. The confirm then opens with that text. Create the request id at prepare time and key the confirm by it.
- **The question stays open while its action runs** and closes once it has finished.
- **A background read doesn't hold an action** the worker queues ahead of it: the button stays enabled while details are still loading.
- **Pending writes flush before anything that leaves the page:** signing out, switching language, reloading. If a write fails, refuse to leave and say which change did not save.

## Optimistic, then honest

- **Show the change at once** (a pick in segmented tabs, a status set, a memory deleted); on failure put it back and say so where it happened. Board and list pickers stay enabled while they save. An item's status chip shows the new value at once from the override map and is disabled until its save returns, so one item never has two status saves in flight.
- **A picked value shows until the stored one matches it,** then the stored one takes over (`if (picked === stored) setPicked(null)` during render), so a slow save never flickers back.
- **Each change saves in its own request,** concurrently; the list is read again once all have saved. Any failure puts back the stored list and reads it again, so the page never shows unsaved changes as saved.
- **A save outlives the component that started it.** Keep the optimistic change and its rollback alive (`keepAlive`) and never abort the request when the component goes away: closing a sheet or leaving the page must not cancel either.
- **Save only over the version an edit was made from.** The optimistic copy bumps the version the way the database does (saving an order bumps every item's), or the next edit conflicts with its own earlier change. A conflict has its own code and message ("Changed elsewhere, reload to see it"), apart from the generic failure.
- **Changes apply only once the list has loaded;** before that an action does nothing.
- **An override map keyed by item id** applies a status change over every list and surface that shows the item, until they are read again. A failure removes that one entry and marks only that caller failed, cleared by its next change. A list keeps a changed item until it is read again: an item moved to a status the filter excludes stays visible with its new status instead of vanishing under the cursor. A successful change invalidates dependent counts (a "new" badge in the sidebar).
- **Not every write is optimistic.** A bulk write to a third party marks the ids pending, runs, then reads the list again whether it worked or not, with at most 100 ids per call and the error worded for one or many. A preview switch (an admin trying each plan) is optimistic and always re-read afterwards; the next pick clears its failure.
- **A lost reply is not a failure.** When the request may have gone through (a timeout, a reply about a different request), mark the outcome unknown, block sending it again for that item until its state is read, and tell the user it may have worked. Give every confirmed action a request id, and check that the reply carries it. Any number of unknown outcomes makes one notice.
- **A failed write reads the item's real state and shows it, never retries:** the action may have succeeded before a later step failed. The last observed state and the original error stay on the row.
- **Errors from the server carry a code first** (`ACCOUNT_LIMIT: …`); the client maps codes to messages in the page's language and falls back to a generic one, and a network failure gets its own code (`connection_failed`). Messages are always the app's own words in the app's language, never the third party's text in another language: match its text only to choose among the app's own messages.
- A stream that fails stays closed and offers Reopen; don't let it reconnect silently in a loop.

## Reads and stale data

- **Keep the last list on screen while the next one loads.** A new filter or query shows the previous results marked loading until its first page arrives, never an empty state or a skeleton. "Loading more" is a separate flag from "loading", so the next page's pending state never touches the list: a paged list shows the pages read so far plus whether the last one is still arriving.
- **A failed refetch keeps what is shown** until a later read succeeds; only a failed first read goes to the error state. A failed read in the browser retries after 1, 2 and 4s; a server render never waits on retries.
- **Freshness:** a read nobody shows is kept 5 minutes, so returning shows it at once. A shown read older than 30s is read again in the background when a page shows it, when the tab becomes visible (`visibilitychange`) and when the browser comes back `online`.
- **First paint:** the server render waits for the reads the first frame needs and streams a read still in flight as a promise, so the browser never reads it again; in the browser the loader only starts the reads, so navigation never waits. A failing read shows its error state and does not fail the loader. Block a loader only when the page truly cannot render without the data.
- **Seed what another surface already received** (items an answer in another panel carried), so their cards render at once; read by id only the ones missing.
- **Invalidate across entities.** A change made elsewhere invalidates the keys it touched and every view reading them reads again: deleting a kind of data re-reads everything that showed it; changing the primary account re-reads the lists that follow it.
- **Read an external source only when the user asks** (Refresh), never on arriving at the page.
- **An unknown health check reads as up.** A "service down" notice waits for the answer, like a plan-gated feature, so it never flashes.
- **Merge a multi-page sync as it arrives:** existing rows replaced in place, new ones appended. Remove rows no longer listed only after every page is in, so a half-read list never drops a row, and read an unlisted row's real state first.
- **When fresh rows replace shown ones,** carry over each row's in-flight state (its draft, result and errors), and keep the shown details when they are newer (`fetchedAt`).
- **Local edits sit over the server's draft** per field; key the form by the server's draft, so a new draft from the server resets the edits.
- **"Syncing" and pending ids are shared** and show on every page that lists the items; each caller's error stays with that caller until it acts again.

## Long jobs and progress

- **Long jobs get a progress line and Stop,** only when the job can stop midway (loading many details, joining many groups); short ones don't. It reads "Starting…" until the first progress message, then "completed of total". A collection target counts items that pass the filters, not candidates returned (`min(matched, limit)` and "checked").
- **Poll on a spaced schedule** (the next check a fixed time after the last answered, not a fixed interval) and stop the moment the step changes.
- **One foreground job at a time.** Starting one cancels background reads and waits for them; a second start while one runs is ignored, though the changes it carries (sort, owner) apply before the running job's next page. The page error clears as each job starts. Snapshot the filters a job uses when it starts.
- **Pages show as they land,** and what was collected stays on stop or error. While collecting, unchecked candidates show as they arrive; a finished, stopped or failed job shows only checked rows, never blank leftovers.
- **Stop takes effect after the current page;** leaving the page stops the job. Refresh the saved list in a `finally`, whatever the outcome. A source that returns no cursor, or the same one again, ends the job with its own message instead of looping.
- **Each part reports how it ended:** a job across several sources ends with one line per source ("name · 120 posts · ended / stopped / error"), error lines in red, sub-step failures counted apart. Only an unexpected failure ends the whole job.
- **Per item:** one silent retry for a dropped response, then the error on its row while the rest continue; each item's last error clears as its new attempt starts; one summary ("3 failed") at the end.
- **A rate-limit wait counts down** as `m:ss` (`Math.ceil(ms / 1000)`, every second) and reads the state again at zero, since another tab may have acted; a daily limit names the reset time with "today" or "tomorrow".
- **A job belongs to the session that started it.** Capture it at start; after a sign-out or another sign-in the job stops writing to the page and the server refuses its stale requests.
- **A start button stays disabled while any input is out of range** (whole numbers 1 to 10,000, `Number.isSafeInteger`); send chosen ids in the list's order, not the order they were picked.

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

- **Three different empties** (a catalog with only a search and chips uses two: loading, and none with Search again): still loading ("Checking results…"); filtered to nothing ("No match for these filters", with Clear filters in soft red, or a reset link inside the sentence); truly empty ("No results", with the one next action: search again, which focuses and selects the search field, or a link to where items are made). A list that has never been synced says so and gives no count ("Syncing…" until then), separate from one known to be empty.
- **Filtered to nothing shows only once settled** (not busy, not loading); until then the loading empty shows, so a filter is never blamed while data is still arriving. "Reached the end" likewise shows only when nothing runs, nothing more is available, and the count is above 0 and below what was asked for.
- **Before the first search there is no results card;** offer the one next step instead ("Browse saved"). The card appears once there are results, progress or an error.
- **Empty states sit on a card,** the icon in a tile (40px, `rounded-lg`, a 24px glyph; gray on the page, white inside a gray card), a title (headline-md), one line on what to do (`text-sm`, relaxed, the header at most `max-w-sm`), the action beneath; gap 1rem.
- **Loading shows nothing when the route already loaded the data** and the cache is warm; only a cold cache reaches the component's loading branch. Navigation and the header never wait for page data: only the page content suspends. A section that needs its settings renders nothing until they load, with no skeleton; a run history renders nothing while loading.
- **Show nothing rather than a false empty** while server rows are being copied into a local store, and hide a live figure while it is unknown (never 0); read it again each time its section mounts.
- **Partial results say so:** "Some comments could not be read", "More on the source", "Showing the first 50".
- **Collapse repeats in histories:** back-to-back runs that failed or were skipped for the same reason become one entry with "×4". A run history is an `<ol>` with an `aria-label`, newest first (the latest 5 in a sheet), `data-status` on each entry; the head is the outcome plus a relative `<time>`; failed outcomes are red and skipped runs leave out the counts. A load failure and "none yet" are separate texts.
- **A feature the plan doesn't include** shows an empty state with what it does and a link to the plans, and the server refuses it too (it answers with an empty page, not an error).

## Where messages go

The error appears in the column, row, field or form it is about, with `role="alert"` for errors and `role="status"` for notices; page-level errors only for page-level failures, one slot above the toolbar. A load failure and a save failure have different titles, and in a shared slot the load failure wins; the save error shown is the newest change's, until a later change starts. Toggle-style notices live in a disclosure panel so they open and close instead of popping. Read-only facts use `<output>` with `aria-live="polite"` when they update (counts, summaries, "Syncing…").

- **Keep the live region mounted** and change only its content; a region mounted together with its text is not announced.
- **An alert:** `rounded-lg`, `px-4 py-3`, `text-sm`, an `auto 1fr` icon grid; the destructive one is a 10% red tint with no border and the on-tint text, its links underlined at a 3px offset.
- **An error can carry its recovery** ("Refresh connection"): disabled while progress shows, it reports on the same progress line, runs the failed action again on success, and its own failure replaces the shown error.
- **A suggestion that fails to load shows nothing,** no error: it was never asked for.

## Saving and persisted view state

- **Persist the form and the view** (sort, visible columns, page size, board or list) with the page's state, so a refresh keeps them; drop saved choices that point at items no longer there. Some views are deliberately not persisted (an inbox's filters reset when the page closes); say so in the code.
- **Never persist** busy flags, progress, errors, selections or open dialogs. Restored state never claims a running job: "searching" restores as "cancelled", and during a search only the rows already checked are stored.
- **Restore once, after mount,** so the server render and the first browser render match (both show the default; stored values in `localStorage` show after hydration). Nothing saves before the stored copy has loaded, so the default shown while loading never overwrites it; a failed read saves nothing and the next caller retries; concurrent restores share one read. A section the user changed during the restore keeps the user's value, merged per field.
- **Save after a pause,** per key and in order: settings 500ms after typing stops, page state 800ms after the last change, each write waiting for its key's previous one; a failed write stays retryable, and `flush` starts every waiting write and resolves true only when all have saved. Each change writes only its own field, so two tabs never overwrite each other's fields; across tabs page state is last-write-wins, capped at 64KB. A save error stays until a later save starts; reading the stored copy again replaces local edits. On sign-out, flush pending writes, cancel the rest and reset the store.
- **Store result lists as ids** and join them back on read. Local-only state (`page: null`) stays in this browser.
- **A versioned envelope** (`{ state, version: 0 }`) in local storage: a value that no longer decodes, or an older shape, falls back to the defaults, and writes merge only the fields given.
- **A selection handed over from another page** waits for the stored choices to load, then sets only the ids, so the user's other choices survive.

## Async copy

- Progress messages that can stop are detected by the message's text before its first value, so the check survives translation.
- A notice after an action says where it went: "We sent a link to <bdi>name@example.com</bdi>", and the button becomes "Send again".
- A notice from a redirect (an expired link) reads the flag from the URL and hides once the user acts.
