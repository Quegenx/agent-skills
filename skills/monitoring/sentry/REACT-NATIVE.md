# React Native and Expo

`@sentry/react-native` reports from three layers at once: the JavaScript runtime, native iOS (`sentry-cocoa`) and native Android (`sentry-android`, Java plus NDK). Most outcomes come down to four things: whether the project took the right setup path (Expo SDK 50+, bare, or legacy), whether the root component is wrapped with `Sentry.wrap`, whether the build is a native release build (Expo Go is JS-only), and whether source maps and debug symbols were uploaded with a `release` and `dist` that match the running app. The features themselves (errors, tracing, profiling, replay, logs, user feedback) are in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md); release naming and source map concepts shared across platforms are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md); sampling and PII rules shared across platforms are in [PRACTICES.md](PRACTICES.md).

**Contents:** [Versions](#versions) · [Pick the setup path](#pick-the-setup-path) · [Wizard](#wizard) · [Expo SDK 50+ manual setup](#expo-sdk-50-manual-setup) · [Bare React Native manual setup](#bare-react-native-manual-setup) · [Init: full and production](#init-full-and-production) · [Configuration reference](#configuration-reference) · [Integrations](#integrations) · [Source maps and debug symbols](#source-maps-and-debug-symbols) · [EAS build hooks](#eas-build-hooks) · [Expo Go limits](#expo-go-limits) · [Debugging](#debugging) · [Prove it](#prove-it)

## Versions

- **Target `@sentry/react-native` ≥8.0.0.** APIs here reflect ≥6.0.0, with ≥8.0.0 the minimum recommended. Verify against https://docs.sentry.io/platforms/react-native/ before implementing.
- **React Native 0.71+** is required for Fabric renderer support.
- **Android 15+ (16KB page size) crash:** upgrade to `@sentry/react-native` ≥6.3.0.

| Feature | Minimum SDK |
|---|---|
| `attachScreenshot` | 4.11.0 |
| `httpClientIntegration`, `enableCaptureFailedRequests` | 5.3.0 |
| TTID and TTFD | 5.20.0 |
| Profiling (basic) | 5.32.0 |
| JS-only profiling (`platformProfilers: false`) | 5.33.0 |
| Session Replay, `captureFeedback()` | 6.5.0 |
| Feedback widget (`showFeedbackWidget`, `feedbackIntegration`) | 6.9.0 |
| `Sentry.logger`, `enableLogs`, `consoleLoggingIntegration()` | 7.0.0 |
| `logsOrigin` | 7.7.0 |
| Scope attribute setters for logs (`getGlobalScope`, `withScope`) | 7.8.0 |
| UI Profiling | 7.9.0 (Android), 7.12.0 (iOS) |
| `disableAutoUpload`, `sentry.gradle.kts`, `Sentry.NavigationContainer` | 8.13.0 |
| `enableAutoConsoleLogs` | 8.14.0 |
| `Sentry.wrapExpoRouterErrorBoundary` (manual) | 8.16.0 |
| `autoWrapExpoRouterErrorBoundary`, `enableTurboModuleTracking` | 8.17.0 |
| `Sentry.setAttribute`, `Sentry.setAttributes` | 8.17.2 |
| `Sentry.appLoaded()` | 8.x |

- **Breaking change in v7:** `captureUserFeedback()` was removed; use `captureFeedback()` (field `comments` renamed to `message`, `event_id` to `associatedEventId`).
- **Deprecated:** `androidProfilingOptions`; use `_experiments.profilingOptions`.

## Pick the setup path

Detect the project first:

```bash
cat package.json | grep -E '"(react-native|expo|@expo|@sentry/react-native|sentry-expo)"'
ls app.json app.config.js app.config.ts 2>/dev/null
cat package.json | grep '"expo"'
grep -E '"(@react-navigation/native|react-native-navigation)"' package.json
grep -E '"(redux|@reduxjs/toolkit|zustand|mobx)"' package.json
grep -r "Sentry.init" src/ app/ App.tsx App.js _layout.tsx 2>/dev/null | head -5
cat android/app/build.gradle 2>/dev/null | grep -i hermes
cat ios/Podfile 2>/dev/null | grep -i hermes
ls app/_layout.tsx app/_layout.js 2>/dev/null
```

| Signal | Path |
|---|---|
| `expo` in `package.json` | Expo path: config plugin plus `getSentryExpoConfig` |
| Expo SDK ≥50 | `@sentry/react-native` directly |
| Expo SDK 49 or older | `sentry-expo` (legacy, do not use for new work; https://docs.sentry.io/platforms/react-native/manual-setup/expo/) |
| `app.json` has an `"expo"` key | Managed Expo |
| `app/_layout.tsx` present | Expo Router: init goes in `_layout.tsx` |
| No `expo` | Bare / vanilla React Native 0.69+ |
| `@react-navigation/native` | `reactNavigationIntegration` |
| `react-native-navigation` | `reactNativeNavigationIntegration` (Wix) |

- **Expo managed SDK 50+:** wizard, or manual with the config plugin. **Expo bare SDK 50+:** wizard. **Vanilla RN 0.69+:** wizard.
- **Turn on by default:** Error Monitoring (JS exceptions, native crashes on iOS and Android, ANRs, app hangs), Tracing (always for mobile), Session Replay (for a user-facing production app). **Optional:** Profiling, Logging, User Feedback (for a beta or customer-facing app).

## Wizard

- **Command:** `npx @sentry/wizard@latest -i reactNative`. An agent cannot run it: it opens a browser to log in and asks for interactive input. Ask the user to run it.
- **Files it touches:**

| File | Change |
|---|---|
| `package.json` | installs `@sentry/react-native` |
| `metro.config.js` | adds the `@sentry/react-native/metro` serializer |
| `app.json` | adds the `@sentry/react-native/expo` plugin (Expo only) |
| `App.tsx` / `_layout.tsx` | adds `Sentry.init()` and `Sentry.wrap()` |
| `ios/sentry.properties`, `android/sentry.properties` | org, project, URL, auth token |
| `android/app/build.gradle` | Sentry Gradle plugin |
| `ios/[AppName].xcodeproj` | wraps the "Bundle RN" build phase and adds dSYM upload |
| `.env.local` | `SENTRY_AUTH_TOKEN` (add to `.gitignore`) |

## Expo SDK 50+ manual setup

- **Install:** `npx expo install @sentry/react-native`. With no metro config yet, run `npx expo customize metro.config.js`.
- **Metro config:**

```javascript
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const config = getSentryExpoConfig(__dirname, {
  // Auto-wrap Expo Router ErrorBoundary exports at build time (SDK ≥8.17.0)
  autoWrapExpoRouterErrorBoundary: true,
});
module.exports = config;
```

| Metro option | Type | Default | Purpose |
|---|---|---|---|
| `autoWrapExpoRouterErrorBoundary` | boolean | `false` | SDK ≥8.17.0: wrap Expo Router `ErrorBoundary` exports at build time |
| `annotateReactComponents` | boolean | `false` | inject component names (shown in replay, works with Hermes) |
| `includeWebReplay` | boolean | `true` | set `false` for native-only apps |
| `includeWebFeedback` | boolean | `true` | set `false` for native-only apps |
| `enableSourceContextInDevelopment` | boolean | `true` | |

### The Expo config plugin

- **Add the plugin in `app.json`:**

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "YOUR_PROJECT_SLUG",
          "organization": "YOUR_ORG_SLUG",
          "disableAutoUpload": false
        }
      ]
    ]
  }
}
```

| Plugin option | Default | Purpose |
|---|---|---|
| `url` | `"https://sentry.io/"` | Sentry instance |
| `project` | | project slug |
| `organization` | | org slug |
| `disableAutoUpload` | `false` | SDK ≥8.13.0: skip source map and dSYM upload during local builds |

- **Use `app.config.js` to read values from the environment:**

```javascript
export default {
  expo: {
    plugins: [
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: process.env.SENTRY_PROJECT,
          organization: process.env.SENTRY_ORG,
          disableAutoUpload: process.env.NODE_ENV === "development",
        },
      ],
    ],
  },
};
```

- **Set `disableAutoUpload: true` in local development** to speed up builds (SDK ≥8.13.0).
- **Provide `SENTRY_AUTH_TOKEN` as an environment variable for native builds.** Never commit it.
- **The plugin uploads during `eas build` and `expo run:ios/android` (release),** for example `SENTRY_AUTH_TOKEN=sntrys_... npx expo run:ios --configuration Release`.

### Init with Expo Router (`app/_layout.tsx`)

```typescript
import { Stack } from "expo-router";
import { isRunningInExpoGo } from "expo";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "YOUR_SENTRY_DSN",
  sendDefaultPii: true,

  // Tracing
  tracesSampleRate: 1.0, // lower to 0.1-0.2 in production

  // Profiling
  profilesSampleRate: 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Logging (SDK ≥7.0.0)
  enableLogs: true,

  // Session Replay
  integrations: [
    Sentry.mobileReplayIntegration(),
  ],

  enableNativeFramesTracking: !isRunningInExpoGo(), // slow/frozen frames

  environment: __DEV__ ? "development" : "production",
});

