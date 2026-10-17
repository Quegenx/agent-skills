# What each module owns

## The agent factory (`core/agent/`)

Built **per request**, never shared: one function takes everything the turn needs and returns the loop.

- **Input:** the conversation id, the user id, the model, a database client scoped to the signed-in user, their settings, the locale, the turn signals, trace integrations, and every outside action as an optional interface (the real one by default, fixed answers in evals).
- **It builds the tool context once** (ids, client, settings, actions, page data) and hands the same object to every tool. Where the SDK separates them, keep two kinds apart: run-wide state every hook may read (request id, flags) and per-tool context validated by each tool's own schema (its client, its secrets), so a tool receives only what it declares (in AI SDK 7, `runtimeContext`, and each tool's `contextSchema` with its entry in `toolsContext`, which is required once one tool declares a schema; step preparation can return an updated `runtimeContext`). Neither belongs in telemetry unless a field is allowlisted, and a context validation error the model sees says only that the call could not run.
- **It composes the tool wrappers in one line,** innermost first: errors explained, then exclusive tools queued, then rare tools deferred.
- **It sets the loop:** the step limit, the stop conditions (a question card ends the turn), approval from the traits table, step preparation, provider options (base effort, cache key, privacy), telemetry with a function id. AI SDK 7 also has a top-level `reasoning` option; when both are set, the provider options win and "can silently bypass" it, so the v7 migration guide says to remove the overlapping reasoning settings from the provider options.

**The message type comes from the agent:** derive the UI message type from the built agent (its tools give every tool part its exact input and output), and let the page, the storage and the history builder share that one type. A tool's own part type is exported beside the tool, so a UI component imports the type and never the tool.

**Model names live in one place:** the model service maps the agent's roles (the main model, the fast side-call model, the summariser) to provider model ids and their default settings, so changing a model is one edit and evals pin the same table.

Next to it: **the static instructions** as tagged sections, the same for every user (only a session-wide choice such as the locale varies), and **the user context** builder (settings, missing profile details, memories) that becomes a message, never part of the instructions.

## Step preparation

One exported function per agent decides each step's messages and tool choice; the factory only calls it. It appends notes, never edits the instructions:

- the turn signals' hints, on the first step after the user's message;
- situational rules for tool groups in use, once per turn;
- the repeated-call reminder;
- the last-step note, with tools off;
- a reasoning-effort update when the work calls for more.

Each note comes from its own module; step preparation only orders them.

In AI SDK 7 what step preparation returns carries forward: returned instructions stay until another override, and returned messages become the base of later steps (in v6 both lasted one step). A one-step note (the repeated-call reminder, the last-step note) is dropped by rebuilding the next step from `[...initialMessages, ...responseMessages]`, or it repeats on every later step.

## The tool runtime (`core/tool-runtime/`)

| File | Owns |
|---|---|
| the registry | the object of every tool; the tool-name type is `keyof typeof` it |
| traits | each tool's effect, `satisfies Record<ToolName, Effect>`, and every policy derived from it (approval, runs alone, may be retried, needs the answer check, only shows) |
| context | the context schema every tool receives, and the outside-action interfaces with their real implementations |
| patch | the one helper that copies a tool set with fields replaced, keeping its type |
| error next step | the code-to-next-step table, error text capping, "outcome unknown" for a failed change |
| exclusive runner | the queue for tools that must run alone |
| output | the cap on what the model reads, cutting the longest list and keeping the rest for a paging tool |
| search | the deferred namespaces, their instruction line built from the same table |

```ts
import type { Tool, ToolSet } from "ai";

export const agentTools = { listOrders: listOrdersTool, cancelOrder: cancelOrderTool };
export type AgentToolName = keyof typeof agentTools;

type AgentToolEffect = "read" | "ui" | "write" | "approval";

// A tool added to the registry without a trait fails to compile.
const agentToolEffects = {
  listOrders: "read",
  cancelOrder: "approval",
} as const satisfies Record<AgentToolName, AgentToolEffect>;

const agentToolEffectsByName: ReadonlyMap<string, AgentToolEffect> = new Map(Object.entries(agentToolEffects));
// A stored call to a tool removed since counts as the riskiest kind.
export const agentToolEffect = (name: string): AgentToolEffect => agentToolEffectsByName.get(name) ?? "approval";

/** A copy of the tools with some fields replaced, keeping the set's own type (mapping Object.entries loses it). */
export const patchAgentTools = <TOOLS extends ToolSet>(
  tools: TOOLS,
  patch: (name: string, tool: Tool) => Partial<Tool> | undefined,
): TOOLS => {
  const patched = { ...tools };
  for (const name of Object.keys(patched)) {
    const fields = patch(name, patched[name]);
    if (fields !== undefined) Object.assign(patched, { [name]: { ...patched[name], ...fields } });
  }
  return patched;
};

// In the factory: tools: deferRareAgentTools(queueExclusiveAgentTools(addAgentToolErrorNextSteps(agentTools)))
```

