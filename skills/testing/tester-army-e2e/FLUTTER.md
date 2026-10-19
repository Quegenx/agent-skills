# Flutter with tester-army/e2e

Flutter integration for the tester-army/e2e runner and `@e2e-dev/mobile`, drawn from its mobile-engine docs and Flutter example. For identifier and merged-node instrumentation, use this runner's [Flutter example below](#selectors) and its exposed device observation; another runner's selector guide is not required. [tester-army/e2e, Flutter example] Neither Patrol nor Maestro must be installed to use this runner.

## How the runner sees Flutter

[tester-army/e2e, mobile engine and Flutter example]

- **e2e** runs on iOS simulators, Android emulators and connected phones through callstack `agent-device`, with the same `agent`, `screen` and `expect` APIs as browser tests. The engine's `observe` is "The accessibility tree with rects", and the node's `testId` is the accessibility identifier (iOS) or resource id (Android). Flutter reports the id the app set, unprefixed, so a test names a view by that id on both platforms.
- **Canvas screens in e2e:** the agent reads the semantic tree and asks for screenshots when it needs them; "A screen with no listed interactive nodes, such as a canvas, opens with a screenshot", and point tools (`tap_at`, `type_at`) reach controls absent from the tree.
- **e2e has no `maestro hierarchy` or Studio equivalent yet:** `npx e2e mcp` gives a coding agent a live device session, and `device.locator` takes `agent-device` selectors.

## Selectors

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

## Setup and running with e2e

[tester-army/e2e, Flutter example]

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

Shared e2e action/expectation deadlines, mobile stability windows, cold-start limits and non-retried actions are in [runner configuration](RUNNER-SETUP.md#config) and [Mobile targets](RUNNER-SETUP.md#mobile-targets). [tester-army/e2e, mobile engine]

- **Maestro waits in e2e terms:** `retryTapIfNoChange` / `waitToSettleTimeoutMs` become engine-wide `mobile({ settle, transition })`; `waitForAnimationToEnd` becomes "an assertion on the settled state"; `extendedWaitUntil` becomes `.toBeVisible({ timeout })`.

## Scrolling

Use the [e2e mobile scrolling and swipe-direction contract](RUNNER-SETUP.md#mobile-targets). This API is not redefined as a Flutter-specific operation. [tester-army/e2e, mobile engine]

## Text input and the keyboard

The runner's input and keyboard operations are [defined here](RUNNER-SETUP.md#mobile-targets). [tester-army/e2e, mobile engine]

- **Secrets in e2e:** `type_secret` and `screen.getByLabel(...).fill(secret)` fill declared secrets into secure fields, and no screenshots are sent after a secret fill.

## Permissions and native dialogs

Use [e2e pre-launch permissions and alerts](RUNNER-SETUP.md#mobile-targets). Flutter does not change that runner contract. [tester-army/e2e, mobile engine]

## Known limitations and issues

[tester-army/e2e, mobile engine]

- The iOS runner can wedge on heavy or animating screens: `npx agent-device daemon stop`, then `xcrun simctl shutdown <udid> && xcrun simctl boot <udid>`.
- Its other listed device limitations are React Native or Compose specific.

## CI

Shared platform prerequisites, runtime pinning, installation/run steps and hosted-device distinctions are in [Mobile targets](RUNNER-SETUP.md#mobile-targets). GitHub Actions and PR lifecycle examples are excluded by owner scope. [tester-army/e2e, mobile engine; owner scope]

## Prove it

The suite builds and installs the app first, starts each test with `app.open()`, passes `npm run test:e2e:android` and `test:e2e:ios` on its selected targets, and pins every `agent.act` with a model-free `expect`. Identifiers used by the test appear in the exposed Flutter semantics tree; buttons follow the shared `MergeSemantics` example. In CI the iOS runtime is pinned and the installed binary is a simulator `.app` or an APK. Report targets not exercised as unverified. [tester-army/e2e, Flutter example and mobile engine]
