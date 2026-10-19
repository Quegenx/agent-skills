# Flutter tracing, profiling, replay, logs and metrics

These are the `sentry_flutter` features beyond errors. Setup, debug symbols and the full option tables are in [FLUTTER.md](FLUTTER.md); sampling and PII rules across SDKs are in [PRACTICES.md](PRACTICES.md). Most outcomes here come down to three preconditions: spans (HTTP, database, logs linked to traces) appear only while a transaction is bound to the scope, routes and tapped widgets need names and keys or they show as `null` or not at all, and replay and profiling are silently ignored on platforms they don't support.

**Contents:** [Tracing](#tracing) · [Navigation](#navigation) · [TTID and TTFD](#ttid-and-ttfd) · [User interactions](#user-interactions) · [HTTP and distributed tracing](#http-and-distributed-tracing) · [App start and frames](#app-start-and-frames) · [Custom spans](#custom-spans) · [Database and asset tracing](#database-and-asset-tracing) · [Profiling](#profiling) · [Session replay](#session-replay) · [Logs](#logs) · [Metrics](#metrics) · [User feedback](#user-feedback) · [Debugging](#debugging) · [Prove it](#prove-it)

## Tracing

- **Turn it on with a rate or a sampler.** The sampler takes precedence over the rate:

```dart
await SentryFlutter.init(
  (options) {
    options.dsn = 'YOUR_SENTRY_DSN';

    // Option A: Uniform sample rate (use 1.0 during development)
    options.tracesSampleRate = 1.0;

    // Option B: Dynamic sampler (takes precedence over tracesSampleRate)
    options.tracesSampler = (samplingContext) {
      final name = samplingContext.transactionContext?.name ?? '';
      if (name.contains('checkout')) return 1.0; // always trace checkout
      if (name.contains('health')) return 0.0;   // never trace health checks
      return 0.1;                                 // 10% of everything else
    };
  },
  appRunner: () => runApp(SentryWidget(child: MyApp())),
);
```

- **Sampling precedence, highest first:** explicit `sampled: true/false` on the transaction, then the `tracesSampler` result, then the parent's decision (distributed tracing), then the static `tracesSampleRate`. `tracesSampler` runs once per transaction creation.
- **Dart keeps `samplingContext.transactionContext?.name`;** the JavaScript SDK flattened it to `samplingContext.name` in v9 (UPGRADE.md). The two are different SDKs.
- **Production:**

```dart
final isProduction = const bool.fromEnvironment('dart.vm.product');

await SentryFlutter.init(
  (options) {
    options.dsn = const String.fromEnvironment('SENTRY_DSN');

    // 10% sampling in production, 100% in dev
    options.tracesSampleRate = isProduction ? 0.1 : 1.0;

    // Trace all checkout flows, drop health checks
    options.tracesSampler = (ctx) {
      final name = ctx.transactionContext?.name ?? '';
      if (name.contains('checkout') || name.contains('payment')) return 1.0;
      if (name.contains('health') || name.contains('ping')) return 0.0;
      return isProduction ? 0.1 : 1.0;
    };

    // Connect traces to backend
    options.tracePropagationTargets = ['api.myapp.com'];
  },
  appRunner: () => runApp(SentryWidget(child: MyApp())),
);
```

### Stream mode (v10 default)

- **`traceLifecycle` (since 9.23.0) defaults to `stream` since 10.0.0;** `SentryTraceLifecycle.static` is the old transaction mode. The samplers above read `transactionContext`, which is transaction mode. In stream mode read `samplingContext.spanContext` (name, attributes):

```dart
await SentryFlutter.init((options) {
  options.tracesSampler = (samplingContext) {
    final spanContext = samplingContext.spanContext;
    if (spanContext.name == 'health-check') {
      return 0.0;
    }
    return 0.2;
  };
});
```

- **Stream mode has no parent decision** in the sampling context and no forced decision. In transaction mode, inherit with `samplingContext.transactionContext.parentSampled` (return `parentSampled ? 1.0 : 0.0`) and force with `SentryTransactionContext(..., sampled: true)` + `Sentry.startTransactionWithContext`. If `tracesSampler` throws: transaction mode falls back to the inherited decision, then `tracesSampleRate`; stream mode to `tracesSampleRate`; otherwise not sampled. "Return `0.0` from the sampler to reject a trace explicitly." The rate and the sampler "are meant to be mutually exclusive. If you set both, `tracesSampler` will take precedence."
- **Stream-mode-only options (since 9.23.0):** `ignoreSpans`, evaluated at span start, children re-parented: `IgnoreSpanRule.nameEquals('health-check')`, `IgnoreSpanRule.nameStartsWith('internal.')`, `IgnoreSpanRule.nameContains('metrics')`, `IgnoreSpanRule.nameEndsWith('.bg')`. `beforeSendSpan` receives `SentrySpanV2` and `Hint`, modifies in place, returns void and cannot drop (for example `span.removeAttribute('http.request.body')`). `Sentry.setAttributes({...})` also applies to spans in stream mode.
- **Stream mode removes the 1,000-span limit,** but "In stream mode, continuing an incoming distributed trace (from a `sentry-trace` or `baggage` header) isn't supported yet." `options.strictTraceContinuation = true` (and `options.orgId = '12345'` if the DSN lacks the org) applies to transaction mode; on iOS only the Dart layer enforces it.
- **Test at `1.0`, then lower** or use `tracesSampler`; "If you're adopting Tracing in a high-throughput environment, we recommend testing prior to deployment".

## Navigation

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

MaterialApp(
  navigatorObservers: [
    SentryNavigatorObserver(
      // Auto-finish idle transactions after this duration (default: 3s)
      autoFinishAfter: const Duration(seconds: 3),
      // Routes to exclude from tracking (default: [])
      ignoreRoutes: ['/splash', '/loading'],
      // Use route name as the Sentry transaction name (default: false)
      setRouteNameAsTransaction: false,
      // Generate a fresh trace on each push/pop/replace (default: false).
      // Changed from true → false in sentry_flutter 9.19.0.
      // Set to true to restore the previous opt-out behavior.
      enableNewTraceOnNavigation: false,
    ),
  ],
  routes: {
    '/': (context) => HomeScreen(),
    '/profile': (context) => ProfileScreen(),
  },
)

// For anonymous routes, always provide a name:
Navigator.push(
  context,
  MaterialPageRoute(
    settings: const RouteSettings(name: 'ProductDetail'), // REQUIRED
    builder: (context) => ProductDetailScreen(),
  ),
);
```

- **Routing instrumentation needs SDK `9.1.0`+.** Spans use op `ui.load`, named after the route (`RouteSettings(name: ...)`, `MaterialPage(name: ...)`, GoRouter's `path` with optional `name`, auto_route's generated names). "If the SDK cannot determine a route name, it will not create transactions, breadcrumbs, or performance insights". A custom `RouterDelegate` passes the observer in `Navigator(observers: [...])`.
- **Defaults:** `autoFinishAfter` 3 s, `ignoreRoutes` `[]`, `setRouteNameAsTransaction` false, `enableNewTraceOnNavigation` false.
- **Breaking change in `sentry_flutter` 9.19.0:** `enableNewTraceOnNavigation` now defaults to false (it was true). Set it to true for a fresh trace on each push, pop or replace.
- **Routes must have names** for TTID and TTFD spans and navigation breadcrumbs; unnamed routes show as `null`.
- **GoRouter:** pass the observer and name every `GoRoute`. GoRouter doesn't propagate observers across same-level tab transitions, so bottom-tab navigation may not be tracked.
  - FlutterPro, for analytics navigator observers in general: each `ShellRoute` or `StatefulShellRoute` branch runs its own inner navigator, so give it its own `observers` list; with a custom `pageBuilder`, set the page's `name` yourself, `MaterialPage(name: state.name ?? state.path, child: ...)` ([FlutterPro](https://flutterpro.design/details/analytics-screen-names), [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#real-screen-names-in-analytics)).

```dart
import 'package:go_router/go_router.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

final GoRouter router = GoRouter(
  observers: [SentryNavigatorObserver()],
  routes: [
    GoRoute(
      path: '/',
      name: 'home',       // name is REQUIRED
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'profile/:id',
          name: 'profile', // name is REQUIRED
          builder: (context, state) => ProfileScreen(
            id: state.pathParameters['id']!,
          ),
        ),
      ],
    ),
  ],
);
```

- **Auto Route** (a community pattern). Tab-based nested navigation is not captured (getsentry/sentry-dart#2123).

```dart
import 'package:auto_route/auto_route.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

