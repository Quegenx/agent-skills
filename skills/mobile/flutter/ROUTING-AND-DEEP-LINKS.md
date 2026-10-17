# Routing and deep links

How a Flutter app maps URLs to screens and opens from a link on Android, iOS and the web. The deciding mechanism is the Router: page-backed routes (built from `Page`s by a declarative router such as `go_router`) are always deep-linkable and always show the same screens for the same link, while pageless routes (`Navigator.push`, `showDialog`) are not. Deep links that open the app also need platform files on both sides: the app declares the domain, and the domain serves a file that names the app. The Flutter team maintains `go_router`, and it is the preferred way to write 90% of Flutter apps. Layer placement of view models in route builders is in [ARCHITECTURE.md](ARCHITECTURE.md); Android and iOS project files in general are in [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md).

**Contents:** [Navigator or Router](#navigator-or-router) · [go_router setup](#go_router-setup) · [Routes and parameters](#routes-and-parameters) · [Navigating](#navigating) · [Shell routes and tabs](#shell-routes-and-tabs) · [Redirects and auth](#redirects-and-auth) · [Errors](#errors) · [Type-safe routes](#type-safe-routes) · [How deep links arrive](#how-deep-links-arrive) · [Android App Links](#android-app-links) · [iOS Universal Links](#ios-universal-links) · [Third-party link plugins](#third-party-link-plugins) · [Versions and breaking changes](#versions-and-breaking-changes) · [Prove it](#prove-it)

## Navigator or Router

- **Small apps without complex deep linking can use `Navigator`.** Apps with specific deep linking and navigation needs should also use the `Router`, to handle deep links correctly on Android and iOS and stay in sync with the browser address bar on the web.
- **Imperative push:** `Navigator.of(context).push(MaterialPageRoute<void>(builder: (context) => const SecondScreen()))`.
- **Do not use named routes for most apps.** Their deep-link behavior cannot be customized (they always push a new route regardless of where the user is) and they do not support the browser forward button. Use `go_router` (or another routing package), or `Navigator` with `MaterialPageRoute`.
- **Router setup:** switch to `MaterialApp.router` or `CupertinoApp.router`. Advanced cases override `RouteInformationParser` and `RouterDelegate` and provide `Navigator.pages`.
- **Removing a page-backed route removes the pageless routes after it.**
- **You cannot block navigation from page-backed screens with `PopScope`** or the deprecated `WillPopScope`. GoRouter and other Router-based APIs are not compatible with `WillPopScope`.
- **Web:** the Router uses the browser History API; back follows reverse chronological navigation. By default the web path is read from the fragment (`/#/path/to/app/screen`); the path URL strategy removes the `#` and is essential for clean deep linking.

## go_router setup

- **Install:** `flutter pub add go_router` (a new app: `flutter create <app-name>`, `cd <app-name>` first).
- **One top-level `GoRouter`,** bound with `MaterialApp.router(routerConfig: ...)`. `GoRouter` is the route tree; `GoRoute` maps a URL path to a screen.

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

void main() {
  // Use path URL strategy to remove the '#' from web URLs
  usePathUrlStrategy();
  runApp(const MyApp());
}

final GoRouter _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'details/:id',
          builder: (context, state) => DetailsScreen(id: state.pathParameters['id']!),
        ),
      ],
    ),
  ],
  errorBuilder: (context, state) => ErrorScreen(error: state.error),
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: _router,
      title: 'Routing App',
    );
  }
}
```

- **Current docs samples import `package:material_ui/material_ui.dart`** instead of `package:flutter/material.dart` (Material published as a package; see [VERSIONS.md](VERSIONS.md)). The App Links cookbook's router:

```dart
import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

void main() => runApp(MaterialApp.router(routerConfig: router));

