# Flutter end to end: Patrol, Maestro or the e2e runner

Flutter paints onto a canvas, so a tool outside the app sees only what Flutter's AccessibilityBridge translates from its virtual semantics tree into the native accessibility tree that TalkBack, VoiceOver and accessibility-based test tools read. Maestro and the `e2e` runner both work from outside on that tree: give every control a test needs a `Semantics(identifier:)` and both find it. Flutter Keys never reach that tree. Patrol runs as Dart inside the app and finds widgets by Keys; it has its own file, [PATROL.md](PATROL.md).

**Contents:** [Choosing a tool](#choosing-a-tool) · [How Maestro and e2e see a Flutter app](#how-maestro-and-e2e-see-a-flutter-app) · [Selectors](#selectors) · [MergeSemantics and merged nodes](#mergesemantics-and-merged-nodes) · [Flutter Web](#flutter-web) · [Setup and running with Maestro](#setup-and-running-with-maestro) · [Setup and running with e2e](#setup-and-running-with-e2e) · [Waits](#waits) · [Scrolling](#scrolling) · [Text input and the keyboard](#text-input-and-the-keyboard) · [Permissions and native dialogs](#permissions-and-native-dialogs) · [Known limitations and issues](#known-limitations-and-issues) · [CI](#ci) · [Prove it](#prove-it)

## Choosing a tool

| | Patrol | Maestro | e2e (`@e2e-dev/mobile`) |
|---|---|---|---|
| Where the test runs | Dart code inside the app process | outside, through a companion driver app on the device | outside, through `agent-device` |
| How it finds widgets | Keys | Semantics labels and identifiers in the accessibility tree | the accessibility tree; `testId` is the accessibility identifier (iOS) or resource id (Android) |
| App changes | `patrol` dependency, native setup ([PATROL.md](PATROL.md)) | none in `pubspec.yaml`; tests the compiled APK or IPA | none in the app; a separate `e2e/` test project beside it |
| Tests are | Dart | YAML flows | TypeScript, with optional agent steps |
| Physical iPhone | see [PATROL.md](PATROL.md) | official CLI on simulators only | yes, but permissions, `clearState`, location, appearance, biometrics and keychain are simulator-only |

- **Pick Maestro or e2e when the test must stay outside the app:** Maestro tests "remain stable across Flutter version updates because Maestro does not depend on the internal widget tree", and reaches system flows like push notifications and permission dialogs, which "in-app Dart frameworks cannot reach".
- **Maestro's own comparison** (from the tool's maker): Maestro supports native dialogs and release builds; Flutter Driver is debug or profile only with no native dialogs; Maestro's element selection is "Accessibility labels/IDs only".
- **Patrol vs Maestro, from Patrol's maker** (LeanCode, so not neutral; this is the only comparison of the two in the sources): Patrol tests are Dart inside the app process and select by Keys, Maestro drives from outside through the accessibility tree; "On iOS, Maestro's official CLI runs on simulators only", and physical iOS has been the most requested Maestro feature since January 2023 (#686); Maestro installs in one line, Patrol takes more setup; Patrol toggles Wi-Fi, cellular and Bluetooth on both platforms, Maestro offers airplane mode on Android only.
- **e2e** mixes exact locator steps with agent goals, and its agent can drive a screen with no accessibility nodes from screenshots. Its network controls are Android only too: `device.setNetwork('offline')` and `device.setAirplaneMode(true)` fail with `UNSUPPORTED_CAPABILITY` on iOS, and airplane mode needs Android 11+. Its docs do not mention Patrol.
- **Porting Maestro flows to e2e** is [SUITE-MIGRATION.md](SUITE-MIGRATION.md); the e2e runner in general is [RUNNER-SETUP.md](RUNNER-SETUP.md).

## How Maestro and e2e see a Flutter app

