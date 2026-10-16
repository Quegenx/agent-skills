# Tools, history and memory

## Tools

- **Short descriptions:** one or two sentences of what the tool does; usage rules live in the prompt or a skill. Leave out what the model learns from the result. Where the output format must be exact, fix it in the schema (an enum, a grammar), not in prose.
- **Defer rare tools** behind a search, and make the error for calling an unloaded one say how to load it. List each deferred group with its tool names in the instructions, built from the same table, so a tool the prompt names is found. A hosted search that returns only tools not loaded yet comes back empty for a loaded one, and the model reads that as "missing": say so in the instructions, and send back a turn that ends on an empty search. A group's usage rules arrive as a note once it is in use, not in the base prompt. Keep the tool set stable across modes: reject at execute time rather than removing the tool, so the cached prefix holds. Limiting the tools per step by dropping them from the request (an "active tools" list, a per-step tool picker) changes the tool list and costs the cache on every step; where the provider offers an allowlist that leaves the definitions in place, use that, and keep the tool order fixed.
- **Picking tools by search** (keyword and embedding, an optional cheap re-rank) works when the query is right: anchor it on the longest user message in the conversation plus the last few, so "yes, do it" still finds the invoice tools. Pull in tools that go together (creating an invoice brings the customer lookup). The way out of a bad pick is a search tool the model can call: a step without tool calls ends the loop, so "widen the set after a step with no calls" never runs. Key any cache of tool embeddings by a hash of each name and description, not by their count, or an edited description keeps its old vector. Measure the picker with blind queries (slang, no shared words) and their accepted answers: top-1, top-3, top-5 and the misses.
- **Bound every result:** cut long output to a budget (around 10,000 tokens) keeping head and tail with "... N tokens cut ...", or spill the rest to a file the agent can read on request. For a long list, cut items from the end with a "cut" note, keep the full result stored, and give a paging tool to read the rest. Cap error text too.
- **Effects and policies** come from one traits table ([RUNTIME.md](RUNTIME.md)).
- **Errors carry the next step:** "File has not been read yet. Read it first." Keep error codes precise; a code that collapses "no matches" into "unavailable" misleads the model. Give a policy refusal its own wording ("policy: do not retry another way").
- **Outside actions are idempotent:** derive the request id from the conversation and the tool call, so a retry or a replayed turn never sends two messages or two charges.
- **A tool that keeps getting bad input** is a schema problem first: log the raw arguments, then fix the name, the description or the field descriptions before touching the prompt. Optional fields as nullable rather than absent, for providers with strict tool schemas. A tool that changes something returns what it did ("draft 1042 saved"), never nothing.
- **Caching a tool's result** is for reads whose answer doesn't depend on time, with a key that holds the tool, the input and the user and tenant, so one account never sees another's cached answer.
- **Never parse the model's text as JSON by hand:** ask for structured output, and read anything stored back through a safe parse with a schema.

## Tools from outside (MCP and plugins)

