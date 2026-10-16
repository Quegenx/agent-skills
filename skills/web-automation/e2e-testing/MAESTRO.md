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

- **Render a readiness marker** only when auth loading completes: a zero-size `<View testID="auth-loaded" style={{ width: 0, height: 0 }} />`.
- **Every test starts the same way:** `launchApp`, a no-op `swipe` DOWN of 100 ms (works around the iOS cold-boot XCTest crash), then `extendedWaitUntil` visible id `auth-loaded` with `timeout: 15000`.
- **Adaptive tests** work in either auth state: `runFlow` with `when: visible: "Sign In"` vs `when: visible: { id: "tab-home" }`.
- **Auth-aware tab bars differ by state:** assert only the tabs present in both, or use `when:`.

## Patterns

- **Optimistic updates:** short timeouts prove the UI changed before the server answered: a button flip under 3 s (`extendedWaitUntil ... timeout: 3000`), a list update under 5 s, and a redo under 3 s proves persistence.
- **Native `Alert.alert()`:** wait for the expected state first, then `tapOn: { text: "OK", optional: true }`, then a 300 ms swipe to let the animation finish.
- **Sub-flows** live in `flows/` and run with `runFlow: { file: ... }`.
- **Expo deep links use the scheme from app.json** (`myapp://profile/settings`), not the bundle id; unregistered routes fail silently.
- **Platform branches:** `runFlow: { when: { platform: ios }, file: ... }`.
- **Variables:** an `env:` block in the header, used as `${TEST_EMAIL}`.
- **`optional: true` only for truly optional actions:** misused, it makes a test pass while nothing happened.

## Sign-in by email code

- **Architecture:** the test triggers the auth provider, which sends to an email capture service (Mailpit, MailHog, Ethereal); the test reads `GET /api/v1/messages` over REST and extracts the code.
- **Scripts run in GraalJS:** no `async/await`, no `fetch()`. Use `http.get()` / `http.post()`, `json()`, `output.VAR`, and `var`.

```javascript
// CRITICAL: Maestro uses GraalJS: NO async/await, NO fetch()
var response = http.get(emailServiceUrl + "/api/v1/messages");
if (!response.ok) { throw new Error("Failed to fetch emails: " + response.status); }
var data = json(response.body);
var body = data.messages[0].Content.Body;
var match = body.match(/(\d{6})/);
output.OTP_CODE = match[1];
```

- **OTP inputs with auto-focus:** split the code into digits in the script, then tap each `otp-input-N` and `inputText ${output.OTP_N}`.
- **Provider-specific steps** (Supabase with Mailpit, Firebase, Auth0) belong in a project-level skill that extends this one.

## Gotchas

- **`clearState: true` does not clear the iOS Keychain:** `expo-secure-store` tokens persist across `clearState` and reinstalls. Never rely on it for a guest state on iOS; use the `auth-loaded` marker and adaptive flows. On Android `clearState` fully resets.
- **XCTest `kAXErrorInvalidUIElement` crash on iOS cold boot:** a no-op swipe after `launchApp`.
- **Backend dependency:** without the API server, screens show spinners or empty states because queries fail silently. Start a mock API server serving canned JSON (`npx tsx scripts/mock-api-server.ts &`), which is faster and more deterministic than running the full backend.
- **iOS vs Android:** Maestro runs iOS on the simulator only (no physical devices), Android on emulators and physical devices over ADB; the Keychain and the cold-boot crash are iOS only; ARM emulation is slower on x86.

## Structure

- **Layout:** `.maestro/` with `README.md` (a quick reference plus the testID inventory), `config.yaml`, `flows/`, `scripts/` and the tests; `scripts/mock-api-server.ts` and `scripts/run-e2e.sh`.
- **Names:** tests `{feature}-{action}.yaml`, sub-flows `{action}-{context}.yaml`, scripts `{verb}-{noun}.js`.
- **Test file template:** a header comment (Tests, Prerequisites), `appId`, `env` (`TEST_EMAIL: maestro-{feature}@example.com`); STEP 1 launch, pre-flight and `takeScreenshot: 01-initial-state`; STEP 2 the action; STEP 3 verify and `takeScreenshot: 02-final-state`.
- **Orchestration script:** start backend services, seed, start the mock, run the tests, clean up.

## Android

- **Emulator:** `sdkmanager --list | grep system-images`; `avdmanager create avd -n maestro_test -k "system-images;android-34;google_apis;arm64-v8a"`; `emulator -avd maestro_test`.
- **adb:** `adb devices`, `adb shell am start -n com.myapp/.MainActivity`, `adb logcat | grep Maestro`, `adb shell input keyevent 82`.
- **Permission dialogs:** optional taps on `"Allow"` and `"While using the app"`.

## CI

- **GitHub Actions with Maestro Cloud:** `mobile-dev-inc/action-maestro-cloud@v2` with `api-key: ${{ secrets.MAESTRO_API_KEY }}`, `app-file`, `workspace: .maestro`, `include-tags: ci`; outputs `MAESTRO_CLOUD_CONSOLE_URL`, `MAESTRO_CLOUD_UPLOAD_STATUS`, `MAESTRO_CLOUD_FLOW_RESULTS`. Build the APK with `npx expo prebuild --platform android --no-install`, then `./gradlew assembleRelease`, on Java 17 (temurin).
- **Tags** in the flow header (`ci`, `smoke`, `wip`); `maestro test --include-tags ci`, `--exclude-tags wip`.
- **Docker works for Android only** (`FROM openjdk:17-slim`); iOS needs macOS, so use Maestro Cloud.
- **From the CLI:** `maestro cloud --api-key $MAESTRO_API_KEY --app-file ./app-release.apk [--include-tags smoke] .maestro/`.

## Maestro MCP

- **`maestro mcp` ships with the CLI:** `.mcp.json` `{ "mcpServers": { "maestro": { "command": "maestro", "args": ["mcp"] } } }`. It has 47 tools: tap, swipe, scroll, input, `assertVisible`, `assertWithAI`, `assertNoDefectsWithAI`, lifecycle, device control, `runFlow`, `evalScript`, media.
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

Each new flow meets the checklist: a unique test email; a selector strategy chosen; state properties used; relative selectors, not index; the auth pre-flight and post-launch swipe; both auth states handled; native alerts dismissed after mutations; short optimistic timeouts (3 to 5 s); sub-flows; descriptive screenshots; a header comment with prerequisites; a row in the README test table; the mock server if it depends on the backend; CI tags. Then it passes with `maestro test <file>` and its two screenshots show the initial and final states.