MaterialApp.router(
  routerConfig: _router.config(
    navigatorObservers: () => [SentryNavigatorObserver()],
  ),
)
```

## TTID and TTFD

- **TTID (Time to Initial Display) is always on** and measures to the first rendered frame. **TTFD (Time to Full Display)** measures until the data is loaded and is opt-in: `options.enableTimeToFullDisplayTracing = true;`. Both need 9.1.0+ and named routes.

```dart
// Option 1: Widget wrapper (marks TTFD when child's build() completes)
// For StatelessWidget, TTFD is auto-reported when build() returns.
// For StatefulWidget, call reportFullyDisplayed() manually in a wrapper:
Navigator.push(
  context,
  MaterialPageRoute(
    settings: const RouteSettings(name: 'ProductScreen'),
    builder: (context) => SentryDisplayWidget(child: ProductScreen()),
  ),
);

// Inside ProductScreen (StatefulWidget):
@override
void initState() {
  super.initState();
  _loadData().then((_) {
    if (mounted) {
      SentryDisplayWidget.of(context).reportFullyDisplayed();
    }
  });
}

// Option 2: Direct API call (from anywhere in the widget)
await _loadData();
SentryFlutter.currentDisplay()?.reportFullyDisplayed();
```

- **The sources differ on `SentryDisplayWidget`:** the setup guide says the wrapper marks TTFD when the child first renders; the tracing reference says that holds for a StatelessWidget, while a StatefulWidget must call `SentryDisplayWidget.of(context).reportFullyDisplayed()`.
- **The v10 routing docs side with the tracing reference:** a StatelessWidget must use the `SentryDisplayWidget` wrapper; the TTID span op is `ui.load.initial-display`.
- **TTFD expires after 30 seconds** with `SpanStatus.DEADLINE_EXCEEDED` if `reportFullyDisplayed()` is never called.

## User interactions

- **Needs `SentryWidget` at the root, and each tracked widget needs a `Key`,** for example `key: const Key('submit_payment_button')`.
- **Transactions are named** like `ButtonWidget key[submit_payment_button]` with operation `ui.action.click`. A transaction with no child spans within `idleTimeout` is dropped silently.
- **Options:** `enableUserInteractionTracing` (true), `enableUserInteractionBreadcrumbs` (true), `sendDefaultPii = false` (set true to use widget text as labels), `idleTimeout = const Duration(milliseconds: 3000)`.

## HTTP and distributed tracing

- **HTTP spans appear only when a transaction is bound to the scope** (`bindToScope: true`), for both `SentryHttpClient` and Dio.

```dart
import 'package:sentry/sentry.dart';

