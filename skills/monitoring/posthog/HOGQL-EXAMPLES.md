# HogQL examples: product analytics

SQL versions of PostHog's product-analytics insights: trends, funnels, conversion trends, retention, lifecycle, paths and stickiness. For a new question, the typed tools (`posthog:query-trends`, `posthog:query-funnel`, `posthog:query-retention`, `posthog:query-lifecycle`, `posthog:query-paths`, `posthog:query-stickiness`) are the default and these queries are for when SQL is needed or asked for; the rules that decide that, and every HogQL rule these queries follow, are in [HOGQL.md](HOGQL.md). Each query is shown as written, with fixed example dates, event names and properties: replace them, keep the `timestamp` bounds in `WHERE`, and confirm your events with `posthog:read-data-schema` first. Saving a result as an insight or dashboard tile is [INSIGHTS-AND-DASHBOARDS.md](INSIGHTS-AND-DASHBOARDS.md). Web analytics, sessions, replay and taxonomy are in [HOGQL-EXAMPLES-WEB.md](HOGQL-EXAMPLES-WEB.md); errors, logs, traces and LLM traces in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md).

**Contents:** [Trends: daily unique users](#trends-daily-unique-users) · [Trends: multiple breakdowns](#trends-multiple-breakdowns) · [Funnel with a breakdown](#funnel-with-a-breakdown) · [Conversion trends](#conversion-trends) · [Retention](#retention) · [Lifecycle](#lifecycle) · [Paths](#paths) · [Stickiness](#stickiness) · [Prove it](#prove-it)

## Trends: daily unique users

Daily unique users over the last 30 days.

- **Typed first:** check the event with `posthog:read-data-schema`, then call `posthog:query-trends` with this input. Use the native insight controls for breakdowns or period comparisons; "Do not generate SQL only to render this insight." Rendering the result is covered in [HOGQL.md](HOGQL.md#render-results).

```json
{
  "kind": "TrendsQuery",
  "series": [{ "kind": "EventsNode", "event": "chat with ai", "math": "dau" }],
  "dateRange": { "date_from": "-30d" },
  "interval": "day"
}
```

- **The SQL representation** has the same aggregation and time range (`count(DISTINCT e.person_id)` per `toStartOfDay(timestamp)`). It cannot inherit the project's test-account setting: apply the project's test-account filters before running or adapting it when "Filter out internal and test users" is on.

```sql
SELECT
    arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('2025-11-10 00:00:00')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('2025-11-10 00:00:00')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)))), 1))) AS date,
    arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date) AS total
FROM
    (SELECT
        sum(total) AS count,
        day_start
    FROM
        (SELECT
            count(DISTINCT e.person_id) AS total,
            toStartOfDay(timestamp) AS day_start
        FROM
            events AS e
        WHERE
            and(greaterOrEquals(timestamp, toStartOfInterval(assumeNotNull(toDateTime('2025-11-10 00:00:00')), toIntervalDay(1))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))), equals(event, 'chat with ai'))
        GROUP BY
            day_start)
    GROUP BY
        day_start
    ORDER BY
        day_start ASC)
ORDER BY
    arraySum(total) DESC
LIMIT 50000
```

- **A simple aggregate** ("Count `chat with ai` events in the last seven days") defaults to the typed total described in [HOGQL.md](HOGQL.md#pick-the-query-path). The SQL form stays valid when the user asks for SQL or an existing SQL query already fits:

```sql
SELECT count() AS event_count
FROM events
WHERE event = 'chat with ai'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND timestamp <= now()
```

## Trends: multiple breakdowns

Total event count for a specific week, broken down by `$browser` and by `$browser_version`.

- **Breakdown sentinels:** a missing value becomes `'$$_posthog_breakdown_null_$$'`; rows with `row_number >= 25` become `'$$_posthog_breakdown_other_$$'`.
- **Values are truncated** with `left(toString(...), 400)`; the numeric breakdown is bucketed into `[10]` bins.

```sql
SELECT
    groupArray(1)(date)[1] AS date,
    arrayFold((acc, x) -> arrayMap(i -> plus(acc[i], x[i]), range(1, plus(length(date), 1))), groupArray(ifNull(total, 0)), arrayWithConstant(length(date), reinterpretAsFloat64(0))) AS total,
    arrayMap(i -> if(ifNull(greaterOrEquals(row_number, 25), 0), '$$_posthog_breakdown_other_$$', i), breakdown_value) AS breakdown_value
FROM
    (SELECT
        arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)))), 1))) AS date,
        arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date) AS total,
        breakdown_value AS breakdown_value,
        rowNumberInAllBlocks() AS row_number
    FROM
        (WITH
            min_max AS (SELECT
                    count() AS total,
                    toStartOfDay(timestamp) AS day_start,
                    ifNull(nullIf(left(toString(properties.$browser), 400), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value_1,
                    toFloat(properties.$browser_version) AS breakdown_value_2
                FROM
                    events AS e
                WHERE
                    and(greaterOrEquals(timestamp, toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))), equals(event, '$pageview'))
                GROUP BY
                    day_start,
                    breakdown_value_1,
                    breakdown_value_2)
        SELECT
            sum(total) AS count,
            day_start,
            [breakdown_value_1, if(empty(arrayFilter(x -> and(lessOrEquals(x[1], breakdown_value_2), less(breakdown_value_2, x[2])), buckets[1])[1]), '$$_posthog_breakdown_null_$$', ifNull(nullIf(left(toString(arrayFilter(x -> and(lessOrEquals(x[1], breakdown_value_2), less(breakdown_value_2, x[2])), buckets[1])[1]), 400), ''), '$$_posthog_breakdown_null_$$'))] AS breakdown_value
        FROM
            (SELECT
                count() AS total,
                toStartOfDay(timestamp) AS day_start,
                ifNull(nullIf(left(toString(properties.$browser), 400), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value_1,
                toFloat(properties.$browser_version) AS breakdown_value_2,
                (SELECT
                        [max(breakdown_value_2)]
                    FROM
                        min_max) AS max_nums,
                (SELECT
                        [min(breakdown_value_2)]
                    FROM
                        min_max) AS min_nums,
                arrayMap((max_num, min_num, bin_count) -> arrayMap(x -> [plus(multiply(divide(minus(max_num, min_num), bin_count), x), min_num), plus(plus(multiply(divide(minus(max_num, min_num), bin_count), plus(x, 1)), min_num), if(equals(plus(x, 1), bin_count), 0.01, 0))], range(bin_count)), max_nums, min_nums, [10]) AS buckets
            FROM
                events AS e
            WHERE
                and(greaterOrEquals(timestamp, toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))), equals(event, '$pageview'))
            GROUP BY
                day_start,
                breakdown_value_1,
                breakdown_value_2)
        GROUP BY
            day_start,
            breakdown_value
        ORDER BY
            day_start ASC,
            breakdown_value ASC)
    GROUP BY
        breakdown_value
    ORDER BY
        if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
        arraySum(total) DESC,
        breakdown_value ASC)
WHERE
    arrayExists(x -> isNotNull(x), breakdown_value)
GROUP BY
    breakdown_value
ORDER BY
    if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
    arraySum(total) DESC,
    breakdown_value ASC
LIMIT 50000
```

## Funnel with a breakdown

Two steps (`$pageview` to `user signed up`), unique users, broken down by the person's role, sequential, 14-day conversion window.

- **The window is in seconds:** 14 days is `1209600` in `aggregate_funnel_array(2, 1209600, 'first_touch', 'ordered', ...)`. The UDF's arguments are in [HOGQL.md](HOGQL.md#hogql-only-extensions).
- **Steps are a bitfield** read with `bitAnd(steps_bitfield, 1)` and `bitAnd(steps_bitfield, 2)`.
- **Top 25 breakdown values,** the rest as `['Other']`, output `LIMIT 26`.

```sql
SELECT
    sum(step_1) AS step_1,
    sum(step_2) AS step_2,
    arrayMap(x -> if(isNaN(x), NULL, x), [avgArray(step_1_conversion_times)])[1] AS step_1_average_conversion_time,
    arrayMap(x -> if(isNaN(x), NULL, x), [medianArray(step_1_conversion_times)])[1] AS step_1_median_conversion_time,
    arrayMap(x -> if(isNaN(x), NULL, x), [arrayReduce('median', arrayFlatten(groupArray(arrayFlatten(groupArray(total_conversion_times))) OVER ()))])[1] AS total_median_conversion_time,
    groupArray(row_number) AS row_number,
    final_prop
FROM
    (SELECT
        countIf(notEquals(bitAnd(steps_bitfield, 1), 0)) AS step_1,
        countIf(notEquals(bitAnd(steps_bitfield, 2), 0)) AS step_2,
        groupArrayIf(timings[1], greater(timings[1], 0)) AS step_1_conversion_times,
        groupArrayIf(arraySum(timings), greaterOrEquals(step_reached, 1)) AS total_conversion_times,
        rowNumberInAllBlocks() AS row_number,
        if(less(row_number, 25), breakdown, ['Other']) AS final_prop
    FROM
        (SELECT
            arraySort(t -> t.1, groupArray(tuple(toFloat(timestamp), uuid, arrayMap(x -> ifNull(x, ''), prop_basic), arrayFilter(x -> notEquals(x, 0), [multiply(1, step_0), multiply(2, step_1)])))) AS events_array,
            argMinIf(prop_basic, timestamp, notEmpty(arrayFilter(x -> notEmpty(x), prop_basic))) AS prop,
            arrayJoin(aggregate_funnel_array(2, 1209600, 'first_touch', 'ordered', [if(empty(prop), [''], prop)], [], arrayFilter((x, x_before, x_after) -> not(and(lessOrEquals(length(x.4), 1), equals(x.4, x_before.4), equals(x.4, x_after.4), equals(x.3, x_before.3), equals(x.3, x_after.3), greater(x.1, x_before.1), less(x.1, x_after.1))), events_array, arrayRotateRight(events_array, 1), arrayRotateLeft(events_array, 1)))) AS af_tuple,
            af_tuple.1 AS step_reached,
            plus(af_tuple.1, 1) AS steps,
            af_tuple.2 AS breakdown,
            af_tuple.3 AS timings,
            af_tuple.5 AS steps_bitfield,
            aggregation_target
        FROM
            (SELECT
                e.timestamp AS timestamp,
                person_id AS aggregation_target,
                e.uuid AS uuid,
                e.$session_id AS $session_id,
                e.$window_id AS $window_id,
                if(equals(event, '$pageview'), 1, 0) AS step_0,
                if(equals(event, 'user signed up'), 1, 0) AS step_1,
                [ifNull(toString(person.properties.role), '')] AS prop_basic,
                prop_basic AS prop
            FROM
                events AS e
            WHERE
                and(and(and(greaterOrEquals(e.timestamp, toDateTime('2025-12-03 00:00:00.000000')), lessOrEquals(e.timestamp, toDateTime('2025-12-10 23:59:59.999999'))), in(event, tuple('$pageview', 'user signed up'))), or(equals(step_0, 1), equals(step_1, 1))))
        GROUP BY
            aggregation_target
        HAVING
            greaterOrEquals(step_reached, 0))
    GROUP BY
        breakdown
    ORDER BY
        step_2 DESC,
        step_1 DESC)
GROUP BY
    final_prop
ORDER BY
    step_2 DESC,
    step_1 DESC
LIMIT 26
```

## Conversion trends

Funnel conversion over time: two steps (`$pageview` to `user signed up`), aggregated by unique groups, 1-day conversion window.

- **`aggregate_funnel_trends(1, 2, 2, 86400, 'first_touch', 'strict', prop, events_array)`** measures from step 1 to step 2 of 2, within 86400 seconds.
- **Group aggregation** uses `$group_0 AS aggregation_target`.
- **Empty days are filled** with a `RIGHT OUTER JOIN` on `numbers(...)`; the rate is `round(reached_to / reached_from * 100, 2)`.

```sql
SELECT
    fill.entrance_period_start AS entrance_period_start,
    countIf(notEquals(success_bool, 0)) AS reached_from_step_count,
    countIf(equals(success_bool, 1)) AS reached_to_step_count,
    if(greater(reached_from_step_count, 0), round(multiply(divide(reached_to_step_count, reached_from_step_count), 100), 2), 0) AS conversion_rate,
    breakdown AS prop
FROM
    (SELECT
        arraySort(t -> t.1, groupArray(tuple(toFloat(timestamp), _toUInt64(toDateTime(toStartOfDay(timestamp))), uuid, '', arrayFilter(x -> notEquals(x, 0), [multiply(1, step_0), multiply(2, step_1)])))) AS events_array,
        [''] AS prop,
        arrayJoin(aggregate_funnel_trends(1, 2, 2, 86400, 'first_touch', 'strict', prop, events_array)) AS af_tuple,
        toTimeZone(toDateTime(_toUInt64(af_tuple.1)), 'UTC') AS entrance_period_start,
        af_tuple.2 AS success_bool,
        af_tuple.3 AS breakdown,
        aggregation_target AS aggregation_target
    FROM
        (SELECT
            e.timestamp AS timestamp,
            $group_0 AS aggregation_target,
            e.uuid AS uuid,
            if(equals(event, '$pageview'), 1, 0) AS step_0,
            if(equals(event, 'user signed up'), 1, 0) AS step_1
        FROM
            events AS e
        WHERE
            and(and(greaterOrEquals(e.timestamp, toDateTime('2025-12-03 00:00:00.000000')), lessOrEquals(e.timestamp, toDateTime('2025-12-10 23:59:59.999999'))), and(notEquals(toString(aggregation_target), ''), notEquals(aggregation_target, NULL))))
    GROUP BY
        aggregation_target) AS data
    RIGHT OUTER JOIN (SELECT
        plus(toStartOfDay(assumeNotNull(toDateTime('2025-12-03 00:00:00'))), toIntervalDay(number)) AS entrance_period_start
    FROM
        numbers(plus(dateDiff('day', toStartOfDay(assumeNotNull(toDateTime('2025-12-03 00:00:00'))), toStartOfDay(assumeNotNull(toDateTime('2025-12-10 23:59:59')))), 1)) AS period_offsets) AS fill ON equals(data.entrance_period_start, fill.entrance_period_start)
GROUP BY
    entrance_period_start,
    data.breakdown
ORDER BY
    entrance_period_start ASC
LIMIT 1000
```

## Retention

Unique users, `$ai_trace` to `$ai_trace` in the next 12 weeks, recurring.

- **Weekly intervals** with `toStartOfWeek(timestamp, 0)`, a `range(0, 14)` date range and `arraySlice(date_range, start + 1, 12)` for the 12 return periods; each actor's activity comes from `groupUniqArrayIf`.

```sql
SELECT
    actor_activity.start_interval_index AS start_event_matching_interval,
    actor_activity.intervals_from_base AS intervals_from_base,
    COUNT(DISTINCT actor_activity.actor_id) AS count
FROM
    (SELECT
        person_id AS actor_id,
        arraySort(groupUniqArrayIf(toStartOfWeek(timestamp, 0), and(and(equals(events.event, '$ai_trace'), in(properties.$ai_span_name, tuple('LangGraph', 'LangGraphUpdateState'))), and(greaterOrEquals(timestamp, toStartOfWeek(assumeNotNull(toDateTime('2025-09-07 00:00:00')))), less(timestamp, toDateTime('2025-12-14 00:00:00.000000')))))) AS start_event_timestamps,
        arrayMap(x -> plus(toStartOfWeek(assumeNotNull(toDateTime('2025-09-07 00:00:00'))), toIntervalWeek(x)), range(0, 14)) AS date_range,
        arraySort(groupUniqArrayIf(toStartOfWeek(timestamp, 0), and(and(equals(events.event, '$ai_trace'), in(properties.$ai_span_name, tuple('LangGraph', 'LangGraphUpdateState'))), and(greaterOrEquals(timestamp, toStartOfWeek(assumeNotNull(toDateTime('2025-09-07 00:00:00')))), less(timestamp, toDateTime('2025-12-14 00:00:00.000000')))))) AS return_event_timestamps,
        arrayJoin(arrayFilter(x -> greater(x, -1), arrayMap((interval_index, interval_date, _start_event_timestamps) -> if(has(_start_event_timestamps, interval_date), minus(interval_index, 1), -1), arrayEnumerate(date_range), date_range, arrayResize([start_event_timestamps], length(date_range), start_event_timestamps)))) AS start_interval_index,
        arrayJoin(arrayConcat(if(has(start_event_timestamps, date_range[plus(start_interval_index, 1)]), [0], []), arrayFilter(x -> greater(x, 0), arrayMap(_timestamp -> minus(indexOf(arraySlice(date_range, plus(start_interval_index, 1), 12), _timestamp), 1), return_event_timestamps)))) AS intervals_from_base
    FROM
        events
    WHERE
        and(and(greaterOrEquals(events.timestamp, toStartOfWeek(assumeNotNull(toDateTime('2025-09-07 00:00:00')))), less(events.timestamp, toDateTime('2025-12-14 00:00:00.000000'))), in(event, tuple('$ai_trace')), or(and(equals(events.event, '$ai_trace'), in(properties.$ai_span_name, tuple('LangGraph', 'LangGraphUpdateState'))), and(equals(events.event, '$ai_trace'), in(properties.$ai_span_name, tuple('LangGraph', 'LangGraphUpdateState')))))
    GROUP BY
        actor_id
    HAVING
        and(1, 1)) AS actor_activity
GROUP BY
    start_event_matching_interval,
    intervals_from_base
ORDER BY
    start_event_matching_interval ASC,
    intervals_from_base ASC
LIMIT 50000
```

## Lifecycle

Unique users by pageviews.

- **Statuses** are `['new', 'returning', 'resurrecting', 'dormant']`; dormant counts are negated.
- **`new`** comes from `events.person.created_at`.
- **Filter:** `notEquals(properties.$process_person_profile, 'false')`.

```sql
SELECT
    groupArray(start_of_period) AS date,
    groupArray(counts) AS total,
    status
FROM
    (SELECT
        if(equals(status, 'dormant'), negate(sum(counts)), negate(negate(sum(counts)))) AS counts,
        start_of_period,
        status
    FROM
        (SELECT
            periods.start_of_period AS start_of_period,
            0 AS counts,
            status
        FROM
            (SELECT
                minus(toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)), toIntervalDay(number)) AS start_of_period
            FROM
                numbers(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1)), toStartOfInterval(plus(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)), toIntervalDay(1)))) AS numbers) AS periods
            CROSS JOIN (SELECT
                status
            FROM
                (SELECT
                    1)
            ARRAY JOIN ['new', 'returning', 'resurrecting', 'dormant'] AS status) AS sec
        ORDER BY
            status ASC,
            start_of_period ASC
        UNION ALL
        SELECT
            start_of_period,
            count(DISTINCT actor_id) AS counts,
            status
        FROM
            (SELECT
                min(events.person.created_at) AS created_at,
                arraySort(groupUniqArray(toStartOfInterval(events.timestamp, toIntervalDay(1)))) AS all_activity,
                arrayPopBack(arrayPushFront(all_activity, toStartOfInterval(created_at, toIntervalDay(1)))) AS previous_activity,
                arrayPopFront(arrayPushBack(all_activity, toStartOfInterval(toDateTime('1970-01-01 00:00:00'), toIntervalDay(1)))) AS following_activity,
                arrayMap((previous, current, index) -> if(equals(previous, current), 'new', if(and(equals(minus(toTimeZone(current, 'UTC'), toIntervalDay(1)), previous), notEquals(index, 1)), 'returning', 'resurrecting')), previous_activity, all_activity, arrayEnumerate(all_activity)) AS initial_status,
                arrayMap((current, next) -> if(equals(plus(toTimeZone(current, 'UTC'), toIntervalDay(1)), toTimeZone(next, 'UTC')), '', 'dormant'), all_activity, following_activity) AS dormant_status,
                arrayMap(x -> plus(toTimeZone(x, 'UTC'), toIntervalDay(1)), arrayFilter((current, is_dormant) -> equals(is_dormant, 'dormant'), all_activity, dormant_status)) AS dormant_periods,
                arrayMap(x -> 'dormant', dormant_periods) AS dormant_label,
                arrayConcat(arrayZip(all_activity, initial_status), arrayZip(dormant_periods, dormant_label)) AS temp_concat,
                arrayJoin(temp_concat) AS period_status_pairs,
                period_status_pairs.1 AS start_of_period,
                period_status_pairs.2 AS status,
                person_id AS actor_id
            FROM
                events
            WHERE
                and(notEquals(properties.$process_person_profile, 'false'), greaterOrEquals(events.timestamp, minus(toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1)), toIntervalDay(1))), less(events.timestamp, plus(toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)), toIntervalDay(1))), equals(event, '$pageview'))
            GROUP BY
                actor_id)
        GROUP BY
            start_of_period,
            status)
    WHERE
        and(lessOrEquals(start_of_period, toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1))), greaterOrEquals(start_of_period, toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1))))
    GROUP BY
        start_of_period,
        status
    ORDER BY
        start_of_period ASC)
GROUP BY
    status
LIMIT 50000
```

## Paths

Pageviews, three steps, with path cleaning and filters, at most 50 paths.

- **Sessions split** when the gap between events is 1800 seconds or more (`arraySplit(x -> if(less(x.3, 1800), 0, 1), ...)`).
- **Path cleaning** is a chain of `replaceRegexpAll` calls (for example `'\\/project\\/\\d+'` to `'/project/<team_id>'`); the trailing slash is stripped with `replaceRegexpAll(..., '(.)/$', '\\1')`.
- **Three steps** via `arraySlice(..., 1, 3)`; `LIMIT 50`.

```sql
SELECT
    last_path_key AS source_event,
    path_key AS target_event,
    COUNT(*) AS event_count,
    avg(conversion_time) AS average_conversion_time
FROM
    (SELECT
        person_id,
        path,
        conversion_time,
        event_in_session_index,
        concat(toString(event_in_session_index), '_', path) AS path_key,
        if(greater(event_in_session_index, 1), concat(toString(minus(event_in_session_index, 1)), '_', prev_path), NULL) AS last_path_key,
        path_dropoff_key
    FROM
        (SELECT
            person_id,
            joined_path_tuple.1 AS path,
            joined_path_tuple.2 AS conversion_time,
            joined_path_tuple.3 AS prev_path,
            event_in_session_index,
            session_index,
            arrayPopFront(arrayPushBack(path_basic, '')) AS path_basic_0,
            arrayMap((x, y) -> if(equals(x, y), 0, 1), path_basic, path_basic_0) AS mapping,
            arrayFilter((x, y) -> y, time, mapping) AS timings,
            arrayFilter((x, y) -> y, path_basic, mapping) AS compact_path,
            indexOf(compact_path, NULL) AS target_index,
            if(greater(target_index, 0), arraySlice(compact_path, target_index), compact_path) AS filtered_path,
            arraySlice(filtered_path, 1, 3) AS limited_path,
            if(greater(target_index, 0), arraySlice(timings, target_index), timings) AS filtered_timings,
            arraySlice(filtered_timings, 1, 3) AS limited_timings,
            arrayDifference(limited_timings) AS timings_diff,
            concat(toString(length(limited_path)), '_', limited_path[-1]) AS path_dropoff_key,
            arrayZip(limited_path, timings_diff, arrayPopBack(arrayPushFront(limited_path, ''))) AS limited_path_timings
        FROM
            (SELECT
                person_id,
                path_time_tuple.1 AS path_basic,
                path_time_tuple.2 AS time,
                session_index,
                arrayZip(path_list, timing_list, arrayDifference(timing_list)) AS paths_tuple,
                arraySplit(x -> if(less(x.3, 1800), 0, 1), paths_tuple) AS session_paths
            FROM
                (SELECT
                    person_id,
                    groupArray(timestamp) AS timing_list,
                    groupArray(path_item) AS path_list
                FROM
                    (SELECT
                        events.timestamp,
                        events.person_id,
                        ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\1'), event), '') AS path_item_ungrouped,
                        replaceRegexpAll(path_item_ungrouped, '^https:\\/\\/[a-z-]+\\.posthog\\.com', 'https://<region>.posthog.com') AS path_item_0,
                        replaceRegexpAll(path_item_0, '\\/project\\/\\d+', '/project/<team_id>') AS path_item_1,
                        replaceRegexpAll(path_item_1, '\\/ai-observability\\/traces\\/[0-9a-f\\-]+', '/ai-observability/traces/<trace_id>') AS path_item_2,
                        replaceRegexpAll(path_item_2, '\\/ai-observability\\/sessions\\/[0-9a-f\\-]+', '/ai-observability/sessions/<session_id>') AS path_item_3,
                        replaceRegexpAll(path_item_3, '\\/ai-evals\\/evaluations\\/[0-9a-f\\-]+', '/ai-evals/evaluations/<evaluation_id>') AS path_item_4,
                        replaceRegexpAll(path_item_4, '\\/ai-evals\\/datasets\\/[0-9a-f\\-]+', '/ai-evals/datasets/<dataset_id>') AS path_item_cleaned,
                        NULL AS groupings,
                        multiMatchAnyIndex(path_item_cleaned, NULL) AS group_index,
                        (if(greater(group_index, 0), groupings[group_index], path_item_cleaned) AS path_item) AS path_item
                    FROM
                        events
                    WHERE
                        and(and(ilike(toString(properties.$pathname), '%ai-%'), notILike(toString(properties.$pathname), '%docs%')), and(greaterOrEquals(events.timestamp, toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1))), lessOrEquals(events.timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59')))), equals(event, '$pageview'))
                    ORDER BY
                        events.person_id ASC,
                        events.timestamp ASC)
                GROUP BY
                    person_id)
            ARRAY JOIN session_paths AS path_time_tuple, arrayEnumerate(session_paths) AS session_index)
        ARRAY JOIN limited_path_timings AS joined_path_tuple, arrayEnumerate(limited_path_timings) AS event_in_session_index))
WHERE
    notEquals(source_event, NULL)
GROUP BY
    source_event,
    target_event
ORDER BY
    event_count DESC,
    source_event ASC,
    target_event ASC
LIMIT 50
```

- **Wildcard groups are a paid feature.** Wildcard groups (`pathGroupings`), glob-like `*` patterns that collapse similar paths into one node and also work in exclusions, are part of "Advanced paths", available only on paid plans; on the free plan the controls are hidden or disabled. If a free-plan user asks for them (including in exclusions), explain that this requires upgrading to a paid plan "rather than suggesting workarounds."

## Stickiness

Pageviews from unique users, counted by how many day intervals had at least one event, non-cumulative.

- **Each person counts** by the number of day intervals with `count() > 0`; empty interval counts are zero-filled with `numbers(...)` and `UNION ALL`.

```sql
SELECT
    groupArray(num_actors) AS counts,
    groupArray(num_intervals) AS intervals
FROM
    (SELECT
        sum(num_actors) AS num_actors,
        num_intervals
    FROM
        (SELECT
            0 AS num_actors,
            plus(number, 1) AS num_intervals
        FROM
            numbers(ceil(divide(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1)), plus(toStartOfInterval(assumeNotNull(toDateTime('2025-12-10 23:59:59')), toIntervalDay(1)), toIntervalDay(1))), 1))) AS numbers
        UNION ALL
        SELECT
            count(DISTINCT aggregation_target) AS num_actors,
            num_intervals
        FROM
            (SELECT
                aggregation_target,
                count() AS num_intervals
            FROM
                (SELECT
                    e.person_id AS aggregation_target,
                    toStartOfInterval(e.timestamp, toIntervalDay(1)) AS start_of_interval
                FROM
                    events AS e
                WHERE
                    and(greaterOrEquals(timestamp, toStartOfInterval(assumeNotNull(toDateTime('2025-12-03 00:00:00')), toIntervalDay(1))), lessOrEquals(timestamp, assumeNotNull(toDateTime('2025-12-10 23:59:59'))), equals(event, '$pageview'))
                GROUP BY
                    aggregation_target,
                    start_of_interval
                HAVING
                    greater(count(), 0))
            GROUP BY
                aggregation_target)
        GROUP BY
            num_intervals
        ORDER BY
            num_intervals ASC)
    GROUP BY
        num_intervals
    ORDER BY
        num_intervals ASC)
LIMIT 50000
```

## Prove it

- The typed tool was considered first, and SQL was chosen because the task needed SQL capabilities or asked for SQL.
- Every example date, event name and property was replaced, and the events were confirmed with `posthog:read-data-schema`.
- Every `events` subquery keeps its `timestamp` bound in `WHERE`.
- When "Filter out internal and test users" is enabled, the SQL applies the project's test-account filters, keeping test-account filtering consistent with the typed form.
- Funnel windows are in seconds (`86400` per day, `1209600` for 14 days).
