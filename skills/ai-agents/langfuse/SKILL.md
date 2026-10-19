---
name: langfuse
description: "Instruments and operates Langfuse for LLM applications: traces and observation types, prompt versions and labels, datasets and scores, human review, evaluators and migrations. Use when Langfuse is selected or already installed, debugging its telemetry, managing prompts or evaluations, or moving a project to Langfuse."
---

# Langfuse

This skill uses [langfuse/skills, langfuse and migrate-to-langfuse], checked against Langfuse's official documentation and current public API definitions. Use it for a selected Langfuse integration. Generic evaluation methodology stays in [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md), and OpenTelemetry instrumentation stays in [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Confirm the deployment, project and supported interface | [The rules](#the-rules) |
| Instrument the application, preserve context and inspect received observations | [TRACING.md](TRACING.md) |
| Migrate prompt callers, compile text or chat prompts, deploy labels and preserve trace linkage | [PROMPTS.md](PROMPTS.md) |
| Work with datasets, feedback scores, annotation and evaluators | [EVALUATIONS.md](EVALUATIONS.md) |
| Move live or historical data, or upgrade observation-first project assets | [MIGRATION.md](MIGRATION.md) |

## The rules

1. **Confirm the host, project and installed versions first.** Cloud regions and self-hosted deployments are separate destinations. Read the deployment's compatibility guidance before choosing an SDK or endpoint; current upstream support does not prove the installed server supports it. [https://langfuse.com/faq/all/upgrade-to-langfuse-v4]
2. **Discover the actual supported operation before using it.** Prefer the current official API or the connected tool's declared schema over a remembered wrapper spelling. Current CLI documentation recommends `npx @langfuse/cli`; the source used `npx langfuse-cli`. An explicit host prevents destination ambiguity, although the CLI documents an EU default. [https://langfuse.com/docs/api-and-data-platform/features/cli]
3. **Keep credentials in the supported environment configuration,** out of prompts, reports and exported examples. Confirm the selected project before a write. [langfuse/skills, langfuse, references/cli.md]
4. **Inspect bounded evidence.** Observation-first reads use time bounds, cursor pagination and requested field groups. An unrequested field is unavailable evidence, not a measured null; one trace can contain many matching observations. [https://langfuse.com/faq/all/deprecated-api-migration]
5. **Measure the user's task before choosing a metric or changing a prompt.** Use the existing [evaluation contract](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/HARNESS.md); Langfuse is the storage and operation layer, not evidence that a metric measures correctness. [langfuse/skills, langfuse, references/setting-up-evals.md]
6. **Retain consent and content controls at capture time.** Follow the existing [telemetry privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md#the-rules) and inspect what each instrumentor actually emits. [langfuse/skills, langfuse, references/instrumentation.md]

## Prove it

The chosen host and project are explicit; SDK/server compatibility and connected operation schemas were checked; observations arrive with the intended hierarchy and permitted content; prompt and evaluator changes carry versions; and migration reports distinguish transferred records, recreated assets, reruns and unknowns. No paid run, account connection or recurring process is implied by this skill.
