# Experiment numbers vs SQL

Group D of the experiment health check: the experiment's numbers disagree with the user's SQL, an insight, a dashboard, another analytics tool or an AI assistant. Most of the time the experiment numbers are correct and the other count lacks the experiment's scope: only events after each person's first exposure, multi-variant people excluded, test accounts filtered, per-user aggregation, conversion windows and outlier handling. Check the number's age (`query_to`, D8) before its scope. A metric one or two orders of magnitude below exposures is bucketing or identity first ([EXPERIMENT-BIAS.md](EXPERIMENT-BIAS.md), A3 and A4). The workflow is [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md); metric definitions are [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md); SQL is [HOGQL.md](HOGQL.md).

**Contents:** [D1 The eleven scope sources](#d1-the-eleven-scope-sources-high) · [Reproducing the experiment in HogQL](#reproducing-the-experiment-in-hogql) · [D2 Funnels](#d2-funnels-high) · [D3 Breakdowns read the exposure event](#d3-breakdowns-read-the-exposure-event-high) · [D4 "Sum of revenue"](#d4-sum-of-revenue-high) · [D5 Breakdown "none"](#d5-breakdown-none-medium) · [D6 Recordings vs stats](#d6-recordings-vs-stats-medium) · [D7 Conversion-window anchoring](#d7-conversion-window-anchoring-high) · [D8 Old or cached results](#d8-old-or-cached-results-high) · [D9 A metric filter doesn't change the user count](#d9-a-metric-filter-doesnt-change-the-user-count-medium) · [D10 Current person properties](#d10-current-person-properties-medium) · [D11 Metric definition traps](#d11-metric-definition-traps-high) · [D12 A wider population than the insight](#d12-a-wider-population-than-the-insight-medium) · [D13 The metric name is free text](#d13-the-metric-name-is-free-text-medium) · [Prove it](#prove-it)

## D1 The eleven scope sources [HIGH]

All readable from `experiment-get`, except the test-account rows (in `project-get`) and the CUPED project default.

| # | Source | Rule |
|---|---|---|
| 1 | Exposure scope | Only events at or after the person's first exposure |
| 2 | `$multiple` exclusion | Computed per person |
| 3 | Test-account filter | Default `true` |
| 4 | Date range | `start_date` / `end_date`; metric events of an exposed person count past `end_date` while their window is open |
| 5 | Variant attribution | From the exposure event; only current keys not in `excluded_variants` |
| 6 | Conversion window | Every metric type |
| 7 | Per-user aggregation | Mean metrics per user, then averaged; ratio = sum of per-person numerators / sum of per-person denominators |
| 8 | Outlier handling (winsorization) | Mean clamps per-user values at the lower/upper percentile; ratio clamps numerator and denominator separately; thresholds per breakdown group; no raw `AVG`/`SUM` reconciles |
| 9 | CUPED | Adjusts values with pre-exposure behavior |
| 10 | Completed windows only | `only_count_matured_users` ("Require completed conversion or retention window") leaves out people whose window hasn't elapsed by calculation time; a metric without a window leaves no one out; retention uses the end of the retention window from its start event (E11) |
| 11 | The unit | Group-aggregated counts groups and drops events with no group key or a key in another spelling or case |

- **Recommend:** reproduce the scope exactly (from `exposure_criteria`, `metrics`, `stats_config`), or accept that the numbers don't match by design.
- Code: `ExposureQueryBuilder` in experiment_exposure_query_builder.py; `build_metric_predicate`, `build_conversion_window_predicate_for_events` in experiment_metric_values.py; `build_mean_query_with_winsorization` in experiment_mean_query_builder.py; `build_ratio_query_with_winsorization` in experiment_ratio_query_builder.py.

## Reproducing the experiment in HogQL

The skeleton reproduces sources 1, 2 and 7 directly, 6 through the inline comment, and 4 and 5 with the notes below. It does NOT reproduce 3, 8, 9, 10 or 11, nor exposure or metric property filters: say which of those the experiment uses.

- **Reconcile the first week first.** `<window_start>` = `start_date`; compare with the last day of that window in the metric's daily series (`experiment-timeseries-results` with the metric's `uuid` and `fingerprint`). The series is cumulative from the start date; `<window_end>` = the end of that day in the project time zone, written in UTC; a point can end earlier that day (when it was computed). Widen only once the first week matches.

