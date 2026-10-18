# Empty experiments and missing exposures

Group B of the experiment health check: 0 exposures, a variant that is always undefined or false, exposures without conversions, or exposures that grew and then stopped. An exposure is counted only after a chain of steps all succeed: the SDK reads one flag's value, the exposure event is captured and ingested, it matches the configured exposure criteria, and it is counted. There is no "no variant" bucket: an exposure that fails any step simply isn't there. The workflow and snapshot are [EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md); flag SDK calls are [FEATURE-FLAGS.md](FEATURE-FLAGS.md).

**Contents:** [What counts as an exposure](#what-counts-as-an-exposure) · [Triage](#triage) · [B0 Fresh launch](#b0-fresh-launch) · [B1 Wrong evaluation method](#b1-wrong-evaluation-method-medium) · [B2 identify() timing](#b2-identify-timing-and-never-linked-ids-low) · [B3 Dedup per identity](#b3-dedup-per-identity-medium) · [B4 Custom exposure without $feature/<flag-key>](#b4-custom-exposure-without-featureflag-key-high) · [B5 Hand-sent exposures](#b5-hand-sent-exposures-high) · [B6 Ad-blockers and consent](#b6-ad-blockers-and-consent) · [B7 Test-account filter](#b7-test-account-filter-high) · [B8 Metric events before exposure](#b8-metric-events-before-exposure-high) · [B9 Eligibility after the flag check](#b9-eligibility-after-the-flag-check-medium) · [B10 Variant always undefined or false](#b10-variant-always-undefined-or-false-medium) · [B11 $feature/<key> on metric events](#b11-featurekey-on-metric-events-high) · [B12 An exposure filter that can't match](#b12-an-exposure-filter-that-cant-match-medium) · [Never had exposures, or stopped](#never-had-exposures-or-stopped) · [Prove it](#prove-it)

## What counts as an exposure

- **The exposure event is the default `resolved_exposure_event`** (`$feature_flag_called`, or `$experiment_exposure` for experiments started on or after 2026-09-01 UTC in a project in that rollout). A config naming `$feature_flag_called` counts the default event, as an absent config does. SDK-side diagnostics apply to both events (an SDK that never fires `$feature_flag_called` produces neither). `$feature_flag_called` with variant responses and no `$experiment_exposure` is not an SDK fault ([EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md#which-default-event)).
- **All must hold:** the experiment's exposure event inside the window; the variant property holds a current variant key (`$feature_flag_response` on the default event, `$feature/<flag-key>` on a custom one) not in `excluded_variants`; a group-aggregated flag's event carries that group type's key; with an activation event, the person sent it at or after the first flag exposure; the event passes the test-account filter and every exposure-criteria filter.
- **Launched with none counted:** total 0, a flat chart, and the panel "No exposures yet" (the same text for a draft, a future start date and a failed exposure query).

## Triage

For 0 exposures, or 0 in one variant. For "grew then stopped" go to [the closing section](#never-had-exposures-or-stopped); for exposures without conversions go to B2, B8, B11, then D11 in [EXPERIMENT-NUMBERS.md](EXPERIMENT-NUMBERS.md).

1. **`start_date`:** null is a draft; minutes or hours ago is B0.
2. **Is the code deployed and is traffic flowing?** No: stop there.
3. **Run the raw-responses query** ([EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md#raw-responses-default-exposure-event)):
   - Variant responses but 0 counted: criteria remove them (B4, B7, B12), the variant is in `excluded_variants`, a group-aggregated flag lacks the group key, the activation event is never sent after the flag call, or a 0 was computed before events arrived (`last_refresh`, B0).
   - No-variant responses (`false`, empty): B10 (A10 if partial).
   - A custom event with empty or non-key `$feature/<flag-key>`: B4.
   - One variant has events and another none: a variant at 0% or pinned (A7b, E3), or one-arm code.
   - No events: SDK or capture (B1, B6), a read before flags loaded (B10), events without the flag key (B5), or the code calls another key. When counting `$experiment_exposure`, query `$feature_flag_called` too before concluding nothing is sent.
4. **Some people exposed, others not:** B3, B10 (a read before load that isn't repeated), A10.

## B0 Fresh launch

- **[MEDIUM]** `start_date` null means not launched; exposures above 0 rule B0 out.
- **[HIGH] For the first 12 hours an experiment reads exposures directly from events,** and the page forces one fresh read on each load while total exposures are below **50**, so a correctly wired experiment shows its first exposures within minutes (the delay is ingestion).
- **`experiment-results-get` can return a result up to 24 hours old** (`last_refresh`). Stored results may not exist yet: the scheduled calculation skips experiments younger than 12 hours or with fewer than 50 total exposures.
- **Projects with precomputed exposures:** an experiment older than 12 hours can lag today's new exposures by up to **15 minutes**.
- **Reading:** zero minutes after launch on low traffic is waiting; zero an hour after launch on a visited surface is a real B case.
- Code: `MIN_PRECOMPUTATION_DURATION_SECONDS`, `DEFAULT_EXPOSURE_TTL_SECONDS` in products/experiments/backend/hogql_queries/precompute_policy.py; `ExperimentResultsCacheMixin` in experiment_query_runner.py; `NEW_EXPERIMENT_FORCE_REFRESH_AFTER_MINUTES`, `EXPERIMENT_MIN_EXPOSURES_FOR_RESULTS` in products/experiments/frontend/constants.ts; `MIN_EXPERIMENT_AGE`, `MIN_TOTAL_EXPOSURES` in products/experiments/backend/temporal/scheduled_recalculation_logic.py.

## B1 Wrong evaluation method [MEDIUM]

Only a read of ONE flag's value records an exposure.

| SDK | Records an exposure | Does NOT |
|---|---|---|
| posthog-js | `getFeatureFlag()`, `getFeatureFlagResult()`, `isFeatureEnabled()`, React hooks `useFeatureFlagVariantKey()`, `useFeatureFlagEnabled()`, `useFeatureFlagResult()` | `getFeatureFlagPayload()` (deprecated for this reason), `getFlags()`, `getFeatureFlagDetails()`, values passed to `onFeatureFlags`, hooks `useFeatureFlagPayload()`, `useActiveFeatureFlags()` |
| posthog-node | `evaluateFlags()` then `getFlag()` or `isEnabled()` on the result; older `getFeatureFlag()`, `getFeatureFlagResult()`, `isFeatureEnabled()` | `getFlagPayload()` on the result, `getFeatureFlagPayload()`, `getAllFlags()`, `getAllFlagsAndPayloads()` |

- **Other SDKs (Ruby, Go, PHP, mobile) follow the same shape;** check that SDK's docs.
- **Exposure capture can be switched off:** `send_event: false` in posthog-js, `sendFeatureFlagEvents: false` in posthog-node. That looks identical to the wrong method.
- **Fix:** read a single flag; if a bulk accessor is needed, fire `$feature_flag_called` yourself with the required properties (B5).

## B2 identify() timing and never-linked ids [LOW]

- **`identify()` after evaluation puts the exposure under the anonymous id.** Once the ids are linked the metric counts, except in projects that keep each event's person id as written (merging two existing persons doesn't move the earlier exposure). The risk is a second evaluation under the identified id in another variant (A3).
- **Never linked:** a second pipeline (CDP, backend) with its own anonymous id, or anonymous events without a person profile in a project that keeps person ids as written, gives exposures and almost no conversions.
- **Evidence:** for one converted person, compare the `distinct_id` of the exposure and the metric event; never linked means the converted person has no exposure; compare `properties.$lib` and the id form.
- **Fix:** `identify()` before flag evaluation; never re-`identify()` to a different distinct_id mid-session; every pipeline uses the same id from the first event.

## B3 Dedup per identity [MEDIUM]

- **posthog-js dedupes per identity across sessions by default,** so returning users who evaluated the flag before launch won't re-emit. `advanced_feature_flags_dedup_per_session: true` resets it each session. The dedup key is flag plus response (a response change sends a new event).
- **posthog-node dedupes per distinct id, flag, response and groups, in memory, for the process lifetime;** cleared on restart; at **50,000** distinct ids posthog-node empties it (`maxCacheSize` option).
- **Mobile SDKs (iOS, Android, React Native, Flutter) dedupe per session,** so the stale-dedup shape is a web concern.
- **It bites when** the flag was active before launch, the key is reused from an earlier experiment or run (the same draw too), or after a reset and relaunch on the same flag.
- **Evidence:** the flag history in `experiment-activity` (only this flag's changes, and only if the user can view the flag; it doesn't list other experiments or deleted flags with the same key, so ask); first-time visitors exposed, returning ones not.
- **Fix:** web: `advanced_feature_flags_dedup_per_session: true`; a new run: a new flag key (E15); long-lived server workers: restart more often, or fire a custom exposure event (B4) and use it as the exposure criterion (cleaner when custom properties are wanted). Repeated same-variant events are harmless; two variants are `$multiple`, excluded under the default.

## B4 Custom exposure without `$feature/<flag-key>` [HIGH]

- **A custom exposure event MUST include `$feature/<flag-key>` with the variant value** (e.g. `$feature/new-checkout: 'control'`), the exact variant key: not another spelling or case, not `true`, not another flag's key.
- **Evidence:** the custom-exposure query values ([EXPERIMENT-HEALTH.md](EXPERIMENT-HEALTH.md#variant-values-custom-exposure-event)) against `feature_flag.filters.multivariate.variants[].key`. All empty: the sender doesn't set it. Different values: the sender sets another one.
- **Who adds it:** posthog-js adds it to every event once flags are loaded, [MEDIUM] except while the flag cache is older than `feature_flag_cache_ttl_ms` when that is set. A server SDK adds it only when capture is given evaluated flags (`flags`) or asked to evaluate (`sendFeatureFlags: true` in posthog-node). [MEDIUM] CDP or hand-written events never add it.
- **Placebo or variant-less experiments still need it;** it is used for variant attribution.

## B5 Hand-sent exposures [HIGH]

- **A hand-sent exposure must carry `$feature_flag` (the flag key) and `$feature_flag_response` (a variant key).** One per person is enough.
- **To find which keys events carry:** run the raw-responses query without the `$feature_flag` condition, grouped by `properties.$feature_flag`, on one day only.

## B6 Ad-blockers and consent

- **[MEDIUM] Ad-blockers and network drops.** Fix: a reverse proxy on your own domain (https://posthog.com/docs/advanced/proxy), which ad-blockers don't block.
- **[LOW] Consent:** nothing is captured before opt-in; if flags load only after consent, reads before that return no variant.
- **[MEDIUM] posthog-js with `opt_out_capturing_by_default: true` and persistence on:** a read before opt-in returns the variant and records the exposure as sent while the event is dropped; after opt-in the same read sends nothing until the distinct id changes, so the person is never exposed unless `advanced_feature_flags_dedup_per_session` is on.

## B7 Test-account filter [HIGH]

- **`exposure_criteria.filterTestAccounts` defaults to `true`.** Your own traffic matching the filter is excluded, and an inverted rule drops every production event.
- **Evidence:** `project-get` without an id returns `test_account_filters`, an array of `{ key, type, value, operator }`; `type` is usually `person`, `event` or `cohort`, sometimes `group` or `element`. An event is kept only when it matches EVERY row. Rows are normally negative (`is_not`, `not_icontains`, `not_in` on the default cohort row); a positive row (`exact`, `icontains`, `in`) keeps only what it names.
- **Compare raw people with `exposures.total_exposures`,** adding the rows one at a time (`properties.<key>` for an event row, `person.properties.<key>` for a person row, `person_id IN COHORT <id>` for a cohort row). Summarize the rows in plain language; don't assume their contents.
- **Fix:** turn `filterTestAccounts` off for the experiment, or correct the filter. Both change which exposures count for the whole run (E5).

## B8 Metric events before exposure [HIGH]

Metric events before a person's first exposure are ignored. Example: metric `signup_completed`, exposure on a checkout page reached after signup.

```sql
SELECT
    countIf(exposure_events = 0) AS persons_with_metric_and_no_exposure,
    countIf(exposure_events > 0 AND last_metric < first_exposure) AS persons_with_every_metric_event_before_exposure,
    countIf(exposure_events > 0 AND last_metric >= first_exposure) AS persons_with_a_metric_event_after_exposure
FROM (
    SELECT
        person_id,
        countIf(event = '<resolved_exposure_event>') AS exposure_events,
        minIf(timestamp, event = '<resolved_exposure_event>') AS first_exposure,
        maxIf(timestamp, event = '<metric-event>') AS last_metric
    FROM events
    WHERE timestamp >= toDateTime('<window_start>', 'UTC')
      AND timestamp < toDateTime('<window_end>', 'UTC')
      AND (
          event = '<metric-event>'
          OR (
              event = '<resolved_exposure_event>'
              AND properties.$feature_flag = '<flag-key>'
              AND properties.$feature_flag_response IN ('<variant-key-1>', '<variant-key-2>')
          )
      )
    GROUP BY person_id
    HAVING countIf(event = '<metric-event>') > 0
)
```

- **Custom exposure:** swap the event, drop `$feature_flag`, and test `` properties.`$feature/<flag-key>` ``.
- **The second count dominating confirms B8.** The first count is large by design with rollout below 100%, release conditions, or a metric sent on other surfaces; if it dominates beyond that, converters weren't exposed (B1, B2, B10) or were exposed before the window.
- **Fix:** capture the exposure at the first encounter with the change (a late exposure can also differ between arms, A9).

## B9 Eligibility after the flag check [MEDIUM]

- **Shape:** exposures much higher than expected and low metric rates. The same shape comes from a flag read on more surfaces than tested, or a new-users experiment whose flag existing users also evaluate (D12).
- **Fix:** eligibility check, then flag check, then render ([EXPERIMENTS.md](EXPERIMENTS.md#plan-the-experiment)). Where the code can't change: an exposure-criteria filter (it removes a person only when EVERY exposure event of that person fails it) or a custom exposure event at the point of change.

## B10 Variant always undefined or false [MEDIUM]

Causes:

- **B1:** reading the payload (`getFeatureFlagPayload()` is empty for a flag without one).
- **B2:** release conditions on properties set at `identify()`.
- **`posthog is not defined`:** initialize PostHog before any flag call.
- **A read before flags loaded:** posthog-js returns `undefined` and sends no `$feature_flag_called`, unless the browser holds flags from an earlier visit.
- **The flag is genuinely off:** `feature_flag.active === false` or `status` `paused`, rollout `0%`, or the person is outside the release conditions.
- **Device-id bucketing with no device id** (A10).
- **A multivariate flag read as a boolean** (`true`), or the app replaces "no variant" with its own default.

Fix in this order: (a) is PostHog initialized? (b) is the flag active and rolled out? (c) is the right variant key requested?

## B11 `$feature/<key>` on metric events [HIGH]

- **A missing `$feature/<key>` on metric events is NOT a fault for current experiments.** Only the exposure event decides the variant; metric events need no flag property for any metric type, and adding it changes nothing.
- **It matters for:** legacy experiments (E13: migrate); a custom exposure event (B4); and the user's own insight or SQL filtering by `$feature/<flag-key>`, which undercounts server-SDK events and overcounts (the property is on events of everyone whose SDK holds the flag value, including people never exposed), so it is not a participant filter.
- **Verify `is_legacy`** (true when any primary, secondary or shared metric is legacy).
- **Part of the public docs still asks for the property on metric events;** the exposures page states the current rule. Docs: https://posthog.com/docs/experiments/exposures#metric-events-dont-need-a-variant-property
- Code: `build_variant_property` in experiment_exposure_query_builder.py reads it on the exposure side only.

## B12 An exposure filter that can't match [MEDIUM]

- **Exposure-criteria filters are evaluated per exposure event.** They read event properties, and person properties either as attached to the event or as the person holds them now (a project setting the tools don't show).
- **Shapes:** a property the exposure event lacks (a browser property on a server exposure); a person property set after exposure (only where read as attached); a misspelling; criteria copied from another experiment naming its flag or event; an exposure event never received; a URL or event-property filter meant to keep people out (it drops non-matching events, but one matching event lets the person in with everything).
- **Evidence:** `exposure_criteria.exposure_config`; the raw-responses query without and with the condition (one at a time); a person-property filter through `person.properties.<key>`.
- **Co-occurs with** B7 and D9.
- **Fix:** remove or correct it; filter on what the exposure event carries; restrict people through the flag's release conditions instead. Editing exposure criteria recomputes the whole run (E5).

## Never had exposures, or stopped

- **Never had exposures:** did the deploy ship? Is there real traffic? Does the code read the experiment's flag key? Is the date range right (a future `start_date`)? Often the flag sits on an unmerged feature branch, or the page isn't live.
- **Healthy, then stopped: check `status` first.** `exposure_frozen` is an intended plateau (enrollment closed, metrics still flow, E16); `paused` means the flag is off; `stopped` means results end at the end date.
- **Then `project-get` returns `flag_evaluations_mode`:** at **2**, `$feature_flag_called` no longer arrives in `events` for covered projects, so there are no exposures and no warning. Not an SDK or app fault: point to PostHog support.
- **Then the flag history:** a post-launch change (a variant's split at 0%, a variant pinned on a broad condition, rollout cut to 0) can explain the plateau while `status` reads `running`. No change: the app stopped calling, a cohort or property condition stopped matching, there are no new people, or the test-account filter changed (not in the experiment history).
- **Verify:** `exposures.timeseries` (one arm flat: the flag or one code path; all flat: the app, or no new people); `last_seen` per variant.
- **Causes:** the flag-reading call removed in a refactor (most common); the host page or component deprecated or rerouted; a different flag now serves the same UX.
- **Recommend:** settled: end with a conclusion (won, lost, inconclusive); don't "end and ship" on a dormant flag. To keep running: restore the call, then continue (treat the windows before and after separately) or reset and relaunch.
- **If B1, B2 and B10 are all still open,** check SDK health (an outdated SDK is one possible cause).

## Prove it

- The raw-responses query (both `$feature_flag_called` and `$experiment_exposure` when relevant) shows which responses the app sends, and the diagnosis names the step of the chain where exposures stop.
- For a custom exposure event, every row carries `$feature/<flag-key>` equal to a variant key.
- `test_account_filters` rows were read from `project-get` and summarized, not assumed.
