# Website performance test suite

This workflow performance-, load- or stress-tests a public website end to end: it elicits the user's workflows, records each one with Playwright, turns the recordings into functional protocol and browser tests that must pass first, then builds hybrid (protocol plus one browser VU) load tests per test type with SLO-backed thresholds, runs them with a load-generator monitor, and reports. Most outcomes are decided before any load runs: named workflows from the user, a clean recording that allow-lists only the target host, and green functional tests. This file covers steps 1 to 4; thresholds, load tests, the monitor, cloud runs, backend investigation and the report are in [WEBSITE-LOAD-AND-REPORT.md](WEBSITE-LOAD-AND-REPORT.md). A single browser test for one journey is [BROWSER.md](BROWSER.md).

**Contents:** [Scope and opinions](#scope-and-opinions) · [Prerequisites and tools](#prerequisites-and-tools) · [The ten steps](#the-ten-steps) · [1. Elicit workflows](#1-elicit-workflows) · [2. Scaffold](#2-scaffold) · [3. Record with Playwright](#3-record-with-playwright) · [4. Functional tests](#4-functional-tests) · [Assertion libraries](#assertion-libraries) · [Prove it](#prove-it)

The recorder, workflow templates, run-all.sh and LG-monitor sidecars named below are upstream scaffold dependencies, not files shipped in this skill. Obtain and fully read the matching upstream assets before using the scaffold commands, or report that the scaffold is unavailable; never invent their implementation. The remaining workflow and source-specific constraints are preserved below. [existing WEBSITE-PERF-TEST.md]

## Scope and opinions

- **Triggers:** "perf test my site", "performance test my site", "load test this URL", "stress test my web app", "I want to load test [URL]", "set up k6 against my website", "write a k6 suite for [site]", "see if my site handles N concurrent users", "how does my site perform under traffic", and any mention of k6, load testing, stress testing or performance testing.
- **Outputs:** a scaffolded project with one folder per workflow; functional protocol and browser tests; hybrid load tests per type (smoke, average, stress, spike, soak, breakpoint); SLO thresholds with per-endpoint tags and Web Vitals; a cross-platform load-generator (LG) monitor sidecar; optional Grafana investigation; a Markdown report.
- **Opinions not to override silently:** always elicit workflows first, don't guess. Functional tests must be green before load tests run. Always monitor the load generator: "server-looks-slow is often laptop-looks-slow". Local for validation, cloud for scale, but ask the user where each test type runs. No shared `tests/lib/`: duplicate the iteration body so each script reads cleanly during incident review.
- **Non-goals:** protocol-only suites, API-only or non-browser apps, mobile-native testing, capacity planning beyond finding and tagging a breakpoint.

## Prerequisites and tools

- **k6 v2.0.0+** (`k6 version`) is this source workflow's chosen baseline. Stable `k6/browser` and its async API arrived in v0.52.0, rather than v2.0.0 as the old prerequisite implied. Check the version of each remaining API separately. [k6 browser migration](https://grafana.com/docs/k6/latest/using-k6-browser/migrating-to-k6-v0-52/)
- **Node.js 20+ and npm; Playwright with Chromium** (`npx playwright install chromium`); **`har-to-k6`** (`npm i -D har-to-k6`); network access from the LG host to the target.
- **The scaffold's `package.json`** is named `perf-tests`, `"private": true`, pins devDependencies `"har-to-k6": "0.14.15"` and `"playwright": "1.63.0"`, and suggests `record:wN-<short-name>` scripts (`node recordings/scripts/wN-<short-name>.js`).
- **Prefer installed tools:** `mcp-k6` (script creation, Playwright to `k6/browser` migration, hydration waits and selector extraction, API lookup; prefer it over hand-written boilerplate), `mcp-grafana` (in-session Prometheus, Loki, Tempo, Pyroscope queries), `gcx` (Grafana Cloud CLI: queries, datasource discovery, cloud-run dispatch), the `k6` binary (local validation, breakpoint hunting), `k6 x docs`. Without them, use plain `k6`, `npx`, `curl` and hand-written scripts; the hand-written approach is also the specification for what `mcp-k6` output should look like. The workflow doesn't own toolchain setup.

## The ten steps

1. Elicit workflows. 2. Scaffold from the assets. 3. Record each workflow with Playwright. 4. Build functional protocol and browser tests; run `tests/run-all.sh` until green. 5. Design SLO thresholds and per-endpoint tags. 6. Build hybrid load tests, one file per type. 7. Run locally with the LG sidecar. 8. Push to Grafana Cloud k6 for the types the user chose. 9. Investigate the backend with Grafana, if the user owns it. 10. Report.

## 1. Elicit workflows

The single most important step. Ask in order, before scaffolding anything, and record the answers in `runbook.md` in the target project.

| # | Ask |
|---|---|
| Q1 Workflows | 2 to 4, each with a short name ("checkout", "admin-approve", "anon-search"), a one-sentence description, and whether it requires auth |
| Q2 Credentials | Dedicated test accounts, not real users, safe for write actions (no real payments or data deletion). No test accounts yet: pause |
| Q3 Read vs write | Per workflow |
| Q4 Destructive actions | What breaks if repeated thousands of times in a soak: payments, account creation (DB bloat, email-vendor rate limits), notifications to real users, deleting real data. Skip them in soak or substitute a dry-run endpoint |
| Q5 Worry list | The one workflow they worry about most; most threshold tuning goes there |
| Q6 Existing SLOs | Latency ("p95 < 500ms"), error rate ("< 0.1% error"), throughput ("100 req/s sustained"). Without numbers, use defaults and tune after smoke |
| Q7 Backend ownership | Grafana URL, service name and labels, which of Prometheus, Loki, Tempo, Pyroscope are configured |
| Q8 Local vs cloud | For each of the six types: `local / cloud / both / skip`. Browser VU-hours bill at 10x protocol VU-hours; soak and breakpoint are most likely to exhaust the budget |
| Q9 Target and constraints | Target URL, IP allow-lists blocking Grafana Cloud k6 LGs, rate limiters and WAFs, maintenance windows or off-peak times, CDN edge nodes to avoid |
| Q10 Sign-off | Write `runbook.md`, read it back, ask "Does this run plan look right? Anything to add or change before we scaffold?" and proceed only after explicit confirmation |

- **`runbook.md` sections:** Workflows, Credentials, Destructive actions, SLOs, Backend ownership, MCP tools planned for this project, Run matrix, Constraints. The MCP tools section names HAR to k6 conversion (`npx har-to-k6`, always), Playwright to `k6/browser` migration (`mcp-k6` if installed, else the 5-step procedure below), script authoring and validation (`mcp-k6` if installed), backend investigation (`mcp-grafana` if installed, else `gcx`). Spelling them out makes the workflow self-checking.
- **When to stop:** the overview says stop if the user can't name at least one workflow; the question script says stop if they can't or won't answer Q1 (2 to 4 workflows). Either way, don't scaffold without named workflows.

| User says | Response |
|---|---|
| "Just figure out the workflows from the website" | Decline: "Tell me the 2-4 paths your users hit most often, or the ones that worry you most." |
| "Test everything" | Decline; decompose into named workflows |
| "I'll add SLOs later" | Accept; record defaults flagged "default, pending user confirmation" |
| "Just use cloud for everything" | Confirm budget awareness (re-read the Q8 cost reminder) |
| "Just use local for everything" | Flag "local-only, results bounded by LG capacity" |

## 2. Scaffold

- **Only after obtaining the actual upstream scaffold, copy its assets:** `cp -R "<SKILL_DIR>/assets/." "<target-dir>/"`; if a sandbox blocks it, copy files one by one. If `<SKILL_DIR>` can't be determined, ask the user.
- **Layout:** `package.json`, `.gitignore`, `README.md`, `runbook.md` (you create it), `recordings/README.md`, `recordings/scripts/recorder.template.js`, `tests/run-all.sh`, `tests/workflow.template/{from-har,protocol,browser,smoke,average,stress,spike,soak,breakpoint}.js`, `tools/lg-monitor.sh`, `tools/run-with-monitor.sh`.
- **Per workflow:** copy `recorder.template.js` to `recordings/scripts/wN-<short-name>.js` and `tests/workflow.template/` to `tests/wN-<short-name>/`, then replace `<WORKFLOW_PLACEHOLDER>`:

```bash
grep -rl '<WORKFLOW_PLACEHOLDER>' tests/wN-<short-name> recordings/scripts/wN-<short-name>.js \
  | xargs sed -i.bak "s/<WORKFLOW_PLACEHOLDER>/wN-<short-name>/g" \
  && find tests/wN-<short-name> recordings/scripts -name '*.bak' -delete
```

  Then `cd <target-dir> && npm install && npx playwright install chromium`.
- **HARs are sensitive session artifacts.** Keep raw HARs private. Before any authorized sharing or publication, inspect and remove credentials, cookies, authorization headers, personal data and sensitive request or response bodies, including embedded content. The source default committed raw HARs; Playwright warns that authentication artifacts can enable impersonation. [Playwright authentication](https://playwright.dev/docs/auth)
- **Output locations:** functional logs `${TMPDIR}/k6-run-all/`; load-test logs and LG CSVs `/tmp/perf-lg-monitor/`; cloud runs in the Grafana Cloud k6 web UI. (The scaffold README says cloud run links appear in `run-all.sh` output, but `run-all.sh` only runs functional tests locally.)

## 3. Record with Playwright

- **Per workflow:** fill in the recorder (the user-action sequence, a `recordHar.urlFilter` regex that allow-lists the target host and blocks third-party RUM and ads, an authorized browser configuration); run `node recordings/scripts/wN-<short-name>.js` (writes `recordings/har/wN-<short-name>.har`); convert with `npx har-to-k6 recordings/har/wN-<short-name>.har -o tests/wN-<short-name>/from-har.js`; retain a private audit trail. Share only reviewed, sanitized artifacts within the authorized scope.
- **Respect access controls.** Do not use user-agent changes, CAPTCHA solving or bot-detection bypass to evade a block. Stop or obtain an approved access route. [Owner safety rule]
- **HAR options:**

```js
recordHar: {
  path: HAR_PATH,
  mode: 'full',
  content: 'embed',
  urlFilter: /^https?:\/\/(target-host\.example|localhost)(:\d+)?\//,
},
```

  `urlFilter` takes a regex or string; always use a regex that allow-lists only the target hosts. Third-party traffic pollutes request counts, per-endpoint thresholds and HAR size (10 to 100x bloat is common).
- **Also block at the route level:** `await context.route('**', (route) => { if (isAllowedHost(route.request().url())) return route.continue(); return route.abort(); });`. `urlFilter` filters only when the HAR is written; the browser still sends the requests. You need both: `route.abort` alone leaves `status: -1` entries that make har-to-k6 generate broken k6 code. The template's `isAllowedHost` parses `new URL(url)`, compares `u.hostname` with `'target-host.example'` or `'localhost'`, and returns false on a parse error; keep it in sync with `urlFilter`.
- **Wait for hydration:** `await page.goto(BASE_URL, { waitUntil: 'load' });` is necessary but not sufficient; then wait for a post-hydration sentinel (for example `page.locator('button[name="primary-action"]')` with `sentinel.waitFor({ state: 'visible' })`).
- **Recorder action pattern:** goto plus sentinel; a click or fill per action; `Promise.all([page.waitForResponse(...), page.click(...)])` when an action triggers a critical API call; wait for the result locator after each significant action; `page.waitForTimeout(500)` at the end so trailing requests land in the HAR before `context.close()` (Playwright writes the HAR on close). The recorder exits with `process.exit(1)` on error, runs headless by default, overwrites its HAR on re-run, and takes `BASE_URL` from env.
- **Spot a polluted HAR:** any host outside the allow-list here means adjust `urlFilter`:

```bash
jq '.log.entries | map(.request.url) | group_by(. | capture("//(?<h>[^/:]+)").h) | map({host: .[0] | capture("//(?<h>[^/:]+)").h, count: length})' recordings/har/wN-<short-name>.har
```

- **Spot missing hydration:** `k6 run --vus 1 --iterations 1 tests/wN-<short-name>/from-har.js` (`k6 run --once` on k6 v2.3+, [VERSIONS.md](VERSIONS.md)); a homepage with none of the client-JS API calls means the recorder clicked before hydration. Add a sentinel wait and re-record.
- **HAR size:** typically 300 KB to 2 MB; over 10 MB means narrow `urlFilter` (it's probably capturing CDN assets). Treat a HAR like a secret: it captures the live session (see cleanup step 4 below).
- **Re-record** when hash-named assets change paths (the protocol test failing with a 404 is the intended signal), when the API or workflow changes the request sequence, or for a fresh before/after HAR: re-run the recorder, regenerate with har-to-k6, bring the new paths into `protocol.js` by hand, run `./tests/run-all.sh`.

## 4. Functional tests

`protocol.js` and `browser.js` are single-iteration, single-VU tests with `expect()` hard assertions; both must pass through `./tests/run-all.sh` before any load test. `from-har.js` is regenerated, never hand-edited.

### protocol.js: clean up the generated script

1. **Drop the per-request `User-Agent`, `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform` headers** har-to-k6 sets, and set `options.userAgent` once: `{ vus: 1, iterations: 1, userAgent: USER_AGENT }`.
2. **Rename the opaque groups** (`page_0`, `page_1` from `_pageref`), for example `group('w1-login-then-purchase', ...)`.
3. **Parametrise the host:** `const BASE_URL = __ENV.BASE_URL || 'https://target-host.example';` and replace the absolute URLs.
4. **Replace recorded session cookies and bearer tokens** with a test token (`__ENV.TEST_TOKEN`) or a login step. Never commit recorded credentials.
5. **Drop the auto-inserted trailing `sleep(1)`.**
6. **`expect()` on every load-bearing response:** at least a status `expect()` on every `http.*` call; body-shape assertions on the payload response (`expect(res.status).toBe(200)`, `expect(data).not.toBeNull()`, `expect(typeof data.id).toBe('string')`, `expect(data.id.length).toBeGreaterThan(0)`); status on every static asset so a hash-renamed bundle fails loudly (`expect(res.status, \`asset ${path}\`).toBe(200)`).

- **Body order:** homepage shell, static assets, the onMount API fan-out, the user actions, trailing fetches (CSS background images and the like).
- **Cookies and CSRF:** response cookies are on `r.cookies`, keyed by name, each an array of records. `r.json('csrf_token')` is wrong (empty body); `r.cookies.csrf_token && r.cookies.csrf_token[0].value` is right. Send it as the header `'X-CSRF-Token': csrf`. k6 keeps a per-VU cookie jar automatically. The explicit jar option is `jar:`, not `cookies:`: `http.get(url, { cookies: jar })` silently uses the default jar; `http.get(url, { jar })` is right. Silent CSRF-missing 403s are a classic stress-day surprise.

### browser.js: convert the Playwright recorder

1. Replace `const { chromium } = require('playwright')` with `import { browser } from 'k6/browser'` and the k6-testing `expect`.
2. Replace launch and context with `browser.newPage()` and `options.scenarios.<name> = { executor: 'shared-iterations', vus: 1, iterations: 1, options: { browser: { type: 'chromium' } } }`.
3. Keep the page-interaction body verbatim (`page.goto`, `page.locator`, `page.waitForResponse` and `Promise.all` work the same), including the hydration wait.
4. Replace Playwright's `expect` with k6-testing's, a deliberate subset (`toBeVisible`, `toContainText`, `toHaveText`, `toBeEnabled` carry over).
5. Wrap it in `try / finally { await page.close(); }`.

`browser.newPage()` already starts each iteration without the previous iteration's cookies; the template's comment suggesting `newContext()` "to ensure logged-out start state" contradicts that, so use `newContext()` only for the reasons in [BROWSER.md](BROWSER.md#script-structure).

### Run them

- **All:** `./tests/run-all.sh`. It discovers `tests/w*-*/` folders containing both `protocol.js` and `browser.js`, runs protocol then browser (headless) per workflow, logs to `${TMPDIR:-/tmp}/k6-run-all/<workflow>-<kind>.log`, prints `OK` or `FAIL` with durations and a summary, and exits with the failure count (0 when no workflows are found). It uses python3 for fractional timing because macOS `date` has no `%N`.
- **One:** `k6 run tests/wN-<short-name>/protocol.js`, `K6_BROWSER_HEADLESS=true k6 run tests/wN-<short-name>/browser.js`. A non-zero exit means don't proceed.
- **Passing** means every `expect()` true, k6 printing `✓ all checks passed`, exit 0, and the browser test running headless without crashing Chromium. An "interrupted" iteration needs investigating before you call it flaky.

## Assertion libraries

- **Functional tests use `expect()`** (aborts the iteration, right for one iteration); **load tests use `check()` with `tags: { name }`** (records the `checks` rate and continues; aborting would poison many iterations).
- **Wrong imports:** `k6/x/expect` (an xk6 extension needing a custom binary; stock k6 fails at provisioning), `https://jslib.k6.io/k6chaijs/4.3.4.3/index.js` (`.to.equal()` chains; `.toBe()` TypeErrors), `@playwright/test` (doesn't exist in k6's runtime). This workflow's gotchas pin `import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';`, while the browser-test skill pins 0.6.1 ([SCRIPTS.md](SCRIPTS.md#jslib-pins)).
- **Don't mix libraries:** k6-testing `expect` with `.to.equal()` throws `TypeError: Cannot read property 'equal' of undefined or null` every iteration, k6 registers zero `checks`, and `checks: ['rate>0.99']` passes with `rate=0.00%`. k6-testing is `.toBe()`, `.toContain()`, `.toEqual()`; k6chaijs is `.to.equal()`, `.to.include()`, `.to.deep.equal()`.
- **Browser load iterations:** `import { check as asyncCheck } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js'`. Locator methods (`isVisible()`, `textContent()`) return Promises, always truthy, so a bare `check()` from `k6` passes every time. Sync protocol code uses `check()` from `k6`; async browser code uses `asyncCheck`: `await asyncCheck(result, { 'result visible': async (lo) => (await lo.isVisible()) === true });`.

## Prove it

- `runbook.md` exists with every section filled and the user's explicit sign-off on the run plan.
- The jq host count over each HAR lists only allow-listed hosts, and no HAR exceeds 10 MB.
- `protocol.js` reads `BASE_URL` and tokens from `__ENV`, has no per-request UA headers and no trailing `sleep(1)`, and asserts the status of every request.
- `./tests/run-all.sh` exits 0 with every workflow `OK` before any load test runs.
