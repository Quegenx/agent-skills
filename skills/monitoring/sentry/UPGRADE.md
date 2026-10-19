# Upgrading the JavaScript SDK

Major upgrades of Sentry's JavaScript SDKs (`@sentry/*`): v7 to v8, v8 to v9, v9 to v10 and v10 to v11, for Next.js, Remix, React, Express and Node, NestJS, Bun and Cloudflare. Other Sentry SDKs (Python, Ruby, Go, Flutter) are not covered here; Flutter is in [FLUTTER.md](FLUTTER.md). What decides most outcomes: every `@sentry/*` package moves to the same major in one step, code changes are applied hop by hop in order, and v9 brings behavior changes that type checkers don't catch, so a green build is not proof. Release and source-map setup after the upgrade is in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md); sampling and PII defaults in [PRACTICES.md](PRACTICES.md).

**Contents:** [Which version](#which-version) · [Detect](#detect) · [Plan the migration](#plan-the-migration) · [Apply it](#apply-it) · [Where the config lives](#where-the-config-lives) · [v7 to v8](#v7-to-v8) · [v8 to v9](#v8-to-v9) · [v9 to v10](#v9-to-v10) · [v10 to v11](#v10-to-v11) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## Which version

- **Resolve the target from current official guides and the installed runtime.** v10 and v11 migration guides exist; the old source called v9 latest and v10 unpublished. Historical v7/v8/v9 sections remain for those exact hops. Check the current registry/docs rather than inferring the latest version from this file. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]
- **Packages already bumped and code broken:** read the target from `package.json`.
- **Official hops:** [v7 to v8](https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/), [v8 to v9](https://docs.sentry.io/platforms/javascript/migration/v8-to-v9/), [v9 to v10](https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/) and [v10 to v11](https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/). Read the platform-specific guide for the installed framework.

## Detect

```bash
cat package.json | grep -E '"@sentry/' | head -20
```

```bash
ls node_modules/@sentry/*/package.json 2>/dev/null | head -5 | xargs -I{} sh -c 'echo "--- {} ---" && grep "\"version\"" {}'
```

| Dependency | Framework | Sentry package |
|---|---|---|
| `next` | Next.js | `@sentry/nextjs` |
| `@remix-run/node` | Remix | `@sentry/remix` |
| `react` (no Next or Remix) | React SPA | `@sentry/react` |
| `express` | Express | `@sentry/node` |
| `@nestjs/core` | NestJS | `@sentry/nestjs` |
| `bun` types or runtime | Bun | `@sentry/bun` |
| `@cloudflare/workers-types` | Cloudflare | `@sentry/cloudflare` |
| None of the above (Node.js) | Node.js | `@sentry/node` |

```bash
grep -rn "from '@sentry/\|require('@sentry/" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --include="*.mjs" --include="*.cjs" -l
```

```bash
find . -name "sentry.*" -o -name "*.sentry.*" -o -name "instrumentation.*" | grep -v node_modules | grep -v .next | grep -v .nuxt
```

- **Which hop the code needs:**

```bash
# v7 patterns (need v7→v8 migration)
grep -rn "from '@sentry/hub'\|from '@sentry/tracing'\|from '@sentry/integrations'\|from '@sentry/serverless'\|from '@sentry/replay'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -l
grep -rn "new BrowserTracing\|new Replay\|startTransaction\|configureScope\|Handlers\.requestHandler\|Handlers\.errorHandler" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -l

# v8 patterns (need v8→v9 migration)
grep -rn "from '@sentry/utils'\|from '@sentry/types'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -l
grep -rn "getCurrentHub\|enableTracing\|captureUserFeedback\|@WithSentry\|autoSessionTracking" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -l
```

## Plan the migration

- **Single hop** (v8 to v9) or **multi-hop** (v7 to v9: v7 to v8 changes first). For multi-hop, apply code changes incrementally but update package versions once, to the final target.
- **Sort every change into three groups:**

| Group | Examples |
|---|---|
| Auto-fixable | Import renames (`@sentry/utils` to `@sentry/core`), simple method renames (`@WithSentry` to `@SentryExceptionCaptured`), config swaps (`enableTracing` to `tracesSampleRate`) |
| AI-assisted | Hub removal where the hub is stored in variables, transactions to spans, complex config restructuring (Next.js config merging), sampler `transactionContext` flattening |
| Manual review | Removed APIs with no equivalent, behavior changes (sampling, source-map defaults), custom transport changes |

- **Confirm the path and scope with the user** before editing. `npx @sentry/wizard -i upgrade` is a CLI alternative for v8 to v9 but may not handle all patterns.

## Apply it

- **Per file:** read it, apply the auto-fixable changes, propose the AI-assisted edits with an explanation, and ask before uncertain changes.
- **In this order:** 1) package imports, 2) API renames, 3) config (`Sentry.init()` and build config), 4) complex patterns (Hub in variables, transaction code, custom integration classes, framework wrappers), 5) bump every `@sentry/*` package to the same major, 6) verify the build.

