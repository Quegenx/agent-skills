# Evaluations and review in Langfuse

Sources: [langfuse/skills, langfuse, references/setting-up-evals.md, create-dataset.md, user-feedback.md, error-analysis.md and judge-calibration.md], checked against Langfuse's current evaluator and API migration documentation. Generic datasets, human review and judge validation stay in [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md).

## Datasets and observed feedback

[langfuse/skills, langfuse, references/create-dataset.md and user-feedback.md]

- Keep case input, independently reviewed reference and actual output separate. Use the existing [case contract](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/HARNESS.md) rather than a second dataset methodology.
- Attach a score to the intended trace or observation, with the correct type and identity.
- Name feedback for the observed signal: an explicit rating, correction or other captured event. Do not declare a proxy to be quality without validating that interpretation.
- Explain the capture cost and bias before adding new feedback plumbing. Product UI still follows the owner's components and design.

## Human annotation

[langfuse/skills, langfuse, references/error-analysis.md]

- Review the actual trace content needed for the judgment. Link notes and labels to their target rather than supplying an identifier alone.
- Use the [review and taxonomy workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/REVIEW-AND-TAXONOMY.md) for definitions, membership and unresolved evidence.
- Inspect the selected supported operation before promising queue edits, config membership changes or deletion. The source said annotation queues cannot be updated or deleted after creation; the current queue editor supports updates, while the public API exposes a narrower set of operations. [https://github.com/langfuse/langfuse/blob/main/web/src/features/annotation-queues/components/AnnotationQueueFormDialogController.tsx]
- Distinguish archival from destructive deletion. The current score-config operation archives through `isArchived`; the source's blanket deletion statement does not describe that operation. [https://github.com/langfuse/langfuse/blob/main/fern/apis/server/definition/score-configs.yml]

## Evaluators and target observations

[https://langfuse.com/faq/all/llm-as-a-judge-migration]

- All evaluator inputs must exist on the selected target observation. Do not assume trace-root fields are inherited by a child.
- Decide whether the contract targets a root or a selected component observation. Multiple matching observations can produce multiple scores, so verify both placement and result counts.
- Calibrate against independent human labels using [agent-evals JUDGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/JUDGES.md); do not use an unverified universal human-agreement threshold.
- Keep successor evaluators/rules disabled until inputs, target selection and score counts have been reviewed, then preserve version and approval evidence.

## Supported configuration operations

[https://github.com/langfuse/langfuse/blob/main/fern/apis/server/definition/evaluators.yml]

Current public source defines `POST /api/public/v2/evaluators` for LLM-as-a-Judge definitions, stable evaluator IDs and version history. The source's historical-migration reference said these configurations were not migratable through an API, and another reference proposed an unstable API. Use the selected server's supported schema; recreate and recalibrate when semantics cannot be transferred rather than promising universal migration or universal impossibility.

## Prove it

Scores attach to the intended target with the intended type; feedback names the signal actually observed; human review can see its evidence; evaluator inputs exist on each matching observation; result counts match target cardinality; and configuration changes distinguish supported update, archival, recreation and unavailable operations.
