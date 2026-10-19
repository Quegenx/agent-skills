# Flutter and Dart

Sentry's Flutter SDK (`sentry_flutter`) captures errors, traces, profiles, session replays, logs and metrics on Android, iOS, macOS, Linux, Windows and Web; plain Dart programs (CLI, server) use the `sentry` package. Most outcomes come down to three things: `SentryFlutter.init()` is awaited in an async `main()` with the app wrapped in `SentryWidget`, the build is obfuscated with its debug symbols uploaded by `sentry_dart_plugin` (or stack traces are unreadable), and the feature you want actually runs on the target platform and build mode (replay is iOS and Android only, profiling iOS and macOS only, and several native features work only in release builds). This file covers setup, debug symbols, configuration, errors and the ecosystem packages; tracing, profiling, replay, logs and metrics are in [FLUTTER-FEATURES.md](FLUTTER-FEATURES.md). Releases and source maps across SDKs are in [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md); sampling, PII and noise rules in [PRACTICES.md](PRACTICES.md); vendor-neutral OpenTelemetry in the `observability` skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)).

**Contents:** [Versions](#versions) · [What to set up](#what-to-set-up) · [Detect the project](#detect-the-project) · [Platform support](#platform-support) · [Setup](#setup) · [Debug symbols](FLUTTER-SYMBOLS.md#debug-symbols) · [Configuration](#configuration) · [Errors](#errors) · [Release health](#release-health) · [Ecosystem integrations](#ecosystem-integrations) · [Connect a backend](#connect-a-backend) · [Debugging](#debugging) · [Prove it](#prove-it)

## Versions

- **The baseline is `sentry_flutter` 9.14.0** ("current stable, February 2026"), while the tracing reference documents a 9.19.0 default change (FLUTTER-FEATURES.md). Always verify against `https://docs.sentry.io/platforms/flutter/` before implementing.
- **The current docs target `sentry_flutter` v10,** which needs Flutter 3.44.0 and Dart 3.12.0+, Android API 26+ (`minSdk` 26), iOS 15.0 / macOS 12.0+ with Swift Package Manager enabled (CocoaPods can't install v10), and `jni >=1.0.0 <1.1.0`. Review the migration guide before upgrading to v10. Several defaults below changed in v10 (trace lifecycle, logs, metrics API); FLUTTER-FEATURES.md flags each one.
- **`sentry_flutter` 9.0.0 and later need Dart 3.5 or newer.** `pub get` failing with a Dart SDK too old means `flutter upgrade`.
- **Feature minimums:** errors 7.0.0 (tombstone and trace sync 9.14.0), user-interaction tracing 6.17.0, routing TTID/TTFD 9.1.0, profiling 7.12.0, session replay 9.0.0, structured logs 9.5.0 (docs: 9.0.0), attributes 9.9.0, `sentry_supabase` 9.9.0, W3C `traceparent` 9.7.0, `captureNativeFailedRequests` and trace-connected metrics 9.11.0.

The retained manual setup/full/production source examples below target SDK 9.x (the vendor baseline is 9.14.0), including enableLogs and legacy transaction profiling. Do not paste them unchanged into SDK 10: use its stated prerequisites and the [versioned feature contracts](FLUTTER-FEATURES.md). The source examples' enableLogs flag is removed in 10. [getsentry/sentry-for-ai, sentry-flutter-sdk; https://docs.sentry.io/platforms/dart/guides/flutter/logs/]

## What to set up

- **Lead with a proposal, not open questions.** Always set up Error Monitoring, Tracing and Session Replay (replay on iOS and Android only). Offer Profiling (iOS and macOS, alpha), Logging (`Sentry.logger.*` and `sentry_logging`) and Metrics as options. Sample: "For your Flutter app targeting iOS/Android, I recommend Error Monitoring + Tracing + Session Replay. Want me to also add Logging and Profiling (iOS/macOS alpha)?"
- **Crons are not available** in the Flutter/Dart SDK; use a server-side SDK.

## Detect the project

```bash
# Detect Flutter project type and existing Sentry
cat pubspec.yaml | grep -E '(sentry|flutter|dart)'

# Check SDK version
cat pubspec.yaml | grep -A2 'environment:'

# Check for existing Sentry initialization
grep -r "SentryFlutter.init\|Sentry.init" lib/ 2>/dev/null | head -5

# Detect navigation library
grep -E '(go_router|auto_route|get:|beamer|routemaster)' pubspec.yaml

# Detect HTTP client
grep -E '(dio:|http:|chopper:)' pubspec.yaml

# Detect database packages
grep -E '(sqflite|drift|hive|isar|floor)' pubspec.yaml

# Detect state management (for integration patterns)
grep -E '(flutter_bloc|riverpod|provider:|get:)' pubspec.yaml

# Detect GraphQL
grep -E '(graphql|ferry|gql)' pubspec.yaml

# Detect Firebase
grep -E '(firebase_core|supabase)' pubspec.yaml

# Detect backend for cross-link
ls ../backend/ ../server/ ../api/ 2>/dev/null
find .. -maxdepth 3 \( -name "go.mod" -o -name "requirements.txt" -o -name "Gemfile" -o -name "*.csproj" \) 2>/dev/null | grep -v flutter | head -10

# Detect platform targets
ls android/ ios/ macos/ linux/ windows/ web/ 2>/dev/null
```

| Finding | Then |
|---|---|
| `sentry_flutter` already in `pubspec.yaml` | Skip install, go to feature config |
| Dart SDK below 3.5 | Upgrade first; `sentry_flutter` 9.0.0+ needs it |
| `go_router` or `auto_route` | Use `SentryNavigatorObserver` with the router patterns in FLUTTER-FEATURES.md |
| `dio` | Add `sentry_dio` |
| `sqflite`, `drift`, `hive`, `isar` | Add the matching `sentry_*` package |
| `android/` and `ios/` | Full mobile feature set |
| `web/` only | No Session Replay, no Profiling |
| `macos/` | Profiling available (alpha) |
| A backend directory | [Connect a backend](#connect-a-backend) |

## Platform support

| Feature | Platforms | Notes |
|---|---|---|
| Session Replay | iOS, Android | Not on macOS, Linux, Windows, Web |
| Profiling | iOS, macOS | Alpha; not on Android, Linux, Windows, Web |
| Native crashes | iOS, Android, macOS | NDK and signal handling; Linux, Windows and Web capture Dart exceptions only |
| App Start metrics | iOS, Android | Not on desktop or web |
| Slow and frozen frames | iOS, Android, macOS | Not on Linux, Windows, Web |
| Crons | None | Not available in the Flutter/Dart SDK |

- **Test native features in release builds.** Native crashes, session replay, slow and frozen frames and app start metrics only fully work in release builds on iOS and Android: debug mode runs the Dart VM with JIT, so native integrations behave differently. Use `flutter run --release` on a real device or emulator.

## Setup

| Project | Path |
|---|---|
| Any Flutter app | A: the wizard (handles pubspec, init, symbol upload) |
| Manual preferred | B: `pubspec.yaml` plus `main.dart` |
| Dart only (CLI, server) | C: the plain `sentry` package |

### A: the wizard

- **The user runs it, not the agent:** it opens a browser to log in and needs interactive input. `brew install getsentry/tools/sentry-wizard && sentry-wizard -i flutter`, or `npx @sentry/wizard@latest -i flutter` (standalone binaries v5.1.0 for Windows, macOS, Linux).
- **The v10 docs describe different files:** the wizard adds `sentry_flutter` and `sentry_dart_plugin` to `pubspec.yaml`, creates a gitignored `sentry.properties` holding a Sentry CLI auth token (not `.sentryclirc`), patches `main.dart` with `SentryFlutter.init`, and adds a sample exception to remove after verifying. The vendor skill's table below lists `.sentryclirc` instead.
- **It picks the org and project, then edits:**

| File | Change | Purpose |
|---|---|---|
| `pubspec.yaml` | Adds `sentry_flutter` and a `sentry:` config block | SDK and symbol upload config |
| `lib/main.dart` | Wraps `main()` with `SentryFlutter.init()` | Initialization |
| `android/app/build.gradle` | Adds a Proguard config reference | Android obfuscation support |
| `.sentryclirc` | Auth token, org and project | Symbol upload credentials |

### B: manual Flutter app

- **Install:** `flutter pub add sentry_flutter`, or add `sentry_flutter: ^9.14.0` under `dependencies:` and run `flutter pub get`.
- **Initialize in `lib/main.dart`.** `main()` must be `async` and must `await SentryFlutter.init(...)`, and `SentryWidget` must wrap the root widget (screenshots, replay and user interaction tracing need it):

```dart
import 'package:flutter/widgets.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_SENTRY_DSN';
      options.sendDefaultPii = true;

      // Tracing
      options.tracesSampleRate = 1.0; // lower to 0.1-0.2 in production

      // Profiling (iOS and macOS only, alpha)
      options.profilesSampleRate = 1.0;

      // Session Replay (iOS and Android only)
      options.replay.sessionSampleRate = 0.1;
      options.replay.onErrorSampleRate = 1.0;

      // Structured Logging (SDK ≥9.5.0)
      options.enableLogs = true;

      options.environment = const bool.fromEnvironment('dart.vm.product')
          ? 'production'
          : 'development';
    },
    // REQUIRED: wrap root widget to enable screenshots, replay, user interaction tracing
    appRunner: () => runApp(SentryWidget(child: MyApp())),
  );
}
```

- **Add `SentryNavigatorObserver()`** to `navigatorObservers` of `MaterialApp` or `CupertinoApp`, and always name your routes (FLUTTER-FEATURES.md).
- **Then upload debug symbols** ([Debug symbols](FLUTTER-SYMBOLS.md#debug-symbols)).

### C: Dart only (CLI or server)

```yaml
# pubspec.yaml
dependencies:
  sentry: ^9.14.0
```

```dart
import 'package:sentry/sentry.dart';

Future<void> main() async {
  await Sentry.init(
    (options) {
      options.dsn = 'YOUR_SENTRY_DSN';
      options.tracesSampleRate = 1.0;
      options.enableLogs = true;
    },
    appRunner: myApp,
  );
}
```

### Every option in one init

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_SENTRY_DSN';
      options.sendDefaultPii = true;

      // Environment: detect release builds via dart.vm.product
      options.environment = const bool.fromEnvironment('dart.vm.product')
          ? 'production'
          : 'development';

      // Release is auto-set on iOS/Android as "packageName@version+build"
      // Override if needed:
      // options.release = 'my-app@1.0.0+42';

      // Error sampling: reduce to drop a fraction of errors in high-volume production
      options.sampleRate = 1.0;

      // Tracing: lower to 0.1-0.2 in high-traffic production
      options.tracesSampleRate = 1.0;

      // Profiling: iOS and macOS only (alpha); relative to tracesSampleRate
      options.profilesSampleRate = 1.0;

      // Session Replay: iOS and Android only (SDK ≥9.0.0)
      options.replay.sessionSampleRate = 0.1;   // record 10% of all sessions
      options.replay.onErrorSampleRate = 1.0;   // always record error sessions

      // Privacy defaults: all text and images masked
      options.privacy.maskAllText = true;
      options.privacy.maskAllImages = true;

      // Structured logging (SDK ≥9.5.0)
      options.enableLogs = true;

      // Attachments
      options.attachScreenshot = true;          // screenshot on error
      options.attachViewHierarchy = true;       // widget tree on error

      // HTTP client
      options.captureFailedRequests = true;     // auto-capture HTTP errors
      options.maxRequestBodySize = MaxRequestBodySize.small;

      // Android specifics
      options.anrEnabled = true;                // ANR detection
      options.enableNdkScopeSync = true;        // sync scope to native
      options.enableTombstone = false;          // Android 12+ tombstone (opt-in)

      // Navigation (Time to Full Display, opt-in)
      options.enableTimeToFullDisplayTracing = true;
    },
    appRunner: () => runApp(SentryWidget(child: MyApp())),
  );
}
```

### Production values

```dart
Future<void> main() async {
  final isProduction = const bool.fromEnvironment('dart.vm.product');

  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.environment = isProduction ? 'production' : 'development';

      // Trace 10% of transactions in high-traffic production
      options.tracesSampleRate = isProduction ? 0.1 : 1.0;

      // Profile 100% of traced transactions (profiling is always a subset)
      options.profilesSampleRate = 1.0;

      // Replay all error sessions, sample 5% of normal sessions
      options.replay.onErrorSampleRate = 1.0;
      options.replay.sessionSampleRate = isProduction ? 0.05 : 1.0;

      // Disable debug logging in production
      options.debug = !isProduction;
    },
    appRunner: () => runApp(SentryWidget(child: MyApp())),
  );
}
```

- **Production `profilesSampleRate` conflicts between sources:** the setup guide's production block above uses `1.0` ("Profile 100% of traced transactions"); the profiling reference says values above 0.1 are not recommended without performance validation on your minimum supported device and to start at `0.05`.

## Debug symbols

Use the shared debug symbols guidance in [FLUTTER-SYMBOLS.md](FLUTTER-SYMBOLS.md#debug-symbols). [getsentry/sentry-for-ai, SDK references]

## Configuration

### Core

| Option | Type | Default | Purpose |
|---|---|---|---|
| `dsn` | string | none | Required. Env `SENTRY_DSN` via `--dart-define` |
| `environment` | string | none | Env `SENTRY_ENVIRONMENT` |
| `release` | string | Auto on iOS/Android | `"packageName@version+build"`. Env `SENTRY_RELEASE` |
| `dist` | string | none | Max 64 chars. Env `SENTRY_DIST` |
| `sendDefaultPii` | bool | `false` | IP address, user labels, widget text in replay |
| `sampleRate` | double | `1.0` | Error event sampling (0.0 to 1.0) |
| `maxBreadcrumbs` | int | `100` | Breadcrumbs per event |
| `attachStacktrace` | bool | `true` | Stack traces on messages |
| `attachScreenshot` | bool | `false` | Screenshot on error (mobile and desktop only) |
| `screenshotQuality` | enum | `high` | `full`, `high`, `medium`, `low` |
| `attachViewHierarchy` | bool | `false` | JSON widget tree attached on error |
| `debug` | bool | `true` in debug | Never force `true` in production |
| `diagnosticLevel` | enum | `warning` | `debug`, `info`, `warning`, `error`, `fatal` |
| `enabled` | bool | `true` | Turns the SDK off entirely (for example in tests) |
| `maxCacheItems` | int | `30` | Offline-cached envelopes (not on Web) |
| `sendClientReports` | bool | `true` | SDK health reports (dropped events and so on) |
| `reportPackages` | bool | `true` | Reports the `pubspec.yaml` dependency list |
| `reportSilentFlutterErrors` | bool | `false` | Captures `FlutterErrorDetails.silent` errors |
| `idleTimeout` | Duration | `3000ms` | Auto-finishes idle user-interaction transactions |

### Tracing and profiling

| Option | Type | Default | Purpose |
|---|---|---|---|
| `tracesSampleRate` | double | none | Tracing is on when above 0 |
| `tracesSampler` | function | none | Per transaction; overrides `tracesSampleRate` |
| `tracePropagationTargets` | List | none | URLs that get `sentry-trace` and `baggage` headers |
| `propagateTraceparent` | bool | `false` | Also send W3C `traceparent` (9.7.0+) |
| `enableTimeToFullDisplayTracing` | bool | `false` | Opt-in TTFD per screen |
| `enableAutoPerformanceTracing` | bool | `true` | Automatic performance monitoring |
| `enableUserInteractionTracing` | bool | `true` | Transactions for tap, click, long-press |
| `enableUserInteractionBreadcrumbs` | bool | `true` | A breadcrumb per tracked interaction |
| `profilesSampleRate` | double | none | Relative to `tracesSampleRate`; iOS and macOS only |

### Native and mobile

| Option | Type | Default | Purpose |
|---|---|---|---|
| `autoInitializeNativeSdk` | bool | `true` | Initializes the native Android/iOS SDK |
| `enableNativeCrashHandling` | bool | `true` | Native crashes (NDK, signal, Mach exception) |
| `enableNdkScopeSync` | bool | `true` | Syncs the Dart scope to the Android NDK |
| `enableScopeSync` | bool | `true` | Syncs scope data to the native SDKs |
| `anrEnabled` | bool | `true` | ANR detection (Android) |
| `anrTimeoutInterval` | int | `5000` | ANR timeout in ms (Android); raise it if there are too many false positives |
| `enableWatchdogTerminationTracking` | bool | `true` | OOM kill tracking (iOS) |
| `enableTombstone` | bool | `false` | Android 12+ native crash info via `ApplicationExitInfo` (9.14.0+, opt-in) |
| `attachThreads` | bool | `false` | All threads on crash (Android) |
| `captureNativeFailedRequests` | bool | none | Native HTTP errors, independent of the Dart client (iOS/macOS, 9.11.0+) |
| `enableAutoNativeAppStart` | bool | `true` | App start timing (iOS/Android) |
| `enableFramesTracking` | bool | `true` | Slow and frozen frames (iOS/Android/macOS) |
| `proguardUuid` | string | none | Proguard UUID for the Android mapping |

### Sessions, replay and privacy

- **Sessions:** `enableAutoSessionTracking` (`true`) and `autoSessionTrackingInterval` (`30s`, background inactivity before a session ends).
- **Replay:** `replay.sessionSampleRate` and `replay.onErrorSampleRate`, both default `0.0`.
- **Privacy:** `privacy.maskAllText`, `privacy.maskAllImages` and `privacy.maskAssetImages` all default `true` (v10 docs: `maskAssetImages` `false`, see FLUTTER-FEATURES.md); methods `privacy.mask<T>()`, `privacy.unmask<T>()`, `privacy.maskCallback<T>()`.

### HTTP

| Option | Type | Default | Purpose |
|---|---|---|---|
| `captureFailedRequests` | bool | `true` (Flutter) | Captures HTTP errors |
| `maxRequestBodySize` | enum | `never` | `never`, `small`, `medium`, `always` |
| `failedRequestStatusCodes` | List | 500 to 599 | Status codes treated as failures |
| `failedRequestTargets` | List | `['.*']` | URL patterns to monitor |

### Hooks

| Option | Signature | Purpose |
|---|---|---|
| `beforeSend` | `(SentryEvent, Hint) → SentryEvent?` | Return `null` to drop an error event |
| `beforeSendTransaction` | `(SentryEvent) → SentryEvent?` | Modify or drop transactions |
| `beforeBreadcrumb` | `(Breadcrumb, Hint) → Breadcrumb?` | Process breadcrumbs |
| `beforeSendLog` | `(SentryLog) → SentryLog?` | Filter structured logs (v10: `(log, hint)`) |

### Build-time environment

The runtime DSN/environment/release/dist can use dart-define. The auth token and upload target belong to the separate build-tool environment, not app defines. The old heading grouped them under one dart-define instruction despite its own no-token rule. [getsentry/sentry-for-ai, sentry-flutter-sdk; existing no-token acceptance rule]

| Variable | Purpose | Notes |
|---|---|---|
| `SENTRY_DSN` | DSN | Fallback for `options.dsn` |
| `SENTRY_ENVIRONMENT` | Environment | Fallback for `options.environment` |
| `SENTRY_RELEASE` | Release | Fallback for `options.release` |
| `SENTRY_DIST` | Distribution | Fallback for `options.dist` |
| `SENTRY_AUTH_TOKEN` | Debug symbol upload | Never embed in the app; build tool only |
| `SENTRY_ORG` | Org slug | Used by `sentry_dart_plugin` |
| `SENTRY_PROJECT` | Project slug | Used by `sentry_dart_plugin` |

```bash
flutter build apk --release \
  --dart-define=SENTRY_DSN=https://xxx@sentry.io/123 \
  --dart-define=SENTRY_ENVIRONMENT=production
