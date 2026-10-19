# React

`@sentry/react` instruments a React single-page app (React 16+, React Router v5 to v7 in non-framework mode, TanStack Router, Redux, Vite, webpack). `Sentry.init()` must run before any other code (its own `instrument.ts`, imported first), and the error path follows the React version (`reactErrorHandler()` on the root for React 19+, `<Sentry.ErrorBoundary>` for React below 19 and for scoped fallbacks). This file covers setup, errors, error boundaries, user feedback and the React-only features. Tracing and routers are in [REACT-TRACING.md](REACT-TRACING.md); Replay, logs and profiling in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md). React Router framework mode (`@sentry/react-router`) and TanStack Start are in [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md); Next.js is [../sentry/NEXTJS.md](NEXTJS.md); a page with no framework is [BROWSER.md](BROWSER.md).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Pick the SDK](#pick-the-sdk) · [Versions](#versions) · [Detect, then recommend](#detect-then-recommend) · [Setup](#setup) · [Init options](#init-options) · [dataCollection](JAVASCRIPT.md#datacollection) · [What is captured automatically](#what-is-captured-automatically) · [React 19: reactErrorHandler](#react-19-reacterrorhandler) · [Error boundaries](#error-boundaries) · [React Router error elements](#react-router-error-elements) · [Manual capture](JAVASCRIPT.md#capture-apis) · [Context, scopes and breadcrumbs](JAVASCRIPT.md#scopes-and-enrichment) · [Filtering and grouping](#filtering-and-grouping) · [User feedback](#user-feedback) · [Redux](#redux) · [Component names and withProfiler](#component-names-and-withprofiler) · [Integrations](#integrations) · [Source maps](#source-maps) · [Debugging](#debugging) · [Prove it](#prove-it)

## Pick the SDK

- **Next.js** (`next.config.*` or `"next"` in deps): use `@sentry/nextjs`, see [../sentry/NEXTJS.md](NEXTJS.md).
- **React Router framework mode** (`@sentry/react-router` or `@react-router/*` in deps): see [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md).
- **Everything else React:** `@sentry/react`, this file. The APIs here reflect `@sentry/react` ≥8.0.0; verify against https://docs.sentry.io/platforms/javascript/guides/react/ before implementing.

## Versions

| Feature | Minimum |
|---|---|
| Base setup, tracing, error monitoring | `@sentry/react` ≥8.0.0 |
| `reactErrorHandler()` | ≥8.6.0 per the error-monitoring reference; the React compatibility matrix below lists ≥8.0.0 for the React 19 approach |
| `captureReactException()` | ≥9.8.0 |
| `dataCollection` option | ≥10.57.0 |
| `attachReduxState` | 7.69.0 |
| React component annotation | 7.91.0 |
| `@sentry/vite-plugin` / `@sentry/webpack-plugin` 2.0.0 | with `@sentry/react` 7.47.0 |
| `feedbackIntegration()` / `feedbackModalIntegration()` | 7.85.0 |
| `feedbackScreenshotIntegration()`, feedback screenshots | 8.0.0 |
| Feedback `triggerAriaLabel` | 8.20.0 |
| Feedback screenshot annotation labels | 10.10.0 |
| `showReportDialog` `onClose` | 7.82.0 |
| `extraErrorDataIntegration()` | 5.16.0 |
| `contextLinesIntegration()` | 7.47.0 |
| `httpClientIntegration()` | 7.50.0 |
| `reportingObserverIntegration()` | 5.9.0 |
| `captureConsoleIntegration()` | 3.3.0 |
| `rewriteFramesIntegration()` | 5.7.0 |

| React version | Error handling | SDK minimum |
|---|---|---|
| React 19+ | `reactErrorHandler()` on `createRoot` | `@sentry/react` ≥8.0.0 |
| React 16 to 18 | `Sentry.ErrorBoundary` component | `@sentry/react` ≥7.0.0 |
| React 16 | `componentDidCatch` class boundaries | `@sentry/react` ≥6.0.0 |

## Detect, then recommend

```bash
# Detect React version
cat package.json | grep -E '"react"|"react-dom"'

# Check for existing Sentry
cat package.json | grep '"@sentry/'

# Detect router and framework mode hints
cat package.json | grep -E '"react-router-dom"|"react-router"|"@react-router/"|"@tanstack/react-router"|"@sentry/react-router"'

# Detect state management
cat package.json | grep -E '"redux"|"@reduxjs/toolkit"'

# Detect build tool
ls vite.config.ts vite.config.js webpack.config.js craco.config.js 2>/dev/null
cat package.json | grep -E '"vite"|"react-scripts"|"webpack"'

# Detect logging libraries
cat package.json | grep -E '"pino"|"winston"|"loglevel"'

# Check for companion backend in adjacent directories
ls ../backend ../server ../api 2>/dev/null
cat ../go.mod ../requirements.txt ../Gemfile ../pom.xml 2>/dev/null | head -3
```

| Finding | Do |
|---|---|
| React 19+ | `reactErrorHandler()` hook pattern; React below 19 uses `Sentry.ErrorBoundary` |
| `@sentry/react` already present | Skip install, go to feature config |
| `@sentry/react-router` or `@react-router/*` | Framework mode: [REACT-ROUTER-AND-TANSTACK.md](REACT-ROUTER-AND-TANSTACK.md) |
| `react-router-dom` v5/v6/v7 | Picks the router integration ([REACT-TRACING.md](REACT-TRACING.md)) |
| `@tanstack/react-router` | `tanstackRouterBrowserTracingIntegration()` |
| Redux | Recommend `createReduxEnhancer()` |
| `vite.config.*` / `"vite"` | Source maps through `sentryVitePlugin` |
| `"react-scripts"` (CRA), `craco.config.js` / `"@craco/craco"` | `@sentry/webpack-plugin` in CRACO |
| `webpack.config.*` / `"webpack"` | Custom webpack |
| Backend directory | After React, set up the backend: Node.js (Express, Fastify) uses `@sentry/node`, see [../sentry/NODE.md](NODE.md) |

- **Lead with a proposal, don't ask open-ended questions:** "I recommend setting up Error Monitoring + Tracing + Session Replay. Want me to also add Logging or Profiling?"
- **Always:** Error Monitoring (the non-negotiable baseline) and Tracing (page load and navigation spans are high-value in an SPA). **Session Replay** for user-facing apps, login flows and checkout pages. **Optional:** Logging (structured log search, log-to-trace correlation) and Profiling (performance-critical apps whose server can send `Document-Policy: js-profiling`).
- **Add features one at a time,** verifying each before the next.

## Setup

- **Install:** `npm install @sentry/react --save`.
- **Init before any other code runs:** put `Sentry.init()` in its own `src/instrument.ts` and import it as the very first import of the entry file (`src/main.tsx` for Vite, `src/index.tsx` for CRA or webpack).

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // Adjust per build tool (see table below)
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION, // inject at build time

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Tracing
  tracesSampleRate: 1.0, // lower to 0.1-0.2 in production
  tracePropagationTargets: ["localhost", /^https:\/\/yourapi\.io/],

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,
});
```

```tsx
// src/main.tsx (Vite) or src/index.tsx (CRA/webpack)
import "./instrument";              // ← MUST be first

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### The DSN per build tool

