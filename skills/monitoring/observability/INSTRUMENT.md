# Instrumenting a Node service

Wire the Node SDK before instrumented libraries load, then add business spans, metrics, correlated logs and propagation. These are the existing OpenTelemetry SDK recipes and corrections from this guide; acceptance evidence is shared with the skill entrypoint. [existing observability, INSTRUMENT.md]

## The SDK, loaded first

The SDK patches libraries as they load, so it must start before anything else is imported: a separate file loaded with `node --import ./instrumentation.js` (or `--require` for CommonJS), not an import at the top of `server.ts` after other modules.

```ts
// instrumentation.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes, defaultResource } from "@opentelemetry/resources";

if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) throw new Error("OTEL_CONFIG_MISSING: OTEL_EXPORTER_OTLP_ENDPOINT");

const sdk = new NodeSDK({
  resource: defaultResource().merge(resourceFromAttributes({
    "service.name": "orders-api",
    "service.version": process.env.APP_VERSION ?? "dev",
    "deployment.environment.name": process.env.APP_ENV ?? "local",
  })),
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: 30_000 }),
  instrumentations: [getNodeAutoInstrumentations({ "@opentelemetry/instrumentation-fs": { enabled: false } })],
});
sdk.start();

process.on("SIGTERM", () => { sdk.shutdown().finally(() => process.exit(0)); });   // flush buffered spans before exit
```