```bash
# Detect package manager
if [ -f "yarn.lock" ]; then
  echo "yarn"
elif [ -f "pnpm-lock.yaml" ]; then
  echo "pnpm"
else
  echo "npm"
fi
```

- **Bump everything at once:** `npx npm-check-updates -f '@sentry/*' -u && npm install`, `yarn upgrade-interactive --latest`, or `pnpm update '@sentry/*' --latest`.
- **Verify:**

```bash
npx tsc --noEmit 2>&1 | head -50
npm run build 2>&1 | tail -20
```

- **Worth mentioning to the user:** v8 brought OpenTelemetry-based Node tracing, automatic database and HTTP instrumentation, functional integrations and new span APIs; v9 brought structured logging (`Sentry.logger.*`), better source-map handling and simpler configuration.

## Where the config lives

| Framework | Client | Server | Build | Other |
|---|---|---|---|---|
| Next.js | `instrumentation-client.ts` | `sentry.server.config.ts` | `next.config.ts` (wrapped with `withSentryConfig`) | `instrumentation.ts`, `sentry.edge.config.ts` |
| Remix | `entry.client.tsx` | `entry.server.tsx` | none | none |
| React (SPA) | `src/index.tsx` or `src/main.tsx` | none | none | none |
| Express/Node | none | `app.ts` or `server.ts` | none | `instrument.ts` |
| NestJS | none | `main.ts` | none | `instrument.ts` |

- **Next.js:** check the client and server configs, the `withSentryConfig` wrapper and `instrumentation.ts`; test both `next dev` and `next build`; check source-map upload in the build output.
- **React SPA:** check the browser tracing integration, React Router integration compatibility and error boundaries.
- **Express and Node:** Sentry must initialize before every other import (v8+); check where `setupExpressErrorHandler` sits and any custom middleware that uses the scope.
- **NestJS:** use `@sentry/nestjs` (moved out of `@sentry/node` in v9); check decorator and filter renames; remove `SentryService` and `SentryTracingInterceptor`.

## v7 to v8

The largest migration: performance APIs rebuilt on OpenTelemetry, packages removed, integrations changed from classes to functions. Upgrade to the latest v7 and clear its deprecations first.

### Runtime minimums

| | v7 | v8 |
|---|---|---|
| Node (CJS) | 8+ | 14.18+ |
| Node (ESM) | 8+ | 18.19.1+ |
| Browsers | IE11+ | ES2018+ (Chrome 71, Edge 79, Safari 12.1, Firefox 65) |
| Next.js | 10+ | 13.2.0+ |
| React | 15+ | 16+ |

### Removed packages

| v7 | v8 |
|---|---|
| `@sentry/hub` | `@sentry/core` |
| `@sentry/tracing` | Import from the SDK directly |
| `@sentry/integrations` | `@sentry/browser` or `@sentry/node`, as functions |
| `@sentry/serverless` | `@sentry/aws-serverless` or `@sentry/google-cloud-serverless` |
| `@sentry/replay` | `@sentry/browser` (`replayIntegration`) |

### Integrations are functions

```diff
- import { BrowserTracing } from '@sentry/tracing';
  import * as Sentry from '@sentry/browser';

  Sentry.init({
    dsn: '__DSN__',
    tracesSampleRate: 1.0,
-   integrations: [new BrowserTracing()],
+   integrations: [Sentry.browserTracingIntegration()],
  });
```

