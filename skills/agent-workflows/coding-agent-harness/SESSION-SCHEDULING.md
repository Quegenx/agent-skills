# Coding-agent session schedules

Claude Code session scheduling from the existing agent-harness SCHEDULED-AGENTS.md. Deployed scheduled agents, bookmarks, posting and durable runs remain in [agent-harness SCHEDULED-AGENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/SCHEDULED-AGENTS.md). [existing agent-harness, SCHEDULED-AGENTS.md, Scheduling inside Claude Code]

## Scheduling inside Claude Code

Claude Code's own scheduler (`/loop`, `CronCreate`) is session-scoped, so it suits in-session work and not a weekly job (https://code.claude.com/docs/en/scheduled-tasks):

- "Tasks only fire while Claude Code is running and idle. Closing the terminal or letting the session exit stops them firing."
- "Recurring tasks automatically expire 7 days after creation. The task fires one final time, then deletes itself." For longer, the docs name "Routines or Desktop scheduled tasks for durable scheduling".
- "No catch-up for missed fires": a time that passes while Claude is busy fires once when it is idle.
- Recurring tasks run late by a jitter (except every-five-minute tasks); one-shot tasks on the hour or half hour run up to 90 seconds early, so schedule them off those minutes.
- On `claude --resume` or `--continue`, `CronCreate` tasks come back except expired recurring and past one-shot ones; a self-paced `/loop` isn't restored.

A source that schedules weekly marketing loops with `CronCreate` [coreyhaines31/marketingskills, marketing-loops] gets about one run before the task expires; the corrected guidance is in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md#scheduling-a-loop). Deployed schedules (cron with a time zone) and durable steps are in the `background-jobs` skill.

## Stop a session schedule

In Claude Code, `CLAUDE_CODE_DISABLE_CRON=1` stops every session-scheduled task and `CronDelete <id>` removes one (https://code.claude.com/docs/en/scheduled-tasks). [existing agent-harness, SCHEDULED-AGENTS.md, Guardrails]

## Prove it

The chosen schedule uses the actual host's documented contract, and a session schedule is not described as a durable job. State the session lifecycle, expiration and resume limits relevant to the selected task, and report only scheduling or execution actually performed. [existing agent-harness, SCHEDULED-AGENTS.md, Scheduling inside Claude Code]
