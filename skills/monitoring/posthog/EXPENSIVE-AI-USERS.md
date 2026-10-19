# Expensive AI users

Finds the users who drive LLM spend and explains why: volume, model, prompt size, output size, cache use, retries and errors, trace type, and feature or tenant dimensions, backed by representative traces. Every query starts from `$ai_generation` events grouped by `distinct_id` over a bounded window, and the conclusion comes from comparing a top user against the project baseline and then reading their traces. Billing-side routing to this job is in [INGESTION-AND-COSTS.md](INGESTION-AND-COSTS.md#usage-type-routing); the SQL dialect is [HOGQL.md](HOGQL.md); the MCP tools are in [MCP-AND-WIZARD.md](MCP-AND-WIZARD.md).

## Rules

- **Tools:** `posthog:execute-sql`, `posthog:query-llm-traces-list`, `posthog:query-llm-trace`, `posthog:read-data-schema`, `posthog:generate-app-url`.
- **Bound the range:** default to the last 30 days and say so; keep any filters from a link you were given.
- **Start from `$ai_generation` spend** grouped by `distinct_id`. Full spend includes `event IN ('$ai_generation', '$ai_embedding')`; call it out when that changes the picture.
- **Some SDKs use `$ai_trace_id` as `distinct_id` when no user is set.** For identified users exclude `distinct_id = properties.$ai_trace_id`, and flag the unattributed spend.
- **Don't guess custom dimensions;** discover them. Read traces before claiming causality.
- **Privacy:** project only label columns (`email`, `name`); never select the raw `person.properties` object or a tuple containing it. Fall back to `distinct_id`.

## Rank users by cost

```sql
SELECT
    distinct_id,
    argMax(email, timestamp) AS email,
    argMax(name, timestamp) AS name,
    countDistinctIf(ai_trace_id, notEmpty(ai_trace_id)) AS traces,
    count() AS generations,
    countIf(notEmpty(ai_error) OR ai_is_error = 'true') AS errors,
    round(sum(ai_total_cost_usd), 4) AS total_cost,
    round(avg(ai_total_cost_usd), 6) AS avg_cost_per_generation,
    sum(ai_input_tokens) AS input_tokens,
    sum(ai_output_tokens) AS output_tokens,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM (
    SELECT
        distinct_id,
        timestamp,
        toString(properties.$ai_trace_id) AS ai_trace_id,
        toFloat(properties.$ai_total_cost_usd) AS ai_total_cost_usd,
        toString(properties.$ai_error) AS ai_error,
        toString(properties.$ai_is_error) AS ai_is_error,
        toInt(properties.$ai_input_tokens) AS ai_input_tokens,
        toInt(properties.$ai_output_tokens) AS ai_output_tokens,
        toString(person.properties.email) AS email,
        toString(person.properties.name) AS name
    FROM events
    WHERE event = '$ai_generation'
        AND timestamp >= now() - INTERVAL 30 DAY
)
GROUP BY distinct_id
ORDER BY total_cost DESC
LIMIT 25
```

Identified users only: add to the inner `WHERE`:

```sql
AND (
    properties.$ai_trace_id IS NULL
    OR distinct_id != properties.$ai_trace_id
)
```

## Project baseline

```sql
WITH per_user AS (
    SELECT
        distinct_id,
        count() AS generations,
        countDistinctIf(toString(properties.$ai_trace_id), notEmpty(toString(properties.$ai_trace_id))) AS traces,
        countIf(notEmpty(toString(properties.$ai_error)) OR toString(properties.$ai_is_error) = 'true') AS errors,
        sum(toFloat(properties.$ai_total_cost_usd)) AS total_cost,
        avg(toFloat(properties.$ai_total_cost_usd)) AS avg_cost_per_generation,
        avg(toInt(properties.$ai_input_tokens)) AS avg_input_tokens,
        avg(toInt(properties.$ai_output_tokens)) AS avg_output_tokens
    FROM events
    WHERE event = '$ai_generation'
        AND timestamp >= now() - INTERVAL 30 DAY
    GROUP BY distinct_id
)
SELECT
    count() AS users,
    round(sum(total_cost), 4) AS project_total_cost,
    round(avg(total_cost), 4) AS avg_cost_per_user,
    round(quantile(0.5)(total_cost), 4) AS p50_user_cost,
    round(quantile(0.9)(total_cost), 4) AS p90_user_cost,
    round(quantile(0.99)(total_cost), 4) AS p99_user_cost,
    round(avg(avg_cost_per_generation), 6) AS mean_user_cost_per_generation,
    round(avg(avg_input_tokens), 0) AS mean_user_input_tokens,
    round(avg(avg_output_tokens), 0) AS mean_user_output_tokens,
    round(sum(errors) / nullIf(sum(generations), 0), 4) AS error_rate
FROM per_user
```

- **HogQL gotcha:** outer aggregate aliases must differ from the CTE column names. A bare `total_cost` inside an outer `sum()` resolves to the output alias, nesting aggregates and failing with `Aggregate function sum(per_user.total_cost) is found inside another aggregate function`.
- **If the baseline errors,** say it's unavailable: don't fabricate p50, p90, p99 or "Nx above median"; rank by absolute cost and share instead.
- **Report** each top user's share of spend and multiples above p50 and p90.

## Decompose one user

```sql
SELECT
    toString(properties.$ai_provider) AS provider,
    toString(properties.$ai_model) AS model,
    count() AS generations,
    countDistinctIf(toString(properties.$ai_trace_id), notEmpty(toString(properties.$ai_trace_id))) AS traces,
    round(sum(toFloat(properties.$ai_total_cost_usd)), 4) AS total_cost,
    round(avg(toFloat(properties.$ai_total_cost_usd)), 6) AS avg_cost_per_generation,
    sum(toInt(properties.$ai_input_tokens)) AS input_tokens,
    sum(toInt(properties.$ai_output_tokens)) AS output_tokens,
    sum(toInt(properties.$ai_reasoning_tokens)) AS reasoning_tokens,
    sum(toInt(properties.$ai_cache_read_input_tokens)) AS cache_read_tokens,
    sum(toInt(properties.$ai_cache_creation_input_tokens)) AS cache_write_tokens,
    round(sum(toFloat(properties.$ai_input_cost_usd)), 4) AS input_cost,
    round(sum(toFloat(properties.$ai_output_cost_usd)), 4) AS output_cost,
    round(sum(toFloat(properties.$ai_request_cost_usd)), 4) AS request_cost,
    round(sum(toFloat(properties.$ai_web_search_cost_usd)), 4) AS web_search_cost,
    countIf(notEmpty(toString(properties.$ai_error)) OR toString(properties.$ai_is_error) = 'true') AS errors
FROM events
WHERE event = '$ai_generation'
    AND timestamp >= now() - INTERVAL 30 DAY
    AND distinct_id = '<distinct_id>'
GROUP BY provider, model
ORDER BY total_cost DESC
```

| Signal | Likely driver |
|---|---|
| High generations, ordinary cost per generation | Volume |
| High cost per generation, ordinary volume | Expensive models, long context or outputs, reasoning, web-search or request fees |
| High input tokens | Context bloat, repeated history, large retrieved docs, missing truncation |
| High output or reasoning tokens | Verbose answers, reasoning models, missing output limits, tool loops |
| Low cache reuse with high repeated input | Missed prompt caching (formula in [cache accounting](LLM-EXPLORING.md#cache-accounting)) |
| High errors, many high-cost traces | Retries, failed tool calls, loops (read the traces first) |
| High request or web-search cost | Provider flat fees or tool-heavy generations |

- **Compare the top user with the project:** share of cost, generations and traces against p50 and p90, cost per generation, input and output/reasoning tokens per generation, error rate, model mix, and cache-hit rate for the same model.

## Read the traces

```sql
SELECT
    toString(properties.$ai_trace_id) AS trace_id,
    count() AS generations,
    round(sum(toFloat(properties.$ai_total_cost_usd)), 4) AS total_cost,
    round(avg(toFloat(properties.$ai_total_cost_usd)), 6) AS avg_cost_per_generation,
    sum(toInt(properties.$ai_input_tokens)) AS input_tokens,
    sum(toInt(properties.$ai_output_tokens)) AS output_tokens,
    countIf(notEmpty(toString(properties.$ai_error)) OR toString(properties.$ai_is_error) = 'true') AS errors,
    min(timestamp) AS started_at,
    max(timestamp) AS ended_at
FROM events
WHERE event = '$ai_generation'
    AND timestamp >= now() - INTERVAL 30 DAY
    AND distinct_id = '<distinct_id>'
    AND notEmpty(toString(properties.$ai_trace_id))
GROUP BY trace_id
ORDER BY total_cost DESC
LIMIT 10
```

- **Open at least the top 2 or 3 traces** with `posthog:query-llm-trace` `{ "traceId": "<trace_id>", "dateRange": { "date_from": "-30d" } }`. Look for repeated tool calls or retry loops, large context, long multi-turn sessions, an expensive model for ordinary tasks, many small calls, verbose outputs, web-search or request-fee-heavy generations, and errors that still cost.

## Custom dimensions

- **Discover them:** `posthog:read-data-schema` with `kind: "event_properties"`, `event_name: "$ai_generation"`, then `kind: "event_property_values"`. Group by a discovered property (examples: `feature`, `tenant_id`, `organization_id`, `workflow_name`, `agent`, `route`, `environment`), never a guessed one.

```sql
SELECT
    toString(properties.<property_name>) AS dimension,
    count() AS generations,
    countDistinctIf(toString(properties.$ai_trace_id), notEmpty(toString(properties.$ai_trace_id))) AS traces,
    round(sum(toFloat(properties.$ai_total_cost_usd)), 4) AS total_cost,
    round(avg(toFloat(properties.$ai_total_cost_usd)), 6) AS avg_cost_per_generation
FROM events
WHERE event = '$ai_generation'
    AND timestamp >= now() - INTERVAL 30 DAY
    AND distinct_id = '<distinct_id>'
    AND isNotNull(properties.<property_name>)
GROUP BY dimension
ORDER BY total_cost DESC
LIMIT 20
```

## Links and the answer

- **Build links with `posthog:generate-app-url`,** never a hardcoded host (regions differ). Traces list: `{ "url": "/ai-observability/traces" }`. One trace: `{ "url": "/ai-observability/traces/{id}", "params": { "id": "<trace_id>" } }`, then append `?timestamp=<url_encoded_started_at>`.
- **Answer shape:** the top users (cost, share, generations, traces, cost per generation, error rate; labels only); why they're expensive against the baseline; evidence with linked traces; levers tied to the observed driver; caveats (embeddings, trace-id defaults, the event set). Avoid generic advice unless the data shows it.

## Prove it

- The ranking query's `total_cost` for the top users sums to a share you can state against `project_total_cost` from the baseline.
- Every claimed driver points to a row of the decomposition query and to at least two opened traces.
- Any custom dimension you grouped by came back from `posthog:read-data-schema`.
- Unattributed spend (`distinct_id = properties.$ai_trace_id`) is reported separately, not mixed into a user.