- **Node:** delete `require('@sentry/tracing');`.
- **Class to function:** `new CaptureConsole()` to `captureConsoleIntegration()`, `new Debug()` to `debugIntegration()`, `new ExtraErrorData()` to `extraErrorDataIntegration()`, `new RewriteFrames()` to `rewriteFramesIntegration()`, `new SessionTiming()` to `sessionTimingIntegration()`, `new Dedupe()` to `dedupeIntegration()` (on by default), `new HTTPClient()` to `httpClientIntegration()` (browser), `new ContextLines()` to `contextLinesIntegration()` (browser), `new ReportingObserver()` to `reportingObserverIntegration()` (browser), `new Sentry.Replay()` to `Sentry.replayIntegration()`.
- **Looking one up:** `Sentry.getIntegration(Replay)` becomes `Sentry.getClient().getIntegrationByName('Replay')`.
- **Serverless:**

```diff
- const Sentry = require('@sentry/serverless');
- Sentry.AWSLambda.init({ dsn: '__DSN__' });
+ const Sentry = require('@sentry/aws-serverless');
+ Sentry.init({ dsn: '__DSN__' });
```

### Transactions become spans

```diff
- const transaction = Sentry.startTransaction({ name: 'my-transaction' });
- const span = transaction.startChild({ op: 'task' });
- span.finish();
- transaction.finish();
+ const result = Sentry.startSpan({ name: 'my-transaction' }, () => {
+   return Sentry.startSpan({ name: 'task', op: 'task' }, () => {
+     return doWork();
+   });
+ });
```

- **New:** `Sentry.startSpan()` (active, callback, recommended), `Sentry.startInactiveSpan()`, `Sentry.startSpanManual()`. **Removed:** `startTransaction`, `span.startChild`, `scope.getSpan`, `scope.setSpan`, `getActiveTransaction`.

### Hub to scopes

- **`Sentry.configureScope(cb)`** becomes `Sentry.getCurrentScope().setTag(...)`; `addGlobalEventProcessor(fn)` becomes `Sentry.getGlobalScope().addEventProcessor(fn)`; `runWithAsyncContext(fn)` becomes `Sentry.withIsolationScope(fn)`; `pushScope()`/`popScope()` become `Sentry.withScope(fn)`; `makeMain(hub)` is removed.
- **`Hub` and `getCurrentHub()` still exist in v8 but are deprecated** (removed in v9): `hub.captureException(error)` becomes `Sentry.captureException(error)`.
- **This is JavaScript only.** The Dart SDK still documents `Sentry.configureScope` and `Sentry.startTransaction` (FLUTTER.md).

### Config

- **`tracingOrigins`** becomes `tracePropagationTargets`, set in `Sentry.init()`.
- **`interactionsSampleRate`** is replaced by `tracesSampler` filtering on `sentry.op`.
- **The `Severity` enum** becomes the `SeverityLevel` type (string literals).
- **The `metricsAggregator` experiment** is removed ("Metrics now work without configuration").

### Node and Express

- **Initialize Sentry before everything else:**

```js
// Must be the first import
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

// Other imports after Sentry.init()
import express from 'express';
```

- **Express:** `Sentry.Handlers.requestHandler()`, `tracingHandler()` and `errorHandler()` are replaced by `Sentry.setupExpressErrorHandler(app)` (only the error handler is needed). `Sentry.Handlers.trpcMiddleware()` becomes `Sentry.trpcMiddleware()`.

### Next.js

- **`withSentryConfig` takes 2 arguments, not 3:** the plugin and SDK options merge into the second.
- **Removed:** the `sentry` property in `next.config.js`, `transpileClientSDK`, `nextRouterInstrumentation`, `withSentryApi`, `withSentryGetServerSideProps`.
- **`instrumentation.ts` is now required** for server initialization.

### Other removals

