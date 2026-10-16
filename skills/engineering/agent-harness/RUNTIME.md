# The runtime around the loop

The path of one turn, and what goes wrong at each step in production:

```
message in -> entry: auth, batching -> one answer at a time (lease)
           -> context: parallel reads, turn signals
           -> prompt: cached static prefix + per-turn messages
           -> loop: model <-> tools (traits, queue, error next steps, output cap, tool search)
           -> stop hooks: empty reply, plan gate, domain gates (back once with a note)
           -> answer check: a classifier says what the reply claims, code checks it against the tools
           -> send or stream -> store the turn, usage, run record, traces
```

## Entry: one answer at a time

The first production bug of most agents: two runs answering one conversation at once, with interleaved or contradictory replies.

- **Decide the unit of a turn.** On a messaging channel people send "hi", then the order, then the address, as three messages. Batch them per conversation: flush after a quiet window (a few seconds) or a maximum wait (15 seconds or so), whichever comes first, so they become one turn. A web chat sends one request per turn.
- **Hold one lease per conversation,** claimed by an atomic conditional update, and refuse a second run with a distinctive code (`AGENT_CHAT_BUSY`, 409). Size the lease above the worst-case run, not the typical one: a lease shorter than a slow run expires mid-run and lets a second run reply too.

```sql
-- No row returned: another run holds the conversation.
update conversations
set answering_until = now() + interval '5 minutes'
where id = $1 and (answering_until is null or answering_until < now())
returning id;
```

- **At the door:** origin and content-type checks, the session's user must match the request's user, a cap on the body size, the input decoded with a schema.
- **Quiet hours** for a business channel: batches wait until morning instead of replying at 3 a.m.
- **Show it is working:** a read receipt and typing indicator, or streamed parts.
- **Another bot on the line:** let the agent mark an automated reply and send nothing, or two bots answer each other forever.

## Preparing the turn

Load everything the turn needs **in parallel** before the model starts: settings, memories, history, the record's state. Compute in code what code can know (the order's next step, missing fields, paid or not) and give the model facts, not puzzles. Time every preparation step as its own span; preparation is often the slow part nobody looks at.

A side classifier that reads the newest message (is it simple, does it need a hint) gets a time budget of a few seconds and **fails open:** on timeout or error the turn runs without it.

## Loop settings

| Setting | Rule | Why |
|---|---|---|
| Step limit | Measure the step counts of real turns; set the ceiling above the observed maximum (most turns end in 1-2 steps; a ceiling of 6 above an observed 4) | Stops runaway loops without cutting real work |
| Last step | Tools off, plus "answer now with what you found and what is still open" | Never end silently |
| Repeated calls | The same call with the same input: a reminder on the 3rd, a stop on the 5th | Loops |
| Reasoning effort | Start low for simple turns; raise it with an appended message (a long message, step 3+, a tool error, a loaded skill); it never falls within a turn | Pay for thinking only when the turn needs it, without editing the cached prefix |
| Retries | Turn the SDK's silent retries off; wrap the model so a retryable error is retried a few times (1, 2, 4 s) and each retry is logged, and shown to the user in a live UI | Silent retries hide outages |
| Timeouts | One per step (30 s) and one per pass (90 s); the request's abort signal reaches every tool | A stalled call otherwise never ends |
| Output | A token cap per reply | Bounded cost and length |
| Privacy | Provider-side storage off; a hashed user id for abuse tracking | No raw identifiers at the provider |

## Tool traits

One table gives each tool its **effect**, and every policy is derived from it, so nothing drifts when a tool is added.

```ts
type ToolEffect = "read" | "ui" | "write" | "payment" | "customer_message" | "handoff" | "approval";

const toolEffects: Record<string, ToolEffect> = {
  findOrder: "read",
  draftOrder: "write",
  sendPaymentLink: "payment",
  escalateToHuman: "handoff",
};

/** An unknown tool counts as the most dangerous effect. */
export function toolEffectFor(name: string): ToolEffect {
  return toolEffects[name] ?? "approval";
}
export const toolRunsInParallel = (name: string) => toolEffectFor(name) === "read";
export const toolNeedsApproval = (name: string) => toolEffectFor(name) === "approval";
export const toolAllowedInProactiveTurn = (name: string) => toolEffectFor(name) === "read";

/** Reads run side by side; every other effect waits its turn in call order. */
export function createToolQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(name: string, run: () => Promise<T>): Promise<T> => {
    if (toolRunsInParallel(name)) return run();
    const next = tail.then(run, run);
    tail = next.catch(() => undefined);
    return next;
  };
}
```

- **Approval** tools need the user's click every time, and the server accepts a decision only for a call still pending.
- **System-started turns** (a reminder, a follow-up the app schedules) get read tools only.
- **A failed write with no known error code** reaches the model as "the outcome is unknown", so it never claims success.
- **Audit tools with data** before merging or removing one: production call counts per tool, which eval cases need it, which calls the baseline made.

## Stop hooks, in order

After the loop ends with text, each hook may send the agent back once with a short note ([CHECKS.md](CHECKS.md) has the runner):

1. **Empty reply:** rerun with tools off and a nudge. It happens: about 1 run in 70 ended with no text.
2. **Plan gate:** plan steps still open, back at most twice.
3. **Domain gates:** one per repeated production mistake (asks again what the last message asked, closes without validating).
4. **Answer check:** a classifier says what the draft claims, code checks the turn's tools back it, one text-only rewrite. Run it only when the turn wrote, asked for approval or read outside content; the claim questions see the draft, never the tool results, so injected text in a result can't steer them.

## Human in the loop

Fit it to who the user is.

- **A customer** gets no approval cards. A handoff tool opens a ticket, marks the conversation as needing a person and alerts the team; a second handoff in the same conversation sends no second alert. Staff take over in their dashboard.
- **An account owner** approves outside actions (send a message, join, delete) with a click each time. A question with two to four buttons ends the turn; a live checklist shows the plan.
- **"Try again"** is refused when the earlier answer acted: rerunning would act twice.

## Observability

| Layer | What it holds |
|---|---|
| Metrics | Model calls, tokens (input, cached, output, reasoning), response time, tool calls and time, errors, check results: names, counts and timings, never conversation text |
| Traces with content | One trace per turn, each side call under it with its own name, personal data masked; content goes only here |
| Run records | One row per run: events (signals, gate reminders, retries, the route taken), usage, timings |
| Run analysis | Classify each finished run (truncated, empty, too long, too many calls, unexplained tool errors); some classes stop the reply |
| Alerts | A failed turn alerts the team |
| Flushing | Flush traces before a serverless function returns; it ends abruptly |

## Building a new agent: the order

1. Entry, lease, one model call and one tool, end to end, with validated input and a trace.
2. Static instructions in tagged sections, the message time, the cache key, provider storage off, a prompt snapshot test.
3. Tools with the traits table, the queue, error next steps, the output cap, idempotency keys.
4. Loop settings: step limit from measurement, last-step note, repeated-call reminder, visible retries, timeouts, effort updates.
5. History rebuilt with every call answered; run records and metrics.
6. The eval harness with fixtures and code checks, and a first baseline (`agent-evals`).
7. Stop hooks: empty reply first, then the plan gate if multi-step work exists.
8. The answer check; turn signals if routing pays off.
9. Memory: compaction with a circuit breaker, then long-term memory tools.
10. Skills for rare multi-step flows; tool search once the tool list is large.
11. Human in the loop, fitted to the product.
12. The fix loop until a full run is clean; then read real conversations and turn each mistake into a case.
