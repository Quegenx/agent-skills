# Experiment bias, skew and SRM

Group A of the experiment health check: the split doesn't match the configuration, the smaller variant looks worse, people show up in both arms, or a variant starves. Assignment is a deterministic hash of the flag key, the bucketing identifier and the split boundaries, so with an unchanged split any set of people lands close to the configured percentages. A confirmed SRM lives in one of two homes: assignment-side (the recorded variant disagrees with the hash) or capture-side (which people get recorded is selected). The workflow and snapshot are [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md); offline localization of a confirmed SRM is [EXPERIMENT-DEBUGGING.md](EXPERIMENT-DEBUGGING.md); flags are [FEATURE-FLAGS.md](FEATURE-FLAGS.md).

**Contents:** [Read three values first](#read-three-values-first) · [A1 Exclusion bias on an uneven split](#a1-exclusion-bias-on-an-uneven-split-high) · [A2 Sample ratio mismatch](#a2-sample-ratio-mismatch-high) · [A3 Identity fragmentation](#a3-identity-fragmentation-medium) · [A4 Bootstrap and /flags disagree](#a4-bootstrap-and-flags-disagree-medium) · [A5 Flag and experiment state banners](#a5-flag-and-experiment-state-banners-high) · [A6 Mid-run flag edits](#a6-mid-run-flag-edits-medium) · [A7 Non-randomized assignment](#a7-non-randomized-assignment-medium) · [A7b A forced-variant group starves the other arm](#a7b-a-forced-variant-group-starves-the-other-arm-high) · [A8 Migrating distinct_id mid-run](#a8-migrating-distinct_id-mid-run-high) · [A9 Exposures lost or sent unevenly](#a9-exposures-lost-or-sent-unevenly-medium) · [A10 Part of the audience gets no variant](#a10-part-of-the-audience-gets-no-variant-medium) · [Prove it](#prove-it)

## Read three values first

Call `experiment-results-get` once, after stored results and change history:

1. **`exposures.sample_ratio_mismatch.p_value`.** The page flags a mismatch below **0.001**. Below it: a real assignment or capture problem, or the split changed during the run (the test compares the whole run with the CURRENT split); walk A2. At or above 0.001: no mismatch by the product's rule, and a small-sample split is noise (C2). [MEDIUM] Between 0.001 and 0.05 is not cleared: a slow one-arm leak looks like this for days. No tool returns an earlier day's p-value; diff the cumulative `exposures.timeseries` between days and walk A9 if the gap grows one way.
2. **`exposures.total_exposures['$multiple']` over the sum of all values.** Non-zero: A1, A3, A4 (and A6, A8 if the flag or identifier changed). Absent under `first_seen`.
3. **The configured split, `feature_flag.filters.multivariate.variants[].rollout_percentage`.** An uneven split amplifies any bias source. The flag shows today's split; for ended or edited experiments take the run's split from the change history.

- **An observed split matching the flag's split during the run has no mismatch to explain;** a user expecting 50/50 on a 90/10 flag has a config question. After a split change, the product's SRM test tests the wrong expectation (E3).
- **"Metric count far smaller than exposures" (10x, 100x):** walk this file before [EXPERIMENT-NUMBERS.md](EXPERIMENT-NUMBERS.md); it is usually bucketing or identity (A3, A4), not query scope.
- **SQL rules here:** the experiment's exposure event, the flag's variant keys, both window ends, no test-account filter; count `person_id`, or `$group_<index>` on group-aggregated flags; when comparing with `$multiple` leave out `excluded_variants` keys. `resolved_exposure_event` is always the default event: on a custom-exposure experiment these queries read the flag's calls, not the counted people (say so).

## A1 Exclusion bias on an uneven split [HIGH]

The signal behind the banner **"Setup likely introduced bias"**. It fires when ALL four hold:

- `multiple_variant_handling == "exclude"` (the default);
- uneven variant rollouts (a 0% variant counts, so 0/50/50 is uneven);
- the share in more than one variant is above **0.1%** (`exposures.bias_risk.multiple_variant_percentage` = `$multiple` over all exposures);
- the experiment has no end date (after the end the banner is gone, but the exclusion is still in the numbers).

- **The banner fires above 0.1%, but the collapsed Exposures summary hides the `$multiple` row at or below 0.5%;** the expanded table always lists it, labeled "(excluded from analysis)". Point the user to the expanded table and state the exact share from `exposures.bias_risk`.
- **Mechanism:** the smaller variant loses a larger fraction. Multi-device, multi-session and signup-flow users tend to be high-intent, so the smaller variant keeps the low-intent slice and looks worse. This is asymmetric exclusion bias, not a UI bug.
- **Recommend, in order:** (1) an equal split: free on a draft; mid-run it is an anti-pattern, so prefer reset or end and restart. The banner's "Adjust distribution" button opens the split editor on the running experiment; a user who followed it changed the split mid-run, so read the flag history first (E3). (2) Switch `multiple_variant_handling` to `"first_seen"`: low disruption mid-run, no users switch, data stays; less biased than `exclude` for this shape, but not unbiased (it still discounts engaged multi-session users). There is no clean fix.
- **Settings and public docs call Exclude the recommended handling.** That holds for an even split; the banner is the product's exception for uneven splits.
- Code: `evaluate_bias_risk`, `MULTIPLE_VARIANT_BIAS_THRESHOLD` in products/experiments/backend/health/checks/bias_risk.py; `_evaluate_bias_risk` in experiment_exposures_query_runner.py; `MULTIPLE_VARIANT_WARNING_THRESHOLD`, `filterLowMultipleVariant` in frontend/src/scenes/experiments/utils.ts; Exposures.tsx in frontend/src/scenes/experiments/ExperimentView.

## A2 Sample ratio mismatch [HIGH]

- **`exposures.sample_ratio_mismatch` holds a chi-squared p-value and expected counts per variant.** It runs once variants with rollout above 0% hold **100** exposures together. With fewer than two variants above 0% there is no test and it is null (the state after a ship or a 100/0 edit; judge by the split of the run). The page flags it at **p < 0.001**; the server returns the p-value with no threshold.
- **Expected counts follow the flag's split AS IT IS NOW,** rescaled for a holdout; `$multiple`, the holdout and excluded variants are left out. After a split change, a mismatch is the expected reading: read A6 first.
- **MUST read the product's value; MUST NOT run the test on your own event counts** (they include test accounts, no-variant responses, repeats and out-of-window events).
- **Small samples:** the health reference says a mismatch on a small sample is still a mismatch (the test accounts for sample size), the exception being a single reading that clears the next day (about once in a thousand by construction). The support reference says don't call SRM below about 1,000 exposed persons per variant, and the troubleshooting docs say 55/45 under about 1,000 exposures is normal early variance.
- Code: `_calculate_srm`, `SRM_MINIMUM_SAMPLE_SIZE` in experiment_exposures_query_runner.py; `hasSampleRatioMismatch` in products/experiments/frontend/health/exposureHealth.ts.

### Causes, cheapest first

1. **The flag changed after launch:** a change of the flag's `filters` after `start_date` in `experiment-activity` (A6).
2. **[MEDIUM] Exposure events lost or sent unevenly:** a redirect, exposure after the arms diverge, a flag read before flags load. The most frequent cause that no flag change explains (A9).
3. **Part of the audience gets no variant:** `false` or empty means no exposure. A `false` removes people from every arm alike; it moves the split only when tied to one arm (an app fallback on a custom exposure event, a pinned condition matching without a device id) (A10).
4. **A release condition pins a variant** (A7).
5. **[MEDIUM] Server and client evaluate differently:** bootstrap vs later evaluation (A4); a locally evaluating server keeps the old definition for its polling interval after an edit; a flag with persistence across authentication isn't evaluated locally (the SDK falls back to a remote call); with `strictLocalEvaluation` or `onlyEvaluateLocally` set in posthog-node there is no remote call and the call returns no value, so no exposure. Evidence: exposures per variant by library, `feature_flag.ensure_experience_continuity`, whether servers evaluate locally.
6. **[LOW] Bots on server-side evaluation.** The troubleshooting docs rank bots first and say enable the CDP Bot Filter Transformation (Settings > Data pipeline > Transformations); the health reference rates it weak for a directional mismatch (one crawler is one identifier) unless a crawler sends a new identifier per request. Evidence: the share of server-side libraries, exposed people with no later event. The "Filter Bot Events" transformation applies built-in bot lists to browser events only; for server SDK events only custom user-agent patterns or IP prefixes work. With "Keep events where the useragent is not set?" at No it drops every event without the user-agent property (`$raw_user_agent` by default), and posthog-node sets it only when code passes it. More reliable: don't evaluate the flag for requests the server knows are bots. Code: nodejs/src/cdp/templates/_transformations/bot-detection/bot-detection.template.ts (`is_browser_traffic`). Docs: https://posthog.com/docs/experiments/troubleshooting#diagnosing-sample-ratio-mismatch-srm

The troubleshooting docs list, in order: bot traffic, flag condition or rollout changes after launch (variant keys are locked, conditions are not), identity fragmentation, the server SDK dedup cache of 50,000 entries (Node, Python), and normal early variance.

### What does NOT cause a mismatch

- **Repeated exposure events from one person** (counted once). A server SDK re-sending after a restart or a full dedup cache changes the event count, not the split.
- **Ad-blockers and network loss** (both arms alike). A reverse proxy (https://posthog.com/docs/advanced/proxy) recovers part.
- **A holdout** (expected counts are rescaled).
- **Multi-variant people on an even split.**

Fix paths change the flag. An agent can edit a flag over MCP, but on a running experiment every edit is a mid-run change: explain it and get the user's decision first.

## A3 Identity fragmentation [MEDIUM]

- **An identity problem, not bias:** one human with several distinct ids, each hashed separately. Linked ids make one person with two variants (`$multiple`); never-linked ids make two persons, and nothing shows it.
- **No event carries `$multiple`;** it is computed per person from current variant keys only (`false`, empty or an old key never make `$multiple`). Under `first_seen` the count isn't reported; the query is the only source. `distinct_ids / persons` above 1 means linked ids, the precondition for a flip.

Start with one day on a large project; an empty result on a short window doesn't rule A3 out.

```sql
-- People whose exposure events carry more than one variant key
SELECT
    person_id,
    uniq(properties.$feature_flag_response) AS variants_seen,
    uniq(distinct_id) AS distinct_ids,
    groupUniqArray(properties.$feature_flag_response) AS variants
FROM events
WHERE event = '<resolved_exposure_event>'
  AND properties.$feature_flag = '<flag-key>'
  AND properties.$feature_flag_response IN ('<variant-key-1>', '<variant-key-2>')
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
GROUP BY person_id
HAVING variants_seen > 1
ORDER BY variants_seen DESC, distinct_ids DESC
LIMIT 20
```

One person's exposure events:

```sql
SELECT
    timestamp,
    distinct_id,
    properties.$feature_flag_response AS response,
    properties.$lib AS lib
FROM events
WHERE event = '<resolved_exposure_event>'
  AND properties.$feature_flag = '<flag-key>'
  AND person_id = '<person_id>'
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
ORDER BY timestamp
LIMIT 50
```

- **Reading it:** different `distinct_id`s mean an identity cause; the same `distinct_id` with a flag edit between the timestamps means A6; the same id, no edit, different libraries means server and client disagree (A4, A10). `false` has no `$experiment_exposure` row; query `$feature_flag_called` to see a step to no variant.
- **Common causes:** `reset()` between sessions (other than on logout); `identify()` AFTER the flag was evaluated; cross-device without stitching; cleared cookies, incognito or stealth modes; anonymous to identified without flag persistence; different anonymous IDs on client and server; native mobile auth flows reading the flag before identify, or auth crossing an SDK boundary (web to an in-app webview).
- **Fixable:** `identify()` ordering, cross-domain cookies, bootstrap timing. **Not fixable from PostHog:** multi-device and incognito; those users tend to be more engaged, so contain them (scope the exposure to the relevant flow) rather than eliminate them.
- **Recommend:** `reset()` only on explicit logout; `identify()` before flag evaluation. Persistence across authentication carries a variant from anonymous to identified, not back; after `reset()` the next evaluation is a new draw.
- **Logged-out to logged-in flows:** **Persist flag across authentication steps** (requires `person_profiles: 'always'`, incompatible with local evaluation and bootstrapping, slight latency) or **Device-ID bucketing** (landing, marketing and anonymous flows; surface it explicitly). Device-ID limits: evaluation without a device id returns `false`, which is usual for server-side calls (A10), except that a 100%-rollout release condition pinning a variant still matches; it can't combine with persistence across authentication (the API refuses).
- **Pre-auth:** cookies or localStorage persistence (cookies preferred across subdomains). **Mobile:** evaluate server-side (local evaluation) once authenticated rather than on first app open.

## A4 Bootstrap and /flags disagree [MEDIUM]

A server-rendered app with bootstrapping can show a substantial `$multiple`; website-only flags (no bootstrap) are unaffected.

- **Shape 1, different identifiers:** the server bootstraps with a server-known `distinct_id` but the payload lacks `distinctID`, so `posthog-js` initializes with the persisted (often anonymous) ID; a later `/flags` call after `identify()` uses another ID, giving two variants. On device-id bucketing the identifier doesn't change at `identify()`, so this needs different device ids.
- **[MEDIUM] Shape 2, different inputs:** the backend passes properties in another type or format (a timestamp string vs a stored number) or a hand-set variant, so the bootstrap exposure has a variant and the next evaluation returns another or `false`: the user sees the new experience, then loses it.
- **Evidence properties:** `$used_bootstrap_value` is `true` when the value was read before that page load's flags request answered (bootstrap OR cached from an earlier page load); `$feature_flag_bootstrapped_response` is what the bootstrap payload said (null without one); `locally_evaluated` is `true` from server-side local evaluation. `$used_bootstrap_value` is usually not materialized, so use a one-day window. On a type error use `toString(properties.$used_bootstrap_value) = 'true'` and `ifNull(toString(properties.$used_bootstrap_value), '') != 'true'`.

```sql
SELECT
    person_id,
    groupUniqArrayIf(properties.$feature_flag_response, properties.$used_bootstrap_value = true) AS bootstrap_variants,
    groupUniqArrayIf(properties.$feature_flag_response, ifNull(properties.$used_bootstrap_value, false) = false) AS other_variants
FROM events
WHERE event = '<resolved_exposure_event>'
  AND properties.$feature_flag = '<flag-key>'
  AND properties.$feature_flag_response IN ('<variant-key-1>', '<variant-key-2>')
  AND timestamp >= toDateTime('<window_start>', 'UTC')
  AND timestamp < toDateTime('<window_end>', 'UTC')
GROUP BY person_id
HAVING length(bootstrap_variants) > 0
   AND length(other_variants) > 0
   AND arraySort(bootstrap_variants) != arraySort(other_variants)
LIMIT 20
```

- **A stale cached value and a flag edit between page loads give the same rows:** confirm with `$feature_flag_bootstrapped_response` and the flag history. No rows and no `$used_bootstrap_value = true` anywhere makes A4 unlikely, not ruled out (older SDKs may not stamp it); ask whether the app is server-rendered with bootstrap. For shape 2, drop the variant filter and query `$feature_flag_called`.
- **Recommend:** pass `distinctID` in the bootstrap payload when the server knows the identity; use bootstrap together with server-side local evaluation, not alone; pass person properties in the type the release conditions compare against.

## A5 Flag and experiment state banners [HIGH]

Read from `experiment-get` alone:

| Banner | Condition | Action |
|---|---|---|
| "The experiment is paused" | Launched, no end date, flag disabled, `status` `paused` | Resume or end |
| "The experiment is running, but no new users are being exposed" | Running, every release condition at 0% | End with a conclusion or increase rollout; earlier exposed people stay in results |
| "The experiment is running, but all users see a single variant" | Running, the first release condition matches everyone at 100%, one variant at 100% of the split | End or adjust the distribution |
| "The experiment is not running, but users are exposed to multiple variants" | Ended, flag active, more than one variant above 0%, a release condition above 0% | Disable the flag or resume |
| Same caption | Not launched (also after a reset), not archived, flag active, more than one variant above 0%, a release condition above 0% | Disable the flag or start |

- **"Adjust the variant distribution" on a running experiment is a split change** (E3).
- **Not covered by any banner:** a pinned variant (A7b), a shipped variant (E7), frozen exposure (`exposure_frozen`, E16), a deleted flag.
- **A flag active before launch:** pre-`start_date` exposures are outside the analysis, same hash, no `$multiple`; the risk is SDK dedup, where a returning person may not resend (B3).
- Code: ExperimentWarningBanners.tsx in frontend/src/scenes/experiments/ExperimentView, `experimentWarning` in experimentLogic.tsx, `isSingleVariantShipped` in products/experiments/frontend/scenes/experimentsLogic.ts.

## A6 Mid-run flag edits [MEDIUM]

The variant is a function of the flag key, the bucketing identifier and the split boundaries. The variant key is NOT an input (it is a slot label). The release-condition rollout is drawn separately and decides in or out, never which variant.

| Edit | Moves people between variants? |
|---|---|
| Split changes, a variant to 0%, variants reordered | YES: everyone whose draw lies between the old and new boundary, including people of untouched variants, so the same person appears under a second key (`$multiple` under `exclude`); a 0% variant stops growing |
| Bucketing identifier changes, or persistence across authentication switched | YES for people whose identifier changes (a persistence switch moves only those whose stored or anonymous id differs from `distinct_id`); about half keep their variant by chance on 50/50, so `$multiple` rises from the edit day |
| Release condition added, tightened or its rollout changed | NO: people move in or out (out = `false`), giving more or fewer new exposures; no `$multiple` from this alone |
| The same, but the matched condition pins a variant | YES, to the pinned one (A7) |
| Variant key renamed | NO (same slot, new label); the flag API REJECTS the rename while running, and old-key exposures would leave the analysis |
| Flag key renamed | YES (the key is a hash input; everyone is redrawn); the flag API ALLOWS it while running, and pre-rename exposures carry the old key and leave |

- **Evidence:** a flag `filters` change after `start_date` in `experiment-activity`; compare `multivariate.variants`, `groups` and the bucketing identifier; also `feature-flags-activity-retrieve` and `advanced-activity-logs-list` (only on a plan with audit logs). An edit explains only people exposed on both sides of it; don't attribute the whole `$multiple` share to it.
- **Recommend:** a split or identifier change contaminates the data from the edit on; reset and relaunch is cleaner; `first_seen` is the low-disruption option; a rollout change alone needs no repair (E1, E2).
- Code: `get_hash`, `hashed_identifier`, `check_rollout`, `get_matching_variant` in rust/feature-flags/src/flags/flag_matching.rs; `select_variant` in rust/feature-flags/src/flags/v1_bucketing.rs; the variant-key guard in `FeatureFlagSerializer`, products/feature_flags/backend/api/feature_flag.py.

## A7 Non-randomized assignment [MEDIUM]

- **Release conditions that force variants** (e.g. iOS to test, Android to control) invalidate significance. The UI doesn't prevent it, and nothing leaves pinned people out of the analysis.
- **Verify:** a `feature_flag.filters.groups[]` entry with `variant` equal to a variant key; `variant: null` or missing means randomized.
- **Rules:** release conditions are evaluated in stored order and the first match wins (a pinned condition forces only people who matched no earlier condition); a `variant` that isn't a variant key is ignored (bucketed normally); a holdout is evaluated before every release condition (holdout people are not pinned).
- **Check overlap with the test-account exclusion list:** a cohort in the list with `filterTestAccounts` not `false` is filtered, so the override is mostly a no-op; one not excluded (e.g. a partner email domain) contaminates real users.
- **[LOW] Dynamic cohort exclusion lags:** the flag evaluates live, but the analysis usually reads stored cohort membership recalculated on a schedule (some projects compute a fast cohort at query time, with no lag). Exclude on the person property itself in both places.
- **Recommend:** separate experiments per cohort, or one random assignment analyzed with cohort breakdowns. An accidental override (a QA leftover): set `variant: null` or delete the group. A young experiment: reset and relaunch. Significant clean data before: treat the post-launch window as contaminated and consider ending and relaunching.

## A7b A forced-variant group starves the other arm [HIGH]

- **Shapes:** an unconditional catch-all (empty `properties[]`, a pinned `variant`, `rollout_percentage: 100`), so the randomized split never applies; an "all new users" cohort (e.g. `created_at_unix >= <ts>` pinned to `variant: test` at 100%) with no `variant: null` group and none forcing the other variant, so control starves within weeks.
- **Red flags:** a group with `variant` and broad or empty `properties` at high rollout; NO group with `variant: null` or with a non-variant-key `variant`; every pinned group forces the same variant. No banner covers it (A5's single-variant banner reads the split, and a pinned group leaves the split untouched).
- **Confirm:** `exposures.total_exposures` orders of magnitude apart. In the daily series, balanced then one arm collapsing means it ran as an A/B and was then rolled out through the flag (the balanced window is the valid result); one arm never getting meaningful traffic means it was never randomized. This differs from the plateau, where the app stopped firing.
- **Calibrate:** usually a deliberate rollout through the flag, not a bug. Forcing `test` means rolled out; forcing `control` means the feature is effectively not shipped. Ask: "did you intend users to get the new experience, or the status quo?"
- **Recommend:** conclude the experiment (read the pre-rollout balanced window); if accidental, remove the forced groups and reset. Confirm intent; don't assert "broken".

## A8 Migrating distinct_id mid-run [HIGH]

- **Affected people are redrawn at their next evaluation.** For person-bucketed flags without persistence the identifier is `distinct_id`, so about half land in the other variant on 50/50. Not affected: device-id bucketing and group-aggregated flags.
- **Linked ids show as `$multiple`; unlinked ones become a second, unflagged person.** No activity log shows it.
- **Recommend:** finish or end before migrating, then start a fresh experiment. If forced to migrate mid-run, expect an inflated `$multiple`, treat the window as contaminated, and `reset` and relaunch after. Experience continuity (flag persistence) is not a general substitute.

## A9 Exposures lost or sent unevenly [MEDIUM]

- **Symptoms:** "58/42 and it should be 50/50", "one variant gets fewer users every day", "our analytics show an even split".
- **Mechanisms:** one arm navigates away (a redirect or reload before the SDK sends its queue); the exposure sits behind the divergence; one code path reads the flag early (before flags load, falling back to a hardcoded variant, or reading through a call that sends no exposure, B1). In posthog-js an early read returns nothing only when no flags are cached from an earlier page load, so the loss falls on first visits. One arm is slower or fails more. [LOW] A cached page carries the assignment. The exposure is recorded before rendering (a server or edge records it, but prefetches, bots and blocked browsers never render): the split is even but the arms differ in who arrives, and SRM can't see it.
- **Evidence:** the by-day-and-library query (and by page) from [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md#by-day-and-library-a2-a9); an exposure-criteria filter only one arm can match (B12, a setting); new vs returning: add `person.created_at < toDateTime('<start_date>', 'UTC') AS returning` to the SELECT and GROUP BY of the by-day query (B3 removes returning people proportionally, so a one-arm gap points to A9); on a custom exposure, the flag-call split vs the custom-event split; the code around the flag read in each arm.
- **Co-occurs with** A2 (its most frequent cause), A10, B8.
- **Recommend:** send the exposure at a point both arms pass before diverging: a custom exposure at the common entry (e.g. the page view of the landing URL) with the variant in `$feature/<flag-key>` (B4), a server exposure at assignment, waiting for flags to load with no fallback variant. Results already collected carry the bias: reset and relaunch, or move the analysis start to the fix.

## A10 Part of the audience gets no variant [MEDIUM]

- **Only responses that are variant keys count.** `false`, empty or a non-key is no exposure, with no warning, and the survivors are a biased sample.
- **Causes:**
  - Inputs not there yet: a backend-set person property (sign-up date, plan, app version); new users in onboarding are hit most. With `person_profiles: 'identified_only'` anonymous visitors have no stored person properties, so the flag sees only what the client sends.
  - Client and server values differ (A4 shape 2).
  - Device bucketing without a device id (`false`; a 100% pinned condition still matches).
  - A group-aggregated flag without the group key (`false`).
  - A flag read before flags load or before consent (in posthog-js a returning visitor gets the cached value).
  - A cookie-banner experiment measured by an analytics tool that loads only after consent: "An impression fires before any consent exists. If your analytics tool loads only after consent, it never sees a decliner's impression, and its opt-in rate trends towards 100%." [c15t] c15t computes the opt-in rate from its own session reports instead: visitors with `accept_all` under the arm / visitors whose session reports carry the arm ([cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)).
  - [MEDIUM] The app's own fallback reporting "no variant" as `control` inflates control in app analytics and in custom exposure events (the default exposure is unaffected: it stays `false`).
  - A holdout returns `holdout-<id>` (intended).
- **Evidence:** `$feature_flag_called` responses by day and library (`$experiment_exposure` has no `false` or empty); `feature_flag.filters.groups[].properties` on post-sign-up or backend properties; `feature_flag.bucketing_identifier`. A `false` share equal to what the release conditions exclude by design is not a finding.
- **Co-occurs with** A2, A4, A9, B10.
- **Recommend, in order:** send the exposure from the place that knows the variant; put the variant on the exposure event explicitly; make inputs available before evaluation (pass person properties with the call, wait for flags); avoid release conditions on data that doesn't exist at evaluation time. The troubleshooting docs say the same for new users in onboarding: fire the exposure from the server, stamp `$feature/<flag-key>` on a custom exposure, bootstrap or wait for flags.

## Prove it

- The SRM verdict quotes `exposures.sample_ratio_mismatch.p_value` from the product, against the split the flag had during the run (from the change history), never a test on raw event counts.
- The `$multiple` share is stated as a number from `exposures.bias_risk` or `total_exposures`, with the configured split and `multiple_variant_handling` next to it.
- Any blamed flag edit is shown as a `filters` diff after `start_date` in `experiment-activity` or `feature-flags-activity-retrieve`.
- For a forced-variant shape, the `groups[]` entry with its `variant`, `properties` and `rollout_percentage` is quoted, and the user was asked about intent.
