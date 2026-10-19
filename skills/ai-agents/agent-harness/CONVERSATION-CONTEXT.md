# Conversation context

Stored conversation history, replay and compaction within one conversation. Long-term memory across conversations is in [agent-memory](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-memory/SKILL.md).

## History the agent can trust

- **Store the turn's tool calls and results and replay them** in later turns: the order it created, the address it checked, the link it sent. "Did you send me the link?" is then answered from what happened.
- **Read history in pages.** A list API's row cap (PostgREST returns 1,000 rows by default) cuts a long conversation silently; page with a stable order for both the screen and the model.
- **Rebuild the history every turn the same way** from stored rows, so the cached prefix keeps matching.
- **Keep a gate's note in the stored answer** where it came, so later turns read it too. Leave out per-step notes and reasoning-effort updates: an old effort update read again would hold a later turn at that effort.
- **Attachments:** convert a document to text once, store the whole text, put its start in the message and give a tool to search or page the rest. Store a file's name and type, never its contents; a later turn reads "an image was sent" in its place. Sending a file to the provider is a separate matter: inline, a multi-step run sends the bytes on every call, so AI SDK 7's `uploadFile` uploads it once to a provider with a file endpoint and later calls pass the returned `providerReference` (`{ type: 'file', mediaType: 'image', data: providerReference }`).
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

For extraction, profile and search, staying current, forgetting and memory evals, use [agent-memory](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-memory/SKILL.md). Its [minimal store](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-memory/READ.md#a-minimal-store) keeps the bounded first version.

## Prove it

- Every tool call has a result, and stored messages are validated against the current tool and part schemas.
- Compaction keeps tool-call/result and reply/message pairs together and restores the files, skills and plan the agent was using.
- A summary smaller than what it replaces is stored as a message, with fixed sections and a stop after three consecutive compaction failures.
