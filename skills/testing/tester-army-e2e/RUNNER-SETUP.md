# Runner setup, running and CI

The specifics below are the `e2e` runner's. Prefer letting the runner start the app under test: it probes it for readiness, logs it to a file when told to, and tears it down on every exit path. [tester-army/e2e, runner setup]

**Contents:** [Install](#install) · [Config](#config) · [The app under test](#the-app-under-test) · [Browsers](#browsers) · [Mobile targets](#mobile-targets) · [Environment variables](#environment-variables) · [Running](#running) · [Output and reports](#output-and-reports) · [Exit codes and signals](#exit-codes-and-signals) · [CI](#ci) · [Prove it](#prove-it)

## Install

- **Requirements:** Node.js 24.8+, or 22.22.3+ on Node 22. Config and tests load as ESM whatever `package.json` `type` says; never `require` or `module.exports`. `./x.js` or `./x` loads `x.ts`; the nearest `tsconfig.json` `paths` and `baseUrl` apply. Decorators need `experimentalDecorators`; CommonJS TypeScript goes in `.cts`.
- **Scaffold:** `npx e2e init` (or `pnpm dlx e2e init`; `npx e2e init my-app` into a new directory). The wizard needs a terminal and exits 2 without one; from an agent shell use `npx e2e init --yes`. `--yes` means the web engine (Playwright) and Vercel AI Gateway, installs the skill in `.agents/skills/` (with a `.claude/skills/e2e` symlink), registers MCP in `.mcp.json` and `.cursor/mcp.json`, and skips installing dependencies. Per-question flags: `--engine`, `--gateway`, `--endpoint`, `--skills`, `--mcp` (comma list or `none`), `--install`. Neither registers MCP for Codex.
- **What init writes:** dependencies and a `test:e2e` script, `e2e.config.ts`, `tests/example.e2e.ts`, `.gitignore` entries. Re-run it after upgrading; a re-run preserves MCP env and client settings and repairs the launch command.
- **Manual install:** `npm install --save-dev e2e @e2e-dev/web ai@^7` (`ai` only for `agent.*`).

## Config

```ts
// e2e.config.ts
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { gateway } from 'ai';
export default {
  targets: [{ engine: web(), app: { url: 'http://127.0.0.1:3000',
    command: { executable: 'pnpm', args: ['dev'], log: '.e2e/logs/app.log' } } }],
  agents: { default: { model: gateway('<provider/model id>'),
    system: 'You are a thorough QA agent. Verify every outcome on screen.' } },
} satisfies E2EConfig;
```

- **Shape:** `export default { ... } satisfies E2EConfig`; unknown keys are `INVALID_CONFIG`; `targets` is required. A UI target is `{ engine: web(), app: { url, command } }`; a tools-only target omits `engine` and sets `platform`.
- **Foreign keys from other runners** (`app`, `webServer`, `use`, `projects`, `baseURL` at the top level) are `INVALID_CONFIG`; an import of the removed `defineConfig` is `CONFIG_LOAD_FAILED`.

| Key | Default | Notes |
|---|---|---|
| `tests` | `'tests/**/*.e2e.ts'` | `*`, `?`, whole `**`, leading `!` excludes. Braces, classes, extglobs, `..`, absolute paths and wildcard-free excludes are `INVALID_GLOB`; only exclusions is `INVALID_CONFIG`; symlinks not followed |
| `timeout` | 120000 | per attempt; the default `agent.act` deadline |
| `launchTimeout` | 60000 | engine init plus attempt start |
| `actionTimeout` | 30000 | each locator action or engine operation |
| `assertionTimeout` | 5000 | `expect` polling |
| `cleanupTimeout` | 30000 | each `afterEach` or teardown |
| `retries` | 0, 1 in CI | 0 to 10 |
| `workers` | half the cores, 1 in CI | capped by the engine |
| `reporters` | `['list']` | `list`, `json`, `junit`, `markdown`, or objects; `json` excludes `list` |
| `cache` | `'read-write'` | `'read-only'`, `'off'`, or `{ mode, store, dir, strict }`; CI demotes a defaulted mode to read-only |
| `credentials` | `{}` | `{ username, password }`; password 6+ code points, or a function |
| `secrets` | `{}` | a namespace separate from credentials |
| `output` | `'.e2e'` | inside the project root; never the cache directory |
| `trace` | `'retain-on-failure'` | `off`, `on`, `retain-on-failure`, `on-first-retry`, `on-all-retries` |
| `video` | `'off'` | same modes; precedence test > `--video` > target > config |
| `projectId` | package name | report and cache identity |
| `failOnSkippedFailure` | false | |

- **The runner reads no `APP_URL` and loads no `.env`:** put `process.loadEnvFile('.env')` at the top of the config.

## The app under test

- **Let the runner start the app** rather than a hand-started server: it spawns `command`, polls `readyUrl` until it answers 200 to 499 within `startupTimeout` (default 60 s), and stops it on end, failure or interrupt (`shutdownTimeout` default 10 s). Never ready is `APP_UNREACHABLE`.
- **Log the server to a file:** output is discarded unless `log` names a file under an ignored directory like `.e2e/logs/`. Without it a server dying on boot is invisible.
- **`app` keys:** `url` (required on web; a missing scheme becomes `https://`, `http://` for loopback), `bundleId`, `appPath`, `launchArguments`, `permissions` (`grant` / `deny` / `reset`), `command` `{ executable, args, cwd, env, inheritEnv, startupTimeout, shutdownTimeout, log, reuseExisting }` (`{port}` expands), `readyUrl`, `environment` (`test` / `staging` / `production`), `identity` (a stable key for preview URLs).
- **The child environment is scrubbed:** only `PATH`, `HOME`, temp variables (and `SystemRoot` / `COMSPEC` on Windows) plus `command.env`. Pass more with `env` or `inheritEnv: ['DATABASE_URL', 'STRIPE_*']`; model keys and `E2E_USER_*` are never inherited unless matched.
- **Already running:** a `url` that answers before the spawn is `APP_ALREADY_RUNNING`; `reuseExisting: true` attaches instead (ignored in CI). `executable` resolves on `PATH`, never through a shell: name the server itself, not a wrapper script.
- **A free port per run:** `http://127.0.0.1:0` (never `localhost:0`) takes a free port, passed as `{port}` (`args: ['dev', '--port', '{port}']`); tests read `app.baseUrl`. Port 0 without a command, or with `reuseExisting`, is `INVALID_CONFIG`.
- **No `services` key:** start dependencies before the run, or have `app.command` run a script that brings them up and then serves the app.
- **Next.js 16:** `next dev` blocks cross-origin dev resources, so a target on `127.0.0.1` or `[::1]` while the dev server identifies as `localhost` never hydrates. Add the host to `allowedDevOrigins` in `next.config.ts`.

## Browsers

- **Install:** `@e2e-dev/web`, which pins `playwright-core` exactly; do not add `playwright`. In CI: `npx @e2e-dev/web install chromium --with-deps` (pnpm: `pnpm exec e2e-web install chromium --with-deps`).
- **`web()` options:** `browser` (`chromium` default, `firefox`, `webkit`, or a hosted `BrowserProvider`: `kernel()` from `@e2e-dev/kernel`, `smol()` from `@e2e-dev/smol`, `lightpanda()` from `@e2e-dev/lightpanda`) with scope `worker` or `attempt`; `viewport` (default 1280x720, `null` follows the window); `connect: { cdpEndpoint }` (resolvers `(signal) => url`); `headers` (for example Vercel `x-vercel-protection-bypass`, ngrok `ngrok-skip-browser-warning`; setting headers disables the HTTP cache and service workers); `basicAuth`; `userAgent`; `locale`, `timezoneId`; `colorScheme`, `reducedMotion`; `initScripts`; `testIdAttribute` (default `data-testid`); `screencast { size, quality 0-100 }`.
- **Two browsers, one app:** targets `chromium` and `mobile-webkit` (`web({ browser: 'webkit', viewport: { width: 390, height: 844 } })`).

## Mobile targets

[tester-army/e2e, mobile engine and Flutter example]

- **Engine:** `@e2e-dev/mobile` (pins `agent-device` exactly), driving through callstack `agent-device`. Needs Xcode plus a simulator runtime, or the Android SDK plus an emulator; a phone needs Developer Mode plus runner signing, or adb USB debugging. Run `npx agent-device doctor` once; name a phone by its `npx agent-device devices` name. On iPhone, device settings and the clipboard are simulator-only.
- **Config:** `mobile({ platform: 'ios' })`, `app: { bundleId }`, `workers: 1`, `tools: mobileTools(iphone)` from `@e2e-dev/mobile/tools`.
- **The engine installs nothing:** a fixture calls `device.installApp()` once per device. `launchArguments` and `permissions` ride every fresh launch.
- **Expo dev build on the iOS simulator:** `launchArguments: ['--initialUrl', 'http://localhost:8081', '-EXDevMenuShowsAtLaunch', 'NO', '-EXDevMenuIsOnboardingFinished', 'YES', '-EXDevMenuShowFloatingActionButton', 'NO']`, `app.command` `npx expo start --port 8081`, `readyUrl: 'http://localhost:8081/status'`.
- **One worker per device.** No `device` means every booted simulator or emulator plus connected phones, up to `workers`; one `device` is one worker; a list is an explicit pool. Two sessions on one device fight: one target per device for parallel work.
- **Hosted devices:** `easSimulators({ buildId })` from `@e2e-dev/eas` (`EXPO_TOKEN`; session cap 40 min on the standard plan), `limrun()` from `@e2e-dev/limrun` (`LIMRUN_API_KEY`; iOS keyboard actions are `UNSUPPORTED_CAPABILITY`), `testmu({ device, osVersion, app })` from `@e2e-dev/testmu` (`LT_USERNAME`, `LT_ACCESS_KEY`).
- **Timing:** `transition` (default 500 ms) for a control that appeared or moved; `settle` (default 150 ms) is the stability window after a tap, fill, scroll or back; `settle: false` skips it. The Flutter guide explains the platform distinction: "iOS reports the final frame at once, Android the frame in flight".
- **Network:** `setNetwork('offline')` and `setAirplaneMode(true)` are Android only, and `setNetwork('offline')` turns off Wi-Fi only. An offline test uses `setAirplaneMode(true)` (Android 11+) under `platforms: ['android']` and turns it off in `afterEach`.
- **Unsupported on devices:** `selectOption`, `setInputFiles`, `scrollIntoView`, `secondaryTap`, `modifiers` (`UNSUPPORTED_CAPABILITY`); no `test.setup` or `session`, so sign in per test or seed the app.
- **React Native on iOS:** checkbox and radio state come from the accessibility value; a tab is `other` with `selected` (query it by test id or label); a plain `View` is a leaf (scope to the `ScrollView` or give the children test ids).

- **e2e matching:** `getByTestId(id, { visible? })` reads the accessibility identifier on iOS and the resource id on Android. A string matches the whole id, case included, and a RegExp tests it; on Android the `<package>:id/` prefix may be left off. Several matches fail with `LOCATOR_AMBIGUOUS`. It is listed as "Last resort" after role, label and text queries. `below`, `above`, `leftOf`, `rightOf` and `containsDescendants` have no port. "`placeholder` is the only attribute a device node has."

- **Android cold start in e2e:** locator actions and `expect` wait through "insufficient foreground app content", but immediate reads (`count()`, `isVisible()`) see no matches, so `not.toBeVisible()` can pass while the screen is unreadable.

- **A timed-out action is not retried in e2e:** a tap, fill or swipe that outlives its timeout fails with `ACTION_FAILED`, since "the input may have landed".

- **e2e `screen.scrollUntilVisible(target, { direction, momentum, timeout })`** defaults `'down'`, `'slow'`, `30000`. On a locator it scrolls that node: `await screen.getByTestId('feed').scrollUntilVisible(row);`.

- **Swipe direction differs:** e2e's `screen.swipe({ direction: 'down' })` names the content's direction, Maestro names the finger's.

- **e2e equivalents:** `inputText` is `screen.getByTestId('field').fill('text')`, `eraseText` is `.clear()`, `hideKeyboard` is `device.dismissKeyboard()`, `pressKey: Enter` is `.press('Enter')`. `dismissKeyboard()` uses the keyboard's dismiss key where it has one (Android, iPad), else a short drag at the screen centre, and fails with `UNSUPPORTED_CAPABILITY` if the keyboard stays.

- **e2e sets permissions before launch** "so no system prompt appears": `app.permissions` (`{ camera: 'grant', notifications: 'deny', location: 'reset' }`), or `device.setPermission(name, 'grant' | 'deny' | 'reset')`, one per call, before `app.open()`. There is no `all`, and nothing is granted unless named. `deny` answers no silently on iOS and on Android revokes, so the OS asks again.

- **A visible system alert in e2e:** `device.alert('accept' | 'dismiss')`; the agent gets an `alert` tool through `mobileTools(...)`.

- **iOS double tap:** `doubleTap()` sends two taps about 285 ms apart; give gesture detectors 350 ms or more. [tester-army/e2e, mobile engine]

- **e2e, one job per platform:** iOS on macOS with a Release simulator `.app` (no signing) and a booted simulator; Android on Linux with KVM, a Release `.apk` and a booted emulator. Hosted Apple Silicon Macs can't run the Android emulator.

- **Pin the iOS runtime in e2e CI:** "the accessibility tree changes between iOS releases". Create the simulator on a named runtime and boot it by UDID; cache `~/.agent-device` (the XCUITest runner is built there); commit the replay cache so local recordings replay in CI.

- **e2e run steps:** `xcrun simctl install booted path/to/MyApp.app` then `npx e2e run --target ios --reporter list,junit`; `adb install -r path/to/app.apk` then `npx e2e run --target android --reporter list,junit`.

- **Hosted provider distinction:** the EAS `maestro` job type runs Maestro flows, not the e2e runner. The hosted-device adapters are listed above; the source also permits a custom `DeviceProvider`. [tester-army/e2e, mobile engine]

## Environment variables

- **`E2E_USER_<NAME>_USERNAME` / `_PASSWORD`** override credentials (`<NAME>` uppercased, any character outside `[A-Z0-9]` becomes `_`); **`E2E_SECRET_<NAME>`** sets a secret. Colliding names (`svc-a` and `svc_a`) are `INVALID_CONFIG`.
- **Others:** `CI`; `E2E_TELEMETRY_DISABLED`, `DO_NOT_TRACK`, `E2E_TELEMETRY_DEBUG=1`; `E2E_CACHE_DIR`.

## Running

- **Commands:** `npx e2e run | explore | list | init | guide [topic] | cache | login | logout | models | mcp | feedback | telemetry`.
- **`run` flags:** `[files...]` (narrow the glob, never bypass it; a bare name like `signup`, or `file:line`), `--config`, `--target`, `--tag` (`--tag-mode all`), `--exclude-tag`, `--grep` / `--grep-invert`, `--last-failed` (`NO_LAST_RUN`, exit 2, without a report), `--shard i/n`, `--headed`, `--agent`, `--workers` 1 to 1024, `--retries` 0 to 10, `--max-failures`, `--max-duration` (`RUN_TIMEOUT`), `--repeat-each n` (add `--no-cache`), `--reporter`, `--output`, `--no-cache`, `--strict-cache`, `-u`, `-w` (refused in CI and with json), `--pass-with-no-tests`, `--debug`, `--ai-trace`, `--trace [mode]`, `--video [mode]` (greedy: write `--video=<mode>` or put files first).
- **Loops:** `npx e2e run --last-failed` after a red run; `npx e2e run --shard 2/3`; `CI=1 npx e2e run` for CI defaults locally.
- **`list`** prints `file › title [target] #tag` and starts no app or engine (`--reporter json` for scripts). Programmatic: `import { list, run } from 'e2e/runner'`; overlapping calls reject with `RUNNER_BUSY`.
- **pnpm passes `--` literally:** `pnpm test:e2e -- --headed` exits 2. Write `pnpm test:e2e --headed` or `pnpm exec e2e run --headed`; with npm, `npm exec -- e2e run --headed`.

## Output and reports

- **`.e2e/` is runner output:** read it, never edit it. It holds `report.json`, `junit.xml`, `summary.md`, `ai-trace.json`, `sessions/`, and `results/<test>/trace.md` with `attempt-<n>/`. `results/` is cleared once a run's tests start; `--last-failed` writes under `rerun-<n>/`.
- **`report.json` is for scripts (jq), not reading:** `run.status`, `run.exitCode`, `run.errors[]`, `run.results[]` (`titlePath`, `file`, `source`, `tags`, `agent`, `repeat`, `selected`, `status`, `attempts[].steps[]`, `artifacts[]`, `error`), and `run.summary` (passed, failed, interrupted, flaky, skipped).
- **`markdown` reporter** writes `summary.md` for a handoff. [tester-army/e2e, reporting]

## Exit codes and signals

| Exit | Meaning |
|---|---|
| 0 | all passed, flaky or skipped |
| 1 | a test or setup failed or timed out |
| 2 | CLI, config, collection, credential, model config or policy |
| 3 | engine, app process, model provider, artifact or cleanup |
| 4 | internal |
| 130 | external signal |

- **The highest code wins.** Exit 2 is deterministic: never retry it. Only exit 3 is worth a job-level retry.
- **Signals:** the first SIGINT or SIGTERM interrupts and writes the report; the second forces teardown; the third kills the app's process groups and exits 130.

## CI

- **CI mode** when `CI` is set (not `0` or `false`): retries 1, workers 1, `test.only` rejected, cache read-only unless set explicitly, `reuseExisting` ignored.
- **Install browsers as their own step** so the download stays out of the launch timeout.
- **Upload artifacts unless cancelled,** so a test that failed and then passed on retry keeps its evidence.
- **Start the app through the runner** so teardown happens on every exit path; pass the model key from secrets; commit the cache for replays.

## Prove it

Setup is done when `npx e2e run tests/example.e2e.ts` passes, `package.json` has `"test:e2e": "e2e run"`, `.gitignore` lists the `.e2e/` outputs (drop the `.e2e/cache/` line to commit replays), and the authorized CI run covers the whole suite, agent steps included. `CI=1 npx e2e run` runs the CI defaults locally.
