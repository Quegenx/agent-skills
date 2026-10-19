# Experiment health

This is the health check for one experiment whose results look wrong, biased or empty: setup, exposures, results and changes during the run. Most results complaints are config or exposure-collection problems, not statistics bugs, and most diagnostics can be confirmed or ruled out from three cheap reads (the config, the stored results, the change history) before asking the user anything. This file is the workflow, the snapshot and the routing; each symptom group has its own file. Creating and running experiments is [EXPERIMENTS.md](EXPERIMENTS.md), metrics are [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md), flags are [FEATURE-FLAGS.md](FEATURE-FLAGS.md), SQL is [HOGQL.md](HOGQL.md).

**Contents:** [Where to go](#where-to-go) · [Confidence tags](#confidence-tags) · [Step 1: resolve the experiment](#step-1-resolve-the-experiment) · [Step 2: the diagnostic snapshot](#step-2-the-diagnostic-snapshot) · [Stored results](#stored-results) · [Exposure data](#exposure-data) · [Raw exposure queries](#raw-exposure-queries) · [Change history](#change-history) · [Step 3: diagnose](#step-3-diagnose) · [Step 4: calibrate to the experiment's state](#step-4-calibrate-to-the-experiments-state) · [Terminology](#terminology) · [Prove it](#prove-it)

## Where to go

| Symptom | Group | Read |
|---|---|---|
| Smaller variant looks worse, bias banner, ratio vs split, "is 58/42 normal?", "why not 50/50", users in both control and test, high `$multiple` %, "our analytics show an even split", "most responses on the flag are false", "users saw the new UI for a second then lost it", multi-variant exposure on a server-rendered app, flag/experiment state banner, migrating `distinct_id` mid-run, metric count 10x or 100x below exposures | A: bias and skew | [EXPERIMENT-BIAS.md](EXPERIMENT-BIAS.md) |
| "0 / not enough data", variant always undefined or false, "`$feature_flag_called` fires but no exposures", exposures dropped to zero after adding a filter, copied experiment empty, plenty of exposures and zero conversions (then D11), running but exposures flat for weeks | B: empty experiment | [EXPERIMENT-EXPOSURES.md](EXPERIMENT-EXPOSURES.md) |
| Significance flipping or declared then not, one day running, "30/16 split at 46 exposures", "complete / target reached and nothing significant", A/A significant, many metrics, "Bayesian 96% chance to win", CIs overlap, p-value exactly 1, "control shows a lift", external tool disagrees, primary up and secondary down | C: significance | [EXPERIMENT-SIGNIFICANCE.md](EXPERIMENT-SIGNIFICANCE.md) |
| PostHog differs from SQL, funnel % vs raw count, flat vs dashboard drop, sum of revenue wrong, breakdown 'none', metric name vs number, recordings vs stats, filter didn't change user count, slicing by current person properties, results haven't updated | D: numbers vs SQL | [EXPERIMENT-NUMBERS.md](EXPERIMENT-NUMBERS.md) |
| Changed split, rollout, metric or criteria mid-run, numbers changed overnight (E then D8), paused, froze, ended or shipped flag flipped to 0/100, shipped and some users don't get it, long-term vs primary, retention counts unexpected users, can't convert the flag back to boolean, restart with new variants, legacy experiment | E: mid-run changes | [EXPERIMENT-CHANGES.md](EXPERIMENT-CHANGES.md) |
| "The test variant does worse, is it set up correctly?", "can you check this experiment?" | Step 3's two checks, then C and D12 | This file, then the above |
| Results won't load, many metric rows `data: null` (not legacy) | Snapshot | [Exposure data](#exposure-data) |
| "What do users think", "why prefer control", behavior per variant, Replay Vision | F: qualitative | [EXPERIMENT-REPLAYS.md](EXPERIMENT-REPLAYS.md) |
| A support request about someone else's experiment, SRM localization, offline hash recompute, real vs noise, a written reply | Debugging | [EXPERIMENT-DEBUGGING.md](EXPERIMENT-DEBUGGING.md) |

- **Not this file:** creating an experiment, only rollout, only metrics or only lifecycle ([EXPERIMENTS.md](EXPERIMENTS.md), [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md)). When the flag itself evaluates wrong for a user, see [FEATURE-FLAGS.md](FEATURE-FLAGS.md).
- **If the symptom is unclear, ask ONE clarifying question before picking;** don't guess. A complaint that matches several groups gets each one read. An automated or scout report: route by its finding and reuse its numbers.

## Confidence tags

The diagnostics in these files carry the vendor's confidence tags, not impact severities. P0 to P3 is reserved for severity; preserve these source-confidence labels with the meanings below. [PostHog skills, experiment-health references]

| Tag | Meaning |
|---|---|
| `[HIGH]` | Verified directly in PostHog code |
| `[MEDIUM]` | Partially or team-source verified |
| `[LOW]` | SDK or external behavior not verified: a hypothesis to test, not a fact to assert |

## Step 1: resolve the experiment

Resolve a name or description to an ID ([EXPERIMENTS.md](EXPERIMENTS.md#find-an-experiment)), then call `experiment-get` and read:

| Field | What it tells you |
|---|---|
| `status`, `start_date`, `end_date`, `is_legacy` | `draft` / `running` / `paused` / `exposure_frozen` / `stopped` |
| `feature_flag.active`, `feature_flag.filters.multivariate.variants[]` | Variant keys and split (`rollout_percentage`). This is the flag NOW; after a ship or edit, the split of the run is in the change history. |
| `feature_flag.filters.aggregation_group_type_index` | When set, the unit is a group, not a person |
| `feature_flag.filters.groups[]` | Per group: `variant`, `properties`, `rollout_percentage` (that group's rollout; each group has its own, so there is no single overall rollout unless the flag has one unconditional group). A non-null `variant` equal to a variant key is a forced-variant override, not randomized (A7). A variant-pinned group with broad or empty `properties` at high rollout, or no group left randomized (`variant: null`), starves the other arm (A7b). |
| `feature_flag.bucketing_identifier`, `feature_flag.ensure_experience_continuity` | What the flag hashes (A3, A6, A8, A10) |
| `holdout`, `excluded_variants` | People and arms outside the analysis on purpose |
| `exposure_criteria.multiple_variant_handling` | Defaults to `"exclude"` if absent |
| `exposure_criteria.exposure_config` | Exposure event plus property filters. Unset, or naming `$feature_flag_called`: the default exposure event, read which from `resolved_exposure_event`. Naming `$experiment_exposure`: counts that event whatever `resolved_exposure_event` says. Any other event or an action: a custom exposure event. Property filters apply to either (B12). |
| `exposure_criteria.activation_config` | An activation event on top of the default exposure: a person counts only from their first activation event at or after their first flag exposure, and that event's time is the exposure time. Doesn't combine with a custom exposure event. |
| `exposure_criteria.filterTestAccounts` | Defaults to `true` |
| `metrics`, `metrics_secondary`, shared metrics | Name, type, definition. Describe a metric from its definition, not its name (D13). |
| `stats_config` | `method` (Bayesian/Frequentist), `bayesian.ci_level`, `frequentist.alpha`, `frequentist.sequential_testing_enabled`, `cuped`, `baseline_variant_key`. Missing `method` reads as Bayesian, a missing level as 95%; sequential testing and CUPED fall back to the project default (C13). |
| `running_time_calculation` | Target sample (a TOTAL across all variants), days still missing, MDE. When it came from numbers the user typed, or was written at creation and never refreshed by the page, the days are the whole estimated length (C12). A duplicated experiment starts with its source's values until the page refreshes them. |
| `only_count_matured_users` | E11 |

## Step 2: the diagnostic snapshot

Pull the snapshot BEFORE asking clarifying questions. Read in this order, run each once and reuse it:

| Order | Read | Tool | Cost |
|---|---|---|---|
| 1 | Config | `experiment-get` | One read |
| 2 | Stored results | `experiment-metrics-recalculation-latest-retrieve` | One read; never starts a calculation |
| 3 | Changes | `experiment-activity` | One read |
| 4 | Exposure data | `experiment-results-get` | Runs the exposure query and every metric query with no cached result |
| 5 | Raw exposure events | `execute-sql` | An event scan; only for what 1 to 4 can't show |

- **Most diagnostics are settled by the first three.** Read the change history first when the user reports a surprising change.
- **MUST read stored results before any computing tool. MUST NOT start with `experiment-results-get`** (runs uncached metric queries) **or `experiment-metrics-recalculation-create`** (starts a calculation). Ask the user before a recalculation and say it recomputes every metric.
- **Handing off:** when the snapshot disproves a diagnostic, skip it; when it confirms one, lead with the evidence ("the data shows X, which is diagnostic Y").

## Stored results

- **`query_to`:** the data ends here; state it with every number you report. A calculation after the stop ends at the end date. When the last calculation ran before the stop, `query_to` is earlier than `end_date` and the numbers miss the gap: compare them on every stopped experiment (D8).
- **`number_of_samples` per variant:** units the metric counts as exposed. Excludes `$multiple` and, with `only_count_matured_users`, units whose window hasn't ended; can be lower than exposure counts and differ between metrics.
- **No `exposures` object.** The multi-variant count, SRM p-value and daily series come from exposure data.
- **`result_source`:** `recalculation` for a real run; `timeseries_fallback` means no run completed and the numbers are a placeholder from the daily series (say so).
- **`active_run`** is present while a run executes: results are from the run before, or a placeholder, or the running calculation with `status` `pending`/`in_progress` and empty or partial `results`.
- **404 means no results yet.** A metric with `status: failed` carries `error_message`: a failed computation, not zero.
- **Empty `results` or a missing metric:** the start date, exposure criteria, method, excluded variants or completed-window setting changed after the run, or the metric was added or edited after; those rows stay out until the next calculation (not zero).

| `validation_failures` | Meaning |
|---|---|
| `not-enough-exposures` | Fewer than 50 exposures in the variant |
| `not-enough-metric-data` | Funnel or retention below 5 conversions; ratio denominator zero |
| `baseline-mean-is-zero` | Baseline total is 0 (D11) |

A failed variant has no chance to win, p-value or significance; a failure on the baseline leaves every variant without them. Code: `validate_variant_result` in products/experiments/backend/hogql_queries/utils.py.

## Exposure data

`experiment-results-get` returns an `exposures` object that powers A1, A2, A3, A7b, B0, C2 and the plateau check. The experiment's own exposure query: the exposure event, current variant keys only, the test-account filter, the experiment window, each person once at first exposure; `excluded_variants` left out; a group-aggregated flag counts groups; with an activation event, counts from the first activation at or after the first flag exposure. Raw queries don't apply activation.

| Field | Meaning |
|---|---|
| `exposures.total_exposures` | People per variant; key `$multiple` = people exposed to more than one variant under `exclude`; absent under `first_seen` |
| `exposures.sample_ratio_mismatch` | `p_value` and expected counts; null below **100** exposures |
| `exposures.bias_risk` | Present when the bias banner's conditions hold, with `multiple_variant_percentage` |
| `exposures.timeseries[].exposure_counts` | Per variant, CUMULATIVE people by day of first exposure; a flat tail = no new people (it doesn't show whether the app still calls the flag) |
| `exposures.date_range` | The window |

- **Read off:** total 0: the B series; under 50 in a variant: no result; non-zero `$multiple`: A1, A3, A4; observed vs configured split: judge by p-value, not by eye; daily series: a gap growing one way (A9), an arm that stops growing (A7b, A6), all flat (the empty-experiment closing section).
- **Call it once per diagnosis.** It sends every metric query in one call; results younger than **24 hours** come from cache; `last_refresh` and `is_cached` per row give the age.
- **`refresh: true`:** the health reference says it does NOT force recomputation (it is sent as 'blocking'); the support-debugging reference says use it to force one recompute before reporting a metric as failing. Confirm in the current docs before relying on `refresh`.
- **Its `experiment.status` is derived from dates only** (`draft`, `running`, `completed`). Read `paused` and `exposure_frozen` from `experiment-get`.
- **Metric rows with `data: null`** in `metrics.primary.results` / `metrics.secondary.results` are a failed query in this call, with no error text kept. One call with `data: null` rows is not evidence a metric is broken: read stored results (a completed result there means it computes; `status: failed` plus `error_message` means inspect the definition, D11). Don't repeat `experiment-results-get` to see if rows fill in. The count of null rows is not severity (dozens of metrics give more failures).
- **Backend results health is not in-app loading.** Complete stored results plus a page that won't load is a page-loading problem; many or heavy metrics (a funnel with dozens of steps, an exposure filter on an expensive property) are a cause the user can change.
- Code: `ExperimentExposuresQueryRunner` in products/experiments/backend/hogql_queries/experiment_exposures_query_runner.py; `getExposures`/`getMetricResults` in services/mcp/src/api/client.ts; `transformExperimentResults` in services/mcp/src/schema/experiments.ts.

## Raw exposure queries

Rules for every raw query:

- **Use `resolved_exposure_event`; never hardcode `$feature_flag_called`.** When it is `$feature_flag_called`, write `event IN ('$feature_flag_called', '$experiment_exposure')` and count persons, not rows.
- **Bound both ends of the time range, at most 7 days per query,** one day first on a large project; a non-materialized property keeps it to one day.
- **Wrap every timestamp in `toDateTime('<timestamp>', 'UTC')`;** a bare string is read in the project time zone.
- **Use the flag's variant keys** from `feature_flag.filters.multivariate.variants[].key`.
- **Group-aggregated flag:** count `$group_<index>` instead of `person_id` and drop empty rows.
- **Raw queries include test users** (say so). Add the `exposure_criteria.exposure_config.properties` conditions to WHERE, or say the query counts more (B12).

| Config | Event | Variant property |
|---|---|---|
| Not set, or names `$feature_flag_called` | `resolved_exposure_event` | `$feature_flag_response`, with `$feature_flag` = flag key |
| Names `$experiment_exposure` | `$experiment_exposure` | Same properties |
| Any other event | That event | `` `$feature/<flag-key>` `` |
| An action | Every event the action matches | `` `$feature/<flag-key>` `` |

### Which default event

- **The default is `$experiment_exposure` when the experiment started on or after 2026-09-01 (UTC) AND the project is in that event's rollout; otherwise `$feature_flag_called`.** Read `resolved_exposure_event`; don't derive it. For some organizations ingestion stops writing `$feature_flag_called` and the copy carries the exposures; before that, a call and its copy are two rows for one exposure.
- **`$experiment_exposure` is a copy of `$feature_flag_called` written at ingestion** with the same properties, for every string response other than `true`, `false` and empty (a variant key, `holdout-<id>`, or a key in another spelling). `true`, `false` and empty have no copy, so no-variant questions (A10) need `$feature_flag_called`.
- **The copy is switched on per project, separately from the experiment setting.** If `resolved_exposure_event` is `$experiment_exposure`, the window starts on or after 2026-09-01, that event has no rows for the flag, and `$feature_flag_called` has variant responses in the window, the copy isn't being written for the project: not an SDK or app fault, point to PostHog support.
- Code: `resolve_default_exposure_event` and `EXPERIMENT_EXPOSURE_EVENT_CUTOFF` in products/experiments/backend/hogql_queries/exposure_query_logic.py; `build_variant_property` in experiment_exposure_query_builder.py; `isMultivariateFeatureFlagCalledEvent` in nodejs/src/ingestion/common/steps/event-processing/create-event-step.ts.

### Raw responses, default exposure event

```sql
-- Default exposure event: what the application sent, per response
SELECT
    properties.$feature_flag_response AS response,
    count() AS events,
    uniq(person_id) AS persons,
    uniq(distinct_id) AS distinct_ids,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event = '<resolved_exposure_event>'
  AND properties.$feature_flag = '<flag-key>'
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
GROUP BY response
ORDER BY events DESC
LIMIT 50
```

### Variant values, custom exposure event

```sql
-- Custom exposure event: the values of the variant property
SELECT
    properties.`$feature/<flag-key>` AS variant_value,
    count() AS events,
    uniq(person_id) AS persons,
    uniq(distinct_id) AS distinct_ids,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event = '<custom-exposure-event>'
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
GROUP BY variant_value
ORDER BY events DESC
LIMIT 50
```

Reading the rows:

- **Rows that are not a variant key** (`false`, empty, another spelling or case, `holdout-<id>`) are dropped by the experiment. `false` and empty exist only on `$feature_flag_called`. They are NOT multi-variant people; no event ever carries `$multiple`. Whether a finding depends on who they are is A10. Every row a non-variant: the B series. `holdout-<id>` is the holdout, expected.
- **`distinct_ids / persons` above 1 for a variant** means several linked ids (A3).
- **`last_seen` per variant:** one far behind means the app sends for one arm only; all behind on a running experiment means the app stopped sending.
- **`events` far above `persons` is normal.**

### By day and library (A2, A9)

```sql
SELECT
    toDate(timestamp) AS day,
    properties.$lib AS lib,
    properties.$feature_flag_response AS response,
    count() AS events,
    uniq(person_id) AS persons
FROM events
WHERE event = '<resolved_exposure_event>'
  AND properties.$feature_flag = '<flag-key>'
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
GROUP BY day, lib, response
ORDER BY day, lib, response
LIMIT 200
```

`persons` counts everyone sending that day (returning people included), while the experiment series counts each person once on their first exposure day: compare the shape, not day by day. For A9, group by `properties.$pathname` in place of `lib`, on one day.

## Change history

- **Read it in every diagnosis;** first when the user reports a surprising change.
- **`experiment-activity { id: <experiment_id> }`:** changes to the experiment, its attached holdout and shared metrics, and the linked flag, newest first, with before/after values. Flag changes are omitted when the caller lacks flag access (no flag entry is not proof the flag is unchanged).
- **Lifecycle actions show as field changes:** launch and reset change `start_date`; end changes `end_date`; pause and resume change the flag's `active`; freeze and unfreeze change the flag's release conditions; ship changes the flag's variants. Newer named entries: `paused`, `resumed`, `exposure_frozen`, `exposure_unfrozen`, `variant_shipped`; older ones lack them (a missing named entry proves nothing).
- **`feature-flags-activity-retrieve { id: <feature_flag_id> }`:** the flag's own history, a shorter read for split, release conditions and state.
- **Long histories:** on experiments running before mid-September 2026 most older entries are `running_time_calculation` updates (no analysis impact); newer estimate updates leave no entry. Page with `limit`, skip those, and read back to launch before saying nothing changed.
- **The split of the run is in the history, not on the flag.** `experiment-get` shows the current flag (100/0 after a ship); the assigned split is the flag's value at `start_date` plus every change since. After a reset, `start_date` is the relaunch.
- **`advanced-activity-logs-list`** is the project-wide log where the plan includes it. The health reference says it returns field-level diffs when `fields` is omitted or includes `detail.changes`; the support reference says its experiment timeline row has "no change diff, so use it for when, not what", and its "feature flag updated" row lacks the flag key. Use `feature-flags-activity-retrieve` for what changed on a flag.
- **A `distinct_id` strategy change (A8) is in user code** and does NOT show in any activity log: diagnose it from event-side identity signals.

## Step 3: diagnose

- **List every applicable diagnostic before recommending.** Surface co-occurring mechanisms independently: a systematic bias (uneven split plus Exclude) does not resolve by waiting; a statistical pattern (small-sample variance) does.
- **List only mechanisms with a verification path in project state** (config from `experiment-get`, the snapshot, the activity log, the repo source). Config-derived ones count (80/20 plus default exclude is enumerable). Naming SRM when the snapshot ratio is clean does not.
- **Two checks in EVERY diagnosis:**
  1. **Age and share of the target sample** before reading a result: `start_date`, and the exposed total against `running_time_calculation.recommended_sample_size`. The page takes the exposed total from the first primary metric: the sum of its `number_of_samples` over all variants in stored results, NOT `exposures.total_exposures`. When `recommended_sample_size` is absent, say no target was saved.
  2. **Who is exposed:** compare the exposed population (`exposure_criteria` plus release conditions) with the people the decision is about. Default exposure settings are not evidence; when nothing says who, ask.

## Step 4: calibrate to the experiment's state

| State | Scope |
|---|---|
| Draft | Config changes are free: recommend and apply. A draft's flag can still serve users: a draft made by a reset, or created on an existing flag, can have `feature_flag.active` true, so edits reach users at once. |
| Running, `paused`, `exposure_frozen` (launched, not ended) | Explain the mid-run impact before recommending. Pause, freeze, unfreeze and reset each interrupt and can bias (E8, E9, E16). |
| Stopped, archived | Interpretation, the next experiment, or explaining what happened |

- **A change to a running experiment or its flag** (new metric, new exposure criteria, reset, relaunch, flag edit) is the user's decision: say what it does to the data so far, and make it only on explicit instruction.
- **On stopped or archived experiments, don't preemptively offer to reverse state changes** (a ship-variant rewrite, a manual flag edit, a reset, an archive). Conditional offers ("if this wasn't intended...", "want me to revert it?") count as preemptive. Only an explicit reversal request surfaces the mechanics.

## Terminology

- **Variant split** (between variants) is not **rollout** (the share of a release condition's audience that enters).
- **Default exposure event** (`resolved_exposure_event`) is not a **custom exposure event**.
- **Exclude from analysis** and **Use first seen variant** are options of **Multiple variant handling** (`exposure_criteria.multiple_variant_handling`): they decide how multi-variant people are counted, not which event is the exposure.

## Prove it

- The diagnosis names, for each listed mechanism, the field or query result that verifies it (from `experiment-get`, stored results, `experiment-activity` or a raw query), and no mechanism without one.
- The reply states the experiment's age, the exposed total against `recommended_sample_size` (or that no target was saved), and `query_to` for every stored number.
- `experiment-results-get` was called at most once, after stored results and change history, and no recalculation was started without asking.
- Raw queries used `resolved_exposure_event`, UTC-wrapped bounds of at most 7 days, and the flag's variant keys.
- On a running experiment, nothing was changed without the user's explicit instruction after hearing the effect on data so far.
