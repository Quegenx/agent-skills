# Prometheus

Designing Prometheus metrics, recording rules, histograms and scrape configs, with long-term Mimir deployment in [MIMIR.md](MIMIR.md). A series is one unique metric name plus label key-value set, and too many series means memory pressure, slow queries, ingest pressure and a high bill, so the labels you attach and how many values each one takes decide most outcomes. Querying is in [PROMQL.md](PROMQL.md); label strategy, cardinality fires and Grafana Cloud cost are in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md); OpenTelemetry instrumentation is in [the observability skill](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

**Contents:** [Metric names](#metric-names) · [Labels](#labels) · [What to instrument](#what-to-instrument) · [Histograms vs summaries](#histograms-vs-summaries) · [Recording rules](#recording-rules) · [Scraping](#scraping) · [Exemplars](#exemplars) · [Prove it](#prove-it)

## Metric names

The naming conventions are a style guide, not a requirement. Docs: https://prometheus.io/docs/practices/naming/

- **Use legal characters and an application prefix.** Names MUST use the data model's characters and SHOULD start with a single-word application prefix (the "namespace"): `prometheus_notifications_total`, `process_cpu_seconds_total`, `http_request_duration_seconds`.
- **One unit, one quantity, base units.** A name MUST refer to a single unit and a single quantity, SHOULD use base units and SHOULD end in the plural unit. An accumulating count gets `_total` in addition to the unit: `http_request_duration_seconds`, `node_memory_usage_bytes`, `http_requests_total`, `process_cpu_seconds_total`, `foobar_build_info` (a metadata pseudo-metric), `data_pipeline_last_record_processed_timestamp_seconds`. Countable things like `connections` are not units.
- **Put unit and type in the name** even when they are stored elsewhere (OpenTelemetry differs). Prometheus strongly recommends it: it keeps YAML readable during incidents and avoids collisions such as `process_cpu` in seconds vs milliseconds.
- **Order components for grouping.** You MAY order the parts so related metrics sort together, e.g. `prometheus_tsdb_head_truncations_closed_total`.
- **One logical thing per metric.** A metric SHOULD mean the same thing across all its label dimensions; rule of thumb: `sum()` or `avg()` over all dimensions should be meaningful. Queue capacities in one metric is fine; capacity mixed with current element count is not.
- **Use `snake_case`** for metric and label names.

| Quantity | Base unit |
|---|---|
| Time | seconds |
| Temperature | celsius (preferred over kelvin for practical reasons; kelvin is acceptable in special cases like color temperature or where temperature has to be absolute) |
| Length | meters |
| Bytes, bits | bytes (always bytes, even where bits appear more common, to avoid confusion combining metrics) |
| Percent | ratio (0 to 1, `ratio` suffix, e.g. `disk_usage_ratio`; usual pattern `A_per_B`) |
| Voltage | volts |
| Current | amperes |
| Energy | joules |
| Power | export a counter of joules; `rate(joules[5m])` gives watts |
| Mass | grams (preferred over kilograms to avoid issues with the kilo prefix) |

## Labels

- **Labels differentiate characteristics; names don't.** Use `api_http_requests_total` with `operation="create|update|delete"`, `api_request_duration_seconds` with `stage="extract|transform|load"`. Never put label names in the metric name.
- **One metric with a label beats many metrics.** `http_responses_total` with a `code` label, not `http_responses_500_total` and `http_responses_403_total`. No part of a metric name is ever procedurally generated, except when proxying from another system.
- **Every unique key-value combination is a new series.** Never store high-cardinality dimensions (user IDs, email addresses, other unbounded sets) in labels.
- **Keep cardinality low.** Keep each metric's cardinality below 10; for the few that exceed it, limit them to a handful across the whole system. The vast majority of metrics should have no labels. Over 100, or with potential to grow: reduce dimensions or move the analysis to a general-purpose processing system. Example: `node_filesystem_avail` on 10,000 nodes is about 100,000 series, fine; adding per-user quota with 10,000 users reaches double-digit millions, too much for Prometheus. Each label set is another series with RAM, CPU, disk and network costs. If unsure, start with no labels and add labels over time as concrete use cases arise.
- **Same concept, same name.** `status` vs `status_code` vs `http_status` are three label families and joins break; `service` vs `svc` vs `app_name` likewise. Normalize values (`200` vs `"200"`, `GET` vs `get`).
- The full scoring table, levers and Kubernetes labels are in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md).

## What to instrument

Docs: https://prometheus.io/docs/practices/instrumentation/

- **Instrument everything,** and instantiate metric objects in the same file you use them.
- **Online serving:** count queries, errors and latency; in-progress requests help too. Monitor both client and server side. Count queries when they end, so the count lines up with error and latency stats.
- **Offline processing:** per stage track items in, in progress, last processed time and items out, plus batches in and out. Better: send a heartbeat dummy item with an insert timestamp and have each stage export the most recent heartbeat timestamp.
- **Batch jobs:** the key metric is the last time it succeeded; also per-stage duration, overall runtime and last completion time, as gauges pushed to the PushGateway. Jobs running longer than a few minutes should also be scraped; jobs running more often than every 15 minutes should become daemons.
- **Libraries:** instrument with no configuration required. Libraries for external resources track query count, errors and latency at minimum, and distinguish uses with labels where appropriate (a DB pool distinguishes databases).
- **Logging:** for every line of logging code, a counter that is incremented. Export total info, error and warning lines and check the differences in your release process.
- **Failures:** a counter per failure plus a total-attempts metric, so the failure ratio is easy.
- **Thread pools:** queued requests, threads in use, total threads, tasks processed, duration, time waiting in queue. **Caches:** total queries, hits, overall latency, plus the backing system's query count, errors and latency. **Collectors:** a gauge for collection duration (seconds) and an error count. Duration as a gauge is fine only for collectors and batch job durations.
- **Counter or gauge:** if the value can go down, it is a gauge. Use `rate()` on counters; never take a `rate()` of a gauge.
- **Timestamps, not time since:** export the Unix timestamp and compute `time() - my_timestamp_metric`.
- **Inner loops (over 100k calls/sec):** a Java counter increment costs 12 to 17 ns. Limit metrics in the loop, avoid labels or cache the label lookup (`With()` in Go, `labels()` in Java).
- **Avoid missing metrics:** export a default `0` for series known in advance. Go, Java and Python clients export `0` automatically for unlabeled metrics.
- **Version and build metadata go in an info metric,** never on every metric. See the info-metric pattern in [PROMQL.md](PROMQL.md#joins-and-info-metrics).

## Histograms vs summaries

Docs: https://prometheus.io/docs/practices/histograms/

- **Prefer native histograms** over both classic histograms and summaries whenever you can.
- **Summary:** quantiles computed in the program over preconfigured windows. Accurate, but costs the program; you can't recalculate other windows or percentiles, and quantiles can't be aggregated.
- **Classic histogram:** buckets, aggregatable, arbitrary quantiles computed on the server. Each bucket is a `_bucket` series whether populated or not. Picking buckets ahead is hard and changing them is disruptive.
- **Native histogram (Prometheus 2.40+):** one series of composite samples (count, sum, dynamic buckets). You configure resolution, not boundaries; the exponential schema covers -Inf to +Inf. Requires protobuf exposition (Java, Go libraries); text format support is underway in OpenMetrics v2.
- **NHCB:** classic histograms can be ingested as Native Histograms with Custom Bucket boundaries: more efficient storage, same PromQL as native. On the instrumentation side they are identical to classic histograms (NHCBs are created on the server at ingestion). Query performance and series count match native histograms; quantile error matches the corresponding classic histogram. They handle a bucket layout change a bit more gracefully than classic histograms, but it is still problematic and is flagged by an annotation. If you can, ingest classic histograms as NHCB rather than working "purely classic".
- **OpenTelemetry ingestion:** normal OTel histograms become classic or NHCB (prefer NHCB); OTel exponential histograms become native histograms.
- **Series cost of a classic histogram:** bucket count + 3 (`_bucket{le}`, `_sum`, `_count`, and `_created` from Prometheus 2.39+). The default `prometheus.DefBuckets` has 11 buckets, so 14x: 1,000 series become 14,000. Trim histogram labels first; use histograms sparingly.
- **Negative observations break the `_sum` rate** of classic histograms and summaries (seen as a counter reset). Native histograms rate as a whole. Workaround: two separate metrics for positive and negative values.
- **Size for the SLO.** For a p95 against a 300 ms SLO, the docs give three options: a summary with a 0.95 quantile and (for example) a 5-minute decay time; a native histogram with a decent resolution (in Go, `NativeHistogramBucketFactor` 1.1); or a classic histogram with a few buckets around the 300 ms mark, e.g. `{le="0.1"}`, `{le="0.2"}`, `{le="0.3"}`, `{le="0.45"}`. With a histogram, a later change of percentile or window is only a query change, not a reconfiguration of the instrumentation.

| | Native | Classic | Summary |
|---|---|---|---|
| Configure at instrumentation | a resolution, maybe a strategy to limit bucket count | buckets for the expected range and queries | φ-quantiles and sliding window; others can't be calculated later |
| Instrumentation cost | cheap (increment counters) | cheap (increment counters) | relatively expensive (streaming quantiles) |
| Query performance | server computes quantiles from complex samples; recording rules if too slow | server computes quantiles from many bucket series; recording rules if too slow | fast (no server calculation) |
| φ-quantile and window | ad hoc in PromQL | ad hoc in PromQL | preconfigured at instrumentation |
| Series | one | `_sum`, `_count` + one per bucket | `_sum`, `_count` + one per quantile |
| Quantile error | limited by resolution | limited by bucket width | configurable, very low |
| Aggregation | always compatible | if buckets never change | not aggregatable |
| Error controlled in | observed value | observed value | φ |

Rules of thumb: (1) native histograms with resolution matching your accuracy needs; (2) otherwise classic histograms if you need aggregation, with appropriate buckets; (3) consider summaries only if no aggregation is needed. Use recording rules when ad-hoc quantile calculation is too slow (large dashboards). Heatmaps (the Grafana heatmap panel) work on Prometheus histograms; classic resolution is usually too low for compelling heatmaps, native histograms give detailed ones. Quantile, average and Apdex queries are in [PROMQL.md](PROMQL.md#histograms).

## Recording rules

Recording rules precompute expensive PromQL so dashboards are fast. The recorded series has the same data point density but far fewer series. They reduce query cost, not ingest cost: the raw series still exist. Docs: https://prometheus.io/docs/practices/rules/

- **Name `level:metric:operations`.** `level` is the aggregation level and the labels of the output; `metric` is the metric name unchanged, except strip `_total` when using `rate()` or `irate()`; `operations` lists the operations, newest first. An unchanged metric name keeps it easy to know what the metric is and to find it in the codebase. The vendor skills phrase it `<aggregation_level>:<metric_name>:<operation_and_window>` and name a rule `job:http_requests_total:rate5m` (keeping `_total`); the Prometheus practices page says to strip it. Confirm in the current docs.
- **Operation naming:** omit `_sum` if there are other operations; merge associative operations (`min_min` is `min`); the default operation is `sum`; for a ratio, separate the metrics with `_per_` and name the operation `ratio`.
- **Aggregate numerator and denominator separately, then divide.** Never average a ratio or average an average.
- **Always specify a `without` clause** with the labels you are aggregating away; it preserves `job` and other labels, which avoids conflicts and gives more useful metrics and alerts. Labels in `without` are removed from the output level; with no aggregation the levels match. A mismatch means a mistake. (The vendor skill examples below use `by`.)
- **Summary averages:** for `_count`/`_sum` averages keep the name without the suffix and replace `rate` with `mean`.
- **YAML style:** the docs use the `|2` block indentation indicator so operators can sit outdented.

From the Prometheus practices page:

```yaml
- record: instance_path:requests:rate5m
  expr: rate(requests_total{job="myjob"}[5m])

- record: path:requests:rate5m
  expr: sum without (instance)(instance_path:requests:rate5m{job="myjob"})
```

```yaml
- record: instance_path:request_failures:rate5m
  expr: rate(request_failures_total{job="myjob"}[5m])

- record: instance_path:request_failures_per_requests:ratio_rate5m
  expr: |2
      instance_path:request_failures:rate5m{job="myjob"}
    /
      instance_path:requests:rate5m{job="myjob"}

# Aggregate up numerator and denominator, then divide to get path-level ratio.
- record: path:request_failures_per_requests:ratio_rate5m
  expr: |2
      sum without (instance)(instance_path:request_failures:rate5m{job="myjob"})
    /
      sum without (instance)(instance_path:requests:rate5m{job="myjob"})

# No labels left from instrumentation or distinguishing instances,
# so we use 'job' as the level.
- record: job:request_failures_per_requests:ratio_rate5m
  expr: |2
      sum without (instance, path)(instance_path:request_failures:rate5m{job="myjob"})
    /
      sum without (instance, path)(instance_path:requests:rate5m{job="myjob"})
```

```yaml
- record: instance_path:request_latency_seconds_count:rate5m
  expr: rate(request_latency_seconds_count{job="myjob"}[5m])

- record: instance_path:request_latency_seconds_sum:rate5m
  expr: rate(request_latency_seconds_sum{job="myjob"}[5m])

- record: instance_path:request_latency_seconds:mean5m
  expr: |2
      instance_path:request_latency_seconds_sum:rate5m{job="myjob"}
    /
      instance_path:request_latency_seconds_count:rate5m{job="myjob"}

# Aggregate up numerator and denominator, then divide.
- record: path:request_latency_seconds:mean5m
  expr: |2
      sum without (instance)(instance_path:request_latency_seconds_sum:rate5m{job="myjob"})
    /
      sum without (instance)(instance_path:request_latency_seconds_count:rate5m{job="myjob"})
```

```yaml
- record: job:request_latency_seconds_count:avg_rate5m
  expr: avg without (instance, path)(instance_path:request_latency_seconds_count:rate5m{job="myjob"})
```

From the vendor skills (rule groups with an evaluation `interval`):

```yaml
groups:
  - name: http_request_rates
    interval: 1m
    rules:
      - record: job:http_requests_total:rate5m
        expr:   sum(rate(http_requests_total[5m])) by (job)

      - record: job:http_errors:ratio5m
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job)
          / sum(rate(http_requests_total[5m])) by (job)

      - record: job:http_request_duration_p95:rate5m
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))
```

```yaml
groups:
  - name: api_rules
    interval: 1m
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      - record: job:http_request_duration_seconds:p99
        expr: histogram_quantile(0.99, sum by (job, le) (rate(http_request_duration_seconds_bucket[5m])))
```

A service-level rollup that drops the pod and instance dimension:

```yaml
groups:
  - name: http-requests-aggregates
    interval: 30s
    rules:
      # Drop pod/instance dimension; keep only service-level rollup
      - record: service:http_requests:rate5m
        expr: sum by (service, env, cluster, status_code) (rate(http_requests_total[5m]))
```

- **Deploy and verify:**

```bash
# 1. Validate rule syntax
promtool check rules rules/recording.yml

# 2. Reload Prometheus (after adding to rule_files in prometheus.yml)
curl -X POST http://localhost:9090/-/reload

# 3. Verify rules are active
curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {name, health}'
```

- **Slow dashboard query workflow:** name the expression as a rule; after rules load, check `curl -sG --data-urlencode "query=job:http_request_duration_p95:rate5m" "$PROM/api/v1/query" | jq '.data.result | length'` returns more than 0; check it matches the original expression at the same timestamp; then replace the panel's expression with the recording-rule metric.
- **Federate only recording rules** (see [Scraping](#scraping)). Loki also has recording rules for slow queries ([LOKI.md](LOKI.md)). Alerting rules and Alertmanager are in [ALERTING.md](ALERTING.md).

## Scraping

- **Cardinality guards per `scrape_config` (and global):** `sample_limit` (samples per scrape), `label_limit` (labels per sample), `label_name_length_limit` and `label_value_length_limit` (bytes per label name or value; UTF-8, a character can take up to 4 bytes). Exceeding any of these after metric relabeling fails the entire scrape. Also `target_limit` (unique targets per scrape config, experimental), `keep_dropped_targets` (targets dropped by relabeling kept in memory) and `body_size_limit` (experimental). All default to `0`, no limit.
- **`relabel_configs` runs at target time, before the scrape:** set target labels (`env=prod`, `cluster=us-east`, `team=payments`), drop targets, rewrite `instance`, add service-discovery identity. Target labels scale with targets; use them freely.
- **`metric_relabel_configs` runs after the scrape, before storage.** Its only safe uses are dropping an entire metric and removing an exact duplicate of a target label. Never drop or rewrite a label that makes a series unique; see [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#the-one-rule).
- **Recommended target labels:** `job` (automatic), `instance` (automatic, rename via `relabel_configs`), `env`, `cluster` (critical for federation and Mimir multi-tenancy), `region`, `team`/`squad`, `service`. The application should not re-emit them (collisions, `honor_labels`).
- **Kubernetes pod scraping:**

```yaml
scrape_configs:
  - job_name: my-app
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # Set workload from controller metadata
      - source_labels: [__meta_kubernetes_pod_controller_kind, __meta_kubernetes_pod_controller_name]
        target_label: workload
        separator: /
      # Set env from a pod label
      - source_labels: [__meta_kubernetes_pod_label_env]
        target_label: env
      # Only scrape pods explicitly opted in
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        regex: "true"
        action: keep
```

- **App-emitted label collisions:** Prometheus renames a colliding label to `exported_instance`; confirm `honor_labels` is `false` (the default).
- **Federation: federate only recording rules:**

```yaml
- job_name: federate
  honor_labels: true
  metrics_path: /federate
  params:
    'match[]':
      - '{__name__=~".*:.*"}'  # Recording-rule naming convention only
```

- **Scraping and shipping with Alloy** (`prometheus.scrape`, `prometheus.relabel`, `prometheus.remote_write`) is in [ALLOY.md](ALLOY.md).

## Exemplars

Exemplars attach a `trace_id` (or any key-value pair) to specific samples without making it a label dimension: use them for `trace_id` correlation (Tempo, Jaeger), a `request_id` for specific debug lookups, or any sparse key that is useful when you need it. Query them with Grafana's exemplars-on-graph, not PromQL aggregation. They require the OpenMetrics format and Prometheus 2.26+. Scrape config, then the Prometheus server:

```yaml
scrape_configs:
  - job_name: my-app
    enable_protobuf_negotiation: true
    # Or for text-format:
    follow_redirects: true
```

```yaml
storage:
  exemplars:
    max_exemplars: 100000
```

For this workflow, read [MIMIR.md](MIMIR.md). [existing skills/monitoring/grafana/PROMETHEUS.md]

## Prove it

- `promtool check rules` passes and `/api/v1/rules` shows every rule with `health` ok; each recording-rule metric returns more than 0 results and matches its source expression at the same timestamp.
- Every new metric name has a unit suffix (and `_total` for counters), and its series count (`count(<metric>)`) stays below 10 unless it is one of the handful you planned above that.
