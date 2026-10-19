# Logs and APM traces

Reading what services emitted: searching logs in the UI, investigating them through the MCP tools, authoring log alerts, and exploring OpenTelemetry spans (APM traces). The mechanism that decides most outcomes is "summarize before you read": pattern mining and pattern diffs compress millions of lines into templates, and aggregate span tools summarize latency and errors, so raw rows come last, only for confirmed suspects. Sending logs and metrics is in [INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md) and [INSTRUMENT-METRICS.md](INSTRUMENT-METRICS.md); SQL over `logs` and `posthog.trace_spans` in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md); exceptions in [ERROR-TRACKING.md](ERROR-TRACKING.md); vendor-neutral tracing in the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill.

**Contents:** [Logs in the web app](#logs-in-the-web-app) · [Searching logs](#searching-logs) · [Logs over MCP](#logs-over-mcp) · [Investigating logs](#investigating-logs) · [Authoring log alerts](#authoring-log-alerts) · [APM traces](TRACING.md#apm-traces) · [Prove it](#prove-it)

## Logs in the web app

- **Patterns view** mines logs into recurring message templates: spot noisy lines, find new error shapes, see which dominate volume. Expand a pattern and click **View matching logs** to pivot to Logs filtered by the template; the filter lands as a removable chip, and the date range, service and severity carry over.
- **Dashboards:** a "Recent logs" widget, filtered by severity and service; click a row to jump to the log.
- **Explain with AI:** open a log record and have PostHog AI explain it: what it means, what probably caused it, and what to do next (https://posthog.com/docs/logs/explain-logs-ai).
- **Replays and errors:** **View recording** and the **Related errors** tab, for logs carrying a session ID ([INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md#link-logs-to-replays-and-persons)).

## Searching logs

- **Layout:** a facet rail on the left and a filter bar on top.
- **Always-present facets:** **Level** (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) and **Service** (`service.name`). **Facets shown when the attribute exists:** Environment `deployment.environment.name`; Namespace `k8s.namespace.name`; Deployment `k8s.deployment.name`; Pod `k8s.pod.name`; Node `k8s.node.name`; Host `host.name`.
- **Facets list values with counts. Clicks cycle:** Unchecked, Included (only matching logs), Excluded (hides matching logs), Unchecked. The Level facet and resource-attribute facets support this, so you can include `error` while excluding `debug` in one query.
- **Facet search** matches field titles and group names (case-insensitive), hides empty groups, persists in the URL so the view can be bookmarked or shared, and clears when the text is removed.
- **Filter bar field kinds** (combined with AND):

| Kind | Fields | Notes |
| --- | --- | --- |
| Logs | `severity_level`, `trace_id`, `span_id` | equals / not-equals only; trace and span IDs accept hex or base64 |
| Message | full-text body | operators below |
| Resource attributes | `service.name`, `host.name`, `k8s.container.name` | |
| Attributes | `user_id`, `endpoint`, `status_code` | |

- **Attribute filters:** pick a field (resource attributes and attributes are grouped separately in the picker), an operator (equals, contains, is set, greater than, etc.) and a value. Example: `service.name` equals `checkout-api`, then `status_code` equals `500` for failed requests.
- **Trace pivot:** copy a `trace_id` from a trace URL into the filter to see every log emitted during that trace.

| Message operator | Behavior | Example |
| --- | --- | --- |
| `contains` / `doesn't contain` (default) | substring, case-insensitive | contains `failed to connect`; doesn't contain `healthcheck` |
| `equals` / `doesn't equal` | exact, case-sensitive | equals `Health check OK` |
| `matches regex` / `doesn't match regex` | RE2, case-insensitive | `timeout\|refused\|reset` |

- **Pattern pivot:** a regex compiled from the template and validated against the pattern's own examples becomes a `matches regex` filter; otherwise it falls back to `contains` with the pattern's longest literal text, and also scopes by service and severity when the sample is unambiguous.
- **Tips:** stack filters; start with `contains`, then tighten; use regex for alternatives `(timeout|refused|reset)`.

## Logs over MCP

- **Capabilities:** query and count logs (severity, service, time range, free text, counts and sparklines); list attributes and their values; list services with volume and error rate; break counts down by facet; mine and diff patterns across two time ranges; manage alerts (CRUD, Slack, webhook and Teams destinations, event history, simulating a threshold against historical logs).
- **Not exposed over MCP:** saved views, sampling rules, metric rules. Use the web app or the Logs API.
- **Order:** list attributes and values to learn the schema, count to check the result size, then query. Records carry trace and span IDs to follow a request across services.
- **Example prompts:** `Show me all error logs from the last hour`; `Show me error logs from the API service in the last hour`; `What services are logging errors right now?`; `What services are logging errors? Search for error logs from the payments service`; `What log attributes are available? Show me the values for service.name`; `Find logs related to trace ID abc123`; `Compare log patterns from today against yesterday and show me what's new`; `Show me warning and error logs from the last 24 hours, excluding debug noise`.

## Investigating logs

- **Summarize before you read.** One `posthog:logs-patterns` call compresses millions of lines into at most 200 templates; `posthog:logs-patterns-diff` answers "what is different now vs before"; raw rows (`posthog:query-logs`) are the last step, never the first.
- **Don't investigate through SQL.** HogQL exposes a `logs` table via `posthog:execute-sql`, but hand-written SQL over logs routinely hits read-byte caps. Reserve SQL for joining log-derived facts with non-log data ([HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md)).

| Tool | Returns |
| --- | --- |
| `posthog:logs-services-create` | Top-25 services: `log_count`, `error_count`, `error_rate`, sparkline |
| `posthog:logs-patterns` | One window's templates by frequency |
| `posthog:logs-patterns-diff` | Templates that are new, rate-shifted or gone |
| `posthog:logs-count` / `posthog:logs-count-ranges` | Scalar and bucketed counts |
| `posthog:logs-sparkline-query` | Volume over time by severity or service (the only bucketed view with a breakdown) |
| `posthog:logs-facet-values-create` | Distribution of severity, service or a resource attribute |
| `posthog:logs-attributes-list` / `posthog:logs-attribute-values-list` | Schema discovery |
| `posthog:query-logs` | Raw rows |

The services tool is named `posthog:logs-services-create` in the investigating guide and `posthog:logs-services` in the alert-authoring guide. Confirm in the current docs.

### "Is it healthy?" (after a deploy or change)

1. **Pin the change time and the services** (ask if unknown).
2. **`logs-services-create`.** A service that went silent fails verification as hard as one erroring.
3. **`logs-patterns-diff`** with `query.dateRange` from the change to now and `baselineDateRange` a comparable window before, scoped by `serviceNames`. New error or fatal templates are the classic regression; large `rate_ratio` shifts come second.
4. **`logs-count-ranges` spanning the boundary** for volume continuity (crash loop, restart storm, silence).
5. **Pivot suspects** via `match_regex` to `query-logs`.

A pass needs no new error templates, no large error `rate_ratio` shifts, and continuous volume. State the windows compared.

### Other questions

- **"Explain this spike":** `logs-count-ranges`, then recurse into dense buckets (each bucket's `date_from`/`date_to` feeds the next call), stopping after 3 to 4 levels; then `logs-patterns-diff` of the spike against the window before. The top `new` and `rate_shift` entries are the explanation. Don't mine both windows and diff by hand.
- **Incident triage:** `logs-patterns-diff` first (omit the baseline to get the same window last week). Unknown service: `logs-facet-values-create` faceting `service_name` under `severityLevels: ["error", "fatal"]`.
- **An unfamiliar stream:** `logs-patterns` over the last hour scoped to the service; scan by `estimated_count` and a non-zero error share in `severity_counts`; widen or add `searchTerm` only if needed.
- **A known needle** (an error string, request id, distinct_id): skip pattern mining; `logs-attributes-list`, then `logs-count`, then `query-logs`.

### Rules

- **Scope `serviceNames` on every call once known.** Unscoped calls scan the whole team and starve the pattern sample budget.
- **`query-logs` requires an explicit `query.dateRange`;** omitting it is a 400.
- **Pattern counts are sampled** (`sampled: true`): templates rarer than about 1 in 10,000 rows can be invisible. Check `baseline.total_count` before trusting many `new` entries.
- **`severityLevels` matches six canonical lowercase buckets against `severity_text` exactly.** Zero rows: check `logs-attribute-values-list { key: "severity_text" }`.
- **Budget:** one services call, at most one patterns-diff per window pair, 3 to 4 count-ranges levels, and `query-logs` only for confirmed suspects with `limit` <= 100.
- **Report:** a Verdict (healthy, regressed or inconclusive, with the windows); Suspects (template, `new` or `rate_shift`, counts or `rate_ratio`, services, 1 to 2 raw lines); what was checked and what wasn't.

## Authoring log alerts

**Upstream-only prerequisite:** the helper scripts described in this section are not included in this skill. Obtain and read the exact source helper before using its commands or depending on its output; if unavailable, report that step as unverified. Do not invent a replacement or assume these paths exist in the project. [PostHog skills, LOGS-AND-APM.md]

The goal: thresholds that fire 0 to 3 times per week on real production patterns, on services that matter. Measure; don't guess. This is not for tuning existing alerts (use `posthog:logs-alerts-events-list` and `posthog:logs-alerts-partial-update`) or for use mid-incident.

- **Tools:** `posthog:logs-services`, `posthog:logs-attributes-list` / `posthog:logs-attribute-values-list`, `posthog:logs-count-ranges`, `posthog:logs-alerts-simulate-create` (replays a draft against `-7d` history with the full state machine), `posthog:logs-alerts-create`, `posthog:logs-alerts-destinations-create`. No `query-logs` while authoring (at the end, `limit: 10` if the user wants samples).

### Steps

1. **Triage.** `logs-services` over the last 24h with no filters. A candidate has `log_count` >= about 1k in 24h and a non-zero `error_rate` (or the user named it). High volume with `error_rate` 0: skip unless it is a volume-shape alert.
2. **Narrow.** `logs-attributes-list` (`attribute_type: log`); discriminators like `http.status_code`, `error.type`, `k8s.container.name`. Use one severity plus one or two attribute filters.
3. **Baseline.** `logs-count-ranges` with `dateRange: { date_from: "-7d" }` and `targetBuckets: 24` (about 7h buckets), piped to `echo '<count-ranges JSON>' | python3 scripts/baseline_stats.py --window-minutes 5`. The output has `n_buckets`, `bucket_minutes`, `alert_window_minutes`, `stats {p50,p95,p99,max}`, `suggested_threshold_count`, `rationale` and `health`. Don't eyeball percentiles. Script options: `--floor` (default 5), `--min-buckets` (default 12), `--window-minutes` (5, 10, 15, 30 or 60); median for p50, linear-interpolation percentiles matching the numpy default.
4. **Draft and simulate** (defaults below) with `date_from: "-7d"`, reading `fire_count` and `resolve_count`.
5. **Iterate, at most 3 simulate calls per candidate.** `fire_count` 0 and spiky: lower toward `stats.p95` or use 1-of-2. 0 and flat: skip. Above 5: raise toward `stats.max` or use 3-of-5. A `resolve_count` mismatch is acceptable. Read values from the script's `stats`; never recompute them.
6. **Ship.** `logs-alerts-create` named `<service> error rate (auto)`, then `logs-alerts-destinations-create`: an alert with no destination is silent. Confirm the channel or URL with the user; never wire auto alerts to a production channel without confirmation; use `enabled: false` for review-then-flip.

| Health flag | Meaning |
| --- | --- |
| `sparse:N_of_M_buckets` | Widen, use `-30d`, or skip |
| `empty` | Skip |
| `spiky` | max >= 10x p95; count alerts work well |
| `flat` | p95/p50 <= 1.5; be cautious |
| `[]` | Healthy |

- **Threshold formula:** `threshold_count = max(p99, median × 3, floor) × (window_minutes / bucket_minutes)`, then `max(floor, round(...))`. It assumes uniform arrival; the simulator is the final arbiter (it replays per-minute history).

| Draft field | Default |
| --- | --- |
| `threshold_count` | from the script |
| `threshold_operator` | `above` (`below` only for floors) |
| `window_minutes` | `5` (allowed 5, 10, 15, 30, 60; the API rejects others) |
| `evaluation_periods` | `3` |
| `datapoints_to_alarm` | `2` (2-of-3) |
| `cooldown_minutes` | `30` |

- **N-of-M:** 1-of-1 only for incidents you can't delay (payments erroring at all); 3-of-5 for known short bursts; above 5 has diminishing returns. Use a 30 or 60 minute window for bursty or cron spikes.
- **Cooldown:** a logs alert notifies once when it starts firing and once when it resolves, with no re-notify while firing. Cooldown is the minimum time between any two notifications; 0 when every fire and resolve must notify.
- **Filter shape** (required, the same in simulate): at least one of `severityLevels` (`["trace","debug","info","warn","error","fatal"]`), `serviceNames`, `filterGroup`. Example: `{"severityLevels": ["error", "fatal"], "serviceNames": ["api-gateway"]}`.
- **Destinations:** Slack `type: "slack"` with `slack_workspace_id`, `slack_channel_id` (`slack_channel_name` optional); Webhook `type: "webhook"` with `webhook_url`; Teams `type: "teams"` with `webhook_url`.
- **Token economy:** one services call; one count-ranges per candidate at 24 buckets (at most 30); at most 3 simulates; zero query-logs.
- **Footguns:** `below` without justification (fires at 3am in quiet hours); filtering by message text alone (`searchTerm`, `message icontains`) is brittle, so prefer a structured attribute; filtering by `trace_id` or `span_id` is useless.
- **Volume-floor alerts (`below`):** only for constant volume across all hours with at least 7 days of baseline. Threshold `max(1, round(p50 * (5/bucket_minutes) * 0.25))`, computed with `python3 -c "import sys, json; d=json.load(sys.stdin); print(max(1, round(d['stats']['p50'] * (5/d['bucket_minutes']) * 0.25)))" < stats.json`; 3-of-3, `window_minutes: 15` minimum, `cooldown_minutes: 60`; always simulate. `fire_count > 0` with no outages means too aggressive.
- **Report** per shipped alert: name, filters, threshold, simulated `fire_count`, destination; skipped candidates and why; total simulate calls and alerts.

## APM traces

See [TRACING.md](TRACING.md#apm-traces).

## Prove it

- **A health check has a verdict:** it names the windows compared and shows no new error templates in `logs-patterns-diff`, no large error `rate_ratio` shifts, and continuous volume in `logs-count-ranges`; or it names the suspects.
- **Raw rows came last:** every `query-logs` call had an explicit `query.dateRange`, `serviceNames` and `limit` <= 100, and followed a patterns or count step.
- **An alert is sized:** `baseline_stats.py` output fed the threshold, `logs-alerts-simulate-create` over `-7d` gave a `fire_count` of 0 to 3 per week, and the alert has a destination the user confirmed.
