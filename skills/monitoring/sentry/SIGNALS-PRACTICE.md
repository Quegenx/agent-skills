# Signal practice: Replay, Logs, Metrics, Crons, Feedback, Profiling

Cross-platform practice for Session Replay, Logs, Application Metrics, Crons, User Feedback and Profiling: what each records, how it is sampled, how to keep it private and how to query it. Which signal answers which question is [SIGNALS.md](SIGNALS.md) and [INSTRUMENTATION.md](INSTRUMENTATION.md); sampling across signals is [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md); the init lines per framework are in the platform files ([BROWSER-TRACING.md](BROWSER-TRACING.md), [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md), [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md), [NODE.md](NODE.md), [NODE-TRACING.md](NODE-TRACING.md), [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md), [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md)). What decides most outcomes: each signal is switched on and sampled on its own terms. Replay is sampled at init by two rates, logs and metrics are not sampled at all (you filter them in `beforeSendLog` and `beforeSendMetric`), crons only alert on what their check-ins report, and profiling only runs where the runtime supports it.

**Contents:** [Session Replay](BROWSER-REPLAY-AND-PROFILING.md#session-replay) · [Replay privacy](BROWSER-REPLAY-AND-PROFILING.md#replay-privacy) · [Replay manual control](BROWSER-REPLAY-AND-PROFILING.md#replay-manual-control) · [Logs](#logs) · [What to log](#what-to-log) · [Application Metrics](#application-metrics) · [Crons](#crons) · [User Feedback](#user-feedback) · [Profiling](#profiling) · [Prove it](#prove-it)

## Session Replay

Use the shared session replay guidance in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md#session-replay). [getsentry/sentry-for-ai, SDK references]

## Replay privacy

Use the shared replay privacy guidance in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md#replay-privacy). [getsentry/sentry-for-ai, SDK references]

## Replay manual control

Use the shared replay manual control guidance in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md#replay-manual-control). [getsentry/sentry-for-ai, SDK references]

## Logs

[getsentry/sentry-for-ai, shared Logs reference and sentry-node-sdk]

The retained server init example uses the SDK 10 contract. SDK 11 removes enableLogs; [UPGRADE.md](UPGRADE.md#v10-to-v11) records that boundary. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#logs-and-metrics]

Use [structured logging](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/LOGGING.md) for generic event design, accumulated context, levels and privacy; the Sentry APIs, logger integrations and SDK-specific attributes stay here. [existing observability, LOGGING.md; getsentry/sentry-for-ai, shared Logs reference]

- **Versions (JS):** supported from SDK `9.41.0`, on by default from `10.71.0`; below that set `enableLogs: true`. CDN and Loader need a logs bundle, for example `bundle.logs.metrics.min.js`. Logs are high-cardinality: any attributes, all searchable.
- **API:** `Sentry.logger.trace|debug|info|warn|error|fatal(message, attributes)`; the message is required. Levels: trace (fine-grained debugging), debug (development diagnostics), info (normal operations, milestones), warn (potential issues), error (failures needing attention), fatal (critical, system down). Prefer a real error event for exceptions that should become Issues.
- **Templates:** `Sentry.logger.fmt` as a template literal extracts `message.template` (for example "%s added %s to cart.") and `message.parameter.0..N`.
- **Shared attributes** (since `v10.61.0`): `Sentry.setAttribute` / `Sentry.setAttributes` apply to all logs and metrics (string, number, boolean or arrays); also `Sentry.getGlobalScope().setAttributes({...})`, and per operation `Sentry.withScope((scope) => { scope.setAttribute("request_id", req.id); ... })`.
- **Existing loggers:** `consoleLoggingIntegration({ levels: ["log", "warn", "error"] })` turns console calls into logs (several arguments become `message.parameter.N`, SDK `10.13.0`+); Consola: `Sentry.createConsolaReporter()` (SDK `10.12.0`+). For Pino or console, use the Sentry integration if one exists, else the SDK directly.
- **Filter in `beforeSendLog`.** The log object has `level`, `message`, `timestamp`, `attributes`; return `null` to drop (for example `debug` logs) and delete fields such as `log.attributes.password`. Production practice: WARNING and above. Inbound filters for logs exist for Log Message (for example `*Connection timeout*`) and Releases. "Stop sending 'Info' logs for every routine event." LogTape (`@logtape/logtape`, `@logtape/sentry` `getSentrySink()`, `lowestLevel`, filters such as `(isHighSignal(rec) || sampleRate(rec)) && noDev(rec)` with 5% sampling) filters at the source.
- **Linking:** logs during an active span carry `sentry.trace.parent_span_id`, and with replay active `sentry.replay_id`. Default attributes: `sentry.environment`, `sentry.release`, `sentry.sdk.name`, `sentry.sdk.version`, `browser.name`, `browser.version`, `user.id`, `user.name`, `user.email` (if set on the scope), `sentry.origin` (integration-generated). "Sentry automatically attaches a Trace ID to log messages."
- **Wide events over scattered logs:** "emit one comprehensive log per operation with all relevant context".

```javascript
// One wide event with full context
Sentry.logger.info("Checkout completed", {
  order_id: order.id,
  user_id: user.id,
  user_tier: user.subscription,
  cart_value: cart.total,
  item_count: cart.items.length,
  payment_method: "stripe",
  duration_ms: Date.now() - startTime,
});
```

- **Business context belongs on the log:** user tier, account age, lifetime value, order value and item count, active feature flags, endpoint, method, duration.
- **Naming:** "Use `snake_case` for custom attributes", consistently. The logging workflow also suggests namespacing (`myapp.<domain>.<field>`) agreed once across services, with the same names on both sides of `baggage` / `sentry-trace` propagation.
- **Querying:** the query window is Developer 7 days, Team 14, Business 30. Raw text search is case sensitive and only over the message. Examples: `severity:error`, `severity:error payment.failed`, `user.id:12345`, `trace_id:abc123def456`, `severity:error environment:production`, `severity:warn OR severity:error`, `database:"users" query.duration_ms:>1000`, `message://^Timeout after \d+ms//` (regex, logs only). Auto-refresh turns off above 100 logs/second, runs at most 10 minutes and only on time-descending relative ranges. Export up to 10,000 lines as CSV or JSONL. Visualize `count(logs)` with Group By and the Aggregates tab; at high volume charts are extrapolated from samples ("Continue Scanning"). Logs feed alerts and dashboard widgets; log drains cover platforms without an SDK. AI analysis of logs: Sentry CLI logs, the Sentry MCP Server, Seer.

### JavaScript logger source qualifiers

[getsentry/sentry-for-ai, sentry-react-sdk, sentry-browser-sdk and sentry-node-sdk logging references]

```typescript
Sentry.logger.info(
  Sentry.logger.fmt`User ${userId} purchased ${productName} for $${amount}`
);
```

- fmt is an alias for Sentry.parameterize and a tagged template; calling fmt as an ordinary function creates no parameter attributes. The source tables describe scalar-only attributes in older versions; SDK 11 accepts primitive arrays too, as its migration guide specifies.
- Browser/React source tables list scope attributes since 10.32.0; the shared source lists the newer top-level setters since 10.61.0. Source-specific default SDK names and browser/server attributes remain runtime-specific.
- The React source says npm only; Browser/shared sources also list the logs CDN bundle. These are source alternatives: verify the selected bundle instead of treating the npm-only troubleshooting line as universal. The Loader has no logger API.
- Source level preferences conflict: the shared quota practice keeps WARNING and above, while the browser/React references keep low-volume info with warn/error/fatal and drop trace/debug. Choose deliberately and preserve the existing application policy.
- Node logger signature adds an optional scope argument, and structured levels have severity numbers 1/5/9/13/17/21. These wire levels are not incident severity P0-P3.

### Server logger details

Node-specific source signature: `info(message: ParameterizedString, attributes?: Record<string, unknown>, options?: { scope?: Scope }): void`. Its hook reference includes severityNumber alongside level/message/attributes; other references list timestamp. Use the installed Log type rather than inventing one common serialized shape. [getsentry/sentry-for-ai, sentry-node-sdk]

```typescript
Sentry.logger.info(
  Sentry.logger.fmt`Order ${orderId} placed by ${userId}`,
  { total: 149.99, itemCount: 3, region: "us-west-2" },
);
```

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableLogs: true,
  beforeSendLog: (log) => {
    // Drop debug logs in production
    if (process.env.NODE_ENV === "production" && log.level === "debug") {
      return null;
    }

    // Scrub sensitive fields
    if (log.attributes?.credit_card) {
      log.attributes.credit_card = "[REDACTED]";
    }

    // Add computed attributes
    log.attributes = {
      ...log.attributes,
      processed_at: Date.now(),
    };

    return log;
  },
});
```

- Serverless handlers flush before returning. Supported Node logger integrations in the current source are Pino 10.18.0+, Winston 9.13.0+ and Consola 10.12.0+; do not extend that support claim to Bunyan or Morgan. Console default levels include debug/info/warn/error/log/trace/assert; Consola uses createConsolaReporter. [getsentry/sentry-for-ai, sentry-node-sdk; https://docs.sentry.io/platforms/javascript/guides/node/logs/]

## What to log

- **Inventory first in a multi-app repo:** one row per app (`| App | Path | Language | Sentry SDK? | Logging abstraction | Status |`, status `not started`, `configured`, `instrumented`, `verified`), confirm scope if there are more than about 2 apps, agree conventions once (namespacing, event-name phrasing, levels), then reconcile against the inventory so "partial coverage is never mistaken for full coverage". If the toolchain can't verify emission, "say so explicitly".
- **Justify each log in one sentence:** "This log is valuable because it helps answer <specific question>." Check: production question, useful if emitted hundreds or thousands of times, better as a trace, metric or error, already covered, structured, safe (no PII, secrets, raw payloads, unstable exception messages), actionable.
- **Keep:** runtime decisions (feature flag path, mobile redirect, paid vs free); key stages and a summary of a multi-step feature or algorithm; audit and access events (create, update, delete, view, permission changes; not every DB operation); context around recoverable failures (non-critical upstream failures, failures in a retry loop before the final attempt), with retry count, response status code, non-sensitive request and response fields and the decisions that led there.
- **Remove:** logs confirming routine UI interactions, duplicating generic API failures, or recording expected validation failures without context. Don't log every line or function call (use tracing or profiling). Check whether the failure is already an uncaught exception captured as an error.
- **Structure:** a good log answers who, what, when; accumulate context as a request evolves; log the relevant fields with dot notation, not whole objects; omit absent optional attributes instead of empty strings, `null` or placeholders.

```js
Sentry.logger.info("Aurora import started", {
  "import.source": "aurora",
  "import.entries_received": body.ascents.length,
});

