# Sentry for Cloudflare Workers, Pages and Durable Objects

`@sentry/cloudflare` covers Workers, Pages Functions, Hono on Workers, Durable Objects, Workflows, D1, Queues and cron triggers. It is a different SDK from `@sentry/node` ([NODE.md](NODE.md)), with different defaults. The mechanism that decides most outcomes: you never call `Sentry.init()` yourself. A wrapper (`withSentry`, `sentryPagesPlugin`, the Hono `sentry` middleware, `instrumentDurableObjectWithSentry`, `instrumentWorkflowWithSentry`) initializes per request from `env`, isolates each request in its own scope and flushes through `ctx.waitUntil()`. Code outside a wrapper loses events on short requests, and the SDK needs `AsyncLocalStorage`, so a compatibility flag is required.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Versions](#versions) · [Detect and recommend](#detect-and-recommend) · [Compatibility flag](#compatibility-flag) · [Workers](#workers) · [Pages](#pages) · [Hono](#hono) · [Secrets, release and source maps](#secrets-release-and-source-maps) · [Configuration](#configuration) · [Errors](#errors) · [Tracing](#tracing) · [Logs](#logs) · [Crons](#crons) · [Durable Objects](#durable-objects) · [Workflows](#workflows) · [D1](#d1) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Versions

`@sentry/cloudflare` was v10.61.0 at the time of writing; verify against https://docs.sentry.io/platforms/javascript/guides/cloudflare/.

| Feature | Minimum |
|---|---|
| Base SDK, Durable Object instrumentation, D1, crons | 8.0.0 / v8.x |
| Logs | GA 9.41.0; experimental from 9.10.0 via `_experiments.enableLogs` |
| Hono integration, Queue/Email/Tail handlers, `instrumentPrototypeMethods`, Workflows, DO storage, streaming response spans, `propagateTraceparent`, OpenTelemetry compatibility tracer, auto-instrumented `scheduled` | v10.x |
| `@sentry/hono` | 10.55.0 (`honoIntegration` deprecated in 10.55.0) |
| D1 auto-instrumentation via `withSentry` | 10.57.0 (`instrumentD1WithSentry` deprecated, removed in the next major) |
| Synchronous DO KV storage spans | 10.59.0 |
| D1 `batch`, `exec`, `withSession`; DO SQL storage spans | 10.61.0 |

## Detect and recommend

```bash
# Detect Cloudflare project
ls wrangler.toml wrangler.jsonc wrangler.json 2>/dev/null

# Detect existing Sentry
cat package.json 2>/dev/null | grep -E '"@sentry/'

# Detect project type (Workers vs Pages)
ls functions/ functions/_middleware.js functions/_middleware.ts 2>/dev/null && echo "Pages detected"
cat wrangler.toml 2>/dev/null | grep -E 'main|pages_build_output_dir'

# Detect framework
cat package.json 2>/dev/null | grep -E '"hono"|"remix"|"astro"|"svelte"'

# Detect Durable Objects
cat wrangler.toml 2>/dev/null | grep -i 'durable_objects'

# Detect D1 databases
cat wrangler.toml 2>/dev/null | grep -i 'd1_databases'

# Detect Queues
cat wrangler.toml 2>/dev/null | grep -i 'queues'

# Detect Workflows
cat wrangler.toml 2>/dev/null | grep -i 'workflows'

# Detect Scheduled handlers (cron triggers)
cat wrangler.toml 2>/dev/null | grep -i 'crons\|triggers'

# Detect compatibility flags
cat wrangler.toml 2>/dev/null | grep -i 'compatibility_flags'
cat wrangler.jsonc 2>/dev/null | grep -i 'compatibility_flags'

# Detect AI/LLM libraries
cat package.json 2>/dev/null | grep -E '"openai"|"@anthropic-ai"|"ai"|"@google/generative-ai"|"@langchain"'

# Detect logging libraries
cat package.json 2>/dev/null | grep -E '"pino"|"winston"'

# Check for companion frontend
ls frontend/ web/ client/ 2>/dev/null
cat package.json 2>/dev/null | grep -E '"react"|"vue"|"svelte"|"next"'
```

| Found | Use |
|---|---|
| Worker | `withSentry` |
| Pages | `sentryPagesPlugin` |
| Hono | `@sentry/hono` (10.55.0+) |
| Durable Objects | `instrumentDurableObjectWithSentry` |
| D1 | Automatic (10.57.0+) |
| Queues | Automatic |
| Workflows | `instrumentWorkflowWithSentry` |
| Cron triggers | Automatic span; add Crons monitoring |

Always turn on error monitoring and tracing; offer logs, crons, D1, Durable Objects, Workflows, AI monitoring (Vercel AI SDK, OpenAI, Anthropic, LangChain) and metrics. Lead with a proposal: "I recommend setting up Error Monitoring + Tracing. Want me to also add D1 instrumentation and Crons monitoring?" There is no Cloudflare wizard: `npx @sentry/wizard@latest -i sourcemaps` (the user runs it) sets up only source map upload, not SDK init.

## Compatibility flag

```toml
compatibility_flags = ["nodejs_als"]
# or: compatibility_flags = ["nodejs_compat"]
```

In `wrangler.jsonc`:

```jsonc
{
  "compatibility_flags": ["nodejs_als"]
}
```

The SDK needs `AsyncLocalStorage`. `nodejs_als` is lighter (only ALS); use `nodejs_compat` if you need other Node APIs. Without either: `AsyncLocalStorage is not defined`.

## Workers

```bash
npm install @sentry/cloudflare
```

```typescript
import * as Sentry from "@sentry/cloudflare";

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    enableLogs: true,
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  }),
  {
    async fetch(request, env, ctx) {
      return new Response("Hello World!");
    },
  } satisfies ExportedHandler<Env>,
);
```

- **One wrapper covers every handler:** `withSentry` instruments `fetch`, `scheduled`, `queue`, `email` and `tail`. The first argument is a callback receiving `env`. Wrap the entire exported handler object, or `scheduled` and the others go unmonitored.
- **Never nest `withSentry`:** it produces duplicate events.

## Pages

```typescript
// functions/_middleware.ts
import * as Sentry from "@sentry/cloudflare";

export const onRequest = Sentry.sentryPagesPlugin((context) => ({
  dsn: context.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
}));
```

- **Chain with Sentry first:** `export const onRequest = [ Sentry.sentryPagesPlugin(...), /* more */ ];`.
- **Errors are captured and re-thrown** (your error responses still work) and flushed through `ctx.waitUntil()`.
- SvelteKit-on-Pages integration is skipped under the selected-stack rule. [user standing rules; getsentry/sentry-for-ai, sentry-cloudflare-sdk]

## Hono

```bash
npm install @sentry/hono @sentry/cloudflare
```

```typescript
import { Hono } from "hono";
import { sentry } from "@sentry/hono/cloudflare";

type Bindings = { SENTRY_DSN: string };

const app = new Hono<{ Bindings: Bindings }>();

// Initialize Sentry middleware as early as possible
app.use(
  sentry(app, (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  })),
);

app.get("/", (ctx) => ctx.json({ message: "Hello" }));

app.get("/error", () => {
  throw new Error("Test error");
});

export default app;
```

- **Keep `@sentry/cloudflare` (a peer dependency) in sync with `@sentry/hono`.** The middleware captures errors (including Hono `onError`) and names transaction spans with route patterns.
- **Legacy:** `Sentry.withSentry(optsFn, app)` still works, but its `honoIntegration` is deprecated since 10.55.0.

## Secrets, release and source maps

- **The DSN is public; SENTRY_AUTH_TOKEN is secret.** A DSN permits event submission, not reading stored data. A Cloudflare secret binding is an optional storage choice, not required because the DSN is confidential. The old source falsely called source-controlled DSN vars secret exposure. Keep actual auth tokens out of chat, tool output and source control. [https://docs.sentry.io/concepts/key-terms/dsn-explainer/]
- **Release from version metadata:** add `[version_metadata]` with `binding = "CF_VERSION_METADATA"`. Priority: the `release` option, then `SENTRY_RELEASE`, then `CF_VERSION_METADATA.id`.
- **Source maps with Vite:** `npm install @sentry/vite-plugin --save-dev`, set `build: { sourcemap: true }` and add `sentryVitePlugin({ org, project, authToken: process.env.SENTRY_AUTH_TOKEN })`. Upload details and debug IDs are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## Configuration

| Option | Default / source | Notes |
|---|---|---|
| `dsn` | `env.SENTRY_DSN`, read automatically | |
| `tracesSampleRate` | `env.SENTRY_TRACES_SAMPLE_RATE` (parsed as float) | 0 to 1; 1.0 in dev, lower in production. Without it or `tracesSampler`, no spans are created |
| `tracesSampler` | | Mutually exclusive with `tracesSampleRate` |
| `dataCollection` | [Versioned JavaScript schema](JAVASCRIPT.md#datacollection) | Check Cloudflare integration-specific categories and explicit privacy settings |
| `sendDefaultPii` | `false` | Legacy |
| `enableLogs` | [Versioned Logs rule](SIGNALS-PRACTICE.md#logs) | |
| `environment` | `env.SENTRY_ENVIRONMENT` | |
| `release` | See above | |
| `debug` | `env.SENTRY_DEBUG` (`"true"` or `"1"`) | |
| `tunnel` | `env.SENTRY_TUNNEL` | |
| `beforeSend`, `beforeSendTransaction`, `beforeSendLog` | | |
| `tracePropagationTargets` | All URLs | Node server SDKs also propagate all outgoing requests by default; narrow targets deliberately [https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracePropagationTargets] |
| `skipOpenTelemetrySetup` | `false` | `true` opts out of the OpenTelemetry compatibility tracer |
| `instrumentPrototypeMethods` | `false` | `boolean \| string[]`, for Durable Objects |

- **Default integrations (`getDefaultIntegrations()`):** `dedupeIntegration` (disabled for Workflows), `inboundFiltersIntegration`, `functionToStringIntegration`, `linkedErrorsIntegration`, `fetchIntegration`, `honoIntegration` (deprecated 10.55.0), `requestDataIntegration`, `consoleIntegration` (console to breadcrumbs).

## Errors

- **Captured automatically in:** `fetch` (Workers and Pages), `scheduled`, `queue` (with queue metadata), `email`, Durable Object methods, Workflow steps, and Hono `onError`.
- **APIs:** `captureException(error, hint?)`; `captureMessage(message, level?)` with levels `"fatal"`, `"error"`, `"warning"`, `"info"`, `"debug"`; `captureEvent({ message, level, tags })`; `setUser({ id, email, ip_address: "{{auto}}" })`. Also: `setTag`/`setTags`, `setContext`, `setExtra`/`setExtras`, `setUser(null)` to clear, `addBreadcrumb`, `withScope`, `getCurrentScope`/`getIsolationScope`/`getGlobalScope`, and `beforeSend` and `ignoreErrors` in the wrapper's options. `fetchIntegration` makes breadcrumbs for outbound `fetch()` and `consoleIntegration` for `console.*`.
- **Don't catch and swallow silently:** if you catch an error to handle it gracefully, still call `Sentry.captureException(error)`.
- **Set by the SDK:** the `cloud_resource` context (`cloud.provider: "cloudflare"`), the `culture` context timezone from `request.cf.timezone`, and span attributes `network.protocol.name` (`request.cf.httpProtocol`), `http.request.body.size`, `user_agent.original`.
- **Isolation:** each request under `withSentry` or `sentryPagesPlugin` runs in its own isolation scope; `Sentry.isInitialized()` is `true` inside a handler.

## Tracing

- **Not natively OpenTelemetry-based,** but the SDK sets up an OpenTelemetry compatibility tracer, so spans made with `@opentelemetry/api` are captured.
- **Production sample rate, the references disagree:** the error reference says `0.1` to `0.5`, the tracing reference says start with `0.05` to `0.1`. Set it from `wrangler.toml` with `[vars] SENTRY_TRACES_SAMPLE_RATE = "0.1"`, or with a `tracesSampler` reading `samplingContext.attributes?.["url.full"]` (health checks `0`, `/api/` `0.2`, default `0.1`). General sampling guidance is in [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md).
- **`http.server` spans** carry `http.request.method`, `url.full`, `http.response.status_code`, `http.request.body.size`, `user_agent.original`, `network.protocol.name`. `OPTIONS` and `HEAD` requests create no spans (errors are still captured).
- **Streaming responses** (SSE, streaming AI) keep the root span alive until the stream is consumed.
- **Outbound `fetch()`** is traced by `fetchIntegration`, which injects `sentry-trace` and `baggage`, into every outbound request when `tracePropagationTargets` is unset. Set the targets so the headers don't leak to third parties. `propagateTraceparent: true` opts into the W3C `traceparent` header, under the propagation targets; it does not control `sentry-trace` as the source suggested. [https://develop.sentry.dev/sdk/telemetry/traces/trace-propagation/] Don't remove `fetchIntegration` from the defaults or fetch spans disappear.
- **Manual propagation:** spread `Sentry.getTraceData()` into fetch headers; for HTML responses `Sentry.getTraceMetaTags()` returns `<meta name="sentry-trace" .../><meta name="baggage" .../>`.
- **0 ms spans are expected for CPU-bound work:** Workers timers only advance during I/O.
- **Incoming traces continue automatically:** `withSentry` and `sentryPagesPlugin` read `sentry-trace` and `baggage` from incoming requests.
- **Custom spans:** `Sentry.startSpan`, `Sentry.startInactiveSpan` and `Sentry.startSpanManual` work here; always call `span.end()` on inactive and manual spans.

## Logs

- **Logger API:** use `Sentry.logger.<level>(message, attributes)` and the `Sentry.logger.fmt` tagged template for parameters, as in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#logs). The old Cloudflare source invented a printf-style params array before attributes. Use the [versioned JavaScript Logs rule](SIGNALS-PRACTICE.md#logs); the old source incorrectly described every version as opt-in. [https://docs.sentry.io/platforms/javascript/logs/]
- **Console:** the default `consoleIntegration` sends console output to breadcrumbs only; `Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] })` forwards it to Logs.
- **Logs link to the active trace** when tracing is on; with tracing off they carry no trace link.
- **Practice:** put searchable data in attributes; use format strings with parameters so Sentry groups similar logs; log what matters (auth, payments, external APIs, errors), not everything, and never in tight loops; keep `console.log` for local debugging; drop debug and trace in production with `beforeSendLog`.

## Crons

- **`scheduled` under `withSentry` gets a `faas.cron` span** with `faas.cron` (the expression), `faas.time` (ISO 8601) and `faas.trigger` = `"timer"`. Triggers live in `wrangler.toml`: `[triggers]` `crons = ["*/5 * * * *"]`.
- **For missed and failed run alerts, wrap the job in `withMonitor` inside `ctx.waitUntil()`:**

```typescript
async scheduled(controller, env, ctx) {
  ctx.waitUntil(
    Sentry.withMonitor("cleanup-old-records", async () => {
      await cleanupOldRecords(env.DB);
    }),
  );
},
```

- **Monitor config** (fields as in [NODE.md](NODE.md#crons): `schedule.type` `"crontab" | "interval"`, `schedule.value`, `schedule.unit` required for interval, `checkinMargin`, `maxRuntime` in minutes, `timezone` default `"UTC"`, `failureIssueThreshold`, `recoveryThreshold`). `schedule.value` must match `wrangler.toml`.
- **Practice:** `withMonitor` for most cases, wrapped in `ctx.waitUntil()` so the check-in flushes before the worker ends; supply the config to upsert monitors; descriptive slugs (`"daily-cleanup"`, not `"cron-1"`); `checkinMargin` slightly larger than scheduling jitter; `maxRuntime` longer than the p99 duration; with `captureCheckIn`, the `in_progress` and `ok`/`error` check-ins share one `checkInId`.

## Durable Objects

```typescript
import * as Sentry from "@sentry/cloudflare";
import { DurableObject } from "cloudflare:workers";

class MyDurableObjectBase extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/process") {
      await this.processData();
      return new Response("Processed");
    }

    return new Response("OK");
  }

  async alarm(): Promise<void> {
    await this.runMaintenance();
  }

  async processData(): Promise<void> {
    // Business logic: automatically instrumented as RPC span
    await this.ctx.storage.put("last-processed", Date.now());
  }
}

// Wrap the class with Sentry instrumentation
export const MyDurableObject = Sentry.instrumentDurableObjectWithSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  }),
  MyDurableObjectBase,
);
```

- **Export the wrapped class,** and make it the one `wrangler.toml` references. An unwrapped class reports no errors.
- **Instrumented:** `fetch` (`http.server`), `alarm`, `webSocketMessage`, `webSocketClose`, `webSocketError` (errors with `handled: false`), and instance methods (RPC, op `rpc`). By default only instance methods are instrumented; for methods on the prototype chain (RPC methods in a base class) set `instrumentPrototypeMethods: true` or, to limit overhead, an array such as `["myRpcMethod", "anotherMethod"]`.
- **Storage spans:** async `get`, `put`, `delete`, `list`, and sync KV `ctx.storage.kv.get/put/delete/list` (10.59.0+), named like `durable_object_storage_get` and `durable_object_storage_kv_get`.
- **SQL storage (10.61.0+):** each `ctx.storage.sql.exec()` becomes a `db.query` span with `db.system.name: "cloudflare-durable-object-sql"`, `db.operation.name: "exec"`, `db.query.text` (sanitized), `db.query.summary` (e.g. `"SELECT users"`) and `cloudflare.durable_object.query.bindings`. Call `.toArray()` on the cursor before `JSON.stringify`: a cursor stringifies to `"{}"`.

## Workflows

- **Wrap the class:** `Sentry.instrumentWorkflowWithSentry(optsFn, MyWorkflowBase)`, where the class extends `WorkflowEntrypoint` from `cloudflare:workers`. Without it, Workflows produce duplicates.
- **One trace per instance:** the SDK initializes per run and derives the trace ID from the workflow instance ID, so all steps share a trace, retries are separate spans, and sampling stays consistent.
- **Steps:** `step.do()` becomes a span with op `function.step.do` and attributes `cloudflare.workflow.timeout`, `cloudflare.workflow.retries.limit`, `cloudflare.workflow.retries.delay`, `cloudflare.workflow.retries.backoff`. Step errors are `handled: true`; dedupe is disabled. `step.sleep()`, `step.sleepUntil()` and `step.waitForEvent()` are not instrumented.

## D1

- **Automatic for `env` bindings under `withSentry` (10.57.0+).** `instrumentD1WithSentry(env.DB)` is deprecated and now a harmless no-op.
- **Traced:** `statement.first()`, `.run()`, `.all()`, `.raw()` (span name is the SQL) and `bind()`; from 10.61.0 also `db.batch([...])` (span `"D1 batch"`, `db.operation.name: "batch"`, `db.operation.batch.size`, `db.query.text` newline-joined), `db.exec(query)`, and `db.withSession("first-primary" | "first-unconstrained" | bookmark)` (returns the session synchronously; `session.prepare()` and `session.batch()` are traced).
- **Each call** creates a `db.query` span and a `query` breadcrumb with `db.operation.name` (`first`, `run`, `all`, `raw`, `batch`, `exec`), `cloudflare.d1.duration`, `cloudflare.d1.rows_read`, `cloudflare.d1.rows_written`. Query parameters are not captured (PII).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `AsyncLocalStorage is not defined` | Add `nodejs_als` or `nodejs_compat` |
| Events missing | `debug: true`; `wrangler secret list` shows `SENTRY_DSN` |
| Events lost on short requests | Use a wrapper so flushing goes through `ctx.waitUntil()` |
| Duplicate events | Nested `withSentry`; for Workflows, use `instrumentWorkflowWithSentry` |
| Hono errors missing | `app.use(sentry(app, options))` |
| Durable Object errors missing | Wrap and export the class with `instrumentDurableObjectWithSentry` |
| `scheduled` not monitored | `export default Sentry.withSentry(...)` must wrap the whole handler object |
| Release missing | Add `[version_metadata]` |
| Fetch spans missing | `fetchIntegration` was removed from the defaults |
| Trace headers not propagated | `tracePropagationTargets` doesn't include the target URL |
| Streaming response spans too short | Update the SDK (streaming tracking is v10.x) |
| D1 queries not traced | Handler not wrapped with `withSentry`, or the query doesn't go through the `env.DB` binding |
| RPC methods without spans | `instrumentPrototypeMethods: true` or a list of methods |
| Stack traces minified | Configure `@sentry/vite-plugin` or run `npx @sentry/wizard -i sourcemaps`; check `SENTRY_AUTH_TOKEN` in CI |
| Spans of 0 ms | Expected for CPU-bound work |

## Prove it

- **Compatibility and configured DSN:** wrangler has nodejs_als or nodejs_compat and the selected binding supplies the intended public DSN. A secret binding is optional; the old acceptance line incorrectly prohibited DSN vars. Actual auth tokens remain secret. [https://docs.sentry.io/concepts/key-terms/dsn-explainer/#dsn-utilization]
- **One wrapper, outermost:** the default export is `Sentry.withSentry(...)` (or `sentryPagesPlugin` first in the Pages chain, or `app.use(sentry(...))` first in Hono), never nested.
- **An error arrives:** a route that throws (like the Hono `/error` example) produces an issue with the `cloud_resource` context; inside the handler `Sentry.isInitialized()` is `true`.
- **A trace arrives:** one request shows an `http.server` span with `url.full` and `http.response.status_code`, plus child spans for `fetch` and D1 queries.
- **Headers stay home:** with `tracePropagationTargets` set, a call to a third-party URL carries no `sentry-trace` header.
- **Durable Objects and Workflows:** a DO method that throws produces an issue; a Workflow run shows every `step.do()` in one trace.
- **Crons:** after the next trigger, the `withMonitor` slug shows an `ok` check-in, and a forced throw shows `error`.
- **Release:** events carry the release from `CF_VERSION_METADATA` (or your `release`) and stack traces resolve through uploaded source maps.
