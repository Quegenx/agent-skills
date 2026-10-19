---
name: agent-harness
description: "Builds reliable LLM agents: rule placement, prompts, gates, tools, history, runtime, measured context reductions and harness refinement for product agents. Use when building or fixing an application's agent, its system prompt or tools, or refining its production harness."
---

# Agent harness

A model is a probability, not code: the same conversation can go another way on the next run, and a rule it must remember to follow, it will sometimes forget. The harness is everything around the model that makes the critical path near-certain anyway: code that checks the facts that matter, context that arrives only when it applies, tools that refuse the wrong state, and a history the agent can trust. 100% is not reachable with a model; near 100% on the path that costs money or trust is, by backing each rule there with code.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The system prompt: measuring what is really sent, a stable cached prefix, reminders, skills and their routing, changing a prompt, writing for the model that reads it | [PROMPT.md](PROMPT.md) |
| Code that backs the rules: gates on the finished reply, tools that refuse, the reply check, sanitizers that rewrite or drop an answer, a version-gated citation allow-list, already-on project facts, verbatim printing, the renderer as the last check, authorization classifiers, loop breakers | [CHECKS.md](CHECKS.md) |
| Tools, tool search, outside MCP tools, contracts, exact cleanup ownership, cancellation and untrusted content | [TOOLS.md](TOOLS.md) |
| Stored conversation history, tool-call replay, compaction and the long-term-memory boundary | [CONVERSATION-CONTEXT.md](CONVERSATION-CONTEXT.md) |
| The runtime: one answer at a time, loop settings, tool traits and approval policy, stop hook order, human in the loop, more than one agent, long runs, observability, the build order | [RUNTIME.md](RUNTIME.md) |
| Multi-agent workflows: why one context fails, fan-out and its contract (evidence before the spawn, the brief as the whole prompt, a join key with coverage enforced, abstaining as an answer), adversarial verification, tournaments, loop until done, quarantine triage, author and reviewer loops with a round cap, which model each subagent uses | [WORKFLOWS.md](WORKFLOWS.md) |
| Scheduled and background agents: bookmarks per source, a failed read that isn't a quiet day, re-check before posting, post once, read-only preferences and a ledger, scoped credentials, a spending cap from real runs | [SCHEDULED-AGENTS.md](SCHEDULED-AGENTS.md) |
| Researching source: exact anchors, evidence lanes, negative-proof limits and localization returns | [code-research](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SKILL.md) |
| Context reductions: measured units, recoverable originals, recall overhead, controlled comparisons, cost per accepted loop result and honest savings claims | [CONTEXT-COSTS.md](CONTEXT-COSTS.md) |
| Refining the harness itself: observed divergences, scoped proposals, execution probes, parallel or sequential composition, supported lessons and experiment resume | [HARNESS-REFINEMENT.md](HARNESS-REFINEMENT.md) |
| Executing or resuming a selected plan: shared interfaces, durable progress and phase handoff | [engineering-planning EXECUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/EXECUTION.md) |
| Configure a coding-agent host or diagnose its recorded session | [coding-agent-harness](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/coding-agent-harness/SKILL.md) |
| Where each of these lives in the code: folders, names, dependency direction | the `agent-codebase` skill |
| Long-term memory across conversations: extraction, profile and search, staying current, forgetting | the `agent-memory` skill |
| Measuring it: the eval suite and the loop that takes it to a clean run | the `agent-evals` skill |
| The chat interface the user sees: status line, streaming, approval cards, composer | the `agent-chat-ui` skill |
| Classifier decisions inside the loop (typed yes/no, choice and score answers) | the `jev-decisions` skill |

**Your own loop or an existing agent runtime.** A runtime that brings its own workspace, coding tools, history, compaction and permissions (a coding agent you drive through an SDK) fits work that looks like what it was built for; send it only the newest message, since it keeps its own history. Write your own loop when you need the model call, the tools, the settings and the structured output under your control, which is the case for a product's agent and the rest of this skill.

- **An established harness as the agent:** AI SDK 7's experimental `HarnessAgent` runs a configured harness such as Claude Code, Codex or Pi with a sandbox, custom instructions, skills and tools; its sessions park and resume, a single turn can be interrupted and resumed, and it implements the SDK's `Agent` interface, so `useChat()` works without extra wiring. [existing agent-harness, WORKFLOWS.md, In Claude Code]

## Selected references

| Branch | Required reference |
|---|---|
| Full product-agent implementation or measured refinement | [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md) for the baseline and comparison |
| Durable long runs | [background-jobs durable workflows](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/DURABLE-WORKFLOWS.md) |
| Long-term memory, Jev classifiers or the protected chat UI | Load agent-memory, jev-decisions or agent-chat-ui only when that capability is selected |
| Coding-agent host configuration or recorded-session diagnosis | [coding-agent-harness](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/coding-agent-harness/SKILL.md); product runtime implementation is not a prerequisite for that job |