`spanStatusfromHttpCode` to `getSpanStatusFromHttpCode`; the `Span` class is no longer exported; `enableAnrDetection`/`Anr` to `anrIntegration()`; `Apollo` is automatic via `graphqlIntegration`; `Offline` uses an offline transport wrapper; `makeXHRTransport` to `makeFetchTransport`; `deepReadDirSync` and `wrap` have no replacement.

### Find what's left

```bash
grep -rn "from '@sentry/hub'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "from '@sentry/tracing'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "from '@sentry/integrations'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "from '@sentry/serverless'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "from '@sentry/replay'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "new BrowserTracing\|new Replay\|new Integrations\." --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "startTransaction\|\.startChild\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "configureScope\|getCurrentHub\|addGlobalEventProcessor" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "Handlers\.requestHandler\|Handlers\.tracingHandler\|Handlers\.errorHandler" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "tracingOrigins" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "Severity\." --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
```

| Change | Effort |
|---|---|
| Package renames, class to function, Express handlers | Low |
| Hub to scopes, Node early init, Next.js | Medium |
| Performance API (transactions to spans) | High |

## v8 to v9

Mostly API cleanup, but with behavioral changes that type checkers don't catch. Self-hosted Sentry 24.4.2+ still works.

### Runtime minimums

| | v8 | v9 |
|---|---|---|
| Node | 14.18+ | 18.0.0+ (ESM-only SDKs 18.19.1+) |
| Browsers | ES2018+ | ES2020+ (Chrome 80, Edge 80, Safari 14, Firefox 74) |
| TypeScript | 4.9.3+ | 5.0.4+ |
| Deno | 1.x | 2.0.0+ |

- **Dropped framework versions:** Remix 1.x (minimum 2.x), TanStack Router 1.63.0 and lower, Prisma 5.x (6.x by default; older through the `prismaInstrumentation` option).

### Packages

- **`@sentry/utils`** is removed: import from `@sentry/core`.
- **`@sentry/types`** is deprecated (still published, gone in the next major): import from `@sentry/core`.

### Hub is gone

`getCurrentHub()`, `Hub` and `getCurrentHubShim()` are removed.

| v8 | v9 |
|---|---|
| `getCurrentHub().captureException(e)` | `Sentry.captureException(e)` |
| `getCurrentHub().captureMessage(m)` | `Sentry.captureMessage(m)` |
| `getCurrentHub().captureEvent(e)` | `Sentry.captureEvent(e)` |
| `getCurrentHub().addBreadcrumb(b)` | `Sentry.addBreadcrumb(b)` |
| `getCurrentHub().setTag(k, v)` | `Sentry.getCurrentScope().setTag(k, v)` |
| `getCurrentHub().setExtra(k, v)` | `Sentry.getCurrentScope().setExtra(k, v)` |
| `getCurrentHub().setUser(u)` | `Sentry.setUser(u)` |
| `getCurrentHub().getClient()` | `Sentry.getClient()` |
| `getCurrentHub().getScope()` | `Sentry.getCurrentScope()` |

### Config

- **`enableTracing`** is removed: use `tracesSampleRate: 1`.
- **`autoSessionTracking`** is removed. To turn sessions off, remove `browserSessionIntegration` (browser) or set `httpIntegration` with `trackIncomingRequestsAsSessions: false` (server).
- **The metrics API is removed** ("The Sentry metrics beta ended"); delete `Sentry.metrics.*` calls. The Flutter/Dart SDK documents a live metrics API (FLUTTER-FEATURES.md); the sources disagree on whether Sentry metrics exist.
- **The sampler context is flattened** (in `profilesSampler` too):

```diff
  Sentry.init({
    tracesSampler: samplingContext => {
-     if (samplingContext.transactionContext.name === '/health-check') {
+     if (samplingContext.name === '/health-check') {
        return 0;
      }
      return 0.5;
    },
  });
```

### Removed and renamed APIs

| v8 | v9 |
|---|---|
| `addOpenTelemetryInstrumentation(inst)` | `Sentry.init({ openTelemetryInstrumentations: [inst] })` |
| `debugIntegration` | Hook options |
| `sessionTimingIntegration` | `Sentry.setContext()` |
| `generatePropagationContext()` | `generateTraceId()` |
| `IntegrationClass` | `Integration` or `IntegrationFn` |
| `BAGGAGE_HEADER_NAME` | The `"baggage"` string |
| `extractRequestData` | Removed; extract by hand |
| `addRequestDataToEvent` | `httpRequestToRequestData` |
| `DEFAULT_USER_INCLUDES`, `SessionFlusher` | No replacement |