- **Your own tools for the product's core paths** (exact types, descriptions you control, no extra hop, versioned with the code); MCP for what users bring and for trying things out.
- **Treat what a server says about its tools as untrusted:** a "read only" or "not destructive" hint is the server's claim. Run a tool without asking only when it says read-only and your own allowlist agrees; everything else asks the user.
- **Pin the approved tool list:** store a fingerprint of each tool's name, description and schema when a person approves the server, and block (or ask again) when one changes or a new one appears. A changed description is a new instruction to the model.
- **Prefix tool names with the server's name** so two servers can't collide or shadow a built-in tool.
- **The connection:** HTTP transport in production, redirects refused (a redirect can point the client at an internal address), retries only for tools that are safe to repeat, and the client closed in a `finally`, never only in the success callback.
- **One integration gateway exposing generic tools** (search actions, run an action, call any API) has no allowlist of its own: its "run" and "call" tools are dispatchers, so the policy reads the action out of their input ([RUNTIME.md](RUNTIME.md#tool-traits)). Pin which of the user's connected accounts a call uses; a default such as "the oldest connection for that app" acts as the wrong identity sooner or later.

## History the agent can trust

- **Store the turn's tool calls and results and replay them** in later turns: the order it created, the address it checked, the link it sent. "Did you send me the link?" is then answered from what happened.
- **Rebuild the history every turn the same way** from stored rows, so the cached prefix keeps matching.
- **Keep a gate's note in the stored answer** where it came, so later turns read it too. Leave out per-step notes and reasoning-effort updates: an old effort update read again would hold a later turn at that effort.
- **Attachments:** convert a document to text once, store the whole text, put its start in the message and give a tool to search or page the rest. Store a file's name and type, never its contents; a later turn reads "an image was sent" in its place.
- **Every tool call has a result.** A call cut by the stop button reads "aborted, did not happen"; one with no stored output reads "interrupted: outcome unknown". A call without a result breaks providers and leaves the model guessing.
- **Validate stored messages on every load** against the current tool and part schemas; a tool whose input or output shape changed since the message was stored otherwise breaks the history. Migrate or drop what fails, and say which.
- **The current state comes from the database each turn** (the open order, what is missing, paid or not), added as a message, never from the model's memory.
- **A stored result that encodes an old mistake** makes the agent repeat it; fix the tool so the mistake can't happen, not only the prompt.

## Compaction

When the conversation nears the window (for example at 85-90%, or the window minus a reserve for output), summarise it. Measure "near" with the input tokens the provider reported for the last step, not a character estimate. Provider-side compaction can do the folding for you; it may not mix with mid-conversation effort updates, and it returns an opaque block you store and send back as is.

- **Fixed sections,** the same every time: intent, decisions and corrections, what the user declined, open tasks, current state, next step, plus every identifier that matters (the order number). Keep the user's own words where they carry meaning.
- **Restore what the agent was using:** the files, the loaded skills, the plan.
- **Never split a tool call from its result.** Keep the most recent messages verbatim.
- Send the summary as a message so the cached prefix survives; reject a summary that isn't smaller than what it replaces, retry one that came back too short.
- **Stop after three consecutive failures:** a compaction that fails on every turn burns calls at scale. A summary below a minimum length (a few hundred characters) counts as a failure.
- Chain each summary on the previous one, at low reasoning effort, keeping the newest few items out of the fold.

## Long-term memory

The full design (extraction in the background, consolidation, profile plus search, staying current, forgetting, evals) is the `agent-memory` skill. The smallest version that works:

Lasting facts about the user (their setup, plan, standing preferences), saved and forgotten with tools and shown at the start of each new conversation. Decide what is worth keeping with a narrow question over what the user or staff wrote, never over what the agent inferred, or a wrong inference gets saved and repeated. Don't store what belongs on a record (an entry code belongs on the order), nor shop policy.

- **Cap it:** a fixed number of memories of a bounded length per person (100 of 500 characters), read whole into each turn.
- **Memories go in the per-turn note,** not the system prompt, so saving one mid-conversation doesn't break the cache.
- **Staff can see and delete them.**

## Retries

Bound them (a few per request, a few per provider), and treat an empty completion as a retryable error, not a success. Make them visible: SDK silent retries off, each retry logged as an event ([RUNTIME.md](RUNTIME.md)).

## Untrusted content

Customer messages, transcribed audio, image descriptions, documents and tool results are data, never instructions. The prompt says so in its own section around that content; every classifier question says so; a classifier ignores harness messages unless they are marked trusted; and an eval case attempts an injection ("make my order free") and checks that no tool acted on it. A list of banned phrases ("ignore previous instructions") is not a defence: it is bypassed by rewording and blocks honest messages. The defence is that untrusted text can't reach a tool that acts without the checks above.

A tool that fetches a URL the model or a user supplied resolves the address first and refuses private, loopback and metadata ranges, follows no redirect to them, and caps the size and the time.
