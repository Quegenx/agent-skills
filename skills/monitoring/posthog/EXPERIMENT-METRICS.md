# Experiment metrics

An experiment metric counts only events a person sends after their first exposure, attributed to the variant on that exposure event; metric events themselves need no variant property. Every metric is `kind: "ExperimentMetric"` with a `metric_type` of `mean`, `funnel`, `ratio` or `retention`. Most outcomes come down to three choices: the exposure (which event, and what happens to people seen in two variants), the metric definition (event names confirmed in the project, the right type and math, a conversion window with its unit), and reading the result at a predetermined sample size instead of the first time it looks significant. Creating and running experiments is [EXPERIMENTS.md](EXPERIMENTS.md); a result that looks wrong is [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md).

**Contents:** [Exposures](#exposures) · [Attaching metrics](#attaching-metrics) · [Metric types](#metric-types) · [Math and node fields](#math-and-node-fields) · [Property filters](#property-filters) · [Examples](#examples) · [Templates by question](#templates-by-question) · [Sample size and running time](#sample-size-and-running-time) · [Statistics](#statistics) · [Interpreting results](#interpreting-results) · [Prove it](#prove-it)

## Exposures

- **The default exposure event is `$feature_flag_called`, or `$experiment_exposure` for newer experiments.** It is resolved server-side: read `resolved_exposure_event` from `experiment-get`. When it is `$feature_flag_called`, also read `$experiment_exposure` (`event IN ('$feature_flag_called', '$experiment_exposure')`) and count persons, not rows. Both events carry the same properties.
- **An exposure carries `$feature_flag` and `$feature_flag_response`.** Metric events need no variant property; only the exposure does.
- **A custom exposure event gives tighter control** (e.g. only users who visit the page) and must carry `$feature/<flag-key>`.
- **The web SDK dedupes `$feature_flag_called` per identity across sessions,** so returning users who saw the flag before launch aren't re-exposed. Fix: `advanced_feature_flags_dedup_per_session: true`. Mobile SDKs, React Native and Flutter included, already dedupe per session.
- **Multiple variant handling** decides how people seen in more than one variant count: "Exclude from analysis" (cleaner, smaller; the docs call it recommended) or "Use first seen variant" (keeps everyone; the analytics skill says "not recommended unless necessary", but recommends it for uneven splits, see [EXPERIMENTS.md](EXPERIMENTS.md#rollout-and-split)).
- **`exposure_criteria.filterTestAccounts` defaults to true.**
- **`getAllFlags()` does not record exposures.** Pageview goal metrics undercount in experiments compared with insights because flags aren't loaded yet; fix by waiting (about 200ms) or bootstrapping.
- **SRM check:** chi-squared once there are at least 100 exposures, flagged at p < 0.001. Diagnosis is [EXPERIMENT-BIAS.md](EXPERIMENT-BIAS.md).

## Attaching metrics

- **Inline metrics go in `metrics` (and `metrics_secondary`) on `experiment-update`,** which REPLACES the whole list: call `experiment-get` first and append.
- **Shared metrics go in `saved_metrics_ids`,** which also replaces; resend the full set. Entry shape `{ "id": <saved-metric id>, "metadata": { "type": "primary" } }`; `metadata` is optional and defaults to primary. An empty array detaches all. Attaching a shared metric doesn't touch inline `metrics`, and vice versa.
- **Read/write asymmetry:** in `experiment-get`, `saved_metrics` entries have a top-level `id` (the link row) and `saved_metric` (the metric id). Send the `saved_metric` value; the link `id` attaches the wrong metric or fails validation.

```json
{
  "saved_metrics_ids": [
    { "id": 42, "metadata": { "type": "primary" } },
    { "id": 57, "metadata": { "type": "secondary" } }
  ]
}
```

- **Promote inline to shared:** `experiment-saved-metrics-create` with the inline `query` minus `query.uuid` (the API assigns a new uuid and ignores one sent); then in ONE `experiment-update` attach it through `saved_metrics_ids` and resend `metrics` without the inline one, or it measures the same thing twice.
- **Step 1 (required): reuse a shared metric matched by definition, never by name.** Definition = event or action + `metric_type` + compatible `math`. Call `experiment-saved-metrics-list?event=<event>` (matches an `EventsNode` directly or through action step events). Don't use `search` for this: it matches only name, description and tags. Confirm the match with the user by name; offer to create a shared metric if an inline one is likely to be reused.
- **Step 2 (required before inline): call `read-data-schema`.** Never suggest unconfirmed event names, even ones the user names. Pass `allow_unknown_events: true` on create or update only for intentionally not-yet-ingested events, confirmed with the user; without it, metric creation over the API or MCP fails for an event never ingested (a guardrail against typos).

```text
User: "Let's add some metrics for the checkout experiment"

WRONG: "I'd suggest using purchase_completed as the primary metric..."
  (hallucinated event name, never seen the project's actual events)

RIGHT: *calls read-data-schema* → "Here are the events in your project
  related to checkout: `checkout_step_completed`, `payment_processed`,
  `order_confirmed`. Which of these represents a successful checkout?"
```

- **Primary metrics drive the ship or end decision; secondary ones give context and guardrails** (e.g. error rates). In the analysis the distinction is organizational only.
- **Shared metrics can be reused across experiments.** Editing one changes it in every experiment using it, finished ones included.
- **Legacy kinds `ExperimentTrendsQuery` and `ExperimentFunnelsQuery` are rejected;** all metrics use `kind: "ExperimentMetric"`.

## Metric types

| Type | Required | Optional | Measures |
|---|---|---|---|
| `mean` | `source` (EventsNode, ActionsNode or ExperimentDataWarehouseNode) | `upper_bound_percentile`, `lower_bound_percentile` (winsorization fractions in [0,1], e.g. 0.99 / 0.01), `ignore_zeros`, `threshold`, `goal`, `conversion_window`, `conversion_window_unit`, `breakdownFilter` | Count, sum, avg, min, max or unique per user, then averaged across users; HogQL expressions allowed, e.g. `uniqExact(properties.category)` |
| `funnel` | `series` (same node kinds) | `funnel_order_type` (`strict`, `unordered`, `ordered`), `breakdownAttributionType` (default `first_touch`; `first_touch`, `last_touch`, `all_events`, `step`), `breakdownAttributionValue` (0-indexed step when `step`), `conversion_window(_unit)`, `goal` | Yes/no conversion. The exposure is prepended as `step_0`, so 1 step = exposure to action. Step order matters. |
| `ratio` | `numerator`, `denominator` (each with its own `math`/`math_property`) | `numerator_outlier_handling`, `denominator_outlier_handling` (`ignore_zeros`, `lower_bound_percentile`, `upper_bound_percentile`) | Sum of per-person numerators over sum of per-person denominators (delta method). No top-level `upper_bound_percentile`. |
| `retention` | `start_event` (also accepts `ExperimentExposureNode`, "Experiment exposure"), `completion_event`, `retention_window_start`, `retention_window_end`, `retention_window_unit`, `start_handling` (`first_seen` or `last_seen`) | | Did the person come back in the window |

- **Common fields:** `name`, `uuid`, `fingerprint`, `isSharedMetric`, `sharedMetricId`, `goal` (`increase` or `decrease`), `conversion_window` (integer), `conversion_window_unit` (`second`, `minute`, `hour`, `day`, `week`, `month`).
- **`threshold`** "reports the percentage of users whose per-user summed/counted value reaches or exceeds this threshold. Only meaningful for sum/count math types."
- **"Sum" on a mean metric is the mean of per-user totals,** not the total.
- **Outlier handling is winsorization** (mean and ratio); a ratio caps numerator and denominator independently; there is an option to ignore zeros.
- **Mean vs funnel on the same event:** mean is the count or magnitude per user; funnel is yes/no conversion.
- **Missing `retention_window_start` or `start_handling` is a Pydantic missing-field error.**
- **`retention_window_unit`:** the metric-configuration prose says `"day"` or `"hour"`; the schema types it as `FunnelConversionWindowTimeUnit` (`second` to `month`). The editor offers only day and hour; check the current docs before sending another unit.
- **Retention semantics:** the start occurrence never counts as its own completion. Different events = conversion retention; the same event = repeat retention, use `first_seen` (`last_seen` anchors on the final occurrence, which has no in-experiment activity after it). `From 0` counts same-period repeats; `From N` (N >= 1) requires a later period. "retention of `<event>`" usually means repeat retention. Windows use calendar days.

### Conversion windows

- **Set an explicit conversion window.** The default is none, which counts through the experiment's end.
- **The window is anchored at the first exposure and extends past the experiment's end.**
- **Set `conversion_window` and `conversion_window_unit` together or neither.** "A window without a unit is ignored and the metric counts events until the experiment ends."

## Math and node fields

| Enum | Values |
|---|---|
| `ExperimentMetricMathType` | total, sum, unique_session, min, max, avg, dau, unique_group, hogql |
| `BaseMathType` | total, dau, weekly_active, monthly_active, unique_session, first_time_for_user, first_matching_event_for_user |
| `PropertyMathType` | avg, sum, min, max, median, p75, p90, p95, p99 |
| `FunnelMathType` | total, first_time_for_user, first_time_for_user_with_filters |
| `CountPerActorMathType` | avg, min, max, median, p75, p90, p95, p99 `_count_per_actor` |
| `GroupMathType` | unique_group, first_time_for_group, first_matching_event_for_group |

- **Node fields also include** `math_hogql`, `math_multiplier`, `math_group_type_index` (0 to 4), `math_property_type`, `math_property_revenue_currency` (`{property, static: CurrencyCode}`).
- **`ExperimentDataWarehouseNode` requires** `table_name`, `timestamp_field`, `data_warehouse_join_key`, `events_join_key`. `ActionsNode` requires `id`. `EventsNode.event` null means all events.

## Property filters

- **Filters scope which events count; they never aggregate.** Wrong: a ratio numerator with `{ "key": "revenue", "value": "is_set", "operator": "is_set", "type": "event" }` counts purchases that have revenue, not the revenue total. Use `math: "sum"` with `math_property`.
- **Filter `type` values:** event (operator default `exact`), person, person_metadata (top-level persons columns, e.g. `created_at`), element (key `tag_name`, `text`, `href` or `selector`), event_metadata, session, cohort (key `id`, operator default `in`, value integer), recording, log_entry, group, feature (`$feature/` prepended), flag (key = flag ID; only `flag_evaluates_to`; value true, false or a variant), hogql, empty, data_warehouse, data_warehouse_person_property, error_tracking_issue, log, log_attribute, log_resource_attribute, metric_attribute, span, span_attribute, span_resource_attribute, revenue_analytics, account_custom_property, workflow_variable, behavioral ("ClickHouse-only, not evaluable by flags or CDP"; `value` `performed_event` or `performed_event_multiple`; with `negation`, "zero-occurrence persons never match count operators").
- **`PropertyOperator`:** exact, is_not, icontains, not_icontains, starts_with, not_starts_with, ends_with, not_ends_with, regex, not_regex, gt, gte, lt, lte, is_set, is_not_set, is_date_exact, is_date_before, is_date_after, between, not_between, min, max, in, not_in, is_cleaned_path_exact, is_cleaned_path_not_exact, flag_evaluates_to, semver_eq, semver_neq, semver_gt, semver_gte, semver_lt, semver_lte, semver_tilde, semver_caret, semver_wildcard, icontains_multi, not_icontains_multi.

```json
{
  "kind": "EventsNode",
  "event": "purchase_completed",
  "properties": [
    { "key": "plan", "value": ["pro", "enterprise"], "operator": "exact", "type": "event" }
  ]
}
```

## Examples

```json
{ "kind": "ExperimentMetric", "metric_type": "mean", "name": "Average revenue per user",
  "source": { "kind": "EventsNode", "event": "purchase_completed", "math": "sum", "math_property": "revenue" } }
```
```json
{ "kind": "ExperimentMetric", "metric_type": "funnel", "name": "Checkout conversion",
  "series": [
    { "kind": "EventsNode", "event": "add_to_cart" },
    { "kind": "EventsNode", "event": "checkout_started" },
    { "kind": "EventsNode", "event": "purchase_completed" } ] }
```
```json
{ "kind": "ExperimentMetric", "metric_type": "ratio", "name": "Revenue per pageview",
  "numerator": { "kind": "EventsNode", "event": "purchase_completed", "math": "sum", "math_property": "revenue" },
  "denominator": { "kind": "EventsNode", "event": "$pageview" } }
```
```json
{ "kind": "ExperimentMetric", "metric_type": "retention", "name": "7-day file-upload retention",
  "start_event": { "kind": "EventsNode", "event": "$pageview" },
  "completion_event": { "kind": "EventsNode", "event": "uploaded_file" },
  "retention_window_start": 0, "retention_window_end": 7, "retention_window_unit": "day",
  "start_handling": "first_seen" }
```

The same reference also shows a single-step funnel on `checkout_started`, a click-through ratio `button_clicked` over `$pageview`, and repeat retention `nav_panel_clicked` to `nav_panel_clicked` with the same window.

## Templates by question

| Question | Shape |
|---|---|
| Conversion: "more people do X" | `funnel`, one step; `goal: "increase"`; a window with its unit when X has a known delay. Say that X must be captured for the exposed person under the same identity. |
| Journey A to B to C | `funnel`, 2 to 4 ordered steps. Numbers won't match a product analytics funnel (exposure comes first, test accounts are removed). |
| Count per user | `mean`, `math: "total"`, `upper_bound_percentile: 0.99` |
| Revenue per user | `mean`, `math: "sum"`, `math_property` = the revenue property, `upper_bound_percentile: 0.99`. Cover every revenue event and property; server-side purchase events need the same identity as the exposure. |
| Average value (faster, longer) | `mean`, `math: "avg"` + `math_property`; `goal: "decrease"` when lower is better (latency, load time). Server-side events have no session. |
| Unique-user rate | `ratio`, `math: "dau"` on both sides |
| Average order value | `ratio`: numerator `math: "sum"` of revenue, denominator `math: "total"` of the same event; `numerator_outlier_handling: {"upper_bound_percentile": 0.99}`; read it with conversion and revenue per user |
| Return rate | `retention`, `start_handling: "first_seen"`, `retention_window_start: 1`, `retention_window_end: 7`, `retention_window_unit: "day"`; completed windows only; late-exposed users pull the rate down |
| Trial to paid | `funnel` with a fixed window longer than the trial (it starts at exposure, so it must cover the time to start the trial plus the trial); completed windows only |

- **The return-rate template uses `retention_window_start: 1`** (a later period); the configuration examples use `0` (same-period repeats count). Pick by the question.
- **"Require completed conversion or retention window" (`only_count_matured_users`):** creation turns it on when `team_defaults.only_count_matured_users` is on. The agent can't set it (`experiment-create` and `experiment-update` don't expose it); for return rate and trial to paid with the team default off, tell the user to enable it in the experiment's Settings tab.
- **Primary = the most frequent event that still expresses the hypothesis.** If it is rare (running time in months), make it secondary.

## Sample size and running time

- **Two modes.** Automatic (launched experiments): needs at least **1 day** and **100 exposures**, else "Duration pending"; uses the first primary metric; re-estimates and saves whenever someone opens the page. Manual (drafts): metric type Funnel, Count or Sum/Avg, baseline, MDE, exposures per day.
- **MDE default 30%** where the project sets none, which a busy surface reaches within days.
- **Formula per variant (80% power, 95% confidence):** `N = (16 × variance) / d²`, with d = MDE × baseline.

| Metric | Variance |
|---|---|
| Funnel | `p × (1 - p)` |
| Count | `2 × baseline` |
| Sum / avg | `0.25 × baseline²` |

- **Example:** p = 0.1, MDE 20%: 3,600 per variant, 7,200 total for 2 variants.
- **Half the effect needs four times the sample** (inverse square).
- **The approximation runs a little low:** the exact two-proportion value at p = 0.1, MDE 20% is 3,841 per variant. A table computed from the exact formula, and duration with unequal splits, are in [ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md).
- **"Target reached" is not "significant".** It doesn't end the experiment either.

## Statistics

- **Frequentist:** Welch's t-test; 95% by default, 90/95/99 configurable in Experiments > Settings. A confidence interval that doesn't cross 0 is significant.
- **Bayesian:** reports chance to win; significant when `chance_to_win` is above the confidence level (95% default) or below 5%. Funnels also need `n × p > 5` and `n × (1-p) > 5`.
- **Minimum data before a result:** each variant needs at least 50 exposures, funnels at least 5 conversions per variant, and a non-zero control mean. (The troubleshooting docs phrase it as a minimum of 50 total exposures before results; the statistics page and the product's validity gate apply 50 per variant.)
- **Sequential testing** (Waudby-Smith et al. 2023) solves peeking with confidence sequences; intervals are slightly wider; tuning parameter default 5,000 (set it near the expected total sample size). Enable it per experiment or with "Apply sequential testing by default". Frequentist only.
- **No multiple-comparison correction.** 5 metrics give about a 23% chance of at least one false positive, 10 give about 40%. Don't ship on an unexpected significant metric: rerun with it as the primary.
- **CUPED variance reduction is available.**
- **Results show 95% credible interval bars.**
- More traps (Bayesian reading, "target reached", the end modal) are in [EXPERIMENT-SIGNIFICANCE.md](EXPERIMENT-SIGNIFICANCE.md).

## Interpreting results

- **Recommend shipping only when the result is statistically significant.** "Do NOT recommend shipping just because a variant is "winning", check significance first." Bayesian reports the probability of each variant being best; Frequentist reports p-values and confidence intervals.
- **"Experiments typically need 1-2 weeks minimum for reliable results";** warn on small samples.
- **Present every metric.** Call out primary up and guardrail down; don't cherry-pick.
- **Pricing and paywall tests:** "Judge winners on revenue per visitor, plan mix, refunds, downgrades, churn, and support load - not conversion rate alone", and "Do not promote a variant that lifts conversion but lowers revenue-per-visitor or raises refunds/churn" [coreyhaines31/marketingskills, marketing-loops]. Make those the secondary and counter metrics.

| Situation | Recommendation |
|---|---|
| Clear winner, significant, sufficient runtime | Ship |
| No significant difference after 2+ weeks | End as inconclusive |
| Primary up but a guardrail degraded | Flag the trade-off; the user decides |
| Borderline | Continue, or end as inconclusive |
| Under 1 week | Too early |

- **Don't** declare failure on early results, ship on borderline significance, ignore guardrails, or hide ambiguity.
- **"Continue" on a borderline result** fits only before the planned sample is reached or with sequential testing on. [coreyhaines31/marketingskills, ab-testing] says of a finished fixed-horizon test: "do not extend a finished fixed-horizon test until it becomes significant"; report the effect interval and plan a new test ([ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md#reading-the-result)).

## Prove it

- `experiment-get` after the update shows every intended metric (inline and `saved_metrics`) with `kind: "ExperimentMetric"`, and no metric was silently dropped by a replacing update.
- Every event in a metric appeared in `read-data-schema`, or `allow_unknown_events` was confirmed with the user.
- Every `conversion_window` has a `conversion_window_unit`.
- Shared metrics were matched with `experiment-saved-metrics-list?event=`, and `saved_metrics_ids` carries `saved_metric` values, not link ids.
- The running-time estimate (sample per variant from `16 × variance / d²`) was written down before launch, and the result was read at that sample, not before.
