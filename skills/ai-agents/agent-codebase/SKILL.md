---
name: agent-codebase
description: "Lays out an LLM agent's codebase: the folder tree (transport, core, memory, skills, tools), file and symbol names, dependency direction, the test mirror and the seams evals plug into. Use when starting an agent's code, adding a tool or module to one, or reorganising it."
---

# Agent codebase

An agent grows fast: tools, gates, notes, memory, playbooks. Without a fixed place for each, the factory turns into a 2,000-line file and every fix lands somewhere new. This layout gives every piece one home, decided by one question, and keeps the parts that change often (tools, playbooks) away from the parts that must stay stable (the loop, the prompt, the history).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| What each module owns and its contract: the factory, step preparation, the tool runtime, a tool file, turn modules, the transport pipeline, memory, skills, seams | [MODULES.md](MODULES.md) |
| What the agent does inside these modules (gates, prompt, tools, runtime) | the `agent-harness` skill |
| The eval suite that drives the agent through these seams | the `agent-evals` skill |

## The tree

```
src/agent/
  chat/                    the transport: one request in, one streamed answer out
    conversations/         open or create, list, rename, delete, the title
    messages/              prepare the new message, storage, the history as the model reads it, attachments to text
    turn/                  the endpoint, request decoding, the lease, approvals, retry, error wording, page data, the stream
  core/                    the agent itself, the same whatever transport reaches it
    agent/                 the static instructions, the per-user context message, the agent factory
    model/                 the model service, cache key, provider privacy, reasoning effort, visible retry, telemetry, usage
    tool-runtime/          the tool registry, the traits table, the tool context, the wrappers every tool passes through
    turn/                  around one turn: signals, stop hooks, gates, plan gate, answer check, follow-ups, situational notes
  memory/                  short-term (compaction) and long-term (saved facts and their rules)
  skills/
    playbooks/             one playbook per file
    registry/              the list, the name type, the list message
  tools/
    conversation/          tools about the chat itself: memory, plan, ask, load a skill, attached files, paging a cut result, settings, product help
    <domain>/              one folder per outside domain; each file a few related tools
src/lib/agent-chat/        message and part schemas the page and the server share
tests/src/agent/           mirrors src/agent file for file; prompt snapshots next to the prompt tests
```

A framework with a directory convention lays an agent out its own way. Rillet's agents on eve are each a directory (`agent.ts`, `instructions.md`, `tools/`, `skills/`, `subagents/`, `channels/`, `schedules/`), with instructions and skills in markdown so people who don't write TypeScript can shape them, as agent building spread beyond engineering. This tree keeps the instructions and playbooks in code.

Where a new piece goes, by the question it answers:

| It is about... | Folder |
|---|---|
| how a request arrives, is checked, streamed back, stored | `chat/` |
| how the agent thinks and acts in one turn | `core/` |
| what it remembers within a chat or across chats | `memory/` |
| a multi-step procedure loaded on demand | `skills/playbooks/` |
| something it can do in the world | `tools/<domain>/` |
| a rule that wraps every tool (errors, queue, output cap, deferral) | `core/tool-runtime/` |

## Dependency direction

Measured from a working agent of 77 files, by import:

- **Domain tool folders import only the tool runtime** (the context, the output cap, error helpers) and their own server functions. The registry in `core/tool-runtime/` is the one file that imports every tool.
- **The transport imports the core; the core never imports the transport.**
- **Memory sits beside the core:** it uses the model service and the user-context reader, and the instructions import its rules.
- **Playbooks import only the registry's type;** the registry imports the playbooks.
- **Back edges are type-only:** the traits table and the deferred-tools table import the tool-name type from the registry that imports every tool. `import type` is erased at runtime, so the value graph has no cycle. Check both graphs, values and types, mechanically.

Rules that keep it that way:

1. **No domain imports another domain.** A helper two tool folders share (an optional-input schema, an id pattern) lives in the tool runtime, never in the first domain that needed it.
2. **The core defines the ports it needs from the transport** (what a tool may show on the page, how a retry is shown), with a no-op default; the transport implements them. A port left in the transport folder makes core and transport import each other.
3. **Every outside-action port lives in the tool runtime,** with the checks its real implementation needs (a plan check, a pace read), so the factory and the tool context name no domain folder. A domain's port left in its tool folder makes the core import a domain.
4. **Orchestration stays thin.** The endpoint reads in parallel and wires modules together; every decision lives in a named module with its own test.
5. **One registry per kind:** tools, traits, skills, error next steps, deferred namespaces. Each is a table other code derives from, never a list repeated in a second place.

