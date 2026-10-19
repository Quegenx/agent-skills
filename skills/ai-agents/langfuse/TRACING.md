# Tracing with Langfuse

Sources: [langfuse/skills, langfuse, references/instrumentation.md] and Langfuse's [observation-first API migration](https://langfuse.com/faq/all/deprecated-api-migration). Generic span propagation and collection remain in [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

## Integration and hierarchy

[langfuse/skills, langfuse, references/instrumentation.md]

- Inspect the installed framework and existing instrumentation before adding a second integration. Select the integration for that execution path.
- Represent the real work with the intended observation types and parent relationships. Keep agent, generation and tool boundaries meaningful; do not call every span a generation.
- Give each observation the input and output needed to understand that operation. A root input alone does not supply a child evaluator with its required fields.
- Instrument subagent dispatch without counting the same model work again as a separate generation.
- Preserve request, session and user context only within the application's permitted telemetry policy.
- Flush where the runtime needs it, then inspect a received trace. An instrumentation call returning locally is not proof that a hosted trace arrived.

## Reading observations

[https://langfuse.com/faq/all/deprecated-api-migration]

- Use bounded time windows and follow every cursor needed for the stated sample. Observation API v2 supports pages up to 1,000; the source's blanket 100-row cap described older access.
- Request the field groups required for the investigation. Distinguish a field not requested from a value that is actually null.
- Parse returned raw-string input/output according to the documented response shape; do not assume every API returns an already decoded object.
- Reconstruct trace/root relationships explicitly when working with observation rows. Counting rows is not counting distinct traces.
- Preserve original trace and observation identifiers in investigation evidence so scores and exports can be reconciled.

## Prove it

A received example has the intended root and children, meaningful permitted input/output and correct observation types; dispatch does not duplicate generation usage; pagination and requested fields cover the reported evidence; and missing delivery or content is reported as missing.
