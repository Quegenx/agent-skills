# Sentry on Bun, Deno and the OTLP light SDK

Setup that differs from plain Node.js: Bun (`@sentry/bun`), Deno (`@sentry/deno`), and OpenTelemetry-first Node projects on `@sentry/node-core/light`, plus which Node versions the docs support and the delivery checks the JavaScript troubleshooting page gives for server SDKs. The shared setup, errors, logs, metrics and crons are in [NODE.md](NODE.md); tracing is in [NODE-TRACING.md](NODE-TRACING.md). What decides most outcomes is the same as on Node: Sentry must load before anything else, through `bun --preload` on Bun, as the first import on Deno, and through `--import` on the OTLP path.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

## Bun

- **Install and preload:** `bun add @sentry/bun`; write `instrument.ts` with `import * as Sentry from "@sentry/bun";` (the reference example drops `includeLocalVariables`). Start with `bun --preload ./instrument.ts server.ts`.

```typescript
// instrument.ts
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "___DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
});
```

```json
"start": "bun --preload ./instrument.ts server.ts",
"dev": "bun --watch --preload ./instrument.ts server.ts"
```

- **`Bun.serve()` is auto-instrumented** through a JavaScript Proxy: each request becomes an `http.server` transaction. Its errors have no setup handler: capture them in the `error(error)` callback with `Sentry.captureException(error)`.
- **Express, Fastify, Hono or Elysia on Bun:** import from `@sentry/bun`; it re-exports the `@sentry/node` error handler functions.

| Feature on Bun | Support |
|---|---|
| Errors, logs, metrics, crons (`withMonitor`), AI monitoring | Full |
| Tracing | Through `@sentry/node`'s OpenTelemetry: "most auto-instrumentations work" (the tracing reference says 99% identical to Node.js) |
| Runtime metrics | Full, but no event loop delay percentiles |
| Profiling | Not available: the `@sentry/profiling-node` native addon is incompatible |

## Deno

- **Deno 2.0+ (Deno 1.x is not supported), `npm:` specifier only;** the `deno.land/x/sentry` registry is deprecated and frozen at v8.55.0. There is no wizard for Bun or Deno. In `deno.json`: `"imports": { "@sentry/deno": "npm:@sentry/deno@10.42.0" }`, or `import * as Sentry from "npm:@sentry/deno";`.
- **No preload flag:** Sentry is the first import in the entry file and `Sentry.init()` runs before any other code. Read the DSN with `Deno.env.get("SENTRY_DSN")`.

```typescript
// main.ts: Sentry.init() must be called before any other code
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN") ?? "___DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  tracesSampleRate: Deno.env.get("DENO_ENV") === "development" ? 1.0 : 0.1,
  enableLogs: true,
});

// Your application code follows
Deno.serve({ port: 8000 }, (req) => {
  return new Response("Hello from Deno!");
});
```
- **Permissions:** `--allow-all` works in development but is not recommended for production. Another reference just says run with `--allow-net --allow-env --allow-read`.

```bash
deno run \
  --allow-net=o<ORG_ID>.ingest.sentry.io \
  --allow-read=./src \
  --allow-env=SENTRY_DSN,SENTRY_RELEASE \
  main.ts
```

- **No error handler helper** (no `setupExpressErrorHandler` equivalent): use try/catch plus `captureException`.
- **Crons:** `denoCronIntegration()` from `@sentry/deno` auto-monitors `Deno.cron()`. The slug is the first argument to `Deno.cron()`; it sends `in_progress` then `ok` or `error`, locally and on Deno Deploy.

