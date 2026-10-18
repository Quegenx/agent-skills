# React Native Features

What `@sentry/react-native` captures once it is installed: errors and native crashes, tracing, profiling, Session Replay, logs and user feedback. Every feature here depends on the setup in [REACT-NATIVE.md](REACT-NATIVE.md): `Sentry.wrap(App)` on the root component, and a native build rather than Expo Go for anything native (crashes, frames, TTID/TTFD, profiling, replay, the feedback widget). Mobile replay is screenshot-based, not DOM recording, so its privacy model is native-layer pixel masking. Cross-platform sampling and PII rules are in [PRACTICES.md](PRACTICES.md); symbol uploads are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

**Contents:** [Errors](#errors) · [Tracing](#tracing) · [Profiling](#profiling) · [Session Replay](#session-replay) · [Logs](#logs) · [User feedback](#user-feedback) · [Debugging](#debugging) · [Prove it](#prove-it)

## Errors

### Capture

- **Errors come from three layers:** the JavaScript runtime, native iOS (ObjC/Swift, Mach exceptions) and native Android (Java, JNI/C++ via NDK). An event is one submission, an issue is a group of similar events.
- **`Sentry.captureException(error, context?)`:** `context` is a plain object (`tags`, `user`, `extra`, `contexts`, `level`, `fingerprint`, `attachments`), a scope callback (`(scope) => { scope.setTag(...); return scope; }` clones the scope for this capture only), a `new Sentry.Scope()` instance (merges with the global scope), or `() => scope` to isolate entirely and ignore global attributes.
- **`Sentry.captureMessage(message, level?)`:** default level `"info"`; levels `"fatal" | "error" | "warning" | "log" | "info" | "debug"`. Use fatal for a crash or total loss, error for a broken feature, warning for degraded, info for noteworthy, log for low priority, debug for diagnostics.
- **`Sentry.captureEvent(event)`:** a fully constructed event (`message`, `level`, `tags`, `extra`, `fingerprint`, `timestamp: Date.now() / 1000`).
- **Unhandled promise rejections are captured automatically** by the `UnhandledRejection` integration. To stop that: `integrations: (integrations) => integrations.filter((i) => i.name !== "UnhandledRejection")`.
- **Linked errors:** `NativeLinkedErrors` reads `.cause` recursively up to 5 levels; set `wrapperError.cause = originalError`, then `captureException(wrapperError)`.

### Native crashes, ANRs, app hangs

- **Native crashes are sent on the next launch, not at crash time.** Segfaults, SIGSEGV, unhandled C++ exceptions and OOM kills are caught at OS level and persisted to disk; they go out on the next app launch (iOS) or restart (Android). Test in a release build.
- **Android ANR:** flagged when an activity doesn't respond to input within 5 seconds or a broadcast receiver doesn't finish within 10 seconds, detected by a watchdog thread. Always on and not configurable from JavaScript.
- **iOS, tvOS, macOS app hangs:** `appHangTimeoutInterval` (default 2 seconds); `enableAppHangTracking: false` disables. `enableWatchdogTerminationTracking: true` (default) tracks OOM kills and watchdog terminations on iOS.
- **Native options in one place:** `enableNative: false`, `enableNativeCrashHandling: false`, `autoInitializeNativeSdk: false`, `enableNdkScopeSync: true`, `enableTombstone: true`, `attachThreads: false`, `onReady: () => {...}` (defaults are in [REACT-NATIVE.md](REACT-NATIVE.md#native-and-mobile)).
- **Forward native SDK logs** (only works with `debug: true`, so never in production):

```typescript
Sentry.init({
  dsn: "YOUR_DSN",
  debug: true, // required: native logs are only forwarded when debug is enabled

  onNativeLog: ({ level, component, message }) => {
    // Use consoleSandbox to avoid feedback loops with Sentry's console integration
    Sentry.consoleSandbox(() => {
      console.log(`[Sentry Native] [${level.toUpperCase()}] [${component}] ${message}`);
    });
  },
});
```

- **Always use `Sentry.consoleSandbox()` inside `onNativeLog`.** A bare `console.log` makes a breadcrumb that triggers another log event, an infinite loop. `level` is `"debug"`, `"info"`, `"warning"`, `"error"` or `"fatal"`; `component` is the native module name (e.g. `"Sentry"`).

### Error boundaries

- **`Sentry.wrap(App)` is the root boundary.** Add inner ones for isolation: `<Sentry.ErrorBoundary fallback={<Text>An error has occurred</Text>}>`; a function `fallback` receives `{ error, componentStack, resetError }`. HOC form: `Sentry.withErrorBoundary(Dashboard, { fallback: ... })`.
- **Props:** `fallback`, `showDialog` (opens the feedback dialog on error), `dialogOptions`, `onError(error, componentStack, eventId)`, `beforeCapture(scope, error, componentStack)`, `onMount`, `onUnmount`. Tag sections with `beforeCapture={(scope) => scope.setTag("section", "sidebar")}`.
- **Custom boundaries must be class components** (React requirement): call `Sentry.captureException(error, { extra: { componentStack: info.componentStack } })` in `componentDidCatch`.
- **Expo Router route boundaries swallow errors;** wrap them as shown in [REACT-NATIVE.md](REACT-NATIVE.md#expo-router-errorboundary).

### Scopes and context

- **Three scopes merge global, then isolation, then current** (current wins): global (`Sentry.getGlobalScope()`, every event), isolation (`Sentry.getIsolationScope()`, per session on mobile; every `Sentry.setXXX()` writes here), current (`Sentry.getCurrentScope()`, best used through `withScope()`, whose cloned scope lives only inside the callback).
- **Setters:** `setTag`, `setTags`, `setAttribute` and `setAttributes` (≥8.17.2), `setUser`, `setContext`, `setExtra`, `setExtras`, `addBreadcrumb`.
- **Tags are indexed and searchable:** key max 32 chars from `a-zA-Z`, `0-9`, `_`, `.`, `:`, `-`; value max 200 chars, no newline.
- **User:** `Sentry.setUser({ id, email, username, ip_address: "{{auto}}", ...extra })`; on logout `Sentry.setUser(null)`.
- **`setContext(name, obj)` is not searchable;** the key `"type"` is reserved, nesting is normalized to 3 levels (`normalizeDepth`), an oversized payload gets HTTP `413`. `setExtra`/`setExtras` are deprecated; use `setContext()`.
- **Clearing:** `Sentry.getCurrentScope().clear()`, `Sentry.setUser(null)`, `Sentry.setTag("key", undefined)`.
- **Automatic contexts:** device, OS, app (native SDK), React Native (RN version, JS engine, architecture), and Expo Constants on Expo (`expo_constants`: `execution_environment` (`'bare'`, `'standalone'`, `'storeClient'`), `app_ownership` (`'expo'` in Expo Go), `debug_mode`, `expo_version`, `expo_runtime_version`, `session_id`, `status_bar_height`, `app_name`, `app_slug`, `app_version`, `expo_sdk_version`, `eas_project_id`).

### Breadcrumbs

- **Breadcrumbs wait for the next event;** they never create issues. `maxBreadcrumbs` (default 100) drops the oldest.
- **Fields:** `type` (`"default"`, `"http"`, `"navigation"`, `"user"`), `category`, `message`, `level` (`"fatal"`, `"critical"`, `"error"`, `"warning"`, `"log"`, `"info"`, `"debug"`), `timestamp`, `data`. Unknown keys are dropped silently.
- **Automatic:** `ui.click` (via `Sentry.wrap`), `http` (fetch/XHR), `console`, `navigation`, `redux.action` (via `Sentry.createReduxEnhancer`), native lifecycle and connectivity.
- **Filter in `beforeBreadcrumb`:** e.g. drop `ui.click`, scrub tokens from HTTP URLs with `.replace(/token=[^&]*/, "token=REDACTED")`.
- **Rage taps:** `TouchEventBoundary` emits a `ui.multiClick` breadcrumb when the same element is tapped 3+ times within 1 second, shown on the replay timeline; props `enableRageTapDetection` (`true`), `rageTapThreshold` (`3`), `rageTapTimeWindow` (ms, `1000`). The replay reference instead says rage clicks are not supported in mobile replay (taps only). Confirm in the current docs.

### Filtering, grouping, processors

- **`ignoreErrors` / `ignoreTransactions` run before `beforeSend`** and are cheaper for known noise, e.g. `"ResizeObserver loop limit exceeded"`, `"Non-Error exception captured"`, `/^Script error\.?$/`.
- **`beforeSend` sees only JS-layer events,** never native crashes; to stop native crash capture use `enableNativeCrashHandling: false`. Hint fields: `hint.originalException`, `hint.syntheticException`, `hint.event_id`. `beforeSendTransaction` can drop `/health` and normalize `/internal/*`.
- **Event processor order:** processors in registration order (global `Sentry.addEventProcessor`, scope-only `scope.addEventProcessor`, async allowed), then `beforeSend`/`beforeSendTransaction` last, then the server.
- **Fingerprints:** SDK `fingerprint: ["{{ default }}", url, String(status)]`. Variables: `{{ default }}`, `{{ error.type }}`, `{{ error.value }}`, `{{ transaction }}`, `{{ level }}`, `{{ message }}`, `{{ stack.function }}`, `{{ stack.module }}`. Priority: SDK fingerprint, then server-side rules, then default stack-trace grouping. Server-side rules:

```
error.type:DatabaseUnavailable -> system-down
error.type:ConnectionError -> system-down
error.value:"connection error: *" -> connection-error, {{ transaction }}
logger:my.package.* level:error -> error-logger, {{ logger }} title="Error from Logger {{ logger }}"
```

### Attachments, Redux, offline

- **Screenshots and view hierarchy:** `attachScreenshot: true` (v4.11.0+) adds a PNG under "Attachments" (it may capture sensitive data; mask with the `screenshot` option); `attachViewHierarchy: true` adds a "View Hierarchy" tab.
- **Manual attachments:** `captureException(err, { attachments: [{ filename, data, contentType }] })` with `data` a string or `Uint8Array`, or `scope.addAttachment({...})`. Oversized payloads get `413 Payload Too Large`.
- **Redux:** `Sentry.createReduxEnhancer({ actionTransformer, stateTransformer })` (an `actionTransformer` returning `null` skips the action; `configureScopeWithState: (scope, state) => { scope.setTag("user.plan", state.user.subscription); }`). With Redux Toolkit: `enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(Sentry.createReduxEnhancer({...}))`. Actions become `redux.action` breadcrumbs; state is attached under `state.value`.
- **Offline cache:** up to `maxCacheItems` (default 30) envelopes, JS events and native crashes. Android keeps them in internal app storage and sends on restart; iOS keeps them in `Library/Caches/` and sends when the next event fires.

## Tracing

- **Setup:** no extra imports. Add `Sentry.reactNativeTracingIntegration()` to `integrations` (the tracing reference says this is required; the setup guide's examples omit it) and wrap with `Sentry.wrap(App)`. Opt out with `enableAutoPerformanceTracing: false`.
- **Sampling:** `1.0` in development; in production 0.1 to 0.2 (setup guide) or 0.2 or lower (tracing reference), or a `tracesSampler`:

```typescript
tracesSampler: ({ name, attributes, parentSampled }) => {
  if (name === "checkout" || name === "PaymentScreen") return 1.0;
  if (name.includes("HealthCheck")) return 0;
  if (parentSampled !== undefined) return parentSampled ? 1.0 : 0;
  return 0.1;
},
```

- **Parent check differs between sources:** the error monitoring reference writes `if (typeof parentSampled === "boolean") return parentSampled;` with a default of 0.2.
- **Head-based sampling** (`tracesSampleRate`/`tracesSampler`) suffices for most RN apps; tail-based Dynamic Sampling rules run server-side and require the Business plan.

### App start

- **Cold start is `measurements.app_start_cold`, warm is `measurements.app_start_warm`;** hot starts and resumes are not tracked. Values follow Apple and Google guidelines and may be longer than other tools report.
- **Without `Sentry.wrap(App)`, App Start ends at JS initialization** instead of first component mount. With a routing integration, App Start appears as spans inside the first navigation transaction.
- **Mark the real end with `Sentry.appLoaded()`** ([REACT-NATIVE.md](REACT-NATIVE.md#init-full-and-production)).
- **Speed up start:** lazy `import()` heavy modules; don't block on `AsyncStorage` reads, default and hydrate in `useEffect`.

### Navigation

- **React Navigation (v5+):** use the `Sentry.NavigationContainer` drop-in (SDK ≥8.13.0). It creates `reactNavigationIntegration`, registers the container ref, records navigation breadcrumbs and tracks TTID per screen.
- **Manual React Navigation:**

```typescript
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
  routeChangeTimeoutMs: 1_000,
  ignoreEmptyBackNavigationTransactions: true,
  useDispatchedActionData: true,
});
Sentry.init({ dsn: "YOUR_DSN", tracesSampleRate: 1.0, integrations: [navigationIntegration] });
function App() {
  const containerRef = createNavigationContainerRef();
  return (
    <NavigationContainer
      ref={containerRef}
      onReady={() => {
        // Must be called inside onReady, not before the container is ready
        navigationIntegration.registerNavigationContainer(containerRef);
      }}
    >
      {/* screens */}
    </NavigationContainer>
  );
}
export default Sentry.wrap(App);
```

| `reactNavigationIntegration` option | Default |
|---|---|
| `enableTimeToInitialDisplay` | `false` |
| `routeChangeTimeoutMs` | `1_000` |
| `ignoreEmptyBackNavigationTransactions` | `true` |
| `useDispatchedActionData` | `false` |

- **Wix React Native Navigation:** `Sentry.reactNativeNavigationIntegration({ navigation: Navigation, routeChangeTimeoutMs: 1_000, enableTabsInstrumentation: true, ignoreEmptyBackNavigationTransactions: true })`; `navigation` is required, `enableTabsInstrumentation` defaults to `false`.
- **Expo Router:** the current official setup uses `Sentry.expoRouterIntegration(...)` in init and `Sentry.wrapExpoRouter(useRouter())` where router methods are used. This records navigation attribution, dispatch and prefetch spans; the source's blanket automatic/no-integration statement was incomplete. `router.prefetch()` requires Expo Router v5 (Expo SDK 53)+. Time to Initial Display is not supported in Expo Go; guard native-only features with the documented `isRunningInExpoGo()` setup. Check the installed versions before adopting the current APIs. [https://docs.sentry.io/platforms/react-native/guides/expo/tracing/instrumentation/expo-router/]
- **Rename transactions** (default: route or screen name): `reactNativeTracingIntegration({ beforeStartSpan: (context) => ({ ...context, name: ..., attributes: {...} }) })`.
- **Tab navigators preload screens,** so auto-instrumentation only makes a transaction for the first tab visit; place `TimeToInitialDisplay`/`TimeToFullDisplay` explicitly per tab.

### Time to display

- **TTID** runs from the navigation event to the first rendered frame after the screen mounts; **TTFD** to when all async content has loaded. Requires SDK ≥5.20.0 and a native build.
- **Automatic TTID** (React Navigation only): `enableTimeToInitialDisplay: true`; includes animation completion time, except JS-driven animations on iOS.
- **Manual:** `<Sentry.TimeToInitialDisplay record={true} />` and `<Sentry.TimeToFullDisplay record={product !== null} />`. `record` fires once on false to true; both render `<></>`.

### Frames and stalls

- **Slow and frozen frames are captured per transaction automatically** (`enableNativeFramesTracking`). Web Vitals (LCP, FID, CLS) are not reported for RN.
- **Android frame detection needs `androidx.core`;** excluding it (`exclude group: 'androidx.core', module: 'core'` on `io.sentry:sentry-android:8.33.0`) disables slow/frozen frame detection.
- **Stalls** (Longest Stall Time, Total Stall Time, Stall Count) are on automatically with `reactNativeTracingIntegration`. Avoid heavy synchronous JS; use `InteractionManager.runAfterInteractions` or a native module or worklet (Reanimated).

### Network and distributed tracing

- **Every `fetch`/XHR during an active transaction gets a child span** (method, URL, status, sizes, duration). Filter with `shouldCreateSpanForRequest: (url) => boolean`.
- **Idle and final timeouts:** `idleTimeoutMs` (default `1_000`; raise it if transactions never finish) and `finalTimeoutMs` (default `600_000`, 10 minutes).
- **Propagation headers:** `sentry-trace` (trace and span ID) and `baggage` (sampling decision and metadata). `tracePropagationTargets` defaults to `[/.*/]` on mobile (every request) and matches the whole URL, not just the domain. Narrow it, e.g. `tracePropagationTargets: ["localhost", /^https:\/\/api\.yourapp\.com/]`.
- **The backend must allow the headers:** `Access-Control-Allow-Headers: sentry-trace, baggage`. A Node.js backend takes `@sentry/node`; a React or Next.js web app takes the React SDK.

### User interactions

- **Enable with `enableUserInteractionTracing: true`** (default `false`) plus `Sentry.wrap(App)`. Transactions are named `ScreenName > element_label`; elements need `sentry-label="..."` or the tap is ignored, and transactions with no child spans are dropped.
- **Custom label prop:** `Sentry.wrap(App, { touchEventBoundaryProps: { labelName: "tracking-id" } })` (default `"sentry-label"`). `sentry-span-attributes={{...}}` is experimental and can sit on a parent element.
- **Gestures (RNGH v2 only):** `sentryTraceGesture("pinch-to-zoom", pinch)` from `@sentry/react-native`; the label must be unique per screen.

### Custom spans

- **`Sentry.startSpan({ name, op }, cb)`** is active and auto-ending (recommended); `Sentry.startSpanManual(opts, (span) => { ...; span.end(); })`; `Sentry.startInactiveSpan(opts)` then `.end()`.
- **Span options:** `name` (required), `op`, `attributes`, `startTime` (Unix seconds), `parentSpan`, `onlyIfParent`, `forceTransaction`. Standard ops: `http.client`, `db`, `function`, `ui.render`, `file.read`, `file.write` (full list: https://develop.sentry.dev/sdk/performance/span-operations/#list-of-operations).
- **Span API:** `span.setAttribute`, `span.setAttributes`, `span.updateName`, `Sentry.getActiveSpan()`, `Sentry.getRootSpan(span)`, `Sentry.withActiveSpan(parent | null, cb)`, `Sentry.suppressTracing(cb)`.
- **`parentSpanIsAlwaysRootSpan` defaults to `true`** (children attach flat to the root to avoid async misattribution); `false` enables nesting but may misattribute across `async/await`.
- **React renders:** `Sentry.withProfiler(Component)` emits `ui.react.render` and `ui.react.update`; production names are minified without the Gradle/Xcode plugins and source maps.

## Profiling

- **`profilesSampleRate` is relative to `tracesSampleRate`:** 0.2 traces with 0.5 profiles profiles 10% of transactions.
- **Two profilers run together:** Hermes (JS) and the platform profilers (Swift/ObjC, Kotlin/Java), merged into one flame graph. `hermesProfilingIntegration` is added automatically; `Sentry.hermesProfilingIntegration({ platformProfilers: false })` is JS-only (≥5.33.0; the config table lists `platformProfilers` at ≥5.32.0). Go JS-only to isolate JS issues, cut overhead on lower-end devices, or debug JS stalls.
- **UI Profiling (experimental, continuous):**

```typescript
_experiments: {
  profilingOptions: {
    profileSessionSampleRate: 1.0,
    lifecycle: "trace",
    startOnAppStart: true,
  },
},
```

- **`lifecycle` supports only `"trace"`;** `startOnAppStart` defaults to `false` (set `true` for cold start profiling). Use `profileSessionSampleRate` 0.01 to 0.05 in production.
- **Production rates:** traces 0.2 and profiles 0.5, or profiles ≤0.1 for most apps, lower on Android devices under 4GB RAM; the setup guide's production example uses `profilesSampleRate: 1.0`. Confirm in the current docs.
- **Overhead grows linearly with the sample rate:** Hermes low (sampling), platform profilers medium, UI Profiling higher.
- **Not captured:** memory allocations, network details, UI rendering frames.
- **Platform needs:** no Expo Go (Development Build or EAS Build). iOS release builds need dSYMs; simulator results differ from devices. Android needs Hermes (JSC is not supported for JS profiling; Hermes is the default on RN ≥0.70), the ProGuard/R8 mapping, and API 21+.
- **Limits:** a profile is truncated if its transaction completes in the background; large profiles may be truncated server-side, so keep `finalTimeoutMs` reasonable; never include `hermesProfilingIntegration` in web bundles. The `_experiments.profilingOptions` API may change; pin the SDK version if stability matters.

## Session Replay

- **How mobile replay differs from web:** a native view hierarchy snapshot plus a screenshot per frame at about 1 fps, compressed into video segments. Text is pixels only; masking happens in the native layer; offline capture works only in error mode; taps are breadcrumbs only (no gesture paths); scroll is approximate; network bodies only for allow-listed URLs (XHR only, ≥8.13.0). Generally available on all plans.
- **Register it in `Sentry.init()`:** lazy loading via `Sentry.addIntegration()` is not supported. There is no separate package.
- **Minimum versions:** basic 6.5.0; `maskAllVectors` 5.36.0 / 6.3.0+; `Sentry.Mask`/`Sentry.Unmask` 6.4.0-beta.1; masking with a manually initialized native SDK 6.15.1 (Cocoa 8.52.1+); `screenshotStrategy` 7.5.0 (Android); `includedViewClasses`/`excludedViewClasses` 7.9.0 (iOS); Cocoa 8.43.0+; Android native 7.20.0+.
- **Basic setup:** `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`, `integrations: [Sentry.mobileReplayIntegration()]`; session rate 1.0 in development.
- **On-error mode keeps a rolling 1-minute buffer in memory** before the error; offline segments are stored to disk.

| Strategy | `replaysSessionSampleRate` | `replaysOnErrorSampleRate` |
|---|---|---|
| Errors only | `0` | `1.0` |
| Balanced | `0.05` | `1.0` |
| High visibility | `0.1` | `1.0` |

- **`beforeErrorSampling: (event, hint) => boolean`:** return `false` to skip the replay, e.g. skip handled errors (`exception.mechanism?.handled === true`). It only fires when `replaysOnErrorSampleRate` > 0.

| `mobileReplayIntegration` option | Default |
|---|---|
| `maskAllText`, `maskAllImages`, `maskAllVectors` | `true` |
| `screenshotStrategy` | `'pixelCopy'` (or `'canvas'`) |
| `includedViewClasses`, `excludedViewClasses` | (excluded wins) |
| `beforeErrorSampling` | |
| `networkDetailAllowUrls`, `networkDetailDenyUrls` | `[]` |
| `networkCaptureBodies` | `true` (changed to `true` in 8.17.0) |
| `networkRequestHeaders` | `[]` (`Content-Type`, `Content-Length`, `Accept` always captured) |
| `networkResponseHeaders` | `[]` |

### Privacy

- **Default masking covers** all text, images, vectors, webviews and user input; masked areas are filled with the predominant color.
- **`Sentry.Mask` masks all descendants; `Sentry.Unmask` unmasks only direct children; Mask always wins.** Both are native components that behave as `View` on New and Legacy Architecture.
- **View flattening can remove Mask/Unmask wrappers and expose data:** add `collapsable={false}` and test on physical devices.
- **Android `canvas` strategy (experimental):** higher overhead, reliable masking, ignores every mask option and `Sentry.Unmask` (everything is masked).
- **iOS 26.0 Liquid Glass may leak PII through masked areas;** disable replay on iOS 26+ until https://github.com/getsentry/sentry-cocoa/issues/6390 is resolved.
- **Verify the masking config before enabling replay in production;** any change to the defaults needs thorough testing with the real app UI. If unmasked PII shows up, disable Session Replay and open a GitHub issue.
- **Network capture:** `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, `X-Auth-Token` and `Proxy-Authorization` are always stripped; bodies truncate at 150 KB; binary payloads become a placeholder (`UNPARSEABLE_BODY_TYPE` warning); string URL patterns match by substring, regexes by `.test(url)`; native `fetch` body support is not available yet.

### Cost, sessions, UI

- **Measured overhead** (Pocket Casts, release builds, 10 iterations): iPhone 14 Pro -2 fps, +19 MB, +9% CPU, ~10 KB/s; Pixel 2XL -1 fps, +10 MB, +6% CPU, ~7 KB/s; cold startup negligible. iPhone 8 and earlier may stutter. Reduce with `replaysSessionSampleRate: 0.05` and `replaysSessionQuality: "low"`.
- **Android binary size:** the replay module is ~40 KB compressed / ~80 KB uncompressed. Exclude it in root `android/build.gradle`: `subprojects { configurations.all { exclude group: 'io.sentry', module: 'sentry-android-replay' } }`.
- **Session lifecycle:** returning within 30 s keeps the same `replay_id`; after 30+ s a new session starts; max 60 minutes.
- **Linked errors:** handled, unhandled, ANRs/app hangs and native (NDK) crashes.
- **Panels:** Video, Breadcrumbs, Timeline, Network, Console (custom logs, Logcat, Timber), Errors, Tags, Trace. `annotateReactComponents: true` in the metro config shows component names (e.g. `<ProfileCard>`).
- **Not in Expo Go;** works with `expo-dev-client`, EAS Build and bare.

## Logs

- **Turn on with `enableLogs: true`** (default `false`, SDK ≥7.0.0). Levels: `Sentry.logger.trace/debug/info/warn/error/fatal(message, attributes)`. Attribute values are `string`, `number` or `boolean` only; others are dropped or coerced.
- **Parameterized messages:** the `Sentry.logger.fmt` tagged template records `message.template` (e.g. "User %s purchased %s for $%s") and `message.parameter.N`. Use it as a tagged template, not `fmt(...)`.
- **Scope attributes (≥7.8.0):** `Sentry.getGlobalScope().setAttributes({...})`; `Sentry.withScope(async (scope) => { scope.setAttribute("order_id", "ord_789"); ... })`.
- **Console capture:** SDK ≥8.14.0 captures console automatically with `enableLogs: true` (turn off with `enableAutoConsoleLogs: false`); below 8.14.0 add `Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })`. The logging reference's config table still lists `consoleLoggingIntegration` as not added by default and its troubleshooting says to add it if `console.log` isn't forwarded.
- **Native or JS origin:** `logsOrigin` `'native' | 'js' | 'all'` (SDK ≥7.7.0).
- **Filter in `beforeSendLog: (log) => log | null`** (log fields: `level`, `message`, `timestamp`, `attributes`), e.g. drop `trace` and `debug` when `!__DEV__`. There is no log sampling.
- **Auto attributes:** `sentry.environment`, `sentry.release`, `sentry.sdk.name`, `sentry.sdk.version`, `user.id`/`user.name`/`user.email`, `sentry.message.template`, `sentry.message.parameter.X`, `origin`. Not emitted on RN: `browser.name`/`browser.version`, `sentry.trace.parent_span_id`, `sentry.replay_id`, `server.address`, `payload_size`.
- **Logs inside an active span are correlated automatically.**
- **Limits:** batched and async; payloads over 1 MB are dropped server-side; logs since the last flush are lost on a crash. `browser.*` columns stay empty in the Logs UI. Mobile replay does not populate the replay attribute on logs; replay is still linked via trace context. In production, scope `consoleLoggingIntegration` tightly with its `levels` option. `[Filtered]` values mean server-side PII scrubbing; adjust Data Scrubbing settings.

## User feedback

- **Three ways in:** the built-in widget (`Sentry.showFeedbackWidget()`), the inline `<FeedbackWidget />` (import `{ FeedbackWidget }` from `@sentry/react-native`; follows `feedbackIntegration` config), and `Sentry.captureFeedback()`. All support `associatedEventId`, offline caching and attaching up to 60 seconds of prior replay on widget submit.
- **`Sentry.wrap(App)` is required** for `showFeedbackWidget()` and `showFeedbackButton()`. Floating button: `Sentry.showFeedbackButton()` / `Sentry.hideFeedbackButton()` (≥6.15.0).
- **Shake to report (≥8.5.0):** `Sentry.feedbackIntegration({ enableShakeToReport: true })` or `Sentry.enableFeedbackOnShake()` / `Sentry.disableFeedbackOnShake()`. Uses iOS UIKit motion events and the Android accelerometer (`SentryShakeDetector`), needs no permissions, not on Web or Expo Go.

| `feedbackIntegration` option | Default |
|---|---|
| `formTitle` | `"Report a Bug"` |
| `submitButtonLabel` | `"Send Bug Report"` |
| `cancelButtonLabel` | `"Cancel"` |
| `nameLabel` / `namePlaceholder` | `"Name"` / `"Your Name"` |
| `emailLabel` / `emailPlaceholder` | `"Email"` / `"your.email@example.org"` |
| `messageLabel` / `messagePlaceholder` | `"Description"` / `"What's the bug? What did you expect?"` |
| `isNameRequired`, `isEmailRequired` | `false` |
| `useSentryUser` | e.g. `{ name: "username", email: "email" }` |
| `enableShakeToReport` | `false` |
| `styles` | |

- **Programmatic:** `Sentry.captureFeedback(feedback: UserFeedback, hint?: EventHint): string | undefined`; `feedback` takes `message` (required), `name`, `email`, `associatedEventId`; `hint` takes `captureContext`, `attachments`. Link to an error with `const eventId = Sentry.captureException(...)` then `captureFeedback({ ..., associatedEventId: eventId })`, or use `Sentry.lastEventId()`.
- **After a crash:** check `Sentry.lastEventId()` in a `useEffect` at launch and show a Modal; call it at app start before other Sentry calls that create events. It returns the most recent event in the current app session.
- **After a render error:** `<Sentry.ErrorBoundary onError={(_error, _componentStack, eventId) => setErrorEventId(eventId)}>` drives a custom form.
- **Screenshot attachment:** `react-native-view-shot` (`captureScreen({ format: "png", quality: 0.8 })`) plus `react-native-fs` (`RNFS.readFile(uri, "base64")`).
- **Expo:** the widget needs a native build; `captureFeedback()` works in Expo Go and native builds; guard with `isRunningInExpoGo()`.
- **Self-hosted Sentry** needs ≥24.4.2 for full feedback; the Fabric widget needs RN ≥0.71.

## Debugging

| Symptom | Fix |
|---|---|
| No transactions | set `tracesSampleRate` > 0 and add `reactNativeTracingIntegration()` |
| App Start span missing | wrap the root: `export default Sentry.wrap(App)` |
| TTID/TTFD not appearing | `enableTimeToInitialDisplay: true`, SDK ≥5.20.0, native build |
| TTID not firing on tab screens | tabs are preloaded; add `<Sentry.TimeToInitialDisplay record={true} />` to each tab screen |
| No interaction transactions | add `sentry-label` to every element to track |
| `sentry-trace` header missing | `tracePropagationTargets` matches against the entire URL string |
| Backend receives the header but the trace is not linked | the backend needs a Sentry SDK with distributed tracing |
| Gesture spans missing | only RNGH API v2 is supported |
| Stall metrics missing | add `reactNativeTracingIntegration` |
| Navigation transactions not created | call `registerNavigationContainer(ref)` inside `onReady` |
| Transactions never finish | adjust `idleTimeoutMs` in `reactNativeTracingIntegration` options |
| No profiles | `profilesSampleRate` and `tracesSampleRate` both > 0 |
| `hermesProfilingIntegration is not a function` | SDK < 5.32.0 |
| Flame graph mostly "unknown" | missing source maps and native symbols |
| JS frames minified (`t`, `n`, `r`) | upload source maps with the Sentry Metro plugin |
| Native frames show as hex addresses | upload dSYMs (iOS) or the ProGuard mapping (Android) |
| UI Profiling config has no effect | migrate from deprecated `androidProfilingOptions` to `_experiments.profilingOptions` |
| App crashes on startup after adding profiling | Hermes not enabled |
| Replay blank or black | check `maskAllText`/`maskAllImages` |
| Replay not recording at all | `mobileReplayIntegration()` in `integrations` in `Sentry.init()`, sample rates > 0 |
| Everything still masked after `maskAllText: false` | SDK ≥5.36.0 / 6.3.0+; with a manually initialized native SDK, 6.15.1+ (Cocoa 8.52.1+) |
| Replay works in debug but not production | check production sample rates and the DSN for that environment |
| High CPU or memory on older devices | `replaysSessionQuality: "low"`, lower `replaysSessionSampleRate`, disable on affected models if needed |
| Pre-error buffer missing | the 60-second buffer is held in RAM; low-memory devices may truncate it |
| iOS crash during replay capture | add the class to `excludedViewClasses` |
| Android masking misaligned | try `screenshotStrategy: 'canvas'` |
| Replay count differs from issue count | rate limiting, deletions, network failures |
| Logs not appearing | `enableLogs: true` in `Sentry.init()` |
| `console.log` not in Logs | SDK <8.14.0 needs `consoleLoggingIntegration`; its `levels` must include `"log"` |
| Logs not linked to traces | enable tracing (`tracesSampleRate > 0`) and log inside a `Sentry.startSpan()` callback |
| Offline feedback lost | evicted when `maxCacheItems` (default 30) is full |
| `captureUserFeedback is not a function` | upgrade to ≥7.0.0 and use `captureFeedback()` |

## Prove it

- **Render error:** a component that throws inside `<Sentry.ErrorBoundary>` shows the fallback and creates an issue; on Expo Router, a throwing route creates an issue carrying `route.name`.
- **Native crash:** in a release build, a native crash appears after relaunch; an Android ANR or iOS hang over `appHangTimeoutInterval` creates an event.
- **Scope:** an error after `Sentry.setUser({ id })` carries that user; after `Sentry.setUser(null)` it doesn't.
- **Tracing:** navigating between two screens creates two transactions named after the routes, with App Start spans in the first and `sentry-trace` and `baggage` headers on requests to your API.
- **Profiling:** a sampled transaction has a profile whose flame graph shows named JS and native frames, not "unknown".
- **Replay:** a forced error with `replaysOnErrorSampleRate: 1.0` links a replay, and every text and image in it is masked unless deliberately unmasked.
- **Logs and feedback:** `Sentry.logger.info("test", { a: 1 })` appears in Logs with attribute `a`; `captureFeedback({ message, associatedEventId })` shows on that issue.