/// This handles '/' and '/details'.
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (_, _) => Scaffold(
        appBar: AppBar(title: const Text('Home Screen')),
      ),
      routes: [
        GoRoute(
          path: 'details',
          builder: (_, _) => Scaffold(
            appBar: AppBar(title: const Text('Details Screen')),
          ),
        ),
      ],
    ),
  ],
);
```

## Routes and parameters

| Need | How |
|---|---|
| Path parameter | `/users/:userId`, read `state.pathParameters['userId']` |
| Query parameter | `state.uri.queryParameters['filter']` |
| Child route | In the parent's `routes:`; equivalent to a push on top of the parent |
| Start location | `initialLocation: '/details'`, shown when the app first opens and the platform provides no deep link |
| Route logging | `debugLogDiagnostics: true` |
| Routes that change at runtime | `GoRouter.routingConfig(routingConfig: ValueNotifier<RoutingConfig>(...))` |
| Route metadata, regex constraints on path params | go_router 17.5.0+ |

## Navigating

```dart
// Replaces the current route stack with the target route (Declarative)
context.go('/details/123');

// Pushes the target route onto the existing stack (Imperative)
context.push('/details/123');

// Navigates using a named route and path parameters
context.goNamed('details', pathParameters: {'id': '123'});

// Pops the current route
context.pop();
```

- **`context.go()` replaces the stack; `push` and `pop` are imperative,** and imperative navigation is known to cause issues with the browser history (issue #99112).
- **Build URIs with `Uri(path: ..., queryParameters: {...}).toString()`.**
- **Return values:** `await context.push<bool>('/page2')` and `context.pop(true)`.
- **Extra data:** `context.go('/123', extra: 'abc')`, read with `GoRouterState.of(context).extra`. On the web `extra` is serialized; provide a codec for complex data.
- **Skip browser history:** `Router.neglect(context, () => context.go('/destination'))` or `routerNeglect: true`.
- **Real links on the web:** the `Link` widget from `url_launcher`.
- **`Navigator.push` pages are not deep-linkable** and are replaced if a parent page tied to a `GoRoute` is removed.

## Shell routes and tabs

- **`ShellRoute`** wraps children in a persistent shell with its own navigator: `ShellRoute(builder: (context, state, child) => Scaffold(body: child, bottomNavigationBar: ...))`.
- **`StatefulShellRoute.indexedStack`** keeps each branch's state (for example per bottom tab). Each `StatefulShellBranch` can take a `navigatorKey` and an optional `preload`. The shell receives a `StatefulNavigationShell` (`currentIndex`, `goBranch(index)`). go_router 18.1.0 added `clipBehavior` to `ShellRoute` and `StatefulShellBranch`.

```dart
final GoRouter _router = GoRouter(
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNavBar(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
```

```dart
class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({
    required this.navigationShell,
    super.key,
  });

  final StatefulNavigationShell navigationShell;

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      // Support navigating to the initial location when tapping the active tab.
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: _goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
```

## Redirects and auth

- **Handle auth and state-based routing with `redirect`,** a `GoRouterRedirect` callback on the `GoRouter` or `GoRoute` constructor. To show the intended route without redirecting, return `null` or the original route path:

```dart
redirect: (BuildContext context, GoRouterState state) {
  if (!AuthState.of(context).isSignedIn) {
    return '/signin';
  } else {
    return null;
  }   
},
```

- **Top-level `redirect`** (on `GoRouter`) is called before any navigation event; **route-level** (on a `GoRoute`) is called when a navigation event is about to display the route.
- **`redirectLimit` defaults to 5;** exceeding it shows the error screen.
- **`onEnter`** can block navigation; when it blocks the initial navigation, go_router 17.4.0+ raises `BlockedInitialNavigationException`.
- **Re-run redirects when auth changes** with `refreshListenable`. The Compass router passes the auth repository and builds each screen's view model in its route builder:

```dart
GoRouter router(
  AuthRepository authRepository,
) =>
    GoRouter(
      initialLocation: Routes.home,
      debugLogDiagnostics: true,
      redirect: _redirect,
      refreshListenable: authRepository,
      routes: [
        GoRoute(
          path: Routes.login,
          builder: (context, state) {
            return LoginScreen(
              viewModel: LoginViewModel(
                authRepository: context.read(),
              ),
            );
          },
        ),
        GoRoute(
          path: Routes.home,
          builder: (context, state) {
            final viewModel = HomeViewModel(
              bookingRepository: context.read(),
            );
            return HomeScreen(viewModel: viewModel);
          },
          routes: [
            // ...
          ],
        ),
      ],
    );
```

## Errors

| Error | Meaning | Fix |
|---|---|---|
| `GoError`, `AssertionError` | Misuse, for example a root path not starting with `/` or a `GoRoute` without a builder | Do not catch; fix the route config in code |
| `GoException` | An incoming URL could not be parsed, and similar runtime failures | Handle in `GoRouter.onException` (supersedes the other handlers), or `errorBuilder: (context, state) => ErrorScreen(state.error)` / `errorPageBuilder` |

## Type-safe routes

- **Dev dependencies:** `go_router_builder: any`, `build_runner: any`, `build_verify: any`.
- **Declare** `@TypedGoRoute<HomeScreenRoute>(path: '/', routes: [TypedGoRoute<SongRoute>(path: 'song/:id')])`, with route classes that `extends GoRouteData with _$SongRoute` and `part 'go_router_builder.g.dart';`.
- **Generate** with `flutter pub global activate build_runner` then `dart run build_runner build`; **navigate** with `const SongRoute(id: 2).go(context)`. go_router 17.3.0 added `hasOverriddenOnExit` for type-safe routes.

## How deep links arrive

- **Supported on iOS, Android and the web.**
- **With `Navigator`, a link pushes a route;** with the Router, the path is parsed and the navigator gets a new set of pages, so the app can replace the current pages when a link opens while it runs.

| Platform and state | Navigator | Router |
|---|---|---|
| iOS, not launched | `initialRoute` "/" then `pushRoute` | `RouteInformationParser` then `RouterDelegate.setNewRoutePath` |
| Android, not launched | `initialRoute` contains the route ("/deeplink") | `initialRoute` contains the route ("/deeplink") |
| Either, already running | `pushRoute` | Path parsed, Navigator gets a new set of Pages |

- **DevTools can validate deep links** in an Android or iOS app (the Deep links tool).

## Android App Links

- **An App Link is an `http`/`https` deep link,** Android only, and needs a web domain you own (temporarily: Firebase Hosting or GitHub Pages).
- **Intent filter** in `android/app/src/main/AndroidManifest.xml`, inside the `<activity>` for `.MainActivity`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="http" android:host="example.com" />
    <data android:scheme="https" />
</intent-filter>
```

- **Before Flutter 3.27** also add `<meta-data android:name="flutter_deeplinking_enabled" android:value="true" />`. Since 3.27 Flutter's deep linking is on by default.
- **Host `https://<webdomain>/.well-known/assetlinks.json`** with your `package_name` and `sha256_cert_fingerprints`. Get the fingerprint from Play Console (Release > Setup > App Integrity > App Signing) or `keytool -list -v -keystore <path-to-keystore>`. Several flavors mean several fingerprints.

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example.deeplink_cookbook",
    "sha256_cert_fingerprints":
    ["FF:2A:CF:7B:DD:CC:F1:03:3E:E8:B2:27:7C:A2:E3:3C:DE:13:DB:AC:8E:EB:3A:B9:72:A1:0E:26:8A:F5:EC:AF"]
  }
}]
```

- **Test the app side** (this does not verify the web hosting):

```bash
adb shell 'am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://yourdomain.com/details/123"' com.yourcompany.yourapp
```

- **Test both sides** by tapping a real link (for example in a Google Doc). Local debug builds may need **Supported web addresses** toggled on manually.
- **Coming: stricter Intent verification** (landed in 3.50.0-0.1.pre, not yet in stable). Release builds of `FlutterActivity` / `FlutterFragmentActivity` will verify the sender before honoring `route`, `dart_entrypoint`, `dart_entrypoint_args`, `cached_engine_id`, `cached_engine_group_id`. A sender is trusted if the activity has `android:exported="false"`, or on API 34+ the launching UID matches (`getLaunchedFromUid()`), or on API 33 and below the calling package matches (`startActivityForResult()` / `startActivityIfNeeded()`). Deep links (`ACTION_VIEW`) must match a manifest `<intent-filter>`. Fallbacks: route to `io.flutter.InitialRoute` meta-data or "/", entrypoint to `io.flutter.Entrypoint` or "main". Debug and profile builds bypass the check but log warnings. The launcher activity must stay exported.

## iOS Universal Links

- **Before Flutter 3.27** add `FlutterDeepLinkingEnabled` = `YES` to `Info.plist`. The `flutter-setup-declarative-routing` skill adds it to opt in to Flutter's default deep link handler (and says to set it to `NO` with a plugin such as `app_links`):

```xml
<key>FlutterDeepLinkingEnabled</key>
<true/>
```

- **Associated Domains capability.** Personal development teams do not support it. In Xcode: Runner target > Signing & Capabilities > + Capability > Associated Domains > `applinks:<web domain>`, or edit `ios/Runner/Runner.entitlements`:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:example.com</string>
</array>
```

