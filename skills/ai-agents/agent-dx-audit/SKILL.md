---
name: agent-dx-audit
description: "Audits whether agents can complete a product's getting-started task using its docs, SDK or skill, recording onboarding outcomes, friction, discovery provenance and a report. Use when evaluating documentation or SDK onboarding for coding agents, auditing a SKILL.md through attempted tasks, or comparing setup paths."
---

# Agent developer-experience audit

This skill uses [browserbase/skills, agent-experience], with the existing [c15t, writing-docs], [Vercel, writing-guidelines] and [coreyhaines31/marketingskills, marketing-loops] additions retained from the repository's documentation audit. Several subagents attempt a real task against a named product's docs, SDK or skill; the audit records what they fetched, where they failed and what they actually achieved. Generic evaluation methodology remains in [agent-evals](../agent-evals/SKILL.md).

| The job | Read |
|---|---|
| Select this skill, its boundaries and required evidence | [SKILL.md](SKILL.md) |
| Choose the target and task, configure agents and credentials, capture traces, score onboarding and write the report | [ONBOARDING-AUDIT.md](ONBOARDING-AUDIT.md) |

## The rules

1. **Audit only the target the user named.** Keep target selection product-agnostic and give each agent one abstract task: [the principle](ONBOARDING-AUDIT.md#the-principle) and [setting the goal](ONBOARDING-AUDIT.md#setting-the-goal). [browserbase/skills, agent-experience]
2. **Keep personas and setup choices explicit.** Use the existing [configuration](ONBOARDING-AUDIT.md#configuration) and [prompt workflow](ONBOARDING-AUDIT.md#the-prompts), including a task per documented setup path. [browserbase/skills, agent-experience; c15t, writing-docs]
3. **Keep credential selection within approved scope and values private.** Follow [the credential boundary](ONBOARDING-AUDIT.md#credentials), including the retained correction to the source's silent candidate selection. [browserbase/skills, agent-experience source conflict; user authorization]
4. **Judge observed outcomes against the trace.** Retain prose and structured evidence, distinguish URL provenance and unknown origin, and label estimates: [analysis](ONBOARDING-AUDIT.md#analysis) and [scoring](ONBOARDING-AUDIT.md#scoring). [browserbase/skills, agent-experience]
5. **Report the evidence and its limits.** Use the existing [write-up](ONBOARDING-AUDIT.md#the-write-up); state what was exercised and what was checked only against source. [browserbase/skills, agent-experience; c15t, writing-docs]

## Prove it

Every agent's prompt, task outcome and trace are retained; credential values stay out of the report; status counts add up to the agents spawned; fetched URLs carry provenance labels; claimed resources were spot-checked when credentials allowed it; and the report respects the success-rate and hallucination caps in [the audit's Prove it](ONBOARDING-AUDIT.md#prove-it). [browserbase/skills, agent-experience]
