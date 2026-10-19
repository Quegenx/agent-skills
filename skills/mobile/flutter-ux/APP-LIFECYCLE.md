# App lifecycle and diagnostics

What the running app shows users across failures and versions: a friendly error view in place of the red or grey screen, breaking on handled exceptions in debug, a version line, a changelog after each update, forced update, soft update and maintenance mode, real screen names in analytics, a debug-only admin panel, lifecycle observers and first-frame work. Sources: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips and release notes (apparencekit.dev), third-party community advice, not Flutter team docs. Where a tip differs from the official-docs [flutter](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) skill, both sides are stated and tagged. Crash reporting itself is in the [sentry](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/FLUTTER.md) skill.

**Contents:** [Version notes](#version-notes) · [Replace the default error view](#replace-the-default-error-view) · [Break on handled exceptions](#break-on-handled-exceptions) · [Show the app version](#show-the-app-version) · [Changelog after update](#changelog-after-update) · [Forced update, soft update, maintenance mode](#forced-update-soft-update-maintenance-mode) · [Real screen names in analytics](#real-screen-names-in-analytics) · [Debug-only admin panel](#debug-only-admin-panel) · [App lifecycle states](#app-lifecycle-states) · [After the first frame](#after-the-first-frame) · [Prove it](#prove-it)

## Version notes

- No article states a Flutter, Dart or package version. [FlutterPro](https://flutterpro.design/details/friendly-error-view)
- `FriendlyErrorView` uses dot shorthands (`mainAxisSize: .min`, `mainAxisAlignment: .center`), which need Dart language version 3.10+ ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md)), and `Color.withValues(alpha:)`, which replaces `withOpacity` ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md)).
- The samples import `package:flutter/material.dart`; Material is moving to its own package ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#material-and-cupertino-as-packages)). Check at copy time.

## Replace the default error view

