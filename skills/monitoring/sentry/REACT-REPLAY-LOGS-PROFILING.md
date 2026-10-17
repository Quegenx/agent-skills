# React Replay, Logs and Profiling

Three browser features beyond errors and traces in `@sentry/react`: Session Replay (a DOM recording, masked by default, sampled at init), structured logs (`Sentry.logger`, off until `enableLogs: true`) and browser profiling (Beta, Chromium only, silent without the `Document-Policy: js-profiling` header). Each one fails quietly when its switch is missing: sample rates of `0`, a missing CSP `blob:` entry, `enableLogs` unset, or the header absent. Setup is in [REACT.md](REACT.md); tracing, which logs and profiles link to, in [REACT-TRACING.md](REACT-TRACING.md).

**Contents:** [Versions](#versions) · [Replay: where it runs](#replay-where-it-runs) · [Replay sampling](#replay-sampling) · [replayIntegration options](#replayintegration-options) · [Replay privacy](#replay-privacy) · [Network recording](#network-recording) · [Canvas](#canvas) · [Lazy loading and manual control](#lazy-loading-and-manual-control) · [Sessions, clicks and overhead](#sessions-clicks-and-overhead) · [CSP for Replay](#csp-for-replay) · [Logs](#logs) · [Profiling](#profiling) · [Debugging](#debugging) · [Prove it](#prove-it)

## Versions

| Feature | Minimum |
|---|---|
| Session Replay | `@sentry/react` ≥7.27.0 |
| `beforeAddRecordingEvent` | 7.53.0 |
| `replayCanvasIntegration()` | ≥7.98.0 |
| Vite plugin `bundleSizeOptimizations.excludeReplayWorker` | Sentry Vite Plugin v2.10.0+ |
| `Sentry.logger` API, `enableLogs` | ≥9.41.0 |
| `consoleLoggingIntegration()` | ≥10.13.0 per the logging reference; the integrations table says 9.41.0 |
| Scope-based log attributes | ≥10.32.0 |
| `browserProfilingIntegration()` | ≥10.27.0 (Beta) |

## Replay: where it runs

- **Browser only.** Never add `replayIntegration()` to SSR entry points, Node.js server code, Web or Service Workers, Next.js `_document.tsx` or server `instrumentation.ts`, the Electron main process, browser extensions or CI. In the Next.js App Router it goes only in `instrumentation-client.ts` or `sentry.client.config.ts`.
- **Bundled in `@sentry/react`;** no separate package. It adds about 50 KB gzipped.

## Replay sampling

- **Rates live in `Sentry.init()`, not inside `replayIntegration()`.** `replaysSessionSampleRate` and `replaysOnErrorSampleRate` both default to `0` per the Replay reference (the setup options table leaves the default blank).
- **How a session is decided:** if the session is sampled, it records continuously. Otherwise the SDK buffers the last 60 s in memory; on an error it rolls `replaysOnErrorSampleRate`, and on a hit uploads the 60 s buffer and keeps recording, on a miss discards it.

| Strategy | Session | On error | Use when |
|---|---|---|---|
| Errors-only | 0 | 1.0 | Privacy-first; the most common production choice (near-zero overhead, buffer about 2 to 5 MB RAM) |
| Balanced | 0.1 | 1.0 | Most production apps |
| Full | 1.0 | 1.0 | Dev, low traffic |
| High-traffic | 0.01 | 1.0 | 100k+ sessions a day |

- **Cutting cost:** lower `replaysSessionSampleRate`, keep `replaysOnErrorSampleRate: 1.0`.

## replayIntegration options

| Group | Option | Default |
|---|---|---|
| Session | `stickySession` | `true` (sessionStorage; closing the tab ends the session) |
| | `minReplayDuration` | `5000` (max 15000) |
| | `maxReplayDuration` | `3600000` (1 hour; server-enforced ceiling, then a new re-sampled session) |
| Privacy | `maskAllText` / `maskAllInputs` / `blockAllMedia` | `true` |
| | `mask` | `['.sentry-mask', '[data-sentry-mask]']` |
| | `unmask` | `[]` |
| | `block` | `['.sentry-block', '[data-sentry-block]']` |
| | `unblock` | `[]` |
| | `ignore` | `['.sentry-ignore', '[data-sentry-ignore]']` |
| | `maskFn` | `(text) => '*'.repeat(text.length)` |
| Network | `networkDetailAllowUrls` | `[]` |
| | `networkDetailDenyUrls` | `[]` (takes precedence) |
| | `networkCaptureBodies` | `true` |
| | `networkRequestHeaders` / `networkResponseHeaders` | `[]` |
| DOM protection | `mutationLimit` | `10000` (recording stops) |
| | `mutationBreadcrumbLimit` | `750` (warning breadcrumb) |
| | `slowClickIgnoreSelectors` | `[]` |
| Advanced | `beforeAddRecordingEvent`, `beforeErrorSampling`, `workerUrl` | none |
| | `useCompression` | `true` (in a Web Worker) |

## Replay privacy

- **Defaults are maximum privacy:** all text masked (length-preserving `*`), all input values masked, `<img>`, `<video>`, `<audio>`, `<svg>`, `<picture>`, `<embed>`, `<map>`, `<object>` blocked, network bodies not captured, headers beyond Content-Type, Content-Length and Accept not captured.
- **Three primitives:** Mask (text becomes `*`, layout kept), Block (an opaque box of the same size), Ignore (suppresses input events; the element stays visible).
- **Attributes:** `data-sentry-mask`, `data-sentry-unmask`, `data-sentry-block`, `data-sentry-unblock`, `data-sentry-ignore`, with class equivalents (`sentry-mask` and so on). In v8 the `data-sentry-*` attributes are in the default selector lists; the class forms must be listed explicitly.
- **v7 to v8:** `unmask` defaulted to `['.sentry-unmask', '[data-sentry-unmask]']` and is now `[]`; `unblock` likewise (restore with `['.sentry-unblock', '[data-sentry-unblock]']`).
- **Masking works on the rendered DOM** through `MutationObserver` and cascades to children; a child's `unmask` / `unblock` overrides the parent.
- **Three modes:** max privacy (the defaults); selective (`maskAllText: false, blockAllMedia: false, maskAllInputs: true, mask: [...], block: [...]`); allowlist (mask everything, then `unmask` / `unblock` approved elements).
- **`srcdoc` iframes bypass masking:** add `block: ['iframe[srcdoc]']`.
- **Scrub URLs in replay metadata:** `Sentry.addEventProcessor((event) => { if (event.type !== 'replay_event') return event; ... event.urls = event.urls?.map(scrub); return event; })`.
- **`beforeAddRecordingEvent`** returns `null` to drop an event, e.g. drop `event.data.tag === 'breadcrumb'` with `payload.category === 'console'`, or keep `performanceSpan` `resource.fetch` / `resource.xhr` only with status ≥400.

## Network recording

- **Captured by default:** URL, method, status, request and response body size. Not body content or custom headers.
- **Allowlist only your own APIs** in `networkDetailAllowUrls`; never third-party payment processors, auth providers or analytics. Never capture `Authorization`, `Cookie` or `Set-Cookie`.
- **Body formats captured:** `application/json`, XML, `text/plain`, `multipart/form-data` text fields; not binary, file uploads, blobs or streams. Bodies are truncated at 150,000 characters, not configurable.
- **Apollo Client:** an AbortController that aborts on unmount runs before Replay reads the response, so bodies come out empty. Don't abort on unmount; cancel at route level.

## Canvas

- **Not recorded by default.** Add `Sentry.replayCanvasIntegration()` (≥7.98.0). Canvas recordings have no PII scrubbing.
- **WebGL:** `replayCanvasIntegration({ enableManualSnapshot: true })`, then in the render loop `Sentry.getClient()?.getIntegrationByName('ReplayCanvas')?.snapshot(canvas)`. `preserveDrawingBuffer` can degrade performance. **WebGPU:** `snapshot(canvasRef, { skipRequestAnimationFrame: true })`.
- **Cross-origin canvas throws `SecurityError` (tainted):** add `crossOrigin="anonymous"` and a CDN `Access-Control-Allow-Origin`.

## Lazy loading and manual control

- **Lazy load:** `const replayIntegration = await Sentry.lazyLoadIntegration('replayIntegration'); Sentry.addIntegration(replayIntegration({...}))`, or `const { replayIntegration } = await import('@sentry/react')`. Trade-off: errors and sessions before the load aren't captured. One reference presents `lazyLoadIntegration()` as a CDN feature for the Sentry Loader Script (its dynamic-import example imports from `"@sentry/browser"`); the Replay reference uses it in an npm setup.
- **Lazy-loadable integrations:** `replayIntegration`, `replayCanvasIntegration`, `feedbackIntegration`, `feedbackModalIntegration`, `feedbackScreenshotIntegration`, `captureConsoleIntegration`, `contextLinesIntegration`, `linkedErrorsIntegration`, `dedupeIntegration`, `extraErrorDataIntegration`, `httpClientIntegration`, `reportingObserverIntegration`, `rewriteFramesIntegration`, `browserProfilingIntegration` (the profiling reference says `browserProfilingIntegration` is not in the CDN loader bundle).
- **Manual control** with both rates at 0: `const replay = Sentry.getReplay(); replay.start(); replay.startBuffering(); await replay.stop(); await replay.flush(); replay.getReplayId();`. Replay URL: `https://YOUR-ORG.sentry.io/replays/${replayId}/`.
- **Deferred init from feature flags:** set `replaysSessionSampleRate` / `replaysOnErrorSampleRate` on `client.getOptions()`, then `client.addIntegration(Sentry.replayIntegration(...))`.
- **Route-based:** a `ReplayController` component using `useLocation` calls `replay.start()` on `/checkout` and `replay.stop()` elsewhere.
- **`beforeErrorSampling(event)`:** buffer mode only; return `false` so an error doesn't trigger a replay (e.g. `event.logger === 'console'` with `captureConsoleIntegration`).
- **Self-host the worker with `workerUrl`:** copy it from `node_modules/@sentry/replay/build/npm/esm/worker/` and serve it from your origin, or use the Vite plugin's `bundleSizeOptimizations: { excludeReplayWorker: true }`. The worker is compatible within the same major SDK version.

## Sessions, clicks and overhead

- **A session is one recording with a `replayId`;** segments are its chunks. It ends after 15+ minutes inactive (interaction means a mouse click or a navigation) or when the tab closes.
- **On error in buffer mode:** capture, `beforeErrorSampling`, the dice roll, send about 60 s, continue in session mode; the error is linked by a `replayId` tag.
- **Dead clicks** (no DOM response) and **rage clicks** (3+ clicks within 7 seconds) are detected. Exclude with `slowClickIgnoreSelectors`, e.g. `'a[download]'`, `'.copy-to-clipboard'`.
- **Overhead:** MutationObserver low; compression off the main thread; network interception low; 2D canvas moderate; WebGL with `preserveDrawingBuffer` high; a high DOM mutation rate high.
- **Hitting `mutationLimit`:** fix the cause. Virtualize lists (react-virtual, react-window, TanStack Virtual), paginate, use CSS animations, batch updates.

## CSP for Replay

- **Without the right CSP, Replay fails silently.** Required: `worker-src 'self' blob:;` and `child-src 'self' blob:;` (Safari ≤15.4). With `workerUrl`: `worker-src 'self'; child-src 'self';`. With a tunnel: `connect-src 'self';`, otherwise `connect-src 'self' https://o<ORG_ID>.ingest.sentry.io;`.

## Logs

- **npm only:** not available through the CDN or Loader snippet.
- **`enableLogs: true` is required.** Without it every `Sentry.logger.*` call is a no-op and `beforeSendLog` never fires.
- **Six levels:** `Sentry.logger.trace/debug/info/warn/error/fatal(message, attributes?)`. Attribute values are `string`, `number` or `boolean` only; `undefined`, arrays and objects are rejected.
- **`Sentry.logger.fmt` must be a tagged template.** It produces `message.template: "User %s purchased %s for $%s"` and `message.parameter.0..N`, each searchable. `Sentry.logger.fmt("text")` produces no parameters.

```typescript
Sentry.logger.info(
  Sentry.logger.fmt`User ${userId} purchased ${productName} for $${amount}`
);
```

- **Forward console calls:** `Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })`; extra arguments become `message.parameter.N`. `console.log` and `console.info` map to info, `console.warn` to warn, `console.error` to error, `console.debug` to debug, a failing `console.assert` to error.
- **`beforeSendLog: (log) => ...`** returns `null` to drop. The log has `level`, `message`, `timestamp`, `attributes`. Typical: drop `debug` / `trace`, delete `password`, redact `credit_card`, drop messages containing `/health`.
- **Scope attributes (≥10.32.0), string, number or boolean only:** `Sentry.getGlobalScope().setAttributes({...})` (page lifetime), `Sentry.getIsolationScope().setAttributes({...})` (after auth), `Sentry.withScope((scope) => { scope.setAttribute(...); Sentry.logger.info(...) })`.
- **Automatic attributes:** `sentry.environment`, `sentry.release`, `sentry.sdk.name` (e.g. `"sentry.javascript.react"`), `sentry.sdk.version`, `browser.name`, `browser.version`, `user.id` / `user.name` / `user.email` (when `Sentry.setUser()` was called; `userInfo` defaults to true), `sentry.trace.parent_span_id`, `sentry.replay_id`, `message.template`, `message.parameter.N`.
- **Log-to-trace correlation:** a log emitted inside an active span gets `sentry.trace.parent_span_id`. Needs `browserTracingIntegration()` and `tracesSampleRate` > 0.
- **Prefer wide events:** one comprehensive log with all the context over many fragmented ones.

| Situation | Use |
|---|---|
| Business event | `logger.info(msg, attrs)` |
| Message with embedded values | `logger.fmt` |
| Unexpected exception | `captureException` |
| Informational string event | `captureMessage(msg, "info")` |
| Existing console calls | `consoleLoggingIntegration` |

| Level | Production |
|---|---|
| `trace`, `debug` | Filter out |
| `info` | Keep (low or medium volume) |
| `warn` | Keep (low) |
| `error` | Keep (rare) |
| `fatal` | Keep (very rare) |

## Profiling

- **Status:** the profiling reference calls it Beta (breaking changes may occur), ≥10.27.0, and needs `Document-Policy: js-profiling`; the setup overview calls it experimental and says it needs cross-origin isolation headers.
- **What it records:** the JS Self-Profiling API (https://wicg.github.io/js-self-profiling/) gives call stacks, CPU time per function and flame graphs aggregated across real sessions, linked to traces. It samples at 100 Hz (10 ms), against Chrome DevTools' 1000 Hz (1 ms), so functions under 10 ms may not appear.
- **Chromium only (Chrome, Edge).** Firefox and Safari/iOS don't implement the API, so `browserProfilingIntegration()` silently does nothing there and the data is biased to Chromium users.
- **Every document response needs `Document-Policy: js-profiling`,** or profiling silently fails. GitHub Pages and some CDNs can't set custom headers, so no profiling there.

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Document-Policy", "value": "js-profiling" }]
    }
  ]
}
```

**Netlify (`netlify.toml`):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Document-Policy = "js-profiling"
```

