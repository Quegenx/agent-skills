# Scripts, setup, memory and hooks

Some of the most effective skills in Claude Code use its configuration options and the folder structure well: the folder can carry code Claude composes, a config file it fills in with the user, a log it reads back next time, hooks that switch on only while the skill is in use, and workflow files it adapts. This file covers each.

## Scripts and helper libraries

- **Code is one of the most powerful tools you can give Claude.** Scripts and libraries let Claude spend its turns on composition, deciding what to do next, rather than reconstructing boilerplate.
- **Ship a small library of helpers with the gotchas in the docstrings:** a `data-science` skill might hold `lib/signups.py` with helper functions `fetch`, `by_referrer` and `by_landing_page`, whose docstrings record data gotchas such as `user_id` being null until after signup.
- **Let Claude generate the one-off script:** for a prompt like "What happened on Tuesday?", Claude writes `investigate.py`, importing those helpers to compare Monday and Tuesday signups by referrer and landing page, and concludes that something broke on the homepage on Tuesday.
- **Scripts make checks robust:** code quality skills can include deterministic scripts or tools for maximum robustness, and verification skills enforce programmatic assertions on state at each step through scripts (see [CATEGORIES.md](CATEGORIES.md)).

## Setup

- **Ask for what the skill can't know:** some skills need context from the user first. A skill that posts your standup to Slack should have Claude ask which Slack channel to post it in.
- **Keep it in a `config.json` in the skill directory:** the standup-post example's SKILL.md has a "Your config" section that runs a shell command reading `config.json` and echoing `NOT_CONFIGURED` if it is missing; when unconfigured, the instructions tell Claude to ask for the Slack channel and a sample standup, then save the answers.
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

Every script or helper the skill ships is named in SKILL.md with when to use it, and its gotchas sit in its docstrings; a skill that needs user context checks for its config and asks when it is missing instead of guessing; a skill with memory reads its log before acting and writes to a stable directory; hooks that block destructive commands or edits are on-demand, not always on; workflow files are referenced from SKILL.md and described as templates.