Every wrapper patches only `execute` or `providerOptions` through `patchAgentTools`, so stop conditions and stored messages keep the tools' exact types. A wrapper that awaits `execute` must not wrap a tool that streams its result.

## A tool file (`tools/<domain>/`)

A tool is a description, an input schema, the context schema, an `execute` and, when the model should see less than the page, a `toModelOutput`:

- **`execute` runs one program** with the call's abort signal and the user-scoped client from the context; it writes through the same storage functions as the product's own pages, so the agent and the UI never disagree.
- **Refusals are typed errors** whose message is `<CODE>: detail` and names what to do ("save these groups first, then try again").
- **Two views of one result:** the page gets the full records (cards, photos, progress) through page data or transient parts; the model gets a short shape without photo links and with long text cut. Place `toModelOutput` after `execute` in the object, since the output type is inferred left to right.
- **Bound cost in the schema:** max items per call for paid or paced reads (five creatives, twenty listings), so one call can't spend a day's budget.
- **Inputs the model leaves out arrive as null as often as missing:** accept both. A tool with no input takes an empty record, not an empty struct, so its JSON Schema is still `type: "object"`.
- **Interleave per-source results** before the output cap, so the cap trims every source alike instead of dropping the last.

## Turn modules (`core/turn/`)

- **The stop hooks factory** is made per request and keeps its counters in a closure (empty replies, plan reminders, each gate's "already fired", the answer check's once). It returns one function: the turn's steps and messages in, a note or null out.
- **Each gate is two exports:** a pure detector over steps or messages, and its note. No model call, no I/O, so each has a unit test with the real failing turn and a correct neighbour.
- **The answer check** takes its classifier runner as a parameter; with none (unit tests) nothing is checked.
- **Side calls** (turn signals, follow-up questions) each live in their own file with a time budget, a kill switch read per request, and a fallback that leaves the turn as it would be without them.

## The transport pipeline (`chat/turn/`)

The endpoint is one function that runs these in order and holds no logic of its own:

1. Origin and content-type checks; sign-in; the body read with a byte cap and decoded with a schema; the body's user must be the session's.
2. Open or create the conversation (one read when it exists); take the lease.
3. Read in parallel: history, whether the message id is already stored, settings, memories.
4. Prepare the messages: a retry (only the last user message, refused when the answer after it acted), approval decisions (applied only to parts still pending), or a new message (decoded parts only, the server's time).
5. Attach the user context when it changed; then in parallel: compaction, saving the user's message, the turn signals.
6. Build the agent, stream the turn with the stop hooks, save the answer and its usage when it ends (in AI SDK 7, `result.usage` is the total of every step).
7. Release the lease and flush telemetry, whatever happened.

The **history builder** is a pure function of the stored messages: same input, same bytes, so the provider's cache keeps matching.

## Memory (`memory/`)

- **Short-term** returns exactly the messages the model reads: the stored summary, the user context that held when the fold happened, playbooks loaded only in the folded part, then the recent messages.
- **Long-term** holds the storage functions and the rules text the instructions import, so when to remember and how it is stored change together. Background extraction and consolidation live here too, started by a job after the turn ends, never from the reply path (the `agent-memory` skill).

## Skills (`skills/`)

A playbook is an object `{ name, description, content } as const satisfies AgentSkill`, one per file. The registry lists them `as const`, derives the name type, and the loader tool's input is a literal union of those names, so a misspelt skill fails at the schema. The list reaches the model as one fixed message ahead of the conversation, so it stays in the cached start.

## Seams for tests and evals

- **Outside actions as interfaces typed from the real functions** (`(...args: Parameters<typeof fn>) => ReturnType<typeof fn>`), the real ones by default, fixed answers in evals. No eval-only branch inside a tool.
- **Optional services read as optional:** a classifier client absent from the runtime means the feature is off, which is how unit tests run.
- **Page data** has a no-op default; evals pass it, the endpoint passes the stream writer.
- **Kill switches** are environment values read per request, so they turn a feature off without a deploy.

## Tests (`tests/src/agent/`)

The tree mirrors `src/agent/`, one test file per source file it covers. Beside the prompt test sit the snapshot files: the instructions, the tool schemas as JSON, the user context, and histories rebuilt after a denial, a stop and a summary. They change only on purpose, and every change to what the model sees shows up in review.
