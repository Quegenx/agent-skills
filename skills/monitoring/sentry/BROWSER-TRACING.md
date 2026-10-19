# Browser tracing

Shared browser tracing for plain JavaScript and React: automatic page/navigation/HTTP spans, custom routing, span APIs and distributed propagation. Keep React router integrations in [REACT-TRACING.md](REACT-TRACING.md), web Replay/profiling in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md), and Logs/Metrics in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md). Source tables and examples retain their SDK 10 contract unless explicitly marked 11; current migration rules are in [UPGRADE.md](UPGRADE.md). [getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

## Versions

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

| Feature | Minimum `@sentry/browser` |
|---|---|
| Tracing | ≥7.0.0 |
| `enableInp` default `true` | ≥8.0.0 (7.x defaulted to `false`) |
| `enableLongAnimationFrame` | ≥8.18.0 |
| `Sentry.updateSpanName` | ≥8.47.0 |
| `inheritOrSampleWith` in `tracesSampler` | ≥9.0.0 |
| `enableReportPageLoaded`, `Sentry.reportPageLoaded()` | ≥10.13.0 |


## Tracing setup

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- **Minimal:** `integrations: [Sentry.browserTracingIntegration()]` with `tracesSampleRate: 0.2`.
- **To disable tracing, omit both `tracesSampleRate` and `tracesSampler`.** `tracesSampleRate: 0` doesn't disable it; it just never sends traces.

## browserTracingIntegration options

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

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

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- **`pageload` root span** with children for Web Vitals (LCP, CLS, TTFB), `resource.*` loads and HTTP during load. LCP, CLS and TTFB are always captured; INP from SDK ≥8.x.
- **`navigation` root span** on each History API change.
- **`http.client` span** per fetch or XHR.
- **Long tasks** over 50 ms become `ui.long-task` spans.

## Custom router integration

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

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

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- **`Sentry.startSpan(options, callback)`:** active, ends by itself, sync or async. The recommended one; it prevents runaway spans.
- **`Sentry.startSpanManual(options, (span) => ...)`:** end it with `span.end()`; for event-driven code.
- **`Sentry.startInactiveSpan(options)`:** never the active span; for parallel work, each ended manually. Parallel spans with the wrong parent: use it with an explicit `parentSpan`.
- **Options:** `name` (required), `op`, `startTime` (Unix seconds), `attributes` (string, number, boolean or arrays of those), `parentSpan`, `onlyIfParent`, `forceTransaction`.
- **Always set `op`.** Well-known values: `http.client`, `db`, `db.system`, `ui.click`, `ui.long-task`, `navigation`, `pageload`, `resource.script`, `resource.css`, `resource.img`, `function`, `file.upload`.
- **Span API:** `Sentry.getActiveSpan()`, `span.setAttribute` / `setAttributes`, `Sentry.updateSpanName(span, "New Name")` (≥8.47.0), `span.setStatus({ code: 1 })` (0 unknown, 1 ok, 2 error), `span.setHttpStatus(404)`.

## Distributed tracing

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- **Headers:** `sentry-trace` (trace ID, parent span ID, sampled flag) and `baggage` (dynamic sampling context: trace ID, public key, sample rate, environment).
- **The `tracePropagationTargets` default is disputed:** the setup guide says same-origin only; the tracing reference says `["localhost", /^\//]` ("`localhost` + `/`", "rarely correct for production"). Set it explicitly either way, with your API origins.
- **Matching:** strings are substring matches against the full URL, including port suffixes; regexes match the full URL. `[]` disables propagation. The old source said a service on port 8080 always needs its own entry; a matching substring does not. Check actual regex anchoring and escaping. [https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracePropagationTargets]
- **CORS:** add both headers to `Access-Control-Allow-Headers` on the backend, otherwise browsers or gateways strip them (the best practices also list `Access-Control-Expose-Headers`). The backend SDK must read `sentry-trace` and `baggage` for the trace to connect.
- **Continue a server-rendered trace:** the server emits `<meta name="sentry-trace" content="<traceid>-<spanid>-1" />` and `<meta name="baggage" content="sentry-trace_id=...,sentry-environment=production,sentry-sample_rate=1" />`, read automatically on page load.
- **Non-HTTP channels:** `Sentry.getTraceData()`, then send `traceData["sentry-trace"]` and `traceData["baggage"]` in the message metadata (e.g. WebSockets).
- **Loader Script:** tracing headers are added only to fetches made after the SDK loads.

## Sampling

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

Use the [shared sampling contract](SAMPLING-AND-QUOTAS.md#tracessampler). The browser source's example prioritizes auth/login at 1, checkout at 0.5, health at 0, and defaults through inheritOrSampleWith(0.2); these are source choices, not SDK defaults. [getsentry/sentry-for-ai, sentry-browser-sdk]

## Debugging

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

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
| `beforeErrorSampling` never called | It only runs in buffer mode |


### React reference hook and naming examples

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

These are the retained SDK 10 source variants; the canonical setup and v11 migration boundary above still apply. [getsentry/sentry-for-ai, sentry-react-sdk]

```typescript
browserTracingIntegration({
  beforeStartSpan: (context) => ({
    ...context,
    name: location.pathname
      .replace(/\/[a-f0-9]{8,}/g, "/<hash>")  // strip hashes/UUIDs
      .replace(/\/\d+/g, "/<id>"),              // strip numeric IDs
  }),
})
```

```typescript
      shouldCreateSpanForRequest: (url) =>
        !url.includes("/health") && !url.includes("/__webpack_hmr"),
      onRequestSpanStart: (span, { headers }) => {
        const rid = headers?.["x-request-id"];
        if (rid) span.setAttribute("request.id", rid);
      },
```

### React reference custom router variant

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

These are the retained SDK 10 source variants; the canonical setup and v11 migration boundary above still apply. [getsentry/sentry-for-ai, sentry-react-sdk]

```typescript
const client = Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.browserTracingIntegration({
      instrumentPageLoad: false,   // handled manually
      instrumentNavigation: false, // handled manually
    }),
  ],
  tracesSampleRate: 1.0,
})!;

let pageLoadSpan = Sentry.startBrowserTracingPageLoadSpan(client, {
  name: window.location.pathname,
  attributes: {
    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",  // start with "url" source
  },
});

myCustomRouter.on("routeResolved", (route) => {
  if (pageLoadSpan) {
    pageLoadSpan.updateName(route.pattern);          // e.g. "/users/:id"
    pageLoadSpan.setAttribute(
      SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route"      // upgrade to "route" source
    );
    pageLoadSpan = undefined;
  } else {
    Sentry.startBrowserTracingNavigationSpan(client, {
      op: "navigation",
      name: route.pattern,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
      },
    });
  }
});
```

## React source qualifiers

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- The React timeout table says an idle root takes its last child's end time. Both custom browser routing helpers create idle spans that close after idleTimeout; the React source names SEMANTIC_ATTRIBUTE_SENTRY_SOURCE as sentry.source and SEMANTIC_ATTRIBUTE_SENTRY_OP as sentry.op in its SDK 10 contract. Its source also lists setHttpStatus and flat child-span parenting; the shared span API table retains those source examples. React setup's default-target claim names localhost and DSN origin; browser/shared source variants differ. Use explicit propagation targets and current platform docs. [getsentry/sentry-for-ai, sentry-react-sdk]

[getsentry/sentry-for-ai, sentry-react-sdk and sentry-browser-sdk tracing references]

- React pageload includes FCP as well as LCP/CLS/TTFB; navigation spans do not carry that same pageload set. HTTP timing includes DNS/TLS/connection/TTFB/download, and INP spans carry component/element/interaction_type on page hide. Its source lists Chromium 96+ for INP and the integrations catalog's FID list as legacy.
- onRequestSpanStart is shown as (span, requestInfo), with a headers field, in React; the Browser source lists (span, fetchInput, fetchInit). Keep this source disagreement and check installed types. beforeStartSpan returns StartSpanOptions; React describes ignoreResourceSpans as op prefixes.
- React source lists wrapCreateMemoryRouterV6 since 8.50.0, ignoreSpans 10.2.0/attribute matching 10.6.0, propagateTraceparent 10.10.0 and async/lazy routes 10.39.0. Router-specific setup remains in REACT-TRACING.md.
- Browser child spans default flat under the root. parentSpanIsAlwaysRootSpan:false permits nesting but can misattribute concurrent async work; explicit parentSpan with startInactiveSpan is the source's async-gap alternative. React's source calls a thrown startSpan callback error captured and marked; verify automatic capture separately from error status for the installed SDK.
- React source uses forceTransaction for background work and gives op alternatives db.query, ui.render, ui.load, ui.flow, task, cache.get/cache.set, middleware. Browser source gives db.system, file.upload and resource categories. Preserve source-selected conventions; v11 consolidations belong to UPGRADE.md.
- WebSocket receiver in React's source uses OpenTelemetry propagation.extract/context.with; Node's Sentry-specific receiver uses continueTrace. Vendor-neutral propagation lives in [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INSTRUMENT.md#tracing-through-queues-and-jobs), and both source paths need their actual registered provider.

## Filtering spans

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

- **`beforeSendTransaction(event)`** modifies or drops whole transactions (return `null`).
- **`ignoreTransactions`:** e.g. `["/health", /^\/api\/internal/, "/__webpack_hmr", /\.(png|jpg|svg|ico|woff2)$/]`; strings are substring matches.
- **`beforeSendSpan(span)` cannot drop spans:** always return the span. Returning `null` breaks the SDK. Use `ignoreSpans`.
- **`ignoreSpans` (≥10.2.0):** strings, regexes, `{ op }`, `{ name, op }`, `{ name: /regex/ }`, and from ≥10.6.0 `{ attributes: { "url.path": "/health", "http.response.status_code": 200 } }` (string values match as substring or RegExp, others by strict equality). If the root span matches, the entire local trace is dropped.

## Prove it

[getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk tracing references]

A real browser path produces the expected page/navigation/HTTP spans and correct route naming; requests to the selected backend carry allowed trace headers and join the same trace. Replay, Logs and profiling acceptance is with their linked owners. [getsentry/sentry-for-ai, browser tracing reference]