```sql
SELECT
    variant,
    count() AS exposed_persons,
    countIf(metric_events_counted > 0) AS persons_with_metric,
    sum(metric_events_counted) AS metric_events,
    avg(metric_value) AS mean_value_per_person
FROM (
    SELECT
        person_id,
        -- source 2, exclude handling: a person with more than one variant key becomes $multiple
        if(
            uniqIf(properties.$feature_flag_response, event = '<resolved_exposure_event>') > 1,
            '$multiple',
            anyIf(properties.$feature_flag_response, event = '<resolved_exposure_event>')
        ) AS variant,
        minIf(timestamp, event = '<resolved_exposure_event>') AS first_exposure,
        -- source 1: only metric events at or after the first exposure
        -- source 6: with a conversion window, also x.1 < first_exposure + toIntervalSecond(<window_seconds>)
        arrayFilter(
            x -> x.1 >= first_exposure,
            groupArrayIf(
                (timestamp, coalesce(toFloat(properties.`<value-property>`), 0)),
                event = '<metric-event>'
            )
        ) AS counted,
        length(counted) AS metric_events_counted,
        -- source 7: one value per person first, then the mean across people
        arraySum(arrayMap(x -> x.2, counted)) AS metric_value
    FROM events
    WHERE timestamp >= toDateTime('<window_start>', 'UTC')   -- source 4
      AND timestamp < toDateTime('<window_end>', 'UTC')      -- source 4
      AND (
          event = '<metric-event>'
          OR (
              event = '<resolved_exposure_event>'
              AND properties.$feature_flag = '<flag-key>'
              -- source 5: only the flag's variant keys are exposures
              AND properties.$feature_flag_response IN ('<variant-key-1>', '<variant-key-2>')
          )
      )
    GROUP BY person_id
    HAVING countIf(event = '<resolved_exposure_event>') > 0
)
GROUP BY variant
ORDER BY variant
```

Adapting it:

- **Leave the `$multiple` row out** of the comparison.
- **`first_seen` handling:** variant = `argMinIf(properties.$feature_flag_response, timestamp, event = '<resolved_exposure_event>')`.
- **Custom exposure event:** filter by event name only and read the variant from `` properties.`$feature/<flag-key>` ``. An activation event is not reproduced.
- **Excluded variants:** list only the non-excluded keys in `IN`.
- **Exposure-criteria property conditions:** add them to the exposure branch.
- **Metric events after `<window_end>`:** replace the second bound with `timestamp < toDateTime('<window_end>', 'UTC') + toIntervalSecond(<window_seconds>)` and add `AND timestamp <= toDateTime('<window_end>', 'UTC')` to the exposure branch (no window: 0).
- **Group-aggregated:** replace `person_id` with `` `$group_<index>` `` and add ``AND `$group_<index>` != ''``.
- **Metric property filters:** add them to both `<metric-event>` conditions; action metrics use the action's conditions.
- **Other math needs its own per-person aggregate.** The skeleton doesn't cover retention.
- **Funnel:** the last step as `<metric-event>`, read `persons_with_metric / exposed_persons`. It matches a one-step funnel without a window; with more steps it over-counts (no order or presence check); with a window the experiment starts a new attempt at each exposure.
- **"Sum of revenue":** `mean_value_per_person`. **Count metric:** `sum(metric_events) / exposed_persons`.
- **Breakdowns:** the value is on the first exposure event.
- **The test-account filter:** the experiment's count per variant is `number_of_samples` (stored results up to `query_to`, or a daily series point). For retention with its own start event, read `number_of_samples` from a mean, ratio or funnel metric of the same experiment.

## D2 Funnels [HIGH]

- **Significance always runs from the first step (exposure) to the final step;** intermediate steps don't affect significance or win probability.
- **A per-step rate after the split isn't a result:** the groups are no longer comparable ([EXPERIMENT-DEBUGGING.md](EXPERIMENT-DEBUGGING.md#real-or-noise)).
- **The exposure is prepended as `step_0`:** a 1-step funnel is exposure to action.

## D3 Breakdowns read the exposure event [HIGH]

- **Breakdowns read each person's first exposure event.** A property only on the conversion event (e.g. checkout `payment_method`) puts every user under "none".
- **[MEDIUM] A property the treatment can change biases the per-slice comparison.** Use a metric filtered to the slice (numerator filtered, denominator all exposed; D9). Retention with its own start event is the exception.
- **Recommend:** set the property earlier so it is on the exposure event (preferred), or break down in product analytics with a variant filter.

## D4 "Sum of revenue" [HIGH]

