---
name: grafana
description: "Builds and runs observability on the Grafana stack: dashboards, alerting and OnCall (IRM), provisioning and Grafana as code (HTTP API, Terraform, gcx, Git Sync, Foundation SDK), Prometheus metrics, PromQL and Mimir, cardinality and Grafana Cloud cost, Loki and LogQL, Tempo and TraceQL, Pyroscope profiles, Alloy pipelines and Fleet Management, OpenTelemetry and Beyla, application and database observability, Faro frontend monitoring, Kubernetes, host and cloud infrastructure, synthetic monitoring, and admin with the Grafana MCP server. Use when building a dashboard or alert, writing PromQL, LogQL or TraceQL, sending metrics, logs, traces or profiles to Grafana Cloud, configuring Alloy, cutting cardinality or the Grafana Cloud bill, setting up synthetic checks, or connecting an agent to Grafana."
---

# Grafana

Grafana is the front end of the LGTM stack: metrics in Prometheus or Mimir, logs in Loki, traces in Tempo, profiles in Pyroscope, all collected by Alloy (Grafana Labs' OpenTelemetry Collector distribution and its recommended path for every signal) and read through dashboards, alerts and Explore. Most outcomes are decided by labels: a series or stream is one unique label set, so the labels you attach decide memory, query speed and the Grafana Cloud bill, and the labels a rule produces decide which notification policy routes it and how alerts group. The vendor skills and the official docs disagree in places (keys, defaults, endpoints); each file states both values, and the current docs decide. Load testing is the sibling [k6 skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/k6/SKILL.md); vendor-neutral OpenTelemetry instrumentation and collectors are the [observability skill](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Dashboard design (RED, USE, maturity), the JSON model, panels, units, thresholds, variables, transformations, links and annotations, library panels, sharing, pushing and verifying through the API | [DASHBOARDS.md](DASHBOARDS.md) |
| Alert design, rule evaluation, SLO burn-rate alerts, contact points, notification policies, templates, silences, mute timings and HA | [ALERTING.md](ALERTING.md) |
| IRM and OnCall integrations, routing templates, escalation chains, schedules and incident operations | [IRM-AND-ONCALL.md](IRM-AND-ONCALL.md) |
| `grafana.ini`, file provisioning of data sources, dashboards and plugins, plus the source-only service-account form and its verification limit, plugin settings schemas, the HTTP API, annotations, Grafana as code (Terraform, `gcx`, Git Sync, Foundation SDK) | [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md) |
| Prometheus metric names and units, labels, what to instrument, histograms vs summaries, recording rules, scraping and relabeling, exemplars | [PROMETHEUS.md](PROMETHEUS.md) |
| Mimir runtime, tenant-aware remote write, local and production deployment, capacity and troubleshooting | [MIMIR.md](MIMIR.md) |
| PromQL: selectors, rates, aggregation, histogram quantiles, ratios, absence, offsets, SLO math, info-metric joins, validating a query, common bugs, Metrics Drilldown | [PROMQL.md](PROMQL.md) |
| Choosing labels, the one scrape-time rule, fighting a cardinality fire, Adaptive Metrics, dpm-finder, Cost Management, log and trace cost levers | [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md) |
| Loki stream labels, structured metadata, changing labels safely, LogQL, query performance, sending logs, log cost, label audits | [LOKI.md](LOKI.md) |
| Tempo architecture, sending traces, what to put in spans, TraceQL, TraceQL metrics, the metrics generator, the Tempo data source, tuning | [TEMPO.md](TEMPO.md) |
| Pyroscope collection paths, the Node.js SDK, Alloy eBPF, profile types and queries, `profilecli` | [PYROSCOPE.md](PYROSCOPE.md) |
| Alloy syntax, components and the catalog, metrics, log and OTLP pipelines, sending to Grafana Cloud, clustering, Fleet Management | [ALLOY.md](ALLOY.md) |
| OTLP credentials and env vars for Grafana Cloud, Node.js setup, the OTel Operator, the upstream Collector, head and tail sampling | [OTLP-GATEWAY.md](OTLP-GATEWAY.md) |
| Beyla eBPF requirements, deployment, discovery, route cardinality and verification | [BEYLA.md](BEYLA.md) |
| Application Observability (span metrics, resource attributes, service map, SLOs) and AI Observability | [APPLICATION-OBSERVABILITY.md](APPLICATION-OBSERVABILITY.md) |
| Database Observability, the separate Postgres infrastructure integration and Grafana-facing Supabase metrics | [DATABASE-OBSERVABILITY.md](DATABASE-OBSERVABILITY.md) |
| Faro frontend monitoring: setup, React and Next.js, tracing to the backend, session sampling, Session Replay, source maps, the self-hosted receiver | [FRONTEND-FARO.md](FRONTEND-FARO.md) |
| Investigating one captured Faro session with `gcx`, ranking problems and linking observed session evidence | [FARO-SESSIONS.md](FARO-SESSIONS.md) |
| Kubernetes with the `k8s-monitoring` chart, Linux hosts, Docker, cloud integrations (AWS, Azure, Confluent), cloud data sources and private connectivity | [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md) |
| Synthetic Monitoring: check types, what fails an execution, scripted and browser checks, checks from an OpenAPI spec, cost, the API, Terraform, alerting and rollback | [SYNTHETIC-MONITORING.md](SYNTHETIC-MONITORING.md) |
| Roles and custom RBAC, users and teams, service accounts, SSO, the Cloud API, audit logs, the Grafana MCP server, Grafana Assistant and A2A, the LLM plugin and ML features | [ADMIN-AND-AI.md](ADMIN-AND-AI.md) |
| Grafana-hosted plugin startup graphs, lazy roots/routes/extensions, Scenes composition and host React compatibility | [PLUGIN-DEVELOPMENT.md](PLUGIN-DEVELOPMENT.md) |

## The rules

1. **Alert on user-facing symptoms, and give every alert an owner and a way in.** Alert from RED signals (rate, errors, duration), not from infrastructure events; each alert carries a `team` label, a summary and a dashboard or runbook link. "If no action is possible, it shouldn't be an alert"; use a dashboard instead. Test routing with a forced alert before go-live.
2. **Never remove, at scrape time, a label that makes a series unique.** No `labeldrop` or relabel `replacement` on `pod`, `instance` or any series-unique label: `rate()` returns garbage and nothing warns you. The safe fixes are fixing the source, dropping a whole metric, or Adaptive Metrics. (The PromQL skill disagrees: it shows a scrape-time `labeldrop` of `user_id` and says "drop high-cardinality labels"; see [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md).) Unbounded values (`user_id`, `request_id`, `trace_id`, emails, raw paths) are never labels: use exemplars in Prometheus and structured metadata in Loki.
3. **In PromQL, `rate()` first, then aggregate,** over a window of at least 4x the scrape interval, and keep `le` in the inner `by` of every classic `histogram_quantile`. Aggregate numerator and denominator separately, then divide; never average a ratio. Move slow expressions into recording rules.
4. **Narrow every log and trace query before it scans.** Bound the time range, start with the most specific stream selector, put `|=`/`!=` line filters before any parser, and in TraceQL scope attributes (`span.`, `resource.`) and prefer trace-level intrinsics.
5. **Use the current OpenTelemetry environment name, with the provider source view explicit.** The official resource attribute is `deployment.environment.name`; shared identity attributes are `service.name` and `service.namespace`. The Grafana source rule used `deployment.environment` and said Application Observability, log correlation and service inventory key on its listed attributes. Retained vendor examples keep that legacy spelling as a source/pipeline compatibility view, rather than proving the current attribute is rejected. Generate span metrics before sampling, as the source requires for complete-trace RED metrics. [OpenTelemetry deployment attribute registry](https://opentelemetry.io/docs/specs/semconv/registry/attributes/deployment/), [existing Grafana, SKILL.md, rule5]
6. **One source of truth per resource, with stable `uid`s, and verify every change.** A resource lives in files, Terraform, Git Sync or the UI, never two at once. Secrets are env var references or `sensitive` variables, never literals. After each push, check the returned `version` and GET the resource by `uid`; health-check every data source.
7. **Least privilege for machines and agents.** Service accounts for programmatic access, Viewer unless it must write, kept in env vars or a secrets manager. Start the Grafana MCP server with `--disable-write`, and never ask for a Grafana token to be pasted into chat.
8. **A synthetic check must fail when the journey breaks.** A bare failed `check()` leaves `probe_success` at 1; use `expect()` or `check(...) || fail(...)`, assert every step, and prove the check fails by breaking one assertion.

## Prove it

Apply each check to its selected branch: dashboards/data sources, Alloy, remote write, tracing, alerting, label changes, synthetic monitoring or MCP access. A task for one Grafana product does not require configuring every product below.

Every data source health check returns `"status": "OK"` and every dashboard's `datasource.uid` exists; `alloy validate` passes and no Alloy component is unhealthy; `prometheus_remote_storage_samples_total` rises with zero retries; TraceQL `{ resource.service.name = "<service>" }` returns spans and the service appears in Service Inventory with its environment; a forced test alert reaches the intended receiver; `prometheus_tsdb_head_series` is flat or falling after a label change and `rate()` on the changed metric returns sane magnitudes; a deliberately broken synthetic assertion fails the execution; `/mcp` lists the Grafana tools with writes still disabled unless asked for; and every file's own Prove it checks pass for the parts you touched.
