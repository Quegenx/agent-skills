# Browser

`@sentry/browser` monitors plain JavaScript pages: vanilla JS, jQuery, static sites, WordPress, Shopify, Squarespace, and any JS project without a framework SDK. It installs three ways (npm, the Loader Script, or a CDN bundle), and the install path decides most of what works: npm gets every feature, source maps and tree-shaking; the Loader needs no build but has no logs and only traces fetches made after it loads. This file covers choosing the SDK, the three setups, configuration, errors and user feedback. Tracing, Replay, logs and profiling are in [BROWSER-TRACING.md](BROWSER-TRACING.md). The APIs reflect `@sentry/browser` ≥10.0.0; verify against https://docs.sentry.io/platforms/javascript/ before implementing.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Check for a framework first](#check-for-a-framework-first) · [Versions](#versions) · [Pick the install path](#pick-the-install-path) · [Path A: npm](#path-a-npm) · [Path B: Loader Script](#path-b-loader-script) · [Path C: CDN bundles](#path-c-cdn-bundles) · [Source maps](#source-maps) · [Init options](#init-options) · [dataCollection](#datacollection) · [What is captured automatically](#what-is-captured-automatically) · [Capture APIs](JAVASCRIPT.md#capture-apis) · [Scopes and enrichment](JAVASCRIPT.md#scopes-and-enrichment) · [Breadcrumbs](JAVASCRIPT.md#breadcrumbs) · [Hooks and event processors](JAVASCRIPT.md#hooks-and-event-processors) · [Filtering and grouping](#filtering-and-grouping) · [Default integrations](#default-integrations) · [Transport, offline and tunnel](#transport-offline-and-tunnel) · [User feedback](#user-feedback) · [Debugging](#debugging) · [Prove it](#prove-it)

## Check for a framework first

Framework SDKs add router-aware transactions, error boundaries, component tracking and often SSR coverage. `@sentry/browser` in a React or Next.js app loses all of that.

```bash
cat package.json 2>/dev/null | grep -E '"react"'
cat package.json 2>/dev/null | grep '"next"'
cat package.json 2>/dev/null | grep -E '"@remix-run/react"|"@remix-run/node"'
cat package.json 2>/dev/null | grep -E '"express"|"fastify"|"@nestjs/core"|"koa"'
ls package.json 2>/dev/null
ls package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null
ls vite.config.ts vite.config.js webpack.config.js rollup.config.js esbuild.config.js 2>/dev/null
cat package.json 2>/dev/null | grep -E '"vite"|"webpack"|"rollup"|"esbuild"'
ls wp-config.php wp-content/ 2>/dev/null   # WordPress
ls _config.yml _config.yaml 2>/dev/null    # Jekyll
ls config.toml 2>/dev/null                 # Hugo
ls .eleventy.js 2>/dev/null                # Eleventy
cat package.json 2>/dev/null | grep '"@sentry/'
grep -r "sentry-cdn.com\|js.sentry-cdn.com" . --include="*.html" -l 2>/dev/null | head -3
```

| Found | Use |
|---|---|
| `next` | `@sentry/nextjs`: [../sentry/NEXTJS.md](NEXTJS.md). Don't use the browser SDK |
| `react` without Next.js | `@sentry/react`: [REACT.md](REACT.md) |
| `@remix-run` | `@sentry/remix` (https://docs.sentry.io/platforms/javascript/guides/remix/) |
| `express`, `fastify`, `@nestjs/core` | A Node.js server: [../sentry/NODE.md](NODE.md) |

- **Recommend, don't ask:** "I recommend setting up Error Monitoring + Tracing + Session Replay using Path A (npm). Want me to also add Logging or User Feedback?" Error Monitoring always (the baseline); Tracing always for interactive pages; Replay for user-facing apps, support flows and checkout pages; User Feedback optional (support-focused apps); Logging optional (npm or the CDN logs bundle, not the Loader; the same guide's recommendation table says "npm path only"); Profiling optional (Beta, Chromium only, needs `Document-Policy: js-profiling`).

## Versions

