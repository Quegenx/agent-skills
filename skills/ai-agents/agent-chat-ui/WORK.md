# The answer while it works, and after

## The status line

One line under the answer says what is happening now. It is rendered as one element for the whole answer, in the answer's own frame, so its icon and label **morph** from one state to the next instead of being swapped:

- **A pulse dot** the instant the message is sent, before anything comes back, with an empty label.
- **"Thinking"** with its own icon (a brain) while the model reasons or between steps.
- **The running step's title and icon,** as "title · progress" when the tool reports it ("Searching apartments · 12 found · 2 of 3 sites done"; with one site, only the found count).
- **"Reconnecting (1/3)"** with the pulse-dot icon while a failed model call is retried in view; it shows until the answer gains a part after the retry.

Render it as an `<output>` (a live region). The label shimmers in the muted tone (a mask band sweeping across it, under a second a pass, so the wait reads as busy). The line **hides** when the answer is writing text (the text shows the work), when a step waits for the user's approval, and when a step has its own card with its own progress. Keep it hidden in the moment between the end of the text and the end of the answer, or it flashes "thinking" there. A reasoning part ends the dot even though it is never shown, and a tool or reasoning part that comes after the text brings the line back.

```ts
type Activity = { kind: "dot" } | { kind: "thinking" } | { kind: "reconnecting"; attempt: number; of: number } | { kind: "tool"; part: ToolPart };

function liveActivity(message: Message | undefined): Activity | null {
  if (message?.role !== "assistant" || !message.parts.some((p) => shows(p) || p.type === "reasoning")) return { kind: "dot" };
  const tools = message.parts.filter(isVisibleTool);
  if (tools.some((p) => p.state === "approval-requested")) return null;          // the card is the status
  const running = tools.findLast((p) => isRunning(p) && !hasOwnCard(p));
  if (running) return { kind: "tool", part: running };
  const last = message.parts.findLast((p) => p.type === "reasoning" || (p.type === "text" && p.text.trim()) || isVisibleTool(p));
  if (last?.type === "text") return null;                                         // the text shows the work
  if (last && isVisibleTool(last) && hasOwnCard(last) && isRunning(last)) return null;
  return { kind: "thinking" };
}
```

**Until the answer shows anything, leave its empty message out** and render only the status line; rendering both leaves a blank frame above the line.

## Rows, the folded log and sources

