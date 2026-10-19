# Error tracking

Error tracking captures exceptions as `$exception` events and groups them into issues by fingerprint. Most outcomes come down to three things: whether autocapture is on and the errors your framework swallows are captured by hand, whether minified or compiled code has source maps (or symbols) uploaded so stack traces resolve, and whether the fingerprint is stable, because resolved in-app frames decide which issue an event lands in. Triage, grouping, suppression, alerts, symbolication debugging and linking to traces and replays are in [ERROR-TRIAGE.md](ERROR-TRIAGE.md); the SQL is in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md); replays in [SESSION-REPLAY.md](SESSION-REPLAY.md); logs and traces in [LOGS-AND-APM.md](LOGS-AND-APM.md); vendor-neutral OpenTelemetry in the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill.

**Contents:** [How it works](#how-it-works) · [Install: the order](#install-the-order) · [Web (JavaScript)](#web-javascript) · [React](#react) · [Next.js](#nextjs) · [Node.js](#nodejs) · [Hono](#hono) · [React Native and Expo](#react-native-and-expo) · [Flutter](#flutter) · [Source maps and symbols](SOURCE-MAPS.md#source-maps-and-symbols) · [Fingerprints and issue names](#fingerprints-and-issue-names) · [Exception properties](#exception-properties) · [Monitoring issues](#monitoring-issues) · [Versions and defaults](#versions-and-defaults) · [Prove it](#prove-it)

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

- **Missing configuration:** follow [the setup commandment](SETUP-WEB.md#the-commandments).

## Web (JavaScript)

- **SDK installation and initialization:** [SETUP-WEB.md](SETUP-WEB.md).

- **Autocapture is a project setting:** Project settings > **Error tracking** (`https://app.posthog.com/settings/project-error-tracking#exception-autocapture`). On, it captures `$exception` events by wrapping `window.onerror` and `window.onunhandledrejection`.
- **Manual capture:** `posthog.captureException(error, additionalProperties)`.
- **Source maps are required** if you serve minified bundles.
- **Verify** in the activity feed, `https://app.posthog.com/activity/explore`.

## React

- **SDK setup:** [React with Vite](SETUP-WEB.md#react-with-vite).

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

- **Browser initialization and router alternatives:** [SETUP-NEXTJS.md](SETUP-NEXTJS.md#client). The error-tracking reference also describes provider-based App router and Pages router initialization; those alternatives are preserved in the setup guide.

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
- **Server side (required):** `npm install posthog-node --save` and a singleton in `lib/posthog-server.js`. Use the [Node signature](#nodejs): the second argument is the user's distinct ID and extra properties are the third argument. The old Next.js line put a properties object in argument two. [PostHog, https://posthog.com/docs/references/posthog-node?filter=error-tracking]

The lazy `getPostHogServer` factory is in [SETUP-NEXTJS.md](SETUP-NEXTJS.md#request-error-server-factory).

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

- **Node SDK installation and initialization:** [SETUP-SERVER.md](SETUP-SERVER.md).
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

- **SDK install and provider setup:** [SETUP-MOBILE.md](SETUP-MOBILE.md).

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

- **Flutter SDK installation and initialization:** [SETUP-FLUTTER.md](SETUP-FLUTTER.md). This error-tracking reference specifies `posthog_flutter: ^5.24.0`; native exception capture requires 5.22.0+.
- **Android minimum conflict in the error-tracking source:** its text says 21 while its snippet says `minSdkVersion 23`; confirm against the current platform reference. General platform metadata, iOS deployment and web setup are owned by [SETUP-FLUTTER.md](SETUP-FLUTTER.md).
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

- **What users see when a widget fails to build** (the red screen in debug, an empty grey box in release) and replacing it with `ErrorWidget.builder`: [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#replace-the-default-error-view).

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

See [SOURCE-MAPS.md](SOURCE-MAPS.md#source-maps-and-symbols).

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
- **Missing config is safe:** with no PostHog env set, the app builds and boots; a debug build prints the "variable required by PostHog is missing" error, production stays silent.
