# HogQL examples: errors, logs, traces and LLM traces

SQL for error tracking issues, logs, cross-signal correlation (a metric exemplar to its trace and logs) and LLM traces. These signals share two traps: their IDs and heavy fields live in specific tables (`logs` bare, `posthog.trace_spans`, `posthog.metrics` and `posthog.ai_events` with the prefix; `trace_id` stored as base64), and they are large, so every query needs a tight time window and big blobs go to a file, never into the conversation. Prefer the typed tools for plain lists (`posthog:query-error-tracking-issues-list`, `posthog:query-logs`, `posthog:query-apm-spans`, `posthog:query-llm-trace`, `posthog:query-llm-traces-list`). The tables are in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md); the products themselves in [ERROR-TRACKING.md](ERROR-TRACKING.md) and [LLM-ANALYTICS.md](LLM-ANALYTICS.md); OpenTelemetry instrumentation in the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill. Each query is shown as written, with fixed example dates and IDs: replace them.

**Contents:** [Error tracking](#error-tracking) · [Logs](#logs) · [Cross-signal correlation](#cross-signal-correlation) · [LLM trace](#llm-trace) · [LLM traces list](#llm-traces-list) · [Prove it](#prove-it)

## Error tracking

Search for a value in errors and filter by a custom property.

- **Occurrences are `$exception` events** carrying `$exception_fingerprint`. Issue state comes from `error_tracking_fingerprint_issue_state`, joined on `cityHash64(JSONExtractString(e.properties, '$exception_fingerprint'))` = `fp_state.fp_hash`. Issue fields: `issue_id`, `issue_status`, `issue_severity`, `issue_name`, `issue_description`, `assigned_user_id`, `assigned_role_id`, `first_seen`.
- **Search** uses `multiSearchAnyCaseInsensitive` over `$exception_types`, `$exception_values`, `$exception_sources`, `$exception_functions`, `email` and `person.properties.email`; the custom property filter here is `equals(properties.tag, 'max_ai')`.
- **The last frame's function and source** are `properties.$exception_functions.-1` and `properties.$exception_sources.-1`.
- **Volume is split into 20 bins;** sessions and users are capped with `least(..., sum(occ))`.

```sql
SELECT
    fp_state.issue_id AS id,
    any(fp_state.issue_status) AS status,
    any(fp_state.issue_severity) AS severity,
    any(fp_state.issue_name) AS name,
    any(fp_state.issue_description) AS description,
    any(fp_state.assigned_user_id) AS assignee_user_id,
    any(fp_state.assigned_role_id) AS assignee_role_id,
    min(fp_state.first_seen) AS first_seen,
    max(ev.last_seen_fp) AS last_seen,
    argMaxMerge(ev.function_state) AS function,
    argMaxMerge(ev.source_state) AS source,
    sum(ev.occ) AS occurrences,
    least(uniqMerge(ev.sessions_state), sum(ev.occ)) AS sessions,
    least(uniqMerge(ev.users_state), sum(ev.occ)) AS users,
    sumForEach(arrayMap(i -> if(equals(ev.bin_idx, i), ev.occ, _toUInt64(0)), range(0, 20))) AS volumeRange,
    argMaxMerge(ev.library_state) AS library
FROM
    (SELECT
        cityHash64(JSONExtractString(e.properties, '$exception_fingerprint')) AS fp_hash,
        max(timestamp) AS last_seen_fp,
        argMaxState(properties.$exception_functions.-1, timestamp) AS function_state,
        argMaxState(properties.$exception_sources.-1, timestamp) AS source_state,
        argMaxState(properties.$lib, timestamp) AS library_state,
        least(19, intDiv(dateDiff('seconds', toDateTime(toDateTime('2026-10-16 11:00:00.000000')), timestamp), greatest(1, intDiv(dateDiff('seconds', toDateTime(toDateTime('2026-10-16 11:00:00.000000')), toDateTime(toDateTime('2026-10-17 11:52:16.615665'))), 20)))) AS bin_idx,
        count() AS occ,
        uniqState(nullIf(e.$session_id, '')) AS sessions_state,
        uniqState(coalesce(nullIf(toString(e.event_person_id), '00000000-0000-0000-0000-000000000000'), e.distinct_id)) AS users_state
    FROM
        events AS e
    WHERE
        and(equals(e.event, '$exception'), isNotNull(e.properties.$exception_fingerprint), true, greaterOrEquals(e.timestamp, toDateTime(toDateTime('2026-10-16 11:00:00.000000'))), lessOrEquals(e.timestamp, toDateTime(toDateTime('2026-10-17 11:52:16.615665'))), or(greater(multiSearchAnyCaseInsensitive(toString(e.properties.$exception_types), ['constant']), 0), greater(multiSearchAnyCaseInsensitive(toString(e.properties.$exception_values), ['constant']), 0), greater(multiSearchAnyCaseInsensitive(toString(e.properties.$exception_sources), ['constant']), 0), greater(multiSearchAnyCaseInsensitive(toString(e.properties.$exception_functions), ['constant']), 0), greater(multiSearchAnyCaseInsensitive(toString(e.properties.email), ['constant']), 0), greater(multiSearchAnyCaseInsensitive(toString(e.person.properties.email), ['constant']), 0)), equals(properties.tag, 'max_ai'))
    GROUP BY
        fp_hash,
        bin_idx) AS ev
    INNER JOIN error_tracking_fingerprint_issue_state AS fp_state ON equals(ev.fp_hash, fp_state.fp_hash)
WHERE
    isNotNull(fp_state.issue_id)
GROUP BY
    id
ORDER BY
    last_seen DESC,
    id DESC
LIMIT 50000
```

## Logs

Filter by severity and search for a term.

- **Bound `time_bucket`** with `toStartOfDay(time_bucket)`, and `timestamp` too.
- **Search** pairs `indexHint(like(lower(body), '%timeout%'))` with `ilike(toString(body), '%timeout%')`; severity is `severity_text IN ('warn','error','fatal')`.
- **`span_id` and `trace_id` are base64:** show them with `hex(tryBase64Decode(...))`. The live checkpoint comes from `logs_kafka_metrics`. Pages are `LIMIT 101 OFFSET 0`.

The retired generated log example combined December 9 to 10, 2025 `time_bucket` with `timestamp` from October 16, 2026, so its windows cannot describe the same rows. Use the same actual incident window for both bounds and a discovered service scope. Its selected fields were `uuid`, trace/span IDs decoded for display, `body`, `attributes`, `timestamp`, `observed_timestamp`, `severity_text`, `severity_number`, `severity_text AS level`, `resource_attributes`, `resource_fingerprint`, `instrumentation_scope` and `event_name`; `live_logs_checkpoint` was the minimum of per-topic/partition maximum observed timestamps from `logs_kafka_metrics`. It searched for `timeout` with both the lowercase-body index hint and a case-insensitive body predicate, restricted severity to warn/error/fatal, sorted timestamp then uuid descending, and used LIMIT 101 OFFSET 0. Preserve those source-specific fields and predicates when adapting a verified query. [existing HOGQL-EXAMPLES-SIGNALS.md; HOGQL-TABLES-PRODUCTS.md, logs time_bucket definition]

## Cross-signal correlation

Use when a metric anomaly (latency spike, error-rate jump) needs a representative trace and that request's logs in one round trip.

- **The three tables share `trace_id`:** `posthog.metrics`, `posthog.trace_spans` and `logs`. `posthog.metrics` can carry an exemplar `trace_id` on every point when the SDK attached one (the OpenTelemetry exemplar pattern).
- **Namespacing:** `logs` is at the HogQL root; `posthog.trace_spans` and `posthog.metrics` need the `posthog.` prefix. "Bare names fail."
- **`trace_id` is base64-encoded 16 bytes** in all three: joins are direct equality, no decoding; display with `hex(tryBase64Decode(trace_id))`.
- **Exemplars are sparse.** Only points whose SDK attached an exemplar carry a `trace_id`; points without one hold an empty string, not null, so filter `trace_id != ''`. An empty result means no spans or logs matched the chosen trace (it may not be exported or retained); it does not prove the metric has no exemplars. Count `trace_id != ''` rows in `posthog.metrics` for the same metric and window first. Use the span-anchored fallback when that count is zero, or when the exemplar traces have no retained spans or logs (in that case try the next exemplar from the sample variant first).

The pattern: locate the spike in `posthog.metrics` for a `(service, metric, window)`; pick an exemplar with `argMax(trace_id, value)` (the trace from the highest-value row); fetch spans and logs for it in one `UNION ALL`, ordered by timestamp so the timeline interleaves.

The source's exemplar-to-timeline UNION selected span name/service/duration/status and log body/service/severity, then ordered both by timestamp. It bounded only the exemplar CTE; the outer trace and log scans lacked incident-time predicates. Keep the actual window on each scan, join the stored trace_id directly and use UNION ALL for the interleaved timeline. The existing bounded exemplar-sample query below can discover candidate IDs; use `apm-trace-get` for the selected trace and the typed logs tool with the same window. No corrected SQL block is supplied here. [existing HOGQL-EXAMPLES-SIGNALS.md, cross-signal correlation]

- **`argMax(trace_id, value)` is cheap** because the per-minute projection on `posthog.metrics` pre-aggregates by `(service_name, metric_name, ...)`. Keep the window tight: 15 minutes is plenty for a spike.
- **`UNION ALL`, not `UNION`:** `UNION` deduplicates and adds cost.
- **`status_code = 2` is Error** in `posthog.trace_spans` (OTel semantics); use it to flag error spans inline.
- **For the span tree,** pass the `trace_id` to `posthog:apm-trace-get` for the full waterfall.

Fallback, anchored on a span (slowest error, longest duration, a specific service), then its logs:

The span-anchored source fallback chose the longest root error span (`is_root_span`, status_code 2, service checkout, one-hour window), then fetched the same span/log timeline fields as above. Its outer scans also omitted the window. Keep the selected incident bounds on every scan and use the discovered stored trace_id with the typed trace/log tools; source sampling and empty-exemplar caveats still apply. [existing HOGQL-EXAMPLES-SIGNALS.md, span fallback]

A sample of exemplar traces, not just one:

```sql
SELECT trace_id, max(value) AS peak
FROM posthog.metrics
WHERE service_name = 'checkout'
  AND metric_name = 'http.server.duration'
  AND timestamp >= now() - INTERVAL 15 MINUTE
  AND trace_id != ''
GROUP BY trace_id
ORDER BY peak DESC
LIMIT 5
```

Services with the biggest error-rate jump, with an exemplar trace each (`sample_error_trace` then goes to `posthog:apm-trace-get` or a `logs` lookup by `trace_id`):

```sql
SELECT
    service_name,
    countIf(status_code = 2) / count() AS error_rate,
    argMax(trace_id, status_code = 2) AS sample_error_trace
FROM posthog.trace_spans
WHERE timestamp >= now() - INTERVAL 1 HOUR
  AND is_root_span
GROUP BY service_name
HAVING count() > 100
ORDER BY error_rate DESC
LIMIT 10
```

## LLM trace

One trace, read from the AI events table. **Conflict:** this example query reads bare `FROM ai_events`, while the AI observability events reference says to use `posthog.ai_events` because a bare `FROM ai_events` fails with "Unknown table" at compile time. Confirm in the current docs which form works.

- **Always set a time range,** from 30 minutes before to 30 minutes after the source event. The query can return a very large JSON blob: select only the data you need when it is minimal, or dump the results to a file and explore with bash.
- **Typical capture order:** `$ai_span`, then `$ai_generation` or `$ai_embedding`, then `$ai_trace`. Explore the `$ai_*` properties for traces, generations, embeddings, spans, feedback and metrics. The key `$ai_generation` properties are `$ai_input` and `$ai_output_choices`.
- **Dump heavy fields to a file.** `$ai_input`, `$ai_input_state` and `$ai_output_state` can be extremely large (full conversation histories, system prompts, application state): when a query selects them, you must write the results to a file and explore with bash, never output them into the conversation. They live only on `posthog.ai_events` (read by `trace_id`), not on `events.properties`.
- **Rows are deduplicated** with `LIMIT 1 BY uuid` across `$ai_span`, `$ai_generation`, `$ai_embedding`, `$ai_metric`, `$ai_feedback` and `$ai_trace`.

```sql
SELECT
    deduped.trace_id AS id,
    any(deduped.session_id) AS ai_session_id,
    min(deduped.timestamp) AS first_timestamp,
    max(deduped.timestamp) AS last_timestamp,
    ifNull(nullIf(argMinIf(deduped.distinct_id, deduped.timestamp, equals(deduped.event, '$ai_trace')), ''), argMin(deduped.distinct_id, deduped.timestamp)) AS first_distinct_id,
    round(coalesce(nullIf(maxIf(deduped.latency, and(equals(deduped.event, '$ai_trace'), greater(deduped.latency, 0))), 0), if(and(equals(countIf(and(greater(deduped.latency, 0), notEquals(deduped.event, '$ai_generation'))), 0), greater(countIf(and(greater(deduped.latency, 0), equals(deduped.event, '$ai_generation'))), 0)), sumIf(deduped.latency, and(equals(deduped.event, '$ai_generation'), greater(deduped.latency, 0))), sumIf(deduped.latency, or(equals(deduped.parent_id, NULL), equals(deduped.parent_id, deduped.trace_id))))), 2) AS total_latency,
    if(greater(countIf(and(isNotNull(deduped.input_tokens), in(deduped.event, tuple('$ai_generation', '$ai_embedding')))), 0), sumIf(deduped.input_tokens, in(deduped.event, tuple('$ai_generation', '$ai_embedding'))), NULL) AS input_tokens,
    if(greater(countIf(and(isNotNull(deduped.output_tokens), in(deduped.event, tuple('$ai_generation', '$ai_embedding')))), 0), sumIf(deduped.output_tokens, in(deduped.event, tuple('$ai_generation', '$ai_embedding'))), NULL) AS output_tokens,
    if(greater(countIf(and(isNotNull(deduped.input_cost_usd), in(deduped.event, tuple('$ai_generation', '$ai_embedding')))), 0), round(sumIf(deduped.input_cost_usd, in(deduped.event, tuple('$ai_generation', '$ai_embedding'))), 10), NULL) AS input_cost,
    if(greater(countIf(and(isNotNull(deduped.output_cost_usd), in(deduped.event, tuple('$ai_generation', '$ai_embedding')))), 0), round(sumIf(deduped.output_cost_usd, in(deduped.event, tuple('$ai_generation', '$ai_embedding'))), 10), NULL) AS output_cost,
    if(greater(countIf(and(isNotNull(deduped.total_cost_usd), in(deduped.event, tuple('$ai_generation', '$ai_embedding')))), 0), round(sumIf(deduped.total_cost_usd, in(deduped.event, tuple('$ai_generation', '$ai_embedding'))), 10), NULL) AS total_cost,
    arrayDistinct(arraySort(x -> x.3, groupArrayIf(tuple(deduped.uuid, deduped.event, deduped.timestamp, deduped.properties, deduped.input, deduped.output, deduped.output_choices, deduped.input_state, deduped.output_state, deduped.tools), notEquals(deduped.event, '$ai_trace')))) AS events,
    argMinIf(deduped.input_state, deduped.timestamp, equals(deduped.event, '$ai_trace')) AS input_state,
    argMinIf(deduped.output_state, deduped.timestamp, equals(deduped.event, '$ai_trace')) AS output_state,
    ifNull(argMinIf(ifNull(nullIf(deduped.span_name, ''), nullIf(deduped.trace_name, '')), deduped.timestamp, equals(deduped.event, '$ai_trace')), argMin(ifNull(nullIf(deduped.span_name, ''), nullIf(deduped.trace_name, '')), deduped.timestamp)) AS trace_name
FROM
    (SELECT
        uuid,
        event,
        timestamp,
        distinct_id,
        properties,
        trace_id,
        session_id,
        parent_id,
        span_name,
        trace_name,
        latency,
        input_tokens,
        output_tokens,
        input_cost_usd,
        output_cost_usd,
        total_cost_usd,
        input,
        output,
        output_choices,
        input_state,
        output_state,
        tools
    FROM
        ai_events
    WHERE
        and(in(event, tuple('$ai_span', '$ai_generation', '$ai_embedding', '$ai_metric', '$ai_feedback', '$ai_trace')), and(greaterOrEquals(ai_events.timestamp, assumeNotNull(toDateTime('2025-12-09 23:35:41'))), lessOrEquals(ai_events.timestamp, assumeNotNull(toDateTime('2025-12-17 00:15:41'))), equals(trace_id, '79955c94-7453-488f-a84a-eabb6f084e4c')))
    LIMIT 1  BY uuid) AS deduped
GROUP BY
    deduped.trace_id
LIMIT 1
```

## LLM traces list

Many traces with latency, tokens, costs and error counts, in two phases for performance: find matching trace IDs, then aggregate. Time ranges are always required; dump large results to a file.

- **It omits the content fields** (`$ai_input`, `$ai_output_choices`, `$ai_input_state`, `$ai_output_state`); those live only on `posthog.ai_events`, retained 30 days by default, read by `trace_id`. Use the single-trace query above for them.
- **Latency is not additive:** the root `$ai_trace` event's `$ai_latency` is the wall-clock time of the whole trace, so the events inside it are already counted ("Adding them again counts the same time twice"). Without it, when only `$ai_generation` events carry latency, sum those; otherwise sum the root-level latencies.
- **Errors:** `isNotNull(properties.$ai_error) OR properties.$ai_is_error = 'true'`.

Phase 1, find trace IDs (add property filters here, for example `properties.$ai_model = 'gpt-4o'`):

```sql
SELECT
    properties.$ai_trace_id AS trace_id,
    min(timestamp) AS first_ts,
    max(timestamp) AS last_ts
FROM events
WHERE
    event IN ('$ai_span', '$ai_generation', '$ai_embedding', '$ai_metric', '$ai_feedback', '$ai_trace')
    AND isNotNull(properties.$ai_trace_id)
    AND properties.$ai_trace_id != ''
    AND timestamp >= now() - INTERVAL 1 HOUR
    AND timestamp <= now()
    -- Add property filters here, e.g.:
    -- AND properties.$ai_model = 'gpt-4o'
    -- AND properties.$ai_is_error = 'true'
GROUP BY trace_id
ORDER BY min(timestamp) DESC
LIMIT 20
```

Phase 2, fetch the trace data (replace the `IN (...)` list with the IDs from phase 1):

```sql
SELECT
    properties.$ai_trace_id AS id,
    any(properties.$ai_session_id) AS ai_session_id,
    min(timestamp) AS first_timestamp,
    ifNull(
        nullIf(argMinIf(distinct_id, timestamp, event = '$ai_trace'), ''),
        argMin(distinct_id, timestamp)
    ) AS first_distinct_id,
    round(
        coalesce(
            -- The root $ai_trace event reports the wall-clock latency of the whole trace,
            -- so the events it contains are already inside that number. Adding them again
            -- counts the same time twice.
            nullIf(maxIf(toFloat(properties.$ai_latency),
                         event = '$ai_trace' AND toFloat(properties.$ai_latency) > 0), 0),
            CASE
                WHEN countIf(toFloat(properties.$ai_latency) > 0 AND event != '$ai_generation') = 0
                     AND countIf(toFloat(properties.$ai_latency) > 0 AND event = '$ai_generation') > 0
                THEN sumIf(toFloat(properties.$ai_latency),
                           event = '$ai_generation' AND toFloat(properties.$ai_latency) > 0)
                ELSE sumIf(toFloat(properties.$ai_latency),
                           properties.$ai_parent_id IS NULL
                           OR toString(properties.$ai_parent_id) = toString(properties.$ai_trace_id))
            END
        ), 2
    ) AS total_latency,
    sumIf(toFloat(properties.$ai_input_tokens),
          event IN ('$ai_generation', '$ai_embedding')) AS input_tokens,
    sumIf(toFloat(properties.$ai_output_tokens),
          event IN ('$ai_generation', '$ai_embedding')) AS output_tokens,
    round(sumIf(toFloat(properties.$ai_input_cost_usd),
          event IN ('$ai_generation', '$ai_embedding')), 10) AS input_cost,
    round(sumIf(toFloat(properties.$ai_output_cost_usd),
          event IN ('$ai_generation', '$ai_embedding')), 10) AS output_cost,
    round(sumIf(toFloat(properties.$ai_total_cost_usd),
          event IN ('$ai_generation', '$ai_embedding')), 10) AS total_cost,
    ifNull(
        argMinIf(
            ifNull(properties.$ai_span_name, properties.$ai_trace_name),
            timestamp, event = '$ai_trace'
        ),
        argMin(
            ifNull(properties.$ai_span_name, properties.$ai_trace_name),
            timestamp
        )
    ) AS trace_name,
    countIf(
        isNotNull(properties.$ai_error) OR properties.$ai_is_error = 'true'
    ) AS error_count
FROM events
WHERE
    event IN ('$ai_span', '$ai_generation', '$ai_embedding', '$ai_metric', '$ai_feedback', '$ai_trace')
    AND timestamp >= now() - INTERVAL 1 HOUR
    AND timestamp <= now()
    AND properties.$ai_trace_id IN ('trace-id-1', 'trace-id-2')
GROUP BY properties.$ai_trace_id
ORDER BY first_timestamp DESC
```

## Prove it

- Every query bounds its timestamp column (`time_bucket` and `timestamp` for logs; plus or minus 30 minutes around the source event for one LLM trace).
- `posthog.trace_spans`, `posthog.metrics` and `posthog.ai_events` are referenced with the prefix, `logs` without.
- Before concluding a metric has no exemplars, a count of `trace_id != ''` rows for that metric and window came back zero.
- Trace IDs shown to people are decoded with `hex(tryBase64Decode(trace_id))`; joins compare the stored base64 directly.
- No `$ai_input`, `$ai_input_state` or `$ai_output_state` value was printed into the conversation; they went to a file.
- Total trace latency does not add child events to a root `$ai_trace` latency.
