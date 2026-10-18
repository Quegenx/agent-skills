# Monitoring skills

Errors, product analytics and telemetry in production: `sentry` (errors, tracing, replay and logs per platform), `posthog` (analytics, flags, experiments, replay, error tracking, HogQL, the warehouse), `grafana` (dashboards, alerting, Prometheus, Loki, Tempo, Pyroscope, Alloy, Faro, synthetic monitoring) `k6` (load and performance tests) and `google-analytics` (GA4, Tag Manager, UTM and Consent Mode). Vendor-neutral OpenTelemetry is the backend set's `observability` skill. Details in the [main README](../../README.md#monitoring).

5 skills.

## Skills

| Skill | Covers |
|---|---|
| [sentry](./sentry/SKILL.md) | Sentry for React, the browser, React Router, TanStack Start, Next.js, Node, NestJS, Cloudflare, React Native and Flutter: setup per platform, errors, tracing, Session Replay, logs, metrics, profiling, crons, user feedback, sampling and quotas, PII scrubbing, releases and source maps, issue grouping and alerts, debugging with the MCP server and Seer, AI monitoring, OpenTelemetry, Supabase, SDK upgrades. Updated coverage: Platform SDKs, privacy, version-scoped defaults, Expo Router tracing, logs and diagnostics. |
| [posthog](./posthog/SKILL.md) | PostHog for web, Next.js, Node, React Native and Flutter: setup, the reverse proxy, consent and cookieless mode, events and identity, feature flags, experiments and their health, surveys, web analytics, session replay and Replay Vision, error tracking, logs and metrics, LLM and MCP analytics, HogQL with examples and tables, insights and dashboards, metric modeling, the data warehouse, endpoints, workflows, ingestion warnings and costs, the MCP server; marketing analytics and AI referrers, a product-market-fit survey, c15t consent notes |
| [grafana](./grafana/SKILL.md) | The Grafana stack: dashboards, alerting and OnCall, provisioning and Grafana as code, Prometheus, PromQL and Mimir, cardinality and cost, Loki and LogQL, Tempo and TraceQL, Pyroscope, Alloy, OpenTelemetry and Beyla, application and database observability, Faro, infrastructure, synthetic monitoring, the Grafana MCP server. Updated coverage: Dashboards, alerts, telemetry pipelines, current configuration and plugin development. |
| [k6](./k6/SKILL.md) | Load and performance tests with k6: test types, executors, scenarios, thresholds and checks, browser tests, a website performance suite with CI templates, Grafana Cloud k6 runs and results, test maintenance and trend analysis; k6 v2 changes by version (VERSIONS.md), the web dashboard, summary modes and the secrets API. Updated coverage: Load/browser tests, VU isolation, threshold semantics, private HAR handling and compliant access. |
| [google-analytics](./google-analytics/SKILL.md) | Google Analytics 4, Tag Manager and UTM tracking: the tracking plan and event library, UTM rules and partner links, channel groups including AI Assistant, key events, DebugView, internal-traffic filters, Consent Mode v2 with four parameters, the GA4 MCP server |