- **Host `https://<webdomain>/.well-known/apple-app-site-association`** with no `.json` extension. Each `appID` is `<team id>.<bundle id>`; several schemes or flavors mean several appIDs. The cookbook's file:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": [
          "S8QB4VV633.com.example.deeplinkCookbook"
        ],
        "components": [
          {
            "/": "/*"
          }
        ]
      }
    ]
  }
}
```

  The `flutter-setup-declarative-routing` skill's version also carries `"apps": []` and `"paths": ["*"]`, which the cookbook's file does not (confirm the current format in Apple's docs):

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appIDs": ["TEAM_ID.com.yourcompany.yourapp"],
      "paths": ["*"],
      "components": [{"/": "/*"}]
    }]
  }
}
```

- **Apple's CDN can take up to 24 hours** to request the AASA file; bypass it with the alternate mode of the associated-domains entitlement.
- **Test** on a simulator, or type the URL in Notes on a device and tap it:

```bash
xcrun simctl openurl booted https://yourdomain.com/details/123
```

## Third-party link plugins

- **Turn Flutter's default handler off** when you use Firebase Dynamic Links, `uni_links`, `app_links` or `flutter_branch_sdk`; Flutter's default deep link handler breaks these plugins. Set `flutter_deeplinking_enabled` to `false` in `AndroidManifest.xml` and `FlutterDeepLinkingEnabled` to `<false/>` (`NO`) in `Info.plist`.

