# React Router and TanStack Start

Two full-stack React frameworks with their own Sentry SDKs, each initialized twice: once in the browser and once on the Node server. `@sentry/react-router` (React Router framework mode, currently beta) and `@sentry/tanstackstart-react` (TanStack Start, currently beta (the source called it alpha; https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/), documented against TanStack Start `1.0 RC`). The server half loads `instrument.server.mjs`, preferably with `--import` (a direct import can leave auto-instrumentation incomplete), and the framework's error hooks (`sentryOnError`, `createSentryHandleRequest` and `createSentryHandleError`, the TanStack global middlewares) must be wired. React Router in non-framework (data or declarative) mode, v5 to v7, uses `@sentry/react` instead: [REACT.md](REACT.md) and [REACT-TRACING.md](REACT-TRACING.md). Related files: [BROWSER-REPLAY-AND-PROFILING.md](BROWSER-REPLAY-AND-PROFILING.md), [REACT.md](REACT.md#user-feedback), and Node server behavior in [../sentry/NODE.md](NODE.md).

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Detect](#detect) · [What to set up](#what-to-set-up) · [React Router: wizard](#react-router-wizard) · [React Router: manual setup](#react-router-manual-setup) · [React Router: server startup](#react-router-server-startup) · [React Router: source maps](#react-router-source-maps) · [React Router: APIs](#react-router-apis) · [React Router: errors](#react-router-errors) · [React Router: tracing](#react-router-tracing) · [TanStack Start: setup](#tanstack-start-setup) · [TanStack Start: server startup](#tanstack-start-server-startup) · [TanStack Start: APIs](#tanstack-start-apis) · [TanStack Start: errors](#tanstack-start-errors) · [TanStack Start: tracing](#tanstack-start-tracing) · [Shared config notes](#shared-config-notes) · [Replay, logs, profiling, feedback](#replay-logs-profiling-feedback) · [Debugging](#debugging) · [Prove it](#prove-it)

## Detect

React Router:

```bash
cat package.json | grep -E '"react-router"|"@react-router/"|"react-router-dev"|"react-router-serve"'
cat package.json | grep -E '"@sentry/react-router"|"@sentry/react"|"@sentry/profiling-node"'
ls entry.client.tsx entry.server.tsx instrument.server.mjs react-router.config.ts vite.config.ts 2>/dev/null
cat package.json | grep -E '"reveal"|react-router'
cat package.json | grep -E '"dev"|"start"|NODE_OPTIONS|--import'
cat package.json | grep -E '"pino"|"winston"|"@sentry/profiling-node"'
```

- **`@sentry/react` already in use** likely means non-framework routing: use [REACT.md](REACT.md). Re-check this after setup too.
- **Entry files not exposed:** run `npx react-router reveal` first.

TanStack Start:

```bash
cat package.json | grep -E '"@tanstack/react-start"|"@tanstack/react-router"|"@sentry/tanstackstart-react"'
ls src/router.tsx src/start.ts src/server.ts instrument.server.mjs vite.config.ts vite.config.js 2>/dev/null
cat package.json | grep -E '"dev"|"build"|"start"|NODE_OPTIONS|--import'
cat package.json | grep -E '"pino"|"winston"|"loglevel"'
```

- **Check only whether SENTRY_AUTH_TOKEN is set.** The source detection command printed matching secret values; follow [SKILL.md](SKILL.md#the-rules) and never dump environment credentials. [getsentry/sentry-for-ai, sentry-tanstack-start-sdk; https://docs.sentry.io/platforms/javascript/sourcemaps/troubleshooting_js/]

- **Where things go:** `src/router.tsx` gets the client `Sentry.init`, `src/start.ts` the global middleware, `src/server.ts` is the server entry, `vite.config.ts` gets the `sentryTanstackStart` plugin.
- **Verify** TanStack details against https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/.

## What to set up

| | Core | Optional |
|---|---|---|
| React Router | Errors, Tracing, Replay | Profiling (server, `@sentry/profiling-node`, when server performance needs investigating and the Node runtime is verified compatible), Logs, User Feedback |
| TanStack Start | Errors, Tracing, Replay | Logs, User Feedback (profiling isn't listed) |

- **Lead with a proposal, not open questions:** React Router: "I recommend Error Monitoring + Tracing + Session Replay first. Want me to also enable Profiling, Logs, and User Feedback?" TanStack: "I recommend Error Monitoring + Tracing + Session Replay. Want me to also enable Logs and User Feedback?"
- **When:** Error Monitoring always (the baseline). Tracing usually yes (React Router: route and request timing; TanStack: route and fetch instrumentation). Replay for user-facing apps, hard UX debugging, login and checkout flows, hard-to-reproduce UX bugs. Logs when the team wants log search and trace correlation, or has an existing logging strategy or support workflow. User Feedback when product or support teams want direct in-app reports.

- **Companion backend:** check `../backend ../server ../api`; Node backend services use [../sentry/NODE.md](NODE.md).

## React Router: wizard

- **Recommended:** `npx @sentry/wizard@latest -i reactRouter`. It's interactive and may need a browser login, so the user runs it.
- **It** installs `@sentry/react-router`, exposes the entry files, creates `instrument.server.mjs` and the instrumentation files, updates root error handling, configures source map upload in the Vite / React Router config, and adds example verification files and routes. Afterwards open `/sentry-example-page` and trigger the test actions.

## React Router: manual setup

- **Install:** `npm install @sentry/react-router --save` (plus `npm install @sentry/profiling-node --save` for profiling), then `npx react-router reveal`.
- **`entry.client.tsx`:**

```tsx
import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: "___PUBLIC_DSN___",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  integrations: [
    Sentry.reactRouterTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({ colorScheme: "system" }),
  ],
  enableLogs: true,
  tracesSampleRate: 1.0,
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={Sentry.sentryOnError} />
    </StrictMode>,
  );
});
```

- **`instrument.server.mjs`:**

```javascript
import * as Sentry from "@sentry/react-router";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "___PUBLIC_DSN___",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  enableLogs: true,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
});
```

- **`entry.server.tsx`:**

```tsx
import * as Sentry from "@sentry/react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";

const handleRequest = Sentry.createSentryHandleRequest({
  ServerRouter,
  renderToPipeableStream,
  createReadableStreamFromReadable,
});

export default handleRequest;

export const handleError = Sentry.createSentryHandleError({
  logErrors: false,
});
```

- **Custom server logic:** use `wrapSentryHandleRequest`, `getMetaTagTransformer`, and a manual `Sentry.captureException` in your own `handleError`:

```tsx
export function handleError(error: unknown, args: unknown) {
  Sentry.captureException(error);
  console.error(error);
}
```

```tsx
import { wrapSentryHandleRequest } from "@sentry/react-router";
export default wrapSentryHandleRequest(customHandleRequest);
```

- **Checklist:** (1) `entry.client.tsx` with `Sentry.init` and `HydratedRouter onError={Sentry.sentryOnError}`; (2) `instrument.server.mjs`; (3) `entry.server.tsx` with `createSentryHandleRequest` and `createSentryHandleError`; (4) startup with `NODE_OPTIONS='--import ./instrument.server.mjs'`.

## React Router: server startup

- **Prefer `NODE_OPTIONS --import`:**

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--import ./instrument.server.mjs' react-router dev",
    "start": "NODE_OPTIONS='--import ./instrument.server.mjs' react-router-serve ./build/server/index.js"
  }
}
```

- **Fallback where runtime flags are restricted:** `import "./instrument.server.mjs";` at the top of `entry.server.tsx`. This can result in incomplete auto-instrumentation compared to `--import`.
- **Node version limits:** automatic server-side instrumentation has version limits for some Node versions (the current docs hold the ranges; no exact versions were given). Outside them, use the framework instrumentation APIs or the manual wrappers.

## React Router: source maps

```typescript
import { reactRouter } from "@react-router/dev/vite";
import {
  sentryReactRouter,
  type SentryReactRouterBuildOptions,
} from "@sentry/react-router";
import { defineConfig } from "vite";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "___ORG_SLUG___",
  project: "___PROJECT_SLUG___",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default defineConfig((config) => {
  return {
    plugins: [reactRouter(), sentryReactRouter(sentryConfig, config)],
  };
});
```

```typescript
import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  ssr: true,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest });
  },
} satisfies Config;
```

- **Both are needed:** the `sentryReactRouter` plugin in `vite.config.ts` and `sentryOnBuildEnd` in `react-router.config.ts`.
- **Token:** `SENTRY_AUTH_TOKEN` from the environment or `.env.sentry-build-plugin`. If it's undefined in the Vite config, load env vars in the config or use `.env.sentry-build-plugin`. More in [../sentry/RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## React Router: APIs

| API | Does |
|---|---|
| `reactRouterTracingIntegration()` | Client tracing for framework mode |
| `sentryOnError` | Hooks into `HydratedRouter` error reporting |
| `createSentryHandleRequest(...)` | Server request wrapper for the server entry |
| `createSentryHandleError(...)` | Server error handler wrapper |
| `wrapSentryHandleRequest(...)` | Wraps a custom `handleRequest` |
| `wrapServerLoader(...)` / `wrapServerAction(...)` | Manual wrapping of server loaders and actions |
| `sentryReactRouter(...)` | Vite plugin for source maps and build integration |
| `sentryOnBuildEnd(...)` | Build-end hook that processes source maps |

```ts
export const loader = Sentry.wrapServerLoader(
  { name: "Load Data", description: "Loads route data" },
  async () => {
    // loader logic
  },
);

