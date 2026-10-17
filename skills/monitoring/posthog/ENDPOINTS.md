# Endpoints

Endpoints expose a saved HogQL or insight query as a callable HTTP route that other code pulls from (endpoints are pull-only). The choices made at creation decide cost, latency and how callers integrate: the name (it is in the URL), the query kind, the variables and their defaults, `data_freshness_seconds`, and whether the endpoint is materialised. For writing the SQL itself, see [HOGQL.md](HOGQL.md).

**Contents:** [When to use one](#when-to-use-one) · [Create an endpoint](#create-an-endpoint) · [Materialise](#materialise) · [Call it from client code](#call-it-from-client-code) · [Versions](#versions) · [Audit](#audit) · [Copy across projects](#copy-across-projects) · [Diagnose performance](#diagnose-performance) · [Execution logs](#execution-logs) · [MCP tools](#mcp-tools) · [Prove it](#prove-it)

## When to use one

- **Use an endpoint when** an external system (someone else's code) needs PostHog data, the query is stable (not exploratory), and the shape is reusable (same query, different parameters).
- **Do not use one** when an internal PostHog dashboard or insight needs the data (use the insight directly), or for one-off exploratory analysis (use the `execute-sql` tool or the SQL editor).
- **Heavy aggregation is not a reason to avoid an endpoint.** A heavy, frequently called aggregation is often the best case for an endpoint with materialisation on.
- **If the user is unsure,** ask what's calling the endpoint and what shape they expect.
- **Billing:** calling endpoints isn't billed today, but will be once endpoints ship alongside the managed warehouse. Flag this for high-volume users.

## Create an endpoint

### Naming

- **Names are URL-safe:** letters, numbers, hyphens and underscores, starting with a letter, at most 128 characters, unique within the project.
- **Be descriptive:** `weekly_active_users_by_org` over `metrics`. Use snake_case, no version in the name, no "endpoint" in the name.
- **Pick it once.** The name is in the URL and not trivially renameable; changing it means migrating every caller.

### Query kind

| Kind | Use | Materialisable | Variables |
|---|---|---|---|
| HogQL (`HogQLQuery`) | Raw SQL. The default for new endpoints, and when the caller cares about exact column shape. | Yes, if eligible | `{variables.x}`, matched on `code_name` |
| Insight `TrendsQuery`, `RetentionQuery` | Re-publishing an existing insight | Yes | Breakdown acts as a variable |
| Insight `LifecycleQuery` | Re-publishing an existing insight | Yes | No breakdown |
| Other insights (e.g. `FunnelsQuery`) | Run inline only | No | No breakdown variables; rewrite as HogQL if needed |

### Variables

- **HogQL variables** are declared in the query payload with `code_name`, `type` and `default`. Each call passes `{ "variables": { "<code_name>": value } }`.
- **Insight endpoints** use the breakdown property name as the variable key. `date_from` and `date_to` are accepted as variables only on non-materialised insight endpoints (materialisation bakes the date range into the view).
- **Anything that should change per caller goes in variables;** the rest is hard-coded in the query.
- **Common patterns:** time windows (`date_from`, `date_to`, or a single `lookback_days` integer); identity filters (`user_id`, `account_id`, `team_id`); pagination control beyond `limit` / `offset` (those two are already first-class on the run endpoint).
- **Always set a default.** A variable with no default fails at call time; defaults keep the endpoint testable from the playground.
- **Anti-pattern: variables that change the result shape.** Ship separate endpoints instead.
- **Anti-pattern: variables that bypass safety.** No `where_clause` variable that injects arbitrary SQL.

### From an existing insight

- **There is no server-side "make an endpoint from insight N".** Read the insight's query, pass it to `endpoint-create`, and set `derived_from_insight` to the insight's short id. The endpoint owns a copy; later insight edits don't propagate.
- **From scratch,** build the query with the insight or `sql-variables` tools first.

### `data_freshness_seconds`

- **One field, two jobs:** the cache TTL, and on a materialised endpoint the materialisation refresh frequency. It is per version, like materialisation.

| Value | Meaning | Fits |
|---|---|---|
| `900` | 15 min (the floor; no sub-15-minute option) | Freshest: dashboards where staleness is visible |
| `1800` | 30 min | Freshest |
| `3600` | 1 h | Most cases |
| `21600` | 6 h | Most cases |
| `43200` | 12 h | Most cases |
| `86400` | 24 h, the default | Reports, daily or weekly metrics, long aggregations |
| `604800` | 7 d | Reports, weekly metrics, long aggregations |

A lower value means fresher data and more frequent recompute and refresh cost; a higher value is cheaper on both counts but staler. Bias toward higher values unless the user explicitly needs fresher data.

### Day-one materialisation

- **Recommend it** when the endpoint will be called frequently, latency matters, and the user can tolerate staleness equal to the refresh interval (typically 5-15 minutes for scheduled materialisation, or hourly).
- **Skip it** for low-traffic endpoints, exploratory new endpoints (you don't know yet if it'll get called), and queries where freshness is critical.
- **Name the required variables.** A materialised endpoint requires every variable on each call, so pair the recommendation with a note about which variables become required.

### Workflow

1. Confirm the use case. If it's not a fit for an endpoint, recommend the alternative.
2. Agree the name.
3. Confirm HogQL vs insight, and the columns.
4. Identify the variables; show the declaration syntax.
5. Pick `data_freshness_seconds` from the user's freshness requirement (ask if not clear).
6. Decide on materialisation. If on the fence, ship without it and set `is_materialized: true` later once usage stabilises.
7. `endpoint-create`.
8. `endpoint-run` with a sample payload to verify the shape.
9. Hand off to client code ([Call it from client code](#call-it-from-client-code)).

- **Tell callers to pin `?version=N`** rather than relying on latest, so a future query edit (which cuts a new version) can't silently change their results. They bump the pin deliberately once they've validated the new version.
- **Report friction** (eligibility, required variables, the TTL enum) to the PostHog team with the `agent-feedback` tool.

## Materialise

Materialisation pre-computes the query into a saved view refreshed on a schedule. Reads become near-instant; staleness equals the refresh interval.

- **Materialise when two or more signals hold; none means don't:** called more than about 10 times a minute sustained; the query takes more than about 1 s of ClickHouse time inline; callers tolerate 5 to 15 minutes of staleness; variables are bounded (a small known set).
- **Wrong when:** there is a real-time requirement; variables are high-cardinality (an arbitrary `user_id`); traffic is low (once a day, where the refresh costs more than inline reads); the query has cohort breakdowns (regular property breakdowns materialise fine); the query reads `now()` or `today()` directly (the result is anchored to refresh time).
- **Always call `endpoints-materialization-preview` before enabling.** It returns the exact rejection reason and the transformed query, and shows the detected range variables.

### Eligibility rejections

| Reason | Meaning | Fix |
|---|---|---|
| `Cohort breakdowns are not supported` | Produces a UNION ALL the transform can't tag by series | Property breakdown, or one endpoint per cohort |
| `Compare mode is not supported` | Not a Trends query, or the project is not in the compare-mode materialisation rollout | Keep inline, drop compare, or expose the window as a variable |
| `Query has unresolved variables` | A variable has no default | Set defaults for all variables |
| `Query references non-deterministic functions` | `now()`, `today()`, `rand()` | Replace with a `date_from`/`date_to` variable |
| `CTE variables with JOINs … not supported` | A variable filter plus a top-level JOIN changes joined-row cardinality (LEFT JOIN non-matches lose the variable column) | Filter inside a subquery or CTE, then join |
| `Query kind not supported` | e.g. funnels | Rewrite in HogQL |

- **Compare mode, sources disagree:** the materialisation reference says compare mode can materialise for eligible Trends endpoints during its controlled rollout, storing and computing both periods (about twice the storage and refresh work); the creation, copy and performance guides treat compare mode as blocked. Use `endpoints-materialization-preview` to confirm eligibility.

### Variables on a materialised endpoint

- **Variables become WHERE filters on the view.** Every declared variable must be passed; calls missing any are rejected, so the endpoint can't return the whole pre-aggregated dataset. The view's row count is roughly the product of the variable cardinalities.
- **Symptom: it worked unmaterialised and 400s after enabling.** The error lists the missing variables. The fix is in the call.
- **Optional or partial variables** on materialised endpoints are a known limitation the team plans to lift.
- **`bucket_overrides`** makes a continuous range variable (a timestamp or numeric filter like `WHERE timestamp >= {variables.since}`) materialisable by pre-aggregating that column at a coarser grain and filtering at read time. It maps a column to a bucket function, e.g. `{ "bucket_overrides": { "timestamp": "hour" } }`. Functions: `minute`, `fifteen_minutes`, `hour`, `day`, `week`, `month` (each a `toStartOf…` rollup). Pick the coarsest the caller tolerates: `day` keeps the view small and refreshes cheap; `minute` is large and expensive. The caller still passes the exact value.

### Refresh, status and cost

- **Refresh intervals, sources disagree:** the materialisation reference ties them to the data warehouse saved query schedule ("typically 5min, 15min, hourly, or daily"); the creation and performance guides say `data_freshness_seconds` sets the cadence with a 900 s floor. Either way, pick the longest interval that satisfies the user's SLA.
- **Status lives on the `DataWarehouseSavedQuery`** backing each version. `endpoint-materialization-status` returns the last run, status and error. On `Failed` the inline path still works and the data is stale; failures don't block reads (stale data with longer latency, not an outage). Surface the failure, but don't escalate it as a blocker unless freshness is critical.
- **Views are per version,** named `{endpoint_name}_v{version}`. A new version starts unmaterialised by default; the old version's materialisation continues until `endpoint-update` with `version` and `is_materialized: false`.
- **Enabling is free to start,** with no backfill; the endpoint stays callable inline during the first refresh. Disabling is reversible; the view is dropped on the next cleanup pass, and re-enabling re-creates it.
- **Storage adds up.** Many materialised views with high-cardinality variables can dominate warehouse storage. Materialisation cleanup is usually the first lever when a project hits cost caps.

## Call it from client code

- **URL:** `/api/projects/{team_id}/endpoints/{name}/run`. `team_id` is the numeric project ID (project settings or `projects-get`). The trailing `/run` is required.
- **Method:** `POST` is canonical, because variables go in the body. `GET` works for simple cases without a body.
- **Auth:** a personal API key in `Authorization: Bearer <key>`, with at least the `endpoint:read` scope.
- **Never ship a personal API key in client-side code** (mobile apps, browser JS); personal API keys grant scoped account access. Route calls through your own backend, which holds the key.
- **Read the variable shape with `endpoint-get`.** Its query definition lists the declared variables; each variable's `code_name` is what the client sends.

### Request

```json
{
  "variables": { "code_name_1": value, "code_name_2": value },
  "limit": 100,
  "offset": 0,
  "refresh": "cache"
}
```

- **`variables`:** keyed by `code_name` (HogQL) or the breakdown property name (insight).
- **`limit`:** max rows. **`offset`:** HogQL endpoints only.
- **`refresh`:** `"cache"` (default), `"force"` (always recalculate), `"direct"` (bypass materialisation; materialised endpoints only).

Minimal call from a Node backend:

```text
POST /api/projects/12345/endpoints/monthly_active_users/run
Authorization: Bearer <PH_API_KEY>
Content-Type: application/json

{ 'variables': { 'org_id': 'acme', 'lookback_days': 30 } }
```

### Response

```json
{
  "results": [[...], [...]],
  "columns": ["col_a", "col_b"],
  "types": ["Int64", "String"],
  "hasMore": false,
  "name": "endpoint_name",
  "endpoint_version": 4,
  "endpoint_version_created_at": "2026-01-15T..."
}
```

- **`results` rows are arrays in `columns` order.** `endpoint_version` says which version ran. Insight endpoints' shape depends on the insight kind; the OpenAPI spec captures it. Insight kinds that can't be materialised (e.g. `FunnelsQuery`) still return their inline result shape.

### Typed client

- **`endpoint-openapi-spec`** returns an OpenAPI 3.0 spec per endpoint. Generate TypeScript with:
  - `@hey-api/openapi-ts`: `openapi-ts -i spec.json -o ./generated` (e.g. `pnpm dlx @hey-api/openapi-ts -i spec.json -o ./generated/posthog`)
  - `openapi-generator-cli`: `openapi-generator-cli generate -i spec.json -g typescript-fetch -o ./generated`
- **Regenerate when the query changes;** a new version may change the variables. For several endpoints, get one spec each and combine them or use them side by side.

### PostHog CLI (experimental)

- **Under `exp`, may change:** `posthog-cli exp endpoints run` runs from a local YAML definition; `posthog-cli exp endpoints {list,get,pull,push,diff}` manages GitOps YAML.
- **Auth:** `posthog-cli login`, or the env vars `POSTHOG_CLI_API_KEY`, `POSTHOG_CLI_PROJECT_ID`, `POSTHOG_CLI_HOST`.

### Errors

| Status | When | Handling |
|---|---|---|
| 400 | Missing required variable on a materialised endpoint, or invalid variable type | Surface the message; fix the call |
| 401 | Key missing, malformed or wrong | Check the Authorization header |
| 403 | Key lacks `endpoint:read`, or the endpoint is in another project | Adjust scopes |
| 404 | Name typo, or endpoint not active | Confirm the name; check `is_active` |
| 429 | Rate limited (per team) | Exponential backoff; client-side cache |
| 5xx | ClickHouse error, timeout | Retry with backoff, then [Diagnose performance](#diagnose-performance) |

### Rate limits and caching

- **Limits are per team, by category, not per endpoint.** Non-materialised endpoints share the team-wide API query budget (about 240/min burst, about 2400/hour sustained) with all other query traffic. Materialised endpoints use a separate bucket (about 1200/min, about 12000/hour). There is no per-endpoint-name limit, so hammering one endpoint can starve the others. Heavy callers should batch where possible and back off on 429.
- **Client-side caching is fine;** mind total staleness (endpoint cache plus client cache).
- **List endpoints** with `execute-sql` on `system.data_modeling_endpoints`, or `endpoints-get-all`.

## Versions

- **A query change auto-cuts a new version** and bumps the current version.
- **A settings change** (description, `data_freshness_seconds`, materialisation) creates no version; it updates the targeted version in place.
- **"Current" is the highest version number,** not a movable pointer. A call without `?version=N` runs the latest.
- **Passing `query` together with `version` is rejected.**
- **`endpoint-get` supports `?version=N`;** `endpoint-versions` lists versions latest first. `endpoint-run` with `?version=N` executes one version without affecting which version other callers hit.

### Change settings on one version

- **`endpoint-update` with a `version` field** applies settings to that version only, with no new version: bump `data_freshness_seconds` on an old version some callers still pin to, fix a description, or change materialisation per version (disabling it on one version doesn't affect others). The `version` argument only affects settings.
- **Disabling a single version only blocks that version.** It doesn't change which version runs by default; that is always the highest number.
- **The CLI keeps definitions in version control:** `posthog-cli exp endpoints {pull,push,diff}` lets the user keep endpoint YAML in git and review changes before pushing, instead of editing live.

### Ship a change

- **There are no drafts.** Test the new query with `execute-sql` or the SQL editor first; the update creates the new version; confirm with `endpoint-run ?version=N`. There is no soft launch.
- **For true staging,** create a sibling endpoint with a `_v2` or `_staging` suffix.

### Roll back

- **Versions are forward-only;** there is no "make v3 default again". Roll back with `endpoint-versions`, then `endpoint-get ?version=3`, then `endpoint-update` with v3's query (which creates, say, v6). The broken version stays callable via `?version=5` until deactivated.
- **Faster mitigation:** have callers pin `?version=3`.
- **Rolling back always adds a version,** so the number keeps going up. If the user dislikes the history noise, that's a fair concern; surface it.
- **Activating an older version is not a product feature;** surface it as a gap (and nudge the team via `agent-feedback`). Don't pretend `endpoint-update` does it.

### Deactivate

- **Take every version offline:** `endpoint-update` with `is_active: false` and no `version`.
- **Retire one version:** `endpoint-update {name: "...", version: 3, is_active: false}`; re-enable with `is_active: true`. Callers pinned to v3 get an error.
- **Prune unused versions:** where `endpoint-versions` shows a null or stale per-version `last_executed_at`, set `is_materialized: false` and `is_active: false`. Confirm with the user first: `last_executed_at` counts only personal-API-key calls, and only since tracking was added (so a used version can still read null), and a caller may be pinned to `?version=N`.

## Audit

- **An audit is read-only.** Never act from the audit alone; confirm before modifying anything. An empty result means healthy; don't pad it.
- **Prefer system tables** over `endpoints-get-all` and `endpoint-get`: one SQL query returns the whole inventory and joins to usage in `query_log`. Materialisation status is not in the system tables; use `endpoint-materialization-status`.
- **No rows in the inventory** means the project has no endpoints; say so and stop.

Inventory:

```sql
SELECT name, is_active, current_version, derived_from_insight, last_executed_at
FROM system.data_modeling_endpoints
ORDER BY name
```

Usage (`query_log` also has `query_duration_ms`, `read_rows`, `read_bytes`):

```sql
SELECT name, count() AS calls, max(query_start_time) AS last_called
FROM query_log
WHERE endpoint LIKE '%/endpoints/%' AND is_personal_api_key_request
GROUP BY name
ORDER BY name
```

| Issue | Signal | Typical action |
|---|---|---|
| Never called | No `query_log` rows (personal-API-key calls only) | Confirm with the user, then disable |
| Stale | Last call more than 30 days ago | Confirm with the user; often safe to disable |
| Inactive | `is_active = 0` | Verify intent; if abandoned, delete |
| Failing materialisation | `endpoint-materialization-status` is `Failed` with an error | [Diagnose performance](#diagnose-performance) |
| Unused materialised version | Per-version `last_executed_at` null or stale | Unmaterialise that version, or roll to a newer one |
| Drifted versions | Many versions (query changed repeatedly) | History noise; note only |

- **Usage counts only personal-API-key calls.** Endpoints used only from the Playground or the app look unused.
- **An unused materialised version is a lead, not proof;** confirm before unmaterialising.
- **Report grouped by category, prioritised and actionable,** not raw JSON. End with a question (unmaterialise the unused versions? disable the never-called ones? dig into the failing materialisation?), not a decision.
- **Fix in this order:** failing materialisations, then unmaterialise unused versions, then disable never-called endpoints (once confirmed), then review stale ones.
- **The cheapest fix for an unneeded materialisation** is `endpoint-update` with `is_materialized: false`, not deletion. Inactive is not the same as stale: `is_active: false` was a deliberate switch-off, so don't recommend deletion unless the user confirms it's truly abandoned.

## Copy across projects

- **Two jobs:** copy into another project in the same organization (e.g. promote staging to production), or duplicate under a new name in the same project to iterate without touching the live one.
- **There is no server-side endpoint copy** (unlike `feature-flags-copy-flags-create` or `experiment-copy-to-project`). Copy is `endpoint-get` then `endpoint-create`.
- **Both work only on the active MCP project** (no project id parameter). If the user didn't say which project holds the source, ask; copying out of the wrong source is the most common foot-gun. Confirm the active project is the source with `project-get` (no id) before reading, switch the active project between the read and the write, and confirm again before creating. If switching isn't possible, tell the user. There is no cross-organization copy.
- **Capture:** `name`, `query` (with its variables and `code_name`s), `description`, `data_freshness_seconds`, `is_materialized`, `tags`. Summarise for the user before copying: what the query returns, its variables, its freshness, and whether the source is materialised.
- **Name:** cross-project with the same purpose, keep the same name so caller code ports unchanged; same project, pick a clearly derived new name (e.g. `weekly_active_users_v2`, `weekly_active_users_staging`).
- **Check for a name collision** with `endpoints-get-all` in the target; if the name exists, stop and ask.
- **Default the copy to `is_materialized: false`,** even when the source is materialised: a fresh copy has no proven traffic in the target. Override only if the user explicitly wants it materialised from day one. Non-materialisable queries (cohort breakdowns, compare mode, and insight kinds other than Trends, Lifecycle and Retention) are created unmaterialised regardless.
- **Carry `data_freshness_seconds` and `query` over verbatim** unless the user wants different freshness; the variables travel inside `query`. Drop tags that are meaningless in the target.
- **Bulk copies go one at a time** via `endpoints-get-all`.
- **Verify with `endpoint-run`,** and check that the target's taxonomy (events, properties) exists. `offset` works only on HogQL endpoints. The copy is not a link (later source edits don't propagate), there is no undo, and it needs editor access on the target. Afterwards, tell the user which project is now active.

## Diagnose performance

- **Tools:** `endpoint-get`, `endpoint-versions`, `endpoint-materialization-status`, `endpoints-materialization-preview`, `endpoints-last-execution-times`, `execute-sql`. Behind the `endpoints-ai-materialization-fix` flag (needs org AI data processing approval): `endpoint-materialization-suggestion` (an AI rewrite validated against the live checks) and `endpoint-materialization-conditions` (the source of the live eligibility checks and the rewrite contract, authoritative over the rewrite list below). When the flag is off they don't appear in the catalog; stay on the manual path and say the AI rewrite is unavailable.
- **Workflow:** parse the name from `/api/projects/{team_id}/endpoints/{name}/run` if given a URL; `endpoint-get` (freshness, `is_materialized`, current version, query kind); `endpoint-materialization-status`; `endpoint-versions`. With specific symptoms, walk the tree; otherwise present the four checkpoints and ask which matches. End with one concrete recommendation (bump TTL, materialise, rewrite, or roll back) and confirm before applying.

Decision tree, cheapest first:

1. **Is it cached?** At the default 86400 and fine: no change. At the 900 floor with many calls a minute: raise the TTL ("almost always the cheapest first move"). At the floor because freshness is needed: go to step 2. Many distinct variable combinations reduce the cache's benefit.
2. **Can it materialise?** Run `endpoints-materialization-preview`. Eligible and clean: a strong candidate. Not eligible: step 3. Eligible but gnarly (lots of range pairs, complex aggregation re-derivation): it may not save much; flag that first. Say which variables become required.
3. **Can it be rewritten?** The preview's rejection reason is the lead, and the raw reason wins over this list. Cohort breakdown or compare mode: swap to a property breakdown, or drop compare mode and expose the window as a variable; JOIN plus variables: push the filter into a subquery or CTE (the most common "looks fine but won't materialise" trap); "missing variables" or an unbounded scan: add a required time-window variable; `*` or non-deterministic functions: narrow the columns and use a variable for `now()`/`today()`. Other rejected shapes: a variable inside `OR`, variable compared to variable, a variable in `HAVING`, an unsupported operator, an unsupported query kind. The `OR {variables.x} = 'all'` optional-variable idiom has no equivalent rewrite; say so rather than changing behaviour. Quote the rejection reason verbatim. Also check `endpoint-versions`: if a recent version caused the regression, reverting is faster than rewriting.
4. **Is the slow version the one being called?** Only the latest runs by default, so tune the current one unless a pinned older version is the culprit. Check per-version `last_executed_at`; a materialised version with null or long-stale recency is a candidate to unmaterialise or delete rather than tune (confirm first).

- **AI suggestion results:** `ok` means it passes the checks with variable and output-column parity; semantic equivalence is only the model's claim. Run the original and the rewrite with the same values before applying it via `endpoint-update` (a new version), then check `endpoint-materialization-status`. `cannot_fix` means no equivalent rewrite exists.
- **Cache is almost always the first fix:** free, instantly reversible, and it doesn't change data semantics. Materialisation has hidden costs (view storage, refresh compute, and every variable becoming required).
- **Don't rewrite without the user;** a new version may break callers. The right fix depends on the SLA, so ask what staleness is acceptable: a 15-minute-stale materialised view is wrong for a real-time dashboard however cheap it is.
- **Three usage signals, all personal-API-key only:** `endpoint-get` `last_executed_at` (endpoint level), `endpoint-versions` per-version `last_executed_at`, and `query_log`.

Per-endpoint cost:

```sql
SELECT count() AS calls, max(query_start_time) AS last_called, avg(query_duration_ms) AS avg_ms
FROM query_log
WHERE name = '<endpoint_name>' AND endpoint LIKE '%/endpoints/%' AND is_personal_api_key_request
```

## Execution logs

- **Every run emits exactly one entry to `log_entries`:** `INFO` on success, `ERROR` on failure, with data as `key=value` tokens. Each run has a distinct `instance_id`. Emission is best-effort and never blocks a run. Logs are kept about 90 days (the `log_entries` TTL).

```text
Endpoint executed · path=materialized cache=hit duration_ms=142 rows=1024 version=3
Endpoint execution failed · path=inline error=ResolutionError version=3
```

| Token | Values |
|---|---|
| `path` | `materialized`, `inline`, `ducklake`, `ducklake_fallback` |
| `cache` | `hit`, `miss` (omitted for ducklake) |
| `duration_ms` | Run time |
| `rows` | Rows returned |
| `version` | Version that ran |
| `error` | Failures only, e.g. `ResolutionError` (can't resolve a table or field reference), `HogVMException` |

- **One entry per run, no step traces.** The detail lives in the tokens. If a run succeeded for the caller but no log shows, the emit was dropped, not the query.
- **`endpoint-logs` filters:** `level` (comma-separated, e.g. `ERROR`, `INFO,ERROR`); `search` (case-insensitive substring, e.g. `cache=miss`, `path=inline`, `error=ResolutionError`, `version=3`); `after`/`before` (ISO); `instance_id`; `limit` 1 to 500 (default 50).
- **Narrow to the symptom:** failures, `level=ERROR` and read `error=` and `path=`; cache concerns, `search=cache=miss`; wrong results, compare `rows=` across runs and `version=` to spot a regression after a version bump. Summarise what's failing, since when, on which version and path, and whether it's a config issue ([Diagnose performance](#diagnose-performance)) or a query bug.
- **Trend over time:** `log_source_id` is the endpoint UUID (from `endpoint-get`), not its name.

```sql
SELECT toDate(timestamp) AS day, upper(level) AS level, count() AS runs
FROM log_entries
WHERE log_source = 'endpoints' AND log_source_id = '<endpoint_uuid>'
GROUP BY day, level ORDER BY day DESC
```

## MCP tools

`endpoint-create`, `endpoint-get`, `endpoint-update`, `endpoint-run`, `endpoint-versions`, `endpoint-openapi-spec`, `endpoint-logs`, `endpoint-materialization-status`, `endpoints-materialization-preview`, `endpoints-last-execution-times`, `endpoints-get-all`, `endpoint-materialization-suggestion` (gated), `endpoint-materialization-conditions` (gated), plus `execute-sql`, `project-get`, `projects-get`, `agent-feedback` and the `sql-variables` tools.

## Prove it

- **The shape is right:** `endpoint-run` with a sample payload returns the agreed `columns` and `types`, and `endpoint_version` is the version you expect.
- **Every variable has a default:** the endpoint runs from the playground with no variables passed.
- **Materialisation is eligible:** `endpoints-materialization-preview` returns no rejection reason before you set `is_materialized: true`, and afterwards `endpoint-materialization-status` is not `Failed`.
- **Materialised calls pass every variable:** a call that omits one returns 400 listing it; your client never does.
- **The path is the one you meant:** `endpoint-logs` with `search` `path=materialized` (or `cache=hit`) shows the runs you expect, and `level` `ERROR` shows none.
- **The key is server-side:** no personal API key appears in browser or mobile bundles, and it has `endpoint:read`.
- **Callers are pinned:** client code sends `?version=N`.
- **A copy works:** `endpoint-run` in the target project returns rows, and `project-get` confirmed the active project before the write.
