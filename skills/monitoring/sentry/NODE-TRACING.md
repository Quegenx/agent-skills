# Sentry tracing, profiling and AI monitoring on Node.js

Performance data for Node.js, Bun and Deno services: automatic and custom spans, sampling, distributed tracing across HTTP and queues, CPU profiling, and LLM call monitoring. Setup, errors, logs, metrics and crons are in [NODE.md](NODE.md); NestJS specifics are in [NESTJS.md](NESTJS.md). The mechanism: `Sentry.init()` makes Sentry the OpenTelemetry provider, registering `SentrySpanProcessor`, `SentryPropagator` (`sentry-trace` plus `baggage`), `SentrySampler` and `SentryContextManager` (`AsyncLocalStorage`). Any OpenTelemetry-compatible library therefore produces spans in Sentry, but only for modules loaded after the instrument file, and only when a sample rate or sampler is set. Vendor-neutral OpenTelemetry is the [observability skill](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Turning tracing on](#turning-tracing-on) · [Sampling](#sampling) · [What is traced automatically](#what-is-traced-automatically) · [Custom spans](#custom-spans) · [Enriching and filtering spans](#enriching-and-filtering-spans) · [Distributed tracing](#distributed-tracing) · [Deno and Bun](#deno-and-bun) · [Profiling](#profiling) · [AI monitoring](#ai-monitoring) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Turning tracing on

- **Set `tracesSampleRate` or `tracesSampler`; omit both to disable tracing.** `tracesSampleRate: 0` is not the same as disabled: it activates the OpenTelemetry machinery but drops every trace.
- **On the OTLP path** (`@sentry/node-core/light`) never set `tracesSampleRate`: OpenTelemetry samples (see [NODE-RUNTIMES-AND-DELIVERY.md](NODE-RUNTIMES-AND-DELIVERY.md#otlp-path-for-opentelemetry-first-projects)).
- **The instrument example** uses `tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1`; the env var `SENTRY_TRACES_SAMPLE_RATE` also exists.

## Sampling

- **Precedence:** 1, `tracesSampler`; 2, the parent's decision from `sentry-trace`; 3, `tracesSampleRate`. Sampling is head-based: the originating service decides and every downstream service samples or drops the whole trace.
- **`tracesSampler` gets `SamplingContext { name, attributes, parentSampled, parentSampleRate, inheritOrSampleWith(fallbackRate) }`.** Always prefer `inheritOrSampleWith` over checking `parentSampled` directly: it propagates rates accurately and sets `sentry-sampled` in `baggage`.

```typescript
Sentry.init({
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    // Always drop health checks
    if (name.includes("/health") || name.includes("/ping")) return 0;

    // Always sample critical flows
    if (name.includes("/checkout") || name.includes("/payment")) return 1.0;

    // Honor parent's decision, fall back to 10%
    return inheritOrSampleWith(0.1);
  },
});
```

Cross-platform sampling guidance is in [SAMPLING-AND-QUOTAS.md](SAMPLING-AND-QUOTAS.md).

## What is traced automatically

28+ packages, through OpenTelemetry instrumentations:

| Area | Packages | Op |
|---|---|---|
| HTTP | `node:http`/`https` (server and client), `fetch`/`undici`, `axios` | `http.server`, `http.client` |
| SQL | `pg`, `mysql2`, `mysql`, `prisma` v5+, `sequelize`, `typeorm`, `knex` | `db.query` |
| MongoDB | `mongodb` | `db` |
| Redis | `redis`, `ioredis` | `db.redis` |
| Queues | `kafkajs`, `amqplib`, `@google-cloud/pubsub`, `@aws-sdk/*` SNS/SQS | `queue.publish`, `queue.process` |
| Job queues | `bull`, `bullmq` | `queue.process` |
| GraphQL | `graphql`, `apollo-server` | `graphql.resolve` |
| AI | OpenAI, Anthropic, LangChain, Vercel AI, Google GenAI | See [AI monitoring](#ai-monitoring) |

The NestJS reference disagrees on some of these (Prisma and Knex need manual integrations, TypeORM and Sequelize have none); see [NESTJS.md](NESTJS.md#databases). Confirm in the current docs for your SDK version.

- **Outgoing fetch headers:** `Sentry.nativeNodeFetchIntegration({ breadcrumbs, headersToSpanAttributes: { requestHeaders: [...], responseHeaders: [...] } })`. `breadcrumbs` defaults to `true`; matched headers appear as `http.request.header.<name>` and `http.response.header.<name>`. Since `@opentelemetry/instrumentation-undici@0.22.0`, response headers such as `content-length` are no longer captured automatically, so list the ones you need here.

## Custom spans

| API | Behavior |
|---|---|
| `Sentry.startSpan({ name, op, attributes }, cb)` | Active, ends automatically. The recommended default |
| `Sentry.startSpanManual(opts, (span) => ...)` | You must call `span.end()`; the span leaks if you forget |
| `Sentry.startInactiveSpan(opts)` | Never active; for parallel work; pass `parentSpan` to attach it |
| `Sentry.withActiveSpan(span, cb)` | Makes a span active for the callback; does not end it |

- **`StartSpanOptions`:** `name` (required), `op`, `attributes`, `parentSpan`, `onlyIfParent`, `forceTransaction` (show it as a root transaction), `startTime` (Unix seconds).
- **Common ops:** `http.client`, `http.server`, `db` / `db.query`, `db.redis`, `function`, `queue.publish`, `queue.process`, `cache.get` / `cache.put`, `task`.

```typescript
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  return Sentry.startSpanManual({ name: "auth.verify", op: "middleware" }, (span) => {
    res.once("finish", () => {
      span.setStatus({ code: res.statusCode < 400 ? 1 : 2 });
      span.end(); // ← required; leaks if omitted
    });
    return next();
  });
}
```

- **Framework integrations are built in:** they activate on `Sentry.init()` and `setupXxxErrorHandler()`, not through `integrations: []`. Each `GET /api/users/:id` becomes an `http.server` transaction with DB query spans as children.

## Enriching and filtering spans

- **Enrich the active span:** `Sentry.getActiveSpan()`, then `span.setAttribute`, `span.setAttributes`, `span.recordException(error)`. Status: `span.setStatus({ code: 1 })` (0 unset, 1 ok, 2 error; `{ code: 2, message: "Payment declined" }`).
- **Rename:** `Sentry.updateSpanName(span, "GET /users/:id")` (v8.47.0+, per the NestJS reference). Root span: `Sentry.getRootSpan(span)`, its name via `Sentry.spanToJSON(root).name`.
- **Filtering contract:** beforeSendSpan modifies serialized spans and cannot return null; ignoreSpans accepts strings, regexes or name/op/attribute match objects. The old Node source allowed null and a function entry; both conflict with the current official contract. Use the existing [filter owner](PRACTICES.md#filtering-noise), including the stream/static lifecycle distinction in [JAVASCRIPT.md](JAVASCRIPT.md#core-sdk-options). [https://docs.sentry.io/platforms/javascript/guides/node/configuration/filtering/; https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#ignoreSpans]

- **Suppress or restart:** `Sentry.suppressTracing(cb)` suppresses spans even for auto-instrumented code; `Sentry.startNewTrace(cb)` breaks the chain.

## Distributed tracing

- **Headers:** `sentry-trace` is `{traceId}-{spanId}-{sampled}`; `baggage` is W3C Baggage with `sentry-*` keys. Backends must allowlist both for CORS: `Access-Control-Allow-Headers: sentry-trace, baggage`; the NestJS reference adds that proxies and API gateways must pass both headers through.
- **HTTP is automatic:** framework integrations call `continueTrace` for incoming requests and outgoing requests get the headers.
- **tracePropagationTargets controls outgoing trace headers:** string entries match URL substrings; server SDKs propagate to all outgoing requests by default. Thus localhost matches localhost:3001; port-specific CORS origin authorization is a separate question. The old Node source gave browser-like localhost/relative defaults and said localhost could not match the port. [https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracePropagationTargets]

```typescript
Sentry.init({
  tracePropagationTargets: [
    "localhost",                           // any URL containing "localhost"
    /^https:\/\/api\.yourapp\.com/,        // your API
    /^https:\/\/auth\.yourapp\.com/,       // auth service
  ],
});
```

- **`strictTraceContinuation`** (boolean, default `false`, v10+, per the NestJS reference) only continues traces from the same Sentry org.
- **Non-HTTP channels (queues, Kafka, WebSockets):** the producer puts `Sentry.getTraceData()` (returns `{ "sentry-trace": "...", "baggage": "..." }`) into the message headers; the consumer calls `Sentry.continueTrace({ sentryTrace, baggage }, cb)`. For Kafka read `message.headers["sentry-trace"]?.toString()`. The keys must be `"sentry-trace"` and `"baggage"`, not `traceparent`, or the trace won't link.

```typescript
// Publisher: extract current trace context
import * as Sentry from "@sentry/node";

await Sentry.startSpan({ name: "Publish order event", op: "queue.publish" }, async () => {
  const traceData = Sentry.getTraceData();
  // Returns: { "sentry-trace": "...", "baggage": "..." }

  await kafka.send({
    topic: "orders",
    messages: [{
      value: JSON.stringify({ orderId: 123 }),
      headers: {
        "sentry-trace": traceData["sentry-trace"],
        "baggage": traceData["baggage"],
      },
    }],
  });
});

// Consumer: continue the trace
consumer.run({
  eachMessage: async ({ message }) => {
    Sentry.continueTrace(
      {
        sentryTrace: message.headers["sentry-trace"]?.toString(),
        baggage: message.headers["baggage"]?.toString(),
      },
      () => Sentry.startSpan({ name: "Process order", op: "queue.process" }, () =>
        processOrder(message),
      ),
    );
  },
});
```

- **Link front end and back end:** the same DSN or linked Sentry projects give one trace across browser, API server and database (browser setup is [BROWSER.md](BROWSER.md), React is [REACT.md](REACT.md), Next.js is [NEXTJS.md](NEXTJS.md)).

## Deno and Bun

- **Bun:** tracing runs on `@sentry/node`'s OpenTelemetry; `Bun.serve()` is auto-instrumented as `http.server` transactions. The tracing reference starts Bun with `bun --preload ./bun-instrument.ts run app.ts`.
- **Deno:** the references disagree on whether `Deno.serve()` and `fetch` get automatic spans (see [NODE-RUNTIMES-AND-DELIVERY.md](NODE-RUNTIMES-AND-DELIVERY.md#deno)). The tracing reference wraps handlers manually:

```typescript
Deno.serve(async (req) => {
  return Sentry.startSpan(
    { name: `${req.method} ${new URL(req.url).pathname}`, op: "http.server" },
    async () => {
      const data = await handleRequest(req);
      return new Response(JSON.stringify(data));
    },
  );
});
```

## Profiling

Node.js only. Not available on Bun, Deno or the OTLP path.

- **Install `@sentry/profiling-node` at exactly the same version as `@sentry/node`** (or `@sentry/nestjs`): `npm install @sentry/profiling-node --save`. A mismatch causes silent failures or startup crashes. It is a native C++ addon (`node-gyp`) and must be in `dependencies`, not `devDependencies`.
- **How sampling multiplies:** the profiler samples V8 CPU stacks about 100 times a second (10 ms). A profile is collected only when the trace is sampled and the profiling session is sampled: `tracesSampleRate: 0.1` with `profileSessionSampleRate: 0.5` gives about 5%. `profileSessionSampleRate` is decided once per process at startup, so it profiles a fraction of processes or pods (e.g. `0.25` for 25% of pods). This multiplication and tracing requirement apply to profileLifecycle:trace; manual lifecycle is independent of trace sampling and uses profileSessionSampleRate. The old source stated tracing was universally required. [https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#profileLifecycle]

```typescript
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  integrations: [
    nodeProfilingIntegration(),
  ],

  tracesSampleRate: 1.0,

  // Session-level sampling: decision made once at process startup
  profileSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // "trace" = profiles auto-attach to every sampled span
  profileLifecycle: "trace",
});
```

- **`profileSessionSampleRate` (SDK 10.27.0+) replaces the deprecated `profilesSampleRate`** in SDK 10.x; pair it with `profileLifecycle`.
- **`profileLifecycle`:** `"trace"` (auto-attaches to every sampled span; the NestJS reference: starts at the first active span, stops when the last ends; for web servers) or `"manual"` (`Sentry.profiler.startProfiler()` and `Sentry.profiler.stopProfiler()` around hot paths, batch jobs, CLI tools).
- **Continuous profiling:** 60-second chunks upload automatically (no 30-second cap as in legacy V1), one upload per 60 s per process. Call `stopProfiler()` on SIGTERM to flush the in-progress chunk, or lose the last ~60 s. Memory is about 10 to 20 MB per chunk, capped at 50 chunks (~100 MB).
- **High traffic:** load test first; start `profileSessionSampleRate` at `0.01` (1 to 5%) and increase. The NestJS reference suggests starting at `0.1`.
- **Platforms:** Node 18 to 24 on macOS x64/ARM64, Windows x64 and Linux. The Node reference lists Linux glibc x64/ARM64 and musl x64/ARM64; the NestJS reference lists Linux x64 glibc and ARM64 musl. Not FreeBSD or 32-bit.
- **Alpine and Docker:** `RUN npm install --include=optional`, or `RUN apk add --no-cache python3 make g++ && npm rebuild @sentry/profiling-node`.
- **Environment:** `SENTRY_PROFILER_BINARY_PATH` (full path to `profiler.node`), `SENTRY_PROFILER_BINARY_DIR`, `SENTRY_PROFILER_LOGGING_MODE` (`"eager"`, the default: always running, faster first profile, more CPU between requests; `"lazy"`: starts on first use, lower baseline CPU).
- **Minified flame graphs:** upload source maps (with `authToken`) and run with `NODE_OPTIONS=--enable-source-maps`.

## AI monitoring

Tracing must be on. Concepts, sampling that keeps whole agent runs, and the dashboards are in [AI-MONITORING.md](AI-MONITORING.md); this is the Node side.

| Library | Package (minimum) | Notes |
|---|---|---|
| OpenAI | `openai` 4.0+ | Streaming needs `stream_options: { include_usage: true }` for token counts |
| Anthropic | `@anthropic-ai/sdk` 0.19.2+ | Streaming token counts automatic |
| Vercel AI SDK | `ai` 3.0+ | Requires `experimental_telemetry: { isEnabled: true }` on every call before Sentry SDK 11 ([AI-MONITORING.md](AI-MONITORING.md#vercel-ai-sdk)) |
| LangChain | `@langchain/core` 0.1.0+ | |
| LangGraph | `@langchain/langgraph` 0.1.0+ | |
| Google GenAI | `@google/genai` 1.0+ | |

- **All auto-enabled and stable** (available since 10.53.0; the reference sets the minimum at `@sentry/node` 10.61.0). Add them explicitly only to customize: `integrations: [Sentry.openAIIntegration(), Sentry.vercelAIIntegration()]`. Auto-instrumentation is server-only; in the browser or a Next.js client wrap the client: `Sentry.instrumentOpenAiClient(new OpenAI())`.
- **Vercel AI SDK inputs and outputs:** `experimental_telemetry: { isEnabled: true, recordInputs: true, recordOutputs: true }` before Sentry SDK 11; from 11, the integration's `recordInputs` / `recordOutputs`.
- **Prompt and output capture:** with `dataCollection`, genAI input and output capture is on by default (`recordInputs` and `recordOutputs` default `true`). Turn it off with `dataCollection: { genAI: { inputs: false, outputs: false } }`.
- **Unsupported (use manual spans):** Cohere, AWS Bedrock, Mistral, Groq.
- **Manual spans** use ops `gen_ai.request` (name `"chat <model>"`), `gen_ai.invoke_agent` (name `"invoke_agent <Agent>"`, attribute `gen_ai.agent.name`) and `gen_ai.execute_tool` (`gen_ai.tool.name`, `gen_ai.tool.type: "function"`, `gen_ai.tool.input`, `gen_ai.tool.output`). The tracing reference names the AI op `ai.pipeline.*` instead; confirm in the current docs.

```typescript
await Sentry.startSpan({
  op: "gen_ai.request",
  name: "chat claude-sonnet-4-6",
  attributes: { "gen_ai.request.model": "claude-sonnet-4-6" },
}, async (span) => {
  span.setAttribute("gen_ai.request.messages", JSON.stringify(messages));
  const result = await myClient.chat(messages);
  span.setAttribute("gen_ai.usage.input_tokens", result.usage.inputTokens);
  span.setAttribute("gen_ai.usage.output_tokens", result.usage.outputTokens);
  return result;
});
```

- **Attributes:** `gen_ai.request.model` (required), `gen_ai.operation.name`, `gen_ai.agent.name`, `gen_ai.request.reasoning_effort`. Content, JSON-stringified: `gen_ai.request.messages`, `gen_ai.request.available_tools`, `gen_ai.response.text`, `gen_ai.response.tool_calls`. Tokens: `gen_ai.usage.input_tokens` (including cached), `gen_ai.usage.input_tokens.cached`, `gen_ai.usage.input_tokens.cache_write` (Anthropic), `gen_ai.usage.output_tokens` (including reasoning), `gen_ai.usage.output_tokens.reasoning`, `gen_ai.usage.total_tokens`. Cached and reasoning counts are subsets, not additive: reporting them wrong gives wrong costs. Span attributes accept primitives only. For a manual stream, set the counts after the stream completes.
- **Conversations (Explore > Conversations):** `Sentry.setConversationId("conv_abc123")` tags later AI calls with `gen_ai.conversation.id`. It needs `streamGenAiSpans` (default `true` at >=10.61.0) and input and output capture on. A conversation can span traces and a trace can hold several conversations. Call `Sentry.setUser(...)` once per request before the AI calls, or the User column shows "Unknown".
- **`tracesSampleRate` below 1.0:** read the AI sampling guidance in [AI-MONITORING.md](AI-MONITORING.md).

## Troubleshooting

| Symptom | Fix |
|---|---|
| No spans | `tracesSampleRate` or `tracesSampler` not set |
| DB or HTTP spans missing | The driver isn't in the auto-instrumented list, or it loaded before `Sentry.init()` ran |
| Deno DB spans missing | Deno doesn't load Node.js OpenTelemetry instrumentations: use `startSpan()` manually |
| Spans named with raw URLs | Route parameterization, or rename in `beforeSendSpan` |
| `continueTrace()` not linking | Header keys must be `"sentry-trace"` and `"baggage"`, not `traceparent` |
| Distributed trace broken | Target URL missing from `tracePropagationTargets`; CORS allowlist missing `sentry-trace, baggage`; a proxy or gateway strips them (NestJS reference) |
| OTLP path shows no traces | Install `@opentelemetry/sdk-trace-node`, add `otlpIntegration()`, remove `tracesSampleRate` |
| No profiles | `npm ls @sentry/profiling-node` shows a version mismatch |
| Profiles not linked to spans | `profileLifecycle: "trace"` and `tracesSampleRate` > 0, both required |
| `Cannot find module '@sentry/profiling-node'` | Install it and keep it in `dependencies`, not `devDependencies` |
| Profiler binary fails to load | Node 18 to 24 on a supported platform; set `SENTRY_PROFILER_BINARY_PATH` |
| High idle CPU from profiling | `SENTRY_PROFILER_LOGGING_MODE=lazy` or a lower rate |
| No AI spans | `tracesSampleRate > 0`; SDK >=10.61.0; Vercel AI SDK call missing `experimental_telemetry` (before Sentry SDK 11) |
| Conversations view empty | `streamGenAiSpans` on, genAI capture on, and `Sentry.setConversationId()` called |
| No AI token counts on OpenAI streams | `stream_options: { include_usage: true }` |

## Prove it

- **A request makes a transaction:** hit one route; the trace shows an `http.server` span named with the route pattern and child `db.query` or `http.client` spans.
- **Sampling does what you meant:** with your `tracesSampler`, a `/health` request never appears and a `/checkout` request always does.
- **The trace crosses services:** a call from service A to B (or through a queue with `getTraceData()` and `continueTrace()`) shows both sides in one trace; a third-party URL outside `tracePropagationTargets` receives no `sentry-trace` header.
- **Profiles attach:** with `profileSessionSampleRate: 1.0` locally, a sampled transaction shows a profile; `npm ls @sentry/profiling-node` matches the core SDK version.
- **AI calls show up:** one LLM call produces a `gen_ai.*` span with the model and token counts; with `dataCollection.genAI` off, the prompt text is absent.