| Build tool | Variable | Access |
|---|---|---|
| Vite | `VITE_SENTRY_DSN` | `import.meta.env.VITE_SENTRY_DSN` |
| Create React App | `REACT_APP_SENTRY_DSN` | `process.env.REACT_APP_SENTRY_DSN` |
| Custom webpack | `SENTRY_DSN` | `process.env.SENTRY_DSN`, needs `DefinePlugin` |
| Any | `SENTRY_DSN` | Build-time injection; not available at runtime in the browser |

- **Vite `.env.production`:** `VITE_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<id>` and `VITE_SENTRY_ENVIRONMENT=production`, read as `environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "development"`.
- **CRA `.env.production` may be committed:** the DSN is public.
- **Custom webpack:**

```javascript
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      "process.env.SENTRY_DSN": JSON.stringify(process.env.SENTRY_DSN),
      "process.env.SENTRY_ENVIRONMENT": JSON.stringify(
        process.env.NODE_ENV ?? "development"
      ),
    }),
  ],
};
```

- **Keep dev noise out of the issue inbox:** branch on `IS_PRODUCTION = import.meta.env.PROD || process.env.NODE_ENV === "production"`. Production: `tracesSampleRate: 0.2`, `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`. Development: `debug: true`, `tracesSampleRate: 1.0`, no Replay (too noisy).

