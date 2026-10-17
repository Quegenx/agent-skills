# Platform integration

Dart code reaches native platform code in two ways: the Flutter platform channel APIs, where messages and responses pass asynchronously over a named channel and both sides must agree on strings for method names and data types, or the Pigeon package, which generates type-safe code for both sides from one Dart interface so nothing is matched by hand. The last section lists the native files a Flutter app itself edits. Signing, flavors and release builds are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md).

**Contents:** [Pick the mechanism](#pick-the-mechanism) · [Platform channels](#platform-channels) · [Codec types](#codec-types) · [Dart client](#dart-client) · [Android host](#android-host) · [iOS host](#ios-host) · [Threading](#threading) · [Pigeon](#pigeon) · [Writing a plugin](#writing-a-plugin) · [Testing a plugin](#testing-a-plugin) · [Native files a Flutter app needs](#native-files-a-flutter-app-needs) · [Prove it](#prove-it)

## Pick the mechanism

| Mechanism | Type safe | Notes |
|---|---|---|
| `MethodChannel` | No | Method calls with a result; client `MethodChannel`, host `MethodChannel` (Android) or `FlutterMethodChannel` (iOS) |
| `BasicMessageChannel` | No | Plain messages with a codec |
| Pigeon over platform channels | Yes | Generated code on both sides; works on Windows and Linux too |
| Pigeon Native Interop (FFI/JNI) | Yes | *Experimental*, Android, iOS and macOS only: low serialization overhead, very low latency, synchronous host calls, isolate support for Host APIs, but complex setup |

- **Prefer channels over Native Interop** for Windows and Linux, simple low-frequency data, or a simpler setup.
- **Platform languages:** Android Kotlin or Java, iOS Swift or Objective-C, Windows C++, macOS Objective-C, Linux C. Web generally uses JS interop instead. Platform-specific Dart code can inspect `defaultTargetPlatform`.
- **On the web, don't import `dart:io`** ("It won't work there"); `defaultTargetPlatform` and `kIsWeb` come from `package:flutter/foundation.dart` ([ApparenceKit](https://apparencekit.dev/flutter-tips/detect-flutter-running-platform/)). Branching layout on the platform is still out ([LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md)).
- **Sensors and on-device models come as plugins** (named in a community post on context-aware UI, [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#context-aware-layouts-optional); checked on pub.dev): `sensors_plus` (accelerometer, gyroscope, magnetometer, barometer; Android, iOS, web), `light` (ambient light; pub.dev lists Android and iOS, where the post says Android only, and iOS needs Apple-approved SensorKit entitlements), `battery_plus` (power state), and `tflite_flutter` (TensorFlow Lite models, which its page says can run "in different isolates to prevent jank in UI thread"). The post reaches Core ML on iOS "through a platform channel when you need it".
- **Reusable platform code belongs in a plugin package:** https://docs.flutter.dev/packages-and-plugins/developing-packages. Writing one is in [Writing a plugin](#writing-a-plugin).
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

## Writing a plugin

A walkthrough of a battery-level plugin for iOS (Swift) and Android (Kotlin), from [ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/) unless tagged. The article states no Flutter version, and its iOS steps use CocoaPods; SwiftPM is the default since 3.44 ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#swiftpm-and-cocoapods)).

### Package or plugin

"**All plugins are packages, but not all packages are plugins.**" A package is pure Dart; a plugin also ships native code that talks to the platform APIs and forwards results back to Dart.

|  | Package | Plugin |
| --- | --- | --- |
| Contains Dart code | Yes | Yes |
| Contains native code | No | Yes |
| Calls platform APIs | No | Yes |
| `flutter.plugin` in pubspec | No | Yes |
| Works on every Flutter target | Automatically | Only platforms you implement |

- **Languages** are chosen per side independently (Swift on iOS, Java on Android is fine). The article's table gives C++ for Linux; the platform-channels page says Linux C (https://docs.flutter.dev/platform-integration/platform-channels, and [Pick the mechanism](#pick-the-mechanism)). Follow the docs.
- **Which kind:**
  - Pure Dart logic (parsing, state, algorithms): a package.
  - A platform API (camera, sensors, push notifications, system services): a `MethodChannel` plugin.
  - Binding an existing C, C++ or Rust library, or CPU-bound work that should run synchronously without message-passing overhead: an FFI plugin ([FFI plugins](#ffi-plugins)).
  - Many platforms with very different native code: a federated plugin ([Federated plugins](#federated-plugins)).
  - They combine: `camerawesome` uses `MethodChannel` for control and FFI for image processing, federated across iOS and Android. "MethodChannel for platform features, FFI for native compute."

### Create from the template

```shell
flutter create --template=plugin --platforms=android,ios mybatteryplugin
```

- **Swift and Kotlin by default;** `-i objc` for Objective-C and `-a java` for Java.
- **What it generates:** `android/`, `ios/` (native code), `lib/` (Dart), `test/`, `example/` (a sample app for testing the plugin and debugging the native code from Xcode or Android Studio), `CHANGELOG.md`, `LICENSE`, `pubspec.yaml` (the plugin's info and native classes) and `README.md` (the pub.dev front page). The template's `getPlatformVersion()` example is replaced below.

### The Dart side

Three files: the platform interface (`lib/mybatteryplugin_platform_interface.dart`), the app-facing class (`lib/mybatteryplugin.dart`) and the method-channel implementation (`lib/mybatteryplugin_method_channel.dart`). Document public methods with `///`.

```dart
abstract class MybatterypluginPlatform extends PlatformInterface {
  
  // [...]

  Future<num?> getBatteryLevel() {
    throw UnimplementedError('getBatteryLevel() has not been implemented.');
  }
}
```

```dart
class Mybatteryplugin {
  // [...]

  /// récupération du niveau de la batterie
  Future<num?> getBatteryLevel() {
    return MybatterypluginPlatform.instance.getBatteryLevel();
  }
}
```

```dart
class MethodChannelMybatteryplugin extends MybatterypluginPlatform {
  
  // [...]

  @override
  Future<num?> getBatteryLevel() {
    return methodChannel.invokeMethod<num?>('getBatteryLevel');
  }
}
```

- **The template's channel is named bare** (`"mybatteryplugin"`, see the Kotlin below). The docs' rule above still applies: "Prefix with a unique domain prefix" ([Platform channels](#platform-channels)).
- **The `invokeMethod` call has no try/catch** in the article; wrap it per [Platform channels](#platform-channels).

### The iOS side

`cd example/ios/`, `pod install --repo-update`, then open `Runner.xcworkspace` (not the `.xcodeproj`). The plugin's Swift file sits under Pods > Development Pods > `mybatteryplugin` (the article's file is `SwiftMybatterypluginPlugin.swift`). Battery monitoring must be enabled before reading the level:

```swift
// [...]

public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
  switch (call.method) {
    case "getBatteryLevel":
      // il est nécessaire d'activer le suivi de la batterie avant
      UIDevice.current.isBatteryMonitoringEnabled = true
      
      // we return the battery level in percent
      result(UIDevice.current.batteryLevel * 100)
    default:
      result(FlutterError(code: "HANDLE_ERROR", message: "method not implemented", details: nil))
      break
    }
}
```

The `default` branch should answer `FlutterMethodNotImplemented`, as in the docs' [iOS host](#ios-host): `result(FlutterMethodNotImplemented)`.

### The Android side

Open `example/android/` in Android Studio to run and debug the native code. The plugin class holds the channel and a `BatteryManager`, created from the plugin binding:

```kotlin
class MybatterypluginPlugin: FlutterPlugin, MethodCallHandler {
  private lateinit var channel : MethodChannel
  private lateinit var batteryManager: BatteryManager // add this line

  // [...]
}
```

```kotlin
// [...]

override fun onAttachedToEngine(@NonNull flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
    channel = MethodChannel(flutterPluginBinding.binaryMessenger, "mybatteryplugin")
    channel.setMethodCallHandler(this)
    
    // Initialisation du battery manager
    batteryManager = flutterPluginBinding.applicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
  }

// [...]
```

```kotlin
// [...]

override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
    when (call.method) {
      "getBatteryLevel" -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          result.success(batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY));
        } else {
          result.error("WRONG_VERSION", "android version not supported", "");
        }
      }
      else -> {
        result.notImplemented()
      }
    }
  }

// [...]
```

The app-side host in `MainActivity.kt` is in [Android host](#android-host); a plugin gets its messenger and context from `FlutterPluginBinding` instead.

### More platforms

`flutter.plugin.platforms` in `pubspec.yaml` names the class Flutter instantiates per platform. Declare only the platforms you support; shipping with just `android` and `ios` is fine, and more can come later in a minor version bump.

```yaml
flutter:
  plugin:
    platforms:
      android:
        package: io.apparence.mybatteryplugin
        pluginClass: MybatterypluginPlugin
      ios:
        pluginClass: MybatterypluginPlugin
      macos:
        pluginClass: MybatterypluginPlugin
      web:
        pluginClass: MybatterypluginWeb
        fileName: mybatteryplugin_web.dart
      windows:
        pluginClass: MybatterypluginPluginCApi
      linux:
        pluginClass: MybatterypluginPlugin
```

- **macOS** reuses most of the iOS code. **Web** is Dart calling JavaScript through `dart:js_interop` ("the modern replacement for `dart:html` / `package:js`"). **Windows and Linux** use CMake; "the platform-channel API is the same shape".

### Federated plugins

- **The split:** `myplugin` (the app-facing API), `myplugin_platform_interface` (the abstract contract), and one package per platform (`myplugin_android`, `myplugin_ios`, `myplugin_web`, ...).
- **Why:** the community can add a `myplugin_linux` without touching the main repo, and you bump only the platforms that changed. `video_player`, `path_provider` and `shared_preferences` in `flutter/packages` use it; read their `pubspec.yaml` for a real template.
- **Start single-package** and migrate if you outgrow it; "the migration is mechanical". Docs: https://docs.flutter.dev/packages-and-plugins/developing-packages#federated-plugins.

### FFI plugins

- **Why:** every `MethodChannel` call is serialized, sent across an asynchronous boundary and deserialized; for "a tight loop processing audio, video, or large buffers, that overhead adds up fast". FFI calls C, C++ or Rust functions directly in the same isolate and returns synchronously, where `MethodChannel` always returns a `Future`.
- **When:** wrapping an existing native library (image codecs, ML inference, crypto, audio DSP), CPU-bound hot paths, synchronous native calls. **Not when** you need platform APIs: "FFI can't reach into Swift/Kotlin runtime, only into C-ABI libraries"; for one-off async calls `MethodChannel` is "dramatically easier to debug".
- **The template, two sources.** The article scaffolds with `flutter create --template=plugin_ffi --platforms=android,ios myffiplugin` (a `src/myffiplugin.c` plus bindings that `ffigen` generates from the `.h` named in `ffigen.yaml`). Flutter 3.44 deprecated the `plugin_ffi` template ([VERSIONS.md](VERSIONS.md#344-2026-05-18)); the current route is build hooks with `ffigen`, in [../dart/FFI.md](../dart/FFI.md). Both use `ffigen`, so "you never write the binding glue by hand".

## Testing a plugin

The docs' page is https://docs.flutter.dev/testing/testing-plugins; the four layers below are from [ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/). "A real plugin needs four layers."

1. **Unit tests** (`test/mybatteryplugin_test.dart`): override `MybatterypluginPlatform.instance` with a mock and check the Dart-side logic. Fast, runs on every push.

```dart
class MockMybatterypluginPlatform
    with MockPlatformInterfaceMixin
    implements MybatterypluginPlatform {

  // [...]
  
  // Here, we're overriding the getBatteryLevel() method to return a fixed value of 21, 
  // which will be tested in the following test.
  @override
  Future<num?> getBatteryLevel() => Future.value(21);
}

void main() {

  // [...]

  // We're creating a new test to verify if the previously overridden value is returned correctly.
  test('getBatteryLevel', () async {
    Mybatteryplugin mybatterypluginPlugin = Mybatteryplugin();
    MockMybatterypluginPlatform fakePlatform = MockMybatterypluginPlatform();
    MybatterypluginPlatform.instance = fakePlatform;

    expect(await mybatterypluginPlugin.getBatteryLevel(), 21);
  });
}
```

2. **Method-channel tests** (`test/mybatteryplugin_method_channel_test.dart`): a mock channel handler checks that Dart sends the right method names and arguments. The article's version:

```dart
void main() {
  // [...]

  setUp(() {
    // We will add a new mock related to the Method Channel object
    // This will return the value of 21.
    channel.setMockMethodCallHandler((MethodCall methodCall) async {
      if (method.call == 'getBatteryLevel') {
        return 21;
      }
    });
  });

  // [...]

  test('getBatteryLevel', () async {
    expect(await platform.getBatteryLevel(), 21);
  });
}
```

   It doesn't compile as written: the handler's parameter is `methodCall`, so the check is `methodCall.method`. The API reference documents the mock handler on `TestDefaultBinaryMessenger` as `void setMockMethodCallHandler(MethodChannel channel, Future<Object?>? handler(MethodCall message)?)` (https://api.flutter.dev/flutter/flutter_test/TestDefaultBinaryMessenger-class.html), reached through `TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger` (https://api.flutter.dev/flutter/flutter_test/TestDefaultBinaryMessengerBinding/defaultBinaryMessenger.html). Corrected lines:

```dart
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
      if (methodCall.method == 'getBatteryLevel') {
        return 21;
      }
    });
```

   The docs keep this for a plugin's own tests: `TestDefaultBinaryMessenger` "is mainly useful in the internal tests of plugin implementations, rather than tests of code using plugins", since channels are internal details that "might change substantially even in a bugfix update" (https://docs.flutter.dev/testing/plugins-in-tests).
3. **Integration tests,** "the only layer that exercises real native code": an `integration_test/` folder inside `example/`, `integration_test` in `dev_dependencies`, run from `example/` with `flutter test integration_test/`. "This is the test that catches the broken Swift method, the missing Android permission, the typo in the channel name. Don't ship a plugin without it." The docs add that `integration_test` "can't interact with native UI, such as native dialogs or the contents of platform views" and point to `patrol` for that (https://docs.flutter.dev/testing/testing-plugins).

```dart
// example/integration_test/plugin_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mybatteryplugin/mybatteryplugin.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('reads a real battery level', (tester) async {
    final plugin = Mybatteryplugin();
    final level = await plugin.getBatteryLevel();
    expect(level, isNotNull);
    expect(level, inInclusiveRange(0, 100));
  });
}
```

4. **Native tests** for non-trivial Swift or Kotlin logic: XCTest in `example/ios/RunnerTests/`, JUnit in `example/android/app/src/test/` per the article. The docs' locations: JUnit in `android/src/test/`, XCTest in `example/ios/RunnerTests/` and `example/macos/RunnerTests/`, GoogleTest in `linux/test/` and `windows/test/` (https://docs.flutter.dev/testing/testing-plugins).

- **CI:** all four layers on every push: unit and channel tests on Linux, integration tests on macOS (iOS simulator) and Linux (Android emulator), native tests on each platform's runner.
- **Publishing** (pub points, `dart pub publish --dry-run`, retraction) is in [../dart/PACKAGES.md](../dart/PACKAGES.md#publishing).

## Native files a Flutter app needs

| File | What a Flutter app sets there | Details |
|---|---|---|
| `android/app/src/main/AndroidManifest.xml` | `android:label`; `android:icon="@mipmap/ic_launcher"`; `<uses-permission android:name="android.permission.INTERNET"/>` if the app needs internet (the standard template doesn't include it but allows internet during development); `flutter_deeplinking_enabled` meta-data; `io.flutter.embedding.android.EnableHcpp` and `io.flutter.embedding.android.DartFlags` meta-data; `android:enableOnBackInvokedCallback="true"` on `<application>` when sheets, dialogs and modals don't close with the back button or edge swipe on some devices ([FlutterPro](https://flutterpro.design/details/android-back-button), which warns the flag "breaks `WillPopScope`. Migrate to `PopScope` first"; the docs add the attribute to enable predictive back on Android 13 or later, https://docs.flutter.dev/platform-integration/android/predictive-back, and deprecate `WillPopScope` for `PopScope`, https://docs.flutter.dev/release/breaking-changes/android-predictive-back) | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md), [VERSIONS.md](VERSIONS.md) |
| `android/app/build.gradle.kts` | `compileSdk`, `minSdk`, `targetSdk`, `versionCode`, `versionName` from `flutter.*`; `signingConfigs`; `productFlavors`; `abiFilters` in `defaultConfig`; `kotlin { compilerOptions { ... } }` | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) |
| `android/key.properties` | Upload keystore passwords, alias and path. Never commit it | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#signing) |
| `android/gradle.properties` | `android.builtInKotlin`, `android.newDsl` (added by the 3.44 migrator) | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#agp-9-and-built-in-kotlin) |
| `android/app/src/<flavor>/res/` | Per-flavor `values/strings.xml` (`app_name`) and `mipmap-*/ic_launcher.png` | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#flavors) |
| `android/app/src/main/.../MainActivity.kt` | `configureFlutterEngine()` channel handlers; its `package` line moves with `applicationId`/`namespace` | Above |
| `android/app/src/main/res/values/styles.xml`, `values-night/styles.xml` | With platform views using Material Components: `implementation("com.google.android.material:material:<version>")` and `NormalTheme` parent `Theme.MaterialComponents.Light.NoActionBar` (light) or `Theme.MaterialComponents.DayNight.NoActionBar` (night) | |
| `ios/Runner.xcworkspace` | `open ios/Runner.xcworkspace`, then set Display Name, Bundle Identifier, signing Team, iOS Deployment Target, schemes per flavor | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#ios-release) |
| `ios/Runner/AppDelegate.swift` | `FlutterImplicitEngineDelegate`, plugin registration and channels in `didInitializeImplicitFlutterEngine` | Above |
| `ios/Runner/Info.plist` | `CFBundleDisplayName` = `$(APP_DISPLAY_NAME)` for flavors; `UIApplicationSceneManifest`; `FlutterDeepLinkingEnabled`; `View controller-based status bar appearance` = `NO` when the status bar is hidden at launch or ignores your style ([ApparenceKit](https://apparencekit.dev/flutter-tips/change-system-bar-brightness/), [../flutter-ux/DEVICE-FEATURES.md](../flutter-ux/DEVICE-FEATURES.md#status-bar-style)) | [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#uiscene) |
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
- A plugin's `pubspec.yaml` `flutter.plugin.platforms` lists only the platforms it implements, and its channel name has a domain prefix (not the template's bare name).
- A plugin has all four test layers: `flutter test` passes the unit and channel tests, `flutter test integration_test/` from `example/` passes on an iOS simulator and an Android emulator, and the native tests run in Xcode and Android Studio.
- No plugin is newly scaffolded with `--template=plugin_ffi` on Flutter 3.44 or later.