export const action = Sentry.wrapServerAction(
  { name: "Submit Data", description: "Handles form submission" },
  async () => {
    // action logic
  },
);
```

## React Router: errors

| Error | Captured | How |
|---|---|---|
| Client framework errors | Automatically | `HydratedRouter onError={Sentry.sentryOnError}` |
| Unhandled client exceptions | Automatically | Global handlers |
| Server request and render errors | Automatically | `createSentryHandleRequest` + `createSentryHandleError` |
| Custom handled server errors | Not always | Call `captureException` yourself |
| Loader and action failures | Depends | `wrapServerLoader` / `wrapServerAction` or manual capture |

- **Without `sentryOnError`, framework-level client errors may be missed.**
- **Server errors need both** `createSentryHandleRequest` and `createSentryHandleError` exported.

## React Router: tracing

- **Client:** `integrations: [Sentry.reactRouterTracingIntegration()]` in `entry.client.tsx`.
- **`tracePropagationTargets`** defaults to the SDK defaults; examples: `["localhost", /^https:\/\/yourserver\.io\/api/]` or `[/^\//, /^https:\/\/api\.example\.com/]`. If client and server traces aren't connected, adjust it.
- **Sampling:** `1.0` in dev and testing, `0.1` to `0.3` to start in production, a lower fixed rate or `tracesSampler` for high throughput. If both `tracesSampleRate` and `tracesSampler` are set, `tracesSampler` takes precedence.

## TanStack Start: setup

- **Install:** `npm install @sentry/tanstackstart-react --save`.
- **Client init lives in the router factory, gated to the browser** (`src/router.tsx`):

```tsx
import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";

export const getRouter = () => {
  const router = createRouter();

  if (!router.isServer) {
    Sentry.init({
      dsn: "___PUBLIC_DSN___",
      dataCollection: {
        // userInfo: false,
        // httpBodies: [],
      },

      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration(),
        Sentry.feedbackIntegration({
          colorScheme: "system",
        }),
      ],

      enableLogs: true,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  return router;
};
```

- **`instrument.server.mjs` in the project root:**

```javascript
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "___PUBLIC_DSN___",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  enableLogs: true,
  tracesSampleRate: 1.0,
});
```

- **`vite.config.ts`: `sentryTanstackStart` should be the last plugin.** It manages source map upload and instruments middleware tracing when tracing is enabled.

```typescript
import { defineConfig } from "vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    sentryTanstackStart({
      org: "___ORG_SLUG___",
      project: "___PROJECT_SLUG___",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

- **Token:** set `SENTRY_AUTH_TOKEN=___ORG_AUTH_TOKEN___` in CI or the local environment; it must be available at build time. From `.env`, use `loadEnv`, or `.env.sentry-build-plugin`:

```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      sentryTanstackStart({
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
    ],
  };
});
```

- **`src/server.ts` wraps fetch:**

```typescript
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request) {
      return handler.fetch(request);
    },
  }),
);
```

- **`src/start.ts` sets the global middleware; Sentry's must be first in each array:**

```tsx
import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  };
});
```

- **Full server coverage:** (1) `instrument.server.mjs` with the server `Sentry.init`; (2) `src/server.ts` with `wrapFetchWithSentry`; (3) `src/start.ts` with both Sentry global middlewares first in their arrays.
- **Tunnel:** `tunnel: "/tunnel"`, plus a server endpoint that forwards tunnel traffic to Sentry ingest.

## TanStack Start: server startup

- **`--import` is preferred for production monitoring:** keep the file in the root, copy it into the output during the build, start with `--import`.

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --port 3000",
    "build": "vite build && cp instrument.server.mjs .output/server",
    "start": "node --import ./.output/server/instrument.server.mjs .output/server/index.mjs"
  }
}
```

