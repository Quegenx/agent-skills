# HogQL tables: product data

The tables behind error tracking, logs, APM spans, metrics, LLM analytics, MCP analytics, session replay and heatmaps. They are large and sorted for specific access paths (`service_name` and a time window for logs and spans, `trace_id` for `posthog.ai_events`), and the OpenTelemetry ones store IDs as base64. Prefer the typed MCP tools named in each section for plain lists and time series, and HogQL for cross-signal joins and custom aggregations. General rules are in [HOGQL.md](HOGQL.md); worked queries in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md) and [HOGQL-EXAMPLES-WEB.md](HOGQL-EXAMPLES-WEB.md); the products in [ERROR-TRACKING.md](ERROR-TRACKING.md) and [LLM-ANALYTICS.md](LLM-ANALYTICS.md); configuration tables in [HOGQL-TABLES.md](HOGQL-TABLES.md).

**Contents:** [Namespaces and limits](#namespaces-and-limits) · [Error tracking](#error-tracking) · [Logs](#logs) · [APM spans](#apm-spans) · [Metrics](#metrics) · [LLM analytics](#llm-analytics) · [MCP analytics](#mcp-analytics) · [Session replay](#session-replay) · [Heatmaps](#heatmaps) · [Replay Vision](#replay-vision) · [Prove it](#prove-it)

## Namespaces and limits

| Table | Reference | Notes |
|---|---|---|
| `events`, `logs`, `log_attributes`, `heatmaps` | Bare | `heatmaps` has no `system.` prefix |
| `posthog.ai_events`, `posthog.trace_spans`, `posthog.trace_attributes`, `posthog.metrics`, `posthog.metric_attributes` | With `posthog.` | Bare names fail with "Unknown table" at compile time (registered in `posthog/hogql/database/database.py`) |
| `system.*` | With `system.` | Configuration and metadata |

- **OTel `trace_id` and `span_id` are base64-encoded bytes, not hex,** in `logs`, `posthog.trace_spans` and `posthog.metrics`. Display with `hex(tryBase64Decode(trace_id))`; join across signals by direct equality.
- **50 GB read cap** per user HogQL query on each of `logs`, `posthog.trace_spans` and `posthog.metrics`.

## Error tracking

- **`system.error_tracking_issues`:** `id`, `team_id`, `created_at`, `status`, `severity` (null when unassigned), `name` (auto from the first exception type and message), `description`. Statuses: `active`, `archived` (hidden from default views), `resolved`, `pending_release` (pending verification in a new release), `suppressed` (from alerts and notifications).
- **Issues group `$exception` events by fingerprint** (a hash; fingerprints are not queryable). Issues can be merged or split. Occurrences are `events` rows with `event = '$exception'` and an `issue_id`.
- **All-time counts by status or severity:** `system.error_tracking_issues`. **Issues seen in a date range, or impact counts:** `posthog:query-error-tracking-issues-list`. Access follows the user's Error tracking permissions, current project only.
- **`system.error_tracking_symbol_sets`** (uploaded source maps that unminify JS frames; rows can also track missing sets): `id`, `team_id`, `ref` (chunk or file id), `release_id` (to `error_tracking_releases.id`), `created_at`, `last_used`, `failure_reason`. Storage pointers and hashes are omitted.
- **Symbol set tools:** `posthog:error-tracking-symbol-sets-list` with `status = 'valid'` or `'invalid'`, or an exact `ref` to resolve an ID; then `posthog:error-tracking-symbol-sets-retrieve` or `posthog:error-tracking-symbol-sets-download-retrieve`. Download URLs expire after one hour: use them immediately and don't echo them unless asked.

```sql
SELECT id, ref, failure_reason, created_at, last_used
FROM system.error_tracking_symbol_sets
WHERE failure_reason IS NOT NULL
ORDER BY created_at DESC
LIMIT 20
```

```sql
SELECT id, ref, release_id, created_at, last_used, failure_reason
FROM system.error_tracking_symbol_sets
WHERE ref = 'https://example.com/static/app.min.js'
LIMIT 1
```

```sql
SELECT id, name, status, created_at
FROM system.error_tracking_issues
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20
```

```sql
SELECT id, name, description, status
FROM system.error_tracking_issues
WHERE name ILIKE '%timeout%'
  AND status != 'archived'
```

```sql
SELECT status, count() AS count
FROM system.error_tracking_issues
GROUP BY status
ORDER BY count DESC
```

```sql
SELECT severity, count() AS count
FROM system.error_tracking_issues
WHERE severity IS NOT NULL
GROUP BY severity
ORDER BY count DESC
```

```sql
SELECT
    timestamp,
    properties.$exception_types[1] AS exception_type,
    properties.$exception_values[1] AS exception_message,
    properties.$exception_sources[1] AS source,
    person.id AS user_id
FROM events
WHERE event = '$exception'
  AND issue_id = '01234567-89ab-cdef-0123-456789abcdef'
  AND timestamp >= now() - INTERVAL 7 DAY
ORDER BY timestamp DESC
LIMIT 50
```

```sql
SELECT
    issue_id,
    count() AS occurrences,
    count(DISTINCT person.id) AS affected_users,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event = '$exception'
  AND isNotNull(issue_id)
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY issue_id
ORDER BY occurrences DESC
LIMIT 20
```

```sql
SELECT
    i.id,
    i.name,
    i.status
FROM system.error_tracking_issues AS i
WHERE i.status = 'active'
  AND i.id IN (
    SELECT DISTINCT issue_id
    FROM events
    WHERE event = '$exception'
      AND timestamp >= now() - INTERVAL 1 DAY
  )
ORDER BY i.created_at DESC
```

## Logs

- **Typed first:** `posthog:query-logs` for filtered lists (discover, narrow, count, drill down); HogQL for cross-signal joins with `posthog.trace_spans` and `posthog.metrics` by `trace_id`, or custom aggregations.
- **`logs` columns:** `uuid`, `team_id`, `trace_id` (24-char base64; unset is `'AAAAAAAAAAAAAAAAAAAAAA=='`, not null), `span_id` (12-char base64; unset is `'AAAAAAAAAAA='`), `body` (also `message`), `severity_text` (`trace`, `debug`, `info`, `warn`, `error`, `fatal`), `severity_number`, `level` (alias of `severity_text`), `service_name`, `attributes` Map, `resource_attributes` Map, `resource_fingerprint`, `instrumentation_scope`, `event_name` (often empty), `pattern` (a mined template with variable parts masked), `time_bucket` (`toStartOfDay(timestamp)`), `timestamp` DateTime64(9), `observed_timestamp`. Backed by ClickHouse `logs_distributed`.
- **Sort key `(team_id, service_name, toUnixTimestamp(timestamp))`.** The source rule is "Never query without a `service_name` filter and a time window: unfiltered queries can scan terabytes." Its own cross-service aggregation and trace-correlation recipes deliberately span services. Keep the service filter as the default; an explicit cross-service scope is an exception to that filter, with the actual incident-time bounds on every scan and the same scan-cost warning. A `resource_attributes` filter alone does not prune granules. [existing HOGQL-TABLES-PRODUCTS.md, Logs; HOGQL-EXAMPLES-SIGNALS.md, cross-signal correlation]
- **Hex and base64:** `21EDB3A025A9ECD32ADF3E5D7548A4F4` is `Ie2zoCWp7NMq3z5ddUik9A==`. Logs with trace context: `trace_id != 'AAAAAAAAAAAAAAAAAAAAAA=='` or `tryBase64Decode(trace_id) != unhex('00000000000000000000000000000000')`. Prefer `severity_text` over `severity_number` or `level`.
- **`log_attributes`:** an AggregatingMergeTree rollup per service and 10-minute bucket; `attribute_type` is `log` or `resource`. Prefer `posthog:logs-attributes-list` and `posthog:logs-attribute-values-list`.
- **`system.logs_views`** (saved views): `id`, `team_id`, `short_id`, `name`, `filters` (typically `severityLevels`, `serviceNames`, `filterGroup`), `pinned`, `created_at`, `updated_at`.
- **`system.logs_alerts`** (N-of-M, like AWS CloudWatch alarms): `name`, `enabled`, `filters`, `threshold_count`, `threshold_operator` (`above`/`below`), `window_minutes`, `check_interval_minutes`, `state`, `evaluation_periods` (M), `datapoints_to_alarm` (N, at most M), `cooldown_minutes` (minimum between fire or resolve notifications), `snooze_until`, `next_check_at`, `last_notified_at`, `last_checked_at`, `consecutive_failures`, `created_at`, `updated_at`. States: `not_firing`, `firing`, `pending_resolve`, `errored`, `snoozed`; disabled alerts are set to `not_firing`. Checks live in `LogsAlertEvent`, which is not a system table.

```sql
SELECT service_name, count() AS errors
FROM logs
WHERE severity_text IN ('error', 'fatal')
  AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name
ORDER BY errors DESC
LIMIT 10
```

For a trace-linked log lookup, convert an incoming hex ID with the documented `base64Encode(unhex(...))` form, or compare an already stored base64 ID directly. Apply the actual incident-time bounds and the discovered service scope on that log scan. The retired source lookup omitted both bounds; a trace ID does not make the time-first access path bounded. [existing HOGQL-TABLES-PRODUCTS.md, logs]

An ID selected directly from the table is already in the stored base64 representation. [existing HOGQL-TABLES-PRODUCTS.md]

```sql
SELECT timestamp, severity_text, body
FROM logs
WHERE service_name = 'api-gateway'
  AND timestamp >= now() - INTERVAL 6 HOUR
  AND body ILIKE '%connection refused%'
ORDER BY timestamp DESC
LIMIT 100
```

Saved views (all, then pinned) and log alerts:

```sql
SELECT id, name, short_id, pinned, created_at
FROM system.logs_views
ORDER BY created_at DESC
LIMIT 20
```

```sql
SELECT id, name, short_id
FROM system.logs_views
WHERE pinned
ORDER BY name
```

```sql
SELECT id, name, state, last_checked_at, last_notified_at
FROM system.logs_alerts
WHERE state = 'firing'
ORDER BY last_notified_at DESC
```

```sql
SELECT state, count() AS count
FROM system.logs_alerts
WHERE enabled
GROUP BY state
ORDER BY count DESC
```

```sql
SELECT id, name, state, consecutive_failures, last_checked_at
FROM system.logs_alerts
WHERE state = 'errored' OR consecutive_failures > 0
ORDER BY consecutive_failures DESC
```

```sql
SELECT id, name, state, threshold_count, threshold_operator, window_minutes
FROM system.logs_alerts
WHERE enabled
  AND state != 'snoozed'
ORDER BY created_at DESC
```

## APM spans

- **Typed first:** `posthog:query-apm-spans` (lists with structured filters), `posthog:apm-trace-get` (a full trace), `posthog:apm-spans-aggregate` and `posthog:apm-spans-tree` (aggregations), `posthog:apm-attributes-list` and `posthog:apm-attribute-values-list` (attribute discovery). HogQL for cross-signal joins, exemplar lookups and other aggregations.
- **`posthog.trace_spans` columns:** `uuid` (the row, not the span_id), `team_id`, `trace_id` (24-char base64 of 16 bytes), `span_id` (12-char base64 of 8 bytes), `parent_span_id` (root is `'AAAAAAAAAAA='`, not null), `is_root_span` (Bool; prefer it over string matching), `name`, `kind` (0 Unspecified, 1 Internal, 2 Server, 3 Client, 4 Producer, 5 Consumer), `status_code` (0 Unset, 1 OK, 2 Error), `service_name`, `timestamp`, `end_time`, `observed_timestamp` (DateTime64(6)), `duration_nano` (UInt64 nanoseconds), `attributes`, `resource_attributes`, `resource_fingerprint`, `instrumentation_scope`, `time_bucket`. Backed by `trace_spans_distributed`.
- **Sort key `(team_id, time_bucket, service_name, resource_fingerprint, status_code, name, timestamp)`:** filter on `service_name` and `time_bucket`, then `name`.
- **Units and codes:** durations are nanoseconds (`duration_nano > 1000000000` is longer than 1 s); errors are `status_code = 2`, not the string `"ERROR"`.
- **`posthog.trace_attributes`:** a rollup per service and 10-minute bucket; `attribute_type` is `span_attribute` or `span_resource_attribute`.

```sql
SELECT name, duration_nano, hex(tryBase64Decode(trace_id)) AS trace_id, timestamp
FROM posthog.trace_spans
WHERE service_name = 'checkout'
  AND is_root_span
  AND timestamp >= now() - INTERVAL 1 HOUR
ORDER BY duration_nano DESC
LIMIT 10
```

```sql
SELECT
    service_name,
    countIf(status_code = 2) AS errors,
    count() AS total,
    errors / total AS error_rate
FROM posthog.trace_spans
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name
HAVING total > 100
ORDER BY error_rate DESC
```

```sql
SELECT hex(tryBase64Decode(trace_id)) AS trace_id, min(timestamp) AS started, count() AS span_count
FROM posthog.trace_spans
WHERE service_name IN ('payments', 'inventory')
  AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY trace_id
HAVING uniqExact(service_name) = 2
ORDER BY started DESC
LIMIT 20
```

## Metrics

- **Typed first:** `posthog:query-metrics` for time series (rates, increases, quantiles, formulas); HogQL for exemplar lookups and cross-signal joins.
- **Exemplars are sparse:** ingestion (`rust/capture-logs/src/metric_record.rs`) keeps the first exemplar with a valid trace ID per point, so most rows have `trace_id = ''`. When the window has none, anchor on `posthog.trace_spans`.
- **`posthog.metrics` columns:** `uuid`, `team_id`, `trace_id`, `span_id`, `time_bucket`, `timestamp`, `observed_timestamp`, `service_name`, `metric_name`, `metric_type` (`counter`, `gauge`, `histogram`, `summary`), `value` (for histograms, the sum), `count` (for histograms, the observations; default 1), `histogram_bounds`, `histogram_counts` (length is bounds + 1), `unit` (`ms`, `s`, `By`, `1`), `aggregation_temporality` (`delta`/`cumulative`), `is_monotonic`, `attributes`, `resource_attributes`, `resource_fingerprint`, `instrumentation_scope`. Backed by ClickHouse `metrics1` (distributed alias `metrics`).
- **Sort key `(team_id, time_bucket, service_name, metric_name, resource_fingerprint, timestamp)`.**
- **Projection `projection_aggregate_counts`** keyed by `(team_id, time_bucket, toStartOfMinute(timestamp), service_name, metric_name, metric_type, resource_fingerprint)`, with `count() AS event_count`, `sum(value) AS total_value`, `min(value) AS min_value`, `max(value) AS max_value`: a matching GROUP BY is "near-free". `sum(count)` is not in the projection and forces a base scan.
- **Check `unit` every time** (`http.server.duration` may be ms, s or ns). Summing `value` over time only makes sense for `delta`. Histogram quantiles need bucket expansion; `value / count` is the mean per point.
- **`posthog.metric_attributes`:** `attribute_type` is `metric` or `resource`.

```sql
SELECT metric_name, metric_type, count() AS n
FROM posthog.metrics
WHERE service_name = 'checkout'
  AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY metric_name, metric_type
ORDER BY n DESC
```

The retired `http.server.duration` example grouped by minute/service but divided the sum of histogram population values by the number of rows. For histograms, combine population sums and observation counts, with matching units and temporality; `count()` of rows is not the observation total. Prefer the typed metric query unless the custom aggregation is required. [existing HOGQL-TABLES-PRODUCTS.md; https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/metrics/data-model.md]

```sql
SELECT service_name, sum(value) AS total
FROM posthog.metrics
WHERE metric_name = 'http.server.request.count'
  AND metric_type = 'counter'
  AND aggregation_temporality = 'delta'
  AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name
ORDER BY total DESC
LIMIT 10
```

Exemplar lookup (pair it with `posthog:apm-trace-get` or a join on `trace_spans`):

```sql
SELECT argMax(trace_id, value) AS exemplar_trace_id, max(value) AS peak
FROM posthog.metrics
WHERE service_name = 'checkout'
  AND metric_name = 'http.server.duration'
  AND timestamp >= now() - INTERVAL 10 MINUTE
  AND trace_id != ''
```

## LLM analytics

- **Events on `events`:** `$ai_generation`, `$ai_span`, `$ai_trace`, `$ai_embedding`, `$ai_metric`, `$ai_feedback`, `$ai_evaluation`. Heavy content lives only on `posthog.ai_events`. Prefer the typed `posthog:query-llm-trace` (one trace) and `posthog:query-llm-traces-list`; they join `posthog.ai_events`.
- **What lives where:** `events` keeps token counts, costs, model, provider, `$ai_trace_id`, latency and error flags (mirrored on `ai_events` without the prefix: `$ai_model` is `model`). Heavy fields: `$ai_input` is `input`, `$ai_output` is `output`, `$ai_output_choices` is `output_choices`, `$ai_input_state` is `input_state`, `$ai_output_state` is `output_state`, `$ai_tools` is `tools`. Typically `$ai_generation` carries input, output_choices and tools; embeddings carry input; `$ai_span` and `$ai_trace` carry input_state and output_state. The full list is in `posthog/hogql/database/schema/ai_events.py`.
- **`posthog.ai_events` is `ORDER BY (team_id, trace_id, timestamp)`:** `trace_id` is the access path, not timestamp. Retention is 30 days by default.

```sql
SELECT timestamp, span_id, event, model, input, output_choices
FROM posthog.ai_events
WHERE trace_id = '<trace_id>'
ORDER BY timestamp
```

```sql
WITH matching_traces AS (
    SELECT DISTINCT properties.$ai_trace_id AS trace_id
    FROM events
    WHERE event = '$ai_generation'
        AND timestamp >= now() - INTERVAL 7 DAY
        AND properties.$ai_model = 'gpt-4o'
)
SELECT a.trace_id, a.span_id, a.model, a.input, a.output_choices
FROM posthog.ai_events AS a
WHERE a.trace_id IN (SELECT trace_id FROM matching_traces)
ORDER BY a.trace_id, a.timestamp
```

- **`system.evaluation_directories`** (flat): `id`, `team_id`, `name`, `created_by_id`, `created_at`, `updated_at`. Deleting a directory sets its evaluations' `directory_id` to NULL.
- **`system.evaluations`** (online evals; results are stored as `$ai_evaluation` events): `id`, `directory_id` (NULL means top level), `name`, `description`, `enabled`, `status`, `status_reason`, `evaluation_type`, `evaluation_config`, `output_type`, `output_config`, `conditions`, `target` (generation or trace), `target_config`, `model_configuration_id` (the LLM judge), `created_by_id`, `created_at`, `updated_at`, `deleted` (Boolean; filter `deleted = false`).

```sql
SELECT
    d.id,
    d.name,
    count(e.id) AS evaluation_count
FROM system.evaluation_directories AS d
LEFT JOIN system.evaluations AS e
    ON e.directory_id = d.id
   AND e.deleted = false
GROUP BY d.id, d.name
ORDER BY d.name ASC
```

```sql
SELECT id, name, evaluation_type, status, updated_at
FROM system.evaluations
WHERE deleted = false
  AND directory_id IS NULL
ORDER BY updated_at DESC
LIMIT 100
```

- **`system.trace_reviews`:** at most one active review per trace; `id`, `trace_id`, `created_by_id`, `reviewed_by_id`, `comment`, `created_at`, `updated_at`, `deleted` (Integer), `deleted_at`.
- **`system.trace_review_scores`:** `review_id`, `definition_id`, `definition_version`, `definition_version_number`, `definition_config` (a snapshot at scoring time), and exactly one of `categorical_values`, `numeric_value` or `boolean_value`.
- **`system.review_queues` and `system.review_queue_items`:** pending work; a trace is pending in one queue at a time, and saving a matching review may soft-delete the item.
- **`system.score_definitions`** ("scorers"): `name`, `description`, `kind` (immutable: `'categorical'`, `'numeric'`, `'boolean'`), `archived`, `current_version_id`. Config is versioned and immutable; there is no destroy endpoint (create a new one and archive the old). Filter `archived = false`; the full `config` comes from the REST `llma-score-definition-get` tool.

```sql
SELECT
    r.id,
    r.trace_id,
    r.reviewed_by_id,
    r.updated_at,
    count(s.id) AS score_count
FROM system.trace_reviews AS r
LEFT JOIN system.trace_review_scores AS s ON s.review_id = r.id
WHERE r.deleted = 0
GROUP BY r.id, r.trace_id, r.reviewed_by_id, r.updated_at
ORDER BY r.updated_at DESC
LIMIT 20
```

```sql
SELECT
    q.id,
    q.name,
    count(i.id) AS pending_item_count
FROM system.review_queues AS q
LEFT JOIN system.review_queue_items AS i
    ON i.queue_id = q.id
   AND i.deleted = 0
WHERE q.deleted = 0
GROUP BY q.id, q.name
ORDER BY q.name ASC
```

Pending traces in one queue, recent review scores, and scorer usage:

```sql
SELECT
    i.trace_id,
    i.created_at,
    i.created_by_id
FROM system.review_queue_items AS i
WHERE i.queue_id = '01234567-89ab-cdef-0123-456789abcdef'
  AND i.deleted = 0
ORDER BY i.created_at ASC
LIMIT 100
```

```sql
SELECT
    r.trace_id,
    s.definition_id,
    s.definition_version_number,
    s.categorical_values,
    s.numeric_value,
    s.boolean_value
FROM system.trace_review_scores AS s
INNER JOIN system.trace_reviews AS r ON r.id = s.review_id
WHERE r.deleted = 0
ORDER BY r.updated_at DESC, s.created_at ASC
LIMIT 100
```

```sql
SELECT
    d.id,
    d.name,
    d.kind,
    count(s.id) AS uses
FROM system.score_definitions AS d
LEFT JOIN system.trace_review_scores AS s ON s.definition_id = d.id
WHERE d.archived = false
GROUP BY d.id, d.name, d.kind
ORDER BY uses DESC, d.name ASC
LIMIT 50
```

- **Datasets** (offline evals): every item mutation creates a dataset revision (an exact snapshot); editing a dataset's name, description or metadata does not. `system.datasets` (`current_revision_id` is NULL before the first item mutation; `archived`), `system.dataset_revisions` (`revision` is monotonic), `system.dataset_items` (stable; `client_item_id` unique within the dataset; `current_version_id`; no content or archive state), `system.dataset_item_versions` (`version`, `archived`, `input`, `expected_output`, `source_output`, `metadata`, `source_trace_id`, `source_event_id`, `source_timestamp`). Source output and trace provenance are immutable; edits may change only input, expected output, metadata and archive state.

Current items, items as of a revision, then one item's immutable history:

```sql
SELECT
    i.id,
    i.client_item_id,
    v.version,
    v.input,
    v.expected_output,
    v.source_output,
    v.metadata
FROM system.dataset_items AS i
INNER JOIN system.dataset_item_versions AS v ON v.id = i.current_version_id
WHERE i.dataset_id = '01234567-89ab-cdef-0123-456789abcdef'
  AND v.archived = false
ORDER BY i.created_at DESC
LIMIT 100
```

```sql
SELECT
    i.id,
    i.client_item_id,
    argMax(v.version, r.revision) AS version,
    argMax(v.input, r.revision) AS input,
    tupleElement(argMax(tuple(v.expected_output), r.revision), 1) AS expected_output,
    tupleElement(argMax(tuple(v.source_output), r.revision), 1) AS source_output,
    argMax(v.metadata, r.revision) AS metadata
FROM system.dataset_items AS i
INNER JOIN system.dataset_item_versions AS v ON v.dataset_item_id = i.id
INNER JOIN system.dataset_revisions AS r ON r.id = v.dataset_revision_id
WHERE i.dataset_id = '01234567-89ab-cdef-0123-456789abcdef'
  AND r.revision <= 7
GROUP BY i.id, i.client_item_id
HAVING argMax(v.archived, r.revision) = false
ORDER BY i.id
```

```sql
SELECT
    version,
    archived,
    input,
    expected_output,
    metadata,
    dataset_revision_id,
    created_by_id,
    created_at
FROM system.dataset_item_versions
WHERE dataset_item_id = '01234567-89ab-cdef-0123-456789abcdef'
ORDER BY version DESC
```

## MCP analytics

Any MCP server instrumented with the `@posthog/mcp` SDK (PostHog's own included) emits a `$mcp_tool_call` event on `events` per tool call. There is no dedicated table: every field is a `$mcp_*` property, queried with `posthog:execute-sql`.

- **Governed metric first:** for a failure-rate headline, call `posthog:metric-list`, look for `mcp_tool_call_fail_pct` and run it with `posthog:data-catalog-metric-run`; label other breakdowns noncanonical.
- **Query only the canonical `$mcp_tool_call` and `$mcp_initialize`.** PostHog's hosted server also emits legacy `mcp_tool_call` and `mcp_initialize`, so `event IN ('mcp_tool_call', '$mcp_tool_call')` double-counts.
- **Per-tool typed tools** (they take `toolName` and `dateRange` and match the UI): `posthog:query-mcp-tool-stats` (calls, errors, p50/p95, users, sessions, intents), `posthog:query-mcp-tool-daily-stats`, `posthog:query-mcp-tool-failures`, `posthog:query-mcp-tool-failure-occurrences`, `posthog:query-mcp-tool-top-users`, `posthog:query-mcp-tool-neighbors` (`neighborDirection: before`/`after`), `posthog:query-mcp-tool-sample-intents`, `posthog:query-mcp-tool-descriptions`, plus `posthog:query-mcp-harness-breakdown`.
- **Session tools:** `posthog:mcp-analytics-sessions-list`, `posthog:mcp-analytics-sessions-tool-calls`, `posthog:mcp-analytics-sessions-generate-intent` (7-day default lookback; pass `session_start` as `date_from`; report the raw `$mcp_tool_name`; the list has no error filter). Intent clusters: `posthog:mcp-analytics-intent-clusters-retrieve` and `-recompute` (no SQL fallback).

| Property | Notes |
|---|---|
| `$mcp_tool_name`, `$mcp_exec_tool_call_name`, `$mcp_exec_tool_call_description` | The last two only on exec calls |
| `$mcp_is_error` | Read with `toBool(...)` |
| `$mcp_error_type` | `internal`, `validation`, `api_4xx`, `api_5xx`, `permission`, `timeout`, `rate_limited`, `missing_context`; an SDK field that PostHog's own server also stamps |
| `$mcp_error_status` | Server only, for HTTP failures: a server instrumented with the SDK alone won't emit it |
| `$mcp_error_message` | Sanitized, truncated to 2048 chars; empty on events captured before PostHog's server started emitting it. PostHog's own tool calls do not emit `$exception`; those exist only for separately-instrumented MCP servers |
| `$mcp_duration_ms` | Read with `toFloat` |
| `$session_id` | Use the bare column, not `properties.$session_id` |
| `$mcp_intent`, `$mcp_intent_source` | Source is `context_parameter` or `inferred` (via `intentFallback`) |
| `$mcp_conversation_id` | Needs `enableConversationId` |
| `$mcp_parameters`, `$mcp_response` | Response is redacted; empty on PostHog hosted |
| `$mcp_client_name`, `$mcp_client_version` | |
| `$mcp_llm_model`, `$mcp_llm_model_source` | Source `client_metadata` or `self_reported`; unverified, not for billing or access control |
| `$mcp_tool_category` | Server |
| `$mcp_tool_description` | Clipped to 512 chars; a gap roughly Jun to Jul 2026 on PostHog hosted; `notEmpty(...)` is mandatory |
| `$mcp_listed_tool_names`, `$mcp_exec_inner_tool_names` | The second only on exec |
| `$mcp_server_name`, `$mcp_server_version`, `$mcp_protocol_version` | Protocol version added in SDK v0.10.0 |
| `$mcp_resource_name`, `$mcp_source` | Source for example `posthog_mcp_analytics` |

- **Server-only extras:** `$mcp_session_id`, `$mcp_region`, `$mcp_mode` (`cli`/`tools`), `$mcp_consumer`, legacy `mcp_vendor_client`, `mcp_runtime`, `$mcp_auth_method` (`oauth`, `personal_api_key`, `id_jag`, `none`, `unknown`), `$mcp_scope_preset`.
- **`$mcp_auth_failed`** (PostHog server only): `$mcp_auth_failure_reason` (`insufficient_scope`, `inactive_oauth_token`, `invalid_api_key`, `unknown`), `$mcp_missing_scope`, `$mcp_auth_status` (401/403). No org or project id; `distinct_id` is a hash of the bearer token, so count with `uniq(distinct_id)` and join by client and time, never by person.
- **Three identifiers:** `$session_id` (for GROUP BY and joins), `$mcp_session_id` (transport; rotates on restart or reconnect), `$mcp_conversation_id` (stable across reconnects).
- **`$mcp_tools_list`** is emitted per tools/list response and holds `$mcp_listed_tool_names` (a JSON array) and `tool_count`: the denominator for "advertised but never called" analysis. Only about half of tool-call sessions carry it, and exec-wrapper sessions advertise just `['exec', 'render-ui']`, so condition per-tool discovery cuts on sessions where the catalog was actually observed.
- **Failures with detail:** `posthog:query-mcp-tool-failures` groups errored calls by `$mcp_error_type` and `$mcp_error_status` and returns each bucket's raw `error_type`/`error_status`; pass those to `posthog:query-mcp-tool-failure-occurrences` for individual errored calls with `$mcp_error_message`.
- **Harness bucketing** is resolved server-side by `MCPHarnessBreakdownQueryRunner` (`products/mcp_analytics/backend/mcp_harness.py`, `HARNESS_TOKEN_SQL` / `harness_label_sql`). `posthog:query-mcp-harness-breakdown` accepts `dateRange`, `properties`, `filterTestAccounts` and an optional `toolName` (which also restricts to `$mcp_source = 'posthog_mcp_analytics'` and may undercount). Signals: `$mcp_vendor_client` (plus legacy `mcp_vendor_client`), `$mcp_client_user_agent`, `$mcp_client_name`. Buckets: Claude Desktop, Claude Code (VS Code), Claude Agent SDK, Claude Code, Claude.ai, Anthropic API, Cowork, Claude Design, ChatGPT, OpenAI Agent Builder, OpenAI Responses API, OpenAI Codex, OpenAI, Grok, Cursor, VS Code, Windsurf, Replit, Lovable, Manus, CodeRabbit, Notion, Linear, LibreChat, Pi, Kimchi, Antigravity, Poke, opencode, Kiro, Desktop Commander, PostHog CLI, Other. Shares can sum past 100%.

Effective tool name, and the listed-tools catalog (the `coalesce(..., '[]')` is required: the property accessor is Nullable, and `JSONExtract` of a Nullable into `Array(String)` is a ClickHouse type error):

```sql
coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name))
```

```sql
JSONExtract(coalesce(toString(properties.$mcp_listed_tool_names), '[]'), 'Array(String)')
```

The SQL below is the fallback for cross-tool rankings and custom cuts; for a single tool's numbers, call the typed tool instead. Error rate of one tool (noncanonical breakdown):

```sql
SELECT
    count() AS total_calls,
    countIf(toBool(properties.$mcp_is_error)) AS errors,
    round(countIf(toBool(properties.$mcp_is_error)) * 100.0 / count(), 1) AS error_rate_pct
FROM events
WHERE event = '$mcp_tool_call'
    -- effective tool name: new-SDK events put the real tool in $mcp_exec_tool_call_name
    AND coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name)) = '<tool-name>'
    AND timestamp >= now() - INTERVAL 7 DAY
```

Tool-quality matrix (noncanonical; no typed tool ranks across tools, so drill into a picked tool with `posthog:query-mcp-tool-stats`, `posthog:query-mcp-tool-failures` or `posthog:query-mcp-tool-daily-stats`):

```sql
SELECT
    -- effective tool name: new-SDK events put the real tool in $mcp_exec_tool_call_name,
    -- so grouping on raw $mcp_tool_name would collapse them under the single-exec wrapper
    coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name)) AS tool,
    count() AS total_calls,
    round(countIf(toBool(properties.$mcp_is_error)) * 100.0 / count(), 1) AS error_rate_pct,
    round(quantile(0.5)(toFloat(properties.$mcp_duration_ms))) AS p50_ms,
    round(quantile(0.95)(toFloat(properties.$mcp_duration_ms))) AS p95_ms,
    uniq(distinct_id) AS users,
    countDistinctIf($session_id, $session_id != '') AS sessions
FROM events
WHERE event = '$mcp_tool_call'
    AND coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name)) != ''
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool
ORDER BY total_calls DESC
```

Daily activity:

```sql
SELECT toDate(timestamp) AS day,
    countIf(NOT toBool(properties.$mcp_is_error)) AS successes,
    countIf(toBool(properties.$mcp_is_error)) AS errors
FROM events
WHERE event = '$mcp_tool_call' AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY day ORDER BY day
```

Tool co-occurrence (swap `lagInFrame` for `leadInFrame` to get the tools called after):

```sql
SELECT prev_tool AS tool, count() AS co_occurrences
FROM (
    SELECT $session_id AS conv_id,
        coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name)) AS tool,
        lagInFrame(coalesce(nullIf(toString(properties.$mcp_exec_tool_call_name), ''), toString(properties.$mcp_tool_name)))
            OVER (PARTITION BY $session_id ORDER BY timestamp
                  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS prev_tool
    FROM events
    WHERE event = '$mcp_tool_call' AND timestamp >= now() - INTERVAL 7 DAY
)
WHERE tool = '<tool-name>' AND prev_tool != '' AND prev_tool != tool
GROUP BY prev_tool ORDER BY co_occurrences DESC LIMIT 5
```

## Session replay

- **`system.session_recordings`** is Postgres metadata (the replay data itself is in ClickHouse and object storage): `id`, `session_id` (matches `events.$session_id`; the user-facing ID), `distinct_id`, `duration` (seconds, active plus inactive), `active_seconds`, `inactive_seconds`, `start_time`, `end_time`, `click_count`, `keypress_count`, `mouse_activity_count`, `console_log_count`, `console_warn_count`, `console_error_count`, `start_url`, `deleted`, `created_at`, `retention_period_days`. Recordings are created by the SDK, not the API; activity data may be NULL for older ones. Filter `ifNull(deleted, 0) = 0`.
- **`system.session_recording_playlists`:** `type` is `collection` (manual) or `filters` (saved criteria; `filters` only means something here). Look up by `short_id`; filter `deleted = 0`. Other columns include `name`, `derived_name`, `pinned`, `created_by_id`, `last_modified_at`, `last_modified_by_id`. Items live in `SessionRecordingPlaylistItem`, which is not a system table.
- **Recording listings with activity scores** use `raw_session_replay_events`: see [HOGQL-EXAMPLES-WEB.md](HOGQL-EXAMPLES-WEB.md#session-replay).

## Heatmaps

- **`heatmaps`** is captured when `heatmaps_opt_in` is on for the team and retained 90 days. Columns: `session_id`, `distinct_id`, `x`, `y`, `scale_factor`, `viewport_width`, `viewport_height`, `pointer_target_fixed`, `current_url`, `timestamp` (UTC), `type` (`'click'`, `'rageclick'`, `'mousemove'`, `'scrolldepth'`).
- **`scale_factor` is always 16:** multiply `x`, `y` and `viewport_*` by it to get CSS pixels. Scroll reach is `(y + viewport_height) * scale_factor`.
- **It stores coordinates, not elements:** cross-reference `$autocapture` on the same `current_url` (`elements_chain` / `$el_text`).
- **Saved heatmaps are MCP only:** `heatmaps-saved-list`, `heatmaps-saved-get`, `heatmaps-saved-create`, `heatmaps-saved-update`, `heatmaps-saved-regenerate` (the screenshot is not exposed over MCP).

```sql
SELECT
    round(x / viewport_width, 2) AS rel_x,
    y * scale_factor AS client_y,
    count() AS clicks
FROM heatmaps
WHERE current_url = 'https://example.com/pricing'
  AND type = 'click'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY rel_x, client_y
ORDER BY clicks DESC
LIMIT 20
```

```sql
SELECT current_url, count() AS rageclicks
FROM heatmaps
WHERE type = 'rageclick' AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY current_url
ORDER BY rageclicks DESC
LIMIT 20
```

## Replay Vision

- **`system.replay_scanners`** are LLM scanners over recordings; observations land as `$recording_observed` events (`properties.scanner_id`, `properties.session_id`). Columns: `scanner_type` (monitor, classifier, scorer, summarizer), `scanner_config` (always includes the prompt), `query` (a RecordingsQuery), `sampling_rate` (0 to 1), `sampling_mode` (focused, balanced, comprehensive), `model`, `enabled`, `emits_signals`, `scanner_version`, `credit_limit`, `estimated_monthly_observations`, `last_swept_at`. One-off inline scans are not listed. Alerts and backfills: `vision-alerts-list`, `vision-scanners-backfills-list`.

```sql
SELECT s.name, count() AS observations
FROM events e
JOIN system.replay_scanners s ON toString(s.id) = e.properties.scanner_id
WHERE e.event = '$recording_observed' AND e.timestamp > now() - INTERVAL 7 DAY
GROUP BY s.name
ORDER BY observations DESC
```

## Prove it

- Every log/span scan has the actual incident-time bounds. Discover service scope before a per-service query; explicitly identify a deliberate cross-service aggregation or trace-correlation scope rather than silently treating it as a per-service lookup. [existing HOGQL.md, time ranges; HOGQL-TABLES-PRODUCTS.md, logs and spans]
- Prefixed tables carry `posthog.`; a bare-name "Unknown table" error never reached the user.
- A hex trace ID was converted with `base64Encode(unhex('<hex_trace_id>'))` before comparing to `trace_id`.
- Span durations are read as nanoseconds and errors as `status_code = 2`.
- Metric values were checked against `unit`, and sums over time used only `delta` series.
- MCP counts use only `$mcp_tool_call`, group on the effective tool name, and `posthog:metric-list` was checked for `mcp_tool_call_fail_pct` first.
- Heatmap coordinates were multiplied by `scale_factor` (16) before being reported as pixels.
