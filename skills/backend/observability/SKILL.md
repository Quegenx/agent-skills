---
name: observability
description: "Instruments services with OpenTelemetry traces, metrics and logs, the collector, and liveness and readiness checks. Use when adding tracing or metrics, debugging across services, or defining health checks."
---

# Observability

When a request fails halfway through three services and a queue, the question is "where, and for whom?". Traces answer where (one tree of timed spans per request), metrics answer how often and how much (counts and distributions over time), logs answer what exactly happened at a point (structured events tied to the trace). OpenTelemetry produces all three in one vendor-neutral format (OTLP), so you instrument once and change backends by configuration. Read the file for the job:

| The job | Read |
|---|---|
| Wire the Node SDK, custom spans and metrics, log correlation, request context, errors, sampling, tracing through queues | [INSTRUMENT.md](INSTRUMENT.md) |
| Where telemetry goes: direct export, one collector, agent plus gateway, local stacks, Grafana Cloud | [COLLECTOR.md](COLLECTOR.md) |
| Liveness and readiness endpoints and what they check | [HEALTH.md](HEALTH.md) |
| Read a dashboard, diagnose an incident, check a deploy, write the postmortem | [DIAGNOSE.md](DIAGNOSE.md) |

## The rules

1. **Start with automatic instrumentation,** then add spans only for business operations that the automatic ones don't show (`PlaceOrder`, `ImportCatalog`). A span per trivial function is noise and cost.
2. **One trace per request, end to end.** Context must cross every boundary: HTTP (the `traceparent` header, automatic), queues and jobs (inject into message headers, extract in the consumer), and the browser if you measure real users. A trace that breaks at the queue hides exactly the part that fails.
3. **Name things consistently.** Every process sets `service.name` (and `service.version`, `deployment.environment`); spans and metrics use stable names and OpenTelemetry's semantic attribute names where one exists (`http.response.status_code`, `db.system`).
4. **Logs are structured and correlated.** Key-value fields, not interpolated sentences; every log line inside a request carries `trace_id` and `span_id`, so a trace view can list its logs.
5. **Bound metric cardinality.** Every distinct label combination is a separate time series. Status, route template, region, plan: fine. User ID, order ID, raw URL, email: never as metric labels; put them on spans and logs.
6. **No personal data in telemetry by default.** Opaque IDs, not emails or names; no request bodies, tokens or SQL parameters with user values. Telemetry is copied into more systems and kept longer than the database it describes; have a retention period and a way to purge.
7. **Sample at the root, keep traces whole.** A parent-based sampler follows the caller's decision, so a trace is recorded in every service or in none. Fragments are worse than nothing.
8. **Telemetry must not take the app down.** Export is asynchronous and bounded; a backend outage drops or buffers telemetry, never blocks requests. Flush on shutdown so the last seconds before a crash or deploy aren't lost.
9. **Fail loudly on misconfiguration.** A missing exporter endpoint should fail at startup, not run for weeks silently exporting nowhere.

## Prove it

Send one request that crosses an HTTP hop, a database query and a queue, and show it as a single trace with the consumer's spans under the producer's. From that trace, open its logs and see the same trace ID. Show one business metric with its labels and confirm none of them is unbounded. Stop the telemetry backend: requests still succeed and their latency doesn't change.
