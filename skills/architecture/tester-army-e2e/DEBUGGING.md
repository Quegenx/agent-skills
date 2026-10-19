# Debugging and flakiness

The commands are the `e2e` runner's. Read the trace page first and fix from what was there (the locator, the expectation or the app), then measure the fix with retries off. [tester-army/e2e, traces and failures]

## Read the trace first

- **The trace page** `.e2e/results/<test>/trace.md` shows: `Look at:`, `Expected:` / `Observed:`, `Asked for:` / `Waited:`, whether every attempt failed alike (a bug, not a flake), each step's landing node, what an assertion read while waiting (`expect gave up after 16 reads in 1.6s: text "0 remaining" (1 match) x16`), the app log (`✗ network error: POST /api/save 500`, up to 50 lines), navigation, the screen diff since the previous step (`unchanged` after an action means it had no visible effect), the cache decision, the agent's last turns, and the accessibility tree at failure.
- **Interpret the poll reads:** one value throughout points at a wrong expectation, a broken app, or an app slower than the timeout; changing values point at a race.
- **Script the report:**

```bash
jq '.run | {status, exitCode, errors}' .e2e/report.json
jq '.run.results[] | select(.selected and .status != "passed") | {titlePath, file, status}' .e2e/report.json
```

- **Artifacts:** `screen-at-failure.txt`, a screenshot per failed attempt, downloads, `video/video.webm` (browser; `video-part<n>.webm` when split), `video/video.mp4` (device), `--debug` transcripts.

## Tools

- **`--headed`** to watch it.
- **`--workers 1 --retries 0`** takes parallelism and retries out of the picture.
- **`--no-cache`** rules out a stale replay.
- **`--debug`** and **`--ai-trace`** for agent steps (AGENT-STEPS.md).
- **`--video=retain-on-failure`**; a step's offset in the video is `step.startedAt` minus the segment's `startedAt`.
- **`command.log`** for the server's output (RUNNER-SETUP.md).
- **`app.screenshot('before-submit')`** before any secret fill.
- **`CI=1 npx e2e run`** reproduces CI defaults locally.

## Flake causes

| Cause | Fix |
|---|---|
| A read caught a value mid-update | use a matcher, which waits for the value to settle |
| Shared data between tests | unique names, `afterEach` cleanup, or a serial group |
| The app was not ready | assert on the element you are about to use, not on the previous page |
| An agent judgment asserting exact phrasing | judge the fact, with a deterministic `expect` beside it |
| Load timing | `retries` masks it; `--workers 1 --headed` shows it |

- **Is it the app?** A deterministic step that fails every run at the same place with the same code is a product bug or a changed screen, not a flake. Reproduce it once headed, then fix the app, or update the locator and expectation together.
- **Blocked agent steps exit 2 or 3 on purpose:** fix the environment, not the test.

## Measure a fix

- **Repeat with retries off:** `npx e2e run <file> --repeat-each 10 --retries 0` (plus `--no-cache` with agent steps). The `Repeats` line reads `0 of 1 test passed all 10 runs` before the fix and `1 of 1 ...` after. Name the repeat count in the task as the proof ("prove it by running the suite at least 30 times in a row").

## Error codes

