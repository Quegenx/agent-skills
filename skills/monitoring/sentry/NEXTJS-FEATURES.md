# Next.js features

Everything `@sentry/nextjs` does beyond error capture: tracing, Session Replay, logs, metrics, profiling, crons and AI monitoring. Each feature is switched on per runtime, in the init file of that runtime (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`), so the mechanism that decides most outcomes is the same as for errors: tracing or logs configured in one file produce nothing in the other two. Setup, the three runtimes and error monitoring are in [NEXTJS.md](NEXTJS.md); cross-platform sampling and PII practices are in [PRACTICES.md](PRACTICES.md); source maps (also needed for readable flame graphs) are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Feature versions](#feature-versions) · [Tracing](#tracing) · [Distributed tracing](#distributed-tracing) · [Session Replay](BROWSER-REPLAY-AND-PROFILING.md#session-replay) · [Logs](SIGNALS-PRACTICE.md#logs) · [Metrics](SIGNALS-PRACTICE.md#application-metrics) · [Profiling](#profiling) · [Crons](#crons) · [AI monitoring](#ai-monitoring) · [Debugging](#debugging) · [Prove it](#prove-it)

## Feature versions

| Feature or API | Minimum `@sentry/nextjs` | Runtimes |
|---|---|---|
| Tracing, `withServerActionInstrumentation` | 8.0.0 | All three |
| `enableLongAnimationFrame` | 8.18.0 | Browser |
| `ignoreSpans` | 10.2.0 | |
| `setActiveSpanInBrowser` | 10.15.0 | Browser |
| Session Replay | 7.27.0 (network headers and bodies 7.50.0, `replayCanvasIntegration()` 7.98.0) | Browser only |
| `enableLogs`, `Sentry.logger.*` | 9.41.0 (Winston 9.13.0, Consola 10.12.0, console multi-arg parsing 10.13.0, Pino 10.18.0, scope attributes 10.32.0) | All three |
| `enableMetrics`, `beforeSendMetric` | 10.24.0 | All three |
| Stable `Sentry.metrics.*` | 10.25.0 (scope attributes 10.33.0) | All three |
| Browser profiling (Beta) | 10.27.0 | Chromium browsers |
| `captureCheckIn` | 7.51.1 (`withMonitor` 7.76.0, `cron`/`node-cron` 7.92.0, `node-schedule` 7.93.0, `failureIssueThreshold`/`recoveryThreshold` 8.7.0) | Server and Edge, not browser |
| OpenAI, Vercel AI SDK, Anthropic integrations | 10.53.0 | Server (some browser and Edge wrappers) |
| `streamGenAiSpans` (default `true`) | 10.61.0 | |

## Tracing

### Turning it on

- **Set `tracesSampleRate` or `tracesSampler` in all three runtime config files.** Without one of them no spans are created, and a runtime missing it produces no spans. Recommended: `tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,`.
- **To disable tracing entirely, omit both.** `tracesSampleRate: 0` is not the same: it still activates instrumentation but sends nothing.
- **What each runtime traces:** client: page loads, navigations, fetch and XHR, Web Vitals, INP. Server: API routes, RSC renders, `getServerSideProps`, background work. Edge: Next.js middleware.
- **App Router navigations** need `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;` in `instrumentation-client.ts` (see [NEXTJS.md](NEXTJS.md#instrumentation-clientts-browser)).

### Sampling

- **Precedence:** 1. `tracesSampler`; 2. the parent's decision via `sentry-trace`; 3. `tracesSampleRate`.
- **`tracesSampler` returns a number 0 to 1 or a boolean.** Its `SamplingContext` has `name`, `attributes`, `parentSampled`, `parentSampleRate` and `inheritOrSampleWith(fallbackRate)`.

```typescript
Sentry.init({
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    // Always drop health checks
    if (name.includes("/health") || name.includes("/ping")) return 0;

    // Always sample critical flows
    if (name.includes("/checkout") || name.includes("/payment")) return 1.0;

    // Sample admin routes at 50%
    if (name.includes("/admin")) return 0.5;

    // For everything else: honor parent's decision, fall back to 10%
    return inheritOrSampleWith(0.1);
  },
});
```

- **Use `inheritOrSampleWith` instead of checking `parentSampled` yourself:** it keeps rates consistent through distributed traces, enables accurate metric extrapolation, and sets the correct `sentry-sampled` value in downstream `baggage`.
- **High volume:** return `0` for health checks and lower the default, e.g. `inheritOrSampleWith(0.02)`.

### Automatic spans

| `op` | Runtime | What |
|---|---|---|
| `pageload` | Client | LCP, CLS, FCP, TTFB; resource child spans |
| `navigation` | Client | Route changes |
| `http.client` | Client | fetch and XHR |
| `ui.interaction` | Client | INP, emitted on page hide |
| `ui.long-task` | Client | Tasks over 50 ms |
| `ui.long-animation-frame` | Client | SDK 8.18.0+ |
| `http.server` | Server, Edge | App Router `app/api/*/route.ts`, Pages Router `pages/api/*.ts`, RSC renders, `getServerSideProps`, Edge middleware |

- **Server Actions are NOT auto-instrumented.** Wrap each with `withServerActionInstrumentation()` (code in [NEXTJS.md](NEXTJS.md#server-side-capture)). The action name becomes the span name; always pass `headers: await headers()`, which distributed trace continuation requires; `formData` is logged with the span; `recordResponse` captures the return value.

### `browserTracingIntegration` options

```typescript
    Sentry.browserTracingIntegration({
      // Page Load & Navigation
      instrumentPageLoad: true,        // default: true
      instrumentNavigation: true,      // default: true

      // HTTP spans
      traceFetch: true,                // default: true
      traceXHR: true,                  // default: true
      enableHTTPTimings: true,         // default: true
      shouldCreateSpanForRequest: (url) => !url.includes("/health"),

      // Performance observations
      enableLongTask: true,            // default: true
      enableLongAnimationFrame: true,  // default: true (SDK ≥8.18.0)
      enableInp: true,                 // INP spans

      // Span lifecycle
      idleTimeout: 1000,               // ms: wait after last child before ending
      finalTimeout: 30000,             // ms: hard cap on span duration
      childSpanTimeout: 15000,         // ms: max time for child spans

      // Span naming: parameterize URLs
      beforeStartSpan: (context) => ({
        ...context,
        name: context.name.replace(/\/\d+/g, "/<id>"),
      }),

      // Span filtering
      ignoreResourceSpans: ["resource.css", "resource.script", "resource.img"],
    }),
```

### Custom spans

- **`Sentry.startSpan({ name, op, attributes }, async () => ...)`** is active and ends itself (recommended); children nest automatically.
- **`Sentry.startSpanManual({...}, (span) => { ... span.end(); })`** when the span's lifetime can't be enclosed in a callback; `span.end()` is required.
- **`Sentry.startInactiveSpan({ name, parentSpan? })`** is never active automatically; use it for parallel work and call `.end()`.
- **`Sentry.setActiveSpanInBrowser(span)`** (browser only, 10.15.0+) for UI event handlers.
- **`StartSpanOptions`:** `name` (required), `op`, `attributes: Record<string, string | number | boolean>`, `parentSpan`, `onlyIfParent` (skip if there is no active parent), `forceTransaction` (force a root transaction in the UI), `startTime` (Unix seconds).
- **Common `op` values:** `http.client`, `http.server`, `db` / `db.query`, `db.redis`, `function`, `ui.render`, `ui.action.click`, `cache.get` / `cache.put`, `queue.publish` / `queue.process`, `task`.
- **Enrich:** `Sentry.getActiveSpan()`, `span.setAttribute`, `span.setAttributes`, `span.setStatus({ code })` (0 = unset, 1 = ok, 2 = error, optional `message`), `Sentry.updateSpanName(span, "GET /users/:id")`.
- **beforeSendSpan modifies but cannot drop spans or return null.** Use ignoreSpans for dropping; serialized shape follows the selected stream/static lifecycle. The old Next.js source said null could drop spans. [https://docs.sentry.io/platforms/javascript/guides/node/configuration/filtering/#using-before-send-span]
- **Other APIs:** `Sentry.continueTrace({ sentryTrace, baggage }, cb)`, `Sentry.startNewTrace(cb)` (break the chain), `Sentry.suppressTracing(cb)` (no spans), `Sentry.getRootSpan(span)`, `Sentry.spanToJSON(root).name`, `Sentry.withActiveSpan(span, async (scope) => ...)`.
- **The browser attaches all child spans flat to the root span by default.** Opt into nesting with `parentSpanIsAlwaysRootSpan: false`, with care: it can produce incorrect data with concurrent async operations. Across async gaps use `startInactiveSpan` with an explicit `parentSpan`.

## Distributed tracing

- **Headers:** `sentry-trace` (`{traceId}-{spanId}-{sampled}`) and `baggage` (W3C Baggage with `sentry-*` keys). Backends must allow them in CORS: `Access-Control-Allow-Headers: sentry-trace, baggage`.
- **`tracePropagationTargets`** string entries match substrings of the full URL; RegExps use the URL too. `localhost` therefore matches a URL containing `localhost:3001`; the old source said it would not. CORS origin policies still distinguish ports. Choose targets deliberately rather than confusing propagation matching with origin authorization. [https://docs.sentry.io/platforms/javascript/configuration/options/#tracePropagationTargets]
- **App Router SSR continuation:** the official setup adds `Sentry.getTraceData()` to `generateMetadata().other`. The old source claimed no configuration was needed. Follow the documented metadata setup for the installed Next.js/Sentry version. [https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/distributed-tracing/]
- **Non-HTTP channels:** `Sentry.getTraceData()` returns `{ "sentry-trace": "...", "baggage": "..." }`; the receiver wraps its work in `Sentry.continueTrace`.
- **Sampling is head-based:** the originating service decides, and all services either sample or drop the whole trace.

## Session Replay

Add replayIntegration only in instrumentation-client.ts, never server/edge initialization, handlers or actions. Use the [shared web Replay owner](BROWSER-REPLAY-AND-PROFILING.md#session-replay) for sampling, privacy, network, manual control and CSP; it is bundled with @sentry/nextjs. [getsentry/sentry-for-ai, sentry-nextjs-sdk]

### Bundle size, control and CSP

- **Tree-shaking (webpack only, Turbopack not supported):** `webpack.treeshake.removeDebugLogging`, `removeTracing` (never call `Sentry.startSpan()` and friends if enabled), `excludeReplayIframe`, `excludeReplayShadowDOM`, `excludeReplayCompressionWorker` (requires `workerUrl`). All default `false`.
- **Custom worker:** download `worker.min.js` from https://github.com/getsentry/sentry-javascript/blob/develop/packages/replay-worker/examples/worker.min.js, set `workerUrl: "/assets/worker.min.js"` and `excludeReplayCompressionWorker: true`.
- **Click positions misaligned with custom fonts:** serve the fonts with `Access-Control-Allow-Origin` headers.

## Logs

Use the [shared JavaScript logger API and version boundary](SIGNALS-PRACTICE.md#logs). Retain the Next.js runtime choices below. [getsentry/sentry-for-ai, sentry-nextjs-sdk]

- **Configure each runtime deliberately.** Use the [JavaScript Logs version rule](SIGNALS-PRACTICE.md#logs); the old source claimed every version is a silent no-op without explicit true. Client, server and edge initialization remain independent. [https://docs.sentry.io/platforms/javascript/logs/]
- **Logger libraries:** Pino (server only) `integrations: [Sentry.pinoIntegration()]`, with no changes to your pino logger. Consola `consola.addReporter(Sentry.createConsolaReporter({ levels: ["error", "warn"] }))`. Winston `Sentry.createSentryWinstonTransport(Transport, { levels: ["error", "warn"] })` with `import Transport from "winston-transport"`.
- **Per runtime:** client `consoleLoggingIntegration({ levels: ["warn", "error"] })`, server `pinoIntegration()`, edge only `enableLogs: true`.
- **Scope attributes (10.32.0+):** `Sentry.getGlobalScope().setAttributes({...})`, `Sentry.getIsolationScope().setAttributes({...})`, `scope.setAttribute("request_id", req.id)` inside `withScope`. Always use `getIsolationScope()` for per-request data on the server, to prevent cross-request leakage.

## Metrics

Use the [shared JavaScript Metrics API and version-specific disable contract](SIGNALS-PRACTICE.md#application-metrics) in each initialized runtime. [getsentry/sentry-for-ai, sentry-nextjs-sdk]

- **Typical uses:** an App Router route counting `orders_created` with a `status` attribute and an `order_latency` distribution recorded in `finally`; a Server Action counting `checkout_attempts`, `checkout_success` and `checkout_failures`.
- **Flush in serverless and edge:** `await Sentry.flush(2000);` keeps the client alive; `await Sentry.close(2000);` tears it down on permanent shutdown.

## Profiling

### How sampling works

- **Profiles attach to spans** and are collected only when both the trace and `profileSessionSampleRate` say yes: `tracesSampleRate: 0.1` with `profileSessionSampleRate: 0.5` gives about 5%.
- **`profileSessionSampleRate` is decided once per session:** in the browser at page load, on the server at process startup.
- **`profileLifecycle`:** `"trace"` attaches to every sampled span automatically; `"manual"` (default) uses `Sentry.uiProfiler.startProfiler()` / `stopProfiler()` in the browser or `Sentry.profiler.startProfiler()` / `stopProfiler()` in Node.
- **Recommended:** `profileSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, profileLifecycle: "trace"`.

### Browser

- **`browserProfilingIntegration()` (Beta, 10.27.0+) works in Chrome and Edge (Chromium) only, at 100Hz.** Firefox, Safari and iOS Safari don't implement the JS Self-Profiling API, so it silently does nothing there. Put it AFTER `browserTracingIntegration()`.
- **Every page needs the `Document-Policy: js-profiling` header:** next.config `headers()` with `source: "/(.*)"`, `vercel.json` `"headers"`, `netlify.toml` `[[headers]] for = "/*"`, or nginx `add_header Document-Policy "js-profiling";`. Static hosts without custom headers (some CDNs, GitHub Pages) can't profile in the browser.
- **Turn it off while profiling locally in DevTools** (DevTools samples at 1000Hz; the SDK at 100Hz with low overhead).

### Node.js server

- **Install `@sentry/profiling-node` at exactly the same version as `@sentry/nextjs`:** `npm install @sentry/profiling-node --save`, or upgrade both with `npm install @sentry/nextjs@latest @sentry/profiling-node@latest`. Mismatched versions fail silently.
- **Add `nodeProfilingIntegration` (from `import { nodeProfilingIntegration } from "@sentry/profiling-node";`) to `sentry.server.config.ts` only.** Never to `sentry.edge.config.ts`: the Edge has no native add-ons.
- **Prebuilt binaries:** macOS x64, Linux glibc x64, Linux musl x64 and ARM64, Linux ARM64, Windows x64; Node 18 to 24. Deno and Bun are not supported.
- **Environment variables:** `SENTRY_PROFILER_BINARY_PATH`, `SENTRY_PROFILER_BINARY_DIR`, `SENTRY_PROFILER_LOGGING_MODE` (`"eager"`, the default: faster `startProfiler`, more CPU; `"lazy"`: lower CPU).
- **The Node profiler adds CPU.** Test with realistic load before going to `1.0`: for high-throughput environments, test before deployment that the service's performance characteristics still meet expectations.

## Crons

- **Server and Edge only, not the browser.** Crons detect missed check-ins, runtime failures and timeouts (exceeding `maxRuntime`).
- **Vercel Cron:** `withSentryConfig(nextConfig, { automaticVercelMonitors: true })` works only with the Pages Router; App Router route handlers are NOT yet supported.
- **Scheduler libraries:** `Sentry.cron.instrumentCron(CronJob, "my-cron-job")` (also `.from({ cronTime, onTick })`); `Sentry.cron.instrumentNodeCron(cron)`, where `{ name: "my-cron-job" }` is required; `Sentry.cron.instrumentNodeSchedule(schedule)` with the slug as the first argument of `scheduleJob` (cron strings only, no Date or RecurrenceRule).
- **`await Sentry.withMonitor(slug, cb, config?)`** sends `in_progress`, then `ok` or `error`. Without a config the monitor must already exist; the first check-in with an upsert config creates it.

```typescript
await Sentry.withMonitor(
  "hourly-report-job",
  async () => {
    await generateHourlyReport();
  },
  {
    schedule: {
      type: "crontab",
      value: "0 * * * *",   // runs at top of every hour
    },
    checkinMargin: 2,        // minutes of grace before "missed"
    maxRuntime: 10,          // minutes before marking as failed
    timezone: "America/Los_Angeles",
    failureIssueThreshold: 3,   // consecutive failures before creating issue (SDK ≥8.7.0)
    recoveryThreshold: 2,        // consecutive successes before resolving issue (SDK ≥8.7.0)
  },
);
```

- **Interval schedules:** `{ type: "interval", value: 30, unit: "minute" }`; units `"minute" | "hour" | "day" | "week" | "month" | "year"`.
- **Manual check-ins:** `const checkInId = Sentry.captureCheckIn({ monitorSlug, status: "in_progress" }, config?)`, then `captureCheckIn({ checkInId, monitorSlug, status: "ok" | "error" })`. A heartbeat (one check-in at completion) detects missed jobs only. Statuses: `in_progress`, `ok`, `error`.
- **Route handlers:** an App Router `app/api/cron/route.ts` `GET` uses `captureCheckIn` or `withMonitor`; an Edge route adds `export const runtime = "edge";` and uses `withMonitor`.
- **Limits:** 6 check-ins per minute per monitor environment; environments are tracked independently.
- **Alerts:** issue alerts filtered by the tag `monitor.slug`.

## AI monitoring

- **Needs tracing on (`tracesSampleRate` > 0).** It tracks agent runs and error rates, LLM calls (model, tokens, estimated cost), tool calls, handoffs, full prompts and completions (opt-in) and bottlenecks. Dashboard: Sentry > AI > Agents (or Insights > AI), tabs Overview, Models, Tools, Traces.

| Provider | Integration | Manual wrapper or Edge | Supported package versions |
|---|---|---|---|
| OpenAI | `Sentry.openAIIntegration()` in `sentry.server.config.ts`, enabled by default on the server | Browser: `Sentry.instrumentOpenAiClient(openai)`, wrapped once at module level | `openai` 4.0.0 up to (not including) 7 |
| Vercel AI SDK | `Sentry.vercelAIIntegration()`, auto-enabled in Node | Before Sentry SDK 11, add it manually in the Edge config; from SDK 11 the Edge runtime isn't instrumented ([AI-MONITORING.md](AI-MONITORING.md)) | `ai` 3.0.0 to 7 (Sentry SDK 11 and later) |
| Anthropic | `Sentry.anthropicAIIntegration()`, auto-enabled on the Node server | Manual wrapping: `Sentry.instrumentAnthropicAiClient(anthropic)` | `@anthropic-ai/sdk` 0.19.2 up to (not including) 1.0.0 |

- **OpenAI streaming needs `stream_options: { include_usage: true }`** for token counts.
- **Vercel AI SDK calls need telemetry per call:** `experimental_telemetry: { isEnabled: true, functionId: "...", recordInputs: true, recordOutputs: true }` on `generateText`, `generateObject` and `streamText`, before Sentry SDK 11; from 11 there is no per-call setting ([AI-MONITORING.md](AI-MONITORING.md#vercel-ai-sdk)).
- **On Vercel production use `vercelAIIntegration({ force: true })` in `sentry.server.config.ts`:** bundling prevents module detection, and spans then get raw names (`ai.toolCall`, `ai.streamText`) instead of `gen_ai.execute_tool`, `gen_ai.stream_text`. Options: `force` (default `false`, listed at SDK 9.29.0), `recordInputs` / `recordOutputs` (default `true`, listed at SDK 9.27.0). The same reference lists the integration itself at 10.53.0; confirm in the current docs.
- **Anthropic operations covered:** `messages.create`, `messages.stream`, `messages.countTokens`, `completions.create`, `beta.messages.create`.
- **Prompts may contain personal data.** `recordInputs` / `recordOutputs` default to `true` and are governed by `dataCollection.genAI`. Turn them off SDK-wide with `dataCollection: { genAI: { inputs: false, outputs: false } }`, or per integration, e.g. `openAIIntegration({ recordInputs: false, recordOutputs: false })`.
- **Never expose `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in the browser.**
- **Span attributes:** `gen_ai.request.model`, `gen_ai.request.reasoning_effort`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.usage.input_tokens.cached`, `gen_ai.usage.input_tokens.cache_write`, `gen_ai.usage.output_tokens.reasoning`. Cost estimates come from models.dev and OpenRouter: no volume discounts, no non-token charges, no estimate for unrecognized models.
- **Sampling below 1.0 may lose agent runs.** Use a `tracesSampler` that keeps 100% of `gen_ai` transactions (see [AI-MONITORING.md](AI-MONITORING.md#sampling)).
- **Conversations (Explore > Conversations):** `Sentry.setConversationId("conv_abc123")` sets `gen_ai.conversation.id`. It needs `streamGenAiSpans` (default `true`, SDK 10.61.0+) and genAI input and output capture on. One conversation can span many traces and one trace many conversations. `Sentry.setUser(...)` fills the User column; otherwise it shows "Unknown".

## Debugging

| Symptom | Fix |
|---|---|
| No transactions | Set `tracesSampleRate` or `tracesSampler` in all three configs |
| Server-only spans missing | `instrumentation.ts` loads the server config and exports `onRequestError` |
| Distributed trace not linking | Add the backend URL to `tracePropagationTargets`; allow `sentry-trace, baggage` in CORS |
| SSR not linked to the client | Client and server use the same DSN |
| Raw URLs in transaction names | `beforeStartSpan` replacing `/\d+/g` with `/<id>` |
| Replay not recording | `replayIntegration()` in `instrumentation-client.ts` `integrations` |
| Logs not linked to traces | `tracesSampleRate` > 0 and the log is emitted inside an active span |
| Too many logs | Drop `trace` and `debug` in `beforeSendLog` |
| Edge logs missing | `enableLogs: true` in `sentry.edge.config.ts` |
| High server CPU from profiling | Lower to 0.1 or 0.05 and set `SENTRY_PROFILER_LOGGING_MODE=lazy` |
| Minified flame graphs | Upload source maps |
| Cron "missed" although it ran | Raise `checkinMargin`, check clock skew |
| Cron "timeout" | Raise `maxRuntime` |
| Vercel AI spans named `ai.streamText` | `vercelAIIntegration({ force: true })` |

## Prove it

- **Tracing in every runtime:** a page load, an API route and a middleware request each produce a transaction; a Server Action wrapped in `withServerActionInstrumentation` appears as a span named after the action.
- **One trace end to end:** a client fetch to the backend carries `sentry-trace` and `baggage`, and the backend's spans join the same trace.
- **Replay:** with `replaysSessionSampleRate: 1.0` in development, a session shows in the Replays tab with text and inputs masked; a thrown error in an unsampled session still uploads its buffered replay.
- **Logs:** a `Sentry.logger.info` call from client, server and edge each appears in Logs, and one emitted inside a span links to its trace.
- **Metrics:** a `Sentry.metrics.count` from a route handler appears, with only bounded attributes; serverless handlers `await Sentry.flush(2000)`.
- **Profiling:** responses carry `Document-Policy: js-profiling`, a Chrome page load produces a profile, and `@sentry/profiling-node` matches the `@sentry/nextjs` version exactly in `package.json`.
- **Crons:** a `withMonitor` job shows `in_progress` then `ok`; making it throw shows `error`.
- **AI:** an LLM call shows under AI > Agents with model and token counts; with `dataCollection.genAI` off, no prompt text is stored.
