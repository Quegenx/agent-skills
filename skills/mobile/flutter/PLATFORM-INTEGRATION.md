# Platform integration

Dart code reaches native platform code in two ways: the Flutter platform channel APIs, where messages and responses pass asynchronously over a named channel and both sides must agree on strings for method names and data types, or the Pigeon package, which generates type-safe code for both sides from one Dart interface so nothing is matched by hand. The last section lists the native files a Flutter app itself edits. Signing, flavors and release builds are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md).

**Contents:** [Pick the mechanism](#pick-the-mechanism) · [Platform channels](#platform-channels) · [Codec types](#codec-types) · [Dart client](#dart-client) · [Android host](#android-host) · [iOS host](#ios-host) · [Threading](#threading) · [Pigeon](#pigeon) · [Native files a Flutter app needs](#native-files-a-flutter-app-needs) · [Prove it](#prove-it)

## Pick the mechanism

| Mechanism | Type safe | Notes |
|---|---|---|
| `MethodChannel` | No | Method calls with a result; client `MethodChannel`, host `MethodChannel` (Android) or `FlutterMethodChannel` (iOS) |
| `BasicMessageChannel` | No | Plain messages with a codec |
| Pigeon over platform channels | Yes | Generated code on both sides; works on Windows and Linux too |
| Pigeon Native Interop (FFI/JNI) | Yes | *Experimental*, Android, iOS and macOS only: low serialization overhead, very low latency, synchronous host calls, isolate support for Host APIs, but complex setup |

- **Prefer channels over Native Interop** for Windows and Linux, simple low-frequency data, or a simpler setup.
- **Platform languages:** Android Kotlin or Java, iOS Swift or Objective-C, Windows C++, macOS Objective-C, Linux C. Web generally uses JS interop instead. Platform-specific Dart code can inspect `defaultTargetPlatform`.
- **Reusable platform code belongs in a plugin package:** https://docs.flutter.dev/packages-and-plugins/developing-packages.
- **Full examples:** https://github.com/flutter/flutter/tree/main/examples/platform_channel and https://github.com/flutter/flutter/tree/main/examples/platform_channel_swift.

## Platform channels

- **Templates:** `flutter create` uses Kotlin and Swift by default; Java and Objective-C with `flutter create -i objc -a java batterylevel`.
- **Name channels uniquely:** channel names must be unique in an app. Prefix with a unique domain prefix, for example `samples.flutter.dev/battery`.
- **Both directions work:** the platform can also call Dart (see the `quick_actions` plugin).
- **Codecs:** `StandardMessageCodec` (used by channels and Pigeon), `BinaryCodec`, `StringCodec` (UTF-8), `JSONMessageCodec`, `FirestoreMessageCodec`.
- **Wrap every call in try/catch:** the call can fail, and the failure arrives as a `PlatformException`.

## Codec types

`StandardMessageCodec` serializes booleans, numbers, Strings, byte buffers, Lists and Maps.

| Dart | Kotlin | Swift |
|---|---|---|
| `null` | `null` | `nil` (`NSNull` when nested) |
| `bool` | `Boolean` | `NSNumber(value: Bool)` |
| `int` (<=32 bits) | `Int` | `NSNumber(value: Int32)` |
| `int` (>32 bits) | `Long` | `NSNumber(value: Int)` |
| `double` | `Double` | `NSNumber(value: Double)` |
| `String` | `String` | `String` |
| `Uint8List` | `ByteArray` | `FlutterStandardTypedData(bytes: Data)` |
| `Int32List` | `IntArray` | `FlutterStandardTypedData` (int32) |
| `Int64List` | `LongArray` | `FlutterStandardTypedData` (int64) |
| `Float32List` | `FloatArray` | `FlutterStandardTypedData` (float32) |
| `Float64List` | `DoubleArray` | `FlutterStandardTypedData` (float64) |
| `List` | `List` | `Array` |
| `Map` | `HashMap` | `Dictionary` |

## Dart client

```dart
class _MyHomePageState extends State<MyHomePage> {
  static const platform = MethodChannel('samples.flutter.dev/battery');
  // Get battery level.
  String _batteryLevel = 'Unknown battery level.';

  Future<void> _getBatteryLevel() async {
    String batteryLevel;
    try {
      final result = await platform.invokeMethod<int>('getBatteryLevel');
      batteryLevel = 'Battery level at $result % .';
    } on PlatformException catch (e) {
      batteryLevel = "Failed to get battery level: '${e.message}'.";
    }

    setState(() {
      _batteryLevel = batteryLevel;
    });
  }
```

## Android host

In the app's `MainActivity.kt`, inside `configureFlutterEngine()`:

```kotlin
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler {
  // This method is invoked on the main thread.
  call, result ->
  if (call.method == "getBatteryLevel") {
    val batteryLevel = getBatteryLevel()

    if (batteryLevel != -1) {
      result.success(batteryLevel)
    } else {
      result.error("UNAVAILABLE", "Battery level not available.", null)
    }
  } else {
    result.notImplemented()
  }
}
```

## iOS host

- **Create channels in `didInitializeImplicitFlutterEngine`:** if the app adopts the `UISceneDelegate` lifecycle, `window` is `nil` during `application(_:didFinishLaunchingWithOptions:)`. To avoid a crash, conform to `FlutterImplicitEngineDelegate` and create the `FlutterMethodChannel` there. The platform-channels page calls this lifecycle the default in Flutter 3.41+; the UIScene breaking-change page says it landed in 3.38 with auto-migration as of 3.41. Migration steps are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#uiscene).

`AppDelegate.swift`:

```swift
@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
   
  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    let batteryChannel = FlutterMethodChannel(
      name: "samples.flutter.dev/battery",
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )

    batteryChannel.setMethodCallHandler({
      [weak self] (call: FlutterMethodCall, result: FlutterResult) -> Void in
      // This method is invoked on the UI thread.
      guard call.method == "getBatteryLevel" else {
        result(FlutterMethodNotImplemented)
        return
      }
      self?.receiveBatteryLevel(result: result)
    })
  }
}
```

- **Errors:** return `result(FlutterError(code: "UNAVAILABLE", message: "Battery level not available.", details: nil))`.

## Threading

- **Invoke channel methods on the platform's main thread.** Platform-to-Flutter calls must run there.
- **Flutter to platform** calls come from the root isolate or a registered background isolate: `BackgroundIsolateBinaryMessenger.ensureInitialized(rootIsolateToken)`.
- **Run host handlers on a background thread** with the Task Queue API: Android `binaryMessenger.makeBackgroundTaskQueue()` passed to `MethodChannel(..., StandardMethodCodec.INSTANCE, taskQueue)`; iOS `registrar.messenger().makeBackgroundTaskQueue?()`.
- **Jump back to the UI thread:** Android `Handler(Looper.getMainLooper()).post { ... }`; iOS `DispatchQueue.main.async { ... }`. On Android annotate UI-thread methods with `@UiThread`.

## Pigeon

Pigeon eliminates matching strings between host and client for message names and data types. It supports nested classes, grouping messages into APIs, generated asynchronous wrapper code, and messages in either direction.

```dart
import 'package:pigeon/pigeon.dart';

class SearchRequest {
  final String query;

  SearchRequest({required this.query});
}

class SearchReply {
  final String result;

  SearchReply({required this.result});
}

@HostApi()
abstract class Api {
  @async
  SearchReply search(SearchRequest request);
}
```

- **Version in the repo:** `version: 29.0.10`, `sdk: ^3.11.0` (https://github.com/flutter/packages/blob/main/packages/pigeon/pubspec.yaml).
- **Generators:** Kotlin and Java (Android), Swift and Objective-C (iOS, macOS), C++ (Windows), GObject (Linux).
- **Types:** custom classes, nested types and enums. Basic inheritance with empty `sealed` parents only in the Swift, Kotlin and Dart generators. Swift classes are structs by default; use `@SwiftClass` for recursive data or Objective-C interop.
- **The interface file holds only declarations.** APIs are `abstract class` with `@HostApi()` (implemented on the host) or `@FlutterApi()` (implemented in Dart). Event channels (`@EventChannelApi`) work only for Swift, Kotlin and Dart. Rename with `@ObjCSelector` and `@SwiftFunction`.
- **Async:** `@async` (default; Kotlin `suspend`, Swift `async`) and `@asyncCallback` (completion callbacks). Only Kotlin and Swift distinguish them.
- **Errors:** Host API exceptions become a Flutter `PlatformException`. Use `FlutterError` (Kotlin) or `PigeonError` (Swift) for custom details.
- **Threading:** `@TaskQueue` selects the thread for a HostApi (platform channels only; an error with Native Interop). Multiple instances via a message channel suffix.

### Using it

1. Add `pigeon` as a `dev_dependency`.
2. Put the interface `.dart` file outside `lib`.
3. Run `flutter pub get`, then `dart run pigeon` with arguments.
4. Add the generated Dart to `./lib`.
5. Implement the host side: Android generated code goes into `./android/app/src/main/java`; iOS generated code into the Xcode project (for example `ios/Runner.xcworkspace`).

### Stability rules

- **Breaking changes in generated code are common.** Using Pigeon-generated code in public APIs is strongly discouraged.
- **Generate both sides with the same version of Pigeon.**
- **Don't split generated code across packages.**
- **File bugs** with the title prefix `[pigeon]`.

## Native files a Flutter app needs

| File | What a Flutter app sets there | Details |
|---|---|---|
| `android/app/src/main/AndroidManifest.xml` | `android:label`; `android:icon="@mipmap/ic_launcher"`; `<uses-permission android:name="android.permission.INTERNET"/>` if the app needs internet (the standard template doesn't include it but allows internet during development); `flutter_deeplinking_enabled` meta-data; `io.flutter.embedding.android.EnableHcpp` and `io.flutter.embedding.android.DartFlags` meta-data | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md), [VERSIONS.md](VERSIONS.md) |
| `android/app/build.gradle.kts` | `compileSdk`, `minSdk`, `targetSdk`, `versionCode`, `versionName` from `flutter.*`; `signingConfigs`; `productFlavors`; `abiFilters` in `defaultConfig`; `kotlin { compilerOptions { ... } }` | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) |
| `android/key.properties` | Upload keystore passwords, alias and path. Never commit it | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#signing) |
| `android/gradle.properties` | `android.builtInKotlin`, `android.newDsl` (added by the 3.44 migrator) | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#agp-9-and-built-in-kotlin) |
| `android/app/src/<flavor>/res/` | Per-flavor `values/strings.xml` (`app_name`) and `mipmap-*/ic_launcher.png` | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#flavors) |
| `android/app/src/main/.../MainActivity.kt` | `configureFlutterEngine()` channel handlers; its `package` line moves with `applicationId`/`namespace` | Above |
| `android/app/src/main/res/values/styles.xml`, `values-night/styles.xml` | With platform views using Material Components: `implementation("com.google.android.material:material:<version>")` and `NormalTheme` parent `Theme.MaterialComponents.Light.NoActionBar` (light) or `Theme.MaterialComponents.DayNight.NoActionBar` (night) | |
| `ios/Runner.xcworkspace` | `open ios/Runner.xcworkspace`, then set Display Name, Bundle Identifier, signing Team, iOS Deployment Target, schemes per flavor | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#ios-release) |
| `ios/Runner/AppDelegate.swift` | `FlutterImplicitEngineDelegate`, plugin registration and channels in `didInitializeImplicitFlutterEngine` | Above |
| `ios/Runner/Info.plist` | `CFBundleDisplayName` = `$(APP_DISPLAY_NAME)` for flavors; `UIApplicationSceneManifest`; `FlutterDeepLinkingEnabled` | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#uiscene) |
| `ios/Runner/Assets.xcassets` | App icons (light, dark, tinted), per-flavor `AppIcon-<flavor>`, launch image | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#ios-release) |
| `ios/Podfile`, `ios/Flutter/Debug.xcconfig`, `Release.xcconfig` | Flavor configuration mapping while CocoaPods is used; `#include` lines to remove when dropping CocoaPods | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#swiftpm-and-cocoapods) |
| `pubspec.yaml` `flutter: config:` | `enable-swift-package-manager`, `enable-uiscene-migration`; mirrors `flutter config --list` keys, read only from the application package | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) |

- **Hybrid Composition++ for platform views** (Android, opt-in since 3.44): `--enable-hcpp` or manifest `<meta-data android:name="io.flutter.embedding.android.EnableHcpp" android:value="true" />`. It has API and hardware requirements.
- **Deep links:** intent filters, `Runner.entitlements`, `assetlinks.json` and `apple-app-site-association` are in [ROUTING-AND-DEEP-LINKS.md](ROUTING-AND-DEEP-LINKS.md). Since 3.27 Flutter's deep linking default is true. With Firebase dynamic links, `uni_links`, `app_links` or `flutter_branch_sdk`, set `flutter_deeplinking_enabled` to false (Android) and `FlutterDeepLinkingEnabled` to `<false/>` (iOS).

## Prove it

- Every channel name has a domain prefix, and the Dart side and each host use the identical channel and method strings.
- Every `invokeMethod` call is inside `try` with an `on PlatformException` handler, and every host handler returns `notImplemented()` / `FlutterMethodNotImplemented` for unknown methods.
- On iOS, `grep -n FlutterMethodChannel ios/Runner/AppDelegate.swift` shows channels created only inside `didInitializeImplicitFlutterEngine`.
- Pigeon: the interface file is outside `lib`, generated Dart is in `lib`, and both sides were generated by the same Pigeon version.
- A release Android build that talks to the network has `android.permission.INTERNET` in `AndroidManifest.xml`.
