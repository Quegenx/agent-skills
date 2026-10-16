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

- **Maestro matching:** `text` and `id` are regular expressions by default (escape `$` and `[` with `\`), case-insensitive, and tap the first match; `index` is 0-based and picks one of several. `id` is the Resource ID on Android and `accessibilityIdentifier` on iOS. Relative selectors: `below`, `above`, `leftOf`, `rightOf`, `containsChild`, `childOf`, `containsDescendants`.
- **e2e matching:** `getByTestId(id, { visible? })` reads the accessibility identifier on iOS and the resource id on Android. A string matches the whole id, case included, and a RegExp tests it; on Android the `<package>:id/` prefix may be left off. Several matches fail with `LOCATOR_AMBIGUOUS`. It is listed as "Last resort" after role, label and text queries. `below`, `above`, `leftOf`, `rightOf` and `containsDescendants` have no port. "`placeholder` is the only attribute a device node has."
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

- **Install:** Java 17 or higher with `JAVA_HOME` set (the known-issues page recommends 17 or 21). `curl -fsSL "https://get.maestro.mobile.dev" | bash`, or Homebrew: `brew tap mobile-dev-inc/tap`, `brew trust --formula mobile-dev-inc/tap/maestro`, `brew install mobile-dev-inc/tap/maestro`. Verify with `maestro --help`.
- **iOS:** Xcode Simulators, Xcode Command Line Tools (`xcode-select --install`), the app targeted by Bundle ID. If Xcode was installed without opening it, run `xcodebuild -runFirstLaunch` or no simulators appear.
- **Android:** ADB, auto-detecting running emulators or physical devices with USB Debugging on; the flow targets the package (`appId`). An emulator on API 31 or higher is recommended. "Maestro assumes the application is already installed on the target device/emulator before the test begins."
- **Builds:** Android `flutter build apk --debug` (output `build/app/outputs/flutter-apk/`); iOS `flutter build ios --debug --simulator` (output `build/ios/iphonesimulator/`).
- **Different app ids per platform:** `appId: ${APP_ID}` in the flow, then `maestro test -e APP_ID=com.example.app.ios flow.yaml`.
- **CLI flags:** global `--device` / `--udid` and `-p` / `--platform` (`--platform=ios`). `test` takes `--format` (`JUNIT`, `HTML`, `NOOP`), `--output`, `-s` / `--shards`, `--include-tags`, `--exclude-tags`, `-c` / `--continuous`. Subcommands include `start-device`, `list-devices`, `record`, `mcp`.
- **`launchApp`** stops the app first by default (`stopApp: true`); `clearState: true` clears data; `clearKeychain: true` clears the whole iOS keychain.
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
- **Maestro Studio** (desktop, needs the Android SDK and/or Xcode): connect a device, right-click an element to add a YAML command, take autocomplete's real selectors from the device screen, run step by step. Downloads: `https://studio.maestro.dev/MaestroStudio.dmg` (macOS), `https://studio.maestro.dev/MaestroStudio.exe` (Windows).

## Setup and running with e2e

- **Layout:** the test project lives in `e2e/` beside the Flutter project, since a Flutter app has no `package.json`. Dev dependencies `e2e ^0.18.0`, `@e2e-dev/mobile ^0.10.0`, `ai ^7.0.0`; Node 22.22.3+, 24.8+ or 26+. From an existing Maestro suite, `npx e2e init --yes --engine mobile` writes a mobile config.
- **Build and install first; the engine installs nothing on its own.** Android `flutter build apk` then `flutter install`; iOS `flutter build ios --simulator` then `flutter install`; pick a device with `flutter install -d <id>`. Or set `app.appPath` and call `device.installApp()`. "After app changes, build and install again before you run the tests."
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
- **No `test.setup` or session snapshot on devices:** sign in per test or seed the app.
- **Checked with** e2e 0.18.0, `@e2e-dev/mobile` 0.10.0 and Flutter 3.47 on an Android 16 emulator and an iOS 26 simulator.

## Waits

- **Wait on state, not time.** Maestro waits for the screen to settle automatically, no `sleep()` needed; for something expected to appear or disappear soon, use an assertion. `assertVisible` / `assertNotVisible` poll until the element appears or the timer runs out.
- **Maestro defaults:** assertions 7 seconds; longer with `extendedWaitUntil`:

```yaml
- extendedWaitUntil:
    visible: "My text that should be visible"
    timeout: 10000
```

- **`waitForAnimationToEnd`** defaults to 15000 ms, and if the animation is still running at the timeout "the command succeeds and execution continues".
- **Ghost taps in Maestro:** add `retryTapIfNoChange: true`, which retries "if the UI hierarchy does not change after the initial tap". `waitToSettleTimeoutMs` is a best-effort settle timeout per tap.
- **e2e defaults:** `actionTimeout` 30000, `assertionTimeout` 5000 (the default `expect` deadline), `launchTimeout` 60000, `retries` 0 (1 in CI). `mobile({ settle })` is the stability window after a tap, fill, scroll or back, default 150 ms; `mobile({ transition })` waits before acting on a control that just appeared or moved, default 500 ms ("iOS reports the final frame at once, Android the frame in flight").
- **Maestro waits in e2e terms:** `retryTapIfNoChange` / `waitToSettleTimeoutMs` become engine-wide `mobile({ settle, transition })`; `waitForAnimationToEnd` becomes "an assertion on the settled state"; `extendedWaitUntil` becomes `.toBeVisible({ timeout })`.
- **Android cold start in e2e:** locator actions and `expect` wait through "insufficient foreground app content", but immediate reads (`count()`, `isVisible()`) see no matches, so `not.toBeVisible()` can pass while the screen is unreadable.
- **A timed-out action is not retried in e2e:** a tap, fill or swipe that outlives its timeout fails with `ACTION_FAILED`, since "the input may have landed".

## Scrolling

- **Maestro `scrollUntilVisible`** defaults: `direction` `DOWN`, `timeout` `20000` ms, `speed` `40` (0-100), `visibilityPercentage` `100`, `centerElement` `false`.

```yaml
- scrollUntilVisible:
    element:
      id: ".*some_view_id"
    direction: DOWN
```

- **Partial scroll areas:** Maestro swipes from the screen centre to 10% from the edge, so in a bottom sheet or small scrolling widget the swipe may miss; write a custom scroll loop.
- **e2e `screen.scrollUntilVisible(target, { direction, momentum, timeout })`** defaults `'down'`, `'slow'`, `30000`. On a locator it scrolls that node: `await screen.getByTestId('feed').scrollUntilVisible(row);`.
- **Swipe direction differs:** e2e's `screen.swipe({ direction: 'down' })` names the content's direction, Maestro names the finger's.
- **Not on e2e devices:** `selectOption`, `setInputFiles`, `scrollIntoView`, `secondaryTap`, modifiers on taps. iOS `doubleTap()` is two taps about 285 ms apart; give gesture detectors 350 ms or more.

## Text input and the keyboard

- **Maestro `inputText`** "works even if no text field is focused"; in practice tap the field first (`tapOn: { id: MyTextInput }`, then `inputText`). On Android it supports ASCII only (#146).
- **iOS simulator secure fields:** `inputText` fails on `secureTextEntry` fields because of Password AutoFill. Turn off AutoFill Passwords in the simulator's Settings, run the two `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO ...` commands on CI, or use a plain text field in test builds.
- **iOS `hideKeyboard` is flaky in Maestro** (no native API; it scrolls from the screen centre): `tapOn` a non-interactive area instead. On Maestro Cloud it now fails the test if the keyboard stays.
- **e2e equivalents:** `inputText` is `screen.getByTestId('field').fill('text')`, `eraseText` is `.clear()`, `hideKeyboard` is `device.dismissKeyboard()`, `pressKey: Enter` is `.press('Enter')`. `dismissKeyboard()` uses the keyboard's dismiss key where it has one (Android, iPad), else a short drag at the screen centre, and fails with `UNSUPPORTED_CAPABILITY` if the keyboard stays.
- **Secrets in e2e:** `type_secret` and `screen.getByLabel(...).fill(secret)` fill declared secrets into secure fields, and no screenshots are sent after a secret fill.

## Permissions and native dialogs

- **Maestro grants all permissions at `launchApp` by default.** Override:

```yaml
- launchApp:
    permissions:
      all: deny
      camera: allow
      location: allow
```

- **Mid-flow, `setPermissions`.** Values `allow`, `deny`, `unset`. On iOS `allow` also dismisses the prompt; iOS notifications show a prompt that Maestro taps **Allow** on, while Android grants silently. iOS extras: `location: always | inuse | never`, `photos: limited`. Some permissions exist on one platform only (`photos`, `motion`, `siri` iOS; `bluetooth`, `phone`, `sms`, `storage` Android), and custom Android permission ids are accepted.
- **e2e sets permissions before launch** "so no system prompt appears": `app.permissions` (`{ camera: 'grant', notifications: 'deny', location: 'reset' }`), or `device.setPermission(name, 'grant' | 'deny' | 'reset')`, one per call, before `app.open()`. There is no `all`, and nothing is granted unless named. `deny` answers no silently on iOS and on Android revokes, so the OS asks again.
- **A visible system alert in e2e:** `device.alert('accept' | 'dismiss')`; the agent gets an `alert` tool through `mobileTools(...)`.

## Known limitations and issues

- **Maestro:**
  - iOS lists that paginate in `willDisplayCell` misfires under XCTest, which Maestro uses (a native `UITableView` / `UICollectionView` issue).
  - Hardened or MDM Android devices that reject the companion driver APK (`INSTALL_PARSE_FAILED_NO_CERTIFICATES`) are not supported.
  - A container transform (animations package) made targets untappable on iOS (#796, closed for lack of a minimal repro).
  - Studio cannot interact with an iOS native pop-up in landscape (#2065, open, labelled framework: flutter).
  - Flutter Desktop is unsupported; Flutter Web issues are under [Flutter Web](#flutter-web).
- **e2e:**
  - The iOS runner can wedge on heavy or animating screens: `npx agent-device daemon stop`, then `xcrun simctl shutdown <udid> && xcrun simctl boot <udid>`.
  - Its other listed device limitations are React Native or Compose specific.

## CI

- **Maestro Cloud from GitHub Actions** (`mobile-dev-inc/action-maestro-cloud@v2.0.2` with `api-key`, `project-id`, `app-file`; Cloud needs a paid plan), Flutter Android job:

```yaml
- uses: subosito/flutter-action@v2
  with:
    channel: "stable"
- run: flutter build apk --debug
- uses: mobile-dev-inc/action-maestro-cloud@v2.0.2
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    project-id: ${{ secrets.MAESTRO_PROJECT_ID }}
    app-file: build/app/outputs/flutter-apk/app-debug.apk
```

- **Flutter iOS job:** `runs-on: macos-13`, `flutter build ios --debug --simulator`, `app-file: build/ios/iphonesimulator/Runner.app`.
- **Cloud binaries:** Android APK only (no `.aab`), ARM or multi-arch (x86-only fails), Release and Debug both work. iOS simulator `.app` only: "Do not upload binaries built for physical iOS devices."
- **Cloud devices:** default Android API 33 (Android 13) and iOS 16; override with `device-os` / `device-model` (`android-34`, `pixel_6`, `iOS-26-2`, `iPhone-17-Pro`); list with `maestro list-cloud-devices`. From the CLI: `maestro cloud --app-binary [your-app-binary] --flows [your-flow-directory]`.
- **Local Maestro CLI** is "the primary tool for automated execution in Continuous Integration (CI) systems"; local Android runs "1 device at a time", Cloud parallelises.
- **e2e, one job per platform:** iOS on macOS with a Release simulator `.app` (no signing) and a booted simulator; Android on Linux with KVM, a Release `.apk` and a booted emulator. Hosted Apple Silicon Macs can't run the Android emulator.
- **Pin the iOS runtime in e2e CI:** "the accessibility tree changes between iOS releases". Create the simulator on a named runtime and boot it by UDID; cache `~/.agent-device` (the XCUITest runner is built there); commit the replay cache so local recordings replay in CI.
- **e2e run steps:** `xcrun simctl install booted path/to/MyApp.app` then `npx e2e run --target ios --reporter list,junit`; `adb install -r path/to/app.apk` then `npx e2e run --target android --reporter list,junit`.
- **e2e on GitHub Actions** (the documented example builds a React Native app; swap in `flutter build`): iOS `runs-on: macos-26`, `UDID=$(xcrun simctl create e2e "iPhone 17" com.apple.CoreSimulator.SimRuntime.iOS-26-5)`, `xcrun simctl bootstatus "$UDID" -b`. Android: `reactivecircus/android-emulator-runner` v2.38.0 with `api-level: 36`, `arch: x86_64`, `target: google_apis`, `profile: pixel_7`, `disable-animations: true`, after an "Enable KVM" udev step, with `actions/setup-java` Java 17. Upload `.e2e` as an artifact.
- **Hosted devices for e2e:** Limrun, EAS Simulators (`easSimulators()`), TestMu AI (`testmu()`), or a custom `DeviceProvider`. The EAS `maestro` job type runs Maestro flows, not e2e.

## Prove it

Every control a test touches has a `Semantics(identifier:)` (buttons wrapped in `MergeSemantics`), and `maestro hierarchy` or Maestro Studio shows that id on both Android and iOS. A Maestro flow targets by `id:` or visible text, never a Key, and waits through assertions or `extendedWaitUntil`, not sleeps. An e2e suite builds and installs the app first, starts each test with `app.open()`, passes `npm run test:e2e:android` and `test:e2e:ios`, and pins every `agent.act` with a model-free `expect`. On Flutter Web, `ensureSemantics()` runs in `main()` before the first `tapOn`. In CI the iOS runtime is pinned and the uploaded binary is a simulator `.app` or an APK.
