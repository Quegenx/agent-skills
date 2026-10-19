# Sentry for Node.js, Bun and Deno

Server-side Sentry for Node.js (`@sentry/node`, with Express, Fastify, Koa, Hapi, Connect or plain `http`), Bun (`@sentry/bun`) and Deno (`@sentry/deno`): setup, configuration, errors, logs, metrics, runtime metrics and crons. Bun, Deno and the OTLP light SDK specifics, supported Node versions and server tunnel checks are in [NODE-RUNTIMES-AND-DELIVERY.md](NODE-RUNTIMES-AND-DELIVERY.md). Tracing, profiling and AI monitoring are in [NODE-TRACING.md](NODE-TRACING.md); NestJS is [NESTJS.md](NESTJS.md); Cloudflare Workers is [CLOUDFLARE.md](CLOUDFLARE.md). One mechanism decides most outcomes: `@sentry/node` patches modules at import time through OpenTelemetry, so the instrument file must load before your framework, database driver and any HTTP client. Anything loaded earlier is not instrumented, and events silently go missing.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Versions](#versions) · [Pick the setup](#pick-the-setup) · [Node.js setup](#nodejs-setup) · [Framework error handlers](#framework-error-handlers) · [Configuration](#configuration) · [Capturing errors](#capturing-errors) · [Scopes and context](#scopes-and-context) · [Breadcrumbs](#breadcrumbs) · [Filtering and grouping](#filtering-and-grouping) · [Request data and linked errors](#request-data-and-linked-errors) · [Shutdown and flushing](#shutdown-and-flushing) · [Logs](SIGNALS-PRACTICE.md#logs) · [Metrics](SIGNALS-PRACTICE.md#application-metrics) · [Runtime metrics](#runtime-metrics) · [Crons](#crons) · [Source maps](#source-maps) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Versions

Versions at the time of writing: `@sentry/node`, `@sentry/bun` and `@sentry/deno` >=10.42.0. Verify against https://docs.sentry.io/platforms/javascript/guides/node/ before implementing.

| Feature | Minimum |
|---|---|
| Error monitoring | `@sentry/node`, `@sentry/nestjs`, `@sentry/bun` >=8.0.0 (Bun is a thin wrapper over `@sentry/node`); Deno `npm:@sentry/deno` on Deno 2+ |
| Tracing | `@sentry/node` >=8.0.0; `ignoreSpans` >=8.x; `inheritOrSampleWith` >=9.x |
| Logs | GA >=9.41.0; experimental from 9.10.0 via `_experiments.enableLogs`; console multi-argument parsing >=10.13.0; Consola reporter >=10.12.0; scope attributes on logs >=10.32.0 |
| Metrics | `enableMetrics` and `beforeSendMetric` >=10.24.0; stable `Sentry.metrics.*` >=10.25.0; scope attributes on metrics >=10.33.0 |
| Crons | `captureCheckIn`, `withMonitor` >=7.51.1 (the NestJS skill says `withMonitor()` needs 7.76.0+; confirm in the current docs); `instrumentNodeCron`, `instrumentCron` >=7.92.0; `instrumentNodeSchedule` >=7.93.0; `failureIssueThreshold`, `recoveryThreshold` >=8.7.0; `isolateTrace` >=10.28.0 |
| AI monitoring | `@sentry/node` >=10.61.0 (Gen AI span streaming on by default); the integrations exist since 10.53.0 |
| `dataCollection` option | >=10.57.0, replaces deprecated `sendDefaultPii` (the NestJS skill gives this version) |

- **Breaking changes to know:** SDK v8 removed `Hub` (use the three scope types directly) and is built natively on OpenTelemetry. Metrics v10 has no `increment()` (renamed to `count()`) and no `set()` (removed, no equivalent: use `count()` with bounded attributes). The `deno.land/x/sentry` registry is deprecated and frozen at v8.55.0; Deno 1.x is not supported. With `@opentelemetry/instrumentation-undici@0.22.0`, response headers such as `content-length` are no longer captured automatically on fetch/undici spans.
- **Other frameworks have their own SDK:** NestJS uses `@sentry/nestjs` ([NESTJS.md](NESTJS.md)); Next.js uses its own SDK with browser, server and edge runtimes and `withSentryConfig` ([NEXTJS.md](NEXTJS.md)).

## Pick the setup

Detect the runtime, framework and libraries first:

```bash
# Detect runtime
bun --version 2>/dev/null && echo "Bun detected"
deno --version 2>/dev/null && echo "Deno detected"
node --version 2>/dev/null && echo "Node.js detected"

# Detect existing Sentry packages
cat package.json 2>/dev/null | grep -E '"@sentry/'
cat deno.json deno.jsonc 2>/dev/null | grep -i sentry

# Detect Node.js framework
cat package.json 2>/dev/null | grep -E '"express"|"fastify"|"@hapi/hapi"|"koa"|"@nestjs/core"|"connect"'

# Detect Bun-specific frameworks
cat package.json 2>/dev/null | grep -E '"elysia"|"hono"'

# Detect Deno frameworks (deno.json imports)
cat deno.json deno.jsonc 2>/dev/null | grep -E '"oak"|"hono"|"fresh"'

# Detect module system (Node.js)
cat package.json 2>/dev/null | grep '"type"'
ls *.mjs *.cjs 2>/dev/null | head -5

# Detect existing instrument file
ls instrument.js instrument.mjs instrument.ts instrument.cjs 2>/dev/null

# Detect logging libraries
cat package.json 2>/dev/null | grep -E '"winston"|"pino"|"bunyan"'

# Detect cron / scheduling
cat package.json 2>/dev/null | grep -E '"node-cron"|"cron"|"agenda"|"bull"|"bullmq"'

# Detect AI / LLM usage
cat package.json 2>/dev/null | grep -E '"openai"|"@anthropic-ai"|"@langchain"|"@vercel/ai"|"@google/generative-ai"'

# Detect OpenTelemetry tracing
cat package.json 2>/dev/null | grep -E '"@opentelemetry/sdk-node"|"@opentelemetry/sdk-trace-node"|"@opentelemetry/sdk-trace-base"'
grep -rn "NodeTracerProvider\|trace\.getTracer\|startActiveSpan" \
  --include="*.ts" --include="*.js" --include="*.mjs" 2>/dev/null | head -5

# Check for companion frontend
ls frontend/ web/ client/ ui/ 2>/dev/null
cat package.json 2>/dev/null | grep -E '"react"|"vue"|"svelte"|"next"'
```

- **What the results decide:** the runtime picks the package, the init and the preload flag. Node ESM needs `--import ./instrument.mjs`; CJS uses `require("./instrument")`. An existing `instrument.js` or `.mjs` gets merged into, never overwritten. OpenTelemetry tracing already in place means the [OTLP path](NODE-RUNTIMES-AND-DELIVERY.md#otlp-path-for-opentelemetry-first-projects) instead of native tracing.
- **What to turn on:**

| Feature | When |
|---|---|
| Error monitoring | Always: the non-negotiable baseline |
| Tracing | Always for server apps; skip when OpenTelemetry tracing is detected (use the OTLP path) |
| Logs | winston, pino or bunyan present, or log-to-trace correlation wanted |
| Profiling | Node.js only; skip on the OTLP path (it needs `tracesSampleRate`) |
| AI monitoring | OpenAI, Anthropic, LangChain, Vercel AI, Google GenAI present |
| Crons | node-cron, Bull, BullMQ, Agenda present |
| Metrics | Custom counters, gauges, histograms |
| Runtime metrics | Any Node.js or Bun service |

- **Lead with a proposal, not an open question:** "I recommend setting up Error Monitoring + Tracing. Want me to also add Logging or Profiling?"

## Node.js setup

- **The wizard (user runs it):** `npx @sentry/wizard@latest -i node`. It is interactive and opens a browser to log in; it handles org and project selection, SDK install, creating `instrument.js` and updating `package.json` scripts. There is no wizard for Bun or Deno.
- **Manual install:**

```bash
npm install @sentry/node --save
# or
yarn add @sentry/node
# or
pnpm add @sentry/node
```

- **The instrument file (CommonJS `instrument.js`).** The ESM `instrument.mjs` is identical with `import * as Sentry from "@sentry/node";`.

```javascript
// instrument.js: must be loaded before all other modules
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "___DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // 100% in dev, lower in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Capture local variable values in stack frames
  includeLocalVariables: true,

  enableLogs: true,
});
```

- **Load it first, CJS:** `require("./instrument"); // must be first` as line 1 of the entry file.
- **Load it first, ESM:** `node --import ./instrument.mjs app.mjs` (Node.js 18.19.0+; another reference says 18.19+ or 19.9+). An `import "./instrument.mjs"` inside the app is not enough for ESM: use `--import`.

```json
"start": "node --import ./instrument.mjs server.mjs",
"dev": "node --import ./instrument.mjs --watch server.mjs"
```

- **Or through the environment:** `NODE_OPTIONS="--import ./instrument.mjs" npm start`.

## Framework error handlers

Placement differs per framework, and getting it wrong silently misses errors.

| Framework | Function | Placement | Async |
|---|---|---|---|
| Express | `setupExpressErrorHandler(app)` | After all routes, before your own error handler | No |
| Fastify | `setupFastifyErrorHandler(fastify)` | Before routes | No |
| Koa | `setupKoaErrorHandler(app)` | First middleware | No |
| Hapi | `setupHapiErrorHandler(server)` | Before `server.start()` (another reference says before routes) | Yes: must `await` |
| Connect | `setupConnectErrorHandler(app)` | Before routes | No |

- **Express** captures 5xx by default. To change it, pass `shouldHandleError`. The references differ in spirit: the SDK overview shows also capturing 4xx with `shouldHandleError(error) { return error.status >= 400; }`; the error reference (below) shows `return !error.status || parseInt(String(error.status)) >= 500;`.

```javascript
require("./instrument");
const express = require("express");
const Sentry = require("@sentry/node");

const app = express();
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ ok: true }));
app.post("/orders", async (req, res, next) => {
  try {
    const result = await processOrder(req.body.orderId);
    res.json(result);
  } catch (err) {
    next(err); // pass to error handlers
  }
});

// ↓ Sentry AFTER routes, BEFORE your error handler
Sentry.setupExpressErrorHandler(app);

// Optional: capture only specific status codes
// Sentry.setupExpressErrorHandler(app, {
//   shouldHandleError(error) {
//     return !error.status || parseInt(String(error.status)) >= 500;
//   },
// });

// ── Your error handler (runs after Sentry) ──────────────────────
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: "Internal Server Error" });
});

app.listen(3000);
```

- **Fastify** registers a plugin on the `onError` lifecycle hook. Option: `shouldHandleError(error, request, reply) { return reply.statusCode >= 500; }`.
- **Koa** has no `shouldHandleError` option: it captures all errors.
- **Hapi** registers a lifecycle extension on `onPreResponse` and is the only async handler. Forgetting `await` silently skips Sentry registration; no error is thrown.
- **Plain `http`:** wrap the handler in `Sentry.withIsolationScope(() => { try {...} catch (err) { Sentry.captureException(err); ... } })`. Without a framework integration you rely on the global `uncaughtException` and `unhandledRejection` handlers plus manual `captureException(err, { tags: { path: req.url, method: req.method } })`.

## Configuration

| Option | Default | Notes |
|---|---|---|
| `dsn` | none | Required; or `SENTRY_DSN` |
| `tracesSampleRate` | none | 0 to 1; required to enable tracing; never on the OTLP path |
| `dataCollection` | see below | `userInfo`, `cookies`, `httpHeaders`, `httpBodies`, `urlQueryParams`, `genAI` |
| `includeLocalVariables` | `false` | Local variable values in stack frames |
| `enableLogs` | [Versioned Logs rule](SIGNALS-PRACTICE.md#logs) | Logs (9.41.0+) |
| `environment` | `"production"` | Or `SENTRY_ENVIRONMENT` |
| `release` | none | Or `SENTRY_RELEASE` |
| `debug` | `false` | |
| `enabled` | `true` | Set `false` in tests |
| `sampleRate` | `1.0` | Fraction of error events sent |
| `shutdownTimeout` | `2000` | ms to flush before exit |
| `maxBreadcrumbs` | `100` | |
| `normalizeDepth` | `3` | |
| `attachStacktrace` | not stated | Stack traces on `captureMessage` |
| `skipOpenTelemetrySetup` | `false` | Keep it `false`: AI library instrumentation may require the setup |

Also: `serverName`, `maxValueLength`, `ignoreErrors`, `ignoreTransactions`, `beforeSend`, `beforeSendTransaction`, `beforeBreadcrumb`, `onFatalError`.

- **Privacy:** Use the [canonical JavaScript privacy schema and version distinction](JAVASCRIPT.md#datacollection). The old source applied omitted-object fallback semantics without the required SDK version boundary. [https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection] Platform capture behavior still depends on its installed integrations; explicitly disable categories you must not collect.
- **Environment variables:** `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` (auto-detected from git; the NestJS skill adds Heroku and CircleCI), `SENTRY_TRACES_SAMPLE_RATE`, `NODE_OPTIONS`; at build time `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

## Capturing errors

- **Captured automatically:** uncaught exceptions (`process.on("uncaughtException")`), unhandled rejections (`process.on("unhandledRejection")`), framework errors through the handlers above, and errors you catch and re-throw.
- **Not captured:** errors you catch and swallow. If you catch an error and don't re-throw it, Sentry never sees it: call `Sentry.captureException(err); return res.status(500)...`. Don't both re-throw and call `captureException`, or you get duplicate events.
- **`captureException(exception: unknown, captureContext?: CaptureContext | ((scope: Scope) => Scope)): string`** returns the event ID. `ScopeContext` keys: `user`, `level` (`"fatal" | "error" | "warning" | "log" | "info" | "debug"`), `extra`, `tags`, `contexts`, `fingerprint`. The callback form must `return scope`. Non-Error values are accepted with synthetic stack traces. Hand the ID to the client: `res.status(500).json({ error: "Something went wrong", eventId })`.

```javascript
// With inline CaptureContext
Sentry.captureException(error, {
  level: "fatal",
  tags: { order_id: orderId, payment_method: "stripe" },
  user: { id: req.user.id, email: req.user.email },
  extra: { requestBody: req.body, retryCount: 3 },
  fingerprint: ["order-processing-failure", orderId],
  contexts: {
    order: { id: orderId, total: 99.99, currency: "USD" },
  },
});

// Scope callback form: most flexible
Sentry.captureException(error, (scope) => {
  scope.setTag("component", "payment");
  scope.setLevel("error");
  scope.setTransactionName("POST /orders");
  return scope; // must return scope
});
```

- **`captureMessage(message: string, captureContext?: CaptureContext | SeverityLevel): string`**, e.g. `Sentry.captureMessage("Disk usage above 90%", "warning");`, or a full `CaptureContext` (`level`, `tags`, `user`, `extra`, `fingerprint`) as the second argument.

## Scopes and context

| Scope | Get it | Lives for | Put here |
|---|---|---|---|
| Global | `Sentry.getGlobalScope()` | The process | App version, region, build ID |
| Isolation | `Sentry.getIsolationScope()` | One HTTP request (forked automatically through `AsyncLocalStorage`) | User identity, request metadata |
| Current | `Sentry.getCurrentScope()` | One operation or span | Per-operation data |

- **Priority is Current > Isolation > Global.** Every top-level `Sentry.setXXX()` writes to the isolation scope: `Sentry.setTag(...)` is `Sentry.getIsolationScope().setTag(...)`.
- **Where to set what:** all events, `getGlobalScope().setTag`; the current request, `Sentry.setTag`; one capture, `withScope`; a background job, worker or queue processor, `withIsolationScope(async (scope) => {...})`; inline, the second argument to `captureException`.
- **Never `setUser()` on the global scope:** it leaks between requests. Use `Sentry.setUser()` (isolation scope); `setUser(null)` clears it; custom fields are accepted.
- **`withScope` changes don't survive the callback:**

```javascript
Sentry.withScope((scope) => {
  scope.setTag("payment_method", "stripe");
  scope.setFingerprint(["stripe-payment-error"]);
  scope.setLevel("error");
  scope.setUser({ id: req.user.id });
  scope.setContext("cart", { items: req.body.items.length });
  scope.addBreadcrumb({ category: "payment", message: "Attempt #3", level: "info" });
  Sentry.captureException(stripeError);
  // All above ONLY applies to this one capture
});
```

- **Tags are indexed and searchable** (filter, group, alert): key max 32 characters from `[a-zA-Z0-9_.:-]`, value max 200 characters (the NestJS reference adds: no newlines). `Sentry.setTags({...})` sets several.
- **Context is not indexed:** `setContext("order", {...})` is normalized to 3 levels deep, the `type` key is reserved, `setContext("order", null)` clears it. `setExtra`/`setExtras` are also non-indexed; prefer `setContext` for structured objects. User is partially searchable.

## Breadcrumbs

- **Automatic:** outgoing `http`, `console`, and `db` (from OpenTelemetry).
- **Properties:** `type` (`"default" | "debug" | "error" | "info" | "http" | "navigation" | "query" | "ui" | "user"`), `category` (dot notation), `message`, `level`, `timestamp`, `data`.

```javascript
Sentry.addBreadcrumb({
  category: "auth",
  message: `User ${user.email} authenticated`,
  level: "info",
  data: { method: "oauth2", provider: "google" },
});
```

- **`beforeBreadcrumb(breadcrumb, hint)`:** drop health-check `http` crumbs, redact `token` and `api_key` query parameters, return `null` to drop.

```javascript
Sentry.init({
  beforeBreadcrumb(breadcrumb, hint) {
    // Drop health-check HTTP requests
    if (
      breadcrumb.type === "http" &&
      breadcrumb.data?.url?.includes("/health")
    ) {
      return null;
    }

    // Redact auth tokens from URLs
    if (breadcrumb.type === "http" && breadcrumb.data?.url) {
      try {
        const url = new URL(breadcrumb.data.url);
        url.searchParams.delete("token");
        url.searchParams.delete("api_key");
        breadcrumb.data.url = url.toString();
      } catch {}
    }

    return breadcrumb;
  },
  maxBreadcrumbs: 50, // default: 100
});
```

## Filtering and grouping

- **`beforeSend(event, hint)`** is the last hook, after all event processors. Only one is allowed. Return `null` to drop; returning `undefined` causes silent failures. `hint.originalException` holds the error.

```javascript
Sentry.init({
  beforeSend(event, hint) {
    const err = hint.originalException;

    // Drop in development
    if (process.env.NODE_ENV === "development") return null;

    // Drop specific error types
    if (err instanceof ConnectionResetError) return null;
    if (err?.message?.includes("ECONNRESET")) return null;

    // Scrub PII from user object
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Scrub sensitive keys from request body
    if (event.request?.data) {
      try {
        const body = JSON.parse(event.request.data as string);
        delete body.password;
        delete body.token;
        event.request.data = JSON.stringify(body);
      } catch {}
    }

    // Custom fingerprint from error properties
    if (err instanceof ApiError) {
      event.fingerprint = ["api-error", String(err.statusCode), err.endpoint];
    }

    return event;
  },

  // Drop specific transaction/span events
  beforeSendTransaction(event) {
    if (event.transaction === "GET /health") return null;
    if (event.transaction === "GET /ping") return null;
    return event;
  },
});
```

- **Ignore lists:** `ignoreErrors: ["Non-Error exception captured", /^ECONNRESET/, /^ETIMEDOUT/, /^socket hang up/]`, `ignoreTransactions: ["GET /health", "GET /ping", "GET /metrics", /^GET \/internal\//]`.
- **Fingerprints decide grouping:** the same fingerprint means the same issue. Set it per capture (`{ fingerprint: [...] }`), with `scope.setFingerprint`, or globally in `beforeSend`. Extend the default rather than replacing it: `["{{ default }}", err.code]`. Template variables: `{{ default }}` (Sentry's normally computed hash), `{{ transaction }}`, `{{ function }}` (top function in the stack trace), `{{ type }}` (exception type name). Grouping across platforms is in [ISSUES-AND-ALERTS.md](ISSUES-AND-ALERTS.md).

- **Event processors:** `Sentry.addEventProcessor((event, hint) => ...)` can be registered any number of times, may be async, run in undefined order before `beforeSend`, and drop the event by returning `null`. `scope.addEventProcessor` inside `withScope` applies to one capture.

## Request data and linked errors

- **`requestDataIntegration` is on by default**, with the isolation scope forked per request through OpenTelemetry's `AsyncLocalStorage`. Always sent: url, method, headers (the auth header is scrubbed automatically), query_string. On by default and switched off through `dataCollection`: body (`httpBodies: []`), cookies (`cookies: false`), ip (`userInfo: false`). The explicit form: `Sentry.requestDataIntegration({ include: { cookies, data, headers, ip, query_string, url, user: { id: true, username: true, email: false } } })`.
- **`linkedErrorsIntegration` is on by default** and follows `Error.cause`: `Sentry.linkedErrorsIntegration({ key: "cause", limit: 5 })` (default depth 5).
- **`Sentry.extraErrorDataIntegration({ depth: 3 })`** captures the non-standard properties of Error subclasses into extras.

## Shutdown and flushing

- **Long-running servers:** in the SIGTERM handler, after `server.close`, `await Sentry.flush(2000)`; the graceful shutdown example uses `await Sentry.close(2000); process.exit(0);`.
- **Serverless:** `await Sentry.close(2000)` (flush and disable) or `await Sentry.flush(2000)` before returning. For AWS Lambda prefer `@sentry/aws-serverless`.

## Logs

Use the [shared JavaScript Logs API, source examples, filtering and logger integrations](SIGNALS-PRACTICE.md#logs). Keep server request isolation in this file and flush in serverless handlers before returning. [getsentry/sentry-for-ai, sentry-node-sdk]

## Metrics

Use the [shared JavaScript Application Metrics API and source alternatives](SIGNALS-PRACTICE.md#application-metrics). Node runtime-health collection is a separate integration below. [getsentry/sentry-for-ai, sentry-node-sdk]

## Runtime metrics

- **Node:** `Sentry.nodeRuntimeMetricsIntegration()`; **Bun:** `bunRuntimeMetricsIntegration()` from `@sentry/bun`. Default `collectionIntervalMs` is 30000 (e.g. `{ collectionIntervalMs: 60_000 }`). Deno has none.
- **Node metrics:** `node.runtime.mem.rss`, `node.runtime.mem.heap_used`, `node.runtime.mem.heap_total`, `node.runtime.cpu.utilization`, `node.runtime.event_loop.delay.p50`, `node.runtime.event_loop.delay.p99`, `node.runtime.event_loop.utilization`, `node.runtime.process.uptime`. Bun reports the same under `bun.runtime.*` minus the event loop delay percentiles.

## Crons

A monitor alerts on a missed start (outside `checkinMargin`), a timeout (past `maxRuntime`) and a failure (status `"error"`).

- **`Sentry.withMonitor(slug, callback, monitorConfig?)` is the recommended form:** it sends `in_progress`, then `ok` or `error`, and records the duration. The job must throw on failure for the status to be right.
- **`Sentry.captureCheckIn(checkIn, monitorConfig?) -> string`** for heartbeats (`{ monitorSlug, status: "ok" | "error" }`) or two steps: `in_progress` returns a `checkInId`, then finish with `{ checkInId, monitorSlug, status, duration }` (seconds). Both check-ins must share the `checkInId`. The heartbeat form records no duration. The NestJS reference adds: for jobs longer than `maxRuntime`, send periodic `in_progress` heartbeats to reset the TIMEOUT timer.

```typescript
const checkInId = Sentry.captureCheckIn({
  monitorSlug: "my-cron-job",
  status: "in_progress",
});

const startTime = Date.now();

try {
  await runMyJob();
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: "my-cron-job",
    status: "ok",
    duration: (Date.now() - startTime) / 1000,  // seconds
  });
} catch (err) {
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: "my-cron-job",
    status: "error",
    duration: (Date.now() - startTime) / 1000,
  });
  throw err;
}
```

- **`MonitorConfig` is an upsert:** the first check-in carrying it creates the monitor, later ones update it; without a `MonitorConfig` no monitor is created. It is the second argument to `captureCheckIn` and the third to `withMonitor`.

| Field | Meaning |
|---|---|
| `schedule` (required) | `{ type: "crontab", value: "0 * * * *" }` or `{ type: "interval", value: 30, unit: "minute" }`; units `"year" \| "month" \| "week" \| "day" \| "hour" \| "minute"` |
| `checkinMargin` | Minutes: grace period before a "missed" alert |
| `maxRuntime` | Minutes: max execution before a timeout alert |
| `timezone` | IANA name, e.g. `"America/New_York"` (the NestJS and Cloudflare references give the default as `"UTC"`) |
| `failureIssueThreshold` | Consecutive failures before an issue opens |
| `recoveryThreshold` | Consecutive successes to resolve it |
| `isolateTrace` | Separate trace per run (>=10.28.0) |

- **Scheduler helpers:** `Sentry.cron.instrumentNodeCron(cron)` (node-cron; the `name` option is required and becomes the slug; accepts `monitorConfig?: Pick<MonitorConfig, "isolateTrace">`); `Sentry.cron.instrumentCron(CronJob, "my-cron-job")` (cron; slug bound at instrumentation, one slug per constructor; works with the constructor and `.from({ cronTime, onTick })`); `Sentry.cron.instrumentNodeSchedule(schedule)` (node-schedule; the first argument to `scheduleJob` must be the slug). Agenda, Bull and BullMQ have no helper: wrap the job in `withMonitor`.
- **Serverless:** `finally { await Sentry.flush(2000); }`.
- **Rate limit:** max 6 check-ins per minute per monitor and environment (environments count separately); dropped check-ins appear in Usage Stats.
- **Tuning (NestJS reference):** MISSED too early, raise `checkinMargin`; TIMEOUT on slow jobs, raise `maxRuntime` or send heartbeats.

## Source maps

Compiled TypeScript needs source maps uploaded for readable stack traces (`SENTRY_AUTH_TOKEN` is a build-time secret). With the CLI:

```json
{
  "scripts": {
    "build": "tsc && sentry-cli sourcemaps inject ./dist && sentry-cli sourcemaps upload ./dist"
  }
}
```

The webpack, esbuild and rollup plugins also work. Releases, upload and debug IDs are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## Troubleshooting

| Symptom | Fix |
|---|---|
| No events at all | Instrument file loaded too late: make it first (`--import`, `--preload`, or the first `require`) |
| Express errors missed | Handler after the routes |
| Fastify errors missed | Handler before the routes |
| Hapi errors missed | `await setupHapiErrorHandler(server)` |
| Deno events not sent | Missing `--allow-net` |
| Events lost on shutdown | `await Sentry.close(2000)` in SIGTERM and SIGINT |
| `includeLocalVariables` empty | Enable it; check source maps |
| Stack traces show minified code | Upload source maps in the build ([Source maps](#source-maps)) |
| Breadcrumbs not showing | `maxBreadcrumbs: 0` in init (default is 100) |
| `Sentry.logger` undefined | SDK below 9.41.0 |
| Console logs not in Logs | Add `consoleLoggingIntegration()` to `integrations` |
| Log attributes not searchable | Complex objects as values: use only `string`, `number`, `boolean` |
| Cron duration always `undefined` | Heartbeat pattern: switch to start/finish or `withMonitor` |
| `Sentry.metrics` undefined | SDK below 10.25.0 |
| Metrics dropped silently | Attribute envelope over 2 KB: fewer or smaller `attributes` (the NestJS reference also says check `beforeSendMetric` and special characters in the name) |
| Background job context leaking into request errors | Wrap the job in `withIsolationScope` |

Tracing, OTLP and profiling problems are in [NODE-TRACING.md](NODE-TRACING.md#troubleshooting).

## Prove it

- **Load order:** the start script uses `--import ./instrument.mjs` (ESM), `--preload ./instrument.ts` (Bun), or `require("./instrument")` on line 1 (CJS); in Deno the Sentry import is the first line.
- **A test error arrives:** `Sentry.captureException(new Error("Sentry test error - delete me"))` appears in Issues within about 30 seconds with a readable stack trace and local variables, and the Performance tab shows HTTP spans; delete the call afterwards.
- **The framework handler catches route errors:** a route that throws produces an issue; for Express the handler sits after the routes, for Fastify before them, for Hapi it is awaited.
- **Request isolation holds:** two concurrent requests with different `Sentry.setUser()` values each produce an event with their own user.
- **Privacy is explicit:** `dataCollection` lists every category you rely on, and a sample event shows no body, cookie or IP you meant to drop.
- **Nothing is lost on exit:** send SIGTERM after a captured error; the event still arrives.
- **Logs and metrics:** with `enableLogs: true`, one `Sentry.logger.info(Sentry.logger.fmt...)` line shows its template and parameter attributes; one `Sentry.metrics.count` appears; with `debug: true` no drop warnings appear.
- **Crons:** a `withMonitor` job creates its monitor on the first run; a deliberately thrown error marks the check-in `error`.