// Algorithm runs here...

Sentry.logger.info("Aurora import finished", {
  "import.source": "aurora",
  "import.entries_received": body.ascents.length,
  "import.imported": imported,
  "import.climbs_created": climbsCreated,
  "import.skipped": skipped,
  "import.skipped.missing_name": skipDetails.missingName,
  "import.skipped.unknown_grade": skipDetails.unknownGrade,
  "import.skipped.invalid_angle": skipDetails.invalidAngle,
  "import.skipped.already_imported": skipDetails.alreadyImported,
});
```

- **Users and secrets:** "Strongly prefer using the SDK's setUser functionality to associate logs with the authenticated user, rather than repeating user identifiers as log attributes", and prefer opaque user IDs over email, username or full names, in `setUser` too. Never log passwords, access tokens or API keys, or regulated data (age, gender, postal code); mind PCI, GDPR, CCPA, HIPAA. Large blobs (LLM prompts, webhook bodies) have uses but costs and risks; prefer specific queryable fields.
- **Aim to demonstrate, not to maximize coverage:** in a small codebase, enough representative logs to serve as a model; in a large one, a few representative locations.

## Application Metrics

[getsentry/sentry-for-ai, sentry-node-sdk and shared Application Metrics reference]

The API examples below retain the SDK 10 source contract; SDK 11 removes enableMetrics. Use the current [migration boundary](UPGRADE.md#v10-to-v11). [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#logs-and-metrics]

- **On by default** (`enableMetrics: false` disables it); no init flag needed. Metrics are buffered (max 1000, `MAX_METRIC_BUFFER_SIZE = 1000`) and sent periodically (the NestJS reference: not suitable for sub-second alerting).
- The Next.js SDK 10 source has no increment or set API: increment became count, while set was removed without an equivalent. [getsentry/sentry-for-ai, sentry-nextjs-sdk]
- **API:** `Sentry.metrics.count(name, value?, options?)` (value defaults to 1), `gauge(name, value, options?)`, `distribution(name, value, options?)`, with `MetricOptions { unit?, attributes?, scope? }`.

| Method | Underlying type | Use for |
|---|---|---|
| `count` | counter | Event frequency: requests, errors, signups |
| `gauge` | gauge | Current snapshot value: queue depth, CPU % |
| `distribution` | distribution | Value histograms and ranges: latencies, file sizes |

The NestJS reference adds that distributions support p50/p90/p95/p99 while gauges give min, max, avg, sum and count with no percentiles, so use a distribution when you need percentiles.

```typescript
// count: how many times something happened
Sentry.metrics.count("user.signups", 1);
Sentry.metrics.count("api.errors", 1, { attributes: { endpoint: "/checkout" } });