// Wrap any active transaction with an HTTP client for automatic spans
final transaction = Sentry.startTransaction('api-call', 'request', bindToScope: true);

final client = SentryHttpClient(
  captureFailedRequests: true,
  failedRequestStatusCodes: [SentryStatusCode.range(400, 599)],
  failedRequestTargets: ['api.example.com'],
);

try {
  final response = await client.get(Uri.parse('https://api.example.com/users'));
} finally {
  client.close();
  await transaction.finish(status: SpanStatus.ok());
}
```

- **Dio: `dio.addSentry()` must be the last step** of Dio setup, after your own interceptors.

```dart
import 'package:sentry_dio/sentry_dio.dart';

final dio = Dio();
dio.interceptors.add(MyAuthInterceptor()); // your interceptors first
dio.addSentry(                             // addSentry() always last
  captureFailedRequests: true,
  failedRequestStatusCodes: [SentryStatusCode.range(400, 599)],
);

// Spans only appear if a transaction is on scope
final transaction = Sentry.startTransaction('api-work', 'request', bindToScope: true);
await dio.get('https://api.example.com/products');
await transaction.finish(status: SpanStatus.ok());
```

- **Distributed tracing** links mobile transactions to backend traces in the Sentry waterfall. Requests to the targets get `sentry-trace` and `baggage`; `propagateTraceparent` adds W3C `traceparent` (9.7.0+):

```dart
options.tracePropagationTargets = ['api.myapp.com', 'localhost'];
options.propagateTraceparent = true; // also send W3C traceparent header (SDK ≥9.7.0)
```

- **gRPC is slow on Windows** (getsentry/sentry-dart#2760) because of `startTransaction` overhead: avoid it there or create spans asynchronously.

## App start and frames

- **Auto-enabled integrations:** App Start and Slow and Frozen Frames. **Opt-in:** Asset Bundle, Dio, Drift, File, GraphQL, Hive, Http, Isar, Logging, Routing, Sqflite, Supabase ([SUPABASE.md](SUPABASE.md#dart-and-flutter)), User Interaction, Firebase Remote Config.
- **With tracing on, Android and iOS report app start as a standalone `app.start` root** with its own sampling decision.
- **App start** (iOS and Android, on automatically) measures from the earliest native process init to the first Flutter frame, as a `ui.load` transaction with an `app.start.cold` or `app.start.warm` span. It is not accurate in add-to-app setups. To turn it off:

```dart
import 'package:sentry_flutter/src/integrations/native_app_start_integration.dart';

