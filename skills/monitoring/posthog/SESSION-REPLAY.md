# Session replay

Session replay records what users saw and did, and it is investigated through the recording, its events, its errors and its person. Most outcomes are decided in the SDK, before anything reaches PostHog: privacy masking runs in the browser or app (masked data is never sent over the network), trigger groups and sample rates decide whether a session records at all, and the SDK's own `$recording_status` and `$sdk_debug_*` properties on each event say why a recording is missing. AI summaries and standing scanners over recordings are in [REPLAY-VISION.md](REPLAY-VISION.md); backend logs linked to a replay in [INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md#link-logs-to-replays-and-persons); replay listing SQL in [HOGQL-EXAMPLES-WEB.md](HOGQL-EXAMPLES-WEB.md).

**Contents:** [Privacy and masking](#privacy-and-masking) · [Sampling and recording controls](#sampling-and-recording-controls) · [Investigating a recording](#investigating-a-recording) · [Finding sessions to watch](#finding-sessions-to-watch) · [Missing recordings](#missing-recordings) · [Troubleshooting capture and playback](#troubleshooting-capture-and-playback) · [Query bounds](#query-bounds) · [Prove it](#prove-it)

## Privacy and masking

Privacy controls run on the client: what is masked never leaves the device.

### Web (posthog-js)

- **Inputs are masked by default.** To change it, keep passwords masked at minimum:

```javascript
session_recording: { maskAllInputs: false, maskInputOptions: { password: true /* Highly recommended as a minimum!! */ } }
```

- **`maskInputFn: (text, element) => ...` is granular** and only applies to the selected elements. Keep `maskAllInputs: true` for a global effect.
- **Text is not masked by default.** `maskTextSelector: "*"` masks all non-input text; `".email, #sensitive"` masks chosen elements. Masking applies to children, so `:not` selectors don't work. `maskTextFn` can mask only part, e.g. only emails (`ben@posthog.com` becomes `***@***********`).
- **`class="ph-no-capture"` replaces the element with a same-size block** in playback and also stops autocapture from it. Tell your team, so they don't think the product is broken.
- **Redact URLs with `maskCapturedNetworkRequestFn`.** It also runs on the page URL in snapshots:

```javascript
posthog.init('<ph_project_token>', {
    session_recording: {
        maskCapturedNetworkRequestFn: (request) => {
            if (request.name) {
                // Redact specific query params
                request.name = request.name.replace(/([?&](token|auth|email)=)[^&]+/g, '$1[REDACTED]')
                // Or strip the query string entirely:
                // request.name = request.name.split('?')[0]
            }
            return request
        },
    },
})
```

- **Maximum privacy preset:** `{ maskAllInputs: true, maskTextSelector: "*" }`.
- **Password "click to show" toggles change the type to `text`.** Check the element `id`, not only `type='password'`.
- **Selective unmask:** check `data-record="true"` inside `maskTextFn`.
- **Third-party screens you can't mask (payments, auth):** stop and start recording programmatically around them ([Sampling and recording controls](#sampling-and-recording-controls)).
- **Network capture headers and bodies may be sensitive.** Some headers are scrubbed automatically.

### React Native

- **All text, inputs and images are masked by default.** Passwords (`secureTextEntry`) are always masked.
- **Configure with** `sessionReplayConfig: { maskAllTextInputs, maskAllImages, maskAllSandboxedViews }` (`maskAllSandboxedViews` is iOS only) together with `enableSessionReplay: true`.
- **Mask one view** with `<PostHogMaskView>` (recommended) or `accessibilityLabel="ph-no-capture"`.
- **Unmask** with `accessibilityLabel="ph-no-mask"`: a case-insensitive substring match that takes precedence over `ph-no-capture`; needs posthog-ios 3.71.0 / posthog-android 3.33.0.
- **Custom input components** that don't use platform text fields are not auto-detected: mask them yourself.

### Flutter

- **Enable and mask:** `config.sessionReplay = true;` then `config.sessionReplayConfig.maskAllTexts` (default true) and `maskAllImages` (default true). Mask one widget with `PostHogMaskWidget(child: Text('Sensitive!'))`.
- **Touch positions are still recorded.** For PIN or card keypads set `config.sessionReplayConfig.captureTouches = false` before setup (Flutter SDK >= 5.41.0, posthog-android >= 3.64.0, posthog-ios >= 3.74.0), or stop and start recording per screen.
- **Flutter web canvas masking** needs Flutter SDK >= 5.34.0 and posthog-js >= 1.408.0 in `web/index.html` with `session_recording: { captureCanvas: { recordCanvas: true }, canvasCapture: { maskRegionsFn: () => null } }`. The app must be wrapped in `PostHogWidget`. Text drawn by a `CustomPainter` needs `PostHogMaskWidget`; `HtmlElementView` follows the DOM rules.
- **Platform views are masked black by default** (`maskAllPlatformViews`). Per view: `PostHogPlatformView(privacy: PostHogPlatformViewPrivacy.capture|mask, ...)`. On iOS only `WKWebView`-backed views are captured.
- **`captureNativeScreens`** (default false; Flutter >= 5.32.0) records native screens covering the app. Toggle it to false right before a sensitive native screen.

### Deleting recordings

- **Deletion is crypto-shredding of per-session keys:** the recording is unplayable immediately; metadata is purged after a 10-day grace period. It is triggered by the Persons API with `delete_recordings=true`, or by team, project or organization deletion.

## Sampling and recording controls

The controls below assume `defaults: '2026-06-25'`.

### Trigger groups (posthog-js 1.369.0+)

- **Where:** the replay ingestion settings page; admins only.
- **Each group has** URL, event and flag conditions, a sample rate, a minimum duration, and a match type `ANY` or `ALL`.
- **A session records if it matches ANY group.** A group with no conditions matches every session (its sample rate is the project rate). Deleting the last group recreates the default "Record all sessions" at 100%.
- **The sample rate applies after a group's conditions match:** an exception trigger with 20% records 20% of the sessions with exceptions. To record two patterns at different rates, make two groups.
- **Legacy controls** (posthog-js < 1.369.0, or no trigger groups): use "Create from legacy triggers" to migrate (`ANY` with sampling < 100% becomes two groups). Legacy trap: `ANY` matching with 100% sampling records every session, so the other conditions have no effect.
- **The billing limit stops ingesting recordings** when it is reached.

### Conditions

| Control | Minimum versions | Behavior |
| --- | --- | --- |
| Sampling | posthog-js 1.85.0+, React Native 4.37.0+, Flutter 5.26.0+ | Deterministic hash of the session ID against the rate; consistent across refreshes; you can't choose which sessions are sampled. Start at 100% and decrease. |
| URL trigger | web SDK 1.171.0+ for the URL-match setting | Regex auto-anchored with `^...$`: a bare `https://example.com` doesn't match subpages. All subdomains and paths: `https://([a-zA-Z0-9-]+\.)?example\.com(/.*)?` |
| Event trigger | posthog-js 1.186.0+, RN 4.52.0+, Flutter 5.25.0+ | Matches the event name only (no property filters). Exceptions can be event triggers. Mobile has no pre-buffer. |
| Feature flag trigger | | Records only users with the flag enabled. |
| Minimum duration | posthog-js 1.291.0+, RN 4.52.0+, Flutter 5.24.3+ | E.g. exclude sessions < 2 seconds. |

- **Web trigger buffer:** while a trigger is pending, the SDK keeps a full snapshot once per minute, so up to 1 minute before the trigger is kept. A full page refresh clears the buffer.
- **Strict minimum duration** `session_recording: { strictMinimumDuration: true }` (the default with `defaults` >= `2025-11-30`) checks the actual buffered continuous data; navigating before the threshold clears the buffer. Legacy mode checks session age and may miss the start after refreshes.

### Programmatic control: web

- **"Authorized domains for replay"** is deprecated: if present, add your domain (see [Troubleshooting](#troubleshooting-capture-and-playback)); prefer URL triggers.
- **Start manually:** init with `disable_session_recording: true`, then `posthog.startSessionRecording()`. It obeys the ingestion controls unless overridden with `posthog.startSessionRecording(true)` or `{ sampling, linked_flag, url_trigger, event_trigger }`. It has no effect if recordings are disabled in project settings.

### Programmatic control: React Native

- **Versions:** `posthog-react-native` >= 4.36.0 with `posthog-react-native-session-replay` >= 1.3.0. From 4.47.0+ the plugin is renamed `@posthog/react-native-plugin` (>= 2.0.1).
- **API:** `sessionReplay: false` prevents auto start; `await posthog.startSessionRecording()` (`resumeCurrent` default true); `startSessionRecording(false)` starts a new session; `stopSessionRecording()`.
- **Per screen:** listen with `navigationRef.addListener('state', ...)` and stop on screens in `IGNORED_SCREENS = ['Payment', 'Settings']`.

### Programmatic control: Flutter (>= 5.14.0; iOS, Android, Web)

- **API:** `config.sessionReplay = false`; `startSessionRecording({bool resumeCurrent = true})`, `stopSessionRecording()`, `isSessionReplayActive()` (`Future<bool>`). Manual starts still respect sampling and event triggers.
- **PIN screen:** check `isSessionReplayActive()` before stopping in `initState`; restart in `dispose` only if it was recording (on iOS `startSessionRecording()` installs replay if it is not present).
- **Ignore screens with a `NavigatorObserver`:**

```dart
const ignoredScreens = {'Payment', 'Settings'};

class RecordingByScreenObserver extends NavigatorObserver {
  void _update(Route<dynamic>? route) {
    final screenName = route?.settings.name;
    if (screenName != null && ignoredScreens.contains(screenName)) {
      Posthog().stopSessionRecording();
    } else {
      Posthog().startSessionRecording();
    }
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) => _update(route);

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) => _update(previousRoute);
}
```

## Investigating a recording

Tools: `posthog:session-recording-get`, `posthog:persons-retrieve`, `posthog:execute-sql`, `posthog:query-error-tracking-issues-list`, and for AI summaries the `posthog:vision-*` tools in [REPLAY-VISION.md](REPLAY-VISION.md#summarize-one-recording). Steps 1 to 3 are independent: gather them in parallel.

- **The recording `id` is the event `$session_id`.**
- **1. Recording and person.** `session-recording-get {"id": "<session_id>"}` returns `distinct_id`, `person`, `start_time`, `end_time`, duration, interaction counts, console error counts and viewing status. Then `persons-retrieve {"id": "<person_uuid_from_recording>"}`.
- **2. Same-session timeline (HogQL):**

```sql
SELECT
    timestamp,
    event,
    properties.$current_url AS url,
    properties.$browser AS browser,
    properties.$os AS os,
    properties.$device_type AS device_type,
    properties.$screen_width AS screen_width
FROM events
WHERE $session_id = '<session_id>'
ORDER BY timestamp ASC
LIMIT 200
```

Focused variant:

```sql
SELECT
    timestamp,
    event,
    properties.$current_url AS url,
    if(event = '$exception', properties.$exception_values[1], null) AS exception_message,
    if(event = '$exception', properties.$exception_types[1], null) AS exception_type
FROM events
WHERE $session_id = '<session_id>'
    AND event IN ('$pageview', '$pageleave', '$autocapture', '$exception', '$rageclick')
ORDER BY timestamp ASC
LIMIT 100
```

- **No rows means the events were ingested without the session ID.** Recover candidates (padded 100 s like the replay events query; `person_id` covers all distinct IDs):

```sql
SELECT
    properties.$session_id AS session_id,
    count() AS event_count,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE person_id = '<person_uuid>'
    AND timestamp >= toDateTime('<start_time>') - INTERVAL 100 SECOND
    AND timestamp <= toDateTime('<end_time>') + INTERVAL 100 SECOND
    AND properties.$session_id IS NOT NULL
GROUP BY session_id
ORDER BY event_count DESC
LIMIT 10
```

Continue only if one clearly matches, and use it only for the step 2 and 3 queries; the replay URL and Vision calls take the recording `id`.

- **3. Linked errors.** Skip this step if the console error count is 0.

```sql
SELECT DISTINCT
    properties.$exception_fingerprint AS fingerprint,
    properties.$exception_types[1] AS type,
    properties.$exception_values[1] AS message,
    count() AS occurrences
FROM events
WHERE $session_id = '<session_id>'
    AND event = '$exception'
GROUP BY fingerprint, type, message
ORDER BY occurrences DESC
LIMIT 10
```

Then `query-error-tracking-issues-list {"searchQuery": "<exception_type or message>"}` ([ERROR-TRACKING.md](ERROR-TRACKING.md)).

- **Synthesize:** Who (person properties), What (pages, actions), Problems (exceptions, console errors, rage clicks), Related issues (with status), Context (duration, device and browser, activity score).
- **Read it fairly.** Few events means a short session; don't call it broken. `start_url` frames the narrative. `person` null means anonymous: person properties won't be available, but events still are.

## Finding sessions to watch

- **The one rule: never dump an unfiltered recording list.** Apply a goal filter or sort by a signal. If the goal is unclear, ask one short question or offer a menu; the default is "most active sessions".
- **Tools:** `posthog:query-session-recordings-list` (the workhorse), `posthog:read-data-schema` (`event_properties`, `event_property_values`, `entity_property_values`), `posthog:execute-sql`, `posthog:cohorts-list`, `posthog:session-recording-playlist-create`.
- **Discover before filtering.** Never assume `$pageview` paths, a `signup_completed` event or a person property exist: check with `read-data-schema`. If the needed event or property doesn't exist, say so and suggest the closest available signal.
- **Query settings:** `filter_test_accounts: true` (the tool defaults to `false`) unless debugging your own session; `date_from` `-7d` to `-30d` for a goal, `-3d` for recent; `order` `activity_score` (interesting), `console_error_count` (broken) or `start_time` (recent); `limit: 10`.
- **Present 3 to 5 with reasons** and note the total matches. Deep link `{posthog_base_url}/replay/{id}`, never `/replay/home?sessionRecordingId={id}`.
- **Save as a playlist** with `session-recording-playlist-create` and `type: 'filters'`. Not `'collection'`: that is manual and can't carry filters.

| Goal | Filter or order |
| --- | --- |
| Reached a page (signup, onboarding, pricing, checkout friction) | `{ "type": "recording", "key": "visited_page", "operator": "icontains", "value": "/pricing" }` (confirm the real path first); order `start_time`, or `console_error_count` to surface broken ones |
| A specific feature | Two-step below: SQL for the `$session_id`s where the feature event fired, then `session_ids`; pair with `visited_page` if the feature lives on one page |
| Rage clicks, frustration | Two-step below on the `$rageclick` event, then `session_ids` |
| Errors | `{ "type": "recording", "key": "console_error_count", "operator": "gt", "value": 0 }`, order `console_error_count` |
| Feature flag | `{ "type": "flag", "key": "<flag-key>", "operator": "flag_evaluates_to", "value": "<variant or true>" }` |
| A person | `person_uuid`, a person property (`email`) or `cohort` (`cohorts-list` for the id) |
| Mobile | `{ "type": "event", "key": "$device_type", "operator": "exact", "value": ["Mobile"] }` or `{ "type": "event", "key": "$screen_width", "operator": "lt", "value": 600 }` |
| Most active | no filter, `order: "activity_score"` |
| Most active pages | SQL to rank `$pageview` by URL, then `visited_page` |

Worked query:

```json
{
  "date_from": "-14d",
  "filter_test_accounts": true,
  "order": "activity_score",
  "limit": 10,
  "properties": [
    { "type": "recording", "key": "visited_page", "operator": "icontains", "value": "/pricing" }
  ]
}
```

- **The recordings query has no event-name filter** (it filters by event properties). Use two steps: find the sessions in SQL, then pass them in.

```sql
SELECT $session_id
FROM events
WHERE event = '$rageclick'          -- or your signup/search/feature event (confirm via read-data-schema)
    AND timestamp > now() - INTERVAL 7 DAY
    AND $session_id != ''
GROUP BY $session_id
ORDER BY max(timestamp) DESC         -- recent first: UUIDs aren't time-ordered, so the LIMIT must keep the freshest sessions
LIMIT 100
```

Then query `{ "date_from": "-7d", "session_ids": [...] }` with the same window: with only `session_ids` the query falls back to the `-3d` default. Some IDs won't have recordings; that is expected.

- **Tips:** one good filter beats many: over-filtering returns nothing and reads as "no data". `activity_score` rewards raw interaction volume, so prefer a goal-based filter when one exists. Zero results: widen the dates or loosen the filter, then diagnose with [Missing recordings](#missing-recordings).

## Missing recordings

Tools: `posthog:execute-sql`, `posthog:session-recording-get`, `posthog:query-session-recordings-list`. First fix for anything odd: update posthog-js (check `window.posthog.LIB_VERSION`); very old `$lib_version`s lack the signals below.

- **Step 1: does it exist?** `session-recording-get {"id": "<session_id>"}`. `found: false` with reason `recording_not_found` means no recording in the active project: diagnose. Metadata returned means it exists and the issue is UI or filtering. Other errors (missing project, permission) are not evidence: fix them first.
- **Step 2: read the most recent event in the session.** In the UI: Activity > event > Debug properties > "Check session recording status".

```sql
SELECT
    properties.$has_recording AS has_recording,
    properties.$recording_status AS recording_status,
    properties.$session_recording_start_reason AS start_reason,
    properties.$sdk_debug_recording_script_not_loaded AS script_not_loaded,
    properties.$sdk_debug_replay_url_trigger_status AS url_trigger,
    properties.$sdk_debug_replay_event_trigger_status AS event_trigger,
    properties.$sdk_debug_replay_linked_flag_trigger_status AS flag_trigger,
    properties.$replay_sample_rate AS sample_rate,
    properties.$sdk_debug_replay_internal_buffer_length AS buffer_length,
    properties.$sdk_debug_replay_flushed_size AS flushed_size,
    properties.$lib AS sdk_library,
    properties.$lib_version AS sdk_version
FROM events
WHERE $session_id = '<session_id>'
ORDER BY timestamp DESC
LIMIT 1
```

### Signals

Not every SDK emits every signal: a missing or `null` value means "unknown", not "false".

| Property | Values |
| --- | --- |
| `$has_recording` | bool |
| `$recording_status` | `active` (recording, snapshots sent); `buffering` (waiting for a trigger, minimum duration or remote config); `disabled`; `sampled` (included by the sample rate, recording started); `paused` (consent gate, `posthog.sessionRecording.pause()`, max-duration cap); `lazy_loading` (fetching the recorder script; persistent means the script never loaded); `awaiting_config`; `missing_config` (remote config fetch failed; reload needed); `rrweb_error` (see `$sdk_debug_replay_rrweb_error`) |
| `$session_recording_start_reason` | `recording_initialized`, `sampling_override`, `sampled_out`, `linked_flag_match` |
| `$sdk_debug_replay_url_trigger_status`, `$sdk_debug_replay_event_trigger_status`, `$sdk_debug_replay_linked_flag_trigger_status` | `trigger_disabled` (no trigger of this type configured), `trigger_pending` (configured, not yet matched), `trigger_matched` |
| `$sdk_debug_replay_internal_buffer_length` / `_internal_buffer_size` / `$sdk_debug_replay_flushed_size` | events buffered / bytes buffered / bytes flushed so far |
| `$sdk_debug_recording_script_not_loaded` | rrweb not loaded (ad blockers or CSP) |
| `$replay_sample_rate` (0.0 to 1.0), `$replay_minimum_duration` (ms), `$session_recording_remote_config`, `$sdk_debug_replay_remote_trigger_matching_config` | config |
| `$lib` (`web`, `posthog-js`), `$lib_version`, `$sdk_debug_session_start` | SDK metadata |

### Verdict: first match wins

| # | Condition | Verdict | Cause and fix |
| --- | --- | --- | --- |
| 1 | `$has_recording == true` | CAPTURED | Still processing, filtered by duration, activity threshold or playlist filters, or deleted by retention (check the session's timestamp against the project's retention period). |
| 2 | `script_not_loaded == true` | AD_BLOCKED | The most common cause for individual users: uBlock Origin, AdBlock Plus, corporate CSP, Pi-hole or corporate proxies. Try without the blocker, or serve the recorder script through a proxy or custom domain. |
| 3 | `$recording_status == 'disabled'` | DISABLED | Settings > Session replay, `session_recording: { enabled: false }`, `posthog.set_config({ disable_session_recording: true })`, `disable_session_recording: true` in init, or `posthog.opt_out_capturing()`. |
| 4 | a trigger is `trigger_pending`, none `trigger_matched` | TRIGGER_PENDING | The URL pattern, event or flag never matched; the buffer is discarded at session end. Review the trigger config and test the regex against real URLs. |
| 5 | start reason `sampled_out` | SAMPLED_OUT | Expected (a 50% rate leaves about half unrecorded). Raise the rate, or use a trigger for important sessions. |
| 6 | `buffering`, buffer length 0, flushed size 0 or null | BUFFERING_EMPTY | Very short session, minimum duration not met, or navigated before the first flush. Consider lowering the minimum duration. |
| 7 | `sampled`, or `active` with flushed size > 0 | CAPTURED | May be processing or deleted by retention. |
| 8 | `paused` | PAUSED | `pause()` called, consent pending opt-in, or max duration exceeded. |
| 9 | buffer length climbs across events, flushed size stays 0 | FLUSH_BLOCKED | Script loaded but the `POST /s/` upload is blocked: an ad blocker on the ingestion endpoint, a reverse proxy not forwarding `/s/` correctly on self-hosted setups, or a custom domain mismatch between the recorder script and the capture endpoint. |
| 10 | anything else | UNKNOWN | Old SDK, stripped properties, unusual config: https://posthog.com/docs/session-replay/troubleshooting |

The diagnostic skill's own numbered list has no PAUSED step and no sampled/active CAPTURED step, and ends 7 Flush blocked, 8 Unknown; its decision-logic reference inserts steps 7 and 8 before FLUSH_BLOCKED. Its worked example labels the flush pattern "AD_BLOCKED (or misconfigured reverse proxy)", while the decision logic calls FLUSH_BLOCKED distinct from AD_BLOCKED. Treat climbing buffer with zero flush as an upload problem either way.

- **Flush-blocked trend:**

```sql
SELECT
    timestamp,
    properties.$sdk_debug_replay_internal_buffer_length AS buffer_length,
    properties.$sdk_debug_replay_flushed_size AS flushed_size
FROM events
WHERE $session_id = '<session_id>'
ORDER BY timestamp ASC
```

A buffer of 3, 17, 42, 98 with flushed 0 is the pattern. Then check the Network tab for a failed `POST /s/`, that the proxy routes `/s/` to capture, and that the recorder script is on the same domain as capture.

- **A DISABLED session typically shows every other signal null** (e.g. web 1.369.2): the SDK never reached trigger or sampling logic.
- **Project-wide, no session ID:**

```sql
SELECT
    $session_id,
    properties.$recording_status AS recording_status,
    properties.$session_recording_start_reason AS start_reason,
    properties.$sdk_debug_recording_script_not_loaded AS script_not_loaded,
    properties.$replay_sample_rate AS sample_rate
FROM events
WHERE event = '$pageview'
    AND timestamp > now() - INTERVAL 1 DAY
GROUP BY
    $session_id,
    recording_status,
    start_reason,
    script_not_loaded,
    sample_rate
ORDER BY max(timestamp) DESC
LIMIT 10
```

All `disabled`: off in project settings. All `sampled_out` with a low rate: sampling is too aggressive. All `script_not_loaded`: a CSP or deployment issue, not one user's ad blocker. A mix: diagnose per session.

## Troubleshooting capture and playback

### Not captured

- **Deprecated "Authorized domains for replay":** `https://www.example.com` blocks `https://example.com`. Use URL triggers instead.
- **`disable_session_recording`** set in init.
- **CSP blocking `recorder.js`:** check `default-src`, `script-src`, `script-src-elem` and `connect-src`.
- **Ad blockers:** set up a reverse proxy.

### Buggy playback

- **Fonts and other non-inlined assets:** allow `us.posthog.com` / `eu.posthog.com` in your CORS, and set `crossorigin="anonymous"` on stylesheet `link`s. Signed or expired image URLs can't be reconstructed.
- **Internal or intranet apps:** analytics, flags, surveys and errors work (outbound only), but non-inlined assets and server-side heatmap screenshots need a network route.
- **Late snapshot warning:** the full snapshot arrived more than 20 seconds in.
- **Rapid attribute changes** (per-frame SVG animation) are throttled: use `ph-no-capture` (masking doesn't help).
- **"Person not found":** anonymous without a profile. Identify, or set `person_profiles: 'always'`.
- **CMP cookie-loop freezes:** `persistence: "localStorage+cookie"`.
- **Cross-origin network headers** need `Access-Control-Expose-Headers`.
- **Third-party iframes** (Typeform, YouTube, Stripe Checkout, Calendly) can't be recorded.
- **Flutter web canvas masking** needs `PostHogWidget`, Flutter 5.34.0+ and posthog-js 1.408.0+.

### Filtering and linking

- **Filtering needs product analytics events** (identify at least once per session). Exceeding the product analytics limit prevents property filtering of later recordings.
- **Backend events need `$session_id`:** use the `posthog.onSessionId` callback to send it to the backend.
- **Filter semantics:** cohort-based internal filters may misbehave while cohorts calculate. Person filters match all sessions of a person (including older anonymous ones after identify). "Did not perform" applies only within the date range. Group filters match any group-tagged event.

### Tabs show as separate sessions

A different browser, profile or incognito window; different domains; `persistence` `sessionStorage` or `memory`; `cross_subdomain_cookie: false`; shared domains `herokuapp.com`, `vercel.app`, `netlify.app` (no cross-subdomain cookie: use a custom domain); `posthog.reset()` calls; session limits of 30 minutes inactivity or 24 hours.

## Query bounds

Some source examples above omit timestamp bounds. Every query on `events` must use the [canonical time-range contract](HOGQL.md); supply the investigation's explicit window before running those examples. The unbounded source snippets are not ready-to-run queries. [PostHog skills, HOGQL.md; SESSION-REPLAY.md]

## Prove it

- **Masking holds:** watch a recording of a page with a password field, an email and a `ph-no-capture` element; the password is masked, the element is a same-size block, and text matches your `maskTextSelector`. On Flutter keypads, no touches show when `captureTouches = false`.
- **Sampling is what you set:** the diagnostic query on a recent event returns the `$replay_sample_rate` you configured, and sampled-out sessions show start reason `sampled_out`.
- **A trigger fires:** after visiting a matching URL, `$sdk_debug_replay_url_trigger_status` is `trigger_matched` and `$recording_status` leaves `buffering`.
- **Uploads flow:** across a session's events, `$sdk_debug_replay_flushed_size` grows above 0 and the Network tab shows successful `POST /s/` requests.
- **A missing recording has a verdict:** `session-recording-get` plus the diagnostic query land on one verdict row above, not UNKNOWN, on a current SDK.
- **Session lists are filtered:** every list you present used `filter_test_accounts: true`, a goal filter or a signal order, and links use `/replay/{id}`.
