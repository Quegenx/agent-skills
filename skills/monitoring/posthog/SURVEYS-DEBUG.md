# Surveys: debugging and reading responses

Most "survey not showing" tickets are eligibility problems, not rendering bugs: the server returns every non-archived survey and all eligibility runs on the client, in a fixed order where the first failure wins. Most "wrong or incomplete responses" tickets are reading problems: responses are merged per `$survey_submission_id`, branching and optional questions leave gaps by design, and hand-written response keys miss legacy answers. Creating surveys and the event contract are [SURVEYS.md](SURVEYS.md); SQL in general is [HOGQL.md](HOGQL.md).

**Contents:** [Platform parity](#platform-parity) · [The web eligibility pipeline](#the-web-eligibility-pipeline) · [How a response is stored](#how-a-response-is-stored) · [Response properties](#response-properties) · [Reading responses with HogQL](#reading-responses-with-hogql) · [Debugging workflow](#debugging-workflow) · [Known causes](#known-causes) · [UI labels for fields](#ui-labels-for-fields) · [Prove it](#prove-it)

## Platform parity

| Feature | Web (posthog-js) | iOS | Android | Flutter | React Native |
|---|---|---|---|---|---|
| Rendering | DOM + shadow root | Native SwiftUI (`SurveysWindow`) | No built-in UI, delegate only | Dart widgets (`SurveyBottomSheet`) | RN components (`SurveyModal`) |
| Event-based triggers | yes (since 1.137.0, 2024-06-05) | yes | yes | yes (native side) | yes |
| URL / screen targeting | yes | decoded but NOT evaluated (`// TODO`) | decoded but NOT evaluated | NOT evaluated (native gap) | explicitly excluded in filter |
| Feature-flag / cohort targeting | yes | yes | yes | yes (native side) | yes |
| `seenSurveyWaitPeriodInDays` | yes | yes | yes | yes (native side) | stored but comparison commented out |
| `surveyPopupDelaySeconds` | yes | not implemented | not implemented | not implemented | not implemented (TODO) |
| `enable_partial_responses` | yes (>= 1.240.0) | no | no | no | no |
| `skipSubmitButton` (auto-submit) | yes (>= 1.244.0) | no | no | no | no |

The table was verified against SDK source; re-verify it if months have passed. The last two rows come from the editor's help text ("Doesn't work with the mobile SDKs for now", "Not available for the mobile SDKs at the moment"), not a per-SDK source audit.

- **`surveyPopupDelaySeconds` is web-only.** A mobile ticket blaming it is a red herring.
- **Partial responses and auto-submit are web-only.** On mobile one response is stored at the end, and a rating tap never self-submits.
- **URL targeting is effectively web-only.** iOS, Android and Flutter behave as "no URL condition"; React Native never shows the survey.
- **Android ships no survey UI.** The app or the Flutter plugin must provide a `PostHogSurveysDelegate`.
- **Flutter is hybrid:** triggering and eligibility run on native iOS/Android, rendering is Dart (`SurveyService.showSurvey` to `showModalBottomSheet`). A Flutter rendering bug lives in Dart; an eligibility bug lives in native code.
- **The React Native wait period is silently disabled.**

## The web eligibility pipeline

From `packages/browser/src/extensions/surveys.tsx` (`checkSurveyEligibility`), in order, first failure wins:

1. `isSurveyRunning`: has `start_date`, no `end_date`.
2. Survey `type` is in-app (Popover, Widget, API).
3. `linked_flag_key` enabled (if set).
4. `targeting_flag_key` enabled (if set).
5. `_internalFlagCheckSatisfied`: the auto-generated internal targeting flag.
6. `hasWaitPeriodPassed`: `seenSurveyWaitPeriodInDays` against `localStorage.lastSeenSurveyDate`.
7. `getSurveySeen`: the per-survey seen flag.

Then `getActiveMatchingSurveys` checks the URL, device and selector match, that the event or action trigger fired, and re-checks flags.

- **The server does not pre-filter.** It returns ALL non-archived surveys (`SurveyViewSet`), not filtered by the internal targeting flag.
- **There are two wait-period implementations.** `canActivateRepeatedly` (true when `schedule: 'always'`) short-circuits step 5, including its `$last_seen_survey_date` rule, but step 6 still reads `localStorage.lastSeenSurveyDate` and is NOT bypassed. So `schedule: 'always'` with `seenSurveyWaitPeriodInDays: 30` still enforces 30 days via localStorage. `lastSeenSurveyDate` updates whenever any survey is shown, completed or not.
- **The same short-circuit drops the `$survey_responded/<id> is_not_set` rule,** so `schedule: 'always'` lets one person respond repeatedly. Compare `uniq(distinct_id)` against `count()` on `survey sent`.

## How a response is stored

- **The "Response collection" radio is `enable_partial_responses`.** "Any question: when at least one question is answered" is `true`; "Complete survey: the response is stored when all questions are answered" is `false`.
- **`true` sends one `survey sent` per question answered** (on every next-button click), all sharing one `$survey_submission_id`, with `$survey_completed` running `false ... true`. **`false` sends one `survey sent`** at the end of the path.
- **Defaults differ by creation path:** the UI sets `true` for a new survey, the Django model default (and API creation) is `false`. Read the value, don't infer it.
- **Results merge to the latest answer per question per submission ID.** They include every `survey sent` and every `survey dismissed` or `survey abandoned` marked `$survey_partially_completed = true`. Raw event counts can exceed response counts.
- **The outcome chip:** "Dismissed" when the latest event is a dismissal, "Abandoned" for other unfinished submissions. "Abandoned" does not prove a page unload or timeout happened.
- **"All questions answered" means the respondent reached the end of their own branching path.** Questions skipped by branching have no key at all; `optional: true` questions clicked past are stored as `null`. On a branching survey with optional tail questions, "only the first question was answered" is the expected shape of a complete response.
- **Branching is `questions[].branching`** in four shapes: `next_question`, `end`, `specific_question` + `index`, `response_based` + `responseValues`.
- **For rating questions, `responseValues` is keyed by bucket, not value.** A missing bucket falls through to the next question (`currentQuestionIndex + 1`).

| Rating scale | Buckets |
|---|---|
| 2 | `1 → positive`, `2 → negative` |
| 3 | `1 negative`, `2 neutral`, `3 positive` |
| 5 | `≤2 negative`, `=3 neutral`, `≥4 positive` |
| 7 | `≤3 negative`, `=4 neutral`, `≥5 positive` |
| 10 | `≤6 detractors`, `≤8 passives`, `≥9 promoters` |

- **Scale 2 is inverted** (thumbs up/down, where 1 is thumbs-up). An out-of-range response throws (`'The response must be in range 1-5'`), as does an unsupported scale.
- **Single-choice branching keys `responseValues` by choice index as a string** (`{"0": 2, "1": 4}`). With `hasOpenChoice`, a response not in `choices` is treated as the last choice index. Values are an integer question index or the string `end`.

## Response properties

| Key | When |
|---|---|
| `$survey_response_<questionId>` | Current; UUID-keyed, stable across reorders |
| `$survey_response` | Legacy, for `originalQuestionIndex === 0` |
| `$survey_response_<N>` | Legacy index, only when `originalQuestionIndex` is set |

- **One event can carry both current and legacy formats.** Question ids are backend UUIDs, so the key doesn't tell you which question it is: read `questions[].id`.
- **`$survey_questions` is an array of `{id, question, response}`** over the full question list in order, on every sent, dismissed and abandoned event. `response` is a string, number or array when answered; `null` when reached but skipped as optional; absent when skipped by branching.
- **Missing `$survey_completed` is not by itself evidence of an old SDK.** Only the web SDK sets `$survey_completed` and `$survey_submission_id`; React Native sets neither, and `api` surveys carry whatever the app captures. ([SURVEYS.md](SURVEYS.md) notes the source that says otherwise.)

## Reading responses with HogQL

- **Use `getSurveyResponse(<index>, '<questionId>')`.** It coalesces the UUID key with the legacy index key; pass `true` as the third argument for multiple choice. Index and id must be literal constants taken from `questions[]`. A hand-written `properties.$survey_response_<uuid>` misses legacy answers and, inside `countIf`, inflates "unanswered". A raw property needs backticks because of the dashes.
- **Sanity check the mapping:** if a column labeled as single choice contains free text, the mapping is wrong.
- **Tables:** `events`, `persons`, and `static_cohort_people` (NOT `person_static_cohort`, which is the ClickHouse name). Run queries with the MCP `execute-sql` tool.
- **Check both email properties:** `coalesce(person.properties.$email, person.properties.email)`.
- **`sessionRecordingUrl` only proves a session id was captured.** Replay is off by default and default cloud retention is 30 days, shorter than the 180-day windows below. Open the link before citing it.

Shown against sent, before and after a change (a stable sent/shown ratio means an upstream eligibility issue; normalize by period length):

```sql
SELECT
  countIf(event = 'survey shown' AND timestamp < toDateTime('<CUTOFF>')) AS shown_before,
  countIf(event = 'survey shown' AND timestamp >= toDateTime('<CUTOFF>')) AS shown_after,
  countIf(event = 'survey sent' AND timestamp < toDateTime('<CUTOFF>')) AS sent_before,
  countIf(event = 'survey sent' AND timestamp >= toDateTime('<CUTOFF>')) AS sent_after
FROM events
WHERE properties.$survey_id = '<SURVEY_ID>' AND timestamp >= toDateTime('<WINDOW_START>')
```

Gating flag result and group context (all `false` with empty `$groups` means a group-aggregated flag without `posthog.group()`):

```sql
SELECT distinct_id, timestamp,
  properties.$feature_flag_response AS flag_response,
  properties.$groups AS groups_in_session,
  person.properties.email AS email
FROM events
WHERE event = '$feature_flag_called'
  AND properties.$feature_flag = '<FLAG_KEY>'
  AND timestamp >= toDateTime('<WINDOW_START>')
ORDER BY timestamp DESC LIMIT 50
```

Static cohort population:

```sql
SELECT cohort_id, count() AS persons,
  countIf(person.properties.$geoip_country_code = 'DE') AS in_DE
FROM static_cohort_people
WHERE team_id = <TEAM_ID> AND cohort_id IN (<IDS>)
GROUP BY cohort_id
```

Real reach by survey, before and after:

```sql
SELECT properties.$survey_id AS survey_id,
  countIf(timestamp < toDateTime('<CUTOFF>')) AS shown_before,
  countIf(timestamp >= toDateTime('<CUTOFF>')) AS shown_after,
  uniqIf(distinct_id, timestamp >= toDateTime('<CUTOFF>')) AS users_after
FROM events
WHERE event = 'survey shown' AND timestamp >= toDateTime('<WINDOW_START>')
GROUP BY survey_id HAVING shown_before > 0 OR shown_after > 0
ORDER BY shown_before DESC
```

Was partial-response collection ever on (any `completed = false` rows mean it was; `(not set)` means web SDK below 1.240.0, a non-web SDK, or a hand-rolled event):

```sql
SELECT
  coalesce(toString(properties.$survey_completed), '(not set)') AS completed,
  count() AS events,
  uniq(properties.$survey_submission_id) AS submissions,
  min(timestamp) AS first_seen, max(timestamp) AS last_seen
FROM events
WHERE event = 'survey sent' AND properties.$survey_id = '<SURVEY_ID>'
  AND timestamp >= now() - INTERVAL 180 DAY
GROUP BY completed ORDER BY events DESC
```

Full funnel including abandonment (`submissions` well above `people` means repeat responders, for example `schedule: 'always'`):

```sql
SELECT event, count() AS events,
  uniq(distinct_id) AS people,
  uniq(properties.$survey_submission_id) AS submissions
FROM events
WHERE properties.$survey_id = '<SURVEY_ID>'
  AND event IN ('survey shown', 'survey sent', 'survey dismissed', 'survey abandoned')
  AND timestamp >= now() - INTERVAL 180 DAY
GROUP BY event ORDER BY events DESC
```

Every question and answer, keyed off the survey JSON (preferred):

```sql
SELECT timestamp,
  coalesce(person.properties.$email, person.properties.email) AS email,
  getSurveyResponse(0, '<Q1_UUID>') AS q1_rating,
  getSurveyResponse(1, '<Q2_UUID>') AS q2_single_choice,
  getSurveyResponse(2, '<Q3_UUID>', true) AS q3_multiple_choice,
  properties.$survey_completed AS completed,
  properties.$survey_submission_id AS submission_id
FROM events
WHERE event = 'survey sent' AND properties.$survey_id = '<SURVEY_ID>'
  AND timestamp >= now() - INTERVAL 180 DAY
ORDER BY timestamp DESC LIMIT 60
```

Without the survey JSON, unroll `$survey_questions` (the `ifNull` avoids `Nested type Array(String) cannot be inside Nullable type`):

```sql
SELECT timestamp,
  properties.$survey_submission_id AS submission_id,
  properties.$survey_completed AS completed,
  arrayMap(x -> JSONExtractString(x, 'question'),
    JSONExtractArrayRaw(ifNull(toString(properties.$survey_questions), '[]'))) AS questions,
  arrayMap(x -> JSONExtractRaw(x, 'response'),
    JSONExtractArrayRaw(ifNull(toString(properties.$survey_questions), '[]'))) AS responses
FROM events
WHERE event = 'survey sent' AND properties.$survey_id = '<SURVEY_ID>'
  AND timestamp >= now() - INTERVAL 180 DAY
ORDER BY timestamp DESC LIMIT 60
```

Answer rate per question (is "incomplete" just branching?):

```sql
SELECT getSurveyResponse(<BRANCH_IDX>, '<BRANCHING_Q_UUID>') AS branch_answer,
  count() AS submissions,
  countIf(coalesce(getSurveyResponse(<DOWN_IDX>, '<DOWNSTREAM_Q_UUID>'), '') != '') AS answered_downstream
FROM events
WHERE event = 'survey sent' AND properties.$survey_id = '<SURVEY_ID>'
  AND coalesce(toString(properties.$survey_completed), 'true') != 'false'
  AND timestamp >= now() - INTERVAL 180 DAY
GROUP BY branch_answer ORDER BY branch_answer
```

Shown to sent latency (pairs each response with the `survey shown` just before it; in partial mode it measures time to first answer; sub-10-second completions on a multi-question survey point at `skipSubmitButton` plus a centered popup):

```sql
SELECT session, submission_id, shown_at, sent_at,
  dateDiff('second', shown_at, sent_at) AS seconds_to_submit
FROM (
  SELECT $session_id AS session, event, timestamp AS sent_at,
    coalesce(nullIf(properties.$survey_submission_id, ''), toString(uuid)) AS submission_id,
    max(if(event = 'survey shown', timestamp, NULL)) OVER (
      PARTITION BY $session_id ORDER BY timestamp
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS shown_at
  FROM events
  WHERE properties.$survey_id = '<SURVEY_ID>'
    AND event IN ('survey shown', 'survey sent')
    AND timestamp >= now() - INTERVAL 180 DAY
)
WHERE event = 'survey sent' AND shown_at IS NOT NULL
ORDER BY seconds_to_submit ASC
LIMIT 1 BY submission_id
LIMIT 60
```

Replay link per response:

```sql
SELECT timestamp, distinct_id,
  coalesce(person.properties.$email, person.properties.email) AS email,
  properties.sessionRecordingUrl AS replay_url,
  properties.$survey_submission_id AS submission_id, $session_id
FROM events
WHERE event = 'survey sent' AND properties.$survey_id = '<SURVEY_ID>'
  AND timestamp >= now() - INTERVAL 180 DAY
ORDER BY timestamp DESC
LIMIT 1 BY coalesce(nullIf(properties.$survey_submission_id, ''), toString(uuid))
LIMIT 60
```

## Debugging workflow

1. **Parse the report:** org/project ID, instance (US or EU), survey ID(s), `lib`, the precise symptom, what was tried. If the report is aged or has prior replies, the config may have been edited since: treat earlier claims as stale and re-pull current state.
2. **Separate "none" from "fewer"** with shown against sent. A stable sent/shown ratio means upstream eligibility.
3. **For a data-quality report, separate "incomplete" from "complete but sparse"** (branching plus optional questions).
4. **Check platform parity** (table above).
5. **Pull the definition** with `GET /api/projects/<id>/surveys/<sid>/` and inspect `conditions` (events, url, `seenSurveyWaitPeriodInDays`, `repeatedActivation`), `appearance.surveyPopupDelaySeconds`, `appearance.position`, `schedule`, `linked_flag`, `targeting_flag`, `internal_targeting_flag.filters`, `responses_limit`, `iteration_*`, `enable_partial_responses`, and per question `id`, `type`, `scale`, `optional`, `skipSubmitButton`, `branching`.
6. **For "stopped showing", read the activity log:** `GET /api/projects/<id>/activity_log/?scope=FeatureFlag&item_id=<flag_id>&limit=20`, and `?scope=Survey&item_id=<sid>`.
7. **Confirm with `$feature_flag_called` and `$groups`,** and use `survey shown` for real reach.
8. **Diagnose against the known causes,** confirm with one query, then report.

- **Use read-only PostHog MCP tools first:** `survey`, `feature-flag`, `cohorts`, `execute-sql`, `activity-log`, `persons`.
- **Before calling it an SDK bug:** read the survey JSON (per-question fields), reproduce in Preview, read the SDK source for the handler, and re-check your own query ("89% incomplete" is more often a bad key mapping).

## Known causes

**Fewer users than expected**

- **Popup delay plus URL re-check (web).** After `surveyPopupDelaySeconds`, `doesSurveyUrlMatch` re-checks the current URL; navigating during the delay silently drops the survey, with no `survey shown`. Fix: lower the delay to 0 to 2 seconds.
- **Wait period plus other surveys.** Any survey shown updates `lastSeenSurveyDate`. Fix: lower the wait period or pause competing surveys.
- **Cohort composition changed.** Static snapshots taken after a dynamic cohort edit inherit the narrower definition. Check the flag activity log and `static_cohort_people`.

**Event-based survey never fires**

- **Timing race at session start:** the event fires before `/api/surveys` returns. Trigger on a slightly later event.
- **Group-aggregated `linked_flag` without `posthog.group(<index>, <key>)` before the event:** the flag returns false. Signature: `$feature_flag_called` false with empty `$groups`, and `$feature/<key>` missing from the trigger events. Fix: set group context, or switch to a person-level flag.
- **Survey wired to the wrong flag:** confirm `linked_flag.key` and `targeting_flag.key` from the API.
- **Behavioral cohort in a realtime flag:** target a static copy.

**Incomplete responses**

- Branching skipped the questions; they are `optional: true`; partial responses are on and you are reading intermediate raw events; or the response keys were guessed.

**"Didn't mean to submit"**

- **`skipSubmitButton` ("Automatically submit on selection")** removes the submit button: one click records and advances, with no debounce or confirm. It applies to rating and single choice without an open choice, is web-only, and is on by default in every survey template and quick-create. It compounds with `appearance.position: middle_center`, a large `maxWidth` and a non-zero `surveyPopupDelaySeconds`. Diagnose with shown to sent latency and replay. Fix: uncheck the setting, don't move the question.

**Zero responses in the UI but raw events exist**

- **Max AI `edit_survey` corrupted the definition.** It rebuilds questions from `QUESTION_TYPE_MAP` (`nps` to scale 10, `csat` to scale 5), and its `id` expects 1-indexed labels (`"1"`, `"2"`): a real UUID makes it generate a fresh UUID, so old responses no longer join. Fix: PATCH `questions` back to the original UUIDs and type, and edit question text via the UI. Avoid asking Max to reorder questions that have historical responses.

**Other**

- **A cohort count showing 0 while populated** is a cosmetic UI bug that doesn't affect targeting. Confirm via `static_cohort_people`.
- **The stats UI can undercount against raw `survey shown`.** Trust raw events.

## UI labels for fields

When telling a user what to change, use the UI label, not the field name.

| Field | UI label |
|---|---|
| `surveyPopupDelaySeconds` | "Delay survey popup by at least N seconds once the display conditions are met" |
| `seenSurveyWaitPeriodInDays` | "Survey wait period" / "Don't show this survey if another one was shown to the user in the last N days" |
| `skipSubmitButton` | "Automatically submit on selection" |
| `enable_partial_responses` | "Response collection" radio |
| `optional` | "Optional" toggle |

Entity links: `https://<us|eu>.posthog.com/project/<id>/cohorts/<cohort_id>`, `.../feature_flags/<flag_id>`, `.../surveys/<survey_id>`.

## Prove it

- The shown against sent query separates "none" from "fewer", and the cause you name matches one step of the eligibility pipeline or one known cause, confirmed by one query.
- The full-funnel query's `submissions` against `people` shows whether one person is responding repeatedly.
- Every answer column comes from `getSurveyResponse` with ids from the survey JSON, and no single-choice column contains free text.
- Any replay link you cite was opened and plays.
