# Web and platform

Flutter web's HTML shell plus a few everyday platform behaviors: a progress bar while the engine boots, link preview cards, a browser tab title per page, a date picker that matches the platform, keeping the screen awake only where needed, opening social apps, and sharing a file instead of downloading it. Source: FlutterPro tips by Kamran Bekirov (flutterpro.design), third-party community advice, not Flutter team docs, checked against docs.flutter.dev and pub.dev where a sample needed it. Where a tip differs from the official-docs [flutter](../flutter/SKILL.md) skill, both sides are stated and tagged. Routing itself is in [ROUTING-AND-DEEP-LINKS.md](../flutter/ROUTING-AND-DEEP-LINKS.md).

**Contents:** [Version notes](#version-notes) · [Loading progress before the engine paints](#loading-progress-before-the-engine-paints) · [Link previews with Open Graph](#link-previews-with-open-graph) · [Browser tab title per page](#browser-tab-title-per-page) · [Date picker that matches the platform](#date-picker-that-matches-the-platform) · [Keep the screen awake only where needed](#keep-the-screen-awake-only-where-needed) · [Open social media apps](#open-social-media-apps) · [Share instead of download](#share-instead-of-download) · [Prove it](#prove-it)

## Version notes

- No article states a Flutter, Dart or package version. [FlutterPro](https://flutterpro.design/details/adaptive-date-picker)
- Dot shorthands appear throughout (`defaultTargetPlatform == .iOS`, `const .symmetric(horizontal: 16)`, `.now()`, `mode: .date`, `mode: .externalApplication`, `rootTab == .compass`); they need Dart language version 3.10+ ([LANGUAGE.md](../dart/LANGUAGE.md)).
- The samples import `package:flutter/material.dart` and `package:flutter/cupertino.dart`; Material and Cupertino are moving to their own packages ([LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#material-and-cupertino-as-packages)). Check at copy time.
- `SharePlus.instance.share(ShareParams(...))` is share_plus's instance API; the article gives no version, so check pub.dev at copy time.

## Loading progress before the engine paints

[FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress): Flutter web has to download `main.dart.js`, the CanvasKit (or skwasm) runtime, fonts and your assets before it can paint a single pixel. Depending on their size, that's "easily 3 to 5 seconds of staring at a blank white page".

No Dart needed: Flutter mounts into `<body>`, so anything you put there shows immediately and disappears on its own once the engine takes over. The source bar steps at loader lifecycle stages. [FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress)

Markup in `web/index.html`:

```html
<body>
  <div class="progress-container">
    <div class="progress-bar"></div>
  </div>

  <script src="flutter_bootstrap.js" async></script>
</body>
```

Style it in `web/style.css` and link it from the head:

```html
<link rel="stylesheet" href="style.css" />
```

```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #ffffff;
}

.progress-container {
  width: 120px;
  height: 8px;
  background-color: #FAFAFA;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background-color: #B591FF;
  transition: width 0.4s ease;
}
```

Make it move with a custom `web/flutter_bootstrap.js` next to `index.html`. "If the file exists, Flutter uses it instead of the auto-generated one." Hook into the loader stages:

```js
{{flutter_js}}
{{flutter_build_config}}

const bar = document.querySelector('.progress-bar');
const setProgress = (pct) => { bar.style.width = pct + '%'; };

setProgress(20); // bootstrap running

_flutter.loader.load({
  onEntrypointLoaded: async function (engineInitializer) {
    setProgress(50); // main.dart.js downloaded
    const appRunner = await engineInitializer.initializeEngine();
    setProgress(80); // engine ready
    await appRunner.runApp();
    // Flutter has taken over the page, nothing else to do
  },
});
```

- **Stage weights, not measured completion:** the source sets 20, 50 and 80 as constants at bootstrap, entrypoint-loaded and engine-ready stages. These are author-chosen weights, not byte or workload measurements. P3 correction: the old "Real milestones, not fake percentages" line overstated what the sample measures. This follows from the literal sample above and the documented [loader lifecycle](https://docs.flutter.dev/platform-integration/web/initialization). [FlutterPro](https://flutterpro.design/details/flutter-web-loading-progress)
- **Pitfall:** everything here ships as plain HTML and CSS with the initial page request. "Don't load a 2MB animated background, or you'll be solving one loading problem by creating another."
- **Official check** (https://docs.flutter.dev/platform-integration/web/initialization): a custom `flutter_bootstrap.js` needs the `{{flutter_js}}` token, the `{{flutter_build_config}}` token and a call to `_flutter.loader.load()`; the sample has all three. When you provide your own `onEntrypointLoaded`, "the `config` that you pass to `_flutter.loader.load()` is **not** forwarded to the engine automatically"; pass it to `initializeEngine()` yourself, for example `initializeEngine({ renderer: 'canvaskit' })`.

## Link previews with Open Graph

[FlutterPro](https://flutterpro.design/details/flutter-web-og-image): by default a Flutter web link shares as a bare URL (WhatsApp, Slack, X, anywhere). A few meta tags in the `<head>` of `web/index.html` give it a preview card with a title, description and image: Open Graph plus a few X-specific tags.

```html
<!-- Open Graph -->
<meta property="og:title" content="UserOrient - In-App Feedback for Flutter">
<meta property="og:description" content="Native Flutter SDK for in-app feature requests and voting. Set up in minutes.">
<meta property="og:image" content="https://userorient.com/og-image.png">
<meta property="og:url" content="https://userorient.com">
<meta property="og:type" content="website">

<!-- X / Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="UserOrient - In-App Feedback for Flutter">
<meta name="twitter:description" content="Native Flutter SDK for in-app feature requests and voting. Set up in minutes.">
<meta name="twitter:image" content="https://userorient.com/og-image.png">
```

(The source's titles separate the name with a dash; it is a hyphen here.)

- **`og:image` has to be an absolute URL.** A relative path like `og-image.png` gets ignored.
- **Size it at least 1200×630.** Meta: "Use images that are at least 1200 x 630 pixels", with a ratio "as close to 1.91:1" (https://developers.facebook.com/docs/sharing/webmasters/images). The line said "Size it 1200×630", an exact size where Meta gives a minimum.
- **`twitter:card` picks the X layout.** The archived X Cards markup says `twitter:image` falls back to `og:image`, and "If an og:type, og:title and og:description exist in the markup but twitter:card is absent, then a summary card may be rendered"; set `twitter:card` to `summary_large_image` for the wide image. The line said X "only sometimes falls back to `og:image`". Per-platform rules are in [../../marketing/seo/LINK-PREVIEWS.md](../../marketing/seo/LINK-PREVIEWS.md#x-cards).
- The fuller tag set for a marketing site (site name, locale, a share image per language) is in [landing-page-ui DISCOVERY.md](../../frontend/landing-page-ui/DISCOVERY.md).

## Browser tab title per page

[FlutterPro](https://flutterpro.design/details/browser-tab-title): the web app's title shows in the tab, history, bookmarks and autocomplete bar. Leave it the same on every page and a user with several tabs open can't tell them apart.

The tab title is whatever the nearest `Title` widget above the current page says. Wrap a page in one and that page owns its tab title:

```dart
@override
Widget build(BuildContext context) {
  return Title(
    title: 'Billing · Serverpod Cloud',
    color: Theme.of(context).colorScheme.surface,
    child: Scaffold(...),
  );
}
```

Doing this on every page is easy to forget. Wrap once instead, in `MaterialApp`'s `builder`, the single place every page flows through (its `child` is the active page). A fixed string there would repeat one title everywhere, so the wrapper reads the current route:

```dart
MaterialApp.router(
  routerConfig: goRouter,
  builder: (context, child) {
    return RouteTitle(
      child: child!,
    );
  },
)
```

"This uses go_router, adapt it to your own routing state." `RouteTitle` watches the global `goRouter` and rebuilds the `Title` on every navigation:

```dart
class RouteTitle extends StatelessWidget {
  final Widget child;

  const RouteTitle({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([
        goRouter.routerDelegate,
        goRouter.routeInformationProvider,
      ]),
      builder: (context, _) {
        final String path = goRouter.routeInformationProvider.value.uri.path;

        return Title(
          title: titleForPath(path),
          color: Theme.of(context).colorScheme.surface,
          child: child,
        );
      },
    );
  }
}
```

`titleForPath` is yours: map the path to a readable name, with a fallback so the tab is never blank (a list-pattern `switch`, see [LANGUAGE.md](../dart/LANGUAGE.md)):

```dart
String titleForPath(String path) {
  final List<String> segments = Uri.parse(path).pathSegments;
  final String? page = switch (segments) {
    ['billing'] => 'Billing',
    ['project', final String id, 'insights'] => 'Insights · $id',
    ['project', final String id] => id,
    _ => null,
  };

  return page == null ? 'Serverpod Cloud' : '$page · Serverpod Cloud';
}
```

- **`Title.color` is required and must be opaque** (alpha `0xFF`). It feeds the Android task switcher and is ignored on web.
- **`onGenerateTitle` can't track routes:** it only reruns on app rebuild, not navigation. The flutter skill uses it for the one localized app title ([LOCALIZATION.md](../flutter/LOCALIZATION.md)); per-route titles need `Title`.

## Date picker that matches the platform

[FlutterPro](https://flutterpro.design/details/adaptive-date-picker): `CupertinoDatePicker` looks polished, but it's iOS-native. Android users don't expect a scroll-wheel picker for dates, and "An iOS widget dropped into Android can even read as cheap." Use the scroll picker on iOS and the default Material one (`showDatePicker`) on Android.

- **Custom design is no reason to skip it.** The Material picker is platform UI, so users read the exception as normal. You can still theme it; keep the skeleton layout, "which is muscle memory for Android users."
- **Packages:** the author has "yet to find one neutral enough to justify mixing with a custom design."
- **Fits the official rules:** Flutter's `.adaptive()` constructors substitute Cupertino on iOS for switches, sliders, dialogs and more ([LAYOUT-AND-RESPONSIVE.md](../flutter/LAYOUT-AND-RESPONSIVE.md#platform-adaptations)); this tip does the same by hand for the date picker. It branches a platform-idiom widget on `defaultTargetPlatform`, which [PLATFORM-INTEGRATION.md](../flutter/PLATFORM-INTEGRATION.md) names; [SKILL.md](../flutter/SKILL.md) rule 2 forbids branching *layout* on `Platform.isAndroid`, a different thing.

Call it and await the picked date. It returns `null` when the user dismisses the sheet, so keep the old value then:

```dart
final DateTime? date = await AdaptiveDatePicker.show(
  context,
  initialDate: _date,
  firstDate: DateTime(2000),
  lastDate: DateTime.now(),
);

if (date != null) {
  setState(() => _date = date);
}
```

The widget ("Tweak the values to taste": sheet height 400, horizontal padding 16, a 24 gap before Done). `Button` is a placeholder for your own button widget:

```dart
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AdaptiveDatePicker {
  const AdaptiveDatePicker._();

  static Future<DateTime?> show(
    BuildContext context, {
    required DateTime firstDate,
    required DateTime lastDate,
    DateTime? initialDate,
  }) {
    final bool isIos = defaultTargetPlatform == .iOS;

    if (isIos) {
      return _CupertinoDatePickerSheet.show(
        context,
        initialDate: initialDate,
        minimumDate: firstDate,
        maximumDate: lastDate,
      );
    }

    return showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
    );
  }
}

class _CupertinoDatePickerSheet extends StatefulWidget {
  final DateTime? initialDate;
  final DateTime? minimumDate;
  final DateTime? maximumDate;

  const _CupertinoDatePickerSheet({
    this.initialDate,
    this.minimumDate,
    this.maximumDate,
  });

  static Future<DateTime?> show(
    BuildContext context, {
    DateTime? initialDate,
    DateTime? minimumDate,
    DateTime? maximumDate,
  }) {
    return showModalBottomSheet<DateTime?>(
      context: context,
      builder: (BuildContext context) {
        return _CupertinoDatePickerSheet(
          initialDate: initialDate,
          minimumDate: minimumDate,
          maximumDate: maximumDate,
        );
      },
    );
  }

  @override
  State<_CupertinoDatePickerSheet> createState() =>
      _CupertinoDatePickerSheetState();
}

class _CupertinoDatePickerSheetState extends State<_CupertinoDatePickerSheet> {
  late DateTime _selectedDate = widget.initialDate ?? .now();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      padding: const .symmetric(horizontal: 16),
      child: SafeArea(
        child: Column(
          children: [
            Flexible(
              child: CupertinoDatePicker(
                mode: .date,
                initialDateTime: widget.initialDate,
                minimumDate: widget.minimumDate,
                maximumDate: widget.maximumDate,
                onDateTimeChanged: (DateTime dateTime) {
                  _selectedDate = dateTime;
                },
              ),
            ),
            const SizedBox(height: 24),
            // TODO: replace with your button widget
            Button(
              label: 'Done',
              onPressed: () {
                Navigator.of(context).pop(_selectedDate);
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

## Keep the screen awake only where needed

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

- **Pitfall, tabs:** bottom bar tabs in an `IndexedStack` are built once and never disposed, so the `dispose` pattern never turns the wakelock off. `StatefulShellRoute.indexedStack` keeps each branch alive the same way ([ROUTING-AND-DEEP-LINKS.md](../flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs)). Pass the handler a stream that tells whether any visible page needs the wakelock right now. In the author's prayer times app it stays on in the "Compass" tab and the "Read" tab inside "Quran", so the stream combines the bottom tab with the inner tab:

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

[FlutterPro](https://flutterpro.design/details/launch-social-media-apps): social links should open the respective app directly if installed. Use `.externalApplication` mode and let the system take care of it; if the domain is claimed (App Links, Universal Links: [ROUTING-AND-DEEP-LINKS.md](../flutter/ROUTING-AND-DEEP-LINKS.md#android-app-links)), it opens that app directly.

Verbatim:

```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> launchInstagram() async {
  await launchUrl(
    'https://instagram.com/beyt.app', // your link
    mode: .externalApplication,
  );
}
```

- **Does not compile as published:** `launchUrl` takes a `Uri`, not a `String`: `Future<bool> launchUrl(Uri url, {LaunchMode mode = LaunchMode.platformDefault, ...})` (https://pub.dev/documentation/url_launcher/latest/url_launcher/launchUrl.html). Corrected line: `Uri.parse('https://instagram.com/beyt.app'), // your link`.
- **Avoid custom schemes** (`instagram://`, `whatsapp://`): they fail on devices where the app is not installed.
- **WhatsApp chats:** `https://wa.me/{phone number}`, for example `https://wa.me/994512223344`.

## Share instead of download

[FlutterPro](https://flutterpro.design/details/share-instead-of-download): a "Download" button usually drags in storage permission, handling the user saying no, finding the right public folder on Android, scoped storage, a different path on iOS, then hoping the user finds the file. Almost all of that only puts the file in a public folder, and right after, the user usually opens it or sends it. The OS already has a screen for that, the native share sheet: "Save to Files", AirDrop, Messages, Mail, WhatsApp.

So download the bytes, save them to the app's own cache, and pass the file to the share sheet. `getTemporaryDirectory()` (path_provider) needs no permission on any platform:

```dart
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';

Future<XFile> _downloadToCache(String url, String filename) async {
  final http.Response response = await http.get(Uri.parse(url));

  final Directory dir = await getTemporaryDirectory();
  final File file = File('${dir.path}/$filename');
  await file.writeAsBytes(response.bodyBytes);

  return XFile(file.path);
}
```

Then open the share sheet:

```dart
Future<void> shareFile(String url) async {
  final XFile file = await _downloadToCache(url, 'invoice.pdf');

  await SharePlus.instance.share(
    ShareParams(files: [file]),
  );
}
```

- No `permission_handler`, no folders per platform, no "where did my file go". Show a loading state while the file downloads.
- **The rule:** "if "download" really means "let me do something with this file", let the OS show the options."
- **Status codes (two views, both tagged):** [Flutter docs, via flutter skill]: throw on any unexpected status code ([SKILL.md](../flutter/SKILL.md) rule 4, [DATA-AND-NETWORKING.md](../flutter/DATA-AND-NETWORKING.md#making-requests)). [FlutterPro]: the sample writes `response.bodyBytes` without checking `response.statusCode`, so a 404 page would be shared as `invoice.pdf`. Add the check when copying.
- **Store side:** this is the Flutter form of App Review's "use the out-of-process picker or a share sheet rather than requesting full access" ([REVIEW-GUIDELINES.md](../app-store-connect/REVIEW-GUIDELINES.md)) and avoids Google Play's access review for `MANAGE_EXTERNAL_STORAGE` ([POLICY-AND-PREFLIGHT.md](../google-play/POLICY-AND-PREFLIGHT.md)).

## Prove it

- **Boot stages:** the bar follows the loader callbacks and disappears when the app paints; describe its 20/50/80 values as stage weights, not measured download completion. [Flutter initialization](https://docs.flutter.dev/platform-integration/web/initialization)
- **Link previews:** a link pasted into a chat or a card validator shows the title, description and an image of at least 1200×630; `og:image` and `twitter:image` are absolute URLs.
- **Tab titles:** navigating between pages changes the browser tab title each time; an unknown path shows the fallback, never a blank tab; `Title.color` is opaque.
- **Date picker:** iOS shows the wheel in a sheet, Android the Material dialog; dismissing either keeps the previous date.
- **Wakelock:** the screen stays on only on the named pages and locks normally elsewhere, including after switching away from a kept-alive tab.
- **Social links:** a social link opens the installed app, and the browser when the app is absent; nothing uses a custom scheme.
- **Share:** sharing a file triggers no permission prompt on either platform; a failed download shows an error, not a shared error page.
