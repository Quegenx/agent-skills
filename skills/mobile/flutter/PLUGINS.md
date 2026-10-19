# Flutter plugins

Writing and testing Flutter plugins, from ApparenceKit's [plugin guide](https://apparencekit.dev/blog/flutter-create-plugin/) and the official [plugin testing documentation](https://docs.flutter.dev/testing/testing-plugins). The community guide states no Flutter version; its CocoaPods and FFI-template differences from current Flutter guidance remain marked below. Source blocks below preserve the original code with trailing whitespace removed. App-side channels, Pigeon and host integration are in [PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md).

**Contents:** [Writing a plugin](#writing-a-plugin) · [Testing a plugin](#testing-a-plugin) · [Prove it](#prove-it)

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

- **Languages** are chosen per side independently (Swift on iOS, Java on Android is fine). The article's table gives C++ for Linux; the platform-channels page says Linux C (https://docs.flutter.dev/platform-integration/platform-channels, and [Pick the mechanism](PLATFORM-INTEGRATION.md#pick-the-mechanism)). Follow the docs.
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

- **The template's channel is named bare** (`"mybatteryplugin"`, see the Kotlin below). The docs' platform-channel rule still applies: "Prefix with a unique domain prefix" ([Platform channels](PLATFORM-INTEGRATION.md#platform-channels)).
- **The `invokeMethod` call has no try/catch** in the article; wrap it per [Platform channels](PLATFORM-INTEGRATION.md#platform-channels).

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

The `default` branch should answer `FlutterMethodNotImplemented`, as in the docs' [iOS host](PLATFORM-INTEGRATION.md#ios-host): `result(FlutterMethodNotImplemented)`.

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

The app-side host in `MainActivity.kt` is in [Android host](PLATFORM-INTEGRATION.md#android-host); a plugin gets its messenger and context from `FlutterPluginBinding` instead.

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
- **The template, two sources.** The article scaffolds with `flutter create --template=plugin_ffi --platforms=android,ios myffiplugin` (a `src/myffiplugin.c` plus bindings that `ffigen` generates from the `.h` named in `ffigen.yaml`). Flutter 3.44 deprecated the `plugin_ffi` template ([VERSIONS.md](VERSIONS.md#344-2026-05-18)); the current route is build hooks with `ffigen`, in [dart FFI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/FFI.md). Both use `ffigen`, so "you never write the binding glue by hand".

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
- **Publishing** (pub points, `dart pub publish --dry-run`, retraction) is in [dart PACKAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/PACKAGES.md#publishing).

## Prove it

Sources: [ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/), the [official plugin-testing guide](https://docs.flutter.dev/testing/testing-plugins) and the [existing Flutter 3.44 template correction](VERSIONS.md#344-2026-05-18).

- A plugin's `pubspec.yaml` `flutter.plugin.platforms` lists only the platforms it implements, and its channel name has a domain prefix (not the template's bare name).
- A plugin has all four test layers: `flutter test` passes the unit and channel tests, `flutter test integration_test/` from `example/` passes on an iOS simulator and an Android emulator, and the native tests run in Xcode and Android Studio.
- No plugin is newly scaffolded with `--template=plugin_ffi` on Flutter 3.44 or later.