```

```dart
options.dsn = const String.fromEnvironment('SENTRY_DSN');
options.environment = const String.fromEnvironment('SENTRY_ENVIRONMENT', defaultValue: 'development');
```

### v10 option notes

### Init in the docs' style

The options page initializes with a cascade:

```dart
import 'package:flutter/widgets.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) => options
      ..dsn = 'https://<key>@o<orgId>.ingest.sentry.io/<projectId>'
      ..release = 'my-project-name@2.3.12'
      ..environment = 'staging',
    appRunner: () => runApp(MyApp()),
  );
}
```

### Option notes

- **`release`:** set it manually to keep it in sync with deploys and symbol uploads. `dist` is the build number or version code (max 64 chars).
- **`sendDefaultPii`** defaults to `false` ("By default, no such data is sent"); if you turn it on, remove unwanted data with the sensitive-data features. The hooks for that are `beforeSend`, `beforeSendTransaction` and `beforeSendSpan` (stream mode).
- **`maxCacheItems`** (`30`): envelopes cached offline; the oldest are deleted.
- **In-app frames:** `considerInAppFramesByDefault`, `inAppIncludes` (takes precedence) and `inAppExcludes`.
- **Since versions:** `sendClientReports` 6.6.0; `captureFailedRequests` 7.0.0 (HTTP client errors as events).
- **`beforeSend`** runs with all scope data already applied. Examples from the filtering page: `event.serverName = "";`, `return hint is MyHint ? null : event;`, and a fingerprint, `if (event.throwable is DatabaseException) { event.fingerprint = ['database-connection-error']; }`. `beforeSendTransaction` applies in transaction mode.

- **`SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` are read automatically** (not in browser runtimes). `environment` is not set by default. `debug` is "generally not recommended to turn it on in production".
- **`sampleRate` runs after event processors and `beforeSend`,** so those callbacks also run for events later sampled out. Changing it needs a redeploy; a project rate limit may suit better.
- **`maxRequestBodySize`:** `small` is about 4KB, `medium` about 10KB. `captureNativeFailedRequests` defaults to `false`. `autoInitializeNativeSdk`: "Do not use this to disable the native layer". `enableAutoNativeBreadcrumbs` defaults to `true`.
- **A throwing callback drops the item:** an exception in event processors, `beforeSend`, `beforeSendTransaction`, `beforeSendFeedback`, `beforeBreadcrumb`, `beforeSendLog` or `beforeSendMetric` drops it; `beforeSendSpan` logs and doesn't drop. "Handle expected failures inside these callbacks and return the intended item or `null` explicitly."
- **Web-only filters:** `allowUrls` / `denyUrls` (regex strings, ignored elsewhere), for example `options.allowUrls = ["^https://sentry.com.*\$", "my-custom-domain"];`. `ignoreTransactions` (transaction mode; case-insensitive regex, substring by default), for example `['my-transaction', r'^transaction-.*$']`.
- **Sensitive data:** hash values you need to correlate (`Sentry.configureScope((scope) => scope.setTag('birthday', checksumOrHash('08/12/1990')));`) and send internal IDs rather than personal data (`scope.setUser(SentryUser(id: clientUser.id, username: clientUser.username))`). PII practice across SDKs: [PRACTICES.md](PRACTICES.md).


### Integrations on by default

`SentryFlutter.init()` installs `FlutterErrorIntegration` (`FlutterError.onError`), `RunZonedGuardedIntegration` (unhandled Dart exceptions in `runZonedGuarded`), `NativeAppStartIntegration` (iOS/Android), `FramesTrackingIntegration` (iOS/Android/macOS), `NativeUserInteractionIntegration`, `UserInteractionIntegration` (needs `SentryWidget`), `DeviceContextIntegration`, `AppContextIntegration`, `ConnectivityIntegration` (connectivity breadcrumbs), `HttpClientIntegration` (Dart `http`), `SdkIntegration` and `ReleaseIntegration` (automatic release on iOS/Android).

## Errors

### What is captured automatically

| Handler | Captures | Platforms |
|---|---|---|
| `FlutterError.onError` | Widget build, rendering, gesture errors | All |
| `PlatformDispatcher.instance.onError` | Uncaught Dart async errors (root zone) | All (Flutter 3.3+) |
| Android SDK (bundled) | Java/Kotlin JVM exceptions, NDK native crashes | Android |
| iOS/macOS SDK (bundled) | ObjC `NSException`, Swift errors, POSIX signals, Mach exceptions | iOS, macOS |
| `WidgetsBindingObserver` | App lifecycle breadcrumbs | Linux, Windows, Web (no native SDK) |

- **Silent framework errors** (`FlutterErrorDetails.silent == true`) are skipped unless `options.reportSilentFlutterErrors = true`.
- **Isolates other than the root are not captured automatically.** Register each one (not on Web, which has no Isolate API):

```dart
import 'dart:isolate';
import 'package:sentry/sentry.dart';

