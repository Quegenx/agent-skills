# Browser Tracing, Replay, Logs and Profiling

The performance and session features of `@sentry/browser`: tracing (`pageload`, `navigation` and `http.client` spans, joined to backends by headers), Session Replay (a masked DOM recording, sampled at init), structured logs and browser profiling. Check each feature's versioned defaults: no tracing sample option, both replay rates `0`, logging disabled for the installed version, or a missing `Document-Policy: js-profiling` header. Setup and errors are in [BROWSER.md](BROWSER.md). React apps use [REACT-TRACING.md](REACT-TRACING.md) and [REACT-REPLAY-LOGS-PROFILING.md](REACT-REPLAY-LOGS-PROFILING.md) instead.

**Contents:** [Versions](#versions) · [Tracing setup](#tracing-setup) · [browserTracingIntegration options](#browsertracingintegration-options) · [Automatic spans](#automatic-spans) · [Custom router integration](#custom-router-integration) · [Custom spans](#custom-spans) · [Distributed tracing](#distributed-tracing) · [Sampling](#sampling) · [Replay sampling](#replay-sampling) · [replayIntegration options](#replayintegration-options) · [Replay network and canvas](#replay-network-and-canvas) · [Replay modes and manual control](#replay-modes-and-manual-control) · [Replay CSP and performance](#replay-csp-and-performance) · [Logs](#logs) · [Profiling](#profiling) · [Debugging](#debugging) · [Prove it](#prove-it)

## Versions

| Feature | Minimum `@sentry/browser` |
|---|---|
| Tracing | ≥7.0.0 |
| `enableInp` default `true` | ≥8.0.0 (7.x defaulted to `false`) |
| `enableLongAnimationFrame` | ≥8.18.0 |
| `Sentry.updateSpanName` | ≥8.47.0 |
| `inheritOrSampleWith` in `tracesSampler` | ≥9.0.0 |
| `enableReportPageLoaded`, `Sentry.reportPageLoaded()` | ≥10.13.0 |
| Session Replay | ≥7.27.0 (Node 12+, browsers newer than IE11) |
| `replayCanvasIntegration`, `networkDetailAllowUrls` | ≥7.50.0 |
| `beforeAddRecordingEvent` | ≥7.53.0 |
| `beforeErrorSampling` | ≥7.56.0 |
| `Sentry.logger`, `enableLogs` | ≥9.41.0 |
| `consoleLoggingIntegration()` | ≥10.13.0 |
| Scope-based log attributes | ≥10.32.0 |
| Browser profiling (Beta), `profileSessionSampleRate` replacing `profilesSampleRate` | ≥10.27.0 |

## Tracing setup

- **Minimal:** `integrations: [Sentry.browserTracingIntegration()]` with `tracesSampleRate: 0.2`.
- **To disable tracing, omit both `tracesSampleRate` and `tracesSampler`.** `tracesSampleRate: 0` doesn't disable it; it just never sends traces.

## browserTracingIntegration options

| Option | Default | Notes |
|---|---|---|
| `instrumentPageLoad` / `instrumentNavigation` | `true` | |
| `markBackgroundSpan` | `true` | Marks spans cancelled when the tab is backgrounded |
| `enableReportPageLoaded` | `false` | Enables the `Sentry.reportPageLoaded()` utility; ≥10.13.0 |
| `linkPreviousTrace` | `"in-memory"` | `"in-memory" \| "session-storage" \| false`; how new `pageload` spans link to the previous trace across navigations |
| `traceFetch` / `traceXHR` | `true` | |
| `enableHTTPTimings` | `true` | Uses the Resource Timing API |
| `shouldCreateSpanForRequest` | | `(url) => boolean`; excludes requests, e.g. `(url) => !url.match(/\/health\/?$/)` |
| `onRequestSpanStart` | | `(span, fetchInput, fetchInit)` |
| `enableInp` | `true` | 8.x+ |
| `interactionsSampleRate` | `1.0` | Applied on top of `tracesSampleRate` (0.5 × 0.1 = 5% of interactions) |
| `enableLongTask` | `true` | Tasks over 50 ms |
| `enableLongAnimationFrame` | `true` | ≥8.18.0 |
| `idleTimeout` | `1000` ms | Inactivity before a `pageload`/`navigation` span auto-finishes |
| `finalTimeout` | `30000` | Maximum lifespan (ms) of any root span |
| `childSpanTimeout` | `15000` | Maximum time (ms) a child span may stay open before the parent can finish |
| `beforeStartSpan` | | `(context) => SpanContext` |
| `ignoreResourceSpans` | `[]` | By operation category, e.g. `"resource.css"` |
| `ignorePerformanceApiSpans` | `[]` | For `performance.mark/measure` |

- **Normalize names** in `beforeStartSpan`: `location.pathname.replace(/\/[a-f0-9]{32}/g, "/<hash>").replace(/\/\d+/g, "/<id>")`.
- **Raise `idleTimeout`** when navigations take longer than 1 s; raise `idleTimeout` or `finalTimeout` when `pageload` ends too early.

## Automatic spans

- **`pageload` root span** with children for Web Vitals (LCP, CLS, TTFB), `resource.*` loads and HTTP during load. LCP, CLS and TTFB are always captured; INP from SDK ≥8.x.
- **`navigation` root span** on each History API change.
- **`http.client` span** per fetch or XHR.
- **Long tasks** over 50 ms become `ui.long-task` spans.

## Custom router integration

```javascript
const client = Sentry.init({
  integrations: [
    Sentry.browserTracingIntegration({
      instrumentNavigation: false,
      instrumentPageLoad: false,
    }),
  ],
});

let pageLoadSpan = Sentry.startBrowserTracingPageLoadSpan(client, {
  name: window.location.pathname,
  attributes: {
    [Sentry.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
  },
});

myRouter.on("routeChange", (route) => {
  if (pageLoadSpan) {
    pageLoadSpan.updateName(route.name);
    pageLoadSpan.setAttribute(Sentry.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route");
    pageLoadSpan = undefined;
  } else {
    Sentry.startBrowserTracingNavigationSpan(client, {
      op: "navigation",
      name: route.name,
      attributes: {
        [Sentry.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
      },
    });
  }
});
```

## Custom spans

- **`Sentry.startSpan(options, callback)`:** active, ends by itself, sync or async. The recommended one; it prevents runaway spans.
- **`Sentry.startSpanManual(options, (span) => ...)`:** end it with `span.end()`; for event-driven code.
- **`Sentry.startInactiveSpan(options)`:** never the active span; for parallel work, each ended manually. Parallel spans with the wrong parent: use it with an explicit `parentSpan`.
- **Options:** `name` (required), `op`, `startTime` (Unix seconds), `attributes` (string, number, boolean or arrays of those), `parentSpan`, `onlyIfParent`, `forceTransaction`.
- **Always set `op`.** Well-known values: `http.client`, `db`, `db.system`, `ui.click`, `ui.long-task`, `navigation`, `pageload`, `resource.script`, `resource.css`, `resource.img`, `function`, `file.upload`.
- **Span API:** `Sentry.getActiveSpan()`, `span.setAttribute` / `setAttributes`, `Sentry.updateSpanName(span, "New Name")` (≥8.47.0), `span.setStatus({ code: 1 })` (0 unknown, 1 ok, 2 error), `span.setHttpStatus(404)`.

## Distributed tracing

- **Headers:** `sentry-trace` (trace ID, parent span ID, sampled flag) and `baggage` (dynamic sampling context: trace ID, public key, sample rate, environment).
- **The `tracePropagationTargets` default is disputed:** the setup guide says same-origin only; the tracing reference says `["localhost", /^\//]` ("`localhost` + `/`", "rarely correct for production"). Set it explicitly either way, with your API origins.
- **Matching:** strings are substring matches against the full URL; RegExps are tested against the full URL including scheme and port (a service on port 8080 needs its own entry); `[]` disables propagation. A target that doesn't match: check the regex escaping.
- **CORS:** add both headers to `Access-Control-Allow-Headers` on the backend, otherwise browsers or gateways strip them (the best practices also list `Access-Control-Expose-Headers`). The backend SDK must read `sentry-trace` and `baggage` for the trace to connect.
- **Continue a server-rendered trace:** the server emits `<meta name="sentry-trace" content="<traceid>-<spanid>-1" />` and `<meta name="baggage" content="sentry-trace_id=...,sentry-environment=production,sentry-sample_rate=1" />`, read automatically on page load.
- **Non-HTTP channels:** `Sentry.getTraceData()`, then send `traceData["sentry-trace"]` and `traceData["baggage"]` in the message metadata (e.g. WebSockets).
- **Loader Script:** tracing headers are added only to fetches made after the SDK loads.

## Sampling

- **`tracesSampler: ({ name, attributes, inheritOrSampleWith }) => ...`** returns 0 to 1 or a boolean. Example: 0 for health checks, 1 for auth and login, 0.5 for checkout, `inheritOrSampleWith(0.2)` for the rest. `SamplingContext`: `name`, `attributes`, `parentSampled`, `parentSampleRate`, `inheritOrSampleWith(rate)` (≥9; returns `parentSampled` if defined, otherwise uses `rate`, so decisions propagate deterministically from parent to child).
- **Precedence:** `tracesSampler`, then the parent's decision, then `tracesSampleRate`.
- **Quota pressure:** `tracesSampler` returning `0` for health checks; exclude noise (health checks, analytics pixels, third-party beacons) with `shouldCreateSpanForRequest`.

## Replay sampling

- **Both rates default to `0`.** `replaysSessionSampleRate` records whole sessions. `replaysOnErrorSampleRate` buffers up to 60 s before an error, then records until the session ends.
- **Flow:** at session start the session rate is checked; if sampled, **session mode** sends real-time chunks. Otherwise **buffer mode** keeps the last 60 s in memory (about 2 to 5 MB; DOM event logs, not video, encoded in a WebWorker). On an error the error rate is checked: sampled sends the buffer plus the rest of the session, otherwise the buffer is discarded. With both rates `0`, or the integration added without rates, nothing records until you start it manually.
- **A session-mode session ends** after 15 minutes of inactivity or 60 minutes maximum, then reinitializes.

| Traffic | `replaysSessionSampleRate` | `replaysOnErrorSampleRate` |
|---|---|---|
| High (100k+/day) | `0.01` | `1.0` |
| Medium (10k to 100k/day) | `0.1` | `1.0` |
| Low (<10k/day) | `0.25` | `1.0` |
| Development | `1.0` | `1.0` |

## replayIntegration options

| Option | Default | Notes |
|---|---|---|
| `stickySession` | `true` | Tracks the user across refreshes; closing the tab ends the session; each tab is its own session |
| `mutationLimit` | `10000` | DOM mutations before recording stops |
| `mutationBreadcrumbLimit` | `750` | Mutations at which a breadcrumb warning is emitted |
| `minReplayDuration` | `5000` ms | Minimum length before sending; max 15000; the default is usually fine |
| `maxReplayDuration` | `3600000` ms | Also the max |
| `beforeErrorSampling` | `() => true` | Buffer mode only; return `false` to skip error-based sampling for that error |
| `slowClickIgnoreSelectors` | `[]` | Selectors where slow and rage click detection is off |
| `maskAllText` | `true` | Text replaced with `*` |
| `maskAllInputs` | `true` | `<input>` values |
| `blockAllMedia` | `true` | img, svg, video, object, picture, embed, map, audio |
| `mask` | `[".sentry-mask","[data-sentry-mask]"]` | Extra selectors are appended to the defaults |
| `unmask` / `unblock` | `[]` | Override `maskAllText` / `blockAllMedia` |
| `block` | `[".sentry-block","[data-sentry-block]"]` | |
| `ignore` | `[".sentry-ignore","[data-sentry-ignore]"]` | |
| `maskFn` | `(s) => "*".repeat(s.length)` | |
| `networkDetailAllowUrls` | `[]` | Opt-in |
| `networkDetailDenyUrls` | `[]` | Takes precedence over the allow list |
| `networkCaptureBodies` | `true` | |
| `networkRequestHeaders` / `networkResponseHeaders` | `[]` | `Content-Type`, `Content-Length`, `Accept` captured by default |
| `workerUrl` | `undefined` | Self-hosted compression worker (avoids CSP issues, reduces bundle size) |
| `beforeAddRecordingEvent` | identity | `(event) => event \| null`; filters console and network recording events |

- **Privacy methods:** Mask replaces text with `*` keeping its length; Block replaces the element with an empty placeholder of the same size; Ignore stops recording input events. Attributes: `class="sentry-mask"` / `data-sentry-mask`, `sentry-block` / `data-sentry-block`, `sentry-ignore` / `data-sentry-ignore`, `sentry-unmask` / `data-sentry-unmask`, `sentry-unblock` / `data-sentry-unblock`.
- **Keep `maskAllText` on in production;** turn it off only for internal tools. Test masking in staging at rate 1.0.
- **`beforeAddRecordingEvent`** cuts noise, e.g. drop `performanceSpan` events whose op is `resource.fetch` or `resource.xhr` unless the status is 500.

## Replay network and canvas

- **Basic request info** (URL, size, method, status) is always captured. Bodies and extra headers need `networkDetailAllowUrls: [window.location.origin]`; allow only your own API origins, not third-party services. Bodies are truncated at 150,000 characters. `networkCaptureBodies: false` keeps header capture while disabling bodies.
- **Canvas** isn't captured by default: add `Sentry.replayCanvasIntegration()`. There is currently no PII scrubbing in canvas recordings, so review canvas content first. WebGL and 3D: `replayCanvasIntegration({ enableManualSnapshot: true })`, then `Sentry.getClient()?.getIntegrationByName("ReplayCanvas")?.snapshot(canvasRef)` in the render loop. WebGPU: pass `{ skipRequestAnimationFrame: true }` to `snapshot`.

## Replay modes and manual control

- **Lazy load (npm):** init without replay, then `import("@sentry/browser").then((lazySentry) => { Sentry.addIntegration(lazySentry.replayIntegration({...})); })`. With the Loader: `Sentry.lazyLoadIntegration("replayIntegration")`, see [BROWSER.md](BROWSER.md#path-b-loader-script).
- **Manual API:** `const replay = Sentry.getReplay()`; `replay.start()`; `replay.startBuffering()`; `await replay.flush()` (keeps recording); `await replay.stop()` (flushes and ends the session); `replay.getReplayId()` returns an id only after `start` or `startBuffering`.
- **Deferred init (after fetching remote flags):** read `Sentry.getClient().getOptions()`, set `replaysSessionSampleRate` and `replaysOnErrorSampleRate`, then `client.addIntegration(Sentry.replayIntegration({...}))`.
- **Patterns:** employee-only (`replay.flush()` when `isEmployee`); URL-specific (in `navigation.addEventListener("navigate", ...)`, start on `/checkout/`, stop elsewhere); support widget (`await replay.flush()`, then attach `getReplayId()`; the replay URL is `https://<org-slug>.sentry.io/replays/<replay-id>/`).

## Replay CSP and performance

- **CSP:** `worker-src 'self' blob:;` and `child-src 'self' blob:;`. Safari ≤15.4 requires `child-src`; a self-hosted `workerUrl` is the alternative.
- **Self-host the worker:** `workerUrl: "/assets/sentry-replay-worker.min.js"` together with the bundler's `excludeReplayWorker: true` (Vite: `sentryVitePlugin({ bundleSizeOptimizations: { excludeReplayWorker: true } })`).
- **Mutation thresholds** can be tuned, e.g. `mutationBreadcrumbLimit: 1000`, `mutationLimit: 1500`.

## Logs

- **Not through the Loader Script.** Use npm or a CDN bundle with `.logs.` in its name (e.g. `bundle.logs.metrics.min.js`). The same reference's troubleshooting row says the opposite about CDN: "Not available via CDN/Loader Script", install via npm, because "logging requires the npm package".
- **Logs defaults:** use the [shared JavaScript Logs version rule](REACT-REPLAY-LOGS-PROFILING.md#logs). The old source claimed all versions silently drop Logs without explicit true. [https://docs.sentry.io/platforms/javascript/logs/]
- **Six levels:** `Sentry.logger.trace/debug/info/warn/error/fatal(message, attributes?)`. Attribute values must be string, number or boolean; `undefined`, arrays and objects aren't accepted.
- **`Sentry.logger.fmt` must be a tagged template:** ``Sentry.logger.info(Sentry.logger.fmt`User ${userId} purchased ${productName} for $${amount}`)`` produces `message.template: "User %s purchased %s for $%s"` and `message.parameter.0..N`, each searchable (e.g. `message.parameter.0 = "user_123"`). `Sentry.logger.fmt("text")` produces no parameters. Use `fmt` when the variable is a meaningful part of the message text; pass `{ key: val }` attributes when variables belong as separate searchable attributes.
- **Console forwarding:** `Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })` (≥10.13.0) turns `console.*` calls into structured logs, with interpolated values as `message.parameter.N`; levels available: `"log"`, `"info"`, `"warn"`, `"error"`, `"debug"`, `"trace"`.
- **`beforeSendLog: (log) => log | null`;** the log has `level`, `message`, `timestamp`, `attributes`. Example: drop `debug` and `trace`, delete `password`, redact `credit_card`.
- **Scope attributes (≥10.32.0),** string, number or boolean only: `Sentry.getGlobalScope().setAttributes({...})`, `Sentry.getIsolationScope().setAttributes({...})`, `scope.setAttribute("order_id", ...)` inside `withScope`.
- **Automatic attributes:** `sentry.environment`, `sentry.release`, `sentry.sdk.name` (`"sentry.javascript.browser"`), `sentry.sdk.version`, `browser.name`, `browser.version`, `user.id` / `user.name` / `user.email` (from `setUser`), `sentry.trace.parent_span_id` (log to trace), `sentry.replay_id` (log to replay), `message.template`, `message.parameter.N`.
- **Correlation:** logs emitted inside `Sentry.startSpan` link to that span; the UI goes from a log to its trace, from a span to its "Logs", and shows logs inline in a replay. Needs an active span with tracing enabled (`browserTracingIntegration()` and `tracesSampleRate > 0`).
- **Use `logger` for structured observability data and `captureException` for errors** that need grouping and stack traces. Prefer one comprehensive log with all relevant context over many small scattered ones. In production filter out `trace` and `debug`; keep `info` (low or medium volume), `warn` (low), `error` (rare), `fatal` (very rare).

## Profiling

- **Beta, ≥10.27.0, Chromium only (Chrome, Edge);** breaking changes may occur. Firefox and Safari don't implement the JS Self-Profiling API; their sessions are silently excluded (no error, no overhead), which biases the sample.
- **Captures** JS call stacks (function names and source locations, deobfuscated via source maps), CPU time per function and flame graphs aggregated across real user sessions, each profile linked to a trace, sampled at 100 Hz (10 ms intervals).
- **Every document response must carry `Document-Policy: js-profiling`,** or profiling fails silently. GitHub Pages and some CDNs can't set it.

| Host | Header config |
|---|---|
| Vercel `vercel.json` | `{"headers":[{"source":"/(.*)","headers":[{"key":"Document-Policy","value":"js-profiling"}]}]}` |
| Netlify `netlify.toml` | `[[headers]] for = "/*"` with `[headers.values] Document-Policy = "js-profiling"` |
| Netlify `_headers` | `/*` followed by `Document-Policy: js-profiling` |
| Express | `res.set("Document-Policy", "js-profiling")` |
| Nginx | `add_header Document-Policy "js-profiling";` |

- **Setup:** `integrations: [Sentry.browserTracingIntegration(), Sentry.browserProfilingIntegration()]` with `tracesSampleRate` (> 0, profiling requires tracing) and `profileSessionSampleRate`.
- **`profileSessionSampleRate`** (0 to 1) is evaluated once per page load: a session profiles all of its traces or none. `profilesSampleRate` is the legacy (<10.27.0), transaction-based, deprecated option.
- **`profileLifecycle`:** `'manual' | 'trace'`, default `'manual'`. Trace mode starts and stops with each root span and is recommended for production. Manual mode: `Sentry.uiProfiler.startProfiler();` ... `Sentry.uiProfiler.stopProfiler();`. If `uiProfiler` is undefined, the SDK is older than 10.27 or `profileLifecycle` is wrong (it's only available in manual mode). Use manual mode for a specific known bottleneck (a slow chart render, a complex animation).
- **Production example:** profiling adds CPU overhead, so use conservative rates: `tracesSampleRate: 0.2`, `profileSessionSampleRate: 0.1`, `profileLifecycle: "trace"`; keep the rate in the 0.1 to 0.2 range.
- **Upload source maps,** or profiles show minified names. Chrome DevTools may show SDK activity as "profiling overhead"; that's cosmetic.

## Debugging

| Symptom | Fix |
|---|---|
| Transactions not appearing | `tracesSampleRate > 0` (or `tracesSampler` returns > 0) and `browserTracingIntegration()` in `integrations` |
| No `sentry-trace` / `baggage` on requests | The URL must match `tracePropagationTargets`; CORS must allow the headers |
| Transaction names are raw URLs with IDs | Normalize in `beforeStartSpan` |
| `pageload` ends too early | Raise `idleTimeout` or `finalTimeout` |
| Parallel spans have the wrong parent | `startInactiveSpan` with `parentSpan` |
| INP missing | SDK ≥8.0.0, or `enableInp: true` on 7.x |
| Long tasks not captured | `enableLongTask: true` (default); long animation frames need ≥8.18.0 and `enableLongAnimationFrame: true` |
| `beforeSendTransaction` not called | It is a separate hook from `beforeSend`, for transactions only |
| `tracePropagationTargets` not matching | Check regex escaping; the setup guide says the default is same-origin only |
| Session replay not recording | `replayIntegration()` present and a rate above 0 |
| Replay CSP errors | `worker-src 'self' blob:` and `child-src 'self' blob:`, or a self-hosted `workerUrl` |
| Replay stopped after a mutation spike | `mutationLimit` (10000) was hit; raise it or reduce DOM mutation frequency |
| Sensitive data visible in replays | `.sentry-mask` / `.sentry-block` on elements or `mask`/`block` selectors; verify at `replaysSessionSampleRate: 1.0` in staging |
| Canvas not recorded | `replayCanvasIntegration()` alongside `replayIntegration()`; SDK ≥7.50.0 |
| Network bodies not captured | Add your API origin to `networkDetailAllowUrls` |
| Replay ID unavailable | Call `getReplayId()` only after `start()` or `startBuffering()` |
| Large bundle from replay | `excludeReplayWorker: true` plus a self-hosted `workerUrl` |
| Error replays missing the 60 s buffer | The error rate must be above 0 and the integration initialized before the error |
| `beforeErrorSampling` never called | It only runs in buffer mode |
| Logs not appearing | `enableLogs: true`; SDK ≥9.41.0 |
| `logger.fmt` makes no `message.parameter.*` | Use it as a tagged template, not `Sentry.logger.fmt("text", var)` |
| Log attributes contain `undefined` | Only string, number, boolean are accepted; filter undefined first |
| Logs not linked to traces | `browserTracingIntegration()` and `tracesSampleRate > 0`; emit inside an active span |
| Logs have no user | `setUser` after authentication; `userInfo` is collected unless disabled via `dataCollection` |
| Sensitive data in logs | Filter in `beforeSendLog`; avoid logging it at the call site |
| No profiles | `Document-Policy: js-profiling` header, tracing active, `profileSessionSampleRate` set (`1.0` dev, `0.1` production) |
| No profiles from Firefox or Safari | Expected; those browsers don't support the API |
| `uiProfiler` undefined | SDK below 10.27 or `profileLifecycle` not manual |

## Prove it

Run `Sentry.startSpan({ name: "Test Span", op: "test" }, () => {})` and load the page: Traces shows the page load transaction and the span. Interact with the page: Replays shows the session recording (test masking in staging at `replaysSessionSampleRate: 1.0` and review that PII is hidden). With logging enabled, Logs shows the entries; from a log, the trace link jumps to its span. If nothing appears, set `debug: true` and check the browser console.
