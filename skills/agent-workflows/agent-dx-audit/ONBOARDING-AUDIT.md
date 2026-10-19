# Auditing agent experience: docs, SDKs and skills

Sources: [browserbase/skills, agent-experience], with the existing [c15t, writing-docs], [Vercel, writing-guidelines] and [coreyhaines31/marketingskills, marketing-loops] additions and source corrections retained from the repository's former `agent-evals/DX-AUDIT.md`. This file owns the onboarding audit workflow; generic evaluation methodology stays in [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md).

Several subagents each attempt one real task against a product's docs, SDK or a SKILL.md; the audit traces what they fetched and where they failed, scores the run, and writes it up.

**Contents:** [The principle](#the-principle) · [Setting the goal](#setting-the-goal) · [Configuration](#configuration) · [Credentials](#credentials) · [The prompts](#the-prompts) · [The brief and the trace](#the-brief-and-the-trace) · [Running the agents](#running-the-agents) · [Analysis](#analysis) · [Scoring](#scoring) · [The write-up](#the-write-up) · [Prove it](#prove-it)

## The principle

- **Don't spoonfeed.** Each subagent gets a 1-2 sentence prompt and has to find the docs, pick a path and hit the real failures. A good doc survives this; a bad one doesn't.
- **Stay product-agnostic.** Never infer the target from an email domain, git remote, repo name, memory or project instructions, and never pre-fill a product in the questions; offer neutral options ("Paste a URL", "Paste a local path", "Type a product name").
- **Never test a target the user didn't name.**

## Setting the goal

- **Research lightly** once the target is named: at most one fetch, enough to confirm a getting-started flow exists.
- **Set one abstract goal, not a checklist.** Bad: "Navigate to https://example.com", "Use Playwright", "Print the page title". Prescriptive checklists steer the agents and pollute the test. With no getting-started flow, ask the user what "done" means.
- **Core task by kind of target:**

| Target | Core task |
|---|---|
| Payments | Charge a test card |
| Auth | Sign up a user |
| Database | Insert a row and read it back |
| Browser SDK | Run a session |
| Search | Make one query and parse the result |
| SKILL.md | Its advertised job |
| README | Install and run the smallest example |

- **Docs with several setup paths get a task per path.** One getting-started run proves one path; a library documented for several frameworks, routers or deployments needs a task for each variant and each edge path. c15t's docs skill: "Evaluate usefulness with concrete tasks: set up Pages Router SSR, export a static Next.js site, install plain Vue without Nuxt, preserve SvelteKit hydration, change a banner's radius without going headless, and stop a vendor request before consent. A lint score does not establish that an agent can complete those tasks." [c15t, writing-docs]. Each task is still one abstract goal, not a checklist.
- **A single page, before a full audit:** Vercel's writing guidelines run "a test prompt against the preview: 'given this plan's goal, can the model complete the task using only this page?'" [Vercel, writing-guidelines]. The same question fits a SKILL.md.

## Configuration

- **Ask in one call** (Claude Code `AskUserQuestion`: up to 4 questions, up to 4 options each):
  - Depth: 5 agents (recommended), 3, 10.
  - Languages: Python, TypeScript, Go, Shell/Bash; multi-select.
  - Personas: Standard (recommended), Pragmatic, Thorough, Skeptical.
  - Execution: Allow Bash (recommended), Draft-only.
- **Then the model:** Sonnet (recommended), Opus, Haiku, or a mixed comparison that rotates deterministically: agent 1 Opus, 2 Sonnet, 3 Haiku.
- **Warn about safety before an Allow Bash run,** then proceed without a `sleep`.

## Credentials

- **Ask only for Allow Bash runs:** auto-discover (recommended); none (the agents hit the wall, scored as setup friction); paste manually.
- **Inject under generic names:** `API_KEY`, `PROJECT_ID`, `SECRET`, never product-specific ones. An agent that sees a product-named key in its environment skips reading the docs. A key the agent fails to map onto the product's variable is itself a doc-quality signal.
- **Auto-discovery runs in tiers and stops at the first hit,** ranked by a product slug derived from the target:
  1. Names only: `printenv | grep -iE '^[A-Z][A-Z0-9_]*_(API_KEY|TOKEN|SECRET|KEY)=' | cut -d= -f1`.
  2. A fixed allowlist, `~/.zshrc ~/.bashrc ~/.bash_profile ~/.zprofile ~/.env ./.env ./.envrc`, scanned with `grep -hE '^[[:space:]]*export[[:space:]]+...'`. Don't expand the list and don't recurse. Read values lazily, only after confirmation.
  3. A secrets manager (1Password `op` only if `op account list` exits 0, so no interactive sign-in starts; macOS `security find-generic-password -l "<name>" -w`, tried once).
  4. Paste.
- **Choosing:** use a candidate only within the approved account/product scope; show its name and source without its value and ask when that identity or use is unresolved. The source selected one slug-matching candidate silently, but a name match alone does not establish authorization. Several candidates: ask with the top 3 plus "Paste manually instead" (and "Show all" if there are more). [browserbase/skills, agent-experience source conflict; user authorization]
- **Keep values private:** never write a value to chat, a trace, the write-up or any file other than the agent's own workspace `.env`; never re-export it under a product name inside a workspace; don't log its length, prefix or fingerprint.
- **The orchestrator keeps the real-named credentials to verify claims,** for example a `curl` that a reported session ID resolves; an ID that doesn't resolve is evidence of hallucination. Show only the result, never the headers. The asymmetry is deliberate.
- **Don't help an agent that asks for credentials.**

## The prompts

- **Template:** `{persona_prefix} {product}'s getting-started guide using {language}.{persona_tail} You've completed it when you've done whatever the guide treats as the primary successful outcome.`

| Persona | Prefix | Tail |
|---|---|---|
| Standard | `Follow` | |
| Pragmatic | `Skim and then follow` | |
| Thorough | `Read and then follow` | |
| Skeptical | `Follow` | ` Note anything in the docs that seems wrong or unclear as you go.` |

- **Language phrases:** `using Python`, `using TypeScript (Node.js)`, `using Go`, `using bash/curl only`.
- **Fill N agents** by crossing personas with languages in row-major order, truncated to N. With fewer cells than N, repeat them with slight tail variations ("and print the full error if anything fails").
- **Don't:** paste docs, write numbered rule lists, ask for theatrical role-play ("simulate a newbie" invites performance for its own sake), or give hints. Add a seed URL only if the product name is ambiguous.
- **Final check:** under about 30 words, success left implicit.

## The brief and the trace

- **The brief:** discover the docs yourself; if a step fails, try once more with a different approach before giving up, and don't loop indefinitely; stay on task; work in the current folder and clean up temporary files. Draft-only mode removes Bash and has the agent list the commands it would run. Missing credentials: stop and ask once, which is recorded as friction.
- **The trace is JSON, the last thing in the response,** with these fields: `persona, language, task_prompt, onboarding_status (completed|partial|stuck|blocked-on-credentials), primary_outcome_achieved, success_criterion_from_docs, docs_promise_met, evidence, wall_time_estimate_sec, time_to_first_working_code_sec, tool_calls[{tool,count,purpose}], doc_pages_fetched, errors[{stage,message,recovered}], retries, interruptions_asking_for_creds, code_attempts, completed_subtasks[], detailed_trace[], friction_points[{severity,phase,quote_or_section,issue}], positive_moments[]`.
- **Trace events:** `milestone`, `assistant_thought`, `tool_use(n,tool,input)`, `tool_result(n,output ≤500 chars, error)`, `error(stage,message,recovered)`, `result(success,summary)`. Secrets are redacted as `[REDACTED]`.
- **Docs with no success criterion:** write "docs do not define a success criterion" and set `docs_promise_met: false`.
- **Parse with** `/```json\s*(\{[\s\S]*?\})\s*```\s*$/`. On failure mark the trace `errored` and keep `raw_tail` (the last 500 characters). If more than 50% errored, warn and offer a retry.

## Running the agents

- **Spawn all N in one message** (Claude Code: `Agent` calls of type `general-purpose` with the `model` parameter), and keep each prompt by index for the write-up.
- **Track background agents:** keep a returned-against-spawned tally, print "All N agents returned" before the next step, and answer "still running?" from the tally.
- **Never write outside the current folder** except the final HTML file.

## Analysis

- **Keep both the JSON and the prose.** An agent that hallucinated a wrong package name will also describe it correctly in its own trace; the truth lives in the tool output and the prose.
- **Label where each fetched URL came from,** inline under each fetch, checked in this order:

| Label | Means |
|---|---|
| `FROM LLMS.TXT` | The URL was mentioned in llms.txt |
| `FROM PREV PAGE` | It appeared in an earlier tool output |
| `GUESS · 404` | It was guessed and returned 404 |
| `UNTRACED` | No observed discovery source in this trace; origin is unknown |

- **Which vendor agents pick, tracked over time:** the same subagent panel, phrased without vendor names and rerun monthly against the previous release's baseline, is the agent-default check in [ai-search-visibility AGENT-DEFAULTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AGENT-DEFAULTS.md) and [marketing-loops SEO-LOOPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SEO-LOOPS.md#the-agent-default-check-loop) [coreyhaines31/marketingskills, marketing-loops].
- **Read the labels within their evidence.** The source called an unexplained URL TRAINING PRIOR and inferred a training-data head start. A trace cannot establish that origin: retain UNTRACED, the actual URL/outcome and missing provenance. Repeated 404s or an observed llms.txt discovery are evidence of those events, not proof of their sole cause. [browserbase/skills, agent-experience/SKILL.md]
- **Review across agents in 3-5 sentences:** convergent mistakes (3 of 3 agents on the wrong package is a doc-quality disaster), hallucinated artifacts, inconsistent end states, silent workarounds, and contradictions between tool output and narrative (grep for `error`, `404`, `401`, `deprecated`, `warning`).

## Scoring

- **Measured versus estimated:** the source trace has wall_time_estimate_sec and agent-reported timing. Label estimates as estimates; use actual recorded clock/tool-usage evidence for measured duration or cost. An exact-looking score does not turn estimated inputs into measurements. [browserbase/skills, agent-experience/SKILL.md]

- **Weights:** setup friction 25%, speed 20%, efficiency 20%, error recovery 15%, doc quality 20%. Grades: A at 90 or more, B 75, C 60, D 45, else F.
- **Cap by onboarding success rate:** 0.9 or more, no cap; 0.7 or more, 85; 0.5 or more, 70; below 0.5, 55.
- **Convergent hallucinations cap doc quality at 50.**
- **Anchors:** speed under 2 min 90+, 2-5 min 70, 5-10 min 50, over 10 min 30. Efficiency under 10 calls 90+, 10-20 70, 20-40 50, 40+ 30. More than 5 doc pages fetched for a simple task is fragmentation.
- **Calibration:** default to B; a dimension with no complaints starts at 75; one critical friction point weighs as much as 5 low ones; blocked on credentials is not a doc failure.
- **Read the signals:** a low `docs_promise_met` rate with high completion means agents are succeeding in spite of the docs. In a mixed run, Opus succeeding where Haiku fails means the docs lean on reasoning a smaller model can't do.

## The write-up

- **Opinion before data,** in this order: scorecard and status grid; narrative review (always rendered, with a default line if nothing stood out); executive summary; fixes; what worked and what didn't; patterns hit by 2 or more agents; metrics; tool breakdown; timeline (Research, Setup, Execution, Validation, Interrupt); per-agent table and traces. The five status counts partition N exactly.
- **Say what was verified and how:** "Record which examples were compiled, exercised in a browser, or only checked against source." "If the private host is unavailable, report that limit rather than claiming the site or embedded previews were verified." [c15t, writing-docs]
- **Dimension scores stay internal;** don't render a per-dimension breakdown.
- **Results table:** #, persona and language, model (only for a mixed run), status pill, total tool calls, time (`92s`, or `2m 14s` from 120 s).
- **Trace card:** a compact monospace event log with bracketed coloured labels; the `[PROMPT]` row comes first and is the only collapsible one; full tool inputs (a fetch shows both its `url` and its `prompt`; truncate values, not structure); a light background; max height 640 px.
- **Every URL is clickable:** relative doc paths become links on the target's origin, resource IDs get a `↗` link. A 404 finding is useless if the reader can't click to verify it. HTML-escape everything.
- **Template placeholders:** `{{TITLE}} {{TARGET_REF}} {{META}} {{GRADE_LETTER}} {{GRADE_CLASS}} {{OVERALL_SCORE}} {{AGENT_COUNT}} {{COMPLETED_COUNT}} {{PARTIAL_COUNT}} {{STUCK_COUNT}} {{BLOCKED_COUNT}} {{ERRORED_COUNT}} {{NARRATIVE_REVIEW_SECTION}} {{EXEC_SUMMARY}} {{FIXES_LIST}} {{WENT_WELL_ITEMS}} {{DIDNT_GO_WELL_ITEMS}} {{PATTERNS_SECTION}} {{METRICS_GRID}} {{TOOL_BREAKDOWN_SECTION}} {{TIMELINE_SECTION}} {{AGENT_RESULTS_TABLE}} {{AGENT_TRACES_SECTION}}`, grade classes `grade-a` to `grade-f`.
- **Save** to `./agent-experience-<slug>-<YYYYMMDD-HHMMSS>.html`. In chat, print the grade, score, the biggest fix, the counts and the path; open the file only if Allow Bash was chosen.
- **Clean up** with `rm -rf ./dx-audit-tmp/`, but keep the folders of stuck or errored agents for inspection.

## Prove it

Every agent's prompt is under about 30 words and names no URL unless the product is ambiguous; no credential value appears in chat, any trace or the HTML file; the status counts add up to N; when real-named credentials were retained, agent-reported resource IDs were spot-checked against the real API; every fetch carries a provenance label; the grade respects the success-rate cap and the convergent-hallucination cap.
