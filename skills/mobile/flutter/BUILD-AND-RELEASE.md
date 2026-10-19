# Build and release

A Flutter release is two native builds driven by one pubspec: `flutter build appbundle` hands Gradle an Android App Bundle signed with your upload key, and `flutter build ipa` hands Xcode an archive signed through your Apple team. The pubspec `version: 1.0.0+1` feeds both stores' version numbers, flavors become Android product flavors and Xcode schemes, and `--dart-define` bakes compile-time values into the Dart code. Store-side steps (App Store Connect, TestFlight, Play Console tracks and review) are in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md) and [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

**Contents:** [Flavors](#flavors) · [Compile-time config](#compile-time-config) · [Version numbers](#version-numbers) · [Android release](#android-release) · [Signing](#signing) · [App bundles and APKs](#app-bundles-and-apks) · [iOS release](#ios-release) · [Obfuscation](#obfuscation) · [SwiftPM and CocoaPods](#swiftpm-and-cocoapods) · [AGP 9 and built-in Kotlin](#agp-9-and-built-in-kotlin) · [UIScene](#uiscene) · [Continuous delivery](#continuous-delivery) · [Secrets](#secrets) · [Prove it](#prove-it)

## Flavors

A flavor can decide which icon, app name, API key, feature flag and logging level go with a version of the app. Flavors on Windows and Linux arrived in 3.47 (`flutter build windows --flavor flavor_a`).

- **Remote config** changes "the behavior of your app without releasing a new version": ApparenceKit uses it to test paywall titles, texts and trigger delay, to "push a maintenance screen to all your users without releasing a new version", and to "enable a feature only when you finished it in production" ([ApparenceKit](https://apparencekit.dev/blog/flutter-template-advantages/); forced and soft updates and maintenance mode in [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#forced-update-soft-update-maintenance-mode)).

- **Build or run one:** `flutter (run | build <subcommand>) --flavor <flavor_name>`, for example `flutter build apk --flavor staging` (subcommand `apk` or `appbundle` on Android).
- **Read it in Dart:** `import 'package:flutter/services.dart';` and the `appFlavor` constant. It matches the `--flavor` name (the Gradle product flavor on Android, the Xcode scheme name on iOS). With no flavor, `appFlavor` is `null`.

```dart
void main() {
  // appFlavor will match the flavor name from build.gradle.kts
  if (appFlavor == 'production') {
    // Logic for production environment
    Config.apiUrl = 'https://api.flavors_example.com';
  } else if (appFlavor == 'staging') {
    // Logic for staging environment
    Config.apiUrl = 'https://staging.api.flavors_example.com';
  }

  runApp(const MyApp());
}
```

- **Separate entry points are another pattern:** the Compass sample app uses `main_development.dart`, `main_staging.dart` and `main.dart`, with abstract repositories that have Local and Remote implementations per environment.
- **Run one entry point with `-t`** [ApparenceKit](https://apparencekit.dev/flutter-tips/firestore-config-from-native-apps/): a `runners` folder holds `main_dev.dart`, `main_staging.dart` and `main_prod.dart`, each with a `main` that calls a shared helper with that environment's config; run it with `flutter run -t lib/runners/main_dev.dart`. (The article says the folder sits "at the root of your project" but its command points into `lib/runners/`.)

### Android flavors

A Flutter flavor is an Android *product flavor*; product flavors times build types give build variants (`stagingDebug`, `stagingRelease`, `productionDebug`, `productionRelease`). In `android/app/build.gradle.kts`, inside `android {}`:

```kotlin
android {
    ...
    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    ...
    flavorDimensions += "default"
    productFlavors {
        create("staging") {
            dimension = "default"
            applicationIdSuffix = ".staging"
        }
        create("production") {
            dimension = "default"
            applicationIdSuffix = ".production"
        }
    }
}
```

- **App name per flavor:** `android/app/src/staging/res/values/strings.xml` with `<string name="app_name">Flavors staging</string>` (same for production), and `android:label="@string/app_name"` in `android/app/src/main/AndroidManifest.xml`.
- **Don't set `app_name` with `resValue()`:** with AGP 9.0 or later the build fails by default with `Product Flavor <flavor_name> contains custom resource values, but the feature is disabled.` Remove `resValue()` and use `strings.xml`.
- **Icon per flavor:** PNGs under `android/app/src/<flavor>/res/`, all named `ic_launcher.png`: mipmap-mdpi 48x48, mipmap-hdpi 72x72, mipmap-xhdpi 96x96, mipmap-xxhdpi 144x144, mipmap-xxxhdpi 192x192; `android:icon="@mipmap/ic_launcher"`.
- **`abiFilters` belong in `defaultConfig`:** setting them in product flavors is not recommended. If you do, pass `-Pdisable-abi-filtering=true` to `flutter build` and `flutter run`.

### iOS and macOS flavors

Xcode has no flavors: set up a scheme and attach custom build configurations to it.

1. `open ios/Runner.xcworkspace`; Product > Scheme > New Scheme (target Runner), named for example `staging`. Schemes **must be shared** for Flutter flavors to work (Manage Schemes > Shared).
2. Duplicate the Debug, Release and Profile configurations as `Debug-staging`, `Release-staging`, `Profile-staging` (same for `production`). Always use lowercase for the appended flavor name so the Flutter CLI recognizes it. Base them on `Debug.xcconfig` / `Release.xcconfig` (not `Pods-Runner.xcconfig`); Profile and Release both use `Release.xcconfig`.
3. Assign per scheme: Run `Debug-staging`, Test `Debug-staging`, Profile `Profile-staging`, Analyze `Debug-staging`, Archive `Release-staging`.
4. Launch with `flutter run --flavor staging`.

- **Display name:** a user-defined build setting `APP_DISPLAY_NAME` per configuration, and Info.plist `CFBundleDisplayName` = `$(APP_DISPLAY_NAME)`.
- **Icons:** asset catalog entries `AppIcon-staging` / `AppIcon-production`, assigned per configuration under General > App Icons and Launch Screen.
- **Bundle IDs:** Build Settings > Packaging > Product Bundle Identifier per configuration (for example `com.example.flavorsExample.staging` vs `com.example.flavorsExample`). Register each in the Apple Developer account.
- **Other per-configuration settings** go in `.xcconfig` files, for example `API_BASE_URL = staging.flavors.com/api`.
- **SwiftPM manual integration** needs its pre-action added for each flavor (see [SwiftPM and CocoaPods](#swiftpm-and-cocoapods)).
- **Projects with a Podfile** must map the configurations in `ios/Podfile`:

```ruby
project 'Runner', {
  ...
  'Debug' => :debug,
  'Debug-staging' => :debug,
  'Debug-production' => :debug,
  'Profile' => :release,
  'Profile-staging' => :release,
  'Profile-production' => :release,
  'Release' => :release,
  'Release-staging' => :release,
  'Release-production' => :release,
  ...
```

### Flavors in pubspec

- **Flavor-specific assets** are bundled only for the listed flavors:

```yaml
flutter:
  assets:
    - path: assets/flavor_a_and_b/images
      flavors:
        - flavor_a
        - flavor_b
    - path: assets/flavor_c/images
      flavors:
        - flavor_c
```

- **Platform-specific assets** use `platforms:` (for example `web`, `windows`, `linux`, `macos`); build-time `transformers:` take a package and args.
- **Default flavor:** `flutter: default-flavor: production` makes plain `flutter run` run production; `flutter run --flavor staging` for the others.
- **Deferred components** (Android only, smaller initial download): `deferred-components` with `name`, `libraries`, `assets`; see https://docs.flutter.dev/perf/deferred-components.

## Compile-time config

- **Pass values with `--dart-define`:** `flutter run --dart-define=DEBUG=true` (the Dart CLI uses `-D` / `--define`). Uses include debug logs, separate flavors, an HTTP port, an experimental mode, and switching between testing and production backends. The error-reporting cookbook passes a Sentry DSN this way: `--dart-define SENTRY_DSN=https://example@sentry.io/example`.
- **Read them as `const`:** `bool.fromEnvironment`, `int.fromEnvironment`, `String.fromEnvironment` are only guaranteed to work when invoked as `const`. Optional `defaultValue`; check presence with `const bool.hasEnvironment('DEBUG')`. Production compilers can remove code made unreachable by a false constant. Dot-shorthand form: `const bool productionBuild = .fromEnvironment('PRODUCTION');`.

```dart
void log(String message) {
  // Log the debug message if the environment declaration 'DEBUG' is `true`.
  // If there was no value specified, do not log.
  if (const bool.fromEnvironment('DEBUG', defaultValue: false)) {
    print('Debug: $message');
  }
}
```

- **Avoid comma-separated values:** Dart tools and compilers currently don't handle them consistently (SDK issue 44995).
- **`--dart-define-from-file`** exists in the Flutter tool but has no dedicated docs.flutter.dev page; only release notes mention it: 3.7.0 passes its values to Gradle, 3.16.0 makes `--dart-define` override redundant values from the file, and 3.19.0 stops including its entries in the Gradle config or environment during build.
- **VS Code:** `"toolArgs": ["--define=DEBUG=true"]` in `launch.json`.
- **Not for secrets:** storing secrets in an app is a poor security practice. See [Secrets](#secrets).

## Version numbers

| pubspec `version: 1.0.0+1` | Override | Android | iOS |
|---|---|---|---|
| `1.0.0` (build name) | `--build-name` | `versionName` | `CFBundleShortVersionString` |
| `1` (build number) | `--build-number` | `versionCode` | `CFBundleVersion` |

- **Each iOS upload requires a unique build number.** Example: `flutter build ipa --build-name ... --build-number ...`.
- **Android:** rebuilding updates `versionName`/`versionCode` in `local.properties`. Split-per-ABI APKs add `ABI_VERSION * 1000` to the version code; force the plain code with `-P force-version-code-ignoring-abi=true`.
- **Xcode Cloud:** set **Next Build Number** if the existing app's build number is higher than 1.
- **Show both in the app,** usually at the bottom of the settings page, so QA and support know which build someone runs ([FlutterPro](https://flutterpro.design/details/show-app-version); `package_info_plus` code in [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#show-the-app-version)).
- **A minimum-version gate** [ApparenceKit](https://apparencekit.dev/flutter-tips/compare-app-versions/): `PackageInfo.fromPlatform()` (`package_info_plus`) returns the installed build name, and `Version.parse()` (package `version`) makes it comparable with `<`, `>` and `==`, ordering numeric parts correctly ("2.0 is older than 2.1, and 2.1 is older than 2.10"), which plain string comparison does not. `UpdateRequired` is the app's own exception; the article states no package versions.

```dart
// get the current version installed using this
import 'package:package_info_plus/package_info_plus.dart';
// the Version package to compare versions
import 'package:version/version.dart';

Future<void> checkAppVersion(Version minVersion) async {
  final info = await PackageInfo.fromPlatform();
  final currentVersion = Version.parse(info.version);

  if (currentVersion < minVersion) {
    throw UpdateRequired(); // Or handle the old version as needed
  }
}
```

  Google Play's own in-app updates are in [google-play REVIEWS-AND-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/REVIEWS-AND-REPORTS.md).

## Android release

- **Launcher icon:** the `flutter_launcher_icons` package, or icons placed in `[project]/android/app/src/main/res/` `mipmap-` folders with `<application android:icon="@mipmap/ic_launcher" ...`.
- **Manifest:** set `android:label`; add `<uses-permission android:name="android.permission.INTERNET"/>` if the app needs internet. The standard template doesn't include this tag but allows internet access during development.
- **Gradle defaults:** `compileSdk = flutter.compileSdkVersion`, `ndkVersion = flutter.ndkVersion`, `minSdk = flutter.minSdkVersion`, `targetSdk = flutter.targetSdkVersion`, `versionCode = flutter.versionCode`, `versionName = flutter.versionName`. Change them only to raise `minSdk` (for example `minSdk = 24`) or to pin integers. Current default values are in [VERSIONS.md](VERSIONS.md#minimum-os-and-toolchain).
- **The Application ID is permanent** once you upload to the Play Store. Changing `applicationId`/`namespace` before then means moving `MainActivity.kt` and updating its `package` line.
- **R8, conflicting statements on one page:** it says R8 is enabled by default for release APKs and AABs and that `--no-shrink` disables it, and it also says the `--[no-]shrink` flag has no effect because code shrinking is always enabled in release builds. Confirm in the current docs. Obfuscation and minification can considerably extend compile time.
- **Multidex:** the 64k method limit applies when min API is 20 or lower; the tool prompts and adds `androidx.multidex:multidex` and `FlutterMultiDexApplication`. Multidex is native when targeting Android SDK 21 or later. A manual keep file must include `io/flutter/embedding/engine/loader/FlutterLoader.class` and `io/flutter/util/PathUtils.class`.
- **Is it a Flutter APK?** `apkanalyzer files list` and look for `/lib/<ARCH>/libflutter.so`; `flutterEmbedding` meta-data is 1 or 2. Flutter 3.22 removed the ability of v1 embedder apps to build.

## Signing

- **Two keys:** you upload an `.aab` or `.apk` signed with an *upload key*; users download APKs signed with the *app signing key*, created through Play App Signing.
- **Create the upload keystore** (macOS/Linux). `-storetype JKS` is only required for Java 9 or newer (the page says the keystore type defaults to PKS12). Find `keytool` with `flutter doctor -v` under "Java binary at:".

```console
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA \
        -storetype JKS -keysize 2048 -validity 10000 -alias upload
```

- **`[project]/android/key.properties`** (Windows paths need `\\`). Keep it and the keystore private; never check them into public source control.

```properties
storePassword=<password-from-previous-step>
keyPassword=<password-from-previous-step>
keyAlias=upload
storeFile=<keystore-file-location>
```

- **`android/app/build.gradle.kts`** (you might need to run `flutter clean` after changing it):

```kotlin
import java.util.Properties
import java.io.FileInputStream

plugins {
   ...
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ...
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties.getProperty("keyAlias")
            keyPassword = keystoreProperties.getProperty("keyPassword")
            storeFile = keystoreProperties.getProperty("storeFile")?.let { file(it) }
            storePassword = keystoreProperties.getProperty("storePassword")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

- **Android 17 APK Signature Scheme v3.2:** post-quantum hybrid signing (classical plus ML-DSA). Play App Signing users wait for Play's upgrade option. Self-managed keys rotate with `apksigner` to a hybrid identity and must create a new classical key; the older one can't be reused.

## App bundles and APKs

- **Prefer the app bundle:** `flutter build appbundle` writes `[project]/build/app/outputs/bundle/release/app.aab`, containing armeabi-v7a, arm64-v8a and x86-64. Test it with `bundletool` or Play internal, alpha or beta tracks.
- **APKs:** `flutter build apk --split-per-abi` gives `app-armeabi-v7a-release.apk`, `app-arm64-v8a-release.apk`, `app-x86_64-release.apk`. Split APKs are strongly recommended over a fat APK. Install with `flutter install`.
- **Default `abiFilters` (since 3.35):** the Flutter Gradle Plugin sets `armeabi-v7a`, `arm64-v8a`, `x86_64` for non-debuggable builds, so Play doesn't offer the app to x86 devices where it crashes. To change: `flutter build apk --splits-per-abi` (the abiFilters page spells it `--splits-per-abi`, the Android deployment page `--split-per-abi`; confirm in the current docs); `defaultConfig { ndk { abiFilters.clear(); abiFilters.addAll(listOf("arm64-v8a")) } }`; or `-Pdisable-abi-filtering=true`. Since 3.44 ABI filters are set once in `defaultConfig`, and custom `abiFilters` in build types or flavors need `-Pdisable-abi-filtering=true`.

## iOS release

- **Prerequisites:** Xcode on macOS, the App Review Guidelines, and the Apple Developer Program. Flutter does not currently support tvOS.
- **Register a Bundle ID** (App IDs page, **Explicit App ID**) and create the App Store Connect record (Apps > + > New App, iOS checked).
- **In Xcode** (`open ios/Runner.xcworkspace`, Runner target): General > Identity sets Display Name and Bundle Identifier; Signing & Capabilities "Automatically manage signing" (default on, sufficient for most apps) and Team; Build Settings > Deployment "iOS Deployment Target".
- **Minimum iOS, two sources:** the iOS deployment page says Flutter supports iOS 13 and later; the newer 3.47 release post raises the minimum to iOS 15 (macOS 10.15 to 12) for Flutter 3.47+. Confirm in the current docs; see [VERSIONS.md](VERSIONS.md#minimum-os-and-toolchain).
- **Icons and launch image** in `Runner/Assets.xcassets` (light, dark and tinted icons per the HIG). Verify the launch image with hot restart, not hot reload.
- **Build:** `flutter build ipa` writes an `.xcarchive` to `build/ios/archive/` and an `.ipa` to `build/ios/ipa`. Consider `--obfuscate` and `--split-debug-info`. Other exports: `--export-method ad-hoc|development|enterprise`. Reuse options with `flutter build ipa --export-options-plist=path/to/ExportOptions.plist`.
- **Upload:** drag `build/ios/ipa/*.ipa` into Apple Transporter; or `xcrun altool --upload-app --type ios -f build/ios/ipa/*.ipa --apiKey your_api_key --apiIssuer your_issuer_id`; or Xcode Validate App, then Distribute App. An email arrives within 30 minutes when the build is validated and on TestFlight.
- **TestFlight and the store:** TestFlight tab > Internal Testing > select build > add testers. For the store: Pricing and Availability, status "1.0 Prepare for Submission", Submit for Review, then release per the **Version Release** setting. Details in [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

### Codemagic CLI tools

1. `pip3 install codemagic-cli-tools`; an App Store Connect API key with App Manager access in `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_PRIVATE_KEY`.
2. `keychain initialize` (and you **must** run `keychain use-login` afterwards).
3. `app-store-connect fetch-signing-files $(xcode-project detect-bundle-id) --platform IOS --type IOS_APP_STORE --certificate-key=@file:/path/to/cert_key --create`
4. `keychain add-certificates`, then `xcode-project use-profiles`.
5. `flutter build ipa --release --export-options-plist=$HOME/export_options.plist`
6. `app-store-connect publish --path $(find $(pwd) -name "*.ipa")`

## Obfuscation

- **Release builds only.** Obfuscation only renames symbols: it does not encrypt resources or protect against reverse engineering. Web is not supported (release web builds are minified).
- **Targets:** `aar`, `apk`, `appbundle`, `ios`, `ios-framework`, `ipa`, `linux`, `macos`, `macos-framework`, `windows`.
- **Build:** `flutter build <build-target> --obfuscate --split-debug-info=/<symbols-directory>` (for example `out/android`). **Back up the symbols files**; Windows x64 also produces `app.windows-x64.pdb`.
- **Read an obfuscated stack trace:** `flutter symbolize -i <stack-trace-file> -d <obfuscated-symbols-file>` (for example `out/android/app.android-arm64.symbols`). Not for PDB files; use WinDbg.
- **Obfuscation map:** add `--extra-gen-snapshot-options=--save-obfuscation-map=/<obfuscation-map-file>`; it writes JSON pairs like `["MaterialApp", "ex", "Scaffold", "ey"]`.
- **What breaks:** code that matches class, function or library names, for example `expect(foo.runtimeType.toString(), equals('Foo'));`. Enum names are not obfuscated currently.

## SwiftPM and CocoaPods

- **SwiftPM is the default since 3.44** for iOS and macOS native dependencies; upgrading and running the app adds the integration automatically. Flutter falls back to CocoaPods for dependencies that don't support SwiftPM yet. CocoaPods stays in maintenance mode, and the CocoaPods registry becomes permanently read-only on December 2, 2026. In earlier versions SwiftPM isn't on by default.
- **Plugins:** at 3.47, 92 of the top 100 iOS plugins had migrated. Unmigrated plugins get lower pub.dev scores and will eventually stop working.
- **Verify in Xcode:** the **Run Prepare Flutter Framework Script** pre-action runs and `FlutterGeneratedPluginSwiftPackage` is a target dependency. Re-enable with `flutter config --enable-swift-package-manager`.
- **Remove CocoaPods** only when every plugin supports SwiftPM: `cd ios && pod deintegrate`; delete `ios/Podfile`, `ios/Podfile.lock`, `ios/Pods/`, `ios/.symlinks/`; remove the `#include` lines referencing `Pods/Target Support Files` from `ios/Flutter/Debug.xcconfig` and `Release.xcconfig`; then `flutter clean && flutter pub get && flutter run`. Manual Podfile edits must be removed by hand. The third-party [RandalSchwartz] rescue guide gives `cd ios && pod deintegrate && rm -rf Podfile Podfile.lock Pods .symlinks`, then `flutter build ios --config-only`.
- **Manual integration:** add the local package `ios/Flutter/ephemeral/Packages/FlutterGeneratedPluginSwiftPackage` to Runner, and a scheme Build pre-action "Run Prepare Flutter Framework Script" running `"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" prepare` (Provide build settings from Runner). This must be done for each flavor.
- **A plugin needs a higher OS** (`The package product 'plugin_name_ios' requires minimum platform version 14.0 ...`): raise **Minimum Deployments**, then `flutter build ios --config-only`.
- **Add-to-app:** `flutter build swift-package` (the [RandalSchwartz] guide adds `--platform ios`). Plugins from the 2024 pilot must add `FlutterFramework` to `Package.swift`.
- **Turning it off:** in general, don't; disabling SwiftPM won't be allowed in the future. Per project `flutter: config: enable-swift-package-manager: false`; globally `flutter config --no-enable-swift-package-manager`.

### Xcode shows "No such module 'Flutter'"

A fix from [ApparenceKit](https://apparencekit.dev/blog/fix-xcode-no-such-module-flutter/) for the red error on `import Flutter` in `AppDelegate.swift`, which can appear "even if the project might still technically compile". The article expects `Pods_Runner.framework` in the target's frameworks and notes that "Pod install will be deprecated in the future"; it doesn't say whether a SwiftPM project (the default since 3.44) needs the fix, so check the SwiftPM integration above first.

1. Open `ios/Runner.xcworkspace`, select the top-level Runner project, then the Runner target (the one with the Flutter logo), General tab, "Frameworks, Libraries, and Embedded Content" (you will likely see `Pods_Runner.framework`).
2. In Finder, open the Flutter SDK (find it with `which flutter`), then `bin -> cache -> artifacts -> engine -> ios`, which holds `Flutter.xcframework`.
3. Drag `Flutter.xcframework` into "Frameworks, Libraries, and Embedded Content" and set its Embed column to **Do not Embed**, so it is "linked correctly without embedding it multiple times".
4. Product > Clean Build Folder (Shift+Command+K), then Product > Build (Command+B).

- The same fix works for the error while writing native plugins.
- Also check: `flutter doctor -v` for which SDK is used when several are installed, `flutter upgrade`, `pod install` in `ios/` when using CocoaPods, and an Xcode version compatible with the Flutter SDK.

## AGP 9 and built-in Kotlin

- **What broke (3.44):** AGP 9 makes built-in Kotlin the default, and apps applying `kotlin-android` (the Kotlin Gradle Plugin, KGP) fail without migration.
- **Temporary escape:** Flutter 3.44 adds `android.builtInKotlin=false` and `android.newDsl=false`, which the migrator adds to `gradle.properties`. Setting `android.builtInKotlin=true` requires Flutter 3.47+. Add-to-app hosts must add both properties manually.
- **Migrate the app:** remove `id("kotlin-android")` and the `kotlinOptions { jvmTarget = JavaVersion.VERSION_17.toString() }` block, and add:

```kotlin
kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}
```

- **If the app doesn't apply KGP now, don't migrate to built-in Kotlin.**
- **Plugins:** report unmigrated plugins to their authors (the docs provide a template). Plugin authors must set a minimum of Flutter 3.44. KGP support will be removed (issue #184837).
- **Verified matrix for 3.47:** Java 17 (minimum), Kotlin Gradle Plugin 2.4.0, AGP 9.1.0, Gradle 9.3.1.

## UIScene

- **The deadline:** starting with Xcode 27 (iOS 27 SDK), Apple mandates the `UIScene` lifecycle for UIKit apps. Flutter apps built with Xcode 27 that don't adopt it fail to launch on startup.
- **Automatic migration:** Flutter 3.41+ migrates an unmodified `AppDelegate`; the CLI prints `Finished migration to UIScene lifecycle`. Manual work is needed with custom AppDelegate code or plugins on the legacy lifecycle.
- **Manual migration:**
  1. Conform `AppDelegate` to `FlutterImplicitEngineDelegate`; move `GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)` and method channels into `didInitializeImplicitFlutterEngine` (code in [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md#ios-host)).
  2. Don't access `window?.rootViewController` in `didFinishLaunchingWithOptions`.
  3. Move UI lifecycle logic (for example `applicationDidBecomeActive`) to a `SceneDelegate` subclassing `FlutterSceneDelegate`.
  4. Info.plist `UIApplicationSceneManifest`: `UISceneDelegateClassName` = `FlutterSceneDelegate`, `UISceneConfigurationName` = `flutter`, `UISceneStoryboardFile` = `Main`, `UIApplicationSupportsMultipleScenes` false.
- **Hide the CLI warning:** `flutter: config: enable-uiscene-migration: false`. Disable temporarily by prefixing "Application Scene Manifest" with `_`.
- **Intel Macs** are being phased out: the CLI warns on Intel hosts and dual-arch targets (future errors); `flutter config --enable-macos-arm64-only`.

## Continuous delivery

- **Options:** all-in-one Codemagic, Bitrise, Appcircle; or fastlane with GitHub Actions, Cirrus, Travis, GitLab, CircleCI.
- **fastlane locally:** `gem install fastlane` or `brew install fastlane`; set `FLUTTER_ROOT`; check that `flutter build appbundle` and `flutter build ipa` work; `fastlane init` in `android/` and `ios/`; check `package_name` (`android/fastlane/Appfile`) and `app_identifier`, `apple_id`, `itc_team_id`, `team_id` (`ios/fastlane/Appfile`); `fastlane supply init` (treat the `.json` key file like a password); `FASTLANE_PASSWORD`; use a distribution certificate on iOS.
- **Lanes:** Android `upload_to_play_store` with `aab` = `../build/app/outputs/bundle/release/app-release.aab`. iOS:

```ruby
build_app(
  skip_build_archive: true,
  archive_path: "../build/ios/archive/Runner.xcarchive",
)
upload_to_testflight
```

- **In the cloud:** keep credentials in the CI's encrypted environment variables and pass them to the app with `--dart-define MY_VAR=MY_VALUE`. Take care not to echo those values back onto the console. Android: `json_key_data: ENV['<variable name>']` instead of `json_key_file`; store the upload key as a base64 variable and decode it with `echo "$PLAY_STORE_UPLOAD_KEY" | base64 --decode > [path to your upload keystore]`. iOS: fastlane **Match** is recommended for certificates.
- **Pin fastlane** with a `Gemfile` (`source "https://rubygems.org"`, `gem "fastlane"`) and run `bundle exec fastlane`. CI script: `flutter build appbundle` or `flutter build ios --release --no-codesign --config-only`, then `bundle exec fastlane [lane]`.
- **Build with a specific Flutter version:** switching the SDK with git or FVM is in [VERSIONS.md](VERSIONS.md#find-the-version).
- **Xcode Cloud** (Xcode 13.4.1+): `ios/ci_scripts/ci_post_clone.sh` clones Flutter `stable` with `--depth 1`, runs `flutter precache --ios` and `flutter pub get`, sets `HOMEBREW_NO_AUTO_UPDATE=1`, `brew install cocoapods`, `cd ios && pod install`. Make it executable with `git add --chmod=+x ios/ci_scripts/ci_post_clone.sh`.

### iOS lanes with an App Store Connect API key

Build the Flutter IPA here, then use the source-qualified [App Store Connect fastlane lanes](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/FASTLANE.md#ios-lanes-with-an-app-store-connect-api-key) for API-key authentication, metadata, delivery, review submission and release.

## Secrets

- **Storing secrets in an app is a poor security practice.** Obfuscation only renames symbols; it doesn't protect against reverse engineering.
- **Keep the SDK and dependencies current:** security updates are published for the version on the `stable` branch. Avoid pinning dependencies to specific versions; if you do, check them periodically. Private forks of Flutter fall behind.
- **Report vulnerabilities** to https://g.co/vulnz.

## Prove it

- `flutter build appbundle --flavor production` and `flutter build ipa --flavor production` both succeed, and `appFlavor` prints `production` at startup.
- `git ls-files | grep -E 'key.properties|\.jks$'` prints nothing.
- The pubspec build number differs from every build already uploaded (each iOS upload requires a unique build number).
- `android/app/build.gradle.kts` has no `id("kotlin-android")` (or `gradle.properties` carries the temporary `android.builtInKotlin=false`), and no `resValue()` for `app_name`.
- `ios/Runner/Info.plist` contains `UIApplicationSceneManifest` with `FlutterSceneDelegate`, or the CLI printed `Finished migration to UIScene lifecycle`.
- In Xcode, `FlutterGeneratedPluginSwiftPackage` is a target dependency of Runner.
- With the fastlane API-key lanes, `git ls-files | grep -E '\.p8$'` prints nothing, every lane starts with `load_api_key`, and `fastlane/metadata/en-US/release_notes.txt` exists as the fallback.
- An install older than the minimum version hits the update gate; one at or above it doesn't (check `2.10` against a `2.9` minimum).
- Obfuscated builds keep their `--split-debug-info` symbols directory, and `flutter symbolize` turns a crash trace back into readable frames.