options.integrations.removeWhere((i) => i is NativeAppStartIntegration);
```

- **Slow and frozen frames** (iOS, Android, macOS) are on automatically when Sentry initializes before `WidgetsFlutterBinding`. Slow: over 16 ms (misses 60 FPS); frozen: over 700 ms. If `WidgetsFlutterBinding.ensureInitialized()` must run before Sentry, call `SentryWidgetsFlutterBinding.ensureInitialized();` instead. Turn off with `options.enableFramesTracking = false;`.

## Custom spans

- **A transaction:** `bindToScope: true` links errors captured during it.

```dart
final transaction = Sentry.startTransaction(
  'processOrderBatch()',  // name
  'task',                 // operation
  bindToScope: true,      // links auto-captured errors to this transaction
);

try {
  await processOrderBatch();
  transaction.status = const SpanStatus.ok();
} catch (exception, stackTrace) {
  transaction.throwable = exception;
  transaction.status = const SpanStatus.internalError();
  await Sentry.captureException(exception, stackTrace: stackTrace);
} finally {
  await transaction.finish();
}
```

- **A child span of whatever is active:**

```dart
final span = Sentry.getSpan()?.startChild(
  'db.query',
  description: 'SELECT * FROM orders WHERE user_id = ?',
) ?? Sentry.startTransaction('fallback', 'task', bindToScope: true);

try {
  final orders = await db.getOrdersForUser(userId);
  span.status = const SpanStatus.ok();
  return orders;
} catch (e, st) {
  span.throwable = e;
  span.status = const SpanStatus.notFound();
  rethrow;
} finally {
  await span.finish();
}
```

- **Data:** `transaction.setData('user_id', userId);` with String, int, double, bool or List values.
- **Sample on your own fields** with `customSamplingContext`:

```dart
final transaction = Sentry.startTransaction(
  'processPayment()',
  'task',
  customSamplingContext: {
    'payment.amount': amount,
    'payment.currency': currency,
    'user.tier': userTier,
  },
);