- **"Sum of revenue" is the mean of per-user totals:** A spends $50, B spends $10, the metric reads `($50 + $10) / 2 = $30`, not `$60`.
- **A ratio is the sum of one per-person value over the sum of another; a one-step funnel counts people.** The same event under two metric types gives two right numbers.
- **For a total:** mean × user count, or product analytics; that product is the total inside the experiment's scope.

## D5 Breakdown "none" [MEDIUM]

A breakdown on a property absent from the event shows "none" silently. Verify capture; if the exposure event lacks it, see D3.

## D6 Recordings vs stats [MEDIUM]

- **The Recordings tab and the "View recordings" button list sessions of people counted as exposed.** Filters "Fired all", "Fired any", "Fired none", "Finished funnel", "Didn't finish funnel", "Fired <event>" / "Didn't fire <event>" select per session; "Fired all" with several metrics uses each metric's first event; funnel filters read only the last step; there is no conversion window and no aggregation.
- **Don't debug stats through the Recordings tab.** Use recordings qualitatively, not to audit ([EXPERIMENT-REPLAYS.md](EXPERIMENT-REPLAYS.md)).
- **[MEDIUM] No recordings for an exposed person:** a server-sent exposure carries no session id (or one matching no recording). Other sessions may have recordings if replay is on and sampled: find them by person, or by the flag's value on session events.

## D7 Conversion-window anchoring [HIGH]

- **Mean and ratio:** events count when `timestamp >= first_exposure AND timestamp < first_exposure + conversion_window`; a later exposure extends nothing. No window means no upper bound except the experiment's end (45 days later counts like 5 minutes, and early-exposed people have more time).
- **Funnel:** each step must fall within the window measured from the exposure step; a later exposure starts a new attempt; the furthest step ever reached counts. An unordered funnel needs all steps, exposure included, within one window in any order.
- **Retention:** a custom start event must fall within the conversion window after first exposure when one is set (E10). Windows in days or hours compare calendar days or hours in the project time zone; weeks, months, minutes and seconds compare exact timestamps.
- **The window runs past the end date** (a 7-day window, exposed on the last day: 7 more days). Stored results of an ended experiment can lack them.
- **To reconcile:** mean and ratio with one window from first exposure (from the last exposure over-counts); funnels allow a re-exposure a fresh chance.
- **Part of the public docs still describes mean windows as extended by a later exposure;** the rule above is what results use.
- Code: experiment_metric_values.py; funnel-udf/src/steps.rs; `build_start_after_exposure_predicate` in experiment_retention_query_builder.py.

## D8 Old or cached results [HIGH]

- **Page numbers are the stored calculation.** Exception: projects without the stored-calculation rollout, where the page runs one query per metric and caches up to 24 h, and `query_to` says nothing. No tool says which a project has.
- **Schedule:** the scheduled calculation runs once a day by default, for running experiments with the flag on, started between 12 hours and about two months ago, with at least 50 total exposures. Paused, small or older than about 2 months: none. The schedule is a rollout; where it is off, stored results change only on a page refresh, a page edit, or a started calculation. Read `query_to`; don't assume daily.
- **Cache:** an on-demand result is kept up to 24 h; `refresh: true` doesn't force recomputation (the support reference disagrees: [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md#exposure-data)).
- **Stopped experiments:** a calculation after the stop ends at the end date; later ones reuse it (same "last refreshed", same numbers). Only a change of metric, exposure criteria, method, start date, excluded variants or the completed-window setting recomputes; confidence level, CUPED, sequential testing and baseline changes do NOT. No calculation after the stop: `query_to` < `end_date`.
- **Late or backfilled events:** precomputed projects keep each day's exposures and metric events once a few days old; events arriving later for that day stay out for about two months. A metric's stored result shows `is_precomputed: true`.
- **A removed variant** is kept until the next calculation (up to 24 h cached).
- **A changed setting:** a page edit of a metric, exposure criteria or a statistics setting recalculates the whole run; numbers moved without new data means read `experiment-activity`. An edit through the API or a tool starts NO calculation, and changed metrics' stored results come back empty until the page is opened or a calculation runs.
- **Recommend:** state `query_to` with every stored number; use the page refresh control, or `experiment-metrics-recalculation-create` (ask first: it computes every metric). An ended experiment has no page refresh control: use the tool to compute up to the end date. A stopped experiment with a post-stop calculation gets no new data either way. A failed calculation is not zero.

## D9 A metric filter doesn't change the user count [MEDIUM]