final isolate = await Isolate.spawn(myIsolateEntry, someData);
isolate.addSentryErrorListener(); // forwards uncaught errors to Sentry
```

### Capture by hand

- **Always pass `stackTrace`;** without it Sentry can't show the right call stack.

```dart
import 'package:sentry/sentry.dart';

try {
  await riskyOperation();
} catch (e, stackTrace) {
  await Sentry.captureException(e, stackTrace: stackTrace);
}
```

- **Scope for one event only,** without touching later events:

```dart
await Sentry.captureException(
  e,
  stackTrace: stackTrace,
  withScope: (scope) {
    scope.setTag('feature', 'checkout');
    scope.setTag('step', 'payment');
    scope.level = SentryLevel.fatal;
    scope.setExtra('orderId', orderId);
  },
);
```

- **Messages:** `Sentry.captureMessage('Rate limit threshold exceeded', level: SentryLevel.warning);`. Levels: `SentryLevel.debug`, `info`, `warning`, `error`, `fatal`.
- **User feedback** tied to an event:

```dart
final eventId = await Sentry.captureException(e, stackTrace: st);

await Sentry.captureFeedback(
  SentryFeedback(
    message: 'App froze after uploading the photo.',
    contactEmail: 'user@example.com',
    name: 'Jane Doe',
    associatedEventId: eventId,
  ),
);
```

### Context: user, tags, contexts, attributes

```dart
import 'package:sentry/sentry.dart';