| Code | Cause and fix |
|---|---|
| `CONFIG_LOAD_FAILED` | the config throws while loading, or imports a missing package, subpath or removed export such as `defineConfig`; install the dependency or fix the quoted import or line |
| `INVALID_CONFIG`, `INVALID_GLOB` | an unknown or foreign key (`app`, `webServer`, `use`, `projects`, `baseURL`), `json` with `list`, or a `tests` glob with braces, classes, an absolute path or no wildcard; the message names the key or glob to write |
| `CONFIG_NOT_FOUND`, `CONFIG_AMBIGUOUS` | a wrong `--config` path, or both `.ts` and `.mts` present; fix the path, keep one |
| `NO_TESTS`, `COLLECTION_ERROR`, `HOOK_FAILED` | the glob, a positional or a filter matched nothing (check `tests`, the `.e2e.ts` suffix, the tag names); an `async` describe body, `test.setup` inside `describe`, an option forbidden in a serial group, or registration outside collection; a `beforeAll` or `afterAll` threw and its scope's tests skip |
| `BROWSER_INSTALL_FAILED`, `LAUNCH_TIMEOUT` | the browser download failed (run the quoted install command, `--with-deps` on bare Linux); engine init or attempt start exceeded `launchTimeout` (60 s default) |
| `APP_UNREACHABLE` | `app.command` never answered `readyUrl` within `startupTimeout`: read the quoted log lines and check the port, `app.url`, `app.command.env`, `startupTimeout`. On a device, a message naming the iOS automation runner means the runner failed: rerun, else `npx agent-device daemon stop` and reboot the simulator |
| `APP_ALREADY_RUNNING` | something already serves `url` when `command` should start; stop it, or `reuseExisting: true` locally |
| `APP_URL_REQUIRED`, `APP_NOT_OPEN` | a navigation on a target without `app.url`; a `screen` call before `app.open()` |
| `LOCATOR_NOT_FOUND` | check the accessible name, `exact: false`, `frameLocator`, `app.open()` first, `--headed` |
| `LOCATOR_AMBIGUOUS` | add `{ name }`, scope to a container, `filter`, `first()`, `{ visible: true }` |
| `ASSERTION_FAILED` | a wrong expectation, or a state that settles later than 5 s; for `agent.assert`, a false judgment. Compare with the report's actual text or the screenshot; `{ timeout }` on the matcher |
| `ASSERTION_INCONCLUSIVE`, `MODEL_OUTPUT_INVALID` | `agent.assert` or `agent.extract` asked about what the screen does not show (reach the right screen first, or `vision: true` when the answer is in pixels); an `extract` or `assert` answer failed the schema after one repair round |
| `ACTION_FAILED` | the element is not actionable (covered, disabled, detached) or an operation timed out; `expect` the condition first, close overlays, check `actionTimeout` |
| `TEST_TIMEOUT` | 120 s per attempt; split the test |
| `STEP_NOT_AWAITED` | the body, an `afterEach` hook or a fixture teardown returned while a step or `expect.poll` still ran; `await` the call the code frame names |
| `MODEL_UNAVAILABLE`, `MODEL_PROVIDER_FAILED` | `agents.<name>.model` holds no AI SDK instance, or GitHub Copilot refuses the configured model to the account; network, 5xx, rate limit, no credits or no response in 120 s after the transport retries (check the credential and quota, retry: exit 3) |
| `REPLAY_STALE` | under `--strict-cache` or `cache.strict`, a committed recording no longer replays (`step.cache.reason` says why); rerun read-write with that knob off and commit the changed entry |
| `STEP_TIMEOUT`, `STEP_BUDGET_EXHAUSTED` | a goal too big or ambiguous, or a slow provider; split the goal, use on-screen wording, add context, or raise `maxSteps` / `maxModelCalls`, the `timeout` or `judgmentTimeout` |
| `CONTEXT_OVERFLOW` | the screen plus step history did not fit the model's context window; lower `maxObservationBytes`, split the step, or pick a larger-window model |
| `POLICY_DENIED` | a non-http(s) URL, a password into a non-password sink, reading a secure field, a screenshot after a secret fill |
| `AUTOMATION_UNSUPPORTED`, `UNSUPPORTED_CAPABILITY` | the step needs an interaction the engine's toolset lacks (drag on a device); a fixture the engine lacks (`browser` on a device), `schema` or `vision` on `act`, or an action the surface lacks |
| `SESSION_*`, `AUTH_CREDENTIAL_*`, `SECRET_UNAVAILABLE` | `session: 'x'` with no setup saving `x`, a setup that skipped a declared name, or a stored session from another run or app, expired or corrupt; an undeclared credential name, or the app rejected a configured credential; `secrets.get('x')` for an undeclared name |
| `ONLY_IN_CI` | `test.only` reached CI |

