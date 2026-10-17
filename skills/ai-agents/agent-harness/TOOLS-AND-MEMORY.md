# Tools, history and memory

## Tools

- **Short descriptions:** one or two sentences of what the tool does, and its usage rules in the tool description rather than the system prompt, not repeated in both. Leave out what the model learns from the result. Where the output format must be exact, fix it in the schema (an enum, a grammar), not in prose.
- **Design the parameters, not examples:** with newer models "giving examples actually constrains them to a certain exploration space". A task-list tool went from about 9,100 characters of when-to-use lists and worked examples to "Create and update a task list for the current session", a status enum of `pending`, `in_progress` and `completed`, and one rule: only one task `in_progress` at a time. The enum hints how to use it; the one rule defines the behaviour.
- **Let the agent find its own context:** "The most consequential tools we've built are the ones that let Claude find its own context." Claude Code first handed the model snippets retrieved from a pre-built vector index before each response; fast, but it needed indexing and setup, was fragile across environments, and the model was given context instead of finding it. A grep tool let it search and build its context itself.
- **Defer rare tools** behind a search, and make the error for calling an unloaded one say how to load it. List each deferred group with its tool names in the instructions, built from the same table, so a tool the prompt names is found. A hosted search that returns only tools not loaded yet comes back empty for a loaded one, and the model reads that as "missing": say so in the instructions, and send back a turn that ends on an empty search. A group's usage rules arrive as a note once it is in use, not in the base prompt. Keep the tool set stable across modes: reject at execute time rather than removing the tool, so the cached prefix holds. Limiting the tools per step by dropping them from the request (an "active tools" list, a per-step tool picker) changes the tool list and costs the cache on every step; where the provider offers an allowlist that leaves the definitions in place, use that, and keep the tool order fixed.
- **Picking tools by search** (keyword and embedding, an optional cheap re-rank) works when the query is right: anchor it on the longest user message in the conversation plus the last few, so "yes, do it" still finds the invoice tools. Pull in tools that go together (creating an invoice brings the customer lookup). The way out of a bad pick is a search tool the model can call: a step without tool calls ends the loop, so "widen the set after a step with no calls" never runs. Key any cache of tool embeddings by a hash of each name and description, not by their count, or an edited description keeps its old vector. Measure the picker with blind queries (slang, no shared words) and their accepted answers: top-1, top-3, top-5 and the misses.
- **Bound every result:** cut long output to a budget (around 10,000 tokens) keeping head and tail with "... N tokens cut ...", or spill the rest to a file the agent can read on request. For a long list, cut items from the end with a "cut" note, keep the full result stored, and give a paging tool to read the rest, with one prompt line that a result with a cut note is read to its end before answering about the whole of it (without that line the model ignored the note in 3 of 3 runs and named the first listing, not the cheapest). Cap error text too (around 4,000 characters).
- **Cut a JSON result by its longest list,** halving to find the most items that fit, and keep every other field (`hasMore`, `nextOffset`), so the result stays whole JSON and the paging fields survive; only a result with no list is cut as text.
- **The model's view drops what only the screen uses:** photo links the chat's cards show crowded listings out (the cap fit about 20 of 24 with them), so the tool's model output leaves them out and the UI still gets the full result.
- **A tool name the table doesn't know** (removed since the message was stored) is treated as the riskiest effect.
- **Effects and policies** come from one traits table ([RUNTIME.md](RUNTIME.md)).
- **Keep the tool's own error text in the history.** In the AI SDK, a failed tool call's saved error text is built by the same `onError` that handles a failed answer, so every tool failure was stored as the user-facing "something went wrong" and later turns lost the real reason (`SITE_CHECK_PENDING`). Rethrow tool failures as your own error type with the next step added, and have `onError` keep that type's text as it is; only the answer's own failures get the generic message.
- **Errors carry the next step:** "File has not been read yet. Read it first." Keep error codes precise; a code that collapses "no matches" into "unavailable" misleads the model. Give a policy refusal its own wording ("policy: do not retry another way").
- **Outside actions are idempotent:** derive the request id from the conversation and the tool call, so a retry or a replayed turn never sends two messages or two charges.
- **A tool that keeps getting bad input** is a schema problem first: log the raw arguments, then fix the name, the description or the field descriptions before touching the prompt. Optional fields as nullable rather than absent, for providers with strict tool schemas; strict tool use needs `additionalProperties: false` on every object. A tool that changes something returns what it did ("draft 1042 saved"), never nothing.
- **Answer a read once per turn:** a memo shared by every call of the turn returns the first result of a catalogue or zones read; a turn sends its product photos once.
- **Reads always called together become one,** and the turn's preload calls the same function the tool does, so both return the same read. A failed preload drops only that entry; the model calls the tool instead.
- **Inputs as models write them:** a nullable text field also takes "", "null" and "undefined" as null; a tool with no input still needs an object schema (`type: "object"`), which an empty struct's schema isn't, or the provider rejects the tool.
- **Error codes checked by the type system:** each tool family's error type takes only codes that have a next step in the table, so a code without one doesn't compile.
- **Show the model what it should copy:** a customer's Latin profile name goes to the model transliterated (or empty when that fails), so the agent never echoes letters the shop wouldn't write.
- **Caching a tool's result** is for reads whose answer doesn't depend on time, with a key that holds the tool, the input and the user and tenant, so one account never sees another's cached answer.
- **Never parse the model's text as JSON by hand:** ask for structured output, and read anything stored back through a safe parse with a schema. A structure parsed out of prose is no better: questions asked as bullets with options in brackets, parsed into a UI, came back with extra sentences appended, options dropped or the structure abandoned. A question tool fixed it.
- **Read the response by content block type:** a reasoning model's response can begin with a `thinking` block, "and code that reads `content[0].text` breaks."
  ```python
  for block in response.content:
      if block.type == "text":
          print(block.text)
  ```

