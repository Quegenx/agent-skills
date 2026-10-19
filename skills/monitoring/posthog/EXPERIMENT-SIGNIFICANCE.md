# Experiment significance traps

Group C of the experiment health check: results that flip, A/A tests that come out significant, win probabilities read as effect sizes, and "target reached" read as "done". Most of these are decided by the statistics settings (method, confidence level, sequential testing, CUPED, baseline variant) and by the share of the planned sample collected so far, so read both before any result. The workflow and snapshot are [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md); the formulas and settings are [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md).

**Contents:** [C1 Peeking](#c1-peeking-high) · [C2 Low volume and validity gates](#c2-low-volume-and-validity-gates) · [C3 A/A significant](#c3-aa-significant-medium) · [C4 Multiple comparisons](#c4-multiple-comparisons-high) · [C5 Bayesian traps](#c5-bayesian-traps-high) · [C6 Frequentist](#c6-frequentist-high) · [C7 Overlapping intervals](#c7-overlapping-intervals-medium) · [C8 Shipping an inconclusive result](#c8-shipping-an-inconclusive-result-medium) · [C9 The "significance reached" notification](#c9-the-significance-reached-notification-high) · [C10 The end-experiment modal](#c10-the-end-experiment-modal-high) · [C11 An external calculator disagrees](#c11-an-external-calculator-disagrees-medium) · [C12 "Target reached"](#c12-target-reached) · [C13 Settings that change results](#c13-settings-that-change-results-high) · [Prove it](#prove-it)

## C1 Peeking [HIGH]

- **Watching live and ending when significant inflates false positives.** Exception: Frequentist with sequential testing keeps the false-positive rate at the chosen level however often it is read. Bayesian has no sequential mode.
- **Evidence:** age from `start_date`; the sample = exposed total across all variants against `running_time_calculation.recommended_sample_size` (a total, not per variant).
- **`running_time_calculation.recommended_running_time` on a launched experiment** is the days still missing at the current exposure rate, as of the last time someone opened the experiment; 0 once the target is reached; not the planned length. Three cases hold the whole estimated length instead: `exposure_estimate_config.conversionRateInputType` is `manual`; a value written at creation that no page load replaced; a value saved by a page load in the first day of the run or before 100 exposures, not replaced since. Judge progress by the sample, not this number.
- **MUST state age and share of the target sample before any reading of a result** when below target and sequential testing is off. One day in, the honest first sentence is that the result is not readable yet. No target: state age and exposures per variant and say no target was set.
- **MUST NOT withhold numbers or refuse:** give the current estimate labeled early and say when it becomes readable. The 50-exposure floor is where analysis starts, not where it becomes stable.
- **Recommend:** predetermine the duration before launch (the running-time calculator), or turn on sequential testing before launch. Frequentist α=0.05 by default is about a 5% false-positive chance per metric; 0.05 is a convention, not a hard cliff.
- **Read a p-value as the ASA statement does** [coreyhaines31/marketingskills, ab-testing; [amstat.org](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf)]: the probability, assuming the null model and its assumptions, of a result at least as extreme as the one observed; "not the probability that the result is random, that the null is true, or that a variant will win again." p = 0.04 is never "a 96% chance the change works"; a 95% confidence interval is not a 95% posterior probability.

## C2 Low volume and validity gates

- **[MEDIUM] A roughly 2-to-1 skew at a few dozen exposures can be chance:** 30 vs 16 gives p ≈ 0.04, far from the 0.001 the product flags. Rule of thumb: under a thousand per variant the visible split can swing widely. Whether a split is a real mismatch is the sample ratio test's call (A2, [EXPERIMENT-BIAS.md](EXPERIMENT-BIAS.md)).
- **[HIGH] No result, and the metric reads "Not enough data yet", until:**
  - at least **50 exposures** per variant;
  - funnel or retention: at least **5 conversions** per variant;
  - ratio: denominator not zero;
  - the baseline variant's total not zero.
- **Bayesian funnels additionally need at least 5 converted AND 5 not converted per variant,** so near-100% conversion reports nothing. The same check applies to a Bayesian mean metric with a `threshold`, not to a CUPED-adjusted funnel.
- **Stored results name the failed gate in `validation_failures`.** Checks that give no result AND leave `validation_failures` empty: the Bayesian 5-and-5 check, a baseline mean below zero under Bayesian, a metric whose values don't vary.
- **Recommend:** wait, run longer, or increase rollout.
- Code: `validate_variant_result` in products/experiments/backend/hogql_queries/utils.py; `_validate_normal_approximation` in products/experiments/stats/bayesian/tests.py.

## C3 A/A significant [MEDIUM]

Walk this checklist:

1. **Chance** (the C4 rates); reading early and often adds to it (C1).
2. **Is exposure the same for both arms?** A server-side exposure before render, or one path that sends exposure more reliably; even counts don't rule it out (A9).
3. **Uneven split plus `exclude`** drops multi-variant people from the smaller arm in a larger share (A1); an even split drops them alike.
4. **Implementation:** a large multiple-fold gap between equal-sized variants is extremely unlikely to be random. A known shape: a data-warehouse metric joining per-user exposures to a per-group warehouse table (`ExperimentDataWarehouseNode` with `events_join_key: $group_<n>` on the exposure side and `data_warehouse_join_key` on a group-keyed table). Each user gets all rows of their group, so a `sum` over-counts in proportion to users per group. Detect it in `experiment-get`: a warehouse source with a group join key on a person-aggregated experiment. Sanity check: re-aggregate the warehouse table by org or group once (deduped) against the per-user sum.
5. **A legacy experiment shows no results** (E13); migrate first.

## C4 Multiple comparisons [HIGH]

- **PostHog does NOT correct for multiple comparisons,** across variants (each is compared with the baseline independently) or across metrics.
- **Frequentist α=0.05:** 5 independent metrics give about a 23% chance of at least one false positive; 10 give about 40%.
- **Other tools differ:** Optimizely's Stats Engine controls the false discovery rate with a tiered Benjamini-Hochberg procedure ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/false-discovery-rate-control)); with PostHog, apply Bonferroni by hand or keep the metric set small ([ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md#multiple-variants)).
- **Bayesian:** significant when the chance to win is above the confidence level OR below 1 minus the level; at 95% that is two 5% tails, so about 1 in 10 comparisons comes out significant when nothing changed, and at least one among 5 metrics about 40% of the time.
- **Recommend:** a small, planned, hypothesis-driven metric set; read the results as a pattern; guardrails as secondary metrics; an unexpected significant metric is a hypothesis for a follow-up with it as primary. Metrics added after seeing data are p-hacking.

## C5 Bayesian traps [HIGH]

- **PostHog defaults to Bayesian** unless the project default says otherwise.
- **"96% chance to win" is about direction, not magnitude;** read the credible interval.
- **The threshold is the confidence level:** 96% is significant at 90% and 95%, not at 99%. At 95%, a chance below 5% is a significant loss.
- **`goal: "decrease"` metrics:** the page shows 1 minus the stored value; the stored `chance_to_win` is not inverted (stored below 5% = a significant win).
- **"Significant, but the interval crosses zero":** chance to win is one-sided and the interval two-sided, so at 95% a chance between 95% and 97.5% is significant while the 95% interval includes zero. That is borderline.
- **The page's tooltips state the Frequentist rule** (significant when the interval doesn't cross 0%) on both the interval column and "How to read"; under Bayesian, the "Significant" column and the "Won"/"Lost" tag follow chance to win.
- **Don't ship when chance to win first flips green.**
- **Flat (non-informative) priors.** The displayed effect is relative: 10% vs 12% reads +20%.
- **Legacy (`is_legacy`) shows no results;** migrate with `experiment-migrate`.
- Code: `is_decisive` in products/experiments/stats/bayesian/tests.py; `credible_interval` in products/experiments/stats/bayesian/utils.py.

