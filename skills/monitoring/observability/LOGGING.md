# Structured logging

Generic log-event design, accumulated context, levels, schema and privacy guidance from the existing [PostHog logging source](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/INSTRUMENT-LOGS.md), with the existing OpenTelemetry privacy rule and the official trace-sampling boundary. Node logger/OTLP wiring is in [INSTRUMENT.md](INSTRUMENT.md#logs-that-point-to-their-trace); provider SDK options, person/replay fields, drop rules and the PII scrubber remain in PostHog.

## Wide events

[existing PostHog, INSTRUMENT-LOGS.md, Best practices]

- **Log what happened to requests, not what your code is doing.** Step-by-step lines ("Entering payment processing", "Calling Stripe API" ...) are useless at INFO; they are fine at DEBUG for race conditions, ordering and state machines, but not by default.
- **Make INFO logs wide events (a canonical log line):** one rich log per request per service.
- **Long-running, event-driven or multi-service workflows:** a hybrid, with a wide event at each stage boundary (job started, stage completed, job finished) carrying the full accumulated context.
- **Structured JSON, not plain text.** Log search works across all fields; every key-value pair is filterable.

## Context and schema

[existing PostHog, INSTRUMENT-LOGS.md, Best practices]

- **Business context:** Who (user ID, account type, tier, org), What (order ID, cart, item count, feature flags), Where (service, version, region), How (payment method, auth provider, API version), How much (amount, quantity, retry count).
- **Resource attributes, set once at start:** `service.name`, `deployment.environment.name`, `service.version`, `cloud.region`.

The official resource attribute is `deployment.environment.name`; the PostHog source used the deprecated `deployment.environment`. [OpenTelemetry deployment attribute registry](https://opentelemetry.io/docs/specs/semconv/registry/attributes/deployment/)

- **Bind only scalars** (strings, numbers, booleans); never full API responses or large results (payload limits, memory).
- **Crash safety:** a global exception handler or `finally` that flushes the collected context; long jobs emit "started" and "checkpoint" logs.
- **Treat the log schema as an API contract.** Renaming `error_type` to `err_code`, or changing the type of `duration_ms`, silently breaks dashboards and alerts: communicate, and deprecate before removing.

The source's context preference is subject to the existing [minimal-identifier/privacy rule](SKILL.md#the-rules): opaque or hashed IDs can still identify people. Keep the source's PostHog-specific cardinality/ClickHouse claims at its provider owner. [existing observability, SKILL.md, rules5-6], [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

## Levels and overhead

[existing PostHog, INSTRUMENT-LOGS.md, Best practices]

The following are log-level literals and uses, not incident-impact rankings. Findings use P0 to P3.

| Level | Use |
| --- | --- |
| ERROR | Failed and needs attention. If no one ever looks at an error log, it's not an error, it's noise. |
| WARN | Unexpected but no failure (a retry succeeded on the 3rd attempt, a deprecated API) |
| INFO | Normal operations worth recording |
| DEBUG | Active debugging detail; off in production by default |

- **Logging library:** structured output, async or buffered writes, low per-call overhead; the OTel bridge adds minimal overhead; benchmark under realistic load.

## Privacy and correlation

[existing PostHog, INSTRUMENT-LOGS.md, Best practices]

- **Never log:** secrets (API keys, passwords, tokens, card numbers); request or response bodies (log status, content length, duration); unneeded PII (hash or tokenize; even `posthogDistinctId` or `email` may need masking under GDPR or HIPAA); high-frequency health checks; needless duplication (but include the downstream outcome you'd need).

Apply the [configured automatic or manual correlation path](INSTRUMENT.md#logs-that-point-to-their-trace) for the selected logger; the source's automatic-propagation shorthand does not replace that wiring. Minimize identifiers under the existing privacy rule before adding the source's business context. [existing observability, INSTRUMENT.md, Logs that point to their trace and Request context]

## Sampling scope

The OpenTelemetry Collector tail-sampling processor groups spans by trace ID and supports traces, rather than direct log records. Policies operate within its arrival, buffering, loss and policy constraints; they are not a guarantee that every error or slow trace survives. The PostHog source incorrectly directed generic log tail sampling to this trace processor. [Official tail-sampling processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md)

For trace sampling, read [INSTRUMENT.md](INSTRUMENT.md#sampling). PostHog log drop/rate-limit policies and their order remain in [posthog INSTRUMENT-LOGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/INSTRUMENT-LOGS.md#best-practices). [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

## Prove it

[existing PostHog, INSTRUMENT-LOGS.md, Best practices], [existing observability, SKILL.md, rules4-6]

- Request logs use structured fields, accumulated scalar context and stable field names/types; long workflows keep their stage-boundary checkpoints.
- INFO records describe outcomes; DEBUG detail follows the selected debugging policy.
- Correlated records carry the selected trace/span key convention, matching the configured backend.
- Secrets, request/response bodies and unneeded personal data are absent; opaque or hashed identifiers are reviewed for the stated diagnostic purpose.
- Trace-sampling configuration and provider log-ingestion policies are verified as different signal paths.
