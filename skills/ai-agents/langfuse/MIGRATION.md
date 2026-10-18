# Migration and observation-first upgrades

Sources: [langfuse/skills, migrate-to-langfuse, SKILL.md and references/reingest-history.md; langfuse, references/v4-project-migration.md], with Langfuse's current API/evaluator migration guides and OpenTelemetry's Span API. A vendor transfer and an upgrade of project assets are different jobs.

## Scope the transfer

[langfuse/skills, migrate-to-langfuse]

- Inventory live instrumentation, historical traces, prompts, datasets, score configurations, evaluators, rules and downstream exports separately.
- Identify which evidence transfers, which assets must be recreated and which historical results remain an export. Preserve the source until a sample transfer is reconciled.
- Keep original source IDs, timestamps, trace references and migration status in a ledger. Deterministic destination IDs do not by themselves prove backend deduplication.
- Account for destination ingestion cost before a historical transfer. Do not infer a free transfer from a free tier.
- Compare the same representative evidence through both paths before cutover; document the source/destination counts and unknowns.

## Historical time and identity

[https://opentelemetry.io/docs/specs/otel/trace/api/]

OpenTelemetry's Span API accepts an explicit start timestamp and an explicit end timestamp. The source said tracers offer no way to set historical timestamps or IDs and therefore raw OTLP is the only preservation route. Raw OTLP is the source's chosen method for exact record control, but timestamp impossibility is false. Verify destination identity, parent relationships and ingest behavior separately; a historical timestamp does not establish preserved identity or deduplication.

## Experiments and configuration

[https://langfuse.com/guides/cookbook/example_data_migration]

The migration cookbook leaves historical dataset run items behind, although the source implies their transfer with migrated traces. Preserve historical exports and distinguish rerunning an experiment from migrating its old result records. Current experiment APIs and supported operations differ from the older dataset-run model. Evaluator configuration support is documented in [EVALUATIONS.md](EVALUATIONS.md#supported-configuration-operations); do not repeat the cookbook's blanket no-API claim.

## Observation-first project upgrade

[https://langfuse.com/faq/all/deprecated-api-migration]

- Check deployment and SDK compatibility before changing access paths. Minimum compatibility is different from the latest SDK major.
- Migrate reads with their cursor pagination, time bounds, field selection and raw-string I/O handling. Reconstruct root identity where a trace-oriented caller previously assumed one row per trace.
- Inventory evaluator inputs and rule filters alongside the code. A target change can change score cardinality.
- Reconcile export schemas and downstream consumers before retiring the legacy path.

[https://langfuse.com/faq/all/llm-as-a-judge-migration]

Keep legacy rules until disabled successors have the right observation inputs, placement and result counts. Move the chosen target deliberately, record the review and retain a rollback path. Do not change production evaluator behavior merely because an endpoint name changed.

## Prove it

The inventory distinguishes transferred, recreated, rerun and retained-export assets; a sample preserves the required content, time and relationships; source/destination counts and cost assumptions are explicit; consumers read the new shape correctly; and cutover has reviewed evidence and a rollback path.