// In tracesSampler:
options.tracesSampler = (ctx) {
  final tier = ctx.customSamplingContext?['user.tier'];
  if (tier == 'enterprise') return 1.0; // always trace enterprise
  return 0.1;
};
```

## Database and asset tracing

All database integrations need an active transaction on the scope to create spans.

| Package | Platforms | Code |
|---|---|---|
| `sentry_sqflite` | Android, iOS, macOS | `databaseFactory = SentrySqfliteDatabaseFactory();` (global) or `final db = await openDatabaseWithSentry('my.db');` (per database, recommended) |
| `sentry_drift` | All | `driftDatabase(name: 'app').interceptWith(SentryQueryInterceptor(databaseName: 'app'))` |
| `sentry_hive` | All | `SentryHive.init(appDir.path); final box = await SentryHive.openBox<Person>('people');` |
| `sentry_isar` | Android, iOS, macOS, Linux, Windows (no Web) | `final isar = await SentryIsar.open([UserSchema], directory: dir.path);` |

- **Asset bundle tracing** is built into `sentry_flutter`:

```dart
runApp(
  DefaultAssetBundle(
    bundle: SentryAssetBundle(enableStructuredDataTracing: true),
    child: MyApp(),
  ),
)
```

## Profiling

- **Alpha, iOS and macOS only, `sentry_flutter` 7.12.0+.** The API may change without a major version bump. It samples the Dart and native call stack at a fixed interval during a sampled transaction, so tracing is required. On Android, Web, Linux and Windows the option does nothing. Below 7.12.0 the SDK crashes on startup with profiling on.
- **`profilesSampleRate` is relative to `tracesSampleRate`:** 0.2 traced × 0.5 profiled = 10% of all transactions.

```dart
await SentryFlutter.init(
  (options) {
    options.dsn = 'YOUR_DSN';

    // Trace 20% of transactions
    options.tracesSampleRate = 0.2;

    // Profile 50% of those → 10% of all transactions profiled
    options.profilesSampleRate = 0.5;
  },
  appRunner: () => runApp(MyApp()),
);
```

- **Keep it low in production:** values above 0.1 are not recommended without performance validation on your minimum supported device; start at `0.05` and raise it if needed, and use 1.0 only in development. (The setup guide's production block uses 1.0; see FLUTTER.md.)
- **Captured:** call-stack samples, flame graph, timeline, thread info, function names. **Not captured:** memory allocations (use Xcode Instruments), network details, UI rendering frames.
- **Overhead:** minimal on iPhone 12 and newer, measurable on iPhone 8 and older. Simulator results differ; don't benchmark on it.
- **Limits:** no manual start or stop (profiles are transaction-scoped); a transaction that completes in the background can give a truncated or missing profile; obfuscated builds need Dart symbols uploaded via `sentry_dart_plugin`; native frames need dSYMs (FLUTTER.md, Debug symbols).

## Session replay

- **iOS and Android only, `sentry_flutter` 9.0.0+, built in** (no extra package). It is screenshot-based at about 1 frame per second, and its config is silently ignored on other platforms.
- **Unlike web replay:** screenshots instead of DOM serialization, text is pixels only (not selectable or searchable), no CSS inspection, masking per widget, no rage clicks, taps recorded only as breadcrumbs, approximate scroll positions.

```dart
import 'package:flutter/widgets.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_DSN';

      // Session replay sampling
      options.replay.sessionSampleRate = 0.1;   // 10% of all sessions recorded
      options.replay.onErrorSampleRate = 1.0;   // 100% when an error occurs
    },
    appRunner: () => runApp(
      SentryWidget(   // required: wraps the app for screenshot capture
        child: MyApp(),
      ),
    ),
  );
}
```

- **Versions disagree:** the Flutter SDK page says at least `9.0.0` is "required for Session Replay"; the mobile product page says 8.12.0.
- **`options.replay.quality`** defaults to `SentryReplayQuality.medium`. Network details need the Sentry HTTP client integrations; screen names need `SentryNavigatorObserver` with route names; taps need `SentryWidget` and unique button keys.
- **Error and feedback buffer:** up to 30 seconds before the trigger; `SentryFeedbackForm` sends the buffer when the form opens. A session keeps the same `replay_id` if the app returns within 30 seconds.
- **`SentryWidget(child: MyApp())` must be the outermost widget,** not inside the navigator, or replays are blank and taps go missing (it intercepts gestures).
- **Two rates (0.0 to 1.0, both default 0):** `replay.sessionSampleRate` records the whole session from init or entering the foreground; `replay.onErrorSampleRate` keeps a rolling pre-error buffer in memory and sends that buffer plus everything after an error. Use `sessionSampleRate = 1.0` in development and lower it before production.

| Production strategy | `sessionSampleRate` | `onErrorSampleRate` |
|---|---|---|
| Errors only (lowest overhead) | `0` | `1.0` |
| Balanced | `0.05` | `1.0` |
| High visibility | `0.1` | `1.0` |

### Manual control

- **Since v10.0.0 (Android, iOS; a no-op elsewhere or before init):** `SentryFlutter.replay.start()`, `startBuffering()`, `flush()` (buffer to session mode; starts a new session if none; "not a shutdown operation"), `pause()` / `resume()` around sensitive screens (use try/finally), `stop()`. All return `Future<void>`: await them in order; completion doesn't confirm receipt. Keep `SentryWidget` for manual recording. The mobile product page still says "Replay recording is currently configuration-driven only. There are no manual start/stop APIs".

### Masking

- **Masked by default:** `Text`, `RichText`, `EditableText`, `Image` (including asset images), `TextFormField` and `TextField`; a masked area becomes a filled block in a neutral color.
- **`maskAssetImages` default disagrees:** the v10 options list `maskAllText` `true` (`Text`, `EditableText`, `RichText`), `maskAllImages` `true` (`Image`) and `maskAssetImages` `false`, so asset images need `options.privacy.maskAssetImages = true`; the vendor setup guide's table (FLUTTER.md) says `true`, and the vendor replay reference lists asset images as masked by default.
- **Masking is by widget type** (`is Image`), so it survives obfuscation and covers subclasses. Rules apply in the order added; the first decision wins.
- **`SensitiveContent` widgets** with `ContentSensitivity.sensitive` or `autoSensitive` (and unknown values) are masked; `notSensitive` doesn't unmask by itself; custom rules and `SentryUnmask` take precedence. Turning off `maskAllText` / `maskAllImages` doesn't disable `SensitiveContent`, `SentryMask` or custom rules.
- **Verify masking before enabling replay in production.** If you find unmasked PII, turn Session Replay off until it is fixed.

```dart
// Mask all IconButton widgets (masked by the widget type)
options.privacy.mask<IconButton>();