## Versions and breaking changes

- **go_router `18.1.0`** is current, with `sdk: ^3.12.0` and `flutter: ">=3.44.0"`. 18.0.0 migrated to `material_ui` and `cupertino_ui` and raised the minimum to Flutter 3.44 / Dart 3.12. 18.0.2 fixed shell chrome dropped from semantics by `ModalBarrier`. 17.3.0 required Flutter 3.38 / Dart 3.10. CHANGELOG: https://github.com/flutter/packages/blob/main/packages/go_router/CHANGELOG.md
- **Flutter 3.27:** deep linking default changed to true.
- **Flutter 3.24:** Navigator page APIs changed and `PopScope` became generic.
- **Flutter 3.38:** the default Android page transition is `PredictiveBackPageTransitionsBuilder` (300 ms to 450 ms); predictive back migration is at `/release/breaking-changes/android-predictive-back`. Release dates and the full list are in [VERSIONS.md](VERSIONS.md).

## Prove it

- **Cold start from a link:** with the app killed, the `adb shell 'am start ...'` and `xcrun simctl openurl booted ...` commands above open the target screen (`/details/123`), not the home screen.
- **Warm start from a link:** the same commands with the app running replace the visible screen with the target.
- **Both sides verified:** tapping the `https://` link from another app (a Google Doc, Notes) opens the app, not the browser. `https://<domain>/.well-known/assetlinks.json` and `https://<domain>/.well-known/apple-app-site-association` (no extension) both return the files.
- **Fingerprints cover every build:** `assetlinks.json` lists the Play App Signing fingerprint and one per flavor you ship.
- **One link handler:** with `app_links` or a similar plugin installed, `flutter_deeplinking_enabled` and `FlutterDeepLinkingEnabled` are false.
- **Web URLs are clean:** with `usePathUrlStrategy()` the address bar shows `/details/123` with no `#`, and browser back and forward move through screens.
- **Auth redirect holds:** signed out, opening a protected path lands on the sign-in route; signing in (which notifies `refreshListenable`) moves on without a manual reload.
- **Bad URL is handled:** an unknown path shows the `errorBuilder` screen, not a crash.
- **Tabs keep state:** with `StatefulShellRoute.indexedStack`, scrolling a tab, switching tabs and switching back keeps the scroll position.
