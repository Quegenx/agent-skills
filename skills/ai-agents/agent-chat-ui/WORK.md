# The answer while it works, and after

## The status line

One line under the answer says what is happening now. It is rendered as one element for the whole answer, in the answer's own frame, so its icon and label **morph** from one state to the next instead of being swapped:

- **A pulse dot** the instant the message is sent, before anything comes back.
- **"Thinking"** while the model reasons or between steps.
- **The running step's title and icon,** with live progress when the tool reports it ("Searching apartments · 12 so far · 2 of 3 sites done").
- **"Reconnecting (1/3)"** while a failed model call is retried in view; it shows until the answer gains a part after the retry.

The label shimmers (a mask band sweeping across it, under a second a pass, so the wait reads as busy). The line **hides** when the answer is writing text (the text shows the work), when a step waits for the user's approval, and when a step has its own card with its own progress. Keep it hidden in the moment between the end of the text and the end of the answer, or it flashes "thinking" there.

```ts
type Activity = { kind: "dot" } | { kind: "thinking" } | { kind: "reconnecting"; attempt: number; of: number } | { kind: "tool"; part: ToolPart };

function liveActivity(message: Message | undefined): Activity | null {
  if (message?.role !== "assistant" || !message.parts.some(shows)) return { kind: "dot" };
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
- **When the answer ends,** the rows fold into one line at its top, "worked for 12 seconds" (from the answer's start to its end time stored in its metadata; a count of steps when no end time was kept), which opens back to them.
- **Sources:** the outside sites the answer links to, once each by host, as one folded line with up to three overlapping favicons and "Sources", opening to every source chip. The product's own links (the platform its content lives on) are content, not sources.
- **Copy and the time** appear under the answer only once it has ended, on hover or focus, like under the user's messages.

## Steps with their own card

A few steps carry their own progress and get a card instead of a row: a search shown like a web search tool (each query a pill that shimmers until its results arrive, then a check swaps in; a result count that rolls up as results come; a scrolling list of result rows), a batch read (each item waiting, reading, done with a rolling count, or failed), the plan, a question with options, suggested items. The card's header shimmers its title while running, carries count badges, and its chevron turns as it opens.

## The plan

Each plan update resends the whole list; show only the newest. A step is a ring that fills when done; the one in progress is full color; done and cancelled steps are struck through. Give each step a screen-reader label for its status, and `dir="auto"`.

## Approval cards

- **Title and summary built from the real call:** a deletion lists the names of the records its ids point to; a join names the group and every answer from the form the agent read; a message shows its exact text and the recipient's name from what this answer's tools read (the id when unknown). The summary is always visible, so nothing starts unseen.
- **Confirm, revise, deny** (deny in a soft destructive style). Escape on any of the card's buttons denies.
- **Revise** opens a one-line note under the buttons; sending it denies the call with the note as the reason, so the agent changes it and asks again. Escape in the note closes the note, not the card.
- **After a decision** the buttons give way to the outcome ("allowed", "denied", "revised: …").
- **Several pending at once** (join these five groups): "Approve all (5)" under them, each card still showing exactly what it does. The answer continues by itself once every one is decided.

## Questions, follow-ups and suggestions

- **A question with options** shows its text in the answer and its options as buttons under the last answer.
- **Follow-ups** come from a separate short call after the answer ends (the `agent-harness` skill); show them only under the last answer, as a column of outlined buttons that rise in from a blur one after another. One press sends.
- **Suggested items** (a task to track): a card with badges (place, potential), the item and its details, disclosures for "what it will look for" and "why", and an add button that morphs into "added". Enable it once the step finished and the user's defaults have loaded.

## Errors

A failed answer gets an inline alert in the destructive color with "try again" only when the failure is retryable; a failed save of a conversation change shows above the chat and the next load shows what was stored.
