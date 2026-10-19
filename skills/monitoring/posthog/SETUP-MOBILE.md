# Mobile setup

`posthog-react-native` instruments React Native and Expo apps. It queues events on the device and flushes them in batches, keeps an offline file queue, fetches feature flags on each app open and caches them, and autocaptures lifecycle events. React Navigation v7 and Expo Router need manual screen tracking, the app should identify the user as soon as possible (typically after login) and reset on logout, and native features (session replay, native crashes) need the native plugin. Flutter is [SETUP-FLUTTER.md](SETUP-FLUTTER.md). Server SDKs are [SETUP-SERVER.md](SETUP-SERVER.md), the browser is [SETUP-WEB.md](SETUP-WEB.md), naming and identity rules are [EVENTS.md](EVENTS.md), flags are [FEATURE-FLAGS.md](FEATURE-FLAGS.md), replay is [SESSION-REPLAY.md](SESSION-REPLAY.md) and exceptions are [ERROR-TRACKING.md](ERROR-TRACKING.md).

**Contents:** [Install](#install) · [Initialize](#initialize) · [Native plugin and iOS paths](#native-plugin-and-ios-paths) · [Options](#options) · [Screens](#screens) · [Autocapture](#autocapture) · [Events, identity and properties](#events-identity-and-properties) · [before_send](#before_send) · [Flush, offline, opt-out](#flush-offline-opt-out) · [Feature flags](#feature-flags) · [Errors, logs, replay, surveys](#errors-logs-replay-surveys) · [Example apps](#example-apps) · [Upgrading](#upgrading) · [SDK defaults compared](#sdk-defaults-compared) · [Prove it](#prove-it)

## Install

```bash
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
```

```bash
yarn add posthog-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize
# or
npm i -s posthog-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize
```

- **Expo needs no native dependencies** outside supported Expo packages.
- **React Native Web and React Native macOS:** don't use `expo-file-system` (those targets are unsupported); use `@react-native-async-storage/async-storage`.

## Initialize

- **Recommended: `PostHogProvider`** (Context API, enables autocapture) in `App.js` or `App.ts`:

```jsx
// App.(js|ts)
import { usePostHog, PostHogProvider } from 'posthog-react-native'
...

export function MyApp() {
    return (
        <PostHogProvider apiKey="<ph_project_token>" options={{
            // usually 'https://us.i.posthog.com' or 'https://eu.i.posthog.com'
            host: 'https://us.i.posthog.com',
        }}>
            <MyComponent />
        </PostHogProvider>
    )
}
```

- **In components:** `const posthog = usePostHog()`, then `posthog.capture("event_name")` inside `useEffect(..., [posthog])`.
- **Without the provider** (`posthog.ts`), and hand the instance to the provider with `<PostHogProvider client={posthog}>`:

```jsx
import PostHog from 'posthog-react-native'

export const posthog = new PostHog('<ph_project_token>', {
  // usually 'https://us.i.posthog.com' or 'https://eu.i.posthog.com'
  host: 'https://us.i.posthog.com'
})
```

- **Disable in development:** `options={{ disabled: __DEV__ }}`; `usePostHog` is still safe to call. (The prose calls it a "`disable` option"; the code uses `disabled`.)
- **Reverse proxy:** recommended so tracking blockers intercept fewer events; a managed reverse proxy is free for all PostHog Cloud users, alternatives are Cloudflare, AWS CloudFront and Vercel.
- **One project for every product** (marketing site, mobile app, web app) to follow users across platforms.
- **WAF allowlist** (for example for heatmaps): EU `3.75.65.221`, `18.197.246.42`, `3.120.223.253`; US `44.205.89.55`, `52.4.194.122`, `44.208.188.173`. Heatmap screenshots use Browserless, which has its own IPs (`https://docs.browserless.io/baas/troubleshooting/whitelisting-ips`). An allowlist doesn't help apps on private addresses.

## Native plugin and iOS paths

The optional `@posthog/react-native-plugin` adds native features such as session replay and native crash capture.

| Path | When | Steps |
|---|---|---|
| CocoaPods | Default | `cd ios && pod install`; the podspec adds `posthog-ios` (don't add it separately) |
| CocoaPods with `posthog-ios` via SPM | React Native 0.75+, CocoaPods project with dynamic frameworks | Add `{ "posthog.useSpm": "true" }` to `ios/Podfile.properties.json`, `use_frameworks! :linkage => :dynamic` to `ios/Podfile`, then `pod install` |
| Full Swift Package Manager | Plugin 2.4.0+, Xcode 16+, iOS 15.1+ deployment target | Commit or back up first; from `ios` run `npx react-native spm add --deintegrate --yes` (removes the whole CocoaPods integration; don't run `pod install`); every native dependency must support full SPM |

- **Full SPM was verified only** with an iOS-only React Native 0.87.1 app and React Native Community CLI 20.2.0, not Expo or other versions. Use CocoaPods or the hybrid path unless you validate full SPM. The plugin's package manifest has an iOS 15 minimum; CocoaPods and hybrid keep the podspec's iOS 13 minimum.

## Options

| Option | Default | Notes |
|---|---|---|
| `host` | `https://us.i.posthog.com` | Or `https://eu.i.posthog.com`; optional for US |
| `flushAt` | `20` | Events queued before a flush |
| `flushInterval` | `10000` | Milliseconds between periodic flushes |
| `maxBatchSize` | `100` | Must be higher than `flushAt` |
| `maxQueueSize` | `1000` | Memory or local storage; must be higher than `flushAt` |
| `disabled` | `false` | |
| `defaultOptIn` | `true` | `false`: no tracking until `optIn()` |
| `sendFeatureFlagEvent` | `true` | Tracks `getFeatureFlag` calls (experiments) |
| `preloadFeatureFlags` | `true` | |
| `bootstrap` | `{}` | `distinctId`, `isIdentifiedId`, `featureFlags`, `featureFlagPayloads` |
| `disableRemoteFeatureFlags` | `false` | 4.49.0+; never fetch or evaluate flags; `identify()`, `group()`, `reset()` stop triggering `/flags`; supply flags with `bootstrap` and `updateFlags()` |
| `fetchRetryCount` | `3` | |
| `fetchRetryDelay` | `3000` | |
| `requestTimeout` | `10000` | |
| `featureFlagsRequestTimeoutMs` | `10000` | |
| `sessionExpirationTimeSeconds` | `1800` | 30 minutes |
| `persistence` | `file` | `file` uses the best available storage, `customStorage`, `customAsyncStorage` or in-memory; `memory` also exists |
| `customAppProperties` | `null` | Object or function |
| `customStorage` | `null` | Async (`async-storage`, `expo-file-system`) or sync (`mmkv`); ignored when `persistence` is `memory` |
| `captureAppLifecycleEvents` | `true` | Application Installed, Updated, Opened, Became Active, Backgrounded; default since 4.39.0 |
| `disableGeoip` | `false` | Node's default is `true` |
| `enableSessionReplay` | `false` | Android and iOS |
| `sessionReplayConfig` | `null` | |
| `enablePersistSessionIdAcrossRestart` | `false` | Otherwise `$session_id` resets on restart |
| `evaluationContexts` | `undefined` | 4.21.0+; legacy `evaluationEnvironments` 4.10.0+ |
| `addTracingHeaders` | `undefined` | Hostnames (no protocol or path); adds `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` to `fetch` |
| `before_send` | `undefined` | Return `null` to drop |
| `capturePushNotificationSubscriptions` | `true` | Needs the plugin; 4.62.0+ |
| `capturePushNotificationOpened` | `true` | `$push_notification_opened`; needs the plugin; 4.62.0+ |
| `pushIdentityProvider` | `undefined` | Signed identity-verification token; 4.62.0+ |

- **Link app requests to your backend** with tracing headers. Hostnames match exactly and the SDK patches global `fetch`. The Node SDK's `setupExpressRequestContext` reads them ([SETUP-SERVER.md](SETUP-SERVER.md)).

```typescript
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  addTracingHeaders: ['api.example.com'],
})
```

- **Push notifications for Workflows:** `/docs/workflows/push-notifications.md`.

## Screens

| Navigation | Screen tracking |
|---|---|
| `@react-navigation/native` v6 or lower | Automatic with `autocapture` on `PostHogProvider`, which must be a child of `NavigationContainer` |
| React Navigation v7 or higher | Manual: `autocapture={{ captureScreens: false, captureTouches: true }}` and `posthog.screen(currentRouteName, params)` in react-navigation's `trackScreenView` (params from `getCurrentRoute()`); the provider is optional but needed for `captureTouches` |
| `react-native-navigation` | A shared provider wrapping each screen, and `posthog.initReactNativeNavigation(...)` |
| `expo-router` | Manual: follow Expo's screen-tracking guide (`https://docs.expo.dev/router/reference/screen-tracking/`) and call `posthog.screen(pathname, params)` in `useEffect` |

```jsx
export function App() {
    return (
        <NavigationContainer>
            <PostHogProvider apiKey="<ph_project_token>" autocapture>
                {/* Rest of app */}
            </PostHogProvider>
        </NavigationContainer>
    )
}
```

- **React Navigation v7 restricts navigation hooks** (such as `useNavigationState`) to components inside a Screen of a Navigator, so automatic screen tracking may throw when PostHog is initialized outside a screen context (common when upgrading from v6). Set `captureScreens: false` and call `posthog.screen()` in each screen component. A full `onStateChange` example is under [Example apps](#example-apps).
- **`react-native-navigation`:** call `posthog.initReactNativeNavigation({ navigation: { routeToName, routeToProperties }, captureScreens: true })` inside `Navigation.events().registerAppLaunchedListener`.

```jsx
import PostHog, { PostHogProvider } from 'posthog-react-native'
import { Navigation } from 'react-native-navigation';

export const posthog = new PostHog('<ph_project_token>');

export const SharedPostHogProvider = (props: any) => {
  return (
    <PostHogProvider client={posthog} autocapture={{
      captureScreens: false, // Screen events are handled differently for react-native-navigation
      captureTouches: true,
    }}>
      {props.children}
    </PostHogProvider>
  );
};
```

- **Manual screen:** `posthog.screen('dashboard', { background: 'blue', hero: 'superhog' })`; `name` required, `properties` optional.

## Autocapture

- **Events:** Application Opened, Application Became Active, Application Backgrounded, Application Installed, Application Updated, `$screen` (react-navigation v6 and lower, or react-native-navigation), `$autocapture` (touches), `$exception`.
- **Defaults:** lifecycle events on; screen capture on in `PostHogProvider` unless `captureScreens: false`; touch capture off until `captureTouches: true`. Touches on children of `PostHogProvider` capture a view-hierarchy snapshot. Element names come from the component's `displayName` or `name`; override with the `ph-label` prop (`<View ph-label="my-special-label"></View>`).
- **Sensitive views:** `<View ph-no-capture>Sensitive view here</View>`; if it appears anywhere in the view hierarchy, the whole touch event is ignored.

```jsx
<PostHogProvider apiKey="<ph_project_token>" autocapture={{
    captureTouches: true, // Disabled by default
    captureScreens: true, // Enabled by default
    ignoreLabels: [], // Any labels here will be ignored from the stack in touch events
    customLabelProp: "ph-label",
    maxElementsCaptured: 20,
    noCaptureProp: "ph-no-capture",
    propsToCapture: ["testID"], // Limit which props are captured. By default, identifiers and text content are captured.

    navigation: {
        // By default, only the screen name is tracked but it is possible to track the
        // params or modify the name by intercepting the autocapture like so
        routeToName: (name, params) => {
            if (params.id) return `${name}/${params.id}`
            return name
        },
        routeToProperties: (name, params) => {
            if (name === "SensitiveScreen") return undefined
            return params
        },
    },
}}>
    ...
</PostHogProvider>
```

- **Give touchables a `testID`** to identify them in autocapture (`testID="consider-burrito-button"`).

## Events, identity and properties

- **Capture:** `posthog.capture('user_signed_up')`, or with properties `posthog.capture('user_signed_up', { login_type: "email", is_free_trial: true })`. Name events `[object] [verb]` ([EVENTS.md](EVENTS.md)).
- **Identify as soon as possible, typically after login;** all previous anonymous events get linked. `posthog.identify('distinctID', { email: 'user@posthog.com', name: 'My Name' })` (the second argument is `$set`), or explicitly `{ $set: {...}, $set_once: { date_of_first_log_in: '2024-03-01' } }`. The distinct ID is required, typically an email or database ID.
- **Re-identify on session restore** so events are attributed correctly after an app restart (see [Example apps](#example-apps)).
- **`posthog.get_distinct_id()`** returns the generated or identified ID. **Alias:** `posthog.alias('distinct_id')` sets an alias for the current user.
- **Person properties on any event:** `posthog.capture('some_event', { $set: { userProperty: 'value' } })` or `$set_once`; also `setPersonProperties()` and `unsetPersonProperties()`.
- **Super properties persist across sessions** until removed and do not set person properties: `posthog.register({ 'icecream pref': 'vanilla', team_id: 22 })`, `posthog.unregister('icecream pref')`. (Node super properties last only for the client instance's lifetime.)
- **Logout:** `posthog.reset()` resets the user ID and anonymous ID and clears stored super properties. The example apps capture `user_logged_out` before calling it.
- **Group analytics is paid,** not on the open-source or free cloud plan.

## before_send

`before_send` is a client option (the provider's `options` prop or `new PostHog(...)`), a function or an array run in order. Return `null` to drop the event.

```jsx
const IGNORED_SCREENS = new Set(['Splash', 'Debug'])

<PostHogProvider
    apiKey="<ph_project_token>"
    autocapture={{ captureScreens: true }}
    options={{
        host: 'https://us.i.posthog.com',
        before_send: (event) => {
            if (event?.event === '$screen') {
                const screenName = event.properties?.['$screen_name']
                return IGNORED_SCREENS.has(screenName) ? null : event
            }
            return event
        },
    }}
>
    {/* app */}
</PostHogProvider>
```

- **Allowlist instead:** `return TRACKED_SCREENS.has(screenName) ? event : null`.
- **Other patterns:** drop `debug_only_event` by returning `null`; log instead of sending (`console.log(...)`, then `return null`); redact (`event.properties.email = '***'`).
- **Exceptions:** read `event.properties?.['$exception_list']`, set `$exception_fingerprint` for custom grouping, drop by `$exception_type`:

```jsx
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  before_send: (event) => {
    if (event.event === '$exception') {
      const exceptionList = event.properties?.['$exception_list'] || []
      const exception = exceptionList.length > 0 ? exceptionList[0] : null

      if (exception) {
        // Add custom properties
        event.properties['custom_property'] = 'custom_value'

        // Override fingerprint for custom grouping
        event.properties['$exception_fingerprint'] = 'MyCustomGroup'
      }

      // Suppress specific exception types
      if (exception?.['$exception_type'] === 'IgnoredError') {
        return null // Drop the event
      }
    }
    return event
  },
})
```

## Flush, offline, opt-out

- **`flushAt: 1` sends immediately and uses more battery;** the default is 20, `flushInterval` 10000 ms.
- **`await posthog.flush()`** returns the in-progress flush's promise if one is running. Flushing is best-effort and async, not a delivery guarantee.
- **Offline:** capture continues; with `persistence: 'file'` (default) events go to a file-storage queue that persists across app close and flushes on reopen, only when online. At `maxQueueSize` the oldest event is deleted first.
- **Opt in and out:** `posthog.optedOut`, `posthog.optIn()`, `posthog.optOut()`, persisted until called again or `reset`. `{ defaultOptIn: false }` starts opted out. To tell your team apart from users, use Cohorts.

## Feature flags

Flags in depth are [FEATURE-FLAGS.md](FEATURE-FLAGS.md).

- **`useFeatureFlag('key')`** is `undefined` while loading; `useFeatureFlagWithPayload` returns the payload.

```jsx
import { useFeatureFlag } from 'posthog-react-native'

const MyComponent = () => {
    const booleanFlag = useFeatureFlag('key-for-your-boolean-flag')

    if (booleanFlag === undefined) {
        // the response is undefined if the flags are being loaded
        return null
    }

    // Optional use the 'useFeatureFlagWithPayload' hook for fetching the feature flag payload

    return booleanFlag ? <Text>Testing feature</Text> : <Text>Not Testing feature</Text>
}
```

- **Direct calls:** `posthog.isFeatureEnabled(key)`, `posthog.getFeatureFlag(key)` (`undefined` if not loaded or on a problem; a multivariate flag returns a string), payload `posthog.getFeatureFlagResult(key)?.payload`. `posthog.getAllFeatureFlags()` returns `key`, `enabled`, `variant`, `payload` per flag and sends no `$feature_flag_called`.
- **Flags load in the background on every app open** and are stored, so they're available immediately except on the first visit; use `posthog.onFeatureFlags((flags) => { ... })`. Reload with `posthog.reloadFeatureFlagsAsync().then(...)` or `posthog.reloadFeatureFlags()`.
- **Cached flags have no TTL.** Values sit in AsyncStorage indefinitely until a successful API call, so inactive users may see stale values (cached first, then fetched). Fix with `await posthog.reloadFeatureFlagsAsync()` on app start, or `posthog.reset()` for inactive users (`if (lastActiveDate < migrationDate)`).
- **Wrap flag reads in try/catch** (the docs' `handleFeatureFlag(client, flagKey, distinctId)` wraps `client.isFeatureEnabled(flagKey, distinctId)`).
- **Properties for flag evaluation:** `posthog.setPersonPropertiesForFlags({...})` (session-wide, additive, triggers a reload; pass `false` as the second argument to skip it), `resetPersonPropertiesForFlags()`, `setGroupPropertiesForFlags({'company': {...}})`, `resetGroupPropertiesForFlags()`. Group properties attach to the current group (set with `posthog.group()`) and reset on group change. `identify` and `group()` properties are added to flag evaluation automatically. Default IP-based overrides: `$geoip_city_name`, `$geoip_country_name`, `$geoip_country_code`, `$geoip_continent_name`, `$geoip_continent_code`, `$geoip_postal_code`, `$geoip_time_zone`.
- **Bootstrap** identity and flags so they're available immediately, before PostHog has fetched them; once the SDK fetches flags it uses those values instead of the bootstrapped ones:

```jsx
<PostHogProvider
    apiKey="<ph_project_token>"
    options={{
        host: 'https://us.i.posthog.com',
        bootstrap: {
            distinctId: 'distinct_id_of_your_user',
            isIdentifiedId: true,
            featureFlags: {
                'flag-1': true,
                'variant-flag': 'control',
            },
        },
    }}
>
    <MyComponent />
</PostHogProvider>
```

- **Flags from your own backend** (for example posthog-node local evaluation, [SETUP-SERVER.md](SETUP-SERVER.md)): `updateFlags(flags, payloads?, { merge })` replaces by default, `{ merge: true }` merges, values persist across restarts, and `reset()` clears supplied flags (push them again after an identity change).

```jsx
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  // Don't fetch or evaluate flags on-device, we supply them ourselves.
  disableRemoteFeatureFlags: true,
  // Optional: values that must be available at startup, before updateFlags() runs.
  // Without this, reads return their not-loaded defaults until you push flags.
  bootstrap: {
    featureFlags: { 'my-flag': true },
    featureFlagPayloads: { 'my-flag': { color: 'blue' } },
  },
})

// Later: e.g. after login, once your backend has evaluated flags for this user:
posthog.updateFlags(
  { 'my-flag': true, 'my-variant-flag': 'test' },
  { 'my-flag': { color: 'blue' } }
)

posthog.getFeatureFlag('my-variant-flag') // 'test'
posthog.getFeatureFlagResult('my-flag')?.payload // { color: 'blue' }
```

## Errors, logs, replay, surveys

Error tracking in depth is [ERROR-TRACKING.md](ERROR-TRACKING.md); replay is [SESSION-REPLAY.md](SESSION-REPLAY.md).

- **JS autocapture covers only JS and TS exceptions.** Native crashes need `@posthog/react-native-plugin`:

| Option | iOS | Android |
|---|---|---|
| `nativeCrashes` | Every native crash: uncaught Objective-C exceptions, Mach exceptions, signals (`SIGSEGV`, `SIGABRT`), C and C++ | Java and Kotlin only |
| `androidNdkCrashes` | Ignored | C and C++ (NDK) crashes on Android 12 (API 31)+; needs `posthog-react-native` 4.78.0 and `@posthog/react-native-plugin` 2.12.0+ |

```jsx
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  errorTracking: {
    autocapture: {
      nativeCrashes: true,
      androidNdkCrashes: true,
    },
  },
})
```

- **Native capture is gated by the project's "Enable exception autocapture" setting,** and readable traces need native debug symbols uploaded at build time. An NDK crash is captured on the next launch, so its `$app_version` and identity describe that launch, not the crash; the first launch after enabling also captures older NDK crashes the OS still holds.
- **`PostHogErrorBoundary`** takes `fallback` (a component receiving `{ error, componentStack }`) and `additionalProperties`:

```jsx
import { PostHogProvider, PostHogErrorBoundary } from 'posthog-react-native'
import { View, Text } from 'react-native'

const App = () => {
  return (
    <PostHogProvider apiKey="<ph_project_token>">
      <PostHogErrorBoundary
        fallback={YourFallbackComponent}
        additionalProperties={{ screen: "home" }}
      >
        <YourApp />
      </PostHogErrorBoundary>
    </PostHogProvider>
  )
}
```

- **Don't combine `PostHogErrorBoundary` with console capture:** React logs render errors to the console, so they're captured twice. Set `errorTracking: { autocapture: { console: [] } }`.
- **Manual capture:** `posthog.captureException(error, { username: user.username, screen: 'Profile' })`; the second argument is additional properties. The example apps' comment: in production you would typically set up automatic exception capture or use the `before_send` callback for customization.
- **Logs** (`posthog-react-native@4.44.0`+): `posthog.captureLog`, `posthog.logger.{trace,debug,info,warn,error,fatal}`, `posthog.flushLogs`.
- **Session replay:** install the SDK plus the session replay plugin, then follow the instructions to enable Session Replay (`/docs/session-replay/installation/react-native.md`).
- **Surveys:** popover surveys show automatically to matching users. URL and CSS selector targeting are not supported in React Native; such surveys won't appear.
- **Debug:** `<PostHogProvider debug={true} ...>` or `posthog.debug()`.

## Example apps

PostHog's reference apps live in `https://github.com/PostHog/context-mill`: `example-apps/react-native` (bare React Native, React Navigation v7 native stack, env through `react-native-config` embedded at build time) and `example-apps/expo` (Expo SDK 54 managed workflow, React 19 with React Compiler, React Native 0.81, Expo Router 6, New Architecture, Node.js 18+). Both run without a token, with analytics disabled. `.env.example`: `POSTHOG_PROJECT_TOKEN=phc_your_project_token_here`, `POSTHOG_HOST=https://us.i.posthog.com`.

Bare React Native client (`src/config/posthog.ts`):

```ts
import PostHog from 'posthog-react-native'
import Config from 'react-native-config'

// Environment variables are embedded at build time via react-native-config
// Ensure .env file exists with POSTHOG_PROJECT_TOKEN and POSTHOG_HOST
const projectToken = Config.POSTHOG_PROJECT_TOKEN
const host = Config.POSTHOG_HOST || 'https://us.i.posthog.com'
const isPostHogConfigured = projectToken && projectToken !== 'phc_your_project_token_here'

if (!isPostHogConfigured) {
  console.warn(
    'PostHog project token not configured. Analytics will be disabled. ' +
    'Set POSTHOG_PROJECT_TOKEN in your .env file to enable analytics.'
  )
}

export const posthog = new PostHog(projectToken || 'placeholder_key', {
  // PostHog API host (usually 'https://us.i.posthog.com' or 'https://eu.i.posthog.com')
  host,

  // Enable PostHog only when a project token is configured
  disabled: !isPostHogConfigured,

  // Capture app lifecycle events:
  // - Application Installed, Application Updated
  // - Application Opened, Application Became Active, Application Backgrounded
  captureAppLifecycleEvents: true,

  // Enable debug mode in development for verbose logging
  debug: __DEV__,

  // Batching: queue events and flush periodically to optimize battery usage
  flushAt: 20,              // Number of events to queue before sending
  flushInterval: 10000,     // Interval in ms between periodic flushes
  maxBatchSize: 100,        // Maximum events per batch
  maxQueueSize: 1000,       // Maximum queued events (oldest dropped when full)

  // Feature flags
  preloadFeatureFlags: true,        // Load flags on initialization
  sendFeatureFlagEvent: true,       // Track getFeatureFlag calls for experiments
  featureFlagsRequestTimeoutMs: 10000, // Timeout for flag requests (prevents blocking)

  // Network settings
  requestTimeout: 10000,    // General request timeout in ms
  fetchRetryCount: 3,       // Number of retry attempts for failed requests
  fetchRetryDelay: 3000,    // Delay between retries in ms
})

// Export helper to check if PostHog is enabled
export const isPostHogEnabled = isPostHogConfigured
```

React Navigation v7 manual screen tracking, with the provider inside `NavigationContainer` (`navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null)`, `routeNameRef = useRef<string | undefined>()`):

```tsx
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // Store the initial route name
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name
        }}
        onStateChange={() => {
          // Track screen views manually for React Navigation v7
          const previousRouteName = routeNameRef.current
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name

          if (previousRouteName !== currentRouteName && currentRouteName) {
            // Capture screen view event
            posthog.screen(currentRouteName, {
              previous_screen: previousRouteName,
            })
          }

          // Update the stored route name
          routeNameRef.current = currentRouteName
        }}
      >
        <PostHogProvider
          client={posthog}
          autocapture={{
            // Disable automatic screen capture for React Navigation v7
            // We handle screen tracking manually via NavigationContainer.onStateChange
            captureScreens: false,
            // Enable touch event autocapture
            captureTouches: true,
            // Limit which props are captured for touch events
            propsToCapture: ['testID'],
            // Maximum number of elements captured in touch event hierarchy
            maxElementsCaptured: 20,
          }}
        >
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PostHogProvider>
      </NavigationContainer>
```

Expo: the token is read at build time in `app.config.js` `extra` and at runtime through `expo-constants`. (The example's README says the values come from `app.json`; the config file it actually uses is `app.config.js`.)

```js
    extra: {
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    },
    plugins: ['expo-router', 'expo-localization'],
```

```ts
import PostHog from 'posthog-react-native'
import Constants from 'expo-constants'

// Configuration loaded from app.config.js extras via expo-constants
// Environment variables are read at build time in app.config.js
const projectToken = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined
const host = (Constants.expoConfig?.extra?.posthogHost as string) || 'https://us.i.posthog.com'
const isPostHogConfigured = projectToken && projectToken !== 'phc_your_project_token_here'
```

The Expo client then uses the same options as the bare app. Expo Router manual screen tracking in the root layout (`app/_layout.tsx`):

```tsx
export default function RootLayout() {
  const pathname = usePathname()
  const params = useGlobalSearchParams()
  const previousPathname = useRef<string | undefined>(undefined)

  // Manual screen tracking for Expo Router
  // @see https://docs.expo.dev/router/reference/screen-tracking/
  // React Compiler will auto-optimize this effect
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        // Include route params for analytics (filter sensitive data if needed)
        ...params,
      })
      previousPathname.current = pathname
    }
  }, [pathname, params])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.headerBackground} />
        <PostHogProvider
          client={posthog}
          autocapture={{
            captureScreens: false, // Manual tracking with Expo Router
            captureTouches: true,
            propsToCapture: ['testID'],
            maxElementsCaptured: 20,
          }}
        >
          <AuthProvider>
            <Stack ...>
```

Identity in both apps (`AuthContext.tsx`), re-identifying on session restore:

```tsx
          posthog.identify(storedUsername, {
            $set: {
              username: storedUsername,
            },
          })
```

On login: `posthog.identify(username, { $set: { username }, $set_once: { first_login_date: new Date().toISOString() } })`, then `posthog.capture('user_logged_in', { username, is_new_user: isNewUser })`. On logout: `capture('user_logged_out')` before `posthog.reset()`. The apps use the username as the distinct ID.

- **Running them:** `npx expo start`, `npx expo run:ios`, `npx expo run:android`; EAS builds with `npm install -g eas-cli`, `eas build:configure`, `eas build --platform ios`, `eas build --platform android`. Bare app: `cd ios && pod install && cd ..`, `npm run ios` (first build 5-10 minutes), `npm run android` (first build 3-5 minutes). The bare app's troubleshooting: "No `Podfile' found" means run `pod install` from `ios`; signing errors: open `ios/BurritoApp.xcworkspace` in Xcode and pick your team under Signing & Capabilities; "SDK location not found": set `ANDROID_HOME` in your shell profile; Gradle failures: `cd android && ./gradlew clean && cd ..`, then `npm run android`. The Expo app's `.npmrc` sets `legacy-peer-deps=true` and `min-release-age=7`.

## Upgrading

- **V1 used the native `posthog-ios` and `posthog-android`;** newer versions are pure JS with Expo-supported libraries. iOS migrates the persisted `distinctId` and `anonymousId`; Android cannot, so call `identify` at least once on app load for identified users. Anonymous users appear new, and `Application Installed` counts may spike (install is detected by a first-load marker).
- **Init by version:** V1 `await PostHog.setup(...)` is deprecated (`captureApplicationLifecycleEvents` and `captureDeepLinks` no longer supported, `recordScreenViews` replaced); V2 `await Posthog.initAsync(...)`; V3 and V4 `new PostHog(token, { host })`.
- **V4:** `captureAppLifecycleEvents` on by default since 4.39.0 (previously `captureNativeAppLifecycleEvents` or `autocapture={{ captureLifecycleEvents: true }}`); `captureMode: 'json'` and `maskPhotoLibraryImages` are gone; use `setPersonPropertiesForFlags(...)` instead of `personProperties` and `setGroupPropertiesForFlags(...)` instead of `groupProperties`.

## SDK defaults compared

| Setting | Node | React Native | Flutter |
|---|---|---|---|
| `flushAt` | 20 | 20 | 20 |
| `flushInterval` | 5000 ms | 10000 ms | 30 seconds |
| `maxQueueSize` | 10000 (oldest dropped) | 1000 (oldest deleted) | exists, default not stated |
| Flag request timeout | `featureFlagsRequestTimeoutMs` 3000 | `featureFlagsRequestTimeoutMs` 10000 | not stated |
| `disableGeoip` | `true` | `false` | not stated |
| Super properties | `register`/`unregister`, client lifetime (5.25.0+) | `register(obj)`/`unregister(key)`, persist across sessions | `register(key, value)`/`unregister(key)`, persist across sessions |
| Before-send hook | traces only (`beforeSpanSend`) | `before_send` (function or array) | `beforeSend` (list), 5.13.0+ |
| Tracing headers | reads them (`setupExpressRequestContext`, 5.31.0+) | sends them (`addTracingHeaders`) | not stated |

## Prove it

- **Screens arrive:** navigating between two screens produces `$screen` events with the expected names (React Navigation v7 and Expo Router via manual `posthog.screen()`), and nothing throws at startup.
- **Identity:** after login, events carry the user's distinct ID; after an app restart they still do (re-identify on restore); after logout, the logout event is captured before `reset()` and the next events have a new anonymous ID.
- **Debug output:** with `debug` on (`<PostHogProvider debug={true}>` or `posthog.debug()`), captures and flushes show in the logs.
- **Offline:** captures made in airplane mode are delivered after reconnecting or reopening the app.
- **Flags:** `useFeatureFlag` goes from `undefined` to a value; a bootstrapped flag is readable on first launch; a changed flag reaches a returning user after `reloadFeatureFlagsAsync()`.
- **Native crashes (React Native):** with the plugin, `nativeCrashes` on and "Enable exception autocapture" on, a test native crash shows up as `$exception` (an NDK crash on the next launch) with a readable trace (debug symbols uploaded at build time); a render error is captured once, not twice.