## C6 Frequentist [HIGH]

- **Set in `stats_config.method`.** A confidence interval that doesn't cross 0 is significant; one that crosses 0 is not.
- **Default test: Welch's t-test** (handles unequal variance); the sequential test replaces it when on. α=0.05 by default.
- **Confidence levels: 90%, 95%, 99%.** The project default `default_experiment_confidence_level` is copied into a new experiment at creation as `stats_config.frequentist.alpha` and `stats_config.bayesian.ci_level`; later default changes don't move existing experiments.
- **The interval column title reads "Credible interval (95%)" / "Confidence interval (95%)" at every level** and "How to read" says 95% too, but the interval is computed at the experiment's level. A p-value of 0.07 reported "significant" is likely the 90% setting.

## C7 Overlapping intervals [MEDIUM]

- **Overlapping intervals don't imply non-significance under either method.** The page draws one interval per test variant: its difference from the baseline.
- **Frequentist:** that interval decides. **Bayesian:** significance comes from win probability, and the interval can cross 0.
- **p-values don't apply in Bayesian;** redirect to win probability plus the credible interval.
- **The method is per experiment,** with the project default taken at creation: read `stats_config.method`, don't assume Bayesian.

## C8 Shipping an inconclusive result [MEDIUM]

- **Ship an inconclusive result only when all hold:** a clear primary improvement with no guardrail regression; strong qualitative conviction (replays, feedback, intuition); a low cost of being wrong (easy rollback through the flag).
- **Don't ship on a sustained regression in the timeseries.** Pull it with `experiment-timeseries-results`, passing the metric's `uuid` and `fingerprint` from `experiment-get` (a shared metric carries both in `saved_metrics[].query`). Look for a single day carrying the whole effect.
- **For the qualitative part,** analyze session replays ([EXPERIMENT-REPLAYS.md](EXPERIMENT-REPLAYS.md)).

