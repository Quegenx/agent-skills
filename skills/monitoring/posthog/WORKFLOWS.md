# Workflows and email templates

A workflow is a directed graph: `actions` (nodes) wired by `edges`, with exactly one `trigger` node. Call it a "workflow" to users; "Hog flow" and `HogFlow` are internal names. The biggest failure mode is structurally wrong graph JSON: the backend stores loose JSON, but the visual editor parses every node against a strict schema, so a malformed node saves fine and then breaks the editor for the whole workflow. Email steps use saved email templates (Unlayer design JSON): see [EMAIL-TEMPLATES.md](EMAIL-TEMPLATES.md). Subscriptions (fixed-schedule deliveries of insights, dashboards or AI prompt reports) are a separate product: see [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md).

**Contents:** [Lifecycle](#lifecycle) · [Change a live workflow](#change-a-live-workflow) · [Graph schema](#graph-schema) · [Triggers](#triggers) · [Conditions, edges and inputs](#conditions-edges-and-inputs) · [Durations and delays](#durations-and-delays) · [Exit and conversion](#exit-and-conversion) · [Push and Replay Vision steps](#push-and-replay-vision-steps) · [Worked example](#worked-example) · [Pre-submit checklist](#pre-submit-checklist) · [Prove it](#prove-it)

## Lifecycle

1. **Compose the graph.** For `function` nodes, don't guess the template: list `cdp-function-templates-list` and read `cdp-function-templates-retrieve`.
2. **`workflows-create`,** always as `draft`; it does not execute yet.
3. **`workflows-test-run`, one step at a time.** Omit `current_action_id` (or pass the trigger) to start, then feed each `nextActionId` back as `current_action_id`. To test a specific branch, set `current_action_id` to that node. `globals` is `{event, person, groups}`, shaped like the real trigger payload (best copied from a past run via `workflows-get-invocation`): an `event` trigger needs an event matching its filters; an `internal-event` trigger needs an event named in its `filters.events` and no person (for Slack, a `$slack_message_received` event with the Slack property bag). The trigger step evaluates filters for `event`, `internal-event` and warehouse-row triggers; other trigger types pass any payload through. `status=skipped` means the payload wouldn't fire the trigger: fix a fabricated payload; for a real past payload from `workflows-get-invocation`, the filter is wrong. Skip `delay` nodes (not simulated). Async side effects (HTTP, email, SMS, push) are mocked unless `mock_async_functions=false`, which fires real side effects. Read each step's trace to confirm the path taken.
4. **`workflows-logs`** gives the per-step trace (timestamp, level `DEBUG`, `LOG`, `INFO`, `WARN` or `ERROR`, message), filterable by level, text, time range and limit. It shows why a step skipped, branched or errored.
5. **Edit with `workflows-patch-graph`.** Every edit invalidates earlier tests; re-run the affected path, since a patch that validates structurally can still route the wrong way. On a draft workflow edits apply directly; on an active one they stage a draft.
6. **`workflows-enable`** sets `active`. It needs the user's explicit sign-off (never enable on your own initiative); event, webhook and manual triggers start firing on real people, and every later change goes through draft, test, publish.
7. **Batch and schedule triggers don't fire on enable.** Use `workflows-run-batch` (one-off) or `workflows-schedule-create` (RRULE). Batch scheduling needs a `workflows-blast-radius` preview and its confirm token; a schedule trigger needs no audience. Confirm `status=='active'` and that the read-only `schedules` has an active entry.
8. **Monitor by drilling down:** `workflows-global-stats` (per-workflow succeeded/failed over a window, most-failing first), then `workflows-stats` (one workflow's hour/day/week series, broken down by kind/name), then `workflows-list-invocations` (per-recipient outcomes with status, error_kind/error_message, distinct_id, person_id, timings; filter `status=failed`), then `workflows-get-invocation` (`invocation_globals`, the raw triggering payload), then `workflows-logs` (the failing step).

- **Other tools:** `workflows-archive` (retire), `workflows-list` (name, status, version, trigger, timestamps), `workflows-get` (full definition, staged `draft`/`draft_updated_at`, null when nothing is staged, and read-only `schedules`; there is no separate list-schedules tool), `workflows-run-batch` (one run per matching person), `workflows-blast-radius` (how many people a set of audience filters matches), `workflows-update-schedule` (RRULE, start time, timezone, variable overrides), `workflows-list-batch-jobs` (past one-off and scheduled batch runs with their audience filters and variable overrides; no per-run status, use logs or stats).
- **`workflows-patch-graph` ops:** `update_action`, `add_action`, `remove_action`, `add_edge`, `remove_edge`, `replace_action_edges`. The patch is atomic (read, apply in order, validate, save only if valid). `update_action` deep-merges, and a `null` leaf deletes a key. The response echoes the full graph, so don't re-fetch before the next edit.
- **`workflows-update`, sources disagree:** the main workflow guide says it covers only `name`, `description`, `exit_condition`, `conversion`, `trigger_masking` and `variables`, and rejects `actions`/`edges` outright (a partial list would silently drop every step it omits); the lifecycle reference calls it a fallback editor and an escape hatch to replace the whole workflow when `workflows-patch-graph` won't land a change, where on an active workflow content fields stage a draft and name/description apply live. Both call `workflows-patch-graph` the way to edit the graph.
- **Never send:** `bytecode` (on any filter, trigger, condition, conversion or masking; compiled server-side from `properties`/`hash`), the top-level `trigger` (derived from the trigger node, read-only; set the trigger by adding the node), `billable_action_types`, `version`, `id`, `created_*`.

### Audience rules

- **Behavioral targeting is unsupported** ("did X at least N times over M days") as a trigger or a batch audience. Reject it and explain; don't approximate it with a broken filter. The backend rejects behavioral cohorts in batch audiences.
- **Batch audiences take person properties and static or property-based cohorts only.** Event and action filters are silently dropped, so reject them.
- **Prefer audiences that re-evaluate** (inline person-property conditions or a dynamic, filter-based cohort) as people qualify. A static cohort is a frozen list; use it only for an explicitly given set.

## Change a live workflow

- **Edits stage a draft.** The first edit copies the live graph; `workflows-get` shows `draft`, while live stays in `actions`/`edges`. Metadata (name, description) applies live immediately.
- **Test the draft** with `workflows-test-run` and `use_draft=true`, always before `workflows-publish`. Re-test every path you changed.
- **Publish in two calls.** `workflows-publish` without `confirm` returns `in_flight_runs`, `confirm_token` and `impact` (per deleted step: about how many people are parked there and whether they move to a surviving step, `moves_to`, or exit; `empty_variables` that may render empty for people already past their new producer, a structural warning that can fire even when everyone in flight is upstream; `schedule_conflicts` where a schedule overrides a variable the draft removes). Echo the impact, get the go-ahead, then call with `confirm=true` and the `confirm_token`. 409 means the draft changed; 400 means the token expired (15 minutes); preview again and re-confirm either way. Publish revalidates, so an invalid draft is rejected and the live config stays untouched.
- **Confirm value, sources disagree:** the main guide uses `confirm_token`; the lifecycle reference says the preview echoes `in_flight_runs` plus `draft_updated_at`, changes nothing, and you confirm with that exact `draft_updated_at` (409 means the draft changed under you; re-read).
- **Discard** with `workflows-discard-draft` (idempotent; live config untouched).
- **In-flight runs follow the live config after publish.** Passed steps don't re-run; a run parked on a deleted step skips to the next surviving step or exits. Shortened delays reschedule parked runs through a rate-limited sweep, no sooner than a few minutes after publish and never later than the original wake. Runs already due to wake soon keep their original earlier wake. Runs still parked shortly after publishing are expected; tell the user rather than re-publishing or treating it as a failure.
- **Roll back (or forward):** every live-content change appends a snapshot to the revision history. Use `workflows-list-revisions` (newest first), `workflows-get-revision` (one version's full content), then `workflows-restore-revision`, which copies into the draft (never live); then the normal cycle: test with `use_draft=true`, preview, confirm. Restore returns 409 if a draft is open: publish or discard it, or pass `overwrite=true`. Runs that moved or exited while the newer version was live keep their positions (their side effects happened), and pulled-earlier wake times aren't pushed later again.

## Graph schema

- **Node shape:** `id` (unique within the workflow; edges reference it by `from`/`to`), `name`, `description`, `type`, `config`, `on_error` (only `continue` or `abort`; omit for the default), `filters` (`{properties: [<cond>]}`, no bytecode), `output_variable` (`{key, result_path?, spread?}`).
- **The complete `type` set** is below. An unknown type breaks the editor's parse.

| `type` | `config` |
|---|---|
| `trigger` | See [Triggers](#triggers). Exactly one per workflow. |
| `delay` | `{ "delay_duration": "30m" }` or `{ "delay_until": {"expression": "<HogQL date>", "offset?": "-1d"}, "max_delay_duration?": "30d" }`, exactly one |
| `conditional_branch` | `{ "conditions": [ { "filters": {"properties": [<cond>]}, "name?": "" } ] }`. Condition N pairs with the `branch` edge `index: N`. Property-only ("Event filters are not allowed in conditionals"). |
| `random_cohort_branch` | `{ "cohorts": [ { "percentage": 50, "name?": "A" } ] }`. Relative weights; should sum to 100, but another total still splits traffic in the given proportions. |
| `wait_until_condition` | `{ "condition?": {"filters": {...}}, "events?": [{"filters": {...}, "name?": ""}], "max_wait_duration": "7d" }`. Events-only is valid (the server seeds `{filters: null}`); it is event-aware (`condition.filters` and each `events?[].filters` may carry `events`/`actions`); an entry naming neither an event nor an action is dropped (it would match everything). |
| `wait_until_time_window` | `{ "timezone": "UTC", "use_person_timezone?": false, "day": "weekday"\|"weekend"\|"any"\|["monday",...], "time": "any"\|["10:00","11:00"] }` |
| `function` | `{ "template_id": "<live template id>", "inputs": {...}, "mappings?": [] }`. Discover the id and inputs live. |
| `function_email` | See below |
| `function_sms` | `{ "template_id?": "template-twilio", "inputs": { ... }, "message_category_type?": "..." }`; literal id, inferred if omitted |
| `function_push` | `{ "template_id?": "template-native-push", "inputs": { ... }, "message_category_type?": "marketing"/"transactional" }`; literal id, inferred if omitted. Mobile push via FCM/APNs; `inputs` include `title`, `body`, `channels` |
| `exit` | `{ "reason?": "Done" }`. Usually one terminal exit node. |

### `function_email`

- **`template_id?`** is the literal `template-email` (inferred from the step type if omitted). **`template_uuid?`** is a saved template's UUID (from `workflows-list-email-templates`); never put it in `template_id`, though a UUID sent there is moved automatically.
- **Body:** `inputs.email.value`. With `template_uuid` and no body keys (`subject`, `text`, `html`, `design`), the server copies the body at save; you supply `from` and `to`. The copy is a snapshot; later template edits don't propagate. If you author any body key inline, your body wins and `template_uuid` is provenance only.
- **`message_category_type?`:** `marketing` or `transactional`.
- **`tracking_enabled?`** defaults to true. False means no open pixel and links aren't rewritten, so opens and clicks aren't recorded for the step; delivery, bounce and unsubscribe still are.
- **Sender:** `from: {integrationId: <sender id>}`. Rotate up to 10 senders with `integrationIds: [...]`, keeping `integrationId` as the first. Runs using the same sender list resolve to the same sender, including across multiple email steps.
- **Reuse library templates first** (`workflows-list-email-templates`); a drip campaign typically references one base template from every email step. Create one only if nothing fits ([EMAIL-TEMPLATES.md](EMAIL-TEMPLATES.md)), and reference it via `config.template_uuid`. Saving snapshots subject, text, html and design into the step. Differentiate per step with `workflows-patch-action-email`; each step's snapshot is edited independently.
- **The snapshot is one-way:** editing the library template later doesn't change steps that already referenced it, and patching a step never touches the library template. If a user expects a template edit to flow into their workflows, correct that.
- **Edit step email with `workflows-patch-action-email`, not `update_action`:** it takes the template patch's design ops plus an `email_patch` merge (subject, preheader, text, recipients) and re-renders the HTML server-side; an `update_action` that changes `design` leaves the stored `html` stale. For library templates use `workflows-patch-email-template`, not `workflows-update-email-template` (which resends the entire design JSON).

## Triggers

Trigger config by `config.type`:

- **`event`:** fires on every matching occurrence. Throttle repeats with `trigger_masking` (dedup and sampling, not behavioral filtering).
  ```json
  { "type": "event", "filters": { "events": [{ "id": "<event>", "name": "<event>", "type": "events", "order": 0, "properties": [<cond>] }], "properties": [<cond>], "filter_test_accounts": false } }
  ```
- **`webhook` and `manual`** use `template_id` `template-source-webhook`; **`tracking_pixel`** uses `template-source-webhook-pixel`. These are fixed built-in `source_webhook` templates, not in the destination catalog (`cdp-function-templates-list` is `type=destination`); omitting or guessing the id fails the create with `Template not found`. Each needs `inputs.event` and `inputs.distinct_id` wrapped in `{value: ...}`, and the values differ per trigger type; the wrong pair saves fine and then fails at trigger time:
  - webhook: `"inputs": { "event": { "value": "{request.body.event}" }, "distinct_id": { "value": "{request.body.distinct_id}" } }`
  - manual (the button POSTs `{user_id, $variables}`): `"inputs": { "event": { "value": "$workflow_triggered" }, "distinct_id": { "value": "{request.body.user_id}" } }`. Using `{request.body.event}` here makes every manual run 400 (the source template rejects an empty `event`) while the UI shows a success toast, so the workflow silently never fires.
  - tracking_pixel (a bodyless GET): `"inputs": { "event": { "value": "{request.query.ph_event}" }, "distinct_id": { "value": "{request.query.ph_distinct_id}" } }`. Body references resolve empty, and the pixel still returns a 200 GIF, so every hit is dropped with no error to retry on.
- **`batch`:** `{ "type": "batch", "filters": { "properties": [<cond>] } }`. The audience is person-property conditions and/or cohort references; no event or action filters. A recurring broadcast is a batch trigger plus a schedule (`workflows-schedule-create`; each firing re-broadcasts to the same audience). Editing `config.filters` pauses attached schedules, since the confirmed recipient count no longer holds; preview again and re-create the cadence.
- **`schedule`:** `{ "type": "schedule" }`. One person-less run per occurrence, for jobs that act on their own (for example a "Create AI task" step); no audience preview needed. Changing it to `batch` pauses schedules, because that cadence was never sized against an audience; re-create it after the blast-radius preview.
- **`internal-event` (flag-gated):** `{ "type": "internal-event", "filters": { "source": "internal-events", "events": [{ "id": "<event>", "type": "events" }], "properties": [<cond>] } }`. Fires once for each matching event on the internal-events stream; `filters.events` must name at least one allowed event id. Runs have no person, so person-dependent steps are unavailable.
  - **Slack:** event `$slack_message_received`, with properties `integration_id`, `channel`, `channel_type`, `slack_team_id`, `user`, `bot_id`, `app_id`, `subtype`, `text`, `ts`, `thread_ts`, `is_thread_reply`, `is_ext_shared_channel`, `slack_event` (the raw Slack payload). To leave draft it must include one exact `channel` property filter whose value holds one or more channel IDs (several IDs match any listed channel).
- **`trigger_masking` (top-level):** `"trigger_masking": { "hash": "{person.id}", "ttl": 3600, "threshold": null }`. It throttles an already-matching `event` trigger; it doesn't decide who enters. `hash` is a HogQL template for the dedup key (`"{person.id}"` is once per person). `ttl` is the seconds to suppress repeats of the same hash, 60 to 94608000. `threshold?` fires once per N matches (N=3 fires on the 1st, 4th, 7th...); omit it to fire once, then suppress within `ttl`. Don't send `bytecode`.

## Conditions, edges and inputs

- **Condition:** `{ "key": "plan", "value": ["pro"], "operator": "exact", "type": "person" }`, with `type` `event`, `person` or `group`.
- **Branch and wait conditions need the `filters` wrapper:** `{ "filters": { "properties": [<cond>] } }`, never a bare `{ "properties": [...] }` (that saves, the editor flags it, and it compiles to a constant). Filter shape: `{properties?, events?, actions?, source?, filter_test_accounts?}`; `source` defaults to `events`.
- **Edge:** `{ "from": "source_id", "to": "target_id", "type": "continue", "index": 0 }`. `continue` is the next step, the no-match path, or the `wait_until_condition` timeout. `branch` requires `index`; `wait_until_condition` resolves on `branch` `index: 0`.
- **A `conditional_branch` with N conditions** typically has N `branch` edges (`index: 0..N-1`) plus one `continue` edge for no match.
- **A `wait_until_condition` needs a `branch` edge at `index: 0` and a `continue` edge** (timeout). Without the `index: 0` branch it only ever advances on timeout.
- **Every non-exit node needs an outgoing edge,** or you get "No next action found".
- **Function inputs are wrapped as `{value: ...}`;** a flat string won't enable templating. Hog templating is single-curly (`{person.x}`, `{event.x}`). Liquid `{{ }}` is rejected on hog fields ("Placeholders are not allowed in this context") except on inputs that declare `templating: liquid` (the email input on `function_email` does; most others don't). Write booleans and numbers as `"{true}"`, `"{42}"`. A missing required input gives "This field is required".
- **Discover templates** with `cdp-function-templates-list` (`type=destination`), then `cdp-function-templates-retrieve` for its `inputs_schema` (exact keys, types, which are required). The catalog is live data and changes as integrations are added; don't hardcode ids. An unknown id gives "Template not found". `function_email`, `function_sms` and `function_push` take fixed literal ids instead, but still retrieve the push `inputs_schema` for `channels`.

## Durations and delays

- **Durations (`delay_duration`, `max_wait_duration`) match `^\d*\.?\d+[dhms]$`:** `30s`, `30m`, `2h`, `1d`, `1.5d` (=36h). No ISO-8601; fractions are allowed in every unit. Each unit is silently clamped (`s` at most 60, `m` at most 60, `h` at most 24, `d` at most 30), with a maximum total of 30d. So `90m` is wrong; use `1.5h`.
- **Use `delay_until` when the date differs per person** (a trial expiry, a renewal date, a booked appointment). Exactly one of `delay_duration` and `delay_until`; both or neither is rejected.
- **`delay_until.expression`** is a HogQL datetime (ISO, `HogDateTime`, or unix seconds; a bare number is seconds). A millisecond timestamp (what `Date.now()` and most SDKs produce) is rejected; divide by 1000 in the expression, or store an ISO string.
- **`offset`** is signed, `^-?\d*\.?\d+[dhms]$` (`-1d` is a day before, `2h` two hours after), and not clamped (`-45d` means 45 days). Keep the arithmetic in `offset`, not the expression, so the builder can read the step back as a property plus an offset.
- **`timezone`, `use_person_timezone`, `fallback_timezone`** apply to dates with no offset of their own (a bare `2026-03-01`); dates with an offset, `HogDateTime` and unix seconds are absolute. The default is UTC, so a date-only value means midnight UTC. **`max_delay_duration`** caps how far past the step's start the wait may run (default `30d`).
- **The expression is re-read on every wake:** a date that moves further out is honored (the run wakes at the old instant and parks again); one that moves closer is not (the run waits for the original instant, then continues at once). An unresolvable date aborts regardless of `on_error`; a broken expression fails the save with the parse error.
- **Reference person data as `person.properties.<key>` and event data as `properties.<key>`** (no `event.` prefix; `event` is the event's name in these globals, so `event.properties.<key>` resolves to nothing and aborts). Any other expression saves but shows in the editor as a read-only custom expression.

```json
{
  "id": "delay_1",
  "type": "delay",
  "config": {
    "delay_until": { "expression": "person.properties.trial_expiration_at", "offset": "-1d" },
    "max_delay_duration": "30d"
  }
}
```

## Exit and conversion

- **`exit_condition`:** `exit_only_at_end` (default), `exit_on_conversion`, `exit_on_trigger_not_matched`, `exit_on_trigger_not_matched_or_conversion`.
- **Conversion** (required by the `...conversion` variants): `filters` (property conditions only, `[{key, value, operator, type}, ...]`; an empty array means any event in the window converts), `events` (`[{ "filters": { "events": [{ "id": "<event>", "name": "<event>", "type": "events" }] } }]`), and `window`, a duration string (`"7d"`, `"12h"`, `"30m"`, `"45s"`) up to `"365d"`; omit it or send `null` for the default 90 days. `window_minutes` is silently dropped.
- **An event goal goes in `events`, never `filters`:** in `filters` it is invisible to the matcher and breaks the conversion picker. No goal at all is a silent no-op.

## Push and Replay Vision steps

### `function_push`

```json
{
  "id": "push_1",
  "name": "Re-engagement push",
  "type": "function_push",
  "config": {
    "template_id": "template-native-push",
    "inputs": {
      "distinctId": { "value": "{event.distinct_id}" },
      "channels": { "value": [6, 7] },
      "title": { "value": "Notification from {event.event}" },
      "body": { "value": "Hi {{ person.properties.first_name }}, come finish setting up.", "templating": "liquid" }
    }
  }
}
```

- **`channels` is an `integration_multi` input:** an array of integration id numbers (not objects) from `integrations-list` (`kind` `firebase` or `apns`). At least one is required, or the send throws "No push channel configured".
- **Templating differs per input:** `body` is Liquid (`{{ person.x }}` with `"templating": "liquid"`); `title` and the other strings are hog (`{event.x}`). The wrong brace style leaves the expression literal.
- **Required:** `distinctId`, `channels`, `title`. **Optional:** `body`, `image`, `data`, `ttlSeconds`, `android_*`, `ios_*`. Retrieve the `inputs_schema` for the full set. Omit `order`: the editor lays fields out in `inputs_schema` order.
- **A successful send means "accepted for delivery" only;** push has no delivered, opened or clicked signal.

### Replay Vision

Replay Vision is PostHog's AI that replays a session as video with its events and answers a question about it; each scan uses Replay Vision credits. Use the step when the next step depends on what happened in the session (session context for a Slack alert, branching on whether the user struggled). The project must record sessions, and the trigger event must carry a `$session_id`.

```json
{
  "id": "vision_1",
  "name": "Did checkout fail?",
  "type": "function",
  "config": {
    "template_id": "template-posthog-replay-vision",
    "inputs": {
      "analysis": { "value": { "type": "monitor", "prompt": "Did the user hit an error during checkout?" } }
    }
  },
  "output_variable": { "key": "replay_vision" }
}
```

- **`analysis` is a literal object:** no `templating`, no `{...}`. Types: `monitor` (`prompt`), `classifier` (`prompt`, `tags` 1 to 100), `scorer` (`prompt`, `scale: {min, max}` with max greater than min), `summarizer` (`prompt`), `scanner` (`scanner_id`). Inline types take the same optional settings as a saved scanner of that type (find saved ones with the `vision-scanners` tools). Experiment scanners are refused, because they sample variants evenly, which one triggered session can't do.
- **Defaults:** `session_id` is `{event.properties.$session_id}` (leave it unset unless the ID is in another property); `wait_for_session_end` is `true` (scans after 35 minutes quiet); set it `false` only when the trigger event comes after the session ended.
- **Result:** `{"state","output","warnings"}`, with states `succeeded`, `failed`, `skipped`, `ineligible`, `lost`. `output` is `verdict`, `tags` or `score` with `reasoning` (monitor, classifier, scorer), or `title`, `summary` and `chapters` (summarizer); every type adds `confidence`. Keep it with `output_variable` and branch on it. When `output` is null, `warnings` says why (used-up credits, a session too short or long, a failed scan).
- **Main environment only;** a child environment is refused. Caps (unless project settings change them): 100 scans a day per workflow and 500 per project (`replay_vision_scan_rate_limit_per_day`, `replay_vision_scan_team_rate_limit_per_day`); past the cap the state is `skipped` and the workflow continues.
- **Access:** the token needs `session_recording:read` (or `:write`) and `replay_scanner:write`, and the user needs access to recordings and the saved scanner; otherwise the save fails naming what is missing.

## Worked example

```json
{
  "name": "Nudge after signup",
  "description": "One day after signup, send a reminder.",
  "exit_condition": "exit_only_at_end",
  "actions": [
    {
      "id": "trigger_node",
      "name": "Signed up",
      "type": "trigger",
      "config": {
        "type": "event",
        "filters": { "events": [{ "id": "user signed up", "name": "user signed up", "type": "events", "order": 0 }] }
      }
    },
    {
      "id": "delay_1",
      "name": "Wait 1 day",
      "type": "delay",
      "config": { "delay_duration": "1d" }
    },
    {
      "id": "email_1",
      "name": "Reminder email",
      "type": "function_email",
      "config": {
        "template_id": "template-email",
        "template_uuid": "<uuid returned by workflows-create-email-template>",
        "message_category_type": "marketing",
        "inputs": {
          "email": {
            "value": {
              "to": { "email": "{person.properties.email}", "name": "" },
              "from": { "email": "hi@example.com", "name": "Example" }
            }
          }
        }
      }
    },
    {
      "id": "exit_node",
      "name": "Exit",
      "type": "exit",
      "config": { "reason": "Done" }
    }
  ],
  "edges": [
    { "from": "trigger_node", "to": "delay_1", "type": "continue" },
    { "from": "delay_1", "to": "email_1", "type": "continue" },
    { "from": "email_1", "to": "exit_node", "type": "continue" }
  ]
}
```

## Pre-submit checklist

- One trigger; usually one `exit`.
- Every node's `type` and `config` from the [schema table](#graph-schema).
- `on_error` only `continue` or `abort`.
- Literal template ids (`template-email`, `template-twilio`, `template-native-push`); webhook, manual and pixel triggers use their template ids with matching inputs.
- Every non-exit node has an outgoing edge; branch edges carry the right `index`.
- Conditions wrapped in `{ "filters": ... }`.
- Durations match the regex; each `delay` sets exactly one of `delay_duration` or `delay_until`, with no hand-written `bytecode`.
- Inputs as `{key: {value}}`; no bytecode; no top-level `trigger`.
- Replay Vision `analysis` is a literal.

## Prove it

- **The graph is well formed:** the workflow opens in the visual editor, and every item in the [pre-submit checklist](#pre-submit-checklist) holds.
- **Each step runs:** `workflows-test-run` walked from the trigger through every `nextActionId` (skipping `delay`) with a payload shaped like the real trigger, with no `status=skipped` unless intended, and re-run after the last `workflows-patch-graph`.
- **Logs are clean:** `workflows-logs` shows no `ERROR` for the test runs.
- **Enable was signed off,** and for batch or schedule triggers `status=='active'` with an active entry in `schedules`.
- **Live changes went through publish:** `workflows-publish` impact echoed to the user, then confirmed; `workflows-get` shows no lingering `draft`.
- **Failures are visible:** `workflows-list-invocations` with `status=failed` is empty, or each failure is explained through `workflows-get-invocation` and `workflows-logs`.
