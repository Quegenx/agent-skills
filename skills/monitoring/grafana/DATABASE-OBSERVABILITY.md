# Database monitoring in Grafana

Use for query-level Database Observability, the separate Postgres infrastructure integration and Grafana-facing Supabase metrics. Application span metrics stay in [APPLICATION-OBSERVABILITY.md](APPLICATION-OBSERVABILITY.md). [existing skills/monitoring/grafana/APP-AND-DB-OBSERVABILITY.md]

## Database Observability

[existing APP-AND-DB-OBSERVABILITY.md]

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

[existing APP-AND-DB-OBSERVABILITY.md]

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
- **Kubernetes:** the integration source used `alloy-metrics.extraConfig` and `podLogs.extraDiscoveryRules`. Match the installed chart version; [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md#kubernetes) records the v4 schema and the old-key correction. [existing APP-AND-DB-OBSERVABILITY.md; https://github.com/grafana/k8s-monitoring-helm/blob/k8s-monitoring-4.1.4/charts/k8s-monitoring/values.yaml]
- **Alerts:** PostgreSQLDown (critical), PostgreSQLHighConnectionUsage, PostgreSQLLowCacheHitRatio, PostgreSQLReplicationLag, PostgreSQLDeadlocks, PostgreSQLLongRunningQuery, PostgreSQLBlockedQueries, PostgreSQLWALArchiveFailure (critical), PostgreSQLHighDeadTuples, PostgreSQLVacuumNotRunning, PostgreSQLTooManyRollbacks, PostgreSQLTooManyLocksAcquired, PostgreSQLInactiveReplicationSlot (critical), PostgreSQLReplicationRoleChanged, PostgreSQLExporterErrors (critical), PostgreSQLHighQps, PostgreSQLReplicationLagCritical (critical, > 1 hour), PostgreSQLHighConnections (> 80% of max), PostgresTooManyCheckpointsRequested.
- **Key metrics:** `pg_up`, `pg_stat_database_blks_hit`, `pg_stat_database_blks_read`, `pg_stat_database_deadlocks`, `pg_stat_database_numbackends`, `pg_settings_max_connections`, `pg_stat_activity_count`, `pg_stat_activity_max_tx_duration`, `pg_replication_lag_seconds`, `pg_stat_user_tables_n_dead_tup`, `pg_stat_user_tables_last_autovacuum`, `pg_stat_statements_seconds_total`, `pg_stat_archiver_failed_count`, `pg_exporter_last_scrape_error`.
- **Filter Metrics option** drops unused metrics: anything custom built on metrics that are not in the snippet stops working.
- **Changes:** 1.1.2 (July 2026) removed Asserts resource recording rules to reduce cardinality; 1.0.4 (May 2024) `pg_stat_bgwriter` counter names changed (Alloy/Agent v0.40.5); 0.0.3 uses the `$job` template variable with multi-select job/instance; 0.0.2 (Oct 2021) all rate queries use `$__rate_interval`.

## Supabase

[existing APP-AND-DB-OBSERVABILITY.md]

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

[existing APP-AND-DB-OBSERVABILITY.md]

| Symptom | Check |
|---|---|
| `pg_stat_statements` "relation does not exist" | `CREATE EXTENSION` didn't run on that database |
| `db_query_total` empty after 2 minutes | Alloy logs |
| Supabase metrics missing | The agent can reach `https://<project-ref>.supabase.co` and the key is valid |
| Supabase 401 | Create or rotate the Secret API key |
| Supabase long scrape durations | Reduce label cardinality in queries or lower the time range |

## Prove it

[existing APP-AND-DB-OBSERVABILITY.md]

- **Database:** `SELECT count(*) FROM pg_stat_statements;` returns a number as the monitoring user, and `db_query_total{db_instance="mydb"}` is non-empty within 60 s of restarting Alloy.
- **Postgres integration:** `pg_up` and `pg_exporter_last_scrape_error` return series under `job="integrations/postgres_exporter"`, and the integration's dashboards fill.
- **Supabase:** the `curl --user 'service_role:sb_secret_...'` test returns metrics, and the imported dashboard's panels fill.