// gauge: what the current state is
Sentry.metrics.gauge("queue.depth", 42);
Sentry.metrics.gauge("memory.usage", 512, { unit: "megabyte" });

// distribution: spread of a measured value
Sentry.metrics.distribution("api.latency", 187.5, { unit: "millisecond" });
Sentry.metrics.distribution("payload.size", 1024, { unit: "byte" });
```

- **Units:** time `millisecond`, `second`, `minute`, `hour`, `day`, `week`; storage `bit`, `byte`, `kilobyte`, `megabyte`, `gigabyte`, `terabyte`, `petabyte`; fractions `ratio`, `percent`; `none` (or omit `unit`). The NestJS reference lists `nanosecond` and `microsecond` too and no `petabyte`. Confirm in the current docs.
- **Keep cardinality low:** high-cardinality attributes (per-user IDs, request UUIDs) degrade backend performance; keep attributes to bounded enums and sets, and put per-user and per-request data in logs. The NestJS reference adds: no timestamps as attributes, and prefix names with the service (`"payments.charge_time"`, not `"charge_time"`). Each metric envelope is limited to 2 KB; bigger metrics are dropped.
- **`beforeSendMetric(metric)`** returns `null` to drop or the metric with changes. The Node reference gives the shape `{ name, value, type, unit?, attributes? }`; the NestJS reference adds `type` values `"counter"`, `"gauge"`, `"distribution"` and fields `timestamp` (epoch seconds), `traceId`, `spanId`.

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSendMetric: (metric) => {
    // metric: { name, value, type, unit?, attributes? }

    // Drop internal debug metrics
    if (metric.name.startsWith("_internal.")) {
      return null;
    }

    // Normalize metric names
    metric.name = metric.name.toLowerCase().replace(/[^a-z0-9_.]/g, "_");

    // Add global context
    metric.attributes = {
      ...metric.attributes,
      host: process.env.HOSTNAME,
      deploy_id: process.env.DEPLOY_ID,
    };

    return metric;
  },
});
```

