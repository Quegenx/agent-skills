# Multi-agent workflows

One agent that plans and executes in one context window is highly effective for many coding tasks and breaks down on long-running, massively parallel, highly structured or adversarial ones. A workflow is a script that spawns and coordinates subagents, each with its own context window and a focused, isolated goal. It often uses more tokens, significantly more on some tasks, and suits complex, high-value work: it isn't needed for every task, and parallelism and specialisation have to earn their coordination cost ([RUNTIME.md](RUNTIME.md), More than one agent, has the default, routing and subagents as tools).

## Why one context fails

- **Agentic laziness:** the agent stops before a long multi-part task is finished and declares it done after partial progress (35 of the 50 items in a security review).
- **Self-preferential bias:** an agent prefers its own results, most of all when asked to verify or judge them against a rubric.
- **Goal drift:** fidelity to the objective fades across many turns, most of all after compaction; each summary is lossy, and edge-case requirements and "don't do X" constraints are the details that get lost.

The remedy for all three: separate subagents, each with its own context window and a focused, isolated goal.

## The patterns

They compose: a workflow combines several of them.

- **Classify-and-act:** a classifier agent decides the type of task and routes to different agents or behaviour; or a classifier at the end decides the output.
- **Fan-out-and-synthesize:** split the task into many small steps, one agent each in its own clean context so they don't cross-contaminate; the synthesis is a barrier that waits for every fan-out agent, then merges their structured outputs into one result.
- **Adversarial verification:** for each agent, a separate agent verifies its output against a rubric or criteria.
- **Generate-and-filter:** generate many ideas, filter them by a rubric or by verification, dedupe, and return only the best tested ones.
- **Tournament:** agents compete instead of dividing the work: N agents attempt the same task in different ways, and a judging agent compares results pairwise until one wins.
- **Loop until done:** for an unknown amount of work, keep spawning agents until a stop condition holds (no new findings, no more errors in the logs), not for a fixed number of passes.

## Jobs, and the shape that fits each

- **Migrations and refactors:** break the task into units (callsites, failing tests, modules); one subagent per fix in its own worktree, another agent reviews it adversarially, then merge. Tell the agents not to run resource-intensive commands, so the parallelism doesn't exhaust the machine. Split parallel tasks along file boundaries, merge the branches in a sensible order, and expect one session to report problems another is already fixing: the sessions don't know about each other, so after a merge, tell the next one to rebase and fix conflicts.
- **Research:** fan out the searches and source fetches, verify each source's claims adversarially, synthesise a cited report. The sources can be a team's chat or a codebase as well as the web.
- **Deep verification:** one agent extracts every factual claim from the report; one subagent checks each claim in detail; optionally a source auditor checks that each checker's source is good.
- **Sorting by judgment:** 1,000 or more items in one prompt degrade and won't fit. Run a tournament, a pipeline of pairwise comparisons, or bucket-rank in parallel and merge: comparative judgment is more reliable than absolute scoring. Each comparison is its own agent, the deterministic loop holds the bracket, and only the running order stays in context.
- **Rules the agent keeps missing:** one verifier agent per rule, each in a clean context over the diff, then a skeptic agent re-reads each flag and drops the false positives. The reverse direction works too: mine recent sessions and review comments for corrections made again and again, cluster them with parallel agents, verify each candidate adversarially ("would this rule have prevented a real mistake?"), and write the survivors into the instructions.
- **Root-cause investigation:** several hypotheses from disjoint evidence (separate agents for the logs, the files, the data), each facing a panel of verifiers and refuters, so self-preferential bias can't pick the winner. It fits any post-mortem, not only code (why did sales drop in March, why did this pipeline fail).
- **Triage at scale:** classify each item, dedupe against what is already tracked, then act (attempt a fix and open a PR) or escalate to a person. **Quarantine** the untrusted part: reader agents that touch public content (tickets, bug reports, feedback) get read-only tools and emit only a structured summary; a separate actor agent with the high-privilege tools sees only those summaries ([TOOLS-AND-MEMORY.md](TOOLS-AND-MEMORY.md), Untrusted content).
- **Customer requests to a pull request:** at Rillet the gathering, not the code, was the slow part ("By the time anyone had the full context, the fastest part of the job was writing the code"). The person nearest the customer highlights what the customer sees and describes the change; an intake agent captures that context and, "if the change is safe and well-scoped", hands it to a coding agent that writes the spec, makes the change and opens a pull request assigned to one named engineer, who reviews and merges. Agents test the change in a sandboxed browser and attach screenshots as proof. Rillet reports customer changes in production in as little as two hours.
- **Exploration and taste:** for taste-based work such as design or naming, a rubric (what a good API design looks like) lets verifier agents check it. Explore many solutions and give a review agent the rubric; the task is complete when the review agent finds the criteria met, or a tournament on the rubric orders or selects the solutions.
- **Lightweight evals:** separate agents produce outputs, each in its own worktree; comparison agents grade them against a rubric. For example, evaluating and refining a skill (the `agent-evals` skill has the full suite).
- **A big audit:** one subagent per unit, and the parent checks each report's evidence before it accepts it:

```
Audit every service in services/ for the retry bug in the linked issue.
Give each service to its own subagent. When a subagent reports back, check its evidence before you accept it.
Finish with one table: service, affected yes or no, and the evidence.
```

## Author and reviewer loops

