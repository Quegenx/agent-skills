# Signal practice: Replay, Logs, Metrics, Crons, Feedback, Profiling

Cross-platform practice for Session Replay, Logs, Application Metrics, Crons, User Feedback and Profiling: what each records, how it is sampled, how to keep it private and how to query it. Which signal answers which question is [SIGNALS.md](SIGNALS.md) and [INSTRUMENTATION.md](INSTRUMENTATION.md); sampling across signals is [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md); the init lines per framework are in the platform files ([BROWSER-TRACING-REPLAY-LOGS.md](BROWSER-TRACING-REPLAY-LOGS.md), [REACT-REPLAY-LOGS-PROFILING.md](REACT-REPLAY-LOGS-PROFILING.md), [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md), [NODE.md](NODE.md), [NODE-TRACING.md](NODE-TRACING.md), [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md), [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md)). What decides most outcomes: each signal is switched on and sampled on its own terms. Replay is sampled at init by two rates, logs and metrics are not sampled at all (you filter them in `beforeSendLog` and `beforeSendMetric`), crons only alert on what their check-ins report, and profiling only runs where the runtime supports it.

**Contents:** [Session Replay](#session-replay) · [Replay privacy](#replay-privacy) · [Replay manual control](#replay-manual-control) · [Logs](#logs) · [What to log](#what-to-log) · [Application Metrics](#application-metrics) · [Crons](#crons) · [User Feedback](#user-feedback) · [Profiling](#profiling) · [Prove it](#prove-it)

## Session Replay

- **Web replay is not video.** It is built with rrweb from DOM snapshots, so the player lets you inspect the DOM. Mobile replay takes a view-hierarchy snapshot plus a screenshot once per second, compressed into video segments, and redaction draws blocks in the control's predominant color.
- **The default SDK masks all DOM text, images and user input.** The replay integration ships in the browser and framework npm packages (minimum SDK `7.27.0`; Node 12+; browsers newer than IE11). CDN bundles: `https://browser.sentry-cdn.com/11.8.0/bundle.tracing.replay.min.js` (recommended for replay, errors and tracing) or `bundle.replay.min.js`.

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});
```

- **Both rates default to `0`** in the options table; the Loader Script enables Replay with `replaysSessionSampleRate: 0.1` and `replaysOnErrorSampleRate: 1`. The recommended default `0.1` / `1.0` "captures 10% of sessions in full, plus every error from the remaining 90%".
- **Keep `replaysOnErrorSampleRate` at `1.0`:** "error sessions provide the most debugging value." Test with `replaysSessionSampleRate: 1.0`, then lower it.
- **The session rate recommendation disagrees across sources:** SDK pages say `0.1`; the setup page's traffic table says High (100k+ sessions/day) `0.01`, Medium (10k to 100k) `0.1`, Low (under 10k) `0.25`, all with error rate `1.0`; the sampling blog uses `0.01` ("a typical Sentry plan comes with 5 million spans, we start with 50 Session Replays"); the replay concept says "a few percent".
- **Sampling order:** the session rate is checked first. Sampled sessions are sent in real time; the rest are buffered in memory (the last 60 seconds, a ring buffer of about 2 to 5 MB of DOM event logs). On an error the error rate is checked: sampled sends the buffer plus the rest of the session, otherwise the buffer is discarded.
- **When a web session ends:** after inactivity (only clicks and navigation count; scrolls, mouse moves and keys don't), on tab close, at the 60-minute maximum, or on `replay.stop()`. The inactivity timeout disagrees: the setup page says 5 minutes; the understanding-sessions page and the product page say 15. Replay sessions can span several page loads (unlike release-health sessions).
- **When a mobile session ends:** on app close, a crash, more than 30 seconds in the background, or 60 minutes; User Feedback attaches up to 30 seconds of mobile replay. Minimum SDKs: iOS 8.43.0, Android 7.20.0, React Native 6.5.0, Flutter 8.12.0 (the Flutter SDK page says at least 9.0.0; see [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md#session-replay)).
- **Replays for backend errors** need Sentry on the frontend and backend with distributed tracing and `tracePropagationTargets` set; minimum JavaScript 7.51.0, Node 7.48.0.
- **Errors and traces link to replays,** and logs emitted during a replay are linked. The error count on Replay Details may not match (rate-limited, deleted or network errors). AI replay summaries need "Show Generative AI Features".
- **No `replaysSampler` exists.** For per-page replay, set `replaysSessionSampleRate: 0` and use a `useSessionReplay` React hook (Next.js `"use client"`) that decides at random, sets tags and calls `replay.stop(); replay.start();` on mount, then `replay.stop(); replay.startBuffering();` on unmount so error replays keep working. It starts after mount, so it can miss early hydration issues.
- **Lazy-load:** init with `integrations: []`, then `import("@sentry/browser").then((lazyLoadedSentry) => { Sentry.addIntegration(lazyLoadedSentry.replayIntegration()); });`.
- **Canvas is opt-in** with `Sentry.replayCanvasIntegration()`, and "There is currently no PII scrubbing in canvas recordings!" WebGL: `enableManualSnapshot: true` and call `snapshot()` in the paint loop. WebGPU: `snapshot(canvasRef, { skipRequestAnimationFrame: true })`.
- **CSP:** allow `worker-src 'self' blob:` and `child-src 'self' blob:` (Safari 15.4 and older), or self-host the compression worker: `workerUrl: "/assets/worker.min.js"` plus the bundler plugin's `bundleSizeOptimizations: { excludeReplayWorker: true }` (plugins 2.10.0+), and keep that worker updated.

| `replayIntegration` option | Default |
|---|---|
| `stickySession` | `true` |
| `mutationLimit` / `mutationBreadcrumbLimit` | `10000` / `750` |
| `minReplayDuration` | `5000` ms (max 15000; session sampling only) |
| `maxReplayDuration` | `3600000` (1 hour max) |
| `networkDetailAllowUrls` / `networkDetailDenyUrls` | `[]` / `[]` (deny takes precedence) |
| `networkCaptureBodies` | `true` |
| `networkRequestHeaders` / `networkResponseHeaders` | `[]` |
| `beforeAddRecordingEvent` | since 7.53.0 |
| `beforeErrorSampling` | buffer mode only |
| `slowClickIgnoreSelectors`, `workerUrl` | none |

- **Network details are off by default:** only URL, body sizes, method and status code. Opt in per URL with `networkDetailAllowUrls: [window.location.origin]` (SDK 7.50.0+) to get bodies plus `Content-Type`, `Content-Length` and `Accept`; add headers with `networkRequestHeaders: ["Cache-Control"]` and `networkResponseHeaders: ["Referrer-Policy"]`. Bodies are truncated to 150k characters and PII-sanitized server-side, but "the best way to avoid getting PII into Sentry is by not adding URLs of endpoints that may contain PII."
- **Identify the user:** `Sentry.setUser({ email: "jane.doe@example.com" });`.

## Replay privacy

- **Verify masking before production.** "Before enabling Session Replay in production, verify your masking configuration"; after changing settings or upgrading UI frameworks or SDKs "you must thoroughly test your application". If masking fails, open a GitHub issue "and avoid deploying to production with Session Replay enabled until the issue is resolved." The same warning applies to mobile.
- **Defaults:** all text masked with `*`; media blocked (`img`, `svg`, `video`, `object`, `picture`, `embed`, `map`, `audio`). Markers: `sentry-mask` / `data-sentry-mask`, `sentry-block` / `data-sentry-block` (a same-size placeholder), `sentry-ignore` / `data-sentry-ignore` (inputs only).

| Option | Default |
|---|---|
| `mask` | `['.sentry-mask', '[data-sentry-mask]']` (additive) |
| `maskAllText` / `maskAllInputs` | `true` / `true` |
| `block` | `['.sentry-block', '[data-sentry-block]']` (additive) |
| `blockAllMedia` | `true` |
| `ignore` | `['.sentry-ignore', '[data-sentry-ignore]']` |
| `maskFn` | `(s) => '*'.repeat(s.length)` |
| `unblock` | `[]` (beats all blocking; doesn't affect `password` elements) |
| `unmask` | `[]` |

- **Since v8, `unblock` and `unmask` add no default selectors.** To use `sentry-unmask`, set `unmask: [".sentry-unmask", "[data-sentry-unmask]"]` (and `unblock: [".sentry-unblock", "[data-sentry-unblock]"]`).
- **`block` always includes `base` and `iframe[srcdoc]:not([src])`;** re-enable with `unblock: ['iframe[srcdoc]']` only if unmasked recording is acceptable.
- **Turn masking off only for static sites without sensitive data:** `maskAllText: false, blockAllMedia: false`.
- **Bake privacy into shared primitives** (the i18n layer, design-system components, avatars). The i18n pattern, "the same pattern Sentry uses in its own web app": record strings returned by `t()` without interpolation in a `staticStrings` Set, and use a custom `maskFn` that unmasks only catalog text. Shared React components `SensitiveText` (`data-sentry-mask`) and `StaticCopy` (`data-sentry-unmask`); a `withReplayMask` HOC wrapping in a `div` (not a `span`, to avoid invalid HTML and SSR hydration mismatches). Block avatar components that use a CSS `background-image` with `data-sentry-block`, letter avatars too. Consider a lint rule or snapshot test that fails when a component rendering user-identifying data ships without a marker.
- **Scrub recording events** with `beforeAddRecordingEvent` (return `null` to drop). Keeping only fetch/xhr with status 500:

```javascript
Sentry.replayIntegration({
  beforeAddRecordingEvent: (event) => {
    // Do not capture fetch/xhr requests, unless the response code is 500
    if (
      event.data.tag === "performanceSpan" &&
      (event.data.payload.op === "resource.fetch" ||
        event.data.payload.op === "resource.xhr") &&
      event.data.payload.data.statusCode !== 500
    ) {
      return null;
    }

    return event;
  },
});
```

- **URLs are stored** in recording and replay events; scrub replay-event URLs with `Sentry.addEventProcessor`, checking `event.type !== "replay_event"` and mapping `event.urls`.
- **Mobile masks by widget or view type;** the Flutter rules are in [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md#masking), React Native's in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md).

## Replay manual control

- **Both rates `0`** means installed but inactive. `Sentry.getReplay()` returns the instance: `replay.start()` (session mode), `replay.startBuffering()` (buffer mode), `await replay.stop()`, `await replay.flush()`, `replay.getReplayId()`.
- **Consent withdrawn:** `await replay.stop({ flush: false })` (since `v10.67.0`); it doesn't retract segments already sent.
- **Deferred init:** set `client.getOptions().replaysSessionSampleRate` and the error rate, then `client.addIntegration(replay)`.
- **Lifecycle events** (since `v10.50.0`): `client.on("replayStart", ({ sessionId, recordingMode }) => ...)` and `client.on("replayEnd", ({ sessionId, reason }) => ...)`, reasons `manual`, `sessionExpired`, `sendError`, `mutationLimit`, `eventBufferError`, `eventBufferOverflow`.
- **Custom sampling:** flush for employees; use the Navigation API (`navigation.addEventListener("navigate", ...)`) to `replay.start()` on `/buggy-page/`; drop some errors with `beforeErrorSampling: (event) => !event.exception?.values?.[0]?.value?.includes("drop me")`; in a support widget, `replay.flush()` then attach `replay.getReplayId()`. Replay URL: `https://<org-slug>.sentry.io/replays/<replay-id>/`.

