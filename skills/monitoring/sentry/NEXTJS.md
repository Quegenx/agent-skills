# Next.js

`@sentry/nextjs` instruments a Next.js 13+ app (App Router and Pages Router) across three runtimes: the browser, the Node.js server and the Edge. Each runtime has its own init file and its own configuration, so most outcomes come down to whether all three files exist, whether `instrumentation.ts` loads the right one for `NEXT_RUNTIME`, and whether an error reaches Sentry at all: Next.js error boundaries and swallowed `try/catch` blocks stop errors before the SDK sees them. This file covers setup and error monitoring; tracing, Session Replay, logs, metrics, profiling, crons and AI monitoring are in [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md). Releases and source map upload in depth are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md); sampling, PII and noise practices that apply to every platform are in [PRACTICES.md](PRACTICES.md). Vendor-neutral OpenTelemetry is the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Versions](#versions) · [Detect the project](#detect-the-project) · [Pick the features](#pick-the-features) · [Setup with the wizard](#setup-with-the-wizard) · [Setup by hand](#setup-by-hand) · [The three runtimes](#the-three-runtimes) · [next.config and withSentryConfig](#nextconfig-and-withsentryconfig) · [Init options and environment variables](#init-options-and-environment-variables) · [What is captured automatically](#what-is-captured-automatically) · [Capture APIs](#capture-apis) · [Error boundaries](#error-boundaries) · [Server-side capture](#server-side-capture) · [Scopes and enrichment](#scopes-and-enrichment) · [Breadcrumbs](#breadcrumbs) · [Filtering, fingerprints and event processors](#filtering-fingerprints-and-event-processors) · [Companion backend](#companion-backend) · [Debugging](#debugging) · [Source conflicts](#source-conflicts) · [Prove it](#prove-it)

## Versions

- **The APIs here reflect `@sentry/nextjs` 8.28.0 and later.** Verify against https://docs.sentry.io/platforms/javascript/guides/nextjs/ before implementing.
- **Error monitoring minimum:** `@sentry/nextjs` 8.0.0. `withServerActionInstrumentation` exists since 8.0.0. `onRequestError` needs 8.28.0 (see [Source conflicts](#source-conflicts) for the Next.js version).
- **Next.js 13+ is required; 15+ is needed for Turbopack support.** The Next.js docs page says Next.js 14+ and Node.js 20.19.0+ (see [Source conflicts](#source-conflicts)).

## Detect the project

Run these before proposing anything:

```bash
# Detect Next.js version and existing Sentry
cat package.json | grep -E '"next"|"@sentry/'

# Detect router type (App Router vs Pages Router)
ls src/app app src/pages pages 2>/dev/null

# Check for existing Sentry config files
ls instrumentation.ts instrumentation-client.ts sentry.server.config.ts sentry.edge.config.ts 2>/dev/null
ls src/instrumentation.ts src/instrumentation-client.ts 2>/dev/null

# Check next.config
ls next.config.ts next.config.js next.config.mjs 2>/dev/null

# Check for existing error boundaries
find . -name "global-error.tsx" -o -name "_error.tsx" 2>/dev/null | grep -v node_modules

# Check build tool
cat package.json | grep -E '"turbopack"|"webpack"'

# Check for logging libraries
cat package.json | grep -E '"pino"|"winston"|"bunyan"'

# Check for companion backend
ls ../backend ../server ../api 2>/dev/null
cat ../go.mod ../requirements.txt ../Gemfile 2>/dev/null | head -3
```

| Finding | What it decides |
|---|---|
| Next.js version | 13+ required; 15+ for Turbopack |
| App Router or Pages Router | `global-error.tsx` or `_error.tsx` |
| `@sentry/nextjs` already installed | Skip install, go to feature config |
| Existing `instrumentation.ts` | Merge Sentry into it, don't replace it |
| Turbopack in use | `webpack.treeshake` options in `withSentryConfig` are webpack only |
| `pino`, `winston` or another logger | Recommend the Sentry Logs integration |
| A backend directory | Set up the backend too (see [Companion backend](#companion-backend)) |

## Pick the features

- **Lead with a proposal, not an open question:** "I recommend setting up Error Monitoring + Tracing + Session Replay. Want me to also add Logging or Profiling?"
- **Core:** Error Monitoring always (the non-negotiable baseline). Tracing always for Next.js (server route tracing plus client navigation). Session Replay for user-facing apps, login flows and checkout pages.
- **Optional:** Logging (`Sentry.logger.*`; when `pino` or `winston` is present, or log search and log-to-trace correlation are needed). Profiling (performance-critical apps; requires the `Document-Policy: js-profiling` header). AI Monitoring (OpenAI, Vercel AI SDK or Anthropic calls found). Crons (Vercel Cron jobs, scheduled API routes, `node-cron`). Metrics (custom counters, gauges and histograms via `Sentry.metrics.*`).

## Setup with the wizard

- **Recommended: `npx @sentry/wizard@latest -i nextjs`.** The user must run it themselves: it opens a browser for login and needs interactive input an agent can't give.
- **It handles** login, org and project selection, SDK install, the config files (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`), wrapping `next.config.ts`, source map upload, and adds a `/sentry-example-page`. After it finishes, go straight to [Prove it](#prove-it).
- **It writes `.env.sentry-build-plugin`** (auto-gitignored) for the auth token; in CI set `SENTRY_AUTH_TOKEN`.
- **Its sample rates:** `tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1`, replay `0.1` / `1.0`. Monitor your usage stats and adjust `tracesSampleRate` based on your traffic volume.

## Setup by hand

### Install

```bash
npm install @sentry/nextjs --save
```

### `instrumentation-client.ts` (browser)

- **Older docs used `sentry.client.config.ts`; the current pattern is `instrumentation-client.ts`.** Next.js loads it into the client bundle directly.

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "___PUBLIC_DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration(),
    // Optional: user feedback widget
    // Sentry.feedbackIntegration({ colorScheme: "system" }),
  ],
});

// Hook into App Router navigation transitions (App Router only)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

### `sentry.server.config.ts` (Node.js)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "___DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack frames
  includeLocalVariables: true,

  enableLogs: true,
});
```

### `sentry.edge.config.ts` (Edge)

- **The Edge runtime has limited Node.js API access;** some Node.js-specific integrations are not available there.

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "___DSN___",

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,
});
```

### `instrumentation.ts` (server registration hook)

- **instrumentation became stable in Next.js 15.0.0.** Next.js 14.0.4 added Turbopack support; it did not stabilize the hook. Check the installed older version's experimental option rather than treating 14.0.4 as the stability boundary, as the source did. [https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#version-history]
- **If the file already exists, merge these lines into it.**

```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Automatically captures all unhandled server-side request errors
// Requires @sentry/nextjs >= 8.28.0
export const onRequestError = Sentry.captureRequestError;
```

- **`onRequestError` captures errors from Server Components, middleware and proxies.**

## The three runtimes

| File | Runtime | Loaded by | Captures |
|---|---|---|---|
| `instrumentation-client.ts` | Browser | Next.js, directly | Client-side errors, unhandled rejections |
| `sentry.server.config.ts` | Node.js | `instrumentation.ts` when `NEXT_RUNTIME === "nodejs"` | API routes, Server Components, Server Actions |
| `sentry.edge.config.ts` | Edge | `instrumentation.ts` when `NEXT_RUNTIME === "edge"` | Middleware, edge routes |

- **All three use the same DSN but are configured independently.** A setting (tracing, `enableLogs`) applies only to the runtimes whose file sets it.

## next.config and withSentryConfig

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // your existing Next.js config
};

export default withSentryConfig(nextConfig, {
  org: "___ORG_SLUG___",
  project: "___PROJECT_SLUG___",

  // Source map upload auth token (see Source Maps section below)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack trace resolution
  widenClientFileUpload: true,

  // Create a proxy API route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI output
  silent: !process.env.CI,
});
```

| Option | Type | Purpose |
|---|---|---|
| `org` | string | Org slug |
| `project` | string | Project slug |
| `authToken` | string | Source map upload token (`SENTRY_AUTH_TOKEN`) |
| `widenClientFileUpload` | boolean | Upload more client files for better stack traces |
| `tunnelRoute` | string | API route that proxies events past ad-blockers, e.g. `"/monitoring"` |
| `silent` | boolean | `!process.env.CI` recommended |
| `webpack.treeshake.*` | object | Webpack only, not Turbopack (see [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md#bundle-size-control-and-csp)) |
| `automaticVercelMonitors` | boolean | Vercel Cron monitors, Pages Router only (see [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md#crons)) |

- **Exclude the tunnel route from middleware.** Next.js 16+ uses `proxy.ts`, earlier versions `middleware.ts`; the pattern is the same.

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Exclude monitoring route, Next.js internals, and static files
    "/((?!monitoring|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- **Source maps upload automatically on every production `next build`** once `withSentryConfig` has `authToken` (from the CI environment or a gitignored `.env.sentry-build-plugin`). `SENTRY_AUTH_TOKEN` is a build-time secret, distinct from the DSN. Token creation, CI setup and troubleshooting are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## Init options and environment variables

| `Sentry.init()` option | Type | Default | Notes |
|---|---|---|---|
| `dsn` | string | none | Required. `NEXT_PUBLIC_SENTRY_DSN` on the client, `SENTRY_DSN` on server and edge |
| `tracesSampleRate` | number | none | 0 to 1; 1.0 in dev, 0.1 in production recommended |
| `replaysSessionSampleRate` | number | `0.1` (see [conflicts](#source-conflicts)) | Fraction of all sessions recorded |
| `replaysOnErrorSampleRate` | number | `1.0` (see [conflicts](#source-conflicts)) | Fraction of error sessions recorded |
| `dataCollection` | object | Version-specific, see below | Categories `userInfo`, `cookies`, `httpHeaders`, `httpBodies`, `urlQueryParams`, `genAI` |
| `includeLocalVariables` | boolean | `false` | Server only |
| `enableLogs` | boolean | [Versioned Logs rule](SIGNALS-PRACTICE.md#logs) | Sentry Logs |
| `environment` | string | auto | |
| `release` | string | auto | Commit SHA or version tag |
| `debug` | boolean | `false` | Logs SDK activity to the console |

- **Privacy:** Use the [canonical JavaScript privacy schema and version distinction](JAVASCRIPT.md#datacollection). The old source applied omitted-object fallback semantics without the required SDK version boundary. [https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection]

| Variable | Runtime | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Client | DSN for browser init (public) |
| `SENTRY_DSN` | Server, Edge | DSN for server and edge init |
| `SENTRY_AUTH_TOKEN` | Build | Source map upload token (secret) |
| `SENTRY_ORG` | Build | Alternative to `org` |
| `SENTRY_PROJECT` | Build | Alternative to `project` |
| `SENTRY_RELEASE` | Server | Release string (auto-detected from git) |
| `NEXT_RUNTIME` | Server, Edge | `"nodejs"` or `"edge"`, set by Next.js |

## What is captured automatically

**If you catch an error and don't re-throw it, Sentry never sees it.**

| Error type | Captured? | Mechanism |
|---|---|---|
| Unhandled client JS exceptions | Yes | `window.onerror` (GlobalHandlers) |
| Unhandled promise rejections (client) | Yes | `window.onunhandledrejection` |
| Server Component render errors (Next.js 15+) | Yes | `onRequestError` in `instrumentation.ts` |
| Unhandled API route crashes | Yes | Node.js uncaught exception handler |
| Re-thrown errors from `try/catch` | Yes | Bubble to the global handler |
| `error.tsx` boundary errors | No | Next.js catches them first |
| `global-error.tsx` boundary errors | No | Next.js catches them first |
| Caught and swallowed `try/catch` | No | Call `captureException` |
| Server Action graceful error returns | No | `captureException` or the wrapper |
| Caught edge middleware errors | No | `captureException` manually |

- **A graceful return swallows the error.** Call `Sentry.captureException(err)` before the `return`:

```typescript
// NOT captured: swallowed by graceful return
try {
  await doSomething();
} catch (err) {
  return { error: "Failed" }; // ← must add captureException here
}

// Manually captured
try {
  await doSomething();
} catch (err) {
  Sentry.captureException(err);
  return { error: "Failed" };
}
```

## Capture APIs

- **`Sentry.captureException(error, context?)`.** Prefer `Error` objects: they include stack traces. Context keys: `level`, `tags`, `extra`, `user`, `fingerprint`, `contexts`.

```typescript
Sentry.captureException(error, {
  level: "fatal",
  tags: { section: "checkout" },
  extra: { orderId, userId: user.id },
  user: { id: "user-123", email: "user@example.com" },
  fingerprint: ["checkout-failure", String(error.code)],
  contexts: {
    cart: { items: 3, total: 99.99 },
  },
});
```

- **`Sentry.captureMessage(message, levelOrContext?)`** with levels `"fatal" | "error" | "warning" | "log" | "info" | "debug"`, e.g. `Sentry.captureMessage("Deprecated API used", "warning");`.
- **Unhandled rejections are configurable** through `globalHandlersIntegration`; set `onunhandledrejection: false` to handle them yourself:

```typescript
// instrumentation-client.ts
Sentry.init({
  dsn: "___PUBLIC_DSN___",
  integrations: [
    Sentry.globalHandlersIntegration({
      onerror: true,
      onunhandledrejection: true, // set false to handle manually
    }),
  ],
});

// Manual rejection handling (if onunhandledrejection: false)
window.addEventListener("unhandledrejection", (event) => {
  Sentry.captureException(event.reason);
});
```

## Error boundaries

### App Router

- **Layout:** `app/global-error.tsx` (root, last resort), `app/error.tsx` (app-wide), `app/dashboard/error.tsx` (one segment).
- **Every `error.tsx` must call `captureException` in `useEffect`:** Next.js catches the error before Sentry can.

```tsx
// app/error.tsx  (also: app/dashboard/error.tsx, etc.)
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // REQUIRED: Next.js catches this before Sentry can
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

- **`digest`:** server-side errors include a `digest` hash; use it to correlate Sentry events with server logs.
- **`app/global-error.tsx` catches root layout errors.** It must start with `"use client"` as the very first line, render its own `<html>` and `<body>`, and use `<NextError statusCode={0} />` because the App Router doesn't expose HTTP status codes for errors.

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

### React error boundaries

- **React 18 and earlier:** `<Sentry.ErrorBoundary>` with `fallback={({ error, resetError }) => ...}`, `beforeCapture={(scope, error) => { scope.setTag("section", "checkout"); scope.setLevel("fatal"); }}` and `onError={(error, componentStack, eventId) => ...}`.
- **React 19+:** pass `Sentry.reactErrorHandler()` to `createRoot`:

```tsx
createRoot(container, {
  onUncaughtError: Sentry.reactErrorHandler(),    // fatal: tree unmounts
  onCaughtError: Sentry.reactErrorHandler(),      // caught by an ErrorBoundary
  onRecoverableError: Sentry.reactErrorHandler(), // auto-recovery (hydration)
}).render(<App />);
```
- **Use both together:** `reactErrorHandler()` is the global net; `<Sentry.ErrorBoundary>` gives scoped fallback UIs.

### Pages Router

- **`pages/_error.tsx` must `await` `captureUnderscoreErrorException`** so Sentry flushes before the serverless function exits.

```tsx
// pages/_error.tsx
import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import type { ErrorProps } from "next/error";
import Error from "next/error";

const CustomErrorComponent: NextPage<ErrorProps> = (props) => {
  return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // CRITICAL: await so Sentry flushes before the serverless function exits
  await Sentry.captureUnderscoreErrorException(contextData);
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
```

- **`pages/_app.tsx`:** wrap `<Component {...pageProps} />` in `<Sentry.ErrorBoundary fallback={<p>An error has occurred.</p>}>`.

## Server-side capture

- **Route handlers that catch must capture.** App Router:

```typescript
// app/api/users/route.ts
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/users", method: "POST" },
    });
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
```

- **Pages Router `pages/api/users.ts`:** `Sentry.captureException(error)` then `res.status(500).json(...)`.
- **Server Actions:** either capture before a graceful `return { success: false, ... }`, or (recommended) wrap with `withServerActionInstrumentation`, which instruments the action with tracing, attaches form data and connects client and server traces. Errors thrown inside are captured automatically.

```typescript
// app/actions.ts
"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

export async function submitForm(formData: FormData) {
  return Sentry.withServerActionInstrumentation(
    "submitForm",
    {
      headers: await headers(), // connects client and server traces
      formData,                 // attaches form data to Sentry events
      recordResponse: true,     // includes response data
    },
    async () => {
      // Errors thrown here are automatically captured
      const result = await processForm(formData);
      return { success: true, data: result };
    },
  );
}
```

- **Edge middleware:** uncaught errors are captured via `onRequestError`; caught errors need `captureException` with `tags: { runtime: "edge", path: request.nextUrl.pathname }`.

## Scopes and enrichment

- **Scopes merge `Global → Isolation → Current → Event Sent`;** later ones override earlier ones.
- **Isolation scope:** on the server it is forked per request; in the browser there is one per page load. All top-level `Sentry.setXxx()` methods write to it (`Sentry.setTag` is `Sentry.getIsolationScope().setTag`).
- **Global scope** for every event: `Sentry.getGlobalScope().setTag("app_version", "2.1.0");` and `Sentry.getGlobalScope().setContext("build", { sha: process.env.VERCEL_GIT_COMMIT_SHA });`.
- **`Sentry.withScope((scope) => { ... Sentry.captureException(deleteError); })`** for one capture: tags and context set inside do not appear on later events. Scope methods: `setTag`, `setLevel`, `setUser`, `setContext`, `addBreadcrumb`, `setFingerprint`, `addEventProcessor`. `Sentry.withIsolationScope((scope) => { ... })` also exists.

| Data should reach | Use |
|---|---|
| All events | `getGlobalScope().setTag` |
| One request or page load | `Sentry.setTag` |
| One capture | `withScope` |
| Inline | Second argument of `captureException` |

- **Users:** `Sentry.setUser({...})` on login (`id`, `email`, `username`, plus any extra fields), `Sentry.setUser(null)` on logout.
- **Tags are indexed and searchable.** Key: max 32 chars, `a-zA-Z0-9_.:- ` (no spaces). Value: max 200 chars, no newlines. `Sentry.setTag`, `Sentry.setTags({...})`.
- **`setContext(name, obj)` is not indexed or searchable;** clear it with `null`. It is normalized to 3 levels deep by default. The `type` key is reserved; don't use it.
- **`setExtra` / `setExtras` are non-indexed;** prefer `setContext` for structured objects.

| Data | Searchable | Indexed |
|---|---|---|
| Tags | Yes | Yes |
| Context | No | No |
| Extra | No | No |
| User | Partially | Yes |

## Breadcrumbs

- **Automatic:** `ui.click`, `navigation`, `http` (XHR and fetch URL, method, status), `console`.
- **Manual:** `Sentry.addBreadcrumb({ category, message, level, data })`, plus `type`. Types: `"default" | "debug" | "error" | "info" | "navigation" | "http" | "query" | "ui" | "user"`. Levels: `"fatal" | "error" | "warning" | "log" | "info" | "debug"`. `timestamp` is set automatically if omitted.
- **`beforeBreadcrumb(breadcrumb, hint)` returns `null` to drop.** Typical uses: drop clicks on password fields (`hint?.event?.target?.type === "password"`), drop `console` breadcrumbs at `debug`, enrich `fetch` breadcrumbs with `hint.response.status`.
- **`maxBreadcrumbs`** defaults to 100 (e.g. `maxBreadcrumbs: 50`).

## Filtering, fingerprints and event processors

- **`beforeSend(event, hint)` is the last chance to modify or discard an event.** It runs after all event processors; return `null` to drop. Typical uses: drop non-Error rejections (`error && !(error instanceof Error)`), drop events with `extension://` frames, scrub `event.user.email` to `"[filtered]"`, set `event.fingerprint = ["chunk-load-failure"]` for `ChunkLoadError`.
- **Only one `beforeSend` is allowed.** For more processors use `addEventProcessor()`.
- **`beforeSendTransaction(event)`** drops or edits transactions, e.g. `event.transaction === "/api/health"`.
- **`ignoreErrors`:**

```typescript
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "fb_xd_fragment",
    /^Network Error$/i,
    /Loading chunk \d+ failed/,
    /^Script error\.?$/,
  ],
```

- **`allowUrls` and `denyUrls`:** `allowUrls: [/https?:\/\/((cdn|www)\.)?yourapp\.com/]`; `denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i, /gtm\.js/]`.
- **Events with the same fingerprint group into the same issue.** Set it per event (`fingerprint` in the capture context), per scope (`scope.setFingerprint([method, path, String(err.statusCode)])`) or in `beforeSend`. Extend default grouping instead of replacing it: `event.fingerprint = ["{{ default }}", String(error.functionName), String(error.errorCode)]`. Template variables: `{{ default }}` (Sentry's computed hash), `{{ transaction }}`, `{{ function }}` (top function), `{{ type }}` (exception type).
- **Event processors:** `Sentry.addEventProcessor((event, hint) => {...})` globally, `scope.addEventProcessor(...)` inside `withScope`. All `addEventProcessor()` processors run first, then `beforeSend` runs last (guaranteed).

## Companion backend

- **Look for a backend:** `../backend ../server ../api ../services`, `go.mod`, `requirements.txt` or `pyproject.toml`, `Gemfile`, `pom.xml` or `build.gradle`. A Node.js backend (Express, Fastify, Hapi) uses `@sentry/node`: https://docs.sentry.io/platforms/javascript/guides/express/.
- **Connecting frontend and backend with the same DSN or linked projects enables distributed tracing** (see [NEXTJS-FEATURES.md](NEXTJS-FEATURES.md#distributed-tracing)).

**JavaScript Logs defaults:** Use the [versioned JavaScript Logs rule](SIGNALS-PRACTICE.md#logs); the old source incorrectly described every version as opt-in. [https://docs.sentry.io/platforms/javascript/logs/]

## Debugging

| Symptom | Cause | Fix |
|---|---|---|
| Events not appearing | DSN misconfigured, or `debug: false` hiding SDK errors | Set `debug: true` temporarily; check the network tab for requests to `sentry.io` |
| Errors missing from `error.tsx` | Next.js caught them first | `captureException` in `useEffect` |
| Server Component errors missing, `onRequestError` not firing | Hook not exported, or SDK below 8.28.0 | `export const onRequestError = Sentry.captureRequestError`; `npm install @sentry/nextjs@latest`; Next.js 15 |
| Edge errors missing | `sentry.edge.config.ts` not loaded | `instrumentation.ts` imports it when `NEXT_RUNTIME === "edge"` |
| Minified stack traces | Source maps not uploading | Check `SENTRY_AUTH_TOKEN` and `authToken`; run `next build` and look for "Source Maps" in the output; use `digest` to correlate |
| Maps missing with Turbopack | Check documented SDK/Next.js support | Full production support requires @sentry/nextjs 10.13.0+ and Next.js 15.4.1+; the source's unversioned experimental claim was stale [https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/] |
| Duplicate errors | More than one handler per error, or React Strict Mode double-firing in dev | One handler per error; validate in production builds |
| Events blocked by ad-blockers | No tunnel | `tunnelRoute: "/monitoring"`, excluded from the middleware matcher |
| Tunnel route 404 | Route missing | The plugin creates it automatically; run `next build` after adding `tunnelRoute` |
| Build breaks on tree-shaking | Turbopack | Remove `webpack.treeshake` options |
| `global-error.tsx` not catching | Missing `"use client"` | Add it as the very first line |
| Replay not recording | `replayIntegration()` missing | Add it to `integrations` in `instrumentation-client.ts` |
| Events from the wrong DSN in a hybrid app | DSN differs between runtimes | Give all three init files the identical DSN |
| Server Action errors missing | Swallowed by a graceful return | `withServerActionInstrumentation`, or `captureException` before any graceful `return` |
| `_error.tsx` events lost on serverless | Function exits before flush | Always `await captureUnderscoreErrorException` |

## Source conflicts

- **Replay sample-rate defaults:** the SDK setup guide lists `replaysSessionSampleRate` `0.1` and `replaysOnErrorSampleRate` `1.0`; the Session Replay reference lists both as `0`. The Next.js docs page's wizard config sets `0.1` / `1.0`. Confirm in the current docs.
- **`onRequestError` prerequisites:** the setup guide says `@sentry/nextjs` 8.28.0+; the error monitoring reference says 8.28.0+ and Next.js 15+. Confirm in the current docs.
- **Turbopack:** the setup guide says Next.js 15+ is needed for Turbopack support and tree-shaking is webpack only; the error monitoring reference adds that Turbopack source map upload is experimental. Confirm in the current docs.
- **Edge DSN:** the setup guide's edge config reads `process.env.SENTRY_DSN ?? "___DSN___"`; the error monitoring reference's edge example uses `"___PUBLIC_DSN___"` with `tracesSampleRate: 1.0`. The DSN must match across runtimes either way.
- **Minimum versions:** the setup guide says Next.js 13+; the Next.js docs page says Next.js 14+ and Node.js 20.19.0+. Confirm in the current docs.
- **`withSentryConfig` import and tunnel path:** the setup guide imports `withSentryConfig` from `@sentry/nextjs` and uses `tunnelRoute: "/monitoring"`; the Next.js docs page imports it from `@sentry/nextjs/config` and uses `tunnelRoute: "/sentry-tunnel"`. Confirm in the current docs.

## Prove it

- **Test error per runtime, then remove it:** add this to a client component, to a Server Action or API route, and to middleware or an edge route handler. Each should appear at https://sentry.io/issues/ within about 30 seconds.

```typescript
// Add temporarily to a server action or API route, then remove
import * as Sentry from "@sentry/nextjs";

throw new Error("Sentry test error - delete me");
// or
Sentry.captureException(new Error("Sentry test error - delete me"));
```

- **Wizard installs:** `/sentry-example-page` triggers an error that reaches Issues.
- **Don't test from the browser devtools console:** errors thrown there are sandboxed and not captured.
- **Session Replay:** a session shows in the Replays tab.
- **Boundaries report:** an error thrown under an `error.tsx` segment and one thrown in the root layout both reach Issues, which proves `captureException` in `useEffect` and `global-error.tsx` with `"use client"` first.
- **Swallowed errors:** every `catch` that returns gracefully (Server Actions, route handlers, middleware) calls `captureException`, or the action is wrapped in `withServerActionInstrumentation`.
- **Runtime wiring:** `instrumentation.ts` imports the server config for `"nodejs"` and the edge config for `"edge"`, and exports `onRequestError`; all three init files have the identical DSN.
- **Source maps:** `next build` output mentions "Source Maps", and a production stack trace shows readable file names.
- **Tunnel:** with an ad-blocker on, events still arrive through `/monitoring`, and the middleware (or `proxy.ts`) matcher excludes it.
- **Grouping and scrubbing:** a `beforeSend` test event shows `"[filtered]"` for the email, and `ChunkLoadError` events group into one issue.
