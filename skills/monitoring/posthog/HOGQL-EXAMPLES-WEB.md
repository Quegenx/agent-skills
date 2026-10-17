# HogQL examples: web analytics, sessions, replay and taxonomy

SQL for web analytics (overview, path stats, channels, device types), the `sessions` table, session replay listings, and taxonomy (which events, event properties and person properties a project has, with sample values). Web metrics are built per session from `$pageview` and `$screen` events and the `session.*` fields. The rules these queries follow are in [HOGQL.md](HOGQL.md), and the tables (`raw_session_replay_events`, `system.session_recordings`, `heatmaps`) in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md). Each query is shown as written, with fixed example dates: replace them and keep the time bounds.

**Contents:** [Web overview](#web-overview) · [Web path stats](#web-path-stats) · [Web traffic channels](#web-traffic-channels) · [Web views by device type](#web-views-by-device-type) · [Sessions](#sessions) · [Session replay](#session-replay) · [Team taxonomy](#team-taxonomy) · [Event taxonomy](#event-taxonomy) · [Person property taxonomy](#person-property-taxonomy) · [Dynamic properties and skipped events](#dynamic-properties-and-skipped-events) · [Prove it](#prove-it)

## Web overview

Visitors, page views, sessions, session duration and bounce rate.

- **Unique users** are `uniq(session_person_id)`; pageviews count `$pageview` or `$screen`; sessions are `uniq(session_id)`; duration is `avg(session.$session_duration)`; bounce rate is `avg(session.$is_bounce)`.
- **Requires `events.$session_id` not NULL,** and `HAVING` keeps sessions whose start falls in the range.

```sql
SELECT
    uniq(session_person_id) AS unique_users,
    NULL AS previous_unique_users,
    sum(filtered_pageview_count) AS total_filtered_pageview_count,
    NULL AS previous_total_filtered_pageview_count,
    uniq(session_id) AS unique_sessions,
    NULL AS previous_unique_sessions,
    avg(session_duration) AS avg_duration_s,
    NULL AS previous_avg_duration_s,
    avg(is_bounce) AS bounce_rate,
    NULL AS previous_bounce_rate
FROM
    (SELECT
        any(events.person_id) AS session_person_id,
        session.session_id AS session_id,
        min(session.$start_timestamp) AS start_timestamp,
        any(session.$session_duration) AS session_duration,
        countIf(or(equals(event, '$pageview'), equals(event, '$screen'))) AS filtered_pageview_count,
        any(session.$is_bounce) AS is_bounce
    FROM
        events
    WHERE
        and(notEquals(events.$session_id, NULL), or(equals(event, '$pageview'), equals(event, '$screen')), or(and(greaterOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false), 1)
    GROUP BY
        session_id
    HAVING
        or(and(greaterOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false))
LIMIT 50000
```

## Web path stats

Every path accessed in the app, whenever in the session it was accessed.

- **Visitors and views** break down on `events.properties.$pathname`; **bounce rate** is computed on `session.$entry_pathname`. "The bounce rate indicates the percentage of users who left your page immediately after visiting without capturing any event."
- **`ui_fill_fraction`** is visitors divided by `sum(...) OVER ()`.

```sql
SELECT
    counts.breakdown_value AS `context.columns.breakdown_value`,
    tuple(counts.visitors, counts.previous_visitors) AS `context.columns.visitors`,
    tuple(counts.views, counts.previous_views) AS `context.columns.views`,
    tuple(bounce.bounce_rate, bounce.previous_bounce_rate) AS `context.columns.bounce_rate`,
    divide(`context.columns.visitors`.1, sum(`context.columns.visitors`.1) OVER ()) AS `context.columns.ui_fill_fraction`
FROM
    (SELECT
        breakdown_value,
        uniqIf(filtered_person_id, and(greaterOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))))) AS visitors,
        uniqIf(filtered_person_id, false) AS previous_visitors,
        sumIf(filtered_pageview_count, and(greaterOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))))) AS views,
        sumIf(filtered_pageview_count, false) AS previous_views
    FROM
        (SELECT
            any(person_id) AS filtered_person_id,
            count() AS filtered_pageview_count,
            events.properties.$pathname AS breakdown_value,
            session.session_id AS session_id,
            min(session.$start_timestamp) AS start_timestamp
        FROM
            events
        WHERE
            and(or(equals(events.event, '$pageview'), equals(events.event, '$screen')), or(and(greaterOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false), 1, 1)
        GROUP BY
            session_id,
            breakdown_value)
    GROUP BY
        breakdown_value) AS counts
    LEFT JOIN (SELECT
        breakdown_value,
        avgIf(is_bounce, and(greaterOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(start_timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))))) AS bounce_rate,
        avgIf(is_bounce, false) AS previous_bounce_rate
    FROM
        (SELECT
            session.$entry_pathname AS breakdown_value,
            any(session.$is_bounce) AS is_bounce,
            session.session_id AS session_id,
            min(session.$start_timestamp) AS start_timestamp
        FROM
            events
        WHERE
            and(or(equals(events.event, '$pageview'), equals(events.event, '$screen')), or(and(greaterOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false), 1, 1)
        GROUP BY
            session_id,
            breakdown_value)
    GROUP BY
        breakdown_value) AS bounce ON equals(counts.breakdown_value, bounce.breakdown_value)
WHERE
    notEquals(counts.breakdown_value, NULL)
ORDER BY
    `context.columns.visitors` DESC,
    `context.columns.views` DESC,
    `context.columns.breakdown_value` ASC
LIMIT 50000
```

## Web traffic channels

"Channels are the different sources that bring traffic to your website, e.g. Paid Search, Organic Social, Direct, etc." The breakdown is `session.$channel_type`, and `HAVING` drops NULL and empty values.

```sql
SELECT
    breakdown_value AS `context.columns.breakdown_value`,
    tuple(uniq(filtered_person_id), NULL) AS `context.columns.visitors`,
    tuple(sum(filtered_pageview_count), NULL) AS `context.columns.views`,
    divide(`context.columns.visitors`.1, sum(`context.columns.visitors`.1) OVER ()) AS `context.columns.ui_fill_fraction`
FROM
    (SELECT
        any(person_id) AS filtered_person_id,
        count() AS filtered_pageview_count,
        session.$channel_type AS breakdown_value,
        session.session_id AS session_id,
        any(session.$is_bounce) AS is_bounce,
        min(session.$start_timestamp) AS start_timestamp
    FROM
        events
    WHERE
        and(or(and(greaterOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false), or(equals(event, '$pageview'), equals(event, '$screen')), 1)
    GROUP BY
        session_id,
        breakdown_value)
GROUP BY
    `context.columns.breakdown_value`
HAVING
    and(notEquals(`context.columns.breakdown_value`, NULL), notEquals(`context.columns.breakdown_value`, ''))
ORDER BY
    `context.columns.visitors` DESC,
    `context.columns.views` DESC,
    `context.columns.breakdown_value` ASC
LIMIT 50000
```

## Web views by device type

- **Breakdown on `properties.$device_type`.** Session id and start time come from the `$session_id_uuid` UUIDv7 bits: `bitShiftRight(..., 76)` checks the version is 7, `bitShiftRight(..., 80)` gives the millisecond timestamp.

```sql
SELECT
    breakdown_value AS `context.columns.breakdown_value`,
    tuple(uniq(filtered_person_id), NULL) AS `context.columns.visitors`,
    tuple(sum(filtered_pageview_count), NULL) AS `context.columns.views`,
    divide(`context.columns.visitors`.1, sum(`context.columns.visitors`.1) OVER ()) AS `context.columns.ui_fill_fraction`
FROM
    (SELECT
        any(person_id) AS filtered_person_id,
        count() AS filtered_pageview_count,
        properties.$device_type AS breakdown_value,
        if(equals(bitAnd(bitShiftRight(events.$session_id_uuid, 76), 15), 7), events.$session_id, NULL) AS session_id,
        any(if(equals(bitAnd(bitShiftRight(events.$session_id_uuid, 76), 15), 7), fromUnixTimestamp(intDiv(toInt(bitShiftRight(events.$session_id_uuid, 80)), 1000)), NULL)) AS start_timestamp
    FROM
        events
    WHERE
        and(or(and(greaterOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-03 00:00:00'))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), false), or(equals(event, '$pageview'), equals(event, '$screen')), 1)
    GROUP BY
        session_id,
        breakdown_value)
GROUP BY
    `context.columns.breakdown_value`
ORDER BY
    `context.columns.visitors` DESC,
    `context.columns.views` DESC,
    `context.columns.breakdown_value` ASC
LIMIT 50000
```

## Sessions

Listing sessions with duration, pageviews and bounce. The `sessions` table is time-filtered on `$start_timestamp`; columns used: `session_id`, `$start_timestamp`, `$end_timestamp`, `$session_duration`, `$pageview_count`, `$is_bounce`, `$entry_current_url`, `$end_current_url`.

```sql
SELECT
    session_id,
    $start_timestamp,
    $end_timestamp,
    $session_duration,
    $pageview_count,
    $is_bounce,
    $entry_current_url,
    $end_current_url
FROM
    sessions
WHERE
    and(less($start_timestamp, toDateTime('2026-10-17 11:52:24.400071')), greater($start_timestamp, toDateTime('2026-10-16 11:52:19.400490')))
ORDER BY
    $start_timestamp DESC
LIMIT 50000
```

## Session replay

Listing recordings with activity filters, from `raw_session_replay_events`.

- **Columns used:** `min_first_timestamp`, `max_last_timestamp`, `first_url` (read with `argMinMerge`), `click_count`, `keypress_count`, `mouse_activity_count`, `active_milliseconds`, `console_log_count`, `console_warn_count`, `console_error_count`, `retention_period_days`, `_timestamp`, `is_deleted`, `surfacing_score`.
- **Expiry** is `dateTrunc('DAY', start_time) + retention_period_days`, with `coalesce(retention_period_days, 30)`; `surfacing_score` defaults to `0.36`.
- **Ongoing** means `_timestamp` within the last 5 minutes in this example; the filter keeps `active_seconds > 5.0` and drops deleted recordings.
- **To add a replay button** to any result, use `recordingButton(session_id)` ([HOGQL.md](HOGQL.md#hogql-only-extensions)).

```sql
SELECT
    s.session_id,
    any(s.team_id),
    any(s.distinct_id),
    min(s.min_first_timestamp) AS start_time,
    max(s.max_last_timestamp) AS end_time,
    dateDiff('SECOND', start_time, end_time) AS duration,
    argMinMerge(s.first_url) AS first_url,
    sum(s.click_count) AS click_count,
    sum(s.keypress_count) AS keypress_count,
    sum(s.mouse_activity_count) AS mouse_activity_count,
    divide(sum(s.active_milliseconds), 1000) AS active_seconds,
    greatest(minus(duration, active_seconds), 0) AS inactive_seconds,
    sum(s.console_log_count) AS console_log_count,
    sum(s.console_warn_count) AS console_warn_count,
    sum(s.console_error_count) AS console_error_count,
    max(s.retention_period_days) AS retention_period_days,
    plus(dateTrunc('DAY', start_time), toIntervalDay(coalesce(retention_period_days, 30))) AS expiry_time,
    date_diff('DAY', toDateTime('2026-10-17 11:52:17.416244'), expiry_time) AS recording_ttl,
    greaterOrEquals(max(s._timestamp), toDateTime('2026-10-17 11:47:17.415674')) AS ongoing,
    round(least(greatest(multiply(divide(plus(plus(plus(divide(sum(s.active_milliseconds), 1000), sum(s.click_count)), sum(s.keypress_count)), sum(s.console_error_count)), plus(plus(plus(plus(sum(s.mouse_activity_count), dateDiff('SECOND', start_time, end_time)), sum(s.console_error_count)), sum(s.console_log_count)), sum(s.console_warn_count))), 100), 0), 100), 2) AS activity_score,
    coalesce(max(s.surfacing_score), 0.36) AS surfacing_score
FROM
    raw_session_replay_events AS s
WHERE
    and(greaterOrEquals(s.min_first_timestamp, toDateTime('2026-10-14 00:00:00.000000')), lessOrEquals(s.min_first_timestamp, toDateTime('2026-10-17 11:52:17.415867')))
GROUP BY
    session_id
HAVING
    and(greaterOrEquals(expiry_time, toDateTime('2026-10-17 11:52:17.416113')), equals(max(s.is_deleted), 0), greater(active_seconds, 5.0))
ORDER BY
    start_time DESC,
    session_id DESC
LIMIT 50000
```

## Team taxonomy

Top events from the last 30 days, excluding a noise list (the reasons are under [skipped events](#dynamic-properties-and-skipped-events); the list here also drops MCP events and `$snapshot`).

```sql
SELECT
    event,
    count() AS count
FROM
    events
WHERE
    and(greaterOrEquals(timestamp, minus(now(), toIntervalDay(30))), notIn(event, ['$pageleave', '$autocapture', '$$heatmap', '$copy_autocapture', '$set', '$opt_in', '$feature_flag_called', '$experiment_exposure', '$feature_view', '$feature_interaction', '$element_viewed', '$capture_metrics', '$create_alias', '$merge_dangerously', '$groupidentify', 'mcp_tool_call', 'mcp_tools_list', 'mcp_initialize', 'mcp_resources_list', 'mcp_resource_read', 'mcp_prompts_list', 'mcp_prompt_get', 'mcp_custom', 'posthog_identify', 'mcp init', 'mcp_mcpcat:identify', 'mcp_posthog:identify', 'mcp_tool_called', 'mcp tool call', 'mcp tool response', '$snapshot']))
GROUP BY
    event
ORDER BY
    count DESC,
    event ASC
LIMIT 50000
```

## Event taxonomy

All properties of one event with up to 5 sample values each, from `JSONExtractKeysAndValues(properties, 'String')` over the latest 100 events, expanded with `ARRAY JOIN`. The omit regex drops keys such as `$set`, `$time`, `$set_once`, `$sent_at`, `distinct_id`, `$ip`, `$feature/`, `$feature_flags` and `$active_feature_flags`.

```sql
SELECT
    key,
    arrayMap(item -> item.3, arraySlice(reverse(arraySort(item -> tuple(item.1, item.2, item.3), groupArray(tuple(value_count, latest_seen, value)))), 1, 5)) AS values,
    count(DISTINCT value) AS total_count
FROM
    (SELECT
        key,
        value,
        count() AS value_count,
        max(timestamp) AS latest_seen
    FROM
        (SELECT
            JSONExtractKeysAndValues(properties, 'String') AS kv,
            timestamp
        FROM
            events
        WHERE
            and(greaterOrEquals(timestamp, minus(now(), toIntervalDay(30))), equals(event, '$pageview'))
        ORDER BY
            timestamp DESC
        LIMIT 100)
    ARRAY JOIN (kv).1 AS key, (kv).2 AS value
    WHERE
        and(not(match(key, '(\\$set|\\$time|\\$set_once|\\$sent_at|distinct_id|\\$ip|\\$feature\\/|^\\$feature_flags$|^\\$active_feature_flags$|\\$feature_enrollment\\/|\\$feature_interaction\\/|\\$product_tour|__|survey_dismiss|survey_responded|phjs|partial_filter_chosen|changed_action|window-id|changed_event|partial_filter)')), notEquals(value, NULL), notEquals(value, ''))
    GROUP BY
        key,
        value)
GROUP BY
    key
ORDER BY
    total_count DESC,
    key ASC
LIMIT 50000
```

Specific properties only ("faster, skips the omit filter"):

```sql
SELECT
    key,
    arrayMap(item -> item.3, arraySlice(reverse(arraySort(item -> tuple(item.1, item.2, item.3), groupArray(tuple(value_count, latest_seen, value)))), 1, 5)) AS values,
    count(DISTINCT value) AS total_count
FROM
    (SELECT
        key,
        value,
        count() AS value_count,
        max(timestamp) AS latest_seen
    FROM
        (SELECT
            [tuple('$browser', JSONExtractString(properties, '$browser')), tuple('$os', JSONExtractString(properties, '$os'))] AS kv,
            timestamp
        FROM
            events
        WHERE
            and(greaterOrEquals(timestamp, minus(now(), toIntervalDay(30))), equals(event, '$pageview'), or(notEquals(JSONExtractString(properties, '$browser'), ''), notEquals(JSONExtractString(properties, '$os'), ''))))
    ARRAY JOIN (kv).1 AS key, (kv).2 AS value
    WHERE
        and(notEquals(value, NULL), notEquals(value, ''))
    GROUP BY
        key,
        value)
GROUP BY
    key
ORDER BY
    total_count DESC,
    key ASC
LIMIT 50000
```

## Person property taxonomy

Sample values for specific person properties: `ARRAY JOIN arrayEnumerate([...])` over `persons`, `groupArray(5)(prop)`.

```sql
SELECT
    groupArray(5)(prop),
    count(),
    prop_index
FROM
    (SELECT
        DISTINCT prop_index,
        toString(prop_value) AS prop
    FROM
        persons
    ARRAY JOIN arrayEnumerate([toString(properties.email), toString(properties.$initial_browser)]) AS prop_index, [toString(properties.email), toString(properties.$initial_browser)] AS prop_value
    WHERE
        isNotNull(prop_value)
    ORDER BY
        created_at DESC)
GROUP BY
    prop_index
ORDER BY
    prop_index ASC
LIMIT 50000
```

## Dynamic properties and skipped events

- **Dynamic properties are not returned by `read-data-schema`;** build their names from patterns. Person properties (all Boolean): `$survey_dismissed/{survey_id}`, `$survey_responded/{survey_id}`, `$feature_enrollment/{flag_key}` (opted into an early access feature), `$feature_interaction/{feature_key}`, `$product_tour_dismissed/{tour_id}`, `$product_tour_shown/{tour_id}`, `$product_tour_completed/{tour_id}`. Event property: `$feature/{flag_key}` (String), the value of a specific flag.
- **Find the IDs first** in `system.surveys`, `system.feature_flags` or `system.early_access_features` (then the flag key for `$feature_enrollment/{flag_key}`):

```sql
SELECT id, name, type
FROM system.surveys
ORDER BY created_at DESC
LIMIT 20
```

```sql
SELECT id, name, feature_flag_id
FROM system.early_access_features
ORDER BY created_at DESC
LIMIT 20
```

- **`read-data-schema` event property results omit** `$feature/{flag_key}` (high cardinality), `$feature_enrollment/{flag_key}`, `$feature_interaction/{feature_key}`, `$product_tour_*`, `survey_dismiss*`, `survey_responded*`, `$set`, `$set_once`, `$ip` (privacy), `__*` (flatten-properties-plugin artifacts) and `phjs*` (internal SDK metadata).
- **Skipped events:** the team taxonomy query excludes events marked `system` or `ignored_in_assistant` with SQL `NOT IN`, so they don't use up pagination slots: `$pageleave` (confuses LLMs; use `$pageview`), `$autocapture` (only useful with autocapture-specific filters), `$$heatmap` (internal), `$copy_autocapture`, `$set`, `$opt_in`, `$feature_flag_called` (a flag evaluation, not a user action), `$feature_view` and `$feature_interaction` (posthog-js/react specific), `$capture_metrics`, `$create_alias`, `$merge_dangerously`, `$groupidentify`.

## Prove it

- Web metrics count both `$pageview` and `$screen`; the web overview counts only events with a non-NULL `$session_id`.
- Session queries bound `$start_timestamp`; replay queries bound `min_first_timestamp`; event queries bound `timestamp`.
- Taxonomy scans keep their 30-day `timestamp` bound, and dynamic property names were built from IDs looked up in `system.surveys`, `system.feature_flags` or `system.early_access_features`.
