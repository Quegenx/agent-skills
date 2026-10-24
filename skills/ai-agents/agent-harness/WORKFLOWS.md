# Multi-agent workflows

One agent that plans and executes in one context window is highly effective for many coding tasks and breaks down on long-running, massively parallel, highly structured or adversarial ones. A workflow is a script that spawns and coordinates subagents, each with its own context window and a focused, isolated goal. It often uses more tokens, significantly more on some tasks, and suits complex, high-value work: it isn't needed for every task, and parallelism and specialisation have to earn their coordination cost ([RUNTIME.md](RUNTIME.md), More than one agent, has the default, routing and subagents as tools).

## Why one context fails

- **Agentic laziness:** the agent stops before a long multi-part task is finished and declares it done after partial progress (35 of the 50 items in a security review).
- **Self-preferential bias:** an agent prefers its own results, most of all when asked to verify or judge them against a rubric.
- **Goal drift:** fidelity to the objective fades across many turns, most of all after compaction; each summary is lossy, and edge-case requirements and "don't do X" constraints are the details that get lost. The same in a coding session: "Beyond a few hours, the context fills up with old tool calls and stale state. Start a fresh session for each meaningful task instead of one mega-session per day" ([ApparenceKit](https://apparencekit.dev/blog/vibe-coding-flutter-claude-code/)).

The remedy for all three: separate subagents, each with its own context window and a focused, isolated goal.

## The patterns

They compose: a workflow combines several of them.

- **Classify-and-act:** a classifier agent decides the type of task and routes to different agents or behaviour; or a classifier at the end decides the output.
- **Fan-out-and-synthesize:** split the task into many small steps, one agent each in its own clean context so they don't cross-contaminate; the synthesis is a barrier that waits for every fan-out agent, then merges their structured outputs into one result.
- **Adversarial verification:** for each agent, a separate agent verifies its output against a rubric or criteria.
- **Generate-and-filter:** generate many ideas, filter them by a rubric or by verification, dedupe, and return only the best tested ones.
- **Tournament:** agents compete instead of dividing the work: N agents attempt the same task in different ways, and a judging agent compares results pairwise until one wins.
- **Panel with a designated dissenter:** for a judgment call (a strategy, a pricing change), seat several lenses and always at least one whose documented position conflicts with where the question leans ("A council that agrees is a mirror, not a board"); map 2 to 4 real disagreements, each with the trade-off underneath and "what evidence would settle each", before any synthesis; end the synthesis with a tripwire, the dissent to keep watching and its signal. "A take that would survive with the name swapped isn't a take" [coreyhaines31/marketingskills, marketing-council]. The source runs every seat inline in one context; that ceiling and its upgrade are in [marketing-council SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-council/SKILL.md#session-protocol).
- **Loop until done:** for an unknown amount of work, keep spawning agents until a stop condition holds (no new findings, no more errors in the logs), not for a fixed number of passes.

## Jobs, and the shape that fits each

- **Migrations and refactors:** break the task into units (callsites, failing tests, modules); one subagent per fix in its own worktree, another agent reviews it adversarially, then merge. Tell the agents not to run resource-intensive commands, so the parallelism doesn't exhaust the machine. Split parallel tasks along file boundaries, merge the branches in a sensible order, and expect one session to report problems another is already fixing: the sessions don't know about each other, so after a merge, tell the next one to rebase and fix conflicts.
- **Research:** fan out the searches and source fetches, verify each source's claims adversarially, synthesise a cited report. The sources can be a team's chat or a codebase as well as the web.
- **Deep verification:** one agent extracts every factual claim from the report; one subagent checks each claim in detail; optionally a source auditor checks that each checker's source is good.
- **Sorting by judgment:** 1,000 or more items in one prompt degrade and won't fit. Run a tournament, a pipeline of pairwise comparisons, or bucket-rank in parallel and merge: comparative judgment is more reliable than absolute scoring. Each comparison is its own agent, the deterministic loop holds the bracket, and only the running order stays in context.
- **Rules the agent keeps missing:** one verifier agent per rule, each in a clean context over the diff, then a skeptic agent re-reads each flag and drops the false positives. The reverse direction works too: mine recent sessions and review comments for corrections made again and again, cluster them with parallel agents, verify each candidate adversarially ("would this rule have prevented a real mistake?"), and write the survivors into the instructions.
- **Root-cause investigation:** several hypotheses from disjoint evidence (separate agents for the logs, the files, the data), each facing a panel of verifiers and refuters, so self-preferential bias can't pick the winner. It fits any post-mortem, not only code (why did sales drop in March, why did this pipeline fail).
- **Triage at scale:** classify each item, dedupe against what is already tracked, then act (attempt a fix and open a PR) or escalate to a person. **Quarantine** the untrusted part: reader agents that touch public content (tickets, bug reports, feedback) get read-only tools and emit only a structured summary; a separate actor agent with the high-privilege tools sees only those summaries ([TOOLS.md](TOOLS.md), Untrusted content).
- **Customer requests to a pull request:** at Rillet the gathering, not the code, was the slow part ("By the time anyone had the full context, the fastest part of the job was writing the code"). The person nearest the customer highlights what the customer sees and describes the change; an intake agent captures that context and, "if the change is safe and well-scoped", hands it to a coding agent that writes the spec, makes the change and opens a pull request assigned to one named engineer, who reviews and merges. Agents test the change in a sandboxed browser and attach screenshots as proof. Rillet reports customer changes in production in as little as two hours.
- **Exploration and taste:** for taste-based work such as design or naming, a rubric (what a good API design looks like) lets verifier agents check it. Explore many solutions and give a review agent the rubric; the task is complete when the review agent finds the criteria met, or a tournament on the rubric orders or selects the solutions.
- **Lightweight evals:** separate agents produce outputs, each in its own worktree; comparison agents grade them against a rubric. For example, evaluating and refining a skill (the `agent-evals` skill has the full suite).
- **A big audit:** one subagent per unit, and the parent checks each report's evidence before it accepts it:

```
Audit every service in services/ for the retry bug in the linked issue.
Give each service to its own subagent. When a subagent reports back, check its evidence before you accept it.
Finish with one table: service, affected yes or no, and the evidence.
```

- **Ask an audit for a measurement or a task list, not a hunt or a score:** "Ask an agent to find index bloat and it will find index bloat. Ask it what fraction of the suspects are in the index and you get a number that can come back as zero." And: "Ask for a score and you get a number to argue about; ask for a task list and you get work" ([openseo.so](https://openseo.so/library/site-audit/index-bloat), [technical SEO audit checklist](https://openseo.so/library/site-audit/technical-seo-audit-checklist)).

- **A chain of existing skills run one after another in one session** (review, simplify, commit, open the PR, babysit) is not a fan-out: it is a manual-only skill with a checklist and stop conditions, in [skill-authoring DISTRIBUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/skill-authoring/DISTRIBUTION.md#composing-skills).

## Fan-out contract

Vercel's `vercel-optimize` audit wires its subagents through deterministic scripts; what transfers is the contract around them [Vercel, vercel-optimize].

- **Inline or fan out:** "1-2 briefs: investigate inline. 3+ briefs: spawn one sub-agent per brief when the host supports it. Hosts without sub-agents: run inline serially." Visible worker names are human labels ("`Low cache-hit route on /docs/llm-digest/[...slug]`, not `toLaunch-7`").
- **Evidence before the spawn:** the follow-up data for each candidate is attached "BEFORE any sub-agent reads source", and candidates that evidence already disproves are dropped in code, so no subagent is spent on them. Reuse rows from the broad pass, but "Zero rows ≠ 'no data'": the broad pass's row limit may have truncated the item, so fall through to a real query. Deduplicate identical queries by a key holding everything that changes the call's arguments, then fire them together.
- **The brief is the whole prompt:** one file per candidate holds the candidate, its evidence, the citations filtered for it, the protocol and the output schema. It stays under 12 KB and is byte-identical for identical input (a `--deterministic` flag drops the timestamp). The subagent reads only the files the brief lists (at most 12, plus the 3 nearest layouts), follows imports one level, stops after 5 files, and gets the evidence "already collected - do NOT re-query" with a units legend. "If a sub-agent reaches for repo-wide grep, the candidate is malformed; drop or abstain rather than widening scope."
- **A join key per brief, coverage enforced:** every brief carries a `candidateRef` (`kind:target`); the collector errors on unknown, duplicate and missing refs and orders the output by the manifest. "Extraction is permissive while candidateRef coverage stays strict": fenced ```json blocks first, then the whole text, then the first balanced `{…}` or `[…]` span (a string- and escape-aware bracket stack), unwrapping up to two single-key envelopes (`data`, `result`, `insights`); a missing ref is inferred from the file name only when exactly one manifest entry matches.
- **Abstaining is an answer:** "Abstentions are first-class outputs ({abstain:true, candidateRef, reason}) and MUST NOT be graded; the abstention IS the answer." What an abstention means for the report is in [Telemetry audit](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/TELEMETRY-AUDIT.md).
- **The script plans, the orchestrator spawns:** the verify step "Does NOT spawn sub-agents - the orchestrator reads regenPlan, re-spawns one sub-agent per targeted candidate with topFailures injected, then re-runs this script." `topFailures` is the first 5 failed claims. The thresholds that trigger a re-run are in [agent-evals GATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/GATES.md#gating-an-agents-findings).
- **A budget checkpoint the host parses:** "JSON output is the contract the orchestrator parses; markdown is human-only", and `--no-prompt` serves "CI / non-interactive hosts". The same holds for any CLI an agent drives: "Non-interactive flags, JSON output, and errors that say what to run next" [coreyhaines31/marketingskills, ai-seo]. The message to show carries its line count and a `sha256` of its body, so the host can check it was printed verbatim ([CHECKS.md](CHECKS.md#rewriting-and-dropping-a-finished-answer)).
- **The renderer checks again,** because the orchestrator can skip a step: [CHECKS.md](CHECKS.md#rewriting-and-dropping-a-finished-answer).

## Delegation packets

[bgauryy/octocode, octocode-subagent/references/packets.md, coordinate.md, synthesize.md and blind-review.md]

- **Request:** one bounded goal, decisive context with exact anchors, allowed scope/tools and stop condition, ownership, observable acceptance, and the required return shape. Declare whether the parent retains the user conversation or transfers it; give writers disjoint paths. Put the task-relevant constraints into the packet regardless of how much chat the host inherits.
- **Result:** status `complete`, `partial` or `blocked`; conclusion; decisive evidence; actual verification or its limit; confidence and gaps; next action or none. Keep phase updates separate from the completed result, and return an artifact handle or exact slice for large data rather than a transcript.
- **Barrier:** wait for the required results, then inspect their status and acceptance. An idle or terminated worker is not a successful result. Missing return fields require repair or replanning; partial and blocked work never average into complete.
- **Merge:** surface conflicts first, recheck load-bearing anchors in the parent and preserve unresolved disagreement. Do not pass a worker's unverified conclusion into the next packet as an established fact.
- **Independent review:** give the critic the artifact, acceptance and anchors; omit the author's identity, persuasive rationale and peer verdicts when they would bias the check. A separate context alone does not make a reviewer independent if its prompt supplies the answer to endorse.
- **Choose the intervention:** a rubber duck surfaces assumptions in a stuck plan; an interview tests a claim; a red team attacks failure paths; a blind review judges the artifact; independent consensus compares attempts. Agreement is not proof, and another layer must earn its coordination cost. [bgauryy/octocode, octocode-subagent/references/techniques.md]

Compact localization returns use [code-research](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md#a-localization-handback); a selected implementation plan resumes through [engineering-planning EXECUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/EXECUTION.md), using this packet mechanism rather than defining another one.

## Synthesize competing candidates

Use this branch when parallel attempts should produce one coherent artifact rather than only a tournament winner. Keep the bounded request/result and independent-review contracts above. [new/skills/arena, SKILL.md; existing agent-harness, WORKFLOWS.md, Delegation packets]

- State the artifact and a concrete, task-specific rubric before generation. Candidates receive the same task and separate output locations; the rubric is the picker's tool. Declare the race's selection rule before spawning, and include exact revision identities and measurement methods when the comparison depends on them. [new/skills/arena, SKILL.md, Frame; new/skills/swarm, SKILL.md, Frame]
- Wait until candidates finish writing before a cross-judge reads them. Disclose a candidate that produced no output as a dropout. A missing coverage slice is a gap, not a pass; repair a result that omits the identity or method required by its brief. [new/skills/arena, SKILL.md, Fan out and Cross-judge; new/skills/swarm, SKILL.md, Aggregate]
- Read every candidate end to end and score each criterion instead of choosing by overall feel. Compare the independent judge's reasoning with the parent's; disagreement requires reading both rationales and checking the rubric, not treating agreement as proof. [new/skills/arena, SKILL.md, Pick a base; existing agent-harness, WORKFLOWS.md, Delegation packets]
- Choose the base a future maintainer can extend without breaking invariants; when tied, prefer a cleaner boundary or smaller API. Review losing candidates for specific useful parts and integrate selected ideas coherently rather than pasting or averaging whole approaches. [new/skills/arena, SKILL.md, Pick a base and Graft]
- Convergence may leave nothing to graft. Wide divergence is a reason to revisit an underspecified frame. Verify the synthesized artifact, and distinguish a wrong frame from an overlooked candidate idea when verification exposes a problem. [new/skills/arena, SKILL.md, Graft and Verify]
- Return the artifact with the chosen base and why, the judge's verdict, each adopted idea's candidate, rejected alternatives, convergence or dropouts, and the actual verification result. [new/skills/arena, SKILL.md, Outputs]

## Author and reviewer loops

An agent author and an agent reviewer can keep each other busy indefinitely: one pull request went through more than fifty rounds of review and fixes overnight before its author stopped it. A git blame of what the reviewer kept flagging found about 59% of it was code present since the reviewer's first pass: it was finding a few more old bugs each round, not new ones.

- **A round cap:** after three rounds, the reviewer asks the author to step back and reconsider the approach.
- **Diff-only re-review** after the first few passes.
- **Flag the class of bug,** so the author fixes every instance, not one line.
- **No repeats** of findings already posted.
- **Track rounds-to-pass alongside recall.** With these changes, passing after one round rose from 65% to 78%, needing five or more rounds fell from 8.9% to 1.5%, and the mean reviews to pass fell from 2.08 to 1.32.
- **Noise costs more when the author is an agent:** a person waves off a nit in seconds; an agent fixes it, which is another commit and another round. Several agents look for bugs at once, a separate group votes on each finding, and it is posted only if enough agree it is real; findings only about style, diagnostics or cleanup are dropped. A/B test such filters on your own work before keeping them.
- **A person's change request goes back to the author's session:** when the human reviewer asks for changes, "the agent resumes its session and addresses them".
- **Tag severity and origin separately:** use the shared [P0 to P3 scale](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md#tags-and-output), and mark a pre-existing issue separately so a bug the change didn't introduce doesn't look like the author's fault. The old labels mixed Important/Nit severity with Pre-existing origin. [repository owner, severity convention]

## Which model each agent uses

- **Route by expected complexity:** a classifier agent researches the task first (how many files the module has, the shape of the codebase), then picks a smaller or a bigger model. It pays off when the task involves many tool calls.
- **A smaller model for lookups, not for writing code:** subagents that search and summarise, read logs and test output, or find where something is defined. A small model that misreads a search result sends the main model after the wrong file, and the main model pays for the detour: keep it on work where a mistake is cheap to spot. Judgment calls stay on the main model.
- **A bigger model when the result matters more than the token price:** long runs nobody supervises, problems with no existing pattern, large changes that coordinate many subagents. If the main model hits the same problem twice, switch, and switch back once it is solved.
- **One gateway, the model a string:** routing every provider through one integration (Vercel's AI Gateway at Rillet) lets a builder add an agent without a provider connection of its own and try another model for a task by changing the model string (`model: "zai/glm-5.3"`), with usage broken down by model and cost, and limits, as more people build agents.
- **Every subagent that inherits the main model inherits its price,** and each pays for its own tokens: its file reads stay out of the parent's context, not off the bill. Agent teams multiply it: each teammate keeps using tokens until it exits, and a Claude Code team in plan mode uses about seven times the tokens of a standard session: keep teams small, each task self-contained, and shut an agent down when its part is done.

## Cost and stopping

- **Ask whether it needs more compute.** Most coding tasks don't need a panel of five reviewers; a "quick workflow" (a quick adversarial review of one assumption) is fine for a small task. The panel version: one seat for a quick take, 3 to 5 by default, the full bench only "when stakes justify it"; "Twelve advisors on a headline" is the anti-pattern [coreyhaines31/marketingskills, marketing-council].
- **Long threads are context traps:** "Each message carries the full conversation history." Argyle's per-thread cost dashboard for his OpenClaw assistant found "Two threads accounted for 60% of the total spend": a store project ($73) and `#general` ($70), "a catch-all channel accumulating context from random conversations. Expensive by accident." His fixes: "Start fresh threads for new topics instead of continuing in the same one", delegate self-contained tasks to sub-agents "as they don't carry the parent context" (the subagent line above: still on the bill), and "Treat `#general` as a lobby, not a workspace". He tracks cost per thread, daily spend, input vs output vs cache hits, and session type (Discord, cron, direct chat), aggregated from the JSONL session logs (token counts and cost per response) into one static JSON file behind an Astro page; "The dashboard cost less than a dollar to make" ([nerdy.dev: My OpenClaw Token Dashboard](https://nerdy.dev/openclaw-token-dashboard), 2026-03-02).
- **A token budget per workflow** caps the spend; in Claude Code a prompt such as "use 10k tokens" sets it.
- **Repeatable workflows** (triage, research, verification) run on an interval with a hard completion requirement ([CHECKS.md](CHECKS.md), Loop breakers and goal loops).
- **A detailed prompt that names the techniques** (fan out, verify adversarially, tournament) gives the best results.

## Coding-agent host workflows

For Claude Code's dynamic workflow API, saved templates and subagent model settings, read [coding-agent-harness CLAUDE-WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/coding-agent-harness/CLAUDE-WORKFLOWS.md#in-claude-code). The shared patterns, delegation packets and review contracts above remain the owner for both product and coding-agent workflows. [existing agent-harness, WORKFLOWS.md]

## Prove it

- [ ] The task needs more compute than one context gives it (long-running, massively parallel, highly structured or adversarial), and the workflow has a token budget
- [ ] A long multi-part task is split so each part runs in its own context with its own goal
- [ ] Every verifier, judge and refuter runs in a context that did not produce what it checks
- [ ] A panel seats a dissenter, maps its disagreements with the evidence that would settle each, and ends on a tripwire
- [ ] An unbounded loop has a stop condition (no new findings, no more errors), not a fixed pass count
- [ ] An author and reviewer loop: a round cap, diff-only re-review, no repeated findings, rounds-to-pass tracked
- [ ] Agents that read untrusted content have read-only tools and hand on only structured summaries
- [ ] The parent checks each subagent's evidence before accepting it
- [ ] Worker status, acceptance and verification are checked independently of whether the worker stopped; conflicts remain visible and writer paths do not overlap [bgauryy/octocode, octocode-subagent/references/packets.md and synthesize.md]
- [ ] A fan-out joins outputs back by one key per brief and fails on an unknown, duplicate or missing key; candidates the cheap evidence already disproves never get a subagent
- [ ] Small models only on work where a mistake is cheap to spot; code and judgment calls on the main model
