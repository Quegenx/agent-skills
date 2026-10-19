# Error tracking

Error tracking captures exceptions as `$exception` events and groups them into issues by fingerprint. Most outcomes come down to three things: whether autocapture is on and the errors your framework swallows are captured by hand, whether minified or compiled code has source maps (or symbols) uploaded so stack traces resolve, and whether the fingerprint is stable, because resolved in-app frames decide which issue an event lands in. Triage, grouping, suppression, alerts, symbolication debugging and linking to traces and replays are in [ERROR-TRIAGE.md](ERROR-TRIAGE.md); the SQL is in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md); replays in [SESSION-REPLAY.md](SESSION-REPLAY.md); logs and traces in [LOGS-AND-APM.md](LOGS-AND-APM.md); vendor-neutral OpenTelemetry in the [observability](../observability/SKILL.md) skill.

**Contents:** [How it works](#how-it-works) · [Install: the order](#install-the-order) · [Web (JavaScript)](#web-javascript) · [React](#react) · [Next.js](#nextjs) · [Node.js](#nodejs) · [Hono](#hono) · [React Native and Expo](#react-native-and-expo) · [Flutter](#flutter) · [Source maps and symbols](#source-maps-and-symbols) · [Fingerprints and issue names](#fingerprints-and-issue-names) · [Exception properties](#exception-properties) · [Monitoring issues](#monitoring-issues) · [Versions and defaults](#versions-and-defaults) · [Prove it](#prove-it)

## How it works

- **A fingerprint groups exceptions into an issue.** Every captured exception gets a fingerprint; each fingerprint links to exactly one issue. Merging issues makes many fingerprints point to one issue (many-to-one).
- **Fingerprint generation order:** (1) exception type; (2) with no resolved stack trace, add the error message; (3) a stack trace with no in-app frames uses the first frame; (4) a stack trace with in-app frames and source maps uses the resolved in-app frames; (5) a stack trace with in-app frames and no source maps uses the first in-app frame. Resolved in-app frames win over unresolved ones.
- **Resolved stack traces are critical for accurate fingerprinting.** If the exception type or message changes between versions, the fingerprint changes.
- **Chained exceptions** (for example in Python) are recorded as the whole chain in one event, with one fingerprint for the chain.
- **Automatic grouping applies only when** no issue grouping rule applies, no merge is configured and no custom fingerprint was set at capture.
- **In-app frames** are stack frames from your application code (not third-party or system code); the UI highlights them.
- **Issue statuses:** `active`, `resolved`, `archived`, `suppressed`.
- **Errors are events,** so event-triggered features (destinations, trend alerts) work for alerting ([ERROR-TRIAGE.md](ERROR-TRIAGE.md#alerts)).
- **Supported platforms:** React, Next.js, Web (JavaScript), Node.js, Python, PHP, Ruby, Ruby on Rails, Go, Elixir, Angular, Svelte, Nuxt, React Native, Flutter, iOS, Android, Hono. This file covers the web, React, Next.js, Node, Hono, React Native and Flutter ones.

## Install: the order

1. **Detect the platform** from dependency files (`package.json`, `pubspec.yaml`, `Podfile`, `Package.swift`, `requirements.txt`, `go.mod`, `Gemfile`, `composer.json`, `mix.exs`) and lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`, `go.sum`, `pubspec.lock`, `Podfile.lock`, `Package.resolved`, `mix.lock`). If PostHog is already installed and initialized, skip to step 4.
2. **Read the platform's docs page** below; for any other platform use posthog.com/docs.
3. **Install the SDK with the package manager's install command.** Do not hand-edit `package.json`.
4. **Enable exception autocapture.**
5. **Add `posthog.captureException()`** (or the platform's equivalent) at error boundaries, catch blocks and critical user flows, for errors that never reach the global handler. Do not alter the fundamental architecture of existing error handling; make additions minimal and targeted.
6. **Upload source maps** (frontend and mobile only).
7. **Set env vars, never hardcode keys.** If the project token is missing, call the MCP `projects-get` tool and read `api_token`; with several projects ask the user; without MCP, ask for the token. Host from `projects-get` `region`: `US` is `https://us.i.posthog.com`, `EU` is `https://eu.i.posthog.com`; otherwise ask "Are you on PostHog US Cloud or EU Cloud?" Do not assume US Cloud.
8. **Verify:** type-check or build, make sure components you created are actually used, and run the linter or prettier only on files you edited, never the whole codebase.

- **A missing PostHog configuration must never break the app.** Read keys as optional settings, guard init and capture behind their presence, and keep build and boot working with no PostHog env set. Not silently: in development or debug builds fail loudly with the language's idiomatic error and the message "<VAR> variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once <VAR> is configured" (with the real variable name). Production stays a no-op.

## Web (JavaScript)

- **Install:** the HTML snippet in `<head>` (also works in Google Tag Manager), or `posthog-js` (`npm install posthog-js`, `yarn add posthog-js`, `pnpm add posthog-js`, `bun add posthog-js`). The snippet loads `/static/array.js` from `api_host.replace(".i.posthog.com","-assets.i.posthog.com")`; its stub methods include `captureException`, `get_session_replay_url` and `startSessionRecording`.

```javascript
import posthog from 'posthog-js'

posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30'
})
```

- **Autocapture is a project setting:** Project settings > **Error tracking** (`https://app.posthog.com/settings/project-error-tracking#exception-autocapture`). On, it captures `$exception` events by wrapping `window.onerror` and `window.onunhandledrejection`.
- **Manual capture:** `posthog.captureException(error, additionalProperties)`.
- **Source maps are required** if you serve minified bundles.
- **Verify** in the activity feed, `https://app.posthog.com/activity/explore`.

## React

- **Install** `posthog-js @posthog/react` (`npm install posthog-js @posthog/react`, or the yarn, pnpm or bun equivalent). Vite env in `.env`: `VITE_POSTHOG_PROJECT_TOKEN=<ph_project_token>`, `VITE_POSTHOG_HOST=https://us.i.posthog.com`.

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PostHogProvider } from '@posthog/react'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
} as const

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN} options={options}>
      <App />
    </PostHogProvider>
  </StrictMode>
)
```

- **`defaults`** applies PostHog's recommended settings for new projects.
- **Access the client** with the `usePostHog` hook inside the provider, or `import posthog from 'posthog-js'` in non-React code.
- **Autocapture:** the same project setting as Web.
- **Error boundary:** the fallback receives `{ error, componentStack, exceptionEvent }`.

```javascript
import { PostHogProvider, PostHogErrorBoundary } from '@posthog/react'
const Layout = () => {
  return (
    <PostHogProvider apiKey="<ph_project_token>">
      <PostHogErrorBoundary
        fallback={<YourFallbackComponent />} // (Optional) Add a fallback component that's shown when an error happens.
      >
        <YourApp />
      </PostHogErrorBoundary>
    </PostHogProvider>
  )
}
const YourFallbackComponent = ({ error, componentStack, exceptionEvent }) => {
  return <div>Something went wrong. Please try again later.</div>
}
```

- **Manual capture:** `posthog.captureException(error, additionalProperties)`.

## Next.js

- **Install** `posthog-js`. Env in `.env.local` and on the hosting provider, with the `NEXT_PUBLIC_` prefix: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`.
- **Next.js 15.3+: `instrumentation-client.ts`.** Then `import posthog from 'posthog-js'` in any `'use client'` component.

