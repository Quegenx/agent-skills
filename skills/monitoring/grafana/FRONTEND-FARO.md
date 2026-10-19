# Frontend Observability with Faro

Faro is Grafana's open-source JavaScript/TypeScript real user monitoring SDK (https://github.com/grafana/faro-web-sdk). It automatically captures real user performance metrics, errors, logs and client-side traces and sends them to Grafana Cloud Frontend Observability, or to a self-hosted Alloy `faro.receiver`. Data flows Browser to Faro Collector (batched HTTP POST) to Loki (logs), Tempo (traces) and Mimir (metrics). Most outcomes come down to the collector URL (unique per app and environment, and region-specific), the CORS origins allowed for it, the session sampling rate (it decides every signal, backend traces included), and whether `TracingInstrumentation` propagates `traceparent` to your API. Root-cause analysis of one real-user session with `gcx` is in [FARO-SESSIONS.md](FARO-SESSIONS.md). Docs: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/

**Contents:** [Packages](#packages) · [Create the app](#create-the-app) · [Initialize](#initialize) · [Configuration](#configuration) · [What it captures](#what-it-captures) · [Manual API](#manual-api) · [React](#react) · [Next.js](#nextjs) · [Tracing to the backend](#tracing-to-the-backend) · [Sampling](#sampling) · [Session Replay](#session-replay) · [Source maps](#source-maps) · [Self-hosted receiver](#self-hosted-receiver) · [Alerts and dashboards](#alerts-and-dashboards) · [Faro v2](#faro-v2) · [Prove it](#prove-it)

## Packages

| Package | What it adds |
|---|---|
| `@grafana/faro-core` | Core API and transports |
| `@grafana/faro-web-sdk` | Web instrumentations, web vitals, fetch/XHR, transports |
| `@grafana/faro-web-tracing` | OpenTelemetry-JS browser tracing |
| `@grafana/faro-react` | Error boundary, router integration (React Router v7, v6, v4/v5, data router), component profiler, SSR support |

- **Install:** `npm install @grafana/faro-web-sdk`; add `@grafana/faro-web-tracing` for tracing and `@grafana/faro-react` for React (`npm i @grafana/faro-react` or `yarn add @grafana/faro-react`).
- **CDN (IIFE, globals `GrafanaFaroWebSdk` and `GrafanaFaroWebTracing`):** `https://unpkg.com/@grafana/faro-web-sdk@latest/dist/library/faro-web-sdk.iife.js` and `https://unpkg.com/@grafana/faro-web-tracing@latest/dist/library/faro-web-tracing.iife.js`.
- **Other targets:** React Native, Flutter and native OpenTelemetry are named as instrumentation targets for frontend sessions, but no source here shows how to set them up.

## Create the app

- **Prerequisites:** a Grafana Cloud account with Frontend Observability, an app created, its app ID and instance URL.
- **Create:** Grafana > Frontend > Frontend Apps > Start observing > Create new: **App Name**, **CORS Allowed Origin** (`localhost` for local development), **Default attributes**. The CORS domain secures the app to specific domains.
- **Collector URL:** `https://faro-collector-prod-<region>.grafana.net/collect/<app-key>`. Find it under Grafana Cloud > **Connections** > search "Frontend Observability" > tile > **Web SDK Configuration** tab > copy `url`. It is unique per application and environment. The same page shows the app name, sample rate settings, the replay toggle and CDN tags.
- **Vanilla JS:** copy the snippet from **Web SDK Configuration** and paste it before the end of `head` on every page.

## Initialize

```javascript
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';

const faro = initializeFaro({
  url: 'https://faro-collector-prod-<region>.grafana.net/collect/<app-key>',
  app: { name: 'my-frontend-app', version: '1.0.0', environment: 'production' },
  instrumentations: [
    ...getWebInstrumentations({ captureConsole: true }),
  ],
});

faro.api.pushLog(['User clicked checkout']);
faro.api.pushError(new Error('Payment failed'));
faro.api.pushEvent('button_click', { button: 'checkout' });
```

- **Always spread `...getWebInstrumentations()`** when you pass `instrumentations`; leaving it out omits the default instrumentations.
- **The sources disagree on the URL and an `apiKey`.** The app-observability skill and the docs put the app key in the URL path (`/collect/<app-key>`) and pass no `apiKey`. Grafana's `testing` skill lists "a Faro app + write-token from **Frontend Observability > Apps**" as a prerequisite, installs `npm install @grafana/faro-web-sdk @grafana/faro-web-tracing`, and initializes with a separate `apiKey`:

```javascript
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

const faro = initializeFaro({
  url: 'https://faro-collector-prod-xx.grafana.net/collect',
  apiKey: 'your-faro-api-key',
  app: { name: 'my-frontend', version: '1.0.0', environment: 'production' },
  instrumentations: [
    ...getWebInstrumentations({ captureConsole: true, captureConsoleDisabledLevels: [] }),
    new TracingInstrumentation(),
  ],
});

// Custom events / measurements / errors
faro.api.pushEvent('checkout_completed', { cart_value: '99.99' });
faro.api.pushMeasurement({ type: 'api_latency', values: { ms: 234 } });
faro.api.pushError(new Error('Payment failed'));
```

## Configuration

| `FaroConfig` option | Default and meaning |
|---|---|
| `url` | Required |
| `app.name` | Required; `app.version` recommended; also `app.environment`, `app.namespace` |
| `instrumentations` | The list above |
| `sessionTracking.enabled` | `true` |
| `sessionTracking.persistent` | `false`; survives tab close, uses localStorage |
| `sessionTracking.maxSessionPersistenceTime` | 4 hours (ms) |
| `sessionTracking.samplingRate` | `1` (0 to 1) |
| `sessionTracking.generateSessionId`, `onSessionChange(oldSession, newSession)` | Hooks |
| `user` | `{ id, username, email, attributes }` |
| `globalObjectKey` | `'__faroBridge'` |
| `batchSendCount` / `batchSendTimeout` | `50` / `250` ms |

- **`getWebInstrumentations({ captureConsole: true /* default false */, captureConsoleDisabledLevels: ['log'], capturePageVisibility: true /* default true */ })`** includes `PerformanceInstrumentation`, `ErrorsInstrumentation`, `ConsoleInstrumentation` (when `captureConsole` is on), `SessionInstrumentation` and `ViewInstrumentation`.
- **Fetch instrumentation options:**

```javascript
import { FetchInstrumentation } from '@grafana/faro-web-sdk';

new FetchInstrumentation({
  requestHeaders: ['x-request-id', 'x-correlation-id'],
  responseHeaders: ['x-trace-id'],
  ignoredUrls: [/.*\/health/, 'https://analytics.internal/'],
}),
```

- **Other configure topics** (sampling, filter bots, exclude endpoints, override service name, data proxy, process Faro telemetry, error fingerprinting, inject instrumentation, composable frontends, upload source maps, CSP violation tracking): https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/configure/
- **Instrument topics** (page tracking, view tracking, navigation, session tracking, user actions, performance, web vitals, tracing, error tracking, console, custom signals; Faro Web SDK, Faro React, OpenTelemetry JS): https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/

## What it captures

- **Automatically:** page views and navigation timing; Core Web Vitals; JS errors and unhandled rejections; console errors and warnings (with `captureConsole`); resource loading; user interactions; fetch/XHR timing.
- **Web Vitals:** Faro v2 uses Web Vitals v5: LCP, CLS, INP (replaces FID), FCP, TTFB.
- **With `TracingInstrumentation`,** a `traceparent` header is injected into requests.

## Manual API

```javascript
faro.api.pushLog(['User completed checkout'], {
  level: LogLevel.INFO,
  context: { orderId: '12345' },
});

faro.api.pushError(new Error('Payment gateway timeout'), {
  type: 'NetworkError',
  context: { endpoint: '/api/pay' },
});

faro.api.pushEvent('feature_used', {
  feature: 'dark_mode',
  source: 'settings_page',
});

faro.api.pushMeasurement({
  type: 'custom_timing',
  values: {
    checkout_duration_ms: 1234,
  },
});

faro.api.setUser({
  id: 'user-456',
  username: 'jane.doe',
  attributes: { plan: 'premium' },
});

faro.api.setSession({ attributes: { experiment: 'checkout-v2' } });
```

## React

- **Minimal init from the React package** (the official React guide):

```ts
import { initializeFaro } from '@grafana/faro-react';

initializeFaro({
  // required: the URL of the Grafana collector
  url: 'my/collector/url',

  // required: the identification label of your application
  app: {
    name: 'my-react-app',
  },
});
```

```ts
const reactBrowserRouter = createBrowserRouter([
  // your routes...
]);

const browserRouter = withFaroRouterInstrumentation(reactBrowserRouter);
```

  The official guide imports `initializeFaro` from `@grafana/faro-react`; the vendor skill's full example below imports it from `@grafana/faro-web-sdk`.
- **React Router v6 data router (recommended), with tracing:**

```javascript
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import {
  createReactRouterV6DataOptions,
  ReactIntegration,
  withFaroRouterInstrumentation,
} from '@grafana/faro-react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Must call BEFORE rendering
initializeFaro({
  url: 'https://faro-collector-prod-<region>.grafana.net/collect/<key>',
  app: { name: 'my-react-app', version: '2.0.0', environment: 'production' },
  instrumentations: [
    ...getWebInstrumentations({ captureConsole: true }),
    new TracingInstrumentation(),
    new ReactIntegration({
      router: createReactRouterV6DataOptions({}),
    }),
  ],
});

// Instrument the router
const router = withFaroRouterInstrumentation(
  createBrowserRouter([
    { path: '/', element: <HomePage /> },
    { path: '/products/:id', element: <ProductPage /> },
    { path: '/checkout', element: <CheckoutPage /> },
  ])
);

function App() {
  return <RouterProvider router={router} />;
}
```

- **React Router v6 without a data router:** `createReactRouterV6Options({ useLocation, useNavigationType, createRoutesFromChildren, matchRoutes })`, with `<FaroRoutes>` in place of `<Routes>`. **v4/v5:** `createReactRouterV5Options({ history })` with `createBrowserHistory()` from `history`, and `<Router history={history}>`. Router v7, SSR and component profiling: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/faro-react/
- **Error boundary:**

```javascript
import { FaroErrorBoundary, withErrorBoundary } from '@grafana/faro-react';

function App() {
  return (
    <FaroErrorBoundary
      fallback={<ErrorFallback />}
      pushErrorAsFaro={true}       // auto-pushes to Faro (default: true)
    >
      <MainContent />
    </FaroErrorBoundary>
  );
}

const SafeComponent = withErrorBoundary(MyComponent, {
  fallback: <p>Something went wrong</p>,
});
```

## Next.js

App router. Example app: https://github.com/grafana/faro-nextjs-example

- **Env vars:** `NEXT_PUBLIC_FARO_URL`, `NEXT_PUBLIC_FARO_APP_NAME` (different for backend and frontend), `NEXT_PUBLIC_FARO_APP_NAMESPACE` (same as the backend namespace), `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL` (`http/protobuf`), `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES` (`service.namespace` equal to the frontend namespace, for correlation). Example: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`, `OTEL_RESOURCE_ATTRIBUTES=service.namespace=nextjs-example`.
- **Client component** (`npm i @grafana/faro-web-sdk`), `components/frontend-observability.tsx`:

```ts
'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export default function FrontendObservability() {
  // skip if already initialized
  if (faro.api) {
    return null;
  }

  try {
    const faro = initializeFaro({
      url: process.env.NEXT_PUBLIC_FARO_URL,
      app: {
        name: process.env.NEXT_PUBLIC_FARO_APP_NAME || 'unknown_service:webjs',
        namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || undefined,
        version: process.env.VERCEL_DEPLOYMENT_ID || '1.0.0',
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
      },

      instrumentations: [
        // Mandatory, omits default instrumentations otherwise.
        ...getWebInstrumentations(),

        // Tracing package to get end-to-end visibility for HTTP requests.
        new TracingInstrumentation(),
      ],
    });
  } catch (e) {
    return null;
  }
  return null;
}
```

- **Backend:** `npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation`; `instrumentation.ts` at the project root with `registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME || 'unknown_service:node', spanProcessors: ['auto', new SpanNameProcessor()] })`, where `SpanNameProcessor.onStart` renames spans starting `GET /_next/static` to `GET /_next/static` and `GET /_next/data` to `GET /_next/data` to reduce span-name cardinality ("Customize with care!").
- **Correlation:** `middleware.ts` at the root sets the `server-timing` header to `traceparent;desc="00-${traceId}-${spanId}-01"` from `trace.getActiveSpan()`. In DevTools Network, a response should carry `server-timing: traceparent;desc="00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"`. Enable client services in Application Observability for the service graph.
- **Source maps:** Next.js uses Turbopack, so use the Faro CLI ([Source maps](#source-maps)); webpack users can use the Faro webpack plugin with `nextjs: true` (adds the `_next/` prefix).

| Next.js symptom | Check |
|---|---|
| `server-timing` header missing | `middleware.ts` at the root, OTel initialized in `instrumentation.ts`, server restarted |
| Traces with only one side | `TracingInstrumentation` included, `NEXT_PUBLIC_FARO_APP_NAMESPACE` matches `service.namespace`, client services enabled |

## Tracing to the backend

- **Not enabled by default.** It uses `@opentelemetry/instrumentation-fetch` and `@opentelemetry/instrumentation-xml-http-request`, reports through `faro.api.pushTraces()`, and its default propagator `W3CTraceContextPropagator` adds `traceparent` to fetch requests. Include `...getWebInstrumentations()` together with `new TracingInstrumentation({...})`.

```javascript
new TracingInstrumentation({
  // Propagate trace context to these URLs (supports regex)
  propagateTraceHeaderCorsUrls: [
    /https:\/\/api\.myapp\.com\/.*/,
    'https://internal.service.com',
  ],
  // Custom sampling rate for traces (0-1)
  // samplingRate: 0.5,
}),
```

- **What it does:** injects `traceparent` and `tracestate` into matching fetch/XHR requests, creates a browser span for each HTTP call, and propagates the session ID as baggage. The Tempo root span shows `session.id`, and errors get a "View trace" button when a `traceId` is present.
- **Requirements:** the backend accepts W3C `traceparent`, and frontend and backend send to the same Tempo. Backend instrumentation is [OTLP-GATEWAY.md](OTLP-GATEWAY.md).
- **Options:** `resourceAttributes`; `propagator`; `contextManager` (default Zone); `instrumentations` with `getDefaultOTELInstrumentations({ ignoreUrls: [/localhost:3000/] })`; `omitTraceContextForUnsampledSessions` (default `false`); `ignoreUrls` (prefer Faro's global setting); `propagateTraceHeaderCorsUrls` (which cross-origin URLs get trace headers); `fetchInstrumentationOptions` / `xhrInstrumentationOptions` with `applyCustomAttributesOnSpan` and `ignoreNetworkEvents`.

## Sampling

- **Sampling is per user session:** a sampled session sends every signal, an unsampled one discards all. Rate 0 to 1, default 1. The decision is made on page load (when web storage holds no valid session) and on session extend or `setSession(...)`.
- **Set it** with `sessionTracking: { samplingRate: 0.8 }`, or a custom `sessionTracking.sampler(context)` returning 0 to 1 (for example by `context.metas.user?.attributes?.['planet']`), which can introduce bias.
- **For consistency, configure backends with `parent-based` sampling.** Web-tracing sets the W3C sampled flag, so lowering Faro's rate lowers backend traces too. To sample the backend independently, `new TracingInstrumentation({ omitTraceContextForUnsampledSessions: true })`:

| Session | Header sent | Backend |
|---|---|---|
| Sampled | `traceparent` with flag `01` | Records |
| Unsampled, default | Flag `00` | Joins but records nothing |
| Unsampled, option on | No header (custom propagator output, `tracestate` and `baggage` withheld too) | Records a new trace that can't be navigated back to a browser session |

## Session Replay

- **Records DOM mutations with rrweb.** Turn on the "Session Replay" toggle in Web SDK Configuration to get a replay-enabled collector URL; the collector key controls what is recorded on the server.
- **Cost control:** the example uses `sessionTracking: { persistent: true, samplingRate: 0.1 }`, 10% of sessions.
- **The UI** has a "Play" button and filters by error, duration, user and URL.

## Source maps

- **Optional but strongly recommended for production.** Public source maps let users reconstruct your codebase; upload them privately to Grafana Cloud. Methods: bundler plugins (Webpack, Rollup/Vite), the Faro CLI, cURL. The bundler plugins support client-side rendered apps only, not server-side rendering.
- **Faro CLI** (`npm install --save-dev @grafana/faro-cli`), values from Frontend Observability > Settings > Source Maps:

```bash
npx faro-cli upload --endpoint "$FARO_SOURCEMAP_API_URL" --app-id "$FARO_APP_ID" --api-key "$FARO_API_KEY" --stack-id "$FARO_STACK_ID" --bundle-id "$BUNDLE_ID" --app-name "next-frontend" --output-path "./.next/static" --verbose
```

- **Use the same bundle ID in three places:** `bundleId` in `initializeFaro`, `npx faro-cli inject-bundle-id --bundle-id "$BUNDLE_ID" --app-name "next-frontend" --files "./.next/static/**/*.js" --verbose`, and the upload. One bundle ID per deployment: `git rev-parse --short HEAD`, `date +%s`, or `$GITHUB_RUN_ID`.

## Self-hosted receiver

Open source users can use Alloy's `faro.receiver` (https://grafana.com/docs/alloy/latest/reference/components/faro.receiver/) as the collector. Alloy itself is [ALLOY.md](ALLOY.md).

```river
faro.receiver "default" {
  server {
    listen_address           = "0.0.0.0"
    listen_port              = 12347
    cors_allowed_origins     = ["https://myapp.com"]
    api_key                  = env("FARO_API_KEY")
    max_allowed_payload_size = "10MiB"
  }

  sourcemaps {
    download          = true
    upload {
      external_url = "https://myfrontend.cdn.com"
    }
  }

  output {
    logs   = [loki.write.grafana_cloud.receiver]
    traces = [otelcol.exporter.otlphttp.grafana_cloud.input]
  }
}
```

- **Never put `"*"` in `cors_allowed_origins` in production;** it lets any site send telemetry.

## Alerts and dashboards

- **Alerts** are Grafana-managed; enabling them creates data source-managed recording rules per `app-id`. Preconfigured: new errors and increasing error counts; Web Vitals (LCP, FID, CLS) and TTFB, FCP, INP; day-over-day performance degradation. The alert page still lists FID, which Faro v2 no longer reports; check the current alert list. Rules and routing in general: [ALERTING.md](ALERTING.md).
- **Prebuilt dashboards:** Overview, Sessions, Errors, Performance, User Journey.

## Faro v2

- **Changes from v1:** Web Vitals v5 (FID removed, INP added); `captureConsole` became an option of `getWebInstrumentations()`; some deprecated span attributes removed; session attributes are now structured.
- **Migration guide:** https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/upgrading/upgrade-v2/

For this workflow, read [FARO-SESSIONS.md](FARO-SESSIONS.md). [existing skills/monitoring/grafana/FRONTEND-FARO.md]

## Prove it

- **Smoke event:** push `faro.api.pushEvent('faro_smoketest', { ts: Date.now().toString() });`.
- **Collector accepts it:** in DevTools the POST to `/collect` returns **202**. **401** means a wrong app key (the testing skill says an `apiKey` mismatch); **404** means the URL region doesn't match the Faro app. The testing skill names a wrong `apiKey` or `url` (it must match the Frontend Observability app) as the common cause of events not landing.
- **It landed:** LogQL `{kind="event"} |= "faro_smoketest"` returns it, and Frontend Observability > app > Sessions lists the session.
- **Trace propagation:** a request to an API in `propagateTraceHeaderCorsUrls` carries `traceparent`, and an error with a `traceId` shows a "View trace" button. In Tempo, filter by `service.name="my-frontend"` (the testing skill's check). On Next.js, responses carry the `server-timing: traceparent;desc=...` header.
- **Source maps:** the same bundle ID appears in `initializeFaro`, `inject-bundle-id` and the upload.
- **No wildcard CORS** on any self-hosted `faro.receiver`.
