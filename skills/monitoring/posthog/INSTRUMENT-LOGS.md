# Instrumenting logs

PostHog Logs takes OpenTelemetry structured logs (resource attributes, log attributes, trace context) from any OTel client: no PostHog-specific packages are needed on the server, you point the OTel SDK at PostHog's HTTP endpoint with the project token. The JS web, React Native, iOS, Android and Flutter SDKs have built-in logging. Most outcomes are decided by three things: the right token and endpoint, flushing before a serverless function or short process freezes, and emitting one wide structured event per request instead of narrating code. Generic OpenTelemetry setup and the collector are in the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill; searching, investigating and alerting on logs in [LOGS-AND-APM.md](LOGS-AND-APM.md); metrics in [INSTRUMENT-METRICS.md](INSTRUMENT-METRICS.md).

**Contents:** [Concepts](#concepts) · [Workflow](#workflow) · [Token and endpoint](#token-and-endpoint) · [Next.js](#nextjs) · [Node.js](#nodejs) · [React Native and Expo](#react-native-and-expo) · [Flutter](#flutter) · [Browser console logs](#browser-console-logs) · [Datadog forwarding](#datadog-forwarding) · [Link logs to replays and persons](#link-logs-to-replays-and-persons) · [Best practices](#best-practices) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Concepts

- **Events track what the user did** (clicks, signups, purchases); **logs track what the system did** (API requests, errors, retries, timeouts, config failures). `database_connection_failed` or `stripe_api_timeout` captured as events belong in logs instead.
- **Levels:** INFO, DEBUG, WARN, ERROR (the UI facets add `trace` and `fatal`).
- **Logs with `$exception` events become Error Tracking issues** you can assign, resolve and alert on ([ERROR-TRACKING.md](ERROR-TRACKING.md)).
- **Retention:** 14 days by default; custom retention per service or source is available.

## Workflow

1. **Detect the platform:** language, framework, existing logging (winston, pino, ...), dependency files and lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`, ...) for the package manager. If an OTLP exporter is already configured, skip to step 5.
2. **Read the matching platform section below;** otherwise use generic OTel ([Token and endpoint](#token-and-endpoint)).
3. **Install the OTel SDK and OTLP exporter** with the package manager's install command. Do not manually edit dependency files.
4. **Configure the OTLP exporter** to PostHog's ingest endpoint. Platforms with SDK-native logs (Android, React Native, iOS, Flutter) use the SDK instead of a separate exporter.
5. **Add the exporter alongside existing logging.** Don't replace handlers; make minimal, targeted additions; read a file immediately before writing it.
6. **Prefer structured key-value properties over plain text.**
7. **Environment variables.** Check `.env`, `.env.local` and framework env files. If the token is missing, use the PostHog MCP `projects-get` to retrieve `api_token` (ask which project if there are several; if MCP isn't connected, ask the user). Host from the `region` field: `US` is `https://us.i.posthog.com`, `EU` is `https://eu.i.posthog.com`; otherwise ask "Are you on PostHog US Cloud or EU Cloud?". Do not assume US Cloud. Reference env vars in code; never hardcode.

- **Missing PostHog config:** follow the canonical [SETUP-WEB commandments](SETUP-WEB.md#the-commandments), including production no-op and the source's development/debug diagnostic. [existing PostHog, SETUP-WEB.md, The commandments]

## Token and endpoint

- **Use the project token, starting `phc_`** (Project Settings; the same one you use for capturing events). Do not use a personal API key `phx_` or other authentication methods.
- **Endpoint:** `https://us.i.posthog.com/i/v1/logs`, OTLP over HTTP.
- **Auth:** header `Authorization: Bearer <ph_project_token>`, or query param `https://us.i.posthog.com/i/v1/logs?token=<ph_project_token>`.
- **The endpoint path differs between sources:** the instrumentation workflow gives the OTel endpoint as `https://us.i.posthog.com/v1` (EU `https://eu.i.posthog.com/v1`), while every platform reference and the troubleshooting table use the full logs URL `https://us.i.posthog.com/i/v1/logs`. Confirm in the current docs.
- **Other languages:** pick an OTel SDK from https://opentelemetry.io/ecosystem/registry/.

## Next.js

- **Install:** `npm install @opentelemetry/sdk-logs @opentelemetry/exporter-logs-otlp-http @opentelemetry/api-logs @opentelemetry/resources`
- **Instrumentation hook:** Next.js 13.2 to 14.x need `experimental: { instrumentationHook: true }` in `next.config.js`. In Next.js 15+ `instrumentation.ts` is enabled by default and `experimental.instrumentationHook` is deprecated: remove it.
- **`instrumentation.ts` in the project root (or `src/`).** Create the `LoggerProvider` outside `register()` and export it: Route Handlers complete before batched logs are sent, so they must flush it. The `Content-Type: application/json` header is required.

```typescript
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { logs } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'

// Create LoggerProvider outside register() so it can be exported and flushed in route handlers
export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': 'my-nextjs-app' }),
  processors: [
    new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter({
        url: 'https://us.i.posthog.com/i/v1/logs',
        headers: {
          Authorization: 'Bearer <ph_project_token>',
          'Content-Type': 'application/json',
        },
      }),
    }),
  ],
})

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logs.setGlobalLoggerProvider(loggerProvider)
  }
}
```

- **Route handler:** without `forceFlush()` logs may not be sent. `after()` is stable in Next.js 15.1+ (`unstable_after` in 15.0); on 14 and earlier call `await loggerProvider.forceFlush()` before `return`.

```typescript
import { SeverityNumber } from '@opentelemetry/api-logs'
import { after } from 'next/server'
import { loggerProvider } from '@/instrumentation'

const logger = loggerProvider.getLogger('my-nextjs-app')

export async function GET() {
  logger.emit({
    body: 'API request received',
    severityNumber: SeverityNumber.INFO,
    attributes: {
      endpoint: '/api/example',
      method: 'GET',
    },
  })

  // Ensure logs are flushed before the serverless function freezes
  after(async () => {
    await loggerProvider.forceFlush()
  })

  return Response.json({ success: true })
}
```

## Node.js

- **Install:** `npm install @opentelemetry/sdk-node @opentelemetry/exporter-logs-otlp-http @opentelemetry/api-logs @opentelemetry/resources @opentelemetry/sdk-logs`

```javascript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'my-node-service',
  }),
  logRecordProcessors: [
    new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter({
        url: 'https://us.i.posthog.com/i/v1/logs',
        headers: {
          'Authorization': 'Bearer <ph_project_token>'
        }
      })
    })
  ]
});

sdk.start();
```

```javascript
import { logs } from '@opentelemetry/api-logs';

const logger = logs.getLogger('my-app');

// Log with different levels and attributes
logger.emit({ severityText: 'trace', body: 'log data', attributes: {'my_attribute': 'stringValue'} });
logger.emit({ severityText: 'warn', body: 'log data', attributes: {'warning_count': 3} });
logger.emit({ severityText: 'error', body: 'log data', attributes: {'json_attribute': [1,2,3]} });
```

## React Native and Expo

- **Built in:** the SDK handles OTLP encoding, batching, persistence and lifecycle. APIs: `posthog.captureLog(...)` and `posthog.logger.{trace,debug,info,warn,error,fatal}(...)`.
- **JavaScript layer only:** native `os_log` and `Log.d` are not collected.
- **Minimum `posthog-react-native@4.44.0` for Logs.** Installation, Expo/bare/native-web storage selection and provider/client setup are in [SETUP-MOBILE.md](SETUP-MOBILE.md). Keep the Logs configuration and APIs below. [existing PostHog, INSTRUMENT-LOGS.md, React Native and Expo]

```jsx
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  logs: {
    serviceName: 'my-app',          // OTLP service.name: shown in the Logs UI
    environment: 'production',      // OTLP deployment.environment
    serviceVersion: '1.2.3',        // OTLP service.version
  },
})
```

```jsx
posthog.logger.info('checkout completed', { order_id: 'ord_789', amount_cents: 4999 })
posthog.logger.warn('payment retry', { attempt: 2 })
posthog.logger.error('payment failed', { code: 'E001' })

posthog.captureLog({
  body: 'checkout failed',
  level: 'error',
  attributes: { order_id: 'ord_789', step: 'auth' },
  trace_id: '4bf92f3577b34da6a3ce929d0e0e4736',  // optional W3C trace context
  span_id: '00f067aa0ba902b7',
})
```

- **Flush:** automatic every 10 s, on AppState change, on buffer fill, or on `posthog.shutdown()`; immediately with `await posthog.flushLogs()`.
- **Auto tags on every record:** distinct ID, session ID, current screen, foreground or background state, active feature flags.

| `logs` field | Default |
| --- | --- |
| `serviceName` | `'unknown_service'` |
| `serviceVersion` | undefined |
| `environment` | undefined |
| `resourceAttributes` | `{}` |
| `flushIntervalMs` | `10000` |
| `maxBufferSize` | `100` |
| `maxBatchRecordsPerPost` | `50` (halved on 413) |
| `rateCap.maxLogs` | `500` |
| `rateCap.windowMs` | `10000` |
| `beforeSend` | undefined (return `null` to drop) |

The defaults give about a 50 logs/sec ceiling and about a 16KB maximum queue file.

- **`beforeSend` runs synchronously before the rate cap** (dropped records don't consume budget). It can be an array chained left to right; `null` short-circuits; a throwing filter logs an error and drops the record (fail-closed).

```jsx
beforeSend: (record) => {
  // Drop debug logs in production
  if (record.level === 'debug') return null

  // Redact secrets in the body
  return {
    ...record,
    body: record.body.replace(/api_key=\S+/g, 'api_key=[REDACTED]'),
  }
},
```

- **Test:** `posthog.logger.info('hello from RN')`, then `await posthog.flushLogs()`, and filter the Logs UI by `service.name = 'my-app'`.

## Flutter

- **Built in across mobile and web.** On mobile, on-disk persistence across restarts and lifecycle integration; on web, buffered in memory via `posthog-js`. APIs: `Posthog().captureLog(...)` and `Posthog().logger.{trace,debug,info,warn,error,fatal}(...)`.
- **Manual capture only:** `print`, `debugPrint` and `dart:developer` `log` are not autocaptured.
- **Minimum `posthog_flutter` `5.27.0`** (adds Logs); on mobile it pulls `posthog-android` `3.48.0`+. The same reference's install snippet shows `posthog_flutter: ^5.26.0` in `pubspec.yaml`, which is below that minimum: use at least 5.27.0.
- **General Flutter init and platform requirements:** [SETUP-FLUTTER.md](SETUP-FLUTTER.md#flutter-install-and-init) owns Android/iOS metadata, AUTO_INIT, native minima and SPM, plus the complete source `main()` example. [Flutter Web](SETUP-FLUTTER.md#flutter-web) owns the required JS snippet; `Posthog().setup()` is a no-op there. Keep the Logs-specific version minimum above and the config, web behavior, capture and flush rules below. [existing PostHog, INSTRUMENT-LOGS.md, Flutter]

- **Logs config, before setup:**

```dart
final config = PostHogConfig('<ph_project_token>');
config.host = 'https://us.i.posthog.com';
config.logsConfig.serviceName = 'my-app';        // OTLP service.name: shown in the Logs UI
config.logsConfig.environment = 'production';    // OTLP deployment.environment
config.logsConfig.serviceVersion = '1.2.3';      // OTLP service.version
await Posthog().setup(config);
```

- **On Flutter Web `config.logsConfig` is not applied.** Configure `logs: { serviceName, environment, serviceVersion }` in `posthog.init` in `web/index.html`. `captureLog` and `logger` are forwarded to posthog-js (needs a recent posthog-js that exposes `captureLog`); `beforeSend` still runs in Dart.
- **Capture:**

```dart
Posthog().logger.info('checkout completed', {'order_id': 'ord_789', 'amount_cents': 4999});
Posthog().logger.warn('payment retry', {'attempt': 2});
Posthog().logger.error('payment failed', {'code': 'E001'});

Posthog().captureLog(
  body: 'checkout failed',
  level: PostHogLogSeverity.error,
  attributes: {'order_id': 'ord_789', 'step': 'auth'},
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',  // optional W3C trace context (32 hex chars)
  spanId: '00f067aa0ba902b7',                   // optional W3C span (16 hex chars)
  traceFlags: 1,
);
```

- **Facade methods** take a `String body` and an optional `Map<String, Object>`; severities are `PostHogLogSeverity.trace/.debug/.info/.warn/.error/.fatal`; trace fields exist only on `captureLog`.
- **Flush:** every 30 s, at the buffer threshold, on background, or with `Posthog().flush()` (drains events, Session Replay and Logs together).
- **Auto tags:** distinct ID, session ID, active flags, and on mobile the screen and app state; web tags `url.full` instead.

| `logsConfig` field (not applied on web) | Default |
| --- | --- |
| `serviceName` | app bundle id (iOS) / namespace (Android) |
| `serviceVersion` | app version |
| `environment` | none |
| `resourceAttributes` | `{}` |
| `flushInterval` | 30s |
| `flushAt` | 20 |
| `maxBatchSize` | 50 |
| `maxBufferSize` | 1000 (on disk, FIFO eviction) |
| `rateCapMaxLogs` | 500 (`0` disables) |
| `rateCapWindow` | 10s |

- **`config.logsConfig.beforeSend` is a `List<BeforeSendLogCallback>`,** each `FutureOr<PostHogLogRecord?> Function(PostHogLogRecord)`. It runs in Dart on all platforms including web, left to right; `body`, `level` and `attributes` are mutable; `null` drops; an empty or whitespace body drops; a throw drops (fail-closed).

```dart
config.logsConfig.beforeSend = [
  (record) {
    // Drop debug logs in production
    if (record.level == PostHogLogSeverity.debug) return null;

    // Redact a sensitive attribute
    record.attributes?.remove('password');
    return record;
  },
  // Compose a chain: callbacks run left-to-right
  (record) => record.body.contains('secret') ? null : record,
];
```

## Browser console logs

- **posthog-js captures `console.*`.** Upgrade to **1.422.0**+ (it buffers `console.*` while the logs script loads, then backfills) and enable with `logs: { captureConsoleLogs: true }` in `posthog.init()`, not only the **Capture console logs** project setting (which alone waits for remote config on first load).
- **Captured levels:** `console.log/info/debug/warn/error`. If more than `logs.maxBufferSize` (default 100) calls happen before the script loads, only the earliest are kept.

## Datadog forwarding

- **Endpoint:** `https://us.i.posthog.com/i/v1/logs/datadog/<ph_project_token>`. Set it in the Datadog Agent env `DD_LOGS_CONFIG_LOGS_DD_URL`, or in `datadog.yaml`, then restart the agent. It accepts the standard Datadog log format.

```yaml
logs_config:
  logs_dd_url: "https://us.i.posthog.com/i/v1/logs/datadog/<ph_project_token>"
```

## Link logs to replays and persons

- **Client-side `posthog.captureLog` / `posthog.logger.*`** (JS web or RN) attach `distinct_id` and `session_id` automatically. Manual setup is only for logs emitted by the backend.
- **Frontend:** `const sessionId = posthog.get_session_id()` and send it in the API request body.
- **Backend attributes:** `posthogDistinctId` links to the user and `sessionId` links to the replay; set either or both.

```javascript
import { logs } from '@opentelemetry/api-logs'

const logger = logs.getLogger('my-app')

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body
  const userId = req.userId // ... get your user ID

  logger.emit({
    severityText: 'info',
    body: 'Chat request received',
    attributes: {
      posthogDistinctId: userId,       // Links to PostHog user
      sessionId: sessionId,            // Links to session replay
      endpoint: '/api/chat',
    },
  })

  // ... handle the request

  res.json({ success: true })
})
```

- **In the UI:** hover a log and click **View recording** (opens the replay at the log's timestamp), or use the log details. The button shows only for logs with a session ID. The **Related errors** tab shows Error Tracking issues in the same session within ±6 hours of the log.
- **Prerequisites:** a logging client, posthog-js or the RN SDK on the frontend, and session replay enabled (the distinct ID link works without replay). See [SESSION-REPLAY.md](SESSION-REPLAY.md).

## Best practices

Read [the shared structured-logging guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/LOGGING.md) for wide events, context, level semantics, schema and privacy. The source examples below retain the PostHog person/event fields. [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

**Source plain-text counterexample:** `Payment failed for user abc123 - Stripe error: card_declined (amount: $49.99)`. The shared guidance keeps the structured-field rule. [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

**Provider event fields, source example:**

```json
{
  "event": "payment.completed",
  "duration_ms": 342,
  "posthogDistinctId": "user_abc123",
  "order_id": "ord_789",
  "amount_cents": 4999,
  "currency": "USD",
  "payment_method": "card",
  "provider": "stripe",
  "provider_latency_ms": 287,
  "retry_count": 0,
  "feature_flags": ["new_checkout_flow"],
  "subscription_tier": "pro"
}
```

**Accumulating PostHog request context, source example:**

```javascript
import { logs } from "@opentelemetry/api-logs";

const logger = logs.getLogger("my-app");

function handleCheckout(req, res) {
  const attrs = {
    event: "checkout",
    posthogDistinctId: req.user.id,
    subscription_tier: req.user.tier,
  };

  const cart = getCart(req.user);
  Object.assign(attrs, { item_count: cart.items.length, cart_total_cents: cart.totalCents });

  try {
    const payment = processPayment(cart);
    Object.assign(attrs, {
      payment_method: payment.method,
      provider: payment.provider,
      provider_latency_ms: payment.latencyMs,
      status: "success",
    });
    logger.emit({ severityText: "INFO", body: "checkout completed", attributes: attrs });
  } catch (e) {
    Object.assign(attrs, { status: "failed", error_type: e.code });
    logger.emit({ severityText: "ERROR", body: "checkout completed", attributes: attrs });
    throw e;
  }
}
```

- **Want high cardinality and high dimensionality.** One wide event with 50 fields tells you more than 50 separate log lines with three fields each; ClickHouse handles high cardinality fine.
- **PostHog log attributes per event:** `posthogDistinctId`, `order_id`, `payment_method`, `duration_ms`. Match log context to Product Analytics event properties. [existing PostHog, INSTRUMENT-LOGS.md, Best practices]
- **Drop rules** (Logs > Configuration > Drop rules) run at ingestion, before storage. **Drop** discards every matching line (health checks, load balancer pings, liveness probes); **Rate limit** caps a service in KB/s. Match by service name, severity or any attribute. Rules run top to bottom after optional PII scrubbing and JSON parsing: order them most to least specific (drag to reorder). Log-based metric rules evaluate before drop rules, so counts survive dropped logs (https://posthog.com/docs/logs/metrics).
- **Automatic PII scrubbing is a safety net, not a substitute.** It is in closed beta (internal teams only; request via in-app support), at Project settings > Logs > PII scrubbing, off by default. It redacts to `{{REDACTED}}` in `body` and string-valued `attributes`: Bearer tokens (keeping the prefix: `Bearer {{REDACTED}}`), Stripe keys `sk_live_*` / `sk_test_*` followed by 20 or more alphanumerics, and email addresses. It is a single regex pass: no JSON parsing, no nested walk, no key-name redaction, and it doesn't touch `resource_attributes`, `service_name`, `severity_text` or trace IDs. It is permanent and irreversible. It does not catch card numbers (PANs), secrets identified only by key name, numbers or booleans inside JSON, or anything else (custom tokens, session IDs, addresses, phones, names, IPs).

- **Checklist:** apply [observability LOGGING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/LOGGING.md#prove-it), include the selected PostHog person/session fields, verify the replay link, review source-specific drop rules and PII scrubbing, and keep the SDK examples' version and platform qualifications. [existing PostHog, INSTRUMENT-LOGS.md, Best practices]

## Troubleshooting

| Problem | Fix |
| --- | --- |
| 401 Unauthorized | Correct project token; header `Bearer <ph_project_token>` or `?token=`; token not rotated or revoked |
| Cannot connect | Endpoint `https://us.i.posthog.com/i/v1/logs`; outbound HTTPS allowed; firewall; self-hosted endpoint |
| Logs sent but not appearing | Token and project correct; OTLP format; project has Logs access; requests succeed (200) in the browser or application network tab |
| Early startup logs missing (web): console output from the first moments of a page load (React hydration warnings, errors thrown during bootstrap) never arrives, later calls do | posthog-js 1.422.0+; `logs: { captureConsoleLogs: true }` in init; levels log/info/debug/warn/error; `logs.maxBufferSize` 100 |
| Performance (high memory, slow processing) | Adjust the batch size; `BatchLogRecordProcessor` instead of `SimpleLogRecordProcessor`; filter on the client; check network latency to PostHog |
| Format problems | Standard OTLP log format (https://opentelemetry.io/docs/specs/otel/logs/data-model/); levels; log attributes properly structured; OTel logging APIs, not raw libraries |
| Person profile Logs tab empty | The attribute must be exactly `posthogDistinctId` (camelCase, lowercase p); `distinct_id`, `posthog_distinct_id` and `user_id` are not equivalent unless set as the custom key (via the `logs_config` endpoint; a hint shows above the chart); the value must equal one of the person's distinct_ids exactly (partial or prefixed matches are not picked up); the tab uses the same date range picker as the Logs view, so widen it |
| Next.js route handler logs missing | Flush: `forceFlush()` in `after()` (Next.js 15.1+) or before `return` |
| Self-hosted | Use the instance URL instead of `https://us.i.posthog.com`; the logs endpoint is enabled; endpoint path `/logs`; a version that supports logs |

- **Still stuck:** match the OTel client config to the installation examples, test with a simple log message before complex ones, and check the network requests for the actual HTTP status codes and error messages.

## Prove it

- **One log arrives:** emit a test log (`posthog.logger.info('hello from RN')` plus `flushLogs()`, or one `logger.emit` in a route that flushes) and find it in the Logs UI filtered by its `service.name`.
- **Serverless flush works:** a log emitted in a Next.js route handler appears; with the `forceFlush()` removed it may not.
- **Auth is right:** the exporter gets 200, not 401; the token starts `phc_`.
- **The app survives without config:** build and boot with no PostHog env vars; production is a no-op and development prints the missing-variable message.
- **Linking works:** a backend log carrying `posthogDistinctId` shows on that person's Logs tab, and one carrying `sessionId` shows **View recording**.