- **Fallback for hosts that restrict startup flags** (for example serverless hosts): `import "../instrument.server.mjs";` at the top of `src/server.ts`. Only native Node.js APIs are then instrumented; third-party library instrumentation is limited.
- **Works in dev but not production:** `instrument.server.mjs` isn't copied into the final server output or isn't imported at runtime.

## TanStack Start: APIs

| API | Does |
|---|---|
| `tanstackRouterBrowserTracingIntegration(router)` | Browser navigation tracing |
| `wrapFetchWithSentry(...)` | Server request tracing and error capture on the fetch handler |
| `sentryGlobalRequestMiddleware` | Captures request-level server errors |
| `sentryGlobalFunctionMiddleware` | Captures server function errors |
| `sentryTanstackStart({...})` | Vite plugin for source maps and middleware instrumentation |

## TanStack Start: errors

- **Captured automatically:** unhandled client exceptions and promise rejections; server request exceptions (`sentryGlobalRequestMiddleware` + `wrapFetchWithSentry`); server function exceptions (`sentryGlobalFunctionMiddleware`).
- **Not captured:** errors swallowed by custom boundaries, and SSR render exceptions (capture these manually in error boundaries and fallback handlers).
- **The rule: if an error is caught and not re-thrown, capture it manually.** A route `errorComponent`:

