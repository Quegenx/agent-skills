# React Tracing

Tracing in `@sentry/react` records a `pageload` span for the first load, a `navigation` span for each client route change and an `http.client` span for every fetch or XHR, then joins them to backend traces through headers. The router integration names transactions by route pattern (`/users/:userId`) instead of by URL; without it every user generates a unique transaction name and nothing can be aggregated. Setup and errors are in [REACT.md](REACT.md); React Router framework mode and TanStack Start in [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md). Vendor-neutral OpenTelemetry is the `observability` skill ([../observability/SKILL.md](../observability/SKILL.md)).

**Contents:** [Versions](#versions) · [What is traced automatically](#what-is-traced-automatically) · [browserTracingIntegration options](#browsertracingintegration-options) · [Web Vitals](#web-vitals) · [Router integrations](#router-integrations) · [Custom routing](#custom-routing) · [Custom spans](#custom-spans) · [Distributed tracing](#distributed-tracing) · [Sampling](#sampling) · [Filtering spans](#filtering-spans) · [Debugging](#debugging) · [Prove it](#prove-it)

## Versions

| Feature | Minimum `@sentry/react` |
|---|---|
| Tracing, `reactRouterV7BrowserTracingIntegration` | ≥8.0.0 |
| `enableLongAnimationFrame` | ≥8.18.0 |
| `wrapCreateMemoryRouterV6` (other v6 factories) | ≥8.50.0 |
| `ignoreSpans` | ≥10.2.0 |
| `ignoreSpans` attribute matching | ≥10.6.0 |
| `propagateTraceparent` (W3C `traceparent`) | ≥10.10.0 |
| `enableAsyncRouteHandlers` + `lazyRouteManifest` | ≥10.39.0 |
| TanStack Router | `@tanstack/react-router` ≥1.64.0 |

## What is traced automatically

| What | Op | How |
|---|---|---|
| Initial page load | `pageload` | `window.performance` timing |
| Client navigations | `navigation` | History API |
| `fetch()` / XHR | `http.client` | Patched |
| Long tasks (>50 ms) | `ui.long-task` | `PerformanceLongTaskTiming` |
| Long animation frames (≥8.18.0) | `ui.long-animation-frame` | `PerformanceLongAnimationFrameTiming` |
| INP | `ui.interaction` | `PerformanceEventTiming`, emitted on page hide |

- **The pageload span carries Web Vitals** LCP, CLS, FCP and TTFB; navigation spans don't. HTTP spans record method, URL, status and response size, plus DNS, TLS, connection, TTFB and download with `enableHTTPTimings`. INP spans carry `component`, `element` and `interaction_type`.
- **To disable tracing, omit both `tracesSampleRate` and `tracesSampler`.** `tracesSampleRate: 0` is not the same: the integration still runs.

## browserTracingIntegration options

| Option | Default | Notes |
|---|---|---|
| `instrumentPageLoad` | `true` | |
| `instrumentNavigation` | `true` | |
| `idleTimeout` | `1000` ms | The root takes the last child's end time |
| `finalTimeout` | `30000` ms | Hard cap |
| `childSpanTimeout` | `15000` ms | |
| `markBackgroundSpan` | `true` | A backgrounded tab marks the span `cancelled` and closes it |
| `traceFetch` / `traceXHR` | `true` | |
| `enableHTTPTimings` | `true` | |
| `shouldCreateSpanForRequest` | none | `(url) => boolean` |
| `onRequestSpanStart` | none | `(span, requestInfo) => void` |
| `enableLongTask` | `true` | |
| `enableLongAnimationFrame` | `true` | Supersedes long tasks for most cases |
| `enableInp` | `true` | SDK 8.x+; 7.x defaulted to `false` |
| `interactionsSampleRate` | `1.0` | Applied on top of `tracesSampleRate` (0.5 × 0.1 = 5%) |
| `beforeStartSpan` | none | `(context) => StartSpanOptions`; mainly to parameterize URLs |
| `linkPreviousTrace` | `'in-memory'` | `'session-storage'` persists across hard reloads; `false` disables |
| `enableReportPageLoaded` | `false` | Enables `Sentry.reportPageLoaded()` |
| `ignoreResourceSpans` | `[]` | Op prefixes, e.g. `["resource.css", "resource.script", "resource.img"]` |
| `ignorePerformanceApiSpans` | `[]` | |

```typescript
browserTracingIntegration({
  beforeStartSpan: (context) => ({
    ...context,
    name: location.pathname
      .replace(/\/[a-f0-9]{8,}/g, "/<hash>")  // strip hashes/UUIDs
      .replace(/\/\d+/g, "/<id>"),              // strip numeric IDs
  }),
})
```

```typescript
      shouldCreateSpanForRequest: (url) =>
        !url.includes("/health") && !url.includes("/__webpack_hmr"),
      onRequestSpanStart: (span, { headers }) => {
        const rid = headers?.["x-request-id"];
        if (rid) span.setAttribute("request.id", rid);
      },
```

## Web Vitals

| Vital | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤2.5 s | ≤4 s | >4 s |
| INP (replaced FID in March 2024) | ≤200 ms | ≤500 ms | >500 ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 |
| FCP | ≤1 s | ≤3 s | >3 s |
| TTFB | ≤100 ms | ≤200 ms | >200 ms |
| FID (legacy) | ≤100 ms | ≤300 ms | >300 ms |

- **LCP and CLS final values** are captured on `visibilitychange` / page hide; INP is a standalone span on page hide and needs Chromium 96+.
- **The integrations list describes the vitals as "LCP, FID, CLS";** the tracing reference lists LCP, CLS, FCP, TTFB on pageload plus INP.

## Router integrations

- **Replace `browserTracingIntegration()` with the router's variant;** the two can't run together.

| Router | Integration | Notes |
|---|---|---|
| React Router v7 | `reactRouterV7BrowserTracingIntegration` | Hooks from `react-router` |
| React Router v6 | `reactRouterV6BrowserTracingIntegration` | Hooks from `react-router-dom` |
| React Router v5 | `reactRouterV5BrowserTracingIntegration` | `withSentryRouting(Route)` |
| React Router v4 | `reactRouterV4BrowserTracingIntegration` | API identical to v5 |
| TanStack Router | `tanstackRouterBrowserTracingIntegration(router)` | Pass the router instance; no hooks |
| No router or custom | `browserTracingIntegration()` | Names by URL path |

### React Router v7

```typescript
// src/instrument.ts
import React from "react";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/api\.myapp\.com/],
});
```

```typescript
// src/router.ts
import { createBrowserRouter } from "react-router";
import * as Sentry from "@sentry/react";
import { RootLayout, RootErrorBoundary } from "./layouts";
import { HomePage, UsersPage, UserDetailPage, DashboardPage } from "./pages";

// Wrap createBrowserRouter with Sentry instrumentation
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);

export const router = sentryCreateBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,  // see Error Boundary section below
    children: [
      { index: true,                      element: <HomePage /> },
      { path: "users",                    element: <UsersPage /> },
      { path: "users/:userId",            element: <UserDetailPage /> },
      { path: "dashboard",                element: <DashboardPage />,
        children: [
          { path: "analytics",            element: <AnalyticsPage /> },
        ],
      },
    ],
  },
]);
```

- **Factories:** `createBrowserRouter` uses `wrapCreateBrowserRouterV7`; `createMemoryRouter` uses `wrapCreateMemoryRouterV7`; `createHashRouter` uses `wrapCreateBrowserRouterV7` (it works for both).
- **Lazy routes (≥10.39.0):** add `enableAsyncRouteHandlers: true` and `lazyRouteManifest: ["/", "/users", "/users/:userId", ...]`, declaring every route path.
- **`<Routes>`:** `const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);`. Wrap `Routes` once at the top level, never nested `<Routes>`. Works with `MemoryRouter` and `HashRouter`.
- **`useRoutes`:** `const useSentryRoutes = Sentry.wrapUseRoutesV7(useRoutes);`, called outside any React component.
- **Errors:** `onError: Sentry.sentryOnError` on the route, or a capturing `errorElement` ([REACT.md](REACT.md#react-router-error-elements)).

### React Router v6, v5, v4

- **v6:** the same pattern with `reactRouterV6BrowserTracingIntegration`, `wrapCreateBrowserRouterV6` (recommended for v6.4+), `wrapCreateMemoryRouterV6` (≥8.50.0), `withSentryReactRouterV6Routing(Routes)` and `wrapUseRoutesV6(useRoutes)` (called outside components).
- **v4 and v5:** `Sentry.reactRouterV5BrowserTracingIntegration({ history })` with `createBrowserHistory()` from `history`, and `const SentryRoute = Sentry.withSentryRouting(Route);`. Order matters: most specific paths first. Or pass static config `{ history, routes, matchPath }`.

### TanStack Router

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";   // generated by TanStack Router

// 1. Create the router first
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// 2. Init Sentry, passing the router instance
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/api\.myapp\.com/],
});