// Set user on login
Sentry.configureScope((scope) => scope.setUser(SentryUser(
  id: 'user-123',
  username: 'jdoe',
  email: 'jane@example.com',
  name: 'Jane Doe',
  data: {'subscription_tier': 'pro'},
)));

// Clear user on logout
Sentry.configureScope((scope) => scope.setUser(null));

// Tags: indexed, searchable (key max 32 chars, value max 200 chars)
Sentry.configureScope((scope) {
  scope.setTag('app.flavor', 'enterprise');
  scope.setTag('locale', 'pt-BR');
});

// Contexts: non-searchable structured data (visible in Sentry UI)
Sentry.configureScope((scope) => scope.setContexts('cart', {
  'items_count': 3,
  'total_usd': 149.99,
}));

// Attributes (SDK ≥9.9.0): apply to logs, metrics, and spans too
Sentry.setAttributes({'user_tier': SentryAttribute.string('premium')});
Sentry.removeAttribute('user_tier');
```

- **Tags are indexed and searchable; contexts are not.** Tag keys max 32 characters, values max 200.
- **Set context before the error.** Native crashes read the scope at crash time. With `enableScopeSync` (default `true`), `setUser()`, `setContexts()`, `setTag()`, `setExtra()`, `addBreadcrumb()` and `clearBreadcrumbs()` sync to the native SDK, so native crash reports carry the Dart context.
- **`Sentry.configureScope` and `Sentry.startTransaction` are current Dart APIs.** The JavaScript SDK removed both in v8 (UPGRADE.md); the two are different SDKs.

### Breadcrumbs

```dart
Sentry.addBreadcrumb(Breadcrumb(
  message: 'User tapped checkout button',
  category: 'ui.action',
  type: 'user',
  level: SentryLevel.info,
  data: {'screen': 'CartScreen', 'cart_total': 149.99},
));
```

```dart
options.beforeBreadcrumb = (breadcrumb, hint) {
  // Drop noisy analytics calls
  if (breadcrumb.data?['url']?.contains('analytics') == true) {
    return null; // null = drop
  }
  // Strip auth headers from HTTP breadcrumbs
  if (breadcrumb.type == 'http') {
    final data = Map<String, dynamic>.from(breadcrumb.data ?? {})
      ..remove('Authorization');
    return breadcrumb.copyWith(data: data);
  }
  return breadcrumb;
};
```

- **`options.maxBreadcrumbs = 150;`** raises the cap (default 100).

### Filtering and grouping

```dart
options.beforeSend = (event, hint) async {
  // Drop database connection errors (too noisy)
  if (event.throwable is DatabaseConnectionException) return null;

  // Group similar payment failures
  if (event.throwable is PaymentException) {
    event.fingerprint = ['payment-failure'];
  }

  // Strip server name for privacy
  event.serverName = '';
  return event;
};
```

- **`beforeSend` sees Dart-layer events only.** Native crashes from the Android NDK or iOS bypass it; that is expected.
- **Error sampling** (`options.sampleRate = 0.5;`) is not recommended unless volume is very high.
- **Limits:** Dart async/await can lose stack frames (a Dart runtime limitation; add tags, breadcrumbs, structured logs); layout errors are only caught in debug mode; the SDK can't filter obfuscated traces, so use inbound filters for unhandled errors from outside the app in release builds. In an isolate, call `Sentry.close()` before it completes.

### Attachments

- **Screenshots and the widget tree:** `options.attachScreenshot = true;`, `options.screenshotQuality = ScreenshotQuality.high;` (full, high, medium, low), `options.attachViewHierarchy = true;`. Both need `SentryWidget(child: MyApp())` as the app root and don't work on Web.
- **A file:**

```dart
import 'package:sentry/sentry_io.dart';