// Unmask Image widgets (show images in replay)
options.privacy.unmask<Image>();
```

```dart
options.privacy.maskCallback<Text>(
  (Element element, Text widget) {
    // Mask only text containing 'secret'
    if (widget.data?.contains('secret') ?? false) {
      return SentryMaskingDecision.mask;
    }
    return SentryMaskingDecision.continueProcessing;
  },
);
```

- **Third-party widgets aren't detected;** register them: `options.privacy.mask<FlutterMap>();`, `options.privacy.mask<VideoPlayer>();`.
- **Turn all masking off** (`maskAllText`, `maskAllImages`, `maskAssetImages` false) only if the app has absolutely no sensitive data, and set them before `appRunner` runs, or everything stays masked.

### What it records and costs

- **The replay view** shows the video (about 1 fps), breadcrumbs (taps, navigation, lifecycle), timeline, network (HTTP requests), errors, tags and trace. Taps record position, widget and time; swipe paths, velocity and multi-touch are not recorded.
- **Session lifecycle:** starts on init or foreground; pauses in the background; continues if the app returns within 30 seconds, otherwise a new session starts; ends at 60 minutes; ends abnormally on a crash or a close in the background.
- **Overhead while recording:** CPU +5 to 10%, memory +15 to 25 MB, 1 to 2 fewer FPS, network about 7 to 10 KB/s. `onErrorSampleRate` alone (`sessionSampleRate` 0) costs least.
- **Limits:** the pre-error buffer lives in memory and is shorter on low-memory devices (an empty buffer there has no workaround); no widget-tree inspection per frame.

## Logs

- **Versioned Logs contract:** official support starts 9.0.0; direct logger calls are enabled by default 9.28.0+, while v9 automatic collection still uses enableLogs. Earlier 9.x needs enableLogs:true, and 10 removes it. The old vendor source used 9.5 and claimed all versions silently drop without explicit true. [https://docs.sentry.io/platforms/dart/guides/flutter/logs/]
- **This changed:** the current docs say logs (SDK `9.0.0`+) are on by default from `9.28.0`, and "In SDK v10, the `enableLogs` option is removed." On v10 drop `enableLogs` lines; below 9.28.0 keep them.
- **The v10 API takes typed attributes** (the old vendor reference used positional raw maps): `Sentry.logger.info('Order completed', attributes: { 'order_id': SentryAttribute.string('12345'), 'total': SentryAttribute.double(99.99) });` with `SentryAttribute.string/int/double/bool`. Logger methods return `void` (don't await). Templates: `Sentry.logger.fmt.info("%s added %s to cart.", [user.username, product.name]);` (must use `%s`). Same practice as JS: wide events, business context, `snake_case` attribute names ("to match Dart conventions"); see [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#logs).

```dart
Sentry.logger.error('Uh oh, something broke, here is the error: $errorMsg',
    attributes: {
      'error': SentryAttribute.string(errorMsg),
      'some_info': SentryAttribute.string('some info'),
    });
