# Observability: logs, traces, metrics, export

**Contents:** [Logging](#logging) · [Loggers](#loggers) · [Tracing](#tracing) · [Testing spans](#testing-spans) · [Metrics](#metrics) · [Exporting telemetry](#exporting-telemetry) · [@effect/opentelemetry](#effectopentelemetry) · [Error reporting](#error-reporting) · [Debugging](#debugging) · [Porting v3 code](#porting-v3-code) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Version: effect and @effect/opentelemetry 4.0.5. The `effect/observability` modules and `ErrorReporter` are marked unstable.

## Logging

- **Log with `Effect.log(...messages)`** at the fiber's current level (default `"Info"`), or by level: `Effect.logFatal`, `logError`, `logWarning`, `logInfo`, `logDebug`, `logTrace`, `logWithLevel(level?)`. Several messages are allowed; a `Cause` passed to `Effect.log` is extracted into a `cause` annotation.
- **Debug logs are hidden by default.** `References.MinimumLogLevel` defaults to `"Info"`. Enable them with `Effect.provideService(References.MinimumLogLevel, "Debug")` or `Layer.succeed(References.MinimumLogLevel, "Debug")`.
- **Two levels, two jobs:** `References.CurrentLogLevel` (default `"Info"`) is the severity unqualified `Effect.log` uses; `MinimumLogLevel` filters entries out.
- **Level order:** `All`, `Fatal`, `Error`, `Warn`, `Info`, `Debug`, `Trace`, `None`. `LogLevel.Severity` excludes `All` and `None`; `LogLevel.isEnabled(level)` checks against `MinimumLogLevel`.
- **Turn logging off** with `MinimumLogLevel` = `"None"`: per effect, as a layer, or with `ManagedRuntime.make(Layer.succeed(References.MinimumLogLevel, "None"))`.
- **Read the level from config:**

```ts
const LogLevelLive = Config.LogLevel("LOG_LEVEL").pipe(
  Effect.map((level) => Layer.succeed(References.MinimumLogLevel, level)),
  Layer.unwrap,
)
```

- **Errors with no caller** (pool finalizer failures, defects in background callbacks) log at `References.UnhandledLogLevel`, default `"Error"`. "Providing `undefined` suppresses these reports; it does not fall back to `CurrentLogLevel`."

### Annotations and log spans

- **`Effect.annotateLogs(key, value)` or `Effect.annotateLogs({ ... })`** adds annotations to every log in the effect, nested effects included.
- **`Effect.annotateLogsScoped(...)`** lasts until the current `Scope` closes, then restores the previous annotations.
- **`Effect.withLogSpan(label)`** adds `label=<N>ms` to each log line in the effect; spans stack.
- **Custom loggers read them** from `References.CurrentLogAnnotations` and `References.CurrentLogSpans`, for example `options.fiber.getRef(References.CurrentLogAnnotations)`.

```ts
export const logCheckoutFlow = Effect.gen(function*() {
  yield* Effect.logDebug("loading checkout state")
  yield* Effect.logInfo("validating cart")
  yield* Effect.logWarning("inventory is low for one line item")
  yield* Effect.logError("payment provider timeout")
}).pipe(
  Effect.annotateLogs({ service: "checkout-api", route: "POST /checkout" }),
  Effect.withLogSpan("checkout")
)
```

## Loggers

- **The default set** (`References.CurrentLoggers`, also `Logger.CurrentLoggers`) is `{ defaultLogger, tracerLogger }`. `defaultLogger` prints `[<time>] INFO (#<fiber>) <spans>: <message> <annotations>` through the fiber's `Console`. Some v4 docs show `timestamp=... level=INFO fiber=#0 message=...` as the default and call `stringLogger` the default; the source does what is described here, and `stringLogger` is `formatSimple` in v4.
- **`Logger.layer(loggers, { mergeWithExisting? })` replaces the whole set** unless `mergeWithExisting: true`. It accepts loggers or Effects that build them (scoped ones are acquired by the layer).
- **Keep `Logger.tracerLogger` when you replace the set,** or logs stop being recorded as span events: `Logger.layer([logger, Logger.tracerLogger])`.
- **Add one logger to one effect** with `Effect.withLogger(logger)`.
- **Write your own** with `Logger.make((options) => output)`, where `options` is `{ message, logLevel, cause, fiber, date }`.
- **Built-ins:**
  - Formatters: `Logger.formatSimple`, `Logger.formatLogFmt`, `Logger.formatStructured`, `Logger.formatJson`.
  - Console loggers: `Logger.consolePretty(options?)`, `Logger.consolePrettyBrowser`, `Logger.consolePrettyTty`, `Logger.consoleLogFmt`, `Logger.consoleStructured`, `Logger.consoleJson`.
  - Routing: `Logger.withConsoleLog`, `Logger.withConsoleError`, `Logger.withLeveledConsole`.
  - Others: `Logger.map`, `Logger.batched`, `Logger.toFile`, `Logger.tracerLogger`, `Logger.defaultLogger`.
- **`formatStructured` fields:** `message`, `level` (uppercase), `timestamp`, `cause`, `annotations`, `spans` (label to ms), `fiberId`. v3 called the level field `logLevel`.
- **`consolePretty` options:** `colors` (`"auto" | boolean`), `formatDate`, `mode` (`"browser" | "tty" | "auto"`). "If the runtime platform is known and fixed, prefer consolePrettyBrowser or consolePrettyTty."
- **Keep stdout clean** for protocol or data output with `Logger.LogToStderr` = `true` (default `false`): the default logger and the TTY pretty logger go to `console.error`.
- **`Logger.batched(logger, { window, flush })`** returns a scoped Effect; a background fiber flushes every window, and remaining entries flush when the scope closes.
- **`Logger.toFile(stringLogger, path, { flag?, mode?, batchWindow? })`** needs `FileSystem` and `Scope`, can fail with `PlatformError`, opens with flag `"a+"`, ignores write errors, and batches every 1000 ms by default. The PlatformLogger guide says logs without a `batchWindow` are written as they arrive; the source defaults it to 1000 ms.

Production setup, switching on `NODE_ENV` (`AppLoggerLayer` stands for your production combination of the layers above):

```ts
export const JsonLoggerLayer = Logger.layer([Logger.consoleJson])
export const WarnAndAbove = Layer.succeed(References.MinimumLogLevel, "Warn")
export const FileLoggerLayer = Logger.layer([
  Logger.toFile(Logger.formatSimple, "app.log")
]).pipe(Layer.provide(NodeFileSystem.layer))

export const LoggerLayer = Layer.unwrap(Effect.gen(function*() {
  const env = yield* Config.String("NODE_ENV").pipe(Config.withDefault("development"))
  if (env === "production") {
    return AppLoggerLayer
  }
  return Logger.layer([Logger.defaultLogger])
}))
```

Testing logs (`TestConsole`, and why `it.effect` hides them) is in [TESTING.md](TESTING.md).

## Tracing

### Effect.fn

See [Effect.fn names, forms and combinator placement](CODE-STYLE.md#effectfn).

### Span APIs (all on `Effect`)

- **`Effect.withSpan(name, options?)`** wraps an effect in a child span without changing its type (it removes `ParentSpan` from `R`). Options: `attributes`, `links`, `parent`, `root`, `annotations`, `kind` (`"internal" | "server" | "client" | "producer" | "consumer"`), `sampled`, `level`, `captureStackTrace`. Data-last, the options can be a function of the arguments.
- **Annotate:** `Effect.annotateCurrentSpan(key, value | record)` for the current span, if any; `Effect.annotateSpans(key, value | record)` for every span created in the effect.
- **Read:** `Effect.currentSpan` (fails with `NoSuchElementError` when there is no local span), `Effect.currentParentSpan`, `Effect.spanAnnotations`, `Effect.spanLinks`; link with `Effect.linkSpans(span | spans, attributes?)`.
- **Manual spans:** `Effect.makeSpan(name)` (not on the stack, not ended automatically), `Effect.makeSpanScoped`, `Effect.useSpan(name, (span) => ...)`, `Effect.withSpanScoped`, `Effect.withParentSpan(span)`.
- **Tracer control:** `Effect.withTracer(tracer)`, `Effect.tracer`, `Effect.withTracerEnabled(false)` (spans are not registered), `Effect.withTracerTiming(false)`.
- **Trace layer construction** with `Layer.withSpan(name, { onEnd? })` and `Layer.span(name)`.
- **Provide the observability layer last,** "so that all spans created by the app are exported."
- **Logs become span events:** `tracerLogger` adds each log to the current span with attributes `effect.fiberId`, `effect.logLevel`, and `effect.cause` when present; it skips external spans.
- **Failed spans** get status code 2 with the message, an `exception` event and a `code.stacktrace` attribute.
- **Continue a trace from elsewhere** with `Tracer.externalSpan({ spanId, traceId, sampled?, annotations? })` (`sampled` defaults to `true`), as `parent` or with `withParentSpan`.
- **References:** `TracerEnabled` (default `true`), `TracerTimingEnabled` (default `true`), `TracerSpanAnnotations`, `TracerSpanLinks`, `CurrentTraceLevel` (default `"Info"`), `MinimumTraceLevel` (default `"All"`), `DisablePropagation` (default `false`), `Tracer` (default `nativeTracer`). Compare the active tracer with `nativeTracer` to detect that no tracing backend is installed.

## Testing spans

Capture spans with an in-memory tracer:

```ts
const spans: Array<Tracer.NativeSpan> = []
const tracer = Tracer.make({
  span(options) {
    const span = new Tracer.NativeSpan(options)
    spans.push(span)
    return span
  }
})
await Effect.runPromise(Effect.provideService(program, Tracer.Tracer, tracer))
spans[0]?.attributes.get("user.id") // => "123"
spans[0]?.status._tag // => "Ended"
```

With OpenTelemetry: `NodeSdk.layer(Effect.sync(() => ({ resource: {...}, spanProcessor: [new SimpleSpanProcessor(new InMemorySpanExporter())] })))`, then `exporter.getFinishedSpans()`.

## Metrics

- **Types:** Counter, Frequency, Gauge, Histogram, Summary, plus `timer` (a histogram of durations).
- **Constructors:**
  - `Metric.counter(name, { description?, attributes?, bigint?, incremental? })`; with `incremental: true` negative updates are ignored.
  - `Metric.gauge(name, { description?, attributes?, bigint? })`
  - `Metric.frequency(name, { description?, attributes?, preregisteredWords? })`
  - `Metric.histogram(name, { description?, attributes?, boundaries })`
  - `Metric.summary(name, { description?, attributes?, maxAge, maxSize, quantiles })`, `Metric.summaryWithTimestamp`
  - `Metric.timer(name, { description?, attributes?, boundaries? })`: records milliseconds, adds the attribute `time_unit: "milliseconds"`, default boundaries `Metric.exponentialBoundaries({ start: 0.5, factor: 2, count: 35 })`.
- **Boundaries:** `Metric.linearBoundaries({ start, width, count })`, `Metric.exponentialBoundaries({ start, factor, count })`, `Metric.boundariesFromIterable`.
- **Operations:** `Metric.update(metric, input)` (counter adds, gauge replaces, frequency increments, histogram and summary record), `Metric.modify` (gauge adds a delta), `Metric.value(metric)`, `Metric.mapInput`, `Metric.withConstantInput`, `Metric.withAttributes`, `Metric.snapshot`, `Metric.dump` (debug table), `Metric.snapshotUnsafe(context)`.
- **Instrument effects from `Effect`:** `Effect.track(metric, f?)` (every Exit), `Effect.trackSuccesses`, `Effect.trackErrors` (expected errors), `Effect.trackDefects`, `Effect.trackDuration` (nanosecond `Duration` from the monotonic clock, recorded on every Exit).
- **Each attribute combination is a separate series.** `Metric.CurrentMetricAttributes` supplies attributes to a region through `Effect.provideService`; "state must be read under the same attribute context it was written under."
- **The registry is shared by default.** `Metric.MetricRegistry` is a `Context.Reference` holding a `Map`, and the cached default is shared by every context without an override; provide a fresh `Map` when isolation matters (tests: `Effect.provideService(program, Metric.MetricRegistry, new Map())`).
- **Runtime fiber metrics** are off by default: `Metric.enableRuntimeMetricsLayer` or `Metric.enableRuntimeMetrics`. Series: `child_fibers_active`, `child_fibers_started`, `child_fiber_successes`, `child_fiber_failures`.
- **Prometheus:** `PrometheusMetrics.format({ prefix?, metricNameMapper? })`, and `PrometheusMetrics.layerHttp({ path?, prefix? })`, a GET route (default `/metrics`, content type `text/plain; version=0.0.4; charset=utf-8`) that requires `HttpRouter`.

## Exporting telemetry

"For exporting telemetry, use the lightweight Otlp modules from `effect/observability` in new projects, or use `@effect/opentelemetry` NodeSdk when integrating with an existing OpenTelemetry setup." `effect/observability` holds `Otlp`, `OtlpTracer`, `OtlpLogger`, `OtlpMetrics`, `OtlpResource`, `OtlpSerialization`, `OtlpExporter` and `PrometheusMetrics` (v3 had the Otlp modules in `@effect/opentelemetry`).

### Lightweight OTLP

- **Per signal:** `OtlpTracer.layer({ url, resource?, headers?, compression?, exportInterval?, maxBatchSize?, context?, shutdownTimeout? })`, `OtlpLogger.layer({ ..., excludeLogSpans?, mergeWithExisting? })`, `OtlpMetrics.layer({ ..., temporality? })`. All require `HttpClient` and `OtlpSerialization`.
- **All three at once:** `Otlp.layer({ baseUrl, ... })` installs logs, metrics and traces at `/v1/logs`, `/v1/metrics` and `/v1/traces`. `Otlp.layerJson` and `Otlp.layerProtobuf` pre-provide the serialization and still need `HttpClient`.

| Default | Tracer | Logger | Metrics |
|---|---|---|---|
| `exportInterval` | 5 s | 1 s | 10 s |
| `maxBatchSize` | 1000 | 1000 | |
| `shutdownTimeout` | 3 s | 3 s | 3 s |

- **Compression** defaults to `"none"`; gzip skips bodies under 1KB and needs `CompressionStream`.
- **Metrics `temporality`** defaults to `"cumulative"`; use `"delta"` for backends that prefer it, such as Datadog and Dynatrace.
- **`OtlpLogger.layer` merges with the existing loggers** by default (`mergeWithExisting ?? true`).
- **Exporter behaviour:** buffers and posts batches, retries transient failures 3 times (honouring `retry-after` on 429, else 1 s), disables exporting for 60 s after an unhandled failure, and flushes on scope close for up to `shutdownTimeout`.
- **Flush on demand** with `OtlpExporter.Flusher`, which drains every signal sharing the registry. "There is no built-in timeout; use `Effect.timeoutOption`"; it "cannot await an export that was already in flight". `layerFlusher` is a module constant on purpose, so all signals share one registry.
- **`layerFromConfig` reads the environment** and is disabled when `OTEL_SDK_DISABLED=true`, when no endpoint is set (`OTEL_EXPORTER_OTLP_<SIGNAL>_ENDPOINT`, or `OTEL_EXPORTER_OTLP_ENDPOINT` plus `/v1/<signal>`), or when `OTEL_<SIGNAL>_EXPORTER` does not include `otlp` (default empty). It also reads `*_COMPRESSION`, `*_TIMEOUT`, `OTEL_BSP_SCHEDULE_DELAY`, `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` and `*_HEADERS`.
- **Setting only the endpoint exports nothing:** without `otlp` in `OTEL_TRACES_EXPORTER`, `OTEL_LOGS_EXPORTER` or `OTEL_METRICS_EXPORTER`, the code returns a no-op flusher (implementation reading).
- **Resource:** `OtlpResource.fromConfig` uses `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION` and `OTEL_RESOURCE_ATTRIBUTES`; explicit options win over the environment.

Setup (`CheckoutTest` is the application layer):

```ts
import { OtlpLogger, OtlpSerialization, OtlpTracer } from "effect/observability"
import { FetchHttpClient } from "effect/http"

export const OtlpTracingLayer = OtlpTracer.layer({
  url: "http://localhost:4318/v1/traces",
  resource: {
    serviceName: "checkout-api",
    serviceVersion: "1.0.0",
    attributes: { "deployment.environment": "staging" }
  }
})
export const OtlpLoggingLayer = OtlpLogger.layer({
  url: "http://localhost:4318/v1/logs",
  resource: { serviceName: "checkout-api", serviceVersion: "1.0.0" }
})
export const ObservabilityLayer = Layer.merge(OtlpTracingLayer, OtlpLoggingLayer).pipe(
  Layer.provide(OtlpSerialization.layerJson),
  Layer.provide(FetchHttpClient.layer)
)

const Main = CheckoutTest.pipe(Layer.provide(ObservabilityLayer))
Layer.launch(Main).pipe(NodeRuntime.runMain)
```

**View traces locally:** `docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -it docker.io/grafana/otel-lgtm`, then Grafana's Explore page (Tempo) on port 3000.

## @effect/opentelemetry

- **Install** `@effect/opentelemetry` plus the `@opentelemetry/*` SDK packages you need (`sdk-trace-base`, `sdk-trace-node`, `sdk-trace-web`, `sdk-metrics`, exporters such as `exporter-trace-otlp-http`); `@opentelemetry/api` is a peer dependency.
- **`NodeSdk.layer(() => config)` or `NodeSdk.layer(effectReturningConfig)`.** `Configuration` fields: `spanProcessor`, `tracerConfig`, `metricReader`, `metricTemporality`, `logRecordProcessor`, `loggerProviderConfig`, `loggerMergeWithExisting`, `resource: { serviceName, serviceVersion?, attributes? }`, `shutdownTimeout`. Each signal is enabled only when its processor or reader is supplied; `Resource` (environment plus explicit) is always provided.
- **Shutdown:** providers flush and shut down on layer release, bounded by `shutdownTimeout` (default 3000 ms).
- **Register Node auto-instrumentations before importing the modules they patch,** "because many Node instrumentations hook module loading."
- **Module names:** `OtelTracer`, `OtelLogger`, `OtelMetrics` (v3 called them `Tracer`, `Logger`, `Metrics`); the `/index` entrypoint is gone. `OtelLogger.layer({ mergeWithExisting })` defaults to `true` (v3 had `layerLoggerAdd` and `layerLoggerReplace`).
- **Global provider:** `OtelTracer.layerGlobal` connects Effect to the global OTel tracer provider. With Sentry v11 (`enableOpenTelemetrySetup: true`) use it, and call `Sentry.flush(2000)` before short scripts exit; Sentry v11 removed `SentrySpanProcessor`.
- **Parent precedence:** "Effect parents take precedence over active OpenTelemetry spans. Use `Effect.withParentSpan` to inherit Effect-installed ambient spans." Continue remote traces with `OtelTracer.makeExternalSpan` or `OtelTracer.withSpanContext(spanContext)`, and preserve `traceFlags` and `traceState`, "otherwise sampling defaults to sampled and trace state cannot be propagated."
- **`OtelTracer.currentOtelSpan`** works with both `NodeSdk.layer` and `OtlpTracer.layer` (as a wrapper span).
- **Instrumentation scope** is `"effect"` with the Effect version.

```ts
import { Effect } from "effect"
import { NodeSdk } from "@effect/opentelemetry"
import { ConsoleSpanExporter, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

const program = Effect.void.pipe(Effect.delay("100 millis"))
const instrumented = program.pipe(Effect.withSpan("myspan"))

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: "example" },
  spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter()),
}))

Effect.runPromise(instrumented.pipe(Effect.provide(NodeSdkLive)))
```

## Error reporting

- **`ErrorReporter` forwards non-interruption failures to callbacks.** It fires from `Effect.withErrorReporting` (option `defectsOnly`), `ErrorReporter.report(cause)`, and the built-in boundaries in the HTTP and RPC servers.
- **`ErrorReporter.make(cb)`** deduplicates and skips interruptions; `ErrorReporter.layer([...], { mergeWithExisting? })` replaces existing reporters by default.
- **Per-error annotations:** `[ErrorReporter.ignore]: true` (for example an expected HTTP 404), `[ErrorReporter.severity]` (default `"Info"`), `[ErrorReporter.attributes]`.
- **`NodeRuntime.runMain`** logs errors by default (turn off with `disableErrorReporting: true`), sets exit codes, and interrupts on SIGINT for graceful teardown.

## Debugging

- **Stack traces:** use `Effect.fn("name")`, and avoid tacit `Effect.map(fn)`, partly because "stack traces might not be as clear when tacit usage is employed." `Cause.prettyErrors` returns `Array<Error>`, with tracing information from Reason annotations in the rendered stacks.
- **Quick timings:** `Effect.withLogSpan`; `Logger.consolePretty()` in development.
- **Metrics at a glance:** `Metric.dump` returns a human-readable table of every registered metric.
- **DevTools:** `DevTools.layer(url = "ws://localhost:34437")` streams spans, span events and metric snapshots to an external devtools process. It installs only the client (no server), retries the connection every second and relies on `globalThis.WebSocket`; `layerWebSocket` and `layerSocket` are variants.
- **Editor:** the Effect Language Service ships as `@effect/tsgo` (`npx @effect/tsgo setup`); the tsconfig plugin name stays `@effect/language-service`; it needs TypeScript 7; add `"prepare": "effect-tsgo patch"`.
- **Fibers:** track groups with `FiberSet` or `FiberMap` (`FiberSet.size` for monitoring).

## Porting v3 code

| v3 | v4 |
|---|---|
| `Logger.withMinimumLogLevel`, `Logger.minimumLogLevel` | `Effect.provideService(effect, References.MinimumLogLevel, level)`, `Layer.succeed(References.MinimumLogLevel, level)` |
| `Logger.add` | `Logger.layer([logger], { mergeWithExisting: true })` |
| `Logger.replace` | `Logger.layer([...desiredLoggers])` |
| `Logger.json` | `Logger.layer([Logger.consoleJson, Logger.tracerLogger])` |
| `Logger.pretty` | `Logger.layer([Logger.consolePretty(), Logger.tracerLogger])` |
| `prettyLogger` (stderr option) | `consolePretty` (`Logger.LogToStderr`) |
| `stringLogger`, `jsonLogger`, `logfmtLogger` | `formatSimple`, `formatJson`, `formatLogFmt` |
| `Logger.none` | `Logger.make(() => undefined)` |
| logger option `fiberId` | `fiber` (`fiber.id`) |
| FiberRefs `currentLogLevel`, `currentMinimumLogLevel`, `currentLogAnnotations`, `currentLogSpan`, `currentTracerEnabled`, `unhandledErrorLogLevel` | References `CurrentLogLevel`, `MinimumLogLevel`, `CurrentLogAnnotations`, `CurrentLogSpans`, `TracerEnabled`, `UnhandledLogLevel` |
| `Effect.locally` | `Effect.provideService` |
| `Effect.functionWithSpan` | `Effect.withSpan` |
| `Effect.tracerWith` | `Tracer.Tracer.use` |
| `Effect.withTracerScoped` | `Effect.provideService` |
| `Micro.withTrace` | removed: "v4 captures failure stack traces automatically" |
| calling a metric as a function | `Effect.trackSuccesses` to instrument; `Metric.update` or `Metric.value` to operate |
| `Metric.tagged`, `Effect.tagMetrics`, `labelMetrics` | `Metric.withAttributes` |
| `fiberLifetimes` | `Metric.timer` plus `Effect.trackDuration` |
| `@effect/opentelemetry/Otlp*` | `effect/observability` |

`Effect.trackDuration` now records on every Exit; v3 recorded only after success.

## Anti-patterns

- **`.pipe` on `Effect.fn`:** pass the combinators as extra arguments.
- **A function that only wraps and returns `Effect.gen`:** use `Effect.fn` or `Effect.fnUntraced`.
- **`Logger.layer([myLogger])` without `Logger.tracerLogger`:** logs vanish from spans.
- **Expecting `Effect.logDebug` output at the default level:** set `MinimumLogLevel` to `"Debug"`.
- **Providing the observability layer before the rest of the app:** spans created outside it are not exported; provide it last.
- **Only `OTEL_EXPORTER_OTLP_ENDPOINT` with `layerFromConfig`:** also set `OTEL_<SIGNAL>_EXPORTER=otlp`.
- **Reading a metric under different attributes than it was written under,** or sharing the default `MetricRegistry` across tests.
- **Importing modules before registering Node auto-instrumentations.**
- **Dropping `traceFlags` and `traceState` when continuing a remote trace.**

## Prove it

Run the app against the local `grafana/otel-lgtm` container (or a `ConsoleSpanExporter`) and see the spans named by `Effect.fn` arrive with their attributes, logs as span events, and failures with status code 2. In tests, the in-memory `Tracer.make` capture (or `InMemorySpanExporter`) holds the expected span names and attributes, and metrics read with `Metric.value` under a fresh `MetricRegistry` hold the expected values. With `layerFromConfig`, both the endpoint and `OTEL_<SIGNAL>_EXPORTER=otlp` are set.