- **Browser feedback:**

```diff
- Sentry.captureUserFeedback({
-   event_id: eventId,
-   name: 'User',
-   email: 'user@example.com',
-   comments: 'Something broke',
- });
+ Sentry.captureFeedback({
+   name: 'User',
+   email: 'user@example.com',
+   message: 'Something broke',
+   associatedEventId: eventId,
+ });
```

### Per framework

- **Node:** `nestIntegration` and `setupNestErrorHandler` are removed (use `@sentry/nestjs`); `registerEsmLoaderHooks` accepts only `true | false | undefined`; `processThreadBreadcrumbIntegration` is renamed `childProcessIntegration`.
- **Node behavior:** `tracesSampler` runs only for root spans, not every span; `requestDataIntegration` no longer sets the user from `request.user` in Express (call `Sentry.setUser()`); `samplingContext.request` becomes `samplingContext.normalizedRequest`; `skipOpenTelemetrySetup: true` now sets `httpIntegration({ spans: false })` automatically.
- **React:** `wrapUseRoutes` becomes `wrapUseRoutesV6` or `wrapUseRoutesV7`; `wrapCreateBrowserRouter` becomes `wrapCreateBrowserRouterV6` or `wrapCreateBrowserRouterV7`.
- **NestJS:** `@WithSentry` becomes `@SentryExceptionCaptured`; remove `SentryService` and `SentryTracingInterceptor`; `SentryGlobalGenericFilter` and `SentryGlobalGraphQLFilter` become `SentryGlobalFilter`.
- **Next.js:** `hideSourceMaps` is removed (hidden source maps are the default); the `sentry` next-config property is removed (pass options to `withSentryConfig`); client source maps are deleted after upload (opt out with `sourcemaps.deleteSourcemapsAfterUpload: false`); the Build ID is no longer the release fallback (set `release.name`); source maps are on for client and server builds. More on this in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).
- **Remix:** the `autoInstrumentRemix` option is removed and always behaves as `true`.

### Behavior changes in every SDK

- **`beforeSendSpan` can't return `null`** and now also receives root spans.
- **`startSpan` with a custom `scope`** now clones it.
- **`tracesSampleRate: undefined`** defers sampling to downstream SDKs.
- **`captureConsoleIntegration` with `attachStackTrace: true`** marks messages `handled: true`.
- **The browser SDK no longer asks the backend to infer the IP** by default; set `sendDefaultPii: true` to restore it.
- **Types:** `Scope` usages need `Scope` instances, `Client` usages need `BaseClient` instances; the abstract `Client` class is removed.

### Find what's left

```bash
grep -rn "from '@sentry/utils'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "from '@sentry/types'" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "getCurrentHub\|getCurrentHubShim\|new Hub(" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "enableTracing\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "autoSessionTracking\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "hideSourceMaps\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "autoInstrumentRemix\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "captureUserFeedback\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "addOpenTelemetryInstrumentation\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "transactionContext\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "@WithSentry\b" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "SentryGlobalGenericFilter\|SentryGlobalGraphQLFilter" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "wrapUseRoutes[^V]" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "wrapCreateBrowserRouter[^V]" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "processThreadBreadcrumbIntegration" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
grep -rn "Sentry\.metrics\." --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"
```

| Change | Effort |
|---|---|
| utils/types to core, `enableTracing`, method renames, React Router wrappers, NestJS decorator, `captureUserFeedback`, Next.js source maps | Low |
| Hub removal, `beforeSendSpan` and sampling behavior | Medium |

## v9 to v10

The official guide exists; the old source's unpublished-v10 prediction is historical. v10 upgrades OpenTelemetry dependencies to 2.x.x/0.20x.x and requires self-hosted 24.4.2+; projects unable to move to OTel 2 can remain on 9 or use the v10 node-core option. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/]