Sentry.logger.info('User ${user.username} added ${product.name} to cart.', attributes: {
  'user': SentryAttribute.string(user.username),
  'product': SentryAttribute.string(product.name),
});
```

| Level | For |
|---|---|
| `trace` | Step-by-step internals |
| `debug` | Development diagnostics |
| `info` | Business events and state transitions |
| `warn` | Recoverable errors, approaching limits |
| `error` | Failures that need investigation but don't crash |
| `fatal` | The app or a critical subsystem is down |

- **Current attributes use SentryAttribute.string/int/double/bool through the named attributes argument.** The old raw-map positional calls are retired above. [https://docs.sentry.io/platforms/dart/guides/flutter/logs/] Attributes become queryable columns in the Logs view. Attached automatically: `sentry.environment`, `sentry.release`, `sentry.sdk.name`/`sentry.sdk.version`, `user.id`/`user.email`, `origin`.

### The Dart `logging` package (v9 source example)

- **Install** `sentry_flutter: ^9.14.0`, `sentry_logging: ^9.14.0` and `logging: ^1.0.0` (`sentry_logging` needs 9.5.0+ and `logging` 1.0.0+). `LoggingIntegration` not found means the package or the `package:sentry_logging/sentry_logging.dart` import is missing.

```dart
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:sentry_logging/sentry_logging.dart';
import 'package:logging/logging.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_DSN';
      options.enableLogs = true;

      options.addIntegration(
        LoggingIntegration(
          // Minimum level that creates breadcrumbs (default: Level.INFO)
          minBreadcrumbLevel: Level.INFO,
          // Minimum level that creates Sentry error events (default: Level.SEVERE)
          minEventLevel: Level.SEVERE,
          // Minimum level that creates structured logs (default: Level.INFO)
          minSentryLogLevel: Level.INFO,
        ),
      );
    },
    appRunner: () => runApp(MyApp()),
  );
}
```

- **SEVERE and SHOUT create error events.** The `logging` package captures no stack traces on its own: set `Logger.root.recordStackTraceAtLevel = Level.SEVERE;` or pass them, `Logger('MyService').severe('Error occurred', error, stackTrace);`.

### Filter and link

- **Filter in beforeSendLog:** there is no per-log sample rate. In v10 it takes `(log, hint)`: `options.beforeSendLog = (log, hint) { if (log.level == SentryLogLevel.info) return null; return log; };`; v9 takes only `log`, while the unchanged official block below uses v10.

```dart
await SentryFlutter.init(
  (options) {
    options.dsn = "https://<key>@o<orgId>.ingest.sentry.io/<projectId>";
    options.beforeSendLog = (log, hint) {
      if (log.level == SentryLogLevel.info) {
        // Filter out all info logs
        return null;
      }

      return log;
    };
  },
);
```

The retired vendor hook also dropped trace/debug in production, removed the password attribute and redacted creditCard. Preserve those source policies through the installed typed log API when required; the exact official v10 example above illustrates dropping info instead. [getsentry/sentry-for-ai, sentry-flutter-sdk; https://docs.sentry.io/platforms/dart/guides/flutter/logs/]

- **Log correlation needs the actual active span,** not merely constructing a transaction. Keep the source's validation/payment/confirmation milestones if they answer the diagnostic question. [getsentry/sentry-for-ai, sentry-flutter-sdk; existing HTTP tracing source]

The old processOrder recipe logged cart validation, payment and confirmation while constructing a transaction without binding it. Use the existing [active transaction binding](#http-and-distributed-tracing) for that source workflow; the unbound recipe is retired rather than claiming proven log correlation. [getsentry/sentry-for-ai, sentry-flutter-sdk; existing HTTP tracing source]

- **Limits:** logs buffered since the last flush are lost if the app dies unexpectedly. Keep a log payload under 1 MB.
- **`[Filtered]` in an attribute** means a server-side PII scrubbing rule matched; adjust Data Scrubbing in the project. Logs vanishing silently: check org stats for rate limiting.

## Metrics

The current official Flutter SDK 9.11+ API has count, gauge and distribution, typed attributes and no extra setup beyond initialization. The old vendor reference used increment with value/tags and claimed 9.0; that retired beta form is not the current API. [https://docs.sentry.io/platforms/dart/guides/flutter/metrics/]

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

// Count occurrences
Sentry.metrics.count('orders_created', 1);

// Track current values
Sentry.metrics.gauge('active_connections', 42);

// Track distributions
Sentry.metrics.distribution(
  'api_latency',
  187,
  unit: 'millisecond',
);
```

### Attributes and units

