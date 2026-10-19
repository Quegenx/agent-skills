# Maestro for React Native, Expo and Flutter

Maestro is a declarative YAML mobile end-to-end framework with automatic waiting and built-in retry; the source calls it more stable than Detox or Appium for React Native apps. In the source React Native/Expo auth suite, every test waits for a readiness marker that says auth has loaded and handles either auth state, because on iOS `clearState` does not clear the Keychain. Porting to tester-army/e2e is an optional, separately selected migration: [tester-army-e2e migration guide](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/SUITE-MIGRATION.md). This guide is not a Maestro-to-Patrol migration recipe.

Common Maestro setup, selectors, waiting, scrolling, text input and permissions live here. Flutter-specific builds, launch arguments and semantics remain in [FLUTTER.md](FLUTTER.md). Sources: [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md] and [mobile-dev-inc/maestro-docs, Flutter and command references].

**Contents:** [Setup and running](#setup-and-running) · [Selectors](#selectors) · [Auth pre-flight and adaptive flows](#auth-pre-flight-and-adaptive-flows) · [Patterns](#patterns) · [Waiting and scrolling](#waiting-and-scrolling) · [Text input and the keyboard](#text-input-and-the-keyboard) · [Permissions and native dialogs](#permissions-and-native-dialogs) · [Sign-in by email code](#sign-in-by-email-code) · [Gotchas](#gotchas) · [Known limitations](#known-limitations) · [Structure](#structure) · [Android](#android) · [CI](#ci) · [Maestro MCP](#maestro-mcp) · [Common errors](#common-errors) · [Prove it](#prove-it)

## Setup and running

[tovimx/maestro-mobile-testing-skill; mobile-dev-inc/maestro-docs, Flutter and CLI guidance]

- **Install:** Java 17 or higher with `JAVA_HOME` set (the known-issues page recommends 17 or 21). `curl -fsSL "https://get.maestro.mobile.dev" | bash`, or Homebrew: `brew tap mobile-dev-inc/tap`, `brew trust --formula mobile-dev-inc/tap/maestro`, `brew install mobile-dev-inc/tap/maestro`. Verify with `maestro --help`.
- **Source Java 17 setup on Apple Silicon:** `brew install openjdk@17`; `export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`. [tovimx/maestro-mobile-testing-skill, setup]
- **Minimal flow:**

```yaml
appId: com.myapp
---
- launchApp
- tapOn: { id: "my-button" }
- assertVisible: "Expected Text"
```

- **Run:** `maestro test <file>`, `--debug`, `maestro studio`, `maestro record`, `maestro hierarchy`. Screenshots land in `~/.maestro/tests/{timestamp}/`.

- **iOS:** Xcode Simulators, Xcode Command Line Tools (`xcode-select --install`), the app targeted by Bundle ID. If Xcode was installed without opening it, run `xcodebuild -runFirstLaunch` or no simulators appear.

- **Android:** ADB, auto-detecting running emulators or physical devices with USB Debugging on; the flow targets the package (`appId`). An emulator on API 31 or higher is recommended. "Maestro assumes the application is already installed on the target device/emulator before the test begins."

- **CLI flags:** global `--device` / `--udid` and `-p` / `--platform` (`--platform=ios`). `test` takes `--format` (`JUNIT`, `HTML`, `NOOP`), `--output`, `-s` / `--shards`, `--include-tags`, `--exclude-tags`, `-c` / `--continuous`. Subcommands include `start-device`, `list-devices`, `record`, `mcp`.

- **`launchApp`** stops the app first by default (`stopApp: true`); `clearState: true` clears data; `clearKeychain: true` clears the whole iOS keychain.

- **Maestro Studio** (desktop, needs the Android SDK and/or Xcode): connect a device, right-click an element to add a YAML command, take autocomplete's real selectors from the device screen, run step by step. Downloads: `https://studio.maestro.dev/MaestroStudio.dmg` (macOS), `https://studio.maestro.dev/MaestroStudio.exe` (Windows).

## Selectors

[tovimx/maestro-mobile-testing-skill; mobile-dev-inc/maestro-docs, selectors]

| Context | Selector | Why |
|---|---|---|
| Multi-language / i18n | `id:` (testID) | stable across translations |
| Single language | text | readable, self-documenting |
| Agent-maintained | either; ask the developer | |
| System dialogs | text, always | native alerts have no testID |

- **Maestro matching:** `text` and `id` are regular expressions by default (escape `$` and `[` with `\`), case-insensitive, and tap the first match; `index` is 0-based and picks one of several. `id` is the Resource ID on Android and `accessibilityIdentifier` on iOS. Relative selectors: `below`, `above`, `leftOf`, `rightOf`, `containsChild`, `childOf`, `containsDescendants`.

- **Prefer testIDs when text is dynamic** or several elements share the same text. React Native: `testID="submit-button"`.
- **Name testIDs `{component}-{action/type}[-{variant}]`:** `auth-prompt-login-button`, `product-card-{id}`, `otp-input-0`, `tab-home`, `dashboard-loading`.
- **State properties** `enabled`, `checked`, `selected`, `focused` work on `tapOn`, `assertVisible` and `extendedWaitUntil`.
- **Relative selectors over `index:`,** which is fragile: `below`, `above`, `leftOf`, `rightOf`, `childOf`, `containsChild`, `containsDescendants`. For example `tapOn: { text: "Add to Basket", below: { text: "Awesome Shoes" } }`.

## Auth pre-flight and adaptive flows

- **Render a readiness marker** only when auth loading completes: a marker exposed to the tested native hierarchy. The source uses a zero-size View; first confirm the installed platform actually exposes that marker, rather than treating its existence in JSX as proof of visibility. [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md]
- **Auth readiness:** launch, then wait for the exposed `auth-loaded` marker. The source adds a 100 ms downward swipe for a particular iOS cold-boot XCTest crash; use that workaround only when that symptom is reproduced, rather than adding a gesture to every platform. [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md]
- **Adaptive tests** work in either auth state: `runFlow` with `when: visible: "Sign In"` vs `when: visible: { id: "tab-home" }`.
- **Auth-aware tab bars differ by state:** assert only the tabs present in both, or use `when:`.

## Patterns

- **Optimistic updates:** a short timeout establishes only a UI deadline. To claim the UI changed before the server answered, retain evidence of response ordering; verify persistence separately. The source treated 3 to 5 second UI deadlines as proof of optimistic behavior. [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md]
- **Native `Alert.alert()`:** wait for the expected state first, then `tapOn: { text: "OK", optional: true }`, then a 300 ms swipe to let the animation finish.
- **Sub-flows** live in `flows/` and run with `runFlow: { file: ... }`.
- **Expo deep links use the scheme from app.json** (`myapp://profile/settings`), not the bundle id; unregistered routes fail silently.
- **Platform branches:** `runFlow: { when: { platform: ios }, file: ... }`.
- **Variables:** an `env:` block in the header, used as `${TEST_EMAIL}`.
- **`optional: true` only for truly optional actions:** misused, it makes a test pass while nothing happened.

## Waiting and scrolling

[mobile-dev-inc/maestro-docs, Flutter and command references]

- **Wait on state, not time.** Maestro waits for the screen to settle automatically, no `sleep()` needed; for something expected to appear or disappear soon, use an assertion. `assertVisible` / `assertNotVisible` poll until the element appears or the timer runs out.

- **Maestro defaults:** assertions 7 seconds; longer with `extendedWaitUntil`:

```yaml
- extendedWaitUntil:
    visible: "My text that should be visible"
    timeout: 10000
```

- **`waitForAnimationToEnd`** defaults to 15000 ms, and if the animation is still running at the timeout "the command succeeds and execution continues".

- **Ghost taps in Maestro:** add `retryTapIfNoChange: true`, which retries "if the UI hierarchy does not change after the initial tap". `waitToSettleTimeoutMs` is a best-effort settle timeout per tap.

- **Maestro `scrollUntilVisible`** defaults: `direction` `DOWN`, `timeout` `20000` ms, `speed` `40` (0-100), `visibilityPercentage` `100`, `centerElement` `false`.

```yaml
- scrollUntilVisible:
    element:
      id: ".*some_view_id"
    direction: DOWN
```

- **Partial scroll areas:** Maestro swipes from the screen centre to 10% from the edge, so in a bottom sheet or small scrolling widget the swipe may miss; write a custom scroll loop.

## Text input and the keyboard

[mobile-dev-inc/maestro-docs, inputText and known issues]

- **Maestro `inputText`** "works even if no text field is focused"; in practice tap the field first (`tapOn: { id: MyTextInput }`, then `inputText`). On Android it supports ASCII only (#146).

- **iOS simulator secure fields:** `inputText` fails on `secureTextEntry` fields because of Password AutoFill. Turn off AutoFill Passwords in the simulator's Settings, run the two `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO ...` commands on CI, or use a plain text field in test builds.

- **iOS `hideKeyboard` is flaky in Maestro** (no native API; it scrolls from the screen centre): `tapOn` a non-interactive area instead. On Maestro Cloud it now fails the test if the keyboard stays.

- **Version conflict, Android Unicode:** the [official inputText guide](https://github.com/mobile-dev-inc/maestro-docs/blob/main/api-reference/commands-available/inputtext.md) still documents no Android Unicode input. The [upstream main AndroidDriver](https://github.com/mobile-dev-inc/Maestro/blob/main/maestro-client/src/main/java/maestro/drivers/AndroidDriver.kt) has a non-ASCII route through `inputUnicodeText`. Released and installed support was not established; retain the documented limitation until the selected version is verified. The old Flutter line stated ASCII-only support without this source/version disagreement.

## Permissions and native dialogs

[mobile-dev-inc/maestro-docs, launchApp and setPermissions]

- **Maestro grants all permissions at `launchApp` by default.** Override:

```yaml
- launchApp:
    permissions:
      all: deny
      camera: allow
      location: allow
```

- **Mid-flow, `setPermissions`.** Values `allow`, `deny`, `unset`. On iOS `allow` also dismisses the prompt; iOS notifications show a prompt that Maestro taps **Allow** on, while Android grants silently. iOS extras: `location: always | inuse | never`, `photos: limited`. Some permissions exist on one platform only (`photos`, `motion`, `siri` iOS; `bluetooth`, `phone`, `sms`, `storage` Android), and custom Android permission ids are accepted.

- **Keychain clearing is separate:** `clearState` is not `clearKeychain`; the latter clears all iOS Keychain data and has no effect on Android or Web. Do not add that state-clearing operation as an implicit auth pre-flight. [clearKeychain](https://github.com/mobile-dev-inc/maestro-docs/blob/main/api-reference/commands-available/clearkeychain.md)

## Sign-in by email code

- **Use the actual capture service contract.** Mailpit lists summaries at `GET /api/v1/messages`; fetch the selected message at `GET /api/v1/message/{ID}` to read `Text` or `HTML`. Fetching the message marks it read. MailHog and Ethereal do not share this response schema. The removed source snippet read `data.messages[0].Content.Body` from a universal endpoint. [Mailpit API](https://github.com/axllent/mailpit/blob/develop/_autodocs/endpoints.md), [message structures](https://github.com/axllent/mailpit/blob/develop/internal/storage/structs.go)
- **Match the JavaScript engine.** Current Maestro uses GraalJS with ES6+ support; `let` and `const` are not universally forbidden. Use Maestro's documented `http.get` / `http.post`, `json()` and `output` APIs for these scripts; the source's blanket legacy-language restriction is stale. [Maestro JavaScript](https://github.com/mobile-dev-inc/maestro-docs/blob/main/flows/javascript/javascript-overview.md), [HTTP requests](https://github.com/mobile-dev-inc/maestro-docs/blob/main/flows/javascript/make-http-requests.md)

- **OTP inputs with auto-focus:** split the code into digits in the script, then tap each `otp-input-N` and `inputText ${output.OTP_N}`.
- **Provider-specific steps** (Supabase with Mailpit, Firebase, Auth0) belong in a project-level skill that extends this one.

## Gotchas

- **`clearState: true` does not clear the iOS Keychain:** `expo-secure-store` tokens persist across `clearState` and reinstalls. Never rely on it for a guest state on iOS; use the `auth-loaded` marker and adaptive flows. On Android `clearState` fully resets.
- **XCTest `kAXErrorInvalidUIElement` crash on iOS cold boot:** the source's post-launch swipe is a symptom-specific workaround; confirm it resolves that installed-platform failure. [tovimx/maestro-mobile-testing-skill, maestro-mobile-testing/SKILL.md]
- **Backend dependency:** without the API server, screens show spinners or empty states because queries fail silently. Start a mock API server serving canned JSON (`npx tsx scripts/mock-api-server.ts &`), which is faster and more deterministic than running the full backend.
- **iOS vs Android:** Maestro runs iOS on the simulator only (no physical devices), Android on emulators and physical devices over ADB; the Keychain and the cold-boot crash are iOS only; ARM emulation is slower on x86.

## Known limitations

[mobile-dev-inc/maestro-docs, known issues]

- iOS lists that paginate in `willDisplayCell` misfires under XCTest, which Maestro uses (a native `UITableView` / `UICollectionView` issue).
- Hardened or MDM Android devices that reject the companion driver APK (`INSTALL_PARSE_FAILED_NO_CERTIFICATES`) are not supported.

## Structure

- **Layout:** `.maestro/` with `README.md` (a quick reference plus the testID inventory), `config.yaml`, `flows/`, `scripts/` and the tests; `scripts/mock-api-server.ts` and `scripts/run-e2e.sh`.
- **Names:** tests `{feature}-{action}.yaml`, sub-flows `{action}-{context}.yaml`, scripts `{verb}-{noun}.js`.
- **Test file template:** a header comment (Tests, Prerequisites), `appId`, `env` (`TEST_EMAIL: maestro-{feature}@example.com`, a source template value rather than a unique-per-run address); STEP 1 launch, pre-flight and `takeScreenshot: 01-initial-state`; STEP 2 the action; STEP 3 verify and `takeScreenshot: 02-final-state`.
- **Orchestration script:** start backend services, seed, start the mock, run the tests, clean up.

## Android

- **Emulator:** `sdkmanager --list | grep system-images`; `avdmanager create avd -n maestro_test -k "system-images;android-34;google_apis;arm64-v8a"`; `emulator -avd maestro_test`.
- **adb:** `adb devices`, `adb shell am start -n com.myapp/.MainActivity`, `adb logcat | grep Maestro`, `adb shell input keyevent 82`.
- **Permission dialogs:** optional taps on `"Allow"` and `"While using the app"`.

## CI

[tovimx/maestro-mobile-testing-skill; mobile-dev-inc/maestro-docs, Cloud and CLI guidance]

- **Tags** in the flow header (`ci`, `smoke`, `wip`); `maestro test --include-tags ci`, `--exclude-tags wip`.
- **Docker works for Android only** (`FROM openjdk:17-slim`); iOS needs macOS, so use Maestro Cloud.
- **Cloud prerequisites:** the official guide requires a Cloud plan, available initially as a trial, and a Maestro account and CLI. Use `--api-key` and `--project-id` to select authentication/project without interactive prompts. [Run tests on Maestro Cloud](https://github.com/mobile-dev-inc/maestro-docs/blob/main/cloud/run-tests-on-maestro-cloud.md)
- **Cloud devices:** default Android API 33 (Android 13) and iOS 16; override with `device-os` / `device-model` (`android-34`, `pixel_6`, `iOS-26-2`, `iPhone-17-Pro`); list with `maestro list-cloud-devices`. From the CLI: `maestro cloud [options] --app-file <app-file> --flows <flow-file-or-directory>`.

- **Official Cloud spelling:** `--app-file` with `--flows` is the [documented CLI form](https://github.com/mobile-dev-inc/maestro-docs/blob/main/cloud/run-tests-on-maestro-cloud.md). The old Flutter example used `--app-binary`. The device defaults above are source values; list available devices for the selected account/version rather than treating those defaults as a current guarantee. [mobile-dev-inc/maestro-docs, Cloud guide]

- **Cloud binaries:** Android APK only (no `.aab`), ARM or multi-arch (x86-only fails), Release and Debug both work. iOS simulator `.app` only: "Do not upload binaries built for physical iOS devices."

- **Local Maestro CLI** is "the primary tool for automated execution in Continuous Integration (CI) systems"; local Android runs "1 device at a time", Cloud parallelises.

## Maestro MCP

- **`maestro mcp` ships with the CLI:** `.mcp.json` `{ "mcpServers": { "maestro": { "command": "maestro", "args": ["mcp"] } } }`. Discover the installed server's tool schema rather than relying on the source's unverified fixed count of 47 tools. [Maestro MCP](https://docs.maestro.dev/getting-started/maestro-mcp)
- **Write, run, fix in one conversation:** write the YAML, run it via MCP, read the failures, fix, re-run.

## Common errors

| Error | Fix |
|---|---|
| "Unable to locate Java Runtime" | set `JAVA_HOME` |
| "Element not found" after a tap | a native alert; add an optional OK tap |
| OTP digits not entering | per-digit testIDs |
| Passes but nothing happened | `optional: true` misused |
| "Assertion is false" | increase the timeout, verify the testID |
| Script output empty | `http.get()`, not `fetch()` |
| Auth inconsistent after `clearState` | the iOS Keychain |
| `kAXError` | the post-launch swipe |
| Spinners or empty screens | start the mock server |
| Android permission blocking | an optional Allow tap |

## Prove it

For the source React Native/Expo auth suite, each new flow meets the checklist: a unique test email; a selector strategy chosen; state properties used; relative selectors, not index; the auth readiness check and any reproduced platform workaround; both auth states handled; native alerts dismissed after mutations; UI deadlines plus response-ordering evidence for any optimistic claim; sub-flows; descriptive screenshots; a header comment with prerequisites; a row in the README test table; the mock server if it depends on the backend; CI tags. Then it passes with `maestro test <file>` and its two screenshots show the initial and final states. Flutter-specific semantics and build acceptance are in [FLUTTER.md](FLUTTER.md#prove-it). [tovimx/maestro-mobile-testing-skill; mobile-dev-inc/maestro-docs]
