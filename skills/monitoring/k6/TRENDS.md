# Historical k6 run trends

Use for comparing historical runs and separating script or version changes from performance trends. Editing and validating existing scripts stays in [MAINTENANCE.md](MAINTENANCE.md). [existing skills/monitoring/k6/MAINTENANCE-AND-TRENDS.md]

## Trend analysis

[existing MAINTENANCE-AND-TRENDS.md]

Multi-run trends for one load test. Not for deep-diving one run, editing scripts, creating them, or querying service metrics directly (hand those to backend investigation, [WEBSITE-LOAD-AND-REPORT.md](WEBSITE-LOAD-AND-REPORT.md#investigating-the-backend)).

- **Window:** the last 30 days by default; widen if there are fewer than 5 runs; ask if there are more than 200. Fewer than 3 usable runs: a trend isn't meaningful. Exclude aborted and timed-out runs by default. List tests with `gcx k6 tests list`.
- **Method per type:** trend `histogram_quantile(0.95)` (P95), `histogram_quantile(0.5)`, `histogram_avg`, and query P50, P90, P95 and P99; counter `increase`; rate `ratio`; gauge `max`.
- **Group by default:** `browser_web_vital_*` (LCP, FCP, CLS, TTFB, INP; FID only in runs before k6 v2.0.0, which removed `browser_web_vital_fid`) `by (url)`; `http_req_duration`, `http_req_failed`, `http_reqs` `by (name, status)` when requests are tagged with `name`, else `by (url, status)`; `iteration_duration` `by (scenario)`; custom trends `by (<tag>)`. Discover labels through the labels endpoints rather than assuming them from the script. Batch run IDs in groups of 50 when URLs get too long.

```bash
gcx --context <ctx> api "/api/plugins/k6-app/resources/cloud/cloud/v5/load_tests/$LT/query_aggregate_k6(query='histogram_quantile(0.95)',metric='http_req_duration',test_run_ids=[$IDS])" -o json
```

- **Metric types can collide across runs:** the latest run's type wins and aggregations using the older type's method silently break.

| Classification | Rule |
|---|---|
| Degrading | Second-half mean worse than the first half by more than 10% |
| Improving | Better by more than 10% |
| Stable | Within 10% |
| Volatile | Standard deviation above 25% of the mean |
| Anomaly | A run more than 2 standard deviations from the mean |

- **Formulas:** baseline is the oldest run or the mean of the first 3 runs. Rate of change `((recent_mean - baseline_mean) / baseline_mean) * 100 / weeks_in_window`. Headroom `((threshold_value - current_value) / threshold_value) * 100`: Comfortable above 50%, Adequate 20 to 50%, Thin under 20%, Breached under 0%. `weeks_until_breach = headroom_absolute / rate_of_change_per_week` is a rough projection. Metric meaning decides the adverse direction: falling successful-check rate and rising failed-request rate are both degradation. Rate storage type alone does not decide the direction. The source incorrectly treated every decreasing Rate as degradation. These headroom bands describe upper-bound goals; do not reuse their sign unchanged for a lower-bound success target. [https://grafana.com/docs/k6/latest/using-k6/thresholds/]
- **Overall health** is Healthy, Watch, Degrading or Critical, taken from the worst-case metric.
- **Inflection points:** sha256-diff the run-bundled scripts (`/cloud/v6/test_runs/{id}/script`) on either side of the change. Different scripts: split the history into eras. Same script: the regression is external, unless the k6 version changed across a boundary that shifts the numbers ([VERSIONS.md](VERSIONS.md#version-boundaries-in-trend-data)); split there too.
- **Load generator resources trending up** (`load_generator_cpu_percent`, `load_generator_file_handles`) can mean the test is outgrowing its load generator, not that the service is degrading.
- **When the service has no observability,** correlate client-side: Tempo traces for browser tests; for protocol tests compare `http_req_duration by (name, status)` and `http_req_failed by (name, status)`, and split `http_req_waiting` (server time) from `http_req_receiving` (transfer). Latency up with payload up suggests a content change; latency up with payload stable, a processing change; an intermittent payload, a flaky cache or an A/B test.

## Prove it

- A trend verdict states the window, the number of usable runs (at least 3), the exclusions, and the script-hash comparison at any inflection point. [existing MAINTENANCE-AND-TRENDS.md]