Attributes support environment, feature-flag and user-tier slices; each metric must remain under 2 KB or it is dropped. Typed scope attributes apply to logs, metrics and stream-mode spans. gauge/distribution accept unit strings or SentryMetricUnit; common units are millisecond, second, byte, kilobyte, megabyte. [https://docs.sentry.io/platforms/dart/guides/flutter/metrics/]

```dart
Sentry.metrics.count(
  'api_calls',
  1,
  attributes: {
    'endpoint': SentryAttribute.string('/api/orders'),
    'user_tier': SentryAttribute.string('pro'),
    'region': SentryAttribute.string('us-west'),
  },
);
```

```dart
// Add attributes to the global scope
Sentry.setAttributes({'is_admin': SentryAttribute.bool(true)});

// All scope attributes are added to metrics
Sentry.metrics.count('clicks', 1);
Sentry.metrics.gauge(
  'time_since_refresh',
  4,
  unit: 'second',
);
```

```dart
Sentry.metrics.distribution(
  'response_time',
  187.5,
  unit: SentryMetricUnit.millisecond,
);

Sentry.metrics.gauge(
  'memory_usage',
  1024,
  unit: SentryMetricUnit.byte,
);
```

### Filtering and defaults

The v10 callback takes metric and Hint; return null to drop. SDK 9 takes only metric and can disable through enableMetrics; v10 has no enable/disable option. The old source's local aggregation/late-arrival and gauge/distribution summaries described its earlier beta API, not a guarantee of current per-event storage. [https://docs.sentry.io/platforms/dart/guides/flutter/metrics/]

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

await SentryFlutter.init((options) {
  options.dsn = 'https://<key>@o<orgId>.ingest.sentry.io/<projectId>';
  options.beforeSendMetric = (metric, hint) {
    // Drop specific metrics
    if (metric.attributes.containsKey('debug')) {
      return null;
    }

    // Return the metric to send it
    return metric;
  };
});
```

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

await SentryFlutter.init((options) {
  options.dsn = 'https://<key>@o<orgId>.ingest.sentry.io/<projectId>';
  options.beforeSendMetric = (metric, hint) => null;
});
```

Default attributes are sentry.environment, release, sdk.name, sdk.version; available os/device fields; user fields only with sendDefaultPii; and replay id when available. The historical JS beta removal is a different version/product phase, not evidence that current Flutter or JavaScript Application Metrics do not exist. [https://docs.sentry.io/platforms/dart/guides/flutter/metrics/; existing Sentry UPGRADE.md]

## User feedback

- **API:** `Sentry.captureFeedback(SentryFeedback(message: ..., contactEmail: ..., name: ..., associatedEventId: sentryId))`, with the ID from `beforeSend`, a capture call's return value, or `Sentry.lastEventId`.
- **Form:** `SentryFeedbackForm` (named `SentryFeedbackWidget` before `9.21.0`). Set `options.navigatorKey`, then `SentryFeedbackForm.show(context, associatedEventId: event.eventId, screenshot: await SentryFlutter.captureScreenshot())`; screenshots need `SentryWidget`. With `onErrorSampleRate` set, the replay buffer (up to 30 seconds) is sent when the form opens or on `Sentry.captureFeedback()`.
- **`options.feedback.*`:** `title`, `isNameRequired` false, `showName` true, `isEmailRequired` false, `showEmail` true, `useSentryUser` true, `showBranding` true, `showCaptureScreenshot` true, plus labels.

## Debugging

| Symptom | Fix |
|---|---|
| Navigation not tracked | Add `SentryNavigatorObserver()`; name every route (`name:` on every `GoRoute`) |
| Routes show as `null` | Unnamed routes; add names |
| Traces not split per navigation | `enableNewTraceOnNavigation` is false since 9.19.0; set true |
| TTID/TTFD spans missing | 9.1.0+ and named routes |
| TTFD never reports | `SentryFlutter.currentDisplay()?.reportFullyDisplayed()` or `SentryDisplayWidget` |
| Empty user-interaction transactions | Give the widget a `Key`; child work must start within `idleTimeout` |
| Dio or HTTP spans missing | Bind a transaction to scope (`bindToScope: true`); `dio.addSentry()` last |
| App start missing | iOS/Android only; not in add-to-app |
| Slow/frozen frames missing | Init Sentry before `WidgetsFlutterBinding`, or `SentryWidgetsFlutterBinding.ensureInitialized()` |
| Too many transactions | Lower `tracesSampleRate` to 0.1 or drop health checks in `tracesSampler` |
| Profiling not working | iOS/macOS only; `tracesSampleRate > 0` first; real device |
| Replay not recording | iOS/Android only; `SentryWidget` at the root; sample rates above 0 |
| Replay works in debug, not production | Production sample rates non-zero; the DSN is right for the environment |
| Logs missing | `enableLogs: true`; import `package:sentry/sentry.dart`; 9.5.0+ |

## Prove it

- **A navigation trace:** navigating between named routes shows a transaction with child spans in Traces, with route names, not `null`.
- **HTTP and database spans:** a request through `SentryHttpClient` or Dio, and a query through a `sentry_*` database package, inside a `bindToScope: true` transaction appear as child spans.
- **Backend link:** a request to a host in `tracePropagationTargets` carries `sentry-trace` and `baggage` (and `traceparent` with `propagateTraceparent`), and the backend span joins the mobile trace.
- **Replay:** on an iOS or Android release build, a session with an error appears in Replays, and every text field, image and registered third-party widget is masked.
- **Profiling:** on a real iOS device (not the Simulator), trigger a transaction (for example a navigation), open it under Performance and find the Profiling tab.
- **Logs:** `Sentry.logger.info('Test log from Flutter app')` appears in Logs with its attributes as columns, and a log inside a transaction links to it.
- **Metrics:** a current count/gauge/distribution call appears with its typed attributes; verify the selected SDK 9/v10 hook contract. [https://docs.sentry.io/platforms/dart/guides/flutter/metrics/]
- **Tracing, from the v10 setup page:** `final transaction = Sentry.startTransaction('test-transaction', 'task'); final span = transaction.startChild('test-span'); await span.finish(); await transaction.finish();`
