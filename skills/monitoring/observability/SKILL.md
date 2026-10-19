---
name: observability
description: "Instruments services with OpenTelemetry traces, metrics and structured logs, collectors and health checks, and guides incident response and postmortems. Use when adding telemetry, diagnosing monitoring graphs, responding to an incident or defining health checks."
---

# Observability

When a request fails halfway through three services and a queue, the question is "where, and for whom?". Traces answer where (one tree of timed spans per request), metrics answer how often and how much (counts and distributions over time), logs answer what exactly happened at a point (structured events tied to the trace). OpenTelemetry produces all three in one vendor-neutral format (OTLP), so you instrument once and change backends by configuration. Read the file for the job:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Wire the Node SDK, custom spans and metrics, log correlation, request context, errors, sampling, tracing through queues | [INSTRUMENT.md](INSTRUMENT.md) |
| Where telemetry goes: direct export, one collector, agent plus gateway, local stacks, Grafana Cloud | [COLLECTOR.md](COLLECTOR.md) |
| Liveness and readiness endpoints and what they check | [HEALTH.md](HEALTH.md) |
| Read monitoring graphs and diagnose traffic, latency, error, saturation, pool and queue patterns | [DIAGNOSE.md](DIAGNOSE.md) |
| Triage and mitigate an incident, observe a deploy, compare slow trends and write the postmortem | [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md) |
| Design structured/wide log events, context, levels, schema and privacy; distinguish log policies from trace sampling | [LOGGING.md](LOGGING.md) |

## The rules

1. **Start with automatic instrumentation,** then add spans only for business operations that the automatic ones don't show (`PlaceOrder`, `ImportCatalog`). A span per trivial function is noise and cost.
2. **One trace per request, end to end.** Context must cross every boundary: HTTP (the `traceparent` header, automatic), queues and jobs (inject into message headers, extract in the consumer), and the browser if you measure real users. A trace that breaks at the queue hides exactly the part that fails.
3. **Name things consistently.** Every process sets `service.name` (and `service.version`, `deployment.environment.name`); spans and metrics use stable names and OpenTelemetry's semantic attribute names where one exists (`http.response.status_code`, `db.system.name`). The old rule used the deprecated `deployment.environment` and `db.system` attributes. https://opentelemetry.io/docs/specs/semconv/registry/attributes/deployment/ and https://opentelemetry.io/docs/specs/semconv/registry/attributes/db/
4. **Logs are structured and correlated.** The canonical [event, context, level, schema and privacy guidance](LOGGING.md) applies; [INSTRUMENT.md](INSTRUMENT.md#logs-that-point-to-their-trace) owns automatic and manual logger wiring. [existing observability, INSTRUMENT.md], [existing PostHog, INSTRUMENT-LOGS.md, Best practices]
5. **Bound metric cardinality.** Every distinct label combination is a separate time series. Status, route template, region, plan: fine. User ID, order ID, raw URL, email: never as metric labels; put them on spans and logs.
6. **No personal data in telemetry by default.** Collect only identifiers needed for the diagnostic purpose; opaque IDs and hashes can still identify people. No request bodies, tokens or SQL parameters with user values. Telemetry is copied into more systems and kept longer than the database it describes; have a retention period and a way to purge. The source and old wording treated opaque user IDs as inherently free of personal information. https://opentelemetry.io/docs/security/handling-sensitive-data/
7. **Sample at the root, keep traces whole.** A parent-based sampler follows the caller's decision, so a trace is recorded in every service or in none. Fragments are worse than nothing.
8. **Telemetry must not take the app down.** Export is asynchronous and bounded; a backend outage drops or buffers telemetry, never blocks requests. Flush on shutdown so the last seconds before a crash or deploy aren't lost.
9. **Fail loudly on misconfiguration.** A missing exporter endpoint should fail at startup, not run for weeks silently exporting nowhere.

## Prove it

For tracing implementation, use the HTTP/database/queue and correlated-log check below on the boundaries involved. For metrics, use the label check; for export resilience, use the backend-outage check. Incident response, health-check and log-design tasks use their routed topic's checks without adding unrelated tracing infrastructure.

Send one request that crosses an HTTP hop, a database query and a queue, and show it as a single trace with the consumer's spans under the producer's. From that trace, open its logs and see the same trace ID. Show one business metric with its labels and confirm none of them is unbounded. Stop the telemetry backend: requests still succeed and their latency doesn't change.
