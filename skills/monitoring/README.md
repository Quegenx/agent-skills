# Monitoring skills

Errors, product analytics and telemetry in production: `sentry` (errors, tracing, replay and logs per platform), `posthog` (analytics, flags, experiments, replay, error tracking, HogQL, the warehouse), `grafana` (dashboards, alerting, Prometheus, Loki, Tempo, Pyroscope, Alloy, Faro, synthetic monitoring) `k6` (load and performance tests) and `google-analytics` (GA4, Tag Manager, UTM and Consent Mode). Vendor-neutral OpenTelemetry, structured logging, graph diagnosis and incident response are in `observability` here. Details in the [main README](../../README.md#monitoring).

6 skills.

Entry points apply only the selected job's routes and checks. Cross-skill references use named public sources and the installed skill when available; framework-specific guides are independent choices.

## Skills

| Skill | Covers |
|---|---|
| [sentry](sentry/SKILL.md) | Platform SDKs, errors, tracing/Replay, symbols, sampling/privacy and issue diagnosis; setup and production delivery require that scope. |
| [posthog](posthog/SKILL.md) | SDKs, analytics/identity, flags, experiments, replay, logs, HogQL and warehouse access; setup and query-only checks stay separate. |
| [grafana](grafana/SKILL.md) | Dashboards, alerting, IRM, Prometheus/Mimir, Loki, Tempo, Alloy and Faro; verify only the selected product and changed surface. |
| [k6](k6/SKILL.md) | Load/browser tests, executors, scenarios, checks/thresholds, Cloud runs/results, maintenance and a separate trend-analysis topic; corrected Rate direction, open-model pacing, capacity arithmetic and billing units. Missing source-only assets are marked unavailable. |
| [google-analytics](google-analytics/SKILL.md) | GA4, GTM, events, UTM, Consent Mode and reporting; event, pricing-variable and consent checks apply to their selected branches. |
| [observability](observability/SKILL.md) | OpenTelemetry, collectors, logs, health probes, graph diagnosis and incidents; tracing, metrics and export checks follow the task. |
