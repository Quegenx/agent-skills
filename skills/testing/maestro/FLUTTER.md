# Flutter with Maestro

Flutter-specific Maestro guidance from mobile-dev-inc/maestro-docs and its linked Flutter issue reports. Shared installation, YAML, input, auth and permissions are in [MAESTRO.md](MAESTRO.md). For Flutter identifier instrumentation, read [FLUTTER-SEMANTICS.md](FLUTTER-SEMANTICS.md). The sourced tool comparison below preserves competing vendors' views; another framework is not required for Maestro.

## Choosing a Flutter tool

[mobile-dev-inc/maestro-docs, Flutter comparison; leancodepl/patrol, comparison; tester-army/e2e, mobile engine]

| | Patrol | Maestro | e2e (`@e2e-dev/mobile`) |
|---|---|---|---|
| Where the test runs | Dart code inside the app process | outside, through a companion driver app on the device | outside, through `agent-device` |
| How it finds widgets | Keys | Semantics labels and identifiers in the accessibility tree | the accessibility tree; `testId` is the accessibility identifier (iOS) or resource id (Android) |
| App changes | `patrol` dependency, native setup ([patrol: PATROL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/patrol/PATROL.md)) | none in `pubspec.yaml`; tests the compiled APK or IPA | none in the app; a separate `e2e/` test project beside it |
| Tests are | Dart | YAML flows | TypeScript, with optional agent steps |
| Physical iPhone | see [patrol: PATROL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/patrol/PATROL.md) | official CLI on simulators only | yes, but permissions, `clearState`, location, appearance, biometrics and keychain are simulator-only |

- **Pick Maestro or e2e when the test must stay outside the app:** Maestro tests "remain stable across Flutter version updates because Maestro does not depend on the internal widget tree", and reaches system flows like push notifications and permission dialogs, which "in-app Dart frameworks cannot reach".
- **Comparison conflict:** Maestro's quoted framing above says in-app Dart frameworks cannot reach system flows; Patrol's guide documents Dart-driven native permission dialogs and platform automation. Preserve both source views, and use Patrol's own guide for its capabilities rather than interpreting the Maestro quote as a Patrol restriction. [mobile-dev-inc/maestro-docs, Flutter comparison; leancodepl/patrol, native automation]
- **Maestro's own comparison** (from the tool's maker): Maestro supports native dialogs and release builds; Flutter Driver is debug or profile only with no native dialogs; Maestro's element selection is "Accessibility labels/IDs only".
- **Patrol vs Maestro, from Patrol's maker** (LeanCode, so not neutral; this is the only comparison of the two in the sources): Patrol tests are Dart inside the app process and select by Keys, Maestro drives from outside through the accessibility tree; "On iOS, Maestro's official CLI runs on simulators only", and physical iOS has been the most requested Maestro feature since January 2023 (#686); Maestro installs in one line, Patrol takes more setup; Patrol toggles Wi-Fi, cellular and Bluetooth on both platforms, Maestro offers airplane mode on Android only.
- **e2e** mixes exact locator steps with agent goals, and its agent can drive a screen with no accessibility nodes from screenshots. Its network controls are Android only too: `device.setNetwork('offline')` and `device.setAirplaneMode(true)` fail with `UNSUPPORTED_CAPABILITY` on iOS, and airplane mode needs Android 11+. Its docs do not mention Patrol.
- **Porting Maestro flows to e2e** is [tester-army-e2e: SUITE-MIGRATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/SUITE-MIGRATION.md); the e2e runner in general is [tester-army-e2e: RUNNER-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/RUNNER-SETUP.md).

## How Maestro sees Flutter

[mobile-dev-inc/maestro-docs, Flutter guide]

- **Maestro** "interacts with the device elements that Flutter exposes through its Semantics Tree", not by injecting Dart code, and supports pure and hybrid (add-to-app) apps. No `pubspec.yaml` integration: "Maestro tests the compiled APK or IPA directly." On Android and iOS the CLI installs a small companion driver app on the device to read the screen and tap and swipe.
- **A widget needs semantic information to be targetable.** `Text` and `TextField` provide it implicitly; `Semantics.label` becomes the accessibility label that Maestro's `text` selector matches.
- **Inspect what Maestro sees** with Maestro Studio's point-and-click view or `maestro hierarchy` in the terminal.

- **Canvas screens:** Maestro falls back to `point` taps on screens without targetable accessibility nodes. [mobile-dev-inc/maestro-docs, Flutter]

## Selectors

Use the [Flutter semantics reference](FLUTTER-SEMANTICS.md#selectors) for Flutter identifiers and labels, and the [Maestro matching contract](MAESTRO.md#selectors) for selector behavior. [mobile-dev-inc/maestro-docs, Flutter selectors]

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