```typescript
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-05-30'
})
```

- **App router alternative:** `app/providers.tsx` with `'use client'`, `posthog.init(...)` inside `useEffect(() => {...}, [])`, children wrapped in `PostHogProvider as PHProvider` from `@posthog/react` with `client={posthog}`; wrap it in `app/layout.tsx`.
- **Pages router:** `pages/_app.tsx`, init in `useEffect` with `loaded: (posthog) => { if (process.env.NODE_ENV === 'development') posthog.debug() }`, wrapped in `<PostHogProvider client={posthog}>`.
- **Client exceptions (required):** the autocapture project setting, plus manual `posthog.captureException(error, additionalProperties)`.
- **App router `error.tsx`:**

```typescript
"use client"
import posthog from "posthog-js"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])
  return (
    ...
  )
}
```

- **`app/global-error.tsx`:** the same `useEffect` capture. It must include `html` and `body` tags and renders `<NextError statusCode={0} />` from `next/error`.
- **Pages router:** a custom ErrorBoundary with `componentDidCatch(error, errorInfo) { posthog.captureException(error) }` wrapping `<Component {...pageProps} />` in `_app.tsx`.
- **Server side (required):** `npm install posthog-node --save` and a singleton in `lib/posthog-server.js`. Use it as `posthog.captureException(error, { source: 'test', user_id: 'test-user-123' })`.