**Netlify (`_headers` file):**
```
/*
  Document-Policy: js-profiling
```

**Express / Node.js:**
```javascript
app.use((req, res, next) => {
  res.set("Document-Policy", "js-profiling");
  next();
});
```

**Nginx (`nginx.conf`):**
```nginx
server {
  location / {
    add_header Document-Policy "js-profiling";
  }
}
```

**Apache (`.htaccess`):**
```apache
<IfModule mod_headers.c>
  Header set Document-Policy "js-profiling"
</IfModule>
```

**AWS CloudFront (Viewer Response function):**
```javascript
function handler(event) {
  var response = event.response;
  response.headers["document-policy"] = { value: "js-profiling" };
  return response;
}
```

- **Trace mode (recommended):**

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  integrations: [
    Sentry.browserTracingIntegration(), // Must come BEFORE browserProfilingIntegration
    Sentry.browserProfilingIntegration(),
  ],

  // Tracing: profiles are only collected when a transaction is also sampled
  tracesSampleRate: 1.0,

  // Profiling: fraction of sessions to profile
  profileSessionSampleRate: 1.0,

  // "trace" = automatically attach profiles to all active spans
  profileLifecycle: "trace",
});
```

- **Manual mode:** omit `profileLifecycle` (the default) and wrap specific flows (checkout, a render) in `Sentry.uiProfiler.startProfiler()` / `Sentry.uiProfiler.stopProfiler()`.
- **Sampling compounds:** a profile needs both the trace and the session sampled; `tracesSampleRate: 0.5` with `profileSessionSampleRate: 0.5` profiles about 25%.
- **Not in the CDN loader bundle:** `browserProfilingIntegration` is not available there.
- **Upload source maps,** or functions show as `e`, `t`, `r` (e.g. Vite with `sourcemaps: { filesToDeleteAfterUpload: ["./**/*.map"] }`, see [REACT.md](REACT.md#source-maps)).
- **DevTools conflict:** with the integration active, DevTools profiles show its overhead mixed into rendering. Disable it during local DevTools sessions.

## Debugging

| Symptom | Cause | Fix |
|---|---|---|
| No replays at all | CSP blocks the Web Worker blob URL | Add `worker-src 'self' blob:` and `child-src 'self' blob:` to the CSP |
| No replays | `replayIntegration()` not in init | Confirm it is in the `integrations` array in `Sentry.init()` |
| No replays | Both sample rates are `0` | Set `replaysSessionSampleRate: 0.1` or `replaysOnErrorSampleRate: 1.0` |
| No replays | SDK too old | Upgrade to `@sentry/react` ≥7.27.0 |
| No replays | Running in an SSR or Node context | Keep `replayIntegration()` in browser-side init only |
| No replays | `minReplayDuration` too high | Lower it, or set `0` for debugging |
| All text shows as `***` | `maskAllText: true` (default) | Expected. Use `unmask` or `data-sentry-unmask` to reveal safe content |
| Replay cuts off early | `mutationLimit` exceeded | Increase the limit or virtualize lists; check for DOM thrash |
| Broken layout in replay | External CSS or fonts blocked by CORS | Add `sentry.io` to `Access-Control-Allow-Origin` on the CDN |
| Images missing in replay | External images blocked by CORS | Add `sentry.io` to the CDN CORS policy for image assets |
| Network bodies always empty | URL not in `networkDetailAllowUrls` | Add your API domain to the allowlist |
| Network bodies empty (Apollo) | AbortController cancels before Replay reads | Don't abort on component unmount; use route-level cancellation |
| Network body truncated | Over 150,000 characters | Expected; the limit is not configurable |
| Canvas not recording | Not added by default | Add `replayCanvasIntegration()` to `integrations` |
| Canvas `SecurityError` | Cross-origin media taints the canvas | Add `crossOrigin="anonymous"` to `<img>` / `<video>` and enable CORS on the CDN |
| WebGL canvas blank in replay | `preserveDrawingBuffer` not enabled | Use `enableManualSnapshot: true` on `replayCanvasIntegration()` |
| Rage or dead clicks on download buttons | The SDK detects clicks that don't mutate the DOM | Add the selector to `slowClickIgnoreSelectors` |
| Replays triggered by `console.error` | `captureConsoleIntegration` sends events | `beforeErrorSampling` returns `false` when `event.logger === 'console'` |
| Worker CSP error in console | CSP missing `blob:` in `worker-src` | Add `worker-src 'self' blob:` or use `workerUrl` with a self-hosted worker |
| High replay volume or storage cost | `replaysSessionSampleRate` too high | Lower it; keep `replaysOnErrorSampleRate: 1.0` for error coverage |
| Replay blocked by ad blockers | Direct requests to Sentry ingest | `tunnel: "/sentry-tunnel"` plus a server-side relay |

| Symptom | Fix |
|---|---|
| Logs not appearing | `enableLogs: true` in `Sentry.init()`; SDK ≥9.41.0 |
| `logger.fmt` not creating `message.parameter.*` | Use it as a tagged template, not `Sentry.logger.fmt("text", var)` |
| Logs not linked to traces | `browserTracingIntegration()` added and `tracesSampleRate` > 0; logs must be emitted inside an active span |
| `consoleLoggingIntegration` not available | Upgrade to `@sentry/react` ≥10.13.0 |
| Scope attributes not on logs | Upgrade to `@sentry/react` ≥10.32.0 |
| Too many logs | `beforeSendLog` drops `trace` and `debug` in production |
| Log attributes contain `undefined` | Only `string`, `number`, `boolean` are accepted; filter undefined values first |
| `beforeSendLog` not firing | `enableLogs: true`; without it no logs are sent and no hook is called |
| Sensitive data in logs | Filter in `beforeSendLog`; better, don't log sensitive data at the call site |
| Logs have no user context | `Sentry.setUser({ id, email })` after authentication (`userInfo` defaults to `true`) |
| No profiles | `Document-Policy: js-profiling` on document responses |
| Profiles show minified names | Source maps not uploaded: configure `sentryVitePlugin` or `sentryWebpackPlugin` |
| Profiles only from some users | Expected: only Chromium users are profiled; Firefox and Safari silently no-op |
| DevTools shows inflated rendering times | Disable `browserProfilingIntegration` during local DevTools sessions |
| `profileSessionSampleRate` has no effect | `browserProfilingIntegration()` listed after `browserTracingIntegration()` |
| Profiling on a static host not working | The host must support custom response headers; GitHub Pages and some CDNs do not |
| Profiles not linked to spans in Trace mode | `profileLifecycle: "trace"` and `tracesSampleRate` > 0 |

## Prove it

After setup, **Replays** shows a session recording after page interaction and **Logs** shows structured entries when logging is enabled. In the Sentry UI, open a trace and click **"Profile"** to see that transaction's flame graph.
