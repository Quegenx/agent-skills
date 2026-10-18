# Ingestion fixes

The fix for each ingestion warning type, after [INGESTION-AND-COSTS.md](INGESTION-AND-COSTS.md) has found it and routed it here. Dropped events are gone: a fix restores the flow only from now on. SDK setup is [SETUP-WEB.md](SETUP-WEB.md); the SQL dialect is [HOGQL.md](HOGQL.md).

**Contents:** [message_size_too_large](#message_size_too_large) · [person_properties_size_violation](#person_properties_size_violation) · [group_key_too_long](#group_key_too_long) · [cannot_merge_already_identified](#cannot_merge_already_identified) · [Invalid distinct IDs](#invalid-distinct-ids) · [merge_race_condition](#merge_race_condition) · [$process_person_profile](#process_person_profile) · [Timestamps](#timestamps) · [Cookieless](#cookieless) · [AI endpoint rejections](#ai-endpoint-rejections) · [invalid_ai_token_property](#invalid_ai_token_property) · [Heatmaps](#heatmaps) · [Transformations](#transformations) · [Session replay](#session-replay) · [Prove it](#prove-it)

## message_size_too_large

Category `size`, severity `error`. The event was dropped during ingestion and never reached the events table: the enriched Kafka message exceeded about 1MB.

- **Two failure modes.** (1) Rejected at capture: the SDK gets HTTP 413; when the raw event exceeds the Kafka limit at capture's producer, capture emits this warning with `source` = `capture` and `pipeline_step` = `capture_validation` (on legacy endpoints `count` covers the whole rejected batch). Request-body-level 413s still produce no warning. (2) Dropped in the pipeline: the event passed capture (the SDK saw success), but enrichment copies the person properties and the properties of every group the event belongs to onto it, which pushes it past the limit; dropped silently.
- **The budget:** `event properties + person properties + group properties < ~1MB`. A person with about 1MB of properties makes all their events undeliverable; a bloated group makes every event tagged with that group undeliverable (many users affected at once is the group-side signature); a 700KB event can be pushed over by modest person or group properties.
- **`pipeline_step`:** `emit-event` (single event), `flush` (batched person or group writes), `capture_validation` (raw event rejected before enrichment: fix the event payload). `details` carries `event_uuid`, `distinct_id`.
- **Diagnose by pattern:** the same person recurring means an inflated profile; many persons with the same event name means a huge event payload; many persons sharing a group means inflated group properties.

```sql
SELECT length(properties) FROM events WHERE event = '<name>' ORDER BY timestamp DESC LIMIT 10
```

Hundreds of KB means the event is (most of) the problem.

```sql
SELECT length(properties) FROM persons WHERE id = '<person_id>'
```

- **Usual suspects:** base64 blobs, file contents, entire API responses, unbounded accumulation (`interaction_1`, `interaction_2`, ...).
- **Anti-patterns, posthog-js:** `posthog.capture('x', { document: bigString })`, `posthog.setPersonProperties({ history: bigObject })`, a large `register()` payload attached to every event, `posthog.group('org', id, bigSettingsObject)`. **posthog-node:** `client.capture({ properties: { $set: wholeCrmRecord } })` in sync jobs, response bodies logged into properties, `client.groupIdentify({ properties: bigObject })`.
- **Fix: send references, not payloads.** Never attach file contents, images, base64, raw documents or full API responses to properties, `$set` or `$group_set`: store them elsewhere and send an ID or URL. Keep person and group properties bounded; cap accumulating properties (counts, last-N, flags).
- **Inflated person:** needs a one-time `$unset` cleanup. It is irreversible and cohorts, flags or filters may depend on the keys: propose it, get approval, and run it as a throwaway one-off, never shipped code (see the next section).
- **Inflated group:** propose re-running `groupIdentify` with the oversized keys set to small values (group properties are overwritten per key).
- **If this and `person_properties_size_violation` fire for the same distinct IDs,** fix the person properties first.
- **Verify:** re-run the flow, re-query filtered by type with a timestamp after the fix, and confirm the missing events appear.

## person_properties_size_violation

Category `size`, severity `error`. The limit is on the order of 1MB of JSON. The event is ingested but its `$set`/`$set_once` is not applied.

- **Why it's treacherous:** the rejection is silent; it undercounts (the size check runs on a sample of person updates); and person properties are copied onto every event, so it leads to `message_size_too_large`.
- **`details`:** `person_id`, `distinct_id`.

| Growth pattern | Looks like |
|---|---|
| Dynamic keying | Keys like `interaction_1042`, `viewed_2026-07-08`, `feature_<uuid>_used`; a huge key count |
| Big payloads | A mirrored CRM record, base64 blob, full API response, `$set_once` of a signup snapshot; a few keys dominate the size |
| Deep nesting | `settings`, `metadata`, `profile` holding a deeply nested, growing object |
| Combined | The worst case, from "just sync the whole thing" integrations |

- **Profile the person:** count keys (hundreds or more means dynamic keying); rank values by size (`JSONExtractKeys(properties)` plus `length()` of each value via `posthog:execute-sql`); open the large values.
- **Find the writer:** the `$set`, `$set_once`, `identify` and `setPersonProperties` callsites.
- **Fix = a code change plus a one-time cleanup;** both are needed. Person properties are for current state (plan, role, counts, flags, last-N summaries). Dynamic keying: per-thing facts belong in events, or a bounded map if needed. Big payloads: their own storage, with a `$set` reference plus the fields you filter on. Deep nesting: flatten the leaf fields to top level.
- **Cleanup:** present the persons, keys and sizes; check cohort, flag and filter references; act only after the user agrees. Use `posthog:persons-property-delete` per key, or a one-off script (posthog-node shape):

```js
posthog.capture({
  distinctId: 'the-affected-user',
  event: 'cleanup oversized profile',
  properties: { $unset: ['crm_record', 'interaction_history'] },
})
```

- **`$unset` takes top-level key names only:** a nested path can't be unset, so unset the container and re-`$set` a slimmed value. Expect more affected persons than the samples show.
- **Verify:** send a small `$set` (e.g. `profile_cleaned_at`) and confirm it applies; no new warnings; `message_size_too_large` stopped too.

## group_key_too_long

Category `size`, severity `error`. `$groupidentify` was dropped because `$group_key` is over 400 chars; the group was not created or updated. `details` includes the truncated `groupKey`, its length and the 400 limit.

- **Causes:** a serialized object or JSON blob, a JWT or session token, a URL with query params, a concatenation bug (`${orgName}${orgDescription}` instead of `${orgId}`).
- **Fix (posthog-js):**

```js
posthog.group('organization', org.id, {
  name: org.name,
  plan: org.plan,
})
```

- **The key is the group's permanent identity:** changing it creates a new group. Use the stable database ID, not a name or email.
- **Verify:** confirm the group appears (`posthog:execute-sql` against the groups table).

## cannot_merge_already_identified

Category `merge`, severity `warning`. `$identify` or `$create_alias` asked to merge two already-identified persons and was refused. No data is lost, but events keep accumulating under two persons.

- **Silent:** the SDK call returns 2xx. Symptoms: one human with two profiles, broken funnels, inflated unique-user counts.
- **The model:** a person becomes identified the first time `identify(user_id)` links it to an anonymous session. `identify` links an anonymous person to a user, exactly once per sign-up or log-in. `alias` attaches an additional ID before or at identification. Merging two identified persons is never implicit, and no application-level API should do it.
- **`details`:** `sourcePersonDistinctId`, `targetPersonDistinctId`, `event_uuid`.
- **Causes:** `identify()` on account switching or impersonation without `reset()` on logout; two ID schemes (email vs database ID), including the same email in two cases (analytics tools "match exact strings", so `Corey@x.com` and `corey@x.com` become two people; normalize with `trim().toLowerCase()` on the client and the webhook [coreyhaines31/marketingskills, attribution]); an admin "merge duplicate accounts" feature built on `identify`/`alias`; backend jobs calling `identify` with `$anon_distinct_id` set to another user's distinct ID.
- **Fix:** `identify` only at login or signup with the canonical user ID; `reset()` on logout (especially on shared devices); one canonical ID scheme across all platforms and the backend; `alias` only before identification; remove app features that merge identified users.
- **Joining two profiles that really are one human** is a manual, one-off, irreversible administrative operation by a person, never application code.

## Invalid distinct IDs

- **`cannot_merge_with_illegal_distinct_id`** (warning): a blocklisted placeholder (`undefined`, `null`, `NaN`, `[object Object]`, `true`, `false`, `anonymous`, `guest`, `distinct_id`, ...). The merge is refused silently; otherwise every user would merge into one "undefined" person. `details`: `illegalDistinctId`, `otherDistinctId`.
- **`skipping_event_invalid_distinct_id`** (error): anything over 400 chars (a JWT, serialized object, URL, concatenation bug); the event is dropped. `details`: the truncated `distinctId` and its length.
- **Code causes:** `posthog.identify(user.id)` before the user loaded gives `"undefined"`; `posthog.alias(String(session.userId))` with a missing field gives `"undefined"` or `"null"`; an object gives `"[object Object]"`; a token passed as the ID argument; a hardcoded fallback `"anonymous"` or `"guest"` (PostHog already handles anonymous users with its own IDs).
- **Fix (posthog-js):**

```js
if (user?.id) {
  posthog.identify(user.id)
}
```

- **Call `identify` after auth resolves** (in the auth callback or effect), not on page load. Never use fallback IDs for logged-out users. Type the helper so objects and tokens can't be passed.
- **App-specific shared values** (org slugs, tenant names) slip past the blocklist and build mega persons.

## merge_race_condition

Category `merge`, severity `error`, never debounced. Concurrent merges hit the same persons and one was abandoned: the event kept flowing but the merge didn't persist. `details`: `sourcePersonDistinctId`, `targetPersonDistinctId`, the person UUIDs, `event_uuid`.

- **Causes:** `identify()` on every request, page load or render; parallel backend workers or batch jobs; retry storms; a mega person merge magnet (many humans identified with the same value: org ID, tenant name, a default). Several devices or tabs logging in at once is normal in small doses.
- **Check for a mega person first:** count each person's distinct IDs (`posthog:persons-list` or `execute-sql` on the person-distinct-ID mapping); hundreds or thousands means a merge magnet.
- **Find the caller:** look at `$identify`/`$create_alias` frequency; dozens per user per minute means identify-per-request; bursts at fixed times mean a batch job.
- **Fix:** for a mega person, fix the callsite; an already-merged mega person can't be cleanly undone, so recommend contacting PostHog support about splitting it. Frontend: `identify` once on auth state change. Backend: a single path per user (idempotency key, per-user lock, partition by user). Retries: idempotent and spaced. No PostHog setting change is needed.

## $process_person_profile

`$process_person_profile: false` marks an event as anonymous: cheaper, with no person profile.

| Type | Severity | What happened |
|---|---|---|
| `invalid_process_person_profile` | warning | A non-boolean (`"false"`, `"yes"`, `0`) was ignored and defaulted to `true`: silently back into person processing and its cost |
| `invalid_event_when_process_person_profile_is_false` | error | `$identify`, `$create_alias`, `$merge_dangerously` or `$groupidentify` sent with a valid `false`: dropped |
| `event_dropped_person_processing_disabled` | info | Person processing is off for the whole project; PostHog set `false` itself. No SDK change brings the events back; only staff can change the setting (ask PostHog support) |

- **Capture v1 endpoints** (`/i/v1/analytics/events`, `/i/v1/ai/events`): the flag is the `process_person_profile` event option, and SDKs move the legacy property into it. PostHog converts `"false"`, `"no"`, `0`, so `invalid_process_person_profile` doesn't fire; an unreadable value is dropped as `invalid_options`. Some SDKs convert it themselves and silently drop forms like `"no"`, leaving person processing on. Send a real boolean.
- **Where stringified booleans come from:** env vars and JSON configs. A global "mark everything anonymous" wrapper causes the identity-event contradiction.
- **Fix:** parse config (`value === 'true'`). In posthog-js use `person_profiles: 'identified_only'` instead of the per-event property or `'never'`. Exempt `$identify`, `$create_alias` and `$groupidentify` from wrappers. For no person processing at all, stop calling `identify`, `alias` and `group`.

## Timestamps

- **`ignored_invalid_timestamp`** (warning): the timestamp didn't parse, so the event was ingested at server arrival time. It corrupts trends, time-window funnels and imports. Late events with valid timestamps don't produce it. `details`: `value`, `reason`.
- **Causes:** locale formats (`"07/08/2026 14:32"`, `"8 Jul 2026"`), epochs as strings, seconds vs milliseconds, `Date` concatenation instead of `.toISOString()`, out-of-range years.
- **Fix (posthog-node):** send ISO 8601 with a timezone, or omit `timestamp` if you don't need it. Validate an import's conversion on a sample: mis-parsed rows land at "now" and cannot be re-dated.

```js
client.capture({
  distinctId,
  event: 'order shipped',
  timestamp: new Date(order.shippedAt).toISOString(), // '2026-07-08T14:32:00.000Z'
})
```

- **`event_dropped_too_old`** (info): older than the team's `drop_events_older_than`. `details`: event name, `distinctId`, `eventTimestamp`, `ageInSeconds`, `dropThresholdSeconds`.
- **The setting** is team-wide, minimum 1 hour, empty means no restriction. Read it with `posthog:project-get`, change it with `posthog:project-settings-update` or in project settings. Propose; the user decides.
- **Traps:** mobile offline queues deliver days-old events (a threshold in hours deletes real activity); historical imports; client clock skew.
- **Read the pattern:** a burst means an import or replay; a steady trickle hours to days old from mobile means offline queues; years old or negative means a clock problem.
- **Fix by cause:** mobile: raise the threshold to days or clear it. Import: temporarily clear it, import, restore. Junk: nothing. Clock: fix the time source or omit custom timestamps. Dropped events are gone: re-run the import. Verify mobile over several days.

## Cookieless

All six cookieless types are severity `error`.

- **`cookieless_team_disabled`:** the SDK sent cookieless events (`cookieless_mode: "always"` or `"on_reject"` in posthog-js; sentinel distinct ID `$posthog_cookieless`) but Settings > Web analytics > Cookieless tracking (stored as `cookieless_server_hash_mode`) is disabled. The events still show in Live events, which reads the stream before the pipeline. The gate stops anyone holding the public token from forcing cookieless on a project (which strips IP and user agent). Fix: enable the setting, or remove `cookieless_mode` from the config.
- **How cookieless identity works:** PostHog hashes calendar day + user agent + IP + host server-side into a rotating anonymous ID. The daily rotation is the privacy property, so events must arrive close to when they happened.

| Type | Missing hash input |
|---|---|
| `cookieless_missing_timestamp` | Event `timestamp`, `sent_at`, or arrival time |
| `cookieless_timestamp_out_of_range` | The calendar day isn't plausibly current |
| `cookieless_missing_user_agent` | `$raw_user_agent` |
| `cookieless_missing_ip` | `$ip` |
| `cookieless_missing_host` | `$host` |

- **Stock posthog-js works with no extra setup:** it sends `$raw_user_agent` and `$host`; `$ip` is never sent by the client, capture records the connection IP and ingestion attaches it.
- **Which layer broke:** user agent or host missing means a non-browser producer, or `before_send` or a rewriting proxy; `$ip` missing means a proxy or CDN not passing the client address, or middleware deleting `$ip`; timestamp missing means server batching; out of range means an import, clock skew, or a late offline flush.
- **Silent trap:** a server relay must set `$raw_user_agent`, `$host` and `$ip` from the original browser request on every cookieless event, and timestamp at capture. Without `$ip` every user hashes on the server IP and collapses into shared identities, with no warning.
- **Privacy middleware that scrubs `$ip`** must exempt cookieless events. Never import via cookieless. Clients that buffer for days are the wrong fit for cookieless mode.

## AI endpoint rejections

- **Endpoints:** `/i/v0/ai` (one event per request, multipart with an `event` part and an optional `event.properties` part); `/i/v0/ai/otel` (OTLP, protobuf or JSON); `/i/v1/ai/events` (JSON batch, same shape as v1 capture; only `misrouted_event`). The reference gives the warning `path` detail as `ai_events` and `ai_otel`; the main skill file says it carries `/i/v0/ai` or `/i/v0/ai/otel`; confirm in the current docs.
- **They reject at the edge:** v0 refuses the whole request, `/i/v1/ai/events` drops only the offending event. `count` is the events or spans that didn't land. Check `lib`/`libVersion` first.
- **`invalid_ai_event`:** the name must start with `$ai_`, and `$ai_model` must be a non-empty string (`null`, a number or empty is rejected). With `eventName` present it's an unsupported name: ordinary analytics pointed at the AI endpoint (send it to `/i/v0/e` or `/batch`), or `ai_generation` without `$` or `$AI_generation` (fix the name).
- **`invalid_ai_payload`:** `format: unknown` is the wrong content-type (OTLP needs `application/x-protobuf` or `application/json`; `application/octet-stream` lands here). `format: protobuf` or `json` is a body mismatch (a rewriting proxy, or a `content-encoding` other than gzip, the only one supported). `stage: raw` is more than 1000 spans before filtering; `stage: ai` is more than 100 AI spans after filtering; `limit` is the cap. Fix with a smaller batch or a shorter flush interval. `part` is a multipart issue: only `event` and `event.properties` are valid; per-property blob parts (`event.properties.<name>`) are no longer accepted, so put media inline in the event JSON (ingestion offloads it to blob storage). The parser error is deliberately left out of details.
- **`no_ai_spans_ingested`:** the export got 200 and nothing was ingested; `rawSpanCount`. Kept span attribute conventions: `gen_ai.*`, `ai.*`, `eve.*`, `traceloop.*`, `pydantic_ai.*`, `llm.request.type`. Causes: a wholesale OTLP export; LLM instrumentation not loaded (register it before the provider client is constructed); custom conventions (rename to `gen_ai.*`). A mixed batch with one AI span doesn't warn. Occasional is benign; sustained with no AI events, act.
- **`misrouted_event`:** a non-`$ai_` event sent to `/i/v1/ai/events`; `eventName`, `eventUuid`; the response body lists it under `details` as `misrouted_event`. The reverse (an `$ai_*` event to the standard endpoint) doesn't warn: capture routes it.

## invalid_ai_token_property

Severity `warning`. `$ai_input_tokens`, `$ai_output_tokens` or another token property wasn't a number, so it was nulled. `details`: `property`, `value`, `valueType`.

- **Causes:** `"1204"`, `"1,204"`, `"1204 tokens"`; passing the `usage` object instead of the field; `NaN` or `undefined` on streamed or failed responses.
- **Fix (posthog-node shape):** omit the property rather than sending `undefined`; prefer PostHog's LLM analytics SDK integrations. Verify with `posthog:query-llm-traces-list`.

```js
posthog.capture({
  distinctId,
  event: '$ai_generation',
  properties: {
    $ai_input_tokens: response.usage.prompt_tokens, // number
    $ai_output_tokens: response.usage.completion_tokens, // number
  },
})
```

## Heatmaps

Category `event`, severity `warning`. The event survives; only the heatmap data is discarded.

- **`invalid_heatmap_data`:** the entire payload (carries `event_uuid`). **`rejecting_heatmap_data_with_invalid_url`:** one entry whose key is empty or not a string. **`rejecting_heatmap_data_with_invalid_items`:** one entry whose value is not an array. The `rejecting_*` types include `heatmapUrl` and `session_id`.
- **Expected shape:**

```js
{
    $heatmap_data: {
        'https://app.example.com/dashboard': [   // key: the page URL, a non-empty string
            { x: 120, y: 340, target_fixed: false, type: 'click' },  // value: an ARRAY of items
        ],
    },
}
```

- **Fix:** upgrade posthog-js everywhere (hunt down pinned snippets). With current stock posthog-js don't touch `$heatmap_data`: fix proxies, `before_send` or custom transports. Hand-built: match the shape, or capture interactions as regular events.

## Transformations

`event_dropped_by_transformation` (info), from a transformation configured in Data pipelines > Transformations. `details`: `transformationId`, `transformationName`, `event`, `distinctId`.

- **Typical problems:** an over-broad filter, code that drops on unexpected input, one team's cleanup eating another team's events.
- **Tools:** `posthog:cdp-functions-list`, `posthog:cdp-functions-logs-retrieve`, `posthog:advanced-activity-logs-list`.
- **Propose changes; the user decides.** Dropped events are gone; the fix restores the flow only from now on.

## Session replay

- **Capture stage** (`source = 'capture'`, `path` `/s` or `/s/`): a 400 at the edge, so the batch is in neither `session_replay_events` nor the recording list. A batch is all-or-nothing: every `$snapshot` is folded into a single `$snapshot_items` message, and `count`/`eventCount` is the events lost. Metadata comes from `events[0]` only, so a mixed-session batch is misattributed. Replay has no SDK-info header; `lib` may be derived from the user agent and read `web`.
- **`missing_session_id`:** posthog-js and the mobile SDKs always set it. Causes: hand-rolled ingestion, session management outside the SDK, a rewriting proxy.
- **`invalid_session_id` `reason`:** `not_a_string`; `too_long` (`sessionIdLength`; a UUID is 36 chars); `invalid_charset` (outside `[A-Za-z0-9-]`: underscores, colons, slashes, dots, spaces, non-ASCII). The value itself isn't in details. The safe format is a UUID. The reference calls the limit 70 bytes, the main skill file "over 70 chars"; confirm in the current docs.
- **`missing_snapshot_data` `reason`:** `absent` (it may be a later event in the batch) or `wrong_json_type` (a string means double-encoded JSON `"[{...}]"`; also `null` or numbers). `$snapshot_data: []` is accepted by capture and rejected later as `message_contained_no_valid_rrweb_events`.
- **Consumer stage:** `replay_lib_version_too_old` (info; posthog-js 1.x below 1.75; still processed; 1.75 is the floor, go to the latest). `message_contained_no_valid_rrweb_events` (warning; chunk dropped; a rewriting proxy, compression middleware or custom transport). `message_timestamp_diff_too_large` (warning; 7 or more days; `startDiffDays`/`endDiffDays`; continuous means a clock problem, bursts on reconnect mean buffering).
- **Chunks older than 7 days are dropped by design;** recordings can't be imported after the fact. Verify with `posthog:query-session-recordings-list`.

## Prove it

- For the fixed type, `SELECT timestamp, details FROM system.ingestion_warnings WHERE type = '<warning_type>' ...` returns no rows newer than the deploy (judge by new occurrences, not by old counts shrinking).
- After a size fix, `SELECT length(properties) FROM persons WHERE id = '<person_id>'` is small, a test `$set` such as `profile_cleaned_at` applies, and the previously missing events appear.
- After a group key fix, the group appears in the groups table.
- After an identity fix, new sessions land under a single person per human. After a `merge_race_condition` fix, counts drop to the occasional benign collision (several devices logging in at once) or zero, previously affected users resolve to a single person, and no person's distinct ID count keeps climbing. After a distinct ID fix, events arrive under the correct persons.
- After a `$process_person_profile` fix, anonymous events stop creating person profiles, and persons and groups update again where they should.
- After a cookieless fix, cookieless events appear (in Explore) with computed anonymous IDs. After a transformation fix, its drop count falls to just the intended matches, the missing events arrive, and known junk (bots, internal traffic) is still dropped. After a heatmap fix, the heatmap for the affected URLs accumulates data again. After a timestamp fix, new events carry the intended times.
- After an AI token fix, `posthog:query-llm-traces-list` shows numeric token counts; after a replay fix, `posthog:query-session-recordings-list` lists the recording.
