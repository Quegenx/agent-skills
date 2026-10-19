# Self-improving task loops and judging results

**Contents:** [The pattern](#the-pattern) · [A strategy loop](#a-strategy-loop-autobrowse) · [The inner agent](#the-inner-agent) · [Tracing each iteration](#tracing-each-iteration) · [Tuning a hosted agent's prompt](#tuning-a-hosted-agents-prompt) · [Oracles and judging](#oracles-and-judging) · [Prove it](#prove-it)

## The pattern

The general [fixed-eval improvement method](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md#before-the-loop-starts-and-inside-each-round) owns hypotheses, controlled comparisons and keep/revert decisions. Here the editable surface is the browser strategy or hosted system prompt, with the task, result contract, inputs and evaluator held fixed. The output is a site-specific playbook. The source tool claims cost drops of 80% or more after deterministic navigation replaces exploration; that is a source claim, not a measured guarantee for another task. [browserbase/skills, autobrowse; optimize-agent-prompt]

**Source-workspace prerequisites:** `scripts/evaluate.mjs`, `scripts/unify-trace.mjs`, templates and the code-generation workspace are in upstream [autobrowse](https://github.com/browserbase/skills/tree/main/skills/autobrowse). Hosted-agent commands refer to [optimize_agent_prompt.mjs](https://github.com/browserbase/skills/blob/main/skills/optimize-agent-prompt/scripts/optimize_agent_prompt.mjs) and its source references. These helpers are not shipped in this Markdown skill. The CLI/API fields, model defaults and token prices below describe those source workflows; recheck the chosen version before a paid run. [browserbase/skills, autobrowse; optimize-agent-prompt]

## A strategy loop (autobrowse)

Files:

- **`task.md`** is the fixed input: written once, never edited. Sections `URL`, `Inputs`, `Steps`, `Output`, where output is JSON `{success, confirmation, error_reasoning}`; on failure `success: false` and the extracted error text in `error_reasoning`.
- **`strategy.md`** is the only file the outer agent edits (created empty on the first run).
- **The graduated skill** is the output. Workspace `./autobrowse/{tasks,traces,reports}` in the working directory.

The loop:

1. **Parse the arguments:** `--task`, `--tasks a,b`, `--all`, `--iterations N` (default 5), `--env local|remote` (default local), `--browser-trace` (implies remote; combined with `--env local` it errors `browser-trace requires Browserbase; drop --env local or drop --browser-trace.`). A free-form URL or intent matches an existing task or becomes a new kebab-case task from the template; tell the user its name in one line.
2. **Run the inner agent:** `node scripts/evaluate.mjs --task <t> --workspace ./autobrowse [--env remote]`.
3. **Read `traces/<t>/latest/summary.md`;** on failure drill into `trace.json` at the failing turn and its screenshots.
4. **Form one hypothesis:** find the exact failing turn and the single heuristic that would have prevented it. Examples: wait 1 s after a dropdown click (options animate in); navigate straight to the deep URL, skipping the landing page; use `fill #field_3`, not `type` (the field clears on focus); add `wait timeout 2000` before the snapshot when a spinner shows.
5. **Update `strategy.md`:** keep what worked, fix the specific failure, add a concrete heuristic. A good strategy has a fast path (a direct URL), a step-by-step workflow with timing, site knowledge (selector ids, field names, success indicators) and failure recovery.
6. **Judge:** apply the canonical [keep/revert method](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md#hillclimbing) to this task's evidence; keep the browser strategy or restore it before the next hypothesis. [browserbase/skills, autobrowse; existing agent-evals]

Only edit the strategy, one hypothesis per iteration, build on wins, trust the trace.

### Graduating

- **Graduate after passing 2 or more of the last 3 runs,** or at max iterations (then document the known failure point).
- **Don't just copy the strategy.** The skill must stand alone for someone who never saw the codebase: Purpose, When to Use, CLI reference, Workflow (start session, navigate, extract, output), Site-Specific Gotchas (the core value of the skill), Failure Recovery, Expected Output.
- **Never put `--session <name>` in a graduated skill.** Named sessions are a workaround for parallel runs; skills must work with the default session.

### Many tasks

- **One sub-agent per task, in parallel,** each with a self-contained prompt: the workspace's absolute path, N iterations, the env, `--workspace`, the graduation rules, and a required summary (task, final pass or fail, cumulative cost, iterations, a per-iteration table, 2 or 3 learnings). Then a final table and a report at `./autobrowse/reports/YYYY-MM-DD-HH-MM-<tasks>.md`.
- **Nightly refresh** by cron: `0 1 * * * cd /path && claude "/autobrowse --all --iterations 3 --env remote" >> autobrowse.log 2>&1`.

## The inner agent

A raw API loop with a single `execute` tool.

- **Defaults:** model `claude-sonnet-4-6` (opus for the hardest sites, haiku for simple, high-volume ones), `MAX_TURNS` 30 (env), `MAX_TOKENS` 4096, command timeout 30,000 ms, output buffer 1 MiB, tool results truncated to 50,000 characters.
- **Allow one executable only** (`browse`). Tokenize the command with a quote and escape parser and run it with `execFileSync` without a shell, so metacharacters stay literal; block unclosed quotes, a trailing escape and an empty command with `BLOCKED: ...`.
- **Traces are secret.** They hold cookies, auth headers, tokens, private URLs and signed-in screenshots: directories 0700, files 0600, chmod recursively after the run to cover files subprocesses wrote, skip symlinks.
- **Run status:** `completed` on `end_turn`; `truncated` on `max_tokens` with no tool use; `max_turns` when the budget runs out; `incomplete` otherwise.
- **Write the trace every turn.** Final artifacts: `summary.md` (status, duration, turns, cost, tokens, a decision log with reasoning truncated to 150 characters, snapshot ref counts, errors), `trace.json`, `messages.json`, a `latest` symlink, one JSON result line on stdout and diagnostics on stderr. Runs are numbered `run-NNN` or set with `--run-number`.
- **Cost per million tokens (in, out):** opus-4-6 5 and 25, sonnet-4-6 3 and 15, haiku-4-5 1 and 5.
- **A missing `ANTHROPIC_API_KEY` is a clear error and exit;** `.env` loads automatically. Don't hunt for keys in other paths.
- **When the outer harness owns a cloud session** (`--connect-url`, requires remote): page-driving verbs get `--cdp <url>` and a distinct daemon `--session autobrowse-<sha1(url)[0:8]>` per parallel run, `--remote` and `--local` are stripped, and `browse stop` is suppressed (returns `{"stopped":true,"suppressed":...}`).

## Tracing each iteration

With `--browser-trace` (Browserbase and the recorder in [RUN-TRACING.md](RUN-TRACING.md)):

- **Order:** create an authorized keep-alive session, get its `connectUrl`, set `O11Y_ROOT` and `O11Y_RUN_ID`, start the capture in the background and `sleep 2`, run the inner agent with `--connect-url`, stop the capture, bisect, unify, release. **Never release before bisecting:** bisecting needs the session to exist.
- **Attach over CDP, not `--remote`:** that attach path sends Network and Console events only to the driving client, so a sibling observer can't see them.
- **Read `unified-events.jsonl` first:** agent turns and browser events, tagged by source and time-ordered; the failure is usually one or two adjacent lines. A hypothesis must cite a specific line or timestamp. A repeated access block requires an authorized access path; do not use bot-detection bypass. [browserbase/skills, autobrowse source conflict; user policy]
- **Drill down** into `cdp/summary.json`, `network/failed.jsonl`, `console/exceptions.jsonl`, `pages/<pid>/` and `trace.json` by turn. The element descriptors (tag, id, role, accessible name, attributes, xpath, rect per command) feed code generation, not hypotheses.
- **Unifying:** use the paired-clock conversion in [RUN-TRACING.md](RUN-TRACING.md#bisecting-the-stream), not capture-start anchoring; increment the page on a top-frame `Page.frameNavigated`; skip noisy methods (`Network.dataReceived`, `loadingFinished`, `*ExtraInfo`, `resourceChangedPriority`, `policyUpdated`, frame started, stopped and requested-navigation, JS dialog events, `Runtime.executionContext*`, `Target.targetInfoChanged` and `detachedFromTarget`, `Log.entryAdded`); truncate text to 500 characters.

## Tuning a hosted agent's prompt

The same loop with the system prompt as the variable (Browserbase Agents API, vendor). The outer agent is the teacher; each run is a rollout.

- **Commands:** `init --workspace --name`; `run --workspace --prompt prompts/iteration-NNN.md --label <l> [--max-messages N --timeout-ms]`; `inspect --label` (a numbered CALL and RESULT trajectory, inputs cut to 500 characters, outputs to 1000); `report` (a table of run, status, score, duration, messages, browser logs, missing required fields).
- **Defaults:** poll every 3000 ms, timeout 12 min, max 100 messages. Over budget: POST stop and keep polling to a terminal status so the artifacts are complete. Refuse a label that already has a run.
- **Persist the exact prompt per run** (the API returns only the newest). One agent per experiment, PATCHed each iteration; avoid concurrent prompt updates.
- **API:** base `https://api.browserbase.com/v1` (override `BROWSERBASE_API_BASE`), header `X-BB-API-Key`. `POST /agents {name, systemPrompt, resultSchema}`; `PATCH /agents/{id}`; `POST /agents/runs {agentId, task, resultSchema, variables: {k: {value, description}}}`; `GET /agents/runs/{id}`; `POST /agents/runs/{id}/stop`; `GET /agents/runs/{id}/messages?since=&limit=1-100&all=true` returns `{data: [{id, createdAt, message}], nextSince}`; `GET /sessions/{sessionId}/logs` (CDP records). Status runs PENDING, RUNNING, then COMPLETED, FAILED, STOPPED or TIMED_OUT. Read the output as `run.result?.output ?? run.result`; duration from `result.taskDuration`, else `endedAt - startedAt`.
- **Evidence:** tool calls and results are primary. Reasoning parts may have no readable text: never require hidden chain of thought. Read session logs only when browser-level evidence could change the diagnosis (a redirect, a 403, a failed request, a console error, a hidden endpoint). Empty logs can mean the agent used search or fetch tools and never drove the browser; that is not a failure.
- **Score:** `round(100 * (0.45 * requiredCoverage + 0.40 * regexAccuracy + 0.15 * completed)) - 10` per factuality warning, floor 0. A required field counts when the key is present, not undefined and not `""`.
- **State each change as a counterfactual:** "If the system prompt had instructed X, the Agent would have avoided Y, as shown by tool result Z." One attributable change per iteration. Typical fixes: cap retries after a repeated block or identical error; distinguish public from private ids; prefer search or fetch before launching a browser; separate current snapshots from dated history; define when a qualified fallback counts as complete; require `null`, not guesses; add a tool-call or evidence budget.
- **Hand off:** baseline versus winner (score, duration, messages), the first wrong turn each change fixed, whether logs added evidence, the winning prompt's path, confirmation results, limitations and the next holdout matrix.

## Oracles and judging

- **Completeness alone rewards confident wrong answers.** Combine run status, required-field coverage, regexes for known facts, regexes for factuality warnings (such as "submitted successfully"), and human review of provenance and safety. The regexes never go to the inner agent.
- **Result schema:** required outcome and evidence, explicit nullable fields, an outcome enum (success, blocked, partial, not-found), inputs echoed back to catch filter or date drift, `additionalProperties: false`.
- **The task states the goal and the result contract,** not the navigation solution.
- **Browser-result acceptance:** retain the task's filters, provenance, safety boundary and result contract. Apply the existing [keep/revert and plateau method](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md#hillclimbing) instead of rewarding a shorter failed run. [browserbase/skills, autobrowse; optimize-agent-prompt]
- **Converge on 2 passes of the last 3, one of them an unchanged rerun.** Don't call a prompt optimal from one task: test a holdout matrix (several sites, entities, result shapes and a different failure regime).
- **Encode forbidden irreversible actions before any run** (such as a real payment). Safety warnings penalize evidence of them, and no iteration broadens the agent's authority to complete the task. The harness enforces a budget, and the evaluator never rewards a shorter failed or unsafe run.

**Conflict, both views.** These browser sources graduate on two passes in the last three, including an unchanged prompt rerun. The existing agent-eval rule says a two-of-three case still has a real occasional failure and calls for at least three repetitions, five for flaky cases. Keep the browser threshold as its source-specific operational rule, not proof of production reliability; use the stricter [agent-eval criterion](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md#the-rules) for that job. [browserbase/skills, autobrowse; optimize-agent-prompt]; [existing agent-evals, rule 3]

## Prove it

The report shows each iteration's single change, the evidence it cites and its score; the final strategy passed 2 or more of the last 3 runs, and a final prompt passed 2 of the last 3 including one unchanged rerun; the holdout runs are listed with their results; and no run performed the forbidden action.
