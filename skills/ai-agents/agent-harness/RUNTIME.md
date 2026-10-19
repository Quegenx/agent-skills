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
- **A message written while the agent answers** is queued on the page, shown as waiting, and sent as one message (in order, attachments with it) once the answer ends and no approval is waiting; the server's busy refusal stays as the guard for a second tab. A queued message can be removed, and the waiting chip says that closing the page drops it.
- **An account switch mid-flight:** a delayed send, a search still paging or a background job started under one account must not finish under the next. Each carries the owner it started with, the server rejects a mismatch, client work checks the owner before publishing a result, and the signed-in app remounts when the owner changes.
- **A cap per user or tenant** on runs at once (and on background runs queued), so one account can't starve the rest.
- **Quiet hours** for a business channel: batches wait until morning instead of replying at 3 a.m.
- **Show it is working:** a read receipt and typing indicator, or streamed parts.
- **The client sends only text and files.** Every trusted part (the user context, a gate's note, a tool receipt) is written by the server, and the page can't forge one. AI SDK 7 backs this: a `{ role: 'system' }` message inside `messages` is rejected by default (which can break older stored chats that hold one), and `allowSystemInMessages: true` is only for trusted messages, since a user who can submit or edit them could inject a system message.
- **Another bot on the line:** let the agent mark an automated reply and send nothing, or two bots answer each other forever.

## Preparing the turn

Load everything the turn needs **in parallel** before the model starts: settings, memories, history, the record's state. Compute in code what code can know (the order's next step, missing fields, paid or not) and give the model facts, not puzzles. Time every preparation step as its own span; preparation is often the slow part nobody looks at.

**Preserve configured fields when deriving a per-request override.** The supplied proxy reconstructed its route field by field, silently resetting an enabled option to its default before execution. Copy the complete configuration and override only the intended fields, so the effective route retains the other configured values. [harness2, third_party/patches/workbuddy-bench-runtime.diff, `proxy/main.py`]

A side classifier that reads the newest message (is it simple, does it need a hint) gets a time budget of a few seconds and **fails open:** on timeout or error the turn runs without it.

## Loop settings

