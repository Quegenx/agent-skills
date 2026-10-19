# Experiments

A PostHog experiment is a multivariate feature flag plus an analysis: the flag hashes each person (or device, or group) into a variant, the SDK records an exposure when the flag is read, and PostHog computes per-variant metrics from events after each person's first exposure. Most outcomes are decided before launch: who reaches the flag check (only eligible users should), how the flag splits and buckets people (equal split, the right identifier, nothing edited after launch), and whether the duration was fixed in advance. This file covers planning, finding, creating, rollout and the lifecycle. Metrics, sample size and statistics are [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md); a result that looks wrong, biased or empty is [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md). Flags themselves are [FEATURE-FLAGS.md](FEATURE-FLAGS.md); SQL is [HOGQL.md](HOGQL.md).

**Contents:** [Plan the experiment](#plan-the-experiment) · [MCP tools](#mcp-tools) · [Find an experiment](#find-an-experiment) · [Create an experiment](#create-an-experiment) · [Setup decisions from the project's facts](#setup-decisions-from-the-projects-facts) · [Rollout and split](#rollout-and-split) · [Bucketing and persistence across login](#bucketing-and-persistence-across-login) · [Changing distribution after launch](#changing-distribution-after-launch) · [Lifecycle](#lifecycle) · [Prove it](#prove-it)

## Plan the experiment

- **Write a clear hypothesis with a goal metric.** Example: an onboarding tutorial video, with reduced churn as the primary goal. [coreyhaines31/marketingskills, ab-testing] gives a five-line template ("Because [observation/data], we believe [change] will cause [expected outcome] for [audience]. We'll know this is true when [metrics].") and a full test plan: [ab-testing TEMPLATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/TEMPLATES.md).
- **Marketing tests built on flags** [coreyhaines31/marketingskills]: cancel-flow tests split users into flows with flags server-side and track survey, offer, accept or decline, confirm as a funnel ([churn-prevention HEALTH-SCORE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/HEALTH-SCORE.md#testing-the-cancel-flow)); a headline screened in ads is only a candidate until a fresh randomized page test with a predefined metric, guardrails, sample size and stopping rule confirms it, and "There is no guaranteed minimum conversion lift" ([paid-ads CAMPAIGN-PLANNING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/CAMPAIGN-PLANNING.md#landing-page-continuity)).
- **Only include affected users.** Filter ineligible users in code BEFORE checking the flag; checking the flag first enrolls unaffected users.

```javascript
// Correct. Will exclude unaffected users
function showNewChanges(user) {
  if (user.hasCompletedAction) {
    return false;
  }

  // other checks

  if (posthog.getFeatureFlag("experiment-key") === "control") {
    return false;
  }

  return true;
}
```

- **Change as small a thing as reasonably possible,** but not so small it can't move behavior.
- **Test with a small rollout first** (e.g. 5% for a few days): a broken full launch can't be cleanly restarted. Check logging, no crash increase, replays and the expected split.
- **Predetermine the duration to avoid the peeking problem** (deciding on intermediate significance). Use the running time calculator, or enable sequential testing (always-valid p-values bounded by alpha); still plan the sample size. Details in [EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md).
- **Counter metrics, not just a goal.** The official docs use "counter metrics" and "secondary metrics ... ensure your experiment didn't have negative side effects"; the PostHog agent skills call the same role "guardrails" (e.g. error rates as secondary metrics).

Launch checklist:

| When | Check |
|---|---|
| Before launch | Goal metric, hypothesis, secondary metrics, counter metrics, a predefined duration from the sample size, code includes only eligible users, QA of both variants |
| 24 to 48 hours after | Variant volumes as expected, logging in the correct ratios, no crash or error increase |
| At the end | Validate the hypothesis, document and share, deploy the winner and delete the losing variant's code |

## MCP tools

All from the PostHog MCP server.

| Tool | Does |
|---|---|
| `experiment-list` | Experiments with id, name, status, feature_flag_key, start_date, end_date, created_at; newest first by default; `search` is a case-insensitive substring match on name and flag key |
| `experiment-get` | The full object (metrics, flag details, parameters), including `resolved_exposure_event` |
| `experiment-get-by-flag-key` | The full experiment, or `found: false` with a `reason`: `no_flag` / `no_experiment` (the key is free; run this before `experiment-create`), `ambiguous` (several experiments share the flag and none is the single live one; shows `candidates`; pick with `experiment-get` rather than creating another) |
| `experiment-create`, `experiment-update` | Create and edit |
| `experiment-launch`, `experiment-pause`, `experiment-resume`, `experiment-freeze-exposure`, `experiment-unfreeze-exposure`, `experiment-end`, `experiment-ship-variant`, `experiment-archive`, `experiment-reset`, `experiment-duplicate`, `experiment-copy-to-project`, `experiment-migrate`, `experiment-cleanup-task` | Lifecycle, below |
| `experiment-setup-context` | Optional project facts for setup. "If the tool is not available, continue without it and treat every choice below as a best guess. Never call a tool you can't see." |
| `experiment-calculate-running-time` | Running-time estimate |
| `experiment-saved-metrics-list` (`?event=`, `search`, `limit`/`offset`), `experiment-saved-metrics-retrieve`, `experiment-saved-metrics-create` | Shared metrics |
| `experiment-timeseries-results` | Takes `metric_uuid` and `fingerprint` from the experiment's metrics array; call `experiment-get` first |
| `read-data-schema` | Events; `event_property_values` returns a sample of values |
| `create-feature-flag` | Used only for the device-id bucketing recipe |

- **Never use `feature-flag-get-all` or any feature flag tool to find experiments.** Use `experiment-list`.

## Find an experiment

- **Users name experiments by name, description or relative reference, not ID.** Match by `name`, recency (newest first), `status` (`draft`, `running`, `paused`, `exposure_frozen`, `stopped`), exact flag key (`experiment-get-by-flag-key`) or partial flag key (`experiment-list` with `search`).
- **Exactly one match:** use it, and confirm by name before destructive actions (delete, ship, end). **Several:** list them with name, status and creation date and ask. **None:** say so; suggest archived experiments or different terms.
- **Don't search when you already have the ID** (from earlier in the conversation, the create response, or the user).
- **Rollout changes, metric changes and every lifecycle action need an ID;** resolve it here first.

```text
User: "pause my signup experiment"

Agent:
1. Calls experiment-list
2. Scans results, finds "New signup process" (ID: 1371, status: running)
3. Proceeds to pause experiment 1371
```

## Create an experiment

### Principles

- **Draft first, then iterate.** Choose settings from the project's facts rather than asking, and say which choices are guesses. Bucketing is the exception: ask before creating.
- **Ask only when a choice is "not decided" and the user is in the conversation.** If the user is away or asked for a draft without questions, decide with defaults and list the open points.
- **Launch only when the user asks.** "A launch turns the feature flag on for real users, so never call `experiment-launch` unprompted."

### Step 0: read the project

- **Infer the target and a candidate metric event,** usually `$pageview` for a page, and confirm both with `read-data-schema`. "Don't ask the user for event names you can find."
- **For a page, read `event_property_values` for `$host` and `$pathname`.** It is a sample, not the full list: read it for shape (trailing slash, `www.` prefix, casing), not as proof a value is absent. `/pricing` matches nothing where every pageview says `/pricing/`; `example.com` matches nothing where the host is `www.example.com`.
- **Call `experiment-setup-context` once** with `target_event` and `metric_event`. For web add `target_properties` with the exact `$host`, plus the exact `$pathname` for one page. Add `metric_properties` when the metric counts only some occurrences. Pass `previous_experiments_limit: 5` (the default 10 roughly doubles the response for no more signal).
- **`target_url_contains` is a substring match on `$current_url`.** A bare domain matches any host containing it (`notexample.com` included) and a homepage path matches every page under it; both overstate traffic and exposure rate. For multi-page surfaces keep the exact `$host` and put only the path fragment in `target_url_contains`.
- **Each filter needs `type` (`event` or `person`), `key`, `operator`, `value`.** The call rejects the `flag_evaluates_to` operator with a 400 that names it.

```json
{
  "target_event": "$pageview",
  "target_properties": [
    { "key": "$host", "type": "event", "operator": "exact", "value": ["www.example.com"] },
    { "key": "$pathname", "type": "event", "operator": "exact", "value": ["/"] }
  ],
  "metric_event": "your_conversion_event",
  "previous_experiments_limit": 5
}
```

### Steps 1 to 3

1. **Name, hypothesis (in `description`), flag key (kebab-case) and type.** The flag is created automatically: "do NOT create one separately", except for device-id bucketing. Leave type empty (defaults to `"product"`); `"web"` is reserved for no-code toolbar experiments, can't be driven over MCP, so point the user to the PostHog UI.
2. **Rollout:** read [Rollout and split](#rollout-and-split) before any rollout question. Defaults: 50/50 control/test, 100% rollout.
3. **"Do NOT configure metrics on creation."** Add them afterwards with `experiment-update` ([EXPERIMENT-METRICS.md](EXPERIMENT-METRICS.md)). Infer the primary metric from the hypothesis if the user gave none, and say it was inferred. Pass the running-time estimate as `running_time_calculation`.

```json
{
  "name": "Descriptive experiment name",
  "feature_flag_key": "kebab-case-key",
  "description": "Hypothesis: [what you expect to happen]",
  "feature_flag": {
    "filters": {
      "multivariate": {
        "variants": [
          { "key": "control", "name": "Control", "rollout_percentage": 50 },
          { "key": "test", "name": "Test", "rollout_percentage": 50 }
        ]
      },
      "groups": [{ "properties": [], "rollout_percentage": 100 }]
    }
  }
}
```

- **Flag config goes in `feature_flag`, in the flag's own filters shape,** "not the deprecated `parameters` keys".
- **Two percentages, "do NOT mix them up":** `filters.multivariate.variants[].rollout_percentage` is the split inside the experiment (must sum to 100); `filters.groups[0].rollout_percentage` is the overall gate (0 to 100, default 100).
- **An existing flag can back an experiment** when it is multivariate with 2 to 20 variants and not linked to another active experiment.
- **2 to 20 variants, no required key names.** The baseline is the variant keyed `"control"` when present, else the first; override with `stats_config.baseline_variant_key`.
- **Leave `stats_config` out** so the experiment follows team defaults (`stats_method`, `confidence_level`, CUPED, sequential testing); set it only if the user asks.

### After creation

- **Report in three groups:** "Set with confidence", "Best guess, please check", "Not decided"; also say what you could not read (a missing tool, a section whose status was not `ok`).
- **Always show `_posthogUrl`** from the create response.
- **Remind the user to implement the flag in code;** the experiment detail page shows implementation snippets per SDK.

## Setup decisions from the project's facts

`experiment-setup-context` returns sections shaped `{status, data}`; write dotted paths from the section name (e.g. `previous_experiments.summary.using_custom_exposure`). A section whose status is not `ok` gives no facts, and choices that depend on it drop to best guess at most.

| Tier | Meaning |
|---|---|
| Confident | The facts decide |
| Best guess | The facts support it but don't prove it; say what would change it |
| Not decided | Say what's missing |

### Bucketing (always not decided)

- **Facts:** `target_surface.anonymous_share` (null only if no target event carried `$is_identified`), `target_surface.device_id_share` (null when no target events), `target_surface.libs[]` (per SDK `anonymous_share`, `device_id_share`, `category` of `web|mobile|server|other`; at most 5 SDKs, `target_surface.libs_truncated` reports the cap), `sdk_profile.libs[]` (per SDK `device_id_share` and `locally_evaluated_share` on flag calls, whole project; empty when no multivariate flag calls in the last 7 days), `sdk_profile.libs_on_any_event[]` (set only when `sdk_profile.libs` is empty; names platforms only, don't decide bucketing from it).
- **The mix on a surface does not tell whether the same individuals cross identification,** so bucketing stays not decided.
- **Shares count events, never the flag request; read them one way only:** near 1 means a device ID is present; near 0 means unchecked, not unavailable (a server SDK can forward the browser device ID on the flag request while its own events carry no `$device_id`). "never rule device-id bucketing out from a share."
- **An SDK in `target_surface.libs` with no `sdk_profile.libs` row is unchecked.** "An unread server SDK is the one that breaks both options".
- **Say plainly when `previous_experiments.summary.using_persistence` and `using_device_id_bucketing` are both 0** (no in-house precedent), as context, not a fault.

### Where the flag is evaluated (not decided)

- **If `sdk_profile.evaluated_on_server_and_web` is true, or a server SDK sits next to `web`:** server and browser must use the same identity and flag value, otherwise one person gets two variants.
- **A custom exposure on a browser event is safe only when the browser holds the server's flag value at that moment** (the exposure reads `$feature/<flag>` from that event).
- **With device-id bucketing the server must forward the browser device ID on every flag call.**

### Exposure and who counts (best guess)

- **Keep the team default exposure** (`team_defaults.default_exposure_event`). Use a custom exposure only when the user names the moment and the flag is evaluated well before it (prefetch, server render, an app-wide flag read with the change on one surface).
- **Keep the test-account filter on and say so.** `team_defaults.new_experiments_filter_test_accounts` governs new experiments and does not follow the insight default; if `team_defaults.test_account_filter_count` is 0 the setting changes nothing.

### Primary metric

- **Check `shared_metrics.metrics[]` first.** A match is `matches_metric_event` true plus a `metric_event_roles` entry (`funnel_step`, `funnel_final_step`, `mean_source`, `ratio_numerator`, `ratio_denominator`, `retention_start`, `retention_completion`). A metric that only starts a retention window from the event does not answer "did more people convert on it".
- **Empty roles with a true match is not a rejection** (a shape the role reader does not parse; `metric_type` null or unlisted): retrieve and read the query. Confirm with `experiment-saved-metrics-retrieve` (`metric_type`, `math`). If it matches, link it with `experiment-update` `saved_metrics_ids` (confident). If `shared_metrics.metric_event_match_truncated` is true, call `experiment-saved-metrics-list` with `event` before building inline (that filter reads every shared metric). Otherwise use a template (best guess).
- **Pass `metric_properties` when the metric counts only some occurrences;** otherwise the `candidate_metric` baseline covers every occurrence and the running time is too optimistic. `candidate_metric.metric_properties` echoes the filters.
- **"Every conversion window carries a unit (`conversion_window_unit`). A window without a unit is ignored."**
- **Precedent of metric shape:** `previous_experiments.experiments[].primary_metric_types`; a row counts only when non-empty and all one type. Fewer than three qualifying rows is no precedent. From three up, propose the type held by at least 80% (3 of 3, 4 of 4, 4 of 5). Also check `primary_metric_events` for the same event. Best guess.

### Running time

- **When `candidate_metric.status` is `ok`, call `experiment-calculate-running-time`** with `metric_type: "funnel"` plus `candidate_metric.funnel_baseline_stats`, or `metric_type: "mean_count"` plus `candidate_metric.mean_count_baseline_stats`; `minimum_detectable_effect` = `team_defaults.minimum_detectable_effect`, else `team_defaults.product_default_minimum_detectable_effect`; `exposure_rate_per_day` = `target_surface.exposures_per_day_estimate` times the rollout share if below 100%; `number_of_variants` when more than 2.
- **Store it as `running_time_calculation`** with `minimum_detectable_effect` (the value sent; the calculator does not return it), `recommended_sample_size`, and `recommended_running_time` (= the calculator's `recommended_running_time_days`).
- **Over about 8 weeks:** say so; propose a more frequent earlier event as primary and keep the rare one secondary.
- **An uneven split by hand:** each arm needs its own days, required sample / (daily eligible traffic × exposure fraction × arm allocation), and the run lasts as long as the slowest arm (2,000 per arm at 1,000 eligible a day: 4 days at 50/50, 20 days at 90/10) [coreyhaines31/marketingskills, ab-testing]. In PostHog prefer the equal split and a lower rollout ([Rollout and split](#rollout-and-split)).
- **A flag evaluated wider than the surface (app-wide, an earlier page) dilutes:** baseline and running time come out too optimistic. Consider a custom exposure on the surface event; this is the one case for a first custom exposure in a project that never used one. `previous_experiments.experiments[].outcome.control_baseline_value` far below the surface's own rate signals an experiment exposed too widely.
- **Check the `target_surface.target_properties` / `target_url_contains` echoes;** if wider than the surface, correct the scope and call once more. `candidate_metric.persons_reached` 0 after an exact filter usually means the wrong value shape (`/pricing` vs `/pricing/`): correct it, don't widen.
- **Read the counts in order:** (1) `persons_reached` 0: fix the target; (2) `event_volume` 0: check the event name and filters (`conversion_rate` 0 means nothing until this is above 0); (3) `event_volume` above 0 but `persons_converted` 0: the event never comes after the target; `unique_persons` separates rare from misplaced. Confident on the arithmetic, best guess on the inputs (the estimate covers `candidate_metric.window_days`).
- **`previous_experiments.summary.launched_with_zero_analyzed_exposures` or `launched_with_under_100_analyzed_exposures` as a large share of `launched`** means the project launches experiments that can't measure anything.

### Precedent

- **`using_*` counts include drafts.** An empty `previous_experiments.experiments` is a first experiment, no precedent.
- **Follow the majority setting unless facts contradict it** (best guess), but: bucketing and persistence are still asked; don't add config the project never used (`using_custom_exposure` and `using_activation` 0) unless a fact calls for it; the only override is a flag evaluated wider than the surface.
- **Shipping a variant rewrites the flag,** so check `serving_single_variant` before trusting `using_uneven_split`; `split_even` is null on such rows. `using_exposure_property_filters` counts narrowed default exposures (not custom exposure); read `exposure_property_filters`. Holdout: `has_holdout`.

## Rollout and split

- **Default to an equal split and adjust the rollout percentage.** Equal splits maximize statistical power, balance traffic and reach significance faster, and increasing rollout mid-experiment is clean. "Always default to an equal split unless the user explicitly requests otherwise."
- **An uneven split with the default "Exclude from analysis" can bias:** multi-variant users are dropped asymmetrically and the smaller variant loses a larger fraction. Pre-launch or with few exposures: use an equal split and reduce the overall rollout. Live with significant exposures: switch multivariate handling to "First seen variant" (preferable to mid-run reassignment, though it has its own biases).

### The two controls (both in `feature_flag.filters`)

- **Variant split, `feature_flag.filters.multivariate.variants`:** an array of `{key, name, rollout_percentage}` summing to 100; 2 to 20 variants; default 50/50. For "A/B/C" without keys, key the baseline `"control"`; explicit keys are used as given with the baseline first.
- **Overall rollout, `feature_flag.filters.groups[0].rollout_percentage`,** sent as `groups: [{ "properties": [], "rollout_percentage": N }]`, default 100%. Excluded users see no variant and are not in the analysis.
- **`filters` may also carry `aggregation_group_type_index`** (a group-type experiment) and `payloads` (JSON-encoded strings keyed by variant key).
- **On a running experiment every flag-config change must send `update_feature_flag_params: true`.** The sources disagree on what happens without it: the rollout skill says the API rejects the update before it reaches the flag; its distribution-change reference says the change saves on the experiment object but does NOT sync to the flag, so it has no effect on assignment. Send it either way. Draft experiments sync automatically.

| Overall rollout | Variant split | % seeing test | % in analysis |
|---|---|---|---|
| 100% | 50/50 | 50% | 100% |
| 100% | 75/25 control/test | 25% | 100% |
| 50% | 50/50 | 25% | 50% |
| 25% | 50/50 | 12.5% | 25% |

### Disambiguate before applying

- **A single percentage ("roll out to 25%"):** ask between (1) a reduced rollout with an equal split (recommended) and (2) an asymmetric split at 100% rollout.
- **An uneven ratio ("60/40", "70/30", "80/20"):** recommend an equal split plus a reduced rollout. For more than 2 variants "equal" means e.g. 34/33/33.
- **If the user picks the uneven split, surface multivariate handling before creating or updating:** (1) switch to "Use first seen variant" (recommended for uneven splits), or (2) keep the default "Exclude" and accept the bias. Apply the choice in the same operation.
- **Which handling is "recommended" depends on the split.** The distribution reference calls "Exclude from analysis" "(default, recommended)", and the analytics skill says first seen "is not recommended unless necessary"; both the rollout and analytics skills recommend "First seen variant" for uneven splits and for live uneven-split bias. Exclude holds for even splits.

## Bucketing and persistence across login

- **By default the variant follows the distinct ID and changes when the person is identified** (usually at login). Choose before creating: "never change bucketing or persistence on a live flag."
- **User-id bucketing (default):** leave `ensure_experience_continuity` out so the team persistence default (`team_defaults.flags_persistence_default`) applies.
- **Device-id bucketing needs a device ID on every flag call** ("a call without one gets no variant"). A server SDK must forward the browser device ID; local evaluation works when it does. posthog-js sends the device ID on flag requests from version 1.307.1; older versions put it on events but not on flag requests.
- **Persistence (`ensure_experience_continuity: true`) cannot work with local evaluation** ("a local evaluation never consults the override store"). It needs person profiles for anonymous users, no bootstrapping, and `$anon_distinct_id` on server flag calls. Docs: https://posthog.com/docs/feature-flags/creating-feature-flags#persisting-feature-flags-across-authentication-steps
- **Device-id bucketing and persistence can't be combined;** the API refuses the pair. `create-feature-flag` leaves persistence off unless set; `experiment-create` rejects a `feature_flag` object for a flag that already exists.
- **Set the field explicitly in two cases:** moving an `experiment-create`-made flag onto device-id bucketing (pass `ensure_experience_continuity: false` in the same call); team persistence default on while an SDK evaluates locally (tell the user; set `false` only if they ask).

### Device-id recipe

`experiment-create` cannot set bucketing. (1) Call `create-feature-flag` with `bucketing_identifier: "device_id"` and `active: false` (new flags are active by default); `filters.groups` is required (a flag without a group is rejected). (2) Call `experiment-create` with that `feature_flag_key` and no `feature_flag` object; launching turns the flag on.

```json
{
  "key": "kebab-case-key",
  "name": "Experiment name",
  "active": false,
  "bucketing_identifier": "device_id",
  "filters": {
    "groups": [{ "properties": [], "rollout_percentage": 100 }],
    "multivariate": {
      "variants": [
        { "key": "control", "rollout_percentage": 50 },
        { "key": "test", "rollout_percentage": 50 }
      ]
    }
  }
}
```

## Changing distribution after launch

- **Warn and get explicit confirmation; never apply silently, even when asked.** Frame it through "Who sees what variant?" and "Who is in my analysis?". Docs: https://posthog.com/docs/experiments/changing-distribution-after-rollout
- **To stop new users entering, use `experiment-freeze-exposure`,** not a rollout decrease (that drops enrolled users too).
- **"the ideal experiment has equal split between variants and no changes after launch other than increasing the total rollout."**

| Change | Safe? | UX impact | Statistical impact |
|---|---|---|---|
| Increase rollout | Yes | None: new users added cleanly | More data, no bias |
| Decrease rollout | Caution | Test users lose the feature | Noisy data from switched users |
| Change variant split | Anti-pattern | Users may switch variants | Bias from reassignment |
| Add/remove variants | Blocked | N/A | N/A (not allowed on running experiments) |

- **Decrease:** test-variant users in the removed bucket switch back to the default; previously exposed users still count (even at 0% rollout, prior exposures still show metrics).
- **Split change** moves bucket boundaries. Alternatives: reset if early; end and start a new one if there is significant data.
- **"PostHog prevents adding or removing variants on non-draft experiments."**

## Lifecycle

**Unresolved source conflict:** this overview describes pause as leaving status `running`; the health and changes references describe `paused`. The current API prose does not establish the serialized status. Preserve both views until the current model or serializer is checked. [PostHog skills, EXPERIMENTS.md; EXPERIMENT-HEALTH.md; EXPERIMENT-CHANGES.md]

```text
draft ──launch──▶ running ──end──▶ stopped ──archive──▶ archived
                  │ │   ▲              │
                  │ pause resume  ship_variant
                  │ │   │         (also ends if running)
                  │ ▼   │
                  │ paused (flag inactive, still "running" status)
                  │
                  ├─freeze_exposure──▶ exposure_frozen ──unfreeze_exposure──▶ running
                  │                    (enrollment closed, metrics keep flowing)

Any non-draft state ──reset──▶ draft
```

| Action | Effect and rules |
|---|---|
| Launch | Draft to running; activates the flag, sets `start_date`; needs 2 to 20 variants. Checklist: at least one metric, variants correct, flag implemented in code. No body. |
| Pause | Deactivates the flag; users fall back to the default (typically control); the flag is not returned by `/decide`; no new exposures; status stays "running". No body. |
| Resume | Same deterministic assignment. No body. |
| Freeze exposure | Stops enrolling new users: snapshots exposed users into a static cohort and narrows every release condition to it; status `exposure_frozen`; `end_date` stays null. For long-horizon metrics (revenue, LTV, retention, renewals). |
| Unfreeze | Restores the original targeting, deletes the snapshot cohort, status `running`; can bias (two cohorts joined at different times); warn first. |
| End | Sets `end_date`, status stopped; the flag is NOT modified; results frozen to `end_date`. Optional `conclusion` (`won`, `lost`, `inconclusive`, `stopped_early`, `invalid`) and `conclusion_comment`. |
| Ship variant | Serves the chosen variant at 100% within the existing release conditions by default; `release_to_everyone: true` adds a catch-all. See [the canonical ship behavior](EXPERIMENT-CHANGES.md#e7-ending-vs-shipping-high). From running or stopped, not draft; ends the experiment if running. Requires `variant_key`; optional `conclusion`, `conclusion_comment`. Always confirm. 409 if an approval policy requires review. The old overview said shipping always added a catch-all. [PostHog, https://posthog.com/docs/api/experiments-2; https://posthog.com/docs/experiments/managing-lifecycle] |
| Archive | Stopped only; restore with `archived=false` through `experiment-update`. |
| Reset | Back to draft; clears `start_date`, `end_date`, `conclusion`, `archived`; flag unchanged; old data excluded unless `start_date` is adjusted after relaunch. |
| Duplicate | New draft; always give a unique `feature_flag_key` (the same key means a shared flag); default name "Original Name (Copy)". |
| Copy to project | Same organization only (not across orgs or regions); the source must not use legacy metrics; `target_team_id` required, `feature_flag_key` optional (defaults to the source key). An existing key in the target is a shared flag (must be multivariate with 2 to 20 variants, else 400). Not copied: saved-metric references, holdout, exposure cohort, dates, results, conclusion. Confirm source and target by name. |
| Migrate | `experiment-migrate` moves a legacy experiment (`is_legacy: true`, `ExperimentTrendsQuery`/`ExperimentFunnelsQuery`) to the new engine. "Never hand-roll this" (a new experiment gets a second flag and no data). Reuses the flag; the legacy one is left untouched, so two experiments share one flag (tell the user first, link both); legacy shared metrics are converted; numbers can differ; safe to retry; 400 if already new. Legacy experiments no longer show results, and `experiment-update` on one returns 400 except for name, description, end_date. |

- **Offer a survey once at launch** for a user-facing, substantial change: a short survey on flow completion. Offer it as setup advice, drop it if declined, and never let it delay the launch. Never at end or ship time: there it reads as a gate on rolling out. See [EXPERIMENT-REPLAYS.md](EXPERIMENT-REPLAYS.md).
- **Preconditions:** launch needs a draft; pause needs running and not already paused; resume needs paused; end needs running (launched, not already stopped); unfreeze needs frozen exposure and an experiment not ended; reset needs a non-draft. Archive hides a stopped experiment from the default list view.
- **Freeze vs end vs pause:** freeze stops adding users without stopping measurement; end stops measurement at `end_date`, and pause deactivates the flag for everyone. Ending a frozen experiment leaves the flag narrowed to the snapshot cohort (unfreeze first, or ship a variant, if that's not desired). If the user only wanted to sanity-check the frozen results, they may not need to unfreeze at all.
- **Duplicate** creates a new draft with fresh dates and no results; with the same flag key both experiments share a flag, so changes to one affect both.
- **Copy to project** also copies name, description, type, parameters, filters, primary and secondary metrics (fresh uuids), stats and scheduling config and exposure criteria; it needs write access to the target. The resolved key is looked up in the target project: if it exists the copy shares that flag (lifecycle ops on either affect both), otherwise a new independent flag is created. Pass a key that doesn't exist in the target to guarantee independence. The returned experiment and id belong to the target project.
- **Migrate** is the only way to get results for a legacy experiment; calling it again returns the experiment the first call created. Name, description and end_date still edit on the legacy experiment directly, so don't migrate for them; migrate only when the user asks, wants results, or requests a change to a field the guard blocks, and apply that change to the migrated experiment.
- **Freeze preconditions:** running (not draft, stopped, paused or already frozen), flag linked and not deleted, at least one release condition. It is synchronous; tens of thousands of exposed users can take tens of seconds, so don't retry. It returns 400 for group-aggregated experiments, experiments in a holdout, flags with early access conditions, mostly-anonymous exposure (the troubleshooting docs: more than about 5% of exposed users anonymous), and very large exposed sets (person cap and timeout). These are structural; don't retry.
- **Freeze side effects:** ship-variant and reset strip the freeze and delete the cohort; end does NOT touch the flag. Local-evaluation SDKs can't resolve static cohorts, so a frozen flag evaluates through `/decide`. Final-moment exposures may miss the snapshot (ingestion lag).

### Lifecycle errors

On a 400, explain; don't retry.

- "Experiment has already been launched." / "Experiment has not been launched yet." / "Experiment has already ended."
- "Experiment is already paused." / "Experiment is not paused." / "Cannot freeze a paused experiment. Resume it first."
- "Experiment is already in draft state." / "Experiment is already archived."
- "Experiment exposure is already frozen." / "Experiment exposure is not frozen." / "Group-aggregated experiments cannot have their exposure frozen."
- "This experiment uses legacy metric formats..." (migrate first).

## Prove it

- `experiment-get-by-flag-key` returned `no_flag` or `no_experiment` before `experiment-create`, and the create response's `_posthogUrl` was reported with the confident / best guess / not decided groups.
- `experiment-get` shows variant `rollout_percentage` values summing to 100, the intended `groups[0].rollout_percentage`, and no `stats_config` unless the user asked for one.
- Every event named in the setup was confirmed with `read-data-schema`, and `candidate_metric.persons_reached` and `event_volume` were above 0.
- The code filters ineligible users before the flag read, and both variants were QA'd.
- After launch, the 24 to 48 hour checks pass: variant volumes in the configured ratio and no crash or error increase.
- No flag edit after `start_date` other than a rollout increase (check `experiment-activity`), and every running-experiment flag change carried `update_feature_flag_params: true`.
