# Loki

Storing and querying logs with Grafana Loki: stream labels, structured metadata, LogQL, query performance and log cost. Loki indexes only labels, not log content; every unique label combination is a stream, and Loki was built for very long-lived streams and very low label cardinality. Too many streams means a large index and tiny chunks; too few means broad, slow scans. Pipelines that ship logs are in [ALLOY.md](ALLOY.md); Grafana Cloud cost overall is in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md). Docs: https://grafana.com/docs/loki/latest/

**Contents:** [How it works](#how-it-works) · [Labels](#labels) · [Kubernetes and host labels](#kubernetes-and-host-labels) · [Structured metadata](#structured-metadata) · [Changing labels safely](#changing-labels-safely) · [LogQL](#logql) · [Query performance](#query-performance) · [Sending logs](#sending-logs) · [Log cost](#log-cost) · [Label audit](#label-audit) · [Prove it](#prove-it)

## How it works

- **Write path:** push client to Distributor to Ingester (WAL) to object storage (chunks). **Read path:** query to Query Frontend to Querier, which reads Ingester and store.
- **Components:** the Distributor validates and hashes streams; the Ingester buffers chunks; the Querier executes LogQL; the Query Frontend caches, splits and parallelizes; the Compactor manages retention and dedup.
- **Two costs of labels:** ingestion (larger index, storage) and query. A high-cardinality label that is not in the selector forces a scan of all matching streams, which is catastrophic.

## Labels

- **Static labels are good:** regions, clusters, servers, applications, namespaces, environments (bounded sets). Static labels (values that don't change per log line, like `platform=linux` or `job=agent`) add no cardinality cost relative to the query scope; use them freely for LBAC, exploration and alert routing. 1,000 host values as a static label is fine.
- **Dynamic labels sparingly.** Don't add a label until you know you need it: use filter expressions (`|= "text"`, `|~ "regex"`) and brute-force the logs. Dynamic labels should have low cardinality (single digits or tens of values), long-lived values (e.g. the initial HTTP path segment `/load`, `/save`, `/update`), and be labels users frequently query. Never a trace ID or order ID.
- **The key question:** "Will this label be used in 9 out of 10 queries?" If not, it is not a label, except platform and correlation labels.
- **Combinations multiply:** `status_code` (3) x `action` (5) = 15 streams; add `endpoint` (3) and it is 45.
- **Limits:** Loki has a default limit of 15 index labels. A single tenant should stay under 100,000 active streams and under 1 million streams per 24h, and those figures are for huge tenants (over 10 TB/day); a 10x smaller tenant should use 10x fewer labels.
- **High-cardinality examples to keep out of labels:** timestamps, IP addresses, Kubernetes pod names, user IDs, customer IDs, trace IDs, order IDs. If you often parse such a field at query time, extract it client side and attach it as [structured metadata](#structured-metadata).
- **When to split a stream with a dynamic label:** with `chunk_target_size` 1MB (about 5MB uncompressed, up to 10MB), consider one if a stream writes 5MB in less than `max_chunk_age`. Diagnose flush reasons with `sum by (reason) (rate(loki_ingester_chunks_flushed_total{cluster="dev"}[1m]))`.
- **Consistency:** labels are case-sensitive (`Level` is not `level`); normalize `INFO`/`info`/`Info` to `info`; use one naming convention.
- **Clients may add dynamic labels** (Alloy, Fluentd, Fluent Bit, the Docker plugin). Inspect them with the Series API or logcli: `logcli series '{}' --since=1h --analyze-labels` (Loki 1.6.0+). If it shows e.g. `requestId 24653` unique values, it should not be a label; query `{logGroup="group1"} |= "requestId=32422355"` instead.

### The `level` label: sources disagree

The Loki label docs say `{app="loki"} |= "level=error"` is as fast as `{app="loki",level="error"}` for many apps, that `level` splits one app into up to five streams (5x chunks), and: "don't add a `level` dynamic label, just `|= "level=debug"` instead." The Loki label-analyzer skill recommends adding `level` (normalized to `info`, `warn`, `error`, `debug`) and always querying it, saying it filters 94%+ of lines when searching errors. Confirm in the current docs.

### Recommended labels and scoring (label-analyzer skill)

| Label | Cardinality | Verdict |
|---|---|---|
| `service_name`, `deployment_environment`, `job` | any | Keep the key (protected) |
| `env` | 2 to 5 | Good |
| `level` | 3 to 6 | Good |
| `namespace` | tens | Acceptable |
| `instance`, `hostname` | hundreds to thousands | Evaluate; not a default removal |
| `pod` | thousands, transient | Demote to structured metadata; migrate selectors first |
| `user_id`, `request_id` | unbounded | Never |

Recommended set: `service_name`, `deployment_environment`, `job`, `app`/`service` (legacy), `env`, `cluster`, `region`, `level`, `team`/`squad`, `source` (`file`, `k8s-events`, `journal`, `syslog`), `classification`.

- **Protected labels: never drop the key** of `service_name` (OTel `service.name`), `deployment_environment` (OTel `deployment.environment`) or `job`. High cardinality on them is a value problem: keep the key, stabilize the values, document the mapping. Dropping them breaks the App Observability service inventory, traces-to-logs, metrics-to-logs, alerts, dashboards, recording rules and LBAC. Prefer `service_name` over `app`/`service` aliases, and don't delete aliases without a migration.
- **LBAC (Grafana Enterprise Logs):** the best labels are `classification` (`public`, `restricted`, `confidential`, `top-secret`), `source`, `team`/`squad`, `env`, plus static aggregate labels like `owner=sysadmins`.
- **Loki vs Prometheus on `pod`:** demoting `pod` off the Loki index is recommended; in Prometheus, never dropping `pod` is the rule ([CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#the-one-rule)).

## Kubernetes and host labels

- **Kubernetes:** `service_name`, `namespace`, `container`, `workload` (`{controller_kind}/{controller_name}`, e.g. `ReplicaSet/payment-api`). Demote `pod`: 5 pods x 2 containers is 10 streams, and adding `pod` makes it 10 x N; demoting it typically cuts streams about 5x. Normalize `filename`, which contains the pod UID:

```alloy
// Normalize K8s filename to remove pod UID
stage.replace {
 source = "filename"
 expression = "/var/log/pods/([^/]+)_[^_]+_[^/]+/([^/]+)/\\d+\\.log"
 replace = "/var/log/pods/$1/$2/current.log"
}
```

- **Hosts:** keep `instance` and `filename` with the date suffix stripped:

```alloy
// Remove date suffixes from rotating log file names
// /var/log/myapp/logfile-20230927.txt → /var/log/myapp/logfile.txt
stage.replace {
 source = "filename"
 expression = "-\\d{8}(\\.log|\\.txt)$"
 replace = "$1"
}
```

- **Journal (`loki.source.journal`):** keep `instance`, `unit` and the allowlist:

```alloy
loki.process "journal_labels" {
 forward_to = [...]
 stage.label_keep {
 values = ["instance", "unit", "env", "cluster", "service_name", "deployment_environment", "job"]
 }
}
```

- **Why `workload` beats `app`:** it is derived from `{{controller_kind}}/{{controller_name}}`, static values that never change like pod names do, and unlike `app` (which may aggregate several workload types) it is precise. Still keep `service_name` for cross-signal correlation.
- **Hosts:** `instance` cardinality equals the number of machines, which is acceptable for fixed infrastructure.
- **Journal labels** auto-discovered under `__journal__*` (`boot_id`, `cap_effective`, `cmdline`, `comm`, `exe`, `gid`, `hostname`, `machine_id`, `pid`, `stream_id`, `systemd_cgroup`, `systemd_invocation_id`, `systemd_slice`, `systemd_unit`, `transport`, `uid`) are almost all high-cardinality; drop the non-allowlisted ones as above.
- **Normalize `level` in Alloy:**

```alloy
loki.process "normalize_level" {
 forward_to = [...]
 stage.replace { source = "level"; expression = "(?i)I(nfo)?"; replace = "info" }
 stage.replace { source = "level"; expression = "(?i)W(arn(ing)?)?"; replace = "warn" }
 stage.replace { source = "level"; expression = "(?i)E(rr(or)?)?"; replace = "error" }
 stage.replace { source = "level"; expression = "(?i)D(ebug?)?"; replace = "debug" }
 stage.labels { values = { level = "" } }
}
```

- **Conditional extraction** (only when the field is present):

```alloy
// Only extract when the relevant field is present, avoids unnecessary cardinality
loki.process "conditional_extraction" {
 forward_to = [...]
 stage.match {
 selector = "{app=\"loki\"} |= \"component\""
 stage.logfmt { mapping = { "component" = "" } }
 stage.labels { values = { component = "" } }
 }
}
```

- **Enforce the approved label set** (always the final stage; never omit `service_name`, `deployment_environment` or `job`):

```alloy
loki.process "enforce_labels" {
 forward_to = [loki.write.default.receiver]
 // ... other stages ...
 stage.label_keep {
 values = [
 "service_name", "deployment_environment", "job",
 "env", "cluster", "level", "namespace", "workload", "container",
 ]
 }
}
```

- **Soft enforcement** (inject `unknown` for missing labels):

```alloy
stage.template {
 source = "team"
 template = "{{ if .Value }}{{ .Value }}{{ else }}unknown{{ end }}"
}
stage.labels { values = { team = "" } }
```

## Structured metadata

Metadata attached to log lines without indexing them and without putting it in the line: pod names, process IDs, container IDs, user IDs. Docs: https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/

- **Requirements:** the Loki docs require chunk format V4 (schema version `13` or later) and the `tsdb` index type (not the deprecated `boltdb-shipper`); the label-analyzer skill says Loki 2.9+ with Grafana Agent or Alloy. It is required for OTLP ingestion.
- **Use it when:** ingesting OpenTelemetry via Alloy or the OTel Collector; high-cardinality metadata that isn't in the line (`process_id`, `thread_id`, pod names); using Logs Drilldown (needs `discover_log_levels` and `allow_structured_metadata` true); at large scale (over 75TB/month) with Bloom filters (Loki 3.3+).
- **Candidates from the analyzer:** `pod`, `node`, `version`/`image`/`tag`, `trace_id`/`user_id`, `process_id`, `restarted`. (The same skill also says to keep `user_id` only in log content; confirm in the current docs.)

```yaml
limits_config:
    allow_structured_metadata: true
    volume_enabled: true
    retention_period: 672h # 28 days retention
```

- **Disable** with `allow_structured_metadata: false` or `-validation.allow-structured-metadata=false`.
- **Attach** via the push payload, or the Alloy `stage.structured_metadata` block in `loki.process`.
- **Limits:** `max_structured_metadata_size` default 64KB (`-limits.max-structured-metadata-size`); `max_structured_metadata_entries_count` default 128. Exceeding them returns HTTP 400 from the distributor, counted in `loki_discarded_samples_total` with reason `structured_metadata_too_large` or `structured_metadata_too_many` (OTel `exception.stacktrace` is a common cause). Structured metadata counts toward the ingestion rate limit.
- **Query it with a label filter, no parser:** `{job="example"} | pod="myservice-abc1234-56789"`, `{job="example"} | pod="myservice-abc1234-56789" | trace_id="0242ac120002"`, `{service_name="payment-api"} | pod="payment-api-7f9d4b-xk2r9"`.
- **Metric queries can hit** `maximum of series (50000) reached for a single query`; reduce with `keep`/`drop`: `count_over_time({job="example"} | trace_id="0242ac120002" | keep job  [5m])`.
- **Labels to avoid and where they go instead:** `pod` (demote: `workload` label plus `pod` in structured metadata); `user_id` (keep only in log content); `request_id`/`trace_id` (structured metadata); raw K8s `filename` (normalize or demote); unnormalized `level` (normalize at collection); UUID or ephemeral `service_name` values (keep the key, map values to a stable service identity); any dynamically named label key (use fixed keys with bounded values).
- **Alternative when structured metadata isn't available: embed in the line.** Method 1, `stage.template`:

```alloy
loki.process "embed_pod" {
 forward_to = [...]

 // For JSON logs
 stage.match {
 selector = "{} |~ \"^\\s*\\{\""
 stage.replace {
 expression = "\\}$"
 replace = ""
 }
 stage.template {
 source = "log_line"
 template = "{{ .Entry }},\"_pod\":\"{{ .pod }}\"}"
 }
 }

 // For text logs
 stage.match {
 selector = "{} !~ \"^\\s*\\{\""
 stage.template {
 source = "log_line"
 template = "{{ .Entry }} _pod={{ .pod }}"
 }
 }

 stage.output { source = "log_line" }
}
```

Result: `ts=... msg="..." _pod=agent-logs-cqhfk`. Query by aggregate (normal use), then a specific pod (edge-case debugging):

```logql
sum(count_over_time({workload="ReplicaSet/payment-api", level="error"}[1m]))
{workload="ReplicaSet/payment-api", level="error"} |= `_pod=payment-api-3`
```

Method 2, `stage.pack` (JSON envelope `{"_entry": "original log line", "pod": "agent-logs-cqhfk"}`):

```alloy
loki.process "pack_pod" {
 forward_to = [...]
 stage.pack {
 labels = ["pod"]
 ingest_timestamp = false
 }
}
```

```logql
{workload="ReplicaSet/payment-api", level="error"}
 |= `agent-logs-cqhfk`
 | unpack
```

## Changing labels safely

Before demoting or renaming any label, list the alerts, dashboards, LBAC rules and recording rules that use it. Then dual-write, add the new label and cut over, and update selectors before removing the old one. When the dependencies are unknown, ask the owner to confirm them; do not assume a clean cutover.

## LogQL

Every query needs a stream selector.

```logql
{app="nginx"}                        # exact match
{app!="nginx"}                       # not equal
{app=~"nginx|apache"}               # regex match
{app!~"debug.*"}                     # regex not match
{app="nginx", env="prod"}           # AND (multiple labels)
```

**Line filters** go first in the pipeline:

```logql
{app="nginx"} |= "error"            # contains string
{app="nginx"} != "info"             # does not contain
{app="nginx"} |~ "error|warn"       # regex match
{app="nginx"} !~ "health.*check"    # regex not match
{app="nginx"} |= `"status":5`       # backtick avoids escaping
```

**Parsers:**

```logql
# JSON
{app="api"} | json
{app="api"} | json status="http_status", path="request.path"

# Logfmt
{app="api"} | logfmt
{app="api"} | logfmt --strict
{app="api"} | logfmt --keep-empty

# Pattern (positional, _ discards)
{app="nginx"} | pattern `<ip> - - <_> "<method> <uri> <_>" <status> <bytes>`

# Regexp (named capture groups)
{app="nginx"} | regexp `(?P<method>\w+) (?P<path>\S+) HTTP/(?P<version>\S+)`

# Unpack (unwrap Promtail packed labels)
{app="api"} | unpack
```

**Label filters:**

```logql
{app="api"} | json | status >= 500
{app="api"} | json | status == 200 and method != "OPTIONS"
{app="api"} | logfmt | duration > 1s
{app="api"} | json | level =~ "error|warn"
{app="api"} | json | bytes > 20MB
{app="api"} | json | path != "/healthz"
```

**Formatting and labels:**

```logql
{app="api"} | json | line_format "{{.method}} {{.path}} -> {{.status}} ({{.duration}})"
{app="api"} | logfmt | line_format `{{.level | upper}}: {{.msg}}`
{app="api"} | logfmt | label_format new_name=old_name
{app="api"} | logfmt | label_format severity=level, svc=app
{app="api"} | logfmt | label_format msg=`{{.level}}: {{.message}}`
{app="api"} | json | drop filename, level="debug"
{app="api"} | json | keep level, status, method
{app="cli-tool"} | decolorize
```

**Metric queries:**

```logql
# Requests per second
rate({app="nginx"}[5m])

# Total log lines in window
count_over_time({app="nginx"}[1h])

# Bytes per second
bytes_rate({app="nginx"}[5m])

# Total bytes
bytes_over_time({app="nginx"}[1h])

# Returns 1 if no logs in range (for absence alerting)
absent_over_time({app="nginx"}[5m])
```

```logql
# Error rate by service
sum(rate({env="prod"} |= "error" [5m])) by (app)

# Top 5 most active services
topk(5, sum(rate({env="prod"}[5m])) by (app))

# Total errors across all services
sum(count_over_time({env="prod"} |= "error" [5m]))
```

**Unwrap** a numeric field:

```logql
# Average request duration from logfmt
avg_over_time({app="api"} | logfmt | unwrap duration [5m])

# 95th percentile latency
quantile_over_time(0.95, {app="api"} | logfmt | unwrap duration [5m]) by (app)

# Sum of bytes from JSON logs
sum_over_time({app="api"} | json | unwrap bytes [5m])

# With conversion (duration string → seconds)
avg_over_time({app="api"} | logfmt | unwrap duration | duration_seconds [5m])
```

**Offset:** `rate({app="nginx"}[5m]) / rate({app="nginx"}[5m] offset 1h)`

**Practical queries:**

```logql
sum(rate({env="prod"} |= "error" [5m])) by (service)
/
sum(rate({env="prod"}[5m])) by (service)
> 0.05
```

```logql
{app="api"} | logfmt | duration > 1s | line_format "SLOW: {{.method}} {{.path}} {{.duration}}"
{app="nginx"} | pattern `<ip> - - <_> "<method> <uri> <_>" <status> <bytes>` | status >= 500
{namespace="prod"} |~ `https?://\w+:\w+@`
```

## Query performance

Loki evaluates left to right; eliminate results as early as possible. Docs: https://grafana.com/docs/loki/latest/query/bp-query/

1. **Narrow the time range first:** there is one index file per day. Use the Grafana time picker or `start`/`end` on `query_range`: `http://<loki-instance>/loki/api/v1/query_range?query={job="app"}&start=1633017600000000000&end=1633104000000000000`.
2. **Use precise label selectors,** most specific label first (e.g. `{app_name="carnivorousgreenhouse"}`); adding more general selectors has no further effect.
3. **Prefer `|=` and `!=` over `|~` and `!~`;** regex only as a last resort. Line filters are more efficient than parsers.
4. **Parsers (`json`, `logfmt`, `pattern`, `regexp`, `unpack`) only after line filters.**
5. **Recording rules** for queries that are still slow: https://grafana.com/docs/loki/latest/operations/recording-rules/

**Diagnose a slow query from the Querier's `metrics.go` log line:**

| Phase | Field | Fix |
|---|---|---|
| Queue | `queue_time` | Add Queriers or reduce parallelism |
| Index | `chunk_refs_fetch_time` | Scale index-gateways |
| Storage | `store_chunks_download_time` | Chunks too small, or storage |
| Execution | `duration - chunk_refs_fetch_time - store_chunks_download_time` | Regex, tiny lines |

Ideally most time is in Execution. Average chunk size = `total_bytes / cache_chunk_req`; hundreds of bytes or KB instead of MB means over-split streams. A high `post_filter_lines` discard ratio means you need more selective labels.

**Quick wins:** add `container`/`workload`; add `level` and always use it (see the [level disagreement](#the-level-label-sources-disagree)); demote `pod`; replace `|~` with `|=`; keep `service_name`; normalize UUID values.

## Sending logs

The Alloy component reference is in [ALLOY.md](ALLOY.md). A file pipeline that parses JSON, promotes `level` and drops health checks:

```alloy
loki.source.file "app" {
  targets    = [{__path__ = "/var/log/app/*.log", job = "app"}]
  forward_to = [loki.process.parse.receiver]
}

loki.process "parse" {
  forward_to = [loki.write.cloud.receiver]
  stage.json {
    expressions = { level = "level", msg = "message" }
  }
  stage.labels {
    values = { level = "" }
  }
  stage.drop {
    expression = ".*healthcheck.*"
  }
}

loki.write "cloud" {
  endpoint {
    url = "https://logs-xxx.grafana.net/loki/api/v1/push"
    basic_auth {
      username = sys.env("LOKI_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
  external_labels = { cluster = "prod" }
}
```

Kubernetes pods:

```alloy
discovery.kubernetes "pods" {
  role = "pod"
}

loki.source.kubernetes "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.cloud.receiver]
}
```

HTTP push API:

```bash
curl -X POST https://logs-xxx.grafana.net/loki/api/v1/push \
  -u "user:apikey" \
  -H 'Content-Type: application/json' \
  -d '{
    "streams": [{
      "stream": { "app": "myapp", "env": "prod" },
      "values": [
        ["1609459200000000000", "log line here"]
      ]
    }]
  }'
```

## Log cost

- **Grafana Cloud Logs billing:** current usage is measured in GBs processed, written and retained, with queried volume charged above the fair-use allowance. This is the hosted service contract, not a bill attached to Loki OSS. The old source said compressed bytes ingested and treated stream-count reductions as having no direct ingest charge; measure the applicable invoice dimensions before quoting savings. [https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/logs/]
- **Where savings come from:** normalize `level`, then `stage.drop` debug and trace lines (often 20 to 40% of volume in verbose Kubernetes; only after the owner confirms; prefer scoping by env or sampling); log-line optimization (15 to 38%). Drop and sampling stages are in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#cost-management).
- **Log-line optimization:** inline timestamps are redundant (about 30 to 34 bytes, about 6% of a line); strip them with regexes for logfmt, JSON or ISO-8601 and recover them at query time with `| line_format '{{ __timestamp__ | date "2006-01-02T15:04:05Z" }}'`. Use `stage.decolorize {}`. Remove a duplicate `level=` when `level` is a label. Strip JSON nulls, placeholders (`-`, `null`, `undefined`) and empty values. An Istio access log went from 753 to 464 bytes (38%). Establish a cost-per-GB baseline first.

```alloy
loki.process "drop_timestamp" {
 forward_to = [...]
 // logfmt timestamps
 stage.replace {
 expression = "(?i)((?:time_?(?:stamp)?|ts|logdate|start_?time)=[^ \\n]+(?: |$))"
 replace = " "
 }
 // JSON timestamps
 stage.replace {
 expression = "(\"@?(?:time_?(?:stamp)?|ts|logdate|start_?time)\"\\s*:\\s*\"[^\"]+\",?)"
 replace = " "
 }
 // ISO-8601 at start of line
 stage.replace {
 expression = "^(\\d{4}-\\d{2}-\\d{2})T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,9})?Z?)?"
 replace = ""
 }
}
```

```alloy
// Duplicate level field (when level is already a label)
stage.replace { expression = "(level=[^ ]+ )"; replace = "" }

// Remove null values
stage.replace {
 expression = "(\\s*(\"[^\"]+\"\\s*:\\s*null)(?:\\s*,)?\\s*)"
 replace = ""
}

// Remove placeholder values ("-", "undefined", "null" strings)
stage.replace {
 expression = "(\\s*(\"[^\"]+\"\\s*:\\s*\"(?:-|null|undefined)\")(?:\\s*,)?\\s*)"
 replace = ""
}

// Remove empty values ("", [], {})
stage.replace {
 expression = "(\\s*,\\s*(\"[^\"]+\"\\s*:\\s*(\\[\\s*\\]|\\{\\s*\\}|\"\\s*\"))|(\"[^\"]+\"\\s*:\\s*(\\[\\s*\\]|\\{\\s*\\}|\"\\s*\"))\\s*,\\s*)"
 replace = ""
}
```
- **Estimate:** `monthly_GB = bytes_per_second × 86400 × 30 / 1e9`, then `monthly_GB × reduction_%` at the contract per-GB rate. The source's illustrative scenarios were A, label hygiene only (streams down 65 to 90%, volume 0%, $0 direct under its old ingest-only model); B, A plus an approved debug/trace drop (volume down about 15 to 30%); C, B plus line compaction (about 5 to 15% more). These are workload-specific source estimates, not current invoice guarantees. The 38% Istio figure is not a universal expectation. [existing LOKI.md; https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/logs/]
- **Usage metrics:**

```PromQL
# Billable ingestion rate (bytes/s)
grafanacloud_logs_instance_billable_bytes_received_per_second

# Active stream count
grafanacloud_logs_instance_active_streams

# Current period monetary overage
grafanacloud_org_logs_overage{monetary="true"}

# Volume by configured attribution label (identifies unattributed share)
sum by (<attr_label>) (grafanacloud_logs_instance_attributed_bytes_received_per_second)
```

- **Cost attribution:** configure up to two labels under Cost Management > Settings; `__missing__` appears only when attribution is enabled. Measure before and about 7 days after a change.

## Label audit

Report: a downstream dependency check (alerts, dashboards, LBAC, recording rules); a label analysis table; estimated impact; cost impact as scenario cards A/B/C (no tables, no panel JSON); the recommended label set; migration notes.

**80/20:** demote `pod`; add `level` and always query it; normalize values; normalize or demote `filename`.

## Prove it

- `logcli series '{}' --since=1h --analyze-labels` shows no label with unbounded values (no IDs, timestamps or pod names in the index) and the stream count is within the tenant guidance.
- Every saved query and alert starts with a specific stream selector, uses `|=`/`!=` before any parser, and runs over a bounded time range.
- After a label change: dependent alerts, dashboards and recording rules still return data, `grafanacloud_logs_instance_active_streams` dropped, and average chunk size (`total_bytes / cache_chunk_req`) moved toward MB.
- After a drop stage: `sum(rate({app="my-app"} |= "GET /health" [5m]))` is 0 and `grafanacloud_logs_instance_billable_bytes_received_per_second` fell.
- `loki_discarded_samples_total` shows no `structured_metadata_too_large` or `structured_metadata_too_many`.
