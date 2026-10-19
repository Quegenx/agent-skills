# Scripts, setup, memory and hooks

Some of the most effective skills in Claude Code use its configuration options and the folder structure well: the folder can carry code Claude composes, a config file it fills in with the user, a log it reads back next time, hooks that switch on only while the skill is in use, and workflow files it adapts. This file covers each.

## Scripts and helper libraries

- **Code is one of the most powerful tools you can give Claude.** Scripts and libraries let Claude spend its turns on composition, deciding what to do next, rather than reconstructing boilerplate.
- **Ship a small library of helpers with the gotchas in the docstrings:** a `data-science` skill might hold `lib/signups.py` with helper functions `fetch`, `by_referrer` and `by_landing_page`, whose docstrings record data gotchas such as `user_id` being null until after signup.
- **Let Claude generate the one-off script:** for a prompt like "What happened on Tuesday?", Claude writes `investigate.py`, importing those helpers to compare Monday and Tuesday signups by referrer and landing page, and concludes that something broke on the homepage on Tuesday.
- **Take repeatable mechanics away from the model:** Vercel's design.md agents "kept inventing their own typography, spacing, and layout, so we took those decisions away from the model entirely" with a published stylesheet whose classes and tokens the guidance documents. "Keep your judgment in prose, and push the repeatable mechanics into CSS or deterministic checks" ([design.md](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md)).
- **Document the API, keep the source out of context:** "the agent never actually reads the stylesheet itself. The stylesheet loads when the page renders... none of the code enters the model's context, saving more room for design guidance." The file says "Use the public API documented below; do not read the stylesheet implementation into context", and never to "inspect the CSS for internal selectors, guess a `vbg-*` class, or extrapolate a name from another primitive."
- **Scripts make checks robust:** code quality skills can include deterministic scripts or tools for maximum robustness, and verification skills enforce programmatic assertions on state at each step through scripts (see [CATEGORIES.md](CATEGORIES.md)).
- **Lint rules explain and fix:** in Vercel's product-design setup, "Each rule explains why the pattern is a problem and suggests a concrete fix. Some rules autofix safe migrations, such as replacing deprecated Tailwind utility names." Linters "are fast and cheap to run, so developers and coding agents get feedback while they work instead of waiting for a later review." Which rules belong in a linter is in [WRITING.md](WRITING.md).

## Scripts that feed an agent

Vercel's `vercel-optimize` runs a pipeline of a dozen scripts, each a thin command-line shell over a library, with agents in between; these are the conventions that keep it trustworthy [Vercel, vercel-optimize]. What the pipeline does is in [Telemetry audit](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/TELEMETRY-AUDIT.md).