- FID reporting is removed; replace FID-dependent dashboards/alerts with INP. The removed _experiments.autoFlushOnFeedback behavior is now the default. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/]
- In 10.4, the browser IP-inference fix makes sendDefaultPii actually govern automatic IP capture as advertised since 9; false/unset does not infer it, true does. This is a historical 10.x rule; SDK 11 uses dataCollection.userInfo. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/#update-user-ip-address-collection-gated-by-senddefaultpii]
- Removed BaseClient->Client, hasTracingEnabled->hasSpansEnabled, internal core logger/Logger->debug/SentryDebugLogger. This internal logger change does not remove the public Sentry Logs logger. The old source only predicted the internal rename. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/#removed-apis]

```diff
- import { logger } from '@sentry/core';
- logger.info('message');
+ import { debug } from '@sentry/core';
+ debug.log('message');
```

- _experiments.enableLogs/beforeSendLog become the top-level options in 10; in 11 enableLogs is removed altogether. Do not apply this historical migration to Flutter/RN SDK versions. [https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/#removed-apis]

## v10 to v11

This is the selected-stack routing for the current official v11 migration, not permission to upgrade a working project without the task's authorization. Upgrade to a recent 10.x first. Node 20.19.0 is the new minimum; self-hosted 26.4.2+ is supported. Browser support is ES2020 with Safari 15+/iOS 15+ (Safari 14 removed), and the guide lists TypeScript 5.0.4 minimum. Check the exact framework/runtime range before an upgrade. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

### Privacy and capture

- dataCollection replaces sendDefaultPii; omitting it collects more data than restrictive 10.x defaults. Review userInfo, cookies, request/response headers and bodies, GenAI content, database data, stack locals and source-context categories explicitly through [JAVASCRIPT.md](JAVASCRIPT.md#datacollection). Key-name scrubbing is best effort; a credential under an innocuous key can still leave the app. Integration-level explicit collection overrides remain separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#data-collection]
- enableLogs/enableMetrics and their experiments are removed; calls or logging integrations emit directly. beforeSendMetric is top-level. attachStacktrace now defaults true; this changes grouping and captureMessage can mark a session errored, without changing its crash-free rate. Use Logs for informational output when appropriate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#logs-and-metrics; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#errors-and-sessions]
- Browser sessions now default to page lifetime, not every client navigation, and uncaught-error status becomes unhandled rather than crashed. route lifecycle remains an explicit configuration. DOMException.code tag is removed; use error.type. sendFeedback now rejects with an Error rather than some string failures. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#errors-and-sessions]

### Tracing and matching

- Stream mode is default. Static transaction mode is compatibility-only; beforeSendTransaction/ignoreTransactions apply only there. beforeSendSpan receives StreamedSpanJSON in stream mode, and static mode requires withStaticSpan. Matching callback/lifecycle matters; mismatched callbacks are ignored. Use ignoreSpans to drop, not null from beforeSendSpan. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#tracing]
- Serialized description/data/op/timestamp become name/attributes/attributes[sentry.op]/end_timestamp; status is ok/error with original fine status preserved on sentry.status.message. spanToJSON returns the streamed shape; spanToStreamedSpanJSON is removed. Scope tags/extra still enrich errors but not streamed spans; use attributes for spans/logs/metrics. Primitive arrays are accepted too. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#tracing]
- Span names now follow low-cardinality conventions: resolved route or safe fallback, HTTP method/domain, database summary, and stable operation names. The removed details stay on attributes. ignoreSpans/tracesSampler run at start, so final names may be unavailable; inspect initial attributes rather than assuming final route matching. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#span-names-are-low-cardinality]
- Ops consolidate: framework handlers/middleware/router/function scopes become generic names; Redis uses db.query/db, messaging uses queue.publish/receive/process, React lifecycle uses ui.mount/render/update/unmount, and long-task/long-animation-frame ops use snake_case. Cloudflare cron/email/workflow-step ops become function. Update filters/dashboards with the exact migration table, rather than treating old source ops as v11 examples. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#span-operations-were-consolidated]
- Legacy http.method/status_code, db.system/name/statement and similar keys move to current conventions. GenAI cache/reasoning keys become gen_ai.usage.cache_read.input_tokens, cache_creation.input_tokens and reasoning.output_tokens; tool input/output become gen_ai.tool.call.arguments/result. SEMANTIC_ATTRIBUTE_SENTRY_SOURCE moves to sentry.segment.name.source on root spans. Do not preserve deprecated keys as active conventions. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#span-attributes-follow-the-current-conventions]
- tracePropagationTargets matching becomes case-insensitive; global/sticky regex flags are ignored to avoid stateful alternating matches. This is separate from CORS origin authorization. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#trace-propagation-matching-is-case-insensitive]

### Runtime and browser ownership

- Sentry no longer takes over an existing OpenTelemetry setup. Node's enableOpenTelemetrySetup defaults false; keep it false when managing your own provider. node-core merged into node; the old node-core/light and otlpIntegration recipes in [NODE-RUNTIMES-AND-DELIVERY.md](NODE-RUNTIMES-AND-DELIVERY.md#otlp-path-for-opentelemetry-first-projects) are v10 source routes, not v11 installation instructions. Exact v11 provider wiring must come from the current platform guide, not an invented conversion. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#package-changes; https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#enableOpenTelemetrySetup]
- Runtime instrumentation uses diagnostics channels; v10 module-patching/preload explanations need their version boundary. Browser-only AI integrations are removed; AI instrumentation belongs to server SDKs. GenAI spans are always streamed/untruncated, so enableTruncation/streamGenAiSpans are removed. Provider helpers moved out of core; platform SDK exports remain the preferred route. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#ai-integrations]
- Browser console breadcrumbs come from consoleIntegration; breadcrumbsIntegration.console is removed. userTimingIntegration owns mark/measure, interactionsIntegration owns interactions, and fetchStreamPerformanceIntegration owns fetch stream tracing. BrowserTracing still owns pageload/navigation timeouts and now adds WebVitals. enableInp is deprecated; webVitals.ignore controls vitals. Soft-navigation/bfcache collection has new defaults; use the full guide before changing existing dashboards. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#browser-integrations]
- Scope.clear is removed; use a fresh scope or reinitialize. inboundFiltersIntegration is renamed eventFiltersIntegration/EventFilters; @sentry/types is no longer published. core isomorphic/server/browser entrypoints split; platform SDK reexports remain. Legacy transaction profiling is removed; choose profileSessionSampleRate plus manual/trace lifecycle. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#removed-apis; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#renames]
- Svelte, Vue, Angular, Ember, Nuxt and native-only branches in the full upstream migration are skipped under the selected-stack rule. Keep framework-specific React/Next/Node/Nest/Cloudflare/Bun/Deno changes scoped to the platform actually used. [user standing rules; https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

## Pitfalls

| Pitfall | Fix |
|---|---|
| `@sentry/*` packages on different versions | Bump them together with the bulk commands |
| Type errors missing because TypeScript is too old | Check the target SDK's minimum TypeScript (5.0.4+ for v9) |
| Build passes, runtime errors | Test with real requests and errors |
| Source maps broken after the upgrade | Check the changed `sourcemaps` options |
| Node SDK not capturing server errors | Initialize early: the first import in v8+ |
| Next.js missing server-side errors | Check `instrumentation.ts` exists and is configured |

## Prove it

- **One version:** every `@sentry/*` entry in `package.json` and `node_modules` shows the same version.
- **No leftovers:** the "Find what's left" greps for each hop you crossed return nothing.
- **It compiles and builds:** `npx tsc --noEmit` and `npm run build` succeed, and tests pass. For Next.js, both `next dev` and `next build` work and the build output shows source maps uploaded.
- **Events still arrive:** add a temporary error, see it in Sentry, then delete it. On the server, trigger a real request that fails.

```js
// Add temporarily to verify Sentry is working after upgrade
setTimeout(() => {
  throw new Error('Sentry upgrade verification - safe to delete');
}, 3000);
```

- **Behavior changes checked by hand** (v9): sampling still matches what you expect (`tracesSampler` now sees root spans only), the Express user is still set (`Sentry.setUser()`), and the browser SDK asks the backend to infer IP only with `sendDefaultPii: true`.
