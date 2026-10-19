# React Tracing

Tracing in `@sentry/react` records a `pageload` span for the first load, a `navigation` span for each client route change and an `http.client` span for every fetch or XHR, then joins them to backend traces through headers. The router integration names transactions by route pattern (`/users/:userId`) instead of by URL; without it every user generates a unique transaction name and nothing can be aggregated. Setup and errors are in [REACT.md](REACT.md); React Router framework mode and TanStack Start in [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md). Vendor-neutral OpenTelemetry is the `observability` skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Versions](#versions) · [What is traced automatically](BROWSER-TRACING.md#automatic-spans) · [browserTracingIntegration options](BROWSER-TRACING.md#browsertracingintegration-options) · [Web Vitals](#web-vitals) · [Router integrations](#router-integrations) · [Custom routing](BROWSER-TRACING.md#custom-router-integration) · [Custom spans](BROWSER-TRACING.md#custom-spans) · [Distributed tracing](BROWSER-TRACING.md#distributed-tracing) · [Sampling](SAMPLING-AND-QUOTAS.md#react-source-rate-example) · [Filtering spans](BROWSER-TRACING.md#filtering-spans) · [Debugging](#debugging) · [Prove it](#prove-it)

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

Use the shared what is traced automatically guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#automatic-spans). [getsentry/sentry-for-ai, SDK references]

## browserTracingIntegration options

Use the shared browsertracingintegration options guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#browsertracingintegration-options). [getsentry/sentry-for-ai, SDK references]

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

Use the shared custom routing guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#custom-router-integration). [getsentry/sentry-for-ai, SDK references]

## Custom spans

Use the shared custom spans guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#custom-spans). [getsentry/sentry-for-ai, SDK references]

## Distributed tracing

Use the shared distributed tracing guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#distributed-tracing). [getsentry/sentry-for-ai, SDK references]

## Sampling

Use the shared sampling guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#sampling). [getsentry/sentry-for-ai, SDK references]

## Filtering spans

Use the shared filtering spans guidance in [BROWSER-TRACING.md](BROWSER-TRACING.md#filtering-spans). [getsentry/sentry-for-ai, SDK references]

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
