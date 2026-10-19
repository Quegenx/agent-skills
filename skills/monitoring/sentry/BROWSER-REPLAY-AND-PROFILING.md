# Browser Replay and profiling

Shared web Session Replay and browser profiling for plain JavaScript, React and Next.js from Sentry's SDK references and official docs. Keep framework initialization, bundler switches and router setup in their platform files. Native Replay and profiling retain their distinct APIs in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md) and [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md). [getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Session Replay](#session-replay) · [Replay privacy](#replay-privacy) · [Replay manual control](#replay-manual-control) · [Browser source qualifiers](#browser-source-qualifiers) · [Profiling](#profiling) · [Debugging](#debugging) · [Prove it](#prove-it)

## Session Replay

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

- **Web replay is not video.** It is built with rrweb from DOM snapshots, so the player lets you inspect the DOM. Mobile replay takes a view-hierarchy snapshot plus a screenshot once per second, compressed into video segments, and redaction draws blocks in the control's predominant color.
- **The default SDK masks all DOM text, images and user input.** The replay integration ships in the browser and framework npm packages (minimum SDK `7.27.0`; Node 12+; browsers newer than IE11). CDN bundles: `https://browser.sentry-cdn.com/11.8.0/bundle.tracing.replay.min.js` (recommended for replay, errors and tracing) or `bundle.replay.min.js`.

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});
```

- **Both rates default to `0`** in the options table; the Loader Script enables Replay with `replaysSessionSampleRate: 0.1` and `replaysOnErrorSampleRate: 1`. The recommended default `0.1` / `1.0` "captures 10% of sessions in full, plus every error from the remaining 90%".
- **Keep `replaysOnErrorSampleRate` at `1.0`:** "error sessions provide the most debugging value." Test with `replaysSessionSampleRate: 1.0`, then lower it.
- **The session rate recommendation disagrees across sources:** SDK pages say `0.1`; the setup page's traffic table says High (100k+ sessions/day) `0.01`, Medium (10k to 100k) `0.1`, Low (under 10k) `0.25`, all with error rate `1.0`; the sampling blog uses `0.01` ("a typical Sentry plan comes with 5 million spans, we start with 50 Session Replays"); the replay concept says "a few percent".
- **Sampling order:** the session rate is checked first. Sampled sessions are sent in real time; the rest are buffered in memory (the last 60 seconds, a ring buffer of about 2 to 5 MB of DOM event logs). On an error the error rate is checked: sampled sends the buffer plus the rest of the session, otherwise the buffer is discarded.
- **Web session lifecycle:** the current official page uses 15 minutes of inactivity and 60 minutes maximum. Session mode initializes a newly sampled session afterward; buffer mode stops. Replay can span refreshes/navigation in the same tab, unlike release-health sessions. The old Next.js/setup source said 5 minutes; it is superseded here. Only clicks/navigation reset inactivity in the source, and tab close or stop ends the session. [https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/]
- **When a mobile session ends:** on app close, a crash, more than 30 seconds in the background, or 60 minutes; User Feedback attaches up to 30 seconds of mobile replay. Minimum SDKs: iOS 8.43.0, Android 7.20.0, React Native 6.5.0, Flutter 8.12.0 (the Flutter SDK page says at least 9.0.0; see [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md#session-replay)).
- **Replays for backend errors** need Sentry on the frontend and backend with distributed tracing and `tracePropagationTargets` set; minimum JavaScript 7.51.0, Node 7.48.0.
- **Errors and traces link to replays,** and logs emitted during a replay are linked. The error count on Replay Details may not match (rate-limited, deleted or network errors). AI replay summaries need "Show Generative AI Features".
- **No `replaysSampler` exists.** For per-page replay, set `replaysSessionSampleRate: 0` and use a `useSessionReplay` React hook (Next.js `"use client"`) that decides at random, sets tags and calls `replay.stop(); replay.start();` on mount, then `replay.stop(); replay.startBuffering();` on unmount so error replays keep working. It starts after mount, so it can miss early hydration issues.
- **Lazy-load:** init with `integrations: []`, then `import("@sentry/browser").then((lazyLoadedSentry) => { Sentry.addIntegration(lazyLoadedSentry.replayIntegration()); });`.
- **Canvas is opt-in** with `Sentry.replayCanvasIntegration()`, and "There is currently no PII scrubbing in canvas recordings!" WebGL: `enableManualSnapshot: true` and call `snapshot()` in the paint loop. WebGPU: `snapshot(canvasRef, { skipRequestAnimationFrame: true })`.
- **CSP:** allow `worker-src 'self' blob:` and `child-src 'self' blob:` (Safari 15.4 and older), or self-host the compression worker: `workerUrl: "/assets/worker.min.js"` plus the bundler plugin's `bundleSizeOptimizations: { excludeReplayWorker: true }` (plugins 2.10.0+), and keep that worker updated.

| `replayIntegration` option | Default |
|---|---|
| `stickySession` | `true` |
| `mutationLimit` / `mutationBreadcrumbLimit` | `10000` / `750` |
| `minReplayDuration` | `5000` ms (max 15000; session sampling only) |
| `maxReplayDuration` | `3600000` (1 hour max) |
| `networkDetailAllowUrls` / `networkDetailDenyUrls` | `[]` / `[]` (deny takes precedence) |
| `networkCaptureBodies` | `true` |
| `networkRequestHeaders` / `networkResponseHeaders` | `[]` |
| `beforeAddRecordingEvent` | since 7.53.0 |
| `beforeErrorSampling` | buffer mode only |
| `slowClickIgnoreSelectors`, `workerUrl` | none |

- **Network details are off by default:** only URL, body sizes, method and status code. Opt in per URL with `networkDetailAllowUrls: [window.location.origin]` (SDK 7.50.0+) to get bodies plus `Content-Type`, `Content-Length` and `Accept`; add headers with `networkRequestHeaders: ["Cache-Control"]` and `networkResponseHeaders: ["Referrer-Policy"]`. Bodies are truncated to 150k characters and PII-sanitized server-side, but "the best way to avoid getting PII into Sentry is by not adding URLs of endpoints that may contain PII."
- **Identify the user:** `Sentry.setUser({ email: "jane.doe@example.com" });`.

## Replay privacy

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

- **Verify masking before production.** "Before enabling Session Replay in production, verify your masking configuration"; after changing settings or upgrading UI frameworks or SDKs "you must thoroughly test your application". If masking fails, open a GitHub issue "and avoid deploying to production with Session Replay enabled until the issue is resolved." The same warning applies to mobile.
- **Defaults:** all text masked with `*`; media blocked (`img`, `svg`, `video`, `object`, `picture`, `embed`, `map`, `audio`). Markers: `sentry-mask` / `data-sentry-mask`, `sentry-block` / `data-sentry-block` (a same-size placeholder), `sentry-ignore` / `data-sentry-ignore` (inputs only).

| Option | Default |
|---|---|
| `mask` | `['.sentry-mask', '[data-sentry-mask]']` (additive) |
| `maskAllText` / `maskAllInputs` | `true` / `true` |
| `block` | `['.sentry-block', '[data-sentry-block]']` (additive) |
| `blockAllMedia` | `true` |
| `ignore` | `['.sentry-ignore', '[data-sentry-ignore]']` |
| `maskFn` | `(s) => '*'.repeat(s.length)` |
| `unblock` | `[]` (beats all blocking; doesn't affect `password` elements) |
| `unmask` | `[]` |

- **Since v8, `unblock` and `unmask` add no default selectors.** To use `sentry-unmask`, set `unmask: [".sentry-unmask", "[data-sentry-unmask]"]` (and `unblock: [".sentry-unblock", "[data-sentry-unblock]"]`).
- **`block` always includes `base` and `iframe[srcdoc]:not([src])`;** re-enable with `unblock: ['iframe[srcdoc]']` only if unmasked recording is acceptable.
- **Turn masking off only for static sites without sensitive data:** `maskAllText: false, blockAllMedia: false`.
- **Bake privacy into shared primitives** (the i18n layer, design-system components, avatars). The i18n pattern, "the same pattern Sentry uses in its own web app": record strings returned by `t()` without interpolation in a `staticStrings` Set, and use a custom `maskFn` that unmasks only catalog text. Shared React components `SensitiveText` (`data-sentry-mask`) and `StaticCopy` (`data-sentry-unmask`); a `withReplayMask` HOC wrapping in a `div` (not a `span`, to avoid invalid HTML and SSR hydration mismatches). Block avatar components that use a CSS `background-image` with `data-sentry-block`, letter avatars too. Consider a lint rule or snapshot test that fails when a component rendering user-identifying data ships without a marker.
- **Scrub recording events** with `beforeAddRecordingEvent` (return `null` to drop). Keeping only fetch/xhr with status 500:

```javascript
Sentry.replayIntegration({
  beforeAddRecordingEvent: (event) => {
    // Do not capture fetch/xhr requests, unless the response code is 500
    if (
      event.data.tag === "performanceSpan" &&
      (event.data.payload.op === "resource.fetch" ||
        event.data.payload.op === "resource.xhr") &&
      event.data.payload.data.statusCode !== 500
    ) {
      return null;
    }

    return event;
  },
});
```

- **URLs are stored** in recording and replay events; scrub replay-event URLs with `Sentry.addEventProcessor`, checking `event.type !== "replay_event"` and mapping `event.urls`.
- **Mobile masks by widget or view type;** the Flutter rules are in [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md#masking), React Native's in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md).

## Replay manual control

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

- **Both rates `0`** means installed but inactive. `Sentry.getReplay()` returns the instance: `replay.start()` (session mode), `replay.startBuffering()` (buffer mode), `await replay.stop()`, `await replay.flush()`, `replay.getReplayId()`.
- **Consent withdrawn:** `await replay.stop({ flush: false })` (since `v10.67.0`); it doesn't retract segments already sent.
- **Deferred init:** set `client.getOptions().replaysSessionSampleRate` and the error rate, then `client.addIntegration(replay)`.
- **Lifecycle events** (since `v10.50.0`): `client.on("replayStart", ({ sessionId, recordingMode }) => ...)` and `client.on("replayEnd", ({ sessionId, reason }) => ...)`, reasons `manual`, `sessionExpired`, `sendError`, `mutationLimit`, `eventBufferError`, `eventBufferOverflow`.
- **Custom sampling:** flush for employees; use the Navigation API (`navigation.addEventListener("navigate", ...)`) to `replay.start()` on `/buggy-page/`; drop some errors with `beforeErrorSampling: (event) => !event.exception?.values?.[0]?.value?.includes("drop me")`; in a support widget, `replay.flush()` then attach `replay.getReplayId()`. Replay URL: `https://<org-slug>.sentry.io/replays/<replay-id>/`.