- **Each finished step stays as a row** in the answer, in order with its text and cards: its icon, its title in the muted color, and the favicons of the services it worked through (the sites it searched, the outside API it called). A row enters from a light blur at 96% scale on a short spring with no bounce.
- **When the answer ends,** the rows fold into one line at its top, "worked for 12 seconds" (from the answer's start to its end time stored in its metadata; a count of steps when no end time was kept), which opens back to them. Round to the nearest second with a minimum of 1; minutes are floored and the seconds are the remainder. Write every plural form out ("1 second", "1 minute 5 seconds", "3 minutes"); languages with dual or several plural forms need each. Inside the opened log the rows are static (no enter animation), keyed by tool call id.
- **Titles and icons come from two maps typed against the tool list** (`satisfies Record<ToolName, ...>`), with one generic action icon as the fallback; a name outside the title map (only possible at runtime) shows as itself. A step that loads a guide or playbook shows the generic "load guide" title until its output arrives, then "Guide: <its title>" from a map typed against the guide registry; an id missing from that map shows as "Guide: <id>".
- **The services a row shows:** an explicit list for tools that call one outside service; otherwise derive them from the sites the call's input names (or every site of that kind). The input may still be streaming, so skip its undefined entries. Favicons come from a favicon service at 64px and display at 16px; on a row each carries the site's name as `alt` and `title`, in the stacked summary `alt=""`.
- **Sources:** the outside sites the answer links to, once each by host, as one folded line with up to three overlapping favicons and "Sources", opening to every source chip. Pull the addresses from the raw text parts in order of appearance (`/https?:\/\/[^\s)<>\]]+/gu`), dedupe by host after stripping a leading `www.`, and keep the first address seen for each. The product's own links (the platform its content lives on) are content, not sources: match the host by suffix so subdomains count as the platform, and skip addresses that fail `URL.canParse`.
- **Under the answer, only once it has ended:** the sources line, the worked-for line, and on hover or focus copy, like and dislike (filling in the primary color once chosen) and the time, like under the user's messages.

## Steps with their own card

A few steps carry their own progress and get a card instead of a row: a search shown like a web search tool (each query a pill that shimmers until its results arrive, then a check swaps in; a result count that rolls up as results come; a scrolling list of result rows), a batch read (each item waiting, reading, done with a rolling count, or failed), the plan, a question with options, suggested items. The card's header shimmers its title in the muted tone while running, carries count badges, and its chevron turns as it opens (mirrored in right-to-left, and the outward arrow with it).

- **Titles in two tenses:** "Reading posts" while it runs, "Posts read" once done.
- **A search card shows its queries before any result:** the pills come from the call's input, each with a search icon that swaps to a check as that query's results arrive while the search runs; the pending one shimmers in the default tone. Once the whole search is done every pill rests with its search icon and no shimmer. The count badge carries a search icon and shows even at 0; each row has its action (save) inside the row. A plain list card shows its count badge only once it finished.
- **A count of exactly one** is a static singular word ("one group"); only plural counts roll.
- **A batch read** gives each item a state, from live progress while running and from the output once done (an error there means failed): waiting, reading (shimmering until its first count), failed ("not read"), done. A done item with results is a disclosure (its count and a chevron) opening to what was read: the author in bold and ": ", the first two lines, each in its own `bdi`, and an open link; a done item with none is a plain count. While running the header badges read done of total and the results so far; after, the item and result counts. Counts roll.
- **Inputs stream as partial objects:** validate each list item against its schema and show only the complete ones, so a half-written step or task never renders.
- **Older stored results lack newer fields** (a photo, an activity line added later): read them as null, never as an error.
- **A row that comes from the user's own records** (a saved group) takes their stored photo and details; otherwise what the tool read.

## The plan

Each plan update resends the whole list; show only the newest, as an `<ol>` labelled "plan" with steps keyed by their text. A step is a ring that fills when done; the one in progress is full color; done and cancelled steps are struck through. Give each step `dir="auto"` and a visually hidden "<status>: " prefix from four statuses: pending, in progress, completed, cancelled.

## Approval cards

- **Title and summary built from the real call:** a deletion is titled in the singular for one record and "delete N" otherwise, listing the names its ids point to joined by " · "; a message shows its exact text and the recipient's name from what this answer's tools read (the id when unknown). The summary is always visible, so nothing starts unseen.
- **A join** names the group (a name built from its id when unknown) and every answer from the latest form the agent read for that group: one "question: answer" line each, chosen option ids mapped to their text (the id when unknown) and joined by ", ", a generic "question" when the question is missing, and a line for agreeing to the rules when set; lines joined by " · ", "no questions" when there are none.
- **Markup:** a `section` labelled by the title, the title an `h3`, title and summary each in a `bdi`.
- **Confirm, revise, deny** as small buttons (deny in a soft destructive style). Escape on any of the card's buttons denies while the card is pending (`preventDefault` so nothing else closes).
- **Revise** toggles a one-line note under the buttons. The note is a `<form>` (Enter sends) on the page background so it stands out from the card, with Send (disabled until there is trimmed text) and Cancel; sending denies the call with the trimmed note as the reason, so the agent changes it and asks again. Escape in the note closes the note, not the card.
- **After a decision** the buttons give way to the outcome in an `<output>`: "allowed", "revised: <note>" when the denial carries a reason, else "denied". An approval that is still undefined is pending.
- **Several pending at once** (join these five groups): a small "Approve all (5)" under them that sends one allow per pending id, each card still showing exactly what it does, only when more than one waits in the last answer. The answer continues by itself once every one is decided.
- **A call your policy approved by itself** renders as a plain finished step, never as a card; it is not counted in "approve all". A denied call shows the card's outcome and no row.
- **A tool with no summary of its own** falls back to a generic "confirm action" card with the tool's name as its summary, never to nothing. A deletion whose id is not among the user's own records says "not found" instead of a blank name.
- **Accessibility:** the revise button carries `aria-expanded`; the note takes focus as it opens (a ref callback).

## Questions, follow-ups and suggestions

- **A question with options is a card,** built like the approval card: a `section` labelled by the question, the question as its title and each option as a numbered full-width row inside it (a gray fill, a small round number that is `aria-hidden`, a soft accent on hover). Picking a row sends that option's text as the next user message; the user can still type their own answer. Once answered the card keeps the question and the reply shows as the user's message. Options shown as buttons under the answer read as an afterthought and got missed. Render the card once its question text is non-empty, even while the input still streams; show the rows only on the last answer and only once the question's call has finished.
- **Follow-ups** come from a separate short call after the answer ends (the `agent-harness` skill); show them only under the last answer, after its action row and outside its content, as a column of outlined buttons keyed by their text that rise in from a blur one after another. One press sends.
- **Suggested items** (a task to track): a card with badges in a fixed order (place as an outline badge, then potential colored by its level), the item and its details, disclosures for "what it will look for" (each signal with a check) and "why" (the evidence), each only when it has content, and an add button that morphs into "added" (tracked per item, marked at once before the add is confirmed, then muted and disabled). Text and button sit side by side while the text keeps 16rem, else the button wraps under it (`flex: calc(infinity) 1 16rem` on the text, a 20px column gap). Enable it once the step finished and the user's defaults have loaded; an added item lands in the backlog with its potential as priority and the user's defaults.
- **Follow-ups and options send their text as a message;** a suggestion chip in the empty state fills the composer instead ([COMPOSER.md](COMPOSER.md)).

## Errors

A failed answer gets an inline `role="alert"` in the destructive color, inside the log after the status line, with a small outline "try again" only when the failure is retryable (map each failure to a message and a retryable flag; try again regenerates the answer); a failed save of a conversation change shows above the chat and the next load shows what was stored.

## Which part renders how

One router over the answer's parts: text goes to the markdown renderer with its streaming flag; each tool with its own view goes to its card; every other tool goes to a row while it runs and its result once done. A part shows when it is non-empty text, or a tool that is not hidden and either has its own view, waits for a real approval, or has finished. Data parts the model reads later (a note from a gate) are stored and never shown.