| Setting | Rule | Why |
|---|---|---|
| Step limit | Measure the step counts of real turns; set the ceiling above the observed maximum (most turns end in 1-2 steps; a ceiling of 6 above an observed 4). Always set it explicitly: an SDK default (20 is common) is a guess, and hitting it may only log a warning | Stops runaway loops without cutting real work |
| Last step | Tools off, plus "answer now with what you found and what is still open" | Never end silently |
| Repeated calls | The same call with the same input: a reminder on the 3rd, a stop on the 5th | Loops |
| Reasoning effort | Start low for simple turns; raise it with an appended message (a long message, step 3+, a tool error, a loaded skill); it never falls within a turn. Check the provider's rules for these updates: some refuse two in a row or alongside server-side compaction, and on some models and platforms changing the request's effort clears the cache. Higher effort buys "more independent action for judgement and verification": it cuts failures from missed edge cases but doesn't fix a wrong approach. Before raising it, give the model a way to check its work: a test run costs one turn, more effort adds thinking to every turn (the tell of too little is a fix that stops at one layer). Levels are recalibrated per model and defaults differ by surface: set it explicitly, rerun the effort sweep on a model change, and use the top levels only where the evals show a gain | Pay for thinking only when the turn needs it, without editing the cached prefix |
| Retries | Turn the SDK's silent retries off; wrap the model so a retryable error is retried a few times (1, 2, 4 s) and each retry is logged, and shown to the user in a live UI. Retry only before anything streamed, and never a stopped answer. A retry after streaming began reruns only the failed step, but the text already shown can't be taken back (the user may see it twice) and a provider-run tool may run twice: allow it only where the UI resets the step and those tools are idempotent | Silent retries hide outages |
| Timeouts | One per pass (90 s) and one per step (30 s), plus, when streaming, one until the first chunk and one for a stall between chunks; one per tool, tighter for slow outside calls. A tool timeout comes back as a tool error the model can answer, not a dead turn. The request's abort signal reaches every tool. AI SDK 7 has them built in, aborting with `TimeoutError`: `timeout: { totalMs, stepMs, chunkMs, toolMs, tools: { weatherMs } }`, where `chunkMs` aborts when no chunk arrives for that long and a `<name>Ms` overrides `toolMs` for one tool; it lists no separate limit until the first chunk | A stalled call otherwise never ends |
| Concurrency | A cap on tool calls running at once; 1 runs the whole turn in the model's order. Reads side by side and writes in order still needs the queue below | Parallel writes race |
| Output | A token cap per reply, with room for thinking, which counts toward it; an agentic coding loop sets it to the model's maximum and streams | Bounded cost and length |
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
- **The approval policy is a function of the traits and the call,** returning one of: allowed, denied with a reason (the model reads it), or ask the user. It suits facts code can read from the input and the turn so far (a second irreversible action, the running spend, the fifth write); a question about meaning goes to a classifier. An error inside the policy, or an answer it doesn't recognise, denies. A tool the table doesn't know (an MCP or plugin tool discovered at runtime) asks the user. AI SDK 7 has the same three results built in, on `ToolLoopAgent`, `generateText` and `streamText`: `toolApproval: { weather: 'user-approval' }` for a tool that always asks, a function per tool that approves, denies or forwards to the user, or one catch-all function.
- **A dispatcher tool hides the real action.** A shell, a raw API passthrough, a generic "run action" or an MCP proxy makes per-tool approval see only "dispatch": parse its input into the action it performs (name and arguments) and apply that action's rule; deny what can't be reduced. The sandbox, not the approval, bounds what the action can then do.
- **Approvals are only as safe as the history they arrive in.** When the client sends the whole conversation back each turn, it can send a forged "approved" for a valid call. Keep the history on the server and accept decisions only for calls still pending, or sign each approval request (an HMAC over the tool name, call id and input, with a secret only the servers hold) and verify it when the decision returns. AI SDK 7 ships HMAC-signed tool approvals as an opt-in "to prevent forged approvals", and revalidates tool inputs and policies before a replay continues.
- **An approval reason is not a data channel:** a denial's reason reaches the model, an approval's usually does not. Input the agent needs from the user comes through a question tool.
- **System-started turns** (a reminder, a follow-up the app schedules) get read tools only.
- **A failed write with no known error code** reaches the model as "the outcome is unknown", so it never claims success.
- **Audit tools with data** before merging or removing one: production call counts per tool, which eval cases need it, which calls the baseline made. Keep the bar to add one high: each tool is "one more option to think about" (Claude Code keeps about 20 and keeps asking whether it needs them all).

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
- **"Try again"** is refused when the earlier answer acted: rerunning would act twice. An approval from an earlier answer never runs again on a replay; a continuation must answer the approval pending on the newest message.
- **A person who answers later** (a teammate's reply in another channel, hours after) needs a durable run: the turn waits on an event matched to its own id, with a timeout, and an expired wait comes back to the agent as "no reply", never as silence.
- **A denial reaches the model in words:** with the user's note, "call it again with this change, and the user approves again"; without one, "it did not happen; do not call it again unless asked".

### Launching with people approving every message

For a first week with real customers, hold everything the agent writes as a draft that staff send, edit (with an optional reason) or drop, and keep each decision:

- **Hold only the agent's own text** (replies, captions, messages to third parties, reminders it writes); fixed system cards (a paid receipt, a delivery card) still go out at once.
- **Draft states:** pending, sending, approved, edited, discarded, replaced by staff (staff typed their own reply instead, kept with what they wrote) and superseded (a newer customer message produced a newer draft).
- **A send the channel didn't confirm** keeps the draft waiting with the error; staff check the chat before sending again, and each approval attempt gets its own request key.
- **An inbox filter for waiting drafts,** since nothing alerts per draft, and a report: sent as written, edited, replaced, dropped, the median wait.
- **Turning the mode off** sends nothing already waiting.
- **The corrections become eval cases:** each edited or replaced reply is exported with the customer's messages, replayed through the real agent and judged against what staff sent. Read each one first; a reference judge is a model too.
- **Keep run logs longer for the pilot,** and write the removal steps when you build it: send sites back to direct sends, then data, then schema.

## More than one agent

One agent with good tools is the default; split only when the work has distinct stages or expertise, a part burns tokens exploring (research, a big codebase), or a part needs other permissions. The patterns for splitting work across agents are in [WORKFLOWS.md](WORKFLOWS.md).

- **Route in code where you can:** keep the workflow's progress as typed state that tools write (the plan, the classification, done), and let a function pick the next agent from it. Use a model to route only where the path is unclear, give that router a "finished" choice and a step cap, and check that the agent it names exists.
- **A subagent runs as a tool:** a fresh context with only what the task needs, the parent's abort signal, a final message that summarises everything it found. The page may show its full work; the parent model reads only the summary, and checks its evidence before accepting it. A rarely used capability (answering questions about the product's own docs) fits here too: in the prompt it adds context rot, loaded as docs it pulls large chunks in for a one-sentence answer, and a subagent searches in its own context and "hands back only the answer".
- **Pick each subagent's model** ([WORKFLOWS.md](WORKFLOWS.md#which-model-each-agent-uses)): a mid model fits a task with a clear spec and a way to check the result; the hardest long-horizon work goes to the top model.
- **No approval inside a subagent:** keep tools that need a click on the parent.
- **Never hand the same turn to the same specialist twice;** that is a loop. A handoff passes a trimmed history (no tool chatter, the last few messages) and the previous agent's results as a short note marked as data.