An agent author and an agent reviewer can keep each other busy indefinitely: one pull request went through more than fifty rounds of review and fixes overnight before its author stopped it. A git blame of what the reviewer kept flagging found about 59% of it was code present since the reviewer's first pass: it was finding a few more old bugs each round, not new ones.

- **A round cap:** after three rounds, the reviewer asks the author to step back and reconsider the approach.
- **Diff-only re-review** after the first few passes.
- **Flag the class of bug,** so the author fixes every instance, not one line.
- **No repeats** of findings already posted.
- **Track rounds-to-pass alongside recall.** With these changes, passing after one round rose from 65% to 78%, needing five or more rounds fell from 8.9% to 1.5%, and the mean reviews to pass fell from 2.08 to 1.32.
- **Noise costs more when the author is an agent:** a person waves off a nit in seconds; an agent fixes it, which is another commit and another round. Several agents look for bugs at once, a separate group votes on each finding, and it is posted only if enough agree it is real; findings only about style, diagnostics or cleanup are dropped. A/B test such filters on your own work before keeping them.
- **A person's change request goes back to the author's session:** when the human reviewer asks for changes, "the agent resumes its session and addresses them".
- **Tag each finding** Important, Nit or Pre-existing and sort by severity, so a bug the change didn't introduce doesn't look like the author's fault.

## Which model each agent uses

- **Route by expected complexity:** a classifier agent researches the task first (how many files the module has, the shape of the codebase), then picks a smaller or a bigger model. It pays off when the task involves many tool calls.
- **A smaller model for lookups, not for writing code:** subagents that search and summarise, read logs and test output, or find where something is defined. A small model that misreads a search result sends the main model after the wrong file, and the main model pays for the detour: keep it on work where a mistake is cheap to spot. Judgment calls stay on the main model.
- **A bigger model when the result matters more than the token price:** long runs nobody supervises, problems with no existing pattern, large changes that coordinate many subagents. If the main model hits the same problem twice, switch, and switch back once it is solved.
- **One gateway, the model a string:** routing every provider through one integration (Vercel's AI Gateway at Rillet) lets a builder add an agent without a provider connection of its own and try another model for a task by changing the model string (`model: "zai/glm-5.3"`), with usage broken down by model and cost, and limits, as more people build agents.
- **Every subagent that inherits the main model inherits its price,** and each pays for its own tokens: its file reads stay out of the parent's context, not off the bill. Agent teams multiply it: each teammate keeps using tokens until it exits, and a Claude Code team in plan mode uses about seven times the tokens of a standard session: keep teams small, each task self-contained, and shut an agent down when its part is done.

## Cost and stopping

- **Ask whether it needs more compute.** Most coding tasks don't need a panel of five reviewers; a "quick workflow" (a quick adversarial review of one assumption) is fine for a small task.
- **A token budget per workflow** caps the spend; in Claude Code a prompt such as "use 10k tokens" sets it.
- **Repeatable workflows** (triage, research, verification) run on an interval with a hard completion requirement ([CHECKS.md](CHECKS.md), Loop breakers and goal loops).
- **A detailed prompt that names the techniques** (fan out, verify adversarially, tournament) gives the best results.

## In Claude Code

- **A dynamic workflow** is a JavaScript file: `agent(prompt, opts)` spawns one subagent (`prompt` required; `schema` returns validated JSON, `model` picks opus, sonnet or haiku, `isolation` is worktree or remote, `agentType` selects a subagent), `parallel()` fans out and waits for all, `pipeline()` streams each item through every stage, plus standard JavaScript (JSON, Math, Array). The trigger word `ultracode` makes Claude Code create one. An interrupted workflow picks up where it left off when the session resumes.
- **Static workflows** (the Agent SDK, `claude -p`) must handle every edge case, so they stay generic; a dynamic one is written for the task in front of it (a provider migration that reads the billing code, checks each feature against the new provider's docs, prices it at real volume and runs a devil's advocate).
- **Saving and sharing:** press `s` in the workflow menu to save; check workflows into `~/.claude/workflows` or put the `.workflow.js` files in a skill folder, referenced from its SKILL.md, and tell Claude to treat them as a template, not a script to run verbatim. For scale: a review-changes run took 14 agents, 482k tokens and 6m 12s; a deep-research run 22 agents, 1.1M tokens and 11m 3s.
- **An established harness as the agent:** AI SDK 7's experimental `HarnessAgent` runs a configured harness such as Claude Code, Codex or Pi with a sandbox, custom instructions, skills and tools; its sessions park and resume, a single turn can be interrupted and resumed, and it implements the SDK's `Agent` interface, so `useChat()` works without extra wiring.
- **Subagent models:** `model: haiku` or `model: sonnet` in a subagent's definition; `CLAUDE_CODE_SUBAGENT_MODEL` sets every subagent; a definition's model overrides the variable; with neither, a subagent runs on the main model.

## Prove it

- [ ] The task needs more compute than one context gives it (long-running, massively parallel, highly structured or adversarial), and the workflow has a token budget
- [ ] A long multi-part task is split so each part runs in its own context with its own goal
- [ ] Every verifier, judge and refuter runs in a context that did not produce what it checks
- [ ] An unbounded loop has a stop condition (no new findings, no more errors), not a fixed pass count
- [ ] An author and reviewer loop: a round cap, diff-only re-review, no repeated findings, rounds-to-pass tracked
- [ ] Agents that read untrusted content have read-only tools and hand on only structured summaries
- [ ] The parent checks each subagent's evidence before accepting it
- [ ] Small models only on work where a mistake is cheap to spot; code and judgment calls on the main model
