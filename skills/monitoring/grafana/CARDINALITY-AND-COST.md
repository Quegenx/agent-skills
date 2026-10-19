# Cardinality and cost

Keeping Prometheus series counts and the Grafana Cloud bill under control: choosing labels, fighting a live cardinality fire, Adaptive Metrics, finding high-DPM metrics with dpm-finder, and Cost Management for metrics, logs and traces. Total series is roughly the product of each label's cardinality, and one unbounded label multiplies everything; the one fix you must never apply is dropping a series-unique label at scrape time. Loki stream labels and log cost are in [LOKI.md](LOKI.md); naming and recording rules in [PROMETHEUS.md](PROMETHEUS.md).

**Contents:** [How cardinality costs you](#how-cardinality-costs-you) · [The one rule](#the-one-rule) · [Choosing labels](#choosing-labels) · [Five levers, in order](#five-levers-in-order) · [Instrumentation hygiene](#instrumentation-hygiene) · [Troubleshooting a cardinality fire](#troubleshooting-a-cardinality-fire) · [Emergency fixes](#emergency-fixes) · [Audit report](#audit-report) · [Adaptive Metrics](#adaptive-metrics) · [dpm-finder](#dpm-finder) · [Cost Management](#cost-management) · [Prove it](#prove-it)

## How cardinality costs you

- **Series and cardinality.** A series is a unique metric name plus label key/value combination; cardinality is the number of unique values a label can have. Total series is about the product: `path` (100) x `status_code` (10) x `method` (5) x `instance` (50) = 250,000 series per metric. One more high-cardinality label often means 10 to 100x the count.
- **Two bills.** The ingestion path (head block, WAL, memory, `remote_write` payload, the Active Series and DPM bill) and the query path (`sum by`, `rate` and joins materialize series in memory).
- **Churn multiplies it.** When a label value changes often (deploy version, pod name, ephemeral IDs), every change creates a new series while the old one ages out. A daily churn of 100% means you carry about 2x the steady-state series count for the retention period.
- **The key question for any label:** "Will queries that use this metric reliably specify or aggregate on this label?" If not, it is not a label. Also ask whether the label segments the metric the way users think about it, and whether pushing the rare lookup to exemplars, logs or traces would be acceptable.
- **Histograms multiply.** A classic histogram costs bucket count + 3 series (`_bucket{le}`, `_sum`, `_count`, `_created` from Prometheus 2.39+); the default 11 buckets make it 14x. Native histograms (Prometheus 2.40+) use a single sparse series. Trim histogram labels first.
- **Recording rules reduce query cost, not ingest cost:** the raw series still exist.

## The one rule

**You cannot remove, at scrape time, any label that makes a series unique.** Not `pod`, not `instance`. That includes `metric_relabel_configs` with `action: labeldrop` and Alloy `prometheus.relabel`.

- **What breaks:** counter resets from different series merge, so `rate()` and `increase()` return garbage, often absurdly high; several samples per series per scrape cause duplicate-sample and out-of-order errors and inflate DPM; a `sum` over the dropped label double- or under-counts. It is silent: no config error, no evidence left.
- **Don't normalize values with a relabel `replacement` either** (`/users/123` to `/users/:id`, or `status_code` to `2xx`) at scrape: it merges distinct series and produces duplicate-sample errors and broken `rate()`. Do it in code (templating) or post-ingest with Adaptive Metrics.
- **The only safe remediations:** (1) drop an entire metric (`action: drop` on `__name__`); (2) fix the source; (3) Adaptive Metrics (counter-reset-aware, audited, reversible).
- **The one safe `labeldrop`:** a label that exactly duplicates a target label, e.g. `exported_instance`.
- **Conflict:** the PromQL skill shows an Alloy scrape-time `labeldrop` of `user_id` and says "drop high-cardinality labels"; the label-strategy and cardinality-troubleshooter skills forbid it, naming `user_id` among the labels never to `labeldrop`. Confirm in the current docs.
- **Loki is different:** demoting `pod` off the Loki index is recommended ([LOKI.md](LOKI.md)); in Prometheus, never dropping `pod` is the rule.

## Choosing labels

| Label | Cardinality | Verdict |
|---|---|---|
| `env` | 2 to 5 | Good |
| `job` | 5 to 50 | Good |
| `cluster`, `region` | Tens | Good |
| `namespace` | Tens to low hundreds | Acceptable |
| `service`, `workload`, `container` | Tens to hundreds | Acceptable |
| `instance` | Hundreds to low thousands | Evaluate; fine on per-instance metrics, risky on aggregated |
| `pod` | Thousands, transient | Keep (series uniqueness); reduce with Adaptive Metrics, never drop at scrape |
| `path`/`route` | Bounded if templated | Only templated (`/users/:id`) |
| `version`, `image_tag`, `git_sha` | Grows each deploy | Sparingly; info-metric pattern |
| `user_id`, `request_id`, `trace_id` | Unbounded | Never; use exemplars |
| `customer_id`, `tenant_id` | Often unbounded | Only small fixed tenant counts |
| `error_message`, `query`, `sql` | Unbounded text | Never |

- **Static vs dynamic.** Static target labels (set via `relabel_configs`, e.g. `env=prod`, `cluster=us-east`, `team=payments`) scale with targets; use them freely. Dynamic sample labels (`status_code`, `method`, `cache_hit`) keep their values in single digits or low tens; fix them in application code.
- **Consistency.** `status` vs `status_code` vs `http_status` are three label families and joins break. Normalize values (`200` vs `"200"`, `GET` vs `get`), use `snake_case`, and give the same concept the same name (`service`, not `svc` or `app_name`).
- **On histograms, bucket raw `status_code` to `status_class`** (`2xx`, `4xx`, `5xx`) in the instrumentation or via Adaptive Metrics, not at scrape.
- **Alternatives for labels to avoid:** `user_id`, `customer_id` (large tenant base): exemplars, or aggregate by `tenant_tier`; `request_id`, `trace_id`: exemplars; raw-URL `path`: template in code; `error_message`, `query`, `sql`: a bounded `error_type` enum; dynamically named label keys: fixed keys with bounded values.
- **Recommended target labels:** `job`, `instance`, `env`, `cluster`, `region`, `team`/`squad`, `service`. The application should not re-emit them.
- **Kubernetes:** keep `namespace` and `container`; add `workload` = `{controller_kind}/{controller_name}` alongside `pod`, not instead of it; add `service` if scraping via a Service. Never map `uid` into a label (it regenerates on every pod recreation; leave it out of `relabel_configs`, and don't `labeldrop` it after the fact). `instance`, `pod`, `node` and `host` come from scrape target labels, not app code. `kube_pod_labels` can carry dozens of metadata labels, each unique combination a new series: restrict kube-state-metrics with `--metric-labels-allowlist`, which controls what is ever emitted. The relabel config is in [PROMETHEUS.md](PROMETHEUS.md#scraping).
- **Exemplars, not labels, for trace correlation:** they carry `trace_id` without cardinality ([PROMETHEUS.md](PROMETHEUS.md#exemplars)).
- **Info metrics for `version`/`git_sha`/`image_tag`** ([PROMQL.md](PROMQL.md#joins-and-info-metrics)). Prefer `info()` on Prometheus 3.x when joining against `target_info`; fall back to the explicit `group_left` match on older versions, for custom info metrics, or when the experimental flag isn't enabled. The optional second argument of `info()` restricts which info labels are attached.
- **The 80/20:** (1) drop unbounded labels at the app layer; (2) trim histogram label cardinality; (3) don't emit `pod`/`instance`/`node` from code, add `workload`; (4) info metrics for `version`/`git_sha`/`image_tag`; (5) target labels via `relabel_configs`.
- **Scrape-time guards** (`sample_limit`, `label_limit` and friends) are listed in [PROMETHEUS.md](PROMETHEUS.md#scraping).

## Five levers, in order

1. **Fix it in the application:** templated routes, an `error_type` enum, no `user_id`, never user-supplied strings. It saves cost on every downstream system (Prometheus, `remote_write`, Mimir, Grafana Cloud).
2. **`relabel_configs`** (target time, before the scrape): set target labels, drop targets, rewrite `instance`, add service-discovery identity.
3. **Adaptive Metrics** (post-ingest; counter-reset-aware; audit trail; reversible).
4. **`metric_relabel_configs`** (after scrape, before storage), safe uses only: drop an entire metric, or remove an exact duplicate of a target label.

```yaml
metric_relabel_configs:
  - source_labels: [__name__]
    regex: my_app_request_details
    action: drop
```

5. **Recording rules,** e.g. a `service:http_requests:rate5m` rollup ([PROMETHEUS.md](PROMETHEUS.md#recording-rules)).

## Instrumentation hygiene

| Rule | Why |
|---|---|
| Never use unbounded user input as a label value | `email`, `user_id`, query strings and error messages are the number one cardinality bug |
| Template HTTP paths before recording | `/users/{id}`; most frameworks do this via routing metadata |
| Bound error labels via small enums | `error_type="timeout"` |
| No `version`/`git_sha`/`build_id` on every metric | Use an info metric |
| Don't emit `pod`/`node`/`host` from code | Collisions |
| Avoid dynamically constructed label names | `metric{[user]=1}` cannot be bounded |
| Use histograms sparingly, trim labels first | 14x |
| Prefer exemplars over labels for trace correlation | `trace_id` without cardinality |

## Troubleshooting a cardinality fire

| Symptom | Likely cause | First action |
|---|---|---|
| OOMKilled, memory growing linearly | Active series growth | Step 1 triage |
| Single query slow or OOMs the querier | High-cardinality metric in the query | Step 3 drill-down |
| Remote write lagging, WAL growing | Sample throughput spike (series or scrape interval) | Triage, check scrape intervals |
| `429 Too Many Samples` / `out of bounds` | Mimir/Cortex per-tenant series limit | Step 3 drill-down |
| Cloud Active Series bill spiked | New metric, label or rollout churn | Drill-down, then churn check |
| DPM spiked, Active Series flat | Scrape interval shortened or `remote_write` duplicates | [dpm-finder](#dpm-finder) |
| `series_limit_per_user` after a deploy | New bad label | Step 4 recent-change diff |
| Grows, then resets on every restart | Churn | Step 5 churn |

**Step 1: the headline.**

```promql
# Total active series in the local Prometheus
prometheus_tsdb_head_series

# Or for Mimir / Grafana Cloud Metrics (per tenant)
cortex_ingester_memory_series{user="<tenant>"}
```

```promql
# Growth over the last 7 days
deriv(prometheus_tsdb_head_series[7d]) * 86400
```

Growth of more than a few percent per day on a stable app set is a red flag. The TSDB status endpoint, usually the fastest path to the problem metric and label, `curl -s http://prometheus:9090/api/v1/status/tsdb | jq` returns `seriesCountByMetricName`, `labelValueCountByLabelName`, `memoryInBytesByLabelName` and `seriesCountByLabelValuePair`. Grafana Cloud: `curl -s -u "<user>:<token>" "https://prometheus-prod-XX.grafana.net/api/prom/api/v1/status/tsdb" | jq`.

**Step 2: read the top metrics.** `_bucket` at the top means a histogram at 14x: fix its labels at the source. For an unknown top-5 metric, grep the codebase. Count the `_total`/`_count`/`_sum` variants together. Any label with more than 10K unique values is almost certainly a bug; the only exceptions are intentional per-target labels in massive fleets. `trace_id`, `request_id`, `session_id`, `query`, `email`, `path` and `url` should never be labels: they belong in exemplars, logs or traces. A `pod` with thousands of values often means recent churn (Step 5).

**Step 3: drill down per metric.**

```promql
# How many unique values does each label have on this metric?
count by (__name__) (
  count by (__name__, label_name_here) (
    http_request_duration_seconds_bucket
  )
)
```

```bash
# Via the Prometheus HTTP API
curl -s "http://prometheus:9090/api/v1/labels?match[]=http_request_duration_seconds_bucket" | jq -r '.data[]' | \
  while read label; do
    count=$(curl -s "http://prometheus:9090/api/v1/label/${label}/values?match[]=http_request_duration_seconds_bucket" | jq '.data | length')
    echo "${count}  ${label}"
  done | sort -rn | head -20
```

```promql
# Top 20 path values for http_requests_total
topk(20,
  count by (path) (http_requests_total)
)
```

UUIDs, hashes, timestamps or numeric IDs among the top values mean the label has unbounded values from the source.

```promql
# Series-per-instance breakdown, if uneven, one instance is misbehaving
sum by (job, instance) ({__name__=~"my_metric.*"})
```

**Step 4: diff against a recent change.** A recent fire almost always has a recent cause. Use the Grafana Cloud cardinality dashboard, or diff these externally: a new metric near the top of `seriesCountByMetricName` that wasn't there a week ago is the offender.

```promql
# Current metrics
group by (__name__) ({__name__!=""})

# Compare to last week (offset)
group by (__name__) ({__name__!=""} offset 7d)
```

```promql
# Active series correlated with build_info
prometheus_tsdb_head_series
# Overlay with:
changes(app_build_info[1d])
```

A vertical step in series count aligned with a deploy is conclusive.

**Step 5: churn.** Series are created and abandoned faster than they age out: the count keeps climbing, then drops sharply on a Prometheus restart.

```promql
# Series created vs. removed per second
rate(prometheus_tsdb_head_series_created_total[5m])
rate(prometheus_tsdb_head_series_removed_total[5m])

# Ratio of churned to live
prometheus_tsdb_head_series_created_total / prometheus_tsdb_head_series
```

A creation rate that materially exceeds the removal rate, sustained, means cardinality is on a one-way trip up.

```promql
# A churn-driven head block carries old series until tsdb compaction
prometheus_tsdb_head_chunks
go_memstats_heap_inuse_bytes{job="prometheus"}
```

Churn causes: `pod` on rollouts; `version`/`git_sha`/`image_tag` on every metric; ephemeral hostnames in `instance`; dynamic label names (never plateaus); UUIDs as labels (linear growth, no correlation with deploys). Restarting Prometheus drops churned series but is not a fix; the fix is at the source. For deploy-driven churn: stop emitting `version`/`git_sha`/`instance` from app code (info metric for version), keep `pod` (Adaptive Metrics if too costly), and check that Kubernetes SD relabel rules don't map in `uid` or other ephemeral fields.

## Emergency fixes

Always test in staging first, and prefer fixing the source or Adaptive Metrics over any scrape-time drop. To stop the bleeding now (production OOM, ingest 429s), drop the entire offending metric (`action: drop` on `__name__`, same syntax in Alloy), then schedule the proper fix.

- **Histogram blowup** (`*_bucket` at the top, about 14x): first reduce the histogram's labels (`path`, `method`, `status_code`) in the instrumentation code, since every label removed saves 14x series; aggregate series already in Grafana Cloud with Adaptive Metrics. Then reduce the bucket count if appropriate (custom buckets vs defaults). For high-resolution latency, consider native histograms.
- **Path blowup from a new endpoint:** `http_requests_total` grew 10x+ overnight and `topk(20, count by (path) (http_requests_total))` shows hundreds of `/users/123456`-style values. Template the path in code; Adaptive Metrics can aggregate `path` away for series already in Grafana Cloud.
- **Debug metric in prod:** an unrecognized metric in the top 10, often a `_details` or `_per_request` metric the developer forgot to gate. Drop it entirely at scrape and open a ticket to remove it from the code.

- **kube-state-metrics** emits all labels and annotations as series by default. Restrict them:

```yaml
# kube-state-metrics flags
--metric-labels-allowlist=pods=[app,team,version]
--metric-annotations-allowlist=pods=[checksum/config]
```

- **Drop a whole metric until it is templated, or a bad metric or debug prefix:**

```yaml
# Emergency: drop the whole metric until the source is templated
metric_relabel_configs:
  - source_labels: [__name__]
    regex: http_requests_total
    action: drop
```

```yaml
metric_relabel_configs:
  # Drop a specific bad metric entirely
  - source_labels: [__name__]
    regex: bad_metric_name
    action: drop

  # Drop a set of debug/temporary metrics by name prefix
  - source_labels: [__name__]
    regex: debug_.*
    action: drop
```

```alloy
prometheus.relabel "drop_bad_metric" {
  forward_to = [prometheus.remote_write.default.receiver]

  rule {
    source_labels = ["__name__"]
    regex = "bad_metric_name"
    action = "drop"
  }
}
```

- **App-emitted label collisions:** one job's series count is several times what it should be. Prometheus renames the conflicting label to `exported_instance` and the like. Fix it in the application (stop emitting `instance`/`node`/`host`) and confirm `honor_labels` is `false` (the default) so target labels win. Stopgap, scoped tightly to the duplicated names and never including `pod`:

```yaml
# Stopgap ONLY for app-emitted duplicates of target labels.
# Drops the `exported_*` collisions - NOT pod, which makes K8s series unique.
metric_relabel_configs:
  - regex: exported_(instance|node|host)
    action: labeldrop
```

- **Federation:** a federated Prometheus or Mimir global view preserves each source's `cluster`/`region` labels by design, which multiplies series. If the count is too high, federate only recording rules ([PROMETHEUS.md](PROMETHEUS.md#scraping)).

## Audit report

For a label audit, report: Summary; a per-label table (Metric Family | Label | Cardinality | Used in Queries? | Verdict | Action); histogram-specific findings; estimated impact (active series, DPM where samples-per-minute = series x about 6 at a 10s scrape, memory); the recommended label set; and the implementation plan in lever order (code, then `relabel_configs`, then Adaptive Metrics, then recording rules).

## Adaptive Metrics

Grafana Cloud aggregation rules that shrink high-cardinality metrics before storage, reducing active-series billing. The original samples keep flowing, but the dropped labels no longer count toward billing. Docs: https://grafana.com/docs/grafana-cloud/cost-management-and-billing/reduce-costs/metrics-costs/adaptive-metrics/

- **Prerequisites:** a Grafana Cloud Metrics plan (any paid tier).
- **Auth.** The API base is `https://adaptive-metrics.grafana.net/api/v1` with `Authorization: Bearer <grafana-cloud-API-key>` (scope `metrics:write`). The metrics query endpoint `prometheus-prod-XX.grafana.net` uses HTTP basic auth instead: `<metrics_user>` (the numeric stack or instance ID) plus a token with `metrics:read`, not the Bearer key. UI: **Home > Adaptive Metrics**.
- **Endpoints:** GET `/recommendations`; POST `/recommendations/<ID>/apply`; GET `/rules`; POST `/rules`; DELETE `/rules/<RULE_ID>`; GET `/usage-analysis?filter=unused`.
- **Conflict (endpoint):** the Cost Management skill gives recommendations at `https://<stack>.grafana.net/api/plugins/grafana-adaptive-metrics-app/resources/v1/recommendations` with `Authorization: Bearer <token>`; the Adaptive Metrics skill uses `https://adaptive-metrics.grafana.net/api/v1/recommendations`. Confirm in the current docs.

- **Review and apply recommendations,** with a baseline first:

```bash
# 1. Pull the recommendation list (sorted by series-reduction impact)
curl -s -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/recommendations" \
  | jq '.recommendations[] | {metric_name, current_series, projected_series, estimated_reduction_percent}'

# 2. Capture the baseline series count for the target metric
#    (metrics query endpoint = basic auth, not the Bearer key)
curl -s -u "<metrics_user>:<metrics_token>" \
  "https://prometheus-prod-XX.grafana.net/api/prom/api/v1/query?query=count({__name__=\"process_cpu_seconds_total\"})" \
  | jq '.data.result[0].value[1]'   # → e.g. "12480"

# 3. Apply the recommendation (or click Apply in the UI)
curl -s -X POST -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/recommendations/<ID>/apply"

# 4. Wait ~5 min. Verify - re-run the count query; expect a large drop.
#    Also check the saving metric:
#      grafanacloud_instance_active_series_dropped_by_aggregation_rules
```

- **Before a custom rule, check nothing reads the labels:** `grep -r 'process_cpu_seconds_total' dashboards/ alerts/ | grep -E 'version|go_version'`; no hits means it is safe.
- **Custom rules:**

```bash
curl -s -X POST -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  "https://adaptive-metrics.grafana.net/api/v1/rules" \
  -d '{
    "rules": [{
      "metric_name": "process_cpu_seconds_total",
      "match_type":  "MATCH_TYPE_EXACT",
      "drop_labels": ["version", "go_version"],
      "aggregations":[{"type":"AGGREGATION_TYPE_SUM"}]
    }]
  }'
```

```bash
curl -s -X POST -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  "https://adaptive-metrics.grafana.net/api/v1/rules" \
  -d '{
    "rules": [{
      "metric_name": "go_.*",
      "match_type":  "MATCH_TYPE_REGEX",
      "drop_labels": ["go_version", "version", "service_instance_id"],
      "aggregations":[{"type":"AGGREGATION_TYPE_SUM"}]
    }]
  }'
```

- **Conflict (rule format):** the Cost Management skill shows a YAML rule form instead of the JSON `metric_name`/`match_type`/`drop_labels`/`aggregations` form above. Confirm in the current docs:

```yaml
# Keep only meaningful labels for HTTP histogram; drops pod/container/instance/node
- match: "^http_request_duration_seconds.*"
  action: keep
  match_labels:
    - method
    - status_code
    - service
```

- **Aggregation types:** `sum` (counters, request counts, byte totals), `max` (worst-case gauges), `min` (best-case gauges), `avg` (rate metrics and averages). Counters MUST use `sum`: averaging counters produces incorrect rates.
- **Labels commonly safe to drop globally (via Adaptive Metrics, not at scrape):** `version`, `app_version`, `go_version` (rarely queried in PromQL); `service_instance_id`, `pod_uid`, `container_id` (ultra-high cardinality); `git_commit`, `build_date` (static, inflate series for no query value).
- **Unused metrics:** confirm a metric is not in any dashboard (search dashboard JSON by metric name), alert or recording rule, and check with the owning team (it could be an SLO input). Then drop it with a `write_relabel_config` in Alloy (block below):

```bash
# 1. List unused metrics
curl -s -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/usage-analysis?filter=unused" | \
  jq '.metrics[] | {metric_name, series_count, last_queried}'

# 2. Confirm not referenced in dashboards / alerts / recording rules
grep -r '<METRIC_NAME>' dashboards/ alerts/ recording-rules/

# 3. Add a write_relabel_config drop in Alloy (full block in references/api.md)
#    Reload Alloy: curl -X POST http://localhost:12345/-/reload

# 4. Verify - the metric should no longer appear in series counts after ~10 min
curl -s -u "<metrics_user>:<metrics_token>" \
  'https://prometheus-prod-XX.grafana.net/api/prom/api/v1/label/__name__/values' | jq '.data | index("<METRIC_NAME>")'  # → null
```

```alloy
prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = "https://prometheus-prod-XX.grafana.net/api/prom/push"
    write_relabel_config {
      source_labels = ["__name__"]
      regex         = "unused_metric_name|another_unused_metric"
      action        = "drop"
    }
  }
}
```

- **Measure:** `grafanacloud_instance_active_series` (the billed unit) and `grafanacloud_instance_active_series_dropped_by_aggregation_rules`. Rules take effect within about 5 minutes; the full billing impact shows within an hour. The Cost Management skill adds: test in "Preview" mode before applying, expect 10x+ reduction for high-cardinality metrics after 10 minutes, and typically 40 to 60% fewer series.
- **Roll back:** delete the rule:

```bash
curl -s -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/rules" | jq '.rules[] | {id, metric_name}'
curl -s -X DELETE -H "Authorization: Bearer <KEY>" \
  "https://adaptive-metrics.grafana.net/api/v1/rules/<RULE_ID>"
# Or in the UI: Rules → row → Disable
```
- **Docs:** cardinality in Prometheus https://grafana.com/docs/grafana-cloud/send-data/metrics/cardinality/ ; Adaptive Logs https://grafana.com/docs/grafana-cloud/cost-management-and-billing/reduce-costs/logs-costs/adaptive-logs/
- **Adaptive Logs recommendations:** `curl -s -H "Authorization: Bearer <KEY>" "https://adaptive-logs.grafana.net/api/v1/recommendations" | jq '.recommendations[] | {stream_selector, estimated_reduction_percent}'`.

## dpm-finder

A Grafana Professional Services CLI that ranks metrics by Data Points per Minute. Use it when DPM spiked but Active Series stayed flat. Source: https://github.com/grafana-ps/dpm-finder. Needs Python 3.9+, a Cloud Prometheus endpoint, the numeric stack ID and an API key (`glc_…`, scope `metrics:read`).

```bash
# 1. Clone + venv + install
git clone https://github.com/grafana-ps/dpm-finder.git
cd dpm-finder
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 2. Configure creds - copy .env_example → .env and fill in:
#    PROMETHEUS_ENDPOINT  https://prometheus-<cluster_slug>.grafana.net  (NOTHING after .net)
#    PROMETHEUS_USERNAME  <numeric stack id>
#    PROMETHEUS_API_KEY   glc_…

# 3. Verify creds before scanning - should return >0 series count
curl -s -u "$PROMETHEUS_USERNAME:$PROMETHEUS_API_KEY" \
  "$PROMETHEUS_ENDPOINT/api/v1/label/__name__/values" | jq '.data | length'

# 4. Run the scan (10-min lookback, 2.0 DPM minimum, top output)
./dpm-finder.py -f json -m 2.0 -t 8 --timeout 120 -l 10

# 5. Read the result - top 10 metrics by DPM
jq -r '.metrics | sort_by(-.dpm) | .[:10][] | "\(.dpm)\t\(.series_count)\t\(.metric_name)"' metric_rates.json
```

- **Find the stack:** with gcx (https://github.com/grafana/gcx) run `gcx config check` (active stack context), `gcx config list-contexts` (all configured stacks), `gcx config view` (full config with endpoints). The endpoint pattern is `https://prometheus-{cluster_slug}.grafana.net` and the username is the numeric stack ID. Without it: the portal, or `grafanacloud_instance_info{name=~"STACK_NAME.*"}` on the usage datasource.
- **Multi-stack:** at most 3 concurrent runs, to avoid Grafana Cloud rate limits; batch the stacks and wait for each batch before the next.
- **Reading results:** `dpm` is the maximum data points per minute across the metric's series; `series_count` is the metric's active series count; `series_detail[]` (JSON and text output) gives per-label-combination DPM, to spot the offending label. Sort by DPM descending for the noisiest metrics, and add `--cost-per-1000-series` to prioritize by spend.

| Flag | Default |
|---|---|
| `-f/--format` | `csv` (csv, text, txt, json, prom) |
| `-m/--min-dpm` | `1.0` |
| `-t/--threads` | `10` |
| `-l/--lookback` | `10` minutes |
| `--timeout` | `60` |
| `--cost-per-1000-series` | adds `estimated_cost` |
| `-q/--quiet`, `-v/--verbose` | |
| `-e/--exporter`, `-p/--port`, `-u/--update-interval` | port `9966`, interval `86400` |

- **Outputs** (written to the current working directory): `metric_rates.csv` (`metric_name`, `dpm`, `series_count`, plus `estimated_cost`), `metric_rates.json` (plus `series_detail[]`, `performance_metrics`), `metric_rates.txt`, `metric_rates.prom` (for the Alloy textfile collector). Exporter mode `./dpm-finder.py -e -p 9966 -u 86400` serves `http://localhost:PORT/metrics` and recalculates every `-u` seconds. Docker: `docker build -t dpm-finder:latest .`, then `docker run --rm --env-file .env -v $(pwd)/output:/app/output dpm-finder:latest --format json --min-dpm 2.0`.
- **Auto-excluded:** `*_count`, `*_bucket`, `*_sum`, `grafana_*`, and metrics with aggregation rules (HTTP 422).
- **Troubleshooting:** 401/403 means a wrong key or scope, or a non-numeric username; timeouts: `--timeout` 120+; HTTP 422: the metric has aggregation rules and is skipped; empty: lower `-m`, and nothing after `.net` in the endpoint; connection errors get exponential backoff up to 10 retries (429 is backed off, other 4xx are not retried); persistent failure usually means network or firewall.

## Cost Management

Docs: https://grafana.com/docs/grafana-cloud/cost-management-and-billing/ ; Adaptive Logs: https://grafana.com/docs/grafana-cloud/cost-management-and-billing/reduce-costs/logs-costs/

- **Prerequisites:** Adaptive Metrics, Logs and Traces enabled (under **Cost Management**); Alloy (or Grafana Agent) with API key scopes `metrics:write` + `logs:write` (+ `traces:write`); admin access.
- **Billing scope:** the source summarized Metrics as active series, Profiles as bytes, Synthetic Monitoring as executions and k6 as VUh; check the current plan and each product's invoice. Grafana Cloud Logs and Traces currently meter GBs processed, written and retained, and Logs adds queried volume above fair use. The old line reduced Logs to ingested bytes and Traces to ingested spans. [existing CARDINALITY-AND-COST.md; https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/logs/; https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/traces/]
- **Cost attribution labels:** put `team` and `project` external labels on every Alloy config, reload Alloy (`curl -X POST http://localhost:12345/-/reload`), then verify in Explore with `count by (team, project) ({__name__=~".+"})` and group by `team`/`project` in Cost Management.

```alloy
prometheus.remote_write "cloud" {
  endpoint {
    url = sys.env("PROMETHEUS_URL")
    basic_auth {
      username = sys.env("PROM_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
  external_labels = {
    team    = "platform",
    project = "checkout-service",
    env     = "production",
  }
}

loki.write "cloud" {
  endpoint {
    url = sys.env("LOKI_URL")
    basic_auth {
      username = sys.env("LOKI_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
  external_labels = {
    team    = "platform",
    project = "checkout-service",
  }
}
```

- **Drop and sample logs in Alloy,** then reload Alloy. Health logs should no longer appear in Logs Drilldown: `sum(rate({app="my-app"} |= "GET /health" [5m]))` should return 0, and bytes ingested should drop (compare 24h before and after with `sum(increase(loki_ingester_chunk_size_bytes_sum[24h])) by (namespace)`). Log label cost is in [LOKI.md](LOKI.md#log-cost).

```alloy
loki.process "filter_logs" {
  forward_to = [loki.write.cloud.receiver]

  // Drop health-check logs
  stage.drop {
    expression = ".*GET /health.*"
  }

  // Drop debug logs
  stage.drop {
    source     = "level"
    expression = "debug"
  }

  // Sample verbose info logs (keep 10%)
  stage.sampling {
    rate   = 0.1
    source = "level"
    value  = "info"
  }
}
```

- **Tail-sample traces:** keep errors and slow spans, sample the rest to 5 to 10%.

```alloy
otelcol.processor.tail_sampling "cost_control" {
  decision_wait = "10s"
  policy {
    name = "keep-errors"
    type = "status_code"
    status_code { status_codes = ["ERROR"] }
  }
  policy {
    name = "keep-slow"
    type = "latency"
    latency { threshold_ms = 1000 }
  }
  policy {
    name = "sample-rest"
    type = "probabilistic"
    probabilistic { sampling_percentage = 5 }
  }
  output {
    traces = [otelcol.exporter.otlp.cloud.input]
  }
}
```

- **Usage alerts at 80% of quota:**

```yaml
groups:
  - name: grafana-cloud-usage
    rules:
      - alert: MetricsUsageHigh
        expr: grafana_cloud_metrics_active_series / grafana_cloud_metrics_limit > 0.8
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Grafana Cloud metrics usage >80% of quota"

      - alert: LogsIngestionHigh
        expr: increase(grafana_cloud_logs_bytes_ingested_total[24h]) > 50e9  # 50GB/day
        labels:
          severity: warning
        annotations:
          summary: "Grafana Cloud log ingestion >50GB today"
```

- **Cost queries:**

```promql
# Active series (billing unit for metrics)
grafana_cloud_metrics_active_series

# Top 20 highest-cardinality metric names
topk(20, count by (__name__) ({__name__=~".+"}))

# Log bytes ingested per stream
sum(increase(loki_ingester_chunk_size_bytes_sum[24h])) by (namespace, app)

# Trace spans ingested
rate(tempo_distributor_spans_received_total[5m])
```
- **Conflict (usage metric names):** the Cost Management skill uses `grafana_cloud_metrics_active_series`; the Adaptive Metrics skill uses `grafanacloud_instance_active_series`; the Loki label analyzer uses `grafanacloud_logs_instance_*`. Check which names exist in your usage datasource before alerting on them.
- **Checklist:** apply Adaptive Metrics recommendations; drop health and readiness probe logs; tail-sample traces to 5 to 10% while keeping errors and slow spans; `team` + `project` external labels on every Alloy config; usage alerts at 80% of quota; replace expensive ad-hoc queries with recording rules.

## Prove it

- `prometheus_tsdb_head_series` (or `cortex_ingester_memory_series{user="<tenant>"}`) is flat or falling after the change, and `deriv(prometheus_tsdb_head_series[7d]) * 86400` is no more than a few percent of the total per day.
- No label on the fixed metric has more than 10K values (`/api/v1/status/tsdb`, `labelValueCountByLabelName`), and `rate()` on it returns sane magnitudes (no merged counter resets).
- After an Adaptive Metrics rule: `grafanacloud_instance_active_series_dropped_by_aggregation_rules` rises within about 5 minutes and the baseline `count(...)` of the billed metric falls within an hour; dashboards and alerts that use the metric still return data.
- dpm-finder's top 10 shrinks after the fix, and `count by (team, project) ({__name__=~".+"})` shows no unattributed share.