[FlutterPro](https://flutterpro.design/details/friendly-error-view): when a widget fails to build, Flutter swaps it with the red screen in debug, and an empty grey box in release. [ApparenceKit](https://apparencekit.dev/flutter-tips/create-custom-flutter-error-screen/) says the same: "Flutter shows a red screen (debug mode) or a grey screen (production mode) by default when there's a rendering error."

Install your own view with one line in `main`, before `runApp` [FlutterPro]:

```dart
ErrorWidget.builder = (details) => FriendlyErrorView(details: details);
```

**Where to set it (two phrasings, both tagged):**

- **[FlutterPro]:** "One line in `main`, before `runApp`".
- **[ApparenceKit]:** "override the default error widget using `ErrorWidget.builder` in your `MaterialApp`. This lets you show your own widget instead of the default error screen." Its example (an image, not exported) is "a basic text widget display[ing] the error summary".

**Other options [ApparenceKit]:**

- "To stop Flutter from showing the default red/grey screen, you can remove the `presentError` function call in `FlutterError.onError`."
- Instead of an error widget: "Redirect the user to a safe screen." or "Show a small message like a "toast" notification."
- Interplay not covered by the article: `SentryFlutter.init()` installs `FlutterErrorIntegration` on `FlutterError.onError` ([sentry FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/FLUTTER.md)). Check how a custom `FlutterError.onError` coexists with it before editing that handler.

**What `FriendlyErrorView` does [FlutterPro]:**

- **In release:** a friendly "Something went wrong" in your theme colors. "No technical details, users must never see exception text."
- **In debug:** the same view plus the exception and stack trace, so you still see what broke.
- **Long press** anywhere copies `'${details.exceptionAsString()}\n\n${details.stack}'` to the clipboard. "No visible button, so users never notice it's there." In a production build, long press and you have the real exception and stack trace. The badge swaps its "!" for a check for 2600 ms, with `HapticFeedback.mediumImpact()`.
- **Any size:** it adapts to the space the broken widget occupied. Full layout when `maxHeight >= 320` and `maxWidth >= 300` (both finite), else an icon-only badge (48 px instead of 104 px). It fills only bounded axes (`c.hasBoundedWidth ? c.maxWidth : null`), so under unbounded constraints (lists, `FittedBox`) it sizes to its content.
- **No ancestors assumed:** the view can land where no `Material` or `Directionality` exists, so it provides `Directionality(textDirection: TextDirection.ltr)` and `Material(type: MaterialType.transparency)`; the transparent Material also prevents the yellow "missing Material" text underlines. Padding reads `MediaQuery.maybePaddingOf(context)?.top ?? 0`, since there is no `Scaffold` or `SafeArea` above it and possibly no `MediaQuery`.
- **Centered while the content fits, scrollable once it doesn't:** `CustomScrollView` with `SliverFillRemaining(hasScrollBody: false)` around a centered `Column`, so a long debug stack trace grows past the viewport.
- **Screen readers:** `Semantics(container: true, label: 'Something went wrong. Restarting the app should fix it.', child: ExcludeSemantics(...))` ([flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#semantics-and-screen-readers) has the official Semantics rules).
- **Badge shape:** the SDK's `StarBorder(points: 12, innerRadiusRatio: 0.8, pointRounding: 0.7, valleyRounding: 0.3)`, "so this file needs no shape package".

The whole file, verbatim ("Copy it, localize and adapt to your taste") [FlutterPro]:

```dart
import 'dart:async';

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Friendly replacement for Flutter's red error screen, installed via
/// [ErrorWidget.builder]. Release builds show no technical details; debug
/// builds add the exception and stack trace. A long press anywhere copies
/// the details to the clipboard.
///
/// Adapts to the space the broken widget occupied: a full layout when there
/// is room, an icon-only badge inside small slots.
class FriendlyErrorView extends StatefulWidget {
  const FriendlyErrorView({
    super.key,
    required this.details,
  });

  final FlutterErrorDetails details;

  @override
  State<FriendlyErrorView> createState() => _FriendlyErrorViewState();
}

class _FriendlyErrorViewState extends State<FriendlyErrorView> {
  Timer? _timer;
  bool _copied = false;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _copy() async {
    HapticFeedback.mediumImpact();

    await Clipboard.setData(
      ClipboardData(
        text:
            '${widget.details.exceptionAsString()}\n\n${widget.details.stack}',
      ),
    );

    if (!mounted) return;

    setState(() => _copied = true);

    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 2600), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;

    // The view can land anywhere in the tree, including where no Material or
    // Directionality ancestor exists, so it provides its own. The transparent
    // Material also prevents the yellow "missing Material" text underlines.
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        type: MaterialType.transparency,
        child: Semantics(
          container: true,
          label: 'Something went wrong. Restarting the app should fix it.',
          child: ExcludeSemantics(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onLongPress: _copy,
              child: LayoutBuilder(
                builder: (context, c) {
                  final bool full =
                      c.maxHeight.isFinite &&
                      c.maxHeight >= 320 &&
                      c.maxWidth.isFinite &&
                      c.maxWidth >= 300;

                  // Only fill bounded axes; under unbounded constraints
                  // (lists, FittedBox) the view sizes to its content.
                  return Container(
                    width: c.hasBoundedWidth ? c.maxWidth : null,
                    height: c.hasBoundedHeight ? c.maxHeight : null,
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(full ? 0 : 28),
                    ),
                    child: full
                        ? _FullView(
                            details: widget.details,
                            copied: _copied,
                          )
                        : _CompactView(
                            details: widget.details,
                            copied: _copied,
                          ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FullView extends StatelessWidget {
  const _FullView({
    required this.details,
    required this.copied,
  });

  final FlutterErrorDetails details;
  final bool copied;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final TextTheme tt = Theme.of(context).textTheme;

    final Widget header = Column(
      mainAxisSize: .min,
      children: [
        _Badge(
          size: 104,
          copied: copied,
        ),
        const SizedBox(height: 24),
        Text(
          'Something went wrong',
          textAlign: TextAlign.center,
          style: tt.titleLarge?.copyWith(
            color: cs.onPrimaryContainer,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Restarting the app should fix it.',
          textAlign: TextAlign.center,
          style: tt.bodyMedium?.copyWith(
            color: cs.onPrimaryContainer.withValues(alpha: 0.75),
          ),
        ),
      ],
    );

    // Centered while the content fits, scrollable once it doesn't: the
    // sliver forces the child to at least viewport height, and the centered
    // column simply grows past it when the debug stack trace is long.
    return CustomScrollView(
      slivers: [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            // Clear the status bar and home indicator; the view has no
            // Scaffold or SafeArea above it (and possibly no MediaQuery).
            padding: EdgeInsets.fromLTRB(
              32,
              (MediaQuery.maybePaddingOf(context)?.top ?? 0) + 32,
              32,
              (MediaQuery.maybePaddingOf(context)?.bottom ?? 0) + 32,
            ),
            child: Column(
              mainAxisAlignment: .center,
              children: [
                header,
                if (kDebugMode) ...[
                  const SizedBox(height: 32),
                  _DebugText(
                    '${details.exceptionAsString()}\n\n${details.stack}',
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CompactView extends StatelessWidget {
  const _CompactView({
    required this.details,
    required this.copied,
  });

  final FlutterErrorDetails details;
  final bool copied;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Column(
            mainAxisSize: .min,
            children: [
              _Badge(
                size: 48,
                copied: copied,
              ),
              if (kDebugMode) ...[
                const SizedBox(height: 8),
                SizedBox(
                  width: 240,
                  child: _DebugText(
                    details.exceptionAsString(),
                    maxLines: 2,
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// The badge briefly swaps its "!" for a check after the hidden long-press
/// copy gesture, so regular users never see a hint.
class _Badge extends StatelessWidget {
  const _Badge({
    required this.size,
    required this.copied,
  });

  final double size;
  final bool copied;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;

    return Container(
      width: size,
      height: size,
      decoration: ShapeDecoration(
        color: cs.primary,
        // A soft flower built with the SDK's StarBorder, so this file needs
        // no shape package.
        shape: const StarBorder(
          points: 12,
          innerRadiusRatio: 0.8,
          pointRounding: 0.7,
          valleyRounding: 0.3,
        ),
      ),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: Icon(
          copied ? Icons.check_rounded : Icons.priority_high_rounded,
          key: ValueKey<bool>(copied),
          color: cs.onPrimary,
          size: size * 0.4,
        ),
      ),
    );
  }
}

/// Exception text shown only in debug builds.
class _DebugText extends StatelessWidget {
  const _DebugText(this.text, {this.maxLines, this.textAlign});

  final String text;
  final int? maxLines;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;

    return Text(
      text,
      maxLines: maxLines,
      textAlign: textAlign,
      overflow: maxLines == null ? TextOverflow.fade : TextOverflow.ellipsis,
      style: TextStyle(
        fontFamily: 'monospace',
        fontFamilyFallback: const ['Menlo', 'Courier'],
        fontSize: 12,
        color: cs.onPrimaryContainer.withValues(alpha: 0.6),
      ),
    );
  }
}
```

## Break on handled exceptions

[ApparenceKit](https://apparencekit.dev/flutter-tips/fail-fast-debug-fast-flutter/): when API calls "fail silently" because errors are handled, put `@pragma('vm:notify-debugger-on-exception')` above the method. It makes "your debugger stop whenever an exception occurs in a specific method, even if you've wrapped it in a `try-catch` or checked for error codes." "This only affects your debug builds. In your production app, nothing will change, and your error handling will work as usual."

Verbatim:

```dart
@pragma('vm:notify-debugger-on-exception')
void getUser() {
  final response = await http.get(Uri.parse('...'));
  if (response.statusCode == 200) {
    return ...;
  }
  throw Exception('Failed to load post2');
}
```

- **Does not compile as published:** `await` sits in a non-`async` `void` function, and `return ...;` is a placeholder. "To use `await`, code must be in an `async` function" (https://dart.dev/language/async). Corrected signature: `Future<void> getUser() async {`.
- **Official wording** (https://github.com/dart-lang/sdk/blob/main/runtime/docs/pragmas.md, "Pragmas for general use"): it "Marks a function that catches exceptions, making the VM treat any caught exception as if they were uncaught."

## Show the app version

[FlutterPro](https://flutterpro.design/details/show-app-version): show the version somewhere users can reach it, usually at the bottom of the settings or account page. QA always knows which version they are debugging, you can ask a user which one they are on, and with [Shorebird](https://shorebird.dev/) the patch number tells you whether your patch actually landed.

- Show the **build number**, not just the version ([flutter BUILD-AND-RELEASE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/BUILD-AND-RELEASE.md) has build name and build number).
- No patch number means the user is on the store build.
- Keep it dim: "This line should whisper to users."
- It reads `PackageInfo.fromPlatform()` (`package_info_plus`) and `ShorebirdUpdater().readCurrentPatch()` in parallel with a record `.wait` ([dart ASYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/ASYNC.md)), and sets tabular figures for the digits. The article names `ShorebirdUpdater` and `Patch` but not their package.

Verbatim (put `VersionIndicator()` wherever you want it):

```dart
class VersionIndicator extends StatefulWidget {
  const VersionIndicator({super.key});

  @override
  State<VersionIndicator> createState() => _VersionIndicatorState();
}

class _VersionIndicatorState extends State<VersionIndicator> {
  String? _label;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final (PackageInfo info, Patch? patch) = await (
      PackageInfo.fromPlatform(),
      ShorebirdUpdater().readCurrentPatch(),
    ).wait;

    if (!mounted) return;

    final String base = '${info.appName} ${info.version} (${info.buildNumber})';

    setState(() {
      _label = patch != null ? '$base · patch ${patch.number}' : base;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_label == null) {
      return const SizedBox.shrink();
    }

    return Text(
      _label!,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        fontFeatures: const [FontFeature.tabularFigures()],
        color: Colors.grey.shade500,
      ),
    );
  }
}
```

## Changelog after update

[FlutterPro](https://flutterpro.design/details/in-app-changelog): show a changelog after every update. "Without one, shipped features and fixed bugs stay in the shadow. And when changes came from user feedback, users get to see they were heard." This is the in-app sheet, not the store's What's New field ([app-store-connect](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md), [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md)).

[ApparenceKit](https://apparencekit.dev/blog/apparencekit-flutter-template-v5-release/) ships the same pattern as an "update log bottom sheet" to "show once to users what's new in the latest version of your app".

**The changelog [FlutterPro]:** a versioned map in Dart, keyed by version, then by a `Language` enum ("use an enum for keys to avoid typos"). Support all languages used in the app. Fetch it remotely to fix copy without shipping a new build.

```dart
const Map<String, Map<Language, List<String>>> _changelog = {
  '1.3.0': {
    Language.en: [
      'export transactions to csv.',
    ],
  },
  '1.2.0': {
    Language.en: [
      'reorder categories with drag.',
      'unlimited accounts.',
    ],
  },
};
```

**Unseen changes:** return everything between the last seen and the current version ("If they jump from `1.2.0` to `1.5.0`, show everything in between, not just the latest"), compared with [pub_semver](https://pub.dev/packages/pub_semver):

```dart
List<String> unseenChanges({
  required String lastSeen,
  required String current,
  required Language language,
}) {
  final Version lastSeenVersion = Version.parse(lastSeen);
  final Version currentVersion = Version.parse(current);

  final List<String> result = [];

  for (final entry in _changelog.entries) {
    final Version entryVersion = Version.parse(entry.key);

    if (entryVersion > lastSeenVersion && entryVersion <= currentVersion) {
      final changes = entry.value[language];
      if (changes != null) result.addAll(changes);
    }
  }

  return result;
}
```

**Track what the user has seen:** `package_info_plus` reads the current version, `shared_preferences` persists the last seen one under `last_seen_version`. Keep `_currentVersion` as a field so `dismiss()` can read it later. Any state management works; the example uses `Cubit`.

```dart
class ChangelogCubit extends Cubit<List<String>?> {
  String? _currentVersion;

  ChangelogCubit() : super(null);

  Future<void> initialize({required Language language}) async {
    final String current = (await PackageInfo.fromPlatform()).version;
    _currentVersion = current;

    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? lastSeen = prefs.getString('last_seen_version');

    // First install, nothing to show, save and move on
    if (lastSeen == null) {
      await prefs.setString('last_seen_version', current);
      return;
    }

    // Already up to date
    if (lastSeen == current) return;

    final List<String> changes = unseenChanges(
      lastSeen: lastSeen,
      current: current,
      language: language,
    );

    if (changes.isEmpty) {
      await prefs.setString('last_seen_version', current);
      return;
    }

    emit(changes);
  }
}
```

(The source's first-install comment uses a dash; it is rewritten with a comma here.)

- **Don't show on first install.** There's nothing to catch up on. Save the current version and skip. If there are no unseen entries, save and skip too.
- **Mark it seen** with `dismiss()`, run the moment the changelog appears or wired to a button:

```dart
Future<void> dismiss() async {
  final String? version = _currentVersion;
  if (version != null) {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_seen_version', version);
  }

  emit(null);
}
```

- Initialize it on app open, and when the state list is not null, show the changelog in a modal or popup ([NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md)).

**Layering (two views, both tagged):**

- **[Flutter docs, via flutter skill]:** wrap third-party plugins such as `SharedPreferences` in a service, and give view models their repositories through constructors ([flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md), [flutter DATA-AND-NETWORKING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/DATA-AND-NETWORKING.md#key-value-data), [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) rule 1).
- **[FlutterPro]:** the Cubit calls `SharedPreferences.getInstance()` directly. Keep the logic, move the storage behind a service if the app follows the official layering.

## Forced update, soft update, maintenance mode

[FlutterPro](https://flutterpro.design/details/forced-update):

- **Forced update** when the old version must not be used anymore, like when it has a critical bug. Use it rarely.
- **Soft update** for regular releases: an indicator on the home screen saying a new version exists. "Not a dialog, users get tired of closing those. If you use a dialog anyway, show it once."
- **Maintenance mode** freezes the app and shows a message, for example while your backend is down. Keep the message on the server so you can say what's happening and when the app will be back. It is also how you shut an app down for good.
- **One server config** holds the minimum versions, the maintenance flag and message, and the store URLs. Don't hardcode the store URLs: they can change, for example when the app moves to another developer account.
- **Per platform:** set versions, even the maintenance flag, separately for Android and iOS. A bug can be Android-only, and store reviews finish at different times.
- **Check on startup, in the background.** The check can take seconds on a slow network; no app open should be delayed for it.
- **When the result says forced update or maintenance,** open that screen with a fade, not a regular transition, and disable the back gesture. Users shouldn't be able to close those pages. The article does not say how to disable back. The official routing rule: "You cannot block navigation from page-backed screens with `PopScope`" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#navigator-or-router)), so do not assume `PopScope` on a go_router page does it.
- **Package:** [versionarte](https://pub.dev/packages/versionarte) handles all of it. It is the article author's own package.

Related: Google Play's native In-App Updates (Immediate mode is "best for cases where an update is critical") in [google-play REVIEWS-AND-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/REVIEWS-AND-REPORTS.md#in-app-updates), a PostHog flag with a version payload as another config source ([posthog IDENTITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/IDENTITY.md)), and remote config that pushes a maintenance screen without a release ([flutter BUILD-AND-RELEASE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/BUILD-AND-RELEASE.md#flavors)).

## Real screen names in analytics

[FlutterPro](https://flutterpro.design/details/analytics-screen-names): analytics tools often show a Flutter app as one screen, with every page counted as `FlutterViewController`. That is the native view Flutter draws the whole app into; analytics SDKs track native views, and the app has only this one. Turn the native reporting off (the article gives Firebase's switches, out of scope here), then report screens from Flutter, where every screen is a route.

- **Add your SDK's navigator observer.** It reports the route's `settings.name` on every push and pop. "No name, no event. So the job is to name every route." PostHog's observer is in [posthog SETUP-FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SETUP-FLUTTER.md), Sentry's in [sentry FLUTTER-FEATURES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/FLUTTER-FEATURES.md).
- **Named routes** already have one: `pushNamed('/cart')` reports as `/cart`. This is a fact about naming only. [Flutter docs, via flutter skill]: "Do not use named routes for most apps" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#navigator-or-router)).
- **go_router** fills the name from the route's `name` or path. Pass the observer to `GoRouter(observers: [...])` instead of `MaterialApp`.
- **Custom `pageBuilder`:** you build the page yourself, so set its `name` too:

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

- **Shell branches:** a `ShellRoute` or `StatefulShellRoute` branch runs its own inner navigator, so it needs its own `observers` list ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#shell-routes-and-tabs)).
- **Plain `Navigator.push`** has no name, so pass it:

```dart
Navigator.of(context).push(
  MaterialPageRoute(
    settings: RouteSettings(
      name: 'product_details',
    ),
    builder: (_) {
      return ProductDetailsPage();
    },
  ),
);
```

- **A small extension** can derive the name from the widget, turning `ProductDetailsPage` into `product_details`, called as `Navigator.of(context).push(ProductDetailsPage().asPageRoute())`. The article does not give the extension's body.
- **Dialogs and bottom sheets** are mostly not worth tracking as screens. If one is, log a screen view event manually when it opens. You can also pass `routeSettings` to `showDialog` and `showModalBottomSheet`, but check your SDK first: some observers skip non-page routes by default.

## Debug-only admin panel

[ApparenceKit](https://apparencekit.dev/blog/apparencekit-flutter-template-v5-release/): a "settings admin panel" with "test mode for in app purchases, reset onboarding...only in debug mode". The release note gives no code or gating mechanism.

## App lifecycle states

- Use the lifecycle to pause a video or stop a live process when the user leaves: add `WidgetsBindingObserver` to the widget's `State` and implement `didChangeAppLifecycleState`, which runs on every app state change. [ApparenceKit](https://apparencekit.dev/flutter-tips/observe-application-lifecycle-flutter/) (No code in the article.)
- **Correction:** the article lists "4 main states" (`resumed`, `inactive`, `paused`, `detached`). The current `AppLifecycleState` enum has five: `detached`, `resumed`, `inactive`, `hidden`, `paused`. The article (no version stated) misses `hidden`. [AppLifecycleState](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html)
  - `resumed`: "the default running mode for a running application that has input focus and is visible".
  - `inactive`: "At least one view of the application is visible, but none have input focus." On iOS: phone call, TouchID request, app switcher, control center. "On Android and iOS, apps in this state should assume that they may be hidden and paused at any time."
  - `hidden`: "All views of an application are hidden". On iOS and Android it is synthesized before `paused` (from `inactive`) and before `inactive` (from `paused`), so one handler covers "hidden" on every platform.
  - `paused`: "not currently visible to the user, and not responding to user input"; only entered on iOS and Android.
  - `detached`: "still hosted by a Flutter engine but is detached from any host views"; also the state before the app initializes.
- Besides the `WidgetsBindingObserver` mixin, "changes to the state can be observed by creating an `AppLifecycleListener`"; the current state is `SchedulerBinding.instance.lifecycleState`. "Applications should not rely on always receiving all possible notifications": a killed app gets none. [AppLifecycleState](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html)

## After the first frame

[ApparenceKit](https://apparencekit.dev/flutter-tips/wait-for-view-ready-flutter-app/)

- To run code once the view is built and visible (show a popup or welcome message, start the camera or a map, run animations, measure widget sizes that depend on the final layout), call `WidgetsBinding.instance.addPostFrameCallback` from `initState`. It "schedules a callback to run after the current frame has been rendered."

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    // Do your stuff here, after the view is ready
  });
}
```

- Prefer it to `Future.delayed(Duration(seconds: 1))`, which "is unreliable". "Don't Abuse It": for user input or data loading, other lifecycle methods or async patterns usually fit better.

## Prove it

- **Error view:** throw inside one widget's `build` in a release build; the user sees the friendly view in theme colors with no exception text, and a long press puts the exception and stack trace on the clipboard. In a debug build the trace shows too. A failing widget inside a list or a small slot shows the badge, not a stretched full view; no yellow text underlines appear.
- **Break on handled:** with the pragma on a method that catches its own error, the debugger stops at the throw in a debug session; the release build behaves as before.
- **Version line:** settings shows name, version and build number, plus the patch number on a Shorebird patch; it is dim and uses tabular figures.
- **Changelog:** a fresh install shows nothing; an update from `1.2.0` to `1.5.0` shows every entry in between, once; after dismissal it does not return.
- **Update gates:** app open is not delayed on a throttled network; flipping the server's minimum version or maintenance flag for one platform affects only that platform; the forced screen fades in and cannot be left with back.
- **Screen names:** the analytics debug view shows one event per page with a readable name, including pages inside shell branches and pages pushed with `Navigator.push`; no page reports as `FlutterViewController`.
- **Admin panel:** a release build contains no route to it.
- Every `addObserver(this)` has a matching `removeObserver(this)` in `dispose`; a lifecycle switch names all five values, `hidden` included. [AppLifecycleState](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html)
- Work that needs the rendered first frame uses the post-frame callback rather than an arbitrary `Future.delayed`. [ApparenceKit](https://apparencekit.dev/flutter-tips/wait-for-view-ready-flutter-app/)
