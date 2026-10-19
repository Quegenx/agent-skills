# Flutter setup

`posthog_flutter` (`https://pub.dev/packages/posthog_flutter`) runs on iOS, macOS, Android and Web, with an internal queue and batched async flush. Lifecycle events won't have any special context set by the time the SDK initializes. Self-hosted instances need a public hostname or IP. Session Replay, Surveys and `onFeatureFlags` require manual setup (`AUTO_INIT` off), a web build needs the posthog-js snippet (`Posthog().setup()` is a no-op on web), and there are no `$screen` events without `PosthogObserver`. React Native and Expo are [SETUP-MOBILE.md](SETUP-MOBILE.md), which also compares the defaults of every SDK; servers are [SETUP-SERVER.md](SETUP-SERVER.md), the browser is [SETUP-WEB.md](SETUP-WEB.md), naming and identity rules are [EVENTS.md](EVENTS.md), flags are [FEATURE-FLAGS.md](FEATURE-FLAGS.md), replay is [SESSION-REPLAY.md](SESSION-REPLAY.md) and exceptions are [ERROR-TRACKING.md](ERROR-TRACKING.md).

**Contents:** [Flutter install and init](#flutter-install-and-init) · [Flutter Web](#flutter-web) · [Reproducible Android builds and Shorebird](#reproducible-android-builds-and-shorebird) · [Flutter events and screens](#flutter-events-and-screens) · [Flutter identity](#flutter-identity) · [Flutter feature flags](#flutter-feature-flags) · [Flutter flush, offline, beforeSend, debug](#flutter-flush-offline-beforesend-debug) · [Flutter replay, logs, surveys](#flutter-replay-logs-surveys) · [Prove it](#prove-it)

## Flutter install and init

```yaml
# rest of your code

dependencies:
  flutter:
    sdk: flutter
  posthog_flutter: ^5.26.0

# rest of your code
```

(The library page shows `^5.26.0`; the error-tracking install page shows `^5.24.0`.)

- **Automatic or manual init.** Automatic init reads the token and host from the Android manifest and iOS `Info.plist`. **Session Replay and Surveys require manual setup**, and so does `onFeatureFlags`: set `com.posthog.posthog.AUTO_INIT` to false on Android and iOS, then call `Posthog().setup()` in Dart.

Android (`android/app/src/main/AndroidManifest.xml`), automatic init:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="your.package.name">
    <application>
        <!-- ... other configuration ... -->
        <meta-data android:name="com.posthog.posthog.PROJECT_TOKEN" android:value="<ph_project_token>" />
        <meta-data android:name="com.posthog.posthog.POSTHOG_HOST" android:value="https://us.i.posthog.com" />  <!-- usually 'https://us.i.posthog.com' or 'https://eu.i.posthog.com' -->
        <!-- com.posthog.posthog.CAPTURE_APPLICATION_LIFECYCLE_EVENTS is enabled by default since version 5.23.0 (previously named TRACK_APPLICATION_LIFECYCLE_EVENTS, which still works as an alias) -->
        <meta-data android:name="com.posthog.posthog.DEBUG" android:value="true" />
    </application>
</manifest>
```

- **Android manual init:** `<meta-data android:name="com.posthog.posthog.AUTO_INIT" android:value="false" />`. Either way set `minSdkVersion 23` in `android/app/build.gradle` `defaultConfig`.
- **iOS:** CocoaPods and SPM are supported; Flutter 3.44+ enables SPM by default, otherwise `flutter config --enable-swift-package-manager`. Automatic init uses the same keys in `ios/Runner/Info.plist`: `com.posthog.posthog.PROJECT_TOKEN` (string), `com.posthog.posthog.POSTHOG_HOST` (string `https://us.i.posthog.com`), `com.posthog.posthog.DEBUG` (`<true/>`); `CAPTURE_APPLICATION_LIFECYCLE_EVENTS` is on by default since 5.23.0. Manual: `<key>com.posthog.posthog.AUTO_INIT</key><false/>`. Minimum iOS 13.0: Podfile `platform :ios, '13.0'`, or with SPM and no Podfile, Runner > General > Minimum Deployments = 13.0, then `flutter build ios --config-only`.

Dart manual setup:

```dart
import 'package:flutter/material.dart';

import 'package:posthog_flutter/posthog_flutter.dart';

Future<void> main() async {
  // init WidgetsFlutterBinding if not yet
  WidgetsFlutterBinding.ensureInitialized();
  final config = PostHogConfig('<ph_project_token>');
  config.debug = true;
  // captureApplicationLifecycleEvents is enabled by default since version 5.23.0
  config.host = 'https://us.i.posthog.com';
  await Posthog().setup(config);
  runApp(MyApp());
}
```

## Flutter Web

- **Required if the project has a `web/` directory:** `Posthog().setup()` is a no-op on web, so a web build without the snippet captures nothing. Put the posthog-js web snippet (from `https://us.posthog.com/settings/project#snippet`) in the `<head>` of `web/index.html`, with the project token as a literal string (it's public, the same for every visitor, no build or deploy-time injection). The snippet loads `s.api_host + "/static/array.js"` and ends with:

```html
      posthog.init("<ph_project_token>", {
        api_host: "https://us.i.posthog.com", // 'https://us.i.posthog.com' or 'https://eu.i.posthog.com'
        defaults: "2026-05-30",
      });
```

- **Configure web-only behavior in `posthog.init`:** `bootstrap` is not applied on Flutter web, and replay masking needs `session_recording.canvasCapture.maskRegionsFn` there. posthog-js options are [SETUP-WEB.md](SETUP-WEB.md).

## Reproducible Android builds and Shorebird

The Flutter SDK uses the native PostHog Android SDK (which depends on PostHog core) and permits a range of Android versions, so Gradle can pick newer native versions; `pubspec.lock` does not lock Gradle dependencies. Shorebird patches can't update native Android code, so pin both native libraries before the release.

1. From `android`, run `./gradlew :app:dependencyInsight --dependency com.posthog --configuration releaseRuntimeClasspath` (with flavors, for example `productionReleaseRuntimeClasspath`) and record the `com.posthog:posthog-android` and `com.posthog:posthog` versions (they differ).
2. Add strict constraints in `android/app/build.gradle.kts` (Groovy: `version { strictly "<version>" }`); plain version declarations can still be upgraded in conflict resolution:

```kotlin
dependencies {
    constraints {
        implementation("com.posthog:posthog-android") {
            version { strictly("<android-sdk-version>") }
        }
        implementation("com.posthog:posthog") {
            version { strictly("<core-version>") }
        }
    }
}
```

3. Re-run the report, build, verify events arrive, and commit the constraints and `pubspec.lock`. Use the same versions for the release and its patches.

- **For an existing Shorebird release,** use the versions recorded for that release. Pinning PostHog doesn't freeze other plugins or tools (see Gradle dependency locking). Pins stop automatic native bug fixes; don't upgrade native dependencies in a Dart-only patch, and don't force a version below the package's required minimum.

## Flutter events and screens

```dart
await Posthog().capture(
  eventName: 'user_signed_up',
  properties: {
    'login_type': 'email',
    'is_free_trial': true
  }
);
```

- **Autocaptured:** Application Opened (from closed or from the foreground; React Native reports the second as Became Active), Application Backgrounded, Application Installed, Application Updated, `$screen` (once `PosthogObserver` is added), `$exception`.
- **Screens are not captured automatically:** without `PosthogObserver` there are no `$screen` events. It works with any router that takes navigator observers, and names come from `RouteSettings.name`.

```dart
    // If you're using session replay, `PostHogWidget` has to be the root, and `MaterialApp` must be the child.
    return MaterialApp(
      navigatorObservers: [
        // The PosthogObserver records screen views automatically
        PosthogObserver(),
      ],
      ...
    );
```

- **Name routes:** `settings: const RouteSettings(name: 'Home Screen')`. **go_router:** `GoRouter(routes: [...], observers: [PosthogObserver()])` with `MaterialApp.router(routerConfig: _router)`, and name routes `GoRoute(name: 'Home Screen', ...)`.
- **Shell routes and custom pages** ([FlutterPro](https://flutterpro.design/details/analytics-screen-names), [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#real-screen-names-in-analytics)): a `ShellRoute` or `StatefulShellRoute` branch runs its own inner navigator, so it needs its own `observers` list; with a custom `pageBuilder` you build the page, so set its name too:

```dart
GoRoute(
  path: '/product',
  pageBuilder: (context, state) {
    return MaterialPage(
      name: state.name ?? state.path,
      child: ProductPage(),
    );
  },
),
```

## Flutter identity

Use the stable authenticated ID described in [IDENTITY.md](IDENTITY.md#identify).

- **Identify after login;** previous anonymous events get linked. `Posthog().getDistinctId()`; `await Posthog().alias(alias: 'distinct_id');`.
- **Flutter captures anonymous events by default.** Identified events create a person profile; anonymous events can be up to 4x cheaper, so capture identified events only when needed. `personProfiles`: `PostHogPersonProfiles.identifiedOnly` (recommended, default), `.always`, `.never`. Calling `identify()`, `alias()` or `group()` creates the person profile.

```dart
final config = PostHogConfig('<ph_project_token>');
config.host = 'https://us.i.posthog.com';
config.personProfiles = PostHogPersonProfiles.identifiedOnly;
```

- **Super properties** persist across sessions and are not person properties: `await Posthog().register("team_id", 22);` (key, value), `await Posthog().unregister("team_id");`. On logout, `Posthog().reset()`.
- **Group analytics is paid,** not on the open-source or free cloud plan.

## Flutter feature flags

```dart
final result = await Posthog().getFeatureFlagResult('flag-key');
if (result != null && result.enabled) {
  // Do something differently for this user

  // Optional: fetch the payload from the same evaluation result
  final matchedFlagPayload = result.payload;
}
```

- **Multivariate:** `result.variant == 'variant-key'`.
- **Flags are fetched on each app open and stored,** so they're not available on the first visit. Set `config.onFeatureFlags = () async { if (await Posthog().isFeatureEnabled('flag-key')) {...} };` before `setup` (manual init only). Reload with `await Posthog().reloadFeatureFlags();`.
- **Bootstrap (Flutter SDK 5.31.0+),** set before `setup()`:

```dart
final config = PostHogConfig('<ph_project_token>');
config.host = 'https://us.i.posthog.com';
config.bootstrap = PostHogBootstrapConfig(
  distinctId: 'distinct_id_of_your_user',
  isIdentifiedId: true,
  featureFlags: {
    'flag-1': true,
    'variant-flag': 'control',
  },
);
await Posthog().setup(config);
```

- **Bootstrap identity** is forwarded to the native SDKs and applies during setup, so `Application Installed` carries your ID. Anonymous bootstrap (`isIdentifiedId: false`, the default) seeds only when no anonymous ID is persisted and the user isn't identified. Identified bootstrap: a fresh install seeds the distinct ID, marks it identified and generates a separate device ID; a returning install with a matching anonymous ID is marked identified without `$identify`; a different anonymous ID is merged via `identify()` when person profiles are enabled (emits `$identify` unless opted out); a different, already-identified person is left untouched. With person profiles `never`, a different anonymous identity is preserved, not merged. `sessionID` bootstrap is not supported.
- **Bootstrapped flags** are served until the first `/flags` response, then replaced entirely. Only enabled flags are seeded (`true` or a non-empty variant); `false` and empty values are dropped (matching posthog-js). Payloads go in `featureFlagPayloads`. Values must be JSON-serializable, are cleared on `reset()`, and the flags-loaded signal fires once they're applied. Not applied on Flutter web.
- **Properties for flag evaluation** avoid the stale-value race after a `$set`. By default each call reloads flags and its Future completes after the reload; pass `reloadFeatureFlags: false` to batch. Reset with `resetPersonPropertiesForFlags()` and `resetGroupPropertiesForFlags()`.

```dart
// Person properties: included in the next flag evaluation request
await Posthog().setPersonPropertiesForFlags({
  'storefront_country': 'US',
  'is_beta_user': true,
});

// Group properties
await Posthog().setGroupPropertiesForFlags('company', {'plan': 'enterprise'});
```

## Flutter flush, offline, beforeSend, debug

- **`flushAt` default 20** (`1` sends immediately and uses more battery); **`flushInterval` default 30 seconds**:

```dart
final config = PostHogConfig('<ph_project_token>');
config.flushAt = 20;
config.flushInterval = const Duration(seconds: 30);
```

- **`await Posthog().flush();`** is best-effort and async, not a delivery guarantee.
- **Offline (Android and Apple):** a file-storage queue up to `maxQueueSize`, oldest deleted first, flushed when the app restarts and is online.
- **Opt out:** `await Posthog().disable();` (doesn't remove events already captured), `await Posthog().enable();`, `await Posthog().isOptOut();`.
- **`beforeSend` (since 5.13.0)** is a list of functions; return `null` to drop (`if (event.event == 'ignored_event') return null;`).

```dart
config.beforeSend = [
  (event) {
    // Redact email from properties
    if (event.properties?['email'] != null) {
      event.properties?['email'] = '***@***.***';
    }
    return event;
  },
];
```

```dart
const ignoredScreens = {'Splash', 'Debug'};

config.beforeSend = [
  (event) {
    final screenName = event.properties?['$screen_name'];
    if (event.event == '$screen' && ignoredScreens.contains(screenName)) {
      return null;
    }
    return event;
  },
];
```

- **`beforeSend` sees only Dart-API events:** `Posthog().capture()`, `Posthog().screen()` (`$screen`), `Posthog().captureException()` (`$exception`). It does not intercept native-initiated events (session replay `$snapshot`, lifecycle events like `Application Opened`), and it sees only user-provided properties: system properties (`$device_type`, `$session_id`) are added later by the native SDK.
- **Debug:** `config.debug = true;` (commonly only in development, through environment variables), or `await Posthog().debug(true);` / `await Posthog().debug(false);`.

## Flutter replay, logs, surveys

Replay in depth is [SESSION-REPLAY.md](SESSION-REPLAY.md).

- **Session replay on Flutter Web, Android and iOS:** enable "Record user sessions" in project settings and the `sessionReplay` option (manual init). With replay, `PostHogWidget` must be the root and `MaterialApp` its child. Flutter Web also needs Canvas capture enabled in project settings, since Flutter renders to a canvas. On web, masking (`maskAllTexts`, `maskAllImages`, `PostHogMaskWidget`) applies inside the canvas when `session_recording.canvasCapture.maskRegionsFn` is declared in `posthog.init` in `web/index.html` (Flutter SDK 5.34.0+ and posthog-js 1.408.0+).
- **Logs:** `Posthog().logger.{trace,debug,info,warn,error,fatal}` and `Posthog().captureLog`, with batching, offline persistence and a rate cap built in.
- **Surveys** on Web, iOS and Android; popover surveys show automatically (manual init).
- **Push notifications for Workflows:** `/docs/workflows/push-notifications.md`.

## Prove it

- **Screens arrive:** navigating between two named routes produces `$screen` events with those names, through `PosthogObserver` on `MaterialApp` or `GoRouter`.
- **Identity:** after login, events carry the user's distinct ID; after `Posthog().reset()` on logout, they don't.
- **Debug output:** with `config.debug = true` or `await Posthog().debug(true)`, captures and flushes show in the logs.
- **Offline:** captures made while offline on Android or iOS are delivered after the app restarts online.
- **Manual init where needed:** with replay, surveys or `onFeatureFlags` in use, `com.posthog.posthog.AUTO_INIT` is `false` in both `AndroidManifest.xml` and `Info.plist`, and `Posthog().setup()` runs in `main()`.
- **Flutter Web:** a web build sends events (the `web/index.html` snippet is present), and an iOS or Android build of the same app sends them through `Posthog().setup()`.
- **Replay:** `PostHogWidget` is the root with `MaterialApp` its child, a recording appears for a test session, and on web the masked widgets are masked inside the canvas.
- **Pinned Android natives:** `./gradlew :app:dependencyInsight --dependency com.posthog --configuration releaseRuntimeClasspath` shows the strictly pinned versions for the release and every Shorebird patch.
