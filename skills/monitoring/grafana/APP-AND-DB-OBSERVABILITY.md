# Application and Database Observability

Grafana Cloud has three application products on the same OTLP plus Mimir, Loki, Tempo and Pyroscope plumbing: Application Observability (APM from span metrics), Frontend Observability (Faro, in [FRONTEND-FARO.md](FRONTEND-FARO.md)) and AI Observability (OpenLIT). Database Observability adds query-level insight for MySQL and PostgreSQL with no app code changes. The mechanism that decides most outcomes in APM: **its RED metrics come from span metrics, not from a Prometheus scrape**, so a service exists in the UI only if its traces arrive with the right resource attributes and are counted before any sampling. Sending OTLP is [OPENTELEMETRY-AND-BEYLA.md](OPENTELEMETRY-AND-BEYLA.md); trace queries are [TEMPO.md](TEMPO.md). Docs: https://grafana.com/docs/grafana-cloud/monitor-applications/

**Contents:** [Application Observability](#application-observability) · [Resource and span attributes](#resource-and-span-attributes) · [Span metrics](#span-metrics) · [Service map](#service-map) · [Service Overview, baselines, SLOs, alerts](#service-overview-baselines-slos-alerts) · [Correlation](#correlation) · [Alloy on Kubernetes for apps](#alloy-on-kubernetes-for-apps) · [AI Observability](#ai-observability) · [Database Observability](#database-observability) · [Postgres infrastructure integration](#postgres-infrastructure-integration) · [Supabase](#supabase) · [Debugging](#debugging) · [Prove it](#prove-it)

## Application Observability

- **What you get:** Service Inventory (RED metrics for every service), Service Overview, Service Map (direction from `span.kind=CLIENT/SERVER`), and an Operations view (per-endpoint p50/p95/p99).
- **Where the metrics come from:** the Tempo metrics-generator (the Cloud default; basic use needs no configuration) or the `spanmetrics` connector in Alloy or the OTel Collector. They are stored in Mimir.
- **Query languages per signal:** RED metrics in PromQL; traces in TraceQL; logs in LogQL; profiles in "ProfileQL"; browser RUM in LogQL/TraceQL; LLM metrics in PromQL.

## Resource and span attributes

| Resource attribute | Becomes |
|---|---|
| `service.name` (minimum required) | The `service_name` label |
| `service.namespace` + `service.name` | `job` (`namespace/service.name`) |
| `deployment.environment` | `deployment_environment`, the environment filter |
| `service.version` | Shown in Service Overview, used to compare releases |
| `telemetry.sdk.language` | The Technology badge |

- **Recommended extras:** `k8s.cluster.name`, `k8s.namespace.name`, `cloud.region`, `host.name`.
- **Span attributes that fill the UI panels:**

| Kind | Attributes |
|---|---|
| HTTP | `http.method`, `http.status_code`, `http.route` (`/api/users/{id}`), `http.url` (sparingly; high cardinality), `http.target`, `http.scheme` |
| RPC | `rpc.system`, `rpc.service`, `rpc.method`, `rpc.grpc.status_code` |
| DB | `db.system`, `db.name`, `db.operation`, `db.statement` (careful with PII) |
| Messaging | `messaging.system`, `messaging.destination`, `messaging.operation` |

## Span metrics

| Generator | Calls | Duration |
|---|---|---|
| Tempo metrics-generator | `traces_spanmetrics_calls_total` | `traces_spanmetrics_duration_seconds` (`_bucket`) |
| OTel Collector connector | `traces_span_metrics_calls_total` | `traces_span_metrics_duration_seconds` |

- **Service graph metrics:** `traces_service_graph_request_total`, `traces_service_graph_request_failed_total`, `traces_service_graph_request_server_seconds`.
- **Labels:** `service_name`, `span_name`, `span_kind`, `status_code` (`STATUS_CODE_OK` / `STATUS_CODE_ERROR` / `STATUS_CODE_UNSET`), `deployment_environment`.
- **Default span-metric dimensions on Tempo:** `service.name`, `service.namespace`, `deployment.environment`, `service.version`, `k8s.cluster.name`, `cloud.region`.
- **Generate span metrics before sampling.** Complete, unsampled traces give accurate RED metrics: App to Alloy (receives all traces) to span metrics to tail sampler to Tempo. The tail sampler is in [OPENTELEMETRY-AND-BEYLA.md](OPENTELEMETRY-AND-BEYLA.md#sampling).
- **OTel Collector `spanmetrics` connector:**

```yaml
connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: [1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 5s]
    dimensions:
      - name: service.namespace
      - name: deployment.environment
      - name: service.version
      - name: http.method
      - name: http.status_code
    exemplars:
      enabled: true
    namespace: "traces.span"
```

  Pipelines: `traces: receivers [otlp] exporters [otlphttp/grafana, spanmetrics]`; `metrics/spanmetrics: receivers [spanmetrics] exporters [prometheusremotewrite/grafana]`. In Alloy the equivalents are `otelcol.connector.spanmetrics` and `otelcol.connector.servicegraph`.

## Service map

- **Edges need both sides:** server spans with `span.kind = SERVER` and `server.address` or `peer.service`, plus client spans with `span.kind = CLIENT` that target another service.
- **Set `peer.service` by hand** when automatic detection fails.
- **In Grafana Cloud the service-graphs generator is on by default.**

## Service Overview, baselines, SLOs, alerts

- **Panels:** Rate, Errors (status code != OK), Duration (p50/p95/p99), Operations, Logs (needs a matching `service.name`), Infrastructure (needs Kubernetes monitoring, [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md)), Profiles button (needs Pyroscope, [PYROSCOPE.md](PYROSCOPE.md)).
- **Baselines and anomaly detection** need `deployment.environment`, **at least 2 weeks of data** for training, and are enabled in Application Observability > Settings.
- **SLO:** Service Overview > "Create SLO" > Availability or Latency > a target (for example 99.9%) and a window (for example 28 days). The generated dashboard comes with error-budget burn-rate alerts.
- **Pre-built alerts:** high error rate, high latency (p95 above the SLO), low request rate. Custom PromQL:

```promql
# Error rate > 5% for any service
(
  sum by (service_name) (rate(traces_spanmetrics_calls_total{status_code="STATUS_CODE_ERROR"}[5m]))
  /
  sum by (service_name) (rate(traces_spanmetrics_calls_total[5m]))
) > 0.05

# p95 latency > 500ms
histogram_quantile(0.95,
  sum by (le, service_name) (
    rate(traces_spanmetrics_duration_seconds_bucket[5m])
  )
) > 0.5
```

Turning these into alert rules and routing them is [ALERTING-AND-ONCALL.md](ALERTING-AND-ONCALL.md).

## Correlation

- **`service.name` joins all signals.**
- **Exemplars** embed trace IDs in metric points: a metric spike opens an exemplar trace.
- **`traceID` in logs;** Faro injects `traceparent` to link frontend and backend.
- **Built-in links:** Service Overview opens logs and "Go to profiles"; App Observability links to Frontend Observability; a DB span links to "View query in Database Observability".
- **Logs correlate** only when Loki labels include `service_name` matching the OTel `service.name` and the data-source settings point to the right Loki.

## Alloy on Kubernetes for apps

- **Run Alloy as a DaemonSet with `hostPort` 4317 and 4318.** Pods reach it through `OTEL_EXPORTER_OTLP_ENDPOINT=http://$(HOST_IP):4317`, with `HOST_IP` taken from `status.hostIP`. Alloy pipelines are [ALLOY.md](ALLOY.md).
- **Why a DaemonSet:** running Alloy on every node enables host-level resource detection. The DaemonSet (`grafana/alloy:latest`, `args: [run, /etc/alloy/config.alloy]`) reads `GRAFANA_CLOUD_OTLP_ENDPOINT`, `GRAFANA_CLOUD_INSTANCE_ID` and `GRAFANA_CLOUD_API_KEY` from the `grafana-cloud-creds` secret and mounts the `alloy-config` ConfigMap at `/etc/alloy`.
- **Application pod configuration**, pointing pods at the node-local Alloy:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://$(HOST_IP):4317"
  - name: HOST_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: OTEL_SERVICE_NAME
    value: "my-api"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "service.namespace=my-team,deployment.environment=production,k8s.pod.name=$(POD_NAME),k8s.namespace.name=$(NAMESPACE)"
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
```

## AI Observability

- **Built on the OTel GenAI semantic conventions plus OpenLIT.** It covers LLM APIs, vector DBs, AI frameworks, MCP servers, GPU usage and evals (hallucination, toxicity, bias).
- **Setup path:** Cloud > Connections > "AI Observability". Credentials from **My Account** > **Stack** > **OpenTelemetry**.
- **The SDK is Python only** (`openlit==1.42.0`, Python 3.10 or later). Env: `OTEL_SERVICE_NAME`, `OTEL_DEPLOYMENT_ENVIRONMENT`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`. The Python code itself was not carried into this skill.
- **Metrics:** `gen_ai_usage_input_tokens_total`, `gen_ai_usage_output_tokens_total`, `gen_ai_usage_cost_USD_sum`, `gen_ai_client_operation_duration`, `gen_ai_client_token_usage`.
- **Span attributes:** `gen_ai.request.model`, temperature/top_p, prompts and completions (configurable), `gen_ai.system`, time-to-first-token.
- **Dashboards:** GenAI Observability, GenAI Evaluations, Vector Database Observability, MCP Observability, GPU Monitoring.
- **No GenAI metrics:** check that the OpenLIT version matches the OTel semantic-conventions version Cloud expects.

## Database Observability

Query-level insight for MySQL and PostgreSQL with no app code changes: RED metrics, query samples, explain plans. GA since April 2026. Docs: https://grafana.com/docs/grafana-cloud/monitor-applications/database-observability/

### PostgreSQL setup

```sql
-- 1. Enable pg_stat_statements (requires restart)
--    In postgresql.conf:  shared_preload_libraries = 'pg_stat_statements'
--    Then restart PostgreSQL.

-- 2. Create a least-privilege monitoring user
CREATE USER grafana_monitoring WITH PASSWORD 'secret';
GRANT pg_monitor TO grafana_monitoring;
GRANT CONNECT ON DATABASE mydb TO grafana_monitoring;

-- 3. Enable the extension on each monitored DB
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 4. Verify
SELECT count(*) FROM pg_stat_statements;
-- Should return >= 0 (not an error). If "relation does not exist": step 3 didn't run.
```

- **Managed databases** (RDS, Aurora, Cloud SQL, Azure Database): `pg_stat_statements` is preinstalled but disabled. Enable it through the parameter group or flag, then create the extension.
- **MySQL:** `GRANT SELECT, PROCESS, REPLICATION CLIENT ON *.*` plus `GRANT SELECT ON performance_schema.*`; `SELECT @@performance_schema;` should return 1 (the default on MySQL 8+).

### Alloy

```alloy
database_observability.postgres "mydb" {
  data_source_name = "postgresql://grafana_monitoring:secret@localhost:5432/mydb?sslmode=disable"

  enable_collectors = ["pg_stat_statements", "query_samples", "schema_details"]

  forward_metrics_to = [prometheus.remote_write.cloud.receiver]
  forward_logs_to    = [loki.write.cloud.receiver]
}
```

- **MySQL form:** `data_source_name = "grafana_monitoring:secret@tcp(localhost:3306)/mydb"` with `enable_collectors = ["query_samples", "explain_plans", "schema_details"]`.

| Collector | Database | What it gives |
|---|---|---|
| `pg_stat_statements` | PostgreSQL | Per-query count and latency |
| `query_samples` | Both | Sampled query texts with parameters |
| `schema_details` | Both | Schema details |
| `explain_plans` | MySQL only | Automatic EXPLAIN for slow queries |

- **Turn off collectors you don't need;** that cuts cardinality and overhead.
- **After configuring,** restart Alloy and wait about 60 s: `db_query_total{db_instance="mydb"}` should be non-empty. Still empty after 2 minutes: check the Alloy logs.

### Queries and alerts

```promql
rate(db_query_total{db_instance="mydb"}[5m])
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))
rate(db_query_errors_total[5m]) / rate(db_query_total[5m])
count(db_query_duration_seconds > 1) by (db_query_digest)
db_connections_active{db_instance="mydb"}
```

| Alert | Condition | Severity |
|---|---|---|
| `SlowQueryDetected` | p95 > 1 for 5m | warning |
| `HighDBErrorRate` | > 0.05 for 5m | critical |
| `TooManyConnections` | `db_connections_active / db_connections_max > 0.8` for 5m | warning |

- **Trace correlation:** the app's OTel instrumentation emits `db.statement`, `db.system` and `db.name`; Grafana Cloud links spans to query samples by query digest: span > "View query in Database Observability" > explain plan.

## Postgres infrastructure integration

The Grafana Cloud PostgreSQL integration is infrastructure-level (connections, replication, cache, locks, tables): 19 alerts and 4 dashboards (cluster overview, instance overview, logs, query performance). For slow queries, wait events and plans, use Database Observability above. Docs: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-postgres/

- **Use a separate least-privilege Postgres user for Alloy,** not `root` (see the postgres_exporter non-superuser docs).
- **Collectors:** `database`, `locks`, `long_running_transactions`, `postmaster`, `replication`, `stat_bgwriter`, `stat_database`, `stat_statements` (needs `pg_stat_statements`: `shared_preload_libraries = 'pg_stat_statements'`, then `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` per database), `stat_user_tables`, `statio_user_indexes`. The filtered-metrics variant omits `stat_statements` to reduce cardinality.

```alloy
prometheus.exporter.postgres "integrations_postgres_exporter" {
    data_source_names    = ["postgresql://localhost:5432/postgres"]
    enabled_collectors   = ["database", "locks", "long_running_transactions", "postmaster", "replication", "stat_bgwriter", "stat_database", "stat_statements", "stat_user_tables", "statio_user_indexes"]
}
discovery.relabel "integrations_postgres_exporter" {
    targets = prometheus.exporter.postgres.integrations_postgres_exporter.targets

    rule {
        target_label = "instance"
        replacement  = constants.hostname
    }
    rule {
        target_label = "job"
        replacement  = "integrations/postgres_exporter"
    }
}
prometheus.scrape "integrations_postgres_exporter" {
    targets    = discovery.relabel.integrations_postgres_exporter.output
    forward_to = [prometheus.remote_write.metrics_service.receiver]
    job_name   = "integrations/postgres_exporter"
}
```

- **Scraping remotely:** change `instance` from `constants.hostname` to a value identifying the target host.
- **Logs:** `local.file_match` (`__path__ = "/var/log/postgresql/postgres.log"`, same `instance`/`job` labels) plus `loki.source.file` forwarding to `loki.write.grafana_cloud_loki.receiver`. Postgres logs to stderr by default.
- **Kubernetes:** the Kubernetes Monitoring Helm chart's `alloy-metrics.extraConfig` and `podLogs.extraDiscoveryRules`.
- **Alerts:** PostgreSQLDown (critical), PostgreSQLHighConnectionUsage, PostgreSQLLowCacheHitRatio, PostgreSQLReplicationLag, PostgreSQLDeadlocks, PostgreSQLLongRunningQuery, PostgreSQLBlockedQueries, PostgreSQLWALArchiveFailure (critical), PostgreSQLHighDeadTuples, PostgreSQLVacuumNotRunning, PostgreSQLTooManyRollbacks, PostgreSQLTooManyLocksAcquired, PostgreSQLInactiveReplicationSlot (critical), PostgreSQLReplicationRoleChanged, PostgreSQLExporterErrors (critical), PostgreSQLHighQps, PostgreSQLReplicationLagCritical (critical, > 1 hour), PostgreSQLHighConnections (> 80% of max), PostgresTooManyCheckpointsRequested.
- **Key metrics:** `pg_up`, `pg_stat_database_blks_hit`, `pg_stat_database_blks_read`, `pg_stat_database_deadlocks`, `pg_stat_database_numbackends`, `pg_settings_max_connections`, `pg_stat_activity_count`, `pg_stat_activity_max_tx_duration`, `pg_replication_lag_seconds`, `pg_stat_user_tables_n_dead_tup`, `pg_stat_user_tables_last_autovacuum`, `pg_stat_statements_seconds_total`, `pg_stat_archiver_failed_count`, `pg_exporter_last_scrape_error`.
- **Filter Metrics option** drops unused metrics: anything custom built on metrics that are not in the snippet stops working.
- **Changes:** 1.1.2 (July 2026) removed Asserts resource recording rules to reduce cardinality; 1.0.4 (May 2024) `pg_stat_bgwriter` counter names changed (Alloy/Agent v0.40.5); 0.0.3 uses the `$job` template variable with multi-select job/instance; 0.0.2 (Oct 2021) all rate queries use `$__rate_interval`.

## Supabase

Every Supabase project exposes a Prometheus-compatible Metrics API with about 200 Postgres performance and health series. It is beta (metric names and labels might evolve) and not available in self-hosted Supabase. Supabase itself is the `supabase` skill. Docs: https://supabase.com/docs/guides/telemetry/metrics

- **Endpoint:** `https://<project-ref>.supabase.co/customer/v1/privileged/metrics`. It returns the full set on every request; scrape once per minute.
- **Auth:** HTTP Basic, username `service_role`, password a Secret API key (`sb_secret_...`) from Project Settings > API Keys. Test: `curl <project-url>/customer/v1/privileged/metrics --user 'service_role:sb_secret_...'`.
- **Long-lived automation:** an account access token (Account Settings > Access Tokens), optionally exchanged for project keys: `curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true"`.

### Grafana Cloud (recommended)

- **One-click:** the Grafana Cloud integration in the Supabase Dashboard sets up auth, scraping and a 200+ metric dashboard.
- **Manual:** a Grafana Cloud stack with Prometheus Metrics; Connections > Supabase integration > scrape job name (for example `production-eu-central-1`), Project ID, key > test > Install dashboards. If pushing manually, a Grafana API token with `metrics:write` and `metrics:read` scopes. 1 minute scrape recommended. The Grafana Cloud Supabase integration doc is community-maintained: https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-supabase/

### Self-hosted Prometheus and Grafana

Use this only if you need full manual control.

```yaml
scrape_configs:
  - job_name: 'supabase'
    scrape_interval: 60s
    metrics_path: /customer/v1/privileged/metrics
    scheme: https
    basic_auth:
      username: username
      password: '<secret API key (sb_secret_...)>'
    static_configs:
      - targets:
          - '<project-ref>.supabase.co:443'
        labels:
          project: '<project-ref>'
```

- **The username disagrees between Supabase pages:** this self-hosted guide's example has `username: username`; the Metrics API page says the username is `service_role`.
- **Keep the scrape interval at 60 s** to match Supabase's refresh cadence. Allow outbound HTTPS to `*.supabase.co`. Keep the secret in a secret manager or env vars, and rotate Secret API keys regularly.
- **One scrape job per project ref.**
- **Grafana:** add a Prometheus data source (Connections > Data sources > Prometheus, for example `http://prometheus:9090`), then import `https://raw.githubusercontent.com/supabase/supabase-grafana/refs/heads/main/grafana/dashboard.json` (200+ panels: CPU, IO, WAL, replication, index bloat, query throughput).
- **Alerts:** import `docs/example-alerts.md` from https://github.com/supabase/supabase-grafana and tailor thresholds (disk utilization, long-running transactions, connection saturation).
- **Pair it with** the Query Performance report and Advisors. Supabase also offers Log Drains.

## Debugging

| Symptom | Check |
|---|---|
| Service missing from Inventory | `service.namespace` or `deployment.environment` missing (`service.name` is mandatory); traces arrive; `traces_spanmetrics_calls_total` exists |
| Service Map edges missing | `span.kind` or `peer.service` missing |
| RED values wrong | Span metrics use the dotted `deployment.environment` as their source; sampling happens after span metrics; clock skew |
| Log correlation fails | Loki `service_name` label matches `service.name`; data source points to the right Loki |
| `pg_stat_statements` "relation does not exist" | `CREATE EXTENSION` didn't run on that database |
| `db_query_total` empty after 2 minutes | Alloy logs |
| Supabase metrics missing | The agent can reach `https://<project-ref>.supabase.co` and the key is valid |
| Supabase 401 | Create or rotate the Secret API key |
| Supabase long scrape durations | Reduce label cardinality in queries or lower the time range |

## Prove it

- **Traces:** TraceQL `{ resource.service.name = "my-api" }` returns spans.
- **Span metrics:** `sum by (job) (rate(traces_spanmetrics_calls_total{service_name="my-api"}[5m]))` is above 0 within about 1 minute, and the service appears in Service Inventory with its environment.
- **Alloy exporter healthy:** `curl -s http://localhost:12345/api/v0/web/components | jq '.[] | select(.id|test("otelcol\\.exporter\\.otlphttp")) | {id, health:.health.state}'`, and `otelcol_receiver_accepted_spans` and `otelcol_exporter_sent_spans` rise.
- **Service map:** a call between two services shows as an edge in the expected direction.
- **AI:** `sum by (gen_ai_request_model) (rate(gen_ai_usage_input_tokens_total[5m]))` returns a series per model.
- **Database:** `SELECT count(*) FROM pg_stat_statements;` returns a number as the monitoring user, and `db_query_total{db_instance="mydb"}` is non-empty within 60 s of restarting Alloy.
- **Postgres integration:** `pg_up` and `pg_exporter_last_scrape_error` return series under `job="integrations/postgres_exporter"`, and the integration's dashboards fill.
- **Supabase:** the `curl --user 'service_role:sb_secret_...'` test returns metrics, and the imported dashboard's panels fill.
