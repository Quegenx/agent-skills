# Mid-run experiment changes

Group E of the experiment health check: the split, rollout, metrics or exposure criteria changed during the run; the experiment was paused, frozen, reset, ended or shipped; retention or matured-user counts look off; a legacy experiment. Pausing, freezing, unfreezing and resuming all change who gets the variant or when, while the analysis treats the run as one continuous window: say so whenever the history shows one (E9, E16). Find the change first in `experiment-activity` (flag entries appear only with flag access). The workflow is [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md); the lifecycle actions themselves are [EXPERIMENTS.md](EXPERIMENTS.md#lifecycle).

**Contents:** [E1 Increasing rollout](#e1-increasing-rollout-high) · [E2 Decreasing rollout](#e2-decreasing-rollout-medium) · [E3 Changing the variant split](#e3-changing-the-variant-split-high) · [E4 Blocked changes](#e4-blocked-changes-high) · [E5 Changing exposure criteria](#e5-changing-exposure-criteria-high) · [E6 Adding metrics mid-run](#e6-adding-metrics-mid-run-medium) · [E7 Ending vs shipping](#e7-ending-vs-shipping-high) · [E8 Reset](#e8-reset-high) · [E9 Pause](#e9-pause-high) · [E10 Retention start events](#e10-retention-start-events-high) · [E11 Completed windows only](#e11-completed-windows-only-high) · [E12 Short-term vs long-term metrics](#e12-short-term-vs-long-term-metrics-medium) · [E13 Legacy experiments](#e13-legacy-experiments-high) · [E14 Flag cleanup](#e14-flag-cleanup-high) · [E15 Restart with new variants](#e15-restart-with-new-variants-medium) · [E16 Freeze](#e16-freeze-high) · [E17 Start date changed](#e17-start-date-changed-medium) · [Unresolved source contracts](#unresolved-source-contracts) · [Prove it](#prove-it)

## E1 Increasing rollout [HIGH]

- **Increasing the rollout of an existing release condition switches no one;** it is generally the only safe change on a running experiment. Adding a release condition, or one that pins a variant, is a different edit (A6, A7 in [EXPERIMENT-BIAS.md](EXPERIMENT-BIAS.md)).
- **Exception, first matching condition decides:** raising an earlier condition when a later one pins a variant moves newly included people from the pinned variant to the hashed one.
- **A rollout raised after a small internal launch** leaves the early (internal) people in the results: reset the analysis after the raise.

## E2 Decreasing rollout [MEDIUM]

- **Users outside the new rollout switch back to the default** (visible UX disruption). The flag returns `false` (no variant, not a second variant), unless a later release condition matches (it serves the same hashed variant or the pinned one). With `early_exit` on in the flag's `filters`, a person outside the rollout of a matching condition gets `false` at once.
- **Prior exposures stay counted;** readings after the rollback mix behaviors.
- **To contain the blast radius,** ship the control variant (E7). Ending alone fixes results at the end date but leaves the flag serving every variant; a pause stops serving every variant without closing the analysis. If shrinking while the experiment stays alive, discount readings from the rollback window on.

## E3 Changing the variant split [HIGH]

- **An anti-pattern:** it moves bucket boundaries, so returning reassigned users become `$multiple` (excluded or first-seen), which biases. The product allows it with only a warning. The SRM test then compares the whole run against the new split.
- **Recommend:** reset if early; end and start a new one if there is significant data. Moving the start date to the change is the smaller step (E17); no tool changes the start date, the user does it on the experiment page.
- **Not an anti-pattern, the documented rollout:** an exposure-criteria filter `timestamp < '<cutoff>'` closes the analysis to people exposed after the cutoff, and a later flag change rolling a variant out doesn't touch the analyzed population (metric events still count until the end date or the window closes; results past the rollout mix in the rolled-out experience). Read `exposure_criteria.exposure_config.properties` before calling a split change contamination.
- **The launch split isn't what the user thinks?** In `experiment-activity` or `feature-flags-activity-retrieve { id: <feature_flag_id> }` (newest first, paged with `limit`, `page`), read `multivariate.variants` in the `after` of the last `filters` change before `start_date`. None before: the flag launched with its creation split (the creation entry carries no values; read the `before` of the first `filters` change after `start_date`, or the current flag if it never changed).
- **Fix:** reset and relaunch (young) or end and relaunch (significant data); set the intended split before clicking launch.

## E4 Blocked changes [HIGH]

- **On a launched experiment,** the experiment rejects changing the number or keys of variants, and the flag rejects removing or renaming a variant key while a linked experiment runs. Not blocked: adding a variant on the flag, and changing percentages (E3).
- **The analysis reads variant keys from the flag now:** exposures under a removed key leave; a person seen under a removed and a remaining key counts under the remaining one.
- **`excluded_variants`:** the arms are still served but left out of results and SRM. This is the supported way to stop analyzing an arm.
- **Recommend:** treat the post-change window as contaminated; reset (E8) and relaunch, or end and start a new experiment with a fresh flag (E15).

## E5 Changing exposure criteria [HIGH]

- **Changing exposure criteria mid-run** (swapping the exposure event, multivariate handling, a new filter, the test-account toggle) changes which events count.
- **`exclude` to `first_seen` mid-run is the low-disruption mitigation** of uneven-split exclusion bias: no switching, all data stays.
- **Other changes re-process historical exposures:** numbers shift without any behavior change. Warn the user.
- **An unmatchable filter empties the experiment** (B12). An identifier migration re-buckets (A8); exposure-criteria edits don't.

## E6 Adding metrics mid-run [MEDIUM]

- **Adding metrics mid-run to hunt for significance is p-hacking;** swapping the primary after reading results is the same.
- **Retroactive addition is technically supported:** the metric is calculated for the full duration.
- **Editing a shared metric changes it in every experiment,** finished ones included (D13).

## E7 Ending vs shipping [HIGH]

- **Ending sets the end date and leaves the flag untouched:** every variant is still served and exposures keep arriving.
- **Shipping rewrites the flag distribution:** the chosen variant at 100%, the others at 0%.

| Mode | Effect |
|---|---|
| **Roll out to the experiment population** (default) | Release conditions preserved, per-user overrides apply, no catch-all. A condition with rollout below 100% keeps its rollout: "We shipped the variant and some users still don't see it" is this. Pinned conditions and the holdout keep their people off. |
| **Roll out to all users** | Prepends a catch-all release condition with the literal description _"Added automatically when the experiment was ended to keep only one variant."_, overriding conditions and per-user overrides. Holdout people keep `holdout-<id>` (the holdout is evaluated first); on an early access feature flag, opted-in or opted-out people keep that answer without a variant. |

- **Both modes flip the split** (e.g. to 0/100); the catch-all is the discriminator.
- **A ship removes an exposure freeze, keeps a holdout, and never switches the flag on:** on a paused experiment the flag stays off and nobody gets the variant. A ship ends the experiment, so Resume is no longer offered: switch the flag on from its own page.
- **A flipped distribution is most likely a ship;** a metric edit or an end without a variant doesn't touch the flag.
- **Verify:** a newer ship has a `variant_shipped` entry naming the variant; older ones have none, and the flag `filters` change putting one variant at 100% is the evidence. An end with a variant picked in the End modal is a ship (C10 in [EXPERIMENT-SIGNIFICANCE.md](EXPERIMENT-SIGNIFICANCE.md)).
- **Signature:** `multivariate.variants[]` going from 50/50 to 0/100. A first `after.groups[]` entry with empty `properties`, rollout 100 and that description is an "all users" ship; without it, "experiment population" (release groups unchanged, except on a frozen flag, where both modes remove the snapshot cohort condition from every group).
- **MCP:** `experiment-ship-variant` takes `release_to_everyone: bool` (default `false` = experiment population). Confirm the release mode and variant key with the user first. Default to control on an ambiguous ship (a control rollout is a no-op); discourage "all users" when uncertain.
- Code: `_roll_out_variant` in products/feature_flags/backend/facade/api.py; `ExperimentService.ship_variant`, `end_experiment` in products/experiments/backend/experiment_service.py.

## E8 Reset [HIGH]

- **"Reset analysis" returns the experiment to draft** and clears `start_date`, `end_date`, the conclusion with its comment, and `archived`. Events remain but apply only from the new `start_date`.
- **The flag is untouched** (users keep their variants), except that an exposure freeze is removed. A flag off at reset (paused) stays off until the relaunch switches it on.
- **[MEDIUM] After a relaunch on the same flag,** people keep their variant, and returning ones may send no new exposure (dedup, B3 in [EXPERIMENT-EXPOSURES.md](EXPERIMENT-EXPOSURES.md)).
- **Use it when bias is suspected:** reset, adjust, relaunch.

## E9 Pause [HIGH]

- **A pause sets the flag `active=false`:** users fall back to the app default (typically control), there are no new exposures, and `status` is `paused`. Resume reactivates it with the same variants, unless variants or release conditions were edited during the pause; a frozen experiment resumes frozen (`exposure_frozen`).
- **[MEDIUM] A pause biases.** The analysis has no notion of a pause: metric events during the pause count toward each person's first-exposure variant (with a conversion window, only for people whose window overlaps), so the test arm is diluted toward control by the pause length. Nothing warns.
- **Evidence:** experiment entries and flag `active` changes (older pauses show only the flag change).
- **Recommend:** state the pause dates; after a long pause, consider reset and relaunch.

## E10 Retention start events [HIGH]

- **Read `start_event` first.**
- **A custom start event (the default for a new metric)** must occur at or after the first exposure, and within the conversion window if one is set. `start_handling` (`FIRST_SEEN` vs `LAST_SEEN`) doesn't relax that; it only picks which post-exposure start anchors. Start events before exposure are dropped, and users with only pre-exposure starts are excluded from the denominator.
- **Exposure as start** (`start_event` of kind `ExperimentExposureNode`, "Experiment exposure" in the editor): counts from the first exposure, with every exposed person in the denominator (except under `only_count_matured_users`); `start_handling` and the conversion window don't apply.
- **The completion must be a different event from the start.** Retention windows in days or hours compare calendar days or hours; the editor offers only those two units; other units sent through the API compare exact timestamps.
- **Pre-anchored retention (a start before exposure) isn't supported;** track it in product analytics.
- **Undercount:** confirm there are post-exposure start events. Want every exposed person: use the exposure as start.
- Code: `build_retention_query`, `build_start_after_exposure_predicate`, `build_start_event_timestamp_expr` in experiment_retention_query_builder.py.

## E11 Completed windows only [HIGH]

- **`only_count_matured_users` ("Require completed conversion or retention window"):** each metric with a conversion window leaves out people whose window hasn't elapsed since their first exposure. Retention uses the end of the retention window from the start event (or from the first exposure when exposure is the start). Metrics without a window are unaffected. The project default sets it for new experiments.
- **It reduces the user count and improves comparability.** Check it when counts drop or differ between metrics.

## E12 Short-term vs long-term metrics [MEDIUM]

- **A short-term primary and a long-term secondary moving in opposite directions is normal.** Keep the short-term one primary.
- **To keep measuring the enrolled people,** freeze exposure (E16).
- **Use a holdout:** a share of people drawn by hash at every flag evaluation who get `holdout-<id>` and are outside the results; compare them with everyone else in an insight broken down by the flag value. For deeper analysis, breakdowns (D3) or session replays.
- **[MEDIUM] Holdouts under local evaluation:** a server SDK that evaluates locally and predates holdout support puts holdout people into regular variants. Evidence: a `holdout-<id>` share below the configured one, with the gap in one library. Fix: update the SDK.

## E13 Legacy experiments [HIGH]

- **`is_legacy: true`:** only name, description and end date are editable; results are no longer calculated; the UI shows a banner with a "Migrate experiment" button. On a launched one variant keys can't be edited: duplicate (E15) or reset (E8) and relaunch.
- **Legacy means a metric of kind `ExperimentFunnelsQuery` or `ExperimentTrendsQuery`** (not `ExperimentMetric`), inline or through a shared metric. Legacy results aren't readable through `experiment-results-get` (which is different from `data: null` on a non-legacy experiment).
- **Fix: `experiment-migrate`.** It creates a NEW experiment with the same config, metrics converted, on the same flag (no new rollout; people keep their variant); the legacy one stays. Tell the user about the second experiment first. `experiment-duplicate` rejects legacy experiments. The alternative: end with a documented conclusion.

## E14 Flag cleanup [HIGH]

- **Deleting the flag is blocked only while the experiment runs;** draft, stopped and archived don't block it, and the experiment keeps its results.
- **A deleted flag frees its key.** Restoring it reclaims the key, or gets a suffix (`my-flag-2`) if the key was taken, and the app code then reads another flag. A flag can't be unlinked.
- **[MEDIUM] Simplifying after the end:** variant keys are no longer protected, and removing a variant drops its results at the next calculation. On the flag overview the variants edit control stays disabled while linked: use the flag's edit form.
- **Archiving needs an ended experiment.** Deleting an experiment hides its results; deleting its flag doesn't; neither deletes events.
- **Restoring:** a deleted flag is restorable from its page. A deleted experiment: the delete confirmation offers undo, or an API update setting `deleted` to false once its flag is restored. There's no list of deleted experiments in the app, and `experiment-update` doesn't take `deleted`.
- **Recommend:** confirm the flag's future use. Still using it for rollout: ship the variant (E7). Done: keep the flag until the calling code is removed.

## E15 Restart with new variants [MEDIUM]

1. End the experiment.
2. Duplicate it (`experiment-duplicate`) or create a new one. A duplicate is a new draft with metrics and settings, without the holdout and excluded variants.
3. Give it a NEW feature flag key. A duplicate without a new key shares the flag, so a ship or pause affects both.
4. Launch.

- **Why a new key:** the same key means the same draw for returning people; dedup may suppress re-exposure (B3); changed variants on the old flag move people (E3). The same points explain a follow-up run disagreeing on the same flag (the runs aren't independent).
- **Reuse the same flag only if the user explicitly wants comparable historical bucketing.**

## E16 Freeze [HIGH]

- **A freeze stops enrollment and keeps measuring.** PostHog saves the people exposed so far as a static cohort and narrows every release condition to it; split and end date are untouched; `status` is `exposure_frozen`, with no banner. New people get no variant; enrolled people keep their variant and metric events; the cumulative series goes flat (intended).
- **Bias and breakage:**
  - People exposed just before the freeze can miss the cohort (counted, then no variant).
  - Local evaluation can't evaluate a static cohort, so a server SDK falls back to a remote call; [MEDIUM] one set to evaluate only locally serves the flag's default to everyone, enrolled people included.
  - Release conditions edited after the freeze: a later variant override on the frozen condition keeps the cohort; a new condition without the cohort reopens enrollment, and `status` reads `running`.
  - Ending without shipping leaves the flag narrowed (a ship or reset removes the freeze).
  - Unfreezing reopens enrollment, and mixing the groups can bias. The unfreeze dialog is the one place the product warns about bias; the End dialog of a frozen experiment warns only that the flag stays narrowed.
- **Freeze is refused for:** draft, ended or paused experiments; already frozen; a missing or deleted flag, or a flag without release conditions; group-aggregated; holdout or early-access conditions in the older format (`super_groups` in the flag `filters`); too many exposed people to save in one step; more than a small share of exposed people without a person profile (this rules out logged-out traffic); no exposures yet.
- **Evidence:** `status`; freeze and unfreeze in `experiment-activity` (a flag release-condition change adding or removing the cohort; newer named entries `exposure_frozen`, `exposure_unfrozen`); later release-condition changes; local evaluation.
- **Recommend:** a plateau on a frozen experiment needs no fix; state the freeze and unfreeze dates; before an unfreeze, say the groups will mix (there's no need to unfreeze to check frozen results). Freezing is fragile with many conditions or overrides.
- Docs: https://posthog.com/docs/experiments/managing-lifecycle#freezing-exposure. Code: `freeze_exposure`, `unfreeze_exposure` in experiment_service.py; `freeze_exposure_blocker`, `status_label` in products/experiments/backend/models/experiment.py.

## E17 Start date changed [MEDIUM]

- **The analysis runs from `start_date` on.** Moved later: people with all their exposures before it leave; a person exposed before and after counts from their first exposure inside the window, and earlier metric events no longer count. Moved earlier: pre-launch exposures enter (internal testing, another split or audience).
- **Insights ignore the start date,** so they disagree.
- **Evidence:** `start_date` changes in `experiment-activity`; a start date before the current split or audience.
- **Recommend:** moving it to just after a fix legitimately cuts a contaminated beginning (say what was cut); the user does it on the page, since no tool changes the start date. Moving it back brings in whatever the flag did then: check the flag history. Repeated edits: reset and relaunch.

## Unresolved source contracts

- **Retention event roles:** this reference says completion must use a different event; [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md) permits repeat retention with the same event name while excluding the same occurrence. The fetched experiment metrics prose does not settle this implementation detail. Keep both source views until the experiment runner is checked. [PostHog skills, EXPERIMENT-CHANGES.md; EXPERIMENT-METRICS.md]

## Prove it

- The change behind the symptom is quoted from `experiment-activity` or `feature-flags-activity-retrieve` with its date and before/after values, or the history was read back to launch and shows none.
- Pause, freeze and unfreeze dates are stated in the reply whenever the history shows them.
- For a ship, the reply names the mode (catch-all present or not) and the variant, and the user confirmed both before `experiment-ship-variant`.
- A restart uses a new feature flag key.
- Before a migrate, the user was told it creates a second experiment.
