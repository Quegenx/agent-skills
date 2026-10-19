# Reading production metrics on Vercel

Production telemetry picks what to look at; source code explains it. On Vercel that telemetry comes from `vercel metrics` (also `vc metrics`), the CLI over Observability and Speed Insights. This file covers getting a query to run, reading a failure correctly, the catalog of queries an audit needs, the window, limit and rate rules, and labelling cost honestly. The method comes from Vercel's vercel-optimize skill ([Vercel, vercel-optimize], MIT); every metric name was re-checked on 2026-10-18 against https://vercel.com/docs/cli/metrics and https://vercel.com/docs/speed-insights/accessing-metrics-with-vercel-cli, and where the skill's names differ, the documented form is written here. What to do with a slow route once found is in [MEASURE.md](MEASURE.md#slow-routes-cold-starts-and-wall-clock-on-vercel); what to do with an uncached one is in [CACHING.md](CACHING.md#cdn-caching-on-vercel).

## What needs Observability Plus

From https://vercel.com/docs/cli/metrics and https://vercel.com/docs/observability/observability-plus (checked 2026-10-18):

- "Web Analytics metrics are available through `vercel metrics` without Observability Plus." "Speed Insights metrics are available through `vercel metrics` without Observability Plus." "Metrics other than Web Analytics and Speed Insights metrics require Observability Plus."
- Observability Plus "is available on Paid Pro and Enterprise teams". "For teams created or upgraded to Paid Pro on or after April 3, 2026, Observability Plus is enabled by default. Existing Paid Pro and Enterprise teams can enable it separately" (dashboard Billing, or `vercel buy addon observability-plus`). "Pro Trial plans require conversion to Paid Pro."
- "By default, Observability Plus applies to all projects in your team. You can exclude specific projects to control costs. Excluded projects revert to the free-tier observability experience with limited retention and no access to advanced metrics or Query."
- Price: "$1.20 per 1 million events".
- Retention, as documented:

| | Observability (free) | Observability Plus |
|---|---|---|
| Data retention | Hobby: 12 hours, Pro: 1 day, Enterprise: 3 days | 30 days |
| Runtime logs | Hobby: 1 hour, Pro: 1 day, Enterprise: 3 days | 30 days, "max selection window of 14 consecutive days" |
| Vercel Functions | "No Latency (p75) data, no breakdown by path" | "Latency data, sort by p75, breakdown by path and routes" |
| CDN Requests, Fast Data Transfer | "No breakdown by path" | "Full request data" |

Disabling it has a cost of its own: "After you disable it, Vercel stops collecting Observability Plus events", "Alerts for the team or project stop while Observability Plus is disabled", and if it is turned off before the billing cycle ends "you will lose access to existing data."

## Setup checks, in order

Run these before any real query, and stop with a named reason at the first that fails. [Vercel, vercel-optimize, collect-signals.mjs]

1. **CLI version.** The skill requires 53.0.0 or later because "Pre-v53 lacks `vercel metrics` and `vercel contract`"; the failure reads `VERCEL_CLI_TOO_OLD: have x, need >= 53.0.0. Upgrade with npm i -g vercel@latest`. (The minimum version is the skill's; the docs page states none.)
2. **Auth:** `vercel whoami --format json`.
3. **Project id:** from the argument, then `VERCEL_PROJECT_ID`, then `.vercel/project.json` (written by `vercel link`). None gives `NO_PROJECT_ID`.
4. **Scope.** A project with no resolvable owner gives `PROJECT_SCOPE_UNRESOLVED`: ask the user which team or personal scope owns it. "Do not infer the intended scope from the current `vercel whoami` team." A CLI scope that doesn't resolve gives `SCOPE_UNRESOLVED`, fixed with `vercel switch <team>` or `vercel link --yes --project <p> --team <slug>`. Then confirm the project with `vercel api /v9/projects/<id>?teamId=<orgId>` (leave out `teamId` when the org id starts with `usr_`); a returned id or owner id that differs from the resolved one is `PROJECT_SCOPE_MISMATCH`.
5. **Run from the linked directory, or name the project.** "--cwd is load-bearing: the Vercel CLI resolves project/team from cwd's .vercel/project.json. Outside the project, metric queries silently hit the wrong team and look like 'no traffic'." [Vercel, vercel-optimize, deep-dive.mjs] The skill exits 2 when the link is missing or names another project. The docs give the explicit form: `--project` "defaults to the linked project when `--all` is not set", and the docs' project-scoped examples pass `--project project-name --prod`; `--prod` "limits the query to production data" (equivalent to `--filter 'environment:production'`). The skill passes neither and relies on the link, so preview traffic can be mixed into its numbers; pass both.
6. **One canary query before the fan-out:** `vercel.request.count`, sum, limit 1, "before pulling slower project context. If this fails, the orchestrator can ask the user immediately instead of waiting on billing."
7. **Then everything else in parallel,** each query wrapped so "one failure degrades only that metric."

**Missing data is a stop, not a silent downgrade.** When Observability Plus is missing, offer two paths (enable it and re-run, or a limited run) and say plainly that "This is a data dependency, not an upgrade pitch"; "Do not imply the scanner-only report is a complete optimization audit." [Vercel, vercel-optimize, SKILL.md, observability-plus.md]

## What a failure means

"The `vercel metrics schema` probe alone is NOT a reliable usability signal: it can return OK while per-route queries fail with payment_required … or FORBIDDEN (auth-scope mismatch). Diagnose AFTER running queries by counting failure codes." When every query fails, take the most frequent error code: [Vercel, vercel-optimize, collect-signals.mjs]

| Most frequent code | Meaning | What to tell the user |
|---|---|---|
| `daily_quota_exceeded` | daily quota used up | "Retry after the next UTC midnight reset." |
| `payment_required`, text says Observability Plus is required or not enabled | no Observability Plus on this project | enable it, or include the project again if it was excluded |
| `payment_required`, other text | billing | check the subscription or event quota |
| `forbidden`, `not_authorized`, 403 | wrong team | "likely logged in to the wrong team (run `vercel switch`)" |
| `project_not_found` | wrong id or scope | `vercel switch`, or verify the id |
| `not_linked` | no link in this directory | `vercel link --yes --project <p> --cwd <dir>` (plus `--team`) |
| anything else | unknown | report it; don't guess |

- **Queries succeed but every one returns zero rows:** the project is usable and has no traffic in the window, "NOT an Observability Plus billing issue." On a project excluded from Observability Plus, remember the free retention above (Pro: 1 day).
- **"Zero rows ≠ 'no data'":** a per-route slice cut from a broad query may be empty because the broad query's row limit truncated that route; query the route directly before concluding. [Vercel, vercel-optimize, deep-dive.mjs]
- **Read the exit code and the JSON first, stderr last:** "CLI error strings aren't a stable contract"; unknown codes mean missing data, so continue with the rest. Shell out with `execFile`, not `exec`, and redact tokens and `Authorization` headers before logging stderr. [Vercel, vercel-optimize, lib/vercel.mjs, data-collection.md]

## Window and limit rules

- **One window for every query.** The skill uses 14 days: "long enough for weekly cycles, short enough to surface recent regressions before stale data dilutes them." The CLI's default is not that: "If omitted, the CLI defaults to the last hour" (https://vercel.com/docs/cli/metrics). "Mixing 1h with 14d windows silently produces incompatible rollups, every query MUST pass since: TIME_WINDOW", and the skill enforces it with a test. [Vercel, vercel-optimize, lib/queries.mjs] A 14-day window needs Observability Plus retention (30 days) for every metric outside Speed Insights and Web Analytics; the free tier keeps 1 day on Pro.
- **Raise the group limit.** `--limit` "sets the maximum number of grouped results returned per time bucket. The default is `10`" (docs), "too small for a typical app." The skill uses 200 for routes and 50 for hosts and other dimensions.
- **One aggregation per query** (`-a p95`, `-a p75`, `-a sum`); "If omitted, the CLI selects a supported aggregation based on the metric's unit" (docs), so always pass it. The JSON value comes back under `<metric_id_with_underscores>_<aggregation>`, for example `vercel_request_count_sum` [Vercel, vercel-optimize, lib/vercel.mjs].
- **Filters are KQL** (docs): `--filter 'httpStatus >= 500'`, `'requestPath:(/docs* OR /guides*)'`, repeat `-f` to AND them. "Each filter can contain up to 2,048 characters and 8 levels of nesting. A query can contain up to 50 expression nodes across all filters." "OData filter syntax is deprecated." The skill's own comment shows `-f 'http_status ge 500'`, which is the deprecated form.
- **Take dimension names from the schema.** The skill groups by snake_case names (`cache_result`, `http_status`, `request_method`, `function_start_type`); the docs' examples spell dimensions in camelCase (`httpStatus`, `requestPath`, `deviceType`, `projectId`) and list the fields by label (HTTP Status, Cache Result, Request Method, Route, WAF Action) at https://vercel.com/docs/query/reference. Run `vercel metrics schema <metric> --format json` and use what it returns.
- **Count before trusting a percentile.** For Speed Insights, "Each Speed Insights value metric supports the `count` aggregation for collected data points ... Fewer data points can make comparisons less reliable" (docs). The skill requires at least 50 samples on a route before judging its Core Web Vitals: "Below this floor p75 is too noisy."

## Rate limits

Neither the CLI page nor the Observability Plus page states a rate limit for metric queries. The skill works to "100 req / 60s / team" (its own figure, unverified) and throttles below it [Vercel, vercel-optimize, throttle.mjs, lib/vercel.mjs]:

- **A semaphore and a sliding window together:** 8 concurrent and 80 per 60 s (20% headroom); "semaphore alone is insufficient (8 concurrent × ~1s queries = 480/min)".
- **Retry a rate-limit error by waiting most of the window:** 3 tries at 60 s times 1, 1.5 and 2, plus 0 to 15 s of jitter, because the CLI does not pass `Retry-After` through.
- **Some codes are terminal:** `payment_required` is never retried, and `daily_quota_exceeded` blocks every call until the next UTC midnight.
- **Spend fewer queries:** reuse a broad query's rows for per-route slices (falling through to a direct query on zero rows, as above), and deduplicate identical queries by a key holding everything that changes the CLI arguments (metric, aggregation, sorted group-by, filter, since, limit, scope). [Vercel, vercel-optimize, deep-dive.mjs]

## The query catalog

The queries an audit runs, with the documented metric names. [Vercel, vercel-optimize, lib/queries.mjs] Every one takes the same `--since`, `--project` and `--prod`.

| Signal | Metric | Aggregation | Group by | What it answers |
|---|---|---|---|---|
| Cache hit rate | `vercel.request.count` | sum | route, cache result | which routes miss the CDN |
| Mutation share | `vercel.request.count` | sum | route, request method | "skip mostly-POST routes (Server Actions, mutations) where 0% cache is correct behavior" |
| Errors | `vercel.function_invocation.count` | sum | route, HTTP status | "Canonical 5xx source"; `vercel.request.count` by status is the fallback |
| Slow routes | `vercel.function_invocation.function_duration_ms` | p95 | route | "Canonical slow-route signal" |
| CPU vs wall clock | `vercel.function_invocation.function_cpu_time_ms` | sum (p95 to compare with duration) | route | Active CPU, which "Fluid Compute bills on" |
| Server TTFB | `vercel.function_invocation.ttfb_ms` | p95 | route | whether the response streams early |
| Cold starts | `vercel.function_invocation.count` | sum | route, function start type | cold, hot or prewarmed, collapsed to a cold share per route |
| Memory | `vercel.function_invocation.peak_memory_mb`, `.provisioned_memory_mb` | max | route | headroom |
| Bandwidth | `vercel.request.fdt_total_bytes` | sum | route, bot category, cache result | "Empty `bot_category` = human traffic" |
| Middleware | `vercel.middleware_invocation.count`, `vercel.middleware_invocation.request_duration_ms` | sum, p95 | request path | "Heavy middleware traffic = missing matcher" |
| ISR | `vercel.isr_operation.read_units`, `.write_units` | sum | route | "High writes/reads = over-aggressive revalidate" |
| Images | `vercel.image_transformation.count`, `.source_size_bytes` | sum | source image hostname | the image bill |
| Upstreams | `vercel.external_api_request.request_duration_ms` | p75 | origin hostname | slow third parties |
| Upstream volume | `vercel.external_api_request.count`, `.transfer_bytes` | sum | origin hostname | call count and payload |
| Core Web Vitals | `vercel.speed_insights.lcp_ms`, `vercel.speed_insights.inp_ms`, `vercel.speed_insights.cls`, `vercel.speed_insights.ttfb_ms` | p75 | route | field LCP, INP, CLS, TTFB |
| CWV sample size | the same Speed Insights metric | count | route | the 50-sample floor |
| Firewall | `vercel.firewall_action.count` | sum | WAF action | allow, challenge, deny, log and the rest |
| BotID | `vercel.bot_id_check.count` | sum | none | "> 0 confirms BotID is wired up" |

Where the skill's names differ from the docs:

- **Speed Insights.** The skill queries `vercel.speed_insights_metric.lcp`, `.inp`, `.cls`, `.ttfb_ms` and `.count`. The documented names are `vercel.speed_insights.lcp_ms`, `vercel.speed_insights.inp_ms`, `vercel.speed_insights.cls`, `vercel.speed_insights.fcp_ms` and `vercel.speed_insights.ttfb_ms`, and there is no count metric: data points are the `count` aggregation on the value metric (`vercel metrics vercel.speed_insights.lcp_ms --aggregation count --group-by route`).
- **Middleware duration.** The skill uses `vercel.middleware_invocation.duration_ms`; the documented name is `vercel.middleware_invocation.request_duration_ms`.
- **GB-hours.** The skill sums `vercel.function_invocation.function_duration_gbhr`. The CLI page lists `function_duration_gbhr` only under `vercel.middleware_invocation`, while the Query reference lists "Duration (Gb-hrs)" for Function Invocations. Confirm with `vercel metrics schema vercel.function_invocation` before relying on it.
- **Newer metrics the skill doesn't query:** `vercel.function_invocation.cpu_throttle_percent`, the Fast Origin Transfer metrics (`fot_in_bytes`, `fot_out_bytes`, `fot_total_bytes`), `vercel.ai_traffic.count` and its crawler and assistant splits, and `vercel.image_transformation.optimized_size_bytes`.

**Core Web Vitals limits are the "good" limits.** The skill labels its gates "Google's "Poor" band ... LCP p75 > 2500ms, INP > 200ms, CLS > 0.1" and the queries "> 2500ms = poor". web.dev (https://web.dev/articles/vitals) gives those numbers as the good limits: "LCP should occur within 2.5 seconds", "INP of 200 milliseconds or less", "CLS of 0.1 or less", measured at the 75th percentile. A route above them fails "good"; it is not necessarily "poor". Use the same numbers, and call the result "not good". Then diagnose per metric: "For LCP, inspect server response and critical media. For INP, inspect heavy client JavaScript and interaction handlers. For CLS, inspect dimensions, fonts, and injected content." "Do not emit a generic 'improve Web Vitals' recommendation." [Vercel, vercel-optimize, support-topics/core-web-vitals-client-bottlenecks.md] The browser-side fixes are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md).

Real Experience Score "is not available through `vercel metrics`; use the Speed Insights dashboard" (docs).

## Cost: this project or the whole team

[Vercel, vercel-optimize, collect-signals.mjs, lib/vercel.mjs]

- **Pull usage grouped by project:** `vercel usage --format json --from <14 days ago> --to <today> --group-by project`, because "every recommendation must be project-scoped". The CLI "rejects --breakdown with --group-by".
- **Capture the team total before filtering to the project,** "so the report can label 'this project vs team-wide' honestly". Report which one a number is (`usageScope: 'project' | 'team'`), with the team total and the part no project accounts for.
- **A context mismatch makes usage unavailable.** If the usage context differs from the contract context, log `USAGE_CONTEXT_MISMATCH` and treat usage as unavailable for this project rather than showing another scope's bill.
- **Parse the usage JSON defensively:** its shape "is documented but not stable across CLI versions"; the skill tries `totalCost`, then `totals.billedCost`, then `services[].billedCost|cost`, then `breakdown.data[]`.
- **Precise performance, magnitude-only cost.** "Performance numbers stay precise because they're observed, not extrapolated. We trust observed metrics; we don't trust dollar projections." An estimate is a range anchored on the observed baseline ("from 850ms toward ~250-400ms based on similar cached routes"). State a saving as a band (under $5 "small cost impact", up to $50 "low-tens of dollars per month", up to $500 "hundreds", up to $5,000 "low-thousands", above that "thousands+"), and write observed counts as "in this window", never "per month". [Vercel, vercel-optimize, doctrine.md, impact-magnitude.mjs]
- **Observability events are part of the bill.** When they pass 20% of it, there is no sampling control for Observability Plus in the docs: "reduce upstream invocations instead", and check third-party tracing set to sample everything (`tracesSampleRate=1`). Excluding a project is the documented cost lever. [Vercel, vercel-optimize, candidates.md]
- **Current billing names:** "Edge Requests are now called CDN Requests"; the CDN resources are Fast Data Transfer, Fast Origin Transfer and CDN Requests (https://vercel.com/docs/manage-cdn-usage). Old dashboards and the skill's own gates still say Edge Requests.

## Prove it

For a project you're auditing: the setup checks pass in order, or the report names the one that failed and its remedy. The canary query returns a row. Every query in the run shows the same `--since`, `--project` and `--prod`, a `--limit` above 10 for grouped queries, and an explicit aggregation. Every metric name in the run appears in `vercel metrics schema` output. Each Core Web Vitals verdict quotes its p75, its sample count (50 or more), and the web.dev good limit it fails. Each cost figure says whether it is this project's or the team's.