- **Scope attributes (>=10.33.0):** `Sentry.getGlobalScope().setAttributes({...})` or `scope.setAttribute(...)` inside `withScope`; metrics emitted in that scope inherit them.

- **Automatic attributes:** `sentry.environment`, `sentry.release`, `sentry.sdk.name`, `sentry.sdk.version`, `user.id`, `user.name`, `user.email`, `server.address`.

```javascript
// Count occurrences
Sentry.metrics.count("orders_created", 1);

// Track current values
Sentry.metrics.gauge("active_connections", 42);

// Track distributions
Sentry.metrics.distribution("api_latency", 187, {
  unit: "millisecond",
});
```

### Product and query details

[getsentry/sentry-for-ai, shared metrics reference; https://docs.sentry.io/platforms/javascript/configuration/options/; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

- **JS SDK `10.25.0`+.** CDN builds need a metrics bundle (for example `bundle.logs.metrics.min.js`); elsewhere `Sentry.metrics.*` is a no-op with a warning under `debug`.
- **No on/off option in v11:** metrics are captured only when called. Drop them with `beforeSendMetric: () => null`; below `11.0.0` use `enableMetrics: false`. `await Sentry.flush()` sends pending metrics.
- **Default attributes:** `sentry.environment`, `sentry.release`, `sentry.sdk.name`, `sentry.sdk.version`, `user.*`, `browser.*`, `sentry.replay_id` (client), `server.address` (server). Element timing and bfcache metrics come from integrations.
- **Every metric event is trace-connected.** "Application Metrics are typically sampled at 100% while traces are usually sampled at a much lower rate"; use attributes and Cross-Event Querying to find a comparable trace. Use metrics for code-based health signals, Logs for log aggregation and Traces for request tracing.
- **Naming:** the product examples use dotted names (`email.sent`, `checkout.failed`, `queue.depth`, `cart.amount_usd`, `query.duration_ms`).
- **Aggregations:** counters `sum`, `per_second`, `per_minute`; gauges `min`, `max`, `avg`, `per_second`, `per_minute`; distributions `p50`, `p75`, `p90`, `p95`, `p99`, `avg`, `sum`, `min`, `max`, `count`, `per_second`, `per_minute`. The Explorer takes up to 26 queries (A, B, C...) and equations like `A / B` (Apdex: `(A + (B / 2)) / C`); Save As offers Monitor, Dashboard widget or New Query.

## Crons

- **Node SDK `7.51.1`+.** Sentry creates the monitor on the first check-in if it carries a config; otherwise create it in the UI. Cron monitoring works in Next.js only in the Server and Edge runtimes. Flutter/Dart has no crons ([FLUTTER.md](FLUTTER.md)).
- **Instrument the scheduler library:** `Sentry.cron.instrumentCron(CronJob, "my-cron-job")` (`cron`, SDK `7.92.0`+); `Sentry.cron.instrumentNodeCron(cron)` then `.schedule("* * * * *", fn, { name: "my-cron-job" })` (`node-cron`, `7.92.0`+); `Sentry.cron.instrumentNodeSchedule(schedule)` then `.scheduleJob("my-cron-job", "* * * * *", fn)` (`node-schedule`, `7.93.0`+, cron strings only).
- **Or wrap the job:** `Sentry.withMonitor("<monitor-slug>", () => {...}, { schedule: { type: "crontab", value: "0 * * * *" } })` (SDK `7.76.0`+) detects missed runs, runtime failures and max-runtime overruns; it "does not create new a trace".
- **Or send check-ins by hand:** `const checkInId = Sentry.captureCheckIn({ monitorSlug: "<monitor-slug>", status: "in_progress" });` then `Sentry.captureCheckIn({ checkInId, monitorSlug, status: "ok" })` or `status: "error"`. A heartbeat (a single `ok` or `error` check-in) only detects missed runs, not runtime overruns.

| Monitor config | Value |
|---|---|
| `schedule` | `{"type": "crontab", "value": "0 * * * *"}` or `{"type": "interval", "value": 2, "unit": "hour"}` |
| `checkinMargin` | Minutes of grace; "We recommend that your check-in margin be less than or equal to your interval" |
| `maxRuntime` | Minutes, max 10080 (7 days) |
| `timezone` | IANA (`America/Los_Angeles`); convert luxon zones for node-cron, for example `DateTime.local().zoneName` |
| `failureIssueThreshold`, `recoveryThreshold` | SDK `8.7.0`+ |

- **Pass the config** as the third argument to `withMonitor` or the second to `captureCheckIn`.
- **Vercel Cron Jobs:** automatic check-ins with `_experimental.vercelCronsMonitoring: true` in the Sentry settings of `next.config.js` (reads `crons` in `vercel.json`); the older `webpack.automaticVercelMonitors` works only with Webpack and the Pages Router.
- **Alerts:** missed and failed check-ins create error events tagged with the monitor; filter with `The event's tags match monitor.slug equals my-monitor-slug-here`. Rate limit: 6 check-ins per minute per monitor environment.
- **Other paths:** the Sentry CLI or HTTP. All plans include one cron monitor and one uptime monitor; deactivated or deleted monitors free quota within the same billing period.

## User Feedback

- **Three mechanisms:** the widget (browser SDKs and the Loader), the Crash-Report Modal (JavaScript, PHP), and the API (Android, Apple, Dart, Flutter, Node.js, React Native and others; otherwise the Web API). Flutter's form is in [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md#user-feedback).
- **The widget needs SDK `7.85.0`+** (v8+ config; the v7 beta widget is deprecated), browsers with Shadow DOM and `<dialog>`, and self-hosted 24.4.2+. `Sentry.feedbackIntegration({ colorScheme: "system" })` inserts it bottom right.
- **Screenshots** (SDK 8.0.0+, `enableScreenshot` default `true`, hidden on mobile) use the attachments quota (1GB is about 2500 screenshots).
- **Replay context:** with Replay and `replaysOnErrorSampleRate > 0`, Replay buffers up to 30 seconds until the widget opens; the submitted feedback can carry up to 60 seconds of replay before submit, plus the URL and tags.
- **API:** `Sentry.captureFeedback({ name, email, message })` (only `message` is required), optional `associatedEventId`; a second hint argument takes `captureContext`, `attachments`, `includeReplay`.
- **Crash-Report modal:** `Sentry.showReportDialog({ eventId: event.event_id })`, for example in `beforeSend` when `event.exception`; in React use the error-handling component. Loader: `Sentry.lazyLoadIntegration("feedbackIntegration")`.
- **Own trigger:** `autoInject: false`, then `Sentry.getFeedback()` and `feedback.createWidget()`, `attachTo(element, opts)`, or `await feedback.createForm()` + `form.appendToDom()` + `form.open()`.

| Config | Default |
|---|---|
| `autoInject` | `true` |
| `showBranding` | `true` |
| `colorScheme` | `"system"` |
| `id` | `sentry-feedback` |
| `showName` / `showEmail` | `true` / `true` |
| `isNameRequired` / `isEmailRequired` | `false` / `false` |
| `enableScreenshot` | `true` |
| `useSentryUser` | `{ email: 'email', name: 'username'}` (from `Sentry.setUser`) |
| `triggerLabel` / `submitButtonLabel` | "Report a Bug" / "Send Bug Report" |

- **Theme** with `#sentry-feedback` CSS variables (they take priority) or `themeLight` / `themeDark`. Callbacks: `onFormOpen`, `onFormClose`, `onSubmitSuccess(data, eventID)` (v9 and below only `data`), `onSubmitError`. Link: `https://${orgSlug}.sentry.io/issues/feedback/?projectSlug=${projectSlug}&eventId=${eventId}`.
- **Bundle choice:** npm `feedbackIntegration` is `feedbackSyncIntegration` (largest bundle, guaranteed to open); the CDN alias is `feedbackAsyncIntegration`, which loads the form from `https://browser.sentry-cdn.com` on click and can fail with ad blockers.
- **Routing:** feedback gets AI summaries, categories and spam detection (Generative AI Features on; spam bypasses feedback alerts; opt out via "Enable Spam Detection"). Alert with the Alert Builder `IF Issue Category is equal to Feedback`; "Enable Crash Report Notifications" covers crash-report feedback; the same filter automates GitHub or Jira issues. Search, for example, `url:*/payments/*`.

## Profiling

- **Continuous (backend) and UI (frontend) profiling replace transaction-based profiling,** which capped profiles at 30 seconds. Continuous: start at service start, stop at termination, and constrain by profiling for example 10% of instances or around critical code. UI: profile full user sessions, constrained by for example 10% of sessions. Sampling is per session. The manual lifecycle is the default; the trace lifecycle requires tracing and span instrumentation.
- **What you get:** function-level data with no extra instrumentation; the Profiling page shows the slowest and regressed or improved functions. The Transactions tab needs tracing, the Aggregate Flamegraph doesn't; from Trace View use a span's "Profile" section or the Profiles tab.
Use the [browser profiling owner](BROWSER-REPLAY-AND-PROFILING.md#profiling) for headers, browser support, lifecycles and browser source variants. [getsentry/sentry-for-ai, shared profiling reference]

- **Node:** `npm install @sentry/profiling-node --save`, version exactly matching the main SDK; `nodeProfilingIntegration()`; `profileSessionSampleRate` (evaluated once at init, so per service instance) and `profileLifecycle: 'trace' | 'manual'` (mutually exclusive); manual API `Sentry.profiler.startProfiler()`. It uses a V8 CpuProfiler native add-on, so it won't run on Deno or Bun. Env flags: `SENTRY_PROFILER_BINARY_PATH`, `SENTRY_PROFILER_BINARY_DIR`, `SENTRY_PROFILER_LOGGING_MODE=eager|lazy` (lazy makes `startProfiler` slow, a few hundred ms). Prebuilt binaries: macOS x64, Linux ARM64 (musl), Linux x64 (glibc), Windows x64, for Node v18, v20, v22, v24. "If you're adopting Profiling in a high-throughput environment, we recommend testing prior to deployment". Setup per runtime: [NODE-TRACING.md](NODE-TRACING.md).

## Prove it

- **Replay records and masks:** with `replaysSessionSampleRate: 1.0` in a test build, a session appears in Replays; every text node, input and image is masked or blocked, and only URLs in `networkDetailAllowUrls` show bodies. On an error with the session rate `0` and the error rate `1.0`, the replay holds the 60 seconds before the error.
- **Logs arrive and link:** a log fired on a real code path appears in Logs with its attributes, carries the `trace_id` of the active span, and `beforeSendLog` drops what it should (for example `debug`).
- **Metrics arrive:** `Sentry.metrics.count(...)` after `await Sentry.flush()` shows in the Metrics explorer, sliceable by its attributes, and each stays under 2KB.
- **Crons alert:** run the job so its `in_progress` and `ok` check-ins show on the monitor; a job that throws produces an `error` check-in and an error event tagged `monitor.slug`.
- **Feedback links:** a widget submission shows under User Feedback with its URL, screenshot and replay, and a `captureFeedback` with `associatedEventId` links to that issue.
- **Profiling runs:** a browser response carries `Document-Policy: js-profiling` and a Chrome session shows a profile on its trace; a Node service shows continuous profiles for its sampled instances.