- **Automatic instrumentation covers** incoming and outgoing HTTP, Express and Fastify routes, `pg`, `ioredis`, `amqplib`, `kafkajs`, gRPC and more. The file-system instrumentation is noisy; turn it off unless you need it.
- **Configure endpoints, headers, resources and sampling by environment:** `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` (backend credentials), `OTEL_SERVICE_NAME`, `OTEL_TRACES_SAMPLER` and `OTEL_TRACES_SAMPLER_ARG`. The explicit `exporter-trace-otlp-proto` and `exporter-metrics-otlp-proto` imports above use HTTP/protobuf. NodeSDK's environment-selected exporter setup is an alternative to programmatic exporters; `OTEL_EXPORTER_OTLP_PROTOCOL=grpc` does not replace this sample's explicit HTTP trace exporter. The old comment and bullet claimed protocol switching through the environment for this sample. Match the receiver transport, including the gRPC-only example in [COLLECTOR.md](COLLECTOR.md#agent-and-gateway). Keep the header value in a secret store. [OpenTelemetry trace exporter](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/exporter-trace-otlp-proto/README.md), [metric exporter](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/opentelemetry-exporter-metrics-otlp-proto/README.md), [NodeSDK environment configuration](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/opentelemetry-sdk-node/README.md#configure-exporters-from-environment)
- **Next.js on Vercel:** `@vercel/otel` with `registerOTel({ serviceName })` in the project's `instrumentation.ts` does the same wiring for the Node and Edge runtimes.
- **SQL in spans:** database instrumentations record the statement. That's useful, but make sure values are parameters, not inlined user data.

## Custom spans for business operations

```ts
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("orders");

export function placeOrder(cmd: PlaceOrder) {
  return tracer.startActiveSpan("PlaceOrder", async (span) => {
    span.setAttributes({ "order.customer_id": cmd.customerId, "order.item_count": cmd.items.length });
    try {
      const order = await tracer.startActiveSpan("ValidateOrder", async (s) => { try { return validate(cmd); } finally { s.end(); } });
      await saveOrder(order);                                   // its pg spans nest under PlaceOrder automatically
      span.setAttribute("order.id", order.id);
      return order;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();                                               // a span that never ends is never exported
    }
  });
}
```

- `startActiveSpan` makes the span current for everything awaited inside it, so database and HTTP spans become its children.
- **Name spans by operation,** low-cardinality (`PlaceOrder`, `GET /orders/:id`), and put the variable parts in attributes.
- **Expected outcomes aren't errors.** A rejected order (validation failed, out of stock) is a normal result; record it as an attribute (`order.outcome = "rejected"`). Mark the span as an error for failures someone should look at.

### Manual span

The Grafana source's explicit `context.with` alternative is retained verbatim below. Its `http.method` attribute is deprecated; the official form is `http.request.method`. Identifier collection follows the [privacy rule](SKILL.md#the-rules). [existing Grafana, OPENTELEMETRY-AND-BEYLA.md, Manual span], [HTTP attribute registry](https://opentelemetry.io/docs/specs/semconv/registry/attributes/http/)

```typescript
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('myapp');

async function handleRequest(req: Request) {
  const span = tracer.startSpan('handleRequest', {
    attributes: {
      'http.method': req.method,
      'user.id': req.userId,
    },
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await processRequest(req);
      return result;
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
```

## Metrics

```ts
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("orders");
const ordersPlaced = meter.createCounter("orders.placed", { description: "Orders placed" });
const orderDuration = meter.createHistogram("orders.processing.duration", { unit: "ms" });
const openOrders = meter.createUpDownCounter("orders.open", { description: "Orders not yet completed" });

ordersPlaced.add(1, { "order.channel": "web", currency: "USD" });   // bounded labels only
orderDuration.record(elapsedMs, { "order.outcome": "placed" });
openOrders.add(1);                                                    // and add(-1) when completed or cancelled
```

- **Counter** for things that only go up (orders, errors); **histogram** for durations and sizes (percentiles come from it); **up-down counter** or an observable gauge for current levels (open orders, queue depth, pool connections in use).
- **Automatic metrics** come with the instrumentations: HTTP request duration by route and status, and runtime metrics (event-loop delay, heap, GC) from the runtime-node instrumentation.
- **The cardinality limit:** the SDK keeps at most a default number of time series per instrument (2,000) and folds the rest into an overflow series. Hitting it means a label is unbounded; fix the label, don't raise the limit.

## Logs that point to their trace

Structured-event design, level semantics and schema/privacy rules are in [LOGGING.md](LOGGING.md). [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

Use a structured logger (pino) and let the instrumentation inject the active `trace_id` and `span_id` into every record; the pino instrumentation in the auto-instrumentations package does both the injection and, if configured, sending records over OTLP. Then a trace view can list the logs written during that request, and a log line links back to its trace.

```ts
log.info({ orderId: order.id, customerId: order.customerId, totalCents: order.totalCents }, "order placed");
// not: log.info(`Order ${order.id} placed by ${email}`)   - unsearchable fields, and personal data
```

### Trace IDs in logs (pino)

The source's manual pino helper uses `traceId` and `spanId` keys; the automatic wiring above uses `trace_id` and `span_id`. Retain the project's correlation convention and configure the backend to match. Generic logging policy is in [LOGGING.md](LOGGING.md); Loki label/storage requirements stay in [grafana LOKI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/LOKI.md). [existing Grafana, OPENTELEMETRY-AND-BEYLA.md, Trace IDs in logs]

```javascript
const { trace } = require('@opentelemetry/api');

// In your logging middleware/utility:
function getTraceContext() {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const { traceId, spanId } = span.spanContext();
  return { traceId, spanId };
}

logger.info({ ...getTraceContext(), userId: '123' }, 'User logged in');
// Output: {"traceId":"abc123","spanId":"def456","userId":"123","msg":"User logged in"}
```

## Request context on every span and log

After authentication, put the caller's context on the request's span and on a child logger bound for the rest of the request:

```ts
import { AsyncLocalStorage } from "node:async_hooks";
import { trace } from "@opentelemetry/api";

export const requestLog = new AsyncLocalStorage<Logger>();

app.use((req, res, next) => {                                   // register after the auth middleware
  const ctx: Record<string, string> = {};
  if (req.user) { ctx["user.id"] = req.user.id; ctx["tenant.id"] = req.user.tenantId; }
  trace.getActiveSpan()?.setAttributes(ctx);
  requestLog.run(log.child(ctx), next);                          // every log in this request carries the IDs
});
```

- **Minimize identifiers:** collect a user ID only when needed for the diagnostic purpose; omit email and name. An opaque or hashed ID is not automatically anonymous. The source said opaque GUIDs reveal no personal information; the old bullet did not qualify that assumption. https://opentelemetry.io/docs/security/handling-sensitive-data/
- **Feature flags** belong here too (`feature.new_checkout = "on"`), so latency and errors can be compared between variants.
- **Take the tenant from the verified session,** not a header the client can set, or a caller can file their errors under someone else's tenant.
- These attributes go on spans and logs, **not** on metrics (rule 5).

## Tracing through queues and jobs

**Don't send trace headers to third parties.** Automatic propagation adds `traceparent` to every outbound request, including model APIs and sites you scrape; turn propagation off on clients that call outside services, so they get only the headers they ask for.

HTTP propagation is automatic; a message is just bytes until you carry the context in its headers. The amqplib and kafkajs instrumentations do it for those clients; for anything else (a Postgres outbox row, a pgmq message, a job table) do it yourself:

```ts
import { context, propagation, trace } from "@opentelemetry/api";

// producer: store the current context with the message
const headers: Record<string, string> = {};
propagation.inject(context.active(), headers);                   // adds traceparent (and tracestate)
await outbox.add(tx, { type: "OrderPlaced", content: event, headers });

// consumer: continue the producer's trace
const parent = propagation.extract(context.active(), row.headers ?? {});
await context.with(parent, () =>
  tracer.startActiveSpan("handle OrderPlaced", async (span) => { try { await handle(row); } finally { span.end(); } }));
```

A batch consumer that handles messages from many traces can instead start its own span and add a **link** to each message's context, so each trace still reaches the batch.

## Sampling

- **Development and low traffic:** record everything.
- **Production volume:** `OTEL_TRACES_SAMPLER=parentbased_traceidratio` with `OTEL_TRACES_SAMPLER_ARG=0.1` keeps 10% of new traces and follows the parent's decision for incoming ones, so a trace is complete or absent across all services. The ratio sampler alone, without the parent rule, cuts traces into fragments.
- **Keep the rare and valuable:** head sampling decides before anyone knows a request will fail. Collector tail-sampling policies can select error and slow traces, with all spans for a trace routed to the same collector. Decisions follow the configured processing strategy and waiting/buffering limits; they do not guarantee a complete trace or retention of every error/slow trace. The old line said decisions happen after trace completion and can keep every error and slow trace. [Official tail-sampling processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md)
- Metrics are aggregated, not sampled: counts stay exact whatever the trace sampling rate.

## Prove it

Apply the shared [trace, log-correlation, metric-cardinality and exporter-outage acceptance checks](SKILL.md#prove-it). [existing observability, SKILL.md, Prove it]
