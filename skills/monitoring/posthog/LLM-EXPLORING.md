# Exploring LLM data

Reads what AI Observability captured: single traces and AI sessions, spend and its regressions, embedding clusters of traces, and the silent failures hiding in HTTP 200 responses. Where the data lives decides how you fetch it: token counts, costs, model and ids sit on `events`, but prompts and outputs live only on `posthog.ai_events`, keyed by `trace_id`; the typed trace tools read both for you, return summaries that omit content unless you ask, and withhold non-`$ai_*` properties. Evaluations (online and offline) are in [LLM-EVALUATIONS.md](LLM-EVALUATIONS.md); this file and that one are split by job. The event model, capture and cost calculation are in [LLM-ANALYTICS.md](LLM-ANALYTICS.md); provider setup in [LLM-PROVIDERS.md](LLM-PROVIDERS.md); the `posthog.ai_events` columns, sort key and the single-trace and batch SQL in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md#llm-analytics); ranking users by spend in [EXPENSIVE-AI-USERS.md](EXPENSIVE-AI-USERS.md); MCP tool analytics in [MCP-ANALYTICS.md](MCP-ANALYTICS.md).

**Contents:** [Traces: the model](#traces-the-model) · [Traces: tools and calls](#traces-tools-and-calls) · [Traces: SQL](#traces-sql) · [Traces: investigation](#traces-investigation) · [Costs](#costs) · [Clusters](#clusters) · [Finding AI failures](#finding-ai-failures) · [Links to the UI](#links-to-the-ui) · [Prove it](#prove-it)

## Traces: the model

- **Hierarchy:** `$ai_trace` (top-level container) holds `$ai_span` (logical groupings such as "RAG retrieval" or "tool execution"), which hold `$ai_generation` (one LLM API call) and `$ai_embedding`. Children link through `$ai_parent_id` to the parent's `$ai_span_id` or `$ai_trace_id`.
- **Capture order** is `$ai_span`, then `$ai_generation`/`$ai_embedding`, then `$ai_trace`: the trace event is emitted last, after all children.
- **`$ai_trace` properties:** `$ai_trace_id`, `$ai_trace_name`, `$ai_session_id` (groups traces into a session), `$ai_input_state`/`$ai_output_state` (JSON, can be very large), `$ai_latency` (float seconds, the whole trace).
- **`$ai_span`:** `$ai_trace_id`, `$ai_span_id`, `$ai_span_name`, `$ai_parent_id`, `$ai_latency`, `$ai_input_state`, `$ai_output_state`.
- **`$ai_generation`:** `$ai_trace_id`, `$ai_parent_id`, `$ai_model` (e.g. `"gpt-4o"`, `"claude-sonnet-4-20250514"`), `$ai_provider` (`"openai"`, `"anthropic"`), `$ai_input` (JSON array of `{role, content}`, can be very large), `$ai_output_choices` (JSON array of `{message: {role, content}}`, may include tool calls), `$ai_input_tokens`, `$ai_output_tokens`, `$ai_input_cost_usd`, `$ai_output_cost_usd`, `$ai_total_cost_usd`, `$ai_latency`, `$ai_http_status` (int), `$ai_is_error` (bool), `$ai_error` (string), `$ai_base_url`, `$ai_tools_called` (comma-separated tool names).
- **`$ai_embedding`:** `$ai_trace_id`, `$ai_parent_id`, `$ai_model`, `$ai_provider`, `$ai_input_tokens`, `$ai_total_cost_usd`, `$ai_latency`.
- **Costs sit only on `$ai_generation` and `$ai_embedding`.** A trace's cost is the sum of `$ai_total_cost_usd` across them per `$ai_trace_id`.
- **Querying `events.properties.$ai_input` or `$ai_output_choices` returns empty.** Heavy content lives on `posthog.ai_events` (mapping and access path in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md#llm-analytics)). Prefer the trace tools, which read it for you; drop to SQL only for aggregations, joins and batch extraction.
- **Retention:** `posthog.ai_events` drops rows after 30 days by default; the clusters skill says only that it has a shorter retention than `events`, so old clusters may have metrics but no content. Confirm in the current docs.

## Traces: tools and calls

- **Tools:** `posthog:query-llm-traces-list` (search and list; can return large multi-trace payloads), `posthog:query-llm-trace` (one trace by ID with the full event tree), `posthog:read-data-schema` (custom event and person properties before filtering), `posthog:execute-sql`.
- **Returned JSON:** `results` (array for the list, object for one trace) with `id`, `traceName`, `createdAt`, `totalLatency`, `totalCost`, `inputState`, `outputState`, and `events[]`, each `event` one of `$ai_span`, `$ai_generation`, `$ai_embedding`, `$ai_metric`, `$ai_feedback` with `id`, `createdAt`, `properties`. `$ai_trace` events are not in `events[]`; their data surfaces as `inputState`, `outputState` and `traceName`.
- **Set `detail: "summary"` explicitly when browsing.** Omitting `detail` still returns full detail for compatibility. Summary leaves out prompts, outputs, span states, `$ai_error` and `$ai_feedback_text`, lists them in `_summaryOmittedKeys`, and marks the trace `_detail: { "mode": "summary" }`. Switch to `detail: "full"` before inspecting tool arguments, context or content.
- **Conflict on the parameter name:** the traces SKILL.md names it `detail` (`summary`/`full`); its events reference says `contentDetail: "preview"` or `"none"`, and to dump `"full"` results to a file. Confirm in the current tool schema.
- **Size limits apply in both modes.** "A dropped event, a name listed in `_summaryOmittedKeys` or `_redactedKeys`, or a keyword missing from a summary is not evidence that it was absent from the trace." Narrow the query, or open `_posthogUrl`. Always include `_posthogUrl` in your answer.
- **Withheld properties:** the trace tools return only taxonomy `$ai_*` properties plus `$ai_generation_id`, `$ai_cache_read_cost_usd`, `$ai_cache_creation_cost_usd`, `$ai_effort`, `$session_id`, `$lib`, `$lib_version`. Every other event property and all person properties are withheld in both modes and named in `_redactedKeys`; `$ai_base_url` and `$ai_request_url` arrive without query string. Withheld properties (custom `project_id`, `conversation_id`) still work as filters; read their values in the UI or with `execute-sql`.
- **Never output `$ai_input`, `$ai_input_state` or `$ai_output_state` directly.** They can be megabytes: dump results to a file and explore with bash.
- **Always set `dateRange`.** Narrow windows (`-30m`, `-1h`) for broad listing; `-7d` or `-30d` is fine when filtered by trace ID or specific values. For SQL around a source event, use -30 to +30 minutes. Use `filterTestAccounts: true` to drop internal traffic when searching.

### Debug from a URL

- **Classify the URL.** `/ai-observability/traces/<trace_id>`, or legacy `/llm-analytics/traces/<trace_id>` and `/llm-observability/traces/<trace_id>`, is one trace: `query-llm-trace`. `/ai-observability/sessions/<session_id>` or legacy `/llm-analytics/sessions/<session_id>` is an AI session: `query-llm-traces-list` filtered on `$ai_session_id`. Do not treat every UUID-looking value as a trace ID.
- **Dates:** keep the URL's `date_from`/`date_to`; else with a `timestamp` param query `timestamp - 36h` to `timestamp + 36h`; else `{"date_from": "-7d"}`.
- **For exact URLs** skip schema discovery for standard `$ai_*` fields and set `filterTestAccounts: false` so the trace isn't hidden.

Trace call: `{"traceId": "<trace_id>", "detail": "summary", "dateRange": { "date_from": "-7d" }}`

Session call:

```json
{
  "detail": "summary",
  "dateRange": { "date_from": "<timestamp_minus_36h>", "date_to": "<timestamp_plus_36h>" },
  "filterTestAccounts": false,
  "limit": 20,
  "properties": [{ "type": "event", "key": "$ai_session_id", "value": ["<session_id>"], "operator": "exact" }]
}
```

### Filter the list

- **"Never assume event names, property names, or property values from training data."** For open-ended searches and custom filters, call `read-data-schema` first: `kind: "events"` (confirm `$ai_*`), `kind: "event_properties"` with `event_name: "$ai_generation"`, `kind: "event_property_values"` with `event_name` and `property_name: "$ai_model"`; person properties with `kind: "entity_properties"`, `entity: "person"`. No need to confirm `$ai_*` properties; do confirm others such as a person's `email`.
- **Filters are AND-ed:**

`{"detail": "summary", "dateRange": {"date_from": "-1h"}, "filterTestAccounts": true, "limit": 20, "properties": [{"type": "event", "key": "$ai_model", "value": "gpt-4o", "operator": "exact"}]}`

  Add `$ai_provider` exact `anthropic` and `{"type": "event", "key": "$ai_is_error", "value": ["true"], "operator": "exact"}`; a person filter `{"type": "person", "key": "email", "value": "@company.com", "operator": "icontains"}`; an external id `{"type": "event", "key": "project_id", "value": "proj_abc123", "operator": "exact"}` after `read-data-schema` with `event_name: "$ai_trace"`.

### Parsing scripts

**Upstream-only prerequisite:** the helper scripts described in this section are not included in this skill. Obtain and read the exact source helper before using its commands or depending on its output; if unavailable, report that step as unverified. Do not invent a replacement or assume these paths exist in the project. [PostHog skills, LLM-EXPLORING.md]

The upstream example trace fixtures are also not included here. Obtain the exact source fixture before depending on it. [PostHog skills, LLM-EXPLORING.md]

The upstream traces source describes Python helpers; after satisfying the availability prerequisite, use this order on a saved result file:

| Script | Does |
|---|---|
| `print_summary.py FILE` | Overview; collection totals for lists |
| `print_timeline.py FILE` | Timeline |
| `SPAN="tool_name" extract_span.py FILE` | Case-insensitive substring match on `$ai_span_name` |
| `extract_conversation.py FILE` | Thinking, text, tool_use, tool_result blocks and `tool_calls` |
| `SEARCH="keyword" search_traces.py FILE` | Keyword search (cannot find keywords only in withheld properties) |
| `cat blob.json \| show_structure.py` | Keys and types, max depth 3 |

- **`MAX_LEN=N`** truncates (0 = unlimited); defaults: `extract_conversation` 500, `extract_span` 0, `print_summary` 500.
- **Saved file format:** `[{ "type": "text", "text": "{\"results\": [...], \"_posthogUrl\": \"...\"}" }]`; the scripts unwrap it. They cannot recover content omitted from a summary, withheld or truncated.

## Traces: SQL

The traces list query intentionally omits `$ai_input`, `$ai_output`, `$ai_output_choices`, `$ai_input_state`, `$ai_output_state` and `$ai_tools`, and always needs a time range. Phase 1 finds trace IDs:

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

- **Phase 2 rolls up per trace** (filter `properties.$ai_trace_id IN ('trace-id-1', 'trace-id-2')`). `total_latency` uses the root `$ai_trace`'s `$ai_latency` when above 0: "The root $ai_trace event reports the wall-clock latency of the whole trace, so the events it contains are already inside that number. Adding them again counts the same time twice." Otherwise, if only generations have latency, sum the generations; else sum the latency of events whose `$ai_parent_id` is NULL or equals `$ai_trace_id`.
- **Tokens and costs** sum over `event IN ('$ai_generation', '$ai_embedding')` with `round(..., 10)`; `error_count = countIf(isNotNull(properties.$ai_error) OR properties.$ai_is_error = 'true')`.
- **The full rendered single-trace `TraceQuery`** (over `ai_events`, deduped `LIMIT 1 BY uuid`, grouped by `trace_id`, with latency, token and cost rollups) is in the traces skill's `references/example-llm-trace.md`.
- **Content by trace:** filter timestamp-indexed `events` for trace IDs first, then fetch from `posthog.ai_events` by `trace_id`; both queries are in [HOGQL-TABLES-PRODUCTS.md](HOGQL-TABLES-PRODUCTS.md#llm-analytics).

## Traces: investigation

| Question | Where to look |
|---|---|
| Was the tool used correctly? | The `$ai_span` by `$ai_span_name`: `$ai_input_state` (arguments), `$ai_output_state` (return), `$ai_is_error` |
| Was the context right, the right files surfaced? | The deciding `$ai_generation`'s `$ai_input` (full message history), and preceding retrieval spans' `$ai_output_state` |
| Did the subagent work? | Child spans via `$ai_parent_id` (parent = orchestrator); each child's `$ai_output_state` and `$ai_is_error`; `$ai_generation` under a child = the subagent's LLM calls |
| Why did the LLM say X? | `SEARCH="the text" python3 scripts/search_traces.py FILE`, then that generation's `$ai_input` |

## Costs

- **Tools:** `posthog:execute-sql` ("the workhorse"), `posthog:query-trends`, `posthog:query-llm-traces-list`, `posthog:query-llm-trace`, `posthog:read-data-schema`, `posthog:insight-create`, `posthog:dashboard-create`, `posthog:alert-create`, `posthog:generate-app-url`, `posthog:docs-search`, `insight-query`.
- **Sum `$ai_total_cost_usd`, never the components:** components drop request and web-search fees. The UI's cost cells sum it over `event IN ('$ai_generation', '$ai_embedding')`.
- **Always include `$ai_embedding` with `$ai_generation`.** `$ai_trace` and `$ai_span` carry no rollup cost; some SDK wrappers copy `$ai_total_cost_usd` onto `$ai_trace`, so including it double counts, and summing on `$ai_span` gives zero.
- **`$ai_evaluation` events also carry cost,** but stock UI rollups and query runners exclude them. Include them only when asked (`event IN ('$ai_generation', '$ai_embedding', '$ai_evaluation')`) and call out the expanded definition.
- **Always set a time range,** or the query scans the whole events table.
- **`distinct_id` is the user dimension;** exclude rows where `distinct_id = properties.$ai_trace_id` (some SDKs default the distinct ID to the trace ID). Discover custom dimensions (`feature`, `tenant_id`, `workflow_name`) with `read-data-schema`; never guess names. Per-user work is in [EXPENSIVE-AI-USERS.md](EXPENSIVE-AI-USERS.md).
- **Exclude errored calls only when asked:** providers still charge for many error modes.
- **For "why is X expensive?",** show cost and the token split. Check the stock `/ai-observability/dashboard` tiles before building custom ones, materialize heavy queries as insights and reuse them via `insight-query`. If this guidance contradicts the UI, trust the UI; `posthog:docs-search` "calculating costs" or "AI observability" for anything not covered.

### Cost properties

All USD, set per event at ingestion. The full property list and how costs are calculated are in [LLM-ANALYTICS.md](LLM-ANALYTICS.md#cost-calculation) (docs: https://posthog.com/docs/ai-observability/calculating-costs).

- **`$ai_total_cost_usd`** is authoritative: input + output + request + web search, plus modality costs (`$ai_audio_cost_usd`, `$ai_image_cost_usd`, `$ai_video_cost_usd`). `$ai_request_cost_usd` is a flat per-request fee (for example Anthropic's), often 0. `$ai_reasoning_tokens` are charged as output.
- **Conflict on caller-set costs:** the cost-properties reference says "you cannot set them manually and trust them to survive"; the cost-sources reference says pre-calculated components set by an SDK or manual capture are preserved and ingestion fills `$ai_total_cost_usd` as their sum. Confirm in the current docs.
- **Custom prices are per token, not per million.** A cost about 1M times off is that bug.
- **Diagnostics PostHog writes:** `$ai_model_cost_used` (the matched model id), `$ai_cost_model_source` (`openrouter`, `manual`, `custom`, `passthrough`), `$ai_cost_model_provider`. A missing source means the model wasn't matched (an unusual custom model, a fine-tune); `custom` with zero cost means a misconfigured price.

```sql
SELECT
    properties.$ai_model AS model,
    properties.$ai_cost_model_source AS source,
    count() AS calls,
    countIf(toFloat(properties.$ai_total_cost_usd) = 0 OR properties.$ai_total_cost_usd IS NULL) AS zero_cost_calls
FROM events
WHERE event = '$ai_generation'
    AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY model, source
ORDER BY zero_cost_calls DESC
```

### Cache accounting

- **Exclusive** (Anthropic on most SDKs): `$ai_input_tokens` excludes cache tokens, so total input is `input_tokens + cache_read + cache_creation`. **Inclusive** (OpenAI and most others): it includes them.
- **Cache spend follows the style:** exclusive providers (e.g. Anthropic) surface cache-read and write spend outside `$ai_input_cost_usd`, so it understates input-side spend there; inclusive ones (e.g. OpenAI) bundle it in. This also varies by SDK version. `$ai_total_cost_usd` already accounts for either style.
- **Branch on `$ai_cache_reporting_exclusive`, never on provider name.** Ingestion writes the boolean on every `$ai_generation`; manual capture can override it with `true|false`.

```sql
SELECT
    properties.$ai_model AS model,
    if(properties.$ai_cache_reporting_exclusive = 'true',
       sum(toInt(properties.$ai_cache_read_input_tokens))
         / nullIf(sum(toInt(properties.$ai_input_tokens))
                + sum(toInt(properties.$ai_cache_read_input_tokens))
                + sum(toInt(properties.$ai_cache_creation_input_tokens)), 0),
       sum(toInt(properties.$ai_cache_read_input_tokens))
         / nullIf(sum(toInt(properties.$ai_input_tokens)), 0)
    ) AS cache_hit_rate
FROM events
WHERE event = '$ai_generation'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY model, properties.$ai_cache_reporting_exclusive
```

- **A cache-hit rate above 1** means the flag is unset on those events (the inclusive branch ran over exclusive data); read the token columns instead. **A drop** often follows a system-prompt change that invalidated the cached prefix.

### Breakdowns

Total spend:

```sql
SELECT round(sum(toFloat(properties.$ai_total_cost_usd)), 4) AS total_cost_usd FROM events WHERE event IN ('$ai_generation', '$ai_embedding') AND timestamp >= now() - INTERVAL 30 DAY
```

| Cut | Shape |
|---|---|
| Daily | `toDate(timestamp) AS day`, cost rounded to 4, `sum(toInt(properties.$ai_input_tokens))`, output tokens, `count() AS calls`, 30 days, `GROUP BY day` |
| By model | Group `properties.$ai_model, properties.$ai_provider`; calls, `cost_usd`, `round(avg(...), 6) AS avg_cost_per_call`, tokens; `ORDER BY cost_usd DESC` |
| By user | `AND (properties.$ai_trace_id IS NULL OR distinct_id != properties.$ai_trace_id)`, `countDistinct(properties.$ai_trace_id) AS traces`, `LIMIT 25`; the `/ai-observability/users` page uses the same shape |
| By trace | Group `properties.$ai_trace_id`; `count() AS llm_calls`, cost, tokens, `min(timestamp) AS started_at`, 7 days, `isNotNull(properties.$ai_trace_id)`, `LIMIT 25`; then drill with `query-llm-trace` |
| By custom dimension | `properties.feature AS feature` ... `AND isNotNull(properties.feature)`; discover the name first |
| Per-call distribution | `quantile(0.5)`, `quantile(0.95)`, `quantile(0.99)` and `max` of `toFloat(properties.$ai_total_cost_usd)` rounded to 6, `event = '$ai_generation'`, 7 days, `ORDER BY p99_cost DESC`. "Totals hide skew." |
| Economics | Sum `$ai_input_cost_usd`, `$ai_output_cost_usd`, `$ai_request_cost_usd`, `$ai_web_search_cost_usd`, `$ai_total_cost_usd`, tokens, cache read and write tokens, and `cache_hit_rate` branching on `any(properties.$ai_cache_reporting_exclusive) = 'true'`; if one model mixes reporting styles, put the flag in `GROUP BY` instead of `any()` |

- **Rules of thumb:** output tokens usually cost 3 to 5x input tokens; cache reads cost about 10% of input. A low cache-hit rate on a cache-capable model is a lever.

### Cost regressions

Causes are more calls, bigger prompts, a new model, or a cache-hit change. Five steps:

1. **Daily cost, calls and `avg_cost_per_call` over 60 days.** Calls doubled means volume; cost per call up means prompt, model or cache.
2. **Model mix by day and model over 60 days:** a model appearing or disappearing, a share shift.
3. **Prompt bloat:** `avg(toInt($ai_input_tokens))` and output by day and model over 30 days.
4. **Cache degradation:** `cache_hit_rate` by day and model.
5. **Isolate the feature** by a custom property and drill into a representative trace.

### Insights, dashboards, alerts

```json
posthog:insight-create
{
  "name": "Daily LLM cost",
  "query": {
    "kind": "TrendsQuery",
    "dateRange": {"date_from": "-30d"},
    "series": [
      {"kind": "EventsNode", "event": "$ai_generation", "math": "sum", "math_property": "$ai_total_cost_usd"},
      {"kind": "EventsNode", "event": "$ai_embedding", "math": "sum", "math_property": "$ai_total_cost_usd"}
    ],
    "trendsFilter": {"formula": "A + B", "aggregationAxisPrefix": "$", "decimalPlaces": 2}
  }
}
```

- **Both series are required** unless `count()` of `$ai_embedding` is zero. Cost per user: add a third series with `math: "dau"` and formula `(A + B) / C`. Break down with `breakdownFilter` `breakdown: "$ai_model"`.
- **The default `/ai-observability/dashboard`** has Cost, Cost per user and Cost by model tiles; build more with `posthog:dashboard-create` (or `-update`).

```json
posthog:alert-create
{
  "insight": <insight_id>,
  "name": "Daily LLM cost over $100",
  "subscribed_users": [<user_id>],
  "threshold": {"configuration": {"bounds": {"upper": 100}, "type": "absolute"}},
  "condition": {"type": "absolute_value"},
  "config": {"series_index": 0},
  "enabled": true
}
```

- **The insight must be a single-value trends query.** `subscribed_users` is required, at least one user from the same team. `threshold.configuration.type`: `"absolute"` or `"percentage"`; `condition.type`: `"absolute_value"`, `"relative_increase"`, `"relative_decrease"`. If rejected, `posthog:docs-search` "alerts" (enums can change).

## Clusters

Helper-script commands in this section have the same [upstream-only availability prerequisite](#parsing-scripts). [PostHog skills, LLM-EXPLORING.md]

PostHog clusters traces, generations or evaluation events by embedding similarity. A Temporal workflow runs periodically or on demand and emits `$ai_trace_clusters`, `$ai_generation_clusters` or `$ai_evaluation_clusters` events.

- **Tools:** `posthog:llma-clustering-job-list`, `posthog:llma-clustering-job-get`, `posthog:execute-sql`, `posthog:query-llm-traces-list`, `posthog:query-llm-trace`.
- **Event properties:** `$ai_clustering_run_id` (`<team_id>_<level>_<YYYYMMDD>_<HHMMSS>[_<job_id>]`), `$ai_clustering_level` (`"trace"`, `"generation"`, `"evaluation"`), `$ai_window_start`/`$ai_window_end`, `$ai_total_items_analyzed`, `$ai_clusters` (JSON array), `$ai_clustering_params`, `$ai_clustering_job_id`, `$ai_clustering_job_name`.
- **Never bound the cluster-event query by the window.** The event's `timestamp` is always after `$ai_window_end` (seconds to hours later), so a window filter returns zero rows. Filter on `$ai_clustering_run_id` with a plain recent-time bound wide enough to cover Step 1's timestamp.
- **Jobs:** up to 10 per team, with `name`, `analysis_level`, `event_filters`, `enabled`. The defaults `"Default - traces"`, `"Default - generations"`, `"Default - evaluations"` are auto-created and disabled when you create a custom job for the same level.
- **Titles and descriptions are AI-generated;** verify by inspecting traces.

```json
{
  "cluster_id": 0,
  "size": 42,
  "title": "User authentication flows",
  "description": "Traces involving login, signup, and token refresh operations",
  "traces": {
    "<trace_or_generation_id>": {
      "distance_to_centroid": 0.123, "rank": 0, "x": -2.34, "y": 1.56,
      "timestamp": "2026-03-28T10:00:00Z", "trace_id": "abc-123", "generation_id": "gen-456"
    }
  },
  "centroid_x": -2.1,
  "centroid_y": 1.4
}
```

- **`cluster_id: -1`** is the noise or outlier cluster. `traces` is keyed by trace ID, generation event UUID or evaluation event UUID per level. `rank` 0 is closest to the centroid; `x`, `y` are 2D coordinates (UMAP, PCA or t-SNE). Clusters may carry `metrics` (for evaluation level: pass rate, N/A rate, dominant evaluator name, average judge cost).

Step 1, list runs:

```sql
SELECT
    toString(properties.$ai_clustering_run_id) AS run_id,
    toString(properties.$ai_clustering_level) AS level,
    toString(properties.$ai_clustering_job_id) AS job_id,
    toString(properties.$ai_clustering_job_name) AS job_name,
    toString(properties.$ai_window_start) AS window_start,
    toString(properties.$ai_window_end) AS window_end,
    toFloat64OrNull(toString(properties.$ai_total_items_analyzed)) AS total_items,
    timestamp
FROM events
WHERE event IN ('$ai_trace_clusters', '$ai_generation_clusters', '$ai_evaluation_clusters')
    AND timestamp >= now() - INTERVAL 14 DAY
ORDER BY timestamp DESC
LIMIT 10
```

- **Step 2, load one run:** the same query plus `properties.$ai_clusters AS clusters, properties.$ai_clustering_params AS params`, `AND toString(properties.$ai_clustering_run_id) = '<run_id>'`, `LIMIT 1`. Large JSON auto-persists; summarize with `python print_clusters.py <result_file_path>` (sorts by size, flags `(NOISE/OUTLIERS)`, shows the top 5 items by rank).
- **Step 3, metrics per trace:**

```sql
SELECT
    properties.$ai_trace_id as trace_id,
    sum(toFloat(properties.$ai_total_cost_usd)) as total_cost,
    max(toFloat(properties.$ai_latency)) as latency,
    sum(toInt(properties.$ai_input_tokens)) as input_tokens,
    sum(toInt(properties.$ai_output_tokens)) as output_tokens,
    countIf(properties.$ai_is_error = 'true') as error_count
FROM events
WHERE event IN ('$ai_generation', '$ai_embedding', '$ai_span')
    AND timestamp >= parseDateTimeBestEffort('<window_start>')
    AND timestamp <= parseDateTimeBestEffort('<window_end>')
    AND properties.$ai_trace_id IN ('<trace_id_1>', '<trace_id_2>', ...)
GROUP BY trace_id
```

  Generation level: `toString(uuid) as generation_id` with `WHERE event = '$ai_generation' ... AND uuid IN (...)`. Evaluation level: `toString(properties.$ai_target_event_id) AS generation_id`, `$ai_evaluation_name`, `$ai_evaluation_result`, `$ai_evaluation_reasoning`, `toFloatOrNull(toString(properties.$ai_total_cost_usd)) AS judge_cost`, `WHERE event = '$ai_evaluation'` by uuid.
- **Step 4, drill:** `posthog:query-llm-trace {"traceId": "<trace_id_from_cluster>", "dateRange": {"date_from": "<window_start>", "date_to": "<window_end>"}}`. For message content batch from `posthog.ai_events WHERE trace_id IN (...) ORDER BY trace_id, timestamp`, never `events.properties.$ai_input`.

| Question | Approach |
|---|---|
| What are users doing? | List runs, load the latest, read titles and descriptions, compare sizes |
| Most expensive or slowest | Extract trace IDs per cluster, compute metrics, aggregate `avg(cost)`, `avg(latency)`, `sum(cost)` |
| What's in a cluster | Sort by `rank`, inspect the top 3 to 5 traces |
| Error-heavy clusters | Error rate = `items_with_errors / total_items` |
| Across runs | Similar titles are stable patterns; track size changes |

- **To evaluate one cluster,** translate its event filter into an evaluation's `conditions` ([LLM-EVALUATIONS.md](LLM-EVALUATIONS.md#conditions)).

## Finding AI failures

"Most failures are silent": HTTP 200, no exception, but the answer is wrong, off-topic, ignores an instruction, or misuses a tool. The goal is a ranked set of failure modes built bottom-up from reading real traces; "everything below serves one irreducible activity: reading real traces." Queries only tell you which traces to open. Work with the user on scope and priorities, not on whether to do the work; don't ask permission before reading.

- **Tools:** `posthog:query-llm-traces-list`, `posthog:query-llm-trace`, `posthog:execute-sql`, `posthog:llma-evaluation-list`, `posthog:generate-app-url`.

1. **Scope to one use case.** Trace types fail differently and mixing them averages the signal away. Find its filter: a `$ai_trace_id` prefix, a feature property, a model.
2. **Pick traces to read** (combinable, no forced order): code errors via `$ai_is_error` (cheapest, least representative; more useful for structured-output and tool-calling pipelines); metric outliers (tokens, length, cost, latency tails); one trace-type slice; a stratified sample ("the default, not the fallback"); spikes in existing evals; clustering at high volume. The trap: GROUP BY error messages and stop, which finds the loud minority. "A ranking built from error or metric counts you never opened is not the deliverable."
3. **Read a batch,** roughly 20 to 30 traces for a use case. `query-llm-trace` takes one required argument, `traceId`, the `id` from a list result. Silent failures can't be found with GROUP BY or by grepping for "refusal" or "sorry". Note each trace's earliest-event timestamp (`createdAt`) for deep links. In a chain, record the first thing that broke. Group notes into named modes ("ignores the date filter", "invents a policy", "drops the second question"). Stop when new traces stop turning up new modes ("tens of traces, not thousands").
4. **Rank by frequency in the sample** and present a short ranked list with one or two example trace links per mode, unprompted. Don't present it as settled fact (you can misread); ask which mode to focus on, then make the top mode an eval ([LLM-EVALUATIONS.md](LLM-EVALUATIONS.md#creating-online-evaluations)), fix a prompt or file a bug.

- **Little data:** widen the window or loosen the slice; stress-test with probing inputs (edge cases, long or ambiguous, adversarial); or generate a small synthetic set across dimensions (request type x user scenario). Synthetic data is a bootstrap, not ground truth, and unreliable for high-stakes or niche domains.
- **"Frequency over completeness."** One use case at a time.

Taxonomy by trace-id prefix (or group by a feature property such as `ai_product`, `agent_mode` or a custom tag):

```sql
-- By trace-id prefix convention (many apps namespace trace ids like "support:", "summarize:")
SELECT splitByChar(':', coalesce(properties.$ai_trace_id, ''))[1] AS kind, count() AS n
FROM events
WHERE event = '$ai_generation' AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY kind ORDER BY n DESC
```

Code errors:

```sql
SELECT properties.$ai_error AS error, count() AS n
FROM events
WHERE event = '$ai_generation' AND properties.$ai_is_error = 'true'
    AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY error ORDER BY n DESC
```

Metric outliers:

```sql
SELECT properties.$ai_trace_id AS trace_id,
       properties.$ai_input_tokens AS in_tok,
       properties.$ai_output_tokens AS out_tok,
       properties.$ai_latency AS latency,
       properties.$ai_total_cost_usd AS cost
FROM events
WHERE event = '$ai_generation' AND timestamp >= now() - INTERVAL 7 DAY
ORDER BY out_tok DESC      -- also try in_tok, latency, cost; and ASC for truncation / empty outputs
LIMIT 25
```

- **Reading outliers:** huge output is runaway or repetition; tiny output is truncation or refusal; huge input is context bloat or a stuffed prompt; high latency or cost is inefficiency or a loop.
- **Stratified batch:** `posthog:query-llm-traces-list {"dateRange": {"date_from": "-7d"}, "filterTestAccounts": true}`, then `posthog:query-llm-trace {"traceId": "<id from a query-llm-traces-list result>"}`.
- **Eval spikes:** `posthog:llma-evaluation-list {"enabled": true}` plus the daily fails query with the fail predicate and the skipped and applicable guards over 30 days ([LLM-EVALUATIONS.md](LLM-EVALUATIONS.md#the-fail-predicate)). "`$ai_evaluation_result = 'false'` only fits a pass/fail eval that is not a detector."
- **Counting a mode mapped to a property:** `SELECT properties.$ai_model AS model, count() AS n FROM events WHERE event = '$ai_generation' AND properties.$ai_is_error = 'true' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY model ORDER BY n DESC`.

## Links to the UI

- **Prefer the returned `_posthogUrl`; build links only for traces you didn't open, with `posthog:generate-app-url`** (catalog template, ids via `params`): `{url: "/ai-observability/traces"}`, `{url: "/ai-observability/traces/{id}", params: {id: "<trace_id>"}}`, resolving to e.g. `https://us.posthog.com/project/<id>/ai-observability/traces/<trace_id>`. It cannot express query params. Other paths: `/ai-observability/dashboard`, `/ai-observability/generations`, `/ai-observability/users`.
- **Append `?timestamp=<url_encoded_iso>`** to a single-trace link (e.g. `timestamp=2026-04-01T19%3A39%3A20Z`, the `createdAt` of the earliest event); the returned `_posthogUrl` carries none.
- **Conflict on hand-built links:** the traces and clusters skills give `https://app.posthog.com/ai-observability/traces/<trace_id>?timestamp=...&event=<optional_event_id>` and `https://app.posthog.com/ai-observability/clusters/<url_encoded_run_id>/<cluster_id>`; the costs and failures skills say "Never hand-write `https://app.posthog.com/...` links. That host drops the region and the project prefix, so the user is redirected to login." Use `_posthogUrl` or `generate-app-url`.
- **Conflict on what `timestamp` does:** the traces skill calls it required; the costs skill says that without it the trace page scans from a fixed early date instead of the ten-minute window around the trace; the failures skill says "the trace page reads it to resolve older traces". Include it either way.

## Prove it

- **Content comes from the right table:** a query for prompts reads `posthog.ai_events` by `trace_id` (or uses `query-llm-trace` with `detail: "full"`), not `events.properties.$ai_input`, and returns non-empty input.
- **No false absence:** before reporting that a trace lacks something, the answer checked `_summaryOmittedKeys`, `_redactedKeys` and truncation markers, and includes `_posthogUrl`.
- **Totals match the UI:** total spend over `event IN ('$ai_generation', '$ai_embedding')` summing `$ai_total_cost_usd` equals the `/ai-observability/dashboard` Cost tile for the same range.
- **Costs resolve:** the diagnostic query shows no model with a missing `$ai_cost_model_source` or `custom` with zero cost, and no model's cache-hit rate is above 1.
- **Failure modes are read, not counted:** the ranked list cites 20 to 30 opened traces with one or two links per mode, each link carrying `?timestamp=`.
