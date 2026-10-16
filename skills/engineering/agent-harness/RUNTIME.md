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

- **Renew the lease while the answer runs** (every minute), matching the exact expiry the database returned, so a lost lease is never silently reclaimed; losing it aborts the stream, and the release clears only the holder's own value.
- **At the door:** origin and content-type checks, the session's user must match the request's user, a cap on the body size, the input decoded with a schema.
- **Store the user's message before the run starts,** under its own id with a unique constraint per conversation, so a failed run keeps what was asked (and can be retried) and a replayed request can't store it twice. Save only the run's new messages at the end.
- **A cap per user or tenant** on runs at once (and on background runs queued), so one account can't starve the rest.
- **Quiet hours** for a business channel: batches wait until morning instead of replying at 3 a.m.
- **Show it is working:** a read receipt and typing indicator, or streamed parts.
- **The client sends only text and files.** Every trusted part (the user context, a gate's note, a tool receipt) is written by the server, and the page can't forge one.
- **Another bot on the line:** let the agent mark an automated reply and send nothing, or two bots answer each other forever.

## Preparing the turn

Load everything the turn needs **in parallel** before the model starts: settings, memories, history, the record's state. Compute in code what code can know (the order's next step, missing fields, paid or not) and give the model facts, not puzzles. Time every preparation step as its own span; preparation is often the slow part nobody looks at.

A side classifier that reads the newest message (is it simple, does it need a hint) gets a time budget of a few seconds and **fails open:** on timeout or error the turn runs without it.

## Loop settings

