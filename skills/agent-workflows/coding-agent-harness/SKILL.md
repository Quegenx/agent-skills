---
name: coding-agent-harness
description: "Configures workflows, session scheduling and completion instructions for an existing coding agent, maintains decision trails and scoped context pickup, coordinates long runs, and diagnoses recorded sessions. Use when operating or customizing a Codex or Claude-style development agent, resuming or reporting on coding work, investigating a costly or drifting run, or using the sourced Claude Code workflow and session-scheduler contracts."
---

# Coding-agent harness

Operate an existing coding agent using its actual host contract. Sources are the repository's agent-harness prompt and Claude Code workflow/scheduling guidance, plus obra/superpowers diagnosing-superpowers for session investigation. The Claude Code-specific APIs below apply to that host; they do not establish equivalent APIs in Codex or another agent. [existing agent-harness, PROMPT.md, WORKFLOWS.md and SCHEDULED-AGENTS.md; obra/superpowers, diagnosing-superpowers]

Decision trails, context pickup, catch-up reports and program coordination also draw on the supplied show-me-your-work, recall, ketchup and poteto-mode workflows. [new/skills/show-me-your-work, SKILL.md; new/skills/recall, SKILL.md; new/skills/ketchup, SKILL.md; new/skills/poteto-mode, playbooks/orchestrate.md]

| The job | Read |
|---|---|
| Choose the host branch and required evidence | [SKILL.md](SKILL.md) |
| Configure Claude Code dynamic workflows, templates and subagent model selection | [CLAUDE-WORKFLOWS.md](CLAUDE-WORKFLOWS.md) |
| Schedule work inside a Claude Code session, with expiry and resume limits | [SESSION-SCHEDULING.md](SESSION-SCHEDULING.md) |
| Set evidence-based coding completion instructions | [INSTRUCTIONS.md](INSTRUCTIONS.md) |
| Keep an attributable decision trail, rebuild scoped working context, coordinate a standing program or catch the human up | [OPERATOR-RUNS.md](OPERATOR-RUNS.md) |
| Investigate a recorded run, worker transcripts, drift, cost and a shareable evidence copy | [SESSION-DIAGNOSIS.md](SESSION-DIAGNOSIS.md) |

## Required references by branch

- **Delegated workflows:** read [agent-harness delegation packets](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) and its shared join/verification contracts. Host workflow support must already be available; this skill does not install it. [existing agent-harness, WORKFLOWS.md]
- **Session diagnosis:** read [code-research evidence rules](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md); for resource or savings claims use [agent-harness CONTEXT-COSTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CONTEXT-COSTS.md). The actual selected transcript or exposed history is required evidence. [obra/superpowers, diagnosing-superpowers; existing agent-harness, SESSION-DIAGNOSIS.md]
- **Product-agent construction is a separate job:** use [agent-harness](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/SKILL.md) when implementing the model/tool/runtime loop. Its database lease, chat UI, memory and production eval setup are not prerequisites for operating an existing host. [existing agent-harness, SKILL.md, Your own loop or an existing agent runtime]
- **Optional host extensions:** [skill-authoring](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/skill-authoring/SKILL.md) authors an installable skill; [jev-decisions](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/AGENTS.md) owns its selected Jev hooks. Neither is required for a session investigation. [existing skill-authoring, SKILL.md; existing jev-decisions, AGENTS.md]

## The rules

1. **Use the actual installed host.** Keep Claude Code workflow and scheduler behavior in their named branches; do not assume another host implements them. [existing agent-harness, WORKFLOWS.md, In Claude Code; SCHEDULED-AGENTS.md, Scheduling inside Claude Code]
2. **Keep shared delegation canonical.** Give workers bounded goals, evidence, ownership and acceptance, then check completed results rather than treating a stopped worker as successful. [bgauryy/octocode, octocode-subagent/references/packets.md; existing agent-harness, WORKFLOWS.md]
3. **A session schedule is not a durable deployment.** Preserve the selected host's documented lifecycle, expiration and resume limits. [existing agent-harness, SCHEDULED-AGENTS.md, Scheduling inside Claude Code]
4. **Identify the actual recorded session before diagnosing it.** Distinguish human messages, parent dispatches and worker transcripts, and retain evidence and coverage limits. [obra/superpowers, diagnosing-superpowers/references/session-discovery.md]
5. **Completion and cost claims need their evidence.** Report actual checks and units, missing execution and confounders; keep source history unchanged. [existing agent-harness, PROMPT.md and CONTEXT-COSTS.md; obra/superpowers, diagnosing-superpowers]
6. **Keep authorization with the task.** A workflow template, completion prompt or session evidence does not authorize broader edits, dependency installation or sharing. [owner AGENTS.md; obra/superpowers, diagnosing-superpowers/references/redaction-policy.md]

## Prove it

Only the selected host branch and references were used. Workflows retain their bounded delegation contract; schedules state their session limits; completion reports actual checks; and a diagnosis names the recorded session, decisive evidence and unexamined ranges. No production-agent infrastructure, unrun execution or unsupported host API is implied. [existing agent-harness, WORKFLOWS.md, SCHEDULED-AGENTS.md and PROMPT.md; obra/superpowers, diagnosing-superpowers]
