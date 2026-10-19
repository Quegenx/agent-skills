# Device features

App-level device features a Flutter app reaches through existing plugins rather than its own platform channel: the status bar style, blocking screenshots, the device's IANA timezone, showing the app version, iOS home-screen widgets, a portrait lock and platform detection. Sources: ApparenceKit tips and blog posts (apparencekit.dev) and FlutterPro tips by Kamran Bekirov (flutterpro.design), checked against api.flutter.dev and pub.dev where a snippet was flagged. Where the source disagrees with the Flutter skill ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md)), both are stated. Permissions and notifications are in [NOTIFICATIONS-AND-PERMISSIONS.md](NOTIFICATIONS-AND-PERMISSIONS.md); writing your own channel is [flutter PLATFORM-INTEGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PLATFORM-INTEGRATION.md).

**Contents:** [Status bar style](#status-bar-style) · [Block screenshots](#block-screenshots) · [Device timezone](#device-timezone) · [Show the app version](#show-the-app-version) · [iOS home-screen widgets](#ios-home-screen-widgets) · [Portrait lock](#portrait-lock) · [Detect the platform](#detect-the-platform) · [Keep the screen awake only where needed](#keep-the-screen-awake-only-where-needed) · [Open social media apps](#open-social-media-apps) · [Prove it](#prove-it)

## Status bar style

[ApparenceKit](https://apparencekit.dev/flutter-tips/change-system-bar-brightness/): `SystemChrome.setSystemUIOverlayStyle` takes a `SystemUiOverlayStyle`; switch the icons on the theme mode (verbatim, including the article's comments):

```dart
SystemChrome.setSystemUIOverlayStyle(
  SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarBrightness: mode == ThemeMode.light ? Brightness.light : Brightness.dark, // Only Android
    statusBarIconBrightness: mode == ThemeMode.light ? Brightness.dark : Brightness.light, // Only iOS (inverted) & Android
  ),
);
```

- **`statusBarColor: Colors.transparent`** is common when the app's content should go behind the bar.
- **The article's platform comments are swapped.** Official: [`statusBarBrightness`](https://api.flutter.dev/flutter/services/SystemUiOverlayStyle/statusBarBrightness.html), "The brightness of top status bar", is "Only honored in iOS"; [`statusBarIconBrightness`](https://api.flutter.dev/flutter/services/SystemUiOverlayStyle/statusBarIconBrightness.html), "The brightness of the top status bar icons", is "Only honored in Android version M and greater." Corrected comments:
  ```dart
  statusBarBrightness: mode == ThemeMode.light ? Brightness.light : Brightness.dark, // iOS only
  statusBarIconBrightness: mode == ThemeMode.light ? Brightness.dark : Brightness.light, // Android M+ only
  ```
  Only the comments change; the values are the article's.
- **iOS: status bar hidden at launch or ignoring the style.** In `Info.plist` set `View controller-based status bar appearance` to `NO` [ApparenceKit](https://apparencekit.dev/flutter-tips/change-system-bar-brightness/).
- **Edge-to-edge:** Flutter 3.27 made Edge-to-Edge the default `SystemUiMode` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)); the article (undated) does not cover how `statusBarColor` behaves under it.

## Block screenshots

[ApparenceKit](https://apparencekit.dev/flutter-tips/prohibit-screenshots-flutter-app/): to protect private information or keep content from being shared, the `no_screenshot` plugin blocks screenshots and screen recording.

- **Turn it off on the sensitive screen,** inside `try`/`catch`, and not in debug builds (verbatim):
  ```dart
  /// This function disables screenshots and screen recording for security or privacy.
  Future<void> _disableScreenshots() async {
    if (kDebugMode) { // Check if we are in debug mode
      return; // Don't disable screenshots during debugging
    }
    try {
      await noScreenshot.screenshotOff(); // Turn off screenshots
    } catch (e) {
      debugPrint('Failed to disable screenshots: $e'); // Log any errors
    }
  }
  ```
- **Always turn it back on** when the user leaves the sensitive page or the widget is no longer needed; forgetting it "can lead to a frustrating experience for your users" (verbatim):
  ```dart
  /// This function re-enables screenshots when leaving the sensitive screen.
  Future<void> _enableScreenshots() async {
    try {
      await noScreenshot.screenshotOn(); // Turn on screenshots
    } catch (e) {
      debugPrint('Failed to enable screenshots: $e'); // Log any errors
    }
  }
  ```

## Device timezone

[ApparenceKit](https://apparencekit.dev/flutter-tips/getting-device-timezone/): use `flutter_timezone` with `timezone` to get the device's native IANA zone ID (verbatim):

```dart
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';

tz.initializeTimeZones();
_currentTimeZone = await FlutterTimezone.getLocalTimezone();
```

- **Corrected for current packages.** `initializeTimeZones` comes from the data library: `import 'package:timezone/data/latest.dart' as tz;` ([timezone](https://pub.dev/packages/timezone)). In `flutter_timezone` 5.x, `getLocalTimezone()` returns a `TimezoneInfo`, not a `String` ([flutter_timezone 5.1.1](https://pub.dev/packages/flutter_timezone)); the zone ID is its `identifier`, "The standardized IANA identifier for this timezone" ([TimezoneInfo](https://pub.dev/documentation/flutter_timezone/latest/timezone_info/TimezoneInfo-class.html)):
  ```dart
  final TimezoneInfo currentTimeZone = await FlutterTimezone.getLocalTimezone();
  ```
- **Why `DateTime` is not enough:** `timeZoneName` and `timeZoneOffset` carry no history of timezone rules or future changes, don't follow governments' rule changes, and scheduled notifications can fire at the wrong time across a future DST shift. The comparison (verbatim):
  ```dart
  print('timeZoneName: ${DateTime.now().timeZoneName}');
  print('timeZoneOffset: ${DateTime.now().timeZoneOffset}');
  final currentTimeZone = await FlutterTimezone.getLocalTimezone();
  print('timeZone: $currentTimeZone');
  ```
  ```
  flutter: timeZoneName: CEST
  flutter: timeZoneOffset: 2:00:00.000000
  flutter: timeZone: Europe/Paris
  ```
  The last line is the IANA ID (`Europe/Paris`), "much more robust than just an offset or a general name like `CEST`". On `flutter_timezone` 5.x print `currentTimeZone.identifier` to get that line.
- **Rescheduling notifications when the zone or offset changes** is in [NOTIFICATIONS-AND-PERMISSIONS.md](NOTIFICATIONS-AND-PERMISSIONS.md#reschedule-on-timezone-or-clock-change).

## Show the app version

[ApparenceKit](https://apparencekit.dev/flutter-tips/show-your-app-version/) (the article has no code): showing the version and build number helps customer support and helps you when testing builds downloaded from the stores. Get them with `package_info_plus` in an `async` function and render them with a `FutureBuilder`, for example on a settings page or at the bottom of a legal section. FlutterPro's version of this tip is in [APP-LIFECYCLE.md](APP-LIFECYCLE.md); the numbers come from `version:` in `pubspec.yaml` ([flutter BUILD-AND-RELEASE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/BUILD-AND-RELEASE.md)).

## iOS home-screen widgets

[ApparenceKit](https://apparencekit.dev/blog/flutter-ios-home-widget/):

- **Flutter cannot run inside a Widget Extension.** "They run on a tiny little thread with strict memory limits. So small that Flutter can't run there." Render the widget in SwiftUI; keep fetching and managing data in Flutter.
- **Two processes, one shared store.** The app and the Widget Extension can't share memory, so they share an App Group: the Flutter app fetches data and saves it to `UserDefaults` through the App Group; the extension wakes up, reads `UserDefaults` and renders with SwiftUI.
- **Create the target:** open `ios/Runner.xcworkspace`; File > New > Target > "Widget Extension"; name it (e.g. `HomeWidget`). For a basic widget do not check "Include Live Activity" or "Configuration App Intent".
- **Fix the "Thin Binary" build error.** After adding the target the build often fails because "The Flutter build script interferes with the extension build process." Runner target > Build Phases: drag the "Thin Binary" script to the very bottom.
- **App Groups on both targets.** Runner > Signing & Capabilities > + Capability > App Groups; the ID convention is `group.<bundle identifier>` (e.g. `group.io.apparence.my_app`); repeat on the Widget Extension with the exact same group. "If you don't prefix the App Group with the same identifier of your app, it won't work." Creating and assigning App Groups from the CLI, and the provisioning-profile catch, are in [app-store-connect BUILD-AND-SIGNING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/BUILD-AND-SIGNING.md); the privacy-manifest reason for App Group `UserDefaults` (`1C8F.1`) is in [app-store-connect PRIVACY-AND-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRIVACY-AND-COMPLIANCE.md).
- **Dart side with `home_widget`** (https://pub.dev/packages/home_widget): set the group at startup, then save data and ask iOS to refresh (verbatim):
  ```dart
  import 'package:home_widget/home_widget.dart';

  void main() async {
    WidgetsFlutterBinding.ensureInitialized();
    
    // Set the group ID you created in Xcode
    await HomeWidget.setAppGroupId('group.io.apparence.my_app');
    
    runApp(MyApp());
  }
  ```
  ```dart
  Future<void> updateWeatherWidget(int temperature, String condition) async {
    // Save data to the shared container
    await HomeWidget.saveWidgetData<String>('temperature', temperature.toString());
    await HomeWidget.saveWidgetData<String>('condition', condition);
    
    // Notify iOS to refresh the widget UI
    // 'WeatherWidget' must match the kind/name used in your Swift code
    await HomeWidget.updateWidget(
      name: 'WeatherWidget',
      iOSName: 'WeatherWidget', 
    );
  }
  ```
- **Swift side:** change Apple's default timeline provider to read the same suite, then show the values with SwiftUI `Text()` or `Image()` (verbatim):
  ```swift
  struct WeatherEntry: TimelineEntry {
      let date: Date
      let temperature: String
      let condition: String
  }

  func getTimeline(...) {
      // Access the shared App Group
      let prefs = UserDefaults(suiteName: "group.io.apparence.my_app")
      
      // Read the data sent from Flutter
      let temp = prefs?.string(forKey: "temperature") ?? "0"
      let cond = prefs?.string(forKey: "condition") ?? "Sunny"

      let entry = WeatherEntry(date: Date(), temperature: temp, condition: cond)
      
      // Create the timeline (update immediately)
      let timeline = Timeline(entries: [entry], policy: .atEnd)
      completion(timeline)
  }
  ```
  `getTimeline(...)` is elided in the article. The group ID, the keys (`temperature`, `condition`) and the widget name are strings repeated on both sides: "'WeatherWidget' must match the kind/name used in your Swift code".

## Portrait lock

The sources disagree; this is a product decision, so both are tagged.

- **Lock it when the app is designed for portrait only** [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-force-portrait-mode/): "Sometimes, you design an app specifically for portrait view, and having it switch to landscape just doesn't make sense." Run it in `main()`, before `runApp()` (verbatim):
  ```dart
  void main() {
    WidgetsFlutterBinding.ensureInitialized(); // Good practice
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    runApp(MyApp()); // Your app widget
  }
  ```
  It keeps the app from rotating to landscape "no matter how the user holds their device".
- **Do not lock** (Flutter docs, [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#orientation)): "The Material Guidelines encourage you to never _portrait lock_ your app"; a lock letterboxes the app on foldables, and for apps targeting Android 17+ `SystemChrome.setPreferredOrientations` is ignored on displays of 600dp or more ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)). The article is undated and does not mention either.

## Detect the platform

[ApparenceKit](https://apparencekit.dev/flutter-tips/detect-flutter-running-platform/): check desktop, mobile or web from `package:flutter/foundation.dart` (verbatim):

```dart
import 'package:flutter/foundation.dart';

class PlatformUtils {
  static bool isDesktop => defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.linux ||
      defaultTargetPlatform == TargetPlatform.macOS;

  static bool isMobile => defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS;

  static bool isWeb => kIsWeb;
}
```

- **The block does not compile:** a getter needs the `get` keyword ([dart.dev: getters and setters](https://dart.dev/language/methods), `double get right => left + width;`). Corrected (only `get` added):
  ```dart
  class PlatformUtils {
    static bool get isDesktop => defaultTargetPlatform == TargetPlatform.windows ||
        defaultTargetPlatform == TargetPlatform.linux ||
        defaultTargetPlatform == TargetPlatform.macOS;

    static bool get isMobile => defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;

    static bool get isWeb => kIsWeb;
  }
  ```
- **On web, don't import `dart:io`;** "It won't work there." `package:flutter/foundation.dart` is web-friendly and provides `defaultTargetPlatform` and `kIsWeb` [ApparenceKit](https://apparencekit.dev/flutter-tips/detect-flutter-running-platform/).
- **What to branch on is disputed.** The article uses it for "a different layout for desktop or a feature only for mobile" [ApparenceKit](https://apparencekit.dev/flutter-tips/detect-flutter-running-platform/). Flutter docs ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#capabilities-and-policies)): "Avoid using `Platform.isAndroid` and similar functions to make layout decisions or assumptions about what a device can do"; base layout on window size and put platform rules in `Capability` and `Policy` classes. Both allow a platform check for a platform feature or policy; they differ on layout.

## Keep the screen awake only where needed

Dot shorthands in these recipes, including `rootTab == .compass` and `mode: .externalApplication`, need Dart language version 3.10+ ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)). [FlutterPro](https://flutterpro.design/details/adaptive-date-picker)

[FlutterPro](https://flutterpro.design/details/keep-screen-awake): on some pages users look at the screen for a long time without touching it: a video player, a live call, navigation, a reading page. Keep the screen awake there with [wakelock_plus](https://pub.dev/packages/wakelock_plus).

- **Only on those pages.** "Don't turn it on in main.dart for the whole app. Users expect their phone to lock itself, for privacy and for battery."

The handler class:

```dart
import 'dart:async';

import 'package:wakelock_plus/wakelock_plus.dart';

class WakelockHandler {
  const WakelockHandler._();

  static StreamSubscription<bool>? _subscription;

  static void startSubscription(Stream<bool> source) {
    if (_subscription != null) return;

    _subscription = source.distinct().listen(_apply);
  }

  static Future<void> stopSubscription() async {
    await _subscription?.cancel();
    _subscription = null;

    await _apply(false);
  }

  static Future<void> enable() => _apply(true);

  static Future<void> disable() => _apply(false);

  static Future<void> _apply(bool value) {
    return WakelockPlus.toggle(enable: value);
  }
}
```

For screens that are pushed and popped, like a video player, use the manual methods:

```dart
@override
void initState() {
  super.initState();

  WakelockHandler.enable();
}

@override
void dispose() {
  WakelockHandler.disable();

  super.dispose();
}
```

- **Pitfall, tabs:** bottom bar tabs in an `IndexedStack` are built once and never disposed, so the `dispose` pattern never turns the wakelock off. `StatefulShellRoute.indexedStack` keeps each branch alive the same way ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs)). Pass the handler a stream that tells whether any visible page needs the wakelock right now. In the author's prayer times app it stays on in the "Compass" tab and the "Read" tab inside "Quran", so the stream combines the bottom tab with the inner tab:

```dart
Stream<bool> _stayAwake$() {
  return Rx.combineLatest2(
    rootTabCubit.stream.startWith(rootTabCubit.state),
    quranTabCubit.stream.startWith(quranTabCubit.state),
    (RootTab rootTab, QuranTab quranTab) {
      final bool isCompass = rootTab == .compass;
      final bool isReading = rootTab == .quran && quranTab == .read;

      return isCompass || isReading;
    },
  );
}
```

Start it once where the tabs are built:

```dart
WakelockHandler.startSubscription(_stayAwake$());
```

When the user opens the compass the wakelock turns on; when they leave, it turns off. `Rx.combineLatest2` and `.startWith` are rxdart operators and the `*Cubit` objects are bloc; the article names neither package.

## Open social media apps

[FlutterPro](https://flutterpro.design/details/launch-social-media-apps): social links should open the respective app directly if installed. Use `.externalApplication` mode and let the system take care of it; if the domain is claimed (App Links, Universal Links: [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#android-app-links)), it opens that app directly.

The source imports `package:url_launcher/url_launcher.dart` and calls `launchUrl` with `mode: .externalApplication`; its sample link names a real account, so that sample block is omitted. [FlutterPro](https://flutterpro.design/details/launch-social-media-apps)

- **Does not compile as published:** `launchUrl` takes a `Uri`, not a `String`: `Future<bool> launchUrl(Uri url, {LaunchMode mode = LaunchMode.platformDefault, ...})` (https://pub.dev/documentation/url_launcher/latest/url_launcher/launchUrl.html). Parse the selected URL with `Uri.parse` before passing it; the source passed a string.
- **Avoid custom schemes** (`instagram://`, `whatsapp://`): they fail on devices where the app is not installed.
- **WhatsApp chats:** `https://wa.me/{phone number}`, for example `https://wa.me/994512223344`.

## Prove it

- Toggle light and dark mode on an iPhone and an Android phone: status bar text stays readable on both, and with the app launched cold on iOS the bar is visible.
- Every `screenshotOff()` has a matching `screenshotOn()` on leave or dispose; open the protected screen, leave it, and take a screenshot elsewhere.
- Grep `getLocalTimezone`: the result is read through `.identifier` on `flutter_timezone` 5.x, and `initializeTimeZones` is imported from `timezone/data/latest.dart`.
- The version string on the settings screen matches the store build's version and build number.
- The App Group ID is identical in Runner, the Widget Extension, `HomeWidget.setAppGroupId` and `UserDefaults(suiteName:)`; the widget kind in `updateWidget` matches the Swift widget; a release build succeeds with "Thin Binary" last.
- Grep `setPreferredOrientations`: if present, the team chose a lock knowingly (see [Portrait lock](#portrait-lock)); check the app on a foldable or tablet.
- Grep `dart:io` in code that runs on web: none. Grep `defaultTargetPlatform` and `Platform.is`: no layout decision depends on them unless the team chose ApparenceKit's approach.
- **Wakelock:** the screen stays on only on the named pages and locks normally elsewhere, including after switching away from a kept-alive tab.
- **Social links:** a social link opens the installed app, and the browser when the app is absent; nothing uses a custom scheme.
