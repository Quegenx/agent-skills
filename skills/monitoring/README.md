# Monitoring skills

Errors, product analytics and telemetry in production: `sentry` (errors, tracing, replay and logs per platform), `posthog` (analytics, flags, experiments, replay, error tracking, HogQL, the warehouse), `grafana` (dashboards, alerting, Prometheus, Loki, Tempo, Pyroscope, Alloy, Faro, synthetic monitoring) `k6` (load and performance tests) and `google-analytics` (GA4, Tag Manager, UTM and Consent Mode). Vendor-neutral OpenTelemetry, structured logging, graph diagnosis and incident response are in `observability` here. Details in the [main README](../../README.md#monitoring).

6 skills.

## Skills

| Skill | Covers |
|---|---|
| [sentry](./sentry/SKILL.md) | Sentry across web, React, Next.js, Node, React Native and Flutter: shared JavaScript setup, platform integrations, tracing, Replay/profiling, logs/metrics, symbols, sampling/privacy, SDK upgrades and debugging; version-scoped corrections and canonical signal owners. |
| [posthog](./posthog/SKILL.md) | PostHog setup, consent/proxy, events/identity, flags/experiments, replay, errors/symbols, logs/tracing, LLM analytics, HogQL, governed metrics, warehouse/custom sources, workflows, access and costs; shared SDK setup and corrected query/retention contracts. |
| [grafana](./grafana/SKILL.md) | Dashboards, alerting, IRM/OnCall, provisioning, Prometheus/PromQL, Mimir, Loki, Tempo, Pyroscope, Alloy, OTLP/Beyla, application/database observability, Faro/session diagnosis, infrastructure and synthetic monitoring; focused topic owners and current configuration qualifications. |
| [k6](./k6/SKILL.md) | Load/browser tests, executors, scenarios, checks/thresholds, Cloud runs/results, maintenance and a separate trend-analysis topic; corrected Rate direction, open-model pacing, capacity arithmetic and billing units. Missing source-only assets are marked unavailable. |
| [google-analytics](./google-analytics/SKILL.md) | GA4, Tag Manager, tracking plans, UTM rules, channel groups, key events, DebugView, internal filters, Consent Mode and the GA4 MCP server; predefined versus custom dimensions, correct underlying keys/scopes and basic versus advanced consent behavior. |
| [observability](./observability/SKILL.md) | Vendor-neutral OpenTelemetry instrumentation, collectors, structured logging, health probes, monitoring-graph diagnosis and incident response; canonical manual span/log correlation, transport matching, privacy and corrected queueing/arithmetic models. |