## Failure code versus cause

The bug-bash source reserves confirmed findings for a repro assertion that fails with ASSERTION_FAILED. Its broader claim that every other failure means the test is wrong is not a cause diagnosis. The migration source also treats required actions as checks. Keep the assertion-confirmed label, and investigate action/locator/timeout failures against the intended behavior, environment, trace and screen; report an unresolved failure as such rather than dismissing it. [tester-army/e2e, e2e bug-bash workflow; migrate-to-e2e/SKILL.md]

## Driving the live app over MCP

- **`e2e mcp` (stdio) serves the live app to a coding agent:** look before writing a test, check a locator before committing it. Running tests and reading failures stay on the CLI. No model is needed for the deterministic tools.
- **Register:** `claude mcp add --scope project e2e -- npx e2e mcp`; in `.mcp.json` or `.cursor/mcp.json`: `{ "mcpServers": { "e2e": { "command": "npx", "args": ["e2e", "mcp"] } } }`; Codex `.codex/config.toml`: `[mcp_servers.e2e] command = "npx" args = ["e2e","mcp"]`. Start a new session after registering. Flags: `--config`, `--target`, `--headed`, `--max-sessions` (default 4, 1 to 16).
- **VS Code workspace format:** .vscode/mcp.json uses the top-level servers property. The old line applied portable mcpServers to that file as well; keep the formats separate. [VS Code MCP configuration](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- **Four tools:** `open_session` (loads config, starts the app command, boots the engine, returns a session id, the tool catalog and the first observation), `tools`, `call { tool, args }` (schema-checked), `close_session`. The catalog has `observe` (`#id role "name"` per line plus the path), the verbs, `type_secret`, `locate` (exactly one of `role` / `text` / `label` / `placeholder` / `testId`; returns the match count and the `screen.*` call to write), `screenshot`, the point tools, `start_recording` / `stop_recording`, and project tools (`mobileTools` adds `open_app`, `swipe`, `alert`).
- **Workflow:** open, observe, act to the screen; `locate` each locator you will write (one match: use the printed call; zero or several: adjust); write the test; run it from the shell; close. Node ids are valid only for the newest observation. An idle session closes after 30 min, and any session after 4 h.
- **Rules:** record demo and bug videos with `start_recording` / `stop_recording` (videos are not masked, so keep secrets off screen). A failed action returns the re-observed screen: re-aim from it. Nothing a session does is recorded as a test or into the cache. A shell run and a live session share the app only with `reuseExisting`; otherwise close the session first. Parallel subagents share one server, each opening its own session and passing its id. One target per device on mobile.
- **MCP error codes:** `TARGET_REQUIRED`, `UNKNOWN_TARGET`, `NO_SESSION`, `SESSION_REQUIRED`, `SESSION_OPEN`, `CONFIG_IN_USE`, `ENGINE_IN_USE`, `UNKNOWN_TOOL`, `PIXEL_TAINTED`, `INVALID_ARGUMENT`, `UNSUPPORTED_CAPABILITY`, `CONFIG_NOT_FOUND`.

## Reporting a runner problem

- **Offer feedback once per problem,** after working around it or giving up: `npx e2e feedback --type bug|docs|feature`. Never report failures of the app under test, one-off unreproducible problems, or anything on an outdated version.
- **Search existing issues first.** A `bug` needs `--repro`; without one the command prints a prefilled issue link and sends nothing. Never file the issue yourself. Run `--dry-run` first and send only with the user's agreement. Never paste app content, test files, private URLs or credentials. Give the user the reference id.

## Prove it

The fix changed the cause the trace named (the locator, the expectation or the app), not the timing, and `--repeat-each 10 --retries 0` moved the `Repeats` line from `0 of 1` to `1 of 1`.
