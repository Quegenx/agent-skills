# React Native and Expo with Maestro

Maestro is a declarative YAML mobile end-to-end framework with automatic waiting and built-in retry; the source calls it more stable than Detox or Appium for React Native apps. Every test waits for a readiness marker that says auth has loaded and handles either auth state, because on iOS `clearState` does not clear the Keychain. Porting Maestro flows to the `e2e` runner's mobile engine is SUITE-MIGRATION.md.

A Flutter app: [FLUTTER.md](FLUTTER.md) (Semantics identifiers instead of testIDs, Flutter Web, Maestro vs Patrol vs e2e).

**Contents:** [Setup and running](#setup-and-running) · [Selectors](#selectors) · [Auth pre-flight and adaptive flows](#auth-pre-flight-and-adaptive-flows) · [Patterns](#patterns) · [Sign-in by email code](#sign-in-by-email-code) · [Gotchas](#gotchas) · [Structure](#structure) · [Android](#android) · [CI](#ci) · [Maestro MCP](#maestro-mcp) · [Common errors](#common-errors) · [Prove it](#prove-it)

## Setup and running

- **Install:** `curl -Ls "https://get.maestro.mobile.dev" | bash`; `brew install openjdk@17`; `export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`.
- **Minimal flow:**

```yaml
appId: com.myapp
---
- launchApp
- tapOn: { id: "my-button" }
- assertVisible: "Expected Text"
```

- **Run:** `maestro test <file>`, `--debug`, `maestro studio`, `maestro record`, `maestro hierarchy`. Screenshots land in `~/.maestro/tests/{timestamp}/`.

## Selectors

| Context | Selector | Why |
|---|---|---|
| Multi-language / i18n | `id:` (testID) | stable across translations |
| Single language | text | readable, self-documenting |
| Agent-maintained | either; ask the developer | |
| System dialogs | text, always | native alerts have no testID |

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

- **Tags** in the flow header (`ci`, `smoke`, `wip`); `maestro test --include-tags ci`, `--exclude-tags wip`.
- **Docker works for Android only** (`FROM openjdk:17-slim`); iOS needs macOS, so use Maestro Cloud.
- **From the CLI:** `maestro cloud --api-key $MAESTRO_API_KEY --app-file ./app-release.apk [--include-tags smoke] .maestro/`.

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

Each new flow meets the checklist: a unique test email; a selector strategy chosen; state properties used; relative selectors, not index; the auth readiness check and any reproduced platform workaround; both auth states handled; native alerts dismissed after mutations; UI deadlines plus response-ordering evidence for any optimistic claim; sub-flows; descriptive screenshots; a header comment with prerequisites; a row in the README test table; the mock server if it depends on the backend; CI tags. Then it passes with `maestro test <file>` and its two screenshots show the initial and final states.
