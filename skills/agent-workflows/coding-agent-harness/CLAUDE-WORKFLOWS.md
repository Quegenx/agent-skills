# Claude Code workflows

Host-specific workflow configuration from the existing agent-harness WORKFLOWS.md. Shared fan-out, delegation, join coverage and review contracts remain in [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md). These Claude Code APIs are not a contract for another installed host. [existing agent-harness, WORKFLOWS.md, In Claude Code]

## In Claude Code

- **A dynamic workflow** is a JavaScript file: `agent(prompt, opts)` spawns one subagent (`prompt` required; `schema` returns validated JSON, `model` picks opus, sonnet or haiku, `isolation` is worktree or remote, `agentType` selects a subagent), `parallel()` fans out and waits for all, `pipeline()` streams each item through every stage, plus standard JavaScript (JSON, Math, Array). The trigger word `ultracode` makes Claude Code create one. An interrupted workflow picks up where it left off when the session resumes.
- **Static workflows** (the Agent SDK, `claude -p`) must handle every edge case, so they stay generic; a dynamic one is written for the task in front of it (a provider migration that reads the billing code, checks each feature against the new provider's docs, prices it at real volume and runs a devil's advocate).
- **Saving and sharing:** press `s` in the workflow menu to save; check workflows into `~/.claude/workflows` or put the `.workflow.js` files in a skill folder, referenced from its SKILL.md, and tell Claude to treat them as a template, not a script to run verbatim. For scale: a review-changes run took 14 agents, 482k tokens and 6m 12s; a deep-research run 22 agents, 1.1M tokens and 11m 3s.
- **Embed an established coding harness in a product:** use the [product runtime-selection reference](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/SKILL.md). [existing agent-harness, WORKFLOWS.md, In Claude Code]
- **Subagent models:** `model: haiku` or `model: sonnet` in a subagent's definition; `CLAUDE_CODE_SUBAGENT_MODEL` sets every subagent; a definition's model overrides the variable; with neither, a subagent runs on the main model.


## Prove it

The selected host supports the workflow API being used; the workflow is a task-specific template; the shared delegation contract applies when workers are dispatched; and the report identifies actual execution and unperformed checks. [existing agent-harness, WORKFLOWS.md, In Claude Code and Delegation packets]