```tsx
const route = createRoute({
  errorComponent: ({ error }) => {
    useEffect(() => {
      Sentry.captureException(error);
    }, [error]);

    return <div>Something went wrong.</div>;
  },
});
```

- **Class boundaries:** `Sentry.withErrorBoundary(MyErrorBoundary, { fallback: <p>Something went wrong.</p> })`.
- **Manual capture:** in a `catch`, `Sentry.captureException(error, { tags: { area: "checkout" }, extra: { retryCount: 1 } })`; `Sentry.captureMessage("Unexpected state encountered", "warning")`.
- **Enrichment** uses the standard calls: `setUser` (after auth state is known), `setTag("tenant", "acme")`, `setContext`, `addBreadcrumb`.
- **Server errors missing:** check both `wrapFetchWithSentry` and the global middleware are in place.
- **Duplicate errors in dev:** development tooling may rethrow; validate in a production build.

## TanStack Start: tracing

- **Browser route transitions:** `tanstackRouterBrowserTracingIntegration(router)` with the actual router instance (no browser transactions otherwise).
- **Server requests:** `wrapFetchWithSentry`. **Middleware and server functions:** the two global middlewares; missing middleware spans mean the Sentry plugin isn't enabled or tracing isn't configured. **Custom operations:** `Sentry.startSpan`, for key flows such as checkout, search and expensive data loads.
- **Sampling:** `1.0` in dev, `0.1` to `0.3` as a production starting point, a lower fixed rate or server-side dynamic sampling for high volume.
- **A disconnected trace:** check that both browser and server init are active in the same environment.

## Shared config notes