// 3. Render
ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <RouterProvider router={router} />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
```

- **Create the router before `Sentry.init()`** and pass that instance; otherwise transactions are missing.

## Custom routing

For a router Sentry doesn't know, turn off automatic pageload and navigation spans and start them yourself:

```typescript
const client = Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.browserTracingIntegration({
      instrumentPageLoad: false,   // handled manually
      instrumentNavigation: false, // handled manually
    }),
  ],
  tracesSampleRate: 1.0,
})!;

let pageLoadSpan = Sentry.startBrowserTracingPageLoadSpan(client, {
  name: window.location.pathname,
  attributes: {
    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",  // start with "url" source
  },
});

myCustomRouter.on("routeResolved", (route) => {
  if (pageLoadSpan) {
    pageLoadSpan.updateName(route.pattern);          // e.g. "/users/:id"
    pageLoadSpan.setAttribute(
      SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route"      // upgrade to "route" source
    );
    pageLoadSpan = undefined;
  } else {
    Sentry.startBrowserTracingNavigationSpan(client, {
      op: "navigation",
      name: route.pattern,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
      },
    });
  }
});
```

- **Both functions create idle spans** that close after `idleTimeout`. `SEMANTIC_ATTRIBUTE_SENTRY_SOURCE` is `"sentry.source"` and `SEMANTIC_ATTRIBUTE_SENTRY_OP` is `"sentry.op"`.

## Custom spans

- **`Sentry.startSpan(options, cb)`:** active and ends by itself; the recommended one. A thrown error is captured and the span marked as an error.
- **`Sentry.startSpanManual(options, cb)`:** active; you must call `span.end()`.
- **`Sentry.startInactiveSpan(options)`:** not active, ended manually; for spans that cross event boundaries, with an explicit `parentSpan`.
- **Options:** `name` (required), `op`, `startTime` (Unix seconds, float), `attributes` (`string|number|boolean|string[]|number[]|boolean[]`), `parentSpan`, `onlyIfParent`, `forceTransaction`.
- **Common ops:** `http.client`, `db.query`, `ui.render`, `ui.load`, `ui.click`, `ui.flow`, `function`, `task`, `cache.get` / `cache.set`, `middleware`.
- **Span methods:** `Sentry.getActiveSpan()`, `span.setAttribute`, `setAttributes`, `setStatus({ code })` (0 unset, 1 ok, 2 error), `setHttpStatus(404)` (code 2, "Not Found"), `updateName`, `end(timestampSeconds)`.
- **`forceTransaction: true`** makes its own root transaction (background work, Web Workers, queue processors).
- **Browser spans are flat:** every child attaches to the root span. Opt into nesting with `parentSpanIsAlwaysRootSpan: false` (use with care). Spans missing after an async gap: use `startInactiveSpan` with an explicit `parentSpan`.

## Distributed tracing

- **Headers:** `sentry-trace` (`{traceId}-{spanId}-{sampled}`) and `baggage` (W3C Baggage with `sentry-*` entries), injected into fetch and XHR for URLs matching `tracePropagationTargets`.
- **Matching:** a string is a substring match against the full URL; a RegExp is tested against the full URL; `[]` disables the headers entirely.
- **The default is disputed:** the tracing reference says same-origin requests get headers automatically and cross-origin ones need explicit entries; the setup troubleshooting says the default is `localhost` and your DSN origin only.
- **CORS:** the backend must send `Access-Control-Allow-Headers: sentry-trace, baggage`, or the preflight fails and the browser drops the headers. An Express example allows `"Content-Type, Authorization, sentry-trace, baggage"`.
- **Continue a server-rendered trace:** the server calls `Sentry.getTraceData()` (from `@sentry/node`) and renders `<meta name="sentry-trace" content="...">` and `<meta name="baggage" content="...">`; the browser SDK reads them automatically. Server setup is in [../sentry/NODE.md](../sentry/NODE.md).
- **WebSockets and other channels:** send `Sentry.getTraceData()` values in the message as `_sentry: { trace, baggage }`; a Node receiver uses `propagation.extract(context.active(), {...})` from `@opentelemetry/api`, then `context.with(ctx, () => Sentry.startSpan(...))`.
- **OpenTelemetry-native backends:** `propagateTraceparent: true` (≥10.10.0) adds the W3C `traceparent` header.

## Sampling

| Daily transactions | `tracesSampleRate` |
|---|---|
| <10K (also dev, staging) | 1.0 |
| 10K to 100K | 0.2 |
| 100K to 1M | 0.05 to 0.1 |
| >1M | 0.01 to 0.02, with `tracesSampler` for priority routes |

- **`tracesSampler` wins** when both are set. It receives `{ name, attributes, parentSampled, parentSampleRate, inheritOrSampleWith }` and returns a rate or a boolean (`true` = 1.0, `false` = 0).

```typescript
Sentry.init({
  tracesSampler: ({ name, attributes, inheritOrSampleWith }) => {
    // Drop health checks and internal routes
    if (["/health", "/ping", "/readyz"].some(p => name.includes(p))) return 0;

    // Always capture critical flows
    if (name.startsWith("/checkout") || name.startsWith("/payment")) return 1.0;

    // Sample admin routes at 50%
    if (name.startsWith("/admin")) return 0.5;

    // High-volume search at 5%
    if (name.includes("/search")) return 0.05;

    // For everything else: honor parent's decision, fall back to 10%
    return inheritOrSampleWith(0.1);
  },
});
```

- **Use `inheritOrSampleWith(fallback)`, not a hand check of `parentSampled`:** it keeps sampling deterministic across the trace, metric extrapolation accurate and `sentry-sampled` correct in downstream baggage.

## Filtering spans

- **`beforeSendTransaction(event)`** modifies or drops whole transactions (return `null`).
- **`ignoreTransactions`:** e.g. `["/health", /^\/api\/internal/, "/__webpack_hmr", /\.(png|jpg|svg|ico|woff2)$/]`; strings are substring matches.
- **`beforeSendSpan(span)` cannot drop spans:** always return the span. Returning `null` breaks the SDK. Use `ignoreSpans`.
- **`ignoreSpans` (≥10.2.0):** strings, regexes, `{ op }`, `{ name, op }`, `{ name: /regex/ }`, and from ≥10.6.0 `{ attributes: { "url.path": "/health", "http.response.status_code": 200 } }` (string values match as substring or RegExp, others by strict equality). If the root span matches, the entire local trace is dropped.

## Debugging

| Symptom | Fix |
|---|---|
| No transactions in the Performance dashboard | Verify `tracesSampleRate` > 0; confirm `browserTracingIntegration()` (or the router variant) is in `integrations` |
| Transaction names show raw URLs (`/users/42`) instead of patterns | Add the router integration for your router version; it must replace, not supplement, `browserTracingIntegration()` |
| Transaction named `<unknown>` | Router integration missing or misconfigured; check that `useEffect`, `useLocation` and `useNavigationType` are all passed |
| Distributed trace not linking frontend to backend | Add the backend URL to `tracePropagationTargets`; verify `Access-Control-Allow-Headers` includes `sentry-trace, baggage` |
| SSR page load not linked to the server trace | Inject `<meta name="sentry-trace">` and `<meta name="baggage">` from `Sentry.getTraceData()` in the server-rendered HTML |
| API requests missing the `sentry-trace` header | Check the CORS preflight: the backend must allow the `sentry-trace` and `baggage` headers |
| INP spans not appearing | In SDK 7.x enable explicitly: `browserTracingIntegration({ enableInp: true })` |
| Web Vitals missing | Confirm `browserTracingIntegration()` is in the client init; check browser support (INP needs Chromium 96+) |
| Spans missing after an async gap | The browser uses a flat hierarchy; `startInactiveSpan` with an explicit `parentSpan` |
| High transaction volume or cost | `tracesSampler` returns `0` for health checks and asset routes; lower the default with `inheritOrSampleWith(0.05)` |
| `beforeSendSpan` returning `null` breaks the SDK | `beforeSendSpan` must always return the span; use `ignoreSpans` to drop spans |
| Lazy routes not tracked | SDK ≥10.39.0; add `enableAsyncRouteHandlers: true` and `lazyRouteManifest` with all route paths |
| TanStack Router transactions missing | Create the router before `Sentry.init()` and pass that instance to the integration |

## Prove it

After setup, Traces shows page load and navigation transactions, named by route pattern (`/users/:userId`) rather than raw URLs (`/users/42`) or `<unknown>`.
