# Managed and local evaluation evidence

Sources: [confident-ai/eval-skills, managed and portability references across eval-discover, eval-error-analysis, eval-dataset, eval-grade and eval-run]. Choose the existing local or hosted environment for the task; one received trace is not a reason to require a new account or a commercial migration.

## Preserve the evidence contract

[confident-ai/eval-skills, eval-discover, references/portability.md; eval-error-analysis, references/portability.md]

- Keep the original export alongside a normalized working representation and a mapping back to source IDs.
- Preserve inputs, references and actual outputs separately, plus labels, their real author and review status, model/prompt/grader versions, attempts and trace references.
- Unknown fields remain null or explicitly unavailable. Do not guess labels, usage, model identity or review approval to fill a destination schema.
- Evidence milestones are distinct: captured, reviewed, assigned to accepted modes, checked or graded, and accepted for a decision. A hosted record existing does not establish all of them.
- Reconcile a representative sample before switching exporters or retiring the source. State which fields and historical results cannot transfer.

## Moving graders and results

[confident-ai/eval-skills, eval-grade, references/managed.md]

A hosted judge unavailable locally is not replaced by an identically named but unvalidated grader. Recalibrate the actual replacement and establish a new baseline. Regrading stored outputs evaluates the grader; fresh application behavior is required to evaluate a changed agent ([HARNESS.md](HARNESS.md#repetitions-and-intervals)).

Preserve the selected destination's real schema instead of forcing every provider into one invented native format. Model support, account entitlements and pricing are deployment-specific. Cost claims require the actual call ledger and dated prices.

## Current Confident AI operation boundaries

[https://www.confident-ai.com/docs/reference/api/v2/traces/list-traces]

- The current REST trace-list route uses v2 with cursor and pageSize. A connected MCP wrapper must follow its declared schema; a snake_case example is not proof of that wrapper's current argument names.
- Metric collections use `metricsSettings` and metric objects. The source's api-managed reference used `metricSettings` and a metric name; do not copy that older shape. [https://www.confident-ai.com/docs/reference/api/v2/metric-collections/create-metric-collection]
- Evaluation rules use the selected API's data model, collection, sample rate and thread time limit. Do not infer a span rule's shape from a trace rule or copy an example that contradicts the documented applicability. [https://www.confident-ai.com/docs/reference/api/v2/evaluation-rules/create-evaluation-rule]
- Stored-output evaluation does not execute fresh agent behavior. Dataset evaluation can generate from an AI connection or prompt target; `aiConnectionId` and `promptAlias` are mutually exclusive, even though one official example includes both. Follow the documented contract. [https://www.confident-ai.com/docs/reference/api/v2/datasets/run-dataset-evaluation]

## Prove it

Original exports and source mappings remain available; a sample reconciles content, review status, versions and trace references; unknowns stay unknown; an unavailable judge is recalibrated rather than silently substituted; and every reported operation distinguishes regrading, fresh execution and a transferred historical result.