| Feature on Deno | Support |
|---|---|
| Errors, logs, metrics, crons | Full |
| Tracing | Disputed: the SDK overview says automatic spans for `Deno.serve()` and `fetch`; the tracing reference says wrap `Deno.serve` handlers manually and that DB and queue auto-instrumentation are unavailable (Deno doesn't load Node.js OpenTelemetry instrumentations). Confirm in the current docs; manual span in [NODE-TRACING.md](NODE-TRACING.md#deno-and-bun) |
| AI monitoring | Partial: Vercel AI SDK works; OpenAI and Anthropic through `npm:` |
| Profiling, runtime metrics | No |

## OTLP path for OpenTelemetry-first projects

Node.js only. Use it only when OpenTelemetry tracing is already set up (`@opentelemetry/sdk-node` or `@opentelemetry/sdk-trace-node` in `package.json`, or `NodeTracerProvider` in source). `@sentry/node-core/light` does not bundle its own OpenTelemetry: it hooks into your existing `TracerProvider` and exports spans over OTLP. Do not set `tracesSampleRate`; OpenTelemetry controls sampling. Vendor-neutral OpenTelemetry is the [observability skill](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

| Scenario | Path |
|---|---|
| New project, no existing OpenTelemetry | Standard `@sentry/node` (built-in OpenTelemetry) |
| Existing OpenTelemetry, want Sentry tracing | `@sentry/node-core/light` + `otlpIntegration()` |
| Existing OpenTelemetry, sending to your own Collector | `@sentry/node-core/light` + `otlpIntegration({ collectorUrl })` |

```bash
npm install @sentry/node-core @opentelemetry/api @opentelemetry/sdk-trace-node @opentelemetry/sdk-trace-base
```

The `@opentelemetry/*` packages are peer dependencies; skip any the project already has. Start the app with the same `node --import ./instrument.mjs app.mjs` as standard Node. When OpenTelemetry is detected, propose: "I see OpenTelemetry tracing in the project. I recommend Sentry's OTLP integration for tracing (via your existing OTel setup) + Error Monitoring + Sentry Logging [+ Metrics/Crons/AI Monitoring if applicable]. Shall I proceed?"

```javascript
// instrument.mjs: load via --import flag before any other module
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import * as Sentry from '@sentry/node-core/light';
import { otlpIntegration } from '@sentry/node-core/light/otlp';

// Register the user's OTel TracerProvider first
const provider = new NodeTracerProvider();
provider.register();

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? '___DSN___',

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  enableLogs: true,

  // Do NOT set tracesSampleRate, OTel controls sampling
  integrations: [
    otlpIntegration({
      // Export OTel spans to Sentry via OTLP (default: true)
      setupOtlpTracesExporter: true,
    }),
  ],
});
```

- **`otlpIntegration()` options:** `setupOtlpTracesExporter` (boolean, default `true`; set `false` if you already export to your own Collector) and `collectorUrl` (string, default `undefined`; when set, spans go there instead of the DSN-derived endpoint, e.g. `otlpIntegration({ collectorUrl: 'http://localhost:4318/v1/traces' })`). It also registers the propagation context that links errors to OpenTelemetry traces.

| | Standard `@sentry/node` | Light `@sentry/node-core/light` |
|---|---|---|
| OpenTelemetry bundled | Yes | No |
| Sampling | `tracesSampleRate` | OpenTelemetry SDK |
| Auto-instrumentation | Built in | You manage it |
| Profiling | Available | Not compatible |
| Error to trace linking | Automatic | Automatic (via `otlpIntegration`) |
| Package size | Larger | Smaller |

## Supported Node versions and the docs setup

- **Node versions, the sources differ:** the Node docs page lists `>=20.19.0 <22.0.0 || >=22.12.0 <23.0.0 || >=23.2.0`; the SDK skill says ESM `--import` needs Node.js 18.19.0+ and lists the profiler for Node 18 to 24. Confirm in the current docs.
- **The docs page setup:** `npm install @sentry/node` (plus `@sentry/profiling-node` for profiling), an `instrument.(js|mjs)` with `Sentry.init`, loaded before the app with `node --import ./instrument.js app.js` (or the bundler setup docs). Its sample comment: "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing. We recommend adjusting this value in production". The `NodeRuntimeMetrics` integration collects runtime health metrics ([NODE.md](NODE.md#runtime-metrics)).

## Delivery checks from the JavaScript troubleshooting page

- **SDK not sending:** check the DSN, environment variable prefixes, ad-blockers, `debug: true`, and quota in Stats and Subscription.
- **`maxValueLength`** defaults to undefined: nothing is truncated.
- **`tunnel` on a server SDK:** `@sentry/node` and `@sentry/bun` need an absolute URL (browsers can use a relative one such as `tunnel: "/tunnel"`). `tunnel` exists since 6.7.0. A tunnel server you write must validate known project IDs and the host, then POST to `https://{dsn.Host}/api/{projectId}/envelope/`.

## Prove it

- **Load order:** the Bun start script uses `--preload ./instrument.ts`; in Deno the Sentry import is the first line; the OTLP path loads through `--import ./instrument.mjs`.
- **Deno can send:** `deno run` has `--allow-net` for your ingest host, and a test `captureException` arrives.
- **OTLP path:** `tracesSampleRate` appears nowhere in the init, `otlpIntegration()` is in `integrations`, and an error thrown inside an OpenTelemetry span is linked to that trace.
- **Node version:** `node --version` falls in the range the current docs list.