function RootLayout() {
  return <Stack />;
}

export default Sentry.wrap(RootLayout);
```

- **Import `isRunningInExpoGo` from `expo`:** `import { isRunningInExpoGo } from "expo"`.
- **Expo Router:** use the current route-specific integration in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md#navigation), not a blanket no-configuration claim. The old source said tracking required no integration; current docs use `Sentry.expoRouterIntegration` and `Sentry.wrapExpoRouter(useRouter())`. [https://docs.sentry.io/platforms/react-native/guides/expo/tracing/instrumentation/expo-router/]
- **Standard Expo (`App.tsx`, no Expo Router):** same init, root wrapped in `<Sentry.NavigationContainer>` and `export default Sentry.wrap(App);`.

### Expo Router ErrorBoundary

- **Expo Router's per-route `ErrorBoundary` swallows render errors by default;** Sentry never sees them unless they are captured.
- **Option 1 (recommended, SDK ≥8.17.0):** `autoWrapExpoRouterErrorBoundary: true` in the metro config. A Babel plugin rewrites `export { ErrorBoundary } from 'expo-router'` in every route file.
- **Option 2 (manual, SDK ≥8.16.0):**

```typescript
// app/_layout.tsx (or any route file)
import { ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
import * as Sentry from '@sentry/react-native';

export const ErrorBoundary = Sentry.wrapExpoRouterErrorBoundary(ExpoErrorBoundary);
```

- **Both capture with route context** (`route.name`, `route.path`, `route.params`), mark the active navigation span as errored and add a breadcrumb. Concrete paths and params respect `sendDefaultPii`.

## Bare React Native manual setup

- **Install:** `npm install @sentry/react-native --save`, then `cd ios && pod install`.
- **Metro config:**

```javascript
const { getDefaultConfig } = require("@react-native/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");

const config = getDefaultConfig(__dirname);
module.exports = withSentryConfig(config, {
  // Set to false to exclude @sentry-internal/replay from the native bundle (web only).
  // includeWebReplay: true,
  // Set to false to exclude @sentry-internal/feedback from the native bundle (web only).
  // includeWebFeedback: true,
  // Auto-wrap Expo Router ErrorBoundary exports at build time (SDK ≥8.17.0, Expo Router only)
  // autoWrapExpoRouterErrorBoundary: true,
});
```

- **iOS bundle phase:** replace (do not append to) the content of the Xcode "Bundle React Native code and images" build phase (RN 0.81.1+):

```bash
set -e
WITH_ENVIRONMENT="../node_modules/react-native/scripts/xcode/with-environment.sh"
SENTRY_XCODE="../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"
/bin/sh -c "$WITH_ENVIRONMENT $SENTRY_XCODE"
```

- **iOS debug symbols:** add a Run Script build phase "Upload Debug Symbols to Sentry" after the bundle phase: `/bin/sh ../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh`.
- **`ios/sentry.properties` and `android/sentry.properties`:** `defaults.url=https://sentry.io/`, `defaults.org=YOUR_ORG_SLUG`, `defaults.project=YOUR_PROJECT_SLUG`, `auth.token=YOUR_ORG_AUTH_TOKEN`.
- **Android Gradle:** in `android/app/build.gradle`, before the `android {}` block: `apply from: "../../node_modules/@sentry/react-native/sentry.gradle.kts"`. SDK ≥8.13.0 uses `sentry.gradle.kts` (Kotlin DSL); older SDKs use `sentry.gradle` (Groovy). Both are backward-compatible.
- **Init:** the same options as Expo, with `dsn: "YOUR_SENTRY_DSN"` and `enableNativeFramesTracking: true`; wrap the root with `Sentry.NavigationContainer` and export `Sentry.wrap(App)`.
- **Alternative entry (`index.js`):** after `Sentry.init`, `AppRegistry.registerComponent(appName, () => Sentry.wrap(App));`.

## Init: full and production

- **Always wrap the root component:** `export default Sentry.wrap(App);`. It is the React render error boundary, records touches as `ui.click` breadcrumbs, is required by the feedback widget, buffers pre-error session data for the feedback widget, and makes App Start end at first mount. Wrap the root registered with `AppRegistry`, not an inner component.
- **Full-featured init:**

```typescript
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  sendDefaultPii: true,
  // Tracing: lower to 0.1-0.2 in high-traffic production
  tracesSampleRate: 1.0,
  // Profiling: runs on a subset of traced transactions
  profilesSampleRate: 1.0,
  // Session Replay: always capture on error, sample 10% of all sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  // Logging: enable Sentry.logger.* API
  enableLogs: true,
  // Integrations: mobile replay is opt-in
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,   // masks text by default for privacy
      maskAllImages: true,
    }),
  ],
  // Native frames tracking (disable in Expo Go)
  enableNativeFramesTracking: true,
  environment: __DEV__ ? "development" : "production",
  // release: "my-app@1.0.0+1",
  // dist: "1",
});
// REQUIRED: Wrap root component to capture React render errors
export default Sentry.wrap(App);
```

- **Production settings:**

```typescript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  // Trace 10-20% of transactions in high-traffic production
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  // Profile 100% of traced transactions (profiling is always a subset of tracing)
  profilesSampleRate: 1.0,
  // Replay all error sessions, sample 5% of normal sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.05,
  // Set release and dist for accurate source map lookup
  release: "my-app@" + Application.nativeApplicationVersion,
  dist: String(Application.nativeBuildVersion),
  // Disable debug logging in production
  debug: __DEV__,
});
```

- **Production sample rates disagree between sources.** The setup guide says traces 0.1 to 0.2 and profiles 1.0; the tracing reference says traces 0.2 or lower; the profiling reference says traces 0.2 with profiles 0.5, and elsewhere profiles ≤0.1 for most apps. Confirm in the current docs.
- **Mark the real end of startup:** `Sentry.appLoaded()` (SDK 8.x), called once async startup work (fetching config, waiting for auth) completes. Without it the SDK estimates app start end automatically.

```typescript
useEffect(() => { fetchConfig().then(() => { Sentry.appLoaded(); }); }, []);
```

## Configuration reference

### Core

| Option | Default | Notes |
|---|---|---|
| `dsn` | | required; SDK disabled if empty; env `SENTRY_DSN` |
| `environment` | | env `SENTRY_ENVIRONMENT` |
| `release` | | e.g. `"my-app@1.0.0+42"`; env `SENTRY_RELEASE` |
| `dist` | | build number or variant, max 64 chars; env `SENTRY_DIST` |
| `sendDefaultPii` | `false` | IP address, cookies, user data |
| `sampleRate` | `1.0` | error event sampling, 0.0 to 1.0 |
| `maxBreadcrumbs` | `100` | oldest discarded |
| `attachStacktrace` | `true` | |
| `attachScreenshot` | `false` | SDK ≥4.11.0 |
| `screenshot` | | masking for screenshots; only effective with `attachScreenshot: true` |
| `attachViewHierarchy` | `false` | |
| `debug` | `false` | never in production |
| `enabled` | `true` | |
| `ignoreErrors`, `ignoreTransactions` | | `string[] \| RegExp[]` |
| `maxCacheItems` | `30` | max offline-cached envelopes |
| `defaultIntegrations` | `true` | |
| `integrations` | | array or function |
| `maxValueLength` | `250` | max string value length |
| `normalizeDepth` | `3` | |
| `normalizeMaxBreadth` | `1000` | |
| `shutdownTimeout` | `2000` | ms to wait for the queue to drain |
| `enableCaptureFailedRequests` | `false` | v5.3.0+ |
| `denyUrls`, `allowUrls` | | match stack frame URLs; mainly for web, can filter native frames but rarely needed |

`screenshot` keys: `maskAllText` (`true`), `maskAllImages` (`true`), `maskedViewClasses` (`[]`, always mask, e.g. `'com.mapbox.maps.MapView'`), `unmaskedViewClasses` (`[]`, always show).

### Native and mobile

| Option | Default | Notes |
|---|---|---|
| `enableNative` | `true` | `false` = JS-only |
| `enableNativeCrashHandling` | `true` | `false` disables native crash capture entirely |
| `enableNativeFramesTracking` | | disable in Expo Go |
| `enableWatchdogTerminationTracking` | `true` | OOM kill and watchdog termination detection, iOS |
| `enableAppHangTracking` | `true` | iOS, tvOS, macOS |
| `appHangTimeoutInterval` | `2` | seconds, iOS |
| `enableAutoPerformanceTracing` | `true` | |
| `enableNdkScopeSync` | `true` | Java to NDK scope sync, Android |
| `attachThreads` | `false` | all threads on crash, Android; has a performance impact |
| `attachAllThreads` | `false` | full stacks for all threads on every event, iOS only, Cocoa SDK ≥9.9.0 |
| `autoInitializeNativeSdk` | `true` | `false` for manual native init |
| `onReady` | | callback after native SDKs initialize |
| `enableNativeNagger` | `true` | warns if native init fails |
| `enableTombstone` | | Android 12+ ApplicationExitInfo; the example sets `true` with the comment "default: false" |
| `enableTurboModuleTracking` | `false` | experimental, SDK ≥8.17.0; native TurboModule perf logger for crash attribution and per-module spans; RN 0.75+ New Architecture only, no-op on Old Architecture |

### Sessions, tracing, replay, logs

| Option | Default | Notes |
|---|---|---|
| `enableAutoSessionTracking` | `true` | |
| `sessionTrackingIntervalMillis` | `30000` | ms in background before the session ends |
| `tracesSampleRate` | `0` per the setup guide, `undefined` per the tracing and profiling references | use `1.0` in dev |
| `tracesSampler` | | overrides `tracesSampleRate` |
| `tracePropagationTargets` | `[/.*/]` | |
| `profilesSampleRate` | `0` per the setup guide, `undefined` per the profiling reference | relative to `tracesSampleRate` |
| `replaysSessionSampleRate`, `replaysOnErrorSampleRate` | `0` per the setup guide; the replay reference lists none | |
| `replaysSessionQuality` | `'medium'` | `'low' \| 'medium' \| 'high'` |
| `enableLogs` | `false` | SDK ≥7.0.0 |
| `enableAutoConsoleLogs` | `true` | SDK ≥8.14.0 |
| `beforeSendLog` | | |
| `logsOrigin` | | `'native' \| 'js' \| 'all'`, SDK ≥7.7.0 |

- **A session begins** when the app comes to the foreground and ends when it stays in the background longer than `sessionTrackingIntervalMillis`. Sessions are sent automatically and give the crash-free session rate and crash-free user rate per release.

### Hooks

- **`beforeSend(event, hint) => event | null`** runs only on JS-layer events, never on native crashes.
- **`beforeSendTransaction(event) => event | null`**, **`beforeBreadcrumb(breadcrumb, hint) => breadcrumb | null`**.
- **`onNativeLog({ level, component, message }) => void`** fires only when `debug: true`.

### Environment variables

| Variable | Use |
|---|---|
| `SENTRY_DSN` | DSN |
| `SENTRY_AUTH_TOKEN` | build-time upload only; never commit, keep in CI secrets, never pass to `Sentry.init()` |
| `SENTRY_ORG`, `SENTRY_PROJECT` | upload target |
| `SENTRY_RELEASE`, `SENTRY_DIST`, `SENTRY_ENVIRONMENT` | event metadata |
| `SENTRY_DISABLE_AUTO_UPLOAD` | set `true` during local builds |
| `EXPO_PUBLIC_SENTRY_DSN` | safe to embed in the client bundle |
| `SENTRY_EAS_BUILD_CAPTURE_SUCCESS`, `SENTRY_EAS_BUILD_TAGS` | EAS build hooks (tags e.g. `{"team":"mobile"}`) |

## Integrations

- **Default integrations, per the setup guide:** `ReactNativeErrorHandlers` (unhandled JS exceptions and promise rejections), `Release`, `Breadcrumbs`, `HttpClient` (HTTP breadcrumbs), `DeviceContext`, `AppContext`, `CultureContext` (locale, timezone), `Screenshot` (with `attachScreenshot: true`), `ViewHierarchy` (with `attachViewHierarchy: true`), `NativeLinkedErrors`, `TurboModuleContext` (attributes native crashes to an RN module and method, e.g. `RNSentry.captureEnvelope`).
- **Default integrations, per the error monitoring reference:** `InboundFilters` (drops by `ignoreErrors`, `denyUrls`, `allowUrls`; ignores `"Script error"` by default), `FunctionToString`, `Breadcrumbs` (patches `console`, `fetch`, `XHR`), `NativeLinkedErrors` (`.cause` chains up to 5 levels), `HttpContext`, `Dedupe` (prevents duplicate consecutive events), `UnhandledRejection`, `ExpoConstants` (Expo only).
- **The two lists disagree on HTTP:** the setup guide lists `HttpClient` as a default that adds breadcrumbs; the error monitoring reference lists `httpClientIntegration` as opt-in, capturing failed (non-2xx) requests as errors. Confirm in the current docs.
- **Opt-in:** `mobileReplayIntegration()`, `reactNavigationIntegration()`, `reactNativeNavigationIntegration()` (Wix), `feedbackIntegration()` (supports `enableShakeToReport`), `deeplinkIntegration()` (deep link URLs as breadcrumbs), `Sentry.httpClientIntegration({ failedRequestStatusCodes: [[400, 599]], failedRequestTargets: ["https://api.myapp.com"] })` (shorthand `enableCaptureFailedRequests: true`), `Sentry.rewriteFramesIntegration({ root: "/" })`.
- **`reactNativeTracingIntegration`:** the tracing reference says it must be added explicitly to enable automatic tracing; the setup guide's init examples omit it. Confirm in the current docs.
- **Customize defaults:**

```typescript
// Disable all defaults (rarely needed)
Sentry.init({ defaultIntegrations: false });

// Disable console breadcrumbs only
Sentry.init({
  integrations: [
    Sentry.breadcrumbsIntegration({
      console: false,  // disable console breadcrumbs
      fetch: true,
      xhr: true,
      sentry: true,
      // Note: `dom` and `history` are web-only, not applicable in React Native
    }),
  ],
});

// Remove a specific integration
Sentry.init({
  integrations: (integrations) =>
    integrations.filter((i) => i.name !== "Breadcrumbs"),
});
```

- **Custom TurboModules:** `turboModuleContextIntegration()` is on by default; configure `{ modules: [...] }` for your own. A native crash inside a tracked method reports `contexts.turbo_module` with the module name and method.

```typescript
import * as Sentry from "@sentry/react-native";
import { NativeModules } from "react-native";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [
    Sentry.turboModuleContextIntegration({
      modules: [
        {
          name: "MyCustomModule",
          module: NativeModules.MyCustomModule,
          // Optional: skip specific methods to avoid tracking overhead
          skipMethods: ["addListener", "removeListeners"],
        },
      ],
    }),
  ],
});
```

## Source maps and debug symbols

Release and dist naming, and why they must match, are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md). Mobile uploads happen inside the native builds:

