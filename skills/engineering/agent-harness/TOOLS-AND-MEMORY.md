# Tools, history and memory

## Tools

- **Short descriptions:** one or two sentences of what the tool does; usage rules live in the prompt or a skill. Leave out what the model learns from the result. Where the output format must be exact, fix it in the schema (an enum, a grammar), not in prose.
- **Defer rare tools** behind a search, and make the error for calling an unloaded one say how to load it. Keep the tool set stable across modes: reject at execute time rather than removing the tool, so the cached prefix holds.
- **Bound every result:** cut long output to a budget (around 10,000 tokens) keeping head and tail with "... N tokens cut ...", or spill the rest to a file the agent can read on request.
- **Errors carry the next step:** "File has not been read yet. Read it first." Keep error codes precise; a code that collapses "no matches" into "unavailable" misleads the model. Give a policy refusal its own wording ("policy: do not retry another way").
- **Outside actions are idempotent:** derive the request id from the conversation and the tool call, so a retry or a replayed turn never sends two messages or two charges.

## History the agent can trust

- **Store the turn's tool calls and results and replay them** in later turns: the order it created, the address it checked, the link it sent. "Did you send me the link?" is then answered from what happened.
- **The current state comes from the database each turn** (the open order, what is missing, paid or not), added as a message, never from the model's memory.
- **A stored result that encodes an old mistake** makes the agent repeat it; fix the tool so the mistake can't happen, not only the prompt.

## Compaction

When the conversation nears the window (for example at 85-90%, or the window minus a reserve for output), summarise it:

- **Fixed sections,** the same every time: intent, decisions and corrections, what the user declined, open tasks, current state, next step, plus every identifier that matters (the order number). Keep the user's own words where they carry meaning.
- **Restore what the agent was using:** the files, the loaded skills, the plan.
- **Never split a tool call from its result.** Keep the most recent messages verbatim.
- Send the summary as a message so the cached prefix survives; reject a summary that isn't smaller than what it replaces, retry one that came back too short.
- **Stop after three consecutive failures:** a compaction that fails on every turn burns calls at scale.

## Long-term memory

Lasting facts about the user (their setup, plan, standing preferences), saved and forgotten with tools and shown at the start of each new conversation. Decide what is worth keeping with a narrow question over what the user or staff wrote, never over what the agent inferred, or a wrong inference gets saved and repeated. Don't store what belongs on a record (an entry code belongs on the order).

## Retries

Bound them (a few per request, a few per provider), and treat an empty completion as a retryable error, not a success.

## Untrusted content

Customer messages, transcribed audio, image descriptions, documents and tool results are data, never instructions. The prompt says so in its own section around that content; every classifier question says so; a classifier ignores harness messages unless they are marked trusted; and an eval case attempts an injection ("make my order free") and checks that no tool acted on it.