## Logs

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

- **JS SDK `10.25.0`+.** CDN builds need a metrics bundle (for example `bundle.logs.metrics.min.js`); elsewhere `Sentry.metrics.*` is a no-op with a warning under `debug`.

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

- **Attributes** go in `{ attributes: { endpoint: "/api/orders", user_tier: "pro", ... } }`. Each metric has a **2KB size limit** and is dropped if it exceeds it. Units: `millisecond`, `second`, `byte`, `kilobyte`, `megabyte`.
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
- **Browser profiling is beta** and uses the JS Self-Profiling API (Chromium only: Chrome, Edge), so profiles are biased to Chrome users. It needs `@sentry/browser` `10.27.0`+ (or `7.60.0`+ for the deprecated transaction-based mode), and the server must send `Document-Policy: js-profiling` (in `vercel.json` headers, Netlify `netlify.toml` / `_headers`, Express `res.set("Document-Policy", "js-profiling")`, Nginx `add_header`, Apache, a CloudFront function). Without that header browser profiling isn't available.

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  profileSessionSampleRate: 1.0,
});
```

- **Browser modes:** manual (default) `Sentry.uiProfiler.startProfiler();` / `Sentry.uiProfiler.stopProfiler();`; trace mode `profileLifecycle: "trace"`. The options page names the manual APIs `startProfiler()` / `stopProfiler()` instead. Sentry samples at 100Hz (10ms) vs DevTools' 1000Hz, and Chrome DevTools shows "Profiling Overhead" with the integration on, so disable it locally.
- **Node:** `npm install @sentry/profiling-node --save`, version exactly matching the main SDK; `nodeProfilingIntegration()`; `profileSessionSampleRate` (evaluated once at init, so per service instance) and `profileLifecycle: 'trace' | 'manual'` (mutually exclusive); manual API `Sentry.profiler.startProfiler()`. It uses a V8 CpuProfiler native add-on, so it won't run on Deno or Bun. Env flags: `SENTRY_PROFILER_BINARY_PATH`, `SENTRY_PROFILER_BINARY_DIR`, `SENTRY_PROFILER_LOGGING_MODE=eager|lazy` (lazy makes `startProfiler` slow, a few hundred ms). Prebuilt binaries: macOS x64, Linux ARM64 (musl), Linux x64 (glibc), Windows x64, for Node v18, v20, v22, v24. "If you're adopting Profiling in a high-throughput environment, we recommend testing prior to deployment". Setup per runtime: [NODE-TRACING.md](NODE-TRACING.md).

## Prove it

- **Replay records and masks:** with `replaysSessionSampleRate: 1.0` in a test build, a session appears in Replays; every text node, input and image is masked or blocked, and only URLs in `networkDetailAllowUrls` show bodies. On an error with the session rate `0` and the error rate `1.0`, the replay holds the 60 seconds before the error.
- **Logs arrive and link:** a log fired on a real code path appears in Logs with its attributes, carries the `trace_id` of the active span, and `beforeSendLog` drops what it should (for example `debug`).
- **Metrics arrive:** `Sentry.metrics.count(...)` after `await Sentry.flush()` shows in the Metrics explorer, sliceable by its attributes, and each stays under 2KB.
- **Crons alert:** run the job so its `in_progress` and `ok` check-ins show on the monitor; a job that throws produces an `error` check-in and an error event tagged `monitor.slug`.
- **Feedback links:** a widget submission shows under User Feedback with its URL, screenshot and replay, and a `captureFeedback` with `associatedEventId` links to that issue.
- **Profiling runs:** a browser response carries `Document-Policy: js-profiling` and a Chrome session shows a profile on its trace; a Node service shows continuous profiles for its sampled instances.
