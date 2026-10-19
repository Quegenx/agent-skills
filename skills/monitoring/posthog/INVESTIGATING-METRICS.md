# Investigating metrics

This is for "why did X change?" on a saved insight, a dashboard tile or a pasted query, and for anomalies in server metrics in PostHog Metrics. It is not for a plain "what is X?". The order of work: first prove the movement is outside normal variance, then find the segment that carries most of the absolute delta, then corroborate it with an independent signal (a flag or release, an error, an annotation) and a segment the cause should not have touched. Building the insights themselves is [INSIGHTS-AND-DASHBOARDS.md](INSIGHTS-AND-DASHBOARDS.md); HogQL syntax is [HOGQL.md](HOGQL.md); vendor-neutral OpenTelemetry instrumentation is the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill.

**Contents:** [Classify the metric](#classify-the-metric) · [Opening moves](#opening-moves) · [Variance and attribution rules](#variance-and-attribution-rules) · [Shared techniques](#shared-techniques) · [Playbooks by insight kind](#playbooks-by-insight-kind) · [Cause taxonomy](#cause-taxonomy) · [Report the findings](#report-the-findings) · [Server and infra metric anomalies](#server-and-infra-metric-anomalies) · [Prove it](#prove-it)

## Classify the metric

- **Read the insight, don't guess it.** For a saved insight, `posthog:insight-get` gives `query.kind` (`posthog:insight-query` for the numbers). For a query you already ran or the user pasted, read `kind` directly. If nothing is pointed at, ask for the URL or short_id. Don't guess.
- **Route by `query.kind`:**

| `query.kind` | Playbook |
| --- | --- |
| `TrendsQuery` | trend |
| `TrendsQuery` with `trendsFilter.display === "BoxPlot"` | box plot (a distribution metric, no breakdowns) |
| `FunnelsQuery` | funnel |
| `RetentionQuery` | retention |
| `StickinessQuery` | stickiness |
| `LifecycleQuery` | lifecycle |
| `PathsQuery` | paths |
| `HogQLQuery` | by SQL shape: `count(...) GROUP BY toStartOfDay(...)` is a trend; multi-step `windowFunnel` or sequential filtering is a funnel; cohort-keyed return aggregates are retention |

- **`HogQLQuery`:** run the insight's SQL through `posthog:execute-sql` to get the data, then follow the closest playbook's steps using the typed tools where they fit. Drop back to `execute-sql` for the breakdown and drilldown variants when the original SQL has a shape the typed schema can't express.
- **Several kinds:** run the playbooks in sequence.
- **Typed query tools by default.** Use `posthog:execute-sql` only for ratios across different events, joins with data-warehouse tables, and custom aggregations like `quantile`, `arrayJoin` or regex extraction.

## Opening moves

1. **Confirm:** run the primary tool and record the baseline, the current value, the delta (absolute and %) and the start of the anomaly window.
2. **Variance check:** widen to 3 to 4 times the user's interval (or `compareFilter: {"compare": true}` on `TrendsQuery` and `StickinessQuery`; other kinds run two date ranges) and compare the recent buckets to prior periods (rules below). If the movement is normal variance, report that and stop.
3. **Known changes, in rough order of signal:** `posthog:feature-flag-get-all` (`updated_at` near the start), `posthog:experiment-list` (`start_date` / `end_date`), `posthog:annotations-list` (`date_marker`), and `git log` (highest signal when available). Confirm a candidate with a breakdown on `$feature/<flag_key>`, `app_version` or `utm_source`.
4. **Run the playbook** for the insight kind, carrying the record from step 1 and any candidates from step 3 into it.
5. **Cross-check:** rerun on a segment the cause should not have affected. Stable means a strong hypothesis; if it moved too, expand the search. Skip this if step 2 explained it.
6. **Report** with the template below.

## Variance and attribution rules

### Compare to prior periods

| Interval | Cycle compared |
| --- | --- |
| minute | no cycle, rolling |
| hour | weekly cycle (168 buckets, weekday by hour of day) |
| day | weekly cycle (7 buckets, weekday) |
| week, month | sequential |

- **Tolerance 10%** on each side of the prior min and max. The recent window defaults to one cycle (sequential: 60 points for minute or second, 4 for week, 3 for month, 7 when unknown).
- **Enough history:** day and hour cycles need at least 2 full weeks; sequential needs the recent count plus 3 points.
- **A partial last bucket** (day and hour cycles) more than 50% below the prior minimum is labelled `PARTIAL?` and excluded.
- **Hourly:** more than 50% of hours out of range is likely a sustained shift, not a localized incident.
- **Interval inferred from the gap** when missing: under 120 s minute, under 7200 s hour, under about 30 h day, under 10 days week, else month.

### Attribute the delta to segments

- **Compare the last 7 intervals to the preceding 7** (the window is configurable), skipping series with fewer than 2 windows of points, and rank segments by absolute delta with their share of the total delta.
- **Read the shares:**
  - The aggregate moved under 5% and the largest segment move is over 2 times the absolute total delta: segments are offsetting.
  - The top segment carries at least 50% of the delta: a strong segment signal.
  - The top 3 carry at least 70%: investigate what they share.
  - Otherwise the cause is likely system-wide (deploy, tracking, infra).
- **Why absolute, not percent:** a 50% swing on a series that's 1% of volume only explains 0.5% of the aggregate delta.

### Compute, don't eyeball

Use the canonical [analytics computation and reconciliation rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/TRACKING-PLAN.md#reading-the-numbers) before reporting totals, rates, windows or segment deltas. The recurring [analytics-anomaly and tracking-QA loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/OPS-LOOPS.md) apply those rules. [coreyhaines31/marketingskills, analytics]

## Shared techniques

- **Discover the schema** with `posthog:read-data-schema`, `query.kind`: `events`; `event_properties` with `event_name`; `entity_properties` with `entity: "person"`; `event_property_values` with `event_name` and `property_name`.
- **Sweep related metrics** before going deep on one, when it sits inside a larger pipeline (a funnel step, a retention activity event, a derived rate): run the anomaly-window query on 2 to 3 adjacent metrics (upstream funnel steps, sibling events, total event volume, parent-event counts) in one multi-series `TrendsQuery`, which is cheaper than three breakdowns (for example `$pageview`, `user signed up`, `first team event ingested` with `math: "total"`, `date_from: "-30d"`, `interval: "day"`). If all moved together, the cause is broader (ingestion gap, cohort shift, tracking regression); if only the target moved, the investigation is correctly scoped.
- **Breakdown dimensions, rough signal order:** `$feature/<flag_key>` (highest after a release); `$browser`, `$os`, `$device_type`, `$geoip_country_code`; `app_version`, `$lib_version`; `is_identified`, `$is_first_session`, plan or tier; custom event properties (usually the most diagnostic).
- **Interpret breakdowns:** rank by absolute delta, not %. If no breakdown isolates it, it's system-wide. Use a compound breakdown of up to 3 properties for interaction effects (for example one browser by one country). If event volume per interval is under about 100, percentages are unreliable: report absolutes too. Check the guilty segment's pre-anomaly baseline: it may have always behaved that way, with its share of volume just growing at the anomaly start (a cohort composition change, not a real regression).
- **Zoom the interval:** when a daily point looks anomalous, rerun at `interval: "hour"` scoped to that day; a one-hour cliff is an incident, a sustained shift is something broader. Use `interval: "minute"` for tight incident windows.
- **Quantiles in HogQL,** for per-bucket distribution stats with a segment dimension (box plots can't take `breakdownFilter`). Cast `toFloat(properties.X)`: properties are loose-typed. Report `n` alongside quantiles; a p75 swing on small cells is usually noise.

```sql
SELECT
    toStartOfDay(timestamp) AS day,
    properties.plan         AS segment,
    quantiles(0.25, 0.5, 0.75, 0.9)(toFloat(properties.order_value)) AS q,
    count()                 AS n
FROM events
WHERE event = 'checkout_completed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY day, segment
```

- **Drill to the actors** behind a trend bucket with `InsightActorsQuery` (trends source only). Selector fields are `day`, `series` and, with a breakdown, `breakdown`.

```json
{
  "kind": "InsightActorsQuery",
  "source": {
    "kind": "TrendsQuery",
    "dateRange": { "date_from": "2026-03-10", "date_to": "2026-03-10" },
    "series": [{ "kind": "EventsNode", "event": "$pageview", "math": "dau" }],
    "breakdownFilter": { "breakdowns": [{ "property": "plan", "type": "event" }] }
  },
  "day": "2026-03-10",
  "breakdown": "free"
}
```

- **Watch session recordings** for UI-shaped drops: pull recordings matching the affected segment with `posthog:query-session-recordings-list` and fetch one with `posthog:session-recording-get`. Watching three or four is often faster than running more queries.
- **Errors and logs** (`query-error-tracking-issues-list`, `query-logs` for the anomaly window): a correlated error is only a candidate. Confirm timing (error volume aligns with the metric movement), a plausible mechanism (the error affects the metric's surface: a 500 on the submit endpoint can; a console warning usually can't) and user overlap (affected users overlap with users hitting the error). If any fails, note it as coincidental and move on.

## Playbooks by insight kind

### Trend

- **Zoom** to `interval: "hour"` on the suspicious days: a one-hour cliff is an incident or deploy; a full-day shift is a broader cause (campaign, cohort change, tracking regression).
- **Break down** with several properties (find candidates with `read-data-schema`), for example `breakdownFilter: {"breakdowns": [{"property": "plan", "type": "event"}], "breakdown_limit": 10}` with `math: "dau"`, and rank by absolute delta. If no segment isolates the delta, the cause is system-wide.
- **Affected users:** `posthog:query-trends-actors` on the anomalous bucket or breakdown value; for UI-shaped drops, pull recordings for the same segment. Then check errors and logs.
- **Cohort composition:** `posthog:query-lifecycle` on the same event. A drop concentrated in one status (new users didn't arrive, dormant users didn't resurrect) means the user mix changed rather than per-user behavior.

### Funnel

- **First rule out an incomplete latest bucket.** If `(now − latest_bucket_start) < funnel_window`, users in the bucket haven't had time to convert. Tells: the drop is uniform across breakdowns (real regressions usually aren't), first-step volume is stable or growing, and the prior bucket sits on the historical baseline. If incomplete, report it as the cause, suggest setting `dateRange.date_to` one funnel window in the past, and offer to annotate.
- **`FunnelsQuery` doesn't support `compareFilter`:** run it twice with date ranges of equal length (`date_from: "-7d"`, then `date_from: "-14d", date_to: "-7d"`). Window example: `funnelsFilter: { "funnelWindowInterval": 7, "funnelWindowIntervalUnit": "day" }`.
- **Entries or completions:** `posthog:query-trends` on the events at step N-1 and step N. Steady entries with falling completions is a problem at that step; falling entries is upstream.
- **Who dropped off:** `posthog:query-trends-actors` only accepts a trends source, so run trends on step N-1 and step N completions for the same window, drill into the actors of each and diff: users in the first but not the second are the drop-offs.
- **Errors:** filter error tracking and logs to the surface where step N lives.
- **What they do instead:** `posthog:query-paths` with `endPoint` set to the failing step; paths that don't reach it show where users bail.

### Retention

- **If `totalIntervals` exceeds the date range, the tail cells are always zero** and look like a drop: match `totalIntervals` to the range. The most recent cohort hasn't had its full retention window yet; note it as partial rather than a regression.
- `targetEntity` / `returningEntity` take `{type: "events", name: "<event>"}` nested in `retentionFilter`; example `"totalIntervals": 8, "period": "Week", "retentionType": "retention_first_time"` with `date_from: "-90d"`. Compare the affected cohorts to prior baselines side by side.
- **Event or users:** is the drop in the activity event itself or in the cohort doing it? Create or reuse a cohort for the affected period (`posthog:cohorts-create` / `-list`), then run `posthog:query-trends` on the activity event filtered to it.
- **Split the dropout:** `posthog:query-lifecycle` scoped to the affected cohort separates "never retained" (new users who didn't return) from "lost later" (returning users who churned).

### Stickiness

- **`AssistantStickinessQuery` doesn't support `breakdownFilter`:** run one query per segment with property filters (for example `{"type": "person", "key": "plan", "value": "pro", "operator": "exact"}`).
- **Drill into the low-stickiness segment:** `posthog:query-trends` on a key engagement event filtered to it, then `posthog:query-trends-actors` on the trend; pull recordings for a handful.
- **What sticky users do that others don't:** with a sticky and a non-sticky cohort, run `posthog:query-trends` on candidate core events scoped to each (a `properties` cohort filter). Events where the two diverge drive stickiness.

### Lifecycle

- **`AssistantLifecycleQuery` doesn't support `breakdownFilter`:** use per-segment `properties` filters or `lifecycleFilter.toggledLifecycles: ["new"]` / `["returning"]`.
- **First read which status moved** with `posthog:query-lifecycle`.
- A drop in new users: find the first-session event with `read-data-schema` (`$session_start`, `$pageview` or a signup event), then `posthog:query-paths` from there to see where onboarding loses people. A drop in returning: `posthog:query-trends` on the cohort's key engagement events, with interval zoom and actor drilldown if a day stands out. A drop in resurrecting is usually external: re-check annotations and re-engagement campaign or email events.

### Paths

- **Paths are shape metrics:** the change is usually a shift in navigation between events, not one scalar moving.
- **`PathsQuery` doesn't support `compareFilter`:** run `posthog:query-paths` twice with date ranges of equal length and compare which edges gained or lost volume. Example: `pathsFilter: {"includeEventTypes": ["$pageview"], "startPoint": "/home", "endPoint": "/checkout", "edgeLimit": 50}`.
- **Check endpoint volume first:** a drop in paths A to B is often a drop in A or B alone. Run `posthog:query-trends` on each endpoint event; if either moved, use the trend playbook on that event.
- **`AssistantPathsQuery` doesn't support `breakdownFilter`:** filter with top-level `properties` and rerun per segment. A path shape that differs sharply across browsers, countries or plans means the change is segment-specific.
- **Recordings and errors:** pull recordings for users on the new dominant edge (usually faster than more queries) and check error tracking on the page where users diverge.
- **Paths is for shape, not conversion:** use a funnel for conversion questions.

### Box plot

- **Box plots silently drop `breakdownFilter`** (the display is in `NON_BREAKDOWN_DISPLAY_TYPES`). Segment with parallel series (one `EventsNode` per value with a `properties` filter) or the HogQL quantile template, which is better when the segment has many values (watch for noisy quartiles on small `n`).
- **Read `boxplot_data` per bucket:** median moved is a behavioral change; IQR widened is a new slow or fast segment; IQR narrowed is a removed tail; outliers changed means toggling `trendsFilter.excludeBoxPlotOutliers` (if the shift disappears it's outlier-driven; if it persists, the bulk moved); mean and median diverging means the skew changed. Tail-driven and bulk shifts have different next steps.
- **Zoom** to `interval: "hour"` on the anomaly window: a one-hour IQR compression usually points to a deploy or incident; a sustained shift suggests a broader population or tracking change.
- **Don't conclude on an elevated segment yet.** Its measurement may have changed at the anomaly start (the real cause), or it was always elevated and its share of volume grew (a composition change: same numbers, different fix). Check the pre-anomaly baseline (same per-segment quantiles on a window before the anomaly) and cross-tab (if two dimensions both look elevated, for example host and lib_version, `GROUP BY` both in HogQL to see whether one is causal).
- **`posthog:query-trends-actors` can't select by percentile,** so drill into the tail with HogQL (mirror with `< quantile(0.1)(...)` for the lower tail):

```sql
SELECT distinct_id, max(toFloat(properties.order_value)) AS max_value
FROM events
WHERE event = 'checkout_completed'
  AND timestamp >= '2026-04-15 00:00:00'
  AND timestamp <  '2026-04-16 00:00:00'
  AND toFloat(properties.order_value) > (
    SELECT quantile(0.9)(toFloat(properties.order_value))
    FROM events
    WHERE event = 'checkout_completed'
      AND timestamp >= '2026-04-15 00:00:00'
      AND timestamp <  '2026-04-16 00:00:00'
  )
GROUP BY distinct_id
ORDER BY max_value DESC
LIMIT 50
```

- Feed the IDs into `posthog:query-session-recordings-list` for UI-shaped shifts.
- **Errors and logs:** did a failure mode truncate the distribution (timeouts killing the slow tail, a validation error blocking expensive orders)?
- **Cohort composition:** `posthog:query-lifecycle` on the same event. An influx of new free-tier users can pull p75 order value down while no existing user changed behavior.

## Cause taxonomy

Rank hypotheses by evidence count when writing findings.

| Cause | How to check |
| --- | --- |
| Release, deploy or flag | Break down by `app_version` / `$lib_version` (a shift concentrated in one version is strong evidence) and `$feature/<flag_key>` (separates exposed from control); suggest pausing or reverting, and offer `posthog:annotation-create` if no annotation exists |
| Marketing or traffic source | `utm_source`, `utm_medium`, `utm_campaign`, `$referring_domain`; a composition change can leave the overall count stable while conversion moves, so break the conversion metric down by source |
| Tracking regression | Stable users with falling events means the fire condition changed; an adjacent stable event while the target fell means the target's tracking changed; a drop concentrated in one `$lib_version` is an SDK regression; `read-data-schema` (`kind: "events"`) for renamed or deprecated events |
| Cohort or lifecycle shift | `posthog:query-lifecycle` for a change in the new / returning / resurrecting / dormant mix; `posthog:query-retention` comparing affected-period cohorts to prior ones; split the metric per lifecycle status in the findings |
| Seasonality, day of week | The prior-period comparison catches it |
| Platform, device, browser | `$browser`, `$browser_version`, `$os`, `$device_type`, `$geoip_country_code`, plus error tracking |
| Rate limit or upstream outage | `posthog:query-trends` on API error events; `posthog:query-logs` for an error surge |
| Upstream data integration | Check the existing [source/schema health](DATA-WAREHOUSE.md#source-health-audit) and [materialized-view health](WAREHOUSE-MODELING.md#view-health-audit) workflows. The old investigation source said tools could not confirm these changes; the warehouse sources expose scoped status and run evidence. A green status alone does not prove freshness or causality. [existing DATA-WAREHOUSE.md; WAREHOUSE-MODELING.md] |

## Report the findings

```markdown
# Investigation: <metric>

**Anomaly**: <baseline> → <current> (<delta>) starting <date>

## Likely cause

<one sentence>

**Confidence**: low | medium | high - <one-line reason>

**Evidence**

- <query result>
- <flag / experiment / annotation / commit if applicable>

## Possible causes (ruled out)

- <hypothesis>: <why>

## Affected segment

- <shared properties of affected users/events>

## Data gaps

- <checks skipped and why>

## Suggested follow-ups

- <concrete next action>
- <offer to save chart / create annotation>
```

- **Confidence:** high when multiple independent signals corroborate (the segment isolates the delta and a flag or version aligns and an error or annotation matches); medium with one corroborating signal, or a strong pattern match without a cross-check; low when the pattern matches a known cause with no corroboration, or the data only rules things out.
- **Follow-ups:** offer `posthog:insight-create` for the key charts and `posthog:annotation-create` if a cause you found has no annotation. Link insights and dashboards inline as `[Name](/insights/short_id)`.

## Server and infra metric anomalies

For OTel and Prometheus metrics in PostHog Metrics, fired alerts and incident triage. The metric tells you what and when; logs and traces tell you why.

1. **Find the metric:** `metric-names-list` with `value`, a substring like `lag`, `error`, `latency` or `queue`; it returns `metric_type`. Counters (`sum`) are only meaningful as `rate` / `increase`, gauges as `avg`, histograms as `histogram_quantile`.
2. **Characterize it:** `characterize-metric-anomaly` with the metric name and `anomalyFrom` (the alert fire time, or when the user says it started looking wrong; subtract some margin if unsure). It compares to the preceding window by default; optional `baselineFrom` / `baselineTo`). It returns `direction`, `change_ratio`, `anomaly_peak`, `baseline_mean`, `onset_time`, `top_movers` and `series`. `direction` `flat` means the window or the metric is wrong: widen it or compare to the same window yesterday via `baselineFrom` / `baselineTo` (daily-pattern metrics often look anomalous against the immediately preceding hours). `onset_time` is the pivot. One mover in `top_movers` (a single pod, shard or endpoint) is a localized culprit; everything moving together is a shared cause (an upstream dependency, a deploy, infra).
3. **Drill in:** `query-metrics` with `filters` plus a second group key (pod to container, endpoint to status code); normalize with `clauses` plus `formula` (`errors / requests`), since a rising error count means nothing if traffic doubled; check the companion metrics over the same window (for lag: throughput and error counters of the same service; for latency: request rate and saturation gauges) with the same `interval` so the grids align.
4. **Correlate:** logs (`query-logs`, following its own discover-first workflow; `service.name`, severity `error` then `warn`) and traces (`query-apm-spans`) for the same service in a window bracketing `onset_time` (a few buckets before, through the peak). Restarts, crash loops, connection errors and deploy markers right before onset are the classic causes in logs; widen to other services in the request path if the service's own logs are clean. Slow or erroring spans show which dependency degraded, and a `trace_id` from an exemplar or log line links a concrete request across all three signals.
5. **Conclude:** symptom, probable cause with timing, blast radius and confidence; if it's ambiguous, say which hypothesis the evidence favors and what would disambiguate (for example "the lag began draining at 20:12, consistent with a consumer restart; check who restarted it").

- **Worked example:** `logs_rate_limiter_message_lag_seconds` (a histogram), change ratio 40x, onset 20:10, mover `service_name = logs-ingestion`; the other services' lag stayed flat; the `rate` of the consumer's throughput counter was zero during the gap and spiked after onset, so the consumer was down, not slow, and the rising lag was the backlog draining; `query-logs` for `service.name = logs-ingestion` around 20:00 to 20:15 showed process exit and restart lines at the gap boundaries. Conclusion: consumer outage 20:01 to 20:10, lag spike is backlog drain and self-recovering, logs freshness only, no data loss (the topic retained messages).
- **Counters reset on restart:** `rate` / `increase` handle it; never eyeball raw cumulative values.
- **A metric that stops reporting is not zero:** a gap plus a vanished label in `top_movers` means the emitter died; go to the logs.
- **Don't trust a single aggregation:** a flat `avg` can hide a screaming `p95`. For latency-like gauges and histograms, characterize the tail too.
- **Scraped Prometheus metrics arrive about 15 to 60 s behind real time:** don't read the last bucket of a series as current.

## Prove it

- **Variance ruled out first:** the report shows the prior-period comparison and the recent buckets fall outside the prior range plus the 10% tolerance, with any `PARTIAL?` last bucket excluded.
- **Attribution by absolute delta:** the named segment's share of the total delta is stated, and its pre-anomaly baseline was checked.
- **Cross-check ran:** a segment the cause should not affect stayed stable, or the report says it moved and why the search widened.
- **Funnel and retention artifacts excluded:** `dateRange.date_to` sits one funnel window in the past, and `totalIntervals` fits inside the date range.
- **Confidence matches evidence:** "high" is claimed only with multiple independent signals named under Evidence.
- **Infra:** counters were read as `rate` / `increase`, the last bucket of a scraped series was not treated as current, and logs or traces bracketing `onset_time` back the stated cause.