## Init options

Use [JAVASCRIPT.md](JAVASCRIPT.md#core-sdk-options) for shared option defaults, privacy and hooks; tracing, Replay and sampling keep their dedicated owners. The rows below retain browser-install-specific options from the SDK 10 source. [getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk]

## dataCollection

Use the versioned JavaScript privacy schema in [JAVASCRIPT.md](JAVASCRIPT.md#datacollection). [getsentry/sentry-for-ai, SDK references]

## What is captured automatically

| Layer | Mechanism | Integration |
|---|---|---|
| Uncaught JS exceptions | `window.onerror` | `GlobalHandlers` (default on) |
| Unhandled promise rejections | `window.onunhandledrejection` | `GlobalHandlers` (default on) |
| Errors in `setTimeout` / `setInterval` / `requestAnimationFrame` | Patched APIs | `BrowserApiErrors` (default on) |
| React render errors (below 19) | `componentDidCatch` via `<ErrorBoundary>` | `Sentry.ErrorBoundary` |
| React render errors (19+) | `createRoot` hooks | `Sentry.reactErrorHandler()` |
| Console errors (optional) | Patched `console.error` | `CaptureConsole` (opt-in) |

- **Capture these yourself:** errors caught by your own `try/catch`, errors swallowed by React Router's default error boundary, business-logic failures, `.then()` chains that end in `.catch()`, and user-visible conditions that aren't exceptions (`captureMessage`).
- **Event handlers aren't covered by error boundaries:** boundaries catch only render errors. Use `try/catch` plus `captureException` in handlers.
- **Customize the global handlers:** `Sentry.globalHandlersIntegration({ onerror: true, onunhandledrejection: false })`, then capture rejections yourself with `window.addEventListener("unhandledrejection", (event) => { Sentry.captureException(event.reason); })`.

## React 19: reactErrorHandler

- **Pass `Sentry.reactErrorHandler()` to all three root options** (`onUncaughtError`, `onCaughtError`, `onRecoverableError`) on both `createRoot` and `hydrateRoot`. A missing one is the usual reason React 19 errors aren't captured.

```jsx
createRoot(container, {
  // Fires for errors that bubble up WITHOUT any ErrorBoundary catching them.
  // These are fatal: the entire React tree unmounts.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    // Optional: runs AFTER Sentry has already captured the error
    console.warn("Uncaught React error:", error.message);
    console.warn("Component stack:", errorInfo.componentStack);
  }),

  // Fires for errors caught BY an ErrorBoundary (React 19 re-routes caught errors here).
  // The boundary still renders its fallback UI; this is just the reporting hook.
  onCaughtError: Sentry.reactErrorHandler(),

  // Fires when React recovers from an error automatically (e.g. hydration mismatch).
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(<App />);
```

```jsx
hydrateRoot(document.getElementById("app")!, <App />, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});
```

| Hook | Fires when | Tree after |
|---|---|---|
| `onUncaughtError` | Error escapes all boundaries | Unmounts (fatal) |
| `onCaughtError` | An ErrorBoundary catches | Boundary renders its fallback |
| `onRecoverableError` | React recovers by itself (e.g. hydration) | Continues |

- **Use both on React 19:** `reactErrorHandler()` is the global net; `<Sentry.ErrorBoundary>` is still required for scoped fallback UIs.

## Error boundaries

```typescript
interface ErrorBoundaryProps {
  fallback?: React.ReactNode | FallbackRender;
  // FallbackRender receives: { error: Error; componentStack: string; resetError: () => void }
  onError?: (error: Error, componentStack: string, eventId: string) => void;
  beforeCapture?: (scope: Scope, error: Error, componentStack: string) => void;
  onReset?: (error: Error | null, componentStack: string | null, eventId: string | null) => void;
  onMount?: () => void;
  onUnmount?: (error: Error | null) => void;
  showDialog?: boolean;
  dialogOptions?: ReportDialogOptions;
}
```

- **Basic use (React below 19, and any subtree that should fail on its own):** `<Sentry.ErrorBoundary fallback={<p>Something went wrong</p>} showDialog><App /></Sentry.ErrorBoundary>`.
- **`resetError()`** resets the boundary and re-renders its children (retry buttons). **`onReset`** clears stale state in stores or caches (e.g. `queryClient.clear()`). **`beforeCapture`** enriches the scope (`setTag`, `setExtra`, `setLevel`, `setContext`) for that boundary's location. **`onError`** receives the `eventId`, which links user feedback (`Sentry.showReportDialog({ eventId })`).
- **`showDialog` with `dialogOptions`:** `title`, `subtitle`, `subtitle2`, `labelName`, `labelEmail`, `labelComments`, `labelSubmit`, `successMessage`, `user: { email, name }`.
- **HOC:** `Sentry.withErrorBoundary(Component, options)` equals wrapping in `<Sentry.ErrorBoundary>`, with the same options as the props.
- **Nest by blast radius:** each boundary catches only its own subtree. Outermost around `<App>` (last resort, prevents a blank page), then route level, widget or panel level, and data-fetching components.
- **Custom class boundaries use `captureReactException` (≥9.8.0):**

```jsx
componentDidCatch(error, errorInfo) {
  // errorInfo = { componentStack: "\n  at Dashboard\n  at App..." }
  // captureReactException wires up the componentStack correctly
  Sentry.captureReactException(error, errorInfo);
}
```

- **Never call plain `captureException` in `componentDidCatch`:** it loses the component stack. `captureReactException` sets `error.cause` so the tree shows as a linked error ("Caused by: React component stack:"). Needs React 17+ and the default `LinkedErrors` integration.

## React Router error elements

- **React Router's default error boundary silently discards errors in production.** Always give routes a custom `errorElement` that captures to Sentry:

```jsx
import { useRouteError } from "react-router-dom";
import * as Sentry from "@sentry/react";

function RootErrorBoundary() {
  const error = useRouteError();

  React.useEffect(() => {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: { source: "react-router-error-element" },
      });
    }
  }, [error]);

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : "An unexpected error occurred."}</p>
      <button onClick={() => window.location.reload()}>Reload page</button>
    </div>
  );
}

const router = Sentry.wrapCreateBrowserRouterV6(createBrowserRouter)([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RootErrorBoundary />,  // ← required
    children: [ /* your routes */ ],
  },
]);
```

- **Simpler on v7:** `onError: Sentry.sentryOnError` on the route captures loader, action and component errors without a component.

## Manual capture

Keep capture out of React render: the source reports hook/query failures in useEffect, for example `useEffect(() => { if (error) Sentry.captureException(error, {...}) }, [error, userId])`. Use the [shared JavaScript capture, scope and breadcrumb contract](JAVASCRIPT.md#capture-apis). [getsentry/sentry-for-ai, sentry-react-sdk]

## Context, scopes and breadcrumbs

React context reserves the type key; context and extras are not indexed, while tags are indexed. The source says global/isolation scopes store enrichment and do not capture, and top-level setters write to isolation. Use the [shared JavaScript capture, scope and breadcrumb contract](JAVASCRIPT.md#scopes-and-enrichment). [getsentry/sentry-for-ai, sentry-react-sdk]

## Filtering and grouping

- **`beforeSend(event, hint)`:** return `null` to drop; `hint.originalException`, `hint.syntheticException`. Uses: drop non-Error rejections, drop events with `extension://` frames, scrub `event.user.email`, set `event.fingerprint = ["chunk-load-error"]`.
- **`ignoreErrors`:** strings (substring match) or RegExps, applied before `beforeSend`. Typical list: `"ResizeObserver loop limit exceeded"`, `"Non-Error exception captured"`, `"Object Not Found Matching Id"`, `/^Network Error$/`, `/ChunkLoadError/`, `/Loading chunk \d+ failed/`, `/^Script error\.?$/`, `"from accessing a cross-origin frame"`, `/webkit-masked-url/`.
- **`allowUrls` / `denyUrls`:** e.g. `denyUrls: [/extensions\//i, /^chrome:\/\//i, /^safari-extension:\/\//i, /gtm\.js/, /analytics\.js/]`.
- **`sampleRate: 0.25`** keeps 25% of errors. Use `beforeSend` for conditional filtering and `sampleRate` for volume.
- **`beforeSend` returns null but events still arrive:** performance events go through `beforeSendTransaction` instead; also check for a second SDK instance.
- **Fingerprints:** default grouping uses exception type, message and stack trace. `fingerprint: ["stripe-card-error"]` replaces it; `["{{ default }}", "payment-module"]` extends it. Can be set in `beforeSend`.

## User feedback

| | `feedbackIntegration()` | `Sentry.showReportDialog()` |
|---|---|---|
| Trigger | Any time, user-initiated | On error |
| UI | Floating button (bottom-right) | Modal |
| Needs an error | No | Yes (`eventId` required) |
| Screenshots | Yes (SDK ≥8.0.0) | No |

- **`feedbackIntegration` options and defaults:** `autoInject: true`, `colorScheme: "system"` (`"system"|"light"|"dark"`), `showBranding: true`, `id: "sentry-feedback"`, `tags`, `showName: true`, `showEmail: true`, `isNameRequired: false`, `isEmailRequired: false`, `enableScreenshot: true` (hidden on mobile), `useSentryUser: { email: "email", name: "username" }`.
- **Labels:** `triggerLabel`, `triggerAriaLabel`, `formTitle`, `submitButtonLabel`, `cancelButtonLabel`, `confirmButtonLabel`, `addScreenshotButtonLabel`, `removeScreenshotButtonLabel`, `nameLabel`, `namePlaceholder`, `emailLabel`, `emailPlaceholder`, `isRequiredLabel`, `messageLabel`, `messagePlaceholder`, `successMessageText`, `highlightToolText`, `hideToolText`, `removeHighlightText`.
- **Themes:** `themeLight` / `themeDark` with `foreground`, `background`, `accentForeground`, `accentBackground`, `successColor`, `errorColor`.
- **Callbacks:** `onFormOpen`, `onFormClose`, `onSubmitSuccess(data, eventId)`, `onSubmitError(error)`.
- **Manual feedback:** initialize with `autoInject: false`, obtain `Sentry.getFeedback()`, and use `attachTo(element)` or await `createForm()`, then `appendToDom()` and `open()`. The old source used `openDialog()`. `triggerLabel` remains valid in the SDK type despite a docs example using `buttonLabel`. [https://docs.sentry.io/platforms/javascript/user-feedback/configuration/; https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/types/feedback/config.ts]
- **No UI:** `Sentry.captureFeedback({ name, email, message }, { captureContext, attachments: [{ filename, data: Uint8Array, contentType }] })`.
- **`showReportDialog` options:** `eventId` (required), `dsn`, `user.name`, `user.email`, `lang`, `title`, `subtitle`, `subtitle2`, `labelName`, `labelEmail`, `labelComments`, `labelSubmit`, `labelClose`, `successMessage`, `onLoad`, `onClose`. Pass the `eventId` from `captureException` or the boundary's `onError`, or the dialog has no event.

## Redux

- **`Sentry.createReduxEnhancer()`** records actions as breadcrumbs, attaches state as `redux_state.json` and keeps scope tags in sync. It is a store enhancer, not middleware: never pass it inside `applyMiddleware()`.

```typescript
const store = configureStore({
  reducer: rootReducer,
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(Sentry.createReduxEnhancer()),
});
```

- **Legacy store:** `createStore(rootReducer, compose(applyMiddleware(thunk), sentryReduxEnhancer))`.

| Option | Type | Default | Where |
|---|---|---|---|
| `actionTransformer` | `(action) => Action \| null` | none | Enhancer (`null` drops the action) |
| `stateTransformer` | `(state) => State \| null` | none | Enhancer |
| `configureScopeWithState` | `(scope, state) => void` | none | Enhancer; runs on every dispatch, keep it fast |
| `attachReduxState` | boolean | `true` | Enhancer (7.69.0) |
| `normalizeDepth` | number | `3` | `Sentry.init()` |

- **Return a filtered copy from `stateTransformer`,** not `null` (null leaves events without Redux state). `normalizeDepth: 10` is usually enough; avoid `Infinity`.

## Component names and withProfiler

- **Component annotation (build time)** replaces selectors like `button.en302zp1...` with `CheckoutButton` in breadcrumbs, Replay and spans by injecting `data-sentry-component` and `data-sentry-source-file`. Needs SDK 7.91.0+; only `.jsx` / `.tsx` files are annotated (not `.js` / `.ts`); Vite, webpack and Rollup are supported, esbuild is not.
- **Vite:** `sentryVitePlugin({ ..., reactComponentAnnotation: { enabled: true, ignoredComponents: ["AnimationWrapper", "LayoutFragment"] } })`. List components in `ignoredComponents` when they cause "Passing unknown props on Fragment" errors.
- **Babel:** `npm install @sentry/babel-plugin-component-annotate --save-dev`, then `plugins: ["@sentry/babel-plugin-component-annotate"]`.
- **`Sentry.withProfiler()`** wraps a component with the React Profiler API and records mount time, update time and re-render count. Options: `name` (required for anonymous and arrow components), `includeRender: true`, `includeUpdates: true`. Needs `browserTracingIntegration`. Use it on route-level components, expensive renders and frequent re-renders, the 5 to 10 most performance-critical components; not on every component, leaf components, or components that render hundreds of times per second.

## Integrations

- **Defaults:** `breadcrumbsIntegration`, `browserApiErrorsIntegration` (wraps `setTimeout`, `setInterval`, `requestAnimationFrame`, `addEventListener`, `removeEventListener`), `browserSessionIntegration` (Release Health), `dedupeIntegration`, `functionToStringIntegration`, `globalHandlersIntegration`, `httpContextIntegration`, `inboundFiltersIntegration`, `linkedErrorsIntegration`.
- **Reconfigure** by passing one explicitly, e.g. `Sentry.breadcrumbsIntegration({ console: false, dom: true, fetch: true, history: true, xhr: true })`. **Remove** with the function form `integrations: (integrations) => integrations.filter((i) => i.name !== "Dedupe")`; names include `"Dedupe"`, `"Breadcrumbs"`, `"GlobalHandlers"`, `"LinkedErrors"`, `"HttpContext"`, `"InboundFilters"`. `defaultIntegrations: false` disables all.
- **Optional:** `httpClientIntegration({ failedRequestStatusCodes: [[400, 499], [500, 599]], failedRequestTargets: [...] })` reports 4xx/5xx responses as errors (opt-in because it may capture PII); `extraErrorDataIntegration()`; `contextLinesIntegration()` (needs source maps); `reportingObserverIntegration()`; `captureConsoleIntegration()` (console to Sentry issues, legacy); `rewriteFramesIntegration()`; `feedbackModalIntegration()`; `feedbackScreenshotIntegration()`.
- **Add after init** (e.g. after consent): `Sentry.addIntegration(Sentry.replayIntegration({...}))`. Lazy loading is in [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md).

## Source maps

Release naming, CI order and the general upload story are in [../sentry/RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md). The React-specific parts:

- **Wizard (the user runs it; it needs an interactive browser login):** `npx @sentry/wizard@latest -i sourcemaps`. It detects Vite, webpack or CRA, installs the plugin, writes `SENTRY_AUTH_TOKEN` to `.env.sentry-build-plugin` and sets `sourcemap: "hidden"` with `filesToDeleteAfterUpload`.
- **Debug IDs:** the plugin injects a Debug ID into each `.js` and `.js.map` and uploads the maps; more reliable than release-based matching.
- **Vite:** `npm install @sentry/vite-plugin --save-dev`. `build: { sourcemap: "hidden" }` strips `//# sourceMappingURL=`. `sentryVitePlugin` must come after all other plugins (especially `@vitejs/plugin-react`).

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: { sourcemap: "hidden" },
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

  Add `reactComponentAnnotation` and `sourcemaps.filesToDeleteAfterUpload: ["./**/*.map", ".*/**/public/**/*.map", "./dist/**/client/**/*.map"]` as needed.
- **webpack:** `npm install @sentry/webpack-plugin --save-dev`, `devtool: "hidden-source-map"`, `sentryWebpackPlugin({ org, project, authToken, sourcemaps: { filesToDeleteAfterUpload: [...] } })`.
- **CRA:** use CRACO (`npm install @craco/craco @sentry/webpack-plugin --save-dev`, scripts `craco start` / `craco build`). Ejecting is irreversible; prefer CRACO.
- **Manual:** `npm install @sentry/cli --save-dev`, then `npx sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT --auth-token $SENTRY_AUTH_TOKEN ./build`; `.sentryclirc` holds `[defaults] org / project / url = https://sentry.io/`. The GitHub Actions-specific wiring is skipped; keep the standalone upload command and the [platform-neutral release pipeline](RELEASES-AND-SOURCEMAPS.md#creating-releases-in-ci). [user standing rules; getsentry/sentry-for-ai, sentry-react-sdk]
- **Token:** `.env.sentry-build-plugin` is loaded automatically by the Vite and webpack plugins; add it to `.gitignore`. Permissions: Project Read & Write, Release Admin. Never commit `SENTRY_AUTH_TOKEN`.
- **Protect the maps with all three together:** hidden maps, delete after upload, and a server that returns 403 for `.js.map`.
- **When maps don't apply:** upload before deploying (same CI step); remove webpack `noSources: true`; the plugin only uploads in production builds (`NODE_ENV=production`), so run `npm run build` and check `SENTRY_AUTH_TOKEN`.

## Debugging

| Symptom | Fix |
|---|---|
| Events don't appear | `debug: true`, check the DSN and the browser console |
| `instrument.ts` not running first | Make it the first import, before React and app imports |
| React below 19 errors not captured | `<Sentry.ErrorBoundary>` must wrap the tree |
| React 19 errors not captured | `reactErrorHandler()` on all three `createRoot` options |
| Errors twice in development | Expected: Strict Mode re-throws caught errors to the global handler. Validate in production builds |
| Missing component stack | React 17+ and `LinkedErrors` enabled |
| `CaptureConsole` duplicates | React logs caught errors through `console.error`; remove `CaptureConsole` or exclude `console.error` |
| `showReportDialog` has no event | Pass the `eventId` from `captureException` or `onError` |
| Feedback button missing | Confirm it's in `integrations`; check z-index conflicts |
| Browser extension errors | Add `/extensions\//i`, `/^chrome:\/\//i` to `denyUrls` |
| Ad blockers drop events | `tunnel: "/sentry-tunnel"` plus a server-side relay endpoint |
| Redux actions not in breadcrumbs | Add `Sentry.createReduxEnhancer()` to the store enhancers |
| Component names missing | The files are `.js` / `.ts`, not `.jsx` / `.tsx` |
| Source maps not working | Build in production mode (`npm run build`); verify `SENTRY_AUTH_TOKEN` is set |
| Minified stack traces | Source maps not uploading: check the plugin config and auth token |

Shared habits (sampling budgets, PII, alert noise) are in [../sentry/PRACTICES.md](PRACTICES.md).

## Prove it

Trigger test events to confirm Sentry is receiving data:

```tsx
// Add a temporary test button anywhere in your app
import * as Sentry from "@sentry/react";

function SentryTest() {
  return (
    <>
      <button onClick={() => { throw new Error("Sentry React test error"); }}>
        Test Error
      </button>
      <button onClick={() => Sentry.captureMessage("Sentry test message", "info")}>
        Test Message
      </button>
    </>
  );
}
```

Check the Sentry dashboard: **Issues** has the error within seconds; **Traces** shows page load and navigation transactions; **Replays** has a session recording after page interaction; **Logs** has structured entries if logging is enabled. If nothing appears, set `debug: true` in `Sentry.init()` and check the browser console.