```javascript
import { PostHog } from 'posthog-node'
let posthogInstance = null
export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
  return posthogInstance
}
```

- **Server exceptions through `onRequestError` in `instrumentation.js`.** Capture only when `process.env.NEXT_RUNTIME === 'nodejs'`, and read the `distinct_id` from the PostHog cookie. `posthog.debug()` turns on verbose logging.

```javascript
// instrumentation.js
export function register() {
  // No-op for initialization
}
export const onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = require('./lib/posthog-server')
    const posthog = getPostHogServer()
    let distinctId = null
    if (request.headers.cookie) {
      // Normalize multiple cookie arrays to string
      const cookieString = Array.isArray(request.headers.cookie)
        ? request.headers.cookie.join('; ')
        : request.headers.cookie
      const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)
      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
          const postHogData = JSON.parse(decodedCookie)
          distinctId = postHogData.distinct_id
        } catch (e) {
          console.error('Error parsing PostHog cookie:', e)
        }
      }
    }
    await posthog.captureException(err, distinctId || undefined)
  }
}
```

- **Verify** server events at `https://app.posthog.com/activity/events`. A full walkthrough: the Next.js error monitoring tutorial (`/tutorials/nextjs-error-monitoring.md`).

## Node.js

- **Install** `posthog-node`. Init: `new PostHog('<ph_project_token>', { host: 'https://us.i.posthog.com' })`. Events: `client.capture({ distinctId, event, properties })`.
- **Autocapture uncaught exceptions and unhandled rejections** with `{ host: 'https://us.i.posthog.com', enableExceptionAutocapture: true }`.
- **Express handles uncaught exceptions itself,** so autocapture does not work there by default. Add the error handler:

```javascript
import express from 'express'
import { PostHog, setupExpressErrorHandler } from 'posthog-node'
const app = express()
const posthog = new PostHog(POSTHOG_PROJECT_TOKEN)
setupExpressErrorHandler(posthog, app)
```