| Setting | Rule | Why |
|---|---|---|
| Step limit | Measure the step counts of real turns; set the ceiling above the observed maximum (most turns end in 1-2 steps; a ceiling of 6 above an observed 4). Always set it explicitly: an SDK default (20 is common) is a guess, and hitting it may only log a warning | Stops runaway loops without cutting real work |
| Last step | Tools off, plus "answer now with what you found and what is still open" | Never end silently |
| Repeated calls | The same call with the same input: a reminder on the 3rd, a stop on the 5th | Loops |
| Reasoning effort | Start low for simple turns; raise it with an appended message (a long message, step 3+, a tool error, a loaded skill); it never falls within a turn. Check the provider's rules for these updates: some refuse two in a row or alongside server-side compaction | Pay for thinking only when the turn needs it, without editing the cached prefix |
| Retries | Turn the SDK's silent retries off; wrap the model so a retryable error is retried a few times (1, 2, 4 s) and each retry is logged, and shown to the user in a live UI. Retry only before anything streamed, and never a stopped answer. A retry after streaming began reruns only the failed step, but the text already shown can't be taken back (the user may see it twice) and a provider-run tool may run twice: allow it only where the UI resets the step and those tools are idempotent | Silent retries hide outages |
| Timeouts | One per pass (90 s) and one per step (30 s), plus, when streaming, one until the first chunk and one for a stall between chunks; one per tool, tighter for slow outside calls. A tool timeout comes back as a tool error the model can answer, not a dead turn. The request's abort signal reaches every tool | A stalled call otherwise never ends |
| Concurrency | A cap on tool calls running at once; 1 runs the whole turn in the model's order. Reads side by side and writes in order still needs the queue below | Parallel writes race |
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
- **The approval policy is a function of the traits and the call,** returning one of: allowed, denied with a reason (the model reads it), or ask the user. It suits facts code can read from the input and the turn so far (a second irreversible action, the running spend, the fifth write); a question about meaning goes to a classifier. An error inside the policy, or an answer it doesn't recognise, denies. A tool the table doesn't know (an MCP or plugin tool discovered at runtime) asks the user.
- **A dispatcher tool hides the real action.** A shell, a raw API passthrough, a generic "run action" or an MCP proxy makes per-tool approval see only "dispatch": parse its input into the action it performs (name and arguments) and apply that action's rule; deny what can't be reduced. The sandbox, not the approval, bounds what the action can then do.
- **Approvals are only as safe as the history they arrive in.** When the client sends the whole conversation back each turn, it can send a forged "approved" for a valid call. Keep the history on the server and accept decisions only for calls still pending, or sign each approval request (an HMAC over the tool name, call id and input, with a secret only the servers hold) and verify it when the decision returns.
- **An approval reason is not a data channel:** a denial's reason reaches the model, an approval's usually does not. Input the agent needs from the user comes through a question tool.
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
- **A person who answers later** (a teammate's reply in another channel, hours after) needs a durable run: the turn waits on an event matched to its own id, with a timeout, and an expired wait comes back to the agent as "no reply", never as silence.
- **A denial reaches the model in words:** with the user's note, "call it again with this change, and the user approves again"; without one, "it did not happen; do not call it again unless asked".

## More than one agent

One agent with good tools is the default; split only when the work has distinct stages or expertise, a part burns tokens exploring (research, a big codebase), or a part needs other permissions.

- **Route in code where you can:** keep the workflow's progress as typed state that tools write (the plan, the classification, done), and let a function pick the next agent from it. Use a model to route only where the path is unclear, give that router a "finished" choice and a step cap, and check that the agent it names exists.
- **A subagent runs as a tool:** a fresh context with only what the task needs, the parent's abort signal, a final message that summarises everything it found. The page may show its full work; the parent model reads only the summary.
- **No approval inside a subagent:** keep tools that need a click on the parent.
- **Never hand the same turn to the same specialist twice;** that is a loop. A handoff passes a trimmed history (no tool chatter, the last few messages) and the previous agent's results as a short note marked as data.

## After the answer

- **A stopped run skips the normal end:** save the partial answer, with its tool calls closed as "aborted", in the abort callback. A closed browser tab is not a stop: keep consuming the stream on the server so the answer finishes and is stored.
- **Follow-up suggestions** come from a short call of their own after the answer ends, inside a time budget; none when the answer asks the user something. Asked to write them itself, the agent left them out of 11 of 28 answers. Each is a short, specific next action on what was just shown ("compare with last month"), never a generic "tell me more".
- **A chat title** is written once an answer names what the user wants, and saved only while the chat has no name, so a name the user gave always wins.

## Long runs

An agent that works for minutes or hours (research, an import, a coding task) outlives a request and will meet a crash, a deploy or a timeout.

- **Run it as a durable workflow** (the `background-jobs` skill, DURABLE-WORKFLOWS.md): each model call and each tool call is a step, so a resumed run replays saved results instead of paying for them, or acting, twice. Side effects live inside steps and carry idempotency keys derived from the run and the call.
- **Keep the run's context serialisable:** ids and settings, never clients or open connections; rebuild those inside each step. Derive anything long-lived (a sandbox, a working directory) from the run's id, and never tear it down at a step boundary.
- **Slice long loops:** one step per model turn, or a time slice per step (a few minutes), with the history saved after each, so no single step outlives its own timeout.
- **A deadline for the whole run** that holds across suspensions, plus a step budget; a run that hits either stops, reports what it finished and what is left.
- **Waits for a person are durable waits** keyed by the run, with a timeout and an explicit "no answer" branch ([Human in the loop](#human-in-the-loop)).
- **Stopping cancels future steps and undoes nothing:** say so in the UI, and list what already happened.
- **Progress:** frequent updates (tokens, "reading source 3 of 8") by plain publish; state changes (waiting for approval, done) from a step, once. The page reads the stored run state on reload, then resumes the stream.
- **Define done as saved results plus evidence:** the deliverable written where it belongs, a check of it (a claims table, test output, counts reconciled), and the open issues. A run that only says it finished hasn't proven it; check the evidence in code where you can.
- **A reviewer that returns evidence:** give a second agent read-only tools, the deliverable and its sources, and require a table (claim, verdict, source, correction; verdicts verified, incorrect, unresolved, with what evidence is missing). The main agent applies the corrections.
- **A progress record a new run can resume from:** task, outputs and their paths, finished stages and checks, decisions with their sources, open issues, and one concrete next action. Update it after each stage; a resumed run reads it first.
- **One run per conversation or record at a time** (a per-key concurrency limit or singleton), and a per-tenant cap on runs at once.

## Observability

| Layer | What it holds |
|---|---|
| Metrics | Model calls, tokens (input, cached, output, reasoning), response time, tool calls and time, errors, check results: names, counts and timings, never conversation text |
| Traces with content | One trace per turn, each side call under it with its own name, personal data masked; content goes only here |
| Run records | One row per run: events (signals, gate reminders, retries, the route taken), usage, timings |
| Run analysis | Classify each finished run (truncated, empty, too long, too many calls, unexplained tool errors); some classes stop the reply |
| Alerts | A failed turn alerts the team |
| Flushing | Flush traces before a serverless function returns; it ends abruptly |

- **Each span typed for what it is:** model calls as generations, a lookup as retrieval, a subagent as its own agent node under the step that called it, each subagent named after its task, never all called "assistant".
- **Set a span's input on purpose** (the user's message, the tool's arguments), not every argument of the wrapped function, which drags in clients, settings and keys.
- **Read a real trace after instrumenting:** run the path, fetch the trace, check that someone could see from it exactly what the agent knew at each decision, fix the gaps, repeat.
- **Signals from users** (an edited draft, a retry, a thumbs down, a task finished) are scores named after what was observed (`draft_edited`), not the quality hoped for (`quality`).

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