## C9 The "significance reached" notification [HIGH]

- **It can fire well before the result is stable;** the verdict can revert and NO notification is sent when it does.
- **Opt-in destination on the experiment's Settings tab.** Sent from the scheduled calculation each time a variant turns from not significant to significant against the previous calculation; re-announced if it reverts and returns.
- **Its only gates are the C2 validity gates:** no minimum days, no planned-sample check. The scheduled calculation covers only `running` experiments that started in the last **60 days** with no legacy metric.
- **Before acting, check:** participants per variant (gate 50, and 5 conversions for funnel or retention; aim for the running-time target); days running (for high-stakes ships wait at least a full week: a working norm, not product-enforced); the pre-planned duration (no planned end date is stored: compare the exposed total with the target, or ask); variant balance and the `$multiple` share; secondary metrics (C10).

## C10 The end-experiment modal [HIGH]

- **The "Variant to keep" selector opens empty:** ending rolls out nothing unless a variant is picked. Nothing in the modal reads results (no significance, primary direction or guardrail check).
- **The "End experiment" button is gated on choosing a conclusion** (won / lost / inconclusive / stopped early / invalid), not on the variant selector. The modal keeps a picked variant while the page stays open.
- **Release mode radios:** **Roll out to the experiment population** (default, recommended): the distribution flips to 100/0 for the chosen variant, existing release conditions and per-user overrides preserved. **Roll out to all users:** prepends a catch-all release condition that overrides release conditions and per-user overrides.
- **Recommend:** review every metric (the product names no winner; "Won"/"Lost" are per metric); explicitly choose the variant, or leave it empty to end without shipping; confirm the release mode; flag a non-default selection. A guardrail trending negative or a non-significant primary means keep control.
- Code: `FinishExperimentModal` in frontend/src/scenes/experiments/ExperimentView/ExperimentModals.tsx.

## C11 An external calculator disagrees [MEDIUM]

