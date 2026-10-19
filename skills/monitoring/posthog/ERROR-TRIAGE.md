# Error triage

Working the issues error tracking produces: triaging what matters, investigating one issue, grouping duplicates, suppressing noise, alerting, assigning, fixing unresolved stack traces, and joining an error to its trace, logs and replay. Most outcomes come down to picking the right signal (new, spreading to many users, or spiking, not raw occurrences) and joining records only by shared IDs: matching service and time do not prove a log or span belongs to an error. Setup, source maps, fingerprints and exception properties are in [ERROR-TRACKING.md](ERROR-TRACKING.md); more SQL in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md); replays in [SESSION-REPLAY.md](SESSION-REPLAY.md); logs and spans in [LOGS-AND-APM.md](LOGS-AND-APM.md).

**Contents:** [Tools](#tools) · [Triage](#triage) · [Investigating one issue](#investigating-one-issue) · [Grouping noisy errors](#grouping-noisy-errors) · [Suppressing noisy errors](#suppressing-noisy-errors) · [Alerts](#alerts) · [Assigning and external issues](#assigning-and-external-issues) · [Symbolication](SOURCE-MAPS.md#symbolication) · [Linking errors to traces and logs](#linking-errors-to-traces-and-logs) · [Finding the best replay](#finding-the-best-replay) · [Prove it](#prove-it)

## Tools

| Job | MCP tools |
|---|---|
| List and read issues | `posthog:query-error-tracking-issues-list`, `posthog:query-error-tracking-issue`, `posthog:query-error-tracking-issue-events`, `posthog:inbox-reports-list` |
| Change an issue (assign, rename, status) | `error-tracking-issues-partial-update` |
| Query | `posthog:execute-sql`, `posthog:query-logs`, `posthog:read-data-schema`, `logs-attribute-values-list`, `posthog:logs-count` |
| Group | `posthog:error-tracking-issues-merge-create`, `posthog:error-tracking-issues-split-create`, `posthog:error-tracking-grouping-rules-create`, `posthog:error-tracking-grouping-rules-list` |
| Suppress | `posthog:error-tracking-suppression-rules-list`, `posthog:error-tracking-suppression-rules-create` (no partial-update or destroy) |
| Alert | `posthog:error-tracking-alerts-list`, `-create`, `-partial-update`, `-delete`, `posthog:integrations-list`, `posthog:integrations-channels-retrieve` |
| Symbols | `posthog:error-tracking-symbol-sets-list`, `-retrieve`, `-download-retrieve` |
| Traces and replay | `posthog:session-recording-get`, `posthog:query-session-recordings-list`, `posthog:generate-app-url`, `posthog:apm-trace-get`, `posthog:apm-attributes-list`, `posthog:query-apm-spans` |
| Replay Vision | `posthog:vision-observations-list`, `posthog:vision-scanners-list`, `posthog:vision-scanners-scan-session` |
| Tickets | `error-tracking-external-references-create` |

## Triage

Most projects have hundreds of active issues. The ones that matter are usually new (first seen in the last 24 to 48 hours), spiking, or hitting many distinct users.

- **Pick the window from the question:** "today", "this morning", "right now" and an on-call handoff mean `dateRange: { date_from: "-24h" }`; "this week" or "since Monday" mean `-7d`.
- **Pick the signal:** new is `orderBy: "first_seen"` DESC in a tight window; high impact is `orderBy: "users"` (better than occurrences: one bot loop is many occurrences and one user); trending is `orderBy: "occurrences"` compared across a short and a long window.

```json
posthog:query-error-tracking-issues-list
{
  "status": "active",
  "orderBy": "users",
  "orderDirection": "DESC",
  "dateRange": { "date_from": "-24h" },
  "limit": 20,
  "volumeResolution": 24
}
```

- **Match `volumeResolution` to the window** (24 for `-24h`, 14 for `-14d`); one bucket gives only a total. Run a parallel new-issues query with `orderBy: "first_seen"`, `limit: 10`.
- **Mixed browser and server projects:** server errors drown the top-by-users list (a fresh `distinct_id` per invocation). Narrow with the `library` filter.
- **Read the shape:** `first_seen` in the window means new; first seen weeks ago but spiking means a regression; weeks ago and flat means background noise (surface it only if it tops the users list). Bot-only issues go to suppression.
- **Get context for the top 3 to 5** with `query-error-tracking-issue-events`, `limit: 1`, `include: ["exception", "stacktrace", "environment", "navigation", "correlation"]` (defaults to `onlyAppFrames: true`). Prefer it over raw SQL. Don't fetch replays for every issue.
- **Cluster new issues** that share `properties.$lib_version` or `properties.$exception_releases`: a rollback decision rests on the cluster.
- **Severity proxy:** "Users" for user-facing apps; for backends fall back to `sessions` or `occurrences`.
- **Check the Inbox first** if the team uses it. Don't auto-assign or auto-resolve during triage.
- **Present** a one-line headline, then a table: Issue, First seen, Users, Sessions, Sample message, Suggested action (investigate, assign, suppress, merge, resolve). Give each row's `_posthogUrl`.
- **Links:** the triage guidance allows building `/project/<project_id>/error-tracking/<id>` yourself (never a bare `/error-tracking/<id>`); the trace-linking guidance says never build links by hand and use `generate-app-url`. Prefer `_posthogUrl` or `generate-app-url`.

## Investigating one issue

1. **Read the issue.** Skip `includeSparkline` for status-only questions.

```json
posthog:query-error-tracking-issue
{
  "issueId": "<issue_id>",
  "dateRange": { "date_from": "-30d" },
  "includeSparkline": true,
  "volumeResolution": 12
}
```

2. **Read a sample event.** Set `onlyAppFrames: false` when the bug is in a third-party library or when `stacktrace.type: "resolved"` returns no frames (common for minified bundles such as React production builds). For the earliest sample, narrow `dateRange` around `first_seen` and pass `orderDirection: "ASC"` (default `DESC`). If the recent and earliest samples differ materially, the grouping is wrong.
3. **Break it down by its shape:** a spike from zero points at the app version or release (deploy regression); steady high volume at browser or OS; a ramp at geography or a feature flag; bursts then quiet at time of day or `$current_url`.

```sql
SELECT
    properties.$app_version AS app_version,
    count() AS occurrences,
    uniq(person_id) AS users,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event = '$exception'
    AND (issue_id = '<issue_id>' OR properties.$exception_issue_id = '<issue_id>')
    AND timestamp > now() - INTERVAL 30 DAY
GROUP BY app_version
ORDER BY occurrences DESC
LIMIT 20
```

- **Join on both `issue_id` and `properties.$exception_issue_id`.** The resolved `issue_id` follows fingerprint overrides for merged and split issues; filtering only on the property undercounts them.
- **All-NULL `$app_version`:** say so and suggest wiring it ([ERROR-TRACKING.md](ERROR-TRACKING.md#exception-properties)); fall back to `$exception_releases` or a `toDate(timestamp)` timeline. Don't use `$lib_version` to find the release that introduced a bug.
- **Feature flags:** `$active_feature_flags` is a `Nullable(String)` of JSON, so `arrayJoin` on it directly fails; wrap it in `ifNull(toString(...), '[]')` or `assumeNotNull`.

```sql
SELECT
    arrayJoin(JSONExtract(ifNull(toString(properties.$active_feature_flags), '[]'), 'Array(String)')) AS flag,
    count() AS occurrences,
    uniq(person_id) AS users
FROM events
WHERE event = '$exception'
    AND (issue_id = '<issue_id>' OR properties.$exception_issue_id = '<issue_id>')
    AND timestamp > now() - INTERVAL 14 DAY
    AND notEmpty(toString(properties.$active_feature_flags))
GROUP BY flag
ORDER BY occurrences DESC
LIMIT 20
```

- **This enumeration often returns identical counts across flags:** every event captures every evaluated flag key, so it shows which flags were on for the user, not which one correlates with the error. To test a hypothesis, group by the per-flag value column `` properties.`$feature/my-flag-key` AS variant `` (it carries `true`, `false` or the variant name) and compare the variant split with the project's overall exposure on the same flag in the same window. A disproportionate variant suggests the flag is involved, not a guarantee.
4. **Look around the error:**
   - **Surrounding events, plus or minus 1 hour** (the same filter as the error tracking UI): `WHERE $session_id = '<id>' AND (event = '$exception' OR event = '$pageview' OR left(event, 1) != '$')` between `toDateTime('<error_timestamp>', 'UTC')` minus and plus `INTERVAL 1 HOUR`, `LIMIT 100`. Mixed `$lib` values show server activity when the server propagates `$session_id`.
   - **Console logs:** `FROM log_entries WHERE log_source = 'session_replay' AND log_source_id = '<session_id>'`, plus or minus 1 hour, `LIMIT 200`. Empty is common.
   - **OpenTelemetry logs:** `posthog:query-logs`, plus or minus 5 minutes, `"severityLevels": ["error", "warn"]`, `serviceNames`, `"limit": 50`, `"orderBy": "earliest"`. Logs have shorter retention; `trace_id` and `span_id` are zero-padded when unset; `service.name` is a resource attribute, so use `serviceNames`, not `searchTerm`. More in [LOGS-AND-APM.md](LOGS-AND-APM.md).
5. **Report in order:** what it is, who it affects, when it started, the likely cause, the next step. Widen past 30 days only explicitly. Don't propose a fix unless it is obvious. If the issue has an `external_issues` array, mention the existing ticket.

## Grouping noisy errors

Grouping rules decide which issue an event lands in; assignment rules decide who owns it. People confuse the two.

- **Merge versus rule:** a merge is one-shot, and future events still group by their original fingerprints (a treadmill). A grouping rule is durable: at ingestion it rewrites the fingerprint of matching events to `custom-rule:<rule_id>`. The rule API takes no target issue ID, so after the rule fires, merge the `custom-rule:...` issue into the target.
- **Issues are duplicates only when all match:** the same `$lib`; the same `$exception_types`; the same top in-app frame file and function (line offsets may differ); the same message template differing only in volatile data; the same `$exception_handled`.
- **Never group:** frontend and backend errors of the same type; different SDKs; the same type with a different top file or function; caught with uncaught; similar wording without matching frames.
- **Find candidates:** `"searchQuery": "TypeError: Cannot read property"`, `"status": "active"`, `"limit": 50`, `"orderBy": "occurrences"`, `-30d`.
- **Merge:** pick the target with the most occurrences, the best name or the earliest `first_seen`. Call merge with `{ "id": "<target>", "ids": [...] }`; it is `destructive: true`, so confirm with the user. Cap about 50 source IDs per call. Merged changes can lag: wait and re-query, don't merge again. Fix the name and description with partial-update.
- **Write a rule only when** the pattern keeps producing new fingerprints and a safe filter exists. Minimum scope: SDK plus exception type plus a third dimension (`$exception_sources` or `$exception_values`). Example filters, with `filters.type: "AND"`: `$lib exact "web"`, `$exception_types exact "TypeError"`, `$exception_sources icontains "/static/checkout/"`, `$exception_values icontains "Cannot read property"`, `"description": "Cleanup: collapse noisy checkout TypeError fingerprints (web)"`.
- **Rules are evaluated in order:** list the existing ones first. The optional `assignee` field: skip it unless asked.
- **Too narrow a rule** shows as new non-rule fingerprints that keep appearing: widen it. Disabling or tightening a rule does not un-group past events: split them. UI: Project settings > Error tracking > Grouping rules.

## Suppressing noisy errors

- **Suppress** unactionable third-party errors (extensions, third-party scripts, ad blockers, beacons after navigation), browser quirks (`ResizeObserver loop limit exceeded`, `Script error.`, `Non-Error promise rejection captured`), bots and crawlers, or to sample. **Don't suppress** errors that might be actionable (use `archived` or `resolved`), to mute notifications, or to hide duplicates (group them).
- **Find candidates:** `orderBy: "occurrences"`, `-7d`, `limit: 30`, `volumeResolution: 0`. Look for high occurrences and few users (for example 50,000 occurrences, 3 users) and extension namespaces `chrome-extension://`, `moz-extension://`, `safari-extension://`. Confirm a candidate with `limit: 10`, `onlyAppFrames: false`.

| Noise | Filter |
|---|---|
| Chrome, Firefox or Safari extension | `$exception_sources icontains "<scheme>://"` |
| ResizeObserver | `$exception_values icontains "ResizeObserver loop"` |
| "Script error." | `$exception_values icontains "Script error."` AND `$exception_types exact "Error"` |
| Bots | `$raw_user_agent regex "(?i)bot"` |
| Third-party beacons | `$exception_sources icontains "<vendor-domain>"` AND a type filter |

- **`regex` is case-sensitive** (it compiles to HogVM `Operation::Regex`): add `(?i)`. Several terms: `(?i)(HeadlessChrome|bot|crawler|spider)`. `$raw_user_agent` is more reliable than the parsed `$user_agent`. AND two or more conditions; never an empty or match-all `filters`.
- **`sampling_rate`:** `1` drops everything; `0.95` drops 95% and keeps 5% as a sentinel; `0.5` drops half. When in doubt use a value below 1.0; start at `0.95`.
- **Dry-run before creating:** `query-error-tracking-issues-list` with the rule as `filterGroup`, `status: "all"` and `filterTestAccounts: false` (the rule ignores the test-account toggle at ingestion). Read every row and sum `aggregations.occurrences` and `aggregations.users`. `filterGroup` is flat AND only: for OR, `between`, `in` or `semver_*`, use HogQL. `coalesce(..., '[]')` is required, or you get "Nested type Array(String) cannot be inside Nullable type". `ilike` is icontains, equality is exact, `match(v, '<pattern>')` is regex.

```sql
SELECT
  count() AS matched,
  count(DISTINCT distinct_id) AS users,
  count(DISTINCT properties.$exception_issue_id) AS issues
FROM events
WHERE event = '$exception'
  AND timestamp > now() - INTERVAL 7 DAY
  AND arrayExists(
    v -> ifNull(ilike(v, '<pattern>'), 0),
    JSONExtract(coalesce(properties.$exception_values, '[]'), 'Array(String)')
  )
```

- **Confirm with the user** even though the API marks it `destructive: false`: show the exact filter, the matched issues with totals, and any overlap with existing rules. Too narrow is harmless; too broad destroys data.
- **Suppression applies only to new events.** Watch for 24 to 48 hours and verify with a window after creation (for example the last hour), not the 7-day estimate.
- **The agent can't edit or delete rules.** On false positives, disable the rule in Project settings > Error tracking > Suppression rules; prefer disabling to deleting.
- **To hide one issue without dropping events,** partial-update it to `status: "suppressed"`.

## Alerts

- **Built-in alerts** (UI): Slack, Discord, Teams or an HTTP webhook on issue created or reopened, at `error_tracking/configuration#selectedSetting=error-tracking-alerting` > **New notification** > **Test function** > **Create & enable**. Filter by issue properties or assignee. Spike alerts fire when the error rate significantly exceeds the historical baseline (`/docs/error-tracking/spikes.md`).
- **Other routes:** real-time destinations with a `$exception` matcher (Data pipelines > **+ New** > **Destination**), or trend alerts on a `$exception` insight (value, increase or decrease; email).

### Trigger events (exactly one per alert)

| Event | Fires | Watch out |
|---|---|---|
| `$error_tracking_issue_created` | Once per new fingerprint to issue | Floods noisy projects |
| `$error_tracking_issue_reopened` | Once per resolved to active transition | A spike on a resolved issue does not fire it |
| `$error_tracking_issue_spiking` | From the spike detector | Detector config is per project, not per alert; one spike can fire many events |

- **A vague request defaults to `_spiking`;** confirm it explicitly. Before a `_spiking` alert, check that spike detection is on (no MCP tool does this): the alert stays silent until the detector runs. Tuning the detector and volume-threshold alerts are not available through MCP.
- **Confirm trigger, channel and scope.** Never hardcode a production channel.

### Creating one

- **Dedupe first:** `error-tracking-alerts-list` with `type: ["internal_destination"]`, `limit: 1000`, paging with `offset` until `next` is null (default 100 per page). The list has no `inputs`, so read the destination from `name` and `description`. The same event, channel and scope means stop. A scoped alert and an all-issues alert to the same channel both fire. The "alerts configured" recommendation only inspects `filters.events`.
- **Slack:** `integrations-list` with `kind=slack` gives the integer id; `integrations-channels-retrieve` gives the channel id (for example `C0123ABC`, preferred over `#name` because it survives renames). **Webhooks:** `https://` only; refuse `http://`. **Linear, GitHub, GitLab:** confirm the integration with `integrations-list`.
- **Shape:** `"type": "internal_destination"`, `"template_id": "template-slack"` (or `template-webhook`, `template-discord`, `template-microsoft-teams`), `filters.events: [{ "id": "$error_tracking_issue_created", "type": "events" }]`, and `inputs.slack_workspace`, `channel`, `text`, `blocks`. Copy the block templates verbatim: they match the in-product wizard, and the full bodies per trigger and destination are in [ERROR-ALERT-TEMPLATES.md](ERROR-ALERT-TEMPLATES.md).
- **Scope to one issue** (created or reopened only): `"properties": [{ "key": "$exception_issue_id", "value": "<issue_uuid>", "operator": "exact", "type": "event" }]`; `$exception_types` and `name` work too.
- **Name it** `<trigger> · <channel> (auto)`, for example `Issue spiking · #oncall (auto)`; never the issue title.
- **Verify** by echoing the name, trigger, destination and a preview; never echo workspace ids or webhook URLs. Disable with `enabled: false`.
- **Keep it cheap:** one complete list scan, reuse the integration lookup, confirm the destination before each create, one round per alert.

### Template variables

- **Created and reopened:** `event.properties.name`, `description`, `status`, `fingerprint`, `exception_timestamp`, `event.distinct_id` (the issue id), plus the originating exception's properties.
- **Spiking:** `name`, `description`, `distinct_id`, `fingerprint`, `exception_timestamp` (detection time), `current_bucket_value` (the count in the window, typically 5 minutes), `computed_baseline` (may be 0 on the first spike). No `status` and no exception properties.
- **Context:** `{project.url}` (includes `/project/<team_id>`), `{project.id}`, `{project.name}`, `{source.url}`, `{source.name}`.
- **Assignee** keys are present only when the issue has an assignee. `event.properties.assignee` is a JSON string (`{"type":"user","id":1234}`; `.id` doesn't work), plus `assignee_name` and `assignee_email` (users only; missing if the user left the org or the issue was reassigned before the alert). Display `{event.properties.assignee_name ?? (event.properties.assignee ? 'Assigned' : 'Unassigned')}`. For unassigned issues only, filter `assignee` **is not set**.
- **Deep link** (stays valid across merges through the fingerprint redirect): `{project.url}/error-tracking/fingerprint/{encodeURLComponent(event.properties.fingerprint)}?timestamp={event.properties.exception_timestamp}&utm_source=alert&utm_campaign=error_tracking_alert&utm_medium=slack`, with `utm_medium` one of `slack`, `discord`, `microsoft_teams`, `linear`, `github`, `gitlab`.
- **Spike text without "0x over baseline":** `{event.properties.computed_baseline > 0 ? concat(round(event.properties.current_bucket_value / event.properties.computed_baseline), 'x over baseline') : 'no baseline yet'}`.
- **Linear, GitHub and GitLab inputs:** `title`, `description`, `posthog_issue_id` (`{event.distinct_id}`), `posthog_issue_url`.

## Assigning and external issues

- **Assign to users or roles,** by hand or with auto-assignment rules in settings (`error_tracking/configuration#selectedSetting=error-tracking-auto-assignment`) or through MCP.
- **Auto-assignment rules** are evaluated at ingestion against the exception event that creates the issue (with an unminified stack). Match **any** or **all** conditions; the first matching rule wins, so order the most specific first. **Test** shows matches over the last 7 days. A rule that errors at ingestion is disabled, with a banner.
- **Properties to match:** `$exception_types`, `$exception_values`, `$exception_functions`, `$exception_sources`, `$exception_handled`, `$device_type`, `$browser`, `$current_url`, `$feature_flag`, and custom properties (for example `params_received`).
- **External tickets** in GitHub Issues, Linear, GitLab or Jira: in the UI **External references > Create issue**; through the API with a personal API key scoped `error_tracking:write`; through MCP with `error-tracking-external-references-create`.

## Symbolication

See [SOURCE-MAPS.md](SOURCE-MAPS.md#symbolication).

## Linking errors to traces and logs

Join by a shared ID. A failed lookup is unknown, not "no data"; report each gap separately.

- **From an issue ID or URL:** `query-error-tracking-issue-events` with `include: ["exception", "correlation"]`, `filterTestAccounts: false` and a small `limit`. Say when the result is a sample.
- **Occurrences and sessions by SQL:** select `uuid, issue_id, timestamp, properties.$session_id, properties.$trace_id, properties.$span_id` from `$exception` events over 30 days with `LIMIT 21` (the extra row signals the list is incomplete). Put only validated UUIDs into SQL literals. For custom (non-UUID) session IDs, use `query-error-tracking-issues-list` with a `filterGroup` of `$session_id exact` and `status: "all"`; it may miss ungrouped exceptions.
- **The exact trace:** for each unique nonzero 32-character hex `$trace_id`, call `posthog:apm-trace-get` with `excludeAttributes: true` and use its `_posthogUrl`. Compare `$span_id` as hex, case-insensitively. Empty means no retained span; logs may still exist.
- **Session trace candidates:** `apm-attributes-list` to find a span attribute holding the session ID, then `query-apm-spans` with an exact `span_attribute`, a short window, `flatSpans: true` and a small `limit`. Label them as session matches, not the error's trace.
- **Same-trace logs:** raw `logs.trace_id` is base64.

```sql
SELECT service_name, count() AS log_count
FROM logs
WHERE trace_id = base64Encode(unhex('<trace_id>'))
    AND timestamp >= '<before_error>'
    AND timestamp < '<after_error>'
GROUP BY service_name
ORDER BY log_count DESC
LIMIT 21
```

  Then `posthog:logs-count` and `posthog:query-logs` with `filterGroup: [{ "key": "trace_id", "type": "log", "operator": "exact", "value": "<trace_id>" }]`, `"limit": 50`, every severity including `info`. If no service was found, don't run an unscoped log query.
- **Replay:** `posthog:session-recording-get` with the `$session_id`; `found: false` means no recording was found. Link it with `generate-app-url` `/replay/{id}`, and issues with `/error-tracking/{id}`; do not build PostHog links by hand.

## Finding the best replay

```sql
SELECT
    $session_id AS session_id,
    count() AS occurrences,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen,
    any(properties.$current_url) AS url
FROM events
WHERE event = '$exception'
    AND properties.$exception_fingerprint = '<fingerprint>'
    AND $session_id IS NOT NULL
    AND timestamp > now() - INTERVAL 30 DAY
GROUP BY session_id
ORDER BY last_seen DESC
LIMIT 20
```

- **Rank** with `query-session-recordings-list`, `session_ids` and `date_from: "-30d"`. Drop recordings under 10 seconds or over 1 hour. Prefer 2 to 15 minutes, `active_seconds / recording_duration` above 0.3, a higher `activity_score`, and recency.
- **Edge cases:** every session under 10 seconds means the page crashes immediately; fewer than 3 sessions, skip ranking; many null `$session_id` values mean replay may not be enabled ([SESSION-REPLAY.md](SESSION-REPLAY.md)).
- **Replay Vision, check then scan** (a scanner observes a session once): `vision-observations-list`; if a summarizer `succeeded`, read `scanner_result.model_output` (`title`, `summary`, `intent`, `outcome`, `friction_points`, `keywords`). Otherwise find one with `vision-scanners-list` `scanner_type: "summarizer"` and run `vision-scanners-scan-session` (async, several minutes), then poll. There is no per-call focus parameter.

## Prove it

- **Triage is right:** the top-by-users list over `-24h` with `volumeResolution: 24` and the `first_seen` list both come back, server noise is filtered by `library`, and every row carries a `_posthogUrl`.
- **An investigation counts merged issues:** the breakdown SQL filters on `issue_id` OR `properties.$exception_issue_id`, and the recent and earliest samples show the same error.
- **A grouping rule works:** new matching events land in a `custom-rule:<rule_id>` issue, merged into the target, and no new non-rule fingerprints of the pattern appear.
- **A suppression rule is safe:** the dry run's matched issues are all noise, and in the hour after creation only those issues stop receiving events.
- **An alert fires once:** the dedupe scan found no twin, the test function delivers to the confirmed channel, and the deep link opens the issue.
- **Frames resolve:** the frame's `chunk_id` matches a symbol set `ref` with `has_uploaded_file: true` and a null `failure_reason`, and the extracted map has non-empty `mappings`.
- **Links are real:** every trace, log and replay attached to an error was found through `$trace_id`, `$span_id` or `$session_id`, not by time and service alone.
