# Instrumenting a Node service

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
  traceExporter: new OTLPTraceExporter(),                 // endpoint, headers, protocol from OTEL_EXPORTER_OTLP_* env vars
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: 30_000 }),
  instrumentations: [getNodeAutoInstrumentations({ "@opentelemetry/instrumentation-fs": { enabled: false } })],
});
sdk.start();

process.on("SIGTERM", () => { sdk.shutdown().finally(() => process.exit(0)); });   // flush buffered spans before exit
```

- **Automatic instrumentation covers** incoming and outgoing HTTP, Express and Fastify routes, `pg`, `ioredis`, `amqplib`, `kafkajs`, gRPC and more. The file-system instrumentation is noisy; turn it off unless you need it.
- **Configure by environment,** so the same build runs everywhere: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL` (`http/protobuf` or `grpc`), `OTEL_EXPORTER_OTLP_HEADERS` (backend credentials), `OTEL_SERVICE_NAME`, `OTEL_TRACES_SAMPLER` and `OTEL_TRACES_SAMPLER_ARG`. Keep the header value in a secret store; it's a credential.
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

Use a structured logger (pino) and let the instrumentation inject the active `trace_id` and `span_id` into every record; the pino instrumentation in the auto-instrumentations package does both the injection and, if configured, sending records over OTLP. Then a trace view can list the logs written during that request, and a log line links back to its trace.

```ts
log.info({ orderId: order.id, customerId: order.customerId, totalCents: order.totalCents }, "order placed");
// not: log.info(`Order ${order.id} placed by ${email}`)   - unsearchable fields, and personal data
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

- **Opaque identifiers only:** a user ID is enough to find everything; email and name aren't needed and are personal data.
- **Feature flags** belong here too (`feature.new_checkout = "on"`), so latency and errors can be compared between variants.
- **Take the tenant from the verified session,** not a header the client can set, or a caller can file their errors under someone else's tenant.
- These attributes go on spans and logs, **not** on metrics (rule 5).

## Tracing through queues and jobs

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
- **Keep the rare and valuable:** head sampling decides before anyone knows a request will fail. Tail sampling in a collector (or the backend) decides after the trace completes and can keep every error and every slow trace while sampling the rest; it needs all spans of a trace to reach the same collector.
- Metrics are aggregated, not sampled: counts stay exact whatever the trace sampling rate.