These references are required only for the selected branch. Report unavailable material rather than reconstruct its contract. [existing agent-harness, The method, router and RUNTIME.md]

## Why agents fail

1. **The run is a sample.** A case that passes 2 of 3 runs has a real, occasional problem.
2. **Rules compete.** One message touching several rules (an office order, a dietary question and the word "gift") lets the model follow the wrong one; the more rules on every message, the likelier.
3. **Rules that live only in the prompt** get forgotten: validate before sending a payment link, never invent an order number.
4. **Rules that contradict** ("always X" here, "never X when Y" there) resolve differently each run.
5. **Wrong signals:** a mislabelled error ("service unavailable" for "no results") sends the model down the wrong path.
6. **Tests that grade wording, and judges that are models too:** some failures are correct replies worded differently, or a judge wrong at low confidence.

## Where each rule lives

For every sentence in the prompt, ask in order:

| If it... | It goes to | Example |
|---|---|---|
| costs money or trust when broken | **code**: a gate, a check, a tool that refuses | validate the address before a payment link; an order number must be one of the customer's |
| matters only in a situation code can detect | **a reminder message** code adds that turn | delivery-report rules only after a delivery report arrives |
| is a multi-step procedure some conversations need | **a skill**, with a description saying when to load it and when not | the gift order flow, subscriptions |
| is a fact to look up | **a knowledge tool** | opening hours, product weight, certificates |
| is what a tool returns, or its next step | **the tool**: its result or its error | `ADDRESS_CHECK_UNAVAILABLE: hand off and say ...` |
| is voice, scope, or needed on every message | **the base prompt** | tone, language, what the agent never does |

- **Prefer what code decides over what the model decides.** A reminder code adds can't be "forgotten"; a skill the model must choose to load can.
- **A flow nearly every conversation runs stays in the prompt;** as a skill it costs a load on most turns and can be skipped.
- **One rule, one definition.** A reminder may restate it at the moment it is broken.

## The method

For implementing or refining a full product-agent harness:

1. **Baseline:** an eval suite from real conversations, every case run 3 times, the pass rate recorded with its 95% interval (`agent-evals`).
2. **Measure what is actually sent:** the rendered prompt and the tool schemas, per section, not the files on disk.
3. **Critical rules to code first:** list what is costly when wrong (payment, closing an order, handoff, quantities, invented ids, side effects); give each a gate or check ([CHECKS.md](CHECKS.md)) and a unit test, exceptions included.
4. **Situational rules to reminders,** triggered by code.
5. **Facts to a knowledge tool, procedures to skills,** with a budgeted list.
6. **Tools:** short descriptions, bounded results, errors that say what to do next, rare tools deferred.
7. **After each step,** rerun the cases it touches 3 times; fix what regressed before the next step.
8. **Full run at the end:** not below the baseline's interval, and every case that dropped from 3/3 fixed or explained in writing.
9. **After launch:** read the first real conversations; each new failure becomes an eval case, then a fix.

## Prove it

For a full harness implementation, use the full checklist. For a prompt, tool, history, runtime or classifier change, check the affected contracts. For a coding-host session diagnosis, use coding-agent-harness; its acceptance does not require implementing this product infrastructure.

- [ ] Eval suite from real conversations, 3 runs per case, baseline recorded
- [ ] One lease per conversation, longer than the worst-case run; an explicit step limit above the measured maximum, a last step with tools off, pass, step, stream and tool timeouts, visible retries; a stopped run saved from the abort callback
- [ ] One tool traits table that parallelism, approval and system-started turns derive from; an unknown tool treated as the most dangerous; dispatcher tools judged by the action inside them; approvals accepted only for pending calls in server-held history, or signed
- [ ] Outside tools (MCP, plugins): their hints not trusted, the approved list fingerprinted, a change blocked until approved again
- [ ] Metrics without content, one masked trace per turn, a run record with events, flushed before the function returns
- [ ] Rendered prompt and tool schemas measured and pinned as reviewed snapshot files
- [ ] Stable base prompt; changing context sent as appended messages; the prefix pinned by a test
- [ ] Every rule placed (code, reminder, skill, knowledge, tool, prompt)
- [ ] Tool calls and results kept in the history; long chats summarised with fixed sections; lasting facts in memory; current state added each turn from the database
- [ ] Each critical-path gate: a cap, a reachable stop, a next-step message, exceptions in code, a test that it fires with the production prompt and tools
- [ ] Skills: a budgeted list, each saying when to load it and when not
- [ ] Tools: short descriptions, bounded results, errors naming the next step, rare tools deferred; outside actions idempotent; retries bounded
- [ ] A reply check that fails open; authorization classifiers that fail closed, see only trusted input, and started in shadow mode
- [ ] Every model pinned, or tracked with its evals as the release check; every classifier with a named field, a calibrated threshold, its own cases, a time bound and a kill switch
- [ ] Untrusted content marked as data, with an injection case; each outside service with a "down" case
- [ ] One test through the real entry path that needs no key; one trace per turn with personal data masked