- **Maestro** "interacts with the device elements that Flutter exposes through its Semantics Tree", not by injecting Dart code, and supports pure and hybrid (add-to-app) apps. No `pubspec.yaml` integration: "Maestro tests the compiled APK or IPA directly." On Android and iOS the CLI installs a small companion driver app on the device to read the screen and tap and swipe.
- **A widget needs semantic information to be targetable.** `Text` and `TextField` provide it implicitly; `Semantics.label` becomes the accessibility label that Maestro's `text` selector matches.
- **Inspect what Maestro sees** with Maestro Studio's point-and-click view or `maestro hierarchy` in the terminal.
- **e2e** runs on iOS simulators, Android emulators and connected phones through callstack `agent-device`, with the same `agent`, `screen` and `expect` APIs as browser tests. The engine's `observe` is "The accessibility tree with rects", and the node's `testId` is the accessibility identifier (iOS) or resource id (Android). Flutter reports the id the app set, unprefixed, so a test names a view by that id on both platforms.
- **Canvas screens in e2e:** the agent reads the semantic tree and asks for screenshots when it needs them; "A screen with no listed interactive nodes, such as a canvas, opens with a screenshot", and point tools (`tap_at`, `type_at`) reach controls absent from the tree. Maestro falls back to `point` taps on such screens.
- **e2e has no `maestro hierarchy` or Studio equivalent yet:** `npx e2e mcp` gives a coding agent a live device session, and `device.locator` takes `agent-device` selectors.

## Selectors

- **Maestro's rule:** "**Flutter**: Use visible text or Semantics Labels (for text), or Semantics Identifiers (for id). Internal Flutter "Keys" are not supported."
- **Why not Keys:** "They are not exposed to the system's accessibility layer. Because Maestro lives outside the Flutter runtime, it cannot "see" Keys. Always use Semantics for automation." A `flutter_driver`-based route to Keys was rejected because it works only in debug and profile builds (Dart VM service extensions are off in release), needs a `pubspec.yaml` dependency and init code, and would need context switching and tree merging for relative selectors. e2e's docs say nothing about Keys; their only Flutter id is `Semantics(identifier:)`.
- **Use `Semantics(identifier:)` for test ids** (Flutter 3.19+), above all in localized or A/B-tested apps. It lands in the native accessibility tree on Android and iOS, so Maestro's `id`, Maestro Studio, e2e's `getByTestId` and Appium all find it. Don't put test ids in a label: screen readers read the label aloud, while the identifier is "the same as accessibility label, but only for UI testing. Screen readers won't read it out."

```dart
Semantics(
  identifier: 'login_button',
  child: ElevatedButton(onPressed: _login, child: Text('Sign In')),
)
```

```yaml
- tapOn:
    id: "login_button"
```

- **Label an icon with no text** through `semanticLabel`, and wrap a layout widget in `Semantics(label:)` to make a non-text area tappable:

```dart
FloatingActionButton(
  onPressed: _incrementCounter,
  child: Icon(Icons.add, semanticLabel: 'fabAddIcon'),
)
```

```yaml
- tapOn: "fabAddIcon"
```

```dart
Semantics(
  label: 'yellow_box',
  child: Container(color: Colors.yellow, width: 100, height: 100),
)
```

