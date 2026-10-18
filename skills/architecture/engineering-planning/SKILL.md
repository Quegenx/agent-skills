---
name: engineering-planning
description: "Turns an engineering request into resolved decisions, a user-centered specification, dependency-aware tickets or a self-contained implementation handoff. Use when shaping a feature, investigating an ambiguous design, writing an RFC or planning work across sessions."
---

# Engineering planning

Resolve the uncertainty that matters to the requested outcome, then choose the smallest useful planning artifact. Sources are Matt Pocock's grilling, questionnaires, specs, tickets, wayfinder and wizard; obra/superpowers' brainstorming and writing-plans; shadcn's improve planning and reconciliation references; and Octocode's RFC and prerequisite references. Source workflows do not expand the user's authorization.

| The job | Read |
|---|---|
| Choose the artifact and define the planning boundary | [SKILL.md](SKILL.md) |
| Interview a decision owner or prepare an asynchronous questionnaire | [INTERVIEWS.md](INTERVIEWS.md) |
| Synthesize a specification and split deliverable tickets | [SPECS-AND-TICKETS.md](SPECS-AND-TICKETS.md) |
| Find the route through a large effort with unresolved decisions | [DECISION-MAPS.md](DECISION-MAPS.md) |
| Prepare an implementation plan for an executor without conversation history | [HANDOFF-PLANS.md](HANDOFF-PLANS.md) |
| Develop and audit a consequential proposal | [RFC.md](RFC.md) |
| Guide a human through steps requiring their access or judgment | [MANUAL-STEPS.md](MANUAL-STEPS.md) |

## The rules

1. **Start with the outcome and current evidence.** Identify what should change, why, the accepted constraints and non-goals. Read the relevant implementation, conventions and existing decisions before treating an assumption as a requirement. [obra/superpowers, brainstorming/SKILL.md] [mattpocock/skills, to-spec/SKILL.md]
2. **Use the smallest planning surface that fits.** Clear, bounded work can proceed directly; uncertain design needs discussion; a conversation already containing the decisions needs synthesis. A decision map is for a route too large and unclear to hold in one session. [obra/superpowers, brainstorming/SKILL.md] [mattpocock/skills, to-spec/SKILL.md, wayfinder/SKILL.md]
3. **Separate discoverable facts from user decisions.** Investigate code, configuration and documentation yourself. Ask about a consequential preference or unresolved choice, with a recommendation and the tradeoff. Let independent work continue while a prerequisite remains unsettled. [mattpocock/skills, grilling/SKILL.md]
4. **Give each fact and decision one home.** Use the domain glossary, link accepted decision records, and put each decision map's detailed answer in its ticket. A summary points to the owner rather than becomes a second definition. [mattpocock/skills, domain-modeling/SKILL.md, wayfinder/SKILL.md]
5. **Make dependencies and completion observable.** Describe the complete behavior each ticket delivers, its true blockers, and acceptance that can pass or fail. Handoff tasks also declare consumed and produced interfaces consistently. [mattpocock/skills, to-tickets/SKILL.md] [obra/superpowers, writing-plans/SKILL.md]
6. **Keep durable intent distinct from live instructions.** A specification records the accepted behavior and decisions; an execution handoff carries exact current paths, excerpts, commands and drift checks. Use the appropriate artifact rather than filling every spec with soon-stale implementation detail. [mattpocock/skills, to-spec/SKILL.md] [shadcn/improve, improve/references/plan-template.md]
7. **Expose missing proof.** A prerequisite is satisfied only by the stated evidence; otherwise record the missing proof, owner, next check and what it blocks. Do not make an uncertain claim carry a recommendation. [bgauryy/octocode, octocode-rfc-generator/references/rfc-prerequisites.md, octocode-rfc-generator/references/rfc-template.md]

## Related owners

- Contract violations and causal diagnosis: [debugging](../debugging/SKILL.md). [bgauryy/octocode, octocode-research/references/problem-framing.md]
- Domain terms and accepted decision records: [GLOSSARY-AND-ADRS.md](../domain-modeling/GLOSSARY-AND-ADRS.md). [mattpocock/skills, domain-modeling/SKILL.md]
- A concrete experiment to resolve a logic question: [PROTOTYPES.md](../software-architecture/PROTOTYPES.md). [mattpocock/skills, prototype/LOGIC.md]
- Executing an accepted plan, dispatching tasks and tracking progress: [PLAN-EXECUTION.md](../../ai-agents/agent-harness/PLAN-EXECUTION.md). [obra/superpowers, writing-plans/SKILL.md]

## Gotchas

- A question whose answer depends on another unanswered question is premature. Settle its prerequisite first. [mattpocock/skills, grilling/SKILL.md]
- A layer-only ticket can leave nothing independently demonstrable. Use the wide-refactor exception only when a real shared change makes vertical delivery impossible. [mattpocock/skills, to-tickets/SKILL.md]
- A plan marked complete can still describe work absent from current code. Reconcile against the implementation, not its checkboxes. [shadcn/improve, improve/references/closing-the-loop.md]

## Prove it

[obra/superpowers, writing-plans/SKILL.md] [mattpocock/skills, to-tickets/SKILL.md] [shadcn/improve, improve/references/plan-template.md]

The artifact states the outcome, boundaries, settled decisions and unresolved prerequisites. Tickets deliver complete observable behavior with genuine blockers. A handoff can be followed without the prior conversation and can detect when its assumptions no longer match the repository. Any execution or publishing step remains within the user's existing authorization.