final attachment = IoSentryAttachment.fromPath('/path/to/debug.log');
Sentry.configureScope((scope) => scope.addAttachment(attachment));
```

### Native options

- **Android:** `enableTombstone = true` (Android 12+, 9.14.0+, opt-in), `enableNdkScopeSync` (default true), `attachThreads` (default false), `anrEnabled` (default true), `anrTimeoutInterval = 5000` (ms; raise it when ANRs are too aggressive).
- **iOS and macOS:** `enableWatchdogTerminationTracking = true` (default), `captureNativeFailedRequests = true` (9.11.0+).

## Release health

- **Session tracking is on by default** and drives crash-free user and session rates. Turn it off with `options.enableAutoSessionTracking = false;`; tune it with `options.autoSessionTrackingInterval = const Duration(seconds: 60);` (default 30 s).
- **The release is set automatically on iOS and Android** as `"packageName@versionName+versionCode"`; override with `options.release = 'my-app@2.1.0+105';` (Flutter Web: `SENTRY_RELEASE` via `--dart-define`).
- **What counts as a crash (v10):** on Android, iOS and macOS, unhandled Flutter errors are recorded as unhandled, non-terminating (not crashed); native process-terminating crashes are crashes. On web the SDK uses Sentry JavaScript SDK 11 and an unhandled error sets the browser session to `unhandled` (terminal). "Account for these changes when comparing crash-free metrics and alerts before and after upgrading."
- **Sampling and health:** on Android, iOS and macOS, unhandled errors dropped by `sampleRate` still update release health; on web they don't. Events dropped by event processors or `beforeSend` never do.
- **Web sessions** (SDK 9.0.0+) need `SentryNavigatorObserver` and uniquely named routes. How releases tie to symbols and deploys across SDKs: [RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md).

## Ecosystem integrations

- **The Dart `http` client is built into `sentry_flutter`:**

```dart
import 'package:sentry/sentry.dart';