- **Maestro matching and selectors:** use the [shared Maestro contract](MAESTRO.md#selectors); Flutter identifiers and labels are described above. [mobile-dev-inc/maestro-docs, Flutter selectors]
- **e2e matching:** use the [shared mobile engine contract](RUNNER-SETUP.md#mobile-targets). Flutter reports its identifier unprefixed on both platforms. [tester-army/e2e, Flutter example]
- **A screen set up for e2e** (from its Flutter example; field and button bodies shortened, and `Image.asset(..., excludeFromSemantics: true)` hides the decorative logo):

```dart
// identifier is what getByTestId finds: the resource id on Android,
// the accessibility identifier on iOS.
Semantics(
  identifier: 'name',
  // The hint is not a name; without this the field reads as an unnamed textbox.
  label: 'Name',
  child: SizedBox(height: 48, child: TextField(controller: _name, ...)),
),
// MergeSemantics folds the identifier into the button's own node.
MergeSemantics(
  child: Semantics(
    identifier: 'greet',
    child: SizedBox(width: double.infinity, height: 48, child: TextButton(onPressed: _greet, child: const Text('GREET'))),
  ),
),
Semantics(identifier: 'error', container: true, liveRegion: true, child: Text('Enter a name first.')),
Semantics(identifier: 'greeting', container: true, child: Container(child: Text('Hello, $greeted!'))),
```

## MergeSemantics and merged nodes

- **Wrap a button's `Semantics` in `MergeSemantics`** "so the id and the button role land on one node". It is the one Flutter-specific rule in e2e's device docs.
- **An `IconButton` labelled only on its `Icon`** gave a Maestro tap that passed with no effect (Maestro 1.33.1, Android 14, Flutter 3.13.9). Wrapping the `IconButton` fixed it:

```dart
child: Semantics(
  button: true,
  label: 'Account',
  child: IconButton()...
```

- **Merged text shows up as the selector:** a `BottomNavigationBarItem` was found by its merged accessibility text, not the wrapped Semantics: `tapOn: 'Menu\nTab 2 of 2'`. The suspected cause was the icon's semantics merging into the item's title. Read the real selector off Maestro Studio instead of guessing.

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

## Setup and running with e2e

- **Layout:** the test project lives in `e2e/` beside the Flutter project, since a Flutter app has no `package.json`. Source example dev dependencies are `e2e ^0.18.0`, `@e2e-dev/mobile ^0.10.0`, `ai ^7.0.0`; Node requirements are in [Install](RUNNER-SETUP.md#install) and the shared engine contract is in [Mobile targets](RUNNER-SETUP.md#mobile-targets). From an existing Maestro suite, `npx e2e init --yes --engine mobile` writes a mobile config. [tester-army/e2e, Flutter example]
- **Build and install the Flutter app first.** Android `flutter build apk` then `flutter install`; iOS `flutter build ios --simulator` then `flutter install`; pick a device with `flutter install -d <id>`. Or set `app.appPath` and call `device.installApp()`. "After app changes, build and install again before you run the tests."
- **Run:** `cd e2e && npm install && npx agent-device doctor && npm run test:e2e:android`, with scripts `"test:e2e:android": "e2e run --target android"` and `"test:e2e:ios": "e2e run --target ios"`.
- **Config:** one target per platform, the same bundle id, `workers: 1`:

```ts
const app = { bundleId: 'dev.e2e.examples.flutter' };
export default {
  agents: { default: { model: gateway('openai/gpt-6-luna-fast'), system: 'You are a thorough QA agent. Verify every outcome.' } },
  targets: [
    { name: 'android', engine: mobile({ platform: 'android' }), app },
    { name: 'ios', engine: mobile({ platform: 'ios' }), app },
  ],
  workers: 1,
} satisfies E2EConfig;
```

- **A deterministic test:**

```ts
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

test('greets the name you type', async ({ app, screen }) => {
  await app.open();
  await screen.getByTestId('name').fill('Ada');
  await screen.getByTestId('greet').tap();
  await expect(screen.getByTestId('greeting')).toHaveText('Hello, Ada!');
});
```

- **An agent step pinned by a model-free check** (skipped unless `AI_GATEWAY_API_KEY` is set):

```ts
await agent.act('get the app to greet {name}', { params: { name: 'Grace' } });
// Pair each agent step with a check that does not depend on the model.
await expect(screen.getByTestId('greeting')).toHaveText('Hello, Grace!');
await agent.assert('the app greets Grace by name');
```

- **Start each test with `app.open()`:** between tests "the app stays where the last test left it".
- **Device state and sessions:** use the [shared mobile engine contract](RUNNER-SETUP.md#mobile-targets). [tester-army/e2e, Flutter example]

- **Source example checked with** e2e 0.18.0, `@e2e-dev/mobile` 0.10.0 and Flutter 3.47 on an Android 16 emulator and an iOS 26 simulator.

## Waits

Maestro timing, assertions and animation waits are [defined once here](MAESTRO.md#waiting-and-scrolling). Shared e2e action/expectation deadlines, mobile stability windows, cold-start limits and non-retried actions are in [runner configuration](RUNNER-SETUP.md#config) and [Mobile targets](RUNNER-SETUP.md#mobile-targets). [mobile-dev-inc/maestro-docs; tester-army/e2e]

- **Maestro waits in e2e terms:** `retryTapIfNoChange` / `waitToSettleTimeoutMs` become engine-wide `mobile({ settle, transition })`; `waitForAnimationToEnd` becomes "an assertion on the settled state"; `extendedWaitUntil` becomes `.toBeVisible({ timeout })`.

## Scrolling

Use the [Maestro scrolling contract](MAESTRO.md#waiting-and-scrolling) or the [e2e mobile scrolling and swipe-direction contract](RUNNER-SETUP.md#mobile-targets). Neither API should be redefined as a Flutter-specific operation. [mobile-dev-inc/maestro-docs; tester-army/e2e]

## Text input and the keyboard

Maestro input, the Android Unicode source/version conflict, secure-field and keyboard caveats are [defined here](MAESTRO.md#text-input-and-the-keyboard). e2e input and keyboard operations are [defined here](RUNNER-SETUP.md#mobile-targets). [mobile-dev-inc/maestro-docs; tester-army/e2e]

- **Secrets in e2e:** `type_secret` and `screen.getByLabel(...).fill(secret)` fill declared secrets into secure fields, and no screenshots are sent after a secret fill.

## Permissions and native dialogs

Use [Maestro permission and reset semantics](MAESTRO.md#permissions-and-native-dialogs) or [e2e pre-launch permissions and alerts](RUNNER-SETUP.md#mobile-targets). Flutter does not change either runner contract. [mobile-dev-inc/maestro-docs; tester-army/e2e]

## Known limitations and issues

- **Maestro:**
  - A container transform (animations package) made targets untappable on iOS (#796, closed for lack of a minimal repro).
  - Studio cannot interact with an iOS native pop-up in landscape (#2065, open, labelled framework: flutter).
  - Flutter Desktop is unsupported; Flutter Web issues are under [Flutter Web](#flutter-web).
- **e2e:**
  - The iOS runner can wedge on heavy or animating screens: `npx agent-device daemon stop`, then `xcrun simctl shutdown <udid> && xcrun simctl boot <udid>`.
  - Its other listed device limitations are React Native or Compose specific.

## CI

Maestro Cloud binary/device requirements and the official CLI form are in [Maestro CI](MAESTRO.md#ci). Shared e2e platform prerequisites, runtime pinning, installation/run steps and hosted-device distinctions are in [Mobile targets](RUNNER-SETUP.md#mobile-targets). Flutter build outputs remain in [Setup and running with Maestro](#setup-and-running-with-maestro). GitHub Actions and PR lifecycle examples are excluded by owner scope. [mobile-dev-inc/maestro-docs; tester-army/e2e; owner scope]

## Prove it

Every control a test touches has a `Semantics(identifier:)` (buttons wrapped in `MergeSemantics`), and `maestro hierarchy` or Maestro Studio shows that id on both Android and iOS. A Maestro flow targets by `id:` or visible text, never a Key, and waits through assertions or `extendedWaitUntil`, not sleeps. An e2e suite builds and installs the app first, starts each test with `app.open()`, passes `npm run test:e2e:android` and `test:e2e:ios`, and pins every `agent.act` with a model-free `expect`. On Flutter Web, `ensureSemantics()` runs in `main()` before the first `tapOn`. In CI the iOS runtime is pinned and the uploaded binary is a simulator `.app` or an APK.