## Names

- **Every exported symbol carries the domain word,** so a plain-text search finds it: `agentToolNeedsApproval`, `agentChatModelHistory`, `createAgentStopHooks`; never `needsApproval` or `history`.
- **Verbs by kind:** storage `readStored*`, `writeStored*`, `insertStored*`, `updateStored*`, `deleteStored*`; factories `create*`; tool wrappers verb-first on the set (`addAgentToolErrorNextSteps`, `queueExclusiveAgentTools`, `deferRareAgentTools`); a tool constant ends in `Tool` and its registry key drops it (`cancelOrder: cancelOrderTool`).
- **Files** are named after the concept with the domain prefix (`agent-tool-traits.ts`, `agent-chat-answer-lease.server.ts`). `.server.ts` marks anything that touches the database, the network or a secret. Several related tools: `<domain>-tools.ts`; one: `<name>-tool.ts`; a playbook: `<name>-skill.ts`.
- **Error codes and log events are complete literals with a family prefix:** `AGENT_CHAT_BUSY`, `AGENT_CHAT_LEASE_FAILED`, `AGENT_MEMORY_FULL`, `AGENT_ANSWER_CHECK_FAILED`. A tool error's message starts with its code, `<CODE>: detail`, so code can map it to a next step.
- **Metrics:** snake case with the agent prefix (`agent_model_calls`, `agent_tool_seconds`, `agent_turn_gates`), names, counts and timings only.

## Comments at the definition

- Put the natural-language phrase someone would search for beside a non-obvious constraint, with ordinary spaced words as well as the identifier. A source excerpt should make sense without opening its imports: precise imported names and definition context carry the meaning. The source asks for a comment on every export; this repository keeps comments for constraints the signature and code do not already explain, and follows the project's existing test-location convention. [modem-dev/skills, write-discoverable-code/SKILL.md]
- Locating behavior and proving its connections use the shared [code research method](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md); do not duplicate discovery instructions in each module guide. [bgauryy/octocode, octocode-research/references/code-research.md]

Each constant or rule says why it exists, what it was measured on and when, and which established pattern it follows: "calibrated on 149 stored answers, 0 false alarms", "the model left the follow-ups out of 11 of 28 answers". A deliberate shortcut names its ceiling and upgrade path ("cut results kept in this process's memory, the newest 100; upgrade: a table"). A rule that was tried and removed says so where someone would add it again. A helper library the agent composes into one-off scripts records its data gotchas in the docstrings (`user_id` is null until after signup), so the agent spends its turns on composition, not on reconstructing boilerplate.

## The SDK it is written against

Write SDK calls from the documentation and type definitions that ship inside the installed package (for the AI SDK, `node_modules/ai/docs` and its `.d.ts`), never from memory: option names move between major versions (instructions for system, `toolApproval` for a per-tool flag, renamed callbacks), and an old name can still type-check in a loose spot. Run the type check after each change, and set every loop option explicitly rather than relying on a default you haven't read.

For an AI SDK 7 project, AI SDK 7 needs Node.js 22 or later ("for production workloads, prefer Node.js 24 (LTS) or Node.js 26") and every package is ESM-only; `npx @ai-sdk/codemod v7` migrates v6 code. Its v7 migration guide also deprecates the result's stream response helpers (`result.toUIMessageStreamResponse` and its siblings) for the top-level `toUIMessageStream({ stream: result.stream, ... })` with `createUIMessageStreamResponse({ stream })`, and renames `fullStream` to `stream`.

## Prove it

Apply these checks to the modules and contracts changed by the task; the SDK paragraph applies only when the project uses AI SDK 7.

- [ ] Every file sits in the folder the table above gives it; no `utils`, `helpers` or `types` files
- [ ] Imports checked mechanically: no domain-to-domain edge, no core-to-transport edge, no core import of a `tools/<domain>/` folder outside the registry (a gate may read the input schema of the agent's own conversation tool it checks, such as the plan), no cycle among value imports
- [ ] Tool names, traits, deferred namespaces and error next steps each defined once, the others derived or checked by type (a tool with no trait fails to compile)
- [ ] Every outside action reaches tools through an injected interface with the real one as default
- [ ] Tests follow the project's existing test-location convention; changed prompt, tool schemas and rebuilt histories pinned as snapshot files