- **The denominator is the exposed set, fixed at exposure.** A metric-event filter gates conversion only; retention with its own start event is the exception.
- **To shrink the denominator,** encode eligibility upstream: release conditions, an exposure-criteria property filter, or a custom exposure event.
- **If the mental model comes from another A/B tool that subset-filters,** name it and explain the difference.

## D10 Current person properties [MEDIUM]

- **Experiment metrics have no "Use person properties from query time" toggle** (insights do). Metrics read person properties in the project's person-properties mode: as of the event when properties are kept on events, current when joined at query time; it differs by project. This is intentional, for a stable population.
- **A property set or backfilled after the events** (or synced from a data warehouse) is invisible when properties are kept on events.
- **Recommend:** a HogQL expression in the metric filter reading current properties, `pdi.person.properties.<key>` (plain `person.properties.<key>` reads the event value when properties are kept on events, current otherwise; one filtered metric per slice); a property captured on the exposure event (e.g. plan tier at exposure) for breakdowns; a dynamic cohort for "currently paid" in the flag's release conditions before launch, not a dynamic cohort in exposure criteria to mirror a release condition (they are evaluated at different times, A7).

## D11 Metric definition traps [HIGH]

- **`event: ""` in an `EventsNode` is an equality filter matching nothing:** the metric is constant per user, commonly 0.
- **A mean or ratio metric left on the editor's "All events" placeholder** stores the name `All events` and matches no event (the page rejects such an inline metric on save). A funnel step on "All events" is stored without an event name and counts every event. Ratio halves can differ (an empty-string numerator matches nothing; a denominator without an event counts everything).
- **An unknown event name gives 0 everywhere.** Inline metrics are checked against project events on save unless the caller passes `allow_unknown_events`; shared metrics are not checked.
- **`count(boolean_expression)` counts non-null, not true:** `count(properties.X = 'value')` counts every event where the property is set. Use `countIf(properties.X = 'value')` or `sum(toInt(properties.X = 'value'))`.
- **An upper outlier bound on a rare event:** `upper_bound_percentile` with `ignore_zeros` off puts the bound near 0 and clamps everything. Fix: turn on `ignore_zeros`.
- **[LOW] An event only one variant sends:** fix with one action covering both events.
- **`validation_failures` `"baseline-mean-is-zero"`:** the baseline values sum to 0 (for a ratio, the numerator); no test variant gets an effect or interval.
- **Verify** `source`, `series`, `numerator`, `denominator`, math and outlier settings; the generated SQL isn't readable by the agent.
- **Metric edits on a running experiment recompute over the full duration;** flag that before recommending one.

## D12 A wider population than the insight [MEDIUM]

- **Get the reference insight** with `insight-get` (filters) and `insight-query` (numbers). If none is named, ask which funnel or dashboard the team decides by; don't pick one.
- **Compare filter by filter.** Typical gaps: existing users in an acquisition experiment, unverified or bot sign-ups, a flag read on more pages, a second experiment on the same surface (list experiments by date and flag). The reverse case is D1.
- **MUST compare the exposed population with the decision population before calling the setup sound; MUST NOT conclude exposure is fine because the criteria are defaults.**
- **Recommend narrowing:** a release condition, an exposure-criteria filter, or an exposure event at the change point. On a running experiment this is a mid-run change (E5): an exposure-criteria filter recomputes the whole run and moves no one; a release condition changes who enrolls from now on. Let the user choose narrowing in place or a clean restart.

## D13 The metric name is free text [MEDIUM]

- **[HIGH behavior] A typed name is never updated when the definition changes.** An untyped name is derived from events (the first event of a mean or funnel, numerator and denominator of a ratio, start and completion of retention). A shared metric shows the shared name, and editing a shared metric changes it in every experiment using it, finished ones included.
- **Evidence:** name, `metric_type`, definition (`source`/`series`, `numerator`/`denominator`, `start_event`/`completion_event`, windows, math); for shared metrics, the change history.
- **MUST say what the metric measures from its definition; MUST NOT restate the title as the definition.**
- **Recommend:** rename or correct it; a definition change recomputes over the whole run.

## Prove it

- The reply states `query_to` for the experiment number being compared, and the SQL window matches it.
- The comparison names which of the eleven scope sources the SQL reproduces and which it doesn't (test accounts, outliers, CUPED, matured users, unit).
- For the first week, the skeleton's per-variant `exposed_persons` and metric value are close to `number_of_samples` and the daily series point, with the remaining gap attributed to a named source.
- The metric was described from its definition (`source`, `series`, `numerator`, `denominator`, math), not its title.
- Any recommended recalculation or metric edit was confirmed with the user first.