| Feature | Minimum `@sentry/browser` |
|---|---|
| Error monitoring, tracing | ≥7.0.0 |
| `makeBrowserOfflineTransport` | ≥7.48.0 |
| `feedbackIntegration()` | ≥7.85.0 |
| Feedback screenshots | ≥8.0.0 |
| `dataCollection` | v10.54+ |
| Self-hosted Sentry for feedback | ≥24.4.2 |

- **`linkedErrorsIntegration`'s cause chain** needs `Error.cause` (Chrome 93+, Firefox 91+).
- **`sendDefaultPii` is on its way out:** one setup guide says it "will be deprecated in v11", another says it is deprecated and removed in v11. Use `dataCollection`.
- **`configureScope is not a function`:** deprecated in SDK v8; use `getIsolationScope()` or `withScope()`.
- Tracing, Replay, logs and profiling versions are in [BROWSER-TRACING.md](BROWSER-TRACING.md#versions).

## Pick the install path

| Project | Path |
|---|---|
| `package.json` plus a bundler | **A: npm** (all features, source maps, tree-shaking) |
| WordPress, Shopify, static HTML, no npm | **B: Loader Script** (no build tooling, always up to date) |
| Script tags only, no Loader access | **C: CDN bundle** |

- **Already has `@sentry/browser`:** skip the install and go straight to feature config. A Vite, webpack, Rollup or esbuild build means a source maps plugin to configure.

## Path A: npm

- **Install:** `npm install @sentry/browser --save` (or `yarn add @sentry/browser`, `pnpm add @sentry/browser`).
- **Init before any other code runs:** `Sentry.init()` in its own `src/instrument.ts`, imported as the very first import of the entry file (`import "./instrument";  // ← MUST be first`).

```typescript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // Adjust per build tool (see table below)
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION, // inject at build time

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
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

| Build tool | Variable | Access |
|---|---|---|
| Vite | `VITE_SENTRY_DSN` | `import.meta.env.VITE_SENTRY_DSN` |
| Custom webpack, esbuild, Rollup | `SENTRY_DSN` | `process.env.SENTRY_DSN` |

## Path B: Loader Script

- **One `<script>` tag lazily loads the full SDK,** stays current through Sentry's CDN and buffers errors until the SDK loads. Find it in Sentry under Settings > Projects > (project) > SDK Setup > Loader Script. It must be the first script on every page.
- **Define `window.sentryOnLoad` before the loader tag.** The DSN is already in the loader URL.

```html
<script>
  window.sentryOnLoad = function () {
    Sentry.init({
      // DSN is already configured in the loader URL
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  };
</script>
<script
  src="https://js.sentry-cdn.com/YOUR_PUBLIC_KEY.min.js"
  crossorigin="anonymous"
></script>
```

| Mode | Loads the SDK |
|---|---|
| Lazy (default) | On the first error or manual Sentry call |
| Eager (`data-lazy="no"` on the script) | After all page scripts finish |
| Manual | When you call `Sentry.forceLoad()` |

- **Safe before the SDK loads (buffered):** `Sentry.captureException()`, `captureMessage()`, `captureEvent()`, `addBreadcrumb()`, `withScope()`. For anything else: `window.Sentry && Sentry.onLoad(function () { Sentry.setUser({ id: "123" }); });`.
- **Release:** `window.SENTRY_RELEASE = { id: "my-app@1.0.0" };`.
- **Limits:** no `Sentry.logger.*`; no framework features; tracing headers only on fetches made after the SDK loads; version changes take a few minutes to propagate through the CDN cache; put `defer` (not `async`) on all other scripts.
- **Lazy-load integrations:** `Sentry.lazyLoadIntegration("replayIntegration")` or `Sentry.lazyLoadIntegration("feedbackIntegration")`, then `.then(i => Sentry.addIntegration(i()))`, with a `.catch` for network errors.
- **CSP:** `script-src: https://browser.sentry-cdn.com https://js.sentry-cdn.com`, `connect-src: *.sentry.io`.

## Path C: CDN bundles

- **For synchronous loading without the Loader.** Put the bundle before all other scripts, with `crossorigin="anonymous"` and the integrity hash. Version `10.42.0`:

| Bundle (`https://browser.sentry-cdn.com/10.42.0/...`) | Contains | `integrity` |
|---|---|---|
| `bundle.min.js` | Errors | `sha384-L/HYBH2QCeLyXhcZ0hPTxWMnyMJburPJyVoBmRk4OoilqrOWq5kU4PNTLFYrCYPr` |
| `bundle.tracing.min.js` | + tracing | `sha384-DIqcfVcfIewrWiNWfVZcGWExO5v673hkkC5ixJnmAprAfJajpUDEAL35QgkOB5gw` |
| `bundle.replay.min.js` | + replay | `sha384-sbojwIJFpv9duIzsI9FRm87g7pB15s4QwJS1m1xMSOdV1CF3pwgrPPEu38Em7M9+` |
| `bundle.tracing.replay.min.js` | Recommended full setup | `sha384-oo2U4zsTxaHSPXJEnXtaQPeS4Z/qbTqoBL9xFgGxvjJHKQjIrB+VRlu97/iXBtzw` |
| `bundle.tracing.replay.feedback.min.js` | + feedback | `sha384-SmHU39Qs9cua0KLtq3A6gis1/cqM1nZ6fnGzlvWAPiwhBDO5SmwFQV65BBpJnB3n` |
| `bundle.tracing.replay.feedback.logs.metrics.min.js` | All features | `sha384-gOjSzRxwpXpy0FlT6lg/AVhagqrsUrOWUO7jm6TJwuZ9YVHtYK0MBA2hW2FGrIGl` |
| `bundle.logs.metrics.min.js` | Logs and Metrics | not given |
| `bundle.feedback.min.js` | Feedback only, the lightest | not given |

- **Init after the tag:**

```html
<script>
  Sentry.init({
    dsn: "https://YOUR_KEY@o0.ingest.sentry.io/YOUR_PROJECT",
    environment: "production",
    release: "my-app@1.0.0",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ["localhost", /^https:\/\/yourapi\.io/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
</script>
```

- **Logging needs a bundle with `.logs.` in its name.**
- **CSP** is the same as for the Loader: `script-src: https://browser.sentry-cdn.com https://js.sentry-cdn.com`, `connect-src: *.sentry.io`.

## Source maps

Without source maps, stack traces show minified code. The general upload and release story is in [../sentry/RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

- **There is no browser wizard** (`npx @sentry/wizard -i browser` doesn't exist). `npx @sentry/wizard@latest -i sourcemaps` configures source map upload only, for an SDK that's already initialized.

| Bundler | Source map setting | Plugin |
|---|---|---|
| Vite | `build: { sourcemap: "hidden" }` | `sentryVitePlugin` from `@sentry/vite-plugin`, last in the plugin list |
| webpack | `devtool: "hidden-source-map"` | `sentryWebpackPlugin` from `@sentry/webpack-plugin` |
| Rollup | `output: { sourcemap: "hidden" }` | `sentryRollupPlugin` from `@sentry/rollup-plugin` |
| esbuild | `sourcemap: "external"` | `sentryEsbuildPlugin` from `@sentry/esbuild-plugin`; doesn't fully support `splitting: true`, so use `sentry-cli` with code splitting |

- **Plugins read** `org`, `project` and `authToken` from `process.env.SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, kept in an uncommitted `.env`: `SENTRY_AUTH_TOKEN=sntrys_...`, `SENTRY_ORG=my-org-slug`, `SENTRY_PROJECT=my-project-slug`.
- **Any toolchain or CI:**

```bash
npx @sentry/cli sourcemaps inject ./dist
npx @sentry/cli sourcemaps upload ./dist
```

- **Upload before errors occur:** make it part of CI/CD, build in production mode (`npm run build`) and verify `SENTRY_AUTH_TOKEN`.

The old source used esbuild `sourcemap: "hidden"`; esbuild supports external for a separate map without a sourceMappingURL comment. Rollup/Vite hidden modes remain valid. [https://esbuild.github.io/api/#sourcemap; https://rollupjs.org/configuration-options/#output-sourcemap]

## Init options

Use [JAVASCRIPT.md](JAVASCRIPT.md#core-sdk-options) for shared option defaults, privacy and hooks; tracing, Replay and sampling keep their dedicated owners. The rows below retain browser-install-specific options from the SDK 10 source. [getsentry/sentry-for-ai, sentry-browser-sdk and sentry-react-sdk]

| Option | Default | Notes |
|---|---|---|
| `spotlight` | `false` | `boolean\|string`; forwards events to the Spotlight local dev overlay |
| `cdnBaseUrl` | | Base URL for lazy-loading integrations |
| `skipBrowserExtensionCheck` | `false` | |

## dataCollection

- **Privacy:** Use the [canonical JavaScript privacy schema and version distinction](JAVASCRIPT.md#datacollection). The old source applied omitted-object fallback semantics without the required SDK version boundary. [https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection]

```typescript
Sentry.init({
  dsn: "...",
  dataCollection: {
    userInfo: true,
    cookies: { deny: ["session_id", "auth_token"] },
    httpHeaders: {
      request: { deny: ["authorization", "cookie"] },
      response: true,
    },
    urlQueryParams: { allow: ["utm_source", "utm_campaign"] },
  },
});
```

## What is captured automatically

- **Uncaught exceptions and unhandled rejections:** `window.onerror` and `window.onunhandledrejection` through `globalHandlersIntegration` (on by default).
- **Errors in `setTimeout`, `setInterval`, `requestAnimationFrame`, `addEventListener`:** `browserApiErrorsIntegration` (on by default) patches them.
- **Console errors:** only with the opt-in `captureConsoleIntegration`.
- **Capture these yourself:** errors caught in your own try/catch, business-logic failures, `.then()` chains with a `.catch()`, and conditions that aren't exceptions (`captureMessage`).

## Capture APIs

Use the shared capture apis guidance in [JAVASCRIPT.md](JAVASCRIPT.md#capture-apis). [getsentry/sentry-for-ai, SDK references]

## Scopes and enrichment

Use the shared scopes and enrichment guidance in [JAVASCRIPT.md](JAVASCRIPT.md#scopes-and-enrichment). [getsentry/sentry-for-ai, SDK references]

## Breadcrumbs

Use the shared breadcrumbs guidance in [JAVASCRIPT.md](JAVASCRIPT.md#breadcrumbs). [getsentry/sentry-for-ai, SDK references]

## Hooks and event processors

Use the shared hooks and event processors guidance in [JAVASCRIPT.md](JAVASCRIPT.md#hooks-and-event-processors). [getsentry/sentry-for-ai, SDK references]

## Filtering and grouping

- **`ignoreErrors`:** strings (partial match) and regexes, e.g. `"ResizeObserver loop limit exceeded"`, `"fb_xd_fragment"`, `"Non-Error exception captured"`, `/^Network Error$/`, `/ChunkLoadError/`, `/Loading chunk \d+ failed/`, `/^Script error\.?$/`.
- **`allowUrls` / `denyUrls` match stack frame URLs, not the page URL,** e.g. `denyUrls`: `/extensions\//i`, `/^chrome:\/\//i`, `/^moz-extension:\/\//i`, `/^safari-extension:\/\//i`, `/ads\.doubleclick\.net/`. For extension noise, `denyUrls: [/chrome-extension:\/\//]`.
- **"Script error."** is a cross-origin script without CORS headers: add CORS headers or use `allowUrls`.
- **Fingerprints:** `["{{ default }}", err.functionName, String(err.errorCode)]` extends default grouping (prefer this); leaving `{{ default }}` out replaces it, e.g. `["network-timeout"]` or `["chunk-load-failure"]` for `ChunkLoadError`. Variables: `{{ default }}`, `{{ transaction }}`, `{{ function }}`, `{{ type }}`, `{{ module }}`, `{{ value }}`.
- **Volume:** filter early with `ignoreErrors` and `denyUrls`; lower `sampleRate` and `tracesSampleRate` from 1.0.

## Default integrations

| Integration | Does | Options |
|---|---|---|
| `breadcrumbsIntegration` | Breadcrumbs from console, DOM, fetch, XHR, history | `console`, `dom`, `fetch`, `history`, `xhr` |
| `browserApiErrorsIntegration` | Wraps `setTimeout`, `setInterval`, `requestAnimationFrame`, `addEventListener` in try/catch | `setTimeout`, `setInterval`, `requestAnimationFrame`, `eventTarget` |
| `browserSessionIntegration` | Release health (session per page load or route change) | `lifecycle: "route" \| "page"` |
| `dedupeIntegration` | Prevents duplicate events from rapid-succession throws | |
| `functionToStringIntegration` | Preserves original function names in wrapped stack traces | |
| `globalHandlersIntegration` | `onerror`, `onunhandledrejection` | `onerror`, `onunhandledrejection` |
| `httpContextIntegration` | Page URL, User-Agent, Referer | |
| `inboundFiltersIntegration` | `ignoreErrors`, `denyUrls`, `allowUrls` | |
| `linkedErrorsIntegration` | Cause chains | `key: "cause"`, `limit: 5` |

- **Remove by name:** `integrations: (defaults) => defaults.filter((i) => i.name !== "Breadcrumbs")`. **Reconfigure:** `Sentry.linkedErrorsIntegration({ limit: 10 })`, `Sentry.globalHandlersIntegration({ onunhandledrejection: false })`, `Sentry.browserSessionIntegration({ lifecycle: "page" })`. `defaultIntegrations: false` starts from scratch.
- **Add after init:** `Sentry.addIntegration(Sentry.reportingObserverIntegration())`, or dynamically: `const { captureConsoleIntegration } = await import("@sentry/browser"); Sentry.addIntegration(captureConsoleIntegration({ levels: ["error", "warn"] }));`.

## Transport, offline and tunnel

- **Default:** a fetch-based transport that POSTs to ingest.
- **Offline queue (IndexedDB):** `transport: makeBrowserOfflineTransport(makeFetchTransport)`, both from `@sentry/browser` (≥7.48.0).
- **Ad blockers:** `tunnel: "https://myapp.com/sentry-tunnel"` (or `"/sentry-tunnel"`) plus a server-side relay endpoint; the DSN is still required for header generation. See https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers.
- **Custom transport:** `createTransport(options, makeRequest)` from `@sentry/core`; `makeRequest` returns `{ statusCode, headers: { "x-sentry-rate-limits", "retry-after" } }` and uses `referrerPolicy: "origin"`.

## User feedback

| Approach | Use |
|---|---|
| `feedbackIntegration()` | A widget; needs no error |
| `captureFeedback()` | Programmatic, for your own UI |
| `showReportDialog()` | The crash modal after an error |

- **Widget:** `Sentry.feedbackIntegration({ colorScheme: "system" })` shows a "Report a Bug" button bottom-right; clicking it opens a modal form. Use it for proactive collection: a persistent button catches issues that never throw. The widget and the crash modal can be used together.

| Option | Default |
|---|---|
| `colorScheme` | `'system'` (`'light'`, `'dark'` or `'system'`) |
| `triggerLabel` | `"Report a Bug"` |
| `submitButtonLabel` | `"Send Bug Report"` |
| `cancelButtonLabel` | `"Cancel"` |
| `formTitle` | `"Report a Bug"` |
| `showBranding` ("Powered by Sentry") / `showName` / `showEmail` | `true` |
| `isNameRequired` / `isEmailRequired` | `false` |
| `namePlaceholder` | `"Your Name"` |
| `emailPlaceholder` | `"your.email@example.org"` |
| `messagePlaceholder` | `"What's the bug? ..."` |
| `position` | `'bottom-right'` (or `bottom-left`, `top-right`, `top-left`) |
| `autoInject` | `true` |
| `enableScreenshot` | `true` (≥8.0.0) |
| `tags` | `{}` |

- **Feedback labels:** use the typed `triggerLabel`/`triggerAriaLabel`. The source and one official example used `buttonLabel`, but the current SDK type declares `triggerLabel`; preserve the typed form. [https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/types/feedback/config.ts]
- **Pre-fill:** `Sentry.setUser({ email, name })`.
- **Your own button:** use the [canonical manual feedback workflow](REACT.md#user-feedback). The old source used `Sentry.getFeedback()?.openDialog()` rather than the documented attachTo or createForm/appendToDom/open API. [https://docs.sentry.io/platforms/javascript/user-feedback/configuration/]
- **`captureFeedback`:** `Sentry.captureFeedback({ name?, email?, message, associatedEventId? }, { captureContext: { tags }, attachments: [{ filename, data: Uint8Array }] })`; only `message` is required. Link to an error with `associatedEventId` set to the return value of `Sentry.captureException(err)` or `Sentry.lastEventId()`.
- **`showReportDialog`:** collects name, email and a description, paired with the captured error event. Options `eventId` (required), `user.name`, `user.email`, `lang` (e.g. `"de"`, `"fr"`), `title`, `subtitle`, `subtitle2`, `labelSubmit`. Call it from `beforeSend` when `event.exception && event.event_id`, on a 500 page with the server-side event id (the primary use case), or after a manual `captureException`.
- **Screenshots** are hidden on mobile and count against the attachment quota (1 GB standard).
- **With Replay,** feedback links to the replay: the SDK buffers up to 30 seconds when the widget opens, and needs `replaysOnErrorSampleRate > 0`.

**Logs defaults:** Use the [versioned JavaScript Logs rule](SIGNALS-PRACTICE.md#logs); the old source incorrectly described every version as opt-in. [https://docs.sentry.io/platforms/javascript/logs/]

## Debugging

| Symptom | Fix |
|---|---|
| Events missing | `debug: true`, check the DSN |
| Events sent twice | Only the first `Sentry.init()` takes effect; look for duplicate SDK instances |
| Tags don't appear | A built-in tag of the same name overwrote them |
| "Script error." | Cross-origin script without CORS headers |
| Minified traces | `npx @sentry/wizard@latest -i sourcemaps`; upload in CI before errors occur |
| Loader not firing | It must be the first `<script>`; look for CSP errors |
| `sentryOnLoad` not called | It wasn't defined before the loader tag |
| Early fetches not traced (Loader) | Fetches before the SDK loads aren't traced; wrap early calls in `Sentry.onLoad()` |
| CDN bundle not found | Check the version at https://browser.sentry-cdn.com/ |
| SRI integrity error | Re-copy the full tag including `integrity` |
| `ResizeObserver loop` floods issues | Add `"ResizeObserver loop limit exceeded"` to `ignoreErrors` |
| `beforeSend` returns `null` but events still sent | Those are transactions: `beforeSendTransaction` is a separate hook |
| User context missing | Call `Sentry.setUser()` after authentication completes, not before |
| Unhandled rejections not captured | Check `globalHandlersIntegration({ onunhandledrejection: true })` is active (it is by default) |
| No cause chain from `linkedErrorsIntegration` | Needs `Error.cause` (Chrome 93+, Firefox 91+) and SDK ≥7.0.0 |
| Feedback widget doesn't appear | `feedbackIntegration()` in `integrations` and SDK ≥7.85.0 |
| Feedback form won't submit | Check the DSN and the network tab |
| Feedback screenshots missing | SDK ≥8.0.0 and `enableScreenshot` not `false` |
| Crash modal doesn't appear | `showReportDialog` needs a valid `eventId`; check the `beforeSend` hook runs |
| Feedback form not pre-filled | Call `Sentry.setUser({ name, email })` before the widget opens |
| Replay not linked to feedback | `replaysOnErrorSampleRate > 0`; replay must be active when feedback is submitted |
| Feedback missing | Check the attachment quota; self-hosted needs ≥24.4.2 |
| Ad blockers drop events | `tunnel` plus a relay endpoint |

Shared habits are in [../sentry/PRACTICES.md](PRACTICES.md).

## Prove it

Add a temporary `<button onclick="throw new Error('Sentry Browser Test Error')">`, click it, and run `Sentry.captureException(new Error("Manual test"))`, `Sentry.captureMessage("Manual test message", "info")` and (npm path) `Sentry.startSpan({ name: "Test Span", op: "test" }, () => {})`. In Sentry: Issues shows the error within seconds, Traces shows the page load transaction, Replays shows a recording after page interaction, and Logs shows entries if logging is enabled (npm or the CDN logs bundle). If nothing appears, set `debug: true` and check the browser console.