- **Privacy:** Use the [canonical JavaScript privacy schema and version distinction](JAVASCRIPT.md#datacollection). The old source applied omitted-object fallback semantics without the required SDK version boundary. [https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection]
- **`sendDefaultPii`** is deprecated: use `dataCollection` (removed in v11).
- **Profiling distinction:** `profileSessionSampleRate` samples continuous profiling once per SDK/service session; the old source called it a fraction of traced transactions. `profilesSampleRate` is the legacy transaction-based option. [https://docs.sentry.io/platforms/javascript/guides/node/profiling/]

## Replay, logs, profiling, feedback

- **Replay is client-only:** `replayIntegration({ maskAllText: true, blockAllMedia: true })` in the client init. React Router: validate with session `0.1` and error `1.0`; for cost lower the session rate and keep the error rate high; raise the session rate temporarily during incidents. TanStack: cost-sensitive production uses session `0.02` to `0.05` with the error rate kept high, and stricter masking for apps that handle sensitive user or payment data.
- **Logs:** use the [versioned JavaScript rule](SIGNALS-PRACTICE.md#logs), configuring client/server deliberately. Emit searchable fields as the logger's attributes argument and keep field vocabulary consistent. [getsentry/sentry-for-ai, React Router/TanStack logging; https://docs.sentry.io/platforms/javascript/logs/]
- **Profiling (React Router, server):** install `@sentry/profiling-node`; in `instrument.server.mjs` set `integrations: [nodeProfilingIntegration()]`, `tracesSampleRate: 1.0`, `profileSessionSampleRate: 1.0`. Start high in dev, lower for production. Traces but no profiles: raise `profileSessionSampleRate`. Runtime incompatibility symptoms: verify Node runtime support and fall back to tracing-only.
- **Feedback:** `Sentry.feedbackIntegration({ colorScheme: "system" })` in the client init. Both references' common options: `autoInject: true`, `colorScheme: "system"`, `showName: true`, `showEmail: true`, `triggerLabel: "Report a bug"`, `formTitle: "Report a bug"`, `submitButtonLabel: "Send report"`, `successMessageText: "Thanks for the report."` (TanStack adds `isNameRequired: false`, `isEmailRequired: false` and `tags`). The typed `triggerLabel` is canonical; the old browser example's `buttonLabel` conflicts with the SDK type. Manual opening follows [REACT.md](REACT.md#user-feedback). [https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/types/feedback/config.ts] Set the Sentry user before feedback is submitted.
- **Error-linked feedback:** `const eventId = Sentry.captureException(new Error("Checkout failed")); Sentry.showReportDialog({ eventId, title: "Something went wrong", subtitle: "Tell us what happened" });`. Feedback not linked to errors means `showReportDialog` lacks the real `eventId`.

## Debugging

| Symptom | Fix |
|---|---|
| React Router entry files missing | `npx react-router reveal` |
| React Router client errors missing | `onError={Sentry.sentryOnError}` on `HydratedRouter` |
| React Router server errors missing | Export both `createSentryHandleRequest` and `createSentryHandleError` |
| Custom handlers bypass Sentry | `wrapSentryHandleRequest` and manual capture |
| Error appears locally but not in Sentry | Check the DSN, network restrictions and `debug: true` output |
| React Router source maps missing | Both the `sentryReactRouter` plugin and `sentryOnBuildEnd` |
| `SENTRY_AUTH_TOKEN` undefined in Vite config | Load env vars in the config, or `.env.sentry-build-plugin`; TanStack: `loadEnv(mode, process.cwd(), "")` |
| Incomplete server auto-instrumentation | Prefer `NODE_OPTIONS='--import ./instrument.server.mjs'`, and check it is actually applied in the deployed runtime |
| Unsupported Node version for auto-instrumentation | Instrumentation API and manual wrappers |
| Tracing disappears in certain environments | Check runtime version constraints and the fallback instrumentation path |
| React Router: no trace data | `reactRouterTracingIntegration()` and `tracesSampleRate` configured |
| React Router profiling data missing | `@sentry/profiling-node` installed and `nodeProfilingIntegration` enabled |
| Non-framework app using `@sentry/react-router` | Switch to `@sentry/react` |
| Client and server traces not connected | Adjust `tracePropagationTargets`; both inits active in the same environment |
| Only error replays show | Raise `replaysSessionSampleRate` |
| Events not appearing (TanStack) | `debug: true`, verify the DSN, and check both client and server init files run |
| TanStack: no server traces | `wrapFetchWithSentry`, and `instrument.server.mjs` actually loads (`--import` or direct import) |
| TanStack: source maps not resolving | `SENTRY_AUTH_TOKEN`, `org` and `project` in the `sentryTanstackStart` config, token available at build time |
| TanStack: feedback widget not visible | `feedbackIntegration()` in the browser `integrations`; check CSS z-index conflicts |
| TanStack: route handler errors missing | The Sentry middlewares first in their arrays |
| TanStack: direct import misses library spans | Use `--import` |
| TanStack: SSR rendering exceptions | Capture manually in error boundaries and fallback handlers |
| TanStack: dev works, production doesn't | Copy `instrument.server.mjs` into the server output and import it at runtime |

## Prove it

- **React Router:** with wizard examples, open `/sentry-example-page` and trigger the test actions. Manually: open a route whose `loader` throws `new Error("My first Sentry error!")` and the event appears in Issues; a loader wrapping the throw in `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` shows transaction names, spans and linked errors in Traces. Logs show `Sentry.logger.info("User example action completed")`, `warn("Slow operation detected", { operation: "data_fetch", duration: 3500 })` and `error("Validation failed", { field: "email", reason: "Invalid email" })`. Check Issues, Traces, Profiles, Replays, Logs and User Feedback.
- **TanStack Start:** a button whose `onClick` throws `new Error("Sentry Test Error")` shows in Issues. A button running `Sentry.startSpan({ name: "Example Frontend Span", op: "test" }, async () => { const res = await fetch("/api/sentry-example"); if (!res.ok) throw new Error("Sentry Example Frontend Error"); })` produces one trace with the browser span, the server request span and any linked error. The same three logs appear. Check Issues, Traces, Replays, Logs and User Feedback; open the linked issue and verify the replay context is attached.
- **Production:** validate duplicate-error behavior in a production build (dev tooling may rethrow), and check that `--import` is actually applied in the deployed runtime and `instrument.server.mjs` is in the final server output.
