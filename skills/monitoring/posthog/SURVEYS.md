# Surveys

PostHog surveys collect answers as events: `survey shown`, `survey sent` and `survey dismissed`, keyed by `$survey_id` and, for responses, `$survey_submission_id`. Most outcomes are decided by two things: who is eligible (the survey's type, display conditions and targeting flags, evaluated on the client), and whether those events carry the right properties, since wrong events or properties mean responses go missing, get double-counted or lose attribution. This file covers creating surveys and implementing headless (`api`) surveys; why a survey doesn't show and how to read its responses is [SURVEYS-DEBUG.md](SURVEYS-DEBUG.md). SQL in general is [HOGQL.md](HOGQL.md).

**Contents:** [Pick the survey type](#pick-the-survey-type) · [Design for responses](#design-for-responses) · [Audience, conditions and appearance](#audience-conditions-and-appearance) · [Create, review, update, launch (MCP)](#create-review-update-launch-mcp) · [Minimal drafts](#minimal-drafts) · [API surveys in the browser](#api-surveys-in-the-browser) · [The survey event contract](#the-survey-event-contract) · [Server-side and custom mobile UI](#server-side-and-custom-mobile-ui) · [Prove it](#prove-it)

## Pick the survey type

| User's goal | Survey type | Delivery requirement |
|---|---|---|
| Feedback inside an app | `popover` | A supported PostHog SDK with surveys enabled |
| Always-available feedback button | `widget` | SDK support and a widget configuration |
| A shareable hosted form | `external_survey` | A hosted survey link; no in-app targeting |
| A custom form built in application code | `api` | The app renders questions and captures survey events |

- **In-app types are `popover`, `widget` and `api`.** A hosted form (`external_survey`) is not in-app.
- **An `api` survey is only a definition in PostHog.** PostHog does not render it; the application renders the questions and captures the survey events.
- **Mobile SDKs render only popover surveys natively,** so a custom mobile UI follows the server pattern below.
- **Inspect the current tool schema** for question types, scales, branching and translations instead of guessing their JSON shapes.
- **Infer name, purpose and questions from the request.** Ask only for missing information that changes who receives the survey or how it is delivered.

## Design for responses

Evidence: PostHog popover surveys over one week in October 2026. Response rate is the share of people who saw a survey and answered at least one question; each survey counts once.

| Design choice | Typical response rate | Compared with |
|---|---|---|
| Triggered by an event or action | 7.5% | 2.9% for a URL condition, 2.1% for none |
| First question is a single choice | 8.0% | 3.5% for a rating, 0.8% for open text |
| Shown on mobile | 13.6% | 3.2% on web |
| Middle-center modal | 12.8% | 2.8% for the default bottom-right (`right`) popup |

- **Holding other choices constant:** an open-text first question cuts the odds of a response to about a fifth; an event trigger about doubles them; a centered modal (`middle_center` or `center`) raises them about 1.8x; a choice question first and a targeted audience each raise them about 1.4 to 1.5x; a popup delay over 15 seconds cuts them by about a quarter.
- **What doesn't hold up** once other choices are held constant: the mobile difference, the 0 to 10 rating scale, and the number of questions.
- **Completion among responders** is about 57% for two questions and about 45% for three or more. The number of questions does not change how many people start.
- **Limits of the evidence:** these are correlations. With partial responses off, a person counts only after finishing every question, so partial-on surveys look better partly due to counting; turn it on to keep first answers, not to raise the rate. A centered modal interrupts more, and its higher rate does not measure that cost: suggest it only when the user wants the most responses from a short, important question. API survey rates are not comparable (they depend on how each app captures `survey shown`). Hosted forms count only people who opened the link.

Recommended patterns:

- **Apply the question advice by default.** Recommend the trigger and audience advice, but ask before adding a trigger or audience the user did not request: both change who receives the survey.
- **Trigger on the moment you ask about** via `conditions.events` (completed checkout, used a feature). Event-triggered surveys get about twice the responses of page-based ones; a URL condition alone does about as well as showing on every page. Confirm the event exists in the project before using it.
- **Make the first question one click** (single choice or a short rating). Open text first gets about a fifth of the responses. Ask "why" in an optional open question after it. Research skills prefer open text for language mining ("multiple-choice answers are artifacts of the options you gave" [coreyhaines31/marketingskills, customer-research]); both hold with a choice first and open text second.
- **Read NPS by its passives and detractors** for improvement work, and pair scores with the verbatims: "a 9 with a specific complaint beats a 10 with no comment" [coreyhaines31/marketingskills, customer-research].
- **Keep it short.** About 4 in 10 who start a two- or three-question survey stop before the end. Prefer one to three questions.
- **Turn partial responses on** with `enable_partial_responses: true`. It defaults to off when a survey is created through the API.
- **Recommend a targeted audience** (person or cohort).
- **Keep any popup delay under 15 seconds.**
- **Survey names, questions and appearance text are public content.** Don't copy private customer details into them without making that visibility clear.

## Audience, conditions and appearance

- **`conditions` holds URL, event, device and linked-flag-variant conditions.** Resolve existing event and flag identifiers before using them. A URL condition does not define a person or cohort audience.
- **`targeting_flag_filters.groups[].properties[]` targets persons, groups or cohorts.** Groups are alternative rules (OR); properties within a group must all match (AND).
- **Cohorts with behavioral filters can't be used directly for survey targeting.** In a realtime flag they fail with `"Unsupported behavioral filter for realtime bytecode"` and the cohort shows a `bytecode_error`. Offer a static snapshot (or an equivalent supported audience) and target that; a snapshot does not update with the original cohort. Get agreement first; never drop a rule or broaden the audience to make a failed request pass.
- **Hosted forms (`external_survey`) take no in-app display conditions or targeting flags.** Don't attach those fields; they need no URL display condition, cohort or linked feature flag. Enable iframe embedding only when requested.
- **Omit `appearance` unless customization is needed.** `whiteLabel: true` requires the organization's white-labelling entitlement (Enterprise); don't infer it from a custom-colors request, verify the entitlement first. `surveyPopupDelaySeconds` must be non-negative.
- **Leave unused optional fields unset.** Don't fill them with `null` as a substitute for omission: question fields and nested objects have different nullability rules.

## Create, review, update, launch (MCP)

MCP tools: `posthog:survey-create`, `posthog:survey-get`, `posthog:survey-update`, `posthog:survey-launch`, `posthog:survey-stats`, `posthog:surveys-responses-list`, `posthog:surveys-get-all`.

1. **Create** with `posthog:survey-create` and the resolved config. Omit `start_date` for a draft. If the user already asked for an immediate launch, continue through the readiness check and launch without asking again.
2. **Keep the returned survey `id`.** Later survey tools take that `id`, not a question ID, feature flag ID or survey name.
3. **Read it back** with `posthog:survey-get` and review questions, type, audience, schedule, response limit and branding. Always include the returned `_posthogUrl`. A saved configuration is not evidence that an in-app popup has rendered.
4. **Change it** by fetching first, then `posthog:survey-update`. Questions, conditions, appearance, targeting and translations may replace nested values: preserve unchanged fields and existing question IDs (they link questions to collected responses). Omit IDs only for new questions.
5. **Before `posthog:survey-launch`, confirm:** the user authorized launch for the reviewed audience and config; the survey is not archived and has no past `end_date` (when reopening, unarchive or clear or extend the end date only as authorized); for in-app delivery, surveys are enabled in the project and the SDK supports the features used; event-triggered surveys have the actual event instrumented in the app (creating an event name in configuration does not instrument that event); for `api` surveys, the app implementation handles display and capture.
6. **After launch, report the state:** draft, launched, or awaiting an SDK or setup step. For hosted forms return a verified public form URL; `_posthogUrl` is the management page, not a respondent link.

- **Zero responses right after launch don't prove delivery failed.** For a survey that should have been shown, follow [SURVEYS-DEBUG.md](SURVEYS-DEBUG.md).
- **On errors, read the validation field and reason before retrying.** Appearance failures: check branding entitlement and the supplied fields. Targeting failures: check cohort support and rule structure.
- **Creation is not idempotent.** After a timeout or uncertain result, look for an existing draft with `posthog:surveys-get-all` before retrying; a matching name alone is not proof it is the same survey.

## Minimal drafts

JSON for `posthog:survey-create`.

In-app NPS (no audience restriction; add display conditions and targeting before launch):

```json
{
  "name": "Product recommendation feedback",
  "type": "popover",
  "enable_partial_responses": true,
  "questions": [
    {
      "type": "rating",
      "question": "How likely are you to recommend this product?",
      "display": "number",
      "scale": 10
    },
    {
      "type": "open",
      "question": "What is the main reason for your score?",
      "optional": true
    }
  ]
}
```

In-app CSAT after an action (replace `export_completed` with an event the project already captures):

```json
{
  "name": "Export satisfaction",
  "type": "popover",
  "enable_partial_responses": true,
  "questions": [
    {
      "type": "rating",
      "question": "How satisfied are you with this export?",
      "display": "emoji",
      "scale": 5
    },
    {
      "type": "open",
      "question": "What would make it better?",
      "optional": true
    }
  ],
  "conditions": {
    "events": { "values": [{ "name": "export_completed" }] }
  }
}
```

Product-market fit survey (Sean Ellis's question, popularized by Superhuman's Rahul Vohra [coreyhaines31/marketingskills, customer-research]; replace `[product]`; run it as a recurring pulse and segment every answer by the "Very disappointed" cohort; [customer-research] treats 40% or more "very disappointed" as likely product/market fit; its follow-ups and order are in [customer-research INTERVIEWS-AND-SURVEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/INTERVIEWS-AND-SURVEYS.md#the-pmf-survey)):

```json
{
  "name": "Product-market fit pulse",
  "type": "popover",
  "enable_partial_responses": true,
  "questions": [
    {
      "type": "single_choice",
      "question": "How would you feel if you could no longer use [product]?",
      "choices": ["Very disappointed", "Somewhat disappointed", "Not disappointed", "N/A, I no longer use it"]
    },
    {
      "type": "open",
      "question": "What type of person do you think would most benefit from [product]?",
      "optional": true
    },
    {
      "type": "open",
      "question": "What is the main benefit you receive from [product]?",
      "optional": true
    },
    {
      "type": "open",
      "question": "How can we improve [product] for you?",
      "optional": true
    }
  ]
}
```

A "How did you hear about us?" question for attribution: ask it at the conversion moment, a pick-list of known channels plus a free-text other ([marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md#self-reported-attribution)).

Hosted feedback form:

```json
{
  "name": "Product feedback form",
  "type": "external_survey",
  "questions": [
    {
      "type": "open",
      "question": "What could make this product easier to use?"
    }
  ]
}
```

Headless feedback form (the app must render and capture; use the returned survey and question IDs, don't invent them):

```json
{
  "name": "In-app feedback definition",
  "type": "api",
  "questions": [
    {
      "type": "open",
      "question": "What would you like us to improve?"
    }
  ]
}
```

## API surveys in the browser

- **Get the definition first:** `posthog:survey-get` by `id`, and note each question's `id`, `type`, `question`, choices, scale and `optional`, plus `current_iteration`. Never invent question ids. If the survey doesn't exist, create it with type `api`.
- **Read the codebase:** the framework and existing component library or design system (build from those, not a generic modal); where PostHog is initialized and the installed SDK version (`package.json` or lockfile); where the survey should appear.
- **Require posthog-js 1.249.2 or newer.** Older versions don't set the person properties and seen state on capture. Tell the user to upgrade rather than adding them by hand.
- **Let the app own the trigger.** Leave the survey's event, URL and selector `conditions` empty and run the lookup at the moment the survey should appear. `getActiveMatchingSurveys` returns a survey with event conditions only after that event fires, and nothing runs the lookup again at that point.
- **The lookup works only once both flags and the surveys bundle have loaded.** Targeting is evaluated with flags, and `getActiveMatchingSurveys` does nothing before surveys load. Register one retry for each at startup and guard against double render, since `onFeatureFlags` also runs on every flag reload (after `identify`, and after each response).

Trigger code (posthog-js):

```js
let triggered = false
let rendered = false

function tryShowSurvey() {
  if (!triggered || rendered) return
  posthog.getActiveMatchingSurveys((surveys) => {
    const survey = surveys.find((s) => s.id === SURVEY_ID)
    if (!survey || rendered) return
    rendered = true
    renderSurvey(survey)
  })
}

// Register once at startup, not per trigger.
posthog.onFeatureFlags(tryShowSurvey)
posthog.onSurveysLoaded(tryShowSurvey)

function showSurveyIfEligible() {
  triggered = true
  tryShowSurvey()
}

// Call when the survey closes, after the final send or a dismiss.
function onSurveyClosed() {
  triggered = false
  rendered = false
}
```

- **Call `showSurveyIfEligible()` from the app's trigger** (after checkout completes, say) or right after setup for page-load surveys.
- **Call `onSurveyClosed()` when the survey closes** so a repeatable survey shows again. A non-repeatable survey stays hidden because posthog-js marks it seen.
- **In an SPA, register the two listeners where the app initializes PostHog,** and call the functions they return to unsubscribe if that code can unmount.
- **Render only what `getActiveMatchingSurveys` returns.** It applies the survey's targeting for this person.

Event capture handlers (posthog-js):

```js
function onShown(survey) {
  posthog.capture('survey shown', {
    $survey_id: survey.id,
    $survey_iteration: survey.current_iteration,
  })
  // posthog-js reads this key for the survey wait period; only its own renderer writes it.
  try {
    localStorage.setItem('lastSeenSurveyDate', new Date().toISOString())
  } catch {}
}

function onSubmit(survey, answers, submissionId, completed) {
  posthog.capture('survey sent', {
    $survey_id: survey.id,
    $survey_iteration: survey.current_iteration,
    $survey_submission_id: submissionId,
    $survey_completed: completed,
    $survey_questions: survey.questions.map(({ id, question }) => ({ id, question })),
    ...Object.fromEntries(
      Object.entries(answers).map(([questionId, value]) => [`$survey_response_${questionId}`, value])
    ),
  })
}

function onDismiss(survey) {
  posthog.capture('survey dismissed', {
    $survey_id: survey.id,
    $survey_iteration: survey.current_iteration,
  })
}
```

Rules that cause silent data problems:

- **One `$survey_submission_id` per submission.** Generate it (`crypto.randomUUID()`) when the respondent starts and reuse it for every send of that submission. PostHog deduplicates and bills responses by this id; events without it each count as a separate response.
- **`$survey_completed` is `false` for a partial send and `true` for the final send.**
- **Send every answer so far on each send.** PostHog keeps the latest event per submission id.
- **Ratings as a number, multiple choice as an array of strings.** Send a `$survey_response_<question_id>` key only for answered questions.
- **Dismiss means closing without answering.** Don't send `survey dismissed` after a final `survey sent`.
- **Don't set seen state by hand in the browser.** posthog-js sets `$survey_responded/<id>[/<iteration>]` or `$survey_dismissed/...` and the local seen flag when it captures `survey sent` or `survey dismissed`; adding them yourself duplicates it.

Verify the first response:

1. `posthog:surveys-responses-list` for the survey `id` (rows resolve question text server-side). Confirm the answer is under the right question and multiple choice arrives as a list.
2. `posthog:survey-stats` for the `id`: confirm the `shown` and `sent` counts moved and one submission is one response, not two.
3. If nothing arrives, check the project token and that `survey sent` appears in live events, then follow [SURVEYS-DEBUG.md](SURVEYS-DEBUG.md). Don't guess.

## The survey event contract

| Event | When | Required properties |
|---|---|---|
| `survey shown` | The survey renders for the person | `$survey_id`, `$survey_iteration` |
| `survey sent` | Each submission, partial or final | `$survey_id`, `$survey_iteration`, `$survey_submission_id`, `$survey_completed`, `$survey_questions`, `$survey_response_<question_id>` |
| `survey dismissed` | Closes without answering | `$survey_id`, `$survey_iteration` |

- **`$survey_iteration` is `survey.current_iteration`.**
- **`$survey_response_<question_id>` values:** a rating as a number (`9`; a numeric string also works), multiple choice as an array of strings, open text as a string. Omit unanswered questions.
- **Person properties mark who has answered:** `survey sent` sets `$survey_responded/<id>` (or `$survey_responded/<id>/<iteration>`), `survey dismissed` sets `$survey_dismissed/<id>` (or `.../<iteration>`). The iteration form is used when `current_iteration` > 0. Targeting flags read these keys, so a person with them set stops matching. posthog-js 1.249.2+ sets them on capture in the browser; server SDKs must set them with `$set`.
- **The responses view and billing deduplicate `survey sent` by `$survey_submission_id`.** The latest event wins; an event with no submission id counts as its own response.
- **Read responses back with `posthog:surveys-responses-list`** instead of raw SQL: it maps each `$survey_response_<id>` key to its question text.
- **The SDK renderer also fires a fourth event, `survey abandoned`,** on page unload. `$survey_partially_completed` appears on `survey dismissed` and `survey abandoned` only, never on `survey sent`. All survey events carry `sessionRecordingUrl`. `survey shown` fires when the popup becomes visible, which is after `surveyPopupDelaySeconds`.
- **SDK shapes disagree between sources:** the API-survey event contract says "Other SDKs send the same shapes", while the debugging guide says only the web SDK sets `$survey_completed` and `$survey_submission_id` and React Native's `sendSurveyEvent` sets neither.

## Server-side and custom mobile UI

- **Fetch surveys with `GET /api/surveys/?token=<project token>`** on the project's region host (or proxy). The project token is the public project API key, not a personal API key. The response is `{"surveys": [...]}` with running, non-archived surveys; it does not apply per-person eligibility.
- **Decide eligibility with the server SDK's feature flag evaluation.** Skip any flag that is null.
  - `linked_flag_key` must be enabled when set. If `conditions.linkedFlagVariant` is set, the flag must return that variant; `any` accepts every enabled variant.
  - `targeting_flag_key` must be enabled when set.
  - `internal_targeting_flag_key` must be enabled, unless the survey can show repeatedly (`schedule` is `always`, or `conditions.events.repeatedActivation` is true with events set) or the person is finishing a partial submission. It turns off for people who responded, dismissed, or saw a survey within the wait period.
  - Apply URL, selector and device conditions in your own routing.
- **A repeatable survey skips the internal flag and the wait period.** If it sets `conditions.seenSurveyWaitPeriodInDays`, store when you last showed a survey to each person and skip until that many days pass.
- **Capture with `distinct_id`,** set `$survey_last_seen_date` on `survey shown` (the wait period reads it), and set the responded or dismissed key.

```js
// Node example. Other server SDKs take the same event, properties and $set.
function sendSurvey(posthog, distinctId, survey, answers, submissionId, completed) {
  posthog.capture({
    distinctId,
    event: 'survey sent',
    properties: {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      $survey_submission_id: submissionId,
      $survey_completed: completed,
      $survey_questions: survey.questions.map(({ id, question }) => ({ id, question })),
      ...Object.fromEntries(
        Object.entries(answers).map(([questionId, value]) => [`$survey_response_${questionId}`, value])
      ),
      $set: { [interactionKey(survey, 'responded')]: true },
    },
  })
}

function dismissSurvey(posthog, distinctId, survey) {
  posthog.capture({
    distinctId,
    event: 'survey dismissed',
    properties: {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      $set: { [interactionKey(survey, 'dismissed')]: true },
    },
  })
}

function showSurvey(posthog, distinctId, survey) {
  posthog.capture({
    distinctId,
    event: 'survey shown',
    properties: {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      $set: { $survey_last_seen_date: new Date().toISOString() },
    },
  })
}

function interactionKey(survey, kind) {
  const suffix = survey.current_iteration > 0 ? `/${survey.current_iteration}` : ''
  return `$survey_${kind}/${survey.id}${suffix}`
}
```

- **A browser rendering a server-chosen survey has two options:** capture through posthog-js (it sets person properties and local seen state), or capture on the server and call `posthog.surveys.markSurveyAsSeen(survey.id, { iteration: survey.current_iteration })` in the browser (posthog-js 1.396.6 and newer).
- **Without `$survey_submission_id` on every `survey sent`,** each one bills as its own response.
- **Without the `$set` property,** targeting keeps offering the survey.
- **Native mobile popovers capture their own events.** This section covers custom UI only.

## Prove it

- `posthog:survey-get` on the new survey returns the expected type, questions, audience, schedule and `enable_partial_responses`, and you reported its `_posthogUrl` (plus a verified public URL for a hosted form).
- An event-triggered survey's event appears in the project's events before launch.
- For an `api` survey, one test submission shows in `posthog:surveys-responses-list` under the right question (multiple choice as a list), and `posthog:survey-stats` shows `shown` and `sent` moved with one submission counted as one response.
- After responding, the person has `$survey_responded/<id>` set and the survey is no longer offered (unless it is repeatable).