1. **Methodology:** PostHog is Bayesian by default; most calculators are Frequentist.
2. **Inputs:** page numbers are post-scope (`$multiple` excluded, test accounts filtered, exposure-bounded date range, per-user aggregation for means, conversion window).
3. **Adjustments:** outlier handling, CUPED, sequential testing. No calculator run on raw counts reproduces them.

## C12 "Target reached"

- **[HIGH behavior] The duration display next to the status** reads "~N days left" below target and "Target reached" at or above it; older versions read "Complete". On an ended experiment "Complete" is the status tag and the duration display is hidden: read `status` first.
- **The target is the sample needed to detect the minimum detectable effect with about 80% power at 95% confidence,** using the first primary metric only. The MDE is the project default, **30%** where none is set, which a busy surface reaches within days. It doesn't end the experiment.
- **Fields:** `recommended_sample_size` (a total); `recommended_running_time` (days missing, 0 at target; months or years = the target is out of reach); `exposure_estimate_config.conversionRateInputType` (`manual` = the user typed the baseline and daily exposures: the whole length, not updated); `minimum_detectable_effect` (absent = the project default; `experiment-setup-context` returns `team_defaults`). Automatic mode re-estimates and saves whenever someone opens a launched experiment's page.
- **[MEDIUM] Recommend:** half the effect needs four times the sample (inverse square); rule of thumb, sample per variant ≈ 16 × variance / (absolute effect)², with conversion-rate variance p × (1 − p). If the decision metric isn't the first primary metric, the estimate is for the wrong metric.
- Code: ExperimentRemainingTime.tsx in products/experiments/frontend/components/ExperimentMetaBar; runningTimeLogic.ts in frontend/src/scenes/experiments/RunningTimeCalculator.

## C13 Settings that change results [HIGH]

- **Fallbacks:** sequential testing and CUPED fall back to the project default; the baseline falls back to `control`. A missing `method` is Bayesian, a missing level 95% (project defaults are copied at creation). A setting changed on the page recalculates the whole run (D8).
- **Sequential testing** (`stats_config.frequentist.sequential_testing_enabled`, Frequentist only): the p-value and interval stay valid however often they are read; the interval is wider; the extra width is smallest when the two arms together hold about `sequential_tuning_parameter` (default **5,000**, or the project default). [MEDIUM] A p-value of exactly 1.000 is normal: it stays 1 until evidence crosses a threshold. p = 1.000 on a Frequentist metric signals sequential testing; p < 1 doesn't rule it out.
- **CUPED** (`stats_config.cuped.enabled`): adjusts metric values using pre-exposure behavior; doesn't change who's in or which events count; no raw query reproduces it. Applies to mean metrics and ordered funnels; never to ratio or retention, nor to a mean with `threshold`, a mean on a session property (e.g. `$session_duration`), or a funnel with a data-warehouse step. Look-back window **14 days** by default.
- **Baseline** (`stats_config.baseline_variant_key`): `control`, or the flag's first variant if there is no `control`; changing it recalculates everything. "Control shows a lift" or "all signs flipped" is this setting.
- Code: `_resolve_sequential_settings` in products/experiments/backend/hogql_queries/utils.py; products/experiments/backend/hogql_queries/cuped_config.py; `get_baseline_variant_key` in products/experiments/backend/hogql_queries/__init__.py.

## Prove it

- Every reading of a result opens with the experiment's age and its exposed total against `recommended_sample_size`, and labels a below-target number as early.
- The reply names the method, confidence level, sequential testing, CUPED and baseline read from `stats_config` (or the project default it fell back to).
- A "significant" call under Bayesian quotes the chance to win against the confidence level and the credible interval; under Frequentist, the interval against 0.
- Variants with fewer than 50 exposures, or funnels below 5 conversions, are reported as having no result, with the `validation_failures` value when there is one.
- A ship recommendation lists every metric, including secondaries, and the release mode the user confirmed.