| Artifact | Uploaded during |
|---|---|
| iOS JS source maps | Xcode build |
| iOS dSYM | Xcode archive / Xcode Cloud |
| Android JS source maps and Hermes `.hbc.map` | Gradle build |
| Android ProGuard/R8 mapping and NDK `.so` | Gradle build |

- **Expo:** the config plugin uploads during `eas build` and release `expo run:ios/android`. Set the token as an EAS secret: `eas secret:create --name SENTRY_AUTH_TOKEN`.
- **Manual upload:** `npx sentry-cli sourcemaps upload --org YOUR_ORG --project YOUR_PROJECT --release "my-app@1.0.0+1" ./dist`.
- **Set `release` and `dist` to match the uploaded bundle,** e.g. `release: "com.myapp@3.2.1+421"`, `dist: "421"`. Mismatched values are why source maps don't resolve.
- **Hermes:** the Gradle plugin handles `.hbc.map`.
- **Profiling and React component names need symbols too:** release iOS builds need dSYMs (bitcode setups take them from App Store Connect), Android needs the ProGuard/R8 mapping, and `Sentry.withProfiler` names are minified without the Gradle/Xcode plugins and source maps (https://docs.sentry.io/platforms/react-native/sourcemaps/).

## EAS build hooks

- **Binaries:** `sentry-eas-build-on-complete`, `sentry-eas-build-on-error`, `sentry-eas-build-on-success`. Register in `package.json` scripts: `"eas-build-on-complete": "sentry-eas-build-on-complete"`. EAS npm hooks: https://docs.expo.dev/build-reference/npm-hooks/.
- **The hook does not share the app's `.env`:** set the DSN with `eas secret:create --name SENTRY_DSN --value "https://...@sentry.io/..."`. It loads env from `@expo/env`, `.env` or `.env.sentry-build-plugin` without overwriting EAS secrets.
- **Optional env:** `SENTRY_EAS_BUILD_CAPTURE_SUCCESS` (by default only errors are reported), `SENTRY_EAS_BUILD_TAGS`, `SENTRY_EAS_BUILD_ERROR_MESSAGE`, `SENTRY_EAS_BUILD_SUCCESS_MESSAGE`.

## Expo Go limits

- **Expo Go is JS-only.** Native crashes, Session Replay, slow and frozen frames, TTID, TTFD, profiling and the feedback widget and shake-to-report work only in native builds (`eas build`, `expo run`, `expo-dev-client` or bare). `captureFeedback()` works in Expo Go too.
- **Guard native-only options with `isRunningInExpoGo()`,** as `enableNativeFramesTracking: !isRunningInExpoGo()` does.

## Debugging

| Symptom | Fix |
|---|---|
| Nothing appears in Sentry | `debug: true` (logs to the Metro console); check DSN and project; ensure `Sentry.wrap(App)` |
| Native crashes missing | build a release build; crashes in debug mode may not forward |
| `pod install` fails | `cd ios && pod install --repo-update` |
| iOS build fails in the Sentry script | the bundle phase script must be replaced, not appended to |
| Node not found in Xcode build | `export NODE_BINARY=$(which node)` or `ln -s $(which node) /usr/local/bin/node` |
| Android build fails after `sentry.gradle.kts` | put `apply from` before `android {}`; use `sentry.gradle` for SDK <8.13.0 |
| Android Gradle 8+ | `sentry-android-gradle-plugin` ≥4.0.0 |
| Source maps not resolving | `release` and `dist` must match the uploaded bundle metadata |
| App crashes on startup after adding Sentry | check Xcode or Logcat; try `enableNative: false` to isolate |
| Duplicate events | multiple `Sentry.init()` calls; `Dedupe` handles sequential, not concurrent, duplicates |
| Too many transactions | `tracesSampleRate: 0.1` or `tracesSampler` |

Feature-specific symptoms (navigation, replay, profiling, logs, feedback) are in [REACT-NATIVE-FEATURES.md](REACT-NATIVE-FEATURES.md#debugging).

The native-session option is `enableAutoSessionTracking` (default true), not the old source's `autoSessionTracking`; retain the documented background interval separately. [https://docs.sentry.io/platforms/react-native/configuration/options/#enableAutoSessionTracking]

## Prove it

- **Errors:** a button that throws `new Error("My first Sentry error!")` produces an issue within seconds; `Sentry.captureMessage("Sentry test message", "info")` arrives too.
- **Native:** in a release build (not Expo Go), a native crash appears after the next launch.
- **Traces:** Traces shows the "main" transaction with child spans.
- **Replays and logs:** Replays shows a session (native build only) and Logs shows `Sentry.logger` entries.
- **Source maps:** the error's JS stack shows original file names and lines, and the event's `release` and `dist` equal the uploaded ones.
- **Secrets:** `SENTRY_AUTH_TOKEN` appears in no committed file and not in `Sentry.init()`.