- **One output contract:** every script prints its JSON to stdout and its status to stderr with a `[script-name]` prefix; a fatal error prints `[name] FAILED: <msg>` and exits 1, a contract or precondition failure exits 2. "Every JSON-emitting script must be deterministic: stable key order, stable sort order, 2-space indentation, trailing newline. If a consumed schema changes, update the schema version and the fixture tests in the same PR." "No runtime dependencies."
- **Never overwrite a run:** a write fails with "output file already exists: … Use a fresh run directory or pass --force to overwrite.", and the brief writer opens files with `flag: 'wx'`.
- **Fail hard on the wrong context, not "no data":** "--cwd is load-bearing: the Vercel CLI resolves project/team from cwd's .vercel/project.json. Outside the project, metric queries silently hit the wrong team and look like 'no traffic'." The script exits 2 when the link is missing or names a different project or account than the earlier step recorded.
- **Read structured output before error text:** "CLI error message strings are not stable contracts - they can change between versions." Parse the exit code and stdout JSON first and fall back to a stderr substring; an unknown error is missing data, and the run continues. "The categories exist to give the user better error messages, not to drive control flow." One failed query degrades only that metric, and every query uses one shared time window: "Mixing windows silently produces incompatible rollups". Shell-outs use `execFile`, not `exec`.
- **Plug-in scanners:** "New scanners drop into lib/scanners/ + the barrel; this file is closed for modification." Each scanner exports metadata (`id, title, severity, billingDimension, trafficIndependent, includeGlobs, description, fix, citations`); it may be sync or async, and one that throws is logged and skipped.
- **Reference docs generated from that metadata, with a freshness gate:** two reference files are rendered from the scanners' and gates' `metadata` exports, "the source of truth", under the banner `<!-- THIS FILE IS GENERATED by scripts/build-docs.mjs. Do not edit by hand. -->`. A CI check renders them in memory, diffs, and exits 1 with "is stale. Run `node scripts/build-docs.mjs` and commit." Its renderer "MUST stay byte-identical to build-docs.mjs renderers". The citation list is linted the same way, offline ([agent-harness CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CHECKS.md#rewriting-and-dropping-a-finished-answer)).

## Setup

- **Ask for what the skill can't know:** some skills need context from the user first. A skill that posts your standup to Slack should have Claude ask which Slack channel to post it in.
- **Keep it in a `config.json` in the skill directory:** the standup-post example's SKILL.md has a "Your config" section that runs a shell command reading `config.json` and echoing `NOT_CONFIGURED` if it is missing; when unconfigured, the instructions tell Claude to ask for the Slack channel and a sample standup, then save the answers.
- **User extensions live in the project, not the skill folder:** marketingskills' `marketing-council` saves a user's custom advisor to "`.agents/advisors/<name>.md` in the user's project so it persists and never collides with repo updates"; for a private person (the user's old boss), "have the user supply the positions; do not invent them" [coreyhaines31/marketingskills, marketing-council].
- **Use AskUserQuestion for structured choices:** to have the agent present structured, multiple-choice questions, instruct Claude to use the AskUserQuestion tool.

## Memory

- **A skill can remember by storing data:** anything from an append-only text log or JSON files to a SQLite database.
- **Read back its own history:** a `standup-post` skill might keep a `standups.log` with every post it has written, so the next time it runs Claude reads its own history and can tell what has changed since yesterday. In business-process skills, saving previous results in log files helps the model stay consistent and reflect on previous executions.
- **Store it in a stable directory:** the environment variable `${CLAUDE_PLUGIN_DATA}` gives a stable directory for data; see the [persistent data directory](https://code.claude.com/docs/en/plugins-reference#persistent-data-directory) reference.

## On-demand hooks

- **Hooks scoped to the skill:** skills can include hooks that are activated only when the skill is called and last only for the duration of the session. Use them for opinionated hooks you don't want running all the time but that are extremely useful sometimes.
- **`/careful`:** blocks `rm -rf`, `DROP TABLE`, force-push and `kubectl delete` via a PreToolUse matcher on Bash. You only want this when you know you're touching prod; having it always on would drive you insane.
- **`/freeze`:** blocks any Edit or Write that's not in a specific directory. Useful during debugging: "I want to add logs but I keep accidentally 'fixing' unrelated code."
- **Review skills can run from hooks:** code quality and review skills can run automatically as part of hooks or inside a GitHub Action.

## Workflow files

- **Ship dynamic workflows inside the skill:** put the JavaScript workflow files in the skill folder and reference them from `SKILL.md`, for example `~/.claude/skills/deep-verify/` holding `SKILL.md`, `verify-claims.workflow.js` and `rubric.md`, where SKILL.md references `./verify-claims.workflow.js` to check each claim with its own subagent.
- **Call them templates:** for more flexibility, prompt Claude to think of the workflows in the skill as a template instead of a script that needs to be run verbatim.
- **Save a workflow to share it:** press "s" in the workflow menu to save a workflow; check it into `~/.claude/workflows` or distribute it via a skill. The published `/deep-research` skill is one built on dynamic workflows: it fans out web searches, fetches sources, adversarially verifies their claims and synthesizes a cited report.

## Prove it

Every script or helper the skill ships is named in SKILL.md with when to use it, and its gotchas sit in its docstrings; a bundled asset is used through its documented API, not read into context; a skill that needs user context checks for its config and asks when it is missing instead of guessing; a skill with memory reads its log before acting and writes to a stable directory; hooks that block destructive commands or edits are on-demand, not always on; workflow files are referenced from SKILL.md and described as templates. A script whose JSON another step reads gives byte-identical output for the same input, refuses to overwrite an earlier run, and exits 2 on a contract or context error; a generated reference file has a CI check that fails when it is stale.
