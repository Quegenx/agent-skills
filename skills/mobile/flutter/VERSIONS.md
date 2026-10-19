# Versions

Each Flutter stable release bundles a Dart SDK version, with numbered hotfixes in between. After upgrading, the breaking-changes index says to consider `dart fix` to migrate code automatically. Versions and dates below come from the official release manifest (https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json, with `channel`, `release_date` and `dart_sdk_version` per release) and docs.flutter.dev. The third-party [RandalSchwartz] flutter-sdk-changelog skill adds a full history matrix, a deprecation table and upgrade runbooks; where it differs from the official sources, both are given below. Dart language changes per version are in [dart SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/SKILL.md).

**Contents:** [Find the version](#find-the-version) · [Current stable](#current-stable) · [Release history](#release-history) · [What 3.47 and 3.44 changed](#what-347-and-344-changed) · [Minimum OS and toolchain](#minimum-os-and-toolchain) · [Breaking changes by release](#breaking-changes-by-release) · [Breaking-change details](#breaking-change-details) · [material_ui and cupertino_ui](#material_ui-and-cupertino_ui) · [Deprecations and replacements](#deprecations-and-replacements) · [Material 2 to Material 3](#material-2-to-material-3) · [Upgrading an old app](#upgrading-an-old-app) · [Prove it](#prove-it)

## Find the version

- **`flutter --version`** prints the framework, engine, Dart and DevTools versions ([RandalSchwartz] sample):

  ```
  Flutter 3.47.6 • channel stable
  Framework • revision 5fc346839b
  Engine • revision 692136cb65
  Tools • Dart 3.13.5 • DevTools 2.60.0
  ```

- **pubspec bounds** ([RandalSchwartz]): `sdk: ^3.5.0 # Implicitly requires Flutter >=3.24.0` plus `flutter: ">=3.24.0" # Explicit Flutter bound`.
- **Version managers** ([RandalSchwartz]): `.fvmrc` or `.fvm/fvm_config.json` (contains `"flutter": "3.24.0"`); `.puro.json` (active environment alias).
- **Switch versions** ([ApparenceKit](https://apparencekit.dev/flutter-tips/change-flutter-version-tip/)): `git checkout <version>` in the SDK directory ("The next time you run a Flutter command, it will automatically download and set up anything needed for that version"), `git checkout stable` to go back; or FVM, installed with `dart pub global activate fvm` (or Homebrew on macOS) and switched with `fvm use <version>` ("FVM helps you manage different versions per project"). Its example version is 1.22.6, and [dart VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/VERSIONS.md) records `dart install` replacing `pub global activate` in Dart 3.10.
- **Manifests:** official release manifests per OS under https://storage.googleapis.com/flutter_infra_release/releases/ (the docs research measured `releases_macos.json`; [RandalSchwartz] names `releases_linux.json` as canonical, with all release hashes and bundled Dart versions). https://flutterreleases.com is an independent tracker.
- **Release notes:** stable releases at https://docs.flutter.dev/release/release-notes; bug-fix releases in https://github.com/flutter/flutter/blob/stable/CHANGELOG.md.

## Current stable

Measured from the official manifest on 2026-10-17:

| Release | Date | Dart |
|---|---|---|
| **3.47.7 (latest stable)** | 2026-10-08 | 3.13.5 |
| 3.47.6 | 2026-10-01 | |
| 3.47.5 | 2026-09-18 | |
| 3.47.4 | 2026-09-11 | |
| 3.47.3 | 2026-09-09 | |
| 3.47.2 | 2026-08-27 | |
| 3.47.1 | 2026-08-19 | |
| 3.47.0 | 2026-08-12 | 3.13.0 |
| 3.44.9 (last 3.44 hotfix) | 2026-08-06 | |
| 3.44.0 | 2026-05-18 | 3.12.0 |
| 3.41.0 | 2026-02-11 | 3.11.0 |

- **docs.flutter.dev "What's new"** dates: 12 August 2026 Release 3.47; 18 May 2026 Google I/O Release 3.44; 11 February 2026 Release 3.41.
- **docs llms.txt is stale:** its "Latest release" still names Flutter 3.44 and Dart 3.12.
- **Next stable:** two not-yet-stable breaking changes landed in `3.50.0-0.1.pre`, so the next stable will be 3.50 or later (an inference from those version strings). The 3.47 release post says the in-SDK Material and Cupertino libraries are scheduled for formal deprecation in the Fall stable release in November.
- **Beta** ([RandalSchwartz]): 3.49 with Dart 3.14.x, September 2026: Dart 3.14 (SIMD vector ops, `rangeEquals`), `DropdownButton.enabled` and optional `onChanged`.

## Release history

Official dates where measured; the rest from the [RandalSchwartz] matrix, which dates each line by its latest patch (for example "October 2026 (v3.47.6 stable)" for 3.47, while 3.47.0 shipped 2026-08-12 and the latest stable is 3.47.7).

| Flutter | Dart | Date | Milestones |
|---|---|---|---|
| 3.49 (beta) | 3.14.x | September 2026 | See above |
| 3.47 | 3.13.x | 2026-08-12 | Primary constructors, concise constructor bodies, standalone `material_ui` and `cupertino_ui` at 1.x, `describeEnum` removed |
| 3.44 | 3.12.x | 2026-05-18 | Standalone `material_ui` and `cupertino_ui` introduced ([RandalSchwartz]; the official posts say the in-SDK libraries froze in 3.44 and the packages reached 1.0 with 3.47), SwiftPM default on Apple platforms, headless `package:flutter/widgets.dart` core |
| 3.41 | 3.11.x | 2026-02-11 | Dart 3.11 (Windows Unix domain sockets, `JSSymbol`), performance tooling and DevTools integrations |
| 3.38 | 3.10.x | November 2025 (v3.38.10) | Dart 3.10 (`Future.syncValue`, granular `@Deprecated`), enhanced text rendering; [ApparenceKit](https://apparencekit.dev/blog/flutter-3-38-dart-3-10-major-updates/) adds hot reload on web, improved proxy configuration on web, full iOS 26 and Xcode 26 support ("For existing apps, please note that a migration might be required") and Android 16KB page size compatibility |
| 3.35 | 3.9.x | August 2025 (v3.35.7) | Dart 3.9, Impeller enhancements, multi-window desktop improvements; the Widget Previewer first shipped ([ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-widget-previewer-guide/)) |
| 3.32 | 3.8.x | May 2025 (v3.32.8) | Dart 3.8 (`Iterable.withIterator`, `HttpClientBearerCredentials`), WebAssembly runtime polish |
| 3.29 | 3.7.x | February 2025 (v3.29.3) | Dart 3.7 (wildcard `_`, bound inference), Impeller default on Android |
| 3.27 | 3.6.x | December 2024 (v3.27.4) | Dart 3.6 (digit separators), preview SwiftPM on iOS, Wasm production-ready |
| 3.24 | 3.5.0 | August 2024 | Flutter GPU preview, Impeller perf, web multi-view |
| 3.22 | 3.4.0 | May 2024 | `WidgetState` replaces `MaterialState`, `Color.withValues()`, Impeller default on Android Vulkan |
| 3.19 | 3.3.0 | February 2024 | `PopScope` API stabilization, deep-linking web validator, AnimationStyle API |
| 3.16 | 3.2.0 | November 2023 | Material 3 on by default, Impeller preview on Android, iOS extensions |
| 3.13 | 3.1.0 | August 2023 | 2D scrolling foundation (`TwoDimensionalScrollView`), Impeller iOS performance |
| 3.10 | 3.0.0 | May 2023 | 100% sound null safety enforced, Impeller default on iOS, M3 NavigationDrawer |
| 3.7 | 2.19.0 | January 2023 | M3 widgets (`MenuAnchor`, `SegmentedButton`, `Badge`), background isolates |
| 3.3 | 2.18.0 | September 2022 | `SelectionArea`, Scribble handwriting on iPad |
| 3.0 | 2.17.0 | May 2022 | Desktop stable on macOS and Linux, super-parameters and enhanced enums in framework |
| 2.10 | 2.16.0 | February 2022 | Windows desktop stable, iOS smooth keyboard animations |
| 2.8 | 2.15.0 | December 2021 | Constructor tear-offs, `.name` on enums, engine startup latency reductions |
| 2.5 | 2.14.0 | September 2021 | Material You initial support, fullscreen Android improvements |
| 2.2 | 2.13.0 | May 2021 | Null safety by default for new projects, web payment and deferred loading polish |
| 2.0 | 2.12.0 | March 2021 | Sound null safety, web stable, new Material buttons (`ElevatedButton`, `TextButton`) |
| 1.22 | 2.10.0 | October 2020 | iOS 14 / Android 11 support, new Material button themes |
| 1.20 | 2.9.0 | August 2020 | Autofill, MouseCursor API |
| 1.17 | 2.8.0 | May 2020 | Metal on iOS (Skia), `NavigationRail` |
| 1.12 | 2.7.0 | December 2019 | Android embedding v2, web beta, macOS desktop alpha |
| 1.0 | 2.1.0 | December 2018 | Initial stable Flutter release |

## What 3.47 and 3.44 changed

### 3.47 (2026-08-12)

- **Design packages:** standalone `material_ui` and `cupertino_ui` reached 1.0 on pub.dev; the core SDK still includes the libraries in this release. See [material_ui and cupertino_ui](#material_ui-and-cupertino_ui).
- **Apple:** minimum iOS 13 to **15**, macOS 10.15 to **12**. Xcode 27 / iOS 27 / macOS 27 this fall; the iOS 27 SDK mandates UIScene ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#uiscene)). Intel Macs being phased out (`flutter config --enable-macos-arm64-only`). SwiftPM: 92 of the top 100 iOS plugins migrated.
- **Web:** working toward Wasm by default: `flutter build web --release --wasm`; Wasm requires `package:web` (no `dart:html`); experimental `--enable-wasm-deferred-loading` (main channel).
- **Desktop:** Impeller default on macOS, Windows and Linux; Wide Gamut Color default on macOS; SDF text rendering on desktop; flavors on Windows and Linux.
- **Tools:** Widget Previews stable (`.widget_preview/` cache, `PreviewThemeData`); `genui` 0.10.0 with `a2ui_core`; agent-plugins (formerly "skills") docs, an experimental AI Evaluations page (/ai/evals) and an Antigravity CLI page.
- **Android:** high-contrast and color-inversion detected automatically (`MediaQueryData.highContrast`, `MediaQueryData.invertColors`).

### 3.44 (2026-05-18)

- **Android:** AGP 9 and built-in Kotlin ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#agp-9-and-built-in-kotlin)); ABI filters set once in `defaultConfig`; Hybrid Composition++ opt-in for platform views (`--enable-hcpp`); `MediaQueryData.displayCornerRadii`.
- **iOS:** SwiftPM default (`flutter build swift-package` for add-to-app); UIScene reminder; experimental inline predictive text `TextField.enableInlinePrediction`.
- **Agents:** Agentic Hot Reload and consolidated MCP tools; Agent Skills for Dart and Flutter ([AGENT-TOOLING.md](AGENT-TOOLING.md)).
- **Tooling:** DevTools uses WASM by default (2.55.0/2.57.0); Rosetta no longer needed on Apple Silicon, and a future release will end support for Intel x86 Macs.
- **Web:** honors `prefers-reduced-motion`; form validation errors announced via `aria-description`; `--base-href` for `flutter run`.
- **Widgets:** Material and Cupertino frozen. New `CupertinoMenuAnchor`; `MenuAnchor` M3 animations (`animated: true`), `SubmenuButton.hoverOpenDelay`; `CupertinoSheetRoute.scrollableBuilder`; `CarouselView` infinite scrolling and `onIndexChanged`; `ShapedInputBorder`; iOS motion accessibility features via `AccessibilityFeatures`; percentage `SemanticsValue` for progress indicators.
- **Deprecated:** `showCupertinoSheet`/`CupertinoSheetRoute` `builder`/`pageBuilder` (use `scrollableBuilder`); `ReorderableListView.onReorder` (use `onReorderItem`); the `--web-hot-reload` flag; the `plugin_ffi` template.
- **A community view on `CupertinoSheetRoute`:** FlutterPro calls it the iOS 13 sheet style, which "now looks dated" next to iOS 26's fully rounded sheets, and uses the third-party `stupid_simple_sheet` instead; the article does not mention `scrollableBuilder` ([FlutterPro](https://flutterpro.design/details/adaptive-sheet-route), [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#ios-26-adaptive-sheet)).
- **Desktop:** Canonical becomes lead maintainer of Flutter Desktop.

## Minimum OS and toolchain

| Item | Value | Source |
|---|---|---|
| iOS | 15 (Flutter 3.47+), up from 13 | 3.47 release post |
| iOS | "Flutter supports iOS 13 and later" | iOS deployment page (older; confirm in the current docs) |
| macOS | 12 (Flutter 3.47+), up from 10.15 | 3.47 release post |
| tvOS | Not supported | iOS deployment page |
| Android `flutter.minSdkVersion` | API 24 | 3.47 matrix |
| Android `flutter.compileSdkVersion`, `flutter.targetSdkVersion` | API 36 | 3.47 matrix |
| Java | 17 (minimum) | 3.47 matrix |
| Kotlin Gradle Plugin / AGP / Gradle | 2.4.0 / 9.1.0 / 9.3.1 | 3.47 matrix |
| Android KitKat | Dropped in 3.22 | Breaking changes index |
| v1 Android embedding | Apps can't build since 3.22; Java APIs removed in 3.29 | Android deployment page, breaking changes index |

## Breaking changes by release

From https://docs.flutter.dev/release/breaking-changes. When Dart errors appear after an upgrade, run `dart fix` to migrate automatically. Submit your tests to https://github.com/flutter/tests to guard against future breakage.

| Release | Breaking changes |
|---|---|
| Not yet stable | `DropdownButton` `enabled` with optional `onChanged`; migrate to standalone `material_ui` and `cupertino_ui`; stricter Android `Intent` verification; restrict Android engine flags in release mode |
| 3.47 | OpenGL ES render-to-texture content stored top-down; semantics `header`/`headingLevel` on iOS and Android; `describeEnum` removed (the index lists it under 3.47; its own page's timeline says "TBD") |
| 3.44 | RawMenuAnchor close order; `onReorder` deprecated; `TextInputConnection.setStyle` deprecated; `cacheExtent`/`cacheExtentStyle` deprecated; `IconData` marked `final`; large-screen orientation and resizability restrictions ignored on Android 17; ListTile debug error when wrapped in a colored widget; migrate Android projects to built-in Kotlin; page transition builders reorganized |
| 3.41 | Merged threads on Linux; `FontWeight` controls variable-font weight; `containsSemantics` to `isSemantics`; `findChildIndexCallback` to `findItemIndexCallback`; Material 3 tokens update |
| 3.38 | `CupertinoDynamicColor` wide gamut; `OverlayPortal.targetsRootOverlay` deprecated; `SemanticsProperties.focusable` deprecated; SnackBar with action no longer auto-dismisses; default Android page transition `PredictiveBackPageTransitionsBuilder`; UISceneDelegate adoption |
| 3.35 | Component theme normalization; `DropdownButtonFormField.value` to `initialValue`; app bar color deprecated; redesigned `Radio`; `Form` no longer a sliver; default `abiFilters`; merged threads on macOS and Windows; `Visibility` not focusable by default with `maintainState`; `$FLUTTER_ROOT/version` to `$FLUTTER_ROOT/bin/cache/flutter.version.json` |
| 3.32 | `ExpansionTileController` to `ExpansibleController`; `ThemeData.indicatorColor` to `TabBarThemeData.indicatorColor`; `.flutter-plugins-dependencies` replaces `.flutter-plugins`; localized messages generated into source; default `goldenFileComparator` for integration tests changed; `maintainHintHeight` to `maintainHintSize`; underdamped spring formula changed |
| 3.29 | v1 Android embedding Java APIs removed; `ThemeData.dialogBackgroundColor` to `DialogThemeData.backgroundColor`; updated M3 `Slider` and progress indicators |
| 3.27 | `Color` wide gamut; deep links flag default change; SystemUiMode default Edge-to-Edge |
| 3.24 | Navigator page APIs; generic `PopScope`; `ButtonBar` to `OverflowBar` |
| 3.22 | `MaterialState` to `WidgetState`; new `ColorScheme` roles; KitKat dropped |
| 3.19 | `RawKeyEvent` to `KeyEvent`/`HardwareKeyboard`; imperative apply of Flutter Gradle plugins deprecated; `AssetManifest.json` no longer generated |

## Breaking-change details

- **Built-in Kotlin (3.44), default ABI filters (3.35) and UIScene (3.38):** in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md).
- **Stricter Android Intent verification** (not yet stable; landed in `3.50.0-0.1.pre`): in release builds `FlutterActivity`/`FlutterFragmentActivity` verify the sender before honoring `route`, `dart_entrypoint`, `dart_entrypoint_args`, `cached_engine_id`, `cached_engine_group_id`. A sender is trusted if `android:exported="false"`, or on API 34+ the launching UID matches (`getLaunchedFromUid()`), or on API 33 and lower the calling package matches (`startActivityForResult()`/`startActivityIfNeeded()`). Deep links (`ACTION_VIEW`) must match a manifest `<intent-filter>`. Fallbacks: route to `io.flutter.InitialRoute` meta-data or "/", entrypoint to `io.flutter.Entrypoint` or "main". Debug and profile bypass the check but log warnings. The launcher activity must stay exported.
- **Restrict Android engine flags in release** (not yet stable): release builds ignore engine flags from Intent extras; `flutter run --release --use-application-binary` with engine flags is a fatal error. Use profile mode for dynamic flags, or declare `<meta-data android:name="io.flutter.embedding.android.DartFlags" .../>` in the manifest. `getFlutterShellArgs` is deprecated in favor of `getFlutterEngineFlags()`.
- **Semantics header (3.47):** `header` is a no-op on iOS and Android. Use `Semantics(headingLevel: 1, child: Text('Section Title'))`; a level above 0 maps to `View.setHeading(true)` / `UIAccessibilityTraitHeader`, and on web 1 to 6 map to `<h1>` to `<h6>`.
  - **Checked 2026-10-17, this line is right.** The breaking-change page (https://docs.flutter.dev/release/breaking-changes/semantics-header-heading-level, "Landed in version: 3.45.0-0.1.pre In stable release: 3.47") also says iOS 13 or later maps it to `accessibilityHeadingLevel`. The engine sets `UIAccessibilityTraitHeader` when `headingLevel > 0` (https://github.com/flutter/flutter/blob/master/engine/src/flutter/shell/platform/darwin/ios/framework/Source/SemanticsObject.mm) and calls `setHeading(node.headingLevel > 0)` on Android API 28 and up (https://github.com/flutter/flutter/blob/master/engine/src/flutter/shell/platform/android/io/flutter/view/BaseRoleConfigurator.java). The API reference lags: https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/headingLevel.html still says "This is only used for web semantics, and is ignored on other platforms", and https://api.flutter.dev/flutter/semantics/SemanticsProperties/headingLevel.html names web (`aria-level`) and Android but not iOS. renderobjects.com's semantics guide (no version stated) presents `isHeader` as the header role, which is the no-op form on iOS and Android since 3.47 ([renderobjects](https://renderobjects.com/guides/semantics/)).
- **`describeEnum` removed:** use the enum's `name`, for example `Theme.light.name`. The docs say `name` exists since Dart 2.14; [RandalSchwartz] says `Enum.name` (Dart 2.15+).
- **Android 17 large screens (3.44):** for apps targeting Android 17+, orientation, resizability and aspect-ratio restrictions don't apply on displays of 600dp or more; `SystemChrome.setPreferredOrientations` is ignored there. Android 16's `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY` opt-out is removed in 17.
- **Localizations generated into source (3.32):** no more synthetic `package:flutter_gen`. `generate: true` is required; set `synthetic-package: false` and import, for example, `'i18n/app_localizations.dart'` instead of `package:flutter_gen/gen_l10n/app_localizations.dart`. `flutter_gen` support is removed in the next stable after the change.
- **Android default page transition (3.38):** ([breaking change](https://docs.flutter.dev/release/breaking-changes/default-android-page-transition), landed in 3.37.0-0.0.pre) `PredictiveBackPageTransitionsBuilder` replaces `ZoomPageTransitionsBuilder` (falling back to `FadeForwardsPageTransitionsBuilder`); duration goes from 300 ms to 450 ms. Keep the old one with `pageTransitionsTheme: const PageTransitionsTheme(builders: {TargetPlatform.android: ZoomPageTransitionsBuilder()})`. In tests use `TransitionDurationObserver` (`observer.pumpPastTransition(tester)`, `observer.transitionDuration ~/ 2`) instead of hardcoded durations. ApparenceKit's theme map adds iOS in the same place, `TargetPlatform.iOS: const CupertinoPageTransitionsBuilder()`; it and FlutterPro both present `ZoomPageTransitionsBuilder` as the Android choice with no version, which on 3.38+ is this opt-out, not the default ([ApparenceKit](https://apparencekit.dev/flutter-tips/add-custom-page-transitions-gorouter/), [FlutterPro](https://flutterpro.design/details/web-page-transitions), [flutter-ux NAVIGATION-AND-SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NAVIGATION-AND-SHEETS.md#page-transitions)).
- **Deep links flag (3.27):** Flutter's deep linking default changed to true. With Firebase dynamic links, `uni_links`, `app_links` or `flutter_branch_sdk`, set `flutter_deeplinking_enabled` false (Android) / `FlutterDeepLinkingEnabled` `<false/>` (iOS). See [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md).

## material_ui and cupertino_ui

The Material and Cupertino libraries are moving out of the SDK into pub.dev packages.

- **Timeline (official):** contributions to the in-SDK libraries frozen since April / 3.44 (May 2026); `material_ui` and `cupertino_ui` 1.0 with 3.47 (2026-08-12); the in-SDK libraries are scheduled for formal deprecation in the Fall stable release in November. The breaking-changes index still lists the migration under "Not yet released to stable". 1.0.0 matches the frozen framework code; later versions follow semver, and the packages are planned to release weekly.
- **Timeline ([RandalSchwartz]):** introduced in Flutter 3.44 (`sdk: ">=3.44.0"`), stabilized in 3.47 as `material_ui` 1.1.0 and `cupertino_ui` 1.0.1. Its migration guide pins `^1.0.0`.
- **Already migrated:** current docs code samples import `package:material_ui/material_ui.dart`, the example pubspec lists both packages, and `go_router` 18.0.0 migrated and requires Flutter 3.44+. `flutter create` hasn't been updated to use them by default yet.
- **Automated migration:** `dart fix --apply --code=migrate_design_widgets`. [RandalSchwartz]: it adds the packages to pubspec, rewrites imports, and replaces SDK-bundled design constants. The 3.47 post notes a known early bug: if the pubspec isn't updated, run `flutter pub add material_ui` / `flutter pub add cupertino_ui`, then `dart fix --apply` again.
- **Manual migration:** `flutter pub add material_ui` and `flutter pub add cupertino_ui`; imports become `package:material_ui/material_ui.dart` and `package:cupertino_ui/cupertino_ui.dart`.
- **Dependencies still on the old imports:** put `MaterialUiCompatibilityBridge` in `MaterialApp.builder`. It injects theme and localization data downward so legacy `Theme.of(context)` and `MaterialLocalizations.of(context)` keep working, but it cannot resolve type mismatches when a dependency exposes, accepts or returns in-framework SDK types in its public API (such as `FloatingActionButtonLocation`, `ColorScheme` or `TextTheme`). Issue: https://github.com/flutter/flutter/issues/191448.
- **Localizations, two sources:** the 3.47 post says `flutter_localizations` is unbundled for design components and `localizationsDelegates: GlobalMaterialLocalizations.delegates` from `package:material_ui` now includes the Cupertino and Widgets delegates. [RandalSchwartz] still lists the `flutter_localizations` delegates `GlobalMaterialLocalizations.delegate`, `GlobalCupertinoLocalizations.delegate`, `GlobalWidgetsLocalizations.delegate`.
- **Package authors:** treat the migration as a major release.
- **Troubleshooting ([RandalSchwartz]):** ambiguous-import errors mean a file imports both the old `flutter/material.dart` and material_ui; don't. Pub version conflicts: `flutter pub upgrade --major-versions`. Its troubleshooting note names the import `package:material_ui/material.dart`, while everything else uses `package:material_ui/material_ui.dart`.
- **Headless:** a custom design system can depend only on `package:flutter/widgets.dart` ([RandalSchwartz]).

## Deprecations and replacements

From [RandalSchwartz], newest first. Confirm against the breaking-changes pages before relying on a row.

| API | Status | Replacement |
|---|---|---|
| `DropdownButton` | 3.49 beta: new `enabled` bool; `onChanged` optional when `enabled: false` | |
| `describeEnum()` | Removed in 3.47 | `Enum.name` |
| `ReorderableListView.onReorder` | Deprecated in 3.44 | [RandalSchwartz]: `onReorderWithOldAndNewIndex` (no manual `newIndex -= 1`); the 3.44 release post: `onReorderItem` |
| `TextInputConnection.setStyle` | Deprecated in 3.44 | Styling via `RenderEditable` and the platform text channel |
| `cacheExtent` / `cacheExtentStyle` | Deprecated in 3.44 | Specify the viewport constraints directly |
| `Color.withOpacity(o)` | Deprecated in 3.22 | `Color.withValues(alpha: o)` (withOpacity loses precision going to 8-bit and clips wide gamut) |
| `MaterialState` / `MaterialStateProperty` | Deprecated in 3.22 | `WidgetState` / `WidgetStateProperty` (in `package:flutter/widgets.dart`) |
| `Radio.activeColor`, `Checkbox.activeColor` | Deprecated in 3.22 | `fillColor: WidgetStateProperty.resolveWith(...)` |
| `WillPopScope` | "Deprecated in Flutter 3.12+" (the same file's heading says "3.12 / 3.19+", and the matrix puts PopScope stabilization in 3.19) | `PopScope(canPop:, onPopInvokedWithResult:)`, needed for predictive back on Android 14+ (https://docs.flutter.dev/release/breaking-changes/android-predictive-back) and iOS. [FlutterPro](https://flutterpro.design/details/android-back-button): `android:enableOnBackInvokedCallback="true"` on `<application>` fixes modals that ignore back on some devices, and "this flag breaks `WillPopScope`. Migrate to `PopScope` first" |
| `TextTheme.headline1..6`, `bodyText1/2`, `subtitle1/2`, `caption`, `button`, `overline` | Deprecated in 3.7+ | 2021 type scale (below) |
| `ThemeData.accentColor`, `primaryColorBrightness` | Deprecated in 2.5+ | `ColorScheme.secondary`, `ColorScheme.brightness` |
| `FlatButton`, `RaisedButton`, `OutlineButton` | Deprecated in 2.0 | `TextButton`, `ElevatedButton`, `OutlinedButton` |
| `Scaffold.of(context).showSnackBar` | Deprecated in 2.0 | `ScaffoldMessenger.of(context).showSnackBar` |
| `Navigator.pushNamed` | Legacy string routing | `MaterialApp.router` / `RouterConfig` / `go_router` / `kaisel` |
| `package:flutter/material.dart`, `package:flutter/cupertino.dart` | Monolithic SDK | `package:material_ui/material_ui.dart`, `package:cupertino_ui/cupertino_ui.dart` |

| Old TextTheme | New |
|---|---|
| headline1 / headline2 / headline3 | displayLarge / displayMedium / displaySmall |
| headline4 / headline5 / headline6 | headlineMedium / headlineSmall / titleLarge |
| subtitle1 / subtitle2 | titleMedium / titleSmall |
| bodyText1 / bodyText2 / caption | bodyLarge / bodyMedium / bodySmall |
| button / overline | labelLarge / labelSmall |

`PopScope` with a confirm dialog:

```dart
PopScope(
  canPop: false,
  onPopInvokedWithResult: (didPop, result) async {
    if (didPop) return;
    final navigator = Navigator.of(context);
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard changes?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Discard')),
        ],
      ),
    );
    if (shouldPop ?? false) {
      navigator.pop(result);
    }
  },
  child: const FormScreen(),
)
```

FlutterPro's version of this guard ([FlutterPro](https://flutterpro.design/details/discard-changes-prompt), code in [flutter-ux FORMS-AND-INPUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/FORMS-AND-INPUT.md#edit-forms-discard-changes)): prompt only when something changed (`canPop: !_hasChanges`, "If nothing changed, just go back, a prompt there is annoying"); check `context.mounted` after the awaited dialog before popping; a custom back button must call `Navigator.maybePop`, because a plain `pop` skips `PopScope`; and on iOS the swipe-back gesture is off while `canPop` is false. A community view on the labels: name the buttons "Keep editing" and "Discard changes" (in red), not this example's "Cancel" / "Discard" ("Don't use Yes / No / Cancel, the user can't tell what cancels what"). The route-pop versus declarative-navigation distinction and the old page-backed `PopScope` correction are in [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md#navigator-or-router).

## Material 2 to Material 3

From [RandalSchwartz]. M3 arrived incrementally across 3.0 to 3.16 and became the default in 3.16 (`useMaterial3: true`).

- **Theme:** `ThemeData(useMaterial3: true, colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6750A4), brightness: Brightness.light))`.

| M2 | M3 |
|---|---|
| `BottomNavigationBar` | `NavigationBar` |
| `ToggleButtons` | `SegmentedButton<T>` |
| `PopupMenuButton` | `MenuAnchor` / `SubmenuButton` |
| M2 `ElevatedButton` | `FilledButton` (high emphasis) |
| `Chip` | `FilterChip` / `InputChip` / `ActionChip` |
| `Drawer` | `NavigationDrawer` |
| `Card` | Elevated, Filled or Outlined variants |

- **Visual checklist:** remove unwanted tint with `surfaceTintColor: Colors.transparent` or a custom `colorScheme.surfaceContainer`; M3 defaults `AppBar.centerTitle` to `true` on iOS and `false` on Android; remove manual `elevation: 8`; use `FilledButton.tonal()` / `OutlinedButton()`.

## Upgrading an old app

[RandalSchwartz]'s five-phase rescue to Flutter 3.24+:

1. **Toolchain:** `flutter --version`; set `sdk: '^3.5.0'` and `flutter: '>=3.24.0'`; `flutter pub upgrade`. At 3.44+ SwiftPM replaces CocoaPods as the default ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#swiftpm-and-cocoapods)).
2. **Null safety:** `required`, `?`, drop `new`, `super.key`.
3. **Deprecations:** `flutter analyze`, then PopScope, `withValues`, `WidgetState`, the 2021 TextTheme, `ScaffoldMessenger`.
4. **Material 3:** `useMaterial3: true`, `fromSeed`, `NavigationBar`, `SegmentedButton`, `dart fix --apply --code=migrate_design_widgets`.
5. **Routing and state:** `kaisel` or `MaterialApp.router`; `bloc_signals` / `signals`. These third-party packages are the skill author's recommendation, not framework guidance; `go_router` lives in the official flutter/packages repo ([ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md)).

The official docs' one step for every upgrade: after upgrading Flutter, run `dart fix` to migrate code automatically.

## Prove it

- `flutter --version` reports the stable you expect, and it matches the latest `channel: stable` entry in the official release manifest.
- `dart fix --apply` reports nothing left to fix and `flutter analyze` shows no deprecation warnings after an upgrade.
- `grep -rn "package:flutter/material.dart" lib test` is empty after the material_ui migration, and no file imports both.
- `ios/Runner.xcodeproj` deployment target and `minSdk` meet the minimums in [Minimum OS and toolchain](#minimum-os-and-toolchain) for your Flutter version.
- No code calls `describeEnum`, `withOpacity`, `MaterialState` or `WillPopScope`.
