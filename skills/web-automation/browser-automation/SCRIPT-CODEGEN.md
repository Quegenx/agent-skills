# Turning a run into a deterministic script

Once a task loop has converged, the exploration is no longer needed: generate a plain script from the successful run and replay it without an agent. [browserbase/skills, autobrowse]

**Source-workspace prerequisite:** the generator, prompt templates, scaffolds and runners described below belong to the upstream [autobrowse workspace](https://github.com/browserbase/skills/tree/main/skills/autobrowse), including [scripts/codegen.mjs](https://github.com/browserbase/skills/blob/main/skills/autobrowse/scripts/codegen.mjs) and `codegen/`. They are not shipped with this Markdown skill. Budgets, model choices and cost heuristics below are source defaults, not a newly verified price or compatibility guarantee. [browserbase/skills, autobrowse]

## The pipeline

Context (task, strategy, a CDP bridge reference, the unified events or the trace, the element descriptors) goes into a content-hash cache key, then one LLM completion, which writes `<task>.ts` and a scaffold, then an optional verify in a fresh browser session, then a rewrite on failure.

- **Generate from a successful run only:** the newest `run-NNN` whose summary contains `success: true`. An explicit `--run` must exist on disk; without a trace the model would invent a script from the task and strategy alone.
- **Cache on the content.** The key is a sha256 over a prompt template version (bump it to invalidate when the prompt or the scaffold and runner contract changes), the framework, the prompt hash, task, trace, events, descriptors and strategy. `--force` busts the cache; `--cache-only` errors on a miss and forbids rewrite calls (for CI).
- **Count attempts the same way cached or not** (both start at 1), so a cached run doesn't get an extra rewrite.
- **Budgets:** max tokens 8192, `--max-retries` default 2; inputs clipped to 32,000 bytes of events, 16,000 of descriptors, 12,000 of the previous attempt and 4,000 of a verify failure (the head 70% plus the tail). Estimate cost as `bytes / 4 * 3e-6`.
- **Scaffold without clobbering:** never overwrite user files, except `package.json`, which is merged (dependencies and dev dependencies) when two frameworks share an output folder. Pin versions through env vars guarded by `^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$`.
- **Verify within nested timeouts:** the parent's 10 min exceeds the runner's worst case (install 3 min plus run 5 min). The runner reinstalls only when the sha256 of `package.json` differs from a stamp in `node_modules`, sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (it connects over CDP, so skip hundreds of MB and the install budget), and gives each run its own `SCREENSHOT_DIR`.
- **Read the result from the end:** walk stdout backward for the last JSON with a boolean `success`. Passed means exit 0 **and** `success === true`. Runner contract: one `{"passed":bool,...}` line on stdout, exit 0 passed or 2 failed. The generator prints one JSON line per framework and exits 0 when all passed, 2 when any failed, 1 on a fatal error.

## Rules for a generated Playwright script

- **Self-contained:** needs only the browser service's API key, creates its own fresh session (create, connect, use, release).
- **Connect, never launch:** always `connectOverCDP`, never `chromium.launch()`. Get the page with `const [context] = browser.contexts(); const page = context.pages()[0] ?? await context.newPage();`.
- **Distinguish driver disconnection from cloud-session release.** Playwright closes a launched browser, but closing a CDP-connected Browser disconnects its connection; its upstream reconnect test retains the existing browser pages. The old line treated every CDP close as browser termination. Browserbase separately ends a non-keep-alive session on disconnect; keep-alive sessions survive disconnects and still require explicit release when done. Clean up only the session you own in `finally` (on Browserbase, `browse cloud sessions update <id> --status REQUEST_RELEASE`). [Playwright Browser.close](https://playwright.dev/docs/api/class-browser#browser-close); [Playwright CDP reconnect test](https://github.com/microsoft/playwright/blob/main/tests/library/chromium/connect-over-cdp.spec.ts); [Browserbase keep alive](https://docs.browserbase.com/platform/browser/long-sessions/keep-alive)
- **Locator preference:** `data-testid`, then role and name, then id, then text, then xpath. Pick locators from the recorded descriptors; don't invent them.
- **Auto-waiting actions over explicit waits:** `locator.click()` and `fill()`. Where the trace shows a slow XHR after an action, `page.waitForResponse(...)` instead of a sleep.
- **Final stdout line is JSON:** `{"success":true,"data":...}` or `{"success":false,"error":"..."}`, with a non-zero exit on failure. Validate the output with a Zod schema mirroring the task's output section.
- **Screenshots through one helper:** `snap(page, label)` is a no-op when `SCREENSHOT_DIR` is unset; names are zero-padded kebab case (`01-landing`, `08-success`, `99-error-at-<step>`); call it in the top-level catch.
- **React-controlled input whose `fill()` value is stripped on submit:**

```typescript
await locator.evaluate((el: HTMLInputElement, v: string) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  setter?.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}, value);
```

## Rules for a generated Stagehand script (v3, vendor)

- **Stagehand owns its session:** `env: "BROWSERBASE"` with the top-level `apiKey` set to the Browserbase key (the project is inferred; passing the Anthropic key there causes a 404 on session lookup). No `browserbaseSessionID`, no pre-created session. Tear down with `await stagehand.close()` in `finally`.
- **Model configuration has two readings.** The code generator uses the object form `model: { modelName: "anthropic/claude-sonnet-4-6", apiKey: ANTHROPIC_API_KEY }`. The migration guide prefers the bare `"provider/model"` string, lists `modelName` among v2 mistakes, and notes the object form still exists for passing client options. Use the string unless you need client options.
- **Page from `stagehand.context.pages()[0]`,** else a new page; call `act` and `extract` on the instance.
- **One action per `act` call** so each is retryable; turn a descriptor's accessible name into the intent ("click the Continue button").

## Prove it

The generated script, run in a fresh session, prints a final `{"success":true,...}` line that passes its Zod schema and exits 0; the verify run's screenshots show each step; a rerun with `--cache-only` hits the cache and makes no model call.