## Browser source qualifiers

[getsentry/sentry-for-ai, sentry-react-sdk and sentry-browser-sdk, Replay references]

- **Where it runs:** browser only, not SSR init, Node, service/web workers, Next.js _document/server instrumentation, Electron main, extensions or CI. It is bundled with browser SDKs, about 50 KB gzipped; keep it in instrumentation-client.ts for Next.js App Router.
- **Version alternatives:** the browser reference lists replayCanvasIntegration at 7.50.0; the React and Next.js references list 7.98.0. beforeErrorSampling is listed at 7.56.0; beforeAddRecordingEvent at 7.53.0. Verify the exact integration export for the installed package.
- **Additional options:** useCompression defaults true; slowClickIgnoreSelectors defaults empty and disables dead/rage-click detection on matching elements. beforeErrorSampling defaults to accepting the error and runs only in buffer mode. Privacy mask/block/ignore defaults are additive; unblock overrides blocking but does not affect password inputs.
- **Mask hierarchy:** rendered-DOM masking uses MutationObserver and cascades; child unmask/unblock can override a parent. The React reference warns about srcdoc iframes and suggests explicitly blocking iframe[srcdoc]; the shared reference says base and iframe[srcdoc]:not([src]) are already blocked. Keep the source positions separate and verify actual SDK defaults.
- **Selective mode alternatives:** the React reference describes all-text/media-off plus input masking and chosen selectors; the existing shared source permits disabling blanket masking only on static sites without sensitive content. Keep the stricter existing privacy rule when these source preferences disagree.
- **Network formats:** JSON, XML, text/plain and multipart text fields, not binary/file/blob/stream bodies. Avoid Authorization/Cookie/Set-Cookie, auth providers and payment endpoints. networkCaptureBodies:false retains header capture. The React source says Apollo unmount cancellation can leave bodies empty and suggests route-level cancellation; changing application cancellation behavior needs its own contract review.
- **Canvas taint:** cross-origin images/video need crossOrigin=anonymous and the asset CDN's CORS permission; preserveDrawingBuffer can cost performance. WebGPU uses the snapshot option already listed above.
- **Lazy-loader source disagreement:** React uses lazyLoadIntegration in npm examples while another reference presents it as a CDN Loader feature. Its listed lazy integrations include Replay, canvas, feedback/modal/screenshot, console capture, context lines, linked errors, dedupe, extra error data, HTTP client, reporting observer, frame rewriting and browser profiling; the profiling reference says browserProfilingIntegration is not in the CDN Loader bundle. Preserve that limit and use the installed SDK/docs.
- **Self-hosted worker:** the React reference locates worker code under node_modules/@sentry/replay/build/npm/esm/worker/ and says it is compatible within a major; the shared reference requires keeping it updated. Next.js uses webpack.treeshake.excludeReplayCompressionWorker with workerUrl; the generic plugin uses bundleSizeOptimizations.excludeReplayWorker.
- **Sessions and click issues:** a replayId identifies the recording and segments are chunks; only clicks and navigation count as inactivity-resetting interactions. React's source defines rage clicks as 3+ clicks within 7 seconds; selectors such as a[download] and copy-to-clipboard buttons can be excluded. The Next.js source also lists .download-btn, a[label*="download" i] and #print-button. Excess mutations should be fixed with virtualization/pagination/CSS animation/batching rather than blindly raising mutationLimit.
- **CSP and assets:** blob workers require worker-src/child-src; a same-origin worker can use self only. A same-origin tunnel uses connect-src self; direct ingest requires its actual Sentry ingest origin. Replay asset/layout/font issues require the relevant CDN CORS permissions; custom fonts can shift recorded click positions.
- **Mutation/source variants:** Browser source examples use mutationBreadcrumbLimit 1000 and mutationLimit 1500, while the common defaults remain 750 and 10000. Treat those as tuning examples, not changed defaults.