## Tools from outside (MCP and plugins)

Acting through a user's connected accounts (their mailbox, their CRM): scoped sessions, approvals by effect, connecting mid-chat and error wording are in the `third-party-integrations` skill, AGENT-ACCESS.md.


- **Your own tools for the product's core paths** (exact types, descriptions you control, no extra hop, versioned with the code); MCP for what users bring and for trying things out.
- **Treat what a server says about its tools as untrusted:** a "read only" or "not destructive" hint is the server's claim. Run a tool without asking only when it says read-only and your own allowlist agrees; everything else asks the user.
- **Pin the approved tool list:** store a fingerprint of each tool's name, description and schema when a person approves the server, and block (or ask again) when one changes or a new one appears. A changed description is a new instruction to the model.
- **Prefix tool names with the server's name** so two servers can't collide or shadow a built-in tool.
- **The connection:** HTTP transport in production, redirects refused (a redirect can point the client at an internal address), retries only for tools that are safe to repeat, and the client closed in a `finally`, never only in the success callback.
- **One integration gateway exposing generic tools** (search actions, run an action, call any API) has no allowlist of its own: its "run" and "call" tools are dispatchers, so the policy reads the action out of their input ([RUNTIME.md](RUNTIME.md#tool-traits)). Pin which of the user's connected accounts a call uses; a default such as "the oldest connection for that app" acts as the wrong identity sooner or later.

## History the agent can trust

- **Store the turn's tool calls and results and replay them** in later turns: the order it created, the address it checked, the link it sent. "Did you send me the link?" is then answered from what happened.
- **Read history in pages.** A list API's row cap (PostgREST returns 1,000 rows by default) cuts a long conversation silently; page with a stable order for both the screen and the model.
- **Rebuild the history every turn the same way** from stored rows, so the cached prefix keeps matching.
- **Keep a gate's note in the stored answer** where it came, so later turns read it too. Leave out per-step notes and reasoning-effort updates: an old effort update read again would hold a later turn at that effort.
- **Attachments:** convert a document to text once, store the whole text, put its start in the message and give a tool to search or page the rest. Store a file's name and type, never its contents; a later turn reads "an image was sent" in its place.
- **Every tool call has a result.** A call cut by the stop button reads "aborted, did not happen"; one with no stored output reads "interrupted: outcome unknown". A call without a result breaks providers and leaves the model guessing.
- **Store only what a replay needs:** a turn's tool calls and results, with only the provider fields the replay reads. With provider storage off, those are the hosted tool search's item id (without it the call and its result replay under one id) and a deferred tool's namespace; replay the hosted search's call and result both, so the tools it loaded stay loaded. Thinking blocks go back unchanged with the rest of the assistant turn they came in, the progress updates written between tool calls included. They are tied to the model and the conversation: another model may not read them, so a conversation switched to a new model can lose its reasoning.
- **Validate stored messages on every load** against the current tool and part schemas; a tool whose input or output shape changed since the message was stored otherwise breaks the history. Migrate or drop what fails, and say which.
- **The current state comes from the database each turn** (the open order, what is missing, paid or not), added as a message, never from the model's memory.
- **A stored result that encodes an old mistake** makes the agent repeat it; fix the tool so the mistake can't happen, not only the prompt.

## Compaction

When the conversation nears the window (for example at 85-90%, or the window minus a reserve for output), summarise it. Measure "near" with the input tokens the provider reported for the last step, not a character estimate. Provider-side compaction can do the folding for you; it may not mix with mid-conversation effort updates, and it returns an opaque block you store and send back as is.

- **Fixed sections,** the same every time: intent, decisions and corrections, what the user declined, open tasks, current state, next step, plus every identifier that matters (the order number). Keep the user's own words where they carry meaning.
- **Restore what the agent was using:** the files, the loaded skills, the plan.
- **Never split a tool call from its result,** nor a reply from the message it answers: fold at a user message, before everything at that moment. Keep the most recent messages verbatim.
- **Word the summary message the same until the next fold,** so the cache keeps matching; a playbook loaded before the fold is not re-attached, so the instructions say to load it again when its text is gone.
- Send the summary as a message so the cached prefix survives; reject a summary that isn't smaller than what it replaces, retry one that came back too short.
- **Stop after three consecutive failures:** a compaction that fails on every turn burns calls at scale. A summary below a minimum length (a few hundred characters) counts as a failure.
- Chain each summary on the previous one, at low reasoning effort, keeping the newest few items out of the fold.
- **Compact when it pays, and while the cache is warm:** a compaction pays for the read, a summary of a few thousand output tokens and a new cache write (about $0.25 at 150K tokens on one model), then saves on every later turn's read, paying for itself within about ten turns. "A compaction just before you finish costs more than it saves." After a pause longer than the cache lifetime, the summary request reads the whole conversation again and writes it back to the cache.

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

**An agent that runs code in a sandbox never holds the real credentials.** In Claude Code's cloud sessions the GitHub token never enters the VM: "A proxy holds it, and the session gets a short-lived credential that can push only to its own working branch." API keys attach to requests for the hosts you name outside the VM, "so the key never sits in a variable"; network access is a level (none, trusted package registries and hosts, a custom list, full), and "All outbound traffic passes through a proxy that logs hostnames." Even with the network at none, the model API is still a way out: "data can leave the VM that way".