- **NestJS:** `import { PostHogInterceptor } from 'posthog-node/nestjs'`, then `app.useGlobalInterceptors(new PostHogInterceptor(posthog, { captureExceptions: true }))`. It captures 5xx by default; `captureExceptions: { minStatusToCapture: 400 }` adds 4xx. It uses RxJS `catchError` and re-throws, and reads `X-POSTHOG-SESSION-ID` and `X-POSTHOG-DISTINCT-ID` sent by the frontend's `tracing_headers`.
- **Manual capture:** `posthog.captureException(e, 'user_distinct_id', additionalProperties)` (error, distinct ID, properties).
- **Error tracking needs file system access** to process stack traces. Runtimes without Node.js APIs by default, like Cloudflare Workers, need Node.js compatibility enabled (https://developers.cloudflare.com/workers/runtime-apis/nodejs/#nodejs-compatibility).

## Hono

- **Install** `posthog-node` and export the project token as an env var. Hono reports uncaught exceptions through `app.onError`; flush before responding.

```typescript
import { PostHog } from 'posthog-node'
const posthog = new PostHog(process.env.POSTHOG_TOKEN, { host: 'https://us.i.posthog.com' })
app.onError(async (err, c) => {
  posthog.captureException(err, 'user_distinct_id_with_err_rethrow', {
    path: c.req.path,
    method: c.req.method,
    url: c.req.url,
    headers: c.req.header(),
    // ... other properties
  })
  await posthog.flush()
  // other error handling logic
  return c.text('Internal Server Error', 500)
})
```

## React Native and Expo

- **Install, Expo:** `npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization`. **Bare** (yarn or npm): `posthog-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize`, then `cd ios && pod install`.
- **Provider:** `<PostHogProvider apiKey="<ph_project_token>" options={{ host: "https://us.i.posthog.com" }}>` from `posthog-react-native`; the `usePostHog` hook gives the client.
- **Remote configuration** from the error tracking settings needs SDK 4.35.0 or higher; otherwise configure on the client.

```jsx
export const posthog = new PostHog('<ph_project_token>', {
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      console: ['error', 'warn'],
      nativeCrashes: true, // native iOS/Android crashes (see below)
    },
  },
})
```

| Option | Captures through |
|---|---|
| `uncaughtExceptions` | `ReactNativeGlobal.ErrorUtils.setGlobalHandler` |
| `unhandledRejections` | `ReactNativeGlobal.onunhandledrejection` |
| `console` | Console logs as errors, per `LogLevel` |
| `nativeCrashes` | Native iOS and Android crashes; needs `@posthog/react-native-plugin` and uploaded native symbols |

- **Native crashes need all three:** `@posthog/react-native-plugin` (`npx expo install @posthog/react-native-plugin` on Expo, `npm i @posthog/react-native-plugin` bare; without it native capture is a no-op and JS autocapture still works), the project's **Enable exception autocapture** setting (the same server setting that gates JS autocapture), and native debug symbols uploaded at build time. The source maps guide also lists `androidNdkCrashes` next to `nativeCrashes`.
- **Error boundary:** `PostHogErrorBoundary` from `posthog-react-native` with `fallback={YourFallbackComponent}` and `additionalProperties={{ screen: "home" }}`; the fallback receives `{ error, componentStack }`.
- **Don't combine the boundary with `console` capture:** React logs every error to the console, so render errors are captured twice. Set `errorTracking: { autocapture: { console: [] } }`.
- **Duplicates in dev builds are expected:** in dev mode React sends every error to the global handler even when a boundary caught it.
- **Manual capture:** `posthog.captureException(error)` in a catch.
- **No automatic source map upload on React Native web.**
- **iOS native plugin** supports CocoaPods, hybrid CocoaPods plus SPM, and full SPM. Full SPM was verified only on an iOS-only React Native 0.87.1 app with React Native Community CLI 20.2.0, and needs `@posthog/react-native-plugin` 2.4.0+, Xcode 16+ and an iOS 15.1+ deployment target. It is not verified for Expo or other React Native versions: use CocoaPods or the hybrid path unless you validate full SPM for your setup.

## Flutter

- **Dependency:** `posthog_flutter: ^5.24.0` in `pubspec.yaml`.
- **Android:** `AndroidManifest.xml` meta-data `com.posthog.posthog.PROJECT_TOKEN`, `com.posthog.posthog.POSTHOG_HOST`, `com.posthog.posthog.TRACK_APPLICATION_LIFECYCLE_EVENTS` = true, `com.posthog.posthog.DEBUG` = true. The page's text says to set the minimum Android SDK to 21, but its snippet shows `minSdkVersion 23`; confirm in the current docs.
- **iOS:** `Info.plist` keys `com.posthog.posthog.PROJECT_TOKEN`, `com.posthog.posthog.POSTHOG_HOST`, `com.posthog.posthog.CAPTURE_APPLICATION_LIFECYCLE_EVENTS` (true), `com.posthog.posthog.DEBUG` (true); Podfile `platform :ios, '13.0'`.
- **Web:** the JS snippet in `web/index.html` with `posthog.init('<ph_project_token>', { api_host: 'https://us.i.posthog.com', defaults: '2026-05-30' })`.
- **Events:** `await Posthog().capture(eventName: 'button_clicked', properties: {'button_name': 'signup'});`
- **Autocapture is configured on the client only;** remote configuration is not supported yet.

```dart
final config = PostHogConfig('<ph_project_token>');
// Enable exception autocapture
config.errorTrackingConfig.captureFlutterErrors = true;
config.errorTrackingConfig.capturePlatformDispatcherErrors = true;
config.errorTrackingConfig.captureIsolateErrors = true;
// Requires SDK version 5.22.0 or higher
config.errorTrackingConfig.captureNativeExceptions = true;
config.errorTrackingConfig.captureSilentFlutterErrors = false;
await Posthog().setup(config);
```

| Option | Captures | Notes |
|---|---|---|
| `captureFlutterErrors` | `FlutterError.onError` | |
| `capturePlatformDispatcherErrors` | `PlatformDispatcher.onError` | Not on web |
| `captureIsolateErrors` | Main isolate errors | Not on web |
| `captureNativeExceptions` | Android Java/Kotlin and Apple iOS/macOS/tvOS exceptions | SDK 5.22.0+ |
| `captureSilentFlutterErrors` | Silent Flutter errors | Default `false` |

- **What users see when a widget fails to build** (the red screen in debug, an empty grey box in release) and replacing it with `ErrorWidget.builder`: [../../mobile/flutter-ux/APP-LIFECYCLE.md](../../mobile/flutter-ux/APP-LIFECYCLE.md#replace-the-default-error-view).

- **Manual capture:**

```dart
try {
  // Your awesome code that may throw
  await someRiskyOperation();
} catch (exception, stackTrace) {
  // Capture the exception with PostHog
  await Posthog().captureException(
    error: exception,
    stackTrace: stackTrace,
    properties: {
      'user_action': 'button_press',
      'feature_name': 'data_sync',
    },
  );
}
```

- **In-app frames:** `config.errorTrackingConfig.inAppIncludes.add('package:your_app'); ...inAppExcludes.add('package:third_party_lib'); ...inAppByDefault = true;`. `inAppIncludes` beats `inAppExcludes`; `inAppByDefault` marks frames in-app when their origin can't be determined. Flutter web stack frames are minified by default, so these settings may behave differently or not work there.
- **Not supported:** de-obfuscating Dart stack traces from `--obfuscate` or `--split-debug-info` builds; source code context (only native Android Java/Kotlin errors and Flutter web have it); native C/C++ exceptions on Android (Java/Kotlin only); errors in background isolates.

## Source maps and symbols

- **Compiled or minified code needs source maps.** If they are not publicly hosted, upload them during the build. Python, Ruby and PHP have no source maps: link releases instead (`/docs/error-tracking/link-releases.md`).
- **The wizard** sets up upload for JS and TS frameworks and works for coding agents: `npx @posthog/wizard upload-source-maps`.
- **Platform guides** live at `/docs/error-tracking/upload-source-maps/<platform>.md`: Web, Next.js, Node.js, React, Angular, Nuxt, React Native, Android (upload-mappings), Flutter, Go, iOS, Kotlin Multiplatform (upload-debug-symbols), Rust, Rollup, Webpack, Vite, CLI, GitHub Action.
- **Upload packages:** `@posthog/rollup-plugin`, `@posthog/webpack-plugin`, `@posthog/nextjs-config`, `@posthog/nuxt`, or `posthog-cli` directly. The build plugins call `posthog-cli sourcemap process`.
- **Symbol data types:** `source-and-map` (JS/TS web), `hermes` (React Native), `proguard` (Android), `apple-dsym` (iOS/macOS).

### The CLI

- **Install:** `npm install -g @posthog/cli`, `curl -LsSf https://download.posthog.com/cli | sh`, `brew install posthog/tap/posthog-cli` or `cargo install posthog-cli`.
- **Auth:** `posthog-cli login`, or in CI the env vars `POSTHOG_CLI_HOST` (default `https://us.posthog.com`), `POSTHOG_CLI_PROJECT_ID` and `POSTHOG_CLI_API_KEY` (a personal API key with the `error tracking write` and `organization read` scopes). EU: `posthog-cli --host https://eu.posthog.com [CMD]`. `--dotenv-file .env` loads a file.

```bash
# Inject release and chunk metadata into sourcemaps
posthog-cli sourcemap inject --directory ./path/to/assets
# Upload injected sourcemaps to their release
posthog-cli sourcemap upload --directory ./path/to/assets --release-name my-app --release-version 1.2.3 --build 42
```

- **Check for the `//# chunkId=...` comment** in the minified code after injecting.
- **You must serve the injected assets.** Serving copies from before the inject breaks unminification.
- **For continuous deploys,** set the release name and let the CLI detect the version (the git commit hash). `--delete-after` cleans up the maps.
- **Verify** in the symbol sets (error tracking configuration).

### Next.js

`npm install @posthog/nextjs-config`. It injects and uploads during the build. Set the env vars on Vercel or your host's project settings, not just locally.

```javascript
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig = {
  //...your nextjs config,
};

export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.POSTHOG_API_KEY!, // Personal API Key
  projectId: process.env.POSTHOG_PROJECT_ID, // Project ID
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
  sourcemaps: { // (optional)
      enabled: true, // (optional) Enable sourcemaps generation and upload, default to true on production builds
      releaseName: "my-application", // (optional) Release name, defaults to repository name
      releaseVersion: "1.0.0", // (optional) Release version, defaults to current git commit
      deleteAfterUpload: true, // (optional) Delete sourcemaps after upload, defaults to true
  },
});
```

### Vite and Rollup

- **Plugin:** `npm install @posthog/rollup-plugin`; `import posthog from '@posthog/rollup-plugin'` in the `vite.config.js` plugins with `personalApiKey`, `projectId`, `host` and `sourcemaps: { enabled, releaseName, releaseVersion, deleteAfterUpload }`. The Vite page gives the `host` default as `https://us.i.posthog.com`, while the Next.js config and the CLI default to `https://us.posthog.com`; confirm in the current docs.
- **Production maps:** `build: { sourcemap: "hidden" }`. Hidden maps are fine for upload; they are not advertised through `sourceMappingURL`.

### GitHub Action

`PostHog/upload-source-maps@v2` after the build. Inputs: `directory` (required), `project-id` (required), `api-key` (required; error tracking write plus organization read), `release-name`, `release-version` (default the commit SHA), `host` (EU `https://eu.posthog.com`). Deploy the injected artifacts.

### React Native

- **CLI 0.7.8+.** React Native web: `npx expo export --source-maps --platform web`, then the CLI.
- **Automatic injection only on Expo 50+** (debug IDs), in `metro.config.js`: `const { getPostHogExpoConfig } = require('posthog-react-native/metro'); const config = getPostHogExpoConfig(__dirname)`. Upload runs in the Gradle and Xcode builds; EAS Updates (OTA) need a manual `posthog-cli hermes upload --directory dist`.
- **Expo plugin** `"posthog-react-native/expo"` in `expo.plugins`. Options: `disableSandboxing` (default `true`, sets `ENABLE_USER_SCRIPT_SANDBOXING=NO`); `skipOnConflict` (4.49.1+); `dotenvFile` (4.60.0+, CLI 0.8.4+); `uploadNativeSymbols`, opt-in, for dSYM, ProGuard and NDK `.so` files, `{ includeSource: true }`.
- **Bare React Native:** on Android, `apply from: ... 'tooling', 'posthog.gradle'` above `android {}`; on iOS, wrap the "Bundle React Native code and images" phase with `posthog-xcode.sh` and disable User Script Sandboxing. The error `Sandbox: bash deny(1) file-read-data` points at sandboxing.
- **Native crash symbolication** needs build-time symbols, runtime `errorTracking.autocapture.nativeCrashes` or `androidNdkCrashes`, `@posthog/react-native-plugin`, and the project's "Enable exception autocapture".

### Flutter

- **CLI 0.7.4+.** Flutter web: `flutter build web --source-maps`, then CLI inject and upload.
- **iOS and macOS with `captureNativeExceptions`:** upload dSYMs (the iOS guide). **Android with ProGuard or R8:** upload mapping files with the PostHog Gradle plugin. The Flutter debug symbols guide is `/docs/error-tracking/upload-source-maps/flutter.md`.

When traces still show minified frames, follow [ERROR-TRIAGE.md](ERROR-TRIAGE.md#symbolication).

## Fingerprints and issue names

- **Set a custom fingerprint and the issue's name at capture:**

```javascript
posthog.captureException(error, {
  $exception_fingerprint: "MyCustomGroup",
  $issue_name: "Checkout failures",
  $issue_description: "Payment provider timeouts during checkout",
})
```

- **`$issue_name` and `$issue_description` count only on the event that creates the issue,** truncated to 255 characters; later events keep the existing name. Without them the name is the exception type and the description is the message.
- **A custom fingerprint turns off automatic grouping** for that event. To regroup after the fact use merges or grouping rules ([ERROR-TRIAGE.md](ERROR-TRIAGE.md#grouping-noisy-errors)).

## Exception properties

| Property | Meaning |
|---|---|
| `$exception_types`, `$exception_values`, `$exception_functions`, `$exception_sources` | Arrays of types, messages, function names and files |
| `$exception_handled` | Caught or uncaught |
| `$exception_fingerprint` | The fingerprint |
| `$exception_issue_id` | Raw issue ID (the resolved `issue_id` field follows merges and splits) |
| `$exception_releases` | Release map keyed by release ID, a JSON dict; only when the SDK publishes release metadata. There is no top-level `$release` |
| `$app_version` | The user's app version. Automatic on iOS (`CFBundleShortVersionString`) and React Native (Expo or `react-native-device-info`); not on web, server, Node, Java or Python, where you set it with `register`, a context provider or `before_send` |
| `$lib_version` | The PostHog SDK version, on every event; not a release signal |
| `$session_id`, `$trace_id`, `$span_id` | Links to replay and traces |
| `$device_type`, `$browser`, `$current_url`, `$feature_flag`, `$active_feature_flags` | Context; custom properties are allowed too (for example `params_received`) |

- **Filter on the plural array properties.** Filters match individual elements and take the bare value: `exact "TypeError"`, not `exact '["TypeError"]'`. Operators: `exact`, `is_not`, `icontains`, `not_icontains`, `regex`, `not_regex`.
- **Never filter on the singular `$exception_type`, `$exception_message` or `$exception_stack_trace_raw`.** They appear on a fraction of a percent of events, so a rule on them silently never matches.
- **`$lib` values** are the SDK's own, not npm names: `web` (posthog-js in the browser, not `posthog-js`), `posthog-node`, `posthog-python`, `posthog-ruby`, `posthog-go`, `posthog-php`, `posthog-java`, `posthog-elixir`, `posthog-edge` (Cloudflare Workers and edge), `posthog-ios`, `posthog-android`, `posthog-react-native`, `posthog-flutter`. Confirm with `read-data-schema` (`event_property_values` for `$lib` on `$exception`).

## Monitoring issues

- **Sort** by Last seen, First seen, Occurrences, Users or Sessions. Last seen and occurrences give a general sense; users and sessions show impact once filtered.
- **Search** combines exact property filters and freeform text (AND). Each freeform token must appear in the exception type, message, stack function names or file paths; quotes group tokens. Chained exceptions search all their types, messages, functions and paths as one list.
- **Keep queries fast:** limit the time range (7 days is usually enough); freeform search is faster than property filters; report queries over 30 seconds in-app.
- **Suppress** with status **Suppressed**, and also suppress on the client (`/docs/error-tracking/capture.md#suppressing-exceptions`) to save cost and performance. Server-side rules are in [ERROR-TRIAGE.md](ERROR-TRIAGE.md#suppressing-noisy-errors).
- **Assign, alert and file tickets** from the issue: [ERROR-TRIAGE.md](ERROR-TRIAGE.md#assigning-and-external-issues).

## Versions and defaults

| Value | Where |
|---|---|
| `defaults: '2026-05-30'` | Every posthog-js init (web, React, Next.js, Flutter web) |
| Next.js 15.3+ | `instrumentation-client.ts` |
| `flushAt: 1`, `flushInterval: 0` | Next.js server `posthog-node` client |
| `posthog_flutter: ^5.24.0` | Flutter; `captureNativeExceptions` needs 5.22.0+ |
| posthog-react-native 4.35.0+ | Remote error tracking config |
| `@posthog/react-native-plugin` 2.4.0+ | Full SPM on iOS |
| posthog-cli 0.7.8+ / 0.7.4+ | React Native / Flutter uploads |
| 255 characters | `$issue_name`, `$issue_description` |

## Prove it

- **Capture works:** throw a test error on each platform you installed and see a `$exception` event in the activity feed (`/activity/explore`, server events at `/activity/events`) with the expected `$lib` (`web`, `posthog-node`, `posthog-react-native`, `posthog-flutter`).
- **Swallowed errors arrive:** an error in a Next.js `error.tsx`, an Express route, a Hono handler or a React boundary produces an event, not just a fallback screen.
- **No duplicates:** on React Native with `PostHogErrorBoundary`, one render error in a release build produces one event (`console: []`).
- **Frames resolve:** the minified build has a `//# chunkId=...` comment, the deployed assets are the injected ones, the symbol set appears in Project settings > Error tracking > Symbol sets, and a production error shows your source file names and lines.
- **Missing config is safe:** with no PostHog env set, the app builds and boots; a debug build prints the "variable required by PostHog is missing" error, production stays silent.