- The browser source permits masking-off for internal tools; the shared privacy reference allows it only for static content without sensitive data. Keep the stricter existing privacy rule unless the actual application policy authorizes the narrower alternative. Browser source also diagnoses undefined uiProfiler as an older SDK or wrong lifecycle; confirm the installed export before changing lifecycle to silence an error. [getsentry/sentry-for-ai, sentry-browser-sdk and shared Replay reference]

## Profiling

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

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

- **Manual mode:** omit profileLifecycle (manual is the default) and start/stop uiProfiler around the selected flow. Only profileSessionSampleRate controls manual profiling; the trace lifecycle additionally requires active sampled root spans. The old browser/Node source applied the tracing requirement to every lifecycle. [https://docs.sentry.io/platforms/javascript/profiling/; https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#profileLifecycle]
- **Trace-mode sampling compounds:** a trace-mode profile needs both the trace and the session sampled; `tracesSampleRate: 0.5` with `profileSessionSampleRate: 0.5` profiles about 25%.
- **Not in the CDN loader bundle:** `browserProfilingIntegration` is not available there.
- **Upload source maps,** or functions show as `e`, `t`, `r` (e.g. Vite with `sourcemaps: { filesToDeleteAfterUpload: ["./**/*.map"] }`, see [REACT.md](REACT.md#source-maps)).
- **DevTools conflict:** with the integration active, DevTools profiles show its overhead mixed into rendering. Disable it during local DevTools sessions.

### Shared reference initialization variant

[getsentry/sentry-for-ai, shared profiling reference]

The shared reference also dates the deprecated transaction-based browser mode to SDK 7.60.0 and retains this initialization example. Its omitted profileLifecycle selects the documented manual default; its tracing settings do not make manual profiling trace-dependent. The browser manual API is Sentry.uiProfiler; Node uses Sentry.profiler.

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  profileSessionSampleRate: 1.0,
});
```

## Debugging

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

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
| No profiles | `Document-Policy: js-profiling` on document responses |
| Profiles show minified names | Source maps not uploaded: configure `sentryVitePlugin` or `sentryWebpackPlugin` |
| Profiles only from some users | Expected: only Chromium users are profiled; Firefox and Safari silently no-op |
| DevTools shows inflated rendering times | Disable `browserProfilingIntegration` during local DevTools sessions |
| `profileSessionSampleRate` has no effect | `browserProfilingIntegration()` listed after `browserTracingIntegration()` |
| Profiling on a static host not working | The host must support custom response headers; GitHub Pages and some CDNs do not |
| Profiles not linked to spans in Trace mode | `profileLifecycle: "trace"` and `tracesSampleRate` > 0 |

## Prove it

[getsentry/sentry-for-ai, sentry-browser-sdk, sentry-react-sdk and shared signal references]

Replay records the real browser path and masks every sensitive field before production; sampling/manual control follow the configured mode. Browser profiles are collected only in supported Chromium sessions with the required response header and chosen lifecycle. Check active-span links only when tracing is part of the selected lifecycle. [getsentry/sentry-for-ai, Replay/profiling references; https://docs.sentry.io/platforms/javascript/profiling/]