## After the answer

- **A stopped run skips the normal end:** save the partial answer, with its tool calls closed as "aborted", in the abort callback. A closed browser tab is not a stop: keep consuming the stream on the server so the answer finishes and is stored.
- **Follow-up suggestions** come from a short call of their own after the answer ends, inside a time budget; none when the answer asks the user something. Asked to write them itself, the agent left them out of 11 of 28 answers. Each is a short, specific next action on what was just shown ("compare with last month"), never a generic "tell me more".
- **A chat title** is written once an answer names what the user wants, and saved only while the chat has no name, so a name the user gave always wins.

## Long runs

An agent that works for minutes or hours (research, an import, a coding task) outlives a request and will meet a crash, a deploy or a timeout. One that runs on a schedule with nobody watching is in [SCHEDULED-AGENTS.md](SCHEDULED-AGENTS.md).

- **Run it as a durable workflow** (the `background-jobs` skill, DURABLE-WORKFLOWS.md): each model call and each tool call is a step, so a resumed run replays saved results instead of paying for them, or acting, twice. Side effects live inside steps and carry idempotency keys derived from the run and the call. The AI SDK's own way is `WorkflowAgent` (`@ai-sdk/workflow`): "durable, resumable agent execution that survives process restarts, deploys, interruptions, and delayed approvals", with tools, approvals, callbacks and typed runtime context for shared agent state.
- **Keep the run's context serialisable:** ids and settings, never clients or open connections; rebuild those inside each step. Derive anything long-lived (a sandbox, a working directory) from the run's id, and never tear it down at a step boundary.
- **Slice long loops:** one step per model turn, or a time slice per step (a few minutes), with the history saved after each, so no single step outlives its own timeout.
- **A deadline for the whole run** that holds across suspensions, plus a step budget; a run that hits either stops, reports what it finished and what is left.
- **Waits for a person are durable waits** keyed by the run, with a timeout and an explicit "no answer" branch ([Human in the loop](#human-in-the-loop)).
- **Stopping cancels future steps and undoes nothing:** say so in the UI, and list what already happened.
- **Progress:** frequent updates (tokens, "reading source 3 of 8") by plain publish; state changes (waiting for approval, done) from a step, once. The page reads the stored run state on reload, then resumes the stream.
- **Define done as saved results plus evidence:** the deliverable written where it belongs, a check of it (a claims table, test output, counts reconciled), and the open issues. A run that only says it finished hasn't proven it; check the evidence in code where you can. The task names its proof up front, in one message with the finish line and when to stop:
  ```
  Migrate the payment endpoints from the old client to the new one.
  Done means: every endpoint uses the new client, the old client is deleted, and the test suite passes.
  Stop and ask me only if a test fails for a reason you can't explain.
  ```
  The final report says what it did, what it found and what it needs from the person, the last part first ("End every run with three headings: Blocked on me, Changed, Found.").
- **A reviewer that returns evidence:** give a second agent read-only tools, the deliverable and its sources, and require a table (claim, verdict, source, correction; verdicts verified, incorrect, unresolved, with what evidence is missing). The main agent applies the corrections. When the author is an agent too, cap the rounds ([WORKFLOWS.md](WORKFLOWS.md#author-and-reviewer-loops)).
- **A progress record a new run can resume from:** task, outputs and their paths, finished stages and checks, decisions with their sources, open issues, and one concrete next action. Update it after each stage; a resumed run reads it first. A list in a file also survives compaction, which summarises older turns away: "Keep a checklist in TASKS.md. Tick each item when it's done, and add anything new you find."
- **One run per conversation or record at a time** (a per-key concurrency limit or singleton), and a per-tenant cap on runs at once.

## Observability

| Layer | What it holds |
|---|---|
| Metrics | Model calls, tokens (input, cached, output, reasoning), response time, time to first output and output tokens per second, tool calls and time, errors, check results: names, counts and timings, never conversation text. AI SDK 7 reports the per-step timings in `performance` (`responseTimeMs`, `timeToFirstOutputMs`, `outputTokensPerSecond`) |
| Traces with content | One trace per turn, each side call under it with its own name, personal data masked; content goes only here |
| Run records | One row per run: events (signals, gate reminders, retries, the route taken), usage, timings. In AI SDK 7 the hooks are `onStart`, `onStepEnd`, `onEnd` and `onToolExecutionEnd` (renamed from `experimental_onStart`, `onStepFinish`, `onFinish` and `experimental_onToolCallFinish`, per the v7 migration guide) |
| Run analysis | Classify each finished run (truncated, empty, too long, too many calls, unexplained tool errors); some classes stop the reply. Usage tells too: a low cached share points at a pause, a model switch, an MCP server connected midway or an effort change where effort is part of the cache match; much output on a small change, effort too high or retrying; total input many times the conversation's size, many turns, so read where the loop repeated |
| Alerts | A failed turn means someone got no reply: alert the team within minutes, throttled to one alert per window during an outage |
| Flushing | Flush traces before a serverless function returns; it ends abruptly |

- **Each span typed for what it is:** model calls as generations, a lookup as retrieval, a subagent as its own agent node under the step that called it, each subagent named after its task, never all called "assistant".
- **Set a span's input on purpose** (the user's message, the tool's arguments), not every argument of the wrapped function, which drags in clients, settings and keys.
- **Read a real trace after instrumenting:** run the path, fetch the trace, check that someone could see from it exactly what the agent knew at each decision, fix the gaps, repeat.
- **Mask every span attribute, not only the tracing SDK's own:** one SDK masked only its input, output and metadata fields, while the AI SDK wrote the prompt, messages and tool calls under its own attribute names, which went out unmasked (an eval's model calls carried a phone number). A span processor masks every string attribute before the exporter reads it. Write the phone pattern with each separator optional before a single digit, so it never backtracks, and find emails by scanning out from each `@`. Under AI SDK 7 this covers more than the calls you instrumented: once one integration is registered (`registerTelemetry(new OpenTelemetry())`, from `@ai-sdk/otel`), every AI SDK call emits telemetry by default; a call opts out with `isEnabled: false`, and registering no integration turns it off globally.
- **One subscription instead of callbacks:** AI SDK 7 also emits structured events on the Node.js tracing channel `ai:telemetry` (`tracingChannel(AI_SDK_TELEMETRY_TRACING_CHANNEL)` from `node:diagnostics_channel`) for `generateText`, `streamText`, model calls, tool executions, embeddings and reranking, so an instrumentation package subscribes once and keeps async context across streaming and tool calls.
- **Keep usage numbers visible through redaction:** a substring rule that hides anything named like "input" or "token" also hides `inputTokens` and `cacheReadTokens`; allowlist the numeric usage fields. In AI SDK 7 those are `usage.inputTokenDetails.cacheReadTokens` and `usage.outputTokenDetails.reasoningTokens`, and `result.usage` already sums every step (`finalStep.usage` is the last one), so adding step usages to it counts twice. Store request and response bodies only behind a debug flag; they dominate log storage and are rarely read. AI SDK 7 leaves them out of step results by default; `include: { requestBody: true, responseBody: true }` is that flag (`streamText` takes `requestBody` only).
- **Time journeys on the monotonic clock,** so a frozen date in the evals doesn't stop the stopwatch.
- **Count only crashes and unknown outcomes** toward a tool-error circuit breaker; a coded error with a next step is an answer the model acts on.
- **Mask after parsing:** a tracing SDK may hand the masking hook objects, not strings, so a mask that only matches strings lets phones and emails in tool inputs through; walk the parsed JSON.
- **Ask for an alias, log the answer:** a classifier on a "latest" model alias logs the version that actually answered, and its evals rerun when that version changes.
- **With provider storage off** (the privacy setting above, `store: false`), check that reasoning still carries across steps (the AI SDK's OpenAI provider adds the encrypted reasoning include itself) and that the cached share holds; put it on every call, the title and summary calls included.
- **Signals from users** (an edited draft, a retry, a thumbs down, a task finished) are scores named after what was observed (`draft_edited`), not the quality hoped for (`quality`).

## Building a new agent: the order

1. Entry, lease, one model call and one tool, end to end, with validated input and a trace. To try the agent before the chat page exists, AI SDK 7's `runAgentTUI({ agent })` (`@ai-sdk/tui`) runs it in the terminal with reasoning and tools.
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

## Prove it

- A per-request route override retains configured values outside its explicit overrides, including an enabled option that would otherwise revert to its default. [harness2, third_party/patches/workbuddy-bench-runtime.diff, `proxy/main.py`]