final client = SentryHttpClient(
  captureFailedRequests: true,
  failedRequestStatusCodes: [SentryStatusCode.range(400, 599)],
);
try {
  final response = await client.get(Uri.parse('https://api.example.com/users'));
} finally {
  client.close();
}
```

- **Dio:** `flutter pub add sentry_dio`; add your interceptors first, then `dio.addSentry()` last (code in FLUTTER-FEATURES.md).
- **Databases** (`flutter pub add <pkg>`): `sentry_sqflite` (`databaseFactory = SentrySqfliteDatabaseFactory();`), `sentry_drift` (`.interceptWith(SentryQueryInterceptor(databaseName: 'db'))`), `sentry_hive` (use `SentryHive` instead of `Hive`), `sentry_isar` (use `SentryIsar.open()` instead of `Isar.open()`; not on Web). Spans need an active transaction (FLUTTER-FEATURES.md).
- **Other packages:**

| Package | Purpose |
|---|---|
| `sentry_logging` | Dart `logging` package to Sentry breadcrumbs, events and logs |
| `sentry_link` | GraphQL tracing (gql, graphql_flutter, ferry) |
| `sentry_supabase` | Supabase query tracing (9.9.0+) |
| `sentry_firebase_remote_config` | Feature flag tracking (not on Linux or Windows, a Firebase limitation) |
| `sentry_file` | File I/O tracing via the `.sentryTrace()` extension |

- **State management has no official packages;** hook Sentry into each framework's observer API with a class you write:

| Framework | Hook | Pattern |
|---|---|---|
| BLoC/Cubit | `BlocObserver.onError` | `Sentry.captureException(error, stackTrace: stackTrace)` inside `onError`; set `Bloc.observer = SentryBlocObserver()` before init |
| Riverpod | `ProviderObserver.providerDidFail` | Fires for `FutureProvider`/`StreamProvider` failures; `ProviderScope(observers: [SentryProviderObserver()])` |
| Provider/ChangeNotifier | try/catch around `notifyListeners` callers | `Sentry.captureException(e, stackTrace: stack)` by hand |
| GetX | `GetMaterialApp.onError` | `GetMaterialApp(onError: (details) => Sentry.captureException(...))` |

## Connect a backend

- **Look for an adjacent backend without Sentry** (`ls ../backend ../server ../api`, `../package.json`). A Node.js backend uses Sentry's Node SDK, a React or Next.js web app the React or Next.js SDK.
- **Link mobile and backend traces** so they appear in one waterfall: set `tracePropagationTargets` and `propagateTraceparent` (FLUTTER-FEATURES.md, Distributed tracing).

## Debugging

| Symptom | Fix |
|---|---|
| Events don't appear | `options.debug = true` (the SDK logs to the Flutter console); check the DSN |
| `SentryFlutter.init` throws | Make `main()` `async` and `await SentryFlutter.init(...)` |
| Unreadable stack traces | Build with `--obfuscate --split-debug-info` and upload with `sentry_dart_plugin` |
| Native crashes not captured | `enableNativeCrashHandling: true`; test a release build, not debug |
| Events missing user or tag context | Set it with `Sentry.configureScope()` before the error |
| `beforeSend` not called for native crashes | Expected: it is Dart-layer only |
| Isolate errors missing | `isolate.addSentryErrorListener()` per isolate |
| Attachments missing | `SentryWidget(child: MyApp())` must be the root |
| ANR too aggressive | Raise `anrTimeoutInterval` above 5000 ms |
| Hot restart crashes on Android in debug | Known issue, fixed in 9.9.0 |
| `SentryWidget` warning in tests | Call `SentryFlutter.init()` in `setUpAll`, or use `enabled: false` |
| `pub get` fails, Dart SDK too old | `sentry_flutter` 9.0.0+ needs Dart 3.5.0+; `flutter upgrade` |
| Symbol upload problems | See [Debug symbols](FLUTTER-SYMBOLS.md#debug-symbols) |
| 16 KB page size errors | SDK 8.11.0+ |
| Apple "ITMS-91053: Missing API declaration" | Follow the Apple Privacy Manifest guide |
| Linux/Windows native crashes | Breakpad by default (uploaded on next start); `SENTRY_NATIVE_BACKEND=crashpad` at build time for Crashpad (clang 13+; for `sentry_init failed` add the CMake `install(PROGRAMS ...)` fix) |
| Multi-view web | Screenshots, user interaction and `WidgetsBindingIntegration` are unsupported |
| Web zone mismatch (`WidgetsBinding.ensureInitialized()` before init) | Wrap in `Sentry.runZonedGuarded(() async { WidgetsBinding.ensureInitialized(); await SentryFlutter.init(..., appRunner: () => runApp(SentryWidget(child: MyApp()))); }, (error, stackTrace) {})` |

Tracing, replay, profiling, logs and metrics symptoms are in FLUTTER-FEATURES.md.

## Prove it

- **An error arrives:** a temporary button that throws shows up in Issues within seconds.

```dart
// Add a test button somewhere visible during development:
ElevatedButton(
  onPressed: () {
    throw Exception('Sentry test error!');
  },
  child: const Text('Test Sentry Error'),
)

// Or capture manually:
ElevatedButton(
  onPressed: () {
    Sentry.captureMessage('Sentry test message', level: SentryLevel.info);
  },
  child: const Text('Test Sentry Message'),
)

// Test structured logging:
ElevatedButton(
  onPressed: () {
    Sentry.logger.info('Test log from Flutter app');
  },
  child: const Text('Test Sentry Log'),
)
```

- **Init is right:** `grep -r "SentryFlutter.init" lib/` finds one awaited call inside an `async main()`, and `appRunner` wraps the app in `SentryWidget`.
- **Symbols are uploaded:** an error from an `--obfuscate` release build shows real Dart function names, not `_f` or `_g`, and native frames show symbols, not hex addresses.
- **No token in the app:** the auth token is only in `SENTRY_AUTH_TOKEN` for the build, not in `pubspec.yaml`, `--dart-define` or source.
- **Context reaches native crashes:** after `configureScope` sets the user and tags, a native crash in a release build carries them.
- **Production values:** `debug` is off in production and sample rates are lowered as in [Production values](#production-values).
