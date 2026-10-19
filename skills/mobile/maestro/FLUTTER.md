# Flutter with Maestro

Flutter-specific Maestro guidance from mobile-dev-inc/maestro-docs and its linked Flutter issue reports. Shared installation, YAML, input, auth and permissions are in [MAESTRO.md](MAESTRO.md). For Flutter identifier instrumentation, read the named [e2e-testing Flutter semantics reference](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/e2e-testing/FLUTTER-SEMANTICS.md); it is a directly readable source reference, not a requirement to install another test framework.

## How Maestro sees Flutter

[mobile-dev-inc/maestro-docs, Flutter guide]

- **Maestro** "interacts with the device elements that Flutter exposes through its Semantics Tree", not by injecting Dart code, and supports pure and hybrid (add-to-app) apps. No `pubspec.yaml` integration: "Maestro tests the compiled APK or IPA directly." On Android and iOS the CLI installs a small companion driver app on the device to read the screen and tap and swipe.
- **A widget needs semantic information to be targetable.** `Text` and `TextField` provide it implicitly; `Semantics.label` becomes the accessibility label that Maestro's `text` selector matches.
- **Inspect what Maestro sees** with Maestro Studio's point-and-click view or `maestro hierarchy` in the terminal.

- **Canvas screens:** Maestro falls back to `point` taps on screens without targetable accessibility nodes. [mobile-dev-inc/maestro-docs, Flutter]

## Selectors

Use the [e2e-testing Flutter semantics reference](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/e2e-testing/FLUTTER-SEMANTICS.md#selectors) for Flutter identifiers and labels, and the [Maestro matching contract](MAESTRO.md#selectors) for selector behavior. [mobile-dev-inc/maestro-docs, Flutter selectors]

## Flutter Web

- **Turn semantics on.** Flutter Web renders to `<canvas>` without the semantics overlay by default. Call `SemanticsBinding.instance.ensureSemantics();` in `main()` after `WidgetsFlutterBinding.ensureInitialized();`, or "`assertVisible` and `tapOn` will fail silently".
- **Known Maestro reports on Flutter Web:** with semantics on, element discovery worked, but users then saw flaky taps on a text field, IconButtons not tappable, and no scrolling (#2591, closed 2026-02-27, scrolling "fixed elsewhere"). `scroll` and `scrollUntilVisible` not working on Flutter Web was "Fixed in #2828" (#2465, closed 2026-02-19).
- **Flutter Desktop is not supported** by Maestro.

## Setup and running with Maestro

Use [Maestro setup](MAESTRO.md#setup-and-running) for installation, device prerequisites, CLI flags, app reset and Studio. The Flutter-specific steps remain below. [mobile-dev-inc/maestro-docs, Flutter guide]

- **Builds:** Android `flutter build apk --debug` (output `build/app/outputs/flutter-apk/`); iOS `flutter build ios --debug --simulator` (output `build/ios/iphonesimulator/`, including `Runner.app` in the source example).

- **Different app ids per platform:** `appId: ${APP_ID}` in the flow, then `maestro test -e APP_ID=com.example.app.ios flow.yaml`.

- **Pass launch arguments** with `launchApp: arguments:` and read them in Flutter with the `flutter_launch_arguments` package:

```dart
import 'package:flutter_launch_arguments/flutter_launch_arguments.dart';

Future<void> getArguments() async {
  final fla = FlutterLaunchArguments();
  final foo = await fla.getString('foo');
  final isFooEnabled = await fla.getBool('isFooEnabled');
}
```

- **Let the app know it runs under Maestro** with `arguments: { isMaestro: "true" }`, for example to turn off custom animations that `waitForAnimationToEnd` misses. Checking ports `7001` (Android) / `22087` (iOS) is deprecated and unsupported on Maestro Cloud.

## Waits

Maestro timing, assertions, animation waits and scrolling are [defined once here](MAESTRO.md#waiting-and-scrolling). [mobile-dev-inc/maestro-docs, command references]

## Text input and the keyboard

Maestro input, the Android Unicode source/version conflict, secure-field and keyboard caveats are [defined here](MAESTRO.md#text-input-and-the-keyboard). [mobile-dev-inc/maestro-docs, inputText and known issues]

## Permissions and native dialogs

Use [Maestro permission and reset semantics](MAESTRO.md#permissions-and-native-dialogs). Flutter does not change that runner contract. [mobile-dev-inc/maestro-docs, launchApp and setPermissions]

## Known limitations and issues

[mobile-dev-inc/maestro-docs, Flutter issues]

- A container transform (animations package) made targets untappable on iOS (#796, closed for lack of a minimal repro).
- Studio cannot interact with an iOS native pop-up in landscape (#2065, open, labelled framework: flutter).
- Flutter Desktop is unsupported; Flutter Web issues are under [Flutter Web](#flutter-web).

## CI

Maestro Cloud binary/device requirements and the official CLI form are in [Maestro CI](MAESTRO.md#ci). Flutter build outputs remain in [Setup and running with Maestro](#setup-and-running-with-maestro). GitHub Actions and PR lifecycle examples are excluded by owner scope. [mobile-dev-inc/maestro-docs; owner scope]

## Prove it

Controls targeted by Flutter identifier expose that identifier in `maestro hierarchy` or Maestro Studio on the selected Android and iOS targets. A Maestro flow targets by `id:` or visible text, never a Key, and waits through assertions or `extendedWaitUntil`, not sleeps. On Flutter Web, `ensureSemantics()` runs in `main()` before the first `tapOn`. Cloud binaries follow Maestro's simulator `.app` or APK contract. Report the targets actually checked. [mobile-dev-inc/maestro-docs, Flutter selectors, Flutter Web and Cloud]
