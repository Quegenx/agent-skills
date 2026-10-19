# Sentry Signals

Which Sentry signal answers which question, and how to use each one well: errors, traces, logs, application metrics, profiles, Session Replay, user feedback, crons, uptime, monitors and alerts, releases and AI monitoring. What to emit and attribute naming are in [INSTRUMENTATION.md](INSTRUMENTATION.md); per-platform code for each signal is in the platform files ([PRACTICES.md](PRACTICES.md#route-to-the-platform-file) routes to them); sampling each signal is in [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md); detailed cross-platform practice for Session Replay, logs, metrics, crons, user feedback and profiling is in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md). The trace ID is what ties them together: errors, spans, logs, replays and metrics that share it show up as one story, so the choice that decides most outcomes is picking the right signal for the question and keeping tracing on and sampled underneath it.

**Contents:** [Choosing a signal](#choosing-a-signal) · [Errors](#errors) · [Tracing](#tracing) · [Logs](#logs) · [Application Metrics](#application-metrics) · [Profiling](#profiling) · [Session Replay](#session-replay) · [User Feedback](#user-feedback) · [Crons](#crons) · [Uptime](#uptime) · [Monitors, issues and alerts](#monitors-issues-and-alerts) · [Releases](#releases) · [AI and agent monitoring](#ai-and-agent-monitoring) · [Prove it](#prove-it)

## Choosing a signal

| Question | Signal | Notes |
|---|---|---|
| What broke? | **Error** | Default, always on. |
| What is slow, what is the call chain? | **Span / trace** | Powers N+1 and slow DB detection. |
| What led up to it? | **Log** | |
| How many, what trend? | **Metric** | Counter, gauge, distribution. |
| Which function burns CPU? | **Profile** | See the tracing disagreement under [Profiling](#profiling). |
| What did the user see? | **Session Replay** | Frontend and mobile only. |
| What does the user think? | **User Feedback** | |
| Did the scheduled job run? | **Cron monitor** | |
| Is the site up? | **Uptime monitor** | No SDK code. |

- **Error vs log:** an unexpected critical failure is an error event, not a log.
- **Log vs span:** if you find yourself logging start and end timestamps to measure duration, you want a span.
- **Span vs metric:** an Application Metric is aggregated at query time and can carry high-cardinality attributes.
- **Don't emit metrics Sentry derives** (issue counts, throughput, latency percentiles, crash-free rate). Reserve custom metrics for KPIs like `checkout.failed`, `queue.depth`, `cache.hit_ratio`.
- **Where each goes:** errors everywhere; tracing at boundaries first (incoming and outbound HTTP, DB, cache, queue), custom spans only for meaningful business operations; a few high-signal log events per request; a small KPI set of metrics; replay on frontend and mobile, high sampling on errors and low on normal sessions; a cron monitor on every job whose silent failure hurts; an uptime monitor on every public endpoint, usually one per service on a health route or the site root.
- **When the user says "you pick":** errors + tracing at a modest sample rate + releases + source maps, then add logs, replay or profiling as the use case warrants.

## Errors

- **An issue is a group of events sharing a fingerprint** (stack trace plus exception type and message). Its **representative event** is the one richest in context, not necessarily the latest.
- **The cause isn't always in the stack trace:** check suspect commits, and a **trace-related issue** may be the real origin.
- **Several issues for one bug, or one issue for several bugs, is a grouping problem;** the fingerprint is tunable (see `beforeSend` fingerprinting in [PRACTICES.md](PRACTICES.md#filtering-noise)).
- **An actionable error** has a readable stack trace, `release` and `environment` from the start, context but not PII, and is not routine control flow: expected 404s and validation rejections aren't errors.

## Tracing

- **A trace is a tree of spans;** the root span is the transaction (service span in the current model). Auto-detected performance issues need tracing on: N+1 queries, slow DB calls, render-blocking assets, consecutive HTTP calls.
- **Reading a trace:** the widest span or a gap is where the time went. A dashed or orphan span means a transaction is missing (unsent, sampled out, rate-limited). Multiple roots usually mean a trace-ID bug in custom instrumentation. A span carries its profile.
- **Name spans low-cardinality and templated:** `GET /users/:id`, not `/users/12345`. Follow Sentry's semantic conventions for attribute keys.
- **Cross-service** setup (`tracePropagationTargets`, CORS for `sentry-trace`, `baggage`, `traceparent`) is in [PRACTICES.md](PRACTICES.md#distributed-tracing).

## Logs

- **Turn them on:** on SDK versions below `10.71.0` logs are opt-in; set `enableLogs: true`.
- **Structured logs:** level, message and key/value attributes, with the trace ID attached automatically. Not for timing (span), not for unexpected critical failures (error), not for every function call.
- **Good uses:** runtime decisions (which feature-flag path ran), audit and business events, summaries of multi-step work, context around recoverable failures.
- **Attributes, not interpolation,** with consistent namespaced names `myapp.<domain>.<field>`. Agree conventions across services and use the same attribute names on both sides of `baggage` / `sentry-trace` propagation. Prefer the SDK's set-user call over repeating the user ID. Log fields, not whole objects; omit absent optional attributes rather than sending `null`.
- **Query by attribute:** `severity:error`, `trace_id:...`, `user.id:...` with `AND` / `OR`. Raw text search matches only the message.
- **Levels:** `debug` (temporary diagnostics), `info` (normal), `warn` (recoverable but notable), `error` (handled failures). Critical goes to a real Sentry error event. Error logs carry the retry count, response status, key non-sensitive request and response fields, and the decisions that led there.
- **Integrations:** Pino or console, or the SDK logger, among others.
- **Never log passwords, tokens or API keys;** prefer opaque user IDs; mind PCI, GDPR, CCPA and HIPAA. Server-side scrubbing is a backstop, not a license to log carelessly.
- **Keep or drop each log:** Production question, Useful at volume, Right signal, Not already covered, Consistent, Safe, Actionable. Finish the sentence "This log is valuable because it helps answer <specific question>." Drop logs that confirm routine UI interactions, duplicate generic API failures or record expected validation failures.
- **Logs and breadcrumbs:** prefer Sentry Logs over breadcrumbs unless the user asks for breadcrumbs.

## Application Metrics

- **Types:** **count** (`checkout.failed`, `signup.completed`), **gauge** (`queue.depth`, `connections.active`), **distribution** (`api.latency`, `payload.size`). Metrics are trace-connected, emitted per occurrence and aggregated at query time.
- **High cardinality is fine,** a key benefit (user IDs, request IDs, URLs). Set **units** on distributions (ms, bytes). Name them `domain.thing.action`.
- **Don't re-invent derived numbers.** A KPI you keep computing from logs is a candidate to promote to a metric.
- **Breaking change:** the old beta `Sentry.metrics.increment` / StatsD-style API was removed in SDK v9. Use the current `count` / `gauge` / `distribution` API.

## Profiling

- **Reading a flame graph:** in a single profile X is time and width is time spent; the bottleneck is the deepest wide frame with high **self-time**. In an aggregated view width is how often a frame appears. Act on wide application frames. One thread at a time; differential views compare.
- **Modes:** **continuous profiling** (backend) and **UI profiling** (frontend and mobile); the legacy transaction-based mode is being replaced.
- **Lifecycle:** the default `manual` lifecycle collects nothing until you start and stop the profiler explicitly; the `trace` lifecycle requires tracing. Overhead is about 1 to 5% CPU, and sampling is session-scoped.
- **Does profiling need tracing?** The sources disagree: the signal-choice reference says it requires tracing on; the profiling reference says in the default `manual` lifecycle it runs independently of tracing, and only the `trace` lifecycle and legacy transaction-based profiling need it.

## Session Replay

- **Web replay is rrweb DOM snapshots,** not a screen recording; mobile is view-hierarchy reconstruction plus periodic screenshots with more aggressive redaction. Frontend and mobile only.
- **Dead click:** no response within about 7 seconds. **Rage click:** a repeated-click subset. Both become their own issues.
- **Sample asymmetrically:** `replaysOnErrorSampleRate` high (often `1.0`), `replaysSessionSampleRate` low (a few percent).
- **Privacy:** defaults mask all text and block media. Use mask and block selectors before unmasking anything; network body capture is opt-in. Privacy rules are in [PRACTICES.md](PRACTICES.md#session-replay).

## User Feedback

- **The value is the linked context:** a widget submission attaches the replay (roughly the minute before they hit submit) and the page URL; a crash-report submission links to the issue. Feedback surfaces as issue category `Feedback`.
- **Mechanisms:** the **Feedback widget** (browser only, optional screenshot, the default for web); the **`captureFeedback` API** (cross-platform, mobile, backend, or your own UI); the **crash-report modal**.
- **Decide up front** which fields and screenshots to collect, route feedback to Slack, Jira or an alert, and apply replay-grade masking to screenshots.

## Crons

- **Check-ins:** `in_progress` at start, `ok` or `error` at the end. Detects missed, late, timed-out and failed runs.
- **"Missed" often isn't the job code:** the scheduler, the network (outbound firewall) or a timeout. A real exception arrives as a separate error event on the same trace.
- **Thresholds:** `failure_issue_threshold` (N consecutive failures before an issue), `recovery_threshold` (N consecutive OKs to resolve). Monitors broken for weeks get **auto-muted** while billing continues.
- **Config:** schedule (crontab, **5-field only**, or interval), `timezone`, `checkin_margin`, `max_runtime`. Send the config with the check-in (upsert) so the monitor is created on the first run: a check-in for a slug that has no monitor and carries no config is dropped.
- **Paths:** the SDK's `withMonitor` or decorator (sends start and outcome), an HTTP check-in, or `sentry-cli` wrapping a shell command. A bare heartbeat detects missed runs but not `max_runtime` timeouts.
- **Stable slugs:** `nightly-invoice-sync`, not `job-1`.

## Uptime

- **Server-side, no SDK code.** MCP catalog tools: `create_uptime_monitor`, `update_uptime_monitor`, `delete_uptime_monitor`, `find_uptime_monitors`, `get_uptime_monitor_details`; creating needs `project:write`. Call `find_uptime_monitors` first and update rather than duplicate. Create in the owning project with `environment` set to the production name.
- **Defaults:** `intervalSeconds=60`, `timeoutMs=5000`, method `GET`. An issue opens after 3 consecutive failed checks and resolves after 1 success; raise `downtimeThreshold` only for known-flaky URLs.
- **Find the host in this order:** production events via `search_events`, then the deploy setup (`*_URL`, `*_SITE_URL`, `*_BASE_URL`, README, `AGENTS.md` / `CLAUDE.md`), then ask. Never `localhost`, preview deploys or guessed hosts. Account for `basePath`, rewrites, proxies and a separate API host.
- **Pick the URL:** prefer `/health`, `/healthz`, `/api/health`, else the site root; for an API, offer to add a health route. GET it without credentials, confirm `2xx`, show the user, and create on confirmation. If nothing answers, don't create. One monitor per public service, not per route.
- **Alerts:** an uptime issue opens as **high priority**, and every new project has an alert emailing owners for new high-priority issues; verify with `find_alert_rules`. For a downtime-only filter use `issue_category` `10` (Outage, covers uptime and cron).
- **Pitfalls:** `401`, `403` or a login redirect looks like downtime; WAF or bot protection can block the checker (https://docs.sentry.io/product/monitors-and-alerts/monitors/uptime-monitoring/troubleshooting/). A failing check can carry a trace into the app (https://docs.sentry.io/product/monitors-and-alerts/monitors/uptime-monitoring/uptime-tracing/).

## Monitors, issues and alerts

Issue triage and alert setup in depth are in [ISSUES-AND-ALERTS.md](ISSUES-AND-ALERTS.md).

- **Three independent layers, many-to-many:** a Monitor decides when a signal becomes an issue; an Issue is triaged (status, priority, assignee, history); an Alert decides what to do. "Metric Monitor" is the older "metric alert".
- **Default monitors per project:** **Issue Stream Monitor** and **Error Monitor**. Custom ones: **Metric Monitor** (errors, spans, logs, releases, Application Metrics; fixed, percentage change, or dynamic anomaly detection), **Cron Monitor**, **Uptime Monitor**, **Mobile Builds Monitor** (app-size thresholds). Monitor config sets priority, auto-resolve and assignee (ownership rules can override).
- **An alert is sources, then triggers, then filters, then actions.** Triggers (new, regression, reappearance, resolved) are OR'd; filter groups are ANY or ALL. If an issue exists but no alert fired, a filter is usually why. Actions: Slack, email, PagerDuty, Discord, Jira, webhook.
- **Automation coverage:** alert creation through the workflow-engine API; uptime end to end through the MCP; other monitors and dashboards are read-only in the MCP (`find_alert_rules`, `get_alert_rule`, `find_monitors`, `get_monitor_details`, dashboards).

## Releases

- **What a release unlocks:** regression detection, crash-free rates and release health (sessions are on by default in most modern SDKs), suspect commits, resolve-in-next-release and `Fixes SENTRY-XXX`.
- **Two ingredients whose names must match:** the `release` and `environment` tag on events (set in `init` or through `SENTRY_RELEASE`), and the release object with commits and a deploy created in CI (`sentry-cli` or the GitHub Action). Commits need a source-control integration, which uses OAuth and can't be done by an agent. CI setup, naming and source maps are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## AI and agent monitoring

Setup per runtime and library is in [AI-MONITORING.md](AI-MONITORING.md). The decisions that hold everywhere:

- **The docs are the source of truth;** read them at runtime, starting at https://docs.sentry.io/product/agents/ .
- **One AI span producer per runtime,** and tracing enabled and sampled: if the root trace is dropped, the agent run is dropped.
- **A stable opaque conversation ID.** Cached, cache-creation and reasoning token counts are subsets of total input and output tokens.
- **Prompt and response capture:** the AI-monitoring reference says keep prompt, response, tool argument, tool result and system-instruction capture enabled by default and disable or scope it only on a privacy concern; the data-scrubbing reference calls it opt-in and notes default server-side rules don't scrub it. See [JAVASCRIPT.md](JAVASCRIPT.md#datacollection) and confirm with the user.

## Prove it

- **Each chosen signal has data:** trigger it on a real path (table in [PRACTICES.md](PRACTICES.md#verify-end-to-end)) and confirm through the MCP that the error, trace, log, metric or cron check-in arrived.
- **Signals connect:** an error event and its log lines share the trace ID shown on the trace view.
- **Spans are templated:** span names in the Spans dataset read like `GET /users/:id`, not raw IDs.
- **Logs are queryable:** a `severity:error` or attribute query (`user.id:...`) returns your log; every log you added passes the keep-or-drop checklist.
- **Metrics have units and stable names:** distributions carry ms or bytes, names follow `domain.thing.action`, and none duplicate a number Sentry derives.
- **Crons create themselves:** the first check-in carries config and the monitor appears; a forced failure opens an issue after `failure_issue_threshold` failures.
- **Uptime points at a real host:** the URL returned `2xx` without credentials before creation, and `find_alert_rules` shows the high-priority alert.
- **Alerts fire:** for an issue that should have alerted, the alert's triggers and filters match it.
