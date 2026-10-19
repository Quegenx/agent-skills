# PromQL

Writing and optimizing PromQL against Prometheus, Mimir or Grafana Cloud Metrics. A query returns an instant vector, a range vector or a scalar. Wrong rate magnitudes come from aggregating a counter before `rate()`, and NaN or wrong quantiles from forgetting `by (le)` before `histogram_quantile` (the most common bug). Query timeouts come from too high a series count, fixed with `topk(...)`, recording rules ([PROMETHEUS.md](PROMETHEUS.md#recording-rules)) and label hygiene ([CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md)).

**Contents:** [Selectors](#selectors) · [Rates](#rates) · [Aggregation](#aggregation) · [Histograms](#histograms) · [Ratios and error rates](#ratios-and-error-rates) · [Saturation and prediction](#saturation-and-prediction) · [Absence and staleness](#absence-and-staleness) · [Time offsets](#time-offsets) · [SLOs and burn rate](#slos-and-burn-rate) · [Joins and info metrics](#joins-and-info-metrics) · [Cardinality queries](#cardinality-queries) · [Validate a query](#validate-a-query) · [Common bugs](#common-bugs) · [Metrics Drilldown](#metrics-drilldown) · [Prove it](#prove-it)

Docs: https://prometheus.io/docs/prometheus/latest/querying/basics/ , https://prometheus.io/docs/prometheus/latest/querying/operators/ , https://prometheus.io/docs/prometheus/latest/querying/functions/

## Selectors

```promql
# By metric name
http_requests_total

# Label filter
http_requests_total{job="api-server"}

# Multiple labels (AND)
http_requests_total{job="api-server", method="GET"}

# Regex
http_requests_total{job=~"api.*", status=~"5.."}

# Negative
http_requests_total{status!="200"}
```

```promql
http_requests_total{job="api", status_code="200"}
http_requests_total{status_code=~"5.."}
http_requests_total{status_code!~"2.."}
http_requests_total{env=~"staging|production"}
```

The vendor examples use both `status` and `status_code` for the same label; use whichever your metrics actually carry, and keep one name across the system.

## Rates

- **Golden rule: the range must be at least 4x the scrape interval** for `rate()` and `increase()`. A 60s scrape needs `[5m]` minimum.
- **`rate()` smooths the full window:** use it for dashboards and alerts. **`irate()` uses the last two samples:** for spike detection only, never alerting. (One vendor example still uses `irate` for CPU saturation, below.)
- **Use `rate()` on counters only;** never take a `rate()` of a gauge.

```promql
# Per-second rate over 5 minutes
rate(http_requests_total[5m])

# Increase over interval
increase(http_requests_total[1h])

# Instant rate (last two samples)
irate(http_requests_total[5m])

# Offset (5 minutes ago)
rate(http_requests_total[5m] offset 5m)
```

### Rate first, then aggregate

```promql
# rate(): per-second average
rate(http_requests_total[5m])

# CORRECT: rate first, then aggregate
sum(rate(http_requests_total{job="api"}[5m])) by (status_code)

# WRONG: never sum() a raw counter before rate()
sum(http_requests_total) by (status_code)   # do NOT then rate()

# increase(): total count over window
increase(http_requests_total[1h])
```

## Aggregation

`by` keeps only the listed labels; `without` drops only the listed labels.

```promql
# Sum by label
sum by (job) (rate(http_requests_total[5m]))

# Average
avg by (instance) (node_cpu_seconds_total)

# Top-K
topk(5, rate(http_requests_total[5m]))

# Histogram quantiles
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Count distinct
count(up{job="api"})
```

```promql
sum(rate(http_requests_total[5m])) by (service)
avg(node_cpu_seconds_total{mode="idle"}) by (instance)

# Top 5 by request rate
topk(5, sum(rate(http_requests_total[5m])) by (service))

# Count of distinct label values
count(count(up) by (job)) by ()
```

- **A `sum` over a label you dropped at scrape time silently double- or under-counts.** See [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#the-one-rule).
- **The rule of thumb for a metric:** `sum()` or `avg()` over all its dimensions should be meaningful. If it isn't, split the metric.

## Histograms

- **Keep `le` in the inner aggregation.** Forgetting `by (le)` is the most common bug: `histogram_quantile` returns NaN or wrong values. When comparing services, keep `le` and `service`.

```promql
# Classic histogram
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (le))

# Multi-service comparison: must include le AND service
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))

# Native histograms (Prometheus 2.40+)
histogram_quantile(0.95, sum(rate(http_request_duration_seconds[5m])))
```

- **Never average precomputed summary quantiles:**

```promql
avg(http_request_duration_seconds{quantile="0.95"}) // BAD!
histogram_quantile(0.95, sum(rate(http_request_duration_seconds[5m]))) // GOOD.
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) // GOOD.
```

The second line is native (including NHCB), the third classic. Averaging summary quantiles across instances yields statistically nonsensical values; `histogram_quantile()` aggregates correctly, and changing the percentile or window later is only a query change.

- **Averages.** Native: `histogram_sum(rate(x[5m])) / histogram_count(rate(x[5m]))` or `histogram_avg(rate(http_request_duration_seconds[5m]))`. Classic or summary: `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])`. `_count` behaves like a requests counter. Aggregate after the rate, before the division: `sum by (job) (rate(..._sum[5m])) / sum by (job) (rate(..._count[5m]))`.
- **Fraction within a range.** Native: `histogram_fraction(0, 0.3, sum by (job) (rate(http_request_duration_seconds[5m])))`. Classic: `sum by (job) (rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) / sum by (job) (rate(http_request_duration_seconds_count[5m]))`, which strictly requires a bucket at 0.3 (otherwise no result), and partial bucket presence gives an incomplete result without warning. NHCB reconciliation of different bucket layouts adds an info-level annotation.
- **Apdex:** add the fraction within the target to half the fraction between the target and the tolerated duration (usually 4x the target; here 300 ms and 1.2 s). Native histograms (including NHCB):

```promql
      histogram_fraction(0, 0.3, sum by (job) (rate(http_request_duration_seconds[5m])))
    +
      histogram_fraction(0.3, 1.2, sum by (job) (rate(http_request_duration_seconds[5m]))) / 2
```

  Pure classic needs buckets at exactly both boundaries (accurate in return), and the expression differs because classic buckets are cumulative:

```promql
        (
            sum by (job) (rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
          +
            sum by (job) (rate(http_request_duration_seconds_bucket{le="1.2"}[5m]))
        )
      /
        2
    /
      sum by (job) (rate(http_request_duration_seconds_count[5m]))
```

  Neither expression excludes failed requests from the satisfied and tolerated parts, which a strictly correct Apdex requires.
- Choosing native, classic or summary is in [PROMETHEUS.md](PROMETHEUS.md#histograms-vs-summaries).

## Ratios and error rates

```promql
# Error fraction
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Success percentage
(1 - sum(rate(http_requests_total{status_code=~"5.."}[5m]))
     / sum(rate(http_requests_total[5m]))) * 100

# Avoid divide-by-zero
sum(rate(errors_total[5m]))
  / (sum(rate(requests_total[5m])) > 0)
```

```promql
# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m])) * 100
```

Aggregate numerator and denominator separately, then divide; never average a ratio.

## Saturation and prediction

```promql
# Saturation (CPU usage %)
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes

# Predict disk full (linear extrapolation)
predict_linear(node_filesystem_free_bytes[6h], 24*3600) < 0
```

```promql
# Service availability (alert)
avg_over_time(up{job="api"}[5m]) < 0.9

# Saturation: disk full in <4h
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 4 * 3600) < 0

# Throughput spike: current rate > 3x 1h average
rate(http_requests_total[5m])
  > 3 * avg_over_time(rate(http_requests_total[5m])[1h:5m])
```

## Absence and staleness

`absent(up{job="api"})` tests missing series; `count_over_time(up{job="api"}[5m]) > 0` tests whether samples exist in the window. `changes(up{job="api"}[5m]) == 0` only says the value did not change: a healthy target can remain at 1. The retired source comment incorrectly called that a stale exporter. [existing PROMQL.md; https://prometheus.io/docs/concepts/jobs_instances/]

For "time since", export a Unix timestamp and compute `time() - my_timestamp_metric`.

## Time offsets

```promql
# Current vs 1h ago
rate(http_requests_total[5m])
  - rate(http_requests_total[5m] offset 1h)

# Day-over-day
rate(http_requests_total[5m])
  / rate(http_requests_total[5m] offset 1d)

# Predict 2h ahead from 1h trend (linear regression)
predict_linear(node_filesystem_avail_bytes[1h], 2 * 3600)
```

## SLOs and burn rate

```promql
# Availability SLO over 30 days
1 - (sum(increase(http_requests_total{status_code=~"5.."}[30d]))
     / sum(increase(http_requests_total[30d])))

# 1h burn-rate vs target (replace 0.999 with your SLO target)
( sum(rate(http_requests_total{status_code=~"5.."}[1h]))
  / sum(rate(http_requests_total[1h])) )
  / (1 - 0.999)
```

Turning these into alerts is in [ALERTING.md](ALERTING.md).

## Joins and info metrics

Put build metadata on one info metric of value 1 instead of on every metric, then join it in at query time.

```
# A single low-cardinality counter/gauge of value 1, with the metadata attached
app_build_info{app="payment-api", version="2.4.1", git_sha="a1b2c3"} 1
```

```promql
sum by (version) (
  rate(http_requests_total{app="payment-api"}[5m])
  * on (app) group_left (version) app_build_info
)
```

- **`info()` is experimental:** Prometheus 3.0+, enabled with `--enable-feature=promql-experimental-functions`. Signature `info(v, [labelselector])`. It defaults to joining against `target_info` on the identifying labels (`instance`, `job`), which suits OpenTelemetry `target_info`. For custom info metrics like `app_build_info`, the `group_left` form is more portable.

```promql
info(
  rate(http_requests_total{app="payment-api"}[5m]),
  {version=~".+"}
)
```

## Cardinality queries

```promql
# Top 10 metrics by series count
topk(10, count by (__name__)({__name__=~".+"}))

# Series count for one metric
count(http_requests_total)

# Cardinality of one label
count(count by (user_id)(http_requests_total))
```

The full cardinality triage (TSDB status endpoint, churn, recent-change diff) is in [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#troubleshooting-a-cardinality-fire).

## Validate a query

```bash
# 0. Point at your Prometheus/Mimir. For Grafana Cloud, use the metrics endpoint
#    and add basic auth (-u "<metrics_user>:<token>") to each curl below.
PROM=http://localhost:9090   # or https://prometheus-prod-XX.grafana.net/api/prom

# 1. Sketch the query: for "5xx error rate per service":
EXPR='sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)'

# 2. Validate syntax + that the metric/labels exist
curl -sG --data-urlencode "query=${EXPR}" \
  "$PROM/api/v1/query" | jq '.status, (.data.result|length)'
# Expect: "success" and result count > 0. If 0, check label spelling and scrape activity:
curl -sG --data-urlencode "match[]=http_requests_total" "$PROM/api/v1/series" | jq '.data | length'
```

Step 3: sanity-check the magnitude in Grafana Explore against a known ground truth (a k6 run, a log count).

## Common bugs

| Symptom | Cause and fix |
|---|---|
| `histogram_quantile` returns NaN | Forgot `by (le)` in the inner aggregation |
| "No data" | Check the metric exists (`/api/v1/series`) and the window is at least 4x the scrape interval |
| Wrong rate magnitude | The counter was aggregated before `rate()`; always `rate()` first |
| `rate()`/`increase()` absurdly high | A series-unique label was dropped at scrape time, merging counter resets ([CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#the-one-rule)) |
| Query timeout | Series count too high: use `topk(...)` + a recording rule + drop high-cardinality labels |

On "drop high-cardinality labels": the PromQL skill says to drop them and shows an Alloy `labeldrop` of `user_id` at scrape time; the label-strategy and cardinality skills say never `labeldrop` a label that makes a series unique (it merges counter resets and breaks `rate()`), and to fix it in code or with Adaptive Metrics instead. Confirm in the current docs; see [CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#the-one-rule).

## Metrics Drilldown

Grafana 12+ has queryless Prometheus exploration: **Explore > Metrics Drilldown**, or `<grafana-url>/a/grafana-metricsdrilldown-app`. It offers metric search with label breakdown, smart segmentation for anomaly detection, automatic visualization, and pivoting from metrics to related logs and traces. Repo: https://github.com/grafana/metrics-drilldown

## Prove it

- `/api/v1/query` returns `"success"` with a result count above 0; if 0, `/api/v1/series` for the metric returns more than 0.
- Every `rate()` window is at least 4x the scrape interval, every `rate()` runs before its `sum`, and every `histogram_quantile` over classic buckets keeps `le` in the inner `by`.
- The panel's number matches a known ground truth in Explore (a k6 run or a log count).
